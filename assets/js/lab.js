/* LAB — laboratoriya sahifalari uçun umumiy karkas: sarlavha, tajribalar (tablar), sahna, boşqaruv elementlari.
   Har bir labs/labNN.js fayli LAB.start({...}) ni çaqiradi. */
(function () {
  var EX = window.EX, X = window.X3D;
  var LAB = window.LAB = {};
  LAB.C = { x: "#E5484D", y: "#2F9E6B", z: "#3E63DD", ink: "#18202F", ink2: "#4A5468", ink3: "#7A8396", line: "#DCE1EA",
    violet: "#8E4EC6", teal: "#0C9488", orange: "#E8590C", pink: "#D6336C", gold: "#D9A400", green: "#2F9E44", surf: "#C9D4F5" };
  LAB.fmt = X.fmt;
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
    return null;
  }

  /* ---------- bitta tajriba (tab) konteksti ---------- */
  function Ctx(root, topic) {
    this.topic = topic;
    this.root = root;
    this.top = EX.el("div", { class: "lab-top" });
    this.main = EX.el("div", { class: "lab-main" });
    this.side = EX.el("div", { class: "lab-side controls" });
    root.appendChild(EX.el("div", { class: "lab-grid" }, this.top, this.side, this.main));
    this._stages = 0;
    this.accent = topic.color;
  }
  Ctx.prototype._stage = function (hint, aspect) {
    var st = EX.el("div", { class: "stage" });
    var cv = EX.el("canvas", { role: "img", "aria-label": hint || "Interaktiv sahna" });
    st.appendChild(cv);
    // monitor pastki ramkasi: izoh va butun ekran tugmasi
    var chin = EX.el("div", { class: "stage-bar" });
    chin.appendChild(EX.el("div", { class: "hint" }, hint || ""));
    st.appendChild(chin);
    var fs = EX.el("button", { class: "fs", type: "button", title: "Butun ekran", "aria-label": "Butun ekran",
      html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>' });
    fs.addEventListener("click", function () {
      var on = !st.classList.contains("full");
      st.classList.toggle("full", on);
      document.body.classList.toggle("noscroll", on);
      if (on && st.requestFullscreen) st.requestFullscreen().catch(function () {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(function () {});
    });
    document.addEventListener("fullscreenchange", function () {
      if (!document.fullscreenElement && st.classList.contains("full")) { st.classList.remove("full"); document.body.classList.remove("noscroll"); }
    });
    chin.appendChild(fs);
    (this._target || this.top).appendChild(st);
    this._stages++;
    this.top.classList.toggle("one", this._stages === 1);
    return { st: st, cv: cv };
  };
  // 3D sahna
  Ctx.prototype.scene = function (opts) {
    opts = opts || {};
    var s = this._stage(opts.hint === undefined ? "Sudrang — aylantiriş · ğildirakça yoki ikki barmoq — yaqinlaştiriş · Shift — siljitiş" : opts.hint);
    var S = new X.Scene(s.cv, opts);
    S.stageEl = s.st;
    if (opts.grid !== false) S.add(new X.Grid(opts.gridOpts || {}));
    if (opts.axes !== false) S.add(new X.Axes(opts.axesOpts || {}));
    if (opts.views) this.seg("Köriniş", [["persp", "Perspektiv"], ["top", "Yuqoridan"], ["front", "Old"], ["right", "Ön yon"]], "persp", function (v) { S.view(v); });
    return S;
  };
  // 2D tekislik (egri çiziqlar uçun)
  Ctx.prototype.plot = function (opts) {
    opts = opts || {};
    var s = this._stage(opts.hint === undefined ? "Nuqtalarni barmoq yoki siçqonça bilan sudrang" : opts.hint);
    var P = new X.Plot(s.cv, opts);
    P.stageEl = s.st;
    return P;
  };
  // erkin Canvas 2D: draw(ctx, w, h) har safar çaqiriladi
  Ctx.prototype.canvas = function (opts) {
    opts = opts || {};
    var s = this._stage(opts.hint || "", opts.aspect);
    var cv = s.cv, c = cv.getContext("2d"), o = { canvas: cv, ctx: c, stageEl: s.st, w: 0, h: 0, draw: null, aspect: opts.aspect || 0.62 };
    o.redraw = function () {
      if (!o.w) return;
      var dpr = o.dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, o.w, o.h);
      c.fillStyle = "#fff"; c.fillRect(0, 0, o.w, o.h);
      if (o.draw) o.draw(c, o.w, o.h);
    };
    o.resize = function () {
      var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var w = Math.max(200, r.width), h = Math.round(w * o.aspect);
      if (opts.maxH) h = Math.min(h, opts.maxH);
      cv.style.height = h + "px"; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      o.w = w; o.h = h; o.dpr = dpr; o.redraw();
    };
    new ResizeObserver(function () { o.resize(); }).observe(cv);
    return o;
  };
  // boşqaruv elementlari yon panelga (yoki this._side ga) qöşiladi
  Ctx.prototype._put = function (el, where) { (where === "main" ? this.main : (this._sideTarget || this.side)).appendChild(el); return el; };
  Ctx.prototype.heading = function (txt, where) { return this._put(EX.el("h3", { class: "lab-h" }, txt), where); };
  Ctx.prototype.text = function (html, where) { return this._put(EX.el("p", { class: "lab-p", html: html }), where); };
  Ctx.prototype.note = function (html, where, kind) { return this._put(EX.el("div", { class: "note" + (kind ? " " + kind : ""), html: html }), where); };
  Ctx.prototype.slider = function (o, cb) {
    var fmt = o.fmt || function (v) { return X.fmt(v, o.nd == null ? 2 : o.nd) + (o.unit ? " " + o.unit : ""); };
    var out = EX.el("output");
    var inp = EX.el("input", { type: "range", min: o.min, max: o.max, step: o.step || 1, value: o.value, "aria-label": o.label });
    var wrap = EX.el("div", { class: "ctl" }, EX.el("label", null, EX.el("span", null, o.label), out), inp);
    function val() { return Number(inp.value); }
    function show() { out.textContent = fmt(val()); EX.rangeFill(inp); }
    inp.addEventListener("input", function () { show(); if (cb) cb(val()); });
    show();
    this._put(wrap, o.where);
    return { el: wrap, input: inp, get: val, set: function (v, silent) { inp.value = v; show(); if (!silent && cb) cb(val()); },
      setRange: function (min, max) { inp.min = min; inp.max = max; show(); } };
  };
  Ctx.prototype.seg = function (label, items, value, cb, where) {
    var box = EX.el("div", { class: "seg", role: "group", "aria-label": label || "" }), btns = {};
    items.forEach(function (it) {
      var v = Array.isArray(it) ? it[0] : it, t = Array.isArray(it) ? it[1] : it;
      var b = EX.el("button", { type: "button", class: v === value ? "on" : "", "aria-pressed": v === value ? "true" : "false" }, t);
      b.addEventListener("click", function () { api.set(v); });
      btns[v] = b; box.appendChild(b);
    });
    var api = { el: null, value: value, set: function (v, silent) {
      api.value = v;
      Object.keys(btns).forEach(function (k) { var on = String(k) === String(v); btns[k].classList.toggle("on", on); btns[k].setAttribute("aria-pressed", on ? "true" : "false"); });
      if (!silent && cb) cb(v);
    }, buttons: btns };
    api.el = this._put(EX.el("div", { class: "ctl" }, label ? EX.el("label", null, EX.el("span", null, label)) : null, box), where);
    return api;
  };
  Ctx.prototype.toggle = function (label, value, cb, where) {
    var inp = EX.el("input", { type: "checkbox" });
    inp.checked = !!value;
    inp.addEventListener("change", function () { if (cb) cb(inp.checked); });
    this._put(EX.el("label", { class: "tog" }, inp, EX.el("span", null, label)), where);
    return { input: inp, get: function () { return inp.checked; }, set: function (v, silent) { inp.checked = !!v; if (!silent && cb) cb(inp.checked); } };
  };
  Ctx.prototype.select = function (label, items, value, cb, where) {
    var sel = EX.el("select", { "aria-label": label });
    items.forEach(function (it) {
      var v = Array.isArray(it) ? it[0] : it, t = Array.isArray(it) ? it[1] : it;
      var o = EX.el("option", { value: v }, t); if (String(v) === String(value)) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener("change", function () { if (cb) cb(sel.value); });
    this._put(EX.el("div", { class: "ctl" }, EX.el("label", null, EX.el("span", null, label)), sel), where);
    return { el: sel, get: function () { return sel.value; }, set: function (v, silent) { sel.value = v; if (!silent && cb) cb(sel.value); } };
  };
  Ctx.prototype.number = function (o, cb) {
    var inp = EX.el("input", { type: "number", inputmode: "decimal", min: o.min, max: o.max, step: o.step || "any", value: o.value, "aria-label": o.label });
    inp.addEventListener("input", function () { var v = Number(String(inp.value).replace(",", ".")); if (!isNaN(v) && cb) cb(v); });
    this._put(EX.el("div", { class: "ctl" }, EX.el("label", null, EX.el("span", null, o.label), o.unit ? EX.el("output", null, o.unit) : null), inp), o.where);
    return { el: inp, get: function () { return Number(String(inp.value).replace(",", ".")); }, set: function (v) { inp.value = v; } };
  };
  Ctx.prototype.button = function (label, cb, cls, where) {
    var b = EX.el("button", { type: "button", class: "btn " + (cls || "ghost") }, label);
    b.addEventListener("click", cb);
    return this._put(b, where);
  };
  Ctx.prototype.row = function (where) { var r = EX.el("div", { class: "btn-row" }); this._put(r, where); return r; };
  // körsatkiçlar: items = [[key, label], ...]
  Ctx.prototype.readout = function (items, where) {
    var box = EX.el("div", { class: "readout", "aria-live": "polite" }), cells = {};
    items.forEach(function (it) { var b = EX.el("b", null, "—"); cells[it[0]] = b; box.appendChild(EX.el("div", null, b, EX.el("span", null, it[1]))); });
    this._put(box, where || "main");
    return { el: box, set: function (k, v) { if (cells[k]) cells[k].textContent = v; }, setMany: function (o) { for (var k in o) if (cells[k]) cells[k].textContent = o[k]; } };
  };
  // matritsa jadvali
  Ctx.prototype.matrix = function (title, where) {
    var t = EX.el("table", { class: "matrix" }), cap = title ? EX.el("div", { class: "lab-cap" }, title) : null;
    this._put(EX.el("div", { class: "mat-box" }, cap, t), where);
    return { el: t, set: function (M, nd, hl) {
      t.innerHTML = "";
      M.forEach(function (row, i) {
        var tr = EX.el("tr");
        row.forEach(function (v, j) { tr.appendChild(EX.el("td", { class: hl && hl(i, j) ? "hl" : "" }, typeof v === "number" ? X.fmt(v, nd == null ? 2 : nd) : v)); });
        t.appendChild(tr);
      });
    } };
  };
  // «Sinab köring» röyxati (belgilar brauzerda saqlanadi)
  Ctx.prototype.tasks = function (list, key) {
    var self = this, k = "lab_tasks_" + this.topic.nn + "_" + (key || "0");
    var saved = {}; try { saved = JSON.parse(store(k) || "{}"); } catch (e) { saved = {}; }
    var ul = EX.el("ul", { class: "try" });
    list.forEach(function (txt, i) {
      var cb = EX.el("input", { type: "checkbox", "aria-label": "Bajarildi" });
      cb.checked = !!saved[i];
      cb.addEventListener("change", function () { saved[i] = cb.checked; store(k, JSON.stringify(saved)); });
      ul.appendChild(EX.el("li", null, EX.el("label", null, cb, EX.el("span", { html: txt }))));
    });
    var box = EX.el("details", { class: "try-box", open: true }, EX.el("summary", null, "Sinab köring"), ul);
    self.root.appendChild(box);
    return box;
  };
  // ixtiyoriy element qöşiş
  Ctx.prototype.add = function (el, where) { return this._put(el, where); };
  Ctx.prototype.inMain = function (fn) { var t = this._target; this._target = this.main; fn(); this._target = t; };
  Ctx.prototype.inTop = function (el) { this.top.appendChild(el); return el; };
  // boşqaruv elementlarini guruhlaş (masalan, seg bilan almaştiriladigan sahifalar)
  Ctx.prototype.group = function (fn, where) {
    var g = EX.el("div", { class: "ctl-group controls" }); this._put(g, where);
    var prev = this._sideTarget; this._sideTarget = g; try { fn(g); } finally { this._sideTarget = prev; }
    return g;
  };
  // seg + guruhlar: pages = [[id, nomi, fn], ...]
  Ctx.prototype.pages = function (label, pages, first) {
    var self = this, groups = {};
    var sg = this.seg(label, pages.map(function (p) { return [p[0], p[1]]; }), first || pages[0][0], function (v) {
      Object.keys(groups).forEach(function (k) { groups[k].hidden = String(k) !== String(v); });
    });
    pages.forEach(function (p) { groups[p[0]] = self.group(p[2]); groups[p[0]].hidden = String(p[0]) !== String(first || pages[0][0]); });
    return sg;
  };

  /* ---------- sahifa ---------- */
  LAB.start = function (cfg) {
    LAB._started = true;
    if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", function () { LAB.start(cfg); }); return; }
    var n = cfg.topic || EX.topicFromPath();
    var t = window.topicInfo(n);
    EX.topbar(n);
    var wrap = EX.el("main", { class: "wrap wide lab-page" });
    document.body.appendChild(wrap);
    wrap.appendChild(EX.hero(n, "Laboratoriya: " + (cfg.title || t.lab)));
    wrap.appendChild(EX.trio(n, "lab"));
    if (cfg.intro) wrap.appendChild(EX.el("p", { class: "lead", html: cfg.intro }));
    var tabs = cfg.tabs || [];
    var bar = EX.el("div", { class: "seg lab-tabs", role: "tablist", "aria-label": "Tajribalar" });
    var holder = EX.el("div", { class: "lab-holder" });
    var built = [], panels = [], buttons = [];
    function show(i) {
      i = Math.max(0, Math.min(tabs.length - 1, i | 0));
      buttons.forEach(function (b, j) { b.classList.toggle("on", j === i); b.setAttribute("aria-selected", j === i ? "true" : "false"); });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
      if (!built[i]) {
        built[i] = true;
        var ctx = new Ctx(panels[i], t);
        if (tabs[i].lead) panels[i].insertBefore(EX.el("p", { class: "lab-lead", html: tabs[i].lead }), panels[i].firstChild);
        try { tabs[i].build(ctx); } catch (e) { console.error(e); panels[i].appendChild(EX.el("div", { class: "note bad" }, "Tajribani yuklab bölmadi: " + e.message)); }
      }
      try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {}
    }
    tabs.forEach(function (tab, i) {
      var b = EX.el("button", { type: "button", role: "tab" }, (i + 1) + ". " + tab.name);
      b.addEventListener("click", function () { show(i); });
      buttons.push(b); bar.appendChild(b);
      var p = EX.el("section", { class: "lab-panel", role: "tabpanel", "aria-label": tab.name });
      p.hidden = true; panels.push(p); holder.appendChild(p);
    });
    if (tabs.length > 1) wrap.appendChild(bar);
    wrap.appendChild(holder);
    var am = (t.amaliy || []).length ? " Örganganlaringizni uslubiy körsatmaning " + t.amaliy.join(" va ") + "-amaliy işida qöllang." : "";
    wrap.appendChild(EX.el("footer", { class: "lab-foot" },
      EX.el("p", { html: "Bu laboratoriya kitobdagi <b>" + n + "-mavzu</b> bilan boğlangan." + am + " Bilimingizni tekşiriş uçun — <a href=\"" + EX.base + "t/" + t.nn + "/\">topşiriq sahifasi</a>." })));
    var h = Number((location.hash || "").replace("#", "")) || 1;
    show(h - 1);
    window.addEventListener("hashchange", function () { var k = Number((location.hash || "").replace("#", "")) || 1; show(k - 1); });
  };
  // tugma bosilgandan keyin (masalan «Kitob misoli») diapazonlar töldirişini yangilaş
  document.addEventListener("click", function () {
    setTimeout(function () { EX.$$("input[type=range]").forEach(EX.rangeFill); }, 0);
  });
  // laboratoriya fayli hali joylanmagan bölsa — vaqtinçalik sahifa
  document.addEventListener("DOMContentLoaded", function () {
    if (LAB._started) return;
    var n = EX.topicFromPath(), t = window.topicInfo(n);
    EX.topbar(n);
    var wrap = EX.el("main", { class: "wrap" });
    document.body.appendChild(wrap);
    wrap.appendChild(EX.hero(n, "Laboratoriya: " + t.lab));
    wrap.appendChild(EX.trio(n, "lab"));
    wrap.appendChild(EX.el("div", { class: "note warn" }, "Bu laboratoriya tayyorlanmoqda. Tez orada şu manzilda oçiladi."));
  });
})();
