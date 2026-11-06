/*
 * Expert platformasi — umumiy mantiq (engine).
 * Bir xil kod ikki muhitda işlaydi:
 *   1) Google Apps Script (Code.gs ga yiğiladi) — haqiqiy baza: Google Sheets;
 *   2) brauzer (demo rejim) — baza: localStorage.
 * Muhit `env` obyekti orqali beriladi: { store, now, uuid, sha256, cache, lock }.
 */
var EXPERT_VERSION = "1.0.0";

var TABLES = {
  talabalar: ["id", "fio", "guruh", "hemis", "faol", "qoshilgan"],
  darslar: ["id", "guruh", "mavzu", "sana", "boshlanish", "bosqich", "kod", "savollar", "ochilgan", "tugash", "holat", "yaratilgan", "bosqichlar"],
  javoblar: ["id", "darsId", "mavzu", "bosqich", "talabaId", "qurilma", "vaqt", "javoblar", "ball", "max", "tekshirilgan", "baholar", "ishonch"],
  davomat: ["id", "sana", "guruh", "darsId", "talabaId", "holat", "kechikish", "manba", "izoh", "vaqt"],
  savollar: ["id", "mavzu", "bosqich", "tur", "savol", "variantlar", "javob", "ball", "tolerans", "kalitlar", "izoh", "faol"],
  sozlamalar: ["kalit", "qiymat"]
};

var STAGE_TITLES = { A: "Tezkor test", B: "Nazariy savol", C: "Amaliy masala" };
var DEFAULT_PICK = { A: 5, B: 1, C: 2 };

/* ------------------------------------------------------------------ yordamçilar */
function _norm(s) {
  // Kalit sözlarni solişlirişda eski va yangi alifbolarni tenglaştiradi.
  return String(s || "").toLowerCase()
    .replace(/o[‘'ʻ’`]/g, "ö").replace(/g[‘'ʻ’`]/g, "ğ")
    .replace(/sh/g, "ş").replace(/ch/g, "ç")
    .replace(/[ʼ’'`‘ʻ]/g, "")
    .replace(/\s+/g, " ").trim();
}
function _num(v) {
  if (typeof v === "number") return v;
  var s = String(v == null ? "" : v).trim().replace(/\s/g, "").replace(",", ".").replace("−", "-");
  if (s === "") return NaN;
  return Number(s);
}
function _json(v, d) {
  if (v === "" || v == null) return d;
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch (e) { return d; }
}
function _rng(seedStr) {
  // Deterministik tasodifiy sonlar (mulberry32) — har talaba uçun barqaror aralaştiriş.
  var h = 1779033703 ^ seedStr.length;
  for (var i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  var a = h >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function _shuffle(arr, rnd) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rnd() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function _today(env) {
  var d = new Date(env.now());
  // Toşkent vaqti (UTC+5)
  var t = new Date(d.getTime() + 5 * 3600 * 1000);
  return t.toISOString().slice(0, 10);
}
function _hhmm(env) {
  var t = new Date(env.now() + 5 * 3600 * 1000);
  return t.toISOString().slice(11, 16);
}
function _minutes(hhmm) {
  var p = String(hhmm || "").split(":");
  if (p.length < 2) return null;
  return Number(p[0]) * 60 + Number(p[1]);
}
function _err(msg, code) { return { ok: false, error: msg, code: code || "ERR" }; }
function _ok(obj) { obj = obj || {}; obj.ok = true; return obj; }

/* ------------------------------------------------------------------ sozlamalar */
function getSetting(env, key, dflt) {
  var rows = env.store.all("sozlamalar");
  for (var i = 0; i < rows.length; i++) if (rows[i].kalit === key) return rows[i].qiymat;
  return dflt;
}
function setSetting(env, key, value) {
  var rows = env.store.all("sozlamalar");
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].kalit === key) { env.store.update("sozlamalar", "kalit", key, { qiymat: value }); return; }
  }
  env.store.insert("sozlamalar", { kalit: key, qiymat: value });
}
function settings(env) {
  return {
    birBall: getSetting(env, "birBall", "1") === "1",            // har bir töğri javob = 1 ball
    natijaKorsat: getSetting(env, "natijaKorsat", "ball"),       // "yoq" | "ball" | "toliq"
    kechikishChegarasi: Number(getSetting(env, "kechikishChegarasi", "5")), // daqiqa
    kodTalab: getSetting(env, "kodTalab", "1") === "1",
    universitet: getSetting(env, "universitet", "TATU"),
    fan: getSetting(env, "fan", "3D modellaştiriş texnologiyalari")
  };
}

/* ------------------------------------------------------------------ savollar */
function questionFromRow(r) {
  return {
    id: String(r.id), mavzu: Number(r.mavzu), bosqich: String(r.bosqich), tur: String(r.tur),
    savol: String(r.savol), variantlar: _json(r.variantlar, []), javob: _json(r.javob, null),
    ball: Number(r.ball || 1), tolerans: Number(r.tolerans || 0), kalitlar: _json(r.kalitlar, []),
    izoh: String(r.izoh || ""), faol: String(r.faol) !== "0"
  };
}
function publicQuestion(q, rnd) {
  // Talabaga javobsiz körinişda; variantlar aralaştiriladi (asl indekslar saqlanadi).
  var o = { id: q.id, tur: q.tur, savol: q.savol, ball: q.ball };
  if (q.tur === "single" || q.tur === "multi") {
    var idx = q.variantlar.map(function (_, i) { return i; });
    idx = _shuffle(idx, rnd);
    o.variantlar = idx.map(function (i) { return { i: i, t: q.variantlar[i] }; });
  } else if (q.tur === "order") {
    var idx2 = _shuffle(q.variantlar.map(function (_, i) { return i; }), rnd);
    o.variantlar = idx2.map(function (i) { return { i: i, t: q.variantlar[i] }; });
  }
  return o;
}
function scoreItem(q, ans, oneEach) {
  var max = oneEach ? 1 : q.ball;
  var s = 0, auto = true;
  if (ans === undefined || ans === null || ans === "") return { s: 0, max: max, auto: q.tur !== "open" };
  if (q.tur === "single") {
    s = Number(ans) === Number(q.javob) ? max : 0;
  } else if (q.tur === "multi") {
    var right = (q.javob || []).map(Number), pick = (ans || []).map(Number);
    var good = pick.filter(function (x) { return right.indexOf(x) >= 0; }).length;
    var bad = pick.length - good;
    s = Math.max(0, (good - bad) / Math.max(1, right.length)) * max;
  } else if (q.tur === "numeric") {
    var x = _num(ans), a = Number(q.javob);
    s = (!isNaN(x) && Math.abs(x - a) <= (q.tolerans || 1e-9) + 1e-12) ? max : 0;
  } else if (q.tur === "order") {
    var ra = (q.javob || []).map(Number), pa = (ans || []).map(Number);
    var c = 0;
    for (var i = 0; i < ra.length; i++) if (pa[i] === ra[i]) c++;
    s = (c === ra.length) ? max : Math.floor((c / ra.length) * max * 2) / 2;
  } else if (q.tur === "open") {
    auto = false;
    var txt = _norm(ans), keys = (q.kalitlar || []).map(_norm).filter(Boolean);
    if (keys.length) {
      var hit = keys.filter(function (k) { return txt.indexOf(k) >= 0; }).length;
      s = Math.round((hit / keys.length) * max * 2) / 2;
    }
  }
  return { s: Math.round(s * 100) / 100, max: max, auto: auto };
}

/* ------------------------------------------------------------------ admin autentifikatsiya */
function _requireAdmin(env, p) {
  if (!p || !p.token) return false;
  return env.cache.get("tok_" + p.token) === "1";
}

/* ------------------------------------------------------------------ amallar */
var ACTIONS = {};

ACTIONS.ping = function (env) {
  var s = settings(env);
  return _ok({ name: "Expert API", version: EXPERT_VERSION, fan: s.fan, sozlangan: !!getSetting(env, "parol", "") });
};

/* ---------- talaba amallari ---------- */
ACTIONS.s_join = function (env, p) {
  var topic = Number(p.mavzu), sid = String(p.talabaId || "").trim();
  if (!topic || !sid) return _err("Talaba ID va mavzu kerak", "BAD");
  var st = env.store.find("talabalar", "id", sid);
  if (!st || String(st.faol) === "0") return _err("Bunday ID topilmadi. ID ni tekşiring yoki öqituvçiga murojaat qiling.", "NO_STUDENT");
  var lessons = env.store.all("darslar").filter(function (d) {
    return Number(d.mavzu) === topic && d.holat === "faol" && String(d.guruh) === String(st.guruh) && d.bosqich;
  });
  if (!lessons.length) return _err("Hozir bu mavzu böyiça faol topşiriq yöq. Öqituvçi boşlaşini kuting.", "NO_SESSION");
  var d = lessons[lessons.length - 1];
  var s = settings(env);
  if (s.kodTalab && String(p.kod || "").trim() !== String(d.kod)) return _err("Sessiya kodi notöğri. Ekrandagi 4 xonali kodni kiriting.", "BAD_CODE");
  var now = env.now();
  if (d.tugash && now > Number(d.tugash) + 15000) return _err("Bu bosqiç vaqti tugadi.", "CLOSED");
  // Davomat: QR orqali avtomatik belgilaş
  _autoAttendance(env, d, st);
  // Avval javob berganmi?
  var prev = env.store.all("javoblar").filter(function (r) {
    return r.darsId === d.id && r.bosqich === d.bosqich && r.talabaId === sid;
  });
  var ids = _json(d.savollar, []);
  var bank = env.store.all("savollar").map(questionFromRow);
  var byId = {}; bank.forEach(function (q) { byId[q.id] = q; });
  var rnd = _rng(sid + "|" + d.id + "|" + d.bosqich);
  var qs = ids.map(function (id) { return byId[id]; }).filter(Boolean).map(function (q) { return publicQuestion(q, rnd); });
  return _ok({
    dars: { id: d.id, mavzu: topic, bosqich: d.bosqich, nom: STAGE_TITLES[d.bosqich] || d.bosqich, tugash: d.tugash ? Number(d.tugash) : null },
    talaba: { id: st.id, fio: st.fio, guruh: st.guruh },
    savollar: qs,
    javobBergan: prev.length > 0,
    serverVaqt: now
  });
};

function _autoAttendance(env, d, st) {
  var all = env.store.all("davomat");
  for (var i = 0; i < all.length; i++) {
    if (all[i].darsId === d.id && all[i].talabaId === st.id) return;
  }
  var s = settings(env);
  var start = _minutes(d.boshlanish), nowm = _minutes(_hhmm(env));
  var late = 0;
  if (start != null && nowm != null && d.sana === _today(env)) late = Math.max(0, nowm - start);
  var holat = late > s.kechikishChegarasi ? "kech" : "keldi";
  env.store.insert("davomat", {
    id: env.uuid(), sana: d.sana, guruh: d.guruh, darsId: d.id, talabaId: st.id,
    holat: holat, kechikish: holat === "kech" ? late : 0, manba: "QR", izoh: "", vaqt: env.now()
  });
}

ACTIONS.s_submit = function (env, p) {
  var sid = String(p.talabaId || "").trim();
  var d = env.store.find("darslar", "id", String(p.darsId || ""));
  if (!d || d.holat !== "faol" || d.bosqich !== p.bosqich) return _err("Bosqiç yopilgan yoki topilmadi.", "CLOSED");
  if (d.tugash && env.now() > Number(d.tugash) + 15000) return _err("Bu bosqiç vaqti tugadi.", "CLOSED");
  var st = env.store.find("talabalar", "id", sid);
  if (!st) return _err("Talaba topilmadi", "NO_STUDENT");
  var s = settings(env);
  if (s.kodTalab && String(p.kod || "").trim() !== String(d.kod)) return _err("Sessiya kodi notöğri.", "BAD_CODE");
  var prev = env.store.all("javoblar").filter(function (r) {
    return r.darsId === d.id && r.bosqich === d.bosqich && r.talabaId === sid;
  });
  if (prev.length) return _err("Siz bu bosqiçda javob bergansiz.", "DUP");
  var ids = _json(d.savollar, []);
  var bank = env.store.all("savollar").map(questionFromRow);
  var byId = {}; bank.forEach(function (q) { byId[q.id] = q; });
  var answers = p.javoblar || {};
  var total = 0, max = 0, marks = {}, needs = false;
  ids.forEach(function (id) {
    var q = byId[id]; if (!q) return;
    var r = scoreItem(q, answers[id], s.birBall);
    marks[id] = r.s; total += r.s; max += r.max; if (!r.auto) needs = true;
  });
  env.store.insert("javoblar", {
    id: env.uuid(), darsId: d.id, mavzu: d.mavzu, bosqich: d.bosqich, talabaId: sid,
    qurilma: String(p.qurilma || ""), vaqt: env.now(), javoblar: JSON.stringify(answers),
    ball: Math.round(total * 100) / 100, max: max, tekshirilgan: needs ? "0" : "1",
    baholar: JSON.stringify(marks), ishonch: JSON.stringify(p.ishonch || {})
  });
  var out = { qabul: true };
  if (s.natijaKorsat !== "yoq") { out.ball = Math.round(total * 100) / 100; out.max = max; out.tekshiriladi = needs; }
  return _ok(out);
};

ACTIONS.s_feedback = function (env, p) {
  // Bosqiç yopilgandan keyin: talabaga töğri javoblar va izohlar (sozlamaga qarab).
  var s = settings(env);
  if (s.natijaKorsat !== "toliq") return _err("Öqituvçi javoblarni körsatişni yoqmagan.", "HIDDEN");
  var d = env.store.find("darslar", "id", String(p.darsId || ""));
  if (!d) return _err("Dars topilmadi", "NO");
  var stages = _json(d.bosqichlar, {});
  var st = stages[p.bosqich];
  if (!st || !st.yopilgan) return _err("Bosqiç hali yopilmagan.", "OPEN");
  var mine = env.store.all("javoblar").filter(function (r) {
    return r.darsId === d.id && r.bosqich === p.bosqich && r.talabaId === String(p.talabaId);
  })[0];
  var bank = env.store.all("savollar").map(questionFromRow);
  var byId = {}; bank.forEach(function (q) { byId[q.id] = q; });
  var items = (st.savollar || []).map(function (id) {
    var q = byId[id]; if (!q) return null;
    return { id: id, savol: q.savol, tur: q.tur, variantlar: q.variantlar, javob: q.javob, izoh: q.izoh,
      sizning: mine ? _json(mine.javoblar, {})[id] : null, ball: mine ? _json(mine.baholar, {})[id] : null };
  }).filter(Boolean);
  return _ok({ items: items });
};

/* ---------- admin: kiriş ---------- */
ACTIONS.a_setup = function (env, p) {
  if (getSetting(env, "parol", "")) return _err("Parol allaqaçon örnatilgan", "EXISTS");
  if (!p.parol || String(p.parol).length < 6) return _err("Parol kamida 6 belgidan iborat bölsin", "WEAK");
  setSetting(env, "parol", env.sha256("expert:" + p.parol));
  return ACTIONS.a_login(env, p);
};
ACTIONS.a_login = function (env, p) {
  var h = getSetting(env, "parol", "");
  if (!h) return _err("Avval parol örnating", "NO_SETUP");
  if (env.sha256("expert:" + String(p.parol || "")) !== h) return _err("Parol notöğri", "BAD_PASS");
  var tok = env.uuid() + env.uuid();
  env.cache.put("tok_" + tok, "1", 21600);
  return _ok({ token: tok, sozlamalar: settings(env) });
};
ACTIONS.a_password = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  if (!p.yangi || String(p.yangi).length < 6) return _err("Parol kamida 6 belgi", "WEAK");
  setSetting(env, "parol", env.sha256("expert:" + p.yangi));
  return _ok({});
};
ACTIONS.a_settings = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var allowed = ["birBall", "natijaKorsat", "kechikishChegarasi", "kodTalab", "universitet", "fan"];
  if (p.set) for (var k in p.set) if (allowed.indexOf(k) >= 0) setSetting(env, k, String(p.set[k]));
  return _ok({ sozlamalar: settings(env) });
};

/* ---------- admin: talabalar ---------- */
function _newStudentId(env, used) {
  for (var t = 0; t < 1000; t++) {
    var n = String(100000 + Math.floor(Math.random() * 900000));
    if (!used[n]) { used[n] = 1; return n; }
  }
  throw new Error("ID yaratib bölmadi");
}
ACTIONS.a_students = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  return _ok({ talabalar: env.store.all("talabalar") });
};
ACTIONS.a_students_add = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var rows = p.rows || [];
  var used = {};
  env.store.all("talabalar").forEach(function (r) { used[r.id] = 1; });
  var added = [], skipped = 0;
  var existing = env.store.all("talabalar");
  rows.forEach(function (r) {
    var fio = String(r.fio || "").trim().replace(/\s+/g, " ");
    var guruh = String(r.guruh || "").trim();
    if (!fio || !guruh) { skipped++; return; }
    var dup = existing.filter(function (e) { return _norm(e.fio) === _norm(fio) && String(e.guruh) === guruh; });
    if (dup.length) { skipped++; return; }
    var id = r.id && !used[String(r.id)] ? String(r.id) : _newStudentId(env, used);
    used[id] = 1;
    var row = { id: id, fio: fio, guruh: guruh, hemis: String(r.hemis || ""), faol: "1", qoshilgan: _today(env) };
    env.store.insert("talabalar", row);
    existing.push(row);
    added.push(row);
  });
  return _ok({ qoshildi: added, otkazib: skipped });
};
ACTIONS.a_students_update = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var patch = {};
  ["fio", "guruh", "hemis", "faol"].forEach(function (k) { if (p.patch && k in p.patch) patch[k] = String(p.patch[k]); });
  env.store.update("talabalar", "id", String(p.id), patch);
  return _ok({});
};
ACTIONS.a_students_delete = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  (p.ids || []).forEach(function (id) { env.store.remove("talabalar", "id", String(id)); });
  return _ok({});
};

/* ---------- admin: darslar va jonli sessiya ---------- */
ACTIONS.a_lessons = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  return _ok({ darslar: env.store.all("darslar") });
};
ACTIONS.a_lesson_create = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  if (!p.guruh || !p.mavzu) return _err("Guruh va mavzu kerak", "BAD");
  var row = {
    id: env.uuid().slice(0, 8), guruh: String(p.guruh), mavzu: Number(p.mavzu),
    sana: p.sana || _today(env), boshlanish: p.boshlanish || _hhmm(env), bosqich: "", kod: "",
    savollar: "[]", ochilgan: "", tugash: "", holat: "faol", yaratilgan: env.now(), bosqichlar: "{}"
  };
  env.store.insert("darslar", row);
  return _ok({ dars: row });
};
ACTIONS.a_stage_open = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var d = env.store.find("darslar", "id", String(p.darsId));
  if (!d) return _err("Dars topilmadi", "NO");
  var stage = String(p.bosqich || "A");
  var bank = env.store.all("savollar").map(questionFromRow).filter(function (q) {
    return q.mavzu === Number(d.mavzu) && q.bosqich === stage && q.faol;
  });
  if (!bank.length) return _err("Bu mavzu va bosqiç uçun savollar bankda yöq. Avval bankni yuklang.", "NO_BANK");
  var pick = Number(p.soni || DEFAULT_PICK[stage] || 3);
  var ids;
  if (p.savollar && p.savollar.length) ids = p.savollar.map(String);
  else ids = _shuffle(bank.map(function (q) { return q.id; }), _rng(String(env.now()))).slice(0, pick);
  var code = String(1000 + Math.floor(Math.random() * 9000));
  var now = env.now();
  var tug = p.daqiqa ? now + Number(p.daqiqa) * 60000 : "";
  var stages = _json(d.bosqichlar, {});
  stages[stage] = { savollar: ids, ochilgan: now, tugash: tug, yopilgan: false, kod: code };
  env.store.update("darslar", "id", d.id, {
    bosqich: stage, kod: code, savollar: JSON.stringify(ids), ochilgan: now, tugash: tug, holat: "faol",
    bosqichlar: JSON.stringify(stages)
  });
  return _ok({ kod: code, savollar: ids, tugash: tug });
};
ACTIONS.a_stage_close = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var d = env.store.find("darslar", "id", String(p.darsId));
  if (!d) return _err("Dars topilmadi", "NO");
  var stages = _json(d.bosqichlar, {});
  if (d.bosqich && stages[d.bosqich]) stages[d.bosqich].yopilgan = true;
  env.store.update("darslar", "id", d.id, { bosqich: "", kod: "", tugash: "", bosqichlar: JSON.stringify(stages) });
  return _ok({});
};
ACTIONS.a_lesson_finish = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  ACTIONS.a_stage_close(env, p);
  env.store.update("darslar", "id", String(p.darsId), { holat: "yakunlangan" });
  return _ok({});
};
ACTIONS.a_lesson_delete = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  env.store.remove("darslar", "id", String(p.darsId));
  return _ok({});
};
ACTIONS.a_live = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var d = env.store.find("darslar", "id", String(p.darsId));
  if (!d) return _err("Dars topilmadi", "NO");
  var stage = p.bosqich || d.bosqich;
  var stages = _json(d.bosqichlar, {});
  var ids = stage && stages[stage] ? stages[stage].savollar : [];
  var resp = env.store.all("javoblar").filter(function (r) { return r.darsId === d.id && (!stage || r.bosqich === stage); });
  var att = env.store.all("davomat").filter(function (r) { return r.darsId === d.id; });
  var groupSize = env.store.all("talabalar").filter(function (s) { return String(s.guruh) === String(d.guruh) && String(s.faol) !== "0"; }).length;
  var bank = env.store.all("savollar").map(questionFromRow);
  var byId = {}; bank.forEach(function (q) { byId[q.id] = q; });
  var stats = (ids || []).map(function (id) {
    var q = byId[id] || { variantlar: [], tur: "?" };
    var counts = (q.variantlar || []).map(function () { return 0; });
    var right = 0, n = 0, sum = 0;
    resp.forEach(function (r) {
      var a = _json(r.javoblar, {})[id];
      var m = _json(r.baholar, {})[id];
      if (a === undefined) return;
      n++;
      if (q.tur === "single" && counts[Number(a)] !== undefined) counts[Number(a)]++;
      if (q.tur === "multi" && a && a.forEach) a.forEach(function (x) { if (counts[x] !== undefined) counts[x]++; });
      if (m != null) { sum += Number(m); if (Number(m) > 0 && Number(m) >= (settings(env).birBall ? 1 : q.ball)) right++; }
    });
    return { id: id, savol: q.savol, tur: q.tur, variantlar: q.variantlar, javob: q.javob, izoh: q.izoh,
      soni: n, togri: right, foiz: n ? Math.round(100 * right / n) : 0, sanoq: counts };
  });
  var devices = {};
  resp.forEach(function (r) { if (!r.qurilma) return; (devices[r.qurilma] = devices[r.qurilma] || []).push(r.talabaId); });
  var shubha = [];
  for (var k in devices) if (devices[k].length > 1) shubha.push(devices[k]);
  return _ok({
    dars: d, guruhSoni: groupSize, kirgan: att.length, javobBergan: resp.length,
    statistika: stats, shubhali: shubha, serverVaqt: env.now()
  });
};

/* ---------- admin: javoblar va qölda baholaş ---------- */
ACTIONS.a_responses = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var rows = env.store.all("javoblar").filter(function (r) { return !p.darsId || r.darsId === p.darsId; });
  return _ok({ javoblar: rows });
};
ACTIONS.a_grade = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var r = env.store.find("javoblar", "id", String(p.id));
  if (!r) return _err("Topilmadi", "NO");
  var marks = _json(r.baholar, {});
  if (p.savolId != null) marks[String(p.savolId)] = Number(p.ball);
  var total = 0; for (var k in marks) total += Number(marks[k] || 0);
  env.store.update("javoblar", "id", r.id, { baholar: JSON.stringify(marks), ball: Math.round(total * 100) / 100, tekshirilgan: "1" });
  return _ok({ ball: total });
};

/* ---------- admin: davomat ---------- */
ACTIONS.a_attendance = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var rows = env.store.all("davomat").filter(function (r) {
    return (!p.guruh || String(r.guruh) === String(p.guruh)) && (!p.sana || r.sana === p.sana) && (!p.darsId || r.darsId === p.darsId);
  });
  return _ok({ davomat: rows });
};
ACTIONS.a_attendance_set = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var all = env.store.all("davomat");
  (p.rows || []).forEach(function (r) {
    var existing = all.filter(function (a) {
      return a.talabaId === String(r.talabaId) && a.sana === p.sana && String(a.guruh) === String(p.guruh) &&
        (p.darsId ? a.darsId === p.darsId : true);
    })[0];
    var row = {
      holat: r.holat, kechikish: r.holat === "kech" ? Number(r.kechikish || 0) : 0,
      izoh: String(r.izoh || ""), manba: existing && existing.manba === "QR" ? "QR+qölda" : "qölda"
    };
    if (existing) env.store.update("davomat", "id", existing.id, row);
    else {
      row.id = env.uuid(); row.sana = p.sana; row.guruh = String(p.guruh); row.darsId = p.darsId || "";
      row.talabaId = String(r.talabaId); row.vaqt = env.now();
      env.store.insert("davomat", row);
    }
  });
  return _ok({});
};

/* ---------- admin: jurnal (ballar) ---------- */
ACTIONS.a_gradebook = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var students = env.store.all("talabalar").filter(function (s) { return !p.guruh || String(s.guruh) === String(p.guruh); });
  var resp = env.store.all("javoblar");
  var lessons = env.store.all("darslar");
  var lessonTopic = {}; lessons.forEach(function (d) { lessonTopic[d.id] = Number(d.mavzu); });
  var att = env.store.all("davomat");
  var table = students.map(function (s) {
    var byTopic = {}, total = 0, maxTotal = 0;
    resp.forEach(function (r) {
      if (r.talabaId !== s.id) return;
      var t = lessonTopic[r.darsId] || Number(r.mavzu);
      byTopic[t] = (byTopic[t] || 0) + Number(r.ball || 0);
      total += Number(r.ball || 0); maxTotal += Number(r.max || 0);
    });
    var a = att.filter(function (x) { return x.talabaId === s.id; });
    var keldi = a.filter(function (x) { return x.holat === "keldi"; }).length;
    var kech = a.filter(function (x) { return x.holat === "kech"; }).length;
    var kelmadi = a.filter(function (x) { return x.holat === "kelmadi"; }).length;
    var kechMin = a.reduce(function (z, x) { return z + (x.holat === "kech" ? Number(x.kechikish || 0) : 0); }, 0);
    return { id: s.id, fio: s.fio, guruh: s.guruh, mavzular: byTopic, jami: Math.round(total * 100) / 100,
      maxJami: maxTotal, keldi: keldi, kech: kech, kelmadi: kelmadi, kechDaqiqa: kechMin };
  });
  return _ok({ jurnal: table });
};

/* ---------- admin: savollar banki ---------- */
ACTIONS.a_bank = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var rows = env.store.all("savollar").map(questionFromRow).filter(function (q) { return !p.mavzu || q.mavzu === Number(p.mavzu); });
  return _ok({ savollar: rows });
};
ACTIONS.a_bank_upload = function (env, p) {
  if (!_requireAdmin(env, p)) return _err("Ruxsat yöq", "AUTH");
  var list = p.savollar || [];
  var existing = {};
  env.store.all("savollar").forEach(function (r) { existing[String(r.id)] = 1; });
  var add = [], upd = 0;
  list.forEach(function (q) {
    var row = {
      id: String(q.id), mavzu: Number(q.mavzu), bosqich: String(q.bosqich), tur: String(q.tur), savol: String(q.savol),
      variantlar: JSON.stringify(q.variantlar || []), javob: JSON.stringify(q.javob), ball: Number(q.ball || 1),
      tolerans: Number(q.tolerans || 0), kalitlar: JSON.stringify(q.kalitlar || []), izoh: String(q.izoh || ""), faol: "1"
    };
    if (existing[row.id]) { env.store.update("savollar", "id", row.id, row); upd++; }
    else add.push(row);
  });
  if (add.length) env.store.insertMany("savollar", add);
  return _ok({ qoshildi: add.length, yangilandi: upd });
};

/* ------------------------------------------------------------------ dispatcher */
var WRITE_ACTIONS = ["s_join", "s_submit", "a_setup", "a_password", "a_settings", "a_students_add", "a_students_update",
  "a_students_delete", "a_lesson_create", "a_stage_open", "a_stage_close", "a_lesson_finish", "a_lesson_delete",
  "a_grade", "a_attendance_set", "a_bank_upload"];

function handleAction(env, action, payload) {
  var fn = ACTIONS[action];
  if (!fn) return _err("Nomaʼlum amal: " + action, "UNKNOWN");
  try {
    if (WRITE_ACTIONS.indexOf(action) >= 0 && env.lock) return env.lock(function () { return fn(env, payload || {}); });
    return fn(env, payload || {});
  } catch (e) {
    return _err("Server xatosi: " + (e && e.message ? e.message : e), "EXC");
  }
}

if (typeof module !== "undefined") {
  module.exports = { handleAction: handleAction, TABLES: TABLES, scoreItem: scoreItem, _norm: _norm, _num: _num };
}
