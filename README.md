# 🎮 國中生物線上互動遊戲大廳 & 題庫中心 (Bio-Games)

本專案為國中七年級生物（108課綱）之全方位互動遊戲學習平台與權威題庫中心，直接部署發布於 GitHub Pages。

🌐 **線上遊戲大廳**：[https://zeroseven-hue.github.io/bio-games/](https://zeroseven-hue.github.io/bio-games/)

---

## 📂 目錄架構導覽

```text
bio-games/
├── 🎮 互動遊戲專區 (各遊戲獨立目錄，網頁靜態發布)
│   ├── bean/              # 綠豆人碰碰樂
│   ├── blackhole/         # 黑洞大冒險
│   ├── defender/          # 植物防衛戰
│   ├── fishing/           # 生物黃金釣魚池
│   ├── gas-dashboard/     # 雲端紀錄與儀表板
│   ├── jurassic/          # 侏儸紀生存
│   ├── mario/             # 馬力歐生物歷險
│   ├── monopoly/          # 動物大富翁
│   ├── pacman/            # 小精靈防禦陣
│   ├── pvz/               # 植物大戰殭屍
│   ├── rpg/               # 勇者生物冒險
│   ├── shaft/             # 地心礦坑逃脫
│   └── timer/             # 專注計時器
│
├── 📚 questions/          # 全平台唯一權威題庫專區
│   ├── 康軒版/             # bio01 (七上)、bio02 (七下)、快問快答
│   ├── 翰林版/             # bio01 (七上)、bio02 (七下)、快問快答
│   ├── 南一版/             # bio01 (七上)、bio02 (七下)、快問快答
│   └── manifest.json      # 題庫總索引與題數校準表
│
├── 🛠️ scripts/            # 核心維護與自動化工具腳本
│   ├── check_defectives.js          # 資深教師級題庫檢核、修復、同步與語法校驗核心
│   ├── audit_pedagogy.js            # 名師解析與遊戲適配性深度審核工具
│   └── fix_pedagogical_conflicts.js # 試題題幹與選項分流優化工具
│
├── 📑 docs/               # 系統健康度與檢核報告專區
│   ├── DEFECTIVES_AUDIT_REPORT.md   # 題庫零瑕疵稽核與修復報告
│   └── TEACHER_PEDAGOGICAL_AUDIT.md # 名師解析品質深度審查報告
│
└── 🌐 遊戲大廳入口檔案
    ├── index.html         # 遊戲大廳主頁面
    ├── lobby.js           # 大廳動態渲染與過濾邏輯
    ├── lobby.css          # 大廳視覺風格樣式
    └── games.json         # 遊戲清單與卡片配置
```

---

## 🛠️ 常用維護指令

所有維護腳本皆集中於 `scripts/` 目錄，可於本目錄下直接執行：

```bash
# 執行資深教師級題庫檢核、三版本同步與遊戲語法驗證
node scripts/check_defectives.js

# 執行試題觀念深度稽核
node scripts/audit_pedagogy.js
```
