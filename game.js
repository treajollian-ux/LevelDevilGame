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
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
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
        
        // موسيقى خلفية بسيطة
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
        
        // نمط لحني بسيط
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        let currentTime = this.audioContext.currentTime;
        
        const playNote = (frequency, duration) => {
            oscillator.frequency.setValueAtTime(frequency, currentTime);
            currentTime += duration;
        };
        
        // لحن متكرر
        setInterval(() => {
            currentTime = this.audioContext.currentTime;
            notes.forEach((note, index) => {
                playNote(note, 0.3);
            });
        }, 2400);
        
        oscillator.start();
    }
}
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
        this.loadAssets();
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
        
        // الصوت
        this.sounds = {
            background: document.getElementById('backgroundMusic'),
            jump: document.getElementById('jumpSound'),
            collision: document.getElementById('collisionSound'),
            levelUp: document.getElementById('levelUpSound')
        };
        
        // ضبط مستوى الصوت
        this.setVolume(0.3);
    }

    setVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }

    setupEventListeners() {
        // أحداث لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // إعادة التشغيل بالضغط على R
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

    loadAssets() {
        // تحميل الصور
        this.images = {
            player: new Image(),
            platform: new Image(),
            obstacle: new Image(),
            goal: new Image(),
            background: new Image()
        };
        
        // تعيين مصادر الصور
        this.images.player.src = 'images/character.png';
        this.images.platform.src = 'images/platform.png';
        this.images.obstacle.src = 'images/obstacle.png';
        this.images.goal.src = 'images/goal.png';
        this.images.background.src = 'images/background.jpg';
        
        // التحقق من تحميل الصور
        Object.values(this.images).forEach(img => {
            img.onerror = () => {
                console.warn('Failed to load image:', img.src);
                // استخدام ألوان بديلة إذا فشل تحميل الصور
            };
        });
    }

    showScreen(screenName) {
        // إخفاء جميع الشاشات
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // إظهار الشاشة المطلوبة
        this.screens[screenName].classList.remove('hidden');
        
        // إدارة الصوت
        if (screenName === 'game') {
            this.sounds.background.play().catch(e => console.log('Audio play failed:', e));
        } else {
            this.sounds.background.pause();
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
        
        // إضافة النقاط
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
        // مسح العناصر السابقة
        this.platforms = [];
        this.obstacles = [];
        this.collectibles = [];
        
        // إعادة تعيين اللاعب
        this.player.x = 50;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        
        // إنشاء المنصات والعقبات حسب المستوى
        this.createLevelDesign();
        
        // تحديث واجهة المستخدم
        this.updateUI();
    }

    createLevelDesign() {
        // التصميم الأساسي للمستويات
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
        
        // إنشاء المنصات
        design.platforms.forEach(plat => {
            this.platforms.push({
                x: plat.x,
                y: plat.y,
                width: plat.width,
                height: plat.height,
                color: '#8B4513'
            });
        });
        
        // إنشاء العقبات
        design.obstacles.forEach(obs => {
            this.obstacles.push({
                x: obs.x,
                y: obs.y,
                width: obs.width,
                height: obs.height,
                color: '#FF0000'
            });
        });
        
        // إنشاء الهدف
        this.goal = {
            x: design.goal.x,
            y: design.goal.y,
            width: design.goal.width,
            height: design.goal.height,
            color: '#00FF00'
        };
    }

    handleInput() {
        // الحركة الأفقية
        this.player.velocityX = 0;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.velocityX = -this.player.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.velocityX = this.player.speed;
        }
        
        // القفز
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && !this.player.isJumping) {
            this.player.velocityY = this.player.jumpPower;
            this.player.isJumping = true;
            this.sounds.jump.play().catch(e => console.log('Jump sound failed'));
        }
    }

    updatePhysics() {
        // تطبيق الجاذبية
        this.player.velocityY += this.gravity;
        
        // تطبيق الحركة
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // الاحتكاك
        this.player.velocityX *= this.friction;
        
        // حدود الشاشة
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // الأرض
        if (this.player.y > this.canvas.height - this.player.height) {
            this.player.y = this.canvas.height - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
        
        // الاصطدام مع المنصات
        this.handlePlatformCollisions();
        
        // الاصطدام مع العقبات
        this.handleObstacleCollisions();
        
        // الوصول إلى الهدف
        this.handleGoalCollision();
    }

    handlePlatformCollisions() {
        this.player.isJumping = true;
        
        for (let platform of this.platforms) {
            if (this.isColliding(this.player, platform)) {
                // الاصطدام من الأعلى
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
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
        
        // تحديد عرض الحياة
        let livesText = '';
        for (let i = 0; i < 3; i++) {
            livesText += i < this.lives ? '❤️' : '♡';
        }
        document.getElementById('livesDisplay').textContent = livesText;
    }

    updateTimer() {
        if (this.gameState === 'playing') {
            this.gameTime += 1/60; // بافتراض 60 إطار في الثانية
            
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
        // مسح Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الخلفية
        this.drawBackground();
        
        // رسم المنصات
        this.platforms.forEach(platform => {
            this.drawPlatform(platform);
        });
        
        // رسم العقبات
        this.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
        
        // رسم الهدف
        if (this.goal) {
            this.drawGoal(this.goal);
        }
        
        // رسم اللاعب
        this.drawPlayer();
        
        // تأثيرات خاصة
        this.drawEffects();
    }

    drawBackground() {
        // خلفية متدرجة
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // سحب بسيطة
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(100, 80, 40, 0, Math.PI * 2);
        this.ctx.arc(150, 70, 30, 0, Math.PI * 2);
        this.ctx.arc(200, 90, 35, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPlayer() {
        this.ctx.save();
        
        // تأثير الظل
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        
        // رسم اللاعب
        if (this.images.player.complete) {
            this.ctx.drawImage(
                this.images.player,
                this.player.x,
                this.player.y,
                this.player.width,
                this.player.height
            );
        } else {
            // رسم بديل إذا لم تحمل الصورة
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            
            // تفاصيل اللاعب
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(this.player.x + 10, this.player.y + 10, 8, 8);
            this.ctx.fillRect(this.player.x + 22, this.player.y + 10, 8, 8);
        }
        
        this.ctx.restore();
    }

    drawPlatform(platform) {
        this.ctx.save();
        
        // تأثير الظل
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 3;
        
        if (this.images.platform.complete) {
            this.ctx.drawImage(
                this.images.platform,
                platform.x,
                platform.y,
                platform.width,
                platform.height
            );
        } else {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // تفاصيل المنصة
            this.ctx.fillStyle = '#A0522D';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
        }
        
        this.ctx.restore();
    }

    drawObstacle(obstacle) {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 3;
        
        if (this.images.obstacle.complete) {
            this.ctx.drawImage(
                this.images.obstacle,
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height
            );
        } else {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // تفاصيل العقبة
            this.ctx.fillStyle = '#8B0000';
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
            this.ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    drawGoal(goal) {
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetY = 5;
        
        if (this.images.goal.complete) {
            this.ctx.drawImage(
                this.images.goal,
                goal.x,
                goal.y,
                goal.width,
                goal.height
            );
        } else {
            this.ctx.fillStyle = goal.color;
            this.ctx.beginPath();
            this.ctx.arc(
                goal.x + goal.width/2,
                goal.y + goal.height/2,
                goal.width/2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // تأثير وميض
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawEffects() {
        // تأثيرات بصرية إضافية
        if (this.gameState === 'playing') {
            // وميض المؤقت عندما يكون الوقت قليلاً
            if (this.timeLeft <= 10) {
                this.ctx.save();
                this.ctx.globalAlpha = Math.sin(Date.now() / 200) * 0.5 + 0.5;
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.restore();
            }
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
