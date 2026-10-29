// Navegación por #/ruta. Una ruta es un patrón como '/juego/:sesion/:juego'
// y un manejador (params, contenedor) que dibuja la pantalla. Si devuelve una función, se llama al salir.
//
// Cada navegación recibe su PROPIO contenedor. Así, si una pantalla tarda en cargar (datos, módulos 3D…)
// y la persona ya navegó a otra, la pantalla vieja termina de dibujarse en un contenedor que ya no se ve.
//
// Lo que se escribe después de "?" no cuenta para elegir la ruta: llega en params.q (un URLSearchParams).
//   #/quiz/conejo?tema=seres-vivos  →  ruta '/quiz/:juego', params { juego: 'conejo', q: tema=seres-vivos }
//
// Dos ayudas para pantallas que cambian por dentro sin recargarse (el menú que se acerca a una sección, el quiz que
// cambia de tema):
//   fijarHash('/seccion/aprender')  cambia la dirección sin volver a dibujar la pantalla ni sumar otra entrada al historial.
//   proteger(async () => true|false) la pantalla actual puede frenar la salida (por ejemplo, "¿salir de la partida?").

const rutas = [];
let desmontar = null;
let contenedorActual = null;
let version = 0;
let hashActual = null;     // la ruta que se está viendo (con su "?")
let guardia = null;        // función que decide si se puede salir de la pantalla actual

export function ruta(patron, manejador) {
  const claves = [];
  const re = new RegExp('^' + patron.replace(/:([a-zA-Z]+)/g, (_, k) => { claves.push(k); return '([^/]+)'; }) + '$');
  rutas.push({ re, claves, manejador });
}

export const ir = destino => { location.hash = '#' + destino; };

export function fijarHash(destino) {
  hashActual = destino;
  history.replaceState(null, '', '#' + destino);
}

export const proteger = fn => { guardia = fn; };

async function resolver() {
  const destino = location.hash.slice(1) || '/';
  if (guardia && hashActual !== null && destino !== hashActual) {
    let sigue = true;
    try { sigue = await guardia(); } catch (e) { sigue = true; }
    if (!sigue) { history.replaceState(null, '', '#' + hashActual); return; }
  }
  guardia = null;
  const mia = ++version;
  hashActual = destino;
  const [camino, consulta = ''] = destino.split('?');
  for (const r of rutas) {
    const m = r.re.exec(camino);
    if (!m) continue;
    const params = { q: new URLSearchParams(consulta) };
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
