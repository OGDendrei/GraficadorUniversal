# Normas del proyecto «Graficador universal»

Estas normas se cumplen siempre, en cualquier cambio.

## Privacidad
- Nunca incluyas datos personales del autor (nombre, usuario, correo, contraseñas)
  ni enlaces a chats de Claude en código, comentarios, README, mensajes de commit
  ni descripciones de PR.
- Los commits van anónimos y sin firmas: sin `Co-Authored-By`, sin enlaces de sesión,
  sin firma GPG/SSH. Identidad de commit genérica (por ejemplo «Anónimo»).

## Idioma
- Todo el proyecto va en español: interfaz, textos, comentarios, README, commits y PR.

## Técnica
- Proyecto estático. Sin paso de compilación, sin framework y sin bundler.
- JavaScript moderno con módulos ES (`import`/`export`).
- Nada se carga desde un CDN ni de internet. Las librerías van copiadas en `vendor/`
  (ECharts 5.5.1, d3 7.8.5 y el mapa del mundo de echarts 4.9.0).
- Debe funcionar en GitHub Pages desde la raíz de la rama `main`.
- `prototipo/graficador.html` es la referencia de aspecto, textos, datos y comportamiento.

## Estructura
- `index.html`, `css/estilos.css`
- `js/app.js` (galería, pestañas, lámina), `js/editor.js` (tabla), `js/exportar.js` (descargar PNG),
  `js/almacen.js` (guardado de juegos de datos), `js/tema.js` (colores),
  `js/util.js` (utilidades), `js/graficos/<id>.js` (uno por gráfico) y `js/graficos/index.js` (registro).
- `pruebas/` contiene la prueba con navegador real (Playwright).

## Datos guardados (no perder nunca datos de nadie)
- Formato actual en localStorage: `gu2:<id>` = `{ v: 2, activo, juegos: [{ nombre, head, rows }] }`.
- Formato antiguo `gu1:<id>` = `{ head, rows }`: se convierte en el juego «Mis datos» y solo se borra
  después de comprobar que el nuevo se guardó bien.
- Si cambia el formato otra vez: nueva clave, conversión automática y nada se borra sin comprobar.
- Datos dañados: copia en `gu-respaldo:<id>:<fecha>`, aviso claro y datos de ejemplo.
  Si el almacenamiento falla o está lleno, la web avisa y sigue funcionando.

## Verificación
- Antes de dar algo por terminado: `node pruebas/recorrido.mjs` (sirve el proyecto y recorre
  los 30 gráficos en móvil y escritorio, claro y oscuro, y con datos raros; prueba la tabla,
  los juegos de datos, el PNG y la paridad con el prototipo).
