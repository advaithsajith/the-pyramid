'use strict';
/* Generic tile-level builder: zones, facades, doors, baked lights, colliders, interactables.
   A level is described with rect()/prop calls, then finish() bakes it. unload() frees it so another can be built. */
(function () {
  const T = 1.6; HW.T = T;
  const B = HW.B, TEX = HW.TEX;
  const c = t => (t + 0.5) * T; HW.c = c;
  let M = null, signN = 0;
  const SOD = [1.0, 0.66, 0.28], WARM = [1.0, 0.8, 0.5], COLD = [0.7, 0.9, 1.0], FL = [0.82, 1.0, 0.9], VIO = [0.62, 0.3, 1.0], RED = [1.0, 0.14, 0.08];
  HW.LC = { SOD, WARM, COLD, FL, VIO, RED };

  HW.newLevel = function (W, H, ZD, FAC) {
    HW.W = W; HW.H = H; HW.ZONES = ZD; FAC = FAC || {};
    if (!ZD.D) ZD.D = { name: 'door', floor: 'wood', wall: 'wood', ceil: 'wood', h: 2.2, amb: [0.02, 0.02, 0.022], step: 'conc' };
    const zk = new Array(W * H).fill(null), sol = new Array(W * H).fill(null);
    const idx = (x, z) => z * W + x, inb = (x, z) => x >= 0 && z >= 0 && x < W && z < H, zat = (x, z) => inb(x, z) ? zk[idx(x, z)] : null;
    const doors = [], doorAt = {}, colTile = [], lights = [], lamps = [];
    for (let i = 0; i < W * H; i++) colTile.push(null);
    const blocked = new Uint8Array(W * H);
    M = HW.M = { W, H, zk, sol, idx, inb, zat, doors, doorAt, blocked, colTile, lights, lamps, INT: [], dyn: [], meshes: [], signs: [], sites: {}, ZD };
    const L = { M, c, T };
    L.rect = (k, x0, z0, x1, z1) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (inb(x, z)) zk[idx(x, z)] = k; };
    L.set = (k, x, z) => { zk[idx(x, z)] = k; };
    L.solid = (f, x0, z0, x1, z1) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (inb(x, z)) sol[idx(x, z)] = f; };
    L.door = function (id, x, z, o) {
      o = o || {}; zk[idx(x, z)] = 'D';
      const d = { id, x, z, kind: o.kind || 'swing', locked: o.locked || null, open: 0, want: 0, wx: c(x), wz: c(z), tex: o.tex || 'door2' };
      doors.push(d); doorAt[idx(x, z)] = d; return d;
    };
    // ---- colliders ----
    function addCol(col) {
      const x0 = col.r ? col.x - col.r : col.x0, x1 = col.r ? col.x + col.r : col.x1, z0 = col.r ? col.z - col.r : col.z0, z1 = col.r ? col.z + col.r : col.z1;
      for (let tz = Math.floor(z0 / T); tz <= Math.floor(z1 / T); tz++) for (let tx = Math.floor(x0 / T); tx <= Math.floor(x1 / T); tx++) { if (!inb(tx, tz)) continue; const i = idx(tx, tz); (colTile[i] || (colTile[i] = [])).push(col); }
      return col;
    }
    L.aabb = (x, z, sx, sz) => addCol({ x0: x - sx / 2, z0: z - sz / 2, x1: x + sx / 2, z1: z + sz / 2 });
    L.circ = (x, z, r) => addCol({ x, z, r });
    L.block = (tx, tz) => { if (inb(tx, tz)) blocked[idx(tx, tz)] = 1; };
    const blockW = (wx, wz) => L.block(Math.floor(wx / T), Math.floor(wz / T));
    // ---- lights ----
    L.light = (wx, y, wz, col, I, R, p) => { lights.push({ x: wx, y, z: wz, c: [col[0] * I, col[1] * I, col[2] * I], R, p: !!p }); };
    L.lamp = function (tx, tz, o) {                      // street lamp: post, lantern, sodium pool
      o = o || {}; const x = c(tx) + (o.dx || 0), z = c(tz) + (o.dz || 0), h = o.h || 3.4, col = o.col || SOD;
      B.box('dark', x, h / 2, z, 0.1, h, 0.1); B.box('dark', x, 0.12, z, 0.24, 0.24, 0.24); B.box('dark', x, h + 0.2, z, 0.34, 0.06, 0.34);
      if (!o.dead) { B.box('sodium', x, h + 0.02, z, 0.22, 0.3, 0.22, 0, 'fit', 'tb'); const q = B.bufs.sodium; for (let i = q.e.length - 24; i < q.e.length; i++) q.e[i] = 1; L.light(x, h - 0.1, z, col, (o.I || 1) * 2.8, o.R || 9.5); lamps.push({ x, z, h, R: o.R || 9.5 }); }
      L.circ(x, z, 0.14);
    };
    L.ceilLight = function (tx, tz, col, I, R, y, p) {
      const k = zat(Math.floor(tx), Math.floor(tz)), hh = y || ((ZD[k] && ZD[k].h) || 2.6) - 0.05, x = c(tx), z = c(tz);
      L.light(x, hh - 0.25, z, col || WARM, (I || 1) * 3.6, (R || 6) * 1.15, p);
      B.quad('sodium', [x - 0.12, hh, z + 0.12], [x + 0.12, hh, z + 0.12], [x + 0.12, hh, z - 0.12], [x - 0.12, hh, z - 0.12], [0, -1, 0], null, 1, 1, p ? 2 : 1); B.box('dark', x, hh + 0.03, z, 0.3, 0.05, 0.3);
      if (!p) lamps.push({ x, z, h: hh, R: (R || 6) * 0.8 });
    };
    // ---- props (world metres) ----
    L.box = function (tex, x, y, z, sx, sy, sz, rot, uvm, col, skip) { B.box(tex, x, y, z, sx, sy, sz, rot || 0, uvm || 'fit', skip); if (col) { if (rot) L.circ(x, z, Math.max(sx, sz) * 0.45); else L.aabb(x, z, sx, sz); if (col === 2) blockW(x, z); } };
    L.sign = function (lines, bg, fg, x, y, z, w, h, rot, px, emis) { const n = 'sign' + (signN++); TEX[n] = HW.makeSign(lines, bg, fg, Math.round(w * 110), Math.round(h * 110), px); M.signs.push(n); B.card(n, x, y, z, w, h, rot, null, emis); return n; };
    L.card = (tex, x, y, z, w, h, rot, uvr, emis) => B.card(tex, x, y, z, w, h, rot, uvr, emis);
    L.decal = (tex, x, z, size, rot, y) => B.decal(tex, x, z, size, rot, y);
    L.crate = function (x, z, n, s, rot) { s = s || 0.7; for (let i = 0; i < (n || 1); i++) B.box('box2', x + (i ? (HW.srnd() - 0.5) * 0.12 : 0), s / 2 + i * s, z, s, s, s, (rot || 0) + i * 0.3); L.aabb(x, z, s, s); blockW(x, z); };
    L.barrel = function (x, z) { B.box('barrel', x, 0.45, z, 0.5, 0.9, 0.5, 0); B.box('barrel', x, 0.45, z, 0.5, 0.9, 0.5, 0.785); L.circ(x, z, 0.3); };
    L.table = function (x, z, sx, sz, tex, h) { h = h || 0.76; tex = tex || 'wood'; B.box(tex, x, h, z, sx, 0.06, sz, 0, 0.8); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(tex, x + a * (sx / 2 - 0.06), h / 2, z + b * (sz / 2 - 0.06), 0.06, h, 0.06); L.aabb(x, z, sx, sz); blockW(x, z); };
    L.chair = function (x, z, rot) { B.box('wood', x, 0.44, z, 0.4, 0.05, 0.4, rot); B.box('wood', x - Math.sin(rot) * 0.18, 0.7, z - Math.cos(rot) * 0.18, 0.4, 0.5, 0.04, rot); B.box('wood', x, 0.22, z, 0.3, 0.42, 0.3, rot); L.circ(x, z, 0.2); };
    L.bench = function (x, z, len, ns) { B.box('wood', x, 0.42, z, ns ? 0.42 : len, 0.07, ns ? len : 0.42, 0, 0.8); B.box('dark', x, 0.2, z, ns ? 0.3 : len * 0.9, 0.4, ns ? len * 0.9 : 0.3); L.aabb(x, z, ns ? 0.42 : len, ns ? len : 0.42); };
    L.shelf = function (x, z, len, ns, tex, h) { h = h || 2.1; B.box(tex || 'shelf', x, h / 2, z, ns ? 0.4 : len, h, ns ? len : 0.4, 0, ns ? [0, 0, len / 1.6, 1] : [0, 0, len / 1.6, 1]); L.aabb(x, z, ns ? 0.4 : len, ns ? len : 0.4); for (let t = -len / 2 + 0.4; t < len / 2; t += T) blockW(ns ? x : x + t, ns ? z + t : z); };
    L.inter = function (id, x, y, z, label, hold, r) { const o = { id, x, y, z, label, hold: hold || 0, r: r || 1.8, on: true }; M.INT.push(o); return o; };
    L.dyn = function (obj) { HW.scene.add(obj); M.dyn.push(obj); return obj; };

    // ---- bake ----
    function losSolid(x0, z0, x1, z1) {
      const dx = x1 - x0, dz = z1 - z0, d = Math.hypot(dx, dz), n = Math.ceil(d / 0.2);
      for (let i = 1; i < n; i++) { const t = i / n; if (!zat(Math.floor((x0 + dx * t) / T), Math.floor((z0 + dz * t) / T))) return false; }
      return true;
    }
    M.losTiles = losSolid;
    function bake(px, py, pz, nx, ny, nz, out) {
      const qx = px + nx * 0.09, qz = pz + nz * 0.09;
      const k = zat(Math.floor(qx / T), Math.floor(qz / T)), amb = k ? ZD[k].amb : (M.voidAmb || [0.02, 0.02, 0.024]);
      let r = amb[0], g = amb[1], b = amb[2], r1 = r, g1 = g, b1 = b;
      for (let i = 0; i < lights.length; i++) {
        const Lt = lights[i], dx = Lt.x - px, dy = Lt.y - py, dz = Lt.z - pz, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > Lt.R * Lt.R) continue;
        if (!losSolid(Lt.x, Lt.z, qx, qz)) continue;
        const d = Math.sqrt(d2) + 1e-4; let a = 1 - d / Lt.R; a *= a;
        const v = a * (0.3 + 0.7 * Math.max(0, (nx * dx + ny * dy + nz * dz) / d));
        r1 += Lt.c[0] * v; g1 += Lt.c[1] * v; b1 += Lt.c[2] * v; if (!Lt.p) { r += Lt.c[0] * v; g += Lt.c[1] * v; b += Lt.c[2] * v; }
      }
      out[0] = r; out[1] = g; out[2] = b; out[3] = r1; out[4] = g1; out[5] = b1;
    }

    L.finish = function (opts) {
      opts = opts || {}; const FH = opts.facadeH || 6.4, defF = FAC.default || { tex: 'facade', h: FH, vm: 6.4 };
      M.voidAmb = opts.voidAmb;
      for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
        const k = zk[idx(x, z)]; if (!k) continue; const Z = ZD[k], fh = Z.fh || 0, fs = Z.fs || 1;
        const x0 = x * T, x1 = x0 + T, z0 = z * T, z1 = z0 + T;
        if (Z.floor) B.quad(Z.floor, [x0, fh, z1], [x1, fh, z1], [x1, fh, z0], [x0, fh, z0], [0, 1, 0], [x / fs, -z / fs - 1 / fs, (x + 1) / fs, -z / fs], 2, 2);
        if (Z.ceil && !Z.out) B.quad(Z.ceil, [x0, Z.h, z0], [x1, Z.h, z0], [x1, Z.h, z1], [x0, Z.h, z1], [0, -1, 0], null, 2, 2);
        const E = [[0, -1, [x0, z0], [x1, z0], [0, 0, 1]], [0, 1, [x1, z1], [x0, z1], [0, 0, -1]], [-1, 0, [x0, z1], [x0, z0], [1, 0, 0]], [1, 0, [x1, z0], [x1, z1], [-1, 0, 0]]];
        for (const [dx, dz, a, b, n] of E) {
          const nx = x + dx, nz = z + dz, nk = zat(nx, nz), NZ = nk ? ZD[nk] : null;
          const wall = (tex, y0, y1, vm) => { if (y1 - y0 < 0.01) return; B.quad(tex, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], n, [0, y0 / vm, 1, y1 / vm], 2, Math.max(1, Math.ceil((y1 - y0) / 1.3))); };
          if (!NZ) {
            if (Z.open) continue;
            if (Z.out) { const F = (inb(nx, nz) && FAC[sol[idx(nx, nz)]]) || defF; wall(F.tex, fh, F.h, F.vm || F.h); }
            else wall(Z.wall, fh, Z.h, Z.wv || T);
          } else {
            const nfh = NZ.fh || 0; if (nfh > fh) wall(NZ.side || NZ.floor, fh, nfh, T);
            const myTop = Z.out ? FH : Z.h, nTop = NZ.out ? FH : NZ.h;
            if (nTop < myTop - 0.01 && !Z.open) { if (Z.out) wall(NZ.ext || defF.tex, NZ.h, defF.h, defF.vm || defF.h); else wall(Z.wall, NZ.h, Z.h, Z.wv || T); }
          }
        }
      }
      M.meshes = B.finalize(bake);
      // per-tile ambient for dynamic objects
      const lg = M.lightGrid = new Float32Array(W * H * 6), o = [0, 0, 0, 0, 0, 0];
      for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) { if (!zk[idx(x, z)]) continue; bake(c(x), 1.1, c(z), 0, 1, 0, o); const i = idx(x, z) * 6; for (let k = 0; k < 6; k++) lg[i + k] = o[k]; }
      // doors
      for (const d of doors) {
        d.ns = !!(zat(d.x, d.z - 1) && zat(d.x, d.z + 1));
        const g = HW.dynGroup(() => { if (d.ns) B.box(d.tex, T / 2, 1.1, 0, T - 0.04, 2.2, 0.07, 0, 'fit'); else B.box(d.tex, 0, 1.1, T / 2, 0.07, 2.2, T - 0.04, 0, 'fit'); });
        g.position.set(d.ns ? d.wx - T / 2 : d.wx, 0, d.ns ? d.wz : d.wz - T / 2); L.dyn(g); d.mesh = g;
        d.int = { id: 'door', x: d.wx, y: 1.1, z: d.wz, r: 1.75, label: 'OPEN', hold: 0, on: true, door: d }; M.INT.push(d.int);
      }
      M.dP = new Int16Array(W * H); M.q = new Int32Array(W * H);
      return M;
    };
    return L;
  };

  HW.unload = function () {
    if (!M) return;
    for (const m of M.meshes) { HW.scene.remove(m); m.geometry.dispose(); }
    for (const o of M.dyn) { HW.scene.remove(o); o.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material && n.material.dispose) n.material.dispose(); }); }
    for (const n of M.signs) { HW.dropMat(n); if (TEX[n]) { TEX[n].dispose(); delete TEX[n]; } }
    M = HW.M = null;
  };

  HW.updDoors = function (dt) {
    for (const d of M.doors) {
      if (d.open !== d.want) { const dl = d.want - d.open, st = 2.4 * dt; d.open = Math.abs(dl) <= st ? d.want : d.open + Math.sign(dl) * st; }
      if (d.kind === 'gate') d.mesh.position.y = d.open * 1.95; else d.mesh.rotation.y = (d.ns ? -1 : 1) * d.open * 1.72;
      const a = HW.ambAt(d.wx, d.wz); HW.setAmb(d.mesh, a[0], a[1], a[2]);
    }
  };

  const _a = [0, 0, 0];
  HW.ambAt = function (wx, wz) {
    const tx = Math.floor(wx / T), tz = Math.floor(wz / T);
    if (!M || !M.inb(tx, tz)) { _a[0] = _a[1] = _a[2] = 0.02; return _a; }
    const i = M.idx(tx, tz) * 6, lg = M.lightGrid, p = HW.U.uPower.value; _a[0] = lg[i] + (lg[i + 3] - lg[i]) * p; _a[1] = lg[i + 1] + (lg[i + 4] - lg[i + 1]) * p; _a[2] = lg[i + 2] + (lg[i + 5] - lg[i + 2]) * p; return _a;
  };
  HW.zoneAt = function (wx, wz) { const k = M.zat(Math.floor(wx / T), Math.floor(wz / T)); return k ? M.ZD[k] : null; };
  HW.walkable = function (tx, tz) {
    const k = M.zat(tx, tz); if (!k || M.ZD[k].noWalk) return false;
    if (k === 'D') { const d = M.doorAt[M.idx(tx, tz)]; if (d && d.open < 0.6) return false; }
    return true;
  };
  HW.aiPass = function (tx, tz) {
    const k = M.zat(tx, tz); if (!k || M.ZD[k].noWalk || M.blocked[M.idx(tx, tz)]) return false;
    if (k === 'D') { const d = M.doorAt[M.idx(tx, tz)]; if (d && d.locked) return false; }
    return true;
  };
  HW.seeThrough = function (tx, tz) {
    const k = M.zat(tx, tz); if (!k) return false;
    if (k === 'D') { const d = M.doorAt[M.idx(tx, tz)]; if (d && d.open < 0.5 && d.kind !== 'gate') return false; }
    return true;
  };
  HW.los = function (x0, z0, x1, z1) {
    const dx = x1 - x0, dz = z1 - z0, d = Math.hypot(dx, dz), n = Math.ceil(d / 0.25);
    for (let i = 1; i < n; i++) { const t = i / n; if (!HW.seeThrough(Math.floor((x0 + dx * t) / T), Math.floor((z0 + dz * t) / T))) return false; }
    return true;
  };
  const _r = [0, 0];
  HW.collide = function (x, z, r) {
    for (let pass = 0; pass < 2; pass++) {
      const tx = Math.floor(x / T), tz = Math.floor(z / T);
      for (let j = tz - 1; j <= tz + 1; j++) for (let i = tx - 1; i <= tx + 1; i++) {
        if (!HW.walkable(i, j)) {
          const cx = Math.max(i * T, Math.min(x, i * T + T)), cz = Math.max(j * T, Math.min(z, j * T + T));
          const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
          if (d2 < r * r) { if (d2 > 1e-8) { const d = Math.sqrt(d2); x = cx + dx / d * r; z = cz + dz / d * r; } else { x = c(tx); z = c(tz); } }
        }
        if (!M.inb(i, j)) continue;
        const cl = M.colTile[M.idx(i, j)]; if (!cl) continue;
        for (let n = 0; n < cl.length; n++) {
          const o = cl[n];
          if (o.r) { const dx = x - o.x, dz = z - o.z, rr = r + o.r, d2 = dx * dx + dz * dz; if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2); x = o.x + dx / d * rr; z = o.z + dz / d * rr; } }
          else {
            const cx = Math.max(o.x0, Math.min(x, o.x1)), cz = Math.max(o.z0, Math.min(z, o.z1)); const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
            if (d2 < r * r) {
              if (d2 > 1e-8) { const d = Math.sqrt(d2); x = cx + dx / d * r; z = cz + dz / d * r; }
              else { const l = x - o.x0, rr2 = o.x1 - x, u = z - o.z0, dn = o.z1 - z, m = Math.min(l, rr2, u, dn); if (m === l) x = o.x0 - r; else if (m === rr2) x = o.x1 + r; else if (m === u) z = o.z0 - r; else z = o.z1 + r; }
            }
          }
        }
      }
    }
    _r[0] = x; _r[1] = z; return _r;
  };

  // ---- pathing ----
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  HW.bfs = function (tx, tz, d) {
    d = d || M.dP; d.fill(-1); if (!M.inb(tx, tz)) return d; const W = M.W, q = M.q; let h = 0, t = 0; const s = tz * W + tx; d[s] = 0; q[t++] = s;
    while (h < t) { const i = q[h++], x = i % W, z = (i / W) | 0; for (const [ax, az] of N4) { const nx = x + ax, nz = z + az; if (!M.inb(nx, nz)) continue; const j = nz * W + nx; if (d[j] < 0 && HW.aiPass(nx, nz)) { d[j] = d[i] + 1; q[t++] = j; } } }
    return d;
  };
  // next tile centre from (wx,wz) down the gradient of d; null if unreachable or already there
  HW.stepToward = function (wx, wz, d) {
    const W = M.W, tx = Math.floor(wx / T), tz = Math.floor(wz / T); if (!M.inb(tx, tz)) return null; const here = d[tz * W + tx]; if (here === 0) return null;
    let best = null, bv = here < 0 ? 1e9 : here;
    for (const [ax, az] of N4) { const nx = tx + ax, nz = tz + az; if (!M.inb(nx, nz)) continue; const v = d[nz * W + nx]; if (v >= 0 && v < bv) { bv = v; best = [c(nx), c(nz)]; } }
    return best;
  };
})();
