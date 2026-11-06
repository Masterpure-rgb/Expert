/* 3-mavzu. Modellaştiriş usullari */
(function () {
  var X = window.X3D, V = X.v, C = LAB.C, f = X.fmt;
  var PI = Math.PI, TR = 1, Tr = 0.4;                       // tor: katta radius R = 1, kiçik radius r = 0.4
  var VOL = 2 * PI * PI * TR * Tr * Tr, AREA = 4 * PI * PI * TR * Tr;

  /* ---------- yordamçi funksiyalar ---------- */
  function polyVolume(m) {
    var s = 0;
    m.f.forEach(function (F) { for (var i = 1; i < F.length - 1; i++) s += V.dot(m.v[F[0]], V.cross(m.v[F[i]], m.v[F[i + 1]])); });
    return Math.abs(s) / 6;
  }
  function inTorus(x, y, z) { var q = Math.hypot(x, y) - TR; return q * q + z * z <= Tr * Tr; }
  // voksellar: faqat oçiq (qöşnisi bö'ş) yoqlar
  function voxels(N) {
    var h = 3 / N, nz = Math.max(1, Math.ceil(N / 3)), x0 = -1.5, z0 = -nz * h / 2, g = [], cnt = 0, i, j, k;
    function idx(a, b, c) { return (c * N + b) * N + a; }
    for (k = 0; k < nz; k++) for (j = 0; j < N; j++) for (i = 0; i < N; i++) { var on = inTorus(x0 + (i + .5) * h, x0 + (j + .5) * h, z0 + (k + .5) * h); g[idx(i, j, k)] = on; if (on) cnt++; }
    function full(a, b, c) { return a >= 0 && b >= 0 && c >= 0 && a < N && b < N && c < nz && g[idx(a, b, c)]; }
    var v = [], F = [];
    function quad(p) { var b = v.length; p.forEach(function (q) { v.push(q); }); F.push([b, b + 1, b + 2, b + 3]); }
    for (k = 0; k < nz; k++) for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      if (!g[idx(i, j, k)]) continue;
      var xa = x0 + i * h, xb = xa + h, ya = x0 + j * h, yb = ya + h, za = z0 + k * h, zb = za + h;
      if (!full(i + 1, j, k)) quad([[xb, ya, za], [xb, yb, za], [xb, yb, zb], [xb, ya, zb]]);
      if (!full(i - 1, j, k)) quad([[xa, ya, zb], [xa, yb, zb], [xa, yb, za], [xa, ya, za]]);
      if (!full(i, j + 1, k)) quad([[xa, yb, za], [xa, yb, zb], [xb, yb, zb], [xb, yb, za]]);
      if (!full(i, j - 1, k)) quad([[xb, ya, za], [xb, ya, zb], [xa, ya, zb], [xa, ya, za]]);
      if (!full(i, j, k + 1)) quad([[xa, ya, zb], [xb, ya, zb], [xb, yb, zb], [xa, yb, zb]]);
      if (!full(i, j, k - 1)) quad([[xa, yb, za], [xb, yb, za], [xb, ya, za], [xa, ya, za]]);
    }
    return { mesh: { v: v, f: F }, n: cnt, h: h, faces: F.length };
  }
  // nuqtalar buluti: tor yuzasidan tekis tanlanma (rad etiş usuli bilan)
  var CLOUD = (function () {
    var seed = 12345, pts = [];
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    while (pts.length < 3000) {
      var u = 2 * PI * rnd(), w = 2 * PI * rnd();
      if (rnd() * (TR + Tr) > TR + Tr * Math.cos(w)) continue;
      pts.push([(TR + Tr * Math.cos(w)) * Math.cos(u), (TR + Tr * Math.cos(w)) * Math.sin(u), Tr * Math.sin(w)]);
    }
    return pts;
  })();
  function Cloud() { this.n = 1000; this.visible = false; }
  Cloud.prototype.collect = function (S, out) {
    var n = this.n, B = S._B, P = [], i, zmin = 1e9, zmax = -1e9;
    for (i = 0; i < n; i++) { var q = S.project(CLOUD[i], B); P.push(q); if (q[2] < zmin) zmin = q[2]; if (q[2] > zmax) zmax = q[2]; }
    P.forEach(function (q) {
      var t = (q[2] - zmin) / (zmax - zmin + 1e-9);
      out.push({ z: q[2], draw: function (c) { c.fillStyle = "rgb(" + Math.round(14 + 150 * t) + "," + Math.round(120 + 70 * t) + "," + Math.round(160 + 70 * t) + ")"; c.beginPath(); c.arc(q[0], q[1], 2.1, 0, 7); c.fill(); } });
    });
  };

  /* ---------- 1-tab ---------- */
  function tab1(L) {
    var S = L.scene({ dist: 4.2, pitch: 0.7, yaw: -0.7, aspect: 0.78, gridOpts: { n: 12, step: 0.5 } });
    var poly = S.add(new X.Mesh({ mesh: X.mesh.torus(16, 8, TR, Tr), wire: false }));
    var cage = X.mesh.torus(8, 5, TR, Tr);
    var sub = S.add(new X.Mesh({ mesh: cage, edge: false })), cageW = S.add(new X.Mesh({ mesh: cage, wire: "only", wireColor: "rgba(232,89,12,.8)", lw: 1.2 }));
    var vox = S.add(new X.Mesh({ mesh: { v: [], f: [] }, edge: "rgba(24,32,60,.35)", lw: 0.5, color: "#B9D8C8" }));
    var cloud = S.add(new Cloud());
    var st = { mode: "poly", M: 16, m: 8, lvl: 2, cage: true, N: 20, np: 1000 }, groups = {};
    var R0 = L.readout([["a", "Elementlar"], ["b", "Aniqlik"]]), info = L.note("", "main");
    var R = { setMany: function (o) { var c = o.c; delete o.c; R0.setMany(o); info.textContent = c || ""; } };
    function cc(m) { var k = X.mesh.counts(m); return "V " + f(k.V, 0) + " · E " + f(k.E, 0) + " · F " + f(k.F, 0); }
    function update() {
      poly.visible = sub.visible = cageW.visible = vox.visible = cloud.visible = false;
      if (st.mode === "poly") {
        var m = X.mesh.torus(st.M, st.m, TR, Tr); poly.o.mesh = m; poly.visible = true;
        var vol = polyVolume(m);
        R.setMany({ a: cc(m), b: "hajm xatosi " + f((VOL - vol) / VOL * 100, 2) + " %", c: "Tekis yoqlar: silliq sirt «siniq» körinadi" });
      } else if (st.mode === "subd") {
        var s = cage; for (var i = 0; i < st.lvl; i++) s = X.mesh.catmullClark(s);
        sub.o.mesh = s; sub.o.edge = st.lvl >= 2 ? false : "rgba(43,58,103,.55)"; sub.visible = true; cageW.visible = st.cage;
        R.setMany({ a: cc(s), b: "F = 40·4^" + st.lvl + " = " + f(40 * Math.pow(4, st.lvl), 0), c: "Cage kiçik, natija silliq; sirt cage içiga sal kiçrayadi" });
      } else if (st.mode === "vox") {
        var r = voxels(st.N); vox.o.mesh = r.mesh; vox.visible = true;
        var ve = r.n * r.h * r.h * r.h;
        R.setMany({ a: f(r.n, 0) + " voksel · " + f(r.faces, 0) + " oçiq yoq", b: "voksel " + f(r.h, 3) + " birlik, hajm xatosi " + f(Math.abs(VOL - ve) / VOL * 100, 1) + " %", c: "Xotira ~ N³: panjara 2 marta ziç bölsa, voksellar 8 marta köp" });
      } else {
        cloud.n = st.np; cloud.visible = true;
        R.setMany({ a: f(st.np, 0) + " nuqta", b: "ziçlik ≈ " + f(st.np / AREA, 1) + " nuqta / birlik²", c: "Nuqtalar yuza töplami: qirra va yoqlar yöq" });
      }
      S.draw();
    }
    L.seg("Tasvir usuli", [["poly", "Polygonal"], ["subd", "Subdivision"], ["vox", "Voksellar"], ["pts", "Nuqtalar buluti"]], "poly", function (v) {
      st.mode = v; Object.keys(groups).forEach(function (k) { groups[k].hidden = k !== v; }); update();
    });
    groups.poly = L.group(function () {
      L.slider({ label: "Halqa böyiça bölaklar (M)", min: 4, max: 48, step: 1, value: st.M, nd: 0 }, function (v) { st.M = v; update(); });
      L.slider({ label: "Quvur kesimi bölaklari (m)", min: 3, max: 16, step: 1, value: st.m, nd: 0 }, function (v) { st.m = v; update(); });
    });
    groups.subd = L.group(function () {
      L.slider({ label: "Subdivision daraja", min: 0, max: 3, step: 1, value: st.lvl, nd: 0 }, function (v) { st.lvl = v; update(); });
      L.toggle("Cage (qöpol tör) ni körsatiş", true, function (v) { st.cage = v; update(); });
    });
    groups.vox = L.group(function () {
      L.slider({ label: "Panjara ölçami N (N × N × N/3)", min: 6, max: 32, step: 1, value: st.N, nd: 0 }, function (v) { st.N = v; update(); });
    });
    groups.pts = L.group(function () {
      L.slider({ label: "Nuqtalar soni", min: 100, max: 3000, step: 100, value: st.np, nd: 0 }, function (v) { st.np = v; update(); });
    });
    ["subd", "vox", "pts"].forEach(function (k) { groups[k].hidden = true; });
    L.note("Bir xil tor (R = 1, r = 0,4): aniq hajmi V = 2π²Rr² ≈ " + f(VOL, 3) + ", yuzi A = 4π²Rr ≈ " + f(AREA, 2) + ". Har bir usul uni boşqaça yaqinlaştiradi: yoqlar, silliq sirt, kataklar yoki nuqtalar.", "main");
    update();
    L.tasks([
      "Polygonal rejimda M va m ni 4 va 3 dan 48 va 16 gaça oşiring: hajm xatosi qanday özgaradi? [kamayadi, ≈ 0 ga yaqinlaşadi]",
      "Subdivision: darajani 0 → 3 qiling va yoqlar sonini yozing. [40 → 160 → 640 → 2560]",
      "Voksellarda N = 12 va N = 24 ni soliştiring: voksel hajmi 8 marta kamayganda oçiq yoqlar taxminan neça marta köpayadi? [≈ 4 marta — yuzaga proporsional]"
    ], "a");
  }

  /* ---------- 2-tab: SDF va silliq birlaşma ---------- */
  function smin(a, b, k) { if (k <= 0) return Math.min(a, b); var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k / 4; }
  function contour(fn, x0, x1, y0, y1, nx, ny) {
    var seg = [], val = [], i, j, dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
    for (j = 0; j <= ny; j++) for (i = 0; i <= nx; i++) val[j * (nx + 1) + i] = fn(x0 + i * dx, y0 + j * dy);
    function lerpP(ax, ay, av, bx, by, bv) { var t = av / (av - bv); return [ax + (bx - ax) * t, ay + (by - ay) * t]; }
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var xa = x0 + i * dx, xb = xa + dx, ya = y0 + j * dy, yb = ya + dy;
      var a = val[j * (nx + 1) + i], b = val[j * (nx + 1) + i + 1], c = val[(j + 1) * (nx + 1) + i + 1], d = val[(j + 1) * (nx + 1) + i];
      var pts = [];                                                  // kesişişlar: pastki, ong, yuqori, çap
      if ((a < 0) !== (b < 0)) pts.push(["B", lerpP(xa, ya, a, xb, ya, b)]);
      if ((b < 0) !== (c < 0)) pts.push(["R", lerpP(xb, ya, b, xb, yb, c)]);
      if ((d < 0) !== (c < 0)) pts.push(["T", lerpP(xa, yb, d, xb, yb, c)]);
      if ((a < 0) !== (d < 0)) pts.push(["L", lerpP(xa, ya, a, xa, yb, d)]);
      if (pts.length === 2) seg.push([pts[0][1], pts[1][1]]);
      else if (pts.length === 4) {
        var mid = (a + b + c + d) / 4;
        var B_ = pts[0][1], R_ = pts[1][1], T_ = pts[2][1], L_ = pts[3][1];
        if ((mid < 0) === (a < 0)) { seg.push([B_, R_], [T_, L_]); } else { seg.push([B_, L_], [R_, T_]); }
      }
    }
    return seg;
  }
  function tab2(L) {
    var st = { r: 1, d: 2.6, k: 0.8 };
    var cv = L.canvas({ aspect: 0.6 });
    var off = document.createElement("canvas"); off.width = 150; off.height = 90; var octx = off.getContext("2d");
    var R = L.readout([["d", "Markazlar masofasi d"], ["dc", "Qöşiliş çegarasi d* = 2r + k/2"], ["fm", "f (örta nuqtada)"], ["s", "Holat"]]);
    var WX = 3.4;
    cv.draw = function (c, w, h) {
      var sc = w / (2 * WX), WY = h / sc / 2, a1 = -st.d / 2, a2 = st.d / 2;
      function F(x, y) { return smin(Math.hypot(x - a1, y) - st.r, Math.hypot(x - a2, y) - st.r, st.k); }
      var img = octx.createImageData(150, 90), D = img.data, ix, iy;
      for (iy = 0; iy < 90; iy++) for (ix = 0; ix < 150; ix++) {
        var x = -WX + (ix + .5) / 150 * 2 * WX, y = WY - (iy + .5) / 90 * 2 * WY, v = F(x, y), p = (iy * 150 + ix) * 4, r, g, b;
        if (v < 0) { var t = Math.min(1, -v / st.r); r = 190 - 120 * t; g = 205 - 100 * t; b = 250 - 40 * t; }
        else { var band = (Math.floor(v / 0.25) % 2 === 0) ? 1 : 0.93, t2 = Math.min(1, v / 3); r = (255 - 25 * t2) * band; g = (240 - 40 * t2) * band; b = (225 - 20 * t2) * band; }
        D[p] = r; D[p + 1] = g; D[p + 2] = b; D[p + 3] = 255;
      }
      octx.putImageData(img, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, w, h);
      function toS(p) { return [w / 2 + p[0] * sc, h / 2 - p[1] * sc]; }
      function drawSeg(segs, col, lw, dash) {
        c.beginPath(); segs.forEach(function (s) { var p = toS(s[0]), q = toS(s[1]); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); });
        c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]);
      }
      var hard = function (x, y) { return Math.min(Math.hypot(x - a1, y) - st.r, Math.hypot(x - a2, y) - st.r); };
      drawSeg(contour(hard, -WX, WX, -WY, WY, 90, 54), "rgba(24,32,47,.55)", 1.5, [5, 4]);
      drawSeg(contour(F, -WX, WX, -WY, WY, 150, 90), C.x, 3.2);
      [a1, a2].forEach(function (a) { var p = toS([a, 0]); c.beginPath(); c.arc(p[0], p[1], 3.5, 0, 7); c.fillStyle = C.ink; c.fill(); });
      var mid = F(0, 0);
      c.font = "600 12px Inter, system-ui, sans-serif"; c.fillStyle = C.ink2; c.fillText("qizil: f = 0 (silliq birlaşma)   ·   uzuq çiziq: min(f₁, f₂) = 0", 8, h - 8);
      var dstar = 2 * st.r + st.k / 2;
      R.setMany({ d: f(st.d, 2), dc: f(dstar, 2), fm: f(mid, 3), s: mid < 0 ? "bir butun (qöşilgan)" : "ikki ajralgan şar" });
    };
    L.slider({ label: "Markazlar masofasi d", min: 0, max: 5, step: 0.05, value: st.d, nd: 2 }, function (v) { st.d = v; cv.redraw(); });
    L.slider({ label: "Silliqlik k (smooth union)", min: 0, max: 2, step: 0.05, value: st.k, nd: 2 }, function (v) { st.k = v; cv.redraw(); });
    L.slider({ label: "Radius r (ikkalasi uçun)", min: 0.4, max: 1.4, step: 0.05, value: st.r, nd: 2 }, function (v) { st.r = v; cv.redraw(); });
    L.note("Har bir şar — masofa funksiyasi (SDF): f<sub>i</sub>(p) = |p − c<sub>i</sub>| − r. Qattiq birlaşma: min(f<sub>1</sub>, f<sub>2</sub>). Silliq birlaşma (polinomial smin): h = max(k − |a − b|, 0)/k, smin(a, b) = min(a, b) − h²·k/4. Sirt — f = 0 izoçizigi (marching squares).", "main");
    L.tasks([
      "k = 0 qilib d ni 2 dan kattalaştiring va kamaytiring: şarlar aynan qaçon tegadi? [d = 2r = 2]",
      "k = 0,8 va r = 1: ikki şar qaçondan boşlab qöşila boşlaydi? [d* = 2r + k/2 = 2,4]. «f (örta nuqtada)» ning işorasi qanday özgaradi?",
      "d = 2,6 da k ni 0 dan 2 gaça oşiring: ajralgan şarlar qöşilib, «böyin» hosil bölişini kuzating."
    ], "b");
  }

  LAB.start({
    intro: "Bitta obyektni turliça ifodalaş mumkin: yoqlar töri, silliq subdivision sirt, kataklar (voksellar) yoki nuqtalar buluti. Maʼlumot ifodasi tanlovi aniqlik, xotira va tahrirlaş qulayligini belgilaydi.",
    tabs: [
      { name: "Bir obyekt — turli tasvir", lead: "Bir xil torning 4 ifodasini almaştirib körib çiqing: har birining sonlari «Elementlar» qatorida.", build: tab1 },
      { name: "SDF va metaball", lead: "Ikki şar masofa funksiyasi (SDF) bilan beriladi. Masofa d ni özgartirib, ularning silliq birlaşuvini kuzating.", build: tab2 }
    ]
  });
})();
