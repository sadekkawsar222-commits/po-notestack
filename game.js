/* Po Notestack — Typing Practice: staged typing game that tracks weak keys and speed */
(()=>{
const $=s=>document.querySelector(s);
const KEY='tw-game';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return{}}};
let G=Object.assign({stars:{},best:{},keys:{},hist:[]},load());
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(G))}catch{}};
const snd=k=>{try{window.twPlay&&twPlay(k)}catch{}};
const rnd=a=>a[Math.random()*a.length|0];
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- content ---------- */
const COMMON='the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is was are has had did said each find long down call been may part made over sound word write small set put end does another large must big even such here why ask went men read need land different home move try kind hand picture again change off play spell air away animal house point page letter mother answer found study still learn should world high every near add food between own below country plant last school father keep tree never start city earth eye light thought head under story saw left few while along might close something seem next hard open example begin life always those both paper together got group often run important until children side feet car mile night walk white sea began grow took river four carry state once book hear stop without second later miss idea enough eat face watch far really almost let above girl sometimes mountain cut young talk soon list song being leave family'.split(' ');
const SENT=[
'The lamp hummed softly while the first words found the page.',
'Quiet rooms make loud ideas, so write before the coffee cools.',
'Every sentence you finish is a small promise kept to yourself.',
'Rain tapped the window like a second typist keeping time.',
'She saved the draft, stretched, and wrote one more honest line.',
'Good writing is rewriting; good typing is calm, steady rhythm.',
'A blank page is only frightening until the third word lands.',
'He kept a list of questions and answered one of them each night.',
'Slow is smooth and smooth is fast, said the old typewriter repairman.',
'The river does not hurry, yet it reaches the sea every morning.',
'Write the messy version first; polish it when the story is done.',
'Five quick zebras jumped over a box of vexing, golden pens.',
'Small daily pages turn into chapters before you notice the change.',
'Keep your wrists light, your eyes on the text, and breathe.',
'Ideas arrive on tired evenings, so keep a notebook near the bed.'];
const PUNCT=['Wait, what time is it?','Yes! We finished the report.','Call me tomorrow, please.','"Ready?" she asked. "Always."','Pack: pens, paper, and tea.','It is late; the lamp is still on.','Do it now - not later.','Well... maybe one more page.'];
const NUMS=['Room 42 opens at 9:30 on May 7.','Order 3 notebooks for $12.50 each.','Call 555-0187 before 6 pm.','The train left at 07:45, 15 minutes late.','Score: 98% on test 2 of 4.','Save 20% on orders over $100 (code #PO24).','Chapter 11 starts on page 236.','Mix 2 cups flour + 1 cup water = 3 cups.'];
const PARA=['Writing every day is less about talent and more about showing up. Sit down at the same time, open the same quiet page, and let the first sentence be imperfect. Momentum matters more than polish in the early hours. When the words begin to flow, keep your hands relaxed and your eyes on the text, not the keys. Accuracy first, then speed will follow naturally.',
'The old typewriter on the desk had a bell that rang near the end of every line. That small sound taught a whole generation to feel the rhythm of a page. Modern keyboards are silent and forgiving, yet the lesson stays the same: steady, even strokes beat frantic bursts. Practice a little every day and your fingers will remember the way home.'];

function drill(chars,n){const w=[];for(let i=0;i<n;i++){let s='';const L=2+(Math.random()*4|0);for(let j=0;j<L;j++)s+=rnd(chars);w.push(s)}return w.join(' ')}
function words(n,pool=COMMON){const w=[];for(let i=0;i<n;i++)w.push(rnd(pool));return w.join(' ')}
function pick(a,n){const c=[...a].sort(()=>Math.random()-.5);return c.slice(0,n).join(' ')}

const STAGES=[
 {id:'home',name:'Home row',icon:'⌂',tip:'Rest your fingers on A S D F and J K L ;. Do not look down.',type:'drill',gen:()=>drill('asdfjkl;gh',22),wpm:14,acc:90},
 {id:'top',name:'Top row',icon:'↑',tip:'Reach up and come back to the home row after every key.',type:'drill',gen:()=>drill('qwertyuiopasdfjkl',22),wpm:16,acc:90},
 {id:'bottom',name:'Bottom row',icon:'↓',tip:'Curl your fingers down for Z X C V B N M, then return home.',type:'drill',gen:()=>drill('zxcvbnm,.asdfjkl',22),wpm:16,acc:90},
 {id:'words',name:'Common words',icon:'Aa',tip:'These words make up most everyday writing. Learn them by feel.',type:'drill',gen:()=>words(28),wpm:22,acc:92},
 {id:'rain1',name:'Word rain',icon:'☂',tip:'Type each falling word before it reaches the rail. Press space or Enter to fire.',type:'rain',speed:1,time:50,goal:25},
 {id:'punct',name:'Capitals & punctuation',icon:'!?',tip:'Use the opposite hand\'s Shift key for capitals.',type:'drill',gen:()=>pick(PUNCT,5),wpm:22,acc:92},
 {id:'nums',name:'Numbers & symbols',icon:'#',tip:'Numbers are a long reach. Keep the other fingers anchored.',type:'drill',gen:()=>pick(NUMS,4),wpm:20,acc:90},
 {id:'sent',name:'Sentences',icon:'¶',tip:'Read a few words ahead while your fingers finish the current one.',type:'drill',gen:()=>pick(SENT,4),wpm:28,acc:94},
 {id:'rain2',name:'Word storm',icon:'⛈',tip:'Faster rain. Stay calm and clear the lowest word first.',type:'rain',speed:1.7,time:60,goal:40},
 {id:'sprint',name:'60-second sprint',icon:'⏱',tip:'Type as many words as you can in one minute. Errors slow you down.',type:'timed',time:60,gen:()=>words(160),wpm:32,acc:94},
 {id:'para',name:'Paragraph',icon:'☰',tip:'Long text tests rhythm. Accuracy above 96% earns the most stars.',type:'drill',gen:()=>rnd(PARA),wpm:34,acc:96},
 {id:'boss',name:'Marathon',icon:'♛',tip:'Two minutes of mixed writing. Keep a steady pace to the end.',type:'timed',time:120,gen:()=>pick(SENT,15),wpm:40,acc:95}];

/* ---------- UI ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
#game{position:fixed;inset:0;z-index:50;background:var(--panel);color:var(--ink);font-family:'Courier Prime',ui-monospace,'Courier New',monospace;display:flex;flex-direction:column;overflow:hidden}
#game[hidden]{display:none}
#game .gh{display:flex;align-items:center;gap:10px;padding:calc(12px + env(safe-area-inset-top)) 16px 12px;border-bottom:1px solid var(--line)}
#game .gh b{font-size:15px;letter-spacing:.06em}#game .gh .sp{flex:1}
#game button{font:inherit;color:inherit;background:none;border:1px solid var(--line);border-radius:6px;padding:7px 12px;cursor:pointer}
#game button:hover{background:var(--line)}#game button.pri{background:var(--ink);color:var(--panel);border-color:var(--ink)}
#game .gb{flex:1;overflow:auto;padding:18px 16px 40px}
#gMap{max-width:880px;margin:0 auto}
#gMap .sum{display:flex;gap:18px;flex-wrap:wrap;margin:0 0 16px;font-size:13px;opacity:.85}
#gMap .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}
#gMap .st{text-align:left;padding:14px;border-radius:10px;display:flex;flex-direction:column;gap:6px;min-height:118px;transition:transform .15s}
#gMap .st:not(:disabled):hover{transform:translateY(-2px)}
#gMap .st:disabled{opacity:.42;cursor:not-allowed}
#gMap .st .ic{font-size:20px}#gMap .st .nm{font-weight:700}#gMap .st .gl{font-size:11px;opacity:.7}
.gStars{letter-spacing:2px;color:#c8922b}.gStars i{font-style:normal;opacity:.25}
#gPlay{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
#gHud{display:flex;gap:10px;flex-wrap:wrap}
#gHud div{flex:1;min-width:80px;border:1px solid var(--line);border-radius:8px;padding:8px 10px;text-align:center}
#gHud small{display:block;font-size:10px;letter-spacing:.08em;opacity:.65;text-transform:uppercase}#gHud b{font-size:20px}
#gTip{font-size:12px;opacity:.75}
#gText{font-size:clamp(18px,2.6vw,24px);line-height:1.9;letter-spacing:.02em;padding:18px;border:1px solid var(--line);border-radius:10px;min-height:120px;max-height:46vh;overflow:auto;cursor:text;word-break:break-word;white-space:pre-wrap}
#gText span{transition:color .08s}#gText .ok{opacity:1}#gText .todo{opacity:.45}
#gText .bad{color:#c62828;background:rgba(198,40,40,.12);border-radius:2px}
#gText .cur{background:rgba(255,214,140,.55);border-bottom:2px solid currentColor;opacity:1}
#gIn{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;left:0;top:0}
#gCombo{font-size:12px;height:16px;text-align:right;opacity:.8}
#gCombo.pop{animation:gpop .25s}@keyframes gpop{50%{transform:scale(1.25)}}
#gText.shake{animation:gshake .18s}@keyframes gshake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
#gRain{position:relative;height:min(52vh,420px);border:1px solid var(--line);border-radius:10px;overflow:hidden;background:linear-gradient(180deg,transparent 70%,rgba(255,226,170,.25))}
#gRain::after{content:'';position:absolute;left:0;right:0;bottom:0;height:3px;background:#2b2d30}
#gRain .w{position:absolute;top:0;font-size:18px;padding:2px 6px;border-radius:4px;background:var(--panel);border:1px solid var(--line);white-space:nowrap;will-change:transform}
#gRain .w.hit{color:#c8922b;border-color:#c8922b}
#gRain .w.boom{animation:gboom .3s forwards}@keyframes gboom{to{opacity:0;transform:scale(1.6)}}
#gRainIn{font:inherit;font-size:20px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:100%;box-sizing:border-box}
#gRes{max-width:620px;margin:0 auto;text-align:center}
#gRes .big{font-size:52px;font-weight:700;margin:6px 0}#gRes .gStars{font-size:34px}
#gRes .row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:16px 0}
#gRes .keys{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:8px 0}
#gRes kbd{border:1px solid var(--line);border-bottom-width:3px;border-radius:5px;padding:4px 9px;font:inherit}
#gRes p{font-size:13px;opacity:.85;line-height:1.6}
#gSpark{display:flex;gap:3px;align-items:flex-end;height:46px;justify-content:center;margin:10px 0}#gSpark i{width:8px;background:#c8922b;border-radius:2px 2px 0 0;opacity:.75}
body.night #gRain::after{background:#fff}
</style>`);
document.body.insertAdjacentHTML('beforeend',`<div id="game" role="dialog" aria-label="Typing practice" hidden>
<div class="gh"><b>⌨ TYPING PRACTICE</b><span class="sp"></span><button id="gBack" hidden>stages</button><button id="gX">close</button></div>
<div class="gb"><div id="gMap"></div><div id="gPlay" hidden></div><div id="gRes" hidden></div></div>
<input id="gIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type here"></div>`);
const gm=$('#game'),map=$('#gMap'),play=$('#gPlay'),res=$('#gRes'),gin=$('#gIn');
const show=v=>{map.hidden=v!=='map';play.hidden=v!=='play';res.hidden=v!=='res';$('#gBack').hidden=v==='map'};
const starsHTML=n=>`<span class="gStars">${'★'.repeat(n)}<i>${'★'.repeat(3-n)}</i></span>`;

function open(){gm.hidden=false;document.body.classList.add('gaming');renderMap()}
function close(){stop();gm.hidden=true;document.body.classList.remove('gaming');const ed=$('#ed');ed&&ed.focus()}
$('#gX').onclick=close;$('#gBack').onclick=()=>{stop();renderMap()};
window.twGame=open;
if(location.hash==='#practice')setTimeout(open,300);

function weak(n=5){return Object.entries(G.keys).filter(([k,v])=>v.h+v.m>=6&&k.trim()).map(([k,v])=>[k,v.m/(v.h+v.m)]).filter(x=>x[1]>.04).sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0])}
function renderMap(){show('map');
  const total=Object.values(G.stars).reduce((a,b)=>a+b,0),best=Math.max(0,...Object.values(G.best).map(b=>b.wpm||0));
  const w=weak();
  map.innerHTML=`<div class="sum"><span>★ ${total} / ${STAGES.length*3} stars</span><span>Best speed: <b>${best}</b> WPM</span><span>Sessions: ${G.hist.length}</span>
  ${w.length?`<span>Weak keys: ${w.map(k=>`<b>${esc(k)}</b>`).join(' ')}</span>`:''}</div>
  <div class="grid">${STAGES.map((s,i)=>{const open=i===0||(G.stars[STAGES[i-1].id]||0)>0,st=G.stars[s.id]||0,b=G.best[s.id];
    return `<button class="st" data-i="${i}" ${open?'':'disabled'}><span class="ic">${s.icon}</span><span class="nm">${i+1}. ${esc(s.name)}</span>
    <span class="gl">${s.type==='rain'?`Goal: ${s.goal} words`:`Goal: ${s.wpm} WPM · ${s.acc}% accuracy`}</span>${starsHTML(st)}<span class="gl">${b?`Best ${s.type==='rain'?b.score+' words':b.wpm+' WPM'}`:open?'Not played yet':'Locked: earn a star in the stage before'}</span></button>`}).join('')}
  ${w.length?`<button class="st" data-weak="1"><span class="ic">✚</span><span class="nm">Weak-key workout</span><span class="gl">A drill built from the keys you miss most: ${w.map(esc).join(' ')}</span></button>`:''}</div>`;
  map.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>start(STAGES[+b.dataset.i]));
  const wb=map.querySelector('[data-weak]');if(wb)wb.onclick=()=>start(weakStage())}
function weakStage(){const w=weak(6),pool=COMMON.filter(x=>w.some(k=>x.includes(k)));
  return{id:'weak',name:'Weak-key workout',icon:'✚',tip:'Focus on '+w.join(' ')+'. Slow down on these keys; accuracy builds speed.',type:'drill',gen:()=>(pool.length>8?words(14,pool)+' ':'')+drill(w.join('')+'asdfjkl',10),wpm:20,acc:93,practice:1}}

/* ---------- play: drill & timed ---------- */
let S=null,tick=null,raf=null;
function stop(){clearInterval(tick);cancelAnimationFrame(raf);tick=raf=null;if(S)S.done=true;gin.blur()}
function start(st){stop();show('play');
  S={st,text:st.type==='rain'?'':st.gen(),typed:'',errs:0,keys:{},t0:0,combo:0,maxCombo:0,done:false,score:0,lives:3};
  play.innerHTML=`<div id="gHud"><div><small>stage</small><b>${esc(st.name)}</b></div><div><small>${st.type==='drill'?'time':'left'}</small><b id="hT">${st.time||0}</b></div><div><small>wpm</small><b id="hW">0</b></div><div><small>accuracy</small><b id="hA">100%</b></div>${st.type==='rain'?'<div><small>lives</small><b id="hL">♥♥♥</b></div><div><small>score</small><b id="hS">0</b></div>':''}</div>
  <div id="gTip">${esc(st.tip)} ${st.type==='rain'?'':'Timer starts on your first key.'}</div>
  ${st.type==='rain'?'<div id="gRain"></div><input id="gRainIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="type a falling word…">':'<div id="gText" tabindex="-1"></div>'}
  <div id="gCombo"></div><div style="text-align:center"><button id="gRestart">restart (Esc)</button></div>`;
  $('#gRestart').onclick=()=>start(st);
  if(st.type==='rain'){rainStart();return}
  $('#gText').onclick=()=>gin.focus();renderText();gin.value='';setTimeout(()=>gin.focus(),30)}
function renderText(){const t=$('#gText');if(!t)return;const {text,typed}=S;let h='';
  for(let i=0;i<text.length;i++){const c=esc(text[i]);
    if(i<typed.length)h+=`<span class="${typed[i]===text[i]?'ok':'bad'}">${typed[i]!==text[i]&&text[i]===' '?'·':c}</span>`;
    else if(i===typed.length)h+=`<span class="cur">${c}</span>`;else{h+=`<span class="todo">${text.slice(i).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</span>`;break}}
  t.innerHTML=h;const cur=t.querySelector('.cur');if(cur&&cur.offsetTop>t.scrollTop+t.clientHeight-50)t.scrollTop=cur.offsetTop-40}
function stats(){const ms=S.t0?Date.now()-S.t0:0,min=Math.max(ms/60000,1/600);
  let ok=0;for(let i=0;i<S.typed.length;i++)if(S.typed[i]===S.text[i])ok++;
  const total=Object.values(S.keys).reduce((a,v)=>a+v.h+v.m,0),miss=Object.values(S.keys).reduce((a,v)=>a+v.m,0);
  return{wpm:Math.round(ok/5/min),acc:total?Math.round((1-miss/total)*1000)/10:100,ms}}
function hud(){const s=stats();$('#hW').textContent=s.wpm;$('#hA').textContent=s.acc+'%';
  if(S.st.type==='timed'||S.st.type==='rain')$('#hT').textContent=Math.max(0,Math.ceil(S.st.time-s.ms/1000));else $('#hT').textContent=Math.floor(s.ms/1000)+'s'}
gin.addEventListener('input',()=>{if(!S||S.done||S.st.type==='rain')return;
  let v=gin.value;if(v.length>S.text.length)v=v.slice(0,S.text.length);
  if(!S.t0&&v.length){S.t0=Date.now();tick=setInterval(()=>{hud();if(S.st.type==='timed'&&stats().ms>=S.st.time*1000)finish()},250)}
  if(v.length>S.typed.length){for(let i=S.typed.length;i<v.length;i++){const exp=S.text[i],ok=v[i]===exp,k=exp.toLowerCase();
      (S.keys[k]=S.keys[k]||{h:0,m:0})[ok?'h':'m']++;
      if(ok){S.combo++;S.maxCombo=Math.max(S.maxCombo,S.combo)}else{S.errs++;S.combo=0;const t=$('#gText');t.classList.remove('shake');void t.offsetWidth;t.classList.add('shake')}
      snd(v[i]===' '?'space':'key')}}
  else if(v.length<S.typed.length)snd('back');
  S.typed=v;renderText();hud();
  const c=$('#gCombo');if(S.combo>=10&&S.combo%10===0){c.textContent=`🔥 ${S.combo} in a row`;c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}else if(!S.combo)c.textContent='';
  if(S.typed.length>=S.text.length){if(S.st.type==='timed'){S.text+=' '+S.st.gen();renderText()}else finish()}});
gin.addEventListener('paste',e=>e.preventDefault());gin.addEventListener('drop',e=>e.preventDefault());
gin.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();start(S.st)}});

/* ---------- play: word rain ---------- */
let drops=[],lastSpawn=0,rainIn=null;
function rainStart(){drops=[];lastSpawn=0;loop.last=0;const box=$('#gRain');rainIn=$('#gRainIn');S.t0=0;
  rainIn.oninput=()=>{const v=rainIn.value.trim().toLowerCase();if(!S.t0){S.t0=Date.now();tick=setInterval(()=>{hud();$('#hT').textContent=Math.max(0,Math.ceil(S.st.time-(Date.now()-S.t0)/1000));if(Date.now()-S.t0>=S.st.time*1000)finish()},250);raf=requestAnimationFrame(loop)}
    snd(rainIn.value.endsWith(' ')?'space':'key');drops.forEach(d=>d.el.classList.toggle('hit',!!v&&d.w.startsWith(v)));
    if(/\s$/.test(rainIn.value))fire(v);else{const d=drops.find(d=>d.w===v);if(d&&!drops.some(o=>o.w.length>v.length&&o.w.startsWith(v)))fire(v)}};
  rainIn.onpaste=e=>e.preventDefault();rainIn.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();fire(rainIn.value.trim().toLowerCase())}if(e.key==='Escape'){e.preventDefault();start(S.st)}};
  box.innerHTML='<div style="position:absolute;inset:0;display:grid;place-items:center;opacity:.6;font-size:14px">start typing to begin the rain</div>';
  setTimeout(()=>rainIn.focus(),30)}
function fire(v){if(!v)return;const hits=drops.filter(d=>d.w===v).sort((a,b)=>b.y-a.y);const k=v.toLowerCase();
  if(hits.length){const d=hits[0];S.score++;S.combo++;S.maxCombo=Math.max(S.maxCombo,S.combo);for(const ch of d.w)(S.keys[ch]=S.keys[ch]||{h:0,m:0}).h++;S.typed+=d.w+' ';S.text+=d.w+' ';
    d.el.classList.add('boom');setTimeout(()=>d.el.remove(),300);drops=drops.filter(x=>x!==d);$('#hS').textContent=S.score;snd('ret');
    if(S.combo>=5&&S.combo%5===0){const c=$('#gCombo');c.textContent=`🔥 combo ${S.combo}`;c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}}
  else{S.combo=0;S.errs++;const near=drops.find(d=>d.w[0]===k[0]);if(near)for(let i=0;i<near.w.length;i++)if(near.w[i]!==k[i]){const c=near.w[i];(S.keys[c]=S.keys[c]||{h:0,m:0}).m++;break}}
  rainIn.value='';drops.forEach(d=>d.el.classList.remove('hit'));hud()}
function loop(now){if(!S||S.done)return;const box=$('#gRain');if(!box)return;if(!lastSpawn&&box.firstElementChild&&!box.firstElementChild.classList.contains('w'))box.innerHTML='';
  const el=(Date.now()-S.t0)/1000,H=box.clientHeight,W=box.clientWidth,sp=S.st.speed*(1+el/S.st.time);
  if(now-lastSpawn>Math.max(650,2300/sp)){lastSpawn=now;const pool=el<15?COMMON.filter(w=>w.length<=4):el<35?COMMON.filter(w=>w.length<=6):COMMON;
    const w=rnd(pool),d=document.createElement('div');d.className='w';d.textContent=w;box.appendChild(d);const x=8+Math.random()*Math.max(10,W-w.length*12-30);drops.push({w,el:d,x,y:-24})}
  const dt=Math.min(.05,Math.max(0,(now-(loop.last||now))/1000));loop.last=now;for(const d of [...drops]){d.y+=dt*44*sp;d.el.style.transform=`translate(${d.x}px,${d.y}px)`;
    if(d.y>H-30){d.el.remove();drops=drops.filter(x=>x!==d);S.lives--;S.combo=0;for(const ch of d.w)(S.keys[ch]=S.keys[ch]||{h:0,m:0}).m+=.2;
      $('#hL').textContent='♥'.repeat(Math.max(0,S.lives))+'♡'.repeat(3-Math.max(0,S.lives));box.classList.remove('shake');void box.offsetWidth;box.style.animation='gshake .2s';setTimeout(()=>box.style.animation='',220);
      if(S.lives<=0){finish();return}}}
  raf=requestAnimationFrame(loop)}

/* ---------- results ---------- */
function finish(){if(!S||S.done)return;const s=stats(),st=S.st;stop();
  for(const[k,v]of Object.entries(S.keys)){const g=G.keys[k]=G.keys[k]||{h:0,m:0};g.h=Math.round((g.h+v.h)*10)/10;g.m=Math.round((g.m+v.m)*10)/10}
  let stars=0;
  if(st.type==='rain'){stars=S.score>=st.goal*1.5?3:S.score>=st.goal?2:S.score>=st.goal*.5?1:0}
  else if(s.acc>=st.acc-5&&s.wpm>=Math.round(st.wpm*.5)){stars=1;if(s.wpm>=st.wpm&&s.acc>=st.acc)stars=2;if(s.wpm>=Math.round(st.wpm*1.3)&&s.acc>=Math.max(st.acc,97))stars=3}
  const prev=G.best[st.id],better=!prev||(st.type==='rain'?S.score>(prev.score||0):s.wpm>(prev.wpm||0));
  if(!st.practice){G.stars[st.id]=Math.max(G.stars[st.id]||0,stars);if(better)G.best[st.id]={wpm:s.wpm,acc:s.acc,score:S.score}}
  G.hist.push({d:Date.now(),s:st.id,wpm:s.wpm,acc:s.acc});if(G.hist.length>200)G.hist=G.hist.slice(-200);save();
  const missed=Object.entries(S.keys).filter(([k,v])=>v.m>=1&&k.trim()).sort((a,b)=>b[1].m-a[1].m).slice(0,6);
  const idx=STAGES.indexOf(st),next=STAGES[idx+1],canNext=next&&(G.stars[st.id]||0)>0;
  const recent=G.hist.filter(h=>h.wpm).slice(-14);const mx=Math.max(10,...recent.map(h=>h.wpm));
  let advice;
  if(st.type!=='rain'&&s.acc<st.acc)advice='Slow down a little. Accuracy is the fastest way to real speed: every mistake costs about three keystrokes to fix.';
  else if(st.type!=='rain'&&s.wpm<st.wpm)advice='Accuracy is good. Now push the rhythm: read the next word while you type this one.';
  else if(stars===3)advice='Excellent. Move on to the next stage, and come back later to beat your best.';
  else advice='Nice work. Replay once more to lock it in, or try the next stage.';
  res.innerHTML=`<div style="font-size:13px;opacity:.7">${esc(st.name)}</div>
  <div class="big">${st.type==='rain'?S.score+' <small style="font-size:18px">words</small>':s.wpm+' <small style="font-size:18px">WPM</small>'}</div>
  ${st.practice?'':starsHTML(stars)}
  <p>Accuracy <b>${s.acc}%</b> · Time <b>${Math.round(s.ms/1000)}s</b> · Mistakes <b>${S.errs}</b> · Best streak <b>${S.maxCombo}</b>${better&&prev?' · <b>New personal best!</b>':''}</p>
  ${missed.length?`<p style="margin-bottom:2px">Keys you missed this round:</p><div class="keys">${missed.map(([k])=>`<kbd>${k===' '?'space':esc(k)}</kbd>`).join('')}</div>`:''}
  <p>${advice}</p>
  ${recent.length>1?`<div id="gSpark" title="Your last ${recent.length} rounds (WPM)">${recent.map(h=>`<i style="height:${Math.max(4,h.wpm/mx*46)}px"></i>`).join('')}</div><p style="font-size:11px;margin-top:0">speed over your last ${recent.length} rounds</p>`:''}
  <div class="row"><button id="gAgain">play again</button>${canNext?'<button class="pri" id="gNext">next stage →</button>':''}${weak().length?'<button id="gWeak">weak-key workout</button>':''}<button id="gMapB">all stages</button></div>`;
  show('res');
  $('#gAgain').onclick=()=>start(st);$('#gMapB').onclick=renderMap;
  if(canNext)$('#gNext').onclick=()=>start(next);const wb=$('#gWeak');if(wb)wb.onclick=()=>start(weakStage());
  snd('ret')}

document.addEventListener('keydown',e=>{const m=e.ctrlKey||e.metaKey;
  if(m&&e.shiftKey&&e.key.toLowerCase()==='g'){e.preventDefault();gm.hidden?open():close()}
  else if(!gm.hidden&&e.key==='Escape'&&!res.hidden){e.preventDefault();renderMap()}
  else if(!gm.hidden&&!play.hidden&&S&&S.st.type!=='rain'&&document.activeElement!==gin&&e.key.length===1&&!m){gin.focus()}},true);

/* entry points: top bar (wide screens) and the Documents drawer (all screens) */
const bar=$('.bar .right'),bf=$('#bFocus');
if(bar){const b=document.createElement('button');b.id='bGame';b.className='hide-s';b.title='Typing practice game (Ctrl+Shift+G)';b.textContent='practice';b.onclick=open;bf?bf.before(b):bar.appendChild(b)}
const dh=$('#lib .dh');if(dh){const b=document.createElement('button');b.className='mini';b.textContent='⌨ typing game';b.style.marginLeft='auto';b.style.marginRight='6px';b.onclick=()=>{$('#lib').close();open()};dh.querySelector('b').after(b)}
})();
