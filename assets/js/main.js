import { InputHandler } from "./input.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Background } from "./background.js";
import { Particle } from "./particle.js";

window.onload = function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const GameState = {
    MENU: "MENU",
    PLAYING: "PLAYING",
    GAME_OVER: "GAME_OVER",
  };
  let currentGameState = GameState.MENU;

  let player;
  let projectiles = [];
  let enemyProjectiles = [];
  let enemies = [];
  let particles = [];
  let background;
  let score = 0;
  let enemySpawnTimer = 0;
  let gameTime = 0;
  const ENEMY_SPAWN_RATE = 0.7;

  const input = new InputHandler();

  function checkCollisions() {
    // Colisão Projétil do Player vs Inimigo
    projectiles.forEach((projectile) => {
      enemies.forEach((enemy) => {
        if (
          projectile.x < enemy.x + enemy.width &&
          projectile.x + projectile.width > enemy.x &&
          projectile.y < enemy.y + enemy.height &&
          projectile.y + projectile.height > enemy.y
        ) {
          projectile.markedForDeletion = true;
          if (!enemy.markedForDeletion) {
            enemy.markedForDeletion = true;
            score += 10;
            for (let i = 0; i < 15; i++) {
              const speedX = (Math.random() - 0.5) * 5;
              const speedY = (Math.random() - 0.5) * 5;
              particles.push(
                new Particle(
                  enemy.x + enemy.width / 2,
                  enemy.y + enemy.height / 2,
                  4,
                  "#ffc107",
                  speedX,
                  speedY,
                  50
                )
              );
            }
          }
        }
      });
    });

    if (!player) return;

    // Colisão Player vs Inimigo
    enemies.forEach((enemy) => {
      if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      ) {
        endGame();
      }
    });

    // Colisão Projétil Inimigo vs Player
    enemyProjectiles.forEach((projectile) => {
      if (
        player.x < projectile.x + projectile.width &&
        player.x + player.width > projectile.x &&
        player.y < projectile.y + projectile.height &&
        player.y + player.height > projectile.y
      ) {
        projectile.markedForDeletion = true;
        endGame();
      }
    });
  }

  function endGame() {
    currentGameState = GameState.GAME_OVER;
    for (let i = 0; i < 40; i++) {
      const speedX = (Math.random() - 0.5) * 8;
      const speedY = (Math.random() - 0.5) * 8;
      particles.push(
        new Particle(
          player.x + player.width / 2,
          player.y + player.height / 2,
          5,
          "#ff4d4d",
          speedX,
          speedY,
          80
        )
      );
    }
    player = null; // Remove o jogador
  }

  function init() {
    player = new Player(canvas.width, canvas.height);
    background = new Background(canvas.width, canvas.height);
    projectiles = [];
    enemyProjectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    enemySpawnTimer = 0;
    gameTime = 0;
  }

  function update(deltaTime) {
    if (background) background.update(deltaTime);
    particles.forEach((p) => p.update());
    particles = particles.filter((p) => p.life > 0);

    if (currentGameState !== GameState.PLAYING) return;

    gameTime += deltaTime;
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer > 1 / ENEMY_SPAWN_RATE) {
      enemies.push(new Enemy(canvas.width, canvas.height, gameTime));
      enemySpawnTimer = 0;
    }

    if (player) player.update(input, deltaTime, projectiles, particles);

    projectiles.forEach((p) => p.update(deltaTime));
    projectiles = projectiles.filter((p) => !p.markedForDeletion);

    enemyProjectiles.forEach((p) => p.update(deltaTime, canvas.height));
    enemyProjectiles = enemyProjectiles.filter((p) => !p.markedForDeletion);

    enemies.forEach((e) => e.update(deltaTime, enemyProjectiles));
    enemies = enemies.filter((e) => !e.markedForDeletion);

    checkCollisions();
  }

  function draw() {
    if (!background) return;
    ctx.fillStyle = `hsl(${background.hue}, 100%, 5%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    background.draw(ctx);
    particles.forEach((p) => p.draw(ctx));

    switch (currentGameState) {
      case GameState.MENU:
        ctx.fillStyle = "white";
        ctx.font = '30px "Press Start 2P", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(
          "SOBREVIVÊNCIA CÓSMICA",
          canvas.width / 2,
          canvas.height / 2 - 40
        );
        ctx.font = '20px "Press Start 2P", sans-serif';
        ctx.fillText(
          "Pressione ENTER para iniciar",
          canvas.width / 2,
          canvas.height / 2 + 20
        );
        break;

      case GameState.PLAYING:
        if (player) player.draw(ctx);
        projectiles.forEach((p) => p.draw(ctx));
        enemyProjectiles.forEach((p) => p.draw(ctx));
        enemies.forEach((e) => e.draw(ctx));

        ctx.fillStyle = "white";
        ctx.font = '20px "Press Start 2P", sans-serif';
        ctx.textAlign = "left";
        ctx.fillText("PONTOS: " + score, 20, 40);
        break;

      case GameState.GAME_OVER:
        ctx.fillStyle = "white";
        ctx.font = '40px "Press Start 2P", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText("FIM DE JOGO", canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '20px "Press Start 2P", sans-serif';
        ctx.fillText(
          `Pontuação Final: ${score}`,
          canvas.width / 2,
          canvas.height / 2
        );
        ctx.fillText(
          "Pressione ENTER para tentar novamente",
          canvas.width / 2,
          canvas.height / 2 + 40
        );
        break;
    }
  }

  window.addEventListener("keydown", (e) => {
    if (
      e.key === "Enter" &&
      (currentGameState === GameState.MENU ||
        currentGameState === GameState.GAME_OVER)
    ) {
      init();
      currentGameState = GameState.PLAYING;
    }
  });

  let lastTime = 0;
  function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(deltaTime || 0);
    draw();
    requestAnimationFrame(gameLoop);
  }

  init();
  requestAnimationFrame(gameLoop);
};
