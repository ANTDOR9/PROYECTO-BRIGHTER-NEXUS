// Conecta el quiz con el perfil del alumno de Nexus.
// El quiz avisa con el evento "nexus:partida" cada vez que termina una partida (ver quiz/js/nucleo/puntaje.js).
// Aquí cada partida suma al progreso del alumno, igual que las demás actividades: estrellas, mejor puntaje y días de uso.
// El progreso queda en perfil.juegos['<sesión>/quiz-<tema>'], por ejemplo 'ciencias/quiz-seres-vivos'.
import { asegurarJuego, registrarDia } from './perfil.js';
import { contexto } from './contexto.js';
import { guardar } from './almacen.js';

const SESION_DE_TEMA = { default: 'ciencias' };   // por ahora el quiz es solo de Ciencias; luego cada tema dirá su sesión

export function registrarPartidaEnPerfil(p, perfil = contexto.perfil) {
  if (!perfil || !p) return null;
  const sesion = p.sesion || SESION_DE_TEMA.default;
  const j = asegurarJuego(perfil, `${sesion}/quiz-${p.tema || 'general'}`);
  j.rondas += 1;
  j.estrellas += Math.max(0, Number(p.estrellas) || 0);
  j.mejor = Math.max(j.mejor, Number(p.puntos) || 0);
  j.contadores.ejercicios += 1;
  j.contadores.seguidasSinError = p.resultado === 'gano' && p.aciertos === p.total ? j.contadores.seguidasSinError + 1 : 0;
  registrarDia(perfil);
  guardar();
  return j;
}

let conectado = false;
export function conectarQuiz() {
  if (conectado) return;
  conectado = true;
  addEventListener('nexus:partida', e => registrarPartidaEnPerfil(e.detail));
}
