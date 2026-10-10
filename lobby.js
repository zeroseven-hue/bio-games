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
        if (!sem.units || sem.units.length === 0) return;

        const semSection = document.createElement("div");
        semSection.className = "semester-section";

        let semIcon = "📘";
        if (sem.name === "7下") semIcon = "📙";
        if (sem.name === "快閃特輯") semIcon = "⚡";

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

  if (selectQCount && inputCustomQCount) {
    selectQCount.addEventListener("change", () => {
      if (selectQCount.value === "custom") {
        inputCustomQCount.style.display = "inline-block";
        inputCustomQCount.focus();
      } else {
        inputCustomQCount.style.display = "none";
      }
    });
  }

  if (btnGenerateQR) btnGenerateQR.addEventListener("click", generateDispatchUrlAndQR);
  if (btnCopyUrl) btnCopyUrl.addEventListener("click", copyDispatchUrl);
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

  return baseUrl.toString();
}

function generateDispatchUrlAndQR() {
  const fullUrl = buildDispatchUrl();
  const qrResultArea = document.getElementById("qrResultArea");
  const generatedUrlInput = document.getElementById("generatedUrlInput");
  const btnDirectLaunch = document.getElementById("btnDirectLaunch");
  const qrDiv = document.getElementById("qrcode");

  generatedUrlInput.value = fullUrl;
  btnDirectLaunch.href = fullUrl;

  qrDiv.innerHTML = "";

  if (window.QRCode) {
    qrcodeObj = new QRCode(qrDiv, {
      text: fullUrl,
      width: 160,
      height: 160,
      colorDark: "#1b5e20",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  } else {
    qrDiv.textContent = "QRCode 庫載入失敗";
  }

  qrResultArea.classList.remove("hidden");
  qrResultArea.scrollIntoView({ behavior: "smooth" });
}

function copyDispatchUrl() {
  const fullUrl = buildDispatchUrl();
  navigator.clipboard.writeText(fullUrl).then(() => {
    alert("✅ 已成功複製派發網址至剪貼簿！\n" + fullUrl);
  }).catch(err => {
    alert("複製失敗，請手動選擇複製：\n" + fullUrl);
  });
}
