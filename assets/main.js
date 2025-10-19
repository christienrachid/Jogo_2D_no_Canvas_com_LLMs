// === CONFIGURAÇÃO INICIAL ===
const canvas = document.getElementById("game");
if (!canvas) throw new Error("Canvas element with id 'game' not found.");
const ctx = canvas.getContext && canvas.getContext("2d");
if (!ctx) throw new Error("2D context not available on canvas.");

const CSS_WIDTH = parseInt(getComputedStyle(canvas).width, 10) || 900;
const CSS_HEIGHT = parseInt(getComputedStyle(canvas).height, 10) || 450;
canvas.width = CSS_WIDTH;
canvas.height = CSS_HEIGHT;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_SURFACE_Y = HEIGHT - 5;

// === IMAGENS ===
const imgSky = new Image();
const imgTrees = new Image();
const imgGround = new Image();
const imgPlayer = new Image();
const imgObstacle = new Image();
const imgTopo = new Image();

imgSky.src = "img/sky.png";
imgTrees.src = "img/trees.png";
imgGround.src = "img/ground.png";
imgPlayer.src = "img/player_run.png"; 
imgObstacle.src = "img/obstacle.png";
imgTopo.src = "img/topo.png";

imgPlayer.addEventListener('load', () => {
  const w = imgPlayer.naturalWidth;
  const h = imgPlayer.naturalHeight;
  spriteCols = Math.max(1, Math.floor(w / spriteFrameW));
  spriteRows = Math.max(1, Math.floor(h / spriteFrameH));
  spriteTotalFrames = spriteCols * spriteRows;
  console.log(`player sprite loaded: ${w}x${h}, cols=${spriteCols}, rows=${spriteRows}, total=${spriteTotalFrames}`);
});
if (imgPlayer.complete) {
  const ev = new Event('load');
  imgPlayer.dispatchEvent(ev);
}


// === VARIÁVEIS DE ESTADO ===
let gameOver = false;
let score = 0;
let lastTime = 0;
let obstacleTimer = 0;
let obstacleInterval = 2000; 
let frameTimer = 0;
let frameInterval = 100; 
let currentFrame = 0;
let spriteFrameW = 64;
let spriteFrameH = 64;
let spriteCols = 1;
let spriteRows = 1;
let spriteTotalFrames = 1;

// === PLAYER ===
const player = {
  x: 100,
  y: GROUND_SURFACE_Y - 64,
  width: 64,
  height: 64,
  vy: 0,
  gravity: 0.7,
  jumpForce: -18,
  grounded: true,
  state: "run", // run ou jump
};

// === PARTÍCULAS DE POEIRA ===
let particles = [];
function createDust() {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height,
      size: Math.random() * 4 + 2,
      vy: Math.random() * -1 - 1,
      life: 1,
    });
  }
}

// === OBSTÁCULOS ===
let obstacles = [];

// === PARALAXE ===
const parallax = [
  { img: imgSky, x: 0, speed: 0.2 },
  { img: imgTopo, x: 0, speed: 0.6 },
  { img: imgTrees, x: 0, speed: 0.6 },
  { img: imgGround, x: 0, speed: 2.5 },
];

// === CONTROLES ===
document.addEventListener("keydown", (e) => {
  if ((e.code === "Space" || e.code === "ArrowUp") && player.grounded && !gameOver) {
    player.vy = player.jumpForce;
    player.grounded = false;
    player.state = "jump";
    createDust();
  }

  if (gameOver && e.code === "KeyR") {
    restartGame();
  }
});

// === FUNÇÕES ===
function update(deltaTime) {
  if (gameOver) return;

  // Atualiza paralaxe
  parallax.forEach((layer) => {
    layer.x -= layer.speed;
    if (layer.x <= -WIDTH) layer.x = 0;
  });

  // Atualiza player
  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y >= GROUND_SURFACE_Y - player.height) {
    player.y = GROUND_SURFACE_Y - player.height;
    player.vy = 0;
    player.grounded = true;
    if (player.state !== "run") player.state = "run";
  }

  // Partículas
  particles.forEach((p) => {
    p.y += p.vy;
    p.life -= 0.03;
  });
  particles = particles.filter((p) => p.life > 0);

  // Obstáculos
  obstacleTimer += deltaTime;
  if (obstacleTimer > obstacleInterval) {
    obstacles.push({
      x: WIDTH + Math.random() * 100,
      y: GROUND_SURFACE_Y - 95,
      width: 50,
      height: 68,
    });
    obstacleTimer = 0;
  }

  obstacles.forEach((obs) => (obs.x -= 4));
  obstacles = obstacles.filter((obs) => obs.x + obs.width > 0);

  // Colisão
  obstacles.forEach((obs) => {
    if (checkCollision(player, obs)) {
      triggerFlash();
      gameOver = true;
    }
  });

  // Pontuação
  score += deltaTime / 1000;
  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.textContent = Math.floor(score);

  // Controle de frames do sprite
  frameTimer += deltaTime;
  if (frameTimer > frameInterval) {
    currentFrame = (currentFrame + 1) % (spriteTotalFrames || 1);
    frameTimer = 0;
  }
}

function draw() {
  // Fundo com paralaxe
  parallax.forEach((layer) => {
    if (layer.img && layer.img.complete) {
      ctx.drawImage(layer.img, layer.x, 0, WIDTH, HEIGHT);
      ctx.drawImage(layer.img, layer.x + WIDTH, 0, WIDTH, HEIGHT);
    }
  });

  // Poeira
  particles.forEach((p) => {
    ctx.fillStyle = `rgba(150, 120, 60, ${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Player 
  if (imgPlayer && imgPlayer.complete) {
    const cols = spriteCols || Math.max(1, Math.floor(imgPlayer.naturalWidth / spriteFrameW));
    const fw = spriteFrameW;
    const fh = spriteFrameH;
    const sx = (currentFrame % cols) * fw;
    const sy = Math.floor(currentFrame / cols) * fh;
    ctx.drawImage(
      imgPlayer,
      sx,
      sy,
      fw,
      fh,
      player.x,
      player.y,
      player.width,
      player.height
    );
  }

  // Obstáculos
  obstacles.forEach((obs) => {
    if (imgObstacle && imgObstacle.complete) ctx.drawImage(imgObstacle, obs.x, obs.y, obs.width, obs.height);
  });

  // HUD
  ctx.fillStyle = "#fff";
  ctx.font = "24px 'Press Start 2P', monospace";
  ctx.fillText(`Score: ${Math.floor(score)}`, 30, 40);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#fff";
    ctx.font = "36px 'Press Start 2P'";
    ctx.fillText("GAME OVER", WIDTH / 2 - 160, HEIGHT / 2);
    ctx.font = "18px 'Press Start 2P'";
    ctx.fillText("Press R to Restart", WIDTH / 2 - 150, HEIGHT / 2 + 50);
  }

  // Flash
  if (flashOpacity > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flashOpacity})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    flashOpacity -= 0.05;
  }
}

// === COLISÃO AABB ===
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// === FLASH NA COLISÃO ===
let flashOpacity = 0;
function triggerFlash() {
  flashOpacity = 0.8;
}

// === REINÍCIO ===
function restartGame() {
  obstacles = [];
  particles = [];
  score = 0;
  player.y = GROUND_SURFACE_Y - player.height;
  player.vy = 0;
  player.grounded = true;
  gameOver = false;
}

// === LOOP PRINCIPAL ===
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let deltaTime = timestamp - lastTime;
  if (deltaTime > 100) deltaTime = 100;
  lastTime = timestamp;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

