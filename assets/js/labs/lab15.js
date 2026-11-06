/* 15-mavzu. UV yoyiş */
(function () {
  var X = window.X3D, V = X.v, M = X.m, C = LAB.C, f = X.fmt, PI = Math.PI;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- 1-tajriba: yoyiş geometriyasi ---------- */
  var FC = ["#C9D4F5", "#BFE3D0", "#F5C6C7", "#FBE3C8", "#E3D2F2", "#F7EBB5"];
  // kub tarmoği (xoç): tekis holatdagi (u, v) kvadratlari
  var CUBE = [
    { id: 0, name: "Pastki", sq: [0, 0] }, { id: 1, name: "Old", sq: [0, -1] }, { id: 2, name: "Ong", sq: [1, 0] },
    { id: 3, name: "Orqa", sq: [0, 1] }, { id: 4, name: "Çap", sq: [-1, 0] }, { id: 5, name: "Yuqori", sq: [0, 2] }
  ];
  CUBE[0].name = "Pastki"; CUBE[2].name = "Öng";
  // yoyilgan holatdagi tekis nuqtalar (z = 0) va ularning 3D holatga ötkazuvçi matritsasi (a = burçak)
  function cubeMat(id, a) {
    var T = M.T, Rx = M.Rx, Ry = M.Ry, mul = M.mul;
    if (id === 0) return M.I();
    if (id === 1) return mul(T(0, 0, 0), Rx(-a));
    if (id === 2) return mul(T(1, 0, 0), mul(Ry(-a), T(-1, 0, 0)));
    if (id === 3) return mul(T(0, 1, 0), mul(Rx(a), T(0, -1, 0)));
    if (id === 4) return Ry(a);
    var back = mul(T(0, 1, 0), mul(Rx(a), T(0, -1, 0)));
    return mul(back, mul(T(0, 2, 0), mul(Rx(a), T(0, -2, 0))));
  }
  function cubeGeom(t) {
    var a = (1 - t) * PI / 2, v = [], fcs = [], segs = [], labels = [], k;
    CUBE.forEach(function (F, i) {
      var Mx = cubeMat(F.id, a), x0 = F.sq[0], y0 = F.sq[1];
      var loc = [[x0, y0, 0], [x0 + 1, y0, 0], [x0 + 1, y0 + 1, 0], [x0, y0 + 1, 0]], P = loc.map(function (p) { return M.apply(Mx, p); });
      var base = v.length; P.forEach(function (p) { v.push(p); }); fcs.push([base, base + 1, base + 2, base + 3]);
      labels.push(M.apply(Mx, [x0 + 0.5, y0 + 0.5, 0]));
      // qirralar: 0:pastki(v=y0), 1:ong, 2:yuqori, 3:çap — «hinge» (qatlam) bölsa kulrang, aks holda choke (seam)
      var hinge = [false, false, false, false];
      if (F.id === 0) hinge = [true, true, true, true];
      if (F.id === 1) hinge[2] = true;           // pastki bilan: yuqori qirra v = 0
      if (F.id === 2) hinge[3] = true;           // pastki bilan: çap qirra u = 1
      if (F.id === 3) { hinge[0] = true; hinge[2] = true; }  // pastki bilan va yuqori bilan
      if (F.id === 4) hinge[1] = true;
      if (F.id === 5) hinge[0] = true;
      for (k = 0; k < 4; k++) segs.push({ a: P[k], b: P[(k + 1) % 4], seam: !hinge[k] });
    });
    return { mesh: { v: v, f: fcs }, segs: segs, labels: labels, flatCount: 14 };
  }
  var NC = 36;
  function cylGeom(t) {
    var R = 1, H = 2, nu = 48, v = [], fcs = [], fcol = [], segs = [], i, j;
    var kap = (1 - t) / R, beta = (1 - t) * PI / 2;
    function strip(s, z) {
      if (kap < 1e-4) return [s, 0, z];
      var th = s * kap, rho = 1 / kap; return [rho * Math.sin(th), rho * (1 - Math.cos(th)), z];
    }
    for (i = 0; i <= nu; i++) { var s = -PI * R + 2 * PI * R * i / nu; v.push(strip(s, 0)); v.push(strip(s, H)); }
    for (i = 0; i < nu; i++) { fcs.push([2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1]); fcol.push(i % 2 ? "#C9D4F5" : "#DCE4FA"); }
    function cap(top) {
      var psi = top ? -beta : beta, Mx = M.mul(M.T(0, 0, top ? H : 0), M.mul(M.Rx(psi), M.T(0, 0, top ? -H : 0))), cz = top ? H + R : -R, base = v.length, ring = [];
      v.push(M.apply(Mx, [0, 0, cz]));
      for (j = 0; j < NC; j++) { var ph = 2 * PI * j / NC; v.push(M.apply(Mx, [R * Math.cos(ph), 0, cz + R * Math.sin(ph)])); ring.push(v[v.length - 1]); }
      for (j = 0; j < NC; j++) { fcs.push([base, base + 1 + j, base + 1 + (j + 1) % NC]); fcol.push(top ? "#F7EBB5" : "#E3D2F2"); }
      for (j = 0; j < NC; j++) segs.push({ a: ring[j], b: ring[(j + 1) % NC], seam: true });
    }
    cap(true); cap(false);
    var e = function (i0, z) { return strip(-PI * R + 2 * PI * R * i0 / nu, z); };
    segs.push({ a: e(0, 0), b: e(0, H), seam: true }); segs.push({ a: e(nu, 0), b: e(nu, H), seam: true });
    for (i = 0; i < nu; i++) { if (i === nu / 2 - 1 || i === nu / 2) continue; segs.push({ a: e(i, 0), b: e(i + 1, 0), seam: true }); segs.push({ a: e(i, H), b: e(i + 1, H), seam: true }); }
    return { mesh: { v: v, f: fcs }, fcol: fcol, segs: segs, labels: [] };
  }
  // UV maydoni: jazirallar (köpburçaklar) birlik kvadratga siğdirilgan
  function uvIslands(shape) {
    var isl = [];
    if (shape === "cube") {
      CUBE.forEach(function (F, i) { isl.push({ pts: [[F.sq[0], F.sq[1]], [F.sq[0] + 1, F.sq[1]], [F.sq[0] + 1, F.sq[1] + 1], [F.sq[0], F.sq[1] + 1]], col: FC[i], lab: String(i + 1), area: 1 }); });
    } else {
      var w = 2 * PI, H = 2;
      isl.push({ pts: [[-PI, 0], [PI, 0], [PI, H], [-PI, H]], col: "#C9D4F5", lab: "Yon", area: w * H });
      [[H + 1, "#F7EBB5", "Yuqori"], [-1, "#E3D2F2", "Pastki"]].forEach(function (c) {
        var p = []; for (var j = 0; j < 48; j++) p.push([Math.cos(2 * PI * j / 48), c[0] + Math.sin(2 * PI * j / 48)]);
        isl.push({ pts: p, col: c[1], lab: c[2], area: PI });
      });
    }
    var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    isl.forEach(function (I) { I.pts.forEach(function (p) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }); });
    var sc = 1 / Math.max(maxx - minx, maxy - miny), tot = 0;
    isl.forEach(function (I) { I.uv = I.pts.map(function (p) { return [(p[0] - minx) * sc, (p[1] - miny) * sc]; }); tot += I.area * sc * sc; });
    return { isl: isl, cover: tot, sc: sc };
  }

  // chok va qirralar uçun maxsus element
  function Seams() { this.visible = true; this.segs = []; this.t = 0; this.showSeams = true; this.onlyFront = null; }
  Seams.prototype.collect = function (S, out) {
    var self = this, B = S._B;
    this.segs.forEach(function (sg) {
      if (sg.seam && !self.showSeams) return;
      var a = S.project(sg.a, B), b = S.project(sg.b, B);
      out.push({ z: (a[2] + b[2]) / 2 - 0.9, draw: function (c) {
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
        c.strokeStyle = sg.seam ? C.x : "rgba(24,32,47,.45)"; c.lineWidth = sg.seam ? 2.6 : 1.2; c.stroke();
      } });
    });
  };

  /* ---------- 2-tajriba: proyeksiyalar ---------- */
  function surface(kind) {
    var v = [], fcs = [], i, j, k, q;
    if (kind === "sphere") { var m = X.mesh.uvSphere(48, 24, 1); v = m.v; fcs = m.f; }
    else if (kind === "cylinder") {
      var nu = 48, nv = 16, nc = 48;
      for (j = 0; j <= nv; j++) for (i = 0; i < nu; i++) { var ph = 2 * PI * i / nu; v.push([Math.cos(ph), Math.sin(ph), -1 + 2 * j / nv]); }
      for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) fcs.push([j * nu + i, j * nu + (i + 1) % nu, (j + 1) * nu + (i + 1) % nu, (j + 1) * nu + i]);
      [-1, 1].forEach(function (zc) {
        var b0 = v.length; v.push([0, 0, zc]);
        for (k = 1; k <= 4; k++) for (i = 0; i < nc; i++) { var p2 = 2 * PI * i / nc; v.push([k / 4 * Math.cos(p2), k / 4 * Math.sin(p2), zc]); }
        for (i = 0; i < nc; i++) fcs.push([b0, b0 + 1 + i, b0 + 1 + (i + 1) % nc]);
        for (k = 1; k < 4; k++) for (i = 0; i < nc; i++) fcs.push([b0 + 1 + (k - 1) * nc + i, b0 + 1 + (k - 1) * nc + (i + 1) % nc, b0 + 1 + k * nc + (i + 1) % nc, b0 + 1 + k * nc + i]);
      });
    } else {
      var n = 16, ax;
      for (ax = 0; ax < 3; ax++) [-1, 1].forEach(function (sg) {
        var b0 = v.length;
        for (j = 0; j <= n; j++) for (i = 0; i <= n; i++) {
          var a = -1 + 2 * i / n, b = -1 + 2 * j / n, p = ax === 0 ? [sg, a, b] : ax === 1 ? [a, sg, b] : [a, b, sg];
          v.push(p);
        }
        for (j = 0; j < n; j++) for (i = 0; i < n; i++) fcs.push([b0 + j * (n + 1) + i, b0 + j * (n + 1) + i + 1, b0 + (j + 1) * (n + 1) + i + 1, b0 + (j + 1) * (n + 1) + i]);
      });
    }
    var cen = [], nor = [], area = [];
    fcs.forEach(function (F) {
      var pts = F.map(function (k2) { return v[k2]; }), c = [0, 0, 0];
      pts.forEach(function (p) { c = V.add(c, p); }); c = V.mul(c, 1 / pts.length);
      var nn = X.mesh.normal(pts); if (V.dot(nn, c) < 0) nn = V.mul(nn, -1);
      var ar = 0; for (q = 1; q < pts.length - 1; q++) ar += V.len(V.cross(V.sub(pts[q], pts[0]), V.sub(pts[q + 1], pts[0]))) / 2;
      cen.push(c); nor.push(nn); area.push(ar);
    });
    // yuzalar yönalişini tashqariga qaratamiz
    fcs = fcs.map(function (F, idx) {
      var pts = F.map(function (k2) { return v[k2]; }), nn = X.mesh.normal(pts);
      return V.dot(nn, cen[idx]) < 0 ? F.slice().reverse() : F;
    });
    return { mesh: { v: v, f: fcs }, cen: cen, nor: nor, area: area };
  }
  var PROJ = {
    planar: function (p) { return [(p[0] + 1) / 2, (p[2] + 1) / 2]; },
    cylindrical: function (p) { return [Math.atan2(p[1], p[0]) / (2 * PI) + 0.5, (p[2] + 1) / 2]; },
    spherical: function (p) { var r = V.len(p) || 1; return [Math.atan2(p[1], p[0]) / (2 * PI) + 0.5, Math.asin(clamp(p[2] / r, -1, 1)) / PI + 0.5]; },
    box: function (p, n) {
      var ax = Math.abs(n[0]) >= Math.abs(n[1]) && Math.abs(n[0]) >= Math.abs(n[2]) ? 0 : (Math.abs(n[1]) >= Math.abs(n[2]) ? 1 : 2);
      return ax === 0 ? [(p[1] + 1) / 2, (p[2] + 1) / 2] : ax === 1 ? [(p[0] + 1) / 2, (p[2] + 1) / 2] : [(p[0] + 1) / 2, (p[1] + 1) / 2];
    }
  };
  function wrapd(d, wrap) { return wrap ? d - Math.round(d) : d; }
  function distortion(S, proj) {
    var fn = PROJ[proj], wrap = proj === "cylindrical" || proj === "spherical", sumA = 0, sumW = 0, bad = 0, eps = 1e-3;
    S.mesh.f.forEach(function (F, i) {
      var c = S.cen[i], n = S.nor[i], A = S.area[i];
      var e0 = V.sub(S.mesh.v[F[1]], S.mesh.v[F[0]]), t1 = V.norm(V.sub(e0, V.mul(n, V.dot(e0, n)))), t2 = V.cross(n, t1);
      if (V.len(t1) < 1e-9) return;
      var c0 = fn(c, n), c1 = fn(V.add(c, V.mul(t1, eps)), n), c2 = fn(V.add(c, V.mul(t2, eps)), n);
      var a = wrapd(c1[0] - c0[0], wrap) / eps, cc = (c1[1] - c0[1]) / eps, b = wrapd(c2[0] - c0[0], wrap) / eps, d = (c2[1] - c0[1]) / eps;
      var SS = a * a + b * b + cc * cc + d * d, D = Math.abs(a * d - b * cc), disc = Math.sqrt(Math.max(0, SS * SS - 4 * D * D));
      var smax = Math.sqrt((SS + disc) / 2), smin = Math.sqrt(Math.max(0, (SS - disc) / 2)), an = smin < 1e-9 ? 50 : smax / smin;
      an = Math.min(an, 50);
      sumA += an * A; sumW += A; if (an > 2) bad += A;
    });
    return { mean: sumA / sumW, bad: bad / sumW };
  }

  /* ---------- 3-tajriba ---------- */
  function nextPow2(x) { var p = 1; while (p < x) p *= 2; return p; }

  LAB.start({
    intro: "3D obyektga tekstura qöyiş uçun uning sirti tekislikka «yoyiladi»: har bir çöqqiga (u, v) koordinatalari beriladi. Yoyiş qanchalik adolatli bölsa, tekstura shunçalik tekis yotadi.",
    tabs: [
      {
        name: "Yoyiş animatsiyasi",
        lead: "Slayderni 0 dan 1 gaça suring: obyekt qirralari böylab kesilib tekislikka yoyiladi. Qizil çiziqlar — choklar (seam), kulrang çiziqlar — yoyilmaydigan (qatlanadigan) qirralar.",
        build: function (L) {
          var st = { shape: "cube", t: 0, seams: true, labs: true, anim: 0 };
          var S = L.scene({ dist: 6, yaw: -0.9, pitch: 0.7, target: [0.5, 0.7, 0.3], gridOpts: { n: 12, step: 1 }, axesOpts: { len: 1.2 }, aspect: 0.9 });
          var mesh = S.add(new X.Mesh({ mesh: { v: [], f: [] }, twoSided: true, edge: "rgba(24,32,47,.25)" }));
          var sm = S.add(new Seams());
          var pts = S.add(new X.Points({ pts: [], color: C.ink, r: 3, labels: [] }));
          var uv = L.canvas({ aspect: 1, maxH: 360 });
          var R = L.readout([["t", "Yoyiş darajasi t"], ["a", "Yuza (3D)"], ["c", "UV kvadratidan foydalaniş"], ["s", "Choklar"]], "main");
          var isl = { cube: uvIslands("cube"), cylinder: uvIslands("cylinder") };
          uv.draw = function (c, w, h) {
            var pad = 14, sz = Math.min(w, h) - 2 * pad, ox = (w - sz) / 2, oy = (h - sz) / 2;
            c.fillStyle = "#F6F8FC"; c.fillRect(ox, oy, sz, sz);
            c.strokeStyle = "rgba(24,32,47,.10)"; c.lineWidth = 1;
            for (var g = 1; g < 4; g++) { c.beginPath(); c.moveTo(ox + sz * g / 4, oy); c.lineTo(ox + sz * g / 4, oy + sz); c.moveTo(ox, oy + sz * g / 4); c.lineTo(ox + sz, oy + sz * g / 4); c.stroke(); }
            c.strokeStyle = C.ink2; c.lineWidth = 1.5; c.strokeRect(ox, oy, sz, sz);
            c.font = "600 11px Inter, system-ui, sans-serif"; c.fillStyle = C.ink3; c.fillText("u →", ox + sz - 22, oy + sz + 11); c.fillText("v ↑", ox - 10, oy + 10);
            isl[st.shape].isl.forEach(function (I) {
              c.beginPath(); I.uv.forEach(function (p, i) { var x = ox + p[0] * sz, y = oy + sz - p[1] * sz; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath();
              c.fillStyle = I.col; c.fill(); c.strokeStyle = st.seams ? C.x : C.ink2; c.lineWidth = 2; c.stroke();
              var cx = 0, cy = 0; I.uv.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= I.uv.length; cy /= I.uv.length;
              if (st.labs) { c.fillStyle = C.ink; c.textAlign = "center"; c.fillText(I.lab, ox + cx * sz, oy + sz - cy * sz + 4); c.textAlign = "start"; }
            });
          };
          function upd() {
            var G = st.shape === "cube" ? cubeGeom(st.t) : cylGeom(st.t);
            mesh.o.mesh = G.mesh; mesh.o.faceColors = st.shape === "cube" ? FC : G.fcol;
            sm.segs = G.segs; sm.showSeams = st.seams;
            pts.o.pts = st.labs ? G.labels : []; pts.o.labels = st.labs ? G.labels.map(function (p, i) { return String(i + 1); }) : [];
            S.draw(); uv.redraw();
            R.setMany({
              t: f(st.t, 2), a: st.shape === "cube" ? f(6, 2) + " (1×1×1 kub)" : f(2 * PI * 2 + 2 * PI, 2) + " (R = 1, h = 2)",
              c: f(isl[st.shape].cover * 100, 1) + " %", s: st.shape === "cube" ? "7 qirra (tekis holatda 14 nusxa)" : "1 vertikal + 2 aylana"
            });
          }
          var sl;
          L.seg("Obyekt", [["cube", "Kub"], ["cylinder", "Silindr"]], "cube", function (v) { st.shape = v; upd(); });
          sl = L.slider({ label: "Yoyiş darajasi (0 — yiğilgan, 1 — tekis)", min: 0, max: 1, step: 0.01, value: 0, nd: 2 }, function (v) { st.t = v; upd(); });
          L.toggle("Choklarni körsatiş (qizil)", true, function (v) { st.seams = v; upd(); });
          L.toggle("Yoqlar raqamlari", true, function (v) { st.labs = v; upd(); });
          var timer = null, dir = 1;
          var btn = L.button("▶ Avtomatik yoyiş", function () {
            if (timer) { cancelAnimationFrame(timer); timer = null; btn.textContent = "▶ Avtomatik yoyiş"; return; }
            btn.textContent = "❚❚ Töxtatiş";
            var last = performance.now();
            (function step(now) {
              var dt = Math.min(0.05, (now - last) / 1000); last = now;
              st.t += dir * dt * 0.35; if (st.t >= 1) { st.t = 1; dir = -1; } if (st.t <= 0) { st.t = 0; dir = 1; }
              sl.set(st.t, true); upd(); timer = requestAnimationFrame(step);
            })(last);
          }, "primary");
          L.note("Kubning 12 qirrasidan 5 tasi qatlam (kulrang), 7 tasi chok (qizil): tekis tarmoqda chok qirralari ikki nusxada körinadi (6·4 − 2·5 = 14). Silindr yon sirti 2πR × h törtburçakka yoyiladi; yuqori va pastki doiralar bir nuqtada tutashadi.", "main");
          upd();
          L.tasks([
            "Kub: t = 0,5 da obyekt qanday körinadi? t = 1 da qaysi yoqlar bir-biriga qöşni qoladi (qatlam qirralari kulrang)?",
            "UV kvadratida «foydalaniş» foizini qaraş: kub uçun 37,5 % (6 ta kvadrat 4×4 katakda) bölishini tekşiring.",
            "Silindrga ötib t = 0,3 qiling: yon sirt qanday «oçiladi»? Qizil vertikal chok qayerda?"
          ], "a");
        }
      },
      {
        name: "Checker va çöziliş",
        lead: "Sirt kiçik yoqlardan iborat, har bir yoq rangi checker(u, v) bilan beriladi. Proyeksiyani almaştiring: kataklar qayerda çözilib ketishini körasiz.",
        build: function (L) {
          var st = { shape: "sphere", proj: "spherical", n: 8, tex: "checker" }, cache = {};
          var S = L.scene({ dist: 3.6, yaw: -0.9, pitch: 0.4, axes: false, grid: false, aspect: 0.85 });
          var mesh = S.add(new X.Mesh({ mesh: { v: [], f: [] }, edge: false }));
          var R = L.readout([["f", "Yoqlar soni"], ["m", "Örtaça çöziliş σ₁/σ₂"], ["b", "Kuçli çözilgan yuza (σ₁/σ₂ > 2)"], ["p", "Proyeksiya"]], "main");
          function surf() { return cache[st.shape] || (cache[st.shape] = surface(st.shape)); }
          var PN = { planar: "Planar (oldindan)", cylindrical: "Cylindrical", spherical: "Spherical", box: "Box" };
          function upd() {
            var Sf = surf(), fn = PROJ[st.proj], cols = [], n = st.n;
            Sf.mesh.f.forEach(function (F, i) {
              var uvp = fn(Sf.cen[i], Sf.nor[i]), u = uvp[0], v = uvp[1];
              if (st.tex === "checker") {
                var iu = Math.floor(u * n), iv = Math.floor(v * n); cols.push(((iu + iv) % 2 + 2) % 2 ? "#2F4B9B" : "#F4F5F7");
              } else {
                var cu = clamp(u, 0, 1), cv = clamp(v, 0, 1); cols.push("rgb(" + Math.round(40 + 215 * cu) + "," + Math.round(40 + 215 * cv) + ",90)");
              }
            });
            mesh.o.mesh = Sf.mesh; mesh.o.faceColors = cols;
            var D = distortion(Sf, st.proj);
            R.setMany({ f: f(Sf.mesh.f.length, 0), m: f(D.mean, 2), b: f(D.bad * 100, 0) + " %", p: PN[st.proj] });
            S.draw();
          }
          L.seg("Obyekt", [["sphere", "Sfera"], ["cylinder", "Silindr"], ["cube", "Kub"]], "sphere", function (v) { st.shape = v; upd(); });
          L.seg("Proyeksiya", [["planar", "Planar"], ["cylindrical", "Cylindrical"], ["spherical", "Spherical"], ["box", "Box"]], "spherical", function (v) { st.proj = v; upd(); });
          L.seg("Tekstura", [["checker", "Checker"], ["uv", "UV ranglari (u → qizil, v → yaşil)"]], "checker", function (v) { st.tex = v; upd(); });
          L.slider({ label: "Kataklar soni (har öqda)", min: 2, max: 16, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; upd(); });
          L.note("Planar — bir yönalişda (Y öqi böylab) tekis proyeksiya; Cylindrical — u = burçak / 2π, v = balandlik; Spherical — u = uzunlama, v = kenglama; Box — har bir yoq öz öqi böylab proyeksiyalanadi. Çöziliş ölçovi: yoq markazida (u, v) akslantirişning Jakobian singulyar sonlari nisbati σ₁/σ₂ (1 — kvadrat kvadratligiça qoladi), yuza böyiça örtalangan. Rang yoqning markazidagi qiymatdan olinadi.", "main");
          upd();
          L.tasks([
            "Sfera + Planar: sfera çetlariga qarang — kataklar nima uçun çiziqqa aylanadi? «Kuçli çözilgan yuza» foizini yozib oling.",
            "Sfera + Spherical: qutblar (yuqori va pastki nuqta) yaqinida kataklar qanday özgaradi? Silindr + Cylindrical bilan solişitiring.",
            "Kub + Box va Kub + Planar proyeksiyalarini soliştiring: qaysi birida yon yoqlar çözilgan?"
          ], "b");
        }
      },
      {
        name: "Tekstura zişligi",
        lead: "Texel density (TD) — obyektning 1 metriga qançalik piksel tüşishi. Barça obyektlarda TD bir xil bölsa, tekstura sifati sahnada bir xil körinadi.",
        build: function (L) {
          var st = { res: 2048, frac: 0.5, size: 2, td: 512, sizeB: 0.5 };
          var cv = L.canvas({ aspect: 0.8, maxH: 330 });
          var R = L.readout([["td", "Texel density (TD)"], ["cm", "TD santimetrda"], ["px", "Bir piksel ölçami"], ["need", "Maqsad TD uçun tekstura"], ["fb", "2-obyekt uçun UV ulüşi"]], "main");
          cv.draw = function (c, w, h) {
            var sz = Math.min(w, h) - 30, ox = (w - sz) / 2, oy = (h - sz) / 2;
            c.fillStyle = "#F6F8FC"; c.fillRect(ox, oy, sz, sz); c.strokeStyle = C.ink2; c.lineWidth = 1.5; c.strokeRect(ox, oy, sz, sz);
            var isz = sz * st.frac, ix = ox + (sz - isz) / 2, iy = oy + (sz - isz) / 2;
            c.fillStyle = "rgba(62,99,221,.18)"; c.fillRect(ix, iy, isz, isz);
            var cells = 8; c.strokeStyle = "rgba(62,99,221,.45)"; c.lineWidth = 1;
            for (var i = 1; i < cells; i++) { c.beginPath(); c.moveTo(ix + isz * i / cells, iy); c.lineTo(ix + isz * i / cells, iy + isz); c.moveTo(ix, iy + isz * i / cells); c.lineTo(ix + isz, iy + isz * i / cells); c.stroke(); }
            c.strokeStyle = C.z; c.lineWidth = 2.5; c.strokeRect(ix, iy, isz, isz);
            c.font = "600 12px Inter, system-ui, sans-serif"; c.fillStyle = C.ink; c.textAlign = "center";
            c.fillText(f(st.res, 0) + " px", ox + sz / 2, oy - 6);
            c.fillText("UV oroli: " + f(st.frac * st.res, 0) + " px", ix + isz / 2, iy + isz / 2 + 4);
            c.fillStyle = C.ink2; c.fillText("Obyekt ölçami " + f(st.size, 2) + " m ↔ " + f(st.frac * st.res, 0) + " px", ox + sz / 2, oy + sz + 16); c.textAlign = "start";
          };
          function upd() {
            var td = st.res * st.frac / st.size, need = nextPow2(st.td * st.size / st.frac), fb = st.td * st.sizeB / st.res;
            R.setMany({
              td: isFinite(td) ? f(td, 0) + " px/m" : "—", cm: isFinite(td) ? f(td / 100, 2) + " px/sm" : "—", px: isFinite(td) && td > 0 ? f(1000 / td, 2) + " mm" : "—",
              need: isFinite(need) ? f(need, 0) + " px" : "—", fb: isFinite(fb) ? (fb > 1 ? "siğmaydi (" + f(fb * 100, 0) + " %)" : f(fb * 100, 1) + " %") : "—"
            });
            cv.redraw();
          }
          L.seg("Tekstura ruxsati", [[512, "512"], [1024, "1024"], [2048, "2048"], [4096, "4096"]], 2048, function (v) { st.res = Number(v); upd(); });
          L.slider({ label: "UV oroli ulüşi (tekstura tomonining qismi)", min: 0.05, max: 1, step: 0.01, value: st.frac, nd: 2 }, function (v) { st.frac = v; upd(); });
          L.number({ label: "Obyekt ölçami", unit: "m", min: 0.01, step: 0.1, value: st.size }, function (v) { st.size = v; upd(); });
          L.seg("Maqsad TD (shartli misollar)", [[256, "256"], [512, "512"], [1024, "1024"], [2048, "2048"]], 512, function (v) { st.td = Number(v); upd(); });
          L.number({ label: "2-obyekt ölçami", unit: "m", min: 0.01, step: 0.1, value: st.sizeB }, function (v) { st.sizeB = v; upd(); });
          L.note("TD = (tekstura ruxsati, px × UV oroli ulüşi) / obyekt ölçami, m → px/m. Misol: 2048 px, ulüş 0,5, ölçam 2 m → 2048·0,5/2 = 512 px/m (≈ 5,1 px/sm). Maqsad TD (256…2048 px/m) — faqat misol; haqiqiy qiymat loyiha talabi va platformaga boğliq. «Maqsad TD uçun tekstura» — 2 ning darajasigaça yuqoriga yaxlitlanadi.", "main");
          upd();
          L.tasks([
            "2048 px, ulüş 0,5, ölçam 2 m: TD = 512 px/m bölishini tekşiring. Ruxsatni 1024 ga tüşiring — TD qancha bölishi kerak? (256 px/m.)",
            "Maqsad TD = 512 px/m va 2-obyekt ölçami 0,5 m bölsa, u tekstura tomonining qançasini egallashi kerak? (2048 px da 12,5 %.)",
            "Ulüşni 1 ga çiqaring va ölçamni 4 m qiling: TD qanday özgardi, bir piksel qançalik (mm) bölib qoldi?"
          ], "c");
        }
      }
    ]
  });
})();
