const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const player = { x: 100, y: 400, w: 40, h: 40, speed: 4 };
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function update() {
  if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
  if (keys['ArrowLeft']  || keys['KeyA']) player.x -= player.speed;
  if (keys['ArrowUp']    || keys['KeyW']) player.y -= player.speed;
  if (keys['ArrowDown']  || keys['KeyS']) player.y += player.speed;
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#6cf';
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
