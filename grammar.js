/* Po Notestack — sentence & grammar suggestions.
   Offline: rule + dictionary engine inside the spell-check worker (app.js).
   Online (optional, Settings): LanguageTool for deeper checks; falls back to offline instantly. */
(()=>{
const $=s=>document.querySelector(s),ed=$('#ed');
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const on=()=>S.gsug!==false&&!S.bangla&&!document.body.classList.contains('reading');

/* ---------- engines ---------- */
let fid=0;const pend=new Map(),offCache=new Map(),ltCache=new Map();
if(typeof chkW!=='undefined'&&chkW)chkW.addEventListener('message',e=>{const d=e.data;if(d&&d.fixId&&pend.has(d.fixId)){pend.get(d.fixId)(d);pend.delete(d.fixId)}});
function offline(text){if(offCache.has(text))return Promise.resolve(offCache.get(text));
  if(typeof chkW==='undefined'||!chkW)return Promise.resolve(null);
  return new Promise(res=>{const id=++fid;pend.set(id,d=>{const r={text:d.text,why:d.why||[]};offCache.set(text,r);res(r)});chkW.postMessage({fix:1,fixId:id,text});
    setTimeout(()=>{if(pend.has(id)){pend.delete(id);res(null)}},5000)})}
async function online(text){if(!S.ltOnline||!navigator.onLine)return null;if(ltCache.has(text))return ltCache.get(text);
  try{const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),3500);
    const r=await fetch('https://api.languagetool.org/v2/check',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({text,language:'en-US',level:'default'}),signal:ctl.signal});
    clearTimeout(to);if(!r.ok)return null;const j=await r.json();let out='',pos=0;const why=[];
    for(const m of (j.matches||[]).sort((a,b)=>a.offset-b.offset)){const rep=m.replacements&&m.replacements[0]&&m.replacements[0].value;if(rep==null||m.offset<pos)continue;
      out+=text.slice(pos,m.offset)+rep;pos=m.offset+m.length;const w=m.shortMessage||m.message||'';if(w&&!why.includes(w))why.push(w)}
    out+=text.slice(pos);const res={text:out,why:why.slice(0,4)};ltCache.set(text,res);return res}catch{return null}}
async function correct(text){const a=await offline(text);let best=a&&a.text!==text?a:null,src='offline';
  const b=await online(best?best.text:text);if(b&&b.text!==(best?best.text:text)){best={text:b.text,why:[...new Set([...(best?best.why:[]),...b.why])].slice(0,4)};src=a&&a.text!==text?'offline + LanguageTool':'LanguageTool'}
  return best?{...best,src}:null}

/* ---------- text helpers ---------- */
const BLOCK='p,li,h1,h2,h3,blockquote,td,th';
function blockOf(n){n=n&&(n.nodeType===3?n.parentNode:n);if(!n||!ed.contains(n)||n===ed)return null;if(n.closest('pre,code,table.sheet'))return null;return n.closest(BLOCK)}
function sentences(text){const out=[],re=/[^.!?]+(?:[.!?]+["')\]]*|$)/g;let m;
  while((m=re.exec(text))){if(!m[0]){re.lastIndex++;continue}const lead=m[0].length-m[0].trimStart().length,body=m[0].trim();if(!body)continue;
    out.push({s:m.index+lead,e:m.index+lead+body.length,t:body,done:/[.!?]["')\]]*$/.test(body)})}
  return out}
function rangeAt(block,a,b){const w=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);let n,acc=0,sN=null,sO=0,eN=null,eO=0,last=null;
  while((n=w.nextNode())){const L=n.data.length;if(!sN&&a<=acc+L){sN=n;sO=a-acc}if(!eN&&b<=acc+L){eN=n;eO=b-acc}acc+=L;last=n;if(sN&&eN)break}
  const r=document.createRange();if(!sN){if(last){r.setStart(last,last.data.length)}else r.setStart(block,0)}else r.setStart(sN,sO);
  if(!eN){if(last)r.setEnd(last,last.data.length);else r.setEnd(block,0)}else r.setEnd(eN,eO);return r}
function caretIn(block){const s=getSelection();if(!s.rangeCount||!block.contains(s.anchorNode))return -1;const r=document.createRange();r.setStart(block,0);r.setEnd(s.anchorNode,s.anchorOffset);return r.toString().length}
const tok=s=>s.match(/\s+|[A-Za-z0-9À-ɏ'’-]+|[^\sA-Za-z0-9]/g)||[];
function diff(a,b){const A=tok(a),B=tok(b),n=A.length,m=B.length;if(n*m>40000)return null;const L=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=A[i]===B[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  const ops=[];let i=0,j=0;while(i<n||j<m){if(i<n&&j<m&&A[i]===B[j]){ops.push(['=',A[i]]);i++;j++}else if(j<m&&(i===n||L[i][j+1]>=L[i+1][j])){ops.push(['+',B[j]]);j++}else{ops.push(['-',A[i]]);i++}}
  return ops}
function hunks(ops){const H=[];let pos=0,h=null;for(const[o,t]of ops){if(o==='='){if(h){H.push(h);h=null}pos+=t.length}else{if(!h)h={as:pos,ae:pos,rep:''};if(o==='-'){h.ae+=t.length;pos+=t.length}else h.rep+=t}}if(h)H.push(h);return H}

/* ---------- card ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
#gsug{position:fixed;z-index:8;width:min(560px,calc(100vw - 24px));background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:10px;box-shadow:0 12px 34px rgba(0,0,0,.22);padding:10px 12px;font:13px/1.55 var(--font);transition:opacity .2s}
#gsug[hidden]{display:none}#gsug .h{display:flex;gap:8px;align-items:center;font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.75}#gsug .h span{margin-left:auto;text-transform:none;letter-spacing:0;font-size:10px;opacity:.8}
#gsTxt{font-size:15px;margin:6px 0 4px;word-break:break-word}#gsTxt del{color:#b3261e;opacity:.75}#gsTxt ins{text-decoration:none;background:rgba(46,160,90,.18);color:inherit;border-radius:3px;padding:0 2px;font-weight:700}
#gsWhy{font-size:11px;opacity:.7}#gsug .b{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
#gsug button{font:inherit;font-size:12px;border:1px solid var(--line);background:none;color:inherit;border-radius:6px;padding:5px 10px;cursor:pointer}#gsug button.pri{background:var(--ink);color:var(--panel);border-color:var(--ink)}
#gsug kbd{font:inherit;font-size:10px;opacity:.7;margin-left:4px}
body.typing #gsug{opacity:.55}body.reading #gsug,body.gaming #gsug{display:none!important}
</style>`);
document.body.insertAdjacentHTML('beforeend',`<div id="gsug" role="dialog" aria-live="polite" aria-label="Writing suggestion" hidden>
<div class="h">✎ Suggested correction<span id="gsSrc"></span></div><div id="gsTxt"></div><div id="gsWhy"></div>
<div class="b"><button class="pri" id="gsApply">Apply<kbd>Alt+Enter</kbd></button><button id="gsIgn">Ignore<kbd>Esc</kbd></button><button id="gsNext" hidden>Next</button></div></div>`);
const card=$('#gsug');let cur=null,ignored=new Set(),scan=null;
function place(){const rail=$('#rail'),lamp=$('#lamp');if(!rail)return;const ry=rail.getBoundingClientRect().top,lx=lamp?lamp.getBoundingClientRect().left+24:innerWidth/2;
  const w=card.offsetWidth||400;card.style.left=Math.max(12,Math.min(innerWidth-w-12,lx-w/2))+'px';
  const top=ry+26;card.style.top=(top+card.offsetHeight>innerHeight-8?Math.max(56,ry-card.offsetHeight-40):top)+'px'}
function show(c){cur=c;const ops=c.ops;$('#gsTxt').innerHTML=ops.map(([o,t])=>o==='='?esc(t):o==='-'?(t.trim()?`<del>${esc(t)}</del>`:''):`<ins>${esc(t)}</ins>`).join('');
  $('#gsWhy').textContent=c.why.length?c.why.join(' · '):'';$('#gsSrc').textContent=c.src;$('#gsNext').hidden=!scan;card.hidden=false;place()}
function hide(){card.hidden=true;cur=null}
addEventListener('resize',()=>!card.hidden&&place());$('#stage').addEventListener('scroll',()=>!card.hidden&&place(),{passive:true});

async function check(block,list){for(const sn of list){if(sn.t.length<4||ignored.has(sn.t)||/[ঀ-৿]/.test(sn.t))continue;
    const r=await correct(sn.t);if(!r||r.text===sn.t)continue;if(!block.isConnected||block.textContent.slice(sn.s,sn.e)!==sn.t)continue;
    const ops=diff(sn.t,r.text);if(!ops)continue;show({block,s:sn.s,e:sn.e,t:sn.t,fixed:r.text,ops,hunks:hunks(ops),why:r.why,src:r.src});return true}
  return false}
async function checkCaret(idle){if(!on()||scan)return;const s=getSelection();const b=s.rangeCount&&blockOf(s.anchorNode);if(!b)return;
  const text=b.textContent,c=caretIn(b),all=sentences(text);
  const list=all.filter(x=>x.e<=c&&x.done).slice(-2).reverse();
  if(idle){const curS=all.find(x=>x.s<=c&&c<=x.e+1);if(curS&&!list.includes(curS)&&curS.t.split(/\s+/).length>=4)list.unshift(curS)}
  const found=await check(b,list);if(!found&&cur&&(!cur.block.isConnected||cur.block.textContent.slice(cur.s,cur.e)!==cur.t))hide()}

function apply(){const c=cur;if(!c)return;hide();if(!c.block.isConnected||c.block.textContent.slice(c.s,c.e)!==c.t)return;
  const caret=caretIn(c.block);ed.focus();const sel=getSelection();
  for(const h of c.hunks.slice().reverse()){const r=rangeAt(c.block,c.s+h.as,c.s+h.ae);sel.removeAllRanges();sel.addRange(r);
    if(h.rep)document.execCommand('insertText',false,h.rep);else document.execCommand('delete')}
  const d=c.fixed.length-c.t.length,pos=caret<0||caret>=c.e?(caret<0?c.s+c.fixed.length:caret+d):Math.min(caret,c.s+c.fixed.length);
  const r=rangeAt(c.block,pos,pos);sel.removeAllRanges();sel.addRange(r);ignored.add(c.fixed);
  if(scan)setTimeout(nextScan,60)}
function ignore(){if(cur)ignored.add(cur.t);hide();if(scan)nextScan()}
$('#gsApply').addEventListener('mousedown',e=>e.preventDefault());$('#gsApply').onclick=apply;
$('#gsIgn').addEventListener('mousedown',e=>e.preventDefault());$('#gsIgn').onclick=ignore;
$('#gsNext').onclick=()=>{if(cur)ignored.add(cur.t);hide();nextScan()};

/* whole-document check */
async function nextScan(){if(!scan)return;const blocks=[...ed.querySelectorAll(BLOCK)].filter(b=>blockOf(b.firstChild||b)===b||blockOf(b)===b);
  for(const b of blocks){if(!b.isConnected)continue;if(await check(b,sentences(b.textContent)))return}
  scan=null;hide();toast('Document check finished')}
window.twCheckDoc=()=>{if(S.bangla){toast('Switch to English typing to check grammar');return}scan=true;nextScan()};

/* triggers */
let tm;
ed.addEventListener('input',e=>{if(!on())return;clearTimeout(tm);const d=e.data||'';
  if(e.inputType==='insertParagraph'){tm=setTimeout(()=>{const s=getSelection(),b=s.rangeCount&&blockOf(s.anchorNode),p=b&&b.previousElementSibling;if(p&&p.matches(BLOCK))check(p,sentences(p.textContent).slice(-2).reverse())},250);return}
  tm=setTimeout(()=>checkCaret(!/[.!?]$/.test(d)),/[.!?]$/.test(d)?300:1500)});
document.addEventListener('keydown',e=>{if(card.hidden)return;
  if(e.altKey&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();apply()}
  else if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&($('#bnSug')?$('#bnSug').hidden:true)){e.preventDefault();e.stopImmediatePropagation();ignore()}},true);

/* toolbar button */
const fmt=$('#fmt');if(fmt){fmt.insertAdjacentHTML('beforeend','<button data-g="1" title="Check grammar and spelling in the whole document">✓ check</button>');
  fmt.addEventListener('mousedown',e=>{if(e.target.closest('[data-g]'))e.preventDefault()});fmt.addEventListener('click',e=>{if(e.target.closest('[data-g]')){e.stopPropagation();twCheckDoc()}})}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='k'){e.preventDefault();twCheckDoc()}});
})();
