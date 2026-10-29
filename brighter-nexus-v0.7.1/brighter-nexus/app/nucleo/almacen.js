// Guarda alumnos y progreso en el propio equipo.
// Hay dos lugares: el almacenamiento de la página y una copia de seguridad opcional
// (archivo en Windows, almacenamiento propio de Android). Al abrir se usa el que tenga más información.
// La copia se conecta con registrarCopia({ leer(): Promise<string|null>, escribir(texto) }).

const CLAVE = 'brighterNexus.v1';
const vacio = () => ({ alumnos: [], ultimo: null, sonido: true });
const valido = d => d && Array.isArray(d.alumnos);
// Cuánta información tiene una copia: alumnos y ejercicios hechos
const cantidad = d => d ? d.alumnos.reduce((t, p) =>
  t + 1 + Object.values(p.juegos || {}).reduce((a, j) => a + ((j.contadores && j.contadores.ejercicios) || 0), 0), 0) : -1;

let datos = null;
let copia = null;
let ultimoTexto = null, pendiente = null;

export function registrarCopia(adaptador) { copia = adaptador; }

function leerLocal() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    if (valido(d)) return d;
  } catch (e) { /* datos dañados o almacenamiento bloqueado */ }
  return null;
}

async function leerRespaldo() {
  try {
    if (!copia) return null;
    const texto = await copia.leer();
    if (texto) { const d = JSON.parse(texto); if (valido(d)) return d; }
  } catch (e) { /* sin copia de seguridad */ }
  return null;
}

function escribirRespaldo(texto) {
  try { if (copia) copia.escribir(texto); } catch (e) { /* la copia principal ya está guardada */ }
}

export async function preparar() {
  const local = leerLocal(), respaldo = await leerRespaldo();
  let elegido = local;
  if (respaldo && cantidad(respaldo) > cantidad(local)) {
    elegido = respaldo;
    try { localStorage.setItem(CLAVE, JSON.stringify(respaldo)); } catch (e) { /* se sigue con la copia */ }
  }
  datos = elegido || vacio();
  if (elegido && cantidad(respaldo) < cantidad(elegido)) escribirRespaldo(JSON.stringify(elegido));
  return datos;
}

export const leer = () => datos || (datos = leerLocal() || vacio());

export function guardar() {
  const texto = JSON.stringify(leer());
  let ok = true;
  try { localStorage.setItem(CLAVE, texto); } catch (e) { ok = false; }
  // La copia de seguridad se escribe agrupada, no a cada cambio
  ultimoTexto = texto;
  clearTimeout(pendiente);
  pendiente = setTimeout(() => { escribirRespaldo(ultimoTexto); pendiente = null; }, 500);
  return ok;
}

function vaciarPendiente() {
  if (pendiente) { clearTimeout(pendiente); pendiente = null; escribirRespaldo(ultimoTexto); }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) vaciarPendiente(); });
  addEventListener('pagehide', vaciarPendiente);
  addEventListener('beforeunload', vaciarPendiente);
}
