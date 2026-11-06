/* 18-mavzu. Renderlaş laboratoriyasi */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt;
  function rgb(c, k) { k = k == null ? 1 : k; return "rgb(" + c.map(function (v) { return Math.round(Math.max(0, Math.min(1, v * k)) * 255); }).join(",") + ")"; }
  function mulberry(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function srgb(c) { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
  function norm(a) { var l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; }

  /* ================= 1-tajriba: sahna ================= */
  var CAM = [0.5, 3], PLX = 1.7, PY0 = 1.2, PY1 = 4.8, EPS = 1e-4;
  var CIRC = { c: [5, 3.1], r: 0.85, col: [0.93, 0.45, 0.25] };
  var SEGS = [
    { a: [1.8, 0.5], b: [10, 0.5], mat: "d", col: [0.55, 0.65, 0.8], name: "pol" },
    { a: [8.6, 1.0], b: [7.6, 4.6], mat: "m", col: [0.7, 0.75, 0.82], name: "közgu 1" },
    { a: [3.2, 5.6], b: [7.4, 5.6], mat: "m", col: [0.7, 0.75, 0.82], name: "közgu 2" }
  ];
  var POLYN = 14;
  function circlePoly() { var v = []; for (var i = 0; i < POLYN; i++) { var a = 2 * Math.PI * i / POLYN; v.push([CIRC.c[0] + CIRC.r * Math.cos(a), CIRC.c[1] + CIRC.r * Math.sin(a)]); } return v; }
  var POLY = circlePoly();
  function polySegs() {
    var out = [];
    for (var i = 0; i < POLYN; i++) out.push({ a: POLY[i], b: POLY[(i + 1) % POLYN], mat: "d", col: CIRC.col });
    return out;
  }
  function hitSeg(o, d, s) {
    var e = sub(s.b, s.a), den = cross(d, e);
    if (Math.abs(den) < 1e-9) return null;
    var ao = sub(s.a, o), t = cross(ao, e) / den, u = cross(ao, d) / den;
    if (t < EPS || u < 0 || u > 1) return null;
    var n = norm([-e[1], e[0]]); if (dot(n, d) > 0) n = [-n[0], -n[1]];
    return { t: t, n: n, s: s };
  }
  function hitCirc(o, d) {
    var oc = sub(o, CIRC.c), b = dot(oc, d), cc = dot(oc, oc) - CIRC.r * CIRC.r, disc = b * b - cc;
    if (disc < 0) return null;
    var t = -b - Math.sqrt(disc); if (t < EPS) return null;
    var p = [o[0] + d[0] * t, o[1] + d[1] * t];
    return { t: t, n: norm(sub(p, CIRC.c)), s: { mat: "d", col: CIRC.col } };
  }
  function hitAll(o, d, raster) {
    var best = null, list = raster ? SEGS.concat(polySegs()) : SEGS;
    list.forEach(function (s) { var h = hitSeg(o, d, s); if (h && (!best || h.t < best.t)) best = h; });
    if (!raster) { var h = hitCirc(o, d); if (h && (!best || h.t < best.t)) best = h; }
    if (best) best.p = [o[0] + d[0] * best.t, o[1] + d[1] * best.t];
    return best;
  }

  function tab1(L) {
    var st = { mode: "rt", n: 8, bounce: 2, shadow: true, light: [5.2, 4.95] };
    var cv = L.canvas({ aspect: 0.64, hint: "Sariq nur manbaini sudrang" });
    var R = L.readout([["p", "Birlamçi nurlar"], ["r", "Qaytgan nurlar"], ["s", "Soya nurlari"], ["t", "Jami nurlar"]]);
    L.add(EX.el("div", { class: "legend", html: '<span><i style="background:#3E63DD"></i>birlamçi nur</span><span><i style="background:#8E4EC6"></i>qaytgan nur</span><span><i style="background:#D9A400"></i>soya nuri (yoritilgan)</span><span><i style="background:#7A8396"></i>soya nuri (tösilgan)</span><span><i style="background:#E8590C"></i>proyeksiya çiziqlari</span>' }), "main");
    var sc, ox, oy;
    function W(p) { return [ox + p[0] * sc, oy - p[1] * sc]; }
    function trace(i) {
      var yi = PY0 + (i + 0.5) * (PY1 - PY0) / st.n, d = norm([PLX - CAM[0], yi - CAM[1]]), o = CAM.slice();
      var segs = [], cnt = { p: 1, r: 0, s: 0 }, kind = "p", tint = 1, bounces = 0, col, raster = st.mode === "ras";
      for (;;) {
        var h = hitAll(o, d, raster);
        if (!h) { segs.push([o, [o[0] + d[0] * 14, o[1] + d[1] * 14], kind]); col = [0.55 * tint, 0.72 * tint, 0.95 * tint]; break; }
        segs.push([o, h.p, kind]);
        var s = h.s;
        if (s.mat === "m" && !raster) {
          if (bounces < st.bounce) { bounces++; cnt.r++; var dn = dot(d, h.n); d = norm([d[0] - 2 * dn * h.n[0], d[1] - 2 * dn * h.n[1]]); o = h.p; kind = "r"; tint *= 0.92; continue; }
          col = [0.03, 0.03, 0.04]; break;
        }
        var l = norm(sub(st.light, h.p)), ndl = Math.max(0, dot(h.n, l)), lit = 1;
        if (!raster && st.shadow) {
          cnt.s++;
          var dist = Math.hypot(st.light[0] - h.p[0], st.light[1] - h.p[1]), o2 = [h.p[0] + h.n[0] * 2e-3, h.p[1] + h.n[1] * 2e-3], h2 = hitAll(o2, l, false);
          if (h2 && h2.t < dist) { lit = 0; segs.push([h.p, h2.p, "so"]); } else segs.push([h.p, st.light, "sl"]);
        }
        var k = 0.18 + 0.82 * ndl * lit;
        col = s.col.map(function (v) { return v * k * tint; }); break;
      }
      return { segs: segs, col: col, cnt: cnt, y: yi };
    }
    cv.draw = function (c, w, h) {
      sc = Math.min(w / 10.3, h / 6.3); ox = (w - 10 * sc) / 2; oy = h - (h - 6 * sc) / 2;
      var i, raster = st.mode === "ras";
      // pol va közgular
      c.fillStyle = "#F3F5FA"; c.fillRect(0, 0, w, h);
      var a = W([1.8, 0.5]), b = W([10, 0.5]);
      c.fillStyle = "rgba(85,105,140,.25)"; c.fillRect(a[0], a[1], b[0] - a[0], h - a[1]);
      c.strokeStyle = rgb(SEGS[0].col, 0.7); c.lineWidth = 3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      // doira yoki köpburçak
      c.beginPath();
      if (raster) POLY.forEach(function (p, k) { var q = W(p); if (k) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
      else { var cc = W(CIRC.c); c.arc(cc[0], cc[1], CIRC.r * sc, 0, 7); }
      c.closePath(); c.fillStyle = rgb(CIRC.col, 0.85); c.fill(); c.strokeStyle = "#7A3A1A"; c.lineWidth = 1.5; c.stroke();
      [1, 2].forEach(function (k) {
        var s = SEGS[k], p = W(s.a), q = W(s.b);
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.strokeStyle = "#0C9488"; c.lineWidth = 4.5; c.stroke();
        c.strokeStyle = "#BFEFE9"; c.lineWidth = 1.5; c.stroke();
      });
      var mp = W([8.1, 2.8]); c.font = "600 11px Inter, system-ui, sans-serif"; c.fillStyle = "#0C9488"; c.fillText("közgu", mp[0] + 8, mp[1]);
      var cp = W([CIRC.c[0], CIRC.c[1] - 1.2]); c.fillStyle = "#7A3A1A"; c.textAlign = "center"; c.fillText(raster ? "köpburçak (14 qirra)" : "diffuz sfera", cp[0], cp[1]); c.textAlign = "left";
      // nurlar
      var rays = [], tot = { p: 0, r: 0, s: 0 };
      for (i = 0; i < st.n; i++) { var t = trace(i); rays.push(t); tot.p += t.cnt.p; tot.r += t.cnt.r; tot.s += t.cnt.s; }
      var kc = { p: "#3E63DD", r: "#8E4EC6", sl: "#D9A400", so: "#7A8396" };
      if (raster) {
        // proyeksiya: har bir çöqqi kameraga çiziq va tasvir tekisligida nuqta
        var verts = POLY.concat([SEGS[0].b, SEGS[1].a, SEGS[1].b, SEGS[2].a, SEGS[2].b]), vis = 0;
        verts.forEach(function (v) {
          var k = (PLX - CAM[0]) / (v[0] - CAM[0]), y = CAM[1] + (v[1] - CAM[1]) * k, p0 = W(CAM), p1 = W(v), q = W([PLX, y]);
          var inside = y >= PY0 && y <= PY1; if (inside) vis++;
          c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.strokeStyle = "rgba(232,89,12,.28)"; c.lineWidth = 1; c.stroke();
          c.beginPath(); c.arc(q[0], q[1], inside ? 3.2 : 2, 0, 7); c.fillStyle = inside ? "#E8590C" : "rgba(232,89,12,.4)"; c.fill();
        });
        R.setMany({ p: f(st.n, 0) + " (z-buffer sinovi)", r: "0", s: "0", t: "0 nur · " + f(verts.length, 0) + " çöqqi" });
      } else {
        rays.forEach(function (t) {
          t.segs.forEach(function (sg) {
            var p = W(sg[0]), q = W(sg[1]), kk = sg[2];
            c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
            c.strokeStyle = kc[kk]; c.lineWidth = kk === "p" || kk === "r" ? 1.6 : 1.2; c.globalAlpha = kk === "so" || kk === "sl" ? 0.9 : 0.85;
            c.setLineDash(kk === "sl" || kk === "so" ? [4, 3] : []); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
          });
        });
        R.setMany({ p: f(tot.p, 0), r: f(tot.r, 0), s: f(tot.s, 0), t: f(tot.p + tot.r + tot.s, 0) });
      }
      // tasvir tekisligi (piksellar)
      var pw = 11, p0 = W([PLX, PY1]), p1 = W([PLX, PY0]), ph = (p1[1] - p0[1]) / st.n;
      rays.forEach(function (t, k) { c.fillStyle = rgb(t.col); c.fillRect(p0[0] - pw / 2, p0[1] + k * ph, pw, ph); c.strokeStyle = "#18202F"; c.lineWidth = 1; c.strokeRect(p0[0] - pw / 2, p0[1] + k * ph, pw, ph); });
      c.font = "600 11px Inter, system-ui, sans-serif"; c.fillStyle = "#18202F"; c.fillText("tasvir tekisligi", p0[0] - 20, p0[1] - 8);
      // kamera
      var cm = W(CAM); c.beginPath(); c.moveTo(cm[0] - 12, cm[1] - 9); c.lineTo(cm[0] + 2, cm[1]); c.lineTo(cm[0] - 12, cm[1] + 9); c.closePath(); c.fillStyle = "#18202F"; c.fill();
      c.fillText("kamera", cm[0] - 18, cm[1] + 24);
      // yoruğlik
      var lp = W(st.light); c.strokeStyle = "#D9A400"; c.lineWidth = 2;
      for (i = 0; i < 8; i++) { var an = i * Math.PI / 4; c.beginPath(); c.moveTo(lp[0] + Math.cos(an) * 10, lp[1] + Math.sin(an) * 10); c.lineTo(lp[0] + Math.cos(an) * 15, lp[1] + Math.sin(an) * 15); c.stroke(); }
      c.beginPath(); c.arc(lp[0], lp[1], 8, 0, 7); c.fillStyle = "#FFD43B"; c.fill(); c.strokeStyle = "#D9A400"; c.stroke();
    };
    // yoruğlikni sudraş
    var drag = false, cvEl = cv.canvas;
    function pos(e) { var r = cvEl.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cvEl.addEventListener("pointerdown", function (e) { var p = pos(e), lp = W(st.light); if (Math.hypot(p[0] - lp[0], p[1] - lp[1]) < 28) { drag = true; cvEl.setPointerCapture(e.pointerId); } });
    cvEl.addEventListener("pointermove", function (e) {
      if (!drag) return; var p = pos(e);
      st.light = [Math.max(0.5, Math.min(9.7, (p[0] - ox) / sc)), Math.max(1.2, Math.min(5.5, (oy - p[1]) / sc))]; cv.redraw();
    });
    cvEl.addEventListener("pointerup", function () { drag = false; });
    cvEl.addEventListener("pointercancel", function () { drag = false; });
    var bs;
    L.seg("Usul", [["ras", "Rasterlaş"], ["rt", "Nur kuzatiş (ray tracing)"]], "rt", function (v) {
      st.mode = v; bs.input.disabled = v === "ras"; shT.input.disabled = v === "ras"; cv.redraw();
    });
    L.slider({ label: "Tasvir piksellari soni", min: 4, max: 16, step: 1, value: 8, nd: 0 }, function (v) { st.n = v; cv.redraw(); });
    bs = L.slider({ label: "Qaytiş soni (bounce)", min: 0, max: 4, step: 1, value: 2, nd: 0 }, function (v) { st.bounce = v; cv.redraw(); });
    var shT = L.toggle("Soya nurlari (yoruğlik manbaiga)", true, function (v) { st.shadow = v; cv.redraw(); });
    L.button("Yoruğlikni boşlanğiç joyiga", function () { st.light = [5.2, 4.95]; cv.redraw(); });
    L.note("<b>Rasterlaş:</b> sahna geometriyasi (uçburçaklar; bu 2D kesimda — kesmalar) kameraga proyeksiyalanadi, har bir piksel uçun eng yaqin yuza z-buffer orqali tanlanadi. Soya va qaytişlar alohida usullar bilan taqlid qilinadi. <b>Nur kuzatiş:</b> har bir piksel uçun nur yuboriladi; közgudan qaytgan nur davom etadi, diffuz yuzada esa yoruğlikka soya nuri tekşiriladi.", "main");
    L.tasks([
      "«Nur kuzatiş»da qaytiş sonini 0 dan 4 gaça oşiring: közguda körinadigan piksellar rangi qanday özgaradi? Jami nurlar soni-çi? [0 da közgu pikseli qora, çunki qaytgan nur hisoblanmaydi]",
      "Yoruğlik manbaini sfera ostiga yoki ustiga sudrang: qaysi pol piksellari soyada qoladi (kulrang punktir nurlar)?",
      "«Rasterlaş»ga ötib, tasvir tekisligidagi proyeksiya nuqtalarini kuzating: nima uçun bu rejimda soya va közgu qaytişi körinmaydi, nurlar soni esa 0?"
    ], "a");
  }

  /* ================= 2-tajriba: Monte-Karlo ================= */
  var IW = 40, IH = 28, KMAX = 10, LH = 2.5, DH = 1.2, DR = 0.55, DC = [0.3, 0];
  function pixelPos(ix, iy) { return [-2 + 4 * (ix + 0.5) / IW, -1.4 + 2.8 * (iy + 0.5) / IH]; }
  function sample(p, ux, uz) {
    var qx = p[0] + 0.48 * (ux - p[0]), qz = p[1] + 0.48 * (uz - p[1]);
    if ((qx - DC[0]) * (qx - DC[0]) + (qz - DC[1]) * (qz - DC[1]) < DR * DR) return 0;
    var d2 = (ux - p[0]) * (ux - p[0]) + (uz - p[1]) * (uz - p[1]) + LH * LH;
    return 6.25 * 6.25 / (d2 * d2);
  }
  function tab2(L) {
    var st = { k: 2, seed: 7, size: 1.0, view: "ref" }, data = null;
    var cv = L.canvas({ aspect: 0.5, hint: "" }), pl = L.canvas({ aspect: 0.62, hint: "" });
    var R = L.readout([["n", "Namunalar N"], ["e", "RMSE(N)"], ["q", "RMSE(N) / RMSE(4N)"], ["s", "log–log qiyalik"]]);
    var off = document.createElement("canvas"); off.width = IW; off.height = IH; var octx = off.getContext("2d"), img = octx.createImageData(IW, IH);
    function compute() {
      var rnd = mulberry(st.seed * 7919 + 13), s = st.size, i, j, k, ref = new Float32Array(IW * IH), levels = [], rm = [];
      var M = 56;
      for (j = 0; j < IH; j++) for (i = 0; i < IW; i++) {
        var p = pixelPos(i, j), acc = 0, a, b;
        for (a = 0; a < M; a++) for (b = 0; b < M; b++) acc += sample(p, (-0.5 + (a + 0.5) / M) * s, (-0.5 + (b + 0.5) / M) * s);
        ref[j * IW + i] = acc / (M * M);
      }
      for (k = 0; k <= KMAX; k++) {
        var N = 1 << k, im = new Float32Array(IW * IH), se = 0;
        for (j = 0; j < IH; j++) for (i = 0; i < IW; i++) {
          var p2 = pixelPos(i, j), ac = 0;
          for (var m = 0; m < N; m++) ac += sample(p2, (rnd() - 0.5) * s, (rnd() - 0.5) * s);
          var v = ac / N; im[j * IW + i] = v; se += (v - ref[j * IW + i]) * (v - ref[j * IW + i]);
        }
        levels.push(im); rm.push(Math.sqrt(se / (IW * IH)));
      }
      data = { ref: ref, levels: levels, rmse: rm };
    }
    function paint(c, arr, x, y, w, h, err) {
      var d = img.data, n = IW * IH;
      for (var q = 0; q < n; q++) {
        var v = err ? Math.min(1, Math.abs(arr[q] - data.ref[q]) * 4 * 6.25) : Math.min(1, arr[q] * 6.25);
        v = err ? v : 0.1 + 0.9 * v; var g = Math.round(255 * Math.pow(v, 1 / 2.2));
        d[q * 4] = err ? g : Math.min(255, g * 1.02); d[q * 4 + 1] = err ? Math.round(g * 0.55) : g * 0.97; d[q * 4 + 2] = err ? Math.round(g * 0.3) : g * 0.9; d[q * 4 + 3] = 255;
      }
      octx.putImageData(img, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(off, x, y, w, h);
    }
    cv.draw = function (c, w, h) {
      if (!data) return;
      var gap = 10, pw = (w - 3 * gap) / 2, ph = pw * IH / IW, y0 = 26, N = 1 << st.k;
      c.font = "700 13px Inter, system-ui, sans-serif"; c.fillStyle = "#18202F";
      c.fillText("N = " + f(N, 0) + " namuna / piksel", gap, 18);
      c.fillText(st.view === "ref" ? "Etalon (tekis 56×56)" : "Xato |farq|×4", 2 * gap + pw, 18);
      paint(c, data.levels[st.k], gap, y0, pw, ph, false);
      paint(c, st.view === "ref" ? data.ref : data.levels[st.k], 2 * gap + pw, y0, pw, ph, st.view !== "ref");
      c.strokeStyle = "#18202F"; c.lineWidth = 1; c.strokeRect(gap, y0, pw, ph); c.strokeRect(2 * gap + pw, y0, pw, ph);
      c.font = "12px Inter, system-ui, sans-serif"; c.fillStyle = "#4A5468";
      c.fillText("Yoruğlik manbai: kvadrat, tomoni " + f(st.size, 2) + " m", gap, y0 + ph + 18);
    };
    pl.draw = function (c, w, h) {
      if (!data) return;
      var l = 46, r = 12, t = 14, b = 36, W = w - l - r, H = h - t - b, rm = data.rmse;
      var lo = Math.floor(Math.log10(Math.min.apply(null, rm)) - 0.05), hi = Math.ceil(Math.log10(Math.max.apply(null, rm)) + 0.02);
      function sx(k) { return l + k / KMAX * W; } function sy(v) { return t + (hi - Math.log10(v)) / (hi - lo) * H; }
      c.font = "11px Inter, system-ui, sans-serif"; c.fillStyle = "#7A8396"; c.strokeStyle = "rgba(24,32,47,.12)"; c.lineWidth = 1;
      for (var d = lo; d <= hi; d++) { var yy = sy(Math.pow(10, d)); c.beginPath(); c.moveTo(l, yy); c.lineTo(l + W, yy); c.stroke(); c.textAlign = "right"; c.fillText("1e" + (d < 0 ? "−" + Math.abs(d) : d), l - 5, yy + 4); }
      c.textAlign = "center";
      for (var k = 0; k <= KMAX; k += 2) { c.beginPath(); c.moveTo(sx(k), t); c.lineTo(sx(k), t + H); c.stroke(); c.fillText(f(1 << k, 0), sx(k), t + H + 14); }
      c.fillStyle = "#4A5468"; c.fillText("namunalar soni N (log, har qadam ×4)", l + W / 2, h - 6);
      c.save(); c.translate(11, t + H / 2); c.rotate(-Math.PI / 2); c.fillText("RMSE (log)", 0, 0); c.restore(); c.textAlign = "left";
      // 1/sqrt(N) tayanç çizigi
      c.beginPath(); for (k = 0; k <= KMAX; k++) { var v = rm[0] / Math.sqrt(1 << k); if (k) c.lineTo(sx(k), sy(v)); else c.moveTo(sx(k), sy(v)); }
      c.strokeStyle = "#7A8396"; c.lineWidth = 2; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
      c.beginPath(); rm.forEach(function (v, kk) { if (kk) c.lineTo(sx(kk), sy(v)); else c.moveTo(sx(kk), sy(v)); }); c.strokeStyle = C.z; c.lineWidth = 2.5; c.stroke();
      rm.forEach(function (v, kk) { c.beginPath(); c.arc(sx(kk), sy(v), kk === st.k ? 6 : 3, 0, 7); c.fillStyle = kk === st.k ? C.orange : C.z; c.fill(); });
      c.font = "600 12px Inter, system-ui, sans-serif"; c.fillStyle = C.z; c.fillText("ölçangan RMSE", l + 8, t + 14);
      c.fillStyle = "#7A8396"; c.fillText("1/√N (tayanç)", l + 8, t + 30);
      // readout
      var sxs = 0, sys = 0, sxy = 0, sxx = 0, n = rm.length;
      rm.forEach(function (v, kk) { var x = kk * Math.log10(2), y = Math.log10(v); sxs += x; sys += y; sxy += x * y; sxx += x * x; });
      var slope = (n * sxy - sxs * sys) / (n * sxx - sxs * sxs);
      R.setMany({ n: f(1 << st.k, 0), e: f(rm[st.k], 4), q: st.k + 2 <= KMAX ? f(rm[st.k] / rm[st.k + 2], 2) : "—", s: f(slope, 2) });
    };
    function refresh() { compute(); cv.redraw(); pl.redraw(); }
    var rq = 0; function later() { if (rq) return; rq = requestAnimationFrame(function () { rq = 0; refresh(); }); }
    L.slider({ label: "Namunalar soni N (log)", min: 0, max: KMAX, step: 1, value: st.k, fmt: function (v) { return f(1 << v, 0) + " (2^" + v + ")"; } }, function (v) { st.k = v; cv.redraw(); pl.redraw(); });
    L.slider({ label: "Manba ölçami (yumşoqlik)", min: 0.2, max: 2, step: 0.1, value: 1, nd: 1, unit: "m" }, function (v) { st.size = v; later(); });
    L.seg("Öng tasvir", [["ref", "Etalon"], ["err", "Xato xaritasi"]], "ref", function (v) { st.view = v; cv.redraw(); });
    L.button("Yangi uruğ (seed) — boşqa şovqin", function () { st.seed++; later(); }, "ghost");
    L.note("Pikseldagi yoruğlik — yoruğlik manbai yuzi bölib integral: E ≈ (A/N)·Σ V<sub>i</sub>·cosθ·cosθ′/r². Har bir namuna — manba yuzidagi tasodifiy nuqta; V = 1 (körinadi) yoki 0 (tösilgan). Xato <b>1/√N</b> kabi kamayadi: namunalar 4 marta köp bölsa, şovqin (RMSE) ≈ 2 marta kam. RNG uruği qatʼiy (seeded), şuning uçun natija takrorlanadi.");
    refresh();
    L.tasks([
      "N = 1 dan boşlab 4 marta oşirib boring (1, 4, 16, 64…): «RMSE(N) / RMSE(4N)» nisbati ≈ 2 ga yaqinmi? [Ha, çunki RMSE ∝ 1/√N]",
      "Manba ölçamini 0,2 m dan 2 m gaça özgartiring: soyaning yumşoqligi va bir xil N dagi şovqin qanday özgaradi? Penumbra (yarim soya) çegarasidagi piksellarda şovqin eng kuçli bölişini «Xato xaritasi»da tekşiring.",
      "«Yangi uruğ» tugmasini bosing: tasvirdagi şovqin naqşi özgaradi, log–log çiziq qiyaligi esa (≈ −0,5) deyarli özgarmaydi."
    ], "b");
  }

  /* ================= 3-tajriba: ekspozitsiya ================= */
  var HW = 160, HH = 100, HDR = null;
  function buildHDR() {
    var a = new Float32Array(HW * HH * 3), x, y;
    for (y = 0; y < HH; y++) for (x = 0; x < HW; x++) {
      var q = (y * HW + x) * 3, L, col;
      if (y < 56) { L = 0.35 + 0.55 * (y / 56); col = [0.55, 0.75, 1.0]; if (Math.hypot(x - 120, y - 18) < 7) { L = 400; col = [1, 0.95, 0.8]; } else if (Math.hypot(x - 120, y - 18) < 13) { L += 12 * (1 - (Math.hypot(x - 120, y - 18) - 7) / 6); } }
      else { L = 0.02 + 0.12 * Math.max(0, (x - 0) / HW); col = [0.8, 0.7, 0.55]; }
      if (y >= 60 && y < 82) { var k = Math.floor(x / 20); if (k >= 0 && k < 8 && (x % 20) >= 2 && (x % 20) < 18) { L = 0.18 * Math.pow(2, k - 3); col = [1, 1, 1]; } }
      a[q] = col[0] * L; a[q + 1] = col[1] * L; a[q + 2] = col[2] * L;
    }
    return a;
  }
  function tone(v, mode) { return mode === "clip" ? Math.min(1, v) : v / (1 + v); }
  function tab3(L) {
    if (!HDR) HDR = buildHDR();
    var st = { ev: 0, mode: "clip" };
    var cv = L.canvas({ aspect: 0.98, hint: "" });
    var R = L.readout([["k", "Koeffitsiyent 2^EV"], ["w", "Oq (≥ 253/255)"], ["b", "Qora (≤ 2/255)"], ["g", "18 % kulrang karta kodi"]]);
    var off = document.createElement("canvas"); off.width = HW; off.height = HH; var octx = off.getContext("2d"), img = octx.createImageData(HW, HH);
    cv.draw = function (c, w, h) {
      var k = Math.pow(2, st.ev), d = img.data, n = HW * HH, hist = new Array(32).fill(0), white = 0, black = 0, q;
      for (q = 0; q < n; q++) {
        var cc = [0, 0, 0];
        for (var ch = 0; ch < 3; ch++) { cc[ch] = Math.round(255 * srgb(tone(HDR[q * 3 + ch] * k, st.mode))); d[q * 4 + ch] = cc[ch]; }
        d[q * 4 + 3] = 255;
        var lum = 0.2126 * cc[0] + 0.7152 * cc[1] + 0.0722 * cc[2];
        hist[Math.min(31, Math.floor(lum / 8))]++;
        if (lum >= 253) white++; if (lum <= 2) black++;
      }
      octx.putImageData(img, 0, 0); c.imageSmoothingEnabled = true;
      var iw = w - 20, ih = iw * HH / HW; c.drawImage(off, 10, 8, iw, ih);
      c.strokeStyle = "#18202F"; c.strokeRect(10, 8, iw, ih);
      c.font = "700 11px Inter, system-ui, sans-serif"; c.textAlign = "center";
      for (var p = 0; p < 8; p++) { var tx = 10 + (p * 20 + 10) / HW * iw, ty = 8 + 91 / HH * ih; c.fillStyle = "#fff"; c.fillText((p - 3 > 0 ? "+" : p - 3 < 0 ? "−" : "") + Math.abs(p - 3), tx + 0.5, ty + 0.5); c.fillStyle = "#18202F"; c.fillText((p - 3 > 0 ? "+" : p - 3 < 0 ? "−" : "") + Math.abs(p - 3), tx, ty); }
      c.textAlign = "left";
      // gistogramma
      var hy = ih + 40, hh = h - hy - 28, mx = Math.max.apply(null, hist.map(Math.sqrt));
      c.fillStyle = "#4A5468"; c.font = "600 12px Inter, system-ui, sans-serif"; c.fillText("Gistogramma (kod 0…255; balandlik — √sanoq)", 10, hy - 8);
      var bw = iw / 32;
      hist.forEach(function (v, i) { var bh = Math.sqrt(v) / mx * hh; c.fillStyle = i === 0 ? "#18202F" : i === 31 ? "#E8590C" : "#3E63DD"; c.fillRect(10 + i * bw + 1, hy + hh - bh, bw - 2, bh); });
      c.strokeStyle = "#18202F"; c.beginPath(); c.moveTo(10, hy + hh); c.lineTo(10 + iw, hy + hh); c.stroke();
      c.fillStyle = "#7A8396"; c.font = "11px Inter, system-ui, sans-serif"; c.fillText("0", 10, hy + hh + 14); c.textAlign = "right"; c.fillText("255", 10 + iw, hy + hh + 14); c.textAlign = "left";
      var gcode = Math.round(255 * srgb(tone(0.18 * k, st.mode)));
      R.setMany({ k: "×" + f(k, 3), w: f(white / n * 100, 1) + " %", b: f(black / n * 100, 1) + " %", g: f(gcode, 0) });
    };
    L.slider({ label: "Ekspozitsiya kompensatsiyasi EV", min: -4, max: 4, step: 0.25, value: 0, nd: 2, fmt: function (v) { return (v > 0 ? "+" : "") + f(v, 2) + " EV"; } }, function (v) { st.ev = v; cv.redraw(); });
    L.seg("Ton xaritalaş (tone mapping)", [["clip", "Kesiş (clip): min(1; x)"], ["rh", "Reinhard: x / (1 + x)"]], "clip", function (v) { st.mode = v; cv.redraw(); });
    L.button("EV = 0", function () { document.querySelector(".lab-panel:not([hidden]) input[type=range]").value = 0; document.querySelector(".lab-panel:not([hidden]) input[type=range]").dispatchEvent(new Event("input")); });
    L.note("Çiziqli (HDR) yoruğlik x → <b>x′ = x·2<sup>EV</sup></b>: +1 EV — yoruğlik 2 marta köp (1 stop). Söng ton xaritalaş x′ ni [0; 1] ga keltiradi (kesiş yoki Reinhard, har bir kanal uçun), keyin sRGB gamma kodlanadi. Sahna HDR: quyoş ≈ 400, 18 % kulrang karta = 0,18, qorongi joylar ≈ 0,02.");
    L.tasks([
      "«Kesiş» rejimida EV ni +4 ga oşiring: oq piksellar uluşi qanday özgaradi? Quyoş va osmon teksturasi (gistogrammadagi oxirgi ustun) nima bölmoqda? [maʼlumot yöqoladi — burnt highlights]",
      "EV = −4 da qora piksellar uluşini yozing, söng +4 ga ötib qiyoslang. Qaysi ekspozitsiyada pol detallari körinadi?",
      "Reinhard ga ötib EV = +3 qiling: oq yuzalar kesiş rejimidagiga qaraganda qanday körinadi (siqilgan, lekin kesilmagan)? Gistogrammada nima özgardi?"
    ], "c");
  }

  LAB.start({
    intro: "Renderlaş — sahnaning matematik tavsifidan tasvir hosil qiliş. Bir xil sahnani ikki usulda (rasterlaş va nur kuzatiş) körasiz, söng Monte-Karlo usulida tasodifiy namunalar şovqinini va kameraning ekspozitsiyasini sinaysiz.",
    tabs: [
      { name: "Rasterlaş ↔ nur kuzatiş", lead: "Kameradan tasvir tekisligidagi har bir piksel uçun nur yuboriladi (nur kuzatiş) yoki geometriya tekislikka proyeksiyalanadi (rasterlaş). Qaytiş sonini oşirib, nurlar soni va közgudagi tasvir özgarişini kuzating.", build: tab1 },
      { name: "Monte-Karlo va şovqin", lead: "Yumşoq soya (kvadrat yoruğlik manbai) har bir piksel uçun N ta tasodifiy namuna bilan baholanadi. N ni oşiring: şovqin kamayadi, lekin faqat 1/√N qonuniga köra.", build: tab2 },
      { name: "Ekspozitsiya (EV)", lead: "EV slayderi çiziqli yoruğlikni 2<sup>EV</sup> marta özgartiradi. Oq (kesilgan) va qora piksellar uluşini gistogrammada kuzating; ton xaritalaş usulini almaştiring.", build: tab3 }
    ]
  });
})();
