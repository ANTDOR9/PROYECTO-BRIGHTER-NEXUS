// Mide cuánto tarda cada modelo en abrir y qué tan fluido va: visor ORIGINAL (el HTML con el modelo incrustado)
// contra el visor NUEVO en calidad alta y ligera.
//
// Uso:  npm run servir                         (en otra terminal)
//       npm run medir:modelos                  (usa modelos-entrada/ para los originales)
// Variables: URL (por defecto http://localhost:5173/), CHROME_PATH, ENTRADA (carpeta de los HTML originales),
//            TODOS=1 (incluye también los modelos que no son aptos para la licitación)
//
// Ojo: el resultado depende del equipo. En un servidor sin tarjeta gráfica (WebGL por software) los números son
// mucho peores que en una pantalla real; sirven para COMPARAR original vs nuevo, no como tiempo absoluto.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const AQUI = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.URL || 'http://localhost:5173/';
const ENTRADA = resolve(process.env.ENTRADA || join(AQUI, '..', 'modelos-entrada'));
const catalogo = JSON.parse(readFileSync(join(AQUI, '..', 'app', 'contenido', 'modelos3d', 'catalogo.json'), 'utf8'));
const lista = catalogo.modelos.filter((m) => process.env.TODOS || m.licencia.estado === 'ok');

const navegador = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});

async function medir(url) {
  const pag = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
  try {
    const t0 = Date.now();
    await pag.goto(url);
    await pag.waitForFunction(() => window.__ready === true, null, { timeout: 150000 });
    const listoMs = Date.now() - t0;
    await pag.waitForTimeout(800);
    const fps = await pag.evaluate(() => new Promise((ok) => {
      let n = 0; const t = performance.now();
      const f = () => { n++; if (performance.now() - t > 3000) ok(n / 3); else requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }));
    const memoriaMB = await pag.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize / 1e6 : null);
    return { listoMs, fps, memoriaMB };
  } catch (e) {
    return { error: e.message.split('\n')[0] };
  } finally {
    await pag.close().catch(() => {});
  }
}

const fmt = (r) => r.error ? 'ERROR' : `${(r.listoMs / 1000).toFixed(1)} s · ${r.fps.toFixed(1)} fps · ${r.memoriaMB ? r.memoriaMB.toFixed(0) + ' MB' : '—'}`;
console.log('\nModelo'.padEnd(28) + 'Original'.padEnd(26) + 'Nuevo (alta)'.padEnd(26) + 'Nuevo (ligera)');
console.log('(tiempo hasta abrir · fotogramas por segundo · memoria JS)\n');
for (const m of lista) {
  const origen = join(ENTRADA, m.origen);
  const orig = existsSync(origen) ? await medir(pathToFileURL(origen).href) : { error: 'sin original' };
  const alta = await medir(`${BASE}contenido/modelos3d/${m.id}/index.html?calidad=alta`);
  const ligera = await medir(`${BASE}contenido/modelos3d/${m.id}/index.html?calidad=ligera`);
  console.log(m.id.padEnd(28) + fmt(orig).padEnd(26) + fmt(alta).padEnd(26) + fmt(ligera));
}
await navegador.close();
