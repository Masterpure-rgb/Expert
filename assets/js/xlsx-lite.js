/* Minimal XLSX öquvçi (birinçi varaq) — brauzerning DecompressionStream imkoniyatidan foydalanadi. */
(function () {
  async function inflateRaw(bytes) {
    var ds = new DecompressionStream("deflate-raw");
    var stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
  async function unzip(buf) {
    var b = new Uint8Array(buf), files = {};
    var eocd = -1;
    for (var i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("ZIP emas");
    var n = u16(b, eocd + 10), off = u32(b, eocd + 16);
    var dec = new TextDecoder();
    for (var k = 0; k < n; k++) {
      var method = u16(b, off + 10), csize = u32(b, off + 20), nlen = u16(b, off + 28), elen = u16(b, off + 30), clen = u16(b, off + 32), loff = u32(b, off + 42);
      var name = dec.decode(b.subarray(off + 46, off + 46 + nlen));
      var lnlen = u16(b, loff + 26), lelen = u16(b, loff + 28);
      var data = b.subarray(loff + 30 + lnlen + lelen, loff + 30 + lnlen + lelen + csize);
      files[name] = { method: method, data: data };
      off += 46 + nlen + elen + clen;
    }
    return files;
  }
  async function text(files, name) {
    var f = files[name]; if (!f) return null;
    var raw = f.method === 0 ? f.data : await inflateRaw(f.data);
    return new TextDecoder().decode(raw);
  }
  function colIndex(ref) {
    var m = /^([A-Z]+)/.exec(ref); var s = m ? m[1] : "A", n = 0;
    for (var i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
    return n - 1;
  }
  window.readXlsx = async function (arrayBuffer) {
    var files = await unzip(arrayBuffer);
    var parser = new DOMParser();
    var shared = [];
    var sst = await text(files, "xl/sharedStrings.xml");
    if (sst) {
      var sx = parser.parseFromString(sst, "application/xml");
      Array.prototype.forEach.call(sx.getElementsByTagName("si"), function (si) {
        shared.push(Array.prototype.map.call(si.getElementsByTagName("t"), function (t) { return t.textContent; }).join(""));
      });
    }
    var sheetName = Object.keys(files).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort()[0];
    var xml = await text(files, sheetName);
    var doc = parser.parseFromString(xml, "application/xml");
    var rows = [];
    Array.prototype.forEach.call(doc.getElementsByTagName("row"), function (r) {
      var row = [];
      Array.prototype.forEach.call(r.getElementsByTagName("c"), function (c) {
        var idx = colIndex(c.getAttribute("r") || "A1");
        var type = c.getAttribute("t");
        var v = c.getElementsByTagName("v")[0];
        var val = "";
        if (type === "s" && v) val = shared[Number(v.textContent)] || "";
        else if (type === "inlineStr") { var is = c.getElementsByTagName("t")[0]; val = is ? is.textContent : ""; }
        else if (v) val = v.textContent;
        row[idx] = val;
      });
      for (var i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = "";
      rows.push(row);
    });
    return rows;
  };
  window.parseDelimited = function (txt) {
    txt = txt.replace(/^﻿/, "");
    var first = txt.split(/\r?\n/)[0] || "";
    var sep = first.indexOf("\t") >= 0 ? "\t" : (first.split(";").length > first.split(",").length ? ";" : ",");
    var rows = [], row = [], cur = "", q = false;
    for (var i = 0; i < txt.length; i++) {
      var ch = txt[i];
      if (q) {
        if (ch === '"' && txt[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cur); cur = ""; }
      else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (ch !== "\r") cur += ch;
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
  };
})();
