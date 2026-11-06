/* X3D — kiçik 3D/2D çiziş kutubxonasi (kutubxonasiz, Canvas 2D). Laboratoriyalar uçun. */
(function () {
  var X = window.X3D = {};

  /* ---------------- vektorlar va matritsalar ---------------- */
  X.v = {
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; },
    sub: function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; },
    mul: function (a, s) { return [a[0] * s, a[1] * s, a[2] * s]; },
    dot: function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
    cross: function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; },
    len: function (a) { return Math.hypot(a[0], a[1], a[2]); },
    norm: function (a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  };
  var V = X.v;
  // 4×4 matritsalar ustun-vektor kelişuvida, qatorlar massivi sifatida: M[r][c]
  X.m = {
    I: function () { return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; },
    mul: function (A, B) {
      var R = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += A[i][k] * B[k][j]; R[i][j] = s; }
      return R;
    },
    T: function (x, y, z) { return [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]]; },
    S: function (x, y, z) { return [[x, 0, 0, 0], [0, y, 0, 0], [0, 0, z, 0], [0, 0, 0, 1]]; },
    Rx: function (a) { var c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0, 0], [0, c, -s, 0], [0, s, c, 0], [0, 0, 0, 1]]; },
    Ry: function (a) { var c = Math.cos(a), s = Math.sin(a); return [[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1]]; },
    Rz: function (a) { var c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0, 0], [s, c, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; },
    apply: function (M, p) {
      var x = p[0], y = p[1], z = p[2], w = p.length > 3 ? p[3] : 1;
      return [M[0][0] * x + M[0][1] * y + M[0][2] * z + M[0][3] * w, M[1][0] * x + M[1][1] * y + M[1][2] * z + M[1][3] * w,
        M[2][0] * x + M[2][1] * y + M[2][2] * z + M[2][3] * w];
    },
    applyDir: function (M, d) { return [M[0][0] * d[0] + M[0][1] * d[1] + M[0][2] * d[2], M[1][0] * d[0] + M[1][1] * d[1] + M[1][2] * d[2], M[2][0] * d[0] + M[2][1] * d[1] + M[2][2] * d[2]]; }
  };

  /* ---------------- formatlaş ---------------- */
  X.fmt = function (v, nd) {
    if (v == null || isNaN(v)) return "—";
    if (Math.abs(v) < 1e-12) v = 0;
    var s = Number(v).toFixed(nd == null ? 2 : nd);
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    var neg = s.charAt(0) === "-"; if (neg) s = s.slice(1);
    var parts = s.split("."), ip = parts[0];
    if (ip.length >= 5) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
    return (neg ? "−" : "") + ip + (parts[1] ? "," + parts[1] : "");
  };

  /* ---------------- primitivlar (Blender bilan bir xil sonlar) ---------------- */
  X.mesh = {};
  X.mesh.cube = function (s) {
    s = (s || 2) / 2;
    return { v: [[-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s], [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]],
      f: [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]] };
  };
  X.mesh.uvSphere = function (seg, rings, r) {
    r = r || 1; var v = [[0, 0, r]], f = [], i, j;
    for (i = 1; i < rings; i++) { var th = Math.PI * i / rings; for (j = 0; j < seg; j++) { var ph = 2 * Math.PI * j / seg; v.push([r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)]); } }
    v.push([0, 0, -r]);
    for (j = 0; j < seg; j++) f.push([0, 1 + j, 1 + (j + 1) % seg]);
    for (i = 0; i < rings - 2; i++) { var a = 1 + i * seg, b = 1 + (i + 1) * seg; for (j = 0; j < seg; j++) f.push([a + j, b + j, b + (j + 1) % seg, a + (j + 1) % seg]); }
    var last = v.length - 1, base = 1 + (rings - 2) * seg;
    for (j = 0; j < seg; j++) f.push([base + j, last, base + (j + 1) % seg]);
    return { v: v, f: f };
  };
  X.mesh.icosphere = function (sub, r) {
    r = r || 1; var t = (1 + Math.sqrt(5)) / 2;
    var v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(V.norm);
    var f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (var s = 1; s < sub; s++) {
      var cache = {}, nf = [];
      var mid = function (a, b) { var k = a < b ? a + "_" + b : b + "_" + a; if (cache[k] == null) { v.push(V.norm(V.mul(V.add(v[a], v[b]), .5))); cache[k] = v.length - 1; } return cache[k]; };
      f.forEach(function (tri) { var a = tri[0], b = tri[1], c = tri[2], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
      f = nf;
    }
    return { v: v.map(function (p) { return V.mul(p, r); }), f: f };
  };
  X.mesh.cylinder = function (n, r, h, cap) {
    r = r || 1; h = (h || 2) / 2; var v = [], f = [], j;
    for (j = 0; j < n; j++) v.push([r * Math.cos(2 * Math.PI * j / n), r * Math.sin(2 * Math.PI * j / n), -h]);
    for (j = 0; j < n; j++) v.push([r * Math.cos(2 * Math.PI * j / n), r * Math.sin(2 * Math.PI * j / n), h]);
    for (j = 0; j < n; j++) f.push([j, (j + 1) % n, n + (j + 1) % n, n + j]);
    if (cap !== "none") { var b = [], t = []; for (j = n - 1; j >= 0; j--) b.push(j); for (j = 0; j < n; j++) t.push(n + j); f.push(b, t); }
    return { v: v, f: f };
  };
  X.mesh.cone = function (n, r, h) {
    r = r || 1; h = (h || 2) / 2; var v = [], f = [], j;
    for (j = 0; j < n; j++) v.push([r * Math.cos(2 * Math.PI * j / n), r * Math.sin(2 * Math.PI * j / n), -h]);
    v.push([0, 0, h]);
    for (j = 0; j < n; j++) f.push([j, (j + 1) % n, n]);
    var b = []; for (j = n - 1; j >= 0; j--) b.push(j); f.push(b);
    return { v: v, f: f };
  };
  X.mesh.torus = function (M, m, R, r) {
    R = R || 1; r = r || .25; var v = [], f = [], i, j;
    for (i = 0; i < M; i++) { var u = 2 * Math.PI * i / M; for (j = 0; j < m; j++) { var w = 2 * Math.PI * j / m; v.push([(R + r * Math.cos(w)) * Math.cos(u), (R + r * Math.cos(w)) * Math.sin(u), r * Math.sin(w)]); } }
    for (i = 0; i < M; i++) for (j = 0; j < m; j++) f.push([i * m + j, ((i + 1) % M) * m + j, ((i + 1) % M) * m + (j + 1) % m, i * m + (j + 1) % m]);
    return { v: v, f: f };
  };
  X.mesh.grid = function (nx, ny, size) {
    size = size || 2; var v = [], f = [], i, j;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) v.push([-size / 2 + size * i / (nx - 1), -size / 2 + size * j / (ny - 1), 0]);
    for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) f.push([j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i]);
    return { v: v, f: f };
  };
  // f(u,v) -> [x,y,z], u,v ∈ [0,1]
  X.mesh.param = function (fn, nu, nv, closeU, closeV) {
    var v = [], f = [], i, j, cu = closeU ? nu : nu + 1, cv = closeV ? nv : nv + 1;
    for (i = 0; i < cu; i++) for (j = 0; j < cv; j++) v.push(fn(i / nu, j / nv));
    for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) {
      var i2 = closeU ? (i + 1) % nu : i + 1, j2 = closeV ? (j + 1) % nv : j + 1;
      f.push([i * cv + j, i2 * cv + j, i2 * cv + j2, i * cv + j2]);
    }
    return { v: v, f: f };
  };
  X.mesh.edges = function (m) {
    var set = {}, out = [];
    m.f.forEach(function (face) { for (var i = 0; i < face.length; i++) { var a = face[i], b = face[(i + 1) % face.length]; var k = a < b ? a + "_" + b : b + "_" + a; if (!set[k]) { set[k] = 1; out.push([Math.min(a, b), Math.max(a, b)]); } } });
    return out;
  };
  X.mesh.counts = function (m) { var e = X.mesh.edges(m).length; return { V: m.v.length, E: e, F: m.f.length, chi: m.v.length - e + m.f.length }; };
  X.mesh.catmullClark = function (m) {
    var nV = m.v.length, F = m.f, P = m.v, i;
    var fp = F.map(function (f) { var s = [0, 0, 0]; f.forEach(function (k) { s = V.add(s, P[k]); }); return V.mul(s, 1 / f.length); });
    var ef = {}, keys = [];
    F.forEach(function (f, fi) { for (var j = 0; j < f.length; j++) { var a = f[j], b = f[(j + 1) % f.length]; var k = a < b ? a + "_" + b : b + "_" + a; if (!ef[k]) { ef[k] = { a: Math.min(a, b), b: Math.max(a, b), f: [] }; keys.push(k); } ef[k].f.push(fi); } });
    var eidx = {}; keys.forEach(function (k, j) { eidx[k] = nV + F.length + j; });
    var ep = keys.map(function (k) { var e = ef[k]; return e.f.length === 2 ? V.mul(V.add(V.add(P[e.a], P[e.b]), V.add(fp[e.f[0]], fp[e.f[1]])), .25) : V.mul(V.add(P[e.a], P[e.b]), .5); });
    var vf = [], ve = []; for (i = 0; i < nV; i++) { vf.push([]); ve.push([]); }
    F.forEach(function (f, fi) { f.forEach(function (k) { vf[k].push(fi); }); });
    keys.forEach(function (k) { ve[ef[k].a].push(k); ve[ef[k].b].push(k); });
    var nv = P.map(function (p, k) {
      var n = ve[k].length; if (!n) return p;
      var Fm = [0, 0, 0]; vf[k].forEach(function (fi) { Fm = V.add(Fm, fp[fi]); }); Fm = V.mul(Fm, 1 / vf[k].length);
      var Rm = [0, 0, 0]; ve[k].forEach(function (key) { Rm = V.add(Rm, V.mul(V.add(P[ef[key].a], P[ef[key].b]), .5)); }); Rm = V.mul(Rm, 1 / n);
      return V.mul(V.add(V.add(Fm, V.mul(Rm, 2)), V.mul(p, n - 3)), 1 / n);
    });
    var outV = nv.concat(fp).concat(ep), outF = [];
    F.forEach(function (f, fi) {
      var k = f.length;
      for (var j = 0; j < k; j++) {
        var a = f[(j - 1 + k) % k], b = f[j], c = f[(j + 1) % k];
        var e1 = eidx[a < b ? a + "_" + b : b + "_" + a], e2 = eidx[b < c ? b + "_" + c : c + "_" + b];
        outF.push([b, e2, nV + fi, e1]);
      }
    });
    return { v: outV, f: outF };
  };
  X.mesh.transform = function (m, M) { return { v: m.v.map(function (p) { return X.m.apply(M, p); }), f: m.f }; };
  X.mesh.normal = function (pts) {
    var n = [0, 0, 0];
    for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length]; n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); }
    return V.norm(n);
  };

  /* ---------------- egri çiziqlar ---------------- */
  X.bezier = function (P, t) {
    var Q = P.map(function (p) { return p.slice(); });
    for (var r = 1; r < P.length; r++) for (var i = 0; i < P.length - r; i++) Q[i] = Q[i].map(function (x, k) { return (1 - t) * x + t * Q[i + 1][k]; });
    return Q[0];
  };
  X.bernstein = function (n, i, t) {
    var c = 1; for (var k = 1; k <= i; k++) c = c * (n - k + 1) / k;
    return c * Math.pow(t, i) * Math.pow(1 - t, n - i);
  };
  X.basis = function (i, p, u, U) {
    if (p === 0) {
      if (U[i] <= u && u < U[i + 1]) return 1;
      if (u === U[U.length - 1] && U[i] < U[i + 1] && U[i + 1] === U[U.length - 1]) return 1;
      return 0;
    }
    var a = U[i + p] === U[i] ? 0 : (u - U[i]) / (U[i + p] - U[i]) * X.basis(i, p - 1, u, U);
    var b = U[i + p + 1] === U[i + 1] ? 0 : (U[i + p + 1] - u) / (U[i + p + 1] - U[i + 1]) * X.basis(i + 1, p - 1, u, U);
    return a + b;
  };
  X.nurbs = function (P, W, p, U, u) {
    var num = P[0].map(function () { return 0; }), den = 0;
    for (var i = 0; i < P.length; i++) { var b = X.basis(i, p, u, U) * (W ? W[i] : 1); den += b; for (var k = 0; k < num.length; k++) num[k] += b * P[i][k]; }
    return num.map(function (x) { return den ? x / den : 0; });
  };
  X.knots = function (n, p, kind) {
    // n — boşqaruv nuqtalari soni
    var m = n + p + 1, U = [], i;
    if (kind === "uniform") { for (i = 0; i < m; i++) U.push(i / (m - 1)); return U; }
    for (i = 0; i <= p; i++) U.push(0);
    var inner = n - p - 1;
    for (i = 1; i <= inner; i++) U.push(i / (inner + 1));
    for (i = 0; i <= p; i++) U.push(1);
    return U;
  };

  /* ---------------- 3D sahna (kamera + Canvas 2D renderer) ---------------- */
  X.Scene = function (canvas, opts) {
    opts = opts || {};
    var S = this;
    S.canvas = canvas; S.ctx = canvas.getContext("2d");
    S.yaw = opts.yaw != null ? opts.yaw : -0.9; S.pitch = opts.pitch != null ? opts.pitch : 0.45; S.dist = opts.dist || 6;
    S.target = opts.target || [0, 0, 0]; S.fov = opts.fov || 0.9; S.ortho = !!opts.ortho; S.zUp = opts.zUp !== false;
    S.light = V.norm(opts.light || [0.4, -0.7, 0.8]);
    S.items = []; S.onDraw = null; S.minDist = opts.minDist || 1.2; S.maxDist = opts.maxDist || 40;
    S.aspect = opts.aspect || 0.75;
    // ixtiyoriy (qöşimça): fon rangi va ekrandagi markaz (uluşda); standart — oq fon, markaz örtada
    S.bg = opts.bg || "#fff"; S.cx = opts.cx != null ? opts.cx : 0.5; S.cy = opts.cy != null ? opts.cy : 0.5;
    S.resize = function () {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var w = Math.max(200, r.width), h = Math.round(w * S.aspect);
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      S.w = w; S.h = h; S.dpr = dpr; S.draw();
    };
    S.eye = function () {
      var cp = Math.cos(S.pitch), sp = Math.sin(S.pitch), cy = Math.cos(S.yaw), sy = Math.sin(S.yaw);
      var off = S.zUp ? [S.dist * cp * cy, S.dist * cp * sy, S.dist * sp] : [S.dist * cp * cy, S.dist * sp, S.dist * cp * sy];
      return V.add(S.target, off);
    };
    S.basis = function () {
      var e = S.eye(), f = V.norm(V.sub(S.target, e)), up = S.zUp ? [0, 0, 1] : [0, 1, 0];
      var r = V.norm(V.cross(f, up)); if (V.len(r) < 1e-6) r = [1, 0, 0];
      var u = V.cross(r, f);
      return { e: e, f: f, r: r, u: u };
    };
    S.project = function (p, B) {
      B = B || S._B || S.basis();
      var d = V.sub(p, B.e), x = V.dot(d, B.r), y = V.dot(d, B.u), z = V.dot(d, B.f);
      var s = S.h / 2 / Math.tan(S.fov / 2);
      var k = S.ortho ? s / S.dist : s / Math.max(z, 0.01);
      return [S.w * S.cx + x * k, S.h * S.cy - y * k, z];
    };
    S.add = function (it) { S.items.push(it); return it; };
    S.clear = function () { S.items = []; };
    S.draw = function () {
      var c = S.ctx; if (!S.w) return;
      c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      c.clearRect(0, 0, S.w, S.h);
      c.fillStyle = S.bg; c.fillRect(0, 0, S.w, S.h);
      S._B = S.basis();
      var prims = [];
      S.items.forEach(function (it) { if (it.visible !== false) it.collect(S, prims); });
      prims.sort(function (a, b) { return b.z - a.z; });
      prims.forEach(function (p) { p.draw(c); });
      if (S.onDraw) S.onDraw(c, S);
    };
    // boşqaruv: aylantiriş, siljitiş, kattalaştiriş
    var pts = {}, last = null, pinch = null;
    canvas.addEventListener("pointerdown", function (e) { canvas.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; last = null; if (S.onPick && Object.keys(pts).length === 1) S._down = [e.clientX, e.clientY, Date.now()]; });
    canvas.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId]) return;
      var ids = Object.keys(pts);
      if (S.dragHandler && S.dragHandler(e, "move")) { pts[e.pointerId] = [e.clientX, e.clientY]; return; }
      if (ids.length === 1) {
        var p = pts[e.pointerId], dx = e.clientX - p[0], dy = e.clientY - p[1];
        if (e.buttons === 2 || e.shiftKey) { S.pan(dx, dy); } else { S.yaw -= dx * 0.008; S.pitch = Math.max(-1.55, Math.min(1.55, S.pitch + dy * 0.008)); }
        pts[e.pointerId] = [e.clientX, e.clientY]; S.draw();
      } else if (ids.length === 2) {
        pts[e.pointerId] = [e.clientX, e.clientY];
        var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) { S.dist = Math.max(S.minDist, Math.min(S.maxDist, S.dist * pinch / d)); S.draw(); }
        pinch = d;
      }
    });
    function up(e) {
      if (S.onPick && S._down && Object.keys(pts).length === 1) {
        var dd = Math.hypot(e.clientX - S._down[0], e.clientY - S._down[1]);
        if (dd < 6 && Date.now() - S._down[2] < 400) { var r = canvas.getBoundingClientRect(); S.onPick(e.clientX - r.left, e.clientY - r.top); }
      }
      if (S.dragHandler) S.dragHandler(e, "up");
      delete pts[e.pointerId]; pinch = null;
    }
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", function (e) { e.preventDefault(); S.dist = Math.max(S.minDist, Math.min(S.maxDist, S.dist * Math.exp(e.deltaY * 0.001))); S.draw(); }, { passive: false });
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    S.pan = function (dx, dy) {
      var B = S.basis(), k = S.dist / S.h * 1.2;
      S.target = V.add(S.target, V.add(V.mul(B.r, -dx * k), V.mul(B.u, dy * k)));
    };
    S.view = function (name) {
      var v = { top: [-Math.PI / 2, 1.5699], front: [-Math.PI / 2, 0], right: [0, 0], persp: [-0.9, 0.45] }[name];
      if (v) { S.yaw = v[0]; S.pitch = v[1]; S.draw(); }
    };
    new ResizeObserver(function () { S.resize(); }).observe(canvas);
  };

  /* ---- sahna elementlari ---- */
  function hex2rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  X.shade = function (rgb, k) { return "rgb(" + rgb.map(function (c) { return Math.round(Math.min(255, c * k)); }).join(",") + ")"; };
  // Mesh: {mesh:{v,f}, color, edge, alpha, faceColors, wire, points, flat}
  X.Mesh = function (o) { this.o = o; this.visible = true; };
  X.Mesh.prototype.collect = function (S, out) {
    var o = this.o, m = o.mesh, B = S._B, P = m.v.map(function (p) { return S.project(p, B); });
    var base = hex2rgb(o.color || "#C9D4F5"), L = S.light, eye = B.e;
    if (o.wire !== "only") m.f.forEach(function (f, fi) {
      var pts3 = f.map(function (k) { return m.v[k]; });
      var n = X.mesh.normal(pts3), cen = [0, 0, 0];
      pts3.forEach(function (p) { cen = V.add(cen, p); }); cen = V.mul(cen, 1 / f.length);
      var toEye = V.norm(V.sub(eye, cen)), facing = V.dot(n, toEye);
      if (facing < 0 && !o.twoSided) return;
      var nn = facing < 0 ? V.mul(n, -1) : n;
      var k = 0.42 + 0.58 * Math.max(0, V.dot(nn, L)) + 0.12 * Math.pow(Math.max(0, V.dot(V.norm(V.add(L, toEye)), nn)), 24);
      var col = o.faceColors && o.faceColors[fi] ? hex2rgb(o.faceColors[fi]) : base;
      var z = 0; f.forEach(function (kk) { z += P[kk][2]; }); z /= f.length;
      out.push({ z: z, draw: function (c) {
        c.beginPath(); f.forEach(function (kk, i) { var p = P[kk]; if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath();
        c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.fillStyle = X.shade(col, k); c.fill();
        if (o.edge !== false) { c.globalAlpha = 1; c.strokeStyle = o.edge || "rgba(43,58,103,.55)"; c.lineWidth = o.lw || 0.8; c.stroke(); }
        c.globalAlpha = 1;
      } });
    });
    // ixtiyoriy: siluet (faol obyekt) konturi — old va orqa yoqlar orasidagi qirralar
    if (o.outline) {
      if (!m._ef) { m._ef = {}; m.f.forEach(function (f, fi) { for (var i = 0; i < f.length; i++) { var a = f[i], b = f[(i + 1) % f.length], k = a < b ? a + "_" + b : b + "_" + a; (m._ef[k] = m._ef[k] || { a: a, b: b, f: [] }).f.push(fi); } }); }
      var fac = m.f.map(function (f) { var pts3 = f.map(function (k) { return m.v[k]; }), cen = [0, 0, 0]; pts3.forEach(function (p) { cen = V.add(cen, p); }); return V.dot(X.mesh.normal(pts3), V.sub(eye, V.mul(cen, 1 / f.length))) >= 0; });
      Object.keys(m._ef).forEach(function (k) {
        var e = m._ef[k]; if (e.f.length === 2 && fac[e.f[0]] === fac[e.f[1]]) return;
        var a = P[e.a], b = P[e.b];
        out.push({ z: -1e6, draw: function (c) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = o.outline; c.lineWidth = o.outlineW || 2.5; c.lineCap = "round"; c.stroke(); c.lineCap = "butt"; } });
      });
    }
    if (o.wire) X.mesh.edges(m).forEach(function (e) {
      var a = P[e[0]], b = P[e[1]];
      out.push({ z: (a[2] + b[2]) / 2 - (o.wire === "only" ? 0 : 0.001), draw: function (c) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = o.wireColor || "#2B3A67"; c.lineWidth = o.lw || 1; c.stroke(); } });
    });
    if (o.points) m.v.forEach(function (p, k) {
      var q = P[k];
      out.push({ z: q[2] - 0.01, draw: function (c) { c.beginPath(); c.arc(q[0], q[1], o.pointSize || 3, 0, 7); c.fillStyle = (o.pointColors && o.pointColors[k]) || o.pointColor || "#18202F"; c.fill(); } });
    });
  };
  // Polyline: {pts:[[x,y,z]...], color, lw, closed, dash}
  X.Line = function (o) { this.o = o; this.visible = true; };
  X.Line.prototype.collect = function (S, out) {
    var o = this.o, P = o.pts.map(function (p) { return S.project(p, S._B); });
    for (var i = 0; i < P.length - 1 + (o.closed ? 1 : 0); i++) (function (a, b) {
      out.push({ z: (a[2] + b[2]) / 2 - (o.front ? 1e6 : 0), draw: function (c) {
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = o.color || "#18202F"; c.lineWidth = o.lw || 2;
        c.setLineDash(o.dash || []); c.stroke(); c.setLineDash([]);
      } });
    })(P[i], P[(i + 1) % P.length]);
  };
  // Points with labels: {pts, color, r, labels}
  X.Points = function (o) { this.o = o; this.visible = true; };
  X.Points.prototype.collect = function (S, out) {
    var o = this.o;
    o.pts.forEach(function (p, i) {
      var q = S.project(p, S._B);
      out.push({ z: q[2] - (o.front ? 1e6 : 0.02), draw: function (c) {
        c.beginPath(); c.arc(q[0], q[1], o.r || 4, 0, 7); c.fillStyle = (o.colors && o.colors[i]) || o.color || "#18202F"; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = "#fff"; c.stroke();
        if (o.labels && o.labels[i]) { c.font = "600 12px Inter, system-ui, sans-serif"; c.fillStyle = "#18202F"; c.fillText(o.labels[i], q[0] + 7, q[1] - 7); }
      } });
    });
  };
  // Öqlar va tör
  X.Axes = function (o) { this.o = o || {}; this.visible = true; };
  X.Axes.prototype.collect = function (S, out) {
    var L = this.o.len || 1.5, zUp = S.zUp, lab = this.o.labels || ["X", "Y", "Z"];
    var dirs = zUp ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]] : [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
    var cols = ["#E5484D", "#2F9E6B", "#3E63DD"];
    var o = S.project([0, 0, 0], S._B);
    dirs.forEach(function (d, i) {
      var e = S.project(V.mul(d, L), S._B);
      out.push({ z: (o[2] + e[2]) / 2 - 0.05, draw: function (c) {
        c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(e[0], e[1]); c.strokeStyle = cols[i]; c.lineWidth = 3; c.stroke();
        c.font = "700 13px Inter, system-ui, sans-serif"; c.fillStyle = cols[i]; c.fillText(lab[i], e[0] + 4, e[1] - 4);
      } });
    });
  };
  X.Grid = function (o) { this.o = o || {}; this.visible = true; };
  X.Grid.prototype.collect = function (S, out) {
    if (this.o.fade || this.o.axisColors) return gridFancy(this.o, S, out);
    var n = this.o.n || 10, s = this.o.step || 0.5, h = n * s / 2, zUp = S.zUp;
    for (var i = 0; i <= n; i++) {
      var t = -h + i * s;
      var a1 = zUp ? [t, -h, 0] : [t, 0, -h], b1 = zUp ? [t, h, 0] : [t, 0, h];
      var a2 = zUp ? [-h, t, 0] : [-h, 0, t], b2 = zUp ? [h, t, 0] : [h, 0, t];
      [[a1, b1], [a2, b2]].forEach(function (seg) {
        var a = S.project(seg[0], S._B), b = S.project(seg[1], S._B);
        out.push({ z: 1e9, draw: function (c) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.strokeStyle = "rgba(24,32,47,.10)"; c.lineWidth = 1; c.stroke(); } });
      });
    }
  };

  // ixtiyoriy tör: {color, alpha, fade (markazdan uzoqlaşgan sari söniş), axisColors: [X, Y], lw}
  function gridFancy(o, S, out) {
    var n = o.n || 10, s = o.step || 0.5, h = n * s / 2, zUp = S.zUp, B = S._B;
    var col = hex2rgb(o.color || "#9AA3B2"), base = o.alpha == null ? 0.22 : o.alpha, segN = o.fade ? 14 : 1, lines = [];
    for (var i = 0; i <= n; i++) {
      var t = -h + i * s, ax = Math.abs(t) < 1e-9;
      lines.push({ a: [t, -h], b: [t, h], ax: ax ? 1 : -1 }, { a: [-h, t], b: [h, t], ax: ax ? 0 : -1 });
    }
    function w3(p) { return zUp ? [p[0], p[1], 0] : [p[0], 0, p[1]]; }
    out.push({ z: 1e9, draw: function (c) {
      c.lineWidth = o.lw || 1;
      lines.forEach(function (L) {
        var cc = L.ax >= 0 && o.axisColors ? o.axisColors[L.ax] : null;
        for (var k = 0; k < segN; k++) {
          var u0 = k / segN, u1 = (k + 1) / segN;
          var p0 = [L.a[0] + (L.b[0] - L.a[0]) * u0, L.a[1] + (L.b[1] - L.a[1]) * u0], p1 = [L.a[0] + (L.b[0] - L.a[0]) * u1, L.a[1] + (L.b[1] - L.a[1]) * u1];
          var q0 = S.project(w3(p0), B), q1 = S.project(w3(p1), B);
          if (q0[2] < 0.15 || q1[2] < 0.15) continue;
          var al = base;
          if (o.fade) al = base * Math.pow(Math.max(0, 1 - Math.hypot((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2) / h), 1.6);
          if (al < 0.008) continue;
          if (cc) { c.strokeStyle = cc; c.globalAlpha = Math.min(1, al / base * 0.85); }
          else { c.strokeStyle = "rgba(" + col.join(",") + "," + al.toFixed(3) + ")"; c.globalAlpha = 1; }
          c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke();
        }
      });
      c.globalAlpha = 1;
    } });
  }

  /* ---------------- 2D çizma (egri çiziqlar uçun) ---------------- */
  X.Plot = function (canvas, opts) {
    var P = this; opts = opts || {};
    P.canvas = canvas; P.ctx = canvas.getContext("2d");
    P.xr = opts.x || [-1, 7]; P.yr = opts.y || [-1, 5]; P.aspect = opts.aspect || 0.7; P.equal = opts.equal !== false;
    P.handles = []; P.onDraw = null; P.onDrag = null;
    P.resize = function () {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var w = Math.max(200, r.width), h = Math.round(w * P.aspect);
      canvas.style.height = h + "px"; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      P.w = w; P.h = h; P.dpr = dpr; P.fit(); P.draw();
    };
    P.fit = function () {
      var pad = 28, sx = (P.w - 2 * pad) / (P.xr[1] - P.xr[0]), sy = (P.h - 2 * pad) / (P.yr[1] - P.yr[0]);
      if (P.equal) { var s = Math.min(sx, sy); sx = sy = s; }
      P.sx = sx; P.sy = sy;
      P.ox = P.w / 2 - (P.xr[0] + P.xr[1]) / 2 * sx; P.oy = P.h / 2 + (P.yr[0] + P.yr[1]) / 2 * sy;
    };
    P.toS = function (p) { return [P.ox + p[0] * P.sx, P.oy - p[1] * P.sy]; };
    P.toW = function (x, y) { return [(x - P.ox) / P.sx, (P.oy - y) / P.sy]; };
    P.draw = function () {
      var c = P.ctx; if (!P.w) return;
      c.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);
      c.fillStyle = "#fff"; c.fillRect(0, 0, P.w, P.h);
      var x0 = Math.floor(P.toW(0, 0)[0]) - 1, x1 = Math.ceil(P.toW(P.w, 0)[0]) + 1, y0 = Math.floor(P.toW(0, P.h)[1]) - 1, y1 = Math.ceil(P.toW(0, 0)[1]) + 1;
      var step = opts.gridStep || 1;
      c.lineWidth = 1;
      for (var x = Math.ceil(x0 / step) * step; x <= x1; x += step) { var a = P.toS([x, 0]); c.strokeStyle = Math.abs(x) < 1e-9 ? "rgba(24,32,47,.35)" : "rgba(24,32,47,.07)"; c.beginPath(); c.moveTo(a[0], 0); c.lineTo(a[0], P.h); c.stroke(); }
      for (var y = Math.ceil(y0 / step) * step; y <= y1; y += step) { var b = P.toS([0, y]); c.strokeStyle = Math.abs(y) < 1e-9 ? "rgba(24,32,47,.35)" : "rgba(24,32,47,.07)"; c.beginPath(); c.moveTo(0, b[1]); c.lineTo(P.w, b[1]); c.stroke(); }
      if (P.onDraw) P.onDraw(c, P);
      P.handles.forEach(function (h, i) {
        if (h.hidden) return;
        var s = P.toS(h.p);
        c.beginPath(); c.arc(s[0], s[1], h.r || 7, 0, 7); c.fillStyle = "#fff"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = h.color || "#18202F"; c.stroke();
        if (h.label) { c.font = "600 13px Inter, system-ui, sans-serif"; c.fillStyle = "#18202F"; c.fillText(h.label, s[0] + 9, s[1] - 9); }
      });
    };
    P.line = function (pts, color, lw, dash) {
      var c = P.ctx; c.beginPath(); pts.forEach(function (p, i) { var s = P.toS(p); if (i) c.lineTo(s[0], s[1]); else c.moveTo(s[0], s[1]); });
      c.strokeStyle = color || "#18202F"; c.lineWidth = lw || 2.5; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]);
    };
    P.dot = function (p, color, r, label) {
      var c = P.ctx, s = P.toS(p); c.beginPath(); c.arc(s[0], s[1], r || 4, 0, 7); c.fillStyle = color || "#18202F"; c.fill();
      if (label) { c.font = "600 12px Inter, system-ui, sans-serif"; c.fillStyle = color || "#18202F"; c.fillText(label, s[0] + 7, s[1] - 7); }
    };
    P.text = function (p, txt, color, dx, dy) { var c = P.ctx, s = P.toS(p); c.font = "600 12px Inter, system-ui, sans-serif"; c.fillStyle = color || "#18202F"; c.fillText(txt, s[0] + (dx || 0), s[1] + (dy || 0)); };
    var drag = null;
    canvas.addEventListener("pointerdown", function (e) {
      var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = -1, bd = 26;
      P.handles.forEach(function (h, i) { if (h.hidden || h.fixed) return; var s = P.toS(h.p), d = Math.hypot(s[0] - x, s[1] - y); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { drag = best; canvas.setPointerCapture(e.pointerId); if (P.onSelect) P.onSelect(best); }
    });
    canvas.addEventListener("pointermove", function (e) {
      if (drag == null) return;
      var r = canvas.getBoundingClientRect(), w = P.toW(e.clientX - r.left, e.clientY - r.top);
      var h = P.handles[drag];
      h.p = [Math.round(w[0] * 20) / 20, Math.round(w[1] * 20) / 20];
      if (P.onDrag) P.onDrag(drag, h.p);
      P.draw();
    });
    canvas.addEventListener("pointerup", function () { drag = null; });
    canvas.style.touchAction = "none";
    new ResizeObserver(function () { P.resize(); }).observe(canvas);
  };
})();
