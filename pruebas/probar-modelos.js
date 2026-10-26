// Pruebas de la clasificación de licencias de los modelos 3D (no necesitan navegador ni instalar nada).
// Es la regla que decide qué modelos pueden ir en la licitación, así que se prueba con cuidado.
import assert from 'node:assert/strict';
import { clasificarLicencia } from '../herramientas/modelos.js';

let n = 0;
const caso = (nombre, fn) => { fn(); n++; console.log('ok   ', nombre); };
const c = clasificarLicencia;

caso('CC BY 4.0 (el texto de los visores) → ok y comercial', () => {
  const r = c('CC BY 4.0 (Creative Commons Atribución 4.0)');
  assert.equal(r.estado, 'ok'); assert.equal(r.comercial, true); assert.equal(r.codigo, 'CC BY 4.0');
});
caso('CC0 y dominio público → ok', () => {
  assert.equal(c('CC0 1.0').estado, 'ok');
  assert.equal(c('Dominio público').estado, 'ok');
});
caso('CC BY-NC → se excluye (no comercial)', () => {
  const r = c('CC BY-NC 4.0 (Atribución-NoComercial 4.0)');
  assert.equal(r.estado, 'excluir'); assert.equal(r.comercial, false);
});
caso('CC BY-NC-SA → se excluye', () => {
  const r = c('CC BY-NC-SA 4.0 (Atribución-NoComercial-CompartirIgual 4.0)');
  assert.equal(r.estado, 'excluir'); assert.equal(r.compartirIgual, true);
});
caso('CC BY-ND → se excluye (no permite comprimir ni modificar)', () => {
  const r = c('CC BY-ND 4.0');
  assert.equal(r.estado, 'excluir'); assert.equal(r.modificable, false);
});
caso('CC BY-SA → hay que revisarlo (no se excluye ni se aprueba solo)', () => {
  const r = c('CC BY-SA 4.0');
  assert.equal(r.estado, 'revisar'); assert.equal(r.comercial, true);
});
caso('escrito con guiones bajos, minúsculas o raros → se reconoce igual', () => {
  assert.equal(c('cc_by_nc 3.0').estado, 'excluir');
  assert.equal(c('cc-by 2.0').estado, 'ok');
});
caso('texto en español sin la sigla → NoComercial se detecta', () => {
  assert.equal(c('CC BY 4.0 Atribución NoComercial').estado, 'excluir');
});
caso('licencia desconocida o vacía → revisar a mano, nunca aprobada sola', () => {
  assert.equal(c('Licencia propietaria').estado, 'revisar');
  assert.equal(c('').estado, 'revisar');
  assert.equal(c(undefined).estado, 'revisar');
});
caso('"estándar" de Sketchfab (todos los derechos reservados) → revisar', () => {
  assert.equal(c('Standard').estado, 'revisar');
});

console.log(`\n${n} comprobaciones de licencias correctas`);
