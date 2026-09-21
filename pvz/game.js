/**
 * 植物大戰殭屍：細胞防衛戰 (PVZ Cell Defense) - 遊戲引擎 V2.2 旗艦極限版
 * 1. 5 路草地戰場 (5 行 x 8 列)，支援 > 60px 巨型觸控按鈕與雙排式自適應排版。
 * 2. 4 大病原體殭屍：普通 🧟、路障 🧫、飛天跳躍 🪰、巨型噬菌體魔王 🦠！
 * 3. 飛天噬菌體殭屍 (🪰) 主動越過前排堅果細胞壁，直撲後排葵花與豌豆射手！
 * 4. 嚴格 4 重答錯鎖定與防套利機制：
 *    - isQuizAnsweredCorrectly 布林值狀態雙重驗證，未答對絕不發放陽光。
 *    - 答錯觸發「❓ 答題賺陽光」主按鈕 10 秒強烈冷卻懲罰 (⏳ 10s)，防止盲猜刷新題庫！
 *    - 答錯一字鎖死所有選項與答對按鈕，顯示 💡 觀念解析與第 1 路植物 3 秒萎蔫卡彈。
 * 5. 太陽花平衡化：答題成為最主要陽光來源 (+60 ☀️)，自然與葵花產幣適度平衡，防止無腦掛機通關。
 * 6. 🍒 櫻桃胞器爆彈 (100 ☀️)：一擊清空整條路線病原體！
 * 7. 反向陣列迴圈修正子彈軌跡，防止綠色子彈積累卡死。
 */

// 植物性狀與成本
const PLANT_TYPES = {
  pea: { id: "pea", name: "胞器豌豆射手", icon: "🪴", cost: 50, maxHp: 100, atk: 25 },
  nut: { id: "nut", name: "堅果細胞壁", icon: "🌰", cost: 60, maxHp: 350, atk: 0 },
  sun: { id: "sun", name: "葉綠體葵花", icon: "🌻", cost: 40, maxHp: 80, atk: 0 },
  cherry: { id: "cherry", name: "櫻桃胞器爆彈", icon: "🍒", cost: 100, maxHp: 1, atk: 999 }
};

// 4 大殭屍波次資料 (包含飛天跳躍殭屍)
const ZOMBIE_TYPES = [
  { name: "病原體殭屍 🧟", avatar: "🧟", hp: 110, maxHp: 110, speed: 0.28, atk: 18, isVaulting: false },
  { name: "病毒路障殭屍 🧫", avatar: "🧫", hp: 200, maxHp: 200, speed: 0.22, atk: 28, isVaulting: false },
  { name: "飛天噬菌體殭屍 🪰", avatar: "🪰", hp: 150, maxHp: 150, speed: 0.36, atk: 22, isVaulting: true },
  { name: "巨型噬菌體魔王 🦠", avatar: "🦠", hp: 700, maxHp: 700, speed: 0.16, atk: 45, isVaulting: false }
];

// 遊戲全域狀態
let sunEnergy = 150;
let selectedPlantKey = "pea";
let waveTimerSeconds = 720;
let isFlashMode = false;
let currentWave = 1;
let totalWaves = 3;

// 答題防套利狀態驗證
let isQuizAnsweredCorrectly = false;
let isQuizCooldown = false;
let quizCooldownTimer = null;
let quizCooldownSecondsLeft = 0;

// 5 行 x 8 列戰場陣列
let lawnState = [
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null]
];

let activeZombies = [];
let activeBullets = [];
let wiltedLanes = [false, false, false, false, false];

let gameMode = "group"; // "group" | "solo"
let currentTurnMember = 1;
let soundEnabled = true;
let isTeacherFrozen = false;
let isTextZoomed = false;
let isQuizOpen = false;

let gameLoopTimer = null;
let waveCountdownTimer = null;
let sunGenTimer = null;

let allManifestUnits = [];
let rawQuestionsByUnit = {};
let questionPoolByUnit = {};
let currentActiveQuestion = null;
let quizCountdownTimer = null;
let audioCtx = null;

// DOM 元素引用
const modeTag = document.getElementById("modeTag");
const sunDisplay = document.getElementById("sunDisplay");
const waveTimerText = document.getElementById("waveTimerText");
const waveText = document.getElementById("waveText");
const unitInfoText = document.getElementById("unitInfoText");
const selectUnit = document.getElementById("selectUnit");
const lawnGrid = document.getElementById("lawnGrid");
const lawnContainer = document.getElementById("lawnContainer");

const cardPea = document.getElementById("cardPea");
const cardNut = document.getElementById("cardNut");
const cardSun = document.getElementById("cardSun");
const cardCherry = document.getElementById("cardCherry");
const btnStartQuiz = document.getElementById("btnStartQuiz");

const btnZoomText = document.getElementById("btnZoomText");
const btnRules = document.getElementById("btnRules");
const btnFlashMode = document.getElementById("btnFlashMode");
const btnFreeze = document.getElementById("btnFreeze");
const btnSound = document.getElementById("btnSound");

// Modals
const quizModal = document.getElementById("quizModal");
const quizBox = document.getElementById("quizBox");
const quizUnitBadge = document.getElementById("quizUnitBadge");
const poolLeftBadge = document.getElementById("poolLeftBadge");
const quizTimerBanner = document.getElementById("quizTimerBanner");
const summonerBadge = document.getElementById("summonerBadge");
const quizStem = document.getElementById("quizStem");
const quizOptions = document.getElementById("quizOptions");
const quizExplanation = document.getElementById("quizExplanation");
const explanationText = document.getElementById("explanationText");
const btnConfirmQuiz = document.getElementById("btnConfirmQuiz");
const btnCloseWrong = document.getElementById("btnCloseWrong");

const victoryModal = document.getElementById("victoryModal");
const inputSeatNo = document.getElementById("inputSeatNo");
const inputStudentName = document.getElementById("inputStudentName");
const inputReflection = document.getElementById("inputReflection");
const certCodeValue = document.getElementById("certCodeValue");
const btnCopyCert = document.getElementById("btnCopyCert");
const btnRestartGame = document.getElementById("btnRestartGame");

const rulesModal = document.getElementById("rulesModal");
const btnCloseRules = document.getElementById("btnCloseRules");
const teacherFreezeModal = document.getElementById("teacherFreezeModal");
const btnUnfreeze = document.getElementById("btnUnfreeze");

// 頁面初始化
window.addEventListener("DOMContentLoaded", async () => {
  initEventListeners();
  await loadManifestAndUnits();
  initLawnGrid();
  resetGameState();
});

function initEventListeners() {
  document.addEventListener("click", unlockAudioContext, { once: true });
  document.addEventListener("touchstart", unlockAudioContext, { once: true });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
      e.preventDefault();
      toggleTeacherFreeze();
    }
  });

  btnZoomText.addEventListener("click", () => {
    isTextZoomed = !isTextZoomed;
    btnZoomText.classList.toggle("active-zoom", isTextZoomed);
    btnZoomText.textContent = isTextZoomed ? "🔍 題目已放大" : "🔍 放大題目";
    quizBox.classList.toggle("zoomed-text", isTextZoomed);
  });

  btnRules.addEventListener("click", () => openModal(rulesModal));
  btnCloseRules.addEventListener("click", () => closeModal(rulesModal));
  btnFreeze.addEventListener("click", toggleTeacherFreeze);
  btnUnfreeze.addEventListener("click", toggleTeacherFreeze);
  btnSound.addEventListener("click", toggleSound);

  btnFlashMode.addEventListener("click", toggleFlashMode);
  btnStartQuiz.addEventListener("click", openQuizModal);

  // 答對獲得 60 陽光 (雙重 state 驗證)
  btnConfirmQuiz.addEventListener("click", () => {
    if (!isQuizAnsweredCorrectly) {
      alert("⚠️ 系統提示：未答對題目無法領取陽光能量！");
      closeModal(quizModal);
      isQuizOpen = false;
      return;
    }
    closeModal(quizModal);
    isQuizOpen = false;
    sunEnergy += 60;
    isQuizAnsweredCorrectly = false; // 消費發放狀態
    updateUI();
    playSunSound();
  });

  // 答錯關卡
  btnCloseWrong.addEventListener("click", () => {
    closeModal(quizModal);
    isQuizOpen = false;
    isQuizAnsweredCorrectly = false;
    updateUI();
  });

  btnCopyCert.addEventListener("click", copyCertificationData);
  btnRestartGame.addEventListener("click", () => {
    closeModal(victoryModal);
    resetGameState();
  });

  [inputSeatNo, inputStudentName].forEach(el => el.addEventListener("input", updateCertCode));
}

// 音效系統 (Web Audio 8-bit Synth)
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

function playPeaPop() { playTone(600, "sine", 0.06); playTone(800, "sine", 0.08, 0.03); }
function playSunSound() { playTone(987, "sine", 0.1, 0, 0.12); playTone(1318, "sine", 0.2, 0.08, 0.12); }
function playZombieHit() { playTone(160, "square", 0.1, 0, 0.15); }
function playExplosionSound() { playTone(100, "sawtooth", 0.3, 0, 0.25); playTone(50, "square", 0.4, 0.1, 0.3); }
function playFanfare() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => playTone(f, "square", 0.12, i * 0.1, 0.15)); }

function toggleSound() {
  soundEnabled = !soundEnabled;
  btnSound.textContent = soundEnabled ? "🔊" : "🔇";
}

function toggleFlashMode() {
  isFlashMode = !isFlashMode;
  waveTimerSeconds = isFlashMode ? 300 : 720;
  btnFlashMode.textContent = isFlashMode ? "⚡ 12分鐘完整" : "⚡ 5分鐘快閃";
  updateUI();
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

// 初始化 5 路 x 8 列草地戰場
function initLawnGrid() {
  lawnGrid.innerHTML = "";
  for (let r = 0; r < 5; r++) {
    const laneEl = document.createElement("div");
    laneEl.className = "lawn-lane";
    laneEl.id = `lane-${r}`;

    for (let c = 0; c < 8; c++) {
      const slotEl = document.createElement("div");
      slotEl.className = "cell-slot";
      slotEl.id = `slot-${r}-${c}`;
      laneEl.appendChild(slotEl);
    }
    lawnGrid.appendChild(laneEl);
  }
}

// 重置遊戲狀態
function resetGameState() {
  sunEnergy = 150;
  selectedPlantKey = "pea";
  waveTimerSeconds = isFlashMode ? 300 : 720;
  currentWave = 1;
  activeZombies = [];
  activeBullets = [];
  wiltedLanes = [false, false, false, false, false];
  isQuizAnsweredCorrectly = false;
  isQuizCooldown = false;
  clearInterval(quizCooldownTimer);

  btnStartQuiz.disabled = false;
  btnStartQuiz.style.opacity = "1.0";
  btnStartQuiz.style.cursor = "pointer";
  btnStartQuiz.textContent = "❓ 答題賺陽光與部署植物！";

  lawnState = [
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null]
  ];

  document.querySelectorAll(".zombie-sprite, .pea-bullet, .plant-sprite").forEach(el => el.remove());

  updateUI();
  startTimers();
}

function updateUI() {
  sunDisplay.textContent = sunEnergy;
  const m = Math.floor(waveTimerSeconds / 60).toString().padStart(2, "0");
  const s = (waveTimerSeconds % 60).toString().padStart(2, "0");
  waveTimerText.textContent = `${m}:${s}`;
  waveText.textContent = `第 ${currentWave} / ${totalWaves} 波`;

  modeTag.textContent = gameMode === "group" ? `👥 小組競賽 (第 ${currentTurnMember} 棒植物召喚師)` : `👤 個人單機模式`;
  summonerBadge.textContent = gameMode === "group" ? `🎯 本回合植物召喚師：第 ${currentTurnMember} 棒組員` : `🎯 植物召喚師：自主`;

  const selUnit = selectUnit.value || "ALL";
  unitInfoText.textContent = selUnit === "ALL" ? "🌱 關卡：全單元綜合大亂鬥 (1~10單元混合)" : `🌱 關卡：${selectUnit.options[selectUnit.selectedIndex]?.text || "生物單元"}`;
}

function selectPlantType(key) {
  selectedPlantKey = key;
  cardPea.classList.toggle("active", key === "pea");
  cardNut.classList.toggle("active", key === "nut");
  cardSun.classList.toggle("active", key === "sun");
  if (cardCherry) cardCherry.classList.toggle("active", key === "cherry");
}

// 巨型觸控按鈕：一鍵部署植物至指定路
function deploySelectedPlantToLane(laneIdx) {
  if (wiltedLanes[laneIdx]) {
    alert(`⚠️ 第 ${laneIdx + 1} 路植物正在萎蔫卡彈中，請稍後再部署！`);
    return;
  }

  const pData = PLANT_TYPES[selectedPlantKey];
  if (sunEnergy < pData.cost) {
    alert(`⚠️ 陽光能量不足！需要 ${pData.cost} 陽光，當前僅有 ${sunEnergy} 陽光。請點擊「❓ 答題賺陽光」！`);
    return;
  }

  // 限制每路只能種植 1 棵葵花
  if (selectedPlantKey === "sun") {
    const hasSunInLane = lawnState[laneIdx].some(p => p && p.key === "sun");
    if (hasSunInLane) {
      alert(`⚠️ 第 ${laneIdx + 1} 路已有葉綠體葵花！每路限種植 1 棵葵花，請選擇其他路線或部署射手！`);
      return;
    }
  }

  // 🍒 櫻桃爆彈大招一擊清空路線
  if (selectedPlantKey === "cherry") {
    sunEnergy -= pData.cost;
    updateUI();
    playExplosionSound();

    activeZombies.forEach((z) => {
      if (z.lane === laneIdx) {
        const zEl = document.getElementById(z.id);
        if (zEl) zEl.remove();
      }
    });
    activeZombies = activeZombies.filter(z => z.lane !== laneIdx);

    const laneEl = document.getElementById(`lane-${laneIdx}`);
    if (laneEl) {
      const boomEl = document.createElement("div");
      boomEl.style.cssText = "position:absolute;left:50%;top:20%;font-size:3.5rem;z-index:30;animation:enemyHit 0.6s ease;";
      boomEl.textContent = "💥 櫻桃大爆炸！";
      laneEl.appendChild(boomEl);
      setTimeout(() => boomEl.remove(), 600);
    }
    return;
  }

  let emptyCol = -1;
  for (let c = 0; c < 8; c++) {
    if (!lawnState[laneIdx][c]) {
      emptyCol = c;
      break;
    }
  }

  if (emptyCol === -1) {
    alert(`⚠️ 第 ${laneIdx + 1} 路 8 列防線已滿！`);
    return;
  }

  sunEnergy -= pData.cost;
  updateUI();

  const plantObj = {
    key: selectedPlantKey,
    hp: pData.maxHp,
    maxHp: pData.maxHp,
    lane: laneIdx,
    col: emptyCol,
    lastActionTime: Date.now()
  };

  lawnState[laneIdx][emptyCol] = plantObj;

  const slotEl = document.getElementById(`slot-${laneIdx}-${emptyCol}`);
  if (slotEl) {
    const pEl = document.createElement("div");
    pEl.className = "plant-sprite";
    pEl.id = `plant-${laneIdx}-${emptyCol}`;
    pEl.textContent = pData.icon;
    slotEl.appendChild(pEl);
  }

  playSunSound();
}

// 開始計時與遊戲主迴圈
function startTimers() {
  clearInterval(gameLoopTimer);
  clearInterval(waveCountdownTimer);
  clearInterval(sunGenTimer);

  gameLoopTimer = setInterval(gameLoop, 100);

  waveCountdownTimer = setInterval(() => {
    if (isTeacherFrozen) return;
    if (waveTimerSeconds > 0) {
      waveTimerSeconds--;
      if (waveTimerSeconds === 480) triggerNextWave(2);
      if (waveTimerSeconds === 240) triggerNextWave(3);
      updateUI();
    } else {
      openVictoryModal();
    }
  }, 1000);

  sunGenTimer = setInterval(() => {
    if (isTeacherFrozen) return;
    sunEnergy += 5;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        if (lawnState[r][c] && lawnState[r][c].key === "sun") {
          sunEnergy += 8;
        }
      }
    }
    updateUI();
  }, 8000);
}

function triggerNextWave(waveNum) {
  currentWave = waveNum;
  playFanfare();
  alert(`🚨 大波病原體即將到來！當前第 ${currentWave} 波！`);
  updateUI();
}

// 遊戲主迴圈
function gameLoop() {
  if (isTeacherFrozen) return;

  const containerRect = lawnContainer.getBoundingClientRect();
  const speedFactor = isQuizOpen ? 0.1 : 1.0;
  const colWidth = containerRect.width / 8;

  const spawnRate = isQuizOpen ? 0.01 : (0.05 + currentWave * 0.035);
  if (Math.random() < spawnRate) {
    const lane = Math.floor(Math.random() * 5);
    const zType = ZOMBIE_TYPES[Math.min(currentWave - 1 + (Math.random() < 0.35 ? 1 : 0), ZOMBIE_TYPES.length - 1)];

    const zId = `zombie-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const zEl = document.createElement("div");
    zEl.className = "zombie-sprite";
    zEl.id = zId;
    zEl.innerHTML = `
      <span>${zType.avatar}</span>
      <div class="zombie-hp-bar"><div class="zombie-hp-fill" id="hp-${zId}" style="width:100%;"></div></div>
    `;
    zEl.style.left = `${containerRect.width - 50}px`;

    const laneEl = document.getElementById(`lane-${lane}`);
    if (laneEl) laneEl.appendChild(zEl);

    activeZombies.push({
      id: zId,
      name: zType.name,
      hp: zType.hp,
      maxHp: zType.hp,
      speed: zType.speed * speedFactor * 1.5,
      atk: zType.atk,
      isVaulting: zType.isVaulting,
      hasVaulted: false,
      lane,
      posX: containerRect.width - 50
    });
  }

  for (let zIdx = activeZombies.length - 1; zIdx >= 0; zIdx--) {
    const z = activeZombies[zIdx];
    let isEating = false;

    const targetCol = Math.floor(z.posX / colWidth);
    if (targetCol >= 0 && targetCol < 8 && lawnState[z.lane][targetCol]) {
      const plant = lawnState[z.lane][targetCol];

      if (z.isVaulting && !z.hasVaulted) {
        z.hasVaulted = true;
        z.posX -= colWidth * 1.8;
      } else {
        isEating = true;
        plant.hp -= z.atk * 0.1;
        if (plant.hp <= 0) {
          lawnState[z.lane][targetCol] = null;
          const pEl = document.getElementById(`plant-${z.lane}-${targetCol}`);
          if (pEl) pEl.remove();
        }
      }
    }

    if (!isEating) {
      z.posX -= z.speed * 10;
    }

    const zEl = document.getElementById(z.id);
    if (zEl) zEl.style.left = `${z.posX}px`;

    if (z.posX <= 10) {
      if (zEl) zEl.remove();
      activeZombies.splice(zIdx, 1);
      alert(`🚨 病原體攻破第 ${z.lane + 1} 路細胞防線！`);
    }
  }

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 8; c++) {
      const p = lawnState[r][c];
      if (p && p.key === "pea" && !wiltedLanes[r]) {
        const hasZombieInLane = activeZombies.some(z => z.lane === r && z.posX > (c * colWidth));
        if (hasZombieInLane && Math.random() < 0.28) {
          firePeaBullet(r, c, colWidth);
        }
      }
    }
  }

  for (let bIdx = activeBullets.length - 1; bIdx >= 0; bIdx--) {
    const b = activeBullets[bIdx];
    b.posX += 18;

    const bEl = document.getElementById(b.id);
    if (bEl) bEl.style.left = `${b.posX}px`;

    let hit = false;
    for (let zIdx = activeZombies.length - 1; zIdx >= 0; zIdx--) {
      const z = activeZombies[zIdx];
      if (z.lane === b.lane && Math.abs(z.posX - b.posX) < 35) {
        z.hp -= 25;
        playZombieHit();
        hit = true;

        const zHpFill = document.getElementById(`hp-${z.id}`);
        if (zHpFill) zHpFill.style.width = `${Math.max(0, (z.hp / z.maxHp) * 100)}%`;

        if (z.hp <= 0) {
          const zEl = document.getElementById(z.id);
          if (zEl) zEl.remove();
          activeZombies.splice(zIdx, 1);
        }
        break;
      }
    }

    if (hit || b.posX > containerRect.width - 20) {
      if (bEl) bEl.remove();
      activeBullets.splice(bIdx, 1);
    }
  }
}

function firePeaBullet(lane, col, colWidth) {
  const bId = `bullet-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  const bEl = document.createElement("div");
  bEl.className = "pea-bullet";
  bEl.id = bId;
  bEl.textContent = "🟢";
  bEl.style.left = `${col * colWidth + 25}px`;

  const laneEl = document.getElementById(`lane-${lane}`);
  if (laneEl) {
    laneEl.appendChild(bEl);
    activeBullets.push({ id: bId, lane, posX: col * colWidth + 25 });
    playPeaPop();
  }
}

// 題目彈窗開啟 (含答題冷卻判斷與狀態重置)
function openQuizModal() {
  if (isQuizCooldown) {
    alert(`⚠️ 答錯懲罰冷卻中！請等待 ${quizCooldownSecondsLeft} 秒後再點擊「❓ 答題賺陽光」！`);
    return;
  }

  isQuizAnsweredCorrectly = false;
  isQuizOpen = true;

  const unitFile = selectUnit.value || "ALL";
  quizUnitBadge.textContent = unitFile === "ALL" ? "全單元綜合大亂鬥" : "生物單元複習";

  const pool = questionPoolByUnit[unitFile] || [];
  poolLeftBadge.textContent = `題庫佇列剩餘: ${pool.length} 題`;

  currentActiveQuestion = getNextQuestionFromPool(unitFile);

  quizStem.textContent = currentActiveQuestion.question;
  quizOptions.innerHTML = "";
  quizExplanation.classList.add("hidden");
  btnConfirmQuiz.classList.add("hidden");
  btnCloseWrong.classList.add("hidden");

  currentActiveQuestion.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn-option";
    btn.disabled = false;
    btn.innerHTML = `<b>${String.fromCharCode(65 + idx)}.</b> ${optText}`;
    btn.addEventListener("click", () => handleQuizSelect(idx, btn));
    quizOptions.appendChild(btn);
  });

  quizBox.classList.toggle("zoomed-text", isTextZoomed);
  startQuizCountdownTimer();
  openModal(quizModal);
}

function startQuizCountdownTimer() {
  let timeLeft = 30;
  quizTimerBanner.textContent = `⏱️ 倒數計時：${timeLeft} 秒 (殭屍已龜速緩速中)`;
  clearInterval(quizCountdownTimer);

  quizCountdownTimer = setInterval(() => {
    timeLeft--;
    quizTimerBanner.textContent = `⏱️ 倒數計時：${timeLeft} 秒 (殭屍已龜速緩速中)`;
    if (timeLeft <= 0) {
      clearInterval(quizCountdownTimer);
      quizTimerBanner.textContent = "🚨 時間到！超過 30 秒自動判定答錯並發動冷卻懲罰！";
      handleQuizSelect(-1, null); // 時間到視同答錯處理！
    }
  }, 1000);
}

// 答題點選與嚴格答錯 10 秒冷卻懲罰
function handleQuizSelect(selectedIndex, btnEl) {
  clearInterval(quizCountdownTimer);

  // 1. 一字鎖死所有選項
  const allOptBtns = quizOptions.querySelectorAll(".btn-option");
  allOptBtns.forEach(b => {
    b.disabled = true;
    b.onclick = null;
    b.style.pointerEvents = "none";
    b.style.cursor = "default";
    b.style.opacity = "0.7";
  });

  const isCorrect = (selectedIndex === currentActiveQuestion.answer);
  isQuizAnsweredCorrectly = isCorrect;

  if (isCorrect) {
    if (btnEl) {
      btnEl.classList.add("correct");
      btnEl.style.opacity = "1.0";
    }
    playFanfare();
    explanationText.innerHTML = `<b>✅ 答對了！獲得 +60 ☀️ 陽光能量！</b><br><br>💡 生物觀念解析：${currentActiveQuestion.explanation || "恭喜答對！"}`;
    quizExplanation.classList.remove("hidden");
    btnConfirmQuiz.classList.remove("hidden");
    btnCloseWrong.classList.add("hidden");

  } else {
    if (btnEl) {
      btnEl.classList.add("incorrect");
      btnEl.style.opacity = "1.0";
    }
    playZombieHit();

    // 標示出正確答案供學生複習
    const correctBtn = allOptBtns[currentActiveQuestion.answer];
    if (correctBtn) {
      correctBtn.classList.add("correct");
    }

    explanationText.innerHTML = `<b style="color:#dc2626;">❌ 答錯囉！無獲得陽光，且觸發 10 秒答題冷卻懲罰與第 1 路植物 3 秒萎蔫！</b><br><br>💡 正確觀念解析：${currentActiveQuestion.explanation || "請仔細查看觀念筆記！"}`;
    quizExplanation.classList.remove("hidden");
    btnConfirmQuiz.classList.add("hidden"); // 嚴格隱藏答對發放按鈕
    btnCloseWrong.classList.remove("hidden"); // 僅顯示答錯關閉按鈕

    // 觸發第 1 路植物萎蔫 3 秒
    wiltedLanes[0] = true;
    setTimeout(() => { wiltedLanes[0] = false; }, 3000);

    // 觸發「答題賺陽光」主按鈕 10 秒懲罰冷卻！
    startQuizCooldownPenalty(10);
  }

  // 小組棒次輪換
  if (gameMode === "group") {
    currentTurnMember = (currentTurnMember % 4) + 1;
    updateUI();
  }
}

// 觸發答題 10 秒懲罰冷卻
function startQuizCooldownPenalty(seconds = 10) {
  isQuizCooldown = true;
  quizCooldownSecondsLeft = seconds;
  btnStartQuiz.disabled = true;
  btnStartQuiz.style.opacity = "0.6";
  btnStartQuiz.style.cursor = "not-allowed";
  btnStartQuiz.textContent = `⏳ 答錯冷卻中 (${quizCooldownSecondsLeft}s)`;

  clearInterval(quizCooldownTimer);
  quizCooldownTimer = setInterval(() => {
    quizCooldownSecondsLeft--;
    if (quizCooldownSecondsLeft > 0) {
      btnStartQuiz.textContent = `⏳ 答錯冷卻中 (${quizCooldownSecondsLeft}s)`;
    } else {
      clearInterval(quizCooldownTimer);
      isQuizCooldown = false;
      btnStartQuiz.disabled = false;
      btnStartQuiz.style.opacity = "1.0";
      btnStartQuiz.style.cursor = "pointer";
      btnStartQuiz.textContent = "❓ 答題賺陽光與部署植物！";
    }
  }, 1000);
}

// 結算與防偽認證碼
function openVictoryModal() {
  updateCertCode();
  openModal(victoryModal);
}

function updateCertCode() {
  const seat = inputSeatNo.value.trim() || "70105號";
  const name = inputStudentName.value.trim() || "召喚師同學";
  const str = `${seat}-${name}-${sunEnergy}-${currentWave}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  const code = Math.abs(hash).toString(16).toUpperCase().padStart(4, "0");
  certCodeValue.textContent = `PVZ-${code}-${seat}`;
}

function copyCertificationData() {
  const text = `【植物大戰殭屍：細胞防衛戰 - 課堂通關證書】\n` +
    `👤 學生/小組：${inputSeatNo.value} ${inputStudentName.value}\n` +
    `☀️ 剩餘陽光能量：${sunEnergy}\n` +
    `🌊 擊退殭屍波次：${currentWave} / ${totalWaves}\n` +
    `📝 課堂心得：${inputReflection.value}\n` +
    `🌱 防偽認證碼：${certCodeValue.textContent}`;

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
