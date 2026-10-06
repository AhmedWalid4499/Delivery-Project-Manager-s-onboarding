/* ═══════════════════════════════════════════════════════════
   Orange Business — Network Knowledge Base
   SITE SEARCH  ·  "search anything" command palette
   ───────────────────────────────────────────────────────────
   Loaded on every page (bootstrapped by shared.js). Fetches
   search-index.json (every page's full text + every glossary
   term) and renders a keyboard-navigable search overlay.
   • A "Search" pill is injected into the top nav on every page.
   • The home hero and any [data-kb-open] element open it too.
   • Shortcuts: Ctrl/⌘-K to open, Esc to close. (The bare "/" key
     shortcut was removed: single-character shortcuts can fire by
     accident for speech-input users, WCAG 2.1.4.)
   The index (search-index.json, plus page-meta.json) is rebuilt
   by build-search-index.ps1 at the repo root. GitHub Actions runs
   it on every push to main, so you only need to run it by hand
   to preview search locally (see README notes).
═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var INDEX = [], LOADED = false, LOADING = false, cbs = [];

  /* c = brand hue (icon tile only), t = text ink for the category label,
     >= 4.5:1 on white and on the active row (#FFE8D6) */
  var CAT = {
    Home:       { c: "#FF6200", t: "#B34200", i: "🏠" },
    Networking: { c: "#1BA0D7", t: "#0B6A93", i: "🌐" },
    Vendors:    { c: "#7C3AED", t: "#6D28D9", i: "🖥️" },
    Process:    { c: "#0E8A4A", t: "#0A7A4A", i: "📋" },
    Tools:      { c: "#2563EB", t: "#1D4ED8", i: "🧰" },
    Team:       { c: "#D6336C", t: "#B0275A", i: "👥" },
    Squads:     { c: "#0E8AA6", t: "#0B6E80", i: "⚡" },
    Reference:  { c: "#C77700", t: "#8A5200", i: "📚" },
    Glossary:   { c: "#C77700", t: "#8A5200", i: "📖" },
    Page:       { c: "#787878", t: "#5E5E5E", i: "📄" }
  };

  /* ---------- index loading ---------- */
  function loadIndex(cb) {
    if (LOADED) { cb(); return; }
    if (cb) cbs.push(cb);
    if (LOADING) return;
    LOADING = true;
    fetch("search-index.json?cb=" + Date.now())
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (d) { INDEX = d || []; LOADED = true; flush(); })
      ["catch"](function () { INDEX = []; LOADED = true; flush(); });
  }
  function flush() { var f = cbs; cbs = []; f.forEach(function (fn) { fn(); }); }

  /* ---------- text helpers ---------- */
  function tokenize(q) {
    var m = (q || "").toLowerCase().match(/[a-z0-9]+/g) || [];
    return m.filter(function (t) { return t.length >= 2; });
  }
  function esc(s) {
    return (s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* ---------- scoring ---------- */
  function score(e, toks, raw) {
    var title = (e.t || "").toLowerCase();
    var heads = (e.h || []).join(" ").toLowerCase();
    var text = (e.x || "").toLowerCase();
    var s = 0, all = true;

    if (raw.length >= 2) {
      if (title === raw) s += 500;
      else if (title.indexOf(raw) >= 0) s += 180;
      if (heads.indexOf(raw) >= 0) s += 45;
      if (text.indexOf(raw) >= 0) s += 25;
    }
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], hit = false, ti = title.indexOf(t);
      if (ti >= 0) { hit = true; s += 55; if (ti === 0) s += 25; if ((" " + title + " ").indexOf(" " + t + " ") >= 0) s += 25; }
      if (heads.indexOf(t) >= 0) { hit = true; s += 18; }
      var p = text.indexOf(t);
      if (p >= 0) { hit = true; var c = 0, f = 0; while ((f = text.indexOf(t, f)) >= 0 && c < 8) { c++; f += t.length; } s += Math.min(c, 8) * 4; }
      if (!hit) all = false;
    }
    if (all && toks.length > 1) s += 60;
    if (e.c === "Glossary") { if (title === raw) s += 350; else if (title.indexOf(raw) === 0) s += 140; }
    return s;
  }
  function run(q) {
    var toks = tokenize(q), raw = (q || "").toLowerCase().trim();
    if (!toks.length) return [];
    var out = [];
    for (var i = 0; i < INDEX.length; i++) { var sc = score(INDEX[i], toks, raw); if (sc > 0) out.push([sc, INDEX[i]]); }
    out.sort(function (a, b) { return b[0] - a[0]; });
    return out.slice(0, 12).map(function (o) { return o[1]; });
  }

  /* ---------- snippet + highlight ---------- */
  function snip(e, toks) {
    if (e.c === "Glossary") return e.x || "";
    var text = e.x || "", low = text.toLowerCase(), pos = -1;
    for (var i = 0; i < toks.length; i++) { var p = low.indexOf(toks[i]); if (p >= 0 && (pos < 0 || p < pos)) pos = p; }
    if (pos < 0) return text.slice(0, 150);
    var st = Math.max(0, pos - 55);
    return (st > 0 ? "… " : "") + text.slice(st, st + 175) + (st + 175 < text.length ? " …" : "");
  }
  function hl(str, toks) {
    var out = esc(str);
    var parts = toks.filter(Boolean).map(reEsc);
    if (!parts.length) return out;
    return out.replace(new RegExp("(" + parts.join("|") + ")", "ig"), "<mark>$1</mark>");
  }
  /* ---------- overlay ---------- */
  var ov, panel, inp, res, live, rows = [], active = -1, curToks = [];
  var opener = null, inerted = [];

  /* Combobox pattern: the input keeps focus; ↑/↓ move a virtual cursor over the
     listbox options (aria-activedescendant) and Enter opens the active one. */
  function build() {
    ov = document.createElement("div");
    ov.className = "kbso";
    ov.setAttribute("aria-hidden", "true");
    ov.innerHTML =
      '<div class="kbso-back"></div>' +
      '<div class="kbso-panel" role="dialog" aria-modal="true" aria-label="Search the knowledge base">' +
        '<div class="kbso-top">' +
          '<svg class="kbso-mag" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
          '<input id="kbsoInput" type="search" role="combobox" aria-label="Search the knowledge base" aria-autocomplete="list" aria-expanded="false" aria-controls="kbsoResults" aria-describedby="kbsoHelp" autocomplete="off" spellcheck="false" placeholder="Search anything — a topic, a device, a process step, a person, a term…">' +
          '<button class="kbso-esc" type="button" aria-label="esc, close search">esc</button>' +
        '</div>' +
        '<div class="kbso-results" id="kbsoResults" role="listbox" aria-label="Search results"></div>' +
        '<div class="kbso-foot" id="kbsoHelp"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span><span class="kbso-brand" aria-hidden="true">Orange Business KB</span></div>' +
        '<div class="kbso-sr" id="kbsoLive" role="status" aria-live="polite" aria-atomic="true"></div>' +
      '</div>';
    document.body.appendChild(ov);
    panel = ov.querySelector(".kbso-panel");
    inp = ov.querySelector("#kbsoInput");
    res = ov.querySelector("#kbsoResults");
    live = ov.querySelector("#kbsoLive");
    ov.querySelector(".kbso-back").addEventListener("click", close);
    ov.querySelector(".kbso-esc").addEventListener("click", close);
    var deb;
    inp.addEventListener("input", function () { clearTimeout(deb); deb = setTimeout(function () { render(inp.value); }, 90); });
    inp.addEventListener("keydown", onKey);
    /* keep Tab / Shift+Tab inside the dialog */
    panel.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = [].filter.call(panel.querySelectorAll("input, button, [href], [tabindex]:not([tabindex='-1'])"), function (n) { return !n.disabled && n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  var liveT;
  function say(msg) {
    if (!live) return;
    clearTimeout(liveT);
    liveT = setTimeout(function () { live.textContent = msg; }, 250);
  }
  function setExpanded(on) { if (inp) inp.setAttribute("aria-expanded", on ? "true" : "false"); }

  /* the first row on any non-empty query: hand the question to the AI assistant.
     Its href is a working fallback (assistant.html?q=…) if the assistant JS
     hasn't loaded yet; otherwise activateRow() calls window.KBAssistant.ask. */
  function askRowHTML(q, idx) {
    var fallback = "assistant.html?q=" + encodeURIComponent(q);
    return '<a class="kbso-row kbso-ask" id="kbso-opt-' + idx + '" role="option" aria-selected="false" tabindex="-1" href="' + esc(fallback) + '" data-ask="1">' +
        '<span class="kbso-ic kbso-ask-ic" aria-hidden="true">✨</span>' +
        '<span class="kbso-main">' +
          '<span class="kbso-t"><span class="kbso-tt">Ask the DPM Assistant about “' + esc(q) + '”</span><span class="kbso-cat kbso-ask-cat">Assistant</span></span>' +
          '<span class="kbso-s">Get an AI answer that searches the Knowledge Base and cites the pages it uses.</span>' +
        '</span>' +
      '</a>';
  }
  function activateRow(row) {
    if (!row) return;
    if (row.getAttribute("data-ask") === "1") {
      var q = (inp.value || "").replace(/^\s+|\s+$/g, "");
      close();
      if (window.KBAssistant && typeof window.KBAssistant.ask === "function") window.KBAssistant.ask(q);
      else location.href = "assistant.html?q=" + encodeURIComponent(q);
      return;
    }
    location.href = row.getAttribute("href");
  }

  function render(q) {
    curToks = tokenize(q);
    inp.removeAttribute("aria-activedescendant");
    if (!q.trim()) {
      res.innerHTML = '<div class="kbso-empty" role="presentation">Type to search the whole knowledge base — networking, vendors, the delivery process, the DPM team, and every glossary term. Or ask the DPM Assistant.</div>';
      rows = []; active = -1; setExpanded(false); say(""); return;
    }
    /* the AI hand-off row is always first on a non-empty query */
    var html = askRowHTML(q, 0);
    var list = LOADED ? run(q) : [];
    var sayMsg;
    if (!LOADED) {
      html += '<div class="kbso-empty" role="presentation">Searching pages…</div>';
      sayMsg = "Searching pages. You can also ask the DPM Assistant.";
    } else if (!list.length) {
      html += '<div class="kbso-empty" role="presentation">No page matches for “' + esc(q) + '”. Try a different word, or ask the DPM Assistant above.</div>';
      sayMsg = "No page matches for " + q + ". You can ask the DPM Assistant above. Press Enter.";
    } else {
      for (var i = 0; i < list.length; i++) {
        var e = list[i], m = CAT[e.c] || CAT.Page, idx = i + 1;
        html +=
          '<a class="kbso-row" id="kbso-opt-' + idx + '" role="option" aria-selected="false" tabindex="-1" href="' + esc(e.u) + '" data-i="' + idx + '">' +
            '<span class="kbso-ic" aria-hidden="true" style="background:' + m.c + '22;color:' + m.c + '">' + m.i + '</span>' +
            '<span class="kbso-main">' +
              '<span class="kbso-t"><span class="kbso-tt">' + hl(e.t, curToks) + '</span><span class="kbso-cat" style="color:' + m.t + '">' + esc(e.c) + '</span></span>' +
              '<span class="kbso-s">' + hl(snip(e, curToks), curToks) + '</span>' +
            '</span>' +
          '</a>';
      }
      sayMsg = list.length + (list.length === 1 ? " result" : " results") + ", plus Ask the DPM Assistant. Use up and down arrows to review, Enter to open.";
    }
    res.innerHTML = html;
    rows = [].slice.call(res.querySelectorAll(".kbso-row"));
    /* default selection: the top PAGE result when there is one (so Enter still
       opens the best page, as before), otherwise the Ask row */
    active = rows.length ? (list.length ? 1 : 0) : -1;
    rows.forEach(function (r, i) {
      r.addEventListener("mouseenter", function () { setActive(i); });
      if (r.getAttribute("data-ask") === "1") {
        r.addEventListener("click", function (ev) { ev.preventDefault(); activateRow(r); });
      }
    });
    setExpanded(rows.length > 0);
    if (rows[active]) {
      rows[active].classList.add("on");
      rows[active].setAttribute("aria-selected", "true");
      inp.setAttribute("aria-activedescendant", rows[active].id);
    }
    say(sayMsg);
  }

  function setActive(i) {
    if (!rows.length) return;
    active = (i + rows.length) % rows.length;
    rows.forEach(function (r, j) { r.classList.toggle("on", j === active); r.setAttribute("aria-selected", j === active ? "true" : "false"); });
    if (rows[active]) { rows[active].scrollIntoView({ block: "nearest" }); inp.setAttribute("aria-activedescendant", rows[active].id); }
  }
  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Enter") { e.preventDefault(); if (rows[active]) activateRow(rows[active]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  }

  /* make everything behind the dialog inert while it is open */
  function setInert(on) {
    if (on) {
      inerted = [];
      [].forEach.call(document.body.children, function (n) {
        if (n === ov || n.tagName === "SCRIPT" || n.tagName === "STYLE") return;
        if (n.hasAttribute("inert") || n.getAttribute("aria-hidden") === "true") return;
        n.setAttribute("inert", "");
        n.setAttribute("aria-hidden", "true");
        inerted.push(n);
      });
    } else {
      inerted.forEach(function (n) { n.removeAttribute("inert"); n.removeAttribute("aria-hidden"); });
      inerted = [];
    }
  }

  function open(prefill) {
    if (!ov) build();
    if (!ov.classList.contains("show")) {
      var a = document.activeElement;
      opener = (a && a !== document.body && !ov.contains(a)) ? a : null;
      setInert(true);
    }
    ov.classList.add("show");
    ov.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    inp.value = prefill || "";
    render(inp.value);
    loadIndex(function () { if (ov.classList.contains("show")) render(inp.value); });
    setTimeout(function () { inp.focus(); if (prefill) inp.select(); }, 30);
  }
  function close() {
    if (!ov || !ov.classList.contains("show")) return;
    ov.classList.remove("show");
    ov.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setInert(false);
    setExpanded(false);
    var back = (opener && document.contains(opener) && opener.getClientRects().length) ? opener : document.querySelector(".kb-navsearch");
    opener = null;
    if (back) { try { back.focus(); } catch (e) { /* ignore */ } }
  }
  window.KBSearch = { open: open, close: close };

  /* ---------- UI wiring ---------- */
  function initUI() {
    injectStyles();

    var nav = document.querySelector(".topnav");
    if (nav && !nav.querySelector(".kb-navsearch")) {
      var badge = nav.querySelector(".topnav-badge");
      var b = document.createElement("button");
      b.className = "kb-navsearch";
      b.type = "button";
      b.setAttribute("aria-label", "Search the knowledge base");
      b.innerHTML =
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
        '<span class="kb-navsearch-t">Search</span><kbd class="kb-navsearch-k">Ctrl K</kbd>';
      b.addEventListener("click", function () { open(""); });
      if (badge) nav.insertBefore(b, badge); else nav.appendChild(b);
    }

    document.querySelectorAll("[data-kb-open]").forEach(function (el) {
      el.addEventListener("click", function () { open(""); });
    });
    document.querySelectorAll("[data-kbq]").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); open(el.getAttribute("data-kbq")); });
    });

    document.addEventListener("keydown", function (e) {
      var k = e.key || "";
      var t = (e.target && e.target.tagName) || "";
      var inField = /^(INPUT|TEXTAREA|SELECT)$/.test(t) || (e.target && e.target.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && (k === "k" || k === "K")) { e.preventDefault(); open(""); }
      else if (k === "Escape" && ov && ov.classList.contains("show") && !inField) { close(); }
    });
  }

  function injectStyles() {
    if (document.getElementById("kbso-css")) return;
    var s = document.createElement("style");
    s.id = "kbso-css";
    s.textContent = [
      ".kb-navsearch{display:inline-flex;align-items:center;gap:7px;margin-left:10px;flex-shrink:0;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);color:rgba(255,255,255,0.72);border-radius:8px;padding:6px 10px;font:600 12.5px/1 var(--font,sans-serif);cursor:pointer;transition:all .15s;}",
      ".kb-navsearch:hover{background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.28);}",
      ".kb-navsearch svg{opacity:.85;flex-shrink:0;}",
      ".kb-navsearch-k{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:5px;padding:2px 6px;font:600 10px/1 var(--mono,monospace);color:rgba(255,255,255,0.75);}",
      "@media(max-width:760px){.kb-navsearch-t,.kb-navsearch-k{display:none;}.kb-navsearch{padding:6px;}}",
      "@media(max-width:600px){.topnav-badge{display:none;}}",
      ".kbso{position:fixed;inset:0;z-index:9999;display:none;}",
      ".kbso.show{display:block;}",
      ".kbso-back{position:absolute;inset:0;background:rgba(15,15,20,0.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);}",
      ".kbso-panel{position:relative;max-width:640px;margin:9vh auto 0;background:#fff;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,0.35);overflow:hidden;animation:kbso-in .14s ease;}",
      "@keyframes kbso-in{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;}}",
      ".kbso-top{display:flex;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid #EEE;}",
      /* the input has no outline of its own: show focus on the whole bar */
      ".kbso-top:focus-within{box-shadow:inset 0 -3px 0 #B34200;}",
      ".kbso-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}",
      "#kbsoInput::-webkit-search-cancel-button{cursor:pointer;}",
      ".kbso-mag{color:#FF6200;flex-shrink:0;}",
      "#kbsoInput{flex:1;min-width:0;border:none;outline:none;font:400 16px/1.3 var(--font,sans-serif);color:#1A1A1A;background:transparent;}",
      ".kbso-esc{flex-shrink:0;background:#F3F3F3;border:1px solid #E4E4E4;border-radius:6px;color:#5E5E5E;font:600 11px/1 var(--mono,monospace);padding:5px 8px;cursor:pointer;}",
      ".kbso-esc:focus-visible{outline:3px solid #B34200;outline-offset:2px;}",
      ".kbso-esc:hover{background:#ECECEC;}",
      ".kbso-results{max-height:60vh;overflow-y:auto;}",
      ".kbso-row{display:flex;gap:12px;padding:11px 16px;border-bottom:1px solid #F4F4F4;text-decoration:none;align-items:flex-start;}",
      ".kbso-row:last-child{border-bottom:none;}",
      ".kbso-row.on{background:#FFE8D6;box-shadow:inset 3px 0 0 #B34200;}",
      /* AI hand-off row: a distinct look, still an option in the listbox */
      ".kbso-ask{background:linear-gradient(90deg,#FFF6EE,#FFFFFF);}",
      ".kbso-ask.on{background:#FFE8D6;box-shadow:inset 3px 0 0 #B34200;}",
      ".kbso-ask-ic{background:rgba(255,98,0,0.14) !important;color:#B34200 !important;font-size:15px;}",
      ".kbso-ask .kbso-tt{color:#8A3300;}",
      ".kbso-ask-cat{color:#B34200 !important;}",
      ".kbso-row:focus-visible{outline:3px solid #B34200;outline-offset:-3px;}",
      ".kbso-ic{flex-shrink:0;width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;margin-top:1px;}",
      ".kbso-main{min-width:0;flex:1;}",
      ".kbso-t{display:flex;align-items:baseline;gap:9px;margin-bottom:2px;}",
      ".kbso-tt{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:600 14px/1.3 var(--font,sans-serif);color:#1A1A1A;}",
      ".kbso-cat{flex-shrink:0;font:700 10px/1 var(--font,sans-serif);text-transform:uppercase;letter-spacing:.5px;}",
      ".kbso-s{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font:400 12.5px/1.5 var(--font,sans-serif);color:#5E5E5E;}",
      ".kbso-row mark{background:rgba(255,98,0,0.18);color:#8A3300;border-radius:2px;padding:0 1px;font-weight:600;}",
      ".kbso-empty{padding:26px 22px;text-align:center;color:#5E5E5E;font-size:13.5px;line-height:1.6;}",
      ".kbso-foot{display:flex;align-items:center;gap:16px;padding:10px 16px;border-top:1px solid #EEE;background:#FAFAFA;font-size:11px;color:#5E5E5E;}",
      ".kbso-foot kbd{background:#fff;border:1px solid #E0E0E0;border-radius:4px;padding:1px 5px;font-family:var(--mono,monospace);font-size:10px;color:#5E5E5E;margin-right:2px;}",
      ".kbso-brand{margin-left:auto;font-weight:600;color:#666;}",
      "@media(max-width:640px){.kbso-panel{margin:0;border-radius:0;max-width:none;min-height:100%;}.kbso-results{max-height:calc(100vh - 118px);}}",
      "@media(max-width:760px){.kbso-tt{white-space:normal;overflow:visible;}}"
    ].join("\n");
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initUI);
  else initUI();
})();
