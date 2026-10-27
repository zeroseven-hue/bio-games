/**
 * 🧬 《生物星際大逃亡：逃離黑洞》核心控制器 V5.1 (三明治終極標準模組版)
 * 1. 課堂派卷守門員 + 純數字 701~710 / 01~35 + 誠信公約開局
 * 2. 街機高速流暢手感：答錯秒記黑盒子觀念日誌，不中斷航行節奏
 * 3. 緊急防護罩保底：100% 保證全員完成 12 題，弱勢生絕不半途出局
 * 4. 三階段自動結算：完賽瞬間背景自動 POST 至 GAS，杜絕漏交成績
 * 5. 離線無延遲保底題庫：學校 Wi-Fi 抖動時 3.5 秒自動無縫切換
 */

// 📚 離線保底精選題庫（涵蓋國中七年級生物核心常考觀念）
const FALLBACK_QUESTION_BANK = [
  { id: 1, question: "關於酵素（催化劑）特性的敘述，下列何者正確？", options: ["酵素主要成分是蛋白質，具有專一性", "酵素高溫煮沸後冷卻，活性即可恢復", "酵素在反應過程中會被大量消耗", "強酸強鹼環境下所有酵素活性最高"], answer: 0, explanation: "💡 觀念解析：酵素的主成分是蛋白質，專一性高。高溫或強酸強鹼會使蛋白質變性破壞活性，冷卻後無法恢復！" },
  { id: 2, question: "將新鮮豬肝切片放入雙氧水中會產生大量氣泡，氣泡成分為何？", options: ["二氧化碳", "氧氣", "氮氣", "氫氣"], answer: 1, explanation: "💡 觀念解析：豬肝含有過氧化氫酵素，能催化雙氧水分解產生「氧氣」與水！" },
  { id: 3, question: "植物進行光合作用時，水分子被光能分解會釋放何種物質？", options: ["二氧化碳", "葡萄糖", "氧氣", "澱粉"], answer: 2, explanation: "💡 觀念解析：光合作用第一階段（光反應），葉綠素吸收光能將水分解，釋放出「氧氣」。" },
  { id: 4, question: "探究植物葉片光合作用實驗中，用酒精加熱處理葉片的目的為何？", options: ["軟化葉片細胞壁", "溶解葉綠素以便觀察顏色變化", "測試葉片是否含有葡萄糖", "增加葉片吸收碘液的能力"], answer: 1, explanation: "💡 觀念解析：葉綠素溶於酒精，隔水加熱可去除葉綠素，避免影響後續碘液顯色觀察。" },
  { id: 5, question: "人體唾液澱粉酵素在下列哪一種溫度環境下，催化活性最高？", options: ["0°C (冰塊中)", "37°C (體溫環境)", "70°C (溫水中)", "100°C (沸水中)"], answer: 1, explanation: "💡 觀念解析：人體內酵素最適溫度約在體溫 37°C 左右。0°C 活性暫時抑制，100°C 永久變性失效。" },
  { id: 6, question: "有關細胞膜性質與功能的敘述，下列何者正確？", options: ["可控制物質進出細胞，具有選擇透性", "主要成分為纖維素，能支撐細胞形狀", "所有物質皆可自由通過細胞膜", "植物細胞只有細胞壁而沒有細胞膜"], answer: 0, explanation: "💡 觀念解析：細胞膜主要由脂質與蛋白質組成具選擇透性；細胞壁成分為纖維素。" },
  { id: 7, question: "擴散作用是指物質分子如何運動的現象？", options: ["由高濃度區域往低濃度區域運動", "由低濃度區域往高濃度區域運動", "必須消耗細胞 ATP 能量才能運動", "只有水分子才能進行的運動"], answer: 0, explanation: "💡 觀念解析：擴散作用是物質由高濃度往低濃度自然分布的物理現象，不需消耗能量。" },
  { id: 8, question: "將紅血球放入純水中，會發生何種現象？", options: ["細胞萎縮變小", "水份大量滲入導致細胞膨脹破裂", "細胞大小形狀保持不變", "細胞壁破裂水份流出"], answer: 1, explanation: "💡 觀念解析：純水為低滲透壓環境，水大量經滲透作用進入細胞，紅血球缺乏細胞壁保護而破裂。" },
  { id: 9, question: "植物葉片氣孔主要分佈與開閉控制，是由何種細胞負責？", options: ["表皮細胞", "葉肉細胞", "保衛細胞", "導管細胞"], answer: 2, explanation: "💡 觀念解析：保衛細胞成對存在含有葉綠體，能控制氣孔開閉與蒸散作用。" },
  { id: 10, question: "下列哪一種器官或構造，是植物進行光合作用的主要場所？", options: ["根部細胞", "莖部維管束", "葉片的葉綠體", "花瓣細胞"], answer: 2, explanation: "💡 觀念解析：葉綠體含有葉綠素，是植物吸收光能進行光合作用的主要胞器。" },
  { id: 11, question: "胃液中的胃蛋白酵素，在下列哪種 pH 值環境中活性最佳？", options: ["pH = 2 (強酸性)", "pH = 7 (中性)", "pH = 9 (弱鹼性)", "pH = 14 (強鹼性)"], answer: 0, explanation: "💡 觀念解析：胃液含有鹽酸，胃蛋白酵素適應強酸環境（pH 1.5~2.0）。" },
  { id: 12, question: "植物進行光合作用產生的葡萄糖，常轉化為何種形式儲藏？", options: ["纖維素", "蛋白質", "澱粉", "脂肪"], answer: 2, explanation: "💡 觀念解析：植物將光合作用製造的葡萄糖轉化為難溶於水的「澱粉」形式儲藏於根、莖、種子中。" }
];

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

// 狀態與計時變數
const TOTAL_QUESTIONS_PER_ROUND = 12;
let allManifestUnits = [];
let rawQuestionsByUnit = {};
let roundQuestions = [];
let currentIndex = 0;
let wrongLogs = [];
let answeredWrong = new Set();
let firstCorrect = 0;
let attempts = 0;
let streak = 0;
let shields = 0;
let oxygen = 100;
let emergencyTriggered = false;

// 動態航行與黑洞變數
let shipProgress = 15;      // 15% ~ 100%
let blackholeProgress = 0;  // 0% ~ 100%
let blackholeTimer = null;
let activeSeconds = 0;
let phase = 'ready'; // ready | playing | ended
let paused = false;
let isLocked = false;
let lastAnswerTime = -Infinity;
let finalScore = 0;
let submitted = false;

// 音效控制 (適配教室輕柔音量)
let soundEnabled = true;
let musicEnabled = true;
let heartbeatLoopTimer = null;
let bgmTimer = null;
let audioCtx = null;

// Canvas 星空與黑洞視效
let canvas = null;
let ctx = null;
let stars = [];
let blackholeParticles = [];
let animFrameId = null;
let lastVisualTime = 0;

const $ = id => document.getElementById(id);
const urlParams = new URLSearchParams(window.location.search);
const dispatchedUnit = urlParams.get('unit') || urlParams.get('file');

function unlockAudioContext() {
  if (paused) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => unlockAudioContext(), { passive: true });
});

// 教室輕柔音量振盪器 (vol 降至 0.08~0.12，避免 35 台平板刺耳噪音)
function playTone(freq, type, duration, delay = 0, vol = 0.08) {
  if (!soundEnabled || paused) return;
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
  } catch (_) {}
}

function playBoostSound() {
  playTone(440, 'triangle', 0.06, 0, 0.09);
  playTone(660, 'sine', 0.08, 0.05, 0.1);
  playTone(880, 'sine', 0.12, 0.1, 0.12);
}

function playAlarmSound() {
  playTone(220, 'sawtooth', 0.15, 0, 0.08);
  playTone(180, 'sine', 0.18, 0.1, 0.08);
}

function playShieldSound() {
  playTone(330, 'sine', 0.1, 0, 0.08);
  playTone(550, 'triangle', 0.15, 0.08, 0.1);
}

function playVictorySound() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, idx) => {
    playTone(f, 'sine', 0.18, idx * 0.1, 0.12);
  });
}

// 動態黑洞心跳加速度 (平穩 60 BPM -> 接近 115 BPM -> 臨界 200 BPM)
function updateDynamicHeartbeatSound() {
  if (heartbeatLoopTimer) clearTimeout(heartbeatLoopTimer);
  if (!soundEnabled || phase !== 'playing' || paused) return;

  const gap = shipProgress - blackholeProgress;
  let intervalMs = 1000;
  let basePitch = 120;

  if (gap <= 15 || oxygen <= 30) {
    intervalMs = 300; // 200 BPM
    basePitch = 180;
  } else if (gap <= 30 || oxygen <= 60) {
    intervalMs = 520; // 115 BPM
    basePitch = 150;
  } else {
    intervalMs = 1000; // 60 BPM
    basePitch = 120;
  }

  playTone(basePitch, 'sine', 0.08, 0, 0.06);
  playTone(basePitch * 0.8, 'sine', 0.1, 0.08, 0.05);

  heartbeatLoopTimer = setTimeout(updateDynamicHeartbeatSound, intervalMs);
}

// 悠緩星際 Synthwave 背景步進音
function playBGMStep() {
  if (bgmTimer) clearTimeout(bgmTimer);
  if (!musicEnabled || phase !== 'playing' || paused) return;
  const notes = [130.81, 164.81, 196.00, 220.00];
  const step = Math.floor(Date.now() / 800) % notes.length;
  playTone(notes[step], 'sine', 0.25, 0, 0.03);
  bgmTimer = setTimeout(playBGMStep, 800);
}

function toggleSound() {
  unlockAudioContext();
  soundEnabled = !soundEnabled;
  $('btnSound').textContent = soundEnabled ? '🔊 音效' : '🔇 靜音';
  if (soundEnabled) updateDynamicHeartbeatSound();
  else if (heartbeatLoopTimer) clearTimeout(heartbeatLoopTimer);
}

function toggleMusic() {
  unlockAudioContext();
  musicEnabled = !musicEnabled;
  $('btnMusic').textContent = musicEnabled ? '🎵 音樂' : '🔇 無聲';
  if (musicEnabled) playBGMStep();
  else if (bgmTimer) clearTimeout(bgmTimer);
}

function triggerScreenShake() {
  const body = document.getElementById('gameBody');
  if (body) {
    body.classList.remove('shake');
    void body.offsetWidth;
    body.classList.add('shake');
    setTimeout(() => body.classList.remove('shake'), 400);
  }
}

function shuffleArray(arr) {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// 🌌 動態太空 Canvas 背景 (星空速流與黑洞吸積盤)
function initSpaceCanvas() {
  canvas = $('spaceCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 1.8 + 0.4
    });
  }

  blackholeParticles = [];
  for (let i = 0; i < 35; i++) {
    blackholeParticles.push({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 110 + 20,
      speed: Math.random() * 0.03 + 0.01,
      size: Math.random() * 2.5 + 1
    });
  }

  function loop(timestamp = 0) {
    if (timestamp - lastVisualTime < 33) {
      animFrameId = requestAnimationFrame(loop);
      return;
    }
    lastVisualTime = timestamp;

    if (paused || document.hidden || phase === 'ended') {
      animFrameId = requestAnimationFrame(loop);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繁星速流
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    stars.forEach(s => {
      s.x -= s.speed * (phase === 'playing' ? 2 : 0.8);
      if (s.x < 0) s.x = canvas.width;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 黑洞吸積盤核心
    const bhX = 60 + (blackholeProgress / 100) * (canvas.width * 0.25);
    const bhY = canvas.height / 2;

    const grad = ctx.createRadialGradient(bhX, bhY, 8, bhX, bhY, 130);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.98)');
    grad.addColorStop(0.45, 'rgba(249, 115, 22, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bhX, bhY, 130, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(bhX, bhY);
    ctx.rotate(-0.35);
    for (let ring = 0; ring < 4; ring++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 85 + ring * 12, 20 + ring * 5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, ${120 + ring * 25}, 60, ${0.4 - ring * 0.08})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(bhX, bhY, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#02030a';
    ctx.fill();

    // 吸積盤旋轉粒子
    ctx.fillStyle = '#ffedd5';
    blackholeParticles.forEach(p => {
      p.angle += p.speed;
      const px = bhX + Math.cos(p.angle) * p.radius;
      const py = bhY + Math.sin(p.angle) * (p.radius * 0.4);
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    animFrameId = requestAnimationFrame(loop);
  }

  loop();
}

// 帶超時保護的 fetch (3.5 秒超時立即回退，杜絕 35 台 iPad 網路卡死)
async function fetchWithTimeout(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// 題庫載入 (支援派卷鎖定與秒開保底)
async function loadManifestAndUnits() {
  phase = 'loading';
  setAnswers(false);

  try {
    const manifest = await fetchWithTimeout('../questions/manifest.json', 3500);
    allManifestUnits = manifest.units || (manifest.publishers || []).flatMap(p => (p.semesters || []).flatMap(s => s.units || []));
  } catch (err) {
    console.warn('遠端題庫清單讀取超時或失敗，啟用內建精選題庫保底:', err);
    allManifestUnits = [{ id: 'unit_core', title: '7上 生物核心觀念精選', file: 'fallback' }];
  }

  let targetUnit = dispatchedUnit || 'ALL';
  if (dispatchedUnit) {
    const match = allManifestUnits.find(u => u.file === dispatchedUnit || u.id === dispatchedUnit || u.file === dispatchedUnit + '.json');
    if (match) targetUnit = match.file;
  }

  const unitDisplayName = targetUnit === 'ALL' ? '全單元探索' : cleanUnitTitle(targetUnit);
  $('lblUnit').textContent = dispatchedUnit ? `🎯 ${unitDisplayName} (派卷)` : '生物星際大逃亡';
  $('unitInfoText').textContent = `🌱 任務單元：${unitDisplayName}`;

  phase = 'ready';
}

async function loadUnitQuestions(unitFile) {
  if (unitFile === 'fallback' || !unitFile) {
    return FALLBACK_QUESTION_BANK;
  }
  if (rawQuestionsByUnit[unitFile]) {
    return rawQuestionsByUnit[unitFile];
  }

  try {
    const data = await fetchWithTimeout(`../questions/${unitFile}`, 3500);
    const list = Array.isArray(data) ? data : data.questions;
    if (Array.isArray(list) && list.length) {
      rawQuestionsByUnit[unitFile] = list;
      return list;
    }
    throw new Error('題庫格式不完整');
  } catch (err) {
    console.warn(`單元 ${unitFile} 載入失敗，無縫回退至精選題庫:`, err);
    return FALLBACK_QUESTION_BANK;
  }
}

function setAnswers(enabled) {
  for (let i = 0; i < 4; i++) {
    const btn = $('btn' + i);
    if (btn) btn.disabled = !enabled;
  }
}

function effect(kind) {
  const fx = $('flightEffects');
  if (!fx) return;
  fx.className = 'flight-effects ' + kind;
  fx.textContent = kind === 'boost' ? '✦　曲速推進　🚀　✦' :
                   kind === 'shield' ? '🛡️ 護盾吸收衝擊' :
                   kind === 'emergency' ? '⚠️ 應急超空間防護罩啟動！' :
                   kind === 'victory' ? '✦　躍遷成功　✦' : '⚡ 推進器受損';
  fx.getAnimations().forEach(a => a.cancel());
  fx.animate([
    { opacity: 0, transform: 'scale(0.85)' },
    { opacity: 1, offset: 0.25 },
    { opacity: 0, transform: 'scale(1.15)' }
  ], { duration: 800 });
}

// 🚀 開局核心：由身分驗證公約一鍵啟動
async function initGame(isBonus = false) {
  stopLoops();
  unlockAudioContext();

  phase = 'playing';
  paused = false;
  $('pauseOverlay').hidden = true;
  document.body.classList.remove('mission-paused');
  $('endScreen').style.display = 'none';
  $('gameHeader').style.display = 'flex';
  $('gameMain').style.display = 'flex';

  currentIndex = 0;
  wrongLogs = [];
  answeredWrong.clear();
  firstCorrect = 0;
  attempts = 0;
  streak = 0;
  shields = 0;
  oxygen = 100;
  emergencyTriggered = false;
  shipProgress = 15;
  blackholeProgress = 0;
  activeSeconds = 0;
  submitted = false;
  finalScore = 0;

  // 決定題庫清單
  let pool = [];
  const student = window.BioGameSuite?.getStudent() || {};
  let target = dispatchedUnit || student.unit || 'ALL';

  if (target === 'ALL' || target === 'FAST_DEFAULT') {
    if (allManifestUnits.length && allManifestUnits[0].file !== 'fallback') {
      const sample = shuffleArray(allManifestUnits).slice(0, 3);
      const loaded = await Promise.all(sample.map(u => loadUnitQuestions(u.file)));
      pool = loaded.flat();
    } else {
      pool = [...FALLBACK_QUESTION_BANK];
    }
  } else {
    pool = await loadUnitQuestions(target);
  }

  if (!pool.length) pool = [...FALLBACK_QUESTION_BANK];

  if (isBonus) {
    const harder = pool.filter(q => q.difficulty === '中' || q.difficulty === '難');
    pool = harder.length >= 10 ? harder : pool;
  }

  const roundCount = isBonus ? 10 : TOTAL_QUESTIONS_PER_ROUND;
  roundQuestions = shuffleArray(pool).slice(0, roundCount).map(q => {
    // 選項隨機洗牌，防止並排同學抄襲 ABCD
    const opts = shuffleArray(q.options.map((text, idx) => ({ text, isCorrect: idx === q.answer })));
    return {
      ...q,
      options: opts.map(o => o.text),
      answer: opts.findIndex(o => o.isCorrect)
    };
  });

  const displayUnitName = target === 'ALL' ? '全單元綜合探索' : cleanUnitTitle(student.unitTitle || target);
  $('unitInfoText').textContent = isBonus ? `🔥 菁英加碼挑戰 10 題：${displayUnitName}` : `🌱 當前任務：${displayUnitName}`;

  renderQuestion();
  updateUI();
  startLoops();
  effect('boost');
}

// 暴露標準開局進入點，供 ScoreSubmitModal 在公約確認後直接喚起
window.startGame = function () {
  initGame(false);
};

function stopLoops() {
  if (blackholeTimer) clearInterval(blackholeTimer);
  if (heartbeatLoopTimer) clearTimeout(heartbeatLoopTimer);
  if (bgmTimer) clearTimeout(bgmTimer);
}

function startLoops() {
  stopLoops();

  // 每秒推進黑洞威脅進度（保證充裕時間，不刻意刁難緩讀學生）
  blackholeTimer = setInterval(() => {
    if (paused || phase !== 'playing') return;
    activeSeconds++;

    // 黑洞平緩逼近 (每秒約 0.22%，全員完賽約需 6~8 分鐘)
    blackholeProgress = Math.min(100, blackholeProgress + 0.22);

    // 🛡️ 緊急防護罩保底機制：黑洞逼近到飛船前，啟動超空間緩衝，保證學生完整做完 12 題
    if (blackholeProgress >= shipProgress - 3) {
      if (!emergencyTriggered) {
        emergencyTriggered = true;
        effect('emergency');
        playAlarmSound();
      }
      // 保持 4% 安全臨界緩衝，絕不強制中斷出局
      blackholeProgress = Math.max(0, shipProgress - 4);
    }

    updateUI();
  }, 1000);

  updateDynamicHeartbeatSound();
  if (musicEnabled) playBGMStep();
}

function renderQuestion() {
  if (currentIndex >= roundQuestions.length) {
    return finishGame(true);
  }

  const q = roundQuestions[currentIndex];
  $('qText').textContent = `${currentIndex + 1} / ${roundQuestions.length}　${q.question}`;

  for (let i = 0; i < 4; i++) {
    const btn = $('btn' + i);
    if (i < q.options.length) {
      btn.hidden = false;
      btn.querySelector('.opt-text').textContent = q.options[i];
    } else {
      btn.hidden = true;
    }
  }

  isLocked = false;
  setAnswers(!paused);
}

function handleSelect(choiceIdx) {
  if (phase !== 'playing' || paused || isLocked || Date.now() - lastAnswerTime < 350) return;
  lastAnswerTime = Date.now();

  unlockAudioContext();
  isLocked = true;
  setAnswers(false);
  attempts++;

  const q = roundQuestions[currentIndex];
  const qKey = q.question;

  if (choiceIdx === q.answer) {
    // 答對處理
    if (!answeredWrong.has(qKey)) {
      firstCorrect++;
    }
    streak++;
    if (streak % 3 === 0) {
      shields = Math.min(2, shields + 1);
      effect('shield');
      playShieldSound();
    } else {
      effect('boost');
      playBoostSound();
    }

    // 推進飛船
    currentIndex++;
    shipProgress = 15 + Math.round((85 * currentIndex) / roundQuestions.length);
    updateUI();

    setTimeout(() => {
      renderQuestion();
    }, 450);

  } else {
    // 答錯處理：街機流暢連貫手感，秒記黑盒子觀念日誌，不以長彈窗中斷航行！
    streak = 0;
    answeredWrong.add(qKey);

    let log = wrongLogs.find(x => x.question === q.question);
    if (log) {
      log.count++;
      log.userAnswer = q.options[choiceIdx];
    } else {
      wrongLogs.push({
        question: q.question,
        userAnswer: q.options[choiceIdx],
        correctAnswer: q.options[q.answer],
        explanation: q.explanation || '請複習本科目關鍵定義與反應條件。',
        count: 1
      });
    }

    triggerScreenShake();

    if (shields > 0) {
      shields--;
      effect('shield');
      playShieldSound();
    } else {
      oxygen = Math.max(15, oxygen - 10);
      effect('damage');
      playAlarmSound();
    }

    // 自動前往下一題，保持作答爽快感
    currentIndex++;
    shipProgress = 15 + Math.round((85 * currentIndex) / roundQuestions.length);
    updateUI();

    setTimeout(() => {
      renderQuestion();
    }, 600);
  }
}

function updateUI() {
  $('progressBar').style.width = shipProgress + '%';
  $('shipIcon').style.left = Math.min(96, Math.max(2, shipProgress)) + '%';

  $('blackholeBar').style.width = blackholeProgress + '%';
  $('blackholeIcon').style.left = Math.min(94, Math.max(2, blackholeProgress)) + '%';

  $('shipIcon').classList.toggle('has-shield', shields > 0);
  $('lblShields').textContent = `🛡️ 能量護盾：${shields}`;
  $('lblOxygen').textContent = `維生氧氣：${oxygen}%`;

  const safeDist = Math.max(0, Math.round(shipProgress - blackholeProgress));
  $('lblDistance').textContent = `🚀 躍遷進度: ${currentIndex} / ${roundQuestions.length} 題 ｜ ⚫ 黑洞安全距離: ${safeDist}`;

  const danger = phase === 'playing' && safeDist <= 15;
  $('criticalAlert').classList.toggle('danger-flash', danger);
  $('warningBanner').classList.toggle('hidden', !danger);

  $('lblShipName').textContent = `🚀 方舟號｜${streak > 0 ? streak + ' 連擊' : '曲速巡航'}`;
}

// 教師 Space 鍵全螢幕凍結與靜音
function togglePause(forceState) {
  if (phase !== 'playing') return;
  paused = typeof forceState === 'boolean' ? forceState : !paused;

  $('pauseOverlay').hidden = !paused;
  document.body.classList.toggle('mission-paused', paused);
  setAnswers(!paused && phase === 'playing');

  if (paused) {
    stopLoops();
    if (audioCtx) audioCtx.suspend().catch(() => {});
  } else {
    if (audioCtx) audioCtx.resume().catch(() => {});
    startLoops();
  }
}

// 完賽結算：全自動向 GAS 送出成績 ＋ 備查黑盒子觀念修復日誌
function finishGame() {
  if (phase === 'ended') return;
  phase = 'ended';
  isLocked = true;
  stopLoops();
  setAnswers(false);

  // 計算最終得分 (扣除緊急防護罩扣分，最低 0 分)
  let rawScore = Math.round((100 * firstCorrect) / roundQuestions.length);
  finalScore = emergencyTriggered ? Math.max(0, rawScore - 10) : rawScore;

  $('criticalAlert').classList.remove('danger-flash');
  $('warningBanner').classList.add('hidden');
  playVictorySound();
  effect('victory');

  // 渲染底層備查黑盒子日誌
  $('endScreen').style.display = 'flex';
  $('endTitle').textContent = finalScore >= 60 ? '🌌 躍遷成功！方舟號抵達安全星系' : '🛰️ 救援艦接應！完成星際觀念檢討';
  $('missionRank').textContent = firstCorrect === roundQuestions.length ? '🏅 星際王牌｜首次作答全對' :
                                 finalScore >= 80 ? '🥇 精英領航員｜穩定推進' :
                                 finalScore >= 60 ? '🌟 探索先鋒｜完成觀念修復' : '🔧 救援任務｜整理觀念再次啟航';
  $('endSubtitle').textContent = `首次答對 ${firstCorrect} / ${roundQuestions.length} 題（得分：${finalScore} 分）｜作答歷時 ${activeSeconds} 秒`;

  // 錯題觀念 Top 3 列表
  $('reviewBody').replaceChildren();
  const sortedLogs = [...wrongLogs].sort((a, b) => b.count - a.count).slice(0, 3);
  if (!sortedLogs.length) {
    const tr = $('reviewBody').insertRow();
    const td = tr.insertCell();
    td.colSpan = 2;
    td.textContent = '🎖️ 本次挑戰零失誤！生物觀念掌握極佳！';
  } else {
    sortedLogs.forEach(log => {
      const tr = $('reviewBody').insertRow();
      tr.insertCell().textContent = `${log.question}\n❌ 你的選擇：${log.userAnswer}`;
      tr.insertCell().textContent = `✅ 正確答案：${log.correctAnswer}\n${log.explanation}`;
    });
  }

  // 🏆 關鍵：完賽立即全自動喚起標準三階段結算模組 (背景自動 POST GAS)
  setTimeout(() => {
    triggerBlackholeGasSubmit();
  }, 400);
}

function triggerBlackholeGasSubmit() {
  if (submitted || typeof showScoreSubmitModal !== 'function') return;
  submitted = true;

  const student = window.BioGameSuite?.getStudent() || {};
  showScoreSubmitModal({
    gameTitle: '生物星際大逃亡：逃離黑洞',
    gameId: 'blackhole',
    score: finalScore,
    scoreDisplay: `${finalScore} 分 (答對 ${firstCorrect}/${roundQuestions.length} 題)`,
    accuracy: Math.round((100 * firstCorrect) / roundQuestions.length) + '%',
    duration: `${activeSeconds} 秒`,
    errorCount: answeredWrong.size,
    keywords: wrongLogs.map(l => l.question).slice(0, 3).join('；') || '全對無錯題',
    initialClass: student.class,
    initialSeat: student.seat,
    initialName: student.name,
    onRetry: () => {
      initGame(false);
    },
    onBonusChallenge: () => {
      initGame(true);
    }
  });
}

async function copyCertificationData() {
  const text = `【生物星際大逃亡學習紀錄】\n學生：${window.BioGameSuite?.getStudent()?.name || '探險家'}\n得分：${finalScore} 分（首次答對 ${firstCorrect}/${roundQuestions.length} 題）\n歷時：${activeSeconds} 秒\n錯題檢討：\n${wrongLogs.map(q => q.question + ' ➔ ' + q.correctAnswer).join('\n') || '無錯題'}`;
  $('copyResult').hidden = false;
  $('copyResult').value = text;
  try {
    await navigator.clipboard.writeText(text);
    $('copyStatus').textContent = '✅ 已複製學習紀錄至剪貼簿！';
  } catch (_) {
    $('copyStatus').textContent = '請手動選取下方文字複製：';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSpaceCanvas();

  for (let i = 0; i < 4; i++) {
    $('btn' + i).addEventListener('click', () => handleSelect(i));
  }

  $('btnSound').onclick = toggleSound;
  $('btnMusic').onclick = toggleMusic;
  $('btnCopyCert').onclick = copyCertificationData;
  $('btnRestart').onclick = () => initGame(false);

  $('btnPause').onclick = () => togglePause();
  $('btnResume').onclick = () => togglePause(false);

  // 空白鍵教師緊急凍結講解
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) {
      e.preventDefault();
      togglePause();
    }
  });

  // 分頁切換時自動暫停，防止背景繼續被黑洞追逐
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) togglePause(true);
  });

  loadManifestAndUnits();
});
