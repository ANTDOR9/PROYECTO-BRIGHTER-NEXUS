// Una ronda es una actividad con varios ejercicios seguidos. Funciona con CUALQUIER plantilla:
// carga la plantilla, le pasa cada ejercicio, recibe el resultado, lo pasa por el motor de puntaje
// y al final muestra el resumen. Aquí es donde se ve que el puntaje es el mismo para todos los juegos.
import { cargarPlantilla } from '../plantillas/indice.js';
import { terminarEjercicio, registrarDia, asegurarJuego } from './perfil.js';
import { resumenRonda, estrellasDe } from './puntaje.js';
import * as Medallas from './medallas.js';
import { aviso } from './aviso.js';

const el = (tag, clase, texto) => {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
};
const filaEstrellas = n => {
  const f = el('span', 'estrellas');
  for (let i = 0; i < 3; i++) f.appendChild(el('span', i < n ? 'on' : 'off', '★'));
  f.setAttribute('aria-label', `${n} de 3 estrellas`);
  return f;
};

const TEXTO_PASO = { elegir: 'elegir la respuesta', completar: 'completar', ordenar: 'ordenar' };

export async function montarRonda(zona, actividad, { perfil, idJuego, guardar, volver }) {
  const plantilla = await cargarPlantilla(actividad.plantilla);
  const ejercicios = actividad.ejercicios;
  let limpiarEjercicio = null;
  let vivo = true;

  function nuevaMedalla(id) {
    if (Medallas.ganar(perfil, id)) {
      const m = Medallas.buscar(id);
      setTimeout(() => aviso(m.icono, `¡Nueva medalla: ${m.texto}!`), 600);
    }
  }

  function empezar() {
    asegurarJuego(perfil, idJuego);
    const resultados = [];
    let i = 0;

    const raiz = el('div', 'ronda');
    zona.innerHTML = '';
    zona.appendChild(raiz);

    function mostrarEjercicio() {
      if (!vivo) return;
      if (limpiarEjercicio) { limpiarEjercicio(); limpiarEjercicio = null; }
      raiz.innerHTML = '';
      const cab = el('div', 'ronda-cab');
      cab.appendChild(el('span', null, `Ejercicio ${i + 1} de ${ejercicios.length}`));
      const puntos = el('div', 'puntos-ronda');
      ejercicios.forEach((_, k) => puntos.appendChild(el('i', k < i ? 'hecho' : k === i ? 'actual' : '')));
      cab.appendChild(puntos);
      const total = resultados.reduce((a, r) => a + estrellasDe(r), 0);
      cab.appendChild(el('span', 'total-estrellas', `★ ${total}`));
      const cuerpo = el('div', 'ronda-cuerpo');
      const pie = el('div', 'ronda-pie');
      raiz.append(cab, cuerpo, pie);

      let reportado = false;
      const ctx = {
        titulo: actividad.titulo,
        reportar(resultado) {
          if (reportado) return;
          reportado = true;
          resultados.push(resultado);
          registrarDia(perfil);
          const estrellas = terminarEjercicio(perfil, idJuego, resultado);
          const j = perfil.juegos[idJuego];
          nuevaMedalla('primera');
          if (j.contadores.seguidasSinError >= 10) nuevaMedalla('diez_seguidas');
          guardar();
          pie.innerHTML = '';
          pie.appendChild(filaEstrellas(estrellas));
          const ultimo = i === ejercicios.length - 1;
          const sig = el('button', 'boton', ultimo ? 'Ver resultado' : 'Siguiente');
          sig.type = 'button';
          sig.addEventListener('click', () => { i++; ultimo ? resumen() : mostrarEjercicio(); });
          pie.appendChild(sig);
        }
      };
      try {
        const salida = plantilla.montar(cuerpo, ejercicios[i], ctx);
        if (typeof salida === 'function') limpiarEjercicio = salida;
      } catch (e) {
        cuerpo.appendChild(el('p', 'lead', `Este ejercicio tiene un problema: ${e.message}`));
        console.error(e);
      }
    }

    function resumen() {
      if (limpiarEjercicio) { limpiarEjercicio(); limpiarEjercicio = null; }
      const r = resumenRonda(resultados);
      const j = perfil.juegos[idJuego];
      j.rondas++;
      j.mejor = Math.max(j.mejor, r.estrellas);
      if (r.estrellas === r.maxEstrellas) nuevaMedalla('ronda_perfecta');
      guardar();

      raiz.innerHTML = '';
      const caja = el('section', 'actividad resumen');
      caja.appendChild(el('h3', null, 'Resultado de la ronda'));
      const grande = el('p', 'resumen-estrellas');
      grande.append(el('span', 'on', '★'), ` ${r.estrellas} de ${r.maxEstrellas}`);
      caja.appendChild(grande);
      const lineas = [`${r.sinErrores} de ${r.total} ejercicios sin errores.`];
      if (r.reveladas) lineas.push(`En ${r.reveladas} te mostramos la respuesta.`);
      if (r.peor) lineas.push(`Lo que más costó: ${TEXTO_PASO[r.peor] || r.peor}.`);
      else lineas.push('¡No te equivocaste en ningún paso!');
      lineas.forEach(t => caja.appendChild(el('p', 'mensaje', t)));
      const acciones = el('div', 'acciones');
      const otra = el('button', 'boton', 'Jugar otra vez');
      otra.type = 'button';
      otra.addEventListener('click', empezar);
      const salir = el('a', 'boton suave', 'Volver');
      salir.href = `#${volver}`;
      acciones.append(otra, salir);
      caja.appendChild(acciones);
      raiz.appendChild(caja);
    }

    mostrarEjercicio();
  }

  empezar();
  return () => { vivo = false; if (limpiarEjercicio) limpiarEjercicio(); };
}
