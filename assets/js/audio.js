/* QR-1: mavzuning qisqa audio tuşuntirişi — matn bilan sinxron.
   Pult: katta tugma, jonli VU-indikator (WebAudio AnalyserNode), taymkod, tezlik. */
(function () {
  var EX = window.EX;
  function mmss(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  var SEG = 24, FLOOR = -48; // indikator: 24 bölak, −48…0 dBFS

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
    var bar = EX.el("div", { class: "bar", role: "slider", "aria-label": "Yozuv joyi", tabindex: "0", "aria-valuemin": "0", "aria-valuemax": String(Math.round(data.duration)), "aria-valuenow": "0" }, EX.el("i"));
    var tcCur = EX.el("span", { class: "tc-cur" }, "0:00"), tcDur = EX.el("span", { class: "tc-dur" }, " / " + mmss(data.duration));
    var time = EX.el("div", { class: "tc" }, tcCur, tcDur);
    var onair = EX.el("span", { class: "onair" }, "Efirda");
    // VU indikator
    var vu = EX.el("div", { class: "vu", "aria-hidden": "true" }), cells = [];
    for (var i = 0; i < SEG; i++) { var c = EX.el("i", { class: i >= SEG - 3 ? "r" : i >= SEG - 8 ? "a" : "g" }); cells.push(c); vu.appendChild(c); }
    var scale = EX.el("div", { class: "vu-scale", "aria-hidden": "true" });
    [-40, -20, -10, -6, 0].forEach(function (db) {
      scale.appendChild(EX.el("span", { style: "left:" + (100 * (db - FLOOR) / -FLOOR) + "%" }, db === 0 ? "0 dB" : "−" + Math.abs(db)));
    });
    var speeds = EX.el("div", { class: "speed seg", role: "group", "aria-label": "Tezlik" });
    [0.75, 1, 1.25, 1.5].forEach(function (s) {
      var b = EX.el("button", { type: "button", class: s === 1 ? "on" : "" }, String(s).replace(".", ",") + "×");
      b.addEventListener("click", function () { audio.playbackRate = s; speeds.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); });
      speeds.appendChild(b);
    });
    var con = EX.el("section", { class: "console", "aria-label": "Audio pult" },
      playBtn,
      EX.el("div", { class: "con-mid" },
        EX.el("div", { class: "con-title" }, EX.el("b", null, data.title || t.short), onair),
        EX.el("div", { class: "vu-box" }, vu, scale),
        bar),
      time,
      EX.el("div", { class: "con-foot" }, EX.el("span", { class: "muted" }, "Tezlik"), speeds));
    wrap.appendChild(con);

    var tr = EX.el("section", { class: "panel transcript", "aria-label": "Matn" }, EX.el("h2", null, "Matn"));
    var ps = (data.paragraphs || []).map(function (p, i) {
      var el = EX.el("p", { tabindex: "0" }, p.text);
      el.addEventListener("click", function () { graph(); audio.currentTime = p.start + 0.01; audio.play(); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter") el.click(); });
      tr.appendChild(el); return el;
    });
    wrap.appendChild(tr);

    /* --- WebAudio: AnalyserNode (bir xil manbadagi MP3). Mavjud bölmasa — indikator yaşiriladi, ijro odatdagiday. --- */
    var actx = null, an = null, buf = null, raf = 0, level = 0, peak = 0, peakT = 0, lastT = 0;
    function graph() {
      if (actx === false) return;
      if (actx) { if (actx.state === "suspended" && actx.resume) actx.resume().catch(function () {}); return; }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { actx = false; con.classList.add("novu"); return; }
      try {
        actx = new AC();
        an = actx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0;
        buf = new Uint8Array(an.fftSize);
        var src = actx.createMediaElementSource(audio);
        src.connect(an); an.connect(actx.destination);
        if (actx.state === "suspended" && actx.resume) actx.resume().catch(function () {});
      } catch (e) { actx = false; an = null; con.classList.add("novu"); }
    }
    function meter(ts) {
      raf = 0;
      var dt = lastT ? Math.min(100, ts - lastT) : 16; lastT = ts;
      var target = 0;
      if (an && !audio.paused) {
        an.getByteTimeDomainData(buf);
        var sum = 0; for (var k = 0; k < buf.length; k++) { var v = (buf[k] - 128) / 128; sum += v * v; }
        var db = 20 * Math.log10(Math.sqrt(sum / buf.length) + 1e-9);
        target = Math.max(0, Math.min(1, (db - FLOOR) / -FLOOR));
      }
      // VU ballistikasi: tez kötariliş, sekin tuşiş; peak 1,2 s uşlab turiladi
      level = target > level ? level + (target - level) * Math.min(1, dt / 40) : level + (target - level) * Math.min(1, dt / 300);
      if (level >= peak) { peak = level; peakT = ts; } else if (ts - peakT > 1200) peak = Math.max(level, peak - dt / 1500);
      var on = Math.round(level * SEG), pk = Math.min(SEG - 1, Math.round(peak * SEG) - 1);
      for (var j = 0; j < SEG; j++) { cells[j].classList.toggle("on", j < on); cells[j].classList.toggle("pk", j === pk && pk >= on); }
      if (!audio.paused || level > 0.004 || peak > 0.004) raf = requestAnimationFrame(meter);
      else { lastT = 0; cells.forEach(function (x) { x.classList.remove("on", "pk"); }); }
    }
    function runMeter() { if (!raf && an) raf = requestAnimationFrame(meter); }

    playBtn.addEventListener("click", function () { graph(); if (audio.paused) audio.play(); else audio.pause(); });
    audio.addEventListener("play", function () { playBtn.innerHTML = EX.icons.pause; playBtn.setAttribute("aria-label", "Pauza"); con.classList.add("live"); runMeter(); });
    audio.addEventListener("pause", function () { playBtn.innerHTML = EX.icons.play; playBtn.setAttribute("aria-label", "Tinglaş"); con.classList.remove("live"); runMeter(); });
    audio.addEventListener("error", function () { EX.toast("Audio faylni yuklab bölmadi. Internet aloqasini tekşiring.", "bad"); });
    var last = -1;
    audio.addEventListener("timeupdate", function () {
      var d = audio.duration || data.duration || 1, c = audio.currentTime;
      bar.firstChild.style.width = (100 * c / d) + "%";
      bar.setAttribute("aria-valuenow", String(Math.round(c)));
      tcCur.textContent = mmss(c); tcDur.textContent = " / " + mmss(d);
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
