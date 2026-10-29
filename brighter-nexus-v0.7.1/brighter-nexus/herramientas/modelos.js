// Proceso de modelos 3D de Brighter Nexus.
//
//   npm run modelos                       procesa la carpeta  modelos-entrada/
//   npm run modelos -- "C:\ruta\MODELOS 3D"   procesa otra carpeta
//   npm run modelos:licitacion            igual, pero deja SOLO los modelos de uso comercial
//
// Opciones:  --forzar (rehace todo)  ·  --sin-miniaturas  ·  --licitacion
//
// Qué hace con cada visor .html que le des:
//   1. Saca el modelo (GLB) y la configuración que vienen metidos dentro del HTML.
//   2. Lee los créditos y clasifica la licencia (ok / revisar / excluir).
//   3. Detecta duplicados por contenido (aunque el archivo se llame distinto).
//   4. Comprime el modelo: versión normal y versión ligera (para equipos modestos).
//   5. Reescribe el visor para que cargue el modelo como archivo, no como texto base64.
//   6. Genera una miniatura transparente (necesita playwright; si no hay, la omite).
//   7. Actualiza app/contenido/modelos3d/catalogo.json (lo que lee la Biblioteca 3D).
//
// Lo que tú curas a mano (nivel, dimensión, orden) vive en modelos3d/metadatos.json y nunca se pisa.

import { readFile, writeFile, mkdir, readdir, rm, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { join, dirname, basename, extname, resolve, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(RAIZ, 'app');
const DESTINO = join(APP, 'contenido', 'modelos3d');
const VISORES = join(DESTINO, '_visores');
const ARCHIVO_CATALOGO = join(DESTINO, 'catalogo.json');
const ARCHIVO_META = join(DESTINO, 'metadatos.json');

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const ENTRADA = resolve(args.find((a) => !a.startsWith('--')) || join(RAIZ, 'modelos-entrada'));
const FORZAR = flag('forzar');
const LICITACION = flag('licitacion');
const SIN_MINIATURAS = flag('sin-miniaturas');

if (flag('ayuda') || flag('help')) {
  console.log('Uso: npm run modelos [-- "carpeta"] [--forzar] [--sin-miniaturas] [--licitacion]');
  process.exit(0);
}

const sha = (datos) => createHash('sha256').update(datos).digest('hex');
const mb = (n) => (n / 1e6).toFixed(2) + ' MB';
const slug = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const leerJSON = async (ruta, porDefecto) => { try { return JSON.parse(await readFile(ruta, 'utf8')); } catch { return porDefecto; } };

// ───────────────────────── 1. leer un visor .html ─────────────────────────

function scriptsDe(html) {
  const salida = [];
  let i = 0;
  for (;;) {
    const a = html.indexOf('<script', i);
    if (a < 0) break;
    const b = html.indexOf('>', a);
    const c = html.indexOf('</script>', b);
    if (b < 0 || c < 0) break;
    salida.push({ ini: a, fin: c + 9, cuerpo: html.slice(b + 1, c) });
    i = c + 9;
  }
  return salida;
}

/** Devuelve { cfg, glb:Buffer, app, scripts } o { error }. */
function leerVisor(html) {
  const sc = scriptsDe(html);
  if (sc.length < 2) return { error: 'no tiene los dos bloques de script esperados' };
  const c0 = sc[0].cuerpo;
  const iCfg = c0.indexOf('window.__CFG__=');
  const iGlb = c0.indexOf(';window.__GLB__="');
  if (iCfg < 0 || iGlb < 0) return { error: 'no trae window.__CFG__ / window.__GLB__ (¿otro formato de visor?)' };
  let cfg;
  try { cfg = JSON.parse(c0.slice(iCfg + 15, iGlb)); } catch { return { error: 'la configuración no se pudo leer como JSON' }; }
  const ini = iGlb + 17;
  const fin = c0.indexOf('"', ini);
  const glb = Buffer.from(c0.slice(ini, fin), 'base64');
  if (glb.slice(0, 4).toString() !== 'glTF') return { error: 'el modelo incrustado no es un GLB válido' };
  return { cfg, glb, app: sc[1].cuerpo, scripts: sc };
}

// ───────────────────────── 2. licencia ─────────────────────────

export function clasificarLicencia(texto = '') {
  const t = String(texto).toUpperCase().replace(/[–—_]/g, '-');
  if (/CC0|DOMINIO P[UÚ]BLICO|PUBLIC DOMAIN/.test(t)) return { codigo: 'CC0', comercial: true, modificable: true, compartirIgual: false, estado: 'ok', motivo: '' };
  const m = /CC[\s-]*BY((?:[\s-]*(?:NC|ND|SA))*)/.exec(t);
  const v = /(\d\.\d)/.exec(t);
  if (!m) return { codigo: texto.trim() || 'desconocida', comercial: false, modificable: false, compartirIgual: false, estado: 'revisar', motivo: 'No se reconoce la licencia: revisarla a mano.' };
  const extra = m[1] || '';
  const nc = /NC/.test(extra) || /NO ?COMERCIAL|NONCOMMERCIAL/.test(t);
  const nd = /ND/.test(extra) || /SIN ?OBRAS ?DERIVADAS|NODERIV/.test(t);
  const sa = /SA/.test(extra) || /COMPARTIR ?IGUAL|SHARE ?ALIKE/.test(t);
  const codigo = 'CC BY' + (nc ? '-NC' : '') + (nd ? '-ND' : '') + (sa ? '-SA' : '') + (v ? ' ' + v[1] : '');
  let estado = 'ok', motivo = '';
  if (nc) { estado = 'excluir'; motivo = 'Uso no comercial: no puede ir en una oferta ni en un producto que se vende.'; }
  else if (nd) { estado = 'excluir'; motivo = 'Sin obras derivadas: comprimirlo o cambiarle algo ya no está permitido.'; }
  else if (sa) { estado = 'revisar'; motivo = 'Compartir igual: lo derivado debe llevar la misma licencia. Consultar antes de incluirlo.'; }
  return { codigo, comercial: !nc, modificable: !nd, compartirIgual: sa, estado, motivo };
}

// ───────────────────────── 3. reescribir el visor ─────────────────────────

/** Cambia la carga base64 del código del visor por una carga desde archivo. */
function parchearCodigo(app) {
  let n = 0;
  let salida = app.replace(
    /([\w$]+)=Uint8Array\.from\(atob\(window\.__GLB__\),(\w+)=>\2\.charCodeAt\(0\)\);new ([\w$]+)\(\)\.parse\(\1\.buffer,/,
    (_, v, _a, L) => { n++; return `${v}=new Uint8Array(window.__GLBBUF__);new ${L}().setMeshoptDecoder(window.MeshoptDecoder).parse(${v}.buffer,`; }
  );
  salida = salida.replace('setPixelRatio(Math.min(devicePixelRatio,2))', 'setPixelRatio(Math.min(devicePixelRatio,window.__PR__||2))');
  return { app: salida, ok: n === 1 };
}

function cargador(hashCodigo) {
  return `<script type="module">
import { MeshoptDecoder } from '../_visores/meshopt_decoder.js';
window.MeshoptDecoder = MeshoptDecoder;
// ?calidad=alta | ligera | auto (por defecto: ligera si el equipo tiene 4 GB o menos / 4 núcleos o menos)
const q = new URLSearchParams(location.search).get('calidad') || 'auto';
const flojo = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
const ligera = q === 'ligera' || (q === 'auto' && flojo);
window.__PR__ = ligera ? 1.5 : 2;
const caja = document.getElementById('load');
try {
  const r = await fetch(ligera ? 'modelo-ligero.glb' : 'modelo.glb');
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const total = Number(r.headers.get('content-length')) || 0;
  const lector = r.body.getReader();
  const partes = [];
  let n = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    partes.push(value);
    n += value.length;
    if (caja && total) caja.textContent = 'Cargando modelo… ' + Math.min(99, Math.round(n * 100 / total)) + ' %';
  }
  const buf = new Uint8Array(n);
  let o = 0;
  for (const p of partes) { buf.set(p, o); o += p.length; }
  window.__GLBBUF__ = buf.buffer;
  await MeshoptDecoder.ready;
  const s = document.createElement('script');
  s.src = '../_visores/${hashCodigo}.js';
  document.body.appendChild(s);
} catch (e) {
  if (caja) caja.textContent = 'No se pudo cargar el modelo';
  console.error(e);
}
</script>`;
}

function armarHtml(html, v, hashCodigo) {
  const [s0, s1] = v.scripts;
  const cfg = JSON.stringify(v.cfg).replace(/</g, '\\u003c');
  const sinFavicon = html.includes('rel="icon"') ? html : html.replace('</head>', '<link rel="icon" href="data:,"></head>');
  const delta = sinFavicon.length - html.length;
  html = sinFavicon;
  s0.ini += delta; s0.fin += delta; s1.ini += delta; s1.fin += delta;
  return html.slice(0, s0.ini) + `<script>window.__CFG__=${cfg};</script>` + html.slice(s0.fin, s1.ini) + cargador(hashCodigo) + html.slice(s1.fin);
}

// ───────────────────────── 4. comprimir el modelo ─────────────────────────

let herramientasGlb = null;
async function cargarHerramientasGlb() {
  if (herramientasGlb) return herramientasGlb;
  try {
    const core = await import('@gltf-transform/core');
    const ext = await import('@gltf-transform/extensions');
    const fn = await import('@gltf-transform/functions');
    const mo = await import('meshoptimizer');
    const sharp = (await import('sharp')).default;
    await Promise.all([mo.MeshoptEncoder.ready, mo.MeshoptDecoder.ready, mo.MeshoptSimplifier.ready]);
    const io = new core.NodeIO().registerExtensions(ext.ALL_EXTENSIONS).registerDependencies({
      'meshopt.decoder': mo.MeshoptDecoder, 'meshopt.encoder': mo.MeshoptEncoder
    });
    herramientasGlb = { io, fn, mo, sharp, Logger: core.Logger, ext };
    return herramientasGlb;
  } catch (e) {
    throw new Error('Faltan las herramientas de compresión. Ejecuta:  npm install\n   (' + e.message + ')');
  }
}

/**
 * Comprime un GLB. ligero=false → modelo normal (texturas ≤2048). ligero=true → texturas ≤1024 y menos triángulos.
 * seguro=true → no cuantiza ni simplifica la geometría (para modelos con esqueleto/animación: three.js no los
 * dibuja bien si se les cuantiza la posición, y al simplificarlos se rompe el vínculo con los huesos).
 */
async function comprimir(glb, ligero, seguro) {
  const { io, fn, mo, sharp, Logger, ext } = await cargarHerramientasGlb();
  const doc = await io.readBinary(new Uint8Array(glb));
  doc.setLogger(new Logger(Logger.Verbosity.ERROR));
  const pasos = [fn.dedup(), fn.prune()];
  if (ligero && !seguro) pasos.push(fn.weld(), fn.simplify({ simplifier: mo.MeshoptSimplifier, ratio: 0.5, error: 0.01, lockBorder: true }));
  pasos.push(fn.textureCompress({ encoder: sharp, targetFormat: 'webp', resize: ligero ? [1024, 1024] : [2048, 2048], quality: ligero ? 78 : 85 }));
  if (seguro) {
    // solo se reordena y se comprime sin cuantizar: la geometría queda exactamente igual
    pasos.push(fn.reorder({ encoder: mo.MeshoptEncoder, target: 'size' }));
    await doc.transform(...pasos);
    doc.createExtension(ext.EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: ext.EXTMeshoptCompression.EncoderMethod.FILTER });
  } else {
    pasos.push(fn.meshopt({ encoder: mo.MeshoptEncoder, level: 'high' }));
    await doc.transform(...pasos);
  }
  return Buffer.from(await io.writeBinary(doc));
}

/** Caja que ocupa el modelo (para comprobar que la compresión no lo deformó). */
async function cajaDe(glb) {
  const { io, fn } = await cargarHerramientasGlb();
  const doc = await io.readBinary(new Uint8Array(glb));
  const raiz = doc.getRoot();
  const b = fn.getBounds(raiz.getDefaultScene() || raiz.listScenes()[0]);
  return { min: b.min, max: b.max, esqueletos: raiz.listSkins().length > 0 };
}
const parecidas = (a, b) => {
  const diag = Math.hypot(...a.max.map((v, i) => v - a.min[i])) || 1;
  const tol = diag * 0.01;
  return [...a.min, ...a.max].every((v, i) => Math.abs(v - [...b.min, ...b.max][i]) <= tol);
};

/** Comprime y VERIFICA que la forma del modelo no cambió. Si cambió, reintenta en modo seguro; si aún así falla, deja el original. */
async function comprimirVerificado(glb, ligero) {
  const original = await cajaDe(glb);
  const intentos = original.esqueletos ? [true] : [false, true];   // con esqueleto se va directo al modo seguro
  for (const seguro of intentos) {
    const buf = await comprimir(glb, ligero, seguro);
    if (parecidas(original, await cajaDe(buf))) return { buf, seguro, aviso: '' };
  }
  return { buf: glb, seguro: true, aviso: 'la compresión deformaba el modelo; se dejó SIN comprimir' };
}

// ───────────────────────── 5. miniaturas ─────────────────────────

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.glb': 'model/gltf-binary', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };

async function hacerMiniaturas(ids) {
  let pw, sharp;
  try { pw = await import('playwright'); sharp = (await import('sharp')).default; }
  catch { console.log('\n(Sin playwright: no se generan miniaturas. Para tenerlas: npm i -D playwright && npx playwright install chromium)'); return new Set(); }
  const servidor = createServer(async (req, res) => {
    const ruta = normalize(join(APP, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!ruta.startsWith(APP)) { res.writeHead(403).end(); return; }
    let datos;
    try { datos = await readFile(ruta); } catch { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(ruta)] || 'application/octet-stream' }).end(datos);
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const puerto = servidor.address().port;
  const argsNav = process.platform === 'linux' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist'];
  const nav = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: argsNav });
  const hechas = new Set();
  for (const id of ids) {
    const pag = await nav.newPage({ viewport: { width: 1280, height: 800 } });
    pag.setDefaultTimeout(120000);
    try {
      await pag.goto(`http://127.0.0.1:${puerto}/contenido/modelos3d/${id}/index.html?calidad=alta`);
      await pag.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
      await pag.evaluate(() => document.getElementById('v3d').click());                       // modo "solo modelo": recentra y quita los paneles
      await pag.waitForTimeout(2200);
      await pag.addStyleTag({ content: '#decor,#mascot,#head,#top,#left,#right,#tools,#v3d,#lines,#pills,#load,#pop,#modal{visibility:hidden!important} html,body{background:transparent!important}' });
      await pag.waitForTimeout(300);
      const png = await pag.screenshot({ omitBackground: true });
      const salida = await sharp(png).trim({ threshold: 8 }).resize(560, 420, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({ top: 30, bottom: 30, left: 40, right: 40, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 88, alphaQuality: 90 }).toBuffer();
      await writeFile(join(DESTINO, id, 'miniatura.webp'), salida);
      hechas.add(id);
      console.log(`   miniatura  ${id}  (${(salida.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.log(`   ✗ miniatura de ${id}: ${e.message.split('\n')[0]}`);
    }
    await pag.close();
  }
  await nav.close();
  servidor.close();
  return hechas;
}

// ───────────────────────── 6. metadatos que cura una persona ─────────────────────────

const DIMENSIONES = {
  vida: /c[eé]lula|coraz[oó]n|flor|planta|animal|cuerpo|[oó]rgano|esqueleto|adn|lisosoma|mitocondria|pared celular|h[oó]ngo|bacteria/i,
  'fisica-quimica': /[aá]tomo|mol[eé]cula|circuito|im[aá]n|fuerza|energ[ií]a|qu[ií]mic|f[ií]sic|el[eé]ctric|luz|sonido/i,
  'tierra-universo': /planeta|sol\b|luna|tierra|volc[aá]n|sistema solar|cohete|estrella|galaxia|clima|roca|placas/i
};
function adivinarDimension(texto) {
  for (const [d, re] of Object.entries(DIMENSIONES)) if (re.test(texto)) return d;
  return 'sin-clasificar';
}

// ───────────────────────── principal ─────────────────────────

async function main() {
  console.log(`\nModelos 3D · entrada: ${ENTRADA}${LICITACION ? '  ·  MODO LICITACIÓN' : ''}\n`);
  if (!existsSync(ENTRADA)) {
    await mkdir(ENTRADA, { recursive: true });
    console.log(`No existía la carpeta de entrada; la creé. Copia ahí los visores .html y vuelve a ejecutar.\n  ${ENTRADA}`);
    return;
  }
  await mkdir(VISORES, { recursive: true });

  // decodificador de modelos comprimidos (se copia una vez desde node_modules)
  const decodificador = join(VISORES, 'meshopt_decoder.js');
  if (!existsSync(decodificador) || FORZAR) {
    try {
      await copyFile(join(RAIZ, 'node_modules', 'meshoptimizer', 'meshopt_decoder.mjs'), decodificador);
      await copyFile(join(RAIZ, 'node_modules', 'meshoptimizer', 'LICENSE.md'), join(VISORES, 'LICENSE-meshoptimizer.txt'));
    } catch { console.log('No encuentro meshoptimizer. Ejecuta primero:  npm install'); process.exit(1); }
  }

  const catalogo = await leerJSON(ARCHIVO_CATALOGO, { version: 1, modelos: [] });
  const previos = new Map(catalogo.modelos.map((m) => [m.id, m]));
  const meta = await leerJSON(ARCHIVO_META, { _ayuda: 'Datos que curas tú. dimension: vida | fisica-quimica | tierra-universo. orden: número menor sale primero. Opcionales: titulo y descripcion (para distinguir dos modelos que se llaman igual). nivel se guarda pero hoy la app no lo muestra.' });
  const archivos = (await readdir(ENTRADA)).filter((f) => f.toLowerCase().endsWith('.html')).sort();
  if (!archivos.length) { console.log('No hay archivos .html en la carpeta de entrada.'); return; }

  // lectura + duplicados (se queda con el nombre más descriptivo)
  const leidos = [];
  const avisos = [];
  for (const f of archivos) {
    const html = await readFile(join(ENTRADA, f), 'utf8');
    const v = leerVisor(html);
    if (v.error) { avisos.push(`✗ ${f}: ${v.error}`); continue; }
    leidos.push({ f, html, v, hashGlb: sha(v.glb), hashFuente: sha(html) });
  }
  const porHash = new Map();
  for (const it of leidos) {
    const otro = porHash.get(it.hashGlb);
    if (!otro) porHash.set(it.hashGlb, it);
    else if (basename(it.f, '.html').length > basename(otro.f, '.html').length) { otro.duplicadoDe = it.f; porHash.set(it.hashGlb, it); }
    else it.duplicadoDe = otro.f;
  }
  for (const it of leidos) if (it.duplicadoDe) avisos.push(`= ${it.f}: es el mismo modelo que ${it.duplicadoDe} (se omite)`);

  const nuevos = [];
  const resumen = [];
  for (const it of leidos.filter((x) => !x.duplicadoDe)) {
    const id = slug(basename(it.f, '.html'));
    const previo = previos.get(id);
    const carpeta = join(DESTINO, id);
    const cr = it.v.cfg.creditos || {};
    const lic = clasificarLicencia(cr.licencia);

    if (LICITACION && lic.estado === 'excluir') { resumen.push({ id, lic, nota: 'excluido (licitación)' }); continue; }

    const completo = previo && previo.fuenteSha === it.hashFuente && ['index.html', 'modelo.glb', 'modelo-ligero.glb'].every((a) => existsSync(join(carpeta, a)));
    if (completo && !FORZAR) { nuevos.push({ ...previo, licencia: { ...lic, texto: cr.licencia } }); resumen.push({ id, lic, nota: 'sin cambios' }); continue; }

    process.stdout.write(`• ${id} …`);
    const parche = parchearCodigo(it.v.app);
    await mkdir(carpeta, { recursive: true });
    let optimizado = parche.ok;
    let pesos = { original: it.v.glb.length, normal: 0, ligero: 0 };

    if (parche.ok) {
      const rn = await comprimirVerificado(it.v.glb, false);
      const rl = await comprimirVerificado(it.v.glb, true);
      const normal = rn.buf, ligero = rl.buf;
      for (const r of [rn, rl]) if (r.aviso) avisos.push(`! ${id}: ${r.aviso}`);
      if (rn.seguro) avisos.push(`i ${id}: tiene esqueleto (huesos); se comprimió sin tocar la forma, por eso pesa un poco más`);
      const hashCodigo = sha(parche.app).slice(0, 10);
      await writeFile(join(VISORES, `${hashCodigo}.js`), parche.app);
      await writeFile(join(carpeta, 'index.html'), armarHtml(it.html, it.v, hashCodigo));
      await writeFile(join(carpeta, 'modelo.glb'), normal);
      await writeFile(join(carpeta, 'modelo-ligero.glb'), ligero);
      pesos = { original: it.v.glb.length, normal: normal.length, ligero: ligero.length };
    } else {
      // formato de visor distinto: se copia tal cual, funciona pero sin optimizar
      await writeFile(join(carpeta, 'index.html'), it.html);
      avisos.push(`! ${it.f}: el código del visor es distinto al esperado; se copió SIN optimizar`);
    }

    const grupos = it.v.cfg.grupos || [];
    const m = meta[id] || {};
    const dimension = m.dimension || adivinarDimension([it.v.cfg.titulo, ...grupos.map((g) => g.nombre)].join(' '));
    if (!meta[id]) avisos.push(`? ${id}: nuevo: lo puse en la dimensión "${dimension}". Si no es correcta, corrígela en metadatos.json`);

    nuevos.push({
      id,
      titulo: m.titulo || it.v.cfg.titulo || id,
      descripcion: m.descripcion || '',
      subtitulo: it.v.cfg.subtitulo || '',
      curso: m.curso || 'ciencias',
      nivel: m.nivel || ['primaria', 'secundaria'],
      dimension,
      orden: m.orden ?? 100,
      partes: grupos.map((g) => g.nombre),
      paginasInfo: it.v.cfg.info ? it.v.cfg.info.paginas.length : grupos.reduce((s, g) => s + (g.paginas ? g.paginas.length : 0), 0),
      credito: { titulo: cr.titulo || '', autor: cr.autor || '', autorUrl: cr.autorUrl || '', fuente: cr.fuente || '', cambios: cr.cambios || '', atribucion: cr.atribucion || '' },
      licencia: { ...lic, texto: cr.licencia || '', url: cr.licenciaUrl || '' },
      archivos: { visor: `${id}/index.html`, glb: `${id}/modelo.glb`, glbLigero: `${id}/modelo-ligero.glb`, miniatura: existsSync(join(carpeta, 'miniatura.webp')) ? `${id}/miniatura.webp` : null },
      pesoBytes: pesos,
      optimizado,
      fuenteSha: it.hashFuente,
      glbSha: it.hashGlb,
      origen: it.f
    });
    process.stdout.write(` ${mb(pesos.original)} → ${mb(pesos.normal)} (ligero ${mb(pesos.ligero)})\n`);
    resumen.push({ id, lic, nota: 'procesado' });
  }

  // miniaturas de los que no tienen
  const sinMini = nuevos.filter((n) => !existsSync(join(DESTINO, n.id, 'miniatura.webp')) || (FORZAR && resumen.find((r) => r.id === n.id)?.nota === 'procesado')).map((n) => n.id);
  if (!SIN_MINIATURAS && sinMini.length) {
    console.log('\nMiniaturas…');
    try { await hacerMiniaturas(sinMini); }
    catch (e) { avisos.push('! No se pudieron generar las miniaturas: ' + e.message.split('\n')[0] + '  (¿falta  npx playwright install chromium ?)'); }
  }
  for (const n of nuevos) n.archivos.miniatura = existsSync(join(DESTINO, n.id, 'miniatura.webp')) ? `${n.id}/miniatura.webp` : null;

  // en modo licitación se retiran los excluidos que hubiera de antes (se pueden regenerar sin la opción)
  if (LICITACION) {
    for (const m of catalogo.modelos) {
      if (m.licencia && m.licencia.estado === 'excluir' && existsSync(join(DESTINO, m.id))) {
        await rm(join(DESTINO, m.id), { recursive: true, force: true });
        avisos.push(`− ${m.id}: retirado de la app (licencia no apta para licitación)`);
      }
    }
  }

  // limpieza de visores compartidos que ya nadie usa
  const usados = new Set();
  for (const n of nuevos) {
    try { const h = /_visores\/([a-f0-9]+)\.js/.exec(await readFile(join(DESTINO, n.archivos.visor), 'utf8')); if (h) usados.add(h[1] + '.js'); } catch {}
  }
  for (const f of await readdir(VISORES)) if (/^[a-f0-9]{10}\.js$/.test(f) && !usados.has(f)) await rm(join(VISORES, f), { force: true });

  nuevos.sort((a, b) => (a.orden - b.orden) || a.titulo.localeCompare(b.titulo, 'es'));
  const salida = { version: 1, generado: new Date().toISOString(), modo: LICITACION ? 'licitacion' : 'desarrollo', modelos: nuevos };
  await writeFile(ARCHIVO_CATALOGO, JSON.stringify(salida, null, 2));

  // plantilla de metadatos para los que faltan (no pisa lo que ya escribiste)
  let tocoMeta = false;
  for (const n of nuevos) if (!meta[n.id]) { meta[n.id] = { nivel: n.nivel, dimension: n.dimension, curso: n.curso, orden: n.orden }; tocoMeta = true; }
  if (tocoMeta) await writeFile(ARCHIVO_META, JSON.stringify(meta, null, 2));

  // ── informe
  console.log('\n──────── Informe ────────');
  const etiqueta = { ok: 'OK      ', revisar: 'REVISAR ', excluir: 'EXCLUIR ' };
  for (const n of nuevos) {
    const p = n.pesoBytes;
    console.log(`${(etiqueta[n.licencia.estado] || '').padEnd(8)} ${n.id.padEnd(30)} ${n.licencia.codigo.padEnd(14)} ${mb(p.original).padStart(9)} → ${mb(p.normal).padStart(8)} · ligero ${mb(p.ligero).padStart(8)}  ${n.archivos.miniatura ? '🖼' : '·'}`);
  }
  for (const r of resumen.filter((x) => x.nota.startsWith('excluido'))) console.log(`EXCLUIDO ${r.id.padEnd(30)} ${r.lic.codigo}  — ${r.lic.motivo}`);
  if (avisos.length) { console.log('\nAvisos:'); for (const a of avisos) console.log('  ' + a); }
  const malos = nuevos.filter((n) => n.licencia.estado === 'excluir');
  if (malos.length && !LICITACION) console.log(`\n⚠ ${malos.length} modelo(s) NO son aptos para la licitación (uso no comercial). Para la versión de la oferta: npm run modelos:licitacion`);
  console.log(`\nListo: ${nuevos.length} modelo(s) en ${DESTINO}\n`);
}

// Solo se ejecuta cuando se llama como comando (así las pruebas pueden importar clasificarLicencia sin procesar nada)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('\nError:', e.message); process.exit(1); });
}
