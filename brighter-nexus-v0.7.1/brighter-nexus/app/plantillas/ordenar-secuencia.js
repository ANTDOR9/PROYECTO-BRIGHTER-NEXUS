// Plantilla "ordenar secuencia": se tocan las tarjetas en el orden correcto (cuento, ciclo de vida, pasos…).
//
// Ejercicio: { instruccion, items: [en el orden correcto], etiquetas?: ["Inicio","Nudo","Desenlace"], explicacion }
// Tocar una tarjeta la lleva al primer lugar libre; tocar una tarjeta ya puesta la devuelve.
import { el, mezclar, ERRORES_PARA_REVELAR } from './comun.js';

export default {
  id: 'ordenar-secuencia',
  montar(zona, ejercicio, ctx) {
    const items = ejercicio.items;
    const n = items.length;
    const lugares = Array(n).fill(null);   // para cada lugar, el índice (en el orden correcto) de la tarjeta puesta
    const fijo = Array(n).fill(false);
    const ordenPool = mezclar(items.map((_, i) => i));
    let errores = 0, terminado = false, espera = false, temporizador = null;

    const caja = el('section', 'actividad');
    if (ctx.titulo) caja.appendChild(el('h3', null, ctx.titulo));
    caja.appendChild(el('p', 'pregunta', ejercicio.instruccion || 'Ordena las tarjetas.'));
    const lista = el('ol', 'lugares');
    const botonesLugar = items.map((_, i) => {
      const li = el('li');
      const b = el('button', 'lugar');
      b.type = 'button';
      const etiqueta = el('small', null, (ejercicio.etiquetas && ejercicio.etiquetas[i]) || `Paso ${i + 1}`);
      const texto = el('span', 'lugar-texto');
      b.append(etiqueta, texto);
      b.addEventListener('click', () => quitar(i));
      li.appendChild(b);
      lista.appendChild(li);
      return b;
    });
    const pool = el('div', 'banco tarjetas');
    const tarjetas = ordenPool.map(idx => {
      const t = el('button', 'ficha tarjeta', items[idx]);
      t.type = 'button';
      t.addEventListener('click', () => poner(idx));
      pool.appendChild(t);
      return { idx, t };
    });
    const comprobar = el('button', 'boton', 'Comprobar');
    comprobar.type = 'button';
    comprobar.addEventListener('click', verificar);
    const mensaje = el('p', 'mensaje');
    mensaje.setAttribute('aria-live', 'polite');

    function pintar() {
      botonesLugar.forEach((b, i) => {
        const v = lugares[i];
        b.querySelector('.lugar-texto').textContent = v == null ? 'Toca una tarjeta' : items[v];
        b.classList.toggle('lleno', v != null);
        b.classList.toggle('bien', fijo[i]);
        if (v == null) b.classList.remove('mal');
      });
      tarjetas.forEach(({ idx, t }) => { t.hidden = lugares.includes(idx); });
      comprobar.disabled = terminado || lugares.some(v => v == null);
    }
    function poner(idx) {
      if (terminado || espera) return;
      const libre = lugares.findIndex((v, i) => v == null && !fijo[i]);
      if (libre < 0) return;
      lugares[libre] = idx;
      pintar();
    }
    function quitar(i) {
      if (terminado || espera || fijo[i] || lugares[i] == null) return;
      lugares[i] = null;
      pintar();
    }
    function terminar(revelada) {
      terminado = true;
      pintar();
      mensaje.textContent = ejercicio.explicacion || '¡Muy bien!';
      ctx.reportar({
        errores, ayuda: false, revelada, tiempo: null,
        pasos: [{ tipo: 'ordenar', ok: errores === 0 }]
      });
    }
    function verificar() {
      if (terminado || espera) return;
      const malos = [];
      lugares.forEach((v, i) => { if (v === i) fijo[i] = true; else malos.push(i); });
      if (!malos.length) { terminar(false); return; }
      errores++;
      if (errores > ERRORES_PARA_REVELAR) {
        items.forEach((_, i) => { lugares[i] = i; fijo[i] = true; });
        terminar(true);
        return;
      }
      malos.forEach(i => botonesLugar[i].classList.add('mal'));
      mensaje.textContent = 'Las tarjetas en rojo no van ahí. Prueba otro orden.';
      espera = true;
      temporizador = setTimeout(() => {
        malos.forEach(i => { lugares[i] = null; });
        espera = false;
        pintar();
      }, 1100);
      pintar();
    }

    caja.append(lista, pool, comprobar, mensaje);
    zona.appendChild(caja);
    pintar();
    return () => clearTimeout(temporizador);
  }
};
