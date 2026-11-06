import { sers, ncol, maxOf, legendB } from '../util.js';

export const id = 'radar';
export const grupo = 'vistosos';
export const nombre = 'Radar';
export const uso = 'Comparar perfiles con varias medidas';
export const año = '';
export const autor = '';
export const curiosidad = 'También se llama gráfico de araña. Sirve para comparar perfiles, pero ojo: cambiar el orden de los ejes cambia la forma.';
export const columnas = [
  { nombre: 'Atributo', tipo: 'texto' },
  { nombre: 'Guerrero', tipo: 'numero', editable: true },
  { nombre: 'Mago', tipo: 'numero', editable: true },
  { nombre: 'Ladrón', tipo: 'numero', editable: true }
];
export const filas = [['Fuerza', 9, 3, 5], ['Agilidad', 4, 5, 9], ['Inteligencia', 3, 9, 6], ['Resistencia', 8, 4, 5], ['Magia', 1, 9, 3], ['Sigilo', 2, 4, 9]];
export const nota = 'Hasta 3 series. Cada fila es un eje del radar.';

export function opt(rows, head, T) {
  const ss = sers(rows, head, 1).slice(0, 3); if (!ss.length || rows.length < 3) return null;
  const all = []; ss.forEach(c => { ncol(rows, c).forEach(v => { if (v != null) all.push(v); }); });
  const mx = maxOf(all) * 1.1 || 1;
  return {
    legend: ss.length > 1 ? legendB(T) : { show: false }, tooltip: { trigger: 'item' },
    radar: { indicator: rows.map(r => ({ name: r[0] || '', max: mx })), radius: '62%', center: ['50%', ss.length > 1 ? '56%' : '52%'], axisName: { color: T.ink2, fontSize: 12 }, axisLine: { lineStyle: { color: T.grid } }, splitLine: { lineStyle: { color: T.grid } }, splitArea: { show: false } },
    series: [{
      type: 'radar',
      data: ss.map((c, k) => ({ name: head[c], value: ncol(rows, c).map(v => v == null ? 0 : v), symbol: 'circle', symbolSize: 8, lineStyle: { width: 2, color: T.series[k] }, itemStyle: { color: T.series[k], borderColor: T.surface, borderWidth: 2 }, areaStyle: { color: T.series[k], opacity: .14 } }))
    }]
  };
}
