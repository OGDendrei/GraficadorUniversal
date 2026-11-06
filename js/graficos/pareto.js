import { toNum, nf, gridB, legendB, cat, val, gap } from '../util.js';

export const id = 'pareto';
export const grupo = 'raros';
export const nombre = 'Pareto';
export const uso = 'Qué pocas causas explican casi todo';
export const año = '';
export const autor = 'Joseph Juran';
export const curiosidad = 'Juran lo bautizó por Vilfredo Pareto, que observó que el 80 % de la tierra de Italia era del 20 % de los propietarios.';
export const columnas = [
  { nombre: 'Causa', tipo: 'texto' },
  { nombre: 'Incidencias', tipo: 'numero', editable: true }
];
export const filas = [['Retrasos de proveedor', 48], ['Fallos de máquina', 31], ['Errores de pedido', 14], ['Falta de personal', 9], ['Roturas', 6], ['Otros', 4]];
export const nota = 'Las barras y la línea usan la misma escala: % sobre el total.';

export function opt(rows, head, T) {
  const it = rows.map(r => ({ n: r[0], v: toNum(r[1]) })).filter(d => d.n && d.v > 0).sort((a, b) => b.v - a.v);
  if (it.length < 2) return null;
  const total = it.reduce((s, d) => s + d.v, 0); let acc = 0;
  const share = it.map(d => Math.round(d.v / total * 1000) / 10), cum = it.map(d => { acc += d.v; return Math.round(acc / total * 1000) / 10; });
  return {
    grid: gridB(true), legend: legendB(T),
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: T.grid, opacity: .45 } }, valueFormatter: v => nf.format(v) + ' %' },
    xAxis: cat(T, it.map(d => d.n), { axisLabel: { color: T.muted, interval: 0, width: 84, overflow: 'break' } }),
    yAxis: val(T, { min: 0, max: 100, axisLabel: { color: T.muted, formatter: v => v + ' %' } }),
    series: [
      { name: 'Parte del total', type: 'bar', data: share, barMaxWidth: 32, itemStyle: Object.assign({ borderRadius: [4, 4, 0, 0] }, gap(T)) },
      { name: 'Acumulado', type: 'line', data: cum, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2 }, itemStyle: Object.assign({ color: T.series[1] }, gap(T)),
        markLine: { silent: true, symbol: 'none', lineStyle: { color: T.muted, type: 'dashed' }, label: { formatter: '80 %', color: T.ink2 }, data: [{ yAxis: 80 }] } }
    ]
  };
}
