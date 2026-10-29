// Aviso corto que aparece abajo y se va solo (por ejemplo, "¡Nueva medalla!").
export function aviso(icono, texto, ms = 3200) {
  const caja = document.createElement('div');
  caja.className = 'aviso';
  caja.setAttribute('role', 'status');
  const i = document.createElement('b');
  i.textContent = icono;
  const t = document.createElement('span');
  t.textContent = texto;
  caja.append(i, t);
  document.body.appendChild(caja);
  requestAnimationFrame(() => caja.classList.add('visible'));
  setTimeout(() => { caja.classList.remove('visible'); setTimeout(() => caja.remove(), 400); }, ms);
}
