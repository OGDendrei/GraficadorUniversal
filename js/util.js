/* Utilidades compartidas: números, fechas, datos de ejemplo y piezas comunes de ECharts y d3.
   ECharts y d3 se cargan como scripts clásicos desde vendor/ y están en window.echarts y window.d3. */

export const FONT = 'system-ui,-apple-system,"Segoe UI",sans-serif';
export const nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
export const $ = id => document.getElementById(id);
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- números y fechas ---------- */
export function toNum(s) {
  if (s == null || s === '') return NaN;
  let t = String(s).replace(/\s|€|%|°[CcFf]?/g, '');
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d+,\d+$/.test(t)) t = t.replace(',', '.');
  return /^-?\d*\.?\d+(e-?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
}
export function normDate(s) {
  s = String(s).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return null;
}

/* ---------- generadores de datos de ejemplo (deterministas) ---------- */
export function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
/* Filas «grupo, valor» con n medidas por grupo. groups: [[nombre, media, desviación], ...] */
export function genLong(groups, n, seed) {
  const r = mulberry(seed), rows = [];
  groups.forEach(g => { for (let i = 0; i < n; i++) rows.push([g[0], String(Math.round((g[1] + gauss(r) * g[2]) * 10) / 10)]); });
  return rows;
}

/* ---------- columnas y series ---------- */
export const col = (rows, i) => rows.map(r => r[i] == null ? '' : String(r[i]));
export const ncol = (rows, i) => rows.map(r => { const v = toNum(r[i]); return isNaN(v) ? null : v; });
/* Índices de las columnas (desde «from») que tienen al menos un número. */
export const sers = (rows, head, from) => { const o = []; for (let c = from; c < head.length; c++) { if (rows.some(r => !isNaN(toNum(r[c])))) o.push(c); } return o; };
export const uniq = a => Array.from(new Set(a.filter(x => x !== '' && x != null)));
/* Color de texto legible encima del color de serie k. */
export const onFill = k => k % 8 === 3 ? '#0b0b0b' : '#ffffff';
export const maxOf = a => { let m = -Infinity; a.forEach(v => { if (v > m) m = v; }); return m; };
export const minOf = a => { let m = Infinity; a.forEach(v => { if (v < m) m = v; }); return m; };

/* ---------- DOM ---------- */
export function msg(el, t) { el.innerHTML = '<div class="msg">' + esc(t) + '</div>'; }
export function sz(el) { return { W: el.clientWidth || 600, H: el.clientHeight || 340 }; }
export function mkSvg(el, W, H) {
  el.innerHTML = '';
  return d3.select(el).append('svg').attr('width', W).attr('height', H).attr('viewBox', '0 0 ' + W + ' ' + H).style('display', 'block').style('font-family', FONT);
}

/* ---------- piezas comunes de ECharts ---------- */
export const gap = T => ({ borderColor: T.surface, borderWidth: 2 });
export const legendB = T => ({ top: 0, left: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 12, itemGap: 16, textStyle: { color: T.ink2, fontSize: 13 } });
export const gridB = m => ({ left: 8, right: 18, top: m ? 42 : 18, bottom: 8, containLabel: true });
export const cat = (T, data, ex) => Object.assign({ type: 'category', data, axisLine: { lineStyle: { color: T.axis } }, axisTick: { show: false }, axisLabel: { color: T.muted, hideOverlap: true } }, ex || {});
export const val = (T, ex) => Object.assign({ type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: T.grid } }, axisLabel: { color: T.muted, formatter: v => nf.format(v) } }, ex || {});

/* Añade a la opción de un gráfico el estilo común (fuente, colores, tooltip). */
export function finalize(o, T) {
  return Object.assign({ animation: !reduce, animationDuration: 400, color: T.series, textStyle: { fontFamily: FONT, color: T.ink2 } }, o, {
    tooltip: Object.assign({
      backgroundColor: T.surface, borderColor: T.grid, borderWidth: 1, padding: [8, 10], textStyle: { color: T.ink, fontFamily: FONT, fontSize: 13 },
      extraCssText: 'box-shadow:0 2px 8px rgba(0,0,0,.12);border-radius:6px;',
      valueFormatter: v => typeof v === 'number' ? nf.format(v) : (v == null ? '–' : v)
    }, o.tooltip || {})
  });
}

/* Versión reducida de una opción para las miniaturas: sin textos, ejes ni leyendas. */
export function miniify(o) {
  const q = Object.assign({}, o, { animation: false, tooltip: { show: false }, legend: { show: false }, title: { show: false } });
  if (q.visualMap) q.visualMap = [].concat(q.visualMap).map(v => Object.assign({}, v, { show: false }));
  if (q.grid) q.grid = { left: 3, right: 3, top: 3, bottom: 3, containLabel: false };
  ['xAxis', 'yAxis'].forEach(k => { if (q[k]) q[k] = [].concat(q[k]).map(a => Object.assign({}, a, { name: '', axisLabel: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLine: { show: false } })); });
  if (q.radar) q.radar = Object.assign({}, q.radar, { axisName: { show: false }, radius: '78%', center: ['50%', '50%'] });
  if (q.singleAxis) q.singleAxis = Object.assign({}, q.singleAxis, { axisLabel: { show: false }, axisLine: { show: false }, top: 4, bottom: 4, left: 4, right: 4 });
  if (q.parallel) { q.parallel = Object.assign({}, q.parallel, { left: 6, right: 6, top: 6, bottom: 6 }); q.parallelAxis = q.parallelAxis.map(a => Object.assign({}, a, { name: '', axisLabel: { show: false } })); }
  if (q.calendar) q.calendar = Object.assign({}, q.calendar, { left: 2, right: 2, top: 2, bottom: 2, dayLabel: { show: false }, monthLabel: { show: false }, yearLabel: { show: false } });
  q.series = (q.series || []).map(s => {
    const t = Object.assign({}, s, { label: { show: false }, markLine: undefined });
    if (s.type === 'pie') { t.radius = (s.radius[0] === '0%') ? ['0%', '88%'] : ['45%', '88%']; t.center = ['50%', '50%']; t.labelLine = { show: false }; }
    if (s.type === 'sankey') { t.left = 2; t.right = 2; t.top = 2; t.bottom = 2; }
    if (s.type === 'treemap') { t.left = 0; t.right = 0; t.top = 0; t.bottom = 0; t.upperLabel = { show: false }; t.levels = (s.levels || []).map(l => Object.assign({}, l, { upperLabel: { show: false }, label: { show: false } })); }
    if (s.type === 'sunburst') { t.radius = [0, '92%']; t.levels = (s.levels || []).map(l => Object.assign({}, l, { label: { show: false } })); }
    return t;
  });
  return q;
}

/* ---------- fábricas compartidas por varios gráficos ---------- */
/* Gráficos de ejes: 'bar', 'barh', 'stack', 'line' o 'area'. La columna 0 es la categoría. */
export function axisOpt(kind) {
  return function (rows, head, T) {
    const ss = sers(rows, head, 1); if (!ss.length) return null;
    const x = col(rows, 0), multi = ss.length > 1, g = gap(T), h = kind === 'barh';
    const o = { grid: gridB(multi), legend: multi ? legendB(T) : { show: false } };
    if (kind === 'bar' || kind === 'barh' || kind === 'stack') {
      o.tooltip = { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: T.grid, opacity: .45 } } };
      o.xAxis = h ? val(T) : cat(T, x); o.yAxis = h ? cat(T, x, { inverse: true }) : val(T);
      o.series = ss.map((c, k) => {
        const last = k === ss.length - 1;
        const rad = kind === 'stack' ? (last ? (h ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0) : (h ? [0, 4, 4, 0] : [4, 4, 0, 0]);
        return { name: head[c], type: 'bar', data: ncol(rows, c), barMaxWidth: 28, stack: kind === 'stack' ? 't' : undefined, itemStyle: Object.assign({ borderRadius: rad }, g), emphasis: { focus: 'series' } };
      });
    } else {
      o.tooltip = { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: T.axis } } };
      o.xAxis = cat(T, x, { boundaryGap: false }); o.yAxis = val(T);
      o.series = ss.map(c => ({ name: head[c], type: 'line', data: ncol(rows, c), showSymbol: x.length <= 40, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2 }, itemStyle: g, areaStyle: kind === 'area' ? { opacity: .16 } : undefined, emphasis: { focus: 'series' } }));
    }
    return o;
  };
}

/* Sectores y anillo. Con más de 8 categorías, las pequeñas se agrupan en «Otros». */
export function pieOpt(donut) {
  return function (rows, head, T) {
    let items = rows.map(r => ({ name: r[0] || '(vacío)', value: toNum(r[1]) })).filter(d => d.value > 0);
    if (!items.length) return null;
    if (items.length > 8) { items.sort((a, b) => b.value - a.value); const rest = items.slice(7).reduce((s, d) => s + d.value, 0); items = items.slice(0, 7).concat([{ name: 'Otros', value: rest, other: true }]); }
    const total = items.reduce((s, d) => s + d.value, 0);
    items.forEach((d, k) => { d.itemStyle = { color: d.other ? T.muted : T.series[k], borderColor: T.surface, borderWidth: 2, borderRadius: donut ? 4 : 0 }; });
    const o = {
      legend: { bottom: 0, left: 'center', type: 'scroll', icon: 'roundRect', itemWidth: 12, itemHeight: 12, itemGap: 14, textStyle: { color: T.ink2, fontSize: 13 } },
      tooltip: { trigger: 'item', formatter: p => esc(p.name) + ': ' + nf.format(p.value) + ' (' + nf.format(p.percent) + ' %)' },
      series: [{ type: 'pie', radius: donut ? ['48%', '70%'] : ['0%', '70%'], center: ['50%', '44%'], data: items, label: { color: T.ink2, formatter: '{d}%' }, labelLine: { lineStyle: { color: T.axis } }, emphasis: { scaleSize: 4 } }]
    };
    if (donut) o.title = { text: nf.format(total), subtext: head[1] || '', left: 'center', top: '39%', itemGap: 2, textStyle: { color: T.ink, fontSize: 24, fontWeight: 600, fontFamily: FONT }, subtextStyle: { color: T.ink2, fontSize: 12, fontFamily: FONT } };
    return o;
  };
}

/* Filas «grupo, elemento, valor» → árbol para treemap y sunburst. */
export function tree(rows) {
  const m = new Map();
  rows.forEach(r => { const v = toNum(r[2]); if (!r[0] || !r[1] || !(v > 0)) return; if (!m.has(r[0])) m.set(r[0], []); m.get(r[0]).push({ name: r[1], value: v }); });
  return Array.from(m.entries()).map(e => ({ name: e[0], children: e[1] }));
}

/* Estimación de densidad (núcleo gaussiano) para violín y ridgeline. */
export function kde(v, h, a, b, n) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n; let s = 0; for (let j = 0; j < v.length; j++) s += Math.exp(-.5 * Math.pow((t - v[j]) / h, 2)); out.push([t, s / (v.length * h * Math.sqrt(2 * Math.PI))]); }
  return out;
}
export function bw(v) { const sd = d3.deviation(v) || 1; return Math.max(1.06 * sd * Math.pow(v.length, -.2), 1e-6); }
/* Filas «grupo, valor» → [{n: grupo, v: valores ordenados}], solo grupos con 2 o más valores. */
export function groupsOf(rows) {
  return uniq(rows.map(r => r[0])).map(n => ({ n, v: rows.filter(r => r[0] === n).map(r => toNum(r[1])).filter(x => !isNaN(x)).sort((a, b) => a - b) })).filter(g => g.v.length >= 2);
}
export function parseSeries(s) { s = String(s || '').trim(); const parts = /[\s;]/.test(s) ? s.split(/[\s;]+/) : s.split(','); return parts.map(toNum).filter(v => !isNaN(v)); }

const ALIAS = { 'españa': 'Spain', 'francia': 'France', 'alemania': 'Germany', 'italia': 'Italy', 'portugal': 'Portugal', 'reino unido': 'United Kingdom', 'estados unidos': 'United States', 'eeuu': 'United States', 'ee.uu.': 'United States', 'méxico': 'Mexico', 'brasil': 'Brazil', 'argentina': 'Argentina', 'chile': 'Chile', 'colombia': 'Colombia', 'perú': 'Peru', 'venezuela': 'Venezuela', 'canadá': 'Canada', 'rusia': 'Russia', 'china': 'China', 'japón': 'Japan', 'india': 'India', 'australia': 'Australia', 'marruecos': 'Morocco', 'egipto': 'Egypt', 'sudáfrica': 'South Africa', 'turquía': 'Turkey', 'grecia': 'Greece', 'suecia': 'Sweden', 'noruega': 'Norway', 'finlandia': 'Finland', 'polonia': 'Poland', 'países bajos': 'Netherlands', 'holanda': 'Netherlands', 'bélgica': 'Belgium', 'suiza': 'Switzerland', 'austria': 'Austria', 'irlanda': 'Ireland', 'argelia': 'Algeria', 'arabia saudí': 'Saudi Arabia', 'corea del sur': 'South Korea', 'ucrania': 'Ukraine', 'dinamarca': 'Denmark' };
/* Nombre de país en español → nombre que usa el mapa del mundo. */
export const alias = n => { const k = String(n).trim().toLowerCase(); return ALIAS[k] || String(n).trim(); };
