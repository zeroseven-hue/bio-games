/**
 * 生物能量祖瑪 (Bio-Zuma Quest) - 核心遊戲引擎
 * 採用高質感擬真晶球渲染、Web Audio API 多段和弦階梯音效、快節奏短題庫、正解消除換題、
 * 遠程神射 (Long Shot) 與大廳一標準評量結算模組 (score-submit-modal.js)。
 */

// =============================================================================
// 1. Web Audio API 音效合成器 (多段和弦音階階梯 + 零延遲)
// =============================================================================
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) {
                this.ctx = new AudioCtxClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return !this.isMuted;
    }

    // 發射咻聲 (雷射滑音)
    playShoot() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // 彩球撞擊入鏈 (短促清脆木質/晶體打擊)
    playImpact() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // 單純消除啵啵聲 (基底清脆音)
    playPop() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.11); // B5

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    // 經典祖瑪 Combo 階梯和弦 (登！登！登！多音階疊加)
    playComboChord(combo) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // 和弦音高表 (C5, E5, G5, C6, E6, G6)
        const chordFreqs = [
            [523.25, 659.25],          // Combo 1
            [659.25, 783.99],          // Combo 2
            [783.99, 1046.50],         // Combo 3
            [1046.50, 1318.51, 1567.98] // Combo 4+ 終極三和弦
        ];

        const notes = chordFreqs[Math.min(combo - 1, chordFreqs.length - 1)];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.03);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.22);

            gain.gain.setValueAtTime(0.28, now + idx * 0.03);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.03);
            osc.stop(now + 0.25);
        });
    }

    // 遠程神射音效 (清脆金幣泛音)
    playLongShot() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        [880, 1760].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(0.25, now + i * 0.05);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.05);
            osc.stop(now + 0.3);
        });
    }

    // 終點黑洞危機脈衝警報
    playWarning() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.2);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // 題目答對通關音 (清脆升三度通關和音)
    playStageClear() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.25, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + 0.45);
        });
    }
}

// =============================================================================
// 2. 快節奏生物短題庫 (符合快問快答、字數簡短秒讀秒答)
// =============================================================================
const FAST_BIOLOGY_QUESTIONS = [
    {
        question: "植物葉綠體行光反應時，水分子分解後釋出的氣體是？",
        options: ["氧氣 (O2)", "二氧化碳 (CO2)", "水蒸氣 (H2O)", "氮氣 (N2)"],
        answer: 0
    },
    {
        question: "細胞內被譽為「能量貨幣」的高能分子是？",
        options: ["DNA 脫氧核糖核酸", "ATP 腺苷三磷酸", "葡萄糖 Glucose", "RNA 核糖核酸"],
        answer: 1
    },
    {
        question: "生物體內酵素（Enzyme）最主要的作用機制是？",
        options: ["增加反應物濃度", "降低活化能以加速反應", "提供反應所需能量", "改變生成物的種類"],
        answer: 1
    },
    {
        question: "植物進行光合作用中「碳反應（暗反應）」發生的場所是？",
        options: ["葉綠體葉綠餅", "葉綠體基質", "粒線體內膜", "細胞壁外層"],
        answer: 1
    },
    {
        question: "人體肌肉細胞缺氧時行無氧發酵，會產生何種物質引起痠痛？",
        options: ["酒精與碳酸", "乙酸與水", "乳酸 (Lactic acid)", "尿酸結晶"],
        answer: 2
    },
    {
        question: "真核細胞中專門進行有氧呼吸並大量合成 ATP 的胞器是？",
        options: ["內質網", "高基氏體", "核糖體", "粒線體 (Mitochondria)"],
        answer: 3
    },
    {
        question: "下列何種酵素在中性或偏弱鹼環境中具有最佳活性？",
        options: ["胃蛋白酶", "唾液澱粉酶", "胰蛋白酶", "鹽酸酵素"],
        answer: 2
    },
    {
        question: "光合作用合成的葡萄糖，通常以何種形式暫存於植物細胞？",
        options: ["澱粉 (Starch)", "纖維素", "甘油三酯", "蔗糖溶液"],
        answer: 0
    },
    {
        question: "酵母菌進行無氧發酵作用時，釋放出的主要代謝物為？",
        options: ["乳酸與水", "酒精與二氧化碳", "氧氣與葡萄糖", "丙酮酸與氨"],
        answer: 1
    },
    {
        question: "人體血液中，負責在肺與組織間運送氧氣的血球細胞是？",
        options: ["紅血球 (RBC)", "白血球 (WBC)", "血小板 (Platelet)", "血漿蛋白"],
        answer: 0
    }
];

// =============================================================================
// 3. 遊戲全局常態與設定
// =============================================================================
const TOTAL_STAGES = 10;
const COLOR_CONFIG = {
    0: { name: 'A', hex: '#ef4444', gradientStart: '#f87171', gradientEnd: '#dc2626', glow: 'rgba(239, 68, 68, 0.7)' },
    1: { name: 'B', hex: '#3b82f6', gradientStart: '#60a5fa', gradientEnd: '#2563eb', glow: 'rgba(59, 130, 246, 0.7)' },
    2: { name: 'C', hex: '#10b981', gradientStart: '#34d399', gradientEnd: '#059669', glow: 'rgba(16, 185, 129, 0.7)' },
    3: { name: 'D', hex: '#f59e0b', gradientStart: '#fbbf24', gradientEnd: '#d97706', glow: 'rgba(245, 158, 11, 0.7)' }
};

const SPECIAL_TYPES = {
    NORMAL: 0,
    FREEZE: 1,  // ❄️ 冰凍球
    REVERSE: 2, // ⏪ 靜脈逆流球
    BOMB: 3     // 💣 ATP 爆破球
};

// Canvas 與引擎物件
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sfx = new SoundEngine();

let isGameRunning = false;
let isFreezeActive = false;
let freezeTimer = 0;
let reverseTimer = 0;
let screenShakeTimer = 0;
let screenShakeMagnitude = 0;

let currentStage = 1;
let currentQuestionIndex = 0;
let score = 0;
let comboCount = 0;
let maxComboAchieved = 0;
let longShotsAchieved = 0;
let lives = 3;
let safePeriodTimer = 0;

let questions = [];
let pathPoints = [];
let balls = [];
let bullets = [];
let particles = [];
let floatingTexts = [];

// 中央生物守護砲台 (Totem Turret)
const turret = {
    x: 480,
    y: 270,
    angle: 0,
    currentBallColor: 0,
    nextBallColor: 1,
    recoil: 0 // 發射後座力偏移
};

// =============================================================================
// 4. 生成雙螺旋古典雕刻軌道 (Parametric Dual Curve)
// =============================================================================
function generateTrackPath() {
    pathPoints = [];
    const centerX = 480;
    const centerY = 270;
    const totalSteps = 1200;

    // 寬闊橢圓雙迴旋軌道，避免中央砲台被遮擋
    for (let i = 0; i < totalSteps; i++) {
        const t = i / totalSteps;
        const angle = t * Math.PI * 4.6;
        const radiusX = 410 - t * 240;
        const radiusY = 220 - t * 125;

        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;
        pathPoints.push({ x, y, angle });
    }
}

// =============================================================================
// 5. 彩球類別 (Ball) - 高質感 3D 晶體折射球
// =============================================================================
class Ball {
    constructor(color, distance = 0, specialType = SPECIAL_TYPES.NORMAL) {
        this.color = color;
        this.distance = distance;
        this.radius = 14;
        this.specialType = specialType;
        this.x = 0;
        this.y = 0;
        this.updatePosition();
    }

    updatePosition() {
        const idx = Math.floor(this.distance);
        if (idx >= 0 && idx < pathPoints.length) {
            this.x = pathPoints[idx].x;
            this.y = pathPoints[idx].y;
        } else if (idx >= pathPoints.length) {
            const last = pathPoints[pathPoints.length - 1];
            this.x = last.x;
            this.y = last.y;
        }
    }

    draw(ctx) {
        if (this.distance < 0) return; // 尚未進入軌道不繪製
        ctx.save();
        ctx.translate(this.x, this.y);

        const config = COLOR_CONFIG[this.color];

        // 1. 底層陰影
        ctx.beginPath();
        ctx.arc(2, 3, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();

        // 2. 外部微光光暈 (若是正解球有呼吸感)
        const isTargetColor = (questions[currentQuestionIndex] && this.color === questions[currentQuestionIndex].answer);
        if (isTargetColor) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
            ctx.fillStyle = config.glow;
            ctx.fill();
        }

        // 3. 擬真 3D 寶石徑向球體漸層
        const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, config.gradientStart);
        grad.addColorStop(0.85, config.gradientEnd);
        grad.addColorStop(1, '#000000');

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 4. 晶體表面高光弧面
        ctx.beginPath();
        ctx.ellipse(-3, -5, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fill();

        // 5. 標籤文字 (A, B, C, D) 或特殊技能圖示
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;

        let displaySymbol = config.name;
        if (this.specialType === SPECIAL_TYPES.FREEZE) displaySymbol = '❄️';
        if (this.specialType === SPECIAL_TYPES.REVERSE) displaySymbol = '⏪';
        if (this.specialType === SPECIAL_TYPES.BOMB) displaySymbol = '💣';

        ctx.fillText(displaySymbol, 0, 1);
        ctx.restore();
    }
}

// =============================================================================
// 6. 子彈類別 (Bullet)
// =============================================================================
class Bullet {
    constructor(x, y, angle, color) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.color = color;
        this.speed = 18; // 高速穿透發射
        this.radius = 13;
        this.active = true;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // 出界銷毀
        if (this.x < -30 || this.x > canvas.width + 30 || this.y < -30 || this.y > canvas.height + 30) {
            this.active = false;
        }
    }

    getTravelDistance() {
        return Math.hypot(this.x - this.startX, this.y - this.startY);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const config = COLOR_CONFIG[this.color];
        // 拖尾光芒
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = config.glow;
        ctx.fill();

        // 實體球
        const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, config.gradientStart);
        grad.addColorStop(1, config.gradientEnd);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.name, 0, 1);

        ctx.restore();
    }
}

// =============================================================================
// 7. 粒子特效類別 (Particle)
// =============================================================================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const speed = Math.random() * 5 + 2;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.12; // 輕微重力
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// =============================================================================
// 8. 懸浮戰鬥飄字 (Floating Popups)
// =============================================================================
class FloatingText {
    constructor(x, y, text, color = '#fbbf24') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.alpha = 1;
        this.scale = 0.6;
    }

    update() {
        this.y -= 1.2;
        this.scale = Math.min(1.2, this.scale + 0.08);
        this.alpha -= 0.02;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.font = '900 16px "Zen Maru Gothic", Orbitron, sans-serif';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

// =============================================================================
// 9. 題庫讀取與快問快答過濾
// =============================================================================
async function loadBiologyQuestions() {
    // 優先檢查 URL 參數
    const params = new URLSearchParams(window.location.search);
    const unitParam = params.get('unit') || params.get('file');

    try {
        let fetchUrl = 'questions.json';
        if (unitParam) {
            fetchUrl = unitParam.startsWith('http') || unitParam.startsWith('../') 
                ? unitParam 
                : `../questions/${unitParam}`;
        }

        const res = await fetch(fetchUrl);
        if (res.ok) {
            const data = await res.json();
            const rawList = Array.isArray(data) ? data : (data.questions || []);
            if (rawList.length > 0) {
                questions = filterAndFormatQuestions(rawList);
                console.log(`成功載入題庫：${fetchUrl}，共篩選出 ${questions.length} 題速答題`);
            }
        }
    } catch (e) {
        console.warn('載入外部題庫失敗，啟用內建 10 題快節奏生物題庫：', e.message);
    }

    if (!questions || questions.length === 0) {
        questions = [...FAST_BIOLOGY_QUESTIONS];
    }

    // 隨機打亂題目順序
    questions.sort(() => Math.random() - 0.5);
    currentQuestionIndex = 0;
    renderQuestionHUD();
}

// 題庫規格標準化 (只保留適合祖瑪節奏的短題目)
function filterAndFormatQuestions(rawList) {
    const valid = [];
    rawList.forEach(q => {
        let ansIndex = 0;
        if (typeof q.answer === 'string') {
            const upper = q.answer.trim().toUpperCase();
            if (upper === 'A') ansIndex = 0;
            else if (upper === 'B') ansIndex = 1;
            else if (upper === 'C') ansIndex = 2;
            else if (upper === 'D') ansIndex = 3;
            else ansIndex = parseInt(upper, 10) || 0;
        } else if (typeof q.answer === 'number') {
            ansIndex = q.answer;
        }

        const text = q.question || q.title || '';
        const opts = q.options || ['A', 'B', 'C', 'D'];

        // 若題幹太長，做智能縮減或優先保留短題
        if (text && opts.length >= 4) {
            valid.push({
                question: text.length > 45 ? text.slice(0, 42) + '...' : text,
                options: opts.slice(0, 4),
                answer: ansIndex
            });
        }
    });

    return valid.length >= 10 ? valid : [...FAST_BIOLOGY_QUESTIONS];
}

// =============================================================================
// 10. HUD 介面渲染更新
// =============================================================================
function renderQuestionHUD() {
    if (!questions || questions.length === 0) return;
    const q = questions[currentQuestionIndex];

    document.getElementById('stage-display').innerText = `進度：第 ${currentStage} / ${TOTAL_STAGES} 題`;
    document.getElementById('question-text').innerText = `Q${currentStage}. ${q.question}`;

    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    const cssClasses = ['opt-a', 'opt-b', 'opt-c', 'opt-d'];

    q.options.forEach((optText, idx) => {
        const card = document.createElement('div');
        const isTarget = (idx === q.answer);
        card.className = `opt-card ${cssClasses[idx]} ${isTarget ? 'target-answer' : ''}`;
        card.innerHTML = `
            <div class="opt-letter">${letters[idx]}</div>
            <div class="opt-text">${optText}</div>
        `;
        optionsGrid.appendChild(card);
    });

    updateHUDStats();
}

function updateHUDStats() {
    document.getElementById('score-display').innerText = score;
    document.getElementById('combo-display').innerText = comboCount;

    // 能量心核渲染
    const heartContainer = document.getElementById('lives-display');
    heartContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.className = `bio-heart ${i < lives ? 'full' : 'lost'}`;
        span.innerText = '💎';
        heartContainer.appendChild(span);
    }
}

// =============================================================================
// 11. 彩球鏈初始化與發射邏輯
// =============================================================================
function spawnBallChain(count = 22) {
    balls = [];
    const spacing = 28;
    for (let i = 0; i < count; i++) {
        const color = getRandomColorBiased();
        let specialType = SPECIAL_TYPES.NORMAL;

        // 7% 機率生成特殊球
        const rand = Math.random();
        if (rand < 0.025) specialType = SPECIAL_TYPES.FREEZE;
        else if (rand < 0.05) specialType = SPECIAL_TYPES.REVERSE;
        else if (rand < 0.075) specialType = SPECIAL_TYPES.BOMB;

        const distance = -i * spacing;
        balls.push(new Ball(color, distance, specialType));
    }
}

// 加權出球：題目正確答案出球機率提高至 45%，避免玩家等不到正解球
function getRandomColorBiased() {
    if (!questions[currentQuestionIndex]) return Math.floor(Math.random() * 4);
    const correctAns = questions[currentQuestionIndex].answer;
    if (Math.random() < 0.45) {
        return correctAns;
    }
    return Math.floor(Math.random() * 4);
}

function shootBullet() {
    if (!isGameRunning) return;
    sfx.init();
    sfx.playShoot();

    // 砲台後座力
    turret.recoil = 6;

    const b = new Bullet(turret.x, turret.y, turret.angle, turret.currentBallColor);
    bullets.push(b);

    // 換下一顆球
    turret.currentBallColor = turret.nextBallColor;
    turret.nextBallColor = getRandomColorBiased();
}

// =============================================================================
// 12. 核心物理循環與碰撞消除
// =============================================================================
let lastTimestamp = 0;
function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (isGameRunning) {
        update(dt);
    }
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // 1. 特效計時器
    if (freezeTimer > 0) freezeTimer -= dt;
    if (reverseTimer > 0) reverseTimer -= dt;
    if (safePeriodTimer > 0) safePeriodTimer -= dt;
    if (screenShakeTimer > 0) screenShakeTimer -= dt;

    if (turret.recoil > 0) {
        turret.recoil = Math.max(0, turret.recoil - dt * 25);
    }

    // 2. 推進速度運算 (安全期降速、冰凍停止、逆流後退)
    let moveSpeed = 48; // 基底像素/秒
    if (freezeTimer > 0) {
        moveSpeed = 0;
    } else if (reverseTimer > 0) {
        moveSpeed = -90;
    } else if (safePeriodTimer > 0) {
        moveSpeed = 15;
    }

    // 3. 推進彩球
    if (balls.length > 0) {
        const head = balls[0];
        head.distance += moveSpeed * dt;
        head.updatePosition();

        for (let i = 1; i < balls.length; i++) {
            const prev = balls[i - 1];
            const curr = balls[i];
            const idealDist = prev.distance - 28;

            if (curr.distance < idealDist) {
                // 緊密推擠推進
                curr.distance = idealDist;
            } else if (curr.distance > idealDist) {
                // 斷層磁吸碰合
                curr.distance -= 120 * dt;
            }
            curr.updatePosition();
        }

        // 終點黑洞吸入檢測
        if (head.distance >= pathPoints.length - 1) {
            triggerBallInHole();
        } else if (head.distance > pathPoints.length * 0.82) {
            // 黑洞警報
            sfx.playWarning();
        }
    } else {
        // 若全場無球，自動補充
        spawnBallChain(15);
    }

    // 4. 子彈移動與碰撞檢測
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.update();

        if (!b.active) {
            bullets.splice(i, 1);
            continue;
        }

        // 檢測與彩球碰撞
        for (let j = 0; j < balls.length; j++) {
            const ball = balls[j];
            if (ball.distance < 0) continue;

            const dist = Math.hypot(b.x - ball.x, b.y - ball.y);
            if (dist < b.radius + ball.radius) {
                b.active = false;
                sfx.playImpact();

                // 檢查是否達成「🎯 遠程神射 (Long Shot)」
                if (b.getTravelDistance() > 280) {
                    longShotsAchieved++;
                    score += 500;
                    sfx.playLongShot();
                    floatingTexts.push(new FloatingText(ball.x, ball.y - 20, '🎯 LONG SHOT! +500', '#fbbf24'));
                }

                // 插入彩球鏈
                const newBall = new Ball(b.color, ball.distance - 14);
                balls.splice(j, 0, newBall);

                // 執行消除連擊判定
                checkElimination(j);
                break;
            }
        }
    }

    // 5. 特效粒子與浮動文字更新
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        if (floatingTexts[i].alpha <= 0) floatingTexts.splice(i, 1);
    }
}

// 消除判定 (經典 3 顆以上連珠)
function checkElimination(startIndex) {
    if (startIndex < 0 || startIndex >= balls.length) return;

    const targetColor = balls[startIndex].color;
    const correctAns = questions[currentQuestionIndex].answer;

    let left = startIndex;
    let right = startIndex;

    while (left > 0 && balls[left - 1].color === targetColor) left--;
    while (right < balls.length - 1 && balls[right + 1].color === targetColor) right++;

    const count = right - left + 1;

    if (count >= 3) {
        comboCount++;
        maxComboAchieved = Math.max(maxComboAchieved, comboCount);

        const isCorrectAns = (targetColor === correctAns);
        const baseScore = isCorrectAns ? 400 : 150;
        const addScore = baseScore * count * comboCount;
        score += addScore;

        // 播放 Combo 階梯和弦音效
        sfx.playComboChord(comboCount);

        // 浮動文字
        let text = `COMBO x${comboCount}! +${addScore}`;
        if (comboCount >= 3) text = `🔥 SUPER COMBO x${comboCount}! +${addScore}`;
        floatingTexts.push(new FloatingText(balls[startIndex].x, balls[startIndex].y, text, isCorrectAns ? '#34d399' : '#38bdf8'));

        // 粒子噴發
        for (let i = left; i <= right; i++) {
            createExplosionParticles(balls[i].x, balls[i].y, COLOR_CONFIG[balls[i].color].hex);
            handleSpecialBall(balls[i]);
        }

        // 移除消除的彩球
        balls.splice(left, count);
        updateHUDStats();

        // 關鍵教學規則：【若擊中並消除了本題正確答案，立即過關換題！】
        if (isCorrectAns) {
            triggerStageClearSuccess();
            return;
        }

        // 磁吸閉合二次連鎖檢查
        setTimeout(() => {
            if (left > 0 && left < balls.length) {
                if (balls[left - 1].color === balls[left].color) {
                    checkElimination(left);
                }
            }
        }, 220);

    } else {
        // 未達成連擊，重置連擊計數
        comboCount = 0;
        updateHUDStats();
    }
}

// 觸發特殊功能球
function handleSpecialBall(ball) {
    if (ball.specialType === SPECIAL_TYPES.FREEZE) {
        freezeTimer = 5.0; // 冰凍 5 秒
        floatingTexts.push(new FloatingText(ball.x, ball.y, '❄️ 冰凍代謝凍結！', '#38bdf8'));
    } else if (ball.specialType === SPECIAL_TYPES.REVERSE) {
        reverseTimer = 2.5; // 逆流倒退
        floatingTexts.push(new FloatingText(ball.x, ball.y, '⏪ 靜脈瓣膜逆流！', '#a855f7'));
    } else if (ball.specialType === SPECIAL_TYPES.BOMB) {
        triggerBombExplosion(ball.x, ball.y);
        floatingTexts.push(new FloatingText(ball.x, ball.y, '💣 ATP 高能爆破！', '#f59e0b'));
    }
}

function triggerBombExplosion(centerX, centerY) {
    screenShakeTimer = 0.35;
    screenShakeMagnitude = 6;
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        const dist = Math.hypot(b.x - centerX, b.y - centerY);
        if (dist < 90) { // 爆破範圍
            createExplosionParticles(b.x, b.y, COLOR_CONFIG[b.color].hex);
            balls.splice(i, 1);
            score += 100;
        }
    }
    updateHUDStats();
}

// 正解通關成功換題
function triggerStageClearSuccess() {
    sfx.playStageClear();
    floatingTexts.push(new FloatingText(480, 230, '🎉 答對通關！PERFECT！', '#fbbf24'));

    screenShakeTimer = 0.25;
    screenShakeMagnitude = 4;

    // 彩球全體後退並給予安全緩衝讀題期
    balls.forEach(b => b.distance -= 180);
    safePeriodTimer = 3.0;

    if (currentStage >= TOTAL_STAGES) {
        // 完成全部 10 題闖關！觸發大廳成績結算！
        setTimeout(() => {
            endGameAndShowResult(true);
        }, 800);
    } else {
        currentStage++;
        currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
        renderQuestionHUD();
    }
}

// 彩球掉入終點黑洞（扣血保護）
function triggerBallInHole() {
    lives--;
    sfx.playWarning();
    screenShakeTimer = 0.4;
    screenShakeMagnitude = 8;

    floatingTexts.push(new FloatingText(480, 270, '⚠️ 能量流失！心核受損', '#ef4444'));

    if (lives <= 0) {
        // 生命用盡，結算成果
        updateHUDStats();
        setTimeout(() => {
            endGameAndShowResult(false);
        }, 600);
    } else {
        // 強制回彈倒退
        balls.forEach(b => b.distance -= 380);
        updateHUDStats();
    }
}

function createExplosionParticles(x, y, color) {
    for (let i = 0; i < 16; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// =============================================================================
// 13. 畫面繪製渲染 (古典神殿溝槽 + 晶瑩珠寶物理 + 守護砲台)
// =============================================================================
function render() {
    ctx.save();

    // 螢幕微震效果
    if (screenShakeTimer > 0) {
        const dx = (Math.random() - 0.5) * screenShakeMagnitude;
        const dy = (Math.random() - 0.5) * screenShakeMagnitude;
        ctx.translate(dx, dy);
    }

    // 1. 深邃秘境背景
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 繪製神殿古蹟石刻凹槽軌道
    if (pathPoints.length > 0) {
        // 外圍微亮邊框
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        ctx.lineWidth = 36;
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.65)';
        ctx.lineCap = 'round';
        ctx.stroke();

        // 凹槽陰影深邃層
        ctx.lineWidth = 30;
        ctx.strokeStyle = '#020617';
        ctx.stroke();

        // 軌道中心能量導引線
        ctx.lineWidth = 2;
        ctx.strokeStyle = safePeriodTimer > 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(51, 65, 85, 0.5)';
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 終點吞噬深淵 (渦流傳送門)
        const endPt = pathPoints[pathPoints.length - 1];
        const portalGrad = ctx.createRadialGradient(endPt.x, endPt.y, 4, endPt.x, endPt.y, 28);
        portalGrad.addColorStop(0, '#000000');
        portalGrad.addColorStop(0.5, '#7f1d1d');
        portalGrad.addColorStop(0.85, '#ef4444');
        portalGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(endPt.x, endPt.y, 28, 0, Math.PI * 2);
        ctx.fillStyle = portalGrad;
        ctx.fill();
    }

    // 3. 繪製軌道彩球
    for (let i = balls.length - 1; i >= 0; i--) {
        balls[i].draw(ctx);
    }

    // 4. 繪製中央生物守護砲台 (立體機甲圖騰)
    renderTotemTurret();

    // 5. 繪製飛行中的子彈
    bullets.forEach(b => b.draw(ctx));

    // 6. 繪製爆破粒子
    particles.forEach(p => p.draw(ctx));

    // 7. 繪製懸浮文字
    floatingTexts.forEach(ft => ft.draw(ctx));

    ctx.restore();
}

function renderTotemTurret() {
    ctx.save();
    ctx.translate(turret.x, turret.y);

    // 雷射瞄準引導虛線
    ctx.save();
    ctx.rotate(turret.angle);
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(800, 0);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.restore();

    // 砲台基座外環 (神殿古金紋路)
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();

    // 旋轉圖騰砲首 (含發射後座力)
    ctx.save();
    ctx.rotate(turret.angle);
    ctx.translate(-turret.recoil, 0);

    // 砲首金屬翼爪
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(14, -14);
    ctx.lineTo(34, -8);
    ctx.lineTo(34, 8);
    ctx.lineTo(14, 14);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.restore();

    // 砲台中央主發射晶球
    const mainConfig = COLOR_CONFIG[turret.currentBallColor];
    const mainGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14);
    mainGrad.addColorStop(0, '#ffffff');
    mainGrad.addColorStop(0.4, mainConfig.gradientStart);
    mainGrad.addColorStop(1, mainConfig.gradientEnd);

    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = mainGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainConfig.name, 0, 1);

    // 砲台側邊「備用次顆晶球」
    const nextConfig = COLOR_CONFIG[turret.nextBallColor];
    ctx.beginPath();
    ctx.arc(26, 26, 8, 0, Math.PI * 2);
    ctx.fillStyle = nextConfig.hex;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
}

// =============================================================================
// 14. 遊戲結算 (對接大廳一 score-submit-modal.js)
// =============================================================================
function endGameAndShowResult(isVictory) {
    isGameRunning = false;

    // 結算加權：通關獎勵 + 剩餘血量加成 + 連擊最高紀錄加成
    const lifeBonus = lives * 300;
    const finalScore = score + (isVictory ? 1000 : 0) + lifeBonus;

    const summaryText = isVictory
        ? `🏆 達成 10 題滿貫闖關！最高連擊 Combo x${maxComboAchieved}，遠程神射 ${longShotsAchieved} 次！`
        : `⚔️ 達成 ${currentStage - 1} 題挑戰，能量耗盡！最高連擊 Combo x${maxComboAchieved}！`;

    console.log('準備呼叫大廳成績結算模組:', { finalScore, summaryText });

    if (typeof window.showScoreSubmitModal === 'function') {
        window.showScoreSubmitModal({
            gameTitle: "生物能量祖瑪：光合呼吸大冒險",
            score: finalScore,
            scoreDisplay: `${finalScore} 分 (${summaryText})`,
            duration: "課堂速答挑戰"
        });
    } else {
        alert(`遊戲結束！\n${summaryText}\n獲得總分：${finalScore}`);
        location.reload();
    }
}

// =============================================================================
// 15. 控制事件綁定
// =============================================================================
function setupEventListeners() {
    function updateAim(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (clientX - rect.left) * scaleX;
        const mouseY = (clientY - rect.top) * scaleY;
        turret.angle = Math.atan2(mouseY - turret.y, mouseX - turret.x);
    }

    canvas.addEventListener('mousemove', (e) => {
        updateAim(e.clientX, e.clientY);
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        updateAim(e.clientX, e.clientY);
        shootBullet();
    });

    // 行動裝置觸控支援
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            updateAim(e.touches[0].clientX, e.touches[0].clientY);
            shootBullet();
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            updateAim(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    // 音效開關
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
        sfx.init();
        const enabled = sfx.toggleMute();
        document.getElementById('btn-sound-toggle').innerText = enabled ? '🔊' : '🔇';
    });

    // 返回大廳
    document.getElementById('btn-quit-game').addEventListener('click', () => {
        if (confirm('確定要結束目前祖瑪探險並返回遊戲大廳嗎？')) {
            window.location.href = '../index.html';
        }
    });

    // 開始遊戲按鈕
    document.getElementById('start-btn').addEventListener('click', () => {
        sfx.init();
        document.getElementById('overlay-screen').classList.remove('active');
        isGameRunning = true;
    });
}

// 支援外部 score-submit-modal.js 的自動啟動通知
window.addEventListener('biogame:start', () => {
    sfx.init();
    document.getElementById('overlay-screen').classList.remove('active');
    isGameRunning = true;
});

// =============================================================================
// 16. 應用程式入口
// =============================================================================
window.addEventListener('DOMContentLoaded', async () => {
    generateTrackPath();
    turret.currentBallColor = 0;
    turret.nextBallColor = 1;
    await loadBiologyQuestions();
    spawnBallChain(22);
    setupEventListeners();
    requestAnimationFrame(gameLoop);
});
