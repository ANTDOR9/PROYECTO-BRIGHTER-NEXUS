// Plantilla "columnas": multiplicación en columnas, paso a paso (mismo espíritu que la galera de divisiones).
//
// Ejercicio: { a: 358, b: 7 }  o  { a: 47, b: 36 }   (b de una o dos cifras)
// Cada paso pide UN número: "7 × 8 + 3 = ?". El juego escribe la cifra en su casilla y muestra lo que se lleva.
// Con multiplicador de dos cifras hay dos filas parciales y al final se suman por columnas.
import { el, ERRORES_PARA_REVELAR } from './comun.js';

const cifras = n => String(n).split('').map(Number);

// Convierte el ejercicio en una lista de pasos y en la cuadrícula donde se van escribiendo
function construir({ a, b }) {
  const A = cifras(a), B = cifras(b);
  const total = a * b;
  const C = Math.max(String(total).length, A.length + B.length) + 1;   // columnas (la primera es para el ×)
  const filas = { llevada: 0, a: 1, b: 2, linea1: 3, parcial0: 4 };
  const nParciales = B.length;
  const filaSuma = 4 + nParciales + 1;                                  // tras la segunda línea
  const col = k => C - 1 - k;                                           // k = 0 es la columna de las unidades
  const celdas = {};                                                    // clave "f,c" -> texto inicial
  A.forEach((d, i) => { celdas[`1,${col(A.length - 1 - i)}`] = String(d); });
  B.forEach((d, i) => { celdas[`2,${col(B.length - 1 - i)}`] = String(d); });
  celdas['2,0'] = '×';

  const pasos = [];
  const parciales = [];                                                 // valores de cada fila parcial, por columna
  for (let j = 0; j < B.length; j++) {
    const bj = B[B.length - 1 - j];
    let lleva = 0;
    const fila = {};
    for (let i = 0; i < A.length; i++) {
      const ai = A[A.length - 1 - i];
      const t = bj * ai + lleva;
      const ultimo = i === A.length - 1;
      pasos.push({
        tipo: 'mult', respuesta: t,
        pregunta: lleva ? `${bj} × ${ai} + ${lleva} (lo que llevas) = ?` : `${bj} × ${ai} = ?`,
        pista: `${bj} × ${ai} = ${bj * ai}${lleva ? `, y ${bj * ai} + ${lleva} = ${t}` : ''}`,
        foco: [`1,${col(i)}`, `2,${col(B.length - 1 - j)}`],
        escribe: ultimo
          ? String(t).split('').reverse().map((c, k) => [`${4 + j},${col(i + j + k)}`, c])
          : [[`${4 + j},${col(i + j)}`, String(t % 10)]],
        lleva: ultimo ? null : { celda: `0,${col(i + 1)}`, valor: Math.floor(t / 10) }
      });
      fila[i + j] = t % 10;
      if (ultimo) String(t).split('').reverse().forEach((c, k) => { fila[i + j + k] = Number(c); });
      lleva = Math.floor(t / 10);
    }
    parciales.push(fila);
    if (j === 0 && B.length > 1) {
      // el cero que se corre un lugar en la fila siguiente
    }
  }
  if (B.length > 1) {
    // En la segunda fila el lugar de las unidades se rellena con un 0 (ya viene puesto)
    for (let j = 1; j < B.length; j++) for (let k = 0; k < j; k++) { celdas[`${4 + j},${col(k)}`] = '0'; parciales[j][k] = 0; }
    let lleva = 0;
    const nCols = String(total).length;
    for (let k = 0; k < nCols; k++) {
      const partes = parciales.map(f => f[k] || 0);
      const t = partes.reduce((s, v) => s + v, 0) + lleva;
      const ultimo = k === nCols - 1;
      const piezas = partes.filter((v, idx) => v || idx === 0 || k > 0);
      pasos.push({
        tipo: 'sumar', respuesta: t,
        pregunta: `Suma la columna: ${partes.join(' + ')}${lleva ? ` + ${lleva} (lo que llevas)` : ''} = ?`,
        pista: `${partes.join(' + ')}${lleva ? ` + ${lleva}` : ''} = ${t}`,
        foco: parciales.map((_, j) => `${4 + j},${col(k)}`),
        escribe: ultimo
          ? String(t).split('').reverse().map((c, q) => [`${filaSuma},${col(k + q)}`, c])
          : [[`${filaSuma},${col(k)}`, String(t % 10)]],
        lleva: null
      });
      lleva = Math.floor(t / 10);
    }
  }
  return { A, B, C, celdas, pasos, nFilas: B.length > 1 ? filaSuma + 1 : 4 + nParciales, filaLinea2: B.length > 1 ? 4 + nParciales : -1 };
}

export default {
  id: 'columnas',
  montar(zona, ejercicio, ctx) {
    const m = construir(ejercicio);
    let paso = 0, errores = 0, intentos = 0, entrada = '', terminado = false, espera = false;
    const resultados = [];
    let temporizador = null;

    const caja = el('section', 'actividad columnas');
    if (ctx.titulo) caja.appendChild(el('h3', null, ctx.titulo));
    caja.appendChild(el('p', 'instruccion', 'Resuelve la multiplicación paso a paso.'));

    // ---- cuadrícula ----
    const rejilla = el('div', 'col-rejilla');
    rejilla.style.setProperty('--cols', m.C);
    const nodo = {};
    for (let f = 0; f < m.nFilas; f++) {
      for (let c = 0; c < m.C; c++) {
        const k = `${f},${c}`;
        const raya = f === 3 || f === m.filaLinea2;
        const n = el('i', 'col-celda' + (f === 0 ? ' llevada' : '') + (raya ? ' raya' : ''));
        nodo[k] = n;
        if (m.celdas[k] != null) { n.textContent = m.celdas[k]; n.classList.add(m.celdas[k] === '0' && f >= 4 ? 'cero' : 'fija'); }
        rejilla.appendChild(n);
      }
    }

    // ---- pregunta, entrada y teclado ----
    const pregunta = el('p', 'col-pregunta');
    const respuesta = el('div', 'col-respuesta');
    respuesta.setAttribute('aria-live', 'polite');
    const mensaje = el('p', 'mensaje');
    mensaje.setAttribute('aria-live', 'polite');
    const teclado = el('div', 'teclado');
    const tecla = (txt, fn, clase) => {
      const b = el('button', 'tecla' + (clase ? ' ' + clase : ''), txt);
      b.type = 'button';
      b.addEventListener('click', fn);
      teclado.appendChild(b);
      return b;
    };
    [7, 8, 9, 4, 5, 6, 1, 2, 3].forEach(n => tecla(String(n), () => teclear(String(n))));
    tecla('⌫', borrar, 'aux');
    tecla('0', () => teclear('0'));
    const ok = tecla('✓', comprobar, 'ok');

    function pintarEntrada() {
      respuesta.textContent = entrada || '?';
      respuesta.classList.toggle('vacia', !entrada);
      ok.disabled = !entrada || terminado || espera;
    }
    function teclear(c) {
      if (terminado || espera || entrada.length >= 3) return;
      entrada += c;
      pintarEntrada();
    }
    function borrar() { if (!terminado && !espera) { entrada = entrada.slice(0, -1); pintarEntrada(); } }

    function marcarFoco() {
      Object.values(nodo).forEach(n => n.classList.remove('foco', 'actual'));
      if (terminado) return;
      const p = m.pasos[paso];
      p.foco.forEach(k => nodo[k] && nodo[k].classList.add('foco'));
      p.escribe.forEach(([k]) => nodo[k] && nodo[k].classList.add('actual'));
      pregunta.textContent = p.pregunta;
    }

    function aplicar(p) {
      p.escribe.forEach(([k, v]) => { const n = nodo[k]; n.textContent = v; n.classList.add('puesto'); });
      // la llevada de la fila anterior ya se usó: se limpia antes de poner la nueva
      if (p.tipo === 'mult') {
        Array.from(rejilla.querySelectorAll('.llevada')).forEach(n => { n.textContent = ''; });
        if (p.lleva && p.lleva.valor) nodo[p.lleva.celda].textContent = String(p.lleva.valor);
      }
    }

    function avanzar(ok) {
      resultados.push({ tipo: m.pasos[paso].tipo, ok });
      aplicar(m.pasos[paso]);
      paso++;
      intentos = 0;
      entrada = '';
      if (paso >= m.pasos.length) { terminar(false); return; }
      mensaje.textContent = '';
      pintarEntrada();
      marcarFoco();
    }

    function terminar(revelada) {
      terminado = true;
      marcarFoco();
      respuesta.textContent = String(ejercicio.a * ejercicio.b);
      respuesta.classList.remove('vacia');
      pregunta.textContent = `${ejercicio.a} × ${ejercicio.b} = ${ejercicio.a * ejercicio.b}`;
      mensaje.textContent = revelada ? 'Esta vez te mostramos el resultado. ¡La próxima la sacas!' : '¡Muy bien!';
      pintarEntrada();
      ctx.reportar({ errores, ayuda: false, revelada, tiempo: null, pasos: resultados });
    }

    function comprobar() {
      if (terminado || espera || !entrada) return;
      const p = m.pasos[paso];
      if (Number(entrada) === p.respuesta) { avanzar(intentos === 0); return; }
      errores++; intentos++;
      respuesta.classList.add('mal');
      if (errores > ERRORES_PARA_REVELAR) {
        // se completa todo lo que falta y se muestra la solución
        while (paso < m.pasos.length) { resultados.push({ tipo: m.pasos[paso].tipo, ok: false }); aplicar(m.pasos[paso]); paso++; }
        terminar(true);
        return;
      }
      mensaje.textContent = intentos > 1 ? `Pista: ${p.pista.split('=')[0].trim()} …` : 'Casi. Inténtalo otra vez.';
      if (intentos > 1) mensaje.textContent = `Pista: ${p.pista}`;
      espera = true;
      temporizador = setTimeout(() => { espera = false; entrada = ''; respuesta.classList.remove('mal'); pintarEntrada(); }, 700);
      pintarEntrada();
    }

    function alTeclado(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) teclear(e.key);
      else if (e.key === 'Backspace') borrar();
      else if (e.key === 'Enter') comprobar();
    }
    document.addEventListener('keydown', alTeclado);

    caja.append(rejilla, pregunta, respuesta, mensaje, teclado);
    zona.appendChild(caja);
    pintarEntrada();
    marcarFoco();
    return () => { clearTimeout(temporizador); document.removeEventListener('keydown', alTeclado); };
  },
  construir      // se exporta para las pruebas
};
