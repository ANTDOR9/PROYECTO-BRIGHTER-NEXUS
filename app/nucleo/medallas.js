// Medallas comunes a todos los juegos, más las que cada juego quiera agregar con definir().

const catalogo = new Map();

export function definir(lista) {
  lista.forEach(m => catalogo.set(m.id, m));
}

definir([
  { id: 'primera', icono: '1', texto: 'Primer ejercicio', color: 'var(--amarillo)' },
  { id: 'diez_seguidas', icono: '10', texto: '10 seguidos sin error', color: 'var(--cian)' },
  { id: 'ronda_perfecta', icono: '★', texto: 'Ronda perfecta', color: 'var(--amarillo)' },
  { id: 'solo', icono: '★', texto: 'Lo hice solo', color: 'var(--amarillo)' },
  { id: 'sin_ruedas', icono: '5', texto: 'Sin ruedas', color: 'var(--lima)' },
  { id: 'racha7', icono: '7', texto: '7 días seguidos', color: 'var(--rosa)' }
]);

export const lista = () => [...catalogo.values()];
export const buscar = id => catalogo.get(id);

// Da la medalla si el alumno aún no la tiene. Devuelve true si es nueva.
export function ganar(perfil, id, fecha = new Date().toISOString().slice(0, 10)) {
  if (!catalogo.has(id) || perfil.medallas[id]) return false;
  perfil.medallas[id] = fecha;
  return true;
}
