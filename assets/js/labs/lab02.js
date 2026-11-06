/* 2-mavzu. 3D grafika vaqt çizigi */
(function () {
  var X = window.X3D, V = X.v, C = LAB.C, f = X.fmt;

  /* ---------- 1-tab: vaqt çizigi ---------- */
  var CAT = {
    alg: { name: "Renderlaş algoritmlari", col: C.z },
    geo: { name: "Geometriya va maʼlumot", col: C.teal },
    tool: { name: "Dasturlar va kino", col: C.orange },
    rt: { name: "Real vaqt va neyron sahna", col: C.violet }
  };
  var LANES = ["alg", "geo", "tool", "rt"];
  var EV = [
    { y: 1963, c: "geo", t: "Sketchpad", w: "Ivan Sutherland (MIT)", d: "Doktorlik işi sifatida yaratilgan çizma dasturi: yoruğlik qalami bilan ekranda interaktiv çizilgan va özgartirilgan. Zamonaviy CAD va grafik interfeyslarning asosi." },
    { y: 1971, c: "alg", t: "Gouraud soyalaşi", w: "Henri Gouraud", d: "Yoruğlik yoqning çöqqilarida hisoblanadi va yoq içida interpolyatsiya qilinadi. Silliq körinadi, lekin yaltiroq nuqta çöqqilar orasida yöqolişi mumkin." },
    { y: 1974, c: "geo", t: "Catmullning dissertatsiyasi", w: "Edwin Catmull (Yuta universiteti)", d: "Z-bufer (z-buffer) va tekstura xaritalaş (texture mapping) usullari taklif etilgan. Bugun har bir videokartada işlatiladi." },
    { y: 1975, c: "alg", t: "Phong modeli va soyalaşi", w: "Bui Tuong Phong", d: "Yoruğlik modeli (diffuz va yaltiroq tarkib) hamda normallarni yoq içida interpolyatsiya qiladigan Phong soyalaşi." },
    { y: 1975, c: "geo", t: "Yuta çoynagi (Utah teapot)", w: "Martin Newell", d: "Bezier yamoqlaridan qurilgan çoynak modeli. Sinov modeli sifatida hamon keng qöllanadi." },
    { y: 1978, c: "geo", t: "Subdivision sirtlar", w: "Catmull–Clark va Doo–Sabin", d: "Ixtiyoriy törtburçakli tör modelni limitda silliq sirtga aylantiradigan usullar. Catmull–Clark bugun ham subdivision modellaşning asosi." },
    { y: 1980, c: "alg", t: "Rekursiv nur kuzatiş", w: "Turner Whitted", d: "Qaytiş va sinişni hisobga olgan birinçi amaliy nur kuzatiş (ray tracing) usuli: nur sirtga tegsa, yangi nurlar yuboriladi." },
    { y: 1984, c: "alg", t: "Taqsimlangan nur kuzatiş", w: "Cook, Porter, Carpenter", d: "Har pikselga bir neça tasodifiy nur: yumşoq soyalar, defokus xiraligi va harakat xiraligi paydo bölidi." },
    { y: 1986, c: "alg", t: "Renderlaş tenglamasi", w: "James Kajiya", d: "Yoruğlik tarqalişining umumiy matematik ifodasi. Path tracing va boşqa Monte-Karlo usullari uni taqriban yeçadi." },
    { y: 1987, c: "geo", t: "Marching Cubes", w: "Lorensen va Cline", d: "Hajmiy maʼlumotdan (masalan, tibbiy tomografiya) izosirtni uçburçaklar töri sifatida quriş usuli." },
    { y: 1995, c: "tool", t: "Toy Story", w: "Pixar", d: "Tamomila kompyuterda yaratilgan birinçi uzun metrajli film." },
    { y: 1996, c: "tool", t: "3D Studio MAX", w: "Kinetix (Autodesk)", d: "Windows uçun çiqarilgan modellaş va animatsiya dasturi, DOS davridagi 3D Studio ning davomi." },
    { y: 1998, c: "tool", t: "Maya", w: "Alias|Wavefront", d: "Modellaş, animatsiya va effektlar uçun professional paket (keyinçalik Autodesk Maya)." },
    { y: 2002, c: "tool", t: "Blender açiq kod bölidi", w: "Blender Foundation", d: "Blenderning manba kodi açiq litsenziya (GNU GPL) ostida çiqarildi." },
    { y: 2017, c: "geo", t: "glTF 2.0", w: "Khronos Group", d: "3D sahnalarni veb va ilovalarda samarali uzatiş uçun format. Köpinça «3D uçun JPEG» deb taʼriflanadi." },
    { y: 2018, c: "rt", t: "NVIDIA RTX", w: "NVIDIA", d: "Isteʼmolçi videokartalarda real vaqtda nur kuzatiş uçun apparat yordami (RT yadrolari)." },
    { y: 2020, c: "rt", t: "NeRF", w: "Mildenhall va hammuallifları", d: "Neural Radiance Fields: bir neça fotosuratdan neyron tör yordamida yangi körinişlarni sintez qiladi." },
    { y: 2022, c: "rt", t: "Unreal Engine 5", w: "Epic Games", d: "Nanite (virtual geometriya) va Lumen (dinamik global yoritiş) bilan real vaqt renderlaşi." },
    { y: 2023, c: "rt", t: "3D Gaussian Splatting", w: "Kerbl va hammuallifları", d: "Sahna 3D Gaussʼlar töplami sifatida ifodalanadi va real vaqtda yuqori sifatli çiziladi." }
  ];
  EV.forEach(function (e) { e.d = e.d; });

  function tab1(L) {
    var st = { sel: 4, filt: "all" };
    var cv = L.canvas({ aspect: 0.58, maxH: 330 });
    var detail = EX.el("div", { class: "note", style: "border-left:5px solid " + C.z });
    var list = EX.el("div", { style: "display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))" });
    var pos = [];
    function shown(e) { return st.filt === "all" || e.c === st.filt; }
    cv.draw = function (c, w, h) {
      var x0 = 20, x1 = w - 20, top = 26, bot = h - 32, i;
      function X_(y) { return x0 + (y - 1963) / 60 * (x1 - x0); }
      function Y_(lane) { return top + (bot - top) * (LANES.indexOf(lane) + 0.5) / 4; }
      c.font = "11px Inter, system-ui, sans-serif"; c.textAlign = "center";
      for (var y = 1970; y <= 2020; y += 10) { c.strokeStyle = "rgba(24,32,47,.12)"; c.lineWidth = 1; c.beginPath(); c.moveTo(X_(y), top - 10); c.lineTo(X_(y), bot + 6); c.stroke(); c.fillStyle = C.ink3; c.fillText(String(y), X_(y), h - 8); }
      LANES.forEach(function (l) { c.strokeStyle = CAT[l].col; c.globalAlpha = 0.35; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, Y_(l)); c.lineTo(x1, Y_(l)); c.stroke(); c.globalAlpha = 1; });
      pos = EV.map(function (e) { return [X_(e.y), Y_(e.c)]; });
      EV.forEach(function (e, k) {
        var on = k === st.sel, sh = shown(e);
        c.globalAlpha = sh ? 1 : 0.18;
        c.beginPath(); c.arc(pos[k][0], pos[k][1], on ? 9 : 5.5, 0, 7); c.fillStyle = CAT[e.c].col; c.fill();
        c.lineWidth = on ? 3 : 1.5; c.strokeStyle = on ? C.ink : "#fff"; c.stroke();
        c.globalAlpha = 1;
      });
      var e = EV[st.sel]; c.textAlign = "center"; c.font = "800 13px Inter, system-ui, sans-serif"; c.fillStyle = C.ink;
      c.fillText(String(e.y), Math.max(x0 + 14, Math.min(x1 - 14, pos[st.sel][0])), pos[st.sel][1] - 14);
      c.textAlign = "left";
    };
    function renderDetail(scroll) {
      var e = EV[st.sel];
      detail.style.borderLeftColor = CAT[e.c].col;
      detail.innerHTML = '<div style="font-weight:800;font-size:22px;color:' + CAT[e.c].col + '">' + e.y + '</div><div style="font-weight:700;font-size:17px">' + e.t + '</div><div style="color:var(--ink-2);font-size:14px;margin:2px 0 6px">' + e.w + " · " + CAT[e.c].name + "</div><div>" + e.d + "</div>";
      Array.prototype.forEach.call(list.children, function (b, k) { b.style.outline = k === st.sel ? "3px solid " + CAT[EV[k].c].col : "none"; });
      cv.redraw();
      if (scroll && detail.scrollIntoView) detail.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    function select(k, scroll) { st.sel = k; renderDetail(scroll); }
    EV.forEach(function (e, k) {
      var b = EX.el("button", { type: "button", style: "text-align:left;border:1px solid var(--line);border-left:5px solid " + CAT[e.c].col + ";background:#fff;border-radius:10px;padding:8px 10px;font:600 14px var(--font);cursor:pointer" },
        EX.el("span", { style: "color:" + CAT[e.c].col + ";font-weight:800" }, e.y + "  "), e.t);
      b.addEventListener("click", function () { select(k, true); });
      b.dataset.k = k; list.appendChild(b);
    });
    cv.canvas.addEventListener("click", function (ev) {
      var r = cv.canvas.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, best = -1, bd = 22;
      pos.forEach(function (p, k) { if (!shown(EV[k])) return; var d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = k; } });
      if (best >= 0) select(best, false);
    });
    L.seg("Tur böyiça filtr", [["all", "Hammasi"]].concat(LANES.map(function (l) { return [l, CAT[l].name]; })), "all", function (v) {
      st.filt = v;
      Array.prototype.forEach.call(list.children, function (b, k) { b.hidden = !shown(EV[k]); });
      if (!shown(EV[st.sel])) { for (var k = 0; k < EV.length; k++) if (shown(EV[k])) { st.sel = k; break; } }
      renderDetail(false);
    });
    L.add(EX.el("div", { class: "legend", html: LANES.map(function (l) { return '<span><i style="background:' + CAT[l].col + '"></i>' + CAT[l].name + "</span>"; }).join("") }), "main");
    L.add(detail, "main"); L.add(list, "main");
    renderDetail(false);
    L.tasks([
      "Vaqt çiziğida 1971 va 1975 yillarni tanlang: Gouraud va Phong soyalaşi orasidagi farq nimada? (Keyingi tabda taqqoslaysiz.)",
      "«Renderlaş algoritmlari» filtrini yoqing: nur kuzatiş usullari qaysi yillarda paydo bölgan? [1980, 1984, 1986]",
      "«Real vaqt va neyron sahna» filtri: 2018–2023 oralığida neçta kartoçka bor va ular qanday yangi yönalişni körsatadi? [4 ta]"
    ], "a");
  }

  /* ---------- 2-tab: flat / Gouraud / Phong ---------- */
  var KA = 0.12, KD = 0.8, KS = 0.7, BASE = [0.3, 0.52, 0.95], TILT = 0.3;
  function renderSphere(seg, rings, az, el, nsh, method, W) {
    var m = X.mesh.uvSphere(seg, rings, 1), ca = Math.cos(TILT), sa = Math.sin(TILT);
    // köriniş fazosi: X — ong, Y — yuqori, Z — kuzatuvçiga; qutb Y öqida
    var P = m.v.map(function (p) { var Y = p[2], Z = -p[1]; return [p[0], Y * ca - Z * sa, Y * sa + Z * ca]; });
    var Lv = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
    function DS(n) {
      var nl = V.dot(n, Lv), d = KA + KD * Math.max(0, nl), s = 0;
      if (nl > 0) { var R = V.sub(V.mul(n, 2 * nl), Lv); s = KS * Math.pow(Math.max(0, R[2]), nsh); }
      return [d, s];
    }
    var img = new ImageData(W, W), D = img.data, zb = new Float32Array(W * W), Sb = new Float32Array(W * W), i;
    for (i = 0; i < zb.length; i++) zb[i] = -Infinity;
    for (i = 0; i < D.length; i += 4) { D[i] = 240; D[i + 1] = 243; D[i + 2] = 248; D[i + 3] = 255; }
    var sc = W / 2.3;
    var S2 = P.map(function (p) { return [W / 2 + p[0] * sc, W / 2 - p[1] * sc]; });
    var vds = method === "gouraud" ? P.map(function (p) { return DS(V.norm(p)); }) : null;
    function tri(a, b, c, fl) {
      var pa = S2[a], pb = S2[b], pc = S2[c], den = (pb[1] - pc[1]) * (pa[0] - pc[0]) + (pc[0] - pb[0]) * (pa[1] - pc[1]);
      if (Math.abs(den) < 1e-9) return;
      var x0 = Math.max(0, Math.floor(Math.min(pa[0], pb[0], pc[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(pa[0], pb[0], pc[0])));
      var y0 = Math.max(0, Math.floor(Math.min(pa[1], pb[1], pc[1]))), y1 = Math.min(W - 1, Math.ceil(Math.max(pa[1], pb[1], pc[1])));
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
        var px = x + 0.5, py = y + 0.5;
        var l0 = ((pb[1] - pc[1]) * (px - pc[0]) + (pc[0] - pb[0]) * (py - pc[1])) / den;
        var l1 = ((pc[1] - pa[1]) * (px - pc[0]) + (pa[0] - pc[0]) * (py - pc[1])) / den, l2 = 1 - l0 - l1;
        if (l0 < 0 || l1 < 0 || l2 < 0) continue;
        var z = l0 * P[a][2] + l1 * P[b][2] + l2 * P[c][2], o = y * W + x;
        if (z <= zb[o]) continue;
        zb[o] = z;
        var d, s;
        if (method === "flat") { d = fl[0]; s = fl[1]; }
        else if (method === "gouraud") { d = l0 * vds[a][0] + l1 * vds[b][0] + l2 * vds[c][0]; s = l0 * vds[a][1] + l1 * vds[b][1] + l2 * vds[c][1]; }
        else {
          var n = V.norm([l0 * P[a][0] + l1 * P[b][0] + l2 * P[c][0], l0 * P[a][1] + l1 * P[b][1] + l2 * P[c][1], l0 * P[a][2] + l1 * P[b][2] + l2 * P[c][2]]);
          var r = DS(n); d = r[0]; s = r[1];
        }
        Sb[o] = s; var p = o * 4;
        D[p] = Math.min(255, 255 * (BASE[0] * d + s)); D[p + 1] = Math.min(255, 255 * (BASE[1] * d + s)); D[p + 2] = Math.min(255, 255 * (BASE[2] * d + s));
      }
    }
    m.f.forEach(function (F) {
      var pts = F.map(function (k) { return P[k]; }), n = X.mesh.normal(pts);
      if (n[2] <= 0) return;
      var fl = method === "flat" ? DS(n) : null;
      for (var t = 1; t < F.length - 1; t++) tri(F[0], F[t], F[t + 1], fl);
    });
    var mx = 0; for (i = 0; i < zb.length; i++) if (zb[i] > -Infinity && Sb[i] > mx) mx = Sb[i];
    return { img: img, maxS: mx, F: m.f.length, V: m.v.length };
  }
  function tab2(L) {
    var st = { seg: 12, az: 35, el: 40, n: 40, view: "all" }, METH = [["flat", "Flat"], ["gouraud", "Gouraud"], ["phong", "Phong"]];
    var cv = L.canvas({ aspect: 0.46 });
    var offs = {}; METH.forEach(function (mm) { offs[mm[0]] = document.createElement("canvas"); });
    var R = L.readout([["fv", "Çöqqi / yoq"], ["sf", "Flat: maks. yaltiroq"], ["sg", "Gouraud: maks. yaltiroq"], ["sp", "Phong: maks. yaltiroq"], ["lo", "Gouraud yöqotişi"]]);
    var res = {}, dirty = true;
    function compute() {
      dirty = false;
      var W = st.view === "all" ? 150 : 230, az = st.az * Math.PI / 180, el = st.el * Math.PI / 180, rings = Math.max(3, Math.round(st.seg / 2));
      METH.forEach(function (mm) {
        var r = renderSphere(st.seg, rings, az, el, st.n, mm[0], W); res[mm[0]] = r;
        var o = offs[mm[0]]; o.width = W; o.height = W; o.getContext("2d").putImageData(r.img, 0, 0);
      });
      var sp = res.phong.maxS, sg = res.gouraud.maxS;
      R.setMany({ fv: f(res.phong.V, 0) + " / " + f(res.phong.F, 0), sf: f(res.flat.maxS, 3), sg: f(sg, 3), sp: f(sp, 3), lo: sp > 1e-6 ? f((1 - sg / sp) * 100, 0) + " %" : "—" });
    }
    cv.draw = function (c, w, h) {
      if (dirty) compute();
      c.imageSmoothingEnabled = true;
      var list = st.view === "all" ? METH : METH.filter(function (mm) { return mm[0] === st.view; });
      var pw = st.view === "all" ? (w - 8) / 3 : Math.min(w, h - 24);
      list.forEach(function (mm, i) {
        var x = st.view === "all" ? 4 + i * pw : (w - pw) / 2;
        c.drawImage(offs[mm[0]], x, 0, pw - (st.view === "all" ? 4 : 0), pw - (st.view === "all" ? 4 : 0));
        c.fillStyle = C.ink; c.font = "700 13px Inter, system-ui, sans-serif"; c.textAlign = "center";
        c.fillText(mm[1], x + (pw - 4) / 2, pw + 14); c.textAlign = "left";
      });
    };
    function layout() { cv.aspect = st.view === "all" ? ((cv.w || 390) / 3 + 18) / (cv.w || 390) : 0.95; }
    function refresh() { dirty = true; layout(); cv.resize(); }
    var raf = 0;
    function sched() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; refresh(); }); }
    L.seg("Körsatiş", [["all", "Yonma-yon"], ["flat", "Flat"], ["gouraud", "Gouraud"], ["phong", "Phong"]], "all", function (v) { st.view = v; sched(); });
    L.slider({ label: "Tör ziçligi (meridianlar; halqalar = yarmi)", min: 6, max: 48, step: 2, value: st.seg, nd: 0 }, function (v) { st.seg = v; sched(); });
    L.slider({ label: "Yoruğlik: gorizontal burçak", min: -80, max: 80, step: 1, value: st.az, nd: 0, unit: "°" }, function (v) { st.az = v; sched(); });
    L.slider({ label: "Yoruğlik: balandlik burçagi", min: -30, max: 85, step: 1, value: st.el, nd: 0, unit: "°" }, function (v) { st.el = v; sched(); });
    L.slider({ label: "Yaltiroqlik darajasi n (shininess)", min: 1, max: 200, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; sched(); });
    L.note("I = k<sub>a</sub> + k<sub>d</sub>(N·L) + k<sub>s</sub>(R·V)<sup>n</sup>, R = 2(N·L)N − L. Bu yerda k<sub>a</sub> = " + f(KA, 2) + ", k<sub>d</sub> = " + f(KD, 2) + ", k<sub>s</sub> = " + f(KS, 2) + ". <b>Flat</b>: bitta qiymat har bir yoqqa. <b>Gouraud</b>: I faqat çöqqilarda hisoblanadi va interpolyatsiya qilinadi. <b>Phong</b>: normal interpolyatsiya qilinadi, I har pikselda hisoblanadi.", "main");
    layout();
    L.tasks([
      "Törni 6 ga tuşiring (eng qöpol): Phong da silliq yaltiroq dog körinadimi, Gouraud da-çi? Siluet çeti (köpburçak) hamma usulda bir xil qoladi.",
      "n ni 10 dan 150 gaça oşiring: yaltiroq dog kiçrayadi. Qaysi usulda «Maks. yaltiroq» ayniqsa pastga tuşadi? [Gouraud, yirik yoqlarda]",
      "Yoruğlikni yoqlar ortasiga qaratib (burçaklarni özgartirib) Gouraud yöqotişini kuzating: yaltiroq nuqta çöqqi yaqinida bölsa, Gouraud uni saqlab qoladi."
    ], "b");
    refresh();
  }

  LAB.start({
    intro: "3D grafika 60 yil içida interaktiv çizmadan real vaqtli nur kuzatiş va neyron sahnalargaça yetib keldi. Quyida asosiy voqealar vaqt çizigida, soyalaş usullari esa bir xil sferada taqqoslanadi.",
    tabs: [
      { name: "Vaqt çizigi", lead: "Nuqtani yoki kartoçkani tanlang: yil, muallif va mohiyati körsatiladi. Filtrlar bilan yönalişlarni ajrating.", build: tab1 },
      { name: "Flat · Gouraud · Phong", lead: "Bir xil sfera uç usulda çizilgan. Tör ziçligini kamaytirsangiz, Gouraud yaltiroq nuqtani yöqotadi, Phong esa saqlaydi.", build: tab2 }
    ]
  });
})();
