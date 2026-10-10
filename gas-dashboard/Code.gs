/**
 * 📊 國中生物課堂遊戲 - 後端服務與即時儀表板程式碼 (Code.gs)
 * 製作單位：Google DeepMind Antigravity Agent
 */

// 1. 處理網頁開啟請求 (老師打開 URL 即可看到即時儀表板)
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('📊 生物課堂遊戲即時成績儀表板')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// 2. 處理學生遊戲端提交成績請求 (POST) - 含 IDE 測試防呆
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = {};

    // 💡 防呆判斷：防止在 Apps Script 編輯器手動點擊「► 執行」時 e 為 undefined 出錯
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      // 若在編輯器手動按執行測試，提供範例測試資料
      data = {
        class: '701',
        gameTitle: '測試遊戲',
        mode: 'individual',
        seatOrGroup: '01號',
        nameOrMembers: '測試學生',
        score: 100,
        duration: '01:00'
      };
    }

    var className = data.class || '701';
    var gameTitle = data.gameTitle || '課堂遊戲';
    var mode = data.mode === 'group' ? '👥 小組' : '👤 個人';
    var seatOrGroup = data.seatOrGroup || '';
    var nameOrMembers = data.nameOrMembers || '';
    var score = data.score !== undefined ? data.score : 0;
    var duration = data.duration || '--:--';
    var timestamp = data.timestamp || new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    // A. 寫入按「班級」自動建立的工作表 (例如 701, 702)
    var targetSheet = sheet.getSheetByName(className);
    if (!targetSheet) {
      targetSheet = sheet.insertSheet(className);
      targetSheet.appendRow(['提交時間', '遊戲名稱', '模式', '座號/組別', '姓名/組員座號', '得分', '遊戲耗時']);
      targetSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#e0f2fe');
    }
    targetSheet.appendRow([timestamp, gameTitle, mode, seatOrGroup, nameOrMembers, score, duration]);

    // B. 彙整寫入「所有成績彙整」總表
    var allSheet = sheet.getSheetByName('所有成績彙整');
    if (!allSheet) {
      allSheet = sheet.insertSheet('所有成績彙整');
      allSheet.appendRow(['提交時間', '班級', '遊戲名稱', '模式', '座號/組別', '姓名/組員座號', '得分', '遊戲耗時']);
      allSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#fef08a');
    }
    allSheet.appendRow([timestamp, className, gameTitle, mode, seatOrGroup, nameOrMembers, score, duration]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Score saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. 供儀表板 (index.html) 抓取即時資料
function getScoresData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var allSheet = sheet.getSheetByName('所有成績彙整');
  
  if (!allSheet) {
    return { records: [], classes: [] };
  }

  var data = allSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { records: [], classes: [] };
  }

  var records = [];
  var classSet = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var cls = String(row[1] || '').trim();
    if (cls) classSet[cls] = true;

    records.push({
      timestamp: row[0],
      className: row[1],
      gameTitle: row[2],
      mode: row[3],
      seatOrGroup: row[4],
      nameOrMembers: row[5],
      score: Number(row[6]) || 0,
      duration: row[7]
    });
  }

  records.reverse(); // 最新資料放最上面

  return {
    records: records,
    classes: Object.keys(classSet).sort()
  };
}
