/* Writing insights: daily words, streak, session speed, readability, overused words */
(function () {
  const today = () => new Date().toLocaleDateString('en-CA');
  const words = t => (t.trim().match(/[\p{L}\p{N}'’-]+/gu) || []);
  let log = ls.get('daylog', {});
  let lastCount = words(ed.innerText).length, lastDoc = null;
  const sess = { start: 0, active: 0, typed: 0, lastKey: 0 };

  ed.addEventListener('input', () => {
    const n = words(ed.innerText).length, id = cur && cur.id;
    if (id === lastDoc) { const d = n - lastCount; if (d > 0) { log[today()] = (log[today()] || 0) + d; sess.typed += d; ls.set('daylog', log); } }
    lastDoc = id; lastCount = n;
    const now = Date.now();
    if (!sess.start) sess.start = now;
    if (sess.lastKey && now - sess.lastKey < 15000) sess.active += now - sess.lastKey;
    sess.lastKey = now;
  });
  // re-baseline when a different document is opened
  setInterval(() => { const id = cur && cur.id; if (id !== lastDoc) { lastDoc = id; lastCount = words(ed.innerText).length; } }, 1000);

  function streak() {
    let n = 0; const d = new Date();
    if (!log[today()]) d.setDate(d.getDate() - 1);
    while (log[d.toLocaleDateString('en-CA')] > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function syllables(w) {
    w = w.toLowerCase().replace(/[^a-z]/g, ''); if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g); return m ? m.length : 1;
  }
  const STOP = new Set('the a an and or but if of to in on at for with as by from is are was were be been am i you he she it we they me my your his her its our their this that these those not no so do does did have has had will would can could just than then there here what which who whom when where why how all any some very also into about up out over more most such only own same too s t'.split(' '));
  const STOP_BN = new Set('এবং ও কিন্তু যে এই সেই একটি এক না তা তার আমি আমার তুমি তোমার সে তিনি আমরা তারা করে হয় ছিল হবে থেকে জন্য দিয়ে নিয়ে মধ্যে কি কী'.split(' '));

  function build() {
    const text = ed.innerText, w = words(text), n = w.length;
    const sentences = (text.match(/[^.!?।]+[.!?।]+/g) || (text.trim() ? [text] : [])).filter(x => x.trim());
    const sc = Math.max(1, sentences.length);
    const asl = n / sc;
    const latin = w.filter(x => /^[A-Za-z'’-]+$/.test(x));
    let ease = null;
    if (latin.length >= 30) {
      const syl = latin.reduce((a, x) => a + syllables(x), 0) / latin.length;
      ease = Math.round(Math.max(0, Math.min(100, 206.835 - 1.015 * asl - 84.6 * syl)));
    }
    const easeLabel = ease == null ? 'write 30+ English words to rate' : ease >= 70 ? 'easy to read' : ease >= 50 ? 'fairly clear' : ease >= 30 ? 'dense' : 'very hard to read';
    const freq = {};
    w.forEach(x => { const k = x.toLowerCase(); if (k.length > 2 && !STOP.has(k) && !STOP_BN.has(k)) freq[k] = (freq[k] || 0) + 1; });
    const top = Object.entries(freq).filter(([, c]) => c > 2).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const long = sentences.filter(x => words(x).length > 30).length;
    const mins = sess.active / 60000, wpm = mins > 0.2 ? Math.round(sess.typed / mins) : null;
    const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = d.toLocaleDateString('en-CA'); return [k, log[k] || 0]; });
    const max = Math.max(1, ...days.map(x => x[1]));
    const total7 = days.slice(7).reduce((a, x) => a + x[1], 0);
    const tips = [];
    if (asl > 22) tips.push('Your sentences average ' + Math.round(asl) + ' words. Splitting a few will make the piece easier to follow.');
    if (long) tips.push(long + ' sentence' + (long > 1 ? 's run' : ' runs') + ' past 30 words.');
    if (top[0] && top[0][1] >= 5) tips.push('“' + top[0][0] + '” appears ' + top[0][1] + ' times. Consider a synonym in a few places.');
    if (!tips.length && n > 50) tips.push('Clean rhythm. Nothing stands out to fix.');
    const esc2 = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return `<div class="dh"><b>Writing insights</b><button class="mini" data-close>close</button></div>
<div class="ins-grid">
 <div><b>${(log[today()] || 0).toLocaleString()}</b><small>words today</small></div>
 <div><b>${streak()}</b><small>day streak</small></div>
 <div><b>${total7.toLocaleString()}</b><small>words, last 7 days</small></div>
 <div><b>${wpm ?? '–'}</b><small>words per minute (this session)</small></div>
 <div><b>${n.toLocaleString()}</b><small>words in this document</small></div>
 <div><b>${Math.max(1, Math.round(n / 230))} min</b><small>reading time</small></div>
 <div><b>${ease ?? '–'}</b><small>readability · ${easeLabel}</small></div>
 <div><b>${Math.round(asl)}</b><small>avg words per sentence</small></div>
</div>
<h4 class="ins-h">Last 14 days</h4>
<div class="ins-bars">${days.map(([k, v]) => `<i title="${k}: ${v} words" style="height:${Math.max(3, v / max * 100)}%;opacity:${v ? 1 : .25}"></i>`).join('')}</div>
${top.length ? `<h4 class="ins-h">Most used words</h4><p class="ins-words">${top.map(([k, c]) => `<span>${esc2(k)} <small>×${c}</small></span>`).join('')}</p>` : ''}
${tips.length ? `<h4 class="ins-h">Suggestions</h4><ul class="ins-tips">${tips.map(t => `<li>${esc2(t)}</li>`).join('')}</ul>` : ''}`;
  }

  const st = document.createElement('style');
  st.textContent = `.ins-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ins-grid div{border:1px solid var(--line);border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.ins-grid b{font-size:22px;font-variant-numeric:tabular-nums}.ins-grid small{color:var(--ui);font-size:11px}
.ins-h{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ui);margin:18px 0 8px;font-weight:400}
.ins-bars{display:flex;align-items:flex-end;gap:4px;height:70px;border-bottom:1px solid var(--line)}
.ins-bars i{flex:1;background:var(--ink);border-radius:2px 2px 0 0;min-height:3px}
.ins-words{display:flex;flex-wrap:wrap;gap:6px}.ins-words span{border:1px solid var(--line);border-radius:12px;padding:2px 9px}
.ins-tips{padding-left:1.1em;margin:0;line-height:1.6}`;
  document.head.appendChild(st);
  const dlg = document.createElement('dialog'); dlg.className = 'modal'; dlg.id = 'ins'; document.body.appendChild(dlg);
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  dlg.addEventListener('close', () => ed.focus());
  const open = () => { dlg.innerHTML = build(); dlg.showModal(); };
  const c = $('#count'); c.addEventListener('click', open); c.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') { e.preventDefault(); open(); } });
})();
