---
name: github-deploy-workflow
description: >-
  Standard procedure for verifying, versioning, committing, and deploying web game updates to GitHub Pages for the bio-games repository.
  Use this skill whenever making changes or deploying updates to games in the bio-games project.
---

# GitHub Deployment & Asset Versioning Workflow (`bio-games`)

This skill defines the authoritative procedure for modifying, verifying, versioning, committing, and deploying static web games in the `bio-games` repository to GitHub Pages.

---

## 📋 Standard Deployment Rules & Checklist

Whenever creating or modifying code in `bio-games`, follow these 6 mandatory steps in order:

### 1. 🛡️ Traditional Chinese & Asset Integrity Check
- Ensure all user-facing text, notifications, and labels are 100% Traditional Chinese (`繁體中文`).
- Never use Simplified Chinese characters (e.g. use `關卡`, `第 1 關`, `重置`, `驗證`).
- Ensure visual assets (SVG, Emoji, CSS components) render cleanly without OS tint or line-wrapping bugs.

### 2. ⚡ Cache-Busting Query Version Bumping
Static GitHub Pages aggressively cache `.css` and `.js` files on student iPads and browser clients.
- Always increment the query version parameter `?v=X.Y` in:
  1. `<link rel="stylesheet" href="style.css?v=X.Y">` in the game's `index.html`
  2. `<script src="game.js?v=X.Y"></script>` in the game's `index.html`
  3. Game card links in root `index.html` (e.g., `<a href="rpg/index.html?v=X.Y"...>`)

### 3. 🧪 Automated Syntax Verification
Before committing, ALWAYS verify JavaScript syntax to prevent runtime crashes on live deployment:
```bash
node -c rpg/game.js
```
(Replace `rpg/game.js` with the target JS file path). The command must exit with code `0`.

### 4. 🔍 Git Repository Audit
Inspect modified files to ensure no stray debug code or unwanted scratch files are staged:
```bash
git status
```

### 5. 📦 Conventional Commit & Push
Use Conventional Commits format (`feat`, `fix`, `refactor`, `style`):
```bash
git add .
git commit -m "fix(rpg): V2.7 - Retain original cute 3D Panda face emoji with CSS grayscale(1) to eliminate purple tint"
git push origin master
```

### 6. 🌐 Live URL Reporting
After pushing, provide the user with the direct live URL containing the updated version string:
- Game direct URL: `https://zeroseven-hue.github.io/bio-games/<game_folder>/index.html?v=X.Y`
- Lobby portal URL: `https://zeroseven-hue.github.io/bio-games/`

---

## 🛠️ Repository Quick Reference

- **Working Directory**: `C:\Users\zeroj\.gemini\antigravity\scratch\bio-games`
- **Git Branch**: `master`
- **Remote**: `https://github.com/zeroseven-hue/bio-games.git`
- **Live Site**: `https://zeroseven-hue.github.io/bio-games/`
