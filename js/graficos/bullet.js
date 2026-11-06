import { toNum, msg, esc, nf } from '../util.js';

export const id = 'bullet';
export const grupo = 'raros';
export const nombre = 'Bullet chart';
export const uso = 'Progreso frente a un objetivo';
export const año = '2005';
export const autor = 'Stephen Few';
export const curiosidad = 'Few lo diseñó para sustituir los velocímetros de los cuadros de mando, que ocupaban mucho espacio y decían poco.';
export const columnas = [
  { nombre: 'Indicador', tipo: 'texto' },
  { nombre: 'Valor', tipo: 'numero', editable: true },
  { nombre: 'Objetivo', tipo: 'numero', editable: true },
  { nombre: 'Máximo', tipo: 'numero', editable: true }
];
export const filas = [['Ahorro del mes (€)', 280, 300, 400], ['Horas de estudio', 22, 25, 40], ['Pasos al día (miles)', 7.8, 10, 15], ['Agua (litros)', 1.4, 2, 3]];
export const nota = 'La barra es el valor y la raya negra es el objetivo.';

export function draw(el, rows, head, T, mini) {
  const it = rows.map(r => ({ n: r[0], v: toNum(r[1]), t: toNum(r[2]), m: toNum(r[3]) })).filter(d => d.n && !isNaN(d.v));
  if (!it.length) { msg(el, 'Añade un indicador con su valor.'); return; }
  el.innerHTML = '<div class="bul">' + it.map(d => {
    let m = isNaN(d.m) ? Math.max(d.v, isNaN(d.t) ? 0 : d.t) * 1.25 : d.m; if (!(m > 0)) m = 1;
    const p = x => Math.max(0, Math.min(100, x / m * 100));
    return '<div class="bl"><div class="bn">' + esc(d.n) + '</div><div class="bt" title="' + esc(d.n) + '"><i class="k3"></i><i class="k2"></i><i class="k1"></i><i class="bb" style="width:' + p(d.v) + '%"></i>' + (isNaN(d.t) ? '' : '<i class="bm" style="left:' + p(d.t) + '%"></i>') + '</div><div class="bv">' + nf.format(d.v) + (isNaN(d.t) ? '' : ' / ' + nf.format(d.t)) + '</div></div>';
  }).join('') + '</div>';
}
