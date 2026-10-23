// Logo de Nexus: un nodo central que conecta tres mundos (matemática, lenguaje y ciencias).
export function logoSVG(tam = 64) {
  const nodos = [['var(--cian)', 50, 14], ['var(--rosa)', 14, 74], ['var(--lima)', 86, 74]];
  const lineas = nodos.map(([, x, y]) => `<line x1="50" y1="54" x2="${x}" y2="${y}" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`).join('');
  const circulos = nodos.map(([c, x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="${c}" stroke="#031F2B" stroke-width="3"/>`).join('');
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 100 100" role="img" aria-label="Brighter Nexus">${lineas}${circulos}<circle cx="50" cy="54" r="16" fill="var(--amarillo)" stroke="#031F2B" stroke-width="3"/></svg>`;
}
