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
  return {
    legend: Object.assign(legendB(T), { data: it.map(r => r[0]) }),
    tooltip: { trigger: 'item', formatter: p => esc(p.seriesName) + '<br>' + dims.map((c, i) => esc(head[c]) + ': ' + nf.format(p.value[i])).join('<br>') },
    parallel: { left: 40, right: 40, top: 84, bottom: 30 },
    parallelAxis: dims.map((c, i) => ({ dim: i, name: head[c], type: 'value', nameTextStyle: { color: T.ink2, fontSize: 12 }, axisLine: { lineStyle: { color: T.axis } }, axisTick: { show: false }, axisLabel: { color: T.muted } })),
    series: it.map((r, i) => ({ type: 'parallel', name: r[0], smooth: false, lineStyle: { width: 2.5, opacity: .9, color: T.series[i % 8] }, data: [dims.map(c => { const v = toNum(r[c]); return isNaN(v) ? 0 : v; })] }))
  };
}
