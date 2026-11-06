
function cleanUnitTitle(raw) {
  if (!raw) return '精選題庫';
  let str = decodeURIComponent(String(raw)).trim();
  str = str.replace(/[\(（]\s*派卷鎖定\s*[\)）]/g, '').trim();
  str = str.replace(/^課堂指定單元\s*[:：]?\s*/, '').trim();
  if (str.startsWith('(') && str.endsWith(')')) str = str.slice(1, -1).trim();
  if (str.startsWith('（') && str.endsWith('）')) str = str.slice(1, -1).trim();
  if (str.includes(' - ')) {
    const parts = str.split(' - ');
    str = parts[parts.length - 1].trim();
  }
  str = str.replace(/^.*[\\\/]/, '');
  str = str.replace(/\.json$/i, '').trim();
  str = str.replace(/^[\(（]/, '').replace(/[\)）]$/, '').trim();
  str = str.replace(/^(翰林版|康軒版|南一版|翰林|康軒|南一)[_\s-]*/i, '');
  str = str.replace(/^[a-zA-Z]+[0-9]*[_\s-]+/, '');
  return str || raw;
}

/**
 * 動物方城市生物大富翁 (Zootopia Bio Monopoly) - 專業教學強固版引擎 V3.8
 * 1. 嚴格鎖死答錯蓋房漏洞：答錯 100% 隱藏蓋房按鈕，只顯示「❌ 答錯扣分關閉」，絕無法進入蓋房流程。
 * 2. 跨裝置響應式 10x8 網格防裁切：電腦與 iPad 橫向模式下，最底部 8 列與動物 Token 100% 完整呈現在畫面上！
 * 3. 徹底修復「🔍 放大題目」按鈕：全域動態連動，點擊後題目與選項字體強制放大 150%！
 * 4. 8 大 Zootopia 大臉 Token + 領地頭像標籤 + 中央計分板【得分 + 🏠 房屋棟數】雙指標。
 */

// 8 大 Zootopia 競賽隊伍 / 角色設定
const ALL_TEAMS = [
  { id: 0, name: "茱蒂兔兔隊", icon: "🐰", color: "#0284c7" },
  { id: 1, name: "尼克狐狸隊", icon: "🦊", color: "#ea580c" },
  { id: 2, name: "快快樹懶隊", icon: "🦥", color: "#ca8a04" },
  { id: 3, name: "蠻牛局長隊", icon: "🦬", color: "#16a34a" },
  { id: 4, name: "獅丁市長隊", icon: "🦁", color: "#dc2626" },
  { id: 5, name: "洪金豹警官隊", icon: "🐆", color: "#d97706" },
  { id: 6, name: "狼群警衛隊", icon: "🐺", color: "#475569" },
  { id: 7, name: "羊駝探險隊", icon: "🦙", color: "#9333ea" }
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
const btnSubmitScore = document.getElementById("btnSubmitScore");
const btnSubmitFromHistory = document.getElementById("btnSubmitFromHistory");
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
  document.getElementById("diceStage")?.addEventListener("click", () => startDraw(false));
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
  if (btnHistory) btnHistory.addEventListener("click", openHistory);
  if (btnSubmitScore) btnSubmitScore.addEventListener("click", triggerMonopolyScoreSubmit);
  if (btnSubmitFromHistory) btnSubmitFromHistory.addEventListener("click", triggerMonopolyScoreSubmit);
  btnSettings.addEventListener("click", openSettings);

  btnCloseSettings.addEventListener("click", () => closeModal(settingsModal));
  btnSaveSettings.addEventListener("click", saveSettings);
  fileInput.addEventListener("change", handleFileUpload);

  btnCloseChance.addEventListener("click", () => {
    closeModal(chanceModal);
    const txt = chanceDesc.textContent || "";
    if (txt.includes("向前飛躍 3 格")) {
      startJumping(3, true, true);
    } else if (txt.includes("自由指定生物題目單元")) {
      openSettings();
    } else {
      endTurn();
    }
  });

  btnCloseDestiny.addEventListener("click", () => {
    closeModal(destinyModal);
    const txt = destinyDesc.textContent || "";
    if (txt.includes("退後 2 格")) {
      startBackwardJumping(2, true);
    } else {
      endTurn();
    }
  });

  btnCloseNovelty.addEventListener("click", () => { closeModal(noveltyModal); triggerQuizEvent(); });

  btnConfirmAnswer.addEventListener("click", () => {
    if (!isCurrentQuizAnsweredCorrectly) {
      alert("⚠️ 作答未完成或答錯題目，嚴格禁止建立或強佔領地！");
      return;
    }
    closeModal(quizModal);
    const curTeam = teams[currentTurnIndex];
    const requiredCost = isTakeoverMode ? 150 : 100;

    if (curTeam.score < requiredCost) {
      // 💰 金幣不足蓋房/強佔：平順領獎金並結束本輪 (防死鎖)
      addHistoryLog(curTeam.name, `💰 答對獲得 +50 金幣，因金幣不足 ${requiredCost} 放棄建立領地。`);
      endTurn();
      return;
    }

    if (isTakeoverMode) {
      executeTakeoverOptionA();
    } else {
      openBuildModal();
    }
  });

  btnCloseWrong.addEventListener("click", () => {
    closeModal(quizModal);
    endTurn();
  });

  const btnCancelBuild = document.getElementById("btnCancelBuild");
  if (btnCancelBuild) {
    btnCancelBuild.addEventListener("click", () => {
      closeModal(buildModal);
      addHistoryLog(teams[currentTurnIndex].name, `🏠 答對獲得 +50 金幣，選擇保留資金暫不建立領地。`);
      endTurn();
    });
  }

  btnConfirmBuild.addEventListener("click", confirmBuildHouse);

  btnCloseHistory.addEventListener("click", () => closeModal(historyModal));
  btnExportCSV.addEventListener("click", exportHistoryCSV);

  btnRestoreSnapshot.addEventListener("click", restoreSnapshot);
  btnDiscardSnapshot.addEventListener("click", () => {
    closeModal(snapshotModal);
    localStorage.removeItem("monopoly_snapshot_v3.9");
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
      opt.textContent = u.title;
      selectUnit.appendChild(opt);
    });

    for (const u of allManifestUnits) {
      const qRes = await fetch(`../questions/${u.file}`);
      if (qRes.ok) {
        const qData = await qRes.json();
        rawQuestionsByUnit[u.file] = qData.questions || [];
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const unitParam = urlParams.get("unit") || urlParams.get("file");

    if (unitParam) {
      const decoded = decodeURIComponent(unitParam).trim();
      const match = allManifestUnits.find(u => u.file === decoded || u.id === decoded);
      if (match) {
        selectUnit.value = match.file;
      } else {
        const customOpt = document.createElement("option");
        customOpt.value = decoded;
        customOpt.textContent = (typeof cleanUnitTitle === "function" ? cleanUnitTitle(decoded) : decoded);
        selectUnit.appendChild(customOpt);
        selectUnit.value = decoded;
        const fetchPath = decoded.endsWith(".json") ? `../questions/${decoded}` : `../questions/${decoded}.json`;
        fetch(fetchPath).then(r => r.json()).then(d => {
          rawQuestionsByUnit[decoded] = d.questions || [];
        }).catch(e => {});
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
let isCurrentQuizAnsweredCorrectly = false;

// 4. 初始化競賽隊伍與 10x8 棋盤 (共 28 格)
let studentRoster = [];
let soloCurrentStudent = null;

function parseStudentRoster() {
  const txt = (inputStudents && inputStudents.value) ? inputStudents.value.trim() : "";
  if (!txt) return [];
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const parts = line.split(/[,，\t\s]+/);
    if (parts.length >= 2) {
      return { seat: parts[0].trim(), name: parts[1].trim() };
    }
    return { seat: String(idx + 1).padStart(2, "0"), name: line };
  });
}

function initTeamsAndBoard() {
  studentRoster = parseStudentRoster();
  
  if (gameMode === "solo" && studentRoster.length > 0) {
    // 個人模式：直接從名單中挑選或建立隊伍（上限可支援全班或8組隨機個人）
    const count = Math.min(activeTeamCount, studentRoster.length);
    teams = studentRoster.slice(0, count).map((st, idx) => {
      const template = ALL_TEAMS[idx % ALL_TEAMS.length];
      return {
        id: idx,
        name: `${st.seat}號 ${st.name}`,
        icon: template.icon,
        color: template.color,
        score: 600,
        pos: 0,
        buildingsCount: 0,
        consecutiveWrongCount: 0,
        shields: 0,
        doubleScore: false,
        skipTurns: 0,
        freeBuild: false
      };
    });
  } else {
    teams = ALL_TEAMS.slice(0, activeTeamCount).map(t => ({
      ...t,
      score: 600,
      pos: 0,
      buildingsCount: 0,
      consecutiveWrongCount: 0,
      shields: 0,
      doubleScore: false,
      skipTurns: 0,
      freeBuild: false
    }));
  }

  currentTurnIndex = 0;
  currentTileIndex = 0;
  usedBuildingNames = new Set();
  cellOwners = {};

  modeTag.textContent = gameMode === "group" ? `👥 小組競賽 (${teams.length} 隊)` : `👤 個人競賽 (${teams.length} 人)`;
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
    const shieldTag = (t.shields > 0) ? `<span style="color:#38bdf8;" title="持有生物免疫護盾"> 🛡️x${t.shields}</span>` : "";
    const doubleTag = t.doubleScore ? `<span style="color:#ec4899;" title="下題得分翻倍"> ⚡x2</span>` : "";
    const freeBuildTag = t.freeBuild ? `<span style="color:#10b981;" title="持有免答開工證"> 🏗️</span>` : "";
    const assistTag = (t.consecutiveWrongCount >= 2) ? `<span style="color:#ef4444;font-size:11px;" title="已觸發答錯扶助鷹架"> 🆘扶助中</span>` : "";
    card.innerHTML = `
      <span>${t.icon} ${t.name}${shieldTag}${doubleTag}${freeBuildTag}${assistTag}</span>
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
    if (tok) {
      tok.style.display = i < activeTeamCount ? "flex" : "none";
      const teamObj = teams.find(t => t.id === i) || ALL_TEAMS[i];
      if (teamObj) {
        tok.style.borderColor = teamObj.color;
        tok.style.boxShadow = `0 4px 10px ${teamObj.color}55, 0 0 0 2.5px ${teamObj.color}`;
      }
    }
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

// 5. 擲骰子與動態彈跳位移 (極速流暢模式)
function startDraw(isQuick = false) {
  if (isDrawing || isTeacherFrozen) return;
  const curTeam = teams[currentTurnIndex];
  if (!curTeam) return;

  // 檢查是否處於暫停回合狀態 (例如極端氣候/病原體考驗)
  if (curTeam.skipTurns && curTeam.skipTurns > 0) {
    curTeam.skipTurns--;
    alert(`❄️【暫停一輪】${curTeam.name} 目前處於生態休眠/暫停狀態，跳過本輪擲骰！`);
    addHistoryLog(curTeam.name, `❄️ 處於暫停狀態，跳過本輪行動。`);
    endTurn();
    return;
  }

  unlockAudioContext();
  isDrawing = true;
  isNoBuildMoveTurn = false;

  const diceVal = Math.floor(Math.random() * 6) + 1;
  const diceCube = document.getElementById("diceCube");

  // 3D 旋轉各點數對應角度
  const diceRotations = {
    1: "rotateX(0deg) rotateY(0deg)",
    2: "rotateX(0deg) rotateY(90deg)",
    3: "rotateX(-90deg) rotateY(0deg)",
    4: "rotateX(90deg) rotateY(0deg)",
    5: "rotateX(0deg) rotateY(-90deg)",
    6: "rotateX(0deg) rotateY(180deg)"
  };

  playWinSound();

  if (diceCube && !isQuick) {
    diceCube.classList.remove("is-rolling");
    void diceCube.offsetWidth;
    diceCube.style.setProperty("--dice-final-transform", diceRotations[diceVal]);
    diceCube.classList.add("is-rolling");
    diceResultBanner.textContent = `🎲 ${curTeam.name} 正在擲骰子...`;

    setTimeout(() => {
      diceResultBanner.textContent = `🎲 ${curTeam.name} 擲出了 ${diceVal} 點！前進 ${diceVal} 格！`;
      startJumping(diceVal, isQuick);
    }, 550);
  } else {
    if (diceCube) {
      diceCube.style.transform = diceRotations[diceVal];
    }
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
    if (document.getElementById(`box-${curTeam.pos}`)) {
      document.getElementById(`box-${curTeam.pos}`).style.display = "none";
    }
    curTeam.pos = (curTeam.pos + 1) % 28;
    const boxEl = document.getElementById(`box-${curTeam.pos}`);
    if (boxEl) {
      boxEl.style.display = "block";
      boxEl.style.borderColor = curTeam.color;
      boxEl.style.backgroundColor = curTeam.color + "33";
      boxEl.style.boxShadow = `0 0 12px ${curTeam.color}88 inset, 0 0 8px ${curTeam.color}66`;
    }

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
          endTurn();
        } else {
          handleTileLanding();
        }
      }, 450);
    }
  };
  stepRun();
}

function startBackwardJumping(steps, isQuick = true) {
  let speed = isQuick ? 80 : 120;
  const curTeam = teams[currentTurnIndex];
  const tok = document.getElementById(`token-${curTeam.id}`);
  isNoBuildMoveTurn = true;

  const stepBackRun = () => {
    if (document.getElementById(`box-${curTeam.pos}`)) {
      document.getElementById(`box-${curTeam.pos}`).style.display = "none";
    }
    curTeam.pos = (curTeam.pos - 1 + 28) % 28;
    const boxEl = document.getElementById(`box-${curTeam.pos}`);
    if (boxEl) {
      boxEl.style.display = "block";
      boxEl.style.borderColor = curTeam.color;
      boxEl.style.backgroundColor = curTeam.color + "33";
      boxEl.style.boxShadow = `0 0 12px ${curTeam.color}88 inset, 0 0 8px ${curTeam.color}66`;
    }

    playTickSound();

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
      setTimeout(stepBackRun, speed);
    } else {
      setTimeout(() => {
        addHistoryLog(curTeam.name, `🔙 倒退就定位，安全抵達第 ${curTeam.pos + 1} 格 (不領起點獎勵)`);
        endTurn();
      }, 400);
    }
  };
  stepBackRun();
}

// 6. 踩格觸發事件與彈窗
let currentActiveCardType = null;
let currentActiveCardText = "";

function applyChanceCardEffect(cardText, curTeam) {
  if (cardText.includes("光合作用加速") || cardText.includes("免答開工證")) {
    curTeam.freeBuild = true;
  } else if (cardText.includes("向前飛躍 3 格")) {
    // Handled on modal close
  } else if (cardText.includes("生物免疫護盾")) {
    curTeam.shields = (curTeam.shields || 0) + 1;
  } else if (cardText.includes("光合作用") && cardText.includes("全隊積分 +20")) {
    curTeam.score += 20;
  } else if (cardText.includes("物種繁衍") && cardText.includes("全隊積分 +15")) {
    curTeam.score += 15;
  } else if (cardText.includes("雙倍得分卡")) {
    curTeam.doubleScore = true;
  } else if (cardText.includes("互利共生")) {
    // 與另一隊各加 15
    const otherTeam = teams.find(t => t.id !== curTeam.id);
    if (otherTeam) otherTeam.score += 15;
    curTeam.score += 15;
  } else if (cardText.includes("有利突變")) {
    curTeam.score += 20;
    curTeam.freeBuild = true;
  } else if (cardText.includes("保護區設立")) {
    curTeam.freeBuild = true;
  } else {
    curTeam.score += 20; // 基礎幸運金
  }
  renderScoreBar();
}

function applyDestinyCardEffect(cardText, curTeam) {
  // 若持有護盾，優先抵銷處罰！
  if (curTeam.shields && curTeam.shields > 0) {
    curTeam.shields--;
    alert(`🛡️【生物免疫護盾啟動】成功抵擋本次生態考驗與處罰！`);
    addHistoryLog(curTeam.name, `🛡️ 生物免疫護盾抵擋了：${cardText}`);
    renderScoreBar();
    return;
  }

  if (cardText.includes("暫停一輪") || cardText.includes("停留原格一輪")) {
    curTeam.skipTurns = (curTeam.skipTurns || 0) + 1;
  } else if (cardText.includes("外來種入侵") || cardText.includes("扣除 10 分")) {
    curTeam.score = Math.max(0, curTeam.score - 10);
  } else if (cardText.includes("優養化打擊") || cardText.includes("扣除分數 15")) {
    curTeam.score = Math.max(0, curTeam.score - 15);
  } else if (cardText.includes("退後 2 格")) {
    // Handled on modal close via startBackwardJumping
  } else if (cardText.includes("互換位置")) {
    const sorted = [...teams].sort((a, b) => a.score - b.score);
    const lastTeam = sorted[0];
    if (lastTeam && lastTeam.id !== curTeam.id) {
      const tempPos = curTeam.pos;
      curTeam.pos = lastTeam.pos;
      lastTeam.pos = tempPos;
      updateCoordinates();
      addHistoryLog(curTeam.name, `🐺 與【${lastTeam.name}】互換了棋盤位置！`);
    }
  }
  renderScoreBar();
}

function handleTileLanding() {
  const curTeam = teams[currentTurnIndex];
  const pos = curTeam.pos;

  if (pos === 14) {
    playWinSound();
    const cardText = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
    currentActiveCardType = "chance";
    currentActiveCardText = cardText;
    chanceDesc.textContent = cardText;
    applyChanceCardEffect(cardText, curTeam);
    addHistoryLog(curTeam.name, `✨ 踩中【閃亮機會】：${cardText}`);
    openModal(chanceModal);

  } else if ([7, 21].includes(pos)) {
    playWrongSound();
    const cardText = DESTINY_CARDS[Math.floor(Math.random() * DESTINY_CARDS.length)];
    currentActiveCardType = "destiny";
    currentActiveCardText = cardText;
    destinyDesc.textContent = cardText;
    applyDestinyCardEffect(cardText, curTeam);
    addHistoryLog(curTeam.name, `💢 踩中【驚奇命運】：${cardText}`);
    openModal(destinyModal);

  } else {
    // 若持有免答開工證，可直接進入建設領地！
    if (curTeam.freeBuild) {
      curTeam.freeBuild = false;
      renderScoreBar();
      alert(`⚡【免答開工證發威】${curTeam.name} 直接獲得建設領地資格，無需答題！`);
      isCurrentQuizAnsweredCorrectly = true;
      openBuildModal();
      return;
    }

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
  isCurrentQuizAnsweredCorrectly = false; // 預設 100% 重設為未答對

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

  // 防作弊核心：重設按鈕 100% 預設隱藏並禁用，作答前絕不開放
  btnConfirmAnswer.classList.add("hidden");
  btnConfirmAnswer.setAttribute("disabled", "true");
  btnCloseWrong.classList.add("hidden");

  // 鷹架扶助計算：連續答錯 2 次及以上，啟動二選一刪去救生圈
  const curTeam = teams[currentTurnIndex];
  const wrongStreak = curTeam ? (curTeam.consecutiveWrongCount || 0) : 0;
  let eliminatedIndices = new Set();

  if (wrongStreak >= 2 && currentActiveQuestion.options && currentActiveQuestion.options.length > 2) {
    const wrongIndices = [];
    currentActiveQuestion.options.forEach((_, idx) => {
      if (idx !== currentActiveQuestion.answer) wrongIndices.push(idx);
    });
    // 隨機刪除 1~2 個錯誤選項
    wrongIndices.sort(() => Math.random() - 0.5);
    const toEliminateCount = Math.min(wrongIndices.length - 1, (wrongStreak >= 3 ? 2 : 1));
    for (let i = 0; i < toEliminateCount; i++) {
      eliminatedIndices.add(wrongIndices[i]);
    }
  }

  currentActiveQuestion.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn-option";
    
    if (eliminatedIndices.has(idx)) {
      btn.innerHTML = `<del><b>${String.fromCharCode(65 + idx)}.</b> ${optText}</del> <span style="font-size:12px;color:#ef4444;">(智慧刪去)</span>`;
      btn.disabled = true;
      btn.style.opacity = "0.35";
      btn.style.filter = "grayscale(100%)";
      btn.style.cursor = "not-allowed";
    } else {
      btn.innerHTML = `<b>${String.fromCharCode(65 + idx)}.</b> ${optText}`;
      btn.addEventListener("click", () => handleQuizSelect(idx, btn));
    }
    quizOptions.appendChild(btn);
  });

  if (eliminatedIndices.size > 0) {
    const aidBadge = document.createElement("div");
    aidBadge.className = "aid-badge-banner";
    aidBadge.style.cssText = "background:#fef2f2;border:1.5px dashed #ef4444;color:#b91c1c;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:700;margin-bottom:10px;text-align:center;";
    aidBadge.innerHTML = `🆘【生態守護扶助已啟動】因連續答錯 ${wrongStreak} 次，系統已為貴隊智慧刪除 ${eliminatedIndices.size} 個干擾選項，並延長時間！`;
    quizOptions.prepend(aidBadge);
  }

  quizBox.classList.toggle("zoomed-text", isTextZoomed);
  startCountdownTimer();
  openModal(quizModal);
}

function startCountdownTimer() {
  if (!timerEnabled) {
    quizTimerBanner.textContent = "⏱️ 計時器：無限制時間";
    return;
  }
  const curTeam = teams[currentTurnIndex];
  // 若有連續答錯扶助，時間額外 +10 秒
  const extraTime = (curTeam && curTeam.consecutiveWrongCount >= 2) ? 10 : 0;
  let timeLeft = 30 + extraTime;
  quizTimerBanner.textContent = `⏱️ 倒數計時：${timeLeft} 秒${extraTime > 0 ? " (已補貼10秒援助)" : ""}`;
  clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    if (isTeacherFrozen) return; // 教師凍結時倒數暫停！
    timeLeft--;
    quizTimerBanner.textContent = `⏱️ 倒數計時：${timeLeft} 秒${extraTime > 0 ? " (已補貼10秒援助)" : ""}`;
    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      handleQuizTimeout();
    }
  }, 1000);
}

function handleQuizTimeout() {
  quizTimerBanner.textContent = "🚨 時間到！作答逾時！";
  const curTeam = teams[currentTurnIndex];
  isCurrentQuizAnsweredCorrectly = false;

  // 逾時停用所有選項按鈕
  quizOptions.querySelectorAll("button").forEach(btn => {
    btn.disabled = true;
    btn.style.pointerEvents = "none";
  });

  playWrongSound();
  explanationText.textContent = "作答時間已截止！觀念提示：" + (currentActiveQuestion.explanation || "平時多複習生物核心觀念，下次加快速度！");
  quizExplanation.classList.remove("hidden");

  // 累加連續答錯
  if (curTeam) curTeam.consecutiveWrongCount = (curTeam.consecutiveWrongCount || 0) + 1;

  btnConfirmAnswer.classList.add("hidden");
  btnConfirmAnswer.setAttribute("disabled", "true");
  btnCloseWrong.textContent = "⌛ 作答逾時！關閉結束本輪 ➡️";
  btnCloseWrong.classList.remove("hidden");

  addHistoryLog(curTeam ? curTeam.name : "隊伍", `⌛ 作答逾時：【${currentActiveQuestion.question.slice(0, 15)}...】`);
  renderScoreBar();
}

// 8. 答題結算 (嚴格防偷雞鎖定：首次點選即停用所有選項，防止改答或連點)
function handleQuizSelect(selectedIndex, btnEl) {
  clearInterval(countdownTimer);

  // 🔒 核心防弊：立即停用全部選項，防偷點、連點、改答！
  quizOptions.querySelectorAll("button").forEach(btn => {
    btn.disabled = true;
    btn.style.pointerEvents = "none";
  });

  const isCorrect = (selectedIndex === currentActiveQuestion.answer);
  const curTeam = teams[currentTurnIndex];

  if (isCorrect) {
    isCurrentQuizAnsweredCorrectly = true;
    btnEl.classList.add("correct");
    playFanfare();
    explanationText.textContent = currentActiveQuestion.explanation || "恭喜答對！獲得建置生態領地的資格！";
    quizExplanation.classList.remove("hidden");

    let rewardCoins = 50;
    if (curTeam.doubleScore) {
      rewardCoins = 100;
      curTeam.doubleScore = false;
      addHistoryLog(curTeam.name, "⚡【雙倍得分卡生效】本題答對獎金翻倍為 +100 金幣！");
    }

    curTeam.score += rewardCoins;
    
    // 答對時重置連續答錯計數
    curTeam.consecutiveWrongCount = 0;

    addHistoryLog(curTeam.name, `✅ 答對題目：【${currentActiveQuestion.question.slice(0, 15)}...】(+${rewardCoins}金幣)`);
    renderScoreBar();

    const requiredCost = isTakeoverMode ? 150 : 100;
    if (curTeam.score < requiredCost) {
      btnConfirmAnswer.textContent = `💰 答對領取 +${rewardCoins} 金幣！（金幣不足 ${requiredCost} 無法蓋房，結束本輪 ➡️）`;
    } else {
      if (isTakeoverMode) {
        btnConfirmAnswer.textContent = "⚔️ 答對成功！支付 150 金幣強行佔領領地 🏰";
      } else {
        btnConfirmAnswer.textContent = "✅ 答對成功！支付 100 金幣前往建立領地 🏰";
      }
    }

    btnConfirmAnswer.classList.remove("hidden");
    btnConfirmAnswer.removeAttribute("disabled");
    btnCloseWrong.classList.add("hidden");

  } else {
    isCurrentQuizAnsweredCorrectly = false;
    btnEl.classList.add("incorrect");

    // 高亮顯示正解，供課堂教學觀摩
    const allBtns = quizOptions.querySelectorAll("button");
    if (allBtns[currentActiveQuestion.answer]) {
      allBtns[currentActiveQuestion.answer].classList.add("correct");
    }

    playWrongSound();
    explanationText.textContent = currentActiveQuestion.explanation || "答錯囉，請詳閱觀念解析再接再勵！";
    quizExplanation.classList.remove("hidden");

    // 累加連續答錯計數
    curTeam.consecutiveWrongCount = (curTeam.consecutiveWrongCount || 0) + 1;

    // 🔒 答錯 100% 鎖死蓋房！強制隱藏與禁用綠色蓋房按鈕
    btnConfirmAnswer.classList.add("hidden");
    btnConfirmAnswer.setAttribute("disabled", "true");
    btnCloseWrong.textContent = "❌ 答錯扣分！關閉結束本輪 ➡️";
    btnCloseWrong.classList.remove("hidden");

    addHistoryLog(teams[currentTurnIndex].name, `❌ 答錯題目：【${currentActiveQuestion.question.slice(0, 15)}...】(累計答錯 ${curTeam.consecutiveWrongCount} 次)`);
    renderScoreBar();
  }
}

// 9. 答對建立或強行佔領生態領地 (方案 A：強佔直接沿用原建築名稱與轉移頭像/顏色)
function executeTakeoverOptionA() {
  const curTeam = teams[currentTurnIndex];
  const cellId = curTeam.pos;
  const owner = cellOwners[cellId];

  if (!owner) {
    openBuildModal();
    return;
  }

  const cost = 150;
  if (curTeam.score < cost) {
    alert(`⚠️ 貴隊金幣不足 (${curTeam.score} < ${cost})，無法進行 1.5 倍強行佔領！`);
    endTurn();
    return;
  }

  const bName = owner.buildingName; // 方案 A：直接沿用原被佔領建築名稱
  curTeam.score -= cost;

  // 扣除原業主棟數，確保雙方統計絕對精準
  const prevOwnerTeam = teams.find(t => t.id === owner.teamId);
  if (prevOwnerTeam && prevOwnerTeam.buildingsCount > 0) {
    prevOwnerTeam.buildingsCount -= 1;
  }

  cellOwners[cellId] = {
    teamId: curTeam.id,
    teamName: curTeam.name,
    teamIcon: curTeam.icon,
    color: curTeam.color,
    buildingName: bName,
    cost: 150
  };

  const cellEl = document.getElementById(`cell-${cellId}`);
  if (cellEl) {
    cellEl.style.border = `2px solid ${curTeam.color}`;
    cellEl.style.borderBottom = `4px solid ${curTeam.color}`;
    cellEl.style.backgroundColor = curTeam.color + "18";
  }
  const buildArea = document.getElementById(`build-${cellId}`);
  if (buildArea) {
    buildArea.innerHTML = "";
    const badge = document.createElement("div");
    badge.className = "building-badge";
    badge.innerHTML = `${curTeam.icon} 🏠 ${bName}`;
    badge.style.backgroundColor = curTeam.color;
    badge.style.boxShadow = `0 2px 6px ${curTeam.color}66`;
    buildArea.appendChild(badge);
  }

  curTeam.buildingsCount += 1;
  addHistoryLog(curTeam.name, `⚔️ 成功強行佔領【${owner.teamName}】的領地：【${curTeam.icon} ${bName}】(沿用原名，-150金幣)`);
  renderScoreBar();
  endTurn();
}

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
    alert(`⚠️ 貴隊金幣不足 (${curTeam.score} < ${cost})，無法進行建置！已為貴隊保留答對獎賞。`);
    closeModal(buildModal);
    endTurn();
    return;
  }

  if (usedBuildingNames.has(bName)) {
    alert(`⚠️ 建築名稱『${bName}』已經在動物城被建立過了！\n請發揮創意選擇或輸入一個獨一無二的生態建築名稱！`);
    return;
  }

  curTeam.score -= cost;
  usedBuildingNames.add(bName);

  const cellId = currentPendingBuildCellId;
  const cellEl = document.getElementById(`cell-${cellId}`);
  if (cellEl) {
    cellEl.style.border = `2px solid ${curTeam.color}`;
    cellEl.style.borderBottom = `4px solid ${curTeam.color}`;
    cellEl.style.backgroundColor = curTeam.color + "18";
  }
  const buildArea = document.getElementById(`build-${cellId}`);
  if (buildArea) {
    buildArea.innerHTML = "";
    const badge = document.createElement("div");
    badge.className = "building-badge";
    badge.innerHTML = `${curTeam.icon} 🏠 ${bName}`;
    badge.style.backgroundColor = curTeam.color;
    badge.style.boxShadow = `0 2px 6px ${curTeam.color}66`;
    buildArea.appendChild(badge);
  }

  const prevCellOwner = cellOwners[cellId];
  if (prevCellOwner && prevCellOwner.teamId !== curTeam.id) {
    const prevOwnerTeam = teams.find(t => t.id === prevCellOwner.teamId);
    if (prevOwnerTeam && prevOwnerTeam.buildingsCount > 0) {
      prevOwnerTeam.buildingsCount -= 1;
    }
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
    cellOwners,
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
    teams = (snap.teams || []).map(t => ({
      consecutiveWrongCount: 0,
      shields: 0,
      doubleScore: false,
      skipTurns: 0,
      freeBuild: false,
      ...t
    }));
    cellOwners = snap.cellOwners || {};
    usedBuildingNames = new Set(snap.usedBuildingNames || []);
    gameHistory = snap.gameHistory || [];
    modeTag.textContent = gameMode === "group" ? `👥 小組競賽 (${teams.length} 隊)` : `👤 個人競賽 (${teams.length} 人)`;
    renderScoreBar();
    generateBoardGrid();

    // 重新繪製已建立的領地建築徽章
    setTimeout(() => {
      Object.keys(cellOwners).forEach(cellId => {
        const owner = cellOwners[cellId];
        const cellEl = document.getElementById(`cell-${cellId}`);
        if (cellEl && owner) {
          cellEl.style.border = `2px solid ${owner.color || "#0284c7"}`;
          cellEl.style.borderBottom = `4px solid ${owner.color || "#0284c7"}`;
          cellEl.style.backgroundColor = (owner.color || "#0284c7") + "18";
        }
        const buildArea = document.getElementById(`build-${cellId}`);
        if (buildArea && owner) {
          buildArea.innerHTML = "";
          const badge = document.createElement("div");
          badge.className = "building-badge";
          badge.innerHTML = `${owner.teamIcon || "🏠"} 🏠 ${owner.buildingName}`;
          badge.style.backgroundColor = owner.color || "#0284c7";
          badge.style.boxShadow = `0 2px 6px ${owner.color || "#0284c7"}66`;
          buildArea.appendChild(badge);
        }
      });
      addHistoryLog("系統", "🔄 已成功恢復上一局進度與所有生態領地！");
    }, 300);
  }
}

function openModal(el) { el.classList.remove("hidden"); }
function closeModal(el) { el.classList.add("hidden"); }
function triggerMonopolyScoreSubmit() {
  if (typeof showScoreSubmitModal === "function") {
    const sorted = [...teams].sort((a, b) => ((b.score || 0) + (b.buildingsCount || 0) * 200) - ((a.score || 0) + (a.buildingsCount || 0) * 200));
    const top = sorted[0] || teams[0];
    const topVal = top ? ((top.score || 0) + (top.buildingsCount || 0) * 200) : 600;
    showScoreSubmitModal({
      gameTitle: "動物城生物大富翁",
      score: topVal,
      scoreDisplay: (top ? top.name : "隊伍") + "：" + topVal + " 分 (" + (top ? (top.buildingsCount || 0) : 0) + " 棟生態建築)",
      duration: "小組競賽領地戰"
    });
  }
}
