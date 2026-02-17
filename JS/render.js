// ===== RENDERIZADO DEL TABLERO EN LA PANTALLA =====
// Se encarga de dibujar el estado actual del juego en el navegador

import { N } from "./config.js";

// Redibuja completamente el tablero basado en el estado actual del juego
// Crea visualmente cada celda con sus características, colores e iconos
export function render(ui, state){
  const { world, agent, phase } = state;

  // Limpia el tablero anterior para redibujarlo desde cero
  ui.boardEl.innerHTML = "";
  const k = agent?.knowledge; // Conocimiento que el agente tiene del mundo

  // Recorre todas las celdas del tablero
  for (let y=0;y<N;y++){
    for (let x=0;x<N;x++){
      const cell = document.createElement("div"); // Crea elemento de celda
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;

      // Añade las coordenadas de la celda en la esquina (1,6) (2,5) etc
      const xy = document.createElement("div");
      xy.className = "xy";
      xy.textContent = `${x+1},${(N-y)}`;
      cell.appendChild(xy);

      // ===== APLICAR COLORES SEGÚN EL ESTADO (fuera del modo edición) =====
      if (phase !== "edit" && k){
        const info = k[y][x]; // Información que el agente conoce de esta celda

        // Marca visuales persistentes por advertencias detectadas
        if (info.breezeSeen) cell.classList.add("breeze-mark");  // Resalta brisa detectada
        if (info.stenchSeen) cell.classList.add("stench-mark");  // Resalta hedor detectado

        // Marcas de peligro conocido
        if (info.dangerKnown) cell.classList.add("known-danger"); // Rojo: peligro confirmado
        if (info.dead) cell.classList.add("dead");               // Negro: murió aquí

        // Marcas de seguridad
        if (!info.dead){
          if (info.safeInferred) cell.classList.add("safe-inferred");  // Verde: inferido seguro
          if (info.adv) cell.classList.add("known-adv");              // Amarillo: advertencia sensada
        }

        // Marcas de oro encontrado (cuando termina el juego)
        if (phase === "ended" && world[y][x].gold){
          cell.classList.add("found-gold");
        }
      }

      // ===== MOSTRAR ICONOS =====
      let icon = "";
      
      // En modo edición: muestra los objetos colocados
      if (phase === "edit"){
        if (world[y][x].wumpus) icon = "👹";   // Wumpus
        else if (world[y][x].pit) icon = "🕳️"; // Agujero
        else if (world[y][x].gold) icon = "🏆"; // Oro
      } else {
        // En modo juego: muestra oro (si hay) y al aventurero
        if (phase === "ended" && world[y][x].gold) icon = "🏆";
        // Muestra al aventurero SOLO si no está en la misma celda que el oro (para que se vea el oro)
        if (agent && agent.pos.x === x && agent.pos.y === y && !(phase === "ended" && world[y][x].gold)){
          icon = "🧍";
        }
      }

      // Añade el ícono a la celda
      const iconEl = document.createElement("div");
      iconEl.className = "icon";
      iconEl.textContent = icon;
      cell.appendChild(iconEl);

      // ===== MOSTRAR BADGES (BRISA/HEDOR) EN CELDAS VISITADAS =====
      if (phase !== "edit" && k){
        const info = k[y][x];
        // Solo muestra estos badges si la celda ya fue visitada
        if (info.visited){
          const marks = document.createElement("div");
          marks.className = "marks";

          // Añade badge de brisa si fue detectada
          if (info.marks.breeze){
            const b = document.createElement("span");
            b.className = "badge breeze";
            b.textContent = "Brisa";
            marks.appendChild(b);
          }
          
          // Añade badge de hedor si fue detectado
          if (info.marks.stench){
            const s = document.createElement("span");
            s.className = "badge stench";
            s.textContent = "Hedor";
            marks.appendChild(s);
          }
          
          cell.appendChild(marks);
        }
      }

      // Añade la celda completamente renderizada al tablero
      ui.boardEl.appendChild(cell);
    }
  }
}
