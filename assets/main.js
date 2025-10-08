const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ===== Sprites =====
const imgNave = new Image();
imgNave.src = "nave.png";
const imgAsteroide = new Image();
imgAsteroide.src = "asteroide.png";

// ===== Entidades =====
const player = { x: 100, y: 400, w: 80, h: 80, speed: 5 };
const tiros = [];
const inimigos = [];

// ===== Sistema de vidas =====
let vidas = 5;

// ===== Controle de teclas =====
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

// ===== Fundo com paralaxe =====
const stars1 = Array.from({ length: 60 }, () => ({
  x: Math.random() * 960,
  y: Math.random() * 540,
  s: 1,
}));
const stars2 = Array.from({ length: 40 }, () => ({
  x: Math.random() * 960,
  y: Math.random() * 540,
  s: 2,
}));
const stars3 = Array.from({ length: 20 }, () => ({
  x: Math.random() * 960,
  y: Math.random() * 540,
  s: 3,
}));

function drawParallax(stars, speed, color) {
  ctx.fillStyle = color;
  for (let star of stars) {
    ctx.fillRect(star.x, star.y, star.s, star.s);
    star.x -= speed;
    if (star.x < 0) {
      star.x = 960;
      star.y = Math.random() * 540;
    }
  }
}

// ===== Sistema de disparo com delay =====
let lastShotTime = 0;
const shootDelay = 300; // milissegundos

function shoot() {
  const now = Date.now();
  if (now - lastShotTime < shootDelay) return;
  lastShotTime = now;

  tiros.push({
    x: player.x + player.w,
    y: player.y + player.h / 2 - 4,
    w: 16,
    h: 8,
    speed: 8,
  });
}

// ===== Inimigos (Asteróides) =====
function spawnInimigo() {
  const size = 50 + Math.random() * 50; // tamanhos variados
  const speed = 3 + Math.random() * 4; // velocidade aleatória (3 a 7)
  inimigos.push({
    x: canvas.width + Math.random() * 100, // aparecem fora da tela
    y: Math.random() * (canvas.height - size),
    w: size,
    h: size,
    speed: speed,
  });
}

// Mais asteróides por segundo
setInterval(spawnInimigo, 700); // antes era 1500ms

// ===== Colisão =====
function colisao(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

// ===== Atualização =====
function update() {
  // Movimento da nave
  if (keys["ArrowRight"] || keys["KeyD"]) player.x += player.speed;
  if (keys["ArrowLeft"] || keys["KeyA"]) player.x -= player.speed;
  if (keys["ArrowUp"] || keys["KeyW"]) player.y -= player.speed;
  if (keys["ArrowDown"] || keys["KeyS"]) player.y += player.speed;

  // Tiro
  if (keys["Space"]) shoot();

  // Limites da tela
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

  // Atualiza tiros
  for (let i = tiros.length - 1; i >= 0; i--) {
    const t = tiros[i];
    t.x += t.speed;
    if (t.x > canvas.width) tiros.splice(i, 1);
  }

  // Atualiza inimigos
  for (let i = inimigos.length - 1; i >= 0; i--) {
    const e = inimigos[i];
    e.x -= e.speed;
    if (e.x + e.w < 0) inimigos.splice(i, 1);
  }

  // Colisão tiro x inimigo
  for (let i = inimigos.length - 1; i >= 0; i--) {
    for (let j = tiros.length - 1; j >= 0; j--) {
      if (colisao(inimigos[i], tiros[j])) {
        inimigos.splice(i, 1);
        tiros.splice(j, 1);
        break;
      }
    }
  }

  // Colisão nave x inimigo
  for (let i = inimigos.length - 1; i >= 0; i--) {
    if (colisao(player, inimigos[i])) {
      inimigos.splice(i, 1);
      vidas--;
      if (vidas <= 0) {
        alert("Você perdeu! O jogo será reiniciado.");
        resetGame();
        return;
      }
    }
  }
}

// ===== Reset do jogo =====
function resetGame() {
  player.x = 100;
  player.y = 400;
  vidas = 5;
  inimigos.length = 0;
  tiros.length = 0;
  lastShotTime = 0;
}

// ===== Desenho =====
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawParallax(stars1, 0.5, "#333");
  drawParallax(stars2, 1.0, "#777");
  drawParallax(stars3, 1.5, "#fff");

  // Nave
  if (imgNave.complete) {
    ctx.drawImage(
      imgNave,
      60,
      20,
      400,
      410,
      player.x,
      player.y,
      player.w,
      player.h
    );
  }

  // Tiros
  ctx.fillStyle = "#0ff";
  for (const t of tiros) ctx.fillRect(t.x, t.y, t.w, t.h);

  // Inimigos
  if (imgAsteroide.complete) {
    for (const e of inimigos) {
      ctx.drawImage(imgAsteroide, 30, 30, 200, 200, e.x, e.y, e.w, e.h);
    }
  }

  // HUD - Vidas
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`Vidas: ${vidas}`, 10, 30);
}

// ===== Loop principal =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
