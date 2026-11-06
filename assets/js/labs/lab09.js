/* 9-mavzu. B-Spline va tugunlar vektori */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, EX = window.EX;
  var DEF = [[0.3, 0.8], [1.0, 3.4], [2.2, 4.2], [3.2, 1.0], [4.2, 0.6], [5.2, 3.8], [6.2, 3.4], [6.8, 1.0]];
  var BCOL = [C.z, C.x, C.y, C.violet, C.teal, C.gold, C.green, C.ink2];

  function pt(P, p, U, u) {   // C(u) = Σ N(i,p)(u)·P(i)  (qiymat oraliği ichida Σ N = 1)
    var x = 0, y = 0;
    for (var i = 0; i < P.length; i++) { var b = X.basis(i, p, u, U); x += b * P[i][0]; y += b * P[i][1]; }
    return [x, y];
  }
  function knotText(U) {
    var out = [], i = 0;
    while (i < U.length) { var j = i; while (j + 1 < U.length && Math.abs(U[j + 1] - U[i]) < 1e-9) j++; out.push({ v: U[i], k: j - i + 1 }); i = j + 1; }
    return out;
  }
  function openKnots(N, p) { return X.knots(N, p, "open"); }

  function builder(cfg) {
    return function (L) {
      var st = { N: 7, p: cfg.p, mode: cfg.modes[0], man: null, sel: 3, u: 0.5, local: true, knotsOnCurve: true, mj: 0 };
      var P = L.plot({ x: [-0.3, 7.3], y: [-0.4, 5], aspect: 0.7, equal: true });
      function setPts() { P.handles = DEF.slice(0, st.N).map(function (p, i) { return { p: p.slice(), label: "P" + i, color: i === st.sel ? C.orange : C.ink }; }); }
      function colorSel() { P.handles.forEach(function (h, i) { h.color = i === st.sel ? C.orange : C.ink; }); }
      setPts();
      var cv = L.canvas({ aspect: 0.55 });
      function M() { return st.N + st.p; }   // m = n + p + 1,  n = N − 1
      function knots() {
        if (st.mode === "uni") { var U = [], m = M(); for (var i = 0; i <= m; i++) U.push(i / m); return U; }
        if (st.mode === "open") return openKnots(st.N, st.p);
        if (!st.man || st.man.length !== M() + 1) st.man = openKnots(st.N, st.p);
        return st.man;
      }
      function range(U) { return [U[st.p], U[M() - st.p]]; }

      var R = L.readout([["cnt", "Tugunlar soni m + 1"], ["rng", "Haqiqiy oraliq [U_p; U_(m−p)]"], ["sup", "P_i taʼsir oraliği [U_i; U_(i+p+1))"], ["end", "Egri uçlari P uçlaridan"]]);
      var info = L.add(EX.el("div", { class: "note" }), "main");

      function curveParts() {
        var U = knots(), r = range(U), pp = P.handles.map(function (h) { return h.p; }), K = 220, a = r[0], b = r[1], last = U[U.length - 1];
        var pts = [], us = [];
        if (b - a < 1e-9) return { U: U, r: r, pts: [], us: [], pp: pp };
        for (var k = 0; k <= K; k++) { var u = a + (b - a) * k / K; if (k === K && b < last) u = b - 1e-12; pts.push(pt(pp, st.p, U, u)); us.push(a + (b - a) * k / K); }
        return { U: U, r: r, pts: pts, us: us, pp: pp };
      }
      P.onDraw = function () {
        var cp = curveParts(), U = cp.U, r = cp.r, pp = cp.pp, p = st.p, m = M(), accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || C.violet;
        P.line(pp, C.ink3, 1.3, [6, 5]);
        if (cp.pts.length) {
          P.line(cp.pts, accent, 3.5);
          if (st.local) {      // P_i lokal taʼsiri: u ∈ [U_i, U_(i+p+1)) ∩ haqiqiy oraliq
            var lo = Math.max(U[st.sel], r[0]), hi = Math.min(U[st.sel + p + 1], r[1]), seg = [];
            if (hi - lo > 1e-9) cp.us.forEach(function (u, k) { if (u >= lo - 1e-12 && u <= hi + 1e-12) seg.push(cp.pts[k]); });
            if (seg.length > 1) P.line(seg, C.orange, 6.5);
          }
          if (st.knotsOnCurve) knotText(U).forEach(function (kn) {
            if (kn.v < r[0] - 1e-9 || kn.v > r[1] + 1e-9) return;
            var u = kn.v >= U[U.length - 1] ? kn.v : (kn.v >= r[1] - 1e-12 && r[1] < U[U.length - 1] ? kn.v - 1e-12 : kn.v);
            var q = pt(pp, p, U, u), s = P.toS(q), c = P.ctx;
            c.fillStyle = "#fff"; c.strokeStyle = C.ink; c.lineWidth = 1.6; c.fillRect(s[0] - 3.5, s[1] - 3.5, 7, 7); c.strokeRect(s[0] - 3.5, s[1] - 3.5, 7, 7);
          });
          var uu = Math.min(Math.max(st.u, r[0]), r[1]); if (uu >= r[1] && r[1] < U[U.length - 1]) uu = r[1] - 1e-12;
          P.dot(pt(pp, p, U, uu), C.ink, 6, "C(u)");
          var c0 = pt(pp, p, U, r[0]), c1 = pt(pp, p, U, r[1] < U[U.length - 1] ? r[1] - 1e-12 : r[1]);
          var d0 = Math.hypot(c0[0] - pp[0][0], c0[1] - pp[0][1]), d1 = Math.hypot(c1[0] - pp[pp.length - 1][0], c1[1] - pp[pp.length - 1][1]);
          R.set("end", f(d0, 2) + "; " + f(d1, 2) + (d0 < 1e-6 && d1 < 1e-6 ? " (yetadi)" : " (yetmaydi)"));
        } else R.set("end", "—");
        R.set("cnt", (m + 1) + " = " + (st.N - 1) + " + " + p + " + 2");
        R.set("rng", "[" + f(r[0], 3) + "; " + f(r[1], 3) + "]");
        R.set("sup", "P" + st.sel + ": [" + f(U[st.sel], 3) + "; " + f(U[st.sel + p + 1], 3) + ")");
        var kt = knotText(U);
        info.innerHTML = "<b>U</b> = (" + U.map(function (v) { return f(v, 2); }).join("; ") + ")<br>Karraliliklar: " +
          kt.map(function (k) { return f(k.v, 2) + (k.k > 1 ? " (×" + k.k + ")" : ""); }).join(", ") + ". Boşqaruv nuqtalari: n + 1 = " + st.N + ", daraja p = " + p + ".";
      };
      P.onSelect = function (i) { st.sel = i; sSel.set(i, true); colorSel(); P.draw(); cv.redraw(); };
      P.onDrag = function () {};

      cv.draw = function (c, w, h) {
        var U = knots(), r = range(U), p = st.p, pad = 30, W = w - pad - 12, H = h - pad - 18, x0 = pad, y0 = h - pad, last = U[U.length - 1];
        function sx(u) { return x0 + u * W; } function sy(y) { return y0 - y * H; }
        c.fillStyle = "rgba(47,158,68,.10)"; c.fillRect(sx(r[0]), sy(1.05), sx(r[1]) - sx(r[0]), sy(0) - sy(1.05));
        if (st.local) { c.fillStyle = "rgba(232,89,12,.16)"; c.fillRect(sx(U[st.sel]), sy(1.05), sx(U[st.sel + p + 1]) - sx(U[st.sel]), sy(0) - sy(1.05)); }
        c.strokeStyle = "rgba(24,32,47,.12)"; c.lineWidth = 1;
        for (var g = 0; g <= 4; g++) { c.beginPath(); c.moveTo(sx(0), sy(g / 4)); c.lineTo(sx(1), sy(g / 4)); c.stroke(); }
        c.fillStyle = C.ink3; c.font = "12px Inter, system-ui, sans-serif";
        c.fillText("1", 14, sy(1) + 4); c.fillText("0", 14, sy(0) + 4); 
        for (var i = 0; i < st.N; i++) {
          c.beginPath();
          for (var k = 0; k <= 240; k++) { var u = k / 240 * last, y = X.basis(i, p, u === last ? last : u, U); if (k) c.lineTo(sx(u), sy(y)); else c.moveTo(sx(u), sy(y)); }
          c.strokeStyle = BCOL[i % 8]; c.lineWidth = i === st.sel && st.local ? 4 : 1.8; c.globalAlpha = (st.local && i !== st.sel) ? 0.75 : 1; c.stroke(); c.globalAlpha = 1;
        }
        c.strokeStyle = C.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sx(0), y0); c.lineTo(sx(1), y0); c.stroke();
        knotText(U).forEach(function (kn) {
          c.beginPath(); c.moveTo(sx(kn.v), y0 - 4); c.lineTo(sx(kn.v), y0 + 5); c.stroke();
          if (kn.k > 1) { c.fillStyle = C.ink; c.font = "700 11px Inter, system-ui, sans-serif"; c.fillText("×" + kn.k, Math.min(sx(kn.v) - 6, w - 24), y0 + 17); }
        });
        var uu = Math.min(Math.max(st.u, r[0]), r[1]), sum = 0;
        c.strokeStyle = C.ink; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(sx(uu), sy(0)); c.lineTo(sx(uu), sy(1.05)); c.stroke(); c.setLineDash([]);
        var ue = uu >= r[1] && r[1] < last ? r[1] - 1e-12 : uu;
        for (i = 0; i < st.N; i++) { var b = X.basis(i, p, ue, U); sum += b; if (b > 1e-9) { c.beginPath(); c.arc(sx(uu), sy(b), 4, 0, 7); c.fillStyle = BCOL[i % 8]; c.fill(); } }
        c.fillStyle = C.ink; c.font = "600 12px Inter, system-ui, sans-serif";
        c.fillText("u = " + f(uu, 3) + ";  Σ N = " + f(sum, 3), x0 + 6, 14);
      };

      L.add(EX.el("div", { class: "legend", html: '<span><i style="background:rgba(47,158,68,.35)"></i>Haqiqiy oraliq [U<sub>p</sub>; U<sub>m−p</sub>]</span><span><i style="background:rgba(232,89,12,.45)"></i>Tanlangan nuqta taʼsiri</span><span><i style="background:#fff;border:1.5px solid #18202F;box-shadow:0 0 0 1px #AEB6C2"></i>Egri bölaklari çegarasi C(U<sub>j</sub>)</span>' }), "main");

      function refreshU() { var r = range(knots()); sU.setRange(r[0], r[1]); if (st.u < r[0] || st.u > r[1]) { st.u = Math.min(Math.max(st.u, r[0]), r[1]); } sU.set(st.u, true); }
      function interior() { var a = []; for (var j = st.p + 1; j <= M() - st.p - 1; j++) a.push(j); return a; }
      function refreshMan() {
        if (cfg.modes.indexOf("man") < 0) return;
        var js = interior(), sel = selK.el;
        sel.innerHTML = ""; js.forEach(function (j) { var o = EX.el("option", { value: j }, "U" + j); sel.appendChild(o); });
        if (!js.length) { sK.setRange(0, 0); sK.set(0, true); return; }
        if (js.indexOf(st.mj) < 0) st.mj = js[0]; sel.value = st.mj; syncK();
      }
      function syncK() {
        var U = knots(); if (st.mj < st.p + 1 || st.mj > M() - st.p - 1) return;
        sK.setRange(U[st.mj - 1], U[st.mj + 1]); sK.set(U[st.mj], true);
      }
      function all() { refreshU(); refreshMan(); P.draw(); cv.redraw(); }

      if (cfg.modes.length > 1) L.seg("Tugunlar vektori", cfg.modes.map(function (m) { return [m, { uni: "Tekis (oçiq emas)", open: "Oçiq-tekis", man: "Qölda" }[m]]; }), st.mode, function (v) {
        st.mode = v; gM.hidden = v !== "man"; if (v === "man") { st.man = openKnots(st.N, st.p); refreshMan(); } all();
      });
      var sP = L.slider({ label: "Daraja p", min: 1, max: st.N - 1, step: 1, value: st.p, nd: 0 }, function (v) { st.p = v; st.man = null; all(); });
      L.slider({ label: "Nuqtalar soni n + 1", min: 4, max: 8, step: 1, value: st.N, nd: 0 }, function (v) {
        var old = P.handles.map(function (h) { return h.p; }); st.N = v; setPts(); P.handles.forEach(function (h, i) { if (old[i]) h.p = old[i]; });
        sP.setRange(1, v - 1); if (st.p > v - 1) { st.p = v - 1; sP.set(st.p, true); }
        if (st.sel > v - 1) { st.sel = v - 1; } sSel.setRange(0, v - 1); sSel.set(st.sel, true); colorSel(); st.man = null; all();
      });
      var sSel = L.slider({ label: "Tanlangan nuqta i", min: 0, max: st.N - 1, step: 1, value: st.sel, nd: 0 }, function (v) { st.sel = v; colorSel(); P.draw(); cv.redraw(); });
      var sU = L.slider({ label: "Parametr u", min: 0, max: 1, step: 0.001, value: st.u, nd: 3 }, function (v) { st.u = v; P.draw(); cv.redraw(); });
      var selK, sK;
      var gM = L.group(function () {
        selK = L.select("Tugun", ["—"], "—", function (v) { st.mj = Number(v); syncK(); });
        sK = L.slider({ label: "Tugun qiymati", min: 0, max: 1, step: 0.005, value: 0.5, nd: 3 }, function (v) {
          var U = knots(); if (st.mj < st.p + 1) return; U[st.mj] = Math.min(Math.max(v, U[st.mj - 1]), U[st.mj + 1]); P.draw(); cv.redraw(); refreshU();
        });
        L.button("Oldingi tugunga tenglaştir (karralilik ↑)", function () { var U = knots(); if (st.mj >= st.p + 1) { U[st.mj] = U[st.mj - 1]; syncK(); refreshU(); P.draw(); cv.redraw(); } });
        L.button("Oçiq-tekis holatga qaytar", function () { st.man = openKnots(st.N, st.p); syncK(); refreshU(); P.draw(); cv.redraw(); });
      });
      gM.hidden = st.mode !== "man";
      if (st.mode === "man") { st.man = openKnots(st.N, st.p); refreshMan(); }
      L.toggle("Tanlangan nuqtaning lokal taʼsirini ajratiş", true, function (v) { st.local = v; P.draw(); cv.redraw(); });
      L.toggle("Egri bölaklari çegarasini körsatiş", true, function (v) { st.knotsOnCurve = v; P.draw(); });
      L.button("Nuqtalarni tiklaş", function () { var N = st.N; setPts(); colorSel(); P.draw(); });
      L.note(cfg.note, "main");
      L.tasks(cfg.tasks, cfg.key);
      refreshU(); P.draw();
    };
  }

  LAB.start({
    intro: "B-spline egri çiziği C(u) = Σ N<sub>i,p</sub>(u)·P<sub>i</sub> boşqaruv nuqtalari va <b>tugunlar vektori</b> U = (U<sub>0</sub> ≤ … ≤ U<sub>m</sub>) bilan aniqlanadi. Bazis funksiyalar Cox–de Boor rekurrensi bilan hisoblanadi, har biri faqat p + 1 ta tugun oraliğida nolmas.",
    tabs: [
      {
        name: "Daraja va tugunlar turi",
        lead: "Nuqtalarni sudrang, p ni özgartiring va tugunlar vektori turini almaştiring. Pastdagi grafikda hamma N<sub>i,p</sub>(u); yaşil soha — egri çizilayotgan oraliq.",
        build: builder({
          modes: ["open", "uni"], key: "a", p: 2,
          note: "m + 1 = n + p + 2 ta tugun (n + 1 — boşqaruv nuqtalari soni). Egri faqat u ∈ [U<sub>p</sub>; U<sub>m−p</sub>] da aniqlanadi (Σ N<sub>i,p</sub> = 1). <b>Oçiq-tekis</b> vektorda boşida va oxirida tugun p + 1 marta takrorlanadi — egri P<sub>0</sub> va P<sub>n</sub> dan ötadi. <b>Tekis (oçiq emas)</b> vektorda uçlar çetda qoladi.",
          tasks: [
            "Oçiq-tekis tugunlarda p = 2, i = 3 da zarğaldoq bölak qançaga çöziladi? (Javob: p + 1 = 3 ta tugun oraliğiga.) p = 3 da-çi?",
            "«Tekis (oçiq emas)»ga ötib «Egri uçlari»ni körin: egri P₀ va oxirgi nuqtadan qançalik uzoqda? Nega?",
            "p = 1 va p = n ni solişitiring: p = 1 da egri nima? p = n va oçiq-tekis vektorda egri qaysi egri çiziq bilan ustma-ust tutaşadi? (Bezier.)"
          ]
        })
      },
      {
        name: "Tugunlarni qölda özgartiriş",
        lead: "Içki tugunlardan birini tanlang va slayder bilan suring (tartib özgarmaydi: U<sub>j−1</sub> ≤ U<sub>j</sub> ≤ U<sub>j+1</sub>). Karralilik oşsa, egri öşa joyda silliqligini yöqotadi.",
        build: builder({
          modes: ["man"], key: "b", p: 3,
          note: "Içki tugun karraliği k bölsa, egri tugunda C<sup>p−k</sup> silliq. k = p da egri tugunda C⁰ (burçak), k = p + 1 da — uzilişi mumkin. Tugunlar vektorining qiymatlari — [0; 1] oraliğida, <b>tartibi özgarmasligi</b> şart.",
          tasks: [
            "p = 3 da bitta içki tugunni «Oldingi tugunga tenglaştir» tugmasi bilan 2 karrali qiling: egri öşa tugunda neçançi tartibgaçha silliq? (C² dan C¹ ga.)",
            "Içki tugunni uç tomon surib, bazis funksiyalar grafigida N<sub>i,p</sub> ning tayanç oraliği qanday özgarişini kuzating.",
            "p = 2 da içki tugunni ikki marta takrorlang (karralilik 2 = p): egri qaysi nuqta yaqinida burçak hosil qiladi?"
          ]
        })
      }
    ]
  });
})();
