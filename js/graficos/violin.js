import { genLong, groupsOf, msg, sz, mkSvg, minOf, maxOf, bw, kde, nf } from '../util.js';

export const id = 'violin';
export const grupo = 'raros';
export const nombre = 'Violín';
export const uso = 'La forma completa de los datos de cada grupo';
export const año = '1998';
export const autor = 'Hintze y Nelson';
export const curiosidad = 'Es un boxplot que enseña dónde se amontonan los datos y dónde no. Su silueta recuerda a un violín.';
export const columnas = [
  { nombre: 'Grupo', tipo: 'texto' },
  { nombre: 'Tiempo (min)', tipo: 'numero', editable: true }
];
export const filas = genLong([['Turno A', 32, 5], ['Turno B', 40, 9], ['Turno C', 27, 4]], 16, 11);
export const nota = 'Una fila por medición: el grupo y su valor.';

export function draw(el, rows, head, T, mini) {
  const gs = groupsOf(rows); if (!gs.length) { msg(el, 'Necesito grupos con al menos dos valores.'); return; }
  const { W, H } = sz(el), svg = mkSvg(el, W, H);
  let all = []; gs.forEach(g => { all = all.concat(g.v); });
  const lo = minOf(all), hi = maxOf(all), pad = (hi - lo || 1) * .12, m = { l: mini ? 4 : 46, r: mini ? 4 : 12, t: mini ? 4 : 14, b: mini ? 4 : 30 };
  const y = d3.scaleLinear([lo - pad, hi + pad], [H - m.b, m.t]);
  const x = d3.scaleBand(gs.map(g => g.n), [m.l, W - m.r]).paddingInner(.25).paddingOuter(.15);
  if (!mini) y.ticks(5).forEach(t => {
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t)).attr('stroke', T.grid);
    svg.append('text').attr('x', m.l - 8).attr('y', y(t)).attr('dy', '.35em').attr('text-anchor', 'end').attr('font-size', 12).attr('fill', T.muted).text(nf.format(t));
  });
  gs.forEach((g, k) => {
    const h = bw(g.v), a = g.v[0] - 2 * h, b = g.v[g.v.length - 1] + 2 * h, dens = kde(g.v, h, a, b, 60);
    const mx = maxOf(dens.map(d => d[1])), cx = x(g.n) + x.bandwidth() / 2, w = x.bandwidth() / 2;
    const area = d3.area().x0(d => cx - d[1] / mx * w).x1(d => cx + d[1] / mx * w).y(d => y(d[0])).curve(d3.curveBasis);
    svg.append('path').attr('d', area(dens)).attr('fill', T.series[k % 8]).attr('fill-opacity', .85).attr('stroke', T.surface).attr('stroke-width', 1.5)
      .append('title').text(g.n + ': mediana ' + nf.format(d3.quantileSorted(g.v, .5)));
    const q1 = d3.quantileSorted(g.v, .25), q2 = d3.quantileSorted(g.v, .5), q3 = d3.quantileSorted(g.v, .75);
    svg.append('line').attr('x1', cx).attr('x2', cx).attr('y1', y(q1)).attr('y2', y(q3)).attr('stroke', T.ink).attr('stroke-width', 3).attr('stroke-linecap', 'round');
    svg.append('circle').attr('cx', cx).attr('cy', y(q2)).attr('r', 4).attr('fill', T.surface).attr('stroke', T.ink).attr('stroke-width', 1.5);
    if (!mini) svg.append('text').attr('x', cx).attr('y', H - m.b + 18).attr('text-anchor', 'middle').attr('font-size', 12.5).attr('fill', T.ink2).text(g.n);
  });
}
