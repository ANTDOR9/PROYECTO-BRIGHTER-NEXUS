// Prueba de extremo a extremo del prototipo en un navegador real (Chromium).
// Recorre: intro, las 3 actividades con el motor de puntaje, la pizarra (ratón y dos dedos) y el visor 3D.
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

// ---------- intro ----------
await page.goto(BASE);
await page.waitForSelector('.intro');
comprobar(page.url().endsWith('#/intro'), 'al abrir la app se va a #/intro');
comprobar((await page.textContent('.intro-reserva')).includes('Espacio reservado'), 'la intro muestra el espacio reservado');
comprobar(!(await page.isVisible('.barra-superior')), 'la barra superior está oculta durante la intro');
await page.screenshot({ path: SALIDA + '/01-intro.png' });
await page.click('.intro');
await page.waitForSelector('text=¿Qué hacemos hoy?');
comprobar(page.url().endsWith('#/'), 'tocar la intro lleva al inicio');
comprobar(await page.isVisible('.barra-superior'), 'la barra superior vuelve después de la intro');
await page.reload();
await page.waitForSelector('text=¿Qué hacemos hoy?');
comprobar(!page.url().includes('intro'), 'la intro no se repite en la misma sesión');
await page.screenshot({ path: SALIDA + '/02-inicio.png' });

// ---------- matemática: completar ----------
await page.click('a.tarjeta:has(b:text-is("Matemática"))');
await page.click('a.tarjeta:has(b:text-is("Multiplicación"))');
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
comprobar(JSON.stringify(juegos) === JSON.stringify(['ciencias/vida', 'lenguaje/cuento', 'matematica/multiplicacion']), 'el progreso se guarda por juego: ' + juegos.join(', '));
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
await page.click('.chip:text-is("Matemática (geometría)")');
comprobar((await page.locator('.modelo-card').count()) === 1, 'biblioteca: filtrar por Matemática deja solo el cubo');
await page.click('.chip:text-is("Todos los temas")');
await page.fill('.bib-buscar', 'golgi');
const conGolgi = await page.locator('.modelo-card').count();
comprobar(conGolgi >= 1 && conGolgi < nTarjetas, `biblioteca: buscar "golgi" encuentra ${conGolgi} modelo(s) por el nombre de sus partes`);
await page.fill('.bib-buscar', 'zzzz');
comprobar(await page.isVisible('.bib-vacio'), 'biblioteca: sin resultados muestra un aviso');
await page.fill('.bib-buscar', '');
// los modelos de uso no comercial se ven marcados mientras se desarrolla
const noAptos = reales.filter(m => m.licencia.estado === 'excluir').length;
comprobar((await page.locator('.insignia.alerta').count()) === noAptos, `biblioteca: ${noAptos} modelo(s) de uso no comercial llevan el aviso "No apto licitación"`);

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

await browser.close();
console.log(`\n${ok} comprobaciones correctas, ${errores.length} problemas`);
errores.forEach(e => console.log(' - ' + e));
process.exit(errores.length ? 1 : 0);
