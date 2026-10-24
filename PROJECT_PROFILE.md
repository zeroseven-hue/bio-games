# 🎮 專案 01：國中生物課堂網頁遊戲平台 (bio-games)

本檔案為 **大廳一（bio-games）** 之權威專案身分證與架構設定檔。

---

## 📌 專案基本資料

* **專案識別名稱**：`01_大廳一_生物互動遊戲平台 (bio-games)`
* **本機唯一路徑**：`D:\antigravity\教學專案系統\01_大廳一_生物互動遊戲平台 (bio-games)`
* **GitHub 倉庫**：[`zeroseven-hue/bio-games`](https://github.com/zeroseven-hue/bio-games)
* **GitHub Pages 線上站點**：[https://zeroseven-hue.github.io/bio-games/](https://zeroseven-hue.github.io/bio-games/)
* **Git 主要分支**：`master`
* **題庫架構核心**：**中央共享題庫（Central Shared Question Banks）**
  * 題庫索引：`questions/manifest.json`
  * 題目檔案：`questions/unit01_scientific_method.json` ～ `questions/unit15_human_defense.json`、`unit01_10_quick_quiz_50.json`、`unit11_15_quick_quiz_50.json`
  * 特點：全體 11 款遊戲連動，老師在後台更換單元或派發題庫時，所有遊戲題目同步切換！

---

## 🕹️ 大廳一收錄的 11 款遊戲清單

| 編號 | 目錄名稱 | 遊戲中文全名 | 核心玩法機制 | 題庫引用方式 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `jurassic/` | 🦖 《侏羅紀叢林逃生記》 | 地圖擲骰逃生、恐龍追逐、危機題目挑戰 | 共用題庫 (`../questions/`) |
| 2 | `monopoly/` | 🦊 《動物方程式：生物大富翁》 | 雙人/小組回合制大富翁、命運機會、地產建設 | 共用題庫 (`../questions/`) |
| 3 | `mario/` | 🍄 《超級瑪利歐：生物闖關》 | 橫向跳躍動作、撞擊問號磚塊答題挑戰 | 共用題庫 (`../questions/`) |
| 4 | `rpg/` | ⚔️ 《樂透大冒險：生物勇者傳奇》 | RPG 勇者打怪、生物知識回合制對戰、技能施放 | 共用題庫 (`../questions/`) |
| 5 | `pvz/` | 🌻 《植物大戰殭屍：細胞防衛戰》 | 植物塔防佈局、光合作用能量收集、答題防守 | 共用題庫 (`../questions/`) |
| 6 | `fishing/` | 🎣 《生物大釣手：黃金深海大捕撈》 | 黃金礦工 / 拋竿釣魚、答對捕獲稀有生物 | 共用題庫 (`../questions/`) |
| 7 | `shaft/` | 🧗 《生物大墜落：細胞深淵下樓梯》 | 是男人就下100層、踏階答題、躲避尖刺陷阱 | 共用題庫 (`../questions/`) |
| 8 | `pacman/` | 👻 《生物小精靈塔防》 | 經典迷宮吃豆、躲避鬼魂、吃大力丸答題逆襲 | 共用題庫 (`../questions/`) |
| 9 | `blackhole/` | 🌌 《生物星際大逃亡：逃離黑洞》 | 太空飛船逃逸、引力圈加速答題挑戰 | 共用題庫 (`../questions/`) |
| 10 | `defender/` | 🚀 《生物小蜜蜂：星際防衛隊》 | 經典小蜜蜂射擊、外星母艦生物題庫戰 | 共用題庫 (`../questions/`) |
| 11 | `bean/` | 🫘 《淘氣豆：生物敲敲研究所》 | 節奏敲擊、實驗室微觀知識判定反應遊戲 | 共用題庫 (`../questions/`) |

---

## ⚙️ 核心全域通用組件

* **遊戲大廳入口**：`index.html`、`lobby.css`、`lobby.js`
  * 支援動態渲染 11 款遊戲卡片
  * 支援教師自訂派發（選擇題庫範圍、抽題數 5~50 題、生成帶參數之 QR Code）
* **通用交卷彈窗**：`score-submit-modal.js`
  * 支援個人 / 小組提交模式
  * **班級固定選單**：`701` ～ `710`
  * **座號固定選單**：`01` ～ `35`
  * 自動儲存上次選擇之班級至 `localStorage`，兼顧換人防呆。
* **即時學習進度儀表板（GAS 版）**：`gas-dashboard/`
  * 後端邏輯：`gas-dashboard/Code.gs`
  * 前端大螢幕點名綠燈看板：`gas-dashboard/index.html`

---

## 🚫 邊界鐵則（嚴禁越界）

1. **不可動到大廳二**：大廳二為獨立題庫專案（`bio-standalone-games`），切勿將大廳二之專屬遊戲混入本專案。
2. **不可動到大廳三與四**：教學工具（`bio-tools`）與導師神器（`bio-classroom`）各自由獨立專案維護。
3. **題庫絕對不寫死**：本專案 11 款遊戲中，嚴禁在 JS 中把題目寫死，一律透過 `fetch('../questions/manifest.json')` 與單元檔案動態加載。
