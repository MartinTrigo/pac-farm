// ==========================================================
// PAC-FARM — un clásico de laberinto con temática de huerta
//
// El cosechador junta rabanitos y nabos, las frutillas de las esquinas lo
// vuelven temible por unos segundos y cada tanto aparece un tomate de regalo.
// Las plagas (vaquita, pulgón, mosca blanca y babosa) lo persiguen.
//
// Todo se dibuja en un lienzo de 224x288 píxeles que después se agranda por
// múltiplos enteros: así el pixel art queda nítido en cualquier pantalla.
// ==========================================================

"use strict";

// ---------- El laberinto ----------
// # pared · . rabanito/nabo · o frutilla · = puerta de la madriguera · espacio libre
const LAB_ORIGINAL = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "######.##### ## #####.######",
  "######.##          ##.######",
  "######.## ###==### ##.######",
  "######.## #      # ##.######",
  "      .   #      #   .      ",
  "######.## #      # ##.######",
  "######.## ######## ##.######",
  "######.##          ##.######",
  "######.## ######## ##.######",
  "######.##############.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##.......  .......##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

const COLS = 28, FILAS = 31, T = 8;      // celda de 8x8 píxeles
const MARGEN_ARRIBA = 24;                // franja del marcador
const ANCHO = COLS * T;                  // 224
const ALTO = FILAS * T + MARGEN_ARRIBA + 16;

const IZQ = { x: -1, y: 0 }, DER = { x: 1, y: 0 };
const ARR = { x: 0, y: -1 }, ABA = { x: 0, y: 1 };

// ---------- Colores ----------
const COLOR = {
  fondo: "#0b1410",
  pared: "#101d15",   // el relleno del cantero, apenas más claro que el fondo
  borde: "#4ec97e",   // el contorno luminoso, como en los recreativos
  puerta: "#c8a165",
  texto: "#d9f2de",
  ambar: "#f5b324",
  tomate: "#e4483c",
};

// ---------- Utilidades de pixel art ----------
function lienzo(ancho, alto) {
  const c = document.createElement("canvas");
  c.width = ancho;
  c.height = alto;
  return c;
}

// Convierte filas de texto en un dibujo: cada letra es un píxel de la paleta.
function dibujoDe(filas, paleta) {
  const c = lienzo(filas[0].length, filas.length);
  const g = c.getContext("2d");
  filas.forEach((fila, y) => {
    for (let x = 0; x < fila.length; x++) {
      const color = paleta[fila[x]];
      if (color) { g.fillStyle = color; g.fillRect(x, y, 1, 1); }
    }
  });
  return c;
}

// ---------- Las verduras ----------
const RABANITO = dibujoDe([
  ".g..g.",
  "..gg..",
  ".rRRr.",
  "rRRRRr",
  ".rRRr.",
  "..rr..",
], { g: "#5fbf5a", R: "#e85c5c", r: "#b83a3a" });

const NABO = dibujoDe([
  ".g..g.",
  "..gg..",
  ".pppp.",
  "pWWWWp",
  ".WWWW.",
  "..WW..",
], { g: "#5fbf5a", W: "#f2f2e8", p: "#b08bd1" });

// Más grande que las verduras: es el premio del tablero y se la ve latir.
const FRUTILLA = dibujoDe([
  "...g.g...",
  "..ggggg..",
  ".gg...gg.",
  ".rRRRRRr.",
  "rRsRRRsRr",
  "rRRRsRRRr",
  "rRsRRRsRr",
  ".rRRRRRr.",
  "..rrrrr..",
  "...rrr...",
], { g: "#5fbf5a", R: "#f2564a", r: "#b8281f", s: "#ffe9a8" });

const TOMATE = dibujoDe([
  "....g.g....",
  "...ggggg...",
  "..rRRRRRr..",
  ".rRRRRRRRr.",
  "rRRhRRRRRRr",
  "rRRRRRRRRRr",
  "rRRRRRRRRRr",
  ".rRRRRRRRr.",
  "..rRRRRRr..",
  "...rrrrr...",
], { g: "#5fbf5a", R: "#e4483c", r: "#a82a20", h: "#ff9b9b" });

// ---------- El cosechador ----------
// Se calcula píxel por píxel: un círculo al que se le recorta la boca, y encima
// el sombrero de paja de agricultor. Así la animación de masticar sale sola en
// las cuatro direcciones sin tener que dibujar cada cuadro a mano.
const ANCHO_COS = 17, ALTO_COS = 23;
const CX_COS = 8, CY_COS = 11, R_COS = 7;      // centro y radio de la cabeza
// Medio ancho del sombrero en cada fila: arriba la punta, abajo el ala. Se
// apoya en la coronilla y no baja más, para que la cara se siga viendo.
const SOMBRERO = [0, 1, 2, 4, 7];

function dibujarCosechador(anguloBoca, dir) {
  const c = lienzo(ANCHO_COS, ALTO_COS);
  const g = c.getContext("2d");
  const rumbo = Math.atan2(dir.y, dir.x);

  for (let y = 0; y < ALTO_COS; y++) {
    for (let x = 0; x < ANCHO_COS; x++) {
      const dx = x - CX_COS, dy = y - CY_COS;
      const dist = Math.hypot(dx, dy);
      if (dist > R_COS) continue;
      // recorte de la boca: un cono que se abre hacia donde mira
      let dif = Math.abs(Math.atan2(dy, dx) - rumbo);
      if (dif > Math.PI) dif = 2 * Math.PI - dif;
      if (dif < anguloBoca) continue;
      g.fillStyle = dist > R_COS - 1.6 ? "#c8811a" : "#f5b324";
      g.fillRect(x, y, 1, 1);
    }
  }

  // El sombrero va después: se apoya sobre la cabeza y le tapa la coronilla.
  SOMBRERO.forEach((medio, fila) => {
    const desde = CX_COS - medio, hasta = CX_COS + medio;
    const ultima = fila === SOMBRERO.length - 1;
    for (let x = desde; x <= hasta; x++) {
      const borde = ultima || x === desde || x === hasta;
      g.fillStyle = borde ? "#a8814a" : "#e2c07c";
      g.fillRect(x, fila, 1, 1);
    }
  });
  // Un hilito de sombra bajo el ala, para que se despegue de la cabeza
  g.fillStyle = "#8c6a3a";
  g.fillRect(CX_COS - 6, SOMBRERO.length, 13, 1);
  return c;
}

const BOCAS = [0.05, 0.45, 0.9];   // cerrada, media, abierta
const COSECHADOR = {};
[["der", DER], ["izq", IZQ], ["arr", ARR], ["aba", ABA]].forEach(([nombre, dir]) => {
  COSECHADOR[nombre] = BOCAS.map((a) => dibujarCosechador(a, dir));
});

// ---------- Las plagas ----------
// Los bichos se ven desde arriba, como un escarabajo: cabeza con antenas,
// las alas con la costura al medio y las seis patas asomando a los costados.
// Al caminar, las patas alternan de fila y parece que se mueven.
const CUERPO = "...dccssccd...";     // sin patas
const PATAS  = ".lldccssccdll.";     // las patas salen pegadas al cuerpo

const cuerpoPlaga = (patasArriba) => [
  "...a......a...",
  "....a....a....",
  ".....hhhh.....",
  "....hhhhhh....",
  patasArriba ? PATAS : CUERPO,
  patasArriba ? CUERPO : PATAS,
  patasArriba ? PATAS : CUERPO,
  patasArriba ? CUERPO : PATAS,
  patasArriba ? PATAS : CUERPO,
  patasArriba ? CUERPO : PATAS,
  CUERPO,
  "....dccccd....",
  ".....dccd.....",
  "......dd......",
];

function dibujarPlaga(claro, oscuro, cabeza) {
  return [false, true].map((patasArriba) =>
    dibujoDe(cuerpoPlaga(patasArriba), {
      c: claro,        // las alas
      d: oscuro,       // el borde del cuerpo
      s: oscuro,       // la costura del medio
      h: cabeza,       // la cabeza
      a: oscuro,       // antenas
      l: oscuro,       // patas
    }));
}

const PLAGAS_INFO = [
  { nombre: "Vaquita",      claro: "#e4483c", oscuro: "#8f241c", cabeza: "#3a1410",
    esquina: { c: 25, f: 0 },  casa: null },
  { nombre: "Pulgón",       claro: "#7bc94e", oscuro: "#3f7a22", cabeza: "#2b5416",
    esquina: { c: 2,  f: 0 },  casa: { c: 13, f: 14 } },
  { nombre: "Mosca blanca", claro: "#7fd4e8", oscuro: "#2f7d92", cabeza: "#1d5568",
    esquina: { c: 25, f: 30 }, casa: { c: 11, f: 14 } },
  { nombre: "Babosa",       claro: "#e08a3c", oscuro: "#96521a", cabeza: "#603210",
    esquina: { c: 2,  f: 30 }, casa: { c: 16, f: 14 } },
];
PLAGAS_INFO.forEach((p) => { p.dibujos = dibujarPlaga(p.claro, p.oscuro, p.cabeza); });

const PLAGA_ASUSTADA = dibujarPlaga("#3b53c4", "#1d2a70", "#141d52");
const PLAGA_PARPADEO = dibujarPlaga("#e8ecff", "#8f9ad0", "#6c78ae");

// ---------- Estado ----------
const pantalla = document.getElementById("pantalla");
const ctx = pantalla.getContext("2d");
ctx.imageSmoothingEnabled = false;

let lab = [];                 // copia del laberinto: se le van sacando las verduras
let capaParedes = null;       // las paredes se dibujan una sola vez
let puntaje = 0, vidas = 3, nivel = 1;
let record = Number(localStorage.getItem("pacfarm_record") || 0);
let verdurasQuedan = 0, verdurasComidas = 0;
let escena = "listo";         // listo | jugando | muriendo | fin | nivel
let reloj = 0, relojEscena = 0;
let modoIndice = 0, modoReloj = 0, modo = "dispersar";
let asustadasReloj = 0, plagasComidas = 0;
let tomate = null;            // { x, y, reloj }
let sonidoActivo = true, pausado = false;

const cosechador = {
  x: 0, y: 0, dir: IZQ, dirDeseada: null, animacion: 0, muerte: 0,
};
let plagas = [];

// Cada tanto un nabo en lugar de un rabanito: siempre los mismos, para que el
// laberinto se vea igual en cada partida.
const esNabo = (c, f) => (c * 7 + f * 13) % 9 === 0;

// ---------- Laberinto ----------
const enRango = (c, f) => f >= 0 && f < FILAS;
const envolver = (c) => (c + COLS) % COLS;

function celda(c, f) {
  if (!enRango(c, f)) return "#";
  return lab[f][envolver(c)];
}

// La puerta de la madriguera solo la cruzan las plagas que entran o salen.
function bloqueado(c, f, quien) {
  const ch = celda(c, f);
  if (ch === "#") return true;
  if (ch === "=") return !(quien && (quien.estado === "saliendo" || quien.estado === "ojos"));
  return false;
}

function prepararLaberinto() {
  lab = LAB_ORIGINAL.map((f) => f.split(""));
  verdurasQuedan = 0;
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLS; c++) {
      if (lab[f][c] === "." || lab[f][c] === "o") verdurasQuedan++;
    }
  }
  verdurasComidas = 0;
  dibujarParedes();
}

// Las paredes no cambian: se dibujan una vez y después solo se copian.
function dibujarParedes() {
  capaParedes = lienzo(ANCHO, FILAS * T);
  const g = capaParedes.getContext("2d");
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLS; c++) {
      const ch = LAB_ORIGINAL[f][c];
      if (ch === "=") {
        g.fillStyle = COLOR.puerta;
        g.fillRect(c * T, f * T + 3, T, 2);
        continue;
      }
      if (ch !== "#") continue;
      g.fillStyle = COLOR.pared;
      g.fillRect(c * T, f * T, T, T);

      // Solo se ilumina el lado que da a un pasillo: así el laberinto se lee
      // como líneas y no como bloques macizos.
      const pared = (cc, ff) => LAB_ORIGINAL[ff]?.[cc] === "#" || LAB_ORIGINAL[ff]?.[cc] === undefined;
      g.fillStyle = COLOR.borde;
      if (!pared(c, f - 1)) g.fillRect(c * T, f * T, T, 1);
      if (!pared(c, f + 1)) g.fillRect(c * T, f * T + T - 1, T, 1);
      if (!pared(c - 1, f)) g.fillRect(c * T, f * T, 1, T);
      if (!pared(c + 1, f)) g.fillRect(c * T + T - 1, f * T, 1, T);
      // esquinas interiores: completan el trazo en los recodos
      if (pared(c, f - 1) && pared(c - 1, f) && !pared(c - 1, f - 1)) g.fillRect(c * T, f * T, 1, 1);
      if (pared(c, f - 1) && pared(c + 1, f) && !pared(c + 1, f - 1)) g.fillRect(c * T + T - 1, f * T, 1, 1);
      if (pared(c, f + 1) && pared(c - 1, f) && !pared(c - 1, f + 1)) g.fillRect(c * T, f * T + T - 1, 1, 1);
      if (pared(c, f + 1) && pared(c + 1, f) && !pared(c + 1, f + 1)) g.fillRect(c * T + T - 1, f * T + T - 1, 1, 1);
    }
  }
}

// ---------- Posiciones ----------
const centroX = (c) => c * T + T / 2;
const centroY = (f) => f * T + T / 2;
const colDe = (e) => Math.floor(e.x / T);
const filaDe = (e) => Math.floor(e.y / T);

function ubicarPersonajes() {
  cosechador.x = centroX(13);
  cosechador.y = centroY(23);
  cosechador.dir = IZQ;
  cosechador.dirDeseada = null;
  cosechador.muerte = 0;

  plagas = PLAGAS_INFO.map((info, i) => ({
    info,
    x: info.casa ? centroX(info.casa.c) : centroX(13),
    y: info.casa ? centroY(info.casa.f) : centroY(11),
    dir: i % 2 ? ARR : IZQ,
    estado: info.casa ? "casa" : "normal",
    soltarEn: [0, 8, 24, 50][i],     // sale cuando se juntaron tantas verduras
    animacion: 0,
    vaiven: 0,
  }));

  modoIndice = 0; modoReloj = 0; modo = "dispersar";
  asustadasReloj = 0; plagasComidas = 0;
  tomate = null;
}

// ---------- Velocidades ----------
const velCosechador = () => 66 + Math.min(nivel - 1, 4) * 4;
function velPlaga(p) {
  if (p.estado === "ojos") return 150;
  if (p.estado === "casa" || p.estado === "saliendo") return 44;
  if (asustadasReloj > 0) return 40 + Math.min(nivel - 1, 4) * 2;
  return 58 + Math.min(nivel - 1, 6) * 4;
}

// ---------- Movimiento ----------
function avanzar(e, velocidad, dt) {
  const col = colDe(e), fila = filaDe(e);
  const cx = centroX(col), cy = centroY(fila);
  let paso = velocidad * dt;

  // frena en el centro de la celda si lo que sigue es pared
  if (bloqueado(col + e.dir.x, fila + e.dir.y, e)) {
    if (e.dir.x > 0) paso = Math.min(paso, Math.max(0, cx - e.x));
    if (e.dir.x < 0) paso = Math.min(paso, Math.max(0, e.x - cx));
    if (e.dir.y > 0) paso = Math.min(paso, Math.max(0, cy - e.y));
    if (e.dir.y < 0) paso = Math.min(paso, Math.max(0, e.y - cy));
  }
  e.x += e.dir.x * paso;
  e.y += e.dir.y * paso;

  // el túnel de los costados
  if (e.x < -T / 2) e.x = ANCHO + T / 2 - 1;
  if (e.x > ANCHO + T / 2) e.x = -T / 2 + 1;
  return paso;
}

function intentarGiro(e) {
  const d = e.dirDeseada;
  if (!d) return;
  if (d.x === e.dir.x && d.y === e.dir.y) { e.dirDeseada = null; return; }
  // dar la vuelta se puede en cualquier momento
  if (d.x === -e.dir.x && d.y === -e.dir.y) { e.dir = d; e.dirDeseada = null; return; }

  const col = colDe(e), fila = filaDe(e);
  const cerca = Math.abs(e.x - centroX(col)) < 2.5 && Math.abs(e.y - centroY(fila)) < 2.5;
  if (cerca && !bloqueado(col + d.x, fila + d.y, e)) {
    e.x = centroX(col); e.y = centroY(fila);
    e.dir = d; e.dirDeseada = null;
  }
}

// ---------- Verduras ----------
function comer() {
  const col = colDe(cosechador), fila = filaDe(cosechador);
  if (Math.abs(cosechador.x - centroX(col)) > 3 || Math.abs(cosechador.y - centroY(fila)) > 3) return;
  const ch = celda(col, fila);
  if (ch !== "." && ch !== "o") return;

  lab[fila][envolver(col)] = " ";
  verdurasQuedan--;
  verdurasComidas++;

  if (ch === "o") {
    sumar(50);
    asustadasReloj = Math.max(2, 7 - nivel * 0.5);
    plagasComidas = 0;
    plagas.forEach((p) => {
      if (p.estado === "normal") { p.dir = { x: -p.dir.x, y: -p.dir.y }; }
    });
    sonar("frutilla");
  } else {
    sumar(esNabo(col, fila) ? 25 : 10);
    sonar("mordisco");
  }

  // el tomate de regalo aparece dos veces por nivel
  if (verdurasComidas === 70 || verdurasComidas === 170) {
    tomate = { x: centroX(13), y: centroY(17), reloj: 10 };
  }
  if (verdurasQuedan === 0) {
    escena = "nivel";
    relojEscena = 0;
  }
}

const puntosTomate = () => Math.min(100 + (nivel - 1) * 100, 500);

function sumar(p) {
  puntaje += p;
  if (puntaje > record) {
    record = puntaje;
    localStorage.setItem("pacfarm_record", String(record));
  }
}

// ---------- Las plagas piensan ----------
const MODOS = [
  ["dispersar", 7], ["perseguir", 20], ["dispersar", 7], ["perseguir", 20],
  ["dispersar", 5], ["perseguir", 20], ["dispersar", 5], ["perseguir", Infinity],
];

function actualizarModo(dt) {
  if (asustadasReloj > 0) return;
  modoReloj += dt;
  const [nombre, dura] = MODOS[modoIndice];
  modo = nombre;
  if (modoReloj >= dura && modoIndice < MODOS.length - 1) {
    modoIndice++;
    modoReloj = 0;
    modo = MODOS[modoIndice][0];
    // al cambiar de humor, las plagas se dan vuelta (como en el clásico)
    plagas.forEach((p) => { if (p.estado === "normal") p.dir = { x: -p.dir.x, y: -p.dir.y }; });
  }
}

function objetivoDe(p, indice) {
  if (p.estado === "ojos") return { c: 13, f: 11 };
  if (modo === "dispersar") return p.info.esquina;

  const pc = colDe(cosechador), pf = filaDe(cosechador);
  const d = cosechador.dir;
  if (indice === 0) return { c: pc, f: pf };                                  // va derecho
  if (indice === 1) return { c: pc + d.x * 4, f: pf + d.y * 4 };              // se adelanta
  if (indice === 2) {                                                         // rebota sobre la vaquita
    const v = plagas[0];
    const mc = pc + d.x * 2, mf = pf + d.y * 2;
    return { c: mc * 2 - colDe(v), f: mf * 2 - filaDe(v) };
  }
  const lejos = Math.hypot(colDe(p) - pc, filaDe(p) - pf) > 8;               // tímida
  return lejos ? { c: pc, f: pf } : p.info.esquina;
}

function decidirPlaga(p, indice) {
  const col = colDe(p), fila = filaDe(p);
  if (Math.abs(p.x - centroX(col)) > 1.5 || Math.abs(p.y - centroY(fila)) > 1.5) return;
  if (p.ultimaCelda === col + "," + fila) return;
  p.ultimaCelda = col + "," + fila;

  const opciones = [ARR, IZQ, ABA, DER].filter((d) => {
    if (d.x === -p.dir.x && d.y === -p.dir.y) return false;   // no se da vuelta sola
    return !bloqueado(col + d.x, fila + d.y, p);
  });
  if (!opciones.length) { p.dir = { x: -p.dir.x, y: -p.dir.y }; return; }

  if (asustadasReloj > 0 && p.estado === "normal") {
    p.dir = opciones[Math.floor(Math.random() * opciones.length)];
    return;
  }
  const meta = objetivoDe(p, indice);
  let mejor = opciones[0], mejorDist = Infinity;
  for (const d of opciones) {
    const dist = Math.hypot(col + d.x - meta.c, fila + d.y - meta.f);
    if (dist < mejorDist) { mejorDist = dist; mejor = d; }
  }
  p.dir = mejor;
}

function moverPlaga(p, indice, dt) {
  const vel = velPlaga(p);

  if (p.estado === "casa") {
    // se mueve de arriba abajo esperando su turno
    p.vaiven += dt * 3;
    p.y = centroY(p.info.casa.f) + Math.sin(p.vaiven) * 3;
    if (verdurasComidas >= p.soltarEn) p.estado = "saliendo";
    return;
  }

  if (p.estado === "saliendo") {
    const metaX = centroX(13), metaY = centroY(11);
    if (Math.abs(p.x - metaX) > 1) {
      p.x += Math.sign(metaX - p.x) * vel * dt;
    } else {
      p.x = metaX;
      p.y -= vel * dt;
      if (p.y <= metaY) { p.y = metaY; p.estado = "normal"; p.dir = Math.random() < 0.5 ? IZQ : DER; }
    }
    return;
  }

  if (p.estado === "ojos") {
    // vuelve a la madriguera a recomponerse
    const metaX = centroX(13), metaY = centroY(11);
    if (Math.abs(p.x - metaX) < 1.5 && Math.abs(p.y - metaY) < 1.5) {
      p.x = metaX;
      p.y += vel * dt;
      if (p.y >= centroY(14)) { p.y = centroY(14); p.estado = "saliendo"; }
      return;
    }
    decidirPlaga(p, indice);
    avanzar(p, vel, dt);
    return;
  }

  decidirPlaga(p, indice);
  avanzar(p, vel, dt);
  p.animacion += dt * 8;
}

// ---------- Choques ----------
function revisarChoques() {
  for (const p of plagas) {
    if (p.estado === "ojos" || p.estado === "casa") continue;
    if (Math.hypot(p.x - cosechador.x, p.y - cosechador.y) > 7) continue;

    if (asustadasReloj > 0 && p.estado === "normal") {
      plagasComidas++;
      sumar(200 * Math.pow(2, Math.min(plagasComidas - 1, 3)));
      p.estado = "ojos";
      p.ultimaCelda = null;
      sonar("plaga");
    } else if (p.estado === "normal") {
      escena = "muriendo";
      relojEscena = 0;
      cosechador.muerte = 0;
      sonar("muerte");
      return;
    }
  }
}

// ---------- Sonido ----------
let audio = null;
function sonar(que) {
  if (!sonidoActivo) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const notas = {
      mordisco: [[220, 0.04]],
      frutilla: [[440, 0.06], [660, 0.08]],
      plaga: [[520, 0.06], [780, 0.06], [1040, 0.1]],
      muerte: [[400, 0.12], [300, 0.12], [200, 0.16], [120, 0.25]],
      nivel: [[523, 0.1], [659, 0.1], [784, 0.16]],
      tomate: [[700, 0.07], [900, 0.1]],
    }[que];
    if (!notas) return;
    let cuando = audio.currentTime;
    for (const [frec, dur] of notas) {
      const osc = audio.createOscillator();
      const vol = audio.createGain();
      osc.type = "square";
      osc.frequency.value = frec;
      vol.gain.setValueAtTime(0.05, cuando);
      vol.gain.exponentialRampToValueAtTime(0.001, cuando + dur);
      osc.connect(vol).connect(audio.destination);
      osc.start(cuando);
      osc.stop(cuando + dur);
      cuando += dur;
    }
  } catch { /* si el navegador no deja sonar, el juego sigue igual */ }
}

// ---------- Dibujo ----------
function dibujarCentrado(img, x, y) {
  ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2));
}

function texto(txt, x, y, color = COLOR.texto, alineado = "left") {
  ctx.fillStyle = color;
  ctx.font = "8px ui-monospace, monospace";
  ctx.textAlign = alineado;
  ctx.textBaseline = "top";
  ctx.fillText(txt, x, y);
}

function dibujar() {
  ctx.fillStyle = COLOR.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // marcador
  texto("PUNTOS", 4, 2, "#7aa981");
  texto(String(puntaje), 4, 11, COLOR.texto);
  texto("RÉCORD", ANCHO - 4, 2, "#7aa981", "right");
  texto(String(record), ANCHO - 4, 11, COLOR.ambar, "right");

  ctx.save();
  ctx.translate(0, MARGEN_ARRIBA);

  // el laberinto parpadea al terminar el nivel
  const parpadeo = escena === "nivel" && Math.floor(relojEscena * 6) % 2 === 0;
  if (parpadeo) {
    ctx.globalAlpha = 0.35;
    ctx.drawImage(capaParedes, 0, 0);
    ctx.globalAlpha = 1;
  } else {
    ctx.drawImage(capaParedes, 0, 0);
  }

  // verduras
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLS; c++) {
      const ch = lab[f][c];
      if (ch === ".") {
        dibujarCentrado(esNabo(c, f) ? NABO : RABANITO, centroX(c), centroY(f));
      } else if (ch === "o") {
        // Late en vez de parpadear: así siempre se ve dónde están.
        const latido = 1 + Math.sin(reloj * 5) * 0.22;
        const lado = Math.round(FRUTILLA.width * latido);
        ctx.drawImage(FRUTILLA, Math.round(centroX(c) - lado / 2),
                      Math.round(centroY(f) - lado / 2), lado, lado);
      }
    }
  }

  if (tomate) dibujarCentrado(TOMATE, tomate.x, tomate.y);

  // plagas
  if (escena !== "muriendo") {
    plagas.forEach((p) => dibujarPlaga1(p));
  }

  // cosechador
  if (escena === "muriendo") {
    const abre = Math.min(cosechador.muerte * 1.6, 1);
    const img = dibujarCosechador(0.05 + abre * 3.0, cosechador.dir);
    ctx.globalAlpha = Math.max(0, 1 - cosechador.muerte * 0.55);
    dibujarCentrado(img, cosechador.x, cosechador.y);
    ctx.globalAlpha = 1;
  } else if (escena !== "fin") {
    const cuadro = escena === "listo" ? 1 : BOCAS.length - 1 - Math.abs(
      (Math.floor(cosechador.animacion) % (BOCAS.length * 2 - 2)) - (BOCAS.length - 1));
    const rumbo = cosechador.dir === IZQ ? "izq" : cosechador.dir === DER ? "der"
      : cosechador.dir === ARR ? "arr" : "aba";
    dibujarCentrado(COSECHADOR[rumbo][cuadro], cosechador.x, cosechador.y);
  }

  // carteles
  if (escena === "listo") {
    texto("¡A COSECHAR!", ANCHO / 2, centroY(17) - 3, COLOR.ambar, "center");
  } else if (escena === "fin") {
    texto("SE COMIERON LA HUERTA", ANCHO / 2, centroY(17) - 8, COLOR.tomate, "center");
    texto("tocá o apretá ENTER", ANCHO / 2, centroY(17) + 4, "#7aa981", "center");
  } else if (pausado) {
    texto("PAUSA", ANCHO / 2, centroY(17) - 3, COLOR.ambar, "center");
  }

  ctx.restore();

  // vidas y nivel
  const base = ALTO - 14;
  for (let i = 0; i < vidas - 1; i++) {
    dibujarCentrado(COSECHADOR.der[2], 12 + i * 14, base + 3);
  }
  texto("NIVEL " + nivel, ANCHO - 4, base, "#7aa981", "right");
}

function dibujarPlaga1(p) {
  const cuadro = Math.floor(p.animacion) % 2;
  if (p.estado === "ojos") {
    dibujarOjos(p, 0);
    return;
  }
  let img;
  if (asustadasReloj > 0 && p.estado === "normal") {
    const porTerminar = asustadasReloj < 2 && Math.floor(reloj * 6) % 2 === 0;
    img = (porTerminar ? PLAGA_PARPADEO : PLAGA_ASUSTADA)[cuadro];
    dibujarCentrado(img, p.x, p.y);
    dibujarOjos(p, 1);
    return;
  }
  dibujarCentrado(p.info.dibujos[cuadro], p.x, p.y);
  dibujarOjos(p, 0);
}

// Los ojos van sobre la cabeza del bicho (arriba del cuerpo) y la pupila mira
// hacia donde va, que es lo que le da la sensación de que te persigue.
function dibujarOjos(p, asustada) {
  const ojoY = Math.round(p.y - 4);
  const dx = p.dir.x, dy = p.dir.y;
  [-2, 2].forEach((lado) => {
    const ox = Math.round(p.x + lado);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ox - 1, ojoY, 2, 2);
    ctx.fillStyle = asustada ? "#ff9bb0" : "#101828";
    ctx.fillRect(ox - 1 + (dx > 0 ? 1 : 0), ojoY + (dy > 0 ? 1 : 0), 1, 1);
  });
}

// ---------- Bucle ----------
function actualizar(dt) {
  reloj += dt;
  if (pausado) return;

  if (escena === "listo") {
    relojEscena += dt;
    if (relojEscena > 1.8) { escena = "jugando"; relojEscena = 0; }
    return;
  }

  if (escena === "muriendo") {
    relojEscena += dt;
    cosechador.muerte += dt;
    if (relojEscena > 1.8) {
      vidas--;
      if (vidas <= 0) { escena = "fin"; }
      else { ubicarPersonajes(); escena = "listo"; relojEscena = 0; }
    }
    return;
  }

  if (escena === "nivel") {
    relojEscena += dt;
    if (relojEscena > 2) {
      nivel++;
      prepararLaberinto();
      ubicarPersonajes();
      escena = "listo";
      relojEscena = 0;
      sonar("nivel");
    }
    return;
  }

  if (escena !== "jugando") return;

  // cosechador
  intentarGiro(cosechador);
  const paso = avanzar(cosechador, velCosechador(), dt);
  if (paso > 0.01) cosechador.animacion += dt * 14;
  comer();

  // tomate
  if (tomate) {
    tomate.reloj -= dt;
    if (tomate.reloj <= 0) tomate = null;
    else if (Math.hypot(tomate.x - cosechador.x, tomate.y - cosechador.y) < 7) {
      sumar(puntosTomate());
      tomate = null;
      sonar("tomate");
    }
  }

  // plagas
  if (asustadasReloj > 0) asustadasReloj = Math.max(0, asustadasReloj - dt);
  actualizarModo(dt);
  plagas.forEach((p, i) => moverPlaga(p, i, dt));

  revisarChoques();
}

let anterior = performance.now();
function bucle(ahora) {
  const dt = Math.min((ahora - anterior) / 1000, 0.05);
  anterior = ahora;
  actualizar(dt);
  dibujar();
  requestAnimationFrame(bucle);
}

// ---------- Controles ----------
function girar(dir) {
  if (escena === "fin") { reiniciar(); return; }
  cosechador.dirDeseada = dir;
  if (audio && audio.state === "suspended") audio.resume();
}

const TECLAS = {
  ArrowLeft: IZQ, ArrowRight: DER, ArrowUp: ARR, ArrowDown: ABA,
  a: IZQ, d: DER, w: ARR, s: ABA, A: IZQ, D: DER, W: ARR, S: ABA,
};

document.addEventListener("keydown", (e) => {
  const dir = TECLAS[e.key];
  if (dir) { e.preventDefault(); girar(dir); return; }
  if (e.key === "p" || e.key === "P") alternarPausa();
  if (e.key === "Enter" && escena === "fin") reiniciar();
});

// ---------- El joystick ----------
// Se apoya el dedo en cualquier parte de la rueda y se lo desliza hacia donde
// se quiere ir: la bola lo sigue y el cosechador gira apenas puede. Con un solo
// dedo se juega toda la partida, sin levantarlo entre giro y giro.
const rueda = document.getElementById("rueda");
const perilla = document.getElementById("perilla");
const flechas = {
  arriba: rueda.querySelector(".arriba"), abajo: rueda.querySelector(".abajo"),
  izquierda: rueda.querySelector(".izquierda"), derecha: rueda.querySelector(".derecha"),
};
const NOMBRE_DIR = new Map([[ARR, "arriba"], [ABA, "abajo"], [IZQ, "izquierda"], [DER, "derecha"]]);

let dedoEnRueda = false;

function marcarFlecha(dir) {
  const cual = dir ? NOMBRE_DIR.get(dir) : null;
  Object.entries(flechas).forEach(([n, el]) => el.classList.toggle("activa", n === cual));
}

function moverPerilla(dx, dy) {
  perilla.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function usarRueda(ev) {
  const caja = rueda.getBoundingClientRect();
  if (!caja.width) return;                 // la rueda está oculta: no hay nada que mover
  const cx = caja.left + caja.width / 2, cy = caja.top + caja.height / 2;
  let dx = ev.clientX - cx, dy = ev.clientY - cy;

  // la bola no se sale de la base
  const dist = Math.hypot(dx, dy);
  const tope = Math.max(caja.width / 2 - 34, 12);
  if (dist > tope) { dx *= tope / dist; dy *= tope / dist; }
  moverPerilla(dx, dy);

  if (dist < 14) { marcarFlecha(null); return; }   // en el centro no se gira
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DER : IZQ) : (dy > 0 ? ABA : ARR);
  marcarFlecha(dir);
  girar(dir);
}

rueda.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  dedoEnRueda = true;
  rueda.setPointerCapture(e.pointerId);
  usarRueda(e);
});
rueda.addEventListener("pointermove", (e) => { if (dedoEnRueda) usarRueda(e); });
["pointerup", "pointercancel", "lostpointercapture"].forEach((evento) => {
  rueda.addEventListener(evento, () => {
    dedoEnRueda = false;
    moverPerilla(0, 0);       // la bola vuelve sola al centro, como las de arcade
    marcarFlecha(null);
  });
});

// deslizar el dedo sobre el tablero
let toqueX = 0, toqueY = 0;
pantalla.addEventListener("touchstart", (e) => {
  toqueX = e.touches[0].clientX; toqueY = e.touches[0].clientY;
  if (escena === "fin") reiniciar();
}, { passive: true });
pantalla.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - toqueX, dy = t.clientY - toqueY;
  if (Math.hypot(dx, dy) < 18) return;
  girar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DER : IZQ) : (dy > 0 ? ABA : ARR));
}, { passive: true });

function alternarPausa() {
  if (escena === "fin") return;
  pausado = !pausado;
  document.getElementById("btn-pausa").textContent = pausado ? "Seguir" : "Pausa";
}

document.getElementById("btn-pausa").addEventListener("click", alternarPausa);
document.getElementById("btn-sonido").addEventListener("click", (e) => {
  sonidoActivo = !sonidoActivo;
  e.target.textContent = "Sonido: " + (sonidoActivo ? "sí" : "no");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && escena === "jugando") { pausado = true; }
});

// ---------- Tamaño de la pantalla ----------
function ajustarTamano() {
  const tactil = window.matchMedia("(pointer: coarse)").matches;
  const anchoDisponible = Math.min(window.innerWidth - 20, 620);
  const altoDisponible = window.innerHeight - (tactil ? 185 : 115);
  let escala = Math.min(anchoDisponible / ANCHO, altoDisponible / ALTO);

  // De 2x para arriba conviene una escala entera: cada píxel del dibujo ocupa
  // la misma cantidad de píxeles de pantalla y no se deforma nada. Abajo de 2x
  // se usa la escala justa, porque si no el tablero queda diminuto en el celular.
  if (escala >= 2) escala = Math.floor(escala);
  escala = Math.max(1, escala);

  pantalla.style.width = Math.round(ANCHO * escala) + "px";
  pantalla.style.height = Math.round(ALTO * escala) + "px";
}
window.addEventListener("resize", ajustarTamano);

// ---------- Arranque ----------
function reiniciar() {
  puntaje = 0; vidas = 3; nivel = 1;
  prepararLaberinto();
  ubicarPersonajes();
  escena = "listo";
  relojEscena = 0;
  pausado = false;
}

reiniciar();
ajustarTamano();
requestAnimationFrame(bucle);

