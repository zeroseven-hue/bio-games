/**
 * 微觀特攻隊：細胞世界大暴走 (Microverse Escape) - 優化版 V1.0
 * 國中生物密室逃脫系列
 */

'use strict';

const $ = id => document.getElementById(id);

// 1. 抽離外部靜態素材 (大幅縮減體積，避免 iPad 記憶體閃退)
const BG = [
  'assets/scene0.webp',
  'assets/scene1.webp',
  'assets/scene2.webp',
  'assets/scene3.webp'
];
const YEKO = 'assets/yeko.webp';

// 2. 原生關卡與 16 道微觀生物精選試題 (6 / 5 / 5)
const DEFAULT_LEVELS = [
  {
    name: "細胞城市交通大亂",
    desc: "運輸系統發生大塞車！檢查細胞城市的故障節點，恢復物資配送。",
    reward: "運輸通行徽章",
    quota: { '易': 4, '中': 2, '難': 0 },
    items: [
      ["運輸閘門", 21, 45, "細胞最外層主要負責控制物質進出的構造是？", ["細胞膜", "細胞核", "細胞壁", "液胞"], 0, "細胞膜控制物質進出細胞。"],
      ["能源塔", 54, 28, "負責進行呼吸作用、釋放能量的重要胞器是？", ["葉綠體", "粒線體", "細胞壁", "液胞"], 1, "粒線體與細胞呼吸作用有關。"],
      ["調度中心", 75, 36, "動物細胞與植物細胞都具有哪一構造？", ["細胞壁", "葉綠體", "細胞膜", "大型中央液胞"], 2, "細胞膜存在於動物細胞及植物細胞。"],
      ["貨運列車", 37, 68, "植物細胞中，哪一種構造常用來儲存水分及其他物質？", ["液胞", "細胞核", "細胞膜", "粒線體"], 0, "液胞可儲存水分及其他物質。"],
      ["綠色貨箱", 68, 70, "葉肉細胞進行光合作用，主要與哪一構造有關？", ["粒線體", "細胞膜", "葉綠體", "細胞核"], 2, "葉綠體內的葉綠素可吸收光能。"],
      ["中央導航", 89, 55, "控制細胞多數生命活動的重要構造是？", ["液胞", "細胞核", "細胞壁", "葉綠體"], 1, "細胞核含遺傳物質，與生命活動控制有關。"]
    ]
  },
  {
    name: "細胞防衛系統失控",
    desc: "防衛基地的生物掃描器故障！透過細胞與顯微鏡的觀察知識，修正錯誤判讀。",
    reward: "防衛識別徽章",
    quota: { '易': 1, '中': 3, '難': 1 },
    items: [
      ["防護罩", 22, 48, "細胞膜可以幫助細胞做到什麼？", ["製造全部能量", "選擇性控制物質進出", "負責光合作用", "固定所有細胞形狀"], 1, "細胞膜是細胞與外界物質交換的關鍵。"],
      ["監控平台", 45, 30, "使用顯微鏡觀察標本時，應先使用哪一種倍率找尋影像？", ["高倍率", "低倍率", "任意倍率都一樣", "只用目鏡"], 1, "先使用低倍率，更容易找到觀察目標。"],
      ["警報主機", 68, 48, "當顯微鏡的總放大倍率增加，通常視野範圍會如何變化？", ["變大", "不變", "變小", "完全消失"], 2, "倍率越高，看到的視野範圍通常越小。"],
      ["辨識終端", 81, 72, "用顯微鏡觀察細胞，應把標本放在哪裡？", ["載物臺上", "目鏡上", "光源下面", "調節輪旁"], 0, "玻片標本放在載物臺上觀察。"],
      ["檢查通道", 33, 76, "下列哪一項是細胞學說的核心概念？", ["只有動物由細胞組成", "細胞是生物體構造與功能的基本單位", "細胞都能行光合作用", "細胞全部具有細胞壁"], 1, "細胞是生物體構造與功能的基本單位。"]
    ]
  },
  {
    name: "生命核心的最後危機",
    desc: "生命核心即將停止！結合前兩關的知識，重啟整座微觀城市。",
    reward: "生命核心認證",
    quota: { '易': 0, '中': 2, '難': 3 },
    items: [
      ["核心控制台", 49, 53, "一般植物與動物細胞中，含有主要遺傳物質且與控制生命活動有關的是？", ["細胞核", "細胞壁", "液胞", "細胞膜"], 0, "細胞核是細胞的重要控制中心。"],
      ["能量環", 28, 30, "細胞要維持生命活動，通常需要持續取得什麼？", ["只有光線", "能量", "只有泥土", "只有氧氣"], 1, "生命活動需要能量。"],
      ["修復臂", 72, 33, "成熟植物細胞通常比動物細胞多哪一構造？", ["細胞膜", "細胞質", "細胞壁", "細胞核"], 2, "植物細胞通常具有細胞壁。"],
      ["中央檔案", 26, 72, "下列哪一種構造可見於一般植物細胞，但一般動物細胞沒有？", ["粒線體", "葉綠體", "細胞膜", "細胞核"], 1, "葉綠體常見於能進行光合作用的綠色植物細胞，並非所有植物細胞都有葉綠體。"],
      ["最後開關", 79, 73, "要讓受損的細胞系統恢復，首先應做哪件事？", ["忽略異常", "觀察並找出問題原因", "隨意啟動全部裝置", "將所有構造當作相同"], 1, "先觀察、蒐集證據，再判斷與處理問題。"]
    ]
  }
];

// 深拷貝關卡模板
let levels = JSON.parse(JSON.stringify(DEFAULT_LEVELS));

// 葉可台詞
const dialogue = [
  ['哇！細胞城市比我想像的還塞！', '這條運輸線到底誰設計的啦？', '太棒了！交通節點修復完畢，接下來是防衛基地！'],
  ['防衛系統真的有點緊張……', '先看清楚，再做判斷！', '防衛解除！警報解除了，我的耳朵終於能放鬆了。'],
  ['生命核心好亮！我快看不清楚了！', '最後幾個故障點，拜託你啦！', '成功重啟！這一次真的不是我的功勞……大概！']
];

// 突發事件廣播彩蛋（不中斷學生作答）
const beats = [
  ['🚦 運輸危機突然升級！', '交通號誌變成紫色，快遞車全面停擺。葉可：「加油！還有其他故障節點要修！」'],
  ['🛡️ 系統正在重新掃描！', '防衛基地全區警報作響。葉可：「連我都被判定成可疑目標，檢查一定要更仔細！」'],
  ['⚡ 核心開始恢復光芒！', '中央控制台發出微弱光芒。葉可：「前面觀察沒有白費！再修復剩下節點就能回家！」']
];

// 3. 遊戲執行狀態
let stage = -1;
let solved = [new Set(), new Set(), new Set()];
let rewards = [];
let active = -1;
let remaining = 600;
let ticking = false;
let teacherPreview = false;
let modalOpen = false;
let wrongAttempts = {};
let previewTimerWasRunning = false;
let beatFired = [false, false, false];
let startTime = 0;
let totalElapsedSec = 0;

// 4. URL 參數與學生模式隔離
const PARAMS = new URLSearchParams(location.search);
const studentMode = PARAMS.get('student') === '1' || window.__ESCAPE_STUDENT_EXPORT__ === true;

if (studentMode) {
  document.body.classList.add('is-student-mode');
  ['teacherToggle', 'teacher', 'settings', 'quickStageChoices', 'teacherPreviewBtn', 'addTimeBtn'].forEach(id => {
    const el = $(id);
    if (el) el.style.setProperty('display', 'none', 'important');
  });
}

// 5. 計時器與模式變數
const clampMinutes = (v, fallback, max = 120) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= max ? Math.round(n) : fallback;
};

let timeMode = PARAMS.get('clock') === 'stage' || PARAMS.get('mode') === 'stage' ? 'stage' : 'total';
let totalMinutes = clampMinutes(PARAMS.get('total') || PARAMS.get('timer'), 10);
let stageMinutes = [4, 3, 3]; // 預設 4 / 3 / 3 分鐘，合計剛好 10 分鐘
if (PARAMS.has('times')) {
  const parts = PARAMS.get('times').split(',').map(Number);
  if (parts.length === 3 && parts.every(v => Number.isInteger(v) && v >= 1 && v <= 60)) {
    stageMinutes = parts;
  }
}
let timerOff = PARAMS.get('timer') === 'off' || PARAMS.get('notime') === '1';
let deadline = 0;
let sessionStarted = false;
let sessionEnded = false;

// 格式化時間
function fmt(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function updateClock() {
  if (timerOff) {
    $('timer').textContent = '⏱ 不限時';
    return;
  }
  if (!teacherPreview) {
    $('timer').textContent = '⏱ ' + fmt(Math.max(0, remaining));
    if (remaining <= 60 && remaining > 0) {
      $('timer').style.color = '#ff978c';
    } else {
      $('timer').style.color = '';
    }
  }
}

function beginClock(reset = false) {
  if (teacherPreview || stage < 0 || stage > 2 || sessionEnded || timerOff) {
    ticking = false;
    return;
  }
  if (timeMode === 'total') {
    if (!sessionStarted || reset) {
      deadline = Date.now() + totalMinutes * 60000;
      sessionStarted = true;
      startTime = Date.now();
    }
  } else {
    deadline = Date.now() + stageMinutes[stage] * 60000;
  }
  ticking = true;
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  updateClock();
}

// 老師加時功能（延長分鐘數）
function addMinutes(mins = 3) {
  if (timerOff || sessionEnded) return;
  const addedSec = mins * 60;
  deadline += addedSec * 1000;
  remaining += addedSec;
  ticking = true;
  updateClock();
  $('timeoutOverlay').classList.add('hidden');
  speak(`太好了！老師授權延長 ${mins} 分鐘，我們繼續加油！`);
}

// 倒數結束觸發超時
function finishTime() {
  if (sessionEnded || timerOff) return;
  ticking = false;
  remaining = 0;
  updateClock();
  
  const earnedBadges = rewards.length
    ? rewards.map(x => '🏅 ' + x).join('　')
    : '已完成的節點紀錄已保留';
  $('timeoutBadgesArea').textContent = earnedBadges;
  $('timeoutOverlay').classList.remove('hidden');
}

// 嚮導說話反饋
function speak(s) {
  const speech = $('speech');
  if (speech) speech.textContent = s;
  const img = $('yeko');
  if (img) {
    img.classList.remove('react');
    void img.offsetWidth;
    img.classList.add('react');
    setTimeout(() => img.classList.remove('react'), 400);
  }
}

// 切換背景圖
function setBg(n) {
  const bg = $('bg');
  if (!bg) return;
  const url = BG[n] || BG[0];
  bg.style.backgroundImage = `url("${url}")`;
}

// 觸發突發事件廣播橫幅
function showStoryBeat(k) {
  if (beatFired[k] || !beats[k]) return;
  beatFired[k] = true;
  const [title, desc] = beats[k];
  const banner = $('storyBeatBanner');
  const text = $('storyBeatText');
  if (banner && text) {
    text.textContent = `${title} ${desc}`;
    banner.classList.remove('hidden');
    banner.style.animation = 'none';
    void banner.offsetWidth;
    banner.style.animation = 'bannerPop 4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 4000);
  }
  speak(desc);
}

// 切換關卡
function changeStage(n, preview = false) {
  if (sessionEnded && !preview && n >= 0) return;
  closeModal();
  stage = n;
  teacherPreview = preview;
  wrongAttempts = {};
  solved = preview ? [new Set(), new Set(), new Set()] : solved;
  $('spots').innerHTML = '';
  $('home').classList.toggle('hidden', n !== -1);
  $('progress').classList.toggle('hidden', n === -1 || n === 3);
  $('hint').classList.toggle('hidden', n < 0 || n > 2);
  $('teacher').classList.add('hidden');
  
  if ($('stageHint')) {
    $('stageHint').textContent = preview
      ? '教師跳關預覽｜免作答、不計時、不累計獎章'
      : '先觀察微觀環境；線索會短暫閃爍，也可按「💡 線索」';
  }
  $('status').textContent = n === -1 ? '細胞世界大暴走' : n === 3 ? '完整通關' : `第 ${n + 1} 關`;
  setBg(n === -1 ? 0 : n === 3 ? 3 : n + 1);
  ticking = false;

  if (n < 0) {
    remaining = (timeMode === 'total' ? totalMinutes : stageMinutes[0]) * 60;
    updateClock();
    speak('準備好了嗎？微觀城市的命運就交給你了！');
    return;
  }
  if (n === 3) {
    showEnding();
    return;
  }
  if (preview) {
    $('timer').textContent = '⏱ 預覽模式';
  } else {
    beginClock();
  }
  $('stageTitle').textContent = `第 ${n + 1} 關｜${levels[n].name}`;
  $('stageDescription').textContent = levels[n].desc;
  renderSpots();
  speak(dialogue[n][0]);
}

// 渲染場景熱點
function renderSpots() {
  const lev = levels[stage];
  const spots = $('spots');
  spots.innerHTML = '';
  lev.items.forEach((q, i) => {
    const isSolved = solved[stage].has(i);
    const b = document.createElement('button');
    b.className = 'hotspot' + (isSolved ? ' solved' : '');
    b.style.setProperty('--spot-index', i);
    b.style.left = q[1] + '%';
    b.style.top = q[2] + '%';
    b.innerHTML = `${isSolved ? '✓' : '✦'}<span class="tip">${q[0]}</span>`;
    b.title = isSolved ? '已修復：' + q[0] : '探索線索：' + q[0];
    b.setAttribute('aria-label', (isSolved ? '已修復：' : '探索線索：') + q[0]);
    b.addEventListener('click', () => openQuestion(i));
    spots.appendChild(b);
  });
  $('count').textContent = `🔎 已修復 ${solved[stage].size} / ${lev.items.length} 個節點`;
  $('progressFill').style.width = (100 * solved[stage].size / lev.items.length) + '%';
  $('badges').textContent = '🏅 ' + (rewards.length ? rewards.join('・') : '尚未取得徽章');
}

// 彈窗管理
function showModal(html) {
  $('modal').innerHTML = html;
  $('overlay').classList.remove('hidden');
  modalOpen = true;
}
function closeModal() {
  $('overlay').classList.add('hidden');
  modalOpen = false;
  active = -1;
}

// 開啟題目
function openQuestion(i) {
  if (sessionEnded || stage < 0 || stage > 2) return;
  active = i;
  const q = levels[stage].items[i];
  if (solved[stage].has(i)) {
    showModal(`<h2>✅ ${q[0]}已修復</h2><p>${q[6]}</p><button class="btn primary" id="ok">返回場景</button>`);
    $('ok').onclick = closeModal;
    return;
  }
  const html = `
    <div class="subtitleline">探索節點 ${i + 1} / ${levels[stage].items.length}</div>
    <h2>🔎 ${q[0]}</h2>
    <p style="font-size:1.15rem;font-weight:700;line-height:1.6">${q[3]}</p>
    <div id="choices">` +
      q[4].map((c, k) => `<button class="choice" data-option="${k}"><b>${'ABCD'[k]}</b>　${c}</button>`).join('') +
    `</div>
    <div id="feedback"></div>
    <button class="btn" id="back">暫時返回探索</button>
  `;
  showModal(html);
  $('back').onclick = closeModal;
  document.querySelectorAll('[data-option]').forEach(b => {
    b.onclick = () => answer(i, Number(b.dataset.option));
  });
}

// 作答邏輯
function answer(i, ans) {
  const q = levels[stage].items[i];
  const key = stage + '-' + i;
  if (solved[stage].has(i)) return;

  if (ans !== q[5]) {
    wrongAttempts[key] = (wrongAttempts[key] || 0) + 1;
    const b = document.querySelector(`[data-option="${ans}"]`);
    if (b) {
      b.classList.add('wrong');
      b.disabled = true;
    }
    const clue = wrongAttempts[key] >= 2
      ? '｜提示：' + q[6].replace(/。$/, '') + '。'
      : '｜先排除不符合特徵的選項，再試一次。';
    $('feedback').textContent = '葉可：這次沒成功，但沒關係！' + clue;
    speak(wrongAttempts[key] >= 2 ? '我們換個角度，看看題目的關鍵詞！' : '再觀察一次，我陪你找！');
    return;
  }

  // 答對
  solved[stage].add(i);
  document.querySelectorAll('[data-option]').forEach(b => {
    b.disabled = true;
    if (Number(b.dataset.option) === ans) b.classList.add('correct');
  });
  $('feedback').textContent = '✅ 修復成功！' + q[6];
  $('back').textContent = '繼續探索 →';
  $('back').classList.add('primary');
  $('back').onclick = () => {
    closeModal();
    renderSpots();
    if (solved[stage].size === levels[stage].items.length) {
      levelComplete();
    } else if (solved[stage].size === Math.ceil(levels[stage].items.length / 2)) {
      showStoryBeat(stage);
    } else {
      speak(dialogue[stage][1]);
    }
  };
}

// 關卡獎狀 HTML
function certificateHtml(k, preview = false) {
  const l = levels[k];
  return `
    <div class="certificate">
      <div class="seal">🏅</div>
      <div class="cert-title">微觀世界通關獎狀</div>
      <div class="cert-level">第 ${k + 1} 關｜${l.name}</div>
      <div class="cert-name">${l.reward}</div>
      <p style="font-size:1.05rem;line-height:1.6">成功破解生物謎題，完成本關細胞修復任務！</p>
      <div class="cert-foot">${preview ? '教師預覽樣張｜不代表學生實際通關' : '微觀特攻隊 · 任務完成認證'}</div>
    </div>
  `;
}

function previewCertificate(k) {
  previewTimerWasRunning = ticking;
  ticking = false;
  showModal(certificateHtml(k, true) + `
    <div style="margin-top:14px;text-align:center">
      <button class="btn primary" id="certClose">返回教師預覽</button>
    </div>
  `);
  $('certClose').onclick = () => {
    closeModal();
    ticking = previewTimerWasRunning;
    $('teacher').classList.remove('hidden');
  };
}

// 關卡通關
function levelComplete() {
  if (sessionEnded) return;
  if (timeMode === 'stage') ticking = false;
  const name = levels[stage].reward;
  if (!teacherPreview && !rewards.includes(name)) rewards.push(name);
  const next = stage + 1;
  showModal(certificateHtml(stage, teacherPreview) + `
    <p style="margin-top:12px">葉可：${dialogue[stage][2]}</p>
    <div style="text-align:center;margin-top:16px">
      <button id="nextBtn" class="btn primary" style="font-size:1.15rem;padding:12px 28px">
        ${stage === 2 ? '🏆 查看最終通關成就' : '▶ 前往下一關挑戰'}
      </button>
    </div>
  `);
  $('nextBtn').onclick = () => {
    if (!teacherPreview && !timerOff && timeMode === 'total' && Date.now() >= deadline) {
      finishTime();
      return;
    }
    changeStage(next, teacherPreview);
  };
}

// 最終結算畫面（學生成果與繳交指引）
function showEnding() {
  speak('我們成功啦！你才是這次真正的微觀特攻隊隊長！');
  const elapsedSec = Math.max(0, Math.floor((Date.now() - (startTime || Date.now())) / 1000));
  const timeStr = fmt(elapsedSec);
  const totalSolved = solved.reduce((acc, s) => acc + s.size, 0);

  const html = `
    <div class="subtitleline">MICROVERSE ESCAPE · COMPLETE</div>
    <div style="font-size:3.5rem;text-align:center;line-height:1;margin:10px 0">🏆</div>
    <h2 style="text-align:center;color:#38bdf8">🎉 生命核心重啟成功！</h2>
    <p style="text-align:center;font-size:1.1rem;color:#e0f2fe;line-height:1.7">
      三道危機完全解除！細胞交通恢復順暢、防衛基地重新識別，生命核心再次綻放璀璨光芒。
    </p>
    <div style="background:rgba(2,132,199,0.18);border:1.5px solid #38bdf8;border-radius:12px;padding:12px;margin:12px 0;text-align:center">
      <div style="color:#7dd3fc;font-weight:800;font-size:1rem;margin-bottom:6px">🏅 獲得榮譽認證：</div>
      <div style="font-size:1.15rem;color:#fef08a;font-weight:900">
        ${rewards.length ? rewards.join('　|　') : '教師全關卡瀏覽樣張'}
      </div>
      <div style="color:#94a3b8;font-size:0.9rem;margin-top:6px">
        修復節點：${totalSolved} / 16　｜　總歷時：${timeStr}
      </div>
    </div>

    <!-- 學生繳交引導卡 -->
    <div class="nextStepCard">
      <div style="font-weight:800;font-size:1.05rem;color:#fbbf24;margin-bottom:6px">📸 挑戰達成！下一步處置方式：</div>
      <div style="font-size:0.92rem;line-height:1.6;color:#f1f5f9">
        1. 請直接<strong>「螢幕截圖」</strong>此成績畫面作為過關憑證。<br>
        2. 點擊下方<strong>「📋 複製探險紀錄」</strong>，將文字戰報貼至 Google Classroom 繳交！
      </div>
    </div>

    <div class="buttons" style="justify-content:center;gap:12px;margin-top:16px;flex-wrap:wrap">
      <button id="submitGasScoreBtn" class="primary" style="background:linear-gradient(135deg, #0284c7, #0369a1);font-size:1.05rem;padding:12px 24px;color:white;font-weight:bold;cursor:pointer;">🚀 查看結算與交卷檢核</button>
      <button id="copyResultBtn" class="goldBtn" style="font-size:1.05rem;padding:12px 24px">📋 複製探險紀錄 (斷網備用)</button>
      <button id="again" class="btn">↻ 返回首頁</button>
    </div>
  `;
  showModal(html);

  $('submitGasScoreBtn').onclick = () => {
    if (typeof showScoreSubmitModal === 'function') {
      showScoreSubmitModal({
        gameTitle: '微觀科幻探秘・密室逃脫',
        score: Math.round((totalSolved / 16) * 100),
        scoreDisplay: `${totalSolved} / 16 節點修復`,
        duration: timeStr
      });
    }
  };

  $('again').onclick = () => {
    solved = [new Set(), new Set(), new Set()];
    rewards = [];
    sessionStarted = false;
    sessionEnded = false;
    beatFired = [false, false, false];
    changeStage(-1);
  };

  $('copyResultBtn').onclick = async () => {
    const text = `🔬 微觀特攻隊：細胞世界大暴走｜探險戰報\n` +
      `🏅 榮譽認證：${rewards.join('、') || '微觀世界守護者'}\n` +
      `✅ 修復節點：${totalSolved} / 16\n` +
      `⏱️ 探索歷時：${timeStr}\n` +
      `🎉 任務圓滿達成，特此證明！`;
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
    $('copyNoticeOverlay').classList.remove('hidden');
  };
}

// 6. 題庫標準化與 6 / 5 / 5 智能難度分關演算法
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
  const difficulty = (diffStr.includes('易') || diffStr.includes('簡單') || diffStr === '1') ? '易'
    : (diffStr.includes('難') || diffStr === '3') ? '難' : '中';

  return {
    id: q.id || 'micro-' + Math.random().toString(36).substring(2, 7),
    question: q.question.trim(),
    options: q.options.map(o => String(o).trim()),
    answer: ans,
    difficulty,
    explanation: q.explanation || '正確解答為：' + q.options[ans]
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

  // 分組難度
  const groups = { '易': [], '中': [], '難': [] };
  const shuffled = safePool.slice().sort(() => Math.random() - 0.5);
  shuffled.forEach(q => {
    groups[q.difficulty].push(q);
  });

  // 依關卡模板與配額派題 (Stage 0: 6題, Stage 1: 5題, Stage 2: 5題)
  const newLevels = JSON.parse(JSON.stringify(DEFAULT_LEVELS));
  newLevels.forEach((lvl, stageIdx) => {
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

    // 注入題目到關卡各節點
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

// 7. 連線全平台題庫清單 (manifest.json)
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
    select.innerHTML = '<option value="demo">✨ 微觀細胞世界示範題庫 (16 題原生試題)</option>';

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

    // 若 URL 指定單元，自動選中並加載
    const targetUnit = PARAMS.get('unit');
    if (targetUnit) {
      select.value = targetUnit;
      await switchUnit(targetUnit);
    } else {
      $('loadInfo').textContent = '✅ 已成功連線全平台題庫；當前採用「微觀細胞世界示範題庫 (16 題)」。';
    }
  } catch (err) {
    console.warn('連線 manifest.json 失敗，保持示範題庫:', err);
    $('loadInfo').textContent = '展示模式：使用內建 16 題微觀生物試題。';
  }
}

// 切換連線題庫單元
async function switchUnit(unitPath) {
  const badge = $('unitLoadedBadge');
  const info = $('loadInfo');
  if (unitPath === 'demo' || !unitPath) {
    levels = JSON.parse(JSON.stringify(DEFAULT_LEVELS));
    if (badge) badge.textContent = '✅ 當前題庫：微觀細胞世界示範題庫 (16 題)';
    if (info) info.textContent = '展示模式：使用內建 16 題微觀生物試題。';
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

// 8. 學生派卷 QR Code 與網址生成器
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
  const devMode = $('deviceMode')?.value || 'solo';
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
  if (devMode) qp.set('mode', devMode);

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
        colorDark: '#041c2c',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      rendered = true;
    } catch (e) {
      console.warn('QRCode render fallback:', e);
    }
  }
  if (!rendered) {
    qrBox.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(finalUrl)}" alt="派發 QR Code" style="width:180px;height:180px;border-radius:8px">`;
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

// 9. 事件綁定與初始化
function init() {
  // 設定時間 UI 聯動
  const timeModeSelect = $('timeModeSelect');
  const totalMinLabel = $('totalMinutesLabel');
  const stageTimesRow = $('stageTimesRow');
  const noTimeCheck = $('noTimeCheck');

  function syncTimerUI() {
    const isStage = timeModeSelect?.value === 'stage';
    if (stageTimesRow) stageTimesRow.style.display = isStage ? 'flex' : 'none';
    if (totalMinLabel) totalMinLabel.style.display = isStage ? 'none' : 'inline-flex';
    const isNoTime = noTimeCheck?.checked;
    if ($('introDuration')) {
      $('introDuration').textContent = isNoTime ? '特教友善模式（不限時）' : isStage ? '各關獨立倒數' : `挑戰時間：全場 ${$('totalMinutesInput')?.value || 10} 分鐘`;
    }
  }

  timeModeSelect?.addEventListener('change', () => {
    timeMode = timeModeSelect.value;
    syncTimerUI();
  });
  $('totalMinutesInput')?.addEventListener('change', syncTimerUI);
  noTimeCheck?.addEventListener('change', () => {
    timerOff = noTimeCheck.checked;
    syncTimerUI();
  });

  // 按鈕事件
  $('start').onclick = () => {
    solved = [new Set(), new Set(), new Set()];
    rewards = [];
    sessionStarted = false;
    sessionEnded = false;
    beatFired = [false, false, false];
    changeStage(0);
  };

  $('story').onclick = () => {
    showModal(`
      <div class="subtitleline">MICROVERSE STORY</div>
      <h2>📖 故事背景</h2>
      <p>校園中一臺未知的縮小裝置突然啟動！當你睜開眼睛，眼前已是一座由微觀生命組成的科幻城市。只有解除三道異常，才能啟動傳送裝置回到正常世界。</p>
      <p>你將和原創生物夥伴「葉可」一同探索，觀察發光節點、破解生物謎題，逐步恢復城市運作！</p>
      <div style="text-align:center;margin-top:16px">
        <button class="btn primary" id="storyOk">我知道了，準備挑戰</button>
      </div>
    `);
    $('storyOk').onclick = closeModal;
  };

  $('teacherToggle').onclick = () => {
    if (studentMode) return;
    $('teacher').classList.toggle('hidden');
  };
  $('closeTeacher').onclick = () => $('teacher').classList.add('hidden');

  $('teacherPreviewBtn')?.addEventListener('click', () => {
    changeStage(0, true);
  });

  document.querySelectorAll('[data-jump]').forEach(b => {
    b.onclick = () => {
      if (!studentMode) changeStage(Number(b.dataset.jump), true);
    };
  });

  document.querySelectorAll('[data-award]').forEach(b => {
    b.onclick = () => {
      if (!studentMode) previewCertificate(Number(b.dataset.award));
    };
  });

  $('restart').onclick = () => {
    if (stage >= 0 && stage < 3 && !teacherPreview) {
      sessionEnded = false;
      beginClock(true);
    } else {
      $('timer').textContent = '⏱ 預覽模式';
    }
    $('teacher').classList.add('hidden');
  };

  $('hint').onclick = () => {
    if (stage < 0 || stage > 2) return;
    const idx = levels[stage].items.findIndex((_, i) => !solved[stage].has(i));
    if (idx < 0) {
      speak('太厲害了！本關所有節點都已完成修復！');
      return;
    }
    const q = levels[stage].items[idx];
    speak(`試著在場景中尋找「${q[0]}」附近的微弱青色探索點！`);
    const spots = document.querySelectorAll('.hotspot');
    if (spots[idx]) {
      spots[idx].classList.add('pulse');
      setTimeout(() => spots[idx]?.classList.remove('pulse'), 2800);
    }
  };

  // 老師加時按鈕
  $('addTimeBtn')?.addEventListener('click', () => addMinutes(3));
  $('extend3MinBtn')?.addEventListener('click', () => addMinutes(3));
  $('extend5MinBtn')?.addEventListener('click', () => addMinutes(5));
  $('finishNowBtn')?.addEventListener('click', () => {
    $('timeoutOverlay').classList.add('hidden');
    sessionEnded = true;
    showEnding();
  });

  $('closeCopyNotice')?.addEventListener('click', () => {
    $('copyNoticeOverlay').classList.add('hidden');
  });

  $('generateStudentQRBtn')?.addEventListener('click', generateStudentQR);
  $('copyStudentUrlBtn')?.addEventListener('click', copyStudentUrl);
  $('testStudentLaunchLink')?.addEventListener('click', e => {
    e.preventDefault();
    generateStudentQR();
    const url = $('studentUrlInput')?.value;
    if (!url) return;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      const go = confirm('偵測到瀏覽器攔截了自動彈出分頁！\n\n是否直接在當前視窗開啟學生版挑戰？\n（按「確定」前往學生版，按「取消」手動複製網址）');
      if (go) window.location.href = url;
    }
  });
  $('unitSelect')?.addEventListener('change', e => switchUnit(e.target.value));

  // 計時主迴圈 (每 250ms 更新)
  setInterval(() => {
    if (!ticking || teacherPreview || sessionEnded || stage < 0 || stage > 2 || timerOff) return;
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    updateClock();
    if (remaining <= 0) finishTime();
  }, 250);

  // 啟用小葉自由拖曳功能
  initDraggableGuide();

  // 初始化題庫清單與首頁狀態
  syncTimerUI();
  loadManifestAndPopulateSelect();
  changeStage(-1);
}

// 拖曳小葉 (嚮導) 功能：滑鼠與觸控通用
function initDraggableGuide() {
  const guide = $('guide');
  if (!guide) return;

  let isDragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  guide.addEventListener('pointerdown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    if (e.button && e.button !== 0) return;

    isDragging = true;
    guide.classList.add('dragging');
    try { guide.setPointerCapture(e.pointerId); } catch (_) {}

    const rect = guide.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    guide.style.position = 'fixed';
    guide.style.bottom = 'auto';
    guide.style.right = 'auto';
    guide.style.left = startLeft + 'px';
    guide.style.top = startTop + 'px';
  });

  guide.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    const pad = 10;
    const maxLeft = window.innerWidth - guide.offsetWidth - pad;
    const maxTop = window.innerHeight - guide.offsetHeight - pad;

    newLeft = Math.max(pad, Math.min(maxLeft, newLeft));
    newTop = Math.max(pad, Math.min(maxTop, newTop));

    guide.style.left = newLeft + 'px';
    guide.style.top = newTop + 'px';
  });

  const stopDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    guide.classList.remove('dragging');
    try { guide.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  guide.addEventListener('pointerup', stopDrag);
  guide.addEventListener('pointercancel', stopDrag);

  // 點擊說話泡泡可縮小/展開
  const speech = $('speech');
  if (speech) {
    speech.title = '點擊可暫時收合/展開對話泡泡';
    speech.style.cursor = 'pointer';
    speech.addEventListener('click', (e) => {
      if (Math.abs(e.clientX - startX) > 6 || Math.abs(e.clientY - startY) > 6) return;
      speech.classList.toggle('collapsed');
    });
  }
}

// 啟動
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ⭐ 密室逃脫共用題庫適配器 Hook
window.startGame = function() {
  $('home')?.classList.add('hidden');
  changeStage(0);
};

window.__ESCAPE_HOOK__ = {
  type: 'micro',
  get levels() { return levels; },
  set levels(val) { levels = val; }
};
