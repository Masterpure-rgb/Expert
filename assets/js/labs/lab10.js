/* 10-mavzu. NURBS vaznlari */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, EX = window.EX, V = X.v;
  var DEF = [[0.4, 0.9], [1.2, 3.6], [2.8, 4.0], [3.9, 1.0], [5.2, 3.2], [6.3, 1.2]];
  var S2 = Math.SQRT1_2;
  var CIRC_P = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]];
  var CIRC_U = [0, 0, 0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1, 1, 1];
  function circW(wc) { return [1, wc, 1, wc, 1, wc, 1, wc, 1]; }

  function sampleCurve(P, W, p, U, K) {
    var out = [], us = [];
    for (var k = 0; k <= K; k++) { var u = k / K; out.push(X.nurbs(P, W, p, U, u)); us.push(u); }
    return out;
  }
  function minDist(curve, q) { var d = 1e9; curve.forEach(function (c) { d = Math.min(d, Math.hypot(c[0] - q[0], c[1] - q[1])); }); return d; }
  function radialErr(P, W, p, U, K) {
    var e = 0;
    for (var k = 0; k <= K; k++) { var c = X.nurbs(P, W, p, U, k / K); e = Math.max(e, Math.abs(Math.hypot(c[0], c[1]) - 1)); }
    return e;
  }
  var SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  function sci(v) {
    if (v < 1e-17) return "0";
    if (v >= 1e-3) return f(v, 4);
    var s = v.toExponential(1).split("e"), ex = String(parseInt(s[1], 10)).split("").map(function (ch) { return SUP[ch]; }).join("");
    return s[0].replace(".", ",") + "·10" + ex;
  }
  LAB._t = LAB._t || {}; LAB._t.l10 = { radialErr: radialErr, CIRC_P: CIRC_P, CIRC_U: CIRC_U, circW: circW };

  function accent() { return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || C.violet; }

  LAB.start({
    intro: "NURBS (Non-Uniform Rational B-Spline) — B-splineʼning ratsional varianti: har bir boşqaruv nuqtasiga <b>vazn</b> w<sub>i</sub> beriladi, C(u) = Σ N<sub>i,p</sub>(u)·w<sub>i</sub>·P<sub>i</sub> / Σ N<sub>i,p</sub>(u)·w<sub>i</sub>. Vazn oşsa, egri çiziq şu nuqtaga «tortiladi»; w = 0 da nuqtaning taʼsiri yöqoladi. Ratsional egri çiziqlar aylana va konus kesimlarini <b>aniq</b> tasvirlaydi.",
    tabs: [
      {
        name: "Vazn slayderi",
        lead: "Egri çiziq nuqtalarini sudrang yoki nuqtani tanlang va vaznini özgartiring. Punktir — barça vazn 1 bölgan (oddiy B-spline) egri çiziq.",
        build: function (L) {
          var st = { sel: 2, W: [1, 1, 1, 1, 1, 1] }, p = 3, U = X.knots(6, p, "open");
          var P = L.plot({ x: [-0.3, 6.9], y: [-0.4, 4.8], aspect: 0.7 });
          function setPts() { P.handles = DEF.map(function (q, i) { return { p: q.slice(), label: "", color: i === st.sel ? C.orange : C.ink }; }); }
          setPts();
          var R = L.readout([["w", "Tanlangan vazn w"], ["d", "Egri çiziqdan masofa"], ["d1", "w = 1 da masofa"], ["den", "Σ N·w (u = 0,5)"]]);
          P.onDraw = function () {
            var pp = P.handles.map(function (h) { return h.p; });
            P.line(pp, C.ink3, 1.2, [6, 5]);
            var ref = sampleCurve(pp, null, p, U, 160), cur = sampleCurve(pp, st.W, p, U, 160);
            P.line(ref, C.ink3, 2, [4, 5]);
            P.line(cur, accent(), 4);
            P.handles.forEach(function (h, i) { h.r = 6 + 2.2 * Math.sqrt(st.W[i]); h.color = i === st.sel ? C.orange : C.ink; h.label = "P" + i + (i === st.sel || st.W[i] !== 1 ? " (w=" + f(st.W[i], 1) + ")" : ""); });
            var den = 0; for (var i = 0; i < pp.length; i++) den += X.basis(i, p, 0.5, U) * st.W[i];
            R.setMany({ w: f(st.W[st.sel], 1), d: f(minDist(cur, pp[st.sel]), 3), d1: f(minDist(ref, pp[st.sel]), 3), den: f(den, 3) });
          };
          P.onSelect = function (i) { st.sel = i; sI.set(i, true); sW.set(st.W[i], true); P.draw(); };
          var sI = L.slider({ label: "Tanlangan nuqta i", min: 0, max: 5, step: 1, value: st.sel, nd: 0 }, function (v) { st.sel = v; sW.set(st.W[v], true); P.draw(); });
          var sW = L.slider({ label: "Vazn w", min: 0, max: 10, step: 0.1, value: 1, nd: 1 }, function (v) { st.W[st.sel] = v; P.draw(); });
          L.row();
          L.button("Vaznlarni 1 ga qaytar", function () { st.W = [1, 1, 1, 1, 1, 1]; sW.set(1, true); P.draw(); });
          L.button("Nuqtalarni tiklaş", function () { setPts(); P.draw(); });
          L.note("Daraja p = 3, 6 ta nuqta, oçiq-tekis tugunlar. R<sub>i</sub>(u) = N<sub>i,p</sub>w<sub>i</sub> / Σ N<sub>j,p</sub>w<sub>j</sub> — ratsional bazis; C(u) = Σ R<sub>i</sub>(u)·P<sub>i</sub>. w<sub>i</sub> > 1 da egri P<sub>i</sub> ga yaqinlaşadi, w<sub>i</sub> < 1 da uzoqlaşadi, w<sub>i</sub> = 0 da P<sub>i</sub> egriga taʼsir qilmaydi.", "main");
          L.tasks([
            "P<sub>2</sub> uçun w ni 0 → 1 → 10 qiling va «Egri çiziqdan masofa»ni yozing: qançaga kamayadi? (w = 10 da masofa deyarli 0.)",
            "w = 0 qöying va nuqtani sudrang: egri çiziq özgaradimi? Nega?",
            "Ikki qöşni nuqtaga (P<sub>2</sub>, P<sub>3</sub>) w = 5 bering: egri ikkala nuqtaga yaqinlaşadi."
          ], "a");
        }
      },
      {
        name: "Vaznlar taqqosi",
        lead: "Bitta nuqta uçun vazn 0,3 / 1 / 2 / 5 bölganda tört egri çiziq bir sahnada. Vazn qançalik katta bölsa, egri nuqtaga şunçalik yaqin.",
        build: function (L) {
          var st = { sel: 2 }, p = 3, U = X.knots(6, p, "open"), WS = [0.3, 1, 2, 5], WC = [C.z, C.ink, C.green, C.orange];
          var P = L.plot({ x: [-0.3, 6.9], y: [-0.4, 4.8], aspect: 0.7 });
          function setPts() { P.handles = DEF.map(function (q, i) { return { p: q.slice(), label: "P" + i, color: i === st.sel ? C.pink : C.ink3 }; }); }
          setPts();
          var R = L.readout(WS.map(function (w, i) { return ["d" + i, "Masofa, w = " + f(w, 1)]; }));
          P.onDraw = function () {
            var pp = P.handles.map(function (h) { return h.p; }), o = {};
            P.line(pp, C.ink3, 1.2, [6, 5]);
            WS.forEach(function (w, k) {
              var W = pp.map(function (_, i) { return i === st.sel ? w : 1; }), cur = sampleCurve(pp, W, p, U, 160);
              P.line(cur, WC[k], k === 1 ? 3.5 : 2.6); o["d" + k] = f(minDist(cur, pp[st.sel]), 3);
            });
            P.handles.forEach(function (h, i) { h.color = i === st.sel ? C.pink : C.ink3; h.r = i === st.sel ? 9 : 7; });
            R.setMany(o);
          };
          P.onSelect = function (i) { st.sel = i; sI.set(i, true); P.draw(); };
          L.add(EX.el("div", { class: "legend", html: WS.map(function (w, k) { return '<span><i style="background:' + WC[k] + '"></i>w = ' + f(w, 1) + "</span>"; }).join("") }), "main");
          var sI = L.slider({ label: "Tanlangan nuqta i", min: 0, max: 5, step: 1, value: st.sel, nd: 0 }, function (v) { st.sel = v; P.draw(); });
          L.button("Nuqtalarni tiklaş", function () { setPts(); P.draw(); });
          L.note("Tanlangan P<sub>i</sub> ning vazni özgaradi, qolgan vaznlar 1. Masofa — P<sub>i</sub> dan egri çiziqqaçha eng qisqa masofa (egri çiziq 160 nuqtada tekşirildi).", "main");
          L.tasks([
            "Masofalarni solişitiring: w = 0,3 → 1 → 2 → 5 da qanday özgaradi? (Monoton kamayadi.)",
            "P<sub>0</sub> yoki P<sub>5</sub> (uç nuqtalar) ni tanlang: vaznning özgarişi egrining uçiga taʼsir qiladimi? (Yöq — oçiq-tekis egri uçlardan ötadi.)",
            "P<sub>2</sub> ni sudrang: w = 5 egri çiziq nuqta ketidan qançalik yaqin boradi, w = 0,3 niki-çi?"
          ], "b");
        }
      },
      {
        name: "Aniq aylana (9 nuqta)",
        lead: "Kvadratning 4 uçi va 4 yon nuqtasi + yopuvçi nuqta: 9 boşqaruv nuqtasi, p = 2. Qöşiq vazn burçaklarda √2/2 bölsa — egri çiziq <b>aniq</b> aylana; hamma vazn 1 bölsa — köphadli yaqinlaştiriş.",
        build: function (L) {
          var st = { wc: 0.9 }, p = 2, U = CIRC_U;
          var P = L.plot({ x: [-1.9, 1.9], y: [-1.5, 1.5], aspect: 0.8, hint: "Aylana va ikki egri çiziq — vazn slayderi bilan özgartiring" });
          P.handles = CIRC_P.map(function (q, i) { return { p: q.slice(), label: i === 8 ? "" : "P" + i, color: C.ink, fixed: true, r: 5 }; });
          var R = L.readout([["e1", "Xato: aniq (w = √2/2)"], ["e2", "Xato: köphadli (w = 1)"], ["e3", "Xato: qöldan"], ["w3", "Burçak vazni"]]);
          P.onDraw = function (c) {
            var ctrl = CIRC_P;
            P.line(ctrl, C.ink3, 1.2, [6, 5]);
            var circ = []; for (var k = 0; k <= 200; k++) circ.push([Math.cos(2 * Math.PI * k / 200), Math.sin(2 * Math.PI * k / 200)]);
            P.line(circ, "rgba(24,32,47,.35)", 1.2);
            var ex = sampleCurve(ctrl, circW(S2), p, U, 240), po = sampleCurve(ctrl, null, p, U, 240), cu = sampleCurve(ctrl, circW(st.wc), p, U, 240);
            P.line(po, C.orange, 3, [6, 4]); P.line(cu, C.green, 2.5, [2, 3]); P.line(ex, accent(), 3);
            var e1 = radialErr(ctrl, circW(S2), p, U, 4000), e2 = radialErr(ctrl, null, p, U, 4000), e3 = radialErr(ctrl, circW(st.wc), p, U, 4000);
            R.setMany({ e1: sci(e1), e2: sci(e2), e3: sci(e3), w3: f(st.wc, Math.abs(st.wc - S2) < 1e-12 ? 4 : 2) });
          };
          L.add(EX.el("div", { class: "legend", html: '<span><i style="background:' + C.violet + '"></i>Aniq NURBS (w = √2/2 ≈ 0,7071)</span><span><i style="background:' + C.orange + '"></i>Köphadli (w = 1)</span><span><i style="background:' + C.green + '"></i>Qöldan vazn (punktir)</span><span><i style="background:rgba(24,32,47,.4)"></i>Birlik aylana</span>' }), "main");
          var sw = L.slider({ label: "Burçak nuqtalari vazni w", min: 0.3, max: 1.5, step: 0.01, value: st.wc, nd: 2 }, function (v) { st.wc = v; P.draw(); });
          L.button("w = √2/2 qöyiş", function () { st.wc = S2; sw.set(0.71, true); P.draw(); });
          L.note("Knot vektori U = (0, 0, 0, ¼, ¼, ½, ½, ¾, ¾, 1, 1, 1), vaznlar (1, √2/2, 1, √2/2, 1, √2/2, 1, √2/2, 1). «Xato» — max | ‖C(u)‖ − 1 | (4000 nuqtada). Aniq vaznda xato ~ 10⁻¹⁶ (suzuvçi nuqta yaxlitlaşi), köphadli egri çiziqda ≈ 0,0607 (burçak yönalişida ‖C‖ = 3√2/4 ≈ 1,0607).", "main");
          L.tasks([
            "«Xato: aniq» va «Xato: köphadli» qiymatlarini solişitiring: qançaga farq qiladi? (≈ 10⁻¹⁶ va ≈ 0,06.)",
            "Burçak vaznini 0,60 va 1,00 ga qöying: qaysi holda egri çiziq aylanadan taşqariga çiqadi? (w > √2/2 da taşqariga, w < √2/2 da içkariga.)",
            "Nega qöşiq (burçak) nuqtalar vazni aynan √2/2 = cos 45°? (9 nuqta: har bir yoy 90° ni qamraydi, cos(90°/2) = √2/2.)"
          ], "c");
        }
      },
      {
        name: "Gomogen koordinatalar",
        lead: "NURBS — 3D <b>köphadli</b> egri çiziqning w = 1 tekislikka markaziy proyeksiyasi. Sahnada: (wx, wy, w) nuqtalar, ularning köphadli egrisi (zarğaldoq) va proyeksiyasi — aylana (kök).",
        build: function (L) {
          var st = { u: 0.15 }, p = 2, U = CIRC_U, W = circW(S2);
          var HP = CIRC_P.map(function (q, i) { return [W[i] * q[0], W[i] * q[1], W[i]]; });
          var S = L.scene({ dist: 4.6, yaw: -0.8, pitch: 0.5, target: [0, 0, 0.55], aspect: 0.85, gridOpts: { n: 6, step: 0.5 }, axesOpts: { len: 1.8, labels: ["x", "y", "w"] } });
          var hom = [], flat = [], rays = [], k;
          for (k = 0; k <= 120; k++) { var u = k / 120, q = [0, 0, 0]; for (var i = 0; i < 9; i++) { var b = X.basis(i, p, u, U); q = V.add(q, V.mul(HP[i], b)); } hom.push(q); flat.push([q[0] / q[2], q[1] / q[2], 1]); }
          var plane = [[-1.4, -1.4, 1], [1.4, -1.4, 1], [1.4, 1.4, 1], [-1.4, 1.4, 1]];
          S.add(new X.Line({ pts: plane, color: "rgba(24,32,47,.35)", lw: 1.2, closed: true }));
          for (k = 0; k < 24; k++) S.add(new X.Line({ pts: [[0, 0, 0], flat[Math.round(k / 24 * 120)]], color: "rgba(24,32,47,.13)", lw: 1 }));
          S.add(new X.Line({ pts: flat, color: C.z, lw: 3 }));
          S.add(new X.Line({ pts: hom, color: C.orange, lw: 3 }));
          S.add(new X.Points({ pts: HP, color: C.ink, r: 3.5, labels: CIRC_P.map(function (_, i) { return i === 8 ? "" : "P" + i; }) }));
          var dyn = S.add({ visible: true, collect: function (SS, out) {
            var u2 = st.u, q = [0, 0, 0]; for (var i = 0; i < 9; i++) { q = V.add(q, V.mul(HP[i], X.basis(i, p, u2, U))); }
            var fl = [q[0] / q[2], q[1] / q[2], 1], items = [new X.Line({ pts: [[0, 0, 0], fl], color: C.pink, lw: 2.5, front: true }), new X.Points({ pts: [q], color: C.orange, r: 6, front: true }), new X.Points({ pts: [fl], color: C.pink, r: 6, front: true })];
            items.forEach(function (it) { it.collect(SS, out); });
            R.setMany({ w: f(q[2], 4), c: "(" + f(fl[0], 4) + "; " + f(fl[1], 4) + ")", n: f(Math.hypot(fl[0], fl[1]), 6) });
          } });
          var R = L.readout([["w", "w(u) = Σ N·w"], ["c", "C(u) = (x; y)"], ["n", "‖C(u)‖"]]);
          L.slider({ label: "Parametr u", min: 0, max: 0.999, step: 0.001, value: st.u, nd: 3 }, function (v) { st.u = v; S.draw(); });
          L.add(EX.el("div", { class: "legend", html: '<span><i style="background:' + C.orange + '"></i>C<sup>w</sup>(u) — 3D köphadli egri</span><span><i style="background:' + C.z + '"></i>C(u) — w = 1 tekislikdagi aylana</span><span><i style="background:' + C.pink + '"></i>Markazdan proyeksiya nuri</span>' }), "main");
          L.note("P<sub>i</sub><sup>w</sup> = (w<sub>i</sub>x<sub>i</sub>, w<sub>i</sub>y<sub>i</sub>, w<sub>i</sub>). C<sup>w</sup>(u) = Σ N<sub>i,p</sub>(u)·P<sub>i</sub><sup>w</sup> — oddiy köphadli B-spline. Proyeksiya: C(u) = (X/W, Y/W) — bu ratsional formulaning özi. Aylana uçun C<sup>w</sup> konus x² + y² = w² da yotadi.", "main");
          L.tasks([
            "u slayderini suring: ‖C(u)‖ doim 1 ga tengmi? (Ha — nur w = 1 tekislikda aylanani beradi.)",
            "Sahnani aylantiring: zarğaldoq egri çiziq qaysi sirtda yotadi? (x² + y² = w² konusida.)",
            "w(u) ning eng kiçik qiymatini toping. (u = 0,125 da w = (2 + √2)/4 ≈ 0,854.)"
          ], "d");
        }
      }
    ]
  });
})();
