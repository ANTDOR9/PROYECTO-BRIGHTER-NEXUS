// Pantallas con diseño propio (carga, menú y quiz).
//
// Cada una trae su hoja de estilos completa y usa nombres de clase que Nexus también usa (.tarjeta, .rejilla, .btn…).
// Para que no se pisen, mientras una de ellas está a la vista se APAGAN los estilos de Nexus (los <link data-nexus> de
// index.html) y solo corren los suyos; al salir, se invierte. Así cada pantalla se ve exactamente como se diseñó
// y las pantallas de Nexus no se ven afectadas.
//
// Las hojas se descargan al arrancar con media="not all" (no se aplican) y se activan al instante cuando se necesitan.
//
//   const salir = await entrarPantallaPropia('menu');   // ... y al irse:  salir();

const RAIZ = new URL('../', import.meta.url).href;

const GRUPOS = {
  carga: ['menu/tema.css', 'menu/cargando.css'],
  menu: ['menu/tema.css', 'menu/menu.css'],
  quiz: ['quiz/css/tema.css', 'quiz/css/pantalla.css']
};

const propias = new Map();      // ruta -> { link, lista }
let usos = 0;
let temporizador = null;

function enlace(ruta) {
  let e = propias.get(ruta);
  if (e) return e;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = RAIZ + ruta;
  link.media = 'not all';
  link.dataset.propio = '1';
  const lista = new Promise(ok => {
    link.addEventListener('load', ok, { once: true });
    link.addEventListener('error', ok, { once: true });   // si falla, la pantalla se abre igual (sin estilos propios)
  });
  document.head.appendChild(link);
  e = { link, lista };
  propias.set(ruta, e);
  return e;
}

/** Empieza a descargar las hojas propias (se llama una vez al arrancar). */
export function precargarEstilos() {
  Object.values(GRUPOS).flat().forEach(enlace);
}

const nexus = () => [...document.querySelectorAll('link[data-nexus]')];
const partesNexus = () => [document.getElementById('fondo'), document.querySelector('.barra-superior')].filter(Boolean);

function aplicar(grupo) {
  const activas = new Set(grupo ? GRUPOS[grupo] : []);
  for (const [ruta, e] of propias) e.link.media = activas.has(ruta) ? 'all' : 'not all';
  nexus().forEach(l => { l.media = grupo ? 'not all' : 'all'; });
  partesNexus().forEach(p => { p.hidden = !!grupo; });
  document.body.classList.toggle('pantalla-propia', !!grupo);
}

// ¿La dirección es de una pantalla con diseño propio? Si lo es, la siguiente pantalla se encarga de los estilos.
const RUTA_PROPIA = /^(\/|\/intro|\/seccion\/[^/?]+|\/quiz(\/[^/?]+)?)(\?.*)?$/;
const destinoEsPropio = () => RUTA_PROPIA.test(location.hash.slice(1) || '/');

export async function entrarPantallaPropia(grupo) {
  clearTimeout(temporizador);
  usos++;
  await Promise.all(GRUPOS[grupo].map(r => enlace(r).lista));
  aplicar(grupo);
  let salio = false;
  return () => {
    if (salio) return;
    salio = true;
    usos--;
    clearTimeout(temporizador);
    if (usos > 0) return;
    usos = 0;
    // Hacia una pantalla de Nexus: se restauran sus estilos YA, antes de que dibuje (si no, se vería un instante con los estilos ajenos).
    // Hacia otra pantalla propia: ella entra enseguida y no se ve el cambio; el temporizador es solo un seguro.
    if (!destinoEsPropio()) aplicar(null);
    else temporizador = setTimeout(() => { if (usos <= 0) aplicar(null); }, 800);
  };
}
