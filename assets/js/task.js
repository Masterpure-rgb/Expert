/* QR-3: jonli topşiriq sahifasi (talaba uçun). */
(function () {
  var EX = window.EX, el = EX.el;
  var topic = EX.topicFromPath();
  var t = window.topicInfo(topic);
  var root;
  var state = { join: null, answers: {}, conf: {}, started: 0, timerId: null };
  var LS_ID = "ex_student_id";

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function boot() {
    EX.topbar(topic);
    root = el("main", { class: "wrap" });
    document.body.appendChild(root);
    root.appendChild(EX.hero(topic, "Jonli topşiriq"));
    root.appendChild(EX.trio(topic, "task"));
    showLogin();
  }

  function clear() { while (root.children.length > 2) root.removeChild(root.lastChild); }

  /* ---------- 1. kiriş ---------- */
  function showLogin(msg) {
    clear();
    var idIn = el("input", { id: "sid", inputmode: "numeric", autocomplete: "off", maxlength: "6", placeholder: "123456", class: "big-input", value: store(LS_ID) || "" });
    var codeIn = el("input", { id: "kod", inputmode: "numeric", autocomplete: "off", maxlength: "4", placeholder: "0000", class: "big-input" });
    var go = el("button", { class: "btn primary block", type: "submit" }, "Topşiriqni boşlaş");
    var form = el("form", { class: "panel", onsubmit: function (e) { e.preventDefault(); join(idIn.value.trim(), codeIn.value.trim(), go); } },
      el("h2", null, "Darsdagi topşiriq"),
      el("p", { class: "muted" }, "ID raqamingizni va öqituvçi ekranda körsatgan 4 xonali kodni kiriting."),
      el("label", { class: "f", for: "sid" }, "Talaba ID"), idIn,
      el("label", { class: "f", for: "kod" }, "Sessiya kodi"), codeIn,
      el("div", { style: "height:14px" }), go,
      msg ? el("p", { class: "note bad", style: "margin-top:12px" }, msg) : null
    );
    root.appendChild(form);
    if (EX.isDemo()) {
      root.appendChild(el("div", { class: "note warn" },
        "Platforma hali serverga ulanmagan (demo rejim). Darsdagi topşiriq öqituvçi platformani ulagandan keyin işlaydi. Hozir mustaqil maşq qilişingiz mumkin."));
    }
    root.appendChild(el("div", { class: "panel" },
      el("h2", null, "Mustaqil maşq"),
      el("p", { class: "muted" }, "Darsdan taşqarida bilimingizni tekşiring: kitobdagi test savollari, javob va izoh bilan. Ball bazaga yozilmaydi."),
      el("button", { class: "btn block", onclick: practice }, "Maşqni boşlaş")));
    if (!idIn.value) idIn.focus(); else codeIn.focus();
  }

  async function join(sid, kod, btn) {
    if (!/^\d{6}$/.test(sid)) return EX.toast("ID 6 ta raqamdan iborat", "bad");
    if (!/^\d{4}$/.test(kod)) return EX.toast("Sessiya kodi 4 ta raqam", "bad");
    btn.disabled = true; btn.textContent = "Tekşirilmoqda…";
    var r = await EX.api("s_join", { mavzu: topic, talabaId: sid, kod: kod, qurilma: EX.deviceId });
    btn.disabled = false; btn.textContent = "Topşiriqni boşlaş";
    if (!r.ok) return showLogin(r.error);
    store(LS_ID, sid);
    state.join = r; state.kod = kod; state.sid = sid; state.answers = {}; state.conf = {};
    if (r.javobBergan) return showDone({ already: true });
    showQuestions();
  }

  /* ---------- 2. savollar ---------- */
  function showQuestions() {
    clear();
    var j = state.join;
    var head = el("div", { class: "panel" },
      el("div", { class: "row" },
        el("div", { class: "grow" }, el("b", null, j.talaba.fio), el("div", { class: "muted" }, j.talaba.guruh + " guruhi")),
        el("span", { class: "chip" }, j.dars.nom)),
      j.dars.tugash ? el("p", { class: "muted", style: "margin:10px 0 0" }, "Qolgan vaqt: ", el("span", { class: "timer", id: "timer" }, "—")) : null
    );
    root.appendChild(head);
    j.savollar.forEach(function (q, i) { root.appendChild(renderQ(q, i)); });
    var send = el("button", { class: "btn primary block", onclick: function () { submit(send); } }, "Javoblarni yuboriş");
    root.appendChild(send);
    state.started = Date.now();
    if (j.dars.tugash) tick();
  }

  function tick() {
    var j = state.join;
    var skew = j.serverVaqt - Date.now();
    clearInterval(state.timerId);
    state.timerId = setInterval(function () {
      var left = Math.max(0, j.dars.tugash - (Date.now() + skew));
      var tEl = document.getElementById("timer");
      if (tEl) tEl.textContent = Math.floor(left / 60000) + ":" + String(Math.floor(left / 1000) % 60).padStart(2, "0");
      if (left <= 0) clearInterval(state.timerId);
    }, 500);
  }

  function renderQ(q, i) {
    var box = el("section", { class: "q", id: "q-" + q.id },
      el("div", { class: "qh" }, el("span", { class: "qn" }, (i + 1) + "."), el("span", { class: "qt" }, q.savol)));
    if (q.tur === "single" || q.tur === "multi") {
      var multi = q.tur === "multi";
      if (multi) box.appendChild(el("p", { class: "muted", style: "margin:0 0 6px" }, "Bir neçta töğri javob bölişi mumkin."));
      q.variantlar.forEach(function (v) {
        var inp = el("input", { type: multi ? "checkbox" : "radio", name: "q" + q.id, value: v.i });
        var lab = el("label", { class: "opt" }, inp, el("span", null, v.t));
        inp.addEventListener("change", function () {
          if (multi) {
            var cur = state.answers[q.id] || [];
            if (inp.checked) cur.push(v.i); else cur = cur.filter(function (x) { return x !== v.i; });
            state.answers[q.id] = cur;
            lab.classList.toggle("sel", inp.checked);
          } else {
            state.answers[q.id] = v.i;
            EX.$$(".opt", box).forEach(function (o) { o.classList.remove("sel"); });
            lab.classList.add("sel");
          }
        });
        box.appendChild(lab);
      });
    } else if (q.tur === "numeric") {
      var ni = el("input", { inputmode: "decimal", placeholder: "Javob (masalan 2,63)", autocomplete: "off" });
      ni.addEventListener("input", function () { state.answers[q.id] = ni.value; });
      box.appendChild(ni);
    } else if (q.tur === "open") {
      var ta = el("textarea", { placeholder: "Javobingizni 2–4 jumlada yozing" });
      ta.addEventListener("input", function () { state.answers[q.id] = ta.value; });
      box.appendChild(ta);
    } else if (q.tur === "order") {
      var items = q.variantlar.slice();
      var ol = el("ol");
      var draw = function () {
        ol.innerHTML = "";
        items.forEach(function (v, k) {
          var up = el("button", { class: "btn small", type: "button", "aria-label": "Yuqoriga", onclick: function () { if (k > 0) { var x = items[k - 1]; items[k - 1] = items[k]; items[k] = x; draw(); } } }, "▲");
          var dn = el("button", { class: "btn small", type: "button", "aria-label": "Pastga", onclick: function () { if (k < items.length - 1) { var x = items[k + 1]; items[k + 1] = items[k]; items[k] = x; draw(); } } }, "▼");
          ol.appendChild(el("li", null, el("b", null, (k + 1) + "."), el("span", null, v.t), el("span", { class: "mv" }, up, dn)));
        });
        state.answers[q.id] = items.map(function (v) { return v.i; });
      };
      draw();
      box.appendChild(el("div", { class: "order" }, ol));
    }
    // ishonç darajasi (metakognitsiya)
    var conf = el("div", { class: "seg", style: "margin-top:10px" });
    [["past", "Taxmin"], ["orta", "Ikkilanyapman"], ["yuqori", "Işonçim komil"]].forEach(function (c) {
      var b = el("button", { type: "button" }, c[1]);
      b.addEventListener("click", function () {
        state.conf[q.id] = c[0];
        EX.$$("button", conf).forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
      });
      conf.appendChild(b);
    });
    box.appendChild(el("div", { class: "muted", style: "margin-top:10px;font-size:13px" }, "Javobingizga qança işonçingiz komil?"));
    box.appendChild(conf);
    return box;
  }

  async function submit(btn) {
    var j = state.join;
    var missing = j.savollar.filter(function (q) {
      var a = state.answers[q.id];
      return a === undefined || a === "" || (Array.isArray(a) && !a.length);
    });
    if (missing.length && !confirm(missing.length + " ta savolga javob berilmagan. Baribir yuborasizmi?")) return;
    btn.disabled = true; btn.textContent = "Yuborilmoqda…";
    var r = await EX.api("s_submit", {
      darsId: j.dars.id, bosqich: j.dars.bosqich, talabaId: state.sid, kod: state.kod,
      qurilma: EX.deviceId, javoblar: state.answers, ishonch: state.conf, vaqtMs: Date.now() - state.started
    });
    btn.disabled = false; btn.textContent = "Javoblarni yuboriş";
    if (!r.ok) return EX.toast(r.error, "bad");
    clearInterval(state.timerId);
    showDone(r);
  }

  /* ---------- 3. natija ---------- */
  function showDone(r) {
    clear();
    var p = el("div", { class: "panel result" });
    if (r.already) {
      p.appendChild(el("h2", null, "Siz bu bosqiçda javob bergansiz"));
      p.appendChild(el("p", { class: "muted" }, "Keyingi bosqiç ekranda paydo bölganda yangi kod bilan qayta kiring."));
    } else {
      p.appendChild(el("h2", null, "Javobingiz qabul qilindi"));
      if (r.ball != null) {
        p.appendChild(el("div", { class: "score" }, EX.fmt(r.ball) + " / " + EX.fmt(r.max)));
        if (r.tekshiriladi) p.appendChild(el("p", { class: "muted" }, "Nazariy javob öqituvçi tomonidan tekşirilgaç ball aniqlaştiriladi."));
      }
    }
    p.appendChild(el("div", { style: "height:12px" }));
    p.appendChild(el("button", { class: "btn block", onclick: function () { feedback(); } }, "Töğri javoblarni köriş"));
    p.appendChild(el("div", { style: "height:8px" }));
    p.appendChild(el("button", { class: "btn primary block", onclick: function () { showLogin(); } }, "Keyingi bosqiçga kiriş"));
    root.appendChild(p);
  }

  async function feedback() {
    var j = state.join;
    var r = await EX.api("s_feedback", { darsId: j.dars.id, bosqich: j.dars.bosqich, talabaId: state.sid });
    if (!r.ok) return EX.toast(r.error, "bad");
    clear();
    r.items.forEach(function (q, i) {
      var box = el("section", { class: "q" }, el("div", { class: "qh" }, el("span", { class: "qn" }, (i + 1) + "."), el("span", { class: "qt" }, q.savol)));
      if (q.tur === "single" || q.tur === "multi") {
        var right = [].concat(q.javob).map(Number), mine = [].concat(q.sizning == null ? [] : q.sizning).map(Number);
        q.variantlar.forEach(function (v, k) {
          var cls = "opt" + (right.indexOf(k) >= 0 ? " right" : (mine.indexOf(k) >= 0 ? " wrong" : ""));
          box.appendChild(el("div", { class: cls }, el("span", null, v)));
        });
      } else if (q.tur === "numeric") {
        box.appendChild(el("p", null, "Töğri javob: ", el("b", null, EX.fmt(q.javob, 4)), " · Sizning javobingiz: ", String(q.sizning == null ? "—" : q.sizning)));
      } else if (q.tur === "order") {
        box.appendChild(el("ol", null, (q.javob || []).map(function (k) { return el("li", null, q.variantlar[k]); })));
      } else {
        box.appendChild(el("p", { class: "muted" }, "Sizning javobingiz: " + (q.sizning || "—")));
      }
      if (q.izoh) box.appendChild(el("p", { class: "note", style: "margin-top:8px" }, q.izoh));
      root.appendChild(box);
    });
    root.appendChild(el("button", { class: "btn primary block", onclick: function () { showLogin(); } }, "Ortga"));
  }

  /* ---------- mustaqil maşq (bazaga yozilmaydi) ---------- */
  async function practice() {
    clear();
    var data;
    try { data = await EX.fetchJSON("data/practice/" + t.nn + ".json"); }
    catch (e) { root.appendChild(el("p", { class: "note bad" }, "Maşq savollari hali joylanmagan.")); return; }
    var score = 0, done = 0;
    var info = el("p", { class: "muted prac-score", "aria-live": "polite" }, "Har bir savolni belgilang — javob darhol tekşiriladi.");
    root.appendChild(info);
    data.items.forEach(function (q, i) {
      var box = el("section", { class: "q" }, el("div", { class: "qh" }, el("span", { class: "qn" }, (i + 1) + "."), el("span", { class: "qt" }, q.q)));
      var answered = false;
      q.options.forEach(function (o, k) {
        var opt = el("button", { class: "opt", type: "button", style: "width:100%;text-align:left;font:inherit" }, el("b", null, "ABCD"[k] + ")"), el("span", null, o));
        opt.addEventListener("click", function () {
          if (answered) return;
          answered = true; done++;
          if (k === q.answer) { score++; opt.classList.add("right"); } else { opt.classList.add("wrong"); EX.$$(".opt", box)[q.answer].classList.add("right"); }
          if (q.explain) box.appendChild(el("p", { class: "note", style: "margin-top:8px" }, q.explain));
          info.textContent = "Natija: " + score + " / " + done + " (jami " + data.items.length + ")";
        });
        box.appendChild(opt);
      });
      root.appendChild(box);
    });
    root.appendChild(el("button", { class: "btn block", onclick: function () { showLogin(); } }, "Ortga"));
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
