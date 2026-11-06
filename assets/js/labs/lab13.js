/* 13-mavzu. Geometrik obyektlar konstruktori */
(function () {
  var X = window.X3D, M = X.m, V = X.v, C = LAB.C, f = X.fmt;
  var PI = Math.PI;

  function hex(c) { return "#" + c.map(function (x) { var s = Math.round(x).toString(16); return s.length < 2 ? "0" + s : s; }).join(""); }
  function lerpHex(a, b, t) { var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); }); return hex(pa.map(function (x, i) { return x + (pb[i] - x) * t; })); }
  function sceneFit(L, o) { return L.scene(o); }

  /* ---------- 1-tab: primitivlar ---------- */
  var SHAPES = {
    cube: { name: "Kub", exp: "yopiq, χ = 2", p: [], build: function () { return X.mesh.cube(2); } },
    uv: { name: "UV-sfera", exp: "yopiq, χ = 2", p: [["seg", "Segmentlar (meridianlar)", 3, 64, 32], ["rings", "Halqalar (parallellar)", 2, 32, 16]],
      build: function (p) { return X.mesh.uvSphere(p.seg, p.rings, 1.3); } },
    ico: { name: "Ikosfera", exp: "yopiq, χ = 2", p: [["sub", "Bölinişlar (Subdivisions)", 1, 4, 2]], build: function (p) { return X.mesh.icosphere(p.sub, 1.3); } },
    cyl: { name: "Silindr", exp: "yopiq, χ = 2", p: [["n", "Çöqqilar (Vertices)", 3, 64, 32]], cap: true, build: function (p, o) { return X.mesh.cylinder(p.n, 1, 2, o.cap ? "ngon" : "none"); } },
    cone: { name: "Konus", exp: "yopiq, χ = 2", p: [["n", "Çöqqilar (Vertices)", 3, 64, 32]], build: function (p) { return X.mesh.cone(p.n, 1, 2); } },
    torus: { name: "Tor", exp: "yopiq, χ = 0 (tor)", p: [["M", "Asosiy segmentlar", 3, 64, 48], ["m", "Halqa segmentlari", 3, 32, 12]], build: function (p) { return X.mesh.torus(p.M, p.m, 1.1, 0.4); } },
    grid: { name: "Panjara", exp: "oçiq, χ = 1 (disk)", p: [["nx", "X böyiça tugunlar", 2, 32, 10], ["ny", "Y böyiça tugunlar", 2, 32, 10]], build: function (p) { return X.mesh.grid(p.nx, p.ny, 2.4); } }
  };
  SHAPES.grid.p[0][1] = "X böyiça tugunlar"; SHAPES.grid.p[1][1] = "Y böyiça tugunlar";

  function tab1(L) {
    var S = L.scene({ dist: 5, pitch: 0.5, yaw: -0.8, aspect: 0.78, gridOpts: { n: 12, step: 0.5 } });
    var mesh = S.add(new X.Mesh({ mesh: X.mesh.cube(2), color: "#C9D4F5", wire: false }));
    var st = { id: "uv", vals: {}, cap: true }, groups = {}, sliders = {};
    Object.keys(SHAPES).forEach(function (k) { st.vals[k] = {}; SHAPES[k].p.forEach(function (q) { st.vals[k][q[0]] = q[4]; }); });
    var R = L.readout([["V", "V — çöqqilar"], ["E", "E — qirralar"], ["F", "F — yoqlar"], ["chi", "V − E + F"], ["tri", "Uçburçaklar (F triangulyatsiyada)"], ["cl", "Yuza turi"]]);
    function update() {
      var sh = SHAPES[st.id], m = sh.build(st.vals[st.id], { cap: st.cap }), c = X.mesh.counts(m), tri = 0;
      m.f.forEach(function (F) { tri += F.length - 2; });
      mesh.o.mesh = m; mesh.o.wire = m.f.length > 1200 ? false : false; mesh.o.edge = m.f.length > 1200 ? false : "rgba(43,58,103,.55)";
      R.setMany({ V: f(c.V, 0), E: f(c.E, 0), F: f(c.F, 0), chi: f(c.chi, 0), tri: f(tri, 0), cl: (st.id === "cyl" && !st.cap) ? "oçiq, χ = 0" : sh.exp });
      S.draw();
    }
    L.seg("Primitiv", Object.keys(SHAPES).map(function (k) { return [k, SHAPES[k].name]; }), "uv", function (v) {
      st.id = v; Object.keys(groups).forEach(function (k) { groups[k].hidden = k !== v; }); update();
    });
    Object.keys(SHAPES).forEach(function (k) {
      var sh = SHAPES[k];
      groups[k] = L.group(function () {
        sh.p.forEach(function (q) {
          L.slider({ label: q[1], min: q[2], max: q[3], step: 1, value: q[4], nd: 0 }, function (v) { st.vals[k][q[0]] = v; update(); });
        });
        if (sh.cap) L.toggle("Qopqoqlar (N-gon)", true, function (v) { st.cap = v; update(); });
        if (!sh.p.length) L.text("Kubda sozlanadigan parametr yöq: 8 çöqqi, 12 qirra, 6 yoq.");
      });
      groups[k].hidden = k !== st.id;
    });
    L.add(EX.el("div", { class: "note", html: "Blenderʼning standart qiymatlari: UV-sfera 32 × 16 → 482 / 992 / 512; ikosfera (Subdivisions 2) → 42 / 120 / 80; silindr 32 → 64 / 96 / 34; konus 32 → 33 / 64 / 33; tor 48 × 12 → 576 / 1152 / 576." }), "main");
    update();
    L.tasks([
      "UV-sferani 32 × 16 qiling: V, E, F = 482, 992, 512 ekanini tekşiring. Segmentlarni 2 marta oşirsangiz F qanday özgaradi?",
      "Silindrda «Qopqoqlar»ni öçiring: V − E + F nega 2 emas, 0 bölib qoladi? [yuza yopiq emas]",
      "Torni tanlang: V − E + F = 0. Sfera uçun esa 2. Bu sonni nima belgilaydi? [teşiklar soni — genus]"
    ], "a");
  }

  /* ---------- 2-tab: aylana ≈ n-burçak ---------- */
  function tab2(L) {
    var st = { n: 8, r: 10, eps: 0.5 };
    var cv = L.canvas({ aspect: 0.85, maxH: 480 });
    var R = L.readout([["s", "Sagitta s = r(1 − cos(π/n))"], ["sr", "s / r"], ["p", "Perimetr P"], ["pe", "Perimetr xatosi"], ["a", "Yuz A"], ["ae", "Yuz xatosi"]]);
    var need = L.readout([["nmin", "Kerakli n (s/r ≤ ruxsat)"], ["nerr", "Şu n da perimetr xatosi"]]);
    cv.draw = function (c, w, h) {
      var cx = w / 2, cy = h / 2, rr = Math.min(w, h) / 2 - 22, n = st.n, i;
      c.strokeStyle = C.ink3; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, rr, 0, 7); c.stroke();
      c.beginPath();
      for (i = 0; i < n; i++) { var a = -PI / 2 + 2 * PI * i / n, x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a); if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.closePath(); c.fillStyle = "rgba(62,99,221,.14)"; c.fill(); c.strokeStyle = C.z; c.lineWidth = 2.5; c.stroke();
      for (i = 0; i < n; i++) { var b = -PI / 2 + 2 * PI * i / n; c.beginPath(); c.arc(cx + rr * Math.cos(b), cy + rr * Math.sin(b), n > 40 ? 2 : 4, 0, 7); c.fillStyle = C.ink; c.fill(); }
      // sagitta: birinçi qirra örtasidan aylanagaça
      var am = -PI / 2 + PI / n, mx = cx + rr * Math.cos(PI / n) * Math.cos(am), my = cy + rr * Math.cos(PI / n) * Math.sin(am);
      var ex = cx + rr * Math.cos(am), ey = cy + rr * Math.sin(am);
      c.beginPath(); c.moveTo(mx, my); c.lineTo(ex, ey); c.strokeStyle = C.x; c.lineWidth = 4; c.stroke();
      c.fillStyle = C.x; c.font = "700 13px Inter, system-ui, sans-serif"; c.fillText("s", ex + (ex > cx ? 6 : -14), ey - 4);
      c.fillStyle = C.ink2; c.font = "600 13px Inter, system-ui, sans-serif"; c.fillText("n = " + n, 10, 20);
    };
    function upd() {
      var n = st.n, r = st.r, s = r * (1 - Math.cos(PI / n)), P = 2 * n * r * Math.sin(PI / n), A = n / 2 * r * r * Math.sin(2 * PI / n);
      var P0 = 2 * PI * r, A0 = PI * r * r;
      R.setMany({ s: f(s, 4) + " sm", sr: f(s / r * 100, 3) + " %", p: f(P, 3) + " sm", pe: f((P0 - P) / P0 * 100, 3) + " %", a: f(A, 3) + " sm²", ae: f((A0 - A) / A0 * 100, 3) + " %" });
      var e = st.eps / 100, nm = Math.max(3, Math.ceil(PI / Math.acos(1 - e) - 1e-9));
      var Pn = 2 * nm * Math.sin(PI / nm);
      need.setMany({ nmin: f(nm, 0), nerr: f((2 * PI - Pn) / (2 * PI) * 100, 4) + " %" });
      cv.redraw();
    }
    L.slider({ label: "Burçaklar soni n", min: 3, max: 64, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; upd(); });
    L.slider({ label: "Aylana radiusi r", min: 1, max: 100, step: 1, value: st.r, nd: 0, unit: "sm" }, function (v) { st.r = v; upd(); });
    L.slider({ label: "Ruxsat etilgan s / r", min: 0.01, max: 5, step: 0.01, value: st.eps, nd: 2, unit: "%" }, function (v) { st.eps = v; upd(); });
    L.note("Aylanaga içki çizilgan n-burçak: s = r(1 − cos(π/n)), P<sub>n</sub> = 2nr·sin(π/n), A<sub>n</sub> = (n/2)·r²·sin(2π/n). Aylana: P = 2πr, A = πr². Kerakli n uçun: n ≥ π / arccos(1 − s/r).", "main");
    upd();
    L.tasks([
      "n = 8 va r = 10 sm: sagitta neçaga teng? [0,7612 sm; s/r = 7,612 %]. n = 32 da-çi? [0,0482 sm]",
      "n ni ikki marta oşiring (16 → 32 → 64): perimetr xatosi taxminan neça marta kamayadi? [≈ 4 marta]",
      "Ruxsat etilgan s/r = 0,5 % uçun n neçta kerak? [32]. Bu Blender silindrining standart 32 çöqqisiga mos keladi."
    ], "b");
  }

  /* ---------- 3-tab: lathe va ekstruziya ---------- */
  function lathe(profile, n) {
    var v = [], rings = [], F = [];
    profile.forEach(function (p) {
      var ring = [];
      if (p[0] < 1e-6) { v.push([0, 0, p[1]]); for (var j = 0; j < n; j++) ring.push(v.length - 1); }
      else for (var j2 = 0; j2 < n; j2++) { var a = 2 * PI * j2 / n; v.push([p[0] * Math.cos(a), p[0] * Math.sin(a), p[1]]); ring.push(v.length - 1); }
      rings.push(ring);
    });
    for (var i = 0; i < profile.length - 1; i++) for (var j3 = 0; j3 < n; j3++) {
      var A = rings[i], B = rings[i + 1], j4 = (j3 + 1) % n, ids = [A[j3], A[j4], B[j4], B[j3]];
      ids = ids.filter(function (k, q) { return k !== ids[(q + 1) % 4]; });
      if (ids.length >= 3) F.push(ids);
    }
    return { v: v, f: F };
  }
  var BASES = {
    sq: { name: "Kvadrat", pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]] },
    L: { name: "L-şakl", pts: [[-1, -1], [1, -1], [1, 0], [0, 0], [0, 1], [-1, 1]] },
    star: { name: "Yulduz", pts: (function () { var o = []; for (var i = 0; i < 10; i++) { var a = PI / 2 + PI * i / 5, r = i % 2 ? 0.45 : 1.1; o.push([r * Math.cos(a), r * Math.sin(a)]); } return o; })() }
  };
  function extrude(base, h, s) {
    var n = base.length, v = [], F = [], i;
    base.forEach(function (p) { v.push([p[0], p[1], 0]); });
    base.forEach(function (p) { v.push([p[0] * s, p[1] * s, h]); });
    for (i = 0; i < n; i++) F.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
    var b = []; for (i = n - 1; i >= 0; i--) b.push(i); F.push(b);
    var t = []; for (i = 0; i < n; i++) t.push(n + i); F.push(t);
    return { v: v, f: F };
  }
  function tab3(L) {
    var st = { page: "lathe", n: 24, prof: [[0, 0], [1.3, 0], [0.8, 1.2], [1.1, 2.4], [0.7, 3.4], [0, 3.4]], base: "star", h: 1.5, sc: 1 };
    var P = L.plot({ x: [-3, 3], y: [-0.7, 4.2], aspect: 0.95, hint: "Profil nuqtalarini sudrang (x = 0 — aylanış öqi)" });
    var S = L.scene({ dist: 8, target: [0, 0, 1.6], aspect: 0.95, pitch: 0.4, yaw: -0.9, gridOpts: { n: 12, step: 0.5 }, hint: "Sudrang — aylantiriş" });
    var mesh = S.add(new X.Mesh({ mesh: { v: [], f: [] }, color: "#C9D4F5", twoSided: true }));
    var R = L.readout([["V", "V — çöqqilar"], ["E", "E — qirralar"], ["F", "F — yoqlar"], ["chi", "V − E + F"]]);
    var warn = L.note("", "main"); warn.hidden = true;
    function setProf() { P.handles = st.prof.map(function (p, i) { return { p: p.slice(), label: String(i + 1), color: i === 0 || i === st.prof.length - 1 ? C.orange : C.ink }; }); }
    setProf();
    P.onDrag = function (i, p) {
      var q = [Math.max(0, p[0] < 0.1 ? 0 : p[0]), p[1]]; P.handles[i].p = q; st.prof[i] = q; update();
    };
    P.onDraw = function (c) {
      if (st.page !== "lathe") return;
      var pts = st.prof;
      P.line(pts.map(function (p) { return [-p[0], p[1]]; }), "rgba(62,99,221,.35)", 2, [5, 4]);
      P.line(pts, C.z, 3.5);
    };
    function update() {
      var m, c;
      if (st.page === "lathe") m = lathe(st.prof, st.n); else m = extrude(BASES[st.base].pts, st.h, st.sc);
      c = X.mesh.counts(m); mesh.o.mesh = m;
      R.setMany({ V: f(c.V, 0), E: f(c.E, 0), F: f(c.F, 0), chi: f(c.chi, 0) });
      if (st.page === "lathe") {
        var open = st.prof[0][0] > 1e-6 || st.prof[st.prof.length - 1][0] > 1e-6;
        warn.hidden = false;
        warn.innerHTML = open ? "Profilning uçlari öqda emas: yuza <b>oçiq</b>, V − E + F = " + f(c.chi, 0) + " (2 emas)." : "Profilning ikkala uçi öqda (x = 0): yuza yopiq, V − E + F = 2.";
      } else {
        var k = BASES[st.base].pts.length;
        warn.hidden = false; warn.innerHTML = "n = " + k + " burçakli asos: V = 2n = " + 2 * k + ", E = 3n = " + 3 * k + ", F = n + 2 = " + (k + 2) + " → V − E + F = 2.";
      }
      P.draw(); S.draw();
    }
    var pg = { lathe: null, ext: null };
    L.seg("Amal", [["lathe", "Lathe (aylantiriş)"], ["ext", "Extrusion (çiqariş)"]], "lathe", function (v) {
      st.page = v; pg.lathe.hidden = v !== "lathe"; pg.ext.hidden = v !== "ext"; P.stageEl.hidden = v !== "lathe";
      if (v === "lathe") P.resize(); S.view("persp"); update();
    });
    pg.lathe = L.group(function () {
      L.slider({ label: "Segmentlar soni", min: 3, max: 64, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; update(); });
      L.button("Profilni tiklaş", function () { st.prof = [[0, 0], [1.3, 0], [0.8, 1.2], [1.1, 2.4], [0.7, 3.4], [0, 3.4]]; setProf(); update(); });
    });
    pg.ext = L.group(function () {
      L.seg("Asos şakli", Object.keys(BASES).map(function (k) { return [k, BASES[k].name]; }), st.base, function (v) { st.base = v; update(); });
      L.slider({ label: "Balandlik", min: 0.2, max: 3, step: 0.1, value: st.h, nd: 1, unit: "birlik" }, function (v) { st.h = v; update(); });
      L.slider({ label: "Yuqori masştab", min: 0.2, max: 1.6, step: 0.05, value: st.sc, nd: 2 }, function (v) { st.sc = v; update(); });
    });
    pg.ext.hidden = true;
    L.note("Lathe: profilning har bir nuqtasi z öqi atrofida n marta aylantiriladi; V = n·(öqda emas nuqtalar) + (öqdagi nuqtalar). Extrusion: n burçakli asos z böyiça çiqariladi; masştab = 1 bölsa tögri prizma.", "main");
    update();
    L.tasks([
      "Lathe: segmentlarni 8 va 48 qiling. Silliqlik nima uçun özgaradi, V va F esa qanday? [F = n·(profil kesmalari soni)]",
      "Profilning birinçi nuqtasini öqdan uzoqlaştiring (x > 0,1): yuza oçiq bölib, Eyler yiğindisi 2 dan farq qiladi.",
      "Extrusion: «Yulduz»ni tanlab, yuqori masştabni 0,3 ga tuşiring — kesik piramida hosil bölişini kuzating. V, E, F özgaradimi? [yöq]"
    ], "c");
  }

  /* ---------- 4-tab: Array spiral ---------- */
  function tab4(L) {
    var st = { cnt: 24, step: 0.18, ang: 20, rad: 1.4 };
    var S = L.scene({ dist: 9, target: [0, 0, 2], aspect: 0.95, pitch: 0.45, yaw: -0.9, gridOpts: { n: 12, step: 0.5 } });
    var mesh = S.add(new X.Mesh({ mesh: { v: [], f: [] }, edge: "rgba(24,32,60,.4)", lw: 0.6 }));
    var R = L.readout([["V", "V jami"], ["E", "E jami"], ["F", "F jami"], ["h", "Balandlik"], ["t", "Jami burilişi"], ["m", "Matritsa i-nusxa"]]);
    var step0 = X.mesh.transform(X.mesh.cube(1), M.S(1.2, 0.5, 0.1));
    function update() {
      var v = [], F = [], cols = [], i, q;
      for (i = 0; i < st.cnt; i++) {
        var Mi = M.mul(M.T(0, 0, i * st.step), M.mul(M.Rz(i * st.ang * PI / 180), M.T(st.rad, 0, 0))), b = v.length;
        step0.v.forEach(function (p) { v.push(M.apply(Mi, p)); });
        step0.f.forEach(function (fc) { F.push(fc.map(function (k) { return k + b; })); cols.push(lerpHex("#8FB3FF", "#F2A65A", st.cnt > 1 ? i / (st.cnt - 1) : 0)); });
      }
      mesh.o.mesh = { v: v, f: F }; mesh.o.faceColors = cols;
      q = X.mesh.counts({ v: v, f: F });
      R.setMany({ V: f(st.cnt * 8, 0), E: f(st.cnt * 12, 0), F: f(st.cnt * 6, 0), h: f((st.cnt - 1) * st.step, 2) + " birlik", t: f((st.cnt - 1) * st.ang, 0) + "°",
        m: "Tz(i·" + f(st.step, 2) + ") · Rz(i·" + f(st.ang, 0) + "°)" });
      void q;
      S.draw();
    }
    L.slider({ label: "Nusxalar soni (Count)", min: 1, max: 100, step: 1, value: st.cnt, nd: 0 }, function (v) { st.cnt = v; update(); });
    L.slider({ label: "Qadam (z böyiça siljiş)", min: 0, max: 0.5, step: 0.01, value: st.step, nd: 2, unit: "birlik" }, function (v) { st.step = v; update(); });
    L.slider({ label: "Burçak (har nusxaga)", min: 0, max: 60, step: 1, value: st.ang, nd: 0, unit: "°" }, function (v) { st.ang = v; update(); });
    L.slider({ label: "Radius (markazdan uzoqliq)", min: 0, max: 3, step: 0.1, value: st.rad, nd: 1, unit: "birlik" }, function (v) { st.rad = v; update(); });
    L.note("i-nusxa matritsasi: M<sub>i</sub> = T<sub>z</sub>(i·qadam) · R<sub>z</sub>(i·burçak) · T<sub>x</sub>(radius). Har bir nusxa sekin-asta siljib va burilib, zinapoya (spiral) hosil qiladi. Jami çöqqilar soni = 8 · nusxalar soni.", "main");
    update();
    L.tasks([
      "Burçakni 15° qilib, nusxalar sonini 24 ga yetkazing: jami burilişi 345°. Qaysi son uçun zina töğri bir aylanaga yetadi? [360° / burçak = 24 nusxa dan keyin 24-nusxa 360°]",
      "Qadamni 0 ga tuşiring: zinapoya yassi gülga aylanadi. Burçakni 0 ga tuşirsangiz-çi? [vertikal minora]",
      "Radiusni 0 ga tuşiring va burçakni 90° qiling: nusxalar bir-biriga qanday joylaşadi? [öq atrofida burilgan kesişuvçi tahtalar]"
    ], "d");
  }

  LAB.start({
    intro: "Murakkab model oddiy primitivlardan (kub, sfera, silindr, konus, tor, panjara) va ularni qayta işlaydigan amallardan (Lathe, Extrusion, Array) qurilgan. Har bir primitivning çöqqi, qirra va yoq soni segmentlar soniga boğliq.",
    tabs: [
      { name: "Primitivlar", lead: "Primitivni tanlab, segmentlar slayderlarini suring: V, E, F va Eyler yiğindisi jonli hisoblanadi.", build: tab1 },
      { name: "Aylana ≈ n-burçak", lead: "Kompyuterda aylana — n burçakli köpburçak. n qança katta bölsa, xato (sagitta s) şuncha kam.", build: tab2 },
      { name: "Lathe va Extrusion", lead: "Profilni z öqi atrofida aylantiring (Lathe) yoki yassi asosni balandlik böyiça çiqaring (Extrusion).", build: tab3 },
      { name: "Array spiral", lead: "Bitta zinapoya tagligini Array amali bilan köpaytirib, spiral hosil qiling.", build: tab4 }
    ]
  });
})();
