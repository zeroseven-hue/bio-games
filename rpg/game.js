/**
 * 樂透大冒險：生物勇者傳奇 (RPG Bio-Quest) - 遊戲引擎 V2.2
 * 1. 四關制闖關冒險：草原小徑 ➔ 近郊荒野 ➔ 巨龍王座 ➔ 終極龍王荒原 (金幣哥布林 👺💰)。
 * 2. 裝備神級威力與視覺連動：木劍 🪵🛡️ ➔ 精鋼劍 ⚔️🛡️ (題數砍半) ➔ 勇者聖劍 🗡️✨👑 (秒殺 Boss)。
 * 3. 趣味道具系統：酷炫墨鏡 🕶️、紳士翹鬍 🥸、耀眼皇冠 👑，即時連動 Avatar 與戰報。
 * 4. 答題賺錢 (+10g/題 + 秒答+5g) 與龍鱗護甲每題自動回血 15 HP。
 * 5. 美式卡牌風格防偽榮耀認證書與 Hash 加密驗證碼 (RPG-XXXX-XXXX)。
 * 6. 班級英雄榮譽排行榜 (localStorage) 與帶裝二週目再挑戰衝榜模式 (New Game+)。
 */

// 裝備與飾品清單 (圖示與數值嚴格統一)
const WEAPONS = [
  { id: "wood", name: "🪵 木劍", atk: 0, cost: 0, aura: "aura-wood", icon: "🪵🛡️" },
  { id: "steel", name: "⚔️ 精鋼劍", atk: 35, cost: 50, aura: "aura-steel", icon: "⚔️🛡️" },
  { id: "holy", name: "🗡️✨ 勇者聖劍", atk: 95, cost: 120, aura: "aura-holy", icon: "🗡️✨👑" }
];

const ARMORS = [
  { id: "cloth", name: "👕 布衣", hpBonus: 0, cost: 0 },
  { id: "chain", name: "🛡️ 鎖子甲", hpBonus: 60, cost: 40 },
  { id: "dragon", name: "🐉 龍鱗護甲", hpBonus: 150, cost: 100 }
];

const ACCESSORIES = [
  { id: "sunglasses", name: "🕶️ 酷炫墨鏡", atkBonus: 5, cost: 30, icon: "🕶️" },
  { id: "mustache", name: "🥸 紳士翹鬍", atkBonus: 5, cost: 30, icon: "🥸" },
  { id: "crown", name: "👑 耀眼皇冠", atkBonus: 10, cost: 60, icon: "👑" }
];

// 4 大關卡敵人資料
const STAGES = [
  {
    stageNum: 1,
    title: "🌿 第 1 关：草原小徑",
    enemies: [
      { name: "調皮綠史萊姆 #1", avatar: "🟢👿", hp: 100, maxHp: 100, atk: 15, class: "slime-green" },
      { name: "調皮綠史萊姆 #2", avatar: "🟢👿", hp: 100, maxHp: 100, atk: 15, class: "slime-green" }
    ],
    chestGold: 50,
    rescueCompanion: "lele"
  },
  {
    stageNum: 2,
    title: "🌵 第 2 關：近郊荒野",
    enemies: [
      { name: "劇毒紫史萊姆 #1", avatar: "🟣👿", hp: 160, maxHp: 160, atk: 20, class: "slime-purple" },
      { name: "劇毒紫史萊姆 #2", avatar: "🟣👿", hp: 160, maxHp: 160, atk: 20, class: "slime-purple" }
    ],
    chestGold: 80,
    rescueCompanion: "pudding"
  },
  {
    stageNum: 3,
    title: "🔥 第 3 關：巨龍王座",
    enemies: [
      { name: "紅色三眼大魔王 👹", avatar: "👹👁️", hp: 320, maxHp: 320, atk: 25, class: "boss-red" }
    ],
    chestGold: 120,
    rescueCompanion: null
  },
  {
    stageNum: 4,
    title: "🏰 第 4 關：終極龍王荒原",
    enemies: [
      { name: "龐大金幣哥布林 👺💰", avatar: "👺💰", hp: 400, maxHp: 400, atk: 30, class: "boss-goblin" }
    ],
    chestGold: 200,
    rescueCompanion: null
  }
];

// 遊戲狀態
let currentStageIndex = 0;
let currentEnemyIndex = 0;
let heroHp = 100;
let heroMaxHp = 100;
let baseAtk = 25;
let gold = 0;
let equippedWeaponIndex = 0;
let equippedArmorIndex = 0;
let equippedAccessoryIndex = -1;

let hasLele = false;
let leleShieldActive = false;
let hasPudding = false;
let puddingSkillUsedInBattle = false;

let gameMode = "group"; // "group" | "solo"
let currentTurnMember = 1;
let soundEnabled = true;
let timerEnabled = true;
let isTeacherFrozen = false;
let isTextZoomed = false;

// 統計與二週目分數
let correctAnswerCount = 0;
let quickAnswerCount = 0;
let totalDamageDealt = 0;
let ngPlusCount = 0;

let allManifestUnits = [];
let rawQuestionsByUnit = {};
let questionPoolByUnit = {};
let currentActiveQuestion = null;
let countdownTimer = null;
let audioCtx = null;

let isCurrentQuizAnsweredCorrectly = false;
let quizStartTime = 0;
let lastCalculatedDamage = 0;

// DOM 元素引用
const modeTag = document.getElementById("modeTag");
const heroHpFill = document.getElementById("heroHpFill");
const heroHpText = document.getElementById("heroHpText");
const goldDisplay = document.getElementById("goldDisplay");
const weaponDisplay = document.getElementById("weaponDisplay");
const armorDisplay = document.getElementById("armorDisplay");
const accessoryDisplay = document.getElementById("accessoryDisplay");
const accessoryStatItem = document.getElementById("accessoryStatItem");
const stageInfoText = document.getElementById("stageInfoText");
const selectUnit = document.getElementById("selectUnit");

const battleScene = document.getElementById("battleScene");
const campScene = document.getElementById("campScene");
const heroAvatar = document.getElementById("heroAvatar");
const heroAura = document.getElementById("heroAura");
const heroNameBadge = document.getElementById("heroNameBadge");
const badgeLele = document.getElementById("badgeLele");
const badgePudding = document.getElementById("badgePudding");

const battleBanner = document.getElementById("battleBanner");
const btnStartBattle = document.getElementById("btnStartBattle");
const enemyAvatar = document.getElementById("enemyAvatar");
const enemyName = document.getElementById("enemyName");
const enemyHpFill = document.getElementById("enemyHpFill");
const enemyHpText = document.getElementById("enemyHpText");

const btnBuySteelSword = document.getElementById("btnBuySteelSword");
const btnBuyHolySword = document.getElementById("btnBuyHolySword");
const btnBuyChainArmor = document.getElementById("btnBuyChainArmor");
const btnBuyDragonArmor = document.getElementById("btnBuyDragonArmor");
const btnBuySunglasses = document.getElementById("btnBuySunglasses");
const btnBuyMustache = document.getElementById("btnBuyMustache");
const btnBuyCrown = document.getElementById("btnBuyCrown");
const btnLeaveCamp = document.getElementById("btnLeaveCamp");

const btnZoomText = document.getElementById("btnZoomText");
const btnRules = document.getElementById("btnRules");
const btnFreeze = document.getElementById("btnFreeze");
const btnSound = document.getElementById("btnSound");
const btnTimer = document.getElementById("btnTimer");
const btnLeaderboard = document.getElementById("btnLeaderboard");

// Modals
const quizModal = document.getElementById("quizModal");
const quizBox = document.getElementById("quizBox");
const quizUnitBadge = document.getElementById("quizUnitBadge");
const poolLeftBadge = document.getElementById("poolLeftBadge");
const quizTimerBanner = document.getElementById("quizTimerBanner");
const btnUsePuddingSkill = document.getElementById("btnUsePuddingSkill");
const leleShieldNotice = document.getElementById("leleShieldNotice");
const quizStem = document.getElementById("quizStem");
const quizOptions = document.getElementById("quizOptions");
const quizExplanation = document.getElementById("quizExplanation");
const explanationText = document.getElementById("explanationText");
const btnAttackBoss = document.getElementById("btnAttackBoss");
const btnCloseWrong = document.getElementById("btnCloseWrong");

const victoryModal = document.getElementById("victoryModal");
const inputSeatNo = document.getElementById("inputSeatNo");
const inputStudentName = document.getElementById("inputStudentName");
const inputReflection = document.getElementById("inputReflection");
const certCodeValue = document.getElementById("certCodeValue");
const certRankTitle = document.getElementById("certRankTitle");
const certHighScore = document.getElementById("certHighScore");
const badgeItemWeapon = document.getElementById("badgeItemWeapon");
const badgeItemArmor = document.getElementById("badgeItemArmor");
const badgeItemAccessory = document.getElementById("badgeItemAccessory");
const badgeItemCompanions = document.getElementById("badgeItemCompanions");

const btnSaveToLeaderboard = document.getElementById("btnSaveToLeaderboard");
const btnNewGamePlus = document.getElementById("btnNewGamePlus");
const btnCopyCert = document.getElementById("btnCopyCert");
const btnRestartGame = document.getElementById("btnRestartGame");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardContainer = document.getElementById("leaderboardContainer");
const btnClearLeaderboard = document.getElementById("btnClearLeaderboard");
const btnCloseLeaderboard = document.getElementById("btnCloseLeaderboard");

const rulesModal = document.getElementById("rulesModal");
const btnCloseRules = document.getElementById("btnCloseRules");
const teacherFreezeModal = document.getElementById("teacherFreezeModal");
const btnUnfreeze = document.getElementById("btnUnfreeze");

// 頁面初始化
window.addEventListener("DOMContentLoaded", async () => {
  initUrlParams();
  initEventListeners();
  await loadManifestAndUnits();
  resetGameState();
});

function initUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get("mode");
  const timerParam = urlParams.get("timer");

  if (modeParam === "solo") gameMode = "solo";
  if (timerParam === "off") timerEnabled = false;
}

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
  btnTimer.addEventListener("click", toggleTimer);
  btnLeaderboard.addEventListener("click", () => {
    renderLeaderboard();
    openModal(leaderboardModal);
  });
  btnCloseLeaderboard.addEventListener("click", () => closeModal(leaderboardModal));
  btnClearLeaderboard.addEventListener("click", clearLeaderboard);

  btnStartBattle.addEventListener("click", openBattleQuiz);

  btnBuySteelSword.addEventListener("click", () => buyWeapon(1));
  btnBuyHolySword.addEventListener("click", () => buyWeapon(2));
  btnBuyChainArmor.addEventListener("click", () => buyArmor(1));
  btnBuyDragonArmor.addEventListener("click", () => buyArmor(2));

  btnBuySunglasses.addEventListener("click", () => buyAccessory(0));
  btnBuyMustache.addEventListener("click", () => buyAccessory(1));
  btnBuyCrown.addEventListener("click", () => buyAccessory(2));

  btnLeaveCamp.addEventListener("click", leaveCampToNextStage);

  btnUsePuddingSkill.addEventListener("click", usePudding5050);

  btnAttackBoss.addEventListener("click", () => {
    if (!isCurrentQuizAnsweredCorrectly) {
      alert("⚠️ 作答未完成或答錯題目，嚴格禁止發動勇者攻擊！");
      return;
    }
    closeModal(quizModal);
    executeHeroAttack();
  });

  btnCloseWrong.addEventListener("click", () => {
    closeModal(quizModal);
    executeEnemyAttack();
  });

  btnSaveToLeaderboard.addEventListener("click", saveScoreToLeaderboard);
  btnNewGamePlus.addEventListener("click", startNewGamePlus);
  btnCopyCert.addEventListener("click", copyCertificationData);
  btnRestartGame.addEventListener("click", () => {
    closeModal(victoryModal);
    resetGameState();
  });

  [inputSeatNo, inputStudentName].forEach(el => el.addEventListener("input", updateCertCode));
}

// 音效系統 (Web Audio Synth)
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

function playSlashSound() { playTone(440, "sawtooth", 0.08); playTone(880, "triangle", 0.12, 0.05); }
function playHitSound() { playTone(150, "square", 0.15); playTone(100, "sawtooth", 0.2, 0.08); }
function playCoinSound() { playTone(987, "sine", 0.1, 0, 0.12); playTone(1318, "sine", 0.2, 0.08, 0.12); }
function playFanfare() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => playTone(f, "square", 0.12, i * 0.1, 0.15)); }

function toggleSound() {
  soundEnabled = !soundEnabled;
  btnSound.textContent = soundEnabled ? "🔊" : "🔇";
}

function toggleTimer() {
  timerEnabled = !timerEnabled;
  btnTimer.textContent = timerEnabled ? "⏱️" : "⏳";
}

// 載入題庫
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
    console.warn("題庫載入警告:", err);
  }
}

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

// 重置與裝備狀態
function resetGameState() {
  currentStageIndex = 0;
  currentEnemyIndex = 0;
  gold = 0;
  equippedWeaponIndex = 0;
  equippedArmorIndex = 0;
  equippedAccessoryIndex = -1;
  correctAnswerCount = 0;
  quickAnswerCount = 0;
  totalDamageDealt = 0;
  ngPlusCount = 0;

  hasLele = false;
  leleShieldActive = false;
  hasPudding = false;

  updateHeroStats();
  updateUI();
  setupStage();
}

function updateHeroStats() {
  const w = WEAPONS[equippedWeaponIndex];
  const a = ARMORS[equippedArmorIndex];
  heroMaxHp = 100 + a.hpBonus;
  heroHp = heroMaxHp;
  weaponDisplay.textContent = w.name;
  armorDisplay.textContent = a.name;

  if (equippedAccessoryIndex >= 0) {
    const acc = ACCESSORIES[equippedAccessoryIndex];
    accessoryDisplay.textContent = acc.name;
    accessoryStatItem.classList.remove("hidden");
    heroAvatar.textContent = `${w.icon}${acc.icon}`;
  } else {
    accessoryStatItem.classList.add("hidden");
    heroAvatar.textContent = w.icon;
  }

  heroAura.className = `hero-aura ${w.aura}`;
}

function updateUI() {
  heroHpText.textContent = `${heroHp} / ${heroMaxHp}`;
  heroHpFill.style.width = `${Math.max(0, (heroHp / heroMaxHp) * 100)}%`;
  goldDisplay.textContent = `${gold} g`;

  modeTag.textContent = gameMode === "group" ? `👥 小組競賽 (第 ${currentTurnMember} 棒作答)` : `👤 個人單機模式`;
  heroNameBadge.textContent = gameMode === "group" ? `生物勇者 (第 ${currentTurnMember} 棒)` : `生物勇者 (自主)`;

  badgeLele.className = `companion-badge ${hasLele ? "" : "locked"}`;
  badgeLele.textContent = hasLele ? `🐶 樂樂 (${leleShieldActive ? "護盾就緒" : "已抵擋"})` : "🐶 樂樂 (未救援)";

  badgePudding.className = `companion-badge ${hasPudding ? "" : "locked"}`;
  badgePudding.textContent = hasPudding ? "🐱 布丁 (50/50 就緒)" : "🐱 布丁 (未救援)";

  const avatarLele = document.getElementById("avatarLele");
  const avatarPudding = document.getElementById("avatarPudding");
  if (avatarLele) avatarLele.classList.toggle("hidden", !hasLele);
  if (avatarPudding) avatarPudding.classList.toggle("hidden", !hasPudding);

  updateShopButtons();
}

function updateShopButtons() {
  btnBuySteelSword.disabled = (equippedWeaponIndex >= 1 || gold < 50);
  btnBuyHolySword.disabled = (equippedWeaponIndex >= 2 || gold < 120);
  btnBuyChainArmor.disabled = (equippedArmorIndex >= 1 || gold < 40);
  btnBuyDragonArmor.disabled = (equippedArmorIndex >= 2 || gold < 100);

  btnBuySunglasses.disabled = (equippedAccessoryIndex === 0 || gold < 30);
  btnBuyMustache.disabled = (equippedAccessoryIndex === 1 || gold < 30);
  btnBuyCrown.disabled = (equippedAccessoryIndex === 2 || gold < 60);
}

function setupStage() {
  // 重置全體怪獸血量 (支援二週目 New Game+)
  const stg = STAGES[currentStageIndex];
  const curEnemy = stg.enemies[currentEnemyIndex];

  stageInfoText.textContent = `${stg.title} ${ngPlusCount > 0 ? `[New Game+ x${ngPlusCount}]` : ""} ‧ 目標：擊敗 ${curEnemy.name}！`;
  battleBanner.textContent = `遭遇怪獸 【${curEnemy.name}】！準備進入答題戰鬥！`;

  renderMonsterAvatar(curEnemy);
  enemyName.textContent = curEnemy.name;
  enemyHpText.textContent = `${curEnemy.hp} / ${curEnemy.maxHp}`;
  enemyHpFill.style.width = `${Math.max(0, (curEnemy.hp / curEnemy.maxHp) * 100)}%`;

  battleScene.classList.remove("hidden");
  campScene.classList.add("hidden");
}

function renderMonsterAvatar(curEnemy) {
  if (curEnemy.class === "slime-green") {
    enemyAvatar.innerHTML = `<div class="slime-blob green-blob"><span class="blob-eyes">(｀∀´)</span></div>`;
  } else if (curEnemy.class === "slime-purple") {
    enemyAvatar.innerHTML = `<div class="slime-blob purple-blob"><span class="blob-eyes">(◣_◢)</span></div>`;
  } else if (curEnemy.class === "boss-red") {
    enemyAvatar.innerHTML = `<div class="boss-blob red-blob"><span class="blob-eyes">👁️👁️👁️</span></div>`;
  } else if (curEnemy.class === "boss-goblin") {
    enemyAvatar.innerHTML = `<div class="goblin-blob boss-goblin"><span class="blob-eyes">👺💰</span></div>`;
  } else {
    enemyAvatar.textContent = curEnemy.avatar;
  }
}

// 答題戰鬥觸發
function openBattleQuiz() {
  isCurrentQuizAnsweredCorrectly = false;
  quizStartTime = Date.now();

  const unitFile = selectUnit.value || "unit01_scientific_method.json";
  const unitObj = allManifestUnits.find(u => u.file === unitFile);
  quizUnitBadge.textContent = unitObj ? `${unitObj.id.toUpperCase()} ‧ ${unitObj.title}` : "國中生物單元";

  const pool = questionPoolByUnit[unitFile] || [];
  poolLeftBadge.textContent = `題庫佇列剩餘: ${pool.length} 題`;

  currentActiveQuestion = getNextQuestionFromPool(unitFile);

  quizStem.textContent = currentActiveQuestion.question;
  quizOptions.innerHTML = "";
  quizExplanation.classList.add("hidden");

  btnAttackBoss.classList.add("hidden");
  btnAttackBoss.setAttribute("disabled", "true");
  btnCloseWrong.classList.add("hidden");

  btnUsePuddingSkill.classList.toggle("hidden", !hasPudding || puddingSkillUsedInBattle);
  leleShieldNotice.classList.toggle("hidden", !(hasLele && leleShieldActive));

  currentActiveQuestion.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn-option";
    btn.id = `opt-${idx}`;
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

function usePudding5050() {
  if (!hasPudding || puddingSkillUsedInBattle) return;
  puddingSkillUsedInBattle = true;
  btnUsePuddingSkill.classList.add("hidden");

  const correctIdx = currentActiveQuestion.answer;
  const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIdx);
  const toRemove = shuffleArray(wrongIndices).slice(0, 2);

  toRemove.forEach(idx => {
    const btn = document.getElementById(`opt-${idx}`);
    if (btn) {
      btn.style.opacity = "0.3";
      btn.style.pointerEvents = "none";
      btn.innerHTML += " <small>(🐱 布丁移除)</small>";
    }
  });

  playCoinSound();
}

function handleQuizSelect(selectedIndex, btnEl) {
  clearInterval(countdownTimer);
  const isCorrect = (selectedIndex === currentActiveQuestion.answer);

  if (isCorrect) {
    isCurrentQuizAnsweredCorrectly = true;
    btnEl.classList.add("correct");
    playSlashSound();

    correctAnswerCount++;
    gold += 10; // 🎯 答對每題固定 +10 金幣獎勵！

    const timeTaken = Math.max(0.5, (Date.now() - quizStartTime) / 1000);
    let speedMultiplier = 1.0;
    let speedTag = "";

    if (timeTaken <= 5.0) {
      speedMultiplier = 1.5;
      quickAnswerCount++;
      gold += 5; // ⚡ 秒答加碼 +5 金幣 (單題總共 +15g)！
      playCoinSound();
      speedTag = `⚡【極速暴擊 1.5倍 (+15g 金幣)】作答費時 ${timeTaken.toFixed(1)} 秒！`;
    } else if (timeTaken <= 15.0) {
      speedMultiplier = 1.0;
      speedTag = `⚔️【勇者重擊 1.0倍 (+10g 金幣)】作答費時 ${timeTaken.toFixed(1)} 秒。`;
    } else {
      speedMultiplier = 0.7;
      speedTag = `🛡️【謹慎試探 0.7倍 (+10g 金幣)】作答耗時 ${timeTaken.toFixed(1)} 秒。`;
    }

    // 🐉 龍鱗護甲每題自動吸血恢復 15 HP
    if (equippedArmorIndex === 2) {
      heroHp = Math.min(heroMaxHp, heroHp + 15);
      speedTag += `<br><span style="color:#22c55e;">🐉【龍鱗護甲吸血】答對自動恢復 15 HP！</span>`;
    }

    const weaponBonus = WEAPONS[equippedWeaponIndex].atk;
    const accessoryBonus = equippedAccessoryIndex >= 0 ? ACCESSORIES[equippedAccessoryIndex].atkBonus : 0;
    lastCalculatedDamage = Math.round((baseAtk + weaponBonus + accessoryBonus) * speedMultiplier);
    totalDamageDealt += lastCalculatedDamage;

    let powerFeedback = "";
    if (equippedWeaponIndex === 1) {
      powerFeedback = `<br><span style="color:#38bdf8; font-weight:bold;">💥 精鋼斬威力爆發！答題打怪效率直接砍半！</span>`;
    } else if (equippedWeaponIndex === 2) {
      powerFeedback = `<br><span style="color:#eab308; font-weight:bold;">✨ 勇者聖光神打擊！直接秒殺怪獸大半血量！</span>`;
    }

    explanationText.innerHTML = `<b style="color:#eab308; font-size:1.05rem;">${speedTag} 造成 ${lastCalculatedDamage} 點毀滅傷害！${powerFeedback}</b><br><br>${currentActiveQuestion.explanation || "恭喜答對！發動勇者聖光重擊！"}`;
    quizExplanation.classList.remove("hidden");

    btnAttackBoss.textContent = `⚔️ 發動重擊 (${lastCalculatedDamage} 點傷害)！繼續戰鬥 💥`;
    btnAttackBoss.classList.remove("hidden");
    btnAttackBoss.removeAttribute("disabled");
    btnCloseWrong.classList.add("hidden");
    updateUI();

  } else {
    isCurrentQuizAnsweredCorrectly = false;
    btnEl.classList.add("incorrect");
    playHitSound();
    explanationText.textContent = currentActiveQuestion.explanation || "答錯囉，請觀看筆記解析後再接再勵！";
    quizExplanation.classList.remove("hidden");

    btnAttackBoss.classList.add("hidden");
    btnAttackBoss.setAttribute("disabled", "true");
    btnCloseWrong.textContent = "💥 受到怪獸反擊！閉關受創 ➡️";
    btnCloseWrong.classList.remove("hidden");
  }

  if (gameMode === "group") {
    currentTurnMember = (currentTurnMember % 4) + 1;
    updateUI();
  }
}

// 執行勇者攻擊
function executeHeroAttack() {
  const stg = STAGES[currentStageIndex];
  const curEnemy = stg.enemies[currentEnemyIndex];

  const damage = lastCalculatedDamage || 30;

  curEnemy.hp = Math.max(0, curEnemy.hp - damage);
  enemyHpFill.style.width = `${(curEnemy.hp / curEnemy.maxHp) * 100}%`;
  enemyHpText.textContent = `${curEnemy.hp} / ${curEnemy.maxHp}`;

  enemyAvatar.classList.remove("hit-anim");
  void enemyAvatar.offsetWidth;
  enemyAvatar.classList.add("hit-anim");

  battleBanner.textContent = `⚔️ 勇者造成了 ${damage} 點爆發傷害！`;

  if (curEnemy.hp <= 0) {
    setTimeout(handleEnemyDefeated, 400);
  }
}

function executeEnemyAttack() {
  const stg = STAGES[currentStageIndex];
  const curEnemy = stg.enemies[currentEnemyIndex];

  if (hasLele && leleShieldActive) {
    leleShieldActive = false;
    updateUI();
    battleBanner.textContent = `🛡️ 樂樂發動守護護盾！幫你抵擋了 ${curEnemy.atk} 點怪獸反擊傷害！`;
    playFanfare();
    return;
  }

  const damage = curEnemy.atk;
  heroHp = Math.max(0, heroHp - damage);
  updateUI();

  battleBanner.textContent = `💥 遭受 ${curEnemy.name} 反擊！受到了 ${damage} 點傷害！`;

  if (heroHp <= 0) {
    triggerCprRevive();
  }
}

function triggerCprRevive() {
  heroHp = 50;
  updateUI();
  alert("🚑 勇者體力耗盡！夥伴樂樂與布丁進行急救復甦！恢復 50 HP 繼續接續戰鬥！");
  battleBanner.textContent = "🚑 夥伴 CPR 緊急救援！調降難度接續挑戰！";
}

function handleEnemyDefeated() {
  const stg = STAGES[currentStageIndex];
  playFanfare();

  currentEnemyIndex++;

  if (currentEnemyIndex < stg.enemies.length) {
    battleBanner.textContent = `🎉 擊敗怪獸！準備挑戰下一隻！`;
    setupStage();

  } else {
    gold += stg.chestGold;
    playCoinSound();

    if (stg.rescueCompanion === "lele") {
      hasLele = true;
      leleShieldActive = true;
      alert("🐶 成功解救守護犬「樂樂」加入隊伍！獲得 1 次答錯傷害防護盾！");
    } else if (stg.rescueCompanion === "pudding") {
      hasPudding = true;
      alert("🐱 成功解救智慧貓「布丁」加入隊伍！獲得 50/50 刪除錯誤選項技能！");
    }

    updateUI();

    if (currentStageIndex < STAGES.length - 1) {
      currentStageIndex++;
      currentEnemyIndex = 0;
      openCampScene();
    } else {
      openVictoryModal();
    }
  }
}

function openCampScene() {
  battleScene.classList.add("hidden");
  campScene.classList.remove("hidden");
  stageInfoText.textContent = `🏕️ 勇者營地補給站 ‧ 整備裝備準備迎戰下一關！`;
}

function leaveCampToNextStage() {
  setupStage();
}

function buyWeapon(idx) {
  const w = WEAPONS[idx];
  if (gold >= w.cost) {
    gold -= w.cost;
    equippedWeaponIndex = idx;
    updateHeroStats();
    updateUI();
    playCoinSound();
    alert(`⚔️ 成功購買裝備【${w.name}】！勇者攻擊力飆升！答題打怪題數砍半！`);
  }
}

function buyArmor(idx) {
  const a = ARMORS[idx];
  if (gold >= a.cost) {
    gold -= a.cost;
    equippedArmorIndex = idx;
    updateHeroStats();
    updateUI();
    playCoinSound();
    alert(`🛡️ 成功購買防具【${a.name}】！最大血量大幅提升，防護力點滿！`);
  }
}

function buyAccessory(idx) {
  const acc = ACCESSORIES[idx];
  if (gold >= acc.cost) {
    gold -= acc.cost;
    equippedAccessoryIndex = idx;
    updateHeroStats();
    updateUI();
    playCoinSound();
    alert(`🕶️ 成功佩戴酷炫飾品【${acc.name}】！造型帥氣度飆升，攻擊力 +${acc.atkBonus}！`);
  }
}

// 通關與防偽認證碼 & 排行榜計算
function openVictoryModal() {
  updateCertCode();
  openModal(victoryModal);
}

function calculateScore() {
  return (correctAnswerCount * 100) + (quickAnswerCount * 50) + (totalDamageDealt * 2) + (gold * 5);
}

function getRankTitle(score) {
  if (score >= 2500) return "👑 傳奇生物聖勇者";
  if (score >= 1800) return "⚔️ 疾風聖劍客";
  if (score >= 1000) return "🛡️ 堅定冒險家";
  return "🌱 初階生物勇者";
}

function updateCertCode() {
  const seat = inputSeatNo.value.trim() || "70101號";
  const name = inputStudentName.value.trim() || "生物勇者";
  const score = calculateScore();

  certHighScore.textContent = score.toLocaleString();
  certRankTitle.textContent = getRankTitle(score);

  const w = WEAPONS[equippedWeaponIndex];
  const a = ARMORS[equippedArmorIndex];
  const acc = equippedAccessoryIndex >= 0 ? ACCESSORIES[equippedAccessoryIndex] : null;

  badgeItemWeapon.textContent = `⚔️ 武器: ${w.name}`;
  badgeItemArmor.textContent = `🛡️ 防具: ${a.name}`;
  badgeItemAccessory.textContent = `🕶️ 飾品: ${acc ? acc.name : "無"}`;
  badgeItemCompanions.textContent = `🐾 夥伴: ${hasLele ? "🐶 樂樂" : ""} ${hasPudding ? "🐱 布丁" : ""}` || "無";

  const str = `${seat}-${name}-${score}-${equippedWeaponIndex}-${equippedArmorIndex}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  const code = Math.abs(hash).toString(16).toUpperCase().padStart(4, "0");
  certCodeValue.textContent = `RPG-${code}-${seat}`;
}

function copyCertificationData() {
  const score = calculateScore();
  const title = getRankTitle(score);
  const text = `【樂透大冒險：生物勇者傳奇 - 課堂榮耀防偽戰報】\n` +
    `👤 學生/小組：${inputSeatNo.value} ${inputStudentName.value}\n` +
    `🏆 總積分：${score} 分 (${title})\n` +
    `⚔️ 裝備：${WEAPONS[equippedWeaponIndex].name} / ${ARMORS[equippedArmorIndex].name}\n` +
    `🕶️ 飾品：${equippedAccessoryIndex >= 0 ? ACCESSORIES[equippedAccessoryIndex].name : "無"}\n` +
    `🪙 剩餘金幣：${gold}g\n` +
    `📝 課堂心得：${inputReflection.value}\n` +
    `🛡️ 防偽認證碼：${certCodeValue.textContent}`;

  navigator.clipboard.writeText(text).then(() => {
    alert("✅ 榮耀戰報與防偽認證碼已成功複製！可直接貼上繳交至 Google Classroom！");
  }).catch(() => {
    alert("複製失敗，請手動複製以下內容：\n\n" + text);
  });
}

// 🏆 排行榜 (Leaderboard LocalStorage)
function getLeaderboardData() {
  try {
    const raw = localStorage.getItem("bio_rpg_leaderboard");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveScoreToLeaderboard() {
  const seat = inputSeatNo.value.trim() || "70101號";
  const name = inputStudentName.value.trim() || "生物勇者";
  const score = calculateScore();
  const title = getRankTitle(score);
  const wIcon = WEAPONS[equippedWeaponIndex].icon;
  const accIcon = equippedAccessoryIndex >= 0 ? ACCESSORIES[equippedAccessoryIndex].icon : "";

  const list = getLeaderboardData();
  list.push({
    seat,
    name,
    score,
    title,
    avatar: `${wIcon}${accIcon}`,
    date: new Date().toLocaleDateString()
  });

  list.sort((a, b) => b.score - a.score);
  const topList = list.slice(0, 10);
  localStorage.setItem("bio_rpg_leaderboard", JSON.stringify(topList));

  alert(`🏆 成功登錄班級英雄榮譽榜！【${seat} ${name}】以 ${score} 分獲得 ${title} 榮譽！`);
  renderLeaderboard();
  openModal(leaderboardModal);
}

function renderLeaderboard() {
  const list = getLeaderboardData();
  if (list.length === 0) {
    leaderboardContainer.innerHTML = `<p style="padding:20px; color:#64748b;">🏆 目前尚無排行榜紀錄，快成為第一位全破闖關的英雄吧！</p>`;
    return;
  }

  let html = `<table class="leaderboard-table">
    <thead>
      <tr>
        <th>排名</th>
        <th>勇者資訊</th>
        <th>裝備造型</th>
        <th>榮譽稱號</th>
        <th>最高積分</th>
      </tr>
    </thead>
    <tbody>`;

  list.forEach((item, index) => {
    const rankClass = index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "";
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `第 ${index + 1} 名`;
    html += `<tr class="${rankClass}">
      <td>${medal}</td>
      <td>${item.seat} ${item.name}</td>
      <td style="font-size:1.3rem;">${item.avatar}</td>
      <td>${item.title}</td>
      <td style="font-size:1.1rem; color:#b45309;">${item.score.toLocaleString()} 分</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  leaderboardContainer.innerHTML = html;
}

function clearLeaderboard() {
  if (confirm("⚠️ 確定要清除班級英雄排行榜資料嗎？（適合換新班級上課時重置）")) {
    localStorage.removeItem("bio_rpg_leaderboard");
    renderLeaderboard();
  }
}

// 🔄 帶裝再挑戰 (New Game+ 二週目)
function startNewGamePlus() {
  ngPlusCount++;
  closeModal(victoryModal);
  currentStageIndex = 0;
  currentEnemyIndex = 0;

  // 重置怪獸血量
  STAGES.forEach(s => s.enemies.forEach(e => e.hp = e.maxHp));

  alert(`⚔️ 帶上滿級神裝踏入二週目 (New Game+ x${ngPlusCount})！體驗一刀秒殺怪獸、衝爆最高積分排行榜！`);
  setupStage();
}

function toggleTeacherFreeze() {
  isTeacherFrozen = !isTeacherFrozen;
  if (isTeacherFrozen) openModal(teacherFreezeModal);
  else closeModal(teacherFreezeModal);
}

function openModal(el) { el.classList.remove("hidden"); }
function closeModal(el) { el.classList.add("hidden"); }
