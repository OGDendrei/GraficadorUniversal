import { axisOpt } from '../util.js';

export const id = 'line';
export const grupo = 'populares';
export const nombre = 'Líneas';
export const uso = 'Cómo evoluciona algo en el tiempo';
export const año = '~950';
export const autor = 'Autor anónimo';
export const curiosidad = 'La gráfica de líneas más antigua que se conoce es de un manuscrito medieval hacia el año 950. Muestra la inclinación de las órbitas de los planetas a lo largo del tiempo.';
export const columnas = [
  { nombre: 'Hora', tipo: 'texto' },
  { nombre: 'Temperatura (°C)', tipo: 'numero', editable: true },
  { nombre: 'Sensación (°C)', tipo: 'numero', editable: true },
  { nombre: 'Serie 3', tipo: 'numero', editable: true }
];
export const filas = [['00:00', 8, 6.5], ['02:00', 7, 5.5], ['04:00', 6, 4.5], ['06:00', 5.5, 4], ['08:00', 8, 7], ['10:00', 12.5, 12], ['12:00', 15.5, 15], ['14:00', 17, 16.5], ['16:00', 15.5, 15], ['18:00', 11.5, 10], ['20:00', 9.8, 8.5], ['22:00', 8.7, 7.2]];
export const nota = '';
export const opt = axisOpt('line');
