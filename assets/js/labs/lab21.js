/* 21-mavzu. Formatlar va öqlar */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, M = X.m, V = X.v;

  /* ================= 1: öqlar va birliklar ================= */
  function house() {
    var v = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, 1.2], [1, -1, 1.2], [1, 1, 1.2], [-1, 1, 1.2], [-1, 0, 2], [1, 0, 2]];
    var fs = [[0, 3, 2, 1], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [7, 4, 8], [5, 6, 9], [4, 5, 9, 8], [6, 7, 8, 9]];
    return { v: v, f: fs, colors: ["#C9D4F5", "#FBE3C8", "#E9EDF5", "#E9EDF5", "#E9EDF5", "#E9EDF5", "#E9EDF5", "#F2B8A8", "#F2B8A8"] };
  }
  // qator i: maqsad tizimning i-öqi Blender (Z-yuqori, öng qöl) öqlari orqali; unit — metrdan birlikka koeffitsiyent
  var SYS = {
    blender: { name: "Blender", up: "Z-yuqori", hand: "öng qöl", rows: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], unit: 1, u: "m" },
    gltf: { name: "glTF", up: "Y-yuqori", hand: "öng qöl", rows: [[1, 0, 0], [0, 0, 1], [0, -1, 0]], unit: 1, u: "m" },
    unreal: { name: "Unreal Engine", up: "Z-yuqori", hand: "çap qöl", rows: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], unit: 100, u: "sm" },
    unity: { name: "Unity", up: "Y-yuqori", hand: "çap qöl", rows: [[1, 0, 0], [0, 0, 1], [0, 1, 0]], unit: 1, u: "m" }
  };
  function det3(m) { return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); }
  function conv(sys, p) { return sys.rows.map(function (r) { return (r[0] * p[0] + r[1] * p[1] + r[2] * p[2]) * sys.unit; }); }
  function tup(a, nd) { return "(" + a.map(function (x) { return f(x, nd == null ? 2 : nd); }).join("; ") + ")"; }
  function Tri() { this.sys = SYS.blender; this.visible = true; }
  Tri.prototype.collect = function (S, out) {
    var cols = [C.x, C.y, C.z], lab = ["X", "Y", "Z"], o = S.project([0, 0, 0], S._B);
    var rows = this.sys.rows, dirs = [0, 1, 2].map(function (i) { return rows[i]; });
    dirs.forEach(function (d, i) {
      var e = S.project(V.mul(d, 3.2), S._B);
      out.push({ z: (o[2] + e[2]) / 2 - 0.05, draw: function (c) {
        c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(e[0], e[1]); c.strokeStyle = cols[i]; c.lineWidth = 3.5; c.stroke();
        c.beginPath(); c.arc(e[0], e[1], 4.5, 0, 7); c.fillStyle = cols[i]; c.fill();
        c.font = "800 15px Inter, system-ui, sans-serif"; c.fillStyle = cols[i]; c.fillText("+" + lab[i], e[0] + 7, e[1] - 6);
      } });
    });
  };
  
  function tab1(L) {
    var st = { sys: "gltf", p: [2, 3, 5], ghost: false };
    var S = L.scene({ axes: false, dist: 11, aspect: 0.66, target: [0.5, 0, 2.2], gridOpts: { n: 14, step: 1 } });
    var H = house(), tri = new Tri();
    S.add(new X.Mesh({ mesh: H, faceColors: H.colors }));
    var ghost = S.add(new X.Mesh({ mesh: H, wire: "only", wireColor: "rgba(229,72,77,.8)", lw: 1.5 })); ghost.visible = false;
    S.add(tri);
    var guide = S.add(new X.Line({ pts: [[2, 3, 5], [2, 3, 0]], color: C.ink3, lw: 1.3, dash: [4, 4] }));
    var guide2 = S.add(new X.Line({ pts: [[2, 0, 0], [2, 3, 0], [0, 3, 0]], color: C.ink3, lw: 1.3, dash: [4, 4] }));
    var pt = S.add(new X.Points({ pts: [[2, 3, 5]], color: C.ink, r: 5, labels: ["P"], front: true }));
    var R = L.readout([["b", "Blender (m)"], ["g", "glTF (m)"], ["r", "Unreal (sm)"], ["u", "Unity (m)"]], "main");
    var R2 = L.readout([["d", "det (öqlar matritsasi)"], ["h", "Qöl kelişuvi"], ["w", "Qadam (Blender → tanlangan)"]], "main");
    var mat = L.matrix("Blender → tanlangan tizim: p′ = M·p (3×3; birlik koeffitsiyenti qöşilgan)", "main");
    var info = L.note("", "main");
    var uR = L.readout([["cm", "sm"], ["mm", "mm"], ["in", "dyuym (inch)"]], "main");
    function upd() {
      tri.sys = SYS[st.sys];
      var p = st.p, sy = SYS[st.sys], d = det3(sy.rows);
      R.setMany({ b: tup(p, 1), g: tup(conv(SYS.gltf, p), 1), r: tup(conv(SYS.unreal, p), 0), u: tup(conv(SYS.unity, p), 1) });
      R2.setMany({ d: (d > 0 ? "+" : "−") + "1", h: d > 0 ? "öng qöl saqlanadi" : "çap qöl: bir öq işorasi almaşadi", w: sy.name + " (" + sy.up + ", " + sy.hand + ", " + sy.u + ")" });
      mat.set(sy.rows.map(function (r) { return r.map(function (x) { return x * sy.unit; }); }), 0, function (i, j) { return Math.abs(sy.rows[i][j]) > 0; });
      guide.o.pts = [[p[0], p[1], p[2]], [p[0], p[1], 0]]; guide2.o.pts = [[p[0], 0, 0], [p[0], p[1], 0], [0, p[1], 0]]; pt.o.pts = [p.slice()];
      ghost.visible = st.ghost && st.sys !== "blender";
      ghost.o.mesh = { v: H.v.map(function (q) { return sy.rows.map(function (r) { return r[0] * q[0] + r[1] * q[1] + r[2] * q[2]; }); }), f: H.f };
      var line = { blender: "Blender (va 3ds Max): Z yuqoriga, birlik — metr. Boşlanğiç tizim.", gltf: "glTF: Y yuqoriga, +Z — «oldinga»; x′ = x, y′ = z, z′ = −y (X atrofida −90° buriliş, det = +1). Misol: (2; 3; 5) → (2; 5; −3).",
        unreal: "Unreal Engine: Z yuqoriga, çap qöl, 1 birlik = 1 sm: (x; −y; z)·100. Misol: (2; 3; 5) m → (200; −300; 500) sm.", unity: "Unity: Y yuqoriga, çap qöl, 1 birlik = 1 m. glTFdan (x; y; z) → (x; y; −z): Blenderdan (x; z; y). Ayrim importyorlar boşqa öqni inversiyalaydi (masalan, x ni) — muhimi, bitta öq işorasi almaşadi." }[st.sys];
      info.innerHTML = line + (st.ghost && st.sys !== "blender" ? " <b>Qizil tör:</b> sonlar özgartirilmay Blenderʼga yuklansa model «yotib qoladi»." : "");
      var v = Number(lenIn.get()) || 0;
      uR.setMany({ cm: f(v * 100, 2), mm: f(v * 1000, 1), in: f(v / 0.0254, 2) });
      S.draw();
    }
    L.seg("Maqsad tizim", [["gltf", "glTF"], ["unreal", "Unreal"], ["unity", "Unity"], ["blender", "Blender"]], "gltf", function (v) { st.sys = v; upd(); });
    ["x", "y", "z"].forEach(function (a, i) {
      L.slider({ label: "P nuqta, " + a + " (Blender)", min: i === 2 ? 0 : -6, max: i === 2 ? 8 : 6, step: 0.5, value: st.p[i], nd: 1, unit: "m" }, function (v) { st.p[i] = v; upd(); });
    });
    L.toggle("Xato: öqlarni almaştirmay yuklaş (qizil tör)", false, function (v) { st.ghost = v; upd(); });
    L.button("Kitob misoli: (2; 3; 5)", function () { st.p = [2, 3, 5]; var sl = document.querySelectorAll(".lab-panel:not([hidden]) input[type=range]"); [2, 3, 5].forEach(function (v, i) { sl[i].value = v; }); upd(); }, "ghost");
    var lenIn = L.number({ label: "Uzunlik (m) — birliklar konvertatsiyasi", value: 1.75, unit: "m", min: 0, step: 0.05 }, upd);
    L.note("Z-yuqori ↔ Y-yuqori: X atrofida ∓90° buriliş. Matritsaning determinanti −1 bölsa, tizimlar qöl kelişuvi bilan farq qiladi (öng ↔ çap) — bir öq işorasi almaşadi. Unrealda birlik santimetr, qolganlarida odatda metr.");
    upd();
    L.tasks([
      "«glTF» ni tanlab P = (2; 3; 5) qöying: glTF koordinatalari (2; 5; −3) ekanini tekşiring. Qaysi koordinata işorasi almaşti?",
      "«Unreal» ni tanlang: koordinatalar (200; −300; 500) bölişini körib, nima uçun y işorasi teskari va nima uçun sonlar 100 marta katta ekanini tuşuntiring.",
      "«Xato» tugmasini yoqing: Y-yuqori sonlari Blenderʼda qanday «yotib qolgan» model beradi? (1,75 m ni sm ga hisoblang: 175 sm.)"
    ], "a");
  }

  /* ================= 2: formatlar taqqosi ================= */
  var FM = [
    { id: "fbx", n: "FBX", w: "Autodesk (yopiq, mulkiy format); ikkilik va ASCII; öyin dvigatellari va Autodesk dasturlari orasida keng qöllaniladi.", file: "ikk. / ASCII" },
    { id: "obj", n: "OBJ", w: "Wavefront; matnli format: v, vt, vn, f, usemtl, mtllib. Animatsiya, skelet va birlik yöq.", file: "matn" },
    { id: "gltf", n: "glTF 2.0", w: "Khronos Group; ISO/IEC 12113 (2022); «3D ning JPEGʼi». .gltf — JSON (+ .bin, tasvirlar), .glb — bitta ikkilik fayl.", file: "JSON / GLB" },
    { id: "usd", n: "USD", w: "Pixar; sahna tavsifi: qatlamlar (layers) va kompozitsiya (sublayer, reference, payload, variant). .usda — matn, .usdc — ikkilik, .usdz — siqilmagan zip paketi (Apple AR).", file: "matn / ikk." },
    { id: "stl", n: "STL", w: "Uçburçaklar töplami (3D bosib çiqariş uçun). Standartda birlik ham, rang ham yöq; ikkilik hajmi 80 + 4 + 50·N bayt (N — uçburçaklar soni).", file: "ikk. / ASCII" }
  ];
  var FE = [
    { id: "geo", n: "Geometriya", v: { fbx: [2, "poligon meshlar"], obj: [2, "poligonlar (v, f)"], gltf: [2, "uçburçak, çiziq, nuqta primitivlari"], usd: [2, "mesh, egri çiziq, nuqtalar va b."], stl: [1, "faqat uçburçaklar"] } },
    { id: "uv", n: "UV", v: { fbx: [2, "bor"], obj: [2, "vt"], gltf: [2, "TEXCOORD_n"], usd: [2, "primvar (st)"], stl: [0, "yöq"] } },
    { id: "nrm", n: "Normallar", v: { fbx: [2, "bor"], obj: [2, "vn"], gltf: [2, "NORMAL (+ TANGENT)"], usd: [2, "bor"], stl: [1, "har uçburçakka bitta yoq normali"] } },
    { id: "mat", n: "Materiallar", v: { fbx: [2, "Lambert / Phong (PBR toʼliq standartlaşmagan)"], obj: [1, "alohida .mtl faylida (Phong tipi)"], gltf: [2, "PBR metallic-roughness"], usd: [2, "UsdPreviewSurface, MaterialX"], stl: [0, "yöq (rang ham standartda yöq)"] } },
    { id: "skel", n: "Skelet / skin", v: { fbx: [2, "suyaklar va skinning"], obj: [0, "yöq"], gltf: [2, "skin: JOINTS_0, WEIGHTS_0"], usd: [2, "UsdSkel"], stl: [0, "yöq"] } },
    { id: "morph", n: "Morph target", v: { fbx: [2, "blend shapes"], obj: [0, "yöq"], gltf: [2, "morph targets"], usd: [2, "UsdSkel BlendShape"], stl: [0, "yöq"] } },
    { id: "anim", n: "Animatsiya", v: { fbx: [2, "bor"], obj: [0, "yöq"], gltf: [2, "keyframe: T / R / S va weights"], usd: [2, "vaqt namunalari (time samples)"], stl: [0, "yöq"] } },
    { id: "cam", n: "Kameralar", v: { fbx: [2, "bor"], obj: [0, "yöq"], gltf: [2, "perspektiv va ortografik"], usd: [2, "UsdGeomCamera"], stl: [0, "yöq"] } },
    { id: "light", n: "Yoruğlik", v: { fbx: [2, "bor"], obj: [0, "yöq"], gltf: [1, "faqat KHR_lights_punctual kengaytmasi orqali"], usd: [2, "UsdLux"], stl: [0, "yöq"] } },
    { id: "hier", n: "Ierarxiya", v: { fbx: [2, "bor"], obj: [1, "faqat guruhlar (o, g), transformatsiyasiz"], gltf: [2, "nodes (daraxt)"], usd: [2, "prim daraxti, qatlamlar"], stl: [0, "yöq"] } },
    { id: "unit", n: "Birliklar", v: { fbx: [2, "global sozlama (unit scale)"], obj: [0, "yöq (birliksiz)"], gltf: [2, "1 birlik = 1 m, +Y yuqori (spetsifikatsiyada)"], usd: [2, "metersPerUnit, upAxis"], stl: [0, "yöq (birliksiz)"] } }
  ];
  var SYM = ["○", "▲", "●"], SCOL = ["#9AA3B2", C.gold, C.green];
  function tab2(L) {
    var st = { fm: "gltf", req: {} };
    var box = EX.el("div", { class: "stage", style: "padding:6px;touch-action:auto;overflow-x:auto" });
    L.inTop(box);
    var card = L.note("", "main"), R = L.readout([["m", "Mos formatlar"], ["k", "Tanlangan talablar"]], "main");
    function ok(fm) { return Object.keys(st.req).every(function (k) { return !st.req[k] || FE.filter(function (e) { return e.id === k; })[0].v[fm.id][0] >= 1; }); }
    function render() {
      var h = '<table style="width:100%;border-collapse:collapse;font-size:12.5px;text-align:center"><thead><tr><th style="text-align:left;padding:4px 2px;font-size:12px;color:#7A8396">Xususiyat (bosing — talab)</th>';
      FM.forEach(function (fm) { var on = fm.id === st.fm, mt = ok(fm); h += '<th data-fm="' + fm.id + '" style="padding:5px 1px;cursor:pointer;border-radius:8px 8px 0 0;' + (on ? "background:" + C.violet + ";color:#fff;" : "") + (mt ? "" : "opacity:.35;") + '">' + fm.n + "</th>"; });
      h += "</tr></thead><tbody>";
      FE.forEach(function (e) {
        var rq = !!st.req[e.id];
        h += '<tr style="border-top:1px solid #DCE1EA' + (rq ? ";background:rgba(142,78,198,.10)" : "") + '"><td data-fe="' + e.id + '" style="text-align:left;padding:7px 2px;cursor:pointer;font-weight:' + (rq ? 800 : 600) + '">' + (rq ? "✔ " : "") + e.n + "</td>";
        FM.forEach(function (fm) { var v = e.v[fm.id], mt = ok(fm); h += '<td style="font-size:17px;color:' + SCOL[v[0]] + ";" + (mt ? "" : "opacity:.35;") + (fm.id === st.fm ? "background:rgba(142,78,198,.08);" : "") + '">' + SYM[v[0]] + "</td>"; });
        h += "</tr>";
      });
      h += '<tr style="border-top:1px solid #DCE1EA"><td style="text-align:left;padding:7px 2px;font-weight:600">Fayl turi</td>';
      FM.forEach(function (fm) { h += '<td style="font-size:10.5px;color:#4A5468;padding:2px;' + (ok(fm) ? "" : "opacity:.35;") + '">' + fm.file + "</td>"; });
      h += '</tr></tbody></table><div style="font-size:12px;color:#4A5468;padding:6px 2px 2px"><span style="color:' + SCOL[2] + '">●</span> qöllab-quvvatlaydi &nbsp; <span style="color:' + SCOL[1] + '">▲</span> qisman / kengaytma bilan &nbsp; <span style="color:' + SCOL[0] + '">○</span> yöq</div>';
      box.innerHTML = h;
      var fmo = FM.filter(function (q) { return q.id === st.fm; })[0], yes = [], part = [], no = [];
      FE.forEach(function (e) { var v = e.v[fmo.id]; (v[0] === 2 ? yes : v[0] === 1 ? part : no).push(e); });
      var reqKeys = Object.keys(st.req).filter(function (k) { return st.req[k]; });
      card.innerHTML = "<b>" + fmo.n + ".</b> " + fmo.w +
        (yes.length ? "<br><b>Saqlaydi:</b> " + yes.map(function (e) { return e.n; }).join(", ") + "." : "") +
        (part.length ? "<br><b>Qisman:</b> " + part.map(function (e) { return e.n + " — " + e.v[fmo.id][1]; }).join("; ") + "." : "") +
        (no.length ? "<br><b>Yöq:</b> " + no.map(function (e) { return e.n; }).join(", ") + "." : "") +
        (reqKeys.length ? "<br><b>Talab:</b> " + reqKeys.map(function (k) { var e = FE.filter(function (q) { return q.id === k; })[0]; return e.n + ": " + e.v[fmo.id][1]; }).join("; ") + "." : "");
      var match = FM.filter(ok).map(function (q) { return q.n; });
      R.setMany({ m: match.length ? match.join(", ") : "heç biri", k: f(reqKeys.length, 0) });
    }
    box.addEventListener("click", function (e) {
      var t = e.target.closest("[data-fm],[data-fe]"); if (!t) return;
      if (t.dataset.fm) st.fm = t.dataset.fm; else st.req[t.dataset.fe] = !st.req[t.dataset.fe];
      render();
    });
    L.button("Talablarni tozalaş", function () { st.req = {}; render(); }, "ghost");
    L.note("Ustun sarlavhasini bosing — format haqida batafsil maʼlumot; qator nomini bosing — «şu xususiyat kerak» talabi: mos kelmaydigan formatlar xiralaşadi. glTF 2.0 da yoruğlik standart yadrosida yöq (KHR_lights_punctual kengaytmasi); OBJ da materiallar alohida MTL faylida; STL — faqat uçburçaklar.");
    render();
    L.tasks([
      "Talab: «Skelet / skin» va «Animatsiya» — qaysi formatlar qoladi? [FBX, glTF, USD]",
      "«Yoruğlik» ni qöşing: glTF nima uçun «qisman» (▲) deb belgilangan? Karta matnini oqing.",
      "3D bosib çiqariş uçun STL ni tanlab, nimalar saqlanmasligini sanang. Qaysi formatlar birlikni faylning özida saqlaydi? [FBX, glTF, USD]"
    ], "b");
  }

  /* ================= 3: glTF tuzilişi ================= */
  var BIN = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x80, 0x3F, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x80, 0x3F, 0, 0, 0, 0];
  function b64(a) { var s = ""; a.forEach(function (x) { s += String.fromCharCode(x); }); return btoa(s); }
  var URI = "data:application/octet-stream;base64," + b64(BIN);
  var JL = [
    ["{", ""], ['  "asset": { "version": "2.0" },', "asset"], ['  "scene": 0,', "scene"], ['  "scenes": [ { "nodes": [ 0 ] } ],', "scene"],
    ['  "nodes": [ { "mesh": 0 } ],', "node"],
    ['  "meshes": [', "mesh"], ['    { "primitives": [ {', "mesh prim"], ['        "attributes": { "POSITION": 0 }', "mesh prim"], ['    } ] }', "mesh prim"], ["  ],", "mesh"],
    ['  "accessors": [ {', "acc"], ['    "bufferView": 0,', "acc"], ['    "componentType": 5126,', "acc"], ['    "count": 3,', "acc"], ['    "type": "VEC3",', "acc"], ['    "min": [ 0, 0, 0 ],', "acc"], ['    "max": [ 1, 1, 0 ]', "acc"], ["  } ],", "acc"],
    ['  "bufferViews": [ {', "bv"], ['    "buffer": 0,', "bv"], ['    "byteOffset": 0,', "bv"], ['    "byteLength": 36,', "bv"], ['    "target": 34962', "bv"], ["  } ],", "bv"],
    ['  "buffers": [ {', "buf"], ['    "uri": "' + URI + '",', "buf"], ['    "byteLength": 36', "buf"], ["  } ]", "buf"], ["}", ""]
  ];
  var JTXT = JL.map(function (q) { return q[0]; }).join("\n");
  var MATSNIP = '"materials": [ { "pbrMetallicRoughness": {\n    "baseColorTexture": { "index": 0 },\n    "metallicFactor": 0, "roughnessFactor": 0.6 } } ],\n"textures": [ { "sampler": 0, "source": 0 } ],\n"images": [ { "uri": "wood_albedo.png" } ],\n"samplers": [ { "magFilter": 9729, "minFilter": 9987,\n    "wrapS": 10497, "wrapT": 10497 } ]';
  var BOX = [
    { id: "scene", t: "scene", s: "scenes[ ].nodes", x: 8, y: 6, w: 150, k: "g", d: "<b>scene</b> — sahnaning kiriş nuqtasi. <code>scene</code> boşlanğiç sahna indeksini, <code>scenes[i].nodes</code> esa ildiz node larni beradi. Minimal misolda bitta sahna va bitta ildiz node (0)." },
    { id: "node", t: "node", s: "nodes[ ]", x: 8, y: 58, w: 150, k: "g", d: "<b>node</b> — ierarxiya daraxtining tuguni: <code>mesh</code> (mesh indeksi), <code>children</code>, <code>translation / rotation / scale</code> yoki <code>matrix</code>, <code>camera</code>, <code>skin</code>. Obyektni joylaş va aylantiriş şu yerda bajariladi." },
    { id: "mesh", t: "mesh", s: "meshes[ ].primitives", x: 8, y: 110, w: 150, k: "g", d: "<b>mesh</b> — bir yoki bir neça <code>primitive</code> dan iborat geometriya. Bir mesh bir neça node dan takror işlatilişi mumkin." },
    { id: "prim", t: "primitive", s: "attributes · indices · material", x: 8, y: 162, w: 150, k: "g", d: "<b>primitive</b> — bitta çiziş bölagi (≈ bitta draw call): <code>attributes</code> (POSITION, NORMAL, TEXCOORD_0, TANGENT, JOINTS_0, WEIGHTS_0) accessor indekslariga işora qiladi; <code>indices</code> ixtiyoriy; <code>material</code> ixtiyoriy; <code>mode</code> körsatilmasa 4 = uçburçaklar." },
    { id: "acc", t: "accessor", s: "type · count · min/max", x: 8, y: 214, w: 150, k: "g", d: "<b>accessor</b> — baytlarni tipli maʼlumot sifatida taʼriflaydi: <code>componentType</code> 5126 = FLOAT, <code>type</code> VEC3, <code>count</code> 3 (uç çöqqi). POSITION uçun <code>min/max</code> majburiy (çegaralovçi quti)." },
    { id: "bv", t: "bufferView", s: "offset · length · stride", x: 8, y: 266, w: 150, k: "g", d: "<b>bufferView</b> — buffer ning bir bölagi: <code>byteOffset</code>, <code>byteLength</code>, ixtiyoriy <code>byteStride</code>; <code>target</code> 34962 = ARRAY_BUFFER (çöqqi atributlari), 34963 = ELEMENT_ARRAY_BUFFER (indekslar)." },
    { id: "buf", t: "buffer", s: "byteLength · uri", x: 8, y: 318, w: 150, k: "g", d: "<b>buffer</b> — xom ikkilik maʼlumot. Uç çöqqi × 3 float × 4 bayt = 36 bayt. <code>uri</code> — taşqi .bin fayl yoki data: URI (base64); .glb da birinçi buffer urisiz bölib, BIN bölagiga işora qiladi." },
    { id: "mat", t: "material", s: "pbrMetallicRoughness", x: 192, y: 162, w: 150, k: "m", opt: 1, d: "<b>material</b> (ixtiyoriy, minimal misolda yöq) — PBR metallic-roughness: <code>baseColorFactor / baseColorTexture</code>, <code>metallicFactor</code>, <code>roughnessFactor</code>; şuningdek normalTexture, occlusionTexture, emissiveTexture.", snip: 1 },
    { id: "tex", t: "texture", s: "source + sampler", x: 192, y: 214, w: 150, k: "m", opt: 1, d: "<b>texture</b> — <code>source</code> (image indeksi) va <code>sampler</code> indeksini birlaştiradi.", snip: 1 },
    { id: "img", t: "image", s: "uri / bufferView", x: 192, y: 266, w: 70, k: "m", opt: 1, d: "<b>image</b> — tasvir fayli (<code>uri</code>) yoki bufferView orqali joylangan PNG/JPEG baytlari (<code>mimeType</code> bilan). Boşqa formatlar (masalan, KTX2, WebP) kengaytma talab qiladi.", snip: 1 },
    { id: "smp", t: "sampler", s: "filter · wrap", x: 272, y: 266, w: 70, k: "m", opt: 1, d: "<b>sampler</b> — filtrlaş va qaytariş: <code>magFilter</code> 9729 = LINEAR, <code>minFilter</code> 9987 = LINEAR_MIPMAP_LINEAR, <code>wrapS/wrapT</code> 10497 = REPEAT.", snip: 1 }
  ];
  var ARR = [["scene", "node"], ["node", "mesh"], ["mesh", "prim"], ["prim", "acc"], ["acc", "bv"], ["bv", "buf"], ["prim", "mat"], ["mat", "tex"], ["tex", "img"], ["tex", "smp"]];
  function glbInfo() {
    var o = JSON.parse(JTXT); delete o.buffers[0].uri;
    var js = JSON.stringify(o), n = js.length, pad = (4 - n % 4) % 4, jp = n + pad;
    return { n: n, jp: jp, bin: BIN.length, total: 12 + 8 + jp + 8 + BIN.length, pad: pad };
  }
  function tab3(L) {
    var st = { sel: "acc" }, g = glbInfo();
    var cv = L.canvas({ aspect: 1.04 });
    var info = L.note("", "side");
    var R = L.readout([["j", "JSON bölagi"], ["b", "BIN bölagi"], ["t", "GLB jami"]], "main");
    var pre = EX.el("pre", { style: "margin:0;padding:10px;background:#F3F5FA;border:1px solid #DCE1EA;border-radius:10px;font-size:12px;line-height:1.5;overflow-x:auto;white-space:pre-wrap;word-break:break-all" });
    L.add(EX.el("div", { class: "lab-cap" }, "Minimal glTF 2.0: bitta uçburçak (3 çöqqi), indekssiz"), "main");
    L.add(pre, "main");
    var snip = EX.el("pre", { style: "margin:0;padding:10px;background:#F4EEFA;border:1px solid #DCE1EA;border-radius:10px;font-size:12px;line-height:1.5;overflow-x:auto;white-space:pre-wrap", hidden: true });
    L.add(snip, "main");
    function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    function renderJson() {
      var sel = st.sel, key = sel === "prim" ? "prim" : sel;
      pre.innerHTML = JL.map(function (q) { var on = q[1].split(" ").indexOf(key) >= 0; var t = q[0]; if (t.indexOf("base64,") > 0) t = t.replace(/base64,[A-Za-z0-9+\/=]+/, "base64," + URI.slice(URI.indexOf("base64,") + 7, URI.indexOf("base64,") + 19) + "…"); return '<span style="display:block;' + (on ? "background:rgba(255,212,59,.45);font-weight:700" : "color:#4A5468") + '">' + esc(t) + "</span>"; }).join("");
    }
    var BM = {}; BOX.forEach(function (b) { BM[b.id] = b; });
    function tx(b) { return b; }
    cv.draw = function (c, w, h) {
      var k = w / 350, hh = 34 * k;
      c.save(); c.scale(k, k);
      ARR.forEach(function (a) {
        var p = BM[a[0]], q = BM[a[1]], x1, y1, x2, y2;
        if (p.y === q.y) { x1 = p.x + p.w; y1 = p.y + 17; x2 = q.x; y2 = q.y + 17; }
        else { x1 = p.x + p.w / 2; y1 = p.y + 34; x2 = q.x + q.w / 2; y2 = q.y; if (a[0] === "tex") { x1 = p.x + (a[1] === "img" ? 36 : 114); } }
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = "#7A8396"; c.lineWidth = 1.6; c.setLineDash(BM[a[1]].opt ? [4, 3] : []); c.stroke(); c.setLineDash([]);
        var an = Math.atan2(y2 - y1, x2 - x1); c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - 7 * Math.cos(an - 0.45), y2 - 7 * Math.sin(an - 0.45)); c.lineTo(x2 - 7 * Math.cos(an + 0.45), y2 - 7 * Math.sin(an + 0.45)); c.closePath(); c.fillStyle = "#7A8396"; c.fill();
      });
      BOX.forEach(function (b) {
        var on = b.id === st.sel, col = b.k === "g" ? C.z : C.violet;
        c.fillStyle = on ? col : (b.k === "g" ? "#E8EDFB" : "#F1E8F9");
        c.strokeStyle = col; c.lineWidth = on ? 3 : 1.5; c.setLineDash(b.opt ? [5, 3] : []);
        c.beginPath(); c.roundRect ? c.roundRect(b.x, b.y, b.w, 34, 8) : c.rect(b.x, b.y, b.w, 34); c.fill(); c.stroke(); c.setLineDash([]);
        c.fillStyle = on ? "#fff" : "#18202F"; c.font = "800 13px Inter, system-ui, sans-serif"; c.textAlign = "center"; c.fillText(b.t, b.x + b.w / 2, b.y + 15);
        c.font = "10px Inter, system-ui, sans-serif"; c.fillStyle = on ? "#fff" : "#4A5468"; c.fillText(b.s, b.x + b.w / 2, b.y + 28, b.w - 6);
      });
      c.textAlign = "left"; c.font = "11px Inter, system-ui, sans-serif"; c.fillStyle = C.violet; c.fillText("ixtiyoriy (punktir)", 192, 150);
      c.fillStyle = C.z; c.fillText("geometriya zanjiri", 192, 18); c.fillStyle = "#7A8396"; c.fillText("Qutini bosing", 192, 36);
      c.restore();
    };
    cv.canvas.addEventListener("pointerdown", function (e) {
      var r = cv.canvas.getBoundingClientRect(), k = r.width / 350, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
      BOX.forEach(function (b) { if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + 34) select(b.id); });
    });
    function select(id) {
      st.sel = id; var b = BM[id];
      info.innerHTML = b.d + (b.snip ? "" : "") + (b.opt ? "<br><i>Minimal misolda bu qism yöq; quyida namuna körsatilgan.</i>" : "<br><i>Mos satrlar quyidagi JSON da sariq rangda ajratilgan.</i>");
      snip.hidden = !b.opt; snip.textContent = b.opt ? MATSNIP : "";
      renderJson(); cv.redraw();
    }
    /* GLB sxemasi */
    var glb = EX.el("div", { class: "glb" });
    L.add(EX.el("div", { class: "lab-cap" }, "GLB fayl tuzilişi (masştab emas)"), "main");
    L.add(glb, "main"); var glbNote = L.note("", "main");
    var GS = [
      { id: "h", t: "Sarlavha", s: "12 bayt", col: C.orange, d: "<b>Sarlavha (12 bayt, 3 × uint32):</b> magic = 0x46546C67 («glTF»), version = 2, length = fayl butun uzunligi (bayt). Barçasi little-endian." },
      { id: "j", t: "JSON bölagi", s: "8 bayt + JSON", col: C.z, d: "<b>JSON bölagi:</b> chunkLength (uint32), chunkType = 0x4E4F534A («JSON»), söng JSON matni (UTF-8). Uzunlik 4 baytga karrali bölişi uçun oxiriga probel (0x20) qöşiladi. Birinçi bölak — doim JSON." },
      { id: "b", t: "BIN bölagi", s: "8 bayt + maʼlumot", col: C.green, d: "<b>BIN bölagi (ixtiyoriy):</b> chunkLength, chunkType = 0x004E4942 («BIN\\0»), söng xom baytlar (çöqqilar, indekslar, tasvirlar); 4 baytga karrali qilib nollar bilan töldiriladi. JSON dagi urisiz birinçi buffer şu bölakka işora qiladi." }
    ];
    GS.forEach(function (s) {
      var b = EX.el("button", { type: "button", style: "flex:" + (s.id === "h" ? 1 : s.id === "j" ? 2.2 : 1.6) + ";border:2px solid " + s.col + ";background:#fff;border-radius:10px;padding:8px 4px;font:inherit;cursor:pointer;min-height:56px", html: "<b style='display:block;font-size:13px;color:" + s.col + "'>" + s.t + "</b><span style='font-size:11px;color:#4A5468'>" + s.s + "</span>" });
      b.addEventListener("click", function () { glbNote.innerHTML = s.d + (s.id === "h" ? " Bu misolda: length = " + f(g.total, 0) + " bayt." : s.id === "j" ? " Bu misolda JSON " + f(g.n, 0) + " bayt, 4 ga karrali: " + f(g.jp, 0) + " bayt (+" + g.pad + " probel)." : " Bu misolda 36 bayt (3 çöqqi × 12 bayt)."); });
      glb.appendChild(b);
    });
    glb.style.cssText = "display:flex;gap:6px";
    glbNote.innerHTML = GS[0].d + " Bu misolda: length = " + f(g.total, 0) + " bayt.";
    R.setMany({ j: f(g.jp, 0) + " bayt", b: f(g.bin, 0) + " bayt", t: f(g.total, 0) + " bayt" });
    L.note("Yöl: <b>scene → node → mesh → primitive → accessor → bufferView → buffer</b>. Material zanjiri: <b>material → texture → image + sampler</b>. Hamma boğlaniş — massivdagi indekslar. GLB = 12 bayt sarlavha + JSON bölagi + BIN bölagi; JSON uzunligi probellar bilan 4 ga töldiriladi.", "main");
    select("acc");
    L.tasks([
      "«accessor» ni bosing: JSON da componentType, count, type va min/max satrlari ajratiladi. Nima uçun count = 3, byteLength esa 36?  [3 çöqqi × 3 float × 4 bayt]",
      "«buffer» dan «scene» gaça yurib çiqing: qaysi maydonlar keyingi qutiga indeks bilan işora qiladi? (mesh, bufferView, buffer…)",
      "GLB tuzilişida sarlavhadagi «length» maydoni qaysi uç qismning yiğindisi? [12 + (8 + JSON) + (8 + BIN)]"
    ], "c");
  }

  LAB.start({
    intro: "3D modelni boşqa dasturga ötkazganda uç narsa muhim: koordinata öqlari va birliklar, format nimalarni saqlaydi, va fayl içida maʼlumot qanday joylaşgan.",
    tabs: [
      { name: "Öqlar va birliklar", lead: "Bir xil nuqta har bir dasturda boşqa sonlar bilan yoziladi. Blender → glTF → Unreal → Unity konvertatsiyasini va uning 3×3 matritsasini körib çiqing.", build: tab1 },
      { name: "Formatlar taqqosi", lead: "FBX, OBJ, glTF, USD va STL nimalarni saqlaydi? Format yoki xususiyat nomini bosib filtrlang.", build: tab2 },
      { name: "glTF tuzilişi", lead: "glTF fayli — indekslar bilan boğlangan massivlar. Qutini bosing: izoh va minimal JSON ning tegişli qismi ajratiladi.", build: tab3 }
    ]
  });
})();
