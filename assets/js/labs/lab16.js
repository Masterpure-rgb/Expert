/* 16-mavzu. PBR material laboratoriyasi */
(function () {
  var X = window.X3D, C = LAB.C, f = X.fmt, RAD = Math.PI / 180, PI = Math.PI;

  function s2l(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function l2s(c) { c = Math.max(0, Math.min(1, c)); return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055); }
  function f0of(ior) { var q = (ior - 1) / (ior + 1); return q * q; }
  function schlick(f0, cos) { return f0 + (1 - f0) * Math.pow(1 - cos, 5); }
  // aniq dielektrik Fresnel (qutblanmagan yoruğlik: Rs va Rp örtaçasi), havo → n
  function fresnel(n, th) {
    var c = Math.cos(th), s = Math.sin(th) / n, ct = Math.sqrt(Math.max(0, 1 - s * s));
    var rs = Math.pow((c - n * ct) / (c + n * ct), 2), rp = Math.pow((n * c - ct) / (n * c + ct), 2);
    return { rs: rs, rp: rp, f: (rs + rp) / 2 };
  }
  function rgbStr(a) { return "(" + a.map(function (x) { return f(x, 2); }).join("; ") + ")"; }

  var PRESETS = {
    gold: { name: "Tilla", base: [1.0, 0.71, 0.29], m: 1, r: 0.3, ior: 1.5 },
    copper: { name: "Mis", base: [0.95, 0.64, 0.54], m: 1, r: 0.35, ior: 1.5 },
    plastic: { name: "Plastik", base: [s2l(200), s2l(40), s2l(40)], m: 0, r: 0.4, ior: 1.5 },
    rubber: { name: "Rezina", base: [s2l(45), s2l(45), s2l(48)], m: 0, r: 0.9, ior: 1.5 },
    ceramic: { name: "Keramika", base: [s2l(235), s2l(232), s2l(225)], m: 0, r: 0.12, ior: 1.5 }
  };

  var N = 200;
  function renderSphere(st, img) {
    var d = img.data, l = [Math.cos(st.el * RAD) * Math.sin(st.az * RAD), Math.sin(st.el * RAD), Math.cos(st.el * RAD) * Math.cos(st.az * RAD)];
    var f0d = f0of(st.ior), F0 = [0, 1, 2].map(function (i) { return f0d * (1 - st.m) + st.base[i] * st.m; });
    var rough = Math.max(0.04, st.r), a = rough * rough, a2 = a * a, k = (rough + 1) * (rough + 1) / 8, Li = PI * st.I;
    var hx0 = l[0], hy0 = l[1], hz0 = l[2] + 1, hl = Math.hypot(hx0, hy0, hz0) || 1, h = [hx0 / hl, hy0 / hl, hz0 / hl];
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var px = (x + 0.5) / N * 2 - 1, py = 1 - (y + 0.5) / N * 2, rr = px * px + py * py, o = (y * N + x) * 4;
      if (rr >= 1) { d[o + 3] = 0; continue; }
      var nz = Math.sqrt(1 - rr), nl = Math.max(0, px * l[0] + py * l[1] + nz * l[2]), col = [0, 0, 0], i;
      if (nl > 0) {
        var nh = Math.max(0, px * h[0] + py * h[1] + nz * h[2]), vh = Math.max(0, h[2]);
        var den = nh * nh * (a2 - 1) + 1, D = a2 / (PI * den * den);
        var G = nl / (nl * (1 - k) + k) * nz / (nz * (1 - k) + k), fc = Math.pow(1 - vh, 5);
        for (i = 0; i < 3; i++) {
          var F = F0[i] + (1 - F0[i]) * fc, spec = D * G * F / (4 * nl * nz + 1e-4), kd = (1 - F) * (1 - st.m);
          col[i] = (kd * st.base[i] / PI + spec) * nl * Li;
        }
      }
      if (st.amb) {
        var rvy = 2 * nz * py, env = 0.06 + 0.3 * (rvy * 0.5 + 0.5), fr = Math.pow(1 - nz, 5), dif = 0.10 * (0.6 + 0.4 * (py * 0.5 + 0.5));
        for (i = 0; i < 3; i++) {
          var Fr = F0[i] + (Math.max(1 - rough, F0[i]) - F0[i]) * fr;
          col[i] += st.base[i] * (1 - st.m) * dif + Fr * env * (1 - 0.6 * rough);
        }
      }
      for (i = 0; i < 3; i++) d[o + i] = st.srgb ? l2s(col[i]) : Math.max(0, Math.min(255, col[i] * 255));
      d[o + 3] = 255;
    }
  }

  LAB.start({
    intro: "PBR (Physically Based Rendering) materialda yoruğlik fizik qonunlariga yaqin hisoblanadi: sirt mikroskopik darajada notekis, uning akslantiriş qobiliyati esa tuşiş burçagiga boğliq. Bu laboratoriyada Cook–Torrance modeli har bir piksel uçun hisoblanadi.",
    tabs: [
      {
        name: "Material sferasi",
        lead: "Metallic, Roughness va IOR slayderlarini özgartiring: metalda aks rangli bölib, diffuz qism yöqoladi; Roughness oşsa, yaltiroq doğ kengayib xiralaşadi.",
        build: function (L) {
          var st = { base: PRESETS.plastic.base.slice(), m: 0, r: 0.4, ior: 1.5, az: -35, el: 35, I: 2.5, amb: true, srgb: true };
          var off = document.createElement("canvas"); off.width = off.height = N;
          var octx = off.getContext("2d"), img = octx.createImageData(N, N), pending = false, centre = "—";
          var cv = L.canvas({ aspect: 1, maxH: 420 });
          cv.draw = function (c, w, h) {
            var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#F3F5FA"); g.addColorStop(1, "#DDE2EC");
            c.fillStyle = g; c.fillRect(0, 0, w, h);
            var sz = Math.min(w, h) * 0.96;
            c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
            c.drawImage(off, (w - sz) / 2, (h - sz) / 2, sz, sz);
          };
          var R = L.readout([["f0", "F₀ (chiziqli RGB)"], ["a", "α = Roughness²"], ["c", "Markaziy piksel (sRGB)"], ["kd", "Diffuz uluş (1 − Metallic)"]], "main");
          function render() {
            pending = false;
            renderSphere(st, img); octx.putImageData(img, 0, 0); cv.redraw();
            var f0d = f0of(st.ior), F0 = [0, 1, 2].map(function (i) { return f0d * (1 - st.m) + st.base[i] * st.m; });
            var mid = img.data.slice((N / 2 * N + N / 2) * 4, (N / 2 * N + N / 2) * 4 + 3);
            R.setMany({ f0: rgbStr(F0), a: f(Math.pow(Math.max(0.04, st.r), 2), 3), c: "(" + Array.prototype.map.call(mid, function (v) { return f(v, 0); }).join("; ") + ")", kd: f(1 - st.m, 2) });
          }
          function sched() { if (!pending) { pending = true; requestAnimationFrame(render); } }
          var sl = {};
          L.seg("Tayyor material", Object.keys(PRESETS).map(function (k) { return [k, PRESETS[k].name]; }), "plastic", function (k) {
            var p = PRESETS[k]; st.base = p.base.slice(); st.m = p.m; st.r = p.r; st.ior = p.ior;
            ["r", "g", "b"].forEach(function (n, i) { sl[n].set(Math.round(l2s(st.base[i])), true); });
            sl.m.set(p.m, true); sl.rough.set(p.r, true); sl.ior.set(p.ior, true); sched();
          });
          ["R", "G", "B"].forEach(function (n, i) {
            sl[n.toLowerCase()] = L.slider({ label: "Base Color " + n + " (sRGB)", min: 0, max: 255, step: 1, value: Math.round(l2s(st.base[i])), nd: 0 }, function (v) { st.base[i] = s2l(v); sched(); });
          });
          sl.m = L.slider({ label: "Metallic", min: 0, max: 1, step: 0.01, value: st.m, nd: 2 }, function (v) { st.m = v; sched(); });
          sl.rough = L.slider({ label: "Roughness", min: 0.04, max: 1, step: 0.01, value: st.r, nd: 2 }, function (v) { st.r = v; sched(); });
          sl.ior = L.slider({ label: "IOR", min: 1, max: 2.5, step: 0.01, value: st.ior, nd: 2 }, function (v) { st.ior = v; sched(); });
          L.slider({ label: "Yoruğlik manbai: azimut", min: -180, max: 180, step: 1, value: st.az, nd: 0, unit: "°" }, function (v) { st.az = v; sched(); });
          L.slider({ label: "Yoruğlik manbai: balandlik", min: 0, max: 90, step: 1, value: st.el, nd: 0, unit: "°" }, function (v) { st.el = v; sched(); });
          L.slider({ label: "Yoruğlik quvvati", min: 0.5, max: 6, step: 0.1, value: st.I, nd: 1 }, function (v) { st.I = v; sched(); });
          L.toggle("Oddiy muhit yoruğligi (ambient)", true, function (v) { st.amb = v; sched(); });
          L.toggle("Chiziqli → sRGB kodlaş", true, function (v) { st.srgb = v; sched(); });
          L.note("f<sub>r</sub> = k<sub>d</sub>·c/π + D·G·F / (4·(n·l)·(n·v)); D — GGX, α = Roughness²; G — Smith/Schlick-GGX (k = (r+1)²/8); F = F₀ + (1 − F₀)(1 − h·v)<sup>5</sup>; F₀ = ((n−1)/(n+1))² (IOR 1,5 → 0,04); metalda F₀ = Base Color; k<sub>d</sub> = (1 − F)(1 − Metallic). Tayyor materiallar — taxminiy qiymatlar (oltin F₀ ≈ (1,00; 0,71; 0,29), mis ≈ (0,95; 0,64; 0,54)). Ranglar chiziqli fazoda hisoblanib, ekran uçun sRGB ga ötkaziladi.", "main");
          render();
          L.tasks([
            "«Plastik» materialida Roughness ni 0,1 dan 0,9 gaça özgartiring: yaltiroq doğ qanday özgaradi?",
            "«Tilla» ni tanlab, Metallic ni 0 ga tuşiring: material nima uçun plastikka aylanadi? F₀ qiymatiga qarang (dielektrikda ≈ 0,04).",
            "«Chiziqli → sRGB kodlaş» ni öçiring: tasvir nima uçun qoraroq körinadi?"
          ], "a");
        }
      },
      {
        name: "Fresnel grafigi",
        lead: "Yoruğlik sirtga qiya tuşgan sari akslanish keskin oşadi. Schlick yaqinlaşişi aniq dielektrik Fresnel formulasi bilan soliştiriladi.",
        build: function (L) {
          var st = { n: 1.5, th: 60, rsrp: false };
          var cv = L.canvas({ aspect: 0.72, maxH: 380 });
          var R = L.readout([["f0", "F₀ = ((n − 1)/(n + 1))²"], ["sc", "Schlick F(θ)"], ["ex", "Aniq F(θ)"], ["df", "Farq |Schlick − aniq|"], ["br", "Brewster burçagi arctan n"], ["mx", "Eng katta farq (0°–89°)"]], "main");
          function draw(c, w, h) {
            var pad = { l: 40, r: 12, t: 12, b: 34 }, W = w - pad.l - pad.r, H = h - pad.t - pad.b, i;
            function sx(t) { return pad.l + t / 90 * W; } function sy(v) { return pad.t + H - v * H; }
            c.font = "11px Inter, system-ui, sans-serif"; c.lineWidth = 1;
            for (i = 0; i <= 90; i += 15) { c.strokeStyle = "rgba(24,32,47,.10)"; c.beginPath(); c.moveTo(sx(i), pad.t); c.lineTo(sx(i), pad.t + H); c.stroke(); c.fillStyle = C.ink3; c.fillText(i + "°", sx(i) - 8, h - 18); }
            for (i = 0; i <= 5; i++) { c.strokeStyle = "rgba(24,32,47,.10)"; c.beginPath(); c.moveTo(pad.l, sy(i / 5)); c.lineTo(pad.l + W, sy(i / 5)); c.stroke(); c.fillStyle = C.ink3; c.fillText(f(i / 5, 1), 8, sy(i / 5) + 4); }
            c.fillStyle = C.ink2; c.fillText("θ — tuşiş burçagi (normaldan)", pad.l + W / 2 - 80, h - 3); c.fillText("F", 22, pad.t + 8);
            var f0 = f0of(st.n);
            function curve(fn, col, lw, dash) {
              c.beginPath(); for (var t = 0; t <= 89.9; t += 0.5) { var x = sx(t), y = sy(fn(t * RAD)); if (t) c.lineTo(x, y); else c.moveTo(x, y); }
              c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]);
            }
            if (st.rsrp) { curve(function (t) { return fresnel(st.n, t).rs; }, C.teal, 1.5, [4, 3]); curve(function (t) { return fresnel(st.n, t).rp; }, C.violet, 1.5, [4, 3]); }
            curve(function (t) { return fresnel(st.n, t).f; }, C.z, 3);
            curve(function (t) { return schlick(f0, Math.cos(t)); }, C.orange, 2.5, [7, 4]);
            var bt = Math.atan(st.n) / RAD; c.strokeStyle = "rgba(24,32,47,.35)"; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(sx(bt), pad.t); c.lineTo(sx(bt), pad.t + H); c.stroke(); c.setLineDash([]);
            c.fillStyle = C.ink3; c.fillText("Brewster", sx(bt) - 46, pad.t + 12);
            var th = st.th * RAD, ex = fresnel(st.n, th).f, sc = schlick(f0, Math.cos(th));
            c.strokeStyle = C.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sx(st.th), pad.t); c.lineTo(sx(st.th), pad.t + H); c.stroke();
            [[ex, C.z], [sc, C.orange]].forEach(function (p) { c.beginPath(); c.arc(sx(st.th), sy(p[0]), 5, 0, 7); c.fillStyle = p[1]; c.fill(); });
            var mx = 0, ma = 0; for (var t = 0; t <= 89; t += 0.5) { var df = Math.abs(schlick(f0, Math.cos(t * RAD)) - fresnel(st.n, t * RAD).f); if (df > mx) { mx = df; ma = t; } }
            R.setMany({ f0: f(f0, 4), sc: f(sc, 4), ex: f(ex, 4), df: f(Math.abs(sc - ex), 4), br: f(bt, 1) + "°", mx: f(mx, 3) + " (θ ≈ " + f(ma, 0) + "°)" });
          }
          cv.draw = draw;
          L.slider({ label: "IOR (n)", min: 1.05, max: 3, step: 0.01, value: st.n, nd: 2 }, function (v) { st.n = v; cv.redraw(); });
          L.slider({ label: "Tuşiş burçagi θ", min: 0, max: 89, step: 1, value: st.th, nd: 0, unit: "°" }, function (v) { st.th = v; cv.redraw(); });
          L.toggle("Rs va Rp ni alohida körsatiş", false, function (v) { st.rsrp = v; cv.redraw(); });
          L.add(EX.el("div", { class: "legend", html: '<span><i style="background:' + C.z + '"></i>Aniq (Rs + Rp)/2</span><span><i style="background:' + C.orange + '"></i>Schlick</span>' }), "main");
          L.note("Schlick: F(θ) = F₀ + (1 − F₀)(1 − cos θ)<sup>5</sup>. Aniq (havo → n, qutblanmagan yoruğlik): F = (R<sub>s</sub> + R<sub>p</sub>)/2, R<sub>s</sub> = ((cos θ − n cos θ<sub>t</sub>)/(cos θ + n cos θ<sub>t</sub>))², R<sub>p</sub> = ((n cos θ − cos θ<sub>t</sub>)/(n cos θ + cos θ<sub>t</sub>))², sin θ<sub>t</sub> = sin θ / n. θ = 0° da ikkalasi F₀ ga teng. Misol: n = 1,5 da θ = 60° uçun aniq 0,089, Schlick 0,070.", "main");
          cv.redraw();
          L.tasks([
            "n = 1,5, θ = 0° da F ni ölçang: u 0,04 ga teng (F₀). Endi θ = 85° ga çiqaring: F qançaga oşdi?",
            "θ = 60° da Schlick va aniq qiymatni solişitiring (≈ 0,070 va 0,089): qaysi biri katta?",
            "IOR ni 1,05 dan 2,5 gaça özgartiring: F₀ qanday özgaradi va Brewster burçagi qayerga siljiydi?"
          ], "b");
        }
      }
    ]
  });
})();
