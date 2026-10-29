// Juegos: lugar reservado en la sección Jugar del menú. Aquí irán los juegos originales (acción y estrategia)
// con los retoques que se decidan; por ahora solo está el quiz de Ciencias (con el juego del conejo de fondo).
export default {
  id: 'juegos',
  nombre: 'Juegos',
  escena: 'inicio',
  descripcion: 'Acción y estrategia para aprender jugando.',
  estado: 'pendiente',
  seccion: 'jugar',
  seccionNombre: 'Jugar',
  montar(zona) {
    zona.innerHTML = '<p class="lead">Los juegos llegan pronto. Mientras tanto, prueba el <a href="#/quiz">Quiz de ciencias</a>.</p>';
  }
};
