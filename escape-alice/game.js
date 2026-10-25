/**
 * 奇幻仙境・愛麗絲的生物密室逃脫 (Alice in Wonderland Biology Escape) - 尊榮旗艦版 V1.1
 * 依據國中生物 108 課綱與 16 題標準架構設計 (6 / 5 / 5)
 */

'use strict';

const $ = id => document.getElementById(id);

// 1. 外部 WebP 場景資源 (由 Base64 獨立分離，避免 iPad 記憶體崩潰)
const BG = [
  'assets/scene0.webp', // 首頁封面
  'assets/scene1.webp', // 第一關：蘑菇森林
  'assets/scene2.webp', // 第二關：瘋帽子下午茶
  'assets/scene3.webp'  // 第三關：紅心皇后城堡 / 結局
];

// 2. 原生 16 道仙境情境試題模板 (6 / 5 / 5 梯隊配置)
const DEFAULT_LEVELS = [
  {
    title: "兔子洞與魔法蘑菇森林",
    story: "白兔的懷錶突然倒轉！解開六個生物謎題，穿過魔法樹洞。",
    reward: "仙境初階探索家",
    quota: { '易': 4, '中': 2, '難': 0 },
    items: [
      ["發光蘑菇", 17, 32, "蘑菇通常屬於哪一類生物？", ["植物", "真菌", "動物", "細菌"], 1, "蘑菇屬於真菌，不能靠光合作用製造養分。"],
      ["白兔懷錶", 36, 70, "兔子的細胞通常不具有哪個構造？", ["細胞膜", "細胞核", "細胞壁", "細胞質"], 2, "一般動物細胞沒有細胞壁。"],
      ["魔法樹洞", 63, 45, "下列哪一項是生物體構造與功能的基本單位？", ["組織", "器官", "細胞", "系統"], 2, "細胞是生物體構造與功能的基本單位。"],
      ["樹上的葉片", 77, 24, "植物進行光合作用主要利用哪個胞器？", ["粒線體", "葉綠體", "液胞", "細胞核"], 1, "葉綠體是光合作用主要進行的場所。"],
      ["迷路指示牌", 84, 70, "研究自然現象時，應先做什麼？", ["直接下結論", "觀察並提出問題", "只猜答案", "忽略資料"], 1, "從觀察與提問開始，才能進一步進行科學探究。"],
      ["兔洞階梯", 52, 76, "用顯微鏡找尋標本時通常應先用？", ["低倍率", "高倍率", "最高倍率", "不用物鏡"], 0, "先使用低倍率較容易找到觀察目標。"]
    ]
  },
  {
    title: "瘋帽子的奇怪下午茶",
    story: "瘋帽子把微觀世界的大小尺度搞混了！尋找五個線索，認識奈米、微米與毫米，最後把五個魔法茶杯依尺度由小到大排好。",
    reward: "仙境茶會解謎師",
    quota: { '易': 1, '中': 3, '難': 1 },
    items: [
      ["瘋帽子的帽子", 41, 29, "依照尺度簡報，哪一項的尺寸最小？", ["金原子直徑", "病毒", "細菌", "頭髮直徑"], 0, "金原子直徑約 0.3 奈米，比約 80 奈米的病毒還小。"],
      ["跳舞的茶壺", 59, 60, "下列哪個單位表示的長度最小？", ["毫米（mm）", "微米（μm）", "奈米（nm）", "公分（cm）"], 2, "1 毫米＝1000 微米；1 微米＝1000 奈米，所以奈米最小。"],
      ["倒掛時鐘", 18, 26, "依照簡報，哪個物體約為 3 微米？", ["病毒", "細菌", "卵細胞", "金原子"], 1, "簡報中的細菌約 3 微米；病毒約 80 奈米。"],
      ["三層蛋糕", 80, 50, "頭髮直徑約 60 微米，換算成毫米約是多少？", ["0.006 毫米", "0.06 毫米", "0.6 毫米", "6 毫米"], 1, "1000 微米＝1 毫米，因此 60 微米＝0.06 毫米。"],
      ["會說話的茶杯", 33, 76, "卵細胞約 0.1 毫米，與頭髮直徑約 60 微米相比，哪個比較大？", ["卵細胞", "頭髮直徑", "一樣大", "無法比較"], 0, "0.1 毫米＝100 微米，大於頭髮直徑的 60 微米。這裡比較的是簡報提供的大小。"]
    ]
  },
  {
    title: "紅心皇后的終極審判",
    story: "皇后守著最後的出口！完成五道題，再解開撲克牌排序機關，才能離開城堡。",
    reward: "紅心城堡智勇騎士",
    quota: { '易': 0, '中': 2, '難': 3 },
    items: [
      ["紅心城門", 50, 36, "細胞內與控制大部分生命活動有關的構造是？", ["細胞核", "細胞壁", "液胞", "葉綠體"], 0, "細胞核與遺傳物質及生命活動控制有關。"],
      ["左側撲克牌兵", 24, 64, "通常不具有細胞核的生物是？", ["酵母菌", "細菌", "洋蔥", "草履蟲"], 1, "細菌屬於原核生物，沒有由核膜包圍的細胞核。"],
      ["右側撲克牌兵", 76, 64, "真菌和植物的重要不同之一是：真菌通常？", ["有葉綠體", "不能行光合作用", "沒有細胞膜", "全都單細胞"], 1, "真菌通常缺乏葉綠體，無法進行光合作用。"],
      ["魔法階梯", 38, 78, "由許多相似細胞共同執行特定功能，通常稱為？", ["器官", "個體", "組織", "族群"], 2, "組織由具有相似構造或功能的細胞組成。"],
      ["皇后旗幟", 82, 28, "下列哪種說法較符合科學態度？", ["有證據時也不修正想法", "依證據修正解釋", "只相信第一次猜測", "忽略新發現"], 1, "科學解釋應依新的可靠證據修正。"]
    ]
  }
];

// 實時關卡題庫副本
let levels = JSON.parse(JSON.stringify(DEFAULT_LEVELS));

// 仙境對白與引導
const dialogue = [
  ['咦？白兔又跑哪裡去了？快來幫我找線索！', '兔子洞的空氣有一股奇異的氣味，仔細找找發光的東西！', '太棒了！魔法森林的通道已經開啟！'],
  ['這些茶杯居然不照順序排隊！瘋帽子把微觀尺度搞混了。', '奈米、微米、毫米……到底誰比較大呢？', '茶會的魔法開始沸騰！準備排列尺度茶杯！'],
  ['皇后在城堡門口審判！別緊張，冷靜運用生物學知識。', '撲克牌士兵正在巡邏，專心回答每一道謎題！', '出口就在眼前！快解開紅心皇后的撲克牌封印！']
];

// 突發劇情廣播（每關 50% 題目解開時非中斷觸發）
const storyBeats = [
  '🐇 白兔的懷錶鈴聲響起：「快點快點！魔法蘑菇森林的出口就在前方！」',
  '🫖 瘋帽子歡呼：「茶會上的魔法沸騰了！解開所有謎題就能解鎖五個尺度茶杯！」',
  '👑 紅心皇后下令：「竟敢挑戰撲克牌封印？拿出你們對細胞到個體的真本事吧！」'
];

// 3. 核心狀態
let stage = -1;
let complete = [new Set(), new Set(), new Set()];
let awards = [];
let mechanismDone = [false, false, false];
let mechanismState = null;
let preview = false;
let running = false;
let busy = false;
let currentQuestion = -1;
let lockedUntil = 0;
let qSequence = 0;
let beatFired = [false, false, false];
let startTime = 0;
let totalElapsedSec = 0;
let clockExpired = false;
let clockLast = Date.now();

// 4. URL 參數與學生模式鎖定
const PARAMS = new URLSearchParams(location.search);
const studentMode = PARAMS.get('student') === '1' || window.__ESCAPE_STUDENT_EXPORT__ === true;

if (studentMode) {
  document.body.classList.add('is-student-mode');
  ['teacherToggle', 'teacher', 'settings', 'quickStageChoices', 'teacherPreviewBtn', 'addTimeBtn'].forEach(id => {
    const el = $(id);
    if (el) el.style.setProperty('display', 'none', 'important');
  });
}

// 5. 計時模式與時間參數
const clampMinutes = (v, fallback, max = 120) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= max ? Math.round(n) : fallback;
};

let timeMode = PARAMS.get('clock') === 'stage' || PARAMS.get('mode') === 'stage' ? 'stage' : 'total';
let totalMinutes = clampMinutes(PARAMS.get('total') || PARAMS.get('timer'), 10);
let stageMinutes = [4, 3, 3];
if (PARAMS.has('times')) {
  const parts = PARAMS.get('times').split(',').map(Number);
  if (parts.length === 3 && parts.every(v => Number.isInteger(v) && v >= 1 && v <= 60)) {
    stageMinutes = parts;
  }
}
let timerOff = PARAMS.get('timer') === 'off' || PARAMS.get('notime') === '1';
let seconds = totalMinutes * 60;

function updateClockMode() {
  timeMode = $('timeModeSelect')?.value === 'stage' ? 'stage' : 'total';
  totalMinutes = clampMinutes($('totalMinutesInput')?.value, 10);
  timerOff = $('noTimeCheck')?.checked || false;
  clockExpired = false;
}

function fmt(n) {
  return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
}

function clockText() {
  if (timerOff) return '⏳ 探索中 (無倒數)';
  return '⏳ ' + (timeMode === 'total' ? '全場 ' : `第 ${stage + 1} 關 `) + fmt(seconds);
}

function say(msg) {
  const sp = $('speech');
  if (sp) sp.textContent = msg;
}

function overlay(html) {
  const modal = $('modal');
  if (modal) modal.innerHTML = html;
  $('overlay')?.classList.remove('hidden');
  busy = true;
}

function closeOverlay() {
  qSequence++;
  $('overlay')?.classList.add('hidden');
  busy = false;
}

// 突發廣播橫幅
function triggerStoryBeat(stageIdx) {
  if (beatFired[stageIdx]) return;
  beatFired[stageIdx] = true;
  const banner = $('storyBeatBanner');
  const txt = $('storyBeatText');
  if (!banner || !txt) return;

  txt.textContent = storyBeats[stageIdx] || '奇幻仙境的光芒正在律動！';
  banner.classList.remove('hidden');
  setTimeout(() => {
    banner.classList.add('hidden');
  }, 4500);
}

// 6. 換關與場景渲染
function goto(n, isPreview = false) {
  if (clockExpired && n >= 0 && !isPreview) return;
  closeOverlay();
  mechanismState = null;
  const previous = stage;
  preview = isPreview;
  stage = n;
  running = n >= 0 && n < 3 && !preview;

  if (n >= 0 && n < 3) {
    if ((n !== previous || isPreview) && (timeMode === 'stage' || preview)) {
      seconds = (stageMinutes[n] || 4) * 60;
    }
  }

  const timerEl = $('timer');
  if (timerEl) {
    timerEl.textContent = preview ? '⏳ 教師預覽' : n < 0 ? (timerOff ? '⏳ 無倒數' : '⏳ 10:00') : clockText();
  }

  const sceneBg = BG[n < 0 ? 0 : n > 2 ? 3 : n + 1];
  const sceneEl = $('scene');
  if (sceneEl) sceneEl.style.backgroundImage = `url("${sceneBg}")`;

  $('home')?.classList.toggle('hidden', n !== -1);
  $('stageInfo')?.classList.toggle('hidden', n < 0 || n > 2);
  $('hintBtn')?.classList.toggle('hidden', n < 0 || n > 2);
  $('teacher')?.classList.add('hidden');

  const stageLabel = $('stageLabel');
  if (stageLabel) {
    stageLabel.textContent = n < 0 ? '｜遊戲首頁' : n > 2 ? '｜成功逃脫' : `｜第 ${n + 1} 關`;
  }

  $('hotspots').innerHTML = '';

  if (n < 0) {
    say('仙境裡的一切都好奇怪！快來一起冒險吧！');
    return;
  }
  if (n === 3) {
    ending();
    return;
  }

  $('levelName').textContent = `第 ${n + 1} 關｜${levels[n].title}`;
  $('levelStory').textContent = levels[n].story;
  say(dialogue[n][0]);
  render();
}

function render() {
  const container = $('hotspots');
  if (!container) return;
  container.innerHTML = '';

  const items = levels[stage].items;
  items.forEach((q, i) => {
    const isSolved = complete[stage].has(i);
    const b = document.createElement('button');
    b.className = 'hotspot' + (isSolved ? ' solved' : '');
    b.style.setProperty('--x', q[1] + '%');
    b.style.setProperty('--y', q[2] + '%');
    b.style.setProperty('--delay', (-i * 2.2) + 's');
    b.innerHTML = `<span>${isSolved ? '✓' : '✦'}</span><em>${q[0]}</em>`;
    b.setAttribute('aria-label', '探索 ' + q[0]);
    b.onclick = () => question(i);
    container.appendChild(b);
  });

  const solvedCount = complete[stage].size;
  const totalCount = items.length;
  $('progress').textContent = `🔍 已解開 ${solvedCount} / ${totalCount} 道謎題`;

  const fill = $('progressFill');
  if (fill) {
    fill.style.width = Math.round((solvedCount / totalCount) * 100) + '%';
  }

  // 檢查是否達成 50% 突發劇情廣播
  if (solvedCount >= Math.ceil(totalCount / 2)) {
    triggerStoryBeat(stage);
  }
}

// 7. 選項洗牌與題目視窗
function shuffleOptions(q) {
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.map((k, pos) => `<button type="button" class="choice" data-a="${k}">${'ABCD'[pos]}．${q[4][k]}</button>`).join('');
}

function question(i) {
  if (clockExpired) return;
  currentQuestion = i;
  lockedUntil = 0;
  const q = levels[stage].items[i];

  if (complete[stage].has(i)) {
    overlay(`
      <h2>✅ ${q[0]}</h2>
      <p style="color:#6ee7b7;font-weight:700">此謎題已順利解開！</p>
      <p style="background:rgba(255,255,255,0.08);padding:12px;border-radius:10px">${q[6]}</p>
      <button class="primary" id="dismiss">返回探索</button>
    `);
    $('dismiss').onclick = closeOverlay;
    return;
  }

  overlay(`
    <h2>🔎 ${q[0]}</h2>
    <p style="font-size:1.1rem;color:#fdf4ff;line-height:1.6">${q[3]}</p>
    <div id="answers">${shuffleOptions(q)}</div>
    <p id="res"></p>
    <button class="pill" id="dismiss">先返回探索</button>
  `);

  $('dismiss').onclick = closeOverlay;
  document.querySelectorAll('[data-a]').forEach(b => {
    b.onclick = () => answer(+b.dataset.a);
  });
}

function answer(k) {
  if (clockExpired) return;
  if (Date.now() < lockedUntil) return;
  const q = levels[stage].items[currentQuestion];

  if (k !== q[5]) {
    lockedUntil = Date.now() + 4000;
    $('res').textContent = '愛麗絲：差一點！先讀讀題目，4 秒後再試。';
    const b = document.querySelector(`[data-a="${k}"]`);
    if (b) b.classList.add('wrong');
    document.querySelectorAll('[data-a]').forEach(btn => btn.disabled = true);

    const token = ++qSequence;
    setTimeout(() => {
      if (token !== qSequence || !$('answers')) return;
      document.querySelectorAll('[data-a]').forEach(btn => btn.disabled = false);
      $('res').textContent = '再仔細看看四個選項，找出最合理的答案。';
    }, 4000);
    return;
  }

  qSequence++;
  complete[stage].add(currentQuestion);
  document.querySelectorAll('[data-a]').forEach(btn => {
    btn.disabled = true;
    if (+btn.dataset.a === k) btn.classList.add('correct');
  });

  $('res').textContent = '答對了！' + q[6];
  $('dismiss').textContent = '繼續冒險';
  $('dismiss').onclick = () => {
    closeOverlay();
    render();
    if (complete[stage].size === levels[stage].items.length) {
      afterQuestions();
    } else {
      say('找到一個答案了！我們繼續探索。');
    }
  };
}

// 8. 仙境特色機關（茶杯尺度排序 ＆ 撲克牌構造層次排序）
const MECHANISMS = {
  1: {
    label: '🫖 瘋帽子的尺度魔法茶杯',
    icon: '☕',
    description: '瘋帽子把大小尺度搞亂了！請根據微觀尺度，依「由小到大」排列五個茶杯。點選兩只茶杯即可交換位置。記得：1 毫米＝1000 微米，1 微米＝1000 奈米。',
    correct: ['金原子（0.3 奈米）', '病毒（80 奈米）', '細菌（3 微米）', '頭髮直徑（60 微米）', '卵細胞（0.1 毫米）'],
    start: ['卵細胞（0.1 毫米）', '細菌（3 微米）', '金原子（0.3 奈米）', '頭髮直徑（60 微米）', '病毒（80 奈米）'],
    explain: '由小到大順序：金原子約 0.3 奈米 → 病毒約 80 奈米 → 細菌約 3 微米（3000 奈米）→ 頭髮直徑約 60 微米 → 卵細胞約 0.1 毫米（100 微米）。數值屬生物科學近似參考值。'
  },
  2: {
    label: '🃏 紅心皇后的撲克牌封印',
    icon: '🃏',
    description: '皇后把多細胞動物的構造層次打亂了！請由小到大排列五張撲克牌。點選兩張卡片即可交換位置。',
    correct: ['細胞', '組織', '器官', '器官系統', '個體'],
    start: ['個體', '器官', '細胞', '器官系統', '組織'],
    explain: '以一般多細胞動物為例：細胞組成組織，組織構成器官，相關器官形成器官系統，共同維持個體之生命機能。'
  }
};

function afterQuestions() {
  if (stage === 0 || mechanismDone[stage]) {
    clearLevel();
    return;
  }
  openMechanism(stage, false);
}

function openMechanism(n, teacherDemo = false) {
  if (clockExpired && !teacherDemo) return;
  if (timeMode === 'stage' || teacherDemo) running = false;
  if (!MECHANISMS[n]) return;
  const def = MECHANISMS[n];
  mechanismState = { n, teacherDemo, items: [...def.start], selected: -1, tries: 0 };
  drawMechanism();
}

function formatMechanicLabel(index, name) {
  const match = name.match(/^([^（(]+)[（(]([^）)]+)[）)]$/);
  if (!match) return `<span class="item-main">${index + 1}. ${name}</span>`;
  return `<span class="item-main">${index + 1}. ${match[1].trim()}</span><span class="item-sub">${match[2].trim()}</span>`;
}

function drawMechanism(message = '') {
  const st = mechanismState;
  if (!st) return;
  const def = MECHANISMS[st.n];
  const cards = st.items.map((name, i) => `
    <button type="button" class="mechanic-item ${st.selected === i ? 'selected' : ''}" data-swap="${i}" aria-pressed="${st.selected === i}">
      <span class="figure">${def.icon}</span>
      <span class="item-name">${formatMechanicLabel(i, name)}</span>
    </button>
  `).join('');

  overlay(`
    <h2>${def.label}</h2>
    <div class="mechanic-intro">${def.description}</div>
    <div class="mechanic-grid">${cards}</div>
    <p class="mechanic-progress" id="mechanicMessage">${message || '請交換順序，全部正確後按「驗證排列」。'}</p>
    <div class="mechanic-actions">
      <button class="primary" id="verifyMechanic">🔓 驗證排列</button>
      <button class="pill" id="resetMechanic">↻ 重新排列</button>
      ${st.teacherDemo ? '<button class="pill" id="exitMechanic">結束教師測試</button>' : ''}
    </div>
    <p class="small" style="text-align:center;margin-top:8px">💡 貼心操作：點選兩張卡片即可交換位置，平板觸控超順暢。</p>
  `);

  document.querySelectorAll('[data-swap]').forEach(b => {
    b.onclick = () => {
      const i = +b.dataset.swap;
      if (st.selected < 0) {
        st.selected = i;
      } else if (st.selected === i) {
        st.selected = -1;
      } else {
        [st.items[st.selected], st.items[i]] = [st.items[i], st.items[st.selected]];
        st.selected = -1;
      }
      drawMechanism();
    };
  });

  $('resetMechanic').onclick = () => {
    st.items = [...def.start];
    st.selected = -1;
    drawMechanism('已重新排列，重新挑戰吧！');
  };

  $('verifyMechanic').onclick = () => {
    st.tries++;
    if (st.items.every((x, i) => x === def.correct[i])) {
      if (!st.teacherDemo) mechanismDone[st.n] = true;
      mechanismState = null;
      overlay(`
        <h2>✨ 機關成功解鎖！</h2>
        <p style="background:rgba(255,255,255,0.08);padding:14px;border-radius:12px;line-height:1.7">${def.explain}</p>
        <p style="color:#6ee7b7;font-weight:700">${st.teacherDemo ? '這是教師機關預覽，不會計入學生通關。' : '你已解開魔法封印，可以領取這一關的榮譽獎狀！'}</p>
        <button class="primary" id="mechanismFinish">${st.teacherDemo ? '返回教師工具' : '領取通關獎狀 ➜'}</button>
      `);
      $('mechanismFinish').onclick = () => {
        closeOverlay();
        if (st.teacherDemo) {
          $('teacher')?.classList.remove('hidden');
          if (stage >= 0 && stage < 3 && !preview) running = true;
        } else {
          clearLevel();
        }
      };
    } else {
      st.selected = -1;
      $('mechanicMessage').textContent = `第 ${st.tries} 次檢查：順序還不對。${st.n === 1 ? '先統一尺度單位（1mm=1000μm=1,000,000nm），再比較哪個物體較小。' : '從最小的細胞開始，再想想器官由什麼組成。'}`;
    }
  };

  if (st.teacherDemo) {
    $('exitMechanic').onclick = () => {
      mechanismState = null;
      closeOverlay();
      $('teacher')?.classList.remove('hidden');
      if (stage >= 0 && stage < 3 && !preview) running = true;
    };
  }
}

// 9. 獎狀與通關結算
function certificate(n, isTeacher = false) {
  return `
    <div class="cert">
      <div class="symbol">🏅</div>
      <h2>奇幻仙境通關獎狀</h2>
      <p style="color:#fde047;font-weight:800;font-size:1.1rem">第 ${n + 1} 關 · ${levels[n].title}</p>
      <h3>${levels[n].reward}</h3>
      <p style="font-size:0.95rem;color:#cbd5e1">${isTeacher ? '教師示範樣張｜非正式通關紀錄' : '順利解開仙境生物謎題，獲得本關認證！'}</p>
    </div>
  `;
}

function clearLevel() {
  if (timeMode === 'stage') running = false;
  if (!preview && !awards.includes(stage)) awards.push(stage);
  const next = stage + 1;

  overlay(
    certificate(stage, preview) +
    `<p style="text-align:center;font-size:1.1rem;margin:12px 0">愛麗絲：太棒了！我們離仙境出口更近一步！</p>
    <div style="text-align:center"><button class="primary" id="next">${next === 3 ? '查看最終結局 👑' : '前往下一關 ➜'}</button></div>`
  );

  $('next').onclick = () => goto(next, preview);
}

function showCert(n) {
  running = false;
  overlay(
    certificate(n, true) +
    '<p style="text-align:center;margin-top:14px"><button class="primary" id="dismiss">返回教師預覽</button></p>'
  );
  $('dismiss').onclick = () => {
    closeOverlay();
    $('teacher')?.classList.remove('hidden');
  };
}

function ending() {
  say('成功了！這次全靠你解開所有生物謎題！');
  const elapsed = Math.floor((Date.now() - startTime) / 1000) || totalElapsedSec || 120;
  const timeStr = fmt(elapsed);
  const totalSolved = complete.reduce((acc, s) => acc + s.size, 0);
  const select = $('unitSelect');
  const unitTitle = select?.options[select.selectedIndex]?.text || '仙境愛麗絲示範題庫';

  const html = `
    <div class="cert">
      <div class="symbol">👑</div>
      <h2>奇幻仙境成功逃脫！</h2>
      <h3>仙境生物探險家</h3>
      <p style="font-size:1.1rem;line-height:1.7;color:#fef08a">
        你追上白兔、破解微觀尺度茶會，並通過了皇后的終極審判！<br>
        生物學的精準觀察與邏輯思維，成功引領你重返現實世界。
      </p>
      <div style="background:rgba(255,255,255,0.1);padding:10px 14px;border-radius:10px;margin:12px 0;font-size:0.95rem;color:#e9d5ff">
        獲得認證：${awards.length} / 3 關　｜　解開謎題：${totalSolved} / 16　｜　耗時：${timeStr}
      </div>
    </div>

    <!-- 學生作業繳交指引卡 -->
    <div class="nextStepCard">
      <div style="font-weight:800;font-size:1.05rem;color:#fbbf24;margin-bottom:6px">📸 挑戰達成！下一步處置方式：</div>
      <div style="font-size:0.92rem;line-height:1.6;color:#f1f5f9">
        1. 請直接<strong>「螢幕截圖」</strong>此成績畫面作為過關憑證。<br>
        2. 點擊下方<strong>「📋 複製探險戰報」</strong>，將文字戰報貼至 Google Classroom 繳交！
      </div>
    </div>

    <div class="buttons" style="display:flex;justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap">
      <button id="copyResultBtn" class="goldBtn" style="font-size:1.05rem;padding:12px 22px">📋 複製探險戰報</button>
      <button class="primary" id="again">返回首頁</button>
    </div>
  `;

  overlay(html);

  $('again').onclick = () => {
    complete = [new Set(), new Set(), new Set()];
    awards = [];
    mechanismDone = [false, false, false];
    beatFired = [false, false, false];
    goto(-1);
  };

  $('copyResultBtn').onclick = async () => {
    const text = `♠ 奇幻仙境・愛麗絲的生物密室逃脫｜探險戰報\n` +
      `🏅 榮譽認證：${awards.map(a => levels[a]?.reward).filter(Boolean).join('、') || '仙境生物探險家'}\n` +
      `✅ 解開謎題：${totalSolved} / 16\n` +
      `⏱️ 探索歷時：${timeStr}\n` +
      `📚 測驗單元：${unitTitle}\n` +
      `🎉 順利破解仙境機關，成功回到現實世界！`;

    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (err) {}
    }
    $('copyNoticeOverlay')?.classList.remove('hidden');
  };
}

// 10. 加時功能與時間耗盡處置
function addTime(addSec = 180) {
  seconds += addSec;
  clockExpired = false;
  running = true;
  clockLast = Date.now();
  $('timer').textContent = clockText();
  closeOverlay();
  $('timeoutOverlay')?.classList.add('hidden');
}

function handleTimeOut() {
  if (clockExpired || preview || stage < 0 || stage > 2) return;
  clockExpired = true;
  running = false;
  mechanismState = null;

  const overlayEl = $('timeoutOverlay');
  const badgeArea = $('timeoutBadgesArea');
  if (badgeArea) {
    badgeArea.textContent = `已獲得認證：${awards.length} / 3 關（${awards.map(a => levels[a].reward).join('、') || '暫無'}）`;
  }
  if (overlayEl) overlayEl.classList.remove('hidden');
}

// 11. 題庫標準化與 6 / 5 / 5 難度派題演算法
const labels = ['A', 'B', 'C', 'D'];

function normalizeQuestion(q) {
  if (!q || typeof q.question !== 'string' || !Array.isArray(q.options) || q.options.length < 2) return null;
  let ans = q.answer;
  if (typeof ans === 'string') {
    const idx = labels.indexOf(ans.trim().toUpperCase());
    if (idx >= 0) ans = idx;
    else ans = q.options.findIndex(o => o && o.trim() === q.answer.trim());
  }
  if (!Number.isInteger(ans) || ans < 0 || ans >= q.options.length) ans = 0;

  const diffStr = String(q.difficulty || '中');
  let mappedDiff = '中';
  if (diffStr.includes('易') || diffStr.includes('簡單') || diffStr === '1') mappedDiff = '易';
  else if (diffStr.includes('難') || diffStr.includes('深') || diffStr === '3') mappedDiff = '難';

  return {
    id: q.id || 'q-' + Math.random().toString(36).slice(2, 8),
    question: q.question.trim(),
    options: q.options.slice(0, 4).map(o => String(o).trim()),
    answer: ans >= 4 ? 0 : ans,
    difficulty: mappedDiff,
    explanation: q.explanation || `正確答案是【${q.options[ans] || ''}】。`
  };
}

function assignQuestions(pool) {
  const normList = (pool || []).map(normalizeQuestion).filter(Boolean);
  let safePool = normList.length ? normList : [];

  // 若題庫少於 16 題，循環回填保證安全填滿 16 個節點
  if (safePool.length < 16) {
    const origLen = safePool.length || 1;
    let i = 0;
    while (safePool.length < 16) {
      const base = safePool[i % origLen] || DEFAULT_LEVELS[0].items[0];
      safePool.push({
        id: (base.id || 'q') + '-rep-' + safePool.length,
        question: base.question || base[3],
        options: base.options || base[4],
        answer: base.answer !== undefined ? base.answer : base[5],
        difficulty: base.difficulty || '中',
        explanation: base.explanation || base[6]
      });
      i++;
    }
  }

  // 依難度分組
  const groups = { '易': [], '中': [], '難': [] };
  const shuffled = safePool.slice().sort(() => Math.random() - 0.5);
  shuffled.forEach(q => groups[q.difficulty].push(q));

  // 派發至關卡各節點
  const newLevels = JSON.parse(JSON.stringify(DEFAULT_LEVELS));
  newLevels.forEach(lvl => {
    const picked = [];
    const quota = lvl.quota || { '易': 2, '中': 2, '難': 1 };

    for (const level of ['易', '中', '難']) {
      for (let n = 0; n < quota[level]; n++) {
        if (groups[level].length) picked.push(groups[level].pop());
      }
    }
    while (picked.length < lvl.items.length) {
      const remainingPool = ['易', '中', '難'].flatMap(k => groups[k]);
      if (remainingPool.length) {
        picked.push(groups[remainingPool[0].difficulty].pop());
      } else {
        picked.push(safePool[Math.floor(Math.random() * safePool.length)]);
      }
    }

    picked.sort(() => Math.random() - 0.5);
    lvl.items.forEach((item, itemIdx) => {
      const q = picked[itemIdx];
      item[3] = q.question;
      item[4] = q.options;
      item[5] = q.answer;
      item[6] = q.explanation;
    });
  });

  return newLevels;
}

// 12. 連線全平台題庫清單 (manifest.json)
async function loadManifestAndPopulateSelect() {
  const select = $('unitSelect');
  if (!select) return;

  try {
    const candidates = ['../questions/manifest.json', 'questions/manifest.json'];
    let res = null;
    for (const url of candidates) {
      try {
        const r = await fetch(url);
        if (r.ok) { res = r; break; }
      } catch (_) {}
    }
    if (!res) throw new Error('無法連線題庫清單');

    const manifest = await res.json();
    select.innerHTML = '<option value="demo">✨ 仙境愛麗絲示範題庫 (16 題原生試題)</option>';

    if (Array.isArray(manifest.publishers)) {
      manifest.publishers.forEach(pub => {
        if (pub.status === 'placeholder' || !Array.isArray(pub.semesters)) return;
        pub.semesters.forEach(sem => {
          if (!Array.isArray(sem.units) || sem.units.length === 0) return;
          const grp = document.createElement('optgroup');
          grp.label = `📘 ${pub.name} - ${sem.name}`;
          sem.units.forEach(un => {
            const opt = document.createElement('option');
            opt.value = un.file;
            opt.textContent = `${un.title} (${un.count} 題)`;
            grp.appendChild(opt);
          });
          select.appendChild(grp);
        });
      });
    }

    const targetUnit = PARAMS.get('unit');
    if (targetUnit) {
      select.value = targetUnit;
      await switchUnit(targetUnit);
    } else {
      $('loadInfo').textContent = '✅ 已成功連線全平台題庫；當前採用「仙境愛麗絲示範題庫 (16 題)」。';
    }
  } catch (err) {
    console.warn('連線 manifest.json 失敗，保持示範題庫:', err);
    $('loadInfo').textContent = '展示模式：使用內建 16 題愛麗絲生物試題。';
  }
}

async function switchUnit(unitPath) {
  const badge = $('unitLoadedBadge');
  const info = $('loadInfo');
  if (unitPath === 'demo' || !unitPath) {
    levels = JSON.parse(JSON.stringify(DEFAULT_LEVELS));
    if (badge) badge.textContent = '✅ 當前題庫：仙境愛麗絲示範題庫 (16 題)';
    if (info) info.textContent = '展示模式：使用內建 16 題愛麗絲生物試題。';
    return;
  }

  try {
    if (info) info.textContent = '正在載入題庫：' + unitPath + '……';
    const urls = ['../questions/' + unitPath, 'questions/' + unitPath];
    let res = null;
    for (const u of urls) {
      try {
        const r = await fetch(u);
        if (r.ok) { res = r; break; }
      } catch (_) {}
    }
    if (!res) throw new Error('找不到題庫檔案');

    const data = await res.json();
    const rawList = data.questions || (Array.isArray(data) ? data : []);
    if (!rawList.length) throw new Error('該單元無可用題目');

    levels = assignQuestions(rawList);
    const select = $('unitSelect');
    const selectedText = select?.options[select.selectedIndex]?.text || unitPath;
    if (badge) badge.textContent = '✅ 已連線題庫：' + selectedText;
    if (info) info.textContent = `✅ 成功載入！共 ${rawList.length} 題，已依 6/5/5 難度梯隊分關派發。`;
  } catch (err) {
    console.error('切換題庫失敗:', err);
    alert('載入題庫失敗，將恢復預設示範題庫。');
    levels = JSON.parse(JSON.stringify(DEFAULT_LEVELS));
    if (badge) badge.textContent = '⚠️ 載入失敗，已切回示範題庫';
  }
}

// 13. 學生派卷 QR Code 生成器
function generateStudentQR() {
  const qrArea = $('studentQRArea');
  const qrBox = $('studentQRCode');
  const urlInput = $('studentUrlInput');
  const testLink = $('testStudentLaunchLink');
  if (!qrArea || !qrBox || !urlInput) return;

  const unitVal = $('unitSelect')?.value || 'demo';
  const cMode = $('timeModeSelect')?.value || 'total';
  const totMin = clampMinutes($('totalMinutesInput')?.value, 10);
  const noTime = $('noTimeCheck')?.checked;
  const t0 = clampMinutes($('timeStage0')?.value, 4, 60);
  const t1 = clampMinutes($('timeStage1')?.value, 3, 60);
  const t2 = clampMinutes($('timeStage2')?.value, 3, 60);

  const qp = new URLSearchParams();
  qp.set('student', '1');
  if (unitVal && unitVal !== 'demo') qp.set('unit', unitVal);
  if (noTime) {
    qp.set('timer', 'off');
  } else {
    qp.set('clock', cMode);
    if (cMode === 'total') {
      qp.set('total', String(totMin));
    } else {
      qp.set('times', `${t0},${t1},${t2}`);
    }
  }

  const loc = window.location;
  const finalUrl = `${loc.protocol}//${loc.host}${loc.pathname}?${qp.toString()}`;

  urlInput.value = finalUrl;
  if (testLink) testLink.href = finalUrl;
  qrArea.classList.remove('hidden');

  qrBox.innerHTML = '';
  let rendered = false;
  if (window.QRCode) {
    try {
      new QRCode(qrBox, {
        text: finalUrl,
        width: 170,
        height: 170,
        colorDark: '#1a0b2e',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      rendered = true;
    } catch (e) {
      console.warn('QRCode render fallback:', e);
    }
  }
  if (!rendered) {
    qrBox.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(finalUrl)}" alt="派發 QR Code" style="width:170px;height:170px;border-radius:8px">`;
  }
  qrArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyStudentUrl() {
  const input = $('studentUrlInput');
  const feedback = $('copyUrlFeedback');
  if (!input || !input.value) generateStudentQR();
  const url = input?.value;
  if (!url) return;

  navigator.clipboard.writeText(url).then(() => {
    if (feedback) feedback.textContent = '✅ 已成功複製學生派發網址至剪貼簿！';
    setTimeout(() => { if (feedback) feedback.textContent = ''; }, 3000);
  }).catch(() => {
    prompt('請手動複製學生派發網址：', url);
  });
}

// 學生端視窗啟動器（具備彈出視窗防封鎖備援）
function launchStudentView(e) {
  if (e) e.preventDefault();
  generateStudentQR();
  const url = $('studentUrlInput')?.value;
  if (!url) return;

  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win || win.closed || typeof win.closed === 'undefined') {
    // 瀏覽器攔截彈出視窗時的防呆備援
    const go = confirm('偵測到瀏覽器攔截了自動彈出分頁！\n\n是否直接在當前視窗開啟學生版挑戰？\n（按「確定」前往學生版，按「取消」手動複製網址）');
    if (go) {
      window.location.href = url;
    }
  }
}

// 14. 可拖曳愛麗絲吉祥物
function initDraggableAlice() {
  const alice = $('alice');
  if (!alice) return;

  let isDragging = false;
  let startX = 0, startY = 0;
  let initLeft = 0, initTop = 0;

  alice.addEventListener('pointerdown', e => {
    if (e.target && (e.target.id === 'speech' || e.target.closest('#speech'))) return;
    if (!e.target.closest('svg') && !e.target.classList.contains('dragHint') && e.target !== alice) return;
    isDragging = true;
    alice.classList.add('is-dragging');
    startX = e.clientX;
    startY = e.clientY;
    const rect = alice.getBoundingClientRect();
    initLeft = rect.left;
    initTop = rect.top;
    alice.setPointerCapture(e.pointerId);
  });

  alice.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let nextLeft = Math.max(10, Math.min(window.innerWidth - 120, initLeft + dx));
    let nextTop = Math.max(50, Math.min(window.innerHeight - 150, initTop + dy));
    alice.style.left = nextLeft + 'px';
    alice.style.top = nextTop + 'px';
    alice.style.bottom = 'auto';
    alice.style.right = 'auto';
  });

  const stopDrag = e => {
    if (!isDragging) return;
    isDragging = false;
    alice.classList.remove('is-dragging');
    try { alice.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  alice.addEventListener('pointerup', stopDrag);
  alice.addEventListener('pointercancel', stopDrag);

  // 點擊對話泡泡可展開/收合
  const speech = $('speech');
  if (speech) {
    speech.addEventListener('click', () => {
      speech.classList.toggle('collapsed');
    });
  }
}

// 15. 事件綁定與初始化
function init() {
  // 計時器設定聯動
  const timeModeSelect = $('timeModeSelect');
  const stageTimesRow = $('stageTimesRow');
  const totalMinutesLabel = $('totalMinutesLabel');
  if (timeModeSelect) {
    timeModeSelect.addEventListener('change', () => {
      const isStage = timeModeSelect.value === 'stage';
      if (stageTimesRow) stageTimesRow.classList.toggle('hidden', !isStage);
      if (totalMinutesLabel) totalMinutesLabel.classList.toggle('hidden', isStage);
      updateClockMode();
    });
  }

  $('totalMinutesInput')?.addEventListener('change', updateClockMode);
  $('noTimeCheck')?.addEventListener('change', () => {
    updateClockMode();
    const durationB = $('introDuration');
    if (durationB) {
      durationB.innerHTML = timerOff ? '<b>⏱️ 當前設定：無時間壓力（不倒數模式）</b>' : `<b>⏱️ 預設時間：全場 ${totalMinutes} 分鐘</b>`;
    }
  });

  // 題庫切換
  $('unitSelect')?.addEventListener('change', e => {
    switchUnit(e.target.value);
  });

  // 學生派發 QR Code 與分頁開啟
  $('genQRBtn')?.addEventListener('click', generateStudentQR);
  $('copyUrlBtn')?.addEventListener('click', copyStudentUrl);
  $('testStudentLaunchBtn')?.addEventListener('click', launchStudentView);
  $('testStudentLaunchLink')?.addEventListener('click', launchStudentView);

  // 設定面板即時聯動生成派發網址
  $('settings')?.addEventListener('toggle', () => {
    if ($('settings').open) generateStudentQR();
  });
  $('timeModeSelect')?.addEventListener('change', generateStudentQR);
  $('totalMinutesInput')?.addEventListener('input', generateStudentQR);
  ['timeStage0', 'timeStage1', 'timeStage2'].forEach(id => {
    $(id)?.addEventListener('input', generateStudentQR);
  });

  // 開始遊戲
  $('start')?.addEventListener('click', () => {
    updateClockMode();
    seconds = timerOff ? 999999 : timeMode === 'total' ? totalMinutes * 60 : (stageMinutes[0] || 4) * 60;
    clockLast = Date.now();
    startTime = Date.now();
    complete = [new Set(), new Set(), new Set()];
    awards = [];
    mechanismDone = [false, false, false];
    beatFired = [false, false, false];
    goto(0);
  });

  // 背景故事介紹
  $('storyBtn')?.addEventListener('click', () => {
    overlay(`
      <h2>📜 仙境傳說背景</h2>
      <p style="line-height:1.8">
        午後的草地上，一隻穿著背心的白兔匆忙跑過，嘴裡唸著：「糟糕！要遲到了！」<br><br>
        愛麗絲追隨白兔跳進了神奇的樹洞，卻發現自己置身於一個顛覆常理的奇幻仙境。在這裡，魔法的運作完全遵循大自然深層的生物法則——真菌與植物的界線、細胞微觀結構的運作、奈米到毫米的尺度秩序，以及多細胞生物精密的構造層次。<br><br>
        紅心皇后在此設下了嚴苛的知識封印，唯有具備敏銳觀察力與扎實生物學素養的探險家，才能破解層層機關，平安重返現實世界！
      </p>
      <div style="text-align:center;margin-top:16px"><button class="primary" id="closeStory">我知道了，準備挑戰</button></div>
    `);
    $('closeStory').onclick = closeOverlay;
  });

  // 教師抽屜與預覽按鈕
  $('teacherToggle')?.addEventListener('click', () => {
    if (!studentMode) $('teacher')?.classList.toggle('hidden');
  });
  $('teacherPreviewBtn')?.addEventListener('click', () => {
    if (!studentMode) goto(0, true);
  });
  $('closeTeacher')?.addEventListener('click', () => {
    $('teacher')?.classList.add('hidden');
  });

  // 教師跳關按鈕
  document.querySelectorAll('[data-stage]').forEach(b => {
    b.onclick = () => { if (!studentMode) goto(+b.dataset.stage, true); };
  });
  document.querySelectorAll('[data-jump]').forEach(b => {
    b.onclick = () => { if (!studentMode) goto(+b.dataset.jump, true); };
  });

  // 測試獎狀
  document.querySelectorAll('[data-cert]').forEach(b => {
    b.onclick = () => { if (!studentMode) showCert(+b.dataset.cert); };
  });

  // 測試機關
  document.querySelectorAll('[data-puzzle]').forEach(b => {
    b.onclick = () => {
      if (studentMode) return;
      $('teacher')?.classList.add('hidden');
      openMechanism(+b.dataset.puzzle, true);
    };
  });

  // 提示按鈕
  $('hintBtn')?.addEventListener('click', () => {
    if (stage < 0 || stage > 2) return;
    const unsolvedIdx = levels[stage].items.findIndex((_, j) => !complete[stage].has(j));
    if (unsolvedIdx >= 0) {
      say(`愛麗絲：試著找找「${levels[stage].items[unsolvedIdx][0]}」附近的微光！`);
    } else {
      say('所有線索都找齊了！準備前往下一道關卡！');
    }
  });

  // 延長加時按鈕
  $('addTimeBtn')?.addEventListener('click', () => addTime(180));
  $('extend3MinBtn')?.addEventListener('click', () => addTime(180));
  $('extend5MinBtn')?.addEventListener('click', () => addTime(300));
  $('finishNowBtn')?.addEventListener('click', () => {
    $('timeoutOverlay')?.classList.add('hidden');
    ending();
  });

  // 關閉複製成績提示
  $('closeCopyNotice')?.addEventListener('click', () => {
    $('copyNoticeOverlay')?.classList.add('hidden');
  });

  // 定時器迴圈 (每 250ms 更新一次)
  setInterval(() => {
    const now = Date.now();
    const elapsed = Math.max(0, Math.floor((now - clockLast) / 1000));
    if (elapsed < 1) return;
    clockLast += elapsed * 1000;
    if (!running || preview || clockExpired || timerOff) return;

    totalElapsedSec += elapsed;
    seconds = Math.max(0, seconds - elapsed);
    $('timer').textContent = clockText();

    if (seconds === 0) {
      handleTimeOut();
    }
  }, 250);

  // 初始化可拖曳愛麗絲
  initDraggableAlice();

  // 載入題庫清單
  loadManifestAndPopulateSelect();

  // 預先生成學生派發網址與按鈕狀態
  generateStudentQR();

  // 初始進入首頁
  goto(-1);
}

// 註冊全域 Hook
window.__ESCAPE_HOOK__ = {
  type: 'alice',
  levels: levels
};

// 啟動遊戲
window.addEventListener('DOMContentLoaded', init);
