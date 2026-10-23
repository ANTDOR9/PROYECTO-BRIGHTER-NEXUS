// Divisiones por el método de la galera: primer juego a migrar a Nexus.
//
// Qué va en esta carpeta al migrar:
//   division.js              casillas y pasos de cada división           (sin cambios)
//   pistas.js                pistas por casilla y explicación de errores (sin cambios)
//   aprendizaje-divisiones.js  lo propio de divisiones: GENERAR, ESCALONES, tipos de paso
//                              (cabe, mult, restar, bajar) y tablas débiles
//   tablero.js               el tablero y el teclado (sale de aplicacion.js)
//
// Lo que NO se copia: estrellas, reloj, focos, ayuda que se retira, medallas y guardado.
// Eso ya vive en nucleo/ (puntaje.js, ayuda.js, perfil.js, medallas.js, almacen.js).
//
// El juego solo tiene que llamar a ctx.reportar(resultado) al terminar cada división.

export const TIPOS = ['cabe', 'mult', 'restar', 'bajar'];

export default {
  id: 'divisiones',
  tipos: TIPOS,
  montar(zona) {
    zona.innerHTML = '<p class="lead">Aquí se conectará el juego de divisiones migrado. Mira los comentarios de este archivo para ver el plan.</p>';
  }
};
