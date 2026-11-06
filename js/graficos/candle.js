import { toNum, esc, nf, cat, val } from '../util.js';

export const id = 'candle';
export const grupo = 'raros';
export const nombre = 'Velas japonesas';
export const uso = 'Cuatro datos por periodo: abre, cierra, mínimo y máximo';
export const año = 'Siglo XVIII';
export const autor = 'Munehisa Homma';
export const curiosidad = 'Las inventó un comerciante de arroz japonés para seguir los precios. Cada vela cuenta cuatro datos de un vistazo.';
export const columnas = [
  { nombre: 'Día', tipo: 'texto' },
  { nombre: 'Apertura', tipo: 'numero', editable: true },
  { nombre: 'Cierre', tipo: 'numero', editable: true },
  { nombre: 'Mínimo', tipo: 'numero', editable: true },
  { nombre: 'Máximo', tipo: 'numero', editable: true }
];
export const filas = [['Día 1', 100, 104, 98, 106], ['Día 2', 104, 102, 100, 107], ['Día 3', 102, 108, 101, 110], ['Día 4', 108, 111, 106, 113], ['Día 5', 111, 109, 107, 114], ['Día 6', 109, 105, 103, 111], ['Día 7', 105, 107, 102, 109], ['Día 8', 107, 113, 106, 115], ['Día 9', 113, 116, 112, 118], ['Día 10', 116, 114, 111, 117], ['Día 11', 114, 119, 113, 121], ['Día 12', 119, 118, 115, 122]];
export const nota = '';

export function opt(rows, head, T) {
  const it = rows.filter(r => [1, 2, 3, 4].every(c => !isNaN(toNum(r[c])))); if (it.length < 2) return null;
  return {
    title: { text: 'Azul: cierra más alto de lo que abre · Naranja: cierra más bajo', left: 0, top: 0, textStyle: { fontSize: 12, color: T.ink2, fontWeight: 'normal' } },
    grid: { left: 8, right: 18, top: 34, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross', lineStyle: { color: T.axis } }, formatter: ps => { const p = [].concat(ps)[0], d = p.data.length === 5 ? p.data.slice(1) : p.data; return esc(p.name) + '<br>Apertura: ' + nf.format(d[0]) + '<br>Cierre: ' + nf.format(d[1]) + '<br>Mínimo: ' + nf.format(d[2]) + '<br>Máximo: ' + nf.format(d[3]); } },
    xAxis: cat(T, it.map(r => r[0])), yAxis: val(T, { scale: true }),
    series: [{ type: 'candlestick', data: it.map(r => [toNum(r[1]), toNum(r[2]), toNum(r[3]), toNum(r[4])]), itemStyle: { color: T.series[0], color0: T.series[1], borderColor: T.series[0], borderColor0: T.series[1], borderWidth: 2 } }]
  };
}
