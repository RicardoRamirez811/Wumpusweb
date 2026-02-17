// ===== ADMINISTRACIÓN DEL AGENTE (AVENTURERO) =====

import { N, START } from "./config.js";

// Crea la estructura de conocimiento del aventurero
// El aventurero mantiene un mapa mental de lo que sabe sobre cada celda del mundo
export function newKnowledge(){
  // Crea una matriz NxN donde cada celda guarda información sobre lo que el aventurero sabe
  return Array.from({length:N}, () =>
    Array.from({length:N}, () => ({
      visited:false,          // ¿Ha visitado esta celda?
      adv:false,              // ¿Detectó advertencia aquí? (brisa o hedor)
      safeInferred:false,     // ¿Se infirió que es segura? (sin advertencias en vecinos)
      dead:false,             // ¿Murió aquí en este intento?
      dangerKnown:false,      // ¿Se confirmó que hay peligro aquí?
      breezeSeen:false,       // ¿Está marcada esta celda por tener brisa cercana?
      stenchSeen:false,       // ¿Está marcada esta celda por tener hedor cercano?
      marks:{ breeze:false, stench:false }, // Indicadores de advertencias específicas
    }))
  );
}

// Crea una instancia nueva del aventurero al iniciar el juego
export function newAgent(){
  return {
    pos: { ...START },          // Posición actual: inicia en la esquina inferior izquierda
    knowledge: newKnowledge(),  // Mapa mental del aventurero (lo que sabe del mundo)
    stack: [],                  // Pila de posiciones para backtracking (volver atrás)
    ended: false,               // ¿Terminó la partida?
    won: false,                 // ¿Ganó el aventurero?
  };
}

// Limpia las marcas de muerte en el conocimiento del aventurero
// Se usa cuando reinicia una partida para olvidar dónde murió en intentos anteriores
export function clearDeadMarks(agent){
  for (let y=0;y<N;y++) for (let x=0;x<N;x++){
    agent.knowledge[y][x].dead = false; // Marca que esta celda ya no es "lugar de muerte"
  }
}
