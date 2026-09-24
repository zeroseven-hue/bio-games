/**
 * 🧬 《生物星際大逃亡：逃離黑洞》核心邏輯控制器 V1.0
 */

// 內建備用 20 題題庫（確保任何網路條件與開箱即用不中斷）
const FALLBACK_QUESTION_BANK = {
  unitTitle: "國中生物：酵素、細胞與能量作用評量",
  questions: [
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
    { id: 12, question: "植物進行光合作用產生的葡萄糖，常轉化為何種形式儲藏？", options: ["纖維素", "澱粉", "蛋白質", "脂肪"], answer: 1, explanation: "💡 觀念解析：光合作用產生的葡萄糖會暫時轉變成不溶於水的「澱粉」儲存。" },
    { id: 13, question: "用碘液測試物質時，若顏色由棕黃色轉變為藍黑色，代表含有何種成分？", options: ["葡萄糖", "蛋白質", "澱粉", "脂質"], answer: 2, explanation: "💡 觀念解析：碘液遇「澱粉」會產生專一性的藍黑色呈色反應。" },
    { id: 14, question: "人體小腸內的胰脂肪酵素，其適應的酸鹼環境為何？", options: ["強酸環境", "弱鹼性環境", "絕對中性環境", "無酸鹼適應性"], answer: 1, explanation: "💡 觀念解析：小腸環境呈弱鹼性，胰臟酵素最適 pH 值在 7.5~8.5。" },
    { id: 15, question: "葉綠素在光合作用過程中所扮演的角色為何？", options: ["供給反應所需的能量", "吸收並轉化光能", "直接分解二氧化碳", "提供化學反應所需的水分"], answer: 1, explanation: "💡 觀念解析：葉綠素負責吸收光能並將其轉化為化學能以驅動暗反應。" },
    { id: 16, question: "下列何者不屬於主動運輸（耗能運輸）的特徵？", options: ["需消耗細胞能量 (ATP)", "物質可順濃度梯度擴散", "需藉由細胞膜上的特殊蛋白質協助", "可逆著濃度梯度逆向運輸物質"], answer: 1, explanation: "💡 觀念解析：順著濃度梯度移動的是被動擴散；主動運輸可逆著濃度梯度且消耗能量。" },
    { id: 17, question: "關於酵素專一性的比喻，下列何者最為貼切？", options: ["鑰匙與鎖頭", "磁鐵與鐵釘", "水與酒精", "海綿與水分"], answer: 0, explanation: "💡 觀念解析：酵素活性中心與底物形狀互補，如同「鑰匙與鎖頭」專一匹配。" },
    { id: 18, question: "將植物葉片進行照光與遮光實驗，主要是在探究光合作用的何種變因？", options: ["水分對產物的影響", "光照對澱粉產生的影響", "二氧化碳濃度高低", "溫度對酵素活性的影響"], answer: 1, explanation: "💡 觀念解析：照光與遮光是控制「光照（自變因）」，檢驗日光是否為產生澱粉的必要條件。" },
    { id: 19, question: "呼吸作用與光合作用的比較，下列何者正確？", options: ["呼吸作用消耗氧氣釋放能量；光合作用吸收光能釋放氧氣", "兩者皆只在白天進行", "只有植物進行呼吸作用，動物不進行", "光合作用在粒線體進行；呼吸作用在葉綠體進行"], answer: 0, explanation: "💡 觀念解析：呼吸作用全天候進行消耗氧氣；光合作用吸收光能合成養分並釋放氧氣。" },
    { id: 20, question: "低溫冰凍保存肉類食物能防腐，主要原因為何？", options: ["低溫殺死了所有細菌與真菌", "低溫抑制了微生物酵素的催化活性", "肉類蛋白質在高溫下變性", "水份凍結阻斷了光合作用"], answer: 1, explanation: "💡 觀念解析：低溫抑制微生物酵素活性，減緩食物腐敗分解速率。" }
  ]
};

const JSON_FILE_PATH = "unit10_enzymes.json";
const TOTAL_QUESTIONS_PER_ROUND = 12;

let fullBankData = null;
let roundQuestions = [];
let currentIndex = 0;
let wrongLogs = [];
let isLocked = false;
let oxygen = 100;

// 動態黑洞逼近氣氛計時器
let shipProgress = 0;      // 0% ~ 100%
let blackholeProgress = 0; // 0% ~ 100%
let blackholeTimer = null;
let soundEnabled = true;

// Web Audio 音效 API
let audioCtx = null;

function unlockAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

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
  playTone(400, "triangle", 0.08, 0, 0.15);
  playTone(600, "sine", 0.12, 0.06, 0.2);
  playTone(880, "sine", 0.18, 0.14, 0.25);
}

function playAlarmSound() {
  playTone(200, "sawtooth", 0.25, 0, 0.25);
  playTone(150, "sawtooth", 0.35, 0.2, 0.3);
}

function playTickSound() {
  playTone(1000, "sine", 0.05, 0, 0.1);
}

function playGameOverSound() {
  if (!soundEnabled) return;
  unlockAudioContext();
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  } catch (e) {}
}

function playVictorySound() {
  [523, 659, 784, 1046].forEach((freq, idx) => {
    playTone(freq, "square", 0.12, idx * 0.08, 0.15);
  });
}

// Fisher-Yates 嚴格隨機洗牌演算法
function getShuffledQuestions(sourceList, pickCount) {
  let pool = [...sourceList];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(pickCount, pool.length));
}

// 載入題庫 (支援外部與內建 Fallback)
async function loadQuestionBank() {
  try {
    const response = await fetch(JSON_FILE_PATH);
    if (!response.ok) throw new Error("外部 JSON 題庫未就緒，啟動內建生物題庫");
    fullBankData = await response.json();
  } catch (err) {
    console.log("使用內建生物核心題庫：", err.message);
    fullBankData = FALLBACK_QUESTION_BANK;
  }
  document.getElementById("lblUnit").innerText = fullBankData.unitTitle || "國中生物評量";
  initGame();
}

// 初始化遊戲狀態
function initGame() {
  if (!fullBankData || !fullBankData.questions) return;
  
  if (blackholeTimer) clearInterval(blackholeTimer);
  
  roundQuestions = getShuffledQuestions(fullBankData.questions, TOTAL_QUESTIONS_PER_ROUND);
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
}

// 動態黑洞逼近計時器（每 3 秒逼近 1%）
function startBlackholeTensionTimer() {
  if (blackholeTimer) clearInterval(blackholeTimer);
  blackholeTimer = setInterval(() => {
    if (isLocked || currentIndex >= roundQuestions.length) return;
    blackholeProgress = Math.min(100, blackholeProgress + 1);
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
  if (isLocked) return;
  isLocked = true;

  const q = roundQuestions[currentIndex];
  if (selectedIndex === q.answer) {
    // 答對：推進飛船 +8.33%
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
    // 答錯：扣氧氣 15%、飛船後退 5%、黑洞逼近 3%、記進黑盒子、觸發過載冷卻
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
  // 當黑洞進度追上飛船（且已有一定題目量），或氧氣歸零
  if (oxygen <= 0 || (currentIndex > 0 && blackholeProgress >= shipProgress + 15)) {
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

// 更新頂部儀表板
function updateUI() {
  document.getElementById("progressBar").style.width = `${shipProgress}%`;
  document.getElementById("shipIcon").style.left = `${shipProgress}%`;
  
  document.getElementById("blackholeBar").style.width = `${blackholeProgress}%`;
  document.getElementById("blackholeIcon").style.left = `${blackholeProgress}%`;

  document.getElementById("lblOxygen").innerText = `維生氧氣：${oxygen}%`;
  document.getElementById("lblDistance").innerText = `🚀 躍遷進度: ${shipProgress}% / ⚫ 黑洞逼近: ${blackholeProgress}%`;
}

// 結算畫面 (Success vs Failure)
function finishGame(isSuccess) {
  if (blackholeTimer) clearInterval(blackholeTimer);
  isLocked = true;

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
    endSubtitle.innerText = `方舟號順利抵達安全星系，累積答對 ${currentIndex} 題。黑盒子紀錄如下：`;
  } else {
    playGameOverSound();
    endTitle.className = "end-title-fail";
    endTitle.innerText = "💥 引擎過載！方舟號被黑洞引力吞噬！";
    endSubtitle.innerText = `維生氧氣竭盡或黑洞追擊失聯，共解開 ${currentIndex} 題觀念。以下為失誤黑盒子修正紀錄：`;
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
}

// DOM 事件監聽綁定
document.addEventListener("DOMContentLoaded", () => {
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn${i}`);
    if (btn) btn.addEventListener("click", () => handleSelect(i));
  }
  const btnRestart = document.getElementById("btnRestart");
  if (btnRestart) btnRestart.addEventListener("click", initGame);

  loadQuestionBank();
});
