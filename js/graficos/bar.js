import { axisOpt } from '../util.js';

export const id = 'bar';
export const grupo = 'populares';
export const nombre = 'Barras verticales';
export const uso = 'Comparar cantidades entre categorías';
export const año = '1786';
export const autor = 'William Playfair';
export const curiosidad = 'Playfair las inventó para enseñar el comercio de Escocia con otros países. Hasta entonces esos datos se daban en tablas.';
export const columnas = [
  { nombre: 'Categoría', tipo: 'texto' },
  { nombre: 'Este mes', tipo: 'numero', editable: true },
  { nombre: 'Mes anterior', tipo: 'numero', editable: true },
  { nombre: 'Serie 3', tipo: 'numero', editable: true }
];
export const filas = [['Comida', 320, 295], ['Transporte', 140, 150], ['Ocio', 120, 160], ['Suministros', 110, 95], ['Salud', 45, 30]];
export const nota = '';
export const opt = axisOpt('bar');
