import { mulberry, gauss, normDate, toNum, maxOf, esc, nf } from '../util.js';

export const id = 'calendar';
export const grupo = 'vistosos';
export const nombre = 'Calendario de calor';
export const uso = 'Ver hábitos día a día';
export const año = '';
export const autor = '';
export const curiosidad = 'Lo popularizó GitHub con su cuadrícula verde de contribuciones. Es ideal para ver qué días rindes y cuáles no.';
export const columnas = [
  { nombre: 'Fecha', tipo: 'fecha' },
  { nombre: 'Horas de estudio', tipo: 'numero', editable: true }
];
/* 91 días desde el 3 de agosto de 2026; menos horas los fines de semana. */
export const filas = (() => {
  const r = mulberry(7), rows = [], d0 = Date.UTC(2026, 7, 3);
  for (let i = 0; i < 91; i++) {
    const d = new Date(d0 + i * 864e5), w = d.getUTCDay();
    const v = Math.max(0, Math.round((w === 0 || w === 6 ? 1.5 : 4) + gauss(r) * 1.6));
    rows.push([d.toISOString().slice(0, 10), String(v)]);
  }
  return rows;
})();
export const nota = 'Fecha como AAAA-MM-DD o DD/MM/AAAA.';

export function opt(rows, head, T) {
  const d = rows.map(r => [normDate(r[0]), toNum(r[1])]).filter(x => x[0] && !isNaN(x[1]));
  if (!d.length) return null;
  if (d.some(x => x[1] < 0)) return { aviso: 'El calendario de calor no admite números negativos. Usa 0 o más en «' + head[1] + '».' };
  if (new Set(d.map(x => x[0])).size < 2) return { aviso: 'Hacen falta al menos dos días distintos para dibujar el calendario.' };
  d.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  const mx = maxOf(d.map(x => x[1])) || 1;
  return {
    tooltip: { formatter: p => esc(p.value[0]) + ': ' + nf.format(p.value[1]) },
    visualMap: { min: 0, max: mx, calculable: false, orient: 'horizontal', left: 'center', bottom: 4, itemWidth: 14, itemHeight: 150, inRange: { color: T.q }, textStyle: { color: T.ink2 } },
    calendar: {
      top: 40, left: 34, right: 12, cellSize: ['auto', 18], range: [d[0][0], d[d.length - 1][0]], itemStyle: { borderWidth: 2, borderColor: T.surface, color: T.grid }, splitLine: { show: false }, yearLabel: { show: false },
      dayLabel: { firstDay: 1, nameMap: ['D', 'L', 'M', 'X', 'J', 'V', 'S'], color: T.muted }, monthLabel: { nameMap: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'], color: T.ink2 }
    },
    series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: d }]
  };
}
