// Arranque de Brighter Nexus.
import * as Almacen from './almacen.js';
import { nuevoPerfil } from './perfil.js';
import { contexto } from './contexto.js';
import { registrarSesion, registrarModulo } from './registro.js';
import { ruta, iniciar } from './enrutador.js';
import { logoSVG } from './logo.js';
import { pantallaSesion, pantallaJuego, pantallaModulo } from './pantallas.js';
import { introYaVista } from './intro.js';
import { pantallaEntrada, pantallaMenu, pantallaQuizPerezosa, pantallaPizarraNueva } from './pantallas-menu.js';
import { precargarEstilos } from './estilos-propios.js';
import { conectarQuiz } from './puente-quiz.js';

import matematica from '../sesiones/matematica/index.js';
import lenguaje from '../sesiones/lenguaje/index.js';
import ciencias from '../sesiones/ciencias/index.js';
import pizarra from '../modulos/pizarra/index.js';
import biblioteca3d, { pantallaVisor, pantallaCreditos } from '../modulos/biblioteca3d/index.js';
import mediateca from '../modulos/mediateca/index.js';
import juegos from '../modulos/juegos/index.js';

[matematica, lenguaje, ciencias].forEach(registrarSesion);
[pizarra, biblioteca3d, mediateca, juegos].forEach(registrarModulo);

async function arrancar() {
  const datos = await Almacen.preparar();
  // Por ahora todos juegan como "Invitado". La pantalla de alumnos llega después.
  let perfil = datos.alumnos.find(a => a.id === datos.ultimo) || datos.alumnos[0];
  if (!perfil) {
    perfil = nuevoPerfil('Invitado');
    datos.alumnos.push(perfil);
    datos.ultimo = perfil.id;
    Almacen.guardar();
  }
  contexto.perfil = perfil;

  precargarEstilos();
  conectarQuiz();      // las partidas del quiz suman al perfil del alumno
  document.getElementById('marca').innerHTML = `${logoSVG(52)}<div>Brighter Nexus<small>Plataforma educativa</small></div>`;
  document.getElementById('alumno').textContent = perfil.nombre;

  // Pantallas con diseño propio: carga, menú (y sus secciones) y quiz
  ruta('/intro', pantallaEntrada);
  ruta('/', pantallaMenu);
  ruta('/seccion/:id', pantallaMenu);
  ruta('/quiz', pantallaQuizPerezosa);
  ruta('/quiz/:juego', pantallaQuizPerezosa);
  ruta('/pizarra/nueva', pantallaPizarraNueva);
  ruta('/sesion/:id', pantallaSesion);
  ruta('/juego/:sesion/:juego', pantallaJuego);
  ruta('/modulo/:id', pantallaModulo);
  ruta('/biblioteca3d/ver/:id', pantallaVisor);
  ruta('/biblioteca3d/creditos', pantallaCreditos);

  // Al abrir la app (una vez por sesión) se ve primero la intro
  const destino = location.hash.slice(1);
  // replaceState cambia la dirección sin crear otra entrada en el historial (el botón "atrás" no vuelve a la nada)
  if (!introYaVista() && (destino === '' || destino === '/')) history.replaceState(null, '', '#/intro');
  iniciar(document.getElementById('app'));
}

arrancar();
