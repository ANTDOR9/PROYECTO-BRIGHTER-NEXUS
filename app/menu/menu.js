/* BRIGHTER NEXUS · menu.js
   Menú circular con "mega zoom". JavaScript puro, sin dependencias ni internet.

   Está conectado a Nexus: recibe las secciones ya armadas (ver nucleo/menu-datos.js, que las saca del registro de
   sesiones y módulos) y dibuja el menú dentro de la pantalla que le da el enrutador. Las tarjetas son enlaces
   <a href="#/sesion/..."> normales: la navegación la hace el enrutador por hash.

   montarMenu(raiz, { secciones, seccionInicial, alSeccion, nombre, saludar }) → función para limpiar al salir.
   - secciones:       [{ id, color, icono, cols, titulo, apoyo, resumen, items:[{ ruta, nombre, descripcion, icono, color, etiqueta }] }]
                      (las 4 primeras son los botones del círculo)
   - seccionInicial:  id de una sección que debe abrirse de inmediato (al volver con "atrás" desde una sesión)
   - alSeccion(id|null): aviso cuando se abre una sección o se vuelve al círculo (para actualizar la dirección)
   - saludar:         si es true, el consejero da la bienvenida */

const BASE = new URL('./', import.meta.url).href;
const SVG = 'http://www.w3.org/2000/svg';

const ICONOS = `
  <symbol id="i-libro"   viewBox="0 0 24 24"><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z"/><path d="M12 6v13.5"/></symbol>
  <symbol id="i-cubo"    viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></symbol>
  <symbol id="i-mando"   viewBox="0 0 24 24"><path d="M7 8h10a4 4 0 014 4v1.5a3 3 0 01-5.4 1.8L14.5 14h-5l-1.1 1.3A3 3 0 013 13.5V12a4 4 0 014-4z"/><path d="M8 10.5v3M6.5 12h3M15.5 11.2h.01M17.5 12.8h.01"/></symbol>
  <symbol id="i-pizarra" viewBox="0 0 24 24"><path d="M5 4h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M8 20l2-4M16 20l-2-4M7.5 12l3-3 2.5 2.5 3.5-3.5"/></symbol>
  <symbol id="i-mate"    viewBox="0 0 24 24"><path d="M8 3.5v8M4 7.5h8M14 7.5h6.5M14.5 14.5l6 6M20.5 14.5l-6 6M4 17h7M4 20.5h7"/></symbol>
  <symbol id="i-lenguaje" viewBox="0 0 24 24"><path d="M4 5h16v11h-9l-4 4v-4H4z"/><path d="M9 13l3-6 3 6M10 11.5h4"/></symbol>
  <symbol id="i-ciencia" viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 006.2 21.5h11.6a2 2 0 001.7-3L14 9V3M7.5 15h9"/></symbol>
  <symbol id="i-media"   viewBox="0 0 24 24"><path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M10 9.5v5l4.5-2.5z"/></symbol>
  <symbol id="i-quiz"    viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 1.9c-.9.7-1.5 1.2-1.5 2.3M12 16.8h.01"/></symbol>
  <symbol id="i-nueva"   viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-estudiante" viewBox="0 0 24 24"><path d="M12 2.5l7 3.2-7 3.2-7-3.2z"/><circle cx="12" cy="13.2" r="2.9"/><path d="M5.5 21.5c.6-3.7 3.2-5.5 6.5-5.5s5.9 1.8 6.5 5.5"/></symbol>
  <symbol id="i-tutor"   viewBox="0 0 24 24"><circle cx="8.5" cy="8" r="3"/><path d="M2.5 20.5c.6-3.8 3-5.6 6-5.6 1.4 0 2.6.4 3.6 1.1"/><path d="M13.5 5h8v7h-8zM17.5 12v4.5M14.5 18.5h6"/></symbol>
  <symbol id="i-seguir"  viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z"/></symbol>`;

const FORMAS = [
  '0,100 100,100 0,0', '0,100 100,100 50,0', '0,0 100,40 20,100',
  '100,0 100,100 0,70', '10,100 100,85 55,0', '0,30 100,0 70,100',
];
const COLORES = ['var(--coral)', 'var(--ambar)', 'var(--verde)', 'var(--naranja)', 'var(--rojo-osc)', 'var(--coral)', 'var(--verde)', 'var(--ambar)'];
const MAX = 5;                               // triangulitos flotantes vivos a la vez

const el = (tag, clase, texto) => {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto != null) n.textContent = texto;
  return n;
};
const escapar = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hexagono = (icono, color) => {
  const h = el('span', 'hex');
  if (color) h.style.setProperty('--c', color);
  const svg = document.createElementNS(SVG, 'svg');
  const uso = document.createElementNS(SVG, 'use');
  uso.setAttribute('href', '#' + icono);
  svg.appendChild(uso);
  h.appendChild(svg);
  return h;
};

export function montarMenu(raiz, { secciones, seccionInicial = null, alSeccion = () => {}, nombre = '', saludar = false } = {}) {
  const body = document.body;
  const principales = secciones.slice(0, 4);
  let vivo = true;
  const temporizadores = new Set();
  const ya = (fn, ms) => { const t = setTimeout(() => { temporizadores.delete(t); if (vivo) fn(); }, ms); temporizadores.add(t); return t; };

  /* ---------------- Estructura ---------------- */
  const ops = principales.map((s, i) => `
      <a class="op op-${i + 1}" href="#/seccion/${escapar(s.id)}" data-seccion="${escapar(s.id)}" style="--c:${s.color}" aria-label="${escapar(s.titulo + ': ' + (s.resumenLargo || s.apoyo))}">
        <span class="fotos"><img class="foto f1" src="${BASE}img/${escapar(s.id)}-1.jpg" alt=""><img class="foto f2" src="${BASE}img/${escapar(s.id)}-2.jpg" alt=""></span>
        <span class="velo"></span>
        <span class="op-txt">
          <span class="hex"><svg><use href="#${escapar(s.icono)}"/></svg></span>
          <b>${escapar(s.titulo)}</b><small>${escapar(s.resumen || '')}</small>
        </span>
      </a>`).join('');

  raiz.innerHTML = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">${ICONOS}</svg>
    <div class="fondo-tutor" aria-hidden="true"></div>
    <div class="deco" aria-hidden="true">
      <svg class="tri fijo t1" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="0,22 100,100 0,100"/></svg><svg class="tri fijo t2" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="100,14 100,100 0,100"/></svg><svg class="tri fijo t3" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="100,0 100,100 0,52"/></svg><svg class="tri fijo t4" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="0,0 100,50 0,100"/></svg><svg class="tri fijo t5" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="0,100 100,100 60,0"/></svg>
    </div>

    <a class="btn-inicio" id="btnInicio" href="#/" aria-label="Volver al inicio">
      <span class="logo"><img src="${BASE}brighter-nexus.png" alt=""></span>
      <b>Inicio</b>
    </a>

    <div class="usuario" id="usuario">
      <div class="modos" id="modos" role="group" aria-label="Modo de uso">
        <button class="modo" type="button" data-modo="estudiante" aria-pressed="true" aria-label="Modo estudiante"><svg aria-hidden="true"><use href="#i-estudiante"/></svg></button>
        <button class="modo" type="button" data-modo="tutor" aria-pressed="false" aria-label="Modo tutor"><svg aria-hidden="true"><use href="#i-tutor"/></svg></button>
      </div>
      <button class="btn-usuario" id="btnUsuario" type="button" aria-label="${escapar(nombre ? 'Usuario ' + nombre + ': cambiar de modo' : 'Usuario: cambiar de modo')}" aria-expanded="false" aria-controls="modos">
        <span class="aro" aria-hidden="true"></span>
        <span class="cara" aria-hidden="true">
          <svg class="ic-est"><use href="#i-estudiante"/></svg>
          <svg class="ic-tut"><use href="#i-tutor"/></svg>
        </span>
      </button>
    </div>

    <div class="consejero" id="consejero" aria-live="polite">
      <img class="cons-pajaro" src="${BASE}brighter-nexus.png" alt="">
      <div class="cons-globo"><b id="consTitulo">Bienvenido alumno</b></div>
    </div>

    <div class="pagina">
      <nav class="escena wrap" id="wrap" aria-label="Menú principal">${ops}
        <a class="centro" href="#/" aria-label="Inicio"><img src="${BASE}brighter-nexus.png" alt="Brighter Nexus"></a>
      </nav>
    </div>
    <div id="secciones"></div>`;

  const q = s => raiz.querySelector(s);
  const wrap = q('#wrap');
  const contenedor = q('#secciones');
  const deco = q('.deco');
  const usuario = q('#usuario');
  const btnUsuario = q('#btnUsuario');
  const modos = [...usuario.querySelectorAll('.modo')];

  /* ---------------- Usuario y modos ---------------- */
  let cierraModos;
  const abrirModos = abierto => {
    usuario.classList.toggle('abierto', abierto);
    btnUsuario.setAttribute('aria-expanded', abierto);
    clearTimeout(cierraModos);
  };
  const girar = () => {                         // el logo da una vuelta completa
    btnUsuario.classList.remove('gira');
    void btnUsuario.offsetWidth;
    btnUsuario.classList.add('gira');
  };
  btnUsuario.addEventListener('animationend', e => {
    if (e.animationName === 'vuelta') btnUsuario.classList.remove('gira');
  });

  function ponerModo(modo, guardar) {
    body.classList.toggle('tutor', modo === 'tutor');
    body.dataset.modo = modo;
    modos.forEach(m => m.setAttribute('aria-pressed', m.dataset.modo === modo));
    if (guardar) { try { localStorage.setItem('nexus-modo', modo); } catch (e) { /* sin almacenamiento */ } }
  }
  let guardado = 'estudiante';
  try { guardado = localStorage.getItem('nexus-modo') === 'tutor' ? 'tutor' : 'estudiante'; } catch (e) { /* se queda en estudiante */ }
  ponerModo(guardado, false);

  btnUsuario.addEventListener('click', () => {
    girar();
    abrirModos(!usuario.classList.contains('abierto'));
  });
  modos.forEach(m => m.addEventListener('click', () => {
    if (m.dataset.modo !== body.dataset.modo) { girar(); ponerModo(m.dataset.modo, true); }
    cierraModos = ya(() => abrirModos(false), 600);
  }));
  const fueraDeModos = e => {
    if (usuario.classList.contains('abierto') && !usuario.contains(e.target)) abrirModos(false);
  };
  document.addEventListener('pointerdown', fueraDeModos);

  /* ---------------- Pantallas del zoom ---------------- */
  const pantallas = {};
  secciones.forEach(s => {
    const sec = el('section', 'seccion');
    sec.id = 'sec-' + s.id;
    sec.style.setProperty('--c', s.color);
    sec.setAttribute('aria-labelledby', 't-' + s.id);
    sec.inert = true;

    const cont = el('div', 'contenido');

    const cab = el('div', 'cabecera');
    cab.appendChild(hexagono(s.icono, s.color));
    const txt = el('div');
    const h2 = el('h2', null, s.titulo); h2.id = 't-' + s.id;
    txt.append(h2, el('p', null, s.apoyo));
    cab.appendChild(txt);

    const rej = el('div', 'rejilla');
    rej.style.setProperty('--cols', s.cols);
    s.items.forEach((it, i) => {
      const a = el('a', 'tarjeta');
      a.href = '#' + it.ruta;
      a.style.setProperty('--c', it.color);
      a.style.setProperty('--i', i);
      a.append(hexagono(it.icono, it.color), el('h3', null, it.nombre), el('p', null, it.descripcion));
      if (it.etiqueta) a.appendChild(el('span', 'etiqueta', it.etiqueta));
      a.dataset.nombre = it.nombre;
      rej.appendChild(a);
    });

    cont.append(cab, rej);
    sec.appendChild(cont);
    contenedor.appendChild(sec);
    pantallas[s.id] = sec;
  });

  /* ---------------- Mega zoom ---------------- */
  let actual = null;
  let aTiempo, aZoom;

  function origenDe(boton) {
    const w = wrap.getBoundingClientRect();
    const b = boton.getBoundingClientRect();
    // el zoom se centra en el botón tocado
    wrap.style.setProperty('--ox', (b.left + b.width / 2 - w.left) + 'px');
    wrap.style.setProperty('--oy', (b.top + b.height / 2 - w.top) + 'px');
  }

  function abrir(id, boton) {
    if (actual || !pantallas[id]) return;
    origenDe(boton);
    actual = id;
    alSeccion(id);
    wrap.inert = true;
    body.classList.add('apagando');              // 1) las fotos se desvanecen
    clearTimeout(aZoom);
    aZoom = ya(() => {                           // 2) y entonces empieza el zoom
      pantallas[id].inert = false;
      pantallas[id].classList.add('activa');
      body.classList.add('zoom');
      clearTimeout(aTiempo);
      aTiempo = ya(() => { const p = pantallas[id].querySelector('.tarjeta'); if (p) p.focus({ preventScroll: true }); }, 1300);
    }, 380);
  }

  function cerrar() {
    if (!actual) return;
    const sec = pantallas[actual];
    actual = null;
    alSeccion(null);
    clearTimeout(aTiempo); clearTimeout(aZoom);
    sec.classList.remove('activa');
    sec.inert = true;
    body.classList.remove('zoom', 'apagando');   // las fotos vuelven con fundido al terminar el zoom
    wrap.inert = false;
  }

  wrap.querySelectorAll('.op').forEach(op => {
    op.addEventListener('click', e => { e.preventDefault(); abrir(op.dataset.seccion, op); });
  });
  q('#btnInicio').addEventListener('click', e => { e.preventDefault(); cerrar(); });
  wrap.querySelector('.centro').addEventListener('click', e => e.preventDefault());
  const alTeclado = e => {
    if (e.key !== 'Escape') return;
    if (usuario.classList.contains('abierto')) abrirModos(false); else cerrar();
  };
  addEventListener('keydown', alTeclado);

  /* ---------------- Fondo vivo: triángulos que nacen y desaparecen ---------------- */
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = l => l[Math.floor(Math.random() * l.length)];

  // Busca un lugar en el margen exterior: pegado al borde de la pantalla, fuera del
  // círculo (con aire alrededor) y lejos de los botones de las esquinas.
  function puntoLibre(tam) {
    const W = innerWidth, H = innerHeight, m = Math.min(W, H);
    const S = Math.min(W - 48, H - 128), cx = W / 2, cy = 104 + (H - 128) / 2;
    for (let i = 0; i < 30; i++) {
      const x = rnd(-3, 103), y = rnd(-3, 103);
      const px = x / 100 * W, py = y / 100 * H;
      const aBorde = Math.min(px, W - px, py, H - py) < m * 0.2;        // cerca del borde
      const lejos = Math.hypot(px - cx, py - cy) > S * 0.5 + m * 0.04 + tam * m / 100 * 0.75;   // fuera del círculo
      const esquinas = py < 130 && (px < 240 || px > W - 150);           // Inicio / usuario
      if (aBorde && lejos && !esquinas) return [x, y];
    }
    return null;
  }
  function nuevoTriangulo(fijo) {
    if (!vivo || deco.querySelectorAll('.tri.v').length >= MAX) return;
    const w = rnd(11, 19), r0 = rnd(-20, 20);
    const p = puntoLibre(w);
    if (!p) return;
    const t = document.createElementNS(SVG, 'svg');           // SVG (no clip-path): se dibuja sin parpadeos
    t.setAttribute('class', 'tri v');
    t.setAttribute('viewBox', '0 0 100 100');
    t.setAttribute('preserveAspectRatio', 'none');
    const poly = document.createElementNS(SVG, 'polygon');
    poly.setAttribute('points', pick(FORMAS));
    t.appendChild(poly);
    const v = {
      left: p[0] + 'vw', top: p[1] + 'vh', width: w + 'vmin', height: (w * rnd(0.7, 1.1)) + 'vmin',
      color: pick(COLORES),
      '--vida': rnd(16, 24).toFixed(1) + 's', '--op': rnd(0.5, 0.8).toFixed(2),
      '--r0': r0 + 'deg', '--r1': (r0 + rnd(-30, 30)) + 'deg',
      '--s0': rnd(0.5, 0.8).toFixed(2), '--s1': rnd(0.95, 1.2).toFixed(2),
      '--dx': rnd(-3, 3).toFixed(1) + 'vmin', '--dy': rnd(-3, 3).toFixed(1) + 'vmin',
    };
    Object.entries(v).forEach(([k, val]) => k.startsWith('--') ? t.style.setProperty(k, val) : (t.style[k] = val));
    if (fijo) { t.style.animation = 'none'; t.style.opacity = '.8'; }
    else t.addEventListener('animationend', () => t.remove());
    deco.appendChild(t);
  }

  /* ---------------- Consejero de bienvenida ---------------- */
  const consejero = q('#consejero');
  function mostrarConsejero() {
    const tutor = body.dataset.modo === 'tutor';
    q('#consTitulo').textContent = tutor ? 'Bienvenido profesor' : 'Bienvenido alumno';
    consejero.classList.add('ver');
    consejero.addEventListener('animationend', e => {
      if (e.animationName === 'cons-vida') consejero.classList.remove('ver');   // se va y no vuelve
    });
  }

  /* ---------------- Entrada ---------------- */
  const quitarClases = () => body.classList.remove('abierto', 'zoom', 'apagando', 'fotos-listas', 'instantaneo');

  if (seccionInicial && pantallas[seccionInicial]) {
    // Se vuelve a una sección (por ejemplo con "atrás" desde una sesión): se abre ya, sin repetir la animación.
    const op = wrap.querySelector(`.op[data-seccion="${seccionInicial}"]`);
    body.classList.add('instantaneo', 'abierto', 'fotos-listas');
    if (op) origenDe(op);
    actual = seccionInicial;
    wrap.inert = true;
    pantallas[actual].inert = false;
    pantallas[actual].classList.add('activa');
    body.classList.add('apagando', 'zoom');
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('instantaneo')));
    if (!reducido) for (let i = 0; i < MAX; i++) ya(nuevoTriangulo, 1500 + i * 900);
  } else {
    // Las 4 opciones se abren solas y se quedan abiertas (sin pasar el mouse).
    // Se espera a que fotos y tipografía estén listas: así no hay parpadeos al aparecer.
    const fotos = [...raiz.querySelectorAll('.foto')];
    const listas = Promise.all([
      ...fotos.map(i => (i.decode ? i.decode() : Promise.resolve()).catch(() => {})),
      document.fonts ? document.fonts.ready : Promise.resolve(),
    ]);
    const limite = new Promise(ok => setTimeout(ok, 2500));
    Promise.race([listas, limite]).then(() => {
      if (!vivo) return;
      requestAnimationFrame(() => ya(() => {
        body.classList.add('abierto');
        ya(() => body.classList.add('fotos-listas'), 900);               // las fotos entran cuando las piezas ya están abiertas
        if (saludar) ya(mostrarConsejero, 700);                           // y el consejero saluda unos segundos
      }, 120));
    });
    if (reducido) { for (let i = 0; i < 4; i++) nuevoTriangulo(true); }
    else {
      // los flotantes empiezan cuando el menú ya terminó de abrirse (así la entrada no se recarga)
      for (let i = 0; i < MAX; i++) ya(nuevoTriangulo, 4200 + i * 900);
      ya(function ciclo() { nuevoTriangulo(); ya(ciclo, rnd(1800, 3200)); }, 9500);
    }
  }

  /* ---------------- Limpieza ---------------- */
  return () => {
    vivo = false;
    temporizadores.forEach(clearTimeout);
    temporizadores.clear();
    clearTimeout(cierraModos); clearTimeout(aTiempo); clearTimeout(aZoom);
    document.removeEventListener('pointerdown', fueraDeModos);
    removeEventListener('keydown', alTeclado);
    quitarClases();
  };
}
