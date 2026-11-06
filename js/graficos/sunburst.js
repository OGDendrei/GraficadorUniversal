import { tree, esc, nf } from '../util.js';

export const id = 'sunburst';
export const grupo = 'vistosos';
export const nombre = 'Sunburst';
export const uso = 'Jerarquías en anillos concéntricos';
export const año = '';
export const autor = '';
export const curiosidad = 'Es un treemap redondo: cada anillo es un nivel. Se usa mucho en programas que enseñan qué ocupa tu disco duro. Haz clic en un sector para acercarte.';
export const columnas = [
  { nombre: 'Grupo', tipo: 'texto' },
  { nombre: 'Elemento', tipo: 'texto' },
  { nombre: 'Espacio (GB)', tipo: 'numero', editable: true }
];
export const filas = [['Juegos', 'Steam', 220], ['Juegos', 'Otros', 80], ['Fotos', '2024', 60], ['Fotos', '2025', 90], ['Trabajo', 'Documentos', 15], ['Trabajo', 'Proyectos', 40], ['Sistema', 'Windows', 70], ['Sistema', 'Programas', 55]];
export const nota = 'Cada fila: grupo, elemento y valor.';

export function opt(rows, head, T) {
  const t = tree(rows); if (!t.length) return null;
  t.forEach((g, k) => { g.itemStyle = { color: T.series[k % 8] }; g.children.forEach(c => { c.itemStyle = { color: T.series[k % 8], opacity: .82 }; }); });
  return {
    tooltip: { formatter: p => esc(p.name) + ': ' + nf.format(p.value) },
    series: [{
      type: 'sunburst', radius: ['10%', '90%'], center: ['50%', '50%'], itemStyle: { borderColor: T.surface, borderWidth: 2 }, label: { color: '#fff', fontSize: 12, minAngle: 8 },
      levels: [{}, { r0: '12%', r: '55%', label: { rotate: 'tangential' } }, { r0: '57%', r: '90%', label: { rotate: 'radial' } }], data: t
    }]
  };
}
