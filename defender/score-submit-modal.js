/**
 * 🏆 Bio-Games 通用成績自動登錄組件 (Score Submit Modal Component)
 * 版本: v1.1
 * 功能: 提供個人/小組成績自動上傳至 Google 試算表 (GAS) 介面
 */
(function (global) {
  // 預設 GAS Web App 網址
  let DEFAULT_GAS_URL = global.DEFAULT_GAS_URL || 'https://script.google.com/macros/s/AKfycbzDHUfJKbGtgfYM5a1PHpQzbW2JGZL3zFTh582r95vcOKupGRfZVa0ToHbbfX1MirzbbQ/exec';

  // 動態注入 Modal CSS 樣式
  function injectStyles() {
    if (document.getElementById('scoreSubmitModalStyles')) return;
    const style = document.createElement('style');
    style.id = 'scoreSubmitModalStyles';
    style.textContent = `
      .ss-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999 !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 16px;
      }
      .ss-modal-card {
        background: #1e293b;
        border: 2px solid #38bdf8;
        border-radius: 24px;
        width: 100%;
        max-width: 440px;
        padding: 24px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        color: #f8fafc;
        animation: ssPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes ssPopIn {
        from { transform: scale(0.85); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .ss-modal-header { text-align: center; margin-bottom: 16px; }
      .ss-modal-header h3 { font-size: 1.35rem; margin: 0 0 6px 0; color: #38bdf8; font-weight: 900; }
      .ss-modal-header p { font-size: 0.88rem; color: #94a3b8; margin: 0; }
      .ss-score-banner {
        background: rgba(56, 189, 248, 0.1);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 14px;
        padding: 12px;
        text-align: center;
        margin-bottom: 16px;
      }
      .ss-score-banner .ss-score-val { font-size: 1.8rem; font-weight: 900; color: #f59e0b; }
      .ss-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        background: #0f172a;
        border-radius: 12px;
        padding: 4px;
        margin-bottom: 16px;
      }
      .ss-tab-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        padding: 8px;
        border-radius: 9px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .ss-tab-btn.active { background: #38bdf8; color: #0f172a; }
      .ss-form-group { margin-bottom: 14px; }
      .ss-form-group label { display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; color: #cbd5e1; }
      .ss-input, .ss-select {
        width: 100%;
        padding: 10px 14px;
        background: #0f172a;
        border: 1.5px solid #334155;
        border-radius: 12px;
        color: #ffffff;
        font-size: 0.95rem;
        box-sizing: border-box;
        outline: none;
      }
      .ss-input:focus, .ss-select:focus { border-color: #38bdf8; }
      .ss-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .ss-submit-btn {
        width: 100%;
        padding: 13px;
        background: linear-gradient(135deg, #0284c7, #0369a1);
        color: white;
        border: none;
        border-radius: 14px;
        font-size: 1.05rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
        transition: all 0.2s ease;
        margin-top: 8px;
      }
      .ss-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; background: #475569; box-shadow: none; }
      .ss-close-btn {
        width: 100%;
        padding: 10px;
        background: transparent;
        color: #94a3b8;
        border: none;
        border-radius: 12px;
        font-size: 0.85rem;
        cursor: pointer;
        margin-top: 6px;
      }
      .ss-result-box { text-align: center; padding: 16px 8px; }
      .ss-result-icon { font-size: 3.5rem; margin-bottom: 8px; }
      .ss-result-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 6px; }
      .ss-result-msg { font-size: 0.9rem; color: #94a3b8; line-height: 1.5; margin-bottom: 16px; }
    `;
    document.head.appendChild(style);
  }

  // 生成 Modal HTML DOM
  function createModalDOM(options) {
    // 移除舊的 Modal
    const existing = document.getElementById('ssModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'ss-modal-overlay';
    overlay.id = 'ssModalOverlay';

    const defaultClass = options.initialClass || localStorage.getItem('bio_games_last_class') || '701';
    const defaultSeat = options.initialSeat ? String(options.initialSeat).padStart(2, '0') : '01';
    const defaultName = options.initialName || '';

    const classOptionsHtml = Array.from({ length: 12 }, (_, i) => {
      const cls = `7${String(i + 1).padStart(2, '0')}`;
      return `<option value="${cls}" ${cls === defaultClass ? 'selected' : ''}>${cls} 班</option>`;
    }).join('');

    const seatOptionsHtml = Array.from({ length: 35 }, (_, i) => {
      const seat = String(i + 1).padStart(2, '0');
      return `<option value="${seat}" ${seat === defaultSeat ? 'selected' : ''}>${seat} 號</option>`;
    }).join('');

    const groupOptionsHtml = Array.from({ length: 12 }, (_, i) => {
      const grp = `第 ${i + 1} 組`;
      return `<option value="${grp}">${grp}</option>`;
    }).join('');

    overlay.innerHTML = `
      <div class="ss-modal-card" id="ssModalCard">
        <div class="ss-modal-header">
          <h3>📊 成績雲端登錄</h3>
          <p>${options.gameTitle || '課堂遊戲挑戰'}</p>
        </div>

        <div class="ss-score-banner">
          <div style="font-size: 0.85rem; color: #94a3b8;">本次挑戰得分 / 結果</div>
          <div class="ss-score-val">${options.scoreDisplay || options.score + ' 分'}</div>
          ${options.duration ? `<div style="font-size:0.8rem; color:#64748b; margin-top:2px;">⏱️ 狀態：${options.duration}</div>` : ''}
        </div>

        <div class="ss-tabs">
          <button class="ss-tab-btn active" id="ssTabIndiv">👤 個人提交</button>
          <button class="ss-tab-btn" id="ssTabGroup">👥 小組提交</button>
        </div>

        <form id="ssForm" onsubmit="return false;">
          <!-- 個人模式欄位 -->
          <div id="ssIndivFields">
            <div class="ss-row">
              <div class="ss-form-group">
                <label>班級</label>
                <select class="ss-select" id="ssClassSelect">
                  ${classOptionsHtml}
                </select>
              </div>
              <div class="ss-form-group">
                <label>座號</label>
                <select class="ss-select" id="ssSeatSelect">
                  ${seatOptionsHtml}
                </select>
              </div>
            </div>
            <div class="ss-form-group">
              <label>學生真實全名</label>
              <input type="text" class="ss-input" id="ssNameInput" value="${defaultName}" placeholder="請輸入姓名（勿填綽號）" maxlength="15" required />
            </div>
          </div>

          <!-- 小組模式欄位 -->
          <div id="ssGroupFields" style="display: none;">
            <div class="ss-row">
              <div class="ss-form-group">
                <label>班級</label>
                <select class="ss-select" id="ssGroupClassSelect">
                  ${classOptionsHtml}
                </select>
              </div>
              <div class="ss-form-group">
                <label>小組編號</label>
                <select class="ss-select" id="ssGroupNumSelect">
                  ${groupOptionsHtml}
                </select>
              </div>
            </div>
            <div class="ss-form-group">
              <label>同組組員座號</label>
              <input type="text" class="ss-input" id="ssGroupMembersInput" placeholder="例如：03, 08, 15, 22" maxlength="30" />
            </div>
          </div>

          <button type="button" class="ss-submit-btn" id="ssSubmitBtn">🚀 送出成績至老師試算表</button>
          <button type="button" class="ss-close-btn" id="ssCloseBtn">跳過，關閉視窗</button>
        </form>

        <div id="ssResultContainer" style="display:none;"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    let currentMode = 'individual';
    const tabIndiv = overlay.querySelector('#ssTabIndiv');
    const tabGroup = overlay.querySelector('#ssTabGroup');
    const indivFields = overlay.querySelector('#ssIndivFields');
    const groupFields = overlay.querySelector('#ssGroupFields');
    const submitBtn = overlay.querySelector('#ssSubmitBtn');
    const closeBtn = overlay.querySelector('#ssCloseBtn');

    tabIndiv.addEventListener('click', () => {
      currentMode = 'individual';
      tabIndiv.classList.add('active');
      tabGroup.classList.remove('active');
      indivFields.style.display = 'block';
      groupFields.style.display = 'none';
    });

    tabGroup.addEventListener('click', () => {
      currentMode = 'group';
      tabGroup.classList.add('active');
      tabIndiv.classList.remove('active');
      groupFields.style.display = 'block';
      indivFields.style.display = 'none';
    });

    closeBtn.addEventListener('click', () => {
      overlay.remove();
      if (options.onClose) options.onClose();
    });

    submitBtn.addEventListener('click', async () => {
      const gasUrl = options.gasUrl || DEFAULT_GAS_URL;
      if (!gasUrl) {
        alert('⚠️ 尚未設定 Google 試算表接收網址！');
        return;
      }

      let payload = {
        gameTitle: options.gameTitle || '課堂遊戲',
        score: options.score || 0,
        duration: options.duration || '--:--',
        mode: currentMode,
        timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
      };

      if (currentMode === 'individual') {
        const cls = overlay.querySelector('#ssClassSelect').value;
        const seat = overlay.querySelector('#ssSeatSelect').value;
        const name = overlay.querySelector('#ssNameInput').value.trim();

        if (!name) {
          alert('請輸入姓名！');
          overlay.querySelector('#ssNameInput').focus();
          return;
        }

        payload.class = cls;
        payload.seatOrGroup = `${seat}號`;
        payload.nameOrMembers = name;
        localStorage.setItem('bio_games_last_class', cls);

        if (!confirm(`請確認資料是否正確：\n\n【${cls}班 ${seat}號】${name}\n得分：${options.scoreDisplay || options.score}`)) return;
      } else {
        const cls = overlay.querySelector('#ssGroupClassSelect').value;
        const grp = overlay.querySelector('#ssGroupNumSelect').value;
        const members = overlay.querySelector('#ssGroupMembersInput').value.trim() || '未填寫組員';

        payload.class = cls;
        payload.seatOrGroup = grp;
        payload.nameOrMembers = members;
        localStorage.setItem('bio_games_last_class', cls);

        if (!confirm(`請確認小組資料是否正確：\n\n【${cls}班 ${grp}】\n組員：${members}\n得分：${options.scoreDisplay || options.score}`)) return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = '⏳ 正在傳送成績中...';

      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        overlay.querySelector('#ssForm').style.display = 'none';
        const resultBox = overlay.querySelector('#ssResultContainer');
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div class="ss-result-box">
            <div class="ss-result-icon">🎉</div>
            <div class="ss-result-title" style="color:#4ade80">成績登錄成功！</div>
            <div class="ss-result-msg">
              已順利登記至老師的 Google 試算表！<br/>
              <b>【${payload.class} 班 ${payload.seatOrGroup}】${payload.nameOrMembers}</b><br/>
              得分：${payload.score} 分<br/>
              辛苦了！可以安心關閉此視窗囉！
            </div>
            <button class="ss-submit-btn" id="ssFinishBtn" style="background:linear-gradient(135deg, #16a34a, #15803d);">👌 完成關閉</button>
          </div>
        `;

        overlay.querySelector('#ssFinishBtn').addEventListener('click', () => {
          overlay.remove();
          if (options.onSuccess) options.onSuccess(payload);
        });

      } catch (err) {
        console.error('Submit Score Error:', err);
        submitBtn.disabled = false;
        submitBtn.innerText = '❌ 傳送失敗，請重試';
        alert('網路傳送稍慢，請再試一次！');
      }
    });
  }

  global.showScoreSubmitModal = function (options) {
    injectStyles();
    createModalDOM(options || {});
  };

})(window);
