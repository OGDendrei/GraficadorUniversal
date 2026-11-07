/* Guardado en este navegador (localStorage) de los juegos de datos de cada gráfico.
 *
 * Formato actual, clave «gu2:<id>»:
 *   { v: 2, activo: 'Nombre del juego activo', juegos: [{ nombre, head: [...], rows: [[...], ...] }, ...] }
 *
 * Formato antiguo, clave «gu1:<id>»: { head, rows } (un solo juego por gráfico).
 * Al abrir la web se convierte en un juego llamado «Mis datos». El dato antiguo solo se borra
 * después de comprobar que el nuevo se ha guardado y se lee igual.
 *
 * Nada de lo que hay aquí debe romper la página: si el almacenamiento falla, está lleno o tiene
 * datos dañados, se devuelve un aviso y se sigue con los datos de ejemplo.
 */

const K1 = id => 'gu1:' + id;
const K2 = id => 'gu2:' + id;
const RESPALDO = id => 'gu-respaldo:' + id + ':' + Date.now();
export const NOMBRE_EJEMPLO = 'Ejemplo';
export const NOMBRE_MIGRADO = 'Mis datos';
export const LARGO_NOMBRE = 60;

/* Juego con los datos de ejemplo del gráfico. */
export function juegoEjemplo(def, nombre = NOMBRE_EJEMPLO) {
  return { nombre, head: def.columnas.map(x => x.nombre), rows: def.filas.map(r => def.columnas.map((_, i) => r[i] == null ? '' : String(r[i]))) };
}
/* Juego vacío: columnas del gráfico y una fila en blanco. */
export function juegoVacio(def, nombre) {
  return { nombre, head: def.columnas.map(x => x.nombre), rows: [def.columnas.map(() => '')] };
}

/* Comprueba un nombre: devuelve el texto del error o '' si vale. «excepto» = índice del juego que se renombra. */
export function errorNombre(registro, nombre, excepto = -1) {
  const n = String(nombre || '').trim();
  if (!n) return 'El nombre no puede estar vacío.';
  if (n.length > LARGO_NOMBRE) return 'El nombre es demasiado largo (máximo ' + LARGO_NOMBRE + ' caracteres).';
  const igual = registro.juegos.findIndex((j, i) => i !== excepto && j.nombre.trim().toLocaleLowerCase('es') === n.toLocaleLowerCase('es'));
  if (igual >= 0) return 'Ya hay un juego llamado «' + registro.juegos[igual].nombre + '» en este gráfico.';
  return '';
}
/* Nombre para duplicar: «Ejemplo (copia)», «Ejemplo (copia 2)»… el primero que no exista. */
export function nombreCopia(registro, nombre) {
  for (let k = 1; ; k++) {
    const suf = k === 1 ? ' (copia)' : ' (copia ' + k + ')';
    const n = nombre.slice(0, LARGO_NOMBRE - suf.length) + suf;
    if (!errorNombre(registro, n)) return n;
  }
}
/* «Juego» → «Juego», «Juego 2», «Juego 3»… el primero que no exista. */
export function nombreLibre(registro, base) {
  for (let k = 1; ; k++) {
    const n = (base + (k === 1 ? '' : ' ' + k)).slice(0, LARGO_NOMBRE);
    if (!errorNombre(registro, n)) return n;
  }
}

/* ---------- lectura ---------- */

/* Devuelve { registro, avisos }. registro = { juegos, activo (índice), borrarViejo, noSobrescribir }. */
export function cargar(def) {
  const avisos = [];
  const base = () => ({ juegos: [juegoEjemplo(def)], activo: 0 });
  let raw2, raw1;
  try { raw2 = localStorage.getItem(K2(def.id)); raw1 = localStorage.getItem(K1(def.id)); }
  catch (e) { return { registro: base(), avisos: [avisoSinAcceso(e)] }; }

  /* 1. Formato actual. */
  if (raw2 != null) {
    try { return { registro: leerV2(raw2, def), avisos }; }
    catch (e) {
      const r = base();
      const copia = respaldar(def.id, raw2);
      if (!copia) r.noSobrescribir = true;   /* sin copia de seguridad no se pisa el dato dañado */
      avisos.push('Los datos guardados de «' + def.nombre + '» estaban dañados y no se pueden leer [' + e.message + ']. Se muestran los de ejemplo. '
        + (copia ? 'Se ha guardado una copia de seguridad del dato dañado (' + copia + ').' : 'No se ha borrado nada, pero los cambios en este gráfico no se guardarán.'));
      return { registro: r, avisos };
    }
  }

  /* 2. Formato antiguo: se convierte en el juego «Mis datos». */
  if (raw1 != null) {
    let viejo;
    try { viejo = leerV1(raw1, def); }
    catch (e) {
      const copia = respaldar(def.id, raw1);
      if (copia) { try { localStorage.removeItem(K1(def.id)); } catch (e2) { /* se queda donde estaba */ } }
      avisos.push('Los datos antiguos de «' + def.nombre + '» estaban dañados y no se pueden leer [' + e.message + ']. Se muestran los de ejemplo. '
        + (copia ? 'Se ha guardado una copia de seguridad (' + copia + ').' : 'No se ha borrado nada.'));
      return { registro: base(), avisos };
    }
    const r = { juegos: [juegoEjemplo(def), { nombre: NOMBRE_MIGRADO, head: viejo.head, rows: viejo.rows }], activo: 1, borrarViejo: true };
    const error = guardar(def.id, r);   /* si sale bien, guardar() borra el dato antiguo */
    if (error) avisos.push('No se han podido pasar al formato nuevo los datos guardados de «' + def.nombre + '». Se muestran igualmente como «' + NOMBRE_MIGRADO + '» y los antiguos no se han borrado. ' + error);
    return { registro: r, avisos };
  }

  return { registro: base(), avisos };
}

function leerV2(raw, def) {
  const o = JSON.parse(raw);
  if (!o || typeof o !== 'object' || !Array.isArray(o.juegos) || !o.juegos.length) throw new Error('no tiene juegos');
  const juegos = [];
  o.juegos.forEach((j, k) => {
    if (!j || typeof j.nombre !== 'string') throw new Error('el juego ' + (k + 1) + ' no tiene nombre');
    const t = tabla(j, def, 'juego «' + j.nombre + '»');
    let nombre = j.nombre.trim().slice(0, LARGO_NOMBRE) || 'Sin nombre';
    /* Nombres repetidos (no debería pasar): se renombran en vez de perder datos. */
    if (errorNombre({ juegos }, nombre)) nombre = nombreLibre({ juegos }, nombre);
    juegos.push({ nombre, head: t.head, rows: t.rows });
  });
  const activo = Math.max(0, juegos.findIndex(j => j.nombre === o.activo));
  return { juegos, activo };
}
function leerV1(raw, def) {
  const o = JSON.parse(raw);
  return tabla(o, def, 'tabla');
}
/* Valida { head, rows } contra las columnas del gráfico y lo deja todo como texto. */
function tabla(o, def, que) {
  const n = def.columnas.length;
  if (!o || !Array.isArray(o.head) || !Array.isArray(o.rows)) throw new Error(que + ': formato desconocido');
  if (o.head.length !== n) throw new Error(que + ': tiene ' + o.head.length + ' columnas y este gráfico usa ' + n);
  if (!o.rows.length || !o.rows.every(Array.isArray)) throw new Error(que + ': filas no válidas');
  const txt = v => v == null ? '' : String(v);
  return { head: o.head.map(txt), rows: o.rows.map(r => def.columnas.map((_, i) => txt(r[i]))) };
}

/* ---------- escritura ---------- */

/* Guarda el registro. Devuelve '' si todo va bien o el texto del problema. */
export function guardar(id, registro) {
  if (registro.noSobrescribir) return 'Los cambios de este gráfico no se guardan para no pisar datos dañados que no se pudieron copiar.';
  const dato = JSON.stringify({ v: 2, activo: registro.juegos[registro.activo].nombre, juegos: registro.juegos.map(j => ({ nombre: j.nombre, head: j.head, rows: j.rows })) });
  try {
    localStorage.setItem(K2(id), dato);
    if (localStorage.getItem(K2(id)) !== dato) return 'El navegador no ha guardado bien los datos (al releerlos no coinciden).';
    if (registro.borrarViejo) { localStorage.removeItem(K1(id)); registro.borrarViejo = false; }
    return '';
  } catch (e) {
    if (lleno(e)) return 'El almacenamiento de este navegador está lleno: el último cambio no se ha guardado. Borra juegos que no uses para hacer sitio.';
    return avisoSinAcceso(e);
  }
}

/* Copia un dato dañado a otra clave antes de dejar de usarlo. Devuelve la clave o '' si no se pudo. */
function respaldar(id, raw) {
  try {
    const k = RESPALDO(id);
    localStorage.setItem(k, raw);
    return localStorage.getItem(k) === raw ? k : '';
  } catch (e) { return ''; }
}

const lleno = e => e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
function avisoSinAcceso(e) {
  return 'Este navegador no deja guardar datos [' + ((e && (e.name || e.message)) || 'sin motivo') + ']. Puedes usar la web, pero los cambios se perderán al cerrarla.';
}
