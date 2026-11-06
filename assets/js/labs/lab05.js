/* 5-mavzu. Vertex, Edge, Face */
(function () {
  var X = window.X3D, V = X.v, C = LAB.C, f = X.fmt;

  function clone(m) { return { v: m.v.map(function (p) { return p.slice(); }), f: m.f.map(function (q) { return q.slice(); }) }; }
  function cubeM() { return clone(X.mesh.cube(2)); }
  function houseM() {
    var v = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, 1.2], [1, -1, 1.2], [1, 1, 1.2], [-1, 1, 1.2], [-1, 0, 2], [1, 0, 2]]
      .map(function (p) { return [p[0], p[1], p[2] - 1]; });
    return { v: v, f: [[0, 3, 2, 1], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [7, 4, 8], [5, 6, 9], [4, 5, 9, 8], [6, 7, 8, 9]] };
  }
  function fpts(m, fi) { return m.f[fi].map(function (k) { return m.v[k]; }); }
  function centroid(pts) { var c = [0, 0, 0]; pts.forEach(function (p) { c = V.add(c, p); }); return V.mul(c, 1 / pts.length); }
  function area(pts) {
    var s = [0, 0, 0];
    for (var i = 0; i < pts.length; i++) s = V.add(s, V.cross(pts[i], pts[(i + 1) % pts.length]));
    return V.len(s) / 2;
  }
  // çöqqi normallari: yoq normallarining burçak böyiça vaznlangan yiğindisi
  function vertexNormals(m) {
    var acc = m.v.map(function () { return [0, 0, 0]; });
    m.f.forEach(function (F, fi) {
      var pts = fpts(m, fi), n = X.mesh.normal(pts), k = F.length;
      for (var i = 0; i < k; i++) {
        var p = pts[i], a = V.norm(V.sub(pts[(i - 1 + k) % k], p)), b = V.norm(V.sub(pts[(i + 1) % k], p));
        var ang = Math.acos(Math.max(-1, Math.min(1, V.dot(a, b))));
        acc[F[i]] = V.add(acc[F[i]], V.mul(n, ang));
      }
    });
    return acc.map(V.norm);
  }
  // Extrude / Inset: tanlangan yoq ornini «qopqoq» egallaydi, har bir qirra uçun bitta yon törtburçak qöşiladi
  function applyOp(m, fi, type, amt) {
    var r = clone(m), F = r.f[fi], n = F.length, pts = F.map(function (k) { return m.v[k]; });
    var N = X.mesh.normal(pts), c = centroid(pts), base = r.v.length, i;
    for (i = 0; i < n; i++) {
      var p = pts[i];
      r.v.push(type === "extrude" ? V.add(p, V.mul(N, amt)) : V.add(c, V.mul(V.sub(p, c), 1 - amt)));
    }
    r.f[fi] = F.map(function (_, j) { return base + j; });
    for (i = 0; i < n; i++) r.f.push([F[i], F[(i + 1) % n], base + (i + 1) % n, base + i]);
    return r;
  }
  // yopiqlik va yönalişlar tekşiruvi: har bir yönalgan qirra aynan bir marta, teskarisi ham aynan bir marta
  function check(m) {
    var d = {}, ok = true;
    m.f.forEach(function (F) { for (var i = 0; i < F.length; i++) { var k = F[i] + ">" + F[(i + 1) % F.length]; d[k] = (d[k] || 0) + 1; } });
    Object.keys(d).forEach(function (k) { var p = k.split(">"); if (d[k] !== 1 || d[p[1] + ">" + p[0]] !== 1) ok = false; });
    return ok;
  }
  function pip(x, y, P) {
    var inside = false;
    for (var i = 0, j = P.length - 1; i < P.length; j = i++)
      if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) inside = !inside;
    return inside;
  }

  /* ---- z-bufferli rasterizator bilan çizadigan element ---- */
  function Surf(ed) { this.ed = ed; this.visible = true; this.off = document.createElement("canvas"); }
  Surf.prototype.collect = function (S, out) {
    var ed = this.ed, m = ed.cur(), B = S._B, st = ed.flags, self = this;
    var sc = Math.min(1, 420 / S.w), W = Math.max(2, Math.round(S.w * sc)), H = Math.max(2, Math.round(S.h * sc));
    var off = this.off; if (off.width !== W || off.height !== H) { off.width = W; off.height = H; }
    var octx = off.getContext("2d"), img = octx.createImageData(W, H), D = img.data, zb = new Float32Array(W * H);
    for (var q = 0; q < zb.length; q++) zb[q] = Infinity;
    var P = m.v.map(function (p) { var s = S.project(p, B); return [s[0] * sc, s[1] * sc, s[2]]; });
    var vn = st.smooth ? vertexNormals(m) : null, L = S.light, Vw = V.mul(B.f, -1), Hh = V.norm(V.add(L, Vw));
    var frontFace = [], fnorm = [], fcen = [];
    m.f.forEach(function (F, fi) {
      var pts = F.map(function (k) { return m.v[k]; }), n = X.mesh.normal(pts), cen = centroid(pts);
      fnorm.push(n); fcen.push(cen);
      var facing = V.dot(n, V.norm(V.sub(B.e, cen))) > 0;
      frontFace.push(facing);
      if (!facing) return;
      var sel = ed.sel && ed.sel.mode === "f" && ed.sel.id === fi;
      var col = sel ? [250, 168, 84] : [201, 212, 245];
      for (var t = 1; t < F.length - 1; t++) tri([F[0], F[t], F[t + 1]], n, col);
    });
    function tri(ix, fn, col) {
      var a = P[ix[0]], b = P[ix[1]], c = P[ix[2]];
      var den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(den) < 1e-9) return;
      var x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
      var y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      var ia = 1 / a[2], ib = 1 / b[2], ic = 1 / c[2];
      var na = vn && vn[ix[0]], nb = vn && vn[ix[1]], nc = vn && vn[ix[2]];
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
        var px = x + 0.5, py = y + 0.5;
        var l0 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / den;
        var l1 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / den;
        var l2 = 1 - l0 - l1;
        if (l0 < -1e-6 || l1 < -1e-6 || l2 < -1e-6) continue;
        var w0 = l0 * ia, w1 = l1 * ib, w2 = l2 * ic, ws = w0 + w1 + w2, z = 1 / ws, o = y * W + x;
        if (z >= zb[o]) continue;
        zb[o] = z;
        var nx, ny, nz;
        if (vn) {
          nx = (w0 * na[0] + w1 * nb[0] + w2 * nc[0]) / ws; ny = (w0 * na[1] + w1 * nb[1] + w2 * nc[1]) / ws; nz = (w0 * na[2] + w1 * nb[2] + w2 * nc[2]) / ws;
          var ll = Math.hypot(nx, ny, nz) || 1; nx /= ll; ny /= ll; nz /= ll;
        } else { nx = fn[0]; ny = fn[1]; nz = fn[2]; }
        var nl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), nh = Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]);
        var k = 0.4 + 0.6 * nl, sp = 40 * Math.pow(nh, 30), p = o * 4;
        D[p] = Math.min(255, col[0] * k + sp); D[p + 1] = Math.min(255, col[1] * k + sp); D[p + 2] = Math.min(255, col[2] * k + sp); D[p + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    out.push({ z: 1e8, draw: function (c) { c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, S.w, S.h); } });

    function vis(p, bias) {
      var s = S.project(p, B), x = Math.round(s[0] * sc), y = Math.round(s[1] * sc), zmax = -1;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        var z = zb[yy * W + xx]; if (z === Infinity) return true; if (z > zmax) zmax = z;
      }
      return s[2] <= zmax + (bias || 0.06);
    }
    var E = X.mesh.edges(m), pd = { P: P, sc: sc, vvis: [], evis: [], emid: [], E: E, fvis: [], fcen: [], front: frontFace, poly: [] };
    m.v.forEach(function (p, k) { pd.vvis[k] = vis(p); });
    // qirralar: körinadigan bölaklar
    var edgeRuns = E.map(function (e) {
      var a = m.v[e[0]], b = m.v[e[1]], runs = [], cur = null, mid = V.lerp(a, b, 0.5);
      for (var i = 0; i <= 6; i++) { var pp = V.lerp(a, b, i / 6), s = S.project(pp, B); if (vis(pp, 0.08)) { if (!cur) { cur = []; runs.push(cur); } cur.push(s); } else cur = null; }
      var ms = S.project(mid, B); pd.emid.push(ms); pd.evis.push(runs.length > 0 && vis(mid, 0.08));
      return runs;
    });
    m.f.forEach(function (F, fi) {
      var s = F.map(function (k) { return S.project(m.v[k], B); });
      pd.poly[fi] = s; pd.fcen[fi] = S.project(fcen[fi], B);
      pd.fvis[fi] = frontFace[fi] && vis(fcen[fi], 0.1);
    });
    ed.pd = pd;
    var sel = ed.sel, mode = ed.mode;
    // yoq tanlangan bölsa — kontur
    if (sel && sel.mode === "f" && sel.id < m.f.length) out.push({ z: 3, draw: function (c) {
      var s = pd.poly[sel.id]; c.beginPath(); s.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath();
      c.strokeStyle = "#E8590C"; c.lineWidth = 3; c.stroke();
    } });
    if (st.wire) edgeRuns.forEach(function (runs, ei) {
      runs.forEach(function (run) { out.push({ z: 5, draw: function (c) {
        c.beginPath(); run.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
        c.strokeStyle = "rgba(24,32,60,.62)"; c.lineWidth = 1.3; c.stroke();
      } }); });
    });
    if (sel && sel.mode === "e" && sel.id < E.length) edgeRuns[sel.id].forEach(function (run) { out.push({ z: 2, draw: function (c) {
      c.beginPath(); run.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
      c.strokeStyle = "#E8590C"; c.lineWidth = 4.5; c.lineCap = "round"; c.stroke(); c.lineCap = "butt";
    } }); });
    // normallar
    if (st.fn) m.f.forEach(function (F, fi) {
      if (!pd.fvis[fi]) return;
      var a = S.project(fcen[fi], B), b = S.project(V.add(fcen[fi], V.mul(fnorm[fi], 0.55)), B);
      out.push({ z: 1.5, draw: function (c) {
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = C.teal; c.lineWidth = 2.4; c.stroke();
        c.beginPath(); c.arc(b[0], b[1], 3, 0, 7); c.fillStyle = C.teal; c.fill();
      } });
    });
    if (st.vn) { var vnn = vertexNormals(m); m.v.forEach(function (p, k) {
      if (!pd.vvis[k]) return;
      var a = S.project(p, B), b = S.project(V.add(p, V.mul(vnn[k], 0.5)), B);
      out.push({ z: 1.4, draw: function (c) {
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = C.violet; c.lineWidth = 2.4; c.stroke();
        c.beginPath(); c.arc(b[0], b[1], 3, 0, 7); c.fillStyle = C.violet; c.fill();
      } });
    }); }
    // tanlaş nuqtalari (rejimga qarab)
    if (mode === "v") m.v.forEach(function (p, k) {
      if (!pd.vvis[k]) return; var s = S.project(p, B), on = sel && sel.mode === "v" && sel.id === k;
      out.push({ z: 0.5, draw: function (c) { c.beginPath(); c.arc(s[0], s[1], on ? 7.5 : 4.2, 0, 7); c.fillStyle = on ? "#E8590C" : "#18202F"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = "#fff"; c.stroke(); } });
    });
    if (mode === "e") pd.emid.forEach(function (s, k) {
      if (!pd.evis[k]) return; var on = sel && sel.mode === "e" && sel.id === k;
      out.push({ z: 0.5, draw: function (c) { c.beginPath(); c.arc(s[0], s[1], on ? 6 : 3.6, 0, 7); c.fillStyle = on ? "#E8590C" : "#18202F"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = "#fff"; c.stroke(); } });
    });
    if (mode === "f") pd.fcen.forEach(function (s, k) {
      if (!pd.fvis[k]) return; var on = sel && sel.mode === "f" && sel.id === k;
      out.push({ z: 0.5, draw: function (c) { c.beginPath(); c.arc(s[0], s[1], on ? 6.5 : 4, 0, 7); c.fillStyle = on ? "#E8590C" : "#0C9488"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = "#fff"; c.stroke(); } });
    });
    void self;
  };

  var MODE_NAME = { v: "Vertex (çöqqi)", e: "Edge (qirra)", f: "Face (yoq)" };

  /* ---- umumiy muharrir: sahna + tanlaş + hisoblagiçlar ---- */
  function editor(L, o) {
    var ed = { base: cubeM(), model: "cube", sel: null, mode: o.mode || "f", pend: null, hist: [], pd: null, flags: { wire: true, fn: false, vn: false, smooth: false } };
    var S = L.scene({ dist: 6.8, aspect: 0.8, yaw: -0.85, pitch: 0.5, axes: false, gridOpts: { n: 12, step: 0.5 },
      hint: "Tegib tanlang · sudrang — aylantiriş · ikki barmoq — yaqinlaştiriş" });
    ed.S = S;
    ed.cur = function () { return ed.pend && ed.sel && ed.sel.mode === "f" ? applyOp(ed.base, ed.sel.id, ed.pend.type, ed.pend.amt) : ed.base; };
    S.add(new Surf(ed));
    var R = L.readout([["V", "V — çöqqilar"], ["E", "E — qirralar"], ["F", "F — yoqlar"], ["chi", "V − E + F"]]);
    var info = L.note("", "main");
    ed.refresh = function () {
      var m = ed.cur(), cnt = X.mesh.counts(m);
      R.setMany({ V: f(cnt.V, 0), E: f(cnt.E, 0), F: f(cnt.F, 0), chi: f(cnt.chi, 0) });
      var s = ed.sel, t = "";
      if (!s) t = "Tanlanmagan. Modelga tegib " + MODE_NAME[ed.mode].split(" ")[0] + " tanlang.";
      else if (s.mode === "v") {
        var p = m.v[s.id], val = X.mesh.edges(m).filter(function (e) { return e[0] === s.id || e[1] === s.id; }).length;
        var nf = m.f.filter(function (F) { return F.indexOf(s.id) >= 0; }).length;
        t = "<b>Çöqqi #" + s.id + "</b> (" + p.map(function (x) { return f(x, 2); }).join("; ") + "). Valentlik: " + val + " qirra, " + nf + " yoqqa tegişli.";
      } else if (s.mode === "e") {
        var e = X.mesh.edges(m)[s.id], len = V.len(V.sub(m.v[e[0]], m.v[e[1]]));
        t = "<b>Qirra #" + s.id + "</b>: çöqqi " + e[0] + " — " + e[1] + ", uzunligi " + f(len, 2) + ".";
      } else {
        var pts = fpts(m, s.id), n = X.mesh.normal(pts);
        t = "<b>Yoq #" + s.id + "</b>: " + pts.length + " burçakli, yuzi " + f(area(pts), 2) + ", normali (" + n.map(function (x) { return f(x, 2); }).join("; ") + ").";
      }
      info.innerHTML = t;
      if (o.onRefresh) o.onRefresh(m, cnt);
      S.draw();
    };
    ed.setSel = function (s) { ed.sel = s; ed.pend = null; if (o.onSelect) o.onSelect(); ed.refresh(); };
    S.onPick = function (x, y) {
      var pd = ed.pd, m = ed.cur(); if (!pd) return;
      var best = null, bd = 30, i;
      if (ed.mode === "v") {
        for (i = 0; i < m.v.length; i++) { if (!pd.vvis[i]) continue; var s = S.project(m.v[i]), d = Math.hypot(s[0] - x, s[1] - y); if (d < bd) { bd = d; best = i; } }
      } else if (ed.mode === "e") {
        for (i = 0; i < pd.emid.length; i++) { if (!pd.evis[i]) continue; var q = pd.emid[i], d2 = Math.hypot(q[0] - x, q[1] - y); if (d2 < bd) { bd = d2; best = i; } }
      } else {
        var bz = Infinity;
        for (i = 0; i < m.f.length; i++) { if (!pd.front[i] || !pd.fvis[i]) continue; if (pip(x, y, pd.poly[i]) && pd.fcen[i][2] < bz) { bz = pd.fcen[i][2]; best = i; } }
        if (best == null) for (i = 0; i < m.f.length; i++) { if (!pd.fvis[i]) continue; var c = pd.fcen[i], d3 = Math.hypot(c[0] - x, c[1] - y); if (d3 < bd) { bd = d3; best = i; } }
      }
      ed.setSel(best == null ? null : { mode: ed.mode, id: best });
    };
    ed.setModel = function (name) {
      ed.model = name; ed.base = name === "cube" ? cubeM() : houseM(); ed.hist = []; ed.pend = null; ed.sel = null;
      if (o.modelDefaultSel && ed.mode === "f") ed.sel = { mode: "f", id: name === "cube" ? 1 : 8 };
      if (o.onSelect) o.onSelect(); ed.refresh();
    };
    ed.mkMode = function () {
      L.seg("Model", [["cube", "Kub"], ["house", "Uy"]], "cube", function (v) { ed.setModel(v); });
    };
    ed.mkShading = function () {
      L.seg("Soyalaş", [["flat", "Flat (tekis)"], ["smooth", "Smooth (silliq)"]], "flat", function (v) { ed.flags.smooth = v === "smooth"; ed.refresh(); });
    };
    return ed;
  }

  LAB.start({
    intro: "Har qanday polygonal model üç narsadan iborat: çöqqilar (Vertex), ularni boğlaydigan qirralar (Edge) va qirralar bilan çegaralangan yoqlar (Face). Bu laboratoriyada ularni tanlaysiz, normallarni körasiz va yoq üstida Extrude hamda Inset amallarini bajarasiz.",
    tabs: [
      {
        name: "Tanlaş va normallar",
        lead: "Rejimni tanlab, modelga tegib çöqqi, qirra yoki yoqni belgilang. Normallarni yoqing va «Smooth» soyalaşda yoruğlik özgarişini kuzating.",
        build: function (L) {
          var ed = editor(L, { mode: "f", modelDefaultSel: false });
          ed.mkMode();
          L.seg("Tanlaş rejimi", [["v", "Vertex"], ["e", "Edge"], ["f", "Face"]], "f", function (v) { ed.mode = v; ed.setSel(null); });
          ed.mkShading();
          L.toggle("Qirralarni körsatiş", true, function (v) { ed.flags.wire = v; ed.S.draw(); });
          L.toggle("Yoq normallari", false, function (v) { ed.flags.fn = v; ed.S.draw(); });
          L.toggle("Çöqqi normallari", false, function (v) { ed.flags.vn = v; ed.S.draw(); });
          L.add(EX.el("div", { class: "legend", html: '<span><i style="background:#0C9488"></i>yoq normali</span><span><i style="background:#8E4EC6"></i>çöqqi normali</span><span><i style="background:#E8590C"></i>tanlangan</span>' }), "main");
          ed.setModel("cube");
          L.note("Yoq normali — yoqqa perpendikulyar birlik vektor (Newell usuli). Çöqqi normali — çöqqiga tegişli yoqlar normallarining burçak bilan vaznlangan yiğindisi; «Smooth»da şu normallar yoq içida interpolyatsiya qilinadi, geometriya özgarmaydi.", "main");
          L.tasks([
            "Kubda «Vertex» rejimini tanlab bir çöqqini belgilang: valentlik (unga boğlangan qirralar soni) neçta? [3]",
            "«Çöqqi normallari»ni yoqing va kubni «Smooth» qiling: kub nima uçun «dumaloq» körinadi? Çöqqi normali kubning diagonali böylab yönalganini tekşiring.",
            "Uy modelida tom yoqlarini «Face» rejimida belgilang: yuzi va normalidagi z-komponenta nima uçun musbat? Gabldagi uçburçak yoqning burçaklari sonini tekşiring."
          ], "a");
        }
      },
      {
        name: "Extrude va Inset",
        lead: "Yoqni belgilang va slayderni suring: Extrude yoqni normal böylab çiqaradi, Inset esa yoq içida kiçikroq yoq hosil qiladi. «Qöllaş»ni bossangiz amal modelga qöşiladi.",
        build: function (L) {
          var ed, sl = {};
          var EXD = 0, INS = 0;
          ed = editor(L, { mode: "f", modelDefaultSel: true,
            onSelect: function () { if (sl.e) { sl.e.set(0, true); sl.i.set(0, true); } },
            onRefresh: function (m, cnt) { if (chiOut) { chiOut(m, cnt); } } });
          var chiOut = null;
          var R2 = L.readout([["cl", "Yopiq yuza (har qirra 2 yoqda)"], ["tri", "Uçburçaklar soni (triangulyatsiya)"], ["ver", "Eyler tekşiruvi"]]);
          chiOut = function (m, cnt) {
            R2.set("cl", check(m) ? "ha" : "yöq");
            var tr = 0; m.f.forEach(function (F) { tr += F.length - 2; });
            R2.set("tri", f(tr, 0));
            R2.set("ver", cnt.chi === 2 ? "V − E + F = 2 ✓" : "V − E + F = " + f(cnt.chi, 0));
          };
          ed.mkMode();
          var warn = L.note("", "main", "warn"); warn.hidden = true;
          function need() {
            if (ed.sel && ed.sel.mode === "f") { warn.hidden = true; return true; }
            warn.hidden = false; warn.innerHTML = "Avval modelga tegib yoqni tanlang."; sl.e.set(0, true); sl.i.set(0, true); return false;
          }
          sl.e = L.slider({ label: "Extrude masofasi", min: -0.6, max: 1.5, step: 0.05, value: 0, nd: 2, unit: "birlik" }, function (v) {
            sl.i.set(0, true); if (!need()) return; ed.pend = v === 0 ? null : { type: "extrude", amt: v }; ed.refresh();
          });
          sl.i = L.slider({ label: "Inset miqdori (yoq kiçrayişi)", min: 0, max: 0.85, step: 0.05, value: 0, nd: 2 }, function (v) {
            sl.e.set(0, true); if (!need()) return; ed.pend = v === 0 ? null : { type: "inset", amt: v }; ed.refresh();
          });
          L.button("Qöllaş (amalni modelga qöşiş)", function () {
            if (!ed.pend) return;
            ed.hist.push({ base: ed.base, sel: ed.sel });
            ed.base = applyOp(ed.base, ed.sel.id, ed.pend.type, ed.pend.amt); ed.pend = null; sl.e.set(0, true); sl.i.set(0, true); ed.refresh();
          }, "primary");
          L.button("Orqaga (Undo)", function () {
            var h = ed.hist.pop(); if (!h) return; ed.base = h.base; ed.sel = h.sel; ed.pend = null; sl.e.set(0, true); sl.i.set(0, true); ed.refresh();
          });
          L.button("Modelni tiklaş", function () { ed.setModel(ed.model); });
          ed.mkShading();
          L.toggle("Yoq normallari", false, function (v) { ed.flags.fn = v; ed.S.draw(); });
          ed.setModel("cube");
          L.note("n burçakli yoqda Extrude va Inset: n ta yangi çöqqi, 2n ta yangi qirra, n ta yangi yon yoq (qopqoq esa eski yoqning ornini egallaydi). Demak ΔV = n, ΔE = 2n, ΔF = n va V − E + F özgarmaydi: yopiq «sfera töpologiyasi»da hamişa 2.", "main");
          L.tasks([
            "Kubning yuqori yoqini tanlab, Extrude = 1 «Qöllaş»: V, E, F neçaga özgardi? [8 → 12, 12 → 20, 6 → 10; V − E + F = 2]",
            "Hozirgi yoqni Inset = 0,4 bilan kiçrayting, «Qöllaş»ni bosing, söng hosil bölgan kiçik yoqni Extrude qiling — yoq «çuqurli quti» ga aylanişini kuzating.",
            "Uyning gabl uçburçagida Extrude qiling: uçburçak uçun ΔV, ΔE, ΔF neçta? [3, 6, 3]. Eyler yiğindisi yana 2mi?"
          ], "b");
        }
      }
    ]
  });
})();
