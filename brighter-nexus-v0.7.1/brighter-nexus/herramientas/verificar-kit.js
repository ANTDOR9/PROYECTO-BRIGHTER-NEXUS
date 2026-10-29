// Cuenta las actividades de app/contenido/ y las compara con lo que piden las bases (kit-requisitos.json).
// Uso: npm run kit
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'contenido');
const kit = JSON.parse(readFileSync(join(raiz, 'kit-requisitos.json'), 'utf8'));

function archivos(dir) {
  return readdirSync(dir).flatMap(n => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : ruta.endsWith('.json') ? [ruta] : [];
  });
}

// Una actividad es un JSON con id, nivel y curso. Los ejemplos no cuentan.
const actividades = archivos(raiz)
  .filter(f => !f.endsWith('kit-requisitos.json'))
  .map(f => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } })
  .filter(a => a && a.id && a.nivel && a.curso && !a.ejemplo);

let faltanTotal = 0;
console.log(`Actividades encontradas: ${actividades.length}\n`);
kit.requisitos.forEach(r => {
  const f = r.filtro;
  const cumplen = actividades.filter(a => a.nivel === f.nivel && f.cursos.includes(a.curso) && a.modalidad === f.modalidad);
  const falta = Math.max(0, r.minimo - cumplen.length);
  faltanTotal += falta;
  console.log(`${falta === 0 ? 'OK ' : '-- '} ${r.descripcion}: ${cumplen.length}/${r.minimo}`);
  (r.dimensiones || []).forEach(d => {
    console.log(`       · ${d}: ${cumplen.filter(a => a.dimension === d).length}`);
  });
});
console.log(`\nFaltan ${faltanTotal} actividades para cumplir el mínimo.`);
