package pe.brighter.nexus

import android.content.Context
import android.content.res.Configuration
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Escala de diseño. Nexus está diseñado para una pantalla de 1080 unidades en su lado corto (1920×1080).
 * En un panel interactivo 4K (3840×2160) esas unidades se ven al doble de tamaño; en un teléfono (2400×1080) quedan 1:1.
 * Así iconos, botones y textos tienen SIEMPRE las mismas proporciones que en el panel, sea cual sea la pantalla:
 * en el teléfono verás el menú tal y como se verá en la pantalla interactiva (pon el teléfono en horizontal).
 *
 * Se logra cambiando la densidad de la actividad: 1 dp (y 1 px CSS dentro del WebView) pasa a ser (lado corto / 1080) píxeles reales.
 */
object Escala {
    const val LADO_CORTO_DISENO = 1080f

    fun envolver(base: Context): Context {
        val m = base.resources.displayMetrics
        val corto = min(m.widthPixels, m.heightPixels).toFloat()
        val config = Configuration(base.resources.configuration)
        config.densityDpi = (160f * corto / LADO_CORTO_DISENO).roundToInt().coerceAtLeast(60)
        config.fontScale = 1f
        return base.createConfigurationContext(config)
    }
}
