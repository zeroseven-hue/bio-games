/* ========================================================
   生物小蜜蜂：星際防衛隊 (Bio Defender) V2.0 遊戲核心邏輯
   ======================================================== */

// 預設備用題庫 (當網路或離線無法 fetch 時自動降級使用)
const DEFAULT_QUESTION_BANK = [
  {
    q: "下列哪一種構造，在常見的『水稻葉肉細胞』中存在，但在『口腔皮膜細胞』中找不到？",
    options: { A: "細胞核", B: "粒線體", C: "細胞壁", D: "細胞膜" },
    ans: "C",
    hint: "植物細胞具有細胞壁與葉綠體，動物細胞則沒有！"
  },
  {
    q: "被稱為細胞的『能量工廠』，主要負責進行呼吸作用產生能量 (ATP) 的構造是？",
    options: { A: "核糖體", B: "葉綠體", C: "高基氏體", D: "粒線體" },
    ans: "D",
    hint: "粒線體是動植物細胞呼吸作用的主要場所。"
  },
  {
    q: "下列關於原核生物（如大腸桿菌、乳酸菌）的敘述，何者正確？",
    options: { A: "缺乏遺傳物質 DNA", B: "沒有成形的細胞核", C: "細胞內含有葉綠體", D: "構造複雜屬於多細胞" },
    ans: "B",
    hint: "原核生物具有遺傳物質，但沒有由核膜包覆的成形細胞核。"
  },
  {
    q: "紅血球置入哪一種液體中時，會因為水分大量滲入而導致『膨脹破裂』？",
    options: { A: "濃食鹽水", B: "生理食鹽水", C: "純水", D: "高濃度糖水" },
    ans: "C",
    hint: "純水濃度低於細胞內液，水分子大量滲透進入導致細胞脹破。"
  },
  {
    q: "植物進行光合作用時，『光反應』分解水分子後，釋放出的氣體是？",
    options: { A: "二氧化碳", B: "氧氣", C: "氮氣", D: "水蒸氣" },
    ans: "B",
    hint: "光反應藉由光能將水裂解，釋露出氧氣。"
  },
  {
    q: "使用碘液檢驗煮熟的米飯時，若含有澱粉，顏色會轉變成？",
    options: { A: "藍黑色", B: "黃褐色", C: "磚紅色", D: "鮮綠色" },
    ans: "A",
    hint: "碘液原本是黃褐色，遇到澱粉會呈現藍黑色反應。"
  },
  {
    q: "向日葵莖內負責由下往上運送『水分與無機鹽』的組織是？",
    options: { A: "形成層", B: "木質部", C: "韌皮部", D: "表皮組織" },
    ans: "B",
    hint: "木質部運送水分（單向向上）；韌皮部運送養分。"
  },
  {
    q: "人體血液成分中，當體內遭受病原體入侵時，數量會明顯增加以吞噬病菌的是？",
    options: { A: "紅血球", B: "白血球", C: "血小板", D: "血漿蛋白" },
    ans: "B",
    hint: "白血球具備防禦免疫功能，能吞噬外來病原體。"
  },
  {
    q: "被稱為『內分泌總指揮』，能分泌多種激素調節其他腺體的是？",
    options: { A: "甲狀腺", B: "腦垂腺", C: "腎上腺", D: "胰島" },
    ans: "B",
    hint: "腦垂腺位於腦部下方，控制人體生長及多數腺體分泌。"
  },
  {
    q: "人體激烈運動後呼吸加速，主要是血液中哪種物質濃度上升，刺激了腦幹呼吸中樞？",
    options: { A: "氧氣", B: "二氧化碳", C: "葡萄糖", D: "尿素" },
    ans: "B",
    hint: "血液中二氧化碳濃度上升是刺激腦幹加速呼吸的主要訊號。"
  }
];

/* ========================================================
   1. 音效晶片 (Web Audio API)
   ======================================================== */
let audioCtx = null;
let isSoundOn = true;

function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn("AudioContext not supported", e);
  }
}

function toggleSound() {
  isSoundOn = !isSoundOn;
  const btn = document.getElementById("sound-btn");
  if (btn) btn.textContent = isSoundOn ? "🔊 音效" : "🔇 靜音";
}

function playTone(freq, type, duration, startVol = 0.12) {
  if (!isSoundOn) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(startVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function soundLaser() { playTone(750, 'sine', 0.08, 0.15); }
function soundHitCorrect() {
  playTone(523, 'triangle', 0.1);
  setTimeout(() => playTone(784, 'triangle', 0.2), 80);
}
function soundExplode() { playTone(110, 'sawtooth', 0.35, 0.22); }
function soundVictory() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'sine', 0.25, 0.2), idx * 120);
  });
}
function soundGameOver() {
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'sawtooth', 0.25, 0.2), idx * 120);
  });
}

/* ========================================================
   2. 全域狀態與單元題庫動態載入
   ======================================================== */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let cw = 400, ch = 500;

let manifestData = null;
let currentUnitId = "";
let dispatchedUnit = "";
let isStarting = false;
const GAME_TITLE = "生物星際防衛隊 (Bio Defender)";

function showLoadError(error) {
  console.error(error);
  document.getElementById("start-modal").style.display = "flex";
  document.getElementById("end-modal").style.display = "none";
  document.getElementById("q-text").textContent = "無法開始：" + error.message;
  document.getElementById("load-error").textContent = error.message;
  document.getElementById("load-retry").style.display = "block";
}

async function readQuestionJSON(relativePath) {
  const url = new URL(relativePath, window.location.href);
  if (url.protocol === "file:") throw new Error("目前以 file:// 開啟，請使用提供此題庫的 HTTP/HTTPS 網站連結。");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url.href, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await response.json();
  } catch (error) {
    throw new Error(url.href + "：" + (error.name === "AbortError" ? "請求逾時" : error.message));
  } finally { clearTimeout(timeout); }
}

function resolveUnit(value) {
  const units = manifestData.units;
  const exact = units.find(u => u.file === value);
  if (exact) return exact;
  const matches = units.filter(u => u.id === value);
  if (matches.length === 1) return matches[0];
  throw new Error(matches.length > 1 ? "單元代碼不唯一，請教師使用含完整題庫檔名的 QR Code。" : "指定單元不在題庫清單中，請教師重新選擇並提供連結。");
}
let loadedBankMap = {}; // 暫存已載入的單元題庫

let gameQuestions = [];
let currentQIndex = 0;
let score = 0;
let lives = 3;
let combo = 0;
let isOverheated = false;
let qTimeRemaining = 25;
let qTimer = null;
let questionSettled = true;
let questionVersion = 0;
let hintTimer = null;
let isRunning = false;
let logs = [];
let playerProfile = { cls: "", seat: "", name: "" };

let isPaused = false;
let isZoomed = false;
let emergencyRepairs = 0;

function togglePause(forceState) {
  if (!isRunning && !isPaused) return;
  isPaused = typeof forceState === "boolean" ? forceState : !isPaused;
  const overlay = document.getElementById("pauseOverlay");
  if (overlay) overlay.style.display = isPaused ? "flex" : "none";
  const btn = document.getElementById("btn-freeze");
  if (btn) btn.textContent = isPaused ? "▶️ 繼續任務" : "⏸️ 暫停講解";

  if (isPaused) {
    if (audioCtx && audioCtx.state === 'running') {
      audioCtx.suspend().catch(() => {});
    }
  } else {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }
}

function toggleZoom() {
  isZoomed = !isZoomed;
  const panel = document.getElementById("question-panel");
  if (panel) panel.classList.toggle("font-zoomed", isZoomed);
  const btn = document.getElementById("btn-zoom");
  if (btn) btn.textContent = isZoomed ? "🔍 標準字體" : "🔍 放大題目";
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && isRunning && !isPaused) {
    togglePause(true);
  }
});

/* ⏱️ 課堂 20 分鐘整體計時與多輪累積狀態 */
let sessionStartTime = null;
let sessionElapsedSeconds = 0;
let sessionTimer = null;
let sessionRounds = 1;
let sessionTotalScore = 0;
let sessionTotalCorrect = 0;
let sessionAnsweredQuestions = new Set();
let sessionWarned18m = false;

function formatSessionTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startSessionClock() {
  if (sessionTimer) return;
  sessionStartTime = Date.now();
  sessionTimer = setInterval(() => {
    if (!isRunning || isPaused) return;
    sessionElapsedSeconds++;
    const el = document.getElementById("session-time-val");
    if (el) el.textContent = formatSessionTime(sessionElapsedSeconds);

    if (sessionElapsedSeconds >= 18 * 60 && !sessionWarned18m) {
      sessionWarned18m = true;
      combatFeedback("🔔 課堂時間剩餘約 2 分鐘，請把握時間完成本輪並準備交卷！");
    }
  }, 1000);
}

let player = { x: 200, y: 400, w: 46, h: 42, speed: 7.5 };
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];
let keys = {};
let gameTick = 0;
let feedbackTimer = null;
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
function updateMissionUI() {
  const progress = document.getElementById("question-progress");
  if (progress) progress.textContent = isRunning ? `MISSION / ${Math.min(currentQIndex + 1, gameQuestions.length)} · ${gameQuestions.length}` : "任務待命";
  const roundEl = document.getElementById("round-val");
  if (roundEl) roundEl.textContent = sessionRounds;
  const statTag = document.getElementById("session-stats-tag");
  if (statTag) statTag.textContent = `第 ${sessionRounds} 輪 · 累計答對 ${sessionTotalCorrect} 題`;
  const fill = document.getElementById("mission-fill");
  if (fill) fill.style.width = (gameQuestions.length ? logs.length / gameQuestions.length * 100 : 0) + "%";
  for (const letter of "ABCD") {
    const card = document.getElementById("opt-" + letter);
    if (card) card.disabled = !isRunning || questionSettled;
  }
}
function combatFeedback(text) {
  const el = document.getElementById("combat-feedback");
  if (!el) return;
  clearTimeout(feedbackTimer);
  el.textContent = text;
  el.className = "";
  void el.offsetWidth;
  el.className = "show";
  feedbackTimer = setTimeout(() => { el.className = ""; }, 1400);
}
function revealAnswer(wrongLetter) {
  const q = gameQuestions[currentQIndex];
  for (const letter of "ABCD") {
    const el = document.getElementById("opt-" + letter);
    if (el) el.className = "opt-card " + letter + (letter === q.ans ? " is-correct" : letter === wrongLetter ? " is-wrong" : "");
  }
}

/* 洗牌演算法 (用於隨機抽題) */
function shuffleArray(arr) {
  let pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/* 讀取 URL 參數與動態載入 GitHub 題庫 Manifest */
async function initManifestAndUnits() {
  manifestData = null;
  currentUnitId = "";
  populateUnitSelects([]);
  const data = await readQuestionJSON("../questions/manifest.json");
  if (!Array.isArray(data.units) || !data.units.length || data.units.some(u => !u.file || !u.title)) {
    throw new Error("manifest 題庫清單格式錯誤或為空。");
  }
  manifestData = data;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("unit") || params.get("file");
  dispatchedUnit = requested ? resolveUnit(requested).file : "";
  populateUnitSelects(data.units);
  onUnitChange(dispatchedUnit);
}

function populateUnitSelects(units) {
  const selects = [document.getElementById("unit-select"), document.getElementById("modal-unit-select")];
  selects.forEach(sel => {
    if (!sel) return;
    sel.innerHTML = "";

    // 全部綜合題庫選項
    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "請選擇教師指定題庫";
    sel.appendChild(optAll);

    units.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.file || u.id;
      opt.textContent = u.title;
      sel.appendChild(opt);
    });
  });
}

function onUnitChange(val) {
  currentUnitId = dispatchedUnit || val;
  val = currentUnitId;
  const selTop = document.getElementById("unit-select");
  const selModal = document.getElementById("modal-unit-select");
  if (selTop) { selTop.value = val; selTop.disabled = !!dispatchedUnit || isRunning; }
  if (selModal) { selModal.value = val; selModal.disabled = !!dispatchedUnit; }
  updateUnitDisplayTitle();
}

function updateUnitDisplayTitle() {
  const disp = document.getElementById("unit-display-name");
  if (!disp) return;
  if (currentUnitId === "all") {
    disp.textContent = "📚 全單元綜合大考驗 (隨機抽題)";
    return;
  }
  if (manifestData && manifestData.units) {
    const u = manifestData.units.find(item => item.file === currentUnitId || item.id === currentUnitId);
    if (u) {
      disp.textContent = `📚 ${u.title}`;
      return;
    }
  }
  disp.textContent = `📚 生物單元測驗`;
}

/* 根據 currentUnitId 從 GitHub 題庫動態抓取並隨機抽題 */
async function fetchQuestionsForCurrentUnit() {
  if (currentUnitId === "FAST_DEFAULT" || !currentUnitId) {
    return DEFAULT_QUESTION_BANK;
  }
  try {
    if (!manifestData) {
      await initManifestAndUnits();
    }
    const resolved = resolveUnit(currentUnitId);
    if (!resolved || !resolved.file) {
      return DEFAULT_QUESTION_BANK;
    }
    return await loadSingleUnitFile(resolved.file);
  } catch (err) {
    console.warn("無法取得指定題庫，降級使用內建快問快答題庫:", err);
    return DEFAULT_QUESTION_BANK;
  }
}

async function loadSingleUnitFile(file) {
  if (loadedBankMap[file]) return loadedBankMap[file];
  const data = await readQuestionJSON("../questions/" + file);
  const raw = data.questions || (Array.isArray(data) ? data : []);
  if (!raw.length) throw new Error("指定題庫沒有題目：" + file);
  const formatted = raw.map((item, index) => {
    const values = Array.isArray(item.options) ? item.options : [item.options?.A, item.options?.B, item.options?.C, item.options?.D];
    const answer = item.answer ?? item.ans;
    const ans = typeof answer === "number" ? "ABCD"[answer] : String(answer).toUpperCase();
    const q = item.question || item.q;
    if (!q || values.length !== 4 || values.some(v => typeof v !== "string" || !v.trim()) || !/^[ABCD]$/.test(ans || "")) {
      throw new Error("題庫第 " + (index + 1) + " 題格式錯誤：" + file);
    }
    return { q, options: Object.fromEntries(values.map((v, i) => ["ABCD"[i], v])), ans, hint: item.explanation || item.hint || "請仔細審題觀念！" };
  });
  loadedBankMap[file] = formatted;
  return formatted;
}

/* ========================================================
   3. 畫布調整與星空背景
   ======================================================== */
function resizeCanvas() {
  const wrap = document.getElementById("canvas-wrap");
  const oldWidth = cw, oldHeight = ch;
  cw = wrap.clientWidth || 360;
  ch = wrap.clientHeight || 500;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cw * ratio);
  canvas.height = Math.round(ch * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  player.y = ch - 65;
  player.x = Math.max(player.w / 2, Math.min(cw - player.w / 2, player.x * cw / oldWidth));
  enemies.forEach((e, i) => { e.baseX = cw / 4 * (i + .5); e.x = e.baseX; });
  bullets.forEach(b => { b.x *= cw / oldWidth; b.y *= ch / oldHeight; });
  stars.forEach(star => { star.x *= cw / oldWidth; star.y *= ch / oldHeight; });
  if (!isRunning) { ctx.clearRect(0, 0, cw, ch); drawArena(); drawPlayer(player.x, player.y); }
}
window.addEventListener("resize", resizeCanvas);

function initStars() {
  stars = [];
  for (let i = 0; i < 45; i++) {
    stars.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: Math.random() * 1.6 + 0.6,
      vy: Math.random() * 1.2 + 0.4,
      alpha: Math.random() * 0.7 + 0.3
    });
  }
}

/* ========================================================
   4. 啟動與載入題目關卡 (銜接 BioGameSuite 終極模組)
   ======================================================== */
async function startMission(bonusCount) {
  if (isStarting || isRunning) return;
  isStarting = true;
  const launch = document.getElementById("launch-button");
  if (launch) { launch.disabled = true; launch.textContent = "正在連接指定題庫…"; }
  try {
    const student = (window.BioGameSuite && typeof window.BioGameSuite.getStudent === 'function')
      ? window.BioGameSuite.getStudent() : {};
    const cEl = document.getElementById("user-class");
    const sEl = document.getElementById("user-seat");
    const nEl = document.getElementById("user-name");

    let c = student.class || (cEl ? cEl.value.trim() : "") || "701";
    let s = student.seat || (sEl ? sEl.value.trim() : "") || "01";
    let n = student.name || (nEl ? nEl.value.trim() : "") || "防衛隊員";

    if (s.length === 1 && !isNaN(s)) s = "0" + s;

    playerProfile = { cls: c, seat: s, name: n };

    if (window.BioGameSuite && window.BioGameSuite.getStudent) {
      const st = window.BioGameSuite.getStudent();
      Object.assign(st, { class: c, seat: s, name: n });
    }

    initAudio();

    startSessionClock();
    if (bonusCount) {
      sessionRounds++;
    }

    if (student.unit && student.unit !== "FAST_DEFAULT") {
      currentUnitId = student.unit;
    } else if (!currentUnitId) {
      currentUnitId = dispatchedUnit || "FAST_DEFAULT";
    }

    // 取得題庫資料並隨機抽取題目 (20分鐘課堂防重複優先)
    const urlParams = new URLSearchParams(window.location.search);
    const targetQCount = bonusCount === 10 ? 10 : Math.max(1, parseInt(urlParams.get("qcount") || urlParams.get("count")) || 10);
    const pool = await fetchQuestionsForCurrentUnit();
    let unusedPool = pool.filter(q => !sessionAnsweredQuestions.has(q.q));
    if (unusedPool.length < targetQCount) {
      sessionAnsweredQuestions.clear();
      unusedPool = [...pool];
    }
    gameQuestions = shuffleArray(unusedPool).slice(0, targetQCount);
    gameQuestions.forEach(q => sessionAnsweredQuestions.add(q.q));

    document.getElementById("end-modal").style.display = "none";
    document.getElementById("start-modal").style.display = "none";
    document.getElementById("load-retry").style.display = "none";
    isOverheated = false;

    const unitSel = document.getElementById("unit-select");
    if (unitSel) unitSel.disabled = true;

    resizeCanvas();
    initStars();

    score = 0;
    lives = 3;
    combo = 0;
    emergencyRepairs = 0;
    isPaused = false;
    currentQIndex = 0;
    logs = [];
    particles = [];
    bullets = [];
    isRunning = true;

    updateHUD();
    loadQuestion(0);
    requestAnimationFrame(gameLoop);
  } catch (error) {
    showLoadError(error);
  } finally {
    isStarting = false;
    if (launch) { launch.disabled = false; launch.textContent = "啟動戰機 · 進入任務 →"; }
  }
}

function loadQuestion(idx) {
  questionVersion++;
  questionSettled = true;
  clearInterval(qTimer);
  clearTimeout(hintTimer);
  hintTimer = null;
  document.getElementById("hint-banner").style.display = "none";
  bullets = [];
  if (idx >= gameQuestions.length) {
    endMission();
    return;
  }

  for (const letter of "ABCD") document.getElementById("opt-" + letter).className = "opt-card " + letter;
  const q = gameQuestions[idx];
  if (!q.shuffled) {
    const origCorrectText = q.options[q.ans];
    const rawList = [
      { text: q.options.A },
      { text: q.options.B },
      { text: q.options.C },
      { text: q.options.D }
    ];
    for (let i = rawList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawList[i], rawList[j]] = [rawList[j], rawList[i]];
    }
    q.options = {
      A: rawList[0].text,
      B: rawList[1].text,
      C: rawList[2].text,
      D: rawList[3].text
    };
    if (q.options.A === origCorrectText) q.ans = "A";
    else if (q.options.B === origCorrectText) q.ans = "B";
    else if (q.options.C === origCorrectText) q.ans = "C";
    else if (q.options.D === origCorrectText) q.ans = "D";
    q.shuffled = true;
  }

  document.getElementById("q-text").textContent = `Q${idx + 1}. ${q.q}`;
  document.getElementById("opt-A").textContent = `A. ${q.options.A}`;
  document.getElementById("opt-B").textContent = `B. ${q.options.B}`;
  document.getElementById("opt-C").textContent = `C. ${q.options.C}`;
  document.getElementById("opt-D").textContent = `D. ${q.options.D}`;

  const monsterTypes = [
    { letter: 'A', theme: '#ff5252', name: "octopus" },
    { letter: 'B', theme: '#448aff', name: "jellyfish" },
    { letter: 'C', theme: '#ffd740', name: "cyclops" },
    { letter: 'D', theme: '#69f0ae', name: "slime" }
  ];

  enemies = [];
  const span = cw / 4;
  for (let i = 0; i < 4; i++) {
    enemies.push({
      ...monsterTypes[i],
      x: span * i + span / 2,
      y: 75,
      baseX: span * i + span / 2,
      baseY: 75 + (i % 2) * 12,
      w: 42,
      h: 42
    });
  }

  bullets = [];
  qTimeRemaining = 25;
  questionSettled = false;
  document.getElementById("time-fill").style.width = "100%";
  document.getElementById("time-fill").className = "time-bar-fill";
  const timerLabel = document.getElementById("timer-label");
  if (timerLabel) timerLabel.textContent = "25 秒";
  updateMissionUI();
  startTimer();
}

function startTimer() {
  clearInterval(qTimer);
  const version = questionVersion;
  qTimer = setInterval(() => {
    if (!isRunning || isPaused || questionSettled || version !== questionVersion) return;
    qTimeRemaining -= 0.1;
    const label = document.getElementById("timer-label");
    if (label) label.textContent = Math.max(0, Math.ceil(qTimeRemaining)) + " 秒";
    document.getElementById("time-fill").className = "time-bar-fill" + (qTimeRemaining <= 5 ? " urgent" : "");
    const pct = Math.max(0, (qTimeRemaining / 25) * 100);
    document.getElementById("time-fill").style.width = pct + "%";

    if (qTimeRemaining <= 0) {
      clearInterval(qTimer);
      handleTimeout();
    }
  }, 100);
}

// 每題只允許一個事件取得結算權，並移除本題殘留子彈。
function settleQuestion() {
  if (!isRunning || questionSettled) return false;
  questionSettled = true;
  clearInterval(qTimer);
  bullets = [];
  updateMissionUI();
  return true;
}

function handleTimeout() {
  if (!settleQuestion()) return;
  lives--;
  combo = 0;
  if (lives <= 0) {
    lives = 1;
    emergencyRepairs++;
    combatFeedback("🚨 護盾歸零！緊急防衛系統充能，堅持完成挑戰！");
  }
  updateHUD();
  soundExplode();
  revealAnswer();
  const current = gameQuestions[currentQIndex];
  logs.push({ q: current.q, correct: false, ans: current.ans, reason: "思考逾時", hint: current.hint });
  showHint(`⏰ 時間到！正確答案是 [${current.ans}]。<br>💡 <b>觀念解析：</b>${current.hint}`);
}

/* ========================================================
   5. 操控與鎖定雷射發射邏輯 (支援鍵盤數字鍵與教師暫停)
   ======================================================== */
window.addEventListener("keydown", (e) => {
  if (!isRunning || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName || "") || e.target?.isContentEditable) return;
  if (e.code === "KeyP" || (e.code === "Space" && e.ctrlKey)) {
    e.preventDefault();
    togglePause();
    return;
  }
  if (isPaused) return;
  if (e.code === "Space" && e.target?.tagName === "BUTTON") return;
  if (["Space", "ArrowLeft", "ArrowRight", "KeyA", "KeyB", "KeyC", "KeyD", "Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === "Space") {
    fireBullet();
  } else if (e.code === "KeyA" || e.code === "Digit1") {
    directShoot('A');
  } else if (e.code === "KeyB" || e.code === "Digit2") {
    directShoot('B');
  } else if (e.code === "KeyC" || e.code === "Digit3") {
    directShoot('C');
  } else if (e.code === "KeyD" || e.code === "Digit4") {
    directShoot('D');
  }
});

window.addEventListener("keyup", (e) => { keys[e.code] = false; });

window.addEventListener("blur", () => { keys = {}; });
let pointerId = null;
let isDragging = false;
let isAimingMonster = false;

function onOptionGridClick() {
  combatFeedback("🎯 鎖定作答：請操控戰機射擊怪獸，或直接戳天上的怪獸！");
}
window.onOptionGridClick = onOptionGridClick;

function positionPointer(clientX) {
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(player.w / 2, Math.min(cw - player.w / 2, (clientX - rect.left) * cw / rect.width));
}

canvas.addEventListener("pointerdown", (e) => {
  if (!isRunning || isPaused || questionSettled || pointerId !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
  e.preventDefault();
  pointerId = e.pointerId;
  canvas.setPointerCapture?.(e.pointerId);

  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * cw / rect.width;
  const clickY = (e.clientY - rect.top) * ch / rect.height;

  // 🎯 1. 觸控直接戳天上的外星怪：瞬間鎖定並直接開火！(Tap-to-Shoot Monster - 零學習門檻)
  const clickedEnemy = enemies.find(m => Math.hypot(clickX - m.x, clickY - m.y) < 58);
  if (clickedEnemy) {
    isAimingMonster = true;
    isDragging = false;
    player.x = clickedEnemy.x;
    fireBullet();
    return;
  }

  // 🚀 2. 在下方巡航區域碰觸：只負責滑動巡航，絕對不誤射子彈！
  isAimingMonster = false;
  isDragging = true;
  positionPointer(e.clientX);
});

canvas.addEventListener("pointermove", (e) => {
  if (pointerId === e.pointerId && isDragging) {
    positionPointer(e.clientX);
  }
});

for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  canvas.addEventListener(type, (e) => {
    if (pointerId === e.pointerId) {
      if (isDragging && !isAimingMonster && isRunning && !isPaused && !questionSettled) {
        // 🎯 巡航結束：手指抬起時發射雷射 (Release-to-Shoot)！
        fireBullet();
      }
      isDragging = false;
      isAimingMonster = false;
      pointerId = null;
    }
  });
}

/* 直覺鎖定發射：大黑板觸控或按 A/B/C/D 鍵 */
function directShoot(letter) {
  if (isPaused || isOverheated || !isRunning || questionSettled) return;
  const target = enemies.find(e => e.letter === letter);
  if (target) {
    player.x = target.x; // 戰機立刻移至對應怪物下方
    fireBullet();
  }
}

/* 無限制發射（移除原本 bullets.length >= 2 的鎖死問題） */
function fireBullet() {
  if (isPaused || isOverheated || !isRunning || questionSettled) return;
  bullets.push({ x: player.x, y: player.y - 18, vy: -11, r: 6 });
  soundLaser();
}

function hitTarget(enemy) {
  if (!enemies.includes(enemy) || !settleQuestion()) return;
  const q = gameQuestions[currentQIndex];
  createBurstParticles(enemy.x, enemy.y, enemy.theme);

  if (enemy.letter === q.ans) {
    soundHitCorrect();
    combo++;
    sessionTotalCorrect++;
    const speedBonus = Math.floor(qTimeRemaining * 10);
    score += 100 + combo * 25 + speedBonus;
    combatFeedback("🎯 命中正解 +" + (100 + combo * 25 + speedBonus) + (combo > 1 ? " · " + combo + " 連擊！" : ""));
    logs.push({ q: q.q, correct: true, ans: q.ans, hint: q.hint });
    updateHUD();
    currentQIndex++;
    setTimeout(() => {
      if (isRunning) loadQuestion(currentQIndex);
    }, 600);
  } else {
    soundExplode();
    lives--;
    combo = 0;
    if (lives <= 0) {
      lives = 1;
      emergencyRepairs++;
      combatFeedback("🚨 護盾歸零！緊急防衛系統充能，堅持完成挑戰！");
    }
    updateHUD();
    logs.push({ q: q.q, correct: false, ans: q.ans, myAns: enemy.letter, hint: q.hint });
    revealAnswer(enemy.letter);
    triggerOverheat();
    showHint(`❌ 擊中 [${enemy.letter}] 錯囉！正確答案是 [${q.ans}]。<br>💡 <b>觀念解析：</b>${q.hint}`);
  }
}

function triggerOverheat() {
  isOverheated = true;
  setTimeout(() => { isOverheated = false; }, 2200);
}

function showHint(html) {
  clearInterval(qTimer); // 確保觀看說明時時間停止
  const banner = document.getElementById("hint-banner");
  banner.innerHTML = html;
  banner.style.display = "block";
  const version = questionVersion;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    if (!isRunning || !questionSettled || version !== questionVersion) return;
    hintTimer = null;
    banner.style.display = "none";
    currentQIndex++;
    loadQuestion(currentQIndex);
  }, 3000);
}

function updateHUD() {
  document.getElementById("lives-val").textContent = lives;
  document.getElementById("score-val").textContent = score;
  document.getElementById("combo-val").textContent = combo;
  updateMissionUI();
}

function createBurstParticles(x, y, color) {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * 4 + 2,
      color,
      alpha: 1,
      decay: Math.random() * 0.03 + 0.02
    });
  }
}

/* ========================================================
   6. 繪製引擎 (全原生畫布繪製)
   ======================================================== */
function drawArena() {
  ctx.save();
  ctx.strokeStyle = "rgba(101,225,242,.065)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cw * i / 4, 40); ctx.lineTo(cw * i / 4, ch - 35); ctx.stroke(); }
  ctx.strokeStyle = "rgba(101,225,242,.12)";
  ctx.beginPath(); ctx.ellipse(cw / 2, ch - 60, cw * .43, 25, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cw / 2, ch - 60, cw * .43, 35, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function drawPlayer(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "#65e1f2";
  ctx.shadowBlur = 14;

  const flameHeight = Math.sin(gameTick * 0.4) * 4 + 14;
  ctx.fillStyle = isOverheated ? "#475569" : (combo >= 2 ? "#fbbf24" : "#38bdf8");
  ctx.beginPath();
  ctx.ellipse(0, 16, 6, flameHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isOverheated ? "#64748b" : (combo >= 2 ? "#f59e0b" : "#0284c7");
  ctx.beginPath();
  ctx.ellipse(0, 4, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isOverheated ? "#475569" : "#38bdf8";
  ctx.beginPath();
  ctx.arc(-18, 6, 7, 0, Math.PI * 2);
  ctx.arc(18, 6, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e0f2fe";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(-3, 0, 2.5, 0, Math.PI * 2);
  ctx.arc(3, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -18);
  ctx.stroke();

  ctx.fillStyle = combo >= 2 ? "#fbbf24" : "#38bdf8";
  ctx.beginPath();
  ctx.arc(0, -19, 3.5, 0, Math.PI * 2);
  ctx.fill();

  if (isOverheated) {
    ctx.fillStyle = "#f43f5e";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("💤 戰機冷卻中", 0, -25);
  }
  ctx.restore();
}

function drawMonster(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = e.theme;
  ctx.shadowBlur = 12;

  const bubbleY = -24 + Math.sin(gameTick * 0.1) * 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, bubbleY, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = e.theme;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(e.letter, 0, bubbleY + 1);

  // 📝 怪物頭頂浮動選項短標籤 (讓怪獸本身就是答案本體！)
  const currentQ = gameQuestions[currentQIndex];
  const optVal = currentQ?.options?.[e.letter] || "";
  if (optVal) {
    const shortLabel = optVal.length > 7 ? optVal.slice(0, 6) + "…" : optVal;
    ctx.save();
    ctx.font = "bold 11px sans-serif";
    const textW = ctx.measureText(shortLabel).width;
    const bW = Math.max(38, textW + 14);
    const bY = 22;
    ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
    ctx.strokeStyle = e.theme;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-bW / 2, bY, bW, 18, 5);
    else ctx.rect(-bW / 2, bY, bW, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shortLabel, 0, bY + 9);
    ctx.restore();
  }

  ctx.fillStyle = e.theme;

  if (e.name === "octopus") {
    ctx.beginPath();
    ctx.arc(0, 0, 16, Math.PI, 0);
    ctx.lineTo(16, 8);
    const wave = Math.sin(gameTick * 0.15) * 3;
    ctx.quadraticCurveTo(8, 18 + wave, 0, 8);
    ctx.quadraticCurveTo(-8, 18 - wave, -16, 8);
    ctx.closePath();
    ctx.fill();
    drawEyes(-5, 0, 5, 0);

  } else if (e.name === "jellyfish") {
    ctx.beginPath();
    ctx.arc(0, -2, 17, Math.PI, 0);
    ctx.quadraticCurveTo(0, 12, -17, -2);
    ctx.fill();

    ctx.strokeStyle = e.theme;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 6);
    ctx.lineTo(-8, 15 + Math.sin(gameTick * 0.2) * 4);
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 18 + Math.cos(gameTick * 0.2) * 4);
    ctx.moveTo(8, 6);
    ctx.lineTo(8, 15 - Math.sin(gameTick * 0.2) * 4);
    ctx.stroke();
    drawEyes(-5, -3, 5, -3);

  } else if (e.name === "cyclops") {
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -1, 8, 0, Math.PI * 2);
    ctx.fill();

    const eyeMove = Math.sin(gameTick * 0.08) * 2;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(eyeMove, 0, 4, 0, Math.PI * 2);
    ctx.fill();

  } else if (e.name === "slime") {
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(18, -10, 20, 14, 0, 14);
    ctx.bezierCurveTo(-20, 14, -18, -10, 0, -18);
    ctx.fill();

    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(4, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    drawEyes(-6, 0, 6, 0);
  }

  ctx.restore();
}

function drawEyes(x1, y1, x2, y2) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x1, y1, 4, 0, Math.PI * 2);
  ctx.arc(x2, y2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(x1, y1, 2, 0, Math.PI * 2);
  ctx.arc(x2, y2, 2, 0, Math.PI * 2);
  ctx.fill();
}

/* 遊戲主迴圈 */
function gameLoop() {
  if (!isRunning) return;

  if (!isPaused) {
    gameTick++;

    stars.forEach(s => {
      s.y += reducedMotion ? 0 : s.vy;
      if (s.y > ch) s.y = 0;
    });

    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    player.x = Math.max(player.w / 2, Math.min(cw - player.w / 2, player.x));

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y += b.vy;

      let hit = false;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < 26) {
          hit = true;
          hitTarget(e);
          break;
        }
      }
      if (hit) break;
      if (b.y < 0) bullets.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  ctx.clearRect(0, 0, cw, ch);
  drawArena();

  stars.forEach(s => {
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  drawPlayer(player.x, player.y);

  // 🎯 戰機瞄準輔助導引線 (Laser Sight Reticle)
  if (isDragging && !isPaused) {
    ctx.save();
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = combo >= 2 ? "rgba(251, 191, 36, 0.45)" : "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 20);
    ctx.lineTo(player.x, 45);
    ctx.stroke();
    ctx.restore();
  }

  enemies.forEach(e => {
    const curX = isPaused ? e.x : (e.baseX + Math.sin(gameTick * 0.04) * 22);
    const curY = isPaused ? e.y : (e.baseY + Math.cos(gameTick * 0.06) * 6);
    e.x = curX;
    e.y = curY;
    drawMonster(e);
  });

  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    ctx.save();
    ctx.fillStyle = combo >= 2 ? "#fbbf24" : "#00e5ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 12;
    ctx.fillRect(b.x - 2, b.y, 4, 15);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(gameLoop);
}

/* ========================================================
   7. 結算與一鍵複製防偽證書成績
   ======================================================== */
function endMission() {
  isRunning = false;
  isPaused = false;
  questionSettled = true;
  questionVersion++;
  clearTimeout(hintTimer);
  hintTimer = null;
  bullets = [];
  clearInterval(qTimer);

  updateMissionUI();
  document.getElementById("end-modal").style.display = "flex";

  const correctCount = logs.filter(l => l.correct).length;
  let rank = "🌱 微生物小實習生";
  if (score >= 1000 && correctCount >= 9) {
    rank = "👑 傳奇達爾文星艦艦長";
    soundVictory();
  } else if (score >= 600 || correctCount >= 7) {
    rank = "🧬 細胞防衛隊長";
    soundVictory();
  } else {
    soundGameOver();
  }
  document.getElementById("end-rank").textContent = `評級：${rank}`;

  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ` +
                  `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  const rawCode = `${playerProfile.seat}_${score}_${now.getSeconds()}`;
  let hash = 0;
  for (let i = 0; i < rawCode.length; i++) {
    hash = ((hash << 5) - hash) + rawCode.charCodeAt(i);
    hash |= 0;
  }
  const certHash = "DEFENDER-" + Math.abs(hash).toString(16).toUpperCase().padStart(6, '0');

  const userTag = `${playerProfile.cls} 班 ${playerProfile.seat} 號 ${playerProfile.name}`;
  document.getElementById("cert-user").textContent = userTag;
  document.getElementById("cert-watermark").textContent = userTag;
  document.getElementById("cert-score").textContent = score;
  document.getElementById("cert-stats").textContent = `${correctCount} / ${gameQuestions.length}`;
  document.getElementById("cert-time").textContent = timeStr;
  document.getElementById("cert-hash").textContent = certHash;

  const listEl = document.getElementById("review-list");
  listEl.innerHTML = "";
  logs.forEach((l, idx) => {
    const div = document.createElement("div");
    div.className = `review-item ${l.correct ? 'correct' : 'wrong'}`;
    div.innerHTML = `<strong>第 ${idx + 1} 題：</strong>${l.q}<br>` +
      (l.correct
        ? `✅ <b>答對！</b>正解: [${l.ans}]`
        : `❌ <b>答錯！</b>你的選擇: [${l.myAns || l.reason || '超時'}] ｜ <b>正確答案: [${l.ans}]</b><br><span style="color:#0369a1; font-size:12px; display:inline-block; margin-top:2px;">💡 <b>觀念解析：</b>${l.hint || '請複習本單元重點觀念。'}</span>`
      );
    listEl.appendChild(div);
  });

  // 自動叫起終極三階段標準結算彈窗 (GAS 自動提交 + 雙軌分支 + 4大自我檢核)
  triggerDefenderGasSubmit();
}

/* 一鍵複製防偽文字報告 */
function copyCertText() {
  const userTag = document.getElementById("cert-user").textContent;
  const scoreVal = document.getElementById("cert-score").textContent;
  const statsVal = document.getElementById("cert-stats").textContent;
  const timeVal = document.getElementById("cert-time").textContent;
  const hashVal = document.getElementById("cert-hash").textContent;
  const rankVal = document.getElementById("end-rank").textContent;

  const wrongNotes = logs
    .filter(l => !l.correct)
    .map((l, i) => `${i + 1}. 題目：${l.q}\n   ❌ 選擇：[${l.myAns || l.reason || '超時'}] ｜ ✅ 正解：[${l.ans}]\n   💡 解析：${l.hint || '無'}`)
    .join('\n');

  const textToCopy = `【生物星際防衛隊 課堂學習戰報】\n` +
    `👤 隊員身分：${userTag}\n` +
    `🎖️ 任務評級：${rankVal}\n` +
    `🏆 最終戰分：${scoreVal} 分\n` +
    `🎯 答對題數：${statsVal}\n` +
    `📅 完成時間：${timeVal}\n` +
    `🔒 防偽序號：${hashVal}\n` +
    `🌱 平台：bio-games (GitHub Pages)\n\n` +
    `📝【錯題觀念自我檢討】\n` +
    (wrongNotes ? wrongNotes : '🎉 本次挑戰全員全對，觀念精熟！');

  const statusEl = document.getElementById("copyStatus");
  const copyRes = document.getElementById("copyResult");
  if (copyRes) {
    copyRes.value = textToCopy;
    copyRes.style.display = "block";
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (statusEl) statusEl.textContent = "✅ 已成功複製學習戰報與錯題檢討至剪貼簿！";
    }).catch(() => {
      fallbackCopy(textToCopy);
    });
  } else {
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  const statusEl = document.getElementById("copyStatus");
  try {
    document.execCommand('copy');
    if (statusEl) statusEl.textContent = "✅ 已成功複製學習戰報與錯題檢討至剪貼簿！";
  } catch (err) {
    if (statusEl) statusEl.textContent = "⚠️ 請手動複製下方文字框或截圖保存。";
  }
  document.body.removeChild(textArea);
}

// 叫起通用三階段結算彈窗
function triggerDefenderGasSubmit() {
  if (typeof showScoreSubmitModal === "function") {
    const student = (window.BioGameSuite && typeof window.BioGameSuite.getStudent === 'function')
      ? window.BioGameSuite.getStudent() : {};
    const correctCount = logs.filter(l => l.correct).length;
    showScoreSubmitModal({
      gameTitle: GAME_TITLE,
      gameId: "defender",
      score: score,
      scoreDisplay: `${score} 分 (第 ${sessionRounds} 輪 答對 ${correctCount}/${gameQuestions.length} 題 · 累計答對 ${sessionTotalCorrect} 題)`,
      duration: `課堂歷時 ${formatSessionTime(sessionElapsedSeconds)} (完成 ${sessionRounds} 輪)`,
      initialClass: student.class || playerProfile.cls || "701",
      initialSeat: student.seat || playerProfile.seat || "01",
      initialName: student.name || playerProfile.name || "防衛隊員",
      onBonusChallenge: () => {
        startMission(10);
      },
      onRetry: () => {
        startMission();
      }
    });
  }
}

// 初始化題庫清單與畫布
async function initializeDefender() {
  resizeCanvas();
  try {
    await initManifestAndUnits();
    const errEl = document.getElementById("load-error");
    if (errEl) errEl.textContent = "";
    const retryEl = document.getElementById("load-retry");
    if (retryEl) retryEl.style.display = "none";

    const raw = sessionStorage.getItem("bgs_authed_student");
    let student;
    try { student = raw ? JSON.parse(raw) : null; } catch (_) {}
    if (student?.name && student.class && student.seat && dispatchedUnit) {
      for (const [id, value] of [["user-class", student.class], ["user-seat", student.seat], ["user-name", student.name]]) {
        const el = document.getElementById(id);
        if (el) el.value = value;
      }
      if (window.BioGameSuite) Object.assign(window.BioGameSuite.getStudent(), student);
      await startMission();
    }
  } catch (error) {
    showLoadError(error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initializeDefender();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(resizeCanvas).observe(document.getElementById("canvas-wrap"));
  }
});

window.startGame = startMission;
window.startMission = startMission;
