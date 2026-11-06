/* 11-mavzu. Sirtlar laboratoriyasi */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, EX = window.EX, V = X.v;
  var PI = Math.PI;

  /* ---------- izoparametrik çiziqlar (sirtga yopişgan, kiçik chuqurlik siljişi bilan) ---------- */
  function Iso(fn, n) { this.fn = fn; this.n = n; this.visible = true; }
  Iso.prototype.collect = function (S, out) {
    var fn = this.fn, n = this.n, M = 40;
    function line(g, col) {
      var P = [], k; for (k = 0; k <= M; k++) P.push(S.project(g(k / M), S._B));
      for (k = 0; k < M; k++) (function (a, b) {
        out.push({ z: (a[2] + b[2]) / 2 - 0.1, draw: function (c) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = col; c.lineWidth = 1.6; c.stroke(); } });
      })(P[k], P[k + 1]);
    }
    for (var i = 0; i <= n; i++) {
      (function (t) { line(function (s) { return fn(t, s); }, "rgba(62,99,221,.85)"); line(function (s) { return fn(s, t); }, "rgba(232,89,12,.85)"); })(i / n);
    }
  };

  /* ---------- sirt turlari uçun funksiyalar ---------- */
  function rho(kind, th) {   // profil: radius θ burçak funksiyasi sifatida
    if (kind === "star") return 1 + 0.28 * Math.cos(5 * th);
    if (kind === "sq") return Math.pow(Math.pow(Math.abs(Math.cos(th)), 6) + Math.pow(Math.abs(Math.sin(th)), 6), -1 / 6);
    return 1;
  }
  function circle(kind, s, z, n) {
    var a = []; for (var k = 0; k <= n; k++) { var th = 2 * PI * k / n, r = s * rho(kind, th); a.push([r * Math.cos(th), r * Math.sin(th), z]); }
    return a;
  }
  var KINDS = [["circle", "Aylana"], ["star", "Yulduz"], ["sq", "Kvadrat"]];
  // aylanma sirt profili (r, z): t ∈ [0,1]
  var PROF = {
    sphere: { name: "Sfera", fn: function (t) { return [Math.sin(PI * t), 1 - Math.cos(PI * t)]; } },
    vase: { name: "Vaza", fn: function (t) { return X.bezier([[1.0, 0], [0.4, 0.9], [1.6, 1.7], [0.7, 2.6]], t); } },
    cup: { name: "Kosa", fn: function (t) { return X.bezier([[0.05, 0], [1.5, 0.2], [1.6, 1.6], [1.1, 2.2]], t); } }
  };
  function bilinear(P00, P10, P01, P11, u, v) {
    return [0, 1, 2].map(function (k) { return (1 - u) * (1 - v) * P00[k] + u * (1 - v) * P10[k] + (1 - u) * v * P01[k] + u * v * P11[k]; });
  }
  function coonsFn(C0, C1, D0, D1, Q) {   // S = (1−v)C0(u) + vC1(u) + (1−u)D0(v) + uD1(v) − B(u,v)
    return function (u, v) {
      var b = bilinear(Q[0], Q[1], Q[2], Q[3], u, v);
      return [0, 1, 2].map(function (k) { return (1 - v) * C0(u)[k] + v * C1(u)[k] + (1 - u) * D0(v)[k] + u * D1(v)[k] - b[k]; });
    };
  }
  function bezPatch(net) {
    return function (u, v) {
      var r = [0, 0, 0];
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var w = X.bernstein(3, i, u) * X.bernstein(3, j, v); r[0] += w * net[i][j][0]; r[1] += w * net[i][j][1]; r[2] += w * net[i][j][2]; }
      return r;
    };
  }
  function lagr(n, v) { return n === 2 ? [1 - v, v] : [2 * (v - 0.5) * (v - 1), -4 * v * (v - 1), 2 * v * (v - 0.5)]; }
  function defNet() {
    var z = [[0, 0.5, 0.5, 0], [0.5, 2, 1, 0.5], [0.5, 1, -1, 0.5], [0, 0.5, 0.5, 0]], net = [];
    for (var i = 0; i < 4; i++) { net.push([]); for (var j = 0; j < 4; j++) net[i].push([-1.5 + i, -1.5 + j, z[i][j]]); }
    return net;
  }
  function maxd(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
  LAB._t = LAB._t || {}; LAB._t.l11 = { coonsFn: coonsFn, bezPatch: bezPatch, bilinear: bilinear };

  function fmtP(p) { return "(" + f(p[0], 2) + "; " + f(p[1], 2) + "; " + f(p[2], 2) + ")"; }

  /* ---------- umumiy mexanizm: bitta sahna, bir nechta sirt turi ---------- */
  function engine(L, kinds, first, camBase) {
    var S = L.scene({ dist: camBase.dist, yaw: -0.8, pitch: 0.5, target: camBase.target, aspect: 0.85, gridOpts: { n: 8, step: 0.5 }, axesOpts: { len: 1.6 } });
    var KM = {}; kinds.forEach(function (K) { KM[K.id] = K; });
    var base = S.items.slice(), st = { kind: first, nu: 16, nv: 16, iso: true, wire: false }, groups = {}, rds = {};
    function rebuild() {
      var K = KM[st.kind], d = K.build(), mesh = X.mesh.param(d.fn, st.nu, st.nv, !!d.closeU, !!d.closeV);
      S.items = base.slice();
      S.add(new X.Mesh({ mesh: mesh, color: K.color || "#C9D4F5", twoSided: true, edge: st.wire ? "rgba(43,58,103,.7)" : "rgba(43,58,103,.10)", lw: st.wire ? 0.9 : 0.6 }));
      if (st.iso) S.add(new Iso(d.fn, 8));
      (d.extras || []).forEach(function (it) { S.add(it); });
      S.draw();
      var cells = { V: String(mesh.v.length), F: String(mesh.f.length) }; for (var k in d.info) cells[k] = d.info[k];
      rds[st.kind].setMany(cells);
    }
    kinds.forEach(function (K) { rds[K.id] = L.readout([["V", "Uçlar (V)"], ["F", "Yoqlar (F)"]].concat(K.cells)); rds[K.id].el.hidden = K.id !== first; });
    L.seg("Sirt turi", kinds.map(function (K) { return [K.id, K.name]; }), first, function (v) {
      st.kind = v; Object.keys(groups).forEach(function (k) { groups[k].hidden = k !== v; rds[k].el.hidden = k !== v; });
      if (KM[v].cam) { S.target = KM[v].cam.target.slice(); S.dist = KM[v].cam.dist; }
      rebuild();
    });
    kinds.forEach(function (K) { groups[K.id] = L.group(function () { K.controls(rebuild); }); groups[K.id].hidden = K.id !== first; });
    L.slider({ label: "u böyiça bölaklar soni", min: 3, max: 40, step: 1, value: st.nu, nd: 0 }, function (v) { st.nu = v; rebuild(); });
    L.slider({ label: "v böyiça bölaklar soni", min: 3, max: 40, step: 1, value: st.nv, nd: 0 }, function (v) { st.nv = v; rebuild(); });
    L.toggle("Izoparametrik çiziqlar (u = const — kök, v = const — zarğaldoq)", true, function (v) { st.iso = v; rebuild(); });
    L.toggle("Poligonal tör (qirralar)", false, function (v) { st.wire = v; rebuild(); });
    return { S: S, st: st, rebuild: rebuild };
  }

  LAB.start({
    intro: "Sirt — ikki parametrli S(u, v) funksiya, u, v ∈ [0; 1]. Sirt turi uni aniqlaşning usuliga qarab farq qiladi: törtburçak lavhalar (bilinear, Coons, bikubik Bezier) yoki egri çiziqdan hosil qilingan sirtlar (ekstruziya, aylanma sirt, loft).",
    tabs: [
      {
        name: "Lavhalar",
        lead: "Sirtni siçqonça yoki barmoq bilan aylantiring. Bilinear lavha — 4 uç, Coons — 4 çegara egri çiziq, bikubik Bezier — 4×4 boşqaruv töri.",
        build: function (L) {
          var net = defNet(), h = [0, 0, 0, 1.6], cb = { a0: 1, a1: 0, d0: 0, d1: 0, b: 0.4 }, pi = 5, E;
          var CORN = [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]];
          var kinds = [
            { id: "bil", name: "Bilinear", cells: [["c", "S(½; ½)"], ["t", "Burama z"], ["p", "Tekislikmi?"]], color: "#C9D4F5",
              build: function () {
                var Q = CORN.map(function (c, i) { return [c[0], c[1], h[i]]; });
                var fn = function (u, v) { return bilinear(Q[0], Q[1], Q[2], Q[3], u, v); };
                var tw = h[0] - h[1] - h[2] + h[3];
                return { fn: fn, extras: [new X.Points({ pts: Q, color: C.ink, r: 5, front: true, labels: ["P00", "P10", "P01", "P11"] })],
                  info: { c: fmtP(fn(0.5, 0.5)), t: f(tw, 2), p: Math.abs(tw) < 1e-9 ? "Ha (4 nuqta bir tekislikda)" : "Yöq (giperbolik paraboloid)" } };
              },
              controls: function (rb) {
                ["h₀₀ (P00)", "h₁₀ (P10)", "h₀₁ (P01)", "h₁₁ (P11)"].forEach(function (nm, i) {
                  L.slider({ label: "Balandlik " + nm, min: -2, max: 2, step: 0.1, value: h[i], nd: 1 }, function (v) { h[i] = v; rb(); });
                });
              } },
            { id: "coons", name: "Coons", cells: [["c", "S(½; ½)"], ["e", "Çegara xatosi"]], color: "#C9D4F5",
              build: function () {
                var Q = [[-1.5, -1.5, 0], [1.5, -1.5, 0], [-1.5, 1.5, 0], [1.5, 1.5, 0]], sn = function (t) { return Math.sin(PI * t); };
                var C0 = function (u) { return [-1.5 + 3 * u, -1.5, cb.a0 * sn(u)]; }, C1 = function (u) { return [-1.5 + 3 * u, 1.5, cb.a1 * sn(u)]; };
                var D0 = function (v) { return [-1.5 - cb.b * sn(v), -1.5 + 3 * v, cb.d0 * sn(v)]; }, D1 = function (v) { return [1.5 + cb.b * sn(v), -1.5 + 3 * v, cb.d1 * sn(v)]; };
                var fn = coonsFn(C0, C1, D0, D1, Q), er = 0;
                for (var k = 0; k <= 20; k++) { var t = k / 20; er = Math.max(er, maxd(fn(t, 0), C0(t)), maxd(fn(t, 1), C1(t)), maxd(fn(0, t), D0(t)), maxd(fn(1, t), D1(t))); }
                function curve(g, col) { var a = []; for (var k = 0; k <= 40; k++) a.push(g(k / 40)); return new X.Line({ pts: a, color: col, lw: 4, front: true }); }
                return { fn: fn, extras: [curve(C0, C.z), curve(C1, C.violet), curve(D0, C.y), curve(D1, C.x)],
                  info: { c: fmtP(fn(0.5, 0.5)), e: er < 1e-12 ? "0 (≈ 10⁻¹⁶)" : f(er, 4) } };
              },
              controls: function (rb) {
                L.add(EX.el("div", { class: "legend", html: '<span><i style="background:' + C.z + '"></i>C₀(u), v = 0</span><span><i style="background:' + C.violet + '"></i>C₁(u), v = 1</span><span><i style="background:' + C.y + '"></i>D₀(v), u = 0</span><span><i style="background:' + C.x + '"></i>D₁(v), u = 1</span>' }));
                [["a0", "C₀ chetining kötarilişi"], ["a1", "C₁ chetining kötarilişi"], ["d0", "D₀ chetining kötarilişi"], ["d1", "D₁ chetining kötarilişi"]].forEach(function (a) {
                  L.slider({ label: a[1], min: -1.5, max: 1.5, step: 0.1, value: cb[a[0]], nd: 1 }, function (v) { cb[a[0]] = v; rb(); });
                });
                L.slider({ label: "D₀, D₁ yon egilişi b", min: -0.8, max: 0.8, step: 0.1, value: cb.b, nd: 1 }, function (v) { cb.b = v; rb(); });
              } },
            { id: "bez", name: "Bikubik Bezier", cells: [["s", "Tanlangan P_ij"], ["c", "S(½; ½)"]], color: "#C9D4F5",
              build: function () {
                var fn = bezPatch(net), lines = [], i, j, pts = [], cols = [];
                for (i = 0; i < 4; i++) { lines.push(new X.Line({ pts: net[i], color: C.ink3, lw: 1.5, front: true })); lines.push(new X.Line({ pts: [0, 1, 2, 3].map(function (k) { return net[k][i]; }), color: C.ink3, lw: 1.5, front: true })); }
                for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) { pts.push(net[i][j]); cols.push(i * 4 + j === pi ? C.pink : C.ink); }
                var sel = net[Math.floor(pi / 4)][pi % 4];
                lines.push(new X.Points({ pts: pts, colors: cols, r: 4.5, front: true }));
                lines.push(new X.Points({ pts: [sel], color: C.pink, r: 8, front: true, labels: ["P" + Math.floor(pi / 4) + (pi % 4)] }));
                return { fn: fn, extras: lines, info: { s: fmtP(sel), c: fmtP(fn(0.5, 0.5)) } };
              },
              controls: function (rb) {
                var items = []; for (var i = 0; i < 16; i++) items.push([i, "P" + Math.floor(i / 4) + (i % 4)]);
                var sx, sy, sz;
                var sel = L.select("Boşqaruv nuqtasi (yoki sahnada ustiga bosing)", items, pi, function (v) { pi = Number(v); sync(); rb(); });
                function cur() { return net[Math.floor(pi / 4)][pi % 4]; }
                function sync() { var p = cur(); sx.set(p[0], true); sy.set(p[1], true); sz.set(p[2], true); sel.set(pi, true); }
                sx = L.slider({ label: "x", min: -3, max: 3, step: 0.1, value: cur()[0], nd: 1 }, function (v) { cur()[0] = v; rb(); });
                sy = L.slider({ label: "y", min: -3, max: 3, step: 0.1, value: cur()[1], nd: 1 }, function (v) { cur()[1] = v; rb(); });
                sz = L.slider({ label: "z", min: -3, max: 3, step: 0.1, value: cur()[2], nd: 1 }, function (v) { cur()[2] = v; rb(); });
                L.button("Törni tiklaş", function () { net = defNet(); sync(); rb(); });
                kindsPick = function (x, y) {
                  var best = -1, bd = 32;
                  for (var k = 0; k < 16; k++) { var q = E.S.project(net[Math.floor(k / 4)][k % 4]), d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = k; } }
                  if (best >= 0) { pi = best; sync(); rb(); }
                };
              } }
          ];
          var kindsPick = null;
          E = engine(L, kinds, "bil", { dist: 5.6, target: [0, 0, 0.3] });
          E.S.onPick = function (x, y) { if (E.st.kind === "bez" && kindsPick) kindsPick(x, y); };
          E.rebuild();
          L.note("<b>Bilinear:</b> S = (1−u)(1−v)P<sub>00</sub> + u(1−v)P<sub>10</sub> + (1−u)vP<sub>01</sub> + uvP<sub>11</sub>. <b>Coons (bilinear aralaştirilgan):</b> S(u,v) = (1−v)C<sub>0</sub>(u) + vC<sub>1</sub>(u) + (1−u)D<sub>0</sub>(v) + uD<sub>1</sub>(v) − [bilinear lavha, 4 burçak]; sirt 4 çegara egri çiziqni <i>aniq</i> takrorlaydi. <b>Bezier:</b> S = Σ<sub>i</sub>Σ<sub>j</sub> B<sub>i,3</sub>(u)B<sub>j,3</sub>(v)P<sub>ij</sub> — sirt faqat 4 burçak nuqtadan ötadi.", "main");
          L.tasks([
            "Bilinearda h₁₁ ni özgartiring (qolganlari 0): «Burama z» nolga teng bölgan holat qaysi? (Burama = 0 bölsa, lavha tekis.)",
            "Coonsda 4 chetni özgartiring va «Çegara xatosi»ni körin: nega ≈ 0? Sirt ichki nuqtalarni qanday toldiradi?",
            "Bezierda P11 yoki P12 ni tanlab z ni özgartiring: sirt nuqtadan ötadimi yoki faqat «tortiladi»? Burçak nuqta P00 uçun-çi?"
          ], "a");
        }
      },
      {
        name: "Ekstruziya, aylanma sirt, loft",
        lead: "Egri çiziqlardan sirt hosil qilişning üç usuli. Profilni almaştiring, parametrlarni özgartiring va izoparametrik çiziqlarga qarang.",
        build: function (L) {
          var ex = { kind: "star", H: 2, sc: 1, tw: 0 }, rv = { prof: "vase", ang: 360, k: 1 }, lf = { n: 3, kinds: ["circle", "star", "circle"], s: [1.2, 0.7, 1.1], H: 3 };
          function secLines(arr) { return arr.map(function (a) { return new X.Line({ pts: a, color: C.pink, lw: 3.5, front: true }); }); }
          var kinds = [
            { id: "ext", name: "Ekstruziya", cells: [["h", "Balandlik"], ["s", "Yuqori masştab"], ["w", "Burilişi"]], cam: { target: [0, 0, 1], dist: 6.2 },
              build: function () {
                var tw = ex.tw * PI / 180;
                var fn = function (u, v) { var th = 2 * PI * u, s = 1 + (ex.sc - 1) * v, r = s * rho(ex.kind, th), a = th + tw * v; return [r * Math.cos(a), r * Math.sin(a), ex.H * v]; };
                return { fn: fn, closeU: true, extras: secLines([circle(ex.kind, 1, 0, 72), circle(ex.kind, ex.sc, ex.H, 72).map(function (p) { var a = tw, c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; })]),
                  info: { h: f(ex.H, 1), s: f(ex.sc, 2), w: f(ex.tw, 0) + "°" } };
              },
              controls: function (rb) {
                L.select("Profil", KINDS, ex.kind, function (v) { ex.kind = v; rb(); });
                L.slider({ label: "Balandlik H", min: 0.5, max: 3, step: 0.1, value: ex.H, nd: 1 }, function (v) { ex.H = v; rb(); });
                L.slider({ label: "Yuqori profil masştabi", min: 0.2, max: 1.8, step: 0.05, value: ex.sc, nd: 2 }, function (v) { ex.sc = v; rb(); });
                L.slider({ label: "Burilişi (twist)", min: -180, max: 180, step: 5, value: ex.tw, nd: 0, unit: "°" }, function (v) { ex.tw = v; rb(); });
              } },
            { id: "rev", name: "Aylanma sirt", cells: [["a", "Yuz (Pappus)"], ["r", "Aylaniş burçagi"]], cam: { target: [0, 0, 1.2], dist: 6.4 },
              build: function () {
                var pf = PROF[rv.prof].fn, phi = rv.ang * PI / 180;
                var prof = function (t) { var q = pf(t); return [q[0] * rv.k, q[1]]; };
                var fn = function (u, v) { var q = prof(u); return [q[0] * Math.cos(phi * v), q[0] * Math.sin(phi * v), q[1]]; };
                var A = 0, M = 2000, pa = prof(0);
                for (var i = 1; i <= M; i++) { var pb = prof(i / M); A += 0.5 * (pa[0] + pb[0]) * Math.hypot(pb[0] - pa[0], pb[1] - pa[1]); pa = pb; }
                A *= phi;
                var line = []; for (var k = 0; k <= 60; k++) { var q = prof(k / 60); line.push([q[0], 0, q[1]]); }
                return { fn: fn, closeV: rv.ang >= 360, extras: [new X.Line({ pts: line, color: C.pink, lw: 4, front: true })],
                  info: { a: f(A, 3), r: f(rv.ang, 0) + "°" } };
              },
              controls: function (rb) {
                L.select("Profil egri çiziği", Object.keys(PROF).map(function (k) { return [k, PROF[k].name]; }), rv.prof, function (v) { rv.prof = v; rb(); });
                L.slider({ label: "Aylaniş burçagi", min: 30, max: 360, step: 5, value: rv.ang, nd: 0, unit: "°" }, function (v) { rv.ang = v; rb(); });
                L.slider({ label: "Radius koeffitsiyenti k", min: 0.5, max: 1.5, step: 0.05, value: rv.k, nd: 2 }, function (v) { rv.k = v; rb(); });
              } },
            { id: "loft", name: "Loft", cells: [["r", "Kesim radiuslari"], ["h", "Balandlik"]], cam: { target: [0, 0, 1.5], dist: 7.2 },
              build: function () {
                var n = lf.n, fn = function (u, v) {
                  var w = lagr(n, v), th = 2 * PI * u, r = 0;
                  for (var k = 0; k < n; k++) r += w[k] * lf.s[k] * rho(lf.kinds[k], th);
                  return [r * Math.cos(th), r * Math.sin(th), lf.H * v];
                };
                var secs = []; for (var k = 0; k < n; k++) secs.push(circle(lf.kinds[k], lf.s[k], lf.H * k / (n - 1), 72));
                return { fn: fn, closeU: true, extras: secLines(secs), info: { r: lf.s.slice(0, n).map(function (x) { return f(x, 2); }).join("; "), h: f(lf.H, 1) } };
              },
              controls: function (rb) {
                L.seg("Kesimlar soni", [[2, "2 kesim"], [3, "3 kesim"]], lf.n, function (v) { lf.n = Number(v); rb(); });
                for (var i = 0; i < 3; i++) (function (i) {
                  L.select("Kesim " + (i + 1) + " shakli", KINDS, lf.kinds[i], function (v) { lf.kinds[i] = v; rb(); });
                  L.slider({ label: "Kesim " + (i + 1) + " radiusi", min: 0.3, max: 1.6, step: 0.05, value: lf.s[i], nd: 2 }, function (v) { lf.s[i] = v; rb(); });
                })(i);
                L.slider({ label: "Umumiy balandlik H", min: 1, max: 4, step: 0.1, value: lf.H, nd: 1 }, function (v) { lf.H = v; rb(); });
              } }
          ];
          var E = engine(L, kinds, "ext", { dist: 6.2, target: [0, 0, 1] });
          E.rebuild();
          L.note("<b>Ekstruziya:</b> S(u,v) = (ρ(u)·cos θ, ρ(u)·sin θ, H·v). <b>Aylanma sirt:</b> S(u,v) = (r(u)cos φv, r(u)sin φv, z(u)); yuz — Pappus: A = φ·∫ r ds (sfera, k = 1, 360°: 4π ≈ 12,566). <b>Loft:</b> kesimlar S<sub>k</sub> orasida interpolyatsiya: 2 kesimda çiziqli, 3 kesimda kvadratik (Lagranj): S(u,v) = Σ L<sub>k</sub>(v)·S<sub>k</sub>(u).", "main");
          L.tasks([
            "Ekstruziyada «Yulduz» profilini tanlab, burilişni 90° va yuqori masştabni 0,5 qiling: yon sirt qanday özgaradi?",
            "Aylanma sirtda «Sfera» profil, 360° va k = 1 ni tanlang: «Yuz» ≈ 12,566 (4π). Aylaniş burçagini 180° ga kamaytirsangiz yuz qançaga özgaradi? (Ikki marta kamayadi.)",
            "Loftda 3 kesim: aylana – yulduz – aylana. Kesim sonini 2 ga almaştirsangiz, ortadagi yulduz kesim nima böladi?"
          ], "b");
        }
      }
    ]
  });
})();
