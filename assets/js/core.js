/* Expert — umumiy kliyent kutubxonasi: API, demo baza, yordamçi funksiyalar. */
(function () {
  var EX = window.EX = window.EX || {};
  var me = document.currentScript && document.currentScript.src;
  EX.base = me ? me.replace(/assets\/js\/core\.js.*$/, "") : "/";
  EX.cfg = window.EXPERT_CONFIG || { api: "" };

  // URL orqali API manzilini vaqtinça berish (?api=...) — sinov uçun
  try {
    var u = new URL(location.href);
    var qa = u.searchParams.get("api");
    if (qa) localStorage.setItem("ex_api", qa);
  } catch (e) {}
  EX.apiUrl = function () {
    var o = null;
    try { o = localStorage.getItem("ex_api"); } catch (e) {}
    return (o && /^https:\/\//.test(o)) ? o : (EX.cfg.api || "");
  };
  EX.isDemo = function () { return !EX.apiUrl(); };

  /* ---------------- qurilma ID ---------------- */
  EX.deviceId = (function () {
    var k = "ex_device";
    try {
      var v = localStorage.getItem(k);
      if (!v) { v = "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem(k, v); }
      return v;
    } catch (e) { return "d-nostore"; }
  })();

  /* ---------------- SHA-256 (sinxron, demo uçun) ---------------- */
  EX.sha256 = function (msg) {
    function rr(n, x) { return (x >>> n) | (x << (32 - n)); }
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = unescape(encodeURIComponent(msg)).split("").map(function (c) { return c.charCodeAt(0); });
    var l = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var s = 7; s >= 0; s--) bytes.push(s >= 4 ? 0 : (l >>> (s * 8)) & 0xff);
    for (var i = 0; i < bytes.length; i += 64) {
      var w = [];
      for (var j = 0; j < 16; j++) w[j] = (bytes[i + 4 * j] << 24) | (bytes[i + 4 * j + 1] << 16) | (bytes[i + 4 * j + 2] << 8) | bytes[i + 4 * j + 3];
      for (j = 16; j < 64; j++) {
        var s0 = rr(7, w[j - 15]) ^ rr(18, w[j - 15]) ^ (w[j - 15] >>> 3);
        var s1 = rr(17, w[j - 2]) ^ rr(19, w[j - 2]) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rr(6, e) ^ rr(11, e) ^ rr(25, e), ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rr(2, a) ^ rr(13, a) ^ rr(22, a), mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
  };

  /* ---------------- demo baza (localStorage) ---------------- */
  function strObj(o) { var r = {}; for (var k in o) r[k] = o[k] === undefined || o[k] === null ? "" : String(o[k]); return r; }
  var LocalStore = {
    k: function (t) { return "exdemo_" + t; },
    all: function (t) { try { return JSON.parse(localStorage.getItem(this.k(t)) || "[]"); } catch (e) { return []; } },
    save: function (t, rows) { localStorage.setItem(this.k(t), JSON.stringify(rows)); },
    find: function (t, key, val) {
      var r = this.all(t);
      for (var i = 0; i < r.length; i++) if (String(r[i][key]) === String(val)) return r[i];
      return null;
    },
    insert: function (t, o) { var r = this.all(t); r.push(strObj(o)); this.save(t, r); },
    insertMany: function (t, os) { var r = this.all(t); os.forEach(function (o) { r.push(strObj(o)); }); this.save(t, r); },
    update: function (t, key, val, patch) {
      var r = this.all(t);
      for (var i = 0; i < r.length; i++) if (String(r[i][key]) === String(val)) {
        var p = strObj(patch); for (var k in p) r[i][k] = p[k];
        this.save(t, r); return true;
      }
      return false;
    },
    remove: function (t, key, val) {
      var r = this.all(t).filter(function (x) { return String(x[key]) !== String(val); });
      this.save(t, r); return true;
    }
  };
  var demoEnv = {
    store: LocalStore,
    now: function () { return Date.now(); },
    uuid: function () { return (Date.now().toString(36) + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8)); },
    sha256: EX.sha256,
    cache: {
      get: function (k) {
        try { var v = JSON.parse(localStorage.getItem("exdemo_cache_" + k) || "null"); return v && v.e > Date.now() ? v.v : null; } catch (e) { return null; }
      },
      put: function (k, v, sec) { localStorage.setItem("exdemo_cache_" + k, JSON.stringify({ v: v, e: Date.now() + (sec || 21600) * 1000 })); }
    },
    lock: function (fn) { return fn(); }
  };
  EX.demoReset = function () {
    Object.keys(localStorage).forEach(function (k) { if (k.indexOf("exdemo_") === 0) localStorage.removeItem(k); });
  };

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------- API çaqiriş ---------------- */
  EX.api = async function (action, payload) {
    var url = EX.apiUrl();
    if (!url) {
      if (typeof handleAction !== "function") return { ok: false, error: "Demo rejim yuklanmadi", code: "NODEMO" };
      await sleep(120);
      return JSON.parse(JSON.stringify(handleAction(demoEnv, action, payload || {})));
    }
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        var r = await fetch(url, {
          method: "POST", redirect: "follow",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: action, payload: payload || {} })
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        return await r.json();
      } catch (e) {
        if (attempt === 2) return { ok: false, error: "Tarmoq xatosi. Internet aloqasini tekşirib, qayta urinib köring.", code: "NET" };
        await sleep(700 * (attempt + 1) + Math.random() * 600);
      }
    }
  };

  /* ---------------- DOM yordamçilari ---------------- */
  EX.el = function (tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x != null && x !== false) e.appendChild(typeof x === "string" ? document.createTextNode(x) : x); });
      else e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
    return e;
  };
  EX.$ = function (s, r) { return (r || document).querySelector(s); };
  EX.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  EX.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  EX.toast = function (msg, kind) {
    var t = EX.el("div", { class: "toast " + (kind || "") }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("show"); }, 10);
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 300); }, 3200);
  };
  EX.fetchJSON = async function (path) {
    var r = await fetch(EX.base + path, { cache: "no-cache" });
    if (!r.ok) throw new Error(path + " " + r.status);
    return r.json();
  };
  EX.fmt = function (v, nd) {
    if (v == null || v === "" || isNaN(v)) return "—";
    var s = Number(v).toFixed(nd == null ? 2 : nd);
    s = s.replace(/\.?0+$/, "");
    return s.replace(".", ",");
  };
  EX.topicFromPath = function () {
    var m = location.pathname.match(/\/(?:a|l|t)\/(\d{1,2})\/?/);
    if (m) return Number(m[1]);
    var q = new URL(location.href).searchParams.get("m");
    return q ? Number(q) : 1;
  };
  EX.applyTheme = function (n) {
    var t = window.topicInfo && window.topicInfo(n);
    if (!t) return t;
    document.documentElement.style.setProperty("--accent", t.color);
    document.documentElement.style.setProperty("--accent-soft", t.soft);
    return t;
  };
})();
