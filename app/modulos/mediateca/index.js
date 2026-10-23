// Mediateca: videos, imágenes y audios por curso. Prioridad "Importante" en el informe técnico.
export default {
  id: 'mediateca',
  nombre: 'Mediateca',
  escena: 'mediateca',
  descripcion: 'Videos, imágenes y audios organizados por curso.',
  estado: 'pendiente',
  montar(zona) {
    zona.innerHTML = '<p class="lead">La mediateca se construye después del prototipo.</p>';
  }
};
