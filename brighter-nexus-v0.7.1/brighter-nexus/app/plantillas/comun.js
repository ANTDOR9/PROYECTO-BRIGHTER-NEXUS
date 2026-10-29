// Ayudas pequeñas que comparten todas las plantillas.
export function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

// Mezcla una lista; si queda igual que al inicio vuelve a intentarlo (para que "ordenar" no venga ya ordenado).
export function mezclar(lista) {
  const original = lista.join('|');
  let copia = lista.slice();
  for (let intento = 0; intento < 10; intento++) {
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    if (copia.length < 2 || copia.join('|') !== original) break;
  }
  return copia;
}

// Cuántos errores se aceptan antes de mostrar la respuesta (como el 4.º error en divisiones).
export const ERRORES_PARA_REVELAR = 3;
