/* 17-mavzu. Yoritiş studiyasi */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, RAD = Math.PI / 180, PI = Math.PI;

  function s2l(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function l2s(c) { c = Math.max(0, Math.min(1, c)); return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // Qora jism rangi (Kelvin) → sRGB: Tanner Helland ("How to Convert Temperature (K) to RGB: Algorithm and Sample Code", 2012)
  // approksimatsiyasi; faqat 1000–12000 K oraliğida qöllaniladi, natija taxminiy.
  function kelvin(K) {
    var t = clamp(K, 1000, 12000) / 100, r, g, b;
    r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = t >= 66 ? 255 : (t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307);
    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
  }
  function hex(rgb) { return "#" + rgb.map(function (v) { var h = Math.round(v).toString(16); return h.length < 2 ? "0" + h : h; }).join("").toUpperCase(); }
  function dirOf(az, el) { return [Math.cos(el * RAD) * Math.sin(az * RAD), Math.sin(el * RAD), Math.cos(el * RAD) * Math.cos(az * RAD)]; }

  // bosh — balandlik maydoni z = h(x, y), kamera +z dan qaraydi
  function hf(x, y) {
    var a = 0.72, b = 0.95, q = 1 - x * x / (a * a) - y * y / (b * b);
    if (q <= 0) return null;
    var g = Math.sqrt(q), z = 0.8 * g;
    var nose = 0.17 * Math.exp(-(x * x / 0.008 + (y + 0.1) * (y + 0.1) / 0.05));
    var brow = 0.05 * Math.exp(-(y - 0.32) * (y - 0.32) / 0.004 - x * x / 0.3);
    var eye = -0.07 * (Math.exp(-((x - 0.27) * (x - 0.27) + (y - 0.2) * (y - 0.2)) / 0.012) + Math.exp(-((x + 0.27) * (x + 0.27) + (y - 0.2) * (y - 0.2)) / 0.012));
    var mouth = -0.03 * Math.exp(-(x * x / 0.03 + (y + 0.4) * (y + 0.4) / 0.0008));
    var lip = 0.025 * Math.exp(-(x * x / 0.025 + (y + 0.46) * (y + 0.46) / 0.0015));
    var chin = 0.05 * Math.exp(-(x * x / 0.02 + (y + 0.66) * (y + 0.66) / 0.01));
    return z + g * (nose + brow + eye + mouth + lip + chin);
  }
  var N = 190, EXT = 1.05, GEO = null;
  function geometry() {
    if (GEO) return GEO;
    var n = N * N, nx = new Float32Array(n), ny = new Float32Array(n), nz = new Float32Array(n), mk = new Uint8Array(n), e = 0.004;
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
      var x = ((i + 0.5) / N * 2 - 1) * EXT, y = (1 - (j + 0.5) / N * 2) * EXT, k = j * N + i, h0 = hf(x, y);
      if (h0 == null) continue;
      var hxp = hf(x + e, y), hxm = hf(x - e, y), hyp = hf(x, y + e), hym = hf(x, y - e);
      var dx = ((hxp == null ? h0 : hxp) - (hxm == null ? h0 : hxm)) / (2 * e), dy = ((hyp == null ? h0 : hyp) - (hym == null ? h0 : hym)) / (2 * e);
      var l = Math.hypot(dx, dy, 1); nx[k] = -dx / l; ny[k] = -dy / l; nz[k] = 1 / l; mk[k] = 1;
    }
    GEO = { nx: nx, ny: ny, nz: nz, mk: mk };
    return GEO;
  }
  var SKIN = [s2l(228), s2l(176), s2l(152)];
  function renderHead(lights, img) {
    var G = geometry(), d = img.data, act = lights.filter(function (L) { return L.on && L.I > 0; }).map(function (L) {
      var l = dirOf(L.az, L.el), kc = kelvin(L.K).map(s2l), h = [l[0], l[1], l[2] + 1], hl = Math.hypot(h[0], h[1], h[2]) || 1;
      return { l: l, h: [h[0] / hl, h[1] / hl, h[2] / hl], c: kc.map(function (v) { return v * L.I; }) };
    });
    for (var k = 0; k < N * N; k++) {
      var o = k * 4;
      if (!G.mk[k]) { d[o] = 26; d[o + 1] = 30; d[o + 2] = 40; d[o + 3] = 255; continue; }
      var nx = G.nx[k], ny = G.ny[k], nz = G.nz[k], r = 0.015 * SKIN[0], g = 0.015 * SKIN[1], b = 0.015 * SKIN[2];
      for (var q = 0; q < act.length; q++) {
        var A = act[q], nl = nx * A.l[0] + ny * A.l[1] + nz * A.l[2];
        if (nl <= 0) continue;
        var nh = Math.max(0, nx * A.h[0] + ny * A.h[1] + nz * A.h[2]), sp = 0.05 * Math.pow(nh, 40);
        r += (SKIN[0] * nl + sp) * A.c[0]; g += (SKIN[1] * nl + sp) * A.c[1]; b += (SKIN[2] * nl + sp) * A.c[2];
      }
      d[o] = l2s(r); d[o + 1] = l2s(g); d[o + 2] = l2s(b); d[o + 3] = 255;
    }
  }

  LAB.start({
    intro: "Yoritiş — 3D sahnaning körinişini belgilaydigan asosiy omillardan biri. Fotografiya va kinodan olingan uç nuqtali sxema, yoruğlikning masofaga boğliqligi va soya yumşoqligi — uç asosiy tuşunça.",
    tabs: [
      {
        name: "Uç nuqtali yoritiş",
        lead: "Key — asosiy manba, Fill — soyalarni yumşatadi, Rim — çetdan kontur beradi. Har bir manbaning kuçi, yönalişi va rang haroratini özgartiring.",
        build: function (L) {
          var lights = {
            key: { name: "Key", on: true, I: 1.0, az: 40, el: 35, K: 5600, col: C.orange },
            fill: { name: "Fill", on: true, I: 0.3, az: -45, el: 10, K: 6500, col: C.z },
            rim: { name: "Rim", on: true, I: 0.9, az: 150, el: 35, K: 5600, col: C.violet }
          };
          var order = ["key", "fill", "rim"];
          var off = document.createElement("canvas"); off.width = off.height = N;
          var octx = off.getContext("2d"), img = octx.createImageData(N, N), pending = false;
          var cv = L.canvas({ aspect: 1, maxH: 400 });
          cv.draw = function (c, w, h) {
            c.fillStyle = "#1A1E28"; c.fillRect(0, 0, w, h);
            var sz = Math.min(w, h); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
            c.drawImage(off, (w - sz) / 2, (h - sz) / 2, sz, sz);
          };
          var dg = L.canvas({ aspect: 0.72 });
          dg.draw = function (c, w, h) {
            var cx = w / 2, cy = h * 0.47, R = Math.min(w, h) * 0.34;
            c.fillStyle = "#F6F8FC"; c.fillRect(0, 0, w, h);
            c.strokeStyle = "rgba(24,32,47,.15)"; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.setLineDash([]);
            c.font = "600 12px Inter, system-ui, sans-serif"; c.fillStyle = C.ink3; c.textAlign = "start"; c.fillText("Yuqoridan körinişi", 8, 16); c.textAlign = "center";
            c.beginPath(); c.arc(cx, cy, R * 0.28, 0, 7); c.fillStyle = "#E7C9B5"; c.fill(); c.strokeStyle = C.ink2; c.stroke();
            c.beginPath(); c.moveTo(cx - 4, cy - R * 0.28 + 1); c.lineTo(cx, cy - R * 0.28 - 7); c.lineTo(cx + 4, cy - R * 0.28 + 1); c.fillStyle = "#E7C9B5"; c.fill(); c.stroke();
            // kamera
            c.fillStyle = C.ink; c.fillRect(cx - 12, cy + R + 14, 24, 14); c.beginPath(); c.moveTo(cx - 5, cy + R + 14); c.lineTo(cx - 8, cy + R + 8); c.lineTo(cx + 8, cy + R + 8); c.lineTo(cx + 5, cy + R + 14); c.fill();
            c.fillStyle = C.ink2; c.fillText("Kamera", cx, cy + R + 46);
            order.forEach(function (k) {
              var Lg = lights[k], a = Lg.az * RAD, x = cx + Math.sin(a) * R, y = cy + Math.cos(a) * R, col = hex(kelvin(Lg.K));
              c.globalAlpha = Lg.on ? 1 : 0.3;
              c.beginPath(); c.moveTo(x, y); c.lineTo(cx + Math.sin(a) * R * 0.3, cy + Math.cos(a) * R * 0.3);
              c.strokeStyle = col; c.lineWidth = 1 + Math.min(4, Lg.I * 2); c.stroke();
              c.beginPath(); c.arc(x, y, 12, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 2; c.strokeStyle = Lg.col; c.stroke();
              c.fillStyle = C.ink; c.font = "700 11px Inter, system-ui, sans-serif"; c.fillText(Lg.name[0], x, y + 4);
              c.font = "600 11px Inter, system-ui, sans-serif"; c.fillStyle = C.ink2;
              c.fillText(Lg.name + " · " + f(Lg.az, 0) + "° / " + f(Lg.el, 0) + "°", clamp(x, 60, w - 60), y + 27);
              c.globalAlpha = 1;
            });
            c.textAlign = "start";
          };
          var R = L.readout([["kf", "Key : Fill (kuç nisbati)"], ["ev", "Farq (stop = log₂)"], ["kc", "Key rangi"], ["fc", "Fill rangi"], ["rc", "Rim rangi"]], "main");
          function render() {
            pending = false;
            var arr = order.map(function (k) { return lights[k]; });
            renderHead(arr, img); octx.putImageData(img, 0, 0); cv.redraw(); dg.redraw();
            var K = lights.key, F = lights.fill, ratio = F.I > 0 ? K.I / F.I : Infinity;
            R.setMany({
              kf: isFinite(ratio) ? f(ratio, 1) + " : 1" : "Fill öçiq (∞)",
              ev: isFinite(ratio) && ratio > 0 ? f(Math.log(ratio) / Math.LN2, 1) + " stop" : "—",
              kc: f(K.K, 0) + " K  " + hex(kelvin(K.K)), fc: f(F.K, 0) + " K  " + hex(kelvin(F.K)), rc: f(lights.rim.K, 0) + " K  " + hex(kelvin(lights.rim.K))
            });
          }
          function sched() { if (!pending) { pending = true; requestAnimationFrame(render); } }
          L.pages("Chiroq", order.map(function (k) {
            return [k, lights[k].name, function () {
              var Lg = lights[k];
              L.toggle(Lg.name + " yoqilgan", true, function (v) { Lg.on = v; sched(); });
              L.slider({ label: "Kuç (intensivlik)", min: 0, max: 3, step: 0.05, value: Lg.I, nd: 2 }, function (v) { Lg.I = v; sched(); });
              L.slider({ label: "Azimut (0° — kamera tomondan)", min: -180, max: 180, step: 1, value: Lg.az, nd: 0, unit: "°" }, function (v) { Lg.az = v; sched(); });
              L.slider({ label: "Balandlik burçagi", min: -20, max: 85, step: 1, value: Lg.el, nd: 0, unit: "°" }, function (v) { Lg.el = v; sched(); });
              L.slider({ label: "Rang harorati", min: 1000, max: 12000, step: 100, value: Lg.K, nd: 0, unit: "K" }, function (v) { Lg.K = v; sched(); });
            }];
          }), "key");
          L.note("Rang harorati Kelvinda: 2700–3200 K — issiq (çöğlanma lampa), 5600 K — kunduzgi yoruğlik, 6500 K va undan yuqori — sovuq. Rangga çevirişda Tanner Helland yaqinlaştirişi qöllanilgan (1000–12000 K). Key : Fill = I<sub>key</sub> / I<sub>fill</sub>; 2 baravar farq = 1 stop. Fotograflar nisbatni (key + fill) : fill kabi ham yozadi.", "main");
          render();
          L.tasks([
            "Faqat Key ni qoldiring (Fill va Rim ni öçiring): soyali tomon qanday körinadi? Söng Fill ni qaytaring.",
            "Key kuçini 1,0, Fill kuçini 0,5 qiling: nisbat 2 : 1 (1 stop) bölishini körsatkiçdan tekşiring.",
            "Rim azimutini 150° dan 0° ga özgartiring: kontur yoruğligi qayerga ketadi? Key ni 3200 K, Fill ni 8000 K qiling — rang kontrastini körasizmi?"
          ], "a");
        }
      },
      {
        name: "Teskari kvadrat qonuni",
        lead: "Nuqtaviy manbadan masofa ikki baravar oşsa, yoruğlik tüşishi (illuminance) tört baravar kamayadi, çunki nur uç barobar emas, tört barobar kattaroq yuzaga yoyiladi.",
        build: function (L) {
          var st = { I: 100, d: 1.5, log: false };
          var E = function (d) { return st.I / (d * d); };
          var dg = L.canvas({ aspect: 0.5 });
          var cv = L.canvas({ aspect: 0.6 });
          var R = L.readout([["e1", "E(d)"], ["e2", "E(2d)"], ["e3", "E(3d)"], ["r", "E(2d) / E(d)"], ["h", "Yarim yoruğlik masofasi d·√2"]], "main");
          dg.draw = function (c, w, h) {
            var x0 = 28, sc = (w - x0 - 14) / 8, cy = h * 0.5, ang = 13 * RAD;
            function X_(m) { return x0 + m * sc; }
            c.fillStyle = "#14171F"; c.fillRect(0, 0, w, h);
            // konus
            var Dm = 3 * st.d; c.beginPath(); c.moveTo(X_(0), cy); c.lineTo(X_(Dm), cy - Math.tan(ang) * Dm * sc); c.lineTo(X_(Dm), cy + Math.tan(ang) * Dm * sc); c.closePath();
            c.fillStyle = "rgba(255,226,140,.13)"; c.fill();
            var e0 = E(st.d), n = [1, 2, 3];
            n.forEach(function (k) {
              var dm = k * st.d, hh = Math.tan(ang) * dm * sc, rel = E(dm) / E(st.d) / 1, lin = Math.max(0, Math.min(1, E(dm) / Math.max(e0, 1e-9)));
              var g = Math.round(l2s(lin * 0.9 + 0.0));
              c.fillStyle = "rgb(" + g + "," + g + "," + Math.round(g * 0.92) + ")"; c.fillRect(X_(dm) - 4, cy - hh, 8, 2 * hh);
              c.strokeStyle = "rgba(255,255,255,.4)"; c.strokeRect(X_(dm) - 4, cy - hh, 8, 2 * hh);
              c.fillStyle = "#E8ECF4"; c.font = "600 11px Inter, system-ui, sans-serif"; c.textAlign = "center";
              c.fillText(k === 1 ? "d" : k + "d", X_(dm), h - 24);
              c.fillText(f(E(dm), E(dm) < 10 ? 2 : 1) + " lx", X_(dm), h - 10);
              c.fillStyle = "#FFD66B"; c.fillText("yuza ×" + k * k, X_(dm), 14 + (k === 3 ? 0 : 12 * (3 - k) * 0));
              c.textAlign = "start";
            });
            c.beginPath(); c.arc(X_(0), cy, 8, 0, 7); c.fillStyle = "#FFD66B"; c.fill();
            c.strokeStyle = "rgba(255,214,107,.35)"; c.lineWidth = 6; c.stroke(); c.lineWidth = 1;
          };
          cv.draw = function (c, w, h) {
            var pad = { l: 46, r: 12, t: 14, b: 34 }, W = w - pad.l - pad.r, H = h - pad.t - pad.b, i, dmax = 8, dmin = 0.5, ymax = E(dmin);
            function sx(d) { return pad.l + (d - dmin) / (dmax - dmin) * W; }
            function sy(v) {
              if (st.log) { var lo = Math.log10(E(dmax)), hi = Math.log10(ymax); return pad.t + H - (Math.log10(Math.max(v, 1e-9)) - lo) / (hi - lo) * H; }
              return pad.t + H - v / ymax * H;
            }
            c.font = "11px Inter, system-ui, sans-serif"; c.lineWidth = 1;
            for (i = 1; i <= 8; i++) { c.strokeStyle = "rgba(24,32,47,.10)"; c.beginPath(); c.moveTo(sx(i), pad.t); c.lineTo(sx(i), pad.t + H); c.stroke(); c.fillStyle = C.ink3; c.fillText(i + "", sx(i) - 3, h - 18); }
            c.fillStyle = C.ink2; c.fillText("d, m", pad.l + W / 2 - 12, h - 3);
            var ticks = st.log ? [E(8), E(4), E(2), E(1), E(0.5)] : [0, 0.25, 0.5, 0.75, 1].map(function (q) { return q * ymax; });
            ticks.forEach(function (v) { c.strokeStyle = "rgba(24,32,47,.10)"; c.beginPath(); c.moveTo(pad.l, sy(v)); c.lineTo(pad.l + W, sy(v)); c.stroke(); c.fillStyle = C.ink3; c.fillText(f(v, v < 10 ? 1 : 0), 4, sy(v) + 4); });
            c.fillStyle = C.ink; c.font = "600 11px Inter, system-ui, sans-serif"; c.fillText("E, lx" + (st.log ? " (log)" : ""), pad.l + 6, pad.t + 10);
            c.beginPath(); for (var d = dmin; d <= dmax + 1e-9; d += 0.05) { if (d > dmin) c.lineTo(sx(d), sy(E(d))); else c.moveTo(sx(d), sy(E(d))); }
            c.strokeStyle = C.orange; c.lineWidth = 3; c.stroke();
            [[st.d, C.ink], [2 * st.d, C.z], [3 * st.d, C.violet]].forEach(function (p, k) {
              if (p[0] > dmax) return;
              c.beginPath(); c.arc(sx(p[0]), sy(E(p[0])), 5, 0, 7); c.fillStyle = p[1]; c.fill();
              c.fillText(k === 0 ? "d" : (k + 1) + "d", sx(p[0]) + 7, sy(E(p[0])) - 7);
            });
          };
          function upd() {
            var d = st.d;
            R.setMany({ e1: f(E(d), 2) + " lx", e2: f(E(2 * d), 2) + " lx", e3: f(E(3 * d), 2) + " lx", r: f(E(2 * d) / E(d), 3), h: f(d * Math.SQRT2, 2) + " m" });
            dg.redraw(); cv.redraw();
          }
          L.slider({ label: "Manba kuçi I", min: 20, max: 400, step: 10, value: st.I, nd: 0, unit: "cd" }, function (v) { st.I = v; upd(); });
          L.slider({ label: "Masofa d", min: 0.5, max: 2.6, step: 0.05, value: st.d, nd: 2, unit: "m" }, function (v) { st.d = v; upd(); });
          L.toggle("Vertikal öqni logarifmik qilish", false, function (v) { st.log = v; upd(); });
          L.note("E = I / d²  (E — yoruğlik tüşişi, lyuks (lx); I — yoruğlik kuçi, kandela (cd); d — masofa, m). Sirt nurga perpendikulyar va manba nuqtaviy deb olinadi; qiya tüşganda E = I·cos θ / d². Kattaligi masofadan ancha kiçik bölmagan manbalarda qonun yaqinlaşiş sifatida qöllanadi.", "main");
          upd();
          L.tasks([
            "d = 1 m dan 2 m ga özgartiring: E(2d)/E(d) = 0,25 bölishini körsatkiçdan tekşiring.",
            "Logarifmik öqni yoqing: grafik nima uçun töğri çiziqqa aylanadi? (E ∝ d⁻²)",
            "I = 100 cd bölganda E = 25 lx bölishi uçun d qançaga teng? (Javob: 2 m.)"
          ], "b");
        }
      },
      {
        name: "Soya yumşoqligi",
        lead: "Soyaning çeti qançalik yumşoq bölişi manbaning ölçamiga va obyektdan sirtgaça masofaga boğliq. Manba kiçik bölsa soya keskin, katta bölsa yumşoq bölib çiqadi.",
        build: function (L) {
          var st = { s: 0.5, o: 1.5, r: 4.5 }, A = 0.5;
          var dg = L.canvas({ aspect: 0.7 });
          var R = L.readout([["w", "Yarim soya kengligi w"], ["k", "d_r / d_o"], ["u", "Umbra (tola soya) kengligi"], ["chk", "Profildan ölçangan w"]], "main");
          function vis(y) { // manbaning körinadigan ulüşi (receiver nuqtasi y uçun)
            if (st.s <= 0) return Math.abs(y * st.o / st.r) < A ? 0 : 1;
            var k = st.r / st.o, q = 1 - 1 / k, lo = (-A - y / k) / q, hi = (A - y / k) / q;
            var a = Math.max(lo, -st.s / 2), b = Math.min(hi, st.s / 2), blocked = Math.max(0, b - a);
            return 1 - blocked / st.s;
          }
          dg.draw = function (c, w, h) {
            var x0 = 20, sc = (w - x0 - 40) / 8.6, cy = h / 2, k = st.r / st.o;
            function PX(x) { return x0 + x * sc; } function PY(y) { return cy - y * sc; }
            c.fillStyle = "#F6F8FC"; c.fillRect(0, 0, w, h);
            c.strokeStyle = "rgba(24,32,47,.08)"; c.lineWidth = 1;
            for (var i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(PX(i), 0); c.lineTo(PX(i), h); c.stroke(); c.fillStyle = C.ink3; c.font = "10px Inter, system-ui, sans-serif"; c.fillText(i + "", PX(i) + 2, h - 3); }
            // nurlar
            var topU = A * k - st.s / 2 * (k - 1), topL = A * k + st.s / 2 * (k - 1);
            function ray(yl, yr, col, dash) { c.beginPath(); c.moveTo(PX(0), PY(yl)); c.lineTo(PX(st.r), PY(yr)); c.strokeStyle = col; c.lineWidth = 1.4; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); }
            // yarim soya sohasi (yuqori va pastki chet)
            c.beginPath(); c.moveTo(PX(st.o), PY(A)); c.lineTo(PX(st.r), PY(topU)); c.lineTo(PX(st.r), PY(topL)); c.closePath(); c.fillStyle = "rgba(232,89,12,.16)"; c.fill();
            c.beginPath(); c.moveTo(PX(st.o), PY(-A)); c.lineTo(PX(st.r), PY(-topU)); c.lineTo(PX(st.r), PY(-topL)); c.closePath(); c.fill();
            ray(st.s / 2, topU, C.ink2, [5, 3]); ray(-st.s / 2, topL, C.orange);
            ray(-st.s / 2, -topU, C.ink2, [5, 3]); ray(st.s / 2, -topL, C.orange);
            // qabul qiluvçi va profil
            c.strokeStyle = C.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(PX(st.r), 0); c.lineTo(PX(st.r), h); c.stroke();
            var ymax = (h / 2) / sc;
            for (var py = 0; py < h; py += 2) {
              var yy = (cy - py - 1) / sc, g = Math.round(l2s(vis(yy)) * 0.95 + 8);
              c.fillStyle = "rgb(" + g + "," + g + "," + g + ")"; c.fillRect(PX(st.r) + 3, py, 14, 2);
            }
            c.strokeStyle = "rgba(24,32,47,.3)"; c.strokeRect(PX(st.r) + 3, 0, 14, h);
            // oçiq-tekis w qavsi
            if (st.s > 0 && Math.abs(topL) < ymax && Math.abs(topU) < ymax) {
              var xb = PX(st.r) - 10; c.strokeStyle = C.orange; c.lineWidth = 2; c.beginPath(); c.moveTo(xb, PY(topU)); c.lineTo(xb, PY(topL)); c.stroke();
              c.fillStyle = C.orange; c.font = "700 12px Inter, system-ui, sans-serif"; c.textAlign = "right"; c.fillText("w = " + f(st.s * (st.r - st.o) / st.o, 2) + " m", xb - 4, PY((topU + topL) / 2) + 4); c.textAlign = "start";
            }
            // manba va töşiq
            c.strokeStyle = "#F2B705"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(PX(0), PY(-st.s / 2)); c.lineTo(PX(0), PY(st.s / 2)); c.stroke();
            c.beginPath(); c.arc(PX(0), PY(0), 3, 0, 7); c.fillStyle = "#fff"; c.fill();
            c.strokeStyle = C.ink; c.lineWidth = 7; c.beginPath(); c.moveTo(PX(st.o), PY(-A)); c.lineTo(PX(st.o), PY(A)); c.stroke(); c.lineCap = "butt";
            c.fillStyle = C.ink; c.font = "600 11px Inter, system-ui, sans-serif";
            c.fillText("Manba (s)", 4, Math.max(14, PY(st.s / 2) - 12)); c.fillText("Töşiq", PX(st.o) + 6, PY(A) - 6); c.fillText("Sirt", PX(st.r) - 28, 14);
          };
          function upd() {
            var k = st.r / st.o, w = st.s * (st.r - st.o) / st.o, um = 2 * Math.max(0, A * k - st.s / 2 * (k - 1));
            // profildan sonli ölçaş: ravşanlik 0,001 dan 0,999 gaça bölgan oraliq (yuqori çet)
            var y1 = A * k + st.s / 2 * (k - 1) + 1, lo = null, hi = null, step = 0.002;
            for (var y = 0; y <= y1; y += step) { var v = vis(y); if (lo === null && v > 0.001) lo = y; if (v < 0.999) hi = y; }
            var mw = (um > 0 && lo !== null && hi !== null && st.s > 0) ? hi - lo : null;
            R.setMany({ w: f(w, 2) + " m", k: f(k, 2), u: um > 0 ? f(um, 2) + " m" : "yöq (faqat yarim soya)", chk: mw === null ? "—" : f(mw, 2) + " m" });
            dg.redraw();
          }
          L.slider({ label: "Manba ölçami s", min: 0, max: 1.5, step: 0.05, value: st.s, nd: 2, unit: "m" }, function (v) { st.s = v; upd(); });
          var so = L.slider({ label: "Manbadan töşiqqaça d_o", min: 0.5, max: 4, step: 0.1, value: st.o, nd: 1, unit: "m" }, function (v) { st.o = v; if (st.r < v + 0.3) { st.r = Math.min(8, v + 0.3); sr.set(st.r, true); } upd(); });
          var sr = L.slider({ label: "Manbadan sirtgaça d_r", min: 1, max: 8, step: 0.1, value: st.r, nd: 1, unit: "m" }, function (v) { st.r = Math.max(v, st.o + 0.3); if (st.r !== v) sr.set(st.r, true); upd(); });
          L.note("Yarim soya kengligi: <b>w = s · (d<sub>r</sub> − d<sub>o</sub>) / d<sub>o</sub></b>. Bu yerda s — manba ölçami, d<sub>o</sub> — manbadan töşiqqaça, d<sub>r</sub> — manbadan soya tüşadigan sirtgaça masofa (uçburçaklar oxşaşligi). Töşiq balandligi 1 m deb olingan. Manba nuqta (s = 0) bölsa, w = 0 — soya keskin.", "main");
          L.add(EX.el("div", { class: "legend", html: '<span><i style="background:' + C.orange + '"></i>Yarim soya (penumbra) çegarasi</span><span><i style="background:' + C.ink2 + '"></i>Tola soya (umbra) çegarasi</span>' }), "main");
          upd();
          L.tasks([
            "s = 0,5 m, d_o = 1 m, d_r = 3 m qiling: w = 0,5·(3 − 1)/1 = 1,0 m bölishini tekşiring. Söng s ni 0,25 m ga tüşiring: w ikki marta kamayadi.",
            "s = 0,5 m va d_o = 1,5 m da sirtni uzoqlaştiring (d_r ni oşiring): w va umbra kengligi qanday özgaradi?",
            "s = 0 ga tüşiring: yarim soya yöqoladimi? Umbra kengligi töşiq balandligiga (1 m) yaqinlaşadimi — d_r ≈ d_o da?"
          ], "c");
        }
      }
    ]
  });
})();
