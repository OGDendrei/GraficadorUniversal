import { sers, col, toNum, esc, nf, legendB } from '../util.js';

export const id = 'stream';
export const grupo = 'vistosos';
export const nombre = 'Streamgraph';
export const uso = 'Series que fluyen como un río';
export const año = '2008';
export const autor = 'Lee Byron y Martin Wattenberg';
export const curiosidad = 'Se hizo famoso con un gráfico del New York Times sobre la taquilla del cine. La anchura de cada corriente es su valor.';
export const columnas = [
  { nombre: 'Mes', tipo: 'texto' },
  { nombre: 'Pop', tipo: 'numero', editable: true },
  { nombre: 'Rock', tipo: 'numero', editable: true },
  { nombre: 'Electrónica', tipo: 'numero', editable: true }
];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const filas = MESES.map((m, i) => [m, String(Math.round(40 + 22 * Math.sin(i / 1.8))), String(Math.round(34 + 14 * Math.cos(i / 2.4))), String(Math.round(18 + 16 * Math.sin(i / 1.3 + 2)))]);
export const nota = 'Cada columna de valores es una corriente.';

export function opt(rows, head, T) {
  const ss = sers(rows, head, 1); if (!ss.length || rows.length < 2) return null;
  const neg = rows.findIndex(r => ss.some(c => toNum(r[c]) < 0));
  if (neg >= 0) return { aviso: 'El streamgraph no admite números negativos (fila ' + (neg + 1) + '). Cada corriente es una cantidad: usa 0 o más.' };
  const labels = col(rows, 0), d = [];
  rows.forEach((r, i) => { ss.forEach(c => { const v = toNum(r[c]); d.push([i, isNaN(v) ? 0 : v, head[c]]); }); });
  return {
    legend: Object.assign(legendB(T), { data: ss.map(c => head[c]) }),
    tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: T.axis } }, formatter: ps => { const a = [].concat(ps); return esc(labels[Math.round(a[0].value[0])] || '') + '<br>' + a.map(p => p.marker + esc(p.value[2]) + ': ' + nf.format(p.value[1])).join('<br>'); } },
    singleAxis: { type: 'value', min: 0, max: rows.length - 1, top: 48, bottom: 30, left: 16, right: 16, minInterval: 1, axisLabel: { color: T.muted, formatter: v => Number.isInteger(v) ? (labels[v] || '') : '' }, axisLine: { lineStyle: { color: T.axis } }, axisTick: { show: false }, splitLine: { show: false } },
    series: [{ type: 'themeRiver', data: d, label: { show: false }, emphasis: { focus: 'series' } }]
  };
}
