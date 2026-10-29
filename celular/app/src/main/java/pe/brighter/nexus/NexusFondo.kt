package pe.brighter.nexus

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.withTransform
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.min
import kotlin.random.Random

/**
 * Pliegues de origami del fondo (el .deco de menu.css / menu.js).
 *  - 5 triángulos grandes pegados a los bordes: entran al abrirse el menú y luego "respiran".
 *  - hasta 5 triangulitos que nacen y se desvanecen en el margen exterior.
 * Todo se calcula a partir de un solo reloj y se dibuja en un único Canvas: no hay animaciones sueltas ni recomposición.
 */

private val Ease = CubicBezierEasing(0.3f, 0.8f, 0.3f, 1f)
private fun suave(x: Float): Float { val t = x.coerceIn(0f, 1f); return t * t * (3f - 2f * t) }

private class Fijo(
    val color: Color, val poly: FloatArray,
    val ent: Float, val dur: Float, val e0: Float, val tx: Float, val ty: Float, val dx: Float, val dy: Float, val ciclo: Float,
    val rect: (Float, Float, Float) -> FloatArray      // (ancho, alto, vmin) -> x, y, w, h
)

private val FIJOS = listOf(
    Fijo(Marca.Coral, floatArrayOf(0f, 22f, 100f, 100f, 0f, 100f), 0.2f, 1.9f, 0.3f, -10f, 10f, 2.6f, -2.2f, 9f) { W, H, v ->
        floatArrayOf(-8 * v, H + 7 * v - 34 * v, 40 * v, 34 * v) },
    Fijo(Marca.Ambar, floatArrayOf(100f, 14f, 100f, 100f, 0f, 100f), 0.45f, 1.6f, 0.4f, 10f, 8f, -2.4f, -1.8f, 11f) { W, H, v ->
        floatArrayOf(W + 8 * v - 38 * v, H + 7 * v - 32 * v, 38 * v, 32 * v) },
    Fijo(Marca.Verde, floatArrayOf(100f, 0f, 100f, 100f, 0f, 52f), 0.7f, 1.5f, 0.5f, 8f, 0f, -2.2f, 2.4f, 10f) { W, H, v ->
        floatArrayOf(W + 7 * v - 24 * v, 0.30f * H, 24 * v, 30 * v) },
    Fijo(Marca.RojoOsc, floatArrayOf(0f, 0f, 100f, 50f, 0f, 100f), 0.35f, 1.7f, 0.45f, -8f, 0f, 2.4f, 2.2f, 8f) { W, H, v ->
        floatArrayOf(-6 * v, 0.26f * H, 22 * v, 28 * v) },
    Fijo(Marca.Naranja, floatArrayOf(0f, 100f, 100f, 100f, 60f, 0f), 0.9f, 1.2f, 0.2f, 0f, 6f, 2f, -1.6f, 7f) { W, H, v ->
        floatArrayOf(6 * v, H + 5 * v - 12 * v, 16 * v, 12 * v) }
)

private val FORMAS = listOf(
    floatArrayOf(0f, 100f, 100f, 100f, 0f, 0f), floatArrayOf(0f, 100f, 100f, 100f, 50f, 0f), floatArrayOf(0f, 0f, 100f, 40f, 20f, 100f),
    floatArrayOf(100f, 0f, 100f, 100f, 0f, 70f), floatArrayOf(10f, 100f, 100f, 85f, 55f, 0f), floatArrayOf(0f, 30f, 100f, 0f, 70f, 100f)
)
private val COLORES = listOf(Marca.Coral, Marca.Ambar, Marca.Verde, Marca.Naranja, Marca.RojoOsc, Marca.Coral, Marca.Verde, Marca.Ambar)

internal class Vivo(
    val poly: FloatArray, val color: Color, val xPct: Float, val yPct: Float, val w: Float, val h: Float,
    val nace: Long, val vidaMs: Float, val op: Float, val r0: Float, val r1: Float, val s0: Float, val s1: Float, val dx: Float, val dy: Float
)

/** Estado del fondo: reloj, triángulos vivos y cuándo se abrió el menú. */
class FondoEstado {
    internal val vivos = ArrayList<Vivo>()
    var anchoPx = 0f
    var altoPx = 0f
    var densidad = 1f
    var abiertoMs: Long = -1L
    private val programados = ArrayList<Long>(listOf(4200L, 5100L, 6000L, 6900L, 7800L))
    private var proximoCiclo = 9500L

    private fun rnd(a: Float, b: Float) = a + Random.nextFloat() * (b - a)

    private fun puntoLibre(tam: Float): FloatArray? {
        val W = anchoPx; val H = altoPx; val m = min(W, H)
        val S = min(W - 48 * densidad, H - 128 * densidad)
        val cx = W / 2f; val cy = 104 * densidad + (H - 128 * densidad) / 2f
        repeat(30) {
            val x = rnd(-3f, 103f); val y = rnd(-3f, 103f)
            val px = x / 100f * W; val py = y / 100f * H
            val aBorde = minOf(px, W - px, py, H - py) < m * 0.2f
            val lejos = hypot(px - cx, py - cy) > S * 0.5f + m * 0.04f + tam * m / 100f * 0.75f
            val esquinas = py < 130 * densidad && (px < 240 * densidad || px > W - 150 * densidad)
            if (aBorde && lejos && !esquinas) return floatArrayOf(x, y)
        }
        return null
    }

    private fun nuevo(ms: Long) {
        if (vivos.size >= 5 || anchoPx <= 0f) return
        val w = rnd(11f, 19f)
        val p = puntoLibre(w) ?: return
        val r0 = rnd(-20f, 20f)
        vivos.add(
            Vivo(
                FORMAS.random(), COLORES.random(), p[0], p[1], w, w * rnd(0.7f, 1.1f), ms, rnd(16f, 24f) * 1000f, rnd(0.5f, 0.8f),
                r0, r0 + rnd(-30f, 30f), rnd(0.5f, 0.8f), rnd(0.95f, 1.2f), rnd(-3f, 3f), rnd(-3f, 3f)
            )
        )
    }

    /** Se llama una vez por fotograma desde el reloj. */
    fun paso(ms: Long) {
        vivos.removeAll { ms - it.nace >= it.vidaMs }
        val vencidos = programados.filter { it <= ms }
        if (vencidos.isNotEmpty()) { programados.removeAll(vencidos.toSet()); vencidos.forEach { _ -> nuevo(ms) } }
        if (ms >= proximoCiclo) { nuevo(ms); proximoCiclo = ms + (rnd(1800f, 3200f)).toLong() }
    }
}

private fun trianguloPath(poly: FloatArray, x: Float, y: Float, w: Float, h: Float): Path = Path().apply {
    moveTo(x + poly[0] * w / 100f, y + poly[1] * h / 100f)
    lineTo(x + poly[2] * w / 100f, y + poly[3] * h / 100f)
    lineTo(x + poly[4] * w / 100f, y + poly[5] * h / 100f)
    close()
}

private fun DrawScope.dibujarFondo(estado: FondoEstado, ms: Long, tutor: Boolean) {
    val W = size.width; val H = size.height; val v = min(W, H) / 100f
    // grandes
    if (estado.abiertoMs >= 0L) {
        val t = (ms - estado.abiertoMs) / 1000f
        val op = if (tutor) 0.78f else 0.9f
        FIJOS.forEach { f ->
            if (t < f.ent) return@forEach
            val r = f.rect(W, H, v)
            val x = r[0]; val y = r[1]; val w = r[2]; val h = r[3]
            var alpha: Float; var tx = 0f; var ty = 0f; var esc = 1f
            if (t < f.ent + f.dur) {
                val e = Ease.transform((t - f.ent) / f.dur)
                alpha = op * e; esc = f.e0 + (1f - f.e0) * e
                tx = f.tx * (1f - e) * v; ty = f.ty * (1f - e) * v
            } else {
                val k = (t - f.ent - f.dur) / f.ciclo
                val frac = k - floor(k)
                val par = floor(k).toInt() % 2 == 0
                val e = suave(if (par) frac else 1f - frac)
                tx = f.dx * e * v; ty = f.dy * e * v
                alpha = op - 0.1f * e
            }
            val c = Offset(x + w / 2f, y + h / 2f)
            withTransform({ translate(tx, ty); scale(esc, esc, c) }) {
                drawPath(trianguloPath(f.poly, x, y, w, h), f.color, alpha = alpha.coerceIn(0f, 1f))
            }
        }
    }
    // pequeños
    val k = if (tutor) 0.85f else 1f
    estado.vivos.forEach { t ->
        val u = ((ms - t.nace) / t.vidaMs).coerceIn(0f, 1f)
        val alpha = t.op * k * when {
            u < 0.25f -> suave(u / 0.25f)
            u < 0.75f -> 1f
            else -> 1f - suave((u - 0.75f) / 0.25f)
        }
        val e = suave(u)
        val x = t.xPct / 100f * W; val y = t.yPct / 100f * H; val w = t.w * v; val h = t.h * v
        val c = Offset(x + w / 2f, y + h / 2f)
        val esc = t.s0 + (t.s1 - t.s0) * e
        withTransform({ translate(t.dx * e * v, t.dy * e * v); rotate(t.r0 + (t.r1 - t.r0) * e, c); scale(esc, esc, c) }) {
            drawPath(trianguloPath(t.poly, x, y, w, h), t.color, alpha = alpha.coerceIn(0f, 1f))
        }
    }
}

@Composable
fun CapaDeco(estado: FondoEstado, tiempo: State<Long>, tutor: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.fillMaxSize()) {
        estado.anchoPx = size.width; estado.altoPx = size.height; estado.densidad = density
        dibujarFondo(estado, tiempo.value, tutor)
    }
}
