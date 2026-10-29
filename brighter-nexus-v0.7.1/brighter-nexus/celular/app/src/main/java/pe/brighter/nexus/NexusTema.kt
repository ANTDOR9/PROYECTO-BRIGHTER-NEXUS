package pe.brighter.nexus

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight

/** Colores de marca (los mismos de app/menu/tema.css). */
object Marca {
    val Verde = Color(0xFF2CBB92)
    val Coral = Color(0xFFFE5440)
    val Naranja = Color(0xFFFE6D31)
    val Ambar = Color(0xFFF6952D)
    val Rojo = Color(0xFFE72624)
    val RojoOsc = Color(0xFFC9202E)
}

/** Poppins, la misma tipografía del menú web. */
val Poppins = FontFamily(
    Font(R.font.poppins_medium, FontWeight.Medium),
    Font(R.font.poppins_semibold, FontWeight.SemiBold),
    Font(R.font.poppins_bold, FontWeight.Bold),
    Font(R.font.poppins_extrabold, FontWeight.ExtraBold)
)

/** Colores que cambian entre modo estudiante (claro) y modo tutor (gris azulado oscuro). */
class Paleta(val tutor: Boolean) {
    val texto = if (tutor) Color(0xFFEEF2F8) else Color(0xFF282828)
    val suave = if (tutor) Color(0xFFAEB8C8) else Color(0xFF6B7280)
    val vidrio = if (tutor) Color(0x94222C3E) else Color(0xA3FFFFFF)
    val vidrioBorde = if (tutor) Color(0x29FFFFFF) else Color(0xF2FFFFFF)
}

// ───────────── datos del menú (los mismos de app/nucleo/menu-datos.js) ─────────────

data class Opcion(
    val ruta: String, val nombre: String, val descripcion: String,
    val icono: String, val color: Color, val etiqueta: String? = null
)

data class Seccion(
    val id: String, val color: Color, val icono: String, val cols: Int,
    val titulo: String, val apoyo: String, val resumen: String,
    val fotoA: Int, val fotoB: Int, val items: List<Opcion>
)

val SECCIONES = listOf(
    Seccion(
        "aprender", Marca.Verde, "i-libro", 3, "Aprender", "Elige una materia para empezar", "Guiado por materia",
        R.drawable.foto_aprender_1, R.drawable.foto_aprender_2,
        listOf(
            Opcion("/sesion/matematica", "Matemática", "Números, operaciones y problemas", "i-mate", Marca.Verde),
            Opcion("/sesion/lenguaje", "Lenguaje", "Leer, escribir y comunicar", "i-lenguaje", Marca.Coral),
            Opcion("/sesion/ciencias", "Ciencias", "Naturaleza, cuerpo y energía", "i-ciencia", Marca.Ambar)
        )
    ),
    Seccion(
        "explorar", Marca.Ambar, "i-cubo", 2, "Explorar 3D", "Mira, gira y descubre", "Modelos y medios",
        R.drawable.foto_explorar_1, R.drawable.foto_explorar_2,
        listOf(
            Opcion("/modulo/biblioteca3d", "Biblioteca 3D", "Modelos para girar y acercar", "i-cubo", Marca.RojoOsc),
            Opcion("/modulo/mediateca", "Mediateca", "Videos, imágenes y sonidos", "i-media", Marca.RojoOsc)
        )
    ),
    Seccion(
        "jugar", Marca.Coral, "i-mando", 2, "Jugar", "Aprende jugando", "Quiz y juegos",
        R.drawable.foto_jugar_1, R.drawable.foto_jugar_2,
        listOf(
            Opcion("/quiz", "Quiz", "Rondas rápidas de preguntas", "i-quiz", Marca.RojoOsc, "Ciencias"),
            Opcion("/modulo/juegos", "Juegos", "Acción y estrategia", "i-mando", Marca.RojoOsc, "Pronto")
        )
    ),
    Seccion(
        "pizarra", Marca.RojoOsc, "i-pizarra", 2, "Pizarra", "Tu espacio para explicar", "Explica y dibuja",
        R.drawable.foto_pizarra_1, R.drawable.foto_pizarra_2,
        listOf(
            Opcion("/pizarra/nueva", "Nueva clase", "Empieza con una pizarra en blanco", "i-nueva", Marca.RojoOsc),
            Opcion("/modulo/pizarra", "Continuar clase", "Retoma donde la dejaste", "i-seguir", Marca.RojoOsc)
        )
    )
)
