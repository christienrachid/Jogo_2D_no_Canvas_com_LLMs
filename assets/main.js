/* ============================================
   MAIN.JS - Lógica principal do jogo (OTIMIZADO)
   ============================================ */

// ============================================
// CONFIGURAÇÃO INICIAL DO CANVAS
// ============================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ============================================
// SISTEMA DE CONTROLE DE TECLADO
// ============================================
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ============================================
// SISTEMA DE ANIMAÇÃO DE SPRITES
// ============================================
class Animation {
    constructor(spriteX, spriteY, frameWidth, frameHeight, frameCount, frameDuration) {
        this.spriteX = spriteX;
        this.spriteY = spriteY;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.frameDuration = frameDuration;
        this.currentFrame = 0;
        this.elapsedTime = 0;
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= this.frameDuration) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.elapsedTime = 0;
        }
    }

    reset() {
        this.currentFrame = 0;
        this.elapsedTime = 0;
    }
}

// ============================================
// SPATIAL GRID PARA OTIMIZAÇÃO DE COLISÕES
// ============================================
class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    insert(entity) {
        const keys = this.getCellKeys(entity);
        keys.forEach(key => {
            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key).push(entity);
        });
    }

    getCellKeys(entity) {
        const keys = [];
        const minX = Math.floor(entity.x / this.cellSize);
        const maxX = Math.floor((entity.x + entity.width) / this.cellSize);
        const minY = Math.floor(entity.y / this.cellSize);
        const maxY = Math.floor((entity.y + entity.height) / this.cellSize);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                keys.push(`${x},${y}`);
            }
        }
        return keys;
    }

    getNearby(entity) {
        const nearby = new Set();
        const keys = this.getCellKeys(entity);
        
        keys.forEach(key => {
            const entities = this.grid.get(key);
            if (entities) {
                entities.forEach(e => nearby.add(e));
            }
        });
        
        return Array.from(nearby);
    }

    clear() {
        this.grid.clear();
    }
}

// ============================================
// OBJECT POOL PARA RECICLAGEM DE OBJETOS
// ============================================
class ObjectPool {
    constructor(ClassType, initialSize = 50, maxSize = 200) {
        this.ClassType = ClassType;
        this.pool = [];
        this.active = [];
        this.maxSize = maxSize;
        
        // Pre-aloca objetos
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new ClassType(0, 0));
        }
    }

    spawn(...args) {
        let obj;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop();
            obj.reset(...args);
        } else if (this.active.length < this.maxSize) {
            obj = new this.ClassType(...args);
        } else {
            return null; // Pool cheio
        }
        
        this.active.push(obj);
        return obj;
    }

    update(deltaTime) {
        for (let i = 0; i < this.active.length; i++) {
            this.active[i].update(deltaTime);
        }
    }

    recycle() {
        for (let i = this.active.length - 1; i >= 0; i--) {
            if (!this.active[i].active) {
                const obj = this.active.splice(i, 1)[0];
                this.pool.push(obj);
            }
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.active.length; i++) {
            if (this.active[i].isOnScreen()) {
                this.active[i].draw(ctx);
            }
        }
    }

    clear() {
        while (this.active.length > 0) {
            this.pool.push(this.active.pop());
        }
    }

    getActive() {
        return this.active;
    }
}

// ============================================
// SISTEMA DE CENÁRIO COM PARALAXE
// ============================================
class ParallaxLayer {
    constructor(color, speed, yOffset = 0) {
        this.color = color;
        this.speed = speed;
        this.x = 0;
        this.yOffset = yOffset;
    }

    update(deltaTime) {
        this.x -= this.speed * deltaTime * 20;
        
        if (this.x <= -CANVAS_WIDTH) {
            this.x = 0;
        }
    }

    draw(ctx) {
        this.drawLayer(ctx, this.x);
        this.drawLayer(ctx, this.x + CANVAS_WIDTH);
    }

    drawLayer(ctx, offsetX) {
        // Implementado nas subclasses
    }
}

class MountainLayer extends ParallaxLayer {
    drawLayer(ctx, offsetX) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(offsetX, CANVAS_HEIGHT);
        ctx.lineTo(offsetX + 200, CANVAS_HEIGHT - 150);
        ctx.lineTo(offsetX + 400, CANVAS_HEIGHT - 100);
        ctx.lineTo(offsetX + 600, CANVAS_HEIGHT - 180);
        ctx.lineTo(offsetX + CANVAS_WIDTH, CANVAS_HEIGHT - 120);
        ctx.lineTo(offsetX + CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
    }
}

class TreeLayer extends ParallaxLayer {
    drawLayer(ctx, offsetX) {
        ctx.fillStyle = this.color;
        
        for (let i = 0; i < 6; i++) {
            const x = offsetX + i * 150 + 50;
            const y = CANVAS_HEIGHT - 80;
            
            ctx.fillRect(x - 10, y, 20, 60);
            
            ctx.beginPath();
            ctx.moveTo(x, y - 40);
            ctx.lineTo(x - 30, y + 20);
            ctx.lineTo(x + 30, y + 20);
            ctx.closePath();
            ctx.fill();
        }
    }
}

class GroundLayer extends ParallaxLayer {
    drawLayer(ctx, offsetX) {
        ctx.fillStyle = this.color;
        ctx.fillRect(offsetX, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
        
        ctx.fillStyle = '#2d5016';
        for (let i = 0; i < 40; i++) {
            const x = offsetX + i * 20 + 5;
            const y = CANVAS_HEIGHT - 60;
            ctx.fillRect(x, y, 3, 10);
            ctx.fillRect(x + 7, y, 3, 8);
        }
    }
}

const parallaxLayers = [
    new MountainLayer('#4a5f3a', 0.2),
    new TreeLayer('#2d4a1f', 0.5),
    new GroundLayer('#3a5a2a', 0.8)
];

// ============================================
// ESTRUTURA DE ENTIDADES BASE
// ============================================
class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width || 32;
        this.height = height || 32;
        this.color = color || '#fff';
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        
        // Cache de bounds para reduzir alocações
        this._bounds = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Atualiza bounds cacheado
        this._bounds.left = this.x;
        this._bounds.right = this.x + this.width;
        this._bounds.top = this.y;
        this._bounds.bottom = this.y + this.height;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    getBounds() {
        return this._bounds;
    }

    // Culling: verifica se está visível na tela
    isOnScreen(margin = 50) {
        return (
            this.x + this.width >= -margin &&
            this.x <= CANVAS_WIDTH + margin &&
            this.y + this.height >= -margin &&
            this.y <= CANVAS_HEIGHT + margin
        );
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
    }
}

// ============================================
// CLASSE DO JOGADOR
// ============================================
// ============================================
// CLASSE DO JOGADOR COM GRAVIDADE E PULO
// ============================================
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 50, '#8b4513');
        this.hp = 100;
        this.maxHp = 100;
        this.fireRate = 0.5;
        this.lastFireTime = 0;
        this.damageMultiplier = 1;
        this.multiShot = 1;
        this.facingRight = true;

        // Gravidade e pulo
        this.vx = 0;
        this.vy = 0;
        this.speed = 200;
        this.jumpForce = 600;
        this.gravity = 1500;
        this.onGround = false;

        // Cache de configurações para evitar alocações
        this.healthBarConfig = {
            width: 40,
            height: 5,
            yOffset: -10
        };
        
        this.cachedDirection = { x: 1, y: 0 };
        
        this.idleAnimation = new Animation(0, 0, 32, 32, 4, 0.2);
        this.shootAnimation = new Animation(128, 0, 32, 32, 4, 0.1);
        this.currentAnimation = this.idleAnimation;
        this.isShooting = false;
        this.shootAnimationTimer = 0;
    }

    update(deltaTime, currentTime) {
        // ------------------------------
        // MOVIMENTO HORIZONTAL
        // ------------------------------
        this.vx = 0;
        if (keys['a'] || keys['arrowleft']) {
            this.vx = -this.speed;
            this.facingRight = false;
        }
        if (keys['d'] || keys['arrowright']) {
            this.vx = this.speed;
            this.facingRight = true;
        }

        // ------------------------------
        // PULO
        // ------------------------------
        if ((keys['w'] || keys['arrowup']) && this.onGround) {
            this.vy = -this.jumpForce;
            this.onGround = false;
        }

        // ------------------------------
        // APLICAR GRAVIDADE
        // ------------------------------
        this.vy += this.gravity * deltaTime;

        // ------------------------------
        // ATUALIZAR POSIÇÃO
        // ------------------------------
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // ------------------------------
        // DETECÇÃO DE CHÃO
        // ------------------------------
        const groundY = CANVAS_HEIGHT - 60 - this.height; // altura do chão
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.onGround = true;
        }

        // Limites laterais
        this.x = Math.max(0, Math.min(CANVAS_WIDTH - this.width, this.x));

        // ------------------------------
        // ANIMAÇÕES
        // ------------------------------
        if (this.isShooting) {
            this.shootAnimationTimer -= deltaTime;
            if (this.shootAnimationTimer <= 0) {
                this.isShooting = false;
                this.currentAnimation = this.idleAnimation;
            }
        }
        this.currentAnimation.update(deltaTime);

        // Atualiza bounds
        this._bounds.left = this.x;
        this._bounds.right = this.x + this.width;
        this._bounds.top = this.y;
        this._bounds.bottom = this.y + this.height;
    }

    draw(ctx) {
        this.drawFallback(ctx);
        this.drawHealthBar(ctx);
    }

    drawFallback(ctx) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x + 10, this.y + 20, 20, 30);
        
        ctx.fillStyle = '#d2a679';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const arcX = this.facingRight ? this.x + 35 : this.x + 5;
        ctx.arc(arcX, this.y + 25, 15, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
    }

    drawHealthBar(ctx) {
        const cfg = this.healthBarConfig;
        const barX = this.x;
        const barY = this.y + cfg.yOffset;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, cfg.width, cfg.height);
        
        ctx.fillStyle = '#00ff00';
        const currentBarWidth = (this.hp / this.maxHp) * cfg.width;
        ctx.fillRect(barX, barY, currentBarWidth, cfg.height);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, cfg.width, cfg.height);
    }

    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    calculateDirection(targetX, targetY) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.cachedDirection.x = dx / distance;
        this.cachedDirection.y = dy / distance;
        
        return {
            centerX,
            centerY,
            dirX: this.cachedDirection.x,
            dirY: this.cachedDirection.y
        };
    }

    fire(currentTime, targetX, targetY, arrowPool) {
        if (!this.canFire(currentTime)) return;
        
        this.lastFireTime = currentTime;
        this.isShooting = true;
        this.shootAnimationTimer = 0.3;
        this.currentAnimation = this.shootAnimation;
        this.shootAnimation.reset();
        
        const dir = this.calculateDirection(targetX, targetY);
        
        if (this.multiShot === 1) {
            arrowPool.spawn(dir.centerX, dir.centerY, dir.dirX, dir.dirY, this.damageMultiplier);
        } else {
            const spreadAngle = 0.3;
            const baseAngle = Math.atan2(dir.dirY, dir.dirX);
            
            for (let i = 0; i < this.multiShot; i++) {
                const offset = (i - (this.multiShot - 1) / 2) * (spreadAngle / this.multiShot);
                const angle = baseAngle + offset;
                const newDirX = Math.cos(angle);
                const newDirY = Math.sin(angle);
                arrowPool.spawn(dir.centerX, dir.centerY, newDirX, newDirY, this.damageMultiplier);
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.active = false;
        }
    }
}


// ============================================
// CLASSE DAS BALAS/FLECHAS (COM RESET)
// ============================================
class Arrow extends Entity {
    constructor(x, y, dirX = 1, dirY = 0, damageMultiplier = 1) {
        super(x, y, 15, 3, '#654321');
        this.speed = 500;
        this.damage = 25;
        this.angle = 0;
        
        if (dirX !== undefined) {
            this.reset(x, y, dirX, dirY, damageMultiplier);
        }
    }

    reset(x, y, dirX, dirY, damageMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.vx = dirX * this.speed;
        this.vy = dirY * this.speed;
        this.damage = 25 * damageMultiplier;
        this.angle = Math.atan2(dirY, dirX);
        this.active = true;
        
        this.color = damageMultiplier > 1 ? '#ff4444' : '#654321';
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.x < -100 || this.x > CANVAS_WIDTH + 100 ||
            this.y < -100 || this.y > CANVAS_HEIGHT + 100) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(0, -3);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(-7, -1.5, 15, 3);
        
        ctx.fillStyle = '#d00';
        ctx.fillRect(-7, -2, 3, 1);
        ctx.fillRect(-7, 1, 3, 1);
        
        ctx.restore();
    }
}

// ============================================
// CLASSE DOS INIMIGOS (COM RESET)
// ============================================
class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 35, 35, '#4a0e0e');
        this.hp = 50;
        this.maxHp = 50;
        this.speed = 50;
        this.damage = 10;
        this.vx = -this.speed;
        
        this.walkAnimation = new Animation(0, 64, 32, 32, 4, 0.15);
        this.currentAnimation = this.walkAnimation;
    }

    reset(x, y) {
        super.reset(x, y);
        this.hp = this.maxHp;
        this.vx = -this.speed;
    }

    update(deltaTime, player) {
        super.update(deltaTime);
        this.currentAnimation.update(deltaTime);
        
        if (this.x < -this.width) {
            this.active = false;
            if (player && player.active) {
                player.takeDamage(15);
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        if (!this.active) return;
        this.drawFallback(ctx);
        this.drawHealthBar(ctx);
    }

    drawFallback(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 5, this.y + 15, 25, 20);
        
        ctx.fillStyle = '#6a1e1e';
        ctx.beginPath();
        ctx.arc(this.x + 17, this.y + 12, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(this.x + 14, this.y + 10, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 20, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHealthBar(ctx) {
        const barWidth = 35;
        const barHeight = 4;
        const barX = this.x;
        const barY = this.y - 8;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#00ff00';
        const currentBarWidth = (this.hp / this.maxHp) * barWidth;
        ctx.fillRect(barX, barY, currentBarWidth, barHeight);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.active = false;
        }
    }
}

// ============================================
// CLASSE DE POWER-UPS (COM RESET)
// ============================================
class PowerUp extends Entity {
    constructor(x, y, type = 'health') {
        super(x, y, 30, 30, '#ffd700');
        this.type = type;
        this.vy = 50;
        this.icon = '+';
        
        if (type) {
            this.setType(type);
        }
    }

    setType(type) {
        this.type = type;
        switch(type) {
            case 'health':
                this.color = '#00ff00';
                this.icon = '+';
                break;
            case 'damage':
                this.color = '#ff4444';
                this.icon = '⚡';
                break;
            case 'speed':
                this.color = '#4444ff';
                this.icon = '»';
                break;
            case 'multishot':
                this.color = '#ff00ff';
                this.icon = '×3';
                break;
        }
    }

    reset(x, y, type) {
        super.reset(x, y);
        this.vy = 50;
        this.setType(type);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.y > CANVAS_HEIGHT) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 * pulse;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x + this.width / 2, this.y + this.height / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    applyEffect(player) {
        switch(this.type) {
            case 'health':
                player.hp = Math.min(player.maxHp, player.hp + 30);
                return '+30 HP';
            case 'damage':
                player.damageMultiplier = Math.min(3, player.damageMultiplier + 0.5);
                return `Dano x${player.damageMultiplier.toFixed(1)}`;
            case 'speed':
                player.fireRate = Math.max(0.1, player.fireRate - 0.1);
                return 'Disparo +Rápido';
            case 'multishot':
                player.multiShot = Math.min(5, player.multiShot + 1);
                return `${player.multiShot} Flechas`;
        }
    }
}

// ============================================
// SISTEMA DE COLISÃO AABB OTIMIZADO
// ============================================
function checkCollision(entityA, entityB) {
    if (!entityA.active || !entityB.active) return false;
    
    const a = entityA.getBounds();
    const b = entityB.getBounds();
    
    return (
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top
    );
}

// ============================================
// ESTADO DO JOGO COM OBJECT POOLS
// ============================================
const gameState = {
    player: new Player(100, CANVAS_HEIGHT - 150),
    
    // Object Pools para reciclagem
    arrowPool: new ObjectPool(Arrow, 50, 200),
    enemyPool: new ObjectPool(Enemy, 20, 100),
    powerUpPool: new ObjectPool(PowerUp, 10, 50),
    
    // Spatial Grid para colisões
    spatialGrid: new SpatialGrid(100),
    
    score: 0,
    enemiesKilled: 0,
    enemiesPassed: 0,
    lastEnemySpawn: 0,
    enemySpawnRate: 2,
    lastPowerUpSpawn: 0,
    powerUpSpawnRate: 10,
    isGameOver: false,
    notifications: []
};

// ============================================
// FUNÇÕES DE SPAWN OTIMIZADAS
// ============================================
function spawnEnemy(currentTime) {
    if (currentTime - gameState.lastEnemySpawn >= gameState.enemySpawnRate) {
        gameState.lastEnemySpawn = currentTime;
        const y = Math.random() * (CANVAS_HEIGHT - 150) + 50;
        gameState.enemyPool.spawn(CANVAS_WIDTH, y);
    }
}

function spawnPowerUp(currentTime) {
    if (currentTime - gameState.lastPowerUpSpawn >= gameState.powerUpSpawnRate) {
        gameState.lastPowerUpSpawn = currentTime;
        
        const types = ['health', 'damage', 'speed', 'multishot'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (CANVAS_WIDTH - 50) + 25;
        
        gameState.powerUpPool.spawn(x, -30, randomType);
    }
}

function addNotification(text) {
    gameState.notifications.push({
        text: text,
        time: performance.now() / 1000,
        duration: 2
    });
}

// ============================================
// INPUT: Separado da lógica de update
// ============================================
const inputState = {
    spacePressed: false,
    mouseClicked: false,
    mouseX: 0,
    mouseY: 0
};

window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !gameState.isGameOver) {
        e.preventDefault();
        inputState.spacePressed = true;
    }
});

canvas.addEventListener('click', (e) => {
    if (gameState.isGameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    inputState.mouseX = e.clientX - rect.left;
    inputState.mouseY = e.clientY - rect.top;
    inputState.mouseClicked = true;
});

// ============================================
// PROCESSAMENTO DE INPUT
// ============================================
function processInput(currentTime) {
    // Tiro com espaço (auto-mira)
    if (inputState.spacePressed) {
        inputState.spacePressed = false;
        
        let targetX = CANVAS_WIDTH;
        let targetY = CANVAS_HEIGHT / 2;
        
        const enemies = gameState.enemyPool.getActive();
        if (enemies.length > 0) {
            let closestEnemy = enemies[0];
            let minDistance = Infinity;
            
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                const dx = enemy.x - gameState.player.x;
                const dy = enemy.y - gameState.player.y;
                const distance = dx * dx + dy * dy; // Evita sqrt
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEnemy = enemy;
                }
            }
            
            targetX = closestEnemy.x + closestEnemy.width / 2;
            targetY = closestEnemy.y + closestEnemy.height / 2;
        }
        
        gameState.player.fire(currentTime, targetX, targetY, gameState.arrowPool);
    }
    
    // Tiro com mouse
    if (inputState.mouseClicked) {
        inputState.mouseClicked = false;
        gameState.player.fire(currentTime, inputState.mouseX, inputState.mouseY, gameState.arrowPool);
    }
}

// ============================================
// ATUALIZAÇÃO DE FÍSICA
// ============================================
function updatePhysics(deltaTime, currentTime) {
    // Atualizar paralaxe
    for (let i = 0; i < parallaxLayers.length; i++) {
        parallaxLayers[i].update(deltaTime);
    }
    
    // Atualizar player
    gameState.player.update(deltaTime, currentTime);
    
    // Atualizar pools
    gameState.arrowPool.update(deltaTime);
    gameState.powerUpPool.update(deltaTime);
    
    // Atualizar inimigos
    const enemies = gameState.enemyPool.getActive();
    for (let i = 0; i < enemies.length; i++) {
        const passed = enemies[i].update(deltaTime, gameState.player);
        if (passed) {
            gameState.enemiesPassed++;
            gameState.score = Math.max(0, gameState.score - 50);
            addNotification('Inimigo passou! -50 pts');
        }
    }
}

// ============================================
// DETECÇÃO DE COLISÕES COM SPATIAL GRID
// ============================================
function detectCollisions() {
    const spatialGrid = gameState.spatialGrid;
    spatialGrid.clear();
    
    // Obter arrays de entidades ativas
    const arrows = gameState.arrowPool.getActive();
    const enemies = gameState.enemyPool.getActive();
    const powerUps = gameState.powerUpPool.getActive();
    
    // Inserir entidades no grid
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].active) {
            spatialGrid.insert(enemies[i]);
        }
    }
    
    for (let i = 0; i < powerUps.length; i++) {
        if (powerUps[i].active) {
            spatialGrid.insert(powerUps[i]);
        }
    }
    
    // COLISÃO: Flechas vs Inimigos (usando spatial grid)
    for (let i = 0; i < arrows.length; i++) {
        const arrow = arrows[i];
        if (!arrow.active) continue;
        
        const nearbyEntities = spatialGrid.getNearby(arrow);
        for (let j = 0; j < nearbyEntities.length; j++) {
            const entity = nearbyEntities[j];
            
            // Verifica se é um inimigo
            if (entity instanceof Enemy && checkCollision(arrow, entity)) {
                entity.takeDamage(arrow.damage);
                arrow.active = false;
                
                if (entity.hp <= 0) {
                    gameState.score += 100;
                    gameState.enemiesKilled++;
                    
                    // 15% chance de dropar power-up
                    if (Math.random() < 0.15) {
                        const types = ['health', 'damage', 'speed', 'multishot'];
                        const randomType = types[Math.floor(Math.random() * types.length)];
                        gameState.powerUpPool.spawn(
                            entity.x + entity.width / 2, 
                            entity.y, 
                            randomType
                        );
                    }
                }
                break;
            }
        }
    }
    
    // COLISÃO: Jogador vs Entidades próximas (usando spatial grid)
    const nearbyPlayer = spatialGrid.getNearby(gameState.player);
    
    for (let i = 0; i < nearbyPlayer.length; i++) {
        const entity = nearbyPlayer[i];
        if (!entity.active) continue;
        
        // Colisão: Player vs Inimigos
        if (entity instanceof Enemy && checkCollision(entity, gameState.player)) {
            gameState.player.takeDamage(entity.damage);
            entity.active = false;
            addNotification('Tocou no inimigo!');
        }
        
        // Colisão: Player vs Power-ups
        if (entity instanceof PowerUp && checkCollision(entity, gameState.player)) {
            const message = entity.applyEffect(gameState.player);
            addNotification(message);
            entity.active = false;
            gameState.score += 50;
        }
    }
}

// ============================================
// ATUALIZAÇÃO DO ESTADO DO JOGO
// ============================================
function updateGameState(currentTime) {
    // Spawn de entidades
    spawnEnemy(currentTime);
    spawnPowerUp(currentTime);
    
    // Limpar notificações antigas (loop reverso para evitar problemas)
    for (let i = gameState.notifications.length - 1; i >= 0; i--) {
        if (currentTime - gameState.notifications[i].time >= gameState.notifications[i].duration) {
            gameState.notifications.splice(i, 1);
        }
    }
    
    // Verificar game over
    if (gameState.player.hp <= 0) {
        gameState.isGameOver = true;
    }
}

// ============================================
// LIMPEZA DE ENTIDADES INATIVAS
// ============================================
function cleanupEntities() {
    // Reciclar objetos inativos de volta para os pools
    gameState.arrowPool.recycle();
    gameState.enemyPool.recycle();
    gameState.powerUpPool.recycle();
}

// ============================================
// FUNÇÃO UPDATE() - Lógica separada em fases
// ============================================
function update(deltaTime, currentTime) {
    if (gameState.isGameOver) return;
    
    // FASE 1: Processar Input
    processInput(currentTime);
    
    // FASE 2: Atualizar Física
    updatePhysics(deltaTime, currentTime);
    
    // FASE 3: Detectar Colisões
    detectCollisions();
    
    // FASE 4: Atualizar Estado do Jogo
    updateGameState(currentTime);
    
    // FASE 5: Limpar Entidades Inativas
    cleanupEntities();
}

// ============================================
// FUNÇÃO DRAW() - Apenas renderização
// ============================================
function draw() {
    // Limpar tela
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Desenhar camadas de paralaxe
    for (let i = 0; i < parallaxLayers.length; i++) {
        parallaxLayers[i].draw(ctx);
    }
    
    // Desenhar entidades com culling automático
    gameState.powerUpPool.draw(ctx);
    gameState.arrowPool.draw(ctx);
    gameState.enemyPool.draw(ctx);
    gameState.player.draw(ctx);
    
    // Desenhar interface
    drawHUD();
    drawNotifications(performance.now() / 1000);
    
    // Desenhar tela de game over
    if (gameState.isGameOver) {
        drawGameOver();
    }
}

// ============================================
// INTERFACE (HUD)
// ============================================
function drawHUD() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 60);
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, 25);
    ctx.fillText(`Kills: ${gameState.enemiesKilled}`, 150, 25);
    ctx.fillText(`Passou: ${gameState.enemiesPassed}`, 270, 25);
    ctx.fillText(`HP: ${gameState.player.hp}/${gameState.player.maxHp}`, 420, 25);
    
    ctx.font = '14px Arial';
    let upgradeText = '';
    if (gameState.player.damageMultiplier > 1) {
        upgradeText += `DMG x${gameState.player.damageMultiplier.toFixed(1)} `;
    }
    if (gameState.player.multiShot > 1) {
        upgradeText += `${gameState.player.multiShot}x Flechas `;
    }
    if (gameState.player.fireRate < 0.5) {
        upgradeText += `⚡Rápido `;
    }
    
    if (upgradeText) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText(upgradeText, 10, 50);
    }
    
    ctx.fillStyle = '#fff';
    ctx.fillText('ESPAÇO = Atirar (auto-mira) | WASD = Mover', 420, 50);
}

// ============================================
// SISTEMA DE NOTIFICAÇÕES OTIMIZADO
// ============================================
function drawNotifications(currentTime) {
    const notifications = gameState.notifications;
    
    for (let i = 0; i < notifications.length; i++) {
        const notif = notifications[i];
        const age = currentTime - notif.time;
        const alpha = Math.max(0, 1 - (age / notif.duration));
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const y = 100 + i * 30;
        const x = CANVAS_WIDTH / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 18px Arial';
        const textWidth = ctx.measureText(notif.text).width;
        ctx.fillRect(x - textWidth / 2 - 10, y - 20, textWidth + 20, 30);
        
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(notif.text, x, y);
        
        ctx.restore();
    }
    
    ctx.textAlign = 'left';
}

// ============================================
// TELA DE GAME OVER
// ============================================
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score Final: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.fillText(`Inimigos Mortos: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText(`Inimigos Passaram: ${gameState.enemiesPassed}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#ffd700';
    let statsY = CANVAS_HEIGHT / 2 + 100;
    
    if (gameState.player.damageMultiplier > 1) {
        ctx.fillText(`Dano Final: x${gameState.player.damageMultiplier.toFixed(1)}`, CANVAS_WIDTH / 2, statsY);
        statsY += 25;
    }
    if (gameState.player.multiShot > 1) {
        ctx.fillText(`Multi-disparo: ${gameState.player.multiShot} flechas`, CANVAS_WIDTH / 2, statsY);
        statsY += 25;
    }
    
    ctx.fillStyle = '#aaa';
    ctx.font = '18px Arial';
    ctx.fillText('Pressione F5 para reiniciar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 160);
    
    ctx.textAlign = 'left';
}

// ============================================
// LOOP DE ANIMAÇÃO OTIMIZADO
// ============================================
let lastTime = 0;

function gameLoop(currentTime) {
    currentTime = currentTime / 1000;
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Atualizar lógica
    update(deltaTime, currentTime);
    
    // Renderizar
    draw();
    
    // Próximo frame
    requestAnimationFrame(gameLoop);
}

// ============================================
// INICIAR O JOGO
// ============================================
requestAnimationFrame(gameLoop);