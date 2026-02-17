// ===== CONFIGURACIÓN GLOBAL DEL JUEGO WUMPUS =====

// Tamaño del tablero: N x N (6x6)
const boardEl = document.getElementById("board");
const savedSize = Number(localStorage.getItem("wumpusSize")) || 6;
boardEl.style.setProperty("--n", savedSize);
export const N = savedSize;

// Herramientas disponibles para editar el mapa
// Define los tipos de objetos que se pueden colocar en el tablero
export const TOOL = {
  WUMPUS: "wumpus",  // Herramienta para colocar el Wumpus (enemigo)
  PIT: "pit",        // Herramienta para colocar agujeros
  GOLD: "gold",      // Herramienta para colocar el oro (objetivo)
  ERASER: "eraser",  // Herramienta para borrar objetos del tablero
};

// Fases del juego: estados por los que pasa la partida
export const PHASE = {
  EDIT: "edit",      // Fase de edición: el jugador coloca objetos en el mapa
  PLAYING: "playing",// Fase de juego: el aventurero se mueve por el mundo
  ENDED: "ended",    // Fase finalizada: el juego terminó (ganó o perdió)
};

// Modos de juego: cómo se controla al aventurero
export const MODE = {
  MANUAL: "manual",  // Control manual: el jugador mueve el aventurero con botones
  AUTO: "auto",      // Control automático: la IA mueve el aventurero automáticamente
};

// Posición de inicio del aventurero: esquina inferior izquierda (0, 5) en un tablero 6x6
export const START = { x: 0, y: N - 1 };
