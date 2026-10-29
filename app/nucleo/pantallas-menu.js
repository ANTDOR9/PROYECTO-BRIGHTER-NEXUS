// Pantallas con diseño propio y su conexión con Nexus: carga, menú, quiz y "nueva clase" de la pizarra.
// Los estilos de cada una se activan solo mientras están a la vista (ver estilos-propios.js).
import { entrarPantallaPropia } from './estilos-propios.js';
import { fijarHash, ir } from './enrutador.js';
import { contexto } from './contexto.js';
import { seccionesDelMenu } from './menu-datos.js';
import { leerConfig, marcarVista, pantallaIntro } from './intro.js';
import { montarMenu } from '../menu/menu.js';
import { montarCargando } from '../menu/cargando.js';

const CLAVE_SALUDO = 'nexus.consejeroMenu';
const CLAVE_PIZARRA = 'brighterNexus.pizarra.v1';

// ---------- carga (la entrada a la app) ----------
export async function pantallaEntrada(params, cont) {
  const cfg = await leerConfig();
  if ((cfg.tipo === 'video' || cfg.tipo === 'imagen') && cfg.archivo) return pantallaIntro(params, cont);
  const salir = await entrarPantallaPropia('carga');
  const limpiar = montarCargando(cont, { alTerminar: () => { marcarVista(); ir('/'); } });
  return () => { limpiar(); salir(); };
}

// ---------- menú (#/ y #/seccion/:id) ----------
export async function pantallaMenu({ id }, cont) {
  const salir = await entrarPantallaPropia('menu');
  const secciones = seccionesDelMenu();
  let saludar = false;
  try { if (!sessionStorage.getItem(CLAVE_SALUDO)) { sessionStorage.setItem(CLAVE_SALUDO, '1'); saludar = true; } } catch (e) { /* sin almacenamiento: saluda siempre */ saludar = true; }
  const limpiar = montarMenu(cont, {
    secciones,
    seccionInicial: id && secciones.some(s => s.id === id) ? id : null,
    // abrir una sección o volver al círculo cambia la dirección sin volver a dibujar el menú
    alSeccion: s => fijarHash(s ? `/seccion/${s}` : '/'),
    nombre: contexto.perfil ? contexto.perfil.nombre : '',
    saludar
  });
  return () => { limpiar(); salir(); };
}

// ---------- quiz de ciencias (se carga cuando se necesita) ----------
export async function pantallaQuizPerezosa(params, cont) {
  const { pantallaQuiz } = await import('../quiz/pantalla.js');
  return pantallaQuiz(params, cont);
}

// ---------- pizarra: "Nueva clase" ----------
// La pizarra guarda sola la clase en curso. "Nueva clase" empieza en blanco; si ya hay trazos guardados,
// primero se pregunta (borrar una clase por un toque accidental sería una pérdida difícil de deshacer).
function hayClaseGuardada() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE_PIZARRA));
    return !!(g && Array.isArray(g.trazos) && g.trazos.length);
  } catch (e) { return false; }
}

export function pantallaPizarraNueva(_p, cont) {
  const abrir = () => location.replace('#/modulo/pizarra');   // reemplaza esta dirección: "atrás" no vuelve a preguntar
  if (!hayClaseGuardada()) {
    try { localStorage.removeItem(CLAVE_PIZARRA); } catch (e) { /* nada que borrar */ }
    abrir();
    return;
  }
  cont.innerHTML = `
    <div class="aviso-nueva" role="alertdialog" aria-labelledby="nueva-t" style="max-width:640px;margin:12vh auto;text-align:center">
      <h1 id="nueva-t">¿Empezar una clase nueva?</h1>
      <p class="lead" style="margin:0 auto 24px">Hay una clase guardada en la pizarra. Si empiezas una nueva, la guardada se borra.</p>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <button class="boton" type="button" data-accion="nueva">Empezar nueva</button>
        <button class="boton suave" type="button" data-accion="continuar">Continuar la guardada</button>
      </div>
    </div>`;
  cont.querySelector('[data-accion="nueva"]').addEventListener('click', () => {
    try { localStorage.removeItem(CLAVE_PIZARRA); } catch (e) { /* se abre igual */ }
    abrir();
  });
  cont.querySelector('[data-accion="continuar"]').addEventListener('click', abrir);
}
