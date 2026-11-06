import { toNum, uniq } from '../util.js';

export const id = 'sankey';
export const grupo = 'vistosos';
export const nombre = 'Sankey';
export const uso = 'A dónde va cada parte de un total';
export const año = '1898';
export const autor = 'Matthew Sankey';
export const curiosidad = 'Sankey, ingeniero irlandés, lo dibujó para mostrar a dónde se iba la energía de una máquina de vapor.';
export const columnas = [
  { nombre: 'Origen', tipo: 'texto' },
  { nombre: 'Destino', tipo: 'texto' },
  { nombre: 'Cantidad (€)', tipo: 'numero', editable: true }
];
export const filas = [['Nómina', 'Vivienda', 650], ['Nómina', 'Comida', 320], ['Nómina', 'Ocio', 150], ['Nómina', 'Ahorro', 280], ['Comida', 'Súper', 240], ['Comida', 'Restaurantes', 80], ['Ocio', 'Salidas', 90], ['Ocio', 'Suscripciones', 60]];
export const nota = 'Cada fila es un flujo. No puede haber ciclos (A→B→A).';

export function opt(rows, head, T) {
  const l = rows.map(r => ({ source: r[0], target: r[1], value: toNum(r[2]) })).filter(x => x.source && x.target && x.value > 0);
  if (!l.length) return null;
  const nodes = uniq(l.reduce((a, x) => a.concat([x.source, x.target]), []));
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey', left: 8, right: 110, top: 12, bottom: 12, nodeAlign: 'left', nodeGap: 12, nodeWidth: 14, draggable: false,
      emphasis: { focus: 'adjacency' }, lineStyle: { color: 'source', opacity: .35, curveness: .5 }, label: { color: T.ink, fontSize: 12 },
      data: nodes.map((n, i) => ({ name: n, itemStyle: { color: T.series[i % 8] } })), links: l
    }]
  };
}
