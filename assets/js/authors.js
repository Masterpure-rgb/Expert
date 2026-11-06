/* Mualliflar sahifasi: maʼlumotlar data/authors.json faylidan olinadi. */
(function () {
  var EX = window.EX;
  async function main() {
    EX.topbar(null);
    var wrap = EX.el("main", { class: "wrap authors-page" });
    document.body.appendChild(wrap);
    var cfg = window.EXPERT_CONFIG || {};
    wrap.appendChild(EX.el("section", { class: "hero" },
      EX.el("h1", null, "Mualliflar"),
      EX.el("p", null, "«" + (cfg.kitob || "3D modellaştiriş texnologiyalari") + "» öquv qöllanmasi. " + (cfg.universitet || ""))));
    var data = { authors: [] };
    try { data = await EX.fetchJSON("data/authors.json"); } catch (e) { EX.toast("Maʼlumotni yuklab bölmadi", "bad"); }
    var dlg = EX.el("dialog", { "aria-label": "Surat" }), big = EX.el("img", { alt: "" });
    dlg.appendChild(big); dlg.addEventListener("click", function () { dlg.close(); }); wrap.appendChild(dlg);
    data.authors.forEach(function (a) {
      var img = EX.el("img", { src: EX.base + a.img, alt: a.full || a.name, style: a.pos ? "object-position:" + a.pos : null });
      img.addEventListener("click", function () { big.src = EX.base + (a.full_img || a.img); big.alt = a.full || a.name; if (dlg.showModal) dlg.showModal(); });
      wrap.appendChild(EX.el("article", { class: "acard", id: a.id }, img,
        EX.el("div", null,
          EX.el("h2", null, a.full || a.name),
          EX.el("p", { class: "role" }, a.role || ""),
          (a.bio || []).map(function (p) { return EX.el("p", null, p); }))));
    });
    wrap.appendChild(EX.el("p", null, EX.el("a", { href: EX.base }, "← Bosh sahifa")));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main); else main();
})();
