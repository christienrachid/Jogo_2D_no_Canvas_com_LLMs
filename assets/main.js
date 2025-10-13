// main.js - Jogo 'Nave no Espaço'
// Contém toda a lógica: inicialização, loop (update/draw), controles, paralaxe,
// projéteis, inimigos, colisão AABB e reinício.

// --------------------------------------------------
// Configurações iniciais e referência ao canvas
// --------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// HUD
const scoreEl = document.getElementById('score');

// --------------------------------------------------
// Estado do jogo
// --------------------------------------------------
let keys = {};
let score = 0;
let gameOver = false;

// --------------------------------------------------
// Paralaxe: 3 camadas com diferentes velocidades
// Cada camada é um conjunto de estrelas geradas uma vez e desenhadas deslocadas
// --------------------------------------------------
const parallaxLayers = [
  {speed: 0.2, stars: []}, // distante
  {speed: 0.6, stars: []}, // médio
  {speed: 1.2, stars: []}  // perto
];

// Gera estrelas para cada camada
function initParallax(){
  for(let i=0;i<parallaxLayers.length;i++){
    const layer = parallaxLayers[i];
    layer.stars = [];
    const count = 60 - i*20; // menos estrelas nas camadas distantes
    for(let s=0;s<count;s++){
      layer.stars.push({
        x: Math.random()*WIDTH,
        y: Math.random()*HEIGHT,
        size: Math.random()*(i+1)+0.3
      });
    }
  }
}

// --------------------------------------------------
// Objetos reutilizáveis: pools simples para projéteis e inimigos
// --------------------------------------------------
function Pool(createFn, size){
  this.items = [];
  this.createFn = createFn;
  for(let i=0;i<size;i++) this.items.push(createFn());
}
Pool.prototype.get = function(){
  for(let i=0;i<this.items.length;i++){
    if(!this.items[i].active) return this.items[i];
  }
  // se nada disponível, crie mais (crescimento controlado)
  const it = this.createFn();
  this.items.push(it);
  return it;
}

// --------------------------------------------------
// Player (nave)
// --------------------------------------------------
const player = {
  x: WIDTH/2,
  y: HEIGHT - 80,
  w: 36,
  h: 48,
  speed: 4.2,
  cooldown: 0,
  cooldownMax: 12, // frames entre tiros
  alive: true
};

// --------------------------------------------------
// Projetéis
// --------------------------------------------------
function createProjectile(){
  return {x:0,y:0,w:4,h:10,vy:-7,active:false};
}
const projectilePool = new Pool(createProjectile, 20);

// --------------------------------------------------
// Inimigos (asteroides)
// --------------------------------------------------
function createEnemy(){
  return {x:0,y:0,w:32,h:32,vy:1.2,active:false,rotation:0,rotSpeed:0};
}
const enemyPool = new Pool(createEnemy, 12);

// Spawn inicial e taxa de spawn
let spawnTimer = 0;
const spawnInterval = 60; // frames entre spawns

// --------------------------------------------------
// Controles de teclado
// --------------------------------------------------
window.addEventListener('keydown', (e)=>{
  keys[e.code] = true;
  // evitar scroll com setas/espaço
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e)=>{ keys[e.code] = false; });

// Reiniciar com R
window.addEventListener('keydown', (e)=>{
  if(e.code === 'KeyR') resetGame();
});

// --------------------------------------------------
// Funções utilitárias
// --------------------------------------------------
function rectsIntersect(a,b){
  // AABB (Axis-Aligned Bounding Box)
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnEnemy(){
  const e = enemyPool.get();
  e.active = true;
  e.w = 24 + Math.random()*20;
  e.h = e.w;
  e.x = Math.random()*(WIDTH - e.w);
  e.y = -e.h - 10;
  e.vy = 1.2 + Math.random()*1.8;
  e.rotSpeed = (Math.random()-0.5)*0.06;
  e.rotation = Math.random()*Math.PI*2;
}

// Ajustar som de tiro para evitar interrupções
const shootSound = new Audio('shoot-hit.mp3');
shootSound.preload = 'auto';
shootSound.volume = 1.0; // Ajustar volume, se necessário

// Adicionar som de game over
const gameOverSound = new Audio('game-over.mp3');
gameOverSound.preload = 'auto';
gameOverSound.volume = 1.0; // Ajustar volume, se necessário

function fireProjectile() {
  if (player.cooldown > 0) return;
  const p = projectilePool.get();
  p.active = true;
  p.x = player.x + player.w / 2 - p.w / 2;
  p.y = player.y - p.h - 4;
  p.vy = -7 - Math.random() * 1.5;
  player.cooldown = player.cooldownMax;

  // Tocar som de tiro sem interrupções
  if (!shootSound.paused) {
    shootSound.currentTime = 0; // Reinicia o som se já estiver tocando
  }
  shootSound.play();
}

// --------------------------------------------------
// Update: atualiza lógica do jogo (movimento, spawn, colisões)
// --------------------------------------------------
function update(){
  if(gameOver) {
    if (!gameOverSound.played) {
      gameOverSound.play();
    }
    return;
  }

  // player movimento - aceita setas e WASD
  if(keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
  if(keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
  if(keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed;
  if(keys['ArrowDown'] || keys['KeyS']) player.y += player.speed;

  // keep player inside canvas
  player.x = Math.max(4, Math.min(WIDTH - player.w - 4, player.x));
  player.y = Math.max(4, Math.min(HEIGHT - player.h - 4, player.y));

  // tiro com espaço
  if(keys['Space']) fireProjectile();
  if(player.cooldown>0) player.cooldown--;

  // atualizar projéteis
  for(const p of projectilePool.items){
    if(!p.active) continue;
    p.y += p.vy;
    if(p.y + p.h < 0) p.active = false;
  }

  // spawn de inimigos
  spawnTimer++;
  if(spawnTimer >= spawnInterval){
    spawnTimer = 0;
    spawnEnemy();
  }

  // atualizar inimigos
  for(const e of enemyPool.items){
    if(!e.active) continue;
    e.y += e.vy;
    e.rotation += e.rotSpeed;
    if(e.y > HEIGHT + 50) e.active = false;
  }

  const hitSound = new Audio('shoot-hit.mp3');

  // colisão projéteis x inimigos
  for (const p of projectilePool.items) {
    if (!p.active) continue;
    for (const e of enemyPool.items) {
      if (!e.active) continue;
      if (rectsIntersect(p, e)) {
        // desativar ambos
        p.active = false;
        e.active = false;

        // Tocar som de acerto
        hitSound.currentTime = 0; // Reinicia o som para evitar atraso
        hitSound.play();

        score += 10;
        scoreEl.textContent = score;
        break;
      }
    }
  }

  // colisão player x inimigos -> reinicia
  for (const e of enemyPool.items) {
    if (!e.active) continue;
    const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (rectsIntersect(playerBox, e)) {
      // game over
      gameOver = true;
      player.alive = false;
      gameOverSound.currentTime = 0; // Reinicia o som para evitar atraso
      gameOverSound.play();
      break;
    }
  }

  // mover parallax (deslocamento vertical para dar sensação de movimento)
  for(const layer of parallaxLayers){
    for(const s of layer.stars){
      s.y += layer.speed;
      if(s.y > HEIGHT) s.y = 0;
    }
  }
}

// --------------------------------------------------
// Draw: renderiza toda a cena no canvas
// --------------------------------------------------
function draw(){
  // limpar
  ctx.clearRect(0,0,WIDTH,HEIGHT);

  // desenhar parallax
  for(let i=0;i<parallaxLayers.length;i++){
    const layer = parallaxLayers[i];
    ctx.fillStyle = `rgba(255,255,255,${0.08 + i*0.06})`;
    for(const s of layer.stars){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // desenhar projéteis
  ctx.fillStyle = '#a7ffeb';
  for(const p of projectilePool.items){
    if(!p.active) continue;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
  }

  // desenhar inimigos (asteroides simples)
  for(const e of enemyPool.items){
    if(!e.active) continue;
    ctx.save();
    ctx.translate(e.x + e.w/2, e.y + e.h/2);
    ctx.rotate(e.rotation);
    ctx.fillStyle = '#9b8f8f';
    ctx.beginPath();
    ctx.moveTo(-e.w/2, -e.h/2);
    ctx.lineTo(e.w/2, -e.h/2);
    ctx.lineTo(e.w/2, e.h/2);
    ctx.lineTo(-e.w/2, e.h/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // desenhar player (nave)
  if(player.alive){
    ctx.save();
    // nave estilizada com triângulo
    ctx.translate(player.x + player.w/2, player.y + player.h/2);
    ctx.fillStyle = '#68e0cf';
    ctx.beginPath();
    ctx.moveTo(0, -player.h/2);
    ctx.lineTo(player.w/2, player.h/2);
    ctx.lineTo(-player.w/2, player.h/2);
    ctx.closePath();
    ctx.fill();
    // detalhe cockpit
    ctx.fillStyle = '#053f3a';
    ctx.fillRect(-6, -2, 12, 6);
    ctx.restore();
  } else {
    // efeito de explosão simples
    ctx.fillStyle = 'orangered';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH/2, HEIGHT/2 - 10);
    ctx.font = '14px sans-serif';
    ctx.fillText('Pressione R para reiniciar', WIDTH/2, HEIGHT/2 + 18);
  }

  // score -> já atualizado no DOM, mas desenhar também no canvas
  ctx.fillStyle = 'rgba(230,238,243,0.9)';
  ctx.font = '16px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Pontuação: ' + score, 10, 22);
}

// --------------------------------------------------
// Loop principal usando requestAnimationFrame
// --------------------------------------------------
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// --------------------------------------------------
// Reiniciar jogo
// --------------------------------------------------
function resetGame(){
  score = 0;
  scoreEl.textContent = score;
  gameOver = false;
  player.alive = true;
  player.x = WIDTH/2 - player.w/2;
  player.y = HEIGHT - 80;
  player.cooldown = 0;
  // desativar todos inimigos e projéteis
  for(const e of enemyPool.items) e.active = false;
  for(const p of projectilePool.items) p.active = false;
  spawnTimer = 0;
}

// --------------------------------------------------
// Inicialização
// --------------------------------------------------
function init(){
  // ajustar posição inicial do player
  player.x = WIDTH/2 - player.w/2;
  player.y = HEIGHT - 80;

  initParallax();
  resetGame();
  loop();
}

// start
init();

// Comentários: Este arquivo organiza o código em seções claras:
// - Inicialização do canvas e HUD
// - Parallax (3 camadas)
// - Pools para reuso de projéteis e inimigos (evita new no loop)
// - Player, inimigos e projéteis com propriedades básicas
// - update(): todas as atualizações de estado
// - draw(): toda a renderização
// - Colisão AABB para detecção simples
// - Reinício do jogo quando o jogador colide com um inimigo