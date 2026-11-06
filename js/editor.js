/* Tabla de datos editable: escribir, borrar filas, añadir filas, pegar desde una hoja de cálculo
   y restaurar el ejemplo. No sabe dibujar: avisa a la app con alCambiar() y alRestaurar(). */
import { $, esc } from './util.js';

/* opciones.actual(): devuelve { def, estado } del gráfico abierto
   (def = módulo del gráfico; estado = { head: [...], rows: [[...], ...] }). */
export function iniciarEditor({ actual, alCambiar, alRestaurar }) {
  const dt = $('dt');
  const esNum = c => c.tipo === 'numero';
  const blank = () => actual().def.columnas.map(() => '');

  function pintar() {
    const { def, estado: s } = actual();
    let h = '<table><thead><tr>' + def.columnas.map((c, i) => '<th class="' + (esNum(c) ? 'num' : '') + '">' + (c.editable
      ? '<input class="hin ' + (esNum(c) ? 'num' : '') + '" data-h="' + i + '" value="' + esc(s.head[i]) + '" aria-label="Nombre de la columna ' + (i + 1) + '">'
      : '<span class="th-lbl">' + esc(s.head[i]) + '</span>') + '</th>').join('') + '<th class="xc"></th></tr></thead><tbody>';
    s.rows.forEach((r, ri) => {
      h += '<tr>' + def.columnas.map((c, ci) => '<td><input data-r="' + ri + '" data-c="' + ci + '" class="' + (esNum(c) ? 'num' : '') + '" value="' + esc(r[ci] == null ? '' : r[ci]) + '"' + (esNum(c) ? ' inputmode="decimal"' : '') + ' aria-label="' + esc(s.head[ci]) + ', fila ' + (ri + 1) + '"></td>').join('')
        + '<td class="xc"><button type="button" class="x" data-del="' + ri + '" aria-label="Borrar fila ' + (ri + 1) + '">✕</button></td></tr>';
    });
    dt.innerHTML = h + '</tbody></table>';
  }

  /* Escribir en una celda o en el nombre de una columna. */
  dt.addEventListener('input', e => {
    const t = e.target, s = actual().estado;
    if (t.dataset.h != null) s.head[+t.dataset.h] = t.value;
    else if (t.dataset.r != null) s.rows[+t.dataset.r][+t.dataset.c] = t.value;
    alCambiar();
  });

  /* Borrar una fila (si es la última, se vacía). */
  dt.addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    const s = actual().estado, i = +b.dataset.del;
    if (s.rows.length > 1) s.rows.splice(i, 1); else s.rows[0] = blank();
    pintar(); alCambiar();
  });

  /* Pegar celdas de una hoja de cálculo: columnas separadas por tabulador y filas por salto de línea. */
  dt.addEventListener('paste', e => {
    const t = e.target; if (!t.matches || !t.matches('input[data-r]')) return;
    const txt = (e.clipboardData || window.clipboardData).getData('text');
    if (!/[\t\n]/.test(txt.trim())) return;
    e.preventDefault();
    const lines = txt.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(l => l.split('\t'));
    const r0 = +t.dataset.r, c0 = +t.dataset.c, { def, estado: s } = actual(), nc = def.columnas.length;
    lines.forEach((ln, i) => {
      while (s.rows.length <= r0 + i) s.rows.push(blank());
      ln.forEach((v, j) => { if (c0 + j < nc) s.rows[r0 + i][c0 + j] = v.trim(); });
    });
    pintar(); alCambiar();
  });

  $('addrow').onclick = () => {
    const s = actual().estado;
    s.rows.push(blank()); pintar();
    const ins = dt.querySelectorAll('input[data-r="' + (s.rows.length - 1) + '"]');
    if (ins.length) { ins[0].focus(); dt.scrollTop = dt.scrollHeight; }
  };

  $('reset').onclick = () => { alRestaurar(); pintar(); };

  return { pintar };
}
