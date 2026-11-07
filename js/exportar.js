/* Descargar el gráfico como imagen PNG.
   Se vuelve a dibujar el gráfico (sin animación) en un lienzo oculto del mismo ancho que la lámina
   y se copia a un <canvas> con fondo sólido, el título y una resolución alta.
   Sirve para los tres tipos de gráfico: ECharts (SVG), d3 (SVG) y los hechos con HTML. */
import { FONT } from './util.js';

const MARGEN = 24;

/* «Barras verticales» → «grafico-barras-verticales.png» */
export function nombreArchivo(nombre) {
  const base = String(nombre).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return 'grafico-' + (base || 'sin-nombre') + '.png';
}

/* def: módulo del gráfico; T: colores del tema actual; dibujar(el): pinta el gráfico en el;
   ancho/alto: tamaño de la lámina en pantalla; juego: nombre del juego de datos (va bajo el título).
   Devuelve { blob, nombre }. */
export async function generarPNG({ def, T, dibujar, ancho, alto, juego }) {
  const lienzo = document.createElement('div');
  lienzo.className = 'canvas';
  lienzo.setAttribute('aria-hidden', 'true');
  lienzo.style.cssText = 'position:fixed;left:-100000px;top:0;width:' + ancho + 'px;height:' + alto + 'px';
  document.body.appendChild(lienzo);
  try {
    dibujar(lienzo);
    await frame();
    /* Los gráficos en HTML pueden ser más altos que la lámina: se exporta entero. */
    const alto2 = Math.max(alto, lienzo.scrollHeight);
    if (alto2 > alto) { lienzo.style.height = alto2 + 'px'; await frame(); }
    const canvas = await componer(lienzo, def, T, ancho, alto2, juego);
    const blob = await new Promise((ok, mal) => canvas.toBlob(b => b ? ok(b) : mal(new Error('el navegador no pudo crear el PNG (toBlob vacío)')), 'image/png'));
    return { blob, nombre: nombreArchivo(def.nombre) };
  } finally {
    const inst = window.echarts && echarts.getInstanceByDom(lienzo);
    if (inst) inst.dispose();
    lienzo.remove();
  }
}

/* Entrega el archivo al navegador como descarga. */
export function bajar({ blob, nombre }) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

async function componer(lienzo, def, T, ancho, alto, juego) {
  const W = ancho + 2 * MARGEN;
  const medir = document.createElement('canvas').getContext('2d');
  const titulo = partir(medir, def.nombre, '700 22px ' + FONT, ancho);
  const uso = def.uso ? partir(medir, def.uso, '400 14px ' + FONT, ancho) : [];
  const datos = juego ? partir(medir, 'Datos: «' + juego + '»', '600 14px ' + FONT, ancho) : [];
  const cabecera = titulo.length * 28 + datos.length * 20 + uso.length * 20 + 16;
  const H = MARGEN + cabecera + alto + MARGEN;
  /* Al menos 2× (o la densidad de la pantalla) y unos 1200 px de ancho; sin pasar de 16 Mpx (límite de iPhone). */
  let escala = Math.min(4, Math.max(2, window.devicePixelRatio || 1, 1200 / W));
  escala = Math.min(escala, Math.sqrt(16e6 / (W * H)));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * escala); canvas.height = Math.round(H * escala);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = T.surface; ctx.fillRect(0, 0, canvas.width, canvas.height);   /* fondo sólido, del tema visible */
  ctx.scale(escala, escala);

  ctx.textBaseline = 'top';
  let y = MARGEN;
  ctx.font = '700 22px ' + FONT; ctx.fillStyle = T.ink;
  titulo.forEach(l => { ctx.fillText(l, MARGEN, y); y += 28; });
  ctx.font = '600 14px ' + FONT; ctx.fillStyle = T.ink2;
  datos.forEach(l => { ctx.fillText(l, MARGEN, y); y += 20; });
  ctx.font = '400 14px ' + FONT;
  uso.forEach(l => { ctx.fillText(l, MARGEN, y); y += 20; });

  await pintarDOM(ctx, lienzo, MARGEN, MARGEN + cabecera, escala);
  return canvas;
}

/* Parte un texto en líneas que quepan en «max» px. */
function partir(ctx, texto, font, max) {
  ctx.font = font;
  const lineas = []; let l = '';
  String(texto).split(/\s+/).forEach(p => {
    const prueba = l ? l + ' ' + p : p;
    if (l && ctx.measureText(prueba).width > max) { lineas.push(l); l = p; } else l = prueba;
  });
  if (l) lineas.push(l);
  return lineas;
}

/* ---------- copiar al canvas lo que hay dibujado en el lienzo ---------- */
async function pintarDOM(ctx, raiz, ox, oy, escala) {
  const base = raiz.getBoundingClientRect();
  const rel = r => ({ x: r.left - base.left + ox, y: r.top - base.top + oy, w: r.width, h: r.height });

  async function recorrer(el) {
    for (const hijo of el.childNodes) {
      if (hijo.nodeType === Node.TEXT_NODE) { texto(hijo, getComputedStyle(el)); continue; }
      if (hijo.nodeType !== Node.ELEMENT_NODE) continue;
      const cs = getComputedStyle(hijo);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      if (hijo instanceof SVGSVGElement) { await svg(hijo); continue; }
      caja(hijo, cs);
      await recorrer(hijo);
    }
  }

  /* Fondo y bordes de una caja HTML (barras del bullet, puntos de las sparklines…). */
  function caja(el, cs) {
    const r = rel(el.getBoundingClientRect());
    if (!r.w || !r.h) return;
    const radio = v => v.endsWith('%') ? Math.min(r.w, r.h) * parseFloat(v) / 100 : parseFloat(v) || 0;
    const rad = radio(cs.borderTopLeftRadius);
    const lados = ['Top', 'Right', 'Bottom', 'Left'].map(l => ({ l, w: cs['border' + l + 'Style'] === 'none' ? 0 : parseFloat(cs['border' + l + 'Width']) || 0, c: cs['border' + l + 'Color'] }));
    const iguales = lados.every(s => s.w === lados[0].w && s.c === lados[0].c) && lados[0].w > 0;
    if (iguales && visible(lados[0].c)) {
      const b = lados[0].w;
      rect(r.x, r.y, r.w, r.h, rad, lados[0].c);
      if (visible(cs.backgroundColor)) rect(r.x + b, r.y + b, r.w - 2 * b, r.h - 2 * b, Math.max(0, rad - b), cs.backgroundColor);
      return;
    }
    if (visible(cs.backgroundColor)) rect(r.x, r.y, r.w, r.h, rad, cs.backgroundColor);
    lados.forEach(s => {
      if (!s.w || !visible(s.c)) return;
      ctx.fillStyle = s.c;
      if (s.l === 'Top') ctx.fillRect(r.x, r.y, r.w, s.w);
      if (s.l === 'Bottom') ctx.fillRect(r.x, r.y + r.h - s.w, r.w, s.w);
      if (s.l === 'Left') ctx.fillRect(r.x, r.y, s.w, r.h);
      if (s.l === 'Right') ctx.fillRect(r.x + r.w - s.w, r.y, s.w, r.h);
    });
  }
  function rect(x, y, w, h, rad, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (rad > 0 && ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(rad, w / 2, h / 2)); else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  /* Texto: se dibuja palabra a palabra en su sitio exacto, así respeta los saltos de línea. */
  function texto(nodo, cs) {
    const t = nodo.textContent;
    if (!t.trim() || !visible(cs.color)) return;
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    ctx.fillStyle = cs.color;
    if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    ctx.textBaseline = 'alphabetic';
    const rango = document.createRange();
    for (const m of t.matchAll(/\S+/g)) {
      rango.setStart(nodo, m.index); rango.setEnd(nodo, m.index + m[0].length);
      const rr = rango.getClientRects()[0]; if (!rr) continue;
      const r = rel(rr), mt = ctx.measureText(m[0]);
      const asc = mt.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * .8, desc = mt.fontBoundingBoxDescent ?? parseFloat(cs.fontSize) * .2;
      ctx.fillText(m[0], r.x, r.y + (r.h - asc - desc) / 2 + asc);
    }
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  /* SVG (ECharts, d3 y sparklines): se convierte en imagen a la resolución final. */
  async function svg(el) {
    const r = rel(el.getBoundingClientRect());
    if (!r.w || !r.h) return;
    const copia = el.cloneNode(true);
    /* Las variables CSS (var(--s1)) no existen fuera de la página: se cambian por su color. */
    const orig = [el, ...el.querySelectorAll('*')], dup = [copia, ...copia.querySelectorAll('*')];
    orig.forEach((o, i) => {
      ['fill', 'stroke'].forEach(a => { const v = dup[i].getAttribute(a); if (v && v.includes('var(')) dup[i].setAttribute(a, getComputedStyle(o)[a]); });
    });
    if (!copia.getAttribute('viewBox')) copia.setAttribute('viewBox', '0 0 ' + r.w + ' ' + r.h);
    copia.setAttribute('width', r.w * escala); copia.setAttribute('height', r.h * escala);
    if (!copia.style.fontFamily) copia.style.fontFamily = getComputedStyle(el).fontFamily;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copia)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const img = new Image();
      img.src = url;
      await img.decode().catch(() => { throw new Error('no se pudo convertir el SVG en imagen'); });
      ctx.drawImage(img, r.x, r.y, r.w, r.h);
    } finally { URL.revokeObjectURL(url); }
  }

  await recorrer(raiz);
}

function visible(color) {
  if (!color || color === 'transparent') return false;
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return true;
  const p = m[1].split(/[\s,/]+/).filter(Boolean);
  return p.length < 4 || parseFloat(p[3]) > 0;
}
