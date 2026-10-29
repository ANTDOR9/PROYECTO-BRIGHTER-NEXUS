// Pizarra digital (prototipo): lápiz, borrador, línea, rectángulo y círculo, colores, grosores,
// deshacer/rehacer, fondo oscuro o blanco, multitáctil (cada dedo dibuja su propio trazo),
// guardado automático de la clase y exportar como imagen PNG.
//
// Pendiente (fase siguiente): insertar imagen, PDF o video, varias páginas y texto.
//
// Los trazos se guardan con coordenadas relativas al ancho, así la clase se ve igual en cualquier pantalla.

const COLORES = ['#FFFFFF', '#FFD83B', '#22D3EE', '#B8FF3B', '#FF4FB8', '#FF8A3D', '#111111'];
const GROSORES = [{ n: 3, t: 'Fino' }, { n: 7, t: 'Medio' }, { n: 14, t: 'Grueso' }];
const FONDOS = { oscura: '#0D1A22', blanca: '#FFFFFF' };
const HERRAMIENTAS = [
  { id: 'lapiz', icono: '✎', texto: 'Lápiz' },
  { id: 'borrador', icono: '⌫', texto: 'Borrador' },
  { id: 'linea', icono: '╱', texto: 'Línea' },
  { id: 'rect', icono: '▭', texto: 'Rectángulo' },
  { id: 'circulo', icono: '◯', texto: 'Círculo' }
];
const CLAVE = 'brighterNexus.pizarra.v1';
const FACTOR_BORRADOR = 4;

function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

export default {
  id: 'pizarra',
  nombre: 'Pizarra',
  escena: 'pizarra',
  seccion: 'pizarra',
  seccionNombre: 'Pizarra',
  descripcion: 'Escribir, dibujar, insertar imágenes, PDF o video y guardar la clase.',
  estado: 'prototipo',
  compacto: true,

  montar(zona) {
    // ---------- estado ----------
    let herramienta = 'lapiz', color = '#FFFFFF', grosor = 7, fondo = 'oscura';
    let trazos = [];          // trazos terminados
    let rehacerPila = [];
    const activos = new Map(); // pointerId -> trazo en curso (uno por dedo)
    let W = 0, H = 0, dpr = 1;
    let sucio = true, cuadro = 0, tBorrar = null, tAviso = null;

    // ---------- carga de la clase guardada ----------
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE));
      if (g && Array.isArray(g.trazos)) { trazos = g.trazos; if (FONDOS[g.fondo]) fondo = g.fondo; }
    } catch (e) { /* sin clase guardada */ }
    if (fondo === 'blanca') color = '#111111';

    // ---------- interfaz ----------
    const raiz = el('div', 'pizarra');
    const barra = el('div', 'barra-pizarra');
    const botonesHerr = {};
    const g1 = el('div', 'grupo-pizarra');
    HERRAMIENTAS.forEach(h => {
      const b = el('button', 'herr');
      b.type = 'button';
      b.innerHTML = `<span class="ico">${h.icono}</span><small>${h.texto}</small>`;
      b.addEventListener('click', () => { herramienta = h.id; pintarBarra(); });
      botonesHerr[h.id] = b;
      g1.appendChild(b);
    });
    const g2 = el('div', 'grupo-pizarra');
    const botonesColor = COLORES.map(c => {
      const b = el('button', 'muestra');
      b.type = 'button';
      b.style.background = c;
      b.setAttribute('aria-label', `Color ${c}`);
      b.addEventListener('click', () => { color = c; if (herramienta === 'borrador') herramienta = 'lapiz'; pintarBarra(); });
      g2.appendChild(b);
      return b;
    });
    const g3 = el('div', 'grupo-pizarra');
    const botonesGrosor = GROSORES.map(gr => {
      const b = el('button', 'herr grosor');
      b.type = 'button';
      b.innerHTML = `<i style="width:${gr.n + 6}px;height:${gr.n + 6}px"></i><small>${gr.t}</small>`;
      b.addEventListener('click', () => { grosor = gr.n; pintarBarra(); });
      g3.appendChild(b);
      return b;
    });
    const g4 = el('div', 'grupo-pizarra');
    const accion = (texto, f, icono) => {
      const b = el('button', 'herr');
      b.type = 'button';
      b.innerHTML = `<span class="ico">${icono}</span><small>${texto}</small>`;
      b.addEventListener('click', f);
      g4.appendChild(b);
      return b;
    };
    const bDeshacer = accion('Deshacer', deshacer, '↶');
    const bRehacer = accion('Rehacer', rehacer, '↷');
    accion('Fondo', alternarFondo, '◐');
    const bBorrar = accion('Borrar todo', pedirBorrar, '✕');
    accion('Guardar imagen', guardarImagen, '⤓');
    barra.append(g1, g2, g3, g4);

    const lienzo = el('div', 'lienzo');
    const canvas = el('canvas');
    canvas.setAttribute('aria-label', 'Pizarra: área de dibujo');
    lienzo.appendChild(canvas);
    const aviso = el('div', 'pizarra-aviso');
    lienzo.appendChild(aviso);
    raiz.append(barra, lienzo);
    zona.appendChild(raiz);

    const ctx = canvas.getContext('2d');
    const base = document.createElement('canvas'); // aquí quedan dibujados los trazos terminados
    const bctx = base.getContext('2d');

    function pintarBarra() {
      Object.entries(botonesHerr).forEach(([id, b]) => b.classList.toggle('activa', id === herramienta));
      botonesColor.forEach((b, i) => b.classList.toggle('activa', COLORES[i] === color && herramienta !== 'borrador'));
      botonesGrosor.forEach((b, i) => b.classList.toggle('activa', GROSORES[i].n === grosor));
      bDeshacer.disabled = trazos.length === 0;
      bRehacer.disabled = rehacerPila.length === 0;
    }

    function avisar(texto) {
      aviso.textContent = texto;
      aviso.classList.add('visible');
      clearTimeout(tAviso);
      tAviso = setTimeout(() => aviso.classList.remove('visible'), 1800);
    }

    // ---------- dibujo ----------
    function dibujar(g, t) {
      const c = t.c == null ? FONDOS[fondo] : t.c;
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = c; g.fillStyle = c; g.lineWidth = t.w;
      const P = t.p.map(([x, y]) => [x * W, y * W]);
      g.beginPath();
      if (t.t === 'lapiz' || t.t === 'borrador') {
        if (P.length === 1) { g.arc(P[0][0], P[0][1], t.w / 2, 0, Math.PI * 2); g.fill(); return; }
        g.moveTo(P[0][0], P[0][1]);
        for (let i = 1; i < P.length - 1; i++) {
          const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
          g.quadraticCurveTo(P[i][0], P[i][1], mx, my);
        }
        g.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
      } else if (P.length > 1) {
        const [a, b] = [P[0], P[P.length - 1]];
        if (t.t === 'linea') { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
        else if (t.t === 'rect') g.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
        else if (t.t === 'circulo') g.arc(a[0], a[1], Math.hypot(b[0] - a[0], b[1] - a[1]), 0, Math.PI * 2);
      }
      g.stroke();
    }

    function reconstruir() {
      if (!W) return;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.fillStyle = FONDOS[fondo];
      bctx.fillRect(0, 0, W, H);
      trazos.forEach(t => dibujar(bctx, t));
      sucio = true;
    }

    function cuadroSiguiente() {
      cuadro = requestAnimationFrame(cuadroSiguiente);
      if (!sucio || !W) return;
      sucio = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(base, 0, 0, W, H);
      activos.forEach(t => dibujar(ctx, t));
    }

    function ajustarTamano() {
      const r = lienzo.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      W = Math.round(r.width); H = Math.round(r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [canvas, base].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      reconstruir();
    }
    const observador = new ResizeObserver(ajustarTamano);
    observador.observe(lienzo);

    // ---------- lápiz, dedos y ratón ----------
    const redondear = v => Math.round(v * 10000) / 10000;
    function punto(e) {
      const r = canvas.getBoundingClientRect();
      return [redondear((e.clientX - r.left) / W), redondear((e.clientY - r.top) / W)];
    }
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!W) return;
      canvas.setPointerCapture(e.pointerId);
      const esBorrador = herramienta === 'borrador';
      activos.set(e.pointerId, {
        t: herramienta,
        c: esBorrador ? null : color,
        w: esBorrador ? grosor * FACTOR_BORRADOR : grosor,
        p: [punto(e)]
      });
      sucio = true;
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', e => {
      const t = activos.get(e.pointerId);
      if (!t) return;
      const eventos = (t.t === 'lapiz' || t.t === 'borrador') && e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (t.t === 'lapiz' || t.t === 'borrador') eventos.forEach(ev => t.p.push(punto(ev)));
      else t.p = [t.p[0], punto(e)]; // las formas solo guardan el inicio y el final
      sucio = true;
    });
    function terminarTrazo(e) {
      const t = activos.get(e.pointerId);
      if (!t) return;
      activos.delete(e.pointerId);
      const forma = t.t === 'linea' || t.t === 'rect' || t.t === 'circulo';
      if (!(forma && t.p.length < 2)) {
        trazos.push(t);
        dibujar(bctx, t);
        rehacerPila = [];
        guardarAuto();
      }
      sucio = true;
      pintarBarra();
    }
    canvas.addEventListener('pointerup', terminarTrazo);
    canvas.addEventListener('pointercancel', terminarTrazo);

    // ---------- acciones ----------
    function deshacer() {
      if (!trazos.length) return;
      rehacerPila.push(trazos.pop());
      reconstruir(); guardarAuto(); pintarBarra();
    }
    function rehacer() {
      if (!rehacerPila.length) return;
      trazos.push(rehacerPila.pop());
      reconstruir(); guardarAuto(); pintarBarra();
    }
    function alternarFondo() {
      fondo = fondo === 'oscura' ? 'blanca' : 'oscura';
      // El color del lápiz que no se vería sobre el fondo nuevo se cambia
      if (fondo === 'blanca' && color === '#FFFFFF') color = '#111111';
      if (fondo === 'oscura' && color === '#111111') color = '#FFFFFF';
      reconstruir(); guardarAuto(); pintarBarra();
    }
    // "Borrar todo" pide un segundo toque para no perder la clase por accidente (sin ventanas emergentes)
    function pedirBorrar() {
      if (bBorrar.dataset.seguro === '1') {
        clearTimeout(tBorrar);
        trazos = []; rehacerPila = [];
        reconstruir(); guardarAuto(); pintarBarra();
        reiniciarBotonBorrar();
        return;
      }
      bBorrar.dataset.seguro = '1';
      bBorrar.classList.add('peligro');
      bBorrar.querySelector('small').textContent = '¿Seguro?';
      tBorrar = setTimeout(reiniciarBotonBorrar, 3000);
    }
    function reiniciarBotonBorrar() {
      bBorrar.dataset.seguro = '0';
      bBorrar.classList.remove('peligro');
      bBorrar.querySelector('small').textContent = 'Borrar todo';
    }
    function guardarAuto() {
      try { localStorage.setItem(CLAVE, JSON.stringify({ fondo, trazos })); } catch (e) { /* sin espacio o bloqueado */ }
    }
    function guardarImagen() {
      if (!W) return;
      base.toBlob(blob => {
        if (!blob) { avisar('No se pudo crear la imagen'); return; }
        const f = new Date();
        const dos = n => String(n).padStart(2, '0');
        const nombre = `pizarra-${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}-${dos(f.getHours())}${dos(f.getMinutes())}.png`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = nombre;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        avisar(`Imagen guardada: ${nombre}`);
      }, 'image/png');
    }

    pintarBarra();
    cuadro = requestAnimationFrame(cuadroSiguiente);
    ajustarTamano();

    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      clearTimeout(tBorrar); clearTimeout(tAviso);
    };
  }
};
