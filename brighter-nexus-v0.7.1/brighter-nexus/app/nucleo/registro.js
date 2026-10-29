// Qué sesiones (matemática, lenguaje, ciencias…) y módulos (pizarra, biblioteca 3D…) tiene la app.
// Para agregar una sesión nueva: crear su manifiesto en sesiones/<id>/index.js y registrarla en app.js.

const sesiones = new Map();
const modulos = new Map();

export const registrarSesion = m => { sesiones.set(m.id, m); };
export const registrarModulo = m => { modulos.set(m.id, m); };

export const listaSesiones = () => [...sesiones.values()];
export const listaModulos = () => [...modulos.values()];
export const buscarSesion = id => sesiones.get(id) || null;
export const buscarModulo = id => modulos.get(id) || null;
export const buscarJuego = (idSesion, idJuego) => {
  const s = sesiones.get(idSesion);
  return s ? s.juegos.find(j => j.id === idJuego) || null : null;
};
