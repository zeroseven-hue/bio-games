/**
 * 生物能量祖瑪 (Bio-Zuma Quest) - 核心遊戲引擎 V3.0
 * 針對老師檢測反饋全面升級：
 * 1. 軌道向中央緊湊收縮，降低瞄準射擊距離與打擊難度。
 * 2. 徹底移除正解選項顏色高亮，公平測驗，絕不劇透洩漏答案。
 * 3. 題幹與選項文字智慧緊縮（15-28字），保證秒讀秒答。
 * 4. 支援「滑鼠右鍵 / 空白鍵」調換砲台彩球，避免卡球。
 * 5. 正解球命中軌道同色球即觸發【正解共鳴破壞】過關換題；若射中錯誤球則正常入鏈推進。
 * 6. 徹底消除登入前快閃，輸入座號後才優雅跳出玩法秘笈。
 */

// =============================================================================
// 1. Web Audio API 音效合成器
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

    playShoot() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playSwap() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

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

    playComboChord(combo) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const chordFreqs = [
            [523.25, 659.25],          // Combo 1
            [659.25, 783.99],          // Combo 2
            [783.99, 1046.50],         // Combo 3
            [1046.50, 1318.51, 1567.98] // Combo 4+
        ];

        const notes = chordFreqs[Math.min(combo - 1, chordFreqs.length - 1)];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.03);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.24);

            gain.gain.setValueAtTime(0.3, now + idx * 0.03);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.26);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.03);
            osc.stop(now + 0.26);
        });
    }

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
// 2. 備用生物快問快答題庫 (題幹與選項精簡版)
// =============================================================================
const FAST_BIOLOGY_QUESTIONS = [
    {
        question: "植物葉綠體行光反應時，水分子分解後釋出的氣體是？",
        options: ["氧氣 (O2)", "二氧化碳 (CO2)", "水蒸氣 (H2O)", "氮氣 (N2)"],
        answer: 0
    },
    {
        question: "細胞內被譽為「能量貨幣」的高能化合物是？",
        options: ["DNA", "ATP 腺苷三磷酸", "葡萄糖 Glucose", "RNA"],
        answer: 1
    },
    {
        question: "生物體內酵素（Enzyme）最主要的作用機制是？",
        options: ["增加反應物濃度", "降低活化能以加速反應", "提供反應所需能量", "改變生成物種類"],
        answer: 1
    },
    {
        question: "植物進行光合作用中「碳反應（暗反應）」發生的場所是？",
        options: ["葉綠餅", "基質 (Stroma)", "粒線體", "細胞壁"],
        answer: 1
    },
    {
        question: "人體肌肉細胞缺氧時行無氧發酵，會產生何種物質引起痠痛？",
        options: ["酒精", "乙酸", "乳酸 (Lactic acid)", "尿酸"],
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
// 3. 遊戲全局設定與狀態
// =============================================================================
const TOTAL_STAGES = 10;
const COLOR_CONFIG = {
    0: { name: 'A', hex: '#ef4444', gradientStart: '#f87171', gradientEnd: '#dc2626', glow: 'rgba(239, 68, 68, 0.75)' },
    1: { name: 'B', hex: '#3b82f6', gradientStart: '#60a5fa', gradientEnd: '#2563eb', glow: 'rgba(59, 130, 246, 0.75)' },
    2: { name: 'C', hex: '#10b981', gradientStart: '#34d399', gradientEnd: '#059669', glow: 'rgba(16, 185, 129, 0.75)' },
    3: { name: 'D', hex: '#f59e0b', gradientStart: '#fbbf24', gradientEnd: '#d97706', glow: 'rgba(245, 158, 11, 0.75)' }
};

const SPECIAL_TYPES = {
    NORMAL: 0,
    FREEZE: 1,  // ❄️ 冰凍球
    REVERSE: 2, // ⏪ 靜脈逆流球
    BOMB: 3     // 💣 ATP 爆破球
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sfx = new SoundEngine();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const stageBackdrop = document.createElement('canvas');
let trackStroke;
stageBackdrop.width = canvas.width;
stageBackdrop.height = canvas.height;
const forestFloor = new Image();
const guardianSprite = new Image();
forestFloor.addEventListener('load', () => {
    if (pathPoints.length) paintStageBackdrop();
});
forestFloor.src = 'art/forest-observatory.webp';
guardianSprite.src = 'art/jade-guardian-v2.webp';

let isGameRunning = false;
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
let answerArmed = false;
let roundAdvance = 0;
let isPractice = false;
let practiceCompleted = false;
let firstAnswerCorrect = 0;
let answeredThisQuestion = false;
const practiceQuestion = {
    question: '暖身試射：點選 B 裝填，再射向軌道上的 B。',
    options: ['A 球', 'B 球', 'C 球', 'D 球'],
    answer: 1
};

let manifestUnits = [];
let questions = [];
let pathPoints = [];
let balls = [];
let bullets = [];
let particles = [];
let floatingTexts = [];

// 中央生物圖騰砲台 (Totem Turret)
const turret = {
    x: 480,
    y: 270,
    angle: 0,
    currentBallColor: 0,
    recoil: 0
};

// =============================================================================
// 4. 生成緊湊適中的祖瑪雙迴旋軌道 (縮減距離，容易瞄準擊中)
// =============================================================================
function generateTrackPath() {
    pathPoints = [];
    const centerX = 480;
    const centerY = 270;
    const totalSteps = 1200;

    // 將半徑緊縮：外圈由 410 縮減至 340，內圈 220 縮減至 175，方便射擊
    for (let i = 0; i < totalSteps; i++) {
        const t = i / totalSteps;
        const angle = t * Math.PI * 4.4;
        const radiusX = 340 - t * 200;
        const radiusY = 185 - t * 105;

        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;
        pathPoints.push({ x, y, angle });
    }
    paintStageBackdrop();
}

// =============================================================================
// 5. 彩球類別 (Ball) - 高質感 3D 琉璃晶珠
// =============================================================================
class Ball {
    constructor(color, distance = 0, specialType = SPECIAL_TYPES.NORMAL) {
        this.color = color;
        this.distance = distance;
        this.radius = 14;
        this.specialType = specialType;
        this.x = 0;
        this.y = 0;
        this.spin = 0;
        this.updatePosition();
    }

    updatePosition() {
        const idx = Math.floor(this.distance);
        if (idx >= 0 && idx < pathPoints.length) {
            this.x = pathPoints[idx].x;
            this.y = pathPoints[idx].y;
            this.spin = (this.distance * 0.15) % (Math.PI * 2);
        } else if (idx >= pathPoints.length) {
            const last = pathPoints[pathPoints.length - 1];
            this.x = last.x;
            this.y = last.y;
        }
    }

    draw(ctx) {
        if (this.distance < 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        const config = COLOR_CONFIG[this.color];

        // 1. 底層陰影
        ctx.beginPath();
        ctx.arc(2, 3, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fill();

        // 2. 擬真 3D 琉璃漸層
        const grad = ctx.createRadialGradient(-4, -5, 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.28, config.gradientStart);
        grad.addColorStop(0.85, config.gradientEnd);
        grad.addColorStop(1, '#05070e');

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 3. 高光弧斑
        ctx.beginPath();
        ctx.ellipse(-3, -5, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        // 4. 標籤文字 (A, B, C, D) 或特殊符號
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;

        let displaySymbol = config.name;
        if (this.specialType === SPECIAL_TYPES.FREEZE) displaySymbol = '❄️';
        if (this.specialType === SPECIAL_TYPES.REVERSE) displaySymbol = '⏪';
        if (this.specialType === SPECIAL_TYPES.BOMB) displaySymbol = '💣';

        ctx.fillText(config.name, 0, 1);
        if (this.specialType !== SPECIAL_TYPES.NORMAL) {
            ctx.font = '11px system-ui, sans-serif';
            ctx.fillText(displaySymbol, 9, -10);
        }
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
        this.speed = 26;
        this.radius = 13;
        this.active = true;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

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
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = config.glow;
        ctx.fill();

        const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, config.gradientStart);
        grad.addColorStop(1, config.gradientEnd);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.name, 0, 1);

        ctx.restore();
    }
}

// =============================================================================
// 7. 粒子特效與浮動文字
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
        this.vy += 0.12;
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
        ctx.font = '900 16px "Zen Maru Gothic", system-ui, sans-serif';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

// =============================================================================
// 8. 中央共用題庫管理
// =============================================================================
async function initQuestionBankSystem() {
    const unitSelect = document.getElementById('unitSelect');
    
    try {
        const res = await fetch('../questions/manifest.json');
        if (!res.ok) throw new Error('讀取 manifest.json 失敗');
        const manifest = await res.json();

        manifestUnits = [];
        unitSelect.innerHTML = '';

        if (manifest.publishers) {
            manifest.publishers.forEach(pub => {
                if (pub.semesters) {
                    pub.semesters.forEach(sem => {
                        if (sem.units) {
                            sem.units.forEach(u => {
                                manifestUnits.push({
                                    id: u.id,
                                    title: `${pub.name} [${sem.name}] ${u.title.replace(/\[.*?\]\s*/, '')}`,
                                    file: u.file
                                });
                            });
                        }
                    });
                }
            });
        }

        manifestUnits.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.file;
            opt.textContent = u.title;
            unitSelect.appendChild(opt);
        });

        const params = new URLSearchParams(window.location.search);
        const urlUnit = params.get('unit') || params.get('file');

        if (urlUnit) {
            const match = manifestUnits.find(u => u.file === urlUnit || u.id === urlUnit || u.file.includes(urlUnit));
            if (match) {
                unitSelect.value = match.file;
                await loadQuestionsFromFile(match.file);
                return;
            }
        }

        if (manifestUnits.length > 0) {
            unitSelect.value = manifestUnits[0].file;
            await loadQuestionsFromFile(manifestUnits[0].file);
        } else {
            fallbackLocalQuestions();
        }

    } catch (err) {
        console.warn('共用題庫載入失敗，切換為本地快問快答題庫：', err.message);
        fallbackLocalQuestions();
    }

    unitSelect.addEventListener('change', async (e) => {
        if (e.target.value) {
            await loadQuestionsFromFile(e.target.value);
            restartGameStage();
        }
    });
}

async function loadQuestionsFromFile(filePath) {
    try {
        const targetUrl = `../questions/${filePath}`;
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error('無法讀取單元檔案');
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data.questions || []);

        if (rawList.length > 0) {
            questions = filterQuestionsForZuma(rawList);
            if (!questions.length) throw new Error('題庫沒有有效的四選一題目');
            console.log(`已成功載入共用題庫單元：${filePath}，篩選出 ${questions.length} 題速答題`);
            currentQuestionIndex = 0;
            document.getElementById('question-source').textContent = questions.length + ' 題可用';
            renderQuestionHUD();
            return;
        }
    } catch (e) {
        console.warn('讀取共用題庫出錯，使用備援題庫：', e);
    }
    fallbackLocalQuestions();
}

function fallbackLocalQuestions() {
    questions = [...FAST_BIOLOGY_QUESTIONS];
    document.getElementById('question-source').textContent = '使用內建備援題庫';
    currentQuestionIndex = 0;
    renderQuestionHUD();
}

function filterQuestionsForZuma(rawList) {
    const list = [];
    for (const q of rawList) {
        const text = q?.question || q?.title;
        const options = q?.options;
        const key = String(q?.answer ?? '').trim().toUpperCase();
        const answer = /^[A-D]$/.test(key) ? key.charCodeAt(0) - 65 : /^[0-3]$/.test(key) ? Number(key) : -1;
        if (typeof text !== 'string' || !text.trim() || answer < 0 ||
            !Array.isArray(options) || options.length !== 4 ||
            options.some(option => typeof option !== 'string' || !option.trim())) continue;
        list.push({ question: text.trim(), options, answer,
            explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '' });
    }
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function currentQuestion() {
    return isPractice ? practiceQuestion : questions[currentQuestionIndex];
}

function setFeedback(message, tone = '') {
    const status = document.getElementById('shot-feedback');
    status.textContent = message;
    status.dataset.tone = tone;
}

// =============================================================================
// 9. HUD 介面渲染更新 (公平無劇透)
// =============================================================================
function renderQuestionHUD() {
    if (!questions || questions.length === 0) return;
    const q = currentQuestion();

    document.getElementById('stage-display').textContent = isPractice
        ? '不計分暖身' : '第 ' + currentStage + ' / ' + Math.min(TOTAL_STAGES, questions.length) + ' 題';
    document.getElementById('question-text').textContent = q.question;
    setFeedback(isPractice ? '先點 B 裝填，試射一球。' : '先讀題，再點選答案裝填。');

    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    const cssClasses = ['opt-a', 'opt-b', 'opt-c', 'opt-d'];

    // 依據題目四選項全部平等渲染，絕對不預先標註正確答案
    q.options.forEach((optText, idx) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'opt-card ' + cssClasses[idx];
        card.id = 'opt-card-' + idx;
        const letter = document.createElement('span');
        letter.className = 'opt-letter';
        letter.textContent = letters[idx];
        const label = document.createElement('span');
        label.className = 'opt-text';
        label.textContent = optText;
        card.append(letter, label);
        card.addEventListener('click', () => armAnswer(idx));
        optionsGrid.appendChild(card);
    });

    updateHUDStats();
}

function updateHUDStats() {
    document.getElementById('score-display').innerText = score;
    document.getElementById('combo-display').innerText = comboCount;

    const heartContainer = document.getElementById('lives-display');
    heartContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.className = `bio-heart ${i < lives ? 'full' : 'lost'}`;
        span.innerText = '💎';
        heartContainer.appendChild(span);
    }

    for (let i = 0; i < 4; i++) {
        const card = document.getElementById('opt-card-' + i);
        if (!card) continue;
        const selected = answerArmed && i === turret.currentBallColor;
        card.classList.toggle('currently-loaded', selected);
        card.setAttribute('aria-pressed', String(selected));
    }
}

function armAnswer(color) {
    if (!isGameRunning || roundAdvance > 0 || bullets.length ||
        document.getElementById('rules-modal').classList.contains('active')) return;
    if (isPractice && color !== practiceQuestion.answer) {
        setFeedback('暖身指定 B。請點 B 裝填。');
        return;
    }
    sfx.init();
    sfx.playSwap();
    turret.currentBallColor = color;
    answerArmed = true;
    setFeedback('已裝填 ' + COLOR_CONFIG[color].name + '，點軌道上的同字母球。', 'aim');
    updateHUDStats();
}

function spawnBallChain(count = 22) {
    const colors = [0, 1, 2, 3];
    for (let i = colors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [colors[i], colors[j]] = [colors[j], colors[i]];
    }
    balls = Array.from({ length: count }, (_, i) => {
        const rand = Math.random();
        const special = i < 8 || isPractice ? SPECIAL_TYPES.NORMAL :
            rand < 0.025 ? SPECIAL_TYPES.FREEZE :
            rand < 0.05 ? SPECIAL_TYPES.REVERSE :
            rand < 0.075 ? SPECIAL_TYPES.BOMB : SPECIAL_TYPES.NORMAL;
        return new Ball(colors[i % 4], 196 - i * 28, special);
    });
}

function makeTargetsReachable() {
    if (balls.length < 8) {
        spawnBallChain();
        return;
    }
    const head = Math.max(196, balls[0].distance);
    const first = balls.slice(0, 8);
    const visible = new Set(first.map(ball => ball.color));
    for (let color = 0; color < 4; color++) {
        if (!visible.has(color)) balls.splice(4, 0, new Ball(color));
    }
    balls.forEach((ball, i) => {
        ball.distance = head - i * 28;
        ball.updatePosition();
    });
}

function shootBullet() {
    if (!isGameRunning || roundAdvance > 0 || bullets.length) return;
    if (!answerArmed) {
        setFeedback('先點選一個答案裝填晶球。');
        return;
    }
    sfx.init();
    sfx.playShoot();
    turret.recoil = 6;
    bullets.push(new Bullet(turret.x, turret.y, turret.angle, turret.currentBallColor));
}

// =============================================================================
// 11. 核心物理循環與碰撞判定 (直覺過關核心)
// =============================================================================
let lastTimestamp = 0;
function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    if (isGameRunning && !document.getElementById('rules-modal').classList.contains('active')) {
        update(dt);
    }
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (roundAdvance > 0) {
        roundAdvance = Math.max(0, roundAdvance - dt);
        if (roundAdvance === 0) advanceRound();
    }
    if (answerArmed && freezeTimer > 0) freezeTimer -= dt;
    if (answerArmed && reverseTimer > 0) reverseTimer -= dt;
    if (answerArmed && safePeriodTimer > 0) safePeriodTimer -= dt;
    if (screenShakeTimer > 0) screenShakeTimer -= dt;

    if (turret.recoil > 0) {
        turret.recoil = Math.max(0, turret.recoil - dt * 25);
    }

    let moveSpeed = 34;
    if (freezeTimer > 0) {
        moveSpeed = 0;
    } else if (reverseTimer > 0) {
        moveSpeed = -90;
    } else if (safePeriodTimer > 0) {
        moveSpeed = 15;
    }

    if (isPractice || !answerArmed || roundAdvance > 0) moveSpeed = 0;

    if (balls.length > 0) {
        const head = balls[0];
        head.distance = Math.max(196, head.distance + moveSpeed * dt);
        head.updatePosition();

        for (let i = 1; i < balls.length; i++) {
            const prev = balls[i - 1];
            const curr = balls[i];
            const idealDist = prev.distance - 28;

            if (curr.distance < idealDist) {
                curr.distance = idealDist;
            } else if (curr.distance > idealDist) {
                curr.distance -= 120 * dt;
            }
            curr.updatePosition();
        }

        if (head.distance >= pathPoints.length - 1) {
            triggerBallInHole();
            return;
        } else if (head.distance > pathPoints.length * 0.82) {
            sfx.playWarning();
        }
    } else {
        spawnBallChain(15);
    }

    const shot = bullets[0];
    if (shot) {
        shot.update();
        const target = balls.findIndex(ball => ball.distance >= 0 &&
            Math.hypot(shot.x - ball.x, shot.y - ball.y) < shot.radius + ball.radius);
        if (target >= 0) {
            bullets.length = 0;
            resolveShot(shot, target);
        } else if (!shot.active) {
            bullets.length = 0;
            setFeedback('這球射偏了。保留目前裝填，再瞄一次。', 'aim');
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        if (floatingTexts[i].alpha <= 0) floatingTexts.splice(i, 1);
    }
}

function resolveShot(shot, target) {
    const hit = balls[target];
    if (hit.color !== shot.color) {
        setFeedback('碰到 ' + COLOR_CONFIG[hit.color].name + '。請瞄準同字母球。', 'aim');
        return;
    }
    sfx.playImpact();
    const question = currentQuestion();
    const correct = shot.color === question.answer;
    if (!isPractice && !answeredThisQuestion) {
        firstAnswerCorrect += Number(correct);
        answeredThisQuestion = true;
    }
    if (!correct) {
        answerArmed = false;
        comboCount = 0;
        updateHUDStats();
        setFeedback('這個選項不符合題意。再讀一次，換個答案試試。', 'retry');
        return;
    }

    const cleared = balls.splice(Math.max(0, target - 1), 3);
    for (const ball of cleared) {
        if (ball.distance >= 0) createExplosionParticles(ball.x, ball.y, COLOR_CONFIG[ball.color].hex);
        if (!isPractice) handleSpecialBall(ball);
    }
    if (isPractice) {
        setFeedback('試射成功！準備進入第一題。', 'success');
    } else {
        const longShot = shot.getTravelDistance() > 220;
        score += longShot ? 55 : 35;
        longShotsAchieved += Number(longShot);
        comboCount++;
        maxComboAchieved = Math.max(maxComboAchieved, comboCount);
        const explanation = question.explanation || '正解是「' + question.options[question.answer] + '」。';
        setFeedback('答對！清除 ' + cleared.length + ' 顆。' + explanation, 'success');
    }
    triggerStageClearSuccess();
}

function handleSpecialBall(ball) {
    if (ball.specialType === SPECIAL_TYPES.FREEZE) {
        freezeTimer = 5.0;
        floatingTexts.push(new FloatingText(ball.x, ball.y, '❄️ 冰凍代謝凍結！', '#38bdf8'));
    } else if (ball.specialType === SPECIAL_TYPES.REVERSE) {
        reverseTimer = 2.5;
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
        if (dist < 90) {
            createExplosionParticles(b.x, b.y, COLOR_CONFIG[b.color].hex);
            balls.splice(i, 1);
            score += 5;
        }
    }
    updateHUDStats();
}

function triggerStageClearSuccess() {
    sfx.playStageClear();
    answerArmed = false;
    roundAdvance = 2.2;
    screenShakeTimer = 0.18;
    screenShakeMagnitude = 3;
    updateHUDStats();
}

function advanceRound() {
    if (isPractice) {
        isPractice = false;
        practiceCompleted = true;
        spawnBallChain();
    } else {
        if (currentStage >= Math.min(TOTAL_STAGES, questions.length)) {
            endGameAndShowResult(true);
            return;
        }
        currentStage++;
        currentQuestionIndex++;
        balls.forEach(ball => { ball.distance -= 180; });
        makeTargetsReachable();
        safePeriodTimer = 3;
    }
    answeredThisQuestion = false;
    renderQuestionHUD();
}

function triggerBallInHole() {
    lives--;
    bullets.length = 0;
    answerArmed = false;
    sfx.playWarning();
    if (lives <= 0) {
        updateHUDStats();
        endGameAndShowResult(false);
        return;
    }
    balls.forEach(ball => { ball.distance -= 380; });
    makeTargetsReachable();
    updateHUDStats();
    setFeedback('球鏈抵達終點，失去一顆心核。重新裝填後再試。', 'retry');
}

function createExplosionParticles(x, y, color) {
    for (let i = 0; i < 16; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// =============================================================================
// 12. 畫面繪製渲染
// =============================================================================
// Static stonework is painted once when the track is generated.
function paintStageBackdrop() {
    const stage = stageBackdrop.getContext('2d');
    const { width, height } = stageBackdrop;
    const light = stage.createRadialGradient(480, 235, 26, 480, 290, 515);
    light.addColorStop(0, '#57715b');
    light.addColorStop(0.55, '#25463a');
    light.addColorStop(1, '#10221d');
    stage.fillStyle = light;
    stage.fillRect(0, 0, width, height);

    if (forestFloor.naturalWidth) {
        stage.drawImage(forestFloor, 0, 0, width, height);
        stage.fillStyle = '#11291f24';
        stage.fillRect(0, 0, width, height);
    }

    trackStroke = new Path2D();
    trackStroke.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (const point of pathPoints) trackStroke.lineTo(point.x, point.y);
    stage.lineCap = 'round';
    stage.lineJoin = 'round';
    // Cast shadow, weathered stone shoulders, and a recessed ball channel.
    stage.save();
    stage.translate(0, 4);
    stage.strokeStyle = '#08160fc9';
    stage.lineWidth = 46;
    stage.shadowColor = '#091910b3';
    stage.shadowBlur = 11;
    stage.stroke(trackStroke);
    stage.restore();

    const stone = stage.createLinearGradient(0, 65, 0, 490);
    stone.addColorStop(0, '#c7b78b');
    stone.addColorStop(0.48, '#7a826b');
    stone.addColorStop(1, '#505847');
    for (const [size, color] of [[44, '#333d30'], [41, stone], [33, '#414f3e'], [29, '#192a22']]) {
        stage.lineWidth = size;
        stage.strokeStyle = color;
        stage.stroke(trackStroke);
    }
    stage.lineWidth = 1;
    stage.strokeStyle = '#c1c3a34b';
    stage.setLineDash([2, 13]);
    stage.stroke(trackStroke);
    stage.setLineDash([]);

    const end = pathPoints[pathPoints.length - 1];
    const well = stage.createRadialGradient(end.x, end.y, 4, end.x, end.y, 23);
    well.addColorStop(0.35, '#080e0d');
    well.addColorStop(0.72, '#602f26');
    well.addColorStop(1, '#d39a6c');
    stage.beginPath();
    stage.arc(end.x, end.y, 23, 0, Math.PI * 2);
    stage.fillStyle = well;
    stage.fill();
    stage.lineWidth = 4;
    stage.strokeStyle = '#74644d';
    stage.stroke();
    stage.beginPath();
    stage.arc(end.x, end.y, 26, 0, Math.PI * 2);
    stage.lineWidth = 1;
    stage.strokeStyle = '#c6a677';
    stage.stroke();
}

function render() {
    ctx.save();

    if (screenShakeTimer > 0 && !reducedMotion.matches) {
        const dx = (Math.random() - 0.5) * screenShakeMagnitude;
        const dy = (Math.random() - 0.5) * screenShakeMagnitude;
        ctx.translate(dx, dy);
    }

    ctx.drawImage(stageBackdrop, 0, 0);
    if (safePeriodTimer > 0 && trackStroke) {
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#d6efaeab';
        ctx.setLineDash([3, 7]);
        ctx.stroke(trackStroke);
        ctx.restore();
    }

    // 3. 繪製彩球
    for (let i = balls.length - 1; i >= 0; i--) {
        balls[i].draw(ctx);
    }

    // 4. 繪製中央守護砲台
    renderTotemTurret();

    // 5. 子彈、粒子、懸浮字
    bullets.forEach(b => b.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    floatingTexts.forEach(ft => ft.draw(ctx));

    ctx.restore();
}

function renderTotemTurret() {
    ctx.save();
    ctx.translate(turret.x, turret.y);

    if (answerArmed) {
        ctx.save();
        ctx.rotate(turret.angle);
        ctx.beginPath();
        ctx.moveTo(48, 0);
        ctx.lineTo(800, 0);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#fff0bfa8';
        ctx.setLineDash([5, 8]);
        ctx.stroke();
        ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 7, 49, 38, 0, 0, Math.PI * 2);
    const shadow = ctx.createRadialGradient(0, 7, 10, 0, 7, 49);
    shadow.addColorStop(0, '#081711ba');
    shadow.addColorStop(1, '#08171100');
    ctx.fillStyle = shadow;
    ctx.fill();
    ctx.rotate(turret.angle);
    ctx.translate(-turret.recoil, 0);
    if (guardianSprite.naturalWidth) {
        ctx.drawImage(guardianSprite, -52, -54, 108, 108);
    } else {
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fillStyle = '#315848';
        ctx.fill();
        ctx.strokeStyle = '#c6a677';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.restore();

    // 砲口主發射晶球
    const mainConfig = answerArmed ? COLOR_CONFIG[turret.currentBallColor] : { gradientStart: '#92b5a4', gradientEnd: '#274b3d', name: '·' };
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
    ctx.font = '900 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainConfig.name, 0, 1);

    ctx.restore();
}

// =============================================================================
// 13. 遊戲結算
// =============================================================================
function endGameAndShowResult(isVictory) {
    isGameRunning = false;

    const lifeBonus = lives * 25; // 剩餘心核加成 (最多 75 分)
    const victoryBonus = isVictory ? 120 : 40; // 通關加成
    // 結算總分嚴格調控於 300 ~ 600 分區間 (符合課堂評量標準)
    const rawTotal = score + victoryBonus + lifeBonus;
    const finalScore = Math.min(600, Math.max(300, 300 + Math.round(rawTotal * 0.6)));

    const summaryText = isVictory
        ? `🏆 完成 ${currentStage} 題！首次答對 ${firstAnswerCorrect} 題。最高連擊 Combo x${maxComboAchieved}，遠程神射 ${longShotsAchieved} 次！`
        : `⚔️ 達成 ${currentStage - 1} 題挑戰，首次答對 ${firstAnswerCorrect} 題。最高連擊 Combo x${maxComboAchieved}！`;

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

function restartGameStage() {
    currentStage = 1;
    currentQuestionIndex = 0;
    answerArmed = false;
    answeredThisQuestion = false;
    firstAnswerCorrect = 0;
    roundAdvance = 0;
    bullets.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;
    freezeTimer = reverseTimer = safePeriodTimer = screenShakeTimer = 0;
    score = 0;
    comboCount = 0;
    maxComboAchieved = 0;
    longShotsAchieved = 0;
    lives = 3;
    spawnBallChain(22);
    renderQuestionHUD();
}

// =============================================================================
// 14. 事件綁定 (滑鼠與觸控共用射擊入口)
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

    canvas.addEventListener('pointermove', event => {
        updateAim(event.clientX, event.clientY);
    });
    canvas.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0) return;
        updateAim(event.clientX, event.clientY);
        shootBullet();
    });

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

    // 玩法說明彈窗開啟與關閉
    const rulesModal = document.getElementById('rules-modal');
    const openRules = () => {
        rulesModal.classList.add('active');
    };
    const closeRules = () => {
        rulesModal.classList.remove('active');
    };

    document.getElementById('btn-how-to-play').addEventListener('click', openRules);
    document.getElementById('btn-start-how-to').addEventListener('click', openRules);
    document.getElementById('btn-close-rules').addEventListener('click', closeRules);
    const start = () => {
        closeRules();
        sfx.init();
        document.getElementById('overlay-screen').classList.remove('active');
        if (isGameRunning) return;
        isPractice = !practiceCompleted;
        restartGameStage();
        isGameRunning = true;
    };
    document.getElementById('btn-understood').addEventListener('click', start);
    document.getElementById('start-btn').addEventListener('click', start);
}

// 監聽學生在班級座號外殼登入完成後的通知 (優雅彈出玩法秘笈，絕不快閃)
window.addEventListener('biogame:start', () => {
    sfx.init();
    // 登入完成後，彈出玩法說明供學生檢視
    const rulesModal = document.getElementById('rules-modal');
    if (rulesModal) {
        rulesModal.classList.add('active');
    } else {
        isGameRunning = true;
    }
});

// =============================================================================
// 15. 應用程式入口
// =============================================================================
window.addEventListener('DOMContentLoaded', async () => {
    generateTrackPath();
    turret.currentBallColor = 0;
    await initQuestionBankSystem();
    spawnBallChain(22);
    setupEventListeners();
    requestAnimationFrame(gameLoop);
});
