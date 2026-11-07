import { toNum, esc, nf, legendB } from '../util.js';

export const id = 'parallel';
export const grupo = 'raros';
export const nombre = 'Coordenadas paralelas';
export const uso = 'Comparar elementos en muchas variables a la vez';
export const año = '';
export const autor = 'Popularizado por Alfred Inselberg';
export const curiosidad = 'Cada línea es un elemento que cruza todos los ejes. Si muchas líneas se cruzan entre dos ejes, esas dos variables van en sentido contrario.';
export const columnas = [
  { nombre: 'Coche', tipo: 'texto' },
  { nombre: 'Potencia (CV)', tipo: 'numero', editable: true },
  { nombre: 'Precio (k€)', tipo: 'numero', editable: true },
  { nombre: 'Peso (kg)', tipo: 'numero', editable: true },
  { nombre: 'Consumo (l/100)', tipo: 'numero', editable: true }
];
export const filas = [['Urbano', 70, 14, 1050, 5.2], ['Familiar', 110, 24, 1400, 6.1], ['Deportivo', 220, 48, 1350, 8.8], ['Furgoneta', 95, 22, 1650, 7.4], ['Híbrido', 140, 32, 1500, 4.1]];
export const nota = 'Cada fila es una línea; cada columna de valores, un eje.';

export function opt(rows, head, T) {
  const dims = [1, 2, 3, 4].filter(c => rows.some(r => !isNaN(toNum(r[c]))));
  const it = rows.filter(r => r[0]); if (dims.length < 2 || !it.length) return null;
  /* Valor que se dibuja en cada eje (las celdas sin número cuentan como 0). */
  const valor = (r, c) => { const v = toNum(r[c]); return isNaN(v) ? 0 : v; };
  /* ECharts escala cada eje solo con la primera serie (la primera fila), así que el mínimo y el
     máximo se calculan aquí con todas las filas y se redondean hacia fuera a un paso «bonito»
     (1, 2, 5, 10, 20, 50…). Ese mismo paso separa las marcas, para que sus números no se pisen. */
  const rango = dims.map(c => {
    let mn = Math.min(...it.map(r => valor(r, c))), mx = Math.max(...it.map(r => valor(r, c)));
    if (mn === mx) { if (mn === 0) mx = 1; else if (mn > 0) mn = 0; else mx = 0; }   /* todos iguales: se abre hasta 0 */
    const paso = d3.tickIncrement(mn, mx, 5) > 0 ? d3.tickIncrement(mn, mx, 5) : 1 / -d3.tickIncrement(mn, mx, 5);
    const redondo = v => +v.toPrecision(12);   /* quita restos de coma flotante (0.30000000000000004) */
    return { min: redondo(Math.floor(mn / paso) * paso), max: redondo(Math.ceil(mx / paso) * paso), paso };
  });
  return {
    legend: Object.assign(legendB(T), { data: it.map(r => r[0]) }),
    tooltip: { trigger: 'item', formatter: p => esc(p.seriesName) + '<br>' + dims.map((c, i) => esc(head[c]) + ': ' + nf.format(p.value[i])).join('<br>') },
    parallel: { left: 40, right: 40, top: 84, bottom: 30 },
    parallelAxis: dims.map((c, i) => ({ dim: i, name: head[c], type: 'value', min: rango[i].min, max: rango[i].max, interval: rango[i].paso, nameTextStyle: { color: T.ink2, fontSize: 12 }, axisLine: { lineStyle: { color: T.axis } }, axisTick: { show: false }, axisLabel: { color: T.muted } })),
    series: it.map((r, i) => ({ type: 'parallel', name: r[0], smooth: false, lineStyle: { width: 2.5, opacity: .9, color: T.series[i % 8] }, data: [dims.map(c => valor(r, c))] }))
  };
}
