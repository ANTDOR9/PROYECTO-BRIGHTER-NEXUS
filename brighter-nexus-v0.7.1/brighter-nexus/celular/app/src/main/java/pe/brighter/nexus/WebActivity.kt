package pe.brighter.nexus

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader

/**
 * Muestra una pantalla de la parte web de Nexus (quiz, visor 3D, pizarra, actividades…) a pantalla completa.
 * La web vive en assets/public (la copia `npx cap sync`). Se sirve por https://appassets.androidplatform.net/ para que
 * los módulos de JavaScript, fetch, localStorage y los iframes funcionen igual que en el navegador.
 *
 * Conexión Kotlin <-> web:
 *   - Kotlin -> web: la ruta inicial va en la dirección (…/index.html#/quiz).
 *   - web -> Kotlin: el objeto NexusNativo (ver Puente) con cerrar() y partidaTerminada(json).
 */
class WebActivity : ComponentActivity() {
    override fun attachBaseContext(nuevo: android.content.Context) { super.attachBaseContext(Escala.envolver(nuevo)) }

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }

        val ruta = intent.getStringExtra(EXTRA_RUTA) ?: "/"
        val cargador = WebViewAssetLoader.Builder()
            .setDomain(DOMINIO)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this).apply {
            setBackgroundColor(0xFF031F2B.toInt())
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true            // localStorage: el progreso de la web
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            addJavascriptInterface(Puente(applicationContext), "NexusNativo")
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    cargador.shouldInterceptRequest(request.url)
            }
        }
        setContentView(web)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })

        web.loadUrl("https://$DOMINIO/assets/public/index.html#$ruta")
    }

    override fun onPause() { super.onPause(); web.onPause() }
    override fun onResume() { super.onResume(); web.onResume() }

    override fun onDestroy() {
        // Libera la memoria de la web (modelos 3D, WebGL)
        web.loadUrl("about:blank")
        web.destroy()
        super.onDestroy()
    }

    /** Lo que la web puede pedirle a Kotlin. En JavaScript: window.NexusNativo.cerrar(), window.NexusNativo.partidaTerminada('{...}') */
    inner class Puente(private val contexto: Context) {
        @JavascriptInterface
        fun cerrar() { runOnUiThread { finish() } }

        /** Modo de uso elegido en el menú Kotlin ("estudiante" o "tutor"): la web lo copia a su localStorage al arrancar. */
        @JavascriptInterface
        fun modo(): String = Perfil.modo(contexto)

        @JavascriptInterface
        fun guardarModo(modo: String) { Perfil.guardarModo(contexto, modo) }

        @JavascriptInterface
        fun partidaTerminada(json: String) { Perfil.registrarPartida(contexto, json) }
    }

    companion object {
        private const val EXTRA_RUTA = "ruta"
        private const val DOMINIO = "appassets.androidplatform.net"

        /** Abre una pantalla de la web. `ruta` es la misma que usa la web: "/quiz", "/modulo/biblioteca3d", "/sesion/matematica"… */
        fun abrir(contexto: Context, ruta: String) {
            contexto.startActivity(Intent(contexto, WebActivity::class.java).putExtra(EXTRA_RUTA, ruta))
        }
    }
}
