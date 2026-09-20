/**
 * 超級馬力歐生物闖關 - 專業教學強固版核心引擎
 * 支援 URL 參數解析、融合教育特教 (timer=off, 關鍵字高亮, 字體放大)、
 * LocalStorage 快照恢復、教師 Spacebar 凍結與 Google Classroom 防偽證書生成。
 */

// 關卡配置（A、B、C、D 四關）
const STAGE_CONFIG = [
  { stageKey: "A", title: "第 1 關 (草原森林)", unitFile: "unit01_scientific_method.json", stepsNeeded: 5 },
  { stageKey: "B", title: "第 2 關 (地下洞穴)", unitFile: "unit05_cell_structure.json", stepsNeeded: 5 },
  { stageKey: "C", title: "第 3 關 (深海峽谷)", unitFile: "unit06_membrane_transport.json", stepsNeeded: 5 },
  { stageKey: "D", title: "第 4 關 (巨龍城堡)", unitFile: "unit10_enzymes.json", stepsNeeded: 5 }
];

// 全域狀態
let currentStageIndex = 0; // 0=A, 1=B, 2=C, 3=D
let currentStepInStage = 0; // 0~5
let hearts = 3;
let coins = 0;
let consecutiveErrorsInStage = 0;
let isAnsweringLocked = false;
let isTextZoomed = false;
let isTeacherFrozen = false;
let isTimerDisabled = false;

let allManifestUnits = [];
let loadedQuestionsMap = {};
let currentActiveQuestion = null;
let currentCertCode = "";
let audioCtx = null;

// DOM
const heartBox = document.getElementById("heartBox");
const stageBadge = document.getElementById("stageBadge");
const coinCount = document.getElementById("coinCount");
const marioChar = document.getElementById("marioChar");
const steppedPath = document.getElementById("steppedPath");

const currentUnitTitle = document.getElementById("currentUnitTitle");
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

// 初始化
window.addEventListener("DOMContentLoaded", async () => {
  parseUrlParameters();
  initEventListeners();
  await loadManifest();
  setupTeacherDropdowns();
  checkSnapshotOnLoad();
  startNewGame();
});

function parseUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUnit = urlParams.get("unit");
  const timer = urlParams.get("timer");

  if (targetUnit) {
    STAGE_CONFIG.forEach(stg => stg.unitFile = targetUnit);
  }

  if (timer === "off") {
    isTimerDisabled = true;
  }
}

function initEventListeners() {
  btnZoomText.addEventListener("click", toggleTextZoom);
  btnToggleTeacher.addEventListener("click", () => teacherPanel.classList.toggle("hidden"));
  btnApplyTeacherSettings.addEventListener("click", applyTeacherSettings);

  btnFreeze?.addEventListener("click", toggleFreeze);
  btnUnfreeze?.addEventListener("click", toggleFreeze);

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      toggleFreeze();
    }
  });

  btnCloseMemo.addEventListener("click", () => {
    memoModal.classList.add("hidden");
    isAnsweringLocked = false;
    presentNextQuestion();
  });

  btnRetryStage.addEventListener("click", retryCurrentStage);
  btnReset.addEventListener("click", () => {
    if (confirm("確定要重設冒險，回到第 1 關重新開始嗎？")) {
      currentStageIndex = 0;
      coins = 0;
      localStorage.removeItem("mario_snapshot");
      startNewGame();
    }
  });

  btnGenerateCert.addEventListener("click", handleGenerateCert);
  btnCloseCert.addEventListener("click", () => {
    certModal.classList.add("hidden");
    window.location.href = "../index.html";
  });

  document.getElementById("btnRestoreSnapshot")?.addEventListener("click", restoreSnapshot);
  document.getElementById("btnDiscardSnapshot")?.addEventListener("click", () => {
    localStorage.removeItem("mario_snapshot");
    closeModal(snapshotModal);
  });
}

function toggleFreeze() {
  isTeacherFrozen = !isTeacherFrozen;
  if (isTeacherFrozen) {
    openModal(teacherFreezeModal);
  } else {
    closeModal(teacherFreezeModal);
  }
}

function openModal(el) { if (el) el.classList.remove("hidden"); }
function closeModal(el) { if (el) el.classList.add("hidden"); }

// 題庫動態載入
async function loadManifest() {
  try {
    const res = await fetch("../questions/manifest.json");
    if (!res.ok) throw new Error("讀取 manifest.json 失敗");
    const data = await res.json();
    allManifestUnits = data.units;
  } catch (err) {
    console.warn("使用備用題庫清單", err);
    allManifestUnits = [
      { id: "unit01", file: "unit01_scientific_method.json", title: "01. 科學方法" },
      { id: "unit05", file: "unit05_cell_structure.json", title: "05. 細胞構造" },
      { id: "unit06", file: "unit06_membrane_transport.json", title: "06. 物質進出細胞" },
      { id: "unit10", file: "unit10_enzymes.json", title: "10. 酵素與代謝作用" }
    ];
  }
}

function setupTeacherDropdowns() {
  const selects = [selectStageA, selectStageB, selectStageC, selectStageD];
  selects.forEach((sel, idx) => {
    sel.innerHTML = "";
    allManifestUnits.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.file;
      opt.textContent = `${u.id.toUpperCase()} - ${u.title}`;
      if (u.file === STAGE_CONFIG[idx].unitFile) opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

function applyTeacherSettings() {
  STAGE_CONFIG[0].unitFile = selectStageA.value;
  STAGE_CONFIG[1].unitFile = selectStageB.value;
  STAGE_CONFIG[2].unitFile = selectStageC.value;
  STAGE_CONFIG[3].unitFile = selectStageD.value;
  teacherPanel.classList.add("hidden");
  alert("✅ 老師關卡指派已成功更新！即將重啟關卡！");
  currentStageIndex = 0;
  startNewGame();
}

async function loadQuestionsForCurrentStage() {
  const targetFile = STAGE_CONFIG[currentStageIndex].unitFile;
  if (!loadedQuestionsMap[targetFile]) {
    try {
      const res = await fetch(`../questions/${targetFile}`);
      if (!res.ok) throw new Error("載入單元失敗");
      const data = await res.json();
      loadedQuestionsMap[targetFile] = data.questions;
    } catch (e) {
      console.error(e);
      loadedQuestionsMap[targetFile] = [];
    }
  }
}

// 闖關循環
async function startNewGame() {
  currentStepInStage = 0;
  hearts = 3;
  consecutiveErrorsInStage = 0;
  updateUIHeaders();
  updateMarioPosition(0);

  await loadQuestionsForCurrentStage();
  presentNextQuestion();
}

function updateUIHeaders() {
  heartBox.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const span = document.createElement("span");
    span.className = "heart";
    span.textContent = (i < hearts) ? "❤️" : "🤍";
    heartBox.appendChild(span);
  }

  const stage = STAGE_CONFIG[currentStageIndex];
  stageBadge.textContent = `關卡 ${currentStageIndex + 1}-1 (${stage.stageKey}關)`;
  coinCount.textContent = coins;
  currentUnitTitle.textContent = `當前單元：${stage.title}`;
}

function updateMarioPosition(step) {
  currentStepInStage = step;
  const leftPercent = 6 + step * 16.5;
  marioChar.style.left = `${leftPercent}%`;

  const steps = steppedPath.querySelectorAll(".step");
  steps.forEach((s, idx) => {
    if (idx <= step) s.classList.add("completed");
    else s.classList.remove("completed");
  });
}

function presentNextQuestion() {
  if (isTeacherFrozen) return;

  saveSnapshot();

  const targetFile = STAGE_CONFIG[currentStageIndex].unitFile;
  const pool = loadedQuestionsMap[targetFile] || [];
  if (pool.length === 0) {
    quizStem.textContent = "題庫載入失敗或為空，請檢查 questions/ 資料夾。";
    quizOptions.innerHTML = "";
    return;
  }

  let selected = null;
  if (currentStepInStage <= 1 || consecutiveErrorsInStage >= 2) {
    const easy = pool.filter(q => q.difficulty === "易");
    selected = (easy.length > 0) ? easy[Math.floor(Math.random() * easy.length)] : pool[0];
  } else {
    selected = pool[Math.floor(Math.random() * pool.length)];
  }

  currentActiveQuestion = selected;

  let stemText = selected.question;
  const keywords = ["不屬於", "屬於", "錯誤的是", "正確的是", "缺乏", "過多", "最適", "無法", "最多", "最少", "主要", "次要", "不包含", "包含"];
  keywords.forEach(kw => {
    if (stemText.includes(kw)) {
      stemText = stemText.replace(new RegExp(kw, "g"), `<span class="keyword-highlight">${kw}</span>`);
    }
  });

  quizStem.innerHTML = stemText;
  quizOptions.innerHTML = "";
  isAnsweringLocked = false;

  selected.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn-option";
    btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
    btn.addEventListener("click", () => handleAnswerClick(idx));
    quizOptions.appendChild(btn);
  });
}

function handleAnswerClick(selectedIdx) {
  if (isAnsweringLocked || isTeacherFrozen) return;
  isAnsweringLocked = true;

  const isCorrect = (selectedIdx === currentActiveQuestion.answer);
  const btns = quizOptions.querySelectorAll(".btn-option");

  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === currentActiveQuestion.answer) btn.classList.add("correct");
    if (i === selectedIdx && !isCorrect) btn.classList.add("wrong");
  });

  if (isCorrect) {
    playCoinSound();
    coins += 2;
    consecutiveErrorsInStage = 0;
    coinCount.textContent = coins;

    marioChar.classList.add("jump");
    setTimeout(() => {
      marioChar.classList.remove("jump");
      updateMarioPosition(currentStepInStage + 1);

      if (currentStepInStage >= STAGE_CONFIG[currentStageIndex].stepsNeeded) {
        handleStageClear();
      } else {
        setTimeout(presentNextQuestion, 400);
      }
    }, 400);

  } else {
    playDamageSound();
    hearts--;
    consecutiveErrorsInStage++;
    updateUIHeaders();

    setTimeout(() => {
      if (hearts <= 0) {
        openModal(failModal);
      } else {
        memoText.textContent = currentActiveQuestion.explanation || "本題暫無解析。";
        openModal(memoModal);
      }
    }, 500);
  }
}

async function handleStageClear() {
  playStageClearSound();
  if (currentStageIndex < STAGE_CONFIG.length - 1) {
    alert(`🎉 恭喜通過 ${STAGE_CONFIG[currentStageIndex].title}！準備進入下一關！`);
    currentStageIndex++;
    startNewGame();
  } else {
    playFanfareSound();
    openModal(studentIdModal);
  }
}

function retryCurrentStage() {
  closeModal(failModal);
  hearts = 3;
  updateUIHeaders();
  updateMarioPosition(0);
  presentNextQuestion();
}

function handleGenerateCert() {
  const cVal = inputClass.value.trim();
  const sVal = inputSeat.value.trim();

  if (!cVal || !sVal) {
    alert("請先輸入完整的班級與座號！");
    return;
  }

  closeModal(studentIdModal);

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  currentCertCode = `M-${randomNum}`;

  certStudentInfo.textContent = `${cVal} 班 ${sVal} 號`;
  certCode.textContent = currentCertCode;
  certCoins.textContent = `${coins} 🪙`;

  const now = new Date();
  certTimestamp.textContent = `認證時間：${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  openModal(certModal);
}

function toggleTextZoom() {
  document.body.classList.toggle("font-zoomed");
  btnZoomText.textContent = document.body.classList.contains("font-zoomed") ? "🔍 縮小題目" : "🔍 放大題目";
}

// LocalStorage 快照機制
function saveSnapshot() {
  try {
    const snapshot = {
      currentStageIndex,
      currentStepInStage,
      hearts,
      coins,
      timestamp: new Date().getTime()
    };
    localStorage.setItem("mario_snapshot", JSON.stringify(snapshot));
  } catch (e) {}
}

function checkSnapshotOnLoad() {
  const saved = localStorage.getItem("mario_snapshot");
  if (saved) {
    openModal(snapshotModal);
  }
}

function restoreSnapshot() {
  const saved = localStorage.getItem("mario_snapshot");
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    currentStageIndex = data.currentStageIndex;
    currentStepInStage = data.currentStepInStage;
    hearts = data.hearts;
    coins = data.coins;

    updateUIHeaders();
    updateMarioPosition(currentStepInStage);
    closeModal(snapshotModal);
  } catch (e) {
    closeModal(snapshotModal);
  }
}

// Web Audio
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, type, duration, delay = 0, vol = 0.1) {
  if (isTeacherFrozen) return;
  initAudio();
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
}

function playCoinSound() {
  playTone(987.77, "sine", 0.08, 0, 0.15);
  playTone(1318.51, "sine", 0.28, 0.08, 0.2);
}

function playDamageSound() {
  playTone(200, "sawtooth", 0.15, 0, 0.2);
  playTone(140, "sawtooth", 0.25, 0.1, 0.2);
}

function playStageClearSound() {
  playTone(523.25, "square", 0.1, 0);
  playTone(659.25, "square", 0.1, 0.1);
  playTone(783.99, "square", 0.15, 0.2);
  playTone(1046.5, "square", 0.35, 0.3);
}

function playFanfareSound() {
  [523, 659, 783, 1046, 1318].forEach((f, i) => {
    playTone(f, "triangle", 0.2, i * 0.12, 0.2);
  });
}
