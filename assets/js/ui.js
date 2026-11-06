/* Sahifa qismlari: yuqori qator, mavzu resurslari (QR-1/2/3), ikonlar. */
(function () {
  var EX = window.EX;
  EX.icons = {
    axes: '<svg class="axes" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 24 L8 6" stroke="#3E63DD" stroke-width="3" stroke-linecap="round"/><path d="M8 24 L27 24" stroke="#E5484D" stroke-width="3" stroke-linecap="round"/><path d="M8 24 L19 15" stroke="#2F9E6B" stroke-width="3" stroke-linecap="round"/><circle cx="8" cy="24" r="3" fill="#18202F"/></svg>',
    audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2.5" y="14" width="5" height="7" rx="1.5"/><rect x="16.5" y="14" width="5" height="7" rx="1.5"/></svg>',
    lab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>',
    task: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
  };
  EX.topbar = function (topic) {
    var t = topic ? window.topicInfo(topic) : null;
    var bar = EX.el("header", { class: "topbar" },
      EX.el("a", { class: "brand", href: EX.base, html: EX.icons.axes + "<span>3D modellaştiriş</span>" }),
      EX.el("span", { class: "spacer" }),
      t ? EX.el("span", { class: "chip" }, t.n + "-mavzu") : null
    );
    document.body.prepend(bar);
  };
  EX.trio = function (topic, active) {
    var nn = window.topicInfo(topic).nn;
    function a(kind, href, label) {
      return EX.el("a", { href: EX.base + href + "/" + nn + "/", class: active === kind ? "on" : "", html: EX.icons[kind] + "<span>" + label + "</span>" });
    }
    return EX.el("nav", { class: "trio", "aria-label": "Mavzu resurslari" },
      a("audio", "a", "Tinglaş"), a("lab", "l", "Laboratoriya"), a("task", "t", "Topşiriq"));
  };
  EX.hero = function (topic, subtitle) {
    var t = EX.applyTheme(topic);
    document.title = t.n + "-mavzu. " + t.short + " — " + subtitle;
    return EX.el("section", { class: "hero" },
      EX.el("div", { class: "num", "aria-hidden": "true" }, String(t.n).padStart(2, "0")),
      EX.el("h1", null, t.title),
      EX.el("p", null, subtitle),
      EX.el("p", { class: "muted" }, t.b + "-blok: " + t.blockName));
  };
})();
