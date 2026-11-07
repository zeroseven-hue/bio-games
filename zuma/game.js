/**
 * 生物能量祖瑪 (Bio-Zuma Quest) - 核心遊戲引擎 V2.0
 * 支援：
 * 1. 中央共享題庫 (../questions/manifest.json) 版本、冊別、章節自動切換
 * 2. 完整遊戲規則圖文彈窗 (How-to-play Modal)
 * 3. 3D 浮雕石刻古文明軌道 + 晶瑩琉璃珠 (Specular Radial + Shadow + Spin)
 * 4. 多段和弦階梯 Combo 音階 (登！登！登！街機爽感)
 * 5. 命中正解即通關 (快節奏秒讀秒答)
 * 6. 大廳一標準身分與防作弊上傳 (score-submit-modal.js)
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
        osc.frequency.setValueAtTime(540, now);
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

    // 經典祖瑪 Combo 階梯和弦 (登！登！登！多音階疊加)
    playComboChord(combo) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const chordFreqs = [
            [523.25, 659.25],          // Combo 1 (C5, E5)
            [659.25, 783.99],          // Combo 2 (E5, G5)
            [783.99, 1046.50],         // Combo 3 (G5, C6)
            [1046.50, 1318.51, 1567.98] // Combo 4+ 終極三和弦
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

    // 遠程神射音效 (清脆雙音泛音)
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

    // 題目答對通關音 (清脆升階通關和音)
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
// 2. 備份生物快問快答短題庫 (秒讀秒答)
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
// 3. 遊戲全局常態與設定
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
    nextBallColor: 1,
    recoil: 0
};

// =============================================================================
// 4. 生成雙螺旋古典雕刻軌道 (Parametric Dual Curve)
// =============================================================================
function generateTrackPath() {
    pathPoints = [];
    const centerX = 480;
    const centerY = 270;
    const totalSteps = 1200;

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
        this.spin = (distance * 0.1) % (Math.PI * 2);
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

        // 2. 正解外發光暈
        const isTargetColor = (questions[currentQuestionIndex] && this.color === questions[currentQuestionIndex].answer);
        if (isTargetColor) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = config.glow;
            ctx.fill();
        }

        // 3. 擬真 3D 琉璃漸層
        const grad = ctx.createRadialGradient(-4, -5, 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.28, config.gradientStart);
        grad.addColorStop(0.85, config.gradientEnd);
        grad.addColorStop(1, '#05070e');

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 4. 高光弧斑
        ctx.beginPath();
        ctx.ellipse(-3, -5, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        // 5. 標籤文字 (A, B, C, D) 或特殊符號
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
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
        this.speed = 18;
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
        ctx.font = '900 10px Orbitron, sans-serif';
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
        ctx.font = '900 16px "Zen Maru Gothic", Orbitron, sans-serif';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

// =============================================================================
// 8. 中央共用題庫管理 (../questions/manifest.json)
// =============================================================================
async function initQuestionBankSystem() {
    const unitSelect = document.getElementById('unitSelect');
    
    try {
        const res = await fetch('../questions/manifest.json');
        if (!res.ok) throw new Error('讀取 manifest.json 失敗');
        const manifest = await res.json();

        manifestUnits = [];
        unitSelect.innerHTML = '';

        // 扁平化收集版本所有單元
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

        // 填入下拉選單
        manifestUnits.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.file;
            opt.textContent = u.title;
            unitSelect.appendChild(opt);
        });

        // 檢查 URL 參數是否指定單元
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

        // 預設載入第一個單元或熱門單元
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

    // 監聽單元切換
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
            console.log(`已成功載入共用題庫單元：${filePath}，篩選出 ${questions.length} 題速答題`);
            currentQuestionIndex = 0;
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
    currentQuestionIndex = 0;
    renderQuestionHUD();
}

function filterQuestionsForZuma(rawList) {
    const list = [];
    rawList.forEach(q => {
        let ansIdx = 0;
        if (typeof q.answer === 'string') {
            const upper = q.answer.trim().toUpperCase();
            if (upper === 'A') ansIdx = 0;
            else if (upper === 'B') ansIdx = 1;
            else if (upper === 'C') ansIdx = 2;
            else if (upper === 'D') ansIdx = 3;
            else ansIdx = parseInt(upper, 10) || 0;
        } else if (typeof q.answer === 'number') {
            ansIdx = q.answer;
        }

        const text = q.question || q.title || '';
        const opts = q.options || ['A', 'B', 'C', 'D'];

        if (text && opts.length >= 4) {
            list.push({
                question: text.length > 48 ? text.slice(0, 45) + '...' : text,
                options: opts.slice(0, 4),
                answer: ansIdx
            });
        }
    });

    list.sort(() => Math.random() - 0.5);
    return list.length >= 10 ? list : [...FAST_BIOLOGY_QUESTIONS];
}

// =============================================================================
// 9. HUD 介面渲染更新
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
// 10. 彩球鏈初始化與發射邏輯
// =============================================================================
function spawnBallChain(count = 22) {
    balls = [];
    const spacing = 28;
    for (let i = 0; i < count; i++) {
        const color = getRandomColorBiased();
        let specialType = SPECIAL_TYPES.NORMAL;

        const rand = Math.random();
        if (rand < 0.025) specialType = SPECIAL_TYPES.FREEZE;
        else if (rand < 0.05) specialType = SPECIAL_TYPES.REVERSE;
        else if (rand < 0.075) specialType = SPECIAL_TYPES.BOMB;

        const distance = -i * spacing;
        balls.push(new Ball(color, distance, specialType));
    }
}

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

    turret.recoil = 6;
    const b = new Bullet(turret.x, turret.y, turret.angle, turret.currentBallColor);
    bullets.push(b);

    turret.currentBallColor = turret.nextBallColor;
    turret.nextBallColor = getRandomColorBiased();
}

// =============================================================================
// 11. 核心物理循環與碰撞消除
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
    if (freezeTimer > 0) freezeTimer -= dt;
    if (reverseTimer > 0) reverseTimer -= dt;
    if (safePeriodTimer > 0) safePeriodTimer -= dt;
    if (screenShakeTimer > 0) screenShakeTimer -= dt;

    if (turret.recoil > 0) {
        turret.recoil = Math.max(0, turret.recoil - dt * 25);
    }

    let moveSpeed = 48;
    if (freezeTimer > 0) {
        moveSpeed = 0;
    } else if (reverseTimer > 0) {
        moveSpeed = -90;
    } else if (safePeriodTimer > 0) {
        moveSpeed = 15;
    }

    if (balls.length > 0) {
        const head = balls[0];
        head.distance += moveSpeed * dt;
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
        } else if (head.distance > pathPoints.length * 0.82) {
            sfx.playWarning();
        }
    } else {
        spawnBallChain(15);
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.update();

        if (!b.active) {
            bullets.splice(i, 1);
            continue;
        }

        for (let j = 0; j < balls.length; j++) {
            const ball = balls[j];
            if (ball.distance < 0) continue;

            const dist = Math.hypot(b.x - ball.x, b.y - ball.y);
            if (dist < b.radius + ball.radius) {
                b.active = false;
                sfx.playImpact();

                if (b.getTravelDistance() > 280) {
                    longShotsAchieved++;
                    score += 500;
                    sfx.playLongShot();
                    floatingTexts.push(new FloatingText(ball.x, ball.y - 20, '🎯 LONG SHOT! +500', '#fbbf24'));
                }

                const newBall = new Ball(b.color, ball.distance - 14);
                balls.splice(j, 0, newBall);
                checkElimination(j);
                break;
            }
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

        sfx.playComboChord(comboCount);

        let text = `COMBO x${comboCount}! +${addScore}`;
        if (comboCount >= 3) text = `🔥 SUPER COMBO x${comboCount}! +${addScore}`;
        floatingTexts.push(new FloatingText(balls[startIndex].x, balls[startIndex].y, text, isCorrectAns ? '#34d399' : '#38bdf8'));

        for (let i = left; i <= right; i++) {
            createExplosionParticles(balls[i].x, balls[i].y, COLOR_CONFIG[balls[i].color].hex);
            handleSpecialBall(balls[i]);
        }

        balls.splice(left, count);
        updateHUDStats();

        // 核心：若消除正確答案，立即過關換題
        if (isCorrectAns) {
            triggerStageClearSuccess();
            return;
        }

        setTimeout(() => {
            if (left > 0 && left < balls.length) {
                if (balls[left - 1].color === balls[left].color) {
                    checkElimination(left);
                }
            }
        }, 220);

    } else {
        comboCount = 0;
        updateHUDStats();
    }
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
            score += 100;
        }
    }
    updateHUDStats();
}

function triggerStageClearSuccess() {
    sfx.playStageClear();
    floatingTexts.push(new FloatingText(480, 230, '🎉 答對通關！PERFECT！', '#fbbf24'));

    screenShakeTimer = 0.25;
    screenShakeMagnitude = 4;

    balls.forEach(b => b.distance -= 180);
    safePeriodTimer = 3.0;

    if (currentStage >= TOTAL_STAGES) {
        setTimeout(() => {
            endGameAndShowResult(true);
        }, 800);
    } else {
        currentStage++;
        currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
        renderQuestionHUD();
    }
}

function triggerBallInHole() {
    lives--;
    sfx.playWarning();
    screenShakeTimer = 0.4;
    screenShakeMagnitude = 8;

    floatingTexts.push(new FloatingText(480, 270, '⚠️ 能量流失！心核受損', '#ef4444'));

    if (lives <= 0) {
        updateHUDStats();
        setTimeout(() => {
            endGameAndShowResult(false);
        }, 600);
    } else {
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
// 12. 畫面繪製渲染 (古典神殿石溝 + 晶瑩珠寶物理 + 守護圖騰)
// =============================================================================
function render() {
    ctx.save();

    if (screenShakeTimer > 0) {
        const dx = (Math.random() - 0.5) * screenShakeMagnitude;
        const dy = (Math.random() - 0.5) * screenShakeMagnitude;
        ctx.translate(dx, dy);
    }

    // 1. 深邃秘境背景
    ctx.fillStyle = '#050914';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 神殿古蹟凹槽軌道
    if (pathPoints.length > 0) {
        // 浮雕石刻亮邊
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        ctx.lineWidth = 38;
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.75)';
        ctx.lineCap = 'round';
        ctx.stroke();

        // 凹槽深度黑影
        ctx.lineWidth = 32;
        ctx.strokeStyle = '#020617';
        ctx.stroke();

        // 軌道能量引導線
        ctx.lineWidth = 2;
        ctx.strokeStyle = safePeriodTimer > 0 ? 'rgba(56, 189, 248, 0.65)' : 'rgba(51, 65, 85, 0.45)';
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 終點吞噬深淵傳送門
        const endPt = pathPoints[pathPoints.length - 1];
        const portalGrad = ctx.createRadialGradient(endPt.x, endPt.y, 4, endPt.x, endPt.y, 30);
        portalGrad.addColorStop(0, '#000000');
        portalGrad.addColorStop(0.5, '#7f1d1d');
        portalGrad.addColorStop(0.85, '#ef4444');
        portalGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(endPt.x, endPt.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = portalGrad;
        ctx.fill();
    }

    // 3. 繪製彩球
    for (let i = balls.length - 1; i >= 0; i--) {
        balls[i].draw(ctx);
    }

    // 4. 繪製中央守護圖騰砲台
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

    // 瞄準導引線
    ctx.save();
    ctx.rotate(turret.angle);
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(800, 0);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.restore();

    // 基座圖騰外環
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();

    // 旋轉圖騰砲首
    ctx.save();
    ctx.rotate(turret.angle);
    ctx.translate(-turret.recoil, 0);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(14, -14);
    ctx.lineTo(36, -8);
    ctx.lineTo(36, 8);
    ctx.lineTo(14, 14);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.restore();

    // 砲口主發射晶球
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

    // 備用次顆晶球
    const nextConfig = COLOR_CONFIG[turret.nextBallColor];
    ctx.beginPath();
    ctx.arc(28, 28, 8, 0, Math.PI * 2);
    ctx.fillStyle = nextConfig.hex;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
}

// =============================================================================
// 13. 遊戲結算 (對接大廳一 score-submit-modal.js)
// =============================================================================
function endGameAndShowResult(isVictory) {
    isGameRunning = false;

    const lifeBonus = lives * 300;
    const finalScore = score + (isVictory ? 1000 : 0) + lifeBonus;

    const summaryText = isVictory
        ? `🏆 達成 10 題滿貫闖關！最高連擊 Combo x${maxComboAchieved}，遠程神射 ${longShotsAchieved} 次！`
        : `⚔️ 達成 ${currentStage - 1} 題挑戰，能量耗盡！最高連擊 Combo x${maxComboAchieved}！`;

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
    score = 0;
    comboCount = 0;
    maxComboAchieved = 0;
    longShotsAchieved = 0;
    lives = 3;
    spawnBallChain(22);
    renderQuestionHUD();
}

// =============================================================================
// 14. 事件綁定與玩法說明彈窗交互
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
    document.getElementById('btn-understood').addEventListener('click', () => {
        closeRules();
        sfx.init();
        document.getElementById('overlay-screen').classList.remove('active');
        isGameRunning = true;
    });

    // 開始遊戲按鈕
    document.getElementById('start-btn').addEventListener('click', () => {
        sfx.init();
        document.getElementById('overlay-screen').classList.remove('active');
        isGameRunning = true;
    });
}

// 支援外部自動登入開始事件
window.addEventListener('biogame:start', () => {
    sfx.init();
    document.getElementById('overlay-screen').classList.remove('active');
    isGameRunning = true;
});

// =============================================================================
// 15. 應用程式入口
// =============================================================================
window.addEventListener('DOMContentLoaded', async () => {
    generateTrackPath();
    turret.currentBallColor = 0;
    turret.nextBallColor = 1;
    await initQuestionBankSystem();
    spawnBallChain(22);
    setupEventListeners();
    requestAnimationFrame(gameLoop);
});
