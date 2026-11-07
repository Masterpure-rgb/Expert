/* ===================================================================
 * Google Apps Script adapteri: baza — ushbu Google Sheets jadvali.
 * Bu fayl engine.js bilan birlaştirilib Code.gs hosil qilinadi.
 * =================================================================== */

var _SS_CACHE_ = null;
function _ss_() {
  // Skript jadvalga biriktirilgan bölsa — öşa jadval; aks holda bir marta yangi jadval yaratiladi va ID saqlanadi.
  if (_SS_CACHE_) return _SS_CACHE_;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var props = PropertiesService.getScriptProperties(), id = props.getProperty("SS_ID");
    if (id) ss = SpreadsheetApp.openById(id);
    else { ss = SpreadsheetApp.create("Expert — 3D modellaştiriş bazasi"); props.setProperty("SS_ID", ss.getId()); }
  }
  _SS_CACHE_ = ss;
  return ss;
}

function _sheet_(name) {
  var ss = _ss_();
  var sh = ss.getSheetByName(name);
  var cols = TABLES[name];
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, sh.getMaxRows(), Math.max(cols.length, 1)).setNumberFormat("@");
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold").setBackground("#E8EDFB");
    sh.setFrozenRows(1);
  }
  return sh;
}

function _cell_(v) {
  if (v === null || v === undefined) return "";
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, "Asia/Tashkent", "yyyy-MM-dd");
  }
  return String(v);
}

var SheetStore = {
  _c: {},
  _invalidate: function (t) { delete this._c[t]; },
  all: function (t) {
    if (this._c[t]) return this._c[t];
    var sh = _sheet_(t), cols = TABLES[t], n = sh.getLastRow();
    if (n < 2) { this._c[t] = []; return this._c[t]; }
    var vals = sh.getRange(2, 1, n - 1, cols.length).getValues();
    var rows = [];
    for (var i = 0; i < vals.length; i++) {
      var o = { _row: i + 2 };
      for (var j = 0; j < cols.length; j++) o[cols[j]] = _cell_(vals[i][j]);
      if (o[cols[0]] === "") continue;
      rows.push(o);
    }
    this._c[t] = rows;
    return rows;
  },
  find: function (t, key, val) {
    var rows = this.all(t);
    for (var i = 0; i < rows.length; i++) if (String(rows[i][key]) === String(val)) return rows[i];
    return null;
  },
  insert: function (t, obj) {
    var cols = TABLES[t];
    _sheet_(t).appendRow(cols.map(function (c) { return obj[c] === undefined ? "" : String(obj[c]); }));
    this._invalidate(t);
  },
  insertMany: function (t, objs) {
    if (!objs.length) return;
    var sh = _sheet_(t), cols = TABLES[t];
    var start = sh.getLastRow() + 1;
    var data = objs.map(function (o) { return cols.map(function (c) { return o[c] === undefined ? "" : String(o[c]); }); });
    sh.getRange(start, 1, data.length, cols.length).setNumberFormat("@").setValues(data);
    this._invalidate(t);
  },
  update: function (t, key, val, patch) {
    var row = this.find(t, key, val);
    if (!row) return false;
    var sh = _sheet_(t), cols = TABLES[t];
    for (var k in patch) {
      var j = cols.indexOf(k);
      if (j >= 0) sh.getRange(row._row, j + 1).setValue(String(patch[k] === undefined ? "" : patch[k]));
    }
    this._invalidate(t);
    return true;
  },
  remove: function (t, key, val) {
    var row = this.find(t, key, val);
    if (!row) return false;
    _sheet_(t).deleteRow(row._row);
    this._invalidate(t);
    return true;
  }
};

function _hex_(bytes) {
  return bytes.map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? "0" + v : v; }).join("");
}

var GS_ENV = {
  store: SheetStore,
  now: function () { return Date.now(); },
  uuid: function () { return Utilities.getUuid().replace(/-/g, ""); },
  sha256: function (s) {
    return _hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8));
  },
  cache: {
    get: function (k) { return CacheService.getScriptCache().get(k); },
    put: function (k, v, sec) { CacheService.getScriptCache().put(k, v, sec || 21600); }
  },
  lock: function (fn) {
    var lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try { return fn(); } finally { lock.releaseLock(); }
  }
};

function _out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Talaba sahifalari va admin panel şu manzilga POST yuboradi. */
function doPost(e) {
  var req = {};
  try { req = JSON.parse(e.postData.contents); } catch (x) { return _out_({ ok: false, error: "JSON xato" }); }
  return _out_(handleAction(GS_ENV, req.action, req.payload || {}));
}

/** Brauzerda oçilganda holat sahifasi; ?action=ping — tekşiriş. */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === "ping") return _out_(handleAction(GS_ENV, "ping", {}));
  var html = "<meta charset='utf-8'><div style='font-family:sans-serif;max-width:560px;margin:40px auto'>" +
    "<h2>Expert API işlayapti ✓</h2><p>Versiya " + EXPERT_VERSION + ". Bu manzilni admin paneldagi " +
    "<b>Sozlamalar → API manzili</b> maydoniga va GitHub’dagi <code>config.js</code> fayliga qöying.</p></div>";
  return HtmlService.createHtmlOutput(html).setTitle("Expert API");
}

/** Bir marta qölda işga tuşiriş mumkin: barça varaqlarni yaratadi. */
function setup() {
  Object.keys(TABLES).forEach(function (t) { _sheet_(t); });
  var def = _ss_().getSheetByName("Sheet1") || _ss_().getSheetByName("Лист1") || _ss_().getSheetByName("List1");
  if (def && _ss_().getSheets().length > 1) _ss_().deleteSheet(def);
  Logger.log("Tayyor. Jadval: " + _ss_().getUrl());
  return "Tayyor";
}
