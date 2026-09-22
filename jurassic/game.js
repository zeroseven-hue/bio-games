/**
 * 侏羅紀叢林逃生記 - 專業教學強固版核心引擎 V3.2 (嚴格審核版)
 * 1. 修正選隊 Bug：精準讀取選單人數 (支援 2~12 隊)。
 * 2. 修正捷徑：18 號藤蔓調整為攀升至 29 號 (18 ➜ 29)。
 * 3. 修正火柴人配色：頭部白底彩框、身體與四肢手腳 100% 填入小隊色彩。
 * 4. 題庫無重複洗牌機制：單元內題庫絕不連續重複抽到同一題！
 * 5. 還原 SVG 曲劃綠色藤蔓 + 蔓延葉子 + 暴龍爪痕切割動畫。
 */

// 1. 常數與設定
const TOTAL_CELLS = 36;
// 18 號格修訂為攀升至 29 號格
const JUMPS = { 3: 17, 10: 13, 18: 29, 22: 28, 14: 8, 20: 15, 33: 27, 35: 29 };
const RED_TILES = [5, 9, 12, 16, 23, 27, 30];

// 12 隊彩繪小人配色與名稱
const ALL_TEAM_COLORS = [
  { name: "紅隊 探險隊", color: "#e74c3c" },
  { name: "藍隊 探險隊", color: "#3498db" },
  { name: "綠隊 探險隊", color: "#2ecc71" },
  { name: "黃隊 探險隊", color: "#f1c40f" },
  { name: "紫隊 探險隊", color: "#9b59b6" },
  { name: "橘隊 探險隊", color: "#e67e22" },
  { name: "青隊 探險隊", color: "#1abc9c" },
  { name: "粉隊 探險隊", color: "#fd79a8" },
  { name: "棕隊 探險隊", color: "#8d6e63" },
  { name: "灰隊 探險隊", color: "#95a5a6" },
  { name: "黑隊 探險隊", color: "#2c3e50" },
  { name: "白隊 探險隊", color: "#ecf0f1" }
];

// 12 隊在同一個格子內的 3x4 散開矩陣偏移量 (防止小人遮擋)
const TEAM_OFFSETS = [
  { x: -4, y: -4 }, { x: -1.5, y: -4 }, { x: 1, y: -4 },
  { x: -4, y: 0 },  { x: -1.5, y: 0 },  { x: 1, y: 0 },
  { x: -4, y: 4 },  { x: -1.5, y: 4 },  { x: 1, y: 4 },
  { x: -4, y: 8 },  { x: -1.5, y: 8 },  { x: 1, y: 8 }
];

// 12 種結構化環境變遷卡
const ENVIRONMENT_CARDS = [
  {
    id: "card_immune", name: "有利突變 🛡️", isGood: true,
    desc: "個體產生有利防禦特徵！獲得「暴龍免疫卡」一張，下次遭遇暴龍直接抵銷跌落傷害！",
    action: (player) => { player.immune = true; }
  },
  {
    id: "card_energy", name: "物資補給 ⚡", isGood: true,
    desc: "尋獲高熱量能量補給！活力充沛，本隊直接獲得「再骰一次（額外回合）」！",
    action: (player) => { player.extraTurn = true; }
  },
  {
    id: "card_mutualism", name: "同儕共生 🤝", isGood: true,
    desc: "發揮同儕互助愛！帶領目前排在最後一名的隊伍共同「前進相同步數」！",
    action: (player, allPlayers) => {
      const sorted = [...allPlayers].sort((a, b) => a.pos - b.pos);
      const lastPlayer = sorted[0];
      if (lastPlayer && lastPlayer.id !== player.id) {
        lastPlayer.pos = Math.min(TOTAL_CELLS, lastPlayer.pos + 2);
        updateTokenPosition(lastPlayer);
      }
    }
  },
  {
    id: "card_selection", name: "天擇優勢 🏃", isGood: true,
    desc: "高度適應叢林地形！步伐輕盈敏捷，全隊立刻「向前躍進 2 步」！",
    action: (player) => {
      player.pos = Math.min(TOTAL_CELLS, player.pos + 2);
      updateTokenPosition(player);
    }
  },
  {
    id: "card_gene_swap", name: "優勢基因 🧬", isGood: true,
    desc: "演化大躍進！與前方最近的隊伍「互換位置」！(若已是第一名則前進 1 步)",
    action: (player, allPlayers) => {
      const ahead = allPlayers.filter(p => p.pos > player.pos).sort((a, b) => a.pos - b.pos);
      if (ahead.length > 0) {
        const target = ahead[0];
        const temp = player.pos;
        player.pos = target.pos;
        target.pos = temp;
        updateTokenPosition(player);
        updateTokenPosition(target);
      } else {
        player.pos = Math.min(TOTAL_CELLS, player.pos + 1);
        updateTokenPosition(player);
      }
    }
  },
  {
    id: "card_drought", name: "氣候乾旱 🌪️", isGood: false,
    desc: "極端氣候帶來乾旱缺水！體力消耗過大，全隊「後退 1 步」！",
    action: (player) => {
      player.pos = Math.max(0, player.pos - 1);
      updateTokenPosition(player);
    }
  },
  {
    id: "card_acid_rain", name: "酸雨侵襲 🌧️", isGood: false,
    desc: "環境污染導致酸雨落山！路面溼滑難行，全隊「後退 2 步」！",
    action: (player) => {
      player.pos = Math.max(0, player.pos - 2);
      updateTokenPosition(player);
    }
  },
  {
    id: "card_invasive", name: "外來種入侵 🦗", isGood: false,
    desc: "外來物種掠奪食糧！本隊深受干擾，下回合「暫停行動」一次！",
    action: (player) => { player.skipTurn = true; }
  },
  {
    id: "card_volcano", name: "火山灰遮日 🌋", isGood: false,
    desc: "火山噴發遮蔽日光，視野迷茫！全隊迷失方向「後退 2 步」！",
    action: (player) => {
      player.pos = Math.max(0, player.pos - 2);
      updateTokenPosition(player);
    }
  },
  {
    id: "card_epidemic", name: "植物病蟲害 🐛", isGood: false,
    desc: "森林遭受病蟲害干擾！拖累自身與相鄰隊伍「各後退 1 步」！",
    action: (player, allPlayers) => {
      player.pos = Math.max(0, player.pos - 1);
      updateTokenPosition(player);
      const others = allPlayers.filter(p => p.id !== player.id);
      if (others.length > 0) {
        others.sort((a, b) => Math.abs(a.pos - player.pos) - Math.abs(b.pos - player.pos));
        const nearest = others[0];
        nearest.pos = Math.max(0, nearest.pos - 1);
        updateTokenPosition(nearest);
      }
    }
  },
  {
    id: "card_tsunami", name: "沿海海嘯 🌊", isGood: false,
    desc: "巨大海嘯突襲叢林小徑！全班所有隊伍強制「各後退 1 步」！",
    action: (player, allPlayers) => {
      allPlayers.forEach(p => {
        if (p.pos > 0) {
          p.pos = Math.max(0, p.pos - 1);
          updateTokenPosition(p);
        }
      });
    }
  },
  {
    id: "card_earthquake", name: "強烈地震 💥", isGood: false,
    desc: "地殼變動引發走山坍方！本隊受到衝擊「後退 3 步」！",
    action: (player) => {
      player.pos = Math.max(0, player.pos - 3);
      updateTokenPosition(player);
    }
  }
];

// 2. 狀態與全域變數
let players = [];
let currentPlayerIndex = 0;
let isMoving = false; // 嚴格狀態鎖定，防止連點與出錯
let roundCounter = 1;
let gameLog = [];
let errorQuestionsLog = [];
let questionBank = [];
let questionPool = []; // ⭐ 不放回洗牌抽題池 (保證一輪內絕不重複出現同一題!)

let currentMode = "group-tablet";
let gameTimer = null;
let timeLeft = 15 * 60;
let isRushMode = false;
let isTimerDisabled = false;
let isTeacherFrozen = false;
let currentActiveQuestion = null;
let quizTimerInterval = null;
let quizTimeRemaining = 30;
let currentQuizCallback = null;
let currentCardCallback = null;
let audioCtx = null;

// DOM
const teamCountSelect = document.getElementById("teamCountSelect");
const unitSelect = document.getElementById("unitSelect");
const gameModeSelect = document.getElementById("gameModeSelect");
const btnRules = document.getElementById("btnRules");
const btnManualMove = document.getElementById("btnManualMove");
const btnReset = document.getElementById("btnReset");
const btnFreeze = document.getElementById("btnFreeze");
const btnZoomFont = document.getElementById("btnZoomFont");

const boardGrid = document.getElementById("boardGrid");
const boardFrame = document.getElementById("boardFrame");
const svgCanvas = document.getElementById("svgCanvas");
const timerClock = document.getElementById("timerClock");
const rushBadge = document.getElementById("rushBadge");
const soundToggle = document.getElementById("soundToggle");

const turnStatusCard = document.getElementById("turnStatusCard");
const currentTeamName = document.getElementById("currentTeamName");
const currentRoleNote = document.getElementById("currentRoleNote");
const btnRollDice = document.getElementById("btnRollDice");
const diceResultDisplay = document.getElementById("diceResultDisplay");
const eventMsgBox = document.getElementById("eventMsgBox");
const teamRankList = document.getElementById("teamRankList");
const btnDownloadLog = document.getElementById("btnDownloadLog");

// Modals
const rulesModal = document.getElementById("rulesModal");
const quizModal = document.getElementById("quizModal");
const quizTypeTag = document.getElementById("quizTypeTag");
const quizDiffTag = document.getElementById("quizDiffTag");
const quizTimerNum = document.getElementById("quizTimerNum");
const quizStem = document.getElementById("quizStem");
const quizChoices = document.getElementById("quizChoices");
const quizFeedbackBox = document.getElementById("quizFeedbackBox");
const feedbackBanner = document.getElementById("feedbackBanner");
const feedbackMemoText = document.getElementById("feedbackMemoText");
const btnFinishQuiz = document.getElementById("btnFinishQuiz");

const cardModal = document.getElementById("cardModal");
const natureCardBox = document.getElementById("natureCardBox");
const natureCardIcon = document.getElementById("natureCardIcon");
const natureCardName = document.getElementById("natureCardName");
const natureCardDesc = document.getElementById("natureCardDesc");
const btnAcceptCard = document.getElementById("btnAcceptCard");

const teacherFreezeModal = document.getElementById("teacherFreezeModal");
const btnUnfreeze = document.getElementById("btnUnfreeze");
const summaryModal = document.getElementById("summaryModal");
const snapshotModal = document.getElementById("snapshotModal");

// 3. 初始化
window.addEventListener("DOMContentLoaded", () => {
  parseUrlParameters();
  initEventListeners();
  loadManifestAndInitBank();
  createBoardStructure();
  checkSnapshotOnLoad();
});

function parseUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");
  const timer = urlParams.get("timer");

  if (mode && ["group-tablet", "projector", "solo"].includes(mode)) {
    currentMode = mode;
    gameModeSelect.value = mode;
    if (mode === "projector") btnManualMove.classList.remove("hidden");
  }

  if (timer === "off") {
    isTimerDisabled = true;
    quizTimerNum.classList.add("hidden");
    timerClock.textContent = "無時間限制";
  }
}

function initEventListeners() {
  document.body.addEventListener("touchstart", unlockAudio, { once: true });
  document.body.addEventListener("click", unlockAudio, { once: true });

  btnRollDice.addEventListener("click", handleRollDice);
  btnReset.addEventListener("click", resetGame);
  btnManualMove.addEventListener("click", handleManualMove);
  btnDownloadLog.addEventListener("click", downloadGameLog);

  btnFreeze.addEventListener("click", toggleFreeze);
  btnUnfreeze.addEventListener("click", toggleFreeze);

  btnZoomFont.addEventListener("click", () => {
    document.body.classList.toggle("font-zoomed");
    btnZoomFont.textContent = document.body.classList.contains("font-zoomed") ? "🔍 標準字體" : "🔍 放大題目";
  });

  teamCountSelect.addEventListener("change", () => {
    resetGame();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      toggleFreeze();
    }
  });

  gameModeSelect.addEventListener("change", (e) => {
    currentMode = e.target.value;
    if (currentMode === "projector") {
      btnManualMove.classList.remove("hidden");
    } else {
      btnManualMove.classList.add("hidden");
    }
    resetGame();
  });

  unitSelect.addEventListener("change", (e) => {
    loadSingleUnit(e.target.value);
  });

  btnRules.addEventListener("click", () => openModal(rulesModal));
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetId = e.currentTarget.getAttribute("data-close");
      closeModal(document.getElementById(targetId));
    });
  });

  btnFinishQuiz.addEventListener("click", handleQuizFinish);
  btnAcceptCard.addEventListener("click", handleCardAccept);

  document.getElementById("btnRestoreSnapshot")?.addEventListener("click", restoreSnapshot);
  document.getElementById("btnDiscardSnapshot")?.addEventListener("click", () => {
    localStorage.removeItem("jurassic_snapshot");
    closeModal(snapshotModal);
  });

  document.getElementById("btnRestartFromSummary")?.addEventListener("click", () => {
    closeModal(summaryModal);
    startGame();
  });
  document.getElementById("btnDownloadLogModal")?.addEventListener("click", downloadGameLog);
}

function unlockAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
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

// 4. 動態題庫載入與洗牌池重置
async function loadManifestAndInitBank() {
  try {
    const res = await fetch("../questions/manifest.json");
    if (!res.ok) throw new Error("讀取 manifest.json 失敗");
    const manifest = await res.json();

    unitSelect.innerHTML = "";
    manifest.units.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.file;
      opt.textContent = `${u.id.toUpperCase()} - ${u.title}`;
      unitSelect.appendChild(opt);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const targetUnit = urlParams.get("unit");
    const found = manifest.units.find(u => u.file === targetUnit);

    if (found) {
      unitSelect.value = found.file;
      loadSingleUnit(found.file);
    } else if (manifest.units.length > 0) {
      loadSingleUnit(manifest.units[0].file);
    }
  } catch (err) {
    console.warn("使用備用題庫載入", err);
    fallbackManifest();
  }
}

function fallbackManifest() {
  const fallbackList = [
    { file: "unit01_scientific_method.json", title: "01. 科學方法" },
    { file: "unit05_cell_structure.json", title: "05. 細胞結構" },
    { file: "unit10_enzymes.json", title: "10. 酵素與代謝作用" }
  ];
  unitSelect.innerHTML = "";
  fallbackList.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.file;
    opt.textContent = u.title;
    unitSelect.appendChild(opt);
  });
  loadSingleUnit(fallbackList[0].file);
}

async function loadSingleUnit(fileName) {
  try {
    updateMessage(`正在讀取題庫：${fileName}...`);
    const res = await fetch(`../questions/${fileName}`);
    if (!res.ok) throw new Error("題庫讀取失敗");
    const data = await res.json();
    questionBank = data.questions;
    // 重置洗牌抽題池
    questionPool = [...questionBank].sort(() => Math.random() - 0.5);
    updateMessage(`單元題庫載入成功！共收錄 ${questionBank.length} 題。`);
    startGame();
  } catch (err) {
    console.error(err);
    updateMessage("⚠️ 題庫載入失敗，請確認 questions/ 目錄與 JSON 檔案！");
  }
}

// 5. 棋盤建立與 SVG 綠色藤蔓 (含葉子) & 爪痕畫布
function createBoardStructure() {
  boardGrid.innerHTML = "";
  let cellNums = [];
  for (let row = 5; row >= 0; row--) {
    if (row % 2 !== 0) {
      for (let col = 0; col < 6; col++) cellNums.push(row * 6 + (6 - col));
    } else {
      for (let col = 0; col < 6; col++) cellNums.push(row * 6 + col + 1);
    }
  }

  const baseColors = ["cell-green", "cell-yellow", "cell-blue"];
  cellNums.forEach(num => {
    const cellEl = document.createElement("div");
    const colorClass = RED_TILES.includes(num) ? "cell-red" : baseColors[num % 3];
    cellEl.className = `cell ${colorClass}`;
    cellEl.id = `cell-${num}`;
    cellEl.innerHTML = `<span class="cell-number">${num}</span>`;

    if (JUMPS[num]) {
      if (JUMPS[num] > num) {
        cellEl.innerHTML += `<div class="emoji" title="藤蔓攀升捷徑">🌿</div>`;
      } else {
        cellEl.innerHTML += `<div class="emoji dino-container" id="dino-${num}" title="暴龍襲擊陷阱">🦖</div>`;
      }
    } else if (num === TOTAL_CELLS) {
      cellEl.innerHTML += `<div class="emoji">🏆</div>`;
    }

    boardGrid.appendChild(cellEl);
  });

  drawConnections();
}

function getCellCenterCoords(cellNum) {
  const zb = cellNum - 1;
  const rf = Math.floor(zb / 6);
  const perCell = 100 / 6;
  const col = (rf % 2 === 0) ? (zb % 6) : (5 - (zb % 6));
  const x = col * perCell + perCell / 2;
  const y = (5 - rf) * perCell + perCell / 2;
  return { x, y };
}

function drawConnections() {
  svgCanvas.innerHTML = "";
  Object.keys(JUMPS).forEach(startStr => {
    const startCell = parseInt(startStr, 10);
    const endCell = JUMPS[startCell];
    const p1 = getCellCenterCoords(startCell);
    const p2 = getCellCenterCoords(endCell);

    const isLadder = endCell > startCell;

    if (isLadder) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pad = 7;

      const startX = p1.x + (dx / dist) * pad;
      const startY = p1.y + (dy / dist) * pad;
      const endX = p2.x - (dx / dist) * pad;
      const endY = p2.y - (dy / dist) * pad;

      const cx = (startX + endX) / 2;
      const cy = (startY + endY) / 2;
      const offsetX = -dy * 0.15;
      const offsetY = dx * 0.15;

      const vineFg = document.createElementNS("http://www.w3.org/2000/svg", "path");
      vineFg.id = `vine-${startCell}-fg`;
      vineFg.setAttribute("d", `M ${startX} ${startY} Q ${cx - offsetX} ${cy - offsetY} ${endX} ${endY}`);
      vineFg.setAttribute("stroke", "#8bc34a");
      vineFg.setAttribute("stroke-width", "2.5");
      vineFg.setAttribute("stroke-dasharray", "5, 4");
      vineFg.setAttribute("fill", "none");
      vineFg.setAttribute("stroke-linecap", "round");
      vineFg.style.filter = "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))";
      vineFg.style.transition = "all 0.3s ease";
      svgCanvas.appendChild(vineFg);

      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const leavesData = [
        { dx: offsetX * 0.4, dy: offsetY * 0.4, path: "M0,0 Q2,-4 5,0 Q2,4 0,0", color: "#aed581", rot: angle - 30 },
        { dx: -offsetX * 0.5, dy: -offsetY * 0.5, path: "M0,0 Q-2,4 -5,0 Q-2,-4 0,0", color: "#7cb342", rot: angle + 45 }
      ];

      leavesData.forEach(l => {
        const leaf = document.createElementNS("http://www.w3.org/2000/svg", "path");
        leaf.setAttribute("d", l.path);
        leaf.setAttribute("fill", l.color);
        leaf.setAttribute("transform", `translate(${cx + l.dx}, ${cy + l.dy}) rotate(${l.rot})`);
        leaf.style.filter = "drop-shadow(0 1px 1px rgba(0,0,0,0.3))";
        svgCanvas.appendChild(leaf);
      });
    } else {
      const fallGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      fallGroup.id = `fall-${startCell}`;
      fallGroup.style.display = "none";
      fallGroup.style.opacity = "1";

      const cx = (p1.x + p2.x) / 2 + 5;
      const cy = (p1.y + p2.y) / 2 - 15;

      for (let i = -1; i <= 1; i++) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const oX = i * 2;
        const oY = i * 1.2;
        path.setAttribute("d", `M ${p1.x + oX} ${p1.y + oY} Q ${cx + oX} ${cy + oY} ${p2.x + oX} ${p2.y + oY}`);
        path.setAttribute("stroke", "#e74c3c");
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.style.opacity = "0.75";
        path.style.filter = "drop-shadow(0 0 2px rgba(231, 76, 60, 0.5))";

        path.setAttribute("stroke-dasharray", "150");
        path.setAttribute("stroke-dashoffset", "150");
        path.classList.add("claw-path");
        fallGroup.appendChild(path);
      }
      svgCanvas.appendChild(fallGroup);
    }
  });
}

// 6. 遊戲開始與流程 (⭐ 精準讀取選單隊伍數量，支援 2~12 隊!)
function startGame() {
  clearInterval(gameTimer);
  players = [];
  gameLog = [];
  errorQuestionsLog = [];
  roundCounter = 1;
  isRushMode = false;
  isMoving = false;
  rushBadge.classList.add("hidden");
  timerClock.classList.remove("rush");

  // ⭐ 修正隊伍數讀取 Bug
  let teamCount = parseInt(teamCountSelect.value, 10);
  if (isNaN(teamCount) || teamCount < 2) teamCount = 4;
  if (currentMode === "solo") teamCount = 1;

  for (let i = 0; i < teamCount; i++) {
    const preset = ALL_TEAM_COLORS[i % ALL_TEAM_COLORS.length];
    players.push({
      id: i,
      name: (currentMode === "solo") ? "自主探險家" : preset.name,
      color: preset.color,
      pos: 0,
      offset: TEAM_OFFSETS[i % TEAM_OFFSETS.length],
      immune: false,
      skipTurn: false,
      extraTurn: false,
      consecutiveErrors: 0,
      turnMemberIdx: 1,
      totalAnswers: 0,
      correctAnswers: 0
    });
  }

  if (!isTimerDisabled) {
    timeLeft = 15 * 60;
    updateTimerDisplay();
    gameTimer = setInterval(handleTimerTick, 1000);
  } else {
    timerClock.textContent = "無時間限制";
  }

  initPlayerTokens();
  updateLeaderboard();
  addLog(`=== 遊戲開始 (參賽隊伍：${players.length}隊，模式：${getModeDisplayName()}) ===`);

  currentPlayerIndex = 0;
  nextTurn(true);
}

function getModeDisplayName() {
  if (currentMode === "projector") return "全班大螢幕投影主持";
  if (currentMode === "solo") return "個人自主挑戰";
  return "各組平板輪流競賽";
}

// 復原原版火柴人小人畫法 (圓形白頭 + 各隊專屬顏色線條與手腳全彩)
function initPlayerTokens() {
  document.querySelectorAll(".token").forEach(t => t.remove());

  players.forEach(p => {
    const tokenEl = document.createElement("div");
    tokenEl.className = "token";
    tokenEl.id = `token-${p.id}`;

    const parts = [
      "stick-head stick-part", "stick-body stick-part",
      "stick-arm-l stick-arm stick-part", "stick-arm-r stick-arm stick-part",
      "stick-leg-l stick-leg stick-part", "stick-leg-r stick-leg stick-part"
    ];

    parts.forEach(c => {
      const partEl = document.createElement("div");
      partEl.className = c;
      partEl.style.borderColor = p.color;
      if (c.includes("stick-head")) {
        partEl.style.backgroundColor = "#ffffff";
      } else {
        partEl.style.backgroundColor = p.color;
      }
      tokenEl.appendChild(partEl);
    });

    boardFrame.appendChild(tokenEl);
    updateTokenPosition(p);
  });
}

function updateTokenPosition(player) {
  const tokenEl = document.getElementById(`token-${player.id}`);
  if (!tokenEl) return;

  let coords;
  if (player.pos <= 0) {
    player.pos = 0;
    coords = { x: -8, y: 92 };
  } else {
    coords = getCellCenterCoords(player.pos);
  }

  const finalX = coords.x - 1.75 + player.offset.x;
  const finalY = coords.y - 3.5 + player.offset.y;
  tokenEl.style.left = `${finalX}%`;
  tokenEl.style.top = `${finalY}%`;
}

function nextTurn(isFirstTurn = false) {
  if (isTeacherFrozen) return;

  if (!isFirstTurn) {
    if (players[currentPlayerIndex].extraTurn) {
      players[currentPlayerIndex].extraTurn = false;
      updateMessage(`⚡ 【${players[currentPlayerIndex].name}】 獲得「額外回合」，可再次行動！`);
      addLog(`⚡ 【${players[currentPlayerIndex].name}】 發動額外回合！`);
    } else {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
      if (currentPlayerIndex === 0) roundCounter++;
    }
  }

  saveSnapshot();

  const curPlayer = players[currentPlayerIndex];

  if (curPlayer.skipTurn) {
    curPlayer.skipTurn = false;
    updateMessage(`🦗 【${curPlayer.name}】 受到外來種干擾，本回合暫停一次！`);
    addLog(`  -> 🦗 【${curPlayer.name}】 暫停行動一回合。`);
    setTimeout(() => nextTurn(), 1800);
    return;
  }

  turnStatusCard.style.borderLeftColor = curPlayer.color;
  turnStatusCard.style.backgroundColor = `color-mix(in srgb, ${curPlayer.color} 15%, white)`;
  currentTeamName.textContent = curPlayer.name;
  currentTeamName.style.color = curPlayer.color;

  if (currentMode === "group-tablet") {
    currentRoleNote.textContent = `本回合答題手：第 ${curPlayer.turnMemberIdx} 棒組員`;
    curPlayer.turnMemberIdx = (curPlayer.turnMemberIdx % 4) + 1;
  } else {
    currentRoleNote.textContent = "輪到本隊投擲骰子！";
  }

  isMoving = false;
  btnRollDice.disabled = false;
  btnRollDice.style.backgroundColor = curPlayer.color;
  btnRollDice.style.color = (curPlayer.color === "#f1c40f" || curPlayer.color === "#ecf0f1") ? "#333" : "#fff";

  updateMessage(`請 【${curPlayer.name}】 點擊擲骰子開始前進！`);
}

function handleRollDice() {
  if (isMoving || isTeacherFrozen) return;
  isMoving = true;
  btnRollDice.disabled = true;

  unlockAudio();

  let steps;
  if (isRushMode) {
    steps = Math.floor(Math.random() * 3) + 4;
  } else {
    steps = Math.floor(Math.random() * 6) + 1;
  }

  diceResultDisplay.textContent = "🎲...";
  let rolls = 0;
  const interval = setInterval(() => {
    playDiceTone();
    diceResultDisplay.textContent = Math.floor(Math.random() * 6) + 1;
    rolls++;
    if (rolls > 8) {
      clearInterval(interval);
      diceResultDisplay.textContent = steps;
      addLog(`【${players[currentPlayerIndex].name}】 擲出了 ${steps} 點`);
      movePlayer(players[currentPlayerIndex], steps);
    }
  }, 80);
}

function handleManualMove() {
  if (isMoving || isTeacherFrozen) return;
  const stepsStr = prompt("【教師專用】請輸入欲指定前進的步數 (1~6)：", "3");
  if (!stepsStr) return;
  const steps = parseInt(stepsStr, 10);
  if (isNaN(steps) || steps < 1 || steps > 6) {
    alert("請輸入有效的 1~6 數字！");
    return;
  }
  isMoving = true;
  btnRollDice.disabled = true;
  diceResultDisplay.textContent = steps;
  addLog(`[教師指定] 【${players[currentPlayerIndex].name}】 前進 ${steps} 步`);
  movePlayer(players[currentPlayerIndex], steps);
}

function movePlayer(player, steps) {
  const originPos = player.pos; // 💡 記錄本回合擲骰前的原格
  let targetPos = player.pos + steps;
  const tokenEl = document.getElementById(`token-${player.id}`);
  if (tokenEl) tokenEl.classList.add("running");

  if (targetPos >= TOTAL_CELLS) {
    if (isRushMode) {
      targetPos = TOTAL_CELLS;
      updateMessage("🔥 終極逃生破門而出！抵達終點！");
    } else {
      targetPos = TOTAL_CELLS - (targetPos - TOTAL_CELLS);
      updateMessage(`💥 超過出口！撞牆反彈回第 ${targetPos} 格！`);
    }
  } else if (targetPos < 0) {
    targetPos = 0;
  }

  player.pos = targetPos;
  updateTokenPosition(player);
  updateLeaderboard();

  setTimeout(() => {
    if (tokenEl) tokenEl.classList.remove("running");

    if (player.pos === TOTAL_CELLS) {
      handleGameOver(player);
      return;
    }

    triggerTileQuizEvent(player, originPos);

  }, 700);
}

// 7. 題目高亮與不重複洗牌抽題演算法
function highlightKeywords(text) {
  if (!text) return "";
  const keywords = ["不屬於", "屬於", "錯誤的是", "正確的是", "缺乏", "過多", "最適", "無法", "最多", "最少", "主要", "次要", "不包含", "包含"];
  let result = text;
  keywords.forEach(kw => {
    const reg = new RegExp(kw, "g");
    result = result.replace(reg, `<span class="highlight-keyword">${kw}</span>`);
  });
  return result;
}

// ⭐ 【不重複洗牌抽題】：一輪內絕對不重複出現同一題！
function getNextQuestion(preferredDiff, player) {
  if (!questionBank || questionBank.length === 0) return null;

  if (!questionPool || questionPool.length === 0) {
    questionPool = [...questionBank].sort(() => Math.random() - 0.5);
    addLog("🔄 單元題庫已完答一輪，系統自動重新洗牌！");
  }

  if (player && player.consecutiveErrors >= 2) {
    const easyIdx = questionPool.findIndex(q => q.difficulty === "易");
    if (easyIdx !== -1) {
      return questionPool.splice(easyIdx, 1)[0];
    }
  }

  return questionPool.pop();
}

// ⭐ 【全場每格問答】 (方案 A：答錯動態退回本回合擲骰前原格 originPos) + 藤蔓攀爬 + 暴龍爪痕跌落
function triggerTileQuizEvent(player, originPos) {
  const cellNum = player.pos;

  // 情況 A: 藤蔓起點格 (3, 10, 18, 22) -> 答對攀爬 (18 ➜ 29)，答錯退回原點 originPos!
  if (JUMPS[cellNum] && JUMPS[cellNum] > cellNum) {
    const jumpTarget = JUMPS[cellNum];
    const question = getNextQuestion("中", player) || getNextQuestion("易", player);
    quizTypeTag.textContent = "🌿 演化藤蔓攀升考驗！";
    quizTypeTag.style.color = "#2e7d32";

    setupQuizModal(question, (isCorrect) => {
      player.totalAnswers++;
      if (isCorrect) {
        player.correctAnswers++;
        player.consecutiveErrors = 0;
        playClimbTone();

        const vineFg = document.getElementById(`vine-${cellNum}-fg`);
        if (vineFg) {
          vineFg.setAttribute("stroke", "#76ff03");
          vineFg.setAttribute("stroke-width", "4");
          vineFg.style.filter = "drop-shadow(0 0 10px #76ff03)";
        }

        const tokenEl = document.getElementById(`token-${player.id}`);
        if (tokenEl) tokenEl.classList.add("climbing");

        player.pos = jumpTarget;
        updateTokenPosition(player);
        updateLeaderboard();
        updateMessage(`✅ 【${player.name}】 解答正確！順著發光藤蔓攀爬上升至第 ${jumpTarget} 格！`);
        addLog(`  -> 🌿 攀升成功：解答正確，攀爬升至第 ${jumpTarget} 格。`);

        setTimeout(() => {
          if (tokenEl) tokenEl.classList.remove("climbing");
          if (vineFg) {
            vineFg.setAttribute("stroke", "#8bc34a");
            vineFg.setAttribute("stroke-width", "2.5");
            vineFg.style.filter = "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))";
          }
          finishTurn();
        }, 1200);
      } else {
        player.consecutiveErrors++;
        player.pos = originPos;
        updateTokenPosition(player);
        updateLeaderboard();
        updateMessage(`❌ 【${player.name}】 答錯挑戰失敗！錯失藤蔓攀爬，退回第 ${originPos} 格原點！`);
        addLog(`  -> 🌿 攀升失敗：答錯退回第 ${originPos} 格原點。`);
        finishTurn();
      }
    });
    return;
  }

  // 情況 B: 暴龍陷阱格 (14, 20, 33, 35) -> 答錯驚動暴龍，三道爪痕切割+跌落！
  if (JUMPS[cellNum] && JUMPS[cellNum] < cellNum) {
    const jumpTarget = JUMPS[cellNum];
    const dinoEl = document.getElementById(`dino-${cellNum}`);

    if (player.immune) {
      player.immune = false;
      updateMessage(`🛡️ 【${player.name}】 消耗「暴龍免疫卡」，抵銷傷害安全留在原地！`);
      addLog(`  -> 🛡️ 免疫卡發動，抵銷暴龍傷害。`);
      finishTurn();
      return;
    }

    const question = getNextQuestion("難", player) || getNextQuestion("中", player);
    quizTypeTag.textContent = "🦖 暴龍襲擊生存挑戰！";
    quizTypeTag.style.color = "#b71c1c";

    setupQuizModal(question, (isCorrect) => {
      player.totalAnswers++;
      if (isCorrect) {
        player.correctAnswers++;
        player.consecutiveErrors = 0;
        playSleepTone();

        if (dinoEl) {
          dinoEl.classList.remove("dino-bite");
          dinoEl.classList.add("dino-sleep");
          dinoEl.textContent = "🦖💤";
        }

        updateMessage(`💤 【${player.name}】 解題精準！成功施打麻醉劑安撫暴龍，安全留在第 ${cellNum} 格！`);
        addLog(`  -> 🦖 暴龍危機化解：安撫暴龍，留在第 ${cellNum} 格。`);

        setTimeout(() => {
          if (dinoEl) {
            dinoEl.classList.remove("dino-sleep");
            dinoEl.textContent = "🦖";
          }
          finishTurn();
        }, 1500);
      } else {
        player.consecutiveErrors++;
        playDinoRoarTone();

        if (dinoEl) {
          dinoEl.textContent = "🦖🔥";
          dinoEl.classList.add("dino-bite");
        }

        boardFrame.classList.add("shake");

        // 觸發三道紅色爪痕切割動畫
        const fallGroup = document.getElementById(`fall-${cellNum}`);
        if (fallGroup) {
          fallGroup.style.display = "block";
          fallGroup.style.opacity = "1";
          Array.from(fallGroup.children).forEach(path => {
            path.classList.remove("do-slash");
            void path.offsetWidth;
            path.classList.add("do-slash");
          });
        }

        player.pos = jumpTarget;
        updateTokenPosition(player);
        updateLeaderboard();
        updateMessage(`💥 【${player.name}】 答錯驚動暴龍！慘遭爪痕重擊滑落跌退至第 ${jumpTarget} 格！`);
        addLog(`  -> 🦖 暴龍重擊：跌落至第 ${jumpTarget} 格。`);

        setTimeout(() => {
          boardFrame.classList.remove("shake");
          if (dinoEl) {
            dinoEl.classList.remove("dino-bite");
            dinoEl.textContent = "🦖";
          }
          if (fallGroup) {
            fallGroup.style.transition = "opacity 1s ease";
            fallGroup.style.opacity = "0";
            setTimeout(() => {
              fallGroup.style.display = "none";
              fallGroup.style.transition = "none";
            }, 1000);
          }
          finishTurn();
        }, 1500);
      }
    });
    return;
  }

  // 情況 C: 紅色環境變遷卡格 (5, 9, 12, 16, 23, 27, 30) -> 答對抽環境卡，答錯退回原點！
  if (RED_TILES.includes(cellNum)) {
    const question = getNextQuestion("中", player);
    quizTypeTag.textContent = "🌋 自然環境考驗挑戰！";
    quizTypeTag.style.color = "#d32f2f";

    setupQuizModal(question, (isCorrect) => {
      player.totalAnswers++;
      if (isCorrect) {
        player.correctAnswers++;
        player.consecutiveErrors = 0;
        updateMessage(`✅ 【${player.name}】 解答正確！觸發環境變遷卡試煉！`);
        triggerEnvironmentCard(player);
      } else {
        player.consecutiveErrors++;
        player.pos = originPos;
        updateTokenPosition(player);
        updateLeaderboard();
        updateMessage(`❌ 【${player.name}】 答錯挑戰失敗，錯失環境變遷試煉，退回第 ${originPos} 格原點！`);
        addLog(`  -> 🌋 試煉失敗：答錯退回第 ${originPos} 格原點。`);
        finishTurn();
      }
    });
    return;
  }

  // 情況 D: 普通安全格 -> 通過普通生物題，答錯退回原點！
  const question = getNextQuestion("易", player) || getNextQuestion("中", player);
  quizTypeTag.textContent = "🔍 叢林生物生存問答";
  quizTypeTag.style.color = "#0288d1";

  setupQuizModal(question, (isCorrect) => {
    player.totalAnswers++;
    if (isCorrect) {
      player.correctAnswers++;
      player.consecutiveErrors = 0;
      updateMessage(`✅ 【${player.name}】 答對生物題！安全在第 ${cellNum} 格整備休息！`);
      addLog(`  -> 🔍 【${player.name}】 答對題目，平安留在第 ${cellNum} 格。`);
    } else {
      player.consecutiveErrors++;
      player.pos = originPos;
      updateTokenPosition(player);
      updateLeaderboard();
      updateMessage(`❌ 【${player.name}】 答錯挑戰失敗！退回第 ${originPos} 格原點，下回合再接再勵！`);
      addLog(`  -> 🔍 【${player.name}】 答錯題目，退回第 ${originPos} 格原點。`);
    }
    finishTurn();
  });
}

function setupQuizModal(question, callback) {
  currentActiveQuestion = question;
  currentQuizCallback = callback;

  quizDiffTag.textContent = `難度：${question.difficulty || "中"}`;
  quizStem.innerHTML = highlightKeywords(question.question);

  quizFeedbackBox.classList.add("hidden");
  quizFeedbackBox.classList.remove("error-theme");
  quizChoices.innerHTML = "";

  question.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn-choice";
    btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
    btn.addEventListener("click", () => handleChoiceSelect(idx));
    quizChoices.appendChild(btn);
  });

  if (!isTimerDisabled) {
    quizTimerNum.classList.remove("hidden");
    quizTimeRemaining = 30;
    quizTimerNum.textContent = `${quizTimeRemaining}s`;
    clearInterval(quizTimerInterval);
    quizTimerInterval = setInterval(() => {
      quizTimeRemaining--;
      quizTimerNum.textContent = `${quizTimeRemaining}s`;
      if (quizTimeRemaining <= 0) {
        clearInterval(quizTimerInterval);
        handleChoiceSelect(-1);
      }
    }, 1000);
  } else {
    quizTimerNum.classList.add("hidden");
  }

  openModal(quizModal);
}

function handleChoiceSelect(selectedIdx) {
  clearInterval(quizTimerInterval);
  const isCorrect = (selectedIdx === currentActiveQuestion.answer);

  const btns = quizChoices.querySelectorAll(".btn-choice");
  btns.forEach((btn, i) => {
    btn.disabled = true; // 防誤觸防連點
    if (i === currentActiveQuestion.answer) btn.classList.add("correct");
    if (i === selectedIdx && !isCorrect) btn.classList.add("wrong");
  });

  if (isCorrect) {
    feedbackBanner.style.color = "var(--accent-green)";
    feedbackBanner.textContent = "🎉 答案正確！演化適應成功！";
  } else {
    feedbackBanner.style.color = "var(--accent-red)";
    feedbackBanner.textContent = (selectedIdx === -1) ? "⌛ 時間到！未能在時限內解答！" : "❌ 回答錯誤！觀念需要加強喔！";
    quizFeedbackBox.classList.add("error-theme");

    errorQuestionsLog.push({
      round: roundCounter,
      team: players[currentPlayerIndex].name,
      question: currentActiveQuestion.question,
      correctAnswer: currentActiveQuestion.options[currentActiveQuestion.answer],
      explanation: currentActiveQuestion.explanation
    });
  }

  feedbackMemoText.textContent = currentActiveQuestion.explanation || "本題暫無詳細觀念解析。";
  quizFeedbackBox.classList.remove("hidden");
}

function handleQuizFinish() {
  closeModal(quizModal);
  const btns = quizChoices.querySelectorAll(".btn-choice");
  const isCorrect = btns[currentActiveQuestion.answer].classList.contains("correct") &&
                    !quizFeedbackBox.classList.contains("error-theme");
  if (currentQuizCallback) currentQuizCallback(isCorrect);
}

function triggerEnvironmentCard(player) {
  const card = ENVIRONMENT_CARDS[Math.floor(Math.random() * ENVIRONMENT_CARDS.length)];
  natureCardIcon.textContent = card.isGood ? "🌟" : "🌋";
  natureCardName.textContent = card.name;
  natureCardDesc.textContent = card.desc;

  if (card.isGood) {
    natureCardBox.className = "card-box card-good";
  } else {
    natureCardBox.className = "card-box card-bad";
  }

  currentCardCallback = () => {
    card.action(player, players);
    updateLeaderboard();
    addLog(`  -> 🟥 觸發環境變遷卡：【${card.name}】`);
    finishTurn();
  };

  openModal(cardModal);
}

function handleCardAccept() {
  closeModal(cardModal);
  if (currentCardCallback) currentCardCallback();
}

function finishTurn() {
  isMoving = false; // 解鎖狀態
  updateLeaderboard();
  nextTurn();
}

function handleTimerTick() {
  if (timeLeft > 0) {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 100 && !isRushMode) activateRushMode();
  } else {
    clearInterval(gameTimer);
    timerClock.textContent = "00:00";
    updateMessage("🔔 鐘聲響起，逃生時間結束！遊戲結算！");
    showSummaryModal(null);
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerClock.textContent = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function activateRushMode() {
  isRushMode = true;
  rushBadge.classList.remove("hidden");
  timerClock.classList.add("rush");
  playRushAlarmTone();
  updateMessage("🔥 終極逃生模式啟動！全場骰子點數提升為 (4~6)，終點不反彈！");
}

function handleGameOver(winner) {
  clearInterval(gameTimer);
  updateMessage(`🏆 🎉 恭喜【${winner.name}】率先抵達第 36 格登上直升機，成功逃出侏羅紀叢林！`);
  addLog(`🎉 遊戲結束！冠軍為：${winner.name}`);
  showSummaryModal(winner);
}

function showSummaryModal(winner) {
  const summaryWinnerBox = document.getElementById("summaryWinnerBox");
  const top3WrongBox = document.getElementById("top3WrongBox");

  if (winner) {
    summaryWinnerBox.innerHTML = `🏆 冠軍隊伍：<span style="color:${winner.color}">${winner.name}</span> 成功抵達逃生直升機！`;
  } else {
    summaryWinnerBox.innerHTML = "🔔 鐘聲響起，課堂時間結束！統計戰報中...";
  }

  top3WrongBox.innerHTML = "";
  if (errorQuestionsLog.length === 0) {
    top3WrongBox.innerHTML = '<div style="color:#2e7d32; font-weight:bold;">🎉 全班表現優異！本次答題完全無錯題紀錄！</div>';
  } else {
    const top3 = errorQuestionsLog.slice(0, 3);
    top3.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "wrong-item-card";
      card.innerHTML = `
        <div class="wrong-item-title">[高頻錯題 ${idx + 1}] （作答隊伍：${item.team}）</div>
        <div><b>題目：</b> ${item.question}</div>
        <div class="wrong-item-ans"><b>正確解答：</b> ${item.correctAnswer}</div>
        <div class="wrong-item-exp"><b>觀念解析：</b> ${item.explanation}</div>
      `;
      top3WrongBox.appendChild(card);
    });
  }

  openModal(summaryModal);
}

function updateLeaderboard() {
  teamRankList.innerHTML = "";
  const sorted = [...players].sort((a, b) => b.pos - a.pos);

  sorted.forEach((p, idx) => {
    const li = document.createElement("li");
    li.className = `rank-item ${p.id === players[currentPlayerIndex]?.id ? "active" : ""}`;
    if (p.id === players[currentPlayerIndex]?.id) {
      li.style.setProperty("--pulse-color", p.color);
    }
    const shield = p.immune ? "🛡️" : "";
    li.innerHTML = `
      <div style="display:flex; align-items:center;">
        <span class="rank-color-badge" style="background-color:${p.color};"></span>
        <span>第 ${idx + 1} 名：${p.name}</span>
      </div>
      <div>
        <span style="color:#795548;">第 <b>${p.pos}</b> 格</span>
        <span>${shield}</span>
      </div>
    `;
    teamRankList.appendChild(li);
  });
}

function updateMessage(msg) { eventMsgBox.textContent = msg; }
function addLog(text) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  gameLog.push(`[${timeStr}] ${text}`);
}

function downloadGameLog() {
  if (gameLog.length === 0) {
    alert("目前尚無遊戲歷程紀錄！");
    return;
  }
  let content = "====================================================\n";
  content += "   🦖 侏羅紀叢林逃生記 - 課堂戰報與錯題分析歷程\n";
  content += "====================================================\n\n";
  content += `【遊玩模式】：${getModeDisplayName()}\n`;
  content += `【結算時間】：${new Date().toLocaleString()}\n\n`;
  content += "--- 🏆 最終逃生順位與答對率 ---\n";
  const sorted = [...players].sort((a, b) => b.pos - a.pos);
  sorted.forEach((p, idx) => {
    const acc = p.totalAnswers > 0 ? Math.round((p.correctAnswers / p.totalAnswers) * 100) : 0;
    content += `第 ${idx + 1} 名：${p.name} | 抵達第 ${p.pos} 格 | 答題次數: ${p.totalAnswers} | 答對率: ${acc}%\n`;
  });
  content += "\n--- 💡 課堂高頻錯題與觀念分析 ---\n";
  if (errorQuestionsLog.length === 0) {
    content += "太強了！本次遊戲沒有任何錯題記錄！\n";
  } else {
    errorQuestionsLog.forEach((err, i) => {
      content += `[錯題 ${i + 1}] 由 ${err.team} 作答\n`;
      content += `題目：${err.question}\n`;
      content += `正確答案：${err.correctAnswer}\n`;
      content += `觀念解析：${err.explanation}\n`;
      content += "----------------------------------------------------\n";
    });
  }
  content += "\n--- 📜 詳細行動歷程紀錄 ---\n" + gameLog.join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `侏羅紀課堂戰報_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function resetGame() {
  if (!confirm("確定要重設當前遊戲進度嗎？")) return;
  localStorage.removeItem("jurassic_snapshot");
  startGame();
}

// LocalStorage 快照機制
function saveSnapshot() {
  try {
    const snapshot = {
      players,
      currentPlayerIndex,
      roundCounter,
      timeLeft,
      isRushMode,
      unitFile: unitSelect.value,
      timestamp: new Date().getTime()
    };
    localStorage.setItem("jurassic_snapshot", JSON.stringify(snapshot));
  } catch (e) {}
}

function checkSnapshotOnLoad() {
  const saved = localStorage.getItem("jurassic_snapshot");
  if (saved) {
    openModal(snapshotModal);
  }
}

function restoreSnapshot() {
  const saved = localStorage.getItem("jurassic_snapshot");
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    players = data.players;
    currentPlayerIndex = data.currentPlayerIndex;
    roundCounter = data.roundCounter;
    timeLeft = data.timeLeft;
    isRushMode = data.isRushMode;

    initPlayerTokens();
    players.forEach(p => updateTokenPosition(p));
    updateLeaderboard();
    closeModal(snapshotModal);
    updateMessage("✅ 已成功復原上次戰局狀態！");
  } catch (e) {
    alert("快照損毀，開啟新遊戲。");
    closeModal(snapshotModal);
  }
}

// Web Audio (iPhone / iPad Safari 解鎖機制)
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playTone(freq, type, duration, delay = 0, vol = 0.1) {
  if (!soundToggle.checked || isTeacherFrozen) return;
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

function playDiceTone() { playTone(600, "sine", 0.1, 0); playTone(800, "sine", 0.1, 0.08); }
function playClimbTone() { for (let i = 0; i < 4; i++) playTone(300 + i * 100, "triangle", 0.15, i * 0.08); }
function playDinoRoarTone() { for (let i = 0; i < 6; i++) playTone(250 - i * 40, "sawtooth", 0.15, i * 0.08, 0.15); }
function playSleepTone() { playTone(200, "sine", 0.3, 0); playTone(150, "sine", 0.4, 0.3); }
function playRushAlarmTone() { playTone(400, "square", 0.1, 0); playTone(600, "square", 0.1, 0.1); playTone(800, "square", 0.4, 0.2); }
