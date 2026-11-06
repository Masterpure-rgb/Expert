/* 19-mavzu. Optimallaştiriş va LOD */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, M = X.m;
  var LODC = [C.green, C.teal, C.gold, C.orange, C.violet, C.ink3];

  function tris(m) { var t = 0; m.f.forEach(function (q) { t += q.length - 2; }); return t; }
  function g(d, s) { return Math.exp(-d / (s * s)); }
  function headV(p) {
    var x = p[0], y = p[1], z = p[2], q = [x * 0.8, y * 0.95, z * 1.1];
    q[1] -= 0.38 * g(x * x + (y + 1) * (y + 1) + (z + 0.05) * (z + 0.05), 0.3);
    q[1] -= 0.1 * g(x * x + (y + 0.9) * (y + 0.9) + (z - 0.4) * (z - 0.4), 0.3);
    q[1] -= 0.1 * g(x * x + (y + 0.8) * (y + 0.8) + (z + 0.7) * (z + 0.7), 0.3);
    [-1, 1].forEach(function (s) { q[0] += s * 0.25 * g((x - s) * (x - s) + y * y + z * z, 0.3); });
    return q;
  }
  function headMesh(seg, rings) { var m = X.mesh.uvSphere(seg, rings, 1); return { v: m.v.map(headV), f: m.f }; }
  var SPH = [4, 3, 2, 1].map(function (s) { return X.mesh.icosphere(s, 1); });
  var HEAD = [[36, 18], [24, 12], [16, 8], [8, 4]].map(function (a) { return headMesh(a[0], a[1]); });

  function tab1(L) {
    var st = { kind: "sph", wire: true }, XS = [-3.4, -1.13, 1.13, 3.4];
    var S = L.scene({ dist: 6.6, yaw: -Math.PI / 2, pitch: 0.2, aspect: 0.6, target: [0, 0, -0.2], axes: false, gridOpts: { n: 20, step: 1 } });
    var items = XS.map(function () { return S.add(new X.Mesh({ mesh: SPH[0], color: "#C9D4F5", wire: true, wireColor: "rgba(43,58,103,.7)", edge: false, lw: 0.8 })); });
    var lab = S.add(new X.Points({ pts: XS.map(function (x) { return [x - 0.3, 0, -1.4]; }), color: LAB.C.ink3, r: 3, labels: ["LOD0", "LOD1", "LOD2", "LOD3"], front: true }));
    var R = L.readout([["0", "LOD0"], ["1", "LOD1"], ["2", "LOD2"], ["3", "LOD3"], ["s", "Jami / LOD0"]]);
    function upd() {
      var set = st.kind === "sph" ? SPH : HEAD, T = [];
      set.forEach(function (m, i) {
        var mm = X.mesh.transform(m, M.T(XS[i], 0, 0)); items[i].o.mesh = mm; items[i].o.wire = st.wire ? true : false; items[i].o.edge = st.wire ? false : "rgba(43,58,103,.45)";
        T.push(tris(m));
      });
      var sum = 0; T.forEach(function (t) { sum += t; });
      T.forEach(function (t, i) { R.set(String(i), f(t, 0)); R.el.children[i].querySelector("span").textContent = "LOD" + i + " · " + f(t / T[0] * 100, 1) + " %"; });
      R.set("s", "× " + f(sum / T[0], 3));
      S.draw();
    }
    L.seg("Model", [["sph", "Ikosfera"], ["head", "Boş (UV-sfera asosida)"]], "sph", function (v) { st.kind = v; upd(); });
    L.toggle("Tör (wire) körsatiş", true, function (v) { st.wire = v; upd(); });
    L.note("Ikosfera: Blender Icosphere Subdivisions = 4, 3, 2, 1 → 1 280, 320, 80, 20 uçburçak: har bir keyingi daraja <b>4 marta</b> kam (r = 1/4). Hamma darajalarni saqlaş xotirasi: 1 + r + r² + r³ < 1/(1 − r) = 4/3 ≈ 1,33 × LOD0. Boşda esa darajalar 100 %, ≈ 43 %, ≈ 18 %, ≈ 4 % (uçburçak = 2·seg·(rings − 1)); burun, quloq, iyak detallari past darajalarda yöqoladi.");
    upd();
    L.tasks([
      "Ikosferada LOD0 dan LOD3 gaça uçburçaklar sonini yozing va har bir qadamda 4 marta kamayişini tekşiring. [1280 → 320 → 80 → 20]",
      "«Boş» modeliga ötib, LOD2 va LOD3 da burun va quloqlar qanday yöqolayotganini kuzating. Qaysi daraja uzoqdan qaralganda yetarli bölardi?",
      "Ikosfera uçun «Jami / LOD0» qiymatini hisoblang: (1280 + 320 + 80 + 20) / 1280 = ? [≈ 1,328 — 4/3 dan kiçik]"
    ], "a");
  }

  /* ---- 2: LOD almaşişi ---- */
  function tab2(L) {
    var st = { d: 10, h: 2, fov: 60, H: 1080, eps: 1, preset: "px" };
    var cv = L.canvas({ aspect: 0.82 });
    var R = L.readout([["p", "Ekrandagi balandlik p"], ["pc", "Ekran balandligining %"], ["lod", "Faol daraja"], ["e", "Xato ε (piksel)"]]);
    L.add(EX.el("div", { class: "legend", html: LODC.map(function (col, i) { return '<span><i style="background:' + col + '"></i>' + ["LOD0", "LOD1", "LOD2", "LOD3", "Billboard", "Culled"][i] + "</span>"; }).join("") }), "main");
    var tbl = EX.el("table", { class: "t" }); L.add(tbl, "main");
    var PX = 600, DMAX = 100;
    function K() { return st.H / (2 * Math.tan(st.fov * Math.PI / 360)); }
    function thr() { // px çegaralari va bekor qiliş
      var t = st.preset === "px" ? [400, 200, 100, 50] : [50, 25, 10, 2].map(function (v) { return v / 100 * st.H; });
      return { t: t, cull: 0.02 * st.H };
    }
    function pOf(d) { return st.h * K() / d; }
    function dOf(p) { return st.h * K() / p; }
    function stateOf(p) {
      var T = thr(); for (var i = 0; i < 4; i++) if (p >= T.t[i]) return i;
      return p >= T.cull ? 4 : 5;
    }
    var NAMES = ["LOD0", "LOD1", "LOD2", "LOD3", "Billboard", "Culled"];
    cv.draw = function (c, w, h) {
      var T = thr(), p = pOf(st.d), s = stateOf(p), i;
      // ekran maketi
      var bx = 10, bw = 64, bh = Math.min(150, h - 60), by = 28;
      c.font = "700 12px Inter, system-ui, sans-serif"; c.fillStyle = "#18202F"; c.fillText("Ekran", bx, 16);
      c.fillStyle = "#F3F5FA"; c.fillRect(bx, by, bw, bh); c.strokeStyle = "#18202F"; c.lineWidth = 1.5; c.strokeRect(bx, by, bw, bh);
      var ph = Math.min(bh, p / st.H * bh), cx = bx + bw / 2, cy = by + bh - ph / 2;
      if (s <= 3) {
        var n = [48, 24, 12, 6][s]; c.beginPath();
        for (i = 0; i < n; i++) { var a = 2 * Math.PI * i / n; var X0 = cx + Math.cos(a) * ph / 2 * 0.9, Y0 = cy + Math.sin(a) * ph / 2; if (i) c.lineTo(X0, Y0); else c.moveTo(X0, Y0); }
        c.closePath(); c.fillStyle = LODC[s]; c.globalAlpha = 0.75; c.fill(); c.globalAlpha = 1; c.strokeStyle = "#18202F"; c.lineWidth = 1; c.stroke();
      } else if (s === 4) { c.setLineDash([4, 3]); c.strokeStyle = LODC[4]; c.lineWidth = 2; c.strokeRect(cx - ph * 0.3, cy - ph / 2, ph * 0.6, ph); c.setLineDash([]); }
      c.fillStyle = "#4A5468"; c.font = "11px Inter, system-ui, sans-serif"; c.fillText("H = " + f(st.H, 0) + " px", bx, by + bh + 16);
      c.fillStyle = LODC[s]; c.font = "700 12px Inter, system-ui, sans-serif"; c.fillText(NAMES[s], bx, by + bh + 32);
      // grafik p(d)
      var l = bx + bw + 46, r = 12, t = 14, b = 34, W = w - l - r, Hh = h - t - b;
      function sx(d) { return l + d / DMAX * W; } function sy(v) { return t + (1 - Math.min(v, PX) / PX) * Hh; }
      // zonalar
      var bounds = [0].concat(T.t.map(function (v) { return Math.min(DMAX, dOf(v)); })), cd = Math.min(DMAX, dOf(T.cull));
      var z = [], zi;
      for (i = 0; i < 4; i++) z.push([i === 0 ? 0 : bounds[i], bounds[i + 1], i]);
      if (T.t[3] > T.cull) z.push([bounds[4], cd, 4]); z.push([Math.max(bounds[4], T.t[3] > T.cull ? cd : bounds[4]), DMAX, 5]);
      z.forEach(function (q) { if (q[1] > q[0]) { c.fillStyle = LODC[q[2]]; c.globalAlpha = 0.14; c.fillRect(sx(q[0]), t, sx(q[1]) - sx(q[0]), Hh); c.globalAlpha = 1; } });
      c.strokeStyle = "rgba(24,32,47,.35)"; c.lineWidth = 1; c.strokeRect(l, t, W, Hh);
      c.font = "11px Inter, system-ui, sans-serif"; c.fillStyle = "#7A8396"; c.textAlign = "right";
      [0, 200, 400, 600].forEach(function (v) { c.fillText(f(v, 0), l - 4, sy(v) + 4); }); c.textAlign = "center";
      [0, 25, 50, 75, 100].forEach(function (v) { c.fillText(f(v, 0), sx(v), t + Hh + 14); });
      c.fillStyle = "#4A5468"; c.fillText("masofa d, m", l + W / 2, h - 6);
      c.save(); c.translate(l - 34, t + Hh / 2); c.rotate(-Math.PI / 2); c.fillText("p, piksel", 0, 0); c.restore(); c.textAlign = "left";
      // çegara çiziqlari
      T.t.forEach(function (v, k) {
        if (v > PX) return; c.beginPath(); c.moveTo(l, sy(v)); c.lineTo(l + W, sy(v)); c.strokeStyle = LODC[k]; c.lineWidth = 1.2; c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]);
        var dd = dOf(v); if (dd <= DMAX) { c.beginPath(); c.moveTo(sx(dd), sy(v)); c.lineTo(sx(dd), t + Hh); c.stroke(); }
      });
      // egri
      c.beginPath(); var first = true;
      for (var d = 0.5; d <= DMAX; d += 0.25) { var v = pOf(d); if (v > PX * 1.5) continue; var yy = sy(v); if (first) { c.moveTo(sx(d), yy); first = false; } else c.lineTo(sx(d), yy); }
      c.strokeStyle = "#18202F"; c.lineWidth = 2.5; c.stroke();
      c.beginPath(); c.arc(sx(Math.min(st.d, DMAX)), sy(p), 6, 0, 7); c.fillStyle = LODC[s]; c.fill(); c.strokeStyle = "#18202F"; c.lineWidth = 2; c.stroke();
      // readout
      var eps = st.eps / 100 * st.H / (2 * st.d * Math.tan(st.fov * Math.PI / 360));
      R.setMany({ p: f(p, 1) + " px", pc: f(p / st.H * 100, 1) + " %", lod: NAMES[s], e: f(eps, 2) + " px" });
      // jadval
      var rows = [], lab2 = ["LOD0 → LOD1", "LOD1 → LOD2", "LOD2 → LOD3", "LOD3 → " + (T.t[3] > T.cull ? "Billboard" : "Culled")];
      T.t.forEach(function (v, k) { rows.push([lab2[k], f(v, 1), f(v / st.H * 100, 1), f(dOf(v), 1)]); });
      if (T.t[3] > T.cull) rows.push(["Billboard → Culled", f(T.cull, 1), "2", f(dOf(T.cull), 1)]);
      tbl.innerHTML = "<thead><tr><th>Ötiş</th><th>p, px</th><th>% H</th><th>d, m</th></tr></thead><tbody>" + rows.map(function (q) { return "<tr><td>" + q.join("</td><td>") + "</td></tr>"; }).join("") + "</tbody>";
    };
    L.slider({ label: "Masofa d", min: 1, max: 100, step: 0.1, value: 10, nd: 1, unit: "m" }, function (v) { st.d = v; cv.redraw(); });
    L.slider({ label: "Obyekt balandligi h", min: 0.5, max: 6, step: 0.1, value: 2, nd: 1, unit: "m" }, function (v) { st.h = v; cv.redraw(); });
    L.slider({ label: "Köriş burçagi θ (vertikal FOV)", min: 20, max: 110, step: 1, value: 60, nd: 0, unit: "°" }, function (v) { st.fov = v; cv.redraw(); });
    L.slider({ label: "Ekran balandligi H", min: 360, max: 2160, step: 10, value: 1080, nd: 0, unit: "px" }, function (v) { st.H = v; cv.redraw(); });
    L.slider({ label: "Geometrik xato ε", min: 0.1, max: 10, step: 0.1, value: 1, nd: 1, unit: "sm" }, function (v) { st.eps = v; cv.redraw(); });
    L.select("Çegaralar", [["px", "Kitob: 400 / 200 / 100 / 50 px"], ["pct", "Unity LOD Group: 50 / 25 / 10 / 2 %"]], "px", function (v) { st.preset = v; cv.redraw(); });
    L.note("<b>p(d) = h·H / (2·d·tan(θ/2))</b>, teskarisi d = h·H / (2·p·tan(θ/2)). h = 2 m, θ = 60°, H = 1080 da 2·tan 30° = 1,1547 va d = 1870,6 / p: 400 / 200 / 100 / 50 px ⇒ 4,7 / 9,4 / 18,7 / 37,4 m. Unity LOD Group çegaralari ekran balandligining % da beriladi (400/1080 ≈ 37 %); 2 % dan kiçik — Culled. Xato: ε<sub>px</sub> = ε·H / (2·d·tan(θ/2)); qoida: xato &lt; 1 px bölgan eng sodda LOD.", "main");
    L.tasks([
      "Boşlanğiç qiymatlarni qöying (h = 2 m, θ = 60°, H = 1080, kitob çegaralari) va jadvaldagi masofalarni tekşiring. [4,7 / 9,4 / 18,7 / 37,4 m]",
      "FOV ni 60° dan 30° ga kamaytiring: bir xil masofada p oşadi yoki kamayadi, LOD almaşişi masofalari-çi? [p oşadi, çegaralar uzoqlaşadi]",
      "ε = 1 sm va d = 9,4 m qöying: ε<sub>px</sub> ≈ 1 px bölişini tekşiring (bu LOD2 uçun rasmiy çeklov)."
    ], "b");
  }

  /* ---- 3: tekstura xotirasi ---- */
  var FMT = [
    { id: "rgba8", name: "RGBA8", bx: 1, by: 1, bb: 4, note: "siqilmagan, 32 bpp" },
    { id: "bc1", name: "BC1", bx: 4, by: 4, bb: 8, note: "PC / konsol, 4 bpp" },
    { id: "bc7", name: "BC7", bx: 4, by: 4, bb: 16, note: "PC / konsol, 8 bpp" },
    { id: "etc2", name: "ETC2 RGB", bx: 4, by: 4, bb: 8, note: "mobil, 4 bpp" },
    { id: "etc2a", name: "ETC2 RGBA", bx: 4, by: 4, bb: 16, note: "mobil, 8 bpp" },
    { id: "a4", name: "ASTC 4×4", bx: 4, by: 4, bb: 16, note: "mobil, 8 bpp" },
    { id: "a6", name: "ASTC 6×6", bx: 6, by: 6, bb: 16, note: "mobil, ≈ 3,56 bpp" },
    { id: "a8", name: "ASTC 8×8", bx: 8, by: 8, bb: 16, note: "mobil, 2 bpp" }
  ];
  function texBytes(w, h, fm, mips) {
    var tot = 0;
    for (;;) {
      tot += Math.ceil(w / fm.bx) * Math.ceil(h / fm.by) * fm.bb;
      if (!mips || (w === 1 && h === 1)) break;
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
    }
    return tot;
  }
  function tab3(L) {
    var st = { w: 2048, h: 2048, mips: true, n: 1, sel: "bc7" }, MIB = 1048576;
    var cv = L.canvas({ aspect: 0.86 });
    var R = L.readout([["mb", "Hajm, MB (10⁶ bayt)"], ["mib", "Hajm, MiB (2²⁰ bayt)"], ["r", "RGBA8 ga nisbatan"], ["b", "Bit / piksel"]]);
    function sz(fm) { return texBytes(st.w, st.h, fm, st.mips) * st.n; }
    var rowsY = [];
    cv.draw = function (c, w, h) {
      var lw = 88, top = 8, rh = (h - top - 26) / FMT.length, W = w - lw - 10, mx = sz(FMT[0]);
      c.font = "600 12px Inter, system-ui, sans-serif"; rowsY = [];
      FMT.forEach(function (fm, i) {
        var y = top + i * rh, b = sz(fm), bw = Math.max(2, b / mx * W), on = fm.id === st.sel;
        rowsY.push([y, y + rh, fm.id]);
        if (on) { c.fillStyle = "rgba(24,32,47,.06)"; c.fillRect(0, y, w, rh); }
        c.fillStyle = "#18202F"; c.textAlign = "left"; c.fillText(fm.name, 8, y + rh / 2 + 4);
        c.fillStyle = fm.id === "rgba8" ? C.ink3 : on ? C.orange : C.z; c.fillRect(lw, y + 5, bw, rh - 10);
        var txt = f(b / MIB, 2) + " MiB";
        if (bw > 84) { c.fillStyle = "#fff"; c.fillText(txt, lw + 6, y + rh / 2 + 4); } else { c.fillStyle = "#18202F"; c.fillText(txt, lw + bw + 6, y + rh / 2 + 4); }
      });
      c.fillStyle = "#7A8396"; c.font = "11px Inter, system-ui, sans-serif"; c.fillText("Satrni bosing — tanlaş. Ustun uzunligi RGBA8 ga nisbatan.", 8, h - 8);
      var fm = FMT.filter(function (q) { return q.id === st.sel; })[0], b2 = sz(fm);
      R.setMany({ mb: f(b2 / 1e6, 2), mib: f(b2 / MIB, 2), r: "1 : " + f(sz(FMT[0]) / b2, 2), b: f(fm.bb * 8 / (fm.bx * fm.by), 2) });
      info.innerHTML = "<b>" + f(st.w, 0) + " × " + f(st.h, 0) + "</b>, " + fm.name + " (" + fm.note + "): " + f(texBytes(st.w, st.h, fm, false) * st.n / MIB, 2) + " MiB mipmapsiz; mipmap bilan " + f(texBytes(st.w, st.h, fm, true) * st.n / MIB, 2) + " MiB. Taqribiy ×4/3 qoidasi: " + f(texBytes(st.w, st.h, fm, false) * st.n * 4 / 3 / MIB, 2) + " MiB.";
    };
    cv.canvas.addEventListener("pointerdown", function (e) {
      var r = cv.canvas.getBoundingClientRect(), y = e.clientY - r.top;
      rowsY.forEach(function (q) { if (y >= q[0] && y < q[1]) { st.sel = q[2]; fmSel.set(q[2], true); cv.redraw(); } });
    });
    var sizes = [[256, "256"], [512, "512"], [1024, "1024"], [2048, "2048"], [4096, "4096"], [8192, "8192"]];
    L.select("Eni (px)", sizes, 2048, function (v) { st.w = Number(v); cv.redraw(); });
    L.select("Boyi (px)", sizes, 2048, function (v) { st.h = Number(v); cv.redraw(); });
    var fmSel = L.select("Tanlangan format", FMT.map(function (q) { return [q.id, q.name]; }), "bc7", function (v) { st.sel = v; cv.redraw(); });
    L.toggle("Mipmap zanjiri (barça darajalar)", true, function (v) { st.mips = v; cv.redraw(); });
    L.slider({ label: "Teksturalar soni (masalan, Base Color, Normal, ORM…)", min: 1, max: 10, step: 1, value: 1, nd: 0 }, function (v) { st.n = v; cv.redraw(); });
    var info = L.note("");
    L.note("Hajm = eni × boyi × bayt/piksel; mipmaplar bilan ≈ ×4/3 (1 + ¼ + 1/16 + … → 4/3). Siqilgan formatlar blokli: BC/ETC2 — 4×4 piksel blokka 8 yoki 16 bayt, ASTC — doim 16 bayt, blok ölçami 4×4, 6×6 yoki 8×8. <b>MB</b> = 10<sup>6</sup> bayt, <b>MiB</b> = 2<sup>20</sup> = 1 048 576 bayt; 2048² RGBA8 = 16 777 216 bayt = 16,8 MB = 16 MiB.");
    L.tasks([
      "2048 × 2048, RGBA8, mipmap öçiq: hajm 16 MiB (16,8 MB) çiqişini tekşiring. Mipmap yoqing: ≈ 21,3 MiB (22,4 MB).",
      "Formatni BC7, söng ASTC 8×8 ga almaştiring: RGBA8 ga nisbatan neça marta kamayadi? [8 va 16 marta]",
      "Bir material uçun 3 ta 2048² tekstura (BC7, mipmap bilan) qançaga tuşadi? Ölçamni 1024 ga tuşiring va qiyoslang. [≈ 32 MiB; 1024² da 4 marta kam]"
    ], "c");
  }

  LAB.start({
    intro: "Real vaqtda har bir kadr uçun resurslar çeklangan. Bu laboratoriyada uç narsani sinaysiz: LOD darajalarida uçburçaklar soni, ekrandagi ölçamga qarab LOD almaşişi va teksturalar egallaydigan xotira.",
    tabs: [
      { name: "LOD darajalari", lead: "Tört daraja yonma-yon: har bir keyingi daraja ança kam uçburçakka ega. Sfera va boş modeli uçun sonlarni solişitiring.", build: tab1 },
      { name: "LOD almaşişi", lead: "Obyektning ekrandagi balandligi p masofaga teskari proportsional. Masofa, balandlik, FOV va ekran ölçamini özgartirib, qaysi LOD faol bölişini kuzating.", build: tab2 },
      { name: "Tekstura xotirasi", lead: "Tekstura hajmi ölçam, bayt/piksel va mipmaplarga boğliq. Siqiş formatlari uni bir neça marta kamaytiradi.", build: tab3 }
    ]
  });
})();
