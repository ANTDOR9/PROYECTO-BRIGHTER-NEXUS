// Plantilla "completar": se tocan fichas del banco para llenar los huecos de una frase u operación.
// Sirve para tablas de multiplicar, la noticia (qué, quién, cuándo, dónde), vocabulario de ciencias…
//
// Ejercicio: { texto: "6 × {} = {}", huecos: ["3", "18"], banco: ["3", "18", "9", "12"], explicacion }
// Cada {} es un hueco. Tocar una ficha llena el primer hueco libre; tocar un hueco devuelve la ficha.
import { el, ERRORES_PARA_REVELAR } from './comun.js';

export default {
  id: 'completar',
  montar(zona, ejercicio, ctx) {
    const partes = ejercicio.texto.split('{}');
    const n = partes.length - 1;
    const banco = ejercicio.banco.map(String);
    const huecos = ejercicio.huecos.map(String);
    if (n !== huecos.length) throw new Error('completar: la cantidad de {} no coincide con "huecos"');
    if (!huecos.every(h => banco.includes(h))) throw new Error('completar: falta una respuesta correcta en el banco');

    const estado = Array(n).fill(null);     // para cada hueco, el índice de la ficha puesta
    const fijo = Array(n).fill(false);      // huecos ya acertados
    let errores = 0, terminado = false, espera = false, temporizador = null;

    const caja = el('section', 'actividad');
    if (ctx.titulo) caja.appendChild(el('h3', null, ctx.titulo));
    if (ejercicio.instruccion) caja.appendChild(el('p', 'instruccion', ejercicio.instruccion));
    const linea = el('p', 'pregunta linea-huecos');
    const botonesHueco = [];
    partes.forEach((txt, i) => {
      if (txt) linea.appendChild(document.createTextNode(txt));
      if (i < n) {
        const h = el('button', 'hueco');
        h.type = 'button';
        h.setAttribute('aria-label', `Hueco ${i + 1}`);
        h.addEventListener('click', () => quitar(i));
        botonesHueco.push(h);
        linea.appendChild(h);
      }
    });
    const bancoEl = el('div', 'banco');
    const fichas = banco.map((txt, j) => {
      const f = el('button', 'ficha', txt);
      f.type = 'button';
      f.addEventListener('click', () => poner(j));
      bancoEl.appendChild(f);
      return f;
    });
    const comprobar = el('button', 'boton', 'Comprobar');
    comprobar.type = 'button';
    comprobar.addEventListener('click', verificar);
    const mensaje = el('p', 'mensaje');
    mensaje.setAttribute('aria-live', 'polite');

    function pintar() {
      botonesHueco.forEach((h, i) => {
        const j = estado[i];
        h.textContent = j == null ? '' : banco[j];
        h.classList.toggle('lleno', j != null);
        h.classList.toggle('bien', fijo[i]);
        if (j == null) h.classList.remove('mal');
      });
      fichas.forEach((f, j) => { f.disabled = estado.includes(j) || terminado; });
      comprobar.disabled = terminado || estado.some(j => j == null);
    }

    function poner(j) {
      if (terminado || espera) return;
      const libre = estado.findIndex((v, i) => v == null && !fijo[i]);
      if (libre < 0) return;
      estado[libre] = j;
      pintar();
    }
    function quitar(i) {
      if (terminado || espera || fijo[i] || estado[i] == null) return;
      estado[i] = null;
      pintar();
    }

    function terminar(revelada) {
      terminado = true;
      pintar();
      mensaje.textContent = ejercicio.explicacion || '¡Muy bien!';
      ctx.reportar({
        errores, ayuda: false, revelada, tiempo: null,
        pasos: [{ tipo: 'completar', ok: errores === 0 }]
      });
    }

    function verificar() {
      if (terminado || espera) return;
      const malos = [];
      estado.forEach((j, i) => { if (banco[j] === huecos[i]) fijo[i] = true; else malos.push(i); });
      if (!malos.length) { terminar(false); return; }
      errores++;
      if (errores > ERRORES_PARA_REVELAR) {
        // Se muestran las respuestas correctas
        const usadas = new Set(estado.filter((j, i) => fijo[i]));
        huecos.forEach((h, i) => {
          if (fijo[i]) return;
          const j = banco.findIndex((b, k) => b === h && !usadas.has(k));
          estado[i] = j; usadas.add(j); fijo[i] = true;
        });
        terminar(true);
        return;
      }
      malos.forEach(i => botonesHueco[i].classList.add('mal'));
      mensaje.textContent = 'Revisa las casillas en rojo.';
      espera = true;
      temporizador = setTimeout(() => {
        malos.forEach(i => { estado[i] = null; });
        espera = false;
        pintar();
      }, 900);
      pintar();
    }

    caja.append(linea, bancoEl, comprobar, mensaje);
    zona.appendChild(caja);
    pintar();
    return () => clearTimeout(temporizador);
  }
};
