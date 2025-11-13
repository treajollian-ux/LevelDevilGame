// نظام إدارة الوسائط
class MediaManager {
    constructor() {
        this.images = {};
        this.audio = {};
        this.settings = {
            musicVolume: 50,
            soundVolume: 70,
            customBackground: null,
            customCharacter: null,
            customMusic: null
        };
        this.loadStoredSettings();
    }

    loadStoredSettings() {
        const stored = localStorage.getItem('gameSettings');
        if (stored) {
            this.settings = { ...this.settings, ...JSON.parse(stored) };
        }
    }

    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }

    async loadImage(file, name) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.images[name] = img;
                    this.settings[name] = e.target.result;
                    this.saveSettings();
                    resolve(img);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async loadAudio(file, name) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const audio = new Audio();
                audio.onloadeddata = () => {
                    this.audio[name] = audio;
                    this.settings[name] = e.target.result;
                    this.saveSettings();
                    resolve(audio);
                };
                audio.onerror = reject;
                audio.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    getImage(name) {
        if (this.images[name]) {
            return this.images[name];
        }
        
        // تحميل الصور المحفوظة
        if (this.settings[name]) {
            const img = new Image();
            img.src = this.settings[name];
            this.images[name] = img;
            return img;
        }
        
        return null;
    }

    getAudio(name) {
        if (this.audio[name]) {
            return this.audio[name];
        }
        
        // تحميل الصوت المحفوظ
        if (this.settings[name]) {
            const audio = new Audio();
            audio.src = this.settings[name];
            this.audio[name] = audio;
            return audio;
        }
        
        return null;
    }

    resetSettings() {
        this.settings = {
            musicVolume: 50,
            soundVolume: 70,
            customBackground: null,
            customCharacter: null,
            customMusic: null
        };
        this.images = {};
        this.audio = {};
        localStorage.removeItem('gameSettings');
    }
}

// الفئة الرئيسية للعبة
class LevelDevilGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mediaManager = new MediaManager();
        
        this.initializeGame();
        this.setupEventListeners();
        this.applyStoredSettings();
        this.gameLoop();
    }

    initializeGame() {
        // حالة اللعبة
        this.gameState = 'menu'; // menu, playing, paused, gameOver, levelComplete
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.timeLeft = 90;
        this.gameTime = 0;
        
        // إعدادات اللاعب
        this.player = {
            x: 100,
            y: 400,
            width: 50,
            height: 50,
            velocityX: 0,
            velocityY: 0,
            speed: 8,
            jumpPower: -15,
            isJumping: false,
            facingRight: true,
            animationState: 'idle', // idle, running, jumping
            animationFrame: 0,
            lastAnimationTime: Date.now() // إضافة هذا السطر
        };
        
        // الفيزياء
        this.gravity = 0.6;
        this.friction = 0.85;
        
        // عناصر اللعبة
        this.platforms = [];
        this.obstacles = [];
        this.bombs = [];
        this.movingPlatforms = [];
        this.goal = null;
        
        // الإدخال
        this.keys = {};
        
        // تهيئة المستوى
        this.createLevelDesign();
    }

    setupEventListeners() {
        // أحداث لوحة المفاتيح - تم إصلاح الأسهم
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

        // أحداث الشاشات
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('instructionsButton').addEventListener('click', () => this.showScreen('instructionsScreen'));
        document.getElementById('achievementsButton').addEventListener('click', () => this.showScreen('achievementsScreen'));
        document.getElementById('settingsBtn').addEventListener('click', () => this.showScreen('settingsScreen'));
        document.getElementById('exitBtn').addEventListener('click', () => this.showScreen('exitScreen'));
        
        document.getElementById('backButton').addEventListener('click', () => this.showScreen('startScreen'));
        document.getElementById('backFromAchievements').addEventListener('click', () => this.showScreen('startScreen'));
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('menuButton').addEventListener('click', () => this.showScreen('startScreen'));
        document.getElementById('nextLevelButton').addEventListener('click', () => this.nextLevel());
        
        // أحداث التحكم في اللعبة
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.showScreen('startScreen'));
        
        // أحداث شاشة الإيقاف المؤقت
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartFromPause').addEventListener('click', () => this.restartGame());
        document.getElementById('menuFromPause').addEventListener('click', () => this.showScreen('startScreen'));
        
        // أحداث شاشة الخروج
        document.getElementById('confirmExit').addEventListener('click', () => this.exitGame());
        document.getElementById('cancelExit').addEventListener('click', () => this.showScreen('startScreen'));
        
        // أحداث الإعدادات - تم إصلاحها
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('musicValue').textContent = value + '%';
            this.mediaManager.settings.musicVolume = parseInt(value);
            this.updateAudioVolumes();
        });
        
        document.getElementById('soundVolume').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('soundValue').textContent = value + '%';
            this.mediaManager.settings.soundVolume = parseInt(value);
            this.updateAudioVolumes();
        });
        
        // تحميل الوسائط المخصصة
        document.getElementById('backgroundImage').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.mediaManager.loadImage(e.target.files[0], 'customBackground')
                    .then(() => {
                        document.getElementById('backgroundPreview').style.backgroundImage = `url(${this.mediaManager.settings.customBackground})`;
                        document.getElementById('backgroundPreview').style.display = 'block';
                    })
                    .catch(console.error);
            }
        });
        
        document.getElementById('characterImage').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.mediaManager.loadImage(e.target.files[0], 'customCharacter')
                    .then(() => {
                        document.getElementById('characterPreview').style.backgroundImage = `url(${this.mediaManager.settings.customCharacter})`;
                        document.getElementById('characterPreview').style.display = 'block';
                    })
                    .catch(console.error);
            }
        });
        
        document.getElementById('customMusic').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.mediaManager.loadAudio(e.target.files[0], 'customMusic')
                    .then(() => {
                        document.getElementById('musicInfo').textContent = e.target.files[0].name;
                        this.playBackgroundMusic();
                    })
                    .catch(console.error);
            }
        });
        
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancelSettings').addEventListener('click', () => this.showScreen('startScreen'));
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        
        // أحداث تحكم الجوال
        document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = true;
        });
        document.getElementById('leftBtn').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
        });
        
        document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = true;
        });
        document.getElementById('rightBtn').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = false;
        });
        
        document.getElementById('jumpBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['Space'] = true;
        });
        document.getElementById('jumpBtn').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['Space'] = false;
        });
    }

    applyStoredSettings() {
        // تطبيق الإعدادات المحفوظة
        document.getElementById('musicVolume').value = this.mediaManager.settings.musicVolume;
        document.getElementById('soundVolume').value = this.mediaManager.settings.soundVolume;
        document.getElementById('musicValue').textContent = this.mediaManager.settings.musicVolume + '%';
        document.getElementById('soundValue').textContent = this.mediaManager.settings.soundVolume + '%';
        
        // عرض المعاينات المحفوظة
        if (this.mediaManager.settings.customBackground) {
            document.getElementById('backgroundPreview').style.backgroundImage = `url(${this.mediaManager.settings.customBackground})`;
            document.getElementById('backgroundPreview').style.display = 'block';
        }
        
        if (this.mediaManager.settings.customCharacter) {
            document.getElementById('characterPreview').style.backgroundImage = `url(${this.mediaManager.settings.customCharacter})`;
            document.getElementById('characterPreview').style.display = 'block';
        }
        
        this.updateAudioVolumes();
    }

    updateAudioVolumes() {
        // تحديث مستويات الصوت لجميع العناصر الصوتية
        Object.values(this.mediaManager.audio).forEach(audio => {
            if (audio === this.mediaManager.audio.customMusic) {
                audio.volume = this.mediaManager.settings.musicVolume / 100;
            } else {
                audio.volume = this.mediaManager.settings.soundVolume / 100;
            }
        });
    }

    playBackgroundMusic() {
        const bgMusic = this.mediaManager.getAudio('customMusic');
        if (bgMusic) {
            bgMusic.loop = true;
            bgMusic.volume = this.mediaManager.settings.musicVolume / 100;
            bgMusic.play().catch(console.error);
        }
    }

    stopBackgroundMusic() {
        const bgMusic = this.mediaManager.getAudio('customMusic');
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
    }

    playSound(soundName) {
        // يمكن إضافة أصوات تأثيرية هنا
        console.log('Playing sound:', soundName);
    }

    showScreen(screenName) {
        // إخفاء جميع الشاشات
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // إظهار الشاشة المطلوبة
        document.getElementById(screenName).classList.add('active');
        
        // إدارة حالة اللعبة
        if (screenName === 'gameScreen') {
            this.gameState = 'playing';
            this.playBackgroundMusic();
        } else if (screenName === 'startScreen') {
            this.gameState = 'menu';
            this.stopBackgroundMusic();
        } else if (screenName === 'pauseScreen') {
            this.gameState = 'paused';
        }
    }

    startGame() {
        this.showScreen('gameScreen');
        this.initializeGame();
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showScreen('pauseScreen');
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showScreen('gameScreen');
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        this.showScreen('gameOverScreen');
        this.playSound('gameOver');
    }

    levelComplete() {
        this.gameState = 'levelComplete';
        document.getElementById('completedLevel').textContent = this.level;
        this.score += 100 + (this.level * 10);
        this.showScreen('levelCompleteScreen');
        this.playSound('levelUp');
    }

    nextLevel() {
        if (this.level < 100) {
            this.level++;
            this.timeLeft = Math.max(30, 90 - this.level);
            this.showScreen('gameScreen');
            this.gameState = 'playing';
            this.createLevelDesign();
        } else {
            this.gameOver();
        }
    }

    restartGame() {
        this.initializeGame();
        this.showScreen('gameScreen');
    }

    exitGame() {
        alert('شكراً للعب Level Devil Game! 🎮');
    }

    saveSettings() {
        this.mediaManager.saveSettings();
        this.showScreen('startScreen');
    }

    resetSettings() {
        this.mediaManager.resetSettings();
        this.applyStoredSettings();
        document.getElementById('backgroundPreview').style.display = 'none';
        document.getElementById('characterPreview').style.display = 'none';
        document.getElementById('musicInfo').textContent = '';
    }

    createLevelDesign() {
        // تصميم مستوى عرضي من اليسار إلى اليمين
        this.platforms = [];
        this.obstacles = [];
        this.bombs = [];
        this.movingPlatforms = [];
        
        const platformCount = 15 + Math.floor(this.level / 2);
        const obstacleCount = 5 + Math.floor(this.level / 3);
        const bombCount = 3 + Math.floor(this.level / 5);
        
        // منصات أفقية
        for (let i = 0; i < platformCount; i++) {
            this.platforms.push({
                x: (i * 80) % 1000 + 50,
                y: 400 + Math.sin(i * 0.5) * 50,
                width: 70 + Math.random() * 30,
                height: 20,
                color: '#8B4513'
            });
        }
        
        // منصات متحركة
        if (this.level > 10) {
            for (let i = 0; i < 3; i++) {
                this.movingPlatforms.push({
                    x: 200 + i * 200,
                    y: 300 + Math.sin(i) * 50,
                    width: 100,
                    height: 15,
                    speed: 1 + (this.level / 20),
                    direction: 1,
                    color: '#A0522D'
                });
            }
        }
        
        // عقبات
        for (let i = 0; i < obstacleCount; i++) {
            this.obstacles.push({
                x: 150 + (i * 120) % 900,
                y: 380 - Math.random() * 100,
                width: 30,
                height: 30,
                color: '#FF0000',
                type: 'spike'
            });
        }
        
        // قنابل
        if (this.level > 5) {
            for (let i = 0; i < bombCount; i++) {
                this.bombs.push({
                    x: 200 + (i * 150) % 800,
                    y: 100,
                    width: 25,
                    height: 25,
                    velocityY: 2 + Math.random() * 2,
                    color: '#333333',
                    active: true
                });
            }
        }
        
        // الهدف
        this.goal = {
            x: 1100,
            y: 350,
            width: 40,
            height: 40,
            color: '#00FF00'
        };
        
        this.updateUI();
    }

    handleInput() {
        this.player.velocityX = 0;
        
        // التحكم في الحركة - تم إصلاح الأسهم
        if (this.keys['ArrowLeft']) {
            this.player.velocityX = -this.player.speed;
            this.player.facingRight = false;
            if (!this.player.isJumping) {
                this.player.animationState = 'running';
            }
        }
        if (this.keys['ArrowRight']) {
            this.player.velocityX = this.player.speed;
            this.player.facingRight = true;
            if (!this.player.isJumping) {
                this.player.animationState = 'running';
            }
        }
        
        // إذا لم يكن هناك حركة أفقية
        if (this.player.velocityX === 0 && !this.player.isJumping) {
            this.player.animationState = 'idle';
        }
        
        // القفز
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && !this.player.isJumping) {
            this.player.velocityY = this.player.jumpPower;
            this.player.isJumping = true;
            this.player.animationState = 'jumping';
            this.playSound('jump');
        }
    }

    updatePhysics() {
        if (this.gameState !== 'playing') return;
        
        // تطبيق الجاذبية
        this.player.velocityY += this.gravity;
        
        // تحديث الموقع
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // الاحتكاك
        this.player.velocityX *= this.friction;
        
        // حدود الشاشة
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // السقوط
        if (this.player.y > this.canvas.height) {
            this.loseLife();
            return;
        }
        
        // تحديث العناصر المتحركة
        this.updateMovingPlatforms();
        this.updateBombs();
        
        // الاصطدامات
        this.handlePlatformCollisions();
        this.handleObstacleCollisions();
        this.handleBombCollisions();
        this.handleGoalCollision();
        
        // تحديث الرسوم المتحركة
        this.updateAnimation();
        
        // تحديث المؤقت
        this.updateTimer();
    }

    updateMovingPlatforms() {
        this.movingPlatforms.forEach(platform => {
            platform.x += platform.speed * platform.direction;
            if (platform.x <= 0 || platform.x + platform.width >= this.canvas.width) {
                platform.direction *= -1;
            }
        });
    }

    updateBombs() {
        this.bombs.forEach(bomb => {
            if (bomb.active) {
                bomb.y += bomb.velocityY;
                if (bomb.y > this.canvas.height) {
                    bomb.y = -50;
                    bomb.x = 100 + Math.random() * 1000;
                }
            }
        });
    }

    handlePlatformCollisions() {
        let onPlatform = false;
        
        // المنصات الثابتة
        this.platforms.forEach(platform => {
            if (this.isColliding(this.player, platform)) {
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    onPlatform = true;
                    
                    // العودة إلى حالة الركض إذا كان يتحرك
                    if (this.player.velocityX !== 0) {
                        this.player.animationState = 'running';
                    } else {
                        this.player.animationState = 'idle';
                    }
                }
            }
        });
        
        // المنصات المتحركة
        this.movingPlatforms.forEach(platform => {
            if (this.isColliding(this.player, platform)) {
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    onPlatform = true;
                    this.player.x += platform.speed * platform.direction;
                    
                    if (this.player.velocityX !== 0) {
                        this.player.animationState = 'running';
                    } else {
                        this.player.animationState = 'idle';
                    }
                }
            }
        });
        
        // إذا لم يكن على منصة، وهو ليس في حالة قفز، فاجعل حالة الرسوم المتحركة حسب السرعة الأفقية
        if (!onPlatform && this.player.velocityY > 0 && this.player.animationState !== 'jumping') {
            this.player.animationState = 'jumping';
        }
    }

    handleObstacleCollisions() {
        this.obstacles.forEach(obstacle => {
            if (this.isColliding(this.player, obstacle)) {
                this.loseLife();
            }
        });
    }

    handleBombCollisions() {
        this.bombs.forEach(bomb => {
            if (bomb.active && this.isColliding(this.player, bomb)) {
                bomb.active = false;
                this.playSound('bomb');
                this.loseLife();
            }
        });
    }

    handleGoalCollision() {
        if (this.goal && this.isColliding(this.player, this.goal)) {
            this.levelComplete();
        }
    }

    updateAnimation() {
        const now = Date.now();
        // تحديث الرسوم المتحركة كل 100 مللي ثانية
        if (now - this.player.lastAnimationTime > 100) {
            this.player.animationFrame = (this.player.animationFrame + 1) % 4;
            this.player.lastAnimationTime = now;
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
        this.playSound('collision');
        
        // إعادة تعيين اللاعب
        this.player.x = 100;
        this.player.y = 400;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.animationState = 'idle';
        
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
        this.gameTime += 1/60;
        
        if (this.gameTime >= 1) {
            this.gameTime = 0;
            this.timeLeft--;
            
            if (this.timeLeft <= 0) {
                this.loseLife();
                this.timeLeft = Math.max(30, 90 - this.level);
            }
            
            this.updateUI();
        }
    }

    drawPlayer() {
        const charImage = this.mediaManager.getImage('customCharacter');
        
        if (charImage) {
            // استخدام الصورة المخصصة
            this.ctx.save();
            if (!this.player.facingRight) {
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(charImage, -this.player.x - this.player.width, this.player.y, this.player.width, this.player.height);
            } else {
                this.ctx.drawImage(charImage, this.player.x, this.player.y, this.player.width, this.player.height);
            }
            this.ctx.restore();
        } else {
            // رسم افتراضي مع رسوم متحركة محسنة
            this.ctx.save();
            
            if (!this.player.facingRight) {
                this.ctx.scale(-1, 1);
                this.ctx.translate(-this.canvas.width, 0);
            }
            
            const drawX = this.player.facingRight ? this.player.x : this.canvas.width - this.player.x - this.player.width;
            
            // الجسم مع تأثير الظل
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetY = 3;
            
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(drawX, this.player.y, this.player.width, this.player.height);
            
            this.ctx.shadowBlur = 0; // إزالة الظل للتفاصيل
            
            // الرأس
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(drawX + 5, this.player.y - 10, this.player.width - 10, 15);
            
            // العينين
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(drawX + 15, this.player.y - 5, 6, 6);
            this.ctx.fillRect(drawX + this.player.width - 21, this.player.y - 5, 6, 6);
            
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(drawX + 16, this.player.y - 4, 4, 4);
            this.ctx.fillRect(drawX + this.player.width - 20, this.player.y - 4, 4, 4);
            
            // الفم - يتغير حسب الحركة
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            if (this.player.animationState === 'running') {
                // فم مبتسم عند الحركة
                this.ctx.arc(drawX + this.player.width/2, this.player.y + 2, 4, 0, Math.PI);
            } else {
                // فم عادي عند الوقوف
                this.ctx.moveTo(drawX + this.player.width/2 - 4, this.player.y + 2);
                this.ctx.lineTo(drawX + this.player.width/2 + 4, this.player.y + 2);
            }
            this.ctx.stroke();
            
            // الأرجل المتحركة - تحسين الحركة
            this.ctx.fillStyle = '#333';
            const legMovement = Math.sin(this.player.animationFrame * 0.8) * 8;
            
            if (this.player.animationState === 'running') {
                // حركة المشي
                this.ctx.fillRect(drawX + 10, this.player.y + this.player.height, 8, 15 + legMovement);
                this.ctx.fillRect(drawX + this.player.width - 18, this.player.y + this.player.height, 8, 15 - legMovement);
            } else if (this.player.animationState === 'jumping') {
                // وضعية القفز
                this.ctx.fillRect(drawX + 12, this.player.y + this.player.height, 6, 12);
                this.ctx.fillRect(drawX + this.player.width - 18, this.player.y + this.player.height, 6, 12);
            } else {
                // وضعية الوقوف
                this.ctx.fillRect(drawX + 12, this.player.y + this.player.height, 6, 15);
                this.ctx.fillRect(drawX + this.player.width - 18, this.player.y + this.player.height, 6, 15);
            }
            
            // الذراعين المتحركة
            this.ctx.fillStyle = '#FF6B6B';
            const armMovement = Math.sin(this.player.animationFrame * 0.8) * 5;
            
            if (this.player.animationState === 'running') {
                this.ctx.fillRect(drawX - 5, this.player.y + 10, 8, 8 + armMovement);
                this.ctx.fillRect(drawX + this.player.width - 3, this.player.y + 10, 8, 8 - armMovement);
            } else if (this.player.animationState === 'jumping') {
                this.ctx.fillRect(drawX - 3, this.player.y + 5, 6, 12);
                this.ctx.fillRect(drawX + this.player.width - 3, this.player.y + 5, 6, 12);
            } else {
                this.ctx.fillRect(drawX - 3, this.player.y + 10, 6, 10);
                this.ctx.fillRect(drawX + this.player.width - 3, this.player.y + 10, 6, 10);
            }
            
            this.ctx.restore();
            
            // تأثير الظل تحت اللاعب
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height + 8,
                this.player.width/3,
                4,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // رسم تأثيرات الحركة
        this.drawMovementEffects();
    }

    drawMovementEffects() {
        if (this.player.animationState === 'running') {
            // تأثير غبار عند الحركة
            this.ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            for (let i = 0; i < 3; i++) {
                const dustX = this.player.facingRight ? 
                    this.player.x - 5 - i * 3 : 
                    this.player.x + this.player.width + 5 + i * 3;
                const dustY = this.player.y + this.player.height - 5;
                const dustSize = Math.random() * 3 + 1;
                
                this.ctx.beginPath();
                this.ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        if (this.player.animationState === 'jumping') {
            // تأثير قفز
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height,
                this.player.width/4,
                0, Math.PI
            );
            this.ctx.fill();
        }
    }

    render() {
        // مسح Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الخلفية
        this.drawBackground();
        
        // رسم العناصر
        this.drawPlatforms();
        this.drawMovingPlatforms();
        this.drawObstacles();
        this.drawBombs();
        this.drawGoal();
        this.drawPlayer();
        this.drawEffects();
        
        // رسم تحذير السقوط
        if (this.player.y > this.canvas.height - 150 && this.player.velocityY > 0) {
            this.drawFallWarning();
        }
    }

    drawBackground() {
        const bgImage = this.mediaManager.getImage('customBackground');
        if (bgImage) {
            this.ctx.drawImage(bgImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // خلفية افتراضية
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            gradient.addColorStop(0, '#1e3c72');
            gradient.addColorStop(1, '#2a5298');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawPlatforms() {
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    drawMovingPlatforms() {
        this.movingPlatforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            if (obstacle.type === 'spike') {
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
                this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
            }
        });
    }

    drawBombs() {
        this.bombs.forEach(bomb => {
            if (bomb.active) {
                this.ctx.fillStyle = bomb.color;
                this.ctx.beginPath();
                this.ctx.arc(bomb.x + bomb.width/2, bomb.y + bomb.height/2, bomb.width/2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawGoal() {
        if (!this.goal) return;
        
        this.ctx.fillStyle = this.goal.color;
        this.ctx.beginPath();
        this.ctx.arc(this.goal.x + this.goal.width/2, this.goal.y + this.goal.height/2, this.goal.width/2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawFallWarning() {
        this.ctx.save();
        const alpha = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠️ احذر! السقوط يؤدي إلى الخسارة', this.canvas.width/2, this.canvas.height - 20);
        this.ctx.restore();
    }

    drawEffects() {
        if (this.gameState === 'playing' && this.timeLeft <= 10) {
            this.ctx.save();
            this.ctx.globalAlpha = Math.sin(Date.now() / 200) * 0.3 + 0.2;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }

    gameLoop() {
        if (this.gameState === 'playing') {
            this.handleInput();
            this.updatePhysics();
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// بدء اللعبة عند تحميل الصفحة
window.addEventListener('load', () => {
    new LevelDevilGame();
});
