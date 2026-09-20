/**
 * 侏羅紀叢林逃生記 - 專業教學強固版核心引擎
 * 支援 URL 參數解析、融合教育特教 (timer=off, 關鍵字高亮, 字體放大)、
 * LocalStorage 快照恢復、教師 Spacebar 凍結與課堂 Top 3 錯題統計總結。
 */

// 1. 基礎設定與常數
const TOTAL_CELLS = 36;
const JUMPS = { 3: 17, 10: 13, 18: 31, 22: 28, 14: 8, 20: 15, 33: 27, 35: 29 };
const RED_TILES = [5, 9, 12, 16, 23, 27, 30];

const TEAM_PRESETS = [
  { name: "紅隊 探險隊", color: "#e74c3c" },
  { name: "藍隊 探險隊", color: "#3498db" },
  { name: "綠隊 探險隊", color: "#2ecc71" },
  { name: "黃隊 探險隊", color: "#f1c40f" },
  { name: "紫隊 探險隊", color: "#9b59b6" },
  { name: "橘隊 探險隊", color: "#e67e22" }
];

const ENVIRONMENT_CARDS = [
  {
    id: "card_immune", name: "有利突變 🛡️", icon: "🛡️", isGood: true,
    desc: "個體產生了有利防禦特徵！獲得「暴龍免疫護盾」一張，下次遭遇暴龍直接抵消跌落傷害！",
    action: (player) => { player.immune = true; }
  },
  {
    id: "card_energy", name: "物資豐沛 ⚡", icon: "⚡", isGood: true,
    desc: "尋獲高熱量能量補給！活力充沛，本隊直接獲得「額外回合（再擲一次）」！",
    action: (player) => { player.extraTurn = true; }
  },
  {
    id: "card_mutualism", name: "互利共生 🤝", icon: "🤝", isGood: true,
    desc: "發揮同儕互助與群體適應！帶領目前排在最後一名的隊伍共同「前進 2 步」！",
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
    id: "card_selection", name: "天擇優勢 🏃", icon: "🏃", isGood: true,
    desc: "高度適應叢林地形！步伐輕盈敏捷，全隊立刻「向前躍進 2 步」！",
    action: (player) => {
      player.pos = Math.min(TOTAL_CELLS, player.pos + 2);
      updateTokenPosition(player);
    }
  },
  {
    id: "card_gene_swap", name: "優勢基因 🧬", icon: "🧬", isGood: true,
    desc: "演化大躍進！與目前領先在本隊前方的一支隊伍「互換位置」！(若已是第一名則前進 1 步)",
    action: (player, allPlayers) => {
      const aheadPlayers = allPlayers.filter(p => p.pos > player.pos).sort((a, b) => a.pos - b.pos);
      if (aheadPlayers.length > 0) {
        const target = aheadPlayers[0];
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
    id: "card_drought", name: "氣候乾旱 🌪️", icon: "🌪️", isGood: false,
    desc: "極端氣候帶來乾旱缺水！全隊體力消耗過大，隊伍暫停移動「後退 1 步」！",
    action: (player) => {
      player.pos = Math.max(0, player.pos - 1);
      updateTokenPosition(player);
    }
  },
  {
    id: "card_acid_rain", name: "酸雨侵襲 🌧️", icon: "🌧️", isGood: false,
    desc: "環境污染導致酸雨落山！路面溼滑難行，全隊「後退 2 步」！",
    action: (player) => {
      player.pos = Math.max(0, player.pos - 2);
      updateTokenPosition(player);
    }
  },
  {
    id: "card_invasive", name: "外來種入侵 🦗", icon: "🦗", isGood: false,
    desc: "外來物種搶奪大量食糧！本隊深受干擾，暫停一回合行動整備！",
    action: (player) => { player.skipTurn = true; }
  },
  {
    id: "card_volcano", name: "火山灰遮日 🌋", icon: "🌋", isGood: false,
    desc: "火山噴發遮蔽日光，視野迷茫！全隊迷失方向「後退 2 步」！",
    action: (player) => {
      player.pos = Math.max(0, player.pos - 2);
      updateTokenPosition(player);
    }
  },
  {
    id: "card_epidemic", name: "植物病蟲害 🐛", icon: "🐛", isGood: false,
    desc: "森林遭受病蟲害干擾，路徑受阻！拖累自身與相鄰隊伍「各後退 1 步」！",
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
  }
];

// 2. 狀態與全域變數
let players = [];
let currentPlayerIndex = 0;
let isMoving = false;
let roundCounter = 1;
let gameLog = [];
let errorQuestionsLog = [];
let questionBank = [];
let currentMode = "group-tablet";
let gameTimer = null;
let timeLeft = 15 * 60;
let isRushMode = false;
let isTimerDisabled = false; // 特教模式 timer=off
let isTeacherFrozen = false;
let currentActiveQuestion = null;
let quizTimerInterval = null;
let quizTimeRemaining = 30;
let currentQuizCallback = null;
let currentCardCallback = null;
let audioCtx = null;

// DOM
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
  btnRollDice.addEventListener("click", handleRollDice);
  btnReset.addEventListener("click", resetGame);
  btnManualMove.addEventListener("click", handleManualMove);
  btnDownloadLog.addEventListener("click", downloadGameLog);

  btnFreeze.addEventListener("click", toggleFreeze);
  btnUnfreeze.addEventListener("click", toggleFreeze);

  btnZoomFont.addEventListener("click", () => {
    document.body.classList.toggle("font-zoomed");
    btnZoomFont.textContent = document.body.classList.contains("font-zoomed") ? "🔍 標準字體" : "🔍 放大字體";
  });

  // 空白鍵一鍵凍結
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

  // Snapshot modal buttons
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

// 4. 動態題庫載入
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
    updateMessage(`單元題庫載入成功！共收錄 ${questionBank.length} 題。`);
    startGame();
  } catch (err) {
    console.error(err);
    updateMessage("⚠️ 題庫載入失敗，請確認 questions/ 目錄與 JSON 檔案！");
  }
}

// 5. 棋盤建立
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
        cellEl.innerHTML += `<div class="cell-emoji">🌿</div>`;
      } else {
        cellEl.innerHTML += `<div class="cell-emoji" id="dino-${num}">🦖</div>`;
      }
    } else if (num === TOTAL_CELLS) {
      cellEl.innerHTML += `<div class="cell-emoji">🚁</div>`;
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
    const startCell = parseInt(startStr);
    const endCell = JUMPS[startCell];
    const p1 = getCellCenterCoords(startCell);
    const p2 = getCellCenterCoords(endCell);

    const isLadder = endCell > startCell;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    if (isLadder) {
      path.setAttribute("d", `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
      path.setAttribute("class", "ladder-path");
    } else {
      const midX = (p1.x + p2.x) / 2 + 10;
      const midY = (p1.y + p2.y) / 2 - 10;
      path.setAttribute("d", `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`);
      path.setAttribute("class", "snake-path");
    }

    svgCanvas.appendChild(path);
  });
}

// 6. 遊戲開始與流程
function startGame() {
  clearInterval(gameTimer);
  players = [];
  gameLog = [];
  errorQuestionsLog = [];
  roundCounter = 1;
  isRushMode = false;
  rushBadge.classList.add("hidden");
  timerClock.classList.remove("rush");

  let teamCount = (currentMode === "solo") ? 1 : 4;
  const offsets = [
    { x: -3.5, y: -3.5 }, { x: 0, y: -3.5 }, { x: 3.5, y: -3.5 },
    { x: -3.5, y: 3.5 },  { x: 0, y: 3.5 },  { x: 3.5, y: 3.5 }
  ];

  for (let i = 0; i < teamCount; i++) {
    players.push({
      id: i,
      name: (currentMode === "solo") ? "自主探險家" : TEAM_PRESETS[i].name,
      color: TEAM_PRESETS[i].color,
      pos: 0,
      offset: offsets[i],
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
  addLog(`=== 遊戲開始 (模式：${getModeDisplayName()}) ===`);

  currentPlayerIndex = 0;
  nextTurn(true);
}

function getModeDisplayName() {
  if (currentMode === "projector") return "全班大螢幕投影主持";
  if (currentMode === "solo") return "個人自主挑戰";
  return "各組平板輪流競賽";
}

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
      if (c.includes("stick-head")) partEl.style.backgroundColor = "#fff";
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
  currentTeamName.textContent = curPlayer.name;
  currentTeamName.style.color = curPlayer.color;

  if (currentMode === "group-tablet") {
    currentRoleNote.textContent = `本回合答題手：第 ${curPlayer.turnMemberIdx} 棒組員`;
    curPlayer.turnMemberIdx = (curPlayer.turnMemberIdx % 4) + 1;
  } else {
    currentRoleNote.textContent = "輪到本隊投擲骰子！";
  }

  btnRollDice.disabled = false;
  btnRollDice.style.backgroundColor = curPlayer.color;
  updateMessage(`請 【${curPlayer.name}】 點擊擲骰子開始前進！`);
}

function handleRollDice() {
  if (isMoving || isTeacherFrozen) return;
  isMoving = true;
  btnRollDice.disabled = true;

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
  const stepsStr = prompt("【教師專用】請輸入欲指定前進的步數 (1~6)：", "3");
  if (!stepsStr) return;
  const steps = parseInt(stepsStr, 10);
  if (isNaN(steps) || steps < 1 || steps > 6) {
    alert("請輸入有效的 1~6 數字！");
    return;
  }
  btnRollDice.disabled = true;
  diceResultDisplay.textContent = steps;
  addLog(`[教師指定] 【${players[currentPlayerIndex].name}】 前進 ${steps} 步`);
  movePlayer(players[currentPlayerIndex], steps);
}

function movePlayer(player, steps) {
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

    if (JUMPS[player.pos]) {
      const jumpTarget = JUMPS[player.pos];
      if (jumpTarget > player.pos) {
        triggerVineChallenge(player, jumpTarget);
      } else {
        triggerDinoCrisis(player, jumpTarget);
      }
    } else if (RED_TILES.includes(player.pos)) {
      triggerEnvironmentCard(player);
    } else {
      finishTurn();
    }
  }, 700);
}

// 7. 題目高亮與特教輔助
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

function getQuestionByDifficulty(preferredDiff, player) {
  if (!questionBank || questionBank.length === 0) return null;
  if (player && player.consecutiveErrors >= 2) {
    const easyPool = questionBank.filter(q => q.difficulty === "易");
    if (easyPool.length > 0) return easyPool[Math.floor(Math.random() * easyPool.length)];
  }
  let pool = questionBank.filter(q => q.difficulty === preferredDiff);
  if (pool.length === 0) pool = questionBank;
  return pool[Math.floor(Math.random() * pool.length)];
}

function triggerVineChallenge(player, jumpTarget) {
  const question = getQuestionByDifficulty("中", player) || getQuestionByDifficulty("易", player);
  if (!question) {
    updateMessage("題庫已空，直接通過！");
    finishTurn();
    return;
  }

  quizTypeTag.textContent = "🌿 演化藤蔓攀升挑戰";
  quizTypeTag.style.color = "#2e7d32";

  setupQuizModal(question, (isCorrect) => {
    player.totalAnswers++;
    if (isCorrect) {
      player.correctAnswers++;
      player.consecutiveErrors = 0;
      playClimbTone();
      player.pos = jumpTarget;
      updateTokenPosition(player);
      updateMessage(`✅ 【${player.name}】 解答正確！順利攀升至第 ${jumpTarget} 格！`);
      addLog(`  -> 🌿 攀升成功：躍升至第 ${jumpTarget} 格。`);
    } else {
      player.consecutiveErrors++;
      updateMessage(`❌ 【${player.name}】 答錯了，安全留在原地。`);
      addLog(`  -> 🌿 攀升失敗：留在原第 ${player.pos} 格。`);
    }
    finishTurn();
  });
}

function triggerDinoCrisis(player, jumpTarget) {
  if (player.immune) {
    player.immune = false;
    updateMessage(`🛡️ 【${player.name}】 消耗「暴龍免疫護盾」，抵銷攻擊安全留在原地！`);
    addLog(`  -> 🛡️ 免疫護盾抵銷暴龍傷害，留在第 ${player.pos} 格。`);
    finishTurn();
    return;
  }

  const question = getQuestionByDifficulty("難", player) || getQuestionByDifficulty("中", player);
  quizTypeTag.textContent = "🦖 暴龍尾巴生存挑戰！";
  quizTypeTag.style.color = "#b71c1c";

  setupQuizModal(question, (isCorrect) => {
    player.totalAnswers++;
    if (isCorrect) {
      player.correctAnswers++;
      player.consecutiveErrors = 0;
      updateMessage(`💤 【${player.name}】 解題精準！成功安撫暴龍，安全留在原地！`);
      addLog(`  -> 🦖 暴龍危機化解：成功留在第 ${player.pos} 格。`);
    } else {
      player.consecutiveErrors++;
      playDinoRoarTone();
      boardFrame.classList.add("board-shake");
      setTimeout(() => boardFrame.classList.remove("board-shake"), 500);

      player.pos = jumpTarget;
      updateTokenPosition(player);
      updateMessage(`💥 【${player.name}】 驚動暴龍慘遭擊退！跌退回第 ${jumpTarget} 格！`);
      addLog(`  -> 🦖 暴龍重擊：跌退至第 ${jumpTarget} 格。`);
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
  natureCardIcon.textContent = card.icon;
  natureCardName.textContent = card.name;
  natureCardDesc.textContent = card.desc;

  if (card.isGood) {
    natureCardBox.classList.remove("bad-card");
  } else {
    natureCardBox.classList.add("bad-card");
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
  isMoving = false;
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
  updateMessage(`🏆 🎉 恭喜【${winner.name}】率先抵達第 36 格，成功逃出侏羅紀叢林！`);
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
    // 前 3 題錯題展示
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

// 8. LocalStorage 快照機制
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

// 9. Web Audio
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

function playDiceTone() { playTone(550, "sine", 0.08, 0); }
function playClimbTone() { for (let i = 0; i < 4; i++) playTone(320 + i * 110, "triangle", 0.15, i * 0.08); }
function playDinoRoarTone() { for (let i = 0; i < 5; i++) playTone(220 - i * 35, "sawtooth", 0.15, i * 0.08, 0.15); }
function playRushAlarmTone() { playTone(440, "square", 0.1, 0); playTone(660, "square", 0.1, 0.1); playTone(880, "square", 0.35, 0.2); }
