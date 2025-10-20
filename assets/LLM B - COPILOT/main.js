// Aguarda o carregamento do DOM para iniciar
// Wait for DOM load
window.addEventListener('load', () => {
    // --- DOM & CANVAS SETUP ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    // Responsive canvas while keeping 4:3 aspect
    function resizeCanvas() {
        const maxWidth = Math.min(window.innerWidth - 40, 1024);
        const width = maxWidth;
        const height = Math.round((3 / 4) * width);
        canvas.width = width;
        canvas.height = height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const loaderEl = document.getElementById('loader');
    const finalScoreEl = document.getElementById('final-score');

    const scoreCounter = document.getElementById('score');
    const speedCounter = document.getElementById('speed');

    // --- GAME STATE ---
    let lastTime = 0;
    let delta = 0;
    let gameRunning = false;
    let player = null;
    let projectiles = [];
    let asteroids = [];
    let keys = {};
    let asteroidSpawnAccum = 0; // seconds accumulator
    let score = 0;
    let startTime = 0;
    let animationId = null;

    // --- CONFIG ---
    const CONFIG = {
        fireCooldown: 0.25, // seconds between shots
        asteroidBaseInterval: 1.2, // seconds
        bgSpeed: 30, // pixels per second
    };

    // --- ASSETS ---
    const ASSET_PATH = 'assets/';
    const assets = {
        player: ASSET_PATH + 'player.png',
        asteroid: ASSET_PATH + 'asteroid.png',
        bg: ASSET_PATH + 'background.png',
    };

    const images = {};

    function preloadImages(list) {
        const promises = Object.keys(list).map(key => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = list[key];
                img.onload = () => {
                    images[key] = img;
                    resolve();
                };
                img.onerror = () => {
                    // Resolve anyway so the game still runs with placeholders
                    images[key] = null;
                    console.warn('Falha ao carregar', list[key]);
                    resolve();
                };
            });
        });
        return Promise.all(promises);
    }

    // --- ENTITIES ---
    class Player {
        constructor() {
            this.w = Math.round(canvas.width * 0.08);
            this.h = Math.round(this.w * 1.2);
            this.x = (canvas.width - this.w) / 2;
            this.y = canvas.height - this.h - 20;
            this.speed = canvas.width * 0.5; // pixels per second
            this.fireTimer = 0;
        }

        update(dt) {
            let dx = 0;
            if (keys.ArrowLeft || keys.a) dx -= 1;
            if (keys.ArrowRight || keys.d) dx += 1;
            this.x += dx * this.speed * dt;
            // clamp
            this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
            this.fireTimer = Math.max(0, this.fireTimer - dt);
        }

        draw(ctx) {
            if (images.player) {
                ctx.drawImage(images.player, this.x, this.y, this.w, this.h);
            } else {
                ctx.fillStyle = '#7c4dff';
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
        }

        canFire() {
            return this.fireTimer <= 0;
        }

        fire() {
            this.fireTimer = CONFIG.fireCooldown;
            const px = this.x + this.w / 2;
            const py = this.y;
            projectiles.push(new Projectile(px, py, canvas));
        }
    }

    class Projectile {
        constructor(x, y) {
            this.w = Math.max(4, Math.round(canvas.width * 0.006));
            this.h = Math.max(10, Math.round(canvas.height * 0.02));
            this.x = x - this.w / 2;
            this.y = y - this.h;
            this.speed = canvas.height * 0.7; // px/s
            this.dead = false;
        }

        update(dt) {
            this.y -= this.speed * dt;
            if (this.y + this.h < 0) this.dead = true;
        }

        draw(ctx) {
            ctx.fillStyle = '#ff6bcb';
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }

    class Asteroid {
        constructor(speedModifier = 1) {
            const dims = [30, 50, 70, 90, 110];
            const size = dims[Math.floor(Math.random() * dims.length)];
            this.w = Math.round((size / 800) * canvas.width);
            this.h = this.w;
            this.x = Math.random() * (canvas.width - this.w);
            this.y = -this.h - Math.random() * 200;
            const baseSpeed = (120 / size) * (canvas.height / 600);
            this.speed = (baseSpeed + Math.random() * 0.6) * speedModifier;
            this.dead = false;
        }

        update(dt) {
            this.y += this.speed * dt * 60; // tune using 60fps baseline
            if (this.y > canvas.height + 50) this.dead = true;
        }

        draw(ctx) {
            if (images.asteroid) {
                ctx.drawImage(images.asteroid, this.x, this.y, this.w, this.h);
            } else {
                ctx.fillStyle = '#bdbdbd';
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
        }
    }

    // --- UTILS ---
    function rectsOverlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function detectCollision(a, b) {
        // adapt to shapes used (they use w/h)
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    // --- BACKGROUND PARALLAX ---
    let bgY = 0;

    function drawBackground(dt) {
        if (images.bg) {
            // tile the background vertically
            const img = images.bg;
            const h = canvas.height;
            bgY += CONFIG.bgSpeed * dt;
            if (bgY >= h) bgY = 0;
            ctx.drawImage(img, 0, -bgY, canvas.width, h);
            ctx.drawImage(img, 0, h - bgY, canvas.width, h);
        } else {
            ctx.fillStyle = '#060006';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // --- GAME LOGIC ---
    function resetGameState() {
        projectiles = [];
        asteroids = [];
        keys = {};
        asteroidSpawnAccum = 0;
        score = 0;
        scoreCounter.textContent = '0';
    }

    function spawnAsteroids(dt) {
        const elapsed = (Date.now() - startTime) / 1000;
        const speedModifier = 1 + Math.floor(elapsed / 10) * 0.15;
        speedCounter.textContent = `${(1 + (speedModifier - 1)).toFixed(1)}x`;

        const interval = Math.max(0.35, CONFIG.asteroidBaseInterval - Math.floor(elapsed / 15) * 0.05);
        asteroidSpawnAccum += dt;
        while (asteroidSpawnAccum >= interval) {
            asteroids.push(new Asteroid(speedModifier));
            asteroidSpawnAccum -= interval;
        }
    }

    function handleCollisions() {
        // projectiles x asteroids
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            for (let j = asteroids.length - 1; j >= 0; j--) {
                const a = asteroids[j];
                if (rectsOverlap({x: p.x, y: p.y, w: p.w, h: p.h}, {x: a.x, y: a.y, w: a.w, h: a.h})) {
                    p.dead = true;
                    a.dead = true;
                    score += 1;
                    scoreCounter.textContent = String(score);
                    break;
                }
            }
        }

        // player x asteroids
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const a = asteroids[j];
            if (rectsOverlap({x: player.x, y: player.y, w: player.w || player.w, h: player.h || player.h}, {x: a.x, y: a.y, w: a.w, h: a.h})) {
                endGame();
            }
        }
    }

    function endGame() {
        gameRunning = false;
        if (animationId) cancelAnimationFrame(animationId);
        finalScoreEl.textContent = String(score);
        gameOverScreen.classList.remove('hidden');
    }

    // --- MAIN LOOP ---
    function updateAndRender(ts) {
        if (!lastTime) lastTime = ts;
        const dt = Math.min(0.05, (ts - lastTime) / 1000); // clamp to avoid large jumps
        lastTime = ts;

        // Update
        if (gameRunning) {
            drawBackground(dt);

            player.update(dt);
            player.draw(ctx);

            projectiles.forEach(p => p.update(dt));
            asteroids.forEach(a => a.update(dt));

            spawnAsteroids(dt);
            handleCollisions();

            // cleanup dead
            projectiles = projectiles.filter(p => !p.dead);
            asteroids = asteroids.filter(a => !a.dead);

            // draw projectiles and asteroids after cleanup to keep order stable
            projectiles.forEach(p => p.draw(ctx));
            asteroids.forEach(a => a.draw(ctx));

            animationId = requestAnimationFrame(updateAndRender);
        }
    }

    // --- INPUT ---
    window.addEventListener('keydown', (e) => {
        // normalize
        const k = e.key;
        keys[k] = true;
        // spacebar
        if ((k === ' ' || k === 'Spacebar' || k === 'Space') && gameRunning) {
            e.preventDefault();
            if (player && player.canFire()) player.fire();
        }
    });
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // --- START / RESTART ---
    function startGame() {
        resetGameState();
        player = new Player();
        startTime = Date.now();
        gameRunning = true;
        gameOverScreen.classList.add('hidden');
        startScreen.classList.add('hidden');
        lastTime = 0;
        animationId = requestAnimationFrame(updateAndRender);
    }

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        startGame();
    });

    // --- BOOTSTRAP: preload images then enable start ---
    preloadImages(assets).then(() => {
        loaderEl.style.display = 'none';
        startButton.disabled = false;
    });
});