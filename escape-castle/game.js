// 皇家古堡：生物密室逃脫 - 優化版
const SCENE_ASSETS = [
  'assets/scene0.png',
  'assets/scene1.png',
  'assets/scene2.png',
  'assets/scene3.png'
];

const PORTABLE_CSS = '';
const PORTABLE_LOGIC = '';

const DEMO_QUESTIONS=[{"id": 1, "question": "細胞是生物體構造與功能的基本單位。下列何者正確？", "options": ["所有生物都有細胞壁", "細胞膜能控制物質進出", "細胞核負責行光合作用", "粒線體只存在植物細胞"], "answer": 1, "difficulty": "易", "explanation": "細胞膜具有選擇性，能調節物質進出。"}, {"id": 2, "question": "植物細胞與動物細胞相比，通常多了哪一種構造？", "options": ["細胞膜", "細胞質", "細胞壁", "細胞核"], "answer": 2, "difficulty": "易", "explanation": "植物細胞通常具有細胞壁，提供支持與保護。"}, {"id": 3, "question": "觀察洋蔥表皮細胞時，使用哪一種工具最適合？", "options": ["望遠鏡", "複式顯微鏡", "放大鏡看遠處", "溫度計"], "answer": 1, "difficulty": "易", "explanation": "細胞體積微小，通常需使用顯微鏡觀察。"}, {"id": 4, "question": "下列何者屬於單細胞生物？", "options": ["草履蟲", "蚯蚓", "蕨類", "蝴蝶"], "answer": 0, "difficulty": "易", "explanation": "草履蟲由單一細胞構成。"}, {"id": 5, "question": "人體中負責運送氧氣的血球主要是？", "options": ["白血球", "血小板", "紅血球", "神經細胞"], "answer": 2, "difficulty": "易", "explanation": "紅血球中的血紅素可攜帶氧氣。"}, {"id": 6, "question": "植物進行光合作用，主要吸收哪一種氣體？", "options": ["氧氣", "氮氣", "二氧化碳", "氫氣"], "answer": 2, "difficulty": "中", "explanation": "光合作用利用二氧化碳和水製造養分。"}, {"id": 7, "question": "葉片的氣孔主要負責哪項作用？", "options": ["製造種子", "氣體交換與水分散失", "吸收土壤礦物質", "固定植株"], "answer": 1, "difficulty": "中", "explanation": "氣孔可進行氣體交換，也是蒸散作用的重要途徑。"}, {"id": 8, "question": "將細胞放入高濃度鹽水，細胞可能因何作用而失水？", "options": ["滲透作用", "光合作用", "呼吸作用", "受精作用"], "answer": 0, "difficulty": "中", "explanation": "水分可經由滲透作用由低溶質濃度側往高溶質濃度側移動。"}, {"id": 9, "question": "食物中的澱粉最先在哪個部位開始被分解？", "options": ["口腔", "胃", "大腸", "食道"], "answer": 0, "difficulty": "中", "explanation": "唾液中的澱粉酶會在口腔開始分解澱粉。"}, {"id": 10, "question": "下列何者最能說明呼吸作用的意義？", "options": ["製造葡萄糖並儲存光能", "分解養分釋放可用能量", "吸收光線形成葉綠素", "將水變成氧氣"], "answer": 1, "difficulty": "中", "explanation": "細胞呼吸作用會分解有機養分並釋放能量。"}, {"id": 11, "question": "血液由心臟流向全身組織，主要經過哪類血管？", "options": ["動脈", "靜脈", "淋巴管", "輸尿管"], "answer": 0, "difficulty": "中", "explanation": "動脈主要將血液由心臟輸送出去。"}, {"id": 12, "question": "人體吸入的氧氣主要在肺部何處進入血液？", "options": ["氣管", "支氣管", "肺泡", "橫膈"], "answer": 2, "difficulty": "中", "explanation": "肺泡壁薄，周圍有微血管，有利於氣體交換。"}, {"id": 13, "question": "若植物根部吸水正常但葉片蒸散量突然下降，水分向上運輸可能如何改變？", "options": ["通常減弱", "必然停止", "必然加快", "與蒸散完全無關"], "answer": 0, "difficulty": "難", "explanation": "蒸散作用形成的拉力是水分向上運輸的重要力量之一。"}, {"id": 14, "question": "某人運動後呼吸加快，最合理的原因是？", "options": ["細胞能量需求增加", "紅血球停止運作", "肺泡數量瞬間增加", "心臟停止收縮"], "answer": 0, "difficulty": "難", "explanation": "運動時細胞需更多能量，呼吸與循環系統的活動通常增加。"}, {"id": 15, "question": "植物置於黑暗一段時間後，光合作用與呼吸作用的情況何者正確？", "options": ["兩者都停止", "光合作用停止，呼吸作用仍持續", "光合作用持續，呼吸作用停止", "兩者速率必定相同"], "answer": 1, "difficulty": "難", "explanation": "光合作用需要光能，呼吸作用在黑暗中仍可進行。"}, {"id": 16, "question": "顯微鏡目鏡 10 倍、物鏡 40 倍，總放大倍率為多少？", "options": ["4 倍", "40 倍", "50 倍", "400 倍"], "answer": 3, "difficulty": "難", "explanation": "總放大倍率＝目鏡倍率×物鏡倍率＝400 倍。"}];
'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const isTeacher=params.get('teacher')==='1'||params.get('admin')==='1';
if(isTeacher){document.body.classList.add('is-teacher-admin');}
const initialDuration=['6','8','10','off'].includes(params.get('duration'))?params.get('duration'):(params.get('timer')==='off'?'off':'8');
const stages=[
{name:'第一重封印｜皇家起居室',sub:'探索古堡起居室 · 解開六道生物謎題',image:SCENE_ASSETS[1],quota:{'易':4,'中':2,'難':0},objects:[["皇家玫瑰畫作", 90, 10], ["古老望遠鏡", 14, 40], ["皇家地球儀", 7, 75], ["白貓與天鵝絨沙發", 43, 65], ["百合花瓶", 35, 42], ["茶桌秘典", 68, 80]]},
{name:'第二重封印｜皇家秘典室',sub:'翻閱皇家秘典 · 尋找知識之光',image:SCENE_ASSETS[2],quota:{'易':1,'中':3,'難':1},objects:[["皇家天球儀", 21, 48], ["植物秘典", 54, 59], ["玻璃藥瓶", 75, 67], ["皇家肖像", 77, 25], ["皇家地球儀", 87, 59]]},
{name:'第三重封印｜傳奇皇家禁閣',sub:'破解最後的生命奧祕',image:SCENE_ASSETS[3],quota:{'易':0,'中':2,'難':3},objects:[["左側骨骼標本", 17, 44], ["左側封印水晶", 36, 50], ["皇家秘法寶珠", 50, 40], ["右側封印水晶", 64, 50], ["右側骨骼標本", 84, 42]]}
]
const state={questions:[],assignments:[],stage:0,solved:new Set(),remaining:600,durationSec:600,clockMode:'total',totalMinutes:10,awardPauseAt:0,started:false,ended:false,muted:params.get('mode')==='solo',timerOff:initialDuration==='off',active:null,lock:false,wrong:0,startedAt:0,interval:null,wrongByKey:{},hintTimer:null,teacherPreview:false,previewPreviousTimerOff:false};
const labels=['A','B','C','D'];
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function normalize(q){if(!q||typeof q.question!=='string'||!Array.isArray(q.options)||q.options.length!==4||q.options.some(o=>typeof o!=='string'||!o.trim()))return null;let a=q.answer;if(typeof a==='string'){const t=a.trim().toUpperCase();a=labels.indexOf(t);if(a<0)a=q.options.findIndex(o=>o.trim()===q.answer.trim());}if(!Number.isInteger(a)||a<0||a>3)return null;return {...q,answer:a,difficulty:({'1':'易','2':'中','3':'難',easy:'易',medium:'中',hard:'難','易':'易','中':'中','難':'難'})[q.difficulty]||'中'};}
function assignQuestions(pool){
  if (!pool || pool.length === 0) pool = DEMO_QUESTIONS.map(normalize).filter(Boolean);
  let safePool = pool.map(normalize).filter(Boolean);
  if (safePool.length < 16) {
    let i = 0;
    const origLen = safePool.length || 1;
    while (safePool.length < 16) {
      const base = safePool[i % origLen] || DEMO_QUESTIONS[i % DEMO_QUESTIONS.length];
      safePool.push({...base, id: (base.id || i) + '-rep-' + safePool.length});
      i++;
    }
  }
  const groups = {'易':[], '中':[], '難':[]};
  shuffle(safePool).forEach(q => {
    const diff = (['易','中','難'].includes(q.difficulty)) ? q.difficulty : '中';
    groups[diff].push({...q, difficulty: diff});
  });
  const output = [];
  for (const st of stages) {
    let picked = [];
    for (const level of ['易','中','難']) {
      for (let n = 0; n < st.quota[level]; n++) {
        if (groups[level] && groups[level].length) picked.push(groups[level].pop());
      }
    }
    while (picked.length < st.objects.length) {
      const remaining = ['易','中','難'].flatMap(k => groups[k] || []);
      if (!remaining.length) {
        picked.push(safePool[Math.floor(Math.random() * safePool.length)]);
        continue;
      }
      const nearest = remaining.sort((a,b) => Math.min(...Object.keys(st.quota).filter(k => st.quota[k]>0).map(k => Math.abs(['易','中','難'].indexOf(a.difficulty) - ['易','中','難'].indexOf(k)))) - Math.min(...Object.keys(st.quota).filter(k => st.quota[k]>0).map(k => Math.abs(['易','中','難'].indexOf(b.difficulty) - ['易','中','難'].indexOf(k)))))[0];
      groups[nearest.difficulty].splice(groups[nearest.difficulty].indexOf(nearest), 1);
      picked.push(nearest);
    }
    output.push(shuffle(picked).map(q => {
      const opts = shuffle(q.options.map((text, i) => ({text, correct: i === q.answer})));
      return {...q, options: opts.map(o => o.text), answer: opts.findIndex(o => o.correct)};
    }));
  }
  return output;
}
async function loadBank(){state.questions=DEMO_QUESTIONS.map(normalize).filter(Boolean);state.assignments=assignQuestions(state.questions);$('loadInfo').textContent='展示模式：內建 16 題生物示範題目，可直接開始探索或使用教師預覽。';}
function show(id){$(id).classList.remove('hidden')}function hide(id){$(id).classList.add('hidden')}
function timerRender(){if(state.timerOff){$('timer').textContent='⌛ 無時間限制';return;}const m=Math.floor(state.remaining/60),s=state.remaining%60;$('timer').textContent=`⌛ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;if(state.remaining<=60)$('timer').style.color='#ff978c';}
function tick(){if(state.teacherPreview||state.ended||!state.started||state.timerOff||state.awarding)return;state.remaining=Math.max(0,state.durationSec-Math.floor((Date.now()-state.startedAt)/1000));timerRender();if(state.remaining===0)timeUp();saveProgress();}
function start(){if(!state.assignments.length||!readTimes())return;state.stage=0;state.solved.clear();state.elapsed=0;state.startedAt=0;state.awardPauseAt=0;state.wrong=0;state.wrongByKey={};beginStage();hide('intro');hide('tutorialOverlay');state.started=true;state.startedAt=Date.now();renderStage();timerRender();clearInterval(state.interval);state.interval=setInterval(tick,250);if(!state.muted)chime();}
function chime(){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=620;g.gain.setValueAtTime(.035,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.2);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.2);setTimeout(()=>c.close(),350);}catch(e){}}
function renderStage(){const st=stages[state.stage];$('stageName').textContent=st.name;$('stageSub').textContent=st.sub;$('scene').style.backgroundImage=`url('${st.image}')`;$('sceneCaption').textContent='觀察物件附近的微弱青色光點；找不到時按「探索提示」';$('hotspots').innerHTML='';st.objects.forEach(([name,x,y],i)=>{const key=`${state.stage}-${i}`,done=state.solved.has(key);const b=document.createElement('button');b.className='hotspot'+(done?' done':'');b.style.left=x+'%';b.style.top=y+'%';b.setAttribute('aria-label',name+(done?'，已完成':''));b.innerHTML=(done?'✓':'')+`<span>${name}</span>`;b.addEventListener('click',()=>openQuestion(i));$('hotspots').append(b);});const count=st.objects.filter((_,i)=>state.solved.has(`${state.stage}-${i}`)).length;$('stageDots').innerHTML=st.objects.map((_,i)=>`<span class="dot ${state.solved.has(`${state.stage}-${i}`)?'on':''}"></span>`).join('');$('totalProgress').textContent=`${state.solved.size} / 16`;$('bottomText').textContent=`本重封印：${count} / ${st.objects.length}　｜　全程 ${state.solved.size} / 16`;}
function scanTo(index){const b=$('hotspots').children[index];if(!b)return;const r=b.getBoundingClientRect(),s=$('scene').getBoundingClientRect();$('lens').style.left=(r.left+r.width/2-s.left)+'px';$('lens').style.top=(r.top+r.height/2-s.top)+'px';$('scene').classList.add('scanning');setTimeout(()=>$('scene').classList.remove('scanning'),850);}
function openQuestion(i){if(state.teacherPreview){previewQuestion(i);return;}if(state.ended||!state.started)return;const key=`${state.stage}-${i}`;if(state.solved.has(key)){$('sceneCaption').textContent='這件物品的皇家印記已經取得，繼續尋找其他線索！';return;}state.active=i;state.lock=false;$('continueBtn').disabled=false;const q=state.assignments[state.stage][i];$('objectTitle').textContent='✦ '+stages[state.stage].objects[i][0];$('questionCount').textContent=`第 ${i+1} 道線索 · ${stages[state.stage].name}`;$('questionText').textContent=q.question;$('options').innerHTML='';q.options.forEach((opt,j)=>{const b=document.createElement('button');b.className='answerBtn';const letter=document.createElement('b');letter.textContent=labels[j];const text=document.createElement('span');text.textContent=opt;b.append(letter,text);b.addEventListener('click',()=>answer(j));$('options').append(b);});hide('feedback');hide('continueBtn');show('questionOverlay');}
function answer(i){tick();if(state.lock||state.ended||state.timedOut)return;const q=state.assignments[state.stage][state.active];const buttons=[...$('options').children];if(i===q.answer){state.lock=true;buttons[i].classList.add('correct');buttons.forEach(b=>b.disabled=true);state.solved.add(`${state.stage}-${state.active}`);saveProgress();$('feedback').textContent='✔ 皇家印證通過！\n'+(q.explanation||'你已成功解開這道生物謎題。');show('feedback');$('continueBtn').textContent='收下皇家印記，繼續探索 →';show('continueBtn');if(!state.muted)chime();}else{state.lock=true;state.wrong++;buttons[i].classList.add('wrong');buttons.forEach(b=>b.disabled=true);const wrongKey=`${state.stage}-${state.active}`;state.wrongByKey[wrongKey]=(state.wrongByKey[wrongKey]||0)+1;const attempts=state.wrongByKey[wrongKey];$('feedback').textContent=('再試一次！\n'+(q.explanation||'請仔細檢查題目中的關鍵詞與各選項。'))+'\n\n請稍候 5 秒，再重新作答。';show('feedback');let seconds=5;$('continueBtn').textContent=`重新作答（${seconds}）`;show('continueBtn');$('continueBtn').disabled=true;const interval=setInterval(()=>{if(state.ended){clearInterval(interval);return;}seconds--;if(seconds<=0){clearInterval(interval);$('continueBtn').disabled=false;$('continueBtn').textContent='再試一次 ↻';}else $('continueBtn').textContent=`重新作答（${seconds}）`;},1000);}}
function continueQuestion(){if(state.teacherPreview){hide('questionOverlay');return;}if(state.ended)return;const key=`${state.stage}-${state.active}`;if(!state.solved.has(key)){openQuestion(state.active);return;}hide('questionOverlay');renderStage();const st=stages[state.stage];if(st.objects.every((_,i)=>state.solved.has(`${state.stage}-${i}`))){showStageAward(state.stage);}else $('sceneCaption').textContent='✔ 皇家印證通過！尋找下一件青色微光物品。';}

const rankTitles=['皇家見習探險家','皇家知識守護者','傳奇皇家生物大師'];
const rankDescriptions=['你已完成第一重六道生物謎題，正式取得皇家見習資格！','你已解開皇家秘典室五道生物謎題，晉升皇家知識守護者！','十六道謎題全部解開！你已破解古堡三重封印，成為傳奇皇家生物大師！'];
function showStageAward(index){if(!state.teacherPreview){tick();if(state.ended||state.timedOut)return;state.awarding=true;if(state.clockMode==='stage')state.elapsed=(state.elapsed||0)+Math.floor((Date.now()-state.startedAt)/1000);else state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);state.awardPauseAt=Date.now();saveProgress();}$('teacherAwardClose').style.display=state.teacherPreview?'inline-block':'none';$('sealContinue').style.display=state.teacherPreview?'none':'inline-block';
 $('awardTitle').textContent=rankTitles[index];
 $('awardDesc').textContent=rankDescriptions[index];
 $('awardStage').textContent=['第一重封印 6 / 6','第二重封印 5 / 5','第三重封印 5 / 5'][index];
 $('sealContinue').textContent=index===2?'檢視最終探險成果 →':'繼續下一重挑戰 →';
 $('awardEmblem').textContent=['♛','❖','✦'][index];
 show('sealOverlay');
}

function renderMap(){$('mapStages').innerHTML='';stages.forEach((st,i)=>{const n=st.objects.filter((_,j)=>state.solved.has(`${i}-${j}`)).length;const d=document.createElement('div');d.className='mapStage';const h=document.createElement('strong');h.textContent=(n===st.objects.length?'✓ ':'♛ ')+st.name;const s=document.createElement('small');s.textContent=`已解開 ${n} / ${st.objects.length} 道線索`+(i>state.stage?' · 尚未開放':'');d.append(h,s);$('mapStages').append(d);});}
function closeMap(){hide('mapOverlay');}
function endGame(completed){if(state.ended)return;state.ended=true;clearInterval(state.interval);hide('questionOverlay');hide('mapOverlay');hide('sealOverlay');$('resultTitle').textContent=completed?'恭喜！皇家古堡探險成功':'皇家探險紀錄';$('resultMessage').textContent=completed?'你成功破解三重封印，揭開皇家生物學家的生命奧祕！':'時間到了！每一道完成的謎題，都是你探索生命科學的收穫。';const earned=stages.filter((st,i)=>st.objects.every((_,j)=>state.solved.has(`${i}-${j}`))).length;const badges=['皇家見習探險家','皇家知識守護者','傳奇皇家生物大師'];$('resultMessage').textContent+=(earned?` 已取得 ${earned} 枚認證：${badges.slice(0,earned).join('、')}。`:' 今天的探索也有收穫，下一次繼續挑戰！');const elapsed=state.clockMode==='total'?Math.max(0,Math.floor(((state.awardPauseAt||Date.now())-state.startedAt)/1000)):(state.elapsed||0)+Math.min(state.durationSec,Math.floor((Date.now()-state.startedAt)/1000));const mins=String(Math.floor(elapsed/60)).padStart(2,'0'),secs=String(elapsed%60).padStart(2,'0');$('resultStats').textContent=`完成題數：${state.solved.size} / 16　｜　探索時間：${mins}:${secs}　｜　重新嘗試：${state.wrong} 次`;show('resultOverlay');}
function restart(){state.awarding=false;state.timedOut=false;sessionStorage.removeItem(progressKey);state.teacherPreview=false;hide('teacherPanel');clearInterval(state.interval);state.assignments=assignQuestions(state.questions);state.stage=0;state.solved.clear();state.remaining=state.durationSec;state.startedAt=0;state.awardPauseAt=0;state.started=false;state.ended=false;state.active=null;state.lock=false;state.wrong=0;state.wrongByKey={};clearTimeout(state.hintTimer);$('timer').style.color='';hide('resultOverlay');show('intro');timerRender();}
function narrate(){if(!('speechSynthesis' in window)){alert('目前瀏覽器不支援語音朗讀');return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance($('story').textContent+'城門在身後轟然關閉。請在探索時間內努力破解三重封印。');u.lang='zh-TW';u.rate=.9;speechSynthesis.speak(u);}
$('startBtn').addEventListener('click',()=>{hide('intro');show('tutorialOverlay');});$('tutorialStart').addEventListener('click',start);$('tutorialSkip').addEventListener('click',start);$('sealContinue').addEventListener('click',()=>{hide('sealOverlay');if(state.teacherPreview)return;if(state.stage===2){endGame(true);return;}if(state.clockMode==='total'&&state.awardPauseAt){state.startedAt+=Date.now()-state.awardPauseAt;}state.stage++;beginStage();if(!state.timerOff&&state.remaining<=0){timeUp();return;}renderStage();$('sceneCaption').textContent='✦ 晉級成功！探索新的房間，解開下一重封印。';});$('continueBtn').addEventListener('click',continueQuestion);$('closeQuestion').addEventListener('click',()=>{if(state.teacherPreview||!state.lock)hide('questionOverlay');else if(state.solved.has(`${state.stage}-${state.active}`))continueQuestion();});$('mapBtn').addEventListener('click',()=>{renderMap();$('mapContinue').textContent='返回探索';show('mapOverlay');});$('closeMap').addEventListener('click',closeMap);$('mapContinue').addEventListener('click',closeMap);$('restartBtn').addEventListener('click',restart);$('narrateBtn').addEventListener('click',narrate);if($('labelsBtn')){$('labelsBtn').addEventListener('click',()=>{$('scene').classList.toggle('showLabels');$('labelsBtn').textContent=$('scene').classList.contains('showLabels')?'隱藏物件名稱':'顯示物件名稱';});}$('soundBtn').addEventListener('click',()=>{state.muted=!state.muted;$('soundBtn').textContent=state.muted?'♫̸':'♫';});$('helpBtn').addEventListener('click',()=>alert('移動滑鼠或拖曳手指探索古堡；靠近微弱青色光點後點擊或放手調查。找不到物件時可按探索提示，驚嘆號只顯示幾秒。每重所有題目答對才能前進。'));$('hintBtn').addEventListener('click',()=>{if(!state.started||state.ended)return;clearTimeout(state.hintTimer);[...$('hotspots').children].forEach((b,i)=>{b.classList.toggle('hint',!state.solved.has(`${state.stage}-${i}`));});$('sceneCaption').textContent='✦ 尚未探索的線索已短暫標示，請仔細觀察！';state.hintTimer=setTimeout(()=>[...$('hotspots').children].forEach(b=>b.classList.remove('hint')),3500);});$('copyResultBtn').addEventListener('click',async()=>{
  const text=`🏰 皇家古堡生物密室逃脫｜${$('resultStats').textContent}\n🏆 認證成就：${$('resultMessage').textContent}\n✅ 守護成功，特此證明！`;
  try{await navigator.clipboard.writeText(text);}catch(e){try{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}catch(_){}}
  show('copyNoticeOverlay');
});
if($('closeCopyNotice')){$('closeCopyNotice').addEventListener('click',()=>hide('copyNoticeOverlay'));}
const durationSelect=$('durationSelect');
durationSelect.value=initialDuration;
function applyDuration(value){
 const chosen=['6','8','10','off'].includes(value)?value:'8';
 state.timerOff=chosen==='off';state.durationSec=chosen==='off'?480:Number(chosen)*60;
 if(!state.started){state.remaining=state.durationSec;$('timer').style.color='';timerRender();}
 $('introDuration').textContent=chosen==='off'?'不限時間':`${chosen} 分鐘`;
}
durationSelect.addEventListener('change',()=>applyDuration(durationSelect.value));
applyDuration(initialDuration);
$('soundBtn').textContent=state.muted?'♫̸':'♫';timerRender();loadBank().catch(e=>{$('loadInfo').textContent='⚠ '+e.message;$('startBtn').disabled=true;console.error(e);});



// V3：移動鏡片 + 間歇微光 + 手動驚嘆號提示。鏡片在未探索時不常駐。
(function setupExploration(){
 const scene=$('scene'),lens=$('lens');let x=.5,y=.5,dragging=false,near=-1,hideLensTimer=null,twinkleTimer=null,dragStart=null;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function redraw(){
  const r=scene.getBoundingClientRect();if(!r.width||!r.height)return;
  const px=x*r.width,py=y*r.height;lens.style.left=px+'px';lens.style.top=py+'px';
  const img=window.castleLensImage;const iw=img?.naturalWidth||1536,ih=img?.naturalHeight||1024;
  const scale=Math.max(r.width/iw,r.height/ih),zoom=1.45,dw=iw*scale*zoom,dh=ih*scale*zoom;
  const left=(r.width-iw*scale)/2,top=(r.height-ih*scale)/2,rad=lens.getBoundingClientRect().width/2;
  lens.style.setProperty('--lens-image',getComputedStyle(scene).backgroundImage);
  lens.style.setProperty('--lens-bg-size',dw+'px '+dh+'px');
  lens.style.setProperty('--lens-bg-position',(rad-(px-left)*zoom)+'px '+(rad-(py-top)*zoom)+'px');
  const st=stages[state.stage];let best=Infinity;near=-1;
  st.objects.forEach((o,i)=>{if(state.solved.has(`${state.stage}-${i}`))return;const d=Math.hypot((x-o[1]/100)*r.width,(y-o[2]/100)*r.height);if(d<best){best=d;near=i;}});
  if(best>Math.max(65,Math.min(r.width,r.height)*.105))near=-1;
  [...$('hotspots').children].forEach((b,i)=>b.classList.toggle('nearby',i===near));
  lens.classList.toggle('found',near>=0);
  if(near>=0&&state.started&&!state.ended)$('sceneCaption').textContent='✦ 發現線索：'+st.objects[near][0]+'｜點一下或放開手指調查';
 }
 function move(e){const r=scene.getBoundingClientRect();x=clamp((e.clientX-r.left)/r.width,.06,.94);y=clamp((e.clientY-r.top)/r.height,.1,.9);lens.classList.add('visible');clearTimeout(hideLensTimer);redraw();}
 function hideLensSoon(ms=1100){clearTimeout(hideLensTimer);hideLensTimer=setTimeout(()=>{if(!dragging)lens.classList.remove('visible');},ms);}
 scene.addEventListener('pointerdown',e=>{if(state.teacherPreview)return;if(!state.started||state.ended||!$('questionOverlay').classList.contains('hidden'))return;dragging=true;dragStart={x:e.clientX,y:e.clientY};if(scene.setPointerCapture)scene.setPointerCapture(e.pointerId);move(e);});
 scene.addEventListener('pointermove',e=>{if(!state.started||state.ended)return;if(e.pointerType==='mouse'||dragging){move(e);if(!dragging)hideLensSoon(650);}});
 scene.addEventListener('pointerup',e=>{if(state.teacherPreview)return;if(!dragging)return;move(e);dragging=false;const candidate=near;hideLensSoon(450);if(candidate>=0&&state.started&&!state.ended)openQuestion(candidate);});
 scene.addEventListener('pointercancel',()=>{dragging=false;hideLensSoon();});
 scene.addEventListener('pointerleave',()=>hideLensSoon(350));
 window.addEventListener('resize',redraw);
 function glow(){const nodes=[...$('hotspots').children];nodes.forEach(b=>b.classList.remove('spark'));if(!state.started||state.ended||!$('questionOverlay').classList.contains('hidden'))return;const choices=nodes.filter((b,i)=>!state.solved.has(`${state.stage}-${i}`));shuffle(choices).slice(0,Math.min(2,choices.length)).forEach(b=>b.classList.add('spark'));}
 twinkleTimer=setInterval(glow,3100);
 const oldRender=renderStage;
 renderStage=function(){clearTimeout(state.hintTimer);oldRender();const img=new Image();window.castleLensImage=img;img.onload=redraw;img.src=stages[state.stage].image;near=-1;lens.classList.remove('visible');glow();redraw();};
 redraw();
})();


// V5.2: Each stage has its own complete dialogue cycle. No first-stage six-question text in stage two or three.
(function(){
 const dialogue=[
  ['歡迎來到皇家起居室。請尋找六件藏著生物謎題的物品。','青色微光代表尚未解開的題目；金色光芒只是古堡的魔法氣氛。','移動滑鼠或拖曳手指仔細調查，找不到時可使用手動探索提示。','這一重需要完成六道謎題，才能開啟皇家秘典室。'],
  ['皇家秘典室已開啟！這一重需要解開五道生物謎題。','留意天球儀、古老典籍與神秘標本附近的青色線索。','金色光點是裝飾，別忘了觀察真正藏有題目的青色微光。','完成這裡的五道謎題，就能進入最後的傳奇皇家禁閣。'],
  ['傳奇皇家禁閣就在眼前！這是最後的五道生物挑戰。','仔細調查古老的標本、秘法寶珠與封印典籍。','需要幫忙時，點擊「探索提示」短暫查看尚未破解的位置。','完成這五道謎題，就能解開三重封印，完成皇家古堡探險。']
 ];let lastStage=-1,n=0;const el=$('rpgLine');
 function stageLine(){if(lastStage!==state.stage){lastStage=state.stage;n=0;}el.textContent=dialogue[state.stage][n];}
 $('rpgNext').addEventListener('click',()=>{if(lastStage!==state.stage){lastStage=state.stage;n=0;}else n=(n+1)%dialogue[state.stage].length;stageLine();});
 const oldOpen=openQuestion;openQuestion=function(i){oldOpen(i);if(!$('questionOverlay').classList.contains('hidden')){el.textContent=state.teacherPreview?'教師預覽：可查看此物件對應的題目與解析。':'找到線索了！仔細閱讀這道生物謎題。';}};
 const oldContinue=continueQuestion;continueQuestion=function(){const done=state.active!==null&&state.solved.has(`${state.stage}-${state.active}`);oldContinue();if(done&&!state.teacherPreview)el.textContent='太棒了！皇家印記已收下，繼續尋找其他青色微光吧。';};
 const oldStage=renderStage;renderStage=function(){oldStage();lastStage=-1;stageLine();};
 stageLine();
})();

// Teacher-only read-only inspection: no timer, no question completion, no student progress.
(function initTeacherPreview(){
 const panel=$('teacherPanel'), btn=$('teacherPreviewBtn');
 const available=true; // Local standalone demonstration includes teacher preview by default
 if(!available)return;
 btn.classList.remove('hidden');
 const stageBtns=[...panel.querySelectorAll('[data-preview-stage]')];
 const toggleBtn=$('teacherToggle');
 toggleBtn?.addEventListener('click',()=>{const collapsed=panel.classList.toggle('collapsed');toggleBtn.textContent=collapsed?'展開更多':'收合工具列';});
 function refresh(){stageBtns.forEach((b,i)=>b.classList.toggle('selected',i===state.stage));$('teacherCurrent').textContent=`目前查看：${stages[state.stage].name}｜${stages[state.stage].objects.length} 個探索區域`;$('scene').classList.add('teacherInspect');const holder=$('teacherObjects');holder.replaceChildren();stages[state.stage].objects.forEach((o,i)=>{const bt=document.createElement('button');bt.type='button';bt.textContent=(i+1)+'. '+o[0];bt.addEventListener('click',()=>window.previewQuestion(i));holder.append(bt);});}
 btn.addEventListener('click',()=>{
  if(!state.assignments.length){alert('示範題庫尚未準備完成，請使用內建試玩版或先載入題庫。');return;}
  state.teacherPreview=true;state.started=true;state.ended=false;state.stage=0;state.previewPreviousTimerOff=state.timerOff;
  state.timerOff=true;state.remaining=state.durationSec;clearInterval(state.interval);state.solved.clear();state.active=null;
  hide('intro');hide('tutorialOverlay');hide('mapOverlay');hide('questionOverlay');hide('sealOverlay');hide('resultOverlay');
  show('teacherPanel');panel.classList.add('collapsed');if(toggleBtn)toggleBtn.textContent='展開更多';renderStage();refresh();timerRender();
 });
 stageBtns.forEach(b=>b.addEventListener('click',()=>{hide('questionOverlay');hide('sealOverlay');state.stage=Number(b.dataset.previewStage);renderStage();refresh();}));
 $('teacherExit').addEventListener('click',()=>{
  state.teacherPreview=false;state.timerOff=state.previewPreviousTimerOff;state.started=false;state.remaining=state.durationSec;state.stage=0;state.solved.clear();
  hide('teacherPanel');hide('questionOverlay');$('scene').classList.remove('teacherInspect');panel.classList.add('collapsed');if(toggleBtn)toggleBtn.textContent='展開更多';renderStage();show('intro');timerRender();
 });
 window.previewQuestion=function(i){
  const q=state.assignments[state.stage]?.[i];if(!q)return;
  state.active=i;$('objectTitle').textContent='教師預覽｜'+stages[state.stage].objects[i][0];
  $('questionCount').textContent=`${stages[state.stage].name} · 第 ${i+1} 個物件`;
  $('questionText').textContent=q.question;$('options').replaceChildren();
  q.options.forEach((opt,j)=>{const b=document.createElement('button');b.className='answerBtn'+(j===q.answer?' correct':'');b.disabled=true;const a=document.createElement('b');a.textContent=labels[j];const v=document.createElement('span');v.textContent=opt+(j===q.answer?' ✓ 正確答案':'');b.append(a,v);$('options').append(b);});
  $('feedback').textContent='【教師預覽：觀念解析】\n'+(q.explanation||'題庫未提供解析');show('feedback');hide('continueBtn');show('questionOverlay');
 };
 // Teacher preview is also usable via tapping a glowing object or its labeled marker.
 const oldOpenQuestion=openQuestion;
 openQuestion=function(i){if(state.teacherPreview){window.previewQuestion(i);return;}oldOpenQuestion(i);};
 const oldClose=closeMap;
 // Close question overlay with its normal X button; no answer is submitted.
 $('teacherPanel').addEventListener('pointerdown',e=>e.stopPropagation());
})();

// Teacher preview shortcuts: use existing read-only preview mechanics, never auto-start student mode.
document.querySelectorAll('[data-open-stage]').forEach(button => {
 button.addEventListener('click',()=>{
  document.getElementById('teacherPreviewBtn').click();
  if (!state.teacherPreview) return;
  const stageButton=document.querySelector('#teacherPanel [data-preview-stage="'+button.dataset.openStage+'"]');
  if(stageButton) stageButton.click();
 });
});

// V5.4 teacher award inspection: previewing is read-only and never awards student progress.
document.querySelectorAll('[data-preview-award]').forEach(btn=>btn.addEventListener('click',()=>{
 if(!state.teacherPreview)return;
 hide('questionOverlay');showStageAward(Number(btn.dataset.previewAward));$('teacherAwardClose').style.display='inline-block';$('sealContinue').style.display='none';
}));
$('teacherAwardClose').addEventListener('click',()=>{hide('sealOverlay');$('teacherAwardClose').style.display='none';});

// V6: independent stage clocks, local recovery and portable question banks.
const progressKey='royal-castle-v6-progress';const studentMode=params.get('student')==='1'||window.__ROYAL_STUDENT_EXPORT__===true;
const pristineHTML='<!doctype html>'+document.documentElement.outerHTML;
if(studentMode){for(const id of ['teacherPreviewBtn','quickStageChoices','settings']){const el=$(id);if(el)el.style.display='none';}}
document.querySelectorAll('.introImage').forEach(el=>el.style.setProperty('background-image','url("'+SCENE_ASSETS[0]+'")','important'));
let stageMinutes=[6,4,4],banks=[],bankTitle='生物綜合示範題庫';
function readTimes(){
 const a=[0,1,2].map(i=>Number($('time'+i).value));
 if(a.some(v=>!Number.isInteger(v)||v<1||v>60)){alert('請將每一關設定為 1～60 的整數分鐘。');return false;}
 stageMinutes=a;state.timerOff=$('noTime').checked;state.clockMode=$('clockMode').value==='stage'?'stage':'total';const total=Number($('totalMinutes').value);if(!Number.isInteger(total)||total<1||total>120){alert('全場時間請設定為 1～120 分鐘。');return false;}state.totalMinutes=total;
 $('introDuration').textContent=state.timerOff?'不限時':(state.clockMode==='total'?`全場 ${total} 分鐘`:`分關 ${a.join('／')} 分鐘`);
 try{localStorage.setItem('royal-v6-settings',JSON.stringify({times:a,off:state.timerOff,clockMode:state.clockMode,totalMinutes:state.totalMinutes}));}catch(e){}
 return true;
}
function beginStage(){state.awarding=false;state.timedOut=false;if(state.clockMode==='stage'){state.durationSec=stageMinutes[state.stage]*60;state.remaining=state.durationSec;state.startedAt=Date.now();}else{if(!state.startedAt){state.durationSec=state.totalMinutes*60;state.startedAt=Date.now();}state.remaining=Math.max(0,state.durationSec-Math.floor((Date.now()-state.startedAt)/1000));}state.awardPauseAt=0;$('timer').style.color='';timerRender();}
function saveProgress(){
 if(!state.started||state.teacherPreview||state.ended)return;
 try{sessionStorage.setItem(progressKey,JSON.stringify({version:6,stage:state.stage,solved:[...state.solved],assignments:state.assignments,questions:state.questions,times:stageMinutes,timerOff:state.timerOff,clockMode:state.clockMode,totalMinutes:state.totalMinutes,awardPauseAt:state.awardPauseAt,startedAt:state.startedAt,remaining:state.remaining,durationSec:state.durationSec,wrong:state.wrong,wrongByKey:state.wrongByKey,elapsed:state.elapsed||0,awarding:!!state.awarding,timedOut:!!state.timedOut,title:bankTitle}));}catch(e){}
}
function timeUp(){
 state.timedOut=true;clearInterval(state.interval);hide('questionOverlay');hide('mapOverlay');saveProgress();
 $('timeoutTitle').textContent=state.clockMode==='total'?'全場挑戰時間到了':'第 '+(state.stage+1)+' 關時間到了';show('timeoutOverlay');
}
function installBank(raw){
 const units=Array.isArray(raw)?[{unitTitle:'匯入題庫',questions:raw}]:Array.isArray(raw.units)?raw.units:[raw];
 if(!units.length)throw Error('題庫沒有任何單元');
 const verified=units.map((u,ui)=>{
  const arr=u.questions||u.items;if(!Array.isArray(arr))throw Error('第 '+(ui+1)+' 單元缺少 questions 陣列');
  const seen=new Set();const qs=arr.map((q,i)=>{const n=normalize(q);if(!n)throw Error('第 '+(i+1)+' 題格式不正確：需題幹、四個選項及答案 0～3／A～D');const key=n.question.trim();if(seen.has(key))throw Error('題幹重複：第 '+(i+1)+' 題');seen.add(key);return n;});
  if(qs.length<16)throw Error('每個單元至少需要 16 題不重複的有效題目');
  return {unitId:String(u.unitId||ui),unitTitle:u.unitTitle||'單元 '+(ui+1),questions:qs};
 });
 banks=verified;$('unitSelect').replaceChildren();banks.forEach((u,i)=>{const o=document.createElement('option');o.value=i;o.textContent=u.unitTitle+'（'+u.questions.length+' 題）';$('unitSelect').append(o);});selectBank();
}
function selectBank(){const u=banks[Number($('unitSelect').value)||0];if(!u)return;state.questions=u.questions;state.assignments=assignQuestions(state.questions);bankTitle=u.unitTitle;$('loadInfo').textContent=bankTitle+'｜'+u.questions.length+' 題；每場抽取 16 題，依難度分配，選項隨機。';}
function initV6(){
 let settings={};try{settings=JSON.parse(localStorage.getItem('royal-v6-settings')||'{}');}catch(e){}
 let embedded=null;try{embedded=JSON.parse($('portableConfig')?.textContent||'null');}catch(e){}
 const times=embedded?.times||settings.times||[6,4,4];const mode=params.get('clock')||params.get('clockMode')||embedded?.clockMode||settings.clockMode||'total';$('clockMode').value=mode==='stage'?'stage':'total';const whole=Number(params.get('total')||embedded?.totalMinutes||settings.totalMinutes||10);$('totalMinutes').value=Number.isInteger(whole)&&whole>=1&&whole<=120?whole:10;
 const urlTimes=params.get('times')?.split(',').map(Number);
 const scalar=Number(params.get('timer')||params.get('duration'));
 const chosen=urlTimes?.length===3?urlTimes:(scalar>=1&&scalar<=60?[scalar,scalar,scalar]:times);
 chosen.forEach((v,i)=>$('time'+i).value=Number.isInteger(v)&&v>=1&&v<=60?v:[6,4,4][i]);
 $('noTime').checked=params.has('timer')?params.get('timer')==='off':!!(embedded?.off??settings.off);
 if(embedded?.banks)installBank({units:embedded.banks});else installBank({unitId:'demo',unitTitle:'生物綜合示範題庫',questions:DEMO_QUESTIONS});
 if(params.has('unit')){const ix=banks.findIndex(u=>u.unitId===params.get('unit'));if(ix>=0){$('unitSelect').value=ix;selectBank();}}
 readTimes();state.durationSec=(state.clockMode==='total'?state.totalMinutes:stageMinutes[0])*60;state.remaining=state.durationSec;timerRender();
 try{const p=JSON.parse(sessionStorage.getItem(progressKey)||'null');if(p?.version===6)$('resumeBtn').classList.remove('hidden');}catch(e){}
}
$('unitSelect').addEventListener('change',selectBank);
for(let i=0;i<3;i++)$('time'+i).addEventListener('change',readTimes);
$('noTime').addEventListener('change',readTimes);$('clockMode').addEventListener('change',readTimes);$('totalMinutes').addEventListener('change',readTimes);
$('bankFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const raw=JSON.parse(await f.text());installBank(raw);$('settingStatus').textContent='題庫匯入成功。部署前請下載本次學生版。';}catch(err){$('settingStatus').textContent='匯入未完成：'+err.message;}e.target.value='';});
$('configLink').addEventListener('click',async()=>{if(!readTimes())return;const u=new URL(location.href);if(u.protocol==='file:'){alert('上傳 GitHub Pages 後再複製連結；離線請用「下載本次學生版」。');return;}u.searchParams.set('times',stageMinutes.join(','));u.searchParams.set('clock',state.clockMode);u.searchParams.set('total',state.totalMinutes);u.searchParams.set('student','1');u.searchParams.set('timer',state.timerOff?'off':'on');u.searchParams.set('unit',banks[Number($('unitSelect').value)||0].unitId);try{await navigator.clipboard.writeText(u.href);$('settingStatus').textContent='已複製，可將此網址製作成 QR Code；連結只傳設定，題庫需包含在部署的 HTML。';}catch(e){prompt('複製設定網址',u.href);}});
$('exportGame').addEventListener('click',()=>{
 if(!readTimes())return;
 const payload=JSON.stringify({times:stageMinutes,off:state.timerOff,clockMode:state.clockMode,totalMinutes:state.totalMinutes,banks:[banks[Number($('unitSelect').value)||0]]}).replace(/</g,'\\u003c');
 const tag='<script type="application/json" id="portableConfig">'+payload+'<\/script>';
 const encode=v=>JSON.stringify(v).replace(/</g,'\\u003c');
 const runtime='const SCENE_ASSETS='+encode(SCENE_ASSETS)+';const PORTABLE_CSS='+encode(PORTABLE_CSS)+';const PORTABLE_LOGIC='+encode(PORTABLE_LOGIC)+';'+PORTABLE_LOGIC;
 let html=pristineHTML.replace(/<script type="application\/json" id="portableConfig">[\s\S]*?<\/script>/,'').replace('<body>','<body>'+tag+'<script>window.__ROYAL_STUDENT_EXPORT__=true;<\/script>');
 html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+PORTABLE_CSS+'</style>').replace('<script src="game.js"><\/script>',()=>'<script>'+runtime.replace(/<\/script/gi,'<\\/script')+'<\/script>');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));a.download='royal_castle_students.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);$('settingStatus').textContent='已下載含本次題庫與時間的學生版，可命名為 index.html 部署。';
});
$('resumeBtn').addEventListener('click',()=>{try{
 const p=JSON.parse(sessionStorage.getItem(progressKey));if(!p||p.version!==6||!Array.isArray(p.assignments)||p.assignments.length!==3)throw Error('紀錄不完整');
 Object.assign(state,{stage:p.stage,solved:new Set(p.solved),assignments:p.assignments,questions:p.questions,timerOff:p.timerOff,clockMode:p.clockMode||'stage',totalMinutes:p.totalMinutes||10,awardPauseAt:p.awardPauseAt||0,startedAt:p.startedAt,remaining:p.remaining,durationSec:p.durationSec,wrong:p.wrong,wrongByKey:p.wrongByKey,elapsed:p.elapsed,awarding:p.awarding,timedOut:p.timedOut,teacherPreview:false,started:true,ended:false});stageMinutes=p.times;bankTitle=p.title;
 hide('intro');renderStage();timerRender();state.interval=setInterval(tick,250);
 if(p.timedOut)timeUp();else if(p.awarding){const elapsed=state.elapsed;showStageAward(state.stage);state.elapsed=elapsed;}else tick();
 }catch(e){alert('無法恢復，請重新開始。');}});
$('fullscreenBtn').addEventListener('click',()=>{if(document.fullscreenElement){document.exitFullscreen?.();return;}if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>alert('此瀏覽器未支援全螢幕，仍可正常遊玩。'));else alert('此平板可用瀏覽器開啟並橫放遊玩；全螢幕依系統支援。');});
window.addEventListener('pagehide',saveProgress);
window.addEventListener('beforeunload',e=>{if(state.started&&!state.ended&&!state.teacherPreview){saveProgress();e.preventDefault();e.returnValue='';}});
const timeout=document.createElement('div');timeout.id='timeoutOverlay';timeout.className='overlay hidden';timeout.innerHTML='<div class="modalCard"><div class="eyebrow">KEEP EXPLORING</div><h2 id="timeoutTitle">本關時間到了</h2><p>已完成的題目都保留。先向老師確認是否延長時間，再繼續挑戰。</p><button id="extendTime" class="goldBtn">經老師同意，延長 3 分鐘</button><button id="finishNow" class="softBtn">結束並查看紀錄</button></div>';document.body.append(timeout);
$('extendTime').addEventListener('click',()=>{hide('timeoutOverlay');state.timedOut=false;const spent=Math.floor((Date.now()-state.startedAt)/1000);if(state.clockMode==='stage'){state.elapsed=(state.elapsed||0)+spent;state.durationSec=180;state.remaining=180;state.startedAt=Date.now();}else{state.durationSec+=180;state.remaining=Math.max(0,state.durationSec-Math.floor((Date.now()-state.startedAt)/1000));}timerRender();state.interval=setInterval(tick,250);saveProgress();});
$('finishNow').addEventListener('click',()=>{hide('timeoutOverlay');if(state.clockMode==='stage')state.elapsed=(state.elapsed||0)+Math.min(state.durationSec,Math.floor((Date.now()-state.startedAt)/1000));endGame(false);});
// Resizing the scene never crops away a clue; freeze clock only on award screens.
const baseEnd=endGame;endGame=function(done){baseEnd(done);try{sessionStorage.removeItem(progressKey);}catch(e){}};
const baseRender=renderStage;renderStage=function(){baseRender();if(!state.teacherPreview)saveProgress();};
$('startBtn').addEventListener('click',e=>{if(!readTimes()){e.stopImmediatePropagation();e.preventDefault();}},true);
$('teacherExit').addEventListener('click',()=>{readTimes();state.durationSec=stageMinutes[0]*60;state.remaining=state.durationSec;timerRender();});
setTimeout(initV6,0);

if(studentMode){for(const id of ['teacherPreviewBtn','teacherToggle']){const el=$(id);if(el)el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();},true);}document.querySelectorAll('[data-open-stage],[data-preview-stage],[data-preview-award]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();},true));}



// ⭐ 密室逃脫共用題庫適配器 Hook
window.__ESCAPE_HOOK__ = {
  type: 'castle',
  setQuestions: (pool) => {
    if (!pool || !pool.length) return;
    try {
      state.questions = pool;
      state.assignments = assignQuestions(pool);
      const info = $('loadInfo');
      if (info) info.textContent = '已連線共用題庫｜' + pool.length + ' 題；依 6/5/5 難度分關派發 16 題！';
      if (typeof renderStage === 'function') renderStage();
    } catch(err) {
      console.warn('套用共用題庫失敗:', err);
    }
  }
};
