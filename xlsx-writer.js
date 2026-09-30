/* ═══════════════════════════════════════════════════════════════
   DPM Knowledge Base — KBXlsx: a tiny dependency-free .xlsx writer
   ───────────────────────────────────────────────────────────────
   Builds a real Office Open XML workbook (SpreadsheetML) entirely in
   the browser — no libraries, no CDN, no server. Used by
   checklist-export.js to export a project checklist to Excel.

   Written in plain ES3/ES5 (no let/const/arrow functions, and no
   Object.keys / JSON / Array#forEach / typed arrays required) so the
   same file also runs headlessly under Windows Script Host (cscript)
   for testing. When Uint8Array exists (every browser) toBytes()
   returns a Uint8Array; otherwise it returns a plain Array of bytes.

   API (all row/column numbers are 1-based)
   ─────────────────────────────────────────
   var wb = new KBXlsx.Workbook({ title, subject, creator,
                                  description?, keywords?,
                                  created?: Date,
                                  font?: { name: "Calibri", size: 11 } });

   var st = wb.style({                          → cell style id (deduplicated)
     font:   { name, size, bold, italic, underline (true|"double"),
               strike, color: "RRGGBB" },
     fill:   "RRGGBB"  |  { pattern: "solid"|"lightGray"|"gray125"|…,
                            color: "RRGGBB", bg: "RRGGBB" },
     border: { top|bottom|left|right|all: { style: "thin"|"medium"|
               "thick"|"dashed"|"dotted"|"hair"|"double", color } },
     align:  { h: "left"|"center"|"right"|"fill"|"justify",
               v: "top"|"center"|"bottom", wrap: bool, indent: n,
               rotate: deg, shrink: bool },
     numFmt: "yyyy-mm-dd" | "d mmm yyyy" | "0%" | "d" | "ddd" | …
   });                                           wb.style() / wb.style(null) → 0 (default)

   var dx = wb.dxf({ font: { bold, italic, strike, color },
                     fill: "RRGGBB", border: {…}, numFmt });
                                                → differential style id (for ws.cf)

   var ws = wb.sheet(name, {
     tabColor: "RRGGBB", showGrid: false, zoom: 100,
     freeze: { row: r, col: c },   // r rows and c columns stay frozen
                                   // (scrolling starts at row r+1, col c+1)
     landscape: bool, fitWidth: 1, // fit to N pages wide, any height
     paper: "A4"|"A3"|"letter",
     printTitleRows: "1:4",        // repeat rows 1–4 on every page
     printTitleCols: "A:B",
     margins: { left, right, top, bottom, header, footer },  // inches
     header: "&L…&C…&R…", footer: "&LPage &P of &N",       // Excel codes
     centerH: bool, rowHeight: 15, summaryAbove: bool
   });                                          (name is cleaned to Excel's
                                                 rules; ws.name has the result)

   ws.col(c, { width, hidden, style });   ws.cols(c1, c2, {…})
   ws.row(r, { height, hidden, level (outline 1–7), collapsed });
   ws.set(r, c, value, styleId);          → ws (chainable)
       value: string | number | boolean | Date | null
              | { f: "FORMULA without =", v: cachedValue,
                  t: "n"|"str"|"b"|"d" }
       • Date → Excel date serial (date only, from its Y/M/D — no
         time-zone shift). A Date with no style gets "yyyy-mm-dd".
       • null + style → an empty cell that still shows fill/borders.
       • Text keeps line breaks ("a\nb"; use a wrap style to see them).
       • Formulas returning text should use t:"str" (inferred when v
         is a string). Newer functions (IFS, XLOOKUP, TEXTJOIN,
         WORKDAY.INTL…) get their "_xlfn." prefix automatically;
         dynamic-array functions (FILTER, SORT, UNIQUE, LET…) are not
         supported.
   ws.fill(r1, c1, r2, c2, styleId)        style every empty cell in a box
   ws.merge(r1, c1, r2, c2)                (cells inside inherit the
                                            top-left style so borders show)
   ws.cf("A1:B9 D1:D9", [ { formula: "…", dxf: dx, stopIfTrue: bool } ])
       expression rules, in priority order (first = highest); formulas
       are relative to the top-left cell of the first range.
   ws.validation("G6:G99", { list: ["Not started","Done"],   // or
                             source: "$K$1:$K$4",           // a range
                             allowBlank: true, prompt, promptTitle,
                             error, errorTitle });
   ws.autoFilter("A5:K40");

   wb.name("ProjectStart", "'Overview'!$C$10");   workbook-level name
   wb.toBytes()   → Uint8Array (or Array) — the .xlsx file

   Helpers: KBXlsx.col(3) → "C"; KBXlsx.ref(2, 3) → "C2";
            KBXlsx.ref(2, 3, true) → "$C$2"; KBXlsx.serial(date|
            "YYYY-MM-DD") → 46295; KBXlsx.quoteSheet("It's") →
            "'It''s'"; KBXlsx.toBase64(bytes); KBXlsx.MIME.

   Implementation notes
   • ZIP uses the STORE method (no compression) with UTF-8 names.
   • Strings go into a shared-strings table (deduplicated).
   • Characters that XML 1.0 forbids are stripped; lone surrogates
     become U+FFFD.
   • Workbook is flagged fullCalcOnLoad so Excel recalculates every
     formula on open; cached values are optional.
═══════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";

  var MAX_ROW = 1048576, MAX_COL = 16384, MAX_TEXT = 32767;
  var NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  var NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  var NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
  var XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';

  /* ── small utilities ─────────────────────────────────────── */

  function fail(msg) { throw new Error("KBXlsx: " + msg); }

  function isDate(v) { return Object.prototype.toString.call(v) === "[object Date]"; }
  function isArray(v) { return Object.prototype.toString.call(v) === "[object Array]"; }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /* numeric keys of an object, ascending (no Object.keys in ES3) */
  function numKeys(o) {
    var out = [], k;
    for (k in o) { if (has(o, k)) { out.push(+k); } }
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  /* Remove characters XML 1.0 cannot carry (keeps \t \n \r). */
  var ILLEGAL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

  function esc(s) {
    return String(s).replace(ILLEGAL, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function num(n) { return String(n); }  // JS number text is valid xsd:double

  function colName(n) {
    var s = "";
    n = Math.floor(n);
    while (n > 0) {
      var m = (n - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  function ref(r, c, abs) {
    return abs ? "$" + colName(c) + "$" + r : colName(c) + r;
  }

  function checkRC(r, c) {
    if (typeof r !== "number" || r !== Math.floor(r) || r < 1 || r > MAX_ROW) { fail("bad row " + r); }
    if (typeof c !== "number" || c !== Math.floor(c) || c < 1 || c > MAX_COL) { fail("bad column " + c); }
  }

  /* "A1:C4" → {r1,c1,r2,c2} (absolute $ ignored) */
  function parseRange(a1) {
    var m = /^\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?$/.exec(String(a1).toUpperCase());
    if (!m) { fail("bad range " + a1); }
    function cn(s) { var n = 0, i; for (i = 0; i < s.length; i++) { n = n * 26 + (s.charCodeAt(i) - 64); } return n; }
    var r1 = +m[2], c1 = cn(m[1]);
    var r2 = m[4] ? +m[4] : r1, c2 = m[3] ? cn(m[3]) : c1;
    return { r1: Math.min(r1, r2), c1: Math.min(c1, c2), r2: Math.max(r1, r2), c2: Math.max(c1, c2) };
  }

  /* Excel serial from the date's calendar fields (1899-12-30 epoch). */
  function serial(d) {
    var y, mo, da;
    if (typeof d === "string") {
      var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
      if (!m) { fail("bad date " + d); }
      y = +m[1]; mo = +m[2] - 1; da = +m[3];
    } else if (isDate(d)) {
      if (isNaN(d.getTime())) { return null; }
      y = d.getFullYear(); mo = d.getMonth(); da = d.getDate();
    } else {
      fail("serial() needs a Date or YYYY-MM-DD");
    }
    return Math.round((Date.UTC(y, mo, da) - Date.UTC(1899, 11, 30)) / 86400000);
  }

  function quoteSheet(name) { return "'" + String(name).replace(/'/g, "''") + "'"; }

  function color(c) {                    // "RRGGBB" / "#RRGGBB" / "AARRGGBB" → "AARRGGBB"
    var s = String(c).replace(/^#/, "").toUpperCase();
    if (/^[0-9A-F]{6}$/.test(s)) { return "FF" + s; }
    if (/^[0-9A-F]{8}$/.test(s)) { return s; }
    fail("bad colour " + c);
  }

  /* ── UTF-8, CRC-32, base64 ──────────────────────────────── */

  var HAS_U8 = typeof Uint8Array !== "undefined";

  function newBytes(n) {
    if (HAS_U8) { return new Uint8Array(n); }
    var a = new Array(n), i;
    for (i = 0; i < n; i++) { a[i] = 0; }
    return a;
  }

  /* Encodes a JS string as UTF-8; lone surrogates → U+FFFD. */
  function utf8(str) {
    var len = 0, i, c, c2, n = str.length;
    for (i = 0; i < n; i++) {                              // pass 1: size
      c = str.charCodeAt(i);
      if (c < 0x80) { len += 1; }
      else if (c < 0x800) { len += 2; }
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < n &&
               (c2 = str.charCodeAt(i + 1)) >= 0xDC00 && c2 <= 0xDFFF) { len += 4; i++; }
      else { len += 3; }
    }
    var out = newBytes(len), p = 0, cp;
    for (i = 0; i < n; i++) {                              // pass 2: write
      c = str.charCodeAt(i);
      if (c < 0x80) { out[p++] = c; continue; }
      if (c < 0x800) { out[p++] = 0xC0 | (c >> 6); out[p++] = 0x80 | (c & 63); continue; }
      if (c >= 0xD800 && c <= 0xDBFF && i + 1 < n &&
          (c2 = str.charCodeAt(i + 1)) >= 0xDC00 && c2 <= 0xDFFF) {
        cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00); i++;
        out[p++] = 0xF0 | (cp >> 18); out[p++] = 0x80 | ((cp >> 12) & 63);
        out[p++] = 0x80 | ((cp >> 6) & 63); out[p++] = 0x80 | (cp & 63);
        continue;
      }
      if (c >= 0xD800 && c <= 0xDFFF) { c = 0xFFFD; }      // lone surrogate
      out[p++] = 0xE0 | (c >> 12); out[p++] = 0x80 | ((c >> 6) & 63); out[p++] = 0x80 | (c & 63);
    }
    return out;
  }

  var CRC_TABLE = (function () {
    var t = [], n, k, c;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF, i, n = bytes.length;
    for (i = 0; i < n; i++) { c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8); }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  function toBase64(bytes) {
    var out = [], i, n = bytes.length, a, b, c;
    for (i = 0; i < n; i += 3) {
      a = bytes[i]; b = i + 1 < n ? bytes[i + 1] : 0; c = i + 2 < n ? bytes[i + 2] : 0;
      out.push(B64.charAt(a >> 2) + B64.charAt(((a & 3) << 4) | (b >> 4)) +
        (i + 1 < n ? B64.charAt(((b & 15) << 2) | (c >> 6)) : "=") +
        (i + 2 < n ? B64.charAt(c & 63) : "="));
    }
    return out.join("");
  }

  /* ── ZIP (STORE) ────────────────────────────────────────── */

  function zip(files, when) {           // files: [{name, data(bytes)}]
    var dosTime = (when.getHours() << 11) | (when.getMinutes() << 5) | (when.getSeconds() >> 1);
    var dosDate = ((Math.max(when.getFullYear(), 1980) - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate();
    var i, f, total = 22, entries = [];
    for (i = 0; i < files.length; i++) {
      f = files[i];
      var nm = utf8(f.name);
      entries.push({ name: nm, data: f.data, crc: crc32(f.data), offset: 0 });
      total += 30 + nm.length + f.data.length + 46 + nm.length;
    }
    var out = newBytes(total), p = 0;
    function u16(v) { out[p++] = v & 255; out[p++] = (v >>> 8) & 255; }
    function u32(v) { out[p++] = v & 255; out[p++] = (v >>> 8) & 255; out[p++] = (v >>> 16) & 255; out[p++] = (v >>> 24) & 255; }
    function copy(src) { var j, n = src.length; for (j = 0; j < n; j++) { out[p++] = src[j]; } }

    for (i = 0; i < entries.length; i++) {               // local headers + data
      f = entries[i];
      f.offset = p;
      u32(0x04034B50); u16(20); u16(0x0800); u16(0);       // sig, version, UTF-8 flag, STORE
      u16(dosTime); u16(dosDate);
      u32(f.crc); u32(f.data.length); u32(f.data.length);
      u16(f.name.length); u16(0);
      copy(f.name); copy(f.data);
    }
    var cdStart = p;
    for (i = 0; i < entries.length; i++) {               // central directory
      f = entries[i];
      u32(0x02014B50); u16(20); u16(20); u16(0x0800); u16(0);
      u16(dosTime); u16(dosDate);
      u32(f.crc); u32(f.data.length); u32(f.data.length);
      u16(f.name.length); u16(0); u16(0); u16(0); u16(0); u32(0);
      u32(f.offset);
      copy(f.name);
    }
    var cdSize = p - cdStart;
    u32(0x06054B50); u16(0); u16(0);                       // end of central directory
    u16(entries.length); u16(entries.length);
    u32(cdSize); u32(cdStart); u16(0);
    return out;
  }

  /* ── formulas ───────────────────────────────────────────── */

  /* Functions newer than Excel 2007 must be stored with "_xlfn." */
  var XLFN = ["CONCAT", "TEXTJOIN", "IFS", "SWITCH", "MAXIFS", "MINIFS", "XLOOKUP",
    "XMATCH", "IFNA", "DAYS", "ISOWEEKNUM", "WORKDAY.INTL", "NETWORKDAYS.INTL",
    "AGGREGATE", "CEILING.MATH", "FLOOR.MATH"];
  var XLFN_RE = new RegExp("(^|[^A-Za-z0-9_.])(" +
    XLFN.join("|").replace(/\./g, "\\.") + ")\\s*\\(", "gi");

  function cleanFormula(f) {
    f = String(f).replace(/^\s*=/, "");
    // only rewrite outside "string literals"
    var parts = f.split('"'), i;
    for (i = 0; i < parts.length; i += 2) {
      parts[i] = parts[i].replace(XLFN_RE, function (m, pre, name) {
        return pre + "_xlfn." + name.toUpperCase() + "(";
      });
    }
    return parts.join('"');
  }

  /* ── Workbook ───────────────────────────────────────────── */

  var BUILTIN_FMT = { "General": 0, "0": 1, "0.00": 2, "#,##0": 3, "#,##0.00": 4,
    "0%": 9, "0.00%": 10, "@": 49 };
  var BORDER_SIDES = ["left", "right", "top", "bottom"];
  var PAPER = { a4: 9, a3: 8, letter: 1, legal: 5 };

  function Workbook(opts) {
    opts = opts || {};
    this.props = {
      title: opts.title || "", subject: opts.subject || "", creator: opts.creator || "",
      description: opts.description || "", keywords: opts.keywords || "",
      created: isDate(opts.created) ? opts.created : new Date()
    };
    var f = opts.font || {};
    this._defFont = { name: f.name || "Calibri", size: f.size || 11 };
    this._sheets = [];
    this._names = [];
    this._numFmts = []; this._numFmtIdx = {};
    this._fonts = []; this._fontIdx = {};
    this._fills = []; this._fillIdx = {};
    this._borders = []; this._borderIdx = {};
    this._xfs = []; this._xfIdx = {};
    this._dxfs = []; this._dxfIdx = {};
    this._styleCache = {};
    this._sst = []; this._sstIdx = {}; this._sstRefs = 0;
    this._dateStyle = -1;

    this._intern(this._fonts, this._fontIdx, this._fontXml({}, false));
    this._intern(this._fills, this._fillIdx, '<fill><patternFill patternType="none"/></fill>');
    this._intern(this._fills, this._fillIdx, '<fill><patternFill patternType="gray125"/></fill>');
    this._intern(this._borders, this._borderIdx, "<border><left/><right/><top/><bottom/><diagonal/></border>");
    this._intern(this._xfs, this._xfIdx, '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>');
  }

  Workbook.prototype._intern = function (list, idx, xml) {
    var k = "$" + xml;
    if (has(idx, k)) { return idx[k]; }
    idx[k] = list.length;
    list.push(xml);
    return idx[k];
  };

  Workbook.prototype._numFmtId = function (code) {
    code = String(code);
    if (has(BUILTIN_FMT, code)) { return BUILTIN_FMT[code]; }
    var k = "$" + code;
    if (!has(this._numFmtIdx, k)) {
      this._numFmtIdx[k] = 164 + this._numFmts.length;
      this._numFmts.push(code);
    }
    return this._numFmtIdx[k];
  };

  Workbook.prototype._fontXml = function (f, dxf) {
    f = f || {};
    var x = "<font>";
    if (f.bold) { x += "<b/>"; } else if (dxf && f.bold === false) { x += '<b val="0"/>'; }
    if (f.italic) { x += "<i/>"; } else if (dxf && f.italic === false) { x += '<i val="0"/>'; }
    if (f.strike) { x += "<strike/>"; } else if (dxf && f.strike === false) { x += '<strike val="0"/>'; }
    if (f.underline) {
      x += (f.underline === true || f.underline === "single") ? "<u/>" : '<u val="' + esc(f.underline) + '"/>';
    }
    if (!dxf) { x += '<sz val="' + (f.size || this._defFont.size) + '"/>'; }
    if (f.color) { x += '<color rgb="' + color(f.color) + '"/>'; }
    if (!dxf) { x += '<name val="' + esc(f.name || this._defFont.name) + '"/><family val="2"/>'; }
    return x + "</font>";
  };

  Workbook.prototype._fillXml = function (spec, dxf) {
    var pattern = "solid", fg, bg;
    if (typeof spec === "string") { fg = spec; }
    else { pattern = spec.pattern || "solid"; fg = spec.color; bg = spec.bg; }
    var x = '<fill><patternFill patternType="' + esc(pattern) + '">';
    if (fg) { x += '<fgColor rgb="' + color(fg) + '"/>'; }
    // In a dxf, Excel paints a solid fill with bgColor — set both.
    if (bg || (dxf && fg)) { x += '<bgColor rgb="' + color(bg || fg) + '"/>'; }
    else if (fg) { x += '<bgColor indexed="64"/>'; }
    return x + "</patternFill></fill>";
  };

  Workbook.prototype._borderXml = function (b, dxf) {
    var x = "<border>", i, side, s;
    for (i = 0; i < BORDER_SIDES.length; i++) {
      side = BORDER_SIDES[i];
      s = b[side] || b.all;
      if (typeof s === "string") { s = { style: s }; }
      if (s && s.style) {
        x += "<" + side + ' style="' + esc(s.style) + '">' +
          (s.color ? '<color rgb="' + color(s.color) + '"/>' : '<color indexed="64"/>') +
          "</" + side + ">";
      } else if (!dxf) {
        x += "<" + side + "/>";
      }
    }
    if (!dxf) { x += "<diagonal/>"; }
    return x + "</border>";
  };

  function alignXml(a) {
    var x = "<alignment";
    if (a.h) { x += ' horizontal="' + esc(a.h) + '"'; }
    if (a.v) { x += ' vertical="' + esc(a.v) + '"'; }
    if (a.rotate) { x += ' textRotation="' + Math.round(a.rotate) + '"'; }
    if (a.wrap) { x += ' wrapText="1"'; }
    if (a.indent) { x += ' indent="' + Math.round(a.indent) + '"'; }
    if (a.shrink) { x += ' shrinkToFit="1"'; }
    return x + "/>";
  }

  /* Cell style → id in cellXfs (deduplicated). */
  Workbook.prototype.style = function (spec) {
    if (!spec) { return 0; }
    var numFmtId = spec.numFmt != null ? this._numFmtId(spec.numFmt) : 0;
    var fontId = spec.font ? this._intern(this._fonts, this._fontIdx, this._fontXml(spec.font, false)) : 0;
    var fillId = spec.fill ? this._intern(this._fills, this._fillIdx, this._fillXml(spec.fill, false)) : 0;
    var borderId = spec.border ? this._intern(this._borders, this._borderIdx, this._borderXml(spec.border, false)) : 0;
    var al = spec.align ? alignXml(spec.align) : "";
    if (al === "<alignment/>") { al = ""; }
    var x = '<xf numFmtId="' + numFmtId + '" fontId="' + fontId + '" fillId="' + fillId +
      '" borderId="' + borderId + '" xfId="0"' +
      (numFmtId ? ' applyNumberFormat="1"' : "") + (fontId ? ' applyFont="1"' : "") +
      (fillId ? ' applyFill="1"' : "") + (borderId ? ' applyBorder="1"' : "") +
      (al ? ' applyAlignment="1">' + al + "</xf>" : "/>");
    return this._intern(this._xfs, this._xfIdx, x);
  };

  /* Differential style (conditional formatting) → id in dxfs. */
  Workbook.prototype.dxf = function (spec) {
    spec = spec || {};
    var x = "<dxf>";
    if (spec.font) { x += this._fontXml(spec.font, true); }
    if (spec.numFmt != null) {
      x += '<numFmt numFmtId="' + this._numFmtId(spec.numFmt) + '" formatCode="' + esc(spec.numFmt) + '"/>';
    }
    if (spec.fill) { x += this._fillXml(spec.fill, true); }
    if (spec.align) { x += alignXml(spec.align); }
    if (spec.border) { x += this._borderXml(spec.border, true); }
    x += "</dxf>";
    return this._intern(this._dxfs, this._dxfIdx, x);
  };

  Workbook.prototype._defaultDateStyle = function () {
    if (this._dateStyle < 0) { this._dateStyle = this.style({ numFmt: "yyyy-mm-dd" }); }
    return this._dateStyle;
  };

  Workbook.prototype._str = function (s) {
    var k = "$" + s;
    this._sstRefs++;
    if (has(this._sstIdx, k)) { return this._sstIdx[k]; }
    this._sstIdx[k] = this._sst.length;
    this._sst.push(s);
    return this._sstIdx[k];
  };

  function cleanSheetName(name, n) {
    var s = String(name == null ? "" : name).replace(/[\[\]:*?\/\\]/g, "-")
      .replace(ILLEGAL, "").replace(/^\s+|\s+$/g, "").replace(/^'+|'+$/g, "");
    if (!s) { s = "Sheet" + n; }
    return s.substring(0, 31);
  }

  Workbook.prototype.sheet = function (name, opts) {
    var base = cleanSheetName(name, this._sheets.length + 1), nm = base, i = 2, j, clash;
    do {
      clash = false;
      for (j = 0; j < this._sheets.length; j++) {
        if (this._sheets[j].name.toLowerCase() === nm.toLowerCase()) { clash = true; break; }
      }
      if (clash) { var sfx = " (" + (i++) + ")"; nm = base.substring(0, 31 - sfx.length) + sfx; }
    } while (clash);
    var ws = new Sheet(this, nm, opts || {}, this._sheets.length);
    this._sheets.push(ws);
    return ws;
  };

  Workbook.prototype.name = function (name, refersTo, opts) {
    if (!/^[A-Za-z_\\][A-Za-z0-9_.\\]*$/.test(name)) { fail("bad defined name " + name); }
    opts = opts || {};
    this._names.push({ name: name, ref: String(refersTo).replace(/^\s*=/, ""),
      local: opts.sheet != null ? opts.sheet : null, hidden: !!opts.hidden });
    return this;
  };

  /* ── Sheet ──────────────────────────────────────────────── */

  function Sheet(wb, name, opts, index) {
    this.wb = wb;
    this.name = name;
    this.index = index;
    this.opts = opts;
    this._rows = {};       // r → { c → {v, s} }
    this._rowOpts = {};    // r → opts
    this._cols = {};       // c → opts
    this._merges = [];
    this._cf = [];         // [{sqref, rules}]
    this._dv = [];
    this._af = null;
  }

  Sheet.prototype.set = function (r, c, value, styleId) {
    checkRC(r, c);
    if (value === undefined) { value = null; }
    if (styleId === undefined || styleId === null) {
      styleId = isDate(value) ? this.wb._defaultDateStyle() : 0;
    }
    var row = this._rows[r] || (this._rows[r] = {});
    if (value === null && !styleId) { delete row[c]; return this; }
    row[c] = { v: value, s: styleId };
    return this;
  };

  Sheet.prototype.fill = function (r1, c1, r2, c2, styleId) {
    var r, c, row;
    checkRC(r1, c1); checkRC(r2, c2);
    for (r = r1; r <= r2; r++) {
      row = this._rows[r] || (this._rows[r] = {});
      for (c = c1; c <= c2; c++) {
        if (!has(row, c)) { row[c] = { v: null, s: styleId }; }
      }
    }
    return this;
  };

  Sheet.prototype.col = function (c, o) { checkRC(1, c); this._cols[c] = o || {}; return this; };
  Sheet.prototype.cols = function (c1, c2, o) { var c; for (c = c1; c <= c2; c++) { this.col(c, o); } return this; };
  Sheet.prototype.row = function (r, o) { checkRC(r, 1); this._rowOpts[r] = o || {}; return this; };

  Sheet.prototype.merge = function (r1, c1, r2, c2) {
    checkRC(r1, c1); checkRC(r2, c2);
    if (r1 === r2 && c1 === c2) { return this; }
    this._merges.push({ r1: Math.min(r1, r2), c1: Math.min(c1, c2), r2: Math.max(r1, r2), c2: Math.max(c1, c2) });
    return this;
  };

  Sheet.prototype.cf = function (sqref, rules) {
    if (!isArray(rules)) { rules = [rules]; }
    var i, entry = null;
    for (i = 0; i < this._cf.length; i++) { if (this._cf[i].sqref === sqref) { entry = this._cf[i]; } }
    if (!entry) { entry = { sqref: sqref, rules: [] }; this._cf.push(entry); }
    for (i = 0; i < rules.length; i++) {
      if (rules[i].dxf == null || rules[i].formula == null) { fail("cf rule needs formula and dxf"); }
      entry.rules.push(rules[i]);
    }
    return this;
  };

  Sheet.prototype.validation = function (sqref, o) {
    this._dv.push({ sqref: sqref, o: o || {} });
    return this;
  };

  Sheet.prototype.autoFilter = function (range) { parseRange(range); this._af = range; return this; };

  /* serialisation of one cell */
  Sheet.prototype._cellXml = function (r, c, cell) {
    var wb = this.wb, v = cell.v;
    var a = '<c r="' + colName(c) + r + '"' + (cell.s ? ' s="' + cell.s + '"' : "");
    if (v === null) { return a + "/>"; }
    if (typeof v === "string") {
      v = v.replace(/\r\n?/g, "\n").replace(ILLEGAL, "");
      if (v.length > MAX_TEXT) { v = v.substring(0, MAX_TEXT); }
      return a + ' t="s"><v>' + wb._str(v) + "</v></c>";
    }
    if (typeof v === "number") {
      return isFinite(v) ? a + "><v>" + num(v) + "</v></c>" : a + "/>";
    }
    if (typeof v === "boolean") { return a + ' t="b"><v>' + (v ? 1 : 0) + "</v></c>"; }
    if (isDate(v)) {
      var sd = serial(v);
      return sd === null ? a + "/>" : a + "><v>" + sd + "</v></c>";
    }
    if (typeof v === "object" && v.f != null) {
      var cv = v.v, t = v.t;
      if (!t) { t = typeof cv === "string" ? "str" : typeof cv === "boolean" ? "b" : "n"; }
      var fx = "<f>" + esc(cleanFormula(v.f)) + "</f>";
      if (t === "str") {
        return a + ' t="str">' + fx + (cv != null ? "<v>" + esc(String(cv)) + "</v>" : "") + "</c>";
      }
      if (t === "b") {
        return a + ' t="b">' + fx + (cv != null ? "<v>" + (cv ? 1 : 0) + "</v>" : "") + "</c>";
      }
      if (isDate(cv)) { cv = serial(cv); }
      return a + ">" + fx + (typeof cv === "number" && isFinite(cv) ? "<v>" + num(cv) + "</v>" : "") + "</c>";
    }
    return this._cellXml(r, c, { v: String(v), s: cell.s });
  };

  Sheet.prototype._xml = function () {
    var o = this.opts, wb = this.wb, x = [], i, j, r, c, k;

    // merged areas: give the hidden cells the top-left style so borders/fills show
    for (i = 0; i < this._merges.length; i++) {
      var m = this._merges[i], tl = this._rows[m.r1] && this._rows[m.r1][m.c1];
      if (tl && tl.s) { this.fill(m.r1, m.c1, m.r2, m.c2, tl.s); }
    }

    var rowNums = numKeys(this._rows), extra = numKeys(this._rowOpts), seen = {};
    for (i = 0; i < rowNums.length; i++) { seen[rowNums[i]] = 1; }
    for (i = 0; i < extra.length; i++) { if (!seen[extra[i]]) { rowNums.push(extra[i]); } }
    rowNums.sort(function (a, b) { return a - b; });

    // dimension
    var minR = 0, maxR = 0, minC = 0, maxC = 0, maxLevel = 0;
    for (i = 0; i < rowNums.length; i++) {
      var cs = numKeys(this._rows[rowNums[i]] || {});
      if (!cs.length) { continue; }
      if (!minR) { minR = rowNums[i]; }
      maxR = rowNums[i];
      if (!minC || cs[0] < minC) { minC = cs[0]; }
      if (cs[cs.length - 1] > maxC) { maxC = cs[cs.length - 1]; }
    }
    for (k in this._rowOpts) {
      if (has(this._rowOpts, k) && this._rowOpts[k].level > maxLevel) { maxLevel = Math.min(7, this._rowOpts[k].level); }
    }
    var dim = minR ? ref(minR, minC) + (maxR !== minR || maxC !== minC ? ":" + ref(maxR, maxC) : "") : "A1";

    x.push(XML_HEAD + '<worksheet xmlns="' + NS_MAIN + '" xmlns:r="' + NS_REL + '">');

    // sheetPr
    var sp = "";
    if (o.tabColor) { sp += '<tabColor rgb="' + color(o.tabColor) + '"/>'; }
    if (maxLevel && o.summaryAbove !== false) { sp += '<outlinePr summaryBelow="0"/>'; }
    if (o.fitWidth) { sp += '<pageSetUpPr fitToPage="1"/>'; }
    if (sp) { x.push("<sheetPr>" + sp + "</sheetPr>"); }

    x.push('<dimension ref="' + dim + '"/>');

    // sheetViews
    var sv = '<sheetView workbookViewId="0"';
    if (this.index === 0) { sv += ' tabSelected="1"'; }
    if (o.showGrid === false) { sv += ' showGridLines="0"'; }
    if (o.zoom) { sv += ' zoomScale="' + Math.round(o.zoom) + '" zoomScaleNormal="' + Math.round(o.zoom) + '"'; }
    var fr = o.freeze, fRow = fr && fr.row ? Math.floor(fr.row) : 0, fCol = fr && fr.col ? Math.floor(fr.col) : 0;
    if (fRow || fCol) {
      var pane = fRow && fCol ? "bottomRight" : fRow ? "bottomLeft" : "topRight";
      var tlc = ref(fRow + 1, fCol + 1);
      sv += "><pane" + (fCol ? ' xSplit="' + fCol + '"' : "") + (fRow ? ' ySplit="' + fRow + '"' : "") +
        ' topLeftCell="' + tlc + '" activePane="' + pane + '" state="frozen"/>' +
        '<selection pane="' + pane + '" activeCell="' + tlc + '" sqref="' + tlc + '"/></sheetView>';
    } else {
      sv += "/>";
    }
    x.push("<sheetViews>" + sv + "</sheetViews>");

    x.push('<sheetFormatPr defaultRowHeight="' + (o.rowHeight || 15) + '"' +
      (o.rowHeight ? ' customHeight="1"' : "") +
      (maxLevel ? ' outlineLevelRow="' + maxLevel + '"' : "") + "/>");

    // cols
    var colNums = numKeys(this._cols);
    if (colNums.length) {
      x.push("<cols>");
      for (i = 0; i < colNums.length; i++) {
        var co = this._cols[colNums[i]];
        x.push('<col min="' + colNums[i] + '" max="' + colNums[i] + '" width="' +
          (co.width != null ? co.width : 9.140625) + '"' + (co.width != null ? ' customWidth="1"' : "") +
          (co.hidden ? ' hidden="1"' : "") + (co.style ? ' style="' + co.style + '"' : "") + "/>");
      }
      x.push("</cols>");
    }

    // sheetData
    x.push("<sheetData>");
    for (i = 0; i < rowNums.length; i++) {
      r = rowNums[i];
      var ro = this._rowOpts[r] || {}, row = this._rows[r] || {};
      var rx = '<row r="' + r + '"';
      if (ro.height != null) { rx += ' ht="' + ro.height + '" customHeight="1"'; }
      if (ro.hidden) { rx += ' hidden="1"'; }
      if (ro.level) { rx += ' outlineLevel="' + Math.min(7, ro.level) + '"'; }
      if (ro.collapsed) { rx += ' collapsed="1"'; }
      var cols = numKeys(row);
      if (!cols.length) { x.push(rx + "/>"); continue; }
      x.push(rx + ">");
      for (j = 0; j < cols.length; j++) { c = cols[j]; x.push(this._cellXml(r, c, row[c])); }
      x.push("</row>");
    }
    x.push("</sheetData>");

    if (this._af) { x.push('<autoFilter ref="' + esc(this._af.replace(/\$/g, "")) + '"/>'); }

    if (this._merges.length) {
      x.push('<mergeCells count="' + this._merges.length + '">');
      for (i = 0; i < this._merges.length; i++) {
        var mg = this._merges[i];
        x.push('<mergeCell ref="' + ref(mg.r1, mg.c1) + ":" + ref(mg.r2, mg.c2) + '"/>');
      }
      x.push("</mergeCells>");
    }

    var prio = 1;
    for (i = 0; i < this._cf.length; i++) {
      var cf = this._cf[i];
      x.push('<conditionalFormatting sqref="' + esc(cf.sqref) + '">');
      for (j = 0; j < cf.rules.length; j++) {
        var rule = cf.rules[j];
        x.push('<cfRule type="expression" dxfId="' + rule.dxf + '" priority="' + (prio++) + '"' +
          (rule.stopIfTrue ? ' stopIfTrue="1"' : "") + "><formula>" + esc(cleanFormula(rule.formula)) +
          "</formula></cfRule>");
      }
      x.push("</conditionalFormatting>");
    }

    if (this._dv.length) {
      x.push('<dataValidations count="' + this._dv.length + '">');
      for (i = 0; i < this._dv.length; i++) {
        var dv = this._dv[i].o, f1;
        if (dv.list) {
          var items = [];
          for (j = 0; j < dv.list.length; j++) { items.push(String(dv.list[j]).replace(/[,"]/g, " ")); }
          f1 = '"' + items.join(",") + '"';
          if (f1.length > 257) { fail("validation list longer than 255 characters — use source:"); }
        } else if (dv.source) {
          f1 = String(dv.source).replace(/^\s*=/, "");
        } else { fail("validation needs list or source"); }
        x.push('<dataValidation type="list"' + (dv.allowBlank !== false ? ' allowBlank="1"' : "") +
          ' showInputMessage="1" showErrorMessage="1"' +
          (dv.errorTitle ? ' errorTitle="' + esc(dv.errorTitle) + '"' : "") +
          (dv.error ? ' error="' + esc(dv.error) + '"' : "") +
          (dv.promptTitle ? ' promptTitle="' + esc(dv.promptTitle) + '"' : "") +
          (dv.prompt ? ' prompt="' + esc(dv.prompt) + '"' : "") +
          ' sqref="' + esc(this._dv[i].sqref) + '"><formula1>' + esc(f1) + "</formula1></dataValidation>");
      }
      x.push("</dataValidations>");
    }

    if (o.centerH) { x.push('<printOptions horizontalCentered="1"/>'); }
    var mr = o.margins || {};
    function mv(v, d) { return v != null ? v : d; }
    x.push('<pageMargins left="' + mv(mr.left, 0.5) + '" right="' + mv(mr.right, 0.5) +
      '" top="' + mv(mr.top, 0.6) + '" bottom="' + mv(mr.bottom, 0.6) +
      '" header="' + mv(mr.header, 0.3) + '" footer="' + mv(mr.footer, 0.3) + '"/>');
    var ps = "";
    if (o.paper && PAPER[String(o.paper).toLowerCase()]) { ps += ' paperSize="' + PAPER[String(o.paper).toLowerCase()] + '"'; }
    if (o.landscape) { ps += ' orientation="landscape"'; } else if (o.landscape === false) { ps += ' orientation="portrait"'; }
    if (o.fitWidth) { ps += ' fitToWidth="' + Math.round(o.fitWidth) + '" fitToHeight="0"'; }
    if (ps) { x.push("<pageSetup" + ps + "/>"); }
    if (o.header || o.footer) {
      x.push("<headerFooter>" + (o.header ? "<oddHeader>" + esc(o.header) + "</oddHeader>" : "") +
        (o.footer ? "<oddFooter>" + esc(o.footer) + "</oddFooter>" : "") + "</headerFooter>");
    }
    x.push("</worksheet>");
    return x.join("");
  };

  /* ── package parts ──────────────────────────────────────── */

  function isoDate(d) {
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) + "T" +
      p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + "Z";
  }

  Workbook.prototype._stylesXml = function () {
    var x = [XML_HEAD + '<styleSheet xmlns="' + NS_MAIN + '">'], i;
    if (this._numFmts.length) {
      x.push('<numFmts count="' + this._numFmts.length + '">');
      for (i = 0; i < this._numFmts.length; i++) {
        x.push('<numFmt numFmtId="' + (164 + i) + '" formatCode="' + esc(this._numFmts[i]) + '"/>');
      }
      x.push("</numFmts>");
    }
    x.push('<fonts count="' + this._fonts.length + '">' + this._fonts.join("") + "</fonts>");
    x.push('<fills count="' + this._fills.length + '">' + this._fills.join("") + "</fills>");
    x.push('<borders count="' + this._borders.length + '">' + this._borders.join("") + "</borders>");
    x.push('<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>');
    x.push('<cellXfs count="' + this._xfs.length + '">' + this._xfs.join("") + "</cellXfs>");
    x.push('<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>');
    x.push('<dxfs count="' + this._dxfs.length + '">' + this._dxfs.join("") + "</dxfs>");
    x.push('<tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>');
    x.push("</styleSheet>");
    return x.join("");
  };

  Workbook.prototype._workbookXml = function () {
    var x = [XML_HEAD + '<workbook xmlns="' + NS_MAIN + '" xmlns:r="' + NS_REL + '">'], i, s, dn = [];
    x.push('<workbookPr defaultThemeVersion="164011"/>');
    x.push('<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="15000" activeTab="0"/></bookViews>');
    x.push("<sheets>");
    for (i = 0; i < this._sheets.length; i++) {
      s = this._sheets[i];
      x.push('<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>');
      var q = quoteSheet(s.name);
      if (s._af) {
        var ar = parseRange(s._af);
        dn.push('<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">' +
          esc(q + "!" + ref(ar.r1, ar.c1, true) + ":" + ref(ar.r2, ar.c2, true)) + "</definedName>");
      }
      var pt = [];
      if (s.opts.printTitleCols) {
        var pc = String(s.opts.printTitleCols).replace(/\$/g, "").split(":");
        pt.push(q + "!$" + pc[0] + ":$" + (pc[1] || pc[0]));
      }
      if (s.opts.printTitleRows) {
        var pr = String(s.opts.printTitleRows).replace(/\$/g, "").split(":");
        pt.push(q + "!$" + pr[0] + ":$" + (pr[1] || pr[0]));
      }
      if (pt.length) {
        dn.push('<definedName name="_xlnm.Print_Titles" localSheetId="' + i + '">' + esc(pt.join(",")) + "</definedName>");
      }
    }
    x.push("</sheets>");
    for (i = 0; i < this._names.length; i++) {
      var nm = this._names[i];
      dn.push('<definedName name="' + esc(nm.name) + '"' +
        (nm.local != null ? ' localSheetId="' + nm.local + '"' : "") +
        (nm.hidden ? ' hidden="1"' : "") + ">" + esc(nm.ref) + "</definedName>");
    }
    if (dn.length) { x.push("<definedNames>" + dn.join("") + "</definedNames>"); }
    x.push('<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>');
    return x.join("");
  };

  Workbook.prototype._sstXml = function () {
    var x = [XML_HEAD + '<sst xmlns="' + NS_MAIN + '" count="' + this._sstRefs + '" uniqueCount="' + this._sst.length + '">'], i, s;
    for (i = 0; i < this._sst.length; i++) {
      s = this._sst[i];
      x.push(/^\s|\s$|\n|\t/.test(s) ? '<si><t xml:space="preserve">' + esc(s) + "</t></si>" : "<si><t>" + esc(s) + "</t></si>");
    }
    x.push("</sst>");
    return x.join("");
  };

  Workbook.prototype.toBytes = function () {
    if (!this._sheets.length) { this.sheet("Sheet1"); }
    var n = this._sheets.length, i, parts = [];
    // shared strings are collected while sheets serialise
    this._sst = []; this._sstIdx = {}; this._sstRefs = 0;
    var sheetXml = [];
    for (i = 0; i < n; i++) { sheetXml.push(this._sheets[i]._xml()); }

    var ct = XML_HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>';
    for (i = 0; i < n; i++) {
      ct += '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    }
    ct += '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      "</Types>";

    var rels = XML_HEAD + '<Relationships xmlns="' + NS_PKG_REL + '">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
      "</Relationships>";

    var wbRels = XML_HEAD + '<Relationships xmlns="' + NS_PKG_REL + '">';
    for (i = 0; i < n; i++) {
      wbRels += '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
    }
    wbRels += '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rId' + (n + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>' +
      "</Relationships>";

    var p = this.props, when = isoDate(p.created);
    var core = XML_HEAD + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
      'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
      'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      (p.title ? "<dc:title>" + esc(p.title) + "</dc:title>" : "") +
      (p.subject ? "<dc:subject>" + esc(p.subject) + "</dc:subject>" : "") +
      (p.creator ? "<dc:creator>" + esc(p.creator) + "</dc:creator>" : "") +
      (p.keywords ? "<cp:keywords>" + esc(p.keywords) + "</cp:keywords>" : "") +
      (p.description ? "<dc:description>" + esc(p.description) + "</dc:description>" : "") +
      (p.creator ? "<cp:lastModifiedBy>" + esc(p.creator) + "</cp:lastModifiedBy>" : "") +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + when + "</dcterms:created>" +
      '<dcterms:modified xsi:type="dcterms:W3CDTF">' + when + "</dcterms:modified>" +
      "</cp:coreProperties>";

    var titles = "";
    for (i = 0; i < n; i++) { titles += "<vt:lpstr>" + esc(this._sheets[i].name) + "</vt:lpstr>"; }
    var app = XML_HEAD + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ' +
      'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      "<Application>Microsoft Excel</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop>" +
      '<HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>' +
      "<vt:variant><vt:i4>" + n + "</vt:i4></vt:variant></vt:vector></HeadingPairs>" +
      '<TitlesOfParts><vt:vector size="' + n + '" baseType="lpstr">' + titles + "</vt:vector></TitlesOfParts>" +
      "<Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc>" +
      "<HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0300</AppVersion></Properties>";

    parts.push({ name: "[Content_Types].xml", data: utf8(ct) });
    parts.push({ name: "_rels/.rels", data: utf8(rels) });
    parts.push({ name: "docProps/core.xml", data: utf8(core) });
    parts.push({ name: "docProps/app.xml", data: utf8(app) });
    parts.push({ name: "xl/workbook.xml", data: utf8(this._workbookXml()) });
    parts.push({ name: "xl/_rels/workbook.xml.rels", data: utf8(wbRels) });
    parts.push({ name: "xl/styles.xml", data: utf8(this._stylesXml()) });
    parts.push({ name: "xl/sharedStrings.xml", data: utf8(this._sstXml()) });
    for (i = 0; i < n; i++) {
      parts.push({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", data: utf8(sheetXml[i]) });
    }
    return zip(parts, p.created);
  };

  /* ── export ─────────────────────────────────────────────── */

  root.KBXlsx = {
    Workbook: Workbook,
    col: colName,
    ref: ref,
    range: parseRange,
    serial: serial,
    quoteSheet: quoteSheet,
    toBase64: toBase64,
    utf8: utf8,
    MIME: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
})(typeof window !== "undefined" ? window : this);
