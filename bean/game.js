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

// --- 備用題庫 ---
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

  if (unitId === 'all') {
    if (manifestUnits.length > 0) {
      for (const unit of manifestUnits) {
        for (const basePath of basePathCandidates) {
          try {
            const res = await fetch(basePath + unit.file);
            if (res.ok) {
              const data = await res.json();
              loaded.push(...data);
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
          loaded = await res.json();
          break;
        }
      } catch (e) {}
    }
  }

  return loaded.length > 0 ? loaded.filter(validQuestion) : fallbackBank;
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
