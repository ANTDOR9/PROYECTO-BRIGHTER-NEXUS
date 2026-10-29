package pe.brighter.nexus

import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.rotate as rotarDibujo
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.imageResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlinx.coroutines.Job
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Menú principal de Brighter Nexus en Kotlin / Jetpack Compose.
 * Es la misma pantalla que app/menu/menu.js + menu.css + tema.css: mismas medidas (el círculo es el mayor cuadrado que cabe bajo la
 * barra superior, en múltiplos de 40), mismos colores, mismas fotos, tiempos y curvas de animación.
 * Todo lo que se mueve se calcula en la fase de dibujo (graphicsLayer / Canvas) leyendo un solo reloj de fotogramas, así que no
 * hay recomposiciones por cuadro ni capas peleándose por el primer plano: eso es lo que quita el parpadeo.
 */
class MenuActivity : ComponentActivity() {
    override fun attachBaseContext(nuevo: android.content.Context) { super.attachBaseContext(Escala.envolver(nuevo)) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= 28) {
            window.attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        setContent {
            // los tamaños del diseño web están en px CSS: aquí 1 dp = 1 px CSS y la letra no cambia con el tamaño de fuente del sistema
            val d = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(d.density, 1f)) {
                NexusMenu(
                    modoInicial = Perfil.modo(this),
                    guardarModo = { Perfil.guardarModo(this, it) },
                    abrirWeb = { WebActivity.abrir(this, it) },
                    salir = { finish() }
                )
            }
        }
    }
}

// ───────────── utilidades ─────────────

private val Ease = CubicBezierEasing(0.3f, 0.8f, 0.3f, 1f)
private val EaseZoom = CubicBezierEasing(0.55f, 0f, 0.2f, 1f)
private fun suave(x: Float): Float { val t = x.coerceIn(0f, 1f); return t * t * (3f - 2f * t) }
private fun cl(minimo: Float, v: Float, maximo: Float) = v.coerceIn(minimo, maximo)
/** color-mix(in srgb, a pa%, b) */
private fun mezcla(a: Color, b: Color, pa: Float) = lerp(b, a, pa)
private fun estilo(tam: Float, peso: FontWeight, color: Color, espacio: Float = 0f, interlineado: Float = 1.15f, centrado: Boolean = false) =
    TextStyle(
        fontFamily = Poppins, fontWeight = peso, fontSize = tam.sp, color = color, letterSpacing = espacio.sp,
        lineHeight = (tam * interlineado).sp, textAlign = if (centrado) TextAlign.Center else TextAlign.Start
    )

private val RETRASO_PIEZA = longArrayOf(120, 200, 280, 360)
private val FASE_FOTO = floatArrayOf(0f, -3.5f, -7f, -10.5f)
private val ORIGEN_PIEZA = arrayOf(TransformOrigin(1.1f, 1.1f), TransformOrigin(-0.1f, 1.1f), TransformOrigin(1.1f, -0.1f), TransformOrigin(-0.1f, -0.1f))
private val TXT_X = floatArrayOf(0.55f, 0.45f, 0.55f, 0.45f)
private val TXT_Y = floatArrayOf(0.52f, 0.52f, 0.48f, 0.48f)
private val SOMBRA_A = Color(0x2646505A)
private val SOMBRA_B = Color(0x3346505A)

private class Anim {
    val piezas = List(4) { Animatable(0f) }
    val fotos = Animatable(0f)
    val zoom = Animatable(0f)
    val wrapAlpha = Animatable(1f)
    val sec = Animatable(0f)
    val intro = Animatable(0f)
    val pliegue = Animatable(0f)
    val inicio = Animatable(0f)
    val consejero = Animatable(0f)
    val usuario = Animatable(0f)
    val vuelta = Animatable(0f)
}

// ───────────── pantalla ─────────────

@Composable
fun NexusMenu(modoInicial: String, guardarModo: (String) -> Unit, abrirWeb: (String) -> Unit, salir: () -> Unit) {
    var tutor by remember { mutableStateOf(modoInicial == "tutor") }
    val paleta = remember(tutor) { Paleta(tutor) }
    val a = remember { Anim() }
    val scope = rememberCoroutineScope()
    val tiempo = remember { mutableStateOf(0L) }
    val fondo = remember { FondoEstado() }

    var abierta by remember { mutableStateOf<String?>(null) }
    var mostrada by remember { mutableStateOf<Seccion?>(null) }
    var origen by remember { mutableStateOf(Offset.Zero) }
    var modosOpen by remember { mutableStateOf(false) }
    var consejeroVisible by remember { mutableStateOf(false) }
    var trabajo by remember { mutableStateOf<Job?>(null) }
    var cierreModos by remember { mutableStateOf<Job?>(null) }
    var cajaUsuario by remember { mutableStateOf(Rect.Zero) }

    // fotos decodificadas de una vez, antes de que el menú se abra
    val fotos = SECCIONES.map { ImageBitmap.imageResource(it.fotoA) to ImageBitmap.imageResource(it.fotoB) }
    val logo = ImageBitmap.imageResource(R.drawable.logo_nexus)

    // reloj único de fotogramas (todo lo que flota o gira lo lee en la fase de dibujo)
    LaunchedEffect(Unit) {
        var base = -1L
        while (true) {
            androidx.compose.runtime.withFrameMillis { f ->
                if (base < 0) base = f
                val ms = f - base
                tiempo.value = ms
                fondo.paso(ms)
            }
        }
    }

    // entrada: las 4 piezas se abren solas; las fotos aparecen cuando ya están abiertas; el consejero saluda
    LaunchedEffect(Unit) {
        launch { delay(200); a.usuario.animateTo(1f, tween(700, easing = Ease)) }
        delay(250)
        fondo.abiertoMs = tiempo.value
        a.piezas.forEachIndexed { i, p -> launch { delay(RETRASO_PIEZA[i] - 120); p.animateTo(1f, tween(600, easing = Ease)) } }
        launch { delay(900); a.fotos.animateTo(1f, tween(900, delayMillis = 350)) }
        launch { delay(700); consejeroVisible = true; a.consejero.animateTo(1f, tween(3800, easing = LinearEasing)); consejeroVisible = false }
    }

    fun abrirSeccion(s: Seccion, centro: Offset) {
        if (abierta != null) return
        origen = centro; abierta = s.id; mostrada = s
        trabajo?.cancel()
        trabajo = scope.launch {
            a.fotos.animateTo(0f, tween(350))           // 1) las fotos se desvanecen
            delay(30)
            coroutineScope {                             // 2) y entonces empieza el zoom
                launch { a.zoom.animateTo(1f, tween(850, easing = EaseZoom)) }
                launch { delay(400); a.wrapAlpha.animateTo(0f, tween(350)) }
                launch { a.sec.animateTo(1f, tween(400, delayMillis = 450)) }
                launch { a.inicio.animateTo(1f, tween(450, delayMillis = 550, easing = Ease)) }
                launch { a.intro.snapTo(0f); a.intro.animateTo(2f, tween(2000, easing = LinearEasing)) }
                launch { a.pliegue.snapTo(0f); a.pliegue.animateTo(1f, tween(800, delayMillis = 350, easing = Ease)) }
            }
        }
    }

    fun cerrarSeccion() {
        if (abierta == null) return
        abierta = null
        trabajo?.cancel()
        trabajo = scope.launch {
            coroutineScope {
                launch { a.zoom.animateTo(0f, tween(600, easing = Ease)) }
                launch { a.wrapAlpha.animateTo(1f, tween(300)) }
                launch { a.sec.animateTo(0f, tween(300)) }
                launch { a.inicio.animateTo(0f, tween(300)) }
                launch { a.fotos.animateTo(1f, tween(900, delayMillis = 350)) }   // las fotos vuelven al terminar el zoom
            }
            a.intro.snapTo(0f); a.pliegue.snapTo(0f); mostrada = null
        }
    }

    fun girar() { scope.launch { a.vuelta.snapTo(0f); a.vuelta.animateTo(360f, tween(800, easing = Ease)) } }

    BackHandler(enabled = modosOpen || abierta != null) {
        if (modosOpen) modosOpen = false else cerrarSeccion()
    }

    val apagando by animateFloatAsState(if (abierta != null) 1f else 0f, tween(200), label = "apagando")

    BoxWithConstraints(
        Modifier
            .fillMaxSize()
            .pointerInput(Unit) {   // tocar fuera de la barra de modos la cierra
                awaitEachGesture {
                    val ev = awaitPointerEvent(PointerEventPass.Initial)
                    if (ev.type == PointerEventType.Press && modosOpen && !cajaUsuario.contains(ev.changes.first().position)) modosOpen = false
                }
            }
    ) {
        val W = maxWidth.value; val H = maxHeight.value
        val S = max(40f, floor(min(W - 48f, H - 128f) / 40f) * 40f)       // tamaño del círculo (múltiplo de 40)
        val izq = floor((W - S) / 2f)
        val arr = 104f + floor((H - 128f - S) / 2f)
        val vmin = min(W, H) / 100f
        val densidad = LocalDensity.current.density

        // ── fondo claro + fondo del modo tutor ──
        Canvas(Modifier.fillMaxSize()) {
            val cx = size.width * 0.5f; val cy = size.height * 0.38f
            val rx = size.width * 0.5f * 1.4142f; val ry = size.height * 0.62f * 1.4142f
            withTransform({ scale(1f, ry / rx, Offset(cx, cy)) }) {
                drawCircle(
                    Brush.radialGradient(0f to Color(0xFFF7F8FA), 0.52f to Color(0xFFECEEF2), 1f to Color(0xFFD9DDE3), center = Offset(cx, cy), radius = rx),
                    radius = rx, center = Offset(cx, cy)
                )
            }
        }
        val tutorAlfa by animateFloatAsState(if (tutor) 1f else 0f, tween(700), label = "fondoTutor")
        Canvas(Modifier.fillMaxSize().graphicsLayer { alpha = tutorAlfa }) {
            val cx = size.width * 0.5f; val cy = size.height * 0.38f
            val rx = size.width * 0.5f * 1.4142f; val ry = size.height * 0.62f * 1.4142f
            withTransform({ scale(1f, ry / rx, Offset(cx, cy)) }) {
                drawCircle(
                    Brush.radialGradient(0f to Color(0xFF4C596F), 0.52f to Color(0xFF3B4659), 1f to Color(0xFF2B3445), center = Offset(cx, cy), radius = rx),
                    radius = rx, center = Offset(cx, cy)
                )
            }
        }

        // ── pliegues de origami ──
        CapaDeco(fondo, tiempo, tutor)

        // ── círculo (4 piezas + logo) con el mega zoom ──
        val P = S * 0.475f
        val centrosPx = remember(S, densidad) {
            listOf(Offset(0f, 0f), Offset(0.525f * S, 0f), Offset(0f, 0.525f * S), Offset(0.525f * S, 0.525f * S))
                .map { Offset((it.x + P / 2f) * densidad, (it.y + P / 2f) * densidad) }
        }
        Box(
            Modifier
                .offset(izq.dp, arr.dp)
                .size(S.dp)
                .graphicsLayer {
                    transformOrigin = TransformOrigin(origen.x / size.width, origen.y / size.height)
                    val z = 1f + 4.5f * a.zoom.value
                    scaleX = z; scaleY = z
                    alpha = a.wrapAlpha.value
                }
        ) {
            SECCIONES.take(4).forEachIndexed { i, s ->
                val px = if (i % 2 == 0) 0f else 0.525f * S
                val py = if (i < 2) 0f else 0.525f * S
                Pieza(
                    i = i, s = s, P = P, S = S, tutor = tutor, tiempo = tiempo, foto = fotos[i],
                    progreso = { a.piezas[i].value }, fotosAlfa = { a.fotos.value },
                    modifier = Modifier.offset(px.dp, py.dp),
                    alTocar = { abrirSeccion(s, centrosPx[i]) }
                )
            }
            Centro(S, logo, tiempo)
        }

        // ── pantalla de la sección (después del zoom) ──
        mostrada?.let { s ->
            PantallaSeccion(
                s = s, paleta = paleta, vmin = vmin, ancho = W, alto = H,
                alfa = { a.sec.value }, intro = { a.intro.value }, pliegue = { a.pliegue.value },
                activa = abierta != null, abrir = abrirWeb
            )
        }

        // ── botón Inicio ──
        Row(
            Modifier
                .align(Alignment.TopStart)
                .padding(start = 24.dp, top = 16.dp)
                .graphicsLayer {
                    val e = a.inicio.value
                    alpha = min(1f, e * 1.4f)
                    scaleX = 0.8f + 0.2f * e; scaleY = scaleX
                    transformOrigin = TransformOrigin(0f, 0.5f)
                }
                .shadow(10.dp, RoundedCornerShape(50), ambientColor = Color(0x66FE5440), spotColor = Color(0x66FE5440))
                .height(72.dp)
                .clip(RoundedCornerShape(50))
                .background(Marca.Coral)
                .clickable(enabled = abierta != null, interactionSource = remember { MutableInteractionSource() }, indication = null) { cerrarSeccion() }
                .padding(start = 8.dp, end = 34.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(Modifier.size(56.dp).clip(CircleShape).background(Color.White), contentAlignment = Alignment.Center) {
                Image(
                    logo, null,
                    Modifier.fillMaxWidth(0.74f).graphicsLayer { translationX = -0.03f * size.width; translationY = 0.02f * size.height }
                )
            }
            Text("Inicio", style = estilo(cl(16f, 2.2f * vmin, 28f), FontWeight.Bold, Color.White))
        }

        // ── botón de usuario y barra de modos ──
        BotonUsuario(
            tutor = tutor, abierto = modosOpen, paleta = paleta, tiempo = tiempo,
            entra = { a.usuario.value }, vuelta = { a.vuelta.value },
            alCaja = { cajaUsuario = it },
            alUsuario = { girar(); modosOpen = !modosOpen; cierreModos?.cancel() },
            alModo = { nuevo ->
                if ((nuevo == "tutor") != tutor) { girar(); tutor = nuevo == "tutor"; guardarModo(nuevo) }
                cierreModos?.cancel()
                cierreModos = scope.launch { delay(600); modosOpen = false }
            }
        )

        // ── consejero de bienvenida ──
        if (consejeroVisible) {
            Consejero(vmin, tutor, tiempo, logo, progreso = { a.consejero.value }, oculto = { apagando })
        }
    }
}

// ───────────── piezas del círculo ─────────────

@Composable
private fun Pieza(
    i: Int, s: Seccion, P: Float, S: Float, tutor: Boolean, tiempo: State<Long>, foto: Pair<ImageBitmap, ImageBitmap>,
    progreso: () -> Float, fotosAlfa: () -> Float, modifier: Modifier, alTocar: () -> Unit
) {
    val forma = when (i) {
        0 -> RoundedCornerShape(topStartPercent = 100)
        1 -> RoundedCornerShape(topEndPercent = 100)
        2 -> RoundedCornerShape(bottomStartPercent = 100)
        else -> RoundedCornerShape(bottomEndPercent = 100)
    }
    val fondoPieza by animateColorAsState(mezcla(s.color, Color.White, if (tutor) 0.30f else 0.09f), tween(600), label = "piezaFondo")
    val xf = TXT_X[i]; val yf = TXT_Y[i]
    val grosor = cl(4f, S * 0.0085f, 10f)
    val hex = cl(52f, S * 0.09f, 130f)
    val interaccion = remember { MutableInteractionSource() }
    val presionado by interaccion.collectIsPressedAsState()
    val escalaTxt by animateFloatAsState(if (presionado) 0.94f else 1f, tween(150), label = "txt")
    val filtro = remember(tutor) { if (tutor) ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(1.35f) }) else null }

    Box(
        modifier
            .size(P.dp)
            .graphicsLayer {
                val e = progreso()
                alpha = e
                val k = 0.5f + 0.5f * e
                scaleX = k; scaleY = k
                transformOrigin = ORIGEN_PIEZA[i]
            }
            .shadow(8.dp, forma, ambientColor = SOMBRA_A, spotColor = SOMBRA_B)
            .clip(forma)
            .background(fondoPieza)
            .clickable(interactionSource = interaccion, indication = null) { alTocar() }
    ) {
        // fotos: dos por botón, se alternan con fundido suave y un acercamiento lento
        Box(Modifier.fillMaxSize().graphicsLayer { alpha = fotosAlfa() }) {
            FotoAnimada(foto.first, false, FASE_FOTO[i], tiempo, filtro)
            FotoAnimada(foto.second, true, FASE_FOTO[i], tiempo, filtro)
        }

        // filtro de color claro + resplandor suave detrás del texto
        Canvas(Modifier.fillMaxSize()) {
            val tam = size.width
            val cx = xf * tam; val cy = yf * tam
            val base = if (tutor) mezcla(s.color, Color.White, 0.70f).copy(alpha = 0.58f) else mezcla(s.color, Color.White, 0.30f).copy(alpha = 0.52f)
            drawRect(base)
            val rx = (if (tutor) 0.60f else 0.66f) * tam
            val ry = (if (tutor) 0.40f else 0.46f) * tam
            val a0 = if (tutor) 0.82f else 0.90f
            val a1 = if (tutor) 0.50f else 0.62f
            withTransform({ scale(1f, ry / rx, Offset(cx, cy)) }) {
                drawCircle(
                    Brush.radialGradient(
                        0f to Color.White.copy(alpha = a0), 0.58f to Color.White.copy(alpha = a1), 1f to Color.White.copy(alpha = 0f),
                        center = Offset(cx, cy), radius = rx
                    ),
                    radius = rx, center = Offset(cx, cy)
                )
            }
        }

        // contorno de color solo en la parte curva
        Canvas(Modifier.fillMaxSize()) {
            val g = grosor.dp.toPx()
            val tam = size.width
            val r = tam - g / 2f
            val (cx, cy, ini) = when (i) {
                0 -> Triple(tam, tam, 180f)
                1 -> Triple(0f, tam, 270f)
                2 -> Triple(tam, 0f, 90f)
                else -> Triple(0f, 0f, 0f)
            }
            drawArc(
                color = s.color, startAngle = ini, sweepAngle = 90f, useCenter = false,
                topLeft = Offset(cx - r, cy - r), size = Size(2f * r, 2f * r), style = Stroke(width = g)
            )
        }

        // texto + ícono en la franja entre el círculo y el borde
        Column(
            Modifier
                .layout { medible, c ->
                    val ancho = (c.maxWidth * 0.8f).roundToInt()
                    val col = medible.measure(Constraints(minWidth = ancho, maxWidth = ancho, minHeight = 0, maxHeight = Constraints.Infinity))
                    layout(c.maxWidth, c.maxHeight) {
                        col.place((xf * c.maxWidth - ancho / 2f).roundToInt(), (yf * c.maxHeight - col.height / 2f).roundToInt())
                    }
                }
                .graphicsLayer { scaleX = escalaTxt; scaleY = escalaTxt },
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy((S * 0.008f).dp)
        ) {
            Hexagono(s.icono, s.color, hex.dp)
            Text(s.titulo, style = estilo(cl(20f, S * 0.04f, 60f), FontWeight.ExtraBold, Color(0xFF282828), -0.3f, 1.1f, true))
            Text(s.resumen, style = estilo(cl(14f, S * 0.022f, 30f), FontWeight.SemiBold, Color(0xFF4B5563), 0f, 1.2f, true))
        }
    }
}

@Composable
private fun FotoAnimada(img: ImageBitmap, segunda: Boolean, fase: Float, tiempo: State<Long>, filtro: ColorFilter?) {
    Image(
        bitmap = img, contentDescription = null, contentScale = ContentScale.Crop, colorFilter = filtro,
        modifier = Modifier.fillMaxSize().graphicsLayer {
            val c = (tiempo.value / 1000f - fase).mod(14f) / 14f
            val tri = if (c < 0.5f) suave(2f * c) else suave(2f - 2f * c)
            val esc: Float; val tx: Float; val ty: Float
            if (!segunda) {
                esc = 1.03f + 0.12f * tri; tx = -0.025f * tri; ty = -0.02f * tri
                alpha = 1f
            } else {
                esc = 1.15f - 0.12f * tri; tx = 0.025f * (1f - tri); ty = 0.015f * (1f - tri)
                alpha = when {
                    c < 0.38f -> 0f
                    c < 0.50f -> suave((c - 0.38f) / 0.12f)
                    c < 0.88f -> 1f
                    else -> 1f - suave((c - 0.88f) / 0.12f)
                }
            }
            scaleX = esc; scaleY = esc
            translationX = tx * esc * size.width; translationY = ty * esc * size.height
        }
    )
}

/** Botón central con el logo: se mece suave sin moverse del lugar. */
@Composable
private fun Centro(S: Float, logo: ImageBitmap, tiempo: State<Long>) {
    val d = S * 0.4f
    Box(
        Modifier
            .offset((S * 0.3f).dp, (S * 0.3f).dp)
            .size(d.dp)
            .drawBehind { drawCircle(Color.White.copy(alpha = 0.7f), radius = size.minDimension / 2f + (S * 0.016f).dp.toPx()) }
            .shadow(14.dp, CircleShape, ambientColor = SOMBRA_A, spotColor = SOMBRA_B)
            .background(Color.White, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Image(
            logo, null,
            Modifier
                .fillMaxWidth(0.72f)
                .graphicsLayer {
                    val u = (tiempo.value / 4200f).mod(1f)
                    val e = suave(if (u < 0.5f) u * 2f else 2f - u * 2f)
                    translationX = -0.03f * size.width
                    translationY = (0.02f - 0.055f * e) * size.height
                }
        )
    }
}

// ───────────── usuario / modos ─────────────

@Composable
private fun BotonUsuario(
    tutor: Boolean, abierto: Boolean, paleta: Paleta, tiempo: State<Long>,
    entra: () -> Float, vuelta: () -> Float,
    alCaja: (Rect) -> Unit, alUsuario: () -> Unit, alModo: (String) -> Unit
) {
    val barra by animateFloatAsState(if (abierto) 1f else 0f, tween(500, easing = Ease), label = "barra")
    val barraAlfa by animateFloatAsState(if (abierto) 1f else 0f, tween(250), label = "barraAlfa")
    val cruce by animateFloatAsState(if (tutor) 1f else 0f, tween(350), label = "cruce")
    val colorBoton by animateColorAsState(if (tutor) Color(0xF0344054) else Color(0xEBFFFFFF), tween(500), label = "colorBoton")
    val iconoBoton by animateColorAsState(if (tutor) Color.White else Marca.Coral, tween(500), label = "iconoBoton")
    val interaccion = remember { MutableInteractionSource() }
    val presionado by interaccion.collectIsPressedAsState()
    val escala by animateFloatAsState(if (presionado) 0.94f else 1f, tween(150), label = "pulsar")

    Box(
        Modifier
            .fillMaxSize()
            .padding(top = 16.dp, end = 24.dp),
        contentAlignment = Alignment.TopEnd
    ) {
        Box(
            Modifier
                .size(244.dp, 72.dp)
                .onGloballyPositioned { alCaja(it.boundsInRoot()) }
                .graphicsLayer {
                    val e = entra()
                    alpha = e
                    val k = 0.5f + 0.5f * e
                    scaleX = k; scaleY = k
                    rotationZ = -120f * (1f - e)
                    transformOrigin = TransformOrigin(1f, 0.5f)
                },
            contentAlignment = Alignment.CenterEnd
        ) {
            // barra de modos (sale desde el botón hacia la izquierda)
            if (barraAlfa > 0.01f) {
                Box(
                    Modifier
                        .width((72f + 172f * barra).dp)
                        .height(72.dp)
                        .graphicsLayer { alpha = barraAlfa }
                        .shadow(10.dp, RoundedCornerShape(36.dp), ambientColor = SOMBRA_A, spotColor = SOMBRA_B)
                        .clip(RoundedCornerShape(36.dp))
                        .background(paleta.vidrio)
                        .drawBehind {
                            drawRoundRect(paleta.vidrioBorde, Offset(0.5f, 0.5f), Size(size.width - 1f, size.height - 1f), CornerRadius(36.dp.toPx()), style = Stroke(1f))
                        }
                ) {
                    Row(
                        Modifier.requiredWidth(244.dp).fillMaxHeight().padding(start = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically
                    ) {
                        listOf("estudiante" to "i-estudiante", "tutor" to "i-tutor").forEach { (modo, icono) ->
                            val activo = (modo == "tutor") == tutor
                            Box(
                                Modifier
                                    .size(64.dp)
                                    .then(if (activo) Modifier.shadow(10.dp, CircleShape, ambientColor = Color(0x66FE5440), spotColor = Color(0x66FE5440)) else Modifier)
                                    .clip(CircleShape)
                                    .background(if (activo) Marca.Coral else Color.Transparent)
                                    .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { alModo(modo) },
                                contentAlignment = Alignment.Center
                            ) { IconoLinea(icono, if (activo) Color.White else paleta.texto, 32.dp) }
                        }
                    }
                }
            }

            // botón redondo con el aro de colores que gira
            Box(
                Modifier
                    .size(72.dp)
                    .graphicsLayer { scaleX = escala; scaleY = escala },
                contentAlignment = Alignment.Center
            ) {
                Box(
                    Modifier
                        .size(72.dp)
                        .shadow(12.dp, CircleShape, ambientColor = SOMBRA_A, spotColor = SOMBRA_B)
                        .clip(CircleShape)
                        .background(colorBoton)
                        .clickable(interactionSource = interaccion, indication = null) { alUsuario() }
                        .graphicsLayer { rotationZ = vuelta() },
                    contentAlignment = Alignment.Center
                ) {
                    Box(Modifier.graphicsLayer { alpha = 1f - cruce }) { IconoLinea("i-estudiante", iconoBoton, 35.dp) }
                    Box(Modifier.graphicsLayer { alpha = cruce }) { IconoLinea("i-tutor", iconoBoton, 35.dp) }
                }
                Canvas(Modifier.size(84.dp)) {
                    val grosor = 5.dp.toPx()
                    val r = size.minDimension / 2f - grosor / 2f
                    rotarDibujo(((tiempo.value % 7000L) / 7000f) * 360f) {
                        drawCircle(
                            Brush.sweepGradient(listOf(Marca.Verde, Marca.Ambar, Marca.Naranja, Marca.Coral, Marca.RojoOsc, Marca.Verde)),
                            radius = r, style = Stroke(width = grosor)
                        )
                    }
                }
            }
        }
    }
}

// ───────────── consejero de bienvenida ─────────────

@Composable
private fun Consejero(vmin: Float, tutor: Boolean, tiempo: State<Long>, logo: ImageBitmap, progreso: () -> Float, oculto: () -> Float) {
    val ave = cl(104f, 14f * vmin, 210f)
    val texto = if (tutor) "Bienvenido profesor" else "Bienvenido alumno"
    Row(
        Modifier
            .padding(start = 16.dp, top = 6.dp)
            .graphicsLayer {
                // cons-vida: aparece en el 9 %, se queda hasta el 88 % y se desvanece
                val u = progreso()
                val dentro = suave(u / 0.09f)
                val fuera = suave((u - 0.88f) / 0.12f)
                alpha = dentro * (1f - fuera) * (1f - oculto())
                translationY = (-12f * (1f - dentro) - 6f * fuera) * density
                val k = 0.92f + 0.08f * dentro - 0.03f * fuera
                scaleX = k; scaleY = k
            },
        verticalAlignment = Alignment.CenterVertically
    ) {
        // pájaro con silueta blanca y vaivén
        Box(
            Modifier
                .padding(end = (1.6f * vmin).dp)
                .size(ave.dp)
                .graphicsLayer {
                    val u = (tiempo.value / 1600f).mod(2f)
                    val e = suave(if (u < 1f) u else 2f - u)
                    translationY = (-7f + 15f * e) * density
                    rotationZ = -8f + 15f * e
                }
        ) {
            val blanco = ColorFilter.tint(Color.White, BlendMode.SrcIn)
            listOf(1.5f to 0f, -1.5f to 0f, 0f to 1.5f, 0f to -1.5f).forEach { (dx, dy) ->
                Image(logo, null, Modifier.fillMaxSize().offset(dx.dp, dy.dp), colorFilter = blanco)
            }
            Image(logo, null, Modifier.fillMaxSize())
        }
        // globo de diálogo
        Box(
            Modifier.graphicsLayer {
                val seg = ((progreso() * 3.8f) - 0.15f) / 0.55f
                val e = Ease.transform(seg.coerceIn(0f, 1f))
                val k = 0.7f + 0.3f * e
                scaleX = k; scaleY = k
                transformOrigin = TransformOrigin(0f, 0.5f)
            }
        ) {
            Box(
                Modifier
                    .align(Alignment.CenterStart)
                    .offset((-6).dp, 0.dp)
                    .size(16.dp)
                    .rotate(45f)
                    .background(Color.White, RoundedCornerShape(3.dp))
            )
            Box(
                Modifier
                    .shadow(12.dp, RoundedCornerShape(50), ambientColor = Color(0x5546505A), spotColor = Color(0x5546505A))
                    .background(Color.White, RoundedCornerShape(50))
                    .padding(horizontal = cl(16f, 2.1f * vmin, 26f).dp, vertical = cl(9f, 1.3f * vmin, 16f).dp)
            ) {
                Text(texto, style = estilo(cl(16f, 2.2f * vmin, 28f), FontWeight.Bold, Color(0xFF282828), 0.1f, 1.15f), maxLines = 1, softWrap = false)
            }
        }
    }
}

// ───────────── pantalla de una sección ─────────────

@Composable
private fun PantallaSeccion(
    s: Seccion, paleta: Paleta, vmin: Float, ancho: Float, alto: Float,
    alfa: () -> Float, intro: () -> Float, pliegue: () -> Float, activa: Boolean, abrir: (String) -> Unit
) {
    Box(Modifier.fillMaxSize().graphicsLayer { alpha = alfa() }) {
        // pliegues de color de la sección: entran desde las esquinas
        Canvas(Modifier.fillMaxSize()) {
            val v = min(size.width, size.height) / 100f
            val p = pliegue()
            val e1 = 1f - p
            val w1 = 46f * v; val h1 = 40f * v
            val x1 = size.width + 7f * v - w1; val y1 = size.height + 7f * v - h1
            withTransform({ translate(0.3f * w1 * e1, 0.3f * h1 * e1) }) {
                drawPath(Path().apply { moveTo(x1 + w1, y1); lineTo(x1 + w1, y1 + h1); lineTo(x1, y1 + h1); close() }, s.color)
            }
            val w2 = 20f * v; val h2 = 26f * v
            val x2 = -5f * v; val y2 = size.height * 0.34f
            withTransform({ translate(-0.8f * w2 * e1, 0f) }) {
                drawPath(
                    Path().apply { moveTo(x2, y2); lineTo(x2 + w2, y2 + h2 / 2f); lineTo(x2, y2 + h2); close() },
                    mezcla(s.color, Color.Black, 0.76f)
                )
            }
        }

        BoxWithConstraints(Modifier.fillMaxSize()) {
            val altoMin = maxHeight - 128.dp
            Column(
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(top = 104.dp, start = 24.dp, end = 24.dp, bottom = 24.dp)
            ) {
                Column(
                    Modifier.fillMaxWidth().heightIn(min = altoMin).padding(vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(cl(20f, 3.6f * vmin, 56f).dp, Alignment.CenterVertically),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // cabecera
                    Row(
                        Modifier.graphicsLayer {
                            val e = Ease.transform(((intro() - 0.55f) / 0.55f).coerceIn(0f, 1f))
                            alpha = e; translationY = 12f * (1f - e) * density
                        },
                        horizontalArrangement = Arrangement.spacedBy(cl(14f, 2f * vmin, 28f).dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Hexagono(s.icono, s.color, cl(64f, 8f * vmin, 120f).dp)
                        Column {
                            Text(s.titulo, style = estilo(cl(28f, 4.1f * vmin, 64f), FontWeight.ExtraBold, paleta.texto, -0.3f, 1.1f))
                            Text(s.apoyo, Modifier.padding(top = 2.dp), style = estilo(cl(16f, 2.2f * vmin, 30f), FontWeight.Medium, paleta.suave, 0f, 1.2f))
                        }
                    }

                    // rejilla de tarjetas
                    val cols = if (ancho <= 760f) 1 else s.cols
                    val celda = cl(280f, 34f * vmin, 720f)
                    val hueco = cl(16f, 2.4f * vmin, 36f).dp
                    Column(Modifier.widthIn(max = (cols * celda).dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(hueco)) {
                        var n = 0
                        s.items.chunked(cols).forEach { fila ->
                            Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(hueco)) {
                                fila.forEach { op ->
                                    val idx = n++
                                    Tarjeta(op, idx, paleta, vmin, intro, activa, { abrir(op.ruta) }, Modifier.weight(1f).fillMaxHeight())
                                }
                                repeat(cols - fila.size) { Spacer(Modifier.weight(1f)) }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Tarjeta(op: Opcion, i: Int, paleta: Paleta, vmin: Float, intro: () -> Float, activa: Boolean, alTocar: () -> Unit, modifier: Modifier) {
    val forma = RoundedCornerShape(26.dp)
    val pad = cl(20f, 2.8f * vmin, 40f)
    val interaccion = remember { MutableInteractionSource() }
    val presionada by interaccion.collectIsPressedAsState()
    val escala by animateFloatAsState(if (presionada) 0.96f else 1f, tween(150), label = "tarjeta")
    val fondoNormal = paleta.vidrio
    val fondoPulsado = Color(
        red = 0.12f * op.color.red + 0.88f, green = 0.12f * op.color.green + 0.88f, blue = 0.12f * op.color.blue + 0.88f, alpha = 0.683f
    )
    val fondo by animateColorAsState(if (presionada) fondoPulsado else fondoNormal, tween(200), label = "tarjetaFondo")

    Box(
        modifier
            .heightIn(min = 160.dp)
            .graphicsLayer {
                val e = Ease.transform(((intro() - (0.7f + i * 0.06f)) / 0.55f).coerceIn(0f, 1f))
                alpha = e
                translationY = 12f * (1f - e) * density
                scaleX = escala; scaleY = escala
            }
            .shadow(10.dp, forma, ambientColor = SOMBRA_A, spotColor = SOMBRA_B)
            .clip(forma)
            .background(fondo)
            .drawWithBorde(paleta.vidrioBorde, op.color)
            .clickable(enabled = activa, interactionSource = interaccion, indication = null) { alTocar() }
    ) {
        Column(
            Modifier.padding(start = pad.dp, end = pad.dp, top = pad.dp, bottom = (pad + 3f).dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Hexagono(op.icono, op.color, cl(64f, 8f * vmin, 120f).dp)
            Text(op.nombre, Modifier.padding(top = 6.dp), style = estilo(cl(22f, 3.2f * vmin, 48f), FontWeight.ExtraBold, paleta.texto, 0f, 1.15f))
            Text(op.descripcion, style = estilo(cl(16f, 2.2f * vmin, 30f), FontWeight.Medium, paleta.suave, 0f, 1.35f))
        }
        op.etiqueta?.let { et ->
            val m = cl(16f, 2.4f * vmin, 32f).dp
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = m, end = m)
                    .background(mezcla(op.color, Color.White, 0.14f), RoundedCornerShape(50))
                    .padding(horizontal = 14.dp, vertical = 6.dp)
            ) { Text(et, style = estilo(cl(14f, 1.8f * vmin, 22f), FontWeight.Bold, Color(0xFF282828))) }
        }
    }
}

/** Borde de 1 px del vidrio y, abajo, el filo de color de 3 px (border-bottom de .tarjeta). */
private fun Modifier.drawWithBorde(borde: Color, color: Color): Modifier =
    this.drawWithContent {
        drawContent()
        val w1 = 1.dp.toPx(); val r = 26.dp.toPx(); val w3 = 3.dp.toPx()
        drawRoundRect(borde, Offset(w1 / 2f, w1 / 2f), Size(size.width - w1, size.height - w1), CornerRadius(r - w1 / 2f), style = Stroke(w1))
        clipRect(top = size.height - r) {
            drawRoundRect(color, Offset(w3 / 2f, w3 / 2f), Size(size.width - w3, size.height - w3), CornerRadius(r - w3 / 2f), style = Stroke(w3))
        }
    }
