import { uniq, col, toNum, minOf, maxOf, esc, nf, cat, gap } from '../util.js';

export const id = 'heat';
export const grupo = 'populares';
export const nombre = 'Mapa de calor';
export const uso = 'Dónde se concentra la intensidad';
export const año = '1873';
export const autor = 'Toussaint Loua';
export const curiosidad = 'Se suele citar como uno de los primeros ejemplos una tabla de estadísticas de los barrios de París, sombreada por Loua en 1873.';
export const columnas = [
  { nombre: 'Día', tipo: 'texto' },
  { nombre: 'Franja', tipo: 'texto' },
  { nombre: 'Consumo (kWh)', tipo: 'numero', editable: true }
];
export const filas = [];
['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach((d, i) => {
  ['Mañana', 'Tarde', 'Noche'].forEach((f, j) => {
    const base = [2.1, 2.6, 4.4][j] * (i >= 5 ? 1.25 : 1);
    filas.push([d, f, String(Math.round((base + ((i * 7 + j * 3) % 5) * .18) * 10) / 10)]);
  });
});
export const nota = 'Una fila por celda: fila, columna y valor.';

export function opt(rows, head, T) {
  const ys = uniq(col(rows, 0)), xs = uniq(col(rows, 1)), d = [];
  rows.forEach(r => { const v = toNum(r[2]); if (r[0] && r[1] && !isNaN(v)) d.push([xs.indexOf(r[1]), ys.indexOf(r[0]), v]); });
  if (!d.length) return null;
  const vs = d.map(p => p[2]);
  return {
    grid: { left: 8, right: 12, top: 12, bottom: 56, containLabel: true },
    tooltip: { trigger: 'item', formatter: p => esc(ys[p.value[1]]) + ' · ' + esc(xs[p.value[0]]) + '<br>' + nf.format(p.value[2]) },
    xAxis: cat(T, xs, { splitArea: { show: false } }), yAxis: cat(T, ys, { inverse: true }),
    visualMap: { min: minOf(vs), max: maxOf(vs), calculable: false, orient: 'horizontal', left: 'center', bottom: 4, itemWidth: 14, itemHeight: 150, inRange: { color: T.q }, textStyle: { color: T.ink2 } },
    series: [{ type: 'heatmap', data: d, itemStyle: gap(T), emphasis: { itemStyle: { borderColor: T.ink, borderWidth: 2 } } }]
  };
}
