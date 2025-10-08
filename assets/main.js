const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const UFO_WIDTH = 130;
const UFO_HEIGHT = 130;
const UFO_SPEED = 5;

const COW_WIDTH = 160;
const COW_HEIGHT = 80;
const BEAM_WIDTH = 80;
const BEAM_SPEED = 3;

const images = {
    ufo: new Image(),
    cow: new Image(),
    background: new Image(),
    beam: new Image()
};
images.ufo.src = './img/ufo.png';
images.cow.src = './img/cow.png';
images.background.src = './img/fundo.jpg';
images.beam.src = './img/feixe.png';

let ufoX = canvas.width / 2 - UFO_WIDTH / 2;
let ufoY = 50;

let keys = {};

let cows = [];
function spawnCow() {
    cows.push({
        x: Math.random() * (canvas.width - COW_WIDTH),
        y: canvas.height - COW_HEIGHT - 10,
        abducted: false
    });
    if (cows.length < 10) setTimeout(spawnCow, 2000 + Math.random() * 3000); // Geração aleatória a cada 2-5 segundos
}
spawnCow(); // Inicia a geração

let beamActive = false;
let beamY = ufoY + UFO_HEIGHT;
let abductedCow = null;

let score = 0;
let backgroundX = 0;
let backgroundSpeed = 0.5;

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function update() {
    // Movimentação do OVNI
    if (keys['ArrowLeft'] && ufoX > 0) ufoX -= UFO_SPEED;
    if (keys['ArrowRight'] && ufoX + UFO_WIDTH < canvas.width) ufoX += UFO_SPEED;
    if (keys['ArrowUp'] && ufoY > 0) ufoY -= UFO_SPEED;
    if (keys['ArrowDown'] && ufoY + UFO_HEIGHT < canvas.height - 100) ufoY += UFO_SPEED;

    // Efeito parallax
    backgroundX -= backgroundSpeed;
    if (backgroundX <= -canvas.width) backgroundX = 0;

    // Ativar feixe com espaço
    if (keys[' '] && !beamActive) {
        beamActive = true;
        beamY = ufoY + UFO_HEIGHT;
        abductedCow = null;

        for (let cow of cows) {
            if (!cow.abducted) {
                const beamCenterX = ufoX + UFO_WIDTH / 2;
                const cowCenterX = cow.x + COW_WIDTH / 2;
                const beamRange = (BEAM_WIDTH / 2) + (COW_WIDTH / 2); // Considera o tamanho da vaca e do feixe para melhor detecção
                if (Math.abs(beamCenterX - cowCenterX) < beamRange && cow.y > beamY) { // Removida limitação vertical superior para distância maior
                    abductedCow = cow;
                    break;
                }
            }
        }
    }

    // Atualizar feixe e abdução
    if (beamActive) {
        beamY += BEAM_SPEED;
        if (abductedCow) {
            abductedCow.y -= BEAM_SPEED;
            if (abductedCow.y <= ufoY + 130) {
                abductedCow.abducted = true;
                beamActive = false;
                score++;
                abductedCow.x = Math.random() * (canvas.width - COW_WIDTH);
                abductedCow.y = canvas.height - COW_HEIGHT - 10;
                abductedCow.abducted = false;
            }
        }
        if (beamY > canvas.height) beamActive = false;
    }
}

function draw() {
    // Desenhar fundo com parallax
    ctx.drawImage(images.background, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(images.background, backgroundX + canvas.width, 0, canvas.width, canvas.height);

    // Desenhar vacas
    for (let cow of cows) {
        if (!cow.abducted) {
            ctx.drawImage(images.cow, cow.x, cow.y, COW_WIDTH, COW_HEIGHT);
        }
    }

    // Desenhar OVNI
    ctx.drawImage(images.ufo, ufoX, ufoY, UFO_WIDTH, UFO_HEIGHT);

    // Desenhar feixe com imagem
    if (beamActive) {
        ctx.drawImage(images.beam, ufoX + UFO_WIDTH / 2 - BEAM_WIDTH / 2, ufoY + UFO_HEIGHT, BEAM_WIDTH, beamY - (ufoY + UFO_HEIGHT));
    }

    // Desenhar pontuação
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Pontos: ${score}`, 10, 30);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Garantir que todas as imagens estejam carregadas
let loadedImages = 0;
const totalImages = Object.keys(images).length;
for (let img in images) {
    images[img].onload = () => {
        loadedImages++;
        if (loadedImages === totalImages) gameLoop();
    };
    images[img].onerror = () => {
        console.error(`Erro ao carregar ${images[img].src}`);
    };
}