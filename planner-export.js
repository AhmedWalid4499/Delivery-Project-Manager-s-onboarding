/* ═══════════════════════════════════════════════════════════════
   DPM Knowledge Base — Delivery Planner → Excel export
   ───────────────────────────────────────────────────────────────
   Builds a single-sheet, customer-facing site plan with a day-by-day
   Gantt chart, in the browser, with no libraries (uses xlsx-writer.js
   → KBXlsx). It matches the look of the "ZABOK Planning" sheet DPMs
   share with customers: a header block (title, site, progress, today,
   DPM), a per-day date band, a table of activities with real Excel
   dates, coloured Gantt bars by status (Done = green, In progress =
   amber, Not started = grey, N/A = hatched), weekend shading, a
   today marker, and a legend. Landscape, fit to one page wide,
   print-ready, with the left columns + header frozen.

   API — window.KBPlannerExport
     buildWorkbook(plan)        → Uint8Array (no DOM)
     fileName(plan[, now])      → "Delivery-Plan_<slug>_<YYYY-MM-DD>.xlsx"
     download(plan)             → builds + saves the file; true / false

   plan = {
     title,                     site / plan name
     address,                   site address (optional)
     dpm,                       DPM name (optional)
     service,                   service label, e.g. "WAN" (optional)
     start,     "YYYY-MM-DD"    plan start (kick-off)
     target,    "YYYY-MM-DD"    optional go-live / target date
     activities: [ {
       n,          row number (1-based; recomputed if missing)
       activity,   text
       owner,
       workDays,   number >= 0 (0 = a milestone on its start)
       status,     "Done" | "In progress" | "Not started" | "N/A"
       start,      Date | "YYYY-MM-DD"   (the activity's start)
       end,        Date | "YYYY-MM-DD"   (the activity's end)
       notes
     } ],
     today        Date (optional; defaults to now)
   }

   Written in plain ES3/ES5 (no let/const/arrow/forEach/Object.keys)
   so it also passes the Chakra ES5 check used for the data files.
   All user text goes into cells as text — never into a formula.
═══════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";

  /* ── constants ──────────────────────────────────────────── */

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  var MAX_DAY_COLS = 120;          // longer plans switch to one column per week
  var MAX_GANTT_COLS = 540;        // hard cap on timeline columns (guards pathological far-future dates)
  var STATUSES = ["Done", "In progress", "Not started", "N/A"];

  var C = {
    ink: "1A1A1A", text: "3D3D3D", mid: "666666", soft: "8A8A8A", line: "E3E3E3",
    hair: "ECECEC", faint: "F5F5F5", white: "FFFFFF",
    orange: "FF6200", orangeInk: "B34200", orangeStrong: "C24A00",
    orangePale: "FFF0E6", orangeFaint: "FFF8F3", input: "FFF4CC",
    doneFill: "C6EFCE", doneInk: "0A7A4A", doneBar: "00A86B",
    progFill: "FFE8C2", progInk: "8A5A00", progBar: "E69500",
    todoFill: "E7E7E7", todoInk: "666666", todoBar: "CBCBCB",
    naBg: "EFEFEF", naLine: "A6A6A6",
    weekend: "F2F2F2", todayTint: "FFF3E6", todayLine: "FF6200",
    red: "C62828", redPale: "FDE4E4", dark: "1A1A1A"
  };

  /* ── tiny helpers ───────────────────────────────────────── */

  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function isArr(v) { return Object.prototype.toString.call(v) === "[object Array]"; }
  function isDate(v) { return Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime()); }
  function trim(s) { return String(s == null ? "" : s).replace(/^\s+|\s+$/g, ""); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function X() {
    var x = root.KBXlsx;
    if (!x || typeof x.Workbook !== "function") { throw new Error("KBPlannerExport: xlsx-writer.js (KBXlsx) is not loaded"); }
    return x;
  }

  function cleanStr(v, max) {
    if (typeof v !== "string") { v = v == null ? "" : String(v); }
    v = trim(v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " "));
    return v.length > max ? v.substring(0, max) : v;
  }
  function cleanNotes(v, max) {
    if (typeof v !== "string") { return ""; }
    v = v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
    return v.length > max ? v.substring(0, max) : v;
  }

  /* ── dates (local calendar dates, midnight) ─────────────── */

  function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function today() { return dateOnly(new Date()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function isWeekend(d) { var w = d.getDay(); return w === 0 || w === 6; }
  function parseYmd(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof s === "string" ? trim(s) : "");
    if (!m) { return null; }
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) { return null; }
    return d;
  }
  function asDate(v) {
    if (isDate(v)) { return dateOnly(v); }
    return parseYmd(v);
  }
  function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function fmtDate(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function dayDiff(a, b) {
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  }
  function mondayOnOrBefore(d) { return addDays(d, -((d.getDay() + 6) % 7)); }

  /* ── normalise the incoming plan ────────────────────────── */

  function normStatus(s) {
    s = trim(s);
    for (var i = 0; i < STATUSES.length; i++) {
      if (s.toLowerCase() === STATUSES[i].toLowerCase()) { return STATUSES[i]; }
    }
    if (/^n[\/\.\-\s]?a$/i.test(s)) { return "N/A"; }
    return "Not started";
  }

  function normPlan(src) {
    src = src || {};
    var start = parseYmd(src.start) || today();
    var acts = isArr(src.activities) ? src.activities : [];
    var out = {
      title: cleanStr(src.title, 140) || "Delivery plan",
      address: cleanStr(src.address, 200),
      dpm: cleanStr(src.dpm, 100),
      service: cleanStr(src.service, 80),
      start: start,
      target: parseYmd(src.target),
      today: isDate(src.today) ? dateOnly(src.today) : today(),
      activities: []
    };
    var i, a, s, e, wd;
    for (i = 0; i < acts.length && out.activities.length < 400; i++) {
      a = acts[i] || {};
      s = asDate(a.start);
      e = asDate(a.end);
      wd = typeof a.workDays === "number" && isFinite(a.workDays) ? Math.max(0, Math.round(a.workDays)) : 1;
      if (!s) { s = start; }
      if (!e || e < s) { e = s; }
      out.activities.push({
        n: out.activities.length + 1,
        activity: cleanStr(a.activity, 300) || "Activity " + (out.activities.length + 1),
        owner: cleanStr(a.owner, 120),
        workDays: wd,
        status: normStatus(a.status),
        start: s,
        end: e,
        notes: cleanNotes(a.notes, 2000)
      });
    }
    return out;
  }

  /* ── progress + go-live ─────────────────────────────────── */

  function summarise(plan) {
    var applicable = 0, done = 0, inProg = 0, last = null, i, a;
    for (i = 0; i < plan.activities.length; i++) {
      a = plan.activities[i];
      if (a.status === "N/A") { continue; }
      applicable++;
      if (a.status === "Done") { done++; }
      else if (a.status === "In progress") { inProg++; }
      if (!last || a.end > last) { last = a.end; }
    }
    return {
      applicable: applicable, done: done, inProgress: inProg,
      pct: applicable ? done / applicable : 1,
      goLive: last
    };
  }

  /* ── text layout estimates ──────────────────────────────── */

  function estLines(text, width, size, bold) {
    if (text == null || text === "") { return 1; }
    var f = size <= 8 ? 1.5 : size <= 9 ? 1.36 : size <= 10 ? 1.22 : size <= 11 ? 1.1 : 11.5 / size;
    var cpl = Math.max(3, Math.floor(width * f * (bold ? 0.9 : 1)));
    var paras = String(text).split("\n"), n = 0, i;
    for (i = 0; i < paras.length; i++) { n += Math.max(1, Math.ceil(paras[i].length / cpl)); }
    return n;
  }
  function heightFor(lines, size, min) {
    var lh = size <= 8 ? 11 : size <= 9 ? 12 : size <= 10 ? 13.2 : size <= 11 ? 14.6 : size * 1.33;
    var h = lines * lh + 5;
    if (min && h < min) { h = min; }
    return Math.min(409, Math.ceil(h * 4) / 4);
  }

  /* ── the timeline columns ───────────────────────────────── */

  function buildTimeline(plan) {
    var first = mondayOnOrBefore(plan.start), i, a, s, e;
    var last = plan.start;
    for (i = 0; i < plan.activities.length; i++) {
      a = plan.activities[i];
      if (a.status === "N/A") { continue; }
      if (a.end > last) { last = a.end; }
      if (a.start > last) { last = a.start; }
    }
    if (plan.target && plan.target > last) { last = plan.target; }
    if (plan.today > last) { last = plan.today; }
    // extend to the end of that week (Sunday), plus a few days
    last = addDays(last, 3);
    last = addDays(last, (7 - last.getDay()) % 7);
    var nDays = dayDiff(first, last) + 1;
    var weekly = nDays > MAX_DAY_COLS;
    var step = weekly ? 7 : 1;
    var nCols = weekly ? Math.ceil(nDays / 7) : nDays;
    if (nCols > MAX_GANTT_COLS) { nCols = MAX_GANTT_COLS; }
    var colDate = [];
    for (i = 0; i < nCols; i++) { colDate.push(addDays(first, i * step)); }
    return { first: first, last: last, weekly: weekly, step: step, nCols: nCols, colDate: colDate };
  }

  function inCol(tl, k, d) {
    if (!d) { return false; }
    var a = tl.colDate[k];
    return tl.weekly ? (d >= a && d <= addDays(a, 6)) : dayDiff(a, d) === 0;
  }
  function barInCol(tl, k, s, e) {        // is day-column k covered by [s,e]?
    var a = tl.colDate[k], b = tl.weekly ? addDays(a, 6) : a;
    return e >= a && s <= b;
  }
  function colIsWeekend(tl, k) { return !tl.weekly && isWeekend(tl.colDate[k]); }
  function colIsToday(tl, k, now) { return inCol(tl, k, now); }

  /* ── the workbook ───────────────────────────────────────── */

  function buildWorkbook(plan) {
    var XL = X();
    var p = normPlan(plan);
    var sum = summarise(p);
    var tl = buildTimeline(p);
    var now = p.today;

    var wb = new XL.Workbook({
      title: "Delivery plan — " + p.title,
      subject: "Delivery plan" + (p.service ? " · " + p.service : ""),
      creator: "DPM Knowledge Base",
      description: "Customer-facing delivery plan with a Gantt chart, exported from the DPM Knowledge Base on " + fmtDate(now) + ".",
      keywords: "DPM; delivery plan; Gantt; site plan",
      created: new Date()
    });

    var ws = wb.sheet("Delivery Plan", {
      tabColor: C.orange, showGrid: false, zoom: 90,
      freeze: { row: 7, col: 8 },
      landscape: true, fitWidth: 1, paper: "A4", printTitleRows: "1:7",
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4 },
      footer: "&L&8DPM Knowledge Base&R&8Page &P of &N"
    });

    writeSheet(wb, ws, p, sum, tl, now);
    return wb.toBytes();
  }

  var COL = { num: 1, act: 2, owner: 3, start: 4, end: 5, days: 6, status: 7, notes: 8 };
  var T0 = 9;                        // first timeline column (I)
  var COL_W = [0, 4.5, 40, 16, 12, 12, 7, 13, 30];

  function writeSheet(wb, ws, p, sum, tl, now) {
    var XL = X(), st, i, c, r, k;
    function S(spec) { return wb.style(spec); }

    var hair = { style: "hair", color: "D9D9D9" };
    var rowLine = { style: "hair", color: "E6E6E6" };

    for (c = 1; c <= COL.notes; c++) { ws.col(c, { width: COL_W[c] }); }
    var TL = T0 + tl.nCols - 1;
    for (c = T0; c <= TL; c++) { ws.col(c, { width: tl.weekly ? 4.4 : 2.8 }); }

    /* ── styles ── */
    var sTitle = S({ font: { size: 18, bold: true, color: C.ink }, align: { v: "center", indent: 1 } });
    var sTitleBand = S({ fill: C.dark });
    var sLabel = S({ font: { size: 9.5, bold: true, color: C.white }, fill: C.orangeStrong, align: { v: "center", indent: 1 } });
    var sValue = S({ font: { size: 11, color: C.ink }, border: { bottom: hair }, align: { v: "center", indent: 1, wrap: true } });
    var sValueBold = S({ font: { size: 11, bold: true, color: C.ink }, border: { bottom: hair }, align: { v: "center", indent: 1 } });
    var sValDate = S({ font: { size: 11, bold: true, color: C.ink }, border: { bottom: hair }, align: { h: "left", v: "center", indent: 1 }, numFmt: "d mmm yyyy" });
    var sValMuted = S({ font: { size: 10, italic: true, color: C.soft }, border: { bottom: hair }, align: { v: "center", indent: 1 } });
    var sGoLive = S({ font: { size: 11, bold: true, color: C.doneInk }, border: { bottom: hair }, align: { h: "left", v: "center", indent: 1 }, numFmt: "d mmm yyyy" });
    var sGoLiveLate = S({ font: { size: 11, bold: true, color: C.red }, fill: C.redPale, border: { bottom: hair }, align: { h: "left", v: "center", indent: 1 }, numFmt: "d mmm yyyy" });

    // table header
    var sHeadL = S({ font: { size: 10, bold: true, color: C.white }, fill: C.dark, border: { bottom: { style: "medium", color: C.orange } }, align: { v: "center", indent: 1 } });
    var sHeadC = S({ font: { size: 10, bold: true, color: C.white }, fill: C.dark, border: { bottom: { style: "medium", color: C.orange } }, align: { h: "center", v: "center", wrap: true } });

    // body cells (left block)
    var sNum = S({ font: { size: 10, bold: true, color: C.mid }, border: { bottom: rowLine }, align: { h: "center", v: "center" } });
    var sAct = S({ font: { size: 10, color: C.ink }, border: { bottom: rowLine }, align: { v: "center", wrap: true, indent: 1 } });
    var sOwner = S({ font: { size: 9.5, color: C.mid }, border: { bottom: rowLine }, align: { v: "center", wrap: true, indent: 1 } });
    var sDate = S({ font: { size: 9.5, color: C.text }, border: { bottom: rowLine }, align: { h: "center", v: "center" }, numFmt: "d mmm" });
    var sDays = S({ font: { size: 9.5, color: C.text }, border: { bottom: rowLine }, align: { h: "center", v: "center" } });
    var sNotes = S({ font: { size: 9.5, color: C.text }, fill: "FFFCF2", border: { bottom: rowLine, left: { style: "hair", color: "E5DDC5" } }, align: { v: "center", wrap: true, indent: 1 } });
    var sStatusStyle = {
      "Done": S({ font: { size: 9.5, bold: true, color: C.doneInk }, fill: C.doneFill, border: { bottom: rowLine }, align: { h: "center", v: "center" } }),
      "In progress": S({ font: { size: 9.5, bold: true, color: C.progInk }, fill: C.progFill, border: { bottom: rowLine }, align: { h: "center", v: "center" } }),
      "Not started": S({ font: { size: 9.5, bold: true, color: C.todoInk }, fill: C.todoFill, border: { bottom: rowLine }, align: { h: "center", v: "center" } }),
      "N/A": S({ font: { size: 9.5, italic: true, color: C.mid }, fill: C.naBg, border: { bottom: rowLine }, align: { h: "center", v: "center" } })
    };

    // date band (day columns)
    var sMonth = S({ font: { size: 8.5, bold: true, color: C.white }, fill: C.dark, align: { h: "left", v: "center" } });
    var sDayN = S({ font: { size: 8, color: C.white }, fill: "2E2E2E", align: { h: "center", v: "center" }, numFmt: tl.weekly ? "d/m" : "d", border: { left: { style: "hair", color: "555555" } } });
    var sDayNWe = S({ font: { size: 8, color: "9A9A9A" }, fill: "2E2E2E", align: { h: "center", v: "center" }, numFmt: "d", border: { left: { style: "hair", color: "555555" } } });
    var sWd = S({ font: { size: 8, color: "D0D0D0" }, fill: "3D3D3D", align: { h: "center", v: "center" }, border: { left: { style: "hair", color: "555555" } } });
    var sWdWe = S({ font: { size: 8, color: "8A8A8A" }, fill: "3D3D3D", align: { h: "center", v: "center" }, border: { left: { style: "hair", color: "555555" } } });

    // gantt body cell styles, precomputed per column and per status
    // plain / weekend / today variants, plus bar fills
    function bodyCell(k, barFill, mon) {
      var spec = { border: { bottom: rowLine } };
      if (mon) { spec.border.left = { style: "thin", color: "D4D4D4" }; }
      if (barFill) {
        if (barFill === "na") { spec.fill = { pattern: "lightUp", color: C.naLine, bg: C.naBg }; }
        else { spec.fill = barFill; }
      } else if (colIsWeekend(tl, k)) {
        spec.fill = C.weekend;
      } else if (colIsToday(tl, k, now)) {
        spec.fill = C.todayTint;
      }
      if (colIsToday(tl, k, now)) {
        spec.border.left = { style: "thin", color: C.todayLine };
        spec.border.right = { style: "thin", color: C.todayLine };
      }
      return S(spec);
    }
    // cache styles: key = k + "|" + fill
    var cellCache = {};
    function cellStyle(k, fill) {
      var mon = tl.weekly || tl.colDate[k].getDay() === 1;
      var key = k + "|" + (fill || "");
      if (!has(cellCache, key)) { cellCache[key] = bodyCell(k, fill, mon); }
      return cellCache[key];
    }
    function barFillFor(status) {
      if (status === "Done") { return C.doneBar; }
      if (status === "In progress") { return C.progBar; }
      if (status === "N/A") { return "na"; }
      return C.todoBar;      // Not started
    }

    /* ── row 1: title band ── */
    for (c = T0; c <= TL; c++) { ws.set(1, c, null, sTitleBand); }
    ws.set(1, 1, p.title, sTitle).merge(1, 1, 1, COL.notes);
    ws.row(1, { height: 30 });

    /* ── rows 2–5: info block (left) + date band (day columns) ── */
    function infoRow(row, label, value, valueStyle) {
      ws.set(row, 1, label, sLabel);
      if (value === "" || value == null) { ws.set(row, 2, "Not set", sValMuted); }
      else { ws.set(row, 2, value, valueStyle || sValue); }
      ws.merge(row, 2, row, COL.notes);
    }

    // row 2: Site + MONTH labels across the day band
    infoRow(2, "Site", p.address, sValue);
    ws.row(2, { height: 18 });
    // row 3: Progress + day numbers
    var progText = sum.done + " of " + sum.applicable + (sum.applicable === 1 ? " activity done" : " activities done") +
      " (" + Math.round(sum.pct * 100) + "%)" +
      (sum.inProgress ? "  ·  " + sum.inProgress + " in progress" : "");
    infoRow(3, "Progress", progText, sValueBold);
    ws.row(3, { height: 18 });
    // row 4: Today
    infoRow(4, "Today", now, sValDate);
    ws.row(4, { height: 18 });
    // row 5: DPM (+ service / target)
    var dpmLine = p.dpm || "";
    if (p.service) { dpmLine += (dpmLine ? "   ·   " : "") + "Service: " + p.service; }
    if (p.target) { dpmLine += (dpmLine ? "   ·   " : "") + "Target: " + fmtDate(p.target); }
    infoRow(5, "DPM", dpmLine || "", sValue);
    ws.row(5, { height: 18 });

    // the date band lives in the day columns on rows 2 (month), 3 (day number),
    // 4 (weekday letter); rows 1 & 5 keep the dark band look
    var prevMonth = -1;
    for (k = 0; k < tl.nCols; k++) {
      c = T0 + k;
      var d = tl.colDate[k], we = colIsWeekend(tl, k);
      // month label on the first column and whenever the month changes
      var showMonth = (k === 0) || (d.getMonth() !== prevMonth && (tl.weekly || d.getDate() <= 7));
      if (!tl.weekly && d.getMonth() !== prevMonth) { showMonth = true; }
      ws.set(2, c, showMonth ? (MONTHS[d.getMonth()] + " ’" + String(d.getFullYear()).substring(2)) : null, sMonth);
      prevMonth = d.getMonth();
      ws.set(3, c, d, we ? sDayNWe : sDayN);
      if (!tl.weekly) { ws.set(4, c, DAY_LETTERS[d.getDay()], we ? sWdWe : sWd); }
      else { ws.set(4, c, null, sWd); }
      // rows 1 & 5 day cells keep the band tone
      ws.set(5, c, null, we ? sWdWe : sWd);
    }

    /* ── row 6: spacer ── */
    ws.row(6, { height: 6 });

    /* ── row 7: table header + date header above the gantt ── */
    var heads = ["#", "Activity", "Owner", "Start", "End", "Work days", "Status", "Notes"];
    for (c = 1; c <= COL.notes; c++) {
      ws.set(7, c, heads[c - 1], (c === COL.num || (c >= COL.start && c <= COL.status)) ? sHeadC : sHeadL);
    }
    for (k = 0; k < tl.nCols; k++) {
      c = T0 + k;
      var d7 = tl.colDate[k], we7 = colIsWeekend(tl, k);
      ws.set(7, c, d7, we7 ? sDayNWe : sDayN);
    }
    ws.row(7, { height: 26 });

    /* ── activity rows ── */
    r = 8;
    var first = r;
    for (i = 0; i < p.activities.length; i++) {
      var a = p.activities[i];
      ws.set(r, COL.num, a.n, sNum);
      ws.set(r, COL.act, a.activity, sAct);
      ws.set(r, COL.owner, a.owner || null, sOwner);
      ws.set(r, COL.start, a.start, sDate);
      ws.set(r, COL.end, a.end, sDate);
      ws.set(r, COL.days, a.workDays, sDays);
      ws.set(r, COL.status, a.status, sStatusStyle[a.status]);
      ws.set(r, COL.notes, a.notes || null, sNotes);
      // gantt bar
      var bar = barFillFor(a.status);
      for (k = 0; k < tl.nCols; k++) {
        var covered = barInCol(tl, k, a.start, a.end);
        ws.set(r, T0 + k, null, cellStyle(k, covered ? bar : null));
      }
      ws.row(r, { height: heightFor(Math.max(
        estLines(a.activity, COL_W[COL.act] - 2, 10),
        estLines(a.owner, COL_W[COL.owner] - 2, 9.5),
        estLines(a.notes, COL_W[COL.notes] - 2, 9.5)), 10, 18) });
      r++;
    }
    if (!p.activities.length) {
      ws.set(r, 1, "No activities yet — add rows in the planner before exporting.", sValMuted).merge(r, 1, r, COL.notes);
      ws.row(r, { height: 20 });
      r++;
    }
    var lastRow = r - 1;

    /* ── go-live summary line under the table ── */
    r = lastRow + 2;
    var late = sum.goLive && p.target && sum.goLive > p.target;
    ws.set(r, 1, "Estimated go-live", S({ font: { size: 10, bold: true, color: C.ink }, align: { v: "center", indent: 1 } })).merge(r, 1, r, COL.owner);
    if (sum.goLive) {
      ws.set(r, COL.start, sum.goLive, late ? sGoLiveLate : sGoLive).merge(r, COL.start, r, COL.notes);
    } else {
      ws.set(r, COL.start, "No applicable activities", sValMuted).merge(r, COL.start, r, COL.notes);
    }
    ws.row(r, { height: 20 });
    r++;
    if (late) {
      ws.set(r, 1, "⚠ Later than the target date of " + fmtDate(p.target) + ".",
        S({ font: { size: 9.5, bold: true, color: C.red }, align: { v: "center", indent: 1 } })).merge(r, 1, r, COL.notes);
      ws.row(r, { height: 18 });
      r++;
    } else if (p.target && sum.goLive) {
      ws.set(r, 1, "On or before the target date of " + fmtDate(p.target) + ".",
        S({ font: { size: 9.5, color: C.doneInk }, align: { v: "center", indent: 1 } })).merge(r, 1, r, COL.notes);
      ws.row(r, { height: 18 });
      r++;
    }

    /* ── legend ── */
    r += 1;
    ws.set(r, 1, "Legend", S({ font: { size: 10, bold: true, color: C.ink }, align: { v: "center", indent: 1 } })).merge(r, 1, r, COL.notes);
    ws.row(r, { height: 20 });
    r++;
    var swatchFns = {
      solid: function (fill) { return S({ fill: fill, border: { all: { style: "thin", color: C.white } } }); },
      na: function () { return S({ fill: { pattern: "lightUp", color: C.naLine, bg: C.naBg }, border: { all: { style: "thin", color: C.white } } }); },
      today: function () { return S({ fill: C.todayTint, border: { left: { style: "thin", color: C.todayLine }, right: { style: "thin", color: C.todayLine } } }); },
      weekend: function () { return S({ fill: C.weekend, border: { all: { style: "thin", color: C.white } } }); }
    };
    var legend = [
      [swatchFns.solid(C.doneBar), "Done"],
      [swatchFns.solid(C.progBar), "In progress"],
      [swatchFns.solid(C.todoBar), "Not started"],
      [swatchFns.na(), "Not applicable (N/A)"],
      [swatchFns.today(), "Today (" + fmtDate(now) + ")"]
    ];
    if (!tl.weekly) { legend.push([swatchFns.weekend(), "Weekend"]); }
    var sLegLbl = S({ font: { size: 9.5, color: C.text }, align: { v: "center", indent: 1 } });
    for (i = 0; i < legend.length; i++) {
      ws.set(r, 1, null, legend[i][0]);
      ws.set(r, 2, legend[i][1], sLegLbl).merge(r, 2, r, COL.status);
      ws.row(r, { height: 17 });
      r++;
    }
    r++;
    ws.set(r, 1, "Working days are Monday–Friday (no public holidays). Indicative plan — generated by the DPM Knowledge Base on " + fmtDate(now) + ".",
      S({ font: { size: 9, italic: true, color: C.soft }, align: { v: "center", indent: 1, wrap: true } })).merge(r, 1, r, COL.notes);
    ws.row(r, { height: 28 });
  }

  /* ── file name + download ───────────────────────────────── */

  function slug(s) {
    s = String(s || "");
    if (typeof s.normalize === "function") { try { s = s.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), ""); } catch (e) { /* ignore */ } }
    s = s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (s.length > 40) { s = s.substring(0, 40).replace(/-+$/, ""); }
    return s || "plan";
  }
  function fileName(plan, now) {
    var d = isDate(now) ? now : new Date();
    return "Delivery-Plan_" + slug(plan && plan.title) + "_" + ymd(dateOnly(d)) + ".xlsx";
  }

  function download(plan) {
    var url = null;
    try {
      var bytes = buildWorkbook(plan);
      var name = fileName(plan);
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
      if (root.console && root.console.error) { root.console.error("Delivery plan export failed:", e); }
      return false;
    }
  }

  root.KBPlannerExport = {
    version: 1,
    buildWorkbook: buildWorkbook,
    fileName: fileName,
    download: download
  };
})(typeof window !== "undefined" ? window : this);
