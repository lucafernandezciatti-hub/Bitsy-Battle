"""Prepara los PNG de los Bitsies para la app SIN tocar el dibujo.

Hace solo dos cosas:
  1. vuelve transparente el fondo blanco (solo los píxeles de fondo conectados al borde),
  2. recorta el espacio vacío alrededor del personaje.
No reescala, no cambia colores, no cuantiza. Además imprime el valor "alto" para data/bitsies.json,
que hace que todos los cuerpos se vean del mismo tamaño en la batalla.

Uso (necesita pillow, numpy y scipy):
    python normalizar_bitsies.py "<carpeta BitsiesSinBases>" "<carpeta assets/bitsies del repo>"
"""
import sys, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

# Nombre del archivo original → id en bitsies.json. Para un Bitsy nuevo, agregalo acá.
NOMBRES = {'BitsyBase': 'base', 'BitsyMario': 'mario', 'BitsyBatman': 'batman', 'BitsyDafne': 'dafne',
           'BitsyHelloKitty': 'hello_kitty', 'BitsyLisa': 'lisa_simpson', 'BitsyPuca': 'puca', 'BitsyVirus': 'virus',
           'Bitsy Luigi': 'luigi', 'Bitsy Robin': 'robin', 'Bitsy Fred': 'fred', 'Bitsy Keroppi': 'keroppi',
           'Bitsy Bart': 'bart', 'Bitsy Garu': 'garu', 'Bitsy Goku': 'goku', 'Bitsy Vegeta': 'vegeta',
           'Bitsy Harry Potter': 'harry', 'Bitsy Ron Weasly': 'ron'}

# Referencia de escala: la Bitsy Base, dibujada en un lienzo de 1195 px de ancho, mide 589 px de alto
# y en el juego mide 45 unidades. Los originales están dibujados en proporción al ancho de su lienzo.
ANCHO_REF, ALTO_BASE, ALTO_JUEGO = 1195, 589, 45

src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
for f in sorted(src.glob('*.png')):
    if f.stem not in NOMBRES:
        print('sin id (agregalo a NOMBRES):', f.name); continue
    original = Image.open(f).convert('RGB')
    rgb = np.array(original).astype(int)
    blanco = (rgb.min(axis=2) >= 235) & ((rgb.max(axis=2) - rgb.min(axis=2)) <= 18)
    et, _ = ndimage.label(blanco)
    borde = set(et[0]) | set(et[-1]) | set(et[:, 0]) | set(et[:, -1]); borde.discard(0)
    fondo = np.isin(et, list(borde))
    fig, n = ndimage.label(~fondo)
    if n > 1:  # descarta motas sueltas lejos del personaje
        tam = ndimage.sum(~fondo, fig, range(1, n + 1))
        cerca = ndimage.binary_dilation(fig == int(np.argmax(tam)) + 1, iterations=25)
        fondo |= ~cerca
    im = Image.fromarray(np.dstack([rgb.astype(np.uint8), np.where(fondo, 0, 255).astype(np.uint8)]), 'RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    nombre = NOMBRES[f.stem]
    im.save(dst / f'bitsy_{nombre}.png', optimize=True)
    alto = round(im.height * ANCHO_REF / original.width * ALTO_JUEGO / ALTO_BASE, 1)
    print(f'{nombre:13s} {im.width}x{im.height}px  →  "alto": {alto}')
