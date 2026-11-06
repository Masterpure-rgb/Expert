/* 12-mavzu. Egrilik laboratoriyasi */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, EX = window.EX, V = X.v;
  var PI = Math.PI;
  var DEF = [[0.4, 1.0], [1.6, 4.2], [4.6, -0.4], [5.9, 3.2]];

  /* ---------- kubik Bezier: hosilalar va egrilik ---------- */
  function d1(P, t) {
    var a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    return [0, 1].map(function (k) { return 3 * (a * (P[1][k] - P[0][k]) + b * (P[2][k] - P[1][k]) + c * (P[3][k] - P[2][k])); });
  }
  function d2(P, t) {
    return [0, 1].map(function (k) { return 6 * ((1 - t) * (P[2][k] - 2 * P[1][k] + P[0][k]) + t * (P[3][k] - 2 * P[2][k] + P[1][k])); });
  }
  function kapS(P, t) {   // işorali egrilik κ = (x′y″ − y′x″) / |r′|³
    var a = d1(P, t), b = d2(P, t), v = Math.hypot(a[0], a[1]);
    return v < 1e-9 ? 0 : (a[0] * b[1] - a[1] * b[0]) / (v * v * v);
  }
  /* ---------- sirtlar va Gauss egriligi ---------- */
  var SURF = {
    sphere: { name: "Sfera", closeU: true, closeV: false,
      fn: function (p, u, v) { var th = 2 * PI * u, ph = PI * v; return [p.R * Math.sin(ph) * Math.cos(th), p.R * Math.sin(ph) * Math.sin(th), p.R * Math.cos(ph)]; },
      K: function (p) { return 1 / (p.R * p.R); } },
    cyl: { name: "Silindr", closeU: true, closeV: false,
      fn: function (p, u, v) { var th = 2 * PI * u; return [p.R * Math.cos(th), p.R * Math.sin(th), -1.2 + 2.4 * v]; },
      K: function () { return 0; } },
    saddle: { name: "Egar z = x² − y²", closeU: false, closeV: false,
      fn: function (p, u, v) { var x = -1 + 2 * u, y = -1 + 2 * v; return [x, y, x * x - y * y]; },
      K: function (p, u, v) { var x = -1 + 2 * u, y = -1 + 2 * v, q = 1 + 4 * x * x + 4 * y * y; return -4 / (q * q); } },
    torus: { name: "Tor", closeU: true, closeV: true,
      fn: function (p, u, v) { var th = 2 * PI * u, w = 2 * PI * v; return [(p.R + p.r * Math.cos(w)) * Math.cos(th), (p.R + p.r * Math.cos(w)) * Math.sin(th), p.r * Math.sin(w)]; },
      K: function (p, u, v) { var w = 2 * PI * v; return Math.cos(w) / (p.r * (p.R + p.r * Math.cos(w))); } }
  };
  // sonli Gauss egriligi: K = (LN − M²)/(EG − F²), chekli ayirmalar bilan
  function numK(g, u, v) {
    var h = 1e-3;
    function at(du, dv) { return g(u + du, v + dv); }
    var ru = V.mul(V.sub(at(h, 0), at(-h, 0)), 1 / (2 * h)), rv = V.mul(V.sub(at(0, h), at(0, -h)), 1 / (2 * h));
    var c = at(0, 0);
    var ruu = V.mul(V.add(V.sub(at(h, 0), V.mul(c, 2)), at(-h, 0)), 1 / (h * h)), rvv = V.mul(V.add(V.sub(at(0, h), V.mul(c, 2)), at(0, -h)), 1 / (h * h));
    var ruv = V.mul(V.sub(V.add(at(h, h), at(-h, -h)), V.add(at(h, -h), at(-h, h))), 1 / (4 * h * h));
    var n = V.norm(V.cross(ru, rv)), E = V.dot(ru, ru), F = V.dot(ru, rv), G = V.dot(rv, rv);
    var Lc = V.dot(ruu, n), Mc = V.dot(ruv, n), Nc = V.dot(rvv, n);
    return (Lc * Nc - Mc * Mc) / (E * G - F * F);
  }
  var STOPS = [[-1, [33, 102, 172]], [-0.5, [146, 197, 222]], [0, [247, 247, 247]], [0.5, [244, 165, 130]], [1, [178, 24, 43]]];
  function cmap(t) {
    t = Math.max(-1, Math.min(1, t));
    for (var i = 0; i < STOPS.length - 1; i++) {
      var a = STOPS[i], b = STOPS[i + 1];
      if (t <= b[0]) { var s = (t - a[0]) / (b[0] - a[0]); return a[1].map(function (x, k) { return x + (b[1][k] - x) * s; }); }
    }
    return STOPS[STOPS.length - 1][1];
  }
  function Flat(o) { this.o = o; this.visible = true; }   // yoqlari tekis rangli sirt (rang xaritasi uçun)
  Flat.prototype.collect = function (S, out) {
    var m = this.o.mesh, cols = this.o.colors, B = S._B, P = m.v.map(function (p) { return S.project(p, B); }), Lg = S.light, eye = B.e;
    m.f.forEach(function (face, fi) {
      var p3 = face.map(function (k) { return m.v[k]; }), n = X.mesh.normal(p3), cen = [0, 0, 0];
      p3.forEach(function (p) { cen = V.add(cen, p); }); cen = V.mul(cen, 1 / face.length);
      var nn = V.dot(n, V.sub(eye, cen)) < 0 ? V.mul(n, -1) : n;
      var k = 0.62 + 0.4 * Math.max(0, V.dot(nn, Lg)), z = 0; face.forEach(function (kk) { z += P[kk][2]; }); z /= face.length;
      var col = "rgb(" + cols[fi].map(function (c) { return Math.round(Math.min(255, c * k)); }).join(",") + ")";
      out.push({ z: z, draw: function (c) {
        c.beginPath(); face.forEach(function (kk, i) { var q = P[kk]; if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath();
        c.fillStyle = col; c.fill(); c.strokeStyle = "rgba(24,32,47,.16)"; c.lineWidth = 0.6; c.stroke();
      } });
    });
  };
  function sci(v) {
    var a = Math.abs(v); if (a < 1e-15) return "0";
    var s = a.toExponential(1).split("e"), e = parseInt(s[1], 10), sup = String(e).replace("-", "⁻").replace(/\d/g, function (d) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]; });
    return s[0].replace(".", ",") + "·10" + sup;
  }
  LAB._t = LAB._t || {}; LAB._t.l12 = { SURF: SURF, numK: numK, kapS: kapS, d1: d1, d2: d2 };

  LAB.start({
    intro: "Egrilik — egri çiziq yoki sirtning töğri çiziq (tekislik)dan qançalik «burilişi». Egri çiziq uçun κ = 1/R (R — egrilik radiusi); sirt uçun <b>Gauss egriligi</b> K = κ<sub>1</sub>·κ<sub>2</sub> (bosh egriliklar köpaytmasi).",
    tabs: [
      {
        name: "Egri çiziqda egrilik",
        lead: "Bezier egri çiziq nuqtalarini sudrang, t slayderi bilan nuqtani suring: urinma T, normal N va egrilik aylanasi (radius R = 1/κ) körinadi.",
        build: function (L) {
          var st = { t: 0.3, comb: true, scale: 1.0, circ: true };
          var P = L.plot({ x: [-0.4, 6.9], y: [-1.2, 5.2], aspect: 0.75 });
          function setPts() { P.handles = DEF.map(function (p, i) { return { p: p.slice(), label: "P" + i, color: C.ink }; }); }
          setPts();
          var R = L.readout([["k", "κ (işorali)"], ["r", "R = 1/|κ|"], ["T", "T (birlik urinma)"], ["N", "N (normal)"], ["c", "Egrilik markazi"], ["i", "κ = 0 nuqtalar"]]);
          P.onDraw = function () {
            var pp = P.handles.map(function (h) { return h.p; }), K = 300, curve = [], k, sg = 0, prev = 0, infl = 0;
            for (k = 0; k <= K; k++) { var tt = k / K; curve.push(X.bezier(pp, tt)); var ks = kapS(pp, tt); if (ks * prev < 0) infl++; if (Math.abs(ks) > 1e-9) prev = ks; }
            if (st.comb) {
              var env = [];
              for (k = 0; k <= 80; k++) {
                var t2 = k / 80, q = X.bezier(pp, t2), a = d1(pp, t2), v = Math.hypot(a[0], a[1]) || 1, nl = [-a[1] / v, a[0] / v], kk = kapS(pp, t2);
                var len = Math.max(-2.2, Math.min(2.2, -kk * st.scale)), e = [q[0] + nl[0] * len, q[1] + nl[1] * len];
                P.line([q, e], "rgba(214,51,108,.55)", 1); env.push(e);
              }
              P.line(env, "rgba(214,51,108,.9)", 1.8);
            }
            P.line(pp, C.ink3, 1.2, [6, 5]);
            P.line(curve, getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || C.violet, 3.5);
            var t = st.t, B = X.bezier(pp, t), a1 = d1(pp, t), sp = Math.hypot(a1[0], a1[1]) || 1, T = [a1[0] / sp, a1[1] / sp], N = [-T[1], T[0]], ks0 = kapS(pp, t);
            var cc = null;
            if (Math.abs(ks0) > 1e-6) {
              var Rr = 1 / ks0; cc = [B[0] + N[0] * Rr, B[1] + N[1] * Rr];
              if (st.circ && Math.abs(Rr) < 60) {
                var ring = []; for (k = 0; k <= 120; k++) ring.push([cc[0] + Math.abs(Rr) * Math.cos(2 * PI * k / 120), cc[1] + Math.abs(Rr) * Math.sin(2 * PI * k / 120)]);
                P.line(ring, C.violet, 2); P.line([B, cc], C.violet, 1.2, [4, 4]); P.dot(cc, C.violet, 4);
              }
            }
            P.line([B, [B[0] + T[0], B[1] + T[1]]], C.orange, 3.5); P.line([B, [B[0] + N[0], B[1] + N[1]]], C.green, 3.5);
            P.text([B[0] + T[0], B[1] + T[1]], "T", C.orange, 5, -5); P.text([B[0] + N[0], B[1] + N[1]], "N", C.green, 5, -5);
            P.dot(B, C.ink, 6);
            R.setMany({ k: f(ks0, 3), r: Math.abs(ks0) > 1e-6 ? f(1 / Math.abs(ks0), 3) : "∞ (egilişi nuqtasi)", T: "(" + f(T[0], 3) + "; " + f(T[1], 3) + ")", N: "(" + f(N[0], 3) + "; " + f(N[1], 3) + ")",
              c: cc ? "(" + f(cc[0], 2) + "; " + f(cc[1], 2) + ")" : "—", i: String(infl) });
          };
          L.slider({ label: "Parametr t", min: 0, max: 1, step: 0.005, value: st.t, nd: 3 }, function (v) { st.t = v; P.draw(); });
          L.toggle("Egrilik aylanasi (osculating circle)", true, function (v) { st.circ = v; P.draw(); });
          L.toggle("Egrilik taroği", true, function (v) { st.comb = v; P.draw(); });
          L.slider({ label: "Taroq masştabi", min: 0.2, max: 3, step: 0.1, value: st.scale, nd: 1 }, function (v) { st.scale = v; P.draw(); });
          L.button("Nuqtalarni tiklaş", function () { setPts(); P.draw(); });
          L.note("T = r′/|r′|, N = T ni +90° ga burişdan (çap tomon). κ = (x′y″ − y′x″)/(x′² + y′²)<sup>3/2</sup>, R = 1/|κ|, markaz = r + N/κ. κ > 0 — egri çiziq çapga buriladi, κ < 0 — öngga; κ = 0 nuqta — <b>egilişi nuqtasi</b>, aylana töğri çiziqqa aylanadi.", "main");
          L.tasks([
            "t ni 0 dan 1 gaça suring va κ ishorasi qayerda özgarişini toping: bu nuqtada R nimaga teng? (R → ∞, «κ = 0 nuqtalar» ≥ 1.)",
            "Taroqda eng uzun tişni toping (egri eng keskin burilgan joy) va t ni şu yerga qöying: R eng kiçik qiymatga yaqinmi?",
            "Tört nuqtani töğri çiziq böylab joylaştiring: κ va taroq qanday özgaradi? (κ → 0, taroq yöqoladi.)"
          ], "a");
        }
      },
      {
        name: "Gauss egriligi rang xaritasi",
        lead: "Sirt yoqlari Gauss egriligi K bilan böyalgan: kök — manfiy (egar), oq — nol, qizil — musbat (sfera). Sirtni aylantirib körin.",
        build: function (L) {
          var st = { kind: "sphere", R: 1.2, tR: 1.2, tr: 0.5 };
          var S = L.scene({ dist: 5.2, yaw: -0.8, pitch: 0.5, target: [0, 0, 0], aspect: 0.85, gridOpts: { n: 8, step: 0.5 }, axesOpts: { len: 1.6 } });
          var base = S.items.slice();
          var R = L.readout([["lo", "K eng kiçik"], ["hi", "K eng katta"], ["cl", "Yoqlar turi"], ["er", "Tekşiruv: |formula − sonli|"]]);
          var bar = EX.el("div", { style: "height:16px;border-radius:8px;border:1px solid var(--line);background:linear-gradient(90deg," + STOPS.map(function (s) { return "rgb(" + s[1].join(",") + ") " + Math.round((s[0] + 1) * 50) + "%"; }).join(",") + ")" });
          var lg = EX.el("div", { class: "lab-p" }, EX.el("div", { class: "lab-cap" }, "Gauss egriligi K (rang shkalasi, 0 nuqtasiga nisbatan simmetrik)"), bar);
          var lab = EX.el("div", { style: "display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-top:4px" });
          lg.appendChild(lab); L.add(lg, "main");
          var inf = L.add(EX.el("div", { class: "note" }), "main");
          var MEAN = { sphere: "Ellipik nuqtalar (K > 0): ikkala bosh egrilik bir ishorali, sirt bir tomonga egilgan.",
            cyl: "Parabolik nuqtalar (K = 0): bitta bosh egrilik nolga teng — silindrni cözmay-sozmay tekislikka yoyiş mumkin.",
            saddle: "Giperbolik nuqtalar (K < 0): bosh egriliklar qarama-qarşi ishorali — egar.",
            torus: "Aralaş: taşqi yarim (cos v > 0) ellipik (K > 0), ichki yarim giperbolik (K < 0), tepa va pastki aylanalarda K = 0." };
          function params() { return st.kind === "torus" ? { R: st.tR, r: st.tr } : { R: st.R }; }
          function rebuild() {
            var D = SURF[st.kind], p = params(), nu = st.kind === "sphere" ? 32 : st.kind === "saddle" ? 24 : 32, nv = st.kind === "sphere" ? 16 : st.kind === "saddle" ? 24 : st.kind === "cyl" ? 8 : 16;
            var g = function (u, v) { return D.fn(p, u, v); }, mesh = X.mesh.param(g, nu, nv, D.closeU, D.closeV), Ks = [], err = 0, i, j;
            for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) {
              var u = (i + 0.5) / nu, v = (j + 0.5) / nv, K = D.K(p, u, v); Ks.push(K);
              err = Math.max(err, Math.abs(K - numK(g, u, v)));
            }
            var lo = Math.min.apply(null, Ks), hi = Math.max.apply(null, Ks), m = Math.max(Math.abs(lo), Math.abs(hi)); if (m < 1e-12) m = 1;
            var cols = Ks.map(function (K) { return cmap(K / m); }), pos = 0, zero = 0, neg = 0;
            Ks.forEach(function (K) { if (Math.abs(K) < 1e-9) zero++; else if (K > 0) pos++; else neg++; });
            S.items = base.slice(); S.add(new Flat({ mesh: mesh, colors: cols })); S.draw();
            lab.innerHTML = "<span>" + f(-m, 3) + "</span><span>0</span><span>" + f(m, 3) + "</span>";
            var n = Ks.length, pc = function (x) { return f(100 * x / n, 0) + "%"; };
            var parts = []; if (pos) parts.push("ellipik " + pc(pos)); if (zero) parts.push("parabolik " + pc(zero)); if (neg) parts.push("giperbolik " + pc(neg));
            R.setMany({ lo: f(lo, 4), hi: f(hi, 4), cl: parts.join(", "), er: sci(err) });
            inf.innerHTML = MEAN[st.kind];
          }
          L.seg("Sirt", Object.keys(SURF).map(function (k) { return [k, SURF[k].name]; }), "sphere", function (v) {
            st.kind = v; gR.hidden = !(v === "sphere" || v === "cyl"); gT.hidden = v !== "torus"; rebuild();
          });
          var gR = L.group(function () { L.slider({ label: "Radius R", min: 0.6, max: 1.6, step: 0.05, value: st.R, nd: 2 }, function (v) { st.R = v; rebuild(); }); });
          var gT = L.group(function () {
            L.slider({ label: "Katta radius R", min: 1, max: 1.6, step: 0.05, value: st.tR, nd: 2 }, function (v) { st.tR = v; rebuild(); });
            L.slider({ label: "Kiçik radius r", min: 0.25, max: 0.7, step: 0.05, value: st.tr, nd: 2 }, function (v) { st.tr = v; rebuild(); });
          }); gT.hidden = true;
          L.note("Sfera: K = 1/R². Silindr: K = 0. Egar z = x² − y²: K = −4/(1 + 4x² + 4y²)². Tor: K = cos v / (r(R + r·cos v)), v — kiçik aylana (naycha) burçagi. Rang har bir yoqning markazidagi K qiymati böyiça; shkala 0 ga nisbatan simmetrik, yoruğlik rangni biroz özgartiradi.", "main");
          L.tasks([
            "Sferada R ni 0,6 dan 1,6 gaça özgartiring va K ni yozing: K = 1/R² bilan solişitiring. (R = 1 da K = 1; R = 2 da 0,25.)",
            "Egar sirtda «K eng kiçik» va «K eng katta»ni körin: K qayerda eng manfiy? (Markazda, K = −4; çetga qarab nolga yaqinlaşadi.)",
            "Torda ellipik va giperbolik yoqlar ulişini aniqlang. Qaysi aylanalarda K = 0? (Tepa va pastki aylanalarda, cos v = 0.)"
          ], "b");
          rebuild();
        }
      }
    ]
  });
})();
