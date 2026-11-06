import { sz, uniq, toNum, msg, mkSvg, nf } from '../util.js';

export const id = 'chord';
export const grupo = 'vistosos';
export const nombre = 'Diagrama de cuerdas';
export const uso = 'Quién se conecta con quién';
export const año = '2009';
export const autor = 'Circos';
export const curiosidad = 'Se popularizó en genética con el programa Circos, que dibuja las conexiones entre partes del genoma.';
export const columnas = [
  { nombre: 'Origen', tipo: 'texto' },
  { nombre: 'Destino', tipo: 'texto' },
  { nombre: 'Flujo', tipo: 'numero', editable: true }
];
export const filas = [['Norte', 'Sur', 30], ['Norte', 'Este', 12], ['Norte', 'Oeste', 18], ['Sur', 'Norte', 22], ['Sur', 'Este', 25], ['Sur', 'Oeste', 8], ['Este', 'Norte', 10], ['Este', 'Sur', 14], ['Este', 'Oeste', 20], ['Oeste', 'Norte', 16], ['Oeste', 'Sur', 9], ['Oeste', 'Este', 11]];
export const nota = 'Cada fila es un flujo de un grupo a otro.';

export function draw(el, rows, head, T, mini) {
  const { W, H } = sz(el);
  /* Solo cuentan las filas con origen, destino y un flujo positivo. */
  const validas = rows.map(r => [r[0], r[1], toNum(r[2])]).filter(r => r[0] && r[1] && r[2] > 0);
  const names = uniq(validas.reduce((a, r) => a.concat([r[0], r[1]]), []));
  if (names.length < 2) { msg(el, 'Faltan datos para dibujar este gráfico: cada fila necesita origen, destino y un flujo positivo.'); return; }
  /* Matriz de flujos: m[origen][destino]. */
  const m = names.map(() => names.map(() => 0));
  validas.forEach(r => { m[names.indexOf(r[0])][names.indexOf(r[1])] += r[2]; });
  const svg = mkSvg(el, W, H);
  const R = Math.min(W, H) / 2 - (mini ? 5 : 56), inner = R - (mini ? 7 : 14);
  const chords = d3.chordDirected().padAngle(.04).sortSubgroups(d3.descending)(m);
  const g = svg.append('g').attr('transform', 'translate(' + W / 2 + ',' + H / 2 + ')');
  const colr = i => T.series[i % 8];
  g.append('g').selectAll('path').data(chords).join('path').attr('d', d3.ribbonArrow().radius(inner - 1).padAngle(1 / inner))
    .attr('fill', d => colr(d.source.index)).attr('fill-opacity', .6).attr('stroke', T.surface).attr('stroke-width', 1)
    .append('title').text(d => names[d.source.index] + ' → ' + names[d.target.index] + ': ' + nf.format(d.source.value));
  g.append('g').selectAll('path').data(chords.groups).join('path').attr('d', d3.arc().innerRadius(inner).outerRadius(R))
    .attr('fill', d => colr(d.index)).append('title').text(d => names[d.index] + ': ' + nf.format(d.value));
  if (!mini) g.append('g').selectAll('text').data(chords.groups).join('text').each(function (d) {
    const a = (d.startAngle + d.endAngle) / 2, flip = a > Math.PI;
    d3.select(this).attr('transform', 'rotate(' + (a * 180 / Math.PI - 90) + ') translate(' + (R + 8) + ')' + (flip ? ' rotate(180)' : '')).attr('text-anchor', flip ? 'end' : 'start').attr('dy', '.35em').text(names[d.index]);
  }).attr('fill', T.ink2).attr('font-size', 12);
}
