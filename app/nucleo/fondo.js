// Fondo de la app. Cada escena tiene su degradado y su acento (en estilos/tema.css)
// y sus propios símbolos flotando. Al entrar a una sesión se llama aplicarEscena('matematica')
// y el fondo anterior se desvanece mientras aparece el nuevo.

const ESCENAS = {
  inicio:       ['÷', '×', 'A', '⚛', '◆', '+', 'π'],
  matematica:   ['÷', '×', '−', '+', '=', '%', 'π'],
  lenguaje:     ['A', 'b', '¿', '?', '“', '¡', 'ñ'],
  ciencias:     ['⚛', '∿', 'Δ', '☼', '◐', '✦', '∞'],
  biblioteca3d: ['◇', '△', '□', '○', '⬡', '◈'],
  pizarra:      ['✎', '∿', '○', '□', '△', '+'],
  mediateca:    ['♪', '▶', '◉', '✦', '♫']
};

let actual = null;
let capaActual = null;

// Número "al azar" siempre igual para el mismo símbolo: el fondo no salta entre visitas.
const semilla = n => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };

function crearCapa(escena) {
  const capa = document.createElement('div');
  capa.className = 'fondo-capa';
  capa.dataset.escena = escena;
  ESCENAS[escena].forEach((simbolo, k) => {
    for (let n = 0; n < 3; n++) {
      const s = k * 3 + n;
      const i = document.createElement('i');
      i.textContent = simbolo;
      i.style.left = Math.round(semilla(s + 1) * 100) + '%';
      i.style.fontSize = Math.round(28 + semilla(s + 2) * 70) + 'px';
      i.style.animationDuration = Math.round(26 + semilla(s + 3) * 30) + 's';
      i.style.animationDelay = '-' + Math.round(semilla(s + 4) * 40) + 's';
      capa.appendChild(i);
    }
  });
  return capa;
}

export function aplicarEscena(id) {
  const escena = ESCENAS[id] ? id : 'inicio';
  if (escena === actual) return;
  actual = escena;
  document.body.dataset.escena = escena; // cambia el acento de toda la interfaz
  const contenedor = document.getElementById('fondo');
  const capa = crearCapa(escena);
  contenedor.appendChild(capa);
  requestAnimationFrame(() => capa.classList.add('visible'));
  const vieja = capaActual;
  capaActual = capa;
  if (vieja) { vieja.classList.remove('visible'); setTimeout(() => vieja.remove(), 1000); }
}

export const escenasDisponibles = () => Object.keys(ESCENAS);
