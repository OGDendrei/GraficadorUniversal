import { axisOpt } from '../util.js';

export const id = 'stack';
export const grupo = 'populares';
export const nombre = 'Barras apiladas';
export const uso = 'El total y cómo se reparte, a la vez';
export const año = '';
export const autor = '';
export const curiosidad = 'Enseña el total y su reparto en un solo gráfico, pero solo la serie de abajo se compara bien: las demás flotan.';
export const columnas = [
  { nombre: 'Mes', tipo: 'texto' },
  { nombre: 'Vivienda', tipo: 'numero', editable: true },
  { nombre: 'Comida', tipo: 'numero', editable: true },
  { nombre: 'Ocio', tipo: 'numero', editable: true }
];
export const filas = [['Ene', 650, 310, 90], ['Feb', 650, 295, 70], ['Mar', 655, 320, 110], ['Abr', 650, 305, 95], ['May', 660, 330, 130], ['Jun', 650, 340, 160]];
export const nota = '';
export const opt = axisOpt('stack');
