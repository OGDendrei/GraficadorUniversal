import { axisOpt } from '../util.js';

export const id = 'area';
export const grupo = 'populares';
export const nombre = 'Área';
export const uso = 'Evolución resaltando el volumen';
export const año = '1786';
export const autor = 'William Playfair';
export const curiosidad = 'Nace al rellenar de color el hueco bajo una línea. Playfair lo usó para enseñar cuánto se importaba y exportaba a lo largo del tiempo.';
export const columnas = [
  { nombre: 'Mes', tipo: 'texto' },
  { nombre: 'Consumo (kWh)', tipo: 'numero', editable: true },
  { nombre: 'Producción solar (kWh)', tipo: 'numero', editable: true },
  { nombre: 'Serie 3', tipo: 'numero', editable: true }
];
export const filas = [['Ene', 310, 95], ['Feb', 295, 130], ['Mar', 280, 200], ['Abr', 260, 260], ['May', 250, 320], ['Jun', 270, 360], ['Jul', 320, 380], ['Ago', 330, 350], ['Sep', 270, 260], ['Oct', 280, 170], ['Nov', 300, 100], ['Dic', 340, 80]];
export const nota = '';
export const opt = axisOpt('area');
