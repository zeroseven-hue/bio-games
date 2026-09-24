/* ========================================================
   生物小蜜蜂：星際防衛隊 (Bio Defender) V2.0 遊戲核心邏輯
   ======================================================== */

// 預設備用題庫 (當網路或離線無法 fetch 時自動降級使用)
const DEFAULT_QUESTION_BANK = [
  {
    q: "下列哪一種構造，在常見的『水稻葉肉細胞』中存在，但在『口腔皮膜細胞』中找不到？",
    options: { A: "細胞核", B: "粒線體", C: "細胞壁", D: "細胞膜" },
    ans: "C",
    hint: "植物細胞具有細胞壁與葉綠體，動物細胞則沒有！"
  },
  {
    q: "被稱為細胞的『能量工廠』，主要負責進行呼吸作用產生能量 (ATP) 的構造是？",
    options: { A: "核糖體", B: "葉綠體", C: "高基氏體", D: "粒線體" },
    ans: "D",
    hint: "粒線體是動植物細胞呼吸作用的主要場所。"
  },
  {
    q: "下列關於原核生物（如大腸桿菌、乳酸菌）的敘述，何者正確？",
    options: { A: "缺乏遺傳物質 DNA", B: "沒有成形的細胞核", C: "細胞內含有葉綠體", D: "構造複雜屬於多細胞" },
    ans: "B",
    hint: "原核生物具有遺傳物質，但沒有由核膜包覆的成形細胞核。"
  },
  {
    q: "紅血球置入哪一種液體中時，會因為水分大量滲入而導致『膨脹破裂』？",
    options: { A: "濃食鹽水", B: "生理食鹽水", C: "純水", D: "高濃度糖水" },
    ans: "C",
    hint: "純水濃度低於細胞內液，水分子大量滲透進入導致細胞脹破。"
  },
  {
    q: "植物進行光合作用時，『光反應』分解水分子後，釋放出的氣體是？",
    options: { A: "二氧化碳", B: "氧氣", C: "氮氣", D: "水蒸氣" },
    ans: "B",
    hint: "光反應藉由光能將水裂解，釋放出氧氣。"
  },
  {
    q: "使用碘液檢驗煮熟的米飯時，若含有澱粉，顏色會轉變成？",
    options: { A: "藍黑色", B: "黃褐色", C: "磚紅色", D: "鮮綠色" },
    ans: "A",
    hint: "碘液原本是黃褐色，遇到澱粉會呈現藍黑色反應。"
  },
  {
    q: "向日葵莖內負責由下往上運送『水分與無機鹽』的組織是？",
    options: { A: "形成層", B: "木質部", C: "韌皮部", D: "表皮組織" },
    ans: "B",
    hint: "木質部運送水分（單向向上）；韌皮部運送養分。"
  },
  {
    q: "人體血液成分中，當體內遭受病原體入侵時，數量會明顯增加以吞噬病菌的是？",
    options: { A: "紅血球", B: "白血球", C: "血小板", D: "血漿蛋白" },
    ans: "B",
    hint: "白血球具備防禦免疫功能，能吞噬外來病原體。"
  },
  {
    q: "被稱為『內分泌總指揮』，能分泌多種激素調節其他腺體的是？",
    options: { A: "甲狀腺", B: "腦垂腺", C: "腎上腺", D: "胰島" },
    ans: "B",
    hint: "腦垂腺位於腦部下方，控制人體生長及多數腺體分泌。"
  },
  {
    q: "人體激烈運動後呼吸加速，主要是血液中哪種物質濃度上升，刺激了腦幹呼吸中樞？",
    options: { A: "氧氣", B: "二氧化碳", C: "葡萄糖", D: "尿素" },
    ans: "B",
    hint: "血液中二氧化碳濃度上升是刺激腦幹加速呼吸的主要訊號。"
  }
];

/* ========================================================
   1. 音效晶片 (Web Audio API)
   ======================================================== */
let audioCtx = null;
let isSoundOn = true;

function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn("AudioContext not supported", e);
  }
}

function toggleSound() {
  isSoundOn = !isSoundOn;
  const btn = document.getElementById("sound-btn");
  if (btn) btn.textContent = isSoundOn ? "🔊 音效" : "🔇 靜音";
}

function playTone(freq, type, duration, startVol = 0.12) {
  if (!isSoundOn || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(startVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function soundLaser() { playTone(750, 'sine', 0.08, 0.15); }
function soundHitCorrect() {
  playTone(523, 'triangle', 0.1);
  setTimeout(() => playTone(784, 'triangle', 0.2), 80);
}
function soundExplode() { playTone(110, 'sawtooth', 0.35, 0.22); }
function soundVictory() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'sine', 0.25, 0.2), idx * 120);
  });
}
function soundGameOver() {
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'sawtooth', 0.25, 0.2), idx * 120);
  });
}

/* ========================================================
   2. 全域狀態與單元題庫動態載入
   ======================================================== */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let cw = 400, ch = 500;

let manifestData = null;
let currentUnitId = "ch01";
let loadedBankMap = {}; // 暫存已載入的單元題庫

let gameQuestions = [];
let currentQIndex = 0;
let score = 0;
let lives = 3;
let combo = 0;
let isOverheated = false;
let qTimeRemaining = 25;
let qTimer = null;
let isRunning = false;
let logs = [];
let playerProfile = { cls: "", seat: "", name: "" };

let player = { x: 200, y: 400, w: 46, h: 42, speed: 7.5 };
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];
let keys = {};
let gameTick = 0;

/* 讀取 URL 參數與載入 Manifest */
async function initManifestAndUnits() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramUnit = urlParams.get("unit");

  try {
    const resp = await fetch("../manifest.json");
    if (resp.ok) {
      manifestData = await resp.json();
      populateUnitSelects(manifestData.units);
      if (paramUnit && (manifestData.units.some(u => u.id === paramUnit) || paramUnit === 'all')) {
        currentUnitId = paramUnit;
      } else {
        currentUnitId = manifestData.default_unit || "ch01";
      }
    } else {
      throw new Error("Manifest HTTP error");
    }
  } catch (e) {
    console.warn("無法讀取 manifest.json，使用預設 10 單元清單", e);
    const fallbackUnits = Array.from({ length: 10 }, (_, i) => ({
      id: `ch${String(i + 1).padStart(2, '0')}`,
      title: `第 ${i + 1} 單元：生物主題測驗`
    }));
    populateUnitSelects(fallbackUnits);
    currentUnitId = paramUnit || "ch01";
  }

  // 設定選單預設值
  const selTop = document.getElementById("unit-select");
  const selModal = document.getElementById("modal-unit-select");
  if (selTop) selTop.value = currentUnitId;
  if (selModal) selModal.value = currentUnitId;
  updateUnitDisplayTitle();
}

function populateUnitSelects(units) {
  const selects = [document.getElementById("unit-select"), document.getElementById("modal-unit-select")];
  selects.forEach(sel => {
    if (!sel) return;
    sel.innerHTML = "";

    // 全部綜合題庫選項
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "🌟 ALL 全單元綜合題庫";
    sel.appendChild(optAll);

    units.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = `${u.id.toUpperCase()} - ${u.title}`;
      sel.appendChild(opt);
    });
  });
}

function onUnitChange(val) {
  currentUnitId = val;
  const selTop = document.getElementById("unit-select");
  const selModal = document.getElementById("modal-unit-select");
  if (selTop) selTop.value = val;
  if (selModal) selModal.value = val;
  updateUnitDisplayTitle();
}

function updateUnitDisplayTitle() {
  const disp = document.getElementById("unit-display-name");
  if (!disp) return;
  if (currentUnitId === "all") {
    disp.textContent = "📚 全單元綜合大考驗";
    return;
  }
  if (manifestData && manifestData.units) {
    const u = manifestData.units.find(item => item.id === currentUnitId);
    if (u) {
      disp.textContent = `📚 ${u.title}`;
      return;
    }
  }
  disp.textContent = `📚 單元 ${currentUnitId.toUpperCase()}`;
}

/* 根據 currentUnitId 取得題庫 */
async function fetchQuestionsForCurrentUnit() {
  if (currentUnitId === "all") {
    let allPool = [];
    if (manifestData && manifestData.units) {
      for (const u of manifestData.units) {
        const pool = await loadSingleUnitFile(u.id);
        allPool = allPool.concat(pool);
      }
    }
    return allPool.length > 0 ? allPool : DEFAULT_QUESTION_BANK;
  } else {
    const pool = await loadSingleUnitFile(currentUnitId);
    return pool.length > 0 ? pool : DEFAULT_QUESTION_BANK;
  }
}

async function loadSingleUnitFile(unitId) {
  if (loadedBankMap[unitId]) return loadedBankMap[unitId];
  try {
    const resp = await fetch(`../questions_${unitId}.json`);
    if (resp.ok) {
      const data = await resp.json();
      const qList = data.questions || data;
      // 轉換欄位格式
      const formatted = qList.map(item => ({
        q: item.question || item.q,
        options: item.options,
        ans: item.answer || item.ans,
        hint: item.explanation || item.hint || "請仔細審題觀念！"
      }));
      loadedBankMap[unitId] = formatted;
      return formatted;
    }
  } catch (e) {
    console.warn(`無法載入 questions_${unitId}.json:`, e);
  }
  return [];
}

/* ========================================================
   3. 畫布調整與星空背景
   ======================================================== */
function resizeCanvas() {
  const wrap = document.getElementById("canvas-wrap");
  cw = canvas.width = wrap.clientWidth || 360;
  ch = canvas.height = wrap.clientHeight || 500;
  player.y = ch - 55;
  if (!player.x || player.x === 200) player.x = cw / 2;
}
window.addEventListener("resize", resizeCanvas);

function initStars() {
  stars = [];
  for (let i = 0; i < 45; i++) {
    stars.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: Math.random() * 1.6 + 0.6,
      vy: Math.random() * 1.2 + 0.4,
      alpha: Math.random() * 0.7 + 0.3
    });
  }
}

/* ========================================================
   4. 啟動與載入題目關卡
   ======================================================== */
async function startMission() {
  const cEl = document.getElementById("user-class");
  const sEl = document.getElementById("user-seat");
  const nEl = document.getElementById("user-name");

  const c = cEl ? cEl.value.trim() : "";
  const s = sEl ? sEl.value.trim() : "";
  const n = nEl ? nEl.value.trim() : "";

  if (!c || !s || !n) {
    alert("請務必完整輸入班級、座號與姓名！");
    return;
  }
  playerProfile = { cls: c, seat: s, name: n };
  initAudio();

  const modeEl = document.getElementById("mode-select");
  if (modeEl && modeEl.value === "bigscreen") {
    document.getElementById("bigscreen-pad").style.display = "flex";
  } else {
    document.getElementById("bigscreen-pad").style.display = "none";
  }

  // 取得題庫資料
  const pool = await fetchQuestionsForCurrentUnit();
  gameQuestions = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);

  // 關閉開始選單
  document.getElementById("start-modal").style.display = "none";

  resizeCanvas();
  initStars();

  score = 0;
  lives = 3;
  combo = 0;
  currentQIndex = 0;
  logs = [];
  particles = [];
  bullets = [];
  isRunning = true;

  updateHUD();
  loadQuestion(0);
  requestAnimationFrame(gameLoop);
}

function loadQuestion(idx) {
  if (idx >= gameQuestions.length || lives <= 0) {
    endMission();
    return;
  }

  const q = gameQuestions[idx];
  document.getElementById("q-text").textContent = `Q${idx + 1}. ${q.q}`;
  document.getElementById("opt-A").textContent = `A. ${q.options.A}`;
  document.getElementById("opt-B").textContent = `B. ${q.options.B}`;
  document.getElementById("opt-C").textContent = `C. ${q.options.C}`;
  document.getElementById("opt-D").textContent = `D. ${q.options.D}`;

  const monsterTypes = [
    { letter: 'A', theme: '#ff5252', name: "octopus" },
    { letter: 'B', theme: '#448aff', name: "jellyfish" },
    { letter: 'C', theme: '#ffd740', name: "cyclops" },
    { letter: 'D', theme: '#69f0ae', name: "slime" }
  ];

  enemies = [];
  const span = cw / 4;
  for (let i = 0; i < 4; i++) {
    enemies.push({
      ...monsterTypes[i],
      x: span * i + span / 2,
      y: 75,
      baseX: span * i + span / 2,
      baseY: 75 + (i % 2) * 12,
      w: 42,
      h: 42
    });
  }

  bullets = [];
  qTimeRemaining = 25;
  startTimer();
}

function startTimer() {
  clearInterval(qTimer);
  qTimer = setInterval(() => {
    if (!isRunning) return;
    qTimeRemaining -= 0.1;
    const pct = Math.max(0, (qTimeRemaining / 25) * 100);
    document.getElementById("time-fill").style.width = pct + "%";

    if (qTimeRemaining <= 0) {
      clearInterval(qTimer);
      handleTimeout();
    }
  }, 100);
}

function handleTimeout() {
  lives--;
  combo = 0;
  updateHUD();
  soundExplode();
  const current = gameQuestions[currentQIndex];
  logs.push({ q: current.q, correct: false, ans: current.ans, reason: "思考逾時" });
  showHint(`⏰ 時間到！正確答案是 [${current.ans}]。<br>${current.hint}`);
}

/* ========================================================
   5. 操控與鎖定雷射發射邏輯 (無連發限制)
   ======================================================== */
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space") {
    fireBullet();
  } else if (e.code === "KeyA") {
    directShoot('A');
  } else if (e.code === "KeyB") {
    directShoot('B');
  } else if (e.code === "KeyC") {
    directShoot('C');
  } else if (e.code === "KeyD") {
    directShoot('D');
  }
});

window.addEventListener("keyup", (e) => { keys[e.code] = false; });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  player.x = touch.clientX - rect.left;
}, { passive: false });

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  player.x = touch.clientX - rect.left;
  fireBullet();
});

/* 直覺鎖定發射：大黑板觸控或按 A/B/C/D 鍵 */
function directShoot(letter) {
  if (isOverheated || !isRunning) return;
  const target = enemies.find(e => e.letter === letter);
  if (target) {
    player.x = target.x; // 戰機立刻移至對應怪物下方
    fireBullet();
  }
}

/* 無限制發射（移除原本 bullets.length >= 2 的鎖死問題） */
function fireBullet() {
  if (isOverheated || !isRunning) return;
  bullets.push({ x: player.x, y: player.y - 18, vy: -11, r: 6 });
  soundLaser();
}

function hitTarget(enemy) {
  clearInterval(qTimer); // 暫停倒數計時器
  const q = gameQuestions[currentQIndex];
  createBurstParticles(enemy.x, enemy.y, enemy.theme);

  if (enemy.letter === q.ans) {
    soundHitCorrect();
    combo++;
    const speedBonus = Math.floor(qTimeRemaining * 10);
    score += 100 + combo * 25 + speedBonus;
    logs.push({ q: q.q, correct: true, ans: q.ans });
    updateHUD();
    currentQIndex++;
    loadQuestion(currentQIndex);
  } else {
    soundExplode();
    lives--;
    combo = 0;
    updateHUD();
    logs.push({ q: q.q, correct: false, ans: q.ans, myAns: enemy.letter });
    triggerOverheat();
    showHint(`❌ 擊中 [${enemy.letter}] 錯囉！正確答案是 [${q.ans}]。<br>${q.hint}`);
  }
}

function triggerOverheat() {
  isOverheated = true;
  setTimeout(() => { isOverheated = false; }, 2500);
}

function showHint(html) {
  clearInterval(qTimer); // 確保觀看說明時時間停止
  const banner = document.getElementById("hint-banner");
  banner.innerHTML = html;
  banner.style.display = "block";
  setTimeout(() => {
    banner.style.display = "none";
    currentQIndex++;
    loadQuestion(currentQIndex);
  }, 3500);
}

function updateHUD() {
  document.getElementById("lives-val").textContent = lives;
  document.getElementById("score-val").textContent = score;
  document.getElementById("combo-val").textContent = combo;
}

function createBurstParticles(x, y, color) {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * 4 + 2,
      color,
      alpha: 1,
      decay: Math.random() * 0.03 + 0.02
    });
  }
}

/* ========================================================
   6. 繪製引擎 (全原生畫布繪製)
   ======================================================== */
function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);

  const flameHeight = Math.sin(gameTick * 0.4) * 4 + 14;
  ctx.fillStyle = isOverheated ? "#475569" : (combo >= 2 ? "#fbbf24" : "#38bdf8");
  ctx.beginPath();
  ctx.ellipse(0, 16, 6, flameHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isOverheated ? "#64748b" : (combo >= 2 ? "#f59e0b" : "#0284c7");
  ctx.beginPath();
  ctx.ellipse(0, 4, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isOverheated ? "#475569" : "#38bdf8";
  ctx.beginPath();
  ctx.arc(-18, 6, 7, 0, Math.PI * 2);
  ctx.arc(18, 6, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e0f2fe";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(-3, 0, 2.5, 0, Math.PI * 2);
  ctx.arc(3, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -18);
  ctx.stroke();

  ctx.fillStyle = combo >= 2 ? "#fbbf24" : "#38bdf8";
  ctx.beginPath();
  ctx.arc(0, -19, 3.5, 0, Math.PI * 2);
  ctx.fill();

  if (isOverheated) {
    ctx.fillStyle = "#f43f5e";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("💤 戰機冷卻中", 0, -25);
  }
  ctx.restore();
}

function drawMonster(e) {
  ctx.save();
  ctx.translate(e.x, e.y);

  const bubbleY = -24 + Math.sin(gameTick * 0.1) * 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, bubbleY, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = e.theme;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e.letter, 0, bubbleY + 1);

  ctx.fillStyle = e.theme;

  if (e.name === "octopus") {
    ctx.beginPath();
    ctx.arc(0, 0, 16, Math.PI, 0);
    ctx.lineTo(16, 8);
    const wave = Math.sin(gameTick * 0.15) * 3;
    ctx.quadraticCurveTo(8, 18 + wave, 0, 8);
    ctx.quadraticCurveTo(-8, 18 - wave, -16, 8);
    ctx.closePath();
    ctx.fill();
    drawEyes(-5, 0, 5, 0);

  } else if (e.name === "jellyfish") {
    ctx.beginPath();
    ctx.arc(0, -2, 17, Math.PI, 0);
    ctx.quadraticCurveTo(0, 12, -17, -2);
    ctx.fill();

    ctx.strokeStyle = e.theme;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 6);
    ctx.lineTo(-8, 15 + Math.sin(gameTick * 0.2) * 4);
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 18 + Math.cos(gameTick * 0.2) * 4);
    ctx.moveTo(8, 6);
    ctx.lineTo(8, 15 - Math.sin(gameTick * 0.2) * 4);
    ctx.stroke();
    drawEyes(-5, -3, 5, -3);

  } else if (e.name === "cyclops") {
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -1, 8, 0, Math.PI * 2);
    ctx.fill();

    const eyeMove = Math.sin(gameTick * 0.08) * 2;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(eyeMove, 0, 4, 0, Math.PI * 2);
    ctx.fill();

  } else if (e.name === "slime") {
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(18, -10, 20, 14, 0, 14);
    ctx.bezierCurveTo(-20, 14, -18, -10, 0, -18);
    ctx.fill();

    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(4, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    drawEyes(-6, 0, 6, 0);
  }

  ctx.restore();
}

function drawEyes(x1, y1, x2, y2) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x1, y1, 4, 0, Math.PI * 2);
  ctx.arc(x2, y2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(x1, y1, 2, 0, Math.PI * 2);
  ctx.arc(x2, y2, 2, 0, Math.PI * 2);
  ctx.fill();
}

/* 遊戲主迴圈 */
function gameLoop() {
  if (!isRunning) return;
  gameTick++;

  ctx.clearRect(0, 0, cw, ch);

  stars.forEach(s => {
    s.y += s.vy;
    if (s.y > ch) s.y = 0;
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;
  player.x = Math.max(player.w / 2, Math.min(cw - player.w / 2, player.x));
  drawPlayer(player.x, player.y);

  enemies.forEach(e => {
    e.x = e.baseX + Math.sin(gameTick * 0.04) * 22;
    e.y = e.baseY + Math.cos(gameTick * 0.06) * 6;
    drawMonster(e);
  });

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y += b.vy;

    ctx.save();
    ctx.fillStyle = combo >= 2 ? "#fbbf24" : "#00e5ff";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    let hit = false;
    for (let j = 0; j < enemies.length; j++) {
      const e = enemies[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < 26) {
        hit = true;
        hitTarget(e);
        break;
      }
    }
    if (hit || b.y < 0) bullets.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

/* ========================================================
   7. 結算與一鍵複製防偽證書成績
   ======================================================== */
function endMission() {
  isRunning = false;
  clearInterval(qTimer);

  document.getElementById("end-modal").style.display = "flex";

  const correctCount = logs.filter(l => l.correct).length;
  let rank = "🌱 微生物小實習生";
  if (score >= 1000 && correctCount >= 9) {
    rank = "👑 傳奇達爾文星艦艦長";
    soundVictory();
  } else if (score >= 600) {
    rank = "🧬 細胞防衛隊長";
    soundVictory();
  } else {
    soundGameOver();
  }
  document.getElementById("end-rank").textContent = `評級：${rank}`;

  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ` +
                  `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  const rawCode = `${playerProfile.seat}_${score}_${now.getSeconds()}`;
  let hash = 0;
  for (let i = 0; i < rawCode.length; i++) {
    hash = ((hash << 5) - hash) + rawCode.charCodeAt(i);
    hash |= 0;
  }
  const certHash = "DEFENDER-" + Math.abs(hash).toString(16).toUpperCase().padStart(6, '0');

  const userTag = `${playerProfile.cls} 班 ${playerProfile.seat} 號 ${playerProfile.name}`;
  document.getElementById("cert-user").textContent = userTag;
  document.getElementById("cert-watermark").textContent = userTag;
  document.getElementById("cert-score").textContent = score;
  document.getElementById("cert-stats").textContent = `${correctCount} / ${gameQuestions.length}`;
  document.getElementById("cert-time").textContent = timeStr;
  document.getElementById("cert-hash").textContent = certHash;

  const listEl = document.getElementById("review-list");
  listEl.innerHTML = "";
  logs.forEach((l, idx) => {
    const div = document.createElement("div");
    div.className = `review-item ${l.correct ? 'correct' : 'wrong'}`;
    div.innerHTML = `<strong>第 ${idx + 1} 題：</strong>${l.q}<br>` +
      (l.correct ? `✅ 正確` : `❌ 你的選擇: [${l.myAns || l.reason}]（正解: [${l.ans}]）`);
    listEl.appendChild(div);
  });
}

/* 一鍵複製防偽文字報告 */
function copyCertText() {
  const userTag = document.getElementById("cert-user").textContent;
  const scoreVal = document.getElementById("cert-score").textContent;
  const statsVal = document.getElementById("cert-stats").textContent;
  const timeVal = document.getElementById("cert-time").textContent;
  const hashVal = document.getElementById("cert-hash").textContent;
  const rankVal = document.getElementById("end-rank").textContent;

  const textToCopy = `【生物小蜜蜂：星際防衛隊 防偽認證戰報】\n` +
    `👤 隊員身分：${userTag}\n` +
    `🎖️ 任務評級：${rankVal}\n` +
    `🏆 最終分數：${scoreVal} 分\n` +
    `🎯 答對題數：${statsVal}\n` +
    `📅 完成時間：${timeVal}\n` +
    `🔒 防偽驗證碼：${hashVal}\n` +
    `🌱 驗證平台：bio-games (GitHub Pages)`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert("✅ 已成功複製完整防偽成績單！可以直接貼上至 Google Classroom 繳交作業。");
    }).catch(() => {
      fallbackCopy(textToCopy);
    });
  } else {
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    alert("✅ 已成功複製完整防偽成績單！可以直接貼上至 Google Classroom 繳交作業。");
  } catch (err) {
    alert("複製失敗，請直接螢幕截圖上傳。");
  }
  document.body.removeChild(textArea);
}

// 頁面載入初始化
window.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  initManifestAndUnits();
});
