/**
 * 動物方城市生物大富翁 (Zootopia Bio Monopoly) - 專業教學強固版引擎 V3.8
 * 1. 嚴格鎖死答錯蓋房漏洞：答錯 100% 隱藏蓋房按鈕，只顯示「❌ 答錯扣分關閉」，絕無法進入蓋房流程。
 * 2. 跨裝置響應式 10x8 網格防裁切：電腦與 iPad 橫向模式下，最底部 8 列與動物 Token 100% 完整呈現在畫面上！
 * 3. 徹底修復「🔍 放大題目」按鈕：全域動態連動，點擊後題目與選項字體強制放大 150%！
 * 4. 8 大 Zootopia 大臉 Token + 領地頭像標籤 + 中央計分板【得分 + 🏠 房屋棟數】雙指標。
 */

// 8 大 Zootopia 競賽隊伍 / 角色設定
const ALL_TEAMS = [
  { id: 0, name: "茱蒂兔兔隊", icon: "🐰", color: "#38bdf8" },
  { id: 1, name: "尼克狐狸隊", icon: "🦊", color: "#f97316" },
  { id: 2, name: "快快樹懶隊", icon: "🦥", color: "#eab308" },
  { id: 3, name: "蠻牛局長隊", icon: "🦬", color: "#38bdf8" },
  { id: 4, name: "獅丁市長隊", icon: "🦁", color: "#ef4444" },
  { id: 5, name: "洪金豹警官隊", icon: "🐆", color: "#f59e0b" },
  { id: 6, name: "狼群警衛隊", icon: "🐺", color: "#94a3b8" },
  { id: 7, name: "羊駝探險隊", icon: "🦙", color: "#c084fc" }
];

// 12+ 閃亮機會卡 (生態良好獎勵)
const CHANCE_CARDS = [
  "✨ 【有利突變】個體基因優化！下一題答對直接加 20 分並免費蓋房！",
  "🤝 【互利共生】選擇一支隊伍共同得分，雙方各得 15 分！",
  "⚡ 【酵素催化】光合作用加速！獲得【免答開工證】直接建立領地！",
  "🏃 【天擇優勢】高度適應環境，向前飛躍 3 格！",
  "🛡️ 【群體防禦】獲得【生物免疫護盾】一次，抵擋下次處罰！",
  "☀️ 【光合作用】吸收太陽能精華，全隊積分 +20 分！",
  "⚖️ 【生態平衡】受大自然守護，與領先隊伍平分領地資源！",
  "🧬 【基因重組】獲得一次自由指定生物題目單元的權利！",
  "🌳 【物種繁衍】領地生態大擴張，全隊積分 +15 分！",
  "🔋 【細胞分裂】獲得【雙倍得分卡】一張，下次答對得分翻倍！",
  "🕊️ 【生態系穩定】獲得大自然賜福，免費獲得額外擲骰一次！",
  "🏞️ 【保護區設立】成立國家自然保護區，直接免費建立頂級地標！"
];

// 12+ 驚奇命運卡 (生態趣味考驗)
const DESTINY_CARDS = [
  "❄️ 【極端氣候】遭遇突發暴風雪侵襲，全隊暫停一輪！",
  "🐚 【外來種入侵】遭遇福壽螺入侵，領地維護費扣除 10 分！",
  "🌵 【氣候乾旱】水源短缺！請全隊向全班大聲朗讀課本重點段落！",
  "🗣️ 【天擇考驗】限制下一題答題手只能用三個字以內回答！",
  "🪓 【棲地破壞】過度砍伐林地，全隊退後 2 格！",
  "🌧️ 【酸雨打擊】植被受損，本輪無法建立任何生態領地！",
  "🌡️ 【溫室效應】全球暖化加速，需完成高難度生物加分題！",
  "🌊 【優養化打擊】池塘水質缺氧，扣除分數 15 分！",
  "🧬 【基因突變考驗】由敵隊挑選下一題的答題組員！",
  "🦠 【病原體蔓延】全隊進入防護隔離狀態，停留原格一輪！",
  "🐺 【生態失衡】狼群遷徙，全隊與最後一名隊伍互換位置！",
  "🗑️ 【廢棄物污染】遭遇微塑膠污染，請全隊大聲喊出生物保護宣言！"
];

// 10+ 課堂新奇互動任務
const NOVELTY_TASKS = [
  "👏 與隔壁隊伍擊掌齊喊：我們是生物大富翁霸主！",
  "💨 做一次光合作用深深吸氣與吐氣動作！",
  "🔬 用肢體動作模仿顯微鏡觀察細胞的樣子！",
  "🗣️ 全隊齊聲念出：自然科學是世界第一有趣！",
  "🦖 擺出霸王龍咆哮的姿勢給老師與全班看！",
  "🫡 向老師敬禮並說出今天學到的生物名詞！",
  "🤝 與隊友擊掌三次並喊：合作無間，必拿第一！",
  "🌿 表演植物向光性彎曲的肢體動作！",
  "❤️ 全隊做一次心臟幫浦血液循環的手勢！",
  "🏆 大聲說出：我們隊伍今天一定能獲得最高分！"
];

// 20+ 動物城與生物生態建築推薦清單
const RECOMMEND_BUILDINGS = [
  "🚓 動物城警局總部", "🌳 雨林巨木樹屋", "❄️ 冰川鎮雪景別墅", "🌵 撒哈拉度假村", 
  "🏰 薩瓦納中心城堡", "⚡ 葉綠體綠能發電廠", "🧪 酵素發酵工坊", "🔬 微鏡光學觀測站", 
  "🏞️ 生態金字塔高樓", "🌊 深海生物觀測站", "🧬 基因重組研究中心", "🌿 苔蘚保濕生態園", 
  "🦅 猛禽飛行觀察塔", "🐝 蜜蜂授粉花園", "🪸 珊瑚礁保育基地", "🌲 森林炭吸存林場", 
  "🐊 沼澤濕地保護區", "🏔️ 高山凍原實驗室", "🌱 地底根系觀測站", "⚡ 胞器能量發電廠"
];

const HIGHLIGHT_KEYWORDS = ["不屬於", "錯誤的是", "錯誤", "缺乏", "最小", "最大", "不包含", "最不可能", "無法"];

// 全域遊戲狀態
let gameMode = "group"; // "group" | "solo"
let activeTeamCount = 4;
let teams = [];
let currentTurnIndex = 0;
let currentTileIndex = 0;
let isDrawing = false;
let soundEnabled = true;
let timerEnabled = true;
let isTeacherFrozen = false;
let isTextZoomed = false;

let allManifestUnits = [];
let rawQuestionsByUnit = {};
let questionPoolByUnit = {};
let currentActiveQuestion = null;
let currentPendingBuildCellId = null;
let usedBuildingNames = new Set();
let gameHistory = [];
let countdownTimer = null;
let cellCoordinates = [];
let audioCtx = null;

// DOM 元素引用
const board = document.getElementById("board");
const modeTag = document.getElementById("modeTag");
const currentTurnIcon = document.getElementById("currentTurnIcon");
const currentTurnName = document.getElementById("currentTurnName");
const selectUnit = document.getElementById("selectUnit");
const teamScoreBar = document.getElementById("teamScoreBar");
const btnRollDice = document.getElementById("btnRollDice");
const btnQuickRoll = document.getElementById("btnQuickRoll");
const btnShuffle = document.getElementById("btnShuffle");
const diceResultBanner = document.getElementById("diceResultBanner");

const btnZoomText = document.getElementById("btnZoomText");
const btnRules = document.getElementById("btnRules");
const btnFreeze = document.getElementById("btnFreeze");
const btnSound = document.getElementById("btnSound");
const btnTimer = document.getElementById("btnTimer");
const btnHistory = document.getElementById("btnHistory");
const btnSettings = document.getElementById("btnSettings");

// Modals
const rulesModal = document.getElementById("rulesModal");
const btnCloseRules = document.getElementById("btnCloseRules");

const quizModal = document.getElementById("quizModal");
const quizBox = document.getElementById("quizBox");
const quizUnitBadge = document.getElementById("quizUnitBadge");
const poolLeftBadge = document.getElementById("poolLeftBadge");
const quizTimerBanner = document.getElementById("quizTimerBanner");
const quizStem = document.getElementById("quizStem");
const quizOptions = document.getElementById("quizOptions");
const quizExplanation = document.getElementById("quizExplanation");
const explanationText = document.getElementById("explanationText");
const btnConfirmAnswer = document.getElementById("btnConfirmAnswer");
const btnCloseWrong = document.getElementById("btnCloseWrong");

const chanceModal = document.getElementById("chanceModal");
const chanceDesc = document.getElementById("chanceDesc");
const btnCloseChance = document.getElementById("btnCloseChance");

const destinyModal = document.getElementById("destinyModal");
const destinyDesc = document.getElementById("destinyDesc");
const btnCloseDestiny = document.getElementById("btnCloseDestiny");

const noveltyModal = document.getElementById("noveltyModal");
const noveltyTask = document.getElementById("noveltyTask");
const btnCloseNovelty = document.getElementById("btnCloseNovelty");

const buildModal = document.getElementById("buildModal");
const buildTeamIcon = document.getElementById("buildTeamIcon");
const buildModalTitle = document.getElementById("buildModalTitle");
const recommendBuildList = document.getElementById("recommendBuildList");
const inputBuildName = document.getElementById("inputBuildName");
const btnConfirmBuild = document.getElementById("btnConfirmBuild");

const settingsModal = document.getElementById("settingsModal");
const selectGameMode = document.getElementById("selectGameMode");
const selectTeamCount = document.getElementById("selectTeamCount");
const fileInput = document.getElementById("fileInput");
const inputStudents = document.getElementById("inputStudents");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const btnSaveSettings = document.getElementById("btnSaveSettings");

const historyModal = document.getElementById("historyModal");
const historyTable = document.getElementById("historyTable");
const btnExportCSV = document.getElementById("btnExportCSV");
const btnCloseHistory = document.getElementById("btnCloseHistory");

const teacherFreezeModal = document.getElementById("teacherFreezeModal");
const btnUnfreeze = document.getElementById("btnUnfreeze");
const snapshotModal = document.getElementById("snapshotModal");
const btnRestoreSnapshot = document.getElementById("btnRestoreSnapshot");
const btnDiscardSnapshot = document.getElementById("btnDiscardSnapshot");

// 頁面初始化
window.addEventListener("DOMContentLoaded", async () => {
  initEventListeners();
  await loadManifestAndUnits();
  initTeamsAndBoard();
  checkSnapshotOnLoad();
});

// 1. 初始化事件監聽
function initEventListeners() {
  document.addEventListener("click", unlockAudioContext, { once: true });
  document.addEventListener("touchstart", unlockAudioContext, { once: true });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      toggleTeacherFreeze();
    }
  });

  window.addEventListener("resize", () => {
    setTimeout(updateCoordinates, 150);
  });

  btnRollDice.addEventListener("click", () => startDraw(false));
  btnQuickRoll.addEventListener("click", () => startDraw(true));
  btnShuffle.addEventListener("click", shuffleTeams);

  // 全域連動「放大題目」按鈕
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
  btnTimer.addEventListener("click", toggleTimer);
  btnHistory.addEventListener("click", openHistory);
  btnSettings.addEventListener("click", openSettings);

  btnCloseSettings.addEventListener("click", () => closeModal(settingsModal));
  btnSaveSettings.addEventListener("click", saveSettings);
  fileInput.addEventListener("change", handleFileUpload);

  btnCloseChance.addEventListener("click", () => { closeModal(chanceModal); endTurn(); });
  btnCloseDestiny.addEventListener("click", () => { closeModal(destinyModal); endTurn(); });
  btnCloseNovelty.addEventListener("click", () => { closeModal(noveltyModal); triggerQuizEvent(); });

  btnConfirmAnswer.addEventListener("click", () => {
    closeModal(quizModal);
    openBuildModal();
  });

  btnCloseWrong.addEventListener("click", () => {
    closeModal(quizModal);
    endTurn();
  });

  btnConfirmBuild.addEventListener("click", confirmBuildHouse);

  btnCloseHistory.addEventListener("click", () => closeModal(historyModal));
  btnExportCSV.addEventListener("click", exportHistoryCSV);

  btnRestoreSnapshot.addEventListener("click", restoreSnapshot);
  btnDiscardSnapshot.addEventListener("click", () => {
    closeModal(snapshotModal);
    localStorage.removeItem("monopoly_snapshot_v3.8");
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

function playTickSound() { playTone(600, "sine", 0.08, 0, 0.1); }
function playWinSound() { [440, 554, 659, 880].forEach((f, i) => playTone(f, "triangle", 0.12, i * 0.08, 0.12)); }
function playWrongSound() { playTone(220, "sawtooth", 0.12, 0, 0.15); playTone(180, "sawtooth", 0.2, 0.1, 0.15); }
function playFanfare() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => playTone(f, "square", 0.12, i * 0.1, 0.15)); }

function toggleSound() {
  soundEnabled = !soundEnabled;
  btnSound.textContent = soundEnabled ? "🔊" : "🔇";
}

function toggleTimer() {
  timerEnabled = !timerEnabled;
  btnTimer.textContent = timerEnabled ? "⏱️" : "⏳";
}

// 3. 載入題庫與 manifest.json
async function loadManifestAndUnits() {
  try {
    const res = await fetch("../questions/manifest.json");
    if (!res.ok) throw new Error("Manifest 載入失敗");
    const manifest = await res.json();
    allManifestUnits = manifest.units || [];

    selectUnit.innerHTML = "";
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
    console.warn("大富翁題庫載入警告:", err);
  }
}

// 100% 不重複 Fisher-Yates 題庫洗牌佇列
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

let cellOwners = {};
let isTakeoverMode = false;
let isNoBuildMoveTurn = false;

// 4. 初始化競賽隊伍與 10x8 棋盤 (共 28 格)
function initTeamsAndBoard() {
  teams = ALL_TEAMS.slice(0, activeTeamCount).map(t => ({
    ...t,
    score: 300, // 每隊初始給予 300 金幣
    pos: 0,
    buildingsCount: 0
  }));

  currentTurnIndex = 0;
  currentTileIndex = 0;
  usedBuildingNames = new Set();
  cellOwners = {};

  modeTag.textContent = gameMode === "group" ? `👥 小組競賽 (${activeTeamCount} 隊)` : `👤 個人抽籤模式`;
  renderScoreBar();
  generateBoardGrid();
}

// 計分板雙指標：顯示金幣/得分與 🏠 房屋棟數
function renderScoreBar() {
  teamScoreBar.innerHTML = "";
  teams.forEach((t, idx) => {
    const card = document.createElement("div");
    card.className = `score-card ${idx === currentTurnIndex ? "active-turn" : ""}`;
    card.style.borderColor = t.color;
    card.innerHTML = `
      <span>${t.icon} ${t.name}</span>
      <span style="color:#e67e22;">💰 <b>${t.score}</b> 金幣</span>
      <span class="b-count">🏠 ${t.buildingsCount} 棟</span>
    `;
    teamScoreBar.appendChild(card);
  });

  const curTeam = teams[currentTurnIndex];
  if (curTeam) {
    currentTurnIcon.textContent = curTeam.icon;
    currentTurnName.textContent = `${curTeam.name} 回合`;
    currentTurnName.style.color = curTeam.color;
  }
}

// 生成 10x8 棋盤格 (28 個邊界格子)
function generateBoardGrid() {
  document.querySelectorAll(".cell").forEach(e => e.remove());

  const coords = [];
  for (let i = 1; i <= 10; i++) coords.push({ c: i, r: 1 });
  for (let i = 2; i <= 7; i++) coords.push({ c: 10, r: i });
  for (let i = 10; i >= 1; i--) coords.push({ c: i, r: 8 });
  for (let i = 7; i >= 2; i--) coords.push({ c: 1, r: i });

  coords.forEach((pos, idx) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.id = `cell-${idx}`;
    cell.style.gridColumn = pos.c;
    cell.style.gridRow = pos.r;

    let type = "question", icon = "🌱", title = `生態領地 ${idx + 1}`;
    if (idx === 0) {
      type = "start"; icon = "🚩"; title = "Zootopia 總站"; cell.classList.add("corner", "chance");
    } else if (idx === 14) {
      type = "chance"; icon = "✨"; title = "閃亮機會"; cell.classList.add("corner", "chance");
    } else if ([7, 21].includes(idx)) {
      type = "destiny"; icon = "💢"; title = "驚奇命運"; cell.classList.add("corner", "destiny");
    } else {
      cell.style.backgroundColor = ["#fef9c3", "#e0f2fe", "#fce7f3", "#dcfce7", "#fef3c7"][idx % 5];
    }

    cell.innerHTML = `
      <div class="cell-icon">${icon}</div>
      <div class="cell-text">${title}</div>
      <div class="building-area" id="build-${idx}"></div>
      <div class="cell-highlight" id="box-${idx}"></div>
    `;
    board.appendChild(cell);
  });

  for (let i = 0; i < 8; i++) {
    const tok = document.getElementById(`token-${i}`);
    if (tok) tok.style.display = i < activeTeamCount ? "flex" : "none";
  }

  setTimeout(updateCoordinates, 250);
}

function updateCoordinates() {
  cellCoordinates = [];
  const bRect = board.getBoundingClientRect();

  for (let idx = 0; idx < 28; idx++) {
    const cell = document.getElementById(`cell-${idx}`);
    if (cell) {
      const r = cell.getBoundingClientRect();
      const cx = r.left - bRect.left + r.width / 2;
      const cy = Math.min(bRect.height - 24, Math.max(24, r.top - bRect.top + r.height / 2));
      cellCoordinates.push({ x: cx, y: cy });
    }
  }

  teams.forEach((t, idx) => {
    const tok = document.getElementById(`token-${t.id}`);
    if (tok && cellCoordinates[t.pos]) {
      const coord = cellCoordinates[t.pos];
      const offsetX = (idx % 3 - 1) * 8;
      const offsetY = (Math.floor(idx / 3) - 1) * 8;
      tok.style.left = `${coord.x + offsetX}px`;
      tok.style.top = `${coord.y + offsetY}px`;
    }
  });
}

// 5. 3D 旋轉擲骰子與跳躍移動
function startDraw(isQuick = false) {
  if (isDrawing || isTeacherFrozen) return;
  unlockAudioContext();
  isDrawing = true;
  isNoBuildMoveTurn = false;

  const dice3DModal = document.getElementById("dice3DModal");
  const diceCube = document.getElementById("diceCube");
  const diceFaceValue = document.getElementById("diceFaceValue");
  const diceRollText = document.getElementById("diceRollText");

  const diceVal = Math.floor(Math.random() * 6) + 1;
  const curTeam = teams[currentTurnIndex];

  if (dice3DModal && diceCube) {
    diceRollText.textContent = `🎲 正在為【${curTeam.name}】投擲狂歡骰子！`;
    diceFaceValue.textContent = "🎲";
    openModal(dice3DModal);
    playTone(450, "sine", 0.05, 0, 0.1);

    setTimeout(() => {
      diceFaceValue.textContent = diceVal;
      playWinSound();
      setTimeout(() => {
        closeModal(dice3DModal);
        diceResultBanner.textContent = `🎲 ${curTeam.name} 擲出了 ${diceVal} 點！前進 ${diceVal} 格！`;
        startJumping(diceVal, isQuick);
      }, 500);
    }, 600);
  } else {
    diceResultBanner.textContent = `🎲 ${curTeam.name} 擲出了 ${diceVal} 點！前進 ${diceVal} 格！`;
    startJumping(diceVal, isQuick);
  }
}

function startJumping(steps, isQuick, isNoBuildMove = false) {
  let speed = isQuick ? 70 : 110;
  const curTeam = teams[currentTurnIndex];
  const tok = document.getElementById(`token-${curTeam.id}`);
  if (isNoBuildMove) isNoBuildMoveTurn = true;

  const stepRun = () => {
    document.getElementById(`box-${curTeam.pos}`).style.display = "none";
    curTeam.pos = (curTeam.pos + 1) % 28;
    document.getElementById(`box-${curTeam.pos}`).style.display = "block";

    playTickSound();

    // 🚩 經過或到達 0 號起點站，給予 +200 金幣獎勵！
    if (curTeam.pos === 0) {
      curTeam.score += 200;
      playFanfare();
      addHistoryLog(curTeam.name, `🚩 經過/到達 Zootopia 總站起點！發放【+200 金幣】獎勵！`);
      renderScoreBar();
    }

    if (cellCoordinates[curTeam.pos]) {
      const coord = cellCoordinates[curTeam.pos];
      const offsetX = (currentTurnIndex % 3 - 1) * 8;
      const offsetY = (Math.floor(currentTurnIndex / 3) - 1) * 8;
      tok.style.left = `${coord.x + offsetX}px`;
      tok.style.top = `${coord.y + offsetY}px`;

      tok.classList.remove("is-hopping");
      void tok.offsetWidth;
      tok.classList.add("is-hopping");
    }

    steps--;
    if (steps > 0) {
      if (steps < 6 && !isQuick) speed += 40;
      setTimeout(stepRun, speed);
    } else {
      setTimeout(() => {
        if (isNoBuildMoveTurn) {
          alert(`⚡ 機會/命運卡免答題位移！到站平安，本輪僅純粹位移，禁止建立或強佔領地！`);
          endTurn();
        } else {
          handleTileLanding();
        }
      }, 450);
    }
  };
  stepRun();
}

// 6. 踩格觸發事件與彈窗
function handleTileLanding() {
  const curTeam = teams[currentTurnIndex];
  const pos = curTeam.pos;

  if (pos === 14) {
    playWinSound();
    const cardText = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
    chanceDesc.textContent = cardText;
    curTeam.score += 20;
    addHistoryLog(curTeam.name, `✨ 踩中【閃亮機會】：${cardText}`);
    openModal(chanceModal);

  } else if ([7, 21].includes(pos)) {
    playWrongSound();
    const cardText = DESTINY_CARDS[Math.floor(Math.random() * DESTINY_CARDS.length)];
    destinyDesc.textContent = cardText;
    addHistoryLog(curTeam.name, `💢 踩中【驚奇命運】：${cardText}`);
    openModal(destinyModal);

  } else {
    // 檢查格子是否有業主
    const owner = cellOwners[pos];
    if (owner && owner.teamId !== curTeam.id) {
      // 踩到敵方領地，詢問是否支付 1.5 倍買斷費 (150 金幣) 強行佔領
      if (curTeam.score >= 150) {
        const confirmTakeover = confirm(
          `⚠️ 此處已被【${owner.teamName}】佔領！(領地原價值 100 金幣)\n\n` +
          `貴隊【${curTeam.name}】目前擁有 ${curTeam.score} 金幣，是否支付 1.5 倍溢價金幣 (150 金幣) 並挑戰生物題目進行強行佔領？`
        );
        if (confirmTakeover) {
          triggerQuizEvent(true);
        } else {
          addHistoryLog(curTeam.name, `🏳️ 踩中敵方【${owner.teamName}】領地，選擇放棄強佔。`);
          endTurn();
        }
      } else {
        alert(`⚠️ 此處為【${owner.teamName}】的領地！貴隊金幣不足 150 金幣，無法發動 1.5 倍強行佔領！`);
        endTurn();
      }
    } else {
      triggerQuizEvent(false);
    }
  }
}

// 7. 觸發生物題目問答 (isTakeover: 是否為強行佔領模式)
function triggerQuizEvent(isTakeover = false) {
  isTakeoverMode = isTakeover;
  const unitFile = selectUnit.value || "unit01_scientific_method.json";
  const unitObj = allManifestUnits.find(u => u.file === unitFile);
  quizUnitBadge.textContent = unitObj ? `${unitObj.id.toUpperCase()} ‧ ${unitObj.title}` : "國中生物單元";

  const pool = questionPoolByUnit[unitFile] || [];
  poolLeftBadge.textContent = `題庫佇列剩餘: ${pool.length} 題`;

  currentActiveQuestion = getNextQuestionFromPool(unitFile);

  let htmlStem = currentActiveQuestion.question;
  HIGHLIGHT_KEYWORDS.forEach(kw => {
    if (htmlStem.includes(kw)) htmlStem = htmlStem.replaceAll(kw, `<span class="kw-highlight">${kw}</span>`);
  });

  quizStem.innerHTML = isTakeoverMode ? `⚔️【強行佔領攻防戰】${htmlStem}` : htmlStem;
  quizOptions.innerHTML = "";
  quizExplanation.classList.add("hidden");

  // 防作弊核心：重設按鈕 100% 預設隱藏，作答前絕不開放
  btnConfirmAnswer.classList.add("hidden");
  btnCloseWrong.classList.add("hidden");

  currentActiveQuestion.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn-option";
    btn.innerHTML = `<b>${String.fromCharCode(65 + idx)}.</b> ${optText}`;
    btn.addEventListener("click", () => handleQuizSelect(idx, btn));
    quizOptions.appendChild(btn);
  });

  quizBox.classList.toggle("zoomed-text", isTextZoomed);
  startCountdownTimer();
  openModal(quizModal);
}

function startCountdownTimer() {
  if (!timerEnabled) {
    quizTimerBanner.textContent = "⏱️ 計時器：無限制時間";
    return;
  }
  let timeLeft = 30;
  quizTimerBanner.textContent = `⏱️ 倒數計時：${timeLeft} 秒`;
  clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    timeLeft--;
    quizTimerBanner.textContent = `⏱️ 倒數計時：${timeLeft} 秒`;
    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      quizTimerBanner.textContent = "🚨 時間到！請立即結算作答！";
    }
  }, 1000);
}

// 8. 答題結算 (嚴格防偷雞鎖定：答錯 100% 強制隱藏蓋房按鈕！)
function handleQuizSelect(selectedIndex, btnEl) {
  clearInterval(countdownTimer);
  const isCorrect = (selectedIndex === currentActiveQuestion.answer);

  if (isCorrect) {
    btnEl.classList.add("correct");
    playFanfare();
    explanationText.textContent = currentActiveQuestion.explanation || "恭喜答對！獲得建置生態領地的資格！";
    quizExplanation.classList.remove("hidden");

    if (isTakeoverMode) {
      btnConfirmAnswer.textContent = "⚔️ 答對成功！支付 150 金幣強行佔領領地 🏰";
    } else {
      btnConfirmAnswer.textContent = "✅ 答對成功！支付 100 金幣前往建立領地 🏰";
    }

    // 答對解鎖蓋房/強佔按鈕，隱藏關閉按鈕
    btnConfirmAnswer.classList.remove("hidden");
    btnCloseWrong.classList.add("hidden");

    teams[currentTurnIndex].score += 20;
    addHistoryLog(teams[currentTurnIndex].name, `✅ 答對題目：【${currentActiveQuestion.question.slice(0, 15)}...】(+20金幣)`);

  } else {
    btnEl.classList.add("incorrect");
    playWrongSound();
    explanationText.textContent = currentActiveQuestion.explanation || "答錯囉，請詳閱觀念解析再接再勵！";
    quizExplanation.classList.remove("hidden");

    // 🔒 答錯 100% 鎖死蓋房！強制隱藏綠色蓋房按鈕，學生絕無法偷雞蓋房！
    btnConfirmAnswer.classList.add("hidden");
    btnCloseWrong.textContent = "❌ 答錯扣分！關閉結束本輪 ➡️";
    btnCloseWrong.classList.remove("hidden");

    addHistoryLog(teams[currentTurnIndex].name, `❌ 答錯題目：【${currentActiveQuestion.question.slice(0, 15)}...】`);
  }
}

// 9. 答對建立或強行佔領生態領地
function openBuildModal() {
  const curTeam = teams[currentTurnIndex];
  currentPendingBuildCellId = curTeam.pos;

  buildTeamIcon.textContent = curTeam.icon;
  buildModalTitle.textContent = isTakeoverMode ? `⚔️ ${curTeam.name} 強行收購敵方領地！` : `🎉 ${curTeam.name} 建立專屬生態領地！`;
  recommendBuildList.innerHTML = "";

  let defaultUnusedName = "";

  RECOMMEND_BUILDINGS.forEach(bName => {
    const isUsed = usedBuildingNames.has(bName);
    const chip = document.createElement("span");
    chip.className = `build-chip ${isUsed ? "used-chip" : ""}`;
    
    if (isUsed) {
      chip.textContent = `🔒 ${bName} (已建立)`;
      chip.style.opacity = "0.45";
      chip.style.cursor = "not-allowed";
      chip.style.textDecoration = "line-through";
      chip.style.background = "#e2e8f0";
      chip.style.color = "#64748b";
    } else {
      chip.textContent = bName;
      chip.onclick = () => { inputBuildName.value = bName; };
      if (!defaultUnusedName) defaultUnusedName = bName;
    }
    recommendBuildList.appendChild(chip);
  });

  inputBuildName.value = defaultUnusedName || "獨特生物保育站";
  openModal(buildModal);
}

function confirmBuildHouse() {
  const curTeam = teams[currentTurnIndex];
  const bName = inputBuildName.value.trim() || "生態研究站";
  const cost = isTakeoverMode ? 150 : 100;

  if (curTeam.score < cost) {
    alert(`⚠️ 貴隊金幣不足 (${curTeam.score} < ${cost})，無法進行建置！`);
    return;
  }

  if (usedBuildingNames.has(bName)) {
    alert(`⚠️ 建築名稱『${bName}』已經在動物城被建立過了！\n請發揮創意選擇或輸入一個獨一無二的生態建築名稱！`);
    return;
  }

  curTeam.score -= cost;
  usedBuildingNames.add(bName);

  const cellId = currentPendingBuildCellId;
  const buildArea = document.getElementById(`build-${cellId}`);
  if (buildArea) {
    buildArea.innerHTML = ""; // 強佔時替換舊建物
    const badge = document.createElement("div");
    badge.className = "building-badge";
    badge.innerHTML = `${curTeam.icon} 🏠 ${bName}`;
    badge.style.backgroundColor = curTeam.color;
    buildArea.appendChild(badge);
  }

  cellOwners[cellId] = {
    teamId: curTeam.id,
    teamName: curTeam.name,
    teamIcon: curTeam.icon,
    color: curTeam.color,
    buildingName: bName,
    cost
  };

  curTeam.buildingsCount += 1;
  addHistoryLog(curTeam.name, isTakeoverMode ? `⚔️ 成功強行佔領敵方領地：【${curTeam.icon} ${bName}】(-150金幣)` : `🏰 成功建立領地：【${curTeam.icon} ${bName}】(-100金幣)`);
  closeModal(buildModal);
  renderScoreBar();
  endTurn();
}

function endTurn() {
  currentTurnIndex = (currentTurnIndex + 1) % teams.length;
  renderScoreBar();
  isDrawing = false;
  saveSnapshot();
}

function shuffleTeams() {
  teams.sort(() => Math.random() - 0.5);
  renderScoreBar();
  updateCoordinates();
}

// 10. 戰報紀錄與 CSV 下載
function addHistoryLog(target, detail) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`;
  gameHistory.push({ time: timeStr, target, detail });
}

function openHistory() {
  const tbody = historyTable.querySelector("tbody");
  tbody.innerHTML = gameHistory.map(h => `<tr><td>${h.time}</td><td><b>${h.target}</b></td><td>${h.detail}</td></tr>`).join("") || '<tr><td colspan="3" style="text-align:center;">尚無戰報紀錄</td></tr>';
  openModal(historyModal);
}

function exportHistoryCSV() {
  if (gameHistory.length === 0) return alert("目前尚無戰報紀錄！");
  let csv = "\uFEFF時間,行動隊伍/對象,詳細戰報內容\n";
  gameHistory.forEach(h => { csv += `${h.time},${h.target},"${h.detail.replace(/"/g, '""')}"\n`; });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `動物城大富翁戰報_${Date.now()}.csv`;
  link.click();
}

// 11. 教師一鍵凍結與設定
function toggleTeacherFreeze() {
  isTeacherFrozen = !isTeacherFrozen;
  if (isTeacherFrozen) {
    openModal(teacherFreezeModal);
  } else {
    closeModal(teacherFreezeModal);
  }
}

function openSettings() {
  selectGameMode.value = gameMode;
  selectTeamCount.value = activeTeamCount;
  openModal(settingsModal);
}

function saveSettings() {
  gameMode = selectGameMode.value;
  activeTeamCount = parseInt(selectTeamCount.value, 10);
  closeModal(settingsModal);
  initTeamsAndBoard();
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const list = json.map(row => row.join(",")).join("\n");
      inputStudents.value = list;
      alert("✅ 學生名單成功匯入！");
    } catch (err) {
      alert("匯入失敗，請確認檔案格式！");
    }
  };
  reader.readAsBinaryString(file);
}

// 12. LocalStorage 快照機制
function saveSnapshot() {
  const snapshot = {
    gameMode,
    activeTeamCount,
    currentTurnIndex,
    teams,
    usedBuildingNames: Array.from(usedBuildingNames),
    gameHistory,
    time: Date.now()
  };
  localStorage.setItem("monopoly_snapshot_v3.9", JSON.stringify(snapshot));
}

function checkSnapshotOnLoad() {
  const raw = localStorage.getItem("monopoly_snapshot_v3.9");
  if (raw) {
    try {
      const snap = JSON.parse(raw);
      if (snap && snap.teams && snap.teams.length > 0) {
        openModal(snapshotModal);
      }
    } catch (e) {}
  }
}

function restoreSnapshot() {
  closeModal(snapshotModal);
  const raw = localStorage.getItem("monopoly_snapshot_v3.9");
  if (raw) {
    const snap = JSON.parse(raw);
    gameMode = snap.gameMode || "group";
    activeTeamCount = snap.activeTeamCount || 4;
    currentTurnIndex = snap.currentTurnIndex || 0;
    teams = snap.teams || [];
    usedBuildingNames = new Set(snap.usedBuildingNames || []);
    gameHistory = snap.gameHistory || [];
    renderScoreBar();
    generateBoardGrid();
  }
}

function openModal(el) { el.classList.remove("hidden"); }
function closeModal(el) { el.classList.add("hidden"); }