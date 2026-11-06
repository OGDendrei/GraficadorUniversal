/* Registro de gráficos. Para añadir uno nuevo: crea js/graficos/<id>.js y añádelo a esta lista.
   El orden de la lista es el orden en la galería. */
import * as bar from './bar.js';
import * as barh from './barh.js';
import * as line from './line.js';
import * as pie from './pie.js';
import * as area from './area.js';
import * as stack from './stack.js';
import * as scatter from './scatter.js';
import * as hist from './hist.js';
import * as box from './box.js';
import * as heat from './heat.js';
import * as sankey from './sankey.js';
import * as treemap from './treemap.js';
import * as sunburst from './sunburst.js';
import * as donut from './donut.js';
import * as radar from './radar.js';
import * as bubble from './bubble.js';
import * as choro from './choro.js';
import * as stream from './stream.js';
import * as calendar from './calendar.js';
import * as chord from './chord.js';
import * as stem from './stem.js';
import * as violin from './violin.js';
import * as parallel from './parallel.js';
import * as bullet from './bullet.js';
import * as spark from './spark.js';
import * as slope from './slope.js';
import * as mekko from './mekko.js';
import * as pareto from './pareto.js';
import * as candle from './candle.js';
import * as ridge from './ridge.js';

export const GRAFICOS = [
  bar, barh, line, pie, area, stack, scatter, hist, box, heat,
  sankey, treemap, sunburst, donut, radar, bubble, choro, stream, calendar, chord,
  stem, violin, parallel, bullet, spark, slope, mekko, pareto, candle, ridge
];

/* Los tres grupos de la galería, en orden. */
export const GRUPOS = [
  { id: 'populares', nombre: 'Populares', sub: 'Los de todos los días' },
  { id: 'vistosos', nombre: 'Vistosos', sub: 'Para lucirse' },
  { id: 'raros', nombre: 'Raros', sub: 'Poco conocidos, muy útiles' }
];
