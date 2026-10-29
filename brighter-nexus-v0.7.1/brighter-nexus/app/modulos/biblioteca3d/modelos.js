// Modelos 3D del prototipo. Por ahora se arman en código con figuras simples (no hay archivos .glb),
// para que la biblioteca funcione sin descargar nada. Más adelante cada entrada puede apuntar a un
// archivo glTF/GLB con el mismo contrato:
//
//   crear(THREE) -> { grupo, partes: [{ id, nombre, texto, objetos, pick }], animar?(dt), camara, luces? }
//   - grupo:  lo que se dibuja
//   - partes: lo que el alumno puede tocar para ver su nombre y explicación
//   - objetos: mallas que se iluminan al elegir la parte; pick: mallas que reciben el toque (por defecto, objetos)

const material = (THREE, color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, ...extra });

// Malla invisible más grande que el objeto, para que sea fácil tocar cosas pequeñas con el dedo
const zonaToque = (THREE, geometria) =>
  new THREE.Mesh(geometria, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));

function nuevaParte(partes, id, nombre, texto, objetos, pick) {
  const p = { id, nombre, texto, objetos, pick: pick || objetos };
  p.pick.forEach(o => { o.userData.parte = p; });
  partes.push(p);
  return p;
}

// ---------------------------------------------------------------- corazón
function crearCorazon(THREE) {
  const grupo = new THREE.Group();
  const partes = [];
  const ROJO = 0xE5383B, AZUL = 0x4F7CFF;

  const elipsoide = (color, rx, ry, rz, x, y, z, rotZ = 0) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), material(THREE, color));
    m.scale.set(rx, ry, rz); m.position.set(x, y, z); m.rotation.z = rotZ;
    grupo.add(m);
    return m;
  };
  const tubo = (color, puntos, radio) => {
    const curva = new THREE.CatmullRomCurve3(puntos.map(p => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curva, 48, radio, 16, false), material(THREE, color));
    grupo.add(m);
    return m;
  };

  // Lado derecho del corazón = izquierda de quien mira (sangre sin oxígeno, en azul)
  const ad = elipsoide(AZUL, 0.42, 0.5, 0.4, -0.85, 0.55, 0.0);
  const vd = elipsoide(AZUL, 0.65, 0.95, 0.6, -0.35, -0.15, 0.2, 0.2);
  // Lado izquierdo (sangre con oxígeno, en rojo)
  const ai = elipsoide(ROJO, 0.45, 0.4, 0.4, 0.55, 0.85, -0.45);
  const vi = elipsoide(ROJO, 0.7, 1.1, 0.7, 0.3, -0.25, -0.05, 0.3);
  const aorta = tubo(ROJO, [[0.15, 0.8, -0.05], [0.12, 1.45, -0.05], [0.45, 1.95, -0.1], [0.95, 1.65, -0.2], [1.05, 0.9, -0.25]], 0.17);
  const pulmonar = [
    tubo(AZUL, [[-0.15, 0.75, 0.4], [-0.2, 1.35, 0.4], [-0.05, 1.7, 0.3]], 0.14),
    tubo(AZUL, [[-0.05, 1.7, 0.3], [-0.4, 1.9, 0.2], [-0.8, 1.95, 0.0]], 0.1),
    tubo(AZUL, [[-0.05, 1.7, 0.3], [0.25, 1.85, 0.25], [0.6, 1.75, 0.15]], 0.1)
  ];
  const cava = tubo(AZUL, [[-0.9, 0.8, 0], [-0.9, 1.5, 0], [-0.9, 2.1, 0]], 0.13);

  nuevaParte(partes, 'ad', 'Aurícula derecha', 'Recibe la sangre sin oxígeno que vuelve del cuerpo.', [ad]);
  nuevaParte(partes, 'vd', 'Ventrículo derecho', 'Empuja la sangre sin oxígeno hacia los pulmones.', [vd]);
  nuevaParte(partes, 'ai', 'Aurícula izquierda', 'Recibe la sangre con oxígeno que viene de los pulmones.', [ai]);
  nuevaParte(partes, 'vi', 'Ventrículo izquierdo', 'Bombea la sangre con oxígeno a todo el cuerpo. Es la parte más fuerte del corazón.', [vi]);
  nuevaParte(partes, 'aorta', 'Aorta', 'La arteria más grande. Lleva la sangre con oxígeno desde el corazón al resto del cuerpo.', [aorta]);
  nuevaParte(partes, 'pulmonar', 'Arteria pulmonar', 'Lleva la sangre sin oxígeno del corazón a los pulmones, donde se llena de oxígeno.', pulmonar);
  nuevaParte(partes, 'cava', 'Vena cava superior', 'Trae al corazón la sangre sin oxígeno de la parte de arriba del cuerpo.', [cava]);

  grupo.position.y = -0.45;
  return { grupo, partes, camara: { pos: [0, 0.6, 6.8], dist: [3, 14] } };
}

// ---------------------------------------------------------------- sistema solar
function crearSistemaSolar(THREE) {
  const grupo = new THREE.Group();
  const partes = [];
  const animables = [];

  // Tamaños y distancias NO están a escala: así caben en la pantalla
  const sol = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 48, 32),
    material(THREE, 0xFFB300, { emissive: 0xFF9800, emissiveIntensity: 1, roughness: 1 })
  );
  grupo.add(sol);
  const luz = new THREE.PointLight(0xFFFFFF, 3.2, 0, 0);
  grupo.add(luz);
  const hitSol = zonaToque(THREE, new THREE.SphereGeometry(1.4, 12, 8));
  grupo.add(hitSol);
  nuevaParte(partes, 'sol', 'Sol', 'Es una estrella. Está en el centro y nos da luz y calor.', [sol], [sol, hitSol]);

  const PLANETAS = [
    ['mercurio', 'Mercurio', 0x9A9A9A, 0.16, 2.4, 1.6, 'El planeta más cercano al Sol y el más pequeño.'],
    ['venus', 'Venus', 0xE8C07A, 0.28, 3.3, 1.2, 'Es el planeta más caliente porque su atmósfera es muy gruesa y guarda el calor.'],
    ['tierra', 'Tierra', 0x2F80ED, 0.3, 4.3, 1.0, 'Nuestro hogar. Es el único planeta donde sabemos que hay vida y tiene agua líquida.'],
    ['marte', 'Marte', 0xD1553D, 0.22, 5.4, 0.8, 'El planeta rojo. Tiene el volcán más grande conocido del sistema solar.'],
    ['jupiter', 'Júpiter', 0xD9A066, 0.7, 7.2, 0.45, 'El planeta más grande. Es un gigante de gas con una enorme tormenta llamada la Gran Mancha Roja.'],
    ['saturno', 'Saturno', 0xE6CF9A, 0.6, 9.2, 0.33, 'Famoso por sus anillos hechos de hielo y roca.'],
    ['urano', 'Urano', 0x7DE3E8, 0.42, 11.0, 0.24, 'Un gigante de hielo que gira "acostado".'],
    ['neptuno', 'Neptuno', 0x4062FF, 0.4, 12.6, 0.2, 'El más lejano de los ocho planetas. Tiene vientos muy fuertes.']
  ];

  PLANETAS.forEach(([id, nombre, color, radio, orbita, vel, texto], k) => {
    const anillo = new THREE.Mesh(
      new THREE.RingGeometry(orbita - 0.012, orbita + 0.012, 128),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    );
    anillo.rotation.x = -Math.PI / 2;
    grupo.add(anillo);

    const pivote = new THREE.Group();
    pivote.rotation.y = k * 0.9; // cada planeta empieza en un lugar distinto
    const planeta = new THREE.Mesh(new THREE.SphereGeometry(radio, 32, 24), material(THREE, color));
    planeta.position.x = orbita;
    const objetos = [planeta];
    if (id === 'saturno') {
      const aro = new THREE.Mesh(
        new THREE.RingGeometry(radio * 1.4, radio * 2.2, 64),
        new THREE.MeshBasicMaterial({ color: 0xD8C28A, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
      );
      aro.rotation.x = -Math.PI / 2 + 0.45;
      planeta.add(aro);
    }
    const hit = zonaToque(THREE, new THREE.SphereGeometry(Math.max(radio * 1.9, 0.5), 10, 8));
    hit.position.x = orbita;
    pivote.add(planeta, hit);
    grupo.add(pivote);
    nuevaParte(partes, id, nombre, texto, objetos, [planeta, hit]);
    animables.push({ pivote, planeta, vel });
  });

  return {
    grupo, partes,
    luces: 'sol',
    nota: 'Los tamaños y las distancias no están a escala.',
    animar(dt) { animables.forEach(a => { a.pivote.rotation.y += a.vel * dt * 0.35; a.planeta.rotation.y += dt * 0.8; }); },
    camara: { pos: [0, 15, 27], dist: [4, 45] }
  };
}

// ---------------------------------------------------------------- cubo
function crearCubo(THREE) {
  const grupo = new THREE.Group();
  const partes = [];
  const caras = [], aristas = [], vertices = [], pickAristas = [], pickVertices = [];

  // 6 caras
  [[[0, 0, 1], [0, 0, 0]], [[0, 0, -1], [0, Math.PI, 0]], [[1, 0, 0], [0, Math.PI / 2, 0]],
   [[-1, 0, 0], [0, -Math.PI / 2, 0]], [[0, 1, 0], [-Math.PI / 2, 0, 0]], [[0, -1, 0], [Math.PI / 2, 0, 0]]
  ].forEach(([pos, rot]) => {
    const c = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      material(THREE, 0x22D3EE, { transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
    );
    c.position.set(...pos); c.rotation.set(...rot);
    grupo.add(c); caras.push(c);
  });

  // 12 aristas (cilindros finos) y su zona de toque más gruesa
  const lados = [-1, 1];
  const arista = (pos, eje) => {
    const g = new THREE.CylinderGeometry(0.045, 0.045, 2, 12);
    const m = new THREE.Mesh(g, material(THREE, 0xF2FBFF));
    const h = zonaToque(THREE, new THREE.CylinderGeometry(0.16, 0.16, 2, 8));
    [m, h].forEach(o => {
      o.position.set(...pos);
      if (eje === 'x') o.rotation.z = Math.PI / 2;
      if (eje === 'z') o.rotation.x = Math.PI / 2;
      grupo.add(o);
    });
    aristas.push(m); pickAristas.push(m, h);
  };
  lados.forEach(a => lados.forEach(b => { arista([0, a, b], 'x'); arista([a, 0, b], 'y'); arista([a, b, 0], 'z'); }));

  // 8 vértices
  lados.forEach(x => lados.forEach(y => lados.forEach(z => {
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), material(THREE, 0xFFD83B));
    const h = zonaToque(THREE, new THREE.SphereGeometry(0.26, 8, 6));
    [v, h].forEach(o => { o.position.set(x, y, z); grupo.add(o); });
    vertices.push(v); pickVertices.push(v, h);
  })));

  nuevaParte(partes, 'caras', 'Caras (6)', 'Cada superficie plana del cubo es una cara. Las 6 caras son cuadrados iguales.', caras);
  nuevaParte(partes, 'aristas', 'Aristas (12)', 'Una arista es la línea donde se juntan dos caras. Las 12 aristas miden lo mismo.', aristas, pickAristas);
  nuevaParte(partes, 'vertices', 'Vértices (8)', 'Un vértice es una esquina: el punto donde se juntan 3 aristas.', vertices, pickVertices);

  return { grupo, partes, camara: { pos: [4.2, 3.2, 5.6], dist: [3, 14] } };
}

export const MODELOS = [
  { id: 'corazon', nombre: 'El corazón', nivel: 'primaria', curso: 'ciencias', dimension: 'vida', descripcion: 'Aurículas, ventrículos y vasos principales.', crear: crearCorazon },
  { id: 'sistema-solar', nombre: 'Sistema solar', nivel: 'primaria', curso: 'ciencias', dimension: 'tierra-universo', descripcion: 'El Sol y los ocho planetas en órbita.', crear: crearSistemaSolar },
  { id: 'cubo', nombre: 'El cubo', nivel: 'primaria', curso: 'matematica', dimension: null, descripcion: 'Caras, aristas y vértices.', crear: crearCubo }
];
