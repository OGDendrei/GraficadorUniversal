import { ncol, minOf, maxOf, nf, esc, cat, val, gap } from '../util.js';

export const id = 'hist';
export const grupo = 'populares';
export const nombre = 'Histograma';
export const uso = 'Cuántos datos caen en cada rango';
export const año = '1891';
export const autor = 'Karl Pearson';
export const curiosidad = 'Pearson le puso el nombre de histograma, aunque ya se dibujaban gráficos parecidos antes.';
export const columnas = [{ nombre: 'Nota', tipo: 'numero', editable: true }];
export const filas = [[4.5], [5], [5.5], [6], [6], [6.5], [6.5], [7], [7], [7], [7.5], [7.5], [7.5], [8], [8], [8], [8.5], [8.5], [9], [9], [9.5], [10], [3.5], [5]];
export const nota = '';

export function opt(rows, head, T) {
  const v = ncol(rows, 0).filter(x => x != null); if (v.length < 5) return null;
  /* Número de intervalos según la regla de Sturges, entre 5 y 12. */
  const n = v.length, k = Math.min(12, Math.max(5, Math.ceil(Math.log(n) / Math.LN2 + 1)));
  const mn = minOf(v), mx = maxOf(v), w = (mx - mn) / k || 1, counts = [];
  for (let b = 0; b < k; b++) counts.push(0);
  v.forEach(x => { let i = Math.floor((x - mn) / w); if (i >= k) i = k - 1; counts[i]++; });
  const labels = counts.map((_, i) => nf.format(mn + i * w) + '–' + nf.format(mn + (i + 1) * w));
  return {
    grid: { left: 8, right: 18, top: 24, bottom: 28, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: T.grid, opacity: .45 } }, formatter: p => esc(p[0].name) + '<br>' + p[0].value + ' datos' },
    xAxis: cat(T, labels, { name: head[0], nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: T.ink2 } }),
    yAxis: val(T, { minInterval: 1, name: 'Nº de datos', nameTextStyle: { color: T.ink2, align: 'left' } }),
    series: [{ type: 'bar', data: counts, barCategoryGap: '0%', itemStyle: Object.assign({ borderRadius: [4, 4, 0, 0] }, gap(T)) }]
  };
}
