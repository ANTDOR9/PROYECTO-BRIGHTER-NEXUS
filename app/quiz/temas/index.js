// Catálogo de temas de quiz. Cada tema tiene su archivo en su carpeta; mientras no exista,
// va con estado 'pronto' y se ve en la lista con la etiqueta "Pronto".
// Para activar uno: crear su archivo (ver ciencias/seres-vivos.js), ponerle `archivo` y estado 'listo'.
const V = "Ciencias de la vida";
const F = "Ciencias físicas y químicas";
const T = "Ciencias de la Tierra y el Universo";

const tema = (id, nivel, dimension, titulo, extra = {}) => ({
  id, area: "ciencias", nivel, dimension, titulo, estado: "pronto", ...extra,
});

export const temas = [
  // Primaria
  tema("seres-vivos", "Primaria", V, "Seres vivos y no vivos", {
    estado: "listo",
    cargar: () => import("./ciencias/seres-vivos.js"),
  }),
  tema("plantas", "Primaria", V, "Partes de la planta y fotosíntesis"),
  tema("animales", "Primaria", V, "Animales: vertebrados e invertebrados"),
  tema("cuerpo-humano", "Primaria", V, "Cuerpo humano: digestivo, respiratorio y circulatorio"),
  tema("alimentacion", "Primaria", V, "Alimentación saludable e higiene"),
  tema("estados-materia", "Primaria", F, "Estados de la materia y sus cambios"),
  tema("mezclas", "Primaria", F, "Mezclas y cómo separarlas"),
  tema("luz-sonido", "Primaria", F, "La luz y el sonido"),
  tema("fuerzas-imanes", "Primaria", F, "Fuerzas, movimiento e imanes"),
  tema("energia", "Primaria", F, "Energía y electricidad básica"),
  tema("sistema-solar", "Primaria", T, "El sistema solar y los planetas"),
  tema("dia-noche", "Primaria", T, "Día y noche, estaciones y fases de la Luna"),
  tema("ciclo-agua", "Primaria", T, "El ciclo del agua"),
  tema("suelo-relieve", "Primaria", T, "Suelo, rocas, relieve y ecosistemas del Perú"),
  tema("ambiente", "Primaria", T, "Cuidado del ambiente, reciclaje y sismos"),
  // Secundaria
  tema("celula", "Secundaria", V, "La célula y sus partes"),
  tema("herencia", "Secundaria", V, "Herencia, genética básica y evolución"),
  tema("atomo", "Secundaria", F, "El átomo, la tabla periódica y elementos comunes"),
  tema("newton", "Secundaria", F, "Fuerza, velocidad y leyes de Newton"),
  tema("tierra-capas", "Secundaria", T, "Capas de la Tierra, placas tectónicas y volcanes"),
  tema("universo", "Secundaria", T, "Universo, gravedad, galaxias y cambio climático"),
];

export const buscarTema = (id) => temas.find((t) => t.id === id) || null;

/** Carga las preguntas de un tema. Devuelve { ...datos del tema, preguntas }. */
export async function cargarTema(id) {
  const meta = buscarTema(id);
  if (!meta || meta.estado !== "listo") return null;
  const modulo = await meta.cargar();
  return { ...meta, ...modulo.default };
}
