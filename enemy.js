// enemy.js - simple enemy class
class Enemy {
  constructor(x,y, assets) {
    this.x = x; this.y = y; this.w = 44; this.h = 44;
    this.vx = (Math.random()*40 - 20); this.vy = (Math.random()*20 + 30);
    this.dead = false; this.hp = 1;
    this.assets = assets;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -100 || this.x > 900 + 100 || this.y > 600 + 120) { this.dead = true; }
  }
  draw(ctx) {
    ctx.drawImage(this.assets.enemyImg, Math.round(this.x), Math.round(this.y), this.w, this.h);
  }
  getAABB(){ return { x:this.x, y:this.y, w:this.w, h:this.h }; }
}
