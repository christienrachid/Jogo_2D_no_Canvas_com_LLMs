// game.js - main engine tying everything together
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: true });
const GAME_WIDTH = 900, GAME_HEIGHT = 600;
canvas.width = GAME_WIDTH; canvas.height = GAME_HEIGHT;

const keys = {};
window.addEventListener('keydown',(e)=>{ keys[e.code]=true; if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault(); });
window.addEventListener('keyup',(e)=>{ keys[e.code]=false; });

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function rectsIntersect(a,b){ return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h); }

// Assets object and loading
const assets = { playerSheet: new Image(), enemyImg: new Image(), bgLayer1: new Image(), bgLayer2: new Image(), bgLayer3: new Image(), bulletImg: new Image() };
assets.bgLayer1.src = 'assets/bg-nebula.jpg';
assets.bgLayer2.src = 'assets/bg_asteroids1.jpg';
assets.bgLayer3.src = 'assets/bg_asteroids.png';
assets.playerSheet.src = 'assets/player.png';
assets.enemyImg.src = 'assets/enemy.png';
assets.bulletImg.src = 'assets/bullet.png';

// Parallax layers
const parallax = [
  { img: assets.bgLayer1, speed: 0.15, offset: 0 },
  { img: assets.bgLayer2, speed: 0.4, offset: 0 },
  { img: assets.bgLayer3, speed: 0.8, offset: 0 }
];

// Entities and pools
const entities = { player: null, enemies: [], bullets: [] };
const BULLET_POOL_SIZE = 30;
for (let i=0;i<BULLET_POOL_SIZE;i++) entities.bullets.push({ active:false, x:0,y:0,w:6,h:14,vy:-480 });

// spawn bullet reusing pool
function spawnBullet(x,y,vy) {
  const pool = entities.bullets;
  for (let i=0;i<pool.length;i++) {
    const b = pool[i];
    if (!b.active) { b.active=true; b.x=x; b.y=y; b.w=6; b.h=14; b.vy=vy; return b; }
  }
  return null;
}

// game state
let lastTime = 0, paused=false, score=0, enemyTimer=0;

// initialize after assets loaded
function init() {
  entities.player = new Player(GAME_WIDTH/2 - 24, GAME_HEIGHT - 120, assets);
  spawnEnemyWave();
  window.addEventListener('keydown', (e)=>{ if (e.code === 'KeyP') paused = !paused; });
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function spawnEnemyWave() {
  const x = Math.random() * (GAME_WIDTH-60) + 30;
  entities.enemies.push(new Enemy(x, -60, assets));
}

function update(dt) {
  if (paused) return;
  parallax.forEach(layer => { layer.offset += layer.speed * dt * 60; layer.offset %= (layer.img.width||800); });
  entities.player.update(dt, keys, spawnBullet);
  // bullets
  for (let i=0;i<entities.bullets.length;i++) {
    const b = entities.bullets[i];
    if (!b.active) continue;
    b.y += b.vy * dt;
    if (b.y + b.h < -20 || b.y > GAME_HEIGHT + 40) { b.active = false; }
  }
  // enemies
  for (let i=entities.enemies.length-1;i>=0;i--) {
    const e = entities.enemies[i];
    e.update(dt);
    if (e.dead) { entities.enemies.splice(i,1); continue; }
  }
  // collisions bullet vs enemy
  for (let i=0;i<entities.bullets.length;i++) {
    const b = entities.bullets[i];
    if (!b.active) continue;
    for (let j=entities.enemies.length-1;j>=0;j--) {
      const e = entities.enemies[j];
      if (rectsIntersect({x:b.x,y:b.y,w:b.w,h:b.h}, e.getAABB())) {
        b.active = false; e.dead = true; score += 10; document.getElementById('score').textContent = 'Pontos: ' + score; break;
      }
    }
  }
  // enemy vs player
  for (let i=entities.enemies.length-1;i>=0;i--) {
    const e = entities.enemies[i];
    if (rectsIntersect(e.getAABB(), entities.player.getAABB())) {
      e.dead = true; entities.player.hit = true; entities.player.hitTimer = 0.6; entities.player.y += 12; score = Math.max(0, score - 25);
      document.getElementById('score').textContent = 'Pontos: ' + score;
    }
  }
  enemyTimer += dt;
  if (enemyTimer > 1.1) { spawnEnemyWave(); enemyTimer = 0; }
}

function draw() {
  ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT);
  parallax.forEach(layer => {
    if (!layer.img.complete) return;
    const img = layer.img; const w = img.width, h = img.height;
    const scale = GAME_HEIGHT / h; const sw = w, sh = h;
    const offset = layer.offset % w; const dx1 = -offset * scale;
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.drawImage(img, 0, 0, sw, sh, dx1, 0, sw*scale, GAME_HEIGHT);
    ctx.drawImage(img, 0, 0, sw, sh, dx1 + sw*scale, 0, sw*scale, GAME_HEIGHT);
    ctx.restore();
  });
  // enemies
  entities.enemies.forEach(e => e.draw(ctx));
  // bullets
  ctx.save();
  for (let i=0;i<entities.bullets.length;i++) {
    const b = entities.bullets[i];
    if (!b.active) continue;
    ctx.drawImage(assets.bulletImg, Math.round(b.x), Math.round(b.y), b.w, b.h);
  }
  ctx.restore();
  // player
  entities.player.draw(ctx);
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    ctx.fillStyle = 'white'; ctx.font = '36px Arial'; ctx.textAlign = 'center'; ctx.fillText('PAUSADO', GAME_WIDTH/2, GAME_HEIGHT/2);
  }
}

function loop(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Wait for core assets
function checkAssetsAndStart() {
  if (assets.playerSheet.complete && assets.enemyImg.complete && assets.bgLayer1.complete) init();
  else setTimeout(checkAssetsAndStart, 100);
}
checkAssetsAndStart();
