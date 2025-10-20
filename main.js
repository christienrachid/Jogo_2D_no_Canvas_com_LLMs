// ===== ASTEROIDS: QUANTUM DRIFT =====
// Jogo de asteroides em HTML5 Canvas com mecânicas avançadas
// Desenvolvido com JavaScript puro - sem frameworks

// ===== CONFIGURAÇÕES GLOBAIS (OTIMIZADAS) =====
const CONFIG = {
    canvas: {
        width: 1200,
        height: 800
    },
    game: {
        fps: 60,
        maxAsteroids: 15, // Limite máximo de 15
        maxBullets: 20,
        maxParticles: 150, // Aumentado para efeitos
        cullDistance: 100, // Distância para culling off-screen
        // Sistema de progressão mais lento e baseado em score
        progression: {
            // Progressão de asteroides mais lenta
            phases: [
                { maxWave: 10, baseAsteroids: 6, growthRate: 0.4 },   // Iniciante: 6-10
                { maxWave: 25, baseAsteroids: 8, growthRate: 0.3 },   // Básico: 8-12
                { maxWave: 50, baseAsteroids: 10, growthRate: 0.2 },  // Intermediário: 10-15
                { maxWave: 100, baseAsteroids: 12, growthRate: 0.15 }, // Avançado: 12-15
                { maxWave: 999, baseAsteroids: 13, growthRate: 0.1 }   // Expert: 13-15
            ],
            maxAbsoluteAsteroids: 15, // Limite de 15 como pedido
            speedIncrease: 0.03,      // 3% por wave (muito mais lento)
            maxSpeedMultiplier: 1.8,  // 180% da velocidade base máxima
            speedCapWave: 80,         // Para de acelerar no wave 80
            // Sistema baseado em score
            scoreThresholds: {
                normal: 10000,        // Score normal até 10k
                insane: 10001         // Dificuldade insana após 10k
            }
        }
    },
    player: {
        size: 15,
        maxSpeed: 2.5,
        acceleration: 0.08,
        friction: 0.94,
        rotationSpeed: 0.06
    },
    bullet: {
        speed: 6,
        lifetime: 60 // frames
    },
    asteroid: {
        minSpeed: 0.5,
        maxSpeed: 3,
        sizes: [60, 40, 20] // large, medium, small
    },
    performance: {
        enableCulling: true,
        enableParticleLimit: true,
        showDebugInfo: false
    }
};

// ===== SISTEMA DE PERFORMANCE MONITORING =====
const performanceMonitor = {
    frameCount: 0,
    lastFpsTime: 0,
    currentFps: 60,
    drawCalls: 0,
    culledObjects: 0,
    
    update(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFpsTime >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
    },
    
    reset() {
        this.drawCalls = 0;
        this.culledObjects = 0;
    }
};

// ===== VARIÁVEIS GLOBAIS =====
let canvas, ctx;
let gameState = 'playing'; // 'playing', 'paused', 'gameOver'
let score = 0;
let lives = 3;
let wave = 1;
let lastTime = 0;

// ===== SISTEMA DE SPRITES =====
const sprites = {
    ship: null,
    asteroid: null,
    explosion: null,
    laser: null
};

// ===== SISTEMA DE SONS =====
const sounds = {
    asteroidDestroy: null,
    playerHit: null,
    shoot: null,
    thrust: null
};

// ===== CONTEXTO DE ÁUDIO GLOBAL =====
let audioContext = null;
let audioInitialized = false;

// ===== CONFIGURAÇÕES DE ANIMAÇÃO =====
const animations = {
    playerIdle: {
        frames: [{x: 0, y: 0, w: 32, h: 32}],
        frameRate: 1,
        loop: true
    },
    playerThrust: {
        frames: [
            {x: 32, y: 0, w: 32, h: 32},
            {x: 64, y: 0, w: 32, h: 32},
            {x: 96, y: 0, w: 32, h: 32}
        ],
        frameRate: 8,
        loop: true
    },
    explosion: {
        frames: [
            {x: 0, y: 0, w: 64, h: 64},
            {x: 64, y: 0, w: 64, h: 64},
            {x: 128, y: 0, w: 64, h: 64},
            {x: 192, y: 0, w: 64, h: 64},
            {x: 0, y: 64, w: 64, h: 64},
            {x: 64, y: 64, w: 64, h: 64}
        ],
        frameRate: 10,
        loop: false
    }
};

// ===== ARRAYS DE ENTIDADES (COM OBJECT POOLING) =====
let player = null;
let asteroids = [];
let bullets = [];
let particles = [];
let stars = [];
let explosions = [];

// ===== OBJECT POOLS PARA PERFORMANCE =====
const objectPools = {
    bullets: {
        pool: [],
        active: [],
        
        get() {
            if (this.pool.length > 0) {
                return this.pool.pop();
            }
            return {
                x: 0, y: 0, vx: 0, vy: 0,
                lifetime: 0, angle: 0, trail: []
            };
        },
        
        release(bullet) {
            bullet.trail.length = 0; // Limpar trail
            this.pool.push(bullet);
        }
    },
    
    particles: {
        pool: [],
        active: [],
        
        get() {
            if (this.pool.length > 0) {
                return this.pool.pop();
            }
            return {
                x: 0, y: 0, vx: 0, vy: 0,
                life: 0, maxLife: 0, size: 0,
                color: '#fff', friction: 1, alpha: 1,
                text: '', isText: false
            };
        },
        
        release(particle) {
            this.pool.push(particle);
        }
    }
};

// ===== CLASSE PARA ANIMAÇÕES =====
class SpriteAnimation {
    constructor(animationData) {
        this.frames = animationData.frames;
        this.frameRate = animationData.frameRate;
        this.loop = animationData.loop;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.finished = false;
    }
    
    update() {
        this.frameTimer++;
        
        if (this.frameTimer >= this.frameRate) {
            this.frameTimer = 0;
            this.currentFrame++;
            
            if (this.currentFrame >= this.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.finished = true;
                    this.currentFrame = this.frames.length - 1;
                }
            }
        }
    }
    
    getCurrentFrame() {
        return this.frames[this.currentFrame];
    }
    
    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.finished = false;
    }
}

// ===== CLASSE PARA EXPLOSÕES ANIMADAS =====
class AnimatedExplosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.animation = new SpriteAnimation(animations.explosion);
        this.scale = 0.5 + Math.random() * 0.5;
    }
    
    update() {
        this.animation.update();
        return !this.animation.finished;
    }
    
    draw(ctx, sprite) {
        if (!sprite) return;
        
        const frame = this.animation.getCurrentFrame();
        const drawWidth = frame.w * this.scale;
        const drawHeight = frame.h * this.scale;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Desenhar frame da explosão
        ctx.drawImage(
            sprite,
            frame.x, frame.y, frame.w, frame.h,
            -drawWidth/2, -drawHeight/2, drawWidth, drawHeight
        );
        
        ctx.restore();
    }
}

// ===== SISTEMA DE CONTROLES =====
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    shift: false // Quantum Jump
};

// ===== SISTEMA DE PARALAXE AVANÇADO =====
const parallaxLayers = [
    { 
        stars: [], 
        speed: 0.1, 
        count: 100, 
        size: 1, 
        alpha: 0.3,
        color: '#4444ff',
        twinkle: true
    },
    { 
        stars: [], 
        speed: 0.3, 
        count: 50, 
        size: 2, 
        alpha: 0.6,
        color: '#8888ff',
        twinkle: true
    },
    { 
        stars: [], 
        speed: 0.6, 
        count: 30, 
        size: 3, 
        alpha: 0.9,
        color: '#ffffff',
        twinkle: false
    },
    {
        stars: [],
        speed: 1.0,
        count: 10,
        size: 4,
        alpha: 1.0,
        color: '#ffff88',
        twinkle: false,
        glow: true
    }
];

// ===== EFEITOS VISUAIS AVANÇADOS =====
const visualEffects = {
    screenShake: 0,
    chromatic: 0,
    time: 0,
    
    update() {
        this.time += 0.016; // ~60fps
        if (this.screenShake > 0) this.screenShake *= 0.9;
        if (this.chromatic > 0) this.chromatic *= 0.95;
    },
    
    addShake(intensity) {
        this.screenShake = Math.max(this.screenShake, intensity);
    },
    
    addChromatic(intensity) {
        this.chromatic = Math.max(this.chromatic, intensity);
    }
};

// ===== INICIALIZAÇÃO DO JOGO =====
function init() {
    // Obter referência do canvas e contexto
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Configurar canvas
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;
    
    // Carregar sprites
    loadSprites(() => {
        // Inicializar sistemas após carregar sprites
        initParallax();
        initPlayer();
        initAsteroids();
        setupEventListeners();
        
        // Iniciar loop principal
        gameLoop();
        
        console.log('🚀 Asteroids: Quantum Drift iniciado!');
        console.log('🎮 Controles: WASD/Arrows = Mover | Space = Atirar | Shift = Quantum Jump');
    });
}

// ===== CARREGAMENTO DE SPRITES =====
function loadSprites(callback) {
    let loadedCount = 0;
    const totalSprites = 4; // Apenas sprites
    
    function onLoad() {
        loadedCount++;
        if (loadedCount === totalSprites) {
            // Inicializar sons sintéticos
            initializeSyntheticSounds();
            callback();
        }
    }
    
    // Carregar sprite da nave
    sprites.ship = new Image();
    sprites.ship.onload = onLoad;
    sprites.ship.onerror = onLoad; // Falhar silenciosamente
    sprites.ship.src = 'assets/sprites/ship.png';
    
    // Carregar sprite do asteroide
    sprites.asteroid = new Image();
    sprites.asteroid.onload = onLoad;
    sprites.asteroid.onerror = onLoad; // Falhar silenciosamente
    sprites.asteroid.src = 'assets/sprites/asteroid.png';
    
    // Carregar sprite da explosão
    sprites.explosion = new Image();
    sprites.explosion.onload = onLoad;
    sprites.explosion.onerror = onLoad; // Falhar silenciosamente
    sprites.explosion.src = 'assets/sprites/explode.png';
    
    // Carregar sprite do laser
    sprites.laser = new Image();
    sprites.laser.onload = onLoad;
    sprites.laser.onerror = onLoad; // Falhar silenciosamente
    sprites.laser.src = 'assets/sprites/lazer.png';
}

// ===== SISTEMA DE SONS SINTÉTICOS (SEM ARQUIVOS) =====
function setupSyntheticSounds() {
    // Inicializar sons sintéticos apenas (sem tentar carregar arquivos)
    console.log('🎵 Sistema de áudio sintético configurado');
    console.log('💡 Para melhor qualidade, você pode adicionar arquivos .wav em assets/sounds/');
}

// ===== INICIALIZAR SONS SINTÉTICOS =====
function initializeSyntheticSounds() {
    sounds.asteroidDestroy = createSyntheticSound('asteroidDestroy');
    sounds.playerHit = createSyntheticSound('playerHit');
    sounds.shoot = createSyntheticSound('shoot');
    sounds.thrust = createSyntheticSound('thrust');
    console.log('🎵 Sons sintéticos de alta qualidade carregados');
    console.log('💡 Para sons ainda melhores, baixe: https://freesound.org/search/?q=space+game+sounds');
}



// ===== SONS AVANÇADOS COM WEB AUDIO API =====
function createLaserSound() {
    if (!audioContext || !audioInitialized) return;
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Som de laser clássico arcade
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Frequência descendente rápida (laser clássico)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
        oscillator.type = 'square';
        
        // Envelope de volume
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Falhar silenciosamente
    }
}

function createExplosionSound() {
    if (!audioContext || !audioInitialized) return;
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Som de explosão com ruído branco
        const bufferSize = audioContext.sampleRate * 0.4; // 0.4 segundos
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Gerar ruído branco com envelope
        for (let i = 0; i < bufferSize; i++) {
            const decay = 1 - (i / bufferSize);
            data[i] = (Math.random() * 2 - 1) * decay * decay;
        }
        
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Filtro passa-baixa para som mais natural
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        source.start();
        source.stop(audioContext.currentTime + 0.4);
    } catch (e) {
        // Falhar silenciosamente
    }
}

function createPlayerHitSound() {
    if (!audioContext || !audioInitialized) return;
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Som dramático de dano - múltiplas frequências
        const duration = 0.6;
        
        // Oscilador principal (baixa frequência)
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        
        osc1.frequency.setValueAtTime(200, audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + duration);
        osc1.type = 'sawtooth';
        
        gain1.gain.setValueAtTime(0.4, audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        // Oscilador secundário (efeito metálico)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        
        osc2.frequency.setValueAtTime(800, audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        osc2.type = 'square';
        
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        osc1.start();
        osc1.stop(audioContext.currentTime + duration);
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Falhar silenciosamente
    }
}

function createThrustSound() {
    if (!audioContext || !audioInitialized) return;
    
    try {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Som de motor/propulsão
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(120, audioContext.currentTime);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Falhar silenciosamente
    }
}

// ===== CRIAR SONS SINTÉTICOS ESPECÍFICOS =====
function createSyntheticSound(type) {
    return {
        play: () => {
            switch(type) {
                case 'asteroidDestroy':
                    createExplosionSound();
                    break;
                case 'playerHit':
                    createPlayerHitSound();
                    break;
                case 'shoot':
                    createLaserSound();
                    break;
                case 'thrust':
                    createThrustSound();
                    break;
            }
        },
        isSynthetic: true,
        soundType: type
    };
}

// ===== INICIALIZAÇÃO DO PARALAXE AVANÇADO =====
function initParallax() {
    parallaxLayers.forEach(layer => {
        layer.stars = [];
        for (let i = 0; i < layer.count; i++) {
            layer.stars.push({
                x: Math.random() * CONFIG.canvas.width,
                y: Math.random() * CONFIG.canvas.height,
                size: layer.size + (Math.random() - 0.5) * layer.size * 0.5,
                alpha: layer.alpha,
                baseAlpha: layer.alpha,
                twinkleSpeed: 0.02 + Math.random() * 0.03,
                twinkleOffset: Math.random() * Math.PI * 2,
                color: layer.color,
                glow: layer.glow || false
            });
        }
    });
}

// ===== INICIALIZAÇÃO DO PLAYER =====
function initPlayer() {
    player = {
        x: CONFIG.canvas.width / 2,
        y: CONFIG.canvas.height / 2,
        vx: 0,
        vy: 0,
        angle: 0,
        size: CONFIG.player.size,
        thrusting: false,
        invulnerable: 0, // frames de invulnerabilidade
        quantumCooldown: 0, // cooldown do quantum jump
        
        // Sistema de animação
        idleAnimation: new SpriteAnimation(animations.playerIdle),
        thrustAnimation: new SpriteAnimation(animations.playerThrust),
        currentAnimation: null,
        
        // Trail de movimento
        trail: [],
        maxTrailLength: 8
    };
    
    // Definir animação inicial
    player.currentAnimation = player.idleAnimation;
}

// ===== INICIALIZAÇÃO DOS ASTEROIDES =====
function initAsteroids() {
    asteroids = [];
    
    const progression = CONFIG.game.progression;
    
    // Verificar se score passou de 10k (dificuldade insana)
    const isInsaneMode = score >= progression.scoreThresholds.insane;
    
    // Determinar fase atual baseada no wave
    let currentPhase = progression.phases[0];
    for (const phase of progression.phases) {
        if (wave <= phase.maxWave) {
            currentPhase = phase;
            break;
        }
    }
    
    // Calcular número de asteroides
    let asteroidCount;
    if (isInsaneMode) {
        // Modo insano: sempre no máximo + variação aleatória
        asteroidCount = progression.maxAbsoluteAsteroids;
        console.log(`💀 MODO INSANO ATIVADO! Score: ${score}`);
    } else {
        // Progressão normal mais lenta
        const waveInPhase = Math.max(1, wave - (progression.phases.indexOf(currentPhase) * 15));
        asteroidCount = Math.min(
            currentPhase.baseAsteroids + Math.floor(waveInPhase * currentPhase.growthRate),
            progression.maxAbsoluteAsteroids
        );
    }
    
    // Criar asteroides com variedade de tamanhos
    for (let i = 0; i < asteroidCount; i++) {
        let sizeIndex;
        
        if (isInsaneMode) {
            // Modo insano: mais asteroides pequenos e rápidos
            const rand = Math.random();
            if (rand < 0.3) sizeIndex = 0;      // 30% grandes
            else if (rand < 0.6) sizeIndex = 1; // 30% médios  
            else sizeIndex = 2;                 // 40% pequenos
        } else {
            // Progressão normal de tamanhos
            if (wave <= 5) {
                sizeIndex = Math.random() < 0.8 ? 0 : 1; // Principalmente grandes
            } else if (wave <= 15) {
                const rand = Math.random();
                if (rand < 0.6) sizeIndex = 0;      // 60% grandes
                else if (rand < 0.85) sizeIndex = 1; // 25% médios  
                else sizeIndex = 2;                 // 15% pequenos
            } else {
                // Mix balanceado
                const rand = Math.random();
                if (rand < 0.5) sizeIndex = 0;      // 50% grandes
                else if (rand < 0.75) sizeIndex = 1; // 25% médios  
                else sizeIndex = 2;                 // 25% pequenos
            }
        }
        
        createAsteroid(sizeIndex);
    }
    
    const phaseNames = ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Expert'];
    const phaseName = phaseNames[progression.phases.indexOf(currentPhase)];
    const modeText = isInsaneMode ? ' 💀 INSANO' : '';
    console.log(`🌌 Wave ${wave} (${phaseName}${modeText}): ${asteroidCount} asteroides criados`);
}

// ===== CRIAÇÃO DE ASTEROIDES =====
function createAsteroid(sizeIndex, x, y) {
    // Se não foi especificado posição, criar longe do player
    if (x === undefined || y === undefined) {
        do {
            x = Math.random() * CONFIG.canvas.width;
            y = Math.random() * CONFIG.canvas.height;
        } while (distance(x, y, player.x, player.y) < 150);
    }
    
    // Sistema de velocidade baseado em score e wave
    const progression = CONFIG.game.progression;
    const isInsaneMode = score >= progression.scoreThresholds.insane;
    
    let speedMultiplier;
    if (isInsaneMode) {
        // Modo insano: velocidade muito alta e imprevisível
        speedMultiplier = 2.5 + Math.random() * 1.5; // 250% a 400%
    } else {
        // Progressão normal mais lenta
        const waveProgress = Math.min(wave / progression.speedCapWave, 1);
        speedMultiplier = Math.min(
            1 + (wave - 1) * progression.speedIncrease,
            progression.maxSpeedMultiplier
        );
    }
    
    const size = CONFIG.asteroid.sizes[sizeIndex];
    const baseSpeed = CONFIG.asteroid.minSpeed + Math.random() * 
                     (CONFIG.asteroid.maxSpeed - CONFIG.asteroid.minSpeed);
    
    // Aplicar multiplicador de velocidade
    const speed = baseSpeed * speedMultiplier;
    const angle = Math.random() * Math.PI * 2;
    
    asteroids.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        sizeIndex: sizeIndex,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        vertices: generateAsteroidVertices(size)
    });
}

// ===== GERAÇÃO DE VÉRTICES ALEATÓRIOS PARA ASTEROIDES =====
function generateAsteroidVertices(size) {
    const vertices = [];
    const numVertices = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * Math.PI * 2;
        const radius = size * (0.7 + Math.random() * 0.3);
        vertices.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        });
    }
    
    return vertices;
}

// ===== INICIALIZAR ÁUDIO =====
function initializeAudio() {
    if (!audioInitialized) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioInitialized = true;
            console.log('🔊 Áudio inicializado!');
            
            // Remover mensagem de áudio
            const audioStatus = document.getElementById('audioStatus');
            if (audioStatus) {
                audioStatus.style.display = 'none';
            }
        } catch (e) {
            console.log('Áudio não disponível:', e);
        }
    }
}

// ===== CONFIGURAÇÃO DE EVENT LISTENERS =====
function setupEventListeners() {
    // Controles de teclado
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Inicializar áudio no primeiro clique/tecla
    const initAudioOnInteraction = () => {
        initializeAudio();
        setupSyntheticSounds(); // Configurar sons sintéticos
        document.removeEventListener('keydown', initAudioOnInteraction);
        document.removeEventListener('click', initAudioOnInteraction);
    };
    
    document.addEventListener('keydown', initAudioOnInteraction);
    document.addEventListener('click', initAudioOnInteraction);
    
    // Prevenir comportamentos padrão
    document.addEventListener('keydown', (e) => {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    });
}

// ===== MANIPULAÇÃO DE TECLAS =====
function handleKeyDown(e) {
    switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.up = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.down = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'Space':
            keys.space = true;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            keys.shift = true;
            break;
        case 'KeyP':
            togglePause();
            break;
        case 'KeyR':
            if (gameState === 'gameOver') {
                restartGame();
            }
            break;
        case 'KeyI':
            toggleDebugInfo();
            break;
    }
}

function handleKeyUp(e) {
    switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.up = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.down = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'Space':
            keys.space = false;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            keys.shift = false;
            break;
    }
}

// ===== LOOP PRINCIPAL DO JOGO (OTIMIZADO) =====
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Atualizar monitor de performance
    performanceMonitor.update(currentTime);
    performanceMonitor.reset();
    
    // Atualizar lógica do jogo
    if (gameState === 'playing') {
        update(deltaTime);
    }
    
    // Renderizar tudo
    draw();
    
    // Continuar loop
    requestAnimationFrame(gameLoop);
}

// ===== SISTEMA DE CULLING (PERFORMANCE) =====
function isObjectVisible(obj, margin = CONFIG.game.cullDistance) {
    return (
        obj.x > -margin && 
        obj.x < CONFIG.canvas.width + margin &&
        obj.y > -margin && 
        obj.y < CONFIG.canvas.height + margin
    );
}

// ===== SEPARAÇÃO DE UPDATE E DRAW (OTIMIZAÇÃO) =====
function updateLogic() {
    // Atualizar efeitos visuais
    visualEffects.update();
    
    // Apenas lógica, sem operações de desenho
    updatePlayer();
    updateBullets();
    updateAsteroids();
    updateParticles();
    updateExplosions();
    updateParallax();
    checkCollisions();
    checkWaveCompletion();
    
    // Decrementar cooldowns
    if (player.invulnerable > 0) player.invulnerable--;
    if (player.quantumCooldown > 0) player.quantumCooldown--;
}

function renderFrame() {
    // Aplicar screen shake
    if (visualEffects.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * visualEffects.screenShake;
        const shakeY = (Math.random() - 0.5) * visualEffects.screenShake;
        ctx.save();
        ctx.translate(shakeX, shakeY);
    }
    
    // Apenas operações de renderização
    clearCanvas();
    drawParallax();
    drawAsteroids();
    drawBullets();
    drawParticles();
    drawExplosions();
    drawPlayer();
    drawEffects();
    
    // Restaurar transformação se houve shake
    if (visualEffects.screenShake > 0) {
        ctx.restore();
    }
    
    // Efeitos pós-processamento
    drawPostEffects();
    drawDebugInfo();
}

// ===== EFEITOS PÓS-PROCESSAMENTO =====
function drawPostEffects() {
    // Chromatic aberration effect
    if (visualEffects.chromatic > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = visualEffects.chromatic * 0.1;
        
        // Deslocar canais de cor
        ctx.translate(visualEffects.chromatic, 0);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        ctx.translate(-visualEffects.chromatic * 2, 0);
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        ctx.restore();
    }
    
    // Vignette effect
    const gradient = ctx.createRadialGradient(
        CONFIG.canvas.width / 2, CONFIG.canvas.height / 2, 0,
        CONFIG.canvas.width / 2, CONFIG.canvas.height / 2, 
        Math.max(CONFIG.canvas.width, CONFIG.canvas.height) * 0.7
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 20, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
}

function clearCanvas() {
    // Otimização: usar clearRect ao invés de fillRect quando possível
    ctx.fillStyle = '#000012';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
}

// ===== ATUALIZAÇÃO DA LÓGICA (OTIMIZADA) =====
function update(deltaTime) {
    updateLogic();
}

// ===== ATUALIZAÇÃO DAS EXPLOSÕES =====
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        if (!explosions[i].update()) {
            explosions.splice(i, 1);
        }
    }
}

// ===== ATUALIZAÇÃO DO PLAYER =====
function updatePlayer() {
    // Rotação
    if (keys.left) {
        player.angle -= CONFIG.player.rotationSpeed;
    }
    if (keys.right) {
        player.angle += CONFIG.player.rotationSpeed;
    }
    
    // Thrust (aceleração para frente na direção que aponta)
    player.thrusting = keys.up;
    if (keys.up) {
        // Mover na direção do ângulo da nave (onde o bico aponta)
        player.vx += Math.cos(player.angle - Math.PI / 2) * CONFIG.player.acceleration;
        player.vy += Math.sin(player.angle - Math.PI / 2) * CONFIG.player.acceleration;
        
        // Trocar para animação de thrust
        if (player.currentAnimation !== player.thrustAnimation) {
            player.currentAnimation = player.thrustAnimation;
            player.thrustAnimation.reset();
        }
        
        // Criar partículas de thrust
        createThrustParticles();
    } else {
        // Trocar para animação idle
        if (player.currentAnimation !== player.idleAnimation) {
            player.currentAnimation = player.idleAnimation;
            player.idleAnimation.reset();
        }
    }
    
    // Freio (thrust reverso)
    if (keys.down) {
        player.vx -= Math.cos(player.angle - Math.PI / 2) * CONFIG.player.acceleration * 0.5;
        player.vy -= Math.sin(player.angle - Math.PI / 2) * CONFIG.player.acceleration * 0.5;
    }
    
    // Limitar velocidade máxima
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > CONFIG.player.maxSpeed) {
        player.vx = (player.vx / speed) * CONFIG.player.maxSpeed;
        player.vy = (player.vy / speed) * CONFIG.player.maxSpeed;
    }
    
    // Aplicar fricção
    player.vx *= CONFIG.player.friction;
    player.vy *= CONFIG.player.friction;
    
    // Atualizar posição
    player.x += player.vx;
    player.y += player.vy;
    
    // Wraparound nas bordas
    wrapPosition(player);
    
    // Disparo
    if (keys.space) {
        shoot();
    }
    
    // Quantum Jump
    if (keys.shift && player.quantumCooldown <= 0) {
        quantumJump();
    }
    
    // Atualizar animação atual
    player.currentAnimation.update();
    
    // Atualizar trail do player
    const playerSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (playerSpeed > 2) {
        player.trail.push({
            x: player.x,
            y: player.y,
            alpha: 0.8
        });
        
        if (player.trail.length > player.maxTrailLength) {
            player.trail.shift();
        }
    }
    
    // Diminuir alpha do trail
    player.trail.forEach(point => {
        point.alpha *= 0.9;
    });
    
    // Remover pontos muito fracos
    player.trail = player.trail.filter(point => point.alpha > 0.1);
}

// ===== SISTEMA DE DISPARO AVANÇADO =====
let lastShotTime = 0;
const SHOT_COOLDOWN = 8; // frames entre disparos

function shoot() {
    // Controle de taxa de disparo
    if (lastShotTime > 0) {
        lastShotTime--;
        return;
    }
    
    // Limite de balas ativas
    if (bullets.length >= CONFIG.game.maxBullets) return;
    
    // Calcular posição do bico da nave (frente da nave)
    const tipX = player.x + Math.cos(player.angle - Math.PI / 2) * player.size;
    const tipY = player.y + Math.sin(player.angle - Math.PI / 2) * player.size;
    
    // Criar bala com propriedades avançadas (direção do bico)
    bullets.push({
        x: tipX,
        y: tipY,
        vx: Math.cos(player.angle - Math.PI / 2) * CONFIG.bullet.speed + player.vx * 0.3,
        vy: Math.sin(player.angle - Math.PI / 2) * CONFIG.bullet.speed + player.vy * 0.3,
        lifetime: CONFIG.bullet.lifetime,
        angle: player.angle - Math.PI / 2,
        trail: [] // Para efeito de rastro
    });
    
    // Definir cooldown
    lastShotTime = SHOT_COOLDOWN;
    
    // Tocar som de disparo
    playSound('shoot');
    
    // Recuo da nave (kickback) - muito reduzido
    const kickbackForce = 0.03;
    player.vx -= Math.cos(player.angle - Math.PI / 2) * kickbackForce;
    player.vy -= Math.sin(player.angle - Math.PI / 2) * kickbackForce;
    
    // Criar partículas de muzzle flash
    createMuzzleFlash(tipX, tipY, player.angle - Math.PI / 2);
}

// ===== QUANTUM JUMP =====
function quantumJump() {
    // Teleportar para posição aleatória segura
    let newX, newY;
    let attempts = 0;
    
    do {
        newX = Math.random() * CONFIG.canvas.width;
        newY = Math.random() * CONFIG.canvas.height;
        attempts++;
    } while (attempts < 10 && isPositionDangerous(newX, newY));
    
    // Efeito visual de partículas
    createQuantumParticles(player.x, player.y);
    
    player.x = newX;
    player.y = newY;
    player.quantumCooldown = 180; // 3 segundos a 60fps
    
    createQuantumParticles(newX, newY);
}

// ===== VERIFICAR SE POSIÇÃO É PERIGOSA =====
function isPositionDangerous(x, y) {
    for (let asteroid of asteroids) {
        if (distance(x, y, asteroid.x, asteroid.y) < asteroid.size + 50) {
            return true;
        }
    }
    return false;
}

// ===== ATUALIZAÇÃO DAS BALAS (OTIMIZADA) =====
function updateBullets() {
    // Atualizar cooldown de disparo
    if (lastShotTime > 0) lastShotTime--;
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Culling otimizado - verificar limites antes de atualizar
        if (CONFIG.performance.enableCulling && 
            (bullet.x < -100 || bullet.x > CONFIG.canvas.width + 100 ||
             bullet.y < -100 || bullet.y > CONFIG.canvas.height + 100)) {
            bullets.splice(i, 1);
            performanceMonitor.culledObjects++;
            continue;
        }
        
        // Salvar posição anterior para rastro (apenas se na tela)
        if (isObjectVisible(bullet)) {
            bullet.trail.push({x: bullet.x, y: bullet.y});
            if (bullet.trail.length > 5) {
                bullet.trail.shift(); // Manter apenas últimas 5 posições
            }
        }
        
        // Atualizar posição
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Decrementar lifetime
        bullet.lifetime--;
        
        // Remover se expirou
        if (bullet.lifetime <= 0) {
            bullets.splice(i, 1);
        }
    }
}

// ===== CRIAR EFEITO DE MUZZLE FLASH =====
function createMuzzleFlash(x, y, angle) {
    for (let i = 0; i < 8; i++) {
        const flashAngle = angle + (Math.random() - 0.5) * 0.5;
        const speed = 1 + Math.random() * 3;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(flashAngle) * speed,
            vy: Math.sin(flashAngle) * speed,
            life: 8 + Math.random() * 8,
            maxLife: 16,
            size: 2 + Math.random() * 3,
            color: '#ffff88',
            friction: 0.92,
            alpha: 1
        });
    }
}

// ===== ATUALIZAÇÃO DOS ASTEROIDES =====
function updateAsteroids() {
    asteroids.forEach(asteroid => {
        // Atualizar posição
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        
        // Atualizar rotação
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Wraparound
        wrapPosition(asteroid);
    });
}

// ===== ATUALIZAÇÃO DAS PARTÍCULAS (OTIMIZADA) =====
function updateParticles() {
    // Limitar número de partículas para performance
    if (CONFIG.performance.enableParticleLimit && particles.length > CONFIG.game.maxParticles) {
        particles.splice(0, particles.length - CONFIG.game.maxParticles);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Skip culling para partículas de texto (sempre visíveis)
        if (!particle.isText && CONFIG.performance.enableCulling) {
            if (!isObjectVisible(particle, 50)) {
                performanceMonitor.culledObjects++;
                particles.splice(i, 1);
                continue;
            }
        }
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= particle.friction;
        particle.vy *= particle.friction;
        particle.life--;
        particle.alpha = particle.life / particle.maxLife;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ===== ATUALIZAÇÃO DO PARALAXE =====
function updateParallax() {
    parallaxLayers.forEach(layer => {
        layer.stars.forEach(star => {
            // Mover estrelas baseado na velocidade do player
            star.x -= player.vx * layer.speed;
            star.y -= player.vy * layer.speed;
            
            // Wraparound
            if (star.x < 0) star.x = CONFIG.canvas.width;
            if (star.x > CONFIG.canvas.width) star.x = 0;
            if (star.y < 0) star.y = CONFIG.canvas.height;
            if (star.y > CONFIG.canvas.height) star.y = 0;
        });
    });
}

// ===== DETECÇÃO DE COLISÕES AVANÇADA =====
function checkCollisions() {
    // Colisão player vs asteroides
    if (player.invulnerable <= 0) {
        for (let asteroid of asteroids) {
            if (circleCollision(player, asteroid)) {
                // Criar impacto visual
                createImpactEffect(player.x, player.y);
                playerHit();
                break;
            }
        }
    }
    
    // Colisão balas vs asteroides
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        let hitAsteroid = false;
        
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            
            if (pointInCircle(bullet.x, bullet.y, asteroid.x, asteroid.y, asteroid.size * 0.8)) {
                // Criar efeito de impacto no ponto de colisão
                createImpactEffect(bullet.x, bullet.y);
                
                // Aplicar momentum da bala no asteroide
                const force = 0.3;
                asteroid.vx += bullet.vx * force;
                asteroid.vy += bullet.vy * force;
                
                // Remover bala
                bullets.splice(i, 1);
                
                // Destruir asteroide
                destroyAsteroid(j);
                
                hitAsteroid = true;
                break;
            }
        }
        
        if (hitAsteroid) break;
    }
}

// ===== CRIAR EFEITO DE IMPACTO =====
function createImpactEffect(x, y) {
    // Partículas de impacto
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 15 + Math.random() * 10,
            maxLife: 25,
            size: 1 + Math.random() * 2,
            color: '#ff8888',
            friction: 0.94,
            alpha: 1
        });
    }
    
    // Flash branco de impacto
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 5,
        maxLife: 5,
        size: 15,
        color: '#ffffff',
        friction: 1,
        alpha: 0.8
    });
}

// ===== COLISÃO CIRCULAR =====
function circleCollision(obj1, obj2) {
    const dist = distance(obj1.x, obj1.y, obj2.x, obj2.y);
    return dist < (obj1.size + obj2.size);
}

// ===== PONTO DENTRO DO CÍRCULO =====
function pointInCircle(px, py, cx, cy, radius) {
    return distance(px, py, cx, cy) < radius;
}

// ===== PLAYER FOI ATINGIDO =====
function playerHit() {
    lives--;
    player.invulnerable = 120; // 2 segundos de invulnerabilidade
    
    // Tocar som de colisão da nave
    playSound('playerHit');
    
    // Efeitos visuais intensos
    visualEffects.addShake(15);
    visualEffects.addChromatic(8);
    
    // Criar explosão de partículas
    createExplosionParticles(player.x, player.y, '#ff4444');
    
    // Criar ring de explosão
    createShockwave(player.x, player.y);
    
    // Reset posição
    player.x = CONFIG.canvas.width / 2;
    player.y = CONFIG.canvas.height / 2;
    player.vx = 0;
    player.vy = 0;
    
    // Atualizar HUD
    updateHUD();
    
    // Game Over
    if (lives <= 0) {
        gameState = 'gameOver';
        showGameOverMenu();
    }
}

// ===== DESTRUIR ASTEROIDE =====
function destroyAsteroid(index) {
    const asteroid = asteroids[index];
    
    // Tocar som de destruição do asteroide
    playSound('asteroidDestroy');
    
    // Efeitos visuais baseados no tamanho
    const shakeIntensity = [8, 5, 2][asteroid.sizeIndex];
    visualEffects.addShake(shakeIntensity);
    
    // Sistema de pontuação balanceado
    const basePoints = [100, 50, 25][asteroid.sizeIndex];
    const waveMultiplier = Math.min(1 + (wave - 1) * 0.05, 3.0); // Limitado a 3x
    const points = Math.floor(basePoints * waveMultiplier);
    score += points;
    
    // Criar indicador visual de pontos
    createScorePopup(asteroid.x, asteroid.y, points);
    
    // Criar explosão animada (se sprite disponível)
    if (sprites.explosion && sprites.explosion.complete) {
        explosions.push(new AnimatedExplosion(asteroid.x, asteroid.y));
    }
    
    // Criar explosion particles como backup
    createExplosionParticles(asteroid.x, asteroid.y, '#ffffff');
    
    // Criar debris particles
    createDebrisParticles(asteroid.x, asteroid.y, asteroid.size);
    
    // Se for asteroide grande, criar shockwave
    if (asteroid.sizeIndex === 0) {
        createShockwave(asteroid.x, asteroid.y);
    }
    
    // Se não é o menor tamanho, criar asteroides filhos
    if (asteroid.sizeIndex < CONFIG.asteroid.sizes.length - 1) {
        const newSize = asteroid.sizeIndex + 1;
        for (let i = 0; i < 2; i++) {
            // Criar filhos com velocidade herdada + impulso aleatório
            const childAngle = Math.random() * Math.PI * 2;
            const childSpeed = 1 + Math.random() * 2;
            const childX = asteroid.x + Math.cos(childAngle) * 20;
            const childY = asteroid.y + Math.sin(childAngle) * 20;
            
            createAsteroid(newSize, childX, childY);
        }
    }
    
    // Remover asteroide
    asteroids.splice(index, 1);
    
    // Atualizar HUD
    updateHUD();
}

// ===== CRIAR POPUP DE PONTUAÇÃO =====
function createScorePopup(x, y, points) {
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random(), // Subir
        life: 60,
        maxLife: 60,
        size: 1,
        color: '#ffff00',
        friction: 0.98,
        alpha: 1,
        text: `+${points}`,
        isText: true
    });
}

// ===== CRIAR SHOCKWAVE =====
function createShockwave(x, y) {
    particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        life: 30,
        maxLife: 30,
        size: 5,
        color: '#ffffff',
        friction: 1,
        alpha: 0.8,
        isShockwave: true,
        radius: 0,
        maxRadius: 100
    });
}

// ===== CRIAR PARTÍCULAS DE DEBRIS =====
function createDebrisParticles(x, y, asteroidSize) {
    const debrisCount = Math.floor(asteroidSize / 10);
    
    for (let i = 0; i < debrisCount; i++) {
        const angle = (i / debrisCount) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 40 + Math.random() * 20,
            maxLife: 60,
            size: 1 + Math.random() * 3,
            color: '#888888',
            friction: 0.98,
            alpha: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            isDebris: true
        });
    }
}

// ===== WRAPAROUND POSITION =====
function wrapPosition(obj) {
    if (obj.x < -obj.size) obj.x = CONFIG.canvas.width + obj.size;
    if (obj.x > CONFIG.canvas.width + obj.size) obj.x = -obj.size;
    if (obj.y < -obj.size) obj.y = CONFIG.canvas.height + obj.size;
    if (obj.y > CONFIG.canvas.height + obj.size) obj.y = -obj.size;
}

// ===== VERIFICAR CONCLUSÃO DA WAVE =====
function checkWaveCompletion() {
    if (asteroids.length === 0) {
        wave++;
        
        // Mostrar informações de progressão
        const progression = CONFIG.game.progression;
        const isInsaneMode = score >= progression.scoreThresholds.insane;
        
        // Determinar fase atual
        let currentPhase = progression.phases[0];
        let phaseIndex = 0;
        for (let i = 0; i < progression.phases.length; i++) {
            if (wave <= progression.phases[i].maxWave) {
                currentPhase = progression.phases[i];
                phaseIndex = i;
                break;
            }
        }
        
        const phaseNames = ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Expert'];
        
        if (isInsaneMode) {
            console.log(`💀 Wave ${wave}: MODO INSANO - Dificuldade máxima! Score: ${score}`);
        } else if (score >= 8000) {
            console.log(`⚠️ Wave ${wave}: Aproximando do modo insano! Score: ${score}/10000`);
        } else if (wave === progression.speedCapWave) {
            console.log(`🎯 Wave ${wave}: Velocidade máxima atingida! (${phaseNames[phaseIndex]})`);
        } else if (wave % 10 === 0 || wave === currentPhase.maxWave) {
            const speedPercent = Math.min(wave / progression.speedCapWave * 100, 100);
            console.log(`🚀 Wave ${wave} (${phaseNames[phaseIndex]}): Velocidade ${speedPercent.toFixed(0)}% - Score: ${score}`);
        }
        
        setTimeout(() => {
            initAsteroids();
            updateHUD();
        }, 2000);
    }
}

// ===== CRIAÇÃO DE PARTÍCULAS =====
function createThrustParticles() {
    if (particles.length > CONFIG.game.maxParticles) return;
    
    // Parte traseira da nave (oposta ao bico)
    const backX = player.x - Math.cos(player.angle - Math.PI / 2) * player.size;
    const backY = player.y - Math.sin(player.angle - Math.PI / 2) * player.size;
    
    particles.push({
        x: backX + (Math.random() - 0.5) * 8,
        y: backY + (Math.random() - 0.5) * 8,
        vx: -Math.cos(player.angle - Math.PI / 2) * 3 + (Math.random() - 0.5) * 2,
        vy: -Math.sin(player.angle - Math.PI / 2) * 3 + (Math.random() - 0.5) * 2,
        life: 20,
        maxLife: 20,
        size: 2 + Math.random() * 2,
        color: '#ff6600',
        friction: 0.95,
        alpha: 1
    });
}

function createExplosionParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30,
            maxLife: 30,
            size: 3 + Math.random() * 3,
            color: color,
            friction: 0.98,
            alpha: 1
        });
    }
}

function createQuantumParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 40,
            maxLife: 40,
            size: 2 + Math.random() * 2,
            color: '#00ffff',
            friction: 0.97,
            alpha: 1
        });
    }
}

// ===== FUNÇÃO DE DISTÂNCIA =====
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// ===== FUNÇÃO PARA TOCAR SONS =====
function playSound(soundName, volume = 0.3) {
    // Se o áudio não foi inicializado, ignorar silenciosamente
    if (!audioInitialized) return;
    
    // Usar apenas sons sintéticos
    if (sounds[soundName] && sounds[soundName].play) {
        try {
            sounds[soundName].play();
        } catch (e) {
            // Falhar silenciosamente
        }
    }
}

// ===== RENDERIZAÇÃO (OTIMIZADA) =====
function draw() {
    if (gameState === 'playing') {
        renderFrame();
    } else {
        // Estado pausado - apenas redesenhar o que é necessário
        clearCanvas();
        drawParallax();
        drawAsteroids();
        drawBullets();
        drawParticles();
        drawExplosions();
        drawPlayer();
        drawEffects();
    }
}

// ===== DESENHAR PARALAXE AVANÇADO =====
function drawParallax() {
    parallaxLayers.forEach((layer, layerIndex) => {
        layer.stars.forEach(star => {
            if (CONFIG.performance.enableCulling && !isObjectVisible(star, 0)) {
                performanceMonitor.culledObjects++;
                return;
            }
            
            // Atualizar twinkle das estrelas
            if (layer.twinkle) {
                star.alpha = star.baseAlpha + 
                    Math.sin(visualEffects.time * 60 * star.twinkleSpeed + star.twinkleOffset) * 
                    star.baseAlpha * 0.3;
            }
            
            ctx.save();
            ctx.globalAlpha = star.alpha;
            
            if (star.glow) {
                // Estrelas com glow
                const gradient = ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.size * 3
                );
                gradient.addColorStop(0, star.color);
                gradient.addColorStop(0.7, star.color + '80');
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Núcleo da estrela
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            performanceMonitor.drawCalls++;
        });
    });
}

// ===== DESENHAR PLAYER =====
function drawPlayer() {
    // Desenhar trail primeiro
    if (player.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < player.trail.length - 1; i++) {
            const current = player.trail[i];
            const next = player.trail[i + 1];
            
            ctx.save();
            ctx.globalAlpha = current.alpha * 0.5;
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.restore();
        performanceMonitor.drawCalls++;
    }
    
    // Efeito de piscar quando invulnerável
    if (player.invulnerable > 0 && Math.floor(player.invulnerable / 5) % 2) {
        return;
    }
    
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // Usar sempre a imagem ship.png quando disponível
    if (sprites.ship && sprites.ship.complete) {
        // Usar a imagem ship.png diretamente (sem spritesheet)
        const scale = (player.size * 2.5) / sprites.ship.width; // Escalar baseado na largura da imagem
        const drawWidth = sprites.ship.width * scale;
        const drawHeight = sprites.ship.height * scale;
        
        // Desenhar a nave centralizada
        ctx.drawImage(
            sprites.ship,
            -drawWidth / 2, -drawHeight / 2, // Centralizar
            drawWidth, drawHeight
        );
        
        // Se estiver com thrust, adicionar efeito de chama na parte traseira
        if (player.thrusting) {
            const flameLength = player.size * 1.5;
            const flameWidth = player.size * 0.3;
            
            // Chama principal (saindo da traseira da nave)
            ctx.strokeStyle = '#ff6600';
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 8;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, player.size * 1.1); // Traseira da nave
            ctx.lineTo(-flameWidth, flameLength);
            ctx.lineTo(0, flameLength + player.size * 0.5);
            ctx.lineTo(flameWidth, flameLength);
            ctx.closePath();
            ctx.stroke();
            
            // Núcleo da chama
            ctx.strokeStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 4;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, player.size * 1.1);
            ctx.lineTo(-flameWidth * 0.5, flameLength * 0.7);
            ctx.lineTo(0, flameLength * 0.8);
            ctx.lineTo(flameWidth * 0.5, flameLength * 0.7);
            ctx.closePath();
            ctx.stroke();
        }
    } else {
        // Fallback: desenho vetorial melhorado
        // Glow da nave
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.size, 0);
        ctx.lineTo(-player.size, -player.size/2);
        ctx.lineTo(-player.size/2, 0);
        ctx.lineTo(-player.size, player.size/2);
        ctx.closePath();
        ctx.stroke();
        
        // Núcleo brilhante
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#88ffaa';
        ctx.beginPath();
        ctx.arc(player.size * 0.3, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Efeito de thrust vetorial
        if (player.thrusting) {
            const flameLength = player.size * 1.5;
            const flameWidth = player.size * 0.3;
            
            // Chama principal
            ctx.strokeStyle = '#ff6600';
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-player.size, -flameWidth);
            ctx.lineTo(-flameLength, 0);
            ctx.lineTo(-player.size, flameWidth);
            ctx.stroke();
            
            // Núcleo da chama
            ctx.strokeStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 5;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-player.size, -flameWidth * 0.5);
            ctx.lineTo(-flameLength * 0.7, 0);
            ctx.lineTo(-player.size, flameWidth * 0.5);
            ctx.stroke();
        }
    }
    
    ctx.restore();
    performanceMonitor.drawCalls++;
}

// ===== DESENHAR ASTEROIDES =====
function drawAsteroids() {
    asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        
        // Tentar usar sprite do asteroide
        if (sprites.asteroid && sprites.asteroid.complete) {
            const scale = asteroid.size / 50; // Escalar baseado no tamanho
            const drawSize = 50 * scale;
            
            ctx.drawImage(
                sprites.asteroid,
                -drawSize / 2, -drawSize / 2,
                drawSize, drawSize
            );
        } else {
            // Fallback: desenho vetorial com vértices aleatórios
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            asteroid.vertices.forEach((vertex, index) => {
                if (index === 0) {
                    ctx.moveTo(vertex.x, vertex.y);
                } else {
                    ctx.lineTo(vertex.x, vertex.y);
                }
            });
            
            ctx.closePath();
            ctx.stroke();
        }
        
        ctx.restore();
    });
}

// ===== DESENHAR BALAS =====
function drawBullets() {
    bullets.forEach(bullet => {
        // Desenhar rastro da bala
        if (bullet.trail.length > 1) {
            ctx.strokeStyle = '#ffff88';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            
            for (let i = 0; i < bullet.trail.length; i++) {
                const pos = bullet.trail[i];
                const alpha = (i + 1) / bullet.trail.length * 0.5;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                
                if (i === 0) {
                    ctx.moveTo(pos.x, pos.y);
                } else {
                    ctx.lineTo(pos.x, pos.y);
                }
                
                ctx.restore();
            }
            
            ctx.stroke();
        }
        
        // Tentar usar sprite do laser
        if (sprites.laser && sprites.laser.complete) {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            ctx.rotate(bullet.angle);
            
            // Desenhar sprite do laser
            const scale = 0.5;
            ctx.drawImage(
                sprites.laser,
                -sprites.laser.width * scale / 2,
                -sprites.laser.height * scale / 2,
                sprites.laser.width * scale,
                sprites.laser.height * scale
            );
            
            ctx.restore();
        } else {
            // Fallback: círculo brilhante
            ctx.save();
            
            // Gradiente radial para bala brilhante
            const gradient = ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, 6
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#ffff00');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Núcleo sólido
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    });
}

// ===== DESENHAR EXPLOSÕES =====
function drawExplosions() {
    explosions.forEach(explosion => {
        explosion.draw(ctx, sprites.explosion);
    });
}

// ===== DESENHAR PARTÍCULAS =====
function drawParticles() {
    particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        
        if (particle.isText) {
            // Desenhar texto de pontuação
            ctx.fillStyle = particle.color;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 5;
            ctx.fillText(particle.text, particle.x, particle.y);
        } else if (particle.isShockwave) {
            // Desenhar shockwave
            const progress = 1 - (particle.life / particle.maxLife);
            particle.radius = progress * particle.maxRadius;
            
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 3 * particle.alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (particle.isDebris) {
            // Desenhar debris com rotação
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            ctx.fillStyle = particle.color;
            ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            
            // Atualizar rotação
            particle.rotation += particle.rotationSpeed;
        } else {
            // Desenhar partícula normal com glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, particle.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Núcleo sólido
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        performanceMonitor.drawCalls++;
    });
}

// ===== DESENHAR EFEITOS =====
function drawEffects() {
    // Indicador de quantum jump cooldown
    if (player.quantumCooldown > 0) {
        const progress = 1 - (player.quantumCooldown / 180);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(10, CONFIG.canvas.height - 30, 200 * progress, 10);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, CONFIG.canvas.height - 30, 200, 10);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText('QUANTUM DRIVE', 10, CONFIG.canvas.height - 35);
    }
}

// ===== INFORMAÇÕES DE DEBUG =====
function drawDebugInfo() {
    if (!CONFIG.performance.showDebugInfo) return;
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    
    const debugInfo = [
        `FPS: ${performanceMonitor.currentFps}`,
        `Draw Calls: ${performanceMonitor.drawCalls}`,
        `Culled: ${performanceMonitor.culledObjects}`,
        `Entities: ${asteroids.length + bullets.length + particles.length}`,
        `Particles: ${particles.length}/${CONFIG.game.maxParticles}`,
        `Bullets: ${bullets.length}/${CONFIG.game.maxBullets}`
    ];
    
    debugInfo.forEach((line, index) => {
        ctx.fillText(line, CONFIG.canvas.width - 200, 20 + index * 20);
    });
}

// ===== TOGGLE DEBUG INFO =====
function toggleDebugInfo() {
    CONFIG.performance.showDebugInfo = !CONFIG.performance.showDebugInfo;
}

// ===== FUNÇÕES DE INTERFACE =====
function updateHUD() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('livesValue').textContent = lives;
    
    const progression = CONFIG.game.progression;
    const isInsaneMode = score >= progression.scoreThresholds.insane;
    
    // Determinar fase atual
    let currentPhase = progression.phases[0];
    let phaseIndex = 0;
    
    for (let i = 0; i < progression.phases.length; i++) {
        if (wave <= progression.phases[i].maxWave) {
            currentPhase = progression.phases[i];
            phaseIndex = i;
            break;
        }
    }
    
    const phaseNames = ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Expert'];
    
    let waveText = wave.toString();
    if (isInsaneMode) {
        waveText += ' 💀 INSANO';
    } else if (score >= 8000) {
        waveText += ` - ${phaseNames[phaseIndex]} (${10000 - score} para modo insano)`;
    } else if (wave > 3) {
        waveText += ` - ${phaseNames[phaseIndex]}`;
    }
    
    document.getElementById('waveValue').textContent = waveText;
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseMenu').classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseMenu').classList.add('hidden');
    }
}

function showGameOverMenu() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverMenu').classList.remove('hidden');
}

function restartGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    wave = 1;
    bullets = [];
    particles = [];
    
    initPlayer();
    initAsteroids();
    updateHUD();
    
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('pauseMenu').classList.add('hidden');
}

// ===== INICIAR JOGO QUANDO DOM CARREGAR =====
document.addEventListener('DOMContentLoaded', init);