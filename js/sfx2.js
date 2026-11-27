'use strict';
/* Extra synthesised sounds: bell, foghorn, counting voices, the stamp, the off-air tone. */
(function () {
  const A = HW.A;
  function pan(p, wet) { const ctx = A.ctx, n = ctx.createStereoPanner(); n.pan.value = Math.max(-1, Math.min(1, p || 0)); n.connect(A.master); if (wet) { const s = ctx.createGain(); s.gain.value = wet; n.connect(s); s.connect(A.rev); } return n; }
  function tone(t, dur, type, f0, f1, vol, p, wet, att) {
    const ctx = A.ctx, o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + (att || 0.005) + dur);
    o.connect(g); g.connect(pan(p, wet)); o.start(t); o.stop(t + dur + (att || 0) + 0.05); return o;
  }
  A.bell = function (vol, p) { if (!A.ctx) return; const t = A.ctx.currentTime; vol = vol || 0.3; [[196, 1], [392.5, 0.5], [493, 0.3], [588, 0.22], [821, 0.12]].forEach(([f, v]) => tone(t, 4.5, 'sine', f, f * 0.995, vol * v, p || 0, 0.8, 0.004)); tone(t, 0.08, 'square', 900, 300, vol * 0.2, p || 0, 0.6); };
  A.horn = function (vol, p) { if (!A.ctx) return; const t = A.ctx.currentTime; vol = vol || 0.14; [[98, 1], [98.7, 0.9], [73.4, 0.6]].forEach(([f, v]) => tone(t, 2.8, 'sawtooth', f, f, vol * v, p || 0, 0.9, 0.5)); };
  // a number being said: two short vowel-ish tones. n picks the pitch so a count sounds like a sequence.
  A.count = function (n, p, vol) { if (!A.ctx) return; const t = A.ctx.currentTime; vol = vol || 0.12; const f = 150 + ((n * 37) % 5) * 14; tone(t, 0.16, 'sawtooth', f, f * 0.94, vol, p || 0, 0.5, 0.02); tone(t, 0.14, 'triangle', f * 5.1, f * 4.6, vol * 0.25, p || 0, 0.5, 0.02); tone(t + 0.19, 0.2, 'sawtooth', f * 0.9, f * 0.8, vol * 0.8, p || 0, 0.5, 0.02); };
  A.stamp = function () { if (!A.ctx) return; const t = A.ctx.currentTime; tone(t, 0.22, 'sine', 120, 38, 0.8, 0, 0.5); tone(t, 0.05, 'square', 700, 200, 0.2, 0, 0.3); tone(t + 0.12, 1.6, 'sine', 62, 58, 0.25, 0, 0.9, 0.2); };
  A.tvTone = function (dur) { if (!A.ctx) return; const t = A.ctx.currentTime; tone(t, dur || 2.5, 'sine', 1000, 962, 0.07, 0, 0.1, 0.02); };
  A.chime = function (ok) { if (!A.ctx) return; const t = A.ctx.currentTime; if (ok) { tone(t, 0.5, 'sine', 660, 660, 0.1, 0, 0.6); tone(t + 0.18, 0.8, 'sine', 990, 990, 0.08, 0, 0.6); } else tone(t, 0.6, 'sine', 220, 160, 0.14, 0, 0.6); };
  // --- the Fellowship: a low sung drone in three voices, a frame drum, a spoken litany, a whisper played backwards ---
  let ch = null, rw = null;
  function mkChant() {
    const ctx = A.ctx, g = ctx.createGain(); g.gain.value = 0; g.connect(A.master); const wet = ctx.createGain(); wet.gain.value = 0.9; g.connect(wet); wet.connect(A.rev);
    const voices = [];
    [[1, 0.42, -0.35], [1.5, 0.2, 0.4], [0.5, 0.4, 0]].forEach(([ratio, vol, pn]) => {
      const mix = ctx.createGain(); mix.gain.value = vol; const p = ctx.createStereoPanner(); p.pan.value = pn; mix.connect(p); p.connect(g);
      const oscs = [-8, 7].map(det => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = det; o.frequency.value = 146.83 * ratio; o.start(); return o; });
      const vib = ctx.createOscillator(); vib.frequency.value = 4.4 + Math.random() * 1.2; const vg = ctx.createGain(); vg.gain.value = 5; vib.connect(vg); vib.start(); oscs.forEach(o => vg.connect(o.detune));
      [[480, 8, 1], [860, 9, 0.5], [2500, 11, 0.14]].forEach(([f, q, v]) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const fg = ctx.createGain(); fg.gain.value = v; oscs.forEach(o => o.connect(bp)); bp.connect(fg); fg.connect(mix); });
      voices.push({ oscs, ratio });
    });
    const SEQ = [0, 1, 0, -2, 0, 3, 1, 0, 0, 5, 3, 1, 0, -2, 0, 0]; let i = 0;
    setInterval(() => { if (ctx.state !== 'running') return; const st = SEQ[i++ % SEQ.length], t = ctx.currentTime; voices.forEach((v, k) => { const f = 146.83 * v.ratio * Math.pow(2, (k === 0 ? st : k === 2 && i % 4 === 0 ? st : 0) / 12); v.oscs.forEach(o => o.frequency.setTargetAtTime(f, t, 0.18)); }); }, 2700);
    return { g };
  }
  A.chant = function (level) { if (!A.ctx) return false; if (!ch) ch = mkChant(); ch.g.gain.setTargetAtTime(Math.max(0, level) * 0.55, A.ctx.currentTime, 0.7); return true; };
  A.drum = function (vol) { if (!A.ctx) return; const t = A.ctx.currentTime; vol = vol || 0.4; tone(t, 0.32, 'sine', 82, 44, vol, 0, 0.6, 0.004); tone(t, 0.05, 'triangle', 240, 90, vol * 0.3, 0, 0.5); };
  A.litany = function (vol, p) { if (!A.ctx) return; const t = A.ctx.currentTime; vol = vol || 0.1; [[0, 98], [0.24, 98], [0.48, 110], [0.82, 92.5]].forEach(([dt, f]) => { tone(t + dt, 0.17, 'sawtooth', f, f * 0.96, vol, p || 0, 0.8, 0.02); tone(t + dt, 0.15, 'triangle', f * 6.1, f * 5.4, vol * 0.22, p || 0, 0.8, 0.02); }); };
  A.rwhisper = function (vol) {
    if (!A.ctx || !A.samples.whisper) return; const ctx = A.ctx;
    if (!rw) { const b = A.samples.whisper; rw = ctx.createBuffer(1, b.length, b.sampleRate); const src = b.getChannelData(0), dst = rw.getChannelData(0); for (let i = 0; i < src.length; i++) dst[i] = src[src.length - 1 - i]; }
    const s2 = ctx.createBufferSource(); s2.buffer = rw; s2.playbackRate.value = 0.85; const g = ctx.createGain(); g.gain.value = vol || 0.25; s2.connect(g); g.connect(pan(Math.random() * 1.6 - 0.8, 0.6)); s2.start(0, Math.random() * Math.max(0, rw.duration - 1.6), 1.5);
  };
  A.pencil = function () { if (!A.ctx) return; const ctx = A.ctx, t = ctx.currentTime; for (let i = 0; i < 3; i++) tone(t + i * 0.07, 0.05, 'sawtooth', 2400 + i * 300, 1800, 0.02, 0.2, 0.05); };
})();
