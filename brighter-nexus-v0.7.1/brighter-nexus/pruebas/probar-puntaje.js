// Pruebas del motor de puntaje: npm run pruebas
import assert from 'node:assert/strict';
import {
  estrellasDe, puntosReloj, nuevaEscalera, moverEscalera, nuevaVelocidad, registrarTiempo, tiempoPara,
  nuevosFocos, usarFoco, ejercicioSinAyuda, focosQuedan, resumenRonda, nivelRecomendado
} from '../app/nucleo/puntaje.js';
import { nuevoPerfil, terminarEjercicio, totalEstrellas } from '../app/nucleo/perfil.js';
import { asegurarApoyo, registrarAcierto, registrarError } from '../app/nucleo/ayuda.js';
import * as Medallas from '../app/nucleo/medallas.js';

let n = 0;
const prueba = (nombre, f) => { f(); n++; console.log('ok  ' + nombre); };
const r = (extra = {}) => ({ errores: 0, ayuda: false, revelada: false, tiempo: null, pasos: [], ...extra });

prueba('estrellas: 0 errores = 3, 1-2 = 2, más = 1', () => {
  assert.equal(estrellasDe(r()), 3);
  assert.equal(estrellasDe(r({ errores: 1 })), 2);
  assert.equal(estrellasDe(r({ errores: 2 })), 2);
  assert.equal(estrellasDe(r({ errores: 3 })), 1);
});
prueba('estrellas: con ayuda máximo 2, revelada = 1', () => {
  assert.equal(estrellasDe(r({ ayuda: true })), 2);
  assert.equal(estrellasDe(r({ revelada: true })), 1);
});
prueba('puntos con reloj: base por tramo y extra por segundos', () => {
  assert.deepEqual(puntosReloj({ nivel: 1, errores: 0, sobra: 12 }), { base: 10, extra: 12, total: 22 });
  assert.deepEqual(puntosReloj({ nivel: 7, errores: 1, sobra: 12 }), { base: 30, extra: 6, total: 36 });
  assert.equal(puntosReloj({ nivel: 12, errores: 0, sobra: 0 }).base, 40);
});
prueba('escalera: sube con 2 buenas seguidas', () => {
  const e = nuevaEscalera(1);
  const buena = r({ tiempo: { usado: 10, limite: 40 } });
  assert.equal(moverEscalera(e, buena), 0);
  assert.equal(moverEscalera(e, buena), 1);
  assert.equal(e.nivel, 2);
});
prueba('escalera: baja con 2 malas, o ya si fue revelada; no pasa de los topes', () => {
  const e = nuevaEscalera(5);
  const mala = r({ errores: 2, tiempo: { usado: 30, limite: 40 } });
  assert.equal(moverEscalera(e, mala), 0);
  assert.equal(moverEscalera(e, mala), -1);
  assert.equal(moverEscalera(e, r({ revelada: true })), -1);
  assert.equal(e.nivel, 3);
  const piso = nuevaEscalera(1);
  assert.equal(moverEscalera(piso, r({ revelada: true })), 0);
  assert.equal(piso.nivel, 1);
});
prueba('escalera: una intermedia reinicia la cuenta', () => {
  const e = nuevaEscalera(4);
  const buena = r({ tiempo: { usado: 10, limite: 40 } });
  moverEscalera(e, buena);
  moverEscalera(e, r({ errores: 1, tiempo: { usado: 10, limite: 40 } }));
  assert.equal(e.buenas, 0);
});
prueba('tiempo propio: se ajusta a la velocidad del alumno', () => {
  const v = nuevaVelocidad();
  const inicial = tiempoPara(v, 10);
  for (let i = 0; i < 6; i++) registrarTiempo(v, 10, 30); // 3 s por paso: rápido
  assert.ok(tiempoPara(v, 10) < inicial);
});
prueba('focos: se gastan y se recuperan cada N sin ayuda', () => {
  const f = nuevosFocos(3, 3);
  assert.ok(usarFoco(f)); assert.ok(usarFoco(f));
  assert.equal(focosQuedan(f), 1);
  assert.equal(ejercicioSinAyuda(f), false);
  assert.equal(ejercicioSinAyuda(f), false);
  assert.equal(ejercicioSinAyuda(f), true);
  assert.equal(focosQuedan(f), 2);
  const vacios = nuevosFocos(1, 3);
  usarFoco(vacios);
  assert.equal(usarFoco(vacios), false);
});
prueba('ronda: resumen y nivel recomendado', () => {
  const orden = ['facil', 'medio', 'dificil'];
  const buenos = Array.from({ length: 13 }, () => r({ pasos: [{ tipo: 'a', ok: true }] }));
  const resumen = resumenRonda(buenos);
  assert.equal(resumen.estrellas, 39);
  assert.equal(nivelRecomendado({ orden, actual: 'facil', resumen }), 'medio');
  assert.equal(nivelRecomendado({ orden, actual: 'dificil', resumen }), 'dificil'); // ya es el último
  const malos = Array.from({ length: 13 }, () => r({ revelada: true, pasos: [{ tipo: 'a', ok: false }, { tipo: 'b', ok: false }] }));
  const rm = resumenRonda(malos);
  assert.equal(rm.peor, 'a');
  assert.equal(nivelRecomendado({ orden, actual: 'medio', resumen: rm }), 'facil');
  assert.equal(nivelRecomendado({ orden, actual: 'facil', resumen: rm }), 'facil'); // no baja del primero
  assert.equal(nivelRecomendado({ orden, actual: 'facil', resumen, disponible: () => false }), 'facil'); // bloqueado
});
prueba('ayuda: baja con 3 aciertos sin ayuda, sube con 2 errores', () => {
  const j = { stats: {} };
  const tipos = ['x', 'y'];
  assert.equal(asegurarApoyo(j, tipos).nivel.x, 3);
  for (let i = 0; i < 3; i++) registrarAcierto(j, tipos, 'x', false);
  assert.equal(j.apoyo.nivel.x, 2);
  registrarError(j, tipos, 'x'); registrarError(j, tipos, 'x');
  assert.equal(j.apoyo.nivel.x, 3);
  registrarAcierto(j, tipos, 'x', true); // con ayuda no cuenta
  assert.equal(j.apoyo.racha.x, 0);
});
prueba('perfil: el progreso se guarda por juego y no se mezcla', () => {
  const p = nuevoPerfil('Ana');
  terminarEjercicio(p, 'divisiones', r({ pasos: [{ tipo: 'mult', ok: true }] }));
  terminarEjercicio(p, 'divisiones', r({ errores: 1, pasos: [{ tipo: 'mult', ok: false }] }));
  terminarEjercicio(p, 'cuento', r({ revelada: true }));
  assert.equal(p.juegos.divisiones.estrellas, 5);
  assert.equal(p.juegos.cuento.estrellas, 1);
  assert.deepEqual(p.juegos.divisiones.stats.mult, { i: 2, e: 1 });
  assert.equal(p.juegos.divisiones.contadores.seguidasSinError, 0);
  assert.equal(totalEstrellas(p), 6);
});
prueba('medallas: se ganan una sola vez', () => {
  const p = nuevoPerfil('Ana');
  assert.equal(Medallas.ganar(p, 'primera'), true);
  assert.equal(Medallas.ganar(p, 'primera'), false);
  assert.equal(Medallas.ganar(p, 'no-existe'), false);
  Medallas.definir([{ id: 'maestro_resta', icono: '−', texto: 'Maestro de la resta', color: 'var(--lima)' }]);
  assert.equal(Medallas.ganar(p, 'maestro_resta'), true);
});

console.log(`\n${n} pruebas pasaron.`);
