// Sesión de matemática (primaria). Temas que piden las bases: multiplicación, división,
// sistema decimal, población y muestra, formando triángulos. Más 12 clases en modalidad clase-juego.
// Un juego con "actividad" se abre con el corredor de rondas; uno con "cargar" trae su propio código.
export default {
  id: 'matematica',
  nombre: 'Matemática',
  escena: 'matematica',
  descripcion: 'Multiplicación, división, sistema decimal, población y muestra, y formando triángulos.',
  juegos: [
    { id: 'multiplicacion', nombre: 'Multiplicación', plantilla: 'completar', estado: 'prototipo', actividad: 'matematica/multiplicacion-completar.json' },
    { id: 'divisiones', nombre: 'Divisiones', plantilla: 'galera', estado: 'por-migrar', cargar: () => import('./divisiones/index.js') },
    { id: 'sistema-decimal', nombre: 'Sistema decimal', plantilla: 'manipulativo', estado: 'pendiente' },
    { id: 'poblacion-muestra', nombre: 'Población y muestra', plantilla: 'clasificar', estado: 'pendiente' },
    { id: 'formando-triangulos', nombre: 'Formando triángulos', plantilla: 'manipulativo', estado: 'pendiente' }
  ]
};
