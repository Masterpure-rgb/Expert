/* 20-mavzu. VR/AR byudjeti */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, M = X.m;

  /* ================= 1: kadr byudjeti ================= */
  function tab1(L) {
    var st = { hz: 90, mode: "single", logic: 3, rend: 1.5, gpu: 3.5 };
    var cv = L.canvas({ aspect: 0.5 });
    var R = L.readout([["t", "Kadr byudjeti T"], ["c", "CPU vaqti"], ["g", "GPU vaqti"], ["e", "Bir köz uçun GPU byudjeti"], ["r", "Natija"]]);
    function model() {
      var two = st.mode === "two", stereo = st.mode !== "mono";
      return { cpu: st.logic + st.rend * (two ? 2 : 1), gpu: st.gpu * (stereo ? 2 : 1) };
    }
    cv.draw = function (c, w, h) {
      var T = 1000 / st.hz, m = model(), mx = Math.max(T * 1.5, m.cpu, m.gpu) * 1.08, l = 54, r = 14, W = w - l - r;
      function sx(v) { return l + v / mx * W; }
      c.font = "600 12px Inter, system-ui, sans-serif";
      var rows = [["CPU", m.cpu, C.z], ["GPU", m.gpu, C.violet]], rh = (h - 56) / 2;
      rows.forEach(function (q, i) {
        var y = 36 + i * rh, ok = q[1] <= T;
        c.fillStyle = "#18202F"; c.textAlign = "left"; c.fillText(q[0], 8, y + rh / 2 + 4);
        c.fillStyle = ok ? q[2] : C.x; c.fillRect(l, y + 8, sx(q[1]) - l, rh - 16);
        c.fillStyle = "#18202F"; c.fillText(f(q[1], 1) + " ms", Math.min(sx(q[1]) + 6, w - 60), y + rh / 2 + 4);
        if (sx(q[1]) + 66 > w) { c.fillStyle = "#fff"; c.fillText(f(q[1], 1) + " ms", Math.max(l + 6, sx(q[1]) - 62), y + rh / 2 + 4); }
      });
      // byudjet çizigi
      c.beginPath(); c.moveTo(sx(T), 24); c.lineTo(sx(T), h - 22); c.strokeStyle = C.orange; c.lineWidth = 2.5; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
      c.fillStyle = C.orange; c.textAlign = "center"; c.fillText("T = " + f(T, 1) + " ms (" + f(st.hz, 0) + " Hz)", Math.min(Math.max(sx(T), 70), w - 70), 16);
      c.fillStyle = "#7A8396"; c.font = "11px Inter, system-ui, sans-serif"; c.textAlign = "left"; c.fillText("0", l, h - 8); c.textAlign = "right"; c.fillText(f(mx, 0) + " ms", w - r, h - 8); c.textAlign = "left";
      var ok = m.cpu <= T && m.gpu <= T;
      R.setMany({ t: f(T, 1) + " ms", c: f(m.cpu, 1) + " ms", g: f(m.gpu, 1) + " ms", e: f(T / 2, 1) + " ms", r: ok ? "Byudjetga sigʼadi" : (m.gpu > T && m.cpu > T ? "CPU va GPU oşdi" : m.gpu > T ? "GPU oşdi" : "CPU oşdi") });
    };
    var hzS = L.slider({ label: "Yangilaniş çastotasi f", min: 30, max: 144, step: 1, value: 90, nd: 0, unit: "Hz" }, function (v) { st.hz = v; cv.redraw(); });
    L.seg("Tayyor qiymat", [[60, "60"], [72, "72"], [90, "90"], [120, "120"]], 90, function (v) { hzS.set(v); });
    L.seg("Renderlaş rejimi", [["mono", "Bir köriniş (monitor)"], ["two", "Stereo: ikki pass"], ["single", "Stereo: single-pass instanced"]], "single", function (v) { st.mode = v; cv.redraw(); });
    L.slider({ label: "CPU: öyin mantiqi + fizika (model)", min: 0.5, max: 8, step: 0.1, value: 3, nd: 1, unit: "ms" }, function (v) { st.logic = v; cv.redraw(); });
    L.slider({ label: "CPU: renderlaş buyruqlari, bir körinişga", min: 0.5, max: 6, step: 0.1, value: 1.5, nd: 1, unit: "ms" }, function (v) { st.rend = v; cv.redraw(); });
    L.slider({ label: "GPU: bir körinişni çiziş", min: 1, max: 10, step: 0.1, value: 3.5, nd: 1, unit: "ms" }, function (v) { st.gpu = v; cv.redraw(); });
    L.note("<b>T = 1000 / f</b>: 60 Hz → 16,7 ms; 72 Hz → 13,9 ms; 90 Hz → 11,1 ms; 120 Hz → 8,3 ms. Stereoda kadr ikki körinişdan (har bir köz uçun) iborat. <i>Ikki pass</i>da sahna CPU tomonidan ikki marta yuboriladi; <i>single-pass instanced</i>da buyruqlar bir marta beriladi va GPU uni ikki körinişga takrorlaydi — CPU xarajati kamayadi, lekin piksel va çöqqi işi ikkala köz uçun baribir bajariladi. Bu — <b>öquv modeli</b> (CPU va GPU bir-biriga parallel işlaydi, kadr vaqti ≈ max(CPU; GPU) deb olinadi); haqiqiy sonlar qurilmaga boğliq.");
    L.tasks([
      "Rejim «Stereo: single-pass instanced», çastotani 72 dan 144 Hz gaça oşiring: byudjet 13,9 dan 6,9 ms gaça kamayadi. Qaysi çastotadan boşlab «GPU oşdi» yozuvi çiqadi? [GPU 7 ms bölgani uçun ≈ 143 Hz dan]",
      "Çastotani 90 Hz ga qöyib, «Stereo: ikki pass» ni tanlang, söng «single-pass instanced» ga ötkazing: qaysi körsatkiç (CPU yoki GPU) özgaradi? [faqat CPU]",
      "90 Hz da bir köz uçun GPU byudjeti nimaga teng? [11,1 / 2 ≈ 5,6 ms] Çastotani 72 Hz ga tuşiring va qiyoslang. [6,9 ms]"
    ], "a");
  }

  /* ================= 2: draw call va uçburçak byudjeti ================= */
  var TYPES = [
    { n: "Personaj (yuqori detal)", tris: 40000, mat: 3, max: 20 },
    { n: "Personaj (LOD / mobil)", tris: 8000, mat: 2, max: 30 },
    { n: "Daraxt", tris: 6000, mat: 2, max: 60 },
    { n: "Mebel (stul, stol)", tris: 1500, mat: 1, max: 100 },
    { n: "Mayda prop", tris: 500, mat: 1, max: 300 },
    { n: "Bino / xona qobiğı", tris: 25000, mat: 4, max: 10 },
    { n: "Relyef (terrain)", tris: 150000, mat: 2, max: 4 }
  ];
  var PLAT = {
    sa: { name: "Mustaqil şlem (standalone)", tris: [0.3e6, 1e6], dc: [100, 300] },
    pc: { name: "PC VR", tris: [2e6, 5e6], dc: [null, 1000] },
    ar: { name: "Smartfon AR", tris: [0.1e6, 0.5e6], dc: [50, 200] }
  };
  function tab2(L) {
    var st = { plat: "sa", cnt: TYPES.map(function () { return 0; }), inst: false, atlas: false };
    st.cnt = [1, 2, 6, 12, 30, 1, 0];
    var cv = L.canvas({ aspect: 0.5 });
    var R = L.readout([["tr", "Uçburçaklar"], ["dc", "Draw call"], ["s1", "Uçburçak holati"], ["s2", "Draw call holati"]]);
    var sl = [];
    function calc() {
      var t = 0, d = 0;
      TYPES.forEach(function (q, i) {
        var n = st.cnt[i]; if (!n) return;
        t += n * q.tris; d += (st.inst ? 1 : n) * (st.atlas ? 1 : q.mat);
      });
      return { t: t, d: d };
    }
    function bar(c, x, y, w, h, val, lohi, label, fmtv) {
      var lo = lohi[0], hi = lohi[1], mx = Math.max(hi * 1.6, val * 1.08);
      function sx(v) { return x + Math.min(v, mx) / mx * w; }
      var z0 = lo == null ? 0 : lo;
      c.fillStyle = "rgba(47,158,68,.16)"; c.fillRect(x, y, sx(z0) - x, h);
      if (lo != null) { c.fillStyle = "rgba(217,164,0,.22)"; c.fillRect(sx(lo), y, sx(hi) - sx(lo), h); }
      c.fillStyle = "rgba(229,72,77,.16)"; c.fillRect(sx(hi), y, x + w - sx(hi), h);
      if (lo == null) { c.fillStyle = "rgba(217,164,0,.0)"; }
      var col = val <= (lo == null ? hi : lo) ? C.green : val <= hi ? C.gold : C.x;
      c.fillStyle = col; c.fillRect(x, y + h * 0.28, sx(val) - x, h * 0.44);
      c.strokeStyle = "rgba(24,32,47,.5)"; c.lineWidth = 1; c.strokeRect(x, y, w, h);
      [lo, hi].forEach(function (v) { if (v == null) return; c.beginPath(); c.moveTo(sx(v), y); c.lineTo(sx(v), y + h); c.strokeStyle = "#18202F"; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]); });
      c.fillStyle = "#18202F"; c.font = "700 12px Inter, system-ui, sans-serif"; c.textAlign = "left"; c.fillText(label, x, y - 6);
      c.font = "11px Inter, system-ui, sans-serif"; c.fillStyle = "#4A5468";
      c.fillText(lo == null ? "taxminiy: ~" + fmtv(hi) + " va undan köp" : "taxminiy oraliq: " + fmtv(lo) + " – " + fmtv(hi), x, y + h + 14);
      return col === C.green ? "Oraliqdan past" : col === C.gold ? "Oraliq içida" : "Oraliqdan yuqori";
    }
    cv.draw = function (c, w, h) {
      var P = PLAT[st.plat], k = calc(), pad = 12;
      var s1 = bar(c, pad, 30, w - 2 * pad, 40, k.t, P.tris, "Uçburçaklar: " + f(k.t / 1e6, 3) + " mln", function (v) { return f(v / 1e6, 1) + " mln"; });
      var s2 = bar(c, pad, 118, w - 2 * pad, 40, k.d, P.dc, "Draw call: " + f(k.d, 0), function (v) { return f(v, 0); });
      R.setMany({ tr: f(k.t, 0), dc: f(k.d, 0), s1: s1, s2: s2 });
    };
    L.seg("Platforma", Object.keys(PLAT).map(function (k) { return [k, PLAT[k].name.split(" (")[0]]; }), "sa", function (v) { st.plat = v; cv.redraw(); });
    L.toggle("Instancing (bir xil obyekt nusxalari — bitta draw call)", false, function (v) { st.inst = v; cv.redraw(); });
    L.toggle("Material birlaştiriş (tekstura atlasi — obyektga 1 material)", false, function (v) { st.atlas = v; cv.redraw(); });
    function setAll(a) { a.forEach(function (v, i) { st.cnt[i] = v; sl[i].set(v, true); }); cv.redraw(); }
    L.button("Boş", function () { setAll([0, 0, 0, 0, 0, 0, 0]); }, "ghost", "side");
    L.button("Kiçik xona", function () { setAll([1, 0, 0, 8, 20, 1, 0]); }, "ghost", "side");
    L.button("Katta sahna", function () { setAll([2, 6, 40, 60, 200, 4, 1]); }, "ghost", "side");
    TYPES.forEach(function (q, i) {
      sl.push(L.slider({ label: q.n + " (" + f(q.tris, 0) + " uçb., " + q.mat + " mat.)", min: 0, max: q.max, step: 1, value: st.cnt[i], nd: 0 }, function (v) { st.cnt[i] = v; cv.redraw(); }));
    });
    L.note("Draw call ≈ (obyekt soni) × (obyektdagi materiallar soni): har bir material — alohida çaqiruv. Instancing bir xil obyekt nusxalarini bitta çaqiruvga birlaştiradi, atlas esa materiallarni kamaytiradi. Ranglar (taxminiy, qatʼiy standart emas — butun kadr uçun): mustaqil şlem — 0,3–1 mln uçburçak va 100–300 draw call; PC VR — 2–5 mln va ≈ 1000 va undan köp; smartfon AR — 0,1–0,5 mln va 50–200. Obyektlarning uçburçak va material sonlari — misol uçun qabul qilingan qiymatlar.", "main");
    L.tasks([
      "Platformani «Mustaqil şlem» da qoldirib «Katta sahna» ni bosing: qaysi körsatkiç oraliqdan oşdi — uçburçaklarmi yoki draw callmi?",
      "Şu sahnada Instancing va Material birlaştiriş ni yoqing: draw call qançaga kamayadi? Uçburçaklar sonining özgarmasligini tekşiring.",
      "Platformani «Smartfon AR» ga almaştiring va «Kiçik xona» ni oçing: u smartfon byudjetiga sigʼadimi?"
    ], "b");
  }

  /* ================= 3: real masştab ================= */
  function box(cx, cy, cz, sx, sy, sz) { return X.mesh.transform(X.mesh.cube(1), M.mul(M.T(cx, cy, cz), M.S(sx, sy, sz))); }
  function merge(list) { var v = [], fs = []; list.forEach(function (m) { var o = v.length; m.v.forEach(function (p) { v.push(p); }); m.f.forEach(function (q) { fs.push(q.map(function (k) { return k + o; })); }); }); return { v: v, f: fs }; }
  var OBJ = {
    door: { name: "Eşik", h: 2.0, hint: "odatda ≈ 2 m", mesh: merge([box(0.45, 0, 1.0, 0.9, 0.05, 2.0), box(0.8, -0.05, 1.0, 0.1, 0.05, 0.05)]), col: "#C9A27A" },
    chair: { name: "Stul", h: 0.9, hint: "odatda ≈ 0,9 m", mesh: merge([box(0.225, 0.225, 0.45, 0.45, 0.45, 0.04), box(0.225, 0.02, 0.675, 0.45, 0.04, 0.45)].concat([[0.03, 0.03], [0.42, 0.03], [0.03, 0.42], [0.42, 0.42]].map(function (q) { return box(q[0], q[1], 0.215, 0.04, 0.04, 0.43); }))), col: "#8FB996" },
    table: { name: "Stol", h: 0.75, hint: "odatda ≈ 0,75 m", mesh: merge([box(0.6, 0.4, 0.73, 1.2, 0.8, 0.04)].concat([[0.05, 0.05], [1.15, 0.05], [0.05, 0.75], [1.15, 0.75]].map(function (q) { return box(q[0], q[1], 0.355, 0.06, 0.06, 0.71); }))), col: "#D9B38C" },
    mug: { name: "Krujka", h: 0.1, hint: "odatda ≈ 10 sm", mesh: X.mesh.transform(X.mesh.cylinder(20, 0.04, 0.1), M.T(0.04, 0.04, 0.05)), col: "#F2B8A8" }
  };
  var UN = {
    m: { name: "metr", U: 1, ok: 1 }, cm: { name: "santimetr", U: 100, ok: 0.01 }, mm: { name: "millimetr", U: 1000, ok: 0.001 }, inch: { name: "dyuym (inch)", U: 1 / 0.0254, ok: 0.0254 }
  };
  var SCEN = [["door", "cm"], ["chair", "inch"], ["table", "mm"], ["mug", "m"], ["mug", "cm"], ["door", "m"]];
  var FACT = [[1, "× 1"], [0.01, "× 0,01"], [0.001, "× 0,001"], [0.0254, "× 0,0254"], [100, "× 100"]];
  function nice(x) { var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
  function tab3(L) {
    var st = { si: 0, fac: 1 };
    var S = L.scene({ grid: false, axes: false, aspect: 0.62, yaw: -0.9, pitch: 0.28, dist: 8, minDist: 0.3, maxDist: 8000 });
    var gridItem = S.add(new X.Grid({ n: 20, step: 1 }));
    var person = merge([X.mesh.transform(X.mesh.cylinder(14, 0.22, 1.45), M.T(0, 0, 0.725)), X.mesh.transform(X.mesh.uvSphere(12, 8, 0.14), M.T(0, 0, 1.61))]);
    S.add(new X.Mesh({ mesh: person, color: "#E8590C", edge: false }));
    var objItem = S.add(new X.Mesh({ mesh: OBJ.door.mesh, color: "#C9A27A", edge: "rgba(43,58,103,.45)" }));
    var dimLine = S.add(new X.Line({ pts: [[0, 0, 0], [0, 0, 1]], color: C.x, lw: 2.5 }));
    var lab = S.add(new X.Points({ pts: [[0, 0, 1.75], [0, 0, 2]], colors: [C.orange, C.x], r: 5, labels: ["", ""], front: true }));
    var R = L.readout([["raw", "Faylda balandlik"], ["h", "Balandlik, metr"], ["k", "Odamga nisbati"], ["v", "Natija"]]);
    var info = L.note("");
    var verdict = L.note("", "main");
    var seg;
    function upd(fit) {
      var sc = SCEN[st.si], o = OBJ[sc[0]], u = UN[sc[1]], U = u.U, F = st.fac, k = U * F;
      var raw = o.h * U, H = o.h * k;
      var sm = X.mesh.transform(o.mesh, M.S(k, k, k)), m = X.mesh.transform(sm, M.T(0.6, 0, 0));
      objItem.o.mesh = m; objItem.o.color = o.col;
      var xl = -0.5;
      dimLine.o.pts = [[xl, 0, 0], [xl, 0, H]];
      lab.o.pts = [[0, 0, 1.75], [xl, 0, H]]; lab.o.labels = ["odam 1,75 m", f(H, H < 1 ? 3 : 2) + " m"];
      var big = Math.max(1.75, H), step = nice(big / 6);
      gridItem.o.step = step; gridItem.o.n = 20;
      if (fit !== false) { S.target = [Math.min(big * 0.15, 40 * big), 0, big * 0.45]; S.dist = Math.max(3.2, big * 2.5); }
      var ratio = H / 1.75, ok = Math.abs(H - o.h) / o.h < 0.005;
      R.setMany({ raw: f(raw, raw < 10 ? 3 : 1) + " birlik", h: f(H, H < 1 ? 3 : 2) + " m", k: "× " + f(ratio, ratio < 1 ? 3 : 1), v: ok ? "Töğri masştab" : "Notöğri" });
      info.innerHTML = "<b>" + o.name + "</b> (" + o.hint + "). Fayl birligi: <b>" + u.name + "</b> — Importda 1 birlik = 1 m deb qabul qilinadi. Tör qadami: " + f(step, 3) + " m.";
      verdict.className = ok ? "note" : "note warn";
      verdict.innerHTML = ok ? "<b>Töğri!</b> " + o.name + " balandligi " + f(H, 3) + " m — odam (1,75 m) bilan soliştirganda mantiqiy." :
        "<b>Masştab xato:</b> " + o.name + " " + f(H, H < 1 ? 3 : 2) + " m balandlikda, odamdan " + (ratio >= 1 ? f(ratio, ratio < 10 ? 1 : 0) + " marta balandroq" : f(1 / ratio, 1 / ratio < 10 ? 1 : 0) + " marta pastroq") + ". Koeffitsiyentni almaştiring.";
      S.draw();
    }
    seg = L.seg("Masştab koeffitsiyenti (birlik → metr)", FACT, 1, function (v) { st.fac = Number(v); upd(false); });
    L.button("Keyingi vazifa (boşqa obyekt va birlik)", function () { st.si = (st.si + 1) % SCEN.length; st.fac = 1; seg.set(1, true); upd(true); }, "ghost");
    L.button("Kamerani moslaş", function () { upd(true); }, "ghost");
    L.note("Qoida: <b>1 birlik = 1 m</b>. Santimetrda saqlangan fayl 100 marta katta, millimetrda — 1000 marta katta, dyuymda — 39,37 marta katta körinadi; töğri koeffitsiyent: <b>0,01; 0,001; 0,0254</b>. Metrda saqlangan fayl uçun koeffitsiyent 1. Eksportda Scale / Apply Scalings va Import sozlamalarida Scale Factor şuni boşqaradi.", "main");
    upd(true);
    L.tasks([
      "Birinçi vazifada (eşik, santimetrda saqlangan) obyekt balandligi qançaligini körib, qaysi koeffitsiyent uni 2 m ga keltirişini toping. [× 0,01]",
      "«Keyingi vazifa» ni bosing (stul, dyuym): koeffitsiyent 0,01 bölsa qanday xato qoladi? Töğri koeffitsiyentni toping. [× 0,0254 ⇒ 0,9 m]",
      "Krujka «metr» faylida uçrasa koeffitsiyent nima bölişi kerak? Balandlikni metr va santimetrda yozing. [× 1; 0,1 m = 10 sm]"
    ], "c");
  }

  LAB.start({
    intro: "VR va AR uçun model tayyorlaşda uç narsa hal qiluvçi: kadr vaqti byudjeti, draw call va uçburçaklar soni, hamda real masştab (1 birlik = 1 m).",
    tabs: [
      { name: "Kadr byudjeti", lead: "Çastota oşgan sari bir kadrga ajratilgan vaqt kamayadi. CPU va GPU xarajatini sozlab, stereo rejimning taʼsirini kuzating.", build: tab1 },
      { name: "Draw call va uçburçak", lead: "Sahnaga obyektlar qöşing va platforma byudjeti bilan solişitiring. Instancing va material birlaştiriş draw call sonini qanday özgartirişini kuzating.", build: tab2 },
      { name: "Real masştab", lead: "Importdan keyin obyekt notöğri ölçamda körinadi. Odam (1,75 m) bilan solişitib, töğri koeffitsiyentni toping.", build: tab3 }
    ]
  });
})();
