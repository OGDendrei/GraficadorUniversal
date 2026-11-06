import { tree, onFill, esc, nf } from '../util.js';

export const id = 'treemap';
export const grupo = 'vistosos';
export const nombre = 'Treemap';
export const uso = 'Cuánto pesa cada parte dentro de grupos';
export const año = '1991';
export const autor = 'Ben Shneiderman';
export const curiosidad = 'Shneiderman lo ideó porque el disco duro compartido de su departamento se llenaba y nadie sabía qué ocupaba tanto.';
export const columnas = [
  { nombre: 'Grupo', tipo: 'texto' },
  { nombre: 'Elemento', tipo: 'texto' },
  { nombre: 'Gasto (€)', tipo: 'numero', editable: true }
];
export const filas = [['Hogar', 'Alquiler', 650], ['Hogar', 'Luz', 90], ['Hogar', 'Internet', 40], ['Comida', 'Súper', 240], ['Comida', 'Fuera', 80], ['Ocio', 'Cine', 25], ['Ocio', 'Juegos', 60], ['Ocio', 'Salidas', 90], ['Transporte', 'Gasolina', 110], ['Transporte', 'Seguro', 45]];
export const nota = 'Cada fila: grupo, elemento y valor.';

export function opt(rows, head, T) {
  const t = tree(rows); if (!t.length) return null;
  t.forEach((g, k) => {
    g.itemStyle = { color: T.series[k % 8] }; g.upperLabel = { color: onFill(k) };
    g.children.forEach(c => { c.itemStyle = { color: T.series[k % 8] }; c.label = { color: onFill(k) }; });
  });
  return {
    tooltip: { formatter: p => esc(p.name) + ': ' + nf.format(p.value) },
    series: [{
      type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, top: 4, bottom: 4, left: 4, right: 4, squareRatio: 1.2,
      label: { show: true, formatter: '{b}', fontSize: 13 }, upperLabel: { show: true, height: 24, fontWeight: 600, fontSize: 13 },
      itemStyle: { borderColor: T.surface, borderWidth: 2, gapWidth: 2 },
      levels: [{ itemStyle: { borderColor: T.surface, borderWidth: 0, gapWidth: 4 }, upperLabel: { show: true } }, { itemStyle: { borderColor: T.surface, borderWidth: 2, gapWidth: 2 } }],
      data: t
    }]
  };
}
