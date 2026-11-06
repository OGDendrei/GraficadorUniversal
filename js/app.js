/* Aplicación: pestañas de grupos, galería de miniaturas, lámina del gráfico elegido,
   guardado en este navegador (localStorage) y repintado al cambiar datos, tamaño o tema. */
import { $, esc, msg, reduce, finalize, miniify } from './util.js';
import { leerTema, alCambiarTema } from './tema.js';
import { iniciarEditor } from './editor.js';
import { generarPNG, bajar } from './exportar.js';
import { GRAFICOS, GRUPOS } from './graficos/index.js';

const MAPA_MUNDO = 'vendor/world-echarts-4.9.0.js';
const CLAVE = id => 'gu1:' + id;   /* clave de localStorage de cada gráfico */

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

  /* ---------- estado: datos de cada gráfico ---------- */
  const ejemplo = c => ({ head: c.columnas.map(x => x.nombre), rows: c.filas.map(r => c.columnas.map((_, i) => r[i] == null ? '' : String(r[i]))) });
  const S = {};
  GRAFICOS.forEach(c => {
    let st = ejemplo(c);
    try {
      const sv = JSON.parse(localStorage.getItem(CLAVE(c.id)) || 'null');
      if (sv && Array.isArray(sv.head) && Array.isArray(sv.rows) && sv.head.length === c.columnas.length && sv.rows.length && sv.rows.every(Array.isArray)) st = { head: sv.head, rows: sv.rows };
    } catch (e) { /* datos guardados ilegibles: se usa el ejemplo */ }
    S[c.id] = st;
  });
  let curId = 'line', group = 'populares', galleryGroup = null;
  const save = id => { try { localStorage.setItem(CLAVE(id), JSON.stringify(S[id])); } catch (e) { /* sin almacenamiento: no se guarda */ } };

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
  const paintMain = () => paint($('canvas'), byId[curId], S[curId], leerTema(), false);
  const paintThumb = id => { const el = $('th-' + id); if (el) paint(el, byId[id], S[id], leerTema(), true); };

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
  function schedule() { clearTimeout(timer); const id = curId; timer = setTimeout(() => { save(id); paintMain(); paintThumb(id); }, 220); }

  const editor = iniciarEditor({
    actual: () => ({ def: byId[curId], estado: S[curId] }),
    alCambiar: schedule,
    alRestaurar: () => {
      S[curId] = ejemplo(byId[curId]);
      try { localStorage.removeItem(CLAVE(curId)); } catch (e) { /* nada que borrar */ }
      clearTimeout(timer); paintMain(); paintThumb(curId);
    }
  });

  function select(id, scroll) {
    curId = id; group = byId[id].grupo; $('png-estado').hidden = true;
    renderTabs(); renderGallery(); renderPlate(); editor.pintar(); paintMain();
    if (scroll) { try { $('plate').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } catch (e) { /* navegador antiguo */ } }
  }

  /* ---------- descargar PNG ----------
     En móvil la imagen se dibuja con al menos 640 px de ancho para que no salgan etiquetas cortadas. */
  $('png').onclick = async () => {
    const b = $('png'), estado = $('png-estado'), c = byId[curId], s = S[curId], T = leerTema(), cv = $('canvas');
    b.disabled = true; b.textContent = 'Generando…'; estado.hidden = true;
    try {
      bajar(await generarPNG({ def: c, T, ancho: Math.max(cv.clientWidth, 640), alto: Math.max(cv.clientHeight, 420), dibujar: el => paint(el, c, s, T, false, true) }));
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
