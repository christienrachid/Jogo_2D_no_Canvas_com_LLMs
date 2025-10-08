export class Projectile {
  constructor(x, y) {
    this.width = 5;
    this.height = 20;
    this.x = x - this.width / 2;
    this.y = y;
    this.speed = 800;
    this.markedForDeletion = false;
  }

  update(deltaTime) {
    this.y -= this.speed * deltaTime;
    if (this.y < -this.height) this.markedForDeletion = true;
  }

  draw(context) {
    context.save();
    const gradient = context.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    gradient.addColorStop(0, "white");
    gradient.addColorStop(0.5, "#80deea");
    gradient.addColorStop(1, "#00bcd4");
    context.fillStyle = gradient;
    context.shadowColor = "#00bcd4";
    context.shadowBlur = 10;
    context.fillRect(this.x, this.y, this.width, this.height);
    context.restore();
  }
}

export class EnemyProjectile {
  constructor(x, y) {
    this.width = 5;
    this.height = 15;
    this.x = x - this.width / 2;
    this.y = y;
    this.speed = 400;
    this.markedForDeletion = false;
  }

  update(deltaTime, gameHeight) {
    this.y += this.speed * deltaTime;
    if (this.y > gameHeight) this.markedForDeletion = true;
  }

  draw(context) {
    context.save();
    const gradient = context.createLinearGradient(
      this.x,
      this.y,
      this.x,
      this.y + this.height
    );
    gradient.addColorStop(0, "white");
    gradient.addColorStop(0.5, "#ff8080");
    gradient.addColorStop(1, "red");
    context.fillStyle = gradient;
    context.shadowColor = "red";
    context.shadowBlur = 10;
    context.fillRect(this.x, this.y, this.width, this.height);
    context.restore();
  }
}
