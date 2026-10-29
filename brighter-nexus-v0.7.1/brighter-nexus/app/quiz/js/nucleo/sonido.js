// Sonidos sintetizados con WebAudio: no hay archivos ni descargas.
let ctx = null;

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function nota(frec, inicio, dur, tipo = "sine", vol = 0.12) {
  const c = contexto();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + inicio;
  o.type = tipo;
  o.frequency.setValueAtTime(frec, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * sonido.volumen * 1.25), t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sonido = {
  activo: true,
  volumen: 0.8, // 0 a 1 (lo cambia la configuración)
  acierto() { if (this.activo && this.volumen > 0) { nota(660, 0, 0.14); nota(880, 0.1, 0.2); } },
  fallo() { if (this.activo && this.volumen > 0) { nota(220, 0, 0.18, "triangle", 0.16); nota(165, 0.14, 0.28, "triangle", 0.16); } },
  gana() { if (this.activo && this.volumen > 0) [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.12, 0.25)); },
  pierde() { if (this.activo && this.volumen > 0) [330, 262, 196, 147].forEach((f, i) => nota(f, i * 0.16, 0.3, "triangle", 0.15)); },
  toque() { if (this.activo && this.volumen > 0) nota(440, 0, 0.06, "sine", 0.07); },
};
