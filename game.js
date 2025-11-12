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
            achievements: document.getElementById('achievementsScreen'),
            settings: document.getElementById('settingsScreen'),
            game: document.getElementById('gameScreen'),
            pause: document.getElementById('pauseScreen'),
            gameOver: document.getElementById('gameOverScreen'),
            levelComplete: document.getElementById('levelCompleteScreen'),
            exit: document.getElementById('exitScreen')
        };
        
        this.settings = {
            musicVolume: 50,
            soundVolume: 70,
            language: 'ar',
            theme: 'default'
        };
        
        this.initializeGame();
        this.setupEventListeners();
        this.loadSettings();
    }

    initializeGame() {
        // إعدادات اللعبة
        this.gameState = 'menu';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.timeLeft = 60;
        this.gameTime = 0;
        this.isPaused = false;
        
        // إعدادات اللاعب
        this.player = {
            x: 50,
            y: 200,
            width: 40,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            speed: 6,
            jumpPower: -12,
            isJumping: false,
            color: '#FF6B6B'
        };
        
        // الفيزياء
        this.gravity = 0.5;
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
            
            if (e.code === 'Escape' && this.gameState === 'playing') {
                this.pauseGame();
            }
            
            if (e.code === 'Escape' && this.gameState === 'paused') {
                this.resumeGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // أحداث الأزرار الرئيسية
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('instructionsButton').addEventListener('click', () => this.showInstructions());
        document.getElementById('achievementsButton').addEventListener('click', () => this.showAchievements());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('exitBtn').addEventListener('click', () => this.showExitConfirm());
        
        // أحداث الأزرار الثانوية
        document.getElementById('backButton').addEventListener('click', () => this.showStartScreen());
        document.getElementById('backFromAchievements').addEventListener('click', () => this.showStartScreen());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('menuButton').addEventListener('click', () => this.showStartScreen());
        document.getElementById('nextLevelButton').addEventListener('click', () => this.nextLevel());
        
        // أحداث التحكم في اللعبة
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.showStartScreen());
        
        // أحداث شاشة الإيقاف المؤقت
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartFromPause').addEventListener('click', () => this.restartGame());
        document.getElementById('menuFromPause').addEventListener('click', () => this.showStartScreen());
        
        // أحداث شاشة الخروج
        document.getElementById('confirmExit').addEventListener('click', () => this.exitGame());
        document.getElementById('cancelExit').addEventListener('click', () => this.showStartScreen());
        
        // أحداث الإعدادات
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            document.getElementById('musicValue').textContent = e.target.value + '%';
            this.settings.musicVolume = e.target.value;
        });
        
        document.getElementById('soundVolume').addEventListener('input', (e) => {
            document.getElementById('soundValue').textContent = e.target.value + '%';
            this.settings.soundVolume = e.target.value;
        });
        
        document.getElementById('language').addEventListener('change', (e) => {
            this.settings.language = e.target.value;
        });
        
        document.getElementById('theme').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
        });
        
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancelSettings').addEventListener('click', () => this.showStartScreen());
        
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

    loadSettings() {
        const savedSettings = localStorage.getItem('levelDevilSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // تطبيق الإعدادات
        document.getElementById('musicVolume').value = this.settings.musicVolume;
        document.getElementById('soundVolume').value = this.settings.soundVolume;
        document.getElementById('language').value = this.settings.language;
        document.getElementById('theme').value = this.settings.theme;
        
        document.getElementById('musicValue').textContent = this.settings.musicVolume + '%';
        document.getElementById('soundValue').textContent = this.settings.soundVolume + '%';
    }

    saveSettings() {
        localStorage.setItem('levelDevilSettings', JSON.stringify(this.settings));
        this.showStartScreen();
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
        this.isPaused = false;
    }

    showInstructions() {
        this.showScreen('instructions');
    }

    showAchievements() {
        this.showScreen('achievements');
    }

    showSettings() {
        this.showScreen('settings');
    }

    showExitConfirm() {
        this.showScreen('exit');
    }

    startGame() {
        this.showScreen('game');
        this.gameState = 'playing';
        this.isPaused = false;
        this.initializeLevel();
        this.gameLoop();
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.isPaused = true;
            this.showScreen('pause');
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.isPaused = false;
            this.showScreen('game');
        }
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

    exitGame() {
        // يمكن إضافة أي تنظيف هنا قبل الخروج
        window.close(); // قد لا يعمل في جميع المتصفحات
        // بديل: إعادة توجيه إلى صفحة أخرى أو إظهار رسالة
        alert('شكراً للعب! يمكنك إغلاق النافذة الآن.');
    }

    initializeLevel() {
        this.platforms = [];
        this.obstacles = [];
        this.collectibles = [];
        
        this.player.x = 50;
        this.player.y = 200;
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
                    { x: 0, y: 350, width: 200, height: 20 },
                    { x: 250, y: 300, width: 150, height: 20 },
                    { x: 450, y: 250, width: 200, height: 20 },
                    { x: 700, y: 300, width: 100, height: 20 }
                ],
                obstacles: [
                    { x: 220, y: 280, width: 25, height: 25 },
                    { x: 420, y: 230, width: 25, height: 25 }
                ],
                goal: { x: 750, y: 250, width: 40, height: 40 }
            },
            2: {
                platforms: [
                    { x: 0, y: 350, width: 150, height: 20 },
                    { x: 200, y: 320, width: 100, height: 20 },
                    { x: 350, y: 280, width: 120, height: 20 },
                    { x: 520, y: 320, width: 100, height: 20 },
                    { x: 670, y: 280, width: 130, height: 20 }
                ],
                obstacles: [
                    { x: 180, y: 300, width: 25, height: 25 },
                    { x: 480, y: 300, width: 25, height: 25 },
                    { x: 650, y: 260, width: 25, height: 25 }
                ],
                goal: { x: 750, y: 240, width: 40, height: 40 }
            },
            3: {
                platforms: [
                    { x: 0, y: 350, width: 100, height: 20 },
                    { x: 150, y: 320, width: 80, height: 20 },
                    { x: 280, y: 290, width: 70, height: 20 },
                    { x: 400, y: 320, width: 80, height: 20 },
                    { x: 530, y: 280, width: 70, height: 20 },
                    { x: 650, y: 250, width: 150, height: 20 }
                ],
                obstacles: [
                    { x: 130, y: 300, width: 25, height: 25 },
                    { x: 380, y: 300, width: 25, height: 25 },
                    { x: 510, y: 260, width: 25, height: 25 }
                ],
                goal: { x: 750, y: 220, width: 40, height: 40 }
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
        if (this.isPaused) return;
        
        this.player.velocityY += this.gravity;
        
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        this.player.velocityX *= this.friction;
        
        // حدود الشاشة الجانبية
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // التحقق من السقوط من المنصة
        if (this.player.y > this.canvas.height) {
            this.loseLife();
            return;
        }
        
        this.handlePlatformCollisions();
        this.handleObstacleCollisions();
        this.handleGoalCollision();
    }

    handlePlatformCollisions() {
        this.player.isJumping = true;
        let onPlatform = false;
        
        for (let platform of this.platforms) {
            if (this.isColliding(this.player, platform)) {
                // الاصطدام من الأعلى
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    onPlatform = true;
                }
                // الاصطدام من الأسفل
                else if (this.player.velocityY < 0 && this.player.y - this.player.velocityY >= platform.y + platform.height) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
                // الاصطدام من الجانبين
                else if (this.player.velocityX !== 0) {
                    if (this.player.x + this.player.width - this.player.velocityX <= platform.x) {
                        this.player.x = platform.x - this.player.width;
                    } else if (this.player.x - this.player.velocityX >= platform.x + platform.width) {
                        this.player.x = platform.x + platform.width;
                    }
                }
            }
        }
        
        // إذا لم يكن على منصة وكان تحت الشاشة، يخسر حياة
        if (!onPlatform && this.player.y > this.canvas.height - 100 && this.player.velocityY > 0) {
            // يمكن إضافة تحذير مرئي هنا
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
        
        // إعادة تعيين موقع اللاعب
        this.player.x = 50;
        this.player.y = 200;
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
        if (this.gameState === 'playing' && !this.isPaused) {
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
        
        // رسم تحذير السقوط
        if (this.player.y > this.canvas.height - 150 && this.player.velocityY > 0) {
            this.drawFallWarning();
        }
    }

    drawBackground() {
        // خلفية عرضية مع تدرج لوني
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98FB98');
        gradient.addColorStop(1, '#87CEEB');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // سحب متحركة
        const time = Date.now() / 1000;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (let i = 0; i < 5; i++) {
            const x = (time * 20 + i * 100) % (this.canvas.width + 200) - 100;
            const y = 50 + Math.sin(time + i) * 10;
            this.drawCloud(x, y, 40 + i * 5);
        }
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x + size * 1.6, y, size * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y + size * 0.2, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPlayer() {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        
        // جسم اللاعب
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // تفاصيل الوجه
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 10, 8, 8);
        this.ctx.fillRect(this.player.x + 24, this.player.y + 10, 8, 8);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.player.x + 10, this.player.y + 12, 4, 4);
        this.ctx.fillRect(this.player.x + 26, this.player.y + 12, 4, 4);
        
        // الفم
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
        
        // المنصة الرئيسية
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // تفاصيل الخشب
        this.ctx.fillStyle = '#A0522D';
        for (let i = 0; i < platform.width; i += 10) {
            this.ctx.fillRect(platform.x + i, platform.y, 5, platform.height);
        }
        
        // حافة المنصة
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
        
        this.ctx.restore();
    }

    drawObstacle(obstacle) {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 3;
        
        // جسم العقبة
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // شكل المسمار
        this.ctx.fillStyle = '#8B0000';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
        this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // تأثير لامع
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width/2 - 2, 5);
        
        this.ctx.restore();
    }

    drawGoal(goal) {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        // الهدف
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
        
        // تفاصيل الهدف
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // تأثير وميض
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

    drawFallWarning() {
        this.ctx.save();
        
        const warningAlpha = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        this.ctx.fillStyle = `rgba(255, 0, 0, ${warningAlpha * 0.3})`;
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        this.ctx.fillStyle = `rgba(255, 255, 255, ${warningAlpha})`;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠️ احذر! السقوط يؤدي إلى الخسارة', this.canvas.width/2, this.canvas.height - 20);
        
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
        if (this.gameState === 'playing' && !this.isPaused) {
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
