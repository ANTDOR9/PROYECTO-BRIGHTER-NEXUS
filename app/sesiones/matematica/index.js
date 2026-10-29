// Sesión de matemática (primaria). Temas que piden las bases: multiplicación, división,
// sistema decimal, población y muestra, formando triángulos. Más 12 clases en modalidad clase-juego.
// Un juego con "actividad" se abre con el corredor de rondas; uno con "cargar" trae su propio código.
export default {
  id: 'matematica',
  nombre: 'Matemática',
  escena: 'matematica',
  descripcion: 'Multiplicación, división, sistema decimal, población y muestra, y formando triángulos.',
  juegos: [
    // Cada tema tiene su propio color (campo "color") para distinguirlo de los demás; el estilo es el mismo
    { id: 'multiplicacion', nombre: 'Multiplicación en columnas', plantilla: 'columnas', estado: 'prototipo', color: '#FF8A3D', actividad: 'matematica/multiplicacion-columnas.json' },
    { id: 'tablas', nombre: 'Tablas de multiplicar', plantilla: 'completar', estado: 'prototipo', color: '#FF8A3D', actividad: 'matematica/multiplicacion-completar.json' },
    { id: 'divisiones', nombre: 'Divisiones', plantilla: 'galera', estado: 'prototipo', color: '#B8FF3B', cargar: () => import('./divisiones/index.js') },
    { id: 'sistema-decimal', nombre: 'Sistema decimal', plantilla: 'manipulativo', estado: 'pendiente', color: '#22D3EE' },
    { id: 'poblacion-muestra', nombre: 'Población y muestra', plantilla: 'clasificar', estado: 'pendiente', color: '#FF4FB8' },
    { id: 'formando-triangulos', nombre: 'Formando triángulos', plantilla: 'manipulativo', estado: 'pendiente', color: '#FFD83B' }
  ]
};
