'use strict';
/* Shared PS1-style renderer (from Hanging Weight): PS1-style materials, procedural textures, static geometry builder */
const HW = window.HW = {};
(function () {
  const RW = 426, RH = 240;
  HW.RW = RW; HW.RH = RH;
  const V3 = THREE.Vector3;

  // ---------- shared uniforms ----------
  const U = HW.U = {
    uRes: { value: new THREE.Vector2(RW, RH) },
    uSnap: { value: 1.0 },
    uAffine: { value: 0.6 },
    uPower: { value: 0 },
    uTime: { value: 0 },
    uWarp: { value: 0 },
    uFlPos: { value: new V3() },
    uFlDir: { value: new V3(0, 0, -1) },
    uFlI: { value: 0 },
    uEye: { value: 1 },
    uFogCol: { value: new THREE.Color(0x000000) },
    uFogFar: { value: 24 },
    uDynPos: { value: [new V3(0, -99, 0), new V3(0, -99, 0)] },
    uDynCol: { value: [new V3(), new V3()] },
    uEmisPower: { value: 0 },
    uOne: { value: 1 }
  };

  const VERT = `
uniform vec2 uRes; uniform float uSnap, uPower, uTime, uWarp;
uniform vec3 uDynPos[2]; uniform vec3 uDynCol[2];
#ifdef BAKED
attribute vec3 aCol0; attribute vec3 aCol1;
#else
uniform vec3 uAmb;
#endif
varying vec3 vLight; varying vec3 vUvw; varying vec2 vUv; varying vec3 vWorld; varying vec3 vN;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * normal);
  wp.x += uWarp * 0.05 * sin(wp.y * 2.7 + uTime * 1.9 + wp.z);
  wp.z += uWarp * 0.05 * cos(wp.y * 2.1 + uTime * 1.6 + wp.x);
  vec4 p = projectionMatrix * viewMatrix * wp;
  vec2 g = uRes * 0.5 / uSnap;
  float w = p.w; if (abs(w) < 1e-4) w = 1e-4;
  p.xy = floor(p.xy / w * g + 0.5) / g * w;
  gl_Position = p;
  vUv = uv; vUvw = vec3(uv * p.w, p.w); vWorld = wp.xyz; vN = n;
#ifdef BAKED
  vec3 L = mix(aCol0, aCol1, uPower);
#else
  vec3 L = uAmb;
#endif
  for (int i = 0; i < 2; i++) {
    vec3 d = uDynPos[i] - wp.xyz; float dist = length(d);
    float a = max(0.0, 1.0 - dist / 10.0);
    L += uDynCol[i] * a * a * (0.35 + 0.65 * max(dot(n, d / max(dist, 0.01)), 0.0));
  }
  vLight = L;
}`;

  const FRAG = `
uniform sampler2D map;
uniform vec3 uFlPos, uFlDir, uFogCol, uTint;
uniform float uFlI, uAffine, uFogFar, uEmis, uEye;
varying vec3 vLight; varying vec3 vUvw; varying vec2 vUv; varying vec3 vWorld; varying vec3 vN;
void main(){
  vec2 uv = mix(vUv, vUvw.xy / vUvw.z, uAffine);
  vec4 t = texture2D(map, uv);
  if (t.a < 0.5) discard;
  vec3 d = vWorld - uFlPos; float dist = length(d); d /= max(dist, 1e-3);
  float c = dot(d, uFlDir);
  float spot = smoothstep(0.76, 0.92, c) * 0.75 + smoothstep(0.95, 0.992, c) * 0.5;
  spot *= 0.96 + 0.04 * sin(c * 180.0);
  float ndl = 0.35 + 0.65 * abs(dot(normalize(vN), d));
  float att = 1.0 / (1.0 + 0.03 * dist * dist);
  vec3 L = vLight;
  L += vec3(1.0, 0.94, 0.80) * min(uFlI * spot * att * ndl * 2.9, 1.3);
  L += vec3(0.9, 0.85, 0.7) * (uFlI * 0.07 / (1.0 + dist * dist * 0.6));
  L += vec3(0.035, 0.045, 0.06) * (uEye / (1.0 + dist * dist * 0.22));
  vec3 col = t.rgb * uTint * L + t.rgb * uEmis;
  float f = clamp(length(vWorld - cameraPosition) / uFogFar, 0.0, 1.0);
  col = mix(col, uFogCol, f * f);
  gl_FragColor = vec4(col, 1.0);
}`;

  const POST_V = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const POST_F = `
uniform sampler2D tDiffuse;
uniform float uTime, uIns, uDmg, uChase, uFade, uFlash, uPulse, uCold; uniform vec3 uFlashCol;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float b2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
void main(){
  vec2 uv = vUv;
  uv.x += sin(uv.y * 18.0 + uTime * 2.3) * 0.004 * uIns + sin(uv.y * 90.0 + uTime * 11.0) * 0.0018 * uIns;
  uv.y += cos(uv.x * 14.0 + uTime * 1.7) * 0.003 * uIns;
  float tear = step(0.985, hash(vec2(floor(uv.y * 60.0), floor(uTime * 14.0)))) * (uIns * 0.03 + uFlash * 0.05);
  uv.x += tear;
  vec2 dc = uv - 0.5;
  float ca = 0.0015 + 0.007 * uIns + 0.004 * uChase + 0.012 * uDmg;
  vec3 col;
  col.r = texture2D(tDiffuse, uv + dc * ca).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - dc * ca).b;
  float l = dot(col, vec3(0.3, 0.59, 0.11));
  col = mix(col, vec3(l), 0.18 + 0.5 * uIns);
  col *= vec3(1.0 + 0.6 * uDmg + 0.18 * uChase, 1.0 - 0.35 * uDmg, 1.0 - 0.35 * uDmg);
  col = mix(col, col * vec3(0.8, 0.95, 1.15), uCold);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * (0.04 + 0.07 * uIns);
  float v = 1.0 - dot(dc, dc) * (1.25 + 0.8 * uIns + 1.2 * uChase * uPulse + 1.4 * uDmg);
  col *= clamp(v, 0.0, 1.0);
  col = mix(col, uFlashCol, uFlash);
  col *= uFade;
  col *= 0.94 + 0.06 * mod(floor(gl_FragCoord.y), 2.0);
  col = floor(clamp(col, 0.0, 1.0) * 31.0 + b4(gl_FragCoord.xy)) / 31.0;
  gl_FragColor = vec4(col, 1.0);
}`;

  // ---------- renderer ----------
  HW.initGfx = function (canvas) {
    const r = HW.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'default' });
    r.setPixelRatio(1); r.setSize(RW, RH, false);
    r.setClearColor(0x000000, 1);
    HW.scene = new THREE.Scene();
    HW.camera = new THREE.PerspectiveCamera(68, RW / RH, 0.08, 60);
    HW.camera.rotation.order = 'YXZ';
    HW.rt = new THREE.WebGLRenderTarget(RW, RH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
    HW.PU = {
      tDiffuse: { value: HW.rt.texture }, uTime: U.uTime, uIns: { value: 0 }, uDmg: { value: 0 }, uChase: { value: 0 },
      uFade: { value: 0 }, uFlash: { value: 0 }, uPulse: { value: 0 }, uCold: { value: 0 }, uFlashCol: { value: new THREE.Vector3(0.45, 0, 0) }
    };
    HW.postScene = new THREE.Scene();
    HW.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: HW.PU, vertexShader: POST_V, fragmentShader: POST_F, depthTest: false, depthWrite: false }));
    q.frustumCulled = false; HW.postScene.add(q);
  };
  HW.render = function () {
    const r = HW.renderer;
    r.setRenderTarget(HW.rt); r.render(HW.scene, HW.camera);
    r.setRenderTarget(null); r.render(HW.postScene, HW.postCam);
  };

  // ---------- textures ----------
  const TEX = HW.TEX = {};
  const FILES = ['wall_tile', 'floor_tile', 'wall_brick', 'wall_factory', 'wall_block', 'wall_corr', 'wall_panel', 'wall_peel', 'wall_wood',
    'floor_conc', 'floor_dirty', 'floor_asph', 'floor_mud', 'floor_lino', 'floor_carpet', 'grate', 'rust', 'metal_green', 'metal_sheet', 'ceil', 'wood'];
  function setup(t) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
  function canvasTex(w, h, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g, w, h);
    const t = setup(new THREE.CanvasTexture(c)); t.userData = { canvas: c }; return t;
  }
  HW.canvasTex = canvasTex;
  let seed = 1337;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  HW.srnd = rnd;
  function noiseFill(g, w, h, base, amp) {
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rnd() - 0.5) * amp;
      d[i] = Math.max(0, Math.min(255, base[0] + n)); d[i + 1] = Math.max(0, Math.min(255, base[1] + n)); d[i + 2] = Math.max(0, Math.min(255, base[2] + n)); d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  }
  function blobs(g, w, h, n, col, r0, r1) {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) { const r = r0 + rnd() * (r1 - r0); g.beginPath(); g.ellipse(rnd() * w, rnd() * h, r, r * (0.5 + rnd()), rnd() * 3, 0, 7); g.fill(); }
  }
  function splat(g, cx, cy, R, col) {
    g.fillStyle = col;
    g.beginPath(); g.arc(cx, cy, R * 0.45, 0, 7); g.fill();
    for (let i = 0; i < 26; i++) {
      const a = rnd() * 6.283, d = R * (0.2 + rnd() * 0.8), r = R * (0.05 + rnd() * 0.16) * (1.2 - d / R);
      g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.max(0.7, r), 0, 7); g.fill();
    }
  }
  function text(g, s, x, y, px, col, align, font) {
    g.font = (font || 'bold ') + px + 'px Arial, Helvetica, sans-serif'; g.fillStyle = col; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y);
  }
  HW.makeSign = function (lines, bg, fg, w, h, px) {
    return canvasTex(w || 128, h || 32, (g, W, H) => {
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(2, 2, W - 4, H - 4);
      const n = lines.length; lines.forEach((s, i) => text(g, s, W / 2, H * (i + 0.5) / n + 1, px || Math.floor(H / n * 0.62), fg));
      g.globalAlpha = 0.25; blobs(g, W, H, 14, '#2a1a10', 1, 5); g.globalAlpha = 1;
    });
  };

  function makeProcedural() {
    TEX.flesh = canvasTex(64, 64, (g, w, h) => {
      noiseFill(g, w, h, [120, 22, 22], 40);
      g.globalAlpha = 0.5; blobs(g, w, h, 30, '#5a0a0c', 2, 8);
      g.globalAlpha = 0.75; g.strokeStyle = '#d9c9a8'; g.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) { g.beginPath(); const x = rnd() * w; g.moveTo(x, 0); g.bezierCurveTo(x + 10 * (rnd() - 0.5), 20, x + 14 * (rnd() - 0.5), 44, x + 8 * (rnd() - 0.5), 64); g.stroke(); }
      g.globalAlpha = 1;
    });
    // pig carcass: pale skin, split belly with ribs down the middle of the u range
    TEX.carc = canvasTex(64, 128, (g, w, h) => {
      noiseFill(g, w, h, [196, 150, 132], 26);
      g.globalAlpha = 0.35; blobs(g, w, h, 26, '#8c3a34', 2, 7); g.globalAlpha = 1;
      g.fillStyle = '#4a0c0e'; g.fillRect(22, 14, 20, 100);
      g.fillStyle = '#7c1416'; g.fillRect(25, 16, 14, 96);
      g.fillStyle = '#d8c8b0'; for (let y = 22; y < 100; y += 7) { g.fillRect(24, y, 6, 2); g.fillRect(34, y, 6, 2); }
      g.fillStyle = '#e4d4c0'; g.fillRect(31, 16, 2, 96);
      g.fillStyle = '#6a0e10'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 10, w, 10);
      g.globalAlpha = 0.6; g.fillStyle = '#4a0608'; for (let i = 0; i < 16; i++) g.fillRect(rnd() * w, h - 26 + rnd() * 10, 1 + rnd() * 2, 8 + rnd() * 16); g.globalAlpha = 1;
    });
    // human shape wrapped in film
    TEX.wrap = canvasTex(64, 64, (g, w, h) => {
      noiseFill(g, w, h, [176, 172, 160], 18);
      g.globalAlpha = 0.5; g.strokeStyle = '#f0f0e8'; g.lineWidth = 1;
      for (let i = 0; i < 26; i++) { g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 16); g.stroke(); }
      g.strokeStyle = '#6c6a60'; for (let i = 0; i < 12; i++) { g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 12); g.stroke(); }
      g.globalAlpha = 0.55; blobs(g, w, h, 9, '#6a1014', 3, 9); g.globalAlpha = 1;
    });
    for (let k = 0; k < 3; k++) TEX['blood' + k] = canvasTex(64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      splat(g, 32, 32, 26 - k * 3, k === 2 ? '#3a0507' : '#5c080a');
      if (k === 1) { splat(g, 18, 44, 10, '#4a0608'); splat(g, 46, 16, 8, '#4a0608'); }
      g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.5; blobs(g, w, h, 20, '#2c0304', 2, 6); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    });
    TEX.drag = canvasTex(32, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = '#4c0709';
      for (let y = 0; y < h; y += 2) { const x = 10 + Math.sin(y * 0.11) * 4 + rnd() * 2, ww = 8 + rnd() * 7 * (1 - y / h * 0.6); if (rnd() > 0.13) g.fillRect(x, y, ww, 2); }
    });
    TEX.spill = canvasTex(64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h); splat(g, 32, 32, 28, '#2b3312'); splat(g, 30, 34, 18, '#48501a'); splat(g, 36, 28, 9, '#5e0c0e');
    });
    TEX.pit = canvasTex(32, 32, (g, w, h) => { noiseFill(g, w, h, [58, 4, 6], 22); g.globalAlpha = 0.5; blobs(g, w, h, 8, '#1c0102', 2, 7); g.globalAlpha = 1; });
    TEX.locker = canvasTex(32, 64, (g, w, h) => {
      noiseFill(g, w, h, [78, 92, 86], 14);
      g.fillStyle = '#2a302e'; g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h); g.fillRect(0, 0, w, 1); g.fillRect(0, h - 1, w, 1);
      g.fillStyle = '#141816'; for (let i = 0; i < 5; i++) g.fillRect(8, 6 + i * 3, 16, 1);
      for (let i = 0; i < 3; i++) g.fillRect(8, 52 + i * 3, 16, 1);
      g.fillStyle = '#c8c8b8'; g.fillRect(24, 30, 3, 7); g.fillStyle = '#d8d4c0'; g.fillRect(11, 24, 10, 4);
      g.globalAlpha = 0.6; blobs(g, w, 14, 8, '#5a3418', 1, 4); g.translate(0, 50); blobs(g, w, 14, 12, '#5a3418', 1, 4); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    });
    TEX.door = canvasTex(64, 128, (g, w, h) => {
      noiseFill(g, w, h, [86, 98, 104], 16);
      g.fillStyle = '#2c3336'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h); g.fillRect(0, 0, w, 2);
      g.fillStyle = '#0a0c0e'; g.fillRect(20, 16, 24, 26); g.strokeStyle = '#3a4246'; g.lineWidth = 2; g.strokeRect(20, 16, 24, 26);
      g.strokeStyle = '#20262a'; g.lineWidth = 1; for (let i = -24; i < 24; i += 5) { g.beginPath(); g.moveTo(20 + Math.max(0, i), 16 + Math.max(0, -i)); g.lineTo(Math.min(44, 44 + i), Math.min(42, 42 - i)); g.stroke(); }
      g.fillStyle = '#9a9a8c'; g.fillRect(4, 100, 56, 24); g.fillStyle = '#c4c4b4'; g.fillRect(50, 62, 8, 4); g.fillRect(52, 58, 4, 12);
      g.globalAlpha = 0.55; blobs(g, w, h, 22, '#5c3214', 1, 5); g.globalAlpha = 0.5; splat(g, 30, 86, 14, '#4a0608'); g.globalAlpha = 1;
    });
    TEX.doorcold = canvasTex(64, 128, (g, w, h) => {
      noiseFill(g, w, h, [188, 194, 196], 12);
      g.strokeStyle = '#70787c'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#50585c'; g.fillRect(46, 54, 12, 5); g.fillRect(54, 44, 5, 26);
      g.fillStyle = '#b01818'; g.fillRect(14, 20, 36, 12); text(g, 'COLD', 32, 26, 9, '#f0e8e0');
      g.globalAlpha = 0.45; blobs(g, w, h, 16, '#6a4020', 1, 5); g.globalAlpha = 0.6; g.fillStyle = '#4a0608'; g.fillRect(8, 92, 30, 3); g.fillRect(12, 95, 3, 22); g.fillRect(24, 95, 2, 14); g.globalAlpha = 1;
    });
    TEX.gate = canvasTex(64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = '#5a3a22';
      for (let x = 2; x < w; x += 10) g.fillRect(x, 0, 5, h);
      g.fillRect(0, 4, w, 5); g.fillRect(0, 30, w, 5); g.fillRect(0, 56, w, 5);
      g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.5; blobs(g, w, h, 40, '#2a1608', 1, 4); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    });
    TEX.fluor = canvasTex(32, 8, (g, w, h) => { g.fillStyle = '#39403e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4fff0'; g.fillRect(1, 2, w - 2, 4); });
    TEX.redbulb = canvasTex(8, 8, (g, w, h) => { g.fillStyle = '#ff2a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffb0a0'; g.fillRect(2, 2, 4, 4); });
    TEX.sodium = canvasTex(8, 8, (g, w, h) => { g.fillStyle = '#ffb040'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff0c0'; g.fillRect(2, 2, 4, 4); });
    TEX.chainlink = canvasTex(32, 32, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.strokeStyle = '#7c8488'; g.lineWidth = 1.6;
      for (let i = -32; i < 64; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 32); g.stroke(); g.beginPath(); g.moveTo(i + 32, 0); g.lineTo(i, 32); g.stroke(); }
      g.fillStyle = '#5c6468'; g.fillRect(0, 0, w, 2);
    });
    TEX.chain = canvasTex(16, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.strokeStyle = '#8a8478'; g.lineWidth = 2;
      for (let y = 0; y < h; y += 8) { g.strokeRect(5, y + 0.5, 6, 7); g.fillStyle = '#5a5448'; g.fillRect(7, y + 5, 2, 6); }
    });
    TEX.hook = canvasTex(16, 32, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.strokeStyle = '#a8a498'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(8, 0); g.lineTo(8, 18); g.arc(5, 22, 5, -0.6, 2.9); g.stroke();
      g.fillStyle = '#5a0a0c'; g.fillRect(1, 24, 3, 5);
    });
    TEX.curtain = canvasTex(64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let x = 0; x < w; x += 8) {
        const l = h - Math.floor(rnd() * 5);
        g.fillStyle = (x / 8) % 2 ? '#b8b48c' : '#a8a680'; g.fillRect(x, 0, 7, l);
        g.fillStyle = 'rgba(255,255,240,0.35)'; g.fillRect(x + 1, 0, 1, l);
        g.fillStyle = 'rgba(70,10,10,0.75)'; if (rnd() > 0.4) g.fillRect(x + 1, 30 + rnd() * 20, 5, 4 + rnd() * 18);
        g.fillStyle = 'rgba(50,40,20,0.6)'; g.fillRect(x, l - 9, 7, 9);
      }
    });
    TEX.hazard = canvasTex(32, 32, (g, w, h) => {
      g.fillStyle = '#d8b018'; g.fillRect(0, 0, w, h); g.fillStyle = '#16140e';
      for (let i = -32; i < 64; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, 0); g.lineTo(i + 40, 32); g.lineTo(i + 32, 32); g.fill(); }
      g.globalAlpha = 0.4; blobs(g, w, h, 12, '#3a2810', 1, 4); g.globalAlpha = 1;
    });
    TEX.wetsign = canvasTex(32, 48, (g, w, h) => {
      g.fillStyle = '#e4c21c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1608'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      text(g, 'CAUTION', 16, 8, 6, '#1a1608'); text(g, 'WET', 16, 36, 7, '#1a1608'); text(g, 'FLOOR', 16, 43, 6, '#1a1608');
      g.fillStyle = '#1a1608'; g.beginPath(); g.arc(18, 15, 2.5, 0, 7); g.fill(); g.lineWidth = 2.4; g.beginPath(); g.moveTo(17, 18); g.lineTo(12, 24); g.lineTo(8, 22); g.moveTo(12, 24); g.lineTo(18, 28); g.lineTo(24, 26); g.moveTo(17, 18); g.lineTo(23, 20); g.stroke();
    });
    TEX.bucket = canvasTex(32, 32, (g, w, h) => { noiseFill(g, w, h, [196, 170, 24], 20); g.fillStyle = '#16140e'; g.fillRect(0, 12, w, 3); g.globalAlpha = 0.5; blobs(g, w, h, 10, '#4a3a10', 1, 4); g.globalAlpha = 1; });
    TEX.paper = canvasTex(32, 32, (g, w, h) => { g.fillStyle = '#d8d2bc'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a4638'; for (let y = 5; y < 28; y += 4) g.fillRect(4, y, 16 + rnd() * 8, 1); g.fillStyle = 'rgba(90,10,10,0.7)'; g.fillRect(20, 20, 8, 7); });
    TEX.clock = canvasTex(32, 48, (g, w, h) => {
      noiseFill(g, w, h, [70, 74, 70], 12); g.fillStyle = '#101410'; g.fillRect(4, 5, 24, 12);
      text(g, '22:00', 16, 11, 9, '#46ff5a'); g.fillStyle = '#18181a'; g.fillRect(6, 24, 20, 4); g.fillStyle = '#c8c0a0'; g.fillRect(8, 30, 16, 12);
      g.fillStyle = '#484438'; for (let y = 33; y < 41; y += 3) g.fillRect(10, y, 12, 1);
    });
    TEX.breaker = canvasTex(64, 64, (g, w, h) => {
      noiseFill(g, w, h, [84, 88, 82], 14); g.strokeStyle = '#22241f'; g.lineWidth = 2; g.strokeRect(2, 2, w - 4, h - 4);
      g.fillStyle = '#16181a'; for (let i = 0; i < 6; i++) { g.fillRect(8 + i * 8, 12, 5, 14); g.fillRect(8 + i * 8, 34, 5, 14); }
      g.fillStyle = '#c02020'; g.fillRect(48, 50, 10, 8); g.fillStyle = '#e8d020'; g.fillRect(6, 52, 30, 7); text(g, 'DANGER', 21, 56, 6, '#16140e');
      g.globalAlpha = 0.5; blobs(g, w, h, 14, '#5a3418', 1, 4); g.globalAlpha = 1;
    });
    TEX.crt = canvasTex(32, 32, (g, w, h) => { g.fillStyle = '#b8b4a0'; g.fillRect(0, 0, w, h); g.fillStyle = '#0a1410'; g.fillRect(3, 3, 26, 20); g.fillStyle = '#1e5a34'; for (let y = 5; y < 20; y += 3) g.fillRect(5, y, 6 + rnd() * 16, 1); g.fillStyle = '#3a382e'; g.fillRect(22, 26, 6, 3); });
    TEX.vend = canvasTex(32, 64, (g, w, h) => { noiseFill(g, w, h, [120, 24, 24], 18); g.fillStyle = '#0c0e10'; g.fillRect(3, 6, 18, 36); g.fillStyle = '#2a2c2c'; g.fillRect(24, 10, 5, 20); g.fillStyle = '#0c0e10'; g.fillRect(5, 48, 20, 8); text(g, 'COLA', 12, 3, 5, '#f0e0d0'); });
    TEX.van = canvasTex(128, 64, (g, w, h) => {
      noiseFill(g, w, h, [188, 190, 184], 10); g.fillStyle = '#2a5a8c'; g.fillRect(0, 40, w, 6);
      text(g, 'BRITE-NITE', 64, 16, 15, '#2a5a8c'); text(g, 'SANITATION  •  24HR', 64, 31, 8, '#30343a');
      g.globalAlpha = 0.4; blobs(g, w, h, 30, '#4a3a28', 1, 5); g.globalAlpha = 1; g.fillStyle = '#3a3026'; g.fillRect(0, 56, w, 8);
    });
    TEX.vanglass = canvasTex(16, 16, (g, w, h) => { g.fillStyle = '#0c1014'; g.fillRect(0, 0, w, h); g.fillStyle = '#28323a'; g.fillRect(2, 2, 5, 12); });
    TEX.tire = canvasTex(16, 16, (g, w, h) => { noiseFill(g, w, h, [22, 22, 24], 12); });
    TEX.steel = canvasTex(32, 32, (g, w, h) => {
      noiseFill(g, w, h, [150, 156, 158], 16); g.globalAlpha = 0.25; g.strokeStyle = '#e8f0f0'; for (let i = 0; i < 20; i++) { g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.globalAlpha = 0.6; splat(g, 20, 18, 8, '#5a080a'); g.globalAlpha = 1;
    });
    TEX.dark = canvasTex(8, 8, (g, w, h) => { noiseFill(g, w, h, [20, 20, 22], 8); });
    TEX.box = canvasTex(32, 32, (g, w, h) => {
      noiseFill(g, w, h, [150, 120, 78], 18); g.strokeStyle = '#5a4424'; g.strokeRect(0.5, 0.5, w - 1, h - 1); g.fillStyle = '#c8b890'; g.fillRect(0, 13, w, 5);
      text(g, 'OFFAL', 16, 25, 7, '#5a1a10'); g.globalAlpha = 0.5; g.fillStyle = '#4a0a0a'; g.fillRect(4, 27, 22, 5); g.globalAlpha = 1;
    });
    TEX.barrel = canvasTex(32, 32, (g, w, h) => { noiseFill(g, w, h, [38, 70, 96], 18); g.fillStyle = '#16222c'; g.fillRect(0, 9, w, 2); g.fillRect(0, 21, w, 2); g.globalAlpha = 0.6; blobs(g, w, h, 12, '#5a3418', 1, 4); g.globalAlpha = 1; });
    TEX.frost = canvasTex(32, 32, (g, w, h) => { noiseFill(g, w, h, [170, 190, 200], 26); g.globalAlpha = 0.4; blobs(g, w, h, 20, '#f0f8ff', 1, 4); g.globalAlpha = 1; });
    TEX.tag = canvasTex(16, 16, (g, w, h) => { g.fillStyle = '#e0c020'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1608'; g.fillRect(3, 5, 10, 1); g.fillRect(3, 8, 8, 1); g.fillRect(3, 11, 10, 1); g.fillRect(7, 1, 2, 2); });
    TEX.crumb = canvasTex(16, 16, (g, w, h) => { g.clearRect(0, 0, w, h); for (const [x, y, r] of [[4, 5, 3], [10, 8, 3], [6, 11, 2], [12, 3, 2], [2, 10, 2]]) { g.fillStyle = '#1a140c'; g.fillRect(x - 1, y - 1, r + 2, r + 2); g.fillStyle = '#fff6d8'; g.fillRect(x, y, r, r); } });
    TEX.steam = canvasTex(32, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#c8ccc8'; for (let i = 0; i < 90; i++) { const y = rnd() * h, sp = 3 + (1 - y / h) * 11; g.fillRect(16 + (rnd() - 0.5) * sp * 2, y, 2 + rnd() * 3, 2 + rnd() * 3); } });
    TEX.fire = canvasTex(16, 16, (g, w, h) => { noiseFill(g, w, h, [255, 120, 20], 60); g.fillStyle = '#ffe080'; g.fillRect(4, 6, 8, 8); });
    TEX.gore = canvasTex(8, 8, (g, w, h) => { noiseFill(g, w, h, [120, 8, 10], 40); });
    TEX.eyes = canvasTex(16, 8, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ffe8c0'; g.fillRect(3, 3, 2, 2); g.fillRect(11, 3, 2, 2); });
    TEX.key = canvasTex(16, 16, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#e0c860'; g.lineWidth = 2; g.beginPath(); g.arc(5, 5, 3, 0, 7); g.stroke(); g.beginPath(); g.moveTo(7, 7); g.lineTo(14, 14); g.moveTo(11, 11); g.lineTo(13, 9); g.stroke(); });
    // The Grader: 4x4 atlas of 32px cells
    TEX.grader = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      // apron (0,0)-(64,64)
      g.save(); g.beginPath(); g.rect(0, 0, 64, 64); g.clip(); noiseFill(g, 64, 64, [190, 186, 170], 18);
      g.fillStyle = '#8a8676'; g.fillRect(0, 0, 64, 2); g.fillRect(30, 0, 4, 10);
      g.globalAlpha = 0.9; splat(g, 26, 40, 22, '#5a080a'); splat(g, 46, 24, 12, '#6a0a0c'); splat(g, 12, 16, 7, '#4a0608');
      g.fillStyle = '#4a0608'; for (let i = 0; i < 12; i++) g.fillRect(4 + rnd() * 56, 36 + rnd() * 10, 2, 10 + rnd() * 18); g.restore();
      // shirt (64,0)
      g.fillStyle = '#2c3036'; g.fillRect(64, 0, 32, 32); g.fillStyle = '#1c2024'; for (let i = 0; i < 6; i++) g.fillRect(64 + rnd() * 30, rnd() * 30, 3, 6);
      g.fillStyle = 'rgba(90,10,12,0.8)'; g.fillRect(70, 18, 12, 10);
      // glove (96,0)
      g.fillStyle = '#c8a818'; g.fillRect(96, 0, 32, 32); g.fillStyle = '#5a080a'; g.fillRect(96, 12, 32, 20); g.fillStyle = '#8a7410'; g.fillRect(96, 0, 32, 3);
      // trousers (64,32)
      g.fillStyle = '#22242a'; g.fillRect(64, 32, 32, 32); g.fillStyle = 'rgba(80,10,12,0.7)'; g.fillRect(66, 50, 20, 14);
      // boot (96,32)
      g.fillStyle = '#0e0e10'; g.fillRect(96, 32, 32, 32); g.fillStyle = '#3a0608'; g.fillRect(96, 54, 32, 10); g.fillStyle = '#26262a'; g.fillRect(96, 32, 32, 3);
      // head front (0,64)-(64,128): butcher paper, twine, seeping eyes, weight sticker
      g.save(); g.beginPath(); g.rect(0, 64, 64, 64); g.clip(); g.translate(0, 64);
      g.fillStyle = '#a89270'; g.fillRect(0, 0, 64, 64);
      g.globalAlpha = 0.35; g.strokeStyle = '#6a5838'; for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(rnd() * 64, 0); g.lineTo(rnd() * 64, 64); g.stroke(); } g.globalAlpha = 1;
      g.fillStyle = '#1a0606'; g.beginPath(); g.ellipse(20, 26, 6, 5, 0, 0, 7); g.ellipse(44, 26, 6, 5, 0, 0, 7); g.fill();
      g.fillStyle = '#3a0808'; g.fillRect(18, 28, 3, 22); g.fillRect(43, 28, 3, 16); g.fillRect(22, 30, 2, 9);
      g.strokeStyle = '#d8ceb0'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 14); g.lineTo(64, 18); g.moveTo(0, 40); g.lineTo(64, 36); g.moveTo(30, 0); g.lineTo(34, 64); g.stroke();
      g.fillStyle = '#f0ece0'; g.fillRect(22, 46, 26, 13); g.strokeStyle = '#b01818'; g.lineWidth = 1; g.strokeRect(22.5, 46.5, 25, 12);
      text(g, '61.2', 35, 53, 10, '#16140e'); g.restore();
      // head side (64,64)
      g.save(); g.beginPath(); g.rect(64, 64, 64, 64); g.clip(); g.translate(64, 64);
      g.fillStyle = '#9c8866'; g.fillRect(0, 0, 64, 64); g.globalAlpha = 0.35; g.strokeStyle = '#6a5838'; for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(rnd() * 64, 0); g.lineTo(rnd() * 64, 64); g.stroke(); } g.globalAlpha = 1;
      g.strokeStyle = '#d8ceb0'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 16); g.lineTo(64, 14); g.moveTo(0, 38); g.lineTo(64, 40); g.stroke();
      g.globalAlpha = 0.6; splat(g, 30, 50, 12, '#3a0808'); g.restore();
    });
  }

  HW.loadTextures = function (cb) {
    makeProcedural();
    let left = FILES.length;
    const loader = new THREE.TextureLoader();
    FILES.forEach(name => {
      TEX[name] = setup(loader.load('assets/tex/' + name + '.png', () => { if (--left === 0) cb(); }, undefined, () => {
        TEX[name] = canvasTex(16, 16, (g, w, h) => noiseFill(g, w, h, [96, 96, 92], 30));
        if (--left === 0) cb();
      }));
    });
  };

  // ---------- Blender-authored models (assets/models/*.json, built by tools/make_assets.py) ----------
  const MODELS = HW.MODELS = {};
  HW.loadModels = function (names, cb) {
    let left = names.length;
    names.forEach(n => fetch('assets/models/' + n + '.json').then(r => r.json()).then(j => { MODELS[n] = j; }).catch(() => { }).then(() => { if (--left === 0) cb(); }));
  };
  HW.partGeo = function (model, part) {
    const P = MODELS[model].parts[part], g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(P.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(P.uv, 2));
    return g;
  };

  // ---------- materials ----------
  const mats = {};
  function mkMat(tex, baked, opts) {
    opts = opts || {};
    const u = {
      map: { value: tex }, uTint: { value: new THREE.Color(opts.tint || 0xffffff) }, uEmis: opts.emisU || { value: opts.emis || 0 },
      uAmb: { value: new V3(0.05, 0.05, 0.06) }
    };
    for (const k in U) u[k] = U[k];
    return new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, defines: baked ? { BAKED: 1 } : {}, side: THREE.DoubleSide });
  }
  HW.dropMat = function (name) { if (mats[name]) { mats[name].dispose(); delete mats[name]; } };
  HW.bakedMat = function (name) { return mats[name] || (mats[name] = mkMat(TEX[name], true)); };
  HW.dynMat = function (texOrName, opts) { return mkMat(typeof texOrName === 'string' ? TEX[texOrName] : texOrName, false, opts); };

  // ---------- static builder ----------
  const B = HW.B = { bufs: {} };
  function buf(tex) { return B.bufs[tex] || (B.bufs[tex] = { p: [], n: [], uv: [], e: [] }); }
  // quad a,b,c,d (a→b = u axis, a→d = v axis), explicit normal n; uvr = [u0,v0,u1,v1]
  B.quad = function (tex, a, b, c, d, n, uvr, su, sv, emis) {
    const o = buf(tex); uvr = uvr || [0, 0, 1, 1]; su = su || 1; sv = sv || 1;
    const P = (s, t) => [
      (a[0] * (1 - s) + b[0] * s) * (1 - t) + (d[0] * (1 - s) + c[0] * s) * t,
      (a[1] * (1 - s) + b[1] * s) * (1 - t) + (d[1] * (1 - s) + c[1] * s) * t,
      (a[2] * (1 - s) + b[2] * s) * (1 - t) + (d[2] * (1 - s) + c[2] * s) * t];
    const UVf = (s, t) => [uvr[0] + (uvr[2] - uvr[0]) * s, uvr[1] + (uvr[3] - uvr[1]) * t];
    for (let i = 0; i < su; i++) for (let j = 0; j < sv; j++) {
      const s0 = i / su, s1 = (i + 1) / su, t0 = j / sv, t1 = (j + 1) / sv;
      const q = [[s0, t0], [s1, t0], [s1, t1], [s0, t0], [s1, t1], [s0, t1]];
      for (const [s, t] of q) { const p = P(s, t), uv = UVf(s, t); o.p.push(p[0], p[1], p[2]); o.n.push(n[0], n[1], n[2]); o.uv.push(uv[0], uv[1]); o.e.push(emis || 0); }
    }
  };
  // axis-aligned (optionally y-rotated) box. uvm: 'fit' or metres-per-repeat number
  B.box = function (tex, cx, cy, cz, sx, sy, sz, rot, uvm, skip) {
    rot = rot || 0; const cs = Math.cos(rot), sn = Math.sin(rot); skip = skip || '';
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const R = (x, y, z) => [cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs];
    const N = (x, y, z) => [x * cs + z * sn, y, -x * sn + z * cs];
    const m = (uvm === 'fit' || !uvm || Array.isArray(uvm)) ? null : uvm;
    const uv = (w, h) => Array.isArray(uvm) ? uvm : (m ? [0, 0, w / m, h / m] : [0, 0, 1, 1]);
    if (skip.indexOf('s') < 0) B.quad(tex, R(-hx, -hy, hz), R(hx, -hy, hz), R(hx, hy, hz), R(-hx, hy, hz), N(0, 0, 1), uv(sx, sy));
    if (skip.indexOf('n') < 0) B.quad(tex, R(hx, -hy, -hz), R(-hx, -hy, -hz), R(-hx, hy, -hz), R(hx, hy, -hz), N(0, 0, -1), uv(sx, sy));
    if (skip.indexOf('e') < 0) B.quad(tex, R(hx, -hy, hz), R(hx, -hy, -hz), R(hx, hy, -hz), R(hx, hy, hz), N(1, 0, 0), uv(sz, sy));
    if (skip.indexOf('w') < 0) B.quad(tex, R(-hx, -hy, -hz), R(-hx, -hy, hz), R(-hx, hy, hz), R(-hx, hy, -hz), N(-1, 0, 0), uv(sz, sy));
    if (skip.indexOf('t') < 0) B.quad(tex, R(-hx, hy, hz), R(hx, hy, hz), R(hx, hy, -hz), R(-hx, hy, -hz), [0, 1, 0], uv(sx, sz));
    if (skip.indexOf('b') < 0) B.quad(tex, R(-hx, -hy, -hz), R(hx, -hy, -hz), R(hx, -hy, hz), R(-hx, -hy, hz), [0, -1, 0], uv(sx, sz));
  };
  // a whole Blender model baked into the static world
  B.model = function (name, x, y, z, rot, sc) {
    const M = MODELS[name]; if (!M) return false;
    const o = buf('m_' + name), cs = Math.cos(rot || 0), sn = Math.sin(rot || 0); sc = sc || 1;
    for (const pn in M.parts) {
      const P = M.parts[pn], pv = P.pivot;
      for (let i = 0; i < P.p.length; i += 3) {
        const lx = (P.p[i] + pv[0]) * sc, ly = (P.p[i + 1] + pv[1]) * sc, lz = (P.p[i + 2] + pv[2]) * sc, nx = P.n[i], nz = P.n[i + 2];
        o.p.push(x + lx * cs + lz * sn, y + ly, z - lx * sn + lz * cs); o.n.push(nx * cs + nz * sn, P.n[i + 1], -nx * sn + nz * cs); o.e.push(0);
      }
      for (let i = 0; i < P.uv.length; i++) o.uv.push(P.uv[i]);
    }
    return true;
  };
  // flat decal on the floor
  B.decal = function (tex, x, z, size, rot, y) {
    const cs = Math.cos(rot || 0), sn = Math.sin(rot || 0), h = size / 2; y = y || 0.012;
    const R = (dx, dz) => [x + dx * cs + dz * sn, y, z - dx * sn + dz * cs];
    B.quad(tex, R(-h, h), R(h, h), R(h, -h), R(-h, -h), [0, 1, 0]);
  };
  // upright quad centred at x,z facing along rot (0 = faces +z)
  B.card = function (tex, x, y0, z, w, h, rot, uvr, emis) {
    const cs = Math.cos(rot || 0), sn = Math.sin(rot || 0), hw = w / 2;
    B.quad(tex, [x - hw * cs, y0, z + hw * sn], [x + hw * cs, y0, z - hw * sn], [x + hw * cs, y0 + h, z - hw * sn], [x - hw * cs, y0 + h, z + hw * sn], [sn, 0, cs], uvr || [0, 0, 1, 1], 1, 1, emis);
  };
  // run fn against a scratch buffer set and return plain geometries keyed by texture (for dynamic meshes)
  B.capture = function (fn) {
    const keep = B.bufs; B.bufs = {}; fn(); const res = {};
    for (const name in B.bufs) {
      const o = B.bufs[name], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(o.uv, 2));
      res[name] = g;
    }
    B.bufs = keep; return res;
  };
  // group of dynamic meshes from captured geometry; all share one uAmb/uTint so the group lights as a unit
  HW.dynGroup = function (fn, opts) {
    const gs = B.capture(fn), grp = new THREE.Group(); grp.userData.mats = [];
    for (const name in gs) { const m = HW.dynMat(name, opts); const me = new THREE.Mesh(gs[name], m); me.frustumCulled = false; grp.add(me); grp.userData.mats.push(m); }
    return grp;
  };
  HW.setAmb = function (grp, r, g, b) { const ms = grp.userData.mats; for (let i = 0; i < ms.length; i++) ms[i].uniforms.uAmb.value.set(r, g, b); };
  // finalize: bake(x,y,z,nx,ny,nz,out) fills out[0..5] = off rgb, on rgb
  B.finalize = function (bake, emisTex) {
    const out = [0, 0, 0, 0, 0, 0], meshes = [];
    for (const name in B.bufs) {
      const o = B.bufs[name], nV = o.p.length / 3;
      const c0 = new Float32Array(nV * 3), c1 = new Float32Array(nV * 3);
      for (let i = 0; i < nV; i++) {
        if (o.e[i]) { const e = o.e[i]; c0[i * 3] = c0[i * 3 + 1] = c0[i * 3 + 2] = e === 2 ? 0.04 : 1.6; c1[i * 3] = c1[i * 3 + 1] = c1[i * 3 + 2] = 1.6; continue; }
        bake(o.p[i * 3], o.p[i * 3 + 1], o.p[i * 3 + 2], o.n[i * 3], o.n[i * 3 + 1], o.n[i * 3 + 2], out);
        c0[i * 3] = out[0]; c0[i * 3 + 1] = out[1]; c0[i * 3 + 2] = out[2]; c1[i * 3] = out[3]; c1[i * 3 + 1] = out[4]; c1[i * 3 + 2] = out[5];
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(o.uv, 2));
      g.setAttribute('aCol0', new THREE.BufferAttribute(c0, 3));
      g.setAttribute('aCol1', new THREE.BufferAttribute(c1, 3));
      const m = new THREE.Mesh(g, HW.bakedMat(name)); m.frustumCulled = false; m.matrixAutoUpdate = false;
      HW.scene.add(m); meshes.push(m);
    }
    B.bufs = {}; return meshes;
  };
})();
