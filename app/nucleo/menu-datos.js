// Arma las secciones del menú (Aprender, Explorar 3D, Jugar, Pizarra) a partir del registro de Nexus.
// - Aprender: una tarjeta por cada sesión registrada (si mañana se agrega una sesión, aparece sola).
// - Explorar 3D: los módulos que se declaran con seccion: 'explorar'.
// - Jugar y Pizarra: sus opciones están aquí (el quiz y la pizarra no son sesiones ni módulos "normales").
// Los colores, íconos y textos de los botones del círculo son del diseño del menú (menu/menu.js).
import { listaSesiones, listaModulos } from './registro.js';

const V = 'var(--verde)', C = 'var(--coral)', A = 'var(--ambar)', R = 'var(--rojo-osc)';

// Cómo se ve cada sesión en el menú. Una sesión nueva sin entrada aquí usa el valor 'otra'.
const SESION = {
  matematica: { icono: 'i-mate', color: V, descripcion: 'Números, operaciones y problemas' },
  lenguaje: { icono: 'i-lenguaje', color: C, descripcion: 'Leer, escribir y comunicar' },
  ciencias: { icono: 'i-ciencia', color: A, descripcion: 'Naturaleza, cuerpo y energía' },
  otra: { icono: 'i-libro', color: R, descripcion: '' }
};
const MODULO = {
  biblioteca3d: { icono: 'i-cubo', descripcion: 'Modelos para girar y acercar' },
  mediateca: { icono: 'i-media', descripcion: 'Videos, imágenes y sonidos' }
};

export function seccionesDelMenu() {
  const aprender = listaSesiones().map(s => {
    const d = SESION[s.id] || SESION.otra;
    return { ruta: `/sesion/${s.id}`, nombre: s.nombre, descripcion: d.descripcion || s.descripcion, icono: d.icono, color: d.color };
  });
  const explorar = listaModulos().filter(m => m.seccion === 'explorar').map(m => {
    const d = MODULO[m.id] || {};
    return { ruta: `/modulo/${m.id}`, nombre: m.nombre, descripcion: d.descripcion || m.descripcion, icono: d.icono || 'i-cubo', color: R };
  });

  return [
    { id: 'aprender', color: V, icono: 'i-libro', cols: Math.min(3, Math.max(2, aprender.length)),
      titulo: 'Aprender', apoyo: 'Elige una materia para empezar', resumen: 'Guiado por materia',
      resumenLargo: 'Matemática, Lenguaje y Ciencias', items: aprender },
    { id: 'explorar', color: A, icono: 'i-cubo', cols: 2,
      titulo: 'Explorar 3D', apoyo: 'Mira, gira y descubre', resumen: 'Modelos y medios',
      resumenLargo: 'Biblioteca 3D y Mediateca', items: explorar },
    { id: 'jugar', color: C, icono: 'i-mando', cols: 2,
      titulo: 'Jugar', apoyo: 'Aprende jugando', resumen: 'Quiz y juegos',
      resumenLargo: 'Quiz y Juegos',
      items: [
        { ruta: '/quiz', nombre: 'Quiz', descripcion: 'Rondas rápidas de preguntas', icono: 'i-quiz', color: R, etiqueta: 'Ciencias' },
        { ruta: '/modulo/juegos', nombre: 'Juegos', descripcion: 'Acción y estrategia', icono: 'i-mando', color: R, etiqueta: 'Pronto' }
      ] },
    { id: 'pizarra', color: R, icono: 'i-pizarra', cols: 2,
      titulo: 'Pizarra', apoyo: 'Tu espacio para explicar', resumen: 'Explica y dibuja',
      resumenLargo: 'Pizarra',
      items: [
        { ruta: '/pizarra/nueva', nombre: 'Nueva clase', descripcion: 'Empieza con una pizarra en blanco', icono: 'i-nueva', color: R },
        { ruta: '/modulo/pizarra', nombre: 'Continuar clase', descripcion: 'Retoma donde la dejaste', icono: 'i-seguir', color: R }
      ] }
  ];
}
