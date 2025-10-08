import { EnemyProjectile } from "./projectile.js";

export class Enemy {
  constructor(gameWidth, gameHeight, gameTime) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.width = 50;
    this.height = 40;
    this.x = Math.random() * (gameWidth - this.width);
    this.y = -this.height;
    this.speed = Math.random() * 100 + 70;
    this.markedForDeletion = false;

    const maxCooldown = Math.max(0.8, 2.5 - gameTime / 30);
    const minCooldown = Math.max(0.4, 1.0 - gameTime / 40);
    this.shootCooldown =
      Math.random() * (maxCooldown - minCooldown) + minCooldown;
    this.shootTimer = 0;
  }

  update(deltaTime, enemyProjectiles) {
    this.y += this.speed * deltaTime;
    if (this.y > this.gameHeight + this.height) this.markedForDeletion = true;

    this.shootTimer += deltaTime;
    if (
      this.shootTimer > this.shootCooldown &&
      this.y > 0 &&
      this.y < this.gameHeight
    ) {
      enemyProjectiles.push(
        new EnemyProjectile(this.x + this.width / 2, this.y + this.height)
      );
      this.shootTimer = 0;
    }
  }

  draw(context) {
    context.fillStyle = "#d32f2f";
    context.beginPath();
    context.moveTo(this.x + this.width / 2, this.y + this.height);
    context.lineTo(this.x, this.y + 10);
    context.lineTo(this.x + this.width / 2, this.y + 20);
    context.lineTo(this.x + this.width, this.y + 10);
    context.closePath();
    context.fill();

    const cockpitGradient = context.createRadialGradient(
      this.x + this.width / 2,
      this.y + 18,
      1,
      this.x + this.width / 2,
      this.y + 18,
      8
    );
    cockpitGradient.addColorStop(0, "#ffeb3b");
    cockpitGradient.addColorStop(1, "#ffc107");
    context.fillStyle = cockpitGradient;
    context.beginPath();
    context.arc(this.x + this.width / 2, this.y + 18, 6, 0, Math.PI * 2);
    context.fill();
  }
}
