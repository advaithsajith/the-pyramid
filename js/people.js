'use strict';
/* Low-poly box people with a stipple shadow that can fall short of their feet. */
(function () {
  const B = HW.B;
  const cell = (cx, cy) => [cx / 4, 1 - (cy + 1) / 4, (cx + 1) / 4, 1 - cy / 4];
  let shadowGeo = null;

  // o: { coat 0..3, hat, card, face (0 living, 1 corrected, -1 none), scale }
  HW.makePerson = function (o) {
    o = o || {};
    const mat = HW.dynMat('person'), root = new THREE.Group(), P = {};
    const part = (fn, x, y, z, parent) => { const gs = B.capture(fn), m = new THREE.Mesh(gs.person, mat); m.frustumCulled = false; m.position.set(x, y, z); (parent || root).add(m); return m; };
    const C = cell(o.coat || 0, 0), TR = cell(0, 1), SK = cell(1, 1), FA = o.face < 0 ? C : cell(o.face ? 3 : 2, 1), HT = cell(0, 2), CARD = cell(1, 2), HAIR = cell(o.hair ? 3 : 2, 2);
    P.hips = new THREE.Group(); P.hips.position.y = 0.84; root.add(P.hips);
    P.legL = part(() => B.box('person', 0, -0.42, 0, 0.17, 0.84, 0.19, 0, TR), -0.105, 0, 0, P.hips);
    P.legR = part(() => B.box('person', 0, -0.42, 0, 0.17, 0.84, 0.19, 0, TR), 0.105, 0, 0, P.hips);
    P.body = part(() => {
      B.box('person', 0, 0.32, 0, 0.48, 0.64, 0.27, 0, C); B.box('person', 0, -0.17, 0, 0.5, 0.36, 0.3, 0, C, 't');
      if (o.card) B.quad('person', [0.06, 0.34, 0.14], [0.19, 0.34, 0.14], [0.19, 0.47, 0.14], [0.06, 0.47, 0.14], [0, 0, 1], CARD);
    }, 0, 0, 0, P.hips);
    P.head = part(() => {
      B.box('person', 0, 0.125, 0, 0.23, 0.25, 0.23, 0, o.face < 0 ? C : SK, 's');
      B.quad('person', [-0.115, 0, 0.115], [0.115, 0, 0.115], [0.115, 0.25, 0.115], [-0.115, 0.25, 0.115], [0, 0, 1], FA);
      if (o.hat) { B.box('person', 0, 0.26, 0, 0.34, 0.03, 0.34, 0, HT); B.box('person', 0, 0.32, 0, 0.24, 0.1, 0.24, 0, HT); }
      else if (!o.hood) B.box('person', 0, 0.255, -0.01, 0.245, 0.06, 0.25, 0, HAIR);
      if (o.hood) { B.box('person', 0, 0.15, -0.035, 0.32, 0.37, 0.32, 0, C, 's'); B.box('person', 0, -0.03, 0, 0.56, 0.1, 0.34, 0, C); }
    }, 0, 0.66, 0, P.body);
    const arm = sx => part(() => { B.box('person', 0, -0.3, 0, 0.13, 0.6, 0.15, 0, C); B.box('person', 0, -0.65, 0, 0.1, 0.1, 0.1, 0, o.face < 0 ? C : SK); }, sx * 0.305, 0.58, 0, P.body);
    P.armL = arm(-1); P.armR = arm(1);
    const rig = { root, P, mat, mats: [mat], ph: Math.random() * 6, headYaw: 0, bow: 0, scale: o.scale || 1 };
    root.scale.setScalar(rig.scale);
    if (!shadowGeo) shadowGeo = B.capture(() => B.quad('shadow', [-0.32, 0, 1], [0.32, 0, 1], [0.32, 0, 0], [-0.32, 0, 0], [0, 1, 0])).shadow;
    const sm = HW.dynMat('shadow'); sm.uniforms.uAmb.value.set(0.02, 0.02, 0.02);
    rig.shadow = new THREE.Mesh(shadowGeo, sm); rig.shadow.frustumCulled = false; rig.shadow.visible = false;
    // mode: 'walk' | 'idle' | 'count' (points at you) | 'bow' | 'sit'
    rig.pose = function (dt, speed, t, mode) {
      const sw = Math.min(1, speed / 1.1); rig.ph += dt * (1.3 + speed * 2.9); const s = Math.sin(rig.ph), co = Math.cos(rig.ph);
      P.legL.rotation.x = s * 0.5 * sw; P.legR.rotation.x = -s * 0.5 * sw; P.hips.position.y = 0.84 + Math.abs(co) * 0.022 * sw;
      P.armL.rotation.x = -s * 0.36 * sw; P.armR.rotation.x = s * 0.36 * sw; P.armL.rotation.z = -0.04; P.armR.rotation.z = 0.04;
      P.body.rotation.x = 0.03 + Math.sin(t * 1.1 + rig.ph * 0.01) * 0.012; P.body.rotation.z = s * 0.03 * sw;
      P.head.rotation.y += (rig.headYaw - P.head.rotation.y) * Math.min(1, dt * 5); P.head.rotation.x += (rig.bow - P.head.rotation.x) * Math.min(1, dt * 3); P.head.rotation.z = 0;
      if (mode === 'count') { P.armR.rotation.x = -1.42 + Math.sin(t * 6) * 0.02; P.head.rotation.z = 0.16; }
      else if (mode === 'bow') { P.armL.rotation.x = -0.25; P.armR.rotation.x = -0.25; }
      else if (mode === 'sit') { P.legL.rotation.x = -1.5; P.legR.rotation.x = -1.5; P.hips.position.y = 0.5; P.armL.rotation.x = -0.9; P.armR.rotation.x = -0.9; }
    };
    rig.setAmb = function (r, g, b) { mat.uniforms.uAmb.value.set(r, g, b); };
    rig.setScale = function (s) { rig.scale = s; root.scale.setScalar(s); };
    return rig;
  };

  // place a shadow thrown by the nearest lamp. short = it falls short of the feet and 14% short in length.
  HW.updShadow = function (sh, x, z, height, short) {
    const lamps = HW.M.lamps; let best = null, bd = 1e9;
    for (let i = 0; i < lamps.length; i++) { const l = lamps[i], d = Math.hypot(x - l.x, z - l.z); if (d < l.R && d < bd) { bd = d; best = l; } }
    if (!best || bd < 0.25) { sh.visible = false; return; }
    const dx = (x - best.x) / bd, dz = (z - best.z) / bd;
    let len = Math.max(0.5, Math.min(4.2, height * (bd + 0.35) / Math.max(0.6, best.h - height)));
    const gap = short ? 0.28 + 0.14 * len : 0; if (short) len *= 0.86;
    sh.visible = true; sh.position.set(x + dx * gap, 0.03, z + dz * gap); sh.rotation.y = Math.atan2(dx, dz); sh.scale.set(height / 1.7, 1, len);
  };
})();
