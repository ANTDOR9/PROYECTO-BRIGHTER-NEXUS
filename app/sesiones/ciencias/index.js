// Sesión de ciencias. Las bases piden tres dimensiones: vida, física y química, Tierra y Universo
// (30 actividades en primaria y 10 en secundaria). Cada dimensión usa varias plantillas
// y se apoya en la biblioteca 3D (corazón, célula, sistema solar…).
export default {
  id: 'ciencias',
  nombre: 'Ciencias',
  escena: 'ciencias',
  descripcion: 'Vida, física y química, Tierra y Universo.',
  juegos: [
    { id: 'vida', nombre: 'Vida · La célula', plantilla: 'elegir', estado: 'prototipo', actividad: 'ciencias/celula-elegir.json' },
    { id: 'fisica-quimica', nombre: 'Física y química', plantilla: 'simulacion · elegir · clasificar', estado: 'pendiente' },
    { id: 'tierra-universo', nombre: 'Tierra y Universo', plantilla: 'etiquetar · ordenar-secuencia · simulacion', estado: 'pendiente' }
  ]
};
