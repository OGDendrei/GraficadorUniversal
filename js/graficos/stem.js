import { ncol, msg, maxOf, minOf } from '../util.js';

export const id = 'stem';
export const grupo = 'raros';
export const nombre = 'Tallo y hojas';
export const uso = 'Un histograma hecho con los propios números';
export const año = '1977';
export const autor = 'John Tukey';
export const curiosidad = 'No pierdes ningún dato: cada hoja es un número real. Se podía escribir con una máquina de escribir, sin ordenador.';
export const columnas = [{ nombre: 'Edad', tipo: 'numero', editable: true }];
export const filas = [[12], [15], [21], [23], [23], [27], [31], [34], [35], [35], [38], [41], [42], [47], [48], [52], [55], [59], [63], [67], [71], [74], [88], [95]];
export const nota = '';

export function draw(el, rows, head, T, mini) {
  const v = ncol(rows, 0).filter(x => x != null && x >= 0).sort((a, b) => a - b);
  if (v.length < 2) { msg(el, 'Escribe al menos dos números (no negativos).'); return; }
  /* Enteros a partir de 20: tallo = decenas. Si no: tallo = parte entera, hoja = primer decimal. */
  const ints = v.every(x => Math.floor(x) === x) && maxOf(v) >= 20;
  const map = {};
  v.forEach(x => {
    let st, lf;
    if (ints) { st = Math.floor(x / 10); lf = x % 10; } else { st = Math.floor(x); lf = Math.round((x - st) * 10); if (lf > 9) { st++; lf = 0; } }
    (map[st] = map[st] || []).push(lf);
  });
  const a = Math.floor(minOf(v) / (ints ? 10 : 1)), b = Math.floor(maxOf(v) / (ints ? 10 : 1));
  let h = '<div class="st">';
  for (let s = a; s <= b; s++) {
    const lv = map[s] || [];
    h += '<div class="ln"><span class="sk">' + s + '</span><span class="bar">' + (lv.join(' ') || '&nbsp;') + '</span>' + (lv.length ? '<span class="sc2">' + lv.length + '</span>' : '') + '</div>';
  }
  h += '<div class="key">Clave: ' + (ints ? '3 | 5 = 35' : '3 | 5 = 3,5') + '. El número gris es cuántos datos hay en cada fila.</div></div>';
  el.innerHTML = h;
}
