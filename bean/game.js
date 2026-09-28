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
  select.innerHTML = '<option value="all">🌐 ALL (1~10單元 綜合隨機出題)</option>';

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
      opt.value = u.id;
      opt.textContent = u.title;
      select.appendChild(opt);
    });
  }
}

// 檢查 URL 參數
function checkUrlParams() {
  const p = new URLSearchParams(location.search);
  const paramUnit = p.get('unit');
  const paramCount = p.get('count');
  const paramClass = p.get('class');
  const paramSeat = p.get('seat');
  const paramName = p.get('name');

  if (paramClass) $('inputClass').value = paramClass;
  if (paramSeat) $('inputSeat').value = paramSeat;
  if (paramName) $('inputName').value = paramName;

  if (paramUnit) {
    $('unitSelect').value = paramUnit;
    selectedUnitId = paramUnit;
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
    const a = document.createElement('div');
    a.className = 'answer-card';
    a.innerHTML = `<span class="answer-tag">${tag}</span><span id="answer-${i}">—</span>`;
    answers.appendChild(a);

    // 地洞
    const col = document.createElement('div');
    col.className = 'hole-column';
    col.innerHTML = `
      <div class="hole-label">${tag}</div>
      <div class="hole" data-hole="${i}" role="button" aria-label="${tag} 洞">
        <div class="character-slot" id="slot-${i}"></div>
      </div>
    `;
    col.querySelector('.hole').addEventListener('pointerdown', e => {
      e.preventDefault();
      hitHole(i);
    });
    arena.appendChild(col);
  });
}

// 鍵盤快捷鍵監聽
function setupKeyboardHotkeys() {
  window.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const key = e.key.toUpperCase();
    if (key === 'A' || key === '1') hitHole(0);
    else if (key === 'B' || key === '2') hitHole(1);
    else if (key === 'C' || key === '3') hitHole(2);
    else if (key === 'D' || key === '4') hitHole(3);
    else if (key === 'ENTER' || key === ' ') {
      const modal = $('feedbackModal');
      if (modal && !modal.hidden) {
        modal.hidden = true;
        idx++;
        renderQuestion();
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
  document.addEventListener('pointerup', () => setTimeout(() => $('hammerCursor')?.classList.remove('swing'), 90));
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

  if (unitId === 'all') {
    if (manifestUnits.length > 0) {
      for (const unit of manifestUnits) {
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
  } else {
    const target = manifestUnits.find(u => u.id === unitId);
    const fileName = target ? target.file : `unit_${unitId}.json`;
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
  if (Number.isInteger(q.answer)) return Math.max(0, Math.min(3, q.answer));
  if (typeof q.answer === 'string') {
    const s = q.answer.trim().toUpperCase();
    if (TAGS.includes(s)) return TAGS.indexOf(s);
    const n = Number(s);
    if (Number.isInteger(n) && n >= 0 && n <= 3) return n;
  }
  return -1;
}

function validQuestion(q) {
  return q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 4 && correctIndex(q) >= 0;
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
  safeAudio();
  const profile = validateStudentProfile();
  if (!profile) return;

  selectedUnitId = $('unitSelect').value;

  const startBtn = $('startBtn');
  startBtn.textContent = '載入題庫中… ⏳';
  startBtn.disabled = true;

  rawBank = await fetchQuestionsForUnit(selectedUnitId);

  startBtn.textContent = '開始挑戰 🔨';
  startBtn.disabled = false;

  const shuffled = shuffle(rawBank);
  pool = selectedCount === 'all' ? shuffled : shuffled.slice(0, Math.min(selectedCount, shuffled.length));

  idx = 0;
  score = 0;
  combo = 0;
  maxCombo = 0;
  hammerLevel = 1;
  totalAttempts = 0;
  correctFirstTry = 0;
  startTime = Date.now();

  const unitSelectObj = $('unitSelect');
  const unitTitle = unitSelectObj.options[unitSelectObj.selectedIndex].text;
  $('badgeUnit').textContent = `單元：${unitTitle.split('：')[1] || unitTitle.split(' ')[0]}`;

  $('startScreen').hidden = true;
  document.body.classList.add('playing');
  renderQuestion();
}

// 渲染當前題目
function renderQuestion() {
  clearTimers();
  clearSpawn();

  if (idx >= pool.length) {
    endGame();
    return;
  }

  locked = true;
  stunned = false;
  attempts = 0;

  const q = pool[idx];
  $('badgeProgress').textContent = `題號 ${idx + 1} / ${pool.length}`;
  $('badgeScore').textContent = `得分 ${score}`;
  updateCombo();
  $('questionText').textContent = `${idx + 1}. ${q.question}`;

  q.options.slice(0, 4).forEach((x, i) => $('answer-' + i).textContent = x);

  $('timeHint').textContent = '先看懂題目再出手';
  $('timeFill').style.width = '100%';
  $('statusToast').textContent = '';

  questionStart = performance.now();
  tickTimer = setInterval(tick, 200);

  setTimeout(() => {
    if (idx < pool.length) {
      locked = false;
      $('timeHint').textContent = '開始！看準正確答案出錘';
      scheduleSpawn(100);
    }
  }, cfg.readMs);
}

function tick() {
  const elapsed = performance.now() - questionStart;
  const remain = Math.max(0, 1 - elapsed / cfg.questionMs);
  $('timeFill').style.width = (remain * 100) + '%';

  if (elapsed > 18000 && elapsed < 22000) $('timeHint').textContent = '⏰ 時間快到了';
  else if (elapsed >= 22000) $('timeHint').textContent = '💡 再看一次關鍵字';

  if (elapsed >= cfg.questionMs) timeoutQuestion();
}

function scheduleSpawn(delay) {
  clearTimeout(spawnTimer);
  if (locked || stunned) return;
  spawnTimer = setTimeout(spawnCharacter, delay ?? (cfg.spawnMin + Math.random() * (cfg.spawnMax - cfg.spawnMin)));
}

function spawnCharacter() {
  if (locked || stunned) return;
  clearSpawn();

  const q = pool[idx];
  const correct = correctIndex(q);
  let type = 'target';
  let hole = Math.floor(Math.random() * 4);
  const r = Math.random();

  if (r < cfg.goldChance) {
    type = 'gold';
  } else if (r < cfg.goldChance + cfg.obstacleChance) {
    type = Math.random() < .5 ? 'baby' : 'guard';
  } else if (Math.random() < .55) {
    hole = correct; // 提高正確洞出現機率
  }

  currentSpawn = { hole, type };
  const slot = $('slot-' + hole);
  slot.innerHTML = characterHTML(type);
  slot.classList.add('up');

  hideTimer = setTimeout(() => {
    clearSpawn();
    scheduleSpawn();
  }, cfg.visibleMs);
}

function characterHTML(type) {
  const cls = type === 'baby' ? 'baby' : type === 'guard' ? 'guard' : type === 'gold' ? 'gold' : 'mischief';
  return `<div class="mascot ${cls} ${type === 'target' ? 'wiggle' : ''}"><span class="tuft"></span><span class="eye e1"></span><span class="eye e2"></span><span class="mouth"></span><span class="body"></span></div>`;
}

function clearSpawn() {
  clearTimeout(hideTimer);
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
  if (locked || stunned || !currentSpawn || currentSpawn.hole !== hole) return;

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
    setTimeout(() => {
      $('stunOverlay').hidden = true;
      stunned = false;
      scheduleSpawn(150);
    }, cfg.stunMs);
    return;
  }
  if (type === 'gold') {
    score += 3;
    $('badgeScore').textContent = `得分 ${score}`;
    beep('gold');
    toast('✨ 金豆 BONUS +3', 'good');
    animateHit(hole);
    setTimeout(() => {
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

    setTimeout(() => {
      idx++;
      renderQuestion();
    }, 650);
  } else {
    wrongAnswer();
  }
}

function wrongAnswer() {
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
  setTimeout(() => scheduleSpawn(250), 220);
}

function animateHit(hole) {
  const slot = $('slot-' + hole);
  const m = slot ? slot.querySelector('.mascot') : null;
  if (m) m.classList.add('hit');
  if (hammerLevel >= 3) {
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 190);
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
  if (locked && performance.now() - questionStart < cfg.questionMs) return;
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
  $('modalBtn').onclick = () => {
    $('feedbackModal').hidden = true;
    idx++;
    renderQuestion();
  };
  $('feedbackModal').hidden = false;
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

  $('certModal').style.display = 'flex';
}

function copyCertToClipboard() {
  const unitSelectObj = $('unitSelect');
  const unitTitle = unitSelectObj.options[unitSelectObj.selectedIndex].text;
  const copyText = `【淘氣豆敲敲研究所】成績單驗證碼：${currentCertCode} | 班級座號：${studentProfile.className}班${studentProfile.seat}號 | 姓名：${studentProfile.name} | 挑戰單元：${unitTitle} | 最終得分：${score}分 | 最高Combo：${maxCombo} | 費時：${totalTimeSec}秒`;

  navigator.clipboard.writeText(copyText).then(() => {
    const btn = $('btnCopyCert');
    const originalText = btn.textContent;
    btn.textContent = '✅ 已成功複製成績單文字！';
    btn.style.background = '#16A34A';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '#0284C7';
    }, 2500);
  }).catch(err => {
    alert(`驗證碼：${currentCertCode}\n\n請手動複製成績單文字：\n${copyText}`);
  });
}

function resetToStart() {
  $('certModal').style.display = 'none';
  $('startScreen').hidden = false;
}

function clearTimers() {
  clearTimeout(spawnTimer);
  clearTimeout(hideTimer);
  clearInterval(tickTimer);
}

function escapeHTML(v) {
  return String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

window.addEventListener('pagehide', () => {
  clearTimers();
  try { speechSynthesis.cancel(); } catch (e) {}
});
