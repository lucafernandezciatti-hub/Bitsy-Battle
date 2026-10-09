// feedback.js — notas de prueba con captura de pantalla.
// Botón ✎ → se saca una captura del juego → escribís la observación → Enter la guarda.
// Las notas quedan en el navegador (IndexedDB) hasta que las descargás como un archivo .json.
window.BB = window.BB || {};
BB.VERSION = '0.9';

BB.feedback = (function () {
  const $ = (id) => document.getElementById(id);
  let captura = null;      // dataURL de la última captura
  let contexto = null;     // estado del juego en el momento de la captura
  let ocupado = false;
  let memoria = [];        // respaldo si el navegador no deja usar IndexedDB

  // ---------------- almacenamiento ----------------
  function abrir() {
    return new Promise((ok, mal) => {
      if (!window.indexedDB) return mal(new Error('sin IndexedDB'));
      const r = indexedDB.open('bitsy-battle-feedback', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('notas', { keyPath: 'id', autoIncrement: true });
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
    });
  }
  async function operar(modo, fn) {
    const db = await abrir();
    return new Promise((ok, mal) => {
      const tx = db.transaction('notas', modo);
      const req = fn(tx.objectStore('notas'));
      tx.oncomplete = () => ok(req && req.result);
      tx.onerror = () => mal(tx.error);
    });
  }
  async function agregar(nota) {
    try { await operar('readwrite', (s) => s.add(nota)); } catch (e) { memoria.push(nota); }
  }
  async function todas() {
    try { return (await operar('readonly', (s) => s.getAll())).concat(memoria); } catch (e) { return memoria.slice(); }
  }
  async function borrarTodas() {
    memoria = [];
    try { await operar('readwrite', (s) => s.clear()); } catch (e) { /* nada */ }
  }

  // ---------------- captura ----------------
  // html2canvas (MIT) va incluido en js/vendor; si faltara, se pide a cdnjs
  function cargarScript(src) {
    return new Promise((ok, mal) => {
      const sc = document.createElement('script');
      sc.src = src; sc.onload = ok; sc.onerror = () => { sc.remove(); mal(new Error('no cargó ' + src)); };
      document.head.appendChild(sc);
    });
  }
  async function cargarHtml2canvas() {
    if (window.html2canvas) return;
    try { await cargarScript('js/vendor/html2canvas.min.js'); }
    catch (e) { await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'); }
  }

  async function sacarCaptura() {
    await cargarHtml2canvas();
    // se captura la ventana completa; en la copia se apagan efectos que html2canvas no sabe dibujar
    // (degradés, sombras internas, scanlines) para que la imagen salga fiel
    const lienzo = await window.html2canvas(document.body, {
      backgroundColor: '#0B0820', logging: false,
      scale: Math.min(2, window.devicePixelRatio || 1),
      width: window.innerWidth, height: window.innerHeight,
      windowWidth: window.innerWidth, windowHeight: window.innerHeight,
      x: window.scrollX, y: window.scrollY,
      ignoreElements: (el) => el.id === 'feedback' || el.id === 'aviso-fb',
      onclone: (doc) => {
        const st = doc.createElement('style');
        st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}' +
          '.pantalla{background:#160F45!important;box-shadow:none!important;filter:none!important}' +
          '.pantalla::after{display:none!important}.crt{box-shadow:none!important}.monitor-pie{display:none!important}' +
          'body{background:#0B0820!important}';
        doc.head.appendChild(st);
      }
    });
    // se achica a 1280 px de ancho como máximo para que el archivo no pese demasiado
    const k = Math.min(1, 1280 / lienzo.width);
    const c = document.createElement('canvas');
    c.width = Math.round(lienzo.width * k); c.height = Math.round(lienzo.height * k);
    c.getContext('2d').drawImage(lienzo, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  }

  function leerContexto() {
    const vista = document.querySelector('.vista.activa');
    const ctx = {
      pantalla: vista ? vista.id.replace('v-', '') : '?',
      escritorio: BB.esEscritorio ? BB.esEscritorio() : null,
      ventana: `${window.innerWidth}×${window.innerHeight}`,
      senal: BB.senal ? BB.senal() : null,
      desbloqueados: BB.progreso ? BB.progreso.desbloqueados.slice() : []
    };
    if (BB.combate) ctx.combate = BB.combate.titulo;
    const b = BB.batallaActual;
    if (b && ctx.pantalla === 'batalla') {
      ctx.ronda = b.ronda;
      ctx.turno = b.actual ? b.actual.nombre : null;
      ctx.texto_log = $('log').textContent;
      ctx.unidades = b.todos.map((u) => `${u.bando}:${u.nombre} ${u.pv}/${u.maxPv}`);
    }
    if (!$('modal').hidden) ctx.ventana_abierta = $('ficha').innerText.slice(0, 200);
    return ctx;
  }

  // ---------------- interfaz ----------------
  function aviso(txt) {
    const a = $('aviso-fb');
    a.textContent = txt; a.hidden = false;
    clearTimeout(aviso.t); aviso.t = setTimeout(() => { a.hidden = true; }, 2200);
  }

  async function pintarContador() {
    const n = (await todas()).length;
    $('fb-contador').textContent = `NOTAS GUARDADAS: ${n}`;
    $('fb-descargar').disabled = n === 0;
    $('fb-borrar').disabled = n === 0;
    return n;
  }

  async function abrirPanel() {
    if (ocupado) return;
    ocupado = true;
    $('btn-feedback').disabled = true;
    contexto = leerContexto();
    aviso('CAPTURANDO PANTALLA...');
    try { captura = await sacarCaptura(); } catch (e) { captura = null; console.warn(e); }
    $('btn-feedback').disabled = false;
    ocupado = false;
    $('aviso-fb').hidden = true;
    $('fb-miniatura').hidden = !captura;
    if (captura) $('fb-miniatura').src = captura;
    $('fb-sin-captura').hidden = !!captura;
    $('fb-pantalla').textContent = 'PANTALLA: ' + contexto.pantalla.toUpperCase();
    $('fb-texto').value = '';
    $('fb-borrar').dataset.confirmar = '';
    $('fb-borrar').textContent = 'BORRAR TODO';
    $('feedback').hidden = false;
    pintarContador();
    setTimeout(() => $('fb-texto').focus(), 30);
  }

  function cerrar() { $('feedback').hidden = true; }

  async function guardar() {
    const texto = $('fb-texto').value.trim();
    if (!texto) { $('fb-texto').focus(); return; }
    await agregar({ fecha: new Date().toISOString(), version: BB.VERSION, texto, contexto, captura });
    const n = (await todas()).length;
    cerrar();
    aviso(`NOTA GUARDADA (${n})`);
  }

  async function descargar() {
    const notas = await todas();
    if (!notas.length) return;
    const datos = { app: 'Bitsy Battle', version: BB.VERSION, exportado: new Date().toISOString(), cantidad: notas.length, notas };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bitsy-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    // una vez descargadas, las notas se borran: el próximo archivo trae solo las nuevas
    await borrarTodas();
    pintarContador();
    aviso(`ARCHIVO DESCARGADO (${notas.length} NOTAS) · HISTORIAL LIMPIO`);
  }

  async function borrar() {
    const b = $('fb-borrar');
    if (!b.dataset.confirmar) { b.dataset.confirmar = '1'; b.textContent = '¿SEGURO? TOCÁ DE NUEVO'; return; }
    await borrarTodas();
    b.dataset.confirmar = ''; b.textContent = 'BORRAR TODO';
    pintarContador();
    aviso('NOTAS BORRADAS');
  }

  function armar() {
    $('btn-feedback').onclick = abrirPanel;
    $('fb-guardar').onclick = guardar;
    $('fb-cancelar').onclick = cerrar;
    $('fb-descargar').onclick = descargar;
    $('fb-borrar').onclick = borrar;
    $('fb-texto').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); guardar(); }
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    });
    $('feedback').addEventListener('click', (e) => { if (e.target === $('feedback')) cerrar(); });
  }

  return { armar, todas, abrirPanel };
})();
