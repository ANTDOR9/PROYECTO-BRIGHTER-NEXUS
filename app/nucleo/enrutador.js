// Navegación por #/ruta. Una ruta es un patrón como '/juego/:sesion/:juego'
// y un manejador (params, contenedor) que dibuja la pantalla. Si devuelve una función, se llama al salir.
//
// Cada navegación recibe su PROPIO contenedor. Así, si una pantalla tarda en cargar (datos, módulos 3D…)
// y la persona ya navegó a otra, la pantalla vieja termina de dibujarse en un contenedor que ya no se ve.

const rutas = [];
let desmontar = null;
let contenedorActual = null;
let version = 0;

export function ruta(patron, manejador) {
  const claves = [];
  const re = new RegExp('^' + patron.replace(/:([a-zA-Z]+)/g, (_, k) => { claves.push(k); return '([^/]+)'; }) + '$');
  rutas.push({ re, claves, manejador });
}

export const ir = destino => { location.hash = '#' + destino; };

async function resolver() {
  const mia = ++version;
  const destino = location.hash.slice(1) || '/';
  for (const r of rutas) {
    const m = r.re.exec(destino);
    if (!m) continue;
    const params = {};
    r.claves.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
    if (typeof desmontar === 'function') { try { desmontar(); } catch (e) { /* pantalla ya cerrada */ } }
    desmontar = null;
    const pantalla = document.createElement('div');
    pantalla.className = 'pantalla';
    contenedorActual.replaceChildren(pantalla);
    const salida = await r.manejador(params, pantalla);
    if (typeof salida === 'function') {
      if (mia === version) desmontar = salida;
      else { try { salida(); } catch (e) { /* ya no se ve */ } } // la persona ya se fue a otra pantalla
    }
    return;
  }
  ir('/');
}

export function iniciar(contenedor) {
  contenedorActual = contenedor;
  addEventListener('hashchange', resolver);
  return resolver();
}
