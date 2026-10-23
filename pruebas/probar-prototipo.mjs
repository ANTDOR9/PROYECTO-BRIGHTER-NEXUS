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

// ---------- visor 3D ----------
await page.goto(BASE + '#/modulo/biblioteca3d');
await page.waitForSelector('.visor-lienzo canvas', { timeout: 15000 });
await page.waitForTimeout(1200);
const pixeles = async () => page.evaluate(() => {
  const c = document.querySelector('.visor-lienzo canvas');
  const t = document.createElement('canvas'); t.width = c.width; t.height = c.height;
  const g = t.getContext('2d'); g.drawImage(c, 0, 0);
  const d = g.getImageData(0, 0, t.width, t.height).data; let k = 0;
  for (let i = 3; i < d.length; i += 4 * 53) if (d[i] > 20) k++; return k;
});
// el lienzo WebGL se lee justo tras renderizar, por eso se fuerza un render antes de copiar
const modelos = ['El corazón', 'Sistema solar', 'El cubo'];
for (let m = 0; m < modelos.length; m++) {
  await page.click(`.tarjeta.modelo:has-text("${modelos[m]}")`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SALIDA}/09-visor-${m + 1}.png` });
}
// tocar una parte: el Sol (centro del lienzo) en el sistema solar
await page.click('.tarjeta.modelo:has-text("Sistema solar")');
await page.waitForTimeout(700);
await page.click('.chip:text-is("Tierra")');
comprobar((await page.textContent('.info-nombre')) === 'Tierra', 'visor: elegir una parte con la lista muestra su nombre');
await page.screenshot({ path: SALIDA + '/10-visor-tierra.png' });
// tocar directamente en el modelo (corazón): se prueba con un clic real sobre el lienzo
await page.click('.tarjeta.modelo:has-text("El corazón")');
await page.waitForTimeout(700);
const lienzoCaja = await page.locator('.visor-lienzo canvas').boundingBox();
let nombreTocado = null;
for (const [fx, fy] of [[0.5, 0.5], [0.55, 0.55], [0.45, 0.5], [0.5, 0.62], [0.58, 0.5], [0.42, 0.42]]) {
  await page.mouse.click(lienzoCaja.x + lienzoCaja.width * fx, lienzoCaja.y + lienzoCaja.height * fy);
  const t = await page.$('.info-nombre:not(.info-ayuda)');
  if (t) { nombreTocado = await t.textContent(); break; }
}
comprobar(!!nombreTocado, 'visor: tocar el corazón directamente selecciona una parte → ' + nombreTocado);
await page.screenshot({ path: SALIDA + '/11-visor-corazon-tocado.png' });
// cubo: contadores
await page.click('.tarjeta.modelo:has-text("El cubo")');
await page.waitForTimeout(500);
await page.click('.chip:has-text("Vértices")');
comprobar((await page.textContent('.visor-info')).includes('8'), 'visor: el cubo explica los 8 vértices');
// salir libera el contexto WebGL sin errores
await page.goto(BASE + '#/');
await page.waitForTimeout(300);

await browser.close();
console.log(`\n${ok} comprobaciones correctas, ${errores.length} problemas`);
errores.forEach(e => console.log(' - ' + e));
process.exit(errores.length ? 1 : 0);
