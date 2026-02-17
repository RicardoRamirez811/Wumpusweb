// ===== ADMINISTRACIÓN DEL MUNDO (TABLERO REAL) =====

import { N, START } from "./config.js";

// Crea el mundo real: matriz NxN que almacena la posición de peligros y objetivos
// Esta información está oculta del aventurero durante el juego
export function newWorld(){
  // Inicializa todas las celdas sin peligros ni oro
  const w = Array.from({length:N}, () =>
    Array.from({length:N}, () => ({ pit:false, wumpus:false, gold:false }))
  );
  return w;
}

// Verifica si una posición (x,y) está dentro de los límites del tablero
export function inside(x,y){ 
  return x>=0 && x<N && y>=0 && y<N; 
}

// Obtiene los 4 vecinos ortogonales (arriba, abajo, izquierda, derecha) de una celda
// Filtra solo los vecinos que están dentro del tablero
export function neighbors4(x,y){
  const deltas = [[0,-1],[0,1],[-1,0],[1,0]]; // Desplazamientos: arriba, abajo, izquierda, derecha
  return deltas
    .map(([dx,dy]) => ({x:x+dx, y:y+dy}))        // Calcula posición de cada vecino
    .filter(p => inside(p.x,p.y));               // Mantiene solo los que están en el tablero
}


// Cuenta cuántos objetos de un tipo específico hay en el tablero
// Types puede ser: "pit", "wumpus" o "gold"
export function countWorld(world, type){
  let c = 0;
  // Recorre todo el tablero contando coincidencias
  for (let y=0;y<N;y++) for (let x=0;x<N;x++){
    if (world[y][x][type]) c++;
  }
  return c;
}

// Limpia el tablero: elimina todos los peligros y objetos
export function clearWorld(world){
  // Recorre todas las celdas y pone todo en falso
  for (let y=0;y<N;y++) for (let x=0;x<N;x++){
    world[y][x].pit = false;
    world[y][x].wumpus = false;
    world[y][x].gold = false;
  }
}

// Verifica si se puede colocar un objeto en una celda
// No permite colocar nada en la celda de inicio del aventurero
export function canPlaceOnStart(x,y){
  return !(x === START.x && y === START.y);
}
