import { parseSeries, msg, minOf, maxOf, esc, nf } from '../util.js';

export const id = 'spark';
export const grupo = 'raros';
export const nombre = 'Sparklines';
export const uso = 'Mini-gráficos para meter en una tabla';
export const año = '2006';
export const autor = 'Edward Tufte';
export const curiosidad = 'Tufte los definió como gráficos «del tamaño de una palabra»: caben dentro de una frase o de una celda.';
export const columnas = [
  { nombre: 'Concepto', tipo: 'texto' },
  { nombre: 'Valores (separados por espacios)', tipo: 'texto' }
];
export const filas = [['Gasolina (€/l)', '1.62 1.65 1.61 1.58 1.60 1.66 1.70 1.68 1.64 1.59'], ['Luz (€/kWh)', '0.14 0.16 0.15 0.19 0.22 0.20 0.17 0.15 0.14 0.13'], ['Temperatura (°C)', '8 9 12 15 18 23 27 26 21 16 11 8'], ['Pasos diarios', '6200 7800 5400 9100 10300 8800 4300']];
export const nota = 'En cada fila, escribe los valores separados por espacios.';

export function draw(el, rows, head, T, mini) {
  const it = rows.map(r => ({ n: r[0], v: parseSeries(r[1]) })).filter(d => d.n && d.v.length >= 2);
  if (!it.length) { msg(el, 'Cada fila necesita un nombre y al menos dos valores.'); return; }
  el.innerHTML = '<div class="sp">' + it.map(d => {
    const mn = minOf(d.v), mx = maxOf(d.v), rg = (mx - mn) || 1, n = d.v.length;
    const pts = d.v.map((v, i) => [i / (n - 1) * 100, 92 - (v - mn) / rg * 84]);
    const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '), last = pts[n - 1];
    const first = d.v[0], lastV = d.v[n - 1], ch = first ? (lastV - first) / Math.abs(first) * 100 : 0;
    return '<div class="rw"><div class="sn">' + esc(d.n) + '</div><div class="sg"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="' + line + ' 100,100 0,100" fill="var(--s1)" fill-opacity=".14"></polygon><polyline points="' + line + '" fill="none" stroke="var(--s1)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"></polyline></svg><span class="dot" style="left:' + last[0] + '%;top:' + last[1] + '%"></span></div><div class="sv">' + nf.format(lastV) + '</div><div class="sc">' + (ch >= 0 ? '▲ ' : '▼ ') + nf.format(Math.abs(ch)) + ' %</div></div>';
  }).join('') + '</div>';
}
