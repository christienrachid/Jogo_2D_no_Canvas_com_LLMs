// Aguarda o carregamento do DOM para iniciar
window.addEventListener('load', function() {
    // --- CONFIGURAÇÃO INICIAL ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Define as dimensões do canvas
    canvas.width = 800;
    canvas.height = 600;

    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');

    const scoreCounter = document.getElementById('score');
    const speedCounter = document.getElementById('speed');

    let gameRunning = false;
    let animationId; // Para controlar o loop de animação
    let startTime;
    let asteroidSpawnRate = 100; // Começa com 100 frames

    // --- CARREGAMENTO DE ASSETS (IMAGENS) ---
    // É uma boa prática pré-carregar as imagens
    const playerImage = new Image();
    playerImage.src = 'assets/player.png'; // Substitua pelo caminho da sua imagem

    const asteroidImage = new Image();
    asteroidImage.src = 'assets/asteroid.png'; // Substitua

    const bgImage = new Image();
    bgImage.src = 'assets/background.png'; // Substitua

    // --- VARIÁVEIS DO JOGO ---
    let player;
    let keys = {}; // Objeto para rastrear teclas pressionadas
    let projectiles = [];
    let asteroids = [];
    let asteroidSpawnTimer = 0;

    // Efeito Parallax
    let bgY1 = 0;
    let bgY2 = -canvas.height;
    const bgSpeed = 1;

    // --- CLASSES E OBJETOS DO JOGO ---

    // Classe para a Nave do Jogador
    class Player {
        constructor() {
            this.width = 50;
            this.height = 60;
            this.x = canvas.width / 2 - this.width / 2;
            this.y = canvas.height - this.height - 20;
            this.speed = 5;
        }

        update() {
            // Movimento baseado nas teclas pressionadas
            if (keys['ArrowLeft'] && this.x > 0) {
                this.x -= this.speed;
            }
            if (keys['ArrowRight'] && this.x < canvas.width - this.width) {
                this.x += this.speed;
            }
        }

        draw() {
            // Se a imagem estiver carregada, desenha. Senão, desenha um retângulo.
            if (playerImage.complete) {
                ctx.drawImage(playerImage, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = 'blue';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        }
    }

    // Classe para os Projéteis
    class Projectile {
        constructor(x, y) {
            this.width = 5;
            this.height = 15;
            this.x = x - this.width / 2;
            this.y = y;
            this.speed = 10;
        }

        update() {
            this.y -= this.speed;
        }

        draw() {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    // Classe para os Asteroides
    class Asteroid {
        constructor(speedModifier = 1) { // Adiciona o parâmetro
            this.dimentions = [30, 50, 70, 90, 100];
            this.width = this.dimentions[Math.floor(Math.random() * this.dimentions.length)];
            this.height = this.width;
            this.x = Math.random() * (canvas.width - this.width);
            this.y = -this.height;
            
            const baseSpeed = 120 / this.width; 
            
            this.speed = (baseSpeed + Math.random() * 0.5) * speedModifier;
        }

        update() {
            this.y += this.speed;
        }

        draw() {
            if (asteroidImage.complete) {
                ctx.drawImage(asteroidImage, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = 'gray';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        }
    }


    // --- FUNÇÕES DE CONTROLE DO JOGO ---

    function init() {
        player = new Player();
        projectiles = [];
        asteroids = [];
        keys = {};
        gameRunning = true;
        gameOverScreen.classList.add('hidden');
        startScreen.classList.add('hidden'); 

        startButton.blur();
        restartButton.blur();

        startTime = Date.now(); // Salva o tempo de início

        gameLoop();
    }

    function spawnAsteroids() {
        // Calcula o tempo decorrido em segundos
        const elapsedTime = (Date.now() - startTime) / 1000;

        // Aumenta a velocidade a cada 10 segundos
        const speedModifier = 3 + Math.floor(elapsedTime / 10) * 0.2;
        speedCounter.textContent = `${(speedModifier / 3).toFixed(1)}x`;

        // Aumenta a frequência de spawn a cada 15 segundos (diminui o intervalo)
        asteroidSpawnRate = Math.max(100, 100 - Math.floor(elapsedTime / 15) * 5);
        
        asteroidSpawnTimer++;
        if (asteroidSpawnTimer % Math.floor(asteroidSpawnRate) === 0) {
            asteroids.push(new Asteroid(speedModifier)); // Passa o modificador
        }
}
    
    function detectCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    // --- DENTRO DO SEU CÓDIGO ---

    function handleCollisions() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            for (let j = asteroids.length - 1; j >= 0; j--) {
                if (detectCollision(projectiles[i], asteroids[j])) {
                    projectiles.splice(i, 1);
                    asteroids.splice(j, 1);
                    scoreCounter.textContent = parseInt(scoreCounter.textContent) + 1;
                    break; // Sai do loop para evitar erros de índice
                }
            }
        }

        // Colisão: Jogador vs Asteroide
        for (let i = asteroids.length - 1; i >= 0; i--) {
            if (detectCollision(player, asteroids[i])) {
                gameOver();
            }
        }
    }

    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(animationId); // Para o loop de animação
        scoreCounter.textContent = '0';
        gameOverScreen.classList.remove('hidden');
    }

    // --- FUNÇÕES DE DESENHO E ATUALIZAÇÃO ---

    function drawParallaxBackground() {
        // Desenha as duas imagens de fundo
        ctx.drawImage(bgImage, 0, bgY1, canvas.width, canvas.height);
        ctx.drawImage(bgImage, 0, bgY2, canvas.width, canvas.height);

        // Move as imagens
        bgY1 += bgSpeed;
        bgY2 += bgSpeed;

        // Reposiciona as imagens para criar o loop infinito
        if (bgY1 >= canvas.height) {
            bgY1 = -canvas.height + bgSpeed;
        }
        if (bgY2 >= canvas.height) {
            bgY2 = -canvas.height + bgSpeed;
        }
    }

    // O LOOP PRINCIPAL DO JOGO (requestAnimationFrame)
    function gameLoop() {
        if (!gameRunning) return;

        // 1. Limpa a tela
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 2. Desenha o fundo com paralaxe
        drawParallaxBackground();

        // 3. Atualiza e desenha os elementos
        player.update();
        player.draw();

        projectiles.forEach((p, index) => {
            p.update();
            p.draw();
            // Remove projéteis que saem da tela
            if (p.y + p.height < 0) {
                projectiles.splice(index, 1);
            }
        });

        asteroids.forEach((a, index) => {
            a.update();
            a.draw();
            // Remove asteroides que saem da tela
            if (a.y > canvas.height) {
                asteroids.splice(index, 1);
            }
        });

        // 4. Cria novos asteroides
        spawnAsteroids();

        // 5. Verifica colisões
        handleCollisions();

        // 6. Solicita o próximo frame
        animationId = requestAnimationFrame(gameLoop);
    }


    // --- EVENT LISTENERS (ENTRADAS DO JOGADOR) ---

    // Ouve o pressionar das teclas
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;

        // Atirar com a tecla de espaço
        if (e.key === ' ' && gameRunning) {
            projectiles.push(new Projectile(player.x + player.width / 2, player.y));
        }
    });

    // Ouve quando as teclas são soltas
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Inicia o jogo
    startButton.addEventListener('click', init);
    restartButton.addEventListener('click', init);
});