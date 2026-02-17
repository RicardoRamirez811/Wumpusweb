// ===== SENSORES DEL AVENTURERO =====
// Los sensores detectan peligros cercanos (brisa para agujeros, hedor para Wumpus)

import { neighbors4 } from "./world.js";

// Detecta las advertencias en una celda específica del mundo real
// Devuelve si hay brisa (agujero cercano) y/o hedor (Wumpus cercano)
export function senseAt(world, x, y){
  // Obtiene los 4 vecinos ortogonales de la posición actual
  const neigh = neighbors4(x,y);
  let breeze = false;  // Indica si hay agujero cercano
  let stench = false;  // Indica si hay Wumpus cercano

  // Revisa cada vecino buscando peligros
  for (const p of neigh){
    if (world[p.y][p.x].pit) breeze = true;      // Si encuentro un agujero, hay brisa
    if (world[p.y][p.x].wumpus) stench = true;   // Si encuentro Wumpus, hay hedor
  }
  
  // Retorna las advertencias detectadas
  return { breeze, stench };
}

// Marca las celdas vecinas como seguras si no detectó advertencia alguna
// Esta es parte de la lógica deductiva del aventurero: si no siento nada, mis vecinos deben ser seguros
export function markSafeNeighborsIfNoWarning(agent, x, y, sense){
  // Si no hay brisa ni hedor en esta celda, es seguro todo lo que la rodea
  if (!sense.breeze && !sense.stench){
    // Marca todos los vecinos como seguros (inferencia lógica)
    for (const p of neighbors4(x,y)){
      agent.knowledge[p.y][p.x].safeInferred = true;
    }
  }
}
