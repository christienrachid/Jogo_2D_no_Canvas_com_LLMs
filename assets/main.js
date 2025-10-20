// --- CONFIGURAÇÃO INICIAL DO CANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingMessage = document.getElementById('loadingMessage');

// Define a resolução do jogo
canvas.width = 800;
canvas.height = 600;

// --- CONTROLE DE TECLADO ---
const keys = {
    ArrowUp: { pressed: false },
    ArrowLeft: { pressed: false },
    ArrowRight: { pressed: false },
    Space: { pressed: false },
    Enter: { pressed: false }
};

window.addEventListener('keydown', (event) => {
    if (keys[event.key] !== undefined) keys[event.key].pressed = true;
    else if (event.code === 'Space') keys.Space.pressed = true;
});

window.addEventListener('keyup', (event) => {
    if (keys[event.key] !== undefined) keys[event.key].pressed = false;
    else if (event.code === 'Space') keys.Space.pressed = false;
});

// --- PRÉ-CARREGADOR DE RECURSOS (ASSETS) ---
let audioInitialized = false;

const ASSETS_TO_LOAD = {
    images: {
        playerRun: 'ninja-run_01.png',
        playerAttack: 'ninja-slash_08.png',
        shuriken: 'Shuriken_2_spritesheet.png', // Alterado
        enemyRun: 'run-Sheet.png',
        enemyHit: 'hurt-Sheet.png',
        enemyDeath: 'death-Sheet.png',
        enemyJump: 'quick jump&fall anim-Sheet.png',
        background: 'waterfall.png' // Alterado
    },
    sounds: {
        footsteps: 'Footsteps_Grass_Run_01.wav',
        backgroundMusic: 'Ambiance_Waterfall_Calm_Loop_Stereo.wav', // Alterado
        hit: 'Hit 1 - Sound effects Pack 2.wav',
        death: 'Lose 1 - Sound effects Pack 2.wav'
    }
};

const assets = {
    images: {},
    sounds: {}
};

let assetsLoadedCount = 0;
const totalAssets = Object.keys(ASSETS_TO_LOAD.images).length + Object.keys(ASSETS_TO_LOAD.sounds).length;

function assetLoaded(assetName) {
    assetsLoadedCount++;
    console.log(`Recurso carregado: ${assetName} (${assetsLoadedCount}/${totalAssets})`);
    loadingMessage.innerText = `A carregar... (${assetsLoadedCount}/${totalAssets})`;

    if (assetsLoadedCount === totalAssets) {
        console.log("Todos os recursos foram carregados. A iniciar o jogo!");
        loadingMessage.style.display = 'none';
        canvas.style.display = 'block';
        init();
        gameLoop();
    }
}

function assetFailedToLoad(assetName) {
    console.error(`ERRO: Falha ao carregar o recurso "${assetName}". Verifica o nome e a localização do ficheiro.`);
    loadingMessage.innerText = `ERRO: Não foi possível carregar o ficheiro "${assetName}". Verifica o nome do ficheiro e se ele está na mesma pasta que o index.html.`;
    loadingMessage.style.color = 'red';
}

for (const key in ASSETS_TO_LOAD.images) {
    const src = ASSETS_TO_LOAD.images[key];
    assets.images[key] = new Image();
    assets.images[key].onload = () => assetLoaded(src);
    assets.images[key].onerror = () => assetFailedToLoad(src);
    assets.images[key].src = src;
}

for (const key in ASSETS_TO_LOAD.sounds) {
    const src = ASSETS_TO_LOAD.sounds[key];
    assets.sounds[key] = new Audio();
    assets.sounds[key].addEventListener('canplaythrough', () => assetLoaded(src), { once: true });
    assets.sounds[key].onerror = () => assetFailedToLoad(src);
    assets.sounds[key].src = src;
}

if (assets.sounds.footsteps) assets.sounds.footsteps.loop = true;
if (assets.sounds.backgroundMusic) {
    assets.sounds.backgroundMusic.loop = true;
    assets.sounds.backgroundMusic.volume = 0.5;
}

// --- ESTRUTURA DE ENTIDADES (CLASSES) ---

class Entity {
    constructor({ position, width, height }) {
        this.position = position;
        this.width = width;
        this.height = height;
    }
}

class Player extends Entity {
    constructor() {
        super({
            position: { x: 100, y: 450 },
            width: 64,
            height: 64
        });
        this.velocity = { x: 0, y: 0 };
        this.gravity = 0.5;
        this.jumpStrength = -15;
        this.isOnGround = false;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 15;
        this.direction = 1; // 1 para direita, -1 para esquerda
    }

    draw() {
        const imageToDraw = this.isAttacking ? assets.images.playerAttack : assets.images.playerRun;
        if (!imageToDraw.complete || imageToDraw.naturalWidth === 0) return;

        ctx.save();
        // Se o jogador estiver virado para a esquerda, inverte o canvas
        if (this.direction === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                imageToDraw,
                -this.position.x - this.width, // Posição invertida para corrigir o desenho
                this.position.y,
                this.width,
                this.height
            );
        } else {
            ctx.drawImage(
                imageToDraw,
                this.position.x,
                this.position.y,
                this.width,
                this.height
            );
        }
        ctx.restore();
    }

    update() {
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) this.isAttacking = false;
        }

        this.velocity.x = 0;
        if (keys.ArrowLeft.pressed) {
            this.velocity.x = -5;
            this.direction = -1; // Vira para a esquerda
        } else if (keys.ArrowRight.pressed) {
            this.velocity.x = 5;
            this.direction = 1; // Vira para a direita
        }
        this.position.x += this.velocity.x;

        this.position.y += this.velocity.y;
        if (this.position.y + this.height + this.velocity.y < canvas.height - 100) {
            this.velocity.y += this.gravity;
            this.isOnGround = false;
        } else {
            this.velocity.y = 0;
            this.position.y = canvas.height - this.height - 100;
            this.isOnGround = true;
        }

        if (keys.ArrowUp.pressed && this.isOnGround) {
            this.velocity.y = this.jumpStrength;
        }

        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;
    }
}

class Projectile extends Entity {
    constructor({ position, velocity }) {
        super({
            position,
            width: 35,
            height: 35
        });
        this.velocity = velocity;
        this.rotation = 0;
    }

    draw() {
        const image = assets.images.shuriken;
        if (!image.complete || image.naturalWidth === 0) return;

        const frameWidth = image.naturalWidth / 5;
        const frameHeight = image.naturalHeight / 6;

        ctx.save();
        ctx.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.drawImage(
            image, 0, 0,
            frameWidth, frameHeight,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore();
    }

    update() {
        this.rotation += 0.5;
        this.position.x += this.velocity.x;
    }
}

class Enemy extends Entity {
    constructor({ position }) {
        super({
            position,
            width: 50,
            height: 50
        });
        this.velocity = { x: -2, y: 0 };
        this.health = Math.floor(Math.random() * 3) + 1;

        this.runTotalFrames = 3;
        this.runFrameInterval = 12;
        this.hitTotalFrames = 5;
        this.hitFrameInterval = 8;
        this.deathTotalFrames = 4;
        this.deathFrameInterval = 15;
        this.jumpTotalFrames = 4;

        this.currentFrame = 0;
        this.frameTimer = 0;

        this.isHit = false;
        this.hitAnimationTimer = 0;
        this.hitAnimationDuration = this.hitTotalFrames * this.hitFrameInterval;

        this.isDying = false;
        this.isDead = false;

        this.isOnGround = true;
        this.gravity = 0.5;
        this.jumpStrength = -12;
    }

    takeDamage() {
        if (this.isDying) return;
        this.health--;
        this.isHit = true;
        this.hitAnimationTimer = this.hitAnimationDuration;
        this.currentFrame = 0;
        if (this.health <= 0) {
            this.isDying = true;
            this.currentFrame = 0;
            enemiesKilled++;
        }
    }

    draw() {
        let imageToDraw, totalFrames, frameWidth;

        if (this.isDying) {
            imageToDraw = assets.images.enemyDeath;
            totalFrames = this.deathTotalFrames;
        } else if (this.isHit) {
            imageToDraw = assets.images.enemyHit;
            totalFrames = this.hitTotalFrames;
        } else if (!this.isOnGround) {
            imageToDraw = assets.images.enemyJump;
            totalFrames = this.jumpTotalFrames;
            if (this.velocity.y < -6) this.currentFrame = 0;
            else if (this.velocity.y < 0) this.currentFrame = 1;
            else if (this.velocity.y < 6) this.currentFrame = 2;
            else this.currentFrame = 3;
        } else {
            imageToDraw = assets.images.enemyRun;
            totalFrames = this.runTotalFrames;
        }

        if (!imageToDraw.complete || imageToDraw.naturalWidth === 0) return;

        frameWidth = imageToDraw.naturalWidth / totalFrames;
        const frameX = this.currentFrame * frameWidth;

        ctx.save();
        ctx.translate(this.position.x + this.width, this.position.y);
        ctx.scale(-1, 1);
        ctx.drawImage(
            imageToDraw,
            frameX, 0,
            frameWidth, imageToDraw.naturalHeight,
            0, 0,
            this.width, this.height
        );
        ctx.restore();
    }

    update() {
        this.frameTimer++;

        if (!this.isDying) {
            this.position.y += this.velocity.y;
            if (this.position.y + this.height + this.velocity.y < canvas.height - 100) {
                this.velocity.y += this.gravity;
                this.isOnGround = false;
            } else {
                this.velocity.y = 0;
                this.position.y = canvas.height - this.height - 100;
                this.isOnGround = true;
            }
            if (this.isOnGround && Math.random() < 0.01) {
                this.velocity.y = this.jumpStrength;
            }
        }

        if (this.isDying) {
            if (this.frameTimer % this.deathFrameInterval === 0 && this.currentFrame < this.deathTotalFrames - 1) {
                this.currentFrame++;
            } else if (this.currentFrame >= this.deathTotalFrames - 1) {
                this.isDead = true;
            }
        } else if (this.isHit) {
            if (this.frameTimer % this.hitFrameInterval === 0 && this.currentFrame < this.hitTotalFrames - 1) {
                this.currentFrame++;
            }
            if (this.hitAnimationTimer-- <= 0) {
                this.isHit = false;
                this.currentFrame = 0;
            }
        } else if (this.isOnGround) {
            if (this.frameTimer % this.runFrameInterval === 0) {
                this.currentFrame = (this.currentFrame + 1) % this.runTotalFrames;
            }
        }

        if (!this.isDying) {
            this.position.x += this.velocity.x;
        }
        
        // Faz o inimigo reaparecer do outro lado
        if (this.position.x + this.width < 0) {
            this.position.x = canvas.width;
        }
    }
}

class ParallaxLayer {
    constructor(image, speed) {
        this.x = 0;
        this.y = 0;
        this.width = canvas.width;
        this.height = canvas.height;
        this.image = image;
        this.speedModifier = speed;
    }

    update() {
        const effectiveSpeed = gameSpeed * this.speedModifier;
        this.x -= effectiveSpeed;
        if (this.x <= -this.width) {
            this.x = 0;
        }
    }

    draw() {
        if (!this.image.complete) return;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);
    }
}

function checkAABBCollision(rect1, rect2) {
    return (
        rect1.position.x < rect2.position.x + rect2.width &&
        rect1.position.x + rect1.width > rect2.position.x &&
        rect1.position.y < rect2.position.y + rect2.height &&
        rect1.position.y + rect1.height > rect2.position.y
    );
}

let player, projectiles, enemies, layers, gameSpeed, isGameOver, frameCount, shootCooldown, lastShotFrame;
let level, deaths = 0, maxLevelReached = 1, enemiesToSpawn, enemiesSpawned, enemiesKilled;

function init() {
    player = new Player();
    projectiles = [];
    enemies = [];

    gameSpeed = 0;
    isGameOver = false;
    frameCount = 0;
    shootCooldown = 30;
    lastShotFrame = 0;

    level = 1;
    setupLevel();

    layers = [new ParallaxLayer(assets.images.background, 0.5)];

    if (audioInitialized) {
        assets.sounds.backgroundMusic.currentTime = 0;
        assets.sounds.backgroundMusic.play().catch(e => {});
    }
}

function setupLevel() {
    const minEnemies = 2 + level * 2;
    const maxEnemies = 4 + level * 3;
    enemiesToSpawn = Math.floor(Math.random() * (maxEnemies - minEnemies + 1)) + minEnemies;
    enemiesSpawned = 0;
    enemiesKilled = 0;
    enemies = [];
}

function advanceToNextLevel() {
    level++;
    if (level > maxLevelReached) maxLevelReached = level;
    setupLevel();
}

function update() {
    if (isGameOver) {
        if (keys.Enter.pressed) init();
        return;
    }

    layers.forEach(layer => layer.update());
    player.update();

    if (keys.Space.pressed && frameCount - lastShotFrame > shootCooldown) {
        projectiles.push(new Projectile({
            position: { x: player.position.x + player.width / 2, y: player.position.y + player.height / 2 },
            velocity: { x: 10 * player.direction, y: 0 } // Dispara na direção do jogador
        }));
        lastShotFrame = frameCount;
        player.isAttacking = true;
        player.attackTimer = player.attackDuration;
    }

    projectiles.forEach((p, pIndex) => {
        p.update();
        if (p.position.x > canvas.width || p.position.x < 0) projectiles.splice(pIndex, 1);
    });

    enemies.forEach((enemy) => {
        enemy.update();

        if (enemy && !enemy.isDying && checkAABBCollision(player, enemy)) {
            if (!isGameOver) {
                if (audioInitialized) {
                    assets.sounds.death.currentTime = 0;
                    assets.sounds.death.play().catch(e => {});
                }
            }
            isGameOver = true;
            deaths++;
        }

        projectiles.forEach((proj, pIndex) => {
            if (enemy && !enemy.isDying && checkAABBCollision(proj, enemy)) {
                projectiles.splice(pIndex, 1);
                enemy.takeDamage();
                if (audioInitialized) {
                    assets.sounds.hit.currentTime = 0;
                    assets.sounds.hit.play().catch(e => {});
                }
            }
        });
    });

    enemies = enemies.filter(enemy => !enemy.isDead);

    if (enemiesSpawned < enemiesToSpawn && frameCount % 120 === 0) {
        enemies.push(new Enemy({ position: { x: canvas.width, y: canvas.height - 150 } }));
        enemiesSpawned++;
    }

    if (enemiesSpawned >= enemiesToSpawn && enemiesKilled >= enemiesToSpawn && enemies.length === 0) {
        advanceToNextLevel();
    }

    if (player.isOnGround && !isGameOver) {
        if (audioInitialized && (keys.ArrowLeft.pressed || keys.ArrowRight.pressed)) {
            assets.sounds.footsteps.play().catch(e => {});
        } else {
            assets.sounds.footsteps.pause();
        }
    } else {
        assets.sounds.footsteps.pause();
    }

    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layers.forEach(layer => layer.draw());
    projectiles.forEach(p => p.draw());
    enemies.forEach(e => e.draw());
    player.draw();

    ctx.fillStyle = 'white';
    ctx.font = '24px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Nível: ${level}`, 20, 40);
    ctx.fillText(`Recorde: ${maxLevelReached}`, 20, 70);
    ctx.textAlign = 'right';
    ctx.fillText(`Mortes: ${deaths}`, canvas.width - 20, 40);

    if (isGameOver) {
        assets.sounds.backgroundMusic.pause();
        assets.sounds.footsteps.pause();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffc400';
        ctx.font = 'bold 50px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('FIM DE JOGO', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = 'white';
        ctx.font = '20px Inter';
        ctx.fillText('Pressione "Enter" para reiniciar', canvas.width / 2, canvas.height / 2 + 30);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', () => {
    if (!audioInitialized) {
        audioInitialized = true;
        assets.sounds.backgroundMusic.play().catch(e => {});
    }
}, { once: true });

