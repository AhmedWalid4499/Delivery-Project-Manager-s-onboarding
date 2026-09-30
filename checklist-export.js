/* ═══════════════════════════════════════════════════════════════
   DPM Knowledge Base — Delivery Checklist → Excel export
   ───────────────────────────────────────────────────────────────
   Builds a formatted .xlsx workbook for one checklist project, in
   the browser, with no libraries (uses xlsx-writer.js → KBXlsx and
   checklist-data.js → KB_CHECKLISTS).

   Sheets
     1. Overview            project details, kick-off date (input,
                            named ProjectStart), target migration
                            (TargetMigration), live progress by phase,
                            next steps, notes, how to use the file
     2. Checklist           every step with who / tools / what it
                            means & why, a Status dropdown, and
                            planned dates as WORKDAY formulas
     3. Gantt               indicative plan: one column per day (or
                            per week for long plans), bars drawn with
                            conditional formatting, today + target
     4. About this service  the service overview (phases, roles,
                            tools, tips, key terms, where to get help)
     5. RACI                the handbook RACI matrix

   API — window.KBChecklistExport
     schedule(project)     → { kickoff, start, finish,
                               steps:  { stepId:  { start, finish } },
                               phases: { phaseId: { start, finish } },
                               extras: [ { name, phaseId, milestone,
                                           start, finish } ],
                               milestones: [ … phase milestones … ] }
         kick-off = project.start ("YYYY-MM-DD") or today; working
         days are Mon–Fri with no holidays. A kick-off on a weekend
         starts on the next Monday.
     buildWorkbook(project[, { now: Date }]) → Uint8Array (no DOM)
     fileName(project[, now]) → "DPM-Checklist_<slug>_<YYYY-MM-DD>.xlsx"
     download(project)     → builds + saves the file; true / false

   Written in plain ES3/ES5 (no forEach / Object.keys / JSON / trim)
   so it also runs under Windows Script Host for automated testing.
   All user text goes into cells as text — never into a formula.
═══════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";

  /* ── constants ──────────────────────────────────────────── */

  var STATUS = ["Not started", "In progress", "Done", "N/A"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
  var MAX_DAY_COLS = 140;          // longer plans switch to one column per week
  var BAR = "█", BAR_EMPTY = "░", DIAMOND = "◆", APOS = "’";

  var K = {                        // neutral colours
    dark: "1A1A1A", text: "3D3D3D", mid: "666666", soft: "8A8A8A", line: "E3E3E3",
    hair: "ECECEC", faint: "F5F5F5", white: "FFFFFF", orange: "FF6200",
    orangeInk: "B34200", orangeStrong: "C24A00", orangeTint: "FFD2B3", orangePale: "FFF0E6",
    orangeFaint: "FFF8F3", input: "FFF4CC", red: "C62828", redPale: "FDE4E4",
    green: "0A7A4A", greenPale: "E6F7F1", amberInk: "8A5A00", amberPale: "FFF1D6",
    amber: "FFD890", blueInk: "0B6A93", bluePale: "E8F6FD", weekend: "F2F2F2",
    phaseBar: "4A4A4A", naBg: "EFEFEF", naLine: "A6A6A6"
  };
  /* colour groups: LAN phases 1–4 / WAN stages A–D (site palette) */
  var GROUPS = [
    { solid: "FF6200", tint: "FFD2B3", ink: "B34200" },   // Ordering / stage A
    { solid: "1BA0D7", tint: "BFE6F6", ink: "0B6A93" },   // Pre-migration / stage B
    { solid: "7C3AED", tint: "DCCBFB", ink: "6D28D9" },   // Migration / stage C
    { solid: "00A86B", tint: "BFEBDA", ink: "0A7A4A" }    // Post-migration, HOTO / stage D
  ];
  var STAGE_GROUP = { A: 0, B: 1, C: 2, D: 3 };

  /* The handbook RACI matrix (copied from raci.html). */
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

  var HELP = [
    ["Your manager", "Your first stop for anything about your deliveries, priorities or access."],
    ["Your cluster SMEs", "For technical and process questions — find them on your cluster page in the Knowledge Base."],
    ["The Knowledge Base", "For the process flowcharts, tool references, vendor guides, team directory, email templates and glossary."],
    ["Your buddy / fellow DPMs", "No question is too small in your first weeks."]
  ];

  /* ── small helpers ──────────────────────────────────────── */

  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function isArr(v) { return Object.prototype.toString.call(v) === "[object Array]"; }
  function isDate(v) { return Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime()); }
  function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function X() {
    var x = root.KBXlsx;
    if (!x || typeof x.Workbook !== "function") { throw new Error("KBChecklistExport: xlsx-writer.js (KBXlsx) is not loaded"); }
    return x;
  }
  function DATA() {
    var d = root.KB_CHECKLISTS;
    if (!d || !d.types) { throw new Error("KBChecklistExport: checklist-data.js (KB_CHECKLISTS) is not loaded"); }
    return d;
  }
  function typeOf(p) {
    var d = DATA(), k = p && p.type;
    if (typeof k !== "string" || !has(d.types, k)) { throw new Error("KBChecklistExport: unknown checklist type " + k); }
    return d.types[k];
  }

  /* ── dates (local calendar dates, midnight) ─────────────── */

  function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function today() { return dateOnly(new Date()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function isWeekend(d) { var w = d.getDay(); return w === 0 || w === 6; }
  function rollToWorkday(d) { while (isWeekend(d)) { d = addDays(d, 1); } return d; }
  /* the n-th working day counting the kick-off (or the next Monday) as day 0 —
     the same as Excel's WORKDAY(kickoff - 1, n + 1) */
  function addWorkdays(d, n) {
    var x = rollToWorkday(dateOnly(d));
    while (n > 0) { x = addDays(x, 1); if (!isWeekend(x)) { n--; } }
    return x;
  }
  function parseYmd(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === "string" ? trim(s) : "");
    if (!m) { return null; }
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) { return null; }
    return d;
  }
  function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function fmtDate(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function dayDiff(a, b) {   // calendar days from a to b
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  }
  function networkDays(a, b) { var n = 0, d = a; while (d <= b) { if (!isWeekend(d)) { n++; } d = addDays(d, 1); } return n; }

  /* ── project + plan ─────────────────────────────────────── */

  function cleanStr(v, max) {
    if (typeof v !== "string") { return ""; }
    v = trim(v.replace(/\s+/g, " "));
    return v.length > max ? v.substring(0, max) : v;
  }
  function normProject(src) {
    src = src || {};
    var notes = typeof src.notes === "string" ? src.notes.replace(/\r\n?/g, "\n").replace(/\s+$/, "") : "";
    if (notes.length > 20000) { notes = notes.substring(0, 20000); }
    return {
      name: cleanStr(src.name, 120) || "Untitled project",
      type: src.type,
      customer: cleanStr(src.customer, 120),
      site: cleanStr(src.site, 120),
      start: parseYmd(src.start) ? trim(src.start) : "",
      target: parseYmd(src.target) ? trim(src.target) : "",
      dpm: cleanStr(src.dpm, 80),
      pm: cleanStr(src.pm, 80),
      sc: cleanStr(src.sc, 80),
      orderRef: cleanStr(src.orderRef, 60),
      notes: notes,
      done: (src.done && typeof src.done === "object" && !isArr(src.done)) ? src.done : {}
    };
  }

  function planOf(o, isMilestone) {
    var pl = (o && o.plan) || {};
    var s = typeof pl.start === "number" && isFinite(pl.start) ? Math.max(0, Math.floor(pl.start)) : 0;
    var d = typeof pl.days === "number" && isFinite(pl.days) ? Math.max(0, Math.floor(pl.days)) : 1;
    if (isMilestone) { d = 0; }
    return { start: s, days: d };
  }
  function spanOf(kick, pl) {
    var s = addWorkdays(kick, pl.start);
    return { start: s, finish: pl.days > 1 ? addWorkdays(s, pl.days - 1) : s };
  }
  function extrasOf(t, phaseId) {
    var out = [], i, ex = isArr(t.planExtras) ? t.planExtras : [];
    for (i = 0; i < ex.length; i++) { if (ex[i] && ex[i].phaseId === phaseId && ex[i].name) { out.push(ex[i]); } }
    return out;
  }
  function kickoffOf(p) { return parseYmd(p && p.start) || today(); }

  function schedule(project) {
    var t = typeOf(project), kick = kickoffOf(project), i, j;
    var out = { kickoff: kick, start: null, finish: null, steps: {}, phases: {}, extras: [], milestones: [] };
    function grow(ph, sp) {
      var r = out.phases[ph];
      if (!r) { out.phases[ph] = { start: sp.start, finish: sp.finish }; }
      else {
        if (sp.start < r.start) { r.start = sp.start; }
        if (sp.finish > r.finish) { r.finish = sp.finish; }
      }
      if (!out.start || sp.start < out.start) { out.start = sp.start; }
      if (!out.finish || sp.finish > out.finish) { out.finish = sp.finish; }
    }
    for (i = 0; i < t.phases.length; i++) {
      var ph = t.phases[i];
      for (j = 0; j < ph.steps.length; j++) {
        var sp = spanOf(kick, planOf(ph.steps[j]));
        out.steps[ph.steps[j].id] = sp;
        grow(ph.id, sp);
      }
      var ex = extrasOf(t, ph.id);
      for (j = 0; j < ex.length; j++) {
        var es = spanOf(kick, planOf(ex[j], !!ex[j].milestone));
        out.extras.push({ name: ex[j].name, phaseId: ph.id, milestone: !!ex[j].milestone, start: es.start, finish: es.finish });
        grow(ph.id, es);
      }
      if (ph.milestone && ph.milestone.name) {
        var ms = spanOf(kick, planOf(ph.milestone, true));
        out.milestones.push({ name: ph.milestone.name, phaseId: ph.id, milestone: true, start: ms.start, finish: ms.finish });
        grow(ph.id, ms);
      }
    }
    if (!out.start) { out.start = rollToWorkday(kick); out.finish = out.start; }
    return out;
  }

  /* ── text layout estimates (Excel does not auto-fit rows on open) ── */

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

  /* ── the model: phases, steps and their rows ────────────── */

  function groupOf(t, ph, pi) {
    if (ph.stage && has(STAGE_GROUP, ph.stage)) { return STAGE_GROUP[ph.stage]; }
    return pi % GROUPS.length;
  }
  function stageOf(t, id) {
    var i, st = isArr(t.stages) ? t.stages : [];
    for (i = 0; i < st.length; i++) { if (st[i].id === id) { return st[i]; } }
    return null;
  }
  function doneStamp(p, id) {
    if (!has(p.done, id) || !p.done[id]) { return null; }
    var v = p.done[id];
    if (typeof v === "number" && isFinite(v) && v > 100000000000) {   // a real tick timestamp (ms)
      var d = new Date(v);
      return isNaN(d.getTime()) ? true : dateOnly(d);
    }
    return true;
  }

  function buildModel(t, p, sch) {
    var M = { phases: [], stepCount: 0, doneCount: 0, groupsUsed: [] }, i, j, seen = {};
    for (i = 0; i < t.phases.length; i++) {
      var ph = t.phases[i], gi = groupOf(t, ph, i), stg = ph.stage ? stageOf(t, ph.stage) : null;
      if (!seen[gi]) {
        seen[gi] = true;
        M.groupsUsed.push({ gi: gi, label: stg ? "Stage " + stg.id + " · " + stg.name : "Phase " + (i + 1) + " · " + ph.name });
      }
      var P = {
        id: ph.id, idx: i, name: ph.name, gi: gi, g: GROUPS[gi], stage: stg,
        summary: ph.summary || "",
        label: stg ? "Stage " + stg.id + " · Phase " + (i + 1) + " · " + ph.name : "Phase " + (i + 1) + " · " + ph.name,
        short: (i + 1) + ". " + ph.name,
        steps: [], extras: [], milestone: null, span: sch.phases[ph.id]
      };
      for (j = 0; j < ph.steps.length; j++) {
        var s = ph.steps[j], pl = planOf(s), stamp = doneStamp(p, s.id);
        P.steps.push({
          id: s.id, num: (i + 1) + "." + (j + 1), text: s.text || "",
          who: s.team || s.owner || "",
          tools: isArr(s.tools) ? s.tools.join(", ") : "",
          why: s.why || s.note || "",
          plan: pl, span: sch.steps[s.id],
          done: !!stamp, doneOn: isDate(stamp) ? stamp : null
        });
        M.stepCount++;
        if (stamp) { M.doneCount++; }
      }
      var ex = extrasOf(t, ph.id);
      for (j = 0; j < ex.length; j++) {
        var epl = planOf(ex[j], !!ex[j].milestone);
        P.extras.push({ name: ex[j].name, milestone: !!ex[j].milestone, plan: epl, span: spanOf(sch.kickoff, epl) });
      }
      if (ph.milestone && ph.milestone.name) {
        var mpl = planOf(ph.milestone, true);
        P.milestone = { name: ph.milestone.name, milestone: true, plan: mpl, span: spanOf(sch.kickoff, mpl) };
      }
      M.phases.push(P);
    }
    return M;
  }

  /* ── styles ─────────────────────────────────────────────── */

  function makeStyles(wb) {
    var S = {}, i;
    var hair = { style: "hair", color: "D9D9D9" };
    var thin = { style: "thin", color: "D0D0D0" };
    function st(spec) { return wb.style(spec); }
    S.st = st;

    // shared
    S.band = st({ fill: K.orange });
    S.title = st({ font: { size: 20, bold: true, color: K.dark }, align: { v: "center" } });
    S.title16 = st({ font: { size: 16, bold: true, color: K.dark }, align: { v: "center" } });
    S.sub = st({ font: { size: 10.5, color: K.mid }, align: { v: "center" } });
    S.subWrap = st({ font: { size: 10, color: K.mid, italic: true }, align: { v: "center", wrap: true } });
    S.section = st({ font: { size: 12, bold: true, color: K.dark }, border: { left: { style: "thick", color: K.orange }, bottom: { style: "thin", color: K.orangeTint } }, align: { v: "center", indent: 1 } });
    S.sectionFill = st({ border: { bottom: { style: "thin", color: K.orangeTint } } });
    S.foot = st({ font: { size: 9, italic: true, color: K.soft }, align: { v: "center" } });

    // Overview details block
    S.label = st({ font: { size: 10, bold: true, color: K.mid }, fill: "FAFAFA", border: { bottom: hair }, align: { v: "center", indent: 1 } });
    S.value = st({ font: { size: 11, color: K.dark }, border: { bottom: hair }, align: { v: "center", wrap: true } });
    S.valueBold = st({ font: { size: 11, bold: true, color: K.dark }, border: { bottom: hair }, align: { v: "center", wrap: true } });
    S.valueEmpty = st({ font: { size: 10, italic: true, color: "A0A0A0" }, border: { bottom: hair }, align: { v: "center" } });
    S.valueDate = st({ font: { size: 11, bold: true, color: K.dark }, border: { bottom: hair }, align: { h: "left", v: "center" }, numFmt: "d mmm yyyy" });
    S.input = st({ font: { size: 11, bold: true, color: K.dark }, fill: K.input,
      border: { all: { style: "medium", color: K.orange } }, align: { h: "center", v: "center" }, numFmt: "d mmm yyyy" });
    S.inputSoft = st({ font: { size: 11, bold: true, color: K.dark }, fill: K.input,
      border: { all: { style: "thin", color: K.orange } }, align: { h: "center", v: "center" }, numFmt: "d mmm yyyy" });
    S.note = st({ font: { size: 10, italic: true, color: K.orangeInk }, border: { bottom: hair }, align: { v: "center", indent: 1, wrap: true } });
    S.noteGrey = st({ font: { size: 10, italic: true, color: K.mid }, border: { bottom: hair }, align: { v: "center", indent: 1, wrap: true } });
    S.pctBig = st({ font: { size: 14, bold: true, color: K.orangeInk }, border: { bottom: hair }, align: { h: "center", v: "center" }, numFmt: "0%" });
    S.barBig = st({ font: { size: 12, color: K.orange }, border: { bottom: hair }, align: { v: "center", indent: 1 } });

    // tables (Overview)
    S.th = st({ font: { size: 9.5, bold: true, color: K.white }, fill: K.dark, align: { v: "center", indent: 1 } });
    S.thC = st({ font: { size: 9.5, bold: true, color: K.white }, fill: K.dark, align: { h: "center", v: "center", wrap: true } });
    S.tdNum = st({ font: { size: 10, color: K.text }, border: { bottom: hair }, align: { h: "center", v: "center" } });
    S.tdPct = st({ font: { size: 10, bold: true, color: K.dark }, border: { bottom: hair }, align: { h: "center", v: "center" }, numFmt: "0%" });
    S.tdDate = st({ font: { size: 10, color: K.text }, border: { bottom: hair }, align: { h: "center", v: "center" }, numFmt: "d mmm yyyy" });
    S.tdText = st({ font: { size: 10, color: K.dark }, border: { bottom: hair }, align: { v: "center", wrap: true, indent: 1 } });
    S.tdMuted = st({ font: { size: 9.5, color: K.mid }, border: { bottom: hair }, align: { v: "center", wrap: true, indent: 1 } });
    S.totLabel = st({ font: { size: 10, bold: true, color: K.dark }, fill: K.faint, border: { top: { style: "thin", color: K.dark } }, align: { v: "center", indent: 1 } });
    S.totNum = st({ font: { size: 10, bold: true, color: K.dark }, fill: K.faint, border: { top: { style: "thin", color: K.dark } }, align: { h: "center", v: "center" } });
    S.totPct = st({ font: { size: 10, bold: true, color: K.dark }, fill: K.faint, border: { top: { style: "thin", color: K.dark } }, align: { h: "center", v: "center" }, numFmt: "0%" });
    S.totDate = st({ font: { size: 10, bold: true, color: K.dark }, fill: K.faint, border: { top: { style: "thin", color: K.dark } }, align: { h: "center", v: "center" }, numFmt: "d mmm yyyy" });
    S.totBar = st({ font: { size: 10, color: K.orange }, fill: K.faint, border: { top: { style: "thin", color: K.dark } }, align: { v: "center", indent: 1 } });
    S.notes = st({ font: { size: 10.5, color: K.dark }, border: { all: { style: "thin", color: K.line } }, align: { v: "top", wrap: true, indent: 1 } });
    S.notesEmpty = st({ font: { size: 10, italic: true, color: "A0A0A0" }, border: { all: { style: "thin", color: K.line } }, align: { v: "top", wrap: true, indent: 1 } });
    S.howto = st({ font: { size: 10, color: K.text }, fill: K.orangeFaint, border: { left: { style: "thick", color: K.orange } }, align: { v: "center", wrap: true, indent: 1 } });

    // per colour group
    S.g = [];
    for (i = 0; i < GROUPS.length; i++) {
      var G = GROUPS[i];
      S.g.push({
        ovLabel: st({ font: { size: 10, bold: true, color: K.dark }, border: { left: { style: "thick", color: G.solid }, bottom: hair }, align: { v: "center", wrap: true, indent: 1 } }),
        ovBar: st({ font: { size: 10, color: G.solid }, border: { bottom: hair }, align: { v: "center", indent: 1 } }),
        ckPhase: st({ font: { size: 11, bold: true, color: K.white }, fill: G.ink, align: { v: "center", indent: 1, wrap: true } }),
        ckPhaseSum: st({ font: { size: 9.5, italic: true, color: K.white }, fill: G.ink, align: { v: "center", wrap: true, indent: 1 } }),
        gPhase: st({ font: { size: 10, bold: true, color: G.ink }, fill: K.faint, border: { left: { style: "thick", color: G.solid }, top: { style: "thin", color: "D6D6D6" } }, align: { v: "center", wrap: true } }),
        gMile: st({ font: { size: 10, bold: true, color: G.ink }, border: { bottom: { style: "hair", color: "E6E6E6" } }, align: { h: "center", v: "center" } }),
        aboutPhase: st({ font: { size: 10.5, bold: true, color: G.ink }, border: { left: { style: "thick", color: G.solid }, bottom: hair }, align: { v: "top", wrap: true, indent: 1 } }),
        legend: st({ fill: G.solid, border: { all: { style: "thin", color: K.white } } }),
        legendTint: st({ fill: G.tint, border: { all: { style: "thin", color: K.white } } })
      });
    }
    return S;
  }

  /* ── sheet 2: Checklist ─────────────────────────────────── */

  var CK = { num: 1, phase: 2, step: 3, who: 4, tools: 5, why: 6, status: 7, doneOn: 8, start: 9, finish: 10, days: 11, notes: 12 };
  var CK_W = [0, 6, 19, 46, 22, 14, 60, 13.5, 12.5, 13, 13, 9, 34];
  var CK_HEAD = 3, CK_FIRST = 4;

  function writeChecklist(ws, M, p, t, S) {
    var st = S.st, c, i, j, r;
    for (c = 1; c <= 12; c++) { ws.col(c, { width: CK_W[c] }); }
    var hair = { style: "hair", color: "D9D9D9" };
    var base = { font: { size: 10, color: K.text }, border: { bottom: hair }, align: { v: "top", wrap: true } };
    function vary(extra) {
      var s = { font: base.font, border: base.border, align: base.align }, k;
      for (k in extra) { if (has(extra, k)) { s[k] = extra[k]; } }
      return st(s);
    }
    var sNum = vary({ font: { size: 10, bold: true, color: K.mid }, align: { h: "center", v: "top" } });
    var sPhase = vary({ font: { size: 9, color: K.mid } });
    var sStep = vary({ font: { size: 10, color: K.dark } });
    var sWhy = vary({ font: { size: 10, color: K.text } });
    var sStatus = st({ font: { size: 10, bold: true, color: K.text }, fill: K.white,
      border: { all: { style: "thin", color: "C8C8C8" } }, align: { h: "center", v: "top" } });
    var sDate = vary({ align: { h: "center", v: "top" }, numFmt: "d mmm yyyy" });
    var sDays = vary({ align: { h: "center", v: "top" } });
    var sNotes = st({ font: { size: 10, color: K.dark }, fill: "FFFCF2", border: { bottom: hair, left: { style: "hair", color: "E5DDC5" } }, align: { v: "top", wrap: true } });
    var sHead = st({ font: { size: 10, bold: true, color: K.white }, fill: K.dark, border: { bottom: { style: "medium", color: K.orange } }, align: { v: "center", wrap: true, indent: 0 } });
    var sHeadC = st({ font: { size: 10, bold: true, color: K.white }, fill: K.dark, border: { bottom: { style: "medium", color: K.orange } }, align: { h: "center", v: "center", wrap: true } });

    // title block
    ws.set(1, 1, "Checklist — " + p.name, S.title16).merge(1, 1, 1, 3);
    var sub = [t.title];
    if (p.customer) { sub.push(p.customer); }
    if (p.site) { sub.push(p.site); }
    ws.set(2, 1, sub.join("  ·  "), S.sub).merge(2, 1, 2, 3);
    ws.set(1, 4, "Set each step's Status with the dropdown: Not started, In progress, Done or N/A. Progress on the Overview and the bars on the Gantt update automatically. " +
      "Planned dates are working days (Mon–Fri) from the kick-off date on the Overview sheet — change it there, or change a step's Days, and the dates move.", S.subWrap).merge(1, 4, 2, 12);
    ws.row(1, { height: 27 }); ws.row(2, { height: 21 });

    var heads = ["#", "Phase", "Step", "Who", "Tools", "What it means & why", "Status", "Done on", "Planned\nstart", "Planned\nfinish", "Days", "Your notes"];
    for (c = 1; c <= 12; c++) {
      ws.set(CK_HEAD, c, heads[c - 1], (c === 1 || c >= 7 && c <= 11) ? sHeadC : sHead);
    }
    ws.row(CK_HEAD, { height: 32 });

    r = CK_FIRST;
    for (i = 0; i < M.phases.length; i++) {
      var P = M.phases[i], gs = S.g[P.gi];
      P.rowC = r;
      ws.set(r, 1, P.label, gs.ckPhase).merge(r, 1, r, 3);
      ws.set(r, 4, P.summary, gs.ckPhaseSum).merge(r, 4, r, 12);
      ws.row(r, { height: heightFor(Math.max(estLines(P.summary, 180, 9.5), estLines(P.label, 66, 11, true)), 10, 24) });
      r++;
      P.firstStepRowC = r;
      for (j = 0; j < P.steps.length; j++) {
        var s = P.steps[j];
        s.rowC = r;
        ws.set(r, CK.num, { f: '"' + s.num + '"', v: s.num, t: "str" }, sNum);   // a formula, so Excel does not flag "number stored as text"
        ws.set(r, CK.phase, P.short, sPhase);
        ws.set(r, CK.step, s.text, sStep);
        ws.set(r, CK.who, s.who, sWhy);
        ws.set(r, CK.tools, s.tools || null, sWhy);
        ws.set(r, CK.why, s.why, sWhy);
        ws.set(r, CK.status, s.done ? "Done" : "Not started", sStatus);
        ws.set(r, CK.doneOn, s.doneOn || null, sDate);
        ws.set(r, CK.start, { f: "WORKDAY(ProjectStart-1," + (s.plan.start + 1) + ")", v: s.span.start }, sDate);
        ws.set(r, CK.finish, { f: "IF(K" + r + "<=1,I" + r + ",WORKDAY(I" + r + ",K" + r + "-1))", v: s.span.finish }, sDate);
        ws.set(r, CK.days, s.plan.days, sDays);
        ws.set(r, CK.notes, null, sNotes);
        var lines = Math.max(
          estLines(s.text, CK_W[3], 10), estLines(s.who, CK_W[4], 10),
          estLines(s.tools, CK_W[5], 10), estLines(s.why, CK_W[6], 10), estLines(P.short, CK_W[2] - 3, 10));
        ws.row(r, { height: heightFor(lines, 10, 18) });
        r++;
      }
      P.lastStepRowC = r - 1;
    }
    M.lastRowC = r - 1;
    var last = M.lastRowC;

    // conditional formatting — status cell first (highest priority), then whole rows
    var wb = ws.wb;
    var dxDoneCell = wb.dxf({ font: { bold: true, color: K.white }, fill: K.green });
    var dxProgCell = wb.dxf({ font: { bold: true, color: K.amberInk }, fill: K.amber });
    var dxNaCell = wb.dxf({ font: { italic: true, color: K.mid }, fill: "E4E4E4" });
    var dxLate = wb.dxf({ font: { bold: true, color: K.red }, fill: K.redPale });
    var dxDoneRow = wb.dxf({ fill: K.greenPale });
    var dxProgRow = wb.dxf({ fill: K.amberPale });
    var dxNaRow = wb.dxf({ font: { italic: true, color: "9A9A9A" }, fill: "F7F7F7" });
    var sq = "G" + CK_FIRST + ":G" + last;
    ws.cf(sq, [
      { formula: '$G' + CK_FIRST + '="Done"', dxf: dxDoneCell },
      { formula: '$G' + CK_FIRST + '="In progress"', dxf: dxProgCell },
      { formula: '$G' + CK_FIRST + '="N/A"', dxf: dxNaCell },
      { formula: 'AND(ISNUMBER($J' + CK_FIRST + '),$J' + CK_FIRST + '<TODAY(),$G' + CK_FIRST + '<>"Done",$G' + CK_FIRST + '<>"N/A")', dxf: dxLate }
    ]);
    ws.cf("A" + CK_FIRST + ":L" + last, [
      { formula: '$G' + CK_FIRST + '="Done"', dxf: dxDoneRow },
      { formula: '$G' + CK_FIRST + '="In progress"', dxf: dxProgRow },
      { formula: '$G' + CK_FIRST + '="N/A"', dxf: dxNaRow }
    ]);
    ws.validation(sq, {
      list: STATUS, allowBlank: true,
      promptTitle: "Status", prompt: "Pick Not started, In progress, Done or N/A.",
      errorTitle: "Status", error: "Please pick a status from the list."
    });
    ws.autoFilter("A" + CK_HEAD + ":L" + last);
  }

  /* ── sheet 1: Overview ──────────────────────────────────── */

  function writeOverview(ws, M, p, t, S, sch, now, wb) {
    var c, i, r;
    var W = [0, 2.5, 34, 12, 10, 10, 24, 14, 14];
    for (c = 1; c <= 8; c++) { ws.col(c, { width: W[c] }); }
    ws.col(9, { width: 2.5 });
    var LAST = 8, VAL_W = 12 + 10 + 10 + 24 + 14 + 14, NOTE_W = 10 + 10 + 24 + 14 + 14;
    var first = CK_FIRST, last = M.lastRowC;
    var rngG = "Checklist!$G$" + first + ":$G$" + last;
    var rngC = "Checklist!$C$" + first + ":$C$" + last;
    var rngJ = "Checklist!$J$" + first + ":$J$" + last;
    var stepsF = "COUNTA(" + rngC + ")", naF = 'COUNTIF(' + rngG + ',"N/A")', doneF = 'COUNTIF(' + rngG + ',"Done")';
    var applicable = M.stepCount, pct = applicable ? M.doneCount / applicable : 1;

    ws.set(1, 2, null, S.band); ws.merge(1, 2, 1, LAST); ws.row(1, { height: 6 });
    ws.set(2, 2, "Delivery Checklist — " + p.name, S.title).merge(2, 2, 2, LAST);
    ws.row(2, { height: heightFor(estLines("Delivery Checklist — " + p.name, 118, 20, true), 20, 36) });
    ws.set(3, 2, t.title + "  ·  exported " + fmtDate(now) + " from the DPM Knowledge Base", S.sub).merge(3, 2, 3, LAST);
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
    section(r++, "Project details");
    detail(r++, "Project", p.name, S.valueBold);
    detail(r++, "Service", t.title);
    detail(r++, "Customer", p.customer);
    detail(r++, "Site", p.site);
    detail(r++, "DPM", p.dpm);
    detail(r++, "Project Manager", p.pm);
    detail(r++, "Solution Consultant", p.sc);
    detail(r++, "GOLD order ref", p.orderRef);

    // kick-off (input) → ProjectStart
    var kick = sch.kickoff;
    M.ovStartRow = r;
    ws.set(r, 2, "Kick-off date", S.label);
    ws.set(r, 3, kick, S.input);
    var kNote = (p.start ? "" : "No kick-off date was set, so today's date is used.  ") +
      "◀ Change this and the whole plan & Gantt move.";
    ws.set(r, 4, kNote, S.note).merge(r, 4, r, LAST);
    ws.row(r, { height: heightFor(estLines(kNote, NOTE_W - 2, 10), 10, 24) });
    wb.name("ProjectStart", "'" + ws.name + "'!$C$" + r);
    r++;

    // target migration (input, optional) → TargetMigration
    var target = parseYmd(p.target);
    M.ovTargetRow = r;
    ws.set(r, 2, "Target migration date", S.label);
    ws.set(r, 3, target || null, S.inputSoft);
    var tr = "$C$" + r;
    var tDays = target ? dayDiff(dateOnly(now), target) : 0;
    ws.set(r, 4, {
      f: 'IF(ISNUMBER(' + tr + '),IF(' + tr + '=TODAY(),"Today",IF(' + tr + '>TODAY(),"In "&(' + tr + '-TODAY())&IF(' + tr + '-TODAY()=1," day"," days"),"Passed "&(TODAY()-' + tr + ')&IF(TODAY()-' + tr + '=1," day ago"," days ago")))&" · marked in red on the Gantt","Optional — type a date here to mark it in red on the Gantt")',
      v: target ? (tDays === 0 ? "Today" : tDays > 0 ? "In " + tDays + (tDays === 1 ? " day" : " days") : "Passed " + (-tDays) + (tDays === -1 ? " day ago" : " days ago")) + " · marked in red on the Gantt"
        : "Optional — type a date here to mark it in red on the Gantt",
      t: "str"
    }, S.noteGrey).merge(r, 4, r, LAST);
    ws.row(r, { height: 24 });
    wb.name("TargetMigration", "'" + ws.name + "'!$C$" + r);
    r++;

    ws.set(r, 2, "Planned finish", S.label);
    ws.set(r, 3, { f: "MAX(" + rngJ + ")", v: sch.finish }, S.valueDate);
    ws.set(r, 4, "Latest planned finish of any step on the Checklist sheet.", S.noteGrey).merge(r, 4, r, LAST);
    ws.row(r, { height: 20 });
    r++;

    M.ovPctRow = r;
    ws.set(r, 2, "Progress", S.label);
    ws.set(r, 3, { f: "IF(" + stepsF + "-" + naF + "=0,1," + doneF + "/(" + stepsF + "-" + naF + "))", v: pct }, S.pctBig);
    var nb = Math.round(pct * 20);
    ws.set(r, 4, { f: 'REPT("' + BAR + '",ROUND(C' + r + '*20,0))&REPT("' + BAR_EMPTY + '",20-ROUND(C' + r + '*20,0))', v: rep(BAR, nb) + rep(BAR_EMPTY, 20 - nb), t: "str" }, S.barBig).merge(r, 4, r, LAST);
    ws.row(r, { height: 26 });
    r++;

    ws.set(r, 2, "Steps done", S.label);
    ws.set(r, 3, {
      f: doneF + '&" of "&(' + stepsF + "-" + naF + ')&" applicable steps done"&IF(' + naF + '>0,"  ·  "&' + naF + '&" marked N/A","")&IF(COUNTIF(' + rngG + ',"In progress")>0,"  ·  "&COUNTIF(' + rngG + ',"In progress")&" in progress","")',
      v: M.doneCount + " of " + M.stepCount + " applicable steps done", t: "str"
    }, S.value).merge(r, 3, r, LAST);
    ws.row(r, { height: 20 });
    r++;
    ws.row(r++, { height: 12 });

    // phase progress table
    section(r++, "Progress by phase");
    var th = ["Phase", "Steps", "Done", "%", "Progress", "Planned start", "Planned finish"];
    for (c = 0; c < th.length; c++) { ws.set(r, 2 + c, th[c], c === 0 || c === 4 ? S.th : S.thC); }
    ws.row(r, { height: 20 });
    r++;
    var tFirst = r;
    for (i = 0; i < M.phases.length; i++) {
      var P = M.phases[i], gs = S.g[P.gi], a = P.firstStepRowC, b = P.lastStepRowC;
      var pd = 0, k;
      for (k = 0; k < P.steps.length; k++) { if (P.steps[k].done) { pd++; } }
      var ppct = P.steps.length ? pd / P.steps.length : 1, pb = Math.round(ppct * 10);
      var g = "Checklist!$G$" + a + ":$G$" + b;
      P.ovRow = r;
      ws.set(r, 2, P.short, gs.ovLabel);
      ws.set(r, 3, { f: "COUNTA(Checklist!$C$" + a + ":$C$" + b + ")", v: P.steps.length }, S.tdNum);
      ws.set(r, 4, { f: 'COUNTIF(' + g + ',"Done")', v: pd }, S.tdNum);
      ws.set(r, 5, { f: 'IF(C' + r + '-COUNTIF(' + g + ',"N/A")=0,1,D' + r + '/(C' + r + '-COUNTIF(' + g + ',"N/A")))', v: ppct }, S.tdPct);
      ws.set(r, 6, { f: 'REPT("' + BAR + '",ROUND(E' + r + '*10,0))&REPT("' + BAR_EMPTY + '",10-ROUND(E' + r + '*10,0))', v: rep(BAR, pb) + rep(BAR_EMPTY, 10 - pb), t: "str" }, gs.ovBar);
      ws.set(r, 7, { f: "MIN(Checklist!$I$" + a + ":$I$" + b + ")", v: minStart(P) }, S.tdDate);
      ws.set(r, 8, { f: "MAX(Checklist!$J$" + a + ":$J$" + b + ")", v: maxFinish(P) }, S.tdDate);
      ws.row(r, { height: heightFor(estLines(P.short, W[2], 10, true), 10, 19) });
      r++;
    }
    var tLast = r - 1;
    ws.set(r, 2, "All phases", S.totLabel);
    ws.set(r, 3, { f: "SUM(C" + tFirst + ":C" + tLast + ")", v: M.stepCount }, S.totNum);
    ws.set(r, 4, { f: "SUM(D" + tFirst + ":D" + tLast + ")", v: M.doneCount }, S.totNum);
    ws.set(r, 5, { f: "C" + M.ovPctRow, v: pct }, S.totPct);
    var tb = Math.round(pct * 10);
    ws.set(r, 6, { f: 'REPT("' + BAR + '",ROUND(E' + r + '*10,0))&REPT("' + BAR_EMPTY + '",10-ROUND(E' + r + '*10,0))', v: rep(BAR, tb) + rep(BAR_EMPTY, 10 - tb), t: "str" }, S.totBar);
    ws.set(r, 7, { f: "MIN(G" + tFirst + ":G" + tLast + ")", v: sch.start }, S.totDate);
    ws.set(r, 8, { f: "MAX(H" + tFirst + ":H" + tLast + ")", v: sch.finish }, S.totDate);
    ws.row(r, { height: 20 });
    ws.cf("B" + tFirst + ":H" + tLast, [{ formula: "$E" + tFirst + ">=1", dxf: wb.dxf({ fill: K.greenPale }) }]);
    r++;
    ws.row(r++, { height: 12 });

    // next up (static, at export)
    section(r++, "Next up  (open steps with the earliest planned start, at export)");
    var open = [];
    for (i = 0; i < M.phases.length; i++) {
      for (var j = 0; j < M.phases[i].steps.length; j++) {
        var s = M.phases[i].steps[j];
        if (!s.done) { open.push({ s: s, P: M.phases[i], order: open.length }); }
      }
    }
    open.sort(function (x, y) { return (x.s.span.start - y.s.span.start) || (x.order - y.order); });
    if (!open.length) {
      ws.set(r, 2, "All steps were done at export — nice work.", S.tdText).merge(r, 2, r, LAST);
      ws.row(r++, { height: 20 });
    } else {
      var nh = ["Phase", "Step", "", "", "", "Planned start", "Planned finish"];
      for (c = 0; c < nh.length; c++) { ws.set(r, 2 + c, nh[c], c < 5 ? S.th : S.thC); }
      ws.merge(r, 3, r, 6); ws.row(r, { height: 20 }); r++;
      for (i = 0; i < open.length && i < 3; i++) {
        var o = open[i], txt = o.s.num + "   " + o.s.text;
        ws.set(r, 2, o.P.short, S.tdMuted);
        ws.set(r, 3, txt, S.tdText).merge(r, 3, r, 6);
        ws.set(r, 7, o.s.span.start, S.tdDate);
        ws.set(r, 8, o.s.span.finish, S.tdDate);
        ws.row(r, { height: heightFor(Math.max(estLines(txt, 56, 10), estLines(o.P.short, W[2], 9.5)), 10, 19) });
        r++;
      }
    }
    ws.row(r++, { height: 12 });

    // notes
    section(r++, "Project notes");
    if (p.notes) {
      ws.set(r, 2, p.notes, S.notes).merge(r, 2, r, LAST);
      ws.row(r, { height: heightFor(estLines(p.notes, 34 + VAL_W - 2, 10.5), 10.5, 22) });
    } else {
      ws.set(r, 2, "No notes yet — add them in the checklist page, or type here.", S.notesEmpty).merge(r, 2, r, LAST);
      ws.row(r, { height: 22 });
    }
    r++;
    ws.row(r++, { height: 12 });

    // how to use
    section(r++, "How to use this workbook");
    var ov = t.overview || {};
    var how = [
      "•  Mark progress on the Checklist sheet: pick Done, In progress or N/A from the Status dropdown. The progress figures above and the bars on the Gantt update by themselves.",
      "•  Change the kick-off date (the yellow cell above) and every planned date and the Gantt move with it. Change a step's Days on the Checklist sheet to re-plan that step.",
      "•  The plan is indicative: working days Monday to Friday, with no public holidays. Re-plan around your real EDD, carrier dates and the migration date the customer confirms.",
      "•  “What it means & why” on the Checklist sheet explains every step. The About this service sheet has the overview, roles, tools, tips and key terms, and the RACI sheet shows who does what.",
      "•  Plan source: " + (ov.planSource ? "the MS Project plan “" + ov.planSource + "”" : "the DPM Knowledge Base") +
        ", via the DPM Knowledge Base delivery checklist (data updated " + updatedText() + ")."
    ];
    for (i = 0; i < how.length; i++) {
      ws.set(r, 2, how[i], S.howto).merge(r, 2, r, LAST);
      ws.row(r, { height: heightFor(estLines(how[i], 34 + VAL_W - 3, 10), 10, 20) });
      r++;
    }
    ws.row(r++, { height: 10 });
    ws.set(r, 2, "Generated by the DPM Knowledge Base · " + fmtDate(now) + " · Internal use only", S.foot).merge(r, 2, r, LAST);
  }

  function updatedText() {
    var u = DATA().updated, d = parseYmd(u);
    return d ? fmtDate(d) : (u ? String(u) : "");
  }
  function rep(s, n) { var o = ""; while (n-- > 0) { o += s; } return o; }
  function minStart(P) { var m = null, i; for (i = 0; i < P.steps.length; i++) { if (!m || P.steps[i].span.start < m) { m = P.steps[i].span.start; } } return m; }
  function maxFinish(P) { var m = null, i; for (i = 0; i < P.steps.length; i++) { if (!m || P.steps[i].span.finish > m) { m = P.steps[i].span.finish; } } return m; }

  /* ── sheet 3: Gantt ─────────────────────────────────────── */

  function monthChoose(ref) {
    return 'CHOOSE(MONTH(' + ref + '),"' + MONTHS.join('","') + '")';
  }

  function writeGantt(ws, M, p, t, S, sch, now, wb) {
    var XL = X(), st = S.st, i, j, c, r;
    var W = [0, 44, 17, 8.5, 8.5, 5, 10.5];
    for (c = 1; c <= 6; c++) { ws.col(c, { width: W[c] }); }
    var T0 = 7;                                    // first timeline column (G)
    var kick = sch.kickoff;
    var first = addDays(kick, -((kick.getDay() + 6) % 7));        // Monday on/before the kick-off
    var lastDate = addDays(sch.finish, 7);
    lastDate = addDays(lastDate, (7 - lastDate.getDay()) % 7);   // … to the end of that week (Sunday)
    var nDays = dayDiff(first, lastDate) + 1;
    var weekly = nDays > MAX_DAY_COLS;
    var step = weekly ? 7 : 1;
    var nCols = weekly ? Math.ceil(nDays / 7) : nDays;
    var TL = T0 + nCols - 1, LC = XL.col(TL);
    var dToday = dateOnly(now), target = parseYmd(p.target);
    var colDate = [];
    for (c = 0; c < nCols; c++) { colDate.push(addDays(first, c * step)); }
    for (c = T0; c <= TL; c++) { ws.col(c, { width: weekly ? 4.2 : 3.4 }); }

    function inCol(d, k) {   // is date d inside timeline column k (0-based)?
      if (!d) { return false; }
      var a = colDate[k];
      return weekly ? (d >= a && d <= addDays(a, 6)) : dayDiff(a, d) === 0;
    }

    // styles
    var hdr = { size: 9, bold: true, color: K.white };
    var sHead = st({ font: { size: 10, bold: true, color: K.white }, fill: K.dark, align: { v: "center", indent: 1 } });
    var sHeadC = st({ font: { size: 10, bold: true, color: K.white }, fill: K.dark, align: { h: "center", v: "center", wrap: true } });
    var sMonth = st({ font: hdr, fill: K.dark, align: { h: "left", v: "center" } });
    var sDayN = st({ font: { size: 8, color: K.white }, fill: "2E2E2E", align: { h: "center", v: "center" }, numFmt: weekly ? "d/m" : "d",
      border: { left: { style: "hair", color: "555555" } } });
    var sDayNW = st({ font: { size: 8, color: "9A9A9A" }, fill: "2E2E2E", align: { h: "center", v: "center" }, numFmt: "d",
      border: { left: { style: "hair", color: "555555" } } });
    var sWd = st({ font: { size: 8, color: "D0D0D0" }, fill: "3D3D3D", align: { h: "center", v: "center" }, border: { left: { style: "hair", color: "555555" } } });
    var sWdW = st({ font: { size: 8, color: "8A8A8A" }, fill: "3D3D3D", align: { h: "center", v: "center" }, border: { left: { style: "hair", color: "555555" } } });
    var sMark = st({ font: { size: 8, bold: true, color: K.mid }, align: { h: "center", v: "bottom", rotate: 90 } });
    var rowLine = { style: "hair", color: "E6E6E6" };
    var sTask = st({ font: { size: 9.5, color: K.dark }, border: { bottom: rowLine }, align: { v: "center", wrap: true, indent: 2 } });
    var sExtra = st({ font: { size: 9.5, italic: true, color: K.mid }, border: { bottom: rowLine }, align: { v: "center", wrap: true, indent: 2 } });
    var sWho = st({ font: { size: 8.5, color: K.mid }, border: { bottom: rowLine }, align: { v: "center", wrap: true } });
    var sDate = st({ font: { size: 9, color: K.text }, border: { bottom: rowLine }, align: { h: "center", v: "center" }, numFmt: "d mmm" });
    var sDays = st({ font: { size: 9, color: K.text }, border: { bottom: rowLine }, align: { h: "center", v: "center" } });
    var sStat = st({ font: { size: 8.5, color: K.mid }, border: { bottom: rowLine }, align: { h: "center", v: "center" } });
    var sPhDate = st({ font: { size: 9, bold: true, color: K.dark }, fill: K.faint, border: { top: { style: "thin", color: "D6D6D6" } }, align: { h: "center", v: "center" }, numFmt: "d mmm" });
    var sPhNum = st({ font: { size: 9, bold: true, color: K.dark }, fill: K.faint, border: { top: { style: "thin", color: "D6D6D6" } }, align: { h: "center", v: "center" } });
    var sPhPct = st({ font: { size: 9, bold: true, color: K.dark }, fill: K.faint, border: { top: { style: "thin", color: "D6D6D6" } }, align: { h: "center", v: "center" }, numFmt: "0%" });
    var sPhWho = st({ font: { size: 8.5, italic: true, color: K.mid }, fill: K.faint, border: { top: { style: "thin", color: "D6D6D6" } }, align: { v: "center" } });
    // timeline body: weekday / Monday (week line) / weekend
    function cellStyle(k, phaseRow) {
      var d = colDate[k], mon = weekly || d.getDay() === 1, we = !weekly && isWeekend(d);
      var spec = { border: { bottom: rowLine } };
      if (phaseRow) { spec.border.top = { style: "thin", color: "D6D6D6" }; }
      if (mon) { spec.border.left = { style: "thin", color: "D4D4D4" }; }
      if (we) { spec.fill = K.weekend; }
      return st(spec);
    }
    var bodyStyle = [], phaseBodyStyle = [];
    for (c = 0; c < nCols; c++) { bodyStyle.push(cellStyle(c, false)); phaseBodyStyle.push(cellStyle(c, true)); }

    // title rows
    ws.set(1, 1, "Gantt — " + p.name, S.title16).merge(1, 1, 1, 6);
    ws.row(1, { height: 27 });
    ws.set(2, 1, "Indicative plan in working days (Mon–Fri, no holidays) from the kick-off date on the Overview sheet. " +
      "Bars follow the Status on the Checklist sheet" + (weekly ? "; one column per week." : "."), S.subWrap).merge(2, 1, 2, 6);
    ws.row(2, { height: 48 });

    // header rows 3–5
    var heads = ["Task", "Who", "Start", "Finish", "Days", "Status"];
    for (c = 1; c <= 6; c++) {
      ws.set(3, c, heads[c - 1], c <= 2 ? sHead : sHeadC).merge(3, c, 5, c);
    }
    ws.row(3, { height: 16 }); ws.row(4, { height: 15 }); ws.row(5, { height: 14 });
    for (c = 0; c < nCols; c++) {
      var col = T0 + c, L = XL.col(col), P0 = XL.col(col - 1), d = colDate[c];
      // row 4: dates, chained from ProjectStart
      ws.set(4, col, c === 0 ? { f: "ProjectStart-WEEKDAY(ProjectStart,3)", v: d } : { f: P0 + "4+" + step, v: d },
        (!weekly && isWeekend(d)) ? sDayNW : sDayN);
      // row 5: weekday letters (the first column is always a Monday)
      if (!weekly) { ws.set(5, col, DAY_LETTERS[d.getDay()], isWeekend(d) ? sWdW : sWd); }
      else { ws.set(5, col, null, sWd); }
      // row 3: month labels ("Oct" + "’26" in the next column)
      var lbl, cached;
      if (c === 0) {
        var ok0 = weekly ? d.getDate() <= 21 : addDays(d, 2).getMonth() === d.getMonth();
        lbl = weekly ? 'IF(DAY(' + L + '$4)<=21,' + monthChoose(L + "$4") + ',"")'
          : 'IF(MONTH(' + L + '$4+2)=MONTH(' + L + '$4),' + monthChoose(L + "$4") + ',"")';
        cached = ok0 ? MONTHS[d.getMonth()] : "";
      } else {
        var isStart = weekly ? d.getDate() <= 7 : d.getDate() === 1;
        lbl = 'IF(' + (weekly ? 'DAY(' + L + '$4)<=7' : 'DAY(' + L + '$4)=1') + ',' + monthChoose(L + "$4") +
          ',IF(AND(' + P0 + '3<>"",LEFT(' + P0 + '3,1)<>"' + APOS + '"),"' + APOS + '"&RIGHT(YEAR(' + L + '$4),2),""))';
        var prev = colDate.prevLabel;
        cached = isStart ? MONTHS[d.getMonth()] : (prev && prev.charAt(0) !== APOS ? APOS + String(d.getFullYear()).substring(2) : "");
      }
      colDate.prevLabel = cached;
      ws.set(3, col, { f: lbl, v: cached, t: "str" }, sMonth);
      // row 2: "Migration" / "Today" markers
      var mk = weekly
        ? 'IF(AND(ISNUMBER(TargetMigration),TargetMigration>=' + L + '$4,TargetMigration<=' + L + '$4+6),"Migration",IF(AND(TODAY()>=' + L + '$4,TODAY()<=' + L + '$4+6),"Today",""))'
        : 'IF(AND(ISNUMBER(TargetMigration),' + L + '$4=TargetMigration),"Migration",IF(' + L + '$4=TODAY(),"Today",""))';
      ws.set(2, col, { f: mk, v: inCol(target, c) ? "Migration" : inCol(dToday, c) ? "Today" : "", t: "str" }, sMark);
    }

    // task rows
    r = 6;
    var phaseRanges = [], groupRanges = [[], [], [], []], mileRows = [];
    function timeline(row, phaseRow) {
      for (var k = 0; k < nCols; k++) { ws.set(row, T0 + k, null, phaseRow ? phaseBodyStyle[k] : bodyStyle[k]); }
    }
    function datesFor(row, pl, isMile) {
      ws.set(row, 3, { f: "WORKDAY(ProjectStart-1," + (pl.start + 1) + ")", v: addWorkdays(kick, pl.start) }, sDate);
      var sp = spanOf(kick, pl);
      ws.set(row, 4, isMile ? { f: "C" + row, v: sp.finish } : { f: "IF(E" + row + "<=1,C" + row + ",WORKDAY(C" + row + ",E" + row + "-1))", v: sp.finish }, sDate);
      ws.set(row, 5, pl.days, sDays);
    }
    function milestoneRow(row, name, pl, gs, span) {
      ws.set(row, 1, DIAMOND + "  " + name, sExtra);
      ws.set(row, 2, "Milestone", sWho);
      datesFor(row, pl, true);
      ws.set(row, 6, null, sStat);
      for (var k = 0; k < nCols; k++) {
        var L2 = XL.col(T0 + k);
        var f = weekly ? 'IF(AND($C' + row + '>=' + L2 + '$4,$C' + row + '<=' + L2 + '$4+6),"' + DIAMOND + '","")'
          : 'IF(' + L2 + '$4=$C' + row + ',"' + DIAMOND + '","")';
        ws.set(row, T0 + k, { f: f, v: inCol(span.start, k) ? DIAMOND : "", t: "str" }, gs.gMile);
      }
      mileRows.push(row);
      ws.row(row, { height: heightFor(estLines(DIAMOND + "  " + name, W[1] - 2, 9.5), 9.5, 17) });
    }

    for (i = 0; i < M.phases.length; i++) {
      var P = M.phases[i], gs = S.g[P.gi];
      var pr = r++;
      P.rowG = pr;
      var rowsFrom = r;
      for (j = 0; j < P.steps.length; j++) {
        var s = P.steps[j], rc = s.rowC;
        ws.set(r, 1, s.num + "  " + s.text, sTask);
        ws.set(r, 2, s.who, sWho);
        ws.set(r, 3, { f: "Checklist!I" + rc, v: s.span.start }, sDate);
        ws.set(r, 4, { f: "Checklist!J" + rc, v: s.span.finish }, sDate);
        ws.set(r, 5, { f: "Checklist!K" + rc, v: s.plan.days }, sDays);
        ws.set(r, 6, { f: '""&Checklist!G' + rc, v: s.done ? "Done" : "Not started", t: "str" }, sStat);
        timeline(r, false);
        ws.row(r, { height: heightFor(Math.max(estLines(s.num + "  " + s.text, W[1] - 3, 9.5), estLines(s.who, W[2], 8.5)), 9.5, 17) });
        r++;
      }
      for (j = 0; j < P.extras.length; j++) {
        var e = P.extras[j];
        if (e.milestone) { milestoneRow(r, e.name, e.plan, gs, e.span); r++; continue; }
        ws.set(r, 1, e.name, sExtra);
        ws.set(r, 2, "From the plan", sWho);
        datesFor(r, e.plan, false);
        ws.set(r, 6, null, sStat);
        timeline(r, false);
        ws.row(r, { height: heightFor(estLines(e.name, W[1] - 3, 9.5), 9.5, 17) });
        r++;
      }
      var blockEnd = r - 1;
      if (P.milestone) {
        milestoneRow(r, P.milestone.name, P.milestone.plan, gs, P.milestone.span);
        r++;
      }
      // contiguous runs of non-milestone rows
      var runStart = null, rr;
      for (rr = rowsFrom; rr <= blockEnd + 1; rr++) {
        var isM = false, q;
        for (q = 0; q < mileRows.length; q++) { if (mileRows[q] === rr) { isM = true; } }
        if (rr <= blockEnd && !isM) { if (runStart === null) { runStart = rr; } }
        else if (runStart !== null) { groupRanges[P.gi].push(XL.col(T0) + runStart + ":" + LC + (rr - 1)); runStart = null; }
      }
      // phase summary row
      ws.set(pr, 1, P.label, gs.gPhase);
      ws.set(pr, 2, P.steps.length + (P.steps.length === 1 ? " step" : " steps"), sPhWho);
      ws.set(pr, 3, { f: "MIN($C$" + (pr + 1) + ":$C$" + (r - 1) + ")", v: P.span.start }, sPhDate);
      ws.set(pr, 4, { f: "MAX($D$" + (pr + 1) + ":$D$" + (r - 1) + ")", v: P.span.finish }, sPhDate);
      ws.set(pr, 5, { f: "NETWORKDAYS($C$" + pr + ",$D$" + pr + ")", v: networkDays(P.span.start, P.span.finish) }, sPhNum);
      var ppd = 0, kk;
      for (kk = 0; kk < P.steps.length; kk++) { if (P.steps[kk].done) { ppd++; } }
      ws.set(pr, 6, { f: "Overview!$E$" + P.ovRow, v: P.steps.length ? ppd / P.steps.length : 1 }, sPhPct);
      timeline(pr, true);
      ws.row(pr, { height: heightFor(estLines(P.label, W[1], 10, true), 10, 20) });
      phaseRanges.push(XL.col(T0) + pr + ":" + LC + pr);
    }
    var lastRow = r - 1;
    var body = XL.col(T0) + "6:" + LC + lastRow;
    var TC = XL.col(T0);

    // conditional formatting — bars first (highest priority)
    function inSpan(row) {
      return weekly ? "AND($C" + row + "<=" + TC + "$4+6,$D" + row + ">=" + TC + "$4)"
        : "AND(" + TC + "$4>=$C" + row + "," + TC + "$4<=$D" + row + ")";
    }
    if (phaseRanges.length) {
      var pr0 = +/\d+/.exec(phaseRanges[0])[0];
      ws.cf(phaseRanges.join(" "), [{ formula: inSpan(pr0), dxf: wb.dxf({ fill: K.phaseBar }) }]);
    }
    var dxNa = wb.dxf({ fill: { pattern: "lightUp", color: K.naLine, bg: K.naBg } });
    for (i = 0; i < GROUPS.length; i++) {
      if (!groupRanges[i].length) { continue; }
      var r0 = +/\d+/.exec(groupRanges[i][0].replace(/^[A-Z]+/, ""))[0];
      var span = inSpan(r0);
      ws.cf(groupRanges[i].join(" "), [
        { formula: "AND($F" + r0 + '="N/A",' + span + ")", dxf: dxNa },
        { formula: "AND($F" + r0 + '="Done",' + span + ")", dxf: wb.dxf({ fill: GROUPS[i].solid }) },
        { formula: span, dxf: wb.dxf({ fill: GROUPS[i].tint }) }
      ]);
    }
    // today + target: lines over the bars, and a tint behind them (lower priority)
    var isTarget = weekly ? "AND(ISNUMBER(TargetMigration),TargetMigration>=" + TC + "$4,TargetMigration<=" + TC + "$4+6)"
      : "AND(ISNUMBER(TargetMigration)," + TC + "$4=TargetMigration)";
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
      { formula: TC + '2="Migration"', dxf: wb.dxf({ font: { bold: true, color: K.red } }) },
      { formula: TC + '2="Today"', dxf: wb.dxf({ font: { bold: true, color: K.orange } }) }
    ]);
    ws.cf("F6:F" + lastRow, [
      { formula: '$F6="Done"', dxf: wb.dxf({ font: { bold: true, color: K.green } }) },
      { formula: '$F6="In progress"', dxf: wb.dxf({ font: { bold: true, color: K.amberInk } }) },
      { formula: '$F6="N/A"', dxf: wb.dxf({ font: { italic: true, color: "9A9A9A" } }) },
      { formula: 'AND($F6<>"Done",$F6<>"N/A",ISNUMBER($D6),$D6<TODAY(),$A6<>"",ISTEXT($F6),$F6<>"")', dxf: wb.dxf({ font: { bold: true, color: K.red } }) }
    ]);

    // legend
    r = lastRow + 2;
    ws.set(r, 1, "Legend", st({ font: { size: 10, bold: true, color: K.dark }, align: { v: "center" } }));
    ws.set(r, 2, "Dates move with the kick-off date on the Overview sheet.", st({ font: { size: 8.5, italic: true, color: K.mid }, align: { v: "center" } }));
    var items = [];
    for (i = 0; i < M.groupsUsed.length; i++) {
      var gu = M.groupsUsed[i];
      items.push([S.g[gu.gi].legend, gu.label]);
    }
    items.push([S.g[M.phases[0].gi].legendTint, "Light bar = to do, solid = done"]);
    items.push([st({ fill: K.phaseBar }), "Whole phase"]);
    items.push([st({ fill: { pattern: "lightUp", color: K.naLine, bg: K.naBg } }), "Not applicable (N/A)"]);
    items.push([st({ font: { bold: true, color: K.text }, align: { h: "center" } }), DIAMOND + "  Milestone", DIAMOND]);
    items.push([st({ fill: K.orangePale, border: { left: { style: "thin", color: K.orange }, right: { style: "thin", color: K.orange } } }), "Today"]);
    items.push([st({ fill: K.redPale, border: { left: { style: "thin", color: K.red }, right: { style: "thin", color: K.red } } }), "Target migration date"]);
    if (!weekly) { items.push([st({ fill: K.weekend }), "Weekend"]); }
    var sLeg = st({ font: { size: 8.5, color: K.text }, align: { v: "center" } });
    var per = Math.max(1, Math.floor(nCols / 12)), slot = Math.max(12, Math.floor(nCols / per));
    if (per > items.length) { per = items.length; }
    for (i = 0; i < items.length; i++) {
      var rowL = r + 1 + Math.floor(i / per), colL = T0 + (i % per) * slot;
      if (colL + 2 > TL && per > 1) { colL = T0; }
      ws.set(rowL, colL, items[i][2] || null, items[i][0]);
      ws.set(rowL, colL + 1, null, null);
      ws.set(rowL, colL + 2, items[i][2] ? items[i][1].replace(DIAMOND + "  ", "") : items[i][1], sLeg);
      ws.row(rowL, { height: 16 });
    }
    M.ganttLastRow = lastRow;
    M.ganttWeekly = weekly;
    M.ganttCols = nCols;
  }

  /* ── sheet 4: About this service ────────────────────────── */

  function writeAbout(ws, M, t, S) {
    var st = S.st, i, r;
    var ov = t.overview || {};
    ws.col(1, { width: 2.5 }); ws.col(2, { width: 1.3 }); ws.col(3, { width: 30 }); ws.col(4, { width: 92 }); ws.col(5, { width: 2.5 });
    var FULL = 30 + 92;
    var sPara = st({ font: { size: 10.5, color: K.text }, align: { v: "top", wrap: true } });
    var sBullet = st({ font: { size: 10, color: K.text }, border: { bottom: { style: "hair", color: "EDEDED" } }, align: { v: "top", wrap: true, indent: 1 } });
    var sKey = st({ font: { size: 10, bold: true, color: K.dark }, border: { bottom: { style: "hair", color: "EDEDED" } }, align: { v: "top", wrap: true, indent: 1 } });
    var sVal = st({ font: { size: 10, color: K.text }, border: { bottom: { style: "hair", color: "EDEDED" } }, align: { v: "top", wrap: true } });
    var sStage = st({ font: { size: 10, bold: true, color: K.mid }, align: { v: "bottom", indent: 1 } });
    var sAccent = st({ fill: K.orange });
    var sHead = st({ font: { size: 13, bold: true, color: K.dark }, border: { bottom: { style: "thin", color: K.orangeTint } }, align: { v: "center", indent: 1 } });

    ws.set(1, 2, null, S.band).merge(1, 2, 1, 4); ws.row(1, { height: 6 });
    ws.set(2, 2, "About this service — " + t.title, S.title).merge(2, 2, 2, 4); ws.row(2, { height: 36 });
    ws.set(3, 2, t.blurb || "", S.subWrap).merge(3, 2, 3, 4);
    ws.row(3, { height: heightFor(estLines(t.blurb, FULL, 10), 10, 20) });
    r = 4;

    function section(text) {
      ws.row(r++, { height: 12 });
      ws.set(r, 2, null, sAccent);
      ws.set(r, 3, text, sHead).merge(r, 3, r, 4);
      ws.row(r, { height: 24 });
      r++;
    }
    function para(text) {
      ws.set(r, 3, text, sPara).merge(r, 3, r, 4);
      ws.row(r, { height: heightFor(estLines(text, FULL - 2, 10.5), 10.5, 18) });
      r++;
    }
    function bullets(list, mark) {
      for (var k = 0; k < list.length; k++) {
        var txt = (mark || "•") + "  " + list[k];
        ws.set(r, 3, txt, sBullet).merge(r, 3, r, 4);
        ws.row(r, { height: heightFor(estLines(txt, FULL - 4, 10), 10, 18) });
        r++;
      }
    }
    function pairs(list, keyName, valName) {
      for (var k = 0; k < list.length; k++) {
        var a = list[k][keyName] || "", b = list[k][valName] || "";
        ws.set(r, 3, a, sKey);
        ws.set(r, 4, b, sVal);
        ws.row(r, { height: heightFor(Math.max(estLines(a, 28, 10, true), estLines(b, 90, 10)), 10, 18) });
        r++;
      }
    }

    section("What this service is");
    para(ov.summary || t.blurb || "");
    if (isArr(ov.keyFacts) && ov.keyFacts.length) { section("Key facts"); bullets(ov.keyFacts); }

    section("How it runs");
    var lastStage = null;
    for (i = 0; i < M.phases.length; i++) {
      var P = M.phases[i], gs = S.g[P.gi];
      if (P.stage && P.stage !== lastStage) {
        lastStage = P.stage;
        ws.set(r, 3, "Stage " + P.stage.id + " — " + P.stage.name + (P.stage.note ? "  (" + P.stage.note + ")" : ""), sStage).merge(r, 3, r, 4);
        ws.row(r, { height: 22 });
        r++;
      }
      var nWd = networkDays(P.span.start, P.span.finish);
      var detail = P.summary + "\n" + P.steps.length + (P.steps.length === 1 ? " step" : " steps") +
        " · planned working days " + (dayOffset(P, "start") + 1) + "–" + (dayOffset(P, "end") + 1) +
        " of the plan (" + nWd + (nWd === 1 ? " working day" : " working days") + ")" +
        (P.milestone ? " · milestone: " + P.milestone.name : "");
      ws.set(r, 3, (P.idx + 1) + ". " + P.name, gs.aboutPhase);
      ws.set(r, 4, detail, sVal);
      ws.row(r, { height: heightFor(Math.max(estLines(detail, 90, 10), estLines((P.idx + 1) + ". " + P.name, 27, 10.5, true)), 10, 18) });
      r++;
    }
    if (isArr(ov.roles) && ov.roles.length) { section("Who's involved"); pairs(ov.roles, "role", "part"); }
    if (isArr(ov.tools) && ov.tools.length) { section("Tools you'll use"); pairs(ov.tools, "name", "use"); }
    if (isArr(ov.tips) && ov.tips.length) { section("Tips"); bullets(ov.tips, "✓"); }
    if (isArr(ov.terms) && ov.terms.length) { section("Key terms"); pairs(ov.terms, "term", "meaning"); }
    section("Where to get help");
    var help = [], k;
    for (k = 0; k < HELP.length; k++) { help.push({ a: HELP[k][0], b: HELP[k][1] }); }
    pairs(help, "a", "b");
    section("About the plan");
    var about = [];
    if (ov.planSource) { about.push({ a: "Plan source", b: "MS Project plan “" + ov.planSource + "” (indicative, single site)." }); }
    if (ov.planNote) { about.push({ a: "How the plan was built", b: ov.planNote }); }
    about.push({ a: "Working days", b: "Monday to Friday, with no public holidays. Offsets count from the kick-off date on the Overview sheet (a weekend kick-off starts on the Monday)." });
    about.push({ a: "Checklist data", b: "DPM Knowledge Base delivery checklist, updated " + updatedText() + ". The steps mirror the " + t.title + " page." });
    pairs(about, "a", "b");
  }
  function dayOffset(P, which) {
    var v = null, i, all = [];
    for (i = 0; i < P.steps.length; i++) { all.push(P.steps[i].plan); }
    for (i = 0; i < P.extras.length; i++) { all.push(P.extras[i].plan); }
    if (P.milestone) { all.push(P.milestone.plan); }
    for (i = 0; i < all.length; i++) {
      var s = all[i].start, e = all[i].start + Math.max(all[i].days, 1) - 1;
      if (which === "start") { if (v === null || s < v) { v = s; } }
      else if (v === null || e > v) { v = e; }
    }
    return v || 0;
  }

  /* ── sheet 5: RACI ──────────────────────────────────────── */

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

    // legend
    r = 5;
    ws.set(r, 2, "How to read it", sLegLbl);
    var leg = [["A/R", "Owns & does the work"], ["A", "Accountable — owns the outcome"], ["R", "Responsible — does the work"],
      ["C", "Consulted"], ["I", "Informed"], ["-", "Not involved"]];
    for (i = 0; i < leg.length; i++) {
      ws.set(r, 3 + i, leg[i][0] === "-" ? "–" : leg[i][0], sty[leg[i][0]]);
      ws.set(r + 1, 3 + i, leg[i][1], sCap);
    }
    ws.row(r, { height: 22 }); ws.row(r + 1, { height: 36 });

    // matrix
    r = 8;
    ws.set(r, 2, "Activity", sHeadL);
    for (c = 0; c < RACI_ROLES.length; c++) { ws.set(r, 3 + c, RACI_ROLES[c], c === 0 ? sHeadDpm : sHead); }
    ws.row(r, { height: 24 });
    r++;
    var top = r;
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

    // golden rule
    var sGoldH = st({ font: { size: 12, bold: true, color: K.white }, fill: K.dark, align: { v: "center", indent: 1 } });
    var sGold = st({ font: { size: 10.5, color: "E8E8E8" }, fill: K.dark, align: { v: "top", wrap: true, indent: 1 } });
    ws.set(r, 2, "⭐  The DPM golden rule", sGoldH).merge(r, 2, r, 9); ws.row(r, { height: 26 }); r++;
    ws.set(r, 2, GOLDEN_RULE, sGold).merge(r, 2, r, 9);
    ws.row(r, { height: heightFor(estLines(GOLDEN_RULE, 42 + 7 * 12.5 - 4, 10.5), 10.5, 40) + 6 });
    r++;
    ws.row(r++, { height: 14 });

    // roles
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
    return top;
  }

  /* ── the workbook ───────────────────────────────────────── */

  function buildWorkbook(project, opts) {
    var XL = X();
    opts = opts || {};
    var p = normProject(project);
    var t = typeOf(p);
    var now = isDate(opts.now) ? opts.now : new Date();
    var nowDay = dateOnly(now);
    var sch = schedule(p);
    var M = buildModel(t, p, sch);

    var wb = new XL.Workbook({
      title: "Delivery Checklist — " + p.name,
      subject: t.title,
      creator: "DPM Knowledge Base",
      description: "Delivery checklist, plan and Gantt exported from the DPM Knowledge Base on " + fmtDate(nowDay) + ".",
      keywords: "DPM; delivery checklist; Gantt; " + (t.short || ""),
      created: now
    });
    var S = makeStyles(wb);

    // sheet order = creation order; fill them in dependency order
    var wsO = wb.sheet("Overview", { tabColor: K.orange, showGrid: false, zoom: 100, landscape: false, fitWidth: 1, paper: "A4",
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6 }, footer: "&L&8DPM Knowledge Base&R&8Page &P of &N" });
    var wsC = wb.sheet("Checklist", { tabColor: K.dark, showGrid: false, zoom: 100, freeze: { row: CK_HEAD, col: 3 },
      landscape: true, fitWidth: 1, paper: "A4", printTitleRows: CK_HEAD + ":" + CK_HEAD,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5 }, footer: "&L&8" + "DPM Knowledge Base" + "&R&8Page &P of &N" });
    var wsG = wb.sheet("Gantt", { tabColor: "1BA0D7", showGrid: false, zoom: 90, freeze: { row: 5, col: 6 },
      landscape: true, fitWidth: 1, paper: "A4", printTitleRows: "3:5",
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4 }, footer: "&L&8DPM Knowledge Base&R&8Page &P of &N" });
    var wsA = wb.sheet("About this service", { tabColor: "00A86B", showGrid: false, zoom: 100, fitWidth: 1, paper: "A4",
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6 } });
    var wsR = wb.sheet("RACI", { tabColor: "8A8A8A", showGrid: false, zoom: 100, landscape: true, fitWidth: 1, paper: "A4" });

    writeChecklist(wsC, M, p, t, S);
    writeOverview(wsO, M, p, t, S, sch, nowDay, wb);
    writeGantt(wsG, M, p, t, S, sch, nowDay, wb);
    writeAbout(wsA, M, t, S);
    writeRaci(wsR, S);
    return wb.toBytes();
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
    return "DPM-Checklist_" + slug(project && project.name) + "_" + ymd(d) + ".xlsx";
  }

  function download(project) {
    var url = null;
    try {
      var bytes = buildWorkbook(project);
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
      if (root.console && root.console.error) { root.console.error("Excel export failed:", e); }
      return false;
    }
  }

  root.KBChecklistExport = {
    version: 1,
    schedule: schedule,
    buildWorkbook: buildWorkbook,
    fileName: fileName,
    download: download,
    addWorkdays: addWorkdays
  };
})(typeof window !== "undefined" ? window : this);
