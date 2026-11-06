/* 8-mavzu. Spline turlari */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, EX = window.EX;
  var DEF = [[0.3, 1.2], [1.4, 3.0], [2.8, 1.0], [4.0, 2.8], [5.2, 1.2], [6.0, 2.6], [6.6, 1.5]];
  var NAMES = { nat: "Tabiiy kubik", cr: "Catmull–Rom", card: "Cardinal", kb: "Kochanek–Bartels" };
  var COL = { nat: C.z, cr: C.orange, card: C.green, kb: C.pink };

  /* ---------- matematika ---------- */
  function ext(P) {   // sönggi nuqtalarni akslantiriş (fantom nuqtalar)
    var N = P.length;
    return function (i) {
      if (i < 0) return [2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1]];
      if (i >= N) return [2 * P[N - 1][0] - P[N - 2][0], 2 * P[N - 1][1] - P[N - 2][1]];
      return P[i];
    };
  }
  // tabiiy kubik splayn: ikkinçi hosila uçlarda 0; parametrlaş: tekis (h = 1) yoki vatar uzunligi
  function natural(P, chord) {
    var N = P.length, n = N - 1, h = [], i, k;
    for (i = 0; i < n; i++) h.push(chord ? Math.max(1e-6, Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1])) : 1);
    var M = [[], []];
    for (k = 0; k < 2; k++) {
      var y = P.map(function (p) { return p[k]; }), m = n - 1, cp = [], dp = [], Mk = new Array(N).fill(0);
      for (i = 1; i <= m; i++) {          // Thomas algoritmi (uç diagonalli sistema)
        var a = h[i - 1], b = 2 * (h[i - 1] + h[i]), c = h[i];
        var d = 6 * ((y[i + 1] - y[i]) / h[i] - (y[i] - y[i - 1]) / h[i - 1]);
        var den = b - (i > 1 ? a * cp[i - 1] : 0);
        cp[i] = c / den; dp[i] = (d - (i > 1 ? a * dp[i - 1] : 0)) / den;
      }
      for (i = m; i >= 1; i--) Mk[i] = dp[i] - (i < m ? cp[i] * Mk[i + 1] : 0);
      M[k] = Mk;
    }
    var segs = [];
    for (i = 0; i < n; i++) {
      var ta = [], tb = [];
      for (k = 0; k < 2; k++) {
        var dy = (P[i + 1][k] - P[i][k]) / h[i];
        ta.push((dy - h[i] * (2 * M[k][i] + M[k][i + 1]) / 6) * h[i]);
        tb.push((dy + h[i] * (M[k][i] + 2 * M[k][i + 1]) / 6) * h[i]);
      }
      segs.push({ a: P[i], b: P[i + 1], ta: ta, tb: tb, h: h[i] });
    }
    return segs;
  }
  // Hermite bölaklari: out[i] — i-nuqtadan çiqayotgan, inn[i] — i-nuqtaga kirayotgan urinma
  function hermite(P, out, inn) {
    var segs = [];
    for (var i = 0; i < P.length - 1; i++) segs.push({ a: P[i], b: P[i + 1], ta: out[i], tb: inn[i + 1], h: 1 });
    return segs;
  }
  function kbTangents(P, T, Cc, B) {
    var E = ext(P), out = [], inn = [];
    for (var i = 0; i < P.length; i++) {
      var p0 = E(i - 1), p1 = P[i], p2 = E(i + 1), o = [], n = [];
      for (var k = 0; k < 2; k++) {
        var dm = p1[k] - p0[k], dp = p2[k] - p1[k];
        o.push(0.5 * (1 - T) * (1 + B) * (1 + Cc) * dm + 0.5 * (1 - T) * (1 - B) * (1 - Cc) * dp);   // çiqayotgan
        n.push(0.5 * (1 - T) * (1 + B) * (1 - Cc) * dm + 0.5 * (1 - T) * (1 - B) * (1 + Cc) * dp);   // kirayotgan
      }
      out.push(o); inn.push(n);
    }
    return { out: out, inn: inn };
  }
  function build(type, P, par) {
    if (type === "nat") return natural(P, par.chord);
    var E = ext(P), out = [], inn = [], i;
    if (type === "cr" || type === "card") {
      var k = type === "cr" ? 0.5 : (1 - par.c) / 2;   // Cardinal: m = (1 − c)/2·(P(i+1) − P(i−1)); c = 0 → Catmull–Rom
      for (i = 0; i < P.length; i++) { var t = [k * (E(i + 1)[0] - E(i - 1)[0]), k * (E(i + 1)[1] - E(i - 1)[1])]; out.push(t); inn.push(t); }
      return hermite(P, out, inn);
    }
    var kb = kbTangents(P, par.T, par.C, par.B);
    return hermite(P, kb.out, kb.inn);
  }
  function evalSeg(g, s) {
    var s2 = s * s, s3 = s2 * s, p = [], d1 = [], d2 = [];
    var h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    var a00 = 6 * s2 - 6 * s, a10 = 3 * s2 - 4 * s + 1, a01 = -6 * s2 + 6 * s, a11 = 3 * s2 - 2 * s;
    var b00 = 12 * s - 6, b10 = 6 * s - 4, b01 = -12 * s + 6, b11 = 6 * s - 2;
    for (var k = 0; k < 2; k++) {
      p.push(h00 * g.a[k] + h10 * g.ta[k] + h01 * g.b[k] + h11 * g.tb[k]);
      d1.push((a00 * g.a[k] + a10 * g.ta[k] + a01 * g.b[k] + a11 * g.tb[k]) / g.h);
      d2.push((b00 * g.a[k] + b10 * g.ta[k] + b01 * g.b[k] + b11 * g.tb[k]) / (g.h * g.h));
    }
    return { p: p, d1: d1, d2: d2 };
  }
  // işorali egrilik: κ = (x′y″ − y′x″) / (x′² + y′²)^{3/2}
  function kap(e) {
    var v2 = e.d1[0] * e.d1[0] + e.d1[1] * e.d1[1];
    if (v2 < 1e-12) return 0;
    return (e.d1[0] * e.d2[1] - e.d1[1] * e.d2[0]) / Math.pow(v2, 1.5);
  }
  function maxCurv(segs) {
    var best = 0, at = 0;
    segs.forEach(function (g, i) { for (var j = 0; j <= 40; j++) { var k = Math.abs(kap(evalSeg(g, j / 40))); if (k > best) { best = k; at = i + j / 40; } } });
    return { k: best, u: at };
  }
  function jumps(segs) {   // tugunlarda birinçi va ikkinçi hosila sakraşi (haqiqiy parametr böyiça)
    var j1 = 0, j2 = 0;
    for (var i = 0; i < segs.length - 1; i++) {
      var A = evalSeg(segs[i], 1), B = evalSeg(segs[i + 1], 0);
      j1 = Math.max(j1, Math.hypot(A.d1[0] - B.d1[0], A.d1[1] - B.d1[1]));
      j2 = Math.max(j2, Math.hypot(A.d2[0] - B.d2[0], A.d2[1] - B.d2[1]));
    }
    return { d1: j1, d2: j2 };
  }
  function curvePts(segs, m) {
    var out = [];
    segs.forEach(function (g, i) { for (var j = (i ? 1 : 0); j <= m; j++) out.push(evalSeg(g, j / m).p); });
    return out;
  }
  function fx(v) { var a = Math.abs(v); if (a < 1e-9) return "0"; if (a < 1e-3) return f(v * 1e6, 1) + "·10⁻⁶"; return f(v, 3); }
  function klass(type, par) {
    if (type === "nat") return "C² (P″ uzluksiz)";
    if (type === "kb") return Math.abs(par.C) < 1e-9 ? "C¹ (P″ sakraydi)" : "C⁰ (urinma sakraydi)";
    return "C¹ (P″ sakraydi)";
  }
  LAB._t = LAB._t || {}; LAB._t.l08 = { build: build, evalSeg: evalSeg, kap: kap, natural: natural, jumps: jumps, maxCurv: maxCurv };

  function drawComb(P, segs, scale, color) {
    var c = P.ctx, env = [];
    segs.forEach(function (g) {
      for (var j = 0; j <= 20; j++) {
        var e = evalSeg(g, j / 20), k = kap(e), v = Math.hypot(e.d1[0], e.d1[1]) || 1;
        var nl = [-e.d1[1] / v, e.d1[0] / v], len = Math.min(1.8, Math.abs(k) * scale) * (k >= 0 ? -1 : 1);
        var q = [e.p[0] + nl[0] * len, e.p[1] + nl[1] * len];
        P.line([e.p, q], color, 1, null); env.push(q);
      }
    });
    P.line(env, color, 1.8);
  }

  LAB.start({
    intro: "Spline — nuqtalar ketma-ketligidan ötuvçi silliq egri çiziq. Tur tanlanişiga qarab egri çiziqning <b>silliqlik sinfi</b> (C¹ yoki C²) va <b>egrilik taroği</b> özgaradi: egrilik taroği — har bir nuqtada normal böylab κ ga proporsional çiziqçalar.",
    tabs: [
      {
        name: "Splaynlar va taroq",
        lead: "Nuqtalarni sudrang, spline turini almaştiring va egrilik taroğiga qarang. «Nuqta u» slayderi egri çiziq böylab ketayotgan nuqtada κ ni körsatadi.",
        build: function (L) {
          var st = { type: "nat", chord: false, c: 0.5, T: 0, Cc: 0, B: 0, N: 6, comb: true, scale: 0.4, u: 1.5, tan: false };
          var P = L.plot({ x: [-0.6, 7.1], y: [-0.9, 4.9], aspect: 0.72, equal: true });
          function setPts() { P.handles = DEF.slice(0, st.N).map(function (p, i) { return { p: p.slice(), label: "P" + i, color: C.ink }; }); }
          setPts();
          var R = L.readout([["k", "κ nuqtada"], ["r", "R = 1/κ"], ["m", "κ eng katta"], ["cl", "Silliqlik sinfi"], ["j1", "|ΔP′| tugunda"], ["j2", "|ΔP″| tugunda"]]);
          var segs = [];
          function par() { return { chord: st.chord, c: st.c, T: st.T, C: st.Cc, B: st.B }; }
          function pts() { return P.handles.map(function (h) { return h.p; }); }
          P.onDraw = function (c) {
            var pp = pts(); segs = build(st.type, pp, par());
            var n = segs.length, u = Math.min(st.u, n);
            if (st.comb) drawComb(P, segs, st.scale, "rgba(214,51,108,.75)");
            P.line(pp, C.ink3, 1.2, [6, 5]);
            P.line(curvePts(segs, 30), getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || C.violet, 3.5);
            if (st.tan) segs.forEach(function (g) {
              P.line([g.a, [g.a[0] + g.ta[0] / 3 / g.h, g.a[1] + g.ta[1] / 3 / g.h]], C.orange, 2);
              P.line([g.b, [g.b[0] - g.tb[0] / 3 / g.h, g.b[1] - g.tb[1] / 3 / g.h]], C.z, 2);
            });
            var i = Math.min(n - 1, Math.floor(u)), e = evalSeg(segs[i], u - i), k = kap(e);
            P.dot(e.p, C.ink, 6);
            var mx = maxCurv(segs), jp = jumps(segs);
            R.setMany({ k: f(Math.abs(k), 3), r: Math.abs(k) < 1e-6 ? "∞" : f(1 / Math.abs(k), 2), m: f(mx.k, 3) + " (u = " + f(mx.u, 2) + ")",
              cl: klass(st.type, par()), j1: fx(jp.d1), j2: fx(jp.d2) });
          };
          L.seg("Spline turi", [["nat", "Tabiiy kubik"], ["cr", "Catmull–Rom"], ["card", "Cardinal"], ["kb", "Kochanek–Bartels"]], "nat", function (v) {
            st.type = v; gN.hidden = v !== "nat"; gC.hidden = v !== "card"; gK.hidden = v !== "kb"; P.draw();
          });
          var gN = L.group(function () {
            L.seg("Parametrlaş", [["u", "Tekis (h = 1)"], ["c", "Vatar uzunligi"]], "u", function (v) { st.chord = v === "c"; P.draw(); });
          });
          var gC = L.group(function () {
            L.slider({ label: "Taranglik c", min: -1, max: 1, step: 0.05, value: st.c, nd: 2 }, function (v) { st.c = v; P.draw(); });
          }); gC.hidden = true;
          var gK = L.group(function () {
            L.slider({ label: "Taranglik T", min: -1, max: 1, step: 0.05, value: 0, nd: 2 }, function (v) { st.T = v; P.draw(); });
            L.slider({ label: "Uzluksizlik C", min: -1, max: 1, step: 0.05, value: 0, nd: 2 }, function (v) { st.Cc = v; P.draw(); });
            L.slider({ label: "Yönalişga moyillik B", min: -1, max: 1, step: 0.05, value: 0, nd: 2 }, function (v) { st.B = v; P.draw(); });
          }); gK.hidden = true;
          L.slider({ label: "Nuqtalar soni", min: 5, max: 7, step: 1, value: st.N, nd: 0 }, function (v) {
            var old = pts(); st.N = v; setPts(); P.handles.forEach(function (h, i) { if (old[i]) h.p = old[i]; });
            sU.setRange(0, v - 1); if (st.u > v - 1) sU.set(v - 1, true), st.u = v - 1; P.draw();
          });
          var sU = L.slider({ label: "Nuqta u (0 … n)", min: 0, max: st.N - 1, step: 0.01, value: st.u, nd: 2 }, function (v) { st.u = v; P.draw(); });
          L.toggle("Egrilik taroği", true, function (v) { st.comb = v; P.draw(); });
          L.slider({ label: "Taroq masştabi", min: 0.05, max: 1.5, step: 0.05, value: st.scale, nd: 2 }, function (v) { st.scale = v; P.draw(); });
          L.toggle("Tugundagi urinmalar (çiqayotgan — zarğaldoq, kirayotgan — kök)", false, function (v) { st.tan = v; P.draw(); });
          L.button("Nuqtalarni tiklaş", function () { setPts(); P.draw(); });
          L.note("κ = |x′y″ − y′x″| / (x′² + y′²)<sup>3/2</sup>. Cardinal: m<sub>i</sub> = (1 − c)/2 · (P<sub>i+1</sub> − P<sub>i−1</sub>), c = 0 da Catmull–Rom. Kochanek–Bartels: T = C = B = 0 da yana Catmull–Rom. Tabiiy kubik splayn P″ ni uçlarda 0 deb oladi, ayni vaqtda hamma tugunda C².", "main");
          L.tasks([
            "«Tabiiy kubik»da |ΔP″| ni körin: tugunlarda ≈ 0 (C²). «Catmull–Rom»ga ötsangiz, |ΔP″| nolga teng emasligini tekşiring.",
            "Cardinalda c ni 1 ga yaqinlaştiring: egri çiziq nuqtalar orasida töğri çiziqqa yaqinlaşadimi? c < 0 da nima böladi?",
            "Kochanek–Bartelsda C ni 0 dan özgartiring: silliqlik sinfi C¹ dan C⁰ ga ötadi, tugunda urinma sakraydi (urinmalarni yoqing)."
          ], "a");
        }
      },
      {
        name: "Turlarni taqqoslaş",
        lead: "Bir xil nuqtalardan ötuvçi tört spline bir sahnada. Kök — tabiiy kubik, zarğaldoq — Catmull–Rom, yaşil — Cardinal, puşti punktir — Kochanek–Bartels (T = C = B = 0): u Catmull–Rom bilan ustma-ust tutaşadi.",
        build: function (L) {
          var st = { c: 0.5, comb: false, scale: 0.4 };
          var P = L.plot({ x: [-0.6, 7.1], y: [-0.9, 4.9], aspect: 0.72, equal: true });
          function setPts() { P.handles = DEF.slice(0, 6).map(function (p, i) { return { p: p.slice(), label: "P" + i, color: C.ink }; }); }
          setPts();
          var R = L.readout([["a", "κ eng katta: tabiiy"], ["b", "κ eng katta: Catmull–Rom"], ["c", "κ eng katta: Cardinal"], ["d", "KB(0;0;0) va CR farqi"]]);
          P.onDraw = function () {
            var pp = P.handles.map(function (h) { return h.p; });
            var sN = build("nat", pp, {}), sR = build("cr", pp, {}), sC = build("card", pp, { c: st.c }), sK = build("kb", pp, { T: 0, C: 0, B: 0 });
            if (st.comb) { drawComb(P, sN, st.scale, "rgba(62,99,221,.6)"); drawComb(P, sR, st.scale, "rgba(232,89,12,.6)"); drawComb(P, sC, st.scale, "rgba(47,158,68,.6)"); }
            P.line(pp, C.ink3, 1.2, [6, 5]);
            P.line(curvePts(sN, 30), COL.nat, 3); P.line(curvePts(sR, 30), COL.cr, 3);
            P.line(curvePts(sC, 30), COL.card, 3); P.line(curvePts(sK, 30), COL.kb, 2, [3, 5]);
            var dev = 0, a = curvePts(sR, 30), b = curvePts(sK, 30);
            a.forEach(function (q, i) { dev = Math.max(dev, Math.hypot(q[0] - b[i][0], q[1] - b[i][1])); });
            R.setMany({ a: f(maxCurv(sN).k, 3), b: f(maxCurv(sR).k, 3), c: f(maxCurv(sC).k, 3), d: dev < 1e-12 ? "0" : fx(dev) });
          };
          L.add(EX.el("div", { class: "legend", html: Object.keys(NAMES).map(function (k) { return '<span><i style="background:' + COL[k] + '"></i>' + NAMES[k] + (k === "kb" ? " (0; 0; 0)" : "") + "</span>"; }).join("") }), "main");
          L.slider({ label: "Cardinal taranglik c", min: -1, max: 1, step: 0.05, value: st.c, nd: 2 }, function (v) { st.c = v; P.draw(); });
          L.toggle("Egrilik taroqlari (kök, zarğaldoq, yaşil)", false, function (v) { st.comb = v; P.draw(); });
          L.slider({ label: "Taroq masştabi", min: 0.05, max: 1.5, step: 0.05, value: st.scale, nd: 2 }, function (v) { st.scale = v; P.draw(); });
          L.button("Nuqtalarni tiklaş", function () { setPts(); P.draw(); });
          L.note("Cardinalda c = 0 qöyilsa, yaşil egri zarğaldoq (Catmull–Rom) bilan ustma-ust tutaşadi. Tabiiy kubik splayn <b>global</b>: bitta nuqtani surişda butun egri özgaradi; Catmull–Rom va Cardinal <b>lokal</b> — faqat qöşni bölaklar özgaradi.", "main");
          L.tasks([
            "P<sub>2</sub> nuqtani sudrang: qaysi spline turlarining uzoq bölaklari ham özgaradi? (Javob: tabiiy kubik — butun egri.)",
            "c = 0 qöying: «κ eng katta: Cardinal» va «Catmull–Rom» qiymatlari tenglaşadi. «KB(0;0;0) va CR farqi» nimaga teng?",
            "Taroqlarni yoqing: qaysi egri çiziqda taroq tişlari tugunlarda sakraydi (egrilik uzilişi)?"
          ], "b");
        }
      }
    ]
  });
})();
