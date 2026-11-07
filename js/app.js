/* Aplicación: pestañas de grupos, galería de miniaturas, lámina del gráfico elegido,
   guardado en este navegador (localStorage) y repintado al cambiar datos, tamaño o tema. */
import { $, esc, msg, reduce, finalize, miniify } from './util.js';
import { leerTema, alCambiarTema } from './tema.js';
import { iniciarEditor } from './editor.js';
import { generarPNG, bajar } from './exportar.js';
import { cargar, guardar, juegoEjemplo, juegoVacio, errorNombre, nombreCopia } from './almacen.js';
import { GRAFICOS, GRUPOS } from './graficos/index.js';

const MAPA_MUNDO = 'vendor/world-echarts-4.9.0.js';

/* Sin librerías no se puede dibujar nada: se avisa y se para. */
const faltan = [!window.echarts && 'ECharts (vendor/echarts-5.5.1.min.js)', !window.d3 && 'd3 (vendor/d3-7.8.5.min.js)'].filter(Boolean);
if (faltan.length) {
  msg($('canvas'), 'No se han podido cargar las librerías de gráficos: ' + faltan.join(' y ') + '. Comprueba que la carpeta vendor/ está completa y vuelve a abrir la página.');
} else {
  arrancar();
}

function arrancar() {
  const byId = {};
  GRAFICOS.forEach(c => { byId[c.id] = c; });
  let mapaFallo = '';   /* motivo si el mapa del mundo no se pudo cargar */

  /* ---------- avisos generales (datos dañados, almacenamiento lleno…) ---------- */
  const avisos = new Set();
  function avisar(t) {
    if (!t || avisos.has(t)) return;
    avisos.add(t);
    $('avisos-lista').innerHTML = [...avisos].map(a => '<li>' + esc(a) + '</li>').join('');
    $('avisos').hidden = false;
  }
  $('avisos-cerrar').onclick = () => { avisos.clear(); $('avisos').hidden = true; };

  /* ---------- estado: juegos de datos de cada gráfico ----------
     R[id] = { juegos: [{ nombre, head, rows }], activo: índice }. Se dibuja siempre el juego activo. */
  const R = {};
  GRAFICOS.forEach(c => {
    let r;
    try { const x = cargar(c); r = x.registro; x.avisos.forEach(avisar); }
    catch (e) { r = { juegos: [juegoEjemplo(c)], activo: 0 }; avisar('No se han podido leer los datos guardados de «' + c.nombre + '» [' + e.message + ']. Se muestran los de ejemplo.'); }
    R[c.id] = r;
  });
  const activo = id => R[id].juegos[R[id].activo];
  let curId = 'line', group = 'populares', galleryGroup = null;
  const save = id => avisar(guardar(id, R[id]));

  /* ---------- pintar un gráfico en un elemento ----------
     opt() puede devolver: null (faltan datos), { aviso: 'texto' } (datos no válidos para este gráfico)
     o { pending: true } (el mapa del mundo aún no ha llegado). */
  function paint(el, c, s, T, mini, sinAnimacion) {
    const old = window.echarts && echarts.getInstanceByDom(el); if (old) old.dispose();
    el.innerHTML = ''; el.removeAttribute('title');
    try {
      const rows = s.rows.filter(r => r.some(x => String(x == null ? '' : x).trim() !== ''));
      if (c.opt) {
        const o = c.opt(rows, s.head, T, mini);
        if (!o) { msg(el, 'Faltan datos para dibujar este gráfico.'); return; }
        if (o.aviso) { msg(el, o.aviso); return; }
        if (o.pending) { msg(el, mapaFallo ? 'No se ha podido cargar el mapa del mundo.' + (mini ? '' : ' [' + mapaFallo + ']') : 'Cargando el mapa…'); return; }
        const io = { renderer: 'svg' };
        if (!el.clientWidth) io.width = el.id === 'canvas' ? 600 : 160;
        if (!el.clientHeight) io.height = el.id === 'canvas' ? 340 : 92;
        const inst = echarts.init(el, null, io);
        const fo = finalize(o, T);
        if (sinAnimacion) fo.animation = false;
        inst.setOption(mini ? miniify(fo) : fo, true);
      } else {
        c.draw(el, rows, s.head, T, mini);
      }
    } catch (e) {
      /* El motivo técnico va en el mensaje de la lámina y, en las miniaturas, al pasar el ratón. */
      const motivo = c.id + ': ' + String((e && e.message) || e).slice(0, 120);
      const old2 = window.echarts && echarts.getInstanceByDom(el); if (old2) old2.dispose();
      msg(el, 'No se ha podido dibujar con estos datos.' + (mini ? '' : ' [' + motivo + ']'));
      if (mini) el.title = motivo;
      if (window.console) console.warn(c.id, e);
    }
  }
  const paintMain = () => paint($('canvas'), byId[curId], activo(curId), leerTema(), false);
  const paintThumb = id => { const el = $('th-' + id); if (el) paint(el, byId[id], activo(id), leerTema(), true); };

  /* ---------- partes de la página ---------- */
  function renderTabs() {
    $('tabs').innerHTML = GRUPOS.map(g => '<button type="button" class="tab" data-g="' + g.id + '" aria-pressed="' + (g.id === group) + '"><b>' + g.nombre + '</b><span>' + g.sub + '</span></button>').join('');
  }
  function renderGallery() {
    const delGrupo = GRAFICOS.filter(c => c.grupo === group);
    if (galleryGroup !== group) {
      galleryGroup = group;
      $('tiles').innerHTML = delGrupo.map(c => '<button type="button" class="tile" data-id="' + c.id + '" aria-pressed="' + (c.id === curId) + '"><div class="thumb" id="th-' + c.id + '"></div><span class="tn">' + esc(c.nombre) + '</span></button>').join('');
      delGrupo.forEach(c => paintThumb(c.id));
    } else {
      Array.prototype.forEach.call($('tiles').children, b => { b.setAttribute('aria-pressed', b.dataset.id === curId); });
    }
  }
  function renderPlate() {
    const c = byId[curId], gn = GRUPOS.find(g => g.id === c.grupo).nombre;
    $('top').innerHTML = '<div><p class="eyebrow">' + gn + '</p><h2>' + esc(c.nombre) + '</h2><p class="use">' + esc(c.uso) + '</p></div>'
      + ((c.año || c.autor) ? '<div class="yr">' + (c.año ? '<span class="y">' + esc(c.año) + '</span>' : '') + (c.autor ? '<span class="w">' + esc(c.autor) + '</span>' : '') + '</div>' : '');
    $('fact').innerHTML = '<b>Curiosidad.</b> ' + esc(c.curiosidad);
    $('note').textContent = c.nota || '';
  }

  let timer;
  let pendiente = null;   /* gráfico con cambios aún sin guardar */
  function schedule() { clearTimeout(timer); const id = pendiente = curId; timer = setTimeout(() => { pendiente = null; save(id); paintMain(); paintThumb(id); }, 220); }
  /* Guarda ya lo pendiente (antes de cambiar de juego, por ejemplo). */
  function flush() { clearTimeout(timer); if (pendiente) { const id = pendiente; pendiente = null; save(id); paintThumb(id); } }

  const editor = iniciarEditor({
    actual: () => ({ def: byId[curId], estado: activo(curId) }),
    alCambiar: schedule,
    alRestaurar: () => {
      const j = activo(curId);
      if (!confirm('¿Restaurar los datos de ejemplo en el juego «' + j.nombre + '»? Se perderán los cambios de ese juego.')) return;
      flush();
      const e = juegoEjemplo(byId[curId], j.nombre);
      j.head = e.head; j.rows = e.rows;
      save(curId); paintMain(); paintThumb(curId);
    }
  });

  /* ---------- juegos de datos: selector, Nuevo, Duplicar, Renombrar y Borrar ---------- */
  function renderJuegos() {
    const r = R[curId];
    $('juego').innerHTML = r.juegos.map((j, i) => '<option value="' + i + '"' + (i === r.activo ? ' selected' : '') + '>' + esc(j.nombre) + '</option>').join('');
    $('j-borrar').disabled = r.juegos.length < 2;
    $('j-borrar').title = r.juegos.length < 2 ? 'No se puede borrar el único juego que queda' : '';
  }
  /* Tras cambiar de juego: guardar, y repintar selector, tabla, lámina y miniatura. */
  function juegoCambiado() { save(curId); cerrarForm(); renderJuegos(); editor.pintar(); paintMain(); paintThumb(curId); }

  $('juego').addEventListener('change', e => { flush(); R[curId].activo = +e.target.value; juegoCambiado(); });

  let modo = null;   /* 'nuevo' | 'duplicar' | 'renombrar' mientras el formulario de nombre está abierto */
  function abrirForm(m, titulo, valor) {
    flush(); modo = m;
    $('j-titulo').textContent = titulo;
    $('j-nombre').value = valor;
    $('j-error').hidden = true;
    $('j-form').hidden = false;
    $('j-nombre').focus(); $('j-nombre').select();
  }
  function cerrarForm() { modo = null; $('j-form').hidden = true; $('j-error').hidden = true; }
  $('j-nuevo').onclick = () => abrirForm('nuevo', 'Nombre del juego nuevo (vacío, con las columnas de este gráfico)', '');
  $('j-duplicar').onclick = () => abrirForm('duplicar', 'Nombre de la copia de «' + activo(curId).nombre + '»', nombreCopia(R[curId], activo(curId).nombre));
  $('j-renombrar').onclick = () => abrirForm('renombrar', 'Nuevo nombre para «' + activo(curId).nombre + '»', activo(curId).nombre);
  $('j-cancelar').onclick = cerrarForm;
  $('j-form').addEventListener('keydown', e => { if (e.key === 'Escape') cerrarForm(); });
  $('j-form').addEventListener('submit', e => {
    e.preventDefault();
    const r = R[curId], nombre = $('j-nombre').value.trim();
    const error = errorNombre(r, nombre, modo === 'renombrar' ? r.activo : -1);
    if (error) { $('j-error').textContent = error; $('j-error').hidden = false; $('j-nombre').focus(); return; }
    const a = activo(curId);
    if (modo === 'renombrar') a.nombre = nombre;
    else {
      r.juegos.push(modo === 'nuevo' ? juegoVacio(byId[curId], nombre) : { nombre, head: a.head.slice(), rows: a.rows.map(f => f.slice()) });
      r.activo = r.juegos.length - 1;
    }
    juegoCambiado();
  });
  $('j-borrar').onclick = () => {
    const r = R[curId];
    if (r.juegos.length < 2) return;
    if (!confirm('¿Borrar el juego «' + activo(curId).nombre + '»? Esta acción no se puede deshacer.')) return;
    flush();
    r.juegos.splice(r.activo, 1);
    r.activo = Math.max(0, r.activo - 1);
    juegoCambiado();
  };

  function select(id, scroll) {
    curId = id; group = byId[id].grupo; $('png-estado').hidden = true;
    flush(); cerrarForm(); renderTabs(); renderGallery(); renderPlate(); renderJuegos(); editor.pintar(); paintMain();
    if (scroll) { try { $('plate').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } catch (e) { /* navegador antiguo */ } }
  }

  /* ---------- descargar PNG ----------
     En móvil la imagen se dibuja con al menos 640 px de ancho para que no salgan etiquetas cortadas. */
  $('png').onclick = async () => {
    const b = $('png'), estado = $('png-estado'), c = byId[curId], s = activo(curId), T = leerTema(), cv = $('canvas');
    b.disabled = true; b.textContent = 'Generando…'; estado.hidden = true;
    try {
      bajar(await generarPNG({ def: c, T, juego: s.nombre, ancho: Math.max(cv.clientWidth, 640), alto: Math.max(cv.clientHeight, 420), dibujar: el => paint(el, c, s, T, false, true) }));
    } catch (e) {
      estado.textContent = 'No se ha podido crear la imagen. [' + c.id + ': ' + String((e && e.message) || e).slice(0, 160) + ']';
      estado.hidden = false;
      if (window.console) console.warn('png', e);
    } finally { b.disabled = false; b.textContent = 'Descargar PNG'; }
  };

  /* ---------- eventos ---------- */
  $('tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const gid = b.dataset.g; if (gid === group) return;
    select(GRAFICOS.find(c => c.grupo === gid).id, false);
  });
  $('tiles').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) select(b.dataset.id, true); });

  /* Repintar al cambiar el ancho de la lámina (girar el móvil, redimensionar la ventana). */
  let lastW = 0, rt;
  if (window.ResizeObserver) new ResizeObserver(() => { const w = $('canvas').clientWidth; if (w === lastW) return; lastW = w; clearTimeout(rt); rt = setTimeout(paintMain, 150); }).observe($('canvas'));
  alCambiarTema(() => { paintMain(); if (galleryGroup) GRAFICOS.filter(c => c.grupo === galleryGroup).forEach(c => paintThumb(c.id)); });

  /* Mapa del mundo (para el coroplético): pesa bastante, se carga aparte y se repinta al llegar. */
  const refreshMaps = () => { if (curId === 'choro') paintMain(); if (galleryGroup === 'vistosos') paintThumb('choro'); };
  const ms = document.createElement('script');
  ms.src = MAPA_MUNDO;
  ms.onload = () => { if (!echarts.getMap('world')) mapaFallo = MAPA_MUNDO + ' no registró el mapa «world»'; refreshMaps(); };
  ms.onerror = () => { mapaFallo = 'no se encontró ' + MAPA_MUNDO; refreshMaps(); };
  document.head.appendChild(ms);

  select('line', false);
}
