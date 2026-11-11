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
  var s = String(input).trim().replace(/班$/, "");
  var matchSpecial = s.match(/(?:7|七)[\s-]*([甲乙丙])/);
  if (matchSpecial) return "七" + matchSpecial[1];
  if (/^[甲乙丙]$/.test(s)) return "七" + s;

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
    
    var incomingScore = data.finalScore !== undefined ? Number(data.finalScore) : (data.score !== undefined ? Number(data.score) : (data.originalScore !== undefined ? Number(data.originalScore) : 0));
    var currentOriginal = data.originalScore !== undefined ? Number(data.originalScore) : (data.score !== undefined ? Number(data.score) : existingOriginal);
    var currentCorrection = data.isCorrectionPhase ? Number(data.finalScore || incomingScore) : existingCorrection;
    var currentBonus = data.isFinalBonus ? Number(data.finalScore || currentCorrection) : existingBonus;
    
    // 核心最高分採計邏輯：自動取學生所有階段達到的最優最高分！
    var currentBest = Math.max(existingBest, currentOriginal, currentCorrection, currentBonus, incomingScore);
    
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



// ==========================================================================
// 🌿 試算表自訂功能選單與一鍵美化優化引擎
// ==========================================================================

// 1. 試算表頂端選單擴充：方便老師在 Google 試算表一鍵執行美化、修復與重新自然排序
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("🌿 生物課堂試算表小幫手")
      .addItem("✨ 一鍵套用頂級美化排版 (當前分頁)", "美化當前分頁")
      .addItem("🎨 一鍵美化所有測驗分頁", "美化所有分頁")
      .addSeparator()
      .addItem("🔄 重新依班級座號排序當前分頁", "重新排序當前分頁")
      .addItem("🛠️ 一鍵修復並自動補齊所有分頁", "一鍵修復並美化所有分頁")
      .addToUi();
  } catch (e) {}
}

// 2. 一鍵美化當前工作表
function 美化當前分頁() {
  var sheet = SpreadsheetApp.getActiveSheet();
  applyUltraBeautification(sheet);
  try {
    SpreadsheetApp.getUi().alert("🎉 美化完成！已套用深翡翠綠奢華表頭、護眼斑馬紋、最適欄寬、座號姓名凍結與滿分高亮！");
  } catch (_) {}
}

// 3. 一鍵美化所有工作表
function 美化所有分頁() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var count = 0;
  sheets.forEach(function(s) {
    var name = s.getName();
    if (!name.includes("說明") && !name.includes("範本")) {
      applyUltraBeautification(s);
      count++;
    }
  });
  try {
    SpreadsheetApp.getUi().alert("🎉 全數完成！已為 " + count + " 個分頁套用頂級現代排版、斑馬紋與高低分智慧標色！");
  } catch (_) {}
}

// 4. 重新依「班級 ➔ 座號」排序當前分頁
function 重新排序當前分頁() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    var headers = sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn(), 12)).getValues()[0];
    var isNewFormat = headers[0] === "座號" && headers[2] && String(headers[2]).includes("採計");
    if (isNewFormat) {
      sheet.getRange(2, 1, lastRow - 1, 12).sort([
        { column: 4, ascending: true }, // 班級
        { column: 1, ascending: true }  // 座號
      ]);
    } else {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).sort([
        { column: 2, ascending: true }, // 班級
        { column: 3, ascending: true }  // 座號
      ]);
    }
  }
  applyUltraBeautification(sheet);
  try {
    SpreadsheetApp.getUi().alert("✅ 排序完成！已將當前分頁依「班級 ➔ 座號 (01~35)」精準自然升冪排列。");
  } catch (_) {}
}

// 5. 一鍵修復並美化所有分頁
function 一鍵修復並美化所有分頁() {
  美化所有分頁();
}

// 6. 頂級美化排版核心引擎（深翡翠綠/琥珀金、護眼斑馬紋、最適欄寬、座號姓名雙凍結、高低分條件格式化）
function applyUltraBeautification(sheet) {
  if (!sheet) return;
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var numCols = Math.max(sheet.getLastColumn(), 12);

  // 1. 表頭高度與雙向凍結 (表頭 40px 大氣舒適，凍結前兩欄座號與姓名)
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // 2. 表頭現代深翡翠綠風格 (#0F766E)
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange
    .setBackground("#0F766E")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(10.5)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  // 3. 黃金比例最適欄寬
  var colWidths = [
    65,  // A: 座號 (01~35)
    85,  // B: 姓名
    115, // C: 採計總分(最高分)
    65,  // D: 班級 (701~710)
    140, // E: 交卷時間
    95,  // F: 原始得分(第1階段)
    95,  // G: 訂正後得分(第2階段)
    95,  // H: 加分後總分(第3階段)
    70,  // I: 錯題數
    180, // J: 錯題與補救訂正關鍵字
    95,  // K: 跳出視窗次數
    125  // L: 狀態備註
  ];
  for (var c = 0; c < colWidths.length; c++) {
    sheet.setColumnWidth(c + 1, colWidths[c]);
  }

  // 4. 資料列排版、行高、斑馬紋與高低分條件格式化
  if (lastRow > 1) {
    sheet.setRowHeights(2, lastRow - 1, 28); // 舒適列高 28px

    var dataRange = sheet.getRange(2, 1, lastRow - 1, numCols);
    dataRange
      .setVerticalAlignment("middle")
      .setFontSize(10);

    // 細項欄位排版
    sheet.getRange(2, 1, lastRow - 1, 1).setHorizontalAlignment("center"); // 座號
    sheet.getRange(2, 2, lastRow - 1, 1).setHorizontalAlignment("center"); // 姓名
    sheet.getRange(2, 3, lastRow - 1, 1).setHorizontalAlignment("center").setFontWeight("bold").setFontSize(11); // 採計最高分
    sheet.getRange(2, 4, lastRow - 1, 1).setHorizontalAlignment("center"); // 班級
    sheet.getRange(2, 5, lastRow - 1, 1).setHorizontalAlignment("center").setFontColor("#64748B"); // 時間灰
    sheet.getRange(2, 6, lastRow - 1, 3).setHorizontalAlignment("center"); // 得分置中
    sheet.getRange(2, 9, lastRow - 1, 1).setHorizontalAlignment("center"); // 錯題數
    sheet.getRange(2, 10, lastRow - 1, 1).setHorizontalAlignment("left");  // 關鍵字靠左
    sheet.getRange(2, 11, lastRow - 1, 2).setHorizontalAlignment("center"); // 跳窗、備註

    // 清除舊斑馬紋並套用清新護眼斑馬紋
    try {
      var bandings = sheet.getBandings();
      for (var b = 0; b < bandings.length; b++) {
        bandings[b].remove();
      }
      var fullTableRange = sheet.getRange(1, 1, lastRow, numCols);
      var newBanding = fullTableRange.applyRowBanding();
      newBanding
        .setHeaderRowColor("#0F766E")
        .setFirstRowColor("#FFFFFF")
        .setSecondRowColor("#F8FAFC");
    } catch (_) {}

    // 條件式格式化 (滿分金黃高亮、不及格粉紅高亮、跳窗警示)
    try {
      var rules = [];
      var scoreRange = sheet.getRange("C2:C" + lastRow);
      
      // 滿分 (>=100)：香檳金底 + 琥珀金深字 + 粗體
      var rule100 = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThanOrEqualTo(100)
        .setBackground("#FEF3C7")
        .setFontColor("#92400E")
        .setBold(true)
        .setRanges([scoreRange])
        .build();
      rules.push(rule100);

      // 不及格 (<60)：櫻粉色底 + 警示深紅字
      var ruleFail = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(60)
        .setBackground("#FEE2E2")
        .setFontColor("#991B1B")
        .setRanges([scoreRange])
        .build();
      rules.push(ruleFail);

      // 跳窗警示：柔和橙黃底 + 橘紅字
      var switchRange = sheet.getRange("K2:K" + lastRow);
      var ruleSwitch = SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains("警示")
        .setBackground("#FFEDD5")
        .setFontColor("#C2410C")
        .setBold(true)
        .setRanges([switchRange])
        .build();
      rules.push(ruleSwitch);

      sheet.setConditionalFormatRules(rules);
    } catch (_) {}

    // 自動開啟表頭下拉篩選箭頭
    try {
      if (!sheet.getFilter()) {
        sheet.getRange(1, 1, lastRow, numCols).createFilter();
      }
    } catch (_) {}
  }
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

  var html = "<!DOCTYPE html>\n<html lang=\"zh-TW\" data-hall-theme=\"green\" data-color-mode=\"light\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>🏆 國中生物測驗與遊戲即時儀表板</title>\n  <link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏆</text></svg>\">\n  <style>\n    /* ========================================================\n       🎨 雙大廳色系定義：大廳一 (翠綠) vs 大廳二 (玫瑰粉)\n       🌓 雙模式支援：明亮模式 (預設) vs 深色模式\n       ======================================================== */\n    \n    /* 1. 大廳一 ‧ 翠綠主題 (明亮) */\n    :root, [data-hall-theme=\"green\"][data-color-mode=\"light\"] {\n      --bg-page: radial-gradient(circle at 50% 0%, #f0fdf4 0%, #f8fafc 60%, #e2e8f0 100%);\n      --body-bg: #f8fafc;\n      --card-bg: #ffffff;\n      --card-border: #bbf7d0;\n      --card-shadow: 0 4px 20px rgba(22, 163, 74, 0.08);\n      --inner-bg: #f0fdf4;\n      --inner-border: #dcfce7;\n      \n      --text-main: #14532d;\n      --text-sub: #166534;\n      --text-muted: #15803d;\n      --text-light: #16a34a;\n      \n      --primary: #16a34a;\n      --primary-hover: #15803d;\n      --accent-green: #16a34a;\n      --accent-red: #dc2626;\n      --accent-blue: #2563eb;\n      \n      --card-submitted-bg: #dcfce7;\n      --card-submitted-border: #16a34a;\n      --card-submitted-text: #14532d;\n      --card-submitted-tag: #15803d;\n      \n      --card-absent-bg: #fee2e2;\n      --card-absent-border: #ef4444;\n      --card-absent-text: #991b1b;\n      --card-absent-tag: #dc2626;\n      \n      --card-pending-bg: #ffffff;\n      --card-pending-border: #bbf7d0;\n      --card-pending-text: #166534;\n      --card-pending-tag: #15803d;\n\n      --theme-toggle-bg: #ffffff;\n      --theme-toggle-border: #86efac;\n      --theme-toggle-text: #14532d;\n    }\n\n    /* 2. 大廳二 ‧ 星空魅紫主題 (明亮) */\n    [data-hall-theme=\"purple\"][data-color-mode=\"light\"],\n    [data-hall-theme=\"pink\"][data-color-mode=\"light\"] {\n      --bg-page: radial-gradient(circle at 50% 0%, #f5f3ff 0%, #faf5ff 60%, #ede9fe 100%);\n      --body-bg: #faf5ff;\n      --card-bg: #ffffff;\n      --card-border: #ddd6fe;\n      --card-shadow: 0 4px 20px rgba(124, 58, 237, 0.08);\n      --inner-bg: #f5f3ff;\n      --inner-border: #ede9fe;\n      \n      --text-main: #4c1d95;\n      --text-sub: #5b21b6;\n      --text-muted: #6d28d9;\n      --text-light: #7c3aed;\n      \n      --primary: #7c3aed;\n      --primary-hover: #6d28d9;\n      --accent-green: #7c3aed;\n      --accent-red: #dc2626;\n      --accent-blue: #0284c7;\n      \n      --card-submitted-bg: #ede9fe;\n      --card-submitted-border: #7c3aed;\n      --card-submitted-text: #4c1d95;\n      --card-submitted-tag: #6d28d9;\n      \n      --card-absent-bg: #fee2e2;\n      --card-absent-border: #ef4444;\n      --card-absent-text: #991b1b;\n      --card-absent-tag: #dc2626;\n      \n      --card-pending-bg: #ffffff;\n      --card-pending-border: #ddd6fe;\n      --card-pending-text: #6d28d9;\n      --card-pending-tag: #7c3aed;\n\n      --theme-toggle-bg: #ffffff;\n      --theme-toggle-border: #c4b5fd;\n      --theme-toggle-text: #4c1d95;\n    }\n\n    /* 3. 大廳一 ‧ 翠綠主題 (深色星艦) */\n    [data-hall-theme=\"green\"][data-color-mode=\"dark\"] {\n      --bg-page: radial-gradient(circle at top, #062413 0%, #031109 100%);\n      --body-bg: #031109;\n      --card-bg: rgba(6, 36, 19, 0.9);\n      --card-border: rgba(34, 197, 94, 0.3);\n      --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);\n      --inner-bg: rgba(4, 25, 13, 0.75);\n      --inner-border: rgba(34, 197, 94, 0.2);\n      \n      --text-main: #dcfce7;\n      --text-sub: #bbf7d0;\n      --text-muted: #86efac;\n      --text-light: #4ade80;\n      \n      --primary: #22c55e;\n      --primary-hover: #16a34a;\n      --accent-green: #22c55e;\n      --accent-red: #f87171;\n      --accent-blue: #38bdf8;\n      \n      --card-submitted-bg: rgba(34, 197, 94, 0.25);\n      --card-submitted-border: #22c55e;\n      --card-submitted-text: #dcfce7;\n      --card-submitted-tag: #4ade80;\n      \n      --card-absent-bg: rgba(239, 68, 68, 0.22);\n      --card-absent-border: #ef4444;\n      --card-absent-text: #fca5a5;\n      --card-absent-tag: #f87171;\n      \n      --card-pending-bg: rgba(255, 255, 255, 0.04);\n      --card-pending-border: rgba(34, 197, 94, 0.2);\n      --card-pending-text: #86efac;\n      --card-pending-tag: #4ade80;\n\n      --theme-toggle-bg: #062413;\n      --theme-toggle-border: #16a34a;\n      --theme-toggle-text: #dcfce7;\n    }\n\n    /* 4. 大廳二 ‧ 星空魅紫主題 (深色星艦) */\n    [data-hall-theme=\"purple\"][data-color-mode=\"dark\"],\n    [data-hall-theme=\"pink\"][data-color-mode=\"dark\"] {\n      --bg-page: radial-gradient(circle at top, #1e1035 0%, #0c0517 100%);\n      --body-bg: #0c0517;\n      --card-bg: rgba(30, 16, 53, 0.9);\n      --card-border: rgba(167, 139, 250, 0.35);\n      --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);\n      --inner-bg: rgba(20, 10, 38, 0.75);\n      --inner-border: rgba(167, 139, 250, 0.25);\n      \n      --text-main: #ede9fe;\n      --text-sub: #ddd6fe;\n      --text-muted: #c4b5fd;\n      --text-light: #a78bfa;\n      \n      --primary: #a78bfa;\n      --primary-hover: #8b5cf6;\n      --accent-green: #a78bfa;\n      --accent-red: #f87171;\n      --accent-blue: #38bdf8;\n      \n      --card-submitted-bg: rgba(139, 92, 246, 0.25);\n      --card-submitted-border: #a78bfa;\n      --card-submitted-text: #ede9fe;\n      --card-submitted-tag: #c4b5fd;\n      \n      --card-absent-bg: rgba(239, 68, 68, 0.22);\n      --card-absent-border: #ef4444;\n      --card-absent-text: #fca5a5;\n      --card-absent-tag: #f87171;\n      \n      --card-pending-bg: rgba(255, 255, 255, 0.04);\n      --card-pending-border: rgba(167, 139, 250, 0.2);\n      --card-pending-text: #c4b5fd;\n      --card-pending-tag: #a78bfa;\n\n      --theme-toggle-bg: #1e1035;\n      --theme-toggle-border: #7c3aed;\n      --theme-toggle-text: #ede9fe;\n    }\n\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body {\n      font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;\n      background: var(--bg-page);\n      background-color: var(--body-bg);\n      color: var(--text-main);\n      padding: 16px 20px 40px;\n      min-height: 100vh;\n      transition: background 0.3s ease, color 0.3s ease;\n    }\n\n    .container {\n      max-width: 1260px;\n      margin: 0 auto;\n    }\n\n    /* 頂部列 */\n    .header-bar {\n      background: var(--card-bg);\n      border: 1.5px solid var(--card-border);\n      border-radius: 18px;\n      padding: 16px 22px;\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      flex-wrap: wrap;\n      gap: 14px;\n      box-shadow: var(--card-shadow);\n      margin-bottom: 20px;\n    }\n\n    .header-title h1 {\n      font-size: 1.55rem;\n      font-weight: 900;\n      color: var(--text-main);\n      display: flex;\n      align-items: center;\n      gap: 8px;\n    }\n\n    .header-controls {\n      display: flex;\n      align-items: center;\n      flex-wrap: wrap;\n      gap: 10px;\n    }\n\n    .select-group {\n      display: flex;\n      align-items: center;\n      gap: 6px;\n    }\n\n    .control-label {\n      font-size: 0.88rem;\n      font-weight: 800;\n      color: var(--text-main);\n      white-space: nowrap;\n    }\n\n    .select-hall, .select-unit, .select-class {\n      background: var(--inner-bg);\n      border: 2px solid var(--primary);\n      color: var(--text-main);\n      font-size: 0.95rem;\n      font-weight: 800;\n      padding: 8px 12px;\n      border-radius: 12px;\n      cursor: pointer;\n      outline: none;\n      transition: all 0.2s ease;\n    }\n    .select-hall { font-weight: 900; }\n    .select-unit { max-width: 280px; }\n\n    .seat-count-box {\n      display: flex;\n      align-items: center;\n      gap: 4px;\n      font-size: 0.88rem;\n      font-weight: 800;\n      color: var(--text-main);\n    }\n\n    .input-seat-count {\n      width: 58px;\n      padding: 7px 6px;\n      text-align: center;\n      border: 2px solid var(--card-border);\n      border-radius: 10px;\n      background: var(--inner-bg);\n      color: var(--text-main);\n      font-size: 0.95rem;\n      font-weight: 800;\n      outline: none;\n    }\n\n    .btn-control {\n      background: var(--theme-toggle-bg);\n      border: 1.5px solid var(--theme-toggle-border);\n      border-radius: 12px;\n      padding: 8px 14px;\n      font-size: 0.88rem;\n      font-weight: 800;\n      color: var(--text-main);\n      cursor: pointer;\n      display: inline-flex;\n      align-items: center;\n      gap: 6px;\n      transition: all 0.2s ease;\n      user-select: none;\n    }\n    .btn-control:hover {\n      transform: translateY(-1px);\n      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);\n    }\n\n    .btn-hall-switch {\n      background: linear-gradient(135deg, #16a34a, #db2777);\n      color: #ffffff;\n      border: none;\n      box-shadow: 0 4px 14px rgba(219, 39, 119, 0.25);\n    }\n\n    .btn-refresh {\n      background: linear-gradient(135deg, var(--primary), var(--primary-hover));\n      color: #ffffff;\n      border: none;\n      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);\n    }\n\n    /* 繳交率進度面板 */\n    .progress-panel {\n      background: var(--card-bg);\n      border: 1.5px solid var(--card-border);\n      border-radius: 18px;\n      padding: 20px 24px;\n      box-shadow: var(--card-shadow);\n      margin-bottom: 22px;\n    }\n\n    .progress-header {\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      flex-wrap: wrap;\n      gap: 12px;\n      margin-bottom: 12px;\n    }\n\n    .progress-title {\n      font-size: 1.25rem;\n      font-weight: 900;\n      color: var(--text-main);\n    }\n\n    .progress-stats {\n      font-size: 1.2rem;\n      font-weight: 900;\n      color: var(--text-main);\n    }\n\n    .progress-stats .stat-done { color: var(--accent-green); }\n    .progress-stats .stat-req { color: var(--primary); }\n    .progress-stats .stat-pct { color: var(--primary-hover); font-size: 1.25rem; }\n\n    .progress-bar-bg {\n      width: 100%;\n      height: 18px;\n      background: var(--inner-bg);\n      border: 1.5px solid var(--inner-border);\n      border-radius: 10px;\n      overflow: hidden;\n      margin-bottom: 16px;\n    }\n\n    .progress-bar-fill {\n      height: 100%;\n      width: 0%;\n      background: linear-gradient(90deg, var(--primary), var(--primary-hover));\n      border-radius: 10px;\n      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);\n    }\n\n    /* 請假與操作按鈕列 */\n    .action-subbar {\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      flex-wrap: wrap;\n      gap: 14px;\n      background: var(--inner-bg);\n      border: 1px solid var(--inner-border);\n      padding: 10px 16px;\n      border-radius: 14px;\n    }\n\n    .absent-input-group {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n      flex: 1;\n      min-width: 320px;\n    }\n\n    .absent-label {\n      font-size: 0.88rem;\n      font-weight: 800;\n      color: var(--text-main);\n      white-space: nowrap;\n    }\n\n    .input-absent {\n      flex: 1;\n      padding: 7px 12px;\n      border: 1.5px solid var(--card-border);\n      border-radius: 10px;\n      background: var(--card-bg);\n      color: var(--text-main);\n      font-size: 0.9rem;\n      outline: none;\n      transition: border-color 0.2s ease;\n    }\n    .input-absent:focus {\n      border-color: var(--primary);\n    }\n\n    .absent-note {\n      font-size: 0.8rem;\n      color: var(--text-muted);\n      white-space: nowrap;\n    }\n\n    .tool-btn-group {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n      flex-wrap: wrap;\n    }\n\n    .btn-act {\n      border: none;\n      border-radius: 10px;\n      padding: 8px 14px;\n      font-size: 0.85rem;\n      font-weight: 800;\n      color: #ffffff;\n      cursor: pointer;\n      display: inline-flex;\n      align-items: center;\n      gap: 5px;\n      transition: all 0.2s ease;\n      box-shadow: 0 4px 10px rgba(0,0,0,0.15);\n    }\n    .btn-act:hover { transform: translateY(-1px); }\n\n    .btn-act-green { background: #16a34a; }\n    .btn-act-green:hover { background: #15803d; }\n    .btn-act-amber { background: #d97706; }\n    .btn-act-amber:hover { background: #b45309; }\n    .btn-act-teal { background: #0d9488; }\n    .btn-act-teal:hover { background: #0f766e; }\n\n    /* 主區域雙欄格 */\n    .main-grid {\n      display: grid;\n      grid-template-columns: 360px 1fr;\n      gap: 22px;\n      align-items: start;\n    }\n\n    @media (max-width: 980px) {\n      .main-grid { grid-template-columns: 1fr; }\n    }\n\n    .panel-card {\n      background: var(--card-bg);\n      border: 1.5px solid var(--card-border);\n      border-radius: 18px;\n      padding: 20px;\n      box-shadow: var(--card-shadow);\n    }\n\n    .panel-card h2 {\n      font-size: 1.18rem;\n      font-weight: 900;\n      color: var(--text-main);\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      margin-bottom: 16px;\n      border-bottom: 1.5px dashed var(--inner-border);\n      padding-bottom: 10px;\n    }\n\n    .panel-card h2 .sub-tip {\n      font-size: 0.8rem;\n      font-weight: 700;\n      color: var(--text-muted);\n    }\n\n    /* 榮譽榜 Top 5 */\n    .top5-list {\n      display: flex;\n      flex-direction: column;\n      gap: 10px;\n    }\n\n    .top5-item {\n      background: var(--inner-bg);\n      border: 1px solid var(--inner-border);\n      border-radius: 14px;\n      padding: 12px 14px;\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      transition: transform 0.2s ease;\n    }\n    .top5-item:hover {\n      transform: translateX(4px);\n    }\n\n    .top5-badge {\n      width: 38px;\n      height: 38px;\n      border-radius: 50%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      font-size: 1.25rem;\n      font-weight: 900;\n      flex-shrink: 0;\n    }\n    .badge-gold { background: linear-gradient(135deg, #fef08a, #f59e0b); color: #78350f; }\n    .badge-silver { background: linear-gradient(135deg, #f1f5f9, #94a3b8); color: #1e293b; }\n    .badge-bronze { background: linear-gradient(135deg, #fed7aa, #ea580c); color: #7c2d12; }\n    .badge-star { background: var(--inner-bg); border: 1.5px solid var(--card-border); color: var(--primary); font-size: 1rem; }\n\n    .top5-info {\n      flex: 1;\n      display: flex;\n      flex-direction: column;\n      gap: 2px;\n      overflow: hidden;\n    }\n\n    .top5-name-row {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n    }\n\n    .top5-name {\n      font-size: 1.02rem;\n      font-weight: 900;\n      color: var(--text-main);\n    }\n\n    .top5-seat {\n      font-size: 0.82rem;\n      font-weight: 800;\n      color: var(--text-muted);\n      background: var(--card-bg);\n      border: 1px solid var(--card-border);\n      padding: 1px 6px;\n      border-radius: 6px;\n    }\n\n    .top5-units {\n      font-size: 0.78rem;\n      font-weight: 700;\n      color: var(--text-muted);\n      white-space: nowrap;\n      overflow: hidden;\n      text-overflow: ellipsis;\n    }\n\n    .top5-score-box {\n      text-align: right;\n    }\n\n    .top5-score {\n      font-size: 1.25rem;\n      font-weight: 900;\n      color: var(--accent-green);\n    }\n\n    .top5-score-sub {\n      font-size: 0.72rem;\n      font-weight: 700;\n      color: var(--text-muted);\n    }\n\n    .empty-state {\n      text-align: center;\n      padding: 36px 16px;\n      color: var(--text-muted);\n      font-size: 0.95rem;\n      font-weight: 700;\n    }\n\n    /* 座號卡片網格 (點名矩陣) */\n    .seat-grid {\n      display: grid;\n      grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));\n      gap: 12px;\n    }\n\n    .seat-card {\n      border-radius: 14px;\n      padding: 12px 8px;\n      text-align: center;\n      cursor: pointer;\n      user-select: none;\n      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n      position: relative;\n      display: flex;\n      flex-direction: column;\n      justify-content: center;\n      align-items: center;\n      min-height: 80px;\n    }\n    .seat-card:hover {\n      transform: translateY(-3px);\n      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);\n    }\n\n    /* 狀態 A: 已完成 */\n    .seat-card.submitted {\n      background: var(--card-submitted-bg);\n      border: 1.5px solid var(--card-submitted-border);\n      color: var(--card-submitted-text);\n    }\n    .seat-card.submitted .card-seat-num {\n      color: var(--card-submitted-tag);\n      font-weight: 900;\n    }\n\n    /* 狀態 B: 請假 */\n    .seat-card.absent {\n      background: var(--card-absent-bg);\n      border: 1.5px solid var(--card-absent-border);\n      color: var(--card-absent-text);\n    }\n    .seat-card.absent .card-seat-num {\n      color: var(--card-absent-tag);\n      font-weight: 900;\n    }\n\n    /* 狀態 C: 未交 (加油中) */\n    .seat-card.pending {\n      background: var(--card-pending-bg);\n      border: 1.5px dashed var(--card-pending-border);\n      color: var(--card-pending-text);\n    }\n    .seat-card.pending .card-seat-num {\n      color: var(--card-pending-tag);\n      font-weight: 900;\n    }\n\n    .card-top-icon {\n      font-size: 1.05rem;\n      margin-bottom: 2px;\n    }\n\n    .card-seat-num {\n      font-size: 1.05rem;\n      letter-spacing: -0.3px;\n    }\n\n    .card-status-text {\n      font-size: 0.8rem;\n      font-weight: 800;\n      margin-top: 3px;\n    }\n\n    .card-student-name {\n      font-size: 0.82rem;\n      font-weight: 900;\n      color: var(--text-main);\n      margin-top: 2px;\n      white-space: nowrap;\n      overflow: hidden;\n      text-overflow: ellipsis;\n      max-width: 90px;\n    }\n\n    .card-score-badge {\n      display: none;\n      font-size: 0.76rem;\n      font-weight: 900;\n      color: var(--primary);\n      margin-top: 2px;\n    }\n\n    /* 導師分數切換顯示時 */\n    body.show-teacher-scores .card-score-badge {\n      display: block;\n    }\n\n    /* 彈窗樣式 (手動補登成績) */\n    .modal-overlay {\n      position: fixed;\n      inset: 0;\n      background: rgba(0, 0, 0, 0.55);\n      backdrop-filter: blur(4px);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 9999;\n      opacity: 0;\n      pointer-events: none;\n      transition: opacity 0.25s ease;\n    }\n    .modal-overlay.active {\n      opacity: 1;\n      pointer-events: auto;\n    }\n\n    .modal-box {\n      background: var(--card-bg);\n      border: 2px solid var(--primary);\n      border-radius: 20px;\n      width: 90%;\n      max-width: 460px;\n      padding: 24px 28px;\n      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);\n      transform: translateY(20px);\n      transition: transform 0.25s ease;\n    }\n    .modal-overlay.active .modal-box {\n      transform: translateY(0);\n    }\n\n    .modal-title {\n      font-size: 1.35rem;\n      font-weight: 900;\n      color: var(--text-main);\n      margin-bottom: 16px;\n      display: flex;\n      align-items: center;\n      gap: 8px;\n    }\n\n    .modal-field {\n      margin-bottom: 14px;\n    }\n\n    .modal-field label {\n      display: block;\n      font-size: 0.88rem;\n      font-weight: 800;\n      color: var(--text-main);\n      margin-bottom: 5px;\n    }\n\n    .modal-input {\n      width: 100%;\n      padding: 9px 12px;\n      border: 1.5px solid var(--card-border);\n      border-radius: 10px;\n      background: var(--inner-bg);\n      color: var(--text-main);\n      font-size: 0.95rem;\n      font-weight: 700;\n      outline: none;\n    }\n    .modal-input:focus {\n      border-color: var(--primary);\n    }\n\n    .modal-actions {\n      display: flex;\n      justify-content: flex-end;\n      gap: 10px;\n      margin-top: 20px;\n    }\n\n    /* 連線提示通知條 (Toast) */\n    .toast-msg {\n      position: fixed;\n      bottom: 24px;\n      right: 24px;\n      background: #1e293b;\n      color: #ffffff;\n      padding: 12px 20px;\n      border-radius: 12px;\n      font-size: 0.92rem;\n      font-weight: 800;\n      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);\n      transform: translateY(100px);\n      opacity: 0;\n      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n      z-index: 10000;\n    }\n    .toast-msg.show {\n      transform: translateY(0);\n      opacity: 1;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <!-- 頂部導航與總控列 -->\n    <header class=\"header-bar\">\n      <div class=\"header-title\">\n        <h1 id=\"dashboardMainTitle\">🌿 大廳一：互動遊戲即時儀表板</h1>\n        <p id=\"dashboardSubTitle\">共用題庫遊戲 ‧ 即時大螢幕點名 ‧ 雙大廳色系聯動</p>\n      </div>\n      <div class=\"header-controls\">\n        <!-- 第一層：大廳切換 (大廳一 vs 大廳二) -->\n        <div class=\"select-group\">\n          <label class=\"control-label\" for=\"hallSelect\">🏛️ 目標大廳：</label>\n          <select class=\"select-hall\" id=\"hallSelect\" onchange=\"onHallChange()\">\n            <option value=\"hall1\">🌿 大廳一：共用題庫遊戲 (綠)</option>\n            <option value=\"hall2\">🔮 大廳二：獨立單元遊戲 (紫)</option>\n          </select>\n        </div>\n\n        <!-- 第二層：該大廳底下的遊戲主題下拉選單 -->\n        <div class=\"select-group\">\n          <label class=\"control-label\" for=\"unitSelect\">🎮 遊戲主題：</label>\n          <select class=\"select-unit\" id=\"unitSelect\" onchange=\"onUnitChange()\">\n            <option value=\"ALL\">🌐 全遊戲彙整總覽</option>\n          </select>\n        </div>\n\n        <!-- 第三層：班級下拉選單 -->\n        <div class=\"select-group\">\n          <label class=\"control-label\" for=\"classSelect\">🏫 班級：</label>\n          <select class=\"select-class\" id=\"classSelect\" onchange=\"onClassChange()\">\n            <option value=\"701\">701 班</option>\n            <option value=\"702\">702 班</option>\n            <option value=\"703\">703 班</option>\n            <option value=\"704\">704 班</option>\n            <option value=\"705\">705 班</option>\n            <option value=\"706\">706 班</option>\n            <option value=\"707\">707 班</option>\n            <option value=\"708\">708 班</option>\n            <option value=\"709\">709 班</option>\n            <option value=\"710\" selected>710 班</option>\n            <option value=\"七甲\">七甲</option>\n            <option value=\"七乙\">七乙</option>\n            <option value=\"七丙\">七丙</option>\n          </select>\n        </div>\n\n        <div class=\"seat-count-box\">\n          <span>應到：</span>\n          <input type=\"number\" class=\"input-seat-count\" id=\"totalSeatsInput\" value=\"30\" min=\"1\" max=\"50\" onchange=\"saveClassConfig(); renderDashboard();\" />\n          <span>人</span>\n        </div>\n\n        <!-- 🔮 切換大廳色 (綠/紫) 快捷按鈕 -->\n        <button type=\"button\" class=\"btn-control btn-hall-switch\" id=\"btnHallColorToggle\" onclick=\"toggleHallColor()\">\n          🔮 切換大廳色 (綠/紫)\n        </button>\n\n        <!-- 🌓 明暗模式切換按鈕 -->\n        <button type=\"button\" class=\"btn-control\" id=\"btnThemeToggle\" onclick=\"toggleColorMode()\">\n          <span id=\"themeToggleIcon\">🌙</span> <span id=\"themeToggleText\">深色模式</span>\n        </button>\n\n        <button type=\"button\" class=\"btn-control\" id=\"btnScoreToggle\" onclick=\"toggleTeacherScore()\">\n          👁️ 導師分數切換\n        </button>\n\n        <button type=\"button\" class=\"btn-control btn-refresh\" id=\"btnRefresh\" onclick=\"fetchLiveScores()\">\n          🔄 刷新資料\n        </button>\n      </div>\n    </header>\n\n    <!-- 測驗繳交參與率統計面板 -->\n    <section class=\"progress-panel\">\n      <div class=\"progress-header\">\n        <div class=\"progress-title\" id=\"progressClassTitle\">710 班 測驗繳交參與率</div>\n        <div class=\"progress-stats\">\n          已交：<span class=\"stat-done\" id=\"submittedCount\">0</span> / \n          實到應交：<span class=\"stat-req\" id=\"actualRequiredCount\">30</span> 人 \n          (<span class=\"stat-pct\" id=\"progressPercent\">0%</span>)\n        </div>\n      </div>\n\n      <div class=\"progress-bar-bg\">\n        <div class=\"progress-bar-fill\" id=\"progressBarFill\"></div>\n      </div>\n\n      <!-- 請假輸入列與快速動作按鈕 -->\n      <div class=\"action-subbar\">\n        <div class=\"absent-input-group\">\n          <label class=\"absent-label\">🏖️ 本班今日請假座號：</label>\n          <input type=\"text\" class=\"input-absent\" id=\"absentSeatsInput\" placeholder=\"請輸入請假座號 (例如：05, 12)，或直接點擊下方座號卡\" onchange=\"saveClassConfig(); renderDashboard();\" />\n          <span class=\"absent-note\">(將自動扣除應交人數)</span>\n        </div>\n\n        <div class=\"tool-btn-group\">\n          <button type=\"button\" class=\"btn-act btn-act-green\" onclick=\"openManualGradeModal()\">\n            ✍️ 手動補登成績\n          </button>\n          <button type=\"button\" class=\"btn-act btn-act-amber\" onclick=\"copyUnsubmittedList()\">\n            📋 複製未交名單\n          </button>\n          <button type=\"button\" class=\"btn-act btn-act-teal\" onclick=\"exportScoresCsv()\">\n            📥 匯出CSV\n          </button>\n        </div>\n      </div>\n    </section>\n\n    <!-- 雙欄主面板 -->\n    <main class=\"main-grid\">\n      <!-- 左欄：測驗榮譽英雄榜 Top 5 -->\n      <section class=\"panel-card\">\n        <h2>\n          <span>🎉 測驗榮譽英雄榜 (Top 5)</span>\n          <span class=\"sub-tip\" id=\"rankUnitFilterTip\">全班實力競技</span>\n        </h2>\n        <div class=\"top5-list\" id=\"top5List\">\n          <div class=\"empty-state\">尚無測驗紀錄</div>\n        </div>\n      </section>\n\n      <!-- 右欄：座號完成狀態圖 -->\n      <section class=\"panel-card\">\n        <h2>\n          <span>🔢 全班完成狀態圖 (點座號卡切換請假 / 查看成績)</span>\n          <span class=\"sub-tip\">未交點擊切換請假 · 已交點擊看明細</span>\n        </h2>\n        <div class=\"seat-grid\" id=\"seatGrid\"></div>\n      </section>\n    </main>\n  </div>\n\n  <!-- 手動補登成績彈窗 -->\n  <div class=\"modal-overlay\" id=\"manualModal\">\n    <div class=\"modal-box\">\n      <div class=\"modal-title\">✍️ 課堂手動補登成績</div>\n      <div class=\"modal-field\">\n        <label>座號：</label>\n        <input type=\"number\" class=\"modal-input\" id=\"manualSeat\" min=\"1\" max=\"50\" placeholder=\"例如：08 或 8\" />\n      </div>\n      <div class=\"modal-field\">\n        <label>學生姓名：</label>\n        <input type=\"text\" class=\"modal-input\" id=\"manualName\" placeholder=\"例如：林小明\" />\n      </div>\n      <div class=\"modal-field\">\n        <label>得分：</label>\n        <input type=\"number\" class=\"modal-input\" id=\"manualScore\" min=\"0\" max=\"100\" value=\"100\" />\n      </div>\n      <div class=\"modal-field\">\n        <label>遊戲主題 / 任務名稱：</label>\n        <input type=\"text\" class=\"modal-input\" id=\"manualRemark\" value=\"課堂紙筆測驗 / 實體補登\" />\n      </div>\n      <div class=\"modal-actions\">\n        <button type=\"button\" class=\"btn-control\" onclick=\"closeManualGradeModal()\">取消</button>\n        <button type=\"button\" class=\"btn-act btn-act-green\" onclick=\"submitManualGrade()\">確認補登並點燈 ✅</button>\n      </div>\n    </div>\n  </div>\n\n  <!-- Toast 訊息提示 -->\n  <div class=\"toast-msg\" id=\"toastMsg\"></div>\n\n  <script>\n    let rawRecords = [];\n    let isTeacherScoreShown = false;\n    let currentHall = localStorage.getItem(\"bio_dash_selected_hall\") || \"hall1\"; // 'hall1' (綠) | 'hall2' (粉)\n    let currentColorMode = localStorage.getItem(\"bio_dash_color_mode\") || \"light\"; // 'light' | 'dark'\n\n    // 大廳一 17 款共用題庫遊戲清單\n    const HALL1_GAMES = [\n      \"🏰 皇家古堡：生物密室逃脫\",\n      \"🔬 微觀特攻隊：細胞世界大暴走\",\n      \"🐇 奇幻仙境：愛麗絲生物密室逃脫\",\n      \"🏫 現代校園：生物密室逃脫\",\n      \"🐑 羊羊農場：生物大逃脫\",\n      \"🫘 淘氣豆：生物敲敲研究所\",\n      \"🐝 生物小蜜蜂：星際防衛隊\",\n      \"🚀 生物星際大逃亡：逃離黑洞\",\n      \"👾 生物小精靈塔防：微觀免疫大作戰\",\n      \"🧬 生物大墜落：細胞深淵下樓梯\",\n      \"🎣 生物大釣手：黃金深海大捕撈\",\n      \"🌱 植物大戰殭屍：細胞防衛戰\",\n      \"🗡️ 樂透大冒險：生物勇者傳奇\",\n      \"🍄 超級馬力歐生物闖關\",\n      \"🐰 動物方城市生物大富翁\",\n      \"🧬 生物能量祖瑪：光合呼吸大冒險\",\n      \"🦖 侏羅紀叢林逃生記\"\n    ];\n\n    // 大廳二 3 款獨立單元遊戲清單\n    const HALL2_GAMES = [\n      \"💩 人體消化大冒險 (54格完備版)\",\n      \"🧋 珍珠奶茶大對決 (喝光奶茶擂台版)\",\n      \"🔬 五界生物研究餐廳 (48種樣本・迴轉研究大餐)\"\n    ];\n\n    // 0. 主題樣式應用與切換\n    function applyThemes() {\n      const root = document.documentElement;\n      root.setAttribute(\"data-hall-theme\", currentHall === \"hall2\" ? \"pink\" : \"green\");\n      root.setAttribute(\"data-color-mode\", currentColorMode);\n\n      const titleEl = document.getElementById(\"dashboardMainTitle\");\n      const subTitleEl = document.getElementById(\"dashboardSubTitle\");\n      const hallSelect = document.getElementById(\"hallSelect\");\n      if (hallSelect) hallSelect.value = currentHall;\n\n      if (currentHall === \"hall2\") {\n        if (titleEl) titleEl.textContent = \"🌸 大廳二：獨立遊戲即時儀表板\";\n        if (subTitleEl) subTitleEl.textContent = \"獨立單元遊戲 ‧ 即時大螢幕點名 ‧ 專屬單元題庫\";\n      } else {\n        if (titleEl) titleEl.textContent = \"🌿 大廳一：互動遊戲即時儀表板\";\n        if (subTitleEl) subTitleEl.textContent = \"共用題庫遊戲 ‧ 即時大螢幕點名 ‧ 雙大廳色系聯動\";\n      }\n\n      const icon = document.getElementById(\"themeToggleIcon\");\n      const text = document.getElementById(\"themeToggleText\");\n      if (currentColorMode === \"dark\") {\n        if (icon) icon.textContent = \"☀️\";\n        if (text) text.textContent = \"明亮模式\";\n      } else {\n        if (icon) icon.textContent = \"🌙\";\n        if (text) text.textContent = \"深色模式\";\n      }\n    }\n\n    // 🔮 切換大廳色快捷鍵 (綠/紫一鍵切換)\n    function toggleHallColor() {\n      currentHall = (currentHall === \"hall1\") ? \"hall2\" : \"hall1\";\n      localStorage.setItem(\"bio_dash_selected_hall\", currentHall);\n      applyThemes();\n      updateUnitDropdown();\n      renderDashboard();\n      showToast(currentHall === \"hall2\" ? \"🔮 已切換為【大廳二：星空紫】主題\" : \"🌿 已切換為【大廳一：森林綠】主題\");\n    }\n\n    // 🌓 明暗色彩模式切換\n    function toggleColorMode() {\n      currentColorMode = (currentColorMode === \"dark\") ? \"light\" : \"dark\";\n      localStorage.setItem(\"bio_dash_color_mode\", currentColorMode);\n      applyThemes();\n      showToast(currentColorMode === \"dark\" ? \"🌙 已啟用深色夜間模式\" : \"☀️ 已啟用明亮色彩模式\");\n    }\n\n    // 第一層：手動改變大廳下拉\n    function onHallChange() {\n      const sel = document.getElementById(\"hallSelect\");\n      currentHall = sel.value;\n      localStorage.setItem(\"bio_dash_selected_hall\", currentHall);\n      applyThemes();\n      updateUnitDropdown();\n      renderDashboard();\n    }\n\n    // 第二層：動態根據目前大廳填入專屬遊戲清單\n    function updateUnitDropdown() {\n      const unitSelect = document.getElementById(\"unitSelect\");\n      if (!unitSelect) return;\n\n      const currentVal = unitSelect.value || \"ALL\";\n      unitSelect.innerHTML = '<option value=\"ALL\">🌐 全遊戲彙整總覽</option>';\n\n      const targetList = (currentHall === \"hall2\") ? HALL2_GAMES : HALL1_GAMES;\n      const groupLabel = (currentHall === \"hall2\") ? \"🧩 大廳二：獨立遊戲 (3款)\" : \"🎮 大廳一：共用題庫遊戲 (17款)\";\n\n      const optGroup = document.createElement(\"optgroup\");\n      optGroup.label = \"── \" + groupLabel + \" ──\";\n      targetList.forEach(g => {\n        const opt = document.createElement(\"option\");\n        opt.value = g;\n        opt.textContent = g;\n        optGroup.appendChild(opt);\n      });\n      unitSelect.appendChild(optGroup);\n\n      // 檢查試算表中是否有額外單元分頁\n      const classRegex = /^(7\\d{2}|七[甲乙丙]|\\d+班|[一二三四五六七八九]班)/;\n      const extraSet = new Set();\n      rawRecords.forEach(r => {\n        const u = String(r.units || \"\").trim();\n        if (u && !classRegex.test(u) && !u.includes(\"班級\") && !u.includes(\"座號\") && u !== \"ALL\") {\n          if (!HALL1_GAMES.some(g => g.includes(u)) && !HALL2_GAMES.some(g => g.includes(u))) {\n            extraSet.add(u);\n          }\n        }\n      });\n\n      if (extraSet.size > 0) {\n        const optGroupExtra = document.createElement(\"optgroup\");\n        optGroupExtra.label = \"── 📚 試算表其他測驗分頁 ──\";\n        extraSet.forEach(u => {\n          const opt = document.createElement(\"option\");\n          opt.value = u;\n          opt.textContent = \"📚 \" + u;\n          optGroupExtra.appendChild(opt);\n        });\n        unitSelect.appendChild(optGroupExtra);\n      }\n\n      // 若先前選中的選項在新清單中存在則保留，否則預設回 ALL\n      const exists = Array.from(unitSelect.options).some(o => o.value === currentVal);\n      unitSelect.value = exists ? currentVal : \"ALL\";\n    }\n\n    function onUnitChange() {\n      const unitSelect = document.getElementById(\"unitSelect\");\n      const val = unitSelect.value;\n      const rankTip = document.getElementById(\"rankUnitFilterTip\");\n      if (rankTip) {\n        rankTip.textContent = (val === \"ALL\") ? \"全班實力競技\" : val;\n      }\n      renderDashboard();\n    }\n\n    // 1. 班級字串統一正規化對照函式 (相容 \"710\", \"7年10班\", \"七年十班\", \"710班\", \"7-10\")\n    function normalizeClassStr(input) {\n      if (!input) return \"\";\n      const str = String(input).trim().replace(/班$/, \"\");\n      const matchSpecial = str.match(/(?:7|七)[\\s-]*([甲乙丙])/);\n      if (matchSpecial) return \"七\" + matchSpecial[1];\n      if (/^[甲乙丙]$/.test(str)) return \"七\" + str;\n\n      const digits = str.match(/\\d+/g);\n      if (digits) {\n        if (digits.length >= 2) {\n          return digits[0] + digits[1].padStart(2, \"0\");\n        } else if (digits.length === 1) {\n          const d = digits[0];\n          if (d.length === 3) return d;\n          if (d.length <= 2) return \"7\" + d.padStart(2, \"0\");\n        }\n      }\n      if (str.includes(\"十\")) return \"710\";\n      const cnMap = {\"一\":\"01\",\"二\":\"02\",\"三\":\"03\",\"四\":\"04\",\"五\":\"05\",\"六\":\"06\",\"七\":\"07\",\"八\":\"08\",\"九\":\"09\"};\n      for (const [cn, num] of Object.entries(cnMap)) {\n        if (str.includes(cn)) return \"7\" + num;\n      }\n      return str;\n    }\n\n    // 2. 座號數字純化函式 (例如 \"35號\" -> 35, \"05號\" -> 5)\n    function normalizeSeatNum(seat) {\n      if (seat === null || seat === undefined || seat === \"\") return null;\n      const match = String(seat).match(/\\d+/);\n      return match ? parseInt(match[0], 10) : null;\n    }\n\n    // 3. 連線抓取 Google 試算表最新成績\n    function fetchLiveScores() {\n      const btn = document.getElementById(\"btnRefresh\");\n      btn.textContent = \"⏳ 刷新中...\";\n      btn.disabled = true;\n\n      if (typeof google !== \"undefined\" && google.script && google.script.run) {\n        google.script.run\n          .withSuccessHandler(function(resp) {\n            btn.textContent = \"🔄 刷新資料\";\n            btn.disabled = false;\n            if (resp && resp.records) {\n              rawRecords = resp.records;\n              showToast(\"✅ 已同步最新資料 (\" + rawRecords.length + \" 筆紀錄)\");\n              updateUnitDropdown();\n              renderDashboard();\n            }\n          })\n          .withFailureHandler(function(err) {\n            btn.textContent = \"🔄 刷新資料\";\n            btn.disabled = false;\n            console.error(\"fetchLiveScores error:\", err);\n            showToast(\"⚠️ 取得資料發生問題：\" + err);\n          })\n          .getScoresData();\n      } else {\n        btn.textContent = \"🔄 刷新資料\";\n        btn.disabled = false;\n      }\n    }\n\n    function isUnitMatching(recordUnit, targetUnit) {\n      if (!targetUnit || targetUnit === 'ALL') return true;\n      const u = String(recordUnit || '').trim();\n      const t = String(targetUnit || '').trim();\n      if (u === t || u.includes(t) || t.includes(u)) return true;\n      // 萃取中文核心名稱比對（排除 Emoji 與副標題冒號前後）\n      const cleanCore = (s) => s.replace(/^[\\p{Emoji}\\s]+/u, '').split(/[:：]/)[0].trim();\n      const uCore = cleanCore(u);\n      const tCore = cleanCore(t);\n      if (uCore && tCore && (uCore.includes(tCore) || tCore.includes(uCore))) return true;\n      // 若學生記錄在通用『測驗成績紀錄』分頁，且該遊戲也是近期測驗，寬容採計\n      if (u === '測驗成績紀錄' || u === '自訂範圍') return true;\n      return false;\n    }\n\n    // 4. 渲染儀表板所有卡片與統計數字\n    function renderDashboard() {\n      const selectedClassRaw = document.getElementById(\"classSelect\").value;\n      const targetClassNorm = normalizeClassStr(selectedClassRaw);\n      const unitSelect = document.getElementById(\"unitSelect\");\n      const selectedUnit = unitSelect ? unitSelect.value : \"ALL\";\n\n      const unitTitleStr = (selectedUnit && selectedUnit !== \"ALL\") ? (\"【\" + selectedUnit + \"】\") : \"\";\n      document.getElementById(\"progressClassTitle\").textContent = selectedClassRaw + \" 班 \" + unitTitleStr + \" 測驗繳交參與率\";\n\n      // 依班級正規化過濾\n      let classRecords = rawRecords.filter(r => normalizeClassStr(r.className) === targetClassNorm);\n\n      // 若有選擇指定遊戲主題，精準過濾\n      if (selectedUnit && selectedUnit !== \"ALL\") {\n        classRecords = classRecords.filter(r => isUnitMatching(r.units, selectedUnit));\n      } else {\n        // 若選 ALL，保留此班所有紀錄或當前大廳紀錄\n        const targetList = (currentHall === \"hall2\") ? HALL2_GAMES : HALL1_GAMES;\n        classRecords = classRecords.filter(r => {\n          const u = String(r.units || \"\").trim();\n          if (u === '測驗成績紀錄' || u === '自訂範圍') return true;\n          return targetList.some(g => isUnitMatching(u, g));\n        });\n      }\n\n      // 取得請假座號集合\n      const absentInput = document.getElementById(\"absentSeatsInput\").value;\n      const absentSet = new Set(\n        absentInput.split(/[,，\\s]+/)\n          .map(s => normalizeSeatNum(s))\n          .filter(n => n !== null)\n      );\n\n      // 整理此班學生已交記錄 (以座號為 Key，取最高分)\n      const studentMap = new Map();\n      let maxSeatFound = 0;\n\n      classRecords.forEach(r => {\n        const seatNum = normalizeSeatNum(r.seat);\n        if (seatNum !== null) {\n          if (seatNum > maxSeatFound) maxSeatFound = seatNum;\n          const prev = studentMap.get(seatNum);\n          if (!prev || (Number(r.finalScore) > Number(prev.finalScore))) {\n            studentMap.set(seatNum, r);\n          }\n        }\n      });\n\n      // 1. 渲染測驗榮譽英雄榜 (Top 5)\n      const top5List = document.getElementById(\"top5List\");\n      const sortedStudents = Array.from(studentMap.values()).sort((a, b) => Number(b.finalScore) - Number(a.finalScore));\n      const top5 = sortedStudents.slice(0, 5);\n\n      if (top5.length === 0) {\n        top5List.innerHTML = '<div class=\"empty-state\">尚無測驗紀錄</div>';\n      } else {\n        const medals = [\"🥇\", \"🥈\", \"🥉\", \"✨\", \"🌟\"];\n        const badgeClasses = [\"badge-gold\", \"badge-silver\", \"badge-bronze\", \"badge-star\", \"badge-star\"];\n\n        top5List.innerHTML = top5.map((r, idx) => {\n          const seatFormatted = String(normalizeSeatNum(r.seat) || \"\").padStart(2, \"0\") + \" 號\";\n          return '<div class=\"top5-item\">' +\n            '<div class=\"top5-badge ' + badgeClasses[idx] + '\">' + medals[idx] + '</div>' +\n            '<div class=\"top5-info\">' +\n              '<div class=\"top5-name-row\">' +\n                '<span class=\"top5-name\">' + escapeHtml(r.name || \"學生\") + '</span>' +\n                '<span class=\"top5-seat\">' + seatFormatted + '</span>' +\n              '</div>' +\n              '<div class=\"top5-units\" title=\"' + escapeHtml(r.units || '') + '\">' + escapeHtml(r.units || '課堂測驗') + '</div>' +\n            '</div>' +\n            '<div class=\"top5-score-box\">' +\n              '<div class=\"top5-score\">' + r.finalScore + ' 分</div>' +\n              '<div class=\"top5-score-sub\">' + (r.errorCount > 0 ? ('錯 ' + r.errorCount + ' 題') : '全對滿分 💯') + '</div>' +\n            '</div>' +\n          '</div>';\n        }).join(\"\");\n      }\n\n      // 2. 渲染全班完成狀態圖 (座號卡片)\n      const configuredTotal = parseInt(document.getElementById(\"totalSeatsInput\").value, 10) || 30;\n      const renderLimit = Math.max(configuredTotal, maxSeatFound);\n\n      const grid = document.getElementById(\"seatGrid\");\n      grid.innerHTML = \"\";\n\n      let submittedCount = 0;\n      let absentCount = 0;\n\n      for (let seat = 1; seat <= renderLimit; seat++) {\n        const seatFormatted = String(seat).padStart(2, \"0\");\n        const isAbsent = absentSet.has(seat);\n        const record = studentMap.get(seat);\n        const isSubmitted = !!record;\n\n        let cardClass = \"pending\";\n        let statusText = \"加油中 💪\";\n        let icon = \"🍰\";\n        let studentNameHtml = \"\";\n        let scoreBadgeHtml = \"\";\n\n        if (isAbsent) {\n          absentCount++;\n          cardClass = \"absent\";\n          statusText = \"請假 🏖️\";\n          icon = \"🏖️\";\n        } else if (isSubmitted) {\n          submittedCount++;\n          cardClass = \"submitted\";\n          statusText = \"✅ 已完成\";\n          icon = \"🎉\";\n          studentNameHtml = '<div class=\"card-student-name\">' + escapeHtml(record.name || '學生') + '</div>';\n          scoreBadgeHtml = '<div class=\"card-score-badge\">' + record.finalScore + ' 分</div>';\n        }\n\n        grid.innerHTML += '<div class=\"seat-card ' + cardClass + '\" onclick=\"handleSeatCardClick(' + seat + ', ' + isSubmitted + ', ' + isAbsent + ')\" title=\"座號 ' + seatFormatted + ' 號 (點擊切換請假 / 查看成績)\">' +\n          '<div class=\"card-top-icon\">' + icon + '</div>' +\n          '<div class=\"card-seat-num\">' + seatFormatted + ' 號</div>' +\n          '<div class=\"card-status-text\">' + statusText + '</div>' +\n          studentNameHtml +\n          scoreBadgeHtml +\n        '</div>';\n      }\n\n      // 3. 計算實到應交與繳交率\n      const actualRequired = Math.max(1, configuredTotal - absentCount);\n      const percent = Math.min(100, Math.round((submittedCount / actualRequired) * 100));\n\n      document.getElementById(\"submittedCount\").textContent = submittedCount;\n      document.getElementById(\"actualRequiredCount\").textContent = actualRequired;\n      document.getElementById(\"progressPercent\").textContent = percent + \"%\";\n      document.getElementById(\"progressBarFill\").style.width = percent + \"%\";\n\n      if (percent >= 100 && submittedCount >= actualRequired) {\n        document.getElementById(\"progressPercent\").textContent = \"100% 🎉 應交全數完成！\";\n      }\n    }\n\n    // 5. 點擊座號卡：未交者點擊切換請假，已交者點擊查看學生詳情\n    function handleSeatCardClick(seatNum, isSubmitted, isAbsent) {\n      if (isSubmitted) {\n        const record = rawRecords.find(r => \n          normalizeClassStr(r.className) === normalizeClassStr(document.getElementById(\"classSelect\").value) &&\n          normalizeSeatNum(r.seat) === seatNum\n        );\n        if (record) {\n          const detail = \"【\" + record.className + \"班 \" + record.seat + \"號 \" + record.name + \"】\\n\" +\n                         \"• 測驗主題：\" + (record.units || '生物測驗') + \"\\n\" +\n                         \"• 原始得分：\" + record.originalScore + \" 分\\n\" +\n                         \"• 採計總分：\" + record.finalScore + \" 分\\n\" +\n                         \"• 錯題題數：\" + record.errorCount + \" 題\\n\" +\n                         \"• 訂正備註：\" + (record.keywords || '無') + \"\\n\" +\n                         \"• 視窗警示：\" + (record.switchCount || '正常') + \"\\n\" +\n                         \"• 繳交時間：\" + (record.timestamp || '');\n          alert(detail);\n          return;\n        }\n      }\n\n      // 未交者切換請假標記\n      toggleAbsentSeat(seatNum);\n    }\n\n    // 6. 切換請假狀態\n    function toggleAbsentSeat(seatNum) {\n      const input = document.getElementById(\"absentSeatsInput\");\n      const currentSet = new Set(\n        input.value.split(/[,，\\s]+/)\n          .map(s => normalizeSeatNum(s))\n          .filter(n => n !== null)\n      );\n\n      if (currentSet.has(seatNum)) {\n        currentSet.delete(seatNum);\n        showToast(\"已取消 \" + String(seatNum).padStart(2, '0') + \" 號請假標記\");\n      } else {\n        currentSet.add(seatNum);\n        showToast(\"已標記 \" + String(seatNum).padStart(2, '0') + \" 號為請假 (自動扣除應交)\");\n      }\n\n      const sorted = Array.from(currentSet).sort((a, b) => a - b);\n      input.value = sorted.map(n => String(n).padStart(2, \"0\")).join(\", \");\n      saveClassConfig();\n      renderDashboard();\n    }\n\n    // 7. 班級組態儲存與讀取 (LocalStorage)\n    function onClassChange() {\n      loadClassConfig();\n      renderDashboard();\n    }\n\n    function saveClassConfig() {\n      const cls = document.getElementById(\"classSelect\").value;\n      const total = document.getElementById(\"totalSeatsInput\").value;\n      const absent = document.getElementById(\"absentSeatsInput\").value;\n      localStorage.setItem(\"bio_dash_cfg_\" + cls + \"_total\", total);\n      localStorage.setItem(\"bio_dash_cfg_\" + cls + \"_absent\", absent);\n    }\n\n    function loadClassConfig() {\n      const cls = document.getElementById(\"classSelect\").value;\n      const savedTotal = localStorage.getItem(\"bio_dash_cfg_\" + cls + \"_total\") || \"30\";\n      const savedAbsent = localStorage.getItem(\"bio_dash_cfg_\" + cls + \"_absent\") || \"\";\n      document.getElementById(\"totalSeatsInput\").value = savedTotal;\n      document.getElementById(\"absentSeatsInput\").value = savedAbsent;\n    }\n\n    // 8. 導師分數切換\n    function toggleTeacherScore() {\n      isTeacherScoreShown = !isTeacherScoreShown;\n      const btn = document.getElementById(\"btnScoreToggle\");\n      if (isTeacherScoreShown) {\n        document.body.classList.add(\"show-teacher-scores\");\n        btn.textContent = \"🙈 遮蔽隱藏分數\";\n        showToast(\"👁️ 導師模式：已顯示各座號成績\");\n      } else {\n        document.body.classList.remove(\"show-teacher-scores\");\n        btn.textContent = \"👁️ 導師分數切換\";\n        showToast(\"🔒 學生隱私保護模式：已遮蔽分數\");\n      }\n    }\n\n    // 9. 複製未交名單到剪貼簿\n    function copyUnsubmittedList() {\n      const selectedClassRaw = document.getElementById(\"classSelect\").value;\n      const targetClassNorm = normalizeClassStr(selectedClassRaw);\n      const configuredTotal = parseInt(document.getElementById(\"totalSeatsInput\").value, 10) || 30;\n\n      const absentInput = document.getElementById(\"absentSeatsInput\").value;\n      const absentSet = new Set(\n        absentInput.split(/[,，\\s]+/)\n          .map(s => normalizeSeatNum(s))\n          .filter(n => n !== null)\n      );\n\n      const submittedSeats = new Set(\n        rawRecords\n          .filter(r => normalizeClassStr(r.className) === targetClassNorm)\n          .map(r => normalizeSeatNum(r.seat))\n          .filter(n => n !== null)\n      );\n\n      const missingSeats = [];\n      for (let seat = 1; seat <= configuredTotal; seat++) {\n        if (!absentSet.has(seat) && !submittedSeats.has(seat)) {\n          missingSeats.push(String(seat).padStart(2, \"0\"));\n        }\n      }\n\n      const absentStr = absentSet.size > 0 \n        ? Array.from(absentSet).sort((a,b)=>a-b).map(n => String(n).padStart(2, \"0\") + \"號\").join(\"、\")\n        : \"無\";\n\n      const missingStr = missingSeats.length > 0 \n        ? missingSeats.map(s => s + \"號\").join(\"、\") \n        : \"全數繳交完成 🎉\";\n\n      const text = \"【\" + selectedClassRaw + \" 班 生物測驗繳交進度回報】\\n\" +\n                   \"• 應到人數：\" + configuredTotal + \" 人 / 實到應交：\" + Math.max(0, configuredTotal - absentSet.size) + \" 人\\n\" +\n                   \"• 已交人數：\" + submittedSeats.size + \" 人 (繳交率：\" + Math.round((submittedSeats.size / Math.max(1, configuredTotal - absentSet.size)) * 100) + \"%)\\n\" +\n                   \"• 今日請假：\" + absentStr + \"\\n\" +\n                   \"• 尚未交卷座號：\" + missingStr + \"\\n\\n\" +\n                   \"請尚未繳交的同學確認送出，保護好個人作答成果！💪\";\n\n      navigator.clipboard.writeText(text).then(() => {\n        showToast(\"📋 已成功複製未交名單至剪貼簿！\");\n      }).catch(() => {\n        prompt(\"請手動複製以下未交名單：\", text);\n      });\n    }\n\n    // 10. 匯出 CSV 成績表\n    function exportScoresCsv() {\n      const selectedClassRaw = document.getElementById(\"classSelect\").value;\n      const targetClassNorm = normalizeClassStr(selectedClassRaw);\n      const unitSelect = document.getElementById(\"unitSelect\");\n      const selectedUnit = unitSelect ? unitSelect.value : \"ALL\";\n\n      let classRecords = rawRecords.filter(r => normalizeClassStr(r.className) === targetClassNorm);\n      if (selectedUnit && selectedUnit !== \"ALL\") {\n        classRecords = classRecords.filter(r => isUnitMatching(r.units, selectedUnit));\n      }\n\n      if (classRecords.length === 0) {\n        showToast(\"⚠️ 目前選取的班級與單元尚無成績紀錄可供匯出\");\n        return;\n      }\n\n      let csvContent = \"\\uFEFF交卷時間,班級,座號,姓名,測驗主題,原始得分,最終總分,錯題數,訂正心得,跳出次數,狀態備註\\n\";\n      classRecords.forEach(r => {\n        const row = [\n          r.timestamp || \"\",\n          r.className || selectedClassRaw,\n          r.seat || \"\",\n          r.name || \"\",\n          r.units || \"\",\n          r.originalScore !== undefined ? r.originalScore : \"\",\n          r.finalScore !== undefined ? r.finalScore : \"\",\n          r.errorCount !== undefined ? r.errorCount : 0,\n          (r.keywords || \"\").replace(/[\\n\\r,]/g, \" \"),\n          r.switchCount || 0,\n          r.statusNote || \"正常\"\n        ];\n        csvContent += row.map(v => '\"' + String(v).replace(/\"/g, '\"\"') + '\"').join(\",\") + \"\\n\";\n      });\n\n      const blob = new Blob([csvContent], { type: \"text/csv;charset=utf-8;\" });\n      const url = URL.createObjectURL(blob);\n      const link = document.createElement(\"a\");\n      link.setAttribute(\"href\", url);\n      link.setAttribute(\"download\", selectedClassRaw + \"班_生物課堂成績報表.csv\");\n      document.body.appendChild(link);\n      link.click();\n      document.body.removeChild(link);\n      showToast(\"📥 CSV 報表匯出成功！\");\n    }\n\n    // 11. 手動補登彈窗邏輯\n    function openManualGradeModal() {\n      const modal = document.getElementById(\"manualModal\");\n      modal.classList.add(\"active\");\n      const unitSelect = document.getElementById(\"unitSelect\");\n      const curUnit = (unitSelect && unitSelect.value !== \"ALL\") ? unitSelect.value : \"課堂實體手動補登\";\n      document.getElementById(\"manualRemark\").value = curUnit;\n      document.getElementById(\"manualSeat\").value = \"\";\n      document.getElementById(\"manualName\").value = \"\";\n      document.getElementById(\"manualScore\").value = \"100\";\n    }\n\n    function closeManualGradeModal() {\n      const modal = document.getElementById(\"manualModal\");\n      modal.classList.remove(\"active\");\n    }\n\n    function submitManualGrade() {\n      const cls = document.getElementById(\"classSelect\").value;\n      const seat = parseInt(document.getElementById(\"manualSeat\").value, 10);\n      const name = document.getElementById(\"manualName\").value.trim();\n      const score = parseFloat(document.getElementById(\"manualScore\").value) || 0;\n      const remark = document.getElementById(\"manualRemark\").value.trim() || \"課堂手動補登\";\n\n      if (!seat || seat < 1) {\n        alert(\"請輸入有效的學生座號 (1~50)\");\n        return;\n      }\n      if (!name) {\n        alert(\"請輸入學生姓名\");\n        return;\n      }\n\n      const seatFormatted = String(seat).padStart(2, \"0\");\n      if (typeof google !== \"undefined\" && google.script && google.script.run) {\n        google.script.run\n          .withSuccessHandler(function(res) {\n            if (res && res.status === \"success\") {\n              showToast(\"✅ \" + seatFormatted + \" 號 \" + name + \" 成績補登成功！\");\n              closeManualGradeModal();\n              fetchLiveScores();\n            } else {\n              alert(\"補登失敗：\" + (res ? res.message : \"未知錯誤\"));\n            }\n          })\n          .withFailureHandler(function(err) {\n            alert(\"補登連線失敗：\" + err);\n          })\n          .saveManualScoreBackend({\n            className: cls,\n            seat: seatFormatted,\n            name: name,\n            score: score,\n            units: remark,\n            note: \"老師手動補登\"\n          });\n      }\n    }\n\n    // 輔助函式：HTML 跳脫\n    function escapeHtml(text) {\n      if (!text) return \"\";\n      return String(text)\n        .replace(/&/g, \"&amp;\")\n        .replace(/</g, \"&lt;\")\n        .replace(/>/g, \"&gt;\")\n        .replace(/\"/g, \"&quot;\")\n        .replace(/'/g, \"&#039;\");\n    }\n\n    // 輔助函式：Toast 通知\n    let toastTimer = null;\n    function showToast(msg) {\n      const toast = document.getElementById(\"toastMsg\");\n      if (!toast) return;\n      toast.textContent = msg;\n      toast.classList.add(\"show\");\n      if (toastTimer) clearTimeout(toastTimer);\n      toastTimer = setTimeout(() => {\n        toast.classList.remove(\"show\");\n      }, 3500);\n    }\n\n    // 頁面初始化\n    applyThemes();\n    loadClassConfig();\n    updateUnitDropdown();\n    fetchLiveScores();\n    setInterval(fetchLiveScores, 15000); // 每 15 秒自動重新整理\n  </script>\n</body>\n</html>";
  return HtmlService.createHtmlOutput(html)
    .setTitle("🏆 國中生物測驗與遊戲即時儀表板")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
}
