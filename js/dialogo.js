// dialogo.js — Bitsy habla: el texto aparece letra por letra con una "voz" de bips (estilo Undertale).
// X muestra el mensaje completo. Con el mensaje completo, X, Enter o un toque pasan al siguiente.
window.BB = window.BB || {};

BB.dialogo = (function () {
  let actual = null; // { el, mensajes, i, pos, timer, completo, alTerminar }
  const VELOCIDAD = 34; // ms por letra

  function cancelar() {
    if (actual) { clearTimeout(actual.timer); actual.el.classList.remove('hablando', 'esperando'); }
    actual = null;
  }

  function escribir() {
    const a = actual;
    const txt = a.mensajes[a.i];
    if (a.pos >= txt.length) return terminarMensaje();
    const ch = txt[a.pos];
    a.pos++;
    a.el.textContent = txt.slice(0, a.pos);
    // la voz suena en letras, no en espacios ni signos; cada dos letras para que no sature
    if (/[a-záéíóúñü0-9]/i.test(ch) && a.pos % 2 === 0) BB.audio.sonar('voz');
    const pausa = /[.,!?…:]/.test(ch) ? VELOCIDAD * 5 : VELOCIDAD;
    a.timer = setTimeout(escribir, pausa);
  }

  function terminarMensaje() {
    const a = actual;
    clearTimeout(a.timer);
    a.el.textContent = a.mensajes[a.i];
    a.completo = true;
    a.el.classList.remove('hablando');
    const hayMas = a.i + 1 < a.mensajes.length;
    a.el.classList.toggle('esperando', hayMas);
    if (!hayMas) { const fin = a.alTerminar; actual = null; if (fin) fin(); }
  }

  function siguiente() {
    const a = actual;
    a.i++; a.pos = 0; a.completo = false;
    a.el.classList.remove('esperando');
    a.el.classList.add('hablando');
    escribir();
  }

  // X: completa el mensaje. Avanzar: X / Enter / toque cuando ya está completo
  function saltar() { if (actual && !actual.completo) terminarMensaje(); else if (actual) siguiente(); }
  function avanzar() { if (!actual) return; if (actual.completo) siguiente(); else terminarMensaje(); }

  document.addEventListener('keydown', (e) => {
    if (!actual || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === 'x' || e.key === 'X') { e.preventDefault(); saltar(); }
    else if (e.key === 'Enter' && actual.completo) { e.preventDefault(); siguiente(); }
  });

  // mensajes: texto o lista de textos. el: el elemento donde se escribe (también se puede tocar)
  function hablar(el, mensajes, { alTerminar = null } = {}) {
    cancelar();
    const lista = Array.isArray(mensajes) ? mensajes : [mensajes];
    actual = { el, mensajes: lista, i: 0, pos: 0, timer: null, completo: false, alTerminar };
    el.textContent = '';
    el.classList.add('hablando');
    if (!el.dataset.dialogo) {
      el.dataset.dialogo = '1';
      el.addEventListener('click', () => { if (actual && actual.el === el) avanzar(); });
    }
    escribir();
  }

  return { hablar, cancelar };
})();
