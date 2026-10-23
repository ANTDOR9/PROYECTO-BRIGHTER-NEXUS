// Plantilla "elegir": una pregunta y varias opciones. Sirve para opción múltiple y verdadero/falso.
//
// Ejercicio: { pregunta, opciones: [..], correcta: indice, explicacion }
// Al 4.º error muestra la respuesta (revelada), igual que el juego de divisiones.
import { el, ERRORES_PARA_REVELAR } from './comun.js';

export default {
  id: 'elegir',
  montar(zona, ejercicio, ctx) {
    let errores = 0;
    let terminado = false;
    const caja = el('section', 'actividad');
    const pregunta = el('p', 'pregunta', ejercicio.pregunta);
    const opciones = el('div', 'opciones');
    const mensaje = el('p', 'mensaje');
    mensaje.setAttribute('aria-live', 'polite');
    if (ctx.titulo) caja.appendChild(el('h3', null, ctx.titulo));

    const botones = ejercicio.opciones.map((texto, i) => {
      const b = el('button', 'opcion', texto);
      b.type = 'button';
      b.addEventListener('click', () => responder(i));
      opciones.appendChild(b);
      return b;
    });

    function terminar(revelada) {
      terminado = true;
      botones.forEach(b => { b.disabled = true; });
      botones[ejercicio.correcta].classList.add('bien');
      mensaje.textContent = ejercicio.explicacion || '¡Muy bien!';
      ctx.reportar({
        errores, ayuda: false, revelada, tiempo: null,
        pasos: [{ tipo: 'elegir', ok: errores === 0 }]
      });
    }

    function responder(i) {
      if (terminado) return;
      if (i === ejercicio.correcta) { terminar(false); return; }
      errores++;
      botones[i].classList.add('mal');
      botones[i].disabled = true;
      if (errores > ERRORES_PARA_REVELAR) terminar(true);
      else mensaje.textContent = 'Casi. Prueba con otra opción.';
    }

    caja.append(pregunta, opciones, mensaje);
    zona.appendChild(caja);
  }
};
