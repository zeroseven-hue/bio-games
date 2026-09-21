/**
 * 生物大墜落：細胞深淵下樓梯 (Bio-Shaft: Cell Abyss) - 遊戲引擎 V2.0 旗艦極限版
 * 1. 經典《小朋友下樓梯》物理引擎 (Delta-Time dt，保證高更新率螢幕絕不加速)。
 * 2. 徹底消除「無階梯落腳墜樓」：維持畫面 6 座高密度均勻階梯，溫和爬升速度 (1.4px/frame)。
 * 3. 28% 子彈時間「二選一命運階梯」(左🅰️ vs 右🅱️ 寬體大平台降落)。
 * 4. 題目自動精簡至 25 字以內，方便學生秒讀下跳。
 * 5. 答錯安全保底網：踩錯階梯碎裂扣心後，正下方 100% 強制刷出安全普通階梯接住角色，防止二次墜樓。
 * 6. 頂部浮動觀念筆記 (不遮擋畫布，流暢進行) + 深淵熱氣流救援保底 (扣 1 心彈回頂部)。
 * 7. 畫面下方巨型 iPad 左右盲操實體按鈕 (> 54px)。
 */

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

let hearts = 5;
let maxHearts = 5;
let depth = 0;
let maxDepth = 0;
let gameTimeSeconds = 0;
let baseSpeed = 1.0;
let speedMultiplier = 1.0;
let isBulletTime = false;
let isGameRunning = false;
let isTeacherFrozen = false;
let isTextZoomed = false;

let gameLoopTimer = null;
let secondsTimer = null;
let lastFrameTime = Date.now();

// 玩家角色物理屬性
const player = {
  x: 386,
  y: 80,
  vx: 0,
  vy: 0,
  width: 28,
  height: 36,
  speed: 5.8,
  isGrounded: false,
  invincibleTimer: 0,
  avatar: "🧍‍♂️"
};

// 輸入狀態
const keys = { left: false, right: false };

// 階梯與物體 (維繫畫面上固定 6~7 座均勻階梯)
let stairs = [];
let stairIdCounter = 0;
let stairCountCounter = 0;

let currentFateQuestion = null;
let isFateStairActive = false;

let allManifestUnits = [];
let rawQuestionsByUnit = {};
let questionPoolByUnit = {};
let audioCtx = null;
let soundEnabled = true;

// DOM 引用
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const canvasContainer = document.getElementById("canvasContainer");

const modeTag = document.getElementById("modeTag");
const heartsDisplay = document.getElementById("heartsDisplay");
const depthDisplay = document.getElementById("depthDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const selectSpeed = document.getElementById("selectSpeed");
const selectUnit = document.getElementById("selectUnit");
const unitInfoText = document.getElementById("unitInfoText");

const conceptToast = document.getElementById("conceptToast");
const conceptToastText = document.getElementById("conceptToastText");
const touchGuideOverlay = document.getElementById("touchGuideOverlay");

const btnTouchLeft = document.getElementById("btnTouchLeft");
const btnTouchRight = document.getElementById("btnTouchRight");

const btnZoomText = document.getElementById("btnZoomText");
const btnRules = document.getElementById("btnRules");
const btnFreeze = document.getElementById("btnFreeze");
const btnSound = document.getElementById("btnSound");

const rulesModal = document.getElementById("rulesModal");
const btnCloseRules = document.getElementById("btnCloseRules");
const victoryModal = document.getElementById("victoryModal");
const victoryTitle = document.getElementById("victoryTitle");
const inputSeatNo = document.getElementById("inputSeatNo");
const inputStudentName = document.getElementById("inputStudentName");
const inputReflection = document.getElementById("inputReflection");
const certCodeValue = document.getElementById("certCodeValue");
const btnCopyCert = document.getElementById("btnCopyCert");
const btnRestartGame = document.getElementById("btnRestartGame");
const teacherFreezeModal = document.getElementById("teacherFreezeModal");
const btnUnfreeze = document.getElementById("btnUnfreeze");

// 頁面初始化
window.addEventListener("DOMContentLoaded", async () => {
  setupCanvasDPI();
  initEventListeners();
  await loadManifestAndUnits();
  resetGame();
});

// Canvas DPI 適配 (Retina 高解析度不跑版)
function setupCanvasDPI() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.scale(dpr, dpr);
}

function initEventListeners() {
  document.addEventListener("click", unlockAudioContext, { once: true });
  document.addEventListener("touchstart", unlockAudioContext, { once: true });

  // 鍵盤控制
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
      e.preventDefault();
      toggleTeacherFreeze();
    }
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
  });

  // 畫面下方巨型 iPad 觸控按鈕
  if (btnTouchLeft && btnTouchRight) {
    btnTouchLeft.addEventListener("touchstart", (e) => { e.preventDefault(); keys.left = true; }, { passive: false });
    btnTouchLeft.addEventListener("touchend", (e) => { e.preventDefault(); keys.left = false; }, { passive: false });
    btnTouchLeft.addEventListener("mousedown", () => keys.left = true);
    btnTouchLeft.addEventListener("mouseup", () => keys.left = false);

    btnTouchRight.addEventListener("touchstart", (e) => { e.preventDefault(); keys.right = true; }, { passive: false });
    btnTouchRight.addEventListener("touchend", (e) => { e.preventDefault(); keys.right = false; }, { passive: false });
    btnTouchRight.addEventListener("mousedown", () => keys.right = true);
    btnTouchRight.addEventListener("mouseup", () => keys.right = false);
  }

  // iPad 全螢幕雙側觸控區域盲操
  canvasContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvasContainer.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  canvasContainer.addEventListener("touchend", handleTouchEnd, { passive: false });

  selectSpeed.addEventListener("change", (e) => {
    baseSpeed = parseFloat(e.target.value) || 1.0;
  });

  btnZoomText.addEventListener("click", () => {
    isTextZoomed = !isTextZoomed;
    btnZoomText.classList.toggle("active-zoom", isTextZoomed);
    btnZoomText.textContent = isTextZoomed ? "🔍 題目已放大" : "🔍 放大題目";
  });

  btnRules.addEventListener("click", () => openModal(rulesModal));
  btnCloseRules.addEventListener("click", () => closeModal(rulesModal));
  btnFreeze.addEventListener("click", toggleTeacherFreeze);
  btnUnfreeze.addEventListener("click", toggleTeacherFreeze);
  btnSound.addEventListener("click", toggleSound);

  btnCopyCert.addEventListener("click", copyCertificationData);
  btnRestartGame.addEventListener("click", () => {
    closeModal(victoryModal);
    resetGame();
  });

  [inputSeatNo, inputStudentName].forEach(el => el.addEventListener("input", updateCertCode));

  setTimeout(() => {
    if (touchGuideOverlay) touchGuideOverlay.classList.add("fade-out");
  }, 4000);
}

function handleTouchStart(e) {
  e.preventDefault();
  unlockAudioContext();
  const rect = canvasContainer.getBoundingClientRect();
  for (let i = 0; i < e.touches.length; i++) {
    const t = e.touches[i];
    const touchX = t.clientX - rect.left;
    if (touchX < rect.width / 2) keys.left = true;
    else keys.right = true;
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  if (e.touches.length === 0) {
    keys.left = false;
    keys.right = false;
  }
}

// 音效系統
function unlockAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playTone(freq, type, duration, delay = 0, vol = 0.1) {
  if (!soundEnabled || isTeacherFrozen) return;
  unlockAudioContext();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
    osc.stop(audioCtx.currentTime + delay + duration);
  } catch (e) {}
}

function playJumpSound() { playTone(400, "sine", 0.08, 0, 0.1); }
function playHeartSound() { playTone(800, "sine", 0.1, 0, 0.12); playTone(1200, "sine", 0.15, 0.08, 0.12); }
function playHitSound() { playTone(150, "square", 0.15, 0, 0.15); }
function playFateSlowdown() { playTone(300, "sawtooth", 0.25, 0, 0.1); playTone(200, "sawtooth", 0.35, 0.1, 0.1); }
function playFanfare() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => playTone(f, "square", 0.1, i * 0.08, 0.12)); }

function toggleSound() {
  soundEnabled = !soundEnabled;
  btnSound.textContent = soundEnabled ? "🔊" : "🔇";
}

// 載入題庫
async function loadManifestAndUnits() {
  try {
    const res = await fetch("../questions/manifest.json");
    if (!res.ok) throw new Error("Manifest 載入失敗");
    const manifest = await res.json();
    allManifestUnits = manifest.units || [];

    selectUnit.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "ALL";
    allOpt.textContent = "📚 全單元綜合大亂鬥 (1~10單元混合)";
    selectUnit.appendChild(allOpt);

    allManifestUnits.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.file;
      opt.textContent = `${u.id.toUpperCase()} - ${u.title}`;
      selectUnit.appendChild(opt);
    });

    for (const u of allManifestUnits) {
      const qRes = await fetch(`../questions/${u.file}`);
      if (qRes.ok) {
        const qData = await qRes.json();
        rawQuestionsByUnit[u.file] = qData.questions || [];
      }
    }
  } catch (err) {
    console.warn("題庫載入警告:", err);
  }
}

function getNextQuestionFromPool(unitFile) {
  if (unitFile === "ALL") {
    let combined = [];
    Object.values(rawQuestionsByUnit).forEach(list => combined.push(...list));
    if (combined.length === 0) combined = getFallbackQuestions();
    if (!questionPoolByUnit["ALL"] || questionPoolByUnit["ALL"].length === 0) {
      questionPoolByUnit["ALL"] = shuffleArray([...combined]);
    }
    return questionPoolByUnit["ALL"].pop();
  }

  if (!questionPoolByUnit[unitFile] || questionPoolByUnit[unitFile].length === 0) {
    const rawList = rawQuestionsByUnit[unitFile] || getFallbackQuestions();
    questionPoolByUnit[unitFile] = shuffleArray([...rawList]);
  }
  return questionPoolByUnit[unitFile].pop();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getFallbackQuestions() {
  return [
    { id: 1, question: "下列何者為植物細胞行光合作用產生養分的主要胞器？", options: ["粒線體", "葉綠體", "液胞", "核糖體"], answer: 1, explanation: "葉綠體內含葉綠素，能吸收光能進行光合作用製造葡萄糖。" },
    { id: 2, question: "植物細胞具有而動物細胞通常缺乏的硬質結構為何？", options: ["細胞膜", "細胞核", "細胞壁", "細胞質"], answer: 2, explanation: "細胞壁主要成分為纖維素，能維持植物細胞形狀並提供保護。" }
  ];
}

// 重置遊戲與建立高密度安全階梯
function resetGame() {
  hearts = 5;
  depth = 0;
  maxDepth = 0;
  gameTimeSeconds = 0;
  isGameRunning = true;
  isBulletTime = false;
  speedMultiplier = 1.0;
  stairCountCounter = 0;

  player.x = CANVAS_WIDTH / 2 - 14;
  player.y = 80;
  player.vx = 0;
  player.vy = 0;
  player.isGrounded = false;
  player.invincibleTimer = 0;

  stairs = [];
  isFateStairActive = false;

  // 1. 初始化 6 座垂直均勻分佈的安全階梯 (距離 85px)
  for (let i = 0; i < 7; i++) {
    const y = 160 + i * 85;
    const width = 140;
    const x = Math.random() * (CANVAS_WIDTH - width - 60) + 30;
    stairs.push({
      id: stairIdCounter++,
      type: "NORMAL",
      x,
      y,
      width,
      height: 16,
      isCrumbled: false,
      crumbleTimer: 0
    });
  }

  updateUI();

  clearInterval(gameLoopTimer);
  clearInterval(secondsTimer);

  lastFrameTime = Date.now();
  gameLoopTimer = requestAnimationFrame(gameLoop);

  secondsTimer = setInterval(() => {
    if (isTeacherFrozen || !isGameRunning) return;
    gameTimeSeconds++;
    updateUI();
  }, 1000);
}

// 新增底層新階梯 (維繫畫面永遠保持 6~7 座階梯)
function spawnBottomStair(spawnY) {
  stairCountCounter++;

  // 每下樓 5~6 層，刷出一對「二選一命運問答階梯」
  if (stairCountCounter % 6 === 0 && !isFateStairActive) {
    spawnFateStairPair(spawnY);
    isFateStairActive = true;
    return;
  }

  const rand = Math.random();
  let type = "NORMAL";
  let width = 130 + Math.random() * 25;

  if (rand < 0.22) type = "CONVEYOR_LEFT";
  else if (rand < 0.44) type = "CONVEYOR_RIGHT";
  else if (rand < 0.60) type = "SPRING";
  else if (rand < 0.75) type = "CRUMBLE";
  else if (rand < 0.88) type = "HEART";

  const x = Math.random() * (CANVAS_WIDTH - width - 60) + 30;
  stairs.push({
    id: stairIdCounter++,
    type,
    x,
    y: spawnY,
    width,
    height: 16,
    isCrumbled: false,
    crumbleTimer: 0
  });
}

// 產生「二選一命運問答階梯」(左 🅰️ vs 右 🅱️ 寬體平台)
function spawnFateStairPair(y) {
  const unitFile = selectUnit.value || "ALL";
  currentFateQuestion = getNextQuestionFromPool(unitFile);

  // 精簡題幹至 25 字以內
  if (currentFateQuestion.question && currentFateQuestion.question.length > 25) {
    currentFateQuestion.shortStem = currentFateQuestion.question.substring(0, 24) + "...";
  } else {
    currentFateQuestion.shortStem = currentFateQuestion.question;
  }

  const opts = currentFateQuestion.options || ["選項A", "選項B"];
  const correctIdx = currentFateQuestion.answer;

  const correctText = opts[correctIdx];
  let wrongIdx = (correctIdx + 1) % opts.length;
  const wrongText = opts[wrongIdx];

  const isLeftCorrect = Math.random() < 0.5;

  const stairWidth = 320; // 寬體大平台
  const leftX = 40;
  const rightX = 440;

  const leftObj = {
    id: stairIdCounter++,
    type: "FATE_OPTION",
    x: leftX,
    y,
    width: stairWidth,
    height: 24,
    isCorrect: isLeftCorrect,
    text: `🅰️ ${isLeftCorrect ? correctText : wrongText}`,
    question: currentFateQuestion
  };

  const rightObj = {
    id: stairIdCounter++,
    type: "FATE_OPTION",
    x: rightX,
    y,
    width: stairWidth,
    height: 24,
    isCorrect: !isLeftCorrect,
    text: `🅱️ ${!isLeftCorrect ? correctText : wrongText}`,
    question: currentFateQuestion
  };

  stairs.push(leftObj, rightObj);
  playFateSlowdown();
}

// 遊戲主循環
function gameLoop() {
  if (!isGameRunning) return;

  const now = Date.now();
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  if (!isTeacherFrozen) {
    updatePhysics(dt);
  }

  renderCanvas();

  gameLoopTimer = requestAnimationFrame(gameLoop);
}

// 物理模擬與高密度階梯維護
function updatePhysics(dt) {
  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= dt;
  }

  // 接近命運階梯時觸發 28% 子彈時間
  const hasFateStairNear = stairs.some(s => s.type === "FATE_OPTION" && Math.abs(s.y - player.y) < 170);
  if (hasFateStairNear) {
    isBulletTime = true;
    speedMultiplier = 0.28;
  } else {
    isBulletTime = false;
    speedMultiplier = 1.0;
  }

  const currentSpeed = baseSpeed * speedMultiplier;

  // 1. 玩家左右移動
  if (keys.left) player.vx = -player.speed;
  else if (keys.right) player.vx = player.speed;
  else player.vx *= 0.8;

  player.x += player.vx;
  player.x = Math.max(10, Math.min(CANVAS_WIDTH - player.width - 10, player.x));

  // 2. 重力加速度
  player.vy += 0.45;
  player.y += player.vy;
  player.isGrounded = false;

  // 3. 階梯溫和上升 (1.4px/frame)
  const stairRiseSpeed = 1.4 * currentSpeed;

  for (let i = stairs.length - 1; i >= 0; i--) {
    const s = stairs[i];
    s.y -= stairRiseSpeed;

    // 檢查腳底碰撞
    const prevY = player.y - player.vy;
    if (
      player.vy >= 0 &&
      prevY + player.height <= s.y + 8 &&
      player.y + player.height >= s.y &&
      player.x + player.width > s.x &&
      player.x < s.x + s.width &&
      !s.isCrumbled
    ) {
      player.y = s.y - player.height;
      player.vy = 0;
      player.isGrounded = true;

      handleStairCollision(s);
    }

    // 移出頂部畫面時移除
    if (s.y < -35) {
      if (s.type === "FATE_OPTION") isFateStairActive = false;
      stairs.splice(i, 1);
    }
  }

  // 4. 維繫畫面上永遠保持 6~7 座均勻階梯 (最高間距 90px)
  const lowestStairY = Math.max(...stairs.map(s => s.y), 0);
  if (lowestStairY < CANVAS_HEIGHT - 60) {
    spawnBottomStair(lowestStairY + 90);
  }

  // 5. 頂部天花板尖刺碰撞
  if (player.y <= 25) {
    player.y = 35;
    player.vy = 4;
    takeDamage();
    showConceptToast("⚠️ 撞擊頂部細胞尖刺！扣 1 💖");
  }

  // 6. 底部深淵熱氣流救援保底
  if (player.y >= CANVAS_HEIGHT - 20) {
    if (hearts > 1) {
      hearts--;
      player.y = 120;
      player.vy = -12;
      showConceptToast("🌪️ 觸發深淵熱氣流保底救援！扣 1 💖 彈回頂部！");
      playJumpSound();
      updateUI();
    } else {
      hearts = 0;
      updateUI();
      gameOver();
    }
  }

  // 7. 更新深淵層數
  depth = Math.max(depth, Math.floor((CANVAS_HEIGHT - player.y) / 10) + Math.floor(gameTimeSeconds * 2.5));
  maxDepth = Math.max(maxDepth, depth);
  updateUI();
}

function handleStairCollision(s) {
  if (s.type === "CONVEYOR_LEFT") {
    player.x -= 2.2;
  } else if (s.type === "CONVEYOR_RIGHT") {
    player.x += 2.2;
  } else if (s.type === "SPRING") {
    player.vy = -13;
    playJumpSound();
  } else if (s.type === "HEART") {
    if (hearts < maxHearts) {
      hearts++;
      playHeartSound();
      showConceptToast("💖 踩中回復階梯！補充 1 顆生命心！");
      s.isCrumbled = true;
      updateUI();
    }
  } else if (s.type === "CRUMBLE") {
    s.crumbleTimer = (s.crumbleTimer || 0) + 1;
    if (s.crumbleTimer > 3) {
      s.isCrumbled = true;
      playHitSound();
    }
  } else if (s.type === "FATE_OPTION") {
    // 命運問答階梯
    if (s.isCorrect) {
      playFanfare();
      player.invincibleTimer = 2.5;
      player.vy = -8;
      showConceptToast(`✅ 答對了！獲得無敵衝刺！觀念：${s.question.explanation || "答對恭喜！"}`);
      isFateStairActive = false;
    } else {
      playHitSound();
      s.isCrumbled = true;
      takeDamage();
      showConceptToast(`💡 答錯觀念解析：${s.question.explanation || "請仔細查看解析！"}`);
      isFateStairActive = false;

      // 踩錯答錯保底網：正下方 100% 強制刷出一座寬體安全普通階梯接住角色！
      createSafetyStair(player.x - 50, player.y + 70, 160);
    }
  }
}

// 踩錯答錯安全保底網
function createSafetyStair(x, y, width) {
  const safeX = Math.max(20, Math.min(CANVAS_WIDTH - width - 20, x));
  stairs.push({
    id: stairIdCounter++,
    type: "NORMAL",
    x: safeX,
    y: Math.min(CANVAS_HEIGHT - 60, y),
    width,
    height: 18,
    isCrumbled: false,
    crumbleTimer: 0
  });
}

function takeDamage() {
  if (player.invincibleTimer > 0) return;
  hearts--;
  playHitSound();
  updateUI();
  if (hearts <= 0) {
    gameOver();
  }
}

function showConceptToast(text) {
  conceptToastText.textContent = text;
  conceptToast.classList.remove("hidden");
  setTimeout(() => {
    conceptToast.classList.add("hidden");
  }, 4500);
}

// 畫面繪製
function renderCanvas() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. 背景深淵網格
  ctx.strokeStyle = "rgba(51, 65, 85, 0.2)";
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
  }

  // 2. 頂部細胞尖刺
  ctx.fillStyle = "#ef4444";
  for (let x = 0; x < CANVAS_WIDTH; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 10, 20);
    ctx.lineTo(x + 20, 0);
    ctx.fill();
  }

  // 3. 繪製階梯
  stairs.forEach(s => {
    if (s.isCrumbled) return;

    if (s.type === "NORMAL") {
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.strokeStyle = "#4ade80"; ctx.strokeRect(s.x, s.y, s.width, s.height);
    } else if (s.type === "CONVEYOR_LEFT") {
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px sans-serif";
      ctx.fillText("◀◀ 滾動", s.x + 10, s.y + 12);
    } else if (s.type === "CONVEYOR_RIGHT") {
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px sans-serif";
      ctx.fillText("滾動 ▶▶", s.x + s.width - 55, s.y + 12);
    } else if (s.type === "SPRING") {
      ctx.fillStyle = "#eab308";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.fillStyle = "#000000"; ctx.font = "bold 12px sans-serif";
      ctx.fillText("🌀 彈簧", s.x + s.width / 2 - 20, s.y + 12);
    } else if (s.type === "HEART") {
      ctx.fillStyle = "#ec4899";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px sans-serif";
      ctx.fillText("💖 補血", s.x + s.width / 2 - 20, s.y + 12);
    } else if (s.type === "CRUMBLE") {
      ctx.fillStyle = "#78350f";
      ctx.fillRect(s.x, s.y, s.width, s.height);
    } else if (s.type === "FATE_OPTION") {
      // 寬體 2 選 1 命運問答階梯
      ctx.fillStyle = s.isCorrect ? "#15803d" : "#b91c1c";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(s.x, s.y, s.width, s.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = isTextZoomed ? "bold 16px sans-serif" : "bold 14px sans-serif";
      ctx.fillText(s.text, s.x + 12, s.y + 16);
    }
  });

  // 4. 命運題目頂部醒目橫條 (子彈時間秒讀)
  if (isBulletTime && currentFateQuestion) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(30, 30, CANVAS_WIDTH - 60, 52);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(30, 30, CANVAS_WIDTH - 60, 52);

    ctx.fillStyle = "#fbbf24";
    ctx.font = isTextZoomed ? "bold 16px sans-serif" : "bold 14px sans-serif";
    ctx.fillText(`❓ 命運問答：${currentFateQuestion.shortStem || currentFateQuestion.question}`, 45, 62);
  }

  // 5. 繪製玩家角色
  ctx.save();
  if (player.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  ctx.font = "30px sans-serif";
  ctx.fillText(player.avatar, player.x - 2, player.y + 28);
  ctx.restore();
}

function updateUI() {
  heartsDisplay.textContent = "❤️".repeat(Math.max(0, hearts));
  depthDisplay.textContent = `B${maxDepth} 樓`;

  const m = Math.floor(gameTimeSeconds / 60).toString().padStart(2, "0");
  const s = (gameTimeSeconds % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${m}:${s}`;
}

function gameOver() {
  isGameRunning = false;
  cancelAnimationFrame(gameLoopTimer);
  clearInterval(secondsTimer);

  victoryTitle.textContent = hearts > 0 ? "🎉 細胞深淵探險大獲全勝！" : "💥 深淵探險結束！創下深淵紀錄！";
  updateCertCode();
  openModal(victoryModal);
}

function updateCertCode() {
  const seat = inputSeatNo.value.trim() || "70105號";
  const name = inputStudentName.value.trim() || "下樓梯探險家";
  const str = `${seat}-${name}-${maxDepth}-${gameTimeSeconds}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  const code = Math.abs(hash).toString(16).toUpperCase().padStart(4, "0");
  certCodeValue.textContent = `SHAFT-${code}-${seat}`;
}

function copyCertificationData() {
  const text = `【生物大墜落：細胞深淵下樓梯 - 課堂通關證書】\n` +
    `👤 探險家：${inputSeatNo.value} ${inputStudentName.value}\n` +
    `🪜 深入地下最深紀錄：B${maxDepth} 樓\n` +
    `⏱️ 探險時間：${timerDisplay.textContent}\n` +
    `📝 課堂心得：${inputReflection.value}\n` +
    `🧬 防偽認證碼：${certCodeValue.textContent}`;

  navigator.clipboard.writeText(text).then(() => {
    alert("✅ 防偽認證證書與心得文字已成功複製！可直接上傳繳交至 Google Classroom！");
  }).catch(() => {
    alert("複製失敗，請手動複製以下內容：\n\n" + text);
  });
}

function toggleTeacherFreeze() {
  isTeacherFrozen = !isTeacherFrozen;
  if (isTeacherFrozen) openModal(teacherFreezeModal);
  else closeModal(teacherFreezeModal);
}

function openModal(el) { el.classList.remove("hidden"); }
function closeModal(el) { el.classList.add("hidden"); }
