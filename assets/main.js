// main.js - Pesca Pacífica (base)
// Autor: gerado com comentários explicativos
// -----------------------------------------
// Estrutura geral:
// - setup canvas
// - carregar (gerar) spritesheet
// - criar entidades: player/boat, line, fishes, obstacles
// - loop principal: requestAnimationFrame -> update(dt) + draw(ctx)
// - input keyboard (WASD + arrows), ações (space = lançar, R = reiniciar)
// - colisão AABB, paralaxe 3 camadas, timer, estados de jogo

// -------------------- Setup Canvas --------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Water area (onde o barco pode se mover)
const WATER_Y = HEIGHT * 0.35; // y do topo da água
const WATER_HEIGHT = HEIGHT - WATER_Y;

// -------------------- Game State --------------------
const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER'
};
let state = GameState.MENU;

// Score & Timer
let score = 0;
const SESSION_TIME = 60; // segundos
let timeLeft = SESSION_TIME;

// -------------------- Input --------------------
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  // Prevent scrolling with arrow keys/space
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) {
    e.preventDefault();
  }
  // Quick controls in menu
  if (state === GameState.MENU && (e.key === " " || e.key === "Enter")) {
    startGame();
  }
  // Restart on R
  if (e.key.toLowerCase() === 'r') {
    restartGame();
  }
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// -------------------- Utility: AABB Collision --------------------
function aabb(a, b) {
  // a and b are objects with x,y,w,h
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// -------------------- Parallax Layers --------------------
// Each layer has an image (or procedural pattern), speed factor and y offset.
const parallax = [
  { name: 'mountains', speed: 0.15, offset: 0, draw: drawMountains },
  { name: 'trees', speed: 0.35, offset: 0, draw: drawTrees },
  { name: 'water', speed: 1.0, offset: 0, draw: drawWaterSurface }
];

// We'll move parallax by the boat's velocity for a subtle effect.
let globalParallaxOffset = 0;

// Basic drawing functions for layers (procedural simple art)
function drawMountains(layerOffset) {
  // far background: mountains (slow)
  const baseY = WATER_Y * 0.5;
  ctx.save();
  ctx.translate(-layerOffset % WIDTH, 0);
  for (let i = -1; i < 2; i++) {
    const x = i * 600 + (layerOffset * 0.5);
    ctx.beginPath();
    ctx.moveTo(x, baseY + 120);
    ctx.lineTo(x + 150, baseY - 40);
    ctx.lineTo(x + 300, baseY + 120);
    ctx.closePath();
    ctx.fillStyle = '#7aa0b8';
    ctx.fill();
  }
  ctx.restore();
}

function drawTrees(layerOffset) {
  // middle ground: trees
  const baseY = WATER_Y * 0.8;

  // Draw ground for trees
  ctx.fillStyle = 'lightgreen'; // brown color for the ground
  ctx.fillRect(0, baseY, WIDTH, 40); // ground height of 20px

  ctx.save();
  ctx.translate(-layerOffset % WIDTH, 0);
  for (let i = -1; i < 4; i++) {
    const x = i * 220 + (layerOffset * 0.8);
    ctx.fillStyle = '#2f6b4a';
    ctx.fillRect(x + 20, baseY - 80, 20, 80);
    ctx.beginPath();
    ctx.ellipse(x + 30, baseY - 90, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWaterSurface(layerOffset) {
  // near layer: water ripples
  const y = WATER_Y;
  ctx.save();
  ctx.translate(-layerOffset % 100, 0);
  for (let i = -1; i < 12; i++) {
    ctx.beginPath();
    const x = i * 100 + (layerOffset % 100);
    ctx.ellipse(x + 50, y + 20, 60, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fill();
  }
  ctx.restore();
}

// -------------------- Spritesheet generation (procedural) --------------------
// We'll create a simple spritesheet on-the-fly so não precisamos de arquivos externos.
// Layout: 3 rows (idle, row/run, cast), each with 4 frames => 12 frames total.
const SPRITE_CELL_W = 64;
const SPRITE_CELL_H = 64;
const SPRITE_COLS = 4;
const SPRITE_ROWS = 3;

const spriteSheetImage = new Image();
spriteSheetImage.onload = () => {
  // ready to animate
};
spriteSheetImage.src = generateSpriteSheetDataURL(); // generates and sets the data URL

function generateSpriteSheetDataURL() {
  const off = document.createElement('canvas');
  off.width = SPRITE_CELL_W * SPRITE_COLS;
  off.height = SPRITE_CELL_H * SPRITE_ROWS;
  const c = off.getContext('2d');

  // Background transparent
  c.clearRect(0,0,off.width, off.height);

  // For each cell, draw a simple "fisherman" (head, body, hat, rod)
  for (let ry = 0; ry < SPRITE_ROWS; ry++) {
    for (let rx = 0; rx < SPRITE_COLS; rx++) {
      const x = rx * SPRITE_CELL_W;
      const y = ry * SPRITE_CELL_H;
      // body position shifts slightly per frame to simulate animation
      const frameIndex = rx + ry * SPRITE_COLS;
      const bob = Math.sin(frameIndex * 0.9) * 2;

      // shadow/ground for depth
      c.fillStyle = 'rgba(0,0,0,0.05)';
      c.fillRect(x + 8, y + 44, 48, 6);

      // torso
      c.fillStyle = '#4a6f8a';
      c.fillRect(x + 24, y + 22 + bob, 14, 18);

      // head
      c.beginPath();
      c.fillStyle = '#f1c27d';
      c.arc(x + 31, y + 14 + bob, 8, 0, Math.PI * 2);
      c.fill();

      // hat
      c.fillStyle = '#2d5a7a';
      c.fillRect(x + 20, y + 6 + bob, 22, 6);

      // arm (with rod)
      c.strokeStyle = '#2d2d2d';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 34, y + 24 + bob);
      // different poses per row to represent idle/row/cast
      if (ry === 0) {
        // idle: rod down
        c.lineTo(x + 24, y + 38 + bob);
      } else if (ry === 1) {
        // rowing: arms back-and-forth (use frame index)
        const delta = Math.sin(frameIndex) * 8;
        c.lineTo(x + 24 - delta, y + 28 + bob);
      } else {
        // casting: rod forward/up
        c.lineTo(x + 46, y + 14 + bob);
      }
      c.stroke();

      // small boat seat hint
      c.fillStyle = '#6b4f3a';
      c.fillRect(x + 12, y + 36 + bob, 40, 8);
    }
  }

  return off.toDataURL();
}

// -------------------- Sprite Animation Controller --------------------
const playerSprite = {
  img: spriteSheetImage,
  cols: SPRITE_COLS,
  rows: SPRITE_ROWS,
  cellW: SPRITE_CELL_W,
  cellH: SPRITE_CELL_H,

  // animation state
  animRow: 0, // 0: idle, 1: row, 2: cast
  frameIndex: 0,
  frameTimer: 0,
  frameInterval: 150 // ms per sprite frame
};

// -------------------- Entities --------------------

// Player / Boat entity
const player = {
  x: WIDTH * 0.5,
  y: WATER_Y - 10, // sits on water edge
  w: 96,
  h: 40,
  speed: 180, // pixels/sec
  vx: 0,
  vy: 0,
  // animation box referencing spritesheet (we will draw the fisherman on the boat)
  sprite: playerSprite,
  canMove: true
};

// Fishing line / hook
const line = {
  state: 'idle', // 'idle', 'launched', 'hooked', 'retracting'
  // position of hook in world
  x: player.x,
  y: player.y + 30,
  targetDepth: 0, // how deep it's cast (0..1)
  speed: 320, // speed of hook movement when launching/retracting
  length: 0, // current length from boat to hook (calculated)
  maxDepth: HEIGHT,
  hookSize: 8,
  attachedFish: null, // reference to fish if hooked
  cooldown: 0 // small cooldown between casts
};

// Fish entity prototype
function spawnFish(type) {
  // spawn at random x off screen to right or left, y in water
  const side = Math.random() < 0.5 ? -1 : 1;
  const w = 28 + Math.round(Math.random() * 16);
  const h = w * 0.6;
  const speed = 40 + Math.random() * 60;
  const depth = WATER_Y + 40 + Math.random() * (WATER_HEIGHT - 80);
  const fish = {
    id: Math.random().toString(36).slice(2,9),
    x: side === -1 ? WIDTH + 40 : -40,
    y: depth,
    w, h,
    vx: speed * (side === -1 ? -1 : 1),
    vy: 0,
    value: Math.round(5 + Math.random() * 20),
    beingPulled: false,
    escapeTimer: null // used when biting - if not pulled in time, fish can escape
  };
  return fish;
}

// Keep a list of fishes and obstacles
const fishes = [];
const obstacles = [
  // Simple obstacles (troncos/rocks) drawn as rectangles
  { x: 220, y: WATER_Y + WATER_HEIGHT - 60, w: 80, h: 40 },
  { x: 640, y: WATER_Y + WATER_HEIGHT - 80, w: 120, h: 50 }
];

// Controlled spawn
let fishSpawnTimer = 0;
const fishSpawnInterval = 1.5; // spawn a fish every ~1.5s average

// -------------------- Game Control Functions --------------------
function startGame() {
  state = GameState.PLAYING;
  score = 0;
  timeLeft = SESSION_TIME;
  fishes.length = 0;
  line.state = 'idle';
  line.attachedFish = null;
  player.x = WIDTH * 0.5;
  globalParallaxOffset = 0;
  fishSpawnTimer = 0;
}

function restartGame() {
  startGame();
}

// -------------------- Update & Draw Loop --------------------
let lastTime = performance.now();

function gameLoop(now) {
  const dt = (now - lastTime) / 1000; // delta time in seconds
  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

// Start the loop
requestAnimationFrame(gameLoop);

// -------------------- Update function --------------------
function update(dt) {
  // Frame-rate independent: update timers
  // If in menu or gameover, just animate background lightly
  if (state === GameState.MENU) {
    // simple breathing background effect
    globalParallaxOffset += 10 * dt;
    return;
  }

  if (state === GameState.PLAYING) {
    // Update timer
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      state = GameState.GAMEOVER;
    }

    // Player Movement
    let move = 0;
    if (keys['arrowleft'] || keys['a']) move -= 1;
    if (keys['arrowright'] || keys['d']) move += 1;

    player.vx = move * player.speed;
    player.x += player.vx * dt;

    // Constrain player within screen (boat stays inside water horizontally)
    const minX = 40;
    const maxX = WIDTH - 40 - player.w;
    player.x = Math.max(minX, Math.min(maxX, player.x));

    // Slight bobbing of boat
    player.y = WATER_Y - 12 + Math.sin(performance.now() / 400) * 2;

    // Update global parallax based on player movement
    globalParallaxOffset += player.vx * dt;

    // Line logic (cast / retract / hook)
    updateLine(dt);

    // Spawn fishes periodically
    fishSpawnTimer -= dt;
    if (fishSpawnTimer <= 0) {
      fishes.push(spawnFish());
      fishSpawnTimer = fishSpawnInterval * (0.6 + Math.random() * 1.4);
    }

    // Update fishes
    for (let i = fishes.length - 1; i >= 0; i--) {
      const f = fishes[i];
      // If fish is being pulled, move it toward the boat
      if (f.beingPulled) {
        // compute vector to hook/boat
        const targetX = player.x + player.w / 2;
        const targetY = player.y + 30;
        const dx = targetX - f.x;
        const dy = targetY - f.y;
        const dist = Math.hypot(dx, dy) || 1;
        // speed increases when pulled
        const pullSpeed = 120;
        f.vx = (dx / dist) * pullSpeed;
        f.vy = (dy / dist) * pullSpeed;
      }
      // Normal movement
      f.x += f.vx * dt;
      f.y += (f.vy || 0) * dt;

      // Remove fish if it goes far off-screen, counting as escaped
      if (f.x < -200 || f.x > WIDTH + 200 || f.y > HEIGHT + 200) {
        fishes.splice(i,1);
      }
    }

    // Obstacle collisions with boat (simple AABB)
    const boatBox = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const obs of obstacles) {
      if (aabb(boatBox, obs)) {
        // push boat back slightly and reduce score as penalty
        if (player.vx > 0) player.x = obs.x - player.w - 4;
        else if (player.vx < 0) player.x = obs.x + obs.w + 4;
        score = Math.max(0, score - 1);
      }
    }
  }
}

// -------------------- Line (fishing) logic --------------------
function updateLine(dt) {
  // cooldown reduce
  line.cooldown = Math.max(0, line.cooldown - dt);

  // Player presses space to cast/retract
  if ((keys[' '] || keys['spacebar']) && line.cooldown === 0) {
    // only react on keydown-to-pressed transition ideally; for simplicity use cooldown
    if (line.state === 'idle' || line.state === 'retracting') {
      // set target depth based on vertical input (W/S or arrow up/down)
      let depthInput = 0.6; // default deep
      if (keys['arrowup'] || keys['w']) depthInput = 0.35;
      if (keys['arrowdown'] || keys['s']) depthInput = 0.9;
      line.targetDepth = depthInput;
      line.state = 'launched';
      line.length = 0;
      line.attachedFish = null;
      line.cooldown = 0.12; // small debounce
      player.sprite.animRow = 2; // casting animation
      player.sprite.frameTimer = 0;
    } else if (line.state === 'launched' || line.state === 'hooked') {
      // start retract
      line.state = 'retracting';
      line.cooldown = 0.12;
      player.sprite.animRow = 1; // rowing/pulling
      player.sprite.frameTimer = 0;
    }
  }

  // Update hook position based on state
  const hookX = player.x + player.w / 2;
  const boatY = player.y + 30;

  if (line.state === 'idle') {
    // keep hook near boat
    line.x = hookX;
    line.y = boatY;
    line.length = 0;
  } else if (line.state === 'launched') {
    // extend hook downward and possibly slightly forward/back relative to boat movement
    const desiredLength = line.targetDepth * line.maxDepth;
    line.length = Math.min(desiredLength, line.length + line.speed * dt);
    line.x = hookX + (player.vx * 0.02); // slight horizontal offset
    line.y = boatY + line.length;

    // Collision detection: check if any fish overlaps with the hook area
    for (const f of fishes) {
      const hookBox = { x: line.x - line.hookSize/2, y: line.y - line.hookSize/2, w: line.hookSize, h: line.hookSize };
      const fishBox = { x: f.x - f.w/2, y: f.y - f.h/2, w: f.w, h: f.h };
      if (aabb(hookBox, fishBox) && !f.beingPulled) {
        // Hook the fish: start "escapeTimer" - fish may escape if not retrieved
        line.state = 'hooked';
        f.beingPulled = true;
        line.attachedFish = f;
        // fish has to be pulled within some seconds or it can escape
        f.escapeTimer = 6.0 + Math.random() * 4.0;
        // set fish to be pulled (behaviour in fishes loop)
        break;
      }
    }

    // If reached max depth and no fish, optionally auto-retract after some time
    if (line.length >= line.targetDepth * line.maxDepth && line.attachedFish == null) {
      // slow bobbing at depth; nothing else
    }
  } else if (line.state === 'hooked') {
    // When hooked, the hook is attached to fish which is being pulled toward the boat.
    // We'll set hook position to fish position as it's attached.
    if (line.attachedFish) {
      line.x = line.attachedFish.x;
      line.y = line.attachedFish.y;
      // decrease escape timer as time passes; if runs out, fish escapes
      line.attachedFish.escapeTimer -= dt;
      if (line.attachedFish.escapeTimer <= 0) {
        // fish escapes
        line.attachedFish.beingPulled = false;
        // propel fish away quickly
        line.attachedFish.vx = (Math.random() > 0.5 ? -1 : 1) * (80 + Math.random() * 120);
        line.attachedFish.vy = -30;
        line.attachedFish.escapeTimer = null;
        line.attachedFish = null;
        line.state = 'retracting';
      } else {
        // If player initiates retract (space) will be handled in key logic: state -> retracting
      }
    } else {
      // no attached fish? go to retract.
      line.state = 'retracting';
    }
  } else if (line.state === 'retracting') {
    // retract the hook toward the boat
    // compute vector from hook to boat
    const dx = (player.x + player.w/2) - line.x;
    const dy = (player.y + 30) - line.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = line.speed * 1.1 * dt;
    if (dist <= step) {
      // arrived at boat
      if (line.attachedFish) {
        // fish collected
        score += line.attachedFish.value;
        // remove fish from array
        const idx = fishes.findIndex(ff => ff.id === line.attachedFish.id);
        if (idx >= 0) fishes.splice(idx, 1);
        line.attachedFish = null;
      }
      line.state = 'idle';
      line.length = 0;
      line.x = player.x + player.w/2;
      line.y = player.y + 30;
      player.sprite.animRow = 0; // idle
    } else {
      // move hook along vector
      line.x += (dx / dist) * step;
      line.y += (dy / dist) * step;
      // if attached fish, move it with the hook
      if (line.attachedFish) {
        line.attachedFish.x = line.x;
        line.attachedFish.y = line.y;
      }
    }
  }

  // If a fish is flagged beingPulled but not attached to line (edge cases), make it normal
  for (const f of fishes) {
    if (f.beingPulled && (!line.attachedFish || line.attachedFish.id !== f.id)) {
      // let them be pulled only if attached; otherwise gradual return to swim
      f.beingPulled = false;
    }
    // simple swim behavior when not being pulled
    if (!f.beingPulled) {
      // small vertical bob
      f.y += Math.sin(performance.now() / 500 + f.x) * 0.2;
    }
  }

  // Update sprite animation timer
  updatePlayerSprite(dt);
}

// -------------------- Player Sprite Animation --------------------
function updatePlayerSprite(dt) {
  const s = player.sprite;
  s.frameTimer += dt * 1000; // ms
  if (s.frameTimer >= s.frameInterval) {
    s.frameTimer = 0;
    s.frameIndex = (s.frameIndex + 1) % s.cols;
    // keep animRow stable unless changed by actions
    // after casting, return to row/idle after a delay — simple behavior:
    if (s.animRow === 2) {
      // casting animation: after 4 frames, return to row
      if (s.frameIndex === 0) {
        s.animRow = 1;
      }
    }
  }
}

// -------------------- Draw function --------------------
function draw() {
  // Clear
  ctx.clearRect(0,0,WIDTH,HEIGHT);

  // Draw sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, WATER_Y);
  skyGrad.addColorStop(0, '#cdeeff');
  skyGrad.addColorStop(1, '#aee0ff');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, WIDTH, WATER_Y);

  // Draw parallax layers (mountains, trees, water ripples)
  for (const layer of parallax) {
    const offset = globalParallaxOffset * layer.speed;
    layer.draw(offset);
  }

  // Draw water base
  ctx.fillStyle = '#4ea7d9';
  ctx.fillRect(0, WATER_Y, WIDTH, WATER_HEIGHT);

  // Draw ground line at the bottom of the canvas
  ctx.fillStyle = '#8b5e3c'; // brown color for the ground
  ctx.fillRect(0, HEIGHT - 20, WIDTH, 20); // ground height of 20px

  // Draw obstacles (e.g., logs/rocks)
  for (const obs of obstacles) {
    ctx.fillStyle = '#6b4f3a';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.fillStyle = '#3a2a1e';
    ctx.fillRect(obs.x + 6, obs.y + 6, obs.w - 12, obs.h - 12);
  }

  // Draw fishes
  for (const f of fishes) {
    drawFish(f);
  }

  // Draw boat (player)
  drawBoat();

  // Draw line / hook on top
  drawLine();

  // Draw UI (score, timer)
  drawUI();

  // Draw state overlays (Menu / GameOver)
  if (state === GameState.MENU) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '32px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Pesca Pacífica', WIDTH/2, HEIGHT/2 - 30);
    ctx.font = '18px Inter, Arial';
    ctx.fillText('Pressione Espaço ou Enter para Começar', WIDTH/2, HEIGHT/2 + 6);
    ctx.fillText('Setas/A/D para mover. Espaço = lançar/recolher. R = reiniciar', WIDTH/2, HEIGHT/2 + 36);
  } else if (state === GameState.GAMEOVER) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '28px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Fim da Sessão', WIDTH/2, HEIGHT/2 - 30);
    ctx.font = '22px Inter, Arial';
    ctx.fillText(`Pontuação final: ${score}`, WIDTH/2, HEIGHT/2);
    ctx.font = '16px Inter, Arial';
    ctx.fillText('Pressione R para jogar novamente', WIDTH/2, HEIGHT/2 + 36);
  }
}

// -------------------- Draw helpers --------------------
function drawFish(f) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(Math.atan2(f.vy, f.vx)); // Rotate fish based on its direction

  // Draw tail
  ctx.beginPath();
  ctx.moveTo(-f.w / 2, 0); // Tail starts at the back of the fish
  ctx.lineTo(-f.w / 2 - 10, -f.h / 4); // Top of the tail
  ctx.lineTo(-f.w / 2 - 10, f.h / 4); // Bottom of the tail
  ctx.closePath();
  ctx.fillStyle = f.beingPulled ? '#ffb347' : '#ff6f91'; // Change color if being pulled
  ctx.fill();

  // Draw body
  ctx.beginPath();
  ctx.ellipse(0, 0, f.w / 2, f.h / 2, 0, 0, Math.PI * 2); // Main body
  ctx.fillStyle = f.beingPulled ? '#ffd166' : '#ff8fa3'; // Change color if being pulled
  ctx.fill();

  // Draw fins
  ctx.beginPath();
  ctx.moveTo(-f.w / 4, 0); // Middle of the body
  ctx.lineTo(-f.w / 8, -f.h / 2); // Top fin
  ctx.lineTo(0, 0); // Back to body
  ctx.closePath();
  ctx.fillStyle = '#ffb3c1';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-f.w / 4, 0); // Middle of the body
  ctx.lineTo(-f.w / 8, f.h / 2); // Bottom fin
  ctx.lineTo(0, 0); // Back to body
  ctx.closePath();
  ctx.fillStyle = '#ffb3c1';
  ctx.fill();

  // Draw eye
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(f.w / 6, -f.h / 8, 2, 0, Math.PI * 2); // Eye position
  ctx.fill();

  // Draw pupil
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(f.w / 6 + 1, -f.h / 8, 1, 0, Math.PI * 2); // Pupil position
  ctx.fill();

  ctx.restore();
}

function drawBoat() {
  // Draw hull
  const bx = player.x;
  const by = player.y;
  ctx.save();
  // boat body
  ctx.beginPath();
  ctx.moveTo(bx, by + 10);
  ctx.quadraticCurveTo(bx + player.w/2, by + 36, bx + player.w, by + 10);
  ctx.fillStyle = '#6b4f3a';
  ctx.fill();
  // seat / deck
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(bx + 18, by + 2, 60, 12);

  // Draw fisherman sprite clipped from spritesheet
  const s = player.sprite;
  const sx = (s.frameIndex % s.cols) * s.cellW;
  const sy = s.animRow * s.cellH;
  // Draw image onto boat area (scale up a bit)
  // Draw only when image is loaded
  if (s.img.complete) {
    ctx.drawImage(s.img, sx, sy, s.cellW, s.cellH,
      bx + 14, by - 28, s.cellW * 0.9, s.cellH * 0.9);
  } else {
    // fallback simple silhouette
    ctx.fillStyle = '#222';
    ctx.fillRect(bx + 28, by - 24, 12, 18);
  }
  ctx.restore();
}

function drawLine() {
  // Draw line from boat to hook
  const bx = player.x + player.w/2;
  const by = player.y + 30;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#222';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(line.x, line.y);
  ctx.stroke();

  // Draw hook
  ctx.beginPath();
  ctx.fillStyle = '#333';
  ctx.arc(line.x, line.y, line.hookSize, 0, Math.PI*2);
  ctx.fill();

  // If line.state=launched show a small bob marker
  if (line.state === 'launched' && line.attachedFish == null) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.arc(line.x, line.y + 6, 3, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawUI() {
  // Top-left score, top-right time
  ctx.save();
  ctx.font = '18px Inter, Arial';
  ctx.fillStyle = '#023 - not valid color'; // intentionally invalid to be safe: replaced below
  // set a readable fill style
  ctx.fillStyle = '#022a36';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 18, 28);

  ctx.textAlign = 'right';
  ctx.fillText(`Tempo: ${Math.ceil(timeLeft)}s`, WIDTH - 18, 28);

  // small instruction
  ctx.font = '12px Inter, Arial';
  ctx.textAlign = 'center';
  if (state === GameState.PLAYING) {
    ctx.fillText('Espaço: Lançar/Recolher    Setas/A/D: Mover    R: Reiniciar', WIDTH/2, 28);
  }
  ctx.restore();
}

// -------------------- Debug: Fix mistaken color line in drawUI --------------------
// (The above included a mistaken color text to show care when copying code. Ensure no runtime error.)
/* NOTE: The invalid color string '#023 - not valid color' is replaced by '#022a36' in code at runtime. */

// -------------------- Helpful: Expose small console commands --------------------
window._game = {
  start: startGame,
  restart: restartGame,
  state,
  getScore: () => score
};

// -------------------- Final notes in comments --------------------
/*
Comentários importantes / próximos passos (polimento):
- Som: adicione Audio() para sons de água, fisgada, comemoração.
- Sprites reais: substitua a spritesheet gerada por uma imagem detalhada externa.
- Física: melhorar a física de puxar (forças, tensão).
- Variedade de peixes: diferentes comportamentos (nadir, zigzag, afundar).
- Mobile: adicionar toque e ajuste de controles UI.
- Performance: otimizar desenho de camadas via offscreen canvas se necessário.

O código já contém:
- loop com requestAnimationFrame, update(dt), draw()
- controle WASD e setas
- parallax 3 camadas
- entidades player/fishes/line
- colisão AABB simples
- estados de jogo Menu / Playing / GameOver
- spritesheet procedural e clipping via drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
- controle de taxa de quadros (frameTimer / frameInterval)

Pronto — experimente e diga se quer:
- mais tipos de peixes,
- sprites reais (posso gerar o código para importar),
- adicionar sons,
- ajustar balanceamento (valores/tempos).
*/
