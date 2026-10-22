/**
 * ==========================================================================
 * 🌿 國中生物快閃測驗後端服務與即時教師儀表板（復古琥珀金版 - 旗艦升級）
 * 包含：
 * 1. 方案 A：依測驗範圍（如「南一版 (2-3 植物如何製造養分)」）自動建立獨立分頁
 * 2. 智慧整理最優成績：前三欄依序為【座號】、【姓名】、【採計總分(最高分)】，方便老師一秒複製登記！
 * 3. 學生就地更新 (In-Place Update)：同生交卷/訂正/加分增量更新最高分，不製造多列重複
 * 4. 自動座號排序：自動按座號 01~35 順號排列，與學校點名冊 100% 吻合
 * 5. 班級格式全面相容：710 班與 7年10班 自動匹配，大螢幕點名卡片即時亮綠燈
 * 6. 原有完整功能全數保留：左上請假角標、深色模式、導師分數遮蔽、手動補登彈窗、CSV匯出、未交名單複製
 * ==========================================================================
 */

// 1. 清洗分頁名稱（排除試算表禁止字元 \ / ? * : [ ] 並限制 50 字）
function cleanSheetName(rawUnits) {
  if (!rawUnits) return "測驗成績紀錄";
  var clean = String(rawUnits).replace(/[\\\/?:*\[\]]/g, "-").trim();
  if (clean.length > 50) clean = clean.substring(0, 50);
  return clean || "測驗成績紀錄";
}

// 2. 座號補零標準化（例如 "2" -> "02號"，確保排序與比對一致）
function formatSeatWithPadding(seatStr) {
  if (!seatStr) return "";
  var match = String(seatStr).match(/\d+/);
  if (!match) return String(seatStr).trim();
  return String(match[0]).padStart(2, "0") + "號";
}

// 3. 班級字串正規化（相容 "710"、"7年10班"、"七年十班"、"710班"）
function normalizeClassStr(input) {
  if (!input) return "";
  var s = String(input).trim();
  var digits = s.match(/\d+/g);
  if (digits) {
    if (digits.length >= 2) return digits[0] + digits[1].padStart(2, "0");
    if (digits.length === 1 && digits[0].length === 3) return digits[0];
    if (digits.length <= 2) return "7" + digits[0].padStart(2, "0");
  }
  if (s.includes("十")) return "710";
  var cnMap = {"一":"01","二":"02","三":"03","四":"04","五":"05","六":"06","七":"07","八":"08","九":"09"};
  for (var k in cnMap) {
    if (s.includes(k)) return "7" + cnMap[k];
  }
  return s;
}

// 4. 學生測驗端提交成績 (POST) - 方案 A 自動建立分頁 + 採計最高分
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = {
        className: "710",
        seat: "01",
        name: "測試學生",
        units: "南一版 (2-3 植物如何製造養分)",
        originalScore: 100,
        finalScore: 100,
        errorCount: 0,
        keywords: "全對",
        switchCount: 0
      };
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetSheetName = cleanSheetName(data.units);
    var sheet = ss.getSheetByName(targetSheetName);
    
    // 若該單元專屬分頁不存在，自動建立並設定「最適合登記成績」的專業表頭
    if (!sheet) {
      sheet = ss.insertSheet(targetSheetName);
      sheet.appendRow([
        "座號", "姓名", "採計總分(最高分)", "班級", "交卷時間", 
        "原始得分(第1階段)", "訂正後得分(第2階段)", "加分後總分(第3階段)", 
        "錯題數", "錯題與補救訂正關鍵字", "跳出視窗次數", "狀態備註"
      ]);
      sheet.getRange(1, 1, 1, 12).setBackground("#b45309").setFontColor("#FFFFFF").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    var targetClass = String(data.className || "").trim();
    var targetClassNorm = normalizeClassStr(targetClass);
    var targetSeat = formatSeatWithPadding(data.seat);
    var targetName = String(data.name || "").trim();
    var nowTime = data.timestamp || new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
    var switchCount = data.switchCount || 0;
    var switchAlert = switchCount > 3 ? (switchCount + " 次 (警示)") : (switchCount > 0 ? switchCount + " 次" : "0 次 (正常)");
    
    // 檢查分頁欄位格式 (新格式：A=座號, B=姓名, C=採計總分...)
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0].map(function(h) { return String(h).trim(); });
    var isNewFormat = headers[0] === "座號" && headers[2] && headers[2].includes("採計");
    
    var existingRowIndex = -1;
    var existingOriginal = 0;
    var existingCorrection = 0;
    var existingBonus = 0;
    var existingBest = 0;
    
    for (var i = 1; i < rows.length; i++) {
      if (isNewFormat) {
        var rSeat = formatSeatWithPadding(rows[i][0]);
        var rName = String(rows[i][1] || "").trim();
        var rClass = String(rows[i][3] || "").trim();
        if (normalizeClassStr(rClass) === targetClassNorm && rSeat === targetSeat && rName === targetName) {
          existingRowIndex = i + 1;
          existingBest = Number(rows[i][2]) || 0;
          existingOriginal = Number(rows[i][5]) || 0;
          existingCorrection = Number(rows[i][6]) || 0;
          existingBonus = Number(rows[i][7]) || 0;
          break;
        }
      } else {
        var rClassOld = String(rows[i][1] || "").trim();
        var rSeatOld = formatSeatWithPadding(rows[i][2]);
        var rNameOld = String(rows[i][3] || "").trim();
        if (normalizeClassStr(rClassOld) === targetClassNorm && rSeatOld === targetSeat && rNameOld === targetName) {
          existingRowIndex = i + 1;
          existingOriginal = Number(rows[i][5]) || 0;
          existingBest = Number(rows[i][6]) || existingOriginal;
          break;
        }
      }
    }
    
    var currentOriginal = data.originalScore !== undefined ? Number(data.originalScore) : existingOriginal;
    var currentCorrection = data.isCorrectionPhase ? Number(data.finalScore || currentOriginal) : existingCorrection;
    var currentBonus = data.isFinalBonus ? Number(data.finalScore || currentCorrection) : existingBonus;
    
    // 核心最高分採計邏輯：自動取學生所有階段達到的最優最高分！
    var currentBest = Math.max(existingBest, currentOriginal, currentCorrection, currentBonus, Number(data.finalScore || 0));
    
    var statusNote = "正常繳交";
    if (data.isFinalBonus) statusNote = "🏆 已完成加分題";
    else if (data.isCorrectionPhase) statusNote = "✏️ 訂正完成送出";
    else if (data.isInitialSync) statusNote = "⚡ 第1階段成績已送出";
    
    // 情況 A：已有舊紀錄 -> 就地更新 (In-Place Update)，不製造多列重複！
    if (existingRowIndex > 0) {
      if (isNewFormat) {
        sheet.getRange(existingRowIndex, 3).setValue(currentBest); // C欄最高採計分
        sheet.getRange(existingRowIndex, 5).setValue(nowTime);
        if (data.originalScore !== undefined) sheet.getRange(existingRowIndex, 6).setValue(currentOriginal);
        if (data.isCorrectionPhase) sheet.getRange(existingRowIndex, 7).setValue(currentCorrection);
        if (data.isFinalBonus) sheet.getRange(existingRowIndex, 8).setValue(currentBonus);
        if (data.errorCount !== undefined) sheet.getRange(existingRowIndex, 9).setValue(data.errorCount);
        if (data.keywords) sheet.getRange(existingRowIndex, 10).setValue(data.keywords);
        sheet.getRange(existingRowIndex, 11).setValue(switchAlert);
        sheet.getRange(existingRowIndex, 12).setValue(statusNote);
        if (switchCount >= 3) {
          sheet.getRange(existingRowIndex, 1, 1, 12).setBackground("#FEF3C7");
        }
      } else {
        sheet.getRange(existingRowIndex, 1).setValue(nowTime);
        sheet.getRange(existingRowIndex, 6).setValue(currentOriginal);
        sheet.getRange(existingRowIndex, 7).setValue(currentBest);
        sheet.getRange(existingRowIndex, 10).setValue(switchAlert);
        sheet.getRange(existingRowIndex, 11).setValue(statusNote);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        "status": "success", 
        "message": "成績已就地更新至最高採計分：" + currentBest + "分！",
        "bestScore": currentBest,
        "isUpdate": true
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 情況 B：全新紀錄 -> 新增一列
    if (isNewFormat) {
      var newRow = [
        targetSeat,                                              // A: 座號 (01號)
        targetName,                                              // B: 姓名
        currentBest,                                             // C: 採計總分(最高分) ⭐ 老師一秒全選複製！
        targetClass,                                             // D: 班級
        nowTime,                                                 // E: 交卷時間
        currentOriginal,                                         // F: 原始得分
        data.isCorrectionPhase ? currentCorrection : "-",        // G: 訂正後得分
        data.isFinalBonus ? currentBonus : "-",                  // H: 加分後總分
        data.errorCount !== undefined ? data.errorCount : 0,     // I: 錯題數
        data.keywords || "全對無錯題",                           // J: 錯題訂正心得
        switchAlert,                                             // K: 跳視窗次數
        statusNote                                               // L: 狀態備註
      ];
      sheet.appendRow(newRow);
      
      if (switchCount >= 3) {
        sheet.getRange(sheet.getLastRow(), 1, 1, 12).setBackground("#FEF3C7");
      }
      
      // 自動按座號 (A 欄) 排序 (01, 02, 03... 30, 35)，與點名冊完全一致
      if (sheet.getLastRow() > 2) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).sort({ column: 1, ascending: true });
      }
    } else {
      sheet.appendRow([
        nowTime, targetClass, targetSeat, targetName, data.units || "自訂範圍",
        currentOriginal, currentBest, data.errorCount || 0, data.keywords || "全對無錯題",
        switchAlert, statusNote
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "success", 
      "message": "成績已成功存入專屬分頁【" + targetSheetName + "】！",
      "bestScore": currentBest,
      "isUpdate": false
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "error", 
      "message": error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// 5. 處理儀表板手動補登成績請求（含自訂備註與補登標記，相容方案 A 獨立分頁）
function saveManualScoreBackend(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetSheetName = cleanSheetName(data.units);
    var sheet = ss.getSheetByName(targetSheetName) || ss.getSheetByName("測驗成績紀錄") || ss.getActiveSheet();
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "座號", "姓名", "採計總分(最高分)", "班級", "交卷時間", 
        "原始得分(第1階段)", "訂正後得分(第2階段)", "加分後總分(第3階段)", 
        "錯題數", "錯題與補救訂正關鍵字", "跳出視窗次數", "狀態備註"
      ]);
      sheet.getRange(1, 1, 1, 12).setBackground("#b45309").setFontColor("#FFFFFF").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    var timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
    var customNote = data.note ? ("✍️ " + data.note) : "✍️ 老師手動補登";
    var seatFormatted = formatSeatWithPadding(data.seat);
    var scoreNum = Number(data.score) || 0;
    
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0].map(function(h) { return String(h).trim(); });
    var isNewFormat = headers[0] === "座號" && headers[2] && headers[2].includes("採計");
    
    if (isNewFormat) {
      sheet.appendRow([
        seatFormatted, data.name, scoreNum, data.className, timestamp,
        scoreNum, "-", "-", 0, "老師手動補登", "0 次 (正常)", customNote
      ]);
      if (sheet.getLastRow() > 2) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).sort({ column: 1, ascending: true });
      }
    } else {
      sheet.appendRow([
        timestamp, data.className, seatFormatted, data.name, data.units || "課堂測驗 (老師補登)",
        scoreNum, scoreNum, 0, "老師手動補登", "0 次 (正常)", customNote
      ]);
    }
    
    return { status: "success", message: "手動補登成功！" };
  } catch (error) {
    return { status: "error", message: error.toString() };
  }
}

// 6. 供儀表板讀取資料（自動跨所有測驗分頁彙整全部學生資料）
function getScoresData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var records = [];
  var classSet = {};
  
  sheets.forEach(function(sheet) {
    var sheetName = sheet.getName();
    if (sheetName.includes("說明") || sheetName.includes("範本")) return;
    
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return;
    
    var headers = rows[0].map(function(h) { return String(h).trim(); });
    var isNewFormat = headers[0] === "座號" && headers[2] && headers[2].includes("採計");
    var isOldFormat = headers[0] && headers[0].includes("時間") && headers[1] === "班級";
    
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (isNewFormat) {
        var cls = String(r[3] || "").trim();
        if (cls) classSet[cls] = true;
        records.push({
          seat: String(r[0] || "").replace(/號/g, "").trim(),
          name: r[1],
          finalScore: Number(r[2]) || 0,
          className: r[3],
          timestamp: r[4],
          originalScore: Number(r[5]) || 0,
          correctionScore: r[6],
          bonusScore: r[7],
          errorCount: Number(r[8]) || 0,
          keywords: r[9],
          switchCount: r[10],
          statusNote: r[11],
          units: sheetName
        });
      } else if (isOldFormat) {
        var clsOld = String(r[1] || "").trim();
        if (clsOld) classSet[clsOld] = true;
        records.push({
          timestamp: r[0],
          className: r[1],
          seat: String(r[2] || "").replace(/號/g, "").trim(),
          name: r[3],
          units: r[4] || sheetName,
          originalScore: r[5],
          finalScore: Number(r[6]) !== undefined ? Number(r[6]) : (Number(r[5]) || 0),
          errorCount: r[7],
          keywords: r[8],
          switchCount: r[9],
          statusNote: r[10]
        });
      }
    }
  });

  records.reverse(); // 最新資料在最前
  return {
    records: records,
    classes: Object.keys(classSet).sort()
  };
}

// 7. 儀表板 HTML 介面與外部接口（支援 JSONP 跨域免疫、JSON API 與 直接大螢幕看板）
function doGet(e) {
  var callback = e && e.parameter ? e.parameter.callback : "";
  var action = e && e.parameter ? e.parameter.action : "";
  
  // 外部網頁 (如 Firebase 儀表板) 透過 JSONP 請求，免除跨網域限制
  if (callback) {
    var dataJsonp = getScoresData();
    var output = callback + "(" + JSON.stringify(dataJsonp) + ");";
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // 外部透過標準 JSON API 請求
  if (action === "getLiveScores") {
    var dataJson = getScoresData();
    return ContentService.createTextOutput(JSON.stringify(dataJson))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var html = '<!DOCTYPE html>\n' +
'<html lang="zh-TW">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>🏆 國中生物測驗即時儀表板</title>\n' +
'  <style>\n' +
'    :root {\n' +
'      --bg-main: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);\n' +
'      --card-bg: #ffffff;\n' +
'      --border-color: #fde68a;\n' +
'      --primary-color: #d97706;\n' +
'      --text-main: #78350f;\n' +
'      --text-muted: #b45309;\n' +
'      --card-inner-bg: #fefce8;\n' +
'      --seat-submitted-bg: #dcfce7;\n' +
'      --seat-submitted-border: #16a34a;\n' +
'      --seat-submitted-text: #14532d;\n' +
'      --seat-pending-bg: #ffffff;\n' +
'      --seat-pending-border: #fde68a;\n' +
'      --seat-absent-bg: #fee2e2;\n' +
'      --seat-absent-border: #ef4444;\n' +
'      --seat-absent-text: #991b1b;\n' +
'      --select-bg: #ffffff;\n' +
'      --shadow-style: 0 8px 25px rgba(217, 119, 6, 0.08);\n' +
'    }\n' +
'    body.theme-dark {\n' +
'      --bg-main: radial-gradient(circle at top, #291804 0%, #170d02 100%);\n' +
'      --card-bg: rgba(41, 24, 4, 0.92);\n' +
'      --border-color: rgba(245, 158, 11, 0.28);\n' +
'      --primary-color: #fbbf24;\n' +
'      --text-main: #fef3c7;\n' +
'      --text-muted: #d97706;\n' +
'      --card-inner-bg: rgba(23, 13, 2, 0.75);\n' +
'      --seat-submitted-bg: rgba(22, 163, 74, 0.2);\n' +
'      --seat-submitted-border: #22c55e;\n' +
'      --seat-submitted-text: #86efac;\n' +
'      --seat-pending-bg: rgba(255, 255, 255, 0.04);\n' +
'      --seat-pending-border: rgba(245, 158, 11, 0.2);\n' +
'      --seat-absent-bg: rgba(239, 68, 68, 0.2);\n' +
'      --seat-absent-border: #ef4444;\n' +
'      --seat-absent-text: #fca5a5;\n' +
'      --select-bg: #1f1203;\n' +
'      --shadow-style: 0 10px 30px rgba(0, 0, 0, 0.45);\n' +
'    }\n' +
'    * { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'    body {\n' +
'      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n' +
'      background: var(--bg-main);\n' +
'      color: var(--text-main);\n' +
'      min-height: 100vh;\n' +
'      padding: 20px;\n' +
'      transition: background 0.3s ease, color 0.3s ease;\n' +
'    }\n' +
'    .container { max-width: 1240px; margin: 0 auto; }\n' +
'    .header {\n' +
'      display: flex; justify-content: space-between; align-items: center;\n' +
'      flex-wrap: wrap; gap: 16px; background: var(--card-bg);\n' +
'      border: 1px solid var(--border-color); border-radius: 20px;\n' +
'      padding: 20px 24px; margin-bottom: 24px; box-shadow: var(--shadow-style);\n' +
'    }\n' +
'    .header-title h1 { font-size: 1.55rem; color: var(--primary-color); display: flex; align-items: center; gap: 10px; }\n' +
'    .header-title p { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }\n' +
'    .header-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }\n' +
'    .styled-select, .styled-input {\n' +
'      background: var(--select-bg); color: var(--primary-color);\n' +
'      border: 2px solid var(--primary-color); padding: 7px 14px;\n' +
'      border-radius: 12px; font-size: 1rem; font-weight: 800; outline: none;\n' +
'    }\n' +
'    .styled-input { width: 70px; text-align: center; }\n' +
'    .btn-action {\n' +
'      background: linear-gradient(135deg, #d97706, #b45309); color: white; border: none;\n' +
'      padding: 9px 16px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s ease;\n' +
'    }\n' +
'    .btn-action:hover { transform: translateY(-2px); }\n' +
'    .btn-success {\n' +
'      background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none;\n' +
'      padding: 9px 16px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s ease;\n' +
'    }\n' +
'    .btn-theme-toggle, .btn-toggle-score {\n' +
'      background: var(--card-inner-bg); border: 1.5px solid var(--border-color);\n' +
'      color: var(--text-main); padding: 8px 14px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;\n' +
'    }\n' +
'    .progress-card {\n' +
'      background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px;\n' +
'      padding: 22px 24px; margin-bottom: 24px; box-shadow: var(--shadow-style);\n' +
'    }\n' +
'    .progress-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }\n' +
'    .progress-title { font-size: 1.15rem; font-weight: 800; color: var(--text-main); }\n' +
'    .progress-stats { font-size: 1.15rem; font-weight: 900; }\n' +
'    .progress-bar-bg {\n' +
'      width: 100%; height: 18px; background: var(--card-inner-bg);\n' +
'      border-radius: 10px; overflow: hidden; border: 1px solid var(--border-color); margin-bottom: 14px;\n' +
'    }\n' +
'    .progress-bar-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #f59e0b, #16a34a); transition: width 0.5s ease; }\n' +
'    .action-bar-row {\n' +
'      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;\n' +
'      background: var(--card-inner-bg); border: 1px solid var(--border-color);\n' +
'      border-radius: 14px; padding: 12px 16px; font-size: 0.9rem; font-weight: 700;\n' +
'    }\n' +
'    .absent-group { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 290px; }\n' +
'    .absent-group input {\n' +
'      flex: 1; background: var(--select-bg); border: 1px solid var(--border-color);\n' +
'      color: var(--text-main); padding: 7px 12px; border-radius: 8px; font-size: 0.88rem; outline: none;\n' +
'    }\n' +
'    .tools-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n' +
'    .main-grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 24px; }\n' +
'    @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }\n' +
'    .panel-box { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 22px; box-shadow: var(--shadow-style); }\n' +
'    .panel-box h2 { font-size: 1.15rem; margin-bottom: 16px; color: var(--primary-color); display: flex; align-items: center; justify-content: space-between; }\n' +
'    .top5-list { display: flex; flex-direction: column; gap: 12px; }\n' +
'    .top5-item { display: flex; align-items: center; justify-content: space-between; background: var(--card-inner-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 14px 18px; }\n' +
'    .top5-badge { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; }\n' +
'    .rank-1 { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }\n' +
'    .rank-2 { background: linear-gradient(135deg, #94a3b8, #64748b); color: #fff; }\n' +
'    .rank-3 { background: linear-gradient(135deg, #b45309, #78350f); color: #fff; }\n' +
'    .rank-other { background: rgba(245, 158, 11, 0.15); color: var(--primary-color); }\n' +
'    .top5-info { flex: 1; margin: 0 16px; }\n' +
'    .top5-info .name { font-weight: 800; font-size: 1.05rem; color: var(--text-main); }\n' +
'    .top5-info .meta { font-size: 0.8rem; color: var(--text-muted); }\n' +
'    .top5-score { font-size: 1.25rem; font-weight: 900; color: #16a34a; }\n' +
'    .seat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(115px, 1fr)); gap: 10px; }\n' +
'    .seat-card {\n' +
'      border-radius: 14px; padding: 10px 8px; text-align: center; transition: all 0.2s ease;\n' +
'      cursor: pointer; user-select: none; position: relative;\n' +
'    }\n' +
'    .seat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.06); }\n' +
'    .seat-card.submitted { background: var(--seat-submitted-bg); border: 1.5px solid var(--seat-submitted-border); color: var(--seat-submitted-text); }\n' +
'    .seat-card.pending { background: var(--seat-pending-bg); border: 1.5px dashed var(--seat-pending-border); color: var(--text-muted); }\n' +
'    .seat-card.absent { background: var(--seat-absent-bg); border: 1.5px solid var(--seat-absent-border); color: var(--seat-absent-text); }\n' +
'    .absent-toggle-badge {\n' +
'      position: absolute; top: 4px; left: 4px;\n' +
'      width: 22px; height: 22px; border-radius: 6px;\n' +
'      display: flex; align-items: center; justify-content: center;\n' +
'      font-size: 0.72rem; cursor: pointer; transition: all 0.15s ease;\n' +
'      background: rgba(0,0,0,0.05); color: var(--text-muted);\n' +
'    }\n' +
'    .absent-toggle-badge:hover { background: #ef4444; color: #fff; transform: scale(1.1); }\n' +
'    .seat-card.absent .absent-toggle-badge { background: #ef4444; color: #fff; }\n' +
'    .seat-num { font-size: 1.05rem; font-weight: 900; margin-top: 4px; }\n' +
'    .seat-card.submitted .seat-num { color: #16a34a; }\n' +
'    .seat-card.pending .seat-num { color: var(--primary-color); }\n' +
'    .seat-card.absent .seat-num { color: #ef4444; }\n' +
'    .seat-status-text { font-size: 0.8rem; font-weight: 700; margin-top: 4px; }\n' +
'    .private-score { font-size: 0.75rem; color: var(--primary-color); margin-top: 2px; display: none; }\n' +
'    .show-scores .private-score { display: block; }\n' +
'    .modal-overlay {\n' +
'      position: fixed; top: 0; left: 0; width: 100%; height: 100%;\n' +
'      background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center;\n' +
'      z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.2s ease;\n' +
'    }\n' +
'    .modal-overlay.active { opacity: 1; pointer-events: auto; }\n' +
'    .modal-box {\n' +
'      background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px;\n' +
'      padding: 24px; width: 90%; max-width: 420px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);\n' +
'    }\n' +
'    .modal-box h3 { color: var(--primary-color); margin-bottom: 16px; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; }\n' +
'    .form-group { margin-bottom: 12px; }\n' +
'    .form-group label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px; font-weight: 700; }\n' +
'    .form-group input, .form-group select {\n' +
'      width: 100%; background: var(--select-bg); border: 1.5px solid var(--border-color);\n' +
'      color: var(--text-main); padding: 9px 12px; border-radius: 10px; font-size: 0.95rem; outline: none;\n' +
'    }\n' +
'    .modal-buttons { display: flex; gap: 10px; margin-top: 18px; }\n' +
'    .modal-buttons button { flex: 1; padding: 10px; border-radius: 10px; font-weight: 800; cursor: pointer; border: none; }\n' +
'    .btn-cancel { background: var(--card-inner-bg); color: var(--text-muted); border: 1px solid var(--border-color) !important; }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div class="container">\n' +
'    <header class="header">\n' +
'      <div class="header-title">\n' +
'        <h1>🏆 國中生物測驗即時儀表板</h1>\n' +
'        <p>Firebase 測驗系統 ‧ 雙模點名補登 ‧ 復古琥珀金版</p>\n' +
'      </div>\n' +
'      <div class="header-controls">\n' +
'        <select class="styled-select" id="classFilter" onchange="onClassChange()">\n' +
'          <option value="701">701 班</option><option value="702">702 班</option>\n' +
'          <option value="703">703 班</option><option value="704">704 班</option>\n' +
'          <option value="705">705 班</option><option value="706">706 班</option>\n' +
'          <option value="707">707 班</option><option value="708">708 班</option>\n' +
'          <option value="709">709 班</option><option value="710">710 班</option>\n' +
'        </select>\n' +
'        <div style="display:flex; align-items:center; gap:6px; font-weight:800; font-size:0.9rem;">\n' +
'          <span>應到人數：</span>\n' +
'          <input type="number" class="styled-input" id="totalSeatsInput" value="30" min="1" max="50" onchange="saveClassConfig(); renderDashboard();" />\n' +
'          <span>人</span>\n' +
'        </div>\n' +
'        <button class="btn-theme-toggle" id="btnThemeToggle" onclick="toggleTheme()">🌙 深色夜間模式</button>\n' +
'        <button class="btn-toggle-score" id="btnToggleScore" onclick="toggleScoreVisibility()">👁️ 導師分數切換</button>\n' +
'        <button class="btn-action" onclick="loadData()">🔄 刷新資料</button>\n' +
'      </div>\n' +
'    </header>\n' +
'    <div class="progress-card">\n' +
'      <div class="progress-header">\n' +
'        <div class="progress-title" id="progressClassTitle">701 班 測驗繳交參與率</div>\n' +
'        <div class="progress-stats">\n' +
'          已交：<span style="color:#16a34a" id="submittedCount">0</span> / \n' +
'          實到應交：<span style="color:var(--primary-color)" id="actualRequiredCount">30</span> 人 \n' +
'          (<span style="color:var(--text-muted)" id="progressPercent">0%</span>)\n' +
'        </div>\n' +
'      </div>\n' +
'      <div class="progress-bar-bg"><div class="progress-bar-fill" id="progressBarFill"></div></div>\n' +
'      <div class="action-bar-row">\n' +
'        <div class="absent-group">\n' +
'          <span>🏖️ 本班今日請假座號：</span>\n' +
'          <input type="text" id="absentSeatsInput" placeholder="請輸入請假座號 (例如：05, 12)，或直接點擊下方座號卡" onchange="saveClassConfig(); renderDashboard();" />\n' +
'          <span style="font-size:0.8rem; color:var(--text-muted);">(將自動扣除應交人數)</span>\n' +
'        </div>\n' +
'        <div class="tools-group">\n' +
'          <button class="btn-success" onclick="openManualModal()">✍️ 手動補登成績</button>\n' +
'          <button class="btn-action" onclick="copyPendingSeats()" style="background:linear-gradient(135deg, #f59e0b, #d97706);">📋 複製未交名單</button>\n' +
'          <button class="btn-action" onclick="exportCSV()" style="background:linear-gradient(135deg, #059669, #047857);">📥 匯出CSV</button>\n' +
'        </div>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="main-grid">\n' +
'      <div class="panel-box">\n' +
'        <h2>🎉 測驗榮譽英雄榜 (Top 5)</h2>\n' +
'        <div class="top5-list" id="top5List"><div style="text-align:center; color:var(--text-muted); padding:30px;">載入英雄榜中...</div></div>\n' +
'      </div>\n' +
'      <div class="panel-box" id="matrixPanel">\n' +
'        <h2>\n' +
'          <span>🔢 全班完成狀態圖 (左上角切換請假 / 點卡片補登)</span>\n' +
'          <span style="font-size:0.8rem; font-weight:normal; color:var(--text-muted);">點擊座號卡可補登</span>\n' +
'        </h2>\n' +
'        <div class="seat-grid" id="seatMatrixGrid"></div>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="modal-overlay" id="manualModal">\n' +
'    <div class="modal-box">\n' +
'      <h3>✍️ 老師手動補登成績</h3>\n' +
'      <div class="form-group">\n' +
'        <label>座號 (例如：01、15)</label>\n' +
'        <input type="text" id="manualSeat" placeholder="請輸入座號" />\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'        <label>學生姓名</label>\n' +
'        <input type="text" id="manualName" placeholder="請輸入學生姓名" />\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'        <label>最終得分</label>\n' +
'        <input type="number" id="manualScore" value="100" min="0" max="100" />\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'        <label>測驗範圍 / 任務名稱</label>\n' +
'        <input type="text" id="manualUnits" value="課堂生物測驗 (老師補登)" />\n' +
'      </div>\n' +
'      <div class="form-group">\n' +
'        <label>補登狀態備註</label>\n' +
'        <input type="text" id="manualNote" value="老師手動補登" placeholder="例如：平板故障補登、請假補考" />\n' +
'      </div>\n' +
'      <div class="modal-buttons">\n' +
'        <button class="btn-cancel" onclick="closeManualModal()">取消</button>\n' +
'        <button class="btn-success" onclick="submitManualScore()">確認補登寫入</button>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <script>\n' +
'    let rawRecords = [];\n' +
'    function normalizeClassStr(input) {\n' +
'      if (!input) return "";\n' +
'      var s = String(input).trim();\n' +
'      var digits = s.match(/\\d+/g);\n' +
'      if (digits) {\n' +
'        if (digits.length >= 2) return digits[0] + digits[1].padStart(2, "0");\n' +
'        if (digits.length === 1 && digits[0].length === 3) return digits[0];\n' +
'        if (digits.length <= 2) return "7" + digits[0].padStart(2, "0");\n' +
'      }\n' +
'      if (s.includes("十")) return "710";\n' +
'      var cnMap = {"一":"01","二":"02","三":"03","四":"04","五":"05","六":"06","七":"07","八":"08","九":"09"};\n' +
'      for (var k in cnMap) { if (s.includes(k)) return "7" + cnMap[k]; }\n' +
'      return s;\n' +
'    }\n' +
'    let isScoreVisible = false;\n' +
'    let currentTheme = localStorage.getItem("fb_dashboard_theme") || "light";\n' +
'    function initTheme() {\n' +
'      if (currentTheme === "dark") {\n' +
'        document.body.classList.add("theme-dark");\n' +
'        document.getElementById("btnThemeToggle").textContent = "☀️ 明亮色彩模式";\n' +
'      } else {\n' +
'        document.body.classList.remove("theme-dark");\n' +
'        document.getElementById("btnThemeToggle").textContent = "🌙 深色夜間模式";\n' +
'      }\n' +
'    }\n' +
'    function toggleTheme() {\n' +
'      currentTheme = (currentTheme === "dark") ? "light" : "dark";\n' +
'      localStorage.setItem("fb_dashboard_theme", currentTheme);\n' +
'      initTheme();\n' +
'    }\n' +
'    function onClassChange() {\n' +
'      loadClassConfig();\n' +
'      renderDashboard();\n' +
'    }\n' +
'    function loadClassConfig() {\n' +
'      const cls = document.getElementById("classFilter").value;\n' +
'      const savedTotal = localStorage.getItem("fb_cfg_" + cls + "_total") || "30";\n' +
'      const savedAbsent = localStorage.getItem("fb_cfg_" + cls + "_absent") || "";\n' +
'      document.getElementById("totalSeatsInput").value = savedTotal;\n' +
'      document.getElementById("absentSeatsInput").value = savedAbsent;\n' +
'    }\n' +
'    function saveClassConfig() {\n' +
'      const cls = document.getElementById("classFilter").value;\n' +
'      const total = document.getElementById("totalSeatsInput").value;\n' +
'      const absent = document.getElementById("absentSeatsInput").value;\n' +
'      localStorage.setItem("fb_cfg_" + cls + "_total", total);\n' +
'      localStorage.setItem("fb_cfg_" + cls + "_absent", absent);\n' +
'    }\n' +
'    function toggleAbsentSeat(seatNumStr, event) {\n' +
'      if (event) event.stopPropagation();\n' +
'      const absentInput = document.getElementById("absentSeatsInput");\n' +
'      let currentList = absentInput.value.split(/[,，\\s]+/).filter(Boolean).map(s => String(s).padStart(2, "0"));\n' +
'      if (currentList.includes(seatNumStr)) {\n' +
'        currentList = currentList.filter(s => s !== seatNumStr);\n' +
'      } else {\n' +
'        currentList.push(seatNumStr);\n' +
'      }\n' +
'      absentInput.value = currentList.sort().join(", ");\n' +
'      saveClassConfig();\n' +
'      renderDashboard();\n' +
'    }\n' +
'    function handleCardClickForScore(seatNumStr) {\n' +
'      document.getElementById("manualSeat").value = seatNumStr;\n' +
'      document.getElementById("manualName").value = seatNumStr + "號同學";\n' +
'      document.getElementById("manualScore").value = 100;\n' +
'      document.getElementById("manualUnits").value = "課堂生物測驗 (老師補登)";\n' +
'      document.getElementById("manualNote").value = "老師手動補登";\n' +
'      openManualModal();\n' +
'    }\n' +
'    function openManualModal() { document.getElementById("manualModal").classList.add("active"); }\n' +
'    function closeManualModal() { document.getElementById("manualModal").classList.remove("active"); }\n' +
'    function submitManualScore() {\n' +
'      const cls = document.getElementById("classFilter").value;\n' +
'      const seat = document.getElementById("manualSeat").value.trim();\n' +
'      const name = document.getElementById("manualName").value.trim();\n' +
'      const score = Number(document.getElementById("manualScore").value) || 0;\n' +
'      const units = document.getElementById("manualUnits").value.trim();\n' +
'      const note = document.getElementById("manualNote").value.trim();\n' +
'      if (!seat || !name) {\n' +
'        alert("請輸入座號與學生姓名！");\n' +
'        return;\n' +
'      }\n' +
'      google.script.run\n' +
'        .withSuccessHandler(res => {\n' +
'          if (res.status === "success") {\n' +
'            closeManualModal();\n' +
'            loadData();\n' +
'          } else {\n' +
'            alert("補登失敗：" + res.message);\n' +
'          }\n' +
'        })\n' +
'        .saveManualScoreBackend({ className: cls, seat: seat, name: name, score: score, units: units, note: note });\n' +
'    }\n' +
'    function loadData() {\n' +
'      google.script.run\n' +
'        .withSuccessHandler(data => {\n' +
'          rawRecords = data.records || [];\n' +
'          renderDashboard();\n' +
'        })\n' +
'        .withFailureHandler(err => console.error(err))\n' +
'        .getScoresData();\n' +
'    }\n' +
'    function toggleScoreVisibility() {\n' +
'      isScoreVisible = !isScoreVisible;\n' +
'      const btn = document.getElementById("btnToggleScore");\n' +
'      const panel = document.getElementById("matrixPanel");\n' +
'      if (isScoreVisible) {\n' +
'        btn.textContent = "🔒 隱藏個人分數 (公開模式)";\n' +
'        btn.style.background = "#fee2e2";\n' +
'        btn.style.color = "#991b1b";\n' +
'        panel.classList.add("show-scores");\n' +
'      } else {\n' +
'        btn.textContent = "👁️ 導師分數切換 (私下查看)";\n' +
'        btn.style.background = "var(--card-inner-bg)";\n' +
'        btn.style.color = "var(--text-main)";\n' +
'        panel.classList.remove("show-scores");\n' +
'      }\n' +
'    }\n' +
'    function copyPendingSeats() {\n' +
'      const totalSeats = parseInt(document.getElementById("totalSeatsInput").value) || 30;\n' +
'      const selectedClass = document.getElementById("classFilter").value;\n' +
'      const absentInputVal = document.getElementById("absentSeatsInput").value;\n' +
'      const absentSet = new Set(absentInputVal.split(/[,，\\s]+/).filter(Boolean).map(s => String(s).padStart(2, "0")));\n' +
'      const classRecords = rawRecords.filter(r => normalizeClassStr(r.className) === normalizeClassStr(selectedClass));\n' +
'      const submittedSet = new Set();\n' +
'      classRecords.forEach(r => {\n' +
'        if (r.seat) submittedSet.add(String(r.seat).padStart(2, "0"));\n' +
'      });\n' +
'      let pendingList = [];\n' +
'      for (let i = 1; i <= totalSeats; i++) {\n' +
'        const seatStr = String(i).padStart(2, "0");\n' +
'        if (!absentSet.has(seatStr) && !submittedSet.has(seatStr)) {\n' +
'          pendingList.push(seatStr + "號");\n' +
'        }\n' +
'      }\n' +
'      if (pendingList.length === 0) {\n' +
'        alert(selectedClass + "班所有同學皆已完成測驗！🎉");\n' +
'        return;\n' +
'      }\n' +
'      const text = selectedClass + "班尚未完成生物測驗的同學：" + pendingList.join(", ") + "，請把握時間上線完成喔！";\n' +
'      navigator.clipboard.writeText(text).then(() => {\n' +
'        alert("已成功複製未交名單到剪貼簿！\\n\\n" + text);\n' +
'      });\n' +
'    }\n' +
'    function exportCSV() {\n' +
'      const selectedClass = document.getElementById("classFilter").value;\n' +
'      const classRecords = rawRecords.filter(r => normalizeClassStr(r.className) === normalizeClassStr(selectedClass));\n' +
'      if (classRecords.length === 0) {\n' +
'        alert("目前尚無本班成績紀錄可供匯出。");\n' +
'        return;\n' +
'      }\n' +
'      let csv = "\\uFEFF交卷時間,班級,座號,姓名,測驗範圍,原始得分,最終總分,錯題數,訂正關鍵字,跳出次數,狀態備註\\n";\n' +
'      classRecords.forEach(r => {\n' +
'        csv += \'"\' + r.timestamp + \'","\' + r.className + \'","\' + r.seat + \'","\' + r.name + \'","\' + r.units + \'","\' + r.originalScore + \'","\' + r.finalScore + \'","\' + r.errorCount + \'","\' + r.keywords + \'","\' + r.switchCount + \'","\' + r.statusNote + \'"\\n\';\n' +
'      });\n' +
'      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });\n' +
'      const url = URL.createObjectURL(blob);\n' +
'      const a = document.createElement("a");\n' +
'      a.href = url;\n' +
'      a.download = selectedClass + "班_生物測驗成績匯出.csv";\n' +
'      a.click();\n' +
'    }\n' +
'    function renderDashboard() {\n' +
'      const selectedClass = document.getElementById("classFilter").value;\n' +
'      document.getElementById("progressClassTitle").textContent = selectedClass + " 班 測驗繳交參與率";\n' +
'      const classRecords = rawRecords.filter(r => normalizeClassStr(r.className) === normalizeClassStr(selectedClass));\n' +
'      const sortedRecords = [...classRecords].sort((a, b) => b.finalScore - a.finalScore);\n' +
'      const top5 = sortedRecords.slice(0, 5);\n' +
'      const top5List = document.getElementById("top5List");\n' +
'      if (top5.length === 0) {\n' +
'        top5List.innerHTML = \'<div style="text-align:center; color:var(--text-muted); padding:30px;">尚無測驗紀錄</div>\';\n' +
'      } else {\n' +
'        const medalEmojis = ["🥇", "🥈", "🥉", "✨", "🌟"];\n' +
'        top5List.innerHTML = top5.map((r, idx) => {\n' +
'          let badgeClass = "rank-other";\n' +
'          if (idx === 0) badgeClass = "rank-1";\n' +
'          else if (idx === 1) badgeClass = "rank-2";\n' +
'          else if (idx === 2) badgeClass = "rank-3";\n' +
'          return \'<div class="top5-item">\' +\n' +
'            \'<div class="top5-badge \' + badgeClass + \'">\' + medalEmojis[idx] + \'</div>\' +\n' +
'            \'<div class="top5-info">\' +\n' +
'              \'<div class="name">\' + r.name + \' <span style="font-size:0.8rem; color:var(--primary-color); margin-left:4px;">\' + r.seat + \'號</span></div>\' +\n' +
'              \'<div class="meta">\' + (r.units || "測驗範圍") + \'</div>\' +\n' +
'            \'</div>\' +\n' +
'            \'<div class="top5-score">\' + r.finalScore + \' 分</div>\' +\n' +
'          \'</div>\';\n' +
'        }).join("");\n' +
'      }\n' +
'      const absentInputVal = document.getElementById("absentSeatsInput").value;\n' +
'      const absentSet = new Set(absentInputVal.split(/[,，\\s]+/).filter(Boolean).map(s => String(s).padStart(2, "0")));\n' +
'      const submittedMap = {};\n' +
'      classRecords.forEach(r => {\n' +
'        if (r.seat) {\n' +
'          const seatNum = String(r.seat).padStart(2, "0");\n' +
'          if (!submittedMap[seatNum]) submittedMap[seatNum] = r;\n' +
'        }\n' +
'      });\n' +
'      const totalSeats = parseInt(document.getElementById("totalSeatsInput").value) || 30;\n' +
'      let submittedCount = 0;\n' +
'      let absentCount = 0;\n' +
'      const gridContainer = document.getElementById("seatMatrixGrid");\n' +
'      gridContainer.innerHTML = "";\n' +
'      for (let i = 1; i <= totalSeats; i++) {\n' +
'        const seatStr = String(i).padStart(2, "0");\n' +
'        const isAbsent = absentSet.has(seatStr);\n' +
'        const record = submittedMap[seatStr];\n' +
'        const isSubmitted = !!record;\n' +
'        if (isAbsent) {\n' +
'          absentCount++;\n' +
'          gridContainer.innerHTML += \'<div class="seat-card absent" onclick="handleCardClickForScore(\\\'\' + seatStr + \'\\\')" title="點擊卡片可手動補登成績">\' +\n' +
'            \'<div class="absent-toggle-badge" onclick="toggleAbsentSeat(\\\'\' + seatStr + \'\\\', event)" title="點此取消請假">🏖️</div>\' +\n' +
'            \'<div class="seat-num">\' + seatStr + \' 號</div>\' +\n' +
'            \'<div class="seat-status-text">請假中 🏖️</div>\' +\n' +
'            \'<div class="private-score">--</div>\' +\n' +
'          \'</div>\';\n' +
'        } else if (isSubmitted) {\n' +
'          submittedCount++;\n' +
'          gridContainer.innerHTML += \'<div class="seat-card submitted" onclick="handleCardClickForScore(\\\'\' + seatStr + \'\\\')" title="已交卷 (點擊可修改補登分數)">\' +\n' +
'            \'<div class="absent-toggle-badge" onclick="toggleAbsentSeat(\\\'\' + seatStr + \'\\\', event)" title="點此標記為請假">🏖️</div>\' +\n' +
'            \'<div class="seat-num">\' + seatStr + \' 號</div>\' +\n' +
'            \'<div class="seat-status-text">✅ 已交卷</div>\' +\n' +
'            \'<div class="private-score">\' + record.finalScore + \' 分</div>\' +\n' +
'          \'</div>\';\n' +
'        } else {\n' +
'          gridContainer.innerHTML += \'<div class="seat-card pending" onclick="handleCardClickForScore(\\\'\' + seatStr + \'\\\')" title="未繳交 (點擊卡片可手動補登成績)">\' +\n' +
'            \'<div class="absent-toggle-badge" onclick="toggleAbsentSeat(\\\'\' + seatStr + \'\\\', event)" title="點此標記為請假">🏖️</div>\' +\n' +
'            \'<div class="seat-num">\' + seatStr + \' 號</div>\' +\n' +
'            \'<div class="seat-status-text">加油中 💪</div>\' +\n' +
'            \'<div class="private-score">--</div>\' +\n' +
'          \'</div>\';\n' +
'        }\n' +
'      }\n' +
'      const actualRequired = Math.max(1, totalSeats - absentCount);\n' +
'      const percent = Math.min(100, Math.round((submittedCount / actualRequired) * 100));\n' +
'      document.getElementById("submittedCount").textContent = submittedCount;\n' +
'      document.getElementById("actualRequiredCount").textContent = actualRequired;\n' +
'      document.getElementById("progressPercent").textContent = (percent >= 100 && submittedCount >= actualRequired) ? "100% 🎉 應交全數完成！" : (percent + "%");\n' +
'      document.getElementById("progressBarFill").style.width = percent + "%";\n' +
'    }\n' +
'    initTheme();\n' +
'    loadClassConfig();\n' +
'    loadData();\n' +
'    setInterval(loadData, 10000);\n' +
'  </script>\n' +
'</body>\n' +
'</html>';

  return HtmlService.createHtmlOutput(html).setTitle("🏆 生物測驗即時監控儀表板");
}