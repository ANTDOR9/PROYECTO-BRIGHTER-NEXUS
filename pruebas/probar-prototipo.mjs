// Prueba de extremo a extremo del prototipo en un navegador real (Chromium).
// Recorre: carga y menú (con sus 4 secciones), las 3 actividades con el motor de puntaje, el quiz de ciencias
// (con su juego), la pizarra (ratón y dos dedos), la biblioteca 3D y sus visores.
//
// Uso:  npm i -D playwright && npx playwright install chromium     (una sola vez)
//       npm run servir          (en otra terminal)
//       npm run prueba:prototipo
// Variables opcionales: URL (por defecto http://localhost:5173/), CHROME_PATH (ruta de un Chromium propio).
// Las capturas quedan en pruebas/capturas/.
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const AQUI = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.URL || 'http://localhost:5173/';
const SALIDA = join(AQUI, 'capturas');
mkdirSync(SALIDA, { recursive: true });
const leer = r => JSON.parse(readFileSync(join(AQUI, '..', 'app', 'contenido', r), 'utf8'));

const errores = [];
let ok = 0;
const comprobar = (cond, msg) => { if (!cond) { errores.push('FALLA: ' + msg); console.log('FALLA ', msg); } else { ok++; console.log('ok    ', msg); } };

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  // Los argumentos de WebGL por software permiten probar el visor 3D en equipos sin tarjeta gráfica (servidores)
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', e => errores.push('pageerror: ' + e.message));
page.on('response', r => { if (r.status() >= 400) errores.push(`HTTP ${r.status()}: ${r.url()}`); });
page.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

const hash = () => page.evaluate(() => location.hash);
const estilosNexusActivos = () => page.evaluate(() => [...document.querySelectorAll('link[data-nexus]')].every(l => l.media === 'all'));
const estilosNexusApagados = () => page.evaluate(() => [...document.querySelectorAll('link[data-nexus]')].every(l => l.media === 'not all'));

// ---------- carga ----------
await page.goto(BASE);
await page.waitForSelector('.anillo');
comprobar((await hash()) === '#/intro', 'al abrir la app se va a #/intro (pantalla de carga)');
comprobar(!(await page.isVisible('.barra-superior')), 'carga: la barra superior de Nexus está oculta');
comprobar(await estilosNexusApagados(), 'carga: los estilos de Nexus se apagan mientras se ve la pantalla propia');
await page.screenshot({ path: SALIDA + '/01-carga.png' });

// ---------- menú ----------
await page.waitForSelector('.op', { timeout: 12000 });
comprobar((await hash()) === '#/', 'la carga pasa sola al menú');
await page.waitForFunction(() => document.body.classList.contains('fotos-listas'), null, { timeout: 8000 });
comprobar((await page.locator('.op').count()) === 4 && (await page.locator('a.centro').count()) === 1, 'menú: 4 botones principales y el logo al centro');
comprobar(!(await page.isVisible('.barra-superior')) && await estilosNexusApagados(), 'menú: es una pantalla propia (sin la barra ni los estilos de Nexus)');
await page.waitForTimeout(1500);
await page.screenshot({ path: SALIDA + '/02-menu.png' });
await page.reload();
await page.waitForSelector('.op');
comprobar(!(await hash()).includes('intro'), 'la carga no se repite en la misma sesión');

// cada botón abre su sección con las tarjetas que salen del registro
const SECCIONES = { aprender: ['Matemática', 'Lenguaje', 'Ciencias'], explorar: ['Biblioteca 3D', 'Mediateca'], jugar: ['Quiz', 'Juegos'], pizarra: ['Nueva clase', 'Continuar clase'] };
for (const [id, nombres] of Object.entries(SECCIONES)) {
  await page.waitForFunction(() => document.body.classList.contains('fotos-listas') && !document.body.classList.contains('zoom'));
  await page.click(`.op[data-seccion="${id}"]`);
  await page.waitForSelector(`#sec-${id}.activa .tarjeta`, { state: 'visible', timeout: 6000 });
  await page.waitForTimeout(900);
  const vistos = await page.$$eval(`#sec-${id} .tarjeta`, n => n.map(x => x.dataset.nombre));
  comprobar(JSON.stringify(vistos) === JSON.stringify(nombres), `menú · ${id}: tarjetas ${vistos.join(', ')}`);
  comprobar((await hash()) === `#/seccion/${id}`, `menú · ${id}: la dirección es #/seccion/${id}`);
  if (id === 'aprender') await page.screenshot({ path: SALIDA + '/02b-menu-aprender.png' });
  await page.click('#btnInicio');
  await page.waitForFunction(() => !document.querySelector('.seccion.activa'));
  comprobar((await hash()) === '#/', `menú · ${id}: "Inicio" vuelve al círculo`);
}

// de una sesión se vuelve a la sección donde estaba, ya abierta (también con "atrás" del navegador)
await page.waitForFunction(() => document.body.classList.contains('fotos-listas'));
await page.click('.op[data-seccion="aprender"]');
await page.waitForSelector('#sec-aprender.activa .tarjeta', { state: 'visible' });
await page.waitForTimeout(900);
await page.click('#sec-aprender .tarjeta[data-nombre="Matemática"]');
await page.waitForSelector('text=Tablas de multiplicar');
comprobar((await hash()) === '#/sesion/matematica' && await page.isVisible('.barra-superior') && await estilosNexusActivos(), 'sesión: vuelven la barra y los estilos de Nexus');
await page.screenshot({ path: SALIDA + '/02c-sesion.png' });
await page.goBack();
await page.waitForSelector('#sec-aprender.activa .tarjeta', { state: 'visible', timeout: 6000 });
comprobar((await hash()) === '#/seccion/aprender' && await page.evaluate(() => document.body.classList.contains('zoom')), 'atrás del navegador vuelve a Aprender, ya abierto');
comprobar(await estilosNexusApagados(), 'menú: al volver se apagan otra vez los estilos de Nexus');
await page.goto(BASE + '#/sesion/matematica');
await page.click('a:text("← Aprender")');
await page.waitForSelector('#sec-aprender.activa .tarjeta', { state: 'visible', timeout: 6000 });
comprobar((await hash()) === '#/seccion/aprender', 'sesión: "← Aprender" vuelve a la sección Aprender');

// ---------- matemática: completar ----------
await page.goto(BASE + '#/sesion/matematica');
await page.click('a.tarjeta:has(b:text-is("Tablas de multiplicar"))');
const mat = leer('matematica/multiplicacion-completar.json');
for (let i = 0; i < mat.ejercicios.length; i++) {
  const ej = mat.ejercicios[i];
  await page.waitForSelector(`text=Ejercicio ${i + 1} de ${mat.ejercicios.length}`);
  if (i === 0) {
    // un error a propósito: poner una ficha equivocada
    const mala = ej.banco.find(b => !ej.huecos.includes(b));
    await page.click(`.ficha:text-is("${mala}")`);
    await page.click('text=Comprobar');
    await page.waitForSelector('.hueco.mal');
    comprobar(true, 'completar marca en rojo una respuesta equivocada');
    await page.waitForFunction(() => document.querySelectorAll('.hueco.lleno').length === 0);
  }
  for (const h of ej.huecos) await page.click(`.ficha:text-is("${h}"):not([disabled])`);
  await page.click('text=Comprobar');
  await page.waitForSelector('.ronda-pie .estrellas');
  if (i === 0) await page.screenshot({ path: SALIDA + '/03-completar.png' });
  await page.click(i === mat.ejercicios.length - 1 ? 'text=Ver resultado' : 'text=Siguiente');
}
await page.waitForSelector('text=Resultado de la ronda');
let res = await page.textContent('.resumen-estrellas');
comprobar(/17 de 18/.test(res.replace(/\s+/g, ' ')), `matemática: 17 de 18 estrellas (un error en el primero) → "${res.trim()}"`);
await page.screenshot({ path: SALIDA + '/04-resumen.png' });

// ---------- lenguaje: ordenar ----------
await page.goto(BASE + '#/juego/lenguaje/cuento');
const len = leer('lenguaje/cuento-ordenar.json');
for (let i = 0; i < len.ejercicios.length; i++) {
  await page.waitForSelector(`text=Ejercicio ${i + 1} de ${len.ejercicios.length}`);
  for (const frase of len.ejercicios[i].items) await page.click(`.ficha.tarjeta:text-is("${frase}")`);
  if (i === 0) await page.screenshot({ path: SALIDA + '/05-ordenar.png' });
  await page.click('text=Comprobar');
  await page.waitForSelector('.ronda-pie .estrellas');
  await page.click(i === len.ejercicios.length - 1 ? 'text=Ver resultado' : 'text=Siguiente');
}
await page.waitForSelector('text=Resultado de la ronda');
res = (await page.textContent('.resumen-estrellas')).replace(/\s+/g, ' ');
comprobar(/9 de 9/.test(res), `lenguaje: 9 de 9 estrellas → "${res.trim()}"`);

// ---------- ordenar: se llega a la respuesta revelada tras 4 errores ----------
await page.click('text=Jugar otra vez');
await page.waitForSelector('text=Ejercicio 1 de 3');
const it = len.ejercicios[0].items;
for (let intento = 0; intento < 4; intento++) {
  // con las tarjetas que quedan, se ponen en el orden contrario al correcto (siempre falla)
  const visibles = await page.$$eval('.ficha.tarjeta:not([hidden])', n => n.map(x => x.textContent));
  visibles.sort((a, b) => it.indexOf(b) - it.indexOf(a));
  for (const frase of visibles) await page.click(`.ficha.tarjeta:text-is("${frase}"):not([hidden])`);
  await page.click('text=Comprobar');
  // mientras no se revele, las tarjetas equivocadas se devuelven al banco tras una pausa
  if (intento < 3) await page.waitForFunction(() => document.querySelectorAll('.lugar.mal').length === 0 && document.querySelectorAll('.ficha.tarjeta:not([hidden])').length > 0, null, { timeout: 5000 });
}
await page.waitForSelector('.ronda-pie .estrellas');
const estrellasRev = await page.$$eval('.ronda-pie .estrellas .on', n => n.length);
comprobar(estrellasRev === 1, `ordenar: tras 4 errores se muestra la respuesta y vale 1 estrella (${estrellasRev})`);

// ---------- ciencias: elegir ----------
await page.goto(BASE + '#/juego/ciencias/vida');
const cie = leer('ciencias/celula-elegir.json');
for (let i = 0; i < cie.ejercicios.length; i++) {
  const ej = cie.ejercicios[i];
  await page.waitForSelector(`text=Ejercicio ${i + 1} de ${cie.ejercicios.length}`);
  await page.click(`.opcion:text-is("${ej.opciones[ej.correcta]}")`);
  await page.waitForSelector('.ronda-pie .estrellas');
  if (i === 0) await page.screenshot({ path: SALIDA + '/06-elegir.png' });
  await page.click(i === cie.ejercicios.length - 1 ? 'text=Ver resultado' : 'text=Siguiente');
}
await page.waitForSelector('text=Resultado de la ronda');
res = (await page.textContent('.resumen-estrellas')).replace(/\s+/g, ' ');
comprobar(/15 de 15/.test(res), `ciencias: 15 de 15 estrellas → "${res.trim()}"`);

// ---------- el progreso quedó guardado por juego ----------
const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('brighterNexus.v1')));
const juegos = Object.keys(guardado.alumnos[0].juegos).sort();
comprobar(JSON.stringify(juegos) === JSON.stringify(['ciencias/vida', 'lenguaje/cuento', 'matematica/tablas']), 'el progreso se guarda por juego: ' + juegos.join(', '));
comprobar(!!guardado.alumnos[0].medallas.primera && !!guardado.alumnos[0].medallas.ronda_perfecta, 'se ganaron las medallas "primera" y "ronda_perfecta"');

// ---------- pizarra ----------
await page.goto(BASE + '#/modulo/pizarra');
await page.waitForSelector('.lienzo canvas');
await page.waitForTimeout(300);
const caja = await page.locator('.lienzo canvas').boundingBox();
const cx = caja.x, cy = caja.y;
await page.mouse.move(cx + 200, cy + 150); await page.mouse.down();
for (let k = 0; k <= 30; k++) await page.mouse.move(cx + 200 + k * 12, cy + 150 + Math.sin(k / 3) * 60);
await page.mouse.up();
await page.click('.herr:has(small:text-is("Círculo"))');
await page.mouse.move(cx + 700, cy + 300); await page.mouse.down(); await page.mouse.move(cx + 800, cy + 360, { steps: 6 }); await page.mouse.up();
await page.click('.muestra:nth-child(3)');
await page.click('.herr:has(small:text-is("Rectángulo"))');
await page.mouse.move(cx + 400, cy + 400); await page.mouse.down(); await page.mouse.move(cx + 640, cy + 520, { steps: 6 }); await page.mouse.up();
await page.waitForTimeout(200);
let n = await page.evaluate(() => JSON.parse(localStorage.getItem('brighterNexus.pizarra.v1')).trazos.length);
comprobar(n === 3, `pizarra: 3 trazos guardados (${n})`);
await page.screenshot({ path: SALIDA + '/07-pizarra.png' });
// los píxeles realmente se dibujaron
const pintado = await page.evaluate(() => {
  const c = document.querySelector('.lienzo canvas'); const g = c.getContext('2d');
  const d = g.getImageData(0, 0, c.width, c.height).data; let distintos = 0; const fondo = [d[0], d[1], d[2]];
  for (let i = 0; i < d.length; i += 4 * 97) if (d[i] !== fondo[0] || d[i + 1] !== fondo[1] || d[i + 2] !== fondo[2]) distintos++;
  return distintos;
});
comprobar(pintado > 20, `pizarra: el canvas tiene píxeles dibujados (${pintado})`);
await page.click('.herr:has(small:text-is("Deshacer"))');
n = await page.evaluate(() => JSON.parse(localStorage.getItem('brighterNexus.pizarra.v1')).trazos.length);
comprobar(n === 2, 'pizarra: deshacer quita un trazo');
await page.click('.herr:has(small:text-is("Rehacer"))');
n = await page.evaluate(() => JSON.parse(localStorage.getItem('brighterNexus.pizarra.v1')).trazos.length);
comprobar(n === 3, 'pizarra: rehacer lo devuelve');
// multitáctil: dos dedos a la vez, cada uno dibuja su trazo
const cdp = await ctx.newCDPSession(page);
const toque = (tipo, puntos) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: puntos });
await page.click('.herr:has(small:text-is("Lápiz"))');
await toque('touchStart', [{ x: cx + 900, y: cy + 100, id: 1 }, { x: cx + 1100, y: cy + 100, id: 2 }]);
for (let k = 1; k <= 8; k++) await toque('touchMove', [{ x: cx + 900 + k * 10, y: cy + 100 + k * 25, id: 1 }, { x: cx + 1100 - k * 10, y: cy + 100 + k * 25, id: 2 }]);
await toque('touchEnd', []);
await page.waitForTimeout(200);
n = await page.evaluate(() => JSON.parse(localStorage.getItem('brighterNexus.pizarra.v1')).trazos.length);
comprobar(n === 5, `pizarra: dos dedos a la vez dibujan 2 trazos (${n})`);
// la clase se restaura al volver
await page.goto(BASE + '#/'); await page.goto(BASE + '#/modulo/pizarra');
await page.waitForSelector('.lienzo canvas'); await page.waitForTimeout(300);
const restaurado = await page.evaluate(() => {
  const c = document.querySelector('.lienzo canvas'); const g = c.getContext('2d');
  const d = g.getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] > 200) k++; return k;
});
comprobar(restaurado > 5, 'pizarra: la clase guardada se restaura al volver');
await page.click('.herr:has(small:text-is("Fondo"))');
await page.screenshot({ path: SALIDA + '/08-pizarra-blanca.png' });
await page.click('.herr:has(small:text-is("Borrar todo"))');
comprobar((await page.textContent('.herr.peligro small')) === '¿Seguro?', 'pizarra: "Borrar todo" pide confirmación');
await page.click('.herr.peligro');
n = await page.evaluate(() => JSON.parse(localStorage.getItem('brighterNexus.pizarra.v1')).trazos.length);
comprobar(n === 0, 'pizarra: segundo toque borra todo');
const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('.herr:has(small:text-is("Guardar imagen"))')]);
comprobar(/^pizarra-\d{4}-\d{2}-\d{2}-\d{4}\.png$/.test(descarga.suggestedFilename()), 'pizarra: guardar imagen descarga ' + descarga.suggestedFilename());

// ---------- pizarra: "Nueva clase" (la clase en curso solo se borra si la persona lo confirma) ----------
await page.goto(BASE + '#/modulo/pizarra');
await page.waitForSelector('.lienzo canvas'); await page.waitForTimeout(300);
await page.click('.herr:has(small:text-is("Lápiz"))');
const caja2 = await page.locator('.lienzo canvas').boundingBox();
await page.mouse.move(caja2.x + 300, caja2.y + 200); await page.mouse.down(); await page.mouse.move(caja2.x + 500, caja2.y + 260, { steps: 6 }); await page.mouse.up();
await page.waitForTimeout(200);
const trazosGuardados = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('brighterNexus.pizarra.v1')).trazos.length; } catch (e) { return 0; } });
comprobar((await trazosGuardados()) === 1, 'pizarra: hay una clase guardada con 1 trazo');
await page.goto(BASE + '#/pizarra/nueva');
await page.waitForSelector('[role="alertdialog"]');
comprobar(await page.isVisible('text=¿Empezar una clase nueva?'), 'pizarra · nueva clase: con una clase guardada, pregunta antes de borrarla');
await page.click('button:text-is("Continuar la guardada")');
await page.waitForSelector('.lienzo canvas');
comprobar((await hash()) === '#/modulo/pizarra' && (await trazosGuardados()) === 1, 'pizarra · nueva clase: "Continuar la guardada" conserva el trazo');
await page.goto(BASE + '#/pizarra/nueva');
await page.waitForSelector('[role="alertdialog"]');
await page.click('button:text-is("Empezar nueva")');
await page.waitForSelector('.lienzo canvas');
comprobar((await trazosGuardados()) === 0, 'pizarra · nueva clase: "Empezar nueva" deja la pizarra en blanco');
await page.goto(BASE + '#/pizarra/nueva');
await page.waitForSelector('.lienzo canvas');
comprobar((await hash()) === '#/modulo/pizarra', 'pizarra · nueva clase: sin clase guardada abre la pizarra directo');

// ---------- quiz de ciencias ----------
const { default: seresVivos } = await import('../app/quiz/temas/ciencias/seres-vivos.js');
const perfilDelQuiz = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('brighterNexus.v1')); return d.alumnos[0].juegos['ciencias/quiz-seres-vivos'] || null; });
// se llega desde Jugar → Quiz
await page.goto(BASE + '#/seccion/jugar');
await page.waitForSelector('#sec-jugar.activa .tarjeta', { state: 'visible' });
await page.waitForTimeout(900);
comprobar((await page.locator('#sec-jugar .tarjeta[data-nombre="Juegos"] .etiqueta').textContent()) === 'Pronto', 'jugar: "Juegos" está marcado como Pronto');
await page.click('#sec-jugar .tarjeta[data-nombre="Quiz"]');
await page.waitForSelector('.panel', { timeout: 20000 });
await page.waitForFunction(() => location.hash === '#/quiz/conejo?tema=seres-vivos', null, { timeout: 30000 });
comprobar(true, 'quiz: Jugar → Quiz abre #/quiz/conejo?tema=seres-vivos (juego y tema recordados)');
comprobar(!(await page.isVisible('.barra-superior')) && await estilosNexusApagados(), 'quiz: es una pantalla propia (sin la barra ni los estilos de Nexus)');
await page.waitForFunction(() => document.querySelector('.juego-area canvas') && document.querySelector('.juego-aviso').hidden, null, { timeout: 30000 });
comprobar(true, 'quiz: el juego del conejo se monta de fondo (three.js local)');
await page.screenshot({ path: SALIDA + '/12-quiz-conejo.png' });
// cambiar de juego o de tema no recarga la pantalla
await page.evaluate(() => { document.querySelector('.panel').dataset.mismo = '1'; });
await page.click('.opc.power');
await page.waitForFunction(() => location.hash === '#/quiz/ninguno?tema=seres-vivos');
comprobar(await page.evaluate(() => document.body.classList.contains('sin-juego') && document.querySelector('.panel').dataset.mismo === '1'), 'quiz: apagar el juego cambia la dirección sin recargar la pantalla');
await page.waitForSelector('.chispa-btn');
await page.screenshot({ path: SALIDA + '/13-quiz-sin-juego.png' });
// partida completa sin errores = 3 estrellas
await page.click('.chispa-btn');
for (let i = 0; i < seresVivos.preguntas.length; i++) {
  await page.waitForSelector('.opcion');
  const enunciado = (await page.textContent('.pregunta')).trim();
  const p = seresVivos.preguntas.find(x => x.pregunta === enunciado);
  await page.click(`.opcion:has(.texto:text-is("${p.opciones[p.correcta]}"))`);
  await page.waitForSelector('.respuesta.ok');
  if (i === 0) comprobar(await page.isVisible('.respuesta.ok strong'), 'quiz: al acertar se explica por qué');
  await page.click('.sig .chispa-btn:not([disabled])');
}
await page.waitForSelector('.estrellas .gana');
const estrellasQuiz = await page.locator('.estrellas .gana').count();
comprobar(estrellasQuiz === 3, `quiz: diez aciertos dan 3 estrellas (${estrellasQuiz})`);
await page.screenshot({ path: SALIDA + '/14-quiz-resultado.png' });
const pq = await perfilDelQuiz();
comprobar(!!pq && pq.estrellas === 3 && pq.rondas === 1 && pq.contadores.ejercicios === 1 && pq.mejor > 0, 'quiz: la partida suma al perfil del alumno (ciencias/quiz-seres-vivos)');
// un error baja una vida y se queda en el resumen de repaso
await page.click('button:text-is("Jugar otra vez"), .chispa-btn:has-text("Jugar otra vez")');
await page.waitForSelector('.opcion');
{
  const enunciado = (await page.textContent('.pregunta')).trim();
  const p = seresVivos.preguntas.find(x => x.pregunta === enunciado);
  const mala = p.opciones.find((_, i) => i !== p.correcta);
  await page.click(`.opcion:has(.texto:text-is("${mala}"))`);
  await page.waitForSelector('.respuesta.mal');
  const vidas = (await page.textContent('.num-vidas')).trim();
  comprobar(vidas === '2', `quiz: un error cuesta una vida (quedan ${vidas})`);
}
// salir en plena partida: pregunta; "Seguir jugando" se queda; "Salir" vuelve al menú
await page.click('#btnInicio');
await page.waitForSelector('dialog[open]');
comprobar(await page.isVisible('text=¿Salir de la partida?'), 'quiz: salir en plena partida pide confirmación');
await page.click('dialog[open] button:text-is("Seguir jugando")');
await page.waitForFunction(() => !document.querySelector('dialog[open]'));
await page.waitForFunction(() => location.hash === '#/quiz/ninguno?tema=seres-vivos', null, { timeout: 3000 }).catch(() => {});
comprobar((await hash()) === '#/quiz/ninguno?tema=seres-vivos' && (await page.locator('.panel').count()) === 1, `quiz: "Seguir jugando" se queda en la partida y la dirección se corrige (${await hash()})`);
await page.click('#btnInicio');
await page.waitForSelector('dialog[open]');
await page.click('dialog[open] button:text-is("Salir")');
await page.waitForSelector('.op');
comprobar((await hash()) === '#/' && (await page.locator('.panel, dialog').count()) === 0 && !(await page.evaluate(() => document.body.classList.contains('sin-juego'))), 'quiz: "Salir" vuelve al menú y deja todo limpio');
comprobar((await page.locator('.consejero .ave').count()) === 0, 'quiz: el consejero del quiz se retira al salir');
// también está dentro de la sesión de Ciencias, con los estilos de Nexus
await page.goto(BASE + '#/sesion/ciencias');
await page.waitForSelector('a.tarjeta:has(b:text-is("Quiz de ciencias"))');
comprobar(await estilosNexusActivos() && await page.isVisible('.barra-superior'), 'ciencias: la sesión vuelve a verse con los estilos de Nexus');
await page.click('a.tarjeta:has(b:text-is("Quiz de ciencias"))');
await page.waitForSelector('.panel', { timeout: 20000 });
comprobar((await hash()).startsWith('#/quiz'), 'ciencias: la tarjeta "Quiz de ciencias" abre el quiz');
await page.click('#btnInicio');                 // sin partida en curso: sale sin preguntar
await page.waitForSelector('.op');
comprobar((await hash()) === '#/', 'quiz: sin partida en curso, "Inicio" sale directo');

// ---------- biblioteca 3D: catálogo ----------
await page.goto(BASE + '#/modulo/biblioteca3d');
await page.waitForSelector('.modelo-card', { timeout: 15000 });
await page.waitForTimeout(600);
const cat = await (await page.request.get(BASE + 'contenido/modelos3d/catalogo.json')).json();
const reales = cat.modelos;
const nTarjetas = await page.locator('.modelo-card').count();
comprobar(nTarjetas >= reales.length, `biblioteca: el catálogo muestra ${nTarjetas} tarjetas (${reales.length} modelos descargados + los armados en código)`);
await page.screenshot({ path: SALIDA + '/09-biblioteca-catalogo.png' });
// cada modelo con miniatura la muestra de verdad (no una imagen rota)
const conMini = reales.filter(m => m.archivos.miniatura).length;
const imgOk = await page.evaluate(() => [...document.querySelectorAll('.mc-foto img')].filter(i => i.complete && i.naturalWidth > 0).length);
comprobar(imgOk === conMini, `biblioteca: ${imgOk} de ${conMini} miniaturas cargan bien`);
// los que no tienen miniatura usan el ícono de su tema (el catálogo nunca queda "vacío")
const sinMini = await page.locator('.mc-foto .mc-icono').count();
comprobar(sinMini === nTarjetas - conMini, `biblioteca: ${sinMini} tarjetas sin foto muestran un ícono de respaldo`);
// filtros y búsqueda
await page.click('.chip:text-is("Matemática")');
comprobar((await page.locator('.modelo-card').count()) === 1, 'biblioteca: filtrar por Matemática deja solo el cubo');
await page.click('.chip:text-is("Todos")');
await page.fill('.bib-buscar', 'golgi');
const conGolgi = await page.locator('.modelo-card').count();
comprobar(conGolgi >= 1 && conGolgi < nTarjetas, `biblioteca: buscar "golgi" encuentra ${conGolgi} modelo(s) por el nombre de sus partes`);
await page.fill('.bib-buscar', 'zzzz');
comprobar(await page.isVisible('.bib-vacio'), 'biblioteca: sin resultados muestra un aviso');
await page.fill('.bib-buscar', '');
// el catálogo es limpio: sin etiquetas de nivel ni avisos de licencia que confundan a quien enseña
comprobar((await page.locator('.insignia').count()) === 0, 'biblioteca: las tarjetas no llevan etiquetas de nivel ni de licencia');
comprobar((await page.locator('.chip:text-is("Primaria"), .chip:text-is("Secundaria")').count()) === 0, 'biblioteca: no hay botones de Primaria/Secundaria');
comprobar(!(await page.locator('.bib-ajustes').evaluate(d => d.open)), 'biblioteca: los ajustes de rendimiento están recogidos por defecto');

// ---------- integridad de los archivos de cada modelo ----------
for (const m of reales) {
  const glb = await page.request.get(BASE + 'contenido/modelos3d/' + m.archivos.glb);
  const lig = await page.request.get(BASE + 'contenido/modelos3d/' + m.archivos.glbLigero);
  const cab = (await glb.body()).subarray(0, 4).toString();
  comprobar(glb.ok() && lig.ok() && cab === 'glTF', `modelo ${m.id}: modelo.glb y modelo-ligero.glb existen y son GLB válidos`);
  comprobar((await lig.body()).length < (await glb.body()).length, `modelo ${m.id}: la versión ligera pesa menos que la normal`);
  comprobar(m.licencia.estado !== 'excluir' || m.licencia.comercial === false || m.licencia.modificable === false, `modelo ${m.id}: la clasificación de licencia es coherente`);
}

// ---------- visor de un modelo descargado (marco a pantalla completa) ----------
const prueba = reales.find(m => m.licencia.estado === 'ok' && m.partes.length > 3) || reales[0];
await page.goto(BASE + '#/biblioteca3d/ver/' + prueba.id);
await page.waitForSelector('iframe.visor3d-marco', { timeout: 15000 });
await page.waitForFunction(() => document.querySelector('iframe') && document.querySelector('iframe').contentWindow.__ready === true, null, { timeout: 120000 });
await page.waitForTimeout(1200);
comprobar(await page.evaluate(() => document.body.classList.contains('en-visor3d')), 'visor 3D: la barra de Nexus se oculta mientras se ve el modelo');
const marcoVisor = page.frames().find(f => f !== page.mainFrame() && f.url().includes('/modelos3d/'));
comprobar(!!marcoVisor && (await marcoVisor.locator('#left .row').count()) === prueba.partes.length, `visor 3D: ${prueba.titulo} lista sus ${prueba.partes.length} partes`);
await page.screenshot({ path: SALIDA + '/10-visor-modelo.png' });
// la interfaz del visor no queda tapada por el botón de Nexus
const rVolver = await page.locator('.visor3d-volver').boundingBox();
const rTitulo = await marcoVisor.locator('#head').boundingBox();
const rBotones = await marcoVisor.locator('#top').boundingBox();
const choca = (a, b) => a && b && a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
comprobar(!choca(rVolver, rTitulo) && !choca(rVolver, rBotones), 'visor 3D: el botón "← Biblioteca" no tapa el título ni los botones del visor');
// tocar una parte de la lista cambia el panel de información
await marcoVisor.locator('#left .row').nth(1).click();
await page.waitForTimeout(500);
const nombreParte = await marcoVisor.locator('#left .row').nth(1).textContent();
comprobar((await marcoVisor.locator('#it').textContent()).trim() === nombreParte.trim(), 'visor 3D: elegir una parte muestra su información');
// volver libera el visor (si quedara vivo, seguiría gastando memoria de video)
await page.click('.visor3d-volver');
await page.waitForSelector('.modelo-card');
comprobar((await page.locator('iframe').count()) === 0, 'visor 3D: al volver, el marco del modelo se elimina');
comprobar(!(await page.evaluate(() => document.body.classList.contains('en-visor3d'))), 'visor 3D: al volver, la barra de Nexus reaparece');
// las dos calidades abren
for (const q of ['ligera', 'alta']) {
  await page.evaluate(v => localStorage.setItem('brighterNexus.calidad3d', v), q);
  await page.goto(BASE + '#/modulo/biblioteca3d');            // pasar por el catálogo: así no se confunde con el marco anterior
  await page.waitForSelector('.modelo-card');
  await page.goto(BASE + '#/biblioteca3d/ver/' + prueba.id);
  await page.waitForFunction(() => document.querySelector('iframe') && document.querySelector('iframe').contentWindow.__ready === true, null, { timeout: 120000 });
  const usado = await page.evaluate(() => document.querySelector('iframe').contentWindow.__PR__);
  comprobar(usado === (q === 'ligera' ? 1.5 : 2), `visor 3D: calidad "${q}" aplicada (densidad de píxeles ${usado})`);
}
await page.evaluate(() => localStorage.removeItem('brighterNexus.calidad3d'));

// ---------- créditos ----------
await page.goto(BASE + '#/biblioteca3d/creditos');
await page.waitForSelector('.credito');
const nCred = await page.locator('.credito').count();
comprobar(nCred === reales.length + 1, `créditos: aparece cada modelo (${reales.length}) y la sección de programas`);
const textoCred = await page.textContent('.creditos-lista');
comprobar(reales.every(m => textoCred.includes(m.credito.autor)), 'créditos: se nombra al autor de cada modelo');
comprobar(reales.every(m => textoCred.includes(m.licencia.texto.slice(0, 12))), 'créditos: se indica la licencia de cada modelo');
const noAptos = reales.filter(m => m.licencia.estado === 'excluir').length;
comprobar((await page.locator('.insignia.alerta').count()) === noAptos, `créditos: ${noAptos} modelo(s) de uso no comercial llevan el aviso "No apto licitación" (solo aquí)`);

// ---------- modelos armados en código ----------
await page.goto(BASE + '#/biblioteca3d/ver/sistema-solar');
await page.waitForSelector('.visor-lienzo canvas', { timeout: 15000 });
await page.waitForTimeout(1200);
await page.click('.chip:text-is("Tierra")');
comprobar((await page.textContent('.info-nombre')) === 'Tierra', 'visor en código: elegir una parte con la lista muestra su nombre');
await page.screenshot({ path: SALIDA + '/11-visor-tierra.png' });
await page.goto(BASE + '#/biblioteca3d/ver/cubo');
await page.waitForSelector('.visor-lienzo canvas');
await page.waitForTimeout(500);
await page.click('.chip:has-text("Vértices")');
comprobar((await page.textContent('.visor-info')).includes('8'), 'visor en código: el cubo explica los 8 vértices');
// un modelo que no existe vuelve al catálogo
await page.goto(BASE + '#/biblioteca3d/ver/no-existe');
await page.waitForSelector('.modelo-card');
comprobar(true, 'biblioteca: un modelo que no existe devuelve al catálogo');
await page.goto(BASE + '#/');
await page.waitForTimeout(300);

// ---- Divisiones (juego de nasa-cell dentro de un marco, con su estética) ----
await page.goto(BASE + '#/sesion/matematica');
await page.waitForTimeout(400);
comprobar(await page.locator('a[href="#/juego/matematica/divisiones"]').count() > 0, 'divisiones: aparece en la sesión de Matemática');
await page.goto(BASE + '#/juego/matematica/divisiones');
await page.waitForSelector('iframe.marco-juego');
const marcoDiv = page.frame({ url: /divisiones\/juego\/index\.html/ });
await marcoDiv.waitForSelector('#nombre', { timeout: 15000 });
comprobar(true, 'divisiones: el juego abre dentro del marco');
comprobar(await page.evaluate(() => getComputedStyle(document.querySelector('.barra-superior')).display) === 'none', 'divisiones: la barra de Nexus se oculta');
await marcoDiv.fill('#nombre', 'Ana');
await marcoDiv.click('text=Empezar');
await marcoDiv.waitForSelector('text=Jugar sin reloj');
comprobar(true, 'divisiones: crear alumno lleva a los niveles (Fácil, Medio, Difícil…)');
comprobar((await marcoDiv.evaluate(() => getComputedStyle(document.body).fontFamily)).includes('Nunito'), 'divisiones: conserva su propia tipografía');
await page.click('.visor3d-volver');
await page.waitForTimeout(400);
comprobar((await hash()) === '#/sesion/matematica', 'divisiones: "← Matemática" vuelve a la sesión');
comprobar(await page.locator('iframe').count() === 0 && !(await page.evaluate(() => document.body.classList.contains('en-visor3d'))), 'divisiones: al salir, el marco se elimina y la barra vuelve');

// ---- Multiplicación en columnas (plantilla "columnas") con el color propio del tema ----
await page.goto(BASE + '#/sesion/matematica');
await page.waitForSelector('.tarjeta');
const colores = await page.$$eval('a.tarjeta', as => as.map(a => a.style.getPropertyValue('--c').trim().toUpperCase()));
comprobar(new Set(colores.filter(c => c !== '#FF8A3D')).size === colores.filter(c => c !== '#FF8A3D').length && colores.length >= 6, 'matemática: cada tema (menos las dos de multiplicación) tiene un color distinto');
await page.goto(BASE + '#/juego/matematica/multiplicacion');
await page.waitForSelector('.col-rejilla');
comprobar((await page.evaluate(() => getComputedStyle(document.querySelector('.pantalla')).getPropertyValue('--acento').trim().toUpperCase())) === '#FF8A3D', 'columnas: la pantalla usa el color naranja del tema');
async function resolverColumnas() {
  for (let i = 0; i < 30; i++) {
    const q = await page.textContent('.col-pregunta');
    const m = q.match(/^(\d+) × (\d+)(?: \+ (\d+))? .*= \?$/);
    let r;
    if (m) r = Number(m[1]) * Number(m[2]) + Number(m[3] || 0);
    else {
      const t = q.match(/Suma la columna: ([\d + ]+?)(?: \+ (\d+) \(lo que llevas\))? = \?/);
      if (!t) break;
      r = t[1].split('+').reduce((a, v) => a + Number(v), 0) + Number(t[2] || 0);
    }
    for (const c of String(r)) await page.keyboard.press(c);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
}
// un error primero: no avanza y no cuenta como acierto limpio
await page.keyboard.press('9'); await page.keyboard.press('9'); await page.keyboard.press('9'); await page.keyboard.press('Enter');
await page.waitForTimeout(900);
comprobar((await page.textContent('.mensaje')).includes('Inténtalo'), 'columnas: una respuesta mala avisa y deja intentar otra vez');
await resolverColumnas();
comprobar((await page.textContent('.col-pregunta')).includes('14 × 3 = 42'), 'columnas: al resolver cada casilla aparece el resultado (14 × 3 = 42)');
comprobar((await page.textContent('.ronda-pie .estrellas')).includes('★★'), 'columnas: con un error da estrellas (2)');
await page.click('.ronda-pie .boton');
for (let k = 0; k < 11; k++) { await resolverColumnas(); await page.click('.ronda-pie .boton'); await page.waitForTimeout(60); }
await page.waitForSelector('.col-rejilla');
await resolverColumnas();
comprobar((await page.textContent('.ronda-cab span')).includes('13 de 13') && (await page.textContent('.col-pregunta')).includes('67 × 42 = 2814'), 'columnas: el último ejercicio, con multiplicador de dos cifras, suma bien las filas (67 × 42 = 2814)');
await page.click('.ronda-pie .boton');
await page.waitForSelector('.resumen-estrellas');
comprobar(true, 'columnas: al terminar muestra el resultado de la ronda');

await browser.close();
console.log(`\n${ok} comprobaciones correctas, ${errores.length} problemas`);
errores.forEach(e => console.log(' - ' + e));
process.exit(errores.length ? 1 : 0);
