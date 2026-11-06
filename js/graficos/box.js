import { genLong, groupsOf, minOf, maxOf, esc, nf, gridB, cat, val, gap } from '../util.js';

export const id = 'box';
export const grupo = 'populares';
export const nombre = 'Cajas (boxplot)';
export const uso = 'Mediana y dispersión de cada grupo';
export const año = '1977';
export const autor = 'John Tukey';
export const curiosidad = 'Tukey lo popularizó en su libro Exploratory Data Analysis. La caja guarda la mitad central de los datos y los puntos sueltos son valores atípicos.';
export const columnas = [
  { nombre: 'Grupo', tipo: 'texto' },
  { nombre: 'Nota', tipo: 'numero', editable: true }
];
export const filas = genLong([['Grupo A', 6.5, 1.2], ['Grupo B', 7.2, 0.9], ['Grupo C', 5.8, 1.8]], 10, 3);
export const nota = 'Una fila por medición: el grupo y su valor.';

export function opt(rows, head, T) {
  const gs = groupsOf(rows); if (!gs.length) return null;
  const stats = [], out = [];
  gs.forEach((g, gi) => {
    const q1 = d3.quantileSorted(g.v, .25), md = d3.quantileSorted(g.v, .5), q3 = d3.quantileSorted(g.v, .75), iq = q3 - q1;
    /* Bigotes hasta 1,5 veces el rango intercuartílico; lo de fuera son atípicos. */
    const lo = minOf(g.v.filter(x => x >= q1 - 1.5 * iq)), hi = maxOf(g.v.filter(x => x <= q3 + 1.5 * iq));
    stats.push([lo, q1, md, q3, hi]);
    g.v.forEach(x => { if (x < lo || x > hi) out.push([gi, x]); });
  });
  return {
    grid: gridB(false),
    tooltip: {
      trigger: 'item', formatter: p => {
        if (p.seriesType === 'boxplot') { const d = p.data.length === 6 ? p.data.slice(1) : p.data; return esc(p.name) + '<br>Máx: ' + nf.format(d[4]) + '<br>Q3: ' + nf.format(d[3]) + '<br>Mediana: ' + nf.format(d[2]) + '<br>Q1: ' + nf.format(d[1]) + '<br>Mín: ' + nf.format(d[0]); }
        return 'Atípico: ' + nf.format(p.value[1]);
      }
    },
    xAxis: cat(T, gs.map(g => g.n)), yAxis: val(T, { scale: true }),
    series: [
      { type: 'boxplot', data: stats, boxWidth: [20, 64], itemStyle: { color: T.fill, borderColor: T.series[0], borderWidth: 2 } },
      { type: 'scatter', data: out, symbolSize: 8, itemStyle: Object.assign({ color: T.series[0] }, gap(T)) }
    ]
  };
}
