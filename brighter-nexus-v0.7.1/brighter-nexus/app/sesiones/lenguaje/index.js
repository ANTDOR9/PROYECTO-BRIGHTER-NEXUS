// Sesión de lenguaje (primaria). Temas que piden las bases: el cuento, la noticia,
// la fábula, el periodismo y expresar lo observado.
export default {
  id: 'lenguaje',
  nombre: 'Lenguaje',
  escena: 'lenguaje',
  descripcion: 'El cuento, la noticia, la fábula, el periodismo y expresar lo observado.',
  juegos: [
    { id: 'cuento', nombre: 'El cuento', plantilla: 'ordenar-secuencia', estado: 'prototipo', actividad: 'lenguaje/cuento-ordenar.json' },
    { id: 'noticia', nombre: 'La noticia', plantilla: 'completar', estado: 'pendiente' },
    { id: 'fabula', nombre: 'La fábula', plantilla: 'emparejar', estado: 'pendiente' },
    { id: 'periodismo', nombre: 'El periodismo', plantilla: 'clasificar', estado: 'pendiente' },
    { id: 'expresar-observado', nombre: 'Expresar lo observado', plantilla: 'observar-expresar', estado: 'pendiente' }
  ]
};
