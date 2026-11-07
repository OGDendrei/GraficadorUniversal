/* Prueba con navegador real (Chromium headless, vía Playwright).
 *
 * Qué hace:
 *  1. Sirve el proyecto en local (servidor propio, sin dependencias).
 *  2. Abre la página en móvil (390 px) y escritorio (1280 px), en tema claro y oscuro.
 *  3. Recorre los 30 gráficos: la lámina y las miniaturas deben dibujarse sin errores,
 *     sin desbordar la pantalla a lo ancho y sin pedir nada a internet.
 *  4. Repite el recorrido con datos raros: una sola fila, texto en vez de números,
 *     celdas vacías y números negativos. Informa de lo que pasa en cada caso.
 *  5. Prueba la tabla: escribir, guardar, recargar, pegar desde hoja de cálculo,
 *     añadir y borrar filas y «Restaurar ejemplo».
 *     Juegos de datos: crear, duplicar, renombrar, borrar, nombres no válidos, último juego,
 *     juego activo al recargar, conversión del formato antiguo y almacenamiento dañado, lleno o bloqueado.
 *  6. Paridad: compara cada gráfico con el prototipo (prototipo/graficador.html).
 *
 * Uso:   node pruebas/recorrido.mjs            (resumen en pantalla)
 *        node pruebas/recorrido.mjs --capturas (guarda capturas en pruebas/capturas/)
 * Necesita Playwright con Chromium:  npm i -D playwright && npx playwright install chromium
 * Sale con código 1 si algo falla.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.error('No encuentro Playwright. Instálalo con:  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPTURAS = process.argv.includes('--capturas');
const DIR_CAPTURAS = path.join(RAIZ, 'pruebas', 'capturas');
if (CAPTURAS) fs.mkdirSync(DIR_CAPTURAS, { recursive: true });

/* ---------- servidor estático ---------- */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };
/* El prototipo es un fragmento pensado para ir envuelto; aquí se le pone el mismo esqueleto que index.html. */
const ESQUELETO = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}</style></head><body>';
const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let ruta = decodeURIComponent(url.pathname);
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = path.join(RAIZ, path.normalize(ruta));
  if (!archivo.startsWith(RAIZ) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) { res.writeHead(404); res.end('no existe'); return; }
  let cuerpo = fs.readFileSync(archivo);
  if (ruta === '/prototipo/graficador.html') cuerpo = Buffer.concat([Buffer.from(ESQUELETO), cuerpo, Buffer.from('</body></html>')]);
  res.writeHead(200, { 'content-type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(cuerpo);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + servidor.address().port;

/* ---------- utilidades de la prueba ---------- */
const fallos = [];
const fallo = (donde, que) => { fallos.push(donde + ' → ' + que); };
const CONFIGS = [
  { nombre: 'móvil-claro', viewport: { width: 390, height: 844 }, movil: true, tema: 'light' },
  { nombre: 'móvil-oscuro', viewport: { width: 390, height: 844 }, movil: true, tema: 'dark' },
  { nombre: 'escritorio-claro', viewport: { width: 1280, height: 900 }, movil: false, tema: 'light' },
  { nombre: 'escritorio-oscuro', viewport: { width: 1280, height: 900 }, movil: false, tema: 'dark' }
];
const DATOS_RAROS = ['una-fila', 'texto', 'vacias', 'negativos'];

const navegador = await chromium.launch();

async function nuevaPagina(cfg, { prototipo = false } = {}) {
  const ctx = await navegador.newContext({ viewport: cfg.viewport, isMobile: cfg.movil, hasTouch: cfg.movil, deviceScaleFactor: 1, colorScheme: cfg.tema, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.errores = []; page.externas = [];
  page.setDefaultTimeout(5000);
  page.on('pageerror', e => page.errores.push('error JS: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') page.errores.push('consola: ' + m.text()); });
  await ctx.route('**/*', ruta => {
    const u = new URL(ruta.request().url());
    if (u.hostname === '127.0.0.1') return ruta.continue();
    if (prototipo) {
      /* El prototipo pide las librerías a un CDN: se le sirven las copias de vendor/ para comparar en igualdad. */
      const local = u.pathname.includes('echarts@4.9.0') ? 'vendor/world-echarts-4.9.0.js' : /echarts/.test(u.pathname) ? 'vendor/echarts-5.5.1.min.js' : /d3/.test(u.pathname) ? 'vendor/d3-7.8.5.min.js' : null;
      if (local) return ruta.fulfill({ path: path.join(RAIZ, local), contentType: 'text/javascript' });
    }
    page.externas.push(u.href);
    return ruta.abort();
  });
  return page;
}

/* Espera a que el dibujo deje de cambiar (algunas etiquetas aparecen con un fundido). */
const quieto = async page => {
  let antes = '';
  for (let i = 0; i < 20; i++) {
    const ahora = await page.evaluate(() => document.querySelector('#canvas').innerHTML);
    if (ahora === antes) return;
    antes = ahora; await page.waitForTimeout(100);
  }
};
const dosFrames = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

/* Lista de gráficos (id, grupo, columnas y filas de ejemplo) leída de los propios módulos. */
async function catalogo(page) {
  return page.evaluate(async () => {
    const { GRAFICOS } = await import('/js/graficos/index.js');
    return GRAFICOS.map(c => ({ id: c.id, grupo: c.grupo, nombre: c.nombre, columnas: c.columnas, filas: c.filas.map(r => c.columnas.map((_, i) => r[i] == null ? '' : String(r[i]))) }));
  });
}

async function esperarArranque(page) {
  await page.waitForFunction(() => document.querySelector('#canvas')?.childElementCount > 0 && document.querySelector('#tiles')?.childElementCount > 0, null, { timeout: 15000 });
}

/* Abre un gráfico pulsando su pestaña y su miniatura, como haría una persona. */
async function abrir(page, c, grupoProto) {
  const g = grupoProto ? grupoProto[c.grupo] : c.grupo;
  await page.click('#tabs [data-g="' + g + '"]');
  await page.click('#tiles [data-id="' + c.id + '"]');
  await dosFrames(page);
  if (c.id === 'choro') await page.waitForFunction(() => !/Cargando el mapa/.test(document.querySelector('#canvas').textContent), null, { timeout: 10000 }).catch(() => {});
}

/* Describe qué hay dibujado en la lámina y en las miniaturas del grupo. */
async function estado(page) {
  return page.evaluate(() => {
    const cv = document.querySelector('#canvas');
    const m = cv.querySelector('.msg');
    const dibujado = !m && !!cv.querySelector('svg, .st, .bul, .sp');
    const thumbs = [...document.querySelectorAll('#tiles .thumb')].map(t => ({ id: t.id.slice(3), msg: t.querySelector('.msg')?.textContent || '', vacio: t.childElementCount === 0, titulo: t.title || '' }));
    const desborde = document.documentElement.scrollWidth - window.innerWidth;
    /* Para el mapa: cuántos países tienen el color de «sin datos» (el de la rejilla). */
    const gris = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim().toLowerCase();
    const paisesSinDatos = [...cv.querySelectorAll('path')].filter(x => (x.getAttribute('fill') || '').toLowerCase() === gris).length;
    return { dibujado, mensaje: m ? m.textContent : '', thumbs, desborde, paisesSinDatos };
  });
}

/* Convierte las filas de ejemplo en datos raros. */
function datosRaros(c, tipo) {
  const filas = c.filas.map(r => r.slice());
  const esNum = i => c.columnas[i].tipo === 'numero';
  if (tipo === 'una-fila') return filas.slice(0, 1);
  if (tipo === 'texto') return filas.map(r => r.map((v, i) => esNum(i) ? 'abc' : v));
  if (tipo === 'vacias') return filas.map((r, k) => r.map((v, i) => (k + i) % 2 === 0 ? '' : v));
  if (tipo === 'negativos') return filas.map(r => r.map((v, i) => {
    if (esNum(i)) { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? v : String(-Math.abs(n)); }
    if (c.id === 'spark' && i === 1) return v.split(/\s+/).map(x => String(-Math.abs(parseFloat(x)))).join(' ');
    return v;
  }));
  return filas;
}

/* Casos con datos raros que deben dar un resultado concreto (si no, es un fallo). */
const ESPERADO = {
  'chord/texto': e => /Faltan datos/.test(e.mensaje) || 'debería decir «Faltan datos»',
  'chord/vacias': e => /Faltan datos/.test(e.mensaje) || 'debería decir «Faltan datos»',
  'chord/negativos': e => /Faltan datos/.test(e.mensaje) || 'debería decir «Faltan datos»',
  'stream/negativos': e => /negativos/.test(e.mensaje) || 'debería avisar de que no admite negativos',
  'calendar/negativos': e => /negativos/.test(e.mensaje) || 'debería avisar de que no admite negativos',
  'calendar/una-fila': e => /dos días/.test(e.mensaje) || 'debería avisar de que hacen falta dos días',
  'choro/una-fila': e => (e.dibujado && e.paisesSinDatos > 150) || 'los países sin datos deberían quedar en gris (hay ' + e.paisesSinDatos + ')'
};

/* Pulsa «Descargar PNG» y comprueba la imagen: nombre, PNG válido, buena resolución,
   fondo sólido del tema visible, título dibujado y gráfico con contenido. */
const slug = n => 'grafico-' + n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '.png';
const pngs = { ok: 0, mal: 0 };
async function probarPNG(page, c, cfg, donde) {
  const mal = que => { pngs.mal++; fallo(donde, 'PNG: ' + que); };
  const descarga = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#png')]).then(r => r[0]).catch(() => null);
  if (!descarga) return mal('el botón no descarga nada. ' + (await page.locator('#png-estado').textContent()));
  if (descarga.suggestedFilename() !== slug(c.nombre)) mal('el archivo se llama «' + descarga.suggestedFilename() + '» y debería ser «' + slug(c.nombre) + '»');
  const buf = fs.readFileSync(await descarga.path());
  if (buf.length < 30 || buf.toString('latin1', 1, 4) !== 'PNG') return mal('el archivo no es un PNG');
  const ancho = buf.readUInt32BE(16), alto = buf.readUInt32BE(20);
  if (ancho < 1200) mal('poca resolución: ' + ancho + ' px de ancho');
  const fondo = await page.evaluate(() => getComputedStyle(document.querySelector('#plate')).backgroundColor);
  const r = await page.evaluate(async ({ b64, fondo }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const f = fondo.match(/\d+/g).map(Number);
    const px = i => [d[i], d[i + 1], d[i + 2], d[i + 3]];
    const distinto = i => Math.abs(d[i] - f[0]) + Math.abs(d[i + 1] - f[1]) + Math.abs(d[i + 2] - f[2]) > 30;
    let transparentes = 0, titulo = 0, grafico = 0;
    const bandaTitulo = Math.round(cv.height * 0.08), escala = cv.width / 400;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      const i = (y * cv.width + x) * 4;
      if (d[i + 3] < 255) transparentes++;
      if (distinto(i)) { if (y < bandaTitulo) titulo++; else grafico++; }
    }
    return { esquina: px(0), transparentes, titulo, grafico, total: cv.width * cv.height, f };
  }, { b64: buf.toString('base64'), fondo });
  if (r.transparentes) mal(r.transparentes + ' píxeles transparentes (el fondo debe ser sólido)');
  if (r.esquina.slice(0, 3).join() !== r.f.join()) mal('el fondo es rgb(' + r.esquina.slice(0, 3) + ') y debería ser ' + fondo + ' (tema ' + cfg.tema + ')');
  if (r.titulo < 200) mal('no se ve el título');
  if (r.grafico < r.total * 0.004) mal('la imagen casi no tiene gráfico (' + r.grafico + ' píxeles de dibujo)');
  if (CAPTURAS) fs.writeFileSync(path.join(DIR_CAPTURAS, 'png_' + cfg.nombre + '_' + c.id + '.png'), buf);
  pngs.ok++;
}

const resumen = {};   /* resumen[tipoDatos][id] = 'ok' | 'aviso: …' | 'ERROR: …' */
const anota = (tipo, id, cfg, txt) => { resumen[tipo] ??= {}; resumen[tipo][id] ??= {}; resumen[tipo][id][cfg] = txt; };

/* ---------- 1-4. recorrido por configuraciones ---------- */
let CAT = null;
for (const cfg of CONFIGS) {
  const page = await nuevaPagina(cfg);
  await page.goto(BASE + '/index.html');
  await esperarArranque(page);
  CAT ??= await catalogo(page);
  const tema = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const temaEsperado = cfg.tema === 'dark' ? 'rgb(13, 13, 13)' : 'rgb(249, 249, 247)';
  if (tema !== temaEsperado) fallo(cfg.nombre, 'el fondo es ' + tema + ' y debería ser ' + temaEsperado);

  for (const tipo of ['ejemplo', ...DATOS_RAROS]) {
    if (tipo !== 'ejemplo') {
      await page.evaluate(({ cat, datos }) => {
        localStorage.clear();
        cat.forEach(c => localStorage.setItem('gu1:' + c.id, JSON.stringify({ head: c.columnas.map(x => x.nombre), rows: datos[c.id] })));
      }, { cat: CAT, datos: Object.fromEntries(CAT.map(c => [c.id, datosRaros(c, tipo)])) });
      await page.reload();
      await esperarArranque(page);
    }
    for (const c of CAT) {
      await abrir(page, c);
      const e = await estado(page);
      const donde = cfg.nombre + ' / ' + tipo + ' / ' + c.id;
      let txt;
      if (e.dibujado) txt = 'ok';
      else if (/No se ha podido/.test(e.mensaje)) { txt = 'ERROR: ' + e.mensaje; fallo(donde, e.mensaje); }
      else txt = 'aviso: ' + e.mensaje;
      const esperado = ESPERADO[c.id + '/' + tipo];
      if (esperado) { const r = esperado(e); if (r !== true) fallo(donde, r + ' y da: ' + txt); }
      if (tipo === 'ejemplo' && txt !== 'ok') fallo(donde, 'con los datos de ejemplo no se dibuja: ' + e.mensaje);
      anota(tipo, c.id, cfg.nombre, txt);
      if (e.desborde > 0) fallo(donde, 'la página se sale ' + e.desborde + ' px a lo ancho');
      const th = e.thumbs.find(t => t.id === c.id);
      if (!th || th.vacio) fallo(donde, 'miniatura vacía');
      else if (/No se ha podido/.test(th.msg)) fallo(donde, 'miniatura con error: ' + (th.titulo || th.msg));
      if (tipo === 'ejemplo') await probarPNG(page, c, cfg, donde);
      if (CAPTURAS && (tipo === 'ejemplo' || cfg.nombre === 'escritorio-claro')) {
        await page.locator('#plate').screenshot({ path: path.join(DIR_CAPTURAS, cfg.nombre + '_' + tipo + '_' + c.id + '.png') });
      }
    }
    if (CAPTURAS && tipo === 'ejemplo') await page.screenshot({ path: path.join(DIR_CAPTURAS, cfg.nombre + '_pagina.png'), fullPage: true });
  }
  page.errores.forEach(x => fallo(cfg.nombre, x));
  page.externas.forEach(x => fallo(cfg.nombre, 'intentó cargar de internet: ' + x));
  await page.context().close();
}

/* ---------- 5. la tabla de datos ---------- */
/* Juego activo guardado en localStorage para un gráfico. */
const juegoGuardado = (page, id) => page.evaluate(id => { const o = JSON.parse(localStorage.getItem('gu2:' + id) || 'null'); return o && o.juegos.find(j => j.nombre === o.activo); }, id);
{
  const cfg = CONFIGS[2];
  const page = await nuevaPagina(cfg);
  await page.goto(BASE + '/index.html');
  await esperarArranque(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await esperarArranque(page);
  const comprobar = (cond, que) => { if (!cond) fallo('tabla', que); };
  const filas = () => page.locator('#dt tbody tr').count();

  /* Escribir un valor: se redibuja y se guarda. */
  const celda = page.locator('#dt input[data-r="0"][data-c="1"]');
  await celda.fill('40');
  await page.waitForTimeout(400);
  const guardado = await juegoGuardado(page, 'line');
  comprobar(guardado && guardado.rows[0][1] === '40', 'escribir una celda no se guarda en localStorage');
  await page.reload(); await esperarArranque(page);
  comprobar(await page.locator('#dt input[data-r="0"][data-c="1"]').inputValue() === '40', 'al recargar no se recupera el valor guardado');

  /* Cambiar el nombre de una columna. */
  await page.locator('#dt input[data-h="1"]').fill('Grados');
  await page.waitForTimeout(400);
  comprobar((await juegoGuardado(page, 'line'))?.head[1] === 'Grados', 'el nombre de columna no se guarda');

  /* Pegar 3 filas × 2 columnas desde una hoja de cálculo al final de la tabla. */
  const antes = await filas();
  await page.locator('#dt input[data-r="' + (antes - 1) + '"][data-c="0"]').evaluate(el => {
    const dt = new DataTransfer(); dt.setData('text/plain', '23:00\t7\n23:30\t6,5\n23:59\t6\n');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(400);
  comprobar(await filas() === antes + 2, 'pegar 3 filas sobre la última debería dejar ' + (antes + 2) + ' filas y deja ' + await filas());
  comprobar(await page.locator('#dt input[data-r="' + (antes + 1) + '"][data-c="1"]').inputValue() === '6', 'el valor pegado no está en su celda');

  /* Añadir y borrar filas. */
  const n0 = await filas();
  await page.click('#addrow');
  comprobar(await filas() === n0 + 1, '«Añadir fila» no añade una fila');
  comprobar(await page.evaluate(() => document.activeElement?.dataset?.r) === String(n0), '«Añadir fila» no pone el cursor en la fila nueva');
  await page.click('#dt [data-del="0"]');
  comprobar(await filas() === n0, 'borrar una fila no la quita');

  /* Restaurar ejemplo: pide confirmación; si se cancela no cambia nada. */
  page.once('dialog', d => d.dismiss());
  await page.click('#reset');
  await page.waitForTimeout(300);
  comprobar(await page.locator('#dt input[data-h="1"]').inputValue() === 'Grados', '«Restaurar ejemplo» cancelado no debería cambiar nada');
  page.once('dialog', d => d.accept());
  await page.click('#reset');
  await page.waitForTimeout(300);
  comprobar((await juegoGuardado(page, 'line'))?.rows[0][1] === '8', '«Restaurar ejemplo» no guarda los datos de ejemplo');
  comprobar(await page.locator('#dt input[data-r="0"][data-c="1"]').inputValue() === '8', '«Restaurar ejemplo» no devuelve los datos de ejemplo');
  comprobar(await page.locator('#dt input[data-h="1"]').inputValue() === 'Temperatura (°C)', '«Restaurar ejemplo» no devuelve el nombre de columna');

  /* Un gráfico no estropea los datos de otro. */
  await page.click('#tabs [data-g="raros"]');
  await page.click('#tiles [data-id="pareto"]');
  comprobar(await page.locator('#dt tbody tr').count() === 6, 'al cambiar de gráfico la tabla no muestra sus datos');

  page.errores.forEach(x => fallo('tabla', x));
  await page.context().close();
}

/* ---------- 5b. juegos de datos ---------- */
const opciones = page => page.$$eval('#juego option', os => os.map(o => o.textContent));
const activoSel = page => page.$eval('#juego', s => s.selectedOptions[0]?.textContent);
/* Pulsa un botón del juego, escribe el nombre y acepta. Devuelve el error mostrado ('' si no hay). */
async function formNombre(page, boton, nombre) {
  await page.click(boton);
  if (nombre != null) await page.fill('#j-nombre', nombre);
  await page.click('#j-form button[type="submit"]');
  await page.waitForTimeout(100);
  return (await page.locator('#j-error').isVisible()) ? await page.locator('#j-error').textContent() : '';
}
for (const cfg of [CONFIGS[2], CONFIGS[1]]) {
  const page = await nuevaPagina(cfg);
  const donde = 'juegos ' + cfg.nombre;
  const comprobar = (cond, que) => { if (!cond) fallo(donde, que); };
  try {
  await page.goto(BASE + '/index.html'); await esperarArranque(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await esperarArranque(page);

  /* Al principio: un solo juego «Ejemplo» y no se puede borrar. */
  comprobar(JSON.stringify(await opciones(page)) === '["Ejemplo"]', 'al empezar debería haber solo «Ejemplo» y hay ' + await opciones(page));
  comprobar(await page.locator('#j-borrar').isDisabled(), '«Borrar» debería estar desactivado con un solo juego');
  await page.locator('#j-borrar').evaluate(b => { b.disabled = false; b.click(); b.disabled = true; });   /* aunque se fuerce */
  comprobar((await opciones(page)).length === 1, 'se ha podido borrar el último juego');

  /* Los botones caben (sobre todo a 390 px). */
  const fuera = await page.evaluate(() => [...document.querySelectorAll('#juegos select, #juegos button, .edh button')].filter(b => b.getBoundingClientRect().right > document.querySelector('#plate').getBoundingClientRect().right + 0.5).map(b => b.textContent || b.id));
  comprobar(!fuera.length, 'se salen de la lámina: ' + fuera.join(', '));
  const cortados = await page.evaluate(() => [...document.querySelectorAll('#juegos button, .edh button')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent));
  comprobar(!cortados.length, 'el texto no cabe en los botones: ' + cortados.join(', '));

  /* Nuevo: rechaza vacío y repetido (sin importar mayúsculas ni espacios); crea un juego vacío. */
  let err = await formNombre(page, '#j-nuevo', '   ');
  comprobar(/vacío/.test(err), 'un nombre vacío debería rechazarse (error: «' + err + '»)');
  err = await formNombre(page, '#j-nuevo', ' ejemplo ');
  comprobar(/Ya hay/.test(err), 'un nombre repetido debería rechazarse (error: «' + err + '»)');
  comprobar((await opciones(page)).length === 1, 'un nombre rechazado no debería crear juego');
  err = await formNombre(page, '#j-nuevo', 'Enero');
  comprobar(!err && await activoSel(page) === 'Enero', '«Nuevo» no crea y activa «Enero» (' + err + ')');
  comprobar(await page.locator('#dt tbody tr').count() === 1 && await page.locator('#dt input[data-r="0"][data-c="1"]').inputValue() === '', 'el juego nuevo debería estar vacío');
  comprobar(await page.locator('#dt input[data-h="1"]').inputValue() === 'Temperatura (°C)', 'el juego nuevo debería tener las columnas del gráfico');
  comprobar(await page.locator('#canvas .msg').count() === 1 && await page.locator('#th-line .msg').count() === 1, 'lámina y miniatura deberían usar el juego vacío');
  await page.locator('#dt input[data-r="0"][data-c="0"]').fill('L');
  await page.locator('#dt input[data-r="0"][data-c="1"]').fill('5');
  await page.waitForTimeout(400);

  /* Duplicar: propone «Ejemplo (copia)» y copia los datos. */
  await page.selectOption('#juego', { label: 'Ejemplo' });
  comprobar(await page.locator('#dt tbody tr').count() === 12 && await page.locator('#th-line svg').count() === 1, 'al volver a «Ejemplo» no vuelven sus datos');
  await page.click('#j-duplicar');
  comprobar(await page.inputValue('#j-nombre') === 'Ejemplo (copia)', 'Duplicar debería proponer «Ejemplo (copia)» y propone «' + await page.inputValue('#j-nombre') + '»');
  await page.click('#j-form button[type="submit"]'); await page.waitForTimeout(100);
  comprobar(await activoSel(page) === 'Ejemplo (copia)' && await page.locator('#dt tbody tr').count() === 12, '«Duplicar» no crea la copia con los datos');
  await page.selectOption('#juego', { label: 'Ejemplo' });
  await page.click('#j-duplicar');
  comprobar(await page.inputValue('#j-nombre') === 'Ejemplo (copia 2)', 'la segunda copia debería proponer «Ejemplo (copia 2)»');
  await page.click('#j-cancelar');
  comprobar(await page.locator('#j-form').isHidden() && (await opciones(page)).length === 3, '«Cancelar» no cierra el formulario sin crear nada');

  /* Renombrar. */
  await page.selectOption('#juego', { label: 'Ejemplo (copia)' });
  err = await formNombre(page, '#j-renombrar', 'ENERO');
  comprobar(/Ya hay/.test(err), 'renombrar a un nombre que ya existe debería rechazarse');
  err = await formNombre(page, '#j-renombrar', '');
  comprobar(/vacío/.test(err), 'renombrar a vacío debería rechazarse');
  await page.click('#j-cancelar');
  err = await formNombre(page, '#j-renombrar', null);   /* su mismo nombre vale */
  comprobar(!err, 'renombrar con el mismo nombre debería valer (' + err + ')');
  err = await formNombre(page, '#j-renombrar', 'Febrero');
  comprobar(!err && JSON.stringify(await opciones(page)) === '["Ejemplo","Enero","Febrero"]', '«Renombrar» no cambia el nombre: ' + await opciones(page));
  await page.locator('#dt input[data-r="0"][data-c="1"]').fill('77');
  await page.waitForTimeout(400);

  /* Restaurar ejemplo solo afecta al juego activo. */
  await page.selectOption('#juego', { label: 'Enero' });
  page.once('dialog', d => d.accept());
  await page.click('#reset'); await page.waitForTimeout(300);
  comprobar(await page.locator('#dt tbody tr').count() === 12 && await activoSel(page) === 'Enero', '«Restaurar ejemplo» no restaura el juego activo');
  await page.selectOption('#juego', { label: 'Febrero' });
  comprobar(await page.locator('#dt input[data-r="0"][data-c="1"]').inputValue() === '77', '«Restaurar ejemplo» ha tocado otro juego');

  /* Al recargar se mantienen los juegos y el activo. */
  await page.reload(); await esperarArranque(page);
  comprobar(await activoSel(page) === 'Febrero' && (await opciones(page)).length === 3, 'al recargar no se mantiene el juego activo (sale «' + await activoSel(page) + '»)');
  comprobar(await page.locator('#dt input[data-r="0"][data-c="1"]').inputValue() === '77', 'al recargar se pierden los datos del juego');

  /* El PNG usa el juego activo (lleva su nombre en el archivo del gráfico y se genera bien). */
  const png = await Promise.all([page.waitForEvent('download'), page.click('#png')]).then(r => r[0]).catch(() => null);
  comprobar(png && png.suggestedFilename() === 'grafico-lineas.png', 'el PNG no se descarga con un juego propio');

  /* Borrar: pide confirmación; al cancelar no borra. */
  page.once('dialog', d => d.dismiss());
  await page.click('#j-borrar');
  comprobar((await opciones(page)).length === 3, 'Borrar cancelado no debería borrar');
  page.once('dialog', d => d.accept());
  await page.click('#j-borrar');
  comprobar(JSON.stringify(await opciones(page)) === '["Ejemplo","Enero"]' && await activoSel(page) === 'Enero', 'Borrar no quita «Febrero»: ' + await opciones(page));
  page.once('dialog', d => d.accept());
  await page.click('#j-borrar');
  comprobar(JSON.stringify(await opciones(page)) === '["Ejemplo"]' && await page.locator('#j-borrar').isDisabled(), 'tras borrar debería quedar solo «Ejemplo» y no poder borrarse');
  await page.reload(); await esperarArranque(page);
  comprobar(JSON.stringify(await opciones(page)) === '["Ejemplo"]', 'el borrado no se guarda');
  comprobar(await page.locator('#avisos').isHidden(), 'aparece un aviso sin motivo');

  } catch (e) { fallo(donde, 'la prueba se interrumpió: ' + String(e.message).split('\n')[0]); }

  page.errores.forEach(x => fallo(donde, x));
  await page.context().close();
}

/* ---------- 5c. formato antiguo y almacenamiento dañado o lleno ---------- */
{
  const cfg = CONFIGS[2];
  const viejo = { head: ['Categoría', 'Mi serie', 'Otra', 'Serie 3'], rows: [['Pan', '3', '4', ''], ['Leche', '1,5', '2', ''], ['Huevos', '2', '', '']] };

  /* a) Formato antiguo: pasa a «Mis datos» sin perder nada y se borra el antiguo solo si todo fue bien. */
  {
    const page = await nuevaPagina(cfg), donde = 'formato antiguo';
    const comprobar = (cond, que) => { if (!cond) fallo(donde, que); };
    try {
    await page.goto(BASE + '/index.html'); await esperarArranque(page);
    await page.evaluate(v => { localStorage.clear(); localStorage.setItem('gu1:bar', JSON.stringify(v)); }, viejo);
    await page.reload(); await esperarArranque(page);
    await page.click('#tiles [data-id="bar"]');
    comprobar(JSON.stringify(await opciones(page)) === '["Ejemplo","Mis datos"]' && await activoSel(page) === 'Mis datos', 'no se crea el juego «Mis datos» activo: ' + await opciones(page));
    const tabla = await page.$$eval('#dt tbody tr', trs => trs.map(tr => [...tr.querySelectorAll('input')].map(i => i.value)));
    comprobar(JSON.stringify(tabla) === JSON.stringify(viejo.rows), 'los datos convertidos no coinciden: ' + JSON.stringify(tabla));
    comprobar(await page.locator('#dt input[data-h="1"]').inputValue() === 'Mi serie', 'se pierde el nombre de columna antiguo');
    const ls = await page.evaluate(() => ({ v1: localStorage.getItem('gu1:bar'), v2: JSON.parse(localStorage.getItem('gu2:bar') || 'null') }));
    comprobar(ls.v1 === null, 'el dato antiguo debería borrarse tras convertirlo bien');
    comprobar(ls.v2 && JSON.stringify(ls.v2.juegos.find(j => j.nombre === 'Mis datos')?.rows) === JSON.stringify(viejo.rows), 'el formato nuevo no guarda los datos convertidos');
    comprobar(await page.locator('#avisos').isHidden(), 'la conversión correcta no debería mostrar avisos');
    } catch (e) { fallo(donde, 'la prueba se interrumpió: ' + String(e.message).split('\n')[0]); }
    page.errores.forEach(x => fallo(donde, x));
    await page.context().close();
  }

  /* b) Formato antiguo con el almacenamiento lleno: se ven los datos, se avisa y NO se borra el antiguo. */
  {
    const page = await nuevaPagina(cfg), donde = 'formato antiguo con almacenamiento lleno';
    const comprobar = (cond, que) => { if (!cond) fallo(donde, que); };
    try {
    await page.goto(BASE + '/index.html'); await esperarArranque(page);
    await page.evaluate(v => { localStorage.clear(); localStorage.setItem('gu1:bar', JSON.stringify(v)); }, viejo);
    await page.addInitScript(() => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (String(k).startsWith('gu')) throw new DOMException('lleno', 'QuotaExceededError'); return orig.call(this, k, v); };
    });
    await page.reload(); await esperarArranque(page);
    await page.click('#tiles [data-id="bar"]');
    comprobar(await activoSel(page) === 'Mis datos' && await page.locator('#dt input[data-r="0"][data-c="0"]').inputValue() === 'Pan', 'con el almacenamiento lleno no se muestran los datos antiguos');
    comprobar(await page.evaluate(() => localStorage.getItem('gu1:bar')) !== null, 'se ha borrado el dato antiguo sin poder convertirlo');
    const aviso = await page.locator('#avisos').textContent();
    comprobar(await page.locator('#avisos').isVisible() && /no se han borrado/.test(aviso) && /lleno/.test(aviso), 'falta un aviso claro: «' + aviso + '»');
    /* Y la web sigue funcionando: se puede editar y se avisa de que no se guarda. */
    await page.locator('#dt input[data-r="0"][data-c="1"]').fill('9'); await page.waitForTimeout(400);
    comprobar(await page.locator('#canvas svg').count() === 1, 'con el almacenamiento lleno el gráfico deja de dibujarse');
    } catch (e) { fallo(donde, 'la prueba se interrumpió: ' + String(e.message).split('\n')[0]); }
    page.errores.forEach(x => fallo(donde, x));
    await page.context().close();
  }

  /* c) Datos dañados (formato nuevo y antiguo): aviso, copia de seguridad y datos de ejemplo. */
  {
    const page = await nuevaPagina(cfg), donde = 'datos dañados';
    const comprobar = (cond, que) => { if (!cond) fallo(donde, que); };
    try {
    await page.goto(BASE + '/index.html'); await esperarArranque(page);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('gu2:pie', '{esto no es JSON');
      localStorage.setItem('gu2:area', JSON.stringify({ v: 2, activo: 'X', juegos: [{ nombre: 'X', head: ['a'], rows: [['1']] }] }));
      localStorage.setItem('gu1:hist', '[[[');
      localStorage.setItem('gu2:line', 'null');
    });
    await page.reload(); await esperarArranque(page);
    comprobar(await page.locator('#canvas svg').count() === 1, 'con datos dañados la página no dibuja');
    const aviso = await page.locator('#avisos').textContent();
    comprobar(['Sectores (quesitos)', 'Área', 'Histograma'].every(n => aviso.includes('«' + n + '»')) && /dañados/.test(aviso), 'el aviso no nombra los gráficos dañados: «' + aviso + '»');
    const respaldos = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('gu-respaldo:')).map(k => [k.split(':')[1], localStorage.getItem(k)]));
    comprobar(respaldos.some(r => r[0] === 'pie' && r[1] === '{esto no es JSON') && respaldos.some(r => r[0] === 'hist' && r[1] === '[[['), 'no se han guardado copias de seguridad de los datos dañados');
    await page.click('#tiles [data-id="pie"]');
    comprobar(await activoSel(page) === 'Ejemplo' && await page.locator('#canvas svg').count() === 1, 'el gráfico dañado no vuelve a los datos de ejemplo');
    await page.click('#avisos-cerrar');
    comprobar(await page.locator('#avisos').isHidden(), '«Entendido» no cierra el aviso');
    } catch (e) { fallo(donde, 'la prueba se interrumpió: ' + String(e.message).split('\n')[0]); }
    page.errores.forEach(x => fallo(donde, x));
    await page.context().close();
  }

  /* d) Navegador que no deja usar localStorage: la página funciona y avisa. */
  {
    const page = await nuevaPagina(cfg), donde = 'sin localStorage';
    const comprobar = (cond, que) => { if (!cond) fallo(donde, que); };
    try {
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqueado', 'SecurityError'); } }); });
    await page.goto(BASE + '/index.html'); await esperarArranque(page);
    comprobar(await page.locator('#canvas svg').count() === 1, 'sin localStorage no se dibuja');
    comprobar(/no deja guardar/.test(await page.locator('#avisos').textContent()), 'sin localStorage no se avisa');
    const err = await formNombre(page, '#j-nuevo', 'Prueba');
    comprobar(!err && await activoSel(page) === 'Prueba', 'sin localStorage no se pueden crear juegos');
    } catch (e) { fallo(donde, 'la prueba se interrumpió: ' + String(e.message).split('\n')[0]); }
    page.errores.forEach(x => fallo(donde, x));
    await page.context().close();
  }
}

/* ---------- 5d. coordenadas paralelas: ninguna línea se sale del área ----------
   Cada eje debe abarcar los valores de todas las filas (el prototipo solo usaba la primera). */
{
  const cab = ['Coche', 'Potencia (CV)', 'Precio (k€)', 'Peso (kg)', 'Consumo (l/100)'];
  const casos = {
    'ejemplo': null,
    'una fila': [['Urbano', '70', '14', '1050', '5,2']],
    'columna con valores iguales': [['A', '100', '20', '1200', '5'], ['B', '150', '20', '1300', '6'], ['C', '220', '20', '1100', '7']],
    'todo igual': [['A', '5', '5', '5', '5'], ['B', '5', '5', '5', '5']],
    'negativos': [['A', '-70', '14', '-1050', '-5,2'], ['B', '-220', '-48', '1350', '8,8'], ['C', '0', '-3', '-20', '-0,5']],
    'celdas vacías': [['A', '', '14', '1050', '5'], ['B', '220', '', '1650', ''], ['C', '95', '22', '', '7,4']],
    'decimales grandes': [['A', '0,001', '123456', '9,99', '1e3'], ['B', '0,003', '987654', '10,01', '2e3']]
  };
  for (const cfg of [CONFIGS[2], CONFIGS[1]]) {
    const page = await nuevaPagina(cfg);
    await page.goto(BASE + '/index.html'); await esperarArranque(page);
    for (const [nombre, filas] of Object.entries(casos)) {
      const donde = 'paralelas ' + cfg.nombre + ' / ' + nombre;
      await page.evaluate(({ filas, cab }) => {
        localStorage.clear();
        if (filas) localStorage.setItem('gu2:parallel', JSON.stringify({ v: 2, activo: 'P', juegos: [{ nombre: 'P', head: cab, rows: filas }] }));
      }, { filas, cab });
      await page.reload(); await esperarArranque(page);
      await page.click('#tabs [data-g="raros"]'); await page.click('#tiles [data-id="parallel"]'); await dosFrames(page);
      const r = await page.evaluate(() => ['canvas', 'th-parallel'].map(id => {
        const inst = echarts.getInstanceByDom(document.getElementById(id));
        if (!inst) return { id, error: 'no hay gráfico (' + document.getElementById(id).textContent + ')' };
        const m = inst.getModel(), cs = m.getComponent('parallel').coordinateSystem, rect = cs.getRect();
        const fuera = [];
        m.eachSeriesByType('parallel', serie => {
          const d = serie.getData();
          cs.dimensions.forEach((dim, i) => {
            const ext = m.getComponent('parallelAxis', i).axis.scale.getExtent();
            for (let k = 0; k < d.count(); k++) {
              const v = d.get(dim, k), pt = cs.dataToPoint(v, dim);
              const dentro = v >= ext[0] - 1e-9 && v <= ext[1] + 1e-9 && pt[1] >= rect.y - 0.5 && pt[1] <= rect.y + rect.height + 0.5;
              if (!dentro) fuera.push(serie.name + ' en el eje ' + (i + 1) + ': ' + v + ' (eje ' + ext.join('–') + ')');
            }
          });
        });
        return { id, fuera, ejes: cs.dimensions.map((_, i) => m.getComponent('parallelAxis', i).axis.scale.getExtent()) };
      }));
      for (const x of r) {
        const que = x.id === 'canvas' ? 'lámina' : 'miniatura';
        if (x.error) fallo(donde, que + ': ' + x.error);
        else if (x.fuera.length) fallo(donde, que + ': líneas fuera del área → ' + x.fuera.slice(0, 4).join('; '));
        else if (x.ejes.some(e => !(e[1] > e[0]))) fallo(donde, que + ': algún eje no tiene recorrido ' + JSON.stringify(x.ejes));
      }
      if (CAPTURAS) await page.locator('#canvas').screenshot({ path: path.join(DIR_CAPTURAS, 'paralelas_' + cfg.nombre + '_' + nombre.replace(/\s+/g, '-') + '.png') });
    }
    page.errores.forEach(x => fallo('paralelas ' + cfg.nombre, x));
    await page.context().close();
  }
}

/* ---------- 6. paridad con el prototipo ---------- */
/* Diferencias hechas a propósito respecto al prototipo (arreglos de fallos suyos): no se comparan esas partes. */
const DIFERENCIAS_VOLUNTARIAS = {
  parallel: { partes: ['lienzo', 'mini'], motivo: 'coordenadas paralelas: los ejes se escalan con todas las filas, no solo con la primera' }
};
const GRUPO_PROTO = { populares: 'pop', vistosos: 'vis', raros: 'rar' };
const paridad = [];
for (const cfg of [CONFIGS[2], CONFIGS[3], CONFIGS[0]]) {
  const app = await nuevaPagina(cfg), proto = await nuevaPagina(cfg, { prototipo: true });
  await app.goto(BASE + '/index.html'); await proto.goto(BASE + '/prototipo/graficador.html');
  await esperarArranque(app); await esperarArranque(proto);
  /* Lo que se compara: textos de la lámina, tabla, nota y el dibujo (SVG/HTML) de la lámina y de las miniaturas. */
  const foto = p => p.evaluate(() => {
    const limpia = s => s.replace(/zr\d+-/g, 'zr-').replace(/_ec_\d+/g, '_ec_').replace(/ id="[^"]*"/g, '');
    const thumb = document.querySelector('#tiles [aria-pressed="true"] .thumb');
    return {
      top: document.querySelector('#top').innerText, fact: document.querySelector('#fact').innerText, note: document.querySelector('#note').innerText,
      tabla: document.querySelector('#dt').innerHTML, lienzo: limpia(document.querySelector('#canvas').innerHTML), mini: thumb ? limpia(thumb.innerHTML) : '',
      tabs: document.querySelector('#tabs').innerText
    };
  });
  for (const c of CAT) {
    await abrir(app, c); await abrir(proto, c, GRUPO_PROTO);
    await quieto(app); await quieto(proto);
    const a = await foto(app), b = await foto(proto);
    const distintos = Object.keys(a).filter(k => a[k] !== b[k] && !(DIFERENCIAS_VOLUNTARIAS[c.id]?.partes.includes(k)));
    if (distintos.length) {
      paridad.push(cfg.nombre + ' / ' + c.id + ': difiere ' + distintos.join(', '));
      fallo('paridad ' + cfg.nombre + ' / ' + c.id, 'difiere en ' + distintos.join(', '));
      if (process.env.DEPURAR) for (const k of distintos) { let i = 0; while (a[k][i] === b[k][i]) i++; console.log(k, '\n  app:  ', a[k].slice(Math.max(0, i - 80), i + 120), '\n  proto:', b[k].slice(Math.max(0, i - 80), i + 120)); }
    }
  }
  app.errores.forEach(x => fallo('paridad app ' + cfg.nombre, x));
  await app.context().close(); await proto.context().close();
}

await navegador.close();
servidor.close();

/* ---------- informe ---------- */
const nombres = Object.fromEntries(CAT.map(c => [c.id, c.nombre]));
console.log('\nRESULTADO POR GRÁFICO Y TIPO DE DATOS (igual en las 4 configuraciones salvo que se indique)\n');
for (const tipo of Object.keys(resumen)) {
  console.log('== ' + tipo + ' ==');
  for (const id of Object.keys(resumen[tipo])) {
    const porCfg = resumen[tipo][id], valores = [...new Set(Object.values(porCfg))];
    const txt = valores.length === 1 ? valores[0] : Object.entries(porCfg).map(([k, v]) => k + ': ' + v).join(' | ');
    if (tipo === 'ejemplo' && txt === 'ok') continue;
    console.log('  ' + id.padEnd(9) + ' ' + nombres[id].padEnd(24) + ' ' + txt);
  }
  if (tipo === 'ejemplo' && Object.values(resumen[tipo]).every(p => Object.values(p).every(v => v === 'ok'))) console.log('  los 30 se dibujan bien');
}
console.log('\nDescargar PNG: ' + pngs.ok + ' imágenes comprobadas' + (pngs.mal ? ', ' + pngs.mal + ' problemas' : ', todas bien') + ' (30 gráficos × 4 configuraciones)');
console.log('\nParidad con el prototipo: ' + (paridad.length ? paridad.length + ' diferencias' : 'idéntico en los 30 gráficos (escritorio claro y oscuro, y móvil claro)'));
Object.values(DIFERENCIAS_VOLUNTARIAS).forEach(d => console.log('  salvo a propósito: ' + d.motivo));
if (fallos.length) {
  console.log('\nFALLOS (' + fallos.length + '):');
  fallos.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
console.log('\nTodo correcto.');
