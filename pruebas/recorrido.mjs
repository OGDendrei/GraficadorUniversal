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
    return { dibujado, mensaje: m ? m.textContent : '', thumbs, desborde };
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
      if (tipo === 'ejemplo' && txt !== 'ok') fallo(donde, 'con los datos de ejemplo no se dibuja: ' + e.mensaje);
      anota(tipo, c.id, cfg.nombre, txt);
      if (e.desborde > 0) fallo(donde, 'la página se sale ' + e.desborde + ' px a lo ancho');
      const th = e.thumbs.find(t => t.id === c.id);
      if (!th || th.vacio) fallo(donde, 'miniatura vacía');
      else if (/No se ha podido/.test(th.msg)) fallo(donde, 'miniatura con error: ' + (th.titulo || th.msg));
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
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('gu1:line') || 'null'));
  comprobar(guardado && guardado.rows[0][1] === '40', 'escribir una celda no se guarda en localStorage');
  await page.reload(); await esperarArranque(page);
  comprobar(await page.locator('#dt input[data-r="0"][data-c="1"]').inputValue() === '40', 'al recargar no se recupera el valor guardado');

  /* Cambiar el nombre de una columna. */
  await page.locator('#dt input[data-h="1"]').fill('Grados');
  await page.waitForTimeout(400);
  comprobar(await page.evaluate(() => JSON.parse(localStorage.getItem('gu1:line')).head[1] === 'Grados'), 'el nombre de columna no se guarda');

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

  /* Restaurar ejemplo. */
  await page.click('#reset');
  await page.waitForTimeout(300);
  comprobar(await page.evaluate(() => localStorage.getItem('gu1:line')) === null, '«Restaurar ejemplo» no borra lo guardado');
  comprobar(await page.locator('#dt input[data-r="0"][data-c="1"]').inputValue() === '8', '«Restaurar ejemplo» no devuelve los datos de ejemplo');
  comprobar(await page.locator('#dt input[data-h="1"]').inputValue() === 'Temperatura (°C)', '«Restaurar ejemplo» no devuelve el nombre de columna');

  /* Un gráfico no estropea los datos de otro. */
  await page.click('#tabs [data-g="raros"]');
  await page.click('#tiles [data-id="pareto"]');
  comprobar(await page.locator('#dt tbody tr').count() === 6, 'al cambiar de gráfico la tabla no muestra sus datos');

  page.errores.forEach(x => fallo('tabla', x));
  await page.context().close();
}

/* ---------- 6. paridad con el prototipo ---------- */
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
    const distintos = Object.keys(a).filter(k => a[k] !== b[k]);
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
console.log('\nParidad con el prototipo: ' + (paridad.length ? paridad.length + ' diferencias' : 'idéntico en los 30 gráficos (escritorio claro y oscuro, y móvil claro)'));
if (fallos.length) {
  console.log('\nFALLOS (' + fallos.length + '):');
  fallos.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
console.log('\nTodo correcto.');
