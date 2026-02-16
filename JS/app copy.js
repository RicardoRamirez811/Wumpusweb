(() => {
  const N = 5;

  // Estados del editor
  const TOOL = {
    WUMPUS: "wumpus",
    PIT: "pit",
    GOLD: "gold",
    ERASER: "eraser"
  };

  // Elementos UI
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");

  const toolButtons = {
    wumpus: document.getElementById("toolWumpus"),
    pit: document.getElementById("toolPit"),
    gold: document.getElementById("toolGold"),
    eraser: document.getElementById("toolEraser"),
  };

  const btnClear = document.getElementById("btnClear");
  const btnRandom = document.getElementById("btnRandom");
  const btnStart = document.getElementById("btnStart");
  const btnResetRun = document.getElementById("btnResetRun");

  const modeManualBtn = document.getElementById("modeManual");
  const modeAutoBtn = document.getElementById("modeAuto");
  const manualControls = document.getElementById("manualControls");
  const autoControls = document.getElementById("autoControls");

  const upBtn = document.getElementById("up");
  const downBtn = document.getElementById("down");
  const leftBtn = document.getElementById("left");
  const rightBtn = document.getElementById("right");

  const btnStep = document.getElementById("btnStep");
  const btnRun = document.getElementById("btnRun");
  const btnStop = document.getElementById("btnStop");

  // Mapa real (oculto durante juego): wumpus, pits, gold
  let world = newWorld();

  // Estado de partida
  let phase = "edit"; // edit | playing | ended
  let mode = "manual"; // manual | auto
  let runner = null;

  // Aventurero: inicia en (1,1) = esquina inferior izquierda si pintamos y=1 abajo
  // Nosotros manejamos y=0 arriba en render; entonces "inferior izquierda" es (0,4).
  const START = { x: 0, y: N - 1 };

  let agent = null; // creado al iniciar partida

  // Celdas conocidas por el aventurero
  function newKnowledge() {
    const k = [];
    for (let y = 0; y < N; y++) {
      k[y] = [];
      for (let x = 0; x < N; x++) {
        k[y][x] = {
          visited: false,
          adv: false,          // tuvo brisa o hedor al visitarla
          safeInferred: false, // inferida segura
          dead: false,         // cayó en peligro
          marks: { breeze:false, stench:false },
        };
      }
    }
    return k;
  }

  function newWorld() {
    const w = [];
    for (let y = 0; y < N; y++) {
      w[y] = [];
      for (let x = 0; x < N; x++) {
        w[y][x] = { pit:false, wumpus:false, gold:false };
      }
    }
    // por defecto oro en algún lado (pero lo puedes cambiar)
    return w;
  }

  function inside(x,y){ return x>=0 && x<N && y>=0 && y<N; }

  function neighbors4(x,y){
    const deltas = [[0,-1],[0,1],[-1,0],[1,0]];
    return deltas
      .map(([dx,dy]) => ({x:x+dx, y:y+dy}))
      .filter(p => inside(p.x,p.y));
  }

  function setStatus(msg){ statusEl.textContent = msg; }

  function countWorld(type){
    let c = 0;
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      if (world[y][x][type]) c++;
    }
    return c;
  }

  function clearWorld(){
    world = newWorld();
    phase = "edit";
    stopRunner();
    agent = null;
    setStatus("Mapa limpio. Coloca Wumpus/Agujeros/Oro y presiona “Iniciar partida”.");
    render();
  }

  // Render del tablero
  function render(){
    boardEl.innerHTML = "";

    const k = agent?.knowledge;

    for (let y=0;y<N;y++){
      for (let x=0;x<N;x++){
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;

        const xy = document.createElement("div");
        xy.className = "xy";
        xy.textContent = `${x+1},${(N-y)}`;
        cell.appendChild(xy);

        // Fondo / marcas por conocimiento
        if (phase !== "edit" && k){
          const info = k[y][x];
          if (info.dead) cell.classList.add("dead");
          else {
            if (info.safeInferred) cell.classList.add("safe-inferred");
            if (info.adv) cell.classList.add("known-adv");
          }
        }

        // Iconos:
        // - En EDIT se muestra todo
        // - En JUEGO solo se muestra aventurero y oro si lo pisa o gana
        let icon = "";
        if (phase === "edit"){
          if (world[y][x].wumpus) icon = "👹";
          else if (world[y][x].pit) icon = "🕳️";
          else if (world[y][x].gold) icon = "🏆";
        }

        if (agent && agent.pos.x === x && agent.pos.y === y && phase !== "edit"){
          icon = "🧍";
        }

        const iconEl = document.createElement("div");
        iconEl.className = "icon";
        iconEl.textContent = icon;
        cell.appendChild(iconEl);

        // Badges (brisa/hedor) SOLO si fue visitada
        if (phase !== "edit" && k){
          const info = k[y][x];
          if (info.visited){
            const marks = document.createElement("div");
            marks.className = "marks";
            if (info.marks.breeze){
              const b = document.createElement("span");
              b.className = "badge";
              b.textContent = "Brisa";
              marks.appendChild(b);
            }
            if (info.marks.stench){
              const s = document.createElement("span");
              s.className = "badge";
              s.textContent = "Hedor";
              marks.appendChild(s);
            }
            cell.appendChild(marks);
          }
        }

        cell.addEventListener("click", () => onCellClick(x,y));
        boardEl.appendChild(cell);
      }
    }
  }

  // Editor (clic en celdas)
  let currentTool = TOOL.WUMPUS;

  function setTool(t){
    currentTool = t;
    Object.values(toolButtons).forEach(b => b.classList.remove("active"));
    if (t === TOOL.WUMPUS) toolButtons.wumpus.classList.add("active");
    if (t === TOOL.PIT) toolButtons.pit.classList.add("active");
    if (t === TOOL.GOLD) toolButtons.gold.classList.add("active");
    if (t === TOOL.ERASER) toolButtons.eraser.classList.add("active");
  }

  function onCellClick(x,y){
    if (phase !== "edit"){
      return;
    }

    // No permitir colocar peligro en el inicio
    if (x === START.x && y === START.y){
      setStatus("No puedes colocar cosas en la casilla de inicio del aventurero.");
      return;
    }

    const c = world[y][x];

    if (currentTool === TOOL.ERASER){
      c.pit = false; c.wumpus = false; c.gold = false;
      render();
      return;
    }

    if (currentTool === TOOL.WUMPUS){
      // solo 1 wumpus: borrar el anterior
      for (let yy=0;yy<N;yy++) for (let xx=0;xx<N;xx++) world[yy][xx].wumpus = false;
      c.wumpus = true;
      // no mezclar
      c.pit = false;
      render();
      return;
    }

    if (currentTool === TOOL.GOLD){
      for (let yy=0;yy<N;yy++) for (let xx=0;xx<N;xx++) world[yy][xx].gold = false;
      c.gold = true;
      // oro no es peligro, lo dejamos coexistir? Mejor no:
      c.pit = false; c.wumpus = false;
      render();
      return;
    }

    if (currentTool === TOOL.PIT){
      // toggle
      c.pit = !c.pit;
      // no mezclar
      if (c.pit){ c.wumpus = false; c.gold = false; }
      render();
      return;
    }
  }

  // Sensores (advertencias)
  function senseAt(x,y){
    const neigh = neighbors4(x,y);
    let breeze = false;
    let stench = false;

    for (const p of neigh){
      if (world[p.y][p.x].pit) breeze = true;
      if (world[p.y][p.x].wumpus) stench = true;
    }
    return { breeze, stench };
  }

  // Agente “simple” (exploración segura + backtracking)
  function newAgent(){
    return {
      pos: { ...START },
      knowledge: newKnowledge(),
      stack: [], // para backtracking
      ended: false,
      won: false,
    };
  }

  function markSafeNeighborsIfNoWarning(x,y, s){
    // Si NO hay advertencia, entonces vecinos 4 son seguros.
    if (!s.breeze && !s.stench){
      for (const p of neighbors4(x,y)){
        agent.knowledge[p.y][p.x].safeInferred = true;
      }
    }
  }

  function visitCurrentCell(){
    const {x,y} = agent.pos;

    const k = agent.knowledge[y][x];
    k.visited = true;

    // ¿murió?
    if (world[y][x].pit || world[y][x].wumpus){
      k.dead = true;
      phase = "ended";
      agent.ended = true;
      setStatus("💥 Perdiste: caíste en un peligro.");
      render();
      return;
    }

    // ¿ganó?
    if (world[y][x].gold){
      phase = "ended";
      agent.ended = true;
      agent.won = true;
      setStatus("🏆 ¡Ganaste! Encontraste el oro.");
      render();
      return;
    }

    const s = senseAt(x,y);
    k.marks.breeze = s.breeze;
    k.marks.stench = s.stench;
    k.adv = s.breeze || s.stench;

    // inferencia simple
    markSafeNeighborsIfNoWarning(x,y,s);

    render();

    const warnText = [
      s.breeze ? "brisa" : null,
      s.stench ? "hedor" : null
    ].filter(Boolean).join(" y ");

    if (warnText){
      setStatus(`Estás en (${x+1},${N-y}). Sientes ${warnText}.`);
    } else {
      setStatus(`Estás en (${x+1},${N-y}). No sientes nada: vecinos marcados como seguros.`);
    }
  }

  function canMoveTo(x,y){
    return inside(x,y);
  }

  function move(dx,dy){
    if (phase !== "playing") return;
    if (agent.ended) return;

    const nx = agent.pos.x + dx;
    const ny = agent.pos.y + dy;
    if (!canMoveTo(nx,ny)) return;

    // guardar para backtracking
    agent.stack.push({ ...agent.pos });

    agent.pos.x = nx;
    agent.pos.y = ny;
    visitCurrentCell();
  }

  function startGame(){
    // Validaciones mínimas
    if (countWorld("wumpus") !== 1){
      setStatus("Coloca exactamente 1 Wumpus antes de iniciar.");
      return;
    }
    if (countWorld("gold") !== 1){
      setStatus("Coloca 1 Oro antes de iniciar (para poder ganar).");
      return;
    }

    stopRunner();
    agent = newAgent();
    phase = "playing";

    // marca inicio como visitado e inferencias
    visitCurrentCell();
    setStatus("Partida iniciada. Puedes mover manualmente o usar Auto.");
  }

  function resetRun(){
    stopRunner();
    if (phase === "edit"){
      setStatus("Aún estás en edición. Presiona “Iniciar partida” para jugar.");
      return;
    }
    agent = newAgent();
    phase = "playing";
    visitCurrentCell();
    setStatus("Partida reiniciada (mismo mapa).");
  }

  // Auto: elige una “mejor” casilla segura no visitada, si no hay, retrocede.
  function autoStep(){
    if (phase !== "playing" || agent.ended) return;

    const {x,y} = agent.pos;
    const neigh = neighbors4(x,y);

    // preferir vecinos inferidos seguros y no visitados
    const candidates = neigh.filter(p => {
      const k = agent.knowledge[p.y][p.x];
      return k.safeInferred && !k.visited;
    });

    if (candidates.length > 0){
      // elegir el primero (puedes cambiar a random si quieres)
      const target = candidates[0];
      agent.stack.push({ ...agent.pos });
      agent.pos = { ...target };
      visitCurrentCell();
      return;
    }

    // si no hay seguros nuevos, buscar vecinos visitados para moverse (explorar otras rutas)
    const visitedNeighbors = neigh.filter(p => agent.knowledge[p.y][p.x].visited);
    if (visitedNeighbors.length > 0){
      // backtracking con stack si existe
      if (agent.stack.length > 0){
        agent.pos = agent.stack.pop();
        visitCurrentCell();
        return;
      }
      // o moverse a uno visitado cualquiera
      agent.pos = { ...visitedNeighbors[0] };
      visitCurrentCell();
      return;
    }

    // sin opciones
    phase = "ended";
    agent.ended = true;
    setStatus("⛔ El agente no encontró movimientos seguros. Fin.");
    render();
  }

  function runAuto(){
    if (runner) return;
    runner = setInterval(() => {
      if (phase !== "playing" || agent?.ended){
        stopRunner();
        return;
      }
      autoStep();
    }, 450);
  }

  function stopRunner(){
    if (runner){
      clearInterval(runner);
      runner = null;
    }
  }

  // Ejemplo aleatorio (simple, sin garantizar solvencia)
  function randomExample(){
    clearWorld();

    // colocar wumpus
    placeOne("wumpus");
    // colocar oro
    placeOne("gold");

    // pits aleatorios 3-6
    const pits = 3 + Math.floor(Math.random()*4);
    for (let i=0;i<pits;i++){
      placePit();
    }

    setStatus("Ejemplo generado. Ajusta si quieres y presiona “Iniciar partida”.");
    render();

    function randomCell(){
      while (true){
        const x = Math.floor(Math.random()*N);
        const y = Math.floor(Math.random()*N);
        if (x===START.x && y===START.y) continue;
        return {x,y};
      }
    }
    function placeOne(type){
      for (let yy=0;yy<N;yy++) for (let xx=0;xx<N;xx++) world[yy][xx][type]=false;
      let p = randomCell();
      world[p.y][p.x].pit = false;
      world[p.y][p.x].wumpus = false;
      world[p.y][p.x].gold = false;
      world[p.y][p.x][type] = true;
    }
    function placePit(){
      let tries=0;
      while (tries++ < 200){
        const p = randomCell();
        const c = world[p.y][p.x];
        if (c.wumpus || c.gold || c.pit) continue;
        c.pit = true;
        return;
      }
    }
  }

  // Modo manual/auto
  function setMode(newMode){
    mode = newMode;
    modeManualBtn.classList.toggle("active", mode==="manual");
    modeAutoBtn.classList.toggle("active", mode==="auto");
    manualControls.classList.toggle("hidden", mode!=="manual");
    autoControls.classList.toggle("hidden", mode!=="auto");
    stopRunner();
  }

  // Eventos UI
  toolButtons.wumpus.addEventListener("click", () => setTool(TOOL.WUMPUS));
  toolButtons.pit.addEventListener("click", () => setTool(TOOL.PIT));
  toolButtons.gold.addEventListener("click", () => setTool(TOOL.GOLD));
  toolButtons.eraser.addEventListener("click", () => setTool(TOOL.ERASER));

  btnClear.addEventListener("click", clearWorld);
  btnRandom.addEventListener("click", randomExample);
  btnStart.addEventListener("click", startGame);
  btnResetRun.addEventListener("click", resetRun);

  modeManualBtn.addEventListener("click", () => setMode("manual"));
  modeAutoBtn.addEventListener("click", () => setMode("auto"));

  upBtn.addEventListener("click", () => move(0,-1));
  downBtn.addEventListener("click", () => move(0,1));
  leftBtn.addEventListener("click", () => move(-1,0));
  rightBtn.addEventListener("click", () => move(1,0));

  btnStep.addEventListener("click", autoStep);
  btnRun.addEventListener("click", runAuto);
  btnStop.addEventListener("click", stopRunner);

  // Inicial
  setTool(TOOL.WUMPUS);
  setMode("manual");
  setStatus("Coloca 1 Wumpus, 0+ agujeros y 1 oro. Luego “Iniciar partida”.");
  render();
})();
