/* ═══════════════════════════════════════════════════════════════
   DPM Knowledge Base — HOTO Pack → Excel export
   ───────────────────────────────────────────────────────────────
   Builds a formatted .xlsx HOTO pack for one project, in the
   browser, with no libraries (uses xlsx-writer.js → KBXlsx and
   hoto-data.js → KB_HOTO).

   Sheets
     1. HOTO Summary   project details, a readiness status with an
                       in-cell REPT bar, any outstanding items, and
                       what to do with the pack.
     2. HOTO Tracker   exactly the columns for the project's service,
                       one row per device (LAN) / site-circuit (WAN).
     3. Readiness      each item with Item / Detail / Status, a
                       Status dropdown and green/red/grey highlight.

   API — window.KBHotoExport
     buildWorkbook(project, rows, checks[, { now: Date }]) → bytes
     download(project, rows, checks) → saves "HOTO_<slug>_<date>.xlsx"
     fileName(project[, now]) → the download name
     serviceKey(project) → "lan" | "wan"
     status(project, item, checks) → "done" | "na" | ""  (effective)

   Written in plain ES3/ES5 (no let/const/arrow/forEach/Object.keys)
   so it also runs under Windows Script Host for automated testing.
   All user text goes into cells as text — never into a formula.
═══════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";

  /* ── constants ──────────────────────────────────────────── */

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var STATUS_LABELS = ["Done", "Outstanding", "N/A"];
  var BAR_LEN = 24, BAR = "█", BAR_EMPTY = "░";

  var K = {
    dark: "1A1A1A", text: "3D3D3D", mid: "666666", soft: "8A8A8A", line: "E3E3E3",
    hair: "ECECEC", faint: "F5F5F5", white: "FFFFFF",
    orangeInk: "B34200", orangeStrong: "C24A00", orangePale: "FFF0E6", orangeFaint: "FFF8F3",
    red: "C62828", redPale: "FDE4E4", green: "0A7A4A", greenPale: "E6F7F1",
    grey: "6B6B6B", greyPale: "EFEFEF"
  };

  /* ── small helpers ──────────────────────────────────────── */

  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function isArr(v) { return Object.prototype.toString.call(v) === "[object Array]"; }
  function isDate(v) { return Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime()); }
  function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function X() {
    var x = root.KBXlsx;
    if (!x || typeof x.Workbook !== "function") { throw new Error("KBHotoExport: xlsx-writer.js (KBXlsx) is not loaded"); }
    return x;
  }
  function HOTO() {
    var d = root.KB_HOTO;
    if (!d || !d.trackers || !d.readiness) { throw new Error("KBHotoExport: hoto-data.js (KB_HOTO) is not loaded"); }
    return d;
  }

  function parseYmd(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === "string" ? trim(s) : "");
    if (!m) { return null; }
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) { return null; }
    return d;
  }
  function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function fmtDate(d) { return d ? d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear() : ""; }
  function cleanStr(v, max) {
    if (typeof v !== "string") { return v == null ? "" : String(v); }
    v = trim(v.replace(/\s+/g, " "));
    return v.length > max ? v.substring(0, max) : v;
  }

  /* ── service + readiness resolution ─────────────────────── */

  function serviceKey(p) { return (p && p.type === "wan") ? "wan" : "lan"; }
  function trackerOf(p) {
    var t = HOTO().trackers[serviceKey(p)];
    if (!t) { throw new Error("KBHotoExport: no tracker for service " + serviceKey(p)); }
    return t;
  }
  function readinessOf(p) { return HOTO().readiness[serviceKey(p)] || []; }

  function fullStepId(p, item) {
    return (item && item.stepId && p && typeof p.type === "string") ? (p.type + "." + item.stepId) : null;
  }
  function autoDone(p, item) {
    var f = fullStepId(p, item);
    return !!(f && p.done && p.done[f]);
  }
  /* effective status: an explicit override wins; otherwise auto-tick from the
     project's checklist progress; otherwise Outstanding ("") */
  function status(p, item, checks) {
    var ov = (checks && has(checks, item.id)) ? checks[item.id] : undefined;
    if (ov === "done" || ov === "na" || ov === "") { return ov; }
    return autoDone(p, item) ? "done" : "";
  }
  function statusLabel(s) { return s === "done" ? "Done" : (s === "na" ? "N/A" : "Outstanding"); }

  /* ── project normalisation (defensive; matches checklist shape) ── */

  function normProject(src) {
    src = src || {};
    return {
      id: typeof src.id === "string" ? src.id : "",
      name: cleanStr(src.name, 120) || "Untitled project",
      type: typeof src.type === "string" ? src.type : "",
      customer: cleanStr(src.customer, 120),
      site: cleanStr(src.site, 120),
      start: parseYmd(src.start) ? trim(src.start) : "",
      target: parseYmd(src.target) ? trim(src.target) : "",
      dpm: cleanStr(src.dpm, 80),
      pm: cleanStr(src.pm, 80),
      sc: cleanStr(src.sc, 80),
      orderRef: cleanStr(src.orderRef, 60),
      done: (src.done && typeof src.done === "object" && !isArr(src.done)) ? src.done : {}
    };
  }

  function cellValue(col, raw) {
    if (raw == null) { return null; }
    if (col.type === "date") {
      var d = parseYmd(typeof raw === "string" ? raw : "");
      return d ? d : (typeof raw === "string" && raw ? cleanStr(raw, 40) : null);
    }
    var s = cleanStr(String(raw), 300);
    return s === "" ? null : s;
  }

  /* ── workbook ───────────────────────────────────────────── */

  function buildWorkbook(project, rows, checks, opts) {
    var xl = X(), d = HOTO();
    var p = normProject(project);
    var svc = serviceKey(p);
    var tracker = trackerOf(p);
    var items = readinessOf(p);
    var now = (opts && isDate(opts.now)) ? opts.now : new Date();
    rows = isArr(rows) ? rows : [];
    checks = (checks && typeof checks === "object" && !isArr(checks)) ? checks : {};

    var wb = new xl.Workbook({
      title: "HOTO Pack — " + p.name,
      subject: "Hand-Over-To-Operations pack",
      creator: "DPM Knowledge Base",
      created: now
    });

    /* shared styles */
    var sTitle = wb.style({ font: { bold: true, size: 18, color: K.orangeInk } });
    var sSub = wb.style({ font: { size: 11, color: K.mid } });
    var sLabel = wb.style({ font: { bold: true, size: 10, color: K.mid }, align: { v: "center" } });
    var sValue = wb.style({ font: { size: 11, color: K.text }, align: { v: "center", wrap: true } });
    var sValueDate = wb.style({ font: { size: 11, color: K.text }, numFmt: "d mmm yyyy", align: { v: "center" } });
    var sSectionH = wb.style({ font: { bold: true, size: 12, color: K.white }, fill: K.dark, align: { v: "center", indent: 1 } });
    var sBig = wb.style({ font: { bold: true, size: 16, color: K.dark } });
    var sBar = wb.style({ font: { size: 12, color: K.green } });
    var sBarOut = wb.style({ font: { size: 12, color: K.red } });
    var sOut = wb.style({ font: { size: 11, color: K.red }, align: { wrap: true } });
    var sNote = wb.style({ font: { size: 10, color: K.mid }, align: { wrap: true, v: "top" } });
    var sReady = wb.style({ font: { bold: true, size: 14, color: K.green } });
    var sNotReady = wb.style({ font: { bold: true, size: 14, color: K.orangeStrong } });

    buildSummary(wb, p, svc, items, checks, now, {
      sTitle: sTitle, sSub: sSub, sLabel: sLabel, sValue: sValue, sValueDate: sValueDate,
      sSectionH: sSectionH, sBig: sBig, sBar: sBar, sBarOut: sBarOut, sOut: sOut,
      sNote: sNote, sReady: sReady, sNotReady: sNotReady
    });
    buildTracker(wb, p, tracker, rows);
    buildReadiness(wb, p, items, checks);

    return wb.toBytes();
  }

  /* ── sheet 1: HOTO Summary ──────────────────────────────── */

  function buildSummary(wb, p, svc, items, checks, now, st) {
    var ws = wb.sheet("HOTO Summary", { tabColor: K.orangeStrong, showGrid: false });
    ws.col(1, { width: 26 });
    ws.col(2, { width: 60 });

    var r = 1;
    ws.set(r, 1, "HOTO Pack — " + p.name, st.sTitle);
    ws.merge(r, 1, r, 2); ws.row(r, { height: 26 }); r++;
    ws.set(r, 1, "Hand-Over-To-Operations pack · generated " + fmtDate(now), st.sSub);
    ws.merge(r, 1, r, 2); r += 2;

    /* details block */
    ws.set(r, 1, "Project details", st.sSectionH);
    ws.merge(r, 1, r, 2); ws.row(r, { height: 20 }); r++;

    var svcLabel = svc === "wan" ? "WAN" : "LAN";
    var dateLbl = svc === "wan" ? "Site migration date" : "Go-live / migration date";
    var mig = parseYmd(p.target);
    var details = [
      ["Project", p.name, false],
      ["Customer", p.customer, false],
      ["Service", svcLabel, false],
      ["GOLD ref", p.orderRef, false],
      [dateLbl, mig, true],
      ["DPM", p.dpm, false],
      ["Project Manager", p.pm, false],
      ["Solution Consultant", p.sc, false],
      ["Generated on", now, true]
    ];
    var i;
    for (i = 0; i < details.length; i++) {
      var row = details[i];
      ws.set(r, 1, row[0], st.sLabel);
      if (row[2]) {
        var dv = isDate(row[1]) ? row[1] : parseYmd(row[1]);
        ws.set(r, 2, dv || null, st.sValueDate);
      } else {
        ws.set(r, 2, row[1] || null, st.sValue);
      }
      r++;
    }
    r++;

    /* readiness status */
    var total = items.length, done = 0, na = 0, i2, s;
    var outstanding = [];
    for (i2 = 0; i2 < items.length; i2++) {
      s = status(p, items[i2], checks);
      if (s === "done") { done++; }
      else if (s === "na") { na++; }
      else { outstanding.push(items[i2].label); }
    }
    var considered = total - na;                       // items that must be done
    var pct = considered > 0 ? done / considered : 1;
    var filled = Math.round(pct * BAR_LEN);
    if (filled < 0) { filled = 0; } if (filled > BAR_LEN) { filled = BAR_LEN; }
    var barStr = repeat(BAR, filled) + repeat(BAR_EMPTY, BAR_LEN - filled);

    ws.set(r, 1, "Pack readiness", st.sSectionH);
    ws.merge(r, 1, r, 2); ws.row(r, { height: 20 }); r++;

    var ready = outstanding.length === 0;
    ws.set(r, 1, ready ? "Ready for HOTO" : (outstanding.length + " item" + (outstanding.length === 1 ? "" : "s") + " outstanding"),
      ready ? st.sReady : st.sNotReady);
    ws.merge(r, 1, r, 2); r++;

    ws.set(r, 1, done + " of " + considered + " items complete" + (na ? "  (" + na + " N/A)" : ""), st.sBig);
    ws.merge(r, 1, r, 2); r++;
    /* in-cell REPT bar (numeric args only — no user text in the formula) */
    ws.set(r, 1, { f: 'REPT("' + BAR + '",' + filled + ')&REPT("' + BAR_EMPTY + '",' + (BAR_LEN - filled) + ')',
      v: barStr, t: "str" }, ready ? st.sBar : st.sBarOut);
    ws.merge(r, 1, r, 2); r += 2;

    if (outstanding.length) {
      ws.set(r, 1, "Still outstanding", st.sSectionH);
      ws.merge(r, 1, r, 2); ws.row(r, { height: 20 }); r++;
      for (i2 = 0; i2 < outstanding.length; i2++) {
        ws.set(r, 1, "•  " + outstanding[i2], st.sOut);
        ws.merge(r, 1, r, 2); r++;
      }
      r++;
    }

    /* what this pack is */
    ws.set(r, 1, "What this pack is", st.sSectionH);
    ws.merge(r, 1, r, 2); ws.row(r, { height: 20 }); r++;
    ws.set(r, 1,
      "This workbook is the HOTO (Hand-Over-To-Operations) pack for the delivery above: the readiness check, " +
      "the site / device tracker, and the closure record. A clean HOTO is the goal of every delivery.",
      st.sNote);
    ws.merge(r, 1, r, 2); ws.row(r, { height: 44 }); r++;
    ws.set(r, 1, "Send this workbook and the HOTO document to the HOTO Manager.", st.sNote);
    ws.merge(r, 1, r, 2); ws.row(r, { height: 18 }); r++;

    ws.opts.printTitleRows = "1:1";
  }

  function repeat(ch, n) { var s = ""; while (n-- > 0) { s += ch; } return s; }

  /* ── sheet 2: HOTO Tracker ──────────────────────────────── */

  function buildTracker(wb, p, tracker, rows) {
    var ws = wb.sheet("HOTO Tracker", {
      tabColor: K.dark, showGrid: false,
      freeze: { row: 1, col: 1 },
      landscape: true, fitWidth: 1,
      printTitleRows: "1:1"
    });

    var cols = tracker.columns, ncol = cols.length, c, i;
    var sHead = wb.style({
      font: { bold: true, size: 10, color: K.white }, fill: K.dark,
      align: { v: "center", wrap: true }, border: { all: { style: "thin", color: K.dark } }
    });
    var sCell = wb.style({ font: { size: 10, color: K.text }, align: { v: "top", wrap: true }, border: { all: { style: "thin", color: K.line } } });
    var sCellDate = wb.style({ font: { size: 10, color: K.text }, numFmt: "d mmm yyyy", align: { v: "top" }, border: { all: { style: "thin", color: K.line } } });
    var sFirst = wb.style({ font: { bold: true, size: 10, color: K.text }, fill: K.orangeFaint, align: { v: "top", wrap: true }, border: { all: { style: "thin", color: K.line } } });
    var sHint = wb.style({ font: { italic: true, size: 10, color: K.mid }, align: { v: "top", wrap: true }, border: { all: { style: "thin", color: K.line } } });

    /* header */
    for (c = 0; c < ncol; c++) {
      ws.col(c + 1, { width: cols[c].width || 16 });
      ws.set(1, c + 1, cols[c].label, sHead);
    }
    ws.row(1, { height: 30 });

    if (!rows.length) {
      /* empty: one example hint row so the layout is obvious */
      ws.set(2, 1, "e.g. first " + tracker.rowNoun, sHint);
      for (c = 1; c < ncol; c++) { ws.set(2, c + 1, null, sHint); }
      ws.autoFilter(refRange(1, 1, 2, ncol));
    } else {
      var r;
      for (i = 0; i < rows.length; i++) {
        r = i + 2;
        var rowObj = rows[i] || {};
        for (c = 0; c < ncol; c++) {
          var col = cols[c];
          var v = cellValue(col, has(rowObj, col.key) ? rowObj[col.key] : null);
          var styleId = (c === 0) ? sFirst : (col.type === "date" && isDate(v) ? sCellDate : sCell);
          ws.set(r, c + 1, v, styleId);
        }
      }
      ws.autoFilter(refRange(1, 1, rows.length + 1, ncol));
    }
  }

  /* ── sheet 3: Readiness ─────────────────────────────────── */

  function buildReadiness(wb, p, items, checks) {
    var ws = wb.sheet("Readiness", { tabColor: K.green, showGrid: false, freeze: { row: 1 }, printTitleRows: "1:1" });
    ws.col(1, { width: 52 });
    ws.col(2, { width: 60 });
    ws.col(3, { width: 16 });

    var sHead = wb.style({ font: { bold: true, size: 11, color: K.white }, fill: K.green, align: { v: "center", indent: 1 }, border: { all: { style: "thin", color: K.green } } });
    var sItem = wb.style({ font: { bold: true, size: 10, color: K.text }, align: { v: "top", wrap: true }, border: { all: { style: "thin", color: K.line } } });
    var sDetail = wb.style({ font: { size: 10, color: K.mid }, align: { v: "top", wrap: true }, border: { all: { style: "thin", color: K.line } } });
    var sStat = wb.style({ font: { size: 10, color: K.text }, align: { v: "center", h: "center" }, border: { all: { style: "thin", color: K.line } } });

    ws.set(1, 1, "Item", sHead);
    ws.set(1, 2, "Detail", sHead);
    ws.set(1, 3, "Status", sHead);
    ws.row(1, { height: 20 });

    var i, r, s;
    for (i = 0; i < items.length; i++) {
      r = i + 2;
      s = status(p, items[i], checks);
      ws.set(r, 1, items[i].label, sItem);
      ws.set(r, 2, items[i].detail || "", sDetail);
      ws.set(r, 3, statusLabel(s), sStat);
    }
    var lastRow = items.length + 1;

    /* Status dropdown + conditional colours */
    if (items.length) {
      var sqref = "C2:C" + lastRow;
      ws.validation(sqref, { list: STATUS_LABELS, allowBlank: true,
        promptTitle: "Status", prompt: "Done, Outstanding or N/A" });

      var dxDone = wb.dxf({ font: { bold: true, color: K.green }, fill: K.greenPale });
      var dxOut = wb.dxf({ font: { bold: true, color: K.red }, fill: K.redPale });
      var dxNa = wb.dxf({ font: { color: K.grey }, fill: K.greyPale });
      ws.cf(sqref, [
        { formula: '$C2="Done"', dxf: dxDone },
        { formula: '$C2="Outstanding"', dxf: dxOut },
        { formula: '$C2="N/A"', dxf: dxNa }
      ]);
      ws.autoFilter("A1:C" + lastRow);
    }
  }

  function refRange(r1, c1, r2, c2) {
    var xl = X();
    return xl.ref(r1, c1) + ":" + xl.ref(r2, c2);
  }

  /* ── file name + download ───────────────────────────────── */

  function slug(s) {
    s = String(s || "");
    if (typeof s.normalize === "function") { try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) { /* ignore */ } }
    s = s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (s.length > 40) { s = s.substring(0, 40).replace(/-+$/, ""); }
    return s || "project";
  }
  function fileName(project, now) {
    var d = isDate(now) ? now : new Date();
    return "HOTO_" + slug(project && project.name) + "_" + ymd(d) + ".xlsx";
  }

  function download(project, rows, checks) {
    var url = null;
    try {
      var bytes = buildWorkbook(project, rows, checks);
      var name = fileName(project);
      var blob = new root.Blob([bytes], { type: X().MIME });
      var nav = root.navigator;
      if (nav && typeof nav.msSaveOrOpenBlob === "function") { nav.msSaveOrOpenBlob(blob, name); return true; }
      var doc = root.document;
      url = root.URL.createObjectURL(blob);
      var a = doc.createElement("a");
      a.href = url;
      a.download = name;
      a.rel = "noopener";
      a.style.display = "none";
      doc.body.appendChild(a);
      a.click();
      root.setTimeout(function () {
        try { root.URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        if (a.parentNode) { a.parentNode.removeChild(a); }
      }, 2000);
      return true;
    } catch (e) {
      if (url) { try { root.URL.revokeObjectURL(url); } catch (e2) { /* ignore */ } }
      if (root.console && root.console.error) { root.console.error("HOTO export failed:", e); }
      return false;
    }
  }

  root.KBHotoExport = {
    version: 1,
    buildWorkbook: buildWorkbook,
    download: download,
    fileName: fileName,
    serviceKey: serviceKey,
    status: status
  };
})(typeof window !== "undefined" ? window : this);
