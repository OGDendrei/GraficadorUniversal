import { pieOpt } from '../util.js';

export const id = 'donut';
export const grupo = 'vistosos';
export const nombre = 'Anillo (donut)';
export const uso = 'Un reparto con el total en el centro';
export const año = '';
export const autor = '';
export const curiosidad = 'Es un quesito con un agujero. Ese hueco se aprovecha para poner el total en el centro.';
export const columnas = [
  { nombre: 'Actividad', tipo: 'texto' },
  { nombre: 'Horas', tipo: 'numero', editable: true }
];
export const filas = [['Dormir', 8], ['Trabajo', 8], ['Ocio', 3], ['Comidas', 2], ['Traslados', 1.5], ['Tareas', 1.5]];
export const nota = '';
export const opt = pieOpt(true);
