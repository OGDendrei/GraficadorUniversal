import { toNum, msg, sz, mkSvg, minOf, maxOf, nf } from '../util.js';

export const id = 'slope';
export const grupo = 'raros';
export const nombre = 'Slope chart';
export const uso = 'Antes y después de cada elemento';
export const año = '';
export const autor = 'Popularizado por Edward Tufte';
export const curiosidad = 'Solo compara dos momentos, pero deja claro qué sube, qué baja y qué se cruza por el camino.';
export const columnas = [
  { nombre: 'Elemento', tipo: 'texto' },
  { nombre: '2025', tipo: 'numero', editable: true },
  { nombre: '2026', tipo: 'numero', editable: true }
];
export const filas = [['Alquiler', 620, 650], ['Comida', 340, 320], ['Luz', 80, 95], ['Ocio', 90, 140], ['Transporte', 150, 130], ['Salud', 30, 45]];
export const nota = 'Azul: sube. Naranja: baja.';

export function draw(el, rows, head, T, mini) {
  const it = rows.map(r => ({ n: r[0], a: toNum(r[1]), b: toNum(r[2]) })).filter(d => d.n && !isNaN(d.a) && !isNaN(d.b));
  if (it.length < 1) { msg(el, 'Cada fila necesita un nombre y dos valores.'); return; }
  const { W, H } = sz(el), svg = mkSvg(el, W, H), m = { t: mini ? 6 : 38, b: mini ? 6 : 30 }, xl = W * (mini ? .25 : .34), xr = W * (mini ? .75 : .66);
  const all = []; it.forEach(d => { all.push(d.a, d.b); });
  const y = d3.scaleLinear([minOf(all), maxOf(all)], [H - m.b - 6, m.t + 6]);
  /* Separa las etiquetas para que no se pisen (mínimo 15 px). */
  const spread = arr => { const s2 = arr.slice().sort((p, q) => p.y - q.y); for (let k = 1; k < s2.length; k++) if (s2[k].y - s2[k - 1].y < 15) s2[k].y = s2[k - 1].y + 15; return s2; };
  const L = spread(it.map((d, i) => ({ i, y: y(d.a) }))), R = spread(it.map((d, i) => ({ i, y: y(d.b) })));
  const ly = {}, ry = {}; L.forEach(p => { ly[p.i] = p.y; }); R.forEach(p => { ry[p.i] = p.y; });
  it.forEach((d, i) => {
    const c = d.b > d.a ? T.series[0] : (d.b < d.a ? T.series[1] : T.axis);
    svg.append('line').attr('x1', xl).attr('x2', xr).attr('y1', y(d.a)).attr('y2', y(d.b)).attr('stroke', c).attr('stroke-width', 2).append('title').text(d.n + ': ' + nf.format(d.a) + ' → ' + nf.format(d.b));
    svg.append('circle').attr('cx', xl).attr('cy', y(d.a)).attr('r', 4).attr('fill', c).attr('stroke', T.surface).attr('stroke-width', 2);
    svg.append('circle').attr('cx', xr).attr('cy', y(d.b)).attr('r', 4).attr('fill', c).attr('stroke', T.surface).attr('stroke-width', 2);
    if (!mini) {
      svg.append('text').attr('x', xl - 10).attr('y', ly[i]).attr('dy', '.35em').attr('text-anchor', 'end').attr('font-size', 13).attr('fill', T.ink2).text(d.n + '  ' + nf.format(d.a));
      svg.append('text').attr('x', xr + 10).attr('y', ry[i]).attr('dy', '.35em').attr('font-size', 13).attr('fill', T.ink2).text(nf.format(d.b) + '  ' + d.n);
    }
  });
  if (!mini) {
    svg.append('text').attr('x', xl).attr('y', 18).attr('text-anchor', 'middle').attr('font-size', 13).attr('font-weight', 600).attr('fill', T.ink).text(head[1]);
    svg.append('text').attr('x', xr).attr('y', 18).attr('text-anchor', 'middle').attr('font-size', 13).attr('font-weight', 600).attr('fill', T.ink).text(head[2]);
    svg.append('rect').attr('x', xl).attr('y', H - 18).attr('width', 12).attr('height', 12).attr('rx', 3).attr('fill', T.series[0]);
    svg.append('text').attr('x', xl + 18).attr('y', H - 8).attr('font-size', 12.5).attr('fill', T.ink2).text('Sube');
    svg.append('rect').attr('x', xl + 80).attr('y', H - 18).attr('width', 12).attr('height', 12).attr('rx', 3).attr('fill', T.series[1]);
    svg.append('text').attr('x', xl + 98).attr('y', H - 8).attr('font-size', 12.5).attr('fill', T.ink2).text('Baja');
  }
}
