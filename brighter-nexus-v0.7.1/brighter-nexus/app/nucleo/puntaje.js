// Motor de puntaje común a todas las sesiones.
// No sabe nada de divisiones ni de ningún curso: recibe un "resultado" y devuelve estrellas, puntos o cambios de nivel.
//
// Resultado: { errores, ayuda, revelada, tiempo: { usado, limite } | null, pasos: [{ tipo, ok }] }

export const REGLAS = {
  porRonda: 13,
  erroresPara3: 0,          // hasta este número de errores = 3 estrellas
  erroresPara2: 2,          // hasta este número = 2 estrellas, más = 1
  topeConAyuda: 2,          // con ayuda no pasa de estas estrellas
  valeSiRevelada: 1,        // el juego tuvo que mostrar la solución
  subeSiSinErrores: 0.75,   // proporción de ejercicios sin errores para recomendar el nivel siguiente
  bajaSiReveladas: 0.3,     // proporción de reveladas para recomendar bajar
  bajaSiEstrellasBajoDe: 0.5 // proporción de estrellas máximas por debajo de la cual se recomienda bajar
};

// ---------- estrellas ----------
export function estrellasDe(r, reglas = REGLAS) {
  if (r.revelada) return reglas.valeSiRevelada;
  let e = r.errores <= reglas.erroresPara3 ? 3 : r.errores <= reglas.erroresPara2 ? 2 : 1;
  if (r.ayuda) e = Math.min(e, reglas.topeConAyuda);
  return e;
}

// ---------- modo con reloj ----------
// nivel: 1..max de la escalera. sobra: segundos que sobraron.
export function puntosReloj({ nivel, errores, sobra, tramo = 3, basePorTramo = 10 }) {
  const base = basePorTramo * Math.ceil(nivel / tramo);
  const extra = errores === 0 ? sobra : Math.floor(sobra / 2);
  return { base, extra, total: base + extra };
}

export function nuevaEscalera(nivel = 1) {
  return { nivel, buenas: 0, malas: 0 };
}

// Cambia el nivel de la escalera según el ejercicio terminado. Devuelve -1, 0 o 1.
// No reacciona a un solo ejercicio: sube tras 'subirCon' buenos seguidos y baja tras 'bajarCon' malos seguidos.
// Si el juego tuvo que revelar la solución, baja de inmediato.
export function moverEscalera(estado, r, { max = 12, subirCon = 2, bajarCon = 2, margenTiempo = 0.2 } = {}) {
  const sobra = r.tiempo ? Math.max(0, r.tiempo.limite - r.tiempo.usado) : 0;
  const limite = r.tiempo ? r.tiempo.limite : 0;
  const buena = !r.revelada && r.errores === 0 && sobra >= limite * margenTiempo;
  const mala = !r.revelada && (r.errores >= 2 || (r.tiempo && sobra === 0));
  let cambio = 0;
  if (r.revelada) { cambio = -1; estado.buenas = 0; estado.malas = 0; }
  else if (buena) {
    estado.buenas++; estado.malas = 0;
    if (estado.buenas >= subirCon) { cambio = 1; estado.buenas = 0; }
  } else if (mala) {
    estado.malas++; estado.buenas = 0;
    if (estado.malas >= bajarCon) { cambio = -1; estado.malas = 0; }
  } else { estado.buenas = 0; estado.malas = 0; }
  const antes = estado.nivel;
  estado.nivel = Math.max(1, Math.min(max, antes + cambio));
  return estado.nivel - antes; // cuenta solo el cambio real (en el nivel 1 no se baja ni en el máximo se sube)
}

// ---------- tiempo propio de cada alumno ----------
export const SEG_INICIALES = 12;
export const nuevaVelocidad = () => ({ seg: SEG_INICIALES, muestras: 0 });

export function registrarTiempo(vel, pasos, segundos) {
  if (!pasos || segundos <= 0) return;
  const porPaso = Math.max(2, Math.min(40, segundos / pasos));
  const peso = vel.muestras < 3 ? 0.5 : 0.25; // las primeras pesan más para conocer rápido al alumno
  vel.seg = Math.round((vel.seg * (1 - peso) + porPaso * peso) * 10) / 10;
  vel.muestras++;
}

export function tiempoPara(vel, pasos, margen = 1.3) {
  const porPaso = Math.max(4, Math.min(25, vel.seg * margen));
  return Math.round(pasos * porPaso + 10);
}

// ---------- focos de ayuda ----------
export const nuevosFocos = (total, recargaCada) => ({ total, usados: 0, racha: 0, recargaCada });
export const focosQuedan = f => f.total - f.usados;

export function usarFoco(f) {
  if (f.usados >= f.total) return false;
  f.usados++; f.racha = 0;
  return true;
}

// Un ejercicio terminado sin pedir ayuda. Devuelve true si se recuperó un foco.
export function ejercicioSinAyuda(f) {
  f.racha++;
  if (f.racha >= f.recargaCada && f.usados > 0) { f.usados--; f.racha = 0; return true; }
  return false;
}

// ---------- ronda ----------
export function resumenRonda(resultados, reglas = REGLAS) {
  const res = resultados.filter(Boolean);
  const estrellas = res.reduce((a, r) => a + estrellasDe(r, reglas), 0);
  const sinErrores = res.filter(r => r.errores === 0 && !r.revelada).length;
  const reveladas = res.filter(r => r.revelada).length;
  const fallos = {};
  res.forEach(r => (r.pasos || []).forEach(p => { if (!p.ok) fallos[p.tipo] = (fallos[p.tipo] || 0) + 1; }));
  let peor = null;
  Object.keys(fallos).forEach(t => { if (!peor || fallos[t] > fallos[peor]) peor = t; });
  return { total: res.length, estrellas, maxEstrellas: res.length * 3, sinErrores, reveladas, fallos, peor };
}

// Nivel que conviene proponer para la próxima ronda.
export function nivelRecomendado({ orden, actual, resumen, disponible = () => true, reglas = REGLAS }) {
  const i = orden.indexOf(actual);
  if (i < 0 || !resumen.total) return actual;
  const sinErr = resumen.sinErrores / resumen.total;
  const revel = resumen.reveladas / resumen.total;
  const bajoEstrellas = resumen.estrellas < resumen.maxEstrellas * reglas.bajaSiEstrellasBajoDe;
  if (sinErr >= reglas.subeSiSinErrores && i < orden.length - 1 && disponible(orden[i + 1])) return orden[i + 1];
  if ((revel >= reglas.bajaSiReveladas || bajoEstrellas) && i > 0) return orden[i - 1];
  return actual;
}
