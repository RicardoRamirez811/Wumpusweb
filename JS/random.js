// js/random.js
import { N, START } from "./config.js";

function randInt(max){
  return Math.floor(Math.random() * max);
}

function randomCell(){
  while (true){
    const x = randInt(N);
    const y = randInt(N);
    if (x === START.x && y === START.y) continue;
    return { x, y };
  }
}

function clearType(world, type){
  for (let y=0;y<N;y++) for (let x=0;x<N;x++){
    world[y][x][type] = false;
  }
}

function placeOne(world, type){
  clearType(world, type);

  const p = randomCell();
  // limpia la celda para no mezclar
  world[p.y][p.x].pit = false;
  world[p.y][p.x].wumpus = false;
  world[p.y][p.x].gold = false;

  world[p.y][p.x][type] = true;
}

function placePit(world){
  let tries = 0;
  while (tries++ < 500){
    const p = randomCell();
    const c = world[p.y][p.x];
    if (c.wumpus || c.gold || c.pit) continue;
    c.pit = true;
    return true;
  }
  return false;
}

export function randomExample(state){
  // NO cambia a "edit" aquí; lo hacemos desde main
  // Genera: 1 wumpus, 1 oro, y 3-6 agujeros
  placeOne(state.world, "wumpus");
  placeOne(state.world, "gold");

  const pits = 3 + randInt(4); // 3..6
  for (let i=0;i<pits;i++){
    placePit(state.world);
  }
}
