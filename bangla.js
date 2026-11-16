/* Banglish -> Bangla phonetic typing (Avro-style) with dictionary-ranked suggestions */
(function () {
  const V = { rri: ['ঋ', 'ৃ'], OI: ['ঐ', 'ৈ'], OU: ['ঔ', 'ৌ'], ee: ['ঈ', 'ী'], oo: ['উ', 'ু'], a: ['আ', 'া'], A: ['আ', 'া'], i: ['ই', 'ি'], I: ['ঈ', 'ী'],
    u: ['উ', 'ু'], U: ['ঊ', 'ূ'], e: ['এ', 'ে'], E: ['এ', 'ে'], O: ['ও', 'ো'], o: ['অ', ''] };
  const C = { kkh: 'ক্ষ', kh: 'খ', k: 'ক', K: 'ক', gh: 'ঘ', g: 'গ', G: 'গ', Ng: 'ঙ', NG: 'ঞ', ch: 'ছ', Ch: 'ছ', c: 'চ', jh: 'ঝ', j: 'জ', J: 'জ',
    Th: 'ঠ', T: 'ট', Dh: 'ঢ', D: 'ড', N: 'ণ', th: 'থ', t: 'ত', dh: 'ধ', d: 'দ', n: 'ন', ph: 'ফ', P: 'প', p: 'প', f: 'ফ', F: 'ফ', bh: 'ভ', v: 'ভ', V: 'ভ', b: 'ব', B: 'ব',
    m: 'ম', M: 'ম', z: 'য', Z: 'য', r: 'র', l: 'ল', L: 'ল', sh: 'শ', Sh: 'ষ', S: 'শ', s: 'স', h: 'হ', H: 'হ', Rh: 'ঢ়', R: 'ড়', q: 'ক', Q: 'ক', x: 'ক্স', X: 'ক্স' };
  const O = { 't``': 'ৎ', ng: 'ং', '^': 'ঁ', ':': 'ঃ' };
  // letters that sound alike in Banglish: first is the default
  const ALT = { s: ['স', 'শ', 'ষ'], S: ['শ', 'ষ', 'স'], sh: ['শ', 'ষ', 'স'], Sh: ['ষ', 'শ'], n: ['ন', 'ণ'], N: ['ণ', 'ন'], j: ['জ', 'য'], J: ['জ', 'য'],
    z: ['য', 'জ'], Z: ['য', 'জ'], t: ['ত', 'ট'], T: ['ট', 'ত'], th: ['থ', 'ঠ'], Th: ['ঠ', 'থ'], d: ['দ', 'ড'], D: ['ড', 'দ'], dh: ['ধ', 'ঢ'], Dh: ['ঢ', 'ধ'],
    r: ['র', 'ড়'], R: ['ড়', 'র'], ch: ['ছ', 'চ'], c: ['চ', 'ছ'] };
  const VALT = { i: ['i', 'I'], I: ['I', 'i'], u: ['u', 'U'], U: ['U', 'u'], o: ['o', 'O'] };
  const JOIN = new Set(('ক্ক ক্ট ক্ত ক্ল ক্স গ্ধ গ্ন গ্ব গ্ম গ্ল ঙ্ক ঙ্গ চ্চ চ্ছ জ্জ জ্ঞ জ্ব ঞ্চ ঞ্জ ট্ট ড্ড ণ্ট ণ্ড ত্ত ত্ন ত্ব থ্ব দ্দ দ্ধ দ্ব ধ্ব ন্ত ন্থ ন্দ ন্ধ ন্ন ন্ব ন্স ন্ড ন্ট ' +
    'প্ত প্ন প্প প্ল ব্জ ব্দ ব্ধ ব্ব ব্ল ম্ন ম্প ম্ব ম্ভ ম্ম ল্ক ল্প ল্ল শ্চ শ্ন শ্ব শ্ম শ্ল ষ্ক ষ্ট ষ্ঠ ষ্ণ ষ্প ষ্ম স্ক স্ট স্ত স্থ স্ন স্প স্ফ স্ব স্ম স্ল হ্ন হ্ম').split(' '));
  const RPHOLA = new Set('ক গ ঘ ট ড ত থ দ ধ প ফ ব ভ শ স হ জ'.split(' '));
  const KEYS = [...Object.keys(V), ...Object.keys(C), ...Object.keys(O), 'w', 'W', 'y', 'Y', '+'].sort((a, b) => b.length - a.length);

  function tokenize(src) {
    const out = []; let i = 0;
    while (i < src.length) { const k = KEYS.find(x => src.startsWith(x, i)); if (!k) { out.push({ raw: src[i++] }); continue; } out.push({ k }); i += k.length; }
    return out;
  }
  function render(toks, ch) {
    let out = '', prevC = null, force = false;
    toks.forEach((t, ix) => {
      if (t.raw !== undefined) { out += t.raw; prevC = null; return; }
      const k = t.k, c = ch[ix] || 0;
      if (k === '+') { if (prevC) force = true; return; }
      if (V[k]) { const v = V[VALT[k] ? VALT[k][c] : k]; out += prevC ? v[1] : v[0]; prevC = null; return; }
      if (k === 'y' || k === 'Y') { out += prevC ? '্য' : 'য়'; return; }
      if (k === 'w' || k === 'W') { out += prevC ? '্ব' : 'ও'; return; }
      if (C[k]) {
        const cc = ALT[k] ? ALT[k][c] : C[k];
        if (prevC && (force || JOIN.has(prevC + '্' + cc) || (cc === 'র' && RPHOLA.has(prevC)))) out += '্';
        out += cc; prevC = cc[cc.length - 1]; force = false; return;
      }
      out += O[k]; prevC = null;
    });
    return out;
  }
  const conv = src => render(tokenize(src), []);

  /* dictionary (LibreOffice bn_BD, ~87k words) */
  let DICT = null, loading = false;
  function loadDict() {
    if (DICT || loading) return; loading = true;
    fetch('https://cdn.jsdelivr.net/gh/LibreOffice/dictionaries@master/bn_BD/bn_BD.dic').then(r => r.text()).then(t => {
      const s = new Set(); for (const l of t.split('\n')) { const w = l.split('/')[0].trim(); if (w) s.add(w); } DICT = s;
    }).catch(() => { loading = false; });
  }
  const SUF = ['গুলো', 'গুলি', 'দের', 'েরা', 'ের', 'কে', 'রা', 'টি', 'টা', 'তে', 'য়', 'র', 'ে', 'ও', 'ই'];
  function known(w) {
    if (!DICT) return false;
    if (DICT.has(w)) return true;
    for (const s of SUF) if (w.length > s.length + 1 && w.endsWith(s) && DICT.has(w.slice(0, -s.length))) return true;
    return false;
  }
  function cands(src) {
    const toks = tokenize(src);
    const opts = toks.map(t => t.k === undefined ? 1 : (C[t.k] && ALT[t.k]) ? ALT[t.k].length : VALT[t.k] ? VALT[t.k].length : 1);
    let total = opts.reduce((a, b) => a * b, 1);
    while (total > 400) { let i = opts.length - 1; while (opts[i] === 1) i--; total /= opts[i]; opts[i] = 1; }
    const seen = new Map();
    for (let n = 0; n < total; n++) {
      let r = n; const ch = opts.map(o => { const c = r % o; r = (r - c) / o; return c; });
      const w = render(toks, ch); if (seen.has(w)) continue;
      seen.set(w, (known(w) ? 0 : 1000) + ch.filter(Boolean).length * 10 + n * 1e-4);
    }
    return [...seen].sort((a, b) => a[1] - b[1]).map(x => x[0]).slice(0, 6);
  }
  window.banglaConvert = conv; window.banglaCands = cands; window.banglaLoad = loadDict;

  /* suggestion box */
  const st = document.createElement('style');
  st.textContent = `#bnSug{position:fixed;z-index:8;display:flex;flex-wrap:wrap;gap:4px;max-width:92vw;background:var(--panel);border:1px solid var(--line);border-radius:7px;padding:5px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
#bnSug[hidden]{display:none}#bnSug button{font:17px/1.3 'Tiro Bangla',serif;background:none;border:0;color:var(--ink);padding:3px 10px;border-radius:4px;cursor:pointer}
#bnSug button.on{background:var(--ink);color:var(--bg)}#bnSug button:hover:not(.on){background:var(--line)}
#bnSug small{width:100%;font:10px 'Courier Prime',monospace;color:var(--ui);padding:2px 6px 0}`;
  document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'bnSug'; box.hidden = true; document.body.appendChild(box);

  const DIG = '০১২৩৪৫৬৭৮৯';
  let buf = '', last = '', list = [], sel = 0;
  function hide() { box.hidden = true; }
  function reset() { buf = ''; last = ''; list = []; sel = 0; hide(); }
  function show() {
    if (list.length < 2) return hide();
    box.innerHTML = list.map((w, i) => `<button type="button" data-i="${i}" class="${i === sel ? 'on' : ''}">${w}</button>`).join('') + '<small>↑↓ choose · Enter pick · Esc close</small>';
    box.hidden = false;
    const b = caretRect(); if (!b) return;
    box.style.left = Math.max(8, Math.min(innerWidth - box.offsetWidth - 8, b.left - 60)) + 'px';
    box.style.top = Math.max(8, b.top - box.offsetHeight - 12) + 'px';
  }
  function replaceTail(oldS, newS) {
    const s = getSelection(); if (!s.rangeCount) return false;
    const n = s.anchorNode, off = s.anchorOffset;
    if (oldS) {
      if (!s.isCollapsed || n.nodeType !== 3 || off < oldS.length || n.data.slice(off - oldS.length, off) !== oldS) return false;
      const r = document.createRange(); r.setStart(n, off - oldS.length); r.setEnd(n, off); s.removeAllRanges(); s.addRange(r);
    }
    if (newS) document.execCommand('insertText', false, newS); else if (oldS) document.execCommand('delete');
    return true;
  }
  function update(nb) {
    list = nb ? cands(nb) : []; sel = 0;
    const out = list[0] || '';
    if (!replaceTail(last, out)) { buf = ''; last = ''; return false; }
    buf = nb; last = out; if (!buf) reset(); else show(); return true;
  }
  function pick(i) { if (!list[i]) return; if (replaceTail(last, list[i])) { last = list[i]; sel = i; show(); } }

  ed.addEventListener('beforeinput', e => {
    if (!S.bangla || e.isComposing) return;
    const t = e.inputType;
    if (t === 'insertText' && e.data) {
      e.preventDefault();
      for (const ch of e.data) {
        if (/[A-Za-z^:`+]/.test(ch)) { if (!update(buf + ch)) { reset(); update(ch); } continue; }
        reset();
        document.execCommand('insertText', false, /[0-9]/.test(ch) ? DIG[+ch] : ch === '.' ? '।' : ch === '$' ? '৳' : ch);
      }
      return;
    }
    if (t === 'deleteContentBackward' && buf) { e.preventDefault(); if (!update(buf.slice(0, -1))) { reset(); document.execCommand('delete'); } return; }
    if (t !== 'insertText') reset();
  });
  ed.addEventListener('keydown', e => {
    if (!S.bangla || !buf) return;
    const open = !box.hidden;
    if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); e.stopPropagation(); pick((sel + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length); return; }
    if (open && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); reset(); return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); reset(); return; }
    if (/^(Arrow|Home|End|Page|Tab|Enter)/.test(e.key)) reset();
  }, true);
  box.addEventListener('mousedown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); pick(+b.dataset.i); reset(); });
  ed.addEventListener('mousedown', reset);
  ed.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== ed) reset(); }, 0));
  stage.addEventListener('scroll', () => { if (!box.hidden) show(); }, { passive: true });

  const btn = $('#bLang');
  function paint() { btn.textContent = S.bangla ? 'বাং' : 'EN'; btn.classList.toggle('bn', !!S.bangla); btn.classList.toggle('on', !!S.bangla); document.body.classList.toggle('bangla', !!S.bangla); if (S.bangla) loadDict(); }
  function toggle() { S.bangla = !S.bangla; reset(); applyS(); paint(); toast(S.bangla ? 'বাংলা typing on: type “ami tOmake bhalobashi”' : 'English typing'); ed.focus(); }
  btn.addEventListener('mousedown', e => e.preventDefault());
  btn.onclick = toggle;
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b') { e.preventDefault(); toggle(); } });
  paint();
})();
