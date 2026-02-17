// ===== EDITOR DEL MAPA (FASE DE EDICIÓN) =====
// Maneja la colocación de objetos (Wumpus, agujeros, oro) en el tablero durante la edición

import { TOOL, START, PHASE } from "./config.js";
import { canPlaceOnStart } from "./world.js";

// Establece la herramienta de edición activa y actualiza visualmente cuál está seleccionada
export function setTool(ui, state, tool){
  state.currentTool = tool;

  // Quita el destaque de todos los botones de herramientas
  Object.values(ui.toolButtons).forEach(b => b.classList.remove("active"));
  
  // Añade destaque solo al botón de la herramienta seleccionada
  if (tool === TOOL.WUMPUS) ui.toolButtons.wumpus.classList.add("active");
  if (tool === TOOL.PIT) ui.toolButtons.pit.classList.add("active");
  if (tool === TOOL.GOLD) ui.toolButtons.gold.classList.add("active");
  if (tool === TOOL.ERASER) ui.toolButtons.eraser.classList.add("active");
}

// Maneja el clic en una celda del tablero durante la fase de edición
// Permite colocar/borrar objetos según la herramienta seleccionada
export function onCellClick(ui, state, x, y, setStatus, render){
  // Solo permite editar si estamos en la fase de edición
  if (state.phase !== PHASE.EDIT) return;

  // No permite colocar objetos en la celda de inicio del aventurero
  if (!canPlaceOnStart(x,y)){
    setStatus(ui, "No puedes colocar cosas en la casilla de inicio del aventurero.");
    return;
  }

  const c = state.world[y][x]; // Referencia a la celda clickeada
  const tool = state.currentTool;

  // ===== HERRAMIENTA BORRADOR =====
  // Elimina todos los objetos de la celda
  if (tool === TOOL.ERASER){
    c.pit = false; c.wumpus = false; c.gold = false;
    render(ui, state);
    return;
  }

  // ===== HERRAMIENTA WUMPUS =====
  // Solo puede haber 1 Wumpus: elimina el anterior y coloca uno nuevo
  if (tool === TOOL.WUMPUS){
    for (let yy=0;yy<state.N;yy++) for (let xx=0;xx<state.N;xx++) state.world[yy][xx].wumpus = false;
    c.wumpus = true;
    c.pit = false;
    c.gold = false;
    render(ui, state);
    return;
  }

  // ===== HERRAMIENTA ORO =====
  // Solo puede haber 1 oro: elimina el anterior y coloca uno nuevo
  if (tool === TOOL.GOLD){
    for (let yy=0;yy<state.N;yy++) for (let xx=0;xx<state.N;xx++) state.world[yy][xx].gold = false;
    c.gold = true;
    c.pit = false; c.wumpus = false;
    render(ui, state);
    return;
  }

  // ===== HERRAMIENTA AGUJEROS =====
  // Alterna entre tener agujero o no en la celda
  if (tool === TOOL.PIT){
    c.pit = !c.pit; // Cambia de falso a verdadero o viceversa
    // Si existe agujero, elimina otros objetos en esa celda
    if (c.pit){ c.wumpus = false; c.gold = false; }
    render(ui, state);
  }
}
