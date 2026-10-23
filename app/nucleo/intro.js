// Intro que se ve al abrir la app. Hoy es un ESPACIO RESERVADO: un marco 16:9 con el logo animado.
// Cuando exista la intro real, se cambia app/contenido/intro.json (tipo 'video' o 'imagen') y no hay que tocar código.
import { logoSVG } from './logo.js';
import { aplicarEscena } from './fondo.js';
import { ir } from './enrutador.js';

const CLAVE_VISTA = 'nexus.introVista';

export function introYaVista() {
  try { return sessionStorage.getItem(CLAVE_VISTA) === '1'; } catch (e) { return false; }
}
function marcarVista() {
  try { sessionStorage.setItem(CLAVE_VISTA, '1'); } catch (e) { /* sin almacenamiento: se verá otra vez */ }
}

const POR_DEFECTO = { tipo: 'reservado', archivo: null, duracionSegundos: 6, saltable: true, silenciado: true, titulo: 'Brighter Nexus', subtitulo: '' };

async function leerConfig() {
  try {
    const r = await fetch('contenido/intro.json');
    if (r.ok) return { ...POR_DEFECTO, ...(await r.json()) };
  } catch (e) { /* se usa la configuración por defecto */ }
  return POR_DEFECTO;
}

function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

export async function pantallaIntro(_p, cont) {
  aplicarEscena('inicio');
  document.body.classList.add('en-intro');
  const cfg = await leerConfig();

  const raiz = el('div', 'intro');
  raiz.setAttribute('role', 'button');
  raiz.setAttribute('tabindex', '0');
  raiz.setAttribute('aria-label', 'Toca para continuar');
  const marco = el('div', 'intro-marco');
  let video = null;
  let temporizador = null;
  let terminado = false;

  if (cfg.tipo === 'video' && cfg.archivo) {
    video = el('video', 'intro-medio');
    video.src = `contenido/intro/${cfg.archivo}`;
    video.playsInline = true;
    video.muted = cfg.silenciado !== false;
    video.autoplay = true;
    video.addEventListener('ended', continuar);
    video.addEventListener('error', () => { /* si el video no carga, la persona puede tocar para seguir */ });
    marco.appendChild(video);
  } else if (cfg.tipo === 'imagen' && cfg.archivo) {
    const img = el('img', 'intro-medio');
    img.src = `contenido/intro/${cfg.archivo}`;
    img.alt = cfg.titulo;
    marco.appendChild(img);
  } else {
    marco.classList.add('reservado');
    marco.innerHTML = `
      <div class="intro-logo">${logoSVG(180)}</div>
      <div class="intro-titulo">${cfg.titulo.replace(/[&<>"]/g, '')}</div>
      <div class="intro-sub">${(cfg.subtitulo || '').replace(/[&<>"]/g, '')}</div>
      <div class="intro-reserva">Espacio reservado para la intro</div>`;
  }

  const pie = el('div', 'intro-pie');
  pie.appendChild(el('span', 'intro-toca', 'Toca para continuar'));
  const barra = el('div', 'intro-barra');
  const relleno = el('i');
  barra.appendChild(relleno);
  raiz.append(marco, pie, barra);
  if (cfg.saltable) {
    const saltar = el('button', 'boton suave intro-saltar', 'Saltar');
    saltar.type = 'button';
    saltar.addEventListener('click', e => { e.stopPropagation(); continuar(); });
    raiz.appendChild(saltar);
  }
  cont.appendChild(raiz);

  function continuar() {
    if (terminado) return;
    terminado = true;
    marcarVista();
    ir('/');
  }

  raiz.addEventListener('click', continuar);
  raiz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') continuar(); });

  const segundos = Math.max(1, Number(cfg.duracionSegundos) || 6);
  if (video) {
    video.play().catch(() => { video.muted = true; video.play().catch(() => { /* hay que tocar */ }); });
    relleno.style.display = 'none';
  } else {
    relleno.style.transition = `width ${segundos}s linear`;
    requestAnimationFrame(() => requestAnimationFrame(() => { relleno.style.width = '100%'; }));
    temporizador = setTimeout(continuar, segundos * 1000);
  }

  return () => {
    clearTimeout(temporizador);
    if (video) video.pause();
    document.body.classList.remove('en-intro');
    marcarVista();
  };
}
