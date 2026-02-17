// ===== LÓGICA PRINCIPAL DEL JUEGO =====
// Maneja las acciones principales: movimiento, ganar/perder, reiniciar, etc.

import { PHASE, MODE, START } from "./config.js";
import { countWorld } from "./world.js";
import { newAgent, clearDeadMarks } from "./agent.js";
import { senseAt, markSafeNeighborsIfNoWarning } from "./sensors.js";

// Constructor que retorna las funciones principales del juego
// Recibe dependencias como argumentos para facilitar testing
export function buildGameActions(ui, state, setStatus, render, stopRunner, runAuto){
  // Reinicia la partida manteniendo la memoria del agente sobre peligros confirmados
  // Se usa en modo automático para reintentos
  function restartAutoKeepMemory(){
    clearDeadMarks(state.agent);              // Olvida dónde murió en este intento
    state.agent.pos = { ...START };           // Vuelve a la posición inicial
    state.agent.stack = [];                   // Limpia el stack de backtracking
    state.phase = PHASE.PLAYING;              // Reanuda el juego
    state.agent.ended = false;                // El agente ya no ha terminado
    visitCurrentCell();                       // Procesa la celda de inicio
  }

  // Verifica si aún existen alternativas alcanzables sin pisar peligros conocidos
  // Usa BFS para explorar desde el inicio
  function existsAnyAlternative(){
    const N = state.N;
    // Matriz para rastrear qué celdas ya revisamos
    const seen = Array.from({length:N}, () => Array(N).fill(false));
    
    // Cola para BFS (búsqueda en amplitud)
    const q = [{...START}];
    seen[START.y][START.x] = true;

    // Recorre el grafo de celdas accesibles
    while (q.length){
      const cur = q.shift();
      const k = state.agent.knowledge[cur.y][cur.x];
      // Si encuentro una celda no visitada, hay una alternativa
      if (!k.visited) return true;

      // Expande a los vecinos
      for (const nb of state.neighbors4(cur.x, cur.y)){
        if (seen[nb.y][nb.x]) continue;                          // Ya visitamos este nodo
        if (state.agent.knowledge[nb.y][nb.x].dangerKnown) continue; // No es seguro
        seen[nb.y][nb.x] = true;
        q.push(nb);
      }
    }
    // No hay celdas no visitadas alcanzables de forma segura
    return false;
  }

  // Procesa lo que sucede cuando el agente llega a una celda
  // Detecta si ganó, perdió, o continúa
  function visitCurrentCell(){
    const {x,y} = state.agent.pos;
    const k = state.agent.knowledge[y][x];
    // Marca la celda como visitada
    k.visited = true;

    // ===== VERIFICAR SI MURIÓ =====
    if (state.world[y][x].pit || state.world[y][x].wumpus){
      k.dead = true;                 // Marca que murió aquí
      k.dangerKnown = true;          // Confirma que aquí hay peligro
      state.phase = PHASE.ENDED;     // Termina el juego
      state.agent.ended = true;

      const motivo = state.world[y][x].pit ? "un agujero" : "el Wumpus";
      setStatus(ui, `💥 Perdiste: caíste en ${motivo}. Reiniciando automáticamente...`);
      render(ui, state);

      // En modo automático: intenta reiniciar si hay alternativas
      if (state.mode === MODE.AUTO){
        // Si no hay forma de ganar desde aquí, termina definitivamente
        if (!existsAnyAlternative()){
          stopRunner(state);
          setStatus(ui, "⛔ No hay solución: se agotaron las alternativas (posible bloqueo total por agujeros).");
          render(ui, state);
          return;
        }
        // Inicia el loop automático si no está ejecutándose
        if (!state.runner) runAuto(state);
        // Reinicia después de un pequeño delay para que el jugador vea el error
        setTimeout(() => restartAutoKeepMemory(), 350);
      }
      return;
    }

    // ===== VERIFICAR SI GANÓ (ENCONTRÓ EL ORO) =====
    if (state.world[y][x].gold){
      state.phase = PHASE.ENDED;
      state.agent.ended = true;
      state.agent.won = true;

      setStatus(ui, "🏆 ¡Ganaste! Encontraste el oro. Regresando al inicio...");
      render(ui, state);

      // Después de visual feedback, mueve al aventurero de vuelta al inicio
      setTimeout(() => {
        state.agent.pos = { ...START };
        render(ui, state);
        setStatus(ui, "🏁 Partida exitosa finalizada. Aventurero de regreso en el inicio.");
      }, 700);

      // Detiene el loop automático (ya ganó)
      stopRunner(state);
      return;
    }

    // ===== LA CELDA ES SEGURA: PROCESAR SENSORES =====
    // Detecta brisa (agujero cercano) y hedor (Wumpus cercano)
    const s = senseAt(state.world, x, y);
    // Registra las advertencias detectadas en esta celda
    k.marks.breeze = s.breeze;
    k.marks.stench = s.stench;
    k.adv = s.breeze || s.stench; // Marca que hubo advertencia

    // Marca persistente de la celda según lo sensado
    if (s.breeze) k.breezeSeen = true;
    if (s.stench) k.stenchSeen = true;

    // Inferencia lógica: si no hay advertencia, los vecinos son seguros
    markSafeNeighborsIfNoWarning(state.agent, x, y, s);
    // Redibuja el tablero con la nueva información
    render(ui, state);

    // Actualiza el mensaje de estado con lo que el aventurero siente
    const warnText = [s.breeze ? "brisa" : null, s.stench ? "hedor" : null].filter(Boolean).join(" y ");
    setStatus(ui, warnText
      ? `Estás en (${x+1},${state.N-y}). Sientes ${warnText}.`
      : `Estás en (${x+1},${state.N-y}). No sientes nada: vecinos marcados como seguros.`
    );
  }

  // Inicia una nueva partida después de validar que el mapa es válido
  function startGame(){
    // Valida que hay exactamente 1 Wumpus
    if (countWorld(state.world, "wumpus") !== 1){
      setStatus(ui, "Coloca exactamente 1 Wumpus antes de iniciar.");
      return;
    }
    // Valida que hay exactamente 1 oro (objetivo del juego)
    if (countWorld(state.world, "gold") !== 1){
      setStatus(ui, "Coloca 1 Oro antes de iniciar (para poder ganar).");
      return;
    }

    // Detiene cualquier loop automático anterior
    stopRunner(state);
    // Crea una nueva instancia del agente
    state.agent = newAgent();
    state.phase = PHASE.PLAYING;
    // Procesa la celda de inicio (detecta advertencias)
    visitCurrentCell();
    setStatus(ui, "Partida iniciada. Puedes mover manualmente o usar Auto.");
  }

  // Reinicia la partida actual con el mismo mapa
  function resetRun(){
    stopRunner(state);
    // Solo permite reiniciar si estamos jugando o si terminó
    if (state.phase === PHASE.EDIT){
      setStatus(ui, "Aun estás en edición. Presiona 'Iniciar partida' para jugar.");
      return;
    }
    // Crea un nuevo agente pero mantiene el mundo
    state.agent = newAgent();
    state.phase = PHASE.PLAYING;
    // Procesa la celda de inicio
    visitCurrentCell();
    setStatus(ui, "Partida reiniciada (mismo mapa).");
  }

  function move(dx,dy){
    // Solo permite movimiento durante la partida
    if (state.phase !== PHASE.PLAYING) return;
    if (state.agent.ended) return;

    // Calcula la nueva posición
    const nx = state.agent.pos.x + dx;
    const ny = state.agent.pos.y + dy;
    // Valida que está dentro del tablero
    if (!state.inside(nx,ny)) return;

    // Guarda la posición actual para backtracking
    state.agent.stack.push({ ...state.agent.pos });
    // Actualiza la posición del agente
    state.agent.pos = { x:nx, y:ny };
    // Procesa lo que sucede en la nueva celda
    visitCurrentCell();
  }

  // Retorna las acciones del juego para ser usadas por main.js
  return { startGame, resetRun, move, visitCurrentCell };
}
