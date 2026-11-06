import { pieOpt } from '../util.js';

export const id = 'pie';
export const grupo = 'populares';
export const nombre = 'Sectores (quesitos)';
export const uso = 'Qué parte del total es cada cosa';
export const año = '1801';
export const autor = 'William Playfair';
export const curiosidad = 'Aparece por primera vez en el Statistical Breviary de Playfair. Muchos expertos en visualización lo critican porque el ojo compara mal los ángulos.';
export const columnas = [
  { nombre: 'Categoría', tipo: 'texto' },
  { nombre: 'Importe (€)', tipo: 'numero', editable: true }
];
export const filas = [['Vivienda', 650], ['Comida', 320], ['Transporte', 140], ['Ocio', 120], ['Suministros', 110], ['Otros', 60]];
export const nota = 'Con más de 8 categorías, las más pequeñas se agrupan en «Otros».';
export const opt = pieOpt(false);
