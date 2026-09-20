/**
 * lobby.js - 遊戲大廳與 QR Code 動態產生邏輯
 */

document.addEventListener("DOMContentLoaded", () => {
  loadManifest();
  initDispatchEvents();
});

let qrcodeObj = null;

async function loadManifest() {
  const selectUnit = document.getElementById("selectUnit");
  const unitBadgesGrid = document.getElementById("unitBadgesGrid");

  try {
    const res = await fetch("questions/manifest.json");
    if (!res.ok) throw new Error("無法載入 questions/manifest.json");
    const data = await res.json();

    selectUnit.innerHTML = "";
    unitBadgesGrid.innerHTML = "";

    data.units.forEach(unit => {
      // 填入 Select
      const opt = document.createElement("option");
      opt.value = unit.file;
      opt.textContent = `${unit.id.toUpperCase()} ‧ ${unit.title}`;
      selectUnit.appendChild(opt);

      // 填入 Badge 列表
      const badge = document.createElement("div");
      badge.className = "unit-badge-item";
      badge.textContent = `📖 ${unit.title}`;
      unitBadgesGrid.appendChild(badge);
    });
  } catch (err) {
    console.error("載入題庫清單失敗:", err);
    selectUnit.innerHTML = '<option value="">題庫載入失敗</option>';
    unitBadgesGrid.innerHTML = '<div style="color:red;">題庫索引讀取失敗，請確認已放置 questions/manifest.json</div>';
  }
}

function initDispatchEvents() {
  const btnGenerateQR = document.getElementById("btnGenerateQR");
  const btnCopyUrl = document.getElementById("btnCopyUrl");

  btnGenerateQR.addEventListener("click", generateDispatchUrlAndQR);
  btnCopyUrl.addEventListener("click", copyDispatchUrl);
}

function buildDispatchUrl() {
  const selectGame = document.getElementById("selectGame").value;
  const selectUnit = document.getElementById("selectUnit").value;
  const selectMode = document.getElementById("selectMode").value;
  const checkTimerOff = document.getElementById("checkTimerOff").checked;

  const baseUrl = new URL(selectGame, window.location.href);

  if (selectUnit) baseUrl.searchParams.set("unit", selectUnit);
  if (selectMode) baseUrl.searchParams.set("mode", selectMode);
  if (checkTimerOff) baseUrl.searchParams.set("timer", "off");

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
