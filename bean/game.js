
function cleanUnitTitle(raw) {
  if (!raw) return '精選題庫';
  let str = String(raw).trim();
  try { str = decodeURIComponent(str); } catch (_) {}
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

'use strict';
const $ = id => document.getElementById(id);
const TAGS = ['A', 'B', 'C', 'D'];

// --- Web Audio 音效引擎 ---
let audioCtx = null;
let soundOn = true;

function safeAudio() {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
}

window.addEventListener('click', safeAudio, { once: true });
window.addEventListener('touchstart', safeAudio, { once: true });

function beep(kind, pitchStep = 0) {
  if (!soundOn) return;
  safeAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);

  if (kind === 'good') {
    const baseFreq = 420 + pitchStep * 60;
    o.type = 'triangle';
    o.frequency.setValueAtTime(baseFreq, now);
    o.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.start(now);
    o.stop(now + 0.16);
  } else if (kind === 'gold') {
    o.type = 'sine';
    o.frequency.setValueAtTime(650, now);
    o.frequency.exponentialRampToValueAtTime(1050, now + 0.2);
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    o.start(now);
    o.stop(now + 0.21);
  } else if (kind === 'bad') {
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, now);
    o.frequency.linearRampToValueAtTime(90, now + 0.22);
    g.gain.setValueAtTime(0.3, now);
    g.gain.linearRampToValueAtTime(0.001, now + 0.22);
    o.start(now);
    o.stop(now + 0.23);
  } else if (kind === 'win') {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.25, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.25);
    });
  } else if (kind === 'gameover') {
    const notes = [300, 250, 200, 150];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      gain.gain.setValueAtTime(0.3, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.2);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.2);
    });
  }
}

// 語音朗讀輔助
function speak(text, pitch = 1.2, rate = 1.12) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    u.pitch = pitch;
    u.rate = rate;
    speechSynthesis.speak(u);
  } catch (e) {}
}

// --- 備用題庫 (20題完整保底) ---
const fallbackBank = [
  {
    question: "國中生物課進行『植物行光合作用產生澱粉』實驗時，下列何者最常選用作為實驗葉片？",
    options: ["地瓜葉", "榕樹葉", "變葉木", "仙人掌針狀葉"],
    answer: 0,
    explanation: "地瓜葉葉肉薄、色素容易被熱酒精溶出，是光合作用澱粉檢驗的最佳材料。"
  },
  {
    question: "被稱為細胞內的『能量發電廠』，負責呼吸作用產生 ATP 的構造為何？",
    options: ["核糖體", "粒線體", "內質網", "葉綠體"],
    answer: 1,
    explanation: "粒線體能氧化分解葡萄糖釋放細胞所需能量。"
  },
  {
    question: "生物進行觀察與實驗時，下列何者是控制變因？",
    options: ["實驗中保持不變的因素", "實驗中操作改變的因素", "實驗測量產生的結果", "完全不作處理的組別"],
    answer: 0,
    explanation: "控制變因是指實驗過程中所有必須維持相同的變因。"
  },
  {
    question: "使用複式顯微鏡觀察洋蔥表皮細胞時，若將玻片向左上方移動，則視野中的影像會向何方移動？",
    options: ["右下方", "左上方", "右上方", "左下方"],
    answer: 0,
    explanation: "複式顯微鏡成的影像是上下顛倒、左右相反的倒立實像，玻片向左上移，影像向右下移。"
  },
  {
    question: "生物體內的酵素（生物催化劑）主要化學成分為何？",
    options: ["蛋白質", "葡萄糖", "脂質", "核酸"],
    answer: 0,
    explanation: "酵素主要由蛋白質構成，其活性易受溫度與 pH 值影響。"
  },
  {
    question: "下列何者為『擴散作用』的主要特徵？",
    options: ["分子由高濃度往低濃度自然移動", "必須消耗細胞能量 ATP", "僅能透過酵素輔助進行", "只能在活細胞中發生"],
    answer: 0,
    explanation: "擴散作用是分子由高濃度區域向低濃度區域擴散的物理現象，不需消耗細胞能量。"
  },
  {
    question: "人類心臟四個腔室中，哪一個腔室的心肌最發達厚實，能將血液泵送至全身？",
    options: ["左心室", "右心室", "左心房", "右心房"],
    answer: 0,
    explanation: "左心室負責推動體循環將血液送往全身器官，因此心肌最為發達厚實。"
  },
  {
    question: "人體的『體循環』路徑，起點與終點分別為何？",
    options: ["左心室起點，右心房終點", "右心室起點，左心房終點", "左心房起點，右心室終點", "右心房起點，左心室終點"],
    answer: 0,
    explanation: "體循環由左心室出發經大動脈至全身微血管，最後匯集至大靜脈回到右心房。"
  },
  {
    question: "當飯後血糖濃度升高時，人體主要分泌哪一種激素以促進血糖轉化為肝糖儲存？",
    options: ["胰島素", "腎上腺素", "甲狀腺素", "生長激素"],
    answer: 0,
    explanation: "胰島素由胰島 β 細胞分泌，能促進細胞吸收葡萄糖並合成肝糖以降低血糖。"
  },
  {
    question: "綠色植物光合作用的『光反應』階段，主要會產生哪一種氣體？",
    options: ["氧氣", "二氧化碳", "氮氣", "水蒸氣"],
    answer: 0,
    explanation: "光反應在葉綠體葉綠餅進行，水分子吸收光能被分解釋放出氧氣。"
  },
  {
    question: "人體消化器官中，胃液呈強酸性主要含有何種化學成分？",
    options: ["鹽酸", "硫酸", "醋酸", "硝酸"],
    answer: 0,
    explanation: "胃腺分泌胃酸（鹽酸），可提供強酸環境活化胃蛋白酵素並殺滅食物中的細菌。"
  },
  {
    question: "生物體的構造層級中，『心臟、血管與血液』共同組成的層級為何？",
    options: ["器官系統", "器官", "組織", "個體"],
    answer: 0,
    explanation: "多個功能相關的器官共同運作構成「器官系統」（循環系統）。"
  },
  {
    question: "植物體內運輸水分與無機鹽的主要構造為何？",
    options: ["木質部", "韌皮部", "形成層", "表皮細胞"],
    answer: 0,
    explanation: "木質部主要由假導管與導管組成，負責由下往上單向運輸水分與溶於水的無機鹽。"
  },
  {
    question: "高大樹木能將根部吸收的水分拉升至幾十公尺高的樹頂，最主要的動力來源為何？",
    options: ["葉片的蒸散作用", "根壓作用", "毛細現象", "光合作用消耗"],
    answer: 0,
    explanation: "葉片氣孔蒸散水分產生的拉力（蒸散拉力）是植物體內水分向上運輸的最主要動力。"
  },
  {
    question: "植物葉片上的『氣孔』主要由哪一種細胞控制其開啟與關閉？",
    options: ["保衛細胞", "葉肉細胞", "表皮細胞", "角質層"],
    answer: 0,
    explanation: "保衛細胞成對存在，吸水膨脹時氣孔張開，失水萎縮時氣孔關閉。"
  },
  {
    question: "人體神經系統與內分泌系統相比，下列何者為『神經系統』的作用特點？",
    options: ["反應迅速且作用範圍局限", "反應緩慢但作用持久", "透過血液運輸化學物質", "影響全身廣泛細胞"],
    answer: 0,
    explanation: "神經系統透過電訊號與神經傳導物質傳遞，特點是反應極為迅速且控制精準局限。"
  },
  {
    question: "植物莖部的向光性生長，主要是因為莖部背光側的哪一種物質濃度較高？",
    options: ["生長素", "吉貝素", "乙烯", "脫落酸"],
    answer: 0,
    explanation: "單側光照射下，生長素會向背光側移動，刺激背光側細胞快速伸長，使莖彎向光源。"
  },
  {
    question: "人體消化道中，消化與吸收養分最主要、最主要的器官為何？",
    options: ["小腸", "大腸", "胃", "口腔"],
    answer: 0,
    explanation: "小腸長且內壁有密集的絨毛，是食物完成消化與吸收大多數養分的最主要器官。"
  },
  {
    question: "人體唾液中的澱粉酵素，在下列哪一種 pH 值環境下的催化活性最高？",
    options: ["pH 7（接近中性）", "pH 2（強酸性）", "pH 12（強鹼性）", "pH 4（弱酸性）"],
    answer: 0,
    explanation: "唾液澱粉酵素的最適 pH 值約為 6.8~7.0 接近中性，在胃部強酸環境下會失去活性。"
  },
  {
    question: "科學探究歷程中，『假說』經過多次實驗廣泛驗證皆成立後，可上升為什麼？",
    options: ["學說或定律", "觀察紀錄", "控制變因", "實驗結果"],
    answer: 0,
    explanation: "假說若能禁得起廣泛反複實驗驗證且具普遍預測力，最終可發展為學說。"
  }
];

// --- 全域狀態 ---
let manifestUnits = [];
let rawBank = [];
let pool = [];
let idx = 0;
let score = 0;
let combo = 0;
let maxCombo = 0;
let hammerLevel = 1;
let selectedCount = 10;
let selectedUnitId = 'all';
let locked = true;
let stunned = false;
let questionStart = 0;
let attempts = 0;
let totalAttempts = 0;
let correctFirstTry = 0;
let startTime = 0;
let totalTimeSec = 0;
let studentProfile = { className: '701', seat: '01', name: '' };
let currentCertCode = '';

let spawnTimer = null;
let hideTimer = null;
let tickTimer = null;
let currentSpawn = null;
let initialized = false;
let starting = false;
let paused = false;
let pausedAt = 0;
let questionSettled = false;
let correctCount = 0;
const pendingDelays = new Set();

// All round callbacks are owned by the current question and can be paused or cancelled.
function gameDelay(fn, ms) {
  const task = { fn, remaining: ms, due: performance.now() + ms, id: null };
  pendingDelays.add(task);
  if (!paused) armDelay(task);
  return task;
}
function armDelay(task) {
  task.due = performance.now() + task.remaining;
  task.id = setTimeout(() => { pendingDelays.delete(task); task.fn(); }, task.remaining);
}
function cancelDelay(task) {
  if (!task) return;
  clearTimeout(task.id);
  pendingDelays.delete(task);
}
function setPaused(value) {
  if (!document.body.classList.contains('playing') || value === paused) return;
  paused = value;
  if (paused) {
    pausedAt = performance.now();
    clearInterval(tickTimer);
    pendingDelays.forEach(task => {
      task.remaining = Math.max(0, task.due - pausedAt);
      clearTimeout(task.id);
    });
    try { speechSynthesis.cancel(); } catch (_) {}
  } else {
    const elapsed = performance.now() - pausedAt;
    questionStart += elapsed;
    startTime += elapsed;
    pendingDelays.forEach(armDelay);
    if (!questionSettled) tickTimer = setInterval(tick, 200);
  }
  document.body.classList.toggle('is-paused', paused);
  $('pauseModal').hidden = !paused;
  $('pauseBtn').setAttribute('aria-pressed', String(paused));
}
function togglePause() { setPaused(!paused); }
function toggleSound() {
  soundOn = !soundOn;
  $('soundBtn').textContent = soundOn ? '♪ 音效開' : '♪ 音效關';
  $('soundBtn').setAttribute('aria-pressed', String(soundOn));
  if (soundOn) safeAudio();
  else { try { speechSynthesis.cancel(); } catch (_) {} }
}
function setQuestionCount(value) {
  selectedCount = value;
  document.querySelectorAll('.btn-pill').forEach(b => {
    const active = b.dataset.count === String(value);
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
}
function presentLaunch(student) {
  if (student) {
    window.BioGameSuite?.syncStudentToDom(student);
    studentProfile = { className: student.class, seat: student.seat, name: student.name };
  }
  checkUrlParams();
  const profile = $('launchProfile');
  if (profile) profile.textContent = studentProfile.name ? studentProfile.className + ' 班 · ' + studentProfile.seat + ' 號 · ' + studentProfile.name : '準備好進行今天的生物觀察了嗎？';
  $('beanLaunch').hidden = false;
  $('beanLaunch').classList.toggle('authenticated', !!studentProfile.name);
  $('startBtn').disabled = false;
}
function continueQuestion() {
  if ($('feedbackModal').hidden) return;
  $('feedbackModal').hidden = true;
  idx++;
  renderQuestion();
}
function markAnswer(hole, kind) {
  const card = document.querySelector('[data-answer="' + hole + '"]');
  if (card) card.classList.add(kind);
}
function hitBurst(hole, label, kind) {
  const col = document.querySelector('[data-hole="' + hole + '"]');
  if (!col) return;
  const burst = document.createElement('span');
  burst.className = 'hit-burst ' + kind;
  burst.textContent = label;
  col.appendChild(burst);
  gameDelay(() => burst.remove(), 600);
}

const cfg = {
  questionMs: 25000,
  readMs: 2500,
  spawnMin: 900,
  spawnMax: 1550,
  visibleMs: 1300,
  stunMs: 1200,
  wrongCooldown: 800,
  goldChance: 0.08,
  obstacleChance: 0.22
};

// --- 初始化入口 ---
window.addEventListener('DOMContentLoaded', init);

async function init() {
  loadSavedProfile();
  buildArena();
  bindUI();
  await loadManifestAndUnits();
  checkUrlParams();
  setupKeyboardHotkeys();
  initialized = true;
  let saved = null;
  try {
    const candidate = JSON.parse(sessionStorage.getItem('bgs_authed_student') || 'null');
    if (candidate?.name && candidate.class && candidate.seat) saved = candidate;
  } catch (_) {}
  if (saved) presentLaunch(saved);
  else if (window.BioGameSuite) {
    window.BioGameSuite.showLogin({ gameTitle: '淘氣豆・生物研究站', onStart: presentLaunch });
  } else presentLaunch();
}

// 載入預存個人資料
function loadSavedProfile() {
  try {
    const saved = localStorage.getItem('bean_student_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.className) $('inputClass').value = parsed.className;
      if (parsed.seat) $('inputSeat').value = parsed.seat;
      if (parsed.name) $('inputName').value = parsed.name;
    }
  } catch (e) {}
}

function saveProfile(className, seat, name) {
  try {
    localStorage.setItem('bean_student_profile', JSON.stringify({ className, seat, name }));
  } catch (e) {}
}

// 動態載入題庫 Manifest
async function loadManifestAndUnits() {
  const select = $('unitSelect');
  select.innerHTML = '<option value="all">綜合觀察 · 隨機單元</option>';

  const manifestPaths = ['../questions/manifest.json', 'questions/manifest.json'];
  let manifestData = null;

  for (const path of manifestPaths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        manifestData = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (manifestData && manifestData.units) {
    manifestUnits = manifestData.units;
    manifestUnits.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.file;
      opt.textContent = u.title;
      select.appendChild(opt);
    });
  }
}

// 檢查 URL 參數
function checkUrlParams() {
  const p = new URLSearchParams(location.search);
  const paramUnit = p.get('unit') || p.get('file');
  const paramCount = p.get('count') || p.get('qcount');
  const paramClass = p.get('class');
  const paramSeat = p.get('seat');
  const paramName = p.get('name');

  if (paramClass) $('inputClass').value = paramClass;
  if (paramSeat) $('inputSeat').value = paramSeat;
  if (paramName) $('inputName').value = paramName;

  if (paramUnit) {
    $('unitSelect').disabled = true;
    const decoded = paramUnit.trim();
    const match = manifestUnits.find(u => u.file === decoded || u.id === decoded);
    selectedUnitId = match ? match.file : decoded;
    if (Array.from($('unitSelect').options).some(o => o.value === selectedUnitId)) {
      $('unitSelect').value = selectedUnitId;
    } else {
      const customOpt = document.createElement('option');
      customOpt.value = selectedUnitId;
      customOpt.textContent = (typeof cleanUnitTitle === "function" ? cleanUnitTitle(selectedUnitId) : selectedUnitId);
      $('unitSelect').appendChild(customOpt);
      $('unitSelect').value = selectedUnitId;
    }
  }

  if (paramCount) {
    selectedCount = paramCount === 'all' ? 'all' : Math.max(1, parseInt(paramCount, 10) || 10);
    $('countWrap').hidden = true;
    $('presetTag').hidden = false;
    $('presetTag').textContent = `✨ 老師指派：${selectedCount === 'all' ? '全部題目' : selectedCount + ' 題'}`;
  }
}

// 建立舞台與選項
function buildArena() {
  const arena = $('fieldStage');
  const answers = $('answers');
  arena.innerHTML = '';
  answers.innerHTML = '';

  TAGS.forEach((tag, i) => {
    // 選項卡片
    const a = document.createElement('button');
    a.type = 'button';
    a.dataset.answer = i;
    a.addEventListener('pointerdown', e => { e.preventDefault(); hitHole(i); });
    a.addEventListener('click', e => { if (e.detail === 0) hitHole(i); });
    a.className = 'answer-card';
    a.innerHTML = `<span class="answer-tag">${tag}</span><span id="answer-${i}">—</span>`;
    answers.appendChild(a);

    // 地洞
    const col = document.createElement('div');
    col.className = 'hole-column';
    col.innerHTML = `
      <div class="hole-label">${tag}</div>
      <div class="hole" data-hole="${i}" role="button" tabindex="0" aria-label="敲擊 ${tag} 洞">
        <div class="character-slot" id="slot-${i}"></div>
      </div>
    `;
    col.querySelector('.hole').addEventListener('pointerdown', e => {
      e.preventDefault();
      hitHole(i);
    });
    col.querySelector('.hole').addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); hitHole(i); }
    });
    arena.appendChild(col);
  });
}

// 鍵盤快捷鍵監聽
function setupKeyboardHotkeys() {
  window.addEventListener('keydown', e => {
    if (e.repeat || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'Escape') {
      if (!$('instructionsModal').hidden) toggleInstructionsModal(false);
      else togglePause();
      return;
    }
    if (paused) return;
    const key = e.key.toUpperCase();
    if (key === 'A' || key === '1') hitHole(0);
    else if (key === 'B' || key === '2') hitHole(1);
    else if (key === 'C' || key === '3') hitHole(2);
    else if (key === 'D' || key === '4') hitHole(3);
    else if (key === 'ENTER' || key === ' ') {
      const modal = $('feedbackModal');
      if (modal && !modal.hidden) {
        e.preventDefault();
        continueQuestion();
      }
    }
  });
}

// 綁定 UI 事件
function bindUI() {
  document.querySelectorAll('.btn-pill').forEach(b => {
    b.addEventListener('click', () => {
      selectedCount = b.dataset.count === 'all' ? 'all' : Number(b.dataset.count);
      document.querySelectorAll('.btn-pill').forEach(x => x.classList.toggle('active', x === b));
    });
  });

  // 桌機滑鼠懸浮大錘
  document.addEventListener('pointermove', e => {
    const h = $('hammerCursor');
    if (h) {
      h.style.left = e.clientX + 'px';
      h.style.top = e.clientY + 'px';
    }
  });
  document.addEventListener('pointerdown', () => $('hammerCursor')?.classList.add('swing'));
  document.addEventListener('pointerup', () => gameDelay(() => $('hammerCursor')?.classList.remove('swing'), 90));
}

// 驗證學生表單
function validateStudentProfile() {
  const className = $('inputClass').value.trim();
  let seat = $('inputSeat').value.trim();
  const name = $('inputName').value.trim();
  const tip = $('profileErrorTip');

  if (/^\d{1}$/.test(seat)) {
    seat = '0' + seat;
    $('inputSeat').value = seat;
  }

  if (!className || !/^\d{2}$/.test(seat) || name.length < 2) {
    tip.style.display = 'block';
    return null;
  }

  tip.style.display = 'none';
  studentProfile = { className, seat, name };
  saveProfile(className, seat, name);
  return studentProfile;
}

// 載入題庫內容
async function fetchQuestionsForUnit(unitId) {
  let loaded = [];
  const basePathCandidates = ['../questions/', 'questions/'];

  if (manifestUnits.length === 0) {
    await loadManifestAndUnits();
  }

  const parseQuestions = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.questions)) return data.questions;
    return [];
  };

  if (unitId === 'all' || unitId === 'FAST_DEFAULT' || !unitId) {
    // ⭐ 嚴禁循序抓取 94 個單元！隨機並行取樣最多 3 個單元，100ms 極速完成！
    if (manifestUnits.length > 0) {
      const sampleUnits = shuffle(manifestUnits).slice(0, 3);
      for (const unit of sampleUnits) {
        for (const basePath of basePathCandidates) {
          try {
            const res = await fetch(basePath + unit.file);
            if (res.ok) {
              const data = await res.json();
              const qList = parseQuestions(data);
              loaded.push(...qList);
              break;
            }
          } catch (e) {}
        }
      }
    }
    if (loaded.length === 0) {
      return fallbackBank;
    }
  } else {
    const target = manifestUnits.find(u => u.file === unitId || u.id === unitId);
    const fileName = target ? target.file : (unitId.endsWith('.json') ? unitId : `${unitId}.json`);
    for (const basePath of basePathCandidates) {
      try {
        const res = await fetch(basePath + fileName);
        if (res.ok) {
          const data = await res.json();
          const qList = parseQuestions(data);
          loaded.push(...qList);
          break;
        }
      } catch (e) {}
    }
  }

  const validList = loaded.filter(validQuestion);
  return validList.length > 0 ? validList : fallbackBank;
}

function correctIndex(q) {
  if (Number.isInteger(q.answer)) return q.answer >= 0 && q.answer <= 3 ? q.answer : -1;
  if (typeof q.answer === 'string') {
    const s = q.answer.trim().toUpperCase();
    if (TAGS.includes(s)) return TAGS.indexOf(s);
    const n = Number(s);
    if (Number.isInteger(n) && n >= 0 && n <= 3) return n;
  }
  return -1;
}

function validQuestion(q) {
  return q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4 && correctIndex(q) >= 0;
}

function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

// 開始遊戲
async function startGame() {
  if (!initialized || starting) return;
  safeAudio();
  const alreadyAuthed = window.BioGameSuite && window.BioGameSuite.getStudent && window.BioGameSuite.getStudent().name;
  if (alreadyAuthed) {
    const s = window.BioGameSuite.getStudent();
    studentProfile = { className: s.class, seat: s.seat, name: s.name };
  } else {
    const profile = validateStudentProfile();
    if (!profile) return;
  }

  selectedUnitId = $('unitSelect').value;
  const suiteStudent = window.BioGameSuite?.getStudent?.();
  if (suiteStudent) {
    Object.assign(suiteStudent, { class: studentProfile.className, seat: studentProfile.seat, name: studentProfile.name,
      unit: selectedUnitId, unitTitle: $('unitSelect').selectedOptions[0]?.text || selectedUnitId });
    try { sessionStorage.setItem('bgs_authed_student', JSON.stringify(suiteStudent)); } catch (_) {}
  }
  starting = true;
  clearTimers();
  clearSpawn();
  paused = false;
  document.body.classList.remove('is-paused');
  $('pauseModal').hidden = true;
  $('feedbackModal').hidden = true;
  $('certModal').style.display = 'none';

  const startBtn = $('startBtn');
  startBtn.textContent = '載入題庫中… ⏳';
  startBtn.disabled = true;

  try { rawBank = await fetchQuestionsForUnit(selectedUnitId); }
  finally { starting = false; startBtn.disabled = false; }

  startBtn.textContent = '開始挑戰 🔨';
  startBtn.disabled = false;

  const shuffled = shuffle(rawBank).map(q => ({ ...q, options: [...q.options], shuffled: false }));
  pool = selectedCount === 'all' ? shuffled : shuffled.slice(0, Math.min(selectedCount, shuffled.length));

  idx = 0;
  score = 0;
  combo = 0;
  maxCombo = 0;
  hammerLevel = 1;
  totalAttempts = 0;
  correctFirstTry = 0;
  correctCount = 0;
  startTime = Date.now();

  const unitSelectObj = $('unitSelect');
  const unitTitle = (unitSelectObj && unitSelectObj.selectedIndex >= 0 && unitSelectObj.options[unitSelectObj.selectedIndex])
    ? unitSelectObj.options[unitSelectObj.selectedIndex].text
    : '精選快問快答';
  $('badgeUnit').textContent = unitTitle;
  $('badgeUnit').title = unitTitle;

  $('beanLaunch').hidden = true;
  document.body.classList.add('playing');
  renderQuestion();
}

let currentQuestionSpawns = 0;

// 渲染當前題目
function renderQuestion() {
  clearTimers();
  clearSpawn();
  currentQuestionSpawns = 0;
  targetSpawnedInCurrentQuestion = false;
  questionSettled = false;
  $('feedbackModal').hidden = true;
  $('stunOverlay').hidden = true;
  document.querySelectorAll('.answer-card').forEach(card => card.classList.remove('answer-correct', 'answer-wrong'));
  document.querySelectorAll('.hit-burst').forEach(el => el.remove());

  if (idx >= pool.length) {
    endGame();
    return;
  }

  locked = true;
  stunned = false;
  attempts = 0;

  const q = pool[idx];
  if (!q.shuffled) {
    const origCorrectText = q.options[correctIndex(q)];
    const rawOptions = [...(q.options || [])];
    for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
    }
    q.options = rawOptions;
    q.answer = rawOptions.indexOf(origCorrectText);
    if (q.answer === -1) q.answer = 0;
    q.shuffled = true;
  }

  $('badgeProgress').textContent = `${idx + 1} / ${pool.length}`;
  $('missionFill').style.width = (idx / pool.length * 100) + '%';
  $('badgeScore').textContent = `得分 ${score}`;
  updateCombo();
  $('questionText').textContent = `${idx + 1}. ${q.question}`;

  q.options.slice(0, 4).forEach((x, i) => $('answer-' + i).textContent = x);

  $('timeHint').textContent = '觀察時間 · 先讀題，再出手';
  $('timeSeconds').textContent = '25';
  $('questionCard').classList.remove('time-urgent');
  $('timeFill').style.width = '100%';
  $('statusToast').textContent = '';

  questionStart = performance.now();
  tickTimer = setInterval(tick, 200);

  gameDelay(() => {
    if (idx < pool.length) {
      locked = false;
      $('timeHint').textContent = '開始！看準正確答案出錘';
      scheduleSpawn(100);
    }
  }, cfg.readMs);
}

function tick() {
  if (paused || questionSettled) return;
  const elapsed = performance.now() - questionStart;
  const remain = Math.max(0, 1 - elapsed / cfg.questionMs);
  $('timeFill').style.width = (remain * 100) + '%';
  $('timeSeconds').textContent = Math.ceil(Math.max(0, cfg.questionMs - elapsed) / 1000);
  $('questionCard').classList.toggle('time-urgent', remain < .28);

  if (elapsed > 18000 && elapsed < 22000) $('timeHint').textContent = '⏰ 時間快到了';
  else if (elapsed >= 22000) $('timeHint').textContent = '💡 再看一次關鍵字';

  if (elapsed >= cfg.questionMs) timeoutQuestion();
}

function scheduleSpawn(delay) {
  cancelDelay(spawnTimer);
  if (locked || stunned) return;
  spawnTimer = gameDelay(spawnCharacter, delay ?? (cfg.spawnMin + Math.random() * (cfg.spawnMax - cfg.spawnMin)));
}

let targetSpawnedInCurrentQuestion = false;

// 生產淘氣豆 (修正：全隨機非預測登場，兼顧不卡拖延與樂趣性)
function spawnCharacter() {
  if (locked || stunned) return;
  clearSpawn();

  const q = pool[idx];
  const correct = correctIndex(q);
  currentQuestionSpawns++;

  let type = 'target';
  let hole = Math.floor(Math.random() * 4); // ⭐ 四個洞口絕對公平 25% 機率探頭！

  const r = Math.random();

  // 若經過 3 次探頭仍未出現正解洞口，第 4 次提高正解出現機率，避免學生無聊空等；
  // 但在第 1~3 次，嚴格遵守四個洞口均勻隨機 (正解首次出現率嚴格為 25%，絕非80%！)
  if (!targetSpawnedInCurrentQuestion && currentQuestionSpawns >= 4) {
    hole = correct;
    type = 'target';
    targetSpawnedInCurrentQuestion = true;
  } else {
    if (hole === correct) {
      // 冒在正確洞口
      if (r < 0.12) {
        type = 'gold'; // 稀有金豆
      } else {
        type = 'target'; // 正確答案淘氣豆
        targetSpawnedInCurrentQuestion = true;
      }
    } else {
      // 冒在錯誤洞口 (干擾豆，學生敲到會扣分/連擊中斷)
      if (r < 0.25) {
        type = 'guard'; // 巡邏員 😠
      } else if (r < 0.50) {
        type = 'baby'; // 哭哭奶嘴豆 😭
      } else {
        type = 'distractor'; // 干擾選項淘氣豆
      }
    }
  }

  currentSpawn = { hole, type };
  const slot = $('slot-' + hole);
  if (slot) {
    slot.innerHTML = characterHTML(type);
    slot.classList.add('up');
  }

  hideTimer = gameDelay(() => {
    clearSpawn();
    scheduleSpawn();
  }, cfg.visibleMs);
}

// 產生不同表情與角色的 HTML
function characterHTML(type) {
  if (type === 'guard') {
    // 巡邏員：斜眼生氣表情 + 憤怒標誌
    return `<div class="mascot guard wiggle">
      <span class="tuft"></span>
      <span class="eyebrow-angry e1-brow"></span>
      <span class="eyebrow-angry e2-brow"></span>
      <span class="eye eye-angry e1"></span>
      <span class="eye eye-angry e2"></span>
      <span class="mouth mouth-frown"></span>
      <span class="body"></span>
    </div>`;
  }
  if (type === 'baby') {
    // 奶嘴豆：哭哭眼 + 水滴眼淚 + 奶嘴
    return `<div class="mascot baby wiggle">
      <span class="tuft"></span>
      <span class="eye eye-crying e1"></span>
      <span class="eye eye-crying e2"></span>
      <span class="tear t1">💧</span>
      <span class="tear t2">💧</span>
      <span class="mouth mouth-cry"></span>
      <span class="body"></span>
    </div>`;
  }
  if (type === 'gold') {
    // 金豆：星星眼 + 大笑
    return `<div class="mascot gold wiggle">
      <span class="tuft"></span>
      <span class="eye-star e1">✨</span>
      <span class="eye-star e2">✨</span>
      <span class="mouth mouth-joy"></span>
      <span class="body"></span>
    </div>`;
  }
  if (type === 'distractor') {
    // 干擾淘氣豆：俏皮吐舌眨眼表情 😜 (敲錯會扣分)
    return `<div class="mascot distractor wiggle">
      <span class="tuft"></span>
      <span class="eye eye-wink e1"></span>
      <span class="eye e2"></span>
      <span class="mouth mouth-tongue">👅</span>
      <span class="body"></span>
    </div>`;
  }
  // 正確目標淘氣豆：開心微笑 ☺️
  return `<div class="mascot target wiggle">
    <span class="tuft"></span>
    <span class="eye e1"></span>
    <span class="eye e2"></span>
    <span class="mouth mouth-smile"></span>
    <span class="body"></span>
  </div>`;
}

let instructionsPausedGame = false;
function toggleInstructionsModal(show) {
  if (show) {
    instructionsPausedGame = document.body.classList.contains('playing') && !paused;
    if (instructionsPausedGame) setPaused(true);
    $('pauseModal').hidden = true;
  }
  $('instructionsModal').hidden = !show;
  if (!show && instructionsPausedGame) { instructionsPausedGame = false; setPaused(false); }
  else if (!show && paused) $('pauseModal').hidden = false;
}

function clearSpawn() {
  cancelDelay(hideTimer);
  if (currentSpawn) {
    const s = $('slot-' + currentSpawn.hole);
    if (s) {
      s.classList.remove('up');
      s.innerHTML = '';
    }
  }
  currentSpawn = null;
}

// 敲擊地洞
function hitHole(hole) {
  if (paused || locked || stunned || !currentSpawn || currentSpawn.consumed || currentSpawn.hole !== hole) return;
  safeAudio();
  currentSpawn.consumed = true;

  const type = currentSpawn.type;

  if (type === 'baby') {
    penalty('🍼 奶嘴豆哭哭！ -1', 1);
    speak('嗚哇～', 1.6, 1.2);
    return;
  }
  if (type === 'guard') {
    beep('bad');
    clearSpawn();
    stunned = true;
    $('stunOverlay').hidden = false;
    speak('看清楚再敲！', .9, 1.05);
    gameDelay(() => {
      $('stunOverlay').hidden = true;
      stunned = false;
      scheduleSpawn(150);
    }, cfg.stunMs);
    return;
  }
  if (type === 'gold') {
    score += 3;
    hitBurst(hole, '+3 ✦', 'burst-gold');
    $('badgeScore').textContent = `得分 ${score}`;
    beep('gold');
    toast('✨ 金豆 BONUS +3', 'good');
    animateHit(hole);
    gameDelay(() => {
      clearSpawn();
      scheduleSpawn(250);
    }, 250);
    return;
  }

  const q = pool[idx];
  const correct = correctIndex(q);
  totalAttempts++;
  attempts++;

  if (hole === correct) {
    questionSettled = true;
    clearTimers();
    correctCount++;
    markAnswer(hole, 'answer-correct');
    hitBurst(hole, '+10 ✓', 'burst-good');
    if (attempts === 1) correctFirstTry++;
    score += 10;
    combo++;
    maxCombo = Math.max(maxCombo, combo);

    if (combo % 2 === 0 && hammerLevel < 5) hammerLevel++;

    beep('good', Math.min(5, combo));
    toast(`🎯 命中！ +10　Combo ×${combo}`, 'good');
    updateCombo();
    animateHit(hole);
    locked = true;

    gameDelay(() => {
      idx++;
      renderQuestion();
    }, 650);
  } else {
    wrongAnswer();
  }
}

function wrongAnswer() {
  questionSettled = true;
  clearTimers();
  if (currentSpawn) markAnswer(currentSpawn.hole, 'answer-wrong');
  markAnswer(correctIndex(pool[idx]), 'answer-correct');
  score = Math.max(0, score - 1);
  combo = 0;
  hammerLevel = Math.max(1, hammerLevel - 1);
  $('badgeScore').textContent = `得分 ${score}`;
  updateCombo();
  beep('bad');
  clearSpawn();
  locked = true;

  // 答錯顯示彈窗觀念訂正
  const q = pool[idx];
  const c = correctIndex(q);
  showQuestionFeedback('💥 作答看錯囉！', `正確答案：<strong>(${TAGS[c]}) ${escapeHTML(q.options[c])}</strong><br><br><strong>觀念解析：</strong> ${escapeHTML(q.explanation || '請記住本題觀念，下一題繼續加油！')}`);
}

function penalty(msg, n) {
  score = Math.max(0, score - n);
  $('badgeScore').textContent = `得分 ${score}`;
  beep('bad');
  toast(msg, 'bad');
  clearSpawn();
  gameDelay(() => scheduleSpawn(250), 220);
}

function animateHit(hole) {
  const slot = $('slot-' + hole);
  const m = slot ? slot.querySelector('.mascot') : null;
  if (m) m.classList.add('hit');
  if (hammerLevel >= 3) {
    document.body.classList.add('screen-shake');
    gameDelay(() => document.body.classList.remove('screen-shake'), 190);
  }
}

function toast(msg, cls) {
  const t = $('statusToast');
  t.textContent = msg;
  t.className = 'status-toast ' + cls;
}

function updateCombo() {
  $('badgeCombo').textContent = `Combo ${combo}`;
  const names = ['', '小木槌', '木槌', '大鐵槌', '能量槌', '終極槌'];
  $('hammerLevel').textContent = `🔨 Lv.${hammerLevel} ${names[hammerLevel]}`;
  const h = $('hammerCursor');
  if (h) {
    h.className = `hammer-cursor lv${hammerLevel}`;
    document.documentElement.style.setProperty('--hammer-scale', String(1 + (hammerLevel - 1) * .13));
  }
}

function timeoutQuestion() {
  if (paused || questionSettled) return;
  questionSettled = true;
  markAnswer(correctIndex(pool[idx]), 'answer-correct');
  locked = true;
  clearTimers();
  clearSpawn();
  combo = 0;
  hammerLevel = Math.max(1, hammerLevel - 1);
  updateCombo();

  const q = pool[idx];
  const c = correctIndex(q);
  showQuestionFeedback('⏰ 本題時間到', `正確答案：<strong>(${TAGS[c]}) ${escapeHTML(q.options[c])}</strong><br><br><strong>觀念解析：</strong> ${escapeHTML(q.explanation || '請記住關鍵字，繼續加油！')}`);
}

function showQuestionFeedback(title, body) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = body;
  $('modalBtn').textContent = '我看懂了 ➜';
  $('modalBtn').onclick = continueQuestion;
  $('feedbackModal').hidden = false;
  $('modalBtn').focus();
}

// 隨機防偽碼
function generateCertCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BEAN-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 結算畫面
function endGame() {
  clearTimers();
  clearSpawn();
  locked = true;
  document.body.classList.remove('playing');

  questionSettled = true;
  $('missionFill').style.width = '100%';
  $('certAccuracy').textContent = correctCount + ' / ' + pool.length;
  totalTimeSec = Math.round((Date.now() - startTime) / 1000);
  currentCertCode = generateCertCode();

  beep('win');

  const unitSelectObj = $('unitSelect');
  const unitTitle = unitSelectObj.options[unitSelectObj.selectedIndex].text;
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  $('certIdDisplay').textContent = `驗證碼：${currentCertCode}`;
  $('certStudentInfo').textContent = `${studentProfile.className} 班 ${studentProfile.seat} 號 ${studentProfile.name}`;
  $('certUnitInfo').textContent = unitTitle;
  $('certScoreDisplay').textContent = `${score} 分`;
  $('certComboDisplay').textContent = `Combo ×${maxCombo}`;
  $('certHammerDisplay').textContent = `Lv.${hammerLevel}`;
  $('certTimeDisplay').textContent = `${totalTimeSec} 秒`;
  $('certTimestampDisplay').textContent = dateStr;

  const urlParams = new URLSearchParams(window.location.search);
  const isDispatchMode = urlParams.has("unit") || urlParams.has("mode") || urlParams.has("qcount") || urlParams.has("dispatch");

  if (isDispatchMode && typeof showScoreSubmitModal === 'function') {
    showScoreSubmitModal({
      gameTitle: '淘氣豆：生物敲敲研究所',
      score: score,
      scoreDisplay: `${score} 分 (答對 ${correctCount} / ${pool.length} 題)`,
      accuracy: Math.round(correctCount / pool.length * 100) + '%',
      errorCount: pool.length - correctCount,
      keywords: correctCount === pool.length ? '全對無錯題' : '請參考作答訂正',
      duration: `${totalTimeSec} 秒`,
      initialClass: studentProfile.className || '701',
      initialSeat: studentProfile.seat || '01',
      initialName: studentProfile.name || '',
      onBonusChallenge: () => {
        // 🔥 挑戰加碼 10 題：再重新抓 10 題繼續挑戰！
        $('certModal').style.display = 'none';
        startGame();
      },
      onSuccess: () => {
        $('certModal').style.display = 'flex';
      },
      onClose: () => {
        $('certModal').style.display = 'flex';
      }
    });
  } else {
    $('certModal').style.display = 'flex';
  }
}

function copyCertToClipboard() {
  const unitSelectObj = $('unitSelect');
  const unitTitle = unitSelectObj.options[unitSelectObj.selectedIndex].text;
  const copyText = `【淘氣豆敲敲研究所】成績單驗證碼：${currentCertCode} | 班級座號：${studentProfile.className}班${studentProfile.seat}號 | 姓名：${studentProfile.name} | 挑戰單元：${unitTitle} | 最終得分：${score}分 | 最高Combo：${maxCombo} | 費時：${totalTimeSec}秒`;

  Promise.resolve().then(() => {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    return navigator.clipboard.writeText(copyText);
  }).then(() => {
    const btn = $('btnCopyCert');
    const originalText = btn.textContent;
    btn.textContent = '✅ 已成功複製成績單文字！';
    btn.style.background = '#16A34A';
    gameDelay(() => {
      btn.textContent = originalText;
      btn.style.background = '#0284C7';
    }, 2500);
  }).catch(err => {
    alert(`驗證碼：${currentCertCode}\n\n請手動複製成績單文字：\n${copyText}`);
  });
}

function resetToStart() {
  $('certModal').style.display = 'none';
  clearTimers();
  clearSpawn();
  $('feedbackModal').hidden = true;
  presentLaunch();
}

function clearTimers() {
  cancelDelay(spawnTimer);
  cancelDelay(hideTimer);
  clearInterval(tickTimer);
  pendingDelays.forEach(cancelDelay);
}

function escapeHTML(v) {
  return String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
window.addEventListener('pageshow', e => { if (e.persisted) setPaused(true); });
window.addEventListener('pagehide', () => {
  setPaused(true);
  try { speechSynthesis.cancel(); } catch (e) {}
});

function triggerBeanGasSubmit() {
  if (typeof showScoreSubmitModal === "function") {
    showScoreSubmitModal({
      gameTitle: "淘氣豆：生物敲敲研究所",
      score: score,
      scoreDisplay: score + " 分",
      duration: totalTimeSec + " 秒"
    });
  }
}

window.startGame = startGame;
