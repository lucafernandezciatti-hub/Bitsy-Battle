// pantallas.js — menús: inicio, ingresar señal, colección, mapa, equipo, resultado, salida, ajustes
window.BB = window.BB || {};

const $ = (id) => document.getElementById(id);

BB.ir = function (nombre) {
  BB.dialogo.cancelar();
  document.querySelectorAll('.vista').forEach((v) => v.classList.remove('activa'));
  $('v-' + nombre).classList.add('activa');
  $('modal').hidden = true;
  const pintar = BB.pantallas[nombre];
  if (pintar) pintar();
  // los menús tienen su propia música; la batalla la cambia por la suya
  if (nombre !== 'batalla' && BB.audioListo) BB.audio.musica('menu', nombre === 'resultado' || nombre === 'salida' ? 2200 : 0);
};

BB.pintarSenal = function (cont, nuevo = -1) {
  const n = BB.senal();
  cont.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('i');
    if (i < n) s.className = 'on' + (i === nuevo ? ' nuevo' : '');
    cont.appendChild(s);
  }
};

// ---------------- Ficha de un Bitsy (modal) ----------------
BB.mostrarFicha = function (id, { revelar = false, aviso = '', alCerrar = null, accion = null } = {}) {
  const d = BB.datos.porId[id];
  const sp = BB.sprites[id];
  const stat = (nom, v, max) => `<div class="stat"><span>${nom}</span><span class="barra"><i style="width:${Math.round(v / max * 100)}%"></i></span><span>${v}</span></div>`;
  $('ficha').innerHTML = `
    ${aviso ? `<p class="aviso">${aviso}</p>` : ''}
    <div class="ficha-izq">
      <div class="ficha-top">
        <img class="sprite ${revelar ? 'revelar' : ''}" src="${sp.src}" alt="${d.nombre}">
        <div><h3>${d.nombre}</h3><p class="rol">${d.rol}</p></div>
      </div>
      ${stat('PV', d.stats.pv, 140)}${stat('ATQ', d.stats.atq, 15)}${stat('DEF', d.stats.def, 15)}${stat('VEL', d.stats.vel, 15)}
    </div>
    <div class="ficha-der">
    <ul>${d.movimientos.map((m) => `<li><span class="li-mov">${m.nombre}<span class="pp">${m.usos || 10} USOS</span></span><small>${m.desc}</small></li>`).join('')}</ul>
    ${accion ? `<button class="btn btn-primario" id="ficha-accion" ${accion.deshabilitado ? 'disabled' : ''}>${accion.texto}</button>` : ''}
    <button class="btn ${accion ? '' : 'btn-primario'}" id="ficha-cerrar">CERRAR</button>
    </div>`;
  $('modal').hidden = false;
  $('ficha-cerrar').textContent = alCerrar ? 'SIGUIENTE ►' : 'CERRAR';
  $('ficha-cerrar').onclick = () => { BB.audio.sonar('tecla'); $('modal').hidden = true; if (alCerrar) alCerrar(); };
  if (accion) $('ficha-accion').onclick = () => { $('modal').hidden = true; accion.fn(); };
};

// ---------------- Pantalla final: solo Bitsy, hablando ----------------
BB.mostrarSalida = function () {
  const T = BB.datos.textos;
  BB.ir('salida');
  $('salida-creditos').hidden = true;
  $('salida-volver').hidden = true;
  $('salida-ayuda').textContent = T.ayuda_dialogo;
  $('salida-creditos').textContent = T.creditos;
  BB.dialogo.hablar($('salida-txt'), T.salida_mensajes, {
    alTerminar: () => {
      $('salida-ayuda').textContent = '';
      $('salida-creditos').hidden = false;
      $('salida-volver').hidden = false;
    }
  });
};

// ---------------- Intro: la primera vez, Bitsy cuenta qué pasó ----------------
// Primero un botón "TOCÁ PARA EMPEZAR" (el navegador necesita un toque para que suene la voz),
// después el diálogo. Cada mensaje tiene una "escena" que cambia lo que se ve arriba.
BB.mostrarIntro = function () {
  const T = BB.datos.textos;
  const msjs = T.intro_mensajes;
  BB.ir('intro');
  const escena = $('intro-escena');
  escena.dataset.escena = 'bitsy';
  $('intro-titulo').textContent = T.intro_alerta;
  $('intro-virus').src = BB.sprites.virus.src;
  // las copias corruptas: el fragmento y algunas versiones disfrazadas, todas en su versión "infectada"
  const COPIAS = { 'intro-copia1': 'mario', 'intro-copia2': 'fragmento', 'intro-copia3': 'batman', 'intro-copia4': 'hello_kitty' };
  Object.entries(COPIAS).forEach(([el, id]) => {
    if (!$(el)) return; // si el HTML es de otra versión, se saltea en vez de romper la intro
    const sp = BB.sprites[id] || BB.sprites.fragmento;
    let src = sp.src;
    try { if (sp.infectado && sp.infectado.toDataURL) src = sp.infectado.toDataURL(); } catch (e) { /* usa el original */ }
    $(el).src = src;
    $(el).style.setProperty('--k', (sp.alto / 45).toFixed(2)); // mismo tamaño de cuerpo para todos
  });
  $('intro-caja').hidden = true;
  $('intro-saltar').hidden = true;
  $('intro-listo').hidden = true;
  $('intro-ayuda').textContent = '';
  $('intro-empezar').hidden = false;

  const terminar = () => {
    BB.dialogo.cancelar();
    BB.progreso.introVista = true;
    BB.guardar();
    BB.audio.sonar('elegir');
    BB.ir('inicio');
  };
  $('intro-listo').onclick = terminar;
  $('intro-saltar').onclick = terminar;
  $('intro-empezar').onclick = () => {
    BB.audio.iniciar();
    BB.audio.musica(null);
    BB.audio.sonar('estado');
    $('intro-empezar').hidden = true;
    $('intro-caja').hidden = false;
    $('intro-saltar').hidden = false;
    $('intro-ayuda').textContent = T.ayuda_dialogo;
    BB.dialogo.hablar($('intro-txt'), msjs.map((m) => m.texto), {
      alMensaje: (i) => {
        const e = msjs[i].escena;
        if (escena.dataset.escena !== e && (e === 'virus' || e === 'alarma')) BB.audio.sonar(e === 'virus' ? 'estado' : 'error');
        if (e === 'copias') BB.audio.sonar('baja');
        escena.dataset.escena = e;
        $('v-intro').classList.toggle('alarma', e === 'alarma');
      },
      alTerminar: () => {
        $('intro-ayuda').textContent = '';
        $('intro-saltar').hidden = true;
        $('intro-listo').hidden = false;
        $('v-intro').classList.remove('alarma');
        BB.audio.musica('menu', 300);
      }
    });
  };
};

// Figura de un Bitsy en una caja de alto fijo: todos se escalan con el mismo factor
// (según su "alto" en bitsies.json), así los cuerpos quedan del mismo tamaño en todas las tarjetas.
const ALTO_MAX = 57;
BB.figura = function (id, filtro = '') {
  const sp = BB.sprites[id];
  const pct = Math.round(sp.alto / ALTO_MAX * 100);
  return `<span class="fig"><img class="sprite" src="${sp.src}" alt="" style="--h:${pct}%;${filtro}"></span>`;
};

BB.carta = function (id, { bloqueada = false, badge = '' } = {}) {
  const d = BB.datos.porId[id];
  const c = document.createElement('button');
  c.className = 'carta' + (bloqueada ? ' bloqueada' : '');
  c.innerHTML = `${BB.figura(id)}
    <span class="nombre">${bloqueada ? '???' : d.nombre.replace('Bitsy ', '')}</span>${badge ? `<span class="badge">${badge}</span>` : ''}`;
  return c;
};

// ---------------- Estado de la batalla que se va a jugar ----------------
BB.combate = null; // { tipo: 'mundo' | 'final' | 'rapida', mundo, rival, fondo }
let equipo = [];

// Un mundo está abierto si es el primero, si ya se ganó el anterior, o en modo demo
BB.mundoAbierto = function (i) {
  if (i === 0 || BB.progreso.demo) return true;
  return BB.progreso.ganados.includes(BB.datos.mundos[i - 1].id);
};

// cantidad de símbolos de cada código (los que van impresos en la revista)
BB.LARGO_CODIGO = 3;

BB.pantallas = {
  inicio() {
    BB.pintarSenal($('senal-barra'));
    $('senal-txt').textContent = `SEÑAL ${BB.senal()}/8`;
    const t = BB.datos.textos.inicio_bitsy;
    BB.dialogo.hablar($('guia-txt'), BB.senal() === 0 && BB.progreso.encontrados.length === 0 ? [t[0], t[3], t[4]] : BB.al(t));
  },

  ingresar() {
    BB.codigo = [];
    pintarCasilleros();
    $('ingresar-msg').textContent = '\u00a0';
    $('ingresar-msg').className = 'mensaje';
    BB.dialogo.hablar($('ingresar-pista'), BB.datos.textos.ingresar_bitsy);
  },

  coleccion() {
    const g = $('col-grilla');
    g.innerHTML = '';
    const jugables = BB.datos.bitsies.filter((b) => b.jugable);
    jugables.forEach((b) => {
      const bloq = !BB.desbloqueado(b.id);
      const c = BB.carta(b.id, { bloqueada: bloq });
      c.onclick = () => {
        BB.audio.sonar('tecla');
        if (bloq) {
          const m = BB.datos.mundos.find((x) => (x.variantes || []).includes(b.id));
          $('ficha').innerHTML = `<p class="terminal">ARCHIVO BLOQUEADO</p><p>${m ? `Encontrá a Luca y Donna en la página ${m.pagina} (${m.nombre}).` : 'Vencé al Virus para recuperarlo.'}</p><button class="btn btn-primario" id="ficha-cerrar">CERRAR</button>`;
          $('modal').hidden = false;
          $('ficha-cerrar').onclick = () => { $('modal').hidden = true; };
        } else BB.mostrarFicha(b.id);
      };
      g.appendChild(c);
    });
    $('col-contador').textContent = `${jugables.filter((b) => BB.desbloqueado(b.id)).length}/${jugables.length}`;
  },

  mapa() {
    const m = $('mapa');
    m.innerHTML = '';
    // los mundos se juegan en orden: el primero está abierto y ganar uno abre el siguiente
    BB.datos.mundos.forEach((mu, i) => {
      const abierto = BB.mundoAbierto(i);
      const gan = BB.progreso.ganados.includes(mu.id);
      const b = document.createElement('button');
      b.className = 'mundo' + (abierto ? '' : ' bloqueado') + (gan ? ' ganado' : '');
      if (abierto) b.style.backgroundImage = `url(${mu.fondo})`;
      b.innerHTML = `<span class="carpeta">C:\\MUNDO_0${mu.pagina}</span>
        <span class="mnombre">${abierto ? mu.nombre : 'CARPETA BLOQUEADA'}</span>
        <span class="estado">${gan ? '✔ SEÑAL OK' : abierto ? '► PELEAR' : '✖ GANÁ EL MUNDO ANTERIOR'}</span>`;
      b.onclick = () => {
        if (!abierto) { BB.audio.sonar('error'); b.classList.add('temblor'); setTimeout(() => b.classList.remove('temblor'), 600); return; }
        BB.audio.sonar('elegir');
        BB.combate = { tipo: 'mundo', mundo: mu, rival: mu.equipo_rival, fondo: mu.fondo, titulo: mu.nombre };
        BB.ir('equipo');
      };
      m.appendChild(b);
    });
    const listo = BB.senal() >= 8 || BB.progreso.demo;
    const f = document.createElement('button');
    f.className = 'mundo final' + (listo ? '' : ' bloqueado');
    f.innerHTML = `<span class="carpeta">C:\\SISTEMA\\NUCLEO</span><span class="mnombre">${BB.progreso.virusVencido ? 'VIRUS VENCIDO' : 'NÚCLEO DEL VIRUS'}</span>
      <span class="estado">${listo ? '► BATALLA FINAL' : `✖ SEÑAL ${BB.senal()}/8`}</span>`;
    f.onclick = () => {
      if (!listo) { BB.audio.sonar('error'); $('modal').hidden = false; $('ficha').innerHTML = `<p>${BB.datos.textos.final_bloqueado}</p><button class="btn btn-primario" id="ficha-cerrar">OK</button>`; $('ficha-cerrar').onclick = () => { $('modal').hidden = true; }; return; }
      BB.audio.sonar('elegir');
      BB.combate = { tipo: 'final', rival: BB.datos.final.equipo_rival, fondo: BB.datos.final.fondo, titulo: BB.datos.final.nombre };
      BB.ir('equipo');
    };
    m.appendChild(f);
  },

  equipo() {
    if (!equipo.length) equipo = BB.progreso.ultimoEquipo.filter((id) => BB.desbloqueado(id)).slice(0, 4);
    $('equipo-volver').onclick = () => BB.ir(BB.combate.tipo === 'rapida' ? 'inicio' : 'mapa');
    $('equipo-rival-txt').textContent = 'RIVAL: ' + BB.combate.titulo;
    pintarEquipo();
  },

  ajustes() {
    $('btn-sonido').textContent = 'SONIDO: ' + (BB.progreso.sonido ? 'SÍ' : 'NO');
    $('ajustes-msg').textContent = '\u00a0';
    $('ajustes-creditos').textContent = BB.datos.textos.creditos;
    BB.confirmarBorrado = false;
    $('btn-borrar-partida').textContent = 'BORRAR PARTIDA';
  }
};

// ---------------- Ingresar señal ----------------

BB.codigo = [];
let errores = 0;

function pintarCasilleros() {
  const cs = $('casilleros').children;
  $('casilleros').classList.remove('ok');
  for (let i = 0; i < BB.LARGO_CODIGO; i++) {
    cs[i].textContent = BB.codigo[i] || '';
    cs[i].className = i === BB.codigo.length ? 'cursor' : '';
  }
}

BB.armarTeclado = function () {
  const t = $('teclado');
  BB.datos.simbolos.forEach((s) => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = s;
    b.setAttribute('aria-label', 'símbolo ' + s);
    b.onclick = () => {
      if (BB.codigo.length >= BB.LARGO_CODIGO) return;
      BB.audio.sonar('tecla');
      BB.codigo.push(s);
      pintarCasilleros();
    };
    t.appendChild(b);
  });
  $('btn-borrar').onclick = () => { BB.audio.sonar('tecla'); BB.codigo.pop(); pintarCasilleros(); };
  $('btn-ok').onclick = () => verificarCodigo();
};

function verificarCodigo() {
  const msg = $('ingresar-msg');
  if (BB.codigo.length < BB.LARGO_CODIGO) { BB.audio.sonar('error'); msg.className = 'mensaje error'; msg.textContent = 'FALTAN SÍMBOLOS'; return; }
  const cod = BB.codigo.join('');
  const T = BB.datos.textos;

  if (cod === BB.datos.maestro) {
    BB.datos.mundos.forEach((m) => {
      if (!BB.progreso.encontrados.includes(m.id)) BB.progreso.encontrados.push(m.id);
      (m.variantes || []).forEach((id) => { if (!BB.desbloqueado(id)) BB.progreso.desbloqueados.push(id); });
    });
    BB.progreso.demo = true; // también abre la batalla final
    BB.guardar();
    BB.audio.sonar('desbloqueo');
    msg.className = 'mensaje'; msg.textContent = T.maestro;
    $('casilleros').classList.add('ok');
    BB.codigo = [];
    return;
  }

  // cada Bitsy tiene su propio código de 3 símbolos
  let mundo = null, id = null;
  BB.datos.mundos.forEach((m) => Object.entries(m.codigos || {}).forEach(([b, c]) => { if (c === cod) { mundo = m; id = b; } }));
  if (!mundo) {
    errores++;
    BB.audio.sonar('error');
    msg.className = 'mensaje error';
    msg.textContent = T.error_codigo.replace('{n}', (errores % 9) + 1);
    BB.dialogo.hablar($('ingresar-pista'), BB.al(T.pistas_error));
    $('casilleros').classList.add('temblor');
    setTimeout(() => $('casilleros').classList.remove('temblor'), 600);
    BB.codigo = []; setTimeout(pintarCasilleros, 500);
    return;
  }
  if (BB.desbloqueado(id)) {
    BB.audio.sonar('error');
    msg.className = 'mensaje'; msg.textContent = T.codigo_repetido;
    BB.codigo = []; setTimeout(pintarCasilleros, 500);
    return;
  }
  if (!BB.progreso.encontrados.includes(mundo.id)) BB.progreso.encontrados.push(mundo.id);
  BB.progreso.desbloqueados.push(id);
  BB.guardar();
  $('casilleros').classList.add('ok');
  BB.audio.sonar('desbloqueo');
  msg.className = 'mensaje';
  msg.textContent = `¡${BB.datos.porId[id].nombre.toUpperCase()} DESBLOQUEADO!`;
  setTimeout(() => BB.mostrarFicha(id, { revelar: true, aviso: '¡NUEVA VERSIÓN!' }), 500);
  BB.codigo = [];
  setTimeout(pintarCasilleros, 900);
}

// ---------------- Elegir equipo ----------------
function pintarEquipo() {
  const slots = $('equipo-slots');
  slots.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const s = document.createElement('button');
    s.className = 'slot' + (equipo[i] ? ' lleno' : '');
    s.setAttribute('aria-label', equipo[i] ? 'Quitar ' + BB.datos.porId[equipo[i]].nombre : 'Lugar vacío');
    if (equipo[i]) s.innerHTML = BB.figura(equipo[i]) + '<span class="quitar" aria-hidden="true">✖</span>';
    s.onclick = () => { if (equipo[i]) { BB.audio.sonar('tecla'); equipo.splice(i, 1); pintarEquipo(); } };
    slots.appendChild(s);
  }
  const g = $('equipo-grilla');
  g.innerHTML = '';
  BB.datos.bitsies.filter((b) => b.jugable && BB.desbloqueado(b.id)).forEach((b) => {
    const n = equipo.filter((x) => x === b.id).length;
    const c = BB.carta(b.id, { badge: n ? (b.repetible ? '×' + n : '✔') : '' });
    if (n) c.classList.add('elegida');
    c.onclick = () => {
      BB.audio.sonar('tecla');
      const yaEsta = n && !b.repetible, lleno = equipo.length >= 4;
      BB.mostrarFicha(b.id, {
        accion: {
          texto: yaEsta ? 'YA ESTÁ EN EL EQUIPO' : lleno ? 'EQUIPO COMPLETO' : 'SUMAR AL EQUIPO',
          deshabilitado: yaEsta || lleno,
          fn: () => { BB.audio.sonar('elegir'); equipo.push(b.id); pintarEquipo(); }
        }
      });
    };
    g.appendChild(c);
  });
  $('btn-pelear').disabled = equipo.length !== 4;
}

BB.batallaRapida = function () {
  const pool = BB.datos.bitsies.filter((b) => b.jugable && (b.id !== 'virus' || BB.progreso.virusVencido)).map((b) => b.id);
  const rival = [];
  while (rival.length < 4 && pool.length) rival.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  const fondos = BB.datos.mundos.map((m) => m.fondo);
  BB.combate = { tipo: 'rapida', rival: rival.map((id) => ({ bitsy: id, infectado: true, nivel: 1 })), fondo: BB.al(fondos), titulo: 'BATALLA RÁPIDA' };
  BB.ir('equipo');
};

BB.empezarBatalla = async function () {
  BB.progreso.ultimoEquipo = equipo.slice();
  BB.guardar();
  // la Base repetida se numera: Bitsy Base 2, 3…
  const conteo = {};
  const jugador = equipo.map((id) => {
    conteo[id] = (conteo[id] || 0) + 1;
    const total = equipo.filter((x) => x === id).length;
    return { id, sufijo: total > 1 ? ' ' + conteo[id] : '' };
  });
  const combate = BB.combate;
  BB.ir('batalla');
  const b = new BB.Batalla({ jugador, rival: combate.rival, fondo: combate.fondo });
  BB.batallaActual = b;
  const res = await b.jugar();
  BB.batallaActual = null;
  mostrarResultado(res, combate);
};

function mostrarResultado(res, combate) {
  const T = BB.datos.textos;
  let nuevo = -1;
  let txt = '';
  if (res === 'victoria') {
    BB.audio.sonar('victoria');
    if (combate.tipo === 'mundo' && !BB.progreso.ganados.includes(combate.mundo.id)) {
      BB.progreso.ganados.push(combate.mundo.id);
      nuevo = BB.senal() - 1;
      const i = BB.datos.mundos.indexOf(combate.mundo);
      const sig = BB.datos.mundos[i + 1];
      txt = `Segmento de señal recuperado en ${combate.mundo.nombre}.` +
        (sig ? ` ¡Se abrió el ${sig.nombre}!` : '') +
        (BB.senal() >= 8 ? ' ¡La señal está completa! El núcleo del Virus está abierto.' : '');
    } else if (combate.tipo === 'final') {
      const primera = !BB.progreso.virusVencido;
      BB.progreso.virusVencido = true;
      if (!BB.desbloqueado('virus')) BB.progreso.desbloqueados.push('virus');
      BB.guardar();
      if (primera) { BB.mostrarSalida(); return; }
      txt = 'El Virus volvió a caer.';
    } else txt = combate.tipo === 'rapida' ? 'Buena pelea. Ese equipo funciona.' : 'Este mundo ya tenía su señal. Igual sirve para practicar.';
    BB.guardar();
  } else {
    BB.audio.sonar('derrota');
    txt = T.derrota_bitsy;
  }
  BB.ir('resultado');
  $('res-titulo').textContent = res === 'victoria' ? T.victoria : T.derrota;
  $('res-titulo').className = 'resultado-titulo' + (res === 'victoria' ? '' : ' perdio');
  BB.pintarSenal($('res-barra'), nuevo);
  $('res-senal').textContent = `SEÑAL ${BB.senal()}/8`;
  BB.dialogo.hablar($('res-txt'), txt);
  $('res-seguir').onclick = () => BB.ir(combate.tipo === 'rapida' ? 'inicio' : 'mapa');
  $('res-reintentar').onclick = () => { BB.combate = combate; BB.ir('equipo'); };
}

BB.armarEventos = function () {
  document.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => { BB.audio.sonar('tecla'); BB.ir(b.dataset.ir); }));
  document.querySelector('[data-accion="rapida"]').onclick = () => { BB.audio.sonar('tecla'); BB.batallaRapida(); };
  $('btn-pelear').onclick = () => { BB.audio.sonar('elegir'); BB.empezarBatalla(); };
  $('btn-sonido').onclick = () => { BB.audio.setSonido(!BB.progreso.sonido); BB.pantallas.ajustes(); actualizarMute(); BB.audio.sonar('tecla'); };
  $('btn-ver-intro').onclick = () => { BB.audio.sonar('tecla'); BB.mostrarIntro(); };
  $('btn-borrar-partida').onclick = () => {
    if (!BB.confirmarBorrado) { BB.confirmarBorrado = true; $('btn-borrar-partida').textContent = '¿SEGURO? TOCÁ DE NUEVO'; BB.audio.sonar('error'); return; }
    BB.borrarProgreso(); equipo = [];
    $('ajustes-msg').textContent = 'PARTIDA BORRADA';
    $('btn-borrar-partida').textContent = 'BORRAR PARTIDA';
    BB.confirmarBorrado = false;
  };
  $('mute').onclick = () => { BB.audio.setSonido(!BB.progreso.sonido); actualizarMute(); if ($('v-ajustes').classList.contains('activa')) BB.pantallas.ajustes(); };
  $('modal').onclick = (e) => { if (e.target === $('modal')) $('modal').hidden = true; };
  actualizarMute();
};

function actualizarMute() {
  $('mute').classList.toggle('off', !BB.progreso.sonido);
  $('mute').setAttribute('aria-label', BB.progreso.sonido ? 'Silenciar' : 'Activar sonido');
}
