package pe.brighter.nexus

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.Dp

// Los íconos de línea de app/menu/menu.js (viewBox 24x24, trazo redondeado de 1.9).
private fun circulo(cx: Float, cy: Float, r: Float) = "M${cx - r} ${cy}a$r $r 0 1 0 ${2 * r} 0a$r $r 0 1 0 ${-2 * r} 0"

private val ICONOS: Map<String, List<String>> = mapOf(
    "i-libro" to listOf("M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z", "M12 6v13.5"),
    "i-cubo" to listOf("M12 3l8 4.5v9L12 21l-8-4.5v-9z", "M4 7.5l8 4.5 8-4.5M12 12v9"),
    "i-mando" to listOf(
        "M7 8h10a4 4 0 0 1 4 4v1.5a3 3 0 0 1-5.4 1.8L14.5 14h-5l-1.1 1.3A3 3 0 0 1 3 13.5V12a4 4 0 0 1 4-4z",
        "M8 10.5v3M6.5 12h3M15.5 11.2h.01M17.5 12.8h.01"
    ),
    "i-pizarra" to listOf("M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M8 20l2-4M16 20l-2-4M7.5 12l3-3 2.5 2.5 3.5-3.5"),
    "i-mate" to listOf("M8 3.5v8M4 7.5h8M14 7.5h6.5M14.5 14.5l6 6M20.5 14.5l-6 6M4 17h7M4 20.5h7"),
    "i-lenguaje" to listOf("M4 5h16v11h-9l-4 4v-4H4z", "M9 13l3-6 3 6M10 11.5h4"),
    "i-ciencia" to listOf("M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3M7.5 15h9"),
    "i-media" to listOf("M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M10 9.5v5l4.5-2.5z"),
    "i-quiz" to listOf(circulo(12f, 12f, 9f), "M9.5 9.5a2.5 2.5 0 1 1 4 1.9c-.9.7-1.5 1.2-1.5 2.3M12 16.8h.01"),
    "i-nueva" to listOf("M12 5v14M5 12h14"),
    "i-estudiante" to listOf("M12 2.5l7 3.2-7 3.2-7-3.2z", circulo(12f, 13.2f, 2.9f), "M5.5 21.5c.6-3.7 3.2-5.5 6.5-5.5s5.9 1.8 6.5 5.5"),
    "i-tutor" to listOf(
        circulo(8.5f, 8f, 3f), "M2.5 20.5c.6-3.8 3-5.6 6-5.6 1.4 0 2.6.4 3.6 1.1",
        "M13.5 5h8v7h-8zM17.5 12v4.5M14.5 18.5h6"
    ),
    "i-seguir" to listOf("M7 4.5v15l12-7.5z")
)

private fun trazos(id: String): List<Path> = (ICONOS[id] ?: emptyList()).map { PathParser().parsePathString(it).toPath() }

/** Ícono de línea (sin fondo). */
@Composable
fun IconoLinea(id: String, color: Color, tam: Dp, modifier: Modifier = Modifier) {
    val paths = remember(id) { trazos(id) }
    Canvas(modifier.size(tam)) {
        val k = size.minDimension / 24f
        scale(k, k, Offset.Zero) {
            paths.forEach { drawPath(it, color, style = Stroke(width = 1.9f, cap = StrokeCap.Round, join = StrokeJoin.Round)) }
        }
    }
}

/** Ícono sobre un hexágono de color (el .hex del menú web: polígono 50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%). */
@Composable
fun Hexagono(icono: String, color: Color, tam: Dp, modifier: Modifier = Modifier) {
    val paths = remember(icono) { trazos(icono) }
    Canvas(modifier.size(tam)) {
        val w = size.width
        val hex = Path().apply {
            moveTo(w * 0.50f, 0f); lineTo(w * 0.93f, w * 0.25f); lineTo(w * 0.93f, w * 0.75f)
            lineTo(w * 0.50f, w); lineTo(w * 0.07f, w * 0.75f); lineTo(w * 0.07f, w * 0.25f); close()
        }
        drawPath(hex, color, style = Fill)
        val lado = w * 0.52f
        translate((w - lado) / 2f, (w - lado) / 2f) {
            scale(lado / 24f, lado / 24f, Offset.Zero) {
                paths.forEach { drawPath(it, Color.White, style = Stroke(width = 1.9f, cap = StrokeCap.Round, join = StrokeJoin.Round)) }
            }
        }
    }
}
