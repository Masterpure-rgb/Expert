/* 4-mavzu. Fotogrammetriya simulyatori */
(function () {
  var X = window.X3D, V = X.v, C = LAB.C, f = X.fmt, RAD = Math.PI / 180;

  // tasodifiy sonlar (urugʼli): şovqin sliderni surganda «titramasligi» uçun
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function normals(seed, n) {
    var r = rng(seed), out = [];
    for (var i = 0; i < n; i++) { var u = Math.max(1e-9, r()), v = r(); out.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)); }
    return out;
  }
  function fin(v) { return isFinite(v) ? v : NaN; }

  /* ---------- 1-tajriba: kamera halqalari ---------- */
  var RCOL = ["#3E63DD", "#2F9E6B", "#E8590C", "#8E4EC6", "#D6336C"];
  function Rig() { this.visible = true; this.cams = []; this.fov = 60; this.len = 0.5; }
  Rig.prototype.collect = function (S, out) {
    var self = this, th = Math.tan(self.fov * RAD / 2), tv = th * 0.75, l = self.len;
    // har bir halqani tutashtiruvçi çiziq
    var rings = {};
    self.cams.forEach(function (c) { (rings[c.ring] = rings[c.ring] || []).push(c); });
    Object.keys(rings).forEach(function (k) {
      var P = rings[k].map(function (c) { return S.project(c.p, S._B); });
      var z = 0; P.forEach(function (q) { z += q[2]; }); z /= P.length;
      out.push({ z: z + 1e3, draw: function (c) {
        c.beginPath(); P.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath();
        c.strokeStyle = "rgba(24,32,47,.18)"; c.lineWidth = 1; c.setLineDash([3, 4]); c.stroke(); c.setLineDash([]);
      } });
    });
    self.cams.forEach(function (cam) {
      var ctr = V.add(cam.p, V.mul(cam.f, l)), col = RCOL[cam.ring % RCOL.length];
      var co = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (s) {
        return S.project(V.add(ctr, V.add(V.mul(cam.r, l * th * s[0]), V.mul(cam.u, l * tv * s[1]))), S._B);
      });
      var a = S.project(cam.p, S._B);
      out.push({ z: a[2], draw: function (c) {
        c.beginPath(); co.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath();
        c.globalAlpha = 0.16; c.fillStyle = col; c.fill(); c.globalAlpha = 1;
        c.strokeStyle = col; c.lineWidth = 1.1; c.stroke();
        c.beginPath(); co.forEach(function (q) { c.moveTo(a[0], a[1]); c.lineTo(q[0], q[1]); }); c.lineWidth = 0.8; c.stroke();
        c.beginPath(); c.arc(a[0], a[1], 2.4, 0, 7); c.fillStyle = col; c.fill();
      } });
    });
  };
  function elevations(R) {
    if (R === 1) return [30];
    var e = []; for (var k = 0; k < R; k++) e.push(10 + k * 50 / (R - 1));
    return e;
  }
  // qoplaniş modeli: p = 1 − B/W, B = 2·D·sin(Δ/2) (xorda), W = 2·D·tan(FOV/2)  →  p = 1 − sin(Δ/2)/tan(FOV/2)
  function overlap(stepDeg, fovDeg) {
    var p = 1 - Math.sin(stepDeg * RAD / 2) / Math.tan(fovDeg * RAD / 2);
    return Math.max(0, Math.min(1, p));
  }
  function verdict(p) { return p >= 0.8 ? "yaxşi" : p >= 0.6 ? "çegarada" : "yetarli emas"; }

  /* ---------- 2-tajriba: triangulyatsiya ---------- */
  // ikki nurning eng yaqin nuqtalari orasidagi örta nuqta
  function midpoint(p1, d1, p2, d2) {
    var w0 = V.sub(p1, p2), b = V.dot(d1, d2), d = V.dot(d1, w0), e = V.dot(d2, w0), den = 1 - b * b;
    if (den < 1e-9) return null;
    var s = (b * e - d) / den, t = (e - b * d) / den;
    var q1 = V.add(p1, V.mul(d1, s)), q2 = V.add(p2, V.mul(d2, t));
    return { m: V.mul(V.add(q1, q2), 0.5), gap: V.len(V.sub(q1, q2)), s: s, t: t };
  }
  function rayDir(c, x, azn, eln) {
    var az = Math.atan2(x[1] - c[1], x[0] - c[0]) + azn;
    return [Math.cos(eln) * Math.cos(az), Math.cos(eln) * Math.sin(az), Math.sin(eln)];
  }
  function triang(A, B, Xp, sig, z) {
    var A3 = [A[0], A[1], 0], B3 = [B[0], B[1], 0], X3 = [Xp[0], Xp[1], 0];
    var dA = rayDir(A, Xp, sig * z[0], sig * z[1]), dB = rayDir(B, Xp, sig * z[2], sig * z[3]);
    var r = midpoint(A3, dA, B3, dB);
    return { r: r, dA: dA, dB: dB, A3: A3, B3: B3, X3: X3 };
  }

  /* ---------- 3-tajriba: hisoblar ---------- */
  function ransacN(p, e, s) {
    var w = Math.pow(1 - e, s);
    if (w >= 1) return 1;
    if (w <= 0) return Infinity;
    return Math.ceil(Math.log(1 - p) / Math.log(1 - w));
  }

  LAB.start({
    intro: "Fotogrammetriyada obyektning köp suratlari olinadi, ulardan kameralar vaziyati va 3D nuqtalar tiklanadi. Suratlar qanday olinişi, kameralar orasidagi burçak va suratning aniqligi natijaning sifatini belgilaydi.",
    tabs: [
      {
        name: "Kamera halqalari",
        lead: "Obyekt atrofida kameralar halqalar böylab joylaşadi. Kameralar sonini, halqalar sonini va köriş burçagini özgartirib, qöşni suratlarning qoplanişini kuzating.",
        build: function (L) {
          var st = { n: 24, R: 4, D: 3.5, fov: 60 };
          var S = L.scene({ dist: 7.6, yaw: -0.8, pitch: 0.45, target: [0, 0, 1.3], gridOpts: { n: 14, step: 0.75 }, axesOpts: { len: 0.8 }, aspect: 0.85 });
          // obyekt: tumba va bosh (haykal)
          var base = X.mesh.transform(X.mesh.cylinder(18, 0.45, 1.0), [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0.5], [0, 0, 0, 1]]);
          var head = X.mesh.transform(X.mesh.uvSphere(18, 9, 0.36), [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 1.35], [0, 0, 0, 1]]);
          S.add(new X.Mesh({ mesh: base, color: "#E9D7BD" }));
          S.add(new X.Mesh({ mesh: head, color: "#E9D7BD" }));
          var rig = S.add(new Rig());
          var tgt = [0, 0, 0.9];
          function build() {
            var el = elevations(st.R), cams = [];
            el.forEach(function (e, k) {
              for (var j = 0; j < st.n; j++) {
                var ph = 2 * Math.PI * j / st.n, ce = Math.cos(e * RAD);
                var p = V.add(tgt, [st.D * ce * Math.cos(ph), st.D * ce * Math.sin(ph), st.D * Math.sin(e * RAD)]);
                var fw = V.norm(V.sub(tgt, p)), r = V.norm(V.cross(fw, [0, 0, 1])), u = V.cross(r, fw);
                cams.push({ p: p, f: fw, r: r, u: u, ring: k });
              }
            });
            rig.cams = cams; rig.fov = st.fov;
            rig.len = Math.min(0.6, st.D * 0.17);
            var step = 360 / st.n, ph = overlap(step, st.fov);
            var fv = 2 * Math.atan(Math.tan(st.fov * RAD / 2) * 0.75) / RAD;
            var vs = st.R > 1 ? 50 / (st.R - 1) : null, pv = vs == null ? null : overlap(vs, fv);
            var worst = pv == null ? ph : Math.min(ph, pv);
            R.setMany({
              n: f(st.n * st.R, 0), step: f(step, 1) + "°", oh: f(ph * 100, 0) + " %",
              ov: pv == null ? "—" : f(pv * 100, 0) + " %",
              v: verdict(worst)
            });
            S.draw();
          }
          L.slider({ label: "Halqadagi kameralar soni", min: 4, max: 36, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; build(); });
          L.slider({ label: "Halqalar soni (balandliklar)", min: 1, max: 5, step: 1, value: st.R, nd: 0 }, function (v) { st.R = v; build(); });
          L.slider({ label: "Obyektgaça masofa D", min: 2, max: 6, step: 0.1, value: st.D, nd: 1, unit: "m" }, function (v) { st.D = v; build(); });
          L.slider({ label: "Köriş burçagi (gorizontal FOV)", min: 20, max: 90, step: 1, value: st.fov, nd: 0, unit: "°" }, function (v) { st.fov = v; build(); });
          var R = L.readout([["n", "Kameralar jami"], ["step", "Burçak qadami Δ"], ["oh", "Qöşni suratlar qoplanişi"], ["ov", "Halqalar orasi (balandlik böyiça)"], ["v", "Baho (≥ 80 % yaxşi; 60–80 % çegarada)"]], "main");
          L.add(EX.el("div", { class: "legend", html: RCOL.map(function (c, i) { return '<span><i style="background:' + c + '"></i>' + (i + 1) + "-halqa</span>"; }).join("") }), "main");
          L.note("<b>Model:</b> qöşni kameralar orasidagi xorda B = 2·D·sin(Δ/2), kadr kengligi obyektda W = 2·D·tan(FOV/2), qoplaniş p = 1 − B/W = 1 − sin(Δ/2)/tan(FOV/2). Kadr nisbati 4:3 deb olingan; halqalar 10° dan 60° gaçaligi balandlikka teng taqsimlangan. Bu soddalaştirilgan baho (tekis, kameraga perpendikulyar sirt uçun); odatiy tavsiya — qoplaniş 60–80 % dan kam bölmasligi.", "main");
          build();
          L.tasks([
            "Kameralar sonini 24 dan 12 ga tuşiring: Δ = 30° va qoplaniş taxminan 55 % ga tuşadi — «yetarli emas».",
            "Halqalar sonini 4 dan 2 ga tuşiring: halqalar 50° ga uzoqlaşadi va balandlik böyiça qoplaniş taxminan 2 % ga tuşadi. Yana 4 ga qaytaring: taxminan 67 % bölişi kerak.",
            "Köriş burçagini 40° dan 80° ga özgartiring: Δ ni özgartirmay qoplaniş qanday özgaradi? Masofa D taʼsir qiladimi?"
          ], "a");
        }
      },
      {
        name: "Triangulyatsiya",
        lead: "A va B kameralar X nuqtaga nur yönaltiradi. Kameralarni va nuqtani sudrang, burçak şovqini slayderini özgartiring: ikki nur orasidagi burçak kiçik bölsa, xato keskin oşadi.",
        build: function (L) {
          var st = { sig: 1, seed: 7 };
          var Z = normals(st.seed, 4), ZS = normals(99, 4 * 300);
          function reseed() { st.seed = Math.floor(Math.random() * 1e6); Z = normals(st.seed, 4); }
          var P = L.plot({ x: [-6, 6], y: [-1, 7], aspect: 0.62, hint: "A, B va X nuqtalarni sudrang" });
          P.handles = [{ p: [-3, 0], label: "A", color: C.z }, { p: [3, 0], label: "B", color: C.x }, { p: [0, 4], label: "X", color: C.ink }];
          var cv = L.canvas({ aspect: 0.5 });
          var R = L.readout([["b", "Baza |AB|"], ["g", "Kesişiş burçagi γ"], ["e", "Xato |X′ − X|"], ["gap", "Nurlar orasidagi eng qisqa masofa"], ["rms", "RMS xato / d (γ da)"]], "main");
          var cur = { gamma: 60 };
          function gam(A, B, Xp) {
            var a = Math.atan2(A[1] - Xp[1], A[0] - Xp[0]), b = Math.atan2(B[1] - Xp[1], B[0] - Xp[0]), d = Math.abs(a - b) % (2 * Math.PI);
            return (d > Math.PI ? 2 * Math.PI - d : d) / RAD;
          }
          // simmetrik geometriya: kameralar X dan d masofada, ular orasidagi burçak γ; xato d ga nisbatan
          function rmsRel(gDeg, sig) {
            var d = 1, hg = gDeg * RAD / 2, A = [-Math.sin(hg) * d, Math.cos(hg) * d], B = [Math.sin(hg) * d, Math.cos(hg) * d], s2 = 0, n = 0;
            for (var i = 0; i < 300; i++) {
              var t = triang(A, B, [0, 0], sig, [ZS[4 * i], ZS[4 * i + 1], ZS[4 * i + 2], ZS[4 * i + 3]]);
              if (!t.r) continue;
              var e = V.len(t.r.m); if (!isFinite(e)) continue;
              s2 += e * e; n++;
            }
            return n ? Math.sqrt(s2 / n) : NaN;
          }
          P.onDraw = function (c) {
            var A = P.handles[0].p, B = P.handles[1].p, Xp = P.handles[2].p;
            var t = triang(A, B, Xp, st.sig * RAD, Z), r = t.r, i;
            // haqiqiy nurlar (punktir)
            P.line([A, Xp], "rgba(24,32,47,.35)", 1.5, [5, 5]); P.line([B, Xp], "rgba(24,32,47,.35)", 1.5, [5, 5]);
            var sA = r ? Math.max(r.s, 0.1) : 12, sB = r ? Math.max(r.t, 0.1) : 12;
            P.line([A, [A[0] + t.dA[0] * sA * 1.3, A[1] + t.dA[1] * sA * 1.3]], C.z, 2.5);
            P.line([B, [B[0] + t.dB[0] * sB * 1.3, B[1] + t.dB[1] * sB * 1.3]], C.x, 2.5);
            P.dot(Xp, C.ink, 5);
            var g = gam(A, B, Xp); cur.gamma = g;
            var err = NaN, gap = NaN;
            if (r) {
              err = V.len(V.sub(r.m, t.X3)); gap = r.gap;
              P.dot([r.m[0], r.m[1]], C.orange, 6, "X′");
            }
            P.text([Xp[0], Xp[1]], "γ = " + f(g, 0) + "°", C.ink2, 10, 18);
            var rm = rmsRel(Math.max(2, Math.min(178, g)), st.sig * RAD);
            R.setMany({
              b: f(Math.hypot(A[0] - B[0], A[1] - B[1]), 2) + " m", g: f(g, 1) + "°",
              e: r ? f(fin(err), 3) + " m" : "nurlar parallel", gap: r ? f(fin(gap), 3) + " m" : "—",
              rms: f(fin(rm * 100), 1) + " %"
            });
            cv.redraw();
          };
          cv.draw = function (c, w, h) {
            var pad = { l: 44, r: 12, t: 14, b: 32 }, W = w - pad.l - pad.r, H = h - pad.t - pad.b, i;
            var gs = [], vs = [];
            for (i = 4; i <= 176; i += 4) { gs.push(i); vs.push(rmsRel(i, st.sig * RAD) * 100); }
            var mx = 0; vs.forEach(function (v, k) { if (gs[k] >= 20 && isFinite(v)) mx = Math.max(mx, v); });
            var ymax = Math.max(2, Math.ceil(mx * 1.1 / 5) * 5); if (st.sig === 0) ymax = 2;
            function sx(g) { return pad.l + g / 180 * W; } function sy(v) { return pad.t + H - Math.min(v, ymax) / ymax * H; }
            c.strokeStyle = "rgba(24,32,47,.12)"; c.lineWidth = 1; c.fillStyle = C.ink3; c.font = "11px Inter, system-ui, sans-serif";
            for (i = 0; i <= 180; i += 30) { c.beginPath(); c.moveTo(sx(i), pad.t); c.lineTo(sx(i), pad.t + H); c.stroke(); c.fillText(i + "°", sx(i) - 8, h - 14); }
            for (i = 0; i <= 4; i++) { var yv = ymax * i / 4; c.beginPath(); c.moveTo(pad.l, sy(yv)); c.lineTo(pad.l + W, sy(yv)); c.stroke(); c.fillText(f(yv, ymax < 10 ? 1 : 0) + " %", 4, sy(yv) + 4); }
            c.fillStyle = C.ink2; c.fillText("γ — nurlar orasidagi burçak", pad.l + W / 2 - 60, h - 2);
            c.beginPath(); vs.forEach(function (v, k) { var x = sx(gs[k]), y = sy(isFinite(v) ? v : ymax); if (k) c.lineTo(x, y); else c.moveTo(x, y); });
            c.strokeStyle = C.orange; c.lineWidth = 2.5; c.stroke();
            var g = Math.max(4, Math.min(176, cur.gamma)), v0 = rmsRel(g, st.sig * RAD) * 100;
            c.beginPath(); c.moveTo(sx(g), pad.t); c.lineTo(sx(g), pad.t + H); c.strokeStyle = C.ink; c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]);
            if (isFinite(v0)) { c.beginPath(); c.arc(sx(g), sy(v0), 5, 0, 7); c.fillStyle = C.ink; c.fill(); }
            c.fillStyle = C.ink; c.font = "600 11px Inter, system-ui, sans-serif"; c.fillText("RMS xato / d", pad.l + 6, pad.t + 12);
          };
          L.slider({ label: "Burçak şovqini σ", min: 0, max: 5, step: 0.1, value: st.sig, nd: 1, unit: "°" }, function (v) { st.sig = v; P.draw(); });
          L.button("Yangi şovqin namunasi", function () { reseed(); P.draw(); });
          L.button("Dastlabki holat", function () { P.handles[0].p = [-3, 0]; P.handles[1].p = [3, 0]; P.handles[2].p = [0, 4]; P.draw(); });
          L.note("Har bir kamera X ga yönalgan nurni σ burçak xatosi bilan «körsatadi» (azimut va balandlik böyiça). Ikki nur umuman kesişmaydi, şuning uçun ularning eng yaqin nuqtalari orasidagi <b>örta nuqta</b> X′ olinadi. Xato taxminan σ·d / sin γ kabi oşadi: baza kiçik (γ → 0°) bölsa, çuqurlik xatosi keskin kattalaşadi. Pastdagi grafik — 300 ta tasodifiy namuna böyiça RMS xato (d = 1 deb).", "main");
          P.draw();
          L.tasks([
            "σ = 1° da A va B ni X ga yaqinlaştirib γ ni 10° gaça kiçraytiring: xato qanday özgardi?",
            "γ ≈ 90° bölganda RMS xatoni γ ≈ 20° dagi xato bilan solişitiring (grafik va körsatkiç).",
            "σ = 0° qiling: xato nolga tuşadimi? Nima uçun?"
          ], "b");
        }
      },
      {
        name: "GSD va RANSAC",
        lead: "Ikki kalkulyator: suratdagi bir pikselning yerdagi ölçami (GSD) va RANSAC algoritmi uçun kerakli iteratsiyalar soni. Boşlangiç qiymatlar — shartli misollar.",
        build: function (L) {
          var g = { S: 13.2, F: 8.8, W: 5472, H: 50, T: 5 }, rs = { p: 0.99, e: 0.5, s: 8 };
          L.heading("GSD kalkulyatori");
          L.number({ label: "Sensor kengligi S", unit: "mm", min: 0.1, step: 0.1, value: g.S }, function (v) { g.S = v; upd(); });
          L.number({ label: "Fokus masofasi f", unit: "mm", min: 0.1, step: 0.1, value: g.F }, function (v) { g.F = v; upd(); });
          L.number({ label: "Rasm kengligi W", unit: "px", min: 1, step: 1, value: g.W }, function (v) { g.W = v; upd(); });
          L.number({ label: "Obyektgaça masofa H", unit: "m", min: 0.01, step: 0.5, value: g.H }, function (v) { g.H = v; upd(); });
          L.number({ label: "Maqsad GSD", unit: "mm/px", min: 0.01, step: 0.5, value: g.T }, function (v) { g.T = v; upd(); });
          L.heading("RANSAC kalkulyatori");
          L.slider({ label: "Ishonçlilik p", min: 0.9, max: 0.999, step: 0.001, value: rs.p, nd: 3 }, function (v) { rs.p = v; upd(); });
          L.slider({ label: "Notöğri juftliklar uluşi ε", min: 0, max: 0.9, step: 0.01, value: rs.e, nd: 2 }, function (v) { rs.e = v; upd(); });
          L.slider({ label: "Minimal tanlanma hajmi s", min: 2, max: 10, step: 1, value: rs.s, nd: 0 }, function (v) { rs.s = v; upd(); });
          L.heading("GSD natijasi", "main");
          var R1 = L.readout([["gsd", "GSD"], ["fp", "Kadr kengligi yerda"], ["need", "Maqsad GSD uçun masofa"]], "main");
          L.note("GSD = (S · H) / (f · W). Ölçamlar: S va f — mm, H — m (hisobda ×1000), W — px; natija mm/px. Misol: S = 13,2 mm, f = 8,8 mm, W = 5472 px, H = 50 m → GSD ≈ 13,7 mm/px.", "main");
          L.heading("RANSAC natijasi", "main");
          var R2 = L.readout([["n", "Kerakli iteratsiyalar N"], ["w", "Toza tanlanma ehtimoli (1 − ε)^s"], ["n8", "N (s = 8)"], ["n7", "N (s = 7)"], ["n5", "N (s = 5)"]], "main");
          var cv = L.canvas({ aspect: 0.55 });
          L.note("N = ⌈ log(1 − p) / log(1 − (1 − ε)<sup>s</sup>) ⌉. Tekşiriş: p = 0,99, ε = 0,5 da s = 8 → 1177; s = 7 → 588; s = 5 → 146. Tanlanma hajmi s oşsa, N keskin oşadi: 8 nuqtali algoritm 5 nuqtalidan taxminan 8 baravar köp iteratsiya talab qiladi (shu ε da).", "main");
          function upd() {
            var gsd = fin(g.S * g.H * 1000 / (g.F * g.W)), fp = fin(gsd * g.W / 1000), need = fin(g.T * g.F * g.W / (g.S * 1000));
            R1.setMany({ gsd: f(gsd, 2) + " mm/px", fp: f(fp, 1) + " m", need: f(need, 1) + " m" });
            var N = ransacN(rs.p, rs.e, rs.s);
            R2.setMany({
              n: isFinite(N) ? f(N, 0) : "çeksiz köp", w: f(Math.pow(1 - rs.e, rs.s), 4),
              n8: f(ransacN(rs.p, rs.e, 8), 0), n7: f(ransacN(rs.p, rs.e, 7), 0), n5: f(ransacN(rs.p, rs.e, 5), 0)
            });
            cv.redraw();
          }
          cv.draw = function (c, w, h) {
            var pad = { l: 46, r: 12, t: 12, b: 32 }, W = w - pad.l - pad.r, H = h - pad.t - pad.b, i, lo = 0, hi = 6;
            function sx(e) { return pad.l + e / 0.9 * W; } function sy(n) { return pad.t + H - (Math.log10(Math.max(1, n)) - lo) / (hi - lo) * H; }
            c.font = "11px Inter, system-ui, sans-serif";
            for (i = 0; i <= 6; i++) { c.strokeStyle = "rgba(24,32,47,.12)"; c.beginPath(); c.moveTo(pad.l, sy(Math.pow(10, i))); c.lineTo(pad.l + W, sy(Math.pow(10, i))); c.stroke(); c.fillStyle = C.ink3; c.fillText(["1", "10", "10²", "10³", "10⁴", "10⁵", "10⁶"][i], 6, sy(Math.pow(10, i)) + 4); }
            for (i = 0; i <= 9; i += 3) { c.fillStyle = C.ink3; c.fillText(f(i / 10, 1), sx(i / 10) - 8, h - 16); }
            c.fillStyle = C.ink2; c.fillText("ε", pad.l + W / 2, h - 3); c.fillText("N (log)", pad.l + 4, pad.t + 10);
            [[5, C.teal], [8, C.orange], [rs.s, C.ink]].forEach(function (cfg, k) {
              c.beginPath(); var first = true;
              for (var e = 0; e <= 0.9001; e += 0.01) { var n = ransacN(rs.p, e, cfg[0]); if (!isFinite(n)) continue; var y = sy(n); if (first) { c.moveTo(sx(e), y); first = false; } else c.lineTo(sx(e), y); }
              c.strokeStyle = cfg[1]; c.lineWidth = k === 2 ? 3 : 1.6; c.setLineDash(k === 2 ? [] : [5, 4]); c.stroke(); c.setLineDash([]);
            });
            var Nn = ransacN(rs.p, rs.e, rs.s);
            if (isFinite(Nn)) { c.beginPath(); c.arc(sx(rs.e), sy(Nn), 5, 0, 7); c.fillStyle = C.ink; c.fill(); }
            c.fillStyle = C.teal; c.fillText("s = 5", pad.l + 70, pad.t + 10); c.fillStyle = C.orange; c.fillText("s = 8", pad.l + 112, pad.t + 10); c.fillStyle = C.ink; c.fillText("● tanlangan s", pad.l + 156, pad.t + 10);
          };
          upd();
          L.tasks([
            "Ushbu misolda masofani 50 m dan 100 m ga çiqaring: GSD ikki baravar oşadi (taxminan 27,4 mm/px).",
            "p = 0,99 va s = 8 da ε ni 0,5 dan 0,3 ga tuşiring: N 1177 dan 78 ga kamayadi. Nima uçun bunçalik keskin?",
            "Maqsad GSD = 5 mm/px bölsa, kamerani qançalik pastda (taxminan 18,2 m) uçirişingiz kerak?"
          ], "c");
        }
      }
    ]
  });
})();
