# Bitsy Battle

App complementaria de **Pixelados**: un RPG de batallas por turnos 4v4. Cada página resuelta de la revista desbloquea una variante de Bitsy.

## Cómo abrirla

La app lee archivos JSON, así que **no anda con doble clic sobre `index.html`**. Hay que abrirla desde un servidor:

- **GitHub Pages:** subí la carpeta `bitsy-battle` al repo, en GitHub andá a Settings → Pages y publicá la rama. Queda en `https://<usuario>.github.io/<repo>/.../bitsy-battle/`.
- **En tu compu:** en VS Code instalá la extensión "Live Server", abrí la carpeta y tocá "Go Live". O en una terminal, dentro de la carpeta: `python -m http.server` y abrí `http://localhost:8000`.

## Carpetas

```
bitsy-battle/
├── index.html          todas las pantallas
├── css/estilo.css      estética CRT y colores de la paleta de Pixelados
├── js/
│   ├── datos.js        carga los JSON y guarda el progreso (localStorage)
│   ├── audio.js        sonidos chiptune con Web Audio (no hay archivos de audio)
│   ├── sprites.js      carga los PNG y arma las versiones infectado / desconectado
│   ├── batalla.js      motor de batalla, CPU y dibujo en el canvas
│   ├── pantallas.js    menús: inicio, señal, colección, mapa, equipo, resultado
│   ├── feedback.js     botón ✎: notas con captura y descarga del archivo
│   ├── vendor/         html2canvas (saca las capturas del feedback)
│   └── main.js         arranque
├── data/
│   ├── bitsies.json    stats y movimientos
│   ├── mundos.json     códigos de cada página, fondos y equipos rivales
│   └── textos.json     lo que dice Bitsy y los mensajes del sistema
└── assets/
    ├── bitsies/        los dibujos originales, con fondo transparente
    ├── mundos/         fondos de batalla (las escenas originales)
    └── personajes/     Luca y Donna para la pantalla final
```

## Códigos de cada página

Cada Bitsy tiene su propio código de 3 símbolos, impreso **junto al texto de Bitsy** en cada página (dos códigos por página):

| Página | Mundo | Código | Desbloquea |
| --- | --- | --- | --- |
| 1 | Mario | □ △ ○ | Bitsy Mario |
| 1 | Mario | ♡ ○ △ | Bitsy Luigi |
| 2 | Hello Kitty | ✧ ♡ ✖ | Bitsy Hello Kitty |
| 2 | Hello Kitty | ✖ □ ✧ | Bitsy Keroppi |
| 3 | Scooby-Doo | ○ ✖ △ | Bitsy Dafne |
| 3 | Scooby-Doo | △ ♡ ○ | Bitsy Fred |
| 4 | Batman | ♡ ✧ ✖ | Bitsy Batman |
| 4 | Batman | □ ✖ ♡ | Bitsy Robin |
| 5 | Los Simpsons | □ ♡ ○ | Bitsy Lisa Simpson |
| 5 | Los Simpsons | ✧ ○ □ | Bitsy Bart |
| 6 | Dragon Ball | ○ □ ♡ | Bitsy Goku |
| 6 | Dragon Ball | △ □ ♡ | Bitsy Vegeta |
| 7 | Harry Potter | △ ✖ ✧ | Bitsy Harry Potter |
| 7 | Harry Potter | ○ ✧ △ | Bitsy Ron Weasley |
| 8 | Pucca y Garu | △ ○ ✖ | Bitsy Puca |
| 8 | Pucca y Garu | ✖ ○ ♡ | Bitsy Garu |

Los códigos solo desbloquean versiones de Bitsy. Los mundos de la campaña se juegan **en orden**: el primero está abierto y ganar cada batalla abre el siguiente. Con los 8 ganados se abre la batalla final.

**Código maestro (modo demo):** `○ ○ ○` desbloquea todas las páginas, todos los Bitsies y la batalla final. Para la entrega conviene cambiarlo o no mostrarlo.

## Cómo cambiar cosas

**Un código:** en `data/mundos.json`, cada mundo tiene `"codigos"`: `{ "id del Bitsy": "3 símbolos" }`. Usá solo los símbolos de `"simbolos"` (□ △ ○ ♡ ✧ ✖, que son las teclas de la app) y que no se repita con ningún otro. El maestro está en `"codigo_maestro"`.

**El orden de las páginas:** cambiá `"pagina"` y el orden de la lista en `mundos.json`.

**Stats de un Bitsy:** en `data/bitsies.json`, `"stats": { "pv", "atq", "def", "vel" }`. VEL decide quién actúa primero.

**Un movimiento:** cada Bitsy tiene 3, con:
- `objetivo`: `rival`, `rivales` (todos), `dos_rivales`, `aliado`, `aliados` (todo el equipo) o `propio`.
- `poder`: daño base (entre 6 y 20). Sin `poder` no hace daño.
- `golpes`: cuántas veces pega (default 1).
- `usos`: cuántas veces se puede usar por batalla, como los PP de Pokémon. Si un Bitsy se queda sin usos en todo, pelea con *Arrebato* (golpe débil).
- `efectos`: lista de `cura {pct}`, `veneno {turnos}`, `aturdir {turnos}`, `mod {stat, cambio}` (sube o baja ATQ/DEF/VEL), `esquiva`, `al_final`, `copiar`. Con `"a": "propio"` el efecto va a quien lo usa.

**La dificultad:** en `mundos.json`, `"nivel"` de cada rival multiplica sus PV y ATQ (1 = normal).

**Un sprite:** los PNG de `assets/bitsies/` son los dibujos originales de `Pixelados/Bitsies/BitsiesSinBases`, con dos únicos cambios: fondo blanco transparente y recorte del espacio vacío. No se reescalan ni se tocan los colores. Para regenerarlos:

```
python herramientas/normalizar_bitsies.py "<ruta a BitsiesSinBases>" assets/bitsies
```

El script imprime el valor `"alto"` de cada uno: copialo en `data/bitsies.json`. Ese número hace que todos los cuerpos se vean del mismo tamaño en la batalla (la Base mide 45).

**Agregar un Bitsy:** poné su PNG en `BitsiesSinBases`, sumalo al diccionario `NOMBRES` del script y corrélo. Después agregalo a `bitsies.json` (copiá uno y cambiá `id`, nombre, sprite, alto, stats y movimientos) y sumá su id a `"variantes"` del mundo que corresponda en `mundos.json`.

## Feedback

El botón ✎ (arriba, al lado del ♪) sirve para dejar notas mientras probás el juego:

1. Tocá ✎: la app saca una captura de lo que se ve en ese momento.
2. Escribí la observación y apretá **Enter** (Shift+Enter baja de línea, Esc cierra).
3. Cuando termines, abrí ✎ otra vez y tocá **DESCARGAR ARCHIVO**: baja un `bitsy-feedback-AAAA-MM-DD.json` con todas las notas, sus capturas y el estado del juego (pantalla, turno, PV de cada Bitsy). Ese archivo es el que se le pasa a Claude.

Al descargar el archivo, las notas se borran del navegador: así cada archivo trae solo las observaciones nuevas. **BORRAR TODO** las borra sin descargarlas. La descarga funciona en GitHub Pages o en tu compu; dentro de la vista previa de Claude el navegador bloquea las descargas.

## Intro

La primera vez que se abre la app, Bitsy cuenta la historia (el café, la Bitsy corrupta y sus copias). Los textos están en `data/textos.json` → `intro_mensajes`: cada mensaje tiene un `texto` y una `escena` (`bitsy`, `cafe`, `virus`, `copias`, `desaparece`, `alarma`) que cambia lo que se ve arriba. Se puede volver a ver desde Ajustes → VER INTRO.

## Reglas de batalla

- 4 contra 4. Cada ronda actúan todos los vivos, ordenados por VEL (en empate, el jugador primero).
- Daño = máx(1, poder × ATQ / DEF × azar de 0,9 a 1,1).
- Veneno: pierde 8% de PV al empezar su turno. Aturdido: pierde un turno y no puede quedar aturdido dos turnos seguidos.
- Desde la ronda 9 "la señal se degrada" y todos los golpes pegan más fuerte, para que ninguna batalla quede trabada.
- La Bitsy Base se puede repetir en el equipo; las variantes, no.
- El progreso se guarda en el navegador. Se borra desde Ajustes.
