/* ═══════════════════════════════════════════════════════════════
   DPM Knowledge Base — Delivery Planner → Excel export
   ───────────────────────────────────────────────────────────────
   Builds a LIVE, interactive, multi-sheet .xlsx workbook for one
   delivery plan, in the browser, with no libraries (uses
   xlsx-writer.js → KBXlsx). It is built to feel like the Delivery
   Checklist tracker the DPMs already share with customers: the plan
   is a working model, not a flat snapshot.

   Sheets
     1. Overview   title, site, DPM, service; an editable "Planning
                   from" date (input, named PlanStart) and an optional
                   Target go-live (PlanTarget); a LIVE earliest-
                   migration date, progress % and status tally; what's
                   left next; and how to use the file.
     2. Plan       one row per activity with a Status DROPDOWN, an
                   editable Work-days number, and Start / End as
                   WORKDAY FORMULAS. Status colours the cell and the
                   row with conditional formatting; auto-filter on.
                   Change a status, a day count or the start date and
                   every date, the progress and the Gantt recompute.
     3. Gantt      a day-by-day (or weekly) timeline whose bars are
                   drawn with CONDITIONAL FORMATTING tied to each
                   activity's Start/End and Status — so they move with
                   the plan. Weekends shaded, today + target marked.
     4. RACI       the handbook RACI matrix (who does what).

   How the dates work (same model as the planner page)
     PlanStart (default today) is the "as of" line. Remaining steps
     (In progress / Not started) are scheduled FORWARD from it in
     working days, chained in order — the last one's End is the
     earliest migration date. Steps marked Done are placed in the
     PAST (packed backward before the as-of line) so the chart reads
     like a full history; they add no future time. N/A steps get no
     bar and shift nothing. All of this is expressed as live Excel
     formulas, so editing the sheet re-plans it.

   API — window.KBPlannerExport
     buildWorkbook(plan)        → Uint8Array (no DOM)
     fileName(plan[, now])      → "Delivery-Plan_<slug>_<YYYY-MM-DD>.xlsx"
     download(plan)             → builds + saves the file; true / false

   plan = {
     title, address, dpm, service,   strings (service is a label)
     start,  "YYYY-MM-DD"             planning-from / kick-off date
     target, "YYYY-MM-DD"             optional go-live / target date
     activities: [ { activity, owner, workDays, status, notes } ],
     today   Date (optional; defaults to now)
   }
   (start / end on an activity, if present, are ignored — the export
   computes them itself so the file is self-contained and testable.)

   Written in plain ES3/ES5 (no let/const/arrow/forEach/Object.keys/
   JSON/trim) so it also passes the Chakra ES5 check and runs under
   Windows Script Host. All user text goes into cells as text — never
   into a formula.
═══════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";

  /* ── constants ──────────────────────────────────────────── */

  var STATUSES = ["Done", "In progress", "Not started", "N/A"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  var MAX_DAY_COLS = 120;          // longer plans switch to one column per week
  var MAX_GANTT_COLS = 540;        // hard cap on timeline columns (guards far-future dates)
  var MAX_WD = 1000;               // cap per-activity work days (~4 years)
  var MAX_ACTS = 400;
  var BAR = "█", BAR_EMPTY = "░";   // █ ░

  var K = {
    dark: "1A1A1A", text: "3D3D3D", mid: "666666", soft: "8A8A8A", line: "E3E3E3",
    hair: "ECECEC", faint: "F5F5F5", white: "FFFFFF", orange: "FF6200",
    orangeInk: "B34200", orangeStrong: "C24A00", orangeTint: "FFD2B3", orangePale: "FFF0E6",
    orangeFaint: "FFF8F3", input: "FFF4CC", red: "C62828", redPale: "FDE4E4",
    green: "0A7A4A", greenPale: "E6F7F1", greenBar: "00A86B",
    amberInk: "8A5A00", amberPale: "FFF1D6", amber: "FFD890", amberBar: "E69500",
    blueInk: "0B6A93", bluePale: "E8F6FD",
    todoBar: "CBCBCB", todoFill: "E7E7E7", todoInk: "666666",
    weekend: "F2F2F2", naBg: "EFEFEF", naLine: "A6A6A6"
  };

  /* The handbook RACI matrix (copied from raci.html / the checklist export). */
  var RACI_ROLES = ["DPM", "PM", "SC", "VPO / TIM", "FE", "Supply Chain", "Customer"];
  var RACI = [
    ["Scope, BOM & commercial coordination", "C", "A/R", "C", "-", "-", "-", "C"],
    ["GOLD / SALTO order creation & accuracy", "A/R", "C", "-", "-", "-", "-", "-"],
    ["Hardware ordering, EDD & shipping", "A", "I", "-", "-", "-", "R", "I"],
    ["Runbook & LLD preparation", "C", "-", "A/R", "C", "-", "-", "C"],
    ["Staging & migration date selection", "A/R", "I", "-", "C", "-", "-", "C"],
    ["MACHX raises (VPO work orders)", "A/R", "-", "-", "I", "-", "-", "-"],
    ["Field Engineer booking (FLIP)", "A/R", "-", "-", "-", "I", "-", "-"],
    ["Change request (ServiceNow)", "A/R", "I", "-", "C", "-", "-", "I"],
    ["Staging execution", "A", "-", "C", "R", "-", "-", "C"],
    ["Dry run", "A", "-", "C", "R", "-", "-", "C"],
    ["Migration / cutover execution", "A", "I", "C", "R", "R", "-", "C"],
    ["User Acceptance Testing (UAT)", "A", "-", "-", "C", "-", "-", "R"],
    ["Success notification & status comms", "A/R", "I", "-", "-", "-", "-", "I"],
    ["DNAC / CMDB updates", "A/R", "-", "-", "C", "-", "-", "-"],
    ["HOTO package & sign-off", "A/R", "I", "C", "C", "-", "-", "I"],
    ["GOLD / SALTO order closure", "A/R", "I", "-", "-", "-", "-", "-"]
  ];
  var RACI_PEOPLE = [
    ["DPM — you", "Accountable for the delivery end-to-end."],
    ["PM", "Project Manager — scope & commercial owner."],
    ["SC", "Solution Consultant — technical design owner."],
    ["VPO / TIM", "Engineering & staging, requested via MACHX."],
    ["FE", "Field Engineer — hands on site."],
    ["Supply Chain", "Hardware & logistics."]
  ];
  var GOLDEN_RULE = "The DPM is accountable for the delivery end-to-end — the dates, the MACHX raises, " +
    "the Field Engineer dispatch, and the HOTO package are yours. The PM owns scope, BOM and the commercial " +
    "relationship; the SC owns the design (runbook & LLD). Keeping these boundaries clear is what keeps a delivery calm.";

  /* ── tiny helpers ───────────────────────────────────────── */

  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function isArr(v) { return Object.prototype.toString.call(v) === "[object Array]"; }
  function isDate(v) { return Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime()); }
  function trim(s) { return String(s == null ? "" : s).replace(/^\s+|\s+$/g, ""); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function rep(s, n) { var o = ""; while (n-- > 0) { o += s; } return o; }

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
  function rollToWorkday(d) { d = dateOnly(d); while (isWeekend(d)) { d = addDays(d, 1); } return d; }
  function addWorkdays(d, n) { var x = rollToWorkday(d); while (n > 0) { x = addDays(x, 1); if (!isWeekend(x)) { n--; } } return x; }
  function rollBackToWorkday(d) { d = dateOnly(d); while (isWeekend(d)) { d = addDays(d, -1); } return d; }
  function addWorkdaysBack(d, n) { var x = rollBackToWorkday(d); while (n > 0) { x = addDays(x, -1); if (!isWeekend(x)) { n--; } } return x; }
  function mondayOnOrBefore(d) { return addDays(d, -((d.getDay() + 6) % 7)); }
  function parseYmd(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof s === "string" ? trim(s) : "");
    if (!m) { return null; }
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) { return null; }
    return d;
  }
  function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function fmtDate(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function dayDiff(a, b) {
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  }

  /* ── normalise the incoming plan ────────────────────────── */

  function normStatus(s) {
    s = trim(s);
    for (var i = 0; i < STATUSES.length; i++) { if (s.toLowerCase() === STATUSES[i].toLowerCase()) { return STATUSES[i]; } }
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
    var i, a, wd;
    for (i = 0; i < acts.length && out.activities.length < MAX_ACTS; i++) {
      a = acts[i] || {};
      wd = (typeof a.workDays === "number" && isFinite(a.workDays)) ? Math.max(0, Math.round(a.workDays)) : parseInt(a.workDays, 10);
      if (isNaN(wd) || wd < 0) { wd = 1; }
      if (wd > MAX_WD) { wd = MAX_WD; }
      out.activities.push({
        n: out.activities.length + 1,
        activity: cleanStr(a.activity, 300) || "Activity " + (out.activities.length + 1),
        owner: cleanStr(a.owner, 120),
        workDays: wd,
        status: normStatus(a.status),
        notes: cleanNotes(a.notes, 2000)
      });
    }
    return out;
  }

  /* ── scheduler (cached values; the live formulas mirror this) ── */

  /* The cached values MUST match the live Excel formulas (startFormula /
     endFormula), so this uses the same cumulative-work-days model:
       remaining step i starts  WORKDAY(asOf-1, 1 + Σ days of remaining above)
       done step i ends         WORKDAY(asOf, -1 - Σ days of done below)
     A 0-day step is a milestone — it consumes no working day and shifts
     nothing. */
  function schedule(p) {
    var asOf = rollToWorkday(p.start);
    var acts = p.activities, out = new Array(acts.length), i, a, s, e;
    var cum = 0;                 // cumulative work-days of remaining steps already placed
    for (i = 0; i < acts.length; i++) {
      a = acts[i];
      if (a.status === "Done") { continue; }
      if (a.status === "N/A") { out[i] = { start: null, end: null, na: true }; continue; }
      s = addWorkdays(asOf, cum);
      e = (a.workDays <= 0) ? s : addWorkdays(s, a.workDays - 1);
      out[i] = { start: s, end: e, done: false };
      cum += a.workDays;
    }
    var doneAfter = 0;           // work-days of Done steps already placed (all below this row)
    for (i = acts.length - 1; i >= 0; i--) {
      a = acts[i];
      if (a.status !== "Done") { continue; }
      e = addWorkdaysBack(asOf, 1 + doneAfter);
      s = (a.workDays <= 1) ? e : addWorkdaysBack(e, a.workDays - 1);
      out[i] = { start: s, end: e, done: true };
      doneAfter += a.workDays;
    }
    return out;
  }
  function summarise(p, derived) {
    var applicable = 0, done = 0, inProg = 0, notStarted = 0, na = 0, last = null, i, a;
    for (i = 0; i < p.activities.length; i++) {
      a = p.activities[i];
      if (a.status === "N/A") { na++; continue; }
      applicable++;
      if (a.status === "Done") { done++; continue; }
      if (a.status === "In progress") { inProg++; } else { notStarted++; }
      if (derived[i] && derived[i].end && (!last || derived[i].end > last)) { last = derived[i].end; }
    }
    return {
      applicable: applicable, done: done, inProgress: inProg, notStarted: notStarted, na: na,
      remaining: inProg + notStarted, total: p.activities.length,
      pct: applicable ? done / applicable : 1, goLive: last
    };
  }

  /* ── text layout estimates (Excel doesn't auto-fit rows on open) ── */

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

  /* ── timeline columns ───────────────────────────────────── */

  function buildTimeline(p, derived) {
    var asOf = rollToWorkday(p.start);       // the "as of" line = PlanStart in the file
    var earliest = asOf, latest = asOf, i, d;
    for (i = 0; i < derived.length; i++) {
      d = derived[i];
      if (!d || d.na) { continue; }
      if (d.start && d.start < earliest) { earliest = d.start; }
      if (d.end && d.end > latest) { latest = d.end; }
      if (d.start && d.start > latest) { latest = d.start; }
    }
    if (p.target && p.target > latest) { latest = p.target; }
    if (p.target && p.target < earliest) { earliest = p.target; }
    if (p.today > latest) { latest = p.today; }
    if (p.today < earliest) { earliest = p.today; }
    var first = mondayOnOrBefore(earliest);
    var last = addDays(latest, 3);
    last = addDays(last, (7 - last.getDay()) % 7);          // to end of that week (Sunday)
    var nDays = dayDiff(first, last) + 1;
    var weekly = nDays > MAX_DAY_COLS;
    var step = weekly ? 7 : 1;
    var nCols = weekly ? Math.ceil(nDays / 7) : nDays;
    if (nCols > MAX_GANTT_COLS && weekly) {
      // a very long plan overflows the column cap. Keep the most RECENT window
      // (an old Done backlog is what overflows) by moving the first column forward,
      // but never start later than the as-of week or today, so PlanStart, today,
      // the remaining bars and the target all stay on the chart.
      nCols = MAX_GANTT_COLS;
      var keepFrom = mondayOnOrBefore(addDays(last, -(MAX_GANTT_COLS - 1) * 7));
      var guard = mondayOnOrBefore(asOf);
      if (p.today < guard) { guard = mondayOnOrBefore(p.today); }
      if (keepFrom > guard) { keepFrom = guard; }
      first = keepFrom;
    } else if (nCols > MAX_GANTT_COLS) {
      nCols = MAX_GANTT_COLS;
    }
    var colDate = [];
    for (i = 0; i < nCols; i++) { colDate.push(addDays(first, i * step)); }
    // whole weeks from the first column (a Monday) back to the as-of Monday, so the
    // live header (anchored to PlanStart) lines up with these cached column dates
    var weeksBack = Math.round(dayDiff(first, mondayOnOrBefore(asOf)) / 7);
    return { first: first, last: last, weekly: weekly, step: step, nCols: nCols, colDate: colDate, weeksBack: weeksBack };
  }
  function colIsWeekend(tl, k) { return !tl.weekly && isWeekend(tl.colDate[k]); }
  function inCol(tl, k, d) {
    if (!d) { return false; }
    var a = tl.colDate[k];
    return tl.weekly ? (d >= a && d <= addDays(a, 6)) : dayDiff(a, d) === 0;
  }
  function barInCol(tl, k, s, e) {
    if (!s || !e) { return false; }
    var a = tl.colDate[k], b = tl.weekly ? addDays(a, 6) : a;
    return e >= a && s <= b;
  }

  /* ── shared styles ──────────────────────────────────────── */

  function makeStyles(wb) {
    var S = {}, st = function (spec) { return wb.style(spec); };
    S.st = st;
    var hair = { style: "hair", color: "D9D9D9" };
    var rowLine = { style: "hair", color: "E6E6E6" };
    S.hair = hair; S.rowLine = rowLine;

    S.band = st({ fill: K.orange });
    S.title = st({ font: { size: 20, bold: true, color: K.dark }, align: { v: "center" } });
    S.title16 = st({ font: { size: 16, bold: true, color: K.dark }, align: { v: "center" } });
    S.sub = st({ font: { size: 10.5, color: K.mid }, align: { v: "center" } });
    S.subWrap = st({ font: { size: 10, color: K.mid, italic: true }, align: { v: "center", wrap: true } });
    S.section = st({ font: { size: 12, bold: true, color: K.dark }, border: { left: { style: "thick", color: K.orange }, bottom: { style: "thin", color: K.orangeTint } }, align: { v: "center", indent: 1 } });
    S.sectionFill = st({ border: { bottom: { style: "thin", color: K.orangeTint } } });
    S.foot = st({ font: { size: 9, italic: true, color: K.soft }, align: { v: "center" } });

    // Overview details
    S.label = st({ font: { size: 10, bold: true, color: K.mid }, fill: "FAFAFA", border: { bottom: hair }, align: { v: "center", indent: 1 } });
    S.value = st({ font: { size: 11, color: K.dark }, border: { bottom: hair }, align: { v: "center", wrap: true } });
    S.valueBold = st({ font: { size: 11, bold: true, color: K.dark }, border: { bottom: hair }, align: { v: "center", wrap: true } });
    S.valueEmpty = st({ font: { size: 10, italic: true, color: "A0A0A0" }, border: { bottom: hair }, align: { v: "center" } });
    S.input = st({ font: { size: 11, bold: true, color: K.dark }, fill: K.input, border: { all: { style: "medium", color: K.orange } }, align: { h: "center", v: "center" }, numFmt: "d mmm yyyy" });
    S.inputSoft = st({ font: { size: 11, bold: true, color: K.dark }, fill: K.input, border: { all: { style: "thin", color: K.orange } }, align: { h: "center", v: "center" }, numFmt: "d mmm yyyy" });
    S.note = st({ font: { size: 10, italic: true, color: K.orangeInk }, border: { bottom: hair }, align: { v: "center", indent: 1, wrap: true } });
    S.noteGrey = st({ font: { size: 10, italic: true, color: K.mid }, border: { bottom: hair }, align: { v: "center", indent: 1, wrap: true } });
    S.migDate = st({ font: { size: 14, bold: true, color: K.green }, border: { bottom: hair }, align: { h: "left", v: "center", indent: 1 }, numFmt: "d mmm yyyy" });
    S.migText = st({ font: { size: 14, bold: true, color: K.green }, border: { bottom: hair }, align: { h: "left", v: "center", indent: 1 } });
    S.pctBig = st({ font: { size: 14, bold: true, color: K.orangeInk }, border: { bottom: hair }, align: { h: "center", v: "center" }, numFmt: "0%" });
    S.barBig = st({ font: { size: 12, color: K.orange }, border: { bottom: hair }, align: { v: "center", indent: 1 } });
    S.notes = st({ font: { size: 10.5, color: K.dark }, border: { all: { style: "thin", color: K.line } }, align: { v: "top", wrap: true, indent: 1 } });
    S.notesEmpty = st({ font: { size: 10, italic: true, color: "A0A0A0" }, border: { all: { style: "thin", color: K.line } }, align: { v: "top", wrap: true, indent: 1 } });
    S.howto = st({ font: { size: 10, color: K.text }, fill: K.orangeFaint, border: { left: { style: "thick", color: K.orange } }, align: { v: "center", wrap: true, indent: 1 } });

    // Overview "next up" table
    S.th = st({ font: { size: 9.5, bold: true, color: K.white }, fill: K.dark, align: { v: "center", indent: 1 } });
    S.thC = st({ font: { size: 9.5, bold: true, color: K.white }, fill: K.dark, align: { h: "center", v: "center", wrap: true } });
    S.tdText = st({ font: { size: 10, color: K.dark }, border: { bottom: hair }, align: { v: "center", wrap: true, indent: 1 } });
    S.tdMuted = st({ font: { size: 9.5, color: K.mid }, border: { bottom: hair }, align: { v: "center", wrap: true, indent: 1 } });
    S.tdDate = st({ font: { size: 10, color: K.text }, border: { bottom: hair }, align: { h: "center", v: "center" }, numFmt: "d mmm yyyy" });
    return S;
  }

  /* ═══ Sheet: Plan (the interactive tracker) ═══════════════ */

  var PL = { num: 1, act: 2, owner: 3, days: 4, status: 5, start: 6, end: 7, notes: 8 };
  var PL_W = [0, 5, 44, 20, 9.5, 14, 13, 13, 34];
  var PL_HEAD = 3, PL_FIRST = 4;

  function writePlan(ws, p, derived, S, wb) {
    var st = S.st, c, i, r;
    for (c = 1; c <= 8; c++) { ws.col(c, { width: PL_W[c] }); }
    var hair = S.hair, rowLine = S.rowLine;

    var sHead = st({ font: { size: 10, bold: true, color: K.white }, fill: K.dark, border: { bottom: { style: "medium", color: K.orange } }, align: { v: "center", indent: 1 } });
    var sHeadC = st({ font: { size: 10, bold: true, color: K.white }, fill: K.dark, border: { bottom: { style: "medium", color: K.orange } }, align: { h: "center", v: "center", wrap: true } });
    var sNum = st({ font: { size: 10, bold: true, color: K.mid }, border: { bottom: rowLine }, align: { h: "center", v: "center" } });
    var sAct = st({ font: { size: 10, color: K.dark }, border: { bottom: rowLine }, align: { v: "center", wrap: true, indent: 1 } });
    var sOwner = st({ font: { size: 9.5, color: K.mid }, border: { bottom: rowLine }, align: { v: "center", wrap: true, indent: 1 } });
    var sDaysIn = st({ font: { size: 10, bold: true, color: K.dark }, fill: K.input, border: { all: { style: "thin", color: K.orange } }, align: { h: "center", v: "center" } });
    var sStatus = st({ font: { size: 10, bold: true, color: K.text }, fill: K.white, border: { all: { style: "thin", color: "C8C8C8" } }, align: { h: "center", v: "center" } });
    var sDate = st({ font: { size: 9.5, color: K.text }, border: { bottom: rowLine }, align: { h: "center", v: "center" }, numFmt: "d mmm yyyy" });
    var sNotes = st({ font: { size: 9.5, color: K.dark }, fill: "FFFCF2", border: { bottom: rowLine, left: { style: "hair", color: "E5DDC5" } }, align: { v: "center", wrap: true, indent: 1 } });

    // title block
    ws.set(1, 1, "Plan — " + p.title, S.title16).merge(1, 1, 1, 3);
    ws.set(1, 4, "Pick each activity's Status from the dropdown and set its Work days. Start and End are working-day formulas from the “Planning from” date on the Overview sheet; " +
      "remaining steps run forward from it, Done steps sit before it. Change a status, a day count or that date and every date, the progress and the Gantt update by themselves.",
      S.subWrap).merge(1, 4, 2, 8);
    ws.set(2, 1, (p.service ? p.service + "  ·  " : "") + (p.address || ""), S.sub).merge(2, 1, 2, 3);
    ws.row(1, { height: 24 }); ws.row(2, { height: 18 });

    var heads = ["#", "Activity", "Owner", "Work\ndays", "Status", "Start", "End", "Notes"];
    for (c = 1; c <= 8; c++) { ws.set(PL_HEAD, c, heads[c - 1], (c === PL.num || (c >= PL.days && c <= PL.end)) ? sHeadC : sHead); }
    ws.row(PL_HEAD, { height: 30 });

    var n = p.activities.length, first = PL_FIRST, last = PL_FIRST + n - 1;

    if (!n) {
      ws.set(first, 1, "No activities yet — add rows in the planner before exporting.", S.valueEmpty).merge(first, 1, first, 8);
      ws.row(first, { height: 20 });
      return { first: first, last: first - 1, headRow: PL_HEAD };
    }

    for (i = 0; i < n; i++) {
      var a = p.activities[i], d = derived[i], rr = first + i;
      var dstart = d && d.start ? d.start : null;
      var dend = d && d.end ? d.end : null;

      ws.set(rr, PL.num, i + 1, sNum);
      ws.set(rr, PL.act, a.activity, sAct);
      ws.set(rr, PL.owner, a.owner || null, sOwner);
      ws.set(rr, PL.days, a.workDays, sDaysIn);
      ws.set(rr, PL.status, a.status, sStatus);
      ws.set(rr, PL.start, { f: startFormula(rr, first, last), v: dstart ? dstart : "", t: dstart ? null : "str" }, sDate);
      ws.set(rr, PL.end, { f: endFormula(rr, first, last), v: dend ? dend : "", t: dend ? null : "str" }, sDate);
      ws.set(rr, PL.notes, a.notes || null, sNotes);
      ws.row(rr, { height: heightFor(Math.max(
        estLines(a.activity, PL_W[PL.act] - 2, 10),
        estLines(a.owner, PL_W[PL.owner] - 2, 9.5),
        estLines(a.notes, PL_W[PL.notes] - 2, 9.5)), 10, 20) });
    }

    // conditional formatting: status cell, then whole row
    var dxDoneCell = wb.dxf({ font: { bold: true, color: K.white }, fill: K.greenBar });
    var dxProgCell = wb.dxf({ font: { bold: true, color: K.amberInk }, fill: K.amber });
    var dxNaCell = wb.dxf({ font: { italic: true, color: K.mid }, fill: "E4E4E4" });
    var dxDoneRow = wb.dxf({ fill: K.greenPale });
    var dxProgRow = wb.dxf({ fill: K.amberPale });
    var dxNaRow = wb.dxf({ font: { italic: true, color: "9A9A9A" }, fill: "F7F7F7" });
    var sq = "E" + first + ":E" + last;
    ws.cf(sq, [
      { formula: '$E' + first + '="Done"', dxf: dxDoneCell },
      { formula: '$E' + first + '="In progress"', dxf: dxProgCell },
      { formula: '$E' + first + '="N/A"', dxf: dxNaCell }
    ]);
    ws.cf("A" + first + ":H" + last, [
      { formula: '$E' + first + '="Done"', dxf: dxDoneRow },
      { formula: '$E' + first + '="In progress"', dxf: dxProgRow },
      { formula: '$E' + first + '="N/A"', dxf: dxNaRow }
    ]);
    ws.validation(sq, {
      list: STATUSES, allowBlank: true,
      promptTitle: "Status", prompt: "Pick Done, In progress, Not started or N/A.",
      errorTitle: "Status", error: "Please pick a status from the list."
    });
    ws.autoFilter("A" + PL_HEAD + ":H" + last);
    return { first: first, last: last, headRow: PL_HEAD };
  }

  /* ── the live date formulas (self-contained per cell) ───── */

  // cumulative work-days of REMAINING (not Done, not N/A) activities ABOVE row r
  function priorRemaining(r, first) {
    if (r <= first) { return "0"; }
    var a = "$E$" + first + ":$E$" + (r - 1), d = "$D$" + first + ":$D$" + (r - 1);
    return "SUMPRODUCT((" + a + '<>"Done")*(' + a + '<>"N/A")*' + d + ")";
  }
  // work-days of DONE activities BELOW row r (they sit nearer the as-of line)
  function doneAfter(r, last) {
    if (r >= last) { return "0"; }
    return "SUMPRODUCT(($E$" + (r + 1) + ":$E$" + last + '="Done")*$D$' + (r + 1) + ":$D$" + last + ")";
  }
  function remStart(r, first) { return "WORKDAY(PlanStart-1,1+" + priorRemaining(r, first) + ")"; }
  function remEnd(r, first) {
    var s = remStart(r, first);
    return "IF($D" + r + "<=1,(" + s + "),WORKDAY((" + s + "),$D" + r + "-1))";
  }
  function doneEnd(r, last) { return "WORKDAY(PlanStart,-1-(" + doneAfter(r, last) + "))"; }
  function doneStart(r, last) {
    var e = doneEnd(r, last);
    return "IF($D" + r + "<=1,(" + e + "),WORKDAY((" + e + "),-($D" + r + "-1)))";
  }
  function startFormula(r, first, last) {
    return 'IF($E' + r + '="N/A","",IF($E' + r + '="Done",(' + doneStart(r, last) + "),(" + remStart(r, first) + ")))";
  }
  function endFormula(r, first, last) {
    return 'IF($E' + r + '="N/A","",IF($E' + r + '="Done",(' + doneEnd(r, last) + "),(" + remEnd(r, first) + ")))";
  }

  /* ═══ Sheet: Overview ═════════════════════════════════════ */

  function writeOverview(ws, p, derived, sum, S, now, wb, plan) {
    var c, i, r, st = S.st;
    var W = [0, 2.5, 34, 12, 10, 10, 24, 14, 14];
    for (c = 1; c <= 8; c++) { ws.col(c, { width: W[c] }); }
    ws.col(9, { width: 2.5 });
    var LAST = 8, VAL_W = 12 + 10 + 10 + 24 + 14 + 14, NOTE_W = 10 + 10 + 24 + 14 + 14;
    var n = plan.last - plan.first + 1, hasRows = n > 0;
    var rngStatus = hasRows ? "PlanStatus" : "";

    ws.set(1, 2, null, S.band); ws.merge(1, 2, 1, LAST); ws.row(1, { height: 6 });
    ws.set(2, 2, "Delivery Plan — " + p.title, S.title).merge(2, 2, 2, LAST);
    ws.row(2, { height: heightFor(estLines("Delivery Plan — " + p.title, 118, 20, true), 20, 36) });
    ws.set(3, 2, (p.service ? p.service + "  ·  " : "") + "exported " + fmtDate(now) + " from the DPM Knowledge Base", S.sub).merge(3, 2, 3, LAST);
    ws.row(3, { height: 20 }); ws.row(4, { height: 10 });

    function section(row, text) {
      ws.set(row, 2, text, S.section);
      for (var k = 3; k <= LAST; k++) { ws.set(row, k, null, S.sectionFill); }
      ws.row(row, { height: 24 });
    }
    function detail(row, label, value, style) {
      ws.set(row, 2, label, S.label);
      if (value === "" || value == null) { ws.set(row, 3, "Not set", S.valueEmpty); }
      else { ws.set(row, 3, value, style || S.value); }
      ws.merge(row, 3, row, LAST);
      ws.row(row, { height: heightFor(estLines(value, VAL_W, 11), 11, 20) });
    }

    r = 5;
    section(r++, "Plan details");
    detail(r++, "Plan / site", p.title, S.valueBold);
    detail(r++, "Site address", p.address);
    detail(r++, "DPM", p.dpm);
    detail(r++, "Service", p.service);

    // Planning-from (input) → PlanStart
    ws.set(r, 2, "Planning from", S.label);
    ws.set(r, 3, rollToWorkday(p.start), S.input);
    ws.set(r, 4, "◀ The “as of” date. Change it and the whole plan & Gantt move. Remaining steps run forward from here; Done steps sit before it.", S.note).merge(r, 4, r, LAST);
    ws.row(r, { height: heightFor(estLines("x", NOTE_W - 2, 10) + 1, 10, 30) });
    wb.name("PlanStart", "'" + ws.name + "'!$C$" + r);
    r++;

    // Target go-live (input, optional) → PlanTarget
    ws.set(r, 2, "Target go-live", S.label);
    ws.set(r, 3, p.target || null, S.inputSoft);
    var tr = "$C$" + r;
    var tDays = p.target ? dayDiff(dateOnly(now), p.target) : 0;
    ws.set(r, 4, {
      f: 'IF(ISNUMBER(' + tr + '),IF(' + tr + '=TODAY(),"Today",IF(' + tr + '>TODAY(),"In "&(' + tr + '-TODAY())&IF(' + tr + '-TODAY()=1," day"," days"),"Passed "&(TODAY()-' + tr + ')&IF(TODAY()-' + tr + '=1," day ago"," days ago")))&" · marked in red on the Gantt","Optional — type a date here to mark it in red on the Gantt")',
      v: p.target ? (tDays === 0 ? "Today" : tDays > 0 ? "In " + tDays + (tDays === 1 ? " day" : " days") : "Passed " + (-tDays) + (tDays === -1 ? " day ago" : " days ago")) + " · marked in red on the Gantt"
        : "Optional — type a date here to mark it in red on the Gantt",
      t: "str"
    }, S.noteGrey).merge(r, 4, r, LAST);
    ws.row(r, { height: 24 });
    wb.name("PlanTarget", "'" + ws.name + "'!$C$" + r);
    r++;
    ws.row(r++, { height: 10 });

    // Earliest migration + progress
    section(r++, "Where this lands");
    var remF = hasRows ? 'COUNTIF(' + rngStatus + ',"In progress")+COUNTIF(' + rngStatus + ',"Not started")' : "0";
    var naF = hasRows ? 'COUNTIF(' + rngStatus + ',"N/A")' : "0";
    var doneF = hasRows ? 'COUNTIF(' + rngStatus + ',"Done")' : "0";
    var totF = hasRows ? "COUNTA(PlanAct)" : "0";
    var applF = hasRows ? "(" + totF + "-" + naF + ")" : "0";

    // Earliest migration date (live)
    var migRow = r;
    ws.set(r, 2, "Earliest migration", S.label);
    var migText = sum.applicable === 0 ? "—" : (sum.remaining === 0 ? "Ready now" : null);
    if (hasRows) {
      ws.set(r, 3, {
        f: "IF(" + applF + '=0,"—",IF(' + remF + '=0,"Ready now",MAX(PlanEnd)))',
        v: migText != null ? migText : sum.goLive,
        t: migText != null ? "str" : null
      }, migText != null ? S.migText : S.migDate).merge(r, 3, r, 4);
    } else {
      ws.set(r, 3, "—", S.migText).merge(r, 3, r, 4);
    }
    var subF = hasRows
      ? 'IF(' + applF + '=0,"No applicable activities",IF(' + remF + '=0,"All steps done — ready to migrate",' + remF + '&IF(' + remF + '=1," step"," steps")&" left, counting working days from the “Planning from” date"))'
      : '"Add activities on the Plan sheet"';
    ws.set(r, 5, { f: subF, v: sum.applicable === 0 ? "No applicable activities" : (sum.remaining === 0 ? "All steps done — ready to migrate" : sum.remaining + (sum.remaining === 1 ? " step" : " steps") + " left, counting working days from the “Planning from” date"), t: "str" }, S.noteGrey).merge(r, 5, r, LAST);
    ws.row(r, { height: 28 });
    if (hasRows) {
      ws.cf("C" + migRow, [{ formula: "AND(ISNUMBER($C" + migRow + "),ISNUMBER(PlanTarget),$C" + migRow + ">PlanTarget)", dxf: wb.dxf({ font: { bold: true, color: K.red } }) }]);
    }
    r++;

    // Progress %
    var pctRow = r;
    ws.set(r, 2, "Progress", S.label);
    ws.set(r, 3, hasRows ? { f: "IF(" + applF + "=0,1," + doneF + "/" + applF + ")", v: sum.pct } : 1, S.pctBig);
    var nb = Math.round(sum.pct * 20);
    ws.set(r, 4, hasRows
      ? { f: 'REPT("' + BAR + '",ROUND(C' + r + '*20,0))&REPT("' + BAR_EMPTY + '",20-ROUND(C' + r + '*20,0))', v: rep(BAR, nb) + rep(BAR_EMPTY, 20 - nb), t: "str" }
      : rep(BAR_EMPTY, 20), S.barBig).merge(r, 4, r, LAST);
    ws.row(r, { height: 26 });
    r++;

    // Status tally
    ws.set(r, 2, "Status", S.label);
    if (hasRows) {
      ws.set(r, 3, {
        f: doneF + '&" done"&IF(' + 'COUNTIF(' + rngStatus + ',"In progress")>0,"  ·  "&COUNTIF(' + rngStatus + ',"In progress")&" in progress","")' +
          '&IF(COUNTIF(' + rngStatus + ',"Not started")>0,"  ·  "&COUNTIF(' + rngStatus + ',"Not started")&" not started","")' +
          '&IF(' + naF + '>0,"  ·  "&' + naF + '&" N/A","")',
        v: sum.done + " done" + (sum.inProgress ? "  ·  " + sum.inProgress + " in progress" : "") + (sum.notStarted ? "  ·  " + sum.notStarted + " not started" : "") + (sum.na ? "  ·  " + sum.na + " N/A" : ""),
        t: "str"
      }, S.value).merge(r, 3, r, LAST);
    } else { ws.set(r, 3, "No activities yet", S.valueEmpty).merge(r, 3, r, LAST); }
    ws.row(r, { height: 20 });
    r++;
    ws.row(r++, { height: 12 });

    // What's left next (static at export)
    section(r++, "What's left next  (remaining steps, earliest first, at export)");
    var open = [];
    for (i = 0; i < p.activities.length; i++) {
      var a = p.activities[i];
      if (a.status === "Done" || a.status === "N/A") { continue; }
      open.push({ i: i, a: a, d: derived[i] });
    }
    open.sort(function (x, y) {
      var xs = x.d && x.d.start ? x.d.start.getTime() : 0, ys = y.d && y.d.start ? y.d.start.getTime() : 0;
      return (xs - ys) || (x.i - y.i);
    });
    if (!open.length) {
      ws.set(r, 2, sum.applicable === 0 ? "No applicable activities yet." : "All applicable steps are done — nice work.", S.tdText).merge(r, 2, r, LAST);
      ws.row(r++, { height: 20 });
    } else {
      var nh = ["#", "Activity", "", "", "Owner", "Start", "End"];
      for (c = 0; c < nh.length; c++) { ws.set(r, 2 + c, nh[c], (c === 0 || c >= 5) ? S.thC : S.th); }
      ws.merge(r, 3, r, 4); ws.row(r, { height: 20 }); r++;
      for (i = 0; i < open.length && i < 4; i++) {
        var o = open[i];
        ws.set(r, 2, o.a.n, S.tdMuted);
        ws.set(r, 3, o.a.activity + (o.a.status === "In progress" ? "  (in progress)" : ""), S.tdText).merge(r, 3, r, 4);
        ws.set(r, 6, o.a.owner || "—", S.tdMuted);
        ws.set(r, 7, o.d && o.d.start ? o.d.start : null, S.tdDate);
        ws.set(r, 8, o.d && o.d.end ? o.d.end : null, S.tdDate);
        ws.row(r, { height: heightFor(estLines(o.a.activity, 34, 10), 10, 19) });
        r++;
      }
    }
    ws.row(r++, { height: 12 });

    // How to use
    section(r++, "How to use this workbook");
    var how = [
      "•  On the Plan sheet, pick each activity's Status from the dropdown and set its Work days. The dates, the progress above and the bars on the Gantt all recalculate by themselves.",
      "•  Change the “Planning from” date (the yellow cell above) and the whole plan and Gantt slide with it. Remaining steps are scheduled forward from it; steps you mark Done are shown just before it.",
      "•  “Earliest migration” is when the work that is still left will finish — it moves earlier as you mark steps Done, and shows “Ready now” once nothing is left.",
      "•  Type a Target go-live above to see the countdown and a red marker on the Gantt; the migration date turns red if the plan lands after it.",
      "•  The plan is indicative: working days Monday to Friday, with no public holidays. Re-plan around your real EDD, carrier dates and the migration date the customer confirms.",
      "•  This is a planning aid from the DPM Knowledge Base. The RACI sheet shows who does what on a delivery."
    ];
    for (i = 0; i < how.length; i++) {
      ws.set(r, 2, how[i], S.howto).merge(r, 2, r, LAST);
      ws.row(r, { height: heightFor(estLines(how[i], 34 + VAL_W - 3, 10), 10, 20) });
      r++;
    }
    ws.row(r++, { height: 10 });
    ws.set(r, 2, "Generated by the DPM Knowledge Base · " + fmtDate(now) + " · Internal use only", S.foot).merge(r, 2, r, LAST);
  }

  /* ═══ Sheet: Gantt ════════════════════════════════════════ */

  function monthChoose(ref) { return 'CHOOSE(MONTH(' + ref + '),"' + MONTHS.join('","') + '")'; }

  function writeGantt(ws, p, derived, S, tl, now, wb, plan) {
    var XL = X(), st = S.st, i, c, r, k;
    var W = [0, 44, 17, 12, 12, 7, 11];
    for (c = 1; c <= 6; c++) { ws.col(c, { width: W[c] }); }
    var T0 = 7, nCols = tl.nCols, TL = T0 + nCols - 1, TC = XL.col(T0), LC = XL.col(TL);
    var weekly = tl.weekly, step = tl.step, colDate = tl.colDate;
    var dToday = dateOnly(now), target = p.target;
    for (c = T0; c <= TL; c++) { ws.col(c, { width: weekly ? 4.2 : 3.4 }); }

    var hair = S.hair, rowLine = S.rowLine;
    var sHead = st({ font: { size: 10, bold: true, color: K.white }, fill: K.dark, align: { v: "center", indent: 1 } });
    var sHeadC = st({ font: { size: 10, bold: true, color: K.white }, fill: K.dark, align: { h: "center", v: "center", wrap: true } });
    var sMonth = st({ font: { size: 9, bold: true, color: K.white }, fill: K.dark, align: { h: "left", v: "center" } });
    var sDayN = st({ font: { size: 8, color: K.white }, fill: "2E2E2E", align: { h: "center", v: "center" }, numFmt: weekly ? "d/m" : "d", border: { left: { style: "hair", color: "555555" } } });
    var sDayNW = st({ font: { size: 8, color: "9A9A9A" }, fill: "2E2E2E", align: { h: "center", v: "center" }, numFmt: "d", border: { left: { style: "hair", color: "555555" } } });
    var sWd = st({ font: { size: 8, color: "D0D0D0" }, fill: "3D3D3D", align: { h: "center", v: "center" }, border: { left: { style: "hair", color: "555555" } } });
    var sWdW = st({ font: { size: 8, color: "8A8A8A" }, fill: "3D3D3D", align: { h: "center", v: "center" }, border: { left: { style: "hair", color: "555555" } } });
    var sMark = st({ font: { size: 8, bold: true, color: K.mid }, align: { h: "center", v: "bottom", rotate: 90 } });
    var sTask = st({ font: { size: 9.5, color: K.dark }, border: { bottom: rowLine }, align: { v: "center", wrap: true, indent: 1 } });
    var sWho = st({ font: { size: 8.5, color: K.mid }, border: { bottom: rowLine }, align: { v: "center", wrap: true } });
    var sDate = st({ font: { size: 9, color: K.text }, border: { bottom: rowLine }, align: { h: "center", v: "center" }, numFmt: "d mmm" });
    var sDays = st({ font: { size: 9, color: K.text }, border: { bottom: rowLine }, align: { h: "center", v: "center" } });
    var sStat = st({ font: { size: 8.5, color: K.mid }, border: { bottom: rowLine }, align: { h: "center", v: "center" } });

    function cellStyle(kk) {
      var d = colDate[kk], mon = weekly || d.getDay() === 1, we = !weekly && isWeekend(d);
      var spec = { border: { bottom: rowLine } };
      if (mon) { spec.border.left = { style: "thin", color: "D4D4D4" }; }
      if (we) { spec.fill = K.weekend; }
      return st(spec);
    }
    var bodyStyle = [];
    for (k = 0; k < nCols; k++) { bodyStyle.push(cellStyle(k)); }

    // title
    ws.set(1, 1, "Gantt — " + p.title, S.title16).merge(1, 1, 1, 6);
    ws.row(1, { height: 27 });
    ws.set(2, 1, "Indicative plan in working days (Mon–Fri, no holidays). Bars follow the Status and dates on the Plan sheet" + (weekly ? "; one column per week." : ".") +
      " Change the plan and these bars move.", S.subWrap).merge(2, 1, 2, 6);
    ws.row(2, { height: 44 });

    // header rows 3 (month) / 4 (date) / 5 (weekday); task-column headers span 3:5
    var heads = ["Activity", "Owner", "Start", "End", "Days", "Status"];
    for (c = 1; c <= 6; c++) { ws.set(3, c, heads[c - 1], c <= 2 ? sHead : sHeadC).merge(3, c, 5, c); }
    ws.row(3, { height: 16 }); ws.row(4, { height: 15 }); ws.row(5, { height: 14 });

    // col0 date anchors to PlanStart (Monday on/before, minus whole weeks back)
    var col0 = "PlanStart-WEEKDAY(PlanStart,3)" + (tl.weeksBack > 0 ? "-" + (7 * tl.weeksBack) : "");
    var prevLabel = "";
    for (k = 0; k < nCols; k++) {
      var col = T0 + k, L = XL.col(col), P0 = XL.col(col - 1), d = colDate[k], we = colIsWeekend(tl, k);
      // row 4: dates chained from PlanStart
      ws.set(4, col, k === 0 ? { f: col0, v: d } : { f: P0 + "4+" + step, v: d }, we ? sDayNW : sDayN);
      // row 5: weekday letters (first column is a Monday)
      if (!weekly) { ws.set(5, col, DAY_LETTERS[d.getDay()], we ? sWdW : sWd); }
      else { ws.set(5, col, null, sWd); }
      // row 3: month label (live), with an apostrophe-year in the following cell
      var lbl, cached;
      if (k === 0) {
        var ok0 = weekly ? d.getDate() <= 21 : addDays(d, 2).getMonth() === d.getMonth();
        lbl = weekly ? 'IF(DAY(' + L + '$4)<=21,' + monthChoose(L + "$4") + ',"")'
          : 'IF(MONTH(' + L + '$4+2)=MONTH(' + L + '$4),' + monthChoose(L + "$4") + ',"")';
        cached = ok0 ? MONTHS[d.getMonth()] : "";
      } else {
        var isStart = weekly ? d.getDate() <= 7 : d.getDate() === 1;
        lbl = 'IF(' + (weekly ? "DAY(" + L + "$4)<=7" : "DAY(" + L + "$4)=1") + "," + monthChoose(L + "$4") +
          ',IF(AND(' + P0 + '3<>"",LEFT(' + P0 + '3,1)<>"’"),"’"&RIGHT(YEAR(' + L + '$4),2),""))';
        cached = isStart ? MONTHS[d.getMonth()] : (prevLabel && prevLabel.charAt(0) !== "’" ? "’" + String(d.getFullYear()).substring(2) : "");
      }
      prevLabel = cached;
      ws.set(3, col, { f: lbl, v: cached, t: "str" }, sMonth);
      // row 2: Target / Today markers
      var mk = weekly
        ? 'IF(AND(ISNUMBER(PlanTarget),PlanTarget>=' + L + '$4,PlanTarget<=' + L + '$4+6),"Target",IF(AND(TODAY()>=' + L + '$4,TODAY()<=' + L + '$4+6),"Today",""))'
        : 'IF(AND(ISNUMBER(PlanTarget),' + L + '$4=PlanTarget),"Target",IF(' + L + '$4=TODAY(),"Today",""))';
      ws.set(2, col, { f: mk, v: inCol(tl, k, target) ? "Target" : inCol(tl, k, dToday) ? "Today" : "", t: "str" }, sMark);
    }

    // task rows (one per activity, referencing the Plan sheet so they stay in sync)
    r = 6;
    var n = plan.last - plan.first + 1, gFirst = 6;
    if (n <= 0) {
      ws.set(6, 1, "No activities yet — add rows in the planner before exporting.", st({ font: { size: 10, italic: true, color: K.soft }, align: { v: "center", indent: 1 } })).merge(6, 1, 6, 6);
      ws.row(6, { height: 20 });
      return;
    }
    for (i = 0; i < n; i++) {
      var rc = plan.first + i, a = p.activities[i], d2 = derived[i];
      ws.set(r, 1, { f: '"' + (i + 1) + '. "&Plan!B' + rc, v: (i + 1) + ". " + a.activity, t: "str" }, sTask);
      ws.set(r, 2, { f: "Plan!C" + rc, v: a.owner || "", t: "str" }, sWho);
      ws.set(r, 3, { f: "Plan!F" + rc, v: d2 && d2.start ? d2.start : "", t: d2 && d2.start ? null : "str" }, sDate);
      ws.set(r, 4, { f: "Plan!G" + rc, v: d2 && d2.end ? d2.end : "", t: d2 && d2.end ? null : "str" }, sDate);
      ws.set(r, 5, { f: "Plan!D" + rc, v: a.workDays }, sDays);
      ws.set(r, 6, { f: '""&Plan!E' + rc, v: a.status, t: "str" }, sStat);
      for (k = 0; k < nCols; k++) { ws.set(r, T0 + k, null, bodyStyle[k]); }
      ws.row(r, { height: heightFor(Math.max(estLines((i + 1) + ". " + a.activity, W[1] - 3, 9.5), estLines(a.owner, W[2], 8.5)), 9.5, 17) });
      r++;
    }
    var gLast = r - 1;
    var body = TC + gFirst + ":" + LC + gLast;

    // bars via conditional formatting (highest priority first)
    var inSpan = weekly
      ? "AND($C" + gFirst + "<=" + TC + "$4+6,$D" + gFirst + ">=" + TC + "$4)"
      : "AND(" + TC + "$4>=$C" + gFirst + "," + TC + "$4<=$D" + gFirst + ")";
    ws.cf(body, [
      { formula: "AND($F" + gFirst + '="Done",' + inSpan + ")", dxf: wb.dxf({ fill: K.greenBar }) },
      { formula: "AND($F" + gFirst + '="In progress",' + inSpan + ")", dxf: wb.dxf({ fill: K.amberBar }) },
      { formula: "AND($F" + gFirst + '="Not started",' + inSpan + ")", dxf: wb.dxf({ fill: K.todoBar }) }
    ]);
    // today + target: lines over the bars + a faint tint behind (lower priority)
    var isTarget = weekly ? "AND(ISNUMBER(PlanTarget),PlanTarget>=" + TC + "$4,PlanTarget<=" + TC + "$4+6)" : "AND(ISNUMBER(PlanTarget)," + TC + "$4=PlanTarget)";
    var isToday = weekly ? "AND(TODAY()>=" + TC + "$4,TODAY()<=" + TC + "$4+6)" : TC + "$4=TODAY()";
    ws.cf(body, [
      { formula: isTarget, dxf: wb.dxf({ border: { left: { style: "thin", color: K.red }, right: { style: "thin", color: K.red } } }) },
      { formula: isToday, dxf: wb.dxf({ border: { left: { style: "thin", color: K.orange }, right: { style: "thin", color: K.orange } } }) },
      { formula: isTarget, dxf: wb.dxf({ fill: K.redPale }) },
      { formula: isToday, dxf: wb.dxf({ fill: K.orangePale }) }
    ]);
    // header highlights
    ws.cf(TC + "4:" + LC + "5", [
      { formula: isTarget, dxf: wb.dxf({ font: { bold: true, color: K.white }, fill: K.red }) },
      { formula: isToday, dxf: wb.dxf({ font: { bold: true, color: K.white }, fill: K.orange }) }
    ]);
    ws.cf(TC + "2:" + LC + "2", [
      { formula: TC + '2="Target"', dxf: wb.dxf({ font: { bold: true, color: K.red } }) },
      { formula: TC + '2="Today"', dxf: wb.dxf({ font: { bold: true, color: K.orange } }) }
    ]);
    // status word colour in the info column
    ws.cf("F" + gFirst + ":F" + gLast, [
      { formula: '$F' + gFirst + '="Done"', dxf: wb.dxf({ font: { bold: true, color: K.green } }) },
      { formula: '$F' + gFirst + '="In progress"', dxf: wb.dxf({ font: { bold: true, color: K.amberInk } }) },
      { formula: '$F' + gFirst + '="N/A"', dxf: wb.dxf({ font: { italic: true, color: "9A9A9A" } }) }
    ]);

    // legend
    r = gLast + 2;
    ws.set(r, 1, "Legend", st({ font: { size: 10, bold: true, color: K.dark }, align: { v: "center" } }));
    ws.set(r, 2, "Bars move with the Status and dates on the Plan sheet.", st({ font: { size: 8.5, italic: true, color: K.mid }, align: { v: "center" } })).merge(r, 2, r, 6);
    var items = [
      [st({ fill: K.greenBar, border: { all: { style: "thin", color: K.white } } }), "Done"],
      [st({ fill: K.amberBar, border: { all: { style: "thin", color: K.white } } }), "In progress"],
      [st({ fill: K.todoBar, border: { all: { style: "thin", color: K.white } } }), "Not started"],
      [st({ fill: K.orangePale, border: { left: { style: "thin", color: K.orange }, right: { style: "thin", color: K.orange } } }), "Today (" + fmtDate(now) + ")"],
      [st({ fill: K.redPale, border: { left: { style: "thin", color: K.red }, right: { style: "thin", color: K.red } } }), "Target go-live"]
    ];
    if (!weekly) { items.push([st({ fill: K.weekend }), "Weekend"]); }
    var sLeg = st({ font: { size: 8.5, color: K.text }, align: { v: "center" } });
    for (i = 0; i < items.length; i++) {
      var rowL = r + 1 + i;
      ws.set(rowL, 1, null, items[i][0]);
      ws.set(rowL, 2, items[i][1], sLeg).merge(rowL, 2, rowL, 6);
      ws.row(rowL, { height: 16 });
    }
  }

  /* ═══ Sheet: RACI ═════════════════════════════════════════ */

  function writeRaci(ws, S) {
    var st = S.st, i, c, r;
    ws.col(1, { width: 2.5 }); ws.col(2, { width: 42 });
    for (c = 3; c <= 9; c++) { ws.col(c, { width: 12.5 }); }
    ws.col(10, { width: 2.5 });
    var cellB = { all: { style: "thin", color: K.white } };
    function code(fill, color, bold) {
      return st({ font: { size: 10.5, bold: bold !== false, color: color, name: "Consolas" }, fill: fill, border: cellB, align: { h: "center", v: "center" } });
    }
    var sty = {
      "A/R": code(K.orangeStrong, K.white), "A": code(K.orangeStrong, K.white),
      "R": code(K.greenPale, "0A7A4A"), "C": code(K.bluePale, K.blueInk),
      "I": code(K.faint, K.mid), "-": st({ font: { size: 10.5, color: K.mid }, fill: K.white, border: cellB, align: { h: "center", v: "center" } }),
      "-dpm": st({ font: { size: 10.5, color: K.mid }, fill: K.orangeFaint, border: cellB, align: { h: "center", v: "center" } })
    };
    var sAct = st({ font: { size: 10, bold: true, color: K.text }, fill: K.faint, border: { bottom: { style: "thin", color: K.white } }, align: { v: "center", indent: 1, wrap: true } });
    var sHead = st({ font: { size: 9.5, bold: true, color: K.white }, fill: K.dark, align: { h: "center", v: "center", wrap: true } });
    var sHeadL = st({ font: { size: 9.5, bold: true, color: K.white }, fill: K.dark, align: { v: "center", indent: 1 } });
    var sHeadDpm = st({ font: { size: 9.5, bold: true, color: K.white }, fill: K.orangeInk, align: { h: "center", v: "center" } });
    var sCap = st({ font: { size: 8.5, color: K.mid }, align: { h: "center", v: "top", wrap: true } });
    var sLegLbl = st({ font: { size: 10, bold: true, color: K.dark }, align: { v: "center" } });

    ws.set(1, 2, null, S.band).merge(1, 2, 1, 9); ws.row(1, { height: 6 });
    ws.set(2, 2, "RACI — who does what", S.title).merge(2, 2, 2, 9); ws.row(2, { height: 36 });
    ws.set(3, 2, "Each activity has exactly one Accountable owner. Where the same party both owns and does the work, the cell shows A/R. " +
      "The DPM column is highlighted — you're accountable for almost all of it.", S.subWrap).merge(3, 2, 3, 9);
    ws.row(3, { height: 32 });

    r = 5;
    ws.set(r, 2, "How to read it", sLegLbl);
    var leg = [["A/R", "Owns & does the work"], ["A", "Accountable — owns the outcome"], ["R", "Responsible — does the work"],
      ["C", "Consulted"], ["I", "Informed"], ["-", "Not involved"]];
    for (i = 0; i < leg.length; i++) {
      ws.set(r, 3 + i, leg[i][0] === "-" ? "–" : leg[i][0], sty[leg[i][0]]);
      ws.set(r + 1, 3 + i, leg[i][1], sCap);
    }
    ws.row(r, { height: 22 }); ws.row(r + 1, { height: 36 });

    r = 8;
    ws.set(r, 2, "Activity", sHeadL);
    for (c = 0; c < RACI_ROLES.length; c++) { ws.set(r, 3 + c, RACI_ROLES[c], c === 0 ? sHeadDpm : sHead); }
    ws.row(r, { height: 24 });
    r++;
    for (i = 0; i < RACI.length; i++) {
      ws.set(r, 2, RACI[i][0], sAct);
      for (c = 1; c < RACI[i].length; c++) {
        var v = RACI[i][c];
        ws.set(r, 2 + c, v === "-" ? "–" : v, v === "-" && c === 1 ? sty["-dpm"] : sty[v]);
      }
      ws.row(r, { height: 22 });
      r++;
    }
    ws.row(r++, { height: 14 });

    var sGoldH = st({ font: { size: 12, bold: true, color: K.white }, fill: K.dark, align: { v: "center", indent: 1 } });
    var sGold = st({ font: { size: 10.5, color: "E8E8E8" }, fill: K.dark, align: { v: "top", wrap: true, indent: 1 } });
    ws.set(r, 2, "⭐  The DPM golden rule", sGoldH).merge(r, 2, r, 9); ws.row(r, { height: 26 }); r++;
    ws.set(r, 2, GOLDEN_RULE, sGold).merge(r, 2, r, 9);
    ws.row(r, { height: heightFor(estLines(GOLDEN_RULE, 42 + 7 * 12.5 - 4, 10.5), 10.5, 40) + 6 });
    r++;
    ws.row(r++, { height: 14 });

    var sRole = st({ font: { size: 10, bold: true, color: K.orangeInk, name: "Consolas" }, border: { left: { style: "thick", color: K.orange }, bottom: { style: "hair", color: "EDEDED" } }, align: { v: "center", indent: 1 } });
    var sRoleD = st({ font: { size: 10, color: K.text }, border: { bottom: { style: "hair", color: "EDEDED" } }, align: { v: "center", wrap: true } });
    ws.set(r, 2, "The roles", st({ font: { size: 12, bold: true, color: K.dark }, align: { v: "center" } })); ws.row(r, { height: 22 }); r++;
    for (i = 0; i < RACI_PEOPLE.length; i++) {
      ws.set(r, 2, RACI_PEOPLE[i][0], sRole);
      ws.set(r, 3, RACI_PEOPLE[i][1], sRoleD).merge(r, 3, r, 9);
      ws.row(r, { height: 19 });
      r++;
    }
    ws.row(r++, { height: 10 });
    ws.set(r, 2, "Reproduced from the DPM Onboarding Handbook (Ed. 1.3). The delivery process pages in the Knowledge Base show where each activity happens.", S.foot).merge(r, 2, r, 9);
  }

  /* ═══ the workbook ════════════════════════════════════════ */

  function buildWorkbook(plan) {
    var XL = X();
    var p = normPlan(plan);
    var derived = schedule(p);
    var sum = summarise(p, derived);
    var tl = buildTimeline(p, derived);
    var now = p.today;

    var wb = new XL.Workbook({
      title: "Delivery plan — " + p.title,
      subject: "Delivery plan" + (p.service ? " · " + p.service : ""),
      creator: "DPM Knowledge Base",
      description: "Live, customer-facing delivery plan with a Gantt chart, exported from the DPM Knowledge Base on " + fmtDate(now) + ".",
      keywords: "DPM; delivery plan; Gantt; site plan",
      created: new Date()
    });
    var S = makeStyles(wb);

    var wsO = wb.sheet("Overview", { tabColor: K.orange, showGrid: false, zoom: 100, landscape: false, fitWidth: 1, paper: "A4",
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6 }, footer: "&L&8DPM Knowledge Base&R&8Page &P of &N" });
    var wsP = wb.sheet("Plan", { tabColor: K.dark, showGrid: false, zoom: 100, freeze: { row: PL_HEAD, col: PL.status },
      landscape: true, fitWidth: 1, paper: "A4", printTitleRows: PL_HEAD + ":" + PL_HEAD,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5 }, footer: "&L&8DPM Knowledge Base&R&8Page &P of &N" });
    var wsG = wb.sheet("Gantt", { tabColor: "1BA0D7", showGrid: false, zoom: 90, freeze: { row: 5, col: 6 },
      landscape: true, fitWidth: 1, paper: "A4", printTitleRows: "3:5",
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4 }, footer: "&L&8DPM Knowledge Base&R&8Page &P of &N" });
    var wsR = wb.sheet("RACI", { tabColor: "8A8A8A", showGrid: false, zoom: 100, landscape: true, fitWidth: 1, paper: "A4" });

    // Plan first (so named ranges + row numbers exist), then the others
    var plRows = writePlan(wsP, p, derived, S, wb);
    if (plRows.last >= plRows.first) {
      wb.name("PlanStatus", "'Plan'!$E$" + plRows.first + ":$E$" + plRows.last);
      wb.name("PlanEnd", "'Plan'!$G$" + plRows.first + ":$G$" + plRows.last);
      wb.name("PlanAct", "'Plan'!$B$" + plRows.first + ":$B$" + plRows.last);
    }
    writeOverview(wsO, p, derived, sum, S, now, wb, plRows);
    writeGantt(wsG, p, derived, S, tl, now, wb, plRows);
    writeRaci(wsR, S);
    return wb.toBytes();
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
    version: 2,
    buildWorkbook: buildWorkbook,
    fileName: fileName,
    download: download
  };
})(typeof window !== "undefined" ? window : this);
