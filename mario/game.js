/**
 * 超級馬力歐生物闖關 (Mario Bio-Quest) - 專業教學強固版核心引擎 V3.3
 * 1. 4 大主題關卡背景 (森林 🌲 ➔ 洞穴 🪨 ➔ 海底 🌊 ➔ 城堡 🌋) 依進度自動切換。
 * 2. 100% 不重複洗牌佇列 (Fisher-Yates Shuffle Queue)：單元內絕對不重複出現同一題！
 * 3. 程式自動驅動瑪利歐朝右奔跑 ➔ 躍進頂擊 ❓ 問號方塊 ➔ 彈出金幣/香菇 + 8-bit 金幣音效。
 * 4. 融合教育與課堂經營：老師 Spacebar 全場凍結、關卡派發、Google Classroom 防偽證書生成。
 */

// 4 大主題關卡設定
const STAGE_CONFIG = [
  { stageKey: "1", title: "第 1 關 (綠意森林)", unitFile: "unit01_scientific_method.json", bgClass: "stage-forest", badge: "🌲 關卡 1/4 (森林關)", stepsNeeded: 5 },
  { stageKey: "2", title: "第 2 關 (地底洞穴)", unitFile: "unit05_cell_structure.json", bgClass: "stage-cave", badge: "🪨 關卡 2/4 (洞穴關)", stepsNeeded: 5 },
  { stageKey: "3", title: "第 3 關 (水底世界)", unitFile: "unit06_membrane_transport.json", bgClass: "stage-water", badge: "🌊 關卡 3/4 (海底關)", stepsNeeded: 5 },
  { stageKey: "4", title: "第 4 關 (岩漿城堡)", unitFile: "unit10_enzymes.json", bgClass: "stage-castle", badge: "🌋 關卡 4/4 (城堡關)", stepsNeeded: 5 }
];

// 關鍵字高亮正則
const HIGHLIGHT_KEYWORDS = ["不屬於", "錯誤的是", "錯誤", "缺乏", "最小", "最大", "不包含", "最不可能", "無法"];

// 全域狀態
let currentStageIndex = 0; // 0=森林, 1=洞穴, 2=海底, 3=城堡
let currentStepInStage = 0; // 0~5
let hearts = 3;
let coins = 0;
let isAnsweringLocked = false;
let isTextZoomed = false;
let isTeacherFrozen = false;
let isSoundMuted = false;

let allManifestUnits = [];
let rawQuestionsByUnit = {}; // 原始題庫字典
let questionPoolByUnit = {}; // 獨立洗牌佇列，保證不重複
let currentActiveQuestion = null;
let currentCertCode = "";
let audioCtx = null;

// DOM 元素引用
const heartBox = document.getElementById("heartBox");
const stageBadge = document.getElementById("stageBadge");
const coinCount = document.getElementById("coinCount");
const stageScene = document.getElementById("stageScene");
const marioChar = document.getElementById("marioChar");
const steppedPath = document.getElementById("steppedPath");

const quizContainer = document.getElementById("quizContainer");
const currentUnitTitle = document.getElementById("currentUnitTitle");
const poolCounter = document.getElementById("poolCounter");
const quizStem = document.getElementById("quizStem");
const quizOptions = document.getElementById("quizOptions");

const btnZoomText = document.getElementById("btnZoomText");
const btnFreeze = document.getElementById("btnFreeze");
const btnToggleTeacher = document.getElementById("btnToggleTeacher");
const teacherPanel = document.getElementById("teacherPanel");
const btnApplyTeacherSettings = document.getElementById("btnApplyTeacherSettings");
const selectStageA = document.getElementById("selectStageA");
const selectStageB = document.getElementById("selectStageB");
const selectStageC = document.getElementById("selectStageC");
const selectStageD = document.getElementById("selectStageD");
const btnSound = document.getElementById("btnSound");
const btnReset = document.getElementById("btnReset");

// Modals
const memoModal = document.getElementById("memoModal");
const memoText = document.getElementById("memoText");
const btnCloseMemo = document.getElementById("btnCloseMemo");
const stageClearModal = document.getElementById("stageClearModal");
const stageClearTitle = document.getElementById("stageClearTitle");
const stageClearDesc = document.getElementById("stageClearDesc");
const btnNextStage = document.getElementById("btnNextStage");
const failModal = document.getElementById("failModal");
const btnRetryStage = document.getElementById("btnRetryStage");

const studentIdModal = document.getElementById("studentIdModal");
const inputClass = document.getElementById("inputClass");
const inputSeat = document.getElementById("inputSeat");
const btnGenerateCert = document.getElementById("btnGenerateCert");
const certModal = document.getElementById("certModal");
const certStudentInfo = document.getElementById("certStudentInfo");
const certCode = document.getElementById("certCode");
const certCoins = document.getElementById("certCoins");
const certTimestamp = document.getElementById("certTimestamp");
const btnCloseCert = document.getElementById("btnCloseCert");

const teacherFreezeModal = document.getElementById("teacherFreezeModal");
const btnUnfreeze = document.getElementById("btnUnfreeze");
const snapshotModal = document.getElementById("snapshotModal");
const btnRestoreSnapshot = document.getElementById("btnRestoreSnapshot");
const btnDiscardSnapshot = document.getElementById("btnDiscardSnapshot");

// 頁面初始化
window.addEventListener("DOMContentLoaded", async () => {
  initEventListeners();
  await loadManifestAndUnits();
  setupTeacherDropdowns();
  checkSnapshotOnLoad();
  startNewGame();
});

// 1. 初始化事件監聽
function initEventListeners() {
  // Safari / iPad 音效解鎖
  document.addEventListener("click", unlockAudioContext, { once: true });
  document.addEventListener("touchstart", unlockAudioContext, { once: true });

  // 老師 Spacebar 空白鍵凍結全場
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") {
      e.preventDefault();
      toggleTeacherFreeze();
    }
  });

  btnZoomText.addEventListener("click", () => {
    isTextZoomed = !isTextZoomed;
    quizContainer.classList.toggle("zoomed-text", isTextZoomed);
  });

  btnFreeze.addEventListener("click", toggleTeacherFreeze);
  btnUnfreeze.addEventListener("click", toggleTeacherFreeze);

  btnToggleTeacher.addEventListener("click", () => {
    teacherPanel.classList.toggle("hidden");
  });

  btnApplyTeacherSettings.addEventListener("click", applyTeacherSettings);

  btnSound.addEventListener("click", () => {
    isSoundMuted = !isSoundMuted;
    btnSound.textContent = isSoundMuted ? "🔇" : "🔊";
  });

  btnReset.addEventListener("click", () => {
    if (confirm("確定要重新啟動遊戲嗎？")) {
      startNewGame();
    }
  });

  btnCloseMemo.addEventListener("click", () => {
    closeModal(memoModal);
    renderCurrentQuestion();
    isAnsweringLocked = false;
  });

  btnNextStage.addEventListener("click", () => {
    closeModal(stageClearModal);
    advanceToNextStage();
  });

  btnRetryStage.addEventListener("click", () => {
    closeModal(failModal);
    hearts = 3;
    currentStepInStage = 0;
    updateUI();
    renderCurrentQuestion();
    isAnsweringLocked = false;
  });

  btnGenerateCert.addEventListener("click", generateCertificate);
  btnCloseCert.addEventListener("click", () => {
    closeModal(certModal);
    window.location.href = "../index.html";
  });

  btnRestoreSnapshot.addEventListener("click", restoreSnapshot);
  btnDiscardSnapshot.addEventListener("click", () => {
    closeModal(snapshotModal);
    localStorage.removeItem("mario_snapshot_v3.3");
    startNewGame();
  });
}

// 2. 音效系統 (Web Audio 8-bit Synth)
function unlockAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playTone(freq, type, duration, delay = 0, vol = 0.1) {
  if (isSoundMuted || isTeacherFrozen) return;
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

function playCoinSound() {
  playTone(987.77, "square", 0.08, 0, 0.12); // B5
  playTone(1318.51, "square", 0.25, 0.08, 0.15); // E6
}

function playPowerupSound() {
  [330, 392, 659, 523, 587, 784].forEach((freq, idx) => {
    playTone(freq, "triangle", 0.08, idx * 0.06, 0.1);
  });
}

function playWrongSound() {
  playTone(220, "sawtooth", 0.12, 0, 0.15);
  playTone(180, "sawtooth", 0.2, 0.1, 0.15);
}

function playStageClearSound() {
  [523, 659, 784, 1046, 784, 1046].forEach((freq, idx) => {
    playTone(freq, "square", 0.12, idx * 0.1, 0.15);
  });
}

// 3. 載入題庫與 manifest.json
async function loadManifestAndUnits() {
  try {
    const res = await fetch("../questions/manifest.json");
    if (!res.ok) throw new Error("Manifest 載入失敗");
    const manifest = await res.json();
    allManifestUnits = manifest.units || [];

    // 預先載入所有題庫
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

function setupTeacherDropdowns() {
  const selects = [selectStageA, selectStageB, selectStageC, selectStageD];
  selects.forEach((sel, idx) => {
    sel.innerHTML = "";
    allManifestUnits.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.file;
      opt.textContent = `${u.id.toUpperCase()} - ${u.title}`;
      if (STAGE_CONFIG[idx].unitFile === u.file) opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

function applyTeacherSettings() {
  STAGE_CONFIG[0].unitFile = selectStageA.value;
  STAGE_CONFIG[1].unitFile = selectStageB.value;
  STAGE_CONFIG[2].unitFile = selectStageC.value;
  STAGE_CONFIG[3].unitFile = selectStageD.value;

  // 重設該題庫佇列
  questionPoolByUnit = {};
  teacherPanel.classList.add("hidden");
  startNewGame();
}

// 4. 100% 不重複 Fisher-Yates 洗牌佇列
function getNextQuestionFromPool(unitFile) {
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
    { id: 1, question: "下列何者為生物體行光合作用的主要器官？", options: ["根", "莖", "葉", "花"], answer: 2, explanation: "葉肉細胞內含有大量葉綠體，為光合作用之主場所。" },
    { id: 2, question: "下列哪一種變因是在實驗中刻意改變的唯一因素？", options: ["控制變因", "操作變因", "應變變因", "環境變因"], answer: 1, explanation: "實驗組與對照組之間刻意改變的單一因素稱為操作變因。" }
  ];
}

// 5. 遊戲主流程與 UI 更新
function startNewGame() {
  currentStageIndex = 0;
  currentStepInStage = 0;
  hearts = 3;
  coins = 0;
  isAnsweringLocked = false;
  updateUI();
  renderCurrentQuestion();
}

function updateUI() {
  const currentStage = STAGE_CONFIG[currentStageIndex];

  // 生命值
  heartBox.innerHTML = "";
  for (let i = 0; i < hearts; i++) {
    heartBox.innerHTML += '<span class="heart">❤️</span>';
  }

  // 關卡標籤與主題背景
  stageBadge.textContent = currentStage.badge;
  stageScene.className = `mario-stage-scene ${currentStage.bgClass}`;
  coinCount.textContent = coins;

  // 階梯地圖與方塊狀態
  const steps = steppedPath.querySelectorAll(".step");
  const stepWidth = 100 / (steps.length - 1);

  steps.forEach((st, idx) => {
    const qBlock = st.querySelector(".q-block");
    if (idx < currentStepInStage) {
      st.classList.add("active");
      if (qBlock && !qBlock.classList.contains("castle-block")) qBlock.classList.add("bumped");
    } else if (idx === currentStepInStage) {
      st.classList.add("active");
    } else {
      st.classList.remove("active");
    }
  });

  // 計算瑪利歐位置 (絕對靠左比例，精準定位在當前 Step 上)
  const leftPercent = Math.min(90, Math.max(5, currentStepInStage * 18 + 5));
  marioChar.style.left = `${leftPercent}%`;

  saveSnapshot();
}

// 6. 渲染當前題目
function renderCurrentQuestion() {
  const currentStage = STAGE_CONFIG[currentStageIndex];
  const unitFile = currentStage.unitFile;

  // 取得單元標題
  const unitObj = allManifestUnits.find(u => u.file === unitFile);
  currentUnitTitle.textContent = unitObj ? `${unitObj.id.toUpperCase()} ‧ ${unitObj.title}` : currentStage.title;

  const pool = questionPoolByUnit[unitFile] || [];
  poolCounter.textContent = `題庫佇列剩餘: ${pool.length} 題`;

  currentActiveQuestion = getNextQuestionFromPool(unitFile);

  // 題目關鍵字高亮
  let htmlStem = currentActiveQuestion.question;
  HIGHLIGHT_KEYWORDS.forEach(kw => {
    if (htmlStem.includes(kw)) {
      htmlStem = htmlStem.replaceAll(kw, `<span class="kw-highlight">${kw}</span>`);
    }
  });

  quizStem.innerHTML = htmlStem;
  quizOptions.innerHTML = "";

  currentActiveQuestion.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn-option";
    btn.innerHTML = `<b>${String.fromCharCode(65 + idx)}.</b> ${optText}`;
    btn.addEventListener("click", () => handleOptionSelect(idx, btn));
    quizOptions.appendChild(btn);
  });
}

// 7. 選擇答案與頂擊方塊動態
function handleOptionSelect(selectedIndex, btnEl) {
  if (isAnsweringLocked || isTeacherFrozen) return;
  isAnsweringLocked = true;

  const isCorrect = (selectedIndex === currentActiveQuestion.answer);

  if (isCorrect) {
    btnEl.classList.add("correct");
    playCoinSound();

    // 1. 瑪利歐躍進跳躍動畫
    marioChar.classList.add("jumping");
    setTimeout(() => marioChar.classList.remove("jumping"), 600);

    // 2. 頂擊 ❓ 問號方塊
    const currentStepEl = steppedPath.querySelector(`.step[data-step="${currentStepInStage + 1}"]`);
    if (currentStepEl) {
      const qBlock = currentStepEl.querySelector(".q-block");
      if (qBlock) {
        qBlock.classList.add("do-bump");
        setTimeout(() => {
          qBlock.classList.remove("do-bump");
          qBlock.classList.add("bumped");
        }, 300);

        // 3. 彈出金幣 / 香菇特效
        spawnPopItem(currentStepEl, Math.random() > 0.3 ? "🪙" : "🍄");
      }
    }

    coins += 10;
    currentStepInStage += 1;
    updateUI();

    // 判斷是否通關
    setTimeout(() => {
      if (currentStepInStage >= 5) {
        handleStageComplete();
      } else {
        renderCurrentQuestion();
        isAnsweringLocked = false;
      }
    }, 1100);

  } else {
    btnEl.classList.add("incorrect");
    playWrongSound();

    // 彈出毒菇
    const currentStepEl = steppedPath.querySelector(`.step[data-step="${currentStepInStage}"]`);
    if (currentStepEl) spawnPopItem(currentStepEl, "🟣");

    hearts -= 1;
    updateUI();

    setTimeout(() => {
      if (hearts <= 0) {
        openModal(failModal);
      } else {
        memoText.textContent = currentActiveQuestion.explanation || "請仔細審題，注意題目中的關鍵字喔！";
        openModal(memoModal);
      }
    }, 800);
  }
}

// 彈出浮動寶物特效
function spawnPopItem(parentEl, emoji) {
  const item = document.createElement("div");
  item.className = "pop-item-anim";
  item.textContent = emoji;
  parentEl.appendChild(item);
  setTimeout(() => item.remove(), 650);
}

// 8. 關卡晉級與全破處理
function handleStageComplete() {
  playStageClearSound();

  if (currentStageIndex >= STAGE_CONFIG.length - 1) {
    // 四關全破！
    openModal(studentIdModal);
  } else {
    // 晉級下一關
    const nextStg = STAGE_CONFIG[currentStageIndex + 1];
    stageClearTitle.textContent = `🎉 晉級！${nextStg.title}`;
    stageClearDesc.textContent = `太棒了！已闖過第 ${currentStageIndex + 1} 關，獲得 10 🪙，即將開啟下一個主題世界！`;
    openModal(stageClearModal);
  }
}

function advanceToNextStage() {
  currentStageIndex += 1;
  currentStepInStage = 0;
  updateUI();
  renderCurrentQuestion();
  isAnsweringLocked = false;
}

// 9. 證書生成 (Google Classroom 作業繳交)
function generateCertificate() {
  const cls = inputClass.value.trim() || "701";
  const seat = inputSeat.value.trim() || "01";
  currentCertCode = `M-${Math.floor(1000 + Math.random() * 9000)}`;

  certStudentInfo.textContent = `${cls} 班 ${seat} 號`;
  certCode.textContent = currentCertCode;
  certCoins.textContent = `${coins} 🪙`;

  const now = new Date();
  certTimestamp.textContent = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getDate().toString().padStart(2,"0")} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;

  closeModal(studentIdModal);
  openModal(certModal);
}

// 10. 教師一鍵凍結
function toggleTeacherFreeze() {
  isTeacherFrozen = !isTeacherFrozen;
  if (isTeacherFrozen) {
    openModal(teacherFreezeModal);
  } else {
    closeModal(teacherFreezeModal);
  }
}

// 11. LocalStorage 快照機制
function saveSnapshot() {
  const snapshot = {
    currentStageIndex,
    currentStepInStage,
    hearts,
    coins,
    time: Date.now()
  };
  localStorage.setItem("mario_snapshot_v3.3", JSON.stringify(snapshot));
}

function checkSnapshotOnLoad() {
  const raw = localStorage.getItem("mario_snapshot_v3.3");
  if (raw) {
    try {
      const snap = JSON.parse(raw);
      if (snap && snap.coins > 0) {
        openModal(snapshotModal);
      }
    } catch (e) {}
  }
}

function restoreSnapshot() {
  closeModal(snapshotModal);
  const raw = localStorage.getItem("mario_snapshot_v3.3");
  if (raw) {
    const snap = JSON.parse(raw);
    currentStageIndex = snap.currentStageIndex || 0;
    currentStepInStage = snap.currentStepInStage || 0;
    hearts = snap.hearts || 3;
    coins = snap.coins || 0;
    updateUI();
    renderCurrentQuestion();
  }
}

function openModal(el) { el.classList.remove("hidden"); }
function closeModal(el) { el.classList.add("hidden"); }
