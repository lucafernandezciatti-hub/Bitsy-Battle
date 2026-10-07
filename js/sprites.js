// sprites.js — carga los PNG de los Bitsies tal cual están (sin reescalar ni tocar colores)
// y arma, solo para los efectos, versiones infectado / desconectado / destello.
window.BB = window.BB || {};

BB.sprites = {};  // id → { img, src, alto, ancho, infectado, gris, blanco, fallback }

// Los efectos se calculan sobre una copia de este alto (en px reales), suficiente para pantallas retina
const ALTO_EFECTOS = 300;

function lienzo(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function copiaEfectos(img) {
  const k = Math.min(1, ALTO_EFECTOS / img.height);
  const c = lienzo(Math.round(img.width * k), Math.round(img.height * k)), x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

function teñir(img, color, alfa) {
  const c = copiaEfectos(img), x = c.getContext('2d');
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = alfa; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return c;
}

function enGris(img) {
  const c = copiaEfectos(img), x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const g = (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) * 0.55;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = g;
  }
  x.putImageData(d, 0, 0);
  return c;
}

function infectar(img) {
  // tono verde-azulado del Virus + líneas cortadas
  const c = teñir(img, '#19E3D0', 0.35), x = c.getContext('2d');
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(255,51,88,.6)';
  const paso = Math.max(4, Math.round(c.height / 16));
  for (let y = 3; y < c.height; y += paso) x.fillRect(0, y, c.width, Math.max(1, Math.round(paso / 7)));
  return c;
}

function cargarImagen(src) {
  return new Promise((ok) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = src;
  });
}

BB.cargarSprites = async function (alAvanzar) {
  const base = await cargarImagen('assets/bitsies/bitsy_base.png');
  let hechos = 0;
  await Promise.all(BB.datos.bitsies.map(async (b) => {
    let img = await cargarImagen(b.sprite);
    let fallback = false;
    if (!img) { img = base; fallback = true; } // falta el PNG → silueta de la Base con glitch
    const alto = fallback ? 45 : (b.alto || 45);
    BB.sprites[b.id] = {
      img, fallback,
      src: fallback ? 'assets/bitsies/bitsy_base.png' : b.sprite,
      alto, ancho: alto * img.width / img.height,
      infectado: infectar(img),
      gris: enGris(img),
      blanco: teñir(img, '#FBF8FF', 1)
    };
    hechos++;
    if (alAvanzar) alAvanzar(hechos, BB.datos.bitsies.length);
  }));
  // los secuaces son siluetas de la Base, siempre glitcheadas
  if (BB.sprites.fragmento) BB.sprites.fragmento.fallback = true;
};

// Dibuja un sprite (de cualquier resolución) en un rectángulo del canvas, cortado en franjas desplazadas
BB.dibujarGlitch = function (x, fuente, dx, dy, w, h, intensidad = 1) {
  const k = fuente.height / h;
  let y = 0;
  while (y < h) {
    const franja = Math.min(2 + Math.random() * 5, h - y);
    const corr = Math.random() < 0.35 * intensidad ? (Math.random() * 2 - 1) * 3 * intensidad : 0;
    x.drawImage(fuente, 0, y * k, fuente.width, franja * k, dx + corr, dy + y, w, franja);
    y += franja;
  }
};

// Fuente de pixeles 3x5 para números de daño (nítida a cualquier escala)
const GLIFOS = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111',
  '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010',
  '8': '111101111101111', '9': '111101111001111', '+': '000010111010000', '-': '000000111000000',
  'E': '111100110100111', 'S': '111100111001111', 'Q': '111101101111001', 'U': '101101101101111',
  'I': '111010010010111', 'V': '101101101101010', 'Ó': '111101101101111', '!': '010010010000010',
  'Z': '111001010100111', 'A': '010101111101101', 'T': '111010010010010', 'D': '110101101101110',
  'O': '111101101101111', 'K': '101101110101101', 'P': '111101111100100', 'R': '110101110101101',
  'F': '111100110100100', 'L': '100100100100111', 'N': '110101101101101', ' ': '000000000000000'
};
BB.textoPixel = function (x, txt, cx, y, color, escala = 1) {
  const ancho = txt.length * 4 * escala - escala;
  const x0 = Math.round(cx - ancho / 2);
  for (let pasada = 0; pasada < 2; pasada++) { // 0 = sombra, 1 = color
    let px = x0;
    x.fillStyle = pasada === 0 ? '#0B0820' : color;
    for (const ch of txt) {
      const g = GLIFOS[ch];
      if (g) {
        for (let i = 0; i < 15; i++) {
          if (g[i] !== '1') continue;
          const gx = px + (i % 3) * escala + (pasada === 0 ? escala : 0);
          const gy = y + Math.floor(i / 3) * escala + (pasada === 0 ? escala : 0);
          x.fillRect(gx, gy, escala, escala);
        }
      }
      px += 4 * escala;
    }
  }
};
