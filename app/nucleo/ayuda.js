// Ayuda que se retira. Cada alumno tiene un nivel de pista por tipo de paso:
// 3 = pista completa, 2 = solo la pregunta, 1 = solo se iluminan los números, 0 = sin pista.
// Baja con 3 aciertos seguidos sin ayuda y sube con 2 errores seguidos.
// Cada juego decide sus "tipos" de paso (en divisiones: cabe, mult, restar, bajar).

export const ESPERAS_AYUDA = [8, 15, 25, 40]; // segundos que tarda en abrirse el botón Ayuda; crece si la pide seguido

export function asegurarApoyo(juego, tipos) {
  if (!juego.apoyo) {
    const cero = () => Object.fromEntries(tipos.map(t => [t, 0]));
    const nivel = {};
    tipos.forEach(t => {
      const s = juego.stats && juego.stats[t];
      const tasa = s && s.i >= 20 ? s.e / s.i : 1;
      // Un alumno con historial empieza con la ayuda que corresponde a sus errores de siempre
      nivel[t] = tasa < 0.05 ? 1 : tasa < 0.12 ? 2 : 3;
    });
    juego.apoyo = { nivel, racha: cero(), fallos: cero(), espera: 0, sinAyuda: 0, rondasSolo: 0 };
  }
  return juego.apoyo;
}

// Un paso terminado: sin ayuda suma a la racha; con ayuda la corta.
export function registrarAcierto(juego, tipos, tipo, conAyuda) {
  const ap = asegurarApoyo(juego, tipos);
  ap.fallos[tipo] = 0;
  if (conAyuda) { ap.racha[tipo] = 0; ap.sinAyuda = 0; return; }
  ap.racha[tipo]++;
  if (ap.racha[tipo] >= 3 && ap.nivel[tipo] > 0) { ap.nivel[tipo]--; ap.racha[tipo] = 0; }
  ap.sinAyuda++;
  if (ap.sinAyuda >= 3 && ap.espera > 0) { ap.espera--; ap.sinAyuda = 0; }
}

export function registrarError(juego, tipos, tipo) {
  const ap = asegurarApoyo(juego, tipos);
  ap.racha[tipo] = 0;
  ap.fallos[tipo]++;
  if (ap.fallos[tipo] >= 2) { ap.nivel[tipo] = Math.min(3, ap.nivel[tipo] + 1); ap.fallos[tipo] = 0; }
}

// Pedir ayuda seguido hace que la próxima vez haya que esperar más.
export function registrarPedidoAyuda(juego, tipos) {
  const ap = asegurarApoyo(juego, tipos);
  ap.espera = Math.min(ESPERAS_AYUDA.length - 1, ap.espera + 1);
  ap.sinAyuda = 0;
}

export const esperaAyuda = (juego, tipos) => ESPERAS_AYUDA[asegurarApoyo(juego, tipos).espera];
