/* Po Notestack — Word-style tools: fonts, spacing, images, tables, sheets with formulas, find & replace */
(()=>{
const $=s=>document.querySelector(s),ed=$('#ed'),fmt=$('#fmt');
const fire=()=>ed.dispatchEvent(new Event('input'));
const sel=()=>getSelection();
const inEd=n=>n&&ed.contains(n);
const cellOf=n=>{n=n&&(n.nodeType===1?n:n.parentElement);const c=n&&n.closest('td,th');return c&&inEd(c)?c:null};

/* ---------- extra toolbar ---------- */
const FONTS=[['Courier Prime','Typewriter'],['Special Elite','Old type'],['IBM Plex Mono','Mono'],['Georgia','Georgia'],['Times New Roman','Times'],['Arial','Arial'],['Tiro Bangla','বাংলা']];
const SIZES=[12,14,16,18,20,24,28,32,40,48];
fmt.insertAdjacentHTML('beforeend',`<span class="sep"></span>
<select id="oFont" title="Font"><option value="">Font</option>${FONTS.map(([f,l])=>`<option value="${f}">${l}</option>`).join('')}</select>
<select id="oSize" title="Text size"><option value="">Size</option>${SIZES.map(s=>`<option>${s}</option>`).join('')}</select>
<select id="oLine" title="Line spacing"><option value="">Spacing</option><option>1</option><option>1.15</option><option>1.5</option><option>2</option></select>
<button data-o="outdent" title="Decrease indent">⇠</button><button data-o="indent" title="Increase indent">⇢</button><span class="sep"></span>
<button data-o="sheet" title="Insert sheet (spreadsheet with formulas)">⊞ sheet</button><button data-o="image" title="Insert picture">▣ image</button><button data-o="pbreak" title="Page break">⤓ page</button><button data-o="date" title="Insert date">date</button><button data-o="find" title="Find & replace (Ctrl+H)">find</button>
<input type="file" id="oImg" accept="image/*" hidden>`);

let saved=null;
const keep=()=>{const s=sel();if(s.rangeCount&&inEd(s.anchorNode))saved=s.getRangeAt(0).cloneRange()};
const back=()=>{ed.focus();if(saved){const s=sel();s.removeAllRanges();s.addRange(saved)}};
document.addEventListener('selectionchange',keep);
const css=on=>{try{document.execCommand('styleWithCSS',false,on)}catch{}};

$('#oFont').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;back();css(true);document.execCommand('fontName',false,v);css(false);fire()};
$('#oSize').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;back();css(false);document.execCommand('fontSize',false,'7');
  ed.querySelectorAll('font[size="7"]').forEach(f=>{const s=document.createElement('span');s.style.fontSize=v+'px';while(f.firstChild)s.appendChild(f.firstChild);f.replaceWith(s)});fire()};
$('#oLine').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;back();blocks().forEach(b=>b.style.lineHeight=v);fire()};
function blocks(){const s=sel();if(!s.rangeCount)return[];const r=s.getRangeAt(0),out=[];
  const B='p,h1,h2,h3,li,blockquote,pre,div';
  ed.querySelectorAll(B).forEach(b=>{if(r.intersectsNode(b)&&!b.querySelector(B))out.push(b)});
  if(!out.length){const n=r.startContainer,el=n.nodeType===1?n:n.parentElement,b=el.closest(B);if(b&&inEd(b))out.push(b)}
  return out}

fmt.addEventListener('mousedown',e=>{if(e.target.closest('button[data-o]'))e.preventDefault()});
fmt.addEventListener('click',e=>{const b=e.target.closest('button[data-o]');if(!b)return;e.stopPropagation();const o=b.dataset.o;
  if(o==='image'){keep();$('#oImg').click();return}
  if(o==='find'){openFind();return}
  back();
  if(o==='indent'||o==='outdent')document.execCommand(o);
  if(o==='sheet')insertSheet();
  if(o==='pbreak')document.execCommand('insertHTML',false,'<hr class="pb"><p><br></p>');
  if(o==='date')document.execCommand('insertText',false,new Date().toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'}));
  fire()});

/* ---------- images ---------- */
$('#oImg').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f||!/^image\//.test(f.type))return;
  try{const url=await shrink(f);back();document.execCommand('insertHTML',false,`<img src="${url}" alt="" style="width:100%">`);fire()}catch{alert('Could not read that picture.')}};
function shrink(f){return new Promise((ok,no)=>{const u=URL.createObjectURL(f),im=new Image();
  im.onload=()=>{const k=Math.min(1,1400/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
    c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);
    ok(f.type==='image/png'&&f.size<400000?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.85))};
  im.onerror=()=>{URL.revokeObjectURL(u);no()};im.src=u})}

/* ---------- context bar for tables, sheets and images ---------- */
document.body.insertAdjacentHTML('beforeend',`<div id="ctx" role="toolbar" aria-label="Table tools" hidden>
<span id="ctxT"><b id="cName"></b><input id="fx" placeholder="value or =SUM(A1:A3)" spellcheck="false" autocomplete="off">
<button data-t="rowUp" title="Insert row above">+row↑</button><button data-t="rowDown" title="Insert row below">+row↓</button><button data-t="colL" title="Insert column left">+col←</button><button data-t="colR" title="Insert column right">+col→</button><button data-t="delRow" title="Delete row">−row</button><button data-t="delCol" title="Delete column">−col</button><button data-t="head" title="Header row on/off">header</button><button data-t="sort" title="Sort rows by this column">sort</button><button data-t="delTable" title="Delete table">delete</button></span>
<span id="ctxI">picture <button data-i="25">25%</button><button data-i="50">50%</button><button data-i="75">75%</button><button data-i="100">100%</button><button data-i="left" title="Float left">◧</button><button data-i="center" title="Center">▣</button><button data-i="right" title="Float right">◨</button><button data-i="del">delete</button></span></div>`);
const ctx=$('#ctx'),fx=$('#fx');
let cell=null,img=null,leaving=null;
ed.addEventListener('click',e=>{const t=e.target;if(t.tagName==='IMG'){img=t;cell=null;ed.querySelectorAll('img.on').forEach(i=>i.classList.remove('on'));t.classList.add('on');show()}});
document.addEventListener('selectionchange',()=>{if(document.activeElement===fx)return;const s=sel();if(!s.rangeCount)return;
  const c=cellOf(s.anchorNode);
  if(c!==cell){if(cell)commit(cell);cell=c}
  if(c){img=null;ed.querySelectorAll('img.on').forEach(i=>i.classList.remove('on'))}
  else if(img&&!(s.anchorNode&&s.anchorNode.contains&&s.anchorNode.contains(img)))img=img&&document.activeElement===ed&&s.isCollapsed?null:img;
  show()});
document.addEventListener('mousedown',e=>{if(!ctx.contains(e.target)&&e.target.tagName!=='IMG'&&img){img.classList.remove('on');img=null;show()}});
function show(){const t=cell&&cell.closest('table');
  if(!t&&!img){ctx.hidden=true;return}
  ctx.hidden=false;$('#ctxT').hidden=!t;$('#ctxI').hidden=!img;
  const box=(t||img).getBoundingClientRect();
  ctx.style.top=Math.max(52,box.top-ctx.offsetHeight-8)+'px';
  if(t){$('#cName').textContent=t.classList.contains('sheet')?addr(cell):'';fx.hidden=!t.classList.contains('sheet');
    if(t.classList.contains('sheet'))fx.value=cell.dataset.f||cell.textContent}}
window.addEventListener('scroll',()=>!ctx.hidden&&show(),true);
ctx.addEventListener('mousedown',e=>{if(e.target.tagName==='BUTTON')e.preventDefault()});
ctx.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.i&&img){const v=b.dataset.i;
    if(/^\d+$/.test(v))img.style.width=v+'%';
    else if(v==='del'){img.remove();img=null}
    else{img.style.float=v==='center'?'':v;img.style.display=v==='center'?'block':'';img.style.margin=v==='center'?'0 auto .8em':v==='left'?'0 1em .5em 0':'0 0 .5em 1em'}
    fire();show();return}
  if(b.dataset.t&&cell)tableOp(b.dataset.t)});

/* ---------- table operations ---------- */
function grid(t){return[...t.rows]}
function tableOp(op){const t=cell.closest('table'),row=cell.parentElement,ci=cell.cellIndex,rows=grid(t);
  const mk=(tag,src)=>{const c=document.createElement(tag);c.innerHTML='<br>';return c};
  if(op==='rowUp'||op==='rowDown'){const r=document.createElement('tr');for(let i=0;i<row.cells.length;i++)r.appendChild(mk('td'));op==='rowUp'&&row.querySelector('th')?row.after(r):row[op==='rowUp'?'before':'after'](r);place(r.cells[ci])}
  if(op==='colL'||op==='colR'){rows.forEach(r=>{const ref=r.cells[Math.min(ci,r.cells.length-1)];const c=mk(ref&&ref.tagName==='TH'?'th':'td');ref?ref[op==='colL'?'before':'after'](c):r.appendChild(c)});place(row.cells[op==='colL'?ci:ci+1])}
  if(op==='delRow'){if(rows.length<2)return tableOp('delTable');const n=row.nextElementSibling||row.previousElementSibling;row.remove();place(n.cells[Math.min(ci,n.cells.length-1)])}
  if(op==='delCol'){if(row.cells.length<2)return tableOp('delTable');rows.forEach(r=>r.cells[ci]&&r.cells[ci].remove());place(row.cells[Math.min(ci,row.cells.length-1)])}
  if(op==='delTable'){if(!confirm('Delete this table?'))return;const p=document.createElement('p');p.innerHTML='<br>';t.replaceWith(p);cell=null;place(p)}
  if(op==='head'){const r0=rows[0];[...r0.cells].forEach(c=>{const n=document.createElement(c.tagName==='TH'?'td':'th');n.innerHTML=c.innerHTML;if(c.dataset.f)n.dataset.f=c.dataset.f;c.replaceWith(n)});place(rows[0].cells[0])}
  if(op==='sort'){const head=rows[0].querySelector('th')?1:0,body=rows.slice(head),num=body.every(r=>!r.cells[ci]||val(r.cells[ci])!==null||!r.cells[ci].textContent.trim());
    const asc=t.dataset.sort!==ci+'a';t.dataset.sort=ci+(asc?'a':'d');
    body.sort((a,b)=>{const x=a.cells[ci],y=b.cells[ci];let r=num?(val(x)||0)-(val(y)||0):(x?x.textContent:'').localeCompare(y?y.textContent:'',undefined,{numeric:true});return asc?r:-r});
    const parent=rows[rows.length-1].parentElement;body.forEach(r=>parent.appendChild(r))}
  recalc();fire();show()}
function place(c){if(!c)return;const r=document.createRange();r.selectNodeContents(c);r.collapse(true);const s=sel();s.removeAllRanges();s.addRange(r);ed.focus()}

/* Tab / Shift+Tab move between cells; Tab in the last cell adds a row */
document.addEventListener('keydown',e=>{
  if(e.key==='Tab'&&document.activeElement===ed){const c=cellOf(sel().anchorNode);if(!c)return;e.preventDefault();e.stopImmediatePropagation();
    const cs=[...c.closest('table').querySelectorAll('td,th')],i=cs.indexOf(c);
    if(e.shiftKey){place(cs[Math.max(0,i-1)]);return}
    if(i===cs.length-1){cell=c;tableOp('rowDown');return}
    place(cs[i+1]);return}
  const m=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(m&&!e.shiftKey&&(k==='f'||k==='h')&&!document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();openFind()}
},true);

/* ---------- sheets ---------- */
function insertSheet(){const v=prompt('Sheet size: rows × columns','6x4');if(!v)return;const[r,c]=v.split(/[x×*, ]+/).map(n=>Math.min(60,Math.max(1,parseInt(n)||3)));
  let h='<table class="sheet"><tbody>';for(let i=0;i<r;i++)h+='<tr>'+'<td><br></td>'.repeat(c||3)+'</tr>';
  document.execCommand('insertHTML',false,h+'</tbody></table><p><br></p>')}
const colName=i=>{let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26}return s};
const colIdx=s=>[...s].reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0)-1;
function addr(c){return colName(c.cellIndex)+(c.parentElement.rowIndex+1)}
function val(c){if(!c)return null;const t=c.textContent.replace(/[,\s ]/g,'').replace(/%$/,'');if(t===''||isNaN(t))return null;return+t}
function commit(c){const t=c.closest('table.sheet');if(!t||!t.isConnected)return;const txt=c.textContent.trim();
  if(txt.startsWith('=')&&txt.length>1){c.dataset.f=txt;recalc();fire()}
  else if(c.dataset.f&&txt!==c.dataset.v){delete c.dataset.f;delete c.dataset.v;recalc();fire()}}
fx.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();if(!cell)return;const v=fx.value.trim();
    if(v.startsWith('=')&&v.length>1)cell.dataset.f=v;else{delete cell.dataset.f;delete cell.dataset.v;cell.textContent=v;if(!v)cell.innerHTML='<br>'}
    recalc();fire();const cs=[...cell.closest('table').querySelectorAll('td,th')];place(cs[cs.indexOf(cell)+(e.key==='Tab'?1:cell.parentElement.cells.length)]||cell)}
  if(e.key==='Escape'){place(cell)}});

function recalc(){ed.querySelectorAll('table.sheet').forEach(t=>{const rows=[...t.rows],memo=new Map(),busy=new Set();
  const at=(r,c)=>rows[r]&&rows[r].cells[c];
  const get=(r,c)=>{const cl=at(r,c);if(!cl)return 0;if(!cl.dataset.f)return val(cl);const k=r+':'+c;if(memo.has(k))return memo.get(k);
    if(busy.has(k))throw Error('#CYCLE');busy.add(k);let v;try{v=evaluate(cl.dataset.f.slice(1),get)}finally{busy.delete(k)}memo.set(k,v);return v};
  rows.forEach((row,r)=>[...row.cells].forEach((cl,c)=>{if(!cl.dataset.f)return;let out;
    try{const v=get(r,c);out=typeof v==='number'?(Number.isFinite(v)?+v.toFixed(10)+'':'#DIV/0!'):String(v)}catch(err){out=err.message.startsWith('#')?err.message:'#ERROR'}
    cl.dataset.v=out;if(cl.textContent!==out&&cl!==cellOrNull())cl.textContent=out;if(cl===cellOrNull()&&cl.textContent.trim()===cl.dataset.f)cl.textContent=out}))})}
const cellOrNull=()=>document.activeElement===ed?cellOf(sel().anchorNode):null;

/* safe formula parser (no eval): numbers, A1 refs, A1:B3 ranges, + - * / ^ %, ( ), functions */
const FN={SUM:a=>a.reduce((x,y)=>x+y,0),AVERAGE:a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,MIN:a=>a.length?Math.min(...a):0,MAX:a=>a.length?Math.max(...a):0,
  COUNT:a=>a.length,ROUND:(a)=>{const p=Math.pow(10,a[1]||0);return Math.round(a[0]*p)/p},ABS:a=>Math.abs(a[0]),SQRT:a=>Math.sqrt(a[0]),PRODUCT:a=>a.reduce((x,y)=>x*y,1)};
FN.AVG=FN.AVERAGE;FN.MEAN=FN.AVERAGE;
function evaluate(src,get){const tk=src.toUpperCase().match(/\s*([A-Z]+[0-9]+:[A-Z]+[0-9]+|[A-Z]+[0-9]+|[A-Z]+(?=\s*\()|\d*\.?\d+(?:E[+-]?\d+)?|[-+*/^%(),:])/g);
  if(!tk||tk.join('').replace(/\s/g,'')!==src.toUpperCase().replace(/\s/g,''))throw Error('#ERROR');
  let i=0;const T=tk.map(s=>s.trim()),peek=()=>T[i],next=()=>T[i++];
  const ref=s=>{const m=s.match(/^([A-Z]+)(\d+)$/);return[+m[2]-1,colIdx(m[1])]};
  const range=s=>{const[a,b]=s.split(':').map(ref),out=[];for(let r=Math.min(a[0],b[0]);r<=Math.max(a[0],b[0]);r++)for(let c=Math.min(a[1],b[1]);c<=Math.max(a[1],b[1]);c++){const v=get(r,c);if(typeof v==='number')out.push(v)}return out};
  const num=v=>typeof v==='number'?v:(v==null?0:+v||0);
  function expr(){let v=term();while(peek()==='+'||peek()==='-'){const o=next(),w=term();v=o==='+'?num(v)+num(w):num(v)-num(w)}return v}
  function term(){let v=pow();while(peek()==='*'||peek()==='/'){const o=next(),w=pow();v=o==='*'?num(v)*num(w):num(v)/num(w)}return v}
  function pow(){let v=unary();if(peek()==='^'){next();v=Math.pow(num(v),num(pow()))}return v}
  function unary(){if(peek()==='-'){next();return-num(unary())}if(peek()==='+'){next();return num(unary())}let v=atom();while(peek()==='%'){next();v=num(v)/100}return v}
  function atom(){const t=next();if(t==null)throw Error('#ERROR');
    if(t==='('){const v=expr();if(next()!==')')throw Error('#ERROR');return v}
    if(/^\d*\.?\d/.test(t))return+t;
    if(t.includes(':'))return range(t).reduce((x,y)=>x+y,0);
    if(/^[A-Z]+\d+$/.test(t)){const[r,c]=ref(t);return num(get(r,c))}
    if(/^[A-Z]+$/.test(t)){const f=FN[t];if(!f||next()!=='(')throw Error('#NAME?');const args=[];
      if(peek()!==')')do{const p=peek();if(p&&p.includes(':')&&(T[i+1]===','||T[i+1]===')')){next();args.push(...range(p))}else args.push(num(expr()))}while(peek()===','&&next());
      if(next()!==')')throw Error('#ERROR');return f(args)}
    throw Error('#ERROR')}
  const v=expr();if(i<T.length)throw Error('#ERROR');return v}

let rt;ed.addEventListener('input',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(ed.querySelector('table.sheet [data-f]'))recalc()},250)});
new MutationObserver(()=>{if(ed.querySelector('table.sheet [data-f]'))recalc()}).observe(ed,{childList:true});

/* ---------- find & replace ---------- */
document.body.insertAdjacentHTML('beforeend',`<div id="findp" role="dialog" aria-label="Find and replace" hidden>
<input id="fQ" placeholder="Find" spellcheck="false"><input id="fR" placeholder="Replace with" spellcheck="false">
<label title="Match case"><input type="checkbox" id="fC">Aa</label><span id="fN"></span>
<button id="fPrev" title="Previous">↑</button><button id="fNext" title="Next (Enter)">↓</button><button id="fOne">replace</button><button id="fAll">all</button><button id="fX" title="Close (Esc)">×</button></div>`);
const fp=$('#findp'),fQ=$('#fQ'),fR=$('#fR');let hits=[],hi=-1;
function openFind(){fp.hidden=false;const t=sel().toString();if(t&&t.length<80)fQ.value=t;fQ.focus();fQ.select();scan()}
function scan(){hits=[];const q=fQ.value;if(!q){$('#fN').textContent='';return}const cs=$('#fC').checked,w=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT);let n;
  const qq=cs?q:q.toLowerCase();while(n=w.nextNode()){const s=cs?n.data:n.data.toLowerCase();let i=0;while((i=s.indexOf(qq,i))>-1){hits.push([n,i,q.length]);i+=q.length}}
  $('#fN').textContent=hits.length?`${Math.max(hi,0)+1}/${hits.length}`:'0 found'}
function go(d){scan();if(!hits.length)return;hi=(hi+d+hits.length)%hits.length;const[n,i,l]=hits[hi],r=document.createRange();r.setStart(n,i);r.setEnd(n,i+l);
  const s=sel();s.removeAllRanges();s.addRange(r);const el=n.parentElement;el.scrollIntoView({block:'center',behavior:'smooth'});$('#fN').textContent=`${hi+1}/${hits.length}`}
fQ.addEventListener('input',()=>{hi=-1;scan()});$('#fC').onchange=()=>{hi=-1;scan()};
$('#fNext').onclick=()=>go(1);$('#fPrev').onclick=()=>go(-1);
$('#fOne').onclick=()=>{const s=sel(),q=fQ.value;if(!q)return;const cur=s.toString();
  if(s.rangeCount&&inEd(s.anchorNode)&&($('#fC').checked?cur===q:cur.toLowerCase()===q.toLowerCase())){ed.focus();document.execCommand('insertText',false,fR.value);fire();hi--}go(1);fQ.focus()};
$('#fAll').onclick=()=>{const q=fQ.value;if(!q)return;scan();const n=hits.length;if(!n)return;
  for(let k=hits.length-1;k>=0;k--){const[t,i,l]=hits[k];t.data=t.data.slice(0,i)+fR.value+t.data.slice(i+l)}
  fire();hi=-1;scan();if(window.toast)toast(`Replaced ${n}`)};
$('#fX').onclick=()=>{fp.hidden=true;ed.focus()};
fp.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();fp.hidden=true;ed.focus()}if(e.key==='Enter'){e.preventDefault();e.target===fR?$('#fOne').click():go(e.shiftKey?-1:1)}});

/* page breaks in PDF/DOCX export */
if(typeof contentCSS==='function'){const base=contentCSS;window.contentCSS=contentCSS=function(fs){return base(fs)+`
hr.pb{border:0;margin:0;page-break-after:always;break-after:page}img{max-width:100%;height:auto}
table.sheet td{text-align:right}table.sheet td:first-child{text-align:left}`}}
})();
