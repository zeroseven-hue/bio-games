/**
 * 生物大墜落：細胞深淵下樓梯 (Bio-Shaft: Cell Abyss) - 遊戲引擎 V4.3 修正版
 * 1. 🛑 修正「再次探險」按鈕卡死與開局即通關 Bug：重構層數計算 (totalDistanceDescended / 70)，開局精準由 B0 樓起算！
 * 2. 🛑 修正答對連續跳躍 Bug：答對降落於正確平台後，小人【平穩站立】於階梯上隨之爬升，絕不再重複起跳！
 * 3. ⚡ 題目超前展示優化：命運階梯在底層一刷出 (距離 380~450px)，頂部題目橫條即時顯現！
 * 4. 🐢 超長緩速跑道 (380px)：距離命運階梯 380px 時發動 12% 龜速極緩速，充裕時間秒讀題幹！
 * 5. 60fps 絲滑加權引擎 + 「即按即移、放開即停」極速響應操控，徹底消除滑冰感與微卡頓！
 * 6. 補血階梯 1.5 秒緩衝碎裂：踩中補血階梯（+1 💖）後，階梯維持 1.5 秒堅固實體讓學生安全移開！
 * 7. 地下 B30 樓通關目標制：到達 B30 樓（約 2.5 分鐘完賽）即頒發通關證書！
 * 8. 答對爆發彩虹星光彩帶與黃金無敵光芒動畫，極致提升成就感！
 * 9. 遠離頂部天花板尖刺：小人登場位置 (y = 200)，腳下預設 340px 超大安全初生平台！
 * 10. 高對比巨型 iPad 雙側盲操按鈕 (> 54px)。
 */

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TARGET_CORRECT_GOAL = 10; // 答對 10 題全勝通關目標

let hearts = 7;
let maxHearts = 7;
let depth = 0;
let maxDepth = 0;
let correctAnswersCount = 0; // 累積答對題數
let totalDistanceDescended = 0; // 下降總距離 (計算 B0~B30 樓)
let gameTimeSeconds = 0;
let baseSpeed = 0.4; // 預設 0.4x 課堂超悠閒速度 (最適合國中生)
let speedMultiplier = 1.0;
let slowdownBoostTimer = 0; // 答對獲得的 5 秒緩速護罩
let isBulletTime = false;
let isGameRunning = false;
let isTeacherFrozen = false;
let isTextZoomed = false;

let gameLoopTimer = null;
let secondsTimer = null;
let lastFrameTime = Date.now();

// 玩家角色物理屬性 (極速響應：即按即移、放開即停)
const player = {
  x: 386,
  y: 200,
  vx: 0,
  vy: 0,
  width: 28,
  height: 36,
  speed: 6.2,
  isGrounded: false,
  invincibleTimer: 0,
  avatar: "🧍‍♂️"
};

// 輸入狀態
const keys = { left: false, right: false };

// 階梯與粒子系統
let stairs = [];
let stairIdCounter = 0;
let stairCountCounter = 0;
let starParticles = [];

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
const goalProgressFill = document.getElementById("goalProgressFill");
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

function setupCanvasDPI() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.scale(dpr, dpr);
}

function initEventListeners() {
  document.addEventListener("click", unlockAudioContext);
  document.addEventListener("touchstart", unlockAudioContext);
  document.addEventListener("pointerdown", unlockAudioContext);

  window.addEventListener("keydown", (e) => {
    unlockAudioContext();
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

  canvasContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvasContainer.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  canvasContainer.addEventListener("touchend", handleTouchEnd, { passive: false });

  selectSpeed.addEventListener("change", (e) => {
    baseSpeed = parseFloat(e.target.value) || 0.4;
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

// 音效系統 (載入官方原版《小朋友下樓梯》極致 100% WAV 音效素材)
let fallingAudioBuffer = null;
let dyingAudioBuffer = null;
let isAudioBuffersLoading = false;

function unlockAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (!fallingAudioBuffer && !isAudioBuffersLoading) {
    loadAuthenticShaftSounds();
  }
}

function decodeB64ToBuffer(b64Data, callback) {
  try {
    if (!audioCtx) return;
    const base64Str = b64Data.includes(",") ? b64Data.split(",")[1] : b64Data;
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
    audioCtx.decodeAudioData(bytes.buffer, (buffer) => {
      if (callback) callback(buffer);
    }, (err) => console.warn("Base64 decode Audio error:", err));
  } catch (e) {
    console.warn("decodeB64ToBuffer failed:", e);
  }
}

function loadAuthenticShaftSounds() {
  if (!audioCtx) return;
  isAudioBuffersLoading = true;

  // 優先解碼內嵌 Base64 (零延遲、離線可用)
  if (typeof FALLING_WAV_BASE64 !== "undefined") {
    decodeB64ToBuffer(FALLING_WAV_BASE64, (buf) => { fallingAudioBuffer = buf; });
  }
  if (typeof DYING_WAV_BASE64 !== "undefined") {
    decodeB64ToBuffer(DYING_WAV_BASE64, (buf) => { dyingAudioBuffer = buf; });
  }

  // 備用從 sounds/ 網路載入
  fetch("sounds/falling.wav")
    .then(r => r.arrayBuffer())
    .then(ab => audioCtx.decodeAudioData(ab))
    .then(buf => { fallingAudioBuffer = buf; })
    .catch(() => {});
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

// 100% 清晰清爽 8-bit 著地下樓梯 Tap 音效
function playStepSound() {
  if (!soundEnabled || isTeacherFrozen) return;
  unlockAudioContext();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(380, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  } catch (e) {}
}

// 🗣️ 官方原版《小朋友下樓梯》100% 經典原音掉落慘叫聲 (1:1 對照 YouTube: BqeKzTyDLkI)
function playDeathScreamSound() {
  if (!soundEnabled || isTeacherFrozen) return;
  unlockAudioContext();

  const doPlayOriginalWav = () => {
    try {
      if (audioCtx && fallingAudioBuffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = fallingAudioBuffer;
        const gain = audioCtx.createGain();
        gain.gain.value = 1.0; // 100% 官方原音大音量
        source.connect(gain);
        gain.connect(audioCtx.destination);
        source.start(0);
      } else if (typeof FALLING_WAV_BASE64 !== "undefined") {
        const audio = new Audio(FALLING_WAV_BASE64);
        audio.volume = 1.0;
        audio.play().catch(e => console.warn("Audio element play error:", e));
      } else {
        const audio = new Audio("sounds/falling.wav");
        audio.volume = 1.0;
        audio.play().catch(e => console.warn(e));
      }
    } catch (e) {
      console.warn("原版慘叫聲播放失敗:", e);
    }
  };

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().then(doPlayOriginalWav).catch(doPlayOriginalWav);
  } else {
    doPlayOriginalWav();
  }
}

function playConveyorSound() { playTone(220, "sine", 0.06, 0, 0.05); }
function playHeartSound() { playTone(800, "sine", 0.1, 0, 0.12); playTone(1200, "sine", 0.15, 0.08, 0.12); }
function playHitSound() { playTone(150, "square", 0.15, 0, 0.15); }
function playFateSlowdown() { playTone(300, "sawtooth", 0.25, 0, 0.1); playTone(200, "sawtooth", 0.35, 0.1, 0.1); }
function playFanfare() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => playTone(f, "square", 0.1, i * 0.08, 0.12)); }

function toggleSound() {
  soundEnabled = !soundEnabled;
  btnSound.textContent = soundEnabled ? "🔊" : "🔇";
}

// 智能中文避頭標點與詞組斷行演算法 (防止孤立標點與切字)
function splitSmartQuestionText(text, maxChars = 22) {
  if (!text || text.length <= maxChars) return [text || "", ""];

  const noHeadPunctuation = [",", "，", "。", "！", "？", "、", "；", "：", "」", "』", "）", "]", "}", ">"];
  let splitIdx = maxChars;

  while (splitIdx > 10 && (noHeadPunctuation.includes(text[splitIdx]) || noHeadPunctuation.includes(text[splitIdx - 1]))) {
    splitIdx--;
  }

  let l1 = text.substring(0, splitIdx).trim();
  let l2 = text.substring(splitIdx).trim();

  if (l2.length > 0 && noHeadPunctuation.includes(l2[0])) {
    l1 += l2[0];
    l2 = l2.substring(1).trim();
  }

  return [l1, l2];
}

function splitSmartOptionText(content, maxChars = 14) {
  if (!content || content.length <= 15) return [content || "", ""];

  const compoundWords = ["冷藏", "保存", "進行", "結果", "作用", "細胞", "養分", "環境", "避光", "密封", "低溫", "處理", "活性", "酵素"];
  let splitIdx = maxChars;

  compoundWords.forEach(w => {
    const pos = content.indexOf(w);
    if (pos > 0 && splitIdx > pos && splitIdx < pos + w.length) {
      splitIdx = pos;
    }
  });

  let l1 = content.substring(0, splitIdx).trim();
  let l2 = content.substring(splitIdx).trim();
  return [l1, l2];
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

const NEGATIVE_KEYWORDS = ["錯誤", "非", "不包含", "不屬於", "不合適", "何者不", "無法", "不正確", "不行"];

function filterPositiveQuestions(rawList) {
  if (!rawList || !Array.isArray(rawList)) return [];
  const filtered = rawList.filter(q => {
    if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) return false;
    const isNegative = NEGATIVE_KEYWORDS.some(kw => q.question.includes(kw));
    return !isNegative;
  });
  return filtered.length > 0 ? filtered : rawList;
}

function getNextQuestionFromPool(unitFile) {
  if (unitFile === "ALL") {
    let combined = [];
    Object.values(rawQuestionsByUnit).forEach(list => combined.push(...list));
    const safeList = filterPositiveQuestions(combined.length > 0 ? combined : getFallbackQuestions());
    if (!questionPoolByUnit["ALL"] || questionPoolByUnit["ALL"].length === 0) {
      questionPoolByUnit["ALL"] = shuffleArray([...safeList]);
    }
    return questionPoolByUnit["ALL"].pop();
  }

  if (!questionPoolByUnit[unitFile] || questionPoolByUnit[unitFile].length === 0) {
    const rawList = rawQuestionsByUnit[unitFile] || getFallbackQuestions();
    const safeList = filterPositiveQuestions(rawList);
    questionPoolByUnit[unitFile] = shuffleArray([...safeList]);
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

// 重置遊戲與建立高密度安全巨型階梯
function resetGame() {
  hearts = 7;
  maxHearts = 7;
  depth = 0;
  maxDepth = 0;
  correctAnswersCount = 0; // 精準重置答對題數為 0
  totalDistanceDescended = 0;
  gameTimeSeconds = 0;
  isGameRunning = true;
  isBulletTime = false;
  speedMultiplier = 1.0;
  slowdownBoostTimer = 0;
  stairCountCounter = 0;
  starParticles = [];

  player.x = CANVAS_WIDTH / 2 - 14;
  player.y = 200;
  player.vx = 0;
  player.vy = 0;
  player.isGrounded = false;
  player.invincibleTimer = 0;

  stairs = [];
  isFateStairActive = false;
  currentFateQuestion = null;

  // 1. 開局預設一座 340px 巨型安全初生平台
  stairs.push({
    id: stairIdCounter++,
    type: "NORMAL",
    x: CANVAS_WIDTH / 2 - 170,
    y: 245,
    width: 340,
    height: 18,
    isCrumbled: false,
    isTriggered: false,
    crumbleTimer: 0
  });

  // 2. 初始化其他 5 座垂直均勻分佈的加寬階梯 (距離 85px)
  for (let i = 1; i < 6; i++) {
    const y = 245 + i * 85;
    const width = 190;
    const x = Math.random() * (CANVAS_WIDTH - width - 60) + 30;
    stairs.push({
      id: stairIdCounter++,
      type: "NORMAL",
      x,
      y,
      width,
      height: 18,
      isCrumbled: false,
      isTriggered: false,
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

function spawnBottomStair(spawnY) {
  stairCountCounter++;

  if (stairCountCounter % 6 === 0 && !isFateStairActive) {
    spawnFateStairPair(spawnY);
    isFateStairActive = true;
    return;
  }

  const rand = Math.random();
  let type = "NORMAL";
  let width = 180 + Math.random() * 40;

  if (rand < 0.60) type = "NORMAL";
  else if (rand < 0.75) type = "HEART";
  else if (rand < 0.825) type = "CONVEYOR_LEFT";
  else if (rand < 0.90) type = "CONVEYOR_RIGHT";
  else if (rand < 0.95) type = "SPRING";
  else type = "CRUMBLE";

  const x = Math.random() * (CANVAS_WIDTH - width - 60) + 30;
  stairs.push({
    id: stairIdCounter++,
    type,
    x,
    y: spawnY,
    width,
    height: 18,
    isCrumbled: false,
    isTriggered: false,
    crumbleTimer: 0
  });
}

function spawnFateStairPair(y) {
  // 1. 僅清空命運階梯上方 120px 的雜亂遮擋階梯，絕不清空下方階梯
  stairs = stairs.filter(s => !(s.y < y && s.y > y - 120));

  const unitFile = selectUnit.value || "ALL";
  currentFateQuestion = getNextQuestionFromPool(unitFile);

  const opts = currentFateQuestion.options || ["選項A", "選項B"];
  const correctIdx = currentFateQuestion.answer;

  const correctText = opts[correctIdx];
  let wrongIdx = (correctIdx + 1) % opts.length;
  const wrongText = opts[wrongIdx];

  const isLeftCorrect = Math.random() < 0.5;

  // 2. 100% 壁貼壁全寬度無落空設計 (單座寬度 370px, 高度 44px)
  const stairWidth = 370;
  const stairHeight = 44;
  const leftX = 10;   // 左邊貼緊 x = 10 (絕不落空)
  const rightX = 420; // 右邊貼緊 x = 790 (絕不落空)，中間保留 40px 中央天井

  const leftObj = {
    id: stairIdCounter++,
    type: "FATE_OPTION",
    x: leftX,
    y,
    width: stairWidth,
    height: stairHeight,
    isCorrect: isLeftCorrect,
    optionLabel: "🅰️",
    optionText: isLeftCorrect ? correctText : wrongText,
    text: `🅰️ ${isLeftCorrect ? correctText : wrongText}`,
    question: currentFateQuestion,
    isCrumbled: false,
    isTriggered: false
  };

  const rightObj = {
    id: stairIdCounter++,
    type: "FATE_OPTION",
    x: rightX,
    y,
    width: stairWidth,
    height: stairHeight,
    isCorrect: !isLeftCorrect,
    optionLabel: "🅱️",
    optionText: !isLeftCorrect ? correctText : wrongText,
    text: `🅱️ ${!isLeftCorrect ? correctText : wrongText}`,
    question: currentFateQuestion,
    isCrumbled: false,
    isTriggered: false
  };

  stairs.push(leftObj, rightObj);

  // 3. 關鍵修復：在命運階梯下方自動生成 2 座安全承接普通階梯 (y + 90 與 y + 180)，100% 保障選完答案腳下必有階梯！
  stairs.push({
    id: stairIdCounter++,
    type: "NORMAL",
    x: 80,
    y: y + 90,
    width: 240,
    height: 18,
    isCrumbled: false,
    isTriggered: false,
    crumbleTimer: 0
  });

  stairs.push({
    id: stairIdCounter++,
    type: "NORMAL",
    x: 460,
    y: y + 180,
    width: 240,
    height: 18,
    isCrumbled: false,
    isTriggered: false,
    crumbleTimer: 0
  });
}

function spawnStarParticles(x, y) {
  const colors = ["#fbbf24", "#4ade80", "#38bdf8", "#f472b6", "#a855f7"];
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    starParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1.0,
      life: 0.8 + Math.random() * 0.4
    });
  }
}

// 60fps 絲滑物理主循環
function gameLoop() {
  if (!isGameRunning) return;

  const now = Date.now();
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  if (!isTeacherFrozen) {
    updatePhysics(dt);
    updateParticles(dt);
  }

  renderCanvas();

  gameLoopTimer = requestAnimationFrame(gameLoop);
}

// 命運問答時機：當階梯進入畫面 (y <= 540) 且離小人 <= 240px 時啟動 0.3x 適度減速
function updatePhysics(dt) {
  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= dt;
  }

  if (slowdownBoostTimer > 0) {
    slowdownBoostTimer -= dt;
  }

  const fateStairNear = stairs.find(s => s.type === "FATE_OPTION" && !s.isCrumbled && s.y <= 540 && (s.y - player.y) < 240 && (s.y - player.y) > -50);
  if (fateStairNear) {
    isBulletTime = true;
    speedMultiplier = 0.3; // 輕度減速 0.3x
  } else {
    isBulletTime = false;
    speedMultiplier = 1.0;
  }

  const currentSpeed = baseSpeed * speedMultiplier;

  // 1. 極速響應操控 (即按即移、放開即停，0 滑冰感)
  if (keys.left) {
    player.vx = -player.speed;
  } else if (keys.right) {
    player.vx = player.speed;
  } else {
    player.vx = 0;
  }

  player.x += player.vx;
  player.x = Math.max(10, Math.min(CANVAS_WIDTH - player.width - 10, player.x));

  // 2. 重力加速度
  player.vy += 0.48;
  player.y += player.vy;
  const wasGroundedLastFrame = player.isGrounded;
  player.isGrounded = false;

  // 3. 階梯上升 (溫和 1.4px/frame)
  const stairRiseSpeed = 1.4 * currentSpeed;
  totalDistanceDescended += stairRiseSpeed; // 累加下降距離計算層數

  for (let i = stairs.length - 1; i >= 0; i--) {
    const s = stairs[i];
    s.y -= stairRiseSpeed;

    if (s.type === "HEART" && s.isTriggered) {
      s.crumbleTimer += dt;
      if (s.crumbleTimer >= 1.5) {
        s.isCrumbled = true;
      }
    }

    const prevY = player.y - player.vy;
    if (
      player.vy >= 0 &&
      prevY + player.height <= s.y + 8 &&
      player.y + player.height >= s.y &&
      player.x + player.width > s.x &&
      player.x < s.x + s.width &&
      !s.isCrumbled
    ) {
      // 僅在「從空中首次著陸於階梯」的瞬間觸發一次清爽 Tap 著地音效，絕不上著陸重複洗音！
      if (!wasGroundedLastFrame && s.type !== "SPRING") {
        playStepSound();
      }
      player.y = s.y - player.height;
      player.vy = 0;
      player.isGrounded = true;

      handleStairCollision(s);
    }

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
    player.y = 40;
    player.vy = 5;
    takeDamage();
    player.invincibleTimer = 1.5;
    showConceptToast("⚠️ 觸碰頂部細胞尖刺！發動 1.5 秒無敵防護彈回！");
  }

  // 6. 底部深淵熱氣流救援保底
  if (player.y >= CANVAS_HEIGHT - 20) {
    playDeathScreamSound();
    if (hearts > 1) {
      hearts--;
      player.y = 120;
      player.vy = -12;
      showConceptToast("🌪️ 觸發深淵熱氣流保底救援！扣 1 💖 彈回頂部！");
      updateUI();
    } else {
      hearts = 0;
      updateUI();
      gameOver();
    }
  }

  // 7. 計算樓層深度
  depth = Math.floor(totalDistanceDescended / 70);
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
    if (!s.isTriggered) {
      s.isTriggered = true;
      s.crumbleTimer = 0;
      if (hearts < maxHearts) {
        hearts++;
        playHeartSound();
        showConceptToast("💖 踩中補血階梯 (+1 💖)！階梯將於 1.5 秒後碎裂，請安全離去！");
        updateUI();
      }
    }
  } else if (s.type === "CRUMBLE") {
    s.crumbleTimer = (s.crumbleTimer || 0) + 1;
    if (s.crumbleTimer > 3) {
      s.isCrumbled = true;
      playHitSound();
    }
  } else if (s.type === "FATE_OPTION") {
    // 命運問答階梯：站立時平穩上升，絕不重複發動起跳！
    if (s.isCorrect) {
      if (!s.isTriggered) {
        s.isTriggered = true;
        correctAnswersCount++;
        playFanfare();
        player.invincibleTimer = 3.0;
        slowdownBoostTimer = 0; // 立刻恢復 100% 正常速度
        isBulletTime = false;
        speedMultiplier = 1.0;
        spawnStarParticles(player.x + 14, player.y);
        showConceptToast(`✅ 答對第 ${correctAnswersCount}/${TARGET_CORRECT_GOAL} 題！觀念解析：${s.question.explanation || "恭喜答對！"}`);
        isFateStairActive = false;
        updateUI();

        if (correctAnswersCount >= TARGET_CORRECT_GOAL && isGameRunning) {
          playFanfare();
          spawnStarParticles(CANVAS_WIDTH / 2, 200);
          gameOver();
        }
      }
    } else {
      if (!s.isTriggered) {
        s.isTriggered = true;
        playHitSound();
        s.isCrumbled = true;
        takeDamage();
        showConceptToast(`💡 答錯觀念解析：${s.question.explanation || "請仔細查看解析！"}`);
        isFateStairActive = false;

        createSafetyStair(player.x - 70, player.y + 70, 200);
      }
    }
  }
}

function updateParticles(dt) {
  for (let i = starParticles.length - 1; i >= 0; i--) {
    const p = starParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.alpha -= dt / p.life;
    if (p.alpha <= 0) {
      starParticles.splice(i, 1);
    }
  }
}

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
    isTriggered: false,
    crumbleTimer: 0
  });
}

function takeDamage() {
  if (player.invincibleTimer > 0) return;
  hearts--;
  playHitSound();
  updateUI();
  if (hearts <= 0) {
    playDeathScreamSound();
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

// 畫面繪製 (超前顯示頂部題目)
function renderCanvas() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. 背景網格
  ctx.strokeStyle = "rgba(51, 65, 85, 0.2)";
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
  }

  // 2. 頂部天花板尖刺
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
      ctx.fillText("◀◀ 滾動", s.x + 10, s.y + 13);
    } else if (s.type === "CONVEYOR_RIGHT") {
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px sans-serif";
      ctx.fillText("滾動 ▶▶", s.x + s.width - 55, s.y + 13);
    } else if (s.type === "SPRING") {
      ctx.fillStyle = "#eab308";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.fillStyle = "#000000"; ctx.font = "bold 12px sans-serif";
      ctx.fillText("🌀 彈簧", s.x + s.width / 2 - 20, s.y + 13);
    } else if (s.type === "HEART") {
      ctx.fillStyle = s.isTriggered ? "#f472b6" : "#ec4899";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px sans-serif";
      ctx.fillText(s.isTriggered ? "⏳ 1.5s碎裂" : "💖 補血", s.x + s.width / 2 - 25, s.y + 13);
    } else if (s.type === "CRUMBLE") {
      ctx.fillStyle = "#78350f";
      ctx.fillRect(s.x, s.y, s.width, s.height);
    } else if (s.type === "FATE_OPTION") {
      ctx.fillStyle = s.isCorrect ? "#15803d" : "#b91c1c";
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3.0;
      ctx.strokeRect(s.x, s.y, s.width, s.height);

      ctx.fillStyle = "#ffffff";
      const label = s.optionLabel || "";
      const content = s.optionText || s.text || "";
      const fullText = `${label} ${content}`;

      if (content.length <= 15) {
        let fSize = isTextZoomed ? 17 : 15;
        ctx.font = `bold ${fSize}px sans-serif`;
        ctx.fillText(fullText, s.x + 12, s.y + 27);
      } else {
        // 智能避詞切字：避免將「冷藏保存」切成「冷」與「藏保存」
        let fSize = isTextZoomed ? 14 : 13;
        ctx.font = `bold ${fSize}px sans-serif`;
        const [optL1, optL2] = splitSmartOptionText(content, 14);
        ctx.fillText(`${label} ${optL1}`, s.x + 10, s.y + 19);
        ctx.fillText(`   ${optL2}`, s.x + 10, s.y + 36);
      }
    }
  });

  // 4. 命運題目頂部醒目橫條 (高度 80px，智能避頭標點演算法，徹底杜絕逗號孤立在開頭)
  const fateStairActive = stairs.find(s => s.type === "FATE_OPTION" && !s.isCrumbled && s.y <= 550);
  if (fateStairActive && currentFateQuestion) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(20, 15, CANVAS_WIDTH - 40, 80);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 15, CANVAS_WIDTH - 40, 80);

    const qText = currentFateQuestion.question || "";
    const titleFont = isTextZoomed ? "bold 19px sans-serif" : "bold 17px sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.font = titleFont;

    if (qText.length <= 22) {
      ctx.fillText(`❓ 命運問答：${qText}`, 35, 60);
    } else {
      const [qL1, qL2] = splitSmartQuestionText(qText, 22);
      ctx.fillText(`❓ 命運問答：${qL1}`, 35, 48);
      ctx.fillText(`   ${qL2}`, 35, 76);
    }
  }

  // 5. 繪製彩虹星光粒子
  starParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 6. 繪製玩家角色
  ctx.save();
  if (player.invincibleTimer > 0) {
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 15;
    if (Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.6;
  }
  ctx.font = "30px sans-serif";
  ctx.fillText(player.avatar, player.x - 2, player.y + 28);
  ctx.restore();
}

function updateUI() {
  heartsDisplay.textContent = "❤️".repeat(Math.max(0, hearts));
  depthDisplay.textContent = `🎯 答對: ${correctAnswersCount} / ${TARGET_CORRECT_GOAL} 題 (B${maxDepth}樓)`;

  if (goalProgressFill) {
    const pct = Math.min(100, Math.max(0, (correctAnswersCount / TARGET_CORRECT_GOAL) * 100));
    goalProgressFill.style.width = `${pct}%`;
  }

  const m = Math.floor(gameTimeSeconds / 60).toString().padStart(2, "0");
  const s = (gameTimeSeconds % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${m}:${s}`;
}

function gameOver() {
  isGameRunning = false;
  cancelAnimationFrame(gameLoopTimer);
  clearInterval(secondsTimer);

  victoryTitle.textContent = correctAnswersCount >= TARGET_CORRECT_GOAL ? `🎉 恭喜答對 ${TARGET_CORRECT_GOAL} 題全勝通關！` : `💥 探險結束！共答對 ${correctAnswersCount} 題 (到達 B${maxDepth} 樓)`;
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
