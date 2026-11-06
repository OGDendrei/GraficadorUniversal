import { alias, toNum, minOf, maxOf, esc, nf } from '../util.js';

export const id = 'choro';
export const grupo = 'vistosos';
export const nombre = 'Mapa coroplético';
export const uso = 'Un mapa pintado según valores';
export const año = '1826';
export const autor = 'Charles Dupin';
export const curiosidad = 'Dupin pintó Francia según el nivel de educación de cada zona. El nombre viene del griego y viene a decir «multitud de lugares».';
export const columnas = [
  { nombre: 'País', tipo: 'texto' },
  { nombre: 'Visitas (miles)', tipo: 'numero', editable: true }
];
export const filas = [['España', 82], ['Francia', 64], ['Alemania', 70], ['Italia', 58], ['Portugal', 40], ['Reino Unido', 66], ['Estados Unidos', 90], ['Brasil', 35], ['México', 42], ['Marruecos', 28], ['Japón', 50], ['Australia', 30], ['India', 55], ['Argentina', 25]];
export const nota = 'Escribe el país en español o en inglés. Los que no reconozca se quedan sin pintar.';

export function opt(rows, head, T) {
  /* El mapa del mundo se carga aparte; mientras no esté, se avisa con «pendiente». */
  if (!(window.echarts && echarts.getMap && echarts.getMap('world'))) return { pending: true };
  const d = rows.map(r => ({ name: alias(r[0]), value: toNum(r[1]) })).filter(x => x.name && !isNaN(x.value));
  if (!d.length) return null;
  const vs = d.map(x => x.value);
  return {
    tooltip: { trigger: 'item', formatter: p => esc(p.name) + ': ' + (p.value != null && !isNaN(p.value) ? nf.format(p.value) : 'sin datos') },
    visualMap: { min: minOf(vs), max: maxOf(vs), left: 8, bottom: 8, calculable: false, text: ['Más', 'Menos'], itemWidth: 12, itemHeight: 90, inRange: { color: T.q }, textStyle: { color: T.ink2 } },
    series: [{ type: 'map', map: 'world', roam: false, data: d, itemStyle: { areaColor: T.grid, borderColor: T.surface, borderWidth: .5 }, emphasis: { label: { show: false }, itemStyle: { areaColor: T.series[1] } } }]
  };
}
