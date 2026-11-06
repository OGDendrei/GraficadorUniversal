/* Colores del tema claro/oscuro. Los colores viven en css/estilos.css como variables;
   aquí se leen para pasárselos a ECharts y d3, y se avisa cuando cambia el tema. */

const DS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const DQ = ['#cde2fb', '#86b6ef', '#3987e5', '#1c5cab', '#0d366b'];

/* Devuelve los colores actuales: tinta, rejilla, superficie, 8 colores de serie (series) y 5 de escala (q). */
export function leerTema() {
  const cs = getComputedStyle(document.documentElement);
  const g = (n, d) => cs.getPropertyValue(n).trim() || d;
  const o = { ink: g('--ink', '#0b0b0b'), ink2: g('--ink2', '#52514e'), muted: g('--muted', '#898781'), grid: g('--grid', '#e1e0d9'), axis: g('--axis', '#c3c2b7'), surface: g('--surface', '#fcfcfb'), fill: g('--fill', '#dbe8fa'), series: [], q: [] };
  for (let i = 1; i <= 8; i++) o.series.push(g('--s' + i, DS[i - 1]));
  for (let j = 1; j <= 5; j++) o.q.push(g('--q' + j, DQ[j - 1]));
  return o;
}

/* Llama a cb cuando cambia el tema del sistema o el atributo data-theme de <html>. */
export function alCambiarTema(cb) {
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', cb);
  new MutationObserver(cb).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
