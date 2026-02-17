// ===== ARCHIVO PRINCIPAL - PUNTO DE ENTRADA DEL JUEGO =====
// Inicializa el juego, configurando el estado global y conectando todos los módulos

import { N, TOOL, PHASE, MODE } from "./config.js";
import { getUI, setStatus } from "./dom.js";
import { newWorld, neighbors4, inside } from "./world.js";
import { newAgent } from "./agent.js";
import { render } from "./render.js";
import { setTool, onCellClick } from "./editor.js";
import { runAuto, stopRunner, autoStep } from "./auto.js";
import { buildGameActions } from "./game.js";
import { randomExample } from "./random.js";


// ===== INICIALIZACIÓN DE LA INTERFAZ =====
// Obtiene referencias a todos los elementos del DOM
const ui = getUI();

// ===== ESTADO GLOBAL DEL JUEGO =====
// Objeto central que almacena el estado completo del juego
const state = {
  N,                            // Tamaño del tablero (6x6)
  world: newWorld(),            // Mundo real con peligros y oro
  phase: PHASE.EDIT,            // Fase actual (edición/jugando/terminado)
  mode: MODE.MANUAL,            // Modo de control (manual/automático)
  runner: null,                 // ID del intervalo para modo automático
  agent: null,                  // Instancia del aventurero (null hasta iniciar juego)
  currentTool: TOOL.WUMPUS,     // Herramienta seleccionada en editor

  // Inyectar funciones utilitarias para que game.js las use
  neighbors4,                   // Obtiene los 4 vecinos de una celda
  inside,                       // Verifica si una posición está dentro del tablero
};

// ===== CONSTRUCCIÓN DE LAS ACCIONES DEL JUEGO =====
// Crea las funciones principales: startGame, resetRun, move, visitCurrentCell
const game = buildGameActions(ui, state, setStatus, render, stopRunner, runAuto);

// ===== CONECTAR DEPENDENCIAS CIRCULARES =====
// game.js necesita invocar visitCurrentCell que es retornado desde game.js
state.visitCurrentCell = game.visitCurrentCell;

// ===== ENVOLVER autoStep CON LAS DEPENDENCIAS NECESARIAS =====
// auto.js necesita acceso a varias funciones, así que las inyectamos aquí
state.autoStep = () => autoStep(
  state,
  setStatus,
  render,
  ui,
  () => stopRunner(state)
);

// ===== INITIAL RENDER Y ESTADO =====
// Establece la herramienta inicial y dibuja el tablero
setTool(ui, state, TOOL.WUMPUS);
setStatus(ui, "Coloca 1 Wumpus, 0+ agujeros y 1 oro. Luego Iniciar partida.");
render(ui, state);

// ===== EVENTO: CLIC EN CELDAS DEL TABLERO =====
// Maneja la selección de celdas durante la edición
ui.boardEl.addEventListener("click", (e) => {
  const cell = e.target.closest(".cell");
  if (!cell) return;
  const x = Number(cell.dataset.x);
  const y = Number(cell.dataset.y);
  onCellClick(ui, state, x, y, setStatus, render);
});

// Eventos UI
ui.toolButtons.wumpus.addEventListener("click", () => setTool(ui, state, TOOL.WUMPUS));
ui.toolButtons.pit.addEventListener("click", () => setTool(ui, state, TOOL.PIT));
ui.toolButtons.gold.addEventListener("click", () => setTool(ui, state, TOOL.GOLD));
ui.toolButtons.eraser.addEventListener("click", () => setTool(ui, state, TOOL.ERASER));

ui.btnClear.addEventListener("click", () => {
  state.world = newWorld();
  state.phase = PHASE.EDIT;
  stopRunner(state);
  state.agent = null;
  setStatus(ui, "Mapa limpio. Coloca Wumpus/Agujeros/Oro y presiona “Iniciar partida”.");
  render(ui, state);
});

ui.btnRandom.addEventListener("click", () => {
  // Vuelve a edición para poder ver/ajustar el mundo generado
  state.world = newWorld();
  state.phase = "edit";
  stopRunner(state);
  state.agent = null;

  randomExample(state);

  setStatus(ui, "Ejemplo generado. Ajusta si quieres y presiona “Iniciar partida”.");
  render(ui, state);
});

ui.btnStart.addEventListener("click", game.startGame);
ui.btnResetRun.addEventListener("click", game.resetRun);

ui.modeManualBtn.addEventListener("click", () => {
  state.mode = MODE.MANUAL;
  ui.modeManualBtn.classList.add("active");
  ui.modeAutoBtn.classList.remove("active");
  ui.manualControls.classList.remove("hidden");
  ui.autoControls.classList.add("hidden");
  stopRunner(state);
});

ui.modeAutoBtn.addEventListener("click", () => {
  state.mode = MODE.AUTO;
  ui.modeAutoBtn.classList.add("active");
  ui.modeManualBtn.classList.remove("active");
  ui.autoControls.classList.remove("hidden");
  ui.manualControls.classList.add("hidden");
  stopRunner(state);
});

ui.upBtn.addEventListener("click", () => game.move(0,-1));
ui.downBtn.addEventListener("click", () => game.move(0,1));
ui.leftBtn.addEventListener("click", () => game.move(-1,0));
ui.rightBtn.addEventListener("click", () => game.move(1,0));

ui.btnStep.addEventListener("click", () => state.autoStep());
ui.btnRun.addEventListener("click", () => {
  state.mode = MODE.AUTO;
  runAuto(state);
});
ui.btnStop.addEventListener("click", () => stopRunner(state));
