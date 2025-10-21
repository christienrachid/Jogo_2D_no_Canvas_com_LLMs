// player.js - Player class with spritesheet clipping
class Player {
  constructor(x,y, assets) {
    this.x = x; this.y = y;
    this.w = 48; this.h = 48;
    this.speed = 260;
    this.assets = assets;
    // spritesheet settings (3 frames horizontal)
    this.frameW = 48; this.frameH = 48;
    this.animations = { idle: { row:0, frames:1, fps:1 }, thrust: { row:0, frames:3, fps:10 } };
    this.curAnim = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameDelta = 1/10;
    this.shootCooldown = 0;
    this.hit = false;
    this.hitTimer = 0;
  }
  update(dt, keys, spawnBullet) {
    let dx=0, dy=0;
    if (keys['KeyW']||keys['ArrowUp']) dy -= 1;
    if (keys['KeyS']||keys['ArrowDown']) dy += 1;
    if (keys['KeyA']||keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD']||keys['ArrowRight']) dx += 1;
    const moving = dx!==0 || dy!==0;
    this.curAnim = moving ? 'thrust' : 'idle';
    if (dx!==0 && dy!==0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;
    // clamp
    this.x = Math.max(8, Math.min(900-this.w-8, this.x));
    this.y = Math.max(8, Math.min(600-this.h-8, this.y));
    // animation
    const anim = this.animations[this.curAnim];
    if (anim) {
      this.frameDelta = 1/anim.fps;
      this.frameTimer += dt;
      if (this.frameTimer >= this.frameDelta) {
        this.frameTimer -= this.frameDelta;
        this.frameIndex = (this.frameIndex + 1) % anim.frames;
      }
    }
    // shooting
    this.shootCooldown -= dt;
    if ((keys['Space']||keys['KeyK']) && this.shootCooldown <= 0) {
      spawnBullet(this.x + this.w/2 - 3, this.y, -600);
      this.shootCooldown = 0.18;
    }
    if (this.hit) { this.hitTimer -= dt; if (this.hitTimer <= 0) this.hit = false; }
  }
  draw(ctx) {
    const anim = this.animations[this.curAnim];
    const frameX = this.frameIndex * this.frameW;
    const sx = frameX;
    const sy = 0;
    if (this.hit) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'rgba(255,100,100,0.12)';
      ctx.fillRect(this.x-6,this.y-6,this.w+12,this.h+12);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(this.assets.playerSheet, sx, sy, this.frameW, this.frameH, Math.round(this.x), Math.round(this.y), this.w, this.h);
  }
  getAABB(){ return {x:this.x, y:this.y, w:this.w, h:this.h}; }
}
