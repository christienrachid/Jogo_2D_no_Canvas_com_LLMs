// Seleciona o canvas e o contexto de renderização
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Define variáveis globais
const keys = {};
const GRAVITY = 0.5;
const GROUND_LEVEL = canvas.height - 48;

// Letras a serem coletadas (ordem alfabética, pode ser aleatória depois)
const lettersToCollect = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let currentLetterIndex = 0;
let score = 0;

// Letras no cenário
const letters = [
    { x: 400, y: GROUND_LEVEL - 32, width: 24, height: 24, char: "A", collected: false, floatY: 0 },
    { x: 500, y: GROUND_LEVEL - 32, width: 24, height: 24, char: "B", collected: false, floatY: 0 },
    { x: 700, y: GROUND_LEVEL - 32, width: 24, height: 24, char: "C", collected: false, floatY: 0 },
    // Adicione mais letras conforme desejar
];

// Eventos de teclado (WASD e setas)
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// ========================
// Paralaxe (camadas de fundo)
// ========================
const backgroundLayers = [
    { speed: 0.1, x: 0, offsetY: 0, image: createParallaxLayer("#0f0f1a") }, // Céu
    { speed: 0.3, x: 0, offsetY: 50, image: createParallaxLayer("#1a1f3c") }, // Montanhas
    { speed: 0.6, x: 0, offsetY: 100, image: createParallaxLayer("#2e3552") }  // Árvores
];

// Função para criar uma camada simples de paralaxe como retângulo
function createParallaxLayer(color) {
    const offCanvas = document.createElement("canvas");
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const ctx2 = offCanvas.getContext("2d");
    ctx2.fillStyle = color;
    ctx2.fillRect(0, 0, canvas.width, canvas.height);
    return offCanvas;
}

// ========================
// Entidades
// ========================

const spriteSheet = new Image();
spriteSheet.src = "spritesheet.png";

// Jogador
const player = {
    x: 100,
    y: GROUND_LEVEL - 32,
    width: 32,
    height: 32,
    dx: 0,
    dy: 0,
    speed: 3,
    jumping: false,
    direction: 1, // 1 = direita, -1 = esquerda
    state: "idle", // idle, run, shoot
    frameIndex: 0,
    frameTimer: 0,
    frameInterval: 100, // tempo entre quadros em ms (10fps)
    maxFrames: {
        idle: 4,
        run: 8,
        shoot: 8
    },
    animations: {
        idle: 0,
        run: 2,
        shoot: 5
    }
};

// Inimigos (placeholder)
const enemies = [
    { x: 600, y: GROUND_LEVEL - 32, width: 32, height: 32, color: "red" },
    { x: 700, y: GROUND_LEVEL - 32, width: 32, height: 32, color: "red" }
];

// Projetis (balas disparadas)
const bullets = [];

// ========================
// Game Loop
// ========================

let lastTime = 0;

function gameLoop(timestamp = 0) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// ========================
// Update - lógica do jogo
// ========================


function isOnScreen(entity) {
    return (
        entity.x + entity.width > 0 &&
        entity.x < canvas.width &&
        entity.y + entity.height > 0 &&
        entity.y < canvas.height
    );
}

function createBullet(x, y, dx) {
    return {
        x, y, dx,
        width: 8,
        height: 8,
        color: "#ffff00"
    };
}

function handleInput() {
    let isMoving = false;

    if (keys["ArrowLeft"] || keys["a"]) {
        player.dx = -player.speed;
        player.direction = -1;
        isMoving = true;
    } else if (keys["ArrowRight"] || keys["d"]) {
        player.dx = player.speed;
        player.direction = 1;
        isMoving = true;
    } else {
        player.dx = 0;
    }

    let isShooting = keys[" "];

    if (isShooting) {
        player.state = "shoot";
    } else if (isMoving) {
        player.state = "run";
    } else {
        player.state = "idle";
    }

    // Pulo
    if ((keys["ArrowUp"] || keys["w"]) && !player.jumping) {
        player.dy = -10;
        player.jumping = true;
    }
}

function applyPhysics() {
    // Atualiza posição do jogador
    player.dy += GRAVITY;
    player.x += player.dx;
    player.y += player.dy;

    // Limita o jogador ao chão
    if (player.y + player.height >= GROUND_LEVEL) {
        player.y = GROUND_LEVEL - player.height;
        player.dy = 0;
        player.jumping = false;
    }
}

function handleShooting(deltaTime) {
    const isShooting = keys[" "];

    if (isShooting && player.shootCooldown <= 0) {
        bullets.push(createBullet(
            player.x + (player.direction === 1 ? player.width : -8),
            player.y + player.height / 2 - 4,
            6 * player.direction
        ));
        player.shootCooldown = 300;
    }

    player.shootCooldown = Math.max(0, (player.shootCooldown || 0) - deltaTime);
}

function handleCollisions() {
    // Balas vs inimigos
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            if (checkCollision(bullets[bi], enemies[ei])) {
                bullets.splice(bi, 1);
                enemies[ei].flashTimer = 100; // flash por 100ms;
                score += 20;
                break;
            }
        }
    }

    // Coleta de letras
    letters.forEach(letter => {
        if (!letter.collected && checkCollision(player, letter)) {
            if (currentLetterIndex < lettersToCollect.length &&
                letter.char === lettersToCollect[currentLetterIndex] && currentLetterIndex < lettersToCollect.length) {
                letter.collected = true;
                currentLetterIndex++;
                score += 10;
            } else {
                score -= 5;
            }
        }
    });
}

function updateEntities() {
    // Atualiza balas
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].dx;

        // Remove fora da tela
        if (bullets[i].x < 0 || bullets[i].x > canvas.width) {
            bullets.splice(i, 1);
        }
    }

    // Remove balas fora da tela
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].x > canvas.width) bullets.splice(i, 1);
    }

    letters.forEach(letter => {
        if (letter.collected) {
            letter.floatY -= 1; // sobe suavemente
        }
    });
}

function updateParallax() {
    // Atualiza paralaxe (com base no movimento do jogador)
    backgroundLayers.forEach(layer => {
        layer.x -= player.dx * layer.speed * 0.5;
        if (layer.x < -canvas.width) layer.x += canvas.width;
    });
}

function updateAnimations(deltaTime) {
    player.frameTimer += deltaTime;
    if (player.frameTimer >= player.frameInterval) {
        player.frameTimer = 0;
        player.frameIndex = (player.frameIndex + 1) % player.maxFrames[player.state];
    }
}

function update(deltaTime) {
    handleInput();
    applyPhysics(deltaTime);
    handleShooting(deltaTime);
    updateEntities(deltaTime);
    updateAnimations(deltaTime);
    handleCollisions();
    updateParallax();
}

// ========================
// Draw - renderiza o jogo
// ========================

function draw() {
    // Limpa tela
    ctx.fillStyle = "rgba(15,15,25,0.2)"; // fundo escuro e translúcido
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha fundo com paralaxe
    backgroundLayers.forEach(layer => {
        ctx.drawImage(layer.image, layer.x, layer.offsetY);
        ctx.drawImage(layer.image, layer.x + canvas.width, layer.offsetY);
    });

    // Desenha chão
    ctx.fillStyle = "#444";
    ctx.fillRect(0, GROUND_LEVEL, canvas.width, canvas.height - GROUND_LEVEL);

    // Desenha jogador
    const row = player.animations[player.state];
    const col = player.frameIndex;

    ctx.save();

    // Espelhar horizontalmente se direção for -1
    if (player.direction === -1) {
        ctx.translate(player.x + player.width / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-player.x - player.width / 2, 0);
    }

    ctx.drawImage(
        spriteSheet,
        col * 32,              // sx
        row * 32,              // sy
        32, 32,                // sw, sh
        player.x, player.y,    // dx, dy
        player.width, player.height // dw, dh
    );

    ctx.restore();


    // Desenha inimigos
    enemies.forEach(e => {
        if (isOnScreen(e)) {
            if (e.flashTimer > 0) {
                ctx.fillStyle = "#ffffff"; // flash branco
                e.flashTimer -= 16;
            } else {
                ctx.fillStyle = e.color;
            }
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }
    });

    // Desenha balas
    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Desenha letras
    letters.forEach(letter => {
        if (!letter.collected) {
            ctx.fillStyle = "#00ff99";
            ctx.fillRect(letter.x, letter.y, letter.width, letter.height);
            ctx.fillStyle = "#000";
            ctx.font = "16px Arial";
            ctx.fillText(letter.char, letter.x + 6, letter.y + 18);
        }

        if (!letter.collected || letter.floatY > -20) {
            ctx.fillStyle = "#00ff99";
            ctx.fillRect(letter.x, letter.y + letter.floatY, letter.width, letter.height);
            ctx.fillStyle = "#000";
            ctx.font = "16px Arial";
            ctx.fillText(letter.char, letter.x + 6, letter.y + 18 + letter.floatY);
        }
    });


    // HUD - Pontuação e próxima letra
    ctx.font = "22px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 2;
    ctx.lineWidth = 2;
    ctx.fillText("Pontuação: " + score, 20, 30);
    ctx.fillText("Próxima letra: " + lettersToCollect[currentLetterIndex] || "✔", 20, 60);
}

// ========================
// Colisão AABB (retângulos)
// ========================
function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Inicia o loop
gameLoop();
