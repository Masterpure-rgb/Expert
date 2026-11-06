/* Öqituvçi paneli: talabalar, jonli dars, davomat, jurnal, savollar banki, sozlamalar. */
(function () {
  var EX = window.EX, el = EX.el;
  var S = { token: null, students: [], lessons: [], settings: {}, page: "home", live: null, poll: null };
  var main, nav;

  function tok() { try { return localStorage.getItem("ex_admin_token_" + (EX.apiUrl() || "demo")); } catch (e) { return null; } }
  function setTok(v) { try { if (v) localStorage.setItem("ex_admin_token_" + (EX.apiUrl() || "demo"), v); else localStorage.removeItem("ex_admin_token_" + (EX.apiUrl() || "demo")); } catch (e) {} }
  async function call(action, payload) {
    payload = payload || {}; payload.token = S.token;
    var r = await EX.api(action, payload);
    if (!r.ok && r.code === "AUTH") { setTok(null); S.token = null; showLogin("Sessiya muddati tugadi, qayta kiring."); }
    return r;
  }
  function groups() {
    var g = {}; S.students.forEach(function (s) { g[s.guruh] = 1; });
    return Object.keys(g).sort();
  }
  function topicOptions(sel) {
    return window.TOPICS.map(function (t) { return el("option", { value: t.n, selected: Number(sel) === t.n }, "M" + t.n + ". " + t.short); });
  }
  function today() { return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10); }
  function nowHM() { return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(11, 16); }
  function csvDownload(name, rows) {
    var txt = "﻿" + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? "" : c); return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(";"); }).join("\r\n");
    var a = el("a", { href: URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ================= kiriş ================= */
  async function boot() {
    document.title = "Öqituvçi paneli — 3D modellaştiriş";
    S.token = tok();
    if (S.token) {
      var r = await EX.api("a_students", { token: S.token });
      if (r.ok) { S.students = r.talabalar; return shell(); }
      setTok(null); S.token = null;
    }
    showLogin();
  }
  async function showLogin(msg) {
    document.body.innerHTML = "";
    EX.topbar();
    var w = el("main", { class: "wrap" });
    document.body.appendChild(w);
    var ping = await EX.api("ping", {});
    var apiIn = el("input", { value: EX.apiUrl(), placeholder: "https://script.google.com/macros/s/…/exec" });
    var pass = el("input", { type: "password", autocomplete: "current-password", placeholder: "Parol" });
    var first = ping.ok && !ping.sozlangan;
    var btn = el("button", { class: "btn primary block", type: "submit" }, first ? "Parolni örnatiş va kiriş" : "Kiriş");
    w.appendChild(el("section", { class: "hero" }, el("h1", null, "Öqituvçi paneli"),
      el("p", null, "Talabalar, davomat, jonli topşiriqlar va ballar jurnali.")));
    w.appendChild(el("form", { class: "panel", onsubmit: async function (e) {
        e.preventDefault();
        var url = apiIn.value.trim();
        try { if (url) localStorage.setItem("ex_api", url); else localStorage.removeItem("ex_api"); } catch (x) {}
        btn.disabled = true;
        var r = await EX.api(first ? "a_setup" : "a_login", { parol: pass.value });
        btn.disabled = false;
        if (!r.ok) return showLogin(r.error);
        S.token = r.token; setTok(r.token); S.settings = r.sozlamalar || {};
        var st = await call("a_students");
        S.students = st.talabalar || [];
        shell();
      } },
      el("label", { class: "f" }, "Server (Google Apps Script) manzili"), apiIn,
      el("p", { class: "muted" }, ping.ok ? (EX.isDemo() ? "Demo rejim: maʼlumotlar faqat şu brauzerda saqlanadi." : "Server bilan aloqa bor ✓ (versiya " + ping.version + ")") : "Serverga ulanib bölmadi: " + (ping.error || "")),
      el("label", { class: "f" }, first ? "Yangi parol (kamida 6 belgi)" : "Parol"), pass,
      el("div", { style: "height:12px" }), btn,
      msg ? el("p", { class: "note bad", style: "margin-top:12px" }, msg) : null));
    w.appendChild(el("p", { class: "muted" }, "Server hali ulanmagan bölsa, manzil maydonini böş qoldirib demo rejimda sinab köring. Ulaş tartibi: ",
      el("a", { href: "https://github.com/Masterpure-rgb/Expert/blob/main/platform/README.md", target: "_blank" }, "platform/README.md")));
  }

  /* ================= qobiq ================= */
  var PAGES = [
    ["home", "Bosh sahifa"], ["live", "Jonli dars"], ["students", "Talabalar"], ["attendance", "Davomat"],
    ["gradebook", "Jurnal"], ["bank", "Savollar banki"], ["settings", "Sozlamalar"]
  ];
  function shell() {
    document.body.innerHTML = "";
    var app = el("div", { class: "admin" });
    nav = el("nav", null, el("a", { class: "brand", href: EX.base, html: EX.icons.axes + "<span>3D modellaştiriş</span>", style: "padding:6px 10px 14px" }));
    PAGES.forEach(function (p) { nav.appendChild(el("a", { href: "#" + p[0], "data-p": p[0], onclick: function (e) { e.preventDefault(); go(p[0]); } }, p[1])); });
    nav.appendChild(el("a", { href: "#", onclick: function (e) { e.preventDefault(); setTok(null); S.token = null; showLogin(); } }, "Çiqiş"));
    main = el("main");
    app.appendChild(nav); app.appendChild(main);
    document.body.appendChild(app);
    go((location.hash || "#home").slice(1));
  }
  function go(p) {
    if (!PAGES.some(function (x) { return x[0] === p; })) p = "home";
    S.page = p; history.replaceState(null, "", "#" + p);
    EX.$$("nav a", document).forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-p") === p); });
    clearInterval(S.poll); S.poll = null;
    main.innerHTML = "";
    ({ home: pageHome, live: pageLive, students: pageStudents, attendance: pageAttendance, gradebook: pageGradebook, bank: pageBank, settings: pageSettings })[p]();
  }

  /* ================= bosh sahifa ================= */
  async function pageHome() {
    main.appendChild(el("h1", null, "Bosh sahifa"));
    if (EX.isDemo()) main.appendChild(el("p", { class: "note warn" }, "Demo rejim: maʼlumotlar şu brauzerda saqlanadi. Haqiqiy dars uçun Sozlamalar böliminda server manzilini kiriting."));
    var [st, ls, bk] = await Promise.all([call("a_students"), call("a_lessons"), call("a_bank")]);
    S.students = st.talabalar || []; S.lessons = ls.darslar || [];
    var bank = bk.savollar || [];
    main.appendChild(el("div", { class: "kpis" },
      kpi(S.students.length, "talaba"), kpi(groups().length, "guruh"), kpi(S.lessons.length, "dars"), kpi(bank.length, "savol bankda")));
    if (!bank.length) main.appendChild(el("p", { class: "note" }, "Savollar banki böş. «Savollar banki» bölimida bank faylini yuklang."));
    if (!S.students.length) main.appendChild(el("p", { class: "note" }, "Talabalar röyxati böş. «Talabalar» bölimida fayldan yoki qölda qöşing."));
    var recent = S.lessons.slice(-8).reverse();
    if (recent.length) {
      main.appendChild(el("h2", null, "Sönggi darslar"));
      main.appendChild(table(["Sana", "Guruh", "Mavzu", "Holat", ""], recent.map(function (d) {
        return [d.sana + " " + d.boshlanish, d.guruh, "M" + d.mavzu + ". " + window.topicInfo(d.mavzu).short,
          el("span", { class: "badge " + (d.holat === "faol" ? "ok" : "") }, d.holat),
          el("button", { class: "btn small", onclick: function () { S.live = d.id; go("live"); } }, "Oçiş")];
      })));
    }
  }
  function kpi(v, l) { return el("div", { class: "kpi" }, el("b", null, String(v)), el("span", null, l)); }
  function table(head, rows, opts) {
    var t = el("table", { class: "t" }, el("thead", null, el("tr", null, head.map(function (h) { return el("th", null, h); }))));
    var tb = el("tbody");
    rows.forEach(function (r) { tb.appendChild(el("tr", null, r.map(function (c) { return el("td", null, c); }))); });
    t.appendChild(tb);
    return el("div", { class: "tbl-wrap" }, t);
  }

  /* ================= jonli dars ================= */
  async function pageLive() {
    main.appendChild(el("h1", null, "Jonli dars"));
    var ls = await call("a_lessons"); S.lessons = ls.darslar || [];
    var st = await call("a_students"); S.students = st.talabalar || [];
    var active = S.lessons.filter(function (d) { return d.holat === "faol"; });
    var cur = S.lessons.filter(function (d) { return d.id === S.live; })[0] || active[active.length - 1];
    // yangi dars
    var gSel = el("select", null, groups().map(function (g) { return el("option", { value: g }, g); }));
    var tSel = el("select", null, topicOptions(1));
    var dIn = el("input", { type: "date", value: today() });
    var hIn = el("input", { type: "time", value: nowHM() });
    main.appendChild(el("div", { class: "panel" },
      el("h2", null, "Yangi dars boşlaş"),
      el("div", { class: "row" },
        el("div", { class: "grow" }, el("label", { class: "f" }, "Guruh"), gSel),
        el("div", { class: "grow" }, el("label", { class: "f" }, "Mavzu"), tSel)),
      el("div", { class: "row" },
        el("div", { class: "grow" }, el("label", { class: "f" }, "Sana"), dIn),
        el("div", { class: "grow" }, el("label", { class: "f" }, "Boşlaniş vaqti"), hIn)),
      el("div", { style: "height:10px" }),
      el("button", { class: "btn primary", onclick: async function () {
        if (!gSel.value) return EX.toast("Avval talabalarni qöşing", "bad");
        var r = await call("a_lesson_create", { guruh: gSel.value, mavzu: Number(tSel.value), sana: dIn.value, boshlanish: hIn.value });
        if (!r.ok) return EX.toast(r.error, "bad");
        S.live = r.dars.id; go("live");
      } }, "Darsni yaratiş")));
    if (cur) renderLive(cur);
    if (active.length > 1) {
      main.appendChild(el("p", { class: "muted" }, "Boşqa faol darslar: ", active.filter(function (d) { return d !== cur; }).map(function (d) {
        return el("button", { class: "btn small", style: "margin:2px", onclick: function () { S.live = d.id; go("live"); } }, d.guruh + " · M" + d.mavzu);
      })));
    }
  }

  function renderLive(d) {
    var t = window.topicInfo(d.mavzu);
    document.documentElement.style.setProperty("--accent", t.color);
    document.documentElement.style.setProperty("--accent-soft", t.soft);
    var box = el("div", { class: "panel" });
    main.appendChild(box);
    var codeEl = el("div", { class: "live-code" }, d.kod || "—");
    var stageInfo = el("p", { class: "muted" });
    var counts = el("div", { class: "kpis" });
    var statsBox = el("div");
    var pickIn = el("input", { type: "number", min: 1, max: 12, value: 5, style: "width:90px" });
    var minIn = el("input", { type: "number", min: 0, max: 60, value: 0, style: "width:90px" });
    var reveal = el("input", { type: "checkbox", style: "width:auto;min-height:0" });
    var url = EX.base + "t/" + t.nn + "/";
    var stageBtns = el("div", { class: "seg" });
    [["A", "A. Tezkor test", 5], ["B", "B. Nazariy savol", 1], ["C", "C. Amaliy masala", 2]].forEach(function (s) {
      stageBtns.appendChild(el("button", { onclick: async function () {
        pickIn.value = pickIn.dataset.touched ? pickIn.value : s[2];
        var r = await call("a_stage_open", { darsId: d.id, bosqich: s[0], soni: Number(pickIn.value), daqiqa: Number(minIn.value) || 0 });
        if (!r.ok) return EX.toast(r.error, "bad");
        EX.toast(s[1] + " boşlandi. Kod: " + r.kod, "ok");
        refresh();
      } }, s[1] + " — boşlaş"));
    });
    pickIn.addEventListener("input", function () { pickIn.dataset.touched = "1"; });
    box.appendChild(el("div", { class: "row" },
      el("div", { class: "grow" },
        el("h2", null, d.guruh + " guruhi · M" + d.mavzu + ". " + t.title),
        el("p", { class: "muted" }, d.sana + ", " + d.boshlanish + " · talabalar QR-3 orqali kiradi: ", el("a", { href: url, target: "_blank" }, url))),
      el("img", { src: EX.base + "qr/t" + t.nn + ".png", alt: "Topşiriq QR kodi", style: "width:120px;height:120px" })));
    box.appendChild(el("div", { class: "row", style: "margin:8px 0" },
      el("label", { class: "muted" }, "Savollar soni ", pickIn), el("label", { class: "muted" }, "Vaqt (daqiqa, 0 — çeklovsiz) ", minIn)));
    box.appendChild(stageBtns);
    box.appendChild(el("div", { class: "row", style: "margin-top:12px;align-items:flex-end" },
      el("div", { class: "grow" }, el("div", { class: "muted" }, "Sessiya kodi"), codeEl, stageInfo),
      el("div", { class: "row" },
        el("button", { class: "btn", onclick: projector }, "Projektor rejimi"),
        el("button", { class: "btn", onclick: async function () { await call("a_stage_close", { darsId: d.id }); EX.toast("Bosqiç yopildi", "ok"); refresh(); } }, "Bosqiçni yopiş"),
        el("button", { class: "btn danger", onclick: async function () {
          if (!confirm("Darsni yakunlaysizmi?")) return;
          await call("a_lesson_finish", { darsId: d.id }); S.live = null; go("live");
        } }, "Darsni yakunlaş"))));
    box.appendChild(counts);
    box.appendChild(el("label", { class: "muted" }, reveal, " Javoblar taqsimotini körsatiş (muhokama uçun — Peer Instruction)"));
    box.appendChild(statsBox);
    var respBox = el("div", { class: "panel" });
    main.appendChild(respBox);

    async function refresh() {
      var r = await call("a_live", { darsId: d.id });
      if (!r.ok) return;
      d = r.dars;
      codeEl.textContent = d.bosqich ? d.kod : "—";
      stageInfo.textContent = d.bosqich ? ("Faol bosqiç: " + d.bosqich + (d.tugash ? " · tugaşiga " + Math.max(0, Math.round((Number(d.tugash) - r.serverVaqt) / 1000)) + " s" : "")) : "Hozir faol bosqiç yöq";
      counts.innerHTML = "";
      counts.appendChild(kpi(r.kirgan + " / " + r.guruhSoni, "kirgan talabalar"));
      counts.appendChild(kpi(r.javobBergan, "javob (şu bosqiç)"));
      counts.appendChild(kpi(r.shubhali.length, "şubhali qurilma"));
      statsBox.innerHTML = "";
      r.statistika.forEach(function (q, i) {
        var card = el("div", { class: "q" }, el("div", { class: "qh" }, el("span", { class: "qn" }, (i + 1) + "."), el("span", { class: "qt" }, q.savol)),
          el("p", { class: "muted" }, q.soni + " ta javob · töğri: " + q.foiz + "%"));
        if (reveal.checked && (q.tur === "single" || q.tur === "multi")) {
          var mx = Math.max.apply(null, q.sanoq.concat([1]));
          var right = [].concat(q.javob).map(Number);
          card.appendChild(el("div", { class: "hist" }, q.variantlar.map(function (v, k) {
            return el("div", { class: "hb" + (right.indexOf(k) >= 0 ? " right" : "") },
              el("b", null, "ABCDEF"[k]), el("i", { style: "width:" + Math.round(100 * q.sanoq[k] / mx) + "%" }), el("span", null, String(q.sanoq[k])));
          })));
          card.appendChild(el("ol", { type: "A", class: "muted", style: "font-size:13px" }, q.variantlar.map(function (v) { return el("li", null, v); })));
        }
        statsBox.appendChild(card);
      });
      if (r.shubhali.length) statsBox.appendChild(el("p", { class: "note warn" }, "Bitta qurilmadan bir neçta ID bilan javob berilgan: " + r.shubhali.map(function (g) { return g.join(", "); }).join(" | ")));
      renderResponses();
    }
    async function renderResponses() {
      var r = await call("a_responses", { darsId: d.id });
      if (!r.ok) return;
      var byId = {}; S.students.forEach(function (s) { byId[s.id] = s; });
      respBox.innerHTML = "";
      respBox.appendChild(el("h2", null, "Javoblar (" + r.javoblar.length + ")"));
      var bankR = await call("a_bank", { mavzu: d.mavzu });
      var qmap = {}; (bankR.savollar || []).forEach(function (q) { qmap[q.id] = q; });
      respBox.appendChild(table(["Talaba", "Bosqiç", "Ball", "Holat", "Ochiq javoblar"], r.javoblar.map(function (x) {
        var ans = JSON.parse(x.javoblar || "{}"), marks = JSON.parse(x.baholar || "{}");
        var opens = Object.keys(ans).filter(function (k) { return qmap[k] && qmap[k].tur === "open"; });
        var cell = el("div");
        opens.forEach(function (k) {
          var q = qmap[k];
          var sel = el("select", { style: "width:auto;min-height:32px;padding:4px" }, [0, 0.5, 1, 1.5, 2].filter(function (v) { return v <= (S.settings.birBall === false ? q.ball : 1) || v === 0; }).map(function (v) {
            return el("option", { value: v, selected: Number(marks[k]) === v }, EX.fmt(v));
          }));
          sel.addEventListener("change", async function () { var g = await call("a_grade", { id: x.id, savolId: k, ball: Number(sel.value) }); if (g.ok) EX.toast("Baho saqlandi", "ok"); });
          cell.appendChild(el("div", { style: "margin:4px 0" }, el("div", { class: "muted", style: "font-size:12px" }, q.savol), el("div", null, String(ans[k] || "—")), el("label", { class: "muted" }, "Ball: ", sel)));
        });
        var s = byId[x.talabaId] || { fio: x.talabaId };
        return [s.fio, x.bosqich, EX.fmt(x.ball) + " / " + EX.fmt(x.max),
          el("span", { class: "badge " + (x.tekshirilgan === "1" ? "ok" : "warn") }, x.tekshirilgan === "1" ? "tekşirilgan" : "tekşirilmagan"), cell];
      })));
    }
    function projector() {
      var ov = el("div", { class: "projector" });
      var c = el("div", null,
        el("div", { class: "muted", style: "font-size:2.2vw" }, "M" + d.mavzu + ". " + t.short),
        el("div", { class: "live-code", id: "pcode" }, codeEl.textContent),
        el("div", { style: "font-size:2vw;margin-top:2vh" }, "1) QR-kodni skanerlang  2) ID va kodni kiriting"),
        el("div", { id: "pcount", style: "font-size:3vw;margin-top:3vh;font-weight:800" }, ""),
        el("button", { class: "btn", style: "margin-top:4vh", onclick: function () { ov.remove(); } }, "Yopiş"));
      ov.appendChild(c);
      ov.appendChild(el("img", { src: EX.base + "qr/t" + t.nn + ".png", alt: "QR" }));
      document.body.appendChild(ov);
      if (ov.requestFullscreen) ov.requestFullscreen().catch(function () {});
      var iv = setInterval(function () {
        if (!document.body.contains(ov)) return clearInterval(iv);
        document.getElementById("pcode").textContent = codeEl.textContent;
        var k = counts.querySelectorAll(".kpi b");
        document.getElementById("pcount").textContent = k.length ? ("Javob berganlar: " + k[1].textContent) : "";
      }, 1000);
    }
    reveal.addEventListener("change", refresh);
    refresh();
    S.poll = setInterval(refresh, EX.isDemo() ? 3000 : 5000);
  }

  /* ================= talabalar ================= */
  async function pageStudents() {
    main.appendChild(el("h1", null, "Talabalar"));
    var r = await call("a_students"); S.students = r.talabalar || [];
    var gf = el("select", { style: "width:auto" }, [el("option", { value: "" }, "Barça guruhlar")].concat(groups().map(function (g) { return el("option", { value: g }, g); })));
    var q = el("input", { placeholder: "Qidiruv: F.I.Ş. yoki ID", style: "max-width:320px" });
    var listBox = el("div");
    function draw() {
      var rows = S.students.filter(function (s) { return (!gf.value || s.guruh === gf.value) && (!q.value || (s.fio + " " + s.id).toLowerCase().indexOf(q.value.toLowerCase()) >= 0); });
      listBox.innerHTML = "";
      listBox.appendChild(el("p", { class: "muted" }, rows.length + " ta talaba"));
      listBox.appendChild(table(["ID", "F.I.Ş.", "Guruh", "HEMIS ID", ""], rows.map(function (s) {
        return [el("b", null, s.id), s.fio, s.guruh, s.hemis || "—",
          el("button", { class: "btn small danger", onclick: async function () {
            if (!confirm(s.fio + " öçirilsinmi?")) return;
            await call("a_students_delete", { ids: [s.id] }); S.students = S.students.filter(function (x) { return x.id !== s.id; }); draw();
          } }, "Öçiriş")];
      })));
    }
    gf.addEventListener("change", draw); q.addEventListener("input", draw);
    // qölda qöşiş
    var fio = el("input", { placeholder: "Familiya Ism Otasining ismi" }), gr = el("input", { placeholder: "masalan TT-21" }), he = el("input", { placeholder: "ixtiyoriy" });
    main.appendChild(el("div", { class: "panel" }, el("h2", null, "Qölda qöşiş"),
      el("div", { class: "row" }, el("div", { class: "grow" }, el("label", { class: "f" }, "F.I.Ş."), fio), el("div", null, el("label", { class: "f" }, "Guruh"), gr), el("div", null, el("label", { class: "f" }, "HEMIS ID"), he)),
      el("div", { style: "height:10px" }),
      el("button", { class: "btn primary", onclick: async function () {
        var res = await call("a_students_add", { rows: [{ fio: fio.value, guruh: gr.value, hemis: he.value }] });
        if (!res.ok) return EX.toast(res.error, "bad");
        if (!res.qoshildi.length) return EX.toast("Qöşilmadi (böş maydon yoki takror)", "bad");
        S.students = S.students.concat(res.qoshildi); fio.value = ""; he.value = ""; draw();
        EX.toast("Qöşildi: ID " + res.qoshildi[0].id, "ok");
      } }, "Qöşiş")));
    // fayldan import
    var file = el("input", { type: "file", accept: ".xlsx,.csv,.txt" });
    var paste = el("textarea", { placeholder: "Yoki Excelʼdan nusxa olib şu yerga qöying (ustunlar: F.I.Ş. | Guruh | HEMIS ID)" });
    var defGroup = el("input", { placeholder: "Guruh ustuni bölmasa, şu guruh yoziladi" });
    var preview = el("div");
    var parsed = [];
    async function parse() {
      var rows = [];
      if (file.files[0]) {
        var f = file.files[0];
        if (/\.xlsx$/i.test(f.name)) rows = await window.readXlsx(await f.arrayBuffer());
        else rows = window.parseDelimited(await f.text());
      } else if (paste.value.trim()) rows = window.parseDelimited(paste.value);
      if (!rows.length) { preview.innerHTML = ""; return; }
      var head = rows[0].map(function (c) { return String(c).toLowerCase(); });
      var hasHead = head.some(function (c) { return /fio|f\.i|famil|ism|name|guruh|group|hemis/.test(c); });
      var iF = 0, iG = 1, iH = 2;
      if (hasHead) {
        head.forEach(function (c, i) {
          if (/fio|f\.i|famil|ism|name/.test(c)) iF = i; else if (/guruh|group/.test(c)) iG = i; else if (/hemis|id/.test(c)) iH = i;
        });
        rows = rows.slice(1);
      }
      parsed = rows.map(function (r) { return { fio: (r[iF] || "").trim(), guruh: (r[iG] || defGroup.value || "").trim(), hemis: (r[iH] || "").trim() }; })
        .filter(function (r) { return r.fio; });
      preview.innerHTML = "";
      preview.appendChild(el("p", { class: "muted" }, parsed.length + " ta qator topildi. Tekşirib, «Import qiliş»ni bosing."));
      preview.appendChild(table(["F.I.Ş.", "Guruh", "HEMIS"], parsed.slice(0, 8).map(function (r) { return [r.fio, r.guruh || el("span", { class: "badge bad" }, "guruh yöq"), r.hemis]; })));
    }
    file.addEventListener("change", parse); paste.addEventListener("input", parse); defGroup.addEventListener("input", parse);
    main.appendChild(el("div", { class: "panel" }, el("h2", null, "Fayldan umumiy kiritiş (Excel, CSV)"),
      el("p", { class: "muted" }, "Birinçi qatorda sarlavha bölişi mumkin: «F.I.Ş.», «Guruh», «HEMIS ID». Har bir talabaga tizim avtomatik 6 xonali ID beradi."),
      file, el("div", { style: "height:8px" }), paste, el("label", { class: "f" }, "Standart guruh"), defGroup, preview,
      el("div", { style: "height:10px" }),
      el("button", { class: "btn primary", onclick: async function () {
        if (!parsed.length) return EX.toast("Avval fayl tanlang yoki maʼlumot qöying", "bad");
        if (parsed.some(function (r) { return !r.guruh; })) return EX.toast("Ayrim qatorlarda guruh yöq", "bad");
        var res = await call("a_students_add", { rows: parsed });
        if (!res.ok) return EX.toast(res.error, "bad");
        S.students = S.students.concat(res.qoshildi); parsed = []; preview.innerHTML = ""; paste.value = ""; file.value = "";
        EX.toast(res.qoshildi.length + " ta qöşildi, " + res.otkazib + " ta takror ötkazib yuborildi", "ok"); draw();
      } }, "Import qiliş")));
    main.appendChild(el("div", { class: "row", style: "margin:14px 0" }, gf, q,
      el("button", { class: "btn", onclick: function () {
        csvDownload("talabalar.csv", [["ID", "F.I.Ş.", "Guruh", "HEMIS ID"]].concat(S.students.map(function (s) { return [s.id, s.fio, s.guruh, s.hemis]; })));
      } }, "CSV eksport"),
      el("button", { class: "btn", onclick: function () { printCards(gf.value); } }, "ID kartoçkalarni çop etiş")));
    main.appendChild(listBox);
    draw();
  }
  function printCards(g) {
    var rows = S.students.filter(function (s) { return !g || s.guruh === g; });
    var w = window.open("", "_blank");
    w.document.write("<meta charset='utf-8'><title>ID kartoçkalar</title><style>body{font-family:Inter,Arial,sans-serif}div{display:inline-block;width:31%;margin:0.6%;border:1px dashed #999;padding:10px;box-sizing:border-box;page-break-inside:avoid}b{font-size:26px;letter-spacing:.1em}small{color:#555}</style>" +
      rows.map(function (s) { return "<div><small>3D modellaştiriş · " + EX.esc(s.guruh) + "</small><br>" + EX.esc(s.fio) + "<br><b>" + s.id + "</b></div>"; }).join("") + "<script>print()<\/script>");
    w.document.close();
  }

  /* ================= davomat ================= */
  async function pageAttendance() {
    main.appendChild(el("h1", null, "Davomat"));
    var r = await call("a_students"); S.students = r.talabalar || [];
    var ls = await call("a_lessons"); S.lessons = ls.darslar || [];
    var gSel = el("select", { style: "width:auto" }, groups().map(function (g) { return el("option", { value: g }, g); }));
    var dIn = el("input", { type: "date", value: today(), style: "width:auto" });
    var box = el("div");
    main.appendChild(el("div", { class: "row" }, gSel, dIn, el("button", { class: "btn", onclick: load }, "Yuklaş")));
    main.appendChild(box);
    async function load() {
      box.innerHTML = "";
      var g = gSel.value; if (!g) return box.appendChild(el("p", { class: "note" }, "Avval talabalar qöşing."));
      var lesson = S.lessons.filter(function (d) { return d.guruh === g && d.sana === dIn.value; }).pop();
      var a = await call("a_attendance", { guruh: g, sana: dIn.value });
      var rec = {}; (a.davomat || []).forEach(function (x) { rec[x.talabaId] = x; });
      var studs = S.students.filter(function (s) { return s.guruh === g && s.faol !== "0"; }).sort(function (x, y) { return x.fio.localeCompare(y.fio); });
      var state = {};
      studs.forEach(function (s) { var x = rec[s.id]; state[s.id] = x ? { holat: x.holat, kechikish: Number(x.kechikish || 0), izoh: x.izoh || "", manba: x.manba } : { holat: "", kechikish: 0, izoh: "" }; });
      box.appendChild(el("p", { class: "muted" }, lesson ? ("Dars: M" + lesson.mavzu + ", boşlaniş " + lesson.boshlanish + ". QR orqali kirganlar avtomatik belgilangan — kerak bölsa özgartiring.") : "Bu sana uçun platformada dars yöq — davomatni qölda belgilang."));
      var tbody = [], painters = [];
      studs.forEach(function (s, i) {
        var st = state[s.id];
        var bK = el("button", { class: "keldi" }, "Keldi"), bN = el("button", { class: "kelmadi" }, "Kelmadi"), bL = el("button", { class: "kech" }, "Kech qoldi");
        var mins = el("input", { type: "number", min: 0, max: 240, value: st.kechikish || "", placeholder: "daq." });
        var note = el("input", { value: st.izoh, placeholder: "izoh", style: "width:140px;min-height:34px;padding:5px 8px" });
        function paint() {
          bK.classList.toggle("on", st.holat === "keldi"); bN.classList.toggle("on", st.holat === "kelmadi"); bL.classList.toggle("on", st.holat === "kech");
          mins.style.visibility = st.holat === "kech" ? "visible" : "hidden";
        }
        bK.onclick = function () { st.holat = "keldi"; paint(); };
        bN.onclick = function () { st.holat = "kelmadi"; paint(); };
        bL.onclick = function () { st.holat = "kech"; paint(); mins.focus(); };
        mins.oninput = function () { st.kechikish = Number(mins.value || 0); };
        note.oninput = function () { st.izoh = note.value; };
        paint(); painters.push(paint);
        tbody.push([String(i + 1), s.fio, el("span", { class: "att" }, bK, bN, bL, mins), note, st.manba ? el("span", { class: "badge" }, st.manba) : ""]);
      });
      box.appendChild(el("div", { class: "row", style: "margin:8px 0" },
        el("button", { class: "btn small", onclick: function () {
          studs.forEach(function (s) { if (!state[s.id].holat) state[s.id].holat = "keldi"; });
          painters.forEach(function (p) { p(); });
        } }, "Belgilanmaganlarni «Keldi»")));
      function renderTable() {
        box.appendChild(table(["№", "F.I.Ş.", "Holat va kechikiş (daqiqa)", "Izoh", "Manba"], tbody));
        box.appendChild(el("div", { style: "height:12px" }));
        box.appendChild(el("button", { class: "btn primary", onclick: async function () {
          var rows = studs.filter(function (s) { return state[s.id].holat; }).map(function (s) { return { talabaId: s.id, holat: state[s.id].holat, kechikish: state[s.id].kechikish, izoh: state[s.id].izoh }; });
          var res = await call("a_attendance_set", { guruh: g, sana: dIn.value, darsId: lesson ? lesson.id : "", rows: rows });
          if (res.ok) EX.toast("Davomat saqlandi (" + rows.length + " ta)", "ok"); else EX.toast(res.error, "bad");
        } }, "Saqlaş"));
      }
      renderTable();
    }
    if (gSel.value) load();
  }

  /* ================= jurnal ================= */
  async function pageGradebook() {
    main.appendChild(el("h1", null, "Jurnal: ballar va davomat"));
    var r = await call("a_students"); S.students = r.talabalar || [];
    var gSel = el("select", { style: "width:auto" }, groups().map(function (g) { return el("option", { value: g }, g); }));
    var box = el("div");
    main.appendChild(el("div", { class: "row" }, gSel, el("button", { class: "btn", onclick: load }, "Yangilaş"), el("button", { class: "btn", onclick: function () { exp(); } }, "Excel (CSV) eksport")));
    main.appendChild(box);
    var last = [];
    async function load() {
      box.innerHTML = "";
      var res = await call("a_gradebook", { guruh: gSel.value });
      last = res.jurnal || [];
      var used = {}; last.forEach(function (s) { Object.keys(s.mavzular).forEach(function (k) { used[k] = 1; }); });
      var cols = Object.keys(used).map(Number).sort(function (a, b) { return a - b; });
      var head = ["F.I.Ş.", "ID"].concat(cols.map(function (c) { return "M" + c; })).concat(["Jami", "Keldi", "Kech", "Kelmadi", "Kech (daq.)"]);
      box.appendChild(table(head, last.sort(function (a, b) { return b.jami - a.jami; }).map(function (s) {
        return [s.fio, s.id].concat(cols.map(function (c) { return EX.fmt(s.mavzular[c] || 0); }))
          .concat([el("b", null, EX.fmt(s.jami)), String(s.keldi), String(s.kech), String(s.kelmadi), String(s.kechDaqiqa)]);
      })));
      exp.cols = cols;
    }
    function exp() {
      var cols = exp.cols || [];
      csvDownload("jurnal_" + gSel.value + ".csv", [["F.I.Ş.", "ID", "Guruh"].concat(cols.map(function (c) { return "M" + c; })).concat(["Jami ball", "Keldi", "Kech qoldi", "Kelmadi", "Kechikiş (daq.)"])]
        .concat(last.map(function (s) { return [s.fio, s.id, s.guruh].concat(cols.map(function (c) { return String(s.mavzular[c] || 0).replace(".", ","); })).concat([String(s.jami).replace(".", ","), s.keldi, s.kech, s.kelmadi, s.kechDaqiqa]); })));
    }
    if (gSel.value) load();
  }

  /* ================= savollar banki ================= */
  function convertBank(json) {
    // kitob bankining (bank21/MM.json) formatidan server formatiga ötkaziş
    var list = [];
    var topics = Array.isArray(json) ? json : (json.topics || [json]);
    topics.forEach(function (tp) {
      (tp.stages || []).forEach(function (st) {
        (st.items || []).forEach(function (it) {
          var row = { id: it.id, mavzu: tp.topic, bosqich: st.id, tur: it.type, savol: it.q, ball: it.points || 1, izoh: it.explain || "" };
          if (it.type === "single" || it.type === "multi") { row.variantlar = it.options; row.javob = it.answer; }
          else if (it.type === "numeric") { row.javob = it.answer; row.tolerans = it.tolerance || 0; }
          else if (it.type === "order") { row.variantlar = it.items; row.javob = it.answer; }
          else if (it.type === "open") { row.kalitlar = it.keywords || []; row.izoh = (it.model ? "Namuna javob: " + it.model : "") + (it.rubric ? " Mezon: " + it.rubric : ""); }
          list.push(row);
        });
      });
    });
    return list;
  }
  async function pageBank() {
    main.appendChild(el("h1", null, "Savollar banki"));
    var file = el("input", { type: "file", accept: ".json" });
    main.appendChild(el("div", { class: "panel" }, el("h2", null, "Bankni yuklaş"),
      el("p", { class: "muted" }, "Kitob bilan berilgan «savollar_banki.json» faylini tanlang. Javoblar faqat serverda saqlanadi va talabalarga körinmaydi. Takroriy yuklaş savollarni yangilaydi."),
      file, el("div", { style: "height:10px" }),
      el("button", { class: "btn primary", onclick: async function () {
        if (!file.files[0]) return EX.toast("Fayl tanlang", "bad");
        var list;
        try { list = convertBank(JSON.parse(await file.files[0].text())); } catch (e) { return EX.toast("JSON xato: " + e.message, "bad"); }
        var total = { q: 0, u: 0 };
        for (var i = 0; i < list.length; i += 60) {
          var r = await call("a_bank_upload", { savollar: list.slice(i, i + 60) });
          if (!r.ok) return EX.toast(r.error, "bad");
          total.q += r.qoshildi; total.u += r.yangilandi;
        }
        EX.toast(total.q + " ta qöşildi, " + total.u + " ta yangilandi", "ok"); go("bank");
      } }, "Yuklaş")));
    var r = await call("a_bank");
    var bank = r.savollar || [];
    var by = {};
    bank.forEach(function (q) { var k = q.mavzu; by[k] = by[k] || { A: 0, B: 0, C: 0 }; by[k][q.bosqich] = (by[k][q.bosqich] || 0) + 1; });
    main.appendChild(table(["Mavzu", "A. Test", "B. Nazariy", "C. Masala", ""], window.TOPICS.map(function (t) {
      var c = by[t.n] || { A: 0, B: 0, C: 0 };
      return ["M" + t.n + ". " + t.short, String(c.A), String(c.B), String(c.C),
        el("button", { class: "btn small", onclick: function () { showTopic(t.n); } }, "Körish")];
    })));
    var view = el("div"); main.appendChild(view);
    function showTopic(n) {
      view.innerHTML = "";
      view.appendChild(el("h2", null, "M" + n + " savollari"));
      bank.filter(function (q) { return q.mavzu === n; }).forEach(function (q) {
        var ans = q.tur === "single" ? "ABCDEF"[q.javob] : q.tur === "multi" ? (q.javob || []).map(function (k) { return "ABCDEF"[k]; }).join(", ") :
          q.tur === "numeric" ? EX.fmt(q.javob, 4) + " ± " + EX.fmt(q.tolerans, 4) : q.tur === "order" ? (q.javob || []).map(function (k) { return k + 1; }).join(" → ") : (q.kalitlar || []).join(", ");
        view.appendChild(el("div", { class: "q" }, el("div", { class: "qh" }, el("span", { class: "qn" }, q.id), el("span", { class: "qt" }, q.savol)),
          q.variantlar && q.variantlar.length ? el("ol", { type: "A" }, q.variantlar.map(function (v) { return el("li", null, v); })) : null,
          el("p", { class: "muted" }, "Bosqiç " + q.bosqich + " · tur: " + q.tur + " · javob: " + ans)));
      });
    }
  }

  /* ================= sozlamalar ================= */
  async function pageSettings() {
    main.appendChild(el("h1", null, "Sozlamalar"));
    var r = await call("a_settings", {});
    var s = r.sozlamalar || {};
    S.settings = s;
    var one = el("input", { type: "checkbox", checked: s.birBall, style: "width:auto;min-height:0" });
    var show = el("select", { style: "width:auto" }, [["yoq", "Körsatilmaydi"], ["ball", "Faqat ball"], ["toliq", "Ball va (bosqiç yopilgaç) töğri javoblar"]].map(function (o) { return el("option", { value: o[0], selected: s.natijaKorsat === o[0] }, o[1]); }));
    var late = el("input", { type: "number", value: s.kechikishChegarasi, min: 0, max: 60, style: "width:100px" });
    var code = el("input", { type: "checkbox", checked: s.kodTalab, style: "width:auto;min-height:0" });
    main.appendChild(el("div", { class: "panel" }, el("h2", null, "Baholaş va davomat"),
      el("label", { class: "f" }, one, " Har bir töğri javob = 1 ball (bankdagi ball qiymatlari örniga)"),
      el("label", { class: "f" }, "Talabaga natijani körsatiş"), show,
      el("label", { class: "f" }, "QR orqali kirganda «kech qoldi» deb hisoblaş çegarasi (daqiqa)"), late,
      el("label", { class: "f" }, code, " Sessiya kodini talab qiliş (auditoriyadan taşqarida javob berişning oldini oladi)"),
      el("div", { style: "height:12px" }),
      el("button", { class: "btn primary", onclick: async function () {
        var res = await call("a_settings", { set: { birBall: one.checked ? "1" : "0", natijaKorsat: show.value, kechikishChegarasi: late.value, kodTalab: code.checked ? "1" : "0" } });
        if (res.ok) { S.settings = res.sozlamalar; EX.toast("Saqlandi", "ok"); }
      } }, "Saqlaş")));
    var p1 = el("input", { type: "password", placeholder: "Yangi parol" });
    main.appendChild(el("div", { class: "panel" }, el("h2", null, "Parolni almaştiriş"), p1, el("div", { style: "height:10px" }),
      el("button", { class: "btn", onclick: async function () { var res = await call("a_password", { yangi: p1.value }); EX.toast(res.ok ? "Parol özgartirildi" : res.error, res.ok ? "ok" : "bad"); } }, "Özgartiriş")));
    var apiIn = el("input", { value: EX.apiUrl() });
    main.appendChild(el("div", { class: "panel" }, el("h2", null, "Server manzili"),
      el("p", { class: "muted" }, "Bu manzil faqat şu brauzerda saqlanadi. Talabalar sahifalari uçun manzilni GitHubʼdagi config.js fayliga ham yozing."),
      apiIn, el("div", { style: "height:10px" }),
      el("button", { class: "btn", onclick: async function () {
        try { if (apiIn.value.trim()) localStorage.setItem("ex_api", apiIn.value.trim()); else localStorage.removeItem("ex_api"); } catch (e) {}
        var p = await EX.api("ping", {}); EX.toast(p.ok ? "Aloqa bor ✓" : ("Xato: " + p.error), p.ok ? "ok" : "bad");
        setTok(null); S.token = null; showLogin();
      } }, "Saqlaş va tekşiriş")));
    if (EX.isDemo()) {
      main.appendChild(el("div", { class: "panel" }, el("h2", null, "Demo maʼlumotlar"),
        el("p", { class: "muted" }, "Sinov uçun namunaviy guruh va savollarni yuklaş yoki demo bazani tozalaş."),
        el("div", { class: "row" },
          el("button", { class: "btn", onclick: seedDemo }, "Namuna maʼlumotlarni yuklaş"),
          el("button", { class: "btn danger", onclick: function () { if (confirm("Demo baza tozalansinmi?")) { EX.demoReset(); setTok(null); location.reload(); } } }, "Demo bazani tozalaş"))));
    }
  }
  async function seedDemo() {
    var names = ["Abdullayev Jasur", "Karimova Madina", "Rasulov Sardor", "Tursunova Nilufar", "Xolmatov Bekzod", "Yusupova Dilnoza", "Ergashev Otabek", "Saidova Malika"];
    await call("a_students_add", { rows: names.map(function (n) { return { fio: n, guruh: "TT-DEMO" }; }) });
    var all = [];
    for (var n = 1; n <= 21; n++) {
      try {
        var d = await EX.fetchJSON("data/practice/" + (n < 10 ? "0" : "") + n + ".json");
        d.items.forEach(function (q, i) { all.push({ id: n + "P" + (i + 1), mavzu: n, bosqich: "A", tur: "single", savol: q.q, variantlar: q.options, javob: q.answer, ball: 1, izoh: q.explain || "" }); });
      } catch (e) {}
    }
    if (all.length) await call("a_bank_upload", { savollar: all });
    EX.toast("Namuna yuklandi: 8 talaba, " + all.length + " savol", "ok"); go("home");
  }

  window.addEventListener("hashchange", function () {
    if (S.token && main) { var h = (location.hash || "#home").slice(1); if (h !== S.page) go(h); }
  });
  document.addEventListener("DOMContentLoaded", boot);
})();
