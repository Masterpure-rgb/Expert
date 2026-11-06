/* 14-mavzu. Avatar proporsiyalari */
(function () {
  var X = window.X3D, V = X.v, M = X.m, C = LAB.C, f = X.fmt, PI = Math.PI;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function gauss(az, el, a0, e0, sa, se) { return Math.exp(-((az - a0) * (az - a0) / (2 * sa * sa) + (el - e0) * (el - e0) / (2 * se * se))); }

  /* ---------- 1-tajriba: yuz proporsiyalari (stilizatsiya) ---------- */
  // birlik: F — yuz balandligi (soç çiziğidan iyakkaça). Bosh balandligi H = 1,25 F (stilizatsiya).
  var HH = 1.25, YE = HH / 2;
  function catmull(c, P, closed) {
    var n = P.length;
    c.moveTo(P[0][0], P[0][1]);
    for (var i = 0; i < (closed ? n : n - 1); i++) {
      var p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (closed) c.closePath();
  }
  // yon körinişi çiziqlari (yuz markazi x = 0, old tomon +x): F birlikda
  var SIDE = [[-0.62, 0.78], [-0.45, 1.08], [-0.1, 1.24], [0.28, 1.14], [0.44, 0.98], [0.47, 0.8], [0.5, 0.67], [0.47, 0.6], [0.66, 0.38], [0.52, 0.33], [0.53, 0.27],
    [0.5, 0.22], [0.5, 0.17], [0.46, 0.04], [0.34, -0.01], [0.1, 0.02], [-0.18, 0.1], [-0.38, 0.3], [-0.56, 0.5]];

  /* ---------- 2-tajriba: bosh modeli ---------- */
  var RX = 0.8, RY = 0.95, RZ = 1.1;
  var EYE = 0.38, EYEEL = 0.16, MOUTH_EL = -0.5;
  // (azimut, balandlik) → mimika özgarişi → nuqta; old tomon −Y
  function warp(az, el, ex) {
    var s;
    if (ex.blink > 0) for (s = -1; s <= 1; s += 2) {
      var wgt = gauss(az, el, s * EYE, EYEEL, 0.22, 0.14);
      el = EYEEL + (el - EYEEL) * (1 - 0.7 * ex.blink * wgt);
    }
    if (ex.smile > 0) {
      var wm = gauss(az, el, 0, MOUTH_EL, 0.38, 0.2), wc = gauss(Math.abs(az), el, 0.27, MOUTH_EL, 0.16, 0.12);
      az = az * (1 + 0.14 * ex.smile * wm); el += 0.13 * ex.smile * wc;
    }
    return [az, el];
  }
  function headPoint(az, el, ex, lift) {
    var w = warp(az, el, ex), a = w[0], e = w[1];
    // shakl özgarişi (burun, köz kosasi, qoş, lablar, iyak) — warp qilinmagan koordinatalarda
    var m = 0.14 * gauss(a, e, 0, -0.1, 0.12, 0.22) - 0.06 * (gauss(a, e, EYE, EYEEL, 0.16, 0.12) + gauss(a, e, -EYE, EYEEL, 0.16, 0.12)) +
      0.04 * gauss(a, e, 0, 0.33, 0.5, 0.1) - 0.03 * gauss(a, e, 0, MOUTH_EL, 0.2, 0.05) + 0.03 * gauss(a, e, 0, MOUTH_EL + 0.06, 0.18, 0.07) + 0.05 * gauss(a, e, 0, -0.95, 0.2, 0.12);
    var dx = Math.sin(a) * Math.cos(e), dy = -Math.cos(a) * Math.cos(e), dz = Math.sin(e), sn = clamp(-dz / 0.9, 0, 1), xs = 1 - 0.22 * sn * sn, r = 1 + m + (lift || 0);
    return [RX * dx * xs * r, RY * dy * r, RZ * dz * r];
  }
  function dirAzEl(p) { var l = V.len(p) || 1, x = p[0] / l, y = p[1] / l, z = p[2] / l; return [Math.atan2(x, -y), Math.asin(clamp(z, -1, 1))]; }
  function Loops() { this.visible = true; this.loops = []; }
  Loops.prototype.collect = function (S, out) {
    var B = S._B;
    this.loops.forEach(function (lp) {
      var P = lp.pts.map(function (p) { return S.project(p, B); });
      var vis = lp.pts.map(function (p) { var n = [p[0] / (RX * RX), p[1] / (RY * RY), p[2] / (RZ * RZ)]; return V.dot(n, V.sub(B.e, p)) > 0; });
      for (var i = 0; i < P.length; i++) (function (a, b, va, vb) {
        if (!va || !vb) return;
        out.push({ z: (a[2] + b[2]) / 2 - 0.3, draw: function (c) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = lp.col; c.lineWidth = lp.lw; c.stroke(); } });
      })(P[i], P[(i + 1) % P.length], vis[i], vis[(i + 1) % P.length]);
    });
  };

  /* ---------- 3-tajriba: çiziqli aralaş skinning ---------- */
  var TN = 16, TR = 0.35, TL = 1.6, RAMP = 0.5;
  function layout(k) { return k === 1 ? [-1.6, -0.8, 0, 0.8, 1.6] : [-1.6, -0.8, -0.4, -0.2, 0, 0.2, 0.4, 0.8, 1.6]; }
  function wOf(s) { return clamp((s + RAMP) / (2 * RAMP), 0, 1); }
  function tube(rings, thDeg, z0) {
    var th = -thDeg * PI / 180, c = Math.cos(th), s = Math.sin(th), v = [], fcs = [], cols = [], i, j, wlist = [];
    rings.forEach(function (sx) {
      var w = wOf(sx); wlist.push(w);
      for (j = 0; j < TN; j++) {
        var ph = 2 * PI * j / TN, p = [sx, TR * Math.cos(ph), TR * Math.sin(ph)], q = [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]];
        v.push([(1 - w) * p[0] + w * q[0], (1 - w) * p[1] + w * q[1], z0 + (1 - w) * p[2] + w * q[2]]);
        var r = Math.round(62 + (229 - 62) * w), g = Math.round(99 + (72 - 99) * w), b = Math.round(221 + (77 - 221) * w); cols.push("rgb(" + r + "," + g + "," + b + ")");
      }
    });
    for (i = 0; i < rings.length - 1; i++) for (j = 0; j < TN; j++) fcs.push([i * TN + j, i * TN + (j + 1) % TN, (i + 1) * TN + (j + 1) % TN, (i + 1) * TN + j]);
    var c0 = [], c1 = []; for (j = 0; j < TN; j++) { c0.push(TN - 1 - j); c1.push((rings.length - 1) * TN + j); }
    fcs.push(c0, c1);
    var vol = 0; fcs.forEach(function (F) { for (var k = 1; k < F.length - 1; k++) { var p0 = v[F[0]], p1 = v[F[k]], p2 = v[F[k + 1]]; vol += V.dot([p0[0], p0[1], p0[2] - z0], V.cross([p1[0], p1[1], p1[2] - z0], [p2[0], p2[1], p2[2] - z0])) / 6; } });
    return { mesh: { v: v, f: fcs }, cols: cols, vol: vol, w: wlist };
  }

  LAB.start({
    intro: "Avatar yaratişda yuz proporsiyalari, tör qirralarining (edge loop) joylaşişi va böğimlardagi skinning — hammasi tabiiy körinişni taʼminlaydi. Bu laboratoriyada uçala jihat sinab köriladi.",
    tabs: [
      {
        name: "Yuz proporsiyalari",
        lead: "Stilizatsiyalangan boş çizmasida yuz proporsiyalari çiziqlarini yoqing: uçdan bir qismlar, köz çiziği, beş köz kengligi. Bu — taxminiy qoidalar, har bir yuz biroz farq qiladi.",
        build: function (L) {
          var st = { view: "front", W: 0.78, e: 0.156, thirds: true, eyeline: true, five: true, ear: true };
          var cv = L.canvas({ aspect: 1.05, maxH: 520 });
          var R = L.readout([["h", "Boş / yuz balandligi"], ["t", "Yuzning uçdan bir qismi"], ["eye", "Köz çiziği (iyakdan, boş yarmi)"], ["we", "Yuz kengligi / köz kengligi"]], "main");
          cv.draw = function (c, w, h) {
            var sc = (h - 44) / (HH + 0.05), ox = w * 0.5, y0 = h - 22, front = st.view === "front";
            function X_(x) { return ox + x * sc; } function Y_(y) { return y0 - y * sc; }
            var W = st.W, e = st.e, i;
            c.lineJoin = "round";
            // bosh shakli
            c.beginPath();
            if (front) {
              var Pts = [], hw = W / 2, y;
              for (i = 0; i <= 40; i++) { y = HH - (HH - YE) * i / 40; Pts.push([hw * Math.sqrt(Math.max(0, 1 - Math.pow((y - YE) / (HH - YE), 2))), y]); }
              for (i = 1; i <= 40; i++) { y = YE - YE * i / 40; var t = (YE - y) / YE; Pts.push([hw * (0.22 + 0.78 * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2)))), y]); }
              var all = Pts.concat(Pts.slice().reverse().map(function (p) { return [-p[0], p[1]]; }));
              all.forEach(function (p, k) { if (k) c.lineTo(X_(p[0]), Y_(p[1])); else c.moveTo(X_(p[0]), Y_(p[1])); });
              c.closePath();
            } else {
              var sp = SIDE.map(function (p) { return [X_(p[0]), Y_(p[1])]; }); catmull(c, sp, true);
            }
            c.fillStyle = "#F3D9C4"; c.fill(); c.strokeStyle = C.ink2; c.lineWidth = 2; c.stroke();
            // quloq (qoş çizig: qoş va burun asosi oraliğida)
            c.fillStyle = "#EBC9AE"; c.lineWidth = 1.5;
            if (front) { [-1, 1].forEach(function (s) { c.beginPath(); c.ellipse(X_(s * (W / 2 + 0.025)), Y_(0.5), 0.045 * sc, 0.17 * sc, 0, 0, 7); c.fill(); c.stroke(); }); }
            else { c.beginPath(); c.ellipse(X_(-0.05), Y_(0.5), 0.07 * sc, 0.17 * sc, 0, 0, 7); c.fill(); c.stroke(); }
            // yuz aʼzolari
            c.strokeStyle = C.ink; c.lineWidth = 1.8;
            if (front) {
              [-1, 1].forEach(function (s) {
                c.beginPath(); c.ellipse(X_(s * e), Y_(YE), e / 2 * sc, 0.2 * e * sc, 0, 0, 7); c.fillStyle = "#fff"; c.fill(); c.stroke();
                c.beginPath(); c.arc(X_(s * e), Y_(YE), 0.14 * e * sc, 0, 7); c.fillStyle = C.ink; c.fill();
                c.beginPath(); c.moveTo(X_(s * e - e * 0.55), Y_(2 / 3 + 0.01)); c.quadraticCurveTo(X_(s * e), Y_(2 / 3 + 0.05), X_(s * e + e * 0.55), Y_(2 / 3 + 0.01)); c.stroke();
              });
              c.beginPath(); c.moveTo(X_(-e * 0.18), Y_(YE - 0.05)); c.lineTo(X_(-e * 0.28), Y_(1 / 3 + 0.02)); c.quadraticCurveTo(X_(-e * 0.5), Y_(1 / 3 - 0.02), X_(-e * 0.5), Y_(1 / 3 - 0.005));
              c.moveTo(X_(e * 0.18), Y_(YE - 0.05)); c.lineTo(X_(e * 0.28), Y_(1 / 3 + 0.02)); c.quadraticCurveTo(X_(e * 0.5), Y_(1 / 3 - 0.02), X_(e * 0.5), Y_(1 / 3 - 0.005));
              c.moveTo(X_(-e * 0.5), Y_(1 / 3 - 0.005)); c.quadraticCurveTo(X_(0), Y_(1 / 3 - 0.04), X_(e * 0.5), Y_(1 / 3 - 0.005)); c.stroke();
              c.beginPath(); c.moveTo(X_(-e), Y_(2 / 9)); c.quadraticCurveTo(X_(0), Y_(2 / 9 - 0.035), X_(e), Y_(2 / 9)); c.lineWidth = 2.4; c.stroke();
            } else {
              c.beginPath(); c.ellipse(X_(0.32), Y_(YE), 0.075 * sc, 0.045 * sc, 0, 0, 7); c.fillStyle = "#fff"; c.fill(); c.stroke();
              c.beginPath(); c.arc(X_(0.36), Y_(YE), 0.03 * sc, 0, 7); c.fillStyle = C.ink; c.fill();
              c.beginPath(); c.moveTo(X_(0.52), Y_(0.22)); c.lineTo(X_(0.44), Y_(0.22)); c.lineWidth = 2.4; c.stroke();
            }
            // yöl-yöriq çiziqlari
            c.font = "600 11px Inter, system-ui, sans-serif"; c.lineWidth = 1.6;
            function hline(y, col, label, dash, x1) { c.beginPath(); c.moveTo(6, Y_(y)); c.lineTo(w - 6, Y_(y)); c.strokeStyle = col; c.setLineDash(dash || [6, 4]); c.stroke(); c.setLineDash([]); c.fillStyle = col; c.fillText(label, 8, Y_(y) - 4); }
            if (st.thirds) {
              hline(1, C.x, "Soç çiziği"); hline(2 / 3, C.x, "Qoş (1/3)"); hline(1 / 3, C.x, "Burun asosi (2/3)"); hline(0, C.x, "Iyak");
              c.fillStyle = "rgba(229,72,77,.9)"; c.textAlign = "right"; [5 / 6, 1 / 2, 1 / 6].forEach(function (y) { c.fillText("1/3", w - 8, Y_(y) + 4); }); c.textAlign = "start";
            }
            if (st.eyeline) { hline(YE, C.z, "", [2, 3]); c.fillStyle = C.z; c.fillText("Köz çiziği (boş yarmi)", 8, Y_(YE) + 13); hline(HH, C.z, "Boş tepasi", [2, 3]); }
            if (st.ear) {
              c.fillStyle = "rgba(232,89,12,.14)"; c.fillRect(front ? X_(-W / 2 - 0.2) : X_(-0.5), Y_(2 / 3), front ? (W + 0.4) * sc : 0.75 * sc, sc / 3);
              c.fillStyle = C.orange; c.fillText("quloq: qoş ↔ burun asosi", 8, Y_(0.5) + 4);
            }
            if (st.five && front) {
              c.strokeStyle = C.green; c.fillStyle = C.green; c.lineWidth = 1.6;
              for (i = -5; i <= 5; i += 2) {
                var xx = X_(i * e / 2); c.beginPath(); c.moveTo(xx, Y_(HH * 0.98)); c.lineTo(xx, Y_(0.02)); c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]);
              }
              c.textAlign = "center"; for (i = 0; i < 5; i++) c.fillText(String(i + 1), X_((-4 + 2 * i) * e / 2), Y_(HH * 0.98) + 14); c.textAlign = "start";
              c.fillText("5 köz kengligi", X_(0) - 36, Y_(0.1));
            }
            var ratio = W / e;
            R.setMany({ h: f(HH, 2) + " : 1", t: "1/3 = " + f(100 / 3, 1) + " %", eye: f(YE, 3) + " F (50 %)", we: f(ratio, 2) + (Math.abs(ratio - 5) < 0.3 ? " (≈ 5)" : "") });
          };
          L.seg("Körinişi", [["front", "Old"], ["side", "Yon"]], "front", function (v) { st.view = v; cv.redraw(); });
          L.toggle("Uçdan bir qismlar", true, function (v) { st.thirds = v; cv.redraw(); });
          L.toggle("Köz çiziği (boş yarmi)", true, function (v) { st.eyeline = v; cv.redraw(); });
          L.toggle("Beş köz kengligi (faqat old)", true, function (v) { st.five = v; cv.redraw(); });
          L.toggle("Quloq oraliği", true, function (v) { st.ear = v; cv.redraw(); });
          L.slider({ label: "Yuz kengligi (F ning uluşi)", min: 0.6, max: 0.95, step: 0.01, value: st.W, nd: 2 }, function (v) { st.W = v; cv.redraw(); });
          L.slider({ label: "Köz kengligi (F ning uluşi)", min: 0.1, max: 0.22, step: 0.002, value: st.e, nd: 3 }, function (v) { st.e = v; cv.redraw(); });
          L.note("Stilizatsiya qoidalari: yuz balandligi F (soç çiziğidan iyakkaça) uç teng qismga bölinadi — soç çiziği, qoş çiziği, burun asosi, iyak. Köz çiziği boş balandligining (tepadan iyakkaça) taxminan yarmida; yuz kengligi ≈ 5 köz kengligi (köz orasi = bitta köz). Quloq qoş va burun asosi oraliğida. Boş balandligi bu çizmada 1,25 F deb olingan. Bu taxminiy yöl-yöriq, qatʼiy qonun emas.", "main");
          cv.redraw();
          L.tasks([
            "Hamma çiziqni yoqing: burun asosi va qoş çiziği yuzni uç teng qismga böladimi? (Har biri 1/3.)",
            "«Yon» körinişga ötib quloq oraliğini yoqing: quloq qaysi ikki çiziq oraliğida?",
            "Yuz kengligini 0,78 qilib, köz kengligini 0,156 ga qöying: nisbat 5 ga teng bölişini körsatkiçdan tekşiring. Köz kengligini 0,12 ga tuşiring — beş köz qoidasi bajariladimi?"
          ], "a");
        }
      },
      {
        name: "Boş modeli va halqalar",
        lead: "Köz va oğiz atrofida qirralar halqa (edge loop) bölib joylaşadi. Halqalar sonini va mimika slayderlarini özgartiring: halqalar sirt bilan birga siljiydi.",
        build: function (L) {
          var st = { n: 2, eyes: true, mouth: true, blink: 0, smile: 0 };
          var S = L.scene({ dist: 3.5, yaw: -1.35, pitch: 0.12, axes: false, grid: false, aspect: 1, target: [0, 0, 0] });
          var base = X.mesh.uvSphere(28, 16, 1), dirs = base.v.map(dirAzEl);
          var mesh = S.add(new X.Mesh({ mesh: { v: [], f: base.f }, color: "#EBC9A8", edge: "rgba(24,32,47,.22)" }));
          var lp = S.add(new Loops());
          var R = L.readout([["v", "Tör: V"], ["e", "E"], ["fc", "F"], ["l", "Halqalar"]], "main");
          function loopPts(azc, elc, ra, re, ex) {
            var p = []; for (var i = 0; i < 48; i++) { var t = 2 * PI * i / 48; p.push(headPoint(azc + ra * Math.cos(t), elc + re * Math.sin(t), ex, 0.006)); }
            return p;
          }
          function upd() {
            var ex = { blink: st.blink, smile: st.smile };
            mesh.o.mesh = { v: dirs.map(function (d) { return headPoint(d[0], d[1], ex, 0); }), f: base.f };
            var loops = [], k;
            for (k = 1; k <= st.n; k++) {
              if (st.eyes) [-1, 1].forEach(function (s) { loops.push({ pts: loopPts(s * EYE, EYEEL, 0.1 + 0.06 * (k - 1), 0.055 + 0.035 * (k - 1), ex), col: C.z, lw: 2.6 }); });
              if (st.mouth) loops.push({ pts: loopPts(0, MOUTH_EL, 0.17 + 0.08 * (k - 1), 0.045 + 0.03 * (k - 1), ex), col: C.x, lw: 2.6 });
            }
            lp.loops = loops;
            var cn = X.mesh.counts(base);
            R.setMany({ v: f(cn.V, 0), e: f(cn.E, 0), fc: f(cn.F, 0), l: f(loops.length, 0) + " (köz: " + (st.eyes ? 2 * st.n : 0) + ", oğiz: " + (st.mouth ? st.n : 0) + ")" });
            S.draw();
          }
          L.slider({ label: "Halqalar soni (har bir köz / oğiz atrofida)", min: 1, max: 3, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; upd(); });
          L.toggle("Köz halqalari (kök)", true, function (v) { st.eyes = v; upd(); });
          L.toggle("Oğiz halqalari (qizil)", true, function (v) { st.mouth = v; upd(); });
          L.slider({ label: "Köz qisiş", min: 0, max: 1, step: 0.01, value: 0, nd: 2 }, function (v) { st.blink = v; upd(); });
          L.slider({ label: "Tabassum", min: 0, max: 1, step: 0.01, value: 0, nd: 2 }, function (v) { st.smile = v; upd(); });
          L.add(EX.el("div", { class: "legend", html: '<span><i style="background:' + C.z + '"></i>Köz halqalari</span><span><i style="background:' + C.x + '"></i>Oğiz halqasi</span>' }), "main");
          L.note("Köz va oğiz atrofidagi muşaklar halqasimon (orbicularis oculi, orbicularis oris). Tör qirralari ham şu halqalar böylab ötsa, qisiliş va tabassum paytida sirt tabiiy burişadi; qirralar «töğri» çiziq böylab kesişsa, qatlam körinişi buziladi. Bu yerda sfera asosidagi sodda stilizatsiya: halqalar sirt ustiga sxematik çizilgan.", "main");
          upd();
          L.tasks([
            "Halqalar sonini 1 dan 3 ga özgartiring: köz va oğiz atrofida nima özgaradi?",
            "«Tabassum» slayderini 1 ga qöyib, qizil halqalar oğiz burçaklarida qanday özgarganini kuzating.",
            "«Köz qisiş» ni oşiring: kök halqalar qanday siqiladi? Sahnani aylantirib, yon tomondan qarang."
          ], "b");
        }
      },
      {
        name: "Barmoq böğimi (skinning)",
        lead: "Ikkita suyakli nay (barmoq) böğimda egiladi. Çap tomonda böğimda faqat 1 halqa, ong tomonda — 5 halqa. Egilişni oşirib, hajm yöqotilişini solişitiring.",
        build: function (L) {
          var st = { th: 90 };
          var Z1 = 1.55, Z5 = -1.55;
          var S = L.scene({ dist: 7.2, yaw: -Math.PI / 2, pitch: 0.06, target: [-0.3, 0, 0.6], grid: false, axes: false, aspect: 0.95 });
          var m1 = S.add(new X.Mesh({ mesh: { v: [], f: [] }, color: "#C9D4F5", points: true, pointSize: 2.6 }));
          var m5 = S.add(new X.Mesh({ mesh: { v: [], f: [] }, color: "#C9D4F5", points: true, pointSize: 2.6 }));
          var bones = S.add(new X.Line({ pts: [], color: C.ink, lw: 3 }));
          var bones5 = S.add(new X.Line({ pts: [], color: C.ink, lw: 3 }));
          var jt = S.add(new X.Points({ pts: [[0, 0, Z1], [0, 0, Z5]], color: C.ink, r: 5, front: true }));
          S.onDraw = function (c) {
            c.font = "700 13px Inter, system-ui, sans-serif"; c.fillStyle = C.ink;
            var a = S.project([-TL - 0.15, 0, Z1 - 0.1]), b = S.project([-TL - 0.15, 0, Z5 - 0.1]);
            c.textAlign = "right"; c.fillText("1 halqa", a[0], a[1]); c.fillText("5 halqa", b[0], b[1]); c.textAlign = "start";
          };
          var wp = L.canvas({ aspect: 0.5 });
          var R = L.readout([["a", "Egiliş burçagi θ"], ["v1", "Hajm: 1 halqa"], ["v5", "Hajm: 5 halqa"], ["d", "Böğim kesimi diametri cos(θ/2)"]], "main");
          wp.draw = function (c, w, h) {
            var pad = { l: 40, r: 12, t: 16, b: 32 }, W = w - pad.l - pad.r, H = h - pad.t - pad.b, i;
            function sx(s) { return pad.l + (s + TL) / (2 * TL) * W; } function sy(v) { return pad.t + H - v * H; }
            c.font = "11px Inter, system-ui, sans-serif"; c.lineWidth = 1;
            for (i = 0; i <= 4; i++) { c.strokeStyle = "rgba(24,32,47,.10)"; c.beginPath(); c.moveTo(pad.l, sy(i / 4)); c.lineTo(pad.l + W, sy(i / 4)); c.stroke(); c.fillStyle = C.ink3; c.fillText(f(i / 4, 2), 6, sy(i / 4) + 4); }
            for (i = -1.5; i <= 1.5; i += 0.5) { c.fillStyle = C.ink3; c.fillText(f(i, 1), sx(i) - 8, h - 16); }
            c.fillStyle = C.ink2; c.fillText("s — suyak öqi böylab vaziyat (böğim s = 0)", pad.l + 4, h - 3); c.fillText("w₂", 10, pad.t + 4);
            [[1, C.orange], [5, C.z]].forEach(function (cfg) {
              var rs = layout(cfg[0]); c.beginPath(); rs.forEach(function (s, k) { if (k) c.lineTo(sx(s), sy(wOf(s))); else c.moveTo(sx(s), sy(wOf(s))); });
              c.strokeStyle = cfg[1]; c.lineWidth = 2.5; c.stroke();
              rs.forEach(function (s) { c.beginPath(); c.arc(sx(s), sy(wOf(s)), 4, 0, 7); c.fillStyle = cfg[1]; c.fill(); });
            });
            c.fillStyle = C.orange; c.fillText("1 halqa", pad.l + W - 120, pad.t + 12); c.fillStyle = C.z; c.fillText("5 halqa", pad.l + W - 60, pad.t + 12);
          };
          function upd() {
            var t1 = tube(layout(1), st.th, Z1), t5 = tube(layout(5), st.th, Z5), t10 = tube(layout(1), 0, Z1), t50 = tube(layout(5), 0, Z5);
            m1.o.mesh = t1.mesh; m1.o.pointColors = t1.cols; m5.o.mesh = t5.mesh; m5.o.pointColors = t5.cols;
            var th = -st.th * PI / 180, tip = [TL * Math.cos(th), 0, TL * -Math.sin(th)];
            bones.o.pts = [[-TL, 0, Z1], [0, 0, Z1], [tip[0], 0, Z1 + tip[2]]];
            bones5.o.pts = [[-TL, 0, Z5], [0, 0, Z5], [tip[0], 0, Z5 + tip[2]]];
            R.setMany({ a: f(st.th, 0) + "°", v1: f(t1.vol / t10.vol * 100, 1) + " %", v5: f(t5.vol / t50.vol * 100, 1) + " %", d: f(Math.cos(st.th * PI / 360), 3) });
            S.draw(); wp.redraw();
          }
          L.slider({ label: "Egiliş burçagi θ", min: 0, max: 150, step: 1, value: st.th, nd: 0, unit: "°" }, function (v) { st.th = v; upd(); });
          L.add(EX.el("div", { class: "legend", html: '<span><i style="background:#3E63DD"></i>1-suyak vazni (w₁ = 1)</span><span><i style="background:#E5484D"></i>2-suyak vazni (w₂ = 1)</span><span>qora çiziq — suyaklar</span>' }), "main");
          L.note("Çiziqli aralaş skinning: <b>v′ = Σ w<sub>i</sub> M<sub>i</sub> v</b>, ikki suyakda v′ = (1 − w)·M<sub>1</sub>v + w·M<sub>2</sub>v, w<sub>1</sub> + w<sub>2</sub> = 1. M<sub>1</sub> = I, M<sub>2</sub> — böğim atrofida θ burçakka aylantiriş; w₂ ≈ (s + 0,5)/1 ([−0,5; 0,5] oraliğida çiziqli). Böğim halqasida w = 0,5 bölgani uçun nuqta ikki aylantirilgan holatning örtasiga tuşadi — kesim cos(θ/2) marta kiçrayadi. 1 halqada bu «tarang» kiçrayiş uzun bölakka yoyilib qoladi, 5 halqada esa vazn yumşoq özgaradi va hajm kamroq yöqoladi. Hajm yopiq tör böyiça hisoblangan; çiziqli aralaş skinningda hajm töliq saqlanmaydi (buning uçun masalan dual quaternion skinning qöllanadi).", "main");
          upd();
          L.tasks([
            "θ = 90° qiling: hajm 1 halqada ≈ 87,5 %, 5 halqada ≈ 93,5 % bölişini körsatkiçdan tekşiring.",
            "θ = 150° ga çiqaring: ikkala variantda ham hajm yöqotilişini solişitiring (≈ 76,7 % va ≈ 87,9 %). Böğim sirti qanday körinadi?",
            "Vazn grafigiga qarang: 1 halqada w₂ böğimda sakrab (0 → 0,5 → 1) özgaradi, 5 halqada esa silliq. Rang nuqtalari (kök → qizil) buni tasdiqlaydimi?"
          ], "c");
        }
      }
    ]
  });
})();
