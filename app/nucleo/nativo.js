// Conexión con la app de Android hecha en Kotlin (celular/app/src/main/java/pe/brighter/nexus).
// Cuando la web corre dentro de ella, Android entrega el objeto window.NexusNativo con:
//   cerrar()                    vuelve al menú nativo (Kotlin)
//   partidaTerminada(json)      avisa de una partida del quiz para sumar estrellas en el perfil nativo
// En el navegador y en Windows ese objeto no existe y la web usa su propio menú, como siempre.
export const hayNativo = () => typeof window !== 'undefined' && !!window.NexusNativo;

export function cerrarNativo() {
  try { window.NexusNativo.cerrar(); return true; } catch (e) { return false; }
}

export function avisarPartida(detalle) {
  if (!hayNativo() || !window.NexusNativo.partidaTerminada) return;
  try { window.NexusNativo.partidaTerminada(JSON.stringify(detalle || {})); } catch (e) { /* sin puente */ }
}

// ---- Modo estudiante / tutor ----
// El menú Kotlin es quien guarda el modo. Al arrancar la web copia ese valor a su localStorage (clave 'nexus-modo') y,
// si la web cambia el modo (el quiz tiene su propio botón de usuario), se lo avisa a Kotlin.
if (hayNativo() && window.NexusNativo.modo) {
  try {
    localStorage.setItem('nexus-modo', window.NexusNativo.modo() === 'tutor' ? 'tutor' : 'estudiante');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (clave, valor) {
      original.call(this, clave, valor);
      if (clave === 'nexus-modo' && window.NexusNativo.guardarModo) window.NexusNativo.guardarModo(String(valor));
    };
  } catch (e) { /* sin almacenamiento */ }
}
