/**
 * lobby.js - 遊戲大廳與 QR Code 動態產生與多版本題庫摺疊卡片邏輯
 */

document.addEventListener("DOMContentLoaded", () => {
  loadManifest();
  initDispatchEvents();
});

let qrcodeObj = null;

async function loadManifest() {
  const selectUnit = document.getElementById("selectUnit");
  const container = document.getElementById("publisherSectionsContainer");

  try {
    const res = await fetch("questions/manifest.json");
    if (!res.ok) throw new Error("無法載入 questions/manifest.json");
    const data = await res.json();

    selectUnit.innerHTML = "";
    if (container) container.innerHTML = "";

    if (data.publishers && Array.isArray(data.publishers)) {
      // 1. Fill Select with optgroups
      data.publishers.forEach(pub => {
        if (pub.status === "placeholder") return;
        pub.semesters.forEach(sem => {
          if (!sem.units || sem.units.length === 0) return;
          const group = document.createElement("optgroup");
          group.label = `${pub.name} - ${sem.name}`;
          sem.units.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u.file;
            opt.textContent = `${u.title}`;
            group.appendChild(opt);
          });
          selectUnit.appendChild(group);
        });
      });

      // 2. Render Publisher Cards
      renderPublisherCards(data.publishers, container);
    } else if (data.units) {
      // Fallback for flat array
      data.units.forEach(unit => {
        const opt = document.createElement("option");
        opt.value = unit.file;
        opt.textContent = `${unit.id.toUpperCase()} ‧ ${unit.title}`;
        selectUnit.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("載入題庫清單失敗:", err);
    selectUnit.innerHTML = '<option value="">題庫載入失敗</option>';
    if (container) container.innerHTML = '<div style="color:red; padding:16px;">題庫索引讀取失敗，請確認已放置 questions/manifest.json</div>';
  }
}

function renderPublisherCards(publishers, container) {
  if (!container) return;

  publishers.forEach(pub => {
    const card = document.createElement("div");
    card.className = "publisher-card";

    const isPlaceholder = pub.status === "placeholder";
    const defaultExpanded = pub.id === "hanlin"; // 翰林預設展開，康軒與南一預設收回

    const totalCount = pub.semesters ? pub.semesters.reduce((acc, s) => acc + (s.units ? s.units.length : 0), 0) : 0;
    const countBadge = isPlaceholder 
      ? `<span class="badge-placeholder">${pub.statusText || '(預留擴充 / 暫無試題)'}</span>` 
      : `<span class="badge-active">共 ${totalCount} 個題庫單元</span>`;

    const header = document.createElement("div");
    header.className = "publisher-header";
    header.innerHTML = `
      <div class="publisher-title">
        <h3>🏫 ${pub.name} ${countBadge}</h3>
      </div>
      <button class="btn-toggle-publisher" aria-expanded="${defaultExpanded}">
        ${defaultExpanded ? '收回 🔼' : '展開 🔽'}
      </button>
    `;

    const content = document.createElement("div");
    content.className = `publisher-content ${defaultExpanded ? '' : 'collapsed'}`;

    if (isPlaceholder) {
      content.innerHTML = `
        <div class="placeholder-notice">
          <p>📌 <strong>${pub.name}</strong> 題庫區域已預留擴充，目前暫無試題檔案。未來新增 Word 試題時可自動匯入。</p>
        </div>
      `;
    } else {
      pub.semesters.forEach(sem => {
        const semSection = document.createElement("div");
        semSection.className = "semester-section";

        let semIcon = "📘";
        if (sem.name === "7下") semIcon = "📙";
        if (sem.name === "快閃特輯") semIcon = "⚡";

        if (sem.status === "placeholder" || !sem.units || sem.units.length === 0) {
          semSection.innerHTML = `
            <h4 class="semester-title">${semIcon} ${sem.name} <span class="badge-placeholder" style="margin-left:8px;">${sem.statusText || '(預留擴充 / 暫無試題)'}</span></h4>
            <div class="placeholder-notice" style="padding:10px 14px; font-size:0.9rem; background:#f5f5f5; border-radius:8px; color:#616161;">
              📌 <strong>${pub.name} ${sem.name}</strong> 題庫區域已預留擴充，目前暫無試題檔案。
            </div>
          `;
          content.appendChild(semSection);
          return;
        }

        semSection.innerHTML = `
          <h4 class="semester-title">${semIcon} ${sem.name} (${sem.units.length} 個題庫)</h4>
          <div class="unit-badges-grid">
            ${sem.units.map(u => `<div class="unit-badge-item" title="${u.file}">📖 ${u.title}</div>`).join('')}
          </div>
        `;
        content.appendChild(semSection);
      });
    }

    card.appendChild(header);
    card.appendChild(content);
    container.appendChild(card);

    // 切換展開/收回事件
    const toggleBtn = header.querySelector(".btn-toggle-publisher");
    toggleBtn.addEventListener("click", () => {
      const isCollapsed = content.classList.contains("collapsed");
      if (isCollapsed) {
        content.classList.remove("collapsed");
        toggleBtn.innerHTML = "收回 🔼";
        toggleBtn.setAttribute("aria-expanded", "true");
      } else {
        content.classList.add("collapsed");
        toggleBtn.innerHTML = "展開 🔽";
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function initDispatchEvents() {
  const btnGenerateQR = document.getElementById("btnGenerateQR");
  const btnCopyUrl = document.getElementById("btnCopyUrl");
  const selectQCount = document.getElementById("selectQCount");
  const inputCustomQCount = document.getElementById("inputCustomQCount");
  const btnPreviewQuestions = document.getElementById("btnPreviewQuestions");
  const btnRerollQuestions = document.getElementById("btnRerollQuestions");
  const btnClosePreview = document.getElementById("btnClosePreview");
  const previewQuestionsArea = document.getElementById("previewQuestionsArea");
  const selectUnit = document.getElementById("selectUnit");

  if (selectQCount && inputCustomQCount) {
    selectQCount.addEventListener("change", () => {
      if (selectQCount.value === "custom") {
        inputCustomQCount.style.display = "inline-block";
        inputCustomQCount.focus();
      } else {
        inputCustomQCount.style.display = "none";
      }
      if (previewQuestionsArea && !previewQuestionsArea.classList.contains("hidden")) {
        loadAndRenderPreview(false);
      }
    });
  }

  if (inputCustomQCount) {
    inputCustomQCount.addEventListener("input", () => {
      if (previewQuestionsArea && !previewQuestionsArea.classList.contains("hidden")) {
        loadAndRenderPreview(false);
      }
    });
  }

  if (selectUnit) {
    selectUnit.addEventListener("change", () => {
      if (previewQuestionsArea && !previewQuestionsArea.classList.contains("hidden")) {
        loadAndRenderPreview(false);
      }
    });
  }

  if (btnPreviewQuestions) {
    btnPreviewQuestions.addEventListener("click", () => loadAndRenderPreview(false));
  }

  if (btnRerollQuestions) {
    btnRerollQuestions.addEventListener("click", () => loadAndRenderPreview(true));
  }

  if (btnClosePreview && previewQuestionsArea) {
    btnClosePreview.addEventListener("click", () => {
      previewQuestionsArea.classList.add("hidden");
    });
  }

  if (btnGenerateQR) btnGenerateQR.addEventListener("click", generateDispatchUrlAndQR);
  if (btnCopyUrl) btnCopyUrl.addEventListener("click", copyDispatchUrl);
}

// 題庫記憶快取：記錄各單元經過嚴格校驗且合法的題目清單與過濾數
const cachedQuestionsMap = new Map();

function escapeHtml(str) {
  if (typeof str !== "string") return String(str || "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 判定試題是否有明確且合法的正解索引 (0~N-1)
function getCorrectAnswerIndex(q) {
  if (!q || !Array.isArray(q.options) || q.options.length < 2) return -1;
  if (typeof q.answer === "number" && q.answer >= 0 && q.answer < q.options.length && Boolean(q.options[q.answer])) {
    return q.answer;
  }
  if (typeof q.answer === "string") {
    const trimmed = q.answer.trim().toUpperCase();
    const idx = ["A", "B", "C", "D"].indexOf(trimmed);
    if (idx >= 0 && idx < q.options.length && Boolean(q.options[idx])) {
      return idx;
    }
    const directIdx = q.options.findIndex(opt => opt && opt.trim() === q.answer.trim());
    if (directIdx >= 0) return directIdx;
  }
  return -1;
}

// 嚴格校驗題庫：過濾題目內容不全、選項不足、或缺乏明確正解的無效題，並針對題幹自動去重
function sanitizeAndDedupeQuestions(list) {
  if (!Array.isArray(list)) return { valid: [], discardedCount: 0 };
  let discardedCount = 0;
  const seenStems = new Set();
  const valid = [];

  for (const q of list) {
    if (!q || !q.question || typeof q.question !== "string" || !Array.isArray(q.options) || q.options.length < 2) {
      discardedCount++;
      continue;
    }
    const correctIdx = getCorrectAnswerIndex(q);
    if (correctIdx === -1) {
      discardedCount++;
      continue;
    }
    const stemKey = q.question.trim();
    if (seenStems.has(stemKey)) {
      continue; // 自動剔除重複題目
    }
    seenStems.add(stemKey);

    // 標準化題型物件
    valid.push({
      ...q,
      answer: correctIdx
    });
  }
  return { valid, discardedCount };
}

// Fisher-Yates 真隨機洗牌演算
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 載入、校驗並即時預覽派卷試題 (支援換一批抽題)
async function loadAndRenderPreview(forceReroll = false) {
  const selectUnit = document.getElementById("selectUnit");
  const previewArea = document.getElementById("previewQuestionsArea");
  const previewList = document.getElementById("previewQuestionsList");
  const previewCountBadge = document.getElementById("previewCountBadge");
  const previewStatusBadge = document.getElementById("previewStatusBadge");

  if (!selectUnit || !previewArea || !previewList) return;

  const unitFile = selectUnit.value;
  if (!unitFile) {
    alert("請先於步驟 2 選擇生物題庫單元！");
    return;
  }

  const targetCount = parseInt(getSelectedQCount(), 10) || 10;

  previewArea.classList.remove("hidden");
  previewList.innerHTML = `<div style="text-align:center; padding:24px; color:#64748b; font-weight:700;">🔄 正在載入題庫並執行嚴格校驗 (審核答案與過濾無效題)...</div>`;
  previewArea.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    let cached = cachedQuestionsMap.get(unitFile);

    if (!cached || !cached.pool || cached.pool.length === 0) {
      const res = await fetch(`questions/${unitFile}`);
      if (!res.ok) throw new Error(`無法載入題庫檔案: questions/${unitFile}`);
      const data = await res.json();
      const rawList = data.questions || (Array.isArray(data) ? data : []);
      const { valid, discardedCount } = sanitizeAndDedupeQuestions(rawList);
      cached = { pool: valid, discardedCount };
      cachedQuestionsMap.set(unitFile, cached);
    }

    const { pool: allValid, discardedCount } = cached;

    if (!allValid || allValid.length === 0) {
      previewList.innerHTML = `<div style="color:#ef4444; font-weight:700; padding:16px;">⚠️ 此單元目前無可用的有效試題。</div>`;
      previewStatusBadge.innerHTML = `<span style="color:#ef4444;">⚠️ 無有效試題</span>`;
      return;
    }

    // Fisher-Yates 抽題打亂
    const shuffled = shuffleArray(allValid);
    const selectedQuestions = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    // 更新 Badge 狀態
    previewCountBadge.textContent = selectedQuestions.length;
    if (discardedCount > 0) {
      previewStatusBadge.innerHTML = `<span style="color:#059669; font-weight:700;">✅ 已通過嚴格校驗 (已自動過濾 ${discardedCount} 題異常/無答案題目，全數題皆含標準答案)</span>`;
    } else {
      previewStatusBadge.innerHTML = `<span style="color:#059669; font-weight:700;">✅ 所有試題皆通過嚴格校驗：100% 具備標準答案與有效選項，零無效題</span>`;
    }

    // 繪製試題清單卡片
    const optLabels = ["A", "B", "C", "D", "E", "F"];
    let html = "";

    selectedQuestions.forEach((q, idx) => {
      const correctIdx = q.answer;
      const optionsHtml = q.options.map((opt, oIdx) => {
        const isCorrect = oIdx === correctIdx;
        const label = optLabels[oIdx] || (oIdx + 1);
        if (isCorrect) {
          return `
            <div style="background:#ecfdf5; border:1.5px solid #10b981; color:#065f46; font-weight:700; border-radius:8px; padding:6px 12px; margin:3px 0; display:flex; justify-content:space-between; align-items:center;">
              <span><strong>(${label})</strong> ${escapeHtml(opt)}</span>
              <span style="background:#10b981; color:#fff; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:800; white-space:nowrap;">🟢 標準正解</span>
            </div>
          `;
        } else {
          return `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; color:#334155; border-radius:8px; padding:6px 12px; margin:3px 0;">
              <strong>(${label})</strong> ${escapeHtml(opt)}
            </div>
          `;
        }
      }).join('');

      const expHtml = q.explanation ? `
        <div style="font-size:0.85rem; color:#475569; background:#f1f5f9; border-left:3px solid #0284c7; padding:6px 10px; margin-top:6px; border-radius:0 6px 6px 0; line-height:1.4;">
          💡 <strong>觀念解析：</strong>${escapeHtml(q.explanation)}
        </div>
      ` : '';

      html += `
        <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:10px; padding:12px 14px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="background:#0284c7; color:#fff; font-size:0.8rem; font-weight:800; padding:2px 8px; border-radius:6px;">第 ${idx + 1} 題</span>
            ${q.difficulty ? `<span style="font-size:0.75rem; color:#64748b; background:#f1f5f9; padding:2px 6px; border-radius:4px;">難易度：${escapeHtml(q.difficulty)}</span>` : ''}
          </div>
          <div style="font-size:0.95rem; font-weight:700; color:#0f172a; margin-bottom:8px; line-height:1.45;">
            ${escapeHtml(q.question)}
          </div>
          <div style="display:flex; flex-direction:column; gap:2px;">
            ${optionsHtml}
          </div>
          ${expHtml}
        </div>
      `;
    });

    previewList.innerHTML = html;

  } catch (err) {
    console.error("預覽試題失敗:", err);
    previewList.innerHTML = `<div style="color:#ef4444; font-weight:700; padding:16px;">❌ 載入試題失敗：${escapeHtml(err.message)}</div>`;
    previewStatusBadge.innerHTML = `<span style="color:#ef4444;">載入失敗</span>`;
  }
}

function getSelectedQCount() {
  const selectQCount = document.getElementById("selectQCount");
  const inputCustom = document.getElementById("inputCustomQCount");
  if (!selectQCount) return "10";

  if (selectQCount.value === "custom") {
    const val = parseInt(inputCustom ? inputCustom.value : "10", 10);
    return (isNaN(val) || val <= 0) ? "10" : val.toString();
  }
  return selectQCount.value;
}

function buildDispatchUrl() {
  const selectGame = document.getElementById("selectGame").value;
  const selectUnit = document.getElementById("selectUnit").value;
  const selectMode = document.getElementById("selectMode").value;
  const checkTimerOff = document.getElementById("checkTimerOff").checked;
  const qcount = getSelectedQCount();

  const baseUrl = new URL(selectGame, window.location.href);

  if (selectUnit) baseUrl.searchParams.set("unit", selectUnit);
  if (selectMode) baseUrl.searchParams.set("mode", selectMode);
  if (checkTimerOff) baseUrl.searchParams.set("timer", "off");
  if (qcount) baseUrl.searchParams.set("qcount", qcount);
  if (selectMode !== "projector") baseUrl.searchParams.set("student", "1");

  return baseUrl.toString();
}

function generateDispatchUrlAndQR() {
  const selectUnitElem = document.getElementById("selectUnit");
  const selectUnit = selectUnitElem ? selectUnitElem.value : "";
  if (!selectUnit) {
    if (selectUnitElem) {
      selectUnitElem.style.border = "2px solid #ef4444";
      selectUnitElem.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => { selectUnitElem.style.border = ""; }, 3000);
    }
    alert("請先於步驟 2 選擇生物題庫單元！");
    return;
  }

  const btnGenerateQR = document.getElementById("btnGenerateQR");
  if (btnGenerateQR) {
    btnGenerateQR.dataset.origText = btnGenerateQR.textContent;
    btnGenerateQR.textContent = "⚙️ 正在生成 QR Code...";
  }

  const fullUrl = buildDispatchUrl();
  const qrResultArea = document.getElementById("qrResultArea");
  const generatedUrlInput = document.getElementById("generatedUrlInput");
  const btnDirectLaunch = document.getElementById("btnDirectLaunch");
  const qrDiv = document.getElementById("qrcode");

  generatedUrlInput.value = fullUrl;
  btnDirectLaunch.href = fullUrl;

  qrDiv.innerHTML = "";

  let qrRendered = false;
  try {
    if (window.QRCode) {
      const correctLevel = (window.QRCode.CorrectLevel && window.QRCode.CorrectLevel.H) ? window.QRCode.CorrectLevel.H : 2;
      qrcodeObj = new QRCode(qrDiv, {
        text: fullUrl,
        width: 160,
        height: 160,
        colorDark: "#1b5e20",
        colorLight: "#ffffff",
        correctLevel: correctLevel
      });
      qrRendered = true;
    }
  } catch (err) {
    console.warn("本機 QRCode.js 生成異常，切換至備用圖庫生成器:", err);
  }

  // 雙重保底機制：若 QRCode.js 無法執行，自動切換至 API 二維碼圖片
  if (!qrRendered) {
    qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(fullUrl)}" alt="派發 QR Code" style="width:160px; height:160px; border-radius:8px; display:block; margin:0 auto; box-shadow:0 2px 8px rgba(0,0,0,0.15);" onerror="this.outerHTML='<div style=\'color:#15803d;font-weight:700;padding:12px;\'>📲 請點擊右方按鈕直接複製派發網址！</div>'">`;
  }

  if (qrResultArea) {
    qrResultArea.classList.remove("hidden");
    qrResultArea.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (btnGenerateQR) {
    btnGenerateQR.textContent = "✅ 已生成專屬派發 QR Code！";
    setTimeout(() => {
      btnGenerateQR.textContent = btnGenerateQR.dataset.origText || "📱 生成派發 QR Code 與網址";
    }, 2500);
  }
}

function copyDispatchUrl() {
  const selectUnit = document.getElementById("selectUnit").value;
  if (!selectUnit) {
    alert("請先於步驟 2 選擇生物題庫單元！");
    return;
  }

  const fullUrl = buildDispatchUrl();
  navigator.clipboard.writeText(fullUrl).then(() => {
    alert("✅ 已成功複製派發網址至剪貼簿！\n" + fullUrl);
  }).catch(err => {
    alert("複製失敗，請手動選擇複製：\n" + fullUrl);
  });
}
