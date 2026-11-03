/**
 * 生物大釣手：黃金深海大捕撈 - 核心引擎
 * 支援 1~10 單元讀取、Fisher-Yates 抽過即移出、黃金礦工擺盪機械爪、磁吸寬容判定、方案 B 刪去法、防盲猜冷卻與 Classroom 防偽證書
 */

// 1~10 單元離線保底題庫 (備援防止校園網路斷線)
const FISHING_FALLBACK_QUESTIONS = [
  { id: 1, unit: "unit01", question: "在設計科學實驗時，實驗組與對照組之間最多能有幾個「操縱變因」？", options: ["只能有 1 個", "可以有 2 個", "可以有 3 個", "沒有限制數量"], answer: 0, explanation: "對照實驗中，為了確認因果關係，操縱變因只能有 1 個。" },
  { id: 2, unit: "unit02", question: "使用複式顯微鏡觀察洋蔥表皮細胞，若影像偏向右下方，玻片標本應往哪移？", options: ["往左上方移動", "往右下方移動", "往左下方移動", "往正上方移動"], answer: 1, explanation: "複式顯微鏡成倒立放大像，物體偏哪裡就往哪裡移。" },
  { id: 3, unit: "unit03", question: "下列何者「不屬於」生物體所表現出的生命現象？", options: ["綠豆萌芽生長", "含羞草葉片閉合", "鐘乳石沉積長大", "酵母菌出芽生殖"], answer: 2, explanation: "鐘乳石是無生物礦物累積，不具細胞代謝生長，不屬於生命現象。" },
  { id: 4, unit: "unit04", question: "虎克最早利用自製顯微鏡在軟木塞切片中所觀察到的蜂窩狀小格子是？", options: ["活的細胞核", "大型液胞", "葉綠體顆粒", "死去的細胞壁"], answer: 3, explanation: "軟木塞為植物死細胞，虎克觀察到的是殘留的植物細胞壁。" },
  { id: 5, unit: "unit05", question: "植物細胞能夠維持固定且對稱的外形，主要依賴下列哪一構造？", options: ["堅硬的細胞壁", "具選擇性的細胞膜", "粒線體發電機", "大型葉綠體"], answer: 0, explanation: "細胞壁主要由纖維素構成，具保護並支持植物細胞形狀的功能。" },
  { id: 6, unit: "unit06", question: "將人類紅血球置入高濃度的濃食鹽水中，紅血球細胞將會發生什麼變化？", options: ["吸水膨脹破裂", "失水萎縮", "形狀維持不變", "外層細胞壁加厚"], answer: 1, explanation: "高濃度溶液使水分子滲透出細胞，動物細胞無細胞壁保護會失水萎縮。" },
  { id: 7, unit: "unit07", question: "人體的「心臟」由肌肉組織、神經組織等聯合構成，在生物層次上屬於？", options: ["細胞層級", "組織層級", "器官層級", "器官系統層級"], answer: 2, explanation: "由多種不同組織共同構成具有特定功能的構造稱為器官。" },
  { id: 8, unit: "unit08", question: "在微觀尺度大小比較中，下列何者的長度或體積最小？", options: ["紅血球細胞", "口腔皮膜細胞", "草履蟲單細胞", "水分子結構"], answer: 3, explanation: "水分子是奈米級 (nm) 的分子，遠小於微米級 (μm) 的細胞構造。" },
  { id: 9, unit: "unit09", question: "1 公克的脂質在生物體內完全氧化燃燒，約可釋出多少千卡的熱量？", options: ["9 千卡熱量", "4 千卡熱量", "0 千卡熱量", "100 千卡熱量"], answer: 0, explanation: "醣類與蛋白質每公克產生 4 千卡，脂質每公克產生 9 千卡。" },
  { id: 10, unit: "unit10", question: "人體消化系統中的酵素發揮最大催化活性的最適溫度大約是？", options: ["攝氏 80 度高溫", "攝氏 37 度左右", "攝氏 0 度低溫", "攝氏 100 度沸騰"], answer: 1, explanation: "人體酵素大多屬於蛋白質，在體溫約 37°C 時活性最高，高溫會變性失活。" }
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
let answeredCount = 0;
let targetQCount = 10;
let questionAttempts = 0; // 本題嘗試抓錯次數 (上限 3 次，防止無腦盲猜與空抓卡關)
let isQuestionFailed = false; // 是否已達 3 次上限判定未通過

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
const noteBadge = document.getElementById("noteBadge");
const noteTitle = document.getElementById("noteTitle");
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

// Web Audio API
let audioCtx = null;
let isAudioMuted = false;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function toggleAudio() {
  initAudio();
  isAudioMuted = !isAudioMuted;
  if (btnAudio) {
    btnAudio.textContent = isAudioMuted ? "🔇" : "🔊";
    btnAudio.title = isAudioMuted ? "已靜音 (點擊開啟音效)" : "音效切換";
  }
}

function playTone(freq, type, dur, delay = 0, vol = 0.1) {
  if (isAudioMuted || !audioCtx) return;
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

let isGameReady = false;
let pendingStartGame = false;

window.addEventListener("DOMContentLoaded", async () => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => { resizeCanvas(); renderScene(); }).observe(canvas.parentElement);
  }
  initFishingPresentation();
  buildUnitsChecklist();
  initControls();

  await prepareQuestionPool();
  // ⭐ 安全凍結守門員：先建立釣場畫面
  startNewFishingSession();
  isGameReady = true;

  if (pendingStartGame) {
    pendingStartGame = false;
    isPaused = false;
    const isTimerOff = new URLSearchParams(window.location.search).get("timer") === "off";
    if (!isTimerOff) startTimer();
  } else {
    isPaused = true;
  }

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
  // 點擊螢幕任意處發射釣爪 (若點擊海中魚群則高亮對應選項卡片)
  touchLaunchZone.addEventListener("pointerdown", (e) => {
    initAudio();
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const tappedFish = oceanFishes.find(f => {
        const dx = clickX - f.x;
        const dy = clickY - f.y;
        return Math.sqrt(dx * dx + dy * dy) < (f.radius * 1.5);
      });

      if (tappedFish) {
        highlightOptionCard(tappedFish.optIndex);
      }
    }
    triggerClawLaunch();
  });

  // 底部四選一選項卡片點擊監聽 (點擊高亮卡片)
  for (let i = 0; i < 4; i++) {
    const card = document.getElementById(`optCard${i}`);
    if (card) {
      card.addEventListener("click", () => {
        highlightOptionCard(i);
      });
    }
  }

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

  const selectDrawerPub = document.getElementById("selectDrawerPublisher");
  if (selectDrawerPub) {
    selectDrawerPub.onchange = renderDrawerUnitsGrid;
  }

  btnAudio.onclick = () => toggleAudio();
  btnPause.onclick = togglePause;
  btnResumeGame.onclick = togglePause;

  btnCloseNote.onclick = handleCloseNoteModal;
  btnCreateCert.onclick = handleGenerateCert;
  btnRestartFishing.onclick = () => { certModal.classList.add("hidden"); startNewFishingSession(); };
}

let isTeacherDrawerOverridden = false;
let allManifestUnits = [];

async function buildUnitsChecklist() {
  unitsGrid.innerHTML = '<div style="color:#94a3b8; font-size:0.85rem; padding:8px;">載入課堂題庫單元中...</div>';
  try {
    const res = await fetch("../questions/manifest.json");
    if (!res.ok) throw new Error("Manifest 載入失敗");
    const data = await res.json();

    allManifestUnits = [];
    if (data.publishers && Array.isArray(data.publishers)) {
      data.publishers.forEach(pub => {
        if (pub.status === "placeholder") return;
        pub.semesters.forEach(sem => {
          if (!sem.units) return;
          sem.units.forEach(u => {
            allManifestUnits.push({
              publisher: pub.name,
              semester: sem.name,
              title: u.title,
              file: u.file,
              id: u.id
            });
          });
        });
      });
    } else if (data.units) {
      allManifestUnits = data.units.map(u => ({
        publisher: "生物核心",
        semester: "7年級",
        title: u.title,
        file: u.file,
        id: u.id
      }));
    }

    renderDrawerUnitsGrid();
  } catch (err) {
    console.warn("載入題庫索引清單失敗:", err);
    unitsGrid.innerHTML = '<div style="color:#ef4444; font-size:0.85rem; padding:8px;">題庫清單讀取異常，請使用大廳派卷</div>';
  }
}

function renderDrawerUnitsGrid() {
  const selectPub = document.getElementById("selectDrawerPublisher");
  const currentPub = selectPub ? selectPub.value : "all";
  const urlParams = new URLSearchParams(window.location.search);
  const activeUnitFromUrl = urlParams.get("unit") || urlParams.get("file");

  unitsGrid.innerHTML = "";

  const filtered = allManifestUnits.filter(u => {
    if (currentPub === "all") return true;
    return u.publisher.includes(currentPub);
  });

  filtered.forEach(u => {
    const lbl = document.createElement("label");
    lbl.className = "unit-item";

    let isChecked = false;
    if (isTeacherDrawerOverridden && selectedUnits && selectedUnits.length > 0) {
      isChecked = selectedUnits.includes(u.file);
    } else if (activeUnitFromUrl) {
      const decoded = decodeURIComponent(activeUnitFromUrl).trim();
      isChecked = (u.file === decoded || u.id === decoded || u.file.includes(decoded));
    } else {
      isChecked = true;
    }

    lbl.innerHTML = `
      <input type="checkbox" value="${u.file}" ${isChecked ? "checked" : ""}>
      <span title="${u.title}" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📖 ${u.title}</span>
    `;
    unitsGrid.appendChild(lbl);
  });
}

async function handleApplyTeacherSettings() {
  const checked = Array.from(unitsGrid.querySelectorAll("input:checked")).map(cb => cb.value);
  if (checked.length === 0) {
    alert("請至少選擇 1 個出題單元！");
    return;
  }
  selectedUnits = checked;
  isTeacherDrawerOverridden = true;
  playMode = selectPlayMode.value;
  gameMinutes = parseInt(selectGameTime.value, 10);
  remainingSeconds = gameMinutes * 60;

  groupTurnTag.classList.toggle("hidden", playMode === "solo");
  drawerPanel.classList.add("hidden");

  await prepareQuestionPool();
  alert(`✅ 已套用設定！成功載入 ${questionPool.length} 題指定單元試題，重新起錨出海！`);
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

// 嚴格審題過濾器：確保每題 100% 具備合法正解與至少 2 個有效選項，缺答案自動剔除
function sanitizeQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(q => {
    if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) return false;
    // 檢查是否有有效正確答案
    if (typeof q.answer === "number") {
      return q.answer >= 0 && q.answer < q.options.length && Boolean(q.options[q.answer]);
    }
    if (typeof q.answer === "string") {
      const ansUpper = q.answer.trim().toUpperCase();
      const idx = ["A", "B", "C", "D"].indexOf(ansUpper);
      if (idx >= 0 && idx < q.options.length) return Boolean(q.options[idx]);
      return q.options.includes(q.answer.trim());
    }
    return false;
  });
}

async function prepareQuestionPool() {
  let loaded = [];
  const urlParams = new URLSearchParams(window.location.search);
  const unitParam = urlParams.get("unit") || urlParams.get("file");

  // 1. 若老師未在抽屜自選，且網址帶有指定派卷單元，優先載入網址單元
  if (!isTeacherDrawerOverridden && unitParam) {
    try {
      const decodedUnit = decodeURIComponent(unitParam).trim();
      const fetchPath = decodedUnit.endsWith('.json') ? `../questions/${decodedUnit}` : `../questions/${decodedUnit}.json`;
      const res = await fetch(fetchPath);
      if (res.ok) {
        const d = await res.json();
        const list = d.questions || (Array.isArray(d) ? d : []);
        loaded = sanitizeQuestions(list);
        if (d.unitTitle) {
          unitTag.textContent = `當前單元：${d.unitTitle}`;
        } else {
          unitTag.textContent = `當前單元：${decodedUnit.split('/').pop().replace('.json', '')}`;
        }
      }
    } catch (err) {
      console.warn("URL 指定題庫載入失敗，切換備用清單", err);
    }
  }

  // 2. 老師在抽屜勾選自訂單元（或網址無單元）：精準載入勾選的所有真實單元檔案
  if (loaded.length === 0 && selectedUnits && selectedUnits.length > 0) {
    try {
      for (const u of selectedUnits) {
        const fetchPath = u.endsWith('.json') ? `../questions/${u}` : `../questions/${u}.json`;
        const res = await fetch(fetchPath);
        if (res.ok) {
          const d = await res.json();
          const list = d.questions || (Array.isArray(d) ? d : []);
          loaded.push(...sanitizeQuestions(list));
        }
      }
      if (selectedUnits.length === 1) {
        const singleName = selectedUnits[0].split('/').pop().replace('.json', '');
        unitTag.textContent = `當前單元：${singleName}`;
      } else if (selectedUnits.length > 1) {
        unitTag.textContent = `自選 ${selectedUnits.length} 個單元混合出題`;
      }
    } catch (err) {
      console.warn("自選題庫載入失敗，啟動備用保底題庫", err);
    }
  }

  // 3. 備用保底題庫
  if (loaded.length === 0) {
    loaded = sanitizeQuestions(FISHING_FALLBACK_QUESTIONS);
    unitTag.textContent = "當前單元：生物核心精選題";
  }

  // 4. 自動去重 (避免重複題目出現)
  const seenStems = new Set();
  const deduped = [];
  for (const q of loaded) {
    const key = q.question.trim();
    if (!seenStems.has(key)) {
      seenStems.add(key);
      deduped.push(q);
    }
  }

  // 5. Fisher-Yates 真正隨機洗牌打亂
  questionPool = shuffleArray([...deduped]);
}

function highlightOptionCard(idx) {
  for (let i = 0; i < 4; i++) {
    const c = document.getElementById(`optCard${i}`);
    if (c) c.classList.remove("highlight");
  }
  const target = document.getElementById(`optCard${idx}`);
  if (target) {
    target.classList.add("highlight");
    setTimeout(() => target.classList.remove("highlight"), 2500);
  }
}

function renderBottomOptionCards(options) {
  const letters = ["a", "b", "c", "d"];
  for (let i = 0; i < 4; i++) {
    const card = document.getElementById(`optCard${i}`);
    const textElem = document.getElementById(`optText${i}`);
    if (card && textElem) {
      if (options[i]) {
        card.style.display = "flex";
        card.className = `opt-card opt-card-${letters[i]}`;
        textElem.textContent = options[i];
      } else {
        card.style.display = "none";
      }
    }
  }
}

async function presentNextQuestion() {
  questionAttempts = 0;
  isQuestionFailed = false;
  if (questionPool.length === 0) {
    await prepareQuestionPool();
  }
  currentQuestion = questionPool.pop(); // Fisher-Yates 抽過即移除
  if (!currentQuestion) {
    // 題庫無可用試題，自動優雅結算
    endFishingSession();
    return;
  }

  // 棒次輪流提示
  if (playMode === "group" || playMode === "group-tablet") {
    groupTurnTag.textContent = `🎣 本回合神釣手：第 ${groupTurn} 棒組員`;
    groupTurn = (groupTurn % 4) + 1;
  }

  if (currentQuestion.unitTitle) {
    unitTag.textContent = `當前單元：${currentQuestion.unitTitle}`;
  } else {
    unitTag.textContent = `當前單元：${currentQuestion.unit || "生物核心"}`;
  }

  // 關鍵字高亮
  let stemText = currentQuestion.question;
  ["不屬於", "最多能有幾個", "何者錯誤", "不是", "無關"].forEach(kw => {
    if (stemText.includes(kw)) {
      stemText = stemText.replace(new RegExp(kw, "g"), `<span class="keyword-highlight">${kw}</span>`);
    }
  });
  questionStem.innerHTML = stemText;
  syncMissionProgress();

  // 渲染底部四選一選項卡片 (完全不縮寫截斷，全字顯示)
  renderBottomOptionCards(currentQuestion.options || []);

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
  if (!currentQuestion) return;
  const rawOptions = currentQuestion.options || [];

  let correctIdx = -1;
  if (typeof currentQuestion.answer === "number") {
    correctIdx = currentQuestion.answer;
  } else if (typeof currentQuestion.answer === "string") {
    const ansKey = currentQuestion.answer.trim().toUpperCase();
    const idx = ["A", "B", "C", "D"].indexOf(ansKey);
    if (idx >= 0 && idx < rawOptions.length) {
      correctIdx = idx;
    } else {
      correctIdx = rawOptions.findIndex(opt => opt && opt.trim() === currentQuestion.answer.trim());
    }
  }
  if (correctIdx < 0 || correctIdx >= rawOptions.length) correctIdx = 0;

  const count = Math.min(4, rawOptions.length);
  const minLayer = Math.max(65, viewH * 0.20);
  // 保證最深泳層落在機械爪有效抓取範圍內 (距離底部至少 75px，避免極限角度無法碰觸)
  const maxLayer = Math.min(viewH - 75, viewH * 0.70);
  const step = count > 1 ? (maxLayer - minLayer) / (count - 1) : 0;

  // 隨機分佈海中泳層深度，但每條魚的 A/B/C/D 字母徽章與底部選項完全鎖定對齊
  const layerIndices = shuffleArray([...Array(count).keys()]);
  const letters = ["A", "B", "C", "D"];

  for (let i = 0; i < count; i++) {
    const layerIdx = layerIndices[i];
    const yPos = minLayer + layerIdx * step + (Math.random() * 10 - 5);
    const dir = (i % 2 === 0) ? 1 : -1;
    const startX = (dir === 1) ? -40 - (i * 60) : viewW + 40 + (i * 60);

    oceanFishes.push({
      id: i,
      optIndex: i,
      letter: letters[i],
      text: rawOptions[i],
      isCorrect: (i === correctIdx),
      x: startX,
      y: yPos,
      radius: 34,
      dir: dir,
      speed: 1.1 + Math.random() * 0.35,
      color: getFishColor(i),
      fishType: ["🐠", "🐟", "🐡", "🐙"][i % 4]
    });
  }
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

    // 觸碰邊界：空手收回 (允許延伸至接近畫布底端)
    if (tipX < 0 || tipX > viewW || tipY > viewH - 10) {
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
  const cardElem = document.getElementById(`optCard${fish.optIndex}`);

  if (fish.isCorrect) {
    // 🎯 抓中正確答案！
    if (cardElem) {
      cardElem.classList.add("correct-flash");
      setTimeout(() => cardElem.classList.remove("correct-flash"), 1800);
    }
    playCatchFishSound();
        // 🎯 統一課堂分制 (100 ~ 300 分區間)：每題 15 分 + 連擊 +3 分 (10 題通關約 180~250 分)
    const gain = 15 + Math.min(15, streak * 3);
    score += gain;
    streak++;
    answeredCount++;
    if (streak > maxStreak) maxStreak = streak;

    streakBadge.classList.remove("hidden");
    streakBadge.textContent = `🔥 連對 x${streak}`;
    scoreDisplay.textContent = score;
    syncMissionProgress();
    showCatchFeedback(answeredCount >= targetQCount ? "研究任務完成！" : "捕撈成功 · +" + gain, "success");

    if (answeredCount >= targetQCount) {
      setTimeout(() => {
        endFishingSession();
      }, 500);
      return;
    }

    // 短暫慶祝後自動換下一題
    setTimeout(() => {
      presentNextQuestion();
    }, 450);

  } else {
    // ❌ 抓錯魚處理（3次機會防盲猜機制）
    questionAttempts++;
    if (cardElem) {
      cardElem.classList.add("wrong-flash");
      setTimeout(() => cardElem.classList.remove("wrong-flash"), 2500);
    }
    playFishEscapeSound();
    streak = 0;
    streakBadge.classList.add("hidden");

    // 取得本題正確解答資訊
    let correctLetter = "A";
    let correctText = "";
    const rawOptions = currentQuestion.options || [];
    if (typeof currentQuestion.answer === "number" && rawOptions[currentQuestion.answer]) {
      correctLetter = ["A", "B", "C", "D"][currentQuestion.answer] || "A";
      correctText = rawOptions[currentQuestion.answer];
    } else if (typeof currentQuestion.answer === "string") {
      const u = currentQuestion.answer.trim().toUpperCase();
      const idx = ["A", "B", "C", "D"].indexOf(u);
      if (idx >= 0 && rawOptions[idx]) {
        correctLetter = u;
        correctText = rawOptions[idx];
      } else {
        const foundIdx = rawOptions.findIndex(o => o && o.trim() === currentQuestion.answer.trim());
        if (foundIdx >= 0) {
          correctLetter = ["A", "B", "C", "D"][foundIdx];
          correctText = rawOptions[foundIdx];
        }
      }
    }

    if (questionAttempts >= 3) {
      // 🚫 第 3 次抓錯：直接判定本題未通過，結束盲猜並強制前進
      isQuestionFailed = true;
      showCatchFeedback("本題嘗試上限 · 自動前進下一題", "retry");
      if (noteBadge) noteBadge.textContent = "❌ 3次機會已用盡！本題判定未通過";
      if (noteTitle) noteTitle.textContent = `正確答案為 (${correctLetter})「${correctText}」`;
      noteContent.textContent = `您剛才抓到的是選項 (${fish.letter})「${fish.text}」。\n\n💡 觀念解析：\n${currentQuestion.explanation || "請仔細記住此題概念，進入下一題挑戰！"}`;
      if (btnCloseNote) btnCloseNote.textContent = "已吸收觀念，前進下一題 ⏩";
      noteModal.classList.remove("hidden");
    } else {
      // ⚠️ 第 1、2 次抓錯：彈出筆記提示，吸收觀念後再嘗試海中剩餘選項
      showCatchFeedback(`抓錯提示 (剩 ${3 - questionAttempts} 次機會)`, "retry");
      if (noteBadge) noteBadge.textContent = `⚠️ 抓錯提示 (剩 ${3 - questionAttempts} 次機會)`;
      if (noteTitle) noteTitle.textContent = "這不是正確答案，先吸收觀念：";
      noteContent.textContent = `您剛才抓到的是選項 (${fish.letter})「${fish.text}」。\n\n💡 觀念解析：\n${currentQuestion.explanation || "觀念不符，請先吸收解析後再鎖定海中正確的字母大魚！"}`;
      if (btnCloseNote) btnCloseNote.textContent = "我吸收了，繼續鎖定剩下的魚 🎯";
      noteModal.classList.remove("hidden");
    }
  }
}

function handleCloseNoteModal() {
  noteModal.classList.add("hidden");
  if (isQuestionFailed) {
    // 達到 3 次上限，直接推進下一題，徹底杜絕空抓與死角卡關！
    isQuestionFailed = false;
    presentNextQuestion();
    return;
  }
  // 🌟 正常未滿 3 次：檢查海域中是否仍有正確答案魚，若無魚或正解被意外抓光，自動補滿選項避免卡死
  const hasCorrectFish = oceanFishes.some(f => f.isCorrect);
  if (oceanFishes.length === 0 || !hasCorrectFish) {
    spawnOceanFishesForCurrentQuestion();
  }
  // 啟動防盲猜過熱冷卻 2.5 秒
  triggerCooldownPenalty(2.5);
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
  // Lightweight sonar chart, light shafts and seabed; decorative only.
  ctx.save();
  ctx.fillStyle = "rgba(179, 244, 233, 0.035)";
  for (let i = 0; i < 3; i++) {
    const x = viewW * (0.18 + i * 0.32);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 45, 0);
    ctx.lineTo(x + 130, viewH); ctx.lineTo(x - 60, viewH); ctx.fill();
  }
  ctx.strokeStyle = "rgba(180, 234, 230, 0.09)"; ctx.lineWidth = 1;
  for (let y = 75; y < viewH - 35; y += 70) {
    ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(viewW - 20, y); ctx.stroke();
    ctx.fillStyle = "rgba(205, 238, 233, 0.5)"; ctx.font = "9px monospace";
    ctx.fillText(String(Math.round(y / viewH * 150)).padStart(3,"0") + " M", 25, y - 6);
  }
  ctx.strokeStyle = "rgba(173, 231, 220, 0.14)";
  for (let i = 0; i < 15; i++) {
    const x = (i * 83 + 37) % viewW, y = (i * 137 + 110) % Math.max(1, viewH - 40);
    ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = "rgba(3, 29, 44, 0.45)";
  ctx.beginPath(); ctx.moveTo(0, viewH);
  ctx.lineTo(0, viewH - 28); ctx.quadraticCurveTo(viewW * .25, viewH - 60, viewW * .5, viewH - 22);
  ctx.quadraticCurveTo(viewW * .8, viewH - 45, viewW, viewH - 30); ctx.lineTo(viewW, viewH); ctx.fill();
  ctx.restore();
}

function drawFish(f) {
  ctx.save();
  ctx.translate(f.x, f.y);

  // 1. 魚身外發光
  ctx.shadowColor = f.color;
  ctx.shadowBlur = 10;

  // 2. 魚身發光圓底
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 3. 魚圖示 (微移偏上)
  ctx.font = "22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(f.fishType, 0, -9);

  // 4. 超醒目 A/B/C/D 字母徽章 (白底金邊黑字，高對比大字體，學生一目了然)
  const letter = f.letter || ["A", "B", "C", "D"][f.id % 4];

  ctx.fillStyle = "#ffffff";
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(-16, 5, 32, 20, 6);
    ctx.fill();
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillRect(-16, 5, 32, 20);
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, 5, 32, 20);
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 14px sans-serif";
  ctx.fillText(letter, 0, 16);

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
  const urlParams = new URLSearchParams(window.location.search);
  targetQCount = parseInt(urlParams.get("qcount") || urlParams.get("count")) || 10;
  if (urlParams.get("mode")) playMode = urlParams.get("mode");
  const isTimerOff = urlParams.get("timer") === "off";

  answeredCount = 0;
  questionAttempts = 0;
  isQuestionFailed = false;
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

  // 🎣 完整重設機械吊爪物理狀態與捕獲物，防止舊魚殘留或錯誤計分
  claw.state = "swinging";
  claw.length = 30;
  claw.caughtItem = null;
  claw.originX = viewW / 2;
  claw.originY = 16;

  clearInterval(timerInterval);
  clearInterval(cooldownTimer);
  if (isTimerOff) {
    timerDisplay.textContent = "特教無壓力";
  } else {
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
    const s = (remainingSeconds % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${m}:${s}`;
    startTimer();
  }
  presentNextQuestion();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isPaused) return;
    remainingSeconds--;
    const m = Math.max(0, Math.floor(remainingSeconds / 60)).toString().padStart(2, "0");
    const s = Math.max(0, remainingSeconds % 60).toString().padStart(2, "0");
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
  clearInterval(timerInterval);

  const urlParams = new URLSearchParams(window.location.search);
  const isDispatchMode = urlParams.has("unit") || urlParams.has("mode") || urlParams.has("qcount") || urlParams.has("dispatch");

  if (isDispatchMode && typeof showScoreSubmitModal === 'function') {
    const elapsedSec = Math.max(0, (gameMinutes * 60) - remainingSeconds);
    const elapsedM = Math.floor(elapsedSec / 60);
    const elapsedS = elapsedSec % 60;
    const durationStr = `${elapsedM} 分 ${elapsedS} 秒`;

    showScoreSubmitModal({
      gameTitle: '生物大釣手：黃金深海大捕撈',
      score: score,
      scoreDisplay: `${score} 分 (共答對 ${answeredCount} 題)`,
      duration: durationStr,
      onBonusChallenge: () => {
        // 🔥 挑戰加碼 10 題：重置題數、物理吊爪狀態與加碼時間，再抓 10 題！
        answeredCount = 0;
        targetQCount = 10;
        isOver = false;
        isPaused = false;
        isCoolingDown = false;
        isFreezingRead = false;
        cooldownOverlay.classList.add("hidden");
        claw.state = "swinging";
        claw.length = 30;
        claw.caughtItem = null;
        claw.originX = viewW / 2;
        claw.originY = 16;

        // ⚡ 關鍵修復：重新給予充裕的加碼挑戰時間 (依 gameMinutes 預設 5 分鐘)，避免 remainingSeconds <= 0 導致 1 秒內又強制跳回結算視窗！
        remainingSeconds = (gameMinutes || 5) * 60;
        clearInterval(timerInterval);
        clearInterval(cooldownTimer);

        const urlParams = new URLSearchParams(window.location.search);
        const isTimerOff = urlParams.get("timer") === "off";
        if (isTimerOff) {
          timerDisplay.textContent = "特教無壓力";
        } else {
          const m = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
          const s = (remainingSeconds % 60).toString().padStart(2, "0");
          timerDisplay.textContent = `${m}:${s}`;
          startTimer();
        }

        idModal.classList.add("hidden");
        certModal.classList.add("hidden");
        pauseModal.classList.add("hidden");

        prepareQuestionPool().then(() => {
          presentNextQuestion();
        });
      },
      onSuccess: (payload) => {
        idModal.classList.remove("hidden");
      },
      onClose: () => {
        idModal.classList.remove("hidden");
      }
    });
  } else {
    // 老師自由測試模式，直接打開憑證視窗
    idModal.classList.remove("hidden");
  }
}

function handleGenerateCert() {
  const st = (window.BioGameSuite && window.BioGameSuite.getStudent) ? window.BioGameSuite.getStudent() : {};
  const cVal = st.class || classInput.value.trim() || "701";
  const sVal = st.name ? `${st.seat} 號 ${st.name}` : (seatInput.value.trim() || "01 號");
  idModal.classList.add("hidden");

  certHeroText.textContent = `${cVal} 班 ${sVal}`;
  certVerifyCode.textContent = `FISH-${Math.floor(1000 + Math.random() * 9000)}`;
  certScoreText.textContent = `${score} 分`;
  certStreakText.textContent = `${maxStreak} 題 Combo`;

  const now = new Date();
  certTimeText.textContent = `認證時間：${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  certModal.classList.remove("hidden");
}
function triggerFishingGasSubmit() {
  if (typeof showScoreSubmitModal === "function") {
    showScoreSubmitModal({
      gameTitle: "生物大釣手：海洋生態捕撈",
      score: score,
      scoreDisplay: score + " 分",
      duration: "捕撈結算",
      gameId: "fishing",
      initialClass: ((window.BioGameSuite && window.BioGameSuite.getStudent) ? window.BioGameSuite.getStudent().class : "") || classInput?.value?.trim() || "701",
      initialSeat: ((window.BioGameSuite && window.BioGameSuite.getStudent) ? window.BioGameSuite.getStudent().seat : "") || seatInput?.value?.trim() || "01",
      initialName: ((window.BioGameSuite && window.BioGameSuite.getStudent) ? window.BioGameSuite.getStudent().name : "") || "生態大釣手"
    });
  }
}

window.startGame = function() {
  if (!isGameReady) {
    pendingStartGame = true;
    return;
  }
  isPaused = false;
  const isTimerOff = new URLSearchParams(window.location.search).get("timer") === "off";
  if (!isTimerOff) startTimer();
};


// Local presentation helpers. Never select questions, award points or submit data.
let fishingFeedbackTimer;
let lastLaunchLabel = "";
function syncMissionProgress() {
  const label = document.getElementById("missionProgress");
  const fill = document.getElementById("missionFill");
  const track = document.getElementById("missionTrack");
  if (!label || !fill || !track) return;
  const completed = Math.min(answeredCount, targetQCount);
  label.textContent = "已完成 " + completed + " / " + targetQCount;
  fill.style.width = Math.min(100, completed / Math.max(1, targetQCount) * 100) + "%";
  track.setAttribute("aria-valuenow", completed);
  track.setAttribute("aria-valuemax", targetQCount);
}
function showCatchFeedback(message, kind) {
  const feedback = document.getElementById("catchFeedback");
  if (!feedback) return;
  clearTimeout(fishingFeedbackTimer);
  feedback.textContent = message;
  feedback.dataset.kind = kind;
  feedback.classList.add("visible");
  fishingFeedbackTimer = setTimeout(() => feedback.classList.remove("visible"), 1600);
}
function syncLaunchStatus() {
  const label = document.getElementById("launchStatus");
  if (!label) return;
  const text = isOver ? "本次捕撈結束" : isPaused ? "準備出海 · 等待開始" : isCoolingDown ? "絞盤冷卻中 · 稍後再出爪" : isFreezingRead ? "先讀題與選項 · 聲納定位中" : claw.state === "extending" ? "機械爪出擊中" : claw.state === "retracting" ? (claw.caughtItem ? "已捕獲 · 收爪確認中" : "收爪中 · 準備再次瞄準") : "瞄準字母魚群 · 輕觸海域出爪";
  if (text !== lastLaunchLabel) {
    label.textContent = text; lastLaunchLabel = text;
    document.querySelector(".fishing-app").dataset.claw = claw.state;
  }
}
function initFishingPresentation() {
  document.querySelectorAll(".opt-card").forEach(card => {
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.code === "Space") { e.preventDefault(); card.click(); }
    });
  });
  touchLaunchZone.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.code === "Space" || e.key === "ArrowDown") {
      e.preventDefault(); initAudio(); triggerClawLaunch();
    }
  });
}
