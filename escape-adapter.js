/**
 * escape-adapter.js - 密室逃脫系列共用題庫與大螢幕/iPad模式適配器
 * 支援功能：
 * 1. 課堂大廳 QR Code 派卷 (URL 參數: unit, mode, qcount, timer)
 * 2. 自動連線 ../questions/ 共用生物題庫
 * 3. 60~70 吋全班大螢幕投影主持 vs iPad 個人自主挑戰視圖自動切換
 */

(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const unitParam = params.get('unit') || params.get('file');
  const modeParam = params.get('mode'); // 'projector' | 'solo' | 'group-tablet'

  // 1. 樣式注入：大螢幕 (60~70 吋) 強化與 iPad 最佳化
  function injectResponsiveStyles() {
    const style = document.createElement('style');
    style.id = 'escape-adapter-styles';
    style.textContent = `
      /* 🖥️ 全班大螢幕投影主持模式 (60~70 吋專用) */
      body.mode-projector {
        font-size: 1.15rem;
      }
      body.mode-projector .hud,
      body.mode-projector header {
        transform-origin: top center;
      }
      body.mode-projector .dialogue,
      body.mode-projector .rpgBar,
      body.mode-projector section.dialogue {
        font-size: 1.25rem !important;
        line-height: 1.6 !important;
      }
      body.mode-projector .panel,
      body.mode-projector .modal .panel {
        font-size: 1.2rem !important;
        max-width: 900px !important;
        padding: 24px 32px !important;
      }
      body.mode-projector button.btn,
      body.mode-projector button.primary,
      body.mode-projector .answers button {
        font-size: 1.15rem !important;
        padding: 14px 20px !important;
        font-weight: 800 !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
      }
      body.mode-projector .answers button:hover,
      body.mode-projector .answers button:focus {
        outline: 3px solid #38bdf8 !important;
      }

      /* 🧑‍🚀 個人自主模式 (iPad / 平板最佳化) */
      body.mode-solo {
        touch-action: manipulation;
        -webkit-user-select: none;
        user-select: none;
      }
      body.mode-solo button {
        min-height: 44px;
        min-width: 44px;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. 模式套用
  function applyMode() {
    if (modeParam === 'projector') {
      document.body.classList.add('mode-projector');
    } else if (modeParam === 'solo') {
      document.body.classList.add('mode-solo');
    } else if (modeParam === 'group-tablet') {
      document.body.classList.add('mode-group');
    }
  }

  // 3. 洗牌演算法
  function shuffle(arr) {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  }

  // 4. 標準化共用題庫試題物件
  function normalizeQuestions(rawList) {
    if (!Array.isArray(rawList)) return [];
    const valid = [];
    for (const q of rawList) {
      if (!q || !q.question || !Array.isArray(q.options) || q.options.length < 2) continue;
      let ans = q.answer;
      if (typeof ans === 'string') {
        const letters = ['A', 'B', 'C', 'D'];
        const idx = letters.indexOf(ans.trim().toUpperCase());
        if (idx >= 0) ans = idx;
        else ans = q.options.findIndex(o => o && o.trim() === q.answer.trim());
      }
      if (typeof ans !== 'number' || ans < 0 || ans >= q.options.length) continue;
      valid.push({
        id: q.id || 'Q-' + Math.random().toString(36).substr(2, 6),
        question: q.question.trim(),
        options: q.options.map(o => String(o).trim()),
        answer: ans,
        explanation: q.explanation || '正確解答為：' + q.options[ans],
        difficulty: q.difficulty || '中'
      });
    }
    return valid;
  }

  // 5. 載入並注入試題
  async function loadSharedQuestions() {
    if (!unitParam) return;
    try {
      const candidates = [
        `../questions/${unitParam}`,
        `questions/${unitParam}`
      ];
      let res = null;
      for (const url of candidates) {
        try {
          const r = await fetch(url);
          if (r.ok) { res = r; break; }
        } catch (_) {}
      }
      if (!res) throw new Error('無法讀取題庫檔案: ' + unitParam);

      const data = await res.json();
      const rawList = data.questions || (Array.isArray(data) ? data : []);
      const questions = shuffle(normalizeQuestions(rawList));
      if (!questions.length) throw new Error('題庫無有效題目');

      // 等候遊戲本體 Hook 就緒
      let retryCount = 0;
      const interval = setInterval(() => {
        retryCount++;
        const hook = window.__ESCAPE_HOOK__;
        if (hook || retryCount > 50) {
          clearInterval(interval);
          if (hook) {
            injectQuestionsToGame(hook, questions);
          }
        }
      }, 100);

    } catch (err) {
      console.warn('載入大廳共用題庫失敗，使用遊戲預設情境題目:', err);
    }
  }

  // 6. 依據遊戲類型將試題精準寫入各關探索點
  function injectQuestionsToGame(hook, pool) {
    if (!pool || !pool.length) return;
    const type = hook.type;
    let poolIdx = 0;

    if (type === 'micro' && hook.levels) {
      // 微觀科幻：levels[stage].items = [name, x, y, question, options, ans, exp]
      hook.levels.forEach(lvl => {
        if (!Array.isArray(lvl.items)) return;
        lvl.items.forEach(it => {
          if (poolIdx < pool.length) {
            const q = pool[poolIdx++];
            it[3] = q.question;
            it[4] = q.options;
            it[5] = q.answer;
            it[6] = q.explanation;
          }
        });
      });
    } else if (type === 'alice' && hook.levels) {
      // 愛麗絲：LEVELS[stage].items = [name, x, y, question, options, ans, exp]
      hook.levels.forEach(lvl => {
        if (!Array.isArray(lvl.items)) return;
        lvl.items.forEach(it => {
          if (poolIdx < pool.length) {
            const q = pool[poolIdx++];
            it[3] = q.question;
            it[4] = q.options;
            it[5] = q.answer;
            it[6] = q.explanation;
          }
        });
      });
    } else if (type === 'school' && hook.stages) {
      // 現代校園：stages[stage].items = [name, x, y, w, h, question, options, ans, exp]
      hook.stages.forEach(st => {
        if (!Array.isArray(st.items)) return;
        st.items.forEach(it => {
          if (poolIdx < pool.length) {
            const q = pool[poolIdx++];
            it[5] = q.question;
            it[6] = q.options;
            it[7] = q.answer;
            it[8] = q.explanation;
          }
        });
      });
    } else if (type === 'castle') {
      // 皇家古堡：更新 state.questions
      if (hook.setQuestions) {
        hook.setQuestions(pool);
      }
    } else if (type === 'farm') {
      // 羊羊農場：更新 questionBank
      if (hook.setBank) {
        hook.setBank(pool);
      }
    }
  }

  // 7. 啟動入口
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectResponsiveStyles();
      applyMode();
      loadSharedQuestions();
    });
  } else {
    injectResponsiveStyles();
    applyMode();
    loadSharedQuestions();
  }

  window.EscapeAdapter = {
    injectQuestionsToGame,
    normalizeQuestions
  };
})();
