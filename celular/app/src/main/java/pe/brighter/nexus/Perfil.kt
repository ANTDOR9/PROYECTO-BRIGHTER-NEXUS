package pe.brighter.nexus

import android.content.Context
import org.json.JSONObject

/** Progreso guardado por la parte nativa (estrellas totales). La web guarda además el detalle en su propio almacenamiento. */
object Perfil {
    private const val ARCHIVO = "nexus_nativo"

    private fun prefs(c: Context) = c.getSharedPreferences(ARCHIVO, Context.MODE_PRIVATE)

    /** "estudiante" o "tutor": el menú Kotlin lo guarda y la web lo lee al arrancar. */
    fun modo(c: Context): String = prefs(c).getString("modo", "estudiante") ?: "estudiante"

    fun guardarModo(c: Context, modo: String) {
        prefs(c).edit().putString("modo", if (modo == "tutor") "tutor" else "estudiante").apply()
    }

    fun estrellas(c: Context): Int = prefs(c).getInt("estrellas", 0)

    /** La web avisa de cada partida terminada con un JSON como {"tema":"seres-vivos","estrellas":3,"puntos":120}. */
    fun registrarPartida(c: Context, json: String) {
        val ganadas = try { JSONObject(json).optInt("estrellas", 0) } catch (e: Exception) { 0 }
        if (ganadas <= 0) return
        prefs(c).edit().putInt("estrellas", estrellas(c) + ganadas).apply()
    }
}
