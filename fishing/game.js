/**
 * 生物大釣手：黃金深海大捕撈 - 核心引擎
 * 支援 1~10 單元讀取、Fisher-Yates 抽過即移出、黃金礦工擺盪機械爪、磁吸寬容判定、方案 B 刪去法、防盲猜冷卻與 Classroom 防偽證書
 */

// 1~10 單元離線保底題庫 (備援防止校園網路斷線)
const FISHING_FALLBACK_QUESTIONS = [
  { id: 1, unit: "unit01", question: "在設計科學實驗時，實驗組與對照組之間最多能有幾個「操縱變因」？", options: ["只能有 1 個", "可以有 2 個", "可以有 3 個", "沒有限制數量"], answer: 0, explanation: "對照實驗中，為了確認因果關係，操縱變因只能有 1 個。" },
  { id: 2, unit: "unit02", question: "使用複式顯微鏡觀察洋蔥表皮細胞，若影像偏向右下方，玻片標本應往哪移？", options: ["往右下方移動", "往左上方移動", "往左下方移動", "往正上方移動"], answer: 0, explanation: "複式顯微鏡成倒立放大像，物體偏哪裡就往哪裡移。" },
  { id: 3, unit: "unit03", question: "下列何者「不屬於」生物體所表現出的生命現象？", options: ["鐘乳石沉積長大", "綠豆萌芽生長", "含羞草葉片閉合", "酵母菌出芽生殖"], answer: 0, explanation: "鐘乳石是無生物礦物累積，不具細胞代謝生長，不屬於生命現象。" },
  { id: 4, unit: "unit04", question: "虎克最早利用自製顯微鏡在軟木塞切片中所觀察到的蜂窩狀小格子是？", options: ["死去的細胞壁", "活的細胞核", "大型液胞", "葉綠體顆粒"], answer: 0, explanation: "軟木塞為植物死細胞，虎克觀察到的是殘留的植物細胞壁。" },
  { id: 5, unit: "unit05", question: "植物細胞能夠維持固定且對稱的外形，主要依賴下列哪一構造？", options: ["堅硬的細胞壁", "具選擇性的細胞膜", "粒線體發電機", "大型葉綠體"], answer: 0, explanation: "細胞壁主要由纖維素構成，具保護並支持植物細胞形狀的功能。" },
  { id: 6, unit: "unit06", question: "將人類紅血球置入高濃度的濃食鹽水中，紅血球細胞將會發生什麼變化？", options: ["失水萎縮", "吸水膨脹破裂", "形狀維持不變", "外層細胞壁加厚"], answer: 0, explanation: "高濃度溶液使水分子滲透出細胞，動物細胞無細胞壁保護會失水萎縮。" },
  { id: 7, unit: "unit07", question: "人體的「心臟」由肌肉組織、神經組織等聯合構成，在生物層次上屬於？", options: ["器官層級", "細胞層級", "組織層級", "器官系統層級"], answer: 0, explanation: "由多種不同組織共同構成具有特定功能的構造稱為器官。" },
  { id: 8, unit: "unit08", question: "在微觀尺度大小比較中，下列何者的長度或體積最小？", options: ["水分子結構", "紅血球細胞", "口腔皮膜細胞", "草履蟲單細胞"], answer: 0, explanation: "水分子是奈米級 (nm) 的分子，遠小於微米級 (μm) 的細胞構造。" },
  { id: 9, unit: "unit09", question: "1 公克的脂質在生物體內完全氧化燃燒，約可釋出多少千卡的熱量？", options: ["9 千卡熱量", "4 千卡熱量", "0 千卡熱量", "100 千卡熱量"], answer: 0, explanation: "醣類與蛋白質每公克產生 4 千卡，脂質每公克產生 9 千卡。" },
  { id: 10, unit: "unit10", question: "人體消化系統中的酵素發揮最大催化活性的最適溫度大約是？", options: ["攝氏 37 度左右", "攝氏 80 度高溫", "攝氏 0 度低溫", "攝氏 100 度沸騰"], answer: 0, explanation: "人體酵素大多屬於蛋白質，在體溫約 37°C 時活性最高，高溫會變性失活。" }
];

// 物理與遊戲常數
const ANGLE_MIN = -Math.PI * 0.36; // -65度
const ANGLE_MAX = Math.PI * 0.36;  // +65度
const SWING_SPEED = 0.022;
const EXTEND_SPEED = 7.6;
const RETRACT_SPEED_EMPTY = 9.2;
const RETRACT_SPEED_FISH = 5.6;

// 遊戲狀態
let playMode = "group"; // "group" | "solo"
let groupTurn = 1;
let gameMinutes = 5;
let remainingSeconds = 300;
let timerInterval = null;

let score = 0;
let streak = 0;
let maxStreak = 0;
let isPaused = false;
let isOver = false;

// 防盲猜冷卻狀態與出題靜止讀題
let isCoolingDown = false;
let cooldownTimer = null;
let isFreezingRead = false;

let selectedUnits = ["unit01", "unit02", "unit03", "unit04", "unit05", "unit06", "unit07", "unit08", "unit09", "unit10"];
let questionPool = [];
let currentQuestion = null;

// 機械吊爪狀態 (黃金礦工模型)
const claw = {
  originX: 200,
  originY: 20,
  angle: 0,
  angleDir: 1,
  length: 30,
  state: "swinging", // "swinging" | "extending" | "retracting"
  caughtItem: null
};

// 海中游動的選項魚群 (方案 B：抓錯逃跑)
let oceanFishes = [];

// 畫布與尺寸
const canvas = document.getElementById("fishingCanvas");
const ctx = canvas.getContext("2d");
let viewW = 400;
let viewH = 500;

// DOM 引用
const scoreDisplay = document.getElementById("scoreDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const streakBadge = document.getElementById("streakBadge");
const unitTag = document.getElementById("unitTag");
const groupTurnTag = document.getElementById("groupTurnTag");
const questionStem = document.getElementById("questionStem");
const freezeReadBar = document.getElementById("freezeReadBar");
const freezeProgress = document.getElementById("freezeProgress");
const touchLaunchZone = document.getElementById("touchLaunchZone");

const cooldownOverlay = document.getElementById("cooldownOverlay");
const cooldownSec = document.getElementById("cooldownSec");

const drawerPanel = document.getElementById("drawerPanel");
const btnDrawer = document.getElementById("btnDrawer");
const btnCloseDrawer = document.getElementById("btnCloseDrawer");
const btnCheckAll = document.getElementById("btnCheckAll");
const btnClearAll = document.getElementById("btnClearAll");
const unitsGrid = document.getElementById("unitsGrid");
const selectPlayMode = document.getElementById("selectPlayMode");
const selectGameTime = document.getElementById("selectGameTime");
const btnApplyDrawer = document.getElementById("btnApplyDrawer");

const btnAudio = document.getElementById("btnAudio");
const btnPause = document.getElementById("btnPause");
const pauseModal = document.getElementById("pauseModal");
const btnResumeGame = document.getElementById("btnResumeGame");

const noteModal = document.getElementById("noteModal");
const noteContent = document.getElementById("noteContent");
const btnCloseNote = document.getElementById("btnCloseNote");

const idModal = document.getElementById("idModal");
const classInput = document.getElementById("classInput");
const seatInput = document.getElementById("seatInput");
const btnCreateCert = document.getElementById("btnCreateCert");

const certModal = document.getElementById("certModal");
const certHeroText = document.getElementById("certHeroText");
const certVerifyCode = document.getElementById("certVerifyCode");
const certScoreText = document.getElementById("certScoreText");
const certStreakText = document.getElementById("certStreakText");
const certTimeText = document.getElementById("certTimeText");
const btnRestartFishing = document.getElementById("btnRestartFishing");
const btnExitToLobby = document.getElementById("btnExitToLobby");

// Web Audio API
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playTone(freq, type, dur, delay = 0, vol = 0.1) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + dur);
  } catch (e) {}
}

function playClawLaunchSound() { playTone(280, "triangle", 0.18, 0, 0.15); }
function playCatchFishSound() { playTone(520, "sine", 0.12, 0, 0.15); playTone(880, "sine", 0.25, 0.08, 0.2); }
function playFishEscapeSound() { playTone(220, "sawtooth", 0.25, 0, 0.2); }
function playSonarBeep() { playTone(650, "sine", 0.15, 0, 0.1); }

// ==========================================================================
// 1. 初始化與 iPad 視口調校
// ==========================================================================

window.addEventListener("DOMContentLoaded", async () => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  buildUnitsChecklist();
  initControls();

  await prepareQuestionPool();
  startNewFishingSession();
  requestAnimationFrame(gameMainLoop);
});

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  viewW = rect.width;
  viewH = rect.height;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = viewW * dpr;
  canvas.height = viewH * dpr;
  ctx.scale(dpr, dpr);

  claw.originX = viewW / 2;
  claw.originY = 16;
}

function initControls() {
  // 點擊螢幕任意處發射釣爪
  touchLaunchZone.addEventListener("pointerdown", () => {
    initAudio();
    triggerClawLaunch();
  });

  // 鍵盤空白鍵 / 向下箭頭發射
  window.addEventListener("keydown", (e) => {
    initAudio();
    if (e.code === "Space" || e.key === "ArrowDown") {
      e.preventDefault();
      triggerClawLaunch();
    }
  });

  // 抽屜與彈窗按鈕
  btnDrawer.onclick = () => drawerPanel.classList.remove("hidden");
  btnCloseDrawer.onclick = () => drawerPanel.classList.add("hidden");
  btnCheckAll.onclick = () => unitsGrid.querySelectorAll("input").forEach(cb => cb.checked = true);
  btnClearAll.onclick = () => unitsGrid.querySelectorAll("input").forEach(cb => cb.checked = false);
  btnApplyDrawer.onclick = handleApplyTeacherSettings;

  btnAudio.onclick = () => initAudio();
  btnPause.onclick = togglePause;
  btnResumeGame.onclick = togglePause;

  btnCloseNote.onclick = handleCloseNoteModal;
  btnCreateCert.onclick = handleGenerateCert;
  btnRestartFishing.onclick = () => { certModal.classList.add("hidden"); startNewFishingSession(); };
  btnExitToLobby.onclick = () => { window.location.href = "../index.html"; };
}

function buildUnitsChecklist() {
  unitsGrid.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const uId = `unit${i.toString().padStart(2, "0")}`;
    const lbl = document.createElement("label");
    lbl.innerHTML = `<input type="checkbox" value="${uId}" checked> 單元 ${i.toString().padStart(2, "0")}`;
    unitsGrid.appendChild(lbl);
  }
}

function handleApplyTeacherSettings() {
  const checked = Array.from(unitsGrid.querySelectorAll("input:checked")).map(cb => cb.value);
  if (checked.length === 0) {
    alert("請至少選擇 1 個出題單元！");
    return;
  }
  selectedUnits = checked;
  playMode = selectPlayMode.value;
  gameMinutes = parseInt(selectGameTime.value, 10);
  remainingSeconds = gameMinutes * 60;

  groupTurnTag.classList.toggle("hidden", playMode === "solo");
  drawerPanel.classList.add("hidden");
  alert("✅ 設定已套用！重新起錨出海！");

  prepareQuestionPool();
  startNewFishingSession();
}

// ==========================================================================
// 2. 題庫洗牌與海中四選一魚群部署 (Fisher-Yates 抽過即拔除，絕不重複)
// ==========================================================================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function prepareQuestionPool() {
  let loaded = [];
  try {
    for (const u of selectedUnits) {
      const res = await fetch(`../questions/${u}.json`);
      if (res.ok) {
        const d = await res.json();
        if (d.questions && Array.isArray(d.questions)) loaded.push(...d.questions);
      }
    }
  } catch (err) {
    console.warn("外部題庫載入失敗，啟動備用保底題庫", err);
  }

  if (loaded.length === 0) {
    loaded = FISHING_FALLBACK_QUESTIONS.filter(q => selectedUnits.includes(q.unit));
    if (loaded.length === 0) loaded = [...FISHING_FALLBACK_QUESTIONS];
  }

  // 洗牌打亂，保證本局絕不重複
  questionPool = shuffleArray([...loaded]);
}

function presentNextQuestion() {
  if (questionPool.length === 0) prepareQuestionPool();
  currentQuestion = questionPool.pop(); // Fisher-Yates 抽過即移除
  if (!currentQuestion) return;

  // 棒次輪流提示
  if (playMode === "group") {
    groupTurnTag.textContent = `🎣 本回合神釣手：第 ${groupTurn} 棒組員`;
    groupTurn = (groupTurn % 4) + 1;
  }

  unitTag.textContent = `當前單元：${currentQuestion.unit || "生物核心"}`;

  // 關鍵字高亮
  let stemText = currentQuestion.question;
  ["不屬於", "最多能有幾個", "何者錯誤", "不是", "無關"].forEach(kw => {
    if (stemText.includes(kw)) {
      stemText = stemText.replace(new RegExp(kw, "g"), `<span class="keyword-highlight">${kw}</span>`);
    }
  });
  questionStem.innerHTML = stemText;

  // 部署 4 隻選項魚群並啟動「2.5 秒全場靜止讀題期」
  spawnOceanFishesForCurrentQuestion();
  triggerFreezeReadingPhase();
}

function triggerFreezeReadingPhase() {
  isFreezingRead = true;
  freezeReadBar.classList.remove("hidden");
  freezeProgress.style.transition = "none";
  freezeProgress.style.width = "100%";
  playSonarBeep();

  setTimeout(() => {
    freezeProgress.style.transition = "width 2.5s linear";
    freezeProgress.style.width = "0%";
  }, 50);

  setTimeout(() => {
    isFreezingRead = false;
    freezeReadBar.classList.add("hidden");
  }, 2550);
}

function spawnOceanFishesForCurrentQuestion() {
  oceanFishes = [];
  const options = currentQuestion.options;
  const layers = [100, 180, 260, 340]; // 4 個深度水層

  options.forEach((optText, idx) => {
    const isRight = (idx === currentQuestion.answer);
    const yPos = layers[idx] + (Math.random() * 20 - 10);
    const dir = (idx % 2 === 0) ? 1 : -1;
    const startX = (dir === 1) ? -40 - (idx * 60) : viewW + 40 + (idx * 60);

    oceanFishes.push({
      id: idx,
      text: optText,
      isCorrect: isRight,
      x: startX,
      y: yPos,
      radius: 34,
      dir: dir,
      speed: 1.1 + Math.random() * 0.35,
      color: getFishColor(idx),
      fishType: ["🐠", "🐟", "🐡", "🐙"][idx]
    });
  });
}

function getFishColor(idx) {
  const colors = ["#0284c7", "#10b981", "#d97706", "#8b5cf6"];
  return colors[idx % colors.length];
}

// ==========================================================================
// 3. 機械爪物理、磁吸寬容判定與防盲猜冷卻
// ==========================================================================

function triggerClawLaunch() {
  if (isPaused || isOver || isCoolingDown || isFreezingRead) return;
  if (claw.state === "swinging") {
    claw.state = "extending";
    playClawLaunchSound();
  }
}

function updateFishingPhysics() {
  // 1. 吊爪擺盪 (靜止讀題時暫停)
  if (claw.state === "swinging" && !isFreezingRead) {
    claw.angle += SWING_SPEED * claw.angleDir;
    if (claw.angle > ANGLE_MAX) { claw.angle = ANGLE_MAX; claw.angleDir = -1; }
    if (claw.angle < ANGLE_MIN) { claw.angle = ANGLE_MIN; claw.angleDir = 1; }
  }

  // 2. 吊爪延伸出擊
  if (claw.state === "extending") {
    claw.length += EXTEND_SPEED;
    let tipX = claw.originX + Math.sin(claw.angle) * claw.length;
    let tipY = claw.originY + Math.cos(claw.angle) * claw.length;

    // 觸碰邊界：空手收回
    if (tipX < 0 || tipX > viewW || tipY > viewH - 20) {
      claw.state = "retracting";
    }

    // 磁吸寬容判定 (Aim Assist: 距離容錯擴大至 44px)
    for (let i = oceanFishes.length - 1; i >= 0; i--) {
      const f = oceanFishes[i];
      const dist = Math.hypot(tipX - f.x, tipY - f.y);
      if (dist < f.radius + 18) {
        // 磁吸鎖定目標
        claw.caughtItem = f;
        claw.state = "retracting";
        oceanFishes.splice(i, 1); // 脫離群體
        break;
      }
    }
  }

  // 3. 吊爪收回
  if (claw.state === "retracting") {
    const spd = claw.caughtItem ? RETRACT_SPEED_FISH : RETRACT_SPEED_EMPTY;
    claw.length -= spd;

    if (claw.length <= 30) {
      claw.length = 30;
      claw.state = "swinging";
      if (claw.caughtItem) {
        handleFishPulledAboard(claw.caughtItem);
        claw.caughtItem = null;
      }
    }
  }

  // 4. 水中魚群水平巡游 (讀題靜止時原地輕微浮動)
  if (!isFreezingRead) {
    oceanFishes.forEach(f => {
      f.x += f.speed * f.dir;
      // 循環巡游
      if (f.dir === 1 && f.x > viewW + 60) f.x = -60;
      if (f.dir === -1 && f.x < -60) f.x = viewW + 60;
    });
  }
}

function handleFishPulledAboard(fish) {
  if (fish.isCorrect) {
    // 🎯 抓中正確答案！
    playCatchFishSound();
    score += 100 + streak * 25;
    streak++;
    if (streak > maxStreak) maxStreak = streak;

    streakBadge.classList.remove("hidden");
    streakBadge.textContent = `🔥 連對 x${streak}`;
    scoreDisplay.textContent = score;

    // 短暫慶祝後自動換下一題
    setTimeout(() => {
      presentNextQuestion();
    }, 400);

  } else {
    // ❌ 方案 B：抓錯魚掙脫逃跑！
    playFishEscapeSound();
    streak = 0;
    streakBadge.classList.add("hidden");

    // 彈出小筆記解析，海裡只剩下 3 隻（或更少）魚供學生重試！
    noteContent.textContent = `您剛才抓到的是「${fish.text}」。\n${currentQuestion.explanation || "觀念不符，請重新思考並抓出正確的答案！"}`;
    noteModal.classList.remove("hidden");
  }
}

function handleCloseNoteModal() {
  noteModal.classList.add("hidden");
  // 啟動防盲猜過熱冷卻 4 秒
  triggerCooldownPenalty(4);
}

function triggerCooldownPenalty(seconds) {
  isCoolingDown = true;
  cooldownOverlay.classList.remove("hidden");
  let left = seconds;
  cooldownSec.textContent = left;

  clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    left--;
    cooldownSec.textContent = left;
    if (left <= 0) {
      clearInterval(cooldownTimer);
      isCoolingDown = false;
      cooldownOverlay.classList.add("hidden");
    }
  }, 1000);
}

// ==========================================================================
// 4. 繪圖渲染 (手繪研究船與深海發光魚群)
// ==========================================================================

function renderScene() {
  ctx.clearRect(0, 0, viewW, viewH);

  // 1. 繪製深海背景微光
  drawOceanBackground();

  // 2. 繪製水中魚群與選項氣泡
  oceanFishes.forEach(f => { drawFish(f); });

  // 3. 繪製被抓取的魚 (跟隨爪尖)
  if (claw.caughtItem) {
    const tipX = claw.originX + Math.sin(claw.angle) * claw.length;
    const tipY = claw.originY + Math.cos(claw.angle) * claw.length;
    claw.caughtItem.x = tipX;
    claw.caughtItem.y = tipY;
    drawFish(claw.caughtItem);
  }

  // 4. 繪製機械釣線與吊爪 (黃金礦工鋼爪)
  drawMechanicalClaw();

  // 5. 繪製水面研究船甲板
  drawResearchBoat();
}

function drawOceanBackground() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  for (let y = 60; y < viewH; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(viewW / 2, y + 10, viewW, y);
    ctx.stroke();
  }
}

function drawFish(f) {
  ctx.save();
  ctx.translate(f.x, f.y);

  // 魚身發光圓底
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 魚圖示
  ctx.font = "26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(f.fishType, 0, -8);

  // 選項文字標籤 (自動縮短防爆框)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px sans-serif";
  const label = f.text.length > 7 ? f.text.substring(0, 6) + "…" : f.text;
  ctx.fillText(label, 0, 16);

  ctx.restore();
}

function drawMechanicalClaw() {
  const tipX = claw.originX + Math.sin(claw.angle) * claw.length;
  const tipY = claw.originY + Math.cos(claw.angle) * claw.length;

  // 釣線
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(claw.originX, claw.originY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // 鋼爪本體
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(-claw.angle);

  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(-6, -4, 12, 8);

  // 爪子開合
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(-14, 12);
  ctx.lineTo(-8, 16);
  ctx.moveTo(6, 2);
  ctx.lineTo(14, 12);
  ctx.lineTo(8, 16);
  ctx.stroke();

  ctx.restore();
}

function drawResearchBoat() {
  ctx.fillStyle = "#854d0e";
  ctx.beginPath();
  ctx.moveTo(viewW / 2 - 40, 0);
  ctx.lineTo(viewW / 2 + 40, 0);
  ctx.lineTo(viewW / 2 + 25, 20);
  ctx.lineTo(viewW / 2 - 25, 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.arc(viewW / 2, 16, 6, 0, Math.PI * 2);
  ctx.fill();
}

function gameMainLoop() {
  if (!isPaused && !isOver) {
    updateFishingPhysics();
    renderScene();
  }
  requestAnimationFrame(gameMainLoop);
}

// ==========================================================================
// 5. 課堂計時器與 Classroom 截圖證書
// ==========================================================================

function startNewFishingSession() {
  score = 0;
  streak = 0;
  maxStreak = 0;
  isPaused = false;
  isOver = false;
  isCoolingDown = false;
  isFreezingRead = false;
  remainingSeconds = gameMinutes * 60;

  scoreDisplay.textContent = score;
  streakBadge.classList.add("hidden");
  cooldownOverlay.classList.add("hidden");

  clearInterval(timerInterval);
  clearInterval(cooldownTimer);
  startTimer();
  presentNextQuestion();
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (isPaused) return;
    remainingSeconds--;
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
    const s = (remainingSeconds % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${m}:${s}`;

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      endFishingSession();
    }
  }, 1000);
}

function togglePause() {
  isPaused = !isPaused;
  pauseModal.classList.toggle("hidden", !isPaused);
}

function endFishingSession() {
  isOver = true;
  idModal.classList.remove("hidden");
}

function handleGenerateCert() {
  const cVal = classInput.value.trim() || "701";
  const sVal = seatInput.value.trim() || "第1組";
  idModal.classList.add("hidden");

  certHeroText.textContent = `${cVal} 班 ${sVal}`;
  certVerifyCode.textContent = `FISH-${Math.floor(1000 + Math.random() * 9000)}`;
  certScoreText.textContent = `${score} 分`;
  certStreakText.textContent = `${maxStreak} 題 Combo`;

  const now = new Date();
  certTimeText.textContent = `認證時間：${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  certModal.classList.remove("hidden");
}