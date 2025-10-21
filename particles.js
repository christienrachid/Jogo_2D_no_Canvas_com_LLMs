// particles.js - simple particle pool for explosion effects
class Particle {
  constructor() {
    this.active = false;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.life = 0; this.maxLife = 0;
    this.size = 2; this.color = 'white';
  }
  spawn(x,y,vx,vy,life,size,color) {
    this.active = true;
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life; this.size = size || 2; this.color = color || 'white';
  }
  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    const t = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = t;
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

class ParticlePool {
  constructor(size) {
    this.pool = [];
    for (let i=0;i<size;i++) this.pool.push(new Particle());
  }
  spawnBurst(x,y,count,color) {
    for (let i=0;i<count;i++) {
      const p = this.getInactive();
      if (!p) break;
      const ang = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random()*220;
      const vx = Math.cos(ang) * speed;
      const vy = Math.sin(ang) * speed;
      const life = 0.35 + Math.random()*0.25;
      const size = 1 + Math.floor(Math.random()*3);
      p.spawn(x, y, vx, vy, life, size, color || '#ffd080');
    }
  }
  getInactive() {
    for (let i=0;i<this.pool.length;i++) {
      if (!this.pool[i].active) return this.pool[i];
    }
    return null;
  }
  update(dt) {
    for (let i=0;i<this.pool.length;i++) this.pool[i].update(dt);
  }
  draw(ctx) {
    for (let i=0;i<this.pool.length;i++) this.pool[i].draw(ctx);
  }
}
