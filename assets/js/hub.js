/* Bosh sahifa: kitob, 21 mavzu × 3 resurs, foydalaniş tartibi, mualliflar.
   Hero — 3D muharrir viewporti: perspektiv tör, subdivision kub (faol obyekt konturi), XYZ gizmo,
   kitob nomi esa televizion titr («lower third») sifatida. */
(function () {
  var EX = window.EX, X = window.X3D, el = EX.el;
  var AUTHORS = [
    { id: "nuraliyev", name: "F.M. Nuraliyev", role: "Texnika fanlari doktori, professor", img: "assets/img/authors/nuraliyev.jpg" },
    { id: "nazirova", name: "E.Ş. Nazirova", role: "Texnika fanlari doktori, professor", img: "assets/img/authors/nazirova.jpg" },
    { id: "ibodullayev", name: "S.N. Ibodullayev", role: "Katta öqituvçi", img: "assets/img/authors/ibodullayev_full.jpg", pos: "50% 28%" }
  ];
  var AX = [["X", "#FF5A5F", [1, 0, 0]], ["Y", "#3DD68C", [0, 1, 0]], ["Z", "#5B8CFF", [0, 0, 1]]];

  function gizmo(c, S) {
    var B = S._B, small = S.w < 640, r = small ? 26 : 38, cx = S.w - r - (small ? 22 : 34), cy = r + (small ? 20 : 30), V = X.v, items = [];
    AX.forEach(function (a) {
      var d = a[2];
      items.push({ x: V.dot(d, B.r), y: -V.dot(d, B.u), z: V.dot(d, B.f), lab: a[0], col: a[1], pos: true });
      items.push({ x: -V.dot(d, B.r), y: V.dot(d, B.u), z: -V.dot(d, B.f), col: a[1], pos: false });
    });
    items.sort(function (p, q) { return q.z - p.z; });
    c.beginPath(); c.arc(cx, cy, r + 13, 0, 7); c.fillStyle = "rgba(236,239,243,.045)"; c.fill();
    items.forEach(function (p) {
      var px = cx + p.x * r, py = cy + p.y * r;
      if (p.pos) {
        c.strokeStyle = p.col; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(px, py); c.stroke();
        c.beginPath(); c.arc(px, py, small ? 8 : 9.5, 0, 7); c.fillStyle = p.col; c.fill();
        c.fillStyle = "#14171C"; c.font = "700 " + (small ? 10 : 11) + "px Inter, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(p.lab, px, py + 0.5);
      } else {
        c.beginPath(); c.arc(px, py, small ? 6 : 7, 0, 7); c.globalAlpha = 0.32; c.fillStyle = p.col; c.fill(); c.globalAlpha = 1;
      }
    });
    c.textAlign = "left"; c.textBaseline = "alphabetic";
  }

  function viewport(screen) {
    var cv = el("canvas", { role: "img", "aria-label": "Subdivision bilan silliqlangan kub — aylantiriş uçun sudrang" });
    screen.insertBefore(cv, screen.firstChild);
    var wide = function () { return window.innerWidth >= 900; };
    var S = new X.Scene(cv, { dist: 5.6, pitch: 0.36, yaw: -0.7, aspect: 0.8, light: [0.35, -0.55, 0.85], target: [0, 0, 0.82],
      bg: "#191D24", cx: wide() ? 0.68 : 0.5, cy: wide() ? 0.47 : 0.54 });
    var lift = X.m.T(0, 0, 0.82), cc = X.mesh.catmullClark;
    var m = X.mesh.transform(cc(cc(cc(X.mesh.cube(2)))), lift);
    S.add(new X.Grid({ n: 48, step: 0.5, color: "#AEB6C2", alpha: 0.2, fade: true, axisColors: ["#FF5A5F", "#3DD68C"] }));
    S.add(new X.Mesh({ mesh: m, color: "#B9C1CD", edge: "rgba(20,23,28,.22)", lw: 0.5, outline: "#FF9F1C", outlineW: 2.6 }));
    // boşlanğiç kub — subdivision «qafasi» (cage)
    S.add(new X.Mesh({ mesh: X.mesh.transform(X.mesh.cube(2), lift), wire: "only", wireColor: "rgba(236,239,243,.42)", lw: 1, points: true, pointColor: "#ECEFF3", pointSize: 2.4 }));
    S.onDraw = gizmo;
    // balandlik: kompyuterda ekranning katta qismi, telefonda kenglikka nisbatan
    function fit() {
      var w = screen.getBoundingClientRect().width || window.innerWidth;
      var h = wide() ? Math.max(440, Math.min(window.innerHeight - 110, 640)) : Math.round(w * 0.82);
      S.aspect = h / w; S.cx = wide() ? 0.68 : 0.5; S.cy = wide() ? 0.47 : 0.52; S.dist = wide() ? 5.2 : 4.9; S.resize();
    }
    window.addEventListener("resize", fit); fit();

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dragging = false, running = false, inView = true, last = 0;
    cv.addEventListener("pointerdown", function () { dragging = true; });
    window.addEventListener("pointerup", function () { dragging = false; });
    window.addEventListener("pointercancel", function () { dragging = false; });
    function loop(ts) {
      if (!running) return;
      if (!dragging && last) { S.yaw += Math.min(ts - last, 64) * 0.00016; S.draw(); }
      last = ts; requestAnimationFrame(loop);
    }
    function start() { if (running || reduce || !inView || document.visibilityState !== "visible") return; running = true; last = 0; requestAnimationFrame(loop); }
    function stop() { running = false; }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) start(); else stop(); }).observe(cv);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") start(); else stop(); });
    start();
  }

  function main() {
    EX.topbar(null);
    var cfg = window.EXPERT_CONFIG || {};
    var topbar = EX.$(".topbar");

    // ---- hero: viewport + lower third ----
    var screen = el("div", { class: "vp-screen" },
      el("div", { class: "vp-safe", "aria-hidden": "true" }),
      el("div", { class: "vp-head", "aria-hidden": "true" }, el("span", null, "Perspektiv köriniş"), el("span", null, "Kub, subdivision 3-daraja")));
    var lt = el("div", { class: "lt" },
      el("div", { class: "lt-plates" },
        el("div", { class: "lt-tab", "aria-hidden": "true" }, "3D"),
        el("h1", { class: "lt-title" }, el("span", null, "Uç ölçovli modellaştiriş"), " ", el("span", null, "texnologiyalari")),
        el("p", { class: "lt-sub" }, cfg.mualliflar || "")),
      el("div", { class: "lt-actions" },
        el("a", { class: "btn primary", href: "#mavzular" }, "Mavzular"),
        el("a", { class: "btn", href: EX.base + "mualliflar/" }, "Mualliflar")));
    var vp = el("section", { class: "vp", "aria-label": "Kitob" }, screen, lt);
    topbar.after(vp);
    viewport(screen);

    var wrap = el("main", { class: "wrap wide hub" });
    vp.after(wrap);
    wrap.appendChild(el("p", { class: "hub-sub" },
      "Öquv qöllanmaning interaktiv ilovasi: har bir mavzu uçun qisqa audio tuşuntiriş, telefonda işlaydigan laboratoriya va darsda bajariladigan topşiriq. " + (cfg.universitet ? cfg.universitet.replace("al-", "al\u2011") + "." : "")));

    // ---- rundown: 8 blok, 21 mavzu ----
    var list = el("section", { id: "mavzular", class: "rundown", "aria-label": "Mavzular" }, el("h2", null, "21 mavzu"));
    Object.keys(window.BLOCKS).forEach(function (b) {
      var B = window.BLOCKS[b];
      var rows = el("div", { class: "rd-rows" });
      var grp = el("div", { class: "blk", style: "--bc:" + B.hi },
        el("h3", { class: "blk-h" }, el("i", { "aria-hidden": "true" }), el("span", { class: "bn" }, b + "-blok"), " " + B.name), rows);
      window.TOPICS.filter(function (t) { return String(t.b) === String(b); }).forEach(function (t0) {
        var t = window.topicInfo(t0.n);
        function res(kind, dir, label, short) {
          return el("a", { href: EX.base + dir + "/" + t.nn + "/", class: "res", "aria-label": t.n + "-mavzu: " + label,
            html: EX.icons[kind] + '<span class="rl">' + label + '</span><span class="rs" aria-hidden="true">' + short + "</span>" });
        }
        rows.appendChild(el("article", { class: "trow" },
          el("div", { class: "tnum", "aria-hidden": "true" }, t.nn),
          el("div", { class: "ttl" }, el("b", null, t.title), el("span", null, "Laboratoriya: " + t.lab)),
          el("div", { class: "tres" }, res("audio", "a", "Tinglaş", "Tinglaş"), res("lab", "l", "Laboratoriya", "Lab"), res("task", "t", "Topşiriq", "Topşiriq"))));
      });
      list.appendChild(grp);
    });
    wrap.appendChild(list);

    // ---- qanday foydalaniladi: haqiqiy ketma-ketlik ----
    wrap.appendChild(el("section", { class: "hub-how" },
      el("h2", null, "Qanday foydalaniladi"),
      el("ol", { class: "steps" },
        el("li", null, el("span", { class: "sn", "aria-hidden": "true" }, "1"), el("b", null, "QR kodni skanerlang."), " Kitobdagi har bir mavzu boşida uçta kod bor: tinglaş, laboratoriya va topşiriq."),
        el("li", null, el("span", { class: "sn", "aria-hidden": "true" }, "2"), el("b", null, "Tinglang va sinab köring."), " Audio mavzuning asosiy ğoyasini bir-ikki daqiqada tuşuntiradi, laboratoriyada esa formulalarni özingiz özgartirib körasiz."),
        el("li", null, el("span", { class: "sn", "aria-hidden": "true" }, "3"), el("b", null, "Darsda topşiriqni bajaring."), " Öqituvçi bosqiçni oçganda öz ID raqamingiz va ekrandagi 4 xonali kodni kiriting. Ballar va davomat avtomatik yoziladi.")),
      el("p", { class: "muted" }, "Öqituvçilar uçun: ", el("a", { href: EX.base + "admin/" }, "öqituvçi paneli"), " — talabalar röyxati, jonli bosqiçlar, davomat va jurnal.")));

    // ---- mualliflar: portret + ism titri ----
    var au = el("section", { class: "hub-authors-sec" }, el("h2", null, "Mualliflar"));
    var row = el("div", { class: "au-row" });
    AUTHORS.forEach(function (a) {
      row.appendChild(el("a", { class: "au", href: EX.base + "mualliflar/#" + a.id },
        el("img", { src: EX.base + a.img, alt: a.name, loading: "lazy", style: a.pos ? "object-position:" + a.pos : null }),
        el("span", { class: "au-lt" }, el("b", null, a.name), el("span", null, a.role))));
    });
    au.appendChild(row);
    wrap.appendChild(au);
    wrap.appendChild(el("footer", { class: "lab-foot" }, "© 2026 " + (cfg.mualliflar || "") + ". " + (cfg.universitet || "") + "."));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main); else main();
})();
