/* 6-mavzu. Subdivision laboratoriyasi */
(function () {
  var X = window.X3D, V = X.v, C = LAB.C, f = X.fmt, PI = Math.PI;
  var LIMIT = 3000;

  /* ---------- cageʼlar ---------- */
  // tayanç qirrali kub: har bir öq böyiça [-1, -1+s, 1-s, 1] bölinişlar
  function boxGrid(xs, ys, zs) {
    var v = [], F = [], map = {}, A = [xs, ys, zs], N = [xs.length, ys.length, zs.length];
    function id(i, j, k) {
      var key = i + "," + j + "," + k;
      if (map[key] == null) { v.push([xs[i], ys[j], zs[k]]); map[key] = v.length - 1; }
      return map[key];
    }
    function add(q) {
      var c = [0, 0, 0]; q.forEach(function (k) { c = V.add(c, v[k]); });
      var n = X.mesh.normal(q.map(function (k) { return v[k]; }));
      if (V.dot(n, c) < 0) q.reverse();
      F.push(q);
    }
    for (var ax = 0; ax < 3; ax++) {
      var u = (ax + 1) % 3, w = (ax + 2) % 3;
      [0, N[ax] - 1].forEach(function (e) {
        for (var a = 0; a < N[u] - 1; a++) for (var b = 0; b < N[w] - 1; b++) {
          var P = function (da, db) { var t = [0, 0, 0]; t[ax] = e; t[u] = a + da; t[w] = b + db; return id(t[0], t[1], t[2]); };
          add([P(0, 0), P(1, 0), P(1, 1), P(0, 1)]);
        }
      });
    }
    return { v: v, f: F };
  }
  function supportCube(s) { var p = [-1, -1 + s, 1 - s, 1]; return boxGrid(p, p, p); }
  function cylinderCage(n) { return X.mesh.cylinder(n, 1, 2); }

  // krujka: oçiq stakan (lathe, n-gon tagliklar) + dasta (2 ta devor yoqi ornida quvur)
  function mugCage(withHandle) {
    var n = 8, v = [], F = [], outer = [], inner = [], i, j;
    function ring(r, z) { var ids = []; for (j = 0; j < n; j++) { var a = 2 * PI * j / n; v.push([r * Math.cos(a), r * Math.sin(a), z]); ids.push(v.length - 1); } return ids; }
    [0, 0.3, 0.6, 0.9, 1.2].forEach(function (z) { outer.push(ring(1, z)); });
    [1.2, 0.8, 0.4, 0.15].forEach(function (z) { inner.push(ring(0.82, z)); });
    for (i = 0; i < 4; i++) for (j = 0; j < n; j++) {
      var q = [outer[i][j], outer[i][(j + 1) % n], outer[i + 1][(j + 1) % n], outer[i + 1][j]];
      if (withHandle && j === 0 && (i === 3 || i === 1)) continue;
      F.push(q);
    }
    for (j = 0; j < n; j++) F.push([outer[4][j], outer[4][(j + 1) % n], inner[0][(j + 1) % n], inner[0][j]]);        // lab (rim)
    for (i = 0; i < 3; i++) for (j = 0; j < n; j++) F.push([inner[i][j], inner[i][(j + 1) % n], inner[i + 1][(j + 1) % n], inner[i + 1][j]]);
    var b = [], t = []; for (j = n - 1; j >= 0; j--) b.push(outer[0][j]); for (j = 0; j < n; j++) t.push(inner[3][j]);
    F.push(b, t);
    if (withHandle) {
      var th = PI / n, er = [Math.cos(th), Math.sin(th), 0], et = [-Math.sin(th), Math.cos(th), 0];
      var qa = [outer[3][0], outer[3][1], outer[4][1], outer[4][0]], qb = [outer[1][0], outer[1][1], outer[2][1], outer[2][0]];
      var rho0 = Math.cos(th), K = 6, wt = 0.2, ht = 0.1;
      function path(phi) { return { rho: rho0 + 0.55 * Math.sin(phi), z: 0.75 + 0.3 * Math.cos(phi), d: [0.55 * Math.cos(phi), -0.3 * Math.sin(phi)] }; }
      var cA = [0, 0, 0]; qa.forEach(function (k) { cA = V.add(cA, v[k]); }); cA = V.mul(cA, 0.25);
      var signs = qa.map(function (k) { var d = V.sub(v[k], cA); return [V.dot(d, et) > 0 ? 1 : -1, d[2] > 0 ? 1 : -1]; });
      var rings = [];
      for (var k = 1; k < K; k++) {
        var p = path(PI * k / K), dl = Math.hypot(p.d[0], p.d[1]), nr = -p.d[1] / dl, nz = p.d[0] / dl, ids = [];
        signs.forEach(function (sg) {
          var base = V.add(V.mul(er, p.rho), [0, 0, p.z]);
          var pt = V.add(V.add(base, V.mul(et, sg[0] * wt)), V.add(V.mul(er, sg[1] * ht * nr), [0, 0, sg[1] * ht * nz]));
          v.push(pt); ids.push(v.length - 1);
        });
        rings.push(ids);
      }
      for (i = 0; i < 4; i++) F.push([qa[i], qa[(i + 1) % 4], rings[0][(i + 1) % 4], rings[0][i]]);
      for (k = 0; k < rings.length - 1; k++) for (i = 0; i < 4; i++) F.push([rings[k][i], rings[k][(i + 1) % 4], rings[k + 1][(i + 1) % 4], rings[k + 1][i]]);
      var last = rings[rings.length - 1], sig = qb.map(function (k2) {
        var bi = 0, bd = 1e9; last.forEach(function (r, q) { var d = V.len(V.sub(v[r], v[k2])); if (d < bd) { bd = d; bi = q; } }); return bi;
      });
      for (i = 0; i < 4; i++) F.push([qb[i], qb[(i + 1) % 4], last[sig[(i + 1) % 4]], last[sig[i]]]);
    }
    return { v: v, f: F };
  }
  // yopiqlik, yönalişlar va hajm işorasi tekşiruvi
  function check(m) {
    var d = {}, ok = true, vol = 0;
    m.f.forEach(function (F) {
      for (var i = 0; i < F.length; i++) { var k = F[i] + ">" + F[(i + 1) % F.length]; d[k] = (d[k] || 0) + 1; }
      for (var t = 1; t < F.length - 1; t++) vol += V.dot(m.v[F[0]], V.cross(m.v[F[t]], m.v[F[t + 1]])) / 6;
    });
    Object.keys(d).forEach(function (k) { var p = k.split(">"); if (d[k] !== 1 || d[p[1] + ">" + p[0]] !== 1) ok = false; });
    return { closed: ok, vol: vol };
  }
  
  var MODELS = {
    cube: { name: "Kub", build: function () { return X.mesh.cube(2); } },
    sup: { name: "Tayanç qirrali kub", build: function (p) { return supportCube(p.s); } },
    cyl: { name: "Silindr", build: function (p) { return cylinderCage(p.n); } },
    mug: { name: "Krujka cage", build: function () { return mugCage(true); } }
  };
  var cache = {};
  function levels(key, cage) {
    if (cache[key]) return cache[key];
    var out = [cage], m = cage;
    for (var k = 1; k <= 3; k++) { m = X.mesh.catmullClark(m); out.push(m); }
    cache = {}; cache[key] = out;                      // faqat oxirgi modelni saqlaymiz (xotira)
    return out;
  }
  function valences(m) {
    var val = m.v.map(function () { return 0; });
    X.mesh.edges(m).forEach(function (e) { val[e[0]]++; val[e[1]]++; });
    return val;
  }
  var VCOL = { 3: "#3E63DD", 4: "#B8C0D0", 5: "#E8590C", 6: "#D6336C" };
  function vcol(v) { return VCOL[Math.min(6, v)] || "#B8C0D0"; }
  function stats(lv) {
    return lv.map(function (m) { var c = X.mesh.counts(m); return c; });
  }
  function sumN(m) { var s = 0; m.f.forEach(function (F) { s += F.length; }); return s; }
  function allQuad(m) { return m.f.every(function (F) { return F.length === 4; }); }
  function predicted(m0, k) { return allQuad(m0) ? m0.f.length * Math.pow(4, k) : (k === 0 ? m0.f.length : sumN(m0) * Math.pow(4, k - 1)); }

  /* ---------- 1-tab ---------- */
  function tab1(L) {
    var S = L.scene({ dist: 4.8, pitch: 0.5, yaw: -0.8, aspect: 0.8, target: [0, 0, 0.3], gridOpts: { n: 12, step: 0.5 } });
    var surf = S.add(new X.Mesh({ mesh: { v: [], f: [] }, color: "#C9D4F5", points: true, edge: "rgba(43,58,103,.5)", lw: 0.7 }));
    var cageW = S.add(new X.Mesh({ mesh: { v: [], f: [] }, wire: "only", wireColor: "rgba(232,89,12,.9)", lw: 1.6 }));
    var st = { model: "cube", lvl: 1, s: 0.2, n: 8, cage: true, val: true }, groups = {};
    var R = L.readout([["k", "Daraja k"], ["V", "V — çöqqilar"], ["E", "E — qirralar"], ["F", "F — yoqlar"], ["chi", "V − E + F"], ["ex", "Qutblar (valentlik ≠ 4)"]]);
    var rule = L.note("", "main"), warn = L.note("", "main", "warn");
    L.add(EX.el("div", { class: "legend", html: '<span><i style="background:#3E63DD"></i>valentlik 3</span><span><i style="background:#B8C0D0"></i>valentlik 4 (muntazam)</span><span><i style="background:#E8590C"></i>valentlik 5</span><span><i style="background:#D6336C"></i>valentlik 6+</span>' }), "main");
    function update() {
      var par = st.model === "sup" ? { s: st.s } : { n: st.n };
      var cage = MODELS[st.model].build(par), key = st.model + JSON.stringify(par), lv = levels(key, cage), c0 = X.mesh.counts(cage);
      var k = st.lvl, maxK = 0, i;
      for (i = 0; i <= 3; i++) if (lv[i].f.length <= LIMIT) maxK = i;
      var show = Math.min(k, maxK), m = lv[show], cnt = X.mesh.counts(m), val = valences(m);
      surf.o.mesh = m; surf.o.pointSize = m.v.length > 700 ? 2 : 3.6;
      surf.o.points = st.val; surf.o.pointColors = val.map(vcol); surf.o.edge = m.f.length > 1500 ? "rgba(43,58,103,.25)" : "rgba(43,58,103,.5)";
      cageW.o.mesh = cage; cageW.visible = st.cage && show > 0;
      var ex = val.filter(function (x) { return x !== 4; }).length;
      R.setMany({ k: f(show, 0), V: f(cnt.V, 0), E: f(cnt.E, 0), F: f(cnt.F, 0), chi: f(cnt.chi, 0), ex: f(ex, 0) });
      warn.hidden = show === k;
      if (show !== k) warn.innerHTML = "Daraja " + k + " da yoqlar soni " + f(lv[k].f.length, 0) + " ta bölardi (> " + f(LIMIT, 0) + "): brauzer uçun daraja " + show + " gaça qisqartirildi.";
      if (allQuad(cage)) rule.innerHTML = "Cageʼning barça yoqlari törtburçak: F<sub>k</sub> = F<sub>0</sub>·4<sup>k</sup>. Bu yerda " + f(c0.F, 0) + "·4<sup>" + show + "</sup> = " + f(predicted(cage, show), 0) + " (haqiqiy: " + f(cnt.F, 0) + ").";
      else rule.innerHTML = "Cageʼda n-burçakli yoqlar bor: <b>birinçi qadamda</b> har bir n-burçakli yoq n ta törtburçakka ajraladi, F<sub>1</sub> = Σn = " + f(sumN(cage), 0) + "; söng har qadamda ×4: F<sub>k</sub> = F<sub>1</sub>·4<sup>k−1</sup>. Bu yerda F<sub>" + show + "</sub> = " + f(predicted(cage, show), 0) + " (haqiqiy: " + f(cnt.F, 0) + ").";
      S.draw();
    }
    L.seg("Cage modeli", Object.keys(MODELS).map(function (k) { return [k, MODELS[k].name]; }), "cube", function (v) {
      st.model = v; Object.keys(groups).forEach(function (g) { groups[g].hidden = g !== v; }); update();
    });
    L.slider({ label: "Subdivision daraja k (Catmull–Clark)", min: 0, max: 3, step: 1, value: st.lvl, nd: 0 }, function (v) { st.lvl = v; update(); });
    groups.sup = L.group(function () { L.slider({ label: "Tayanç halqa masofasi (qirradan)", min: 0.05, max: 0.8, step: 0.05, value: st.s, nd: 2 }, function (v) { st.s = v; update(); }); });
    groups.cyl = L.group(function () { L.slider({ label: "Silindr çöqqilari n", min: 3, max: 16, step: 1, value: st.n, nd: 0 }, function (v) { st.n = v; update(); }); });
    groups.sup.hidden = groups.cyl.hidden = true;
    L.toggle("Çöqqi valentligi ranglari", true, function (v) { st.val = v; update(); });
    L.toggle("Cage ni körsatiş (qöpol tör)", true, function (v) { st.cage = v; update(); });
    update();
    L.tasks([
      "Kubni 0 → 3 daraja subdivide qiling: yoqlar soni 6, 24, 96, 384 ekanini tekşiring. Valentligi 3 bölgan çöqqilar soni özgaradimi? [8 ta, özgarmaydi]",
      "Tayanç qirrali kubda halqa masofasini 0,05 va 0,6 qiling: nima uçun masofa kiçik bölganda burçaklar «keskin» qoladi?",
      "Silindrni daraja 1 ga ötkazing: qopqoq markazida valentligi n bölgan qutb paydo bölişini kuzating. F₀ va F₁ ni soliştiring."
    ], "a");
  }

  /* ---------- 2-tab: yoqlar soni qonuni ---------- */
  function tab2(L) {
    var keys = Object.keys(MODELS), cages = {}, st = { id: "cube" }, stat = {};
    keys.forEach(function (k) {
      var p = k === "sup" ? { s: 0.2 } : { n: 8 };
      cages[k] = MODELS[k].build(p); var lv = [cages[k]], m = cages[k];
      for (var i = 1; i <= 3; i++) { m = X.mesh.catmullClark(m); lv.push(m); }
      stat[k] = stats(lv);
    });
    var cv = L.canvas({ aspect: 0.62 });
    var colors = [C.z, C.teal, C.orange, C.violet];
    cv.draw = function (c, w, h) {
      var pad = 40, x0 = pad, W = w - pad - 10, y0 = h - 34, H = h - 34 - 14, lo = 0, hi = Math.log10(30000);
      function sy(v) { return y0 - (Math.log10(Math.max(1, v)) - lo) / (hi - lo) * H; }
      c.font = "11px Inter, system-ui, sans-serif"; c.fillStyle = C.ink3; c.strokeStyle = "rgba(24,32,47,.12)"; c.lineWidth = 1;
      [1, 10, 100, 1000].forEach(function (v) { c.beginPath(); c.moveTo(x0, sy(v)); c.lineTo(x0 + W, sy(v)); c.stroke(); c.fillText(f(v, 0), 6, sy(v) + 4); });
      c.strokeStyle = C.x; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(x0, sy(LIMIT)); c.lineTo(x0 + W, sy(LIMIT)); c.stroke(); c.setLineDash([]);
      c.fillStyle = C.x; c.fillText("3000 yoq — lab çegarasi", x0 + 4, sy(LIMIT) - 4);
      var gw = W / 4, bw = gw / 5.4;
      for (var k = 0; k <= 3; k++) {
        keys.forEach(function (key, i) {
          var F = stat[key][k].F, x = x0 + k * gw + (i + 0.6) * bw, y = sy(F);
          c.fillStyle = colors[i]; c.fillRect(x, y, bw * 0.86, y0 - y);
        });
        c.fillStyle = C.ink2; c.font = "600 12px Inter, system-ui, sans-serif"; c.fillText("k = " + k, x0 + k * gw + gw / 2 - 14, y0 + 16);
      }
      c.strokeStyle = C.ink3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + W, y0); c.stroke();
    };
    L.add(EX.el("div", { class: "legend", html: keys.map(function (k, i) { return '<span><i style="background:' + colors[i] + '"></i>' + MODELS[k].name + "</span>"; }).join("") }), "main");
    var tbl = EX.el("div", { class: "note" });
    function table() {
      var k = st.id, m0 = cages[k], rows = stat[k].map(function (c, i) {
        var p = predicted(m0, i);
        return "<tr><td>" + i + "</td><td>" + f(c.V, 0) + "</td><td>" + f(c.E, 0) + "</td><td>" + f(c.F, 0) + "</td><td>" + f(c.chi, 0) + "</td><td>" + f(p, 0) + (p === c.F ? " ✓" : " ✗") + "</td></tr>";
      }).join("");
      var ok = allQuad(m0), chk = check(m0);
      tbl.innerHTML = "<b>" + MODELS[k].name + "</b>: " + (ok ? "barça yoqlar törtburçak, F<sub>k</sub> = F<sub>0</sub>·4<sup>k</sup>" : "n-burçakli yoqlar bor, F<sub>1</sub> = Σn = " + f(sumN(m0), 0) + ", F<sub>k</sub> = F<sub>1</sub>·4<sup>k−1</sup> (k ≥ 1)") +
        '<table class="matrix" style="margin-top:8px;width:100%"><tr><th>k</th><th>V</th><th>E</th><th>F</th><th>V−E+F</th><th>qonun</th></tr>' + rows + "</table>" +
        (chk.closed ? "" : "<br>Diqqat: cage yopiq emas.");
    }
    L.seg("Jadval uçun cage", keys.map(function (k) { return [k, MODELS[k].name]; }), "cube", function (v) { st.id = v; table(); });
    L.add(tbl, "main"); table();
    L.note("Törtburçakli cageʼda har bir yoq 4 ta yoqqa bölinadi: F<sub>k</sub> = F<sub>0</sub>·4<sup>k</sup>. n-burçakli yoq (silindr qopqoği) birinçi qadamda n ta törtburçak beradi, şuning uçun F<sub>1</sub> = Σn = 2E<sub>0</sub>, söng ×4. Eyler sonlari V − E + F cageʼniki bilan bir xil qoladi (sfera töpologiyasida 2, dastali krujkada 0).", "main");
    cv.redraw();
    L.tasks([
      "Kub qatorida F ustunini tekşiring: 6, 24, 96, 384. «qonun» ustunida har satr ✓ bölişi kerak.",
      "Silindr: F<sub>0</sub> = 10 (8 yon + 2 qopqoq), F<sub>1</sub> = 48. Nima uçun F<sub>1</sub> ≠ 4·F<sub>0</sub> = 40? [qopqoqlar 8 ta törtburçakdan]",
      "Krujkada V − E + F = 0 çiqadi: dasta teşik hosil qiladi (genus = 1). Subdivision uni özgartiradimi? [yöq]"
    ], "b");
  }

  LAB.start({
    intro: "Catmull–Clark subdivision har bir qadamda cageʼni silliqlaydi va yoqlarni törtburçaklarga böladi. Bu laboratoriyada daraja, tayanç qirralar va çöqqi valentligi (qutblar) sirtga qanday taʼsir qilişini körasiz.",
    tabs: [
      { name: "Subdivision va qutblar", lead: "Cageʼni va darajani tanlang. Çöqqilar valentligiga qarab ranglangan: muntazam çöqqida 4 ta qirra uçraşadi, qutblarda esa 3 yoki 5 va undan köp.", build: tab1 },
      { name: "Yoqlar soni qonuni", lead: "Har bir qadamda yoqlar soni qanday ösişini jadval va grafikdan körib çiqing.", build: tab2 }
    ]
  });
})();
