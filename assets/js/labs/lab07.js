/* 7-mavzu. Bezier va de Casteljau */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt;
  var DEF = {
    1: [[0, 1], [6, 3]],
    2: [[0, 0.5], [3, 4.5], [6, 0.5]],
    3: [[0, 0.5], [1.5, 4], [4.5, 4], [6, 0.5]],
    4: [[0, 0.5], [1, 4], [3, -0.5], [5, 4], [6, 0.5]],
    5: [[0, 0.5], [1, 3.5], [2, 4.5], [4, -0.5], [5, 3.5], [6, 1]]
  };
  var LEVEL = [C.ink3, C.z, C.y, C.violet, C.orange, C.pink];
  var BCOL = [C.z, C.x, C.y, C.violet, C.orange, C.teal];
  function levels(P, t) {
    var L = [P.map(function (p) { return p.slice(); })];
    while (L[L.length - 1].length > 1) {
      var prev = L[L.length - 1], nx = [];
      for (var i = 0; i < prev.length - 1; i++) nx.push([(1 - t) * prev[i][0] + t * prev[i + 1][0], (1 - t) * prev[i][1] + t * prev[i + 1][1]]);
      L.push(nx);
    }
    return L;
  }
  function hull(pts) {
    var p = pts.map(function (q) { return q.slice(); }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    if (p.length < 3) return p;
    function cr(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  function pstr(p) { return "(" + f(p[0], 2) + "; " + f(p[1], 2) + ")"; }

  LAB.start({
    intro: "Bezier egri çiziği boşqaruv nuqtalari bilan beriladi: egri birinçi va oxirgi nuqtadan ötadi, oraliq nuqtalar esa uni özi tomon «tortadi». Har bir nuqta de Casteljau algoritmida ketma-ket çiziqli interpolyatsiya bilan topiladi.",
    tabs: [
      {
        name: "De Casteljau qurilişi",
        lead: "Boşqaruv nuqtalarini sudrang va t slayderini harakatlantiring. Har bir bosqiçda qöşni nuqtalar orasida t nisbatda yangi nuqta olinadi; oxirgi nuqta — B(t).",
        build: function (L) {
          var st = { n: 3, t: 0.5, cons: true, tan: true, hull: false, split: false };
          var P = L.plot({ x: [-0.5, 6.5], y: [-1, 5], aspect: 0.72 });
          function setPts() { P.handles = DEF[st.n].map(function (p, i) { return { p: p.slice(), label: "P" + i, color: C.ink }; }); }
          setPts();
          var R = L.readout([["b", "B(t)"], ["d", "B′(t) — urinma vektori"], ["l", "|B′(t)|"]]);
          P.onDraw = function (c) {
            var pts = P.handles.map(function (h) { return h.p; }), n = pts.length - 1, i, k;
            if (st.hull) {
              var H = hull(pts);
              c.beginPath(); H.forEach(function (q, j) { var s = P.toS(q); if (j) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); }); c.closePath();
              c.fillStyle = "rgba(142,78,198,.10)"; c.fill(); c.strokeStyle = "rgba(142,78,198,.45)"; c.lineWidth = 1.5; c.stroke();
            }
            P.line(pts, C.ink3, 1.5, [6, 5]);
            var curve = []; for (k = 0; k <= 160; k++) curve.push(X.bezier(pts, k / 160));
            var Lv = levels(pts, st.t);
            if (st.split && n >= 1) {
              var left = Lv.map(function (lv) { return lv[0]; }), right = Lv.map(function (lv) { return lv[lv.length - 1]; }).reverse();
              var cl = [], cr = []; for (k = 0; k <= 80; k++) { cl.push(X.bezier(left, k / 80)); cr.push(X.bezier(right, k / 80)); }
              P.line(cl, C.z, 5); P.line(cr, C.x, 5);
              P.line(left, C.z, 1.5, [3, 3]); P.line(right, C.x, 1.5, [3, 3]);
              left.forEach(function (q) { P.dot(q, C.z, 3.5); }); right.forEach(function (q) { P.dot(q, C.x, 3.5); });
            } else P.line(curve, getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || C.violet, 4);
            if (st.cons) for (i = 1; i < Lv.length - 1; i++) { P.line(Lv[i], LEVEL[i % LEVEL.length], 1.8); Lv[i].forEach(function (q) { P.dot(q, LEVEL[i % LEVEL.length], 3.5); }); }
            var B = Lv[Lv.length - 1][0];
            var D = n >= 1 ? [n * (Lv[n - 1][1][0] - Lv[n - 1][0][0]), n * (Lv[n - 1][1][1] - Lv[n - 1][0][1])] : [0, 0];
            if (st.tan && n >= 1) {
              var s = 0.25;
              P.line([[B[0] - D[0] * s, B[1] - D[1] * s], [B[0] + D[0] * s, B[1] + D[1] * s]], C.orange, 2.5);
            }
            P.dot(B, C.ink, 6, "B(t)");
            R.set("b", pstr(B)); R.set("d", pstr(D)); R.set("l", f(Math.hypot(D[0], D[1]), 2));
          };
          L.slider({ label: "Daraja n", min: 1, max: 5, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; setPts(); P.draw(); });
          L.slider({ label: "Parametr t", min: 0, max: 1, step: 0.01, value: st.t, nd: 2 }, function (v) { st.t = v; P.draw(); });
          L.toggle("De Casteljau bosqiçlari", true, function (v) { st.cons = v; P.draw(); });
          L.toggle("Urinma (B′(t) yönalişi)", true, function (v) { st.tan = v; P.draw(); });
          L.toggle("Qavariq qobiq", false, function (v) { st.hull = v; P.draw(); });
          L.toggle("t nuqtada ikkiga böliş", false, function (v) { st.split = v; P.draw(); });
          L.button("Nuqtalarni tiklaş", function () { setPts(); P.draw(); });
          L.note("B′(t) = n·(P<sub>1</sub><sup>(n−1)</sup> − P<sub>0</sub><sup>(n−1)</sup>): urinma de Casteljauning oxirgidan oldingi bosqiçidagi ikki nuqta orqali ötadi.", "main");
          L.tasks([
            "n = 3 da t = 0 va t = 1 qiymatlarida B(t) qayerda turadi? Urinma qaysi kesma böylab yönalgan?",
            "«Qavariq qobiq»ni yoqing va nuqtalarni istalgança suring: egri qobiqdan taşqariga çiqa oladimi?",
            "«Ikkiga böliş»ni yoqing: kök va qizil boşqaruv çiziqlari de Casteljau uçburçagining qaysi tomonlaridan olinmoqda?"
          ], "a");
        }
      },
      {
        name: "Bernstein vaznlari",
        lead: "B(t) = Σ B<sub>i,n</sub>(t)·P<sub>i</sub>. Har bir boşqaruv nuqtasining taʼsiri Bernstein köphadi bilan aniqlanadi; istalgan t da vaznlar yiğindisi 1 ga teng.",
        build: function (L) {
          var st = { n: 3, t: 0.3 };
          var cv = L.canvas({ aspect: 0.6 });
          var R = L.readout([["s", "Vaznlar yiğindisi"], ["m", "Eng katta vazn"]]);
          var list = L.add(EX.el("div", { class: "legend" }), "main");
          cv.draw = function (c, w, h) {
            var pad = 34, W = w - pad - 14, H = h - pad - 16, x0 = pad, y0 = h - pad;
            function sx(t) { return x0 + t * W; } function sy(y) { return y0 - y * H; }
            c.strokeStyle = "rgba(24,32,47,.12)"; c.lineWidth = 1;
            for (var g = 0; g <= 10; g++) { c.beginPath(); c.moveTo(sx(g / 10), sy(0)); c.lineTo(sx(g / 10), sy(1)); c.stroke(); }
            for (g = 0; g <= 4; g++) { c.beginPath(); c.moveTo(sx(0), sy(g / 4)); c.lineTo(sx(1), sy(g / 4)); c.stroke(); }
            c.fillStyle = C.ink3; c.font = "12px Inter, system-ui, sans-serif";
            c.fillText("0", sx(0) - 4, y0 + 16); c.fillText("1", sx(1) - 4, y0 + 16); c.fillText("t", sx(0.5) - 3, y0 + 16);
            c.fillText("1", 14, sy(1) + 4); c.fillText("0,5", 6, sy(0.5) + 4);
            for (var i = 0; i <= st.n; i++) {
              c.beginPath();
              for (var k = 0; k <= 120; k++) { var t = k / 120, y = X.bernstein(st.n, i, t); if (k) c.lineTo(sx(t), sy(y)); else c.moveTo(sx(t), sy(y)); }
              c.strokeStyle = BCOL[i]; c.lineWidth = 2.5; c.stroke();
            }
            c.strokeStyle = C.ink; c.lineWidth = 1.5; c.setLineDash([5, 4]);
            c.beginPath(); c.moveTo(sx(st.t), sy(0)); c.lineTo(sx(st.t), sy(1.02)); c.stroke(); c.setLineDash([]);
            var sum = 0, best = 0, bi = 0, txt = [];
            for (i = 0; i <= st.n; i++) {
              var b = X.bernstein(st.n, i, st.t); sum += b; if (b > best) { best = b; bi = i; }
              c.beginPath(); c.arc(sx(st.t), sy(b), 5, 0, 7); c.fillStyle = BCOL[i]; c.fill();
              txt.push('<span><i style="background:' + BCOL[i] + '"></i>B<sub>' + i + "," + st.n + "</sub>(" + f(st.t, 2) + ") = " + f(b, 3) + "</span>");
            }
            list.innerHTML = txt.join("");
            R.set("s", f(sum, 3)); R.set("m", "P" + bi + ": " + f(best, 3));
          };
          L.slider({ label: "Daraja n", min: 1, max: 5, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; cv.redraw(); });
          L.slider({ label: "Parametr t", min: 0, max: 1, step: 0.01, value: st.t, nd: 2 }, function (v) { st.t = v; cv.redraw(); });
          L.note("B<sub>i,n</sub>(t) = C<sub>n</sub><sup>i</sup>·t<sup>i</sup>·(1 − t)<sup>n−i</sup>. Masalan, n = 3 va t = 0,5 da vaznlar 0,125; 0,375; 0,375; 0,125.");
          L.tasks([
            "n = 3, t = 0,5 ni örnating va vaznlarni yuqoridagi izohdagi qiymatlar bilan solişitiring.",
            "Qaysi t da B<sub>1,3</sub>(t) eng katta böladi? (Javob: t = 1/3.)",
            "Daraja oşgan sari örta vaznlar qanday özgaradi? Bu egrining boşqaruv nuqtalariga «yopişişi»ga qanday taʼsir qiladi?"
          ], "b");
        }
      }
    ]
  });
})();
