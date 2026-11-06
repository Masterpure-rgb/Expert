/* Bosh sahifa: kitob, 21 mavzu × 3 resurs, foydalaniş tartibi, mualliflar. */
(function () {
  var EX = window.EX, X = window.X3D;
  var AUTHORS = [
    { id: "nuraliyev", name: "F.M. Nuraliyev", img: "assets/img/authors/nuraliyev.jpg" },
    { id: "nazirova", name: "E.Ş. Nazirova", img: "assets/img/authors/nazirova.jpg" },
    { id: "ibodullayev", name: "S.N. Ibodullayev", img: "assets/img/authors/ibodullayev_full.jpg", pos: "50% 28%" }
  ];
  function heroCanvas(box) {
    var cv = EX.el("canvas", { role: "img", "aria-label": "Subdivision bilan silliqlangan kub — aylantiriş uçun sudrang" });
    box.appendChild(cv);
    var S = new X.Scene(cv, { dist: 3.9, pitch: 0.42, yaw: -0.7, aspect: 0.78, light: [0.3, -0.6, 0.9] });
    var m = X.mesh.catmullClark(X.mesh.catmullClark(X.mesh.cube(2)));
    S.add(new X.Mesh({ mesh: m, color: "#DCE4FA", edge: "rgba(62,99,221,.55)", lw: 0.7 }));
    S.add(new X.Axes({ len: 1.9 }));
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dragging = false, last = 0;
    cv.addEventListener("pointerdown", function () { dragging = true; });
    window.addEventListener("pointerup", function () { dragging = false; });
    function tick(ts) {
      if (!dragging && last && document.visibilityState === "visible") { S.yaw += (ts - last) * 0.00018; S.draw(); }
      last = ts; requestAnimationFrame(tick);
    }
    if (!reduce) requestAnimationFrame(tick);
  }
  function main() {
    EX.topbar(null);
    var cfg = window.EXPERT_CONFIG || {};
    var wrap = EX.el("main", { class: "wrap wide hub" });
    document.body.appendChild(wrap);
    var art = EX.el("div", { class: "hub-art" });
    wrap.appendChild(EX.el("section", { class: "hub-hero" },
      EX.el("div", { class: "hub-txt" },
        EX.el("p", { class: "hub-kicker" }, cfg.universitet || "TATU"),
        EX.el("h1", null, "Uç ölçovli modellaştiriş texnologiyalari"),
        EX.el("p", { class: "hub-sub" }, "Öquv qöllanmaning interaktiv ilovasi: har bir mavzu uçun qisqa audio tuşuntiriş, telefonda işlaydigan laboratoriya va darsda bajariladigan topşiriq."),
        EX.el("p", { class: "hub-authors" }, cfg.mualliflar || ""),
        EX.el("div", { class: "btn-row" },
          EX.el("a", { class: "btn primary", href: "#mavzular" }, "Mavzular"),
          EX.el("a", { class: "btn", href: EX.base + "mualliflar/" }, "Mualliflar"))),
      art));
    heroCanvas(art);

    var list = EX.el("section", { id: "mavzular", class: "hub-topics", "aria-label": "Mavzular" }, EX.el("h2", null, "21 mavzu"));
    Object.keys(window.BLOCKS).forEach(function (b) {
      var B = window.BLOCKS[b];
      var grp = EX.el("div", { class: "blk", style: "--bc:" + B.color + ";--bs:" + B.soft },
        EX.el("h3", null, EX.el("span", null, b + "-blok"), " " + B.name));
      window.TOPICS.filter(function (t) { return String(t.b) === String(b); }).forEach(function (t0) {
        var t = window.topicInfo(t0.n);
        function res(kind, dir, label) {
          return EX.el("a", { href: EX.base + dir + "/" + t.nn + "/", class: "res", "aria-label": t.n + "-mavzu: " + label, html: EX.icons[kind] + "<span>" + label + "</span>" });
        }
        grp.appendChild(EX.el("article", { class: "trow" },
          EX.el("div", { class: "tnum", "aria-hidden": "true" }, t.nn),
          EX.el("div", { class: "ttl" }, EX.el("b", null, t.title), EX.el("span", { class: "muted" }, "Laboratoriya: " + t.lab)),
          EX.el("div", { class: "tres" }, res("audio", "a", "Tinglaş"), res("lab", "l", "Laboratoriya"), res("task", "t", "Topşiriq"))));
      });
      list.appendChild(grp);
    });
    wrap.appendChild(list);

    wrap.appendChild(EX.el("section", { class: "hub-how" },
      EX.el("h2", null, "Qanday foydalaniladi"),
      EX.el("ol", { class: "steps" },
        EX.el("li", null, EX.el("b", null, "QR kodni skanerlang."), " Kitobdagi har bir mavzu boşida uçta kod bor: tinglaş, laboratoriya va topşiriq."),
        EX.el("li", null, EX.el("b", null, "Tinglang va sinab köring."), " Audio mavzuning asosiy ğoyasini bir-ikki daqiqada tuşuntiradi, laboratoriyada esa formulalarni özingiz özgartirib körasiz."),
        EX.el("li", null, EX.el("b", null, "Darsda topşiriqni bajaring."), " Öqituvçi bosqiçni oçganda öz ID raqamingiz va ekrandagi 4 xonali kodni kiriting. Ballar va davomat avtomatik yoziladi.")),
      EX.el("p", { class: "muted" }, "Öqituvçilar uçun: ", EX.el("a", { href: EX.base + "admin/" }, "öqituvçi paneli"), " — talabalar röyxati, jonli bosqiçlar, davomat va jurnal.")));

    var au = EX.el("section", { class: "hub-authors-sec" }, EX.el("h2", null, "Mualliflar"));
    var row = EX.el("div", { class: "au-row" });
    AUTHORS.forEach(function (a) {
      row.appendChild(EX.el("a", { class: "au", href: EX.base + "mualliflar/#" + a.id },
        EX.el("img", { src: EX.base + a.img, alt: a.name, loading: "lazy", style: a.pos ? "object-position:" + a.pos : null }),
        EX.el("b", null, a.name)));
    });
    au.appendChild(row);
    wrap.appendChild(au);
    wrap.appendChild(EX.el("footer", { class: "lab-foot" }, "© 2026 " + (cfg.mualliflar || "") + ". " + (cfg.universitet || "") + "."));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main); else main();
})();
