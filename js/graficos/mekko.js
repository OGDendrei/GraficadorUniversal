import { uniq, col, toNum, msg, sz, mkSvg, onFill, nf } from '../util.js';

export const id = 'mekko';
export const grupo = 'raros';
export const nombre = 'Marimekko';
export const uso = 'Dos dimensiones: anchura y reparto';
export const año = '';
export const autor = '';
export const curiosidad = 'Se llama así por la marca finlandesa de telas Marimekko, cuyos estampados de bloques de colores se parecen mucho.';
export const columnas = [
  { nombre: 'Región', tipo: 'texto' },
  { nombre: 'Producto', tipo: 'texto' },
  { nombre: 'Ventas (k€)', tipo: 'numero', editable: true }
];
export const filas = [['Norte', 'A', 40], ['Norte', 'B', 25], ['Norte', 'C', 15], ['Centro', 'A', 30], ['Centro', 'B', 50], ['Centro', 'C', 40], ['Sur', 'A', 20], ['Sur', 'B', 15], ['Sur', 'C', 35]];
export const nota = 'La anchura de cada columna es su total; la altura de cada bloque, su parte.';

export function draw(el, rows, head, T, mini) {
  const cs = uniq(col(rows, 0)), sg = uniq(col(rows, 1));
  const valor = (c, s) => rows.filter(r => r[0] === c && r[1] === s).reduce((a, r) => { const v = toNum(r[2]); return a + (v > 0 ? v : 0); }, 0);
  const tot = cs.map(c => sg.reduce((a, s) => a + valor(c, s), 0)), grand = tot.reduce((a, b) => a + b, 0);
  if (!grand || !cs.length || !sg.length) { msg(el, 'Necesito columna, segmento y un valor positivo.'); return; }
  const { W, H } = sz(el), svg = mkSvg(el, W, H), m = { l: mini ? 2 : 38, r: mini ? 2 : 8, t: mini ? 2 : 34, b: mini ? 2 : 46 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
  if (!mini) {
    let lx = m.l;
    sg.forEach((sn, k) => {
      svg.append('rect').attr('x', lx).attr('y', 8).attr('width', 12).attr('height', 12).attr('rx', 3).attr('fill', T.series[k % 8]);
      svg.append('text').attr('x', lx + 18).attr('y', 18).attr('font-size', 12.5).attr('fill', T.ink2).text(sn);
      lx += 40 + sn.length * 7;
    });
    [0, 50, 100].forEach(p => { svg.append('text').attr('x', m.l - 8).attr('y', m.t + ih - ih * p / 100).attr('dy', '.35em').attr('text-anchor', 'end').attr('font-size', 12).attr('fill', T.muted).text(p + '%'); });
  }
  let x = m.l;
  cs.forEach((c, ci) => {
    const w = tot[ci] / grand * iw; let y = m.t + ih;
    sg.forEach((sn, k) => {
      const v = valor(c, sn); if (!v) return;
      const h = v / tot[ci] * ih; y -= h;
      svg.append('rect').attr('x', x).attr('y', y).attr('width', w).attr('height', h).attr('fill', T.series[k % 8]).attr('stroke', T.surface).attr('stroke-width', 2).append('title').text(c + ' · ' + sn + ': ' + nf.format(v));
      if (!mini && w > 38 && h > 18) svg.append('text').attr('x', x + w / 2).attr('y', y + h / 2).attr('dy', '.35em').attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', onFill(k)).text(Math.round(v / tot[ci] * 100) + '%');
    });
    if (!mini) {
      svg.append('text').attr('x', x + w / 2).attr('y', H - m.b + 18).attr('text-anchor', 'middle').attr('font-size', 12.5).attr('fill', T.ink2).text(c);
      if (w > 46) svg.append('text').attr('x', x + w / 2).attr('y', H - m.b + 34).attr('text-anchor', 'middle').attr('font-size', 11.5).attr('fill', T.muted).text(Math.round(tot[ci] / grand * 100) + ' % del total');
    }
    x += w;
  });
}
