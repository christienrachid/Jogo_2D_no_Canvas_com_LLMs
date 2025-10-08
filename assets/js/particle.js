export class Particle {
  constructor(x, y, size, color, speedX, speedY, life) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * size + 1;
    this.color = color;
    this.speedX = speedX;
    this.speedY = speedY;
    this.life = life;
    this.initialLife = this.life;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.life > 0) this.life--;
  }

  draw(context) {
    context.save();
    context.globalAlpha = this.life / this.initialLife;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}
