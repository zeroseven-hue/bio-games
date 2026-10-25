/**
 * 現代校園：生物密室逃脫 (Escape-School)
 * 核心功能：
 * 1. 16 道標準試題 (6 / 5 / 5 分層遞進) + 連線全平台動態題庫 (manifest.json, 94 單元 5,269+ 題)
 * 2. 獨立靜態圖檔載入 (assets/scene0.webp ~ scene3.webp, assets/aywai.png)
 * 3. 教師預覽派卷 vs 學生自主挑戰 (?student=1 防作弊隔離)
 * 4. 倒數計時系統 (預設全場 10 分鐘或 6/4/4 分關模式) + 教師加時權限 (➕ 延長3分鐘 / 超時彈窗)
 * 5. 可拖曳阿歪 AI 吉祥物 (PointerEvents) + 互動對話與提示
 * 6. 階段機關：Stage 2 實驗室滲透配對 + Stage 3 阿歪探究記憶排序
 * 7. 階段認證徽章 + Google Classroom 探險成果戰報複製
 */

(() => {
  'use strict';

  // 1. 場景背景與吉祥物資源路徑
  const SCENES = [
    'assets/scene0.webp',
    'assets/scene1.webp',
    'assets/scene2.webp',
    'assets/scene3.webp'
  ];
  const MASCOT_SRC = 'assets/aywai.png';

  // 2. 原生 16 道校園謎題 (依 108 課綱生物專業審定，6 / 5 / 5 分佈)
  const DEFAULT_STAGES = [
    {
      title: '放學後的異常教室',
      short: '異常教室',
      subtitle: '黑板在講話？窗外那坨東西還在跟我眨眼！',
      quota: { '易': 3, '中': 2, '難': 1 },
      items: [
        [
          '窗外怪影', 8, 27, 21, 40,
          '生物能對光線產生反應，這種現象最能說明哪項生命現象？',
          ['感應並回應環境刺激', '所有生物都會行光合作用', '所有生物都會飛', '生物不需要消耗能量'],
          0,
          '生物能感應外界環境刺激（如光線、溫度、聲音）並做出適當反應，這是維持生存的重要生命現象。',
          '易'
        ],
        [
          '黑板細胞圖', 55, 23, 27, 28,
          '植物細胞和動物細胞通常都具有下列哪個細胞構造？',
          ['細胞壁', '葉綠體', '細胞膜', '大型中央液胞'],
          2,
          '動植物細胞均具有細胞膜、細胞質、細胞核與粒線體；而細胞壁與葉綠體通常為植物細胞所特有。',
          '易'
        ],
        [
          '生物課本', 6, 71, 28, 18,
          '使用複式顯微鏡觀察玻片標本時，初次尋找觀察目標通常應先選用何種物鏡？',
          ['高倍物鏡', '低倍物鏡', '拆掉物鏡', '任意倍率皆相同'],
          1,
          '低倍物鏡視野較廣闊、明亮且景深較深，較容易快速搜尋並找到觀察標本的位置。',
          '易'
        ],
        [
          '書包與課桌', 34, 62, 19, 25,
          '細胞中主要負責進行呼吸作用、分解有機養分以釋放能量的構造是？',
          ['粒線體', '細胞壁', '葉綠體', '液胞'],
          0,
          '粒線體被稱為「細胞的能量工廠」，可進行呼吸作用消耗氧氣分解養分，產生生物活動所需的能量。',
          '中'
        ],
        [
          '水族箱', 86, 72, 13, 26,
          '水族箱內的水草在光照充足時，藉由光合作用會吸收何種氣體並釋放何種氣體？',
          ['吸收二氧化碳，釋放氧氣', '吸收氧氣，釋放二氧化碳', '吸收氮氣，釋放氫氣', '不會吸收任何氣體'],
          0,
          '綠色植物行光合作用時，利用光能將水與吸收的二氧化碳轉化為葡萄糖與氧氣。',
          '中'
        ],
        [
          '教師桌上的筆記', 44, 49, 16, 17,
          '若要探究「光照強弱對綠豆發芽生長的影響」，在實驗設計中最關鍵的原則為何？',
          ['僅改變光照強弱，其餘水分、溫度等變因保持相同', '同時改變水分供給量與光照強度', '實驗組與對照組使用不同品種的植物種子', '隨意擺放且不需設置對照組'],
          0,
          '控制變因法要求實驗時「操作變因」只能有一個（光照），其餘條件（控制變因）必須嚴格保持一致，才能確認實驗結果的歸因。',
          '難'
        ]
      ]
    },
    {
      title: '失控的生物實驗室',
      short: '生物實驗室',
      subtitle: '培養皿在發光，阿歪說它只是「比較有活力」。',
      quota: { '易': 2, '中': 2, '難': 1 },
      items: [
        [
          '顯微鏡', 1, 43, 19, 35,
          '顯微鏡目鏡標示為 10X、物鏡標示為 40X，若將物鏡由 10X 切換至 40X，視野會產生何種變化？',
          ['總放大倍率為 400X，視野變暗且範圍變小', '總放大倍率為 50X，視野變亮且範圍變大', '總放大倍率為 400X，視野變亮且細胞數目變多', '總放大倍率不變，僅顏色加深'],
          0,
          '總放大倍率＝目鏡倍率×物鏡倍率（10×40=400倍）。當換至高倍鏡時，視野明亮度降低、視野範圍變小，看到的細胞數目變少但影像變大。',
          '易'
        ],
        [
          '試管架', 3, 66, 20, 29,
          '將人體紅血球放入純水中，紅血球會膨脹甚至破裂，此現象主要是水分子透過何種作用進出細胞膜？',
          ['滲透作用（水分子擴散）', '主動進食作用', '光合作用', '蒸散作用'],
          0,
          '水分子經由細胞膜自水濃度高處向水濃度低處的擴散稱為滲透作用。動物細胞無細胞壁保護，在低張溶液中吸水過多會脹破。',
          '中'
        ],
        [
          '標本櫃', 57, 20, 25, 43,
          '關於多細胞生物的層次結構，下列哪一項組合「完全正確」且指出了植物與動物體結構的主要差異？',
          ['植物體通常缺乏「器官系統」層次，動物體則有器官系統', '植物體具有器官系統，動物體沒有組織層次', '植物體的葉片屬於「組織」，花屬於「器官系統」', '動植物兩者都具有完全相同之五大結構層次'],
          0,
          '動物組成層次為：細胞→組織→器官→器官系統→個體；植物通常由細胞→組織→器官直接構成個體，不具器官系統層次。',
          '中'
        ],
        [
          '培養皿', 38, 76, 26, 19,
          '在實驗室進行微生物分離培養時，下列哪一項操作最能有效防止雜菌污染？',
          ['培養皿開蓋時角度盡量小且靠近酒精燈火焰無菌區', '用未滅菌的棉花棒直接塗抹於培養基表面', '操作過程中大聲講話以驅趕空氣中的細菌', '培養皿不需蓋蓋子，直接放置於走廊通風處'],
          0,
          '無菌操作技術要求器材滅菌、開啟培養皿時開口傾斜微小，並在酒精燈對流產生的無菌區內進行，避免空氣落菌沉降。',
          '難'
        ],
        [
          '研究紀錄', 23, 66, 20, 28,
          '進行科學實驗時，為什麼必須設置「對照組（對照實驗）」？',
          ['作為基準組別，用以確認實驗組的差異確實是由操作變因所引起', '為了讓實驗數據看起來比較豐富', '確保實驗結果一定符合研究者的主觀假設', '減少實驗記錄所需花費的時間'],
          0,
          '對照組作為對比基準，排除其他干擾因素，以證實觀察到的結果確實是由操作變因所造成的效應。',
          '中'
        ]
      ]
    },
    {
      title: '地下神祕研究中心',
      short: '地下研究中心',
      subtitle: '最終核心正在啟動……等等，阿歪的名字怎麼在上面？',
      quota: { '易': 1, '中': 2, '難': 2 },
      items: [
        [
          '生物核心', 62, 17, 22, 47,
          '地下核心分析槽檢測出細菌與人體細胞，兩者在細胞構造上的最主要根本差異為何？',
          ['細菌為原核生物，遺傳物質無核膜包覆；人體細胞為真核生物，具有完整細胞核', '細菌有細胞核，人體細胞沒有遺傳物質', '細菌具有葉綠體，人體細胞具有細胞壁', '兩者均為多細胞生物，構造完全一樣'],
          0,
          '細菌屬於原核生物，沒有成形的細胞核（缺乏核膜）；動物與植物等屬於真核生物，具有由核膜包圍的完整細胞核。',
          '易'
        ],
        [
          '左側控制台', 25, 43, 25, 29,
          '人體的神經細胞具有細長突起、紅血球呈雙凹圓盤狀，這種細胞形態與特定功能相互配合的現象稱為？',
          ['細胞分化與專化', '突變與細胞消亡', '無性繁殖', '光合作用'],
          0,
          '多細胞生物在發育過程中，細胞經過分化形成具有特定形態、構造與功能的各類專化細胞，分工合作維持個體生命。',
          '中'
        ],
        [
          '右側螢幕', 79, 34, 19, 33,
          '當研究中心的主機運算發現「實驗數據與原本建立的假說產生矛盾」時，科學家最正當客觀的做法是？',
          ['重新檢視實驗步驟、確認數據真實性，並客觀修正假說', '刪除與假說不符的異常數據，只保留符合的部分', '修改原始記錄，讓數據看起來完美支持假設', '停止研究並隱瞞所有實驗成果'],
          0,
          '科學追求求真與實證，當數據真實有效且可重複但否定假說時，應誠實尊重證據，檢視實驗並提出修正後的新假說。',
          '難'
        ],
        [
          '地下通道', 7, 55, 21, 37,
          '在校園生態系統中，綠色植物（如榕樹、杜鵑）在生態系物質循環與能量流動中主要扮演何種角色？',
          ['生產者：利用太陽能將無機物合成有機養分', '消費者：主要掠食其他動物以獲取能量', '分解者：將動植物遺體完全礦化分解', '清道夫：只吞食枯枝落葉'],
          0,
          '綠色植物行光合作用自給自足，將太陽能固定為化學能，是生態系能量流入的起點，扮演「生產者」角色。',
          '中'
        ],
        [
          '阿歪記憶終端', 68, 48, 20, 37,
          '終端機最後一道認證：科學探究的標準核心程序依序應為下列何者？',
          ['觀察現象 → 提出問題 → 形成假說 → 設計並執行實驗 → 分析數據與結論', '形成假說 → 發表結論 → 提出問題 → 觀察', '執行實驗 → 觀察 → 投票表決 → 形成假說', '直接發表結論 → 尋找符合結論的實驗現象'],
          0,
          '科學方法標準歷程為：觀察現象引發好奇 → 提出待解決問題 → 根據現有知識形成假說 → 設計嚴謹實驗檢驗 → 分析數據歸納結論。',
          '難'
        ]
      ]
    }
  ];

  // 3. 狀態變數
  let stages = JSON.parse(JSON.stringify(DEFAULT_STAGES));
  const $ = id => document.getElementById(id);
  const PARAMS = new URLSearchParams(window.location.search);
  const isStudent = PARAMS.get('student') === '1';
  const isTeacher = !isStudent && (
    window.location.protocol === 'file:' ||
    PARAMS.get('teacher') === '1' ||
    PARAMS.get('preview') === '1' ||
    PARAMS.get('mode') === 'teacher' ||
    PARAMS.get('role') === 'teacher'
  );

  let currentScene = 0; // 0: 首頁, 1: 教室, 2: 實驗室, 3: 地下中心, 4: 結局
  let solvedClues = [new Set(), new Set(), new Set()]; // 三關各自完成的線索索引
  let earnedCertificates = [false, false, false];
  let activeClueIndex = -1;
  let currentQuestionMistakes = 0;
  let questionAnswered = false;
  let remainingHints = 3;
  let gamePaused = false;
  let isPreviewMode = false;
  let gameFinished = false;
  let totalStartTime = 0;

  // 計時系統設定
  let timeMode = PARAMS.get('mode') === 'stage' ? 'stage' : 'total';
  let totalMinutes = (() => {
    const n = Number(PARAMS.get('total'));
    return Number.isInteger(n) && n >= 1 && n <= 120 ? n : 10;
  })();
  let stageMinutes = [6, 4, 4];
  let noTimer = PARAMS.get('notime') === '1';
  let secondsRemaining = 600;
  let timerInterval = null;
  let totalDeadline = 0;
  let totalTimerStarted = false;

  // 劇情對話佇列
  let dialogueLines = [];
  let dialogueIndex = 0;
  let dialogueCallback = null;

  // 4. 阿歪 companion 對話庫
  const INTROS = {
    1: [
      ['得意', '喂！你終於來了！我等到電路都快長蜘蛛網了！'],
      ['驚嚇', '等等，窗外那隻眼睛是不是在看我？我沒有怕喔！'],
      ['嘴硬', '教室裡有六個異常生物訊號。快找線索，別一直盯著本天才！']
    ],
    2: [
      ['得意', '實驗室到了！先聲明，這裡的怪事絕對不是我搞的。'],
      ['驚嚇', '培養皿在發光？！它該不會在對我眨眼吧！'],
      ['嘴硬', '五項科學調查！觀察、記錄、分析，還有……保護我。啊不是！']
    ],
    3: [
      ['疑惑', '地下三層？學校到底偷偷蓋了多少層啊？'],
      ['驚嚇', '等等……研究中心的管理者名字，為什麼是阿歪？！'],
      ['堅定', '我可能想起了什麼。先破解最後五道生物謎題！']
    ]
  };

  const ENDINGS = {
    1: [
      ['得意', '第一關完成！這當然是因為本天才指導有方。'],
      ['驚嚇', '黑板竟然自己打開了實驗室的密碼門？！它是不是有手？'],
      ['嘴硬', '走吧！本天才帶路……咳，你們先走，我殿後。']
    ],
    2: [
      ['得意', '五項實驗調查完成！本天才的 CPU 都要鼓掌了。'],
      ['疑惑', '研究紀錄裡有我的主機識別碼……這到底代表什麼？'],
      ['堅定', '地下研究中心的核心啟動了！跟我來，我要查清楚這一切。']
    ],
    3: [
      ['驚嚇', '等等！原來我就是這所學校的守護生物 AI？！'],
      ['疑惑', '難怪我一直記不得自己的來歷……原來記憶被病毒加密了。'],
      ['得意', '哼！我才不是需要被保護呢！不過……謝謝你們陪我找回記憶！']
    ]
  };

  const CERTIFICATES = [
    { icon: '🔎', name: '校園異象調查員', quote: '你居然通過了？本天才勉強可以收你當第一助手！' },
    { icon: '🧪', name: '菁英生物研究員', quote: '等等！你的生物研究能力是不是快超過我了？這不科學！' },
    { icon: '🏆', name: '傳奇生物解謎大師', quote: '好吧！你才是這所學校最強的生物調查員！' }
  ];

  // 5. 格式化秒數
  const formatTime = sec => {
    if (noTimer) return '無限制';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 廣播不中斷橫幅
  function broadcastStoryBeat(text, duration = 4000) {
    const banner = $('storyBeatBanner');
    const textEl = $('storyBeatText');
    if (!banner || !textEl) return;
    textEl.textContent = text;
    banner.classList.remove('hidden');
    clearTimeout(banner._timer);
    banner._timer = setTimeout(() => {
      banner.classList.add('hidden');
    }, duration);
  }

  // 6. 阿歪狀態與講話更新
  function updateAywaiMood(mood) {
    const avatar = $('avatar');
    const dialogueAvatar = $('dialogueAvatar');
    [avatar, dialogueAvatar].forEach(a => {
      if (!a) return;
      a.classList.remove('excited', 'scared', 'proud');
      void a.offsetWidth;
      if (mood === '驚嚇') a.classList.add('scared');
      else if (mood === '得意') a.classList.add('proud');
      else if (mood === '堅定' || mood === '疑惑') a.classList.add('excited');
    });
  }

  function setAywaiSpeech(line) {
    const speech = $('aywaiSpeech');
    if (speech) {
      speech.textContent = line;
      speech.classList.remove('collapsed');
    }
  }

  function quip(line, mood = '得意') {
    setAywaiSpeech(line);
    updateAywaiMood(mood);
  }

  // 逐句對話演出
  function talk(lines, afterCallback = null) {
    if (!lines || !lines.length) {
      if (afterCallback) afterCallback();
      return;
    }
    dialogueLines = lines;
    dialogueIndex = 0;
    dialogueCallback = afterCallback;
    $('dialogue').classList.remove('hidden');
    renderDialogueLine();
  }

  function renderDialogueLine() {
    if (!dialogueLines.length) return;
    const [mood, text] = dialogueLines[dialogueIndex];
    $('bubble').textContent = text;
    $('dialogueCounter').textContent = `${dialogueIndex + 1} / ${dialogueLines.length}`;
    $('dialogueNext').textContent = dialogueIndex === dialogueLines.length - 1 ? '完成 ✓' : '下一句 ▶';
    updateAywaiMood(mood);
    setAywaiSpeech(text);
  }

  function finishDialogue() {
    $('dialogue').classList.add('hidden');
    const cb = dialogueCallback;
    dialogueLines = [];
    dialogueCallback = null;
    if (cb) cb();
    else resumeTimerIfNeeded();
  }

  // 7. 計時器核心控制
  function getTimerSecondsForStage(stg = currentScene) {
    if (noTimer) return 999999;
    if (timeMode === 'total') return totalMinutes * 60;
    const idx = (stg >= 1 && stg <= 3) ? stg - 1 : 0;
    return (stageMinutes[idx] || 5) * 60;
  }

  function startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (gameFinished || isPreviewMode || currentScene < 1 || currentScene > 3 || gamePaused || noTimer) {
        return;
      }
      if (timeMode === 'total' && totalTimerStarted) {
        secondsRemaining = Math.max(0, Math.ceil((totalDeadline - Date.now()) / 1000));
        $('timer').textContent = `⏳ ${formatTime(secondsRemaining)}`;
        if (secondsRemaining <= 0) {
          triggerTimeout();
        }
        return;
      }
      if (secondsRemaining > 0) {
        secondsRemaining--;
        $('timer').textContent = `⏳ ${formatTime(secondsRemaining)}`;
        if (secondsRemaining === 0) {
          triggerTimeout();
        }
      }
    }, 1000);
  }

  function resumeTimerIfNeeded() {
    if (timeMode === 'total' && totalTimerStarted && Date.now() >= totalDeadline) {
      triggerTimeout();
      return;
    }
    gamePaused = false;
    updatePauseButton();
  }

  function updatePauseButton() {
    $('pauseBtn').textContent = gamePaused ? '▶ 繼續' : '⏸️ 暫停';
  }

  function addMinutes(mins) {
    const addedSecs = mins * 60;
    if (timeMode === 'total' && totalTimerStarted) {
      totalDeadline += addedSecs * 1000;
      secondsRemaining = Math.max(0, Math.ceil((totalDeadline - Date.now()) / 1000));
    } else {
      secondsRemaining += addedSecs;
    }
    $('timer').textContent = `⏳ ${formatTime(secondsRemaining)}`;
    broadcastStoryBeat(`⏱️ 經教師授權：已成功延長 ${mins} 分鐘！`);
    quip(`太棒了！獲得了額外的 ${mins} 分鐘，抓緊時間調查！`, '得意');
  }

  function triggerTimeout() {
    if (gameFinished) return;
    $('timeoutBadgesArea').textContent = `已獲得認證：${earnedCertificates.filter(Boolean).length} / 3 枚徽章`;
    $('timeoutOverlay').classList.remove('hidden');
    $('modal').classList.add('hidden');
    $('puzzleOverlay').classList.add('hidden');
    quip('糟糕！時間用完了！別慌，可以請老師授權延長時間喔！', '驚嚇');
  }

  // 8. 畫面場景渲染
  function renderScene() {
    document.body.classList.toggle('home', currentScene === 0);
    document.body.classList.toggle('is-student-mode', isStudent);

    // 背景圖更新
    $('bg').src = SCENES[currentScene === 4 ? 3 : currentScene];
    $('ending').classList.toggle('hidden', currentScene !== 4);

    // 總進度更新
    const totalDone = solvedClues.reduce((sum, set) => sum + set.size, 0);
    $('progressPill').textContent = `🔍 ${totalDone} / 16`;
    $('timer').textContent = `⏳ ${formatTime(secondsRemaining)}`;
    $('hintsLeft').textContent = remainingHints;

    // 關卡資訊與進度軌
    if (currentScene >= 1 && currentScene <= 3) {
      const curStage = stages[currentScene - 1];
      $('stageInfo').classList.remove('hidden');
      $('stageLabel').textContent = `｜第 ${currentScene} 關：${curStage.short}`;
      $('levelName').textContent = curStage.title;
      $('levelStory').textContent = curStage.subtitle;
      $('progressText').textContent = `第 ${currentScene} 關｜已收集 ${solvedClues[currentScene - 1].size} / ${curStage.items.length} 個線索`;
      const pct = (solvedClues[currentScene - 1].size / curStage.items.length) * 100;
      $('progressFill').style.width = `${pct}%`;
      $('mission').textContent = `第 ${currentScene} 關｜已完成 ${solvedClues[currentScene - 1].size} / ${curStage.items.length} 個線索`;

      // 渲染探索節點
      const container = $('hotspots');
      container.replaceChildren();
      curStage.items.forEach((it, idx) => {
        const btn = document.createElement('button');
        const isDone = solvedClues[currentScene - 1].has(idx);
        btn.className = 'hot' + (isDone ? ' done' : '');
        btn.style.left = `${it[1]}%`;
        btn.style.top = `${it[2]}%`;
        btn.style.width = `${it[3]}%`;
        btn.style.height = `${it[4]}%`;
        btn.setAttribute('aria-label', `探索線索：${it[0]}`);
        btn.title = `探索線索：${it[0]}`;
        btn.onclick = () => openClueQuestion(idx);
        container.appendChild(btn);
      });
    } else {
      $('stageInfo').classList.add('hidden');
      $('stageLabel').textContent = '';
      $('hotspots').replaceChildren();
      $('mission').textContent = '探索三關，破解 16 道生物謎題';
    }
  }

  // 9. 跳關與狀態切換
  function gotoScene(sceneNum, asPreview = false) {
    if (gameFinished && sceneNum >= 1 && sceneNum <= 3 && !asPreview) return;
    const preserveTotal = timeMode === 'total' && totalTimerStarted && !asPreview && sceneNum >= 1 && sceneNum <= 3;

    currentScene = sceneNum;
    isPreviewMode = asPreview;
    gamePaused = false;
    remainingHints = 3;

    if (!preserveTotal) {
      secondsRemaining = getTimerSecondsForStage(sceneNum);
    } else {
      secondsRemaining = Math.max(0, Math.ceil((totalDeadline - Date.now()) / 1000));
    }

    if (!asPreview && sceneNum >= 1 && sceneNum <= 3 && timeMode === 'total' && !totalTimerStarted) {
      totalDeadline = Date.now() + totalMinutes * 60000;
      totalTimerStarted = true;
      totalStartTime = Date.now();
    }

    $('modal').classList.add('hidden');
    $('puzzleOverlay').classList.add('hidden');
    $('awardCurtain').classList.add('hidden');
    $('dialogue').classList.add('hidden');
    $('timeoutOverlay').classList.add('hidden');

    renderScene();

    if (sceneNum >= 1 && sceneNum <= 3 && !asPreview) {
      talk(INTROS[sceneNum], () => {
        resumeTimerIfNeeded();
        renderScene();
      });
    } else if (sceneNum === 4) {
      showEndingReport();
    }
  }

  // 10. 開啟線索題目
  function openClueQuestion(idx) {
    if (gameFinished || currentScene < 1 || currentScene > 3) return;
    if (solvedClues[currentScene - 1].has(idx)) {
      quip('這條線索已經收妥啦！別想刷兩次分數。', '得意');
      return;
    }
    activeClueIndex = idx;
    questionAnswered = false;
    currentQuestionMistakes = 0;

    const it = stages[currentScene - 1].items[idx];
    $('modalMeta').textContent = `第 ${currentScene} 關｜線索 ${idx + 1}：${it[0]}`;
    $('modalTitle').textContent = it[5];
    $('modalText').textContent = '觀察生物現象，選出最合理的科學答案：';
    $('feedback').classList.add('hidden');
    $('next').classList.add('hidden');
    $('back').classList.remove('hidden');

    const ansContainer = $('answers');
    ansContainer.replaceChildren();
    it[6].forEach((opt, optIdx) => {
      const b = document.createElement('button');
      b.textContent = `${['A', 'B', 'C', 'D'][optIdx]}. ${opt}`;
      b.onclick = () => handleAnswer(optIdx);
      ansContainer.appendChild(b);
    });

    $('modal').classList.remove('hidden');
  }

  function handleAnswer(choiceIdx) {
    if (gameFinished || questionAnswered) return;
    const it = stages[currentScene - 1].items[activeClueIndex];
    const correctIdx = it[7];

    if (choiceIdx === correctIdx) {
      questionAnswered = true;
      $('feedback').textContent = `✅ 答對！${it[8]}\n🤖 阿歪：「這在我的計畫之內……應該吧！」`;
      $('feedback').classList.remove('hidden');
      $('next').textContent = '收下線索';
      $('next').classList.remove('hidden');
      [...$('answers').children].forEach((b, i) => {
        b.disabled = true;
        if (i === correctIdx) b.style.borderColor = '#4ade80';
      });
      updateAywaiMood('得意');
    } else {
      currentQuestionMistakes++;
      const tip = currentQuestionMistakes === 1
        ? '❌ 再試一次！先找出題目要求的生物概念，排除無關的干擾選項。'
        : `🔍 阿歪的小提醒：這題在考「${it[5].slice(0, 26)}」。想想哪個選項最符合實驗觀察證據。答對後會有完整解析！`;
      $('feedback').textContent = tip;
      $('feedback').classList.remove('hidden');
      updateAywaiMood('驚嚇');
    }
  }

  function collectActiveClue() {
    if (gameFinished || !questionAnswered) return;
    solvedClues[currentScene - 1].add(activeClueIndex);
    $('modal').classList.add('hidden');
    renderScene();
    showStarToast();

    // 檢查是否該關所有線索已完成
    const stageItems = stages[currentScene - 1].items;
    if (solvedClues[currentScene - 1].size === stageItems.length) {
      if (currentScene === 2) {
        // Stage 2 終極機關：滲透與細胞型態解鎖
        talk([
          ['驚嚇', '等等！實驗室的大門被生化安全鎖封印了！'],
          ['嘴硬', '必須將三種溶液濃度與紅血球型態正確配對才能解鎖！看你的了！']
        ], () => {
          openStage2Puzzle();
        });
      } else if (currentScene === 3) {
        // Stage 3 終極機關：阿歪核心記憶重組
        talk([
          ['驚嚇', '最後的核心主機……需要重組科學探究的五大歷程！'],
          ['堅定', '把被病毒打亂的探究步驟排回正確順序，我才能完全找回記憶！']
        ], () => {
          openStage3Puzzle();
        });
      } else {
        const cur = currentScene;
        talk(ENDINGS[cur], () => showStageCertificate(cur));
      }
    } else {
      const encouragements = [
        '居然答對了？！咳，我早就知道你可以的。',
        '這個線索很重要！你們比我想的還可靠！',
        '我只是稍微幫了一點點忙，真的只有一點點喔！'
      ];
      quip(encouragements[solvedClues[currentScene - 1].size % encouragements.length], '得意');
    }
  }

  function showStarToast() {
    const el = document.createElement('div');
    el.className = 'starToast';
    el.textContent = '⭐ 獲得關鍵生物線索！';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  // 11. 特殊機關挑戰 (Stage 2 滲透配對 & Stage 3 探究歷程排序)
  // Stage 2: 滲透作用與紅血球狀態 (3張卡片點擊互換配對)
  const PUZZLE_STAGE2_DATA = [
    { id: 'hypo', figure: '💧', name: '低張溶液（純水）', sub: '紅血球吸水膨脹破裂' },
    { id: 'iso', figure: '⚖️', name: '等張溶液（生理食鹽水 0.9%）', sub: '水分子進出平衡維持正常' },
    { id: 'hyper', figure: '🧂', name: '高張溶液（濃食鹽水）', sub: '水分滲透流出萎縮皺縮' }
  ];
  let puzzleStage2State = [];
  let puzzleSelectedIdx = -1;

  function openStage2Puzzle() {
    puzzleStage2State = shuffleArray([...PUZZLE_STAGE2_DATA]);
    // 確保初始不直接等於正確順序
    while (isStage2PuzzleCorrect()) {
      puzzleStage2State = shuffleArray([...PUZZLE_STAGE2_DATA]);
    }
    puzzleSelectedIdx = -1;
    $('puzzleKicker').textContent = '🧫 第 2 關實驗室封印機關';
    $('puzzleTitle').textContent = '滲透作用與紅血球型態匹配';
    $('puzzlePrompt').textContent = '請點選兩張卡片互換位置，依「低張液（純水）➔ 等張液（生理食鹽水）➔ 高張液（濃食鹽水）」依序排列：';
    renderStage2Puzzle();
    $('puzzleOverlay').classList.remove('hidden');
  }

  function isStage2PuzzleCorrect() {
    return puzzleStage2State[0].id === 'hypo' &&
      puzzleStage2State[1].id === 'iso' &&
      puzzleStage2State[2].id === 'hyper';
  }

  function renderStage2Puzzle() {
    const container = $('puzzleContainer');
    container.replaceChildren();
    puzzleStage2State.forEach((item, idx) => {
      const btn = document.createElement('div');
      btn.className = 'mechanic-item' + (puzzleSelectedIdx === idx ? ' selected' : '');
      btn.innerHTML = `
        <span class="figure">${item.figure}</span>
        <div class="item-name">
          <strong style="display:block">${item.name}</strong>
          <span style="font-size:11px;color:#fde047">${item.sub}</span>
        </div>
      `;
      btn.onclick = () => handlePuzzleClick(idx, 2);
      container.appendChild(btn);
    });
    $('puzzleStatus').textContent = puzzleSelectedIdx >= 0 ? `已選擇第 ${puzzleSelectedIdx + 1} 張卡片，請點選另一張進行對調` : '點選任意卡片進行對調排序';
  }

  // Stage 3: 科學探究五大歷程排序
  const PUZZLE_STAGE3_DATA = [
    { id: 's1', figure: '👀', name: '① 觀察現象', sub: '發現未解生物問題' },
    { id: 's2', figure: '❓', name: '② 提出問題', sub: '確立探究的核心主旨' },
    { id: 's3', figure: '💡', name: '③ 形成假說', sub: '提出合理的暫時解釋' },
    { id: 's4', figure: '🧪', name: '④ 設計執行實驗', sub: '設置對照組檢驗變因' },
    { id: 's5', figure: '📊', name: '⑤ 分析結論', sub: '依據客觀證據下結論' }
  ];
  let puzzleStage3State = [];

  function openStage3Puzzle() {
    puzzleStage3State = shuffleArray([...PUZZLE_STAGE3_DATA]);
    while (isStage3PuzzleCorrect()) {
      puzzleStage3State = shuffleArray([...PUZZLE_STAGE3_DATA]);
    }
    puzzleSelectedIdx = -1;
    $('puzzleKicker').textContent = '🤖 第 3 關阿歪核心記憶重組';
    $('puzzleTitle').textContent = '科學探究標準五大歷程排序';
    $('puzzlePrompt').textContent = '請點選兩張卡片互換位置，將被打亂的科學探究歷程依序排回正確標準順序：';
    renderStage3Puzzle();
    $('puzzleOverlay').classList.remove('hidden');
  }

  function isStage3PuzzleCorrect() {
    return puzzleStage3State.map(x => x.id).join(',') === 's1,s2,s3,s4,s5';
  }

  function renderStage3Puzzle() {
    const container = $('puzzleContainer');
    container.replaceChildren();
    puzzleStage3State.forEach((item, idx) => {
      const btn = document.createElement('div');
      btn.className = 'mechanic-item' + (puzzleSelectedIdx === idx ? ' selected' : '');
      btn.innerHTML = `
        <span class="figure">${item.figure}</span>
        <div class="item-name">
          <strong style="display:block">${item.name}</strong>
          <span style="font-size:11px;color:#fde047">${item.sub}</span>
        </div>
      `;
      btn.onclick = () => handlePuzzleClick(idx, 3);
      container.appendChild(btn);
    });
    $('puzzleStatus').textContent = puzzleSelectedIdx >= 0 ? `已選擇第 ${puzzleSelectedIdx + 1} 個歷程，請點選另一個進行對調` : '點選兩張卡片互換位置以調整順序';
  }

  function handlePuzzleClick(idx, stageNum) {
    if (puzzleSelectedIdx === -1) {
      puzzleSelectedIdx = idx;
    } else if (puzzleSelectedIdx === idx) {
      puzzleSelectedIdx = -1;
    } else {
      if (stageNum === 2) {
        const tmp = puzzleStage2State[puzzleSelectedIdx];
        puzzleStage2State[puzzleSelectedIdx] = puzzleStage2State[idx];
        puzzleStage2State[idx] = tmp;
      } else {
        const tmp = puzzleStage3State[puzzleSelectedIdx];
        puzzleStage3State[puzzleSelectedIdx] = puzzleStage3State[idx];
        puzzleStage3State[idx] = tmp;
      }
      puzzleSelectedIdx = -1;
    }
    if (stageNum === 2) renderStage2Puzzle();
    else renderStage3Puzzle();
  }

  // 12. 驗證並解鎖機關
  $('puzzleSubmitBtn').onclick = () => {
    if (currentScene === 2) {
      if (isStage2PuzzleCorrect()) {
        $('puzzleOverlay').classList.add('hidden');
        broadcastStoryBeat('🔓 生化安全鎖解鎖成功！地下研究中心通道開啟！');
        talk(ENDINGS[2], () => showStageCertificate(2));
      } else {
        $('puzzleStatus').textContent = '❌ 排序尚未完全吻合！請想想：純水（低張）→ 生理食鹽水（等張）→ 濃食鹽水（高張）。';
        updateAywaiMood('驚嚇');
      }
    } else if (currentScene === 3) {
      if (isStage3PuzzleCorrect()) {
        $('puzzleOverlay').classList.add('hidden');
        broadcastStoryBeat('🎉 核心記憶重組完成！阿歪 AI 完整覺醒！');
        talk(ENDINGS[3], () => showStageCertificate(3));
      } else {
        $('puzzleStatus').textContent = '❌ 探究歷程尚未正確！標準歷程為：觀察 → 提問 → 假說 → 實驗 → 結論。';
        updateAywaiMood('驚嚇');
      }
    }
  };

  $('puzzleResetBtn').onclick = () => {
    if (currentScene === 2) openStage2Puzzle();
    else if (currentScene === 3) openStage3Puzzle();
  };

  // 13. 頒發關卡認證
  function showStageCertificate(stageNum) {
    earnedCertificates[stageNum - 1] = true;
    const cert = CERTIFICATES[stageNum - 1];
    $('awardMedal').textContent = cert.icon;
    $('awardTitle').textContent = cert.name;
    $('awardDescription').textContent = `恭喜完成第 ${stageNum} 關！成功取得第 ${stageNum} 枚校園生物調查認證徽章。`;
    $('awardAw').textContent = `阿歪 AI：「${cert.quote}」`;
    $('awardContinue').textContent = stageNum === 3 ? '領取終極認證・揭曉校園結局 ▶' : '領取認證・進入下一關 ▶';
    $('awardCurtain').classList.remove('hidden');
  }

  $('awardContinue').onclick = () => {
    $('awardCurtain').classList.add('hidden');
    if (currentScene === 3) {
      gotoScene(4, false);
    } else {
      gotoScene(currentScene + 1, false);
    }
  };

  // 14. 結局與探險戰報
  function showEndingReport() {
    gameFinished = true;
    if (timerInterval) clearInterval(timerInterval);
    const totalTimeSec = totalStartTime > 0 ? Math.round((Date.now() - totalStartTime) / 1000) : (totalMinutes * 60 - secondsRemaining);
    const mm = Math.floor(Math.max(0, totalTimeSec) / 60);
    const ss = Math.max(0, totalTimeSec) % 60;
    const timeStr = `${mm} 分 ${ss} 秒`;

    const statsEl = $('endingStats');
    statsEl.textContent = `
🏫 現代校園：生物密室逃脫 - 結算報告
━━━━━━━━━━━━━━━━━━━━
🎯 調查認證：
  ${earnedCertificates[0] ? '🏅 第 1 關：校園異象調查員 (已取得)' : '🔒 第 1 關：未解鎖'}
  ${earnedCertificates[1] ? '🧪 第 2 關：菁英生物研究員 (已取得)' : '🔒 第 2 關：未解鎖'}
  ${earnedCertificates[2] ? '🏆 第 3 關：傳奇生物解謎大師 (已取得)' : '🔒 第 3 關：未解鎖'}
📊 謎題破解：16 / 16 道謎題全數破解
⏱️ 調查總時長：${timeStr}
🤖 阿歪 AI：「你才是這所學校最強的生物調查員！」
    `.trim();

    $('ending').classList.remove('hidden');
    quip('太精彩了！校園危機徹底解除，我把這段記憶永久保存在中央核心！', '得意');
  }

  // 複製探險成果到剪貼簿 (供 Google Classroom 繳交)
  $('copyReportBtn').onclick = async () => {
    const text = $('endingStats').textContent;
    try {
      await navigator.clipboard.writeText(text);
      $('copyNoticeOverlay').classList.remove('hidden');
    } catch (_) {
      alert('已複製戰報，請在 Google Classroom 貼上！\n\n' + text);
    }
  };
  $('closeCopyNotice').onclick = () => $('copyNoticeOverlay').classList.add('hidden');

  // 15. 動態題庫連線與派發 (manifest.json)
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
      select.innerHTML = '<option value="demo">✨ 現代校園示範題庫 (16 題原生試題)</option>';

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
        await switchQuestionUnit(targetUnit);
      } else {
        $('loadInfo').textContent = '✅ 已成功連線全平台題庫；當前採用「現代校園示範題庫 (16 題)」。';
      }
    } catch (err) {
      console.warn('連線 manifest.json 失敗，保持示範題庫:', err);
      $('loadInfo').textContent = '展示模式：使用內建 16 題現代校園生物試題。';
    }
  }

  async function switchQuestionUnit(unitPath) {
    const badge = $('unitLoadedBadge');
    const info = $('loadInfo');
    if (unitPath === 'demo' || !unitPath) {
      stages = JSON.parse(JSON.stringify(DEFAULT_STAGES));
      if (badge) badge.textContent = '✅ 當前題庫：現代校園示範題庫 (16 題)';
      if (info) info.textContent = '展示模式：使用內建 16 題現代校園生物試題。';
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

      stages = assignQuestionsToStages(rawList);
      const select = $('unitSelect');
      const selectedText = select?.options[select.selectedIndex]?.text || unitPath;
      if (badge) badge.textContent = '✅ 已連線題庫：' + selectedText;
      if (info) info.textContent = `成功套用題庫單元「${selectedText}」，共 16 題密室線索已備齊！`;
      broadcastStoryBeat(`📚 題庫已切換為：${selectedText}`);
    } catch (err) {
      console.error('載入題庫失敗:', err);
      if (badge) badge.textContent = '⚠️ 載入失敗，維持內建示範題庫';
      if (info) info.textContent = '載入單元失敗，自動回退為現代校園原生試題。';
      stages = JSON.parse(JSON.stringify(DEFAULT_STAGES));
    }
  }

  function normalizeQuestion(q) {
    if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) return null;
    let ans = q.answer;
    if (typeof ans === 'string') {
      const letters = ['A', 'B', 'C', 'D'];
      const idx = letters.indexOf(ans.trim().toUpperCase());
      if (idx >= 0) ans = idx;
      else ans = q.options.findIndex(o => o && o.trim() === q.answer.trim());
    }
    if (ans === -1 || ans === undefined || ans === null) ans = 0;
    return {
      question: q.question,
      options: q.options,
      answer: ans,
      explanation: q.explanation || '依據生物學原理與課堂實驗觀察即可得知正確解答。',
      difficulty: q.difficulty || '中'
    };
  }

  function assignQuestionsToStages(pool) {
    const normList = (pool || []).map(normalizeQuestion).filter(Boolean);
    let safePool = normList.length ? normList : [];

    // 若題庫題目不足 16 題，循環回填
    if (safePool.length < 16) {
      const origLen = safePool.length || 1;
      let i = 0;
      while (safePool.length < 16) {
        const base = safePool[i % origLen] || {
          question: '下列何者為生物維持生命現象的基本構造？',
          options: ['細胞', '病毒', '礦物質', '水蒸氣'],
          answer: 0,
          explanation: '細胞是生物體構造與功能的基本單位。',
          difficulty: '易'
        };
        safePool.push({
          question: base.question,
          options: base.options,
          answer: base.answer,
          explanation: base.explanation,
          difficulty: base.difficulty
        });
        i++;
      }
    }

    const groups = { '易': [], '中': [], '難': [] };
    const shuffled = shuffleArray([...safePool]);
    shuffled.forEach(q => groups[q.difficulty || '中'].push(q));

    const newStages = JSON.parse(JSON.stringify(DEFAULT_STAGES));
    newStages.forEach(stg => {
      const picked = [];
      const quota = stg.quota || { '易': 2, '中': 2, '難': 1 };
      for (const diff of ['易', '中', '難']) {
        for (let n = 0; n < quota[diff]; n++) {
          if (groups[diff].length) picked.push(groups[diff].pop());
        }
      }
      while (picked.length < stg.items.length) {
        const remainingPool = ['易', '中', '難'].flatMap(k => groups[k]);
        if (remainingPool.length) {
          picked.push(groups[remainingPool[0].difficulty].pop());
        } else {
          picked.push(safePool[Math.floor(Math.random() * safePool.length)]);
        }
      }
      stg.items.forEach((it, i) => {
        const q = picked[i];
        if (q) {
          it[5] = q.question;
          it[6] = q.options;
          it[7] = q.answer;
          it[8] = q.explanation;
        }
      });
    });

    return newStages;
  }

  function shuffleArray(arr) {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  }

  // 16. 阿歪吉祥物拖曳 (PointerEvents)
  function initAywaiDragging() {
    const widget = $('aywaiWidget');
    const avatar = $('avatar');
    if (!widget || !avatar) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    avatar.addEventListener('pointerdown', e => {
      isDragging = true;
      widget.classList.add('is-dragging');
      avatar.setPointerCapture(e.pointerId);

      startX = e.clientX;
      startY = e.clientY;

      const rect = widget.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      widget.style.right = 'auto';
      widget.style.bottom = 'auto';
      widget.style.left = `${initialLeft}px`;
      widget.style.top = `${initialTop}px`;
      e.stopPropagation();
    });

    avatar.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      const maxLeft = window.innerWidth - widget.offsetWidth - 10;
      const maxTop = window.innerHeight - widget.offsetHeight - 10;

      newLeft = Math.max(10, Math.min(newLeft, maxLeft));
      newTop = Math.max(10, Math.min(newTop, maxTop));

      widget.style.left = `${newLeft}px`;
      widget.style.top = `${newTop}px`;
    });

    const stopDrag = e => {
      if (!isDragging) return;
      isDragging = false;
      widget.classList.remove('is-dragging');
      try { avatar.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    avatar.addEventListener('pointerup', stopDrag);
    avatar.addEventListener('pointercancel', stopDrag);

    // 點擊氣泡收起/展開
    const speech = $('aywaiSpeech');
    if (speech) {
      speech.onclick = () => speech.classList.toggle('collapsed');
    }
  }

  // 17. 學生版派發與 QR Code 生成
  function generateStudentUrl() {
    const base = window.location.origin + window.location.pathname;
    const p = new URLSearchParams();
    p.set('student', '1');

    const selectedUnit = $('unitSelect')?.value;
    if (selectedUnit && selectedUnit !== 'demo') {
      p.set('unit', selectedUnit);
    }

    const tm = $('timeModeSelect')?.value || 'total';
    p.set('mode', tm);

    if ($('noTimeCheck')?.checked) {
      p.set('notime', '1');
    } else if (tm === 'total') {
      const mins = Number($('totalMinutesInput')?.value) || 10;
      p.set('total', String(mins));
    } else {
      const t0 = Number($('timeStage0')?.value) || 6;
      const t1 = Number($('timeStage1')?.value) || 4;
      const t2 = Number($('timeStage2')?.value) || 4;
      p.set('times', `${t0},${t1},${t2}`);
    }

    return `${base}?${p.toString()}`;
  }

  function launchStudentView() {
    const url = generateStudentUrl();
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      if (confirm('偵測到瀏覽器攔截了自動彈出分頁！是否直接在當前頁面開啟學生版？')) {
        window.location.href = url;
      }
    }
  }

  function renderStudentQRCode() {
    const url = generateStudentUrl();
    const input = $('studentUrlInput');
    const qrDiv = $('studentQRCode');
    const link = $('testStudentLaunchLink');
    if (input) input.value = url;
    if (link) link.href = url;
    if (qrDiv) {
      qrDiv.replaceChildren();
      if (window.QRCode) {
        new window.QRCode(qrDiv, {
          text: url,
          width: 170,
          height: 170,
          colorDark: '#1e143b',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
      }
    }
    $('studentQRArea').classList.remove('hidden');
  }

  // 18. 事件綁定
  function bindUIEvents() {
    // 首頁開始
    $('startBtn').onclick = () => gotoScene(1, false);
    $('coverStart').onclick = () => gotoScene(1, false);

    // 封面遊戲說明與成就
    $('coverHow').onclick = () => {
      alert('【🏫 校園生物調查任務】\n\n1. 點擊畫面中的可疑線索並回答生物謎題。\n2. 共有三關 16 道謎題，阿歪會逐句提示。\n3. 完成每關謎題後挑戰解鎖機關，取得關卡認證徽章！');
    };
    $('storyBtn').onclick = $('coverHow').onclick;

    $('coverAwards').onclick = () => {
      const total = solvedClues.reduce((sum, s) => sum + s.size, 0);
      alert(`【🏆 當前調查進度】\n已破解：${total} / 16 道謎題\n` +
        CERTIFICATES.map((c, i) => `${earnedCertificates[i] ? '🏅 已解鎖' : '🔒 尚未取得'}｜第 ${i + 1} 關：${c.name}`).join('\n')
      );
    };
    $('endingAwards').onclick = $('coverAwards').onclick;

    // 教師相關按鈕
    $('teacherToggle').onclick = () => $('teacher').classList.toggle('hidden');
    $('coverTeacher').onclick = () => $('teacher').classList.remove('hidden');
    $('teacherPreviewBtn').onclick = () => $('teacher').classList.remove('hidden');
    $('closeTeacher').onclick = () => $('teacher').classList.add('hidden');

    // 快捷跳關按鈕
    document.querySelectorAll('[data-jump]').forEach(btn => {
      btn.onclick = () => {
        const j = Number(btn.dataset.jump);
        gotoScene(j, true);
      };
    });

    // 題庫切換
    $('unitSelect').onchange = e => switchQuestionUnit(e.target.value);

    // 時間模式切換
    $('timeModeSelect').onchange = e => {
      const isStage = e.target.value === 'stage';
      $('stageTimesRow').classList.toggle('hidden', !isStage);
      $('totalMinutesLabel').classList.toggle('hidden', isStage);
      timeMode = isStage ? 'stage' : 'total';
    };

    $('noTimeCheck').onchange = e => {
      noTimer = e.target.checked;
      $('timer').textContent = `⏳ ${formatTime(secondsRemaining)}`;
    };

    // QR 派卷按鈕
    $('genQRBtn').onclick = renderStudentQRCode;
    $('copyUrlBtn').onclick = async () => {
      const url = $('studentUrlInput').value;
      try {
        await navigator.clipboard.writeText(url);
        $('copyUrlFeedback').textContent = '✅ 已成功複製學生端連結！';
        setTimeout(() => $('copyUrlFeedback').textContent = '', 3000);
      } catch (_) {
        alert('請手動複製網址：' + url);
      }
    };
    $('testStudentLaunchBtn').onclick = launchStudentView;

    // HUD 功能按鈕
    $('addTimeBtn').onclick = () => addMinutes(3);
    $('hintBtn').onclick = () => {
      if (currentScene < 1 || currentScene > 3 || remainingHints <= 0) return;
      const curStage = stages[currentScene - 1];
      const unsolvedIdx = curStage.items.findIndex((_, j) => !solvedClues[currentScene - 1].has(j));
      if (unsolvedIdx < 0) return;

      remainingHints--;
      $('hintsLeft').textContent = remainingHints;
      const hotButtons = $('hotspots').children;
      if (hotButtons[unsolvedIdx]) {
        hotButtons[unsolvedIdx].classList.add('hint');
      }
      quip('好啦，我把一個可疑位置圈出來了。別說是我偷偷幫你的喔！', '得意');
    };

    $('pauseBtn').onclick = () => {
      if (gameFinished || currentScene < 1 || currentScene > 3) return;
      gamePaused = !gamePaused;
      updatePauseButton();
      if (gamePaused) {
        quip('先喝口水休息一下吧！按「繼續」就能恢復校園調查。', '得意');
      } else {
        finishDialogue();
      }
    };

    // 對話條按鈕
    $('dialogueNext').onclick = () => {
      if (dialogueIndex + 1 < dialogueLines.length) {
        dialogueIndex++;
        renderDialogueLine();
      } else {
        finishDialogue();
      }
    };
    $('dialogueSkip').onclick = finishDialogue;

    // 線索彈窗按鈕
    $('next').onclick = collectActiveClue;
    $('back').onclick = () => {
      $('modal').classList.add('hidden');
      resumeTimerIfNeeded();
    };

    // 超時彈窗按鈕
    $('extend3MinBtn').onclick = () => {
      $('timeoutOverlay').classList.add('hidden');
      addMinutes(3);
    };
    $('extend5MinBtn').onclick = () => {
      $('timeoutOverlay').classList.add('hidden');
      addMinutes(5);
    };
    $('finishNowBtn').onclick = () => {
      $('timeoutOverlay').classList.add('hidden');
      gotoScene(4, false);
    };

    // 重新挑戰
    $('again').onclick = () => {
      solvedClues = [new Set(), new Set(), new Set()];
      earnedCertificates = [false, false, false];
      gameFinished = false;
      totalTimerStarted = false;
      gotoScene(0, true);
    };

    // 教師快速鍵
    document.addEventListener('keydown', e => {
      if (isTeacher && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        $('teacher').classList.toggle('hidden');
      }
    });

    // 標題快速敲擊 5 次開啟教師面板
    let tapCount = 0, lastTap = 0;
    $('stageLabel').onclick = () => {
      if (!isTeacher) return;
      const now = Date.now();
      tapCount = now - lastTap < 1200 ? tapCount + 1 : 1;
      lastTap = now;
      if (tapCount >= 5) {
        tapCount = 0;
        $('teacher').classList.remove('hidden');
      }
    };

    // 教師面板特殊機關測試按鈕
    $('testPuzzle2Btn').onclick = () => {
      currentScene = 2;
      openStage2Puzzle();
    };
    $('testPuzzle3Btn').onclick = () => {
      currentScene = 3;
      openStage3Puzzle();
    };
    $('resumeTimerBtn').onclick = () => {
      gamePaused = false;
      updatePauseButton();
      $('teacher').classList.add('hidden');
    };
    $('resetProgressBtn').onclick = () => {
      solvedClues = [new Set(), new Set(), new Set()];
      earnedCertificates = [false, false, false];
      gameFinished = false;
      totalTimerStarted = false;
      gotoScene(0, true);
      $('teacher').classList.add('hidden');
    };
  }

  // 19. 初始化入口
  function init() {
    $('mascot').src = MASCOT_SRC;
    $('dialogueMascot').src = MASCOT_SRC;

    initAywaiDragging();
    bindUIEvents();
    loadManifestAndPopulateSelect();
    startTimerLoop();

    // 初始進入首頁
    gotoScene(0, true);
  }

  // 支援共用 escape-adapter.js hook
  window.__ESCAPE_HOOK__ = {
    type: 'school',
    stages: stages
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
