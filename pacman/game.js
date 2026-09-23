/**
 * 👾 生物小精靈塔防：微觀免疫大作戰 (Bio-Pacman Defense Grid) V1.0
 * 專為 bio-games 平台與 iPad 課堂打造
 * 特色：抗體砲塔 1.5s 子彈動畫、Canvas 漂浮文字提示、45豆課堂防打斷、D-Pad + 觸控手勢雙操控
 */

// 1. Web Audio API 音效引擎
class SoundFX {
  constructor() { this.ctx = null; }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playEat() {
    if (!this.ctx) return;
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
    } catch (e) {}
  }
  playPower() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(700, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
  playBuild() {
    if (!this.ctx) return;
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
    } catch (e) {}
  }
  playHit() {
    if (!this.ctx) return;
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
    } catch (e) {}
  }
}
const sfx = new SoundFX();

// 2. 備援離線題庫
const FALLBACK_QUESTIONS = [
  {
    q: "粒線體在細胞中主要負責下列哪一項生理功能？",
    options: ["行光合作用製造葡萄糖", "行呼吸作用釋放 ATP 能量", "合成蛋白質", "儲存遺傳物質"],
    ans: 1,
    desc: "粒線體被稱為細胞的發電廠，負責進行呼吸作用將養分分解為能量(ATP)。"
  },
  {
    q: "植物細胞中，哪一個胞器具有雙層膜並含有葉綠素？",
    options: ["葉綠體", "核糖體", "液胞", "細胞壁"],
    ans: 0,
    desc: "葉綠體含有葉綠素，能吸收光能進行光合作用製造有機養分。"
  },
  {
    q: "下列哪一種防禦構造屬於人體抵禦病原體的『第一道防線』？",
    options: ["T 淋巴細胞", "血液中的抗體", "皮膚與完整黏膜", "發炎反應"],
    ans: 2,
    desc: "皮膚與黏膜屬於物理皮膜屏障，阻擋病原體入侵，為非特異性防禦的第一道防線。"
  },
  {
    q: "綠色植物在夜間沒有光照時，會進行下列哪一種生理作用？",
    options: ["只進行光合作用", "只進行呼吸作用", "兩者同時進行", "兩者皆停止"],
    ans: 1,
    desc: "植物無時無刻都在進行呼吸作用消耗氧氣；夜間缺乏光照則停止光合作用。"
  }
];

// 3. 迷宮地圖 (0:豆子, 1:牆壁, 2:空地, 3:粒線體, 4:葉綠體, 5:砲塔基座)
const INITIAL_MAP_TILES = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,0,0,0,0,1,1,0,0,0,0,4,1],
  [1,0,1,1,0,0,5,0,0,1,1,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,1,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,2,2,1,1,0,1,0,1],
  [1,0,1,0,1,2,2,2,2,1,0,1,0,1],
  [1,0,0,0,1,1,1,1,1,1,0,0,0,1],
  [1,0,1,0,0,0,5,0,0,0,0,1,0,1],
  [1,4,1,1,0,1,1,1,0,1,1,1,3,1],
  [1,0,0,0,0,0,1,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let MAP_TILES = JSON.parse(JSON.stringify(INITIAL_MAP_TILES));
const TILE_SIZE = 32;
const ROWS = MAP_TILES.length;
const COLS = MAP_TILES[0].length;

// 全域遊戲狀態
let canvas, ctx;
let atp = 0;
let score = 0;
let lives = 3;
let kills = 0;
let answeredTotal = 0;
let answeredCorrect = 0;
let dotsEatenCount = 0;
let wrongList = [];

let isTimeFrozen = false;
let isCountingDown = false;
let invulnerableTimer = 0;
let powerModeTimer = 0;
let slowModeTimer = 0;

let allUnits = [];
let questionPool = [];
let towers = [];
let bullets = [];
let floatingTexts = [];

// 玩家（巨噬細胞）
const player = {
  x: 1 * TILE_SIZE,
  y: 1 * TILE_SIZE,
  dirX: 0,
  dirY: 0,
  nextDirX: 0,
  nextDirY: 0,
  speed: 2
};

// 病原體鬼魂
const ghosts = [
  { x: 6 * TILE_SIZE, y: 5 * TILE_SIZE, color: '#ef4444', dirX: 1, dirY: 0, name: '流感病毒' },
  { x: 7 * TILE_SIZE, y: 5 * TILE_SIZE, color: '#ec4899', dirX: -1, dirY: 0, name: '鏈球菌' }
];

// 4. 載入中央題庫與 Manifest
async function loadManifestAndUnits() {
  const unitSelect = document.getElementById('unit-select');
  try {
    const res = await fetch(`../questions/manifest.json?t=${Date.now()}`);
    if (!res.ok) throw new Error("Manifest not found");
    const manifest = await res.json();
    allUnits = manifest.units || [];

    unitSelect.innerHTML = '';
    allUnits.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.file;
      opt.textContent = u.title;
      unitSelect.appendChild(opt);
    });

    if (allUnits.length > 0) {
      unitSelect.value = allUnits[0].file;
      await loadUnitQuestions(allUnits[0].file);
    } else {
      questionPool = prepareQuestionPool(FALLBACK_QUESTIONS);
    }
  } catch (err) {
    unitSelect.innerHTML = '<option value="fallback">預設單元：人體防禦與免疫</option>';
    questionPool = prepareQuestionPool(FALLBACK_QUESTIONS);
  }
}

async function loadUnitQuestions(unitFile) {
  try {
    const res = await fetch(`../questions/${unitFile}?t=${Date.now()}`);
    if (!res.ok) throw new Error("HTTP Error");
    const data = await res.json();
    const rawList = data.questions || [];
    questionPool = prepareQuestionPool(rawList);
  } catch (err) {
    questionPool = prepareQuestionPool(FALLBACK_QUESTIONS);
  }
}

function prepareQuestionPool(rawList) {
  if (!rawList || rawList.length === 0) rawList = FALLBACK_QUESTIONS;
  
  let suitable = rawList.filter(q => (q.q || q.question || '').length <= 50);
  if (suitable.length < 4) suitable = rawList;

  const normalized = suitable.map(item => ({
    q: item.q || item.question,
    options: item.options,
    ans: item.ans !== undefined ? item.ans : item.answer,
    desc: item.desc || item.explanation || "詳見課本概念複習。"
  }));

  for (let i = normalized.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [normalized[i], normalized[j]] = [normalized[j], normalized[i]];
  }
  return normalized;
}

// 5. 初始化與雙重手勢/按鈕控制
window.addEventListener('DOMContentLoaded', async () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = COLS * TILE_SIZE;
  canvas.height = ROWS * TILE_SIZE;

  await loadManifestAndUnits();

  document.getElementById('unit-select').addEventListener('change', async (e) => {
    await loadUnitQuestions(e.target.value);
  });

  // 鍵盤操控
  window.addEventListener('keydown', (e) => {
    sfx.init();
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setPlayerDir(0, -1);
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setPlayerDir(0, 1);
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setPlayerDir(-1, 0);
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setPlayerDir(1, 0);
    if (e.key === ' ' || e.key === 'Enter') tryBuildTower();
  });

  // 觸控 D-Pad 按鈕
  document.querySelectorAll('.d-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      sfx.init();
      const dir = btn.dataset.dir;
      if (dir === 'UP') setPlayerDir(0, -1);
      if (dir === 'DOWN') setPlayerDir(0, 1);
      if (dir === 'LEFT') setPlayerDir(-1, 0);
      if (dir === 'RIGHT') setPlayerDir(1, 0);
    });
    btn.addEventListener('click', () => {
      sfx.init();
      const dir = btn.dataset.dir;
      if (dir === 'UP') setPlayerDir(0, -1);
      if (dir === 'DOWN') setPlayerDir(0, 1);
      if (dir === 'LEFT') setPlayerDir(-1, 0);
      if (dir === 'RIGHT') setPlayerDir(1, 0);
    });
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
      if (Math.hypot(dx, dy) > 24) {
        if (Math.abs(dx) > Math.abs(dy)) {
          setPlayerDir(dx > 0 ? 1 : -1, 0);
        } else {
          setPlayerDir(dy > 0 ? 1 : -1, 0);
        }
      }
    }
  }, { passive: true });

  document.getElementById('btn-build').addEventListener('click', tryBuildTower);
  document.getElementById('btn-restart').addEventListener('click', () => location.reload());
  document.getElementById('btn-lobby').addEventListener('click', () => { window.location.href = '../index.html'; });

  requestAnimationFrame(gameLoop);
});

function setPlayerDir(dx, dy) {
  player.nextDirX = dx;
  player.nextDirY = dy;
}

function addFloatingText(text, x, y, color = "#ef4444") {
  floatingTexts.push({ text, x, y, timer: 75, color });
}

// 6. 出題與時間凍結 Modal
function formatQuestionText(text) {
  const keywords = ["粒線體", "葉綠體", "第一道防線", "呼吸作用", "光合作用", "ATP", "抗體", "主要產物", "遺傳", "演化", "細胞膜"];
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

  modal.classList.remove('hidden');
  feedbackBox.classList.add('hidden');
  optionsGrid.innerHTML = '';

  const tagMap = {
    'MITO': '⚡ 粒線體事件 (呼吸作用釋能)',
    'CHLO': '🌿 葉綠體事件 (光合作用產糖)',
    'TOWER': '🛡️ 哨站檢定 (抗體國防架設)',
    'ATP_CHECK': '🧬 ATP 代謝哨卡題'
  };
  typeTag.textContent = tagMap[type] || '生物學測驗';
  questionEl.innerHTML = formatQuestionText(qObj.q);

  let isLocked = true;
  setTimeout(() => { isLocked = false; }, 400);

  qObj.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = `${['A','B','C','D'][idx]}. ${optText}`;
    btn.onclick = () => {
      if (isLocked) return;
      document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);

      if (idx === qObj.ans) {
        answeredCorrect++;
        feedbackText.innerHTML = `<strong style="color:#10b981;">✅ 正確！概念完美融會貫通！</strong><br>${qObj.desc}`;
        feedbackBox.classList.remove('hidden');
        closeBtn.onclick = () => {
          modal.classList.add('hidden');
          startResumeCountdown(onCorrectCallback);
        };
      } else {
        wrongList.push({ q: qObj.q, right: qObj.options[qObj.ans], desc: qObj.desc });
        feedbackText.innerHTML = `<strong style="color:#ef4444;">❌ 答錯了！正確答案為：[${qObj.options[qObj.ans]}]</strong><br>${qObj.desc}`;
        feedbackBox.classList.remove('hidden');
        closeBtn.disabled = true;

        let cd = 3;
        closeBtn.textContent = `請先閱讀觀念解析 (${cd}s)...`;
        const timer = setInterval(() => {
          cd--;
          if (cd <= 0) {
            clearInterval(timer);
            closeBtn.disabled = false;
            closeBtn.textContent = "我吸收觀念了，重返防線 🚀";
          } else {
            closeBtn.textContent = `請先閱讀觀念解析 (${cd}s)...`;
          }
        }, 1000);

        closeBtn.onclick = () => {
          modal.classList.add('hidden');
          startResumeCountdown();
        };
      }
    };
    optionsGrid.appendChild(btn);
  });
}

// 7. 解凍 3-2-1 倒數與防貼臉彈開機制
function startResumeCountdown(callback) {
  isCountingDown = true;
  const overlay = document.getElementById('countdown-overlay');
  const numEl = document.getElementById('countdown-num');
  overlay.classList.remove('hidden');

  let count = 3;
  numEl.textContent = count;

  // 防貼臉：將 3.5 格範圍內的鬼魂彈回中央重生
  ghosts.forEach(g => {
    const dist = Math.hypot(player.x - g.x, player.y - g.y);
    if (dist < TILE_SIZE * 3.5) {
      g.x = 6 * TILE_SIZE;
      g.y = 5 * TILE_SIZE;
    }
  });

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      numEl.textContent = count;
    } else {
      clearInterval(timer);
      overlay.classList.add('hidden');
      isCountingDown = false;
      isTimeFrozen = false;
      invulnerableTimer = 90; // 1.5 秒無敵閃爍保護
      if (callback) callback();
    }
  }, 600);
}

// 8. 建造抗體砲塔（無原生 alert，使用 Floating Text 提示）
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
      towers.push({ x: tileX * TILE_SIZE + 16, y: tileY * TILE_SIZE + 16, range: 110, cooldown: 0 });
      MAP_TILES[tileY][tileX] = 2; // 變更為平地
      sfx.playBuild();
      addFloatingText("🛡️ 抗體哨站建立完成！", player.x + 16, player.y - 12, "#10b981");
      updateUI();
    });
  }
}

// 9. 遊戲主循環
function gameLoop() {
  if (!isTimeFrozen && !isCountingDown) {
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

  // 吃豆判定
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

    // 45 顆豆子觸發一次課堂 ATP 哨卡題 (平滑節奏，不干擾同學)
    if (dotsEatenCount > 0 && dotsEatenCount % 45 === 0) {
      triggerQuiz('ATP_CHECK', () => {
        atp += 20;
        score += 80;
        addFloatingText("⚡ ATP 充沛爆發 +20!", player.x + 16, player.y - 12, "#facc15");
        updateUI();
      });
    }
  } else if (tileType === 3) { // 粒線體
    MAP_TILES[currRow][currCol] = 2;
    triggerQuiz('MITO', () => {
      powerModeTimer = 480; // 8秒無敵反殺
      sfx.playPower();
      addFloatingText("⚡ 呼吸作用無敵開啟!", player.x + 16, player.y - 12, "#ff5555");
    });
  } else if (tileType === 4) { // 葉綠體
    MAP_TILES[currRow][currCol] = 2;
    triggerQuiz('CHLO', () => {
      atp += 30;
      slowModeTimer = 360; // 6秒全場病原體緩速
      sfx.playPower();
      addFloatingText("🌿 葉綠體光合作用緩速!", player.x + 16, player.y - 12, "#22c55e");
      updateUI();
    });
  }

  // 🛡️ 抗體砲塔邏輯：1.5s 冷卻發射抗體子彈 (修復 Bug 1 瞬間多刷)
  towers.forEach(t => {
    if (t.cooldown > 0) t.cooldown--;
    if (t.cooldown <= 0) {
      // 搜尋範圍內的病原體
      const targetGhost = ghosts.find(g => Math.hypot(t.x - (g.x + 16), t.y - (g.y + 16)) <= t.range);
      if (targetGhost) {
        bullets.push({ x: t.x, y: t.y, targetX: targetGhost.x + 16, targetY: targetGhost.y + 16, targetGhost, speed: 6 });
        t.cooldown = 90; // 1.5秒射擊冷卻
      }
    }
  });

  // 更新抗體子彈位置
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const dx = (b.targetGhost.x + 16) - b.x;
    const dy = (b.targetGhost.y + 16) - b.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) {
      // 擊中病原體
      b.targetGhost.x = 6 * TILE_SIZE;
      b.targetGhost.y = 5 * TILE_SIZE;
      kills++;
      score += 50;
      sfx.playHit();
      addFloatingText("🎯 抗體命中擊破!", b.targetGhost.x + 16, b.targetGhost.y - 10, "#38bdf8");
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
        // 反殺病原體
        g.x = 6 * TILE_SIZE;
        g.y = 5 * TILE_SIZE;
        kills++;
        score += 100;
        sfx.playHit();
        addFloatingText("💥 吞噬病原體 +100", player.x + 16, player.y - 12, "#facc15");
        updateUI();
      } else if (invulnerableTimer <= 0) {
        // 扣血
        lives--;
        player.x = 1 * TILE_SIZE;
        player.y = 1 * TILE_SIZE;
        addFloatingText("💔 免疫防線受損!", player.x + 16, player.y - 12, "#ef4444");
        updateUI();
        if (lives <= 0) endGame();
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

function renderGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 繪製地圖牆壁與豆子
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
        // 粒線體
        ctx.fillStyle = '#ff5555';
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 16, 9, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 4) {
        // 葉綠體
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 5) {
        // 塔基座
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      }
    }
  }

  // 繪製抗體砲塔
  towers.forEach(t => {
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(t.x - 10, t.y - 10, 20, 20);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 繪製抗體子彈
  bullets.forEach(b => {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // 繪製玩家（巨噬細胞）
  if (invulnerableTimer === 0 || Math.floor(invulnerableTimer / 8) % 2 === 0) {
    ctx.fillStyle = powerModeTimer > 0 ? '#facc15' : '#60a5fa';
    ctx.beginPath();
    ctx.arc(player.x + 16, player.y + 16, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // 繪製病原體鬼魂
  ghosts.forEach(g => {
    ctx.fillStyle = powerModeTimer > 0 ? '#3b82f6' : g.color;
    ctx.beginPath();
    ctx.arc(g.x + 16, g.y + 16, 11, 0, Math.PI * 2);
    ctx.fill();
  });

  // 繪製 Floating Text 飄字
  floatingTexts.forEach(ft => {
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  });
}

function updateUI() {
  document.getElementById('atp-val').textContent = atp;
  document.getElementById('correct-count').textContent = answeredCorrect;
  document.getElementById('lives-val').textContent = '❤️'.repeat(Math.max(0, lives));
}

// 10. 結算畫面與防偽評量卡
function endGame() {
  isTimeFrozen = true;
  const modal = document.getElementById('result-modal');
  modal.classList.remove('hidden');

  document.getElementById('final-score').textContent = score;
  const acc = answeredTotal > 0 ? Math.round((answeredCorrect / answeredTotal) * 100) : 0;
  document.getElementById('final-accuracy').textContent = `${acc}%`;
  document.getElementById('final-kills').textContent = kills;

  const randNum = Math.floor(1000 + Math.random() * 9000);
  document.getElementById('security-code').textContent = `PAC-${randNum}`;

  const wrongBox = document.getElementById('wrong-summary');
  const wrongListEl = document.getElementById('wrong-list');
  if (wrongList.length > 0) {
    wrongBox.classList.remove('hidden');
    wrongListEl.innerHTML = '';
    wrongList.forEach(item => {
      const li = document.createElement('li');
      li.style.marginBottom = '6px';
      li.innerHTML = `<strong>${item.q}</strong><br><span style="color:#10b981;">正確解答：${item.right}</span> | ${item.desc}`;
      wrongListEl.appendChild(li);
    });
  }
}
