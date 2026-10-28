/**
 * 👾 生物小精靈塔防：微觀免疫大作戰 (Bio-Pacman Defense Grid) V5.0
 * 升級特徵：
 * 1. 現代 Web App 風格介面、抗日光燈眩光 Light Mode 題目卡與結算卡
 * 2. 移除所有歷史冗餘雙鍵，收斂為單一「🚀 查看結算與交卷檢核」三階段送出
 * 3. 支援 20 分鐘課堂活動節奏計時 (歷時計時器與 18 分鐘防超時提示)
 * 4. 教師全場凍結機制 (⏸️ 暫停講解 / 快捷鍵 P) 支援觀念精講
 * 5. 無障礙題目大字體切換 (🔍 放大題目)
 * 6. 完整連動 BioGameSuite 與 Google Apps Script (最高分同單元覆蓋)
 */

function cleanUnitTitle(raw) {
  if (!raw) return '精選題庫';
  let str = decodeURIComponent(String(raw)).trim();
  str = str.replace(/[\(（]\s*派卷鎖定\s*[\)）]/g, '').trim();
  str = str.replace(/^課堂指定單元\s*[:：]?\s*/, '').trim();
  if (str.startsWith('(') && str.endsWith(')')) str = str.slice(1, -1).trim();
  if (str.startsWith('（') && str.endsWith('）')) str = str.slice(1, -1).trim();
  if (str.includes(' - ')) {
    const parts = str.split(' - ');
    str = parts[parts.length - 1].trim();
  }
  str = str.replace(/^.*[\\\/]/, '');
  str = str.replace(/\.json$/i, '').trim();
  str = str.replace(/^[\(（]/, '').replace(/[\)）]$/, '').trim();
  str = str.replace(/^(翰林版|康軒版|南一版|翰林|康軒|南一)[_\s-]*/i, '');
  str = str.replace(/^[a-zA-Z]+[0-9]*[_\s-]+/, '');
  return str || raw;
}

// 1. Web Audio API 音效引擎 (支援全域靜音與 iPad 解鎖)
let soundEnabled = true;
class SoundFX {
  constructor() { this.ctx = null; }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playEat() {
    if (!soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(850, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (_) {}
  }
  playPower() {
    if (!soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(750, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }
  playBuild() {
    if (!soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }
  playHit() {
    if (!soundEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (_) {}
  }
}
const sfx = new SoundFX();

window.toggleSound = function() {
  soundEnabled = !soundEnabled;
  sfx.init();
  const btn = document.getElementById("sound-btn");
  if (btn) btn.textContent = soundEnabled ? "🔊 音效" : "🔇 靜音";
};

// 2. 備援離線題庫
const FALLBACK_QUESTIONS = [
  {
    q: "粒線體在細胞中主要負責下列哪一項生理功能？",
    options: ["行光合作用製造葡萄糖", "行呼吸作用釋放 ATP 能量", "合成蛋白質", "儲存遺傳物質"],
    ans: 1,
    desc: "粒線體被稱為細胞的發電廠，負責進行呼吸作用將養分分解為 ATP 能量。"
  },
  {
    q: "下列哪一種防禦構造屬於人體抵禦病原體的『特異性防禦（第三道防線）』？",
    options: ["皮膚物理屏障", "血液中的抗體與 B 淋巴細胞", "胃液中的胃酸", "發炎反應"],
    ans: 1,
    desc: "抗體由 B 淋巴細胞分泌，能專一性結合特定病原體，屬於特異性第三道防線。"
  },
  {
    q: "巨噬細胞（白血球）防禦病原體的主要作用方式為何？",
    options: ["分泌抗體", "進行吞噬作用消滅病原體", "製造葉綠素", "進行減數分裂"],
    ans: 1,
    desc: "巨噬細胞屬於非特異性防禦，能變形細胞膜延伸偽足進行吞噬作用。"
  },
  {
    q: "植物細胞中，哪一個胞器具有雙層膜並含有葉綠素？",
    options: ["葉綠體", "核糖體", "液胞", "細胞壁"],
    ans: 0,
    desc: "葉綠體含有葉綠素，機能為吸收光能進行光合作用製造葡萄糖養分。"
  }
];

// 3. 21 x 15 迷宮地圖 (Stage 1, Stage 2, Stage 3)
const STAGE_MAPS = [
  // Stage 1: 微觀細胞防線 (21x15)
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,4,1],
    [1,0,1,1,0,0,5,0,0,1,1,0,0,5,0,0,1,1,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,2,2,1,1,2,2,1,1,2,2,1,0,1,0,1],
    [1,0,1,0,1,2,2,2,2,1,2,2,1,2,2,2,1,0,1,0,1],
    [1,0,0,0,1,1,1,1,1,1,2,2,1,1,1,1,1,0,0,0,1],
    [1,0,1,0,0,0,5,0,0,0,0,0,0,0,5,0,0,0,1,0,1],
    [1,4,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,3,1],
    [1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,0,0,0,5,0,0,0,1,1,0,1,1,0,1],
    [1,0,0,0,0,1,1,0,1,1,1,1,1,0,1,1,0,0,0,0,1],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  // Stage 2: 淋巴結防禦網 (21x15)
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,4,0,0,1,0,0,0,0,3,1,3,0,0,0,0,1,0,0,3,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,5,1,0,0,0,1,5,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,0,0,1,1,2,1,1,0,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,2,2,2,1,0,1,1,1,0,1,1,1],
    [1,3,0,0,0,5,0,0,1,1,1,1,1,0,0,5,0,0,0,4,1],
    [1,1,1,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,0,1,1,2,1,1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,0,1,1,2,1,1,0,0,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,5,1,0,0,0,1,5,0,0,0,0,1,0,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,3,0,0,1,0,0,0,0,4,1,4,0,0,0,0,1,0,0,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  // Stage 3: 血管免疫大反攻 (21x15)
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,1,3,1,3,1,0,0,0,0,0,0,4,1],
    [1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1],
    [1,0,1,5,0,0,1,0,0,0,5,0,0,0,1,0,0,5,1,0,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,2,2,2,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,1,1,0,2,2,2,2,2,0,1,1,1,0,1,1,1],
    [1,4,0,0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,3,1],
    [1,1,1,0,1,1,1,0,2,2,2,2,2,0,1,1,1,0,1,1,1],
    [1,0,0,0,1,0,0,0,0,2,2,2,0,0,0,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,1,5,0,0,1,0,0,0,5,0,0,0,1,0,0,5,1,0,1],
    [1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1],
    [1,4,0,0,0,0,0,0,1,4,1,4,1,0,0,0,0,0,0,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
];

let currentStageIndex = 0;
let MAP_TILES = JSON.parse(JSON.stringify(STAGE_MAPS[0]));
const TILE_SIZE = 32;
const ROWS = 15;
const COLS = 21;

// 全域遊戲與作戰狀態
let canvas, ctx;
let atp = 0;
let score = 0;
let lives = 3;
let kills = 0;
let answeredTotal = 0;
let answeredCorrect = 0;
let dotsEatenCount = 0;
let wrongList = [];
let animFrame = 0;

let isTimeFrozen = true;
let isTeacherPaused = false;
let isCountingDown = false;
let invulnerableTimer = 0;
let powerModeTimer = 0;
let slowModeTimer = 0;
let isStressFreeMode = false;
let leaderboardData = [];

let allUnits = [];
let questionPool = [];
let towers = [];
let bullets = [];
let floatingTexts = [];

// 課堂 20 分鐘計時器
let sessionElapsedSeconds = 0;
let sessionTimer = null;

function startSessionTimer() {
  if (sessionTimer) return;
  sessionTimer = setInterval(() => {
    if (!isTeacherPaused) {
      sessionElapsedSeconds++;
      const el = document.getElementById("session-time-val");
      if (el) {
        el.textContent = formatSessionTime(sessionElapsedSeconds);
        if (sessionElapsedSeconds >= 1080) { // 18 分鐘
          el.style.color = "#f43f5e";
          el.style.fontWeight = "900";
        }
      }
    }
  }, 1000);
}

function formatSessionTime(totalSec) {
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// 教師凍結暫停控制 (快捷鍵 P)
window.togglePause = function(forceState) {
  if (typeof forceState === "boolean") {
    isTeacherPaused = forceState;
  } else {
    isTeacherPaused = !isTeacherPaused;
  }
  isTimeFrozen = isTeacherPaused;
  const overlay = document.getElementById("pauseOverlay");
  if (overlay) {
    overlay.style.display = isTeacherPaused ? "flex" : "none";
  }
};

// 無障礙題目大字體切換
window.toggleZoom = function() {
  document.body.classList.toggle("font-zoomed");
  const isZoomed = document.body.classList.contains("font-zoomed");
  const btn = document.getElementById("btn-zoom");
  if (btn) btn.textContent = isZoomed ? "🔍 標準" : "🔍 放大";
};

// 取得當前已登入學生資料 (連動 BioGameSuite)
function getAuthenticatedStudent() {
  if (window.BioGameSuite && typeof window.BioGameSuite.getStudent === 'function') {
    const st = window.BioGameSuite.getStudent();
    if (st && st.name) return st;
  }
  try {
    const raw = sessionStorage.getItem("bgs_authed_student");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { class: "701", seat: "01", name: "微觀免疫員" };
}

// 玩家（巨噬細胞）
const player = {
  x: 1 * TILE_SIZE,
  y: 1 * TILE_SIZE,
  dirX: 0,
  dirY: 0,
  nextDirX: 0,
  nextDirY: 0,
  speed: 2.2,
  mouthAngle: 0.2
};

// 病原體鬼魂
let ghosts = [];

function initGhostsForStage(stageIdx) {
  if (stageIdx === 0) {
    ghosts = [
      { x: 9 * TILE_SIZE, y: 6 * TILE_SIZE, color: '#ef4444', dirX: 1, dirY: 0, type: 'influenza', name: '流感病毒' },
      { x: 11 * TILE_SIZE, y: 6 * TILE_SIZE, color: '#ec4899', dirX: -1, dirY: 0, type: 'strep', name: '鏈球菌' }
    ];
  } else if (stageIdx === 1) {
    ghosts = [
      { x: 9 * TILE_SIZE, y: 6 * TILE_SIZE, color: '#ef4444', dirX: 1, dirY: 0, type: 'influenza', name: '流感病毒' },
      { x: 11 * TILE_SIZE, y: 6 * TILE_SIZE, color: '#ec4899', dirX: -1, dirY: 0, type: 'strep', name: '鏈球菌' },
      { x: 10 * TILE_SIZE, y: 5 * TILE_SIZE, color: '#a855f7', dirX: 0, dirY: 1, type: 'adeno', name: '腺病毒' }
    ];
  } else {
    ghosts = [
      { x: 8 * TILE_SIZE, y: 6 * TILE_SIZE, color: '#ef4444', dirX: 1, dirY: 0, type: 'influenza', name: '流感病毒' },
      { x: 12 * TILE_SIZE, y: 6 * TILE_SIZE, color: '#ec4899', dirX: -1, dirY: 0, type: 'strep', name: '鏈球菌' },
      { x: 9 * TILE_SIZE, y: 5 * TILE_SIZE, color: '#a855f7', dirX: 0, dirY: 1, type: 'adeno', name: '腺病毒' },
      { x: 10 * TILE_SIZE, y: 7 * TILE_SIZE, color: '#dc2626', dirX: 0, dirY: -1, type: 'boss', name: '超級變異 Boss' }
    ];
  }
}

// 4. 載入中央題庫與 Manifest
async function loadManifestAndUnits() {
  const select = document.getElementById('unit-select');
  try {
    const res = await fetch(`../questions/manifest.json?t=${Date.now()}`);
    if (!res.ok) throw new Error("Manifest not found");
    const manifest = await res.json();
    allUnits = manifest.units || [];

    select.innerHTML = '';
    allUnits.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.file;
      opt.textContent = cleanUnitTitle(u.title || u.file);
      select.appendChild(opt);
    });

    const params = new URLSearchParams(window.location.search);
    const targetUnit = params.get('unit') || params.get('file');

    if (targetUnit) {
      const decoded = decodeURIComponent(targetUnit);
      const found = allUnits.find(u => u.file.includes(decoded) || u.title?.includes(decoded));
      if (found) {
        select.value = found.file;
        await loadUnitQuestions(found.file);
      } else {
        await loadUnitQuestions(decoded);
      }
    } else if (allUnits.length > 0) {
      select.value = allUnits[0].file;
      await loadUnitQuestions(allUnits[0].file);
    } else {
      questionPool = prepareQuestionPool(FALLBACK_QUESTIONS);
    }
  } catch (err) {
    console.warn("題庫載入降級為離線精選題庫:", err);
    questionPool = prepareQuestionPool(FALLBACK_QUESTIONS);
  }
}

async function loadUnitQuestions(unitFile) {
  try {
    const res = await fetch(`../questions/${unitFile}?t=${Date.now()}`);
    if (!res.ok) throw new Error("Unit not found");
    const data = await res.json();
    const rawList = data.questions || [];
    questionPool = prepareQuestionPool(rawList);
  } catch (err) {
    questionPool = prepareQuestionPool(FALLBACK_QUESTIONS);
  }
}

function prepareQuestionPool(rawList) {
  if (!rawList || rawList.length === 0) rawList = FALLBACK_QUESTIONS;
  const pool = rawList.map(item => {
    let options = [];
    let ansIdx = 0;
    const rawAns = item.answer !== undefined ? item.answer : item.ans;

    if (item.options && Array.isArray(item.options)) {
      options = item.options.map(o => typeof o === 'string' ? o : (o.text || JSON.stringify(o)));
      if (typeof rawAns === 'number') {
        ansIdx = rawAns;
      } else if (typeof rawAns === 'string') {
        const trimmed = rawAns.trim().toUpperCase();
        if (['A','B','C','D'].includes(trimmed)) {
          ansIdx = trimmed.charCodeAt(0) - 65;
        } else {
          const num = parseInt(trimmed, 10);
          ansIdx = !isNaN(num) ? num : (options.findIndex(opt => opt === rawAns.trim()) || 0);
        }
      }
    } else if (item.choices && typeof item.choices === 'object') {
      ['A','B','C','D'].forEach((k, idx) => {
        if (item.choices[k]) options.push(item.choices[k]);
        if (rawAns === k || rawAns === idx || rawAns === String(idx)) ansIdx = idx;
      });
    } else if (item.options && typeof item.options === 'object') {
      ['A','B','C','D'].forEach((k, idx) => {
        if (item.options[k]) options.push(item.options[k]);
        if (rawAns === k || rawAns === idx || rawAns === String(idx)) ansIdx = idx;
      });
    }
    if (options.length < 2) options = ["選項 A", "選項 B", "選項 C", "選項 D"];
    return {
      q: item.question || item.q || "請選出正確的生物學敘述：",
      options,
      ans: ansIdx,
      desc: item.explanation || item.desc || "詳讀課本對應章節以掌握核心概念。"
    };
  });
  return pool.sort(() => Math.random() - 0.5);
}

// 5. 初始化與雙重手勢/按鈕控制
window.addEventListener('DOMContentLoaded', async () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = COLS * TILE_SIZE;
  canvas.height = ROWS * TILE_SIZE;

  loadLeaderboard();
  await loadManifestAndUnits();
  initStage(0);

  document.getElementById('unit-select')?.addEventListener('change', async (e) => {
    await loadUnitQuestions(e.target.value);
  });

  // 鍵盤操控 (支援 WASD, 方向鍵, 空白建召喚 B 細胞, P 暫停)
  window.addEventListener('keydown', (e) => {
    sfx.init();
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setPlayerDir(0, -1);
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setPlayerDir(0, 1);
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setPlayerDir(-1, 0);
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setPlayerDir(1, 0);
    if (e.key === ' ' || e.key === 'Enter') tryBuildTower();
  });

  // 觸控 D-Pad 按鈕
  document.querySelectorAll('.d-btn').forEach(btn => {
    const handleDir = (e) => {
      e.preventDefault();
      sfx.init();
      const dir = btn.dataset.dir;
      if (dir === 'UP') setPlayerDir(0, -1);
      if (dir === 'DOWN') setPlayerDir(0, 1);
      if (dir === 'LEFT') setPlayerDir(-1, 0);
      if (dir === 'RIGHT') setPlayerDir(1, 0);
    };
    btn.addEventListener('touchstart', handleDir, { passive: false });
    btn.addEventListener('click', handleDir);
  });

  // iPad 手勢滑動 (Swipe Control)
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    sfx.init();
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      if (Math.hypot(dx, dy) > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          setPlayerDir(dx > 0 ? 1 : -1, 0);
        } else {
          setPlayerDir(dy > 0 ? 1 : -1, 0);
        }
      }
    }
  }, { passive: true });

  document.getElementById('btn-build')?.addEventListener('click', tryBuildTower);
  document.getElementById('btn-restart')?.addEventListener('click', () => { location.reload(); });
  document.getElementById('btn-next-stage')?.addEventListener('click', advanceNextStage);
  document.getElementById('btn-leaderboard')?.addEventListener('click', openLeaderboard);
  document.getElementById('btn-show-board')?.addEventListener('click', saveAndShowLeaderboard);
  document.getElementById('btn-close-leaderboard')?.addEventListener('click', closeLeaderboard);

  // 抽屜設定
  document.getElementById('btn-drawer')?.addEventListener('click', () => {
    document.getElementById('drawer-panel')?.classList.remove('hidden');
  });
  document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
    document.getElementById('drawer-panel')?.classList.add('hidden');
  });
  document.getElementById('btn-apply-drawer')?.addEventListener('click', () => {
    isStressFreeMode = document.getElementById('check-stress-free')?.checked || false;
    document.getElementById('drawer-panel')?.classList.add('hidden');
    addFloatingText(isStressFreeMode ? "🧩 已開啟特教無壓力模式 (無限生命)" : "💾 課堂設定已套用", player.x + 16, player.y - 12, "#38bdf8");
    updateUI();
  });

  requestAnimationFrame(gameLoop);
});

function initStage(stageIdx) {
  currentStageIndex = stageIdx;
  MAP_TILES = JSON.parse(JSON.stringify(STAGE_MAPS[stageIdx]));
  player.x = 1 * TILE_SIZE;
  player.y = 1 * TILE_SIZE;
  player.dirX = 0; player.dirY = 0; player.nextDirX = 0; player.nextDirY = 0;
  towers = [];
  bullets = [];
  floatingTexts = [];
  initGhostsForStage(stageIdx);

  const stageTitles = ["Stage 1", "Stage 2", "Stage 3"];
  const stageBadge = document.getElementById('stage-badge');
  if (stageBadge) stageBadge.textContent = stageTitles[stageIdx] || `Stage ${stageIdx + 1}`;

  // 自動切換下一單元題庫
  const unitSelect = document.getElementById('unit-select');
  if (unitSelect && allUnits.length > stageIdx) {
    unitSelect.value = allUnits[stageIdx].file;
    loadUnitQuestions(allUnits[stageIdx].file);
  }
  updateUI();
}

function advanceNextStage() {
  document.getElementById('result-modal')?.classList.add('hidden');
  if (currentStageIndex < 2) {
    initStage(currentStageIndex + 1);
    startResumeCountdown();
  } else {
    initStage(0);
    startResumeCountdown();
  }
}

function setPlayerDir(dx, dy) {
  player.nextDirX = dx;
  player.nextDirY = dy;
}

function addFloatingText(text, x, y, color = "#ef4444") {
  floatingTexts.push({ text, x, y, timer: 75, color });
}

// 6. 出題與時間凍結 Modal (Light Mode 高對比卡片)
function formatQuestionText(text) {
  const keywords = ["粒線體", "葉綠體", "第一道防線", "第三道防線", "呼吸作用", "光合作用", "ATP", "抗體", "B 淋巴細胞", "巨噬細胞", "特異性結合"];
  let formatted = text;
  keywords.forEach(kw => {
    if (formatted.includes(kw)) {
      formatted = formatted.replaceAll(kw, `<span class="highlight-term">${kw}</span>`);
    }
  });
  return formatted;
}

function triggerQuiz(type, onCorrectCallback) {
  isTimeFrozen = true;
  if (!questionPool || questionPool.length === 0) {
    questionPool = prepareQuestionPool(FALLBACK_QUESTIONS);
  }
  const qObj = questionPool.pop();
  answeredTotal++;

  const modal = document.getElementById('quiz-modal');
  const typeTag = document.getElementById('quiz-type-tag');
  const questionEl = document.getElementById('quiz-question');
  const optionsGrid = document.getElementById('quiz-options');
  const feedbackBox = document.getElementById('quiz-feedback');
  const feedbackText = document.getElementById('feedback-text');
  const closeBtn = document.getElementById('feedback-close-btn');

  modal?.classList.remove('hidden');
  feedbackBox?.classList.add('hidden');
  if (optionsGrid) optionsGrid.innerHTML = '';

  const tagMap = {
    'MITO': '⚡ 粒線體事件 (呼吸作用釋放 ATP)',
    'CHLO': '🌿 葉綠體事件 (光合作用產糖)',
    'TOWER': '🛡️ 第三道防線 (B 淋巴球抗體哨站檢定)',
    'ATP_CHECK': '🧬 ATP 代謝哨卡題'
  };
  if (typeTag) typeTag.textContent = tagMap[type] || '生物學測驗';
  if (questionEl) questionEl.innerHTML = formatQuestionText(qObj.q);

  let isLocked = true;
  setTimeout(() => { isLocked = false; }, 300);

  qObj.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt-card';
    btn.textContent = `${['A','B','C','D'][idx]}. ${optText}`;
    btn.onclick = () => {
      if (isLocked) return;
      document.querySelectorAll('.opt-card').forEach(b => b.disabled = true);

      if (idx === qObj.ans) {
        answeredCorrect++;
        btn.classList.add('is-correct');
        sfx.playBuild();
        if (feedbackText) feedbackText.innerHTML = `<strong style="color:#059669;">✅ 正確！觀念完美融會貫通！</strong><br>${qObj.desc}`;
        feedbackBox?.classList.remove('hidden');
        if (closeBtn) {
          closeBtn.disabled = false;
          closeBtn.textContent = "確認觀念，重返防線 🚀";
          closeBtn.onclick = () => {
            modal?.classList.add('hidden');
            startResumeCountdown(onCorrectCallback);
          };
        }
      } else {
        btn.classList.add('is-wrong');
        // 同時將正確答案高亮標註為綠色，方便學生立即訂正
        const correctBtn = optionsGrid.children[qObj.ans];
        if (correctBtn) correctBtn.classList.add('is-correct');

        wrongList.push({ q: qObj.q, right: qObj.options[qObj.ans], desc: qObj.desc });
        if (feedbackText) feedbackText.innerHTML = `<strong style="color:#e11d48;">❌ 答錯了！正確解答：[${qObj.options[qObj.ans]}]</strong><br>${qObj.desc}`;
        feedbackBox?.classList.remove('hidden');
        if (closeBtn) {
          closeBtn.disabled = true;
          closeBtn.textContent = "請先閱讀觀念解析 (1s)...";
          setTimeout(() => {
            closeBtn.disabled = false;
            closeBtn.textContent = "我吸收觀念了，重返防線 🚀";
          }, 1000);

          closeBtn.onclick = () => {
            modal?.classList.add('hidden');
            startResumeCountdown();
          };
        }
      }
    };
    optionsGrid?.appendChild(btn);
  });
}

// 7. 解凍極速 0.5s 快閃與防貼臉彈開機制
function startResumeCountdown(callback) {
  isCountingDown = true;
  const overlay = document.getElementById('countdown-overlay');
  const numEl = document.getElementById('countdown-num');

  // 防貼臉：將 3.5 格範圍內的鬼魂瞬間彈回中央重生 (0ms 運算)
  ghosts.forEach(g => {
    const dist = Math.hypot(player.x - g.x, player.y - g.y);
    if (dist < TILE_SIZE * 3.5) {
      g.x = 10 * TILE_SIZE;
      g.y = 7 * TILE_SIZE;
    }
  });

  // 0.5 秒半透明金色 GO! 快閃，不阻擋背景迷宮
  if (overlay && numEl) {
    overlay.classList.remove('hidden');
    overlay.style.background = 'rgba(2, 6, 23, 0.45)';
    numEl.textContent = '⚡ GO!';
    numEl.style.fontSize = '54px';
  }

  setTimeout(() => {
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.style.background = '';
    }
    isCountingDown = false;
    isTimeFrozen = false;
    invulnerableTimer = 120; // 2.0 秒無敵閃爍保護
    if (callback) callback();
  }, 500);
}

// 8. 召喚 B 淋巴球架設特異性抗體哨站
function tryBuildTower() {
  const tileX = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
  const tileY = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);

  if (MAP_TILES[tileY][tileX] === 5) {
    if (atp < 20) {
      addFloatingText("⚠️ ATP 能量不足 (需要 20 ATP)", player.x + 16, player.y - 12, "#ef4444");
      return;
    }
    triggerQuiz('TOWER', () => {
      atp -= 20;
      towers.push({ x: tileX * TILE_SIZE + 16, y: tileY * TILE_SIZE + 16, range: 120, cooldown: 0 });
      MAP_TILES[tileY][tileX] = 2;
      sfx.playBuild();
      addFloatingText("🛡️ B 淋巴球抗體哨站建立完成！", player.x + 16, player.y - 12, "#10b981");
      updateUI();
    });
  }
}

// 9. 遊戲主循環
function gameLoop() {
  animFrame++;
  if (!isTimeFrozen && !isCountingDown && !isTeacherPaused) {
    updateGame();
  }
  renderGame();
  requestAnimationFrame(gameLoop);
}

function updateGame() {
  if (powerModeTimer > 0) powerModeTimer--;
  if (slowModeTimer > 0) slowModeTimer--;
  if (invulnerableTimer > 0) invulnerableTimer--;

  // 移動玩家
  if (canMove(player.x + player.nextDirX * player.speed, player.y + player.nextDirY * player.speed)) {
    player.dirX = player.nextDirX;
    player.dirY = player.nextDirY;
  }
  if (canMove(player.x + player.dirX * player.speed, player.y + player.dirY * player.speed)) {
    player.x += player.dirX * player.speed;
    player.y += player.dirY * player.speed;
  }

  // 吃豆與勝敗判定
  const currCol = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
  const currRow = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);
  const tileType = MAP_TILES[currRow][currCol];

  if (tileType === 0) {
    MAP_TILES[currRow][currCol] = 2;
    atp += 2;
    score += 10;
    dotsEatenCount++;
    sfx.playEat();
    updateUI();

    // 45 顆豆子觸發一次課堂 ATP 哨卡題
    if (dotsEatenCount > 0 && dotsEatenCount % 45 === 0) {
      triggerQuiz('ATP_CHECK', () => {
        atp += 20;
        score += 80;
        addFloatingText("⚡ ATP 充沛爆發 +20!", player.x + 16, player.y - 12, "#facc15");
        updateUI();
      });
    }

    checkStageClear();

  } else if (tileType === 3) { // 粒線體
    MAP_TILES[currRow][currCol] = 2;
    triggerQuiz('MITO', () => {
      powerModeTimer = 480;
      sfx.playPower();
      addFloatingText("⚡ 粒線體 ATP 爆發 (強效吞噬模式)!", player.x + 16, player.y - 12, "#ff5555");
    });
  } else if (tileType === 4) { // 葉綠體
    MAP_TILES[currRow][currCol] = 2;
    triggerQuiz('CHLO', () => {
      atp += 30;
      slowModeTimer = 360;
      sfx.playPower();
      addFloatingText("🌿 葉綠體光合產糖 (全場緩速)!", player.x + 16, player.y - 12, "#22c55e");
      updateUI();
    });
  }

  // 🛡️ B 淋巴球抗體哨站邏輯
  towers.forEach(t => {
    if (t.cooldown > 0) t.cooldown--;
    if (t.cooldown <= 0) {
      const targetGhost = ghosts.find(g => Math.hypot(t.x - (g.x + 16), t.y - (g.y + 16)) <= t.range);
      if (targetGhost) {
        bullets.push({ x: t.x, y: t.y, targetGhost, speed: 6.5 });
        t.cooldown = 90;
      }
    }
  });

  // 更新抗體子彈位置與專一性結合
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const dx = (b.targetGhost.x + 16) - b.x;
    const dy = (b.targetGhost.y + 16) - b.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 12) {
      b.targetGhost.x = 10 * TILE_SIZE;
      b.targetGhost.y = 7 * TILE_SIZE;
      kills++;
      score += 60;
      sfx.playHit();
      addFloatingText("🎯 特異性結合凝集！", b.targetGhost.x + 16, b.targetGhost.y - 10, "#38bdf8");
      bullets.splice(i, 1);
      updateUI();
    } else {
      b.x += (dx / dist) * b.speed;
      b.y += (dy / dist) * b.speed;
    }
  }

  // 病原體移動與碰撞
  const ghostSpeed = slowModeTimer > 0 ? 0.7 : 1.4;
  ghosts.forEach(g => {
    if (Math.random() < 0.04 || !canMove(g.x + g.dirX * ghostSpeed, g.y + g.dirY * ghostSpeed)) {
      const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
      const valid = dirs.filter(d => canMove(g.x + d.x * 2, g.y + d.y * 2));
      if (valid.length > 0) {
        const choice = valid[Math.floor(Math.random() * valid.length)];
        g.dirX = choice.x;
        g.dirY = choice.y;
      }
    }
    g.x += g.dirX * ghostSpeed;
    g.y += g.dirY * ghostSpeed;

    const pDist = Math.hypot(player.x - g.x, player.y - g.y);
    if (pDist < 20) {
      if (powerModeTimer > 0) {
        g.x = 10 * TILE_SIZE;
        g.y = 7 * TILE_SIZE;
        kills++;
        score += 100;
        sfx.playHit();
        addFloatingText("💥 強效吞噬病原體 +100", player.x + 16, player.y - 12, "#facc15");
        updateUI();
      } else if (invulnerableTimer <= 0) {
        if (!isStressFreeMode) {
          lives--;
          player.x = 1 * TILE_SIZE;
          player.y = 1 * TILE_SIZE;
          addFloatingText("💔 免疫防線受損!", player.x + 16, player.y - 12, "#ef4444");
          updateUI();
          if (lives <= 0) endGame(false);
        } else {
          addFloatingText("🧩 無壓力防護，抵擋傷害!", player.x + 16, player.y - 12, "#38bdf8");
        }
      }
    }
  });

  // 更新 Floating Text
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 0.5;
    ft.timer--;
    if (ft.timer <= 0) floatingTexts.splice(i, 1);
  }
}

function checkStageClear() {
  let remainingDots = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (MAP_TILES[r][c] === 0) remainingDots++;
    }
  }
  if (remainingDots === 0) {
    endGame(true);
  }
}

function canMove(nextX, nextY) {
  const margin = 3;
  const left = Math.floor((nextX + margin) / TILE_SIZE);
  const right = Math.floor((nextX + TILE_SIZE - margin) / TILE_SIZE);
  const top = Math.floor((nextY + margin) / TILE_SIZE);
  const bottom = Math.floor((nextY + TILE_SIZE - margin) / TILE_SIZE);

  return (
    MAP_TILES[top][left] !== 1 &&
    MAP_TILES[top][right] !== 1 &&
    MAP_TILES[bottom][left] !== 1 &&
    MAP_TILES[bottom][right] !== 1
  );
}

// 10. 高畫質生物角色 Canvas 繪製
function renderGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 地圖牆壁與豆子
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const type = MAP_TILES[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (type === 1) {
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#3b82f6';
        ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      } else if (type === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 3) {
        ctx.fillStyle = '#ff5555';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 16, 10, 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 14); ctx.lineTo(x + 22, y + 18);
        ctx.stroke();
      } else if (type === 4) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x + 12, y + 13, 8, 3);
        ctx.fillRect(x + 12, y + 17, 8, 3);
      } else if (type === 5) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      }
    }
  }

  // B 淋巴球 Y 字型抗體砲塔
  towers.forEach(t => {
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y + 6); ctx.lineTo(t.x, t.y - 2);
    ctx.lineTo(t.x - 5, t.y - 8);
    ctx.moveTo(t.x, t.y - 2); ctx.lineTo(t.x + 5, t.y - 8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 抗體子彈
  bullets.forEach(b => {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 巨噬細胞
  if (invulnerableTimer === 0 || Math.floor(invulnerableTimer / 8) % 2 === 0) {
    const px = player.x + 16, py = player.y + 16;
    ctx.fillStyle = powerModeTimer > 0 ? '#facc15' : '#60a5fa';
    
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) + (animFrame * 0.05);
      const dist = 12 + Math.sin(animFrame * 0.1 + i) * 2.5;
      const tx = px + Math.cos(angle) * dist;
      const ty = py + Math.sin(angle) * dist;
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = powerModeTimer > 0 ? '#b45309' : '#1e3a8a';
    ctx.beginPath();
    ctx.arc(px - 2, py - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 病原體鬼魂
  ghosts.forEach(g => {
    const gx = g.x + 16, gy = g.y + 16;
    ctx.fillStyle = powerModeTimer > 0 ? '#3b82f6' : g.color;

    if (g.type === 'influenza') {
      ctx.beginPath();
      ctx.arc(gx, gy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = powerModeTimer > 0 ? '#93c5fd' : '#fca5a5';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const ang = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(ang) * 9, gy + Math.sin(ang) * 9);
        ctx.lineTo(gx + Math.cos(ang) * 14, gy + Math.sin(ang) * 14);
        ctx.stroke();
      }
    } else if (g.type === 'strep') {
      ctx.beginPath();
      ctx.arc(gx - 4, gy, 7, 0, Math.PI * 2);
      ctx.arc(gx + 4, gy, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(gx, gy, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gx - 3, gy - 2, 3, 0, Math.PI * 2);
    ctx.arc(gx + 3, gy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(gx - 3, gy - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(gx + 3, gy - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Floating Text 漂浮字幕
  floatingTexts.forEach(ft => {
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  });
}

function updateUI() {
  const atpEl = document.getElementById('atp-val');
  if (atpEl) atpEl.textContent = atp;
  const corEl = document.getElementById('correct-count');
  if (corEl) corEl.textContent = answeredCorrect;
  const livesEl = document.getElementById('lives-val');
  if (livesEl) livesEl.textContent = isStressFreeMode ? "∞ (無限)" : '❤️'.repeat(Math.max(0, lives));
}

// 11. 結算防偽證書卡片 (Classroom Light Mode 現代風格)
function endGame(isClear = false) {
  isTimeFrozen = true;
  const modal = document.getElementById('result-modal');
  modal?.classList.remove('hidden');

  const student = getAuthenticatedStudent();

  // 更新身分水印與隊員姓名
  const watermarkEl = document.getElementById('cert-watermark');
  if (watermarkEl) watermarkEl.textContent = `${student.class} ${student.seat} ${student.name}`;
  const userEl = document.getElementById('cert-user');
  if (userEl) userEl.textContent = `${student.class} 班 ${student.seat} 號 ${student.name}`;

  document.getElementById('final-score').textContent = score;
  const acc = answeredTotal > 0 ? Math.round((answeredCorrect / answeredTotal) * 100) : 0;
  document.getElementById('final-accuracy').textContent = `${acc}%`;
  document.getElementById('final-kills').textContent = kills;
  document.getElementById('final-stage').textContent = `Stage ${currentStageIndex + 1}`;

  // 金銀銅評等徽章
  const medalBadge = document.getElementById('cert-medal-badge');
  if (medalBadge) {
    if (acc >= 85) {
      medalBadge.textContent = "🥇 國家金牌免疫研究員認證 🥇";
      medalBadge.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";
    } else if (acc >= 70) {
      medalBadge.textContent = "🥈 國家銀牌免疫研究員認證 🥈";
      medalBadge.style.background = "linear-gradient(135deg, #94a3b8, #64748b)";
    } else {
      medalBadge.textContent = "🥉 國家銅牌免疫研究員認證 🥉";
      medalBadge.style.background = "linear-gradient(135deg, #b45309, #78350f)";
    }
  }

  const randNum = Math.floor(1000 + Math.random() * 9000);
  const verifyCode = `PAC-${randNum}`;
  const secEl = document.getElementById('security-code');
  if (secEl) secEl.textContent = verifyCode;

  // 錯題回顧清單
  const wrongBox = document.getElementById('wrong-summary');
  const wrongListEl = document.getElementById('wrong-list');
  if (wrongList.length > 0) {
    wrongBox?.classList.remove('hidden');
    if (wrongListEl) {
      wrongListEl.innerHTML = '';
      wrongList.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.q}</strong><br><span style="color:#059669; font-weight:700;">正確解答：${item.right}</span><br><span style="color:#475569;">${item.desc}</span>`;
        wrongListEl.appendChild(li);
      });
    }
  } else {
    wrongBox?.classList.add('hidden');
  }

  // 準備剪貼簿備份文本
  const copyText = `【生物小精靈：微觀免疫大作戰 成果證書】
防衛隊員：${student.class}班 ${student.seat}號 ${student.name}
作戰總分：${score} 分
命中率：${acc}%
消滅病原體：${kills} 隻
通關階段：Stage ${currentStageIndex + 1}
課堂歷時：${formatSessionTime(sessionElapsedSeconds)}
防偽碼：${verifyCode}
------------------------------
${wrongList.length > 0 ? '待訂正錯題：\n' + wrongList.map(w => `• ${w.q}（正確：${w.right}）`).join('\n') : '🎉 全數答對，觀念融會貫通！'}`;

  const copyArea = document.getElementById("copyResult");
  if (copyArea) copyArea.value = copyText;
}

// 叫起通用三階段結算彈窗 (黃金單一入口，徹底消除雙胞胎按鈕衝突)
window.triggerPacmanGasSubmit = function() {
  if (typeof showScoreSubmitModal === "function") {
    const student = getAuthenticatedStudent();
    const acc = answeredTotal > 0 ? Math.round((answeredCorrect / answeredTotal) * 100) : 0;
    showScoreSubmitModal({
      gameTitle: "人體免疫小精靈：微觀免疫大作戰",
      gameId: "pacman",
      score: score,
      scoreDisplay: `${score} 分 (Stage ${currentStageIndex + 1} · 答對率 ${acc}% · 擊殺 ${kills} 隻病原體)`,
      duration: `課堂歷時 ${formatSessionTime(sessionElapsedSeconds)} (Stage ${currentStageIndex + 1})`,
      initialClass: student.class || "701",
      initialSeat: student.seat || "01",
      initialName: student.name || "微觀免疫員",
      onBonusChallenge: () => {
        advanceNextStage();
      },
      onRetry: () => {
        location.reload();
      }
    });
  }
};

// 複製成績文字檔至剪貼簿 (斷網備用)
window.copyPacmanCertText = function() {
  const copyArea = document.getElementById("copyResult");
  const statusEl = document.getElementById("copyStatus");
  if (!copyArea) return;
  copyArea.style.display = "block";
  copyArea.select();
  try {
    document.execCommand('copy');
    if (statusEl) statusEl.textContent = "✅ 已成功複製學習成果與錯題紀錄至剪貼簿！";
  } catch (err) {
    if (statusEl) statusEl.textContent = "⚠️ 請手動複製或截圖畫面儲存。";
  }
  copyArea.style.display = "none";
};

// 12. 課堂英雄排行榜 (Leaderboard)
function loadLeaderboard() {
  try {
    const raw = localStorage.getItem("pacman_leaderboard_v5.0");
    leaderboardData = raw ? JSON.parse(raw) : [];
  } catch (e) { leaderboardData = []; }
}

function saveAndShowLeaderboard() {
  const student = getAuthenticatedStudent();
  const acc = answeredTotal > 0 ? Math.round((answeredCorrect / answeredTotal) * 100) : 0;
  const verifyCode = document.getElementById('security-code')?.textContent || "PAC-8812";

  leaderboardData.push({
    name: `${student.class} ${student.seat} ${student.name}`,
    score: score,
    acc: `${acc}%`,
    stage: `Stage ${currentStageIndex + 1}`,
    code: verifyCode,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  leaderboardData.sort((a, b) => b.score - a.score);
  leaderboardData = leaderboardData.slice(0, 10);
  try {
    localStorage.setItem("pacman_leaderboard_v5.0", JSON.stringify(leaderboardData));
  } catch (_) {}

  document.getElementById('result-modal')?.classList.add('hidden');
  openLeaderboard();
}

function openLeaderboard() {
  const modal = document.getElementById('leaderboard-modal');
  const tbody = document.querySelector('#leaderboard-table tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (leaderboardData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px; color:#64748b;">尚無排行榜紀錄</td></tr>';
    } else {
      leaderboardData.forEach((item, idx) => {
        const tr = document.createElement('tr');
        const badge = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;
        tr.innerHTML = `
          <td><b>${badge}</b></td>
          <td><b>${item.name}</b></td>
          <td style="color:#0284c7; font-weight:800;">${item.score}</td>
          <td>${item.acc}</td>
          <td>${item.stage}</td>
          <td><code style="font-family:monospace; color:#d97706; background:#fef3c7; padding:2px 6px; border-radius:4px;">${item.code}</code></td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
  modal?.classList.remove('hidden');
}

function closeLeaderboard() {
  document.getElementById('leaderboard-modal')?.classList.add('hidden');
}

// 支援外部啟動呼叫 (BioGameSuite 登入完畢後自動喚醒)
window.startGame = function() {
  isTimeFrozen = false;
  isTeacherPaused = false;
  startSessionTimer();
};
