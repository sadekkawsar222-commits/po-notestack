const $=s=>document.querySelector(s), ed=$('#ed'), stage=$('#stage'), curEl=$('#cur');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const ls={get(k,d){try{const v=localStorage.getItem('tw.'+k);return v?JSON.parse(v):d}catch{return d}},set(k,v){try{localStorage.setItem('tw.'+k,JSON.stringify(v))}catch{}}};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),1800)}

/* ---------- storage (IndexedDB) ---------- */
const DB={db:null,
  open(){return new Promise(r=>{try{const q=indexedDB.open('typewriter',1);q.onupgradeneeded=()=>q.result.createObjectStore('docs',{keyPath:'id'});q.onsuccess=()=>{this.db=q.result;r()};q.onerror=()=>r()}catch{r()}})},
  run(m,fn){return new Promise(r=>{if(!this.db)return r(null);const t=this.db.transaction('docs',m),q=fn(t.objectStore('docs'));t.oncomplete=()=>r(q&&q.result);t.onerror=()=>r(null)})},
  all(){return this.db?this.run('readonly',s=>s.getAll()).then(v=>v||[]):Promise.resolve(ls.get('docs',[]))},
  put(d){if(!this.db){const a=ls.get('docs',[]).filter(x=>x.id!==d.id);a.push(d);ls.set('docs',a);return Promise.resolve()}return this.run('readwrite',s=>s.put(d))},
  del(id){if(!this.db){ls.set('docs',ls.get('docs',[]).filter(x=>x.id!==id));return Promise.resolve()}return this.run('readwrite',s=>s.delete(id))}};

/* ---------- settings & themes ---------- */
const THEMES={original:{bg:'#e7d9b8',ink:'#1f2023',op:.95,ui:'#2b2d30',panel:'#f4ead2',line:'rgba(60,40,10,.14)',lamp:true,glow:.85},
  night:{bg:'#000000',ink:'#ffffff',op:1,ui:'#ffffff',panel:'#0a0a0a',line:'rgba(255,255,255,.16)',lamp:true,glow:.3},
  paper:{bg:'#efe4c9',ink:'#26211c',op:.95,ui:'#8c8170',panel:'#f6eedb',line:'rgba(60,40,10,.13)',lamp:false,glow:1}};
const DEF={theme:'original',...THEMES.original,font:"'Courier Prime'",size:18,lh:1.75,width:700,vpos:.7,cursor:'bar',blink:true,tws:true,on:true,check:true,bangla:false,sound:true,vol:.6,haptic:true};
let S={...DEF,...ls.get('settings8',{})};
function applyS(){const r=document.documentElement.style;
  r.setProperty('--bg',S.bg);r.setProperty('--ink',S.ink);r.setProperty('--op',S.op);r.setProperty('--ui',S.ui);r.setProperty('--panel',S.panel);r.setProperty('--line',S.line);
  r.setProperty('--font',S.font+",'Tiro Bangla',ui-monospace,'Courier New',monospace");r.setProperty('--size',S.size+'px');r.setProperty('--lh',S.lh);r.setProperty('--width',S.width+'px');r.setProperty('--vpos',S.vpos);
  document.body.classList.toggle('night',S.theme==='night');document.body.classList.toggle('cc',S.cursor!=='native');
  r.setProperty('--glow',S.glow);$('#glow').style.opacity=S.glow;document.body.classList.toggle('nolamp',!S.lamp);document.body.classList.toggle('off',!S.on);document.body.classList.toggle('nocheck',!S.check);
  document.querySelector('meta[name=theme-color]').content=S.bg;
  curEl.className='c-'+S.cursor+(S.blink?' blink':'');
  document.querySelectorAll('[data-k]').forEach(i=>{const v=S[i.dataset.k];i.type==='checkbox'?i.checked=v:i.value=v});
  document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('on',b.dataset.theme===S.theme));
  ls.set('settings8',S);requestAnimationFrame(()=>{tws();drawCursor()})}
document.querySelectorAll('[data-k]').forEach(i=>i.addEventListener('input',()=>{const k=i.dataset.k;S[k]=i.type==='checkbox'?i.checked:i.type==='range'?+i.value:i.value;applyS()}));
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{S={...S,theme:b.dataset.theme,...THEMES[b.dataset.theme]};applyS()});
$('#lamp').onclick=e=>{e.stopPropagation();S.on=!S.on;applyS();ed.focus()};
$('#reset').onclick=()=>{S={...DEF};applyS()};

/* ---------- documents ---------- */
let docs=[], cur=null, saveT=null, folders=ls.get('folders',[]), view='all';
function blank(){ed.innerHTML='<p><br></p>'}
function ensureDoc(){if(!cur){cur={id:uid(),title:'Untitled',titleAuto:true,html:'',text:'',folder:'',fav:false,archived:false,trashed:false,created:Date.now(),updated:Date.now()};docs.push(cur);ls.set('last',cur.id)}}
function setStatus(s){$('#status').textContent=s}
let dirty=false;
function schedule(){dirty=true;setStatus('editing');clearTimeout(saveT);saveT=setTimeout(save,450)}
async function save(){if(!cur||!dirty)return;clearTimeout(saveT);saveT=null;dirty=false;
  cur.html=ed.innerHTML.replace(/ class="now"/g,'').replace(/ now"/g,'"');cur.text=ed.innerText.replace(/\n{3,}/g,'\n\n').trim();
  if(cur.titleAuto){cur.title=(cur.text.split('\n').find(l=>l.trim())||'Untitled').trim().slice(0,60);$('#title').value=cur.title}
  cur.updated=Date.now();setStatus('saving');await DB.put(cur);setStatus('saved')}
function openDoc(d){if(cur&&saveT)save();cur=d;ed.innerHTML=d.html||'<p><br></p>';$('#title').value=d.title;ls.set('last',d.id);setStatus('saved');count();
  ed.focus();caretEnd();setTimeout(()=>{ed.focus();caretEnd();stage.scrollTop=stage.scrollHeight;tws();drawCursor()},60)}
function newDoc(){if(cur&&saveT)save();cur=null;blank();$('#title').value='Untitled';setStatus('new');count();ed.focus();caretEnd();stage.scrollTop=0;requestAnimationFrame(drawCursor)}
$('#title').addEventListener('input',()=>{ensureDoc();cur.title=$('#title').value.trim()||'Untitled';cur.titleAuto=false;schedule()});
$('#title').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ed.focus();caretEnd()}});

function count(){const t=ed.innerText.trim();const w=t?t.split(/\s+/).length:0;$('#count').textContent=`${w} word${w==1?'':'s'} · ${t.replace(/\n/g,'').length} chars`}

/* ---------- typewriter behaviour ---------- */
function caretRect(){const s=getSelection();if(!s.rangeCount||!ed.contains(s.anchorNode))return null;const r=s.getRangeAt(0).cloneRange();r.collapse(false);
  let b=[...r.getClientRects()].pop();if(b&&b.height)return b;
  let n=r.startContainer;if(n.nodeType===3)n=n.parentNode;if(n===ed)n=ed.children[Math.max(0,r.startOffset-1)]||ed;
  if(n.nodeType!==1)return null;const c=n.getBoundingClientRect(),cs=getComputedStyle(n);const lh=parseFloat(cs.lineHeight)||20;
  const pl=parseFloat(cs.paddingLeft)||0,pt=parseFloat(cs.paddingTop)||0;
  const left=cs.textAlign==='center'?c.left+c.width/2:cs.textAlign==='right'?c.right:c.left+(n===ed?pl:pl);
  const fs=parseFloat(cs.fontSize)||S.size,gh=fs*1.15;return{left,top:c.top+pt+(lh-gh)/2,height:gh}}
function tws(){if(!S.tws)return;const b=caretRect();if(!b)return;stage.scrollTop+=b.top+b.height/2-stage.clientHeight*S.vpos}
function moveLamp(b){const x=Math.max(30,Math.min(innerWidth-30,b.left)),r=document.documentElement.style;
  const y=Math.round(S.tws&&!document.body.classList.contains('reading')?stage.getBoundingClientRect().top+stage.clientHeight*S.vpos+b.height/2+Math.max(16,S.size):b.top+b.height+3);
  moveLamp.done=b.top!==undefined&&!b.idle;r.setProperty('--lx',x+'px');r.setProperty('--ly',y+'px')}
function placeIdle(){const c=ed.getBoundingClientRect(),cs=getComputedStyle(ed),h=S.size*1.15,p=ed.querySelector('p,h1,h2,h3,li,div');const l=p?p.getBoundingClientRect().left:c.left+parseFloat(cs.paddingLeft);moveLamp({left:l,top:stage.clientHeight*S.vpos-h/2,height:h,idle:1})}
function drawCursor(){const s=getSelection();
  const b=s.rangeCount&&s.isCollapsed?caretRect():null;if(b)moveLamp(b);else if(!moveLamp.done)placeIdle();
  if(S.cursor==='native'||document.activeElement!==ed||!b){curEl.hidden=true;return}
  const fs=parseFloat(getComputedStyle(s.anchorNode.nodeType===3?s.anchorNode.parentNode:s.anchorNode).fontSize)||S.size;
  const h=fs*1.15,mid=b.top+b.height/2;curEl.hidden=false;curEl.style.left=b.left+'px';
  if(S.cursor==='under'){curEl.style.top=(mid+h/2-2)+'px';curEl.style.height='2px'}else{curEl.style.top=(mid-h/2)+'px';curEl.style.height=h+'px'}
  curEl.style.fontSize=fs+'px'}
function solidCursor(){curEl.classList.remove('blink');clearTimeout(solidCursor.t);if(S.blink)solidCursor.t=setTimeout(()=>curEl.classList.add('blink'),550)}
function caretEnd(){const r=document.createRange();r.selectNodeContents(ed);r.collapse(false);const s=getSelection();s.removeAllRanges();s.addRange(r)}

ed.addEventListener('input',()=>{if(!ed.firstElementChild)blank();ensureDoc();schedule();count();requestAnimationFrame(()=>{tws();drawCursor()});solidCursor()});
ed.addEventListener('keydown',e=>{
  if(e.key==='Tab'){e.preventDefault();document.execCommand('insertText',false,'    ')}
  if(!e.ctrlKey&&!e.metaKey&&e.key.length===1)document.body.classList.add('typing');
  if(['Enter','ArrowUp','ArrowDown','PageUp','PageDown'].includes(e.key))requestAnimationFrame(()=>{tws();drawCursor()})});
ed.addEventListener('blur',()=>{curEl.hidden=true;if(saveT)save()});
ed.addEventListener('focus',()=>requestAnimationFrame(drawCursor));
ed.addEventListener('click',e=>{const li=e.target.closest('ul.check>li');if(li&&e.offsetX<parseFloat(getComputedStyle(li).paddingLeft)){li.dataset.done=li.dataset.done==='1'?'0':'1';ed.dispatchEvent(new Event('input'))}});
ed.addEventListener('paste',e=>{e.preventDefault();const cd=e.clipboardData,h=cd.getData('text/html');
  if(h&&window.DOMPurify){document.execCommand('insertHTML',false,DOMPurify.sanitize(h,{ALLOWED_TAGS:['p','br','b','strong','i','em','u','s','strike','del','h1','h2','h3','ul','ol','li','blockquote','pre','code','a','table','thead','tbody','tr','td','th','hr','sup','sub'],ALLOWED_ATTR:['href']}))}
  else document.execCommand('insertText',false,cd.getData('text/plain'))});
stage.addEventListener('mousedown',e=>{if(e.target===stage){e.preventDefault();ed.focus();caretEnd();tws();drawCursor()}});
stage.addEventListener('scroll',()=>drawCursor(),{passive:true});
let lastRange=null,mx=0,my=0;
let ptrDown=false;document.addEventListener('pointerdown',()=>ptrDown=true,true);document.addEventListener('pointerup',()=>{ptrDown=false;const s=getSelection();if(s.isCollapsed&&ed.contains(s.anchorNode))setTimeout(()=>{if(!S.tws)return;const b=caretRect();if(!b)return;const d=b.top+b.height/2-stage.clientHeight*S.vpos;if(Math.abs(d)>2)stage.scrollTo({top:stage.scrollTop+d,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})},0)},true);
let idleT;const wake=()=>{document.body.classList.remove('idle');clearTimeout(idleT);idleT=setTimeout(()=>document.body.classList.add('idle'),25000)};ed.addEventListener('input',wake);ed.addEventListener('focus',wake);wake();
setTimeout(()=>document.body.classList.add('lit'),150);
document.addEventListener('selectionchange',()=>{const s=getSelection();if(s.rangeCount&&ed.contains(s.anchorNode)){lastRange=s.getRangeAt(0).cloneRange();$('#fmt').classList.toggle('sel',!s.isCollapsed)}drawCursor()});
document.addEventListener('mousemove',e=>{if(Math.abs(e.clientX-mx)+Math.abs(e.clientY-my)>6)document.body.classList.remove('typing');mx=e.clientX;my=e.clientY});
document.addEventListener('touchstart',e=>{if(!ed.contains(e.target))document.body.classList.remove('typing')},{passive:true});
window.addEventListener('resize',()=>requestAnimationFrame(()=>{tws();drawCursor()}));
if(window.visualViewport)visualViewport.addEventListener('resize',()=>requestAnimationFrame(()=>{tws();drawCursor()}));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&saveT)save()});
window.addEventListener('pagehide',()=>{if(saveT)save()});
try{document.execCommand('defaultParagraphSeparator',false,'p')}catch{}

/* ---------- formatting ---------- */
const fmt=$('#fmt');
function restore(){ed.focus();if(lastRange){const s=getSelection();s.removeAllRanges();s.addRange(lastRange)}}
const selText=()=>getSelection().toString();
const SPECIAL={
  link(){const u=prompt('Link address','https://');if(!u)return;const url=/^(https?:|mailto:)/i.test(u)?u:'https://'+u;
    if(getSelection().isCollapsed)document.execCommand('insertHTML',false,`<a href="${esc(url)}">${esc(url)}</a>&nbsp;`);else document.execCommand('createLink',false,url)},
  check(){document.execCommand('insertHTML',false,`<ul class="check"><li data-done="0">${esc(selText())||'<br>'}</li></ul>`)},
  table(){const v=prompt('Rows × columns','3x3');if(!v)return;const[r,c]=v.split(/[x×*, ]+/).map(n=>Math.min(30,Math.max(1,parseInt(n)||2)));
    let h='<table><tbody><tr>'+'<th><br></th>'.repeat(c)+'</tr>';for(let i=1;i<r;i++)h+='<tr>'+'<td><br></td>'.repeat(c)+'</tr>';document.execCommand('insertHTML',false,h+'</tbody></table><p><br></p>')},
  icode(){const t=selText();document.execCommand('insertHTML',false,`<code>${esc(t)||'code'}</code>&nbsp;`)}};
fmt.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault()});
fmt.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;restore();const c=b.dataset.c;
  if(SPECIAL[c])SPECIAL[c]();else document.execCommand(c,false,b.dataset.v||null);ed.dispatchEvent(new Event('input'))});
$('#cFore').addEventListener('input',e=>{restore();document.execCommand('foreColor',false,e.target.value);ed.dispatchEvent(new Event('input'))});
$('#cHi').addEventListener('input',e=>{restore();document.execCommand('hiliteColor',false,e.target.value);ed.dispatchEvent(new Event('input'))});
$('#bFmt').onclick=()=>{$('#bFmt').classList.toggle('on',fmt.classList.toggle('on'));restore()};

/* ---------- panels ---------- */
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d)d.close()});d.addEventListener('close',()=>{ed.focus();if(lastRange)restore()})});
const openLib=()=>{renderLib();$('#lib').showModal();$('#q').focus()};
$('#bLib').onclick=openLib;$('#bSet').onclick=()=>$('#set').showModal();
$('#bExp').onclick=()=>$('#exp').showModal();
$('#bShare').onclick=()=>{$('#shOut').hidden=true;$('#share').showModal()};
const toggleFocus=()=>{$('#bFocus').classList.toggle('on',document.body.classList.toggle('focus'));toast(document.body.classList.contains('focus')?'Focus mode — Esc to leave':'Focus mode off');ed.focus()};
$('#bFocus').onclick=toggleFocus;
document.addEventListener('keydown',e=>{const m=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(m&&k==='s'){e.preventDefault();if(ed.innerText.trim()){ensureDoc();dirty=true;save()}toast('Saved')}
  else if(m&&e.altKey&&k==='n'){e.preventDefault();newDoc()}
  else if(m&&e.shiftKey&&k==='l'){e.preventDefault();openLib()}
  else if(m&&e.shiftKey&&k==='e'){e.preventDefault();$('#exp').showModal()}
  else if(m&&e.shiftKey&&k==='f'){e.preventDefault();toggleFocus()}
  else if(m&&e.key===','){e.preventDefault();$('#set').showModal()}
  else if(m&&k==='k'&&document.activeElement===ed){e.preventDefault();SPECIAL.link();ed.dispatchEvent(new Event('input'))}
  else if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&document.body.classList.contains('focus'))toggleFocus()});

/* ---------- library ---------- */
const VIEWS=[['all','All'],['recent','Recent'],['fav','Favorites'],['archived','Archived'],['trash','Trash']];
function renderLib(){
  $('#views').innerHTML=VIEWS.map(([k,l])=>`<button data-v="${k}" class="${view===k?'on':''}">${l}</button>`).join('')+
    folders.map(f=>`<button data-v="f:${esc(f)}" class="${view==='f:'+f?'on':''}">▸ ${esc(f)}<span class="x" data-delf="${esc(f)}" title="Delete folder">×</span></button>`).join('')+`<button data-newf>+ folder</button>`;
  const q=$('#q').value.toLowerCase().trim();
  let v=docs.filter(d=>{if(view==='trash')return d.trashed;if(d.trashed)return false;if(view==='archived')return d.archived;if(d.archived)return false;
    if(view==='fav')return d.fav;if(view.startsWith('f:'))return d.folder===view.slice(2);return true});
  if(q)v=v.filter(d=>(d.title+'\n'+d.text).toLowerCase().includes(q));
  v.sort((a,b)=>b.updated-a.updated);if(view==='recent')v=v.slice(0,10);
  const fo=d=>`<select data-a="move" title="Move to folder"><option value="">no folder</option>${folders.map(f=>`<option ${d.folder===f?'selected':''}>${esc(f)}</option>`).join('')}</select>`;
  $('#list').innerHTML=v.length?v.map(d=>{const w=d.text?d.text.split(/\s+/).length:0;
    return `<div class="item ${cur&&cur.id===d.id?'on':''}" data-id="${d.id}"><div class="it" data-a="open"><span>${d.fav?'★ ':''}${esc(d.title)}</span><small>${new Date(d.updated).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})} · ${w} words${d.folder?' · '+esc(d.folder):''}</small></div>
    <div class="acts">${d.trashed?`<button class="mini" data-a="restore">restore</button><button class="mini" data-a="purge">delete forever</button>`:
    `<button class="mini" data-a="fav">${d.fav?'unfavorite':'favorite'}</button><button class="mini" data-a="rename">rename</button><button class="mini" data-a="dup">duplicate</button>${fo(d)}<button class="mini" data-a="archive">${d.archived?'unarchive':'archive'}</button><button class="mini" data-a="trash">trash</button>`}</div></div>`}).join('')
    :`<div class="empty">${q?'No documents match.':view==='trash'?'Trash is empty.':'Nothing here yet. Close this panel and start typing — a document is created automatically.'}</div>`}
$('#q').addEventListener('input',renderLib);
$('#newDoc').onclick=()=>{$('#lib').close();newDoc()};
$('#views').addEventListener('click',e=>{const df=e.target.dataset.delf;
  if(df!==undefined){e.stopPropagation();if(!confirm(`Delete folder “${df}”? Documents stay, without a folder.`))return;folders=folders.filter(f=>f!==df);ls.set('folders',folders);
    docs.filter(d=>d.folder===df).forEach(d=>{d.folder='';DB.put(d)});if(view==='f:'+df)view='all';return renderLib()}
  if(e.target.closest('[data-newf]')){const n=(prompt('Folder name')||'').trim().slice(0,40);if(n&&!folders.includes(n)){folders.push(n);ls.set('folders',folders);view='f:'+n}return renderLib()}
  const b=e.target.closest('[data-v]');if(b){view=b.dataset.v;renderLib()}});
async function act(a,d,el){
  if(a==='open'){$('#lib').close();if(d.trashed)return toast('Restore it from Trash first');return openDoc(d)}
  if(a==='fav')d.fav=!d.fav;
  if(a==='rename'){const n=prompt('Rename document',d.title);if(!n)return;d.title=n.trim().slice(0,120);d.titleAuto=false;if(cur===d)$('#title').value=d.title}
  if(a==='dup'){const c={...d,id:uid(),title:d.title+' (copy)',titleAuto:false,created:Date.now(),updated:Date.now(),fav:false};docs.push(c);await DB.put(c);toast('Duplicated');return renderLib()}
  if(a==='move')d.folder=el.value;
  if(a==='archive')d.archived=!d.archived;
  if(a==='trash'){d.trashed=true;if(cur===d){cur=null;newDoc()}toast('Moved to Trash')}
  if(a==='restore')d.trashed=false;
  if(a==='purge'){if(!confirm(`Delete “${d.title}” forever? This cannot be undone.`))return;docs=docs.filter(x=>x!==d);await DB.del(d.id);return renderLib()}
  if(cur===d&&saveT)await save(); await DB.put(d);renderLib()}
$('#list').addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.tagName==='SELECT')return;const d=docs.find(x=>x.id===t.closest('.item').dataset.id);act(t.dataset.a,d,t)});
$('#list').addEventListener('change',e=>{if(e.target.dataset.a==='move'){const d=docs.find(x=>x.id===e.target.closest('.item').dataset.id);act('move',d,e.target)}});

/* ---------- export ---------- */
const fname=()=>((cur&&cur.title)||$('#title').value||'Untitled').replace(/[\\/:*?"<>|]+/g,'').trim().slice(0,80)||'Untitled';
function contentCSS(fs){return `body{font-family:'Courier Prime','Tiro Bangla','Courier New',monospace;font-size:${fs}pt;line-height:1.55;color:#222}
p{margin:0 0 .8em}h1{font-size:1.6em}h2{font-size:1.3em}h3{font-size:1.1em}h1,h2,h3{margin:1.1em 0 .45em;page-break-after:avoid}
blockquote{margin:0 0 .8em;padding-left:1em;border-left:2px solid #999;font-style:italic}pre{background:#f2f2f2;padding:.6em .8em;white-space:pre-wrap;font-family:inherit}
code{background:#f2f2f2}hr{border:0;border-top:1px dashed #999;margin:1.4em 0}table{border-collapse:collapse;width:100%;margin:0 0 .8em}td,th{border:1px solid #888;padding:.25em .5em;text-align:left;vertical-align:top}
ul.check{list-style:none;padding-left:0}ul.check li::before{content:'[ ] '}ul.check li[data-done="1"]::before{content:'[x] '}tr,img,pre,blockquote{page-break-inside:avoid}
h1.dt{font-size:1.3em;font-weight:400;letter-spacing:.05em;margin:0 0 2em}`}
function cleanHTML(){return DOMPurify.sanitize(ed.innerHTML,{ADD_ATTR:['data-done']})}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
const opts=()=>({size:$('#eSize').value,ori:$('#eOri').value,mar:Math.min(50,Math.max(5,+$('#eMar').value||22)),fs:Math.min(24,Math.max(7,+$('#eFs').value||11)),pn:$('#ePn').checked,ti:$('#eTi').checked});
function exportPDF(o){const title=fname();
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Tiro+Bangla&display=swap">
<style>@page{size:${o.size} ${o.ori};margin:${o.mar}mm;${o.pn?`@bottom-center{content:counter(page) " / " counter(pages);font:8pt 'Courier Prime',monospace;color:#888}`:''}}html,body{margin:0}${contentCSS(o.fs)}</style></head>
<body>${o.ti?`<h1 class="dt">${esc(title)}</h1>`:''}${cleanHTML()}</body></html>`;
  const f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.append(f);
  f.onload=async()=>{try{await f.contentDocument.fonts.ready}catch{}const old=document.title;document.title=title;f.contentWindow.focus();f.contentWindow.print();document.title=old;setTimeout(()=>f.remove(),60000)};
  f.srcdoc=html}
async function exportDOCX(o){const P={A4:[11906,16838],A5:[8391,11906],letter:[12240,15840]}[o.size];let[w,h]=P;if(o.ori==='landscape')[w,h]=[h,w];const m=Math.round(o.mar*56.7),title=fname();
  const chunk=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${contentCSS(o.fs)}</style></head><body>${o.ti?`<h1 class="dt">${esc(title)}</h1>`:''}${cleanHTML().replace(/<br>/g,'<br/>').replace(/<hr>/g,'<hr/>')}</body></html>`;
  const z=new JSZip();
  z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/afchunk.htm" ContentType="text/html"/></Types>');
  z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="htmlChunk" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk.htm"/></Relationships>');
  z.file('word/afchunk.htm',chunk);
  z.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:altChunk r:id="htmlChunk"/><w:sectPr><w:pgSz w:w="${w}" w:h="${h}"${o.ori==='landscape'?' w:orient="landscape"':''}/><w:pgMar w:top="${m}" w:right="${m}" w:bottom="${m}" w:left="${m}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  dl(await z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),title+'.docx')}
function exportMD(){const td=new TurndownService({headingStyle:'atx',codeBlockStyle:'fenced',hr:'---',bulletListMarker:'-'});
  if(window.turndownPluginGfm)td.use(turndownPluginGfm.gfm);
  td.addRule('check',{filter:n=>n.nodeName==='LI'&&n.parentNode.classList&&n.parentNode.classList.contains('check'),replacement:(c,n)=>`- [${n.dataset.done==='1'?'x':' '}] ${c.trim()}\n`});
  td.addRule('u',{filter:['u'],replacement:c=>`<u>${c}</u>`});td.addRule('supsub',{filter:['sup','sub'],replacement:(c,n)=>`<${n.nodeName.toLowerCase()}>${c}</${n.nodeName.toLowerCase()}>`});
  dl(new Blob([`# ${fname()}\n\n`+td.turndown(cleanHTML())+'\n'],{type:'text/markdown'}),fname()+'.md')}
function exportTXT(){dl(new Blob([fname()+'\n\n'+ed.innerText.replace(/\n{3,}/g,'\n\n').trim()+'\n'],{type:'text/plain'}),fname()+'.txt')}
const setPdfUI=()=>{const v=document.querySelector('[name=ef]:checked').value;$('#pdfOpts').hidden=!(v==='pdf'||v==='docx');$('#pdfNote').hidden=v!=='pdf';$('#ePn').parentNode.hidden=v!=='pdf'};
$('#fmtSeg').addEventListener('change',setPdfUI);
$('#doExp').onclick=async()=>{if(saveT)await save();const v=document.querySelector('[name=ef]:checked').value,o=opts();ls.set('exp',o);$('#exp').close();
  try{if(v==='pdf')exportPDF(o);if(v==='docx')await exportDOCX(o);if(v==='md')exportMD();if(v==='txt')exportTXT();if(v!=='pdf')toast('Downloaded '+v.toUpperCase())}catch(err){toast('Export failed: '+err.message)}};
(()=>{const o=ls.get('exp',null);if(o){$('#eSize').value=o.size;$('#eOri').value=o.ori;$('#eMar').value=o.mar;$('#eFs').value=o.fs;$('#ePn').checked=o.pn;$('#eTi').checked=o.ti}})();

/* ---------- share (encrypted link) ---------- */
const te=new TextEncoder(),tdc=new TextDecoder();
function b64(u){let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unb64(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
const pipe=(u,t)=>new Response(new Blob([u]).stream().pipeThrough(t)).arrayBuffer().then(b=>new Uint8Array(b));
async function derive(pw,salt){const k=await crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function seal(obj,pw){const data=await pipe(te.encode(JSON.stringify(obj)),new CompressionStream('deflate-raw'));
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));let key,raw=null;
  if(pw)key=await derive(pw,salt);else{raw=crypto.getRandomValues(new Uint8Array(32));key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt'])}
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data));const out=new Uint8Array(29+ct.length);out[0]=pw?1:0;out.set(salt,1);out.set(iv,17);out.set(ct,29);
  return b64(out)+(raw?'.'+b64(raw):'')}
async function open_(tok,pw){const[a,r]=tok.split('.'),u=unb64(a),salt=u.slice(1,17),iv=u.slice(17,29),ct=u.slice(29);
  const key=u[0]?await derive(pw,salt):await crypto.subtle.importKey('raw',unb64(r),'AES-GCM',false,['decrypt']);
  const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct));return JSON.parse(tdc.decode(await pipe(pt,new DecompressionStream('deflate-raw'))))}
$('#doShare').onclick=async()=>{if(!ed.innerText.trim())return toast('Write something first');ensureDoc();if(saveT)await save();
  const ex=$('#shExp').value?new Date($('#shExp').value+'T23:59:59').getTime():0;
  const tok=await seal({t:cur.title,h:cleanHTML(),e:ex,s:{theme:S.theme,bg:S.bg,ink:S.ink,op:S.op,ui:S.ui,font:S.font,size:S.size,lh:S.lh,width:S.width}},$('#shPw').value);
  $('#shUrl').value=location.origin+location.pathname+'#s='+tok;$('#shOut').hidden=false;$('#shUrl').select()};
$('#shCopy').onclick=()=>{navigator.clipboard.writeText($('#shUrl').value).then(()=>toast('Link copied'),()=>{$('#shUrl').select();toast('Press Ctrl+C to copy')})};
DOMPurify.addHook('afterSanitizeAttributes',n=>{if(n.tagName==='A'){const h=n.getAttribute('href')||'';if(!/^(https?:|mailto:)/i.test(h))n.removeAttribute('href');n.setAttribute('target','_blank');n.setAttribute('rel','noopener noreferrer nofollow')}});
async function reader(tok){document.body.classList.add('reading');const R=$('#reader');
  const show=d=>{if(d.e&&Date.now()>d.e){R.innerHTML='<div class="wrap"><p>This shared link has expired.</p></div>';return}
    if(d.s){S={...S,...d.s,cursor:'native'};applyS()}document.title=d.t;
    R.innerHTML=`<div class="wrap doc"><h1 class="t">${esc(d.t)}</h1><div style="opacity:var(--op)">${DOMPurify.sanitize(d.h,{ADD_ATTR:['data-done']})}</div><p class="foot">Read-only copy · <a href="${location.pathname}">write your own</a> · <a href="legal.html">privacy &amp; terms</a></p></div>`};
  if(unb64(tok.split('.')[0])[0]){R.innerHTML=`<form class="wrap" id="pf"><p>This document is password protected.</p><div class="row"><input id="rpw" class="field" type="password" placeholder="Password" style="flex:1" autofocus><button class="btn">Open</button></div><p id="perr" class="note"></p></form>`;
    $('#pf').onsubmit=async e=>{e.preventDefault();try{show(await open_(tok,$('#rpw').value))}catch{$('#perr').textContent='Wrong password.'}}}
  else{try{show(await open_(tok))}catch{R.innerHTML='<div class="wrap"><p>This link is damaged or incomplete.</p></div>'}}}


/* ---------- spelling & grammar lights ---------- */
const CHECK_SRC=String.raw`importScripts('${location.origin}/vendor/typo.js');
let t,sorted;const B='https://cdn.jsdelivr.net/npm/dictionary-en@4.0.0/';
Promise.all(['index.aff','index.dic'].map(f=>fetch(B+f).then(r=>r.text()))).then(([a,d])=>{t=new Typo('en_US',a,d);sorted=Object.keys(t.dictionaryTable).map(w=>w.toLowerCase()).sort();postMessage({ready:1})});
const ok=w=>t.check(w)||t.check(w.toLowerCase())||/^\d/.test(w);
function pre(p){p=p.toLowerCase();let lo=0,hi=sorted.length;while(lo<hi){const m=(lo+hi)>>1;if(sorted[m]<p)lo=m+1;else hi=m}return lo<sorted.length&&sorted[lo].startsWith(p)}
const RULES=[[/\b(\w+)\s+\1\b/i,m=>'repeated word “'+m[1]+'”'],[/(^|[.!?]\s+)[a-z]/,()=>'sentence should start with a capital letter'],[/(^|\s)i(\s|'|$)/,()=>'“i” should be “I”'],
[/\ba\s+(?!u|one|eu|once)[aeio]\w*/i,m=>'use “an” before “'+m[0].split(/\s+/)[1]+'”'],[/\ban\s+(?![aeiou]|h(our|onest|onor|eir))[a-z]\w*/i,m=>'use “a” before “'+m[0].split(/\s+/)[1]+'”'],
[/\s[,.!?;:]/,()=>'remove the space before punctuation'],[/[,;!?][A-Za-z]/,()=>'add a space after punctuation']];
onmessage=e=>{if(!t)return;const{id,text}=e.data;const m=text.match(/[A-Za-z']+$/),part=m?m[0]:'',done=text.slice(0,text.length-part.length);
let bad=null;const re=/[A-Za-z][A-Za-z']*/g;let x;
while((x=re.exec(done))){let w=x[0].replace(/'s$|'$/,'');if(w.length<2&&!/^[aAI]$/.test(w)){if(!/^[aI]$/i.test(w))bad='spelling: “'+w+'”';continue}
 if(ok(w))continue;const before=done.slice(0,x.index).trimEnd();const start=!before||/[.!?]$/.test(before);if(/^[A-Z]/.test(w)&&!start)continue;if(/^[A-Z]{2,}$/.test(w))continue;bad='spelling: “'+w+'”'}
if(!bad)for(const[r,f]of RULES){const g=done.match(r);if(g){bad=f(g);break}}
let state='g',msg='';if(bad){state='r';msg=bad}else if(part.length>=2&&!pre(part.replace(/'.*$/,''))&&!ok(part)){state='y';msg='check spelling: “'+part+'”'}
postMessage({id,state,msg})}`;
let chkW=null,chkId=0,chkT=null,chkReady=false;
try{chkW=new Worker(URL.createObjectURL(new Blob([CHECK_SRC],{type:'text/javascript'})));
  chkW.onmessage=e=>{if(e.data.ready){chkReady=true;return runCheck()}if(e.data.id!==chkId)return;setLights(e.data.state,e.data.msg)};}catch{}
function setLights(st,msg){document.querySelectorAll('#lamp .d').forEach(d=>d.classList.toggle('on',d.classList.contains(st)));
  $('#lamp').title=msg?msg[0].toUpperCase()+msg.slice(1):(st==='g'?'Looks good':'Desk lamp on/off');$('#chk').textContent=msg?' · '+msg:''}
function textBeforeCaret(){const s=getSelection();if(!s.rangeCount||!ed.contains(s.anchorNode))return null;let n=s.anchorNode;n=n.nodeType===3?n.parentNode:n;
  if(n.closest('pre,code'))return '';const b=n.closest('p,li,h1,h2,h3,blockquote,td,th')||ed;const r=document.createRange();r.setStart(b,0);r.setEnd(s.anchorNode,s.anchorOffset);return r.toString().replace(/ /g,' ')}
function runCheck(){if(!S.check||!chkW||!chkReady)return;if(S.bangla)return setLights('g','');const t=textBeforeCaret();if(t==null)return;if(!t.trim())return setLights('g','');chkW.postMessage({id:++chkId,text:t})}
const queueCheck=()=>{clearTimeout(chkT);chkT=setTimeout(runCheck,90)};
ed.addEventListener('input',queueCheck);document.addEventListener('selectionchange',queueCheck);


/* current paragraph + install */
function markNow(){const s=getSelection();if(!s.rangeCount||!ed.contains(s.anchorNode))return;let n=s.anchorNode;if(n.nodeType===3)n=n.parentNode;while(n&&n.parentNode!==ed)n=n.parentNode;if(!n||n===ed)return;const o=ed.querySelector(':scope>.now');if(o!==n){o&&o.classList.remove('now');n.classList.add('now')}}
document.addEventListener('selectionchange',markNow);
let instEvt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();instEvt=e;$('#bInstall').hidden=false});
$('#bInstall').onclick=async()=>{if(!instEvt)return;instEvt.prompt();await instEvt.userChoice;instEvt=null;$('#bInstall').hidden=true};
window.addEventListener('appinstalled',()=>{$('#bInstall').hidden=true;toast('Po Notestack installed')});

/* ---------- boot ---------- */
(async()=>{applyS();
  const h=location.hash;if(h.startsWith('#s='))return reader(h.slice(3));
  await DB.open();docs=await DB.all();window.twBooted=true;setTimeout(drawCursor,0);
  // purge trash older than 30 days
  const old=docs.filter(d=>d.trashed&&Date.now()-d.updated>2592e6);old.forEach(d=>DB.del(d.id));docs=docs.filter(d=>!old.includes(d));
  const last=docs.find(d=>d.id===ls.get('last')&&!d.trashed&&!d.archived);
  if(last)openDoc(last);else{blank();ed.focus();caretEnd();count();requestAnimationFrame(drawCursor)}

  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
window.addEventListener('hashchange',()=>location.reload());
