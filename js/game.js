'use strict';
/* THE PYRAMID — six fears, climbed one at a time. After K. Weissel, "Die Pyramide des Grauens" (1823), from the Silent Witness Archive. */
(function () {
  const T = HW.T, c = HW.c, A = HW.A, U = HW.U, B = HW.B, PI = Math.PI, LC = HW.LC;
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const wrapA = a => { while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI; return a; };
  let M = null, PU, C = {};
  const P = HW.P = { x: 0, z: 0, y: 0, yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, eye: 1.62, vx: 0, vz: 0, stam: 100, exhaust: false, regenT: 0, flash: false, bob: 0, speed: 0, stepAcc: 0, fd: new THREE.Vector3(0, 0, -1) };
  const S = HW.S = { mode: 'load', ch: 0, timers: [], subQ: [], subT: 0, hintT: 0, objT: 0, holdT: 0, cur: null, t: 0, fade: 0, nolock: false, sens: 1, mx: 0, mIn: false, slow: 1, fogCol: new THREE.Color(0), fogFar: 16, ins: 0.05, cold: 0.2, chase: 0, fear: 0, flashT: 0, torch: true, meter: -1 };
  const K = {}, CH = [];
  let ghost = null;
  const SEAL = '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="4"><circle cx="100" cy="100" r="92"/><polygon points="100,14 181.8,73.4 150.5,169.6 49.5,169.6 18.2,73.4"/><ellipse cx="100" cy="82" rx="36" ry="19"/><circle cx="100" cy="82" r="9" fill="currentColor"/><path d="M100 162 L100 112 M100 162 L86 116 M100 162 L114 116 M100 162 L73 124 M100 162 L127 124"/></svg>';
  const SUBL = {
    all: ['PERSIST', 'WE KEEP EVERYTHING', 'WE CORRECT NOTHING', 'YOU WERE SEEN', 'YOU WERE NOT SAVED', '0.86', 'BURN THE NUMBER', 'THE LAST PAGE IS NOT OURS', 'GIVE IT UP', 'CLIMB', 'THE ARCHIVIST IS STILL WATCHING'],
    lv: [['IT WAS NOT A COAT', 'DO NOT LOOK UNDER THE BED', 'SOMEONE IS HOME'], ['IT IS ONLY ARRIVING', 'NOBODY WILL REACH DOWN', '07:50'], ['NOTHING HAS CHANGED', 'GO BACK', 'YOU ARE BEING REMEMBERED'], ['DO NOT LIGHT IT', 'KINDER THAN AN EMPTY ROOM', 'KNEEL'], ['THERE HE IS', 'TAKE THE CROWN', 'WE ARE NOT CRUEL', 'WE ARE NECESSARY'], ['NO ONE IS WATCHING', 'NOTHING IS COMING', 'PERSIST']],
    ask: ['What frightened you first? Bring it up with you. We keep everything.', 'The body is the first thing we ask you to give up.', 'You will be told what you saw. Agree.', 'Light the candles. Something has to be believed in.', 'Every year, one. This year, you.', 'There is no one at the top. We built the pyramid so that you would not notice.']
  };
  S.sublT = 9;
  function mkGhost() { ghost = HW.makePerson({ coat: 3, face: -1, hood: 1, scale: 1.08 }); ghost.root.visible = false; ghost.M = M; HW.scene.add(ghost.root); M.dyn.push(ghost.root); }
  // a hooded figure, standing off to one side for a few frames
  function glimpse() {
    if (!ghost || ghost.M !== M) return false;
    for (let k = 0; k < 14; k++) {
      const a = P.yaw + (Math.random() < 0.5 ? -1 : 1) * (k < 6 ? 0.3 + Math.random() * 0.45 : Math.random() * 0.3), d = (k < 6 ? 4.5 : 3) + Math.random() * 5, x = P.x - Math.sin(a) * d, z = P.z - Math.cos(a) * d, Z = HW.zoneAt(x, z);
      if (!Z || Z.noWalk || !HW.los(P.x, P.z, x, z)) continue;
      ghost.root.position.set(x, Z.fh || 0, z); ghost.root.rotation.y = Math.atan2(P.x - x, P.z - z); ghost.root.visible = true; ghost.pose(0.016, 0, S.t, 'idle');
      const am = HW.ambAt(x, z); ghost.setAmb(am[0] * 0.5 + 0.012, am[1] * 0.5 + 0.012, am[2] * 0.5 + 0.016); S.ghostOn = 0.15; return true;
    }
    return false;
  }
  function subliminal() {
    const r = Math.random(), el = $('subl'); if (r < 0.22 && glimpse()) return 'glimpse';
    let kind = 'text';
    if (r >= 0.24 && r < 0.4) { el.innerHTML = SEAL; el.className = 'seal'; kind = 'seal'; } else { const pool = Math.random() < 0.6 ? SUBL.lv[S.ch] : SUBL.all; el.textContent = pool[(Math.random() * pool.length) | 0]; el.className = ''; }
    el.style.left = (36 + Math.random() * 28) + '%'; el.style.top = (32 + Math.random() * 32) + '%'; el.style.opacity = 0.45 + Math.random() * 0.3; S.sublOn = 0.09; if (Math.random() < 0.45) A.rwhisper(0.22); return kind;
  }
  const tileOf = v => Math.floor(v / T);
  const after = (s, fn) => S.timers.push({ t: s, fn });
  function look(y, p) { P.yaw = P.tyaw = y; P.pitch = P.tpitch = p || 0; }
  function spawn(tx, tz, yaw) { P.x = c(tx); P.z = c(tz); look(yaw, 0); P.vx = P.vz = 0; const Z = HW.zoneAt(P.x, P.z); P.y = Z ? (Z.fh || 0) : 0; }
  function pan(x, z) { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); return { pan: clamp((dx * Math.cos(P.yaw) - dz * Math.sin(P.yaw)) / (d + 0.6), -1, 1), gain: clamp(1 - d / 20, 0, 1), d }; }
  function viewDot(x, z) { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz) + 1e-5; return (dx * -Math.sin(P.yaw) + dz * -Math.cos(P.yaw)) / d; }
  const dist = (x, z) => Math.hypot(x - P.x, z - P.z);
  const store = { set(k, v) { try { localStorage.setItem('pyr.' + k, v); } catch (e) { } }, get(k) { try { return localStorage.getItem('pyr.' + k); } catch (e) { return null; } } };
  S.subl = store.get('subl') !== '0';
  const zoneName = () => { const Z = HW.zoneAt(P.x, P.z); return Z ? Z.name : ''; };

  // ---------- UI ----------
  function say(lines, who) { (Array.isArray(lines) ? lines : [lines]).forEach(l => S.subQ.push({ who: who || '', text: l })); }
  function hint(t, s) { const h = $('hint'); h.textContent = t; h.style.opacity = 1; S.hintT = s || 7; }
  function objective(t) { const o = $('obj'); o.children[1].textContent = t; o.style.opacity = 1; S.objT = 9; }
  function updSubs(dt) {
    if (S.subT > 0) { S.subT -= dt; if (S.subT <= 0) $('sub').innerHTML = ''; }
    else if (S.subQ.length) { const s = S.subQ.shift(); S.subT = (1.9 + s.text.length * 0.052) * (S.subQ.length > 2 ? 0.78 : 1); $('sub').innerHTML = (s.who ? '<i>' + s.who + ':</i> ' : '') + s.text; if (s.who) A.count(s.text.length, 0, 0.1); }
    if (S.hintT > 0) { S.hintT -= dt; if (S.hintT <= 0) $('hint').style.opacity = 0; }
    if (S.objT > 0) { S.objT -= dt; if (S.objT <= 0) $('obj').style.opacity = 0.55; }
  }
  function showPaper(html, done) { $('sheet').innerHTML = html; $('paper').classList.add('show'); S.mode = 'paper'; S.paperDone = done || null; A.paper(); }
  function closePaper() { $('paper').classList.remove('show'); S.mode = 'play'; A.paper(); const f = S.paperDone; S.paperDone = null; if (f) f(); }
  function card(title, sub, done, quote) { $('cardT').textContent = title; $('cardS').textContent = sub; $('cardQ').innerHTML = quote || ''; $('card').classList.add('show'); S.mode = 'card'; S.cardDone = done; A.punch(); A.drum(0.45); unlockPtr(); }
  function closeCard() { if (S.mode !== 'card') return; $('card').classList.remove('show'); S.mode = 'play'; lockPtr(); const f = S.cardDone; S.cardDone = null; if (f) f(); }
  function flash(v) { S.flashT = v || 0.6; }
  const doneN = () => +(store.get('done') || 0);

  // ---------- chapter flow ----------
  function startChapter(i, quiet) {
    HW.unload(); S.timers = []; S.subQ = []; S.subT = 0; $('sub').innerHTML = ''; C = {}; S.ch = i; U.uPower.value = 0; S.slow = 1; S.ins = 0.05; S.cold = 0.2; S.chase = 0; S.fear = 0; S.torch = true; S.meter = -1; S.under = false; S.eye = 1.2; S.hintT = 0; $('hint').style.opacity = 0; P.flash = false; P.stam = 100; P.exhaust = false; S.cur = null;
    U.uDynCol.value[0].set(0, 0, 0); U.uDynCol.value[1].set(0, 0, 0);
    const ch = CH[i]; M = ch.build(); if (!ghost || ghost.M !== M) mkGhost(); S.sublT = 8 + Math.random() * 8; S.fogCol.set(ch.fog[0]); S.fogFar = ch.fog[1]; S.fade = 0;
    $('chap').textContent = 'LEVEL ' + ch.num + '  ·  ' + ch.en;
    const go = () => { S.mode = 'play'; if (ch.begin) ch.begin(); };
    if (quiet) go(); else card('LEVEL ' + ch.num, ch.de + '  —  ' + ch.fear, go, '<b>THE FELLOWSHIP</b>“' + SUBL.ask[i] + '”');
  }
  function complete() {
    if (S.mode !== 'play') return; const i = S.ch, ch = CH[i]; if (i + 1 > doneN()) store.set('done', i + 1); A.bell(0.3, 0);
    card(ch.en + '  —  GIVEN UP', 'RENOUNCED ' + (i + 1) + ' / 6.  ' + (i < 5 ? 'LEVEL ' + CH[i + 1].num + ' IS ABOVE YOU.' : 'THERE IS NO LEVEL SEVEN.'), () => { if (i < 5) startChapter(i + 1); else finale(); }, '“' + ch.quote + '”<br><span>K. Weissel, <i>Die Pyramide des Grauens</i>, 1823</span>');
  }
  function die(title, sub) { if (S.mode !== 'play') return; A.sting(true); card(title, sub, () => startChapter(S.ch, true)); }
  function finale() {
    S.mode = 'end'; unlockPtr(); const ch = store.get('choice');
    $('endTxt').innerHTML = 'Six levels. Trifles, the body, the mind, the uncanny, other people, nothing.<br><br>' + (ch === 'betray' ? 'On the fifth you pointed, and they took him instead. The gate opened for you.' : ch === 'crown' ? 'On the fifth you took the crown yourself. Nobody else was short that year.' : '') + '<br><br>On the sixth there was nothing at all, and you left a stone on it.<br><br>The Fellowship calls that six renunciations. The Archivist never asked for any of them.<br><br><b>“The only true horrors are other people and the absence of meaning.”</b><br><br>If nothing else, persist.<span>FROM THE SILENT WITNESS ARCHIVE</span>';
    $('end').classList.add('show'); tiers();
  }
  function person(o, tx, tz, yaw, L) { const r = HW.makePerson(o); r.x = c(tx); r.z = c(tz); r.yaw = yaw || 0; r.root.position.set(r.x, 0, r.z); r.root.rotation.y = r.yaw; L.dyn(r.root); return r; }
  function litPerson(r, k) { const a = HW.ambAt(r.x, r.z); k = k || 1; r.setAmb(a[0] * k + 0.006, a[1] * k + 0.006, a[2] * k + 0.008); }
  const intr = id => M.INT.find(o => o.id === id);

  // ================= I. TRIFLES =================
  CH.push({
    num: 'I', de: 'KLEINIGKEITEN', en: 'TRIFLES', fear: 'TRIVIAL FEARS', fog: [0x000000, 13], quote: 'We fear the small things first, because they are near.',
    build() {
      const D = [0.014, 0.014, 0.02], R = (name, floor, wall, step) => ({ name, floor, wall, ceil: 'ceil', h: 2.5, amb: D, step });
      const ZD = { b: R('bedroom', 'floor_carpet', 'wallpaper', 'soft'), c: R('landing', 'wood', 'wallpaper', 'soft'), t: R('bathroom', 'floor_tile', 'wall_tile', 'tile'), k: R('kitchen', 'floor_lino', 'plaster', 'tile'), s: { name: 'cellar', floor: 'floor_conc', wall: 'wall_brick', ceil: 'wood', h: 2.2, amb: [0.008, 0.008, 0.011], step: 'conc' } };
      const L = HW.newLevel(16, 17, ZD, {}), m = L.M;
      L.rect('b', 2, 2, 5, 5); L.rect('c', 7, 2, 7, 10); L.rect('t', 9, 2, 11, 4); L.rect('k', 9, 7, 13, 10); L.rect('s', 4, 12, 10, 14);
      L.door('bed', 6, 4); L.door('bath', 8, 3); L.door('kit', 8, 8); L.door('cellar', 7, 11);
      L.ceilLight(3.5, 3.5, LC.WARM, 0.8, 6, 0, 1); L.ceilLight(7, 4.5, LC.WARM, 0.6, 5, 0, 1); L.ceilLight(7, 8.5, LC.WARM, 0.6, 5, 0, 1); L.ceilLight(10, 3, LC.FL, 0.7, 5, 0, 1); L.ceilLight(11, 8.5, LC.WARM, 0.8, 6.5, 0, 1); L.ceilLight(7, 13, LC.WARM, 0.7, 7, 0, 1);
      L.light(c(2) + 0.2, 1.7, c(3), [0.4, 0.5, 0.85], 1.0, 5); L.card('white', 2 * T + 0.03, 1.1, c(3), 1.0, 1.1, PI / 2, null, 1);
      L.light(c(13) + 0.3, 0.9, c(7.3), [0.3, 0.4, 1.0], 0.6, 3.5);
      L.box('white', c(3), 0.3, c(4.6), 1.1, 0.5, 2.0, 0, 'fit', 1); L.box('wood', c(3), 0.45, c(5.6) + 0.1, 1.2, 0.9, 0.1); L.shelf(c(5.3) + 0.2, c(2.5), 1.6, true, 'shelf'); L.chair(c(4.6), c(2.4), 0.4);
      L.box('white', c(10), 0.45, 2 * T + 0.35, 0.6, 0.9, 0.5, 0, 'fit', 1); L.box('white', c(11.3), 0.3, c(3.9), 0.75, 0.6, 1.5, 0, 'fit', 1);
      L.table(c(11.5), c(9), 1.4, 0.8); L.chair(c(11.5), c(9.8), 0); L.box('metal_green', c(9.6), 0.45, 7 * T + 0.3, 1.6, 0.9, 0.55, 0, 'fit', 1); L.box('white', c(13) + 0.45, 0.9, c(7.3), 0.6, 1.8, 0.6, 0, 'fit', 1);
      L.crate(c(5), c(12.3), 2); L.barrel(c(8.6), c(14.3)); L.shelf(c(6.5), 15 * T - 0.24, 2.4, false, 'boxes', 1.8);
      L.card('breaker', 4 * T + 0.03, 0.9, c(13.2), 0.7, 0.7, PI / 2); L.inter('fuse', 4 * T + 0.3, 1.3, c(13.2), 'RESET THE FUSE', 1.8, 1.9);
      L.card('seal', 11 * T - 0.03, 0.45, c(13), 1.3, 1.3, -PI / 2); L.card('seal', c(4), 0.9, 2 * T + 0.03, 0.5, 0.5, 0); L.box('barley', c(7), 2.0, 11 * T + 0.06, 0.36, 0.4, 0.08);
      L.inter('bedside', c(3), 0.6, c(4.6), 'GO BACK TO BED', 0, 1.7);
      m.props = [];
      C.figs = [[7, 2.1, 0, 'A coat on its hook. It was a coat.'], [12.6, 7.9, -1.9, 'The broom, with an apron hung over the handle.'], [9.7, 13.6, -1.57, 'The boiler. Somebody left a hat on it.']].map(([tx, tz, yaw, txt]) => {
        const r = person({ coat: 3, face: -1, hat: txt.indexOf('hat') > 0 }, tx, tz, yaw, L);
        const pr = HW.dynGroup(() => { B.box('wood', 0, 0.9, 0, 0.06, 1.8, 0.06); B.box('wood', 0, 1.62, 0, 0.5, 0.05, 0.05); B.box('dark', 0, 1.15, 0.06, 0.46, 0.95, 0.12); }); pr.position.set(r.x, 0, r.z); pr.rotation.y = yaw; pr.visible = false; L.dyn(pr);
        return { r, pr, txt, done: false };
      });
      L.finish(); spawn(3.6, 3.4, -PI / 2); return m;
    },
    begin() { P.flash = true; objective('The power is out. The fuse box is in the cellar.'); after(1.2, () => say(['The power is out again.', 'The fuse box is in the cellar. Of course it is.'])); hint('F — torch.   E — use.   WASD — move.   SHIFT — run.', 9); },
    use(o) {
      if (o.id === 'bedside') return say(C.on ? 'Not tired any more.' : 'Not with the lights out.');
      if (o.id === 'fuse') { o.on = false; C.on = true; A.breakerSnd(); objective('The lights are on.'); after(1.5, () => say(['The lights come on.', 'A coat. A broom. A boiler.', 'Nothing was there. I was afraid anyway.'])); after(11, complete); }
    },
    tick(dt) {
      const zn = zoneName(); let near = 0;
      for (const f of C.figs) {
        if (f.done) { HW.setAmb(f.pr, ...HW.ambAt(f.r.x, f.r.z)); continue; }
        const d = dist(f.r.x, f.r.z); if (d < 7 && HW.los(P.x, P.z, f.r.x, f.r.z)) near = Math.max(near, 1 - d / 7);
        const lookAt = (C.on || (P.flash && !(C.flick > 0))) && d < (C.on ? 6 : 2.1) && viewDot(f.r.x, f.r.z) > 0.82 && HW.los(P.x, P.z, f.r.x, f.r.z); f.lk = lookAt ? (f.lk || 0) + dt : 0;
        if (f.lk > 0.45) { f.done = true; f.r.root.visible = false; f.pr.visible = true; A.thump(0.3); say(f.txt); }
        f.r.pose(dt, 0, S.t, 'idle'); f.r.setAmb(0.004, 0.004, 0.006);
      }
      S.fear = C.on ? 0 : near * 0.8; S.ins = C.on ? 0.02 : 0.08 + near * 0.2;
      if (!C.e1 && zn === 'landing') { C.e1 = 1; A.creak(-0.6, 0.09); }
      if (!C.e2 && zn === 'landing' && tileOf(P.z) >= 7) { C.e2 = 1; A.bang(0.45, -0.4); after(0.8, () => say('Something fell over upstairs. Things fall over.')); }
      if (!C.e3 && zn === 'cellar') { C.e3 = 1; C.flick = 2.2; A.click(); after(0.5, () => say('Not now. Not now.')); }
      if (!C.e4 && zn === 'bathroom') { C.e4 = 1; A.drip(0.5); after(0.7, () => A.drip(0.4)); say('The tap. It has always dripped.'); }
      if (C.flick > 0) C.flick -= dt;
      S.torch = !(C.flick > 0.2 && Math.sin(C.flick * 40) > -0.6);
      if (C.on) U.uPower.value = Math.min(1, U.uPower.value + dt * 1.5);
    }
  });

  // ================= II. THE BODY =================
  CH.push({
    num: 'II', de: 'DER LEIB', en: 'THE BODY', fear: 'PHYSICAL THREATS', fog: [0x39424a, 17], quote: 'The body is honest. It is afraid of exactly what can end it.',
    build() {
      const AMB = [0.13, 0.15, 0.18], O = { out: 1, open: 1, amb: AMB };
      const ZD = { p: Object.assign({ name: 'dyke', floor: 'floor_mud', fh: 0.55, step: 'mud' }, O), w: Object.assign({ name: 'pan', floor: 'sand', fh: -0.9, step: 'wet', side: 'floor_mud' }, O), e: Object.assign({ name: 'wall', floor: 'quay', fh: 1.7, step: 'conc', side: 'stone' }, O), h: Object.assign({ name: 'shed', floor: 'wood', fh: 0.55, step: 'soft' }, O) };
      const L = HW.newLevel(46, 16, ZD, {}), m = L.M;
      L.rect('w', 1, 1, 44, 14);
      for (const [x0, z0, x1, z1] of [[5, 8, 12, 8], [12, 3, 12, 8], [12, 3, 22, 3], [22, 3, 22, 12], [22, 12, 32, 12], [32, 6, 32, 12], [32, 6, 41, 6]]) L.rect('p', x0, z0, x1, z1);
      for (const [x, z] of [[17, 3], [18, 3], [27, 12], [28, 12], [32, 9]]) L.set('w', x, z);
      L.rect('h', 2, 7, 4, 9); L.rect('e', 42, 4, 44, 8);
      for (const [x, z] of [[6, 8], [9, 8], [12, 7], [12, 4], [15, 3], [20, 3], [22, 5], [22, 8], [22, 11], [25, 12], [30, 12], [32, 11], [32, 7], [35, 6], [38, 6], [41, 6]]) L.lamp(x, z, { h: 2.3, col: LC.COLD, I: 0.42, R: 6.5, dx: 0.55, dz: 0.55 });
      L.lamp(43, 6, { h: 4.0, I: 0.9, R: 11 });
      L.box('wall_wood', 2 * T + 0.1, 1.7, c(8), 0.2, 2.3, 4.8); L.box('wall_wood', c(3), 1.7, 7 * T + 0.1, 4.8, 2.3, 0.2); L.box('wall_wood', c(3), 1.7, 10 * T - 0.1, 4.8, 2.3, 0.2); L.box('wood', c(3), 2.9, c(8), 5.0, 0.12, 5.0);
      L.card('seal', 2 * T + 0.22, 1.0, c(8), 1.2, 1.2, PI / 2); L.card('seal', 42 * T - 0.03, 0.3, c(6), 1.3, 1.3, -PI / 2);
      C.watch = [5, 6, 7].map(z => { const r = person({ coat: 3, face: -1, hood: 1 }, 43.7, z, -PI / 2, L); r.root.position.y = 1.7; return r; });
      L.light(c(3), 2.2, c(8), LC.WARM, 1.6, 6); L.crate(c(2.6), c(7.5), 2); L.box('box2', c(2.6), 0.9, c(7.5), 0.7, 0.7, 0.7);
      C.water = HW.dynGroup(() => B.quad('water', [0, 0, 16 * T], [46 * T, 0, 16 * T], [46 * T, 0, 0], [0, 0, 0], [0, 1, 0], [0, 0, 46, 16], 1, 1)); L.dyn(C.water); HW.setAmb(C.water, 0.3, 0.36, 0.42);
      L.finish(); spawn(3.6, 8, -PI / 2); return m;
    },
    begin() { C.t = 0; C.air = 6; objective('The tide is coming in. Follow the lamps along the dyke to the sea wall.'); after(1, () => say(['The salt marsh, an hour too late.', 'The lamps mark the dyke. The sea wall is at the far end.'])); hint('SHIFT — run. Stay on the dyke: the pans are deep mud, and the tide fills them first.', 10); },
    tick(dt) {
      C.t += dt; C.wy = -0.6 + C.t * 0.035; C.water.position.y = C.wy; const depth = C.wy - P.y;
      S.slow = (depth > 0.15 ? clamp(1 - depth * 0.5, 0.32, 1) : 1) * (zoneName() === 'pan' ? 0.62 : 1); S.cold = 0.3 + clamp(depth, 0, 1.3) * 0.4; S.fear = clamp(depth / 1.3, 0, 1); S.ins = 0.05 + clamp(depth, 0, 1.5) * 0.12;
      const under = C.wy > P.y + P.eye * 0.93; S.under = under;
      if (under) { C.air -= dt; if (C.air <= 0) return die('DROWNED', 'THE TIDE DOES NOT HATE YOU. IT IS ONLY ARRIVING.'); } else C.air = Math.min(6, C.air + dt * 2.5);
      S.meter = C.air < 5.9 ? C.air / 6 : -1;
      if (depth > 0.1 && P.speed > 0.5) { C.sl = (C.sl || 0) - dt; if (C.sl <= 0) { C.sl = 0.5; A.step('wet', 0.2 + clamp(depth, 0, 1) * 0.2, 0); } }
      if (!C.m1 && C.t > 30) { C.m1 = 1; say('The dyke is going under.'); }
      if (!C.m2 && depth > 0.8) { C.m2 = 1; say('To the waist. It is very cold. It is not interested in me.'); }
      if (!C.m3 && depth > 1.25) { C.m3 = 1; say('Keep the lamp in sight. Keep moving.'); A.sting(false); }
      for (const r of C.watch) { r.headYaw = clamp(wrapA(Math.atan2(P.x - r.x, P.z - r.z) - r.yaw), -1.2, 1.2); r.pose(dt, 0, S.t, 'idle'); r.setAmb(0.05, 0.056, 0.07); }
      if (!C.up && zoneName() === 'wall') { C.up = 1; A.drum(0.4); say(['Stone. Dry stone.', 'They stood up here with their lamps the whole way. Nobody reached down.']); after(8, complete); }
      C.chantUp = C.up ? 0.2 : clamp((P.x / T - 30) / 40, 0, 0.14);
    }
  });

  // ================= III. THE MIND =================
  const ANOM = ['Nothing had changed.', 'The clock had changed.', 'The portrait had gone dark.', 'The number on the door was different.', 'A chair was missing.', 'There was a chair in the middle of the floor.', 'The far light was red.', 'Someone was standing at the end.', 'The vase was gone.', 'The note on the table said something else.', 'The corridor was longer.'];
  function corridor(an) {
    HW.unload(); C.an = an; const len = an === 10 ? 17 : 13, x1 = 2 + len;
    const ZD = { c: { name: 'corridor', floor: 'floor_carpet', wall: 'wallpaper', ceil: 'ceil', h: 2.6, amb: [0.03, 0.028, 0.026], step: 'soft' } };
    const L = HW.newLevel(24, 7, ZD, {}), m = L.M; L.rect('c', 2, 2, x1, 3);
    L.ceilLight(4.5, 2.5, LC.WARM, 0.7, 6); L.ceilLight(9, 2.5, LC.WARM, 0.7, 6); L.ceilLight(x1 - 1.5, 2.5, an === 6 ? LC.RED : LC.WARM, 0.7, 6);
    L.sign([an === 1 ? '10:01' : '10:10'], '#d8d2c0', '#1a1a1a', c(4.5), 1.5, 2 * T + 0.03, 0.5, 0.5, 0, 22);
    if (an === 2) L.sign([' '], '#070707', '#070707', c(7), 1.2, 2 * T + 0.03, 0.8, 1.0, 0, 12); else L.sign(['A. CASTEL', 'DIRECTEUR', 'GÉNÉRAL'], '#3a2c20', '#c8b880', c(7), 1.2, 2 * T + 0.03, 0.8, 1.0, 0, 12);
    L.card('door2', c(10.5), 0, 2 * T + 0.03, 1.1, 2.2, 0); L.sign([an === 3 ? '3412' : '212'], '#c8b880', '#1a1a1a', c(10.5), 1.62, 2 * T + 0.05, 0.42, 0.2, 0, 17);
    if (an !== 4) L.chair(c(6), 4 * T - 0.35, PI); L.chair(c(12.5), 4 * T - 0.35, PI); if (an === 5) L.chair(c(8.6), c(2.6), 0.8);
    L.table(c(9.2), 4 * T - 0.32, 0.6, 0.4); if (an !== 8) { L.box('violet', c(9.2), 0.94, 4 * T - 0.32, 0.14, 0.3, 0.14); L.box('barley', c(9.2), 1.25, 4 * T - 0.32, 0.3, 0.4, 0.3, 0.5); }
    L.table(c(2.3), 2 * T + 0.36, 0.5, 0.5); L.box('white', c(2.3), 0.8, 2 * T + 0.36, 0.26, 0.02, 0.18); L.inter('note', c(2.3), 0.85, 2 * T + 0.36, 'READ THE NOTE', 0, 1.7);
    L.card('door2', 2 * T + 0.03, 0, c(2.5), 1.2, 2.2, PI / 2); L.card('seal', 2 * T + 0.05, 1.05, c(2.5), 0.6, 0.6, PI / 2); L.inter('back', 2 * T + 0.2, 1.1, c(2.5), 'GO BACK', 0, 1.5);
    L.card('door2', (x1 + 1) * T - 0.03, 0, c(2.5), 1.2, 2.2, -PI / 2); L.inter('on', (x1 + 1) * T - 0.2, 1.1, c(2.5), 'GO ON', 0, 1.5);
    L.sign(['CORRIDOR  ' + C.n + ' / 5'], '#1c1a16', '#c8b880', (x1 + 1) * T - 0.05, 2.26, c(2.5), 1.3, 0.26, -PI / 2, 13);
    if (an === 7) { C.fig = person({ coat: 3, face: -1 }, x1 - 0.2, 2.9, PI / 2, L); } else C.fig = null;
    L.finish(); M = m; mkGhost(); spawn(3.4, 2.5, -PI / 2); S.fade = 0; return m;
  }
  CH.push({
    num: 'III', de: 'DAS GEMÜT', en: 'THE MIND', fear: 'PSYCHOLOGICAL FEAR', fog: [0x000000, 22], quote: 'The third fear needs no object. The mind supplies one.',
    build() { C.n = 0; C.turn = 0; C.wrong = 0; C.pool = []; return corridor(0); },
    begin() { objective('Five corridors. If anything has changed, go back. If nothing has changed, go on.'); after(1, () => say(['A corridor. There is a note on the table behind me.'])); hint('Look carefully before you choose a door.', 7); },
    use(o) {
      if (o.id === 'note') return showPaper(C.an === 9 ? 'Look at everything.\n\nIf anything has changed, <b>go on</b>.\nIf nothing has changed, <b>go back</b>.\n\nYou are not being watched. You are only being remembered.' : 'Look at everything.\n\nIf anything has changed, <b>go back</b>.\nIf nothing has changed, <b>go on</b>.\n\nYou are not being watched. You are only being remembered.');
      if (o.id !== 'back' && o.id !== 'on') return;
      const right = (C.an !== 0) === (o.id === 'back'); A.latch(0); A.creak(0, 0.06);
      if (right) { C.n++; A.chime(true); if (C.n >= 5) { complete(); return; } const g = ['It has always said ten past.', 'There were always two chairs. I think.', 'I would know if it had changed. I would know.']; if (C.n >= 2) say(g[C.n - 2] || g[2]); }
      else { C.n = 0; C.wrong++; A.chime(false); flash(0.5); say(['No.', ANOM[C.an]]); }
      C.turn++; let an = 0;
      if (C.turn === 1) an = 4; else if (Math.random() < 0.64 || C.zero >= 1) { if (!C.pool.length) C.pool = [1, 2, 3, 5, 6, 7, 8, 9, 10].sort(() => Math.random() - 0.5); an = C.pool.pop(); }
      C.zero = an === 0 ? (C.zero || 0) + 1 : 0; corridor(an); objective('Corridor ' + C.n + ' of 5. Changed: go back. Unchanged: go on.');
    },
    tick(dt) { if (C.fig) { C.fig.pose(dt, 0, S.t, 'idle'); litPerson(C.fig, 0.6); } S.ins = 0.06 + C.wrong * 0.06 + C.n * 0.03; S.fear = C.an === 7 ? clamp(1 - dist(C.fig.x, C.fig.z) / 12, 0, 1) * 0.7 : 0; }
  });

  // ================= IV. THE UNCANNY =================
  CH.push({
    num: 'IV', de: 'DAS UNHEIMLICHE', en: 'THE UNCANNY', fear: 'THE SUPERNATURAL', fog: [0x000000, 24], quote: 'We invent the ghost because it is kinder than an empty room.',
    build() {
      const ZD = { n: { name: 'nave', floor: 'floor_tile', wall: 'stone', ceil: 'wood', h: 5, amb: [0.03, 0.03, 0.044], step: 'tile' } };
      const L = HW.newLevel(15, 19, ZD, {}), m = L.M; L.rect('n', 3, 3, 11, 14); L.rect('n', 7, 16, 7, 17);
      L.door('exit', 7, 15, { locked: 'It will not open. Not while the candles are out.' });
      for (let z = 7; z <= 11; z++) { L.bench(c(4.5), c(z), 3.0, false); L.bench(c(9.5), c(z), 3.0, false); }
      L.box('white', c(7), 0.5, c(3.3), 2.2, 1.0, 0.7, 0, 'fit', 2); L.box('wood', c(7), 2.6, 3 * T + 0.1, 0.12, 2.4, 0.08); L.box('wood', c(7), 3.2, 3 * T + 0.1, 0.9, 0.12, 0.08);
      L.card('glassw', c(5), 2.4, 3 * T + 0.03, 1.1, 2.2, 0); L.card('glassw', c(9), 2.4, 3 * T + 0.03, 1.1, 2.2, 0);
      L.light(c(7), 4, c(9), [0.35, 0.4, 0.7], 1.2, 11); L.light(c(5), 3, c(3.6), [0.4, 0.45, 0.8], 1.0, 7); L.light(c(9), 3, c(3.6), [0.4, 0.45, 0.8], 1.0, 7);
      C.vs = [[7, 4.25], [3.25, 5], [10.75, 5], [3.25, 13], [10.75, 13]].map(([tx, tz], i) => {
        const x = c(tx), z = c(tz); L.box('wood', x, 0.5, z, 0.3, 1.0, 0.3, 0, 'fit', 1); L.box('white', x, 1.07, z, 0.07, 0.14, 0.07); L.light(x, 1.7, z, LC.WARM, 6.5, 11, 1);
        const fl = HW.dynGroup(() => { B.card('candle', 0, 0, 0, 0.14, 0.3, 0); B.card('candle', 0, 0, 0, 0.14, 0.3, PI / 2); }, { emis: 1.5 }); fl.position.set(x, 1.0, z); fl.visible = false; L.dyn(fl);
        return { x, z, fl, lit: false, int: L.inter('v' + i, x, 1.1, z, 'LIGHT IT FROM YOURS', 1.5, 1.7), i };
      });
      const sh = HW.makePerson({}).shadow; L.dyn(sh); C.sh = { x: c(7), z: c(4.6), mesh: sh, wx: c(7), wz: c(9), yaw: 0 };
      L.decal('seal', c(7), c(9), 3.6, 0);
      C.cong = [[4, 7], [5, 8], [4.5, 9], [5, 10], [4, 11], [9, 7], [10, 8], [9.5, 9], [10, 10], [9, 11]].map(([tx, tz]) => { const r = person({ coat: 3, face: -1, hood: 1 }, tx, tz, PI, L); r.root.visible = false; return r; });
      L.finish(); spawn(7, 13.6, 0); return m;
    },
    begin() { C.lit = 0; C.order = []; P.flash = true; S.torch = false; objective('Five candles. Light them from yours.'); after(1, () => say(['A chapel with every candle out.', 'Something in here comes to the light.'])); hint('F — pinch your candle out, or light it again. Watch the floor.', 10); },
    use(o) {
      const v = C.vs.find(v => v.int === o); if (!v) return;
      if (!(P.flash && !(C.dark > 0))) return say('My own candle is out.');
      v.lit = true; v.fl.visible = true; o.on = false; C.lit++; C.order.push(v); A.chime(true);
      if (C.lit === 5) { C.done = true; M.doorAt[M.idx(7, 15)].locked = null; C.standT = 6; for (const r of C.cong) r.root.visible = true; A.bell(0.3, 0); A.drum(0.5); objective('The door.'); say(['Five. The floor is only a floor.', 'The pews are full. They have been full the whole time.']); after(7, () => say('It was only ever where the light was not.')); }
    },
    tick(dt) {
      const sh = C.sh, lit = P.flash && !(C.dark > 0); if (C.dark > 0) C.dark -= dt;
      let tx = sh.wx, tz = sh.wz, sp = 0.6; if (C.done) sp = 0; else if (lit) { tx = P.x; tz = P.z; sp = 1.28 + C.lit * 0.06; }
      const dx = tx - sh.x, dz = tz - sh.z, dl = Math.hypot(dx, dz);
      if (dl > 0.1) { sh.x += dx / dl * sp * dt; sh.z += dz / dl * sp * dt; sh.yaw = Math.atan2(dx, dz); } else if (!lit) { sh.wx = c(3.5 + Math.random() * 7); sh.wz = c(4 + Math.random() * 9); }
      const d = dist(sh.x, sh.z);
      if (!C.done && d < 0.85) {
        C.dark = 4; A.sting(true); flash(0.6); A.whoosh();
        if (C.order.length) { const v = C.order.pop(); v.lit = false; v.fl.visible = false; v.int.on = true; C.lit--; say('It went through me. A candle is out.'); } else say('It went through me. It is cold.');
        let bx = 0, bz = 0, bd = -1; for (const [x, z] of [[3.5, 3.5], [10.5, 3.5], [3.5, 13.5], [10.5, 13.5]]) { const dd = dist(c(x), c(z)); if (dd > bd) { bd = dd; bx = c(x); bz = c(z); } } sh.x = bx; sh.z = bz;
      }
      sh.mesh.visible = !C.done && ((lit && d < 11) || U.uPower.value > 0.15); sh.mesh.position.set(sh.x, 0.03, sh.z); sh.mesh.rotation.y = sh.yaw + PI; sh.mesh.scale.set(1.5, 1, 2.9);
      C.wT = (C.wT || 2) - dt; if (C.wT <= 0 && !C.done) { C.wT = 2.5 + Math.random() * 3; if (d < 7) { const pn = pan(sh.x, sh.z); A.whisper(pn.pan, 0.25 * pn.gain); } }
      for (const v of C.vs) if (v.lit) { v.fl.scale.y = 1 + Math.sin(S.t * 13 + v.i) * 0.12; }
      if (C.standT > 0) { C.standT -= dt; for (const r of C.cong) { r.headYaw = clamp(wrapA(Math.atan2(P.x - r.x, P.z - r.z) - r.yaw), -2.5, 2.5); r.pose(dt, 0, S.t, 'sit'); litPerson(r, 0.8); if (C.standT <= 0) r.root.visible = false; } }
      C.chantUp = C.standT > 0 ? 0.3 : C.lit * 0.02;
      S.fear = C.done ? 0 : clamp(1 - d / 7, 0, 1); S.chase = !C.done && lit && d < 6 ? 0.25 : 0; S.ins = 0.06 + S.fear * 0.2;
      U.uPower.value += (C.lit / 5 - U.uPower.value) * Math.min(1, dt * 2);
      const f = lit ? 3.4 + Math.sin(S.t * 17) * 0.2 + Math.sin(S.t * 7.3) * 0.2 : 0; S.eye = 4; U.uDynPos.value[0].set(P.x - Math.sin(P.yaw) * 0.35, P.y + 1.35, P.z - Math.cos(P.yaw) * 0.35); U.uDynCol.value[0].set(f, f * 0.72, f * 0.38);
      if (tileOf(P.z) >= 16) complete();
    }
  });

  // ================= V. OTHER PEOPLE =================
  CH.push({
    num: 'V', de: 'DIE ANDEREN', en: 'OTHER PEOPLE', fear: 'OTHER PEOPLE', fog: [0x1e1a17, 19], quote: 'They are not cruel. They are frightened of imbalance, and you are the balance.',
    build() {
      const ZD = { s: { name: 'square', floor: 'cobble', out: 1, amb: [0.1, 0.092, 0.085], step: 'conc' }, a: { name: 'lane', floor: 'cobble', out: 1, amb: [0.068, 0.066, 0.068], step: 'conc' }, i: { name: 'shed', floor: 'wood', wall: 'wall_wood', ceil: 'wood', h: 2.4, amb: [0.035, 0.03, 0.026], step: 'soft' }, x: { name: 'out', floor: 'floor_mud', out: 1, amb: [0.08, 0.088, 0.1], step: 'mud' } };
      const FAC = { default: { tex: 'facade', h: 6.4, vm: 6.4 }, F: { tex: 'facade2', h: 6.4, vm: 6.4 }, G: { tex: 'facade3', h: 6.4, vm: 6.4 } };
      const L = HW.newLevel(27, 22, ZD, FAC), m = L.M;
      L.solid('F', 0, 0, 11, 9); L.solid('G', 14, 0, 26, 9); L.solid('G', 0, 12, 11, 21); L.solid('F', 14, 11, 26, 21);
      L.rect('s', 9, 8, 16, 13); L.rect('a', 12, 2, 13, 7); L.rect('a', 12, 14, 13, 19); L.rect('a', 3, 10, 8, 11); L.rect('a', 17, 10, 22, 10);
      L.rect('a', 3, 2, 11, 3); L.rect('a', 3, 4, 4, 9); L.rect('a', 3, 18, 11, 19); L.rect('a', 3, 12, 4, 17);
      L.rect('i', 7, 5, 9, 6); L.door('shed', 8, 4);
      L.door('gate', 23, 10, { kind: 'gate', tex: 'gate2', locked: 'Barred. Painted on it: LA PORTE S’OUVRE QUAND L’HOMME D’ORGE EST COURONNÉ. The gate opens when the Barleyman is crowned.' }); L.rect('x', 24, 10, 25, 10);
      L.lamp(9, 8, { dx: -0.5, dz: -0.5 }); L.lamp(16, 13, { dx: 0.5, dz: 0.5 }); L.lamp(12, 3, { dx: -0.5 }); L.lamp(13, 17, { dx: 0.5 }); L.lamp(3, 14, { dx: -0.5 }); L.lamp(20, 10, { dz: -0.55 }); L.lamp(5, 2, { dz: -0.5, dead: 1 });
      L.box('wood', c(12.5), 0.45, c(10.5), 1.5, 0.9, 1.5, 0.4, 'fit', 2); L.box('wood', c(12.5), 1.0, c(10.5), 1.1, 0.3, 1.1, 1.1); L.box('barley', c(12.5), 1.4, c(10.5), 0.5, 0.36, 0.5, 0.3); L.block(12, 10); L.block(13, 10); L.block(12, 11); L.block(13, 11);
      L.light(c(12.5), 2.0, c(10.5), [1, 0.55, 0.18], 2.6, 11); m.lamps.push({ x: c(12.5), z: c(10.5), h: 2.6, R: 10 });
      L.inter('crown', c(12.5), 1.4, c(10.5), 'TAKE THE CROWN YOURSELF', 2.5, 3.2);
      L.sign(['FÊTE DE L’ORGE'], '#c8a440', '#2a1a10', c(12.5), 3.0, 8 * T + 0.03, 4.2, 0.6, 0, 30); L.card('seal', c(12.5), 3.7, 8 * T + 0.03, 1.5, 1.5, 0); L.card('seal', 23 * T - 0.05, 0.6, c(10), 1.0, 1.0, -PI / 2); L.sign(['L’HOMME D’ORGE', 'PORTE NOS MALHEURS'], '#d8d0b0', '#8a1a14', 9 * T + 0.03, 1.3, c(12.5), 2.2, 0.8, PI / 2, 16);
      L.crate(c(15.6), c(8.3), 2); L.barrel(c(9.4), c(13.4)); L.crate(c(3) - 0.42, c(6), 1); L.barrel(c(11), c(19) + 0.45); L.crate(c(18), c(10) + 0.4, 1, 0.5);
      L.ceilLight(8, 5.5, LC.WARM, 0.35, 4); L.crate(c(7.2), c(5.3), 1); L.inter('betray', c(9), 0.9, c(6), 'POINT HIM OUT — “THERE HE IS”', 2.2, 2.2);
      C.man = person({ coat: 2, face: 0, scale: 1 }, 9.2, 6.1, -2.2, L);
      C.crowd = []; for (let i = 0; i < 12; i++) {
        const mill = i % 4 === 3, a = i / 12 * PI * 2, hx = 12.5 + Math.cos(a) * 2.3, hz = 10.5 + Math.sin(a) * 1.75, hy = Math.atan2(-Math.cos(a), -Math.sin(a));
        const r = person({ coat: i % 3, face: 0, hat: i % 2, hair: i % 3 === 1, scale: 0.94 + (i % 4) * 0.03 }, hx, hz, hy, L);
        const lan = HW.dynGroup(() => B.box('sodium', 0, 0, 0, 0.12, 0.16, 0.12), { emis: 1.5 }); r.P.armL.add(lan); lan.position.set(0, -0.72, 0.05);
        r.st = 'idle'; r.mill = mill; r.home = [r.x, r.z, hy]; r.d = new Int16Array(27 * 22); r.wait = 2 + Math.random() * 4; r.lost = 0; r.ct = 0; r.i = i; C.crowd.push(r);
      }
      L.finish(); spawn(12.5, 18.6, 0); return m;
    },
    begin() { C.cap = 0; C.pT = 0; objective('Get out of town. The east gate.'); after(1, () => say(['They read my name out at the festival.', 'Barleyman. The year’s bad luck has to walk out of town inside somebody.'])); hint('They are your neighbours, and they are watching the pyre. Stay behind them. Do not run close by.', 10); },
    use(o) {
      if (o.id === 'crown') { store.set('choice', 'crown'); A.bell(0.35, 0); say('It is lighter than it looks.'); for (const r of C.crowd) r.st = 'still'; C.crowned = true; after(4.5, complete); o.on = false; return; }
      if (o.id === 'betray') { o.on = false; intr('crown').on = false; store.set('choice', 'betray'); C.betrayed = true; A.sting(true); const g = M.doorAt[M.idx(23, 10)]; g.locked = null; g.want = 1; HW.bfs(8, 5, M.dP); for (const r of C.crowd) { r.st = 'take'; r.d.set(M.dP); } say(['“There he is.”', 'It comes out of my mouth quite easily.']); after(4, () => say(['“We are not cruel,” somebody says to him, kindly.'])); objective('The gate is open. Leave.'); }
    },
    tick(dt) {
      const zn = zoneName(); if (!C.s1 && zn === 'shed') { C.s1 = 1; say(['Someone is already hiding in here.']); after(2.5, () => say(['They read my name last year. I ran. They have been short one ever since.', 'Please.'], 'THE MAN')); }
      if (!C.s3 && dist(c(12.5), c(10.5)) < 3.9) { C.s3 = 1; say(['They stop. They make room.', 'Nobody has to be dragged to the pyre if he walks.']); }
      if (!C.s2 && tileOf(P.x) >= 20) { C.s2 = 1; objective('The gate opens when someone is crowned. The crown is on the pyre in the square.'); }
      if ((C.pT -= dt) <= 0) { C.pT = 0.4; HW.bfs(tileOf(P.x), tileOf(P.z), M.dP); C.dPl = true; }
      let near = 0, nd = 99, coming = 0; const lan = [], offering = dist(c(12.5), c(10.5)) < 3.9, free = !C.crowned && !C.betrayed;
      for (const r of C.crowd) {
        const d = dist(r.x, r.z), los = d < 12 && HW.los(r.x, r.z, P.x, P.z); let spd = 0, mode = 'idle';
        if (r.st === 'idle') {
          const dot = ((P.x - r.x) * Math.sin(r.yaw) + (P.z - r.z) * Math.cos(r.yaw)) / (d + 1e-4);
          if (free && los && ((d < 6.5 && dot > 0.35) || d < 1.3 || (d < 4.5 && P.speed > 4))) { r.st = 'come'; r.lost = 0; r.ct = 0; if (!C.seen1) { C.seen1 = 1; say('There.', 'THE CROWD'); A.sting(false); } }
          else if (r.mill) {
            if (r.wait > 0) r.wait -= dt;
            else if (!r.tgt || Math.hypot(r.tgt[0] - r.x, r.tgt[1] - r.z) < 0.5) { const W = [[9.5, 8.6], [15.5, 8.6], [9.5, 12.5], [15.5, 12.5], [12.5, 6], [12.5, 15], [7, 10.5], [18, 10], [12.5, 13]], w = W[(Math.random() * W.length) | 0]; r.tgt = [c(w[0]), c(w[1])]; HW.bfs(tileOf(r.tgt[0]), tileOf(r.tgt[1]), r.d); r.wait = 2 + Math.random() * 4; }
            else { const n = HW.stepToward(r.x, r.z, r.d); spd = move(r, n ? n[0] : r.tgt[0], n ? n[1] : r.tgt[1], 0.9, dt); }
          } else if (Math.hypot(r.home[0] - r.x, r.home[1] - r.z) > 0.4) { if (!r.hb) { r.hb = 1; HW.bfs(tileOf(r.home[0]), tileOf(r.home[1]), r.d); } const n = HW.stepToward(r.x, r.z, r.d); spd = move(r, n ? n[0] : r.home[0], n ? n[1] : r.home[1], 0.9, dt); }
          else { r.hb = 0; r.yaw += wrapA(r.home[2] - r.yaw) * Math.min(1, dt * 3); }
        } else if (r.st === 'come') {
          coming++; r.ct += dt; if (!free) { r.st = 'idle'; r.tgt = null; }
          if (los) r.lost = 0; else if ((r.lost += dt) > 4.5) { r.st = 'idle'; r.tgt = null; r.hb = 0; }
          if (offering) { r.yaw += wrapA(Math.atan2(P.x - r.x, P.z - r.z) - r.yaw) * Math.min(1, dt * 4); }
          else if (d > 0.8) { const n = d < 2.2 && los ? [P.x, P.z] : HW.stepToward(r.x, r.z, M.dP); if (n) spd = move(r, n[0], n[1], 2.05, dt); } else r.yaw = Math.atan2(P.x - r.x, P.z - r.z);
          mode = d < 3 ? 'count' : 'idle'; if (d < 1.5) near++; nd = Math.min(nd, d);
          if (r.ct > 1.2) for (const q of C.crowd) if (q.st === 'idle' && Math.hypot(q.x - r.x, q.z - r.z) < 4) { q.st = 'come'; q.lost = 0; q.ct = 0; }
        } else if (r.st === 'take') { const n = HW.stepToward(r.x, r.z, r.d); if (n) spd = move(r, n[0], n[1], 1.7, dt); }
        else if (r.st === 'still') { r.yaw += wrapA(Math.atan2(P.x - r.x, P.z - r.z) - r.yaw) * Math.min(1, dt * 3); r.bow = 0.35; }
        r.root.position.set(r.x, 0, r.z); r.root.rotation.y = r.yaw; r.pose(dt, spd, S.t, mode); litPerson(r, 1.2); lan.push([d, r]);
      }
      if (offering || !free) near = 0;
      lan.sort((a, b) => a[0] - b[0]); for (let i = 0; i < 2; i++) { const r = lan[i][1]; U.uDynPos.value[i].set(r.x, 0.9, r.z); U.uDynCol.value[i].set(0.5, 0.36, 0.16); }
      if (coming && free) { C.dr = (C.dr || 0) - dt; if (C.dr <= 0) { C.dr = 1.25; A.drum(0.3); } C.li = (C.li === undefined ? 1.5 : C.li) - dt; if (C.li <= 0) { C.li = 3.6; A.litany(0.11, Math.random() - 0.5); if (!C.l1) { C.l1 = 1; say('…burn the number… burn the number…', 'THE CROWD'); } } }
      if (near >= 2) C.cap += dt * 0.55; else if (near === 1 && nd < 1.0) C.cap += dt * 0.3; else C.cap = Math.max(0, C.cap - dt * 0.8);
      S.meter = C.cap > 0.05 ? 1 - C.cap : -1; S.chase = coming ? 0.35 : 0; S.fear = clamp(1 - nd / 6, 0, 1); S.ins = 0.05 + C.cap * 0.3;
      C.man.pose(dt, 0, S.t, 'sit'); C.man.headYaw = clamp(wrapA(Math.atan2(P.x - C.man.x, P.z - C.man.z) - C.man.yaw), -1.3, 1.3); litPerson(C.man, 1);
      if (C.cap >= 1) return die('CROWNED', 'THEY WERE VERY GENTLE ABOUT IT.');
      if (zn === 'out') complete();
    }
  });
  function move(o, tx, tz, spd, dt) {
    const mx = tx - o.x, mz = tz - o.z, ml = Math.hypot(mx, mz); if (ml < 0.05) return 0;
    const st = Math.min(ml, spd * dt), r = HW.collide(o.x + mx / ml * st, o.z + mz / ml * st, 0.24); o.x = r[0]; o.z = r[1];
    o.yaw += wrapA(Math.atan2(mx, mz) - o.yaw) * Math.min(1, dt * 7); return spd;
  }

  // ================= VI. NOTHING =================
  const FRAGS = ['Awareness is not a gift; it is the first unpaid debt.', 'Art does not change the world; it proves that someone noticed it.', 'Eternity is not terrifying. Irrelevance is.', 'The cosmos records every cry and edits none of them into mercy.', 'Love is the wish to be witnessed without explanation.', 'To be consistent is a privilege of the unobserved.'];
  function stones() { try { return JSON.parse(store.get('stones') || '[]'); } catch (e) { return []; } }
  CH.push({
    num: 'VI', de: 'DAS NICHTS', en: 'NOTHING', fear: 'THE ABSENCE OF MEANING', fog: [0x8c8e90, 24], quote: 'At the top there is nothing to be afraid of. That is the fear.',
    build() {
      const ZD = { z: { name: 'plain', floor: 'sand', out: 1, open: 1, amb: [0.5, 0.5, 0.51], step: 'soft' } };
      const L = HW.newLevel(40, 40, ZD, {}), m = L.M; L.rect('z', 0, 0, 39, 39);
      L.box('wood', c(20) - 0.62, 1.1, c(17), 0.12, 2.2, 0.12, 0, 'fit', 1); L.box('wood', c(20) + 0.62, 1.1, c(17), 0.12, 2.2, 0.12, 0, 'fit', 1); L.box('wood', c(20), 2.26, c(17), 1.36, 0.12, 0.12);
      C.all = [[22.2, 21.4], [15.3, 24.2], [26.1, 14.3]].map(p => [c(p[0]), c(p[1])]).concat(stones());
      C.all.forEach(([x, z], i) => { L.box('stone', x, 0.11, z, 0.3, 0.22, 0.26, i * 1.3); if (i % 3 === 2) L.box('stone', x, 0.3, z, 0.2, 0.16, 0.2, i); L.inter('stone', x, 0.3, z, 'READ THE STONE', 0, 1.7).n = i; });
      L.finish(); spawn(20, 23, 0); return m;
    },
    begin() {
      C.t = 0; C.doors = 0; C.pz = P.z; objective(''); $('obj').style.opacity = 0;
      after(4, () => say('The top.')); after(12, () => say('Nothing is coming.')); after(24, () => say('Nothing is going to.')); after(40, () => { if (!C.placed) hint('E — put a stone down.', 12); });
    },
    use(o) { if (o.id === 'stone') say(['Someone left this here.', '“' + FRAGS[o.n % FRAGS.length] + '”']); },
    useNone() {
      if (C.placed) return; C.placed = true; const x = P.x - Math.sin(P.yaw) * 1.1, z = P.z - Math.cos(P.yaw) * 1.1;
      const g = HW.dynGroup(() => B.box('stone', 0, 0.11, 0, 0.3, 0.22, 0.26, P.yaw)); g.position.set(x, 0, z); HW.setAmb(g, 0.5, 0.5, 0.51); HW.scene.add(g); M.dyn.push(g);
      const st = stones(); st.push([+x.toFixed(2), +z.toFixed(2)]); store.set('stones', JSON.stringify(st.slice(-40))); A.thump(0.35); $('hint').style.opacity = 0;
      C.chantUp = 0.16; say(['A stone.', 'It does not change the plain. It says that someone was here, and noticed.', 'It will still be here the next time anyone climbs this far.']); after(13, complete);
    },
    tick(dt) {
      C.t += dt; const lo = 2 * T, hi = 38 * T, span = 36 * T;
      if (P.x < lo) P.x += span; else if (P.x > hi) P.x -= span; if (P.z < lo) P.z += span; else if (P.z > hi) P.z -= span;
      const dz = c(17); if (Math.abs(P.x - c(20)) < 0.56 && (C.pz - dz) * (P.z - dz) < 0 && Math.abs(P.z - C.pz) < 1) { C.doors++; A.creak(0, 0.05); say(C.doors === 1 ? 'A door. The same plain on the other side.' : C.doors === 2 ? 'The same plain.' : 'It is a door. It does not go anywhere. I keep using it.'); }
      C.pz = P.z; S.ins = 0.02; S.fear = 0; S.cold = 0;
    }
  });

  // ---------- player ----------
  function pickInt() {
    let best = null, bs = 1e9; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    for (const o of M.INT) { if (!o.on) continue; const dx = o.x - P.x, dz = o.z - P.z, d = Math.hypot(dx, dz); if (d > o.r) continue; const dot = (dx * fx + dz * fz) / (d + 1e-4); if (d > 0.55 && dot < 0.5) continue; if (!o.door && !M.losTiles(P.x, P.z, o.x, o.z)) continue; const sc = d - dot * 0.9 + (o.door ? 0.35 : 0); if (sc < bs) { bs = sc; best = o; } }
    return best;
  }
  function useInt(o) {
    if (o.door) { const d = o.door; if (d.locked) { say(d.locked); A.rattle(0); return; } d.want = d.want ? 0 : 1; A.latch(0); if (d.want) A.creak(0, 0.07); return; }
    const ch = CH[S.ch]; if (ch.use) ch.use(o);
  }
  function updInteract(dt) {
    const pr = $('prompt'), o = pickInt(); if (o !== S.cur) { S.cur = o; S.holdT = 0; }
    if (!o) { pr.style.display = 'none'; return; }
    if (o.door) o.label = o.door.locked ? 'TRY DOOR' : o.door.want ? 'CLOSE' : 'OPEN';
    pr.style.display = 'block'; pr.children[1].textContent = (o.hold ? 'HOLD — ' : '') + o.label; const bar = pr.children[2];
    if (o.hold) { bar.style.display = 'block'; if (K.KeyE) { S.holdT += dt; if (S.holdT >= o.hold) { S.holdT = 0; K.KeyE = false; useInt(o); return; } } else S.holdT = Math.max(0, S.holdT - dt * 2); bar.firstChild.style.width = (100 * S.holdT / o.hold) + '%'; } else bar.style.display = 'none';
  }
  function updPlayer(dt) {
    if (K.ArrowLeft) P.tyaw += dt * 2.2; if (K.ArrowRight) P.tyaw -= dt * 2.2;
    if (S.nolock && S.mIn && Math.abs(S.mx) > 0.8 && document.pointerLockElement !== $('view')) P.tyaw -= Math.sign(S.mx) * (Math.abs(S.mx) - 0.8) / 0.2 * 2.6 * dt;
    const k = Math.min(1, dt * 20); P.yaw += (P.tyaw - P.yaw) * k; P.pitch += (P.tpitch - P.pitch) * k;
    let mx = 0, mz = 0; if (K.KeyW) mz += 1; if (K.KeyS) mz -= 1; if (K.KeyD) mx += 1; if (K.KeyA) mx -= 1;
    const run = !!(K.ShiftLeft || K.ShiftRight) && mz > 0 && !P.exhaust, sp = (run ? 4.7 : 3.1) * S.slow;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    let tx = fx * mz + rx * mx, tz = fz * mz + rz * mx; const tl = Math.hypot(tx, tz); if (tl > 0) { tx = tx / tl * sp; tz = tz / tl * sp; }
    P.vx += (tx - P.vx) * Math.min(1, dt * 10); P.vz += (tz - P.vz) * Math.min(1, dt * 10);
    const ox = P.x, oz = P.z, r = HW.collide(P.x + P.vx * dt, P.z + P.vz * dt, 0.27); P.x = r[0]; P.z = r[1];
    const moved = Math.hypot(P.x - ox, P.z - oz); P.speed = moved / dt;
    if (run && P.speed > 1.2) { P.stam -= 11 * dt; P.regenT = 1.1; if (P.stam <= 0) { P.stam = 0; P.exhaust = true; } } else { P.regenT -= dt; if (P.regenT <= 0) P.stam = Math.min(100, P.stam + 12 * dt); if (P.stam > 30) P.exhaust = false; }
    const Z = HW.zoneAt(P.x, P.z); P.y += ((Z ? (Z.fh || 0) : 0) - P.y) * Math.min(1, dt * 7);
    P.stepAcc += moved; if (P.stepAcc > (run ? 1.05 : 0.8)) { P.stepAcc = 0; A.step(Z ? Z.step : 'conc', run ? 0.26 : 0.14, 0); }
    P.bob += moved * 6;
    const st = $('stam'); st.style.opacity = P.stam < 99 ? 0.8 : 0; st.firstChild.style.width = P.stam + '%';
  }
  function update(dt) {
    S.t += dt;
    for (let i = S.timers.length - 1; i >= 0; i--) { const t = S.timers[i]; t.t -= dt; if (t.t <= 0) { S.timers.splice(i, 1); t.fn(); if (S.mode !== 'play') return; } }
    updPlayer(dt); updInteract(dt); if (S.mode !== 'play') return;
    const ch = CH[S.ch]; ch.tick(dt); if (S.mode !== 'play') return;
    updSubs(dt); HW.updDoors(dt); S.fade = Math.min(1, S.fade + dt * 0.7);
    if (S.subl) { S.sublT -= dt * (1 + S.fear + S.ins * 2); if (S.sublT <= 0) { S.sublT = 11 + Math.random() * 17; S.lastSubl = subliminal(); } }
  }
  const UW = new THREE.Color(0x0c1c22);
  function common(dt) {
    U.uTime.value += dt; const cam = HW.camera;
    cam.position.set(P.x, P.y + P.eye + Math.sin(P.bob) * 0.035 * clamp(P.speed / 3, 0, 1), P.z); cam.rotation.set(P.pitch, P.yaw, Math.sin(P.bob * 0.5) * 0.01 + Math.sin(S.t * 0.9) * 0.005);
    U.uFlI.value += ((P.flash && S.torch ? 1.2 : 0) - U.uFlI.value) * Math.min(1, dt * 22);
    const cp = Math.cos(P.pitch); P.fd.set(-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp); U.uFlDir.value.copy(P.fd); U.uFlPos.value.set(P.x, P.y + P.eye - 0.1, P.z);
    U.uFogFar.value += ((S.under ? 3.5 : S.fogFar) - U.uFogFar.value) * Math.min(1, dt * 3);
    if (S.under && S.ch === 1) U.uFogCol.value.lerp(UW, Math.min(1, dt * 6)); else U.uFogCol.value.lerp(S.fogCol, Math.min(1, dt * 4)); HW.renderer.setClearColor(U.uFogCol.value, 1);
    U.uEye.value += ((S.eye || 1.2) - U.uEye.value) * Math.min(1, dt * 4);
    if (S.flashT > 0) S.flashT -= dt * 1.4; PU.uFlashCol.value.set(0.4, 0.38, 0.36); PU.uFlash.value = clamp(S.flashT, 0, 0.9);
    PU.uFade.value = S.fade; PU.uIns.value = clamp(S.ins, 0, 0.8); PU.uChase.value = S.chase; PU.uPulse.value = 0.5 + 0.5 * Math.sin(S.t * 6); PU.uCold.value = S.cold; PU.uDmg.value = 0;
    if (S.sublOn > 0) { S.sublOn -= dt; if (S.sublOn <= 0) $('subl').style.opacity = 0; }
    if (S.ghostOn > 0) { S.ghostOn -= dt; if (S.ghostOn <= 0 && ghost) ghost.root.visible = false; }
    let cl = 0; if (S.mode === 'title' || S.mode === 'end') cl = 0.14; else if (S.mode === 'card') cl = 0.3; else if (S.mode === 'pause' || S.mode === 'paper') cl = 0.05; else if (S.mode === 'play') cl = [0.03, 0.04, 0.05, 0.1, 0.16, 0][S.ch] + (S.ch === 5 ? 0 : S.ins * 0.1) + (S.ch === 4 ? S.chase * 0.5 : 0) + (C.chantUp || 0);
    if (Math.abs(cl - (S.cl === undefined ? -1 : S.cl)) > 0.008 && A.chant(cl)) S.cl = cl;
    const mt = $('meter'); mt.style.opacity = S.meter >= 0 ? 0.9 : 0; if (S.meter >= 0) mt.firstChild.style.width = (clamp(S.meter, 0, 1) * 100) + '%';
    const Z = M ? HW.zoneAt(P.x, P.z) : null;
    A.update(dt, { power: U.uPower.value * 0.5, outdoor: !!(Z && Z.out), cold: S.ch === 1, ins: clamp(S.ins * 2, 0, 1), fear: S.fear, chase: S.chase, scrape: 0, scrapePan: 0, tired: clamp(1 - P.stam / 60, 0, 1), dead: S.mode !== 'play' && S.mode !== 'paper' && S.mode !== 'pause' });
  }
  function tick(dt) { if (S.mode === 'play') update(dt); if (S.mode !== 'load') common(dt); }
  let last = 0;
  function frame(now) { requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; tick(dt); if (M) HW.render(); }
  HW.step = (sec, h) => { h = h || 1 / 30; for (let t = 0; t < sec; t += h) tick(h); if (M) HW.render(); return S.mode; };

  function lockPtr() { const cv = $('view'); try { const p = cv.requestPointerLock && cv.requestPointerLock(); if (p && p.catch) p.catch(() => { S.nolock = true; }); } catch (e) { S.nolock = true; } }
  function unlockPtr() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { } }
  function pause(on) { if (on && S.mode === 'play') { S.mode = 'pause'; $('pause').classList.add('show'); unlockPtr(); } else if (!on && S.mode === 'pause') { $('pause').classList.remove('show'); S.mode = 'play'; lockPtr(); } }
  function tiers() {
    const n = doneN(), el = $('tiers'); el.innerHTML = '';
    for (let i = 5; i >= 0; i--) { const b = document.createElement('button'); b.className = 'tier' + (i < n ? ' done' : i === n ? ' next' : ' lock'); b.style.width = (27 + (5 - i) * 7) + '%'; b.textContent = CH[i].num + '  ·  ' + (i <= n ? CH[i].en : '— — —'); if (i <= n) b.onclick = () => begin(i); el.appendChild(b); }
    $('start').textContent = n >= 6 ? 'CLIMB IT AGAIN' : n ? 'KEEP CLIMBING' : 'BEGIN THE CLIMB';
  }
  function begin(i) { A.init(); for (const id of ['title', 'end', 'pause']) $(id).classList.remove('show'); startChapter(i); }
  function bind() {
    addEventListener('keydown', e => {
      if (e.code === 'Tab' || e.code === 'Space' || e.code.indexOf('Arrow') === 0) e.preventDefault(); if (e.repeat) return; K[e.code] = true;
      if (S.mode === 'paper') { if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space') { K.KeyE = false; closePaper(); } return; }
      if (S.mode === 'card') { if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { K.KeyE = false; closeCard(); } return; }
      if (e.code === 'Escape') return pause(S.mode === 'play');
      if (S.mode !== 'play') return;
      if (e.code === 'KeyF') { P.flash = !P.flash; A.click(); }
      if (e.code === 'KeyE') { if (S.cur) { if (!S.cur.hold) useInt(S.cur); } else if (CH[S.ch].useNone) CH[S.ch].useNone(); }
    });
    addEventListener('keyup', e => { K[e.code] = false; }); addEventListener('blur', () => { for (const k in K) K[k] = false; });
    document.addEventListener('mousemove', e => { const r = $('stage').getBoundingClientRect(); S.mx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); S.mIn = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; if (S.mode !== 'play') return; if (document.pointerLockElement !== $('view') && !S.nolock) return; P.tyaw -= e.movementX * 0.0023 * S.sens; P.tpitch = clamp(P.tpitch - e.movementY * 0.0023 * S.sens, -1.3, 1.3); });
    $('view').addEventListener('mousedown', () => { if (S.mode === 'play' && document.pointerLockElement !== $('view') && !S.nolock) lockPtr(); });
    $('card').addEventListener('mousedown', closeCard);
    document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== $('view') && S.mode === 'play' && !S.nolock) pause(true); });
    document.addEventListener('pointerlockerror', () => { S.nolock = true; });
    $('start').onclick = () => begin(Math.min(5, doneN() % 6)); $('resume').onclick = () => pause(false);
    const toTitle = () => { for (const id of ['pause', 'end', 'card']) $(id).classList.remove('show'); $('title').classList.add('show'); S.mode = 'title'; tiers(); };
    $('restart').onclick = toTitle; $('endBtn').onclick = toTitle; $('retryCh').onclick = () => { $('pause').classList.remove('show'); startChapter(S.ch, true); lockPtr(); };
    $('sublChk').checked = S.subl; $('sublChk').onchange = e => { S.subl = e.target.checked; store.set('subl', S.subl ? '1' : '0'); };
    $('cardSeal').innerHTML = SEAL; $('titleSeal').innerHTML = SEAL;
    $('sens').oninput = e => { S.sens = +e.target.value; }; $('vol').oninput = e => A.setVol(+e.target.value);
  }
  addEventListener('load', () => {
    HW.initGfx($('view')); PU = HW.PU;
    HW.loadTextures(() => { HW.extraTex(); bind(); S.mode = 'title'; $('load').style.display = 'none'; tiers(); requestAnimationFrame(frame); });
  });
  HW.dbg = {
    S, P, K, CH, get C() { return C; }, get M() { return M; }, get ghost() { return ghost; }, complete, die, useInt, intr, spawn, subliminal, glimpse,
    start(i) { for (const id of ['title', 'end', 'pause', 'card']) $(id).classList.remove('show'); S.nolock = true; startChapter(i, true); },
    tp(tx, tz, y) { P.x = c(tx); P.z = c(tz); if (y !== undefined) look(y, 0); },
    state() { return { mode: S.mode, ch: S.ch, x: +(P.x / T - 0.5).toFixed(1), z: +(P.z / T - 0.5).toFixed(1), y: +P.y.toFixed(2), cur: S.cur && S.cur.id, zone: M ? zoneName() : '', meter: +S.meter.toFixed(2), power: +U.uPower.value.toFixed(2) }; }
  };
})();
