// Pantalla del quiz de Ciencias (con su juego de fondo). Es el "main.js" de la pantalla de juegos, conectado a Nexus:
//  • corre dentro de la pantalla que entrega el enrutador (no toma la página completa),
//  • los estilos de Nexus se apagan mientras está a la vista (nucleo/estilos-propios.js),
//  • cambiar de juego o de tema NO recarga la pantalla: se cambia la dirección con fijarHash,
//  • salir en plena partida pide confirmación (proteger),
//  • las partidas terminadas pasan al perfil del alumno (nucleo/puente-quiz.js).
//
// Direcciones:  #/quiz                       el último juego y tema usados
//               #/quiz/conejo?tema=seres-vivos
//               #/quiz/ninguno?tema=seres-vivos   (solo el quiz, sin juego)
import { crearPanel } from './js/panel.js';
import { h, confirmar } from './js/ui.js';
import { almacen } from './js/nucleo/almacen.js';
import { crearConsejero } from './js/consejero.js';
import { abrirAjustes } from './js/ajustes.js';
import { ICONOS } from './iconos.js';
import { entrarPantallaPropia } from '../nucleo/estilos-propios.js';
import { fijarHash, proteger } from '../nucleo/enrutador.js';

const LOGO = new URL('./img/logo.png', import.meta.url).href;

const PLANTILLA = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${ICONOS}</defs></svg>
  <div class="fondo" aria-hidden="true"><i class="tri t1"></i><i class="tri t2"></i><i class="tri t3"></i></div>
  <header class="barra">
    <a class="btn-inicio" id="btnInicio" href="#/" aria-label="Inicio" title="Inicio">
      <span class="logo"><img src="${LOGO}" alt="" width="256" height="256"></span>
    </a>
    <div class="usuario" id="usuario">
      <div class="modos vidrio" id="modos" role="group" aria-label="Modo de uso">
        <button class="btn btn-circ" type="button" data-modo="estudiante" aria-label="Modo estudiante" aria-pressed="true"><svg class="ico" aria-hidden="true"><use href="#i-estudiante"/></svg></button>
        <button class="btn btn-circ" type="button" data-modo="tutor" aria-label="Modo tutor" aria-pressed="false"><svg class="ico" aria-hidden="true"><use href="#i-tutor"/></svg></button>
        <span class="sep" aria-hidden="true"></span>
        <button class="btn btn-circ" type="button" id="btnAjustes" aria-label="Configuración" title="Configuración"><svg class="ico" aria-hidden="true"><use href="#i-ajustes"/></svg></button>
      </div>
      <button class="btn-usuario vidrio" id="btnUsuario" type="button" aria-label="Cambiar modo de uso" aria-expanded="false"><svg class="ico" aria-hidden="true"><use href="#i-usuario"/></svg></button>
    </div>
  </header>
  <div class="quiz-raiz" id="quiz-raiz"></div>`;

export async function pantallaQuiz({ juego, q }, cont) {
  const salirEstilos = await entrarPantallaPropia('quiz');
  cont.innerHTML = PLANTILLA;
  const app = cont.querySelector('#quiz-raiz');
  const usuario = cont.querySelector('#usuario');
  const btnUsuario = cont.querySelector('#btnUsuario');
  const botonesModo = [...cont.querySelectorAll('[data-modo]')];
  let panel = null;
  let vivo = true;
  const temporizadores = [];

  // ---- Modo estudiante / tutor (misma clave que el menú) ----
  function aplicarModo(modo, avisar = true) {
    document.body.classList.toggle('tutor', modo === 'tutor');
    botonesModo.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
    almacen.guardar('nexus-modo', modo);
    if (avisar && panel) panel.refrescarModo();
    if (avisar && modo === 'tutor') consejero.decir({ id: 'tutor', titulo: 'Modo tutor', texto: 'Vidas infinitas y la respuesta correcta brilla suave.', objetivo: '#btnUsuario' });
  }
  btnUsuario.addEventListener('click', () => {
    const abierto = usuario.classList.toggle('abierto');
    btnUsuario.setAttribute('aria-expanded', String(abierto));
  });
  botonesModo.forEach(b => b.addEventListener('click', () => aplicarModo(b.dataset.modo)));

  // ---- Consejero (ave con globo): explica botones unos segundos ----
  const consejero = crearConsejero();
  cont.querySelector('#btnAjustes').addEventListener('click', () => abrirAjustes({ consejero }));
  function consejosDeBienvenida() {
    // Un solo consejo, elegido al azar y con poca probabilidad: el consejero no debe estorbar.
    const opciones = [
      { id: 'inicio', titulo: 'Inicio', texto: 'Toca el logo para volver al menú.', objetivo: '#btnInicio' },
      { id: 'juego', titulo: 'Juego', texto: 'Enciende o apaga el juego. El quiz sigue igual.', objetivo: '.opc.power' },
      { id: 'perfil', titulo: 'Tu perfil', texto: 'Cambia entre estudiante y tutor, o abre la configuración.', objetivo: '#btnUsuario' },
    ];
    consejero.decir({ ...opciones[Math.floor(Math.random() * opciones.length)], prob: 0.4 });
  }

  // ---- Cambios de juego y tema sin recargar la pantalla ----
  const corregir = () => { if (panel && vivo) fijarHash(panel.ruta().slice(1)); };
  const navegar = (j, t) => { if (panel && vivo) panel.aplicar({ juego: j, tema: t }); };
  panel = crearPanel(app, { navegar, corregir, consejero });

  // ---- Salir en plena partida pide confirmación (botón Inicio, atrás del navegador, otra tarjeta…) ----
  proteger(async () => {
    if (!panel || !panel.enCurso()) return true;
    return confirmar({ titulo: '¿Salir de la partida?', texto: 'Se pierde el avance.', si: 'Salir', no: 'Seguir jugando' });
  });

  aplicarModo(almacen.leer('nexus-modo', 'estudiante'), false);
  await panel.aplicar({ juego: juego || null, tema: q.get('tema') });
  if (!vivo) return () => {};
  temporizadores.push(setTimeout(consejosDeBienvenida, 9000));

  return () => {
    vivo = false;
    temporizadores.forEach(clearTimeout);
    consejero.destruir();
    const p = panel;
    panel = null;
    p.cerrar().finally(() => {
      document.querySelectorAll('dialog').forEach(d => d.remove());
    });
    salirEstilos();
  };
}
