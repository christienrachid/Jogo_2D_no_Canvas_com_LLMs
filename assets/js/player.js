import { Projectile } from "./projectile.js";
import { Particle } from "./particle.js";

export class Player {
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.width = 50;
    this.height = 50;
    this.x = gameWidth / 2 - this.width / 2;
    this.y = gameHeight - this.height - 20;
    this.speed = 400;
    this.shootCooldown = 0.3;
    this.shootTimer = 0;
    this.thrusterSize = 0;
  }

  // Passamos os arrays como argumentos para que a classe não dependa de variáveis globais
  update(input, deltaTime, projectiles, particles) {
    let moving = false;
    if (input.keys.includes("ArrowRight")) {
      this.x += this.speed * deltaTime;
      moving = true;
    }
    if (input.keys.includes("ArrowLeft")) {
      this.x -= this.speed * deltaTime;
      moving = true;
    }
    if (input.keys.includes("ArrowUp")) {
      this.y -= this.speed * deltaTime;
      moving = true;
    }
    if (input.keys.includes("ArrowDown")) {
      this.y += this.speed * deltaTime;
      moving = true;
    }

    this.thrusterSize = moving ? 15 + Math.random() * 5 : 0;
    if (moving) {
      particles.push(
        new Particle(
          this.x + this.width / 2,
          this.y + this.height,
          4,
          "#ffae42",
          (Math.random() - 0.5) * 2,
          5,
          20
        )
      );
    }

    if (this.x < 0) this.x = 0;
    if (this.x > this.gameWidth - this.width)
      this.x = this.gameWidth - this.width;
    if (this.y < 0) this.y = 0;
    if (this.y > this.gameHeight - this.height)
      this.y = this.gameHeight - this.height;

    this.shootTimer += deltaTime;
    if (input.keys.includes(" ") && this.shootTimer > this.shootCooldown) {
      projectiles.push(new Projectile(this.x + this.width / 2, this.y));
      this.shootTimer = 0;
    }
  }

  draw(context) {
    if (this.thrusterSize > 0) {
      context.fillStyle = `rgba(255, ${100 + Math.random() * 50}, 0, 0.8)`;
      context.beginPath();
      context.moveTo(this.x + this.width * 0.4, this.y + this.height - 10);
      context.lineTo(this.x + this.width * 0.6, this.y + this.height - 10);
      context.lineTo(
        this.x + this.width / 2,
        this.y + this.height - 10 + this.thrusterSize
      );
      context.closePath();
      context.fill();
    }

    context.fillStyle = "#c0c0c0";
    context.beginPath();
    context.moveTo(this.x + this.width / 2, this.y);
    context.lineTo(this.x, this.y + this.height - 10);
    context.lineTo(this.x + this.width / 2, this.y + this.height - 20);
    context.lineTo(this.x + this.width, this.y + this.height - 10);
    context.closePath();
    context.fill();

    const cockpitGradient = context.createRadialGradient(
      this.x + this.width / 2,
      this.y + 20,
      2,
      this.x + this.width / 2,
      this.y + 20,
      10
    );
    cockpitGradient.addColorStop(0, "#80deea");
    cockpitGradient.addColorStop(1, "#00bcd4");
    context.fillStyle = cockpitGradient;
    context.beginPath();
    context.arc(this.x + this.width / 2, this.y + 22, 8, 0, Math.PI * 2);
    context.fill();
  }
}
