/* Typewriter feel: synthesized key strikes, carriage return, haptics, ink strike */
(function () {
  let ac = null, noise = null;
  const A = () => {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  };
  function nb(a) {
    if (noise) return noise;
    noise = a.createBuffer(1, a.sampleRate * 0.25, a.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noise;
  }
  function burst(a, t, freq, q, vol, dur) {
    const s = a.createBufferSource(); s.buffer = nb(a);
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f).connect(g).connect(a.destination); s.start(t, Math.random() * 0.1); s.stop(t + dur + 0.02);
  }
  function thump(a, t, f0, vol, dur) {
    const o = a.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(45, t + dur);
    const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function bell(a, t, v) {
    [[2093, 1], [3140, 0.45], [4186, 0.2]].forEach(([f, m]) => {
      const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * v * m, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + 1.35);
    });
  }
  function play(kind) {
    if (!S.sound) return;
    const a = A(); if (!a) return;
    const t = a.currentTime + 0.002, v = S.vol;
    const r = () => 0.85 + Math.random() * 0.3;
    if (kind === 'key') {
      burst(a, t, 2400 * r(), 1.6, 0.55 * v * r(), 0.035);          // type bar hitting the platen
      burst(a, t + 0.012, 1100 * r(), 1.1, 0.3 * v, 0.05);           // paper / ribbon
      thump(a, t, 170 * r(), 0.32 * v, 0.06);                        // key body
    } else if (kind === 'space') {
      burst(a, t, 900 * r(), 0.9, 0.45 * v, 0.07);
      thump(a, t, 105, 0.4 * v, 0.09);
    } else if (kind === 'back') {
      burst(a, t, 1500 * r(), 1.2, 0.4 * v, 0.05);
      thump(a, t, 130, 0.3 * v, 0.07);
    } else if (kind === 'ret') {
      bell(a, t, v);
      for (let i = 0; i < 9; i++) burst(a, t + 0.05 + i * 0.032, 3000 + i * 90, 2.5, 0.22 * v, 0.02); // carriage ratchet
      thump(a, t + 0.36, 90, 0.6 * v, 0.14);                         // carriage stop
      burst(a, t + 0.36, 700, 0.8, 0.4 * v, 0.1);
    }
  }
  function buzz(kind) {
    if (!S.haptic || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return;
    try { navigator.vibrate(kind === 'ret' ? [14, 40, 22] : kind === 'space' ? 10 : 7); } catch (e) {}
  }
  function strikeInk(ch) {
    const b = caretRect(); if (!b || !ch || /\s/.test(ch)) return;
    const g = document.createElement('span');
    g.className = 'ghost'; g.textContent = ch;
    const st = getComputedStyle(ed);
    g.style.cssText = `left:${b.left}px;top:${b.top + b.height / 2}px;font-family:${st.fontFamily};font-size:${st.fontSize}`;
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 220);
  }
  function kick() {
    const r = document.getElementById('rail');
    r.classList.remove('kick'); void r.offsetWidth; r.classList.add('kick');
  }
  window.twPlay = play;
  document.querySelector('.bar').addEventListener('click', e => { if (e.target.closest('button')) { play('key'); buzz('key'); } });
  ed.addEventListener('input', e => {
    const t = e.inputType || '';
    let kind = null;
    if (t === 'insertParagraph' || t === 'insertLineBreak') kind = 'ret';
    else if (t.startsWith('delete')) kind = 'back';
    else if (t === 'insertText' || t === 'insertReplacementText' || t === 'insertCompositionText') kind = e.data === ' ' ? 'space' : 'key';
    if (!kind) return;
    play(kind); buzz(kind);
    if (kind === 'key') requestAnimationFrame(() => { strikeInk((e.data || '').slice(-1)); kick(); });
    if (kind === 'space') kick();
  });
})();
