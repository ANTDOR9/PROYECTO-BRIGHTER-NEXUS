// Divisiones por el método de la galera (juego de nasa-cell), tal cual se diseñó.
//
// El juego va completo en ./juego (sin cambios) y se muestra a pantalla completa dentro de un marco, igual que los
// modelos 3D: así conserva su propia estética (Nunito/Lilita One, colores y símbolos flotantes), sus alumnos, su
// aprendizaje, sus pistas y su informe PDF, y no se mezcla con los estilos de Nexus.
// Nexus solo pone el botón "← Matemática" arriba al centro y anota en el perfil las divisiones que se hicieron.
//
// Los datos del juego viven en localStorage ('juegoDivisiones.v1'), que el marco comparte con Nexus (mismo origen).
import { asegurarJuego, registrarDia } from '../../../nucleo/perfil.js';

export const TIPOS = ['cabe', 'mult', 'restar', 'bajar'];
const CLAVE = 'juegoDivisiones.v1';
const URL_JUEGO = 'sesiones/matematica/divisiones/juego/index.html';

function divisionesHechas() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    return (d && Array.isArray(d.alumnos) ? d.alumnos : []).reduce((t, p) => t + ((p && p.contadores && Number(p.contadores.divisiones)) || 0), 0);
  } catch (e) { return 0; }
}

export default {
  id: 'divisiones',
  tipos: TIPOS,
  montar(zona, ctx = {}) {
    const antes = divisionesHechas();
    document.body.classList.add('en-visor3d');          // oculta la barra de Nexus y deja el marco a pantalla completa
    const marco = document.createElement('iframe');
    marco.className = 'visor3d-marco marco-juego';
    marco.title = 'Juego de Divisiones';
    marco.src = URL_JUEGO;
    marco.setAttribute('allow', 'fullscreen');
    const volver = document.createElement('a');
    volver.className = 'visor3d-volver';
    volver.href = '#/sesion/matematica';
    volver.textContent = '← Matemática';
    // Se quita el título y el enlace "volver" que la pantalla de juegos puso encima del marco
    zona.parentElement && zona.parentElement.querySelectorAll(':scope > h1, :scope > .migas, :scope > .volver').forEach(e => { e.hidden = true; });
    zona.append(marco, volver);

    return () => {
      document.body.classList.remove('en-visor3d');
      try { marco.src = 'about:blank'; } catch (e) { /* ya cerrado */ }
      marco.remove();
      // Lo hecho en esta visita pasa al perfil de Nexus (mismo formato que las demás actividades)
      const hechas = divisionesHechas() - antes;
      if (hechas > 0 && ctx.perfil) {
        const j = asegurarJuego(ctx.perfil, 'matematica/divisiones', TIPOS);
        j.contadores.ejercicios += hechas;
        j.rondas += 1;
        registrarDia(ctx.perfil);
        if (typeof ctx.guardar === 'function') ctx.guardar();
      }
    };
  }
};
