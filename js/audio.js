'use strict';
/* HANGING WEIGHT — audio: WebAudio synthesis with optional CC0 samples layered on top */
(function () {
  const A = HW.A = { ctx: null, vol: 0.85, samples: {}, ready: false };
  let ctx, master, rev, noiseBuf, L = {};

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = A.ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.connect(ctx.destination);
    master = A.master = ctx.createGain(); master.gain.value = A.vol; master.connect(comp);
    // generated reverb impulse: tiled industrial hall
    const len = Math.floor(ctx.sampleRate * 2.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * (i < 400 ? i / 400 : 1); }
    rev = A.rev = ctx.createConvolver(); rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = 0.55; rev.connect(rg); rg.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    startLoops(); loadSamples(); A.ready = true;
  };
  A.setVol = v => { A.vol = v; if (master) master.gain.value = v; };

  function out(pan, wet) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0)); p.connect(master); if (wet) { const s = ctx.createGain(); s.gain.value = wet; p.connect(s); s.connect(rev); } return p; }
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function nz(t, dur, ftype, f0, f1, q, vol, pan, wet, att) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = ftype; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q || 1;
    const g = ctx.createGain(); env(g, t, att || 0.004, dur, vol); s.connect(f); f.connect(g); g.connect(out(pan, wet)); s.start(t, Math.random()); s.stop(t + dur + (att || 0) + 0.05);
  }
  function tone(t, dur, type, f0, f1, vol, pan, wet, att) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, att || 0.004, dur, vol); o.connect(g); g.connect(out(pan, wet)); o.start(t); o.stop(t + dur + (att || 0) + 0.05); return o;
  }

  // ---- samples ----
  function loadSamples() {
    fetch('assets/sfx/manifest.json').then(r => r.ok ? r.json() : {}).then(m => {
      Object.keys(m).forEach(name => fetch('assets/sfx/' + m[name]).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).then(buf => { A.samples[name] = buf; }).catch(() => { }));
    }).catch(() => { });
  }
  A.sample = function (name, vol, pan, wet, rate, loop) {
    if (!ctx || !A.samples[name]) return null;
    const s = ctx.createBufferSource(); s.buffer = A.samples[name]; s.playbackRate.value = rate || 1; s.loop = !!loop;
    const g = ctx.createGain(); g.gain.value = vol === undefined ? 1 : vol; s.connect(g); g.connect(out(pan, wet === undefined ? 0.25 : wet)); s.start(); return { src: s, gain: g };
  };

  // ---- one-shots ----
  A.step = function (surf, vol, pan, heavy) {
    if (!ctx) return; const t = ctx.currentTime; vol = vol || 0.2; const w = 0.12;
    if (surf === 'metal') { nz(t, 0.09, 'bandpass', 1900, 900, 6, vol * 1.3, pan, w); tone(t, 0.12, 'triangle', 420 + Math.random() * 120, 300, vol * 0.25, pan, w); }
    else if (surf === 'mud') { nz(t, 0.16, 'lowpass', 700, 200, 1, vol * 1.5, pan, 0.04, 0.02); nz(t + 0.05, 0.08, 'bandpass', 1400, 600, 3, vol * 0.5, pan, 0.04); }
    else if (surf === 'wet') { nz(t, 0.07, 'lowpass', 1100, 300, 1, vol, pan, w); nz(t + 0.02, 0.1, 'bandpass', 2600, 1300, 4, vol * 0.5, pan, w); }
    else if (surf === 'soft') { nz(t, 0.09, 'lowpass', 420, 160, 1, vol * 0.9, pan, 0.03); }
    else if (surf === 'tile') { nz(t, 0.05, 'bandpass', 1500, 800, 2, vol, pan, w * 1.5); tone(t, 0.05, 'sine', 180, 90, vol * 0.7, pan, w); }
    else { nz(t, 0.06, 'lowpass', 900, 260, 1, vol * 1.1, pan, w); tone(t, 0.06, 'sine', 130, 70, vol * 0.8, pan, w); }
    if (heavy) { tone(t, 0.16, 'sine', 70, 36, vol * 2.2, pan, 0.3); nz(t, 0.1, 'lowpass', 300, 90, 1, vol * 1.6, pan, 0.3); }
  };
  A.click = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.02, 'highpass', 2500, 0, 1, 0.3, 0, 0.05); tone(t, 0.03, 'square', 1100, 500, 0.08, 0, 0.05); };
  A.crank = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.025, 'bandpass', 2800 + Math.random() * 500, 0, 5, 0.32, 0.2, 0.1); tone(t, 0.04, 'square', 300 + Math.random() * 60, 180, 0.07, 0.2, 0.1); };
  A.thump = function (vol) { if (!ctx) return; const t = ctx.currentTime; tone(t, 0.16, 'sine', 62, 36, vol, 0, 0); tone(t + 0.19, 0.14, 'sine', 54, 32, vol * 0.7, 0, 0); };
  A.bang = function (vol, pan) {
    if (!ctx) return; const t = ctx.currentTime; vol = vol || 0.8;
    if (A.sample('slam', vol * 0.9, pan, 0.5, 0.85 + Math.random() * 0.2)) return;
    nz(t, 0.35, 'lowpass', 1800, 120, 1, vol, pan, 0.7); tone(t, 0.4, 'sine', 95, 38, vol, pan, 0.6); tone(t, 0.5, 'square', 311, 290, vol * 0.12, pan, 0.8); tone(t, 0.6, 'square', 467, 450, vol * 0.08, pan, 0.8);
  };
  A.creak = function (pan, vol) { if (!ctx) return; const t = ctx.currentTime; const o = tone(t, 0.5, 'sawtooth', 170 + Math.random() * 60, 260, (vol || 0.05), pan, 0.4, 0.08); o.detune.setValueAtTime(0, t); nz(t, 0.4, 'bandpass', 900, 1500, 9, (vol || 0.05) * 1.6, pan, 0.4, 0.1); };
  A.latch = function (pan) { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.04, 'bandpass', 1300, 600, 3, 0.25, pan, 0.25); tone(t + 0.03, 0.06, 'sine', 160, 80, 0.2, pan, 0.25); };
  A.rattle = function (pan) { if (!ctx) return; if (A.sample('chain', 0.6, pan, 0.4)) return; const t = ctx.currentTime; for (let i = 0; i < 9; i++) nz(t + i * 0.045 + Math.random() * 0.02, 0.03, 'bandpass', 3000 + Math.random() * 2500, 0, 7, 0.16, pan, 0.4); };
  A.sting = function (big) {
    if (!ctx) return; const t = ctx.currentTime, v = big ? 0.2 : 0.11;
    if (big) A.sample('stinger', 0.75, 0, 0.5);
    [220, 233.1, 311.1, 466.2, 622.3, 659.3].forEach((f, i) => { const o = tone(t, big ? 2.2 : 1.2, 'sawtooth', f, f * 1.06, v * (i > 3 ? 0.6 : 1), (i - 2.5) / 3, 0.8, 0.01); o.detune.value = (Math.random() - 0.5) * 30; });
    nz(t, big ? 0.9 : 0.4, 'bandpass', 2400, 600, 1.5, v * 2, 0, 0.8); tone(t, 0.7, 'sine', 80, 30, v * 3, 0, 0.3);
  };
  A.whoosh = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.7, 'bandpass', 300, 2600, 2, 0.22, 0, 0.7, 0.45); tone(t, 0.8, 'sine', 900, 120, 0.05, 0, 0.8, 0.3); };
  A.whisper = function (pan, vol) {
    if (!ctx) return; if (A.samples.whisper && Math.random() < 0.6) { A.sample('whisper', (vol || 0.3) * 1.2, pan, 0.7, 0.85 + Math.random() * 0.3); return; }
    const t = ctx.currentTime, n = 5 + Math.floor(Math.random() * 6); let tt = t;
    for (let i = 0; i < n; i++) { const d = 0.07 + Math.random() * 0.12; nz(tt, d, 'bandpass', 1400 + Math.random() * 2400, 1000 + Math.random() * 2000, 5, (vol || 0.3) * (0.5 + Math.random() * 0.5), pan, 0.6, 0.03); tt += d + 0.03 + Math.random() * 0.07; }
  };
  A.radio = function (syll) {
    if (!ctx) return; const t = ctx.currentTime; let tt = t + 0.1;
    if (!A.sample('static', 0.25, 0.15, 0.05)) nz(t, 0.12, 'highpass', 2000, 0, 1, 0.14, 0.15, 0.05);
    tone(t, 0.05, 'square', 1250, 0, 0.06, 0.15, 0);
    for (let i = 0; i < syll; i++) {
      const d = 0.05 + Math.random() * 0.07, f = 150 + Math.random() * 190;
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, tt); o.frequency.linearRampToValueAtTime(f * (0.8 + Math.random() * 0.5), tt + d);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700 + Math.random() * 1500; bp.Q.value = 4;
      const g = ctx.createGain(); env(g, tt, 0.01, d, 0.22); o.connect(bp); bp.connect(g); g.connect(out(0.15, 0.04)); o.start(tt); o.stop(tt + d + 0.05);
      tt += d + (Math.random() < 0.18 ? 0.14 : 0.015);
    }
    nz(t + 0.05, tt - t, 'highpass', 3000, 0, 1, 0.035, 0.15, 0); tone(tt + 0.02, 0.04, 'square', 900, 0, 0.05, 0.15, 0);
  };
  A.squelch = function (vol) { if (!ctx) return; if (A.sample('squelch', vol || 0.8, 0, 0.2, 0.9 + Math.random() * 0.2)) return; const t = ctx.currentTime; nz(t, 0.2, 'lowpass', 1200, 200, 2, vol || 0.6, 0, 0.2, 0.02); nz(t + 0.08, 0.15, 'bandpass', 2400, 700, 5, (vol || 0.6) * 0.5, 0, 0.2); };
  A.chop = function () { if (!ctx) return; const t = ctx.currentTime; if (!A.sample('chop', 0.9, 0, 0.3)) { nz(t, 0.05, 'highpass', 3000, 0, 1, 0.4, 0, 0.3); tone(t, 0.18, 'sine', 140, 50, 0.7, 0, 0.3); } A.squelch(0.7); };
  A.mop = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.4, 'bandpass', 900, 2200, 1.5, 0.12, 0, 0.3, 0.15); };
  A.scream = function (vol, pan) {
    if (!ctx) return; if (A.sample(Math.random() < 0.5 && A.samples.scream2 ? 'scream2' : 'scream', vol || 0.9, pan || 0, 0.6)) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(), ws = ctx.createWaveShaper();
    const cv = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(x * 6); } ws.curve = cv;
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(940, t + 0.25); o.frequency.linearRampToValueAtTime(760, t + 0.9); o.frequency.linearRampToValueAtTime(380, t + 1.4);
    o2.frequency.setValueAtTime(527, t); o2.frequency.linearRampToValueAtTime(955, t + 0.25); o2.frequency.linearRampToValueAtTime(350, t + 1.4);
    f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.2; env(g, t, 0.03, 1.4, (vol || 0.9) * 0.3);
    o.connect(ws); o2.connect(ws); ws.connect(f); f.connect(g); g.connect(out(pan, 0.7)); o.start(t); o2.start(t); o.stop(t + 1.6); o2.stop(t + 1.6);
    nz(t, 1.2, 'bandpass', 2600, 1600, 2, (vol || 0.9) * 0.2, pan, 0.6, 0.05);
  };
  A.breakerSnd = function () { if (!ctx) return; const t = ctx.currentTime; A.bang(0.7, 0); tone(t + 0.15, 2.5, 'sawtooth', 30, 120, 0.12, 0, 0.5, 0.6); for (let i = 0; i < 6; i++) nz(t + 0.4 + i * 0.3 + Math.random() * 0.2, 0.03, 'highpass', 4000, 0, 1, 0.12, Math.random() * 2 - 1, 0.6); };
  A.powerDown = function () { if (!ctx) return; const t = ctx.currentTime; tone(t, 1.8, 'sawtooth', 120, 22, 0.2, 0, 0.6, 0.02); A.bang(0.6, 0); };
  A.paper = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.12, 'highpass', 2200, 0, 1, 0.1, 0, 0.1, 0.03); nz(t + 0.1, 0.1, 'highpass', 3200, 0, 1, 0.07, 0, 0.1, 0.03); };
  A.punch = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.05, 'bandpass', 1200, 500, 3, 0.4, 0, 0.3); tone(t + 0.04, 0.1, 'sine', 180, 70, 0.4, 0, 0.3); tone(t + 0.22, 0.08, 'square', 1760, 0, 0.05, 0, 0.2); };
  A.grunt = function (pan, vol) { if (!ctx) return; const t = ctx.currentTime; const o = tone(t, 0.5, 'sawtooth', 70 + Math.random() * 20, 48, (vol || 0.3), pan, 0.5, 0.05); nz(t, 0.5, 'bandpass', 500, 300, 2, (vol || 0.3) * 0.9, pan, 0.5, 0.08); };
  A.pant = function (vol, inh) { if (!ctx) return; const t = ctx.currentTime; nz(t, inh ? 0.28 : 0.36, 'bandpass', inh ? 1700 : 900, inh ? 2300 : 600, 1.6, vol, 0, 0.05, 0.1); };
  A.drip = function (pan) { if (!ctx) return; if (A.sample('drip', 0.35, pan, 0.8, 0.8 + Math.random() * 0.5)) return; const t = ctx.currentTime; tone(t, 0.07, 'sine', 900 + Math.random() * 600, 2200, 0.1, pan, 0.9); };
  A.lift = function (pan) { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.5, 'bandpass', 500, 1400, 6, 0.3, pan, 0.4, 0.05); A.rattle(pan); };

  A.shot = function () {
    if (!ctx) return; const t = ctx.currentTime;
    nz(t, 0.5, 'lowpass', 5200, 260, 0.8, 1.3, 0, 0.9, 0.001); nz(t, 0.09, 'highpass', 1800, 0, 1, 0.9, 0, 0.5, 0.001); tone(t, 0.32, 'sine', 150, 34, 1.4, 0, 0.6, 0.001); tone(t, 0.12, 'square', 90, 40, 0.5, 0, 0.5, 0.001);
  };
  A.dry = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.03, 'bandpass', 2200, 0, 6, 0.3, 0, 0.1); };
  A.reload = function () { if (!ctx) return; const t = ctx.currentTime; A.latch(0.2); nz(t + 0.45, 0.04, 'bandpass', 1600, 800, 4, 0.25, 0.2, 0.2); nz(t + 0.75, 0.04, 'bandpass', 1700, 800, 4, 0.25, 0.2, 0.2); tone(t + 1.3, 0.07, 'sine', 210, 90, 0.3, 0.2, 0.2); nz(t + 1.3, 0.05, 'bandpass', 1200, 500, 3, 0.3, 0.2, 0.2); };
  A.buzz = function () { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 2; i++) tone(t + i * 0.34, 0.2, 'square', 158, 150, 0.09, -0.3, 0.02, 0.01); };
  // Greta on the phone: thinner, higher than the radio
  A.phone = function (syll) {
    if (!ctx) return; const t = ctx.currentTime; let tt = t + 0.05;
    for (let i = 0; i < syll; i++) {
      const d = 0.05 + Math.random() * 0.06, f = 300 + Math.random() * 260;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f, tt); o.frequency.linearRampToValueAtTime(f * (0.85 + Math.random() * 0.4), tt + d);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500 + Math.random() * 1400; bp.Q.value = 6;
      const g = ctx.createGain(); env(g, tt, 0.008, d, 0.3); o.connect(bp); bp.connect(g); g.connect(out(-0.3, 0.02)); o.start(tt); o.stop(tt + d + 0.05);
      tt += d + (Math.random() < 0.2 ? 0.13 : 0.012);
    }
  };
  A.keyBeep = function (ok) { if (!ctx) return; const t = ctx.currentTime; tone(t, 0.07, 'square', ok === 2 ? 1320 : ok === 0 ? 180 : 880, 0, 0.06, 0, 0.05); if (ok === 2) tone(t + 0.09, 0.12, 'square', 1760, 0, 0.06, 0, 0.05); if (ok === 0) tone(t + 0.1, 0.2, 'square', 140, 0, 0.07, 0, 0.05); };
  A.sw = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.03, 'bandpass', 1500, 700, 3, 0.4, 0, 0.3); tone(t, 0.05, 'sine', 240, 110, 0.3, 0, 0.3); };
  A.steam = function (pan, vol) { if (!ctx) return; const t = ctx.currentTime; nz(t, 1.4, 'highpass', 2600, 5200, 0.7, (vol || 0.3), pan, 0.5, 0.08); };
  A.page = function () { if (!ctx) return; const t = ctx.currentTime; nz(t, 0.22, 'highpass', 1800, 4200, 1, 0.12, 0, 0.2, 0.05); };
  A.music = function (kind) {      // tiny music-box phrase for the storybook
    if (!ctx) return; const t = ctx.currentTime, notes = kind ? [659, 622, 659, 494, 587, 523, 440] : [440, 523, 659, 880, 831, 659, 523, 494];
    notes.forEach((f, i) => { tone(t + i * 0.42, 1.4, 'sine', f, f, 0.07, (i % 2 ? 0.3 : -0.3), 0.8, 0.005); tone(t + i * 0.42, 0.5, 'triangle', f * 2.01, f * 2.01, 0.025, 0, 0.8, 0.005); });
  };
  A.grind = function (v) { if (ctx && L.grind) { sm(L.grind.gain, v, 0.4); } };

  // ---- loops ----
  function loopNoise(ftype, freq, q) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = q || 1; const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); s.start(); return { g, f }; }
  function loopOsc(type, freq) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; const g = ctx.createGain(); g.gain.value = 0; o.connect(g); o.start(); return { g, o }; }
  function startLoops() {
    // drone
    const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 170; L.droneF = dl; L.drone = ctx.createGain(); L.drone.gain.value = 0; dl.connect(L.drone); L.drone.connect(master); const ds = ctx.createGain(); ds.gain.value = 0.5; L.drone.connect(ds); ds.connect(rev);
    [[55, 'sawtooth', 0.5], [82.2, 'sawtooth', 0.3], [36.7, 'sine', 0.9], [110.6, 'triangle', 0.2]].forEach(([f, ty, v]) => { const o = loopOsc(ty, f); o.g.gain.value = v; o.g.connect(dl); });
    // insanity cluster
    L.ins = ctx.createGain(); L.ins.gain.value = 0; L.ins.connect(master); const is = ctx.createGain(); is.gain.value = 0.8; L.ins.connect(is); is.connect(rev);
    [3120, 3251, 2210, 466, 493].forEach((f, i) => { const o = loopOsc(i < 3 ? 'sine' : 'sawtooth', f); o.g.gain.value = i < 3 ? 0.25 : 0.12; o.g.connect(L.ins); });
    // mains hum
    L.hum = ctx.createGain(); L.hum.gain.value = 0; L.hum.connect(master); const h1 = loopOsc('triangle', 120); h1.g.gain.value = 0.5; h1.g.connect(L.hum); const h2 = loopOsc('square', 60); h2.g.gain.value = 0.1; h2.g.connect(L.hum);
    // wind / cooler / scrape
    L.wind = loopNoise('lowpass', 380, 0.7); L.wind.g.connect(master);
    L.cool = loopNoise('lowpass', 95, 1); L.cool.g.connect(master); const cs = loopOsc('sine', 48); cs.g.gain.value = 0.6; cs.g.connect(L.cool.g);
    L.scr = loopNoise('bandpass', 2300, 9); L.scrPan = ctx.createStereoPanner(); L.scr.g.connect(L.scrPan); L.scrPan.connect(master); const ss = ctx.createGain(); ss.gain.value = 0.7; L.scrPan.connect(ss); ss.connect(rev);
    L.scr2 = loopNoise('bandpass', 760, 5); L.scr2.g.connect(L.scrPan);
    // render line: grinding machinery
    L.grind = ctx.createGain(); L.grind.gain.value = 0; L.grind.connect(master); const gs = ctx.createGain(); gs.gain.value = 0.5; L.grind.connect(gs); gs.connect(rev);
    { const o1 = loopOsc('sawtooth', 41); o1.g.gain.value = 0.5; const o2 = loopOsc('sawtooth', 61.5); o2.g.gain.value = 0.3; const lf = ctx.createOscillator(); lf.frequency.value = 7.3; const lg = ctx.createGain(); lg.gain.value = 9; lf.connect(lg); lg.connect(o1.o.frequency); lf.start();
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; o1.g.connect(lp); o2.g.connect(lp); lp.connect(L.grind); const n = loopNoise('bandpass', 900, 1.2); n.g.gain.value = 0.35; n.g.connect(L.grind); }
    // chase bed
    L.chase = ctx.createGain(); L.chase.gain.value = 0; L.chase.connect(master); const ch = ctx.createGain(); ch.gain.value = 0.3; L.chase.connect(ch); ch.connect(rev);
    [185, 196, 277.2].forEach(f => { const o = loopOsc('sawtooth', f); o.g.gain.value = 0.16; const lf = ctx.createOscillator(); lf.frequency.value = 5 + Math.random() * 2; const lg = ctx.createGain(); lg.gain.value = 4; lf.connect(lg); lg.connect(o.o.frequency); lf.start(); o.g.connect(L.chase); });
  }
  let beatT = 0, beatN = 0, hbT = 0, breathT = 0, breathIn = false, dripT = 3, windPh = 0;
  const sm = (param, v, k) => { param.setTargetAtTime(v, ctx.currentTime, k || 0.3); };
  /* s: {power, outdoor, cold, ins(0..1), fear(0..1), chase(0..1), scrape(0..1), scrapePan, tired(0..1), dead, muffled} */
  A.update = function (dt, s) {
    if (!ctx) return;
    const q = s.dead ? 0 : 1;
    sm(L.drone.gain, q * (0.11 + 0.1 * s.ins + 0.05 * s.fear)); sm(L.droneF.frequency, 150 + 260 * s.ins + 120 * s.chase, 0.6);
    sm(L.ins.gain, q * Math.max(0, s.ins - 0.35) * 0.05);
    sm(L.hum.gain, q * s.power * (s.outdoor ? 0.004 : 0.022));
    windPh += dt; sm(L.wind.g.gain, q * (s.outdoor ? 0.16 : 0.025) * (0.7 + 0.3 * Math.sin(windPh * 0.6) + 0.2 * Math.sin(windPh * 1.7)), 0.5); sm(L.wind.f.frequency, 300 + 160 * Math.sin(windPh * 0.4), 0.5);
    sm(L.cool.g.gain, q * (s.cold ? 0.22 * (0.3 + 0.7 * s.power) + 0.04 : 0), 0.8);
    sm(L.scr.g.gain, q * s.scrape * (0.5 + Math.random() * 0.5) * 0.13, 0.06); sm(L.scr2.g.gain, q * s.scrape * 0.1, 0.1); L.scrPan.pan.value = s.scrapePan || 0;
    sm(L.chase.gain, q * s.chase * 0.5, 0.25);
    // chase pulse
    if (s.chase > 0.08 && q) {
      if (beatT < ctx.currentTime) beatT = ctx.currentTime;
      while (beatT < ctx.currentTime + 0.12) {
        const acc = beatN % 4 === 0; tone(beatT, 0.13, 'sine', acc ? 110 : 82, 36, s.chase * (acc ? 0.75 : 0.42), 0, 0.15);
        if (beatN % 2 === 1) nz(beatT, 0.04, 'highpass', 5000, 0, 1, s.chase * 0.1, 0, 0.2);
        if (beatN % 16 === 6 || beatN % 16 === 14) tone(beatT, 0.35, 'sawtooth', 739.9, 698.5, s.chase * 0.1, beatN % 16 === 6 ? -0.5 : 0.5, 0.7);
        beatT += 0.178; beatN++;
      }
    }
    // heartbeat
    hbT -= dt; if (hbT <= 0 && q) { if (s.fear > 0.12) A.thump(0.25 + 0.55 * s.fear); hbT = 1.15 - 0.72 * s.fear; }
    // breathing
    breathT -= dt; if (breathT <= 0 && q) { const v = Math.max(s.tired, s.fear * 0.5) * 0.13; if (v > 0.02) { breathIn = !breathIn; A.pant(v, breathIn); } breathT = 0.62 - 0.3 * s.tired; }
    dripT -= dt; if (dripT <= 0 && q) { if (!s.outdoor) A.drip(Math.random() * 2 - 1); dripT = 2 + Math.random() * 7; }
  };
})();
