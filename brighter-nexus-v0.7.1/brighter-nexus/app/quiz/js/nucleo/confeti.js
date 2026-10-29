// Confeti en un lienzo a pantalla completa. Se crea al lanzar y se quita solo cuando termina.
import { reducirMovimiento } from "../ui.js";

const COLORES = ["#fe5440", "#ffb43a", "#1fa39a", "#ffffff", "#ff8a3d", "#7abf8e", "#ffd978"];
let lienzo = null;
let ctx = null;
let piezas = [];
let raf = 0;
let ultimo = 0;
let ancho = 0;
let alto = 0;

function preparar() {
  if (lienzo) return;
  lienzo = document.createElement("canvas");
  lienzo.setAttribute("aria-hidden", "true");
  lienzo.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60";
  document.body.appendChild(lienzo);
  ctx = lienzo.getContext("2d");
  ajustar();
  window.addEventListener("resize", ajustar);
}

function ajustar() {
  if (!lienzo) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ancho = window.innerWidth;
  alto = window.innerHeight;
  lienzo.width = Math.round(ancho * dpr);
  lienzo.height = Math.round(alto * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function quitar() {
  cancelAnimationFrame(raf);
  raf = 0;
  piezas = [];
  window.removeEventListener("resize", ajustar);
  if (lienzo) lienzo.remove();
  lienzo = ctx = null;
}

function paso(t) {
  const dt = Math.min(0.034, (t - ultimo) / 1000 || 0.016);
  ultimo = t;
  ctx.clearRect(0, 0, ancho, alto);
  const k = Math.min(ancho, alto) / 700;
  piezas = piezas.filter((p) => p.vida > 0 && p.y < alto + 40);
  for (const p of piezas) {
    p.vx *= 1 - 1.6 * dt;
    p.vy += 1100 * k * dt;
    p.vy *= 1 - 0.9 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.giro += p.vgiro * dt;
    p.vida -= dt;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p.vida * 1.6);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.giro);
    ctx.scale(1, Math.cos(p.giro * 2.3)); // da la sensación de que giran en el aire
    ctx.fillStyle = p.color;
    if (p.redondo) {
      ctx.beginPath();
      ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }
  if (piezas.length) raf = requestAnimationFrame(paso);
  else quitar();
}

/** Lanza confeti desde un punto de la pantalla (en píxeles). */
export function lanzarConfeti({ x = window.innerWidth / 2, y = window.innerHeight / 2, cantidad = 130 } = {}) {
  if (reducirMovimiento()) return;
  preparar();
  const k = Math.min(ancho, alto) / 700;
  for (let i = 0; i < cantidad; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
    const vel = (380 + Math.random() * 760) * k;
    piezas.push({
      x, y,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel,
      w: (7 + Math.random() * 8) * k,
      h: (4 + Math.random() * 6) * k,
      giro: Math.random() * Math.PI * 2,
      vgiro: (Math.random() - 0.5) * 14,
      color: COLORES[(Math.random() * COLORES.length) | 0],
      redondo: Math.random() < 0.25,
      vida: 1.8 + Math.random() * 1.4,
    });
  }
  if (!raf) {
    ultimo = performance.now();
    raf = requestAnimationFrame(paso);
  }
}

export function cancelarConfeti() {
  if (lienzo) quitar();
}
