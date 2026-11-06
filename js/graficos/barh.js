import { axisOpt } from '../util.js';

export const id = 'barh';
export const grupo = 'populares';
export const nombre = 'Barras horizontales';
export const uso = 'Rankings y nombres largos';
export const año = '1786';
export const autor = 'William Playfair';
export const curiosidad = 'Las primeras barras de Playfair eran horizontales. Las verticales llegaron después.';
export const columnas = [
  { nombre: 'Tienda', tipo: 'texto' },
  { nombre: 'Gasto (€)', tipo: 'numero', editable: true },
  { nombre: 'Serie 2', tipo: 'numero', editable: true }
];
export const filas = [['Supermercado', 240], ['Gasolinera', 110], ['Restaurantes', 80], ['Farmacia', 45], ['Ferretería', 38], ['Librería', 25]];
export const nota = '';
export const opt = axisOpt('barh');
