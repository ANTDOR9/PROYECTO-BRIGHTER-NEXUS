// Plantillas: formas reutilizables de actividad. Una plantilla sirve para muchos temas:
// solo cambia el JSON de contenido. Contrato de cada plantilla (archivo <id>.js):
//
//   export default { id, montar(zona, ejercicio, ctx) }     // puede devolver una función para limpiar
//   ctx.reportar({ errores, ayuda, revelada, tiempo, pasos })  al terminar cada ejercicio
//   ctx.titulo                                                 título de la actividad (opcional)
//
// Estado: 'listo' = hay archivo, 'pendiente' = por construir.
export const PLANTILLAS = [
  { id: 'elegir', nombre: 'Elegir', estado: 'listo' },
  { id: 'completar', nombre: 'Completar', estado: 'listo' },
  { id: 'columnas', nombre: 'Columnas (multiplicación paso a paso)', estado: 'listo' },
  { id: 'ordenar-secuencia', nombre: 'Ordenar secuencia', estado: 'listo' },
  { id: 'clasificar', nombre: 'Clasificar', estado: 'pendiente' },
  { id: 'emparejar', nombre: 'Emparejar', estado: 'pendiente' },
  { id: 'etiquetar', nombre: 'Etiquetar (imagen o modelo 3D)', estado: 'pendiente' },
  { id: 'manipulativo', nombre: 'Manipulativo de matemática', estado: 'pendiente' },
  { id: 'simulacion', nombre: 'Simulación simple', estado: 'pendiente' },
  { id: 'clase-juego', nombre: 'Clase-juego (retos con puntaje por equipos)', estado: 'pendiente' },
  { id: 'observar-expresar', nombre: 'Observar y expresar', estado: 'pendiente' },
  // Plantilla propia que viene del juego de divisiones
  { id: 'galera', nombre: 'Galera (división paso a paso)', estado: 'pendiente' }
];

export async function cargarPlantilla(id) {
  const p = PLANTILLAS.find(x => x.id === id);
  if (!p || p.estado !== 'listo') throw new Error(`La plantilla "${id}" aún no existe`);
  return (await import(`./${id}.js`)).default;
}
