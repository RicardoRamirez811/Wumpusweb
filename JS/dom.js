// ===== GESTIÓN DE ELEMENTOS DEL DOM Y INTERFAZ DE USUARIO =====

// Obtiene referencias a todos los elementos HTML de la interfaz
// Esto centraliza el acceso a los elementos del DOM
export function getUI(){
  return {
    // Elemento principal del tablero donde se dibuja el juego
    boardEl: document.getElementById("board"),
    // Elemento que muestra mensajes de estado al usuario
    statusEl: document.getElementById("status"),

    // Botones de herramientas para editar el mapa
    toolButtons: {
      wumpus: document.getElementById("toolWumpus"),  // Botón para colocar Wumpus
      pit: document.getElementById("toolPit"),        // Botón para colocar agujeros
      gold: document.getElementById("toolGold"),      // Botón para colocar oro
      eraser: document.getElementById("toolEraser"),  // Botón para borrar
    },

    // Botones principales de control del juego
    btnClear: document.getElementById("btnClear"),      // Limpia el mapa
    btnRandom: document.getElementById("btnRandom"),    // Generador de mapa aleatorio
    btnStart: document.getElementById("btnStart"),      // Inicia una nueva partida
    btnResetRun: document.getElementById("btnResetRun"),// Reinicia la partida actual

    // Botones para cambiar modos de juego
    modeManualBtn: document.getElementById("modeManual"),    // Modo de control manual
    modeAutoBtn: document.getElementById("modeAuto"),        // Modo de control automático
    manualControls: document.getElementById("manualControls"), // Panel de controles manuales
    autoControls: document.getElementById("autoControls"),     // Panel de controles automáticos

    // Botones de movimiento manual para el aventurero
    upBtn: document.getElementById("up"),      // Botón para mover hacia arriba
    downBtn: document.getElementById("down"),  // Botón para mover hacia abajo
    leftBtn: document.getElementById("left"),  // Botón para mover hacia la izquierda
    rightBtn: document.getElementById("right"),// Botón para mover hacia la derecha

    // Botones de control automático
    btnStep: document.getElementById("btnStep"),  // Hace un paso automático
    btnRun: document.getElementById("btnRun"),    // Ejecuta automático continuamente
    btnStop: document.getElementById("btnStop"),  // Detiene la ejecución automática
  };
}

// Actualiza el mensaje de estado mostrado al usuario
// Este mensaje informa sobre el estado del juego, advertencias, etc.
export function setStatus(ui, msg){
  ui.statusEl.textContent = msg;
}
