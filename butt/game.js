// --- Web Audio 擬真音效引擎 ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function unlockAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 點擊與觸控解鎖全頁音效
window.addEventListener('click', unlockAudio, { once: true });
window.addEventListener('touchstart', unlockAudio, { once: true });

function playSound(type) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'hit') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'wrong') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.25);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'win') {
    // 勝利歡呼聲
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + i * 0.1);
      g.gain.setValueAtTime(0.3, now + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.25);
      o.start(now + i * 0.1);
      o.stop(now + i * 0.1 + 0.25);
    });
  } else if (type === 'gameover') {
    // 挑戰失敗音
    const notes = [300, 260, 220, 180];
    notes.forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, now + i * 0.15);
      g.gain.setValueAtTime(0.4, now + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.2);
      o.start(now + i * 0.15);
      o.stop(now + i * 0.15 + 0.2);
    });
  }
}

// --- 備用題庫（網路異常離線保護）---
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
let questionPool = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let isLocked = false;
let selectedCount = 10;
let selectedUnitId = 'all';
let startTime = 0;
let totalTimeSec = 0;
let studentProfile = { className: '701', seat: '01', name: '' };
let currentCertCode = '';

// --- 初始化載入 ---
window.onload = async function() {
  loadSavedProfile();
  await loadManifestAndUnits();
  checkUrlParams();
  setupKeyboardHotkeys();
};

// 載入預存學生個人資料
function loadSavedProfile() {
  try {
    const saved = localStorage.getItem('butt_student_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.className) document.getElementById('inputClass').value = parsed.className;
      if (parsed.seat) document.getElementById('inputSeat').value = parsed.seat;
      if (parsed.name) document.getElementById('inputName').value = parsed.name;
    }
  } catch (e) {
    console.warn("讀取個人資料失敗", e);
  }
}

// 儲存個人資料
function saveProfile(className, seat, name) {
  try {
    localStorage.setItem('butt_student_profile', JSON.stringify({ className, seat, name }));
  } catch (e) {}
}

// 動態讀取題庫 Manifest
async function loadManifestAndUnits() {
  const select = document.getElementById('unitSelect');
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
  } else {
    console.warn("無法取得 manifest.json，使用預設單元選項");
  }
}

// 檢查 URL 參數 (教師指派模式)
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramBank = urlParams.get('bank');
  const paramUnit = urlParams.get('unit');
  const paramCount = urlParams.get('count');
  const paramClass = urlParams.get('class');
  const paramSeat = urlParams.get('seat');
  const paramName = urlParams.get('name');

  if (paramClass) document.getElementById('inputClass').value = paramClass;
  if (paramSeat) document.getElementById('inputSeat').value = paramSeat;
  if (paramName) document.getElementById('inputName').value = paramName;

  if (paramUnit) {
    document.getElementById('unitSelect').value = paramUnit;
    selectedUnitId = paramUnit;
  }

  if (paramCount) {
    selectedCount = paramCount === 'all' ? 'all' : parseInt(paramCount, 10);
    document.getElementById('countSelectorGroup').style.display = 'none';
    const tip = document.getElementById('teacherPresetTip');
    tip.textContent = `✨ 老師已指定本次測驗：${paramCount === 'all' ? '全部題目' : paramCount + ' 題'}`;
    tip.style.display = 'inline-block';
  }
}

// 設置鍵盤快捷鍵 A, B, C, D / 1, 2, 3, 4
function setupKeyboardHotkeys() {
  window.addEventListener('keydown', (e) => {
    // 若正在輸入文字則忽略
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    const key = e.key.toUpperCase();
    if (key === 'A' || key === '1') handleSelect(0);
    else if (key === 'B' || key === '2') handleSelect(1);
    else if (key === 'C' || key === '3') handleSelect(2);
    else if (key === 'D' || key === '4') handleSelect(3);
    else if (key === 'ENTER' || key === ' ') {
      // 彈窗開啟時按 Enter/Space 繼續
      const fbModal = document.getElementById('feedbackModal');
      if (fbModal && fbModal.style.display === 'flex') {
        nextQuestion();
      }
    }
  });
}

// 學生選擇題數
function setQuestionCount(count) {
  selectedCount = count;
  document.querySelectorAll('.btn-count').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.count === String(count));
  });
}

// 載入指定單元題目
async function fetchQuestionsForUnit(unitId) {
  let loadedQuestions = [];
  const basePathCandidates = ['../questions/', 'questions/'];

  if (unitId === 'all') {
    // 載入所有單元
    if (manifestUnits.length > 0) {
      for (const unit of manifestUnits) {
        for (const basePath of basePathCandidates) {
          try {
            const res = await fetch(basePath + unit.file);
            if (res.ok) {
              const data = await res.json();
              loadedQuestions.push(...data);
              break;
            }
          } catch (e) {}
        }
      }
    }
  } else {
    // 載入單一單元
    const targetUnit = manifestUnits.find(u => u.id === unitId);
    const fileName = targetUnit ? targetUnit.file : `unit_${unitId}.json`;
    for (const basePath of basePathCandidates) {
      try {
        const res = await fetch(basePath + fileName);
        if (res.ok) {
          loadedQuestions = await res.json();
          break;
        }
      } catch (e) {}
    }
  }

  return loadedQuestions.length > 0 ? loadedQuestions : fallbackBank;
}

// 驗證學生表單
function validateStudentProfile() {
  const className = document.getElementById('inputClass').value.trim();
  let seat = document.getElementById('inputSeat').value.trim();
  const name = document.getElementById('inputName').value.trim();
  const tip = document.getElementById('profileErrorTip');

  // 座號自動補零 (例如 '5' -> '05')
  if (/^\d{1}$/.test(seat)) {
    seat = '0' + seat;
    document.getElementById('inputSeat').value = seat;
  }

  // 嚴格驗證：座號必須雙位數 (01~99)，姓名需滿 2 個字
  if (!className || !/^\d{2}$/.test(seat) || name.length < 2) {
    tip.style.display = 'block';
    return null;
  }

  tip.style.display = 'none';
  studentProfile = { className, seat, name };
  saveProfile(className, seat, name);
  return studentProfile;
}

// 開始遊戲
async function startGame() {
  unlockAudio();

  const profile = validateStudentProfile();
  if (!profile) return;

  selectedUnitId = document.getElementById('unitSelect').value;

  // 顯示載入狀態
  const startBtn = document.querySelector('.btn-start');
  startBtn.textContent = '題庫載入中... ⏳';
  startBtn.disabled = true;

  rawBank = await fetchQuestionsForUnit(selectedUnitId);

  startBtn.textContent = '開始挑戰 🔨';
  startBtn.disabled = false;

  // 隨機洗牌
  const shuffled = [...rawBank].sort(() => Math.random() - 0.5);

  if (selectedCount === 'all' || selectedCount >= shuffled.length) {
    questionPool = shuffled;
  } else {
    questionPool = shuffled.slice(0, selectedCount);
  }

  currentIndex = 0;
  score = 0;
  lives = 3;
  isLocked = false;
  startTime = Date.now();

  // 更新單元標籤名稱
  const unitSelectObj = document.getElementById('unitSelect');
  const unitTitle = unitSelectObj.options[unitSelectObj.selectedIndex].text;
  document.getElementById('unitBadge').textContent = `單元：${unitTitle.split('：')[1] || unitTitle.split(' ')[0]}`;

  document.getElementById('startScreen').style.display = 'none';
  renderQuestion();
}

// 渲染當前題目
function renderQuestion() {
  if (currentIndex >= questionPool.length || lives <= 0) {
    endGame();
    return;
  }

  const q = questionPool[currentIndex];
  document.getElementById('questionText').textContent = `${currentIndex + 1}. ${q.question}`;
  document.getElementById('progressBadge').textContent = `題號：${currentIndex + 1} / ${questionPool.length}`;
  document.getElementById('scoreBadge').textContent = `得分：${score}`;
  document.getElementById('heartDisplay').textContent = "❤️".repeat(Math.max(0, lives));

  for (let i = 0; i < 4; i++) {
    const shin = document.getElementById(`shin-${i}`);
    const btn = document.getElementById(`opt-${i}`);
    shin.className = 'shinchan shaking';
    btn.querySelector('.opt-text').textContent = q.options[i] || '—';
    btn.disabled = false;
  }
  isLocked = false;
}

// 選擇答案判定
function handleSelect(selectedIndex) {
  if (isLocked) return;

  const q = questionPool[currentIndex];
  let correctIndex = -1;

  if (typeof q.answer === 'number') {
    correctIndex = q.answer;
  } else if (typeof q.answer === 'string') {
    const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    correctIndex = map[q.answer.trim().toUpperCase()] ?? -1;
  }

  const targetShin = document.getElementById(`shin-${selectedIndex}`);

  if (selectedIndex === correctIndex) {
    playSound('hit');
    targetShin.className = 'shinchan hit';
    score += 10;
    isLocked = true;
    setTimeout(() => {
      currentIndex++;
      renderQuestion();
    }, 600);
  } else {
    playSound('wrong');
    lives--;
    isLocked = true;
    document.getElementById('heartDisplay').textContent = "❤️".repeat(Math.max(0, lives));

    if (lives <= 0) {
      setTimeout(() => {
        endGame();
      }, 500);
      return;
    }

    // 顯示反饋教學
    document.getElementById('modalTitle').innerHTML = "<span style='color:#E63946;'>哎呀！敲錯了！</span>";
    document.getElementById('modalExplain').innerHTML = `
      <strong>正確答案：</strong> (${['A','B','C','D'][correctIndex]}) ${q.options[correctIndex]}<br><br>
      <strong>觀念解析：</strong> ${q.explanation || '請記住本題觀念，繼續加油！'}
    `;
    const actionBtn = document.getElementById('modalActionBtn');
    actionBtn.textContent = "我看懂了 ➜";
    actionBtn.onclick = nextQuestion;
    document.getElementById('feedbackModal').style.display = 'flex';
  }
}

function nextQuestion() {
  document.getElementById('feedbackModal').style.display = 'none';
  currentIndex++;
  renderQuestion();
}

// 生成隨機 6 位防偽碼
function generateCertCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BUTT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 結算與防偽證書生成
function endGame() {
  totalTimeSec = Math.round((Date.now() - startTime) / 1000);
  currentCertCode = generateCertCode();

  const isWin = lives > 0;
  if (isWin) playSound('win');
  else playSound('gameover');

  const unitSelectObj = document.getElementById('unitSelect');
  const unitTitle = unitSelectObj.options[unitSelectObj.selectedIndex].text;
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  document.getElementById('certIdDisplay').textContent = `驗證碼：${currentCertCode}`;
  document.getElementById('certStudentInfo').textContent = `${studentProfile.className} 班 ${studentProfile.seat} 號 ${studentProfile.name}`;
  document.getElementById('certUnitInfo').textContent = unitTitle;
  document.getElementById('certScoreDisplay').textContent = `${score} 分 (${isWin ? '成功通關' : '挑戰中斷'})`;
  document.getElementById('certLivesDisplay').textContent = `${"❤️".repeat(Math.max(0, lives))} (${lives}/3)`;
  document.getElementById('certTimeDisplay').textContent = `${totalTimeSec} 秒`;
  document.getElementById('certTimestampDisplay').textContent = dateStr;

  document.getElementById('certModal').style.display = 'flex';
}

// 複製成績單驗證文字至剪貼簿
function copyCertToClipboard() {
  const unitSelectObj = document.getElementById('unitSelect');
  const unitTitle = unitSelectObj.options[unitSelectObj.selectedIndex].text;

  const copyText = `【屁屁星人敲敲樂】成績單驗證碼：${currentCertCode} | 班級座號：${studentProfile.className}班${studentProfile.seat}號 | 姓名：${studentProfile.name} | 挑戰單元：${unitTitle} | 最終得分：${score}分 | 剩餘生命：${lives}顆心 | 費時：${totalTimeSec}秒`;

  navigator.clipboard.writeText(copyText).then(() => {
    const btn = document.getElementById('btnCopyCert');
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

// 重設回到開始畫面
function resetToStart() {
  document.getElementById('certModal').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
}
