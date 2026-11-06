/* 1-mavzu. Koordinatalar va transformatsiyalar */
(function () {
  var X = window.X3D, M = X.m, V = X.v, C = LAB.C, f = X.fmt;

  function house() {
    var v = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, 1.2], [1, -1, 1.2], [1, 1, 1.2], [-1, 1, 1.2], [-1, 0, 2], [1, 0, 2]];
    var f = [[0, 3, 2, 1], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [7, 4, 8], [5, 6, 9], [4, 5, 9, 8], [6, 7, 8, 9]];
    return { v: v, f: f, colors: ["#C9D4F5", "#FBE3C8", "#E9EDF5", "#E9EDF5", "#E9EDF5", "#E9EDF5", "#E9EDF5", "#F2B8A8", "#F2B8A8"] };
  }
  // öq kelişuvlari: har bir öq yorliği Z-yuqori dunyoning qaysi yönalişiga mos keladi
  var CONV = {
    blender: { name: "Blender, 3ds Max", up: "Z-yuqori", hand: "öng qöl", dirs: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], unit: 1, u: "m" },
    gltf: { name: "glTF, Maya, three.js", up: "Y-yuqori", hand: "öng qöl", dirs: [[1, 0, 0], [0, 0, 1], [0, -1, 0]], unit: 1, u: "m" },
    unity: { name: "Unity", up: "Y-yuqori", hand: "çap qöl", dirs: [[1, 0, 0], [0, 0, 1], [0, 1, 0]], unit: 1, u: "m" },
    unreal: { name: "Unreal Engine", up: "Z-yuqori", hand: "çap qöl", dirs: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], unit: 100, u: "sm" }
  };
  function ConvAxes() { this.conv = CONV.blender; this.visible = true; }
  ConvAxes.prototype.collect = function (S, out) {
    var cols = [C.x, C.y, C.z], lab = ["X", "Y", "Z"], o = S.project([0, 0, 0], S._B), self = this;
    this.conv.dirs.forEach(function (d, i) {
      var e = S.project(V.mul(d, 2.6), S._B), h1 = S.project(V.mul(d, 2.35), S._B);
      out.push({ z: (o[2] + e[2]) / 2 - 0.05, draw: function (c) {
        c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(e[0], e[1]); c.strokeStyle = cols[i]; c.lineWidth = 3.5; c.stroke();
        c.beginPath(); c.arc(e[0], e[1], 4.5, 0, 7); c.fillStyle = cols[i]; c.fill();
        c.font = "800 15px Inter, system-ui, sans-serif"; c.fillStyle = cols[i]; c.fillText("+" + lab[i], e[0] + 7, e[1] - 6);
      } });
    });
  };

  LAB.start({
    intro: "3D sahnadagi har bir nuqta uçta son bilan beriladi. Bu sonlar qaysi öqlarga nisbatan ölçanayotgani va obyektga qanday transformatsiyalar qöllangani natijani tubdan özgartiradi.",
    tabs: [
      {
        name: "Sahna va körinişlar",
        lead: "Uyni har tomondan körib çiqing. Ortografik proyeksiyada uzoqdagi qirralar kiçraymaydi — çizmalar va aniq modellaş aynan şu rejimda bajariladi.",
        build: function (L) {
          var S = L.scene({ axes: false, dist: 8.5, gridOpts: { n: 12, step: 0.5 } });
          var H = house(), conv = new ConvAxes();
          S.add(new X.Mesh({ mesh: H, faceColors: H.colors }));
          S.add(conv);
          var P = [2, 3, 1.5];
          S.add(new X.Line({ pts: [P, [P[0], P[1], 0]], color: C.ink3, lw: 1.3, dash: [4, 4] }));
          S.add(new X.Line({ pts: [[P[0], 0, 0], [P[0], P[1], 0], [0, P[1], 0]], color: C.ink3, lw: 1.3, dash: [4, 4] }));
          var pt = S.add(new X.Points({ pts: [P], color: C.ink, r: 5, labels: ["P"] }));
          L.seg("Köriniş", [["persp", "Perspektiv"], ["top", "Yuqoridan"], ["front", "Old"], ["right", "Ön yon"]], "persp", function (v) { S.view(v); out(); });
          L.seg("Proyeksiya", [["p", "Perspektiv"], ["o", "Ortografik"]], "p", function (v) { S.ortho = v === "o"; S.draw(); out(); });
          L.seg("Öqlar kelişuvi", [["blender", "Blender / 3ds Max"], ["gltf", "glTF / Maya"], ["unity", "Unity"], ["unreal", "Unreal"]], "blender",
            function (v) { conv.conv = CONV[v]; S.draw(); out(); });
          var info = L.note("");
          var R = L.readout([["c", "P nuqta koordinatalari"], ["k", "Kelişuv"], ["v", "Kamera burçagi"]]);
          function out() {
            var c = conv.conv, k = c.unit;
            var q = c.dirs.map(function (d) { return V.dot(P, d) * k; });
            R.set("c", "(" + q.map(function (x) { return f(x, 1); }).join("; ") + ") " + c.u);
            R.set("k", c.up + ", " + c.hand);
            R.set("v", f(S.pitch * 180 / Math.PI, 0) + "° / " + f(((S.yaw * 180 / Math.PI) % 360 + 360) % 360, 0) + "°");
            info.innerHTML = "<b>" + c.name + ":</b> " + c.up + ", " + c.hand + " tizimi. Bir xil P nuqta Blenderʼda (2; 3; 1,5) m, " +
              "glTFʼda esa (2; 1,5; −3) m: balandlik Y öqiga ötadi, Blenderning −Y (old) yönalişi glTFʼning +Z yönalişiga aylanadi. " +
              "Unreal Engineʼda birlik — santimetr.";
          }
          S.canvas.addEventListener("pointerup", out);
          S.canvas.addEventListener("wheel", out);
          out();
          L.tasks([
            "«Yuqoridan» körinişiga ötib, proyeksiyani ortografikka almaştiring: uy tomi törtburçak va uçburçaklarga ajralganini kuzating.",
            "Öqlar kelişuvini «glTF / Maya» ga özgartiring. P nuqtaning qaysi koordinatasi işorasini özgartirdi va nima uçun?",
            "Unity va Unreal kelişuvlarini solişitiring: ikkalasi ham çap qöl tizimi, lekin yuqoriga qaragan öq har xil."
          ], "a");
        }
      },
      {
        name: "Transformatsiyalar",
        lead: "Obyekt köçiriladi (T), aylantiriladi (R) va masştablanadi (S). Kompyuter grafikasida bu amallar 4×4 matritsalarni köpaytiriş bilan bajariladi, ularning tartibi esa natijani özgartiradi.",
        build: function (L) {
          var S = L.scene({ dist: 7.5, pitch: 0.55, yaw: -1.0, gridOpts: { n: 12, step: 0.5 } });
          var box = X.mesh.transform(X.mesh.cube(1), M.S(2, 1, 0.6));
          var fc = ["#C9D4F5", "#C9D4F5", "#BFE3D0", "#F5C6C7", "#BFE3D0", "#F5C6C7"];
          var solid = S.add(new X.Mesh({ mesh: box, faceColors: fc }));
          var ghost = S.add(new X.Mesh({ mesh: box, wire: "only", wireColor: "rgba(24,32,47,.35)" }));
          var pts = S.add(new X.Points({ pts: [[0, 0, 0]], color: L.accent, r: 6, labels: ["A"], front: true }));
          var st = { t: [1.5, 0, 0], r: [0, 0, 30], s: [1.5, 1, 1], order: "TRS", ghost: true, vi: 6 };
          L.pages("Transformatsiya", [
            ["t", "Köçiriş (T)", function () { ["X", "Y", "Z"].forEach(function (a, i) { L.slider({ label: "T" + a.toLowerCase() + ", m", min: -3, max: 3, step: 0.1, value: st.t[i], nd: 1 }, function (v) { st.t[i] = v; upd(); }); }); }],
            ["r", "Aylantiriş (R)", function () { ["X", "Y", "Z"].forEach(function (a, i) { L.slider({ label: "R" + a.toLowerCase() + " (Eyler, XYZ)", min: -180, max: 180, step: 5, value: st.r[i], nd: 0, unit: "°" }, function (v) { st.r[i] = v; upd(); }); }); }],
            ["s", "Masştab (S)", function () { ["X", "Y", "Z"].forEach(function (a, i) { L.slider({ label: "S" + a.toLowerCase(), min: 0.2, max: 2.5, step: 0.1, value: st.s[i], nd: 1 }, function (v) { st.s[i] = v; upd(); }); }); }]
          ], "r");
          L.seg("Köpaytiriş tartibi", [["TRS", "M = T·R·S"], ["SRT", "M = S·R·T"]], "TRS", function (v) { st.order = v; upd(); });
          L.toggle("Ikkinçi tartibni xira körsatiş", true, function (v) { st.ghost = v; upd(); });
          L.seg("A çöqqi (lokal)", [[6, "(1; 0,5; 0,3)"], [0, "(−1; −0,5; −0,3)"], [1, "(1; −0,5; −0,3)"]], 6, function (v) { st.vi = Number(v); upd(); });
          var mat = L.matrix("Model matritsasi M (4×4)", "main");
          var R = L.readout([["l", "A — lokal koordinatalar"], ["w", "A — dunyo koordinatalari"]]);
          var rad = Math.PI / 180;
          function build(order) {
            var T = M.T(st.t[0], st.t[1], st.t[2]);
            var Rm = M.mul(M.Rz(st.r[2] * rad), M.mul(M.Ry(st.r[1] * rad), M.Rx(st.r[0] * rad)));
            var Sm = M.S(st.s[0], st.s[1], st.s[2]);
            return order === "TRS" ? M.mul(T, M.mul(Rm, Sm)) : M.mul(Sm, M.mul(Rm, T));
          }
          function upd() {
            var A = build(st.order), B = build(st.order === "TRS" ? "SRT" : "TRS");
            solid.o.mesh = X.mesh.transform(box, A);
            ghost.o.mesh = X.mesh.transform(box, B); ghost.visible = st.ghost;
            var lp = box.v[st.vi], wp = M.apply(A, lp);
            pts.o.pts = [wp];
            mat.set(A, 2, function (i, j) { return j === 3 && i < 3; });
            R.set("l", "(" + lp.map(function (x) { return f(x, 2); }).join("; ") + ")");
            R.set("w", "(" + wp.map(function (x) { return f(x, 2); }).join("; ") + ")");
            S.draw();
          }
          upd();
          L.note("Ustun-vektorlar kelişuvida p′ = M·p, M = T·R·S bölganda avval masştab, söng aylantiriş, oxirida köçiriş bajariladi. Köçiriş matritsaning oxirgi ustunida turadi (ajratib körsatilgan).", "main");
          L.tasks([
            "Sx = 2 qilib, Rz ni özgartiring. Avval «T·R·S», söng «S·R·T» tartibini tanlang: obyekt şakli qanday özgaradi?",
            "Barça burçaklarni 0 ga, masştabni 1 ga qöying: matritsaning çap yuqori 3×3 qismi birlik matritsaga aylanadi.",
            "Faqat Tx = 2 bölganda A çöqqining dunyo koordinatalari lokal koordinatalardan qança farq qiladi?"
          ], "b");
        }
      }
    ]
  });
})();
