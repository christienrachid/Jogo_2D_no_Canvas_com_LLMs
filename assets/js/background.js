class Layer {
  constructor(
    gameWidth,
    gameHeight,
    speedModifier,
    starCount,
    minRadius,
    maxRadius,
    lightness
  ) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.speedModifier = speedModifier;
    this.baseSpeed = 40;
    this.speed = this.baseSpeed * this.speedModifier;
    this.stars = [];
    this.lightness = lightness;

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.gameWidth,
        y: Math.random() * this.gameHeight,
        radius: Math.random() * (maxRadius - minRadius) + minRadius,
      });
    }
  }

  update(deltaTime) {
    this.stars.forEach((star) => {
      star.y += this.speed * deltaTime;
      if (star.y > this.gameHeight + star.radius) {
        star.y = -star.radius;
        star.x = Math.random() * this.gameWidth;
      }
    });
  }

  draw(context, hue) {
    context.fillStyle = `hsl(${hue}, 100%, ${this.lightness}%)`;
    this.stars.forEach((star) => {
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
    });
  }
}

export class Background {
  constructor(gameWidth, gameHeight) {
    this.hue = 240;
    const layer1 = new Layer(gameWidth, gameHeight, 0.2, 50, 0.5, 1.5, 90);
    const layer2 = new Layer(gameWidth, gameHeight, 0.4, 40, 1, 2.5, 70);
    const layer3 = new Layer(gameWidth, gameHeight, 0.7, 25, 1.5, 3, 60);
    this.layers = [layer1, layer2, layer3];
  }

  update(deltaTime) {
    this.hue = (this.hue + deltaTime * 5) % 360;
    this.layers.forEach((layer) => layer.update(deltaTime));
  }

  draw(context) {
    this.layers.forEach((layer) => layer.draw(context, this.hue));
  }
}
