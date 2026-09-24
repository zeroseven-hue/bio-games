/**
 * 🧬 《生物星際大逃亡：逃離黑洞》核心邏輯控制器 V3.0
 * 包含：動態黑洞心跳加速度音效、Synthwave BGM、防偽認證碼與全單元題庫選擇
 */

const FALLBACK_QUESTION_BANK = [
  { id: 1, question: "關於酵素（催化劑）特性的敘述，下列何者正確？", options: ["酵素主要成分是蛋白質，具有專一性", "酵素高溫煮沸後冷卻，活性即可恢復", "酵素在反應過程中會被大量消耗", "強酸強鹼環境下所有酵素活性最高"], answer: 0, explanation: "💡 觀念解析：酵素的主成分是蛋白質，專一性高。高溫或強酸強鹼會使蛋白質變性破壞活性，冷卻後無法恢復！" },
  { id: 2, question: "將新鮮豬肝切片放入雙氧水中會產生大量氣泡，氣泡成分為何？", options: ["二氧化碳", "氧氣", "氮氣", "氫氣"], answer: 1, explanation: "💡 觀念解析：豬肝含有過氧化氫酵素，能催化雙氧水分解產生「氧氣」與水！" },
  { id: 3, question: "植物進行光合作用時，水分子被光能分解會釋放何種物質？", options: ["二氧化碳", "葡萄糖", "氧氣", "澱粉"], answer: 2, explanation: "💡 觀念解析：光合作用第一階段（光反應），葉綠素吸收光能將水分解，釋露出「氧氣」。" },
  { id: 4, question: "探究植物葉片光合作用實驗中，用酒精加熱處理葉片的目的為何？", options: ["軟化葉片細胞壁", "溶解葉綠素以便觀察顏色變化", "測試葉片是否含有葡萄糖", "增加葉片吸收碘液的能力"], answer: 1, explanation: "💡 觀念解析：葉綠素溶於酒精，隔水加熱可去除葉綠素，避免影響後續碘液顯色觀察。" },
  { id: 5, question: "人體唾液澱粉酵素在下列哪一種溫度環境下，催化活性最高？", options: ["0°C (冰塊中)", "37°C (體溫環境)", "70°C (溫水中)", "100°C (沸水中)"], answer: 1, explanation: "💡 觀念解析：人體內酵素最適溫度約在體溫 37°C 左右。0°C 活性暫時抑制，100°C 永久變性失效。" },
  { id: 6, question: "有關細胞膜性質與功能的敘述，下列何者正確？", options: ["可控制物質進出細胞，具有選擇透性", "主要成分為纖維素，能支撐細胞形狀", "所有物質皆可自由通過細胞膜", "植物細胞只有細胞壁而沒有細胞膜"], answer: 0, explanation: "💡 觀念解析：細胞膜主要由脂質與蛋白質組成具選擇透性；細胞壁成分為纖維素。" },
  { id: 7, question: "擴散作用是指物質分子如何運動的現象？", options: ["由高濃度區域往低濃度區域運動", "由低濃度區域往高濃度區域運動", "必須消耗細胞 ATP 能量才能運動", "只有水分子才能進行的運動"], answer: 0, explanation: "💡 觀念解析：擴散作用是物質由高濃度往低濃度自然分布的物理現象，不需消耗能量。" },
  { id: 8, question: "將紅血球放入純水中，會發生何種現象？", options: ["細胞萎縮變小", "水份大量滲入導致細胞膨脹破裂", "細胞大小形狀保持不變", "細胞壁破裂水份流出"], answer: 1, explanation: "💡 觀念解析：純水為低滲透壓環境，水大量經滲透作用進入細胞，紅血球缺乏細胞壁保護而破裂。" },
  { id: 9, question: "植物葉片氣孔主要分佈與開閉控制，是由何種細胞負責？", options: ["表皮細胞", "葉肉細胞", "保衛細胞", "導管細胞"], answer: 2, explanation: "💡 觀念解析：保衛細胞成對存在含有葉綠體，能控制氣孔開閉與蒸散作用。" },
  { id: 10, question: "下列哪一種器官或構造，是植物進行光合作用的主要場所？", options: ["根部細胞", "莖部維管束", "葉片的葉綠體", "花瓣細胞"], answer: 2, explanation: "💡 觀念解析：葉綠體含有葉綠素，是植物吸收光能進行光合作用的主要胞器。" },
  { id: 11, question: "胃液中的胃蛋白酵素，在下列哪種 pH 值環境中活性最佳？", options: ["pH = 2 (強酸性)", "pH = 7 (中性)", "pH = 9 (弱鹼性)", "pH = 14 (強鹼性)"], answer: 0, explanation: "💡 觀念解析：胃液含有鹽酸，胃蛋白酵素適應強酸環境（pH 1.5~2.0）。" },
  { id: 12, question: "植物進行光合作用產生的葡萄糖，常轉化為何種形式儲藏？", options: ["纖維素", "澱粉", "蛋白質", "脂肪"], answer: 1, explanation: "💡 觀念解析：光合作用產生的葡萄糖會暫時轉變成不溶於水的「澱粉」儲存。" }
];

const TOTAL_QUESTIONS_PER_ROUND = 12;

// 單元題庫管理變數
let allManifestUnits = [];
let rawQuestionsByUnit = {};
let roundQuestions = [];
let currentIndex = 0;
let wrongLogs = [];
let isLocked = false;
let oxygen = 100;

// 動態黑洞逼近與航行變數
let shipProgress = 0;      // 0% ~ 100%
let blackholeProgress = 0; // 0% ~ 100%
let blackholeTimer = null;

// 音效與音樂控制
let soundEnabled = true;
let musicEnabled = true;
let heartbeatLoopTimer = null;
let bgmTimer = null;

// Web Audio API 聲效
let audioCtx = null;

// Canvas 星空與黑洞視效變數
let canvas = null;
let ctx = null;
let stars = [];
let blackholeParticles = [];
let animFrameId = null;

function unlockAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(e => {});
  }
}

// 綁定全域點擊/按鍵事件，確保瀏覽器在任何使用者互動時即刻解鎖 AudioContext
['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    unlockAudioContext();
  }, { passive: true });
});

function playTone(freq, type, duration, delay = 0, vol = 0.15) {
  if (!soundEnabled) return;
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

function playBoostSound() {
  playTone(400, "triangle", 0.08, 0, 0.18);
  playTone(600, "sine", 0.12, 0.06, 0.22);
  playTone(880, "sine", 0.18, 0.14, 0.28);
}

function playAlarmSound() {
  playTone(220, "sawtooth", 0.25, 0, 0.35);
  playTone(160, "sawtooth", 0.35, 0.2, 0.4);
}

function playTickSound() {
  playTone(1000, "sine", 0.05, 0, 0.15);
}

function playGameOverSound() {
  if (!soundEnabled) return;
  unlockAudioContext();
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.9);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.9);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.9);
  } catch (e) {}
}

function playVictorySound() {
  [523, 659, 784, 1046].forEach((freq, idx) => {
    playTone(freq, "square", 0.12, idx * 0.08, 0.2);
  });
}

// 💓 雙擊心跳聲 ("Lub-Dub" 咚-咚) 專用諧波合成器，確保低音與中高音在任何喇叭上都清晰巨大
function playHeartbeatDoublePulse(baseFreq = 160, isPanic = false) {
  if (!soundEnabled) return;
  unlockAudioContext();
  try {
    const now = audioCtx.currentTime;
    
    // 第一重音 Lub (咚)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // 加上中頻 Click 聲讓手持裝置/小喇叭也能清脆聽到「答！」
    const oscClick1 = audioCtx.createOscillator();
    const gainClick1 = audioCtx.createGain();
    oscClick1.type = "triangle";
    oscClick1.frequency.setValueAtTime(800, now);
    oscClick1.frequency.exponentialRampToValueAtTime(200, now + 0.03);
    gainClick1.gain.setValueAtTime(0.18, now);
    gainClick1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    oscClick1.connect(gainClick1);
    gainClick1.connect(audioCtx.destination);
    oscClick1.start(now);
    oscClick1.stop(now + 0.03);

    // 第二重音 Dub (咚) - 80ms 後
    const delay2 = 0.08;
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(baseFreq * 1.25, now + delay2);
    osc2.frequency.exponentialRampToValueAtTime(70, now + delay2 + 0.09);
    gain2.gain.setValueAtTime(0.32, now + delay2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + delay2 + 0.09);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + delay2);
    osc2.stop(now + delay2 + 0.09);

    // 若處於極度危險 (gap <= 15%)，加疊 880Hz 蜂鳴警報聲
    if (isPanic) {
      playTone(880, "sawtooth", 0.06, 0.02, 0.2);
    }
  } catch (e) {}
}

// 💓 動態加速度心跳/滴答聲音效系統 (根據黑洞距離自動調速)
function updateDynamicHeartbeatSound() {
  if (heartbeatLoopTimer) clearTimeout(heartbeatLoopTimer);
  if (!soundEnabled || currentIndex >= roundQuestions.length) return;

  const gap = shipProgress - blackholeProgress;
  let intervalMs = 1000;
  let basePitch = 140;

  if (gap <= 15) {
    intervalMs = 260; // 極速狂跳 答!答!答!答! (BPM ~230)
    basePitch = 220;
  } else if (gap <= 35) {
    intervalMs = 520; // 加速心跳 (BPM ~115)
    basePitch = 180;
  } else {
    intervalMs = 1000; // 悠緩平穩 (BPM ~60)
    basePitch = 140;
  }

  // 只要音效開啟，就算在 answer 鎖定過渡期間也播放心跳，且【絕對不要】因為 isLocked 就終止計時器迴圈！
  if (!isLocked) {
    playHeartbeatDoublePulse(basePitch, gap <= 15);
  }

  heartbeatLoopTimer = setTimeout(updateDynamicHeartbeatSound, intervalMs);
}

// 🎵 Synthwave 背景音樂 (BGM) 電晶體風格
function playBGMStep() {
  if (bgmTimer) clearTimeout(bgmTimer);
  if (!musicEnabled || currentIndex >= roundQuestions.length) return;
  const notes = [130, 164, 196, 261, 220, 196];
  const step = Math.floor(Date.now() / 400) % notes.length;
  if (!isLocked) {
    playTone(notes[step], "sine", 0.18, 0, 0.08);
  }
  bgmTimer = setTimeout(playBGMStep, 400);
}

function toggleSound() {
  unlockAudioContext();
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("btnSound");
  if (btn) btn.innerText = soundEnabled ? "🔊 音效 (開啟)" : "🔇 音效關";
  if (soundEnabled) {
    updateDynamicHeartbeatSound();
  } else {
    if (heartbeatLoopTimer) clearTimeout(heartbeatLoopTimer);
  }
}

function toggleMusic() {
  unlockAudioContext();
  musicEnabled = !musicEnabled;
  const btn = document.getElementById("btnMusic");
  if (btn) btn.innerText = musicEnabled ? "🎵 音樂 (開啟)" : "🔇 音樂關";
  if (musicEnabled) {
    playBGMStep();
  } else {
    if (bgmTimer) clearTimeout(bgmTimer);
  }
}

function triggerScreenShake() {
  const body = document.getElementById("gameBody");
  if (body) {
    body.classList.remove("shake");
    void body.offsetWidth;
    body.classList.add("shake");
    setTimeout(() => body.classList.remove("shake"), 450);
  }
}

// 陣列洗牌演算法
function shuffleArray(arr) {
  let pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// 📚 載入清單 (Manifest) 並支援多單元切換
async function loadManifestAndUnits() {
  const selectUnit = document.getElementById("selectUnit");
  const unitInfoText = document.getElementById("unitInfoText");
  const lblUnit = document.getElementById("lblUnit");

  const manifestPaths = [
    "../questions/manifest.json",
    "questions/manifest.json",
    "manifest.json"
  ];

  let manifest = null;
  for (const p of manifestPaths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        manifest = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (selectUnit) selectUnit.innerHTML = "";

  if (manifest && manifest.units) {
    allManifestUnits = manifest.units;

    const allOpt = document.createElement("option");
    allOpt.value = "ALL";
    allOpt.textContent = "🌱 全單元綜合大亂鬥 (1~10單元混合)";
    if (selectUnit) selectUnit.appendChild(allOpt);

    allManifestUnits.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.file;
      opt.textContent = u.title;
      if (selectUnit) selectUnit.appendChild(opt);
    });

    for (const u of allManifestUnits) {
      const paths = [`../questions/${u.file}`, `questions/${u.file}`, u.file];
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const data = await res.json();
            rawQuestionsByUnit[u.file] = data.questions || [];
            break;
          }
        } catch (e) {}
      }
    }
  } else {
    const opt = document.createElement("option");
    opt.value = "unit10_enzymes.json";
    opt.textContent = "國中生物：酵素、細胞與能量作用評量";
    if (selectUnit) selectUnit.appendChild(opt);
    rawQuestionsByUnit["unit10_enzymes.json"] = FALLBACK_QUESTION_BANK;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const targetUnit = urlParams.get("unit") || urlParams.get("file") || "ALL";
  if (selectUnit) {
    if (Array.from(selectUnit.options).some(opt => opt.value === targetUnit)) {
      selectUnit.value = targetUnit;
    }
    selectUnit.addEventListener("change", () => {
      initGame();
    });
  }

  if (lblUnit) lblUnit.innerText = "生物星際逃亡";
  initGame();
}

function getQuestionsForSelectedUnit() {
  const selectUnit = document.getElementById("selectUnit");
  const selectedValue = selectUnit ? selectUnit.value : "ALL";
  const unitInfoText = document.getElementById("unitInfoText");

  let sourcePool = [];

  if (selectedValue === "ALL") {
    Object.values(rawQuestionsByUnit).forEach(list => sourcePool.push(...list));
    if (sourcePool.length === 0) sourcePool = FALLBACK_QUESTION_BANK;
    if (unitInfoText) unitInfoText.innerText = "🌱 當前關卡：全單元綜合大亂鬥 (1~10單元混合)";
  } else {
    sourcePool = rawQuestionsByUnit[selectedValue] || FALLBACK_QUESTION_BANK;
    const selectedOpt = selectUnit.options[selectUnit.selectedIndex];
    if (unitInfoText && selectedOpt) unitInfoText.innerText = `🌱 當前關卡：${selectedOpt.textContent}`;
  }

  return shuffleArray(sourcePool).slice(0, TOTAL_QUESTIONS_PER_ROUND);
}

// 初始化遊戲狀態
function initGame() {
  if (blackholeTimer) clearInterval(blackholeTimer);
  if (heartbeatLoopTimer) clearTimeout(heartbeatLoopTimer);
  if (bgmTimer) clearTimeout(bgmTimer);
  
  roundQuestions = getQuestionsForSelectedUnit();
  currentIndex = 0;
  wrongLogs = [];
  oxygen = 100;
  shipProgress = 0;
  blackholeProgress = 0;
  isLocked = false;

  document.getElementById("endScreen").style.display = "none";
  document.getElementById("cooldownModal").classList.remove("active");
  document.getElementById("gameHeader").style.display = "flex";
  document.getElementById("gameMain").style.display = "flex";

  updateUI();
  renderQuestion();
  startBlackholeTensionTimer();
  updateDynamicHeartbeatSound();
  if (musicEnabled) playBGMStep();
}

// 動態黑洞逼近計時器（每 3 秒逼近 1.2%）
function startBlackholeTensionTimer() {
  if (blackholeTimer) clearInterval(blackholeTimer);
  blackholeTimer = setInterval(() => {
    if (isLocked || currentIndex >= roundQuestions.length) return;
    blackholeProgress = Math.min(100, blackholeProgress + 1.2);
    updateUI();
    checkFailState();
  }, 3000);
}

// 渲染當前題目
function renderQuestion() {
  if (currentIndex >= roundQuestions.length) {
    finishGame(true);
    return;
  }
  const q = roundQuestions[currentIndex];
  document.getElementById("qText").innerText = `${currentIndex + 1}. ${q.question}`;
  
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn${i}`);
    const textSpan = btn.querySelector(".opt-text");
    if (textSpan) textSpan.innerText = q.options[i] || "-";
    else btn.innerText = q.options[i] || "-";
    btn.disabled = false;
  }
  isLocked = false;
}

// 作答判定
function handleSelect(selectedIndex) {
  unlockAudioContext();
  if (isLocked) return;
  isLocked = true;

  const q = roundQuestions[currentIndex];
  if (selectedIndex === q.answer) {
    playBoostSound();
    currentIndex++;
    shipProgress = Math.min(100, Math.round((currentIndex / TOTAL_QUESTIONS_PER_ROUND) * 100));
    updateUI();
    
    if (currentIndex >= TOTAL_QUESTIONS_PER_ROUND) {
      setTimeout(() => finishGame(true), 300);
    } else {
      setTimeout(renderQuestion, 250);
    }
  } else {
    triggerScreenShake();
    playAlarmSound();
    oxygen = Math.max(0, oxygen - 15);
    shipProgress = Math.max(0, shipProgress - 5);
    blackholeProgress = Math.min(100, blackholeProgress + 3);

    if (!wrongLogs.some(item => item.id === q.id)) {
      wrongLogs.push({
        question: q.question,
        userAnswer: q.options[selectedIndex] || "未選擇",
        correctAnswer: q.options[q.answer] || "",
        explanation: q.explanation
      });
    }

    updateUI();
    if (!checkFailState()) {
      triggerCooldown(q.explanation);
    }
  }
}

// 檢查被黑洞吞噬或氧氣歸零 Failure 狀態
function checkFailState() {
  if (oxygen <= 0 || (currentIndex > 0 && blackholeProgress >= shipProgress + 5)) {
    finishGame(false);
    return true;
  }
  return false;
}

// 冷卻鎖定倒數
function triggerCooldown(explanation) {
  const modal = document.getElementById("cooldownModal");
  const cdTimer = document.getElementById("cdTimer");
  document.getElementById("cdExplanation").innerText = explanation;
  modal.classList.add("active");

  let count = 5;
  cdTimer.innerText = count;
  playTickSound();

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      cdTimer.innerText = count;
      playTickSound();
    } else {
      clearInterval(interval);
      modal.classList.remove("active");
      isLocked = false;
    }
  }, 1000);
}

// 更新頂部儀表板與黑洞警報邊框
function updateUI() {
  document.getElementById("progressBar").style.width = `${shipProgress}%`;
  document.getElementById("shipIcon").style.left = `${shipProgress}%`;
  
  document.getElementById("blackholeBar").style.width = `${blackholeProgress}%`;
  document.getElementById("blackholeIcon").style.left = `${blackholeProgress}%`;

  document.getElementById("lblOxygen").innerText = `維生氧氣：${oxygen}%`;
  document.getElementById("lblDistance").innerText = `🚀 躍遷進度: ${shipProgress}% / ⚫ 黑洞逼近: ${blackholeProgress}%`;

  const criticalAlert = document.getElementById("criticalAlert");
  const warningBanner = document.getElementById("warningBanner");
  const gap = shipProgress - blackholeProgress;

  if (gap <= 20 && currentIndex > 0) {
    if (criticalAlert) criticalAlert.classList.add("danger-flash");
    if (warningBanner) warningBanner.classList.remove("hidden");
  } else {
    if (criticalAlert) criticalAlert.classList.remove("danger-flash");
    if (warningBanner) warningBanner.classList.add("hidden");
  }

  updateCertCode();
}

// 🛡️ 官方防偽認證碼與證書產生器
function updateCertCode() {
  const seatInput = document.getElementById("inputSeatNo");
  const nameInput = document.getElementById("inputStudentName");
  const certCodeValue = document.getElementById("certCodeValue");

  if (!certCodeValue) return;

  const seat = (seatInput && seatInput.value.trim()) || "70105號";
  const name = (nameInput && nameInput.value.trim()) || "黑洞逃亡領航員";
  const str = `${seat}-${name}-${shipProgress}-${blackholeProgress}-${oxygen}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  const code = Math.abs(hash).toString(16).toUpperCase().padStart(4, "0");
  certCodeValue.textContent = `BLACKHOLE-${code}-${seat}`;
}

function copyCertificationData() {
  const seatInput = document.getElementById("inputSeatNo");
  const nameInput = document.getElementById("inputStudentName");
  const reflectionInput = document.getElementById("inputReflection");
  const certCodeValue = document.getElementById("certCodeValue");

  const seat = (seatInput && seatInput.value.trim()) || "70105號";
  const name = (nameInput && nameInput.value.trim()) || "黑洞逃亡領航員";
  const reflection = (reflectionInput && reflectionInput.value.trim()) || "今天黑洞逃亡中複習了酵素專一性與細胞膜運輸作用。";
  const certCode = (certCodeValue && certCodeValue.textContent) || "BLACKHOLE-0000-70105";

  const text = `【生物星際大逃亡：逃離黑洞 - 課堂通關證書】\n` +
    `👤 領航員：${seat} ${name}\n` +
    `🚀 躍遷進度：${shipProgress}%\n` +
    `⚫ 黑洞威脅：${blackholeProgress}%\n` +
    `💖 維生氧氣：${oxygen}%\n` +
    `📝 課堂心得與檢討：${reflection}\n` +
    `🛡️ Google Classroom 官方防偽認證碼：${certCode}`;

  navigator.clipboard.writeText(text).then(() => {
    alert("✅ 防偽認證證書與心得文字已成功複製！可直接上傳繳交至 Google Classroom！");
  }).catch(() => {
    alert("複製失敗，請手動複製以下內容：\n\n" + text);
  });
}

// 結算畫面 (Success vs Failure)
function finishGame(isSuccess) {
  if (blackholeTimer) clearInterval(blackholeTimer);
  if (heartbeatLoopTimer) clearTimeout(heartbeatLoopTimer);
  if (bgmTimer) clearTimeout(bgmTimer);
  isLocked = true;

  const criticalAlert = document.getElementById("criticalAlert");
  if (criticalAlert) criticalAlert.classList.remove("danger-flash");

  document.getElementById("gameHeader").style.display = "none";
  document.getElementById("gameMain").style.display = "none";
  document.getElementById("cooldownModal").classList.remove("active");
  document.getElementById("endScreen").style.display = "flex";

  const endTitle = document.getElementById("endTitle");
  const endSubtitle = document.getElementById("endSubtitle");
  const reviewBody = document.getElementById("reviewBody");

  reviewBody.innerHTML = "";

  if (isSuccess) {
    playVictorySound();
    endTitle.className = "end-title-success";
    endTitle.innerText = "🎉 躍遷成功！成功逃離黑洞引力圈！";
    endSubtitle.innerText = `方舟號順利抵達安全星系，累積解開 ${currentIndex} 題觀念。黑盒子紀錄如下：`;
  } else {
    playGameOverSound();
    endTitle.className = "end-title-fail";
    endTitle.innerText = "💥 引擎過載！方舟號被黑洞引力吞噬！";
    endSubtitle.innerText = `維生氧氣竭盡或黑洞引力吞噬失聯。以下為失誤黑盒子修正紀錄：`;
  }

  if (wrongLogs.length === 0) {
    reviewBody.innerHTML = "<tr><td colspan='2' style='text-align:center; color:#2ed573; padding:20px; font-weight:bold;'>🎖️ 完美星際領航員！本次任務零失誤通關，獲得 S 級認證！</td></tr>";
  } else {
    wrongLogs.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td style="vertical-align:top; font-weight:bold;">${item.question}<br><span style="color:#ff4757; font-size:0.85rem;">您的回答：${item.userAnswer}</span></td><td style="color:#7bed9f; line-height:1.5;">${item.explanation}</td>`;
      reviewBody.appendChild(tr);
    });
  }

  updateCertCode();
}

// 🌌 Canvas 太空星空與黑洞漩渦動態渲染
function initSpaceCanvas() {
  canvas = document.getElementById("spaceCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 2 + 0.5
    });
  }

  blackholeParticles = [];
  for (let i = 0; i < 40; i++) {
    blackholeParticles.push({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 120 + 20,
      speed: Math.random() * 0.03 + 0.01,
      size: Math.random() * 3 + 1
    });
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    stars.forEach(s => {
      s.x -= s.speed * 2;
      if (s.x < 0) s.x = canvas.width;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    const bhX = (blackholeProgress / 100) * (canvas.width * 0.4) - 40;
    const bhY = canvas.height / 2;

    const grad = ctx.createRadialGradient(bhX, bhY, 10, bhX, bhY, 140);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
    grad.addColorStop(0.5, "rgba(255, 71, 87, 0.3)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bhX, bhY, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff4757";
    blackholeParticles.forEach(p => {
      p.angle += p.speed;
      const px = bhX + Math.cos(p.angle) * p.radius;
      const py = bhY + Math.sin(p.angle) * p.radius;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    animFrameId = requestAnimationFrame(loop);
  }

  loop();
}

// DOM 事件監聽與初期化
document.addEventListener("DOMContentLoaded", () => {
  initSpaceCanvas();

  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn${i}`);
    if (btn) btn.addEventListener("click", () => handleSelect(i));
  }
  const btnRestart = document.getElementById("btnRestart");
  if (btnRestart) btnRestart.addEventListener("click", initGame);

  const btnSound = document.getElementById("btnSound");
  if (btnSound) btnSound.addEventListener("click", toggleSound);

  const btnMusic = document.getElementById("btnMusic");
  if (btnMusic) btnMusic.addEventListener("click", toggleMusic);

  const btnCopyCert = document.getElementById("btnCopyCert");
  if (btnCopyCert) btnCopyCert.addEventListener("click", copyCertificationData);

  const seatInput = document.getElementById("inputSeatNo");
  const nameInput = document.getElementById("inputStudentName");
  if (seatInput) seatInput.addEventListener("input", updateCertCode);
  if (nameInput) nameInput.addEventListener("input", updateCertCode);

  loadManifestAndUnits();
});
