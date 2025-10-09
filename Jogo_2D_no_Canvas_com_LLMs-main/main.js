// Seleciona o canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Música de fundo
const bgMusic = document.getElementById("bgMusic");

// Estado do jogo
let gameState = "menu"; // "menu", "playing", "gameover"

// Carregar imagem da nave
const shipImg = new Image();
shipImg.src = "assets/Nave.png"; // caminho da nave

// Objeto da nave
let ship = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 100,
    width: 80,
    height: 80,
    speed: 5,
    movingLeft: false,
    movingRight: false,
    movingUp: false,
    movingDown: false
};

// 🔊 Ativa o som após o primeiro clique ou tecla
function enableSound() {
    if (bgMusic.muted) {
        bgMusic.muted = false;
        bgMusic.play().then(() => {
            console.log("🎵 Música ativada!");
        }).catch((err) => {
            console.error("Erro ao reproduzir a música:", err);
        });
    }
}
document.addEventListener("click", enableSound);
document.addEventListener("keydown", enableSound);

// Controles de teclado
document.addEventListener("keydown", (e) => {
    if (gameState === "menu" && e.code === "Enter") {
        startGame();
    }

    if (gameState === "playing") {
        if (e.code === "ArrowLeft" || e.code === "KeyA") ship.movingLeft = true;
        if (e.code === "ArrowRight" || e.code === "KeyD") ship.movingRight = true;
        if (e.code === "ArrowUp" || e.code === "KeyW") ship.movingUp = true;
        if (e.code === "ArrowDown" || e.code === "KeyS") ship.movingDown = true;
    }
});

document.addEventListener("keyup", (e) => {
    if (gameState === "playing") {
        if (e.code === "ArrowLeft" || e.code === "KeyA") ship.movingLeft = false;
        if (e.code === "ArrowRight" || e.code === "KeyD") ship.movingRight = false;
        if (e.code === "ArrowUp" || e.code === "KeyW") ship.movingUp = false;
        if (e.code === "ArrowDown" || e.code === "KeyS") ship.movingDown = false;
    }
});

// Iniciar o jogo
function startGame() {
    gameState = "playing";
}

// Atualizar lógica do jogo
function update() {
    if (gameState === "playing") {
        if (ship.movingLeft && ship.x > 0) ship.x -= ship.speed;
        if (ship.movingRight && ship.x + ship.width < canvas.width) ship.x += ship.speed;
        if (ship.movingUp && ship.y > 0) ship.y -= ship.speed;
        if (ship.movingDown && ship.y + ship.height < canvas.height) ship.y += ship.speed;
    }
}

// Desenhar
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "menu") {
        ctx.fillStyle = "#0f1c3f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Galaxy Defender", canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = "20px Arial";
        ctx.fillText("Pressione Enter para Iniciar", canvas.width / 2, canvas.height / 2);
    }

    if (gameState === "playing") {
        ctx.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    }
}

// Loop principal
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o loop
shipImg.onload = () => {
    gameLoop();
};
