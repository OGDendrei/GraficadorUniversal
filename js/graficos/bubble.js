import { toNum, maxOf, esc, nf, val } from '../util.js';

export const id = 'bubble';
export const grupo = 'vistosos';
export const nombre = 'Burbujas';
export const uso = 'Tres medidas en un solo gráfico';
export const año = '2006';
export const autor = 'Hans Rosling';
export const curiosidad = 'Rosling los hizo famosos con Gapminder: burbujas que se movían para explicar la salud y la riqueza de los países.';
export const columnas = [
  { nombre: 'Tienda', tipo: 'texto' },
  { nombre: 'Visitas/día', tipo: 'numero', editable: true },
  { nombre: 'Ticket medio (€)', tipo: 'numero', editable: true },
  { nombre: 'Ventas (€)', tipo: 'numero', editable: true }
];
export const filas = [['Centro', 320, 18, 5760], ['Barrio', 140, 22, 3080], ['Online', 410, 31, 12710], ['Mercadillo', 95, 9, 855], ['Outlet', 210, 15, 3150], ['Quiosco', 60, 5, 300]];
export const nota = 'Posición: columnas 2 y 3. Tamaño: columna 4.';

export function opt(rows, head, T, mini) {
  const p = rows.map(r => ({ n: r[0], x: toNum(r[1]), y: toNum(r[2]), s: toNum(r[3]) })).filter(q => !isNaN(q.x) && !isNaN(q.y) && q.s > 0);
  if (!p.length) return null;
  const mx = maxOf(p.map(q => q.s)), k = mini ? .5 : 1;
  return {
    grid: { left: 8, right: 24, top: 24, bottom: 30, containLabel: true },
    tooltip: { trigger: 'item', formatter: q => esc(q.value[3]) + '<br>' + esc(head[1]) + ': ' + nf.format(q.value[0]) + '<br>' + esc(head[2]) + ': ' + nf.format(q.value[1]) + '<br>' + esc(head[3]) + ': ' + nf.format(q.value[2]) },
    xAxis: val(T, { scale: true, name: head[1], nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: T.ink2 }, splitLine: { show: false }, axisLine: { show: true, lineStyle: { color: T.axis } } }),
    yAxis: val(T, { scale: true, name: head[2], nameTextStyle: { color: T.ink2, align: 'left' } }),
    series: [{
      type: 'scatter', symbolSize: d => k * (8 + 44 * Math.sqrt(d[2] / mx)),
      data: p.map((q, i) => ({ value: [q.x, q.y, q.s, q.n], itemStyle: { color: T.series[i % 8], opacity: .78, borderColor: T.surface, borderWidth: 2 } })),
      label: { show: true, formatter: q => q.value[3], position: 'top', color: T.ink2, fontSize: 11 }
    }]
  };
}
