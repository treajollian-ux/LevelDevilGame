// Sound Generator - بديل لملفات الصوت
class SoundGenerator {
    constructor() {
        this.audioContext = null;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    createJumpSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createCollisionSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    createLevelUpSound() {
        if (!this.audioContext) return;
        
        const times = [0, 0.1, 0.2, 0.3];
        const frequencies = [523.25, 659.25, 783.99, 1046.50];
        
        times.forEach((time, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequencies[index], this.audioContext.currentTime + time);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + time + 0.3);
            
            oscillator.start(this.audioContext.currentTime + time);
            oscillator.stop(this.audioContext.currentTime + time + 0.3);
        });
    }

    createBackgroundMusic() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        gainNode.gain.value = 0.1;
        
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        let currentTime = this.audioContext.currentTime;
        
        const playNote = (frequency, duration) => {
            oscillator.frequency.setValueAtTime(frequency, currentTime);
            currentTime += duration;
        };
        
        setInterval(() => {
            currentTime = this.audioContext.currentTime;
            notes.forEach((note, index) => {
                playNote(note, 0.3);
            });
        }, 2400);
        
        oscillator.start();
    }
}

// الفئة الرئيسية للعبة
class LevelDevilGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.screens = {
            start: document.getElementById('startScreen'),
            instructions: document.getElementById('instructionsScreen'),
            game: document.getElementById('gameScreen'),
            gameOver: document.getElementById('gameOverScreen'),
            levelComplete: document.getElementById('levelCompleteScreen')
        };
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // إعدادات اللعبة
        this.gameState = 'menu';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.timeLeft = 60;
        this.gameTime = 0;
        
        // إعدادات اللاعب
        this.player = {
            x: 50,
            y: 300,
            width: 40,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: -15,
            isJumping: false,
            color: '#FF6B6B'
        };
        
        // الفيزياء
        this.gravity = 0.8;
        this.friction = 0.8;
        
        // عناصر اللعبة
        this.platforms = [];
        this.obstacles = [];
        this.goal = null;
        this.collectibles = [];
        
        // الإدخال
        this.keys = {};
        
        // مولد الأصوات البديل
        this.soundGenerator = new SoundGenerator();
        
        // عناصر الصوت البديلة
        this.sounds = {
            background: { play: () => this.soundGenerator.createBackgroundMusic() },
            jump: { play: () => this.soundGenerator.createJumpSound() },
            collision: { play: () => this.soundGenerator.createCollisionSound() },
            levelUp: { play: () => this.soundGenerator.createLevelUpSound() }
        };
    }

    setupEventListeners() {
        // أحداث لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyR' && this.gameState === 'gameOver') {
                this.restartGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // أحداث الأزرار
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('instructionsButton').addEventListener('click', () => this.showInstructions());
        document.getElementById('backButton').addEventListener('click', () => this.showStartScreen());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('menuButton').addEventListener('click', () => this.showStartScreen());
        document.getElementById('nextLevelButton').addEventListener('click', () => this.nextLevel());
        
        // أحداث تحكم الجوال
        document.getElementById('leftBtn').addEventListener('touchstart', () => this.keys['ArrowLeft'] = true);
        document.getElementById('leftBtn').addEventListener('touchend', () => this.keys['ArrowLeft'] = false);
        
        document.getElementById('rightBtn').addEventListener('touchstart', () => this.keys['ArrowRight'] = true);
        document.getElementById('rightBtn').addEventListener('touchend', () => this.keys['ArrowRight'] = false);
        
        document.getElementById('jumpBtn').addEventListener('touchstart', () => {
            this.keys['Space'] = true;
            this.keys['ArrowUp'] = true;
        });
        document.getElementById('jumpBtn').addEventListener('touchend', () => {
            this.keys['Space'] = false;
            this.keys['ArrowUp'] = false;
        });
        
        // منع سلوك اللمس الافتراضي
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => e.preventDefault());
        });
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        this.screens[screenName].classList.remove('hidden');
        
        if (screenName === 'game') {
            this.sounds.background.play();
        }
    }

    showStartScreen() {
        this.showScreen('start');
        this.gameState = 'menu';
    }

    showInstructions() {
        this.showScreen('instructions');
    }

    startGame() {
        this.showScreen('game');
        this.gameState = 'playing';
        this.initializeLevel();
        this.gameLoop();
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.showScreen('gameOver');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        this.sounds.collision.play();
    }

    levelComplete() {
        this.gameState = 'levelComplete';
        this.showScreen('levelComplete');
        document.getElementById('completedLevel').textContent = this.level;
        this.sounds.levelUp.play();
        
        this.score += 100;
        this.updateUI();
    }

    nextLevel() {
        this.level++;
        this.timeLeft = 60;
        this.showScreen('game');
        this.gameState = 'playing';
        this.initializeLevel();
    }

    restartGame() {
        this.initializeGame();
        this.startGame();
    }

    initializeLevel() {
        this.platforms = [];
        this.obstacles = [];
        this.collectibles = [];
        
        this.player.x = 50;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        
        this.createLevelDesign();
        this.updateUI();
    }

    createLevelDesign() {
        const levelDesigns = {
            1: {
                platforms: [
                    { x: 0, y: 400, width: 200, height: 20 },
                    { x: 300, y: 350, width: 200, height: 20 },
                    { x: 600, y: 300, width: 150, height: 20 }
                ],
                obstacles: [
                    { x: 250, y: 380, width: 30, height: 30 },
                    { x: 500, y: 330, width: 30, height: 30 }
                ],
                goal: { x: 700, y: 250, width: 40, height: 40 }
            },
            2: {
                platforms: [
                    { x: 0, y: 400, width: 150, height: 20 },
                    { x: 200, y: 350, width: 100, height: 20 },
                    { x: 350, y: 300, width: 150, height: 20 },
                    { x: 550, y: 250, width: 100, height: 20 }
                ],
                obstacles: [
                    { x: 180, y: 330, width: 30, height: 30 },
                    { x: 500, y: 230, width: 30, height: 30 },
                    { x: 320, y: 280, width: 30, height: 30 }
                ],
                goal: { x: 650, y: 200, width: 40, height: 40 }
            },
            3: {
                platforms: [
                    { x: 0, y: 400, width: 100, height: 20 },
                    { x: 150, y: 350, width: 80, height: 20 },
                    { x: 280, y: 300, width: 70, height: 20 },
                    { x: 400, y: 250, width: 80, height: 20 },
                    { x: 530, y: 200, width: 70, height: 20 }
                ],
                obstacles: [
                    { x: 130, y: 330, width: 25, height: 25 },
                    { x: 260, y: 280, width: 25, height: 25 },
                    { x: 380, y: 230, width: 25, height: 25 },
                    { x: 510, y: 180, width: 25, height: 25 }
                ],
                goal: { x: 650, y: 150, width: 40, height: 40 }
            }
        };
        
        const design = levelDesigns[this.level] || levelDesigns[1];
        
        design.platforms.forEach(plat => {
            this.platforms.push({
                x: plat.x,
                y: plat.y,
                width: plat.width,
                height: plat.height,
                color: '#8B4513'
            });
        });
        
        design.obstacles.forEach(obs => {
            this.obstacles.push({
                x: obs.x,
                y: obs.y,
                width: obs.width,
                height: obs.height,
                color: '#FF0000'
            });
        });
        
        this.goal = {
            x: design.goal.x,
            y: design.goal.y,
            width: design.goal.width,
            height: design.goal.height,
            color: '#00FF00'
        };
    }

    handleInput() {
        this.player.velocityX = 0;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.velocityX = -this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.velocityX = this.player.speed;
        }
        
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && !this.player.isJumping) {
            this.player.velocityY = this.player.jumpPower;
            this.player.isJumping = true;
            this.sounds.jump.play();
        }
    }

    updatePhysics() {
        this.player.velocityY += this.gravity;
        
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        this.player.velocityX *= this.friction;
        
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        if (this.player.y > this.canvas.height - this.player.height) {
            this.player.y = this.canvas.height - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
        
        this.handlePlatformCollisions();
        this.handleObstacleCollisions();
        this.handleGoalCollision();
    }

    handlePlatformCollisions() {
        this.player.isJumping = true;
        
        for (let platform of this.platforms) {
            if (this.isColliding(this.player, platform)) {
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                }
                else if (this.player.velocityY < 0 && this.player.y - this.player.velocityY >= platform.y + platform.height) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
                else if (this.player.velocityX !== 0) {
                    if (this.player.x + this.player.width - this.player.velocityX <= platform.x) {
                        this.player.x = platform.x - this.player.width;
                    } else if (this.player.x - this.player.velocityX >= platform.x + platform.width) {
                        this.player.x = platform.x + platform.width;
                    }
                }
            }
        }
    }

    handleObstacleCollisions() {
        for (let obstacle of this.obstacles) {
            if (this.isColliding(this.player, obstacle)) {
                this.loseLife();
                break;
            }
        }
    }

    handleGoalCollision() {
        if (this.goal && this.isColliding(this.player, this.goal)) {
            this.levelComplete();
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    loseLife() {
        this.lives--;
        this.updateUI();
        this.sounds.collision.play();
        
        this.player.x = 50;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    updateUI() {
        document.getElementById('levelDisplay').textContent = this.level;
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('timeDisplay').textContent = this.timeLeft;
        
        let livesText = '';
        for (let i = 0; i < 3; i++) {
            livesText += i < this.lives ? '❤️' : '♡';
        }
        document.getElementById('livesDisplay').textContent = livesText;
    }

    updateTimer() {
        if (this.gameState === 'playing') {
            this.gameTime += 1/60;
            
            if (this.gameTime >= 1) {
                this.gameTime = 0;
                this.timeLeft--;
                
                if (this.timeLeft <= 0) {
                    this.loseLife();
                    this.timeLeft = 60;
                }
                
                this.updateUI();
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        
        this.platforms.forEach(platform => {
            this.drawPlatform(platform);
        });
        
        this.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
        
        if (this.goal) {
            this.drawGoal(this.goal);
        }
        
        this.drawPlayer();
        this.drawEffects();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(100, 80, 40, 0, Math.PI * 2);
        this.ctx.arc(150, 70, 30, 0, Math.PI * 2);
        this.ctx.arc(200, 90, 35, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPlayer() {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 10, 8, 8);
        this.ctx.fillRect(this.player.x + 24, this.player.y + 10, 8, 8);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.player.x + 10, this.player.y + 12, 4, 4);
        this.ctx.fillRect(this.player.x + 26, this.player.y + 12, 4, 4);
        
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + 20, this.player.y + 25, 6, 0, Math.PI);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawPlatform(platform) {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 3;
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        this.ctx.fillStyle = '#A0522D';
        for (let i = 0; i < platform.width; i += 10) {
            this.ctx.fillRect(platform.x + i, platform.y, 5, platform.height);
        }
        
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
        
        this.ctx.restore();
    }

    drawObstacle(obstacle) {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 3;
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        this.ctx.fillStyle = '#8B0000';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
        this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width/2 - 2, 5);
        
        this.ctx.restore();
    }

    drawGoal(goal) {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.arc(
            goal.x + goal.width/2,
            goal.y + goal.height/2,
            goal.width/2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
        this.ctx.beginPath();
        this.ctx.arc(
            goal.x + goal.width/2,
            goal.y + goal.height/2,
            goal.width/3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawEffects() {
        if (this.gameState === 'playing' && this.timeLeft <= 10) {
            this.ctx.save();
            this.ctx.globalAlpha = Math.sin(Date.now() / 200) * 0.5 + 0.5;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }

    gameLoop() {
        if (this.gameState === 'playing') {
            this.handleInput();
            this.updatePhysics();
            this.updateTimer();
            this.render();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// بدء اللعبة عندما يتم تحميل الصفحة
window.addEventListener('load', () => {
    new LevelDevilGame();
});

// منع سلوك السحب الافتراضي على الجوال
document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('control-btn')) {
        e.preventDefault();
    }
}, { passive: false });
