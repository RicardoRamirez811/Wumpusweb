// ===== INTELIGENCIA ARTIFICIAL DEL AVENTURERO (MODO AUTOMÁTICO) =====
// Implementa la lógica de toma de decisiones automática del agente

import { neighbors4 } from "./world.js";
import { PHASE } from "./config.js";

// Realiza un paso automático de la IA
// Usa una estrategia de exploración: intenta celdas seguras no visitadas, luego cualquier no visitada, y finalmente retrocede
export function autoStep(state, setStatus, render, ui, stopRunner){
  // Solo ejecuta si el juego está en fase de juego y el agente no ha terminado
  if (state.phase !== PHASE.PLAYING || state.agent.ended) return;

  const {x,y} = state.agent.pos; // Posición actual del agente
  const neigh = neighbors4(x,y); // Obtiene los vecinos válidos

  // Función auxiliar: verifica si una posición es permitida (no hay peligro conocido)
  const isAllowed = (p) => !state.agent.knowledge[p.y][p.x].dangerKnown;

  // ===== ESTRATEGIA 1: Prioridad a celdas inferidas como seguras y no visitadas =====
  // Busca vecinos que sabemos (o inferimos) que son seguros Y no hemos visitado
  const safeNew = neigh.filter(p => {
    const kk = state.agent.knowledge[p.y][p.x];
    return isAllowed(p) && kk.safeInferred && !kk.visited;
  });

  // Función auxiliar para mover el agente a una posición
  const moveTo = (target) => {
    state.agent.stack.push({ ...state.agent.pos }); // Guarda posición actual para backtracking
    state.agent.pos = { ...target };                 // Se mueve a la new posición
    state.visitCurrentCell();                        // Procesa la celda (sensores, etc)
  };

  // Si hay celdas seguras no visitadas, elige una aleatoria
  if (safeNew.length > 0){
    moveTo(safeNew[Math.floor(Math.random() * safeNew.length)]);
    return;
  }

  // ===== ESTRATEGIA 2: Celdas no visitadas (aunque haya advertencia) =====
  // Si no hay celdas seguras, intenta visitar cualquier celda no visitada
  // (aunque podría haber peligro, al menos aprendemos algo nuevo)
  const unvisited = neigh.filter(p => {
    const kk = state.agent.knowledge[p.y][p.x];
    return isAllowed(p) && !kk.visited;
  });

  // Si hay celdas no visitadas, elige una aleatoria
  if (unvisited.length > 0){
    moveTo(unvisited[Math.floor(Math.random() * unvisited.length)]);
    return;
  }

  // ===== ESTRATEGIA 3: Backtracking (retroceso) =====
  // No hay celdas nuevas accesibles, intentamos retroceder por el camino guardado
  // buscando una posición que no tenga peligro conocido
  while (state.agent.stack.length > 0){
    const back = state.agent.stack.pop(); // Obtiene la última posición guardada
    // Si la posición anterior es segura, retrocedemos a ella
    if (!state.agent.knowledge[back.y][back.x].dangerKnown){
      state.agent.pos = back;
      state.visitCurrentCell();
      return;
    }
  }

// ===== ESTRATEGIA 4: Buscar una frontera global =====
const path = findPathToFrontier(state, state.agent.pos);

if (path && path.length > 1) {
  // dar un solo paso hacia la frontera (sin push al stack)
  state.agent.pos = { ...path[1] };
  state.visitCurrentCell();
  return;
}

  // ===== SIN SOLUCIÓN =====
  // Se agotó el stack (backtracking) y no hay más movimientos posibles
  stopRunner(state);
  state.phase = PHASE.ENDED;
  state.agent.ended = true;
  setStatus(ui, "⛔ El agente no tiene movimientos disponibles. Posible mapa sin solución.");
  render(ui, state);
}

// Inicia el loop automático: ejecuta autoStep repetidamente cada cierto tiempo
export function runAuto(state, tickMs=450){
  // Si ya hay un loop ejecutándose, no inicia otro
  if (state.runner) return;
  
  // Crea un intervalo que ejecuta autoStep cada 'tickMs' milisegundos
  state.runner = setInterval(() => {
    // Solo continúa si el juego sigue activo
    if (state.phase !== PHASE.PLAYING || state.agent?.ended) return;
    state.autoStep(); // Ejecuta un paso automático
  }, tickMs);
}

// Detiene el loop automático
export function stopRunner(state){
  // Si hay un loop ejecutándose, lo cancela
  if (state.runner){
    clearInterval(state.runner);
    state.runner = null;
  }
}

function findPathToFrontier(state, from){
  // Permitido = todo excepto peligro confirmado
  const allowed = (x,y) => !state.agent.knowledge[y][x].dangerKnown;

  // Frontera = celda visitada (alcanzable) que tiene al menos 1 vecino permitido NO visitado
  const isFrontier = (x,y) => {
    if (!allowed(x,y)) return false;
    if (!state.agent.knowledge[y][x].visited) return false;

    return neighbors4(x,y).some(nb =>
      allowed(nb.x, nb.y) && !state.agent.knowledge[nb.y][nb.x].visited
    );
  };

  const key = (p) => `${p.x},${p.y}`;
  const q = [{...from}];
  const prev = new Map();
  prev.set(key(from), null);

  let goal = null;

  while (q.length){
    const cur = q.shift();

    if (isFrontier(cur.x, cur.y)){
      goal = cur;
      break;
    }

    for (const nb of neighbors4(cur.x, cur.y)){
      if (!allowed(nb.x, nb.y)) continue;

      const k = key(nb);
      if (prev.has(k)) continue;

      prev.set(k, cur);
      q.push(nb);
    }
  }

  if (!goal) return null;

  // reconstruir path desde goal hasta from
  const path = [];
  let cur = goal;
  while (cur){
    path.push(cur);
    cur = prev.get(key(cur));
  }
  path.reverse(); // incluye from al inicio

  return path;
}
