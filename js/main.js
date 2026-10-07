// main.js — arranque de la app
(async function () {
  // el audio del navegador solo arranca después de un toque
  document.addEventListener('pointerdown', () => {
    BB.audio.iniciar();
    BB.audioListo = true;
    if (!document.getElementById('v-batalla').classList.contains('activa')) BB.audio.musica('menu');
  }, { once: true });
  BB.cargarProgreso();
  try {
    await BB.cargarDatos();
    await BB.cargarSprites((n, total) => {
      document.getElementById('cargando-txt').textContent = `CARGANDO BITSIES ${n}/${total}...`;
    });
  } catch (e) {
    document.getElementById('cargando-txt').innerHTML =
      'ERROR 0xFF: NO SE PUDIERON LEER LOS DATOS.<br><br>' +
      'Abrí la app desde un servidor (GitHub Pages, o "Live Server" en VS Code), ' +
      'no con doble clic sobre index.html. Ver README.';
    console.error(e);
    return;
  }
  BB.feedback.armar();
  BB.armarTeclado();
  BB.armarEventos();
  if (BB.progreso.introVista) BB.ir('inicio'); else BB.mostrarIntro();
})();
