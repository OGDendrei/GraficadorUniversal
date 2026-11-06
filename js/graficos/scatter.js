import { toNum, esc, nf, val, gap } from '../util.js';

export const id = 'scatter';
export const grupo = 'populares';
export const nombre = 'Dispersión';
export const uso = 'Si dos cosas están relacionadas';
export const año = '1833';
export const autor = 'John Herschel';
export const curiosidad = 'Herschel dibujó así la órbita de estrellas dobles. Casi 200 años después sigue siendo la mejor forma de ver si dos cosas van juntas.';
export const columnas = [
  { nombre: 'Altura (cm)', tipo: 'numero', editable: true },
  { nombre: 'Peso (kg)', tipo: 'numero', editable: true }
];
export const filas = [[155, 52], [158, 55], [160, 58], [163, 60], [165, 62], [167, 66], [169, 64], [170, 70], [172, 72], [174, 71], [176, 76], [178, 79], [180, 82], [182, 85], [185, 90], [188, 92]];
export const nota = '';

export function opt(rows, head, T) {
  const d = rows.map(r => [toNum(r[0]), toNum(r[1])]).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
  if (d.length < 2) return null;
  return {
    grid: { left: 8, right: 24, top: 24, bottom: 28, containLabel: true },
    tooltip: { trigger: 'item', formatter: p => esc(head[0]) + ': ' + nf.format(p.value[0]) + '<br>' + esc(head[1]) + ': ' + nf.format(p.value[1]) },
    xAxis: val(T, { scale: true, name: head[0], nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: T.ink2 }, splitLine: { show: false }, axisLine: { show: true, lineStyle: { color: T.axis } } }),
    yAxis: val(T, { scale: true, name: head[1], nameTextStyle: { color: T.ink2, align: 'left' } }),
    series: [{ type: 'scatter', data: d, symbolSize: 10, itemStyle: Object.assign({ opacity: .92 }, gap(T)) }]
  };
}
