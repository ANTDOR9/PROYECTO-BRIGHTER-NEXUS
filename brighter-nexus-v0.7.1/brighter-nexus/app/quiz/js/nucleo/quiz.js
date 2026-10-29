// Lógica del quiz, sin nada de pantalla. Sirve para cualquier tema y cualquier juego.

const PUNTOS_ACIERTO = 10;
const PUNTOS_SIN_PISTA = 5;

function mezclar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cambia el orden de las opciones y recalcula cuál es la correcta.
function preparar(p) {
  const orden = mezclar(p.opciones.map((texto, i) => ({ texto, ok: i === p.correcta })));
  return {
    pregunta: p.pregunta,
    opciones: orden.map((o) => o.texto),
    correcta: orden.findIndex((o) => o.ok),
    explicacion: p.explicacion,
    pista: p.pista || "",
    imagen: p.imagen || "",
    subtema: p.subtema || "",
  };
}

export function crearQuiz(tema, { vidas = 3, focos = 3 } = {}) {
  const preguntas = tema.preguntas.map(preparar);
  const total = preguntas.length;
  let i = 0;
  let vidasAct = vidas;
  let focosAct = focos;
  let puntos = 0;
  let racha = 0;
  let aciertos = 0;
  let respuesta = null; // resultado de la pregunta actual, o null si falta responder
  let pistaUsada = false;
  let resultado = null; // 'gano' | 'perdio' | null
  let infinito = false; // modo tutor: los errores no cuestan vidas
  const fallados = [];

  const q = () => preguntas[i];

  return {
    total,
    vidasMax: vidas,
    get indice() { return i; },
    get vidas() { return vidasAct; },
    get focos() { return focosAct; },
    get puntos() { return puntos; },
    get racha() { return racha; },
    get resultado() { return resultado; },
    get respuesta() { return respuesta; },
    get infinito() { return infinito; },
    setInfinito(v) { infinito = !!v; },
    get pistaUsada() { return pistaUsada; },
    /** Hay una partida empezada y sin terminar. */
    get enCurso() { return resultado === null && (i > 0 || respuesta !== null); },
    actual() { return q(); },

    /** Gasta un foco y devuelve el texto de la pista (o null si no se puede). */
    pedirPista() {
      if (respuesta || !q().pista) return null;
      if (!pistaUsada) {
        if (focosAct < 1) return null;
        focosAct--;
        pistaUsada = true;
      }
      return q().pista;
    },

    responder(elegida) {
      if (respuesta || resultado) return null;
      const p = q();
      const acierto = elegida === p.correcta;
      if (acierto) {
        aciertos++;
        racha++;
        puntos += PUNTOS_ACIERTO + (pistaUsada ? 0 : PUNTOS_SIN_PISTA);
      } else {
        if (!infinito) vidasAct--;
        racha = 0;
        fallados.push({
          subtema: p.subtema,
          pregunta: p.pregunta,
          correcta: p.opciones[p.correcta],
          explicacion: p.explicacion,
        });
      }
      if (vidasAct <= 0) resultado = "perdio";
      else if (i === total - 1) resultado = "gano";
      respuesta = { elegida, correcta: p.correcta, acierto, explicacion: p.explicacion, pista: p.pista, fin: resultado };
      return respuesta;
    },

    /** Pasa a la pregunta siguiente. Devuelve false si la partida ya terminó. */
    siguiente() {
      if (!respuesta || resultado) return false;
      i++;
      respuesta = null;
      pistaUsada = false;
      return true;
    },

    resumen() {
      const errores = fallados.length;
      const estrellas = resultado === "gano" ? (errores === 0 ? 3 : errores === 1 ? 2 : 1) : 0;
      return { resultado, puntos, estrellas, aciertos, total, fallados: fallados.slice() };
    },
  };
}
