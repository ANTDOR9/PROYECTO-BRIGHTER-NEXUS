// Pantallas comunes: sesión, juego y módulo. (El inicio es el menú: nucleo/pantallas-menu.js)
import { aplicarEscena } from './fondo.js';
import { buscarSesion, buscarModulo, buscarJuego } from './registro.js';
import { contexto } from './contexto.js';
import { guardar } from './almacen.js';
import { montarRonda } from './ronda.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLOR = { matematica: 'var(--cian)', lenguaje: 'var(--rosa)', ciencias: 'var(--lima)', biblioteca3d: 'var(--naranja)', pizarra: 'var(--amarillo)', mediateca: 'var(--violeta)' };
const ETIQUETA = { pendiente: 'Pendiente', 'por-migrar': 'Por migrar', prototipo: 'Prototipo', listo: 'Listo' };

const enlaceVolver = (destino, texto) => `<p class="migas"><a href="#${destino}">← ${esc(texto)}</a></p>`;

function tarjeta(destino, { id, nombre, descripcion, estado, color }) {
  const insignia = estado ? `<em class="insignia ${estado}">${ETIQUETA[estado] || esc(estado)}</em>` : '';
  return `<a class="tarjeta" href="#${destino}" style="--c:${color || COLOR[id] || 'var(--acento)'};text-decoration:none">
    <b>${esc(nombre)}</b><span>${esc(descripcion || '')}</span>${insignia}</a>`;
}

export function pantallaSesion({ id }, cont) {
  const s = buscarSesion(id);
  if (!s) { location.hash = '#/'; return; }
  aplicarEscena(s.escena);
  cont.innerHTML = `${enlaceVolver('/seccion/aprender', 'Aprender')}
    <h1>${esc(s.nombre)}</h1><p class="lead">${esc(s.descripcion)}</p>
    <div class="rejilla">${s.juegos.map(j => tarjeta(j.ruta || `/juego/${s.id}/${j.id}`, { id: s.id, nombre: j.nombre, descripcion: `Plantilla: ${j.plantilla}`, estado: j.estado, color: j.color })).join('')}</div>`;
}

export async function pantallaJuego({ sesion, juego }, cont) {
  const s = buscarSesion(sesion), j = buscarJuego(sesion, juego);
  if (!s || !j) { location.hash = '#/'; return; }
  aplicarEscena(s.escena);
  if (j.color) cont.style.setProperty('--acento', j.color);   // cada tema de matemática tiene su color
  cont.innerHTML = enlaceVolver(`/sesion/${s.id}`, s.nombre) + `<h1>${esc(j.nombre)}</h1>`;
  const zona = document.createElement('div');
  cont.appendChild(zona);
  const volver = `/sesion/${s.id}`;
  const idJuego = `${s.id}/${j.id}`;

  if (j.actividad) {
    try {
      const respuesta = await fetch(`contenido/${j.actividad}`);
      if (!respuesta.ok) throw new Error(`No se encontró ${j.actividad}`);
      const actividad = await respuesta.json();
      return montarRonda(zona, actividad, { perfil: contexto.perfil, idJuego, guardar, volver });
    } catch (e) {
      console.error(e);
      zona.innerHTML = `<p class="lead">No se pudo abrir la actividad. ${esc(e.message)}</p>`;
      return;
    }
  }
  if (j.cargar) {
    const modulo = (await j.cargar()).default;
    return modulo.montar(zona, { perfil: contexto.perfil, sesion: s, juego: j, guardar });
  }
  zona.innerHTML = `<p class="lead">En construcción. Usará la plantilla <b>${esc(j.plantilla)}</b>.</p>`;
}

export function pantallaModulo({ id }, cont) {
  const m = buscarModulo(id);
  if (!m) { location.hash = '#/'; return; }
  aplicarEscena(m.escena);
  // Cada módulo vuelve a la sección del menú donde está (Explorar 3D, Jugar, Pizarra)
  const destino = m.seccion ? `/seccion/${m.seccion}` : '/';
  const nombreDestino = m.seccion ? m.seccionNombre || 'Inicio' : 'Inicio';
  if (m.compacto) {
    // Herramientas que necesitan toda la pantalla (pizarra, visor 3D): encabezado en una sola línea
    cont.innerHTML = `<div class="cab-compacta"><a class="volver" href="#${destino}">← ${esc(nombreDestino)}</a><h1>${esc(m.nombre)}</h1></div>`;
  } else {
    cont.innerHTML = `${enlaceVolver(destino, nombreDestino)}<h1>${esc(m.nombre)}</h1><p class="lead">${esc(m.descripcion)}</p>`;
  }
  const zona = document.createElement('div');
  cont.appendChild(zona);
  return m.montar(zona, { perfil: contexto.perfil });
}
