/* Accounts (Google / email link) + cloud sync via Supabase. Offline-first: IndexedDB stays the source of truth on each device. */
(function () {
  const URL_ = 'https://cvxksueyuxpqqsuxeblj.supabase.co';
  const KEY = 'sb_publishable_BOEHHfVpC7xUiOQh_Ge4aA_FeyDWgyg'; // public key; access is enforced by row-level security
  if (!window.supabase || location.hash.startsWith('#s=')) return;
  const sb = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
  let user = null, timer = null, busy = false, applying = false;
  let gOn = false;
  fetch(URL_ + '/auth/v1/settings', { headers: { apikey: KEY } }).then(r => r.json()).then(j => { gOn = !!(j.external && j.external.google); }).catch(() => {});
  const queue = new Map();
  const lsKey = k => 'sync.' + k + '.' + (user ? user.id : '');

  /* ---------- UI ---------- */
  const btn = document.createElement('button');
  btn.id = 'bAcct'; btn.textContent = 'sign in'; btn.title = 'Sign in to sync your notes across devices';
  $('#bLib').after(btn);
  const st = document.createElement('style');
  st.textContent = `#acct .gbtn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:10px;border-radius:6px;border:1px solid var(--line);background:#fff;color:#1f1f1f;font:14px system-ui,sans-serif;cursor:pointer}
#acct .gbtn:hover{box-shadow:0 2px 8px rgba(0,0,0,.15)}#acct .or{text-align:center;color:var(--ui);font-size:11px;margin:14px 0}
#acct .who{display:flex;align-items:center;gap:12px;margin-bottom:12px}#acct .av{width:40px;height:40px;border-radius:50%;background:var(--ink);color:var(--bg);display:grid;place-items:center;font-size:18px;overflow:hidden}
#acct .av img{width:100%;height:100%;object-fit:cover}#syncDot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#2fd06a;margin-left:6px;vertical-align:middle}#syncDot.off{background:#c9a227}#syncDot.err{background:#e5484d}`;
  document.head.appendChild(st);
  const dlg = document.createElement('dialog'); dlg.id = 'acct'; dlg.className = 'modal'; document.body.appendChild(dlg);
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  const G = '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>';
  const escH = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function render() {
    if (!user) {
      dlg.innerHTML = `<div class="dh"><b>Sign in to Po Notestack</b><button class="mini" data-close>close</button></div>
<p class="note">Sign in to keep your notes safe in your account and open them on any device. You can keep writing offline; changes sync when you're back online.</p>
${gOn ? `<button class="gbtn" id="gIn">${G} Continue with Google</button>
<div class="or">or get a sign-in link by email</div>` : '<p class="note">Enter your email and we will send you a one-tap sign-in link.</p>'}
<form id="mailF" class="row"><input id="mailIn" class="field" type="email" required placeholder="you@example.com" style="flex:1" autocomplete="email"><button class="btn">Send link</button></form>
<p class="note" id="acctMsg"></p>`;
      if ($('#gIn')) $('#gIn').onclick = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/' } }).then(r => { if (r.error) $('#acctMsg').textContent = r.error.message; });
      $('#mailF').onsubmit = async e => {
        e.preventDefault(); $('#acctMsg').textContent = 'Sending…';
        const { error } = await sb.auth.signInWithOtp({ email: $('#mailIn').value.trim(), options: { emailRedirectTo: location.origin + '/' } });
        $('#acctMsg').textContent = error ? error.message : 'Check your inbox and open the link on this device.';
      };
    } else {
      const m = user.user_metadata || {}, name = m.full_name || m.name || user.email;
      const last = ls.get(lsKey('at'), 0);
      dlg.innerHTML = `<div class="dh"><b>Account</b><button class="mini" data-close>close</button></div>
<div class="who"><div class="av">${m.avatar_url ? `<img src="${escH(m.avatar_url)}" alt="" referrerpolicy="no-referrer">` : escH((name || '?')[0].toUpperCase())}</div><div><b>${escH(name)}</b><br><small class="note">${escH(user.email)}</small></div></div>
<p class="note">${navigator.onLine ? 'Online' : 'Offline: changes will sync when you reconnect'} · last synced ${last ? new Date(last).toLocaleString() : 'never'}</p>
<div class="row"><button class="btn" id="syncNow">Sync now</button><button class="btn ghost" id="signOut">Sign out</button></div>
<p class="note">Signing out removes this account's notes from this device. They stay safe in your account.</p>`;
      $('#syncNow').onclick = async () => { await syncAll(); render(); toast('Synced'); };
      $('#signOut').onclick = signOut;
    }
  }
  btn.onclick = () => { render(); dlg.showModal(); };
  function paint(state) {
    if (!user) { btn.textContent = 'sign in'; btn.classList.remove('on'); return; }
    const m = user.user_metadata || {};
    btn.innerHTML = escH((m.full_name || m.name || user.email || 'account').split(/[ @]/)[0].slice(0, 12)) + `<span id="syncDot" class="${state || ''}"></span>`;
    btn.title = 'Signed in as ' + user.email;
  }

  /* ---------- sync ---------- */
  const ver = d => Math.max(d.rev || 0, d.updated || 0);
  const row = d => ({ id: d.id, data: d, updated: ver(d) || Date.now(), deleted: false });
  async function push() {
    if (!user || !queue.size || !navigator.onLine) return;
    const items = [...queue.values()]; queue.clear();
    const { error } = await sb.from('notes').upsert(items, { onConflict: 'user_id,id' });
    if (error) { items.forEach(i => queue.set(i.id, i)); ls.set(lsKey('queue'), [...queue.values()]); throw error; }
    ls.set(lsKey('queue'), []);
  }
  async function pull() {
    const since = ls.get(lsKey('pulled2'), '1970-01-01T00:00:00Z');
    let max = since, from = 0;
    for (;;) {
      const { data, error } = await sb.from('notes').select('id,data,updated,deleted,synced_at').gte('synced_at', since).order('synced_at').range(from, from + 499);
      if (error) throw error;
      applying = true;
      try {
        for (const r of data) {
          if (r.synced_at > max) max = r.synced_at;
          const local = docs.find(d => d.id === r.id);
          if (r.deleted) { if (local && ver(local) <= r.updated) { docs.splice(docs.indexOf(local), 1); await DB.del(r.id); if (cur === local) newDoc(); } continue; }
          if (local && ver(local) >= r.updated) continue;
          const d = { ...r.data, owner: user.id, rev: r.updated };
          if (local) Object.assign(local, d); else docs.push(d);
          await DB.put(local || d);
          if (cur && cur.id === d.id && !dirty && document.activeElement !== ed) { ed.innerHTML = d.html || '<p><br></p>'; $('#title').value = d.title; count(); }
        }
      } finally { applying = false; }
      if (data.length < 500) break; from += 500;
    }
    ls.set(lsKey('pulled2'), max);
  }
  async function syncAll() {
    if (!user || busy) return;
    if (!navigator.onLine) return paint('off');
    busy = true;
    try { await push(); await pull(); ls.set(lsKey('at'), Date.now()); paint(''); }
    catch (e) { console.warn('sync', e); paint('err'); }
    finally { busy = false; }
  }
  const soon = () => { clearTimeout(timer); timer = setTimeout(syncAll, 1500); };

  // capture local changes
  const put0 = DB.put.bind(DB), del0 = DB.del.bind(DB);
  DB.put = d => { if (user && !applying) d.rev = Date.now(); return put0(d).then(r => { if (user && !applying) { d.owner = user.id; queue.set(d.id, row(d)); ls.set(lsKey('queue'), [...queue.values()]); soon(); } return r; }); };
  DB.del = id => del0(id).then(r => { if (user && !applying) { queue.set(id, { id, data: {}, updated: Date.now(), deleted: true }); ls.set(lsKey('queue'), [...queue.values()]); soon(); } return r; });

  async function onUser(u) {
    const prev = user; user = u;
    if (!u) { paint(); return; }
    if (prev && prev.id === u.id) return;
    for (let i = 0; i < 100 && !window.twBooted; i++) await new Promise(r => setTimeout(r, 100));
    ls.get(lsKey('queue'), []).forEach(i => queue.set(i.id, i));
    // first sign-in on this device: claim notes written before signing in
    for (const d of docs) if (!d.owner) { d.owner = u.id; await put0(d); queue.set(d.id, row(d)); }
    // hide notes that belong to another account on this device
    docs = docs.filter(d => !d.owner || d.owner === u.id);
    paint(); await syncAll();
    if (!cur && docs.length) { const l = docs.filter(d => !d.trashed && !d.archived).sort((a, b) => b.updated - a.updated)[0]; if (l && !ed.innerText.trim()) openDoc(l); }
    toast('Signed in · notes syncing');
  }
  async function signOut() {
    try { await syncAll(); } catch (e) {}
    const id = user && user.id;
    await sb.auth.signOut();
    for (const d of docs.filter(x => x.owner === id)) await del0(d.id);
    docs = docs.filter(x => x.owner !== id); user = null; queue.clear();
    newDoc(); paint(); dlg.close(); toast('Signed out');
  }

  sb.auth.onAuthStateChange((ev, session) => { setTimeout(() => onUser(session ? session.user : null), 0); });
  window.addEventListener('online', syncAll);
  window.addEventListener('offline', () => paint('off'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncAll(); });
  setInterval(syncAll, 30000);
  // clean the ?code= left by the sign-in redirect
  if (/[?&]code=/.test(location.search)) setTimeout(() => history.replaceState(null, '', location.pathname), 1500);
})();
