import { genLong, groupsOf, msg, sz, mkSvg, minOf, maxOf, bw, kde, nf } from '../util.js';

export const id = 'ridge';
export const grupo = 'raros';
export const nombre = 'Ridgeline';
export const uso = 'Varias distribuciones apiladas como montañas';
export const año = '1979';
export const autor = 'Joy Division';
export const curiosidad = 'Es el estilo de la portada de «Unknown Pleasures»: los pulsos de una estrella dibujados como montañas apiladas.';
export const columnas = [
  { nombre: 'Mes', tipo: 'texto' },
  { nombre: 'Temperatura (°C)', tipo: 'numero', editable: true }
];
export const filas = genLong([['Ene', 7, 3], ['Feb', 9, 3], ['Mar', 12, 3.5], ['Abr', 15, 3], ['May', 19, 3.5]], 12, 5);
export const nota = 'Una fila por medición: el grupo y su valor.';

export function draw(el, rows, head, T, mini) {
  const gs = groupsOf(rows); if (!gs.length) { msg(el, 'Necesito grupos con al menos dos valores.'); return; }
  const { W, H } = sz(el), svg = mkSvg(el, W, H);
  let all = []; gs.forEach(g => { all = all.concat(g.v); });
  const lo = minOf(all), hi = maxOf(all), pad = (hi - lo || 1) * .18, m = { l: mini ? 4 : 64, r: mini ? 4 : 14, t: mini ? 6 : 14, b: mini ? 4 : 30 };
  const x = d3.scaleLinear([lo - pad, hi + pad], [m.l, W - m.r]), step = (H - m.t - m.b) / (gs.length + 1.2);
  const dens = gs.map(g => kde(g.v, bw(g.v), lo - pad, hi + pad, 80));
  const mx = maxOf(dens.map(d => maxOf(d.map(p => p[1])))), sc = step * 2.3 / mx;
  gs.forEach((g, k) => {
    const base = m.t + step * (k + 1.2), d = dens[k];
    const area = d3.area().x(p => x(p[0])).y0(base).y1(p => base - p[1] * sc).curve(d3.curveBasis);
    svg.append('path').attr('d', area(d)).attr('fill', T.surface).attr('stroke', T.ink).attr('stroke-width', mini ? 1 : 1.6).attr('stroke-linejoin', 'round').append('title').text(g.n);
    if (!mini) svg.append('text').attr('x', m.l - 10).attr('y', base).attr('text-anchor', 'end').attr('font-size', 12.5).attr('fill', T.ink2).text(g.n);
  });
  if (!mini) {
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', H - m.b + 4).attr('y2', H - m.b + 4).attr('stroke', T.axis);
    x.ticks(6).forEach(t => { svg.append('text').attr('x', x(t)).attr('y', H - m.b + 20).attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', T.muted).text(nf.format(t)); });
  }
}
