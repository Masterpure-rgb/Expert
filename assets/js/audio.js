/* QR-1: mavzuning qisqa audio tuşuntirişi (Gemini TTS) — matn bilan sinxron. */
(function () {
  var EX = window.EX;
  function mmss(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  async function main() {
    var n = EX.topicFromPath(), t = window.topicInfo(n);
    EX.topbar(n);
    var wrap = EX.el("main", { class: "wrap" });
    document.body.appendChild(wrap);
    wrap.appendChild(EX.hero(n, "Tinglaş: mavzuning asosiy ğoyasi"));
    wrap.appendChild(EX.trio(n, "audio"));
    var data = null;
    try { data = await EX.fetchJSON("data/audio/" + t.nn + ".json"); } catch (e) { data = null; }
    if (!data) {
      wrap.appendChild(EX.el("div", { class: "note warn" }, "Bu mavzuning audio yozuvi tayyorlanmoqda. Hozirça laboratoriya va topşiriq sahifalaridan foydalaning."));
      return;
    }
    var audio = new Audio(); audio.preload = "metadata"; audio.src = EX.base + data.file;
    var playBtn = EX.el("button", { class: "play", type: "button", "aria-label": "Tinglaş", html: EX.icons.play });
    var bar = EX.el("div", { class: "bar", role: "slider", "aria-label": "Yozuv joyi", tabindex: "0" }, EX.el("i"));
    var time = EX.el("span", { class: "muted" }, "0:00 / " + mmss(data.duration));
    var speeds = EX.el("div", { class: "speed", role: "group", "aria-label": "Tezlik" });
    [0.75, 1, 1.25, 1.5].forEach(function (s) {
      var b = EX.el("button", { type: "button", class: s === 1 ? "on" : "" }, String(s).replace(".", ",") + "×");
      b.addEventListener("click", function () { audio.playbackRate = s; speeds.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); });
      speeds.appendChild(b);
    });
    wrap.appendChild(EX.el("section", { class: "panel" },
      EX.el("div", { class: "player" }, playBtn, EX.el("div", { class: "grow" }, EX.el("b", null, data.title || t.short), bar, time)),
      EX.el("div", { style: "margin-top:12px" }, speeds)));
    var tr = EX.el("section", { class: "panel transcript", "aria-label": "Matn" }, EX.el("h2", null, "Matn"));
    var ps = (data.paragraphs || []).map(function (p, i) {
      var el = EX.el("p", { tabindex: "0" }, p.text);
      el.addEventListener("click", function () { audio.currentTime = p.start + 0.01; audio.play(); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter") el.click(); });
      tr.appendChild(el); return el;
    });
    wrap.appendChild(tr);
    if (data.voice) wrap.appendChild(EX.el("p", { class: "muted" }, data.voice));
    playBtn.addEventListener("click", function () { if (audio.paused) audio.play(); else audio.pause(); });
    audio.addEventListener("play", function () { playBtn.innerHTML = EX.icons.pause; playBtn.setAttribute("aria-label", "Pauza"); });
    audio.addEventListener("pause", function () { playBtn.innerHTML = EX.icons.play; playBtn.setAttribute("aria-label", "Tinglaş"); });
    audio.addEventListener("error", function () { EX.toast("Audio faylni yuklab bölmadi. Internet aloqasini tekşiring.", "bad"); });
    var last = -1;
    audio.addEventListener("timeupdate", function () {
      var d = audio.duration || data.duration || 1, c = audio.currentTime;
      bar.firstChild.style.width = (100 * c / d) + "%";
      time.textContent = mmss(c) + " / " + mmss(d);
      var k = -1;
      (data.paragraphs || []).forEach(function (p, i) { if (c >= p.start - 0.05) k = i; });
      if (k !== last) { ps.forEach(function (el, i) { el.classList.toggle("now", i === k); }); last = k; }
    });
    function seek(x) { var r = bar.getBoundingClientRect(); var d = audio.duration || data.duration; audio.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * d; }
    bar.addEventListener("click", function (e) { seek(e.clientX); });
    bar.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") audio.currentTime = Math.min((audio.duration || 0), audio.currentTime + 5);
      if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main); else main();
})();
