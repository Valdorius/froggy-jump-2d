/**
 * Froggy Jump - 2D Вертикальный джемпер для Android / Web
 * Полноценная физика, процедурная генерация, анимация, Web Audio API,
 * управление касаниями и гироскопом (акселерометром).
 */

(function () {
  'use strict';

  // --- Настройки холста и мира ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let width = 480;
  let height = 800;
  let dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // --- Звуковой синтезатор (Web Audio API) ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('froggy_sound') !== 'false';
      this.adMuted = false;
    }

    setMuted(val) {
      this.adMuted = Boolean(val);
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('froggy_sound', this.enabled);
      return this.enabled;
    }

    playJump() {
      if (!this.enabled || this.adMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    playSuperJump() {
      if (!this.enabled || this.adMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.28);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      } catch (e) {}
    }

    playFlyCatch() {
      if (!this.enabled || this.adMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        // Двухтональный звонкий перелив
        [880, 1320].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = now + idx * 0.06;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.12);
        });
      } catch (e) {}
    }

    playBreak() {
      if (!this.enabled || this.adMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
      } catch (e) {}
    }

    playShield() {
      if (!this.enabled || this.adMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.linearRampToValueAtTime(780, now + 0.15);
        osc.frequency.linearRampToValueAtTime(1040, now + 0.3);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) {}
    }

    playGameOver() {
      if (!this.enabled || this.adMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [440, 370, 293].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = now + idx * 0.14;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.25, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.22);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.22);
        });
      } catch (e) {}
    }
  }

  const sound = new SoundManager();

  // --- Локализация (RU / EN) ---
  const I18N = {
    ru: {
      hud_score: 'Высота:',
      menu_title: 'Froggy Jump',
      menu_subtitle: 'Прыгай по кувшинкам, лови мушек и избегай сухих листьев!',
      menu_high: 'Лучший рекорд',
      btn_start: 'ИГРАТЬ (Enter)',
      pc_keys_title: '💻 <b>Управление на ПК:</b>',
      pc_arrows: 'Стрелочки',
      pc_alt: 'Альтернатива:',
      pc_pause: 'Пауза / Старт:',
      key_space: 'Пробел',
      tilt_label: '<span>📱</span> Наклон телефона (акселерометр)',
      controls_hint: '📱 На смартфоне: кнопки ◀ ▶, свайпы или наклон',
      pause_title: 'Пауза',
      pause_subtitle: 'Лягушонок отдыхает в пруду',
      btn_resume: 'ПРОДОЛЖИТЬ (Пробел)',
      btn_restart_pause: 'Заново',
      gameover_title: 'Бултых!',
      gameover_subtitle: 'Лягушонок упал в воду',
      new_record: 'НОВЫЙ РЕКОРД!',
      stat_score: 'Счет',
      stat_record: 'Рекорд',
      stat_flies: 'Поймано мушек',
      btn_revive: 'СПАСТИ ЛЯГУШОНКА (РЕКЛАМА)',
      btn_restart: 'ИГРАТЬ СНОВА (Enter / Пробел)',
      landscape_title: 'Поверните телефон',
      landscape_text: 'Для максимального удобства игра создана для вертикального режима.',
      // Floating game texts
      shield_saved: 'ЩИТ СПАС ВАС!',
      mega_jump: 'МЕГА ПРЫЖОК!',
      revived: 'ВОЗРОЖДЕНИЕ!',
      shield_bubble: 'ЩИТ-ПУЗЫРЬ!',
      wings_fly: 'ПОЛЕТ СТРЕКОЗЫ!'
    },
    en: {
      hud_score: 'Height:',
      menu_title: 'Froggy Jump',
      menu_subtitle: 'Hop on lily pads, catch juicy flies, and avoid brittle leaves!',
      menu_high: 'Best Record',
      btn_start: 'PLAY (Enter)',
      pc_keys_title: '💻 <b>PC Controls:</b>',
      pc_arrows: 'Arrow Keys',
      pc_alt: 'Alternative:',
      pc_pause: 'Pause / Start:',
      key_space: 'Space',
      tilt_label: '<span>📱</span> Tilt Device (Accelerometer)',
      controls_hint: '📱 Mobile: ◀ ▶ buttons, swipe or tilt',
      pause_title: 'Paused',
      pause_subtitle: 'Froggy is taking a rest in the pond',
      btn_resume: 'RESUME (Space)',
      btn_restart_pause: 'Restart',
      gameover_title: 'Splash!',
      gameover_subtitle: 'Froggy fell into the pond',
      new_record: 'NEW RECORD!',
      stat_score: 'Score',
      stat_record: 'Record',
      stat_flies: 'Flies Caught',
      btn_revive: 'REVIVE FROGGY (AD)',
      btn_restart: 'PLAY AGAIN (Enter / Space)',
      landscape_title: 'Please Rotate Device',
      landscape_text: 'This game is designed to be played in portrait mode.',
      // Floating game texts
      shield_saved: 'SHIELD SAVED YOU!',
      mega_jump: 'MEGA JUMP!',
      revived: 'REVIVED!',
      shield_bubble: 'SHIELD BUBBLE!',
      wings_fly: 'DRAGONFLY FLIGHT!'
    }
  };

  let currentLang = 'ru';

  function t(key) {
    const dict = I18N[currentLang] || I18N.ru;
    return dict[key] || key;
  }

  function setLanguage(lang) {
    if (lang !== 'ru' && lang !== 'en') lang = 'ru';
    currentLang = lang;
    localStorage.setItem('froggy_lang', lang);

    const dict = I18N[lang];

    const safeSetText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    const safeSetHTML = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };

    safeSetText('hud-score-label', dict.hud_score);
    safeSetText('menu-title', dict.menu_title);
    safeSetText('menu-subtitle', dict.menu_subtitle);
    safeSetText('menu-high-label', dict.menu_high);
    safeSetText('btn-start-text', dict.btn_start);
    safeSetHTML('pc-keys-title', dict.pc_keys_title);
    safeSetText('pc-keys-arrows-label', dict.pc_arrows);
    safeSetText('pc-keys-alt-label', dict.pc_alt);
    safeSetText('pc-keys-pause-label', dict.pc_pause);
    safeSetText('key-space', dict.key_space);
    safeSetHTML('tilt-label-text', dict.tilt_label);
    safeSetText('controls-hint-text', dict.controls_hint);
    safeSetText('pause-title', dict.pause_title);
    safeSetText('pause-subtitle', dict.pause_subtitle);
    safeSetText('btn-resume-text', dict.btn_resume);
    safeSetText('btn-restart-pause-text', dict.btn_restart_pause);
    safeSetText('gameover-title', dict.gameover_title);
    safeSetText('gameover-subtitle', dict.gameover_subtitle);
    safeSetText('new-record-text', dict.new_record);
    safeSetText('stat-score-label', dict.stat_score);
    safeSetText('stat-record-label', dict.stat_record);
    safeSetText('stat-flies-label', dict.stat_flies);
    safeSetText('btn-revive-text', dict.btn_revive);
    safeSetText('btn-restart-text', dict.btn_restart);
    safeSetText('landscape-title', dict.landscape_title);
    safeSetText('landscape-text', dict.landscape_text);

    // Кнопка в HUD и кнопки переключения в меню
    const btnLang = document.getElementById('btn-lang');
    if (btnLang) {
      btnLang.textContent = lang === 'ru' ? 'RU' : 'EN';
    }

    const btnRu = document.getElementById('btn-lang-ru');
    const btnEn = document.getElementById('btn-lang-en');
    if (btnRu) btnRu.classList.toggle('active', lang === 'ru');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
  }

  function detectLanguage() {
    const saved = localStorage.getItem('froggy_lang');
    if (saved === 'ru' || saved === 'en') return saved;

    if (window.PlatformBridge && window.PlatformBridge.language) {
      return window.PlatformBridge.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
    }

    const navLang = (navigator.language || navigator.userLanguage || 'ru').toLowerCase();
    return navLang.startsWith('ru') || navLang.startsWith('be') || navLang.startsWith('uk') ? 'ru' : 'en';
  }

  // --- Типы платформ ---
  const PLATFORM_TYPES = {
    NORMAL: 0,      // Стандартная кувшинка
    MOVING: 1,      // Движущаяся по горизонтали
    FRAGILE: 2,     // Сухой лист (ломается при прыжке)
    SPRING: 3,      // Кувшинка с грибом-пружиной
    DISAPPEAR: 4    // Исчезающий цветок
  };

  // --- Типы бонусов ---
  const ITEM_TYPES = {
    NONE: 0,
    FLY: 1,         // Мушка (+100 очков)
    WINGS: 2,       // Крылышки стрекозы (суперполет вверх 3.5 сек)
    SHIELD: 3       // Пузырь-щит (спасает от одного падения)
  };

  // --- Состояние игры ---
  const STATE = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAMEOVER: 3
  };

  let gameState = STATE.MENU;
  let score = 0;
  let highestAltitude = 0;
  let fliesCaught = 0;
  let highScore = parseInt(localStorage.getItem('froggy_highscore') || '0', 10);
  let cameraY = 0;
  let lastTime = 0;
  let revivesUsed = 0;

  // --- Управление ---
  const keys = { left: false, right: false };
  let touchTargetX = null;
  let tiltEnabled = localStorage.getItem('froggy_tilt') === 'true';
  let tiltValue = 0; // от -1 до 1

  // --- Частицы ---
  let particles = [];
  let floatingTexts = [];

  class Particle {
    constructor(x, y, color, size, vx, vy, life) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.vx = vx;
      this.vy = vy;
      this.maxLife = life;
      this.life = life;
      this.gravity = 0.15;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.life--;
    }

    draw(ctx, camY) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y - camY, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(text, x, y, color, size = 18) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.life = 45;
      this.maxLife = 45;
    }

    update() {
      this.y -= 1.2;
      this.life--;
    }

    draw(ctx, camY) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${this.size}px system-ui, sans-serif`;
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText(this.text, this.x, this.y - camY);
      ctx.restore();
    }
  }

  function addWaterSplash(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 1.2) + Math.random() * (Math.PI * 0.6);
      const speed = 2 + Math.random() * 4;
      particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        y,
        '#64ffda',
        2 + Math.random() * 2.5,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        25 + Math.random() * 15
      ));
    }
  }

  function addLeafShatter(x, y) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const colors = ['#8d6e63', '#a1887f', '#d7ccc8', '#6d4c41'];
      particles.push(new Particle(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 10,
        colors[Math.floor(Math.random() * colors.length)],
        2.5 + Math.random() * 3,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        35 + Math.random() * 20
      ));
    }
  }

  function addGoldenSparkles(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4.5;
      particles.push(new Particle(
        x,
        y,
        '#ffeb3b',
        2.5 + Math.random() * 2.5,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        30 + Math.random() * 15
      ));
    }
  }

  // --- Класс Лягушки ---
  class Frog {
    constructor() {
      this.width = 46;
      this.height = 42;
      this.reset(width / 2, height - 120);
    }

    reset(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = -10;
      this.maxSpeed = 7.5;
      this.acceleration = 0.85;
      this.friction = 0.86;
      this.gravity = 0.38;
      this.jumpPower = -12.2;
      this.facing = 1; // 1 = right, -1 = left
      this.hasShield = false;
      this.wingsTimer = 0; // Время полета стрекозы
      this.squish = 1; // Анимация сжатия/растяжения
      this.blinkTimer = 120;
      this.isBlinking = false;
    }

    update() {
      // Бонусный полет на крыльях
      if (this.wingsTimer > 0) {
        this.wingsTimer--;
        this.vy = -11;
        if (Math.random() < 0.35) {
          particles.push(new Particle(
            this.x + (Math.random() - 0.5) * 20,
            this.y + 15,
            '#ffe082',
            2,
            (Math.random() - 0.5) * 2,
            2 + Math.random() * 2,
            20
          ));
        }
      } else {
        // Обычная гравитация
        this.vy += this.gravity;
        if (this.vy > 14) this.vy = 14; // Предел скорости падения
      }

      // Горизонтальное управление
      let moveDir = 0;
      if (keys.left) moveDir -= 1;
      if (keys.right) moveDir += 1;

      // Сенсорное касание (тянемся к пальцу)
      if (touchTargetX !== null) {
        const diff = touchTargetX - this.x;
        if (Math.abs(diff) > 10) {
          moveDir = Math.sign(diff);
        }
      }

      // Управление наклоном (гироскоп)
      if (tiltEnabled && Math.abs(tiltValue) > 0.08) {
        moveDir = tiltValue * 1.5;
      }

      if (moveDir !== 0) {
        this.vx += moveDir * this.acceleration;
        this.facing = moveDir > 0 ? 1 : -1;
      }

      this.vx *= this.friction;
      if (Math.abs(this.vx) > this.maxSpeed) {
        this.vx = Math.sign(this.vx) * this.maxSpeed;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Бесшовный переход через границы экрана (Doodle Jump wrap)
      if (this.x < -this.width / 2) {
        this.x = width + this.width / 2;
      } else if (this.x > width + this.width / 2) {
        this.x = -this.width / 2;
      }

      // Анимация сплющивания при прыжке и падении
      if (this.vy < 0) {
        // Растягивается вертикально при взлете
        this.squish = Math.max(0.85, 1 - Math.abs(this.vy) * 0.02);
      } else {
        // Нормализуется при падении
        this.squish = Math.min(1.15, 1 + this.vy * 0.015);
      }

      // Морграние глаз
      this.blinkTimer--;
      if (this.blinkTimer <= 0) {
        this.isBlinking = true;
        if (this.blinkTimer < -6) {
          this.isBlinking = false;
          this.blinkTimer = 100 + Math.random() * 150;
        }
      }
    }

    jump(boost = 1) {
      this.vy = this.jumpPower * boost;
      this.squish = 0.7; // Резкое сжатие в момент отталкивания
      if (boost > 1.2) {
        sound.playSuperJump();
        addGoldenSparkles(this.x, this.y + 20);
        floatingTexts.push(new FloatingText(t('mega_jump'), this.x, this.y, '#ffd54f', 20));
      } else {
        sound.playJump();
        addWaterSplash(this.x, this.y + 20);
      }
    }

    draw(ctx, camY) {
      const drawX = this.x;
      const drawY = this.y - camY;

      ctx.save();
      ctx.translate(drawX, drawY);

      // Масштабирование по направлению взгляда и сплющивание
      const scaleX = (this.facing > 0 ? 1 : -1) / this.squish;
      const scaleY = this.squish;
      ctx.scale(scaleX, scaleY);

      // Крылья стрекозы при активном полете
      if (this.wingsTimer > 0) {
        const wingFlap = Math.sin(Date.now() * 0.05) * 0.5;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 241, 118, 0.75)';
        ctx.strokeStyle = '#fbc02d';
        ctx.lineWidth = 1.5;

        // Левое крыло
        ctx.beginPath();
        ctx.ellipse(-16, -6, 22, 9 + wingFlap * 4, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Правое крыло
        ctx.beginPath();
        ctx.ellipse(16, -6, 22, 9 - wingFlap * 4, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Задние лапки
      ctx.fillStyle = '#388e3c';
      // Левая лапка
      ctx.beginPath();
      ctx.ellipse(-16, 12, 9, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Правая лапка
      ctx.beginPath();
      ctx.ellipse(16, 12, 9, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Круглое зеленое тело
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.ellipse(0, 2, 21, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Светлый животик
      ctx.fillStyle = '#a5d6a7';
      ctx.beginPath();
      ctx.ellipse(0, 6, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Розовые щечки
      ctx.fillStyle = 'rgba(255, 138, 128, 0.65)';
      ctx.beginPath();
      ctx.arc(-11, 4, 4, 0, Math.PI * 2);
      ctx.arc(11, 4, 4, 0, Math.PI * 2);
      ctx.fill();

      // Глазки лягушонка (большие круглые бусинки)
      // Основы глаз (зеленые веки)
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.arc(-10, -12, 9, 0, Math.PI * 2);
      ctx.arc(10, -12, 9, 0, Math.PI * 2);
      ctx.fill();

      // Белки глаз
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-10, -12, 7, 0, Math.PI * 2);
      ctx.arc(10, -12, 7, 0, Math.PI * 2);
      ctx.fill();

      if (this.isBlinking) {
        // Линии закрытых глаз
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, -12);
        ctx.lineTo(-5, -12);
        ctx.moveTo(5, -12);
        ctx.lineTo(15, -12);
        ctx.stroke();
      } else {
        // Зрачки со смещением в сторону движения
        const pupilShiftX = this.vx * 0.4;
        const pupilShiftY = this.vy < 0 ? -1.5 : 1;
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(-10 + pupilShiftX, -12 + pupilShiftY, 3.8, 0, Math.PI * 2);
        ctx.arc(10 + pupilShiftX, -12 + pupilShiftY, 3.8, 0, Math.PI * 2);
        ctx.fill();

        // Белые блики в глазах (делают взгляд живым и милым)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-11.5 + pupilShiftX, -13.5 + pupilShiftY, 1.5, 0, Math.PI * 2);
        ctx.arc(8.5 + pupilShiftX, -13.5 + pupilShiftY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Улыбающийся ротик
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      if (this.vy < 0) {
        // Широкая довольная улыбка при взлете
        ctx.arc(0, 4, 6, 0.1 * Math.PI, 0.9 * Math.PI, false);
      } else {
        // Небольшой открытый ротик "о" при падении
        ctx.arc(0, 6, 4, 0, Math.PI * 2);
      }
      ctx.stroke();

      // Передние лапки
      ctx.fillStyle = '#388e3c';
      ctx.beginPath();
      ctx.arc(-7, 12, 3.5, 0, Math.PI * 2);
      ctx.arc(7, 12, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Защитный пузырь-щит
      if (this.hasShield) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(129, 212, 250, 0.28)';
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();

        // Блик на пузыре
        ctx.beginPath();
        ctx.ellipse(-14, -14, 8, 4, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }
  }

  // --- Класс Платформы ---
  class Platform {
    constructor(x, y, type = PLATFORM_TYPES.NORMAL) {
      this.x = x;
      this.y = y;
      this.width = 76;
      this.height = 16;
      this.type = type;
      this.broken = false;
      this.opacity = 1;
      this.fadeDir = -0.02;

      // Параметры для движущихся платформ
      this.speed = (1.2 + Math.random() * 1.8) * (Math.random() < 0.5 ? 1 : -1);

      // Бонус на платформе
      this.item = ITEM_TYPES.NONE;
      this.itemYOffset = 0;
    }

    update() {
      if (this.type === PLATFORM_TYPES.MOVING) {
        this.x += this.speed;
        if (this.x < 10) {
          this.x = 10;
          this.speed *= -1;
        } else if (this.x + this.width > width - 10) {
          this.x = width - 10 - this.width;
          this.speed *= -1;
        }
      } else if (this.type === PLATFORM_TYPES.DISAPPEAR) {
        this.opacity += this.fadeDir;
        if (this.opacity <= 0.15) {
          this.opacity = 0.15;
          this.fadeDir = 0.02;
        } else if (this.opacity >= 1) {
          this.opacity = 1;
          this.fadeDir = -0.02;
        }
      }

      // Анимация покачивания предмета
      this.itemYOffset = Math.sin(Date.now() * 0.006) * 4;
    }

    draw(ctx, camY) {
      if (this.broken) return;

      const drawY = this.y - camY;
      ctx.save();
      ctx.globalAlpha = this.opacity;

      if (this.type === PLATFORM_TYPES.NORMAL) {
        // Зеленая кувшинка
        this.drawLilyPad(ctx, this.x, drawY, '#43a047', '#2e7d32');
      } else if (this.type === PLATFORM_TYPES.MOVING) {
        // Сине-голубая водяная кувшинка
        this.drawLilyPad(ctx, this.x, drawY, '#00acc1', '#00838f');
      } else if (this.type === PLATFORM_TYPES.FRAGILE) {
        // Коричневый сухой хрупкий лист
        this.drawFragileLeaf(ctx, this.x, drawY);
      } else if (this.type === PLATFORM_TYPES.SPRING) {
        // Кувшинка с красным грибом-пружиной
        this.drawLilyPad(ctx, this.x, drawY, '#43a047', '#2e7d32');
        this.drawSpringMushroom(ctx, this.x + this.width / 2, drawY);
      } else if (this.type === PLATFORM_TYPES.DISAPPEAR) {
        // Полупрозрачный мистический фиолетовый лист
        this.drawLilyPad(ctx, this.x, drawY, '#ab47bc', '#7b1fa2');
      }

      // Отрисовка бонуса (если есть)
      if (this.item !== ITEM_TYPES.NONE) {
        this.drawItem(ctx, this.x + this.width / 2, drawY - 20 + this.itemYOffset);
      }

      ctx.restore();
    }

    drawLilyPad(ctx, x, y, primaryColor, secondaryColor) {
      const w = this.width;
      const h = this.height;

      // Тень под кувшинкой
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h + 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Тело кувшинки
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Прожилки кувшинки
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h / 2);
      ctx.lineTo(x + 10, y + h / 2);
      ctx.moveTo(x + w / 2, y + h / 2);
      ctx.lineTo(x + w - 10, y + h / 2);
      ctx.moveTo(x + w / 2, y + h / 2);
      ctx.lineTo(x + w * 0.3, y + 2);
      ctx.moveTo(x + w / 2, y + h / 2);
      ctx.lineTo(x + w * 0.7, y + 2);
      ctx.stroke();

      // Маленький цветок лотоса на краешке
      ctx.fillStyle = '#ff80ab';
      ctx.beginPath();
      ctx.arc(x + w - 12, y + 2, 4, 0, Math.PI * 2);
      ctx.arc(x + w - 8, y - 1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(x + w - 10, y + 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    drawFragileLeaf(ctx, x, y) {
      const w = this.width;
      const h = this.height;

      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Трещины в листе
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 2);
      ctx.lineTo(x + 28, y + h - 2);
      ctx.lineTo(x + 40, y + 4);
      ctx.lineTo(x + 58, y + h - 3);
      ctx.stroke();
    }

    drawSpringMushroom(ctx, mx, my) {
      // Ножка гриба
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(mx - 4, my - 12, 8, 12);

      // Шляпка гриба
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.arc(mx, my - 12, 11, Math.PI, 0, false);
      ctx.fill();

      // Белые точки на шляпке
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx - 4, my - 17, 2, 0, Math.PI * 2);
      ctx.arc(mx + 4, my - 17, 2, 0, Math.PI * 2);
      ctx.arc(mx, my - 14, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    drawItem(ctx, ix, iy) {
      if (this.item === ITEM_TYPES.FLY) {
        // Мушка / мошка
        ctx.save();
        // Крылышки
        const wingAngle = Math.sin(Date.now() * 0.04) * 0.4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(ix - 5, iy - 4, 7, 3, -0.4 + wingAngle, 0, Math.PI * 2);
        ctx.ellipse(ix + 5, iy - 4, 7, 3, 0.4 - wingAngle, 0, Math.PI * 2);
        ctx.fill();

        // Тельце мушки
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(ix, iy, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Блестящие золотистые глаза
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.arc(ix - 2, iy - 2, 1.2, 0, Math.PI * 2);
        ctx.arc(ix + 2, iy - 2, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (this.item === ITEM_TYPES.WINGS) {
        // Золотые крылья стрекозы
        ctx.fillStyle = '#ffca28';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪽', ix, iy + 6);
      } else if (this.item === ITEM_TYPES.SHIELD) {
        // Мыльный защитный пузырь
        ctx.beginPath();
        ctx.arc(ix, iy, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(129, 212, 250, 0.6)';
        ctx.strokeStyle = '#29b6f6';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ix - 4, iy - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // --- Мир и генерация платформ ---
  let platforms = [];
  let frog = new Frog();

  function initWorld() {
    platforms = [];
    particles = [];
    floatingTexts = [];
    cameraY = 0;
    score = 0;
    highestAltitude = 0;
    fliesCaught = 0;

    frog.reset(width / 2, height - 140);

    // Начальная надежная платформа под ногами
    const startPlat = new Platform(width / 2 - 40, height - 80, PLATFORM_TYPES.NORMAL);
    startPlat.width = 90;
    platforms.push(startPlat);

    // Заполняем экран начальными платформами
    let currentY = height - 160;
    while (currentY > -400) {
      generatePlatform(currentY);
      currentY -= 65 + Math.random() * 35;
    }

    updateUI();
  }

  function generatePlatform(y) {
    const margin = 35;
    const platX = margin + Math.random() * (width - 76 - margin * 2);

    // Выбор типа платформы в зависимости от высоты/счета
    let type = PLATFORM_TYPES.NORMAL;
    const progress = Math.min(1, Math.abs(y) / 8000);

    const rand = Math.random();
    if (rand < 0.22 && progress > 0.1) {
      type = PLATFORM_TYPES.MOVING;
    } else if (rand < 0.38 && progress > 0.2) {
      type = PLATFORM_TYPES.FRAGILE;
    } else if (rand < 0.50 && progress > 0.15) {
      type = PLATFORM_TYPES.SPRING;
    } else if (rand < 0.60 && progress > 0.3) {
      type = PLATFORM_TYPES.DISAPPEAR;
    }

    const plat = new Platform(platX, y, type);

    // Случайное добавление бонусов на безопасные платформы
    if (type === PLATFORM_TYPES.NORMAL || type === PLATFORM_TYPES.MOVING) {
      const itemRoll = Math.random();
      if (itemRoll < 0.28) {
        plat.item = ITEM_TYPES.FLY;
      } else if (itemRoll < 0.33) {
        plat.item = ITEM_TYPES.SHIELD;
      } else if (itemRoll < 0.38) {
        plat.item = ITEM_TYPES.WINGS;
      }
    }

    platforms.push(plat);
  }

  // --- Фоновый градиент по высоте ---
  function drawBackground(ctx, camY) {
    // Высота влияет на атмосферу: Болото -> Бамбуковый лес -> Закат -> Ночной космос
    const alt = Math.max(0, -camY);

    let grad = ctx.createLinearGradient(0, 0, 0, height);
    if (alt < 2500) {
      // Утро в пруду
      grad.addColorStop(0, '#134e5e');
      grad.addColorStop(1, '#71b280');
    } else if (alt < 6000) {
      // Бамбуковая роща / кроны деревьев
      grad.addColorStop(0, '#1b5e20');
      grad.addColorStop(0.5, '#2e7d32');
      grad.addColorStop(1, '#81c784');
    } else if (alt < 12000) {
      // Закатные облака
      grad.addColorStop(0, '#2c3e50');
      grad.addColorStop(0.5, '#fd746c');
      grad.addColorStop(1, '#ff9068');
    } else {
      // Космическая ночь со звездами
      grad.addColorStop(0, '#000428');
      grad.addColorStop(1, '#004e92');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Рисуем легкие декоративные светлячки на фоне
    ctx.fillStyle = 'rgba(255, 255, 200, 0.25)';
    const time = Date.now() * 0.001;
    for (let i = 0; i < 15; i++) {
      const fx = (Math.sin(time + i * 1.7) * 0.5 + 0.5) * width;
      const fy = ((i * 55 - (camY * 0.3) % height) + height) % height;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.8 + Math.sin(time * 3 + i) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Главный цикл игры ---
  function update() {
    if (gameState !== STATE.PLAYING) return;

    frog.update();

    // Камера плавно следует за лягушкой вверх
    const targetCameraY = frog.y - height * 0.52;
    if (targetCameraY < cameraY) {
      cameraY += (targetCameraY - cameraY) * 0.15;
    }

    // Подсчет высоты и очков
    const currentAltitude = Math.max(0, Math.floor(-frog.y + (height - 140)));
    if (currentAltitude > highestAltitude) {
      highestAltitude = currentAltitude;
    }
    score = Math.floor(highestAltitude / 6) + (fliesCaught * 100);
    updateHUD();

    // Коллизии лягушки с платформами (только при падении вниз!)
    if (frog.vy > 0) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (p.broken) continue;
        if (p.type === PLATFORM_TYPES.DISAPPEAR && p.opacity < 0.4) continue;

        const frogBottom = frog.y + frog.height / 2;
        const prevFrogBottom = frogBottom - frog.vy;

        // Проверяем пересечение с верхней гранью платформы
        if (
          frog.x + frog.width * 0.35 > p.x &&
          frog.x - frog.width * 0.35 < p.x + p.width &&
          prevFrogBottom <= p.y + 8 &&
          frogBottom >= p.y
        ) {
          // Приземлились на платформу!
          frog.y = p.y - frog.height / 2;

          if (p.type === PLATFORM_TYPES.FRAGILE) {
            // Сухой лист ломается
            p.broken = true;
            sound.playBreak();
            addLeafShatter(p.x + p.width / 2, p.y + p.height / 2);
            frog.jump(0.85); // Небольшой прыжок перед тем как сломается
          } else if (p.type === PLATFORM_TYPES.SPRING) {
            // Супер-прыжок от гриба
            frog.jump(1.85);
          } else {
            // Обычный прыжок
            frog.jump(1.0);
          }
          break;
        }
      }
    }

    // Сбор бонусов
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.item !== ITEM_TYPES.NONE) {
        const ix = p.x + p.width / 2;
        const iy = p.y - 20 + p.itemYOffset;
        const dist = Math.hypot(frog.x - ix, frog.y - iy);

        if (dist < 32) {
          if (p.item === ITEM_TYPES.FLY) {
            fliesCaught++;
            sound.playFlyCatch();
            addGoldenSparkles(ix, iy);
            floatingTexts.push(new FloatingText('+100 🪰', ix, iy, '#ffeb3b', 22));
          } else if (p.item === ITEM_TYPES.WINGS) {
            frog.wingsTimer = 210; // 3.5 секунды
            sound.playSuperJump();
            addGoldenSparkles(ix, iy);
            floatingTexts.push(new FloatingText(t('wings_fly'), ix, iy, '#ffe082', 20));
          } else if (p.item === ITEM_TYPES.SHIELD) {
            frog.hasShield = true;
            sound.playShield();
            addGoldenSparkles(ix, iy);
            floatingTexts.push(new FloatingText(t('shield_bubble'), ix, iy, '#80deea', 20));
          }
          p.item = ITEM_TYPES.NONE;
          updateHUD();
        }
      }
    }

    // Обновление платформ
    for (let i = 0; i < platforms.length; i++) {
      platforms[i].update();
    }

    // Удаление платформ, оставшихся далеко внизу
    platforms = platforms.filter(p => p.y < cameraY + height + 60);

    // Добавление новых платформ сверху
    const topPlatformY = platforms.reduce((min, p) => Math.min(min, p.y), Infinity);
    if (topPlatformY > cameraY - 200) {
      const nextY = topPlatformY - (68 + Math.random() * 45);
      generatePlatform(nextY);
    }

    // Обновление частиц и всплывающего текста
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      floatingTexts[i].update();
      if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    // Падение вниз (Game Over или спасение щитом)
    if (frog.y - cameraY > height + 50) {
      if (frog.hasShield) {
        // Щит спасает лягушонка!
        frog.hasShield = false;
        frog.y = cameraY + height - 100;
        frog.jump(1.6);
        sound.playShield();
        floatingTexts.push(new FloatingText(t('shield_saved'), frog.x, frog.y, '#80deea', 22));
      } else {
        triggerGameOver();
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    drawBackground(ctx, cameraY);

    // Отрисовка платформ
    for (let i = 0; i < platforms.length; i++) {
      platforms[i].draw(ctx, cameraY);
    }

    // Отрисовка частиц
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw(ctx, cameraY);
    }

    // Отрисовка лягушки
    frog.draw(ctx, cameraY);

    // Отрисовка всплывающего текста
    for (let i = 0; i < floatingTexts.length; i++) {
      floatingTexts[i].draw(ctx, cameraY);
    }
  }

  // --- ЖЕСТКИЙ ЛОК 60 FPS (Hard 60 FPS Frame Limiter) ---
  // На экранах 120/144/165/240 Гц лишние вызовы отсекаются, гарантируя строго 60 FPS
  const TARGET_FPS = 60;
  const FRAME_INTERVAL = 1000 / TARGET_FPS; // 16.66667 мс
  let lastFrameTime = 0;

  function gameLoop(time) {
    requestAnimationFrame(gameLoop);

    const now = typeof time === 'number' && time > 0 ? time : performance.now();

    if (!lastFrameTime) {
      lastFrameTime = now;
      update();
      render();
      return;
    }

    const elapsed = now - lastFrameTime;

    // Жесткое отсечение: если с прошлого кадра прошло меньше 16.6 мс, пропускаем
    if (elapsed < FRAME_INTERVAL) {
      return;
    }

    // Выравниваем время следующего кадра
    lastFrameTime = now - (elapsed % FRAME_INTERVAL);

    update();
    render();
  }

  // --- Интеграция с платформой (пауза, звук) ---
  window.onPlatformPauseChange = function (isPaused) {
    if (isPaused) {
      if (gameState === STATE.PLAYING) {
        pauseGame();
      }
    }
  };

  window.onPlatformAudioChange = function (isAudioEnabled) {
    sound.setMuted(!isAudioEnabled);
  };

  // --- Управление состояниями игры ---
  function startGame() {
    sound.init();
    revivesUsed = 0;
    initWorld();
    gameState = STATE.PLAYING;
    document.getElementById('menu-modal').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
    document.getElementById('pause-modal').classList.add('hidden');
    lastFrameTime = performance.now();
    if (window.PlatformBridge) {
      window.PlatformBridge.gameplayStart();
    }
  }

  function pauseGame() {
    if (gameState === STATE.PLAYING) {
      gameState = STATE.PAUSED;
      document.getElementById('pause-modal').classList.remove('hidden');
      if (window.PlatformBridge) {
        window.PlatformBridge.gameplayStop();
      }
    }
  }

  function resumeGame() {
    if (gameState === STATE.PAUSED) {
      gameState = STATE.PLAYING;
      document.getElementById('pause-modal').classList.add('hidden');
      lastFrameTime = performance.now();
      if (window.PlatformBridge) {
        window.PlatformBridge.gameplayStart();
      }
    }
  }

  function triggerGameOver() {
    gameState = STATE.GAMEOVER;
    sound.playGameOver();
    if (window.PlatformBridge) {
      window.PlatformBridge.gameplayStop();
    }

    let isNewRecord = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('froggy_highscore', highScore);
      isNewRecord = true;
    }

    if (window.PlatformBridge) {
      window.PlatformBridge.saveProgress({ highScore });
    }

    document.getElementById('final-score').textContent = score;
    document.getElementById('final-high').textContent = highScore;
    document.getElementById('final-flies').textContent = fliesCaught;

    const recordBadge = document.getElementById('new-record-badge');
    if (recordBadge) {
      recordBadge.style.display = isNewRecord ? 'block' : 'none';
    }

    const btnRevive = document.getElementById('btn-revive');
    if (btnRevive) {
      btnRevive.style.display = revivesUsed < 1 ? 'block' : 'none';
    }

    document.getElementById('gameover-modal').classList.remove('hidden');
  }

  function reviveFrog() {
    revivesUsed++;
    let targetPlatform = null;
    let minDiff = Infinity;
    for (const p of platforms) {
      const screenY = p.y - cameraY;
      if (screenY > 100 && screenY < height - 60) {
        if (Math.abs(screenY - (height - 180)) < minDiff) {
          minDiff = Math.abs(screenY - (height - 180));
          targetPlatform = p;
        }
      }
    }

    if (targetPlatform) {
      frog.x = targetPlatform.x + targetPlatform.width / 2;
      frog.y = targetPlatform.y - frog.height / 2;
    } else {
      frog.x = width / 2;
      frog.y = cameraY + height - 160;
      const safePlat = new Platform(frog.x - 45, frog.y + 40, PLATFORM_TYPES.NORMAL);
      safePlat.width = 90;
      platforms.push(safePlat);
    }

    frog.vx = 0;
    frog.hasShield = true;
    frog.jump(1.6);
    gameState = STATE.PLAYING;
    document.getElementById('gameover-modal').classList.add('hidden');
    lastFrameTime = performance.now();
    floatingTexts.push(new FloatingText(t('revived'), frog.x, frog.y, '#ffd54f', 24));
    if (window.PlatformBridge) {
      window.PlatformBridge.gameplayStart();
    }
  }

  function updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const fliesEl = document.getElementById('hud-flies');
    if (scoreEl) scoreEl.textContent = score;
    if (fliesEl) fliesEl.textContent = fliesCaught;
  }

  function updateUI() {
    const highEl = document.getElementById('menu-high-score');
    if (highEl) highEl.textContent = highScore;
    updateHUD();
  }

  // --- Обработчики ввода (Сенсор, Клавиатура, Наклон) ---
  function setupInputHandlers() {
    // Клавиатура (ПК: стрелочки, WASD, Пробел, Enter, Escape)
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    const handleKey = (e, isDown) => {
      // Предотвращаем скролл страницы браузера стрелками и пробелом
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Spacebar'].includes(e.key)) {
        e.preventDefault();
      }

      // Стрелка влево или клавиша A (независимо от русской/английской раскладки через e.code)
      if (e.key === 'ArrowLeft' || e.code === 'KeyA' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
        keys.left = isDown;
        if (btnLeft) btnLeft.classList.toggle('active', isDown);
      }

      // Стрелка вправо или клавиша D
      if (e.key === 'ArrowRight' || e.code === 'KeyD' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        keys.right = isDown;
        if (btnRight) btnRight.classList.toggle('active', isDown);
      }

      // Действия только при нажатии (isDown = true)
      if (isDown) {
        sound.init();

        // Старт / Перезапуск игры клавишами Space или Enter
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          if (gameState === STATE.MENU) {
            startGame();
            return;
          }
          if (gameState === STATE.GAMEOVER) {
            restartGameWithAd();
            return;
          }
        }

        // Пауза / Продолжить
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape' || e.key === ' ' || e.code === 'Space') {
          if (gameState === STATE.PLAYING) {
            pauseGame();
          } else if (gameState === STATE.PAUSED) {
            resumeGame();
          }
        }
      }
    };

    window.addEventListener('keydown', e => handleKey(e, true));
    window.addEventListener('keyup', e => handleKey(e, false));

    const bindTouchButton = (btn, dir) => {
      const start = (e) => {
        e.preventDefault();
        sound.init();
        if (dir === 'left') keys.left = true;
        if (dir === 'right') keys.right = true;
        btn.classList.add('active');
      };
      const end = (e) => {
        e.preventDefault();
        if (dir === 'left') keys.left = false;
        if (dir === 'right') keys.right = false;
        btn.classList.remove('active');
      };
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    };

    if (btnLeft && btnRight) {
      bindTouchButton(btnLeft, 'left');
      bindTouchButton(btnRight, 'right');
    }

    // Касание по холсту (тач-перетаскивание лягушки)
    canvas.addEventListener('touchstart', (e) => {
      sound.init();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchTargetX = touch.clientX - rect.left;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchTargetX = touch.clientX - rect.left;
      }
    }, { passive: true });

    const clearTouch = () => { touchTargetX = null; };
    canvas.addEventListener('touchend', clearTouch);
    canvas.addEventListener('touchcancel', clearTouch);

    // Поддержка кликов и перетаскивания мыши
    let isMouseDown = false;
    canvas.addEventListener('mousedown', (e) => {
      sound.init();
      isMouseDown = true;
      const rect = canvas.getBoundingClientRect();
      touchTargetX = e.clientX - rect.left;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isMouseDown) {
        const rect = canvas.getBoundingClientRect();
        touchTargetX = e.clientX - rect.left;
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
      touchTargetX = null;
    });

    // Управление гироскопом (акселерометром на Android)
    const setupOrientation = () => {
      window.addEventListener('deviceorientation', (e) => {
        if (!tiltEnabled) return;
        // e.gamma: наклон влево/вправо (-90 до 90 градусов)
        if (e.gamma !== null && e.gamma !== undefined) {
          const clamped = Math.max(-30, Math.min(30, e.gamma));
          tiltValue = clamped / 30; // от -1 до 1
        }
      });
    };
    setupOrientation();

    // Кнопка включения гироскопа
    const tiltToggle = document.getElementById('tilt-toggle');
    if (tiltToggle) {
      tiltToggle.checked = tiltEnabled;
      tiltToggle.addEventListener('change', () => {
        tiltEnabled = tiltToggle.checked;
        localStorage.setItem('froggy_tilt', tiltEnabled);
        // Запрос разрешения для iOS 13+ (на всякий случай)
        if (tiltEnabled && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission().catch(console.error);
        }
      });
    }

    // Кнопка звука
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      const updateSoundIcon = () => {
        soundBtn.textContent = sound.enabled ? '🔊' : '🔇';
      };
      updateSoundIcon();
      soundBtn.addEventListener('click', () => {
        sound.init();
        sound.toggle();
        updateSoundIcon();
      });
    }

    // Кнопка паузы
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        sound.init();
        pauseGame();
      });
    }

    // Переключение языка в HUD
    const btnLang = document.getElementById('btn-lang');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        sound.init();
        setLanguage(currentLang === 'ru' ? 'en' : 'ru');
      });
    }

    // Переключение языка в меню (RU / EN)
    const btnLangRu = document.getElementById('btn-lang-ru');
    if (btnLangRu) {
      btnLangRu.addEventListener('click', () => {
        sound.init();
        setLanguage('ru');
      });
    }
    const btnLangEn = document.getElementById('btn-lang-en');
    if (btnLangEn) {
      btnLangEn.addEventListener('click', () => {
        sound.init();
        setLanguage('en');
      });
    }

    // Кнопка возрождения (Rewarded Video)
    const btnRevive = document.getElementById('btn-revive');
    if (btnRevive) {
      btnRevive.addEventListener('click', () => {
        sound.init();
        if (window.PlatformBridge) {
          window.PlatformBridge.showRewardedVideo(() => {
            reviveFrog();
          });
        } else {
          reviveFrog();
        }
      });
    }

    // Перезапуск с показом рекламы (с учетом кулдауна)
    const restartGameWithAd = () => {
      sound.init();
      if (window.PlatformBridge) {
        window.PlatformBridge.showFullscreenAdv(() => {
          startGame();
        });
      } else {
        startGame();
      }
    };

    // Кнопки интерфейса
    document.getElementById('btn-start').addEventListener('click', () => {
      sound.init();
      startGame();
    });
    document.getElementById('btn-resume').addEventListener('click', () => {
      sound.init();
      resumeGame();
    });
    document.getElementById('btn-restart').addEventListener('click', restartGameWithAd);
    document.getElementById('btn-restart-pause').addEventListener('click', restartGameWithAd);
  }

  // --- Инициализация при старте ---
  window.addEventListener('DOMContentLoaded', async () => {
    resizeCanvas();
    setupInputHandlers();
    initWorld();
    setLanguage(detectLanguage());
    updateUI();

    if (window.PlatformBridge) {
      await window.PlatformBridge.init();
      // Если игрок не сохранял выбор вручную, применяем язык платформы
      if (!localStorage.getItem('froggy_lang')) {
        setLanguage(detectLanguage());
      }
      try {
        const saved = await window.PlatformBridge.loadProgress();
        if (saved && saved.highScore !== undefined) {
          if (saved.highScore > highScore) {
            highScore = saved.highScore;
            localStorage.setItem('froggy_highscore', highScore);
            updateUI();
          }
        }
      } catch (e) {}
    }

    requestAnimationFrame(gameLoop);
  });

})();
