# Graficador universal

Página web con 30 tipos de gráfico (10 populares, 10 vistosos y 10 raros). Cada uno tiene
una miniatura en vivo, una curiosidad histórica y una tabla de datos que puedes editar
(también pegando celdas de una hoja de cálculo) y
se puede descargar como imagen PNG. Cada gráfico puede tener varios juegos de datos con nombre. Lo que escribes se guarda solo en tu navegador.

Es una web estática: no hay que compilar nada ni se carga nada de internet.
Las librerías (ECharts, d3 y el mapa del mundo) están copiadas en `vendor/`.

## Cómo verla en tu ordenador

Hay que abrirla desde un servidor local (con doble clic sobre `index.html` no funciona,
porque el navegador bloquea los módulos de JavaScript). Desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Y abre http://localhost:8000 en el navegador.

Para publicarla en GitHub Pages: Ajustes → Pages → rama `main`, carpeta raíz.

## Juegos de datos

Encima de la tabla hay un selector con los juegos de datos del gráfico y los botones
Nuevo, Duplicar, Renombrar y Borrar. La lámina, la miniatura y el PNG usan siempre el juego activo.
«Restaurar ejemplo» solo cambia el juego activo.

Todo se guarda en el navegador (localStorage), con la clave `gu2:<id>` por gráfico.
Los datos del formato antiguo (`gu1:<id>`) se convierten solos en un juego llamado «Mis datos»;
el dato antiguo solo se borra cuando el nuevo se ha guardado y comprobado.
Si algo guardado está dañado, se avisa, se guarda una copia en `gu-respaldo:<id>:<fecha>`
y se usan los datos de ejemplo.

## Cómo añadir un gráfico nuevo

1. Copia un archivo de `js/graficos/` parecido al que quieres (por ejemplo `bar.js`)
   y ponle otro nombre, por ejemplo `mi-grafico.js`.
2. Cambia dentro su `id` (igual que el nombre del archivo), `grupo` (`populares`, `vistosos`
   o `raros`), textos, `columnas`, `filas` de ejemplo y la función que dibuja
   (`opt` si usa ECharts, `draw` si usa d3 o HTML).
3. Regístralo en `js/graficos/index.js`: añade su línea `import` y ponlo en la lista `GRAFICOS`.

## Estructura

- `index.html`, `css/estilos.css`
- `js/app.js`: galería, pestañas y lámina del gráfico
- `js/editor.js`: tabla de datos
- `js/exportar.js`: botón «Descargar PNG»
- `js/almacen.js`: guardado de los juegos de datos y conversión del formato antiguo
- `js/tema.js`: colores claro/oscuro
- `js/util.js`: utilidades comunes
- `js/graficos/`: un archivo por gráfico y `index.js` que los registra
- `vendor/`: ECharts 5.5.1, d3 7.8.5 y el mapa del mundo (de ECharts 4.9.0)
- `prototipo/graficador.html`: el prototipo original, como referencia
- `pruebas/recorrido.mjs`: prueba con navegador real

## Prueba automática

Abre la página en un navegador real sin ventana y recorre los 30 gráficos en móvil y escritorio,
en claro y oscuro, con datos normales y con datos raros; prueba la tabla y los juegos de datos
(incluida la conversión del formato antiguo y el almacenamiento dañado o lleno), comprueba que
«Descargar PNG» da una imagen válida en los 30 gráficos y compara con el prototipo.

```bash
npm i -D playwright && npx playwright install chromium
```

```bash
node pruebas/recorrido.mjs
```

Con `--capturas` guarda imágenes en `pruebas/capturas/`.
