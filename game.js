// نظام الصوت المحسن
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.volumes = {
            music: 0.5,
            sound: 0.7
        };
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }

        // تهيئة عناصر الصوت
        this.sounds = {
            background: document.getElementById('backgroundMusic'),
            jump: document.getElementById('jumpSound'),
            collision: document.getElementById('collisionSound'),
            levelUp: document.getElementById('levelUpSound'),
            bomb: document.getElementById('bombSound')
        };

        this.updateVolumes();
    }

    updateVolumes() {
        // تحديث مستويات الصوت
        this.sounds.background.volume = this.volumes.music;
        this.sounds.jump.volume = this.volumes.sound;
        this.sounds.collision.volume = this.volumes.sound;
        this.sounds.levelUp.volume = this.volumes.sound;
        this.sounds.bomb.volume = this.volumes.sound;
    }

    setMusicVolume(volume) {
        this.volumes.music = volume / 100;
        this.updateVolumes();
    }

    setSoundVolume(volume) {
        this.volumes.sound = volume / 100;
        this.updateVolumes();
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
        }
    }

    stop(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].pause();
            this.sounds[soundName].currentTime = 0;
        }
    }

    loadCustomAudio(file, soundName) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const audio = this.sounds[soundName];
                audio.src = e.target.result;
                audio.onloadeddata = () => resolve();
                audio.onerror = reject;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// نظام تحميل الصور
class ImageManager {
    constructor() {
        this.images = {};
        this.customImages = {};
    }

    loadImage(src, name) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    loadCustomImage(file, name) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.customImages[name] = img;
                    localStorage.setItem(`custom_${name}`, e.target.result);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    getImage(name) {
        return this.customImages[name] || this.images[name];
    }

    loadStoredImages() {
        // تحميل الصور المحفوظة من localStorage
        ['background', 'character'].forEach(name => {
            const stored = localStorage.getItem(`custom_${name}`);
            if (stored) {
                const img = new Image();
                img.onload = () => {
                    this.customImages[name] = img;
                };
                img.src = stored;
            }
        });
    }
}

// الفئة الرئيسية للعبة
class LevelDevilGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('characterPreviewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        
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
        
        this.audioManager = new AudioManager();
        this.imageManager = new ImageManager();
        
        this.settings = {
            musicVolume: 50,
            soundVolume: 70,
            language: 'ar',
            customBackground: null,
            customCharacter: null,
            customMusic: null
        };
        
        this.initializeGame();
        this.setupEventListeners();
        this.loadSettings();
        this.loadDefaultAssets();
    }

    initializeGame() {
        // إعدادات اللعبة
        this.gameState = 'menu';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.timeLeft = 90;
        this.gameTime = 0;
        this.isPaused = false;
        
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
            lastAnimationTime: 0
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
        this.collectibles = [];
        
        // الإدخال
        this.keys = {};
        
        // تحميل الصور المخزنة
        this.imageManager.loadStoredImages();
    }

    async loadDefaultAssets() {
        try {
            // إنشاء صور افتراضية برمجياً
            await this.createDefaultImages();
            this.drawCharacterPreview();
        } catch (error) {
            console.error('Error loading default assets:', error);
        }
    }

    createDefaultImages() {
        return new Promise((resolve) => {
            // إنشاء خلفية افتراضية
            const bgCanvas = document.createElement('canvas');
            bgCanvas.width = 1200;
            bgCanvas.height = 600;
            const bgCtx = bgCanvas.getContext('2d');
            
            // خلفية متدرجة
            const gradient = bgCtx.createLinearGradient(0, 0, 1200, 600);
            gradient.addColorStop(0, '#1e3c72');
            gradient.addColorStop(1, '#2a5298');
            bgCtx.fillStyle = gradient;
            bgCtx.fillRect(0, 0, 1200, 600);
            
            // إضافة نجوم
            bgCtx.fillStyle = 'white';
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * 1200;
                const y = Math.random() * 600;
                const size = Math.random() * 2 + 1;
                bgCtx.beginPath();
                bgCtx.arc(x, y, size, 0, Math.PI * 2);
                bgCtx.fill();
            }
            
            const bgImage = new Image();
            bgImage.onload = () => {
                this.imageManager.images.background = bgImage;
                resolve();
            };
            bgImage.src = bgCanvas.toDataURL();
        });
    }

    drawCharacterPreview() {
        this.previewCtx.clearRect(0, 0, 100, 100);
        
        // رسم شخصية افتراضية متحركة
        const time = Date.now() / 1000;
        const bounce = Math.sin(time * 2) * 5;
        
        this.previewCtx.fillStyle = '#FF6B6B';
        this.previewCtx.fillRect(20, 30 + bounce, 60, 40);
        
        // الوجه
        this.previewCtx.fillStyle = 'white';
        this.previewCtx.fillRect(30, 40 + bounce, 10, 10);
        this.previewCtx.fillRect(60, 40 + bounce, 10, 10);
        
        this.previewCtx.fillStyle = 'black';
        this.previewCtx.fillRect(32, 42 + bounce, 6, 6);
        this.previewCtx.fillRect(62, 42 + bounce, 6, 6);
        
        // الفم
        this.previewCtx.strokeStyle = 'black';
        this.previewCtx.lineWidth = 2;
        this.previewCtx.beginPath();
        this.previewCtx.arc(50, 60 + bounce, 15, 0, Math.PI);
        this.previewCtx.stroke();
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
            this.audioManager.setMusicVolume(e.target.value);
            this.settings.musicVolume = parseInt(e.target.value);
        });
        
        document.getElementById('soundVolume').addEventListener('input', (e) => {
            document.getElementById('soundValue').textContent = e.target.value + '%';
            this.audioManager.setSoundVolume(e.target.value);
            this.settings.soundVolume = parseInt(e.target.value);
        });
        
        document.getElementById('backgroundImage').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.imageManager.loadCustomImage(e.target.files[0], 'background')
                    .then(() => {
                        this.settings.customBackground = true;
                    })
                    .catch(error => console.error('Error loading background:', error));
            }
        });
        
        document.getElementById('characterImage').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.imageManager.loadCustomImage(e.target.files[0], 'character')
                    .then(() => {
                        this.settings.customCharacter = true;
                        this.drawCharacterPreview();
                    })
                    .catch(error => console.error('Error loading character:', error));
            }
        });
        
        document.getElementById('customMusic').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.audioManager.loadCustomAudio(e.target.files[0], 'background')
                    .then(() => {
                        this.settings.customMusic = true;
                    })
                    .catch(error => console.error('Error loading music:', error));
            }
        });
        
        document.getElementById('language').addEventListener('change', (e) => {
            this.settings.language = e.target.value;
        });
        
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancelSettings').addEventListener('click', () => this.showStartScreen());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
        
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

        // تحريك معاينة الشخصية
        setInterval(() => this.drawCharacterPreview(), 100);
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('levelDevilSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            this.settings = { ...this.settings, ...parsed };
        }
        
        // تطبيق الإعدادات
        document.getElementById('musicVolume').value = this.settings.musicVolume;
        document.getElementById('soundVolume').value = this.settings.soundVolume;
        document.getElementById('language').value = this.settings.language;
        
        document.getElementById('musicValue').textContent = this.settings.musicVolume + '%';
        document.getElementById('soundValue').textContent = this.settings.soundVolume + '%';
        
        this.audioManager.setMusicVolume(this.settings.musicVolume);
        this.audioManager.setSoundVolume(this.settings.soundVolume);
    }

    saveSettings() {
        localStorage.setItem('levelDevilSettings', JSON.stringify(this.settings));
        this.showStartScreen();
    }

    resetSettings() {
        localStorage.removeItem('levelDevilSettings');
        localStorage.removeItem('custom_background');
        localStorage.removeItem('custom_character');
        
        this.settings = {
            musicVolume: 50,
            soundVolume: 70,
            language: 'ar',
            customBackground: null,
            customCharacter: null,
            customMusic: null
        };
        
        this.loadSettings();
        this.imageManager.customImages = {};
        this.createDefaultImages().then(() => {
            this.drawCharacterPreview();
        });
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });
        
        this.screens[screenName].classList.remove('hidden');
        
        if (screenName === 'game') {
            this.audioManager.play('background');
        } else {
            this.audioManager.stop('background');
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
        this.audioManager.play('collision');
    }

    levelComplete() {
        this.gameState = 'levelComplete';
        this.showScreen('levelComplete');
        document.getElementById('completedLevel').textContent = this.level;
        this.audioManager.play('levelUp');
        
        this.score += 100 + (this.level * 10);
        this.updateUI();
    }

    nextLevel() {
        if (this.level < 100) {
            this.level++;
            this.timeLeft = Math.max(30, 90 - this.level);
            this.showScreen('game');
            this.gameState = 'playing';
            this.initializeLevel();
        } else {
            this.gameOver(); // كل المستويات اكتملت
        }
    }

    restartGame() {
        this.initializeGame();
        this.startGame();
    }

    exitGame() {
        // يمكن إضافة أي تنظيف هنا قبل الخروج
        alert('شكراً للعب Level Devil Game! 🎮');
    }

    initializeLevel() {
        this.platforms = [];
        this.obstacles = [];
        this.bombs = [];
        this.movingPlatforms = [];
        this.collectibles = [];
        
        this.player.x = 100;
        this.player.y = 400;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.animationState = 'idle';
        
        this.createLevelDesign();
        this.updateUI();
    }

    createLevelDesign() {
        const baseTime = Math.max(30, 90 - this.level);
        this.timeLeft = baseTime;
        
        // تصميم المستوى بناءً على رقم المستوى
        const platformCount = Math.min(15 + Math.floor(this.level / 2), 30);
        const obstacleCount = Math.min(5 + Math.floor(this.level / 3), 15);
        const bombCount = Math.min(3 + Math.floor(this.level / 5), 10);
        
        // منصات أفقية
        for (let i = 0; i < platformCount; i++) {
            const x = (i * 80) % 1000 + 50;
            const y = 400 + Math.sin(i * 0.5) * 50;
            const width = 70 + Math.random() * 30;
            
            this.platforms.push({
                x: x,
                y: y,
                width: width,
                height: 20,
                color: '#8B4513'
            });
        }
        
        // منصات متحركة في المستويات المتقدمة
        if (this.level > 10) {
            for (let i = 0; i < Math.min(3, Math.floor(this.level / 10)); i++) {
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
            const x = 150 + (i * 120) % 900;
            const y = 380 - Math.random() * 100;
            
            this.obstacles.push({
                x: x,
                y: y,
                width: 30,
                height: 30,
                color: '#FF0000',
                type: 'spike'
            });
        }
        
        // قنابل في المستويات المتقدمة
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
        
        // الهدف في نهاية المستوى
        this.goal = {
            x: 1100,
            y: 350,
            width: 40,
            height: 40,
            color: '#00FF00'
        };
    }

    handleInput() {
        this.player.velocityX = 0;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.velocityX = -this.player.speed;
            this.player.facingRight = false;
            this.player.animationState = 'running';
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.velocityX = this.player.speed;
            this.player.facingRight = true;
            this.player.animationState = 'running';
        }
        
        if (this.player.velocityX === 0) {
            this.player.animationState = 'idle';
        }
        
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && !this.player.isJumping) {
            this.player.velocityY = this.player.jumpPower;
            this.player.isJumping = true;
            this.player.animationState = 'jumping';
            this.audioManager.play('jump');
        }
    }

    updatePhysics() {
        if (this.isPaused) return;
        
        // تطبيق الجاذبية
        this.player.velocityY += this.gravity;
        
        // تحديث موقع اللاعب
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // الاحتكاك
        this.player.velocityX *= this.friction;
        
        // حدود الشاشة الجانبية
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // التحقق من السقوط
        if (this.player.y > this.canvas.height) {
            this.loseLife();
            return;
        }
        
        // تحديث المنصات المتحركة
        this.updateMovingPlatforms();
        
        // تحديث القنابل
        this.updateBombs();
        
        // الاصطدامات
        this.handlePlatformCollisions();
        this.handleObstacleCollisions();
        this.handleBombCollisions();
        this.handleGoalCollision();
        
        // تحديث الرسوم المتحركة
        this.updateAnimation();
    }

    updateMovingPlatforms() {
        this.movingPlatforms.forEach(platform => {
            platform.x += platform.speed * platform.direction;
            
            // عكس الاتجاه عند الوصول للحافة
            if (platform.x <= 0 || platform.x + platform.width >= this.canvas.width) {
                platform.direction *= -1;
            }
        });
    }

    updateBombs() {
        this.bombs.forEach(bomb => {
            if (bomb.active) {
                bomb.y += bomb.velocityY;
                
                // إعادة تعيين القنبلة إذا سقطت
                if (bomb.y > this.canvas.height) {
                    bomb.y = -50;
                    bomb.x = 100 + Math.random() * 1000;
                }
            }
        });
    }

    handlePlatformCollisions() {
        this.player.isJumping = true;
        let onPlatform = false;
        
        // الاصطدام بالمنصات الثابتة
        for (let platform of this.platforms) {
            if (this.isColliding(this.player, platform)) {
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    onPlatform = true;
                }
            }
        }
        
        // الاصطدام بالمنصات المتحركة
        for (let platform of this.movingPlatforms) {
            if (this.isColliding(this.player, platform)) {
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    onPlatform = true;
                    
                    // تحريك اللاعب مع المنصة
                    this.player.x += platform.speed * platform.direction;
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

    handleBombCollisions() {
        for (let bomb of this.bombs) {
            if (bomb.active && this.isColliding(this.player, bomb)) {
                this.audioManager.play('bomb');
                bomb.active = false;
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

    updateAnimation() {
        const now = Date.now();
        if (now - this.player.lastAnimationTime > 100) { // تحديث كل 100 مللي ثانية
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
        this.audioManager.play('collision');
        
        // إعادة تعيين موقع اللاعب
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
        if (this.gameState === 'playing' && !this.isPaused) {
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
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
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
        const bgImage = this.imageManager.getImage('background');
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
            
            // تفاصيل المنصة
            this.ctx.fillStyle = '#A0522D';
            for (let i = 0; i < platform.width; i += 10) {
                this.ctx.fillRect(platform.x + i, platform.y, 5, platform.height);
            }
        });
    }

    drawMovingPlatforms() {
        this.movingPlatforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // تأثير الحركة
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            
            if (obstacle.type === 'spike') {
                // رسم مسامير
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y);
                this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        });
    }

    drawBombs() {
        this.bombs.forEach(bomb => {
            if (bomb.active) {
                // جسم القنبلة
                this.ctx.fillStyle = bomb.color;
                this.ctx.beginPath();
                this.ctx.arc(bomb.x + bomb.width/2, bomb.y + bomb.height/2, bomb.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // فتيل القنبلة
                this.ctx.strokeStyle = '#8B0000';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(bomb.x + bomb.width/2, bomb.y);
                this.ctx.lineTo(bomb.x + bomb.width/2, bomb.y - 10);
                this.ctx.stroke();
                
                // تأثير وميض
                const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
                this.ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
                this.ctx.beginPath();
                this.ctx.arc(bomb.x + bomb.width/2, bomb.y + bomb.height/2, bomb.width/4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawGoal() {
        if (!this.goal) return;
        
        this.ctx.fillStyle = this.goal.color;
        this.ctx.beginPath();
        this.ctx.arc(
            this.goal.x + this.goal.width/2,
            this.goal.y + this.goal.height/2,
            this.goal.width/2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // تأثير وميض
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    drawPlayer() {
        const charImage = this.imageManager.getImage('character');
        
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
            // رسم الشخصية افتراضية مع رسوم متحركة
            this.ctx.save();
            
            if (!this.player.facingRight) {
                this.ctx.scale(-1, 1);
                this.ctx.translate(-this.canvas.width, 0);
            }
            
            const drawX = this.player.facingRight ? this.player.x : this.canvas.width - this.player.x - this.player.width;
            
            // جسم اللاعب
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(drawX, this.player.y, this.player.width, this.player.height);
            
            // تأثير الحركة للأرجل
            if (this.player.animationState === 'running') {
                const legOffset = Math.sin(this.player.animationFrame * Math.PI) * 5;
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(drawX + 10, this.player.y + this.player.height - 10, 8, 15 + legOffset);
                this.ctx.fillRect(drawX + this.player.width - 18, this.player.y + this.player.height - 10, 8, 15 - legOffset);
            } else {
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(drawX + 10, this.player.y + this.player.height - 10, 8, 15);
                this.ctx.fillRect(drawX + this.player.width - 18, this.player.y + this.player.height - 10, 8, 15);
            }
            
            // الوجه
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(drawX + 15, this.player.y + 15, 8, 8);
            this.ctx.fillRect(drawX + this.player.width - 23, this.player.y + 15, 8, 8);
            
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(drawX + 17, this.player.y + 17, 4, 4);
            this.ctx.fillRect(drawX + this.player.width - 21, this.player.y + 17, 4, 4);
            
            // الفم
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(drawX + this.player.width/2, this.player.y + 30, 8, 0, Math.PI);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        // تأثير الظل
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height + 5,
            this.player.width/2,
            5,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
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
        // تأثير الوقت المنتهي
        if (this.gameState === 'playing' && this.timeLeft <= 10) {
            this.ctx.save();
            this.ctx.globalAlpha = Math.sin(Date.now() / 200) * 0.3 + 0.2;
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
