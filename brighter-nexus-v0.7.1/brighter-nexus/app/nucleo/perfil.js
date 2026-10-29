// Alumno y su progreso. El progreso se guarda por juego: perfil.juegos[idJuego].
// Así un mismo alumno tiene su avance separado en cada sesión, pero todos usan la misma lógica.

import { estrellasDe, nuevaVelocidad, REGLAS } from './puntaje.js';

export function hoy(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

export function nuevoPerfil(nombre, avatar = null) {
  return {
    id: 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    nombre, avatar, creado: hoy(),
    juegos: {}, medallas: {}, dias: []
  };
}

// Crea (si falta) el espacio de un juego dentro del perfil.
// tipos: los tipos de paso que ese juego quiere seguir (puede ser []).
export function asegurarJuego(perfil, idJuego, tipos = []) {
  let j = perfil.juegos[idJuego];
  if (!j) {
    const stats = {};
    tipos.forEach(t => { stats[t] = { i: 0, e: 0 }; });
    j = perfil.juegos[idJuego] = {
      stats, rondas: 0, mejor: 0, estrellas: 0, nivel: null, recomendado: null,
      apoyo: null, velocidad: nuevaVelocidad(),
      contadores: { ejercicios: 0, seguidasSinError: 0 }
    };
  }
  return j;
}

export function registrarPaso(perfil, idJuego, tipo, ok) {
  const j = asegurarJuego(perfil, idJuego);
  const s = j.stats[tipo] || (j.stats[tipo] = { i: 0, e: 0 });
  s.i++;
  if (!ok) s.e++;
}

// Un ejercicio terminado: calcula estrellas, las suma y actualiza las rachas. Devuelve las estrellas.
export function terminarEjercicio(perfil, idJuego, resultado, reglas = REGLAS) {
  const j = asegurarJuego(perfil, idJuego);
  const estrellas = estrellasDe(resultado, reglas);
  (resultado.pasos || []).forEach(p => registrarPaso(perfil, idJuego, p.tipo, p.ok));
  j.estrellas += estrellas;
  j.contadores.ejercicios++;
  j.contadores.seguidasSinError = resultado.errores === 0 && !resultado.revelada ? j.contadores.seguidasSinError + 1 : 0;
  return estrellas;
}

export function registrarDia(perfil, fecha = new Date()) {
  const d = hoy(fecha);
  if (!perfil.dias.includes(d)) perfil.dias.push(d);
  if (perfil.dias.length > 90) perfil.dias.splice(0, perfil.dias.length - 90);
}

export function racha(perfil, fecha = new Date()) {
  const dias = new Set(perfil.dias);
  const f = new Date(fecha);
  if (!dias.has(hoy(f))) f.setDate(f.getDate() - 1);
  let n = 0;
  while (dias.has(hoy(f))) { n++; f.setDate(f.getDate() - 1); }
  return n;
}

export const totalEstrellas = perfil => Object.values(perfil.juegos).reduce((a, j) => a + j.estrellas, 0);
export const totalEjercicios = perfil => Object.values(perfil.juegos).reduce((a, j) => a + j.contadores.ejercicios, 0);
