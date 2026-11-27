'use strict';
/* Extra procedural textures for the Sainte-Mireille games: town, people, paper, violet ink. */
(function () {
  const TEX = HW.TEX, cv = HW.canvasTex, rnd = HW.srnd;
  function noise(g, w, h, base, amp) {
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * amp; d[i] = Math.max(0, Math.min(255, base[0] + n)); d[i + 1] = Math.max(0, Math.min(255, base[1] + n)); d[i + 2] = Math.max(0, Math.min(255, base[2] + n)); d[i + 3] = 255; }
    g.putImageData(im, 0, 0);
  }
  function blobs(g, w, h, n, col, r0, r1) { g.fillStyle = col; for (let i = 0; i < n; i++) { const r = r0 + rnd() * (r1 - r0); g.beginPath(); g.ellipse(rnd() * w, rnd() * h, r, r * (0.5 + rnd()), rnd() * 3, 0, 7); g.fill(); } }
  function text(g, s, x, y, px, col, align, font) { g.font = (font || 'bold ') + px + 'px Arial, Helvetica, sans-serif'; g.fillStyle = col; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
  function streaks(g, w, h, n, col) { g.fillStyle = col; for (let i = 0; i < n; i++) g.fillRect(rnd() * w, rnd() * h * 0.5, 1 + rnd() * 2, 8 + rnd() * h * 0.4); }

  HW.extraTex = function () {
    TEX.cobble = cv(64, 64, (g, w, h) => {
      noise(g, w, h, [34, 36, 40], 10);
      for (let y = 0; y < 8; y++) for (let x = -1; x < 8; x++) { const ox = (y % 2) * 4, v = 62 + rnd() * 34 | 0; g.fillStyle = 'rgb(' + v + ',' + (v + 2) + ',' + (v + 7) + ')'; g.fillRect(x * 8 + ox + 1, y * 8 + 1, 6, 6); g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x * 8 + ox + 1, y * 8 + 1, 6, 1); }
      g.globalAlpha = 0.3; blobs(g, w, h, 10, '#101418', 3, 9); g.globalAlpha = 1;
    });
    TEX.quay = cv(64, 64, (g, w, h) => {
      noise(g, w, h, [88, 88, 84], 18); g.fillStyle = '#3a3a38'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 1); for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) g.fillRect(x * 32 + (y % 2) * 16, y * 16, 1, 16);
      g.globalAlpha = 0.35; blobs(g, w, h, 14, '#20262a', 2, 8); g.globalAlpha = 1;
    });
    // two storeys of a harbour house: plinth + shuttered ground window below, shuttered window above
    function facade(base, shut, door) {
      return cv(64, 128, (g, w, h) => {
        noise(g, w, h, base, 16); g.globalAlpha = 0.28; streaks(g, w, h, 26, '#2a2c2a'); g.globalAlpha = 0.25; blobs(g, w, h, 18, '#3a3a34', 2, 9); g.globalAlpha = 1;
        g.fillStyle = '#4a4a46'; g.fillRect(0, 112, w, 16); g.fillStyle = '#2e2e2c'; g.fillRect(0, 111, w, 2); g.fillRect(0, 62, w, 2);
        const win = (y, hh) => { g.fillStyle = '#6a685e'; g.fillRect(18, y - 3, 28, hh + 6); g.fillStyle = shut; g.fillRect(20, y, 24, hh); g.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 2; i < hh; i += 4) g.fillRect(20, y + i, 24, 1); g.fillStyle = '#16181a'; g.fillRect(31, y, 2, hh); };
        win(14, 34); if (door) { g.fillStyle = '#3a2a1c'; g.fillRect(22, 74, 20, 38); g.fillStyle = '#20160e'; g.fillRect(24, 77, 16, 14); g.fillRect(24, 94, 16, 15); g.fillStyle = '#b8a060'; g.fillRect(38, 92, 2, 3); } else win(76, 28);
      });
    }
    TEX.facade = facade([142, 136, 122], '#26423a', false);
    TEX.facade2 = facade([126, 128, 132], '#3a2a22', true);
    TEX.facade3 = facade([150, 132, 112], '#2a3446', false);
    TEX.bureau = cv(64, 128, (g, w, h) => {
      noise(g, w, h, [92, 94, 98], 12); g.fillStyle = '#3c3e42'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 1); for (let y = 0; y < 8; y++) g.fillRect((y % 2) * 32, y * 16, 1, 16);
      for (const y of [12, 72]) { g.fillStyle = '#0c0e12'; g.fillRect(22, y, 20, 38); g.fillStyle = '#5a5c60'; for (let x = 24; x < 42; x += 5) g.fillRect(x, y, 1, 38); g.fillRect(22, y + 18, 20, 1); }
      g.globalAlpha = 0.3; streaks(g, w, h, 20, '#1a1c20'); g.globalAlpha = 1;
    });
    TEX.stone = cv(64, 64, (g, w, h) => {
      noise(g, w, h, [70, 70, 68], 16); g.fillStyle = '#26262a'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 1); for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) g.fillRect(x * 24 + (y % 2) * 12, y * 16, 1, 16);
      g.globalAlpha = 0.3; blobs(g, w, h, 14, '#1c2420', 2, 8); g.globalAlpha = 1;
    });
    TEX.plaster = cv(64, 64, (g, w, h) => { noise(g, w, h, [134, 138, 124], 12); g.fillStyle = '#5c5a4a'; g.fillRect(0, 40, w, 2); noise2(g, 0, 42, w, 22, [86, 84, 70]); g.globalAlpha = 0.25; blobs(g, w, h, 12, '#3a3a30', 2, 7); g.globalAlpha = 1; });
    function noise2(g, x, y, w, h, base) { g.fillStyle = 'rgb(' + base.join(',') + ')'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 60; i++) g.fillRect(x + rnd() * w, y + rnd() * h, 2, 1); }
    TEX.wallpaper = cv(32, 32, (g, w, h) => { noise(g, w, h, [112, 96, 78], 10); g.fillStyle = '#6a5440'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const px = x * 8 + (y % 2) * 4, py = y * 8 + 2; g.fillRect(px + 3, py, 2, 5); g.fillRect(px + 1, py + 2, 6, 1); } g.globalAlpha = 0.3; blobs(g, w, h, 6, '#3a2c20', 2, 6); g.globalAlpha = 1; });
    TEX.water = cv(32, 32, (g, w, h) => { noise(g, w, h, [16, 26, 30], 10); g.fillStyle = 'rgba(120,150,150,0.35)'; for (let i = 0; i < 18; i++) g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 6, 1); });
    TEX.door2 = cv(64, 128, (g, w, h) => {
      noise(g, w, h, [70, 48, 30], 12); g.fillStyle = '#2a1c10'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h); g.fillRect(0, 0, w, 2);
      g.strokeStyle = '#2e1e12'; g.lineWidth = 2; g.strokeRect(9, 10, 46, 40); g.strokeRect(9, 60, 46, 56); g.fillStyle = '#c0a860'; g.fillRect(50, 62, 6, 4); g.fillRect(52, 58, 3, 12);
      g.globalAlpha = 0.3; blobs(g, w, h, 12, '#1a120a', 1, 5); g.globalAlpha = 1;
    });
    TEX.gate2 = cv(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#1c1e20'; for (let x = 2; x < w; x += 8) g.fillRect(x, 0, 3, h); g.fillRect(0, 6, w, 4); g.fillRect(0, 52, w, 4); g.fillStyle = '#6a6040'; g.fillRect(26, 28, 12, 9); });
    // people atlas, 16px cells: row 0 coats (grey, navy, brown, black), row 1 trousers / skin / face / face, row 2 hat / violet card / shoe / hair
    TEX.person = cv(64, 64, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const coat = (x, col) => { g.save(); g.beginPath(); g.rect(x, 0, 16, 16); g.clip(); g.translate(x, 0); g.fillStyle = col; g.fillRect(0, 0, 16, 16); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(7, 0, 1, 16); g.fillRect(0, 13, 16, 1); g.fillStyle = 'rgba(255,255,255,0.18)'; for (const y of [3, 7, 11]) g.fillRect(9, y, 1, 1); for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(rnd() * 16, rnd() * 16, 2, 1); } g.restore(); };
      coat(0, '#5a5c5e'); coat(16, '#2e3a4c'); coat(32, '#5c4630'); coat(48, '#0e0e12');
      g.fillStyle = '#26262a'; g.fillRect(0, 16, 16, 16); g.fillStyle = '#1a1a1c'; g.fillRect(0, 28, 16, 4);
      g.fillStyle = '#b89478'; g.fillRect(16, 16, 16, 16);
      const face = x => { g.fillStyle = '#b89478'; g.fillRect(x, 16, 16, 16); g.fillStyle = '#9a7860'; g.fillRect(x, 16, 16, 2); g.fillStyle = '#1c1410'; g.fillRect(x + 4, 22, 2, 1); g.fillRect(x + 10, 22, 2, 1); g.fillStyle = '#a07e66'; g.fillRect(x + 7, 23, 2, 3); g.fillStyle = '#7a4a3c'; g.fillRect(x + 6, 28, 4, 1); };
      face(32); face(48); g.fillStyle = '#7a4a3c'; g.fillRect(53, 27, 1, 1); g.fillRect(58, 27, 1, 1);
      g.fillStyle = '#1e1e22'; g.fillRect(0, 32, 16, 16); g.fillStyle = '#2c2c32'; g.fillRect(0, 44, 16, 2);
      g.fillStyle = '#e8e2d0'; g.fillRect(16, 32, 16, 16); g.fillStyle = '#6a30c0'; g.fillRect(18, 35, 12, 2); g.fillRect(18, 39, 8, 2); g.fillRect(20, 43, 9, 2);
      g.fillStyle = '#141416'; g.fillRect(32, 32, 16, 16); g.fillStyle = '#3a2c20'; g.fillRect(48, 32, 16, 16);
    });
    // stipple shadow (every other pixel), classic mesh transparency
    TEX.shadow = cv(16, 32, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#050608'; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (x - 7.5) / 8, dy = (y - 15.5) / 16; const rr = dx * dx + dy * dy; if (rr < 0.62 || (rr < 1 && ((x + y) & 1))) g.fillRect(x, y, 1, 1); } });
    TEX.violet = cv(8, 8, (g, w, h) => { noise(g, w, h, [104, 48, 200], 30); });
    TEX.ledger = cv(32, 32, (g, w, h) => { g.fillStyle = '#d2cab0'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a5648'; for (let y = 4; y < 30; y += 3) { g.fillRect(2, y, 12, 1); g.fillRect(17, y, 5, 1); g.fillRect(25, y, 5, 1); } g.fillStyle = '#8a2a20'; g.fillRect(15, 0, 1, h); g.fillRect(23, 0, 1, h); g.fillStyle = 'rgba(104,48,200,0.8)'; g.fillRect(20, 22, 9, 6); });
    TEX.tvbars = cv(32, 32, (g, w, h) => { g.fillStyle = '#8a8676'; g.fillRect(0, 0, w, h); const cols = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0']; cols.forEach((c2, i) => { g.fillStyle = c2; g.fillRect(3 + i * 3.7, 3, 4, 20); }); g.fillStyle = '#101010'; g.fillRect(3, 19, 26, 4); g.fillStyle = '#3a382e'; g.fillRect(22, 26, 6, 3); });
    TEX.shelf = cv(64, 64, (g, w, h) => { noise(g, w, h, [56, 42, 28], 10); for (let r = 0; r < 4; r++) { g.fillStyle = '#1a140c'; g.fillRect(0, r * 16, w, 2); for (let x = 1; x < w; x += 7) { const v = 100 + rnd() * 70 | 0; g.fillStyle = 'rgb(' + v + ',' + (v - 8) + ',' + (v - 30) + ')'; const hh = 9 + rnd() * 4 | 0; g.fillRect(x, r * 16 + 16 - hh, 6, hh); g.fillStyle = '#3a3428'; g.fillRect(x + 1, r * 16 + 18 - hh, 4, 2); } } });
    TEX.boxes = cv(64, 64, (g, w, h) => { noise(g, w, h, [84, 70, 44], 10); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = '#2a2214'; g.fillRect(x * 8, y * 8, 8, 1); g.fillRect(x * 8, y * 8, 1, 8); g.fillStyle = '#c8b870'; g.fillRect(x * 8 + 3, y * 8 + 4, 2, 2); } });
    TEX.box51 = cv(32, 32, (g, w, h) => { noise(g, w, h, [104, 88, 52], 10); g.strokeStyle = '#2a2214'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); g.fillStyle = '#e0d49a'; g.fillRect(7, 6, 18, 11); text(g, '51', 16, 12, 10, '#1a140c'); g.fillStyle = '#d8c060'; g.fillRect(14, 21, 4, 5); });
    TEX.box2 = cv(32, 32, (g, w, h) => { noise(g, w, h, [128, 104, 70], 16); g.strokeStyle = '#4a3a20'; g.strokeRect(0.5, 0.5, w - 1, h - 1); g.fillStyle = '#4a3a20'; g.fillRect(0, 10, w, 1); g.fillRect(0, 21, w, 1); text(g, 'SEL', 16, 16, 7, '#3a2a18'); });
    TEX.chart = cv(64, 64, (g, w, h) => { g.fillStyle = '#d6cfb4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8470'; g.lineWidth = 1; for (let i = 8; i < 64; i += 8) { g.beginPath(); g.moveTo(i, 4); g.lineTo(i, 60); g.moveTo(4, i); g.lineTo(60, i); g.stroke(); } g.strokeStyle = '#2a2620'; g.lineWidth = 1.5; for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 4; x < 60; x += 2) { const y = 20 + k * 12 + Math.sin(x * 0.2 + k * 2) * 6; x === 4 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); } text(g, '07:50', 44, 54, 9, '#8a2018'); });
    TEX.net = cv(32, 32, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#6a644c'; g.lineWidth = 1; for (let i = -32; i < 64; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 32); g.stroke(); g.beginPath(); g.moveTo(i + 32, 0); g.lineTo(i, 32); g.stroke(); } });
    TEX.barley = cv(32, 32, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#c8a440'; g.lineWidth = 1.5; for (let x = 2; x < w; x += 4) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + (rnd() - 0.5) * 3, 6 + rnd() * 6); g.stroke(); g.fillStyle = '#e0c060'; g.fillRect(x - 1, 4 + rnd() * 5, 3, 7); } });
    TEX.candle = cv(8, 16, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#e8e0c8'; g.fillRect(2, 6, 4, 10); g.fillStyle = '#ffd060'; g.fillRect(3, 1, 2, 5); g.fillStyle = '#fff8d0'; g.fillRect(3, 3, 2, 2); });
    TEX.press = cv(32, 32, (g, w, h) => { noise(g, w, h, [36, 40, 42], 12); g.fillStyle = '#16181a'; g.fillRect(4, 4, 24, 3); g.fillRect(4, 14, 24, 2); g.fillStyle = '#7a7460'; g.fillRect(8, 20, 16, 8); g.fillStyle = '#b8a060'; g.fillRect(2, 2, 2, 2); g.fillRect(28, 2, 2, 2); });
    TEX.type = cv(32, 32, (g, w, h) => { noise(g, w, h, [70, 54, 36], 10); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = '#1e160e'; g.fillRect(x * 4, y * 4, 4, 1); g.fillRect(x * 4, y * 4, 1, 4); if (rnd() > 0.3) { g.fillStyle = '#8a8880'; g.fillRect(x * 4 + 1, y * 4 + 1, 2, 2); } } });
    TEX.glassw = cv(32, 32, (g, w, h) => { g.fillStyle = '#1c1a22'; g.fillRect(0, 0, w, h); const cs = ['#6a2a2a', '#2a3a6a', '#6a5a2a', '#2a5a3a', '#4a2a6a']; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = cs[(x * 3 + y * 2 + (rnd() * 2 | 0)) % 5]; g.fillRect(x * 8 + 1, y * 8 + 1, 6, 6); } });
    TEX.seal = cv(64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.strokeStyle = '#7a4ad8'; g.fillStyle = '#7a4ad8'; g.lineWidth = 2.4; g.beginPath(); g.arc(32, 32, 29, 0, 7); g.stroke();
      g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5, x = 32 + Math.cos(a) * 27, y = 32 + Math.sin(a) * 27; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); g.stroke();
      g.beginPath(); g.ellipse(32, 25, 11, 6, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(32, 25, 3.2, 0, 7); g.fill();
      g.lineWidth = 2; for (const dx of [-7, -3.5, 0, 3.5, 7]) { g.beginPath(); g.moveTo(32 + dx * 0.3, 53); g.lineTo(32 + dx, 36); g.stroke(); g.fillRect(32 + dx - 1.5, 33, 3, 6); }
    });
    TEX.white = cv(8, 8, (g, w, h) => { noise(g, w, h, [220, 218, 208], 10); });
    TEX.grey = cv(16, 16, (g, w, h) => { noise(g, w, h, [128, 130, 132], 14); });
    TEX.sand = cv(32, 32, (g, w, h) => { noise(g, w, h, [150, 150, 146], 20); g.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 30; i++) g.fillRect(rnd() * w, rnd() * h, 1, 1); });
  };
  HW.tex2 = { noise, blobs, text, streaks };
})();
