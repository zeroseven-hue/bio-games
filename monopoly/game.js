let students = [], chanceList = [], destinyList = [], noveltyList = [], buildingList = [];
let cellsData = [], currentPos = 0, isDrawing = false, cellCoordinates = [];
let gameHistory = []; 
let countdownTimer = null; 

let soundEnabled = true;
let timerEnabled = true;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTickSound() {
    if (!soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function playWinSound() {
    if (!soundEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    [440, 554, 659, 880].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.5);
        osc.start(audioCtx.currentTime + i * 0.1); osc.stop(audioCtx.currentTime + i * 0.1 + 0.5);
    });
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btnSound');
    btn.className = soundEnabled ? 'toggle-btn active' : 'toggle-btn';
    btn.innerHTML = soundEnabled ? '🔊' : '🔇';
}

function toggleTimer() {
    timerEnabled = !timerEnabled;
    const btn = document.getElementById('btnTimer');
    btn.className = timerEnabled ? 'toggle-btn active' : 'toggle-btn';
    btn.innerHTML = timerEnabled ? '⏱️' : '⏳';
}

window.onload = () => { 
    applySettings(); 
};

window.addEventListener('resize', () => {
    if(cellsData.length > 0) {
        setTimeout(updateCoordinates, 100);
    }
});

function applySettings() {
    students = document.getElementById('inputStudents').value.split('\n').filter(s=>s.trim()).map(s=>s.split(',')[1]||s);
    chanceList = document.getElementById('inputChance').value.split('\n').filter(s=>s.trim());
    destinyList = document.getElementById('inputDestiny').value.split('\n').filter(s=>s.trim());
    noveltyList = document.getElementById('inputNovelty').value.split('\n').filter(s=>s.trim());
    buildingList = document.getElementById('inputBuildings').value.split('\n').filter(s=>s.trim());
    
    while(students.length < 24) students.push(...students); 
    
    generateBoard();
    closeSettings();
}

function generateBoard() {
    const board = document.getElementById('board');
    document.querySelectorAll('.cell').forEach(e => e.remove());
    cellsData = []; 
    
    const coords = [];
    for (let i = 1; i <= 10; i++) coords.push({ c: i, r: 1 });
    for (let i = 2; i <= 7; i++) coords.push({ c: 10, r: i });
    for (let i = 10; i >= 1; i--) coords.push({ c: i, r: 8 });
    for (let i = 7; i >= 2; i--) coords.push({ c: 1, r: i });

    coords.forEach((pos, idx) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${idx}`;
        cell.style.gridColumn = pos.c; cell.style.gridRow = pos.r;
        let type = 'student', text = students[idx % students.length] || "同學", icon = '🐾';
        if ([0, 15].includes(idx)) { type='chance'; text='機會'; icon='❓'; cell.classList.add('corner','chance'); }
        else if ([9, 24].includes(idx)) { type='destiny'; text='命運'; icon='❗'; cell.classList.add('corner','destiny'); }
        else { cell.style.backgroundColor = ['#FFF9C4','#E1F5FE','#FCE4EC','#E8F5E9','#FFE082'][idx%5]; }
        
        cell.innerHTML = `
            <div class="cell-icon">${icon}</div>
            <div class="cell-text">${text}</div>
            <div class="building-area" id="build-${idx}"></div>
            <div class="highlight-box" id="box-${idx}"></div>`;
        board.appendChild(cell);
        cellsData.push({ type, text });
    });

    setTimeout(updateCoordinates, 300); 
}

function updateCoordinates() {
    cellCoordinates = [];
    const board = document.getElementById('board');
    const bRect = board.getBoundingClientRect();
    document.querySelectorAll('.cell').forEach(c => {
        const r = c.getBoundingClientRect();
        cellCoordinates.push({ x: r.left - bRect.left + r.width/2, y: r.top - bRect.top + r.height/2 });
    });
    const judy = document.getElementById('judyToken');
    if(judy.style.display !== 'none' && cellCoordinates[currentPos]) {
         judy.style.left = `${cellCoordinates[currentPos].x}px`; 
         judy.style.top = `${cellCoordinates[currentPos].y}px`;
    }
}

function startDraw(isQuick = false) {
    if (isDrawing) return;
    if (audioCtx.state === 'suspended' && soundEnabled) audioCtx.resume(); 
    isDrawing = true;
    
    let v1 = Math.floor(Math.random()*6) + 1;
    let v2 = Math.floor(Math.random()*6) + 1;
    const stepsToMove = v1 + v2 + (isQuick ? 0 : 20); 
    
    setTimeout(() => startJumping(stepsToMove, isQuick), 100);
}

function startJumping(steps, isQuick) {
    document.getElementById('judyToken').style.display = 'flex';
    let speed = isQuick ? 80 : 120;
    
    const run = () => {
        document.getElementById(`box-${currentPos}`).style.display = 'none';
        currentPos = (currentPos + 1) % cellsData.length;
        document.getElementById(`box-${currentPos}`).style.display = 'block';
        
        playTickSound();

        if (cellCoordinates[currentPos]) {
            const p = cellCoordinates[currentPos];
            const judy = document.getElementById('judyToken');
            judy.style.left = `${p.x}px`; judy.style.top = `${p.y}px`;
            judy.classList.remove('is-jumping');
            void judy.offsetWidth; 
            judy.style.animationDuration = `${speed/1000}s`;
            judy.classList.add('is-jumping');
        }

        steps--;
        if (steps > 0) {
            if (steps < 8 && !isQuick) speed += 50; 
            setTimeout(run, speed);
        } else { setTimeout(showResult, 600); }
    };
    run();
}

function startCountdown() {
    if (!timerEnabled) return;
    const timerArea = document.getElementById('timerArea');
    let timeLeft = 30; 

    timerArea.style.display = 'block';
    timerArea.classList.remove('warning');
    timerArea.innerHTML = `⏱️ <span id="timeCount">${timeLeft}</span> 秒`;

    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        timeLeft--;
        const countSpan = document.getElementById('timeCount');
        if (countSpan) countSpan.innerText = timeLeft;
        
        if (timeLeft <= 10 && timeLeft > 0) {
            timerArea.classList.add('warning'); 
        } else if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            timerArea.innerHTML = "🚨 時間到！";
        }
    }, 1000);
}

function showResult() {
    const res = cellsData[currentPos];
    const nArea = document.getElementById('noveltyArea');
    const timerArea = document.getElementById('timerArea');
    const actions = document.getElementById('actionButtons');
    let recordDetail = "";
    
    playWinSound();

    nArea.style.display = 'none';
    timerArea.style.display = 'none'; 
    clearInterval(countdownTimer); 
    actions.innerHTML = '';

    if (res.type === 'student') {
        document.getElementById('eventTitle').innerText = '🎯 抽中了！';
        let msg = `挑戰者：${res.text}`;
        document.getElementById('eventDesc').innerText = msg;
        recordDetail = msg;
        
        startCountdown(); 

        if (noveltyList.length > 0) {
            const task = noveltyList[Math.floor(Math.random()*noveltyList.length)];
            nArea.style.display = 'block';
            document.getElementById('noveltyTask').innerText = task;
            recordDetail += ` (任務：${task})`;
        }
        
        actions.innerHTML = `
            <button class="ctrl-btn" onclick="buildHouse()" style="background:#FFB300; color:#000; flex:1; font-size:18px;">🏠 答對蓋建築</button>
            <button class="ctrl-btn" onclick="closeEventModal()" style="background:#E0E0E0; color:#000; flex:1; font-size:18px;">❌ 放棄/關閉</button>
        `;

    } else {
        const list = res.type === 'chance' ? chanceList : destinyList;
        const content = list[Math.floor(Math.random()*list.length)];
        document.getElementById('eventTitle').innerText = res.type === 'chance' ? '✨ 閃亮機會' : '💢 驚奇命運';
        document.getElementById('eventDesc').innerText = content;
        recordDetail = content;
        
        actions.innerHTML = `<button class="ctrl-btn" onclick="closeEventModal()" style="background:#0288D1; color:#FFF; width:100%; font-size:18px;">確認 🐰</button>`;
    }
    
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    gameHistory.push({ time: timeStr, target: res.text, detail: recordDetail });
    document.getElementById('eventModal').style.display = 'flex';
}

function buildHouse() {
    clearInterval(countdownTimer); 
    const recBuilding = buildingList[Math.floor(Math.random()*buildingList.length)] || "動物園區";
    
    const bName = prompt("🎉 答對了！為你的領地命名：", recBuilding);
    
    if (bName && bName.trim() !== "") {
        const buildArea = document.getElementById(`build-${currentPos}`);
        const badge = document.createElement('div');
        badge.className = 'building-badge';
        badge.innerText = `🏠 ${bName}`;
        buildArea.appendChild(badge);
        
        const lastHistory = gameHistory[gameHistory.length - 1];
        if(lastHistory) {
            lastHistory.detail += ` 👉 成功建立：【${bName}】`;
        }
        
        alert(`太棒了！【${bName}】建設完成！🚔`);
    }
    closeEventModal();
}

/* 規則彈窗開關 */
function openRules() {
    document.getElementById('rulesModal').style.display = 'flex';
}
function closeRules() {
    document.getElementById('rulesModal').style.display = 'none';
}

function openHistory() {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = gameHistory.map(h => `<tr><td>${h.time}</td><td>${h.target}</td><td>${h.detail}</td></tr>`).join('') || '<tr><td colspan="3" style="text-align:center;">尚無紀錄</td></tr>';
    document.getElementById('historyModal').style.display = 'flex';
}

function exportHistory() {
    if(gameHistory.length === 0) return alert("目前沒有紀錄可以匯出！");
    let csv = "\uFEFF時間,對象/地點,詳細內容\n";
    gameHistory.forEach(h => { csv += `${h.time},${h.target},"${h.detail.replace(/"/g, '""')}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `大富翁紀錄_${new Date().getTime()}.csv`;
    link.click();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
        const data = evt.target.result;
        const workbook = XLSX.read(data, {type: 'binary'});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, {header: 1});
        const list = json.map(row => row.join(',')).join('\n');
        document.getElementById('inputStudents').value = list;
    };
    reader.readAsBinaryString(file);
}

function closeEventModal() { 
    document.getElementById('eventModal').style.display = 'none'; 
    isDrawing = false; 
    clearInterval(countdownTimer); 
}
function openSettings() { document.getElementById('settingsModal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }
function closeHistory() { document.getElementById('historyModal').style.display = 'none'; }
function shuffleStudents() { students.sort(()=>Math.random()-0.5); generateBoard(); }