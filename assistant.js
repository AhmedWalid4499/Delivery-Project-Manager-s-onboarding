/* ═══════════════════════════════════════════════════════════
   Orange Business — DPM Knowledge Base
   AI ASSISTANT  ·  a floating chat on every page + a full-window page
   ───────────────────────────────────────────────────────────
   Loaded on every page (bootstrapped by shared.js, after kb-ui.js).
   On ordinary pages it adds a round "Ask the DPM Assistant" button in
   the bottom-right corner that opens a resizable chat panel. On the
   dedicated page assistant.html (marked with data-kb-assistant="page"
   or a #kb-assistant-page container) it renders instead as a full-window
   two-pane chat app — the SAME code paths, settings, streaming and
   Markdown as the bubble.

   The reader brings their own Anthropic API key (and optional workspace
   id); both are stored only in their browser. Answers stream in and
   render as Markdown, like ChatGPT / Claude.

   WHERE THINGS LIVE (localStorage, this browser only, plain text)
   • Config (key / workid / model / endpoint): "dpmkb_assistant_cfg".
   • Saved chats (multiple conversations):      "dpmkb_assistant_chats".
   • UI prefs (panel size / maximized / text):  "dpmkb_assistant_ui".
   • "Seen once" flag (hides the welcome dot):   "dpmkb_assistant_seen".
   • Legacy single thread (migrated once, then left untouched):
     "dpmkb_assistant_thread".
   • No key or secret is ever written to the console or into the
     page as readable text.

   TO CHANGE THE PERSONA OR MODELS
   • Edit PERSONA below for how the assistant answers.
   • Edit MODELS / DEFAULT_MODEL for the models offered.
   The endpoint and headers follow the Anthropic Messages API and
   must keep the "anthropic-dangerous-direct-browser-access" header
   or the browser blocks the call with a CORS error. The workspace id
   is sent as the "anthropic-workspace-id" header when set.

   All additive and defensive: if this script fails, the page still
   works exactly as before. Written in ES5-compatible JavaScript.
═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__kbAssistant) return;
  window.__kbAssistant = 1;

  /* ---------- configuration ---------- */
  var CFG_KEY = "dpmkb_assistant_cfg";
  var THREAD_KEY = "dpmkb_assistant_thread";   /* legacy single thread */
  var CHATS_KEY = "dpmkb_assistant_chats";     /* multiple saved chats */
  var UI_KEY = "dpmkb_assistant_ui";           /* size / maximized / text */
  var SEEN_KEY = "dpmkb_assistant_seen";
  var MAX_THREAD = 24;    /* messages windowed into each API request */
  var MAX_MSGS = 200;     /* messages kept per chat */
  var MAX_CHATS = 50;     /* chats kept (oldest-updated dropped first) */
  var DEFAULT_ENDPOINT = "https://api.anthropic.com/v1/messages";
  var DEFAULT_MODEL = "claude-opus-5-5";
  var MODELS = [
    { id: "claude-opus-5-5", label: "Claude Opus 5.5 (most capable)" },
    { id: "claude-sonnet-5", label: "Claude Sonnet 5 (balanced)" },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (fastest)" }
  ];
  var PERSONA = "You are the DPM Assistant, a helpful AI built into the Orange Business DPM Knowledge Base, an onboarding site for Delivery Project Managers (DPMs). Help DPMs UNDERSTAND technical networking and delivery concepts in clear, plain language: define jargon, use short paragraphs, concrete examples and step-by-step explanations when useful, and Markdown formatting (headings, bold, lists, inline code, fenced code blocks). Be accurate and concise; if you are unsure or the site does not cover it, say so. Use British English. Do NOT invent Orange-internal specifics (people, tools, URLs, figures) that are not in the provided page context.";

  /* panel size clamps + text-size steps */
  var MIN_W = 320, MIN_H = 380, CAP_W = 900, CAP_H = 1000;
  var DEF_W = 400, DEF_H = 620;
  var FONT_STEPS = [0.9, 1, 1.15, 1.3, 1.4];

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- storage (always defensive) ---------- */
  var storageOK = true;
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { storageOK = false; return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { storageOK = false; return false; } }
  function lsRemove(k) { try { window.localStorage.removeItem(k); } catch (e) { storageOK = false; } }

  var memCfg = null;
  function getConfig() {
    if (memCfg) return memCfg;
    var cfg = { apiKey: "", workid: "", model: DEFAULT_MODEL, endpoint: DEFAULT_ENDPOINT };
    var raw = lsGet(CFG_KEY);
    if (raw) {
      try {
        var o = JSON.parse(raw);
        if (o && typeof o === "object") {
          if (typeof o.apiKey === "string") cfg.apiKey = o.apiKey;
          if (typeof o.workid === "string") cfg.workid = o.workid;
          if (typeof o.model === "string" && o.model) cfg.model = o.model;
          if (typeof o.endpoint === "string" && o.endpoint) cfg.endpoint = o.endpoint;
        }
      } catch (e) { /* ignore corrupt config */ }
    }
    if (!isKnownModel(cfg.model)) cfg.model = DEFAULT_MODEL;
    /* the API key is sent to this endpoint, so never let a stored value be
       anything other than an http(s) URL — fall back to the default otherwise */
    cfg.endpoint = safeEndpoint(cfg.endpoint);
    memCfg = cfg;
    return cfg;
  }
  function saveConfig(cfg) {
    cfg.endpoint = safeEndpoint(cfg.endpoint);
    memCfg = cfg;
    lsSet(CFG_KEY, JSON.stringify({ apiKey: cfg.apiKey || "", workid: cfg.workid || "", model: cfg.model || DEFAULT_MODEL, endpoint: cfg.endpoint || DEFAULT_ENDPOINT }));
  }
  function isKnownModel(id) {
    for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) return true;
    return false;
  }
  /* only http(s) endpoints are allowed; anything else (blank, javascript:,
     data:, a relative path, ftp:, …) is rejected and the default used */
  function safeEndpoint(u) {
    u = String(u == null ? "" : u).replace(/\s+/g, "");
    return /^https?:\/\/\S+/i.test(u) ? u : DEFAULT_ENDPOINT;
  }
  function hasKey() { return !!(getConfig().apiKey || "").replace(/\s+/g, ""); }

  /* ---------- UI preferences (size / maximized / text size) ---------- */
  var uiPrefs = null;
  function loadUI() {
    var p = { w: DEF_W, h: DEF_H, maximized: false, fontScale: 1 };
    var raw = lsGet(UI_KEY);
    if (raw) {
      try {
        var o = JSON.parse(raw);
        if (o && typeof o === "object") {
          if (typeof o.w === "number" && isFinite(o.w)) p.w = o.w;
          if (typeof o.h === "number" && isFinite(o.h)) p.h = o.h;
          if (typeof o.maximized === "boolean") p.maximized = o.maximized;
          if (typeof o.fontScale === "number" && isFinite(o.fontScale)) p.fontScale = o.fontScale;
        }
      } catch (e) { /* ignore corrupt prefs */ }
    }
    /* clamp into sane ranges */
    if (p.w < MIN_W) p.w = MIN_W; if (p.w > CAP_W) p.w = CAP_W;
    if (p.h < MIN_H) p.h = MIN_H; if (p.h > CAP_H) p.h = CAP_H;
    p.fontScale = snapFont(p.fontScale);
    return p;
  }
  function saveUI() {
    if (!uiPrefs) return;
    lsSet(UI_KEY, JSON.stringify({ w: Math.round(uiPrefs.w), h: Math.round(uiPrefs.h), maximized: !!uiPrefs.maximized, fontScale: uiPrefs.fontScale }));
  }
  function snapFont(v) {
    v = (typeof v === "number" && isFinite(v)) ? v : 1;
    var best = FONT_STEPS[0], bd = Math.abs(v - best);
    for (var i = 1; i < FONT_STEPS.length; i++) {
      var d = Math.abs(v - FONT_STEPS[i]);
      if (d < bd) { bd = d; best = FONT_STEPS[i]; }
    }
    return best;
  }
  function fontIndex() {
    var v = snapFont(uiPrefs ? uiPrefs.fontScale : 1);
    for (var i = 0; i < FONT_STEPS.length; i++) if (FONT_STEPS[i] === v) return i;
    return 1;
  }

  /* ---------- saved chats (multiple conversations) ---------- */
  var chatsState = null;   /* { version:1, activeId:"", chats:[ {id,title,created,updated,messages:[{role,content}]} ] } */

  function genId() {
    return "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
  }
  function makeChat() {
    var now = Date.now();
    return { id: genId(), title: "New chat", created: now, updated: now, messages: [] };
  }
  function cleanMessages(arr) {
    var out = [];
    if (arr && typeof arr.length === "number") {
      for (var i = 0; i < arr.length; i++) {
        var m = arr[i];
        if (m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") {
          out.push({ role: m.role, content: m.content });
        }
      }
    }
    /* keep the last MAX_MSGS and make the first message a user turn */
    if (out.length > MAX_MSGS) out = out.slice(out.length - MAX_MSGS);
    while (out.length && out[0].role !== "user") out.shift();
    return out;
  }
  function cleanChat(c) {
    if (!c || typeof c !== "object") return null;
    var now = Date.now();
    var chat = {
      id: (typeof c.id === "string" && c.id) ? c.id : genId(),
      title: (typeof c.title === "string" && c.title) ? c.title : "New chat",
      created: (typeof c.created === "number" && isFinite(c.created)) ? c.created : now,
      updated: (typeof c.updated === "number" && isFinite(c.updated)) ? c.updated : now,
      messages: cleanMessages(c.messages)
    };
    return chat;
  }
  /* parse CHATS_KEY into a validated state, or null if absent/invalid */
  function parseChatsRaw(raw) {
    if (!raw) return null;
    var state = { version: 1, activeId: "", chats: [] };
    try {
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return null;
      var src = (o.chats && typeof o.chats.length === "number") ? o.chats : [];
      var seen = {};
      for (var i = 0; i < src.length; i++) {
        var c = cleanChat(src[i]);
        if (!c) continue;
        if (seen[c.id]) c.id = genId();
        seen[c.id] = 1;
        state.chats.push(c);
      }
      if (typeof o.activeId === "string") state.activeId = o.activeId;
    } catch (e) { return null; }
    fixActive(state);
    return state;
  }
  function fixActive(state) {
    if (!state.chats.length) { state.activeId = ""; return; }
    for (var i = 0; i < state.chats.length; i++) if (state.chats[i].id === state.activeId) return;
    /* active missing: point at the most recently updated chat */
    var newest = state.chats[0];
    for (var j = 1; j < state.chats.length; j++) if (state.chats[j].updated > newest.updated) newest = state.chats[j];
    state.activeId = newest.id;
  }
  /* initial load: read CHATS_KEY, else MIGRATE the legacy single thread once */
  function loadChats() {
    var existing = parseChatsRaw(lsGet(CHATS_KEY));
    if (existing) return existing;

    var state = { version: 1, activeId: "", chats: [] };
    var oldMsgs = loadLegacyThread();
    if (oldMsgs.length) {
      var chat = makeChat();
      chat.messages = oldMsgs;
      var firstUser = "";
      for (var i = 0; i < oldMsgs.length; i++) { if (oldMsgs[i].role === "user") { firstUser = oldMsgs[i].content; break; } }
      chat.title = deriveTitle(firstUser);
      chat.created = chat.updated = Date.now();
      state.chats.push(chat);
      state.activeId = chat.id;
      /* persist under the new key so future loads use it; the old key is
         left in place (lossless) but is no longer the source of truth */
      lsSet(CHATS_KEY, JSON.stringify(state));
    }
    return state;
  }
  function loadLegacyThread() {
    var raw = lsGet(THREAD_KEY);
    if (!raw) return [];
    try {
      var arr = JSON.parse(raw);
      return cleanMessages(arr);
    } catch (e) { return []; }
  }
  function capChats() {
    if (chatsState.chats.length <= MAX_CHATS) return;
    /* drop the oldest-updated, never the active one */
    var sorted = chatsState.chats.slice().sort(function (a, b) { return a.updated - b.updated; });
    var removeN = chatsState.chats.length - MAX_CHATS;
    var kill = {};
    for (var i = 0; i < sorted.length && removeN > 0; i++) {
      if (sorted[i].id === chatsState.activeId) continue;
      kill[sorted[i].id] = 1; removeN--;
    }
    var keep = [];
    for (var j = 0; j < chatsState.chats.length; j++) if (!kill[chatsState.chats[j].id]) keep.push(chatsState.chats[j]);
    chatsState.chats = keep;
  }
  function saveChats() {
    fixActive(chatsState);
    capChats();
    lsSet(CHATS_KEY, JSON.stringify(chatsState));
  }
  function activeChat() {
    if (!chatsState) return null;
    for (var i = 0; i < chatsState.chats.length; i++) if (chatsState.chats[i].id === chatsState.activeId) return chatsState.chats[i];
    return null;
  }
  function ensureActiveChat() {
    var c = activeChat();
    if (c) return c;
    c = makeChat();
    chatsState.chats.push(c);
    chatsState.activeId = c.id;
    saveChats();
    return c;
  }
  function msgs() { var c = activeChat(); return c ? c.messages : []; }
  function trimChat(chat) {
    if (!chat) return;
    if (chat.messages.length > MAX_MSGS) chat.messages = chat.messages.slice(chat.messages.length - MAX_MSGS);
    while (chat.messages.length && chat.messages[0].role !== "user") chat.messages.shift();
  }
  function sortedChats() {
    return chatsState.chats.slice().sort(function (a, b) { return b.updated - a.updated; });
  }
  function deriveTitle(text) {
    var t = String(text == null ? "" : text).replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    if (!t) return "New chat";
    if (t.length > 40) t = t.slice(0, 40).replace(/\s+\S*$/, "") + "…";
    return t || "New chat";
  }
  /* messages windowed into each API request (keeps request size bounded,
     preserving the original single-thread behaviour) */
  function requestMessages() {
    var all = msgs();
    var arr = all.slice(Math.max(0, all.length - MAX_THREAD));
    while (arr.length && arr[0].role !== "user") arr.shift();
    var out = [];
    for (var i = 0; i < arr.length; i++) out.push({ role: arr[i].role, content: arr[i].content });
    return out;
  }

  /* ---------- small helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function div(cls, html) { return el("div", cls, html); }
  function closestClass(node, cls) {
    while (node && node !== document) {
      if (node.classList && node.classList.contains(cls)) return node;
      node = node.parentNode;
    }
    return null;
  }
  function relTime(ts) {
    if (typeof ts !== "number" || !isFinite(ts)) return "";
    var d = Date.now() - ts; if (d < 0) d = 0;
    var s = Math.floor(d / 1000);
    if (s < 45) return "just now";
    var m = Math.floor(s / 60); if (m < 60) return m + " min ago";
    var h = Math.floor(m / 60); if (h < 24) return h + " h ago";
    var days = Math.floor(h / 24); if (days < 7) return days === 1 ? "yesterday" : days + " d ago";
    var dt = new Date(ts);
    var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return dt.getDate() + " " + MON[dt.getMonth()];
  }

  /* ---------- Markdown renderer (small, safe, no libraries) ----------
     HTML in the model text is escaped FIRST, so no raw HTML is ever
     injected. Only http(s) links become anchors. */
  function safeUrl(u) {
    u = String(u == null ? "" : u).replace(/\s+/g, "");
    if (/^https?:\/\//i.test(u)) return u;
    return "";
  }
  function inline(raw) {
    var s = esc(raw);
    var tokens = [];
    function stash(htmlStr) { tokens.push(htmlStr); return "\u0000" + (tokens.length - 1) + "\u0000"; }
    /* inline code first, so its contents are not further formatted */
    s = s.replace(/`([^`]+)`/g, function (m, p1) { return stash("<code>" + p1 + "</code>"); });
    /* markdown links [text](url) */
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, txt, url) {
      var safe = safeUrl(url);
      if (!safe) return m;
      return stash('<a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + txt + "</a>");
    });
    /* bare URLs (http/https only) */
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, function (m, pre, url) {
      var trail = "";
      var mt = /[.,;:!?)\]]+$/.exec(url);
      if (mt) { trail = url.slice(url.length - mt[0].length); url = url.slice(0, url.length - mt[0].length); }
      var safe = safeUrl(url);
      if (!safe) return m;
      return pre + stash('<a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + esc(url) + "</a>") + trail;
    });
    /* bold then italic */
    s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
    /* restore protected tokens */
    s = s.replace(/\u0000(\d+)\u0000/g, function (m, n) { return tokens[+n] || ""; });
    return s;
  }
  function codeBlock(code, lang) {
    var langLabel = lang ? '<span class="kba-code-lang">' + esc(lang) + "</span>" : "";
    return '<div class="kba-codewrap">' + langLabel +
      '<div class="code-block"><pre>' + esc(code) + "</pre></div>" +
      '<button type="button" class="kba-copy" aria-label="Copy code">Copy</button></div>';
  }
  function mdToHtml(text) {
    text = String(text == null ? "" : text).replace(/\r\n?/g, "\n");
    var lines = text.split("\n");
    var html = [];
    var i = 0;
    var listType = null;
    var para = [];
    function flushPara() {
      if (para.length) { html.push("<p>" + para.join("<br>") + "</p>"); para = []; }
    }
    function closeList() { if (listType) { html.push(listType === "ul" ? "</ul>" : "</ol>"); listType = null; } }
    function openList(t) { if (listType !== t) { closeList(); html.push(t === "ul" ? "<ul>" : "<ol>"); listType = t; } }

    while (i < lines.length) {
      var line = lines[i];

      /* fenced code block */
      var fence = /^\s*```(.*)$/.exec(line);
      if (fence) {
        flushPara(); closeList();
        var lang = (fence[1] || "").trim();
        var code = [];
        i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
        if (i < lines.length) i++; /* skip closing fence */
        html.push(codeBlock(code.join("\n"), lang));
        continue;
      }
      /* horizontal rule */
      if (/^\s*---+\s*$/.test(line)) { flushPara(); closeList(); html.push("<hr>"); i++; continue; }
      /* heading */
      var h = /^\s*(#{1,3})\s+(.*)$/.exec(line);
      if (h) {
        flushPara(); closeList();
        var lvl = h[1].length + 2; /* # -> h3, ## -> h4, ### -> h5 */
        html.push("<h" + lvl + ">" + inline(h[2].replace(/\s+#+\s*$/, "")) + "</h" + lvl + ">");
        i++; continue;
      }
      /* blockquote */
      if (/^\s*>\s?/.test(line)) {
        flushPara(); closeList();
        var q = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
        html.push("<blockquote>" + inline(q.join(" ")) + "</blockquote>");
        continue;
      }
      /* unordered list */
      var ul = /^\s*[-*]\s+(.*)$/.exec(line);
      if (ul) { flushPara(); openList("ul"); html.push("<li>" + inline(ul[1]) + "</li>"); i++; continue; }
      /* ordered list */
      var ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
      if (ol) { flushPara(); openList("ol"); html.push("<li>" + inline(ol[1]) + "</li>"); i++; continue; }
      /* blank line ends a paragraph / list */
      if (/^\s*$/.test(line)) { flushPara(); closeList(); i++; continue; }
      /* ordinary paragraph text */
      closeList();
      para.push(inline(line));
      i++;
    }
    flushPara(); closeList();
    return html.join("\n");
  }

  /* ---------- page context for the system prompt ---------- */
  function pageContext() {
    var src = document.querySelector(".content, .content-wide, .proc-content") || document.body;
    if (!src) return "";
    var clone = src.cloneNode(true);
    var junk = clone.querySelectorAll(
      "script, style, noscript, nav, .topnav, footer, .footer, .kb-top, .kb-progress, .kbso, .kb-navmenu, .kb-skip, .kb-toc, .kb-herosearch, .kb-herobg, .kb-updated, #kb-assistant-root, #kb-assistant-page, .kba-page, .kba-root, .kb-navsearch"
    );
    for (var j = 0; j < junk.length; j++) { if (junk[j].parentNode) junk[j].parentNode.removeChild(junk[j]); }
    var txt = (clone.textContent || "").replace(/\s+/g, " ").replace(/\u0000/g, "").trim();
    if (txt.length > 6000) txt = txt.slice(0, 6000);
    return txt;
  }
  function buildSystem() {
    var s = PERSONA;
    s += "\n\nCURRENT PAGE CONTEXT\nTitle: " + (document.title || "") + "\nPath: " + (location.pathname || "") +
      "\n\nMain readable text of the page the reader is on:\n" + pageContext();
    return s;
  }

  /* ---------- error text ---------- */
  function friendly(status, errObj, isNetwork) {
    if (isNetwork) return "Couldn't reach Claude. Check your connection, your key, and that direct browser access is allowed.";
    if (status === 401 || status === 403) return "Your API key was rejected, check it in settings.";
    if (status === 429) return "Rate limited, wait a moment and try again.";
    if (status === 400) return (errObj && errObj.message) ? errObj.message : "The request was rejected (400).";
    return (errObj && errObj.message) ? errObj.message : "Something went wrong, please try again.";
  }

  /* ---------- UI references + state ---------- */
  var mode = "bubble";               /* "bubble" | "page" */
  var root, fab, panel, scaleHost;   /* scaleHost carries --kba-fontscale */
  var bodyEl, messagesEl, inputEl, sendBtn, stopBtn, liveEl, footerEl;
  var settingsBtn, newChatBtn, chatsBtn, maxBtn, fullBtn, closeBtn, resizeHandle;
  var listEl, pageMount, sideToggleBtn, pageEl;
  var view = "chat";                 /* "chat" | "settings" | "chats" */
  var open = false, streaming = false, controller = null, rafPending = false;
  var assistantBubble = null, assistantText = "";
  var lastFocus = null, resizing = false;

  /* ---------- SVG glyphs ---------- */
  var ICON_CHAT = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path><line x1="8.5" y1="11" x2="8.51" y2="11"></line><line x1="12" y1="11" x2="12.01" y2="11"></line><line x1="15.5" y1="11" x2="15.51" y2="11"></line></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>';
  var ICON_GEAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
  var ICON_NEW = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>';
  var ICON_PENCIL = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>';
  var ICON_TRASH = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
  var ICON_LIST = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>';
  var ICON_EXPAND = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-8 8"></path><path d="M3 21l8-8"></path></svg>';
  var ICON_MAX = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>';
  var ICON_RESTORE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M4 16V6a2 2 0 0 1 2-2h10"></path></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
  var ICON_STOP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>';
  var ICON_MENU = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';

  /* shared markup fragments */
  function fontToolsHTML() {
    return '<div class="kba-tools">' +
        '<span class="kba-tools-label">Text size</span>' +
        '<div class="kba-fontgrp" role="group" aria-label="Message text size">' +
          '<button type="button" class="kba-font-btn kba-font-dec" aria-label="Decrease text size">A<span aria-hidden="true">−</span></button>' +
          '<button type="button" class="kba-font-btn kba-font-inc" aria-label="Increase text size">A<span aria-hidden="true">+</span></button>' +
        '</div>' +
      '</div>';
  }

  /* ---------- build DOM: floating bubble ---------- */
  function build() {
    mode = "bubble";
    root = div("kba-root");
    root.id = "kb-assistant-root";

    var seen = lsGet(SEEN_KEY) === "1";
    fab = el("button", "kba-fab", ICON_CHAT + (seen ? "" : '<span class="kba-fab-dot" aria-hidden="true"></span>'));
    fab.type = "button";
    fab.id = "kba-fab";
    fab.setAttribute("aria-label", "Open the DPM assistant");
    fab.setAttribute("aria-expanded", "false");
    fab.setAttribute("aria-controls", "kba-panel");
    fab.addEventListener("click", toggle);

    panel = div("kba-panel");
    panel.id = "kba-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "DPM assistant");
    panel.innerHTML =
      '<div class="kba-resize" role="separator" aria-label="Resize the assistant panel (use arrow keys)" aria-orientation="horizontal" tabindex="0"><span aria-hidden="true"></span></div>' +
      '<div class="kba-head">' +
        '<div class="kba-head-text">' +
          '<span class="kba-head-title">DPM Assistant</span>' +
          '<span class="kba-head-sub">Ask about anything on this site</span>' +
        '</div>' +
        '<div class="kba-head-actions">' +
          '<button type="button" class="kba-icon-btn kba-new" aria-label="New chat">' + ICON_NEW + '</button>' +
          '<button type="button" class="kba-icon-btn kba-chats" aria-label="Saved chats">' + ICON_LIST + '</button>' +
          '<button type="button" class="kba-icon-btn kba-max" aria-label="Maximize the panel" aria-pressed="false">' + ICON_MAX + '</button>' +
          '<button type="button" class="kba-icon-btn kba-full" aria-label="Open in full window">' + ICON_EXPAND + '</button>' +
          '<button type="button" class="kba-icon-btn kba-settings" aria-label="Assistant settings">' + ICON_GEAR + '</button>' +
          '<button type="button" class="kba-icon-btn kba-close" aria-label="Close the assistant">' + ICON_CLOSE + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="kba-body" id="kba-body"></div>' +
      '<div class="kba-sr" id="kba-live" role="status" aria-live="polite" aria-atomic="true"></div>';

    root.appendChild(fab);
    root.appendChild(panel);
    document.body.appendChild(root);

    scaleHost = panel;
    bodyEl = panel.querySelector("#kba-body");
    liveEl = panel.querySelector("#kba-live");
    settingsBtn = panel.querySelector(".kba-settings");
    newChatBtn = panel.querySelector(".kba-new");
    chatsBtn = panel.querySelector(".kba-chats");
    maxBtn = panel.querySelector(".kba-max");
    fullBtn = panel.querySelector(".kba-full");
    closeBtn = panel.querySelector(".kba-close");
    resizeHandle = panel.querySelector(".kba-resize");

    closeBtn.addEventListener("click", function () { closePanel(true); });
    settingsBtn.addEventListener("click", function () { showSettings(); });
    newChatBtn.addEventListener("click", newChat);
    chatsBtn.addEventListener("click", toggleChatsView);
    maxBtn.addEventListener("click", toggleMaximize);
    fullBtn.addEventListener("click", openFullWindow);
    wireResize();

    /* Esc inside the panel closes it */
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePanel(true); }
    });
    /* Esc while open but focus elsewhere */
    document.addEventListener("keydown", function (e) {
      if (open && e.key === "Escape") { closePanel(true); }
    });

    window.addEventListener("resize", onWinResize);
    wireStorageSync();
  }

  /* ---------- build DOM: full-window page ---------- */
  function buildPage() {
    mode = "page";
    pageMount = document.getElementById("kb-assistant-page");
    if (!pageMount) {
      pageMount = div("");
      pageMount.id = "kb-assistant-page";
      var host = document.querySelector(".content-wide, .content") || document.body;
      host.appendChild(pageMount);
    }
    pageMount.innerHTML =
      '<div class="kba-page" role="region" aria-label="DPM assistant">' +
        '<div class="kba-page-overlay" hidden></div>' +
        '<aside class="kba-page-sidebar" aria-label="Saved chats">' +
          '<div class="kba-side-list" id="kba-side-list"></div>' +
        '</aside>' +
        '<div class="kba-page-main">' +
          '<div class="kba-head">' +
            '<button type="button" class="kba-icon-btn kba-side-toggle" aria-label="Show saved chats" aria-expanded="false">' + ICON_MENU + '</button>' +
            '<div class="kba-head-text">' +
              '<span class="kba-head-title">DPM Assistant</span>' +
              '<span class="kba-head-sub">A full chat window — ask about anything on the site</span>' +
            '</div>' +
            '<div class="kba-head-actions">' +
              '<button type="button" class="kba-icon-btn kba-new" aria-label="New chat">' + ICON_NEW + '</button>' +
              '<button type="button" class="kba-icon-btn kba-settings" aria-label="Assistant settings">' + ICON_GEAR + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="kba-body" id="kba-body-page"></div>' +
          '<div class="kba-sr" id="kba-live-page" role="status" aria-live="polite" aria-atomic="true"></div>' +
        '</div>' +
      '</div>';

    pageEl = pageMount.querySelector(".kba-page");
    scaleHost = pageMount;
    bodyEl = pageMount.querySelector("#kba-body-page");
    liveEl = pageMount.querySelector("#kba-live-page");
    listEl = pageMount.querySelector("#kba-side-list");
    settingsBtn = pageMount.querySelector(".kba-settings");
    newChatBtn = pageMount.querySelector(".kba-new");
    sideToggleBtn = pageMount.querySelector(".kba-side-toggle");

    settingsBtn.addEventListener("click", function () { showSettings(); });
    newChatBtn.addEventListener("click", newChat);
    sideToggleBtn.addEventListener("click", toggleSidebar);
    pageMount.querySelector(".kba-page-overlay").addEventListener("click", closeSidebar);

    applyFont();
    refreshList();
    if (hasKey()) showChat(); else showSettings();

    window.addEventListener("resize", onWinResize);
    wireStorageSync();
  }

  /* ---------- open / close (bubble) ---------- */
  function toggle() { if (open) closePanel(true); else openPanel(); }
  function openPanel() {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    root.classList.add("kba-open");
    fab.setAttribute("aria-expanded", "true");
    if (lsGet(SEEN_KEY) !== "1") { lsSet(SEEN_KEY, "1"); var d = fab.querySelector(".kba-fab-dot"); if (d) d.parentNode.removeChild(d); }
    applyPanelSize();
    applyFont();
    if (!hasKey()) showSettings(); else showChat();
  }
  function closePanel(returnFocus) {
    if (!open) return;
    open = false;
    root.classList.remove("kba-open");
    fab.setAttribute("aria-expanded", "false");
    if (returnFocus) { try { fab.focus(); } catch (e) { /* ignore */ } }
  }
  function openFullWindow() {
    try { window.open("assistant.html", "_blank", "noopener"); }
    catch (e) { location.href = "assistant.html"; }
  }

  /* ---------- panel size (bubble) ---------- */
  function isMobile() { return window.innerWidth <= 480; }
  function clampSize(w, h) {
    var maxW = Math.min(window.innerWidth * 0.96, CAP_W);
    var maxH = Math.min(window.innerHeight * 0.92, CAP_H);
    if (maxW < MIN_W) maxW = MIN_W;
    if (maxH < MIN_H) maxH = MIN_H;
    if (w < MIN_W) w = MIN_W; if (w > maxW) w = maxW;
    if (h < MIN_H) h = MIN_H; if (h > maxH) h = maxH;
    return [w, h];
  }
  function largeSize() { return clampSize(Math.min(CAP_W, window.innerWidth * 0.96), window.innerHeight * 0.92); }
  function applyPanelSize() {
    if (mode !== "bubble" || !panel) return;
    if (isMobile()) {
      /* CSS makes the panel near-fullscreen on phones; clear inline sizes */
      panel.style.width = ""; panel.style.height = "";
    } else if (uiPrefs.maximized) {
      var L = largeSize();
      panel.style.width = L[0] + "px"; panel.style.height = L[1] + "px";
    } else {
      var C = clampSize(uiPrefs.w, uiPrefs.h);
      panel.style.width = C[0] + "px"; panel.style.height = C[1] + "px";
    }
    if (maxBtn) {
      maxBtn.setAttribute("aria-pressed", uiPrefs.maximized ? "true" : "false");
      maxBtn.setAttribute("aria-label", uiPrefs.maximized ? "Restore the panel size" : "Maximize the panel");
      maxBtn.innerHTML = uiPrefs.maximized ? ICON_RESTORE : ICON_MAX;
    }
    if (resizeHandle) resizeHandle.hidden = uiPrefs.maximized || isMobile();
  }
  function toggleMaximize() {
    uiPrefs.maximized = !uiPrefs.maximized;
    saveUI();
    applyPanelSize();
    focusSoon(inputEl);
  }
  function onWinResize() {
    if (mode === "bubble" && open) applyPanelSize();
  }

  /* drag-to-resize + keyboard resize on the top-left handle */
  function wireResize() {
    if (!resizeHandle) return;
    var startX = 0, startY = 0, startW = 0, startH = 0, captured = -1;
    function setLive(w, h) {
      var C = clampSize(w, h);
      panel.style.width = C[0] + "px"; panel.style.height = C[1] + "px";
      uiPrefs.w = C[0]; uiPrefs.h = C[1];
    }
    function onDown(e) {
      if (uiPrefs.maximized || isMobile()) return;
      var r = panel.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY; startW = r.width; startH = r.height;
      resizing = true;
      panel.classList.add("kba-resizing");
      try { resizeHandle.setPointerCapture(e.pointerId); captured = e.pointerId; } catch (err) { /* ignore */ }
      e.preventDefault();
    }
    function onMove(e) {
      if (!resizing) return;
      setLive(startW + (startX - e.clientX), startH + (startY - e.clientY));
    }
    function onUp() {
      if (!resizing) return;
      resizing = false;
      panel.classList.remove("kba-resizing");
      if (captured !== -1) { try { resizeHandle.releasePointerCapture(captured); } catch (err) { /* ignore */ } captured = -1; }
      saveUI();
    }
    if (window.PointerEvent) {
      resizeHandle.addEventListener("pointerdown", onDown);
      resizeHandle.addEventListener("pointermove", onMove);
      resizeHandle.addEventListener("pointerup", onUp);
      resizeHandle.addEventListener("pointercancel", onUp);
    } else {
      /* very old browsers: mouse fallback (no touch) */
      resizeHandle.addEventListener("mousedown", function (e) {
        onDown(e);
        function mm(ev) { onMove(ev); }
        function mu() { onUp(); document.removeEventListener("mousemove", mm); document.removeEventListener("mouseup", mu); }
        document.addEventListener("mousemove", mm);
        document.addEventListener("mouseup", mu);
      });
    }
    resizeHandle.addEventListener("keydown", function (e) {
      if (uiPrefs.maximized || isMobile()) return;
      var step = 24, w = uiPrefs.w, h = uiPrefs.h, used = true;
      if (e.key === "ArrowLeft") w += step;
      else if (e.key === "ArrowRight") w -= step;
      else if (e.key === "ArrowUp") h += step;
      else if (e.key === "ArrowDown") h -= step;
      else used = false;
      if (!used) return;
      e.preventDefault();
      setLive(w, h);
      saveUI();
    });
  }

  /* ---------- text size ---------- */
  function applyFont() {
    if (scaleHost && scaleHost.style) {
      try { scaleHost.style.setProperty("--kba-fontscale", String(uiPrefs.fontScale)); } catch (e) { /* ignore */ }
    }
    var idx = fontIndex();
    var dec = bodyEl && closestRootQuery(".kba-font-dec");
    var inc = bodyEl && closestRootQuery(".kba-font-inc");
    if (dec) { dec.disabled = idx <= 0; }
    if (inc) { inc.disabled = idx >= FONT_STEPS.length - 1; }
  }
  function closestRootQuery(sel) {
    var host = (mode === "page") ? pageMount : panel;
    return host ? host.querySelector(sel) : null;
  }
  function stepFont(dir) {
    var idx = fontIndex() + dir;
    if (idx < 0) idx = 0; if (idx > FONT_STEPS.length - 1) idx = FONT_STEPS.length - 1;
    uiPrefs.fontScale = FONT_STEPS[idx];
    saveUI();
    applyFont();
  }
  function wireFontTools(container) {
    if (!container) return;
    var dec = container.querySelector(".kba-font-dec");
    var inc = container.querySelector(".kba-font-inc");
    if (dec) dec.addEventListener("click", function () { stepFont(-1); });
    if (inc) inc.addEventListener("click", function () { stepFont(1); });
  }

  /* ---------- settings / first-run view ---------- */
  function showSettings() {
    view = "settings";
    if (mode === "bubble" && newChatBtn) newChatBtn.hidden = true;
    closeSidebar();
    var cfg = getConfig();
    var opts = "";
    for (var i = 0; i < MODELS.length; i++) {
      opts += '<option value="' + esc(MODELS[i].id) + '"' + (cfg.model === MODELS[i].id ? " selected" : "") + ">" + esc(MODELS[i].label) + "</option>";
    }
    var firstRun = !hasKey();
    bodyEl.innerHTML =
      '<div class="kba-settings">' +
        (firstRun ? '<p class="kba-welcome">Hello. I’m the DPM Assistant. I can explain anything on this site — networking, the delivery process, the tools — in plain language. To start, add your own Anthropic API key below.</p>' : '') +
        '<form class="kba-form" autocomplete="off">' +
          '<div class="kba-field">' +
            '<label for="kba-key">Anthropic API key</label>' +
            '<div class="kba-key-row">' +
              '<input id="kba-key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" value="' + esc(cfg.apiKey) + '">' +
              '<button type="button" class="kba-show" aria-pressed="false" aria-label="Show the API key">Show</button>' +
            '</div>' +
          '</div>' +
          '<div class="kba-field">' +
            '<label for="kba-workid">Workspace ID (workid)</label>' +
            '<input id="kba-workid" type="text" autocomplete="off" spellcheck="false" placeholder="wrkspc_… (required if your key is not workspace-scoped)" value="' + esc(cfg.workid) + '">' +
            '<p class="kba-help">Sent as the anthropic-workspace-id header. Required when your API key is not tied to a workspace; leave blank only if your key is already workspace-scoped.</p>' +
          '</div>' +
          '<div class="kba-field">' +
            '<label for="kba-model">Model</label>' +
            '<select id="kba-model">' + opts + "</select>" +
          '</div>' +
          '<details class="kba-adv">' +
            '<summary>Advanced</summary>' +
            '<div class="kba-field">' +
              '<label for="kba-endpoint">API endpoint</label>' +
              '<input id="kba-endpoint" type="text" autocomplete="off" spellcheck="false" value="' + esc(cfg.endpoint) + '">' +
            '</div>' +
          '</details>' +
          '<p class="kba-note"><strong>Security note.</strong> Your key is stored only in this browser (localStorage) in plain text and is sent directly from your browser to Anthropic. Use your own personal key, not a shared or production one. Anyone with access to this browser can read it. Use Clear key to remove it.</p>' +
          (storageOK ? '' : '<p class="kba-storewarn">Settings will not be remembered (storage blocked).</p>') +
          '<div class="kba-form-actions">' +
            '<button type="submit" class="kba-btn kba-btn-primary">Save</button>' +
            '<button type="button" class="kba-btn kba-clear">Clear key</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    var form = bodyEl.querySelector(".kba-form");
    var keyInput = bodyEl.querySelector("#kba-key");
    var showBtn = bodyEl.querySelector(".kba-show");
    showBtn.addEventListener("click", function () {
      var showing = keyInput.type === "text";
      keyInput.type = showing ? "password" : "text";
      showBtn.textContent = showing ? "Show" : "Hide";
      showBtn.setAttribute("aria-pressed", showing ? "false" : "true");
      showBtn.setAttribute("aria-label", (showing ? "Show" : "Hide") + " the API key");
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var newCfg = {
        apiKey: keyInput.value.replace(/\s+/g, ""),
        workid: bodyEl.querySelector("#kba-workid").value.replace(/\s+/g, ""),
        model: bodyEl.querySelector("#kba-model").value || DEFAULT_MODEL,
        endpoint: (bodyEl.querySelector("#kba-endpoint").value || "").replace(/\s+/g, "") || DEFAULT_ENDPOINT
      };
      if (!isKnownModel(newCfg.model)) newCfg.model = DEFAULT_MODEL;
      saveConfig(newCfg);
      if (hasKey()) showChat(); else showSettings();
    });
    bodyEl.querySelector(".kba-clear").addEventListener("click", function () {
      if (!window.confirm("Remove your saved API key from this browser?")) return;
      var c = getConfig();
      c.apiKey = "";
      saveConfig(c);
      showSettings();
    });

    focusSoon(keyInput);
  }

  /* ---------- chat view ---------- */
  function showChat() {
    view = "chat";
    if (mode === "bubble" && newChatBtn) newChatBtn.hidden = false;
    closeSidebar();
    bodyEl.innerHTML =
      fontToolsHTML() +
      '<div class="kba-messages" id="kba-messages" aria-label="Conversation" role="log"></div>' +
      '<div class="kba-footer">' +
        '<label class="kba-sr" for="kba-input">Message the DPM assistant</label>' +
        '<textarea id="kba-input" class="kba-input" rows="1" placeholder="Ask about this page, or anything technical…"></textarea>' +
        '<button type="button" class="kba-btn-send" aria-label="Send message">' + ICON_SEND + '</button>' +
        '<button type="button" class="kba-btn-stop" aria-label="Stop generating" hidden>' + ICON_STOP + '<span>Stop</span></button>' +
      '</div>';

    messagesEl = bodyEl.querySelector("#kba-messages");
    inputEl = bodyEl.querySelector("#kba-input");
    sendBtn = bodyEl.querySelector(".kba-btn-send");
    stopBtn = bodyEl.querySelector(".kba-btn-stop");
    footerEl = bodyEl.querySelector(".kba-footer");

    wireFontTools(bodyEl.querySelector(".kba-tools"));
    applyFont();

    sendBtn.addEventListener("click", send);
    stopBtn.addEventListener("click", function () { if (controller) { try { controller.abort(); } catch (e) { /* ignore */ } } });
    inputEl.addEventListener("input", autoGrow);
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    /* delegated copy buttons for code blocks */
    messagesEl.addEventListener("click", function (e) {
      var btn = closestClass(e.target, "kba-copy");
      if (!btn) return;
      var wrap = closestClass(btn, "kba-codewrap");
      var pre = wrap && wrap.querySelector("pre");
      if (pre) copyText(pre.textContent || pre.innerText || "", btn);
    });

    renderThread();
    setStreaming(streaming);
    focusSoon(inputEl);
  }

  function renderThread() {
    if (!messagesEl) return;
    messagesEl.innerHTML = "";
    var list = msgs();
    if (!list.length) {
      var greet = div("kba-msg kba-msg-assistant");
      greet.appendChild(div("kba-bubble", mdToHtml("Hi. Ask me to explain anything on this page, or any networking or delivery term. For example: **What is Option 43?** or **Explain the WLC migration steps in plain language.**")));
      messagesEl.appendChild(greet);
      return;
    }
    for (var i = 0; i < list.length; i++) addMessage(list[i].role, list[i].content);
    scrollBottom();
  }

  function addMessage(role, text) {
    var wrap = div("kba-msg kba-msg-" + role);
    var bubble = div("kba-bubble");
    if (role === "assistant") bubble.innerHTML = text ? mdToHtml(text) : "";
    else bubble.textContent = text;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    scrollBottom();
    return bubble;
  }

  function autoGrow() {
    if (!inputEl) return;
    inputEl.style.height = "auto";
    var h = inputEl.scrollHeight;
    if (h > 120) h = 120;
    inputEl.style.height = h + "px";
  }
  function scrollBottom() {
    if (!messagesEl) return;
    try { messagesEl.scrollTop = messagesEl.scrollHeight; } catch (e) { /* ignore */ }
  }
  function setStreaming(on) {
    streaming = on;
    if (!inputEl) return;
    inputEl.disabled = on;
    if (sendBtn) sendBtn.hidden = on;
    if (stopBtn) stopBtn.hidden = !on;
  }
  function focusSoon(node) {
    if (!node) return;
    setTimeout(function () { try { node.focus(); } catch (e) { /* ignore */ } }, reduce ? 0 : 60);
  }
  function announce(msg) {
    if (!liveEl) return;
    liveEl.textContent = "";
    setTimeout(function () { liveEl.textContent = String(msg || ""); }, 60);
  }

  /* ---------- saved-chats list (shared between the drawer + sidebar) ---------- */
  function chatsListHTML() {
    var chats = sortedChats();
    var h = '<div class="kba-chats-top">' +
        '<button type="button" class="kba-newchat-big"><span class="kba-nc-plus" aria-hidden="true">+</span> New chat</button>' +
      '</div>';
    if (!chats.length) {
      h += '<p class="kba-chats-empty">No saved chats yet. Start one — it is saved only in this browser on this device.</p>';
      return h;
    }
    h += '<ul class="kba-chats-list" role="list">';
    for (var i = 0; i < chats.length; i++) {
      var c = chats[i];
      var active = c.id === chatsState.activeId;
      h += '<li class="kba-chat-row' + (active ? " is-active" : "") + '" data-id="' + esc(c.id) + '">' +
          '<button type="button" class="kba-chat-open"' + (active ? ' aria-current="true"' : '') + '>' +
            '<span class="kba-chat-title">' + esc(c.title || "New chat") + '</span>' +
            '<span class="kba-chat-time">' + esc(relTime(c.updated)) + '</span>' +
          '</button>' +
          '<span class="kba-chat-acts">' +
            '<button type="button" class="kba-chat-rename" aria-label="Rename this chat">' + ICON_PENCIL + '</button>' +
            '<button type="button" class="kba-chat-del" aria-label="Delete this chat">' + ICON_TRASH + '</button>' +
          '</span>' +
        '</li>';
    }
    h += '</ul>';
    h += '<p class="kba-chats-note">Saved only in this browser on this device — not synced or shared.</p>';
    return h;
  }
  function renderChatsInto(container) {
    if (!container) return;
    container.innerHTML = chatsListHTML();
    wireChatsList(container);
  }
  function refreshList() {
    if (listEl) renderChatsInto(listEl);
    if (mode === "bubble" && view === "chats" && bodyEl) renderChatsInto(bodyEl);
  }
  function wireChatsList(container) {
    var newBtn = container.querySelector(".kba-newchat-big");
    if (newBtn) newBtn.addEventListener("click", newChat);
    var rows = container.querySelectorAll(".kba-chat-row");
    for (var i = 0; i < rows.length; i++) wireChatRow(rows[i]);
  }
  function wireChatRow(row) {
    var id = row.getAttribute("data-id");
    var openBtn = row.querySelector(".kba-chat-open");
    var renameBtn = row.querySelector(".kba-chat-rename");
    var delBtn = row.querySelector(".kba-chat-del");
    if (openBtn) openBtn.addEventListener("click", function () { switchChat(id); });
    if (renameBtn) renameBtn.addEventListener("click", function (e) { e.stopPropagation(); beginRename(row, id); });
    if (delBtn) delBtn.addEventListener("click", function (e) { e.stopPropagation(); deleteChat(id); });
  }
  function findChat(id) {
    for (var i = 0; i < chatsState.chats.length; i++) if (chatsState.chats[i].id === id) return chatsState.chats[i];
    return null;
  }
  function beginRename(row, id) {
    var chat = findChat(id);
    if (!chat) return;
    var openBtn = row.querySelector(".kba-chat-open");
    if (!openBtn || row.querySelector(".kba-rename-input")) return;
    var input = el("input", "kba-rename-input");
    input.type = "text";
    input.value = chat.title || "";
    input.setAttribute("aria-label", "Chat title");
    input.setAttribute("maxlength", "80");
    openBtn.style.display = "none";
    row.insertBefore(input, openBtn);
    var done = false;
    function commit(save) {
      if (done) return; done = true;
      if (save) {
        var v = input.value.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        chat.title = v || "New chat";
        chat.updated = chat.updated; /* keep order stable on rename */
        saveChats();
      }
      refreshList();
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); commit(true); }
      else if (e.key === "Escape") { e.preventDefault(); commit(false); }
    });
    input.addEventListener("blur", function () { commit(true); });
    setTimeout(function () { try { input.focus(); input.select(); } catch (e) { /* ignore */ } }, 0);
  }

  /* ---------- chat switching / creating / deleting ---------- */
  function toggleChatsView() {
    if (view === "chats") { showChat(); return; }
    view = "chats";
    if (newChatBtn) newChatBtn.hidden = false;
    renderChatsInto(bodyEl);
    var nb = bodyEl.querySelector(".kba-newchat-big");
    focusSoon(nb);
  }
  function switchChat(id) {
    if (streaming) return;
    var chat = findChat(id);
    if (!chat) return;
    chatsState.activeId = id;
    saveChats();
    showChat();
    refreshList();
    announce("Switched to chat: " + (chat.title || "New chat"));
  }
  function newChat() {
    if (streaming) return;
    var cur = activeChat();
    if (cur && !cur.messages.length) {
      /* current chat is already empty — just go to it */
      chatsState.activeId = cur.id;
    } else {
      var c = makeChat();
      chatsState.chats.push(c);
      chatsState.activeId = c.id;
    }
    saveChats();
    if (hasKey()) showChat(); else showSettings();
    refreshList();
    announce("Started a new chat.");
    focusSoon(inputEl);
  }
  function deleteChat(id) {
    if (streaming) return;
    var chat = findChat(id);
    if (!chat) return;
    if (!window.confirm("Delete this chat? “" + (chat.title || "New chat") + "” This cannot be undone.")) return;
    var wasActive = chatsState.activeId === id;
    var keep = [];
    for (var i = 0; i < chatsState.chats.length; i++) if (chatsState.chats[i].id !== id) keep.push(chatsState.chats[i]);
    chatsState.chats = keep;
    if (wasActive) {
      chatsState.activeId = "";
      fixActive(chatsState);
    }
    saveChats();
    refreshList();
    if (wasActive) {
      if (view === "chat") { if (hasKey()) showChat(); else showSettings(); }
    }
    announce("Chat deleted.");
  }

  /* ---------- sidebar (page mode drawer on narrow screens) ---------- */
  function toggleSidebar() {
    if (!pageEl) return;
    if (pageEl.classList.contains("sidebar-open")) closeSidebar(); else openSidebar();
  }
  function openSidebar() {
    if (!pageEl) return;
    pageEl.classList.add("sidebar-open");
    if (sideToggleBtn) sideToggleBtn.setAttribute("aria-expanded", "true");
    var ov = pageEl.querySelector(".kba-page-overlay"); if (ov) ov.hidden = false;
  }
  function closeSidebar() {
    if (!pageEl) return;
    pageEl.classList.remove("sidebar-open");
    if (sideToggleBtn) sideToggleBtn.setAttribute("aria-expanded", "false");
    var ov = pageEl.querySelector(".kba-page-overlay"); if (ov) ov.hidden = true;
  }

  /* ---------- clipboard ---------- */
  function copyText(txt, btn) {
    function done() {
      btn.textContent = "Copied";
      btn.classList.add("done");
      setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1400);
    }
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.parentNode.removeChild(ta);
      } catch (e) { /* ignore */ }
      done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback);
    else fallback();
  }

  /* ---------- rendering the streaming answer ---------- */
  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 32); };
    raf(function () {
      rafPending = false;
      /* a render scheduled by a late delta must not clobber the final
         content once the stream has finished (completed, errored or stopped) */
      if (streaming) renderAssistant(true);
    });
  }
  function renderAssistant(withCaret) {
    if (!assistantBubble) return;
    if (!assistantText && streaming) {
      assistantBubble.innerHTML = '<span class="kba-typing" aria-hidden="true"><i></i><i></i><i></i></span>';
    } else {
      assistantBubble.innerHTML = mdToHtml(assistantText) + (withCaret ? '<span class="kba-caret" aria-hidden="true"></span>' : "");
    }
    scrollBottom();
  }

  /* ---------- send + stream ---------- */
  function send() {
    if (streaming) return;
    if (!inputEl) return;
    var text = (inputEl.value || "").replace(/\s+$/, "");
    if (!text) return;
    var cfg = getConfig();
    if (!hasKey()) { showSettings(); return; }

    var chat = ensureActiveChat();
    chat.messages.push({ role: "user", content: text });
    if (chat.title === "New chat" || !chat.title) chat.title = deriveTitle(text);
    chat.updated = Date.now();
    trimChat(chat);
    saveChats();
    refreshList();

    addMessage("user", text);
    inputEl.value = "";
    autoGrow();

    assistantText = "";
    assistantBubble = addMessage("assistant", "");
    renderAssistant(true);
    setStreaming(true);

    controller = (typeof AbortController !== "undefined") ? new AbortController() : null;

    var body = {
      model: cfg.model || DEFAULT_MODEL,
      max_tokens: 4096,
      system: buildSystem(),
      messages: requestMessages(),
      stream: true
    };
    var headers = {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    };
    // A key that is not scoped to a workspace must identify the workspace via
    // this header; a workspace-scoped key ignores it. Sent only when set.
    var wid = cfg.workid && cfg.workid.replace(/\s+/g, "");
    if (wid) headers["anthropic-workspace-id"] = wid;

    var opts = { method: "POST", headers: headers, body: JSON.stringify(body) };
    if (controller) opts.signal = controller.signal;

    window.fetch(cfg.endpoint || DEFAULT_ENDPOINT, opts)
      .then(function (resp) {
        if (!resp.ok) {
          return resp.text().then(function (t) {
            var msg;
            try { var j = JSON.parse(t); msg = friendly(resp.status, j && j.error); }
            catch (e) { msg = friendly(resp.status, null); }
            throw { handled: true, message: msg };
          });
        }
        if (resp.body && resp.body.getReader) return pump(resp.body.getReader());
        /* fallback: no streaming support */
        return resp.text().then(function (t) { parseSSE(t); });
      })
      .then(function () { finishOk(); })
      ["catch"](function (err) { finishErr(err); });
  }

  function pump(reader) {
    var dec = (typeof TextDecoder !== "undefined") ? new TextDecoder("utf-8") : null;
    var buf = "";
    function read() {
      return reader.read().then(function (r) {
        if (r.done) { if (buf) handleLine(buf); return; }
        buf += dec ? dec.decode(r.value, { stream: true }) : bytesToStr(r.value);
        var idx;
        while ((idx = buf.indexOf("\n")) >= 0) {
          var line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          handleLine(line);
        }
        return read();
      });
    }
    /* Always let go of the stream — on normal end, and on a thrown error event
       or network failure cancel it first so the connection is not left open. */
    return read().then(
      function () { try { reader.releaseLock(); } catch (e) { /* ignore */ } },
      function (err) { try { reader.cancel(); } catch (e) { /* ignore */ } throw err; }
    );
  }
  function bytesToStr(bytes) {
    var s = "";
    if (bytes && bytes.length) for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }
  function parseSSE(text) {
    var lines = String(text || "").split("\n");
    for (var i = 0; i < lines.length; i++) handleLine(lines[i]);
  }
  function handleLine(line) {
    line = line.replace(/\r$/, "");
    if (line.indexOf("data:") !== 0) return; /* ignore "event:" and blank lines */
    var data = line.slice(5).replace(/^\s+/, "");
    if (!data || data === "[DONE]") return;
    var json;
    try { json = JSON.parse(data); } catch (e) { return; }
    if (!json || typeof json.type !== "string") return;
    if (json.type === "content_block_delta") {
      var d = json.delta;
      if (d && d.type === "text_delta" && typeof d.text === "string") { assistantText += d.text; scheduleRender(); }
      /* thinking_delta and others: ignore */
    } else if (json.type === "error") {
      throw { handled: true, message: (json.error && json.error.message) ? json.error.message : "The assistant reported an error." };
    }
    /* message_start / content_block_start / message_delta / message_stop / ping: ignore */
  }

  function finishOk() {
    setStreaming(false);
    renderAssistant(false);
    var chat = activeChat();
    if (assistantText) {
      if (chat) {
        chat.messages.push({ role: "assistant", content: assistantText });
        chat.updated = Date.now();
        trimChat(chat);
        saveChats();
        refreshList();
      }
      announce(assistantText);
    } else if (assistantBubble) {
      assistantBubble.innerHTML = '<span class="kba-dim">(no response)</span>';
      /* drop the dangling user turn so the stored chat stays valid */
      if (chat && chat.messages.length && chat.messages[chat.messages.length - 1].role === "user") { chat.messages.pop(); saveChats(); refreshList(); }
    }
    controller = null;
    focusSoon(inputEl);
  }
  function finishErr(err) {
    setStreaming(false);
    var chat = activeChat();
    var aborted = err && (err.name === "AbortError" || (err.message && /abort/i.test(err.message)) || (controller && controller.signal && controller.signal.aborted));
    if (aborted && !(err && err.handled)) {
      renderAssistant(false);
      if (assistantText) {
        if (chat) { chat.messages.push({ role: "assistant", content: assistantText }); chat.updated = Date.now(); trimChat(chat); saveChats(); refreshList(); }
      } else {
        if (assistantBubble) assistantBubble.innerHTML = '<span class="kba-dim">(stopped)</span>';
        if (chat && chat.messages.length && chat.messages[chat.messages.length - 1].role === "user") { chat.messages.pop(); saveChats(); refreshList(); }
      }
      controller = null; focusSoon(inputEl); return;
    }
    var msg = (err && err.handled) ? err.message : friendly(null, null, true);
    if (assistantText) {
      /* keep partial text, append the error below it, and persist what we have */
      assistantBubble.innerHTML = mdToHtml(assistantText) + '<p class="kba-error">' + esc(msg) + "</p>";
      if (chat) { chat.messages.push({ role: "assistant", content: assistantText }); chat.updated = Date.now(); trimChat(chat); saveChats(); refreshList(); }
    } else {
      if (assistantBubble) assistantBubble.innerHTML = '<p class="kba-error">' + esc(msg) + "</p>";
      if (chat && chat.messages.length && chat.messages[chat.messages.length - 1].role === "user") { chat.messages.pop(); saveChats(); refreshList(); }
    }
    announce(msg);
    controller = null;
    focusSoon(inputEl);
  }

  /* ---------- cross-tab sync (best effort) ---------- */
  function wireStorageSync() {
    window.addEventListener("storage", function (e) {
      if (!e || e.key !== CHATS_KEY) return;
      if (streaming) return;
      var fresh = parseChatsRaw(lsGet(CHATS_KEY));
      if (!fresh) return;
      chatsState = fresh;
      refreshList();
      if (view === "chat" && messagesEl) renderThread();
    });
  }

  /* ---------- styles (injected once) ---------- */
  function injectCSS() {
    if (document.getElementById("kb-assistant-css")) return;
    var s = el("style");
    s.id = "kb-assistant-css";
    s.textContent = [
      /* keep the back-to-top button clear of the FAB */
      ".kb-top{bottom:94px !important;}",
      ".kba-root{position:fixed;z-index:9000;}",
      /* FAB */
      ".kba-fab{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;border:none;background:var(--orange,#FF6200);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 26px rgba(0,0,0,0.28),0 2px 6px rgba(0,0,0,0.18);z-index:9000;transition:transform .16s,box-shadow .16s,background .16s;}",
      ".kba-fab:hover{background:var(--orange-strong,#C24A00);transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,0.32);}",
      ".kba-fab:focus-visible{outline:3px solid var(--focus-ring,#B34200);outline-offset:3px;}",
      ".kba-fab svg{pointer-events:none;}",
      ".kba-fab-dot{position:absolute;top:10px;right:11px;width:11px;height:11px;border-radius:50%;background:#fff;border:2px solid var(--orange,#FF6200);box-shadow:0 0 0 2px rgba(255,255,255,0.5);animation:kba-pulse 2s infinite;}",
      "@keyframes kba-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,0.6);}70%{box-shadow:0 0 0 7px rgba(255,255,255,0);}100%{box-shadow:0 0 0 0 rgba(255,255,255,0);}}",
      /* panel */
      ".kba-panel{position:fixed;right:24px;bottom:92px;width:min(400px,calc(100vw - 32px));height:min(620px,80vh);background:#fff;border:1px solid #E7E7E9;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,0.30);display:flex;flex-direction:column;overflow:hidden;z-index:9000;font-family:var(--font,sans-serif);opacity:0;visibility:hidden;transform:translateY(12px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease,visibility 0s linear .18s;}",
      ".kba-root.kba-open .kba-panel{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:opacity .18s ease,transform .18s ease;}",
      ".kba-panel.kba-resizing{transition:none !important;}",
      /* resize handle (top-left corner) */
      ".kba-resize{position:absolute;top:0;left:0;width:22px;height:22px;z-index:6;cursor:nwse-resize;touch-action:none;display:flex;align-items:flex-start;justify-content:flex-start;padding:4px;}",
      ".kba-resize span{display:block;width:12px;height:12px;border-top:2px solid rgba(255,255,255,0.75);border-left:2px solid rgba(255,255,255,0.75);border-top-left-radius:4px;}",
      ".kba-resize:focus-visible{outline:3px solid var(--focus-ring-dark,#FFB27A);outline-offset:-2px;border-radius:6px;}",
      ".kba-resize[hidden]{display:none;}",
      /* header */
      ".kba-head{display:flex;align-items:center;gap:8px;padding:13px 12px 13px 18px;background:linear-gradient(135deg,#1A1A1A,#2D1A0A);color:#fff;flex-shrink:0;}",
      ".kba-head-text{display:flex;flex-direction:column;min-width:0;flex:1;}",
      ".kba-head-title{font-size:15px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".kba-head-sub{font-size:11.5px;color:rgba(255,255,255,0.7);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".kba-head-actions{display:flex;align-items:center;gap:1px;flex-shrink:0;}",
      ".kba-icon-btn{width:32px;height:32px;border-radius:8px;border:none;background:transparent;color:rgba(255,255,255,0.82);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,color .15s;flex-shrink:0;}",
      ".kba-icon-btn:hover{background:rgba(255,255,255,0.14);color:#fff;}",
      ".kba-icon-btn:focus-visible{outline:3px solid var(--focus-ring-dark,#FFB27A);outline-offset:-2px;}",
      ".kba-icon-btn[aria-pressed=\"true\"]{background:rgba(255,255,255,0.2);color:#fff;}",
      ".kba-icon-btn[hidden]{display:none;}",
      /* body */
      ".kba-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;}",
      /* text-size toolbar */
      ".kba-tools{flex-shrink:0;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:6px 12px;border-bottom:1px solid #F0F0F0;background:#FBFBFB;}",
      ".kba-tools-label{font-size:11px;font-weight:600;color:var(--gray-mid,#666);text-transform:uppercase;letter-spacing:.5px;margin-right:auto;}",
      ".kba-fontgrp{display:flex;gap:4px;}",
      ".kba-font-btn{min-width:30px;height:26px;padding:0 7px;border:1.5px solid #DADADA;background:#fff;border-radius:7px;color:var(--gray-dark,#3D3D3D);font:700 12px/1 var(--font,sans-serif);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:1px;transition:border-color .15s,color .15s;}",
      ".kba-font-btn .kba-font-inc span,.kba-font-btn span{font-size:10px;}",
      ".kba-font-btn:hover{border-color:var(--orange,#FF6200);color:var(--orange-text,#B34200);}",
      ".kba-font-btn:focus-visible{outline:3px solid var(--focus-ring,#B34200);outline-offset:1px;}",
      ".kba-font-btn:disabled{opacity:.45;cursor:default;border-color:#E6E6E6;color:#999;}",
      ".kba-messages{flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;font-size:calc(13.5px * var(--kba-fontscale,1));}",
      /* bubbles (message text scales with --kba-fontscale via the messages base size) */
      ".kba-msg{display:flex;max-width:100%;}",
      ".kba-msg-user{justify-content:flex-end;}",
      ".kba-msg-assistant{justify-content:flex-start;}",
      ".kba-bubble{max-width:85%;padding:10px 13px;border-radius:14px;font-size:1em;line-height:1.6;color:var(--black,#1A1A1A);overflow-wrap:break-word;word-wrap:break-word;min-width:0;}",
      ".kba-msg-user .kba-bubble{background:var(--orange-pale,#FFF0E6);border:1px solid #FBD9C2;border-bottom-right-radius:5px;white-space:pre-wrap;}",
      ".kba-msg-assistant .kba-bubble{background:var(--gray-faint,#F5F5F5);border:1px solid #ECECEC;border-bottom-left-radius:5px;}",
      /* markdown inside assistant bubbles (em so it scales) */
      ".kba-bubble p{margin:0 0 8px;}",
      ".kba-bubble p:last-child{margin-bottom:0;}",
      ".kba-bubble h3{font-size:1.11em;font-weight:700;margin:6px 0 6px;}",
      ".kba-bubble h4{font-size:1em;font-weight:700;margin:6px 0 5px;}",
      ".kba-bubble h5{font-size:.93em;font-weight:700;margin:6px 0 5px;text-transform:uppercase;letter-spacing:.4px;color:var(--gray-dark,#3D3D3D);}",
      ".kba-bubble ul,.kba-bubble ol{margin:4px 0 8px;padding-left:22px;}",
      ".kba-bubble li{margin:2px 0;}",
      ".kba-bubble a{color:var(--orange-text,#B34200);text-decoration:underline;text-underline-offset:2px;overflow-wrap:break-word;word-break:break-word;}",
      ".kba-bubble a:hover{color:var(--orange-strong,#C24A00);}",
      ".kba-bubble strong{font-weight:700;}",
      ".kba-bubble code{font-family:var(--mono,monospace);font-size:.89em;background:rgba(26,26,26,0.07);border:1px solid rgba(26,26,26,0.10);border-radius:4px;padding:1px 5px;overflow-wrap:break-word;word-break:break-word;}",
      ".kba-bubble blockquote{margin:6px 0;padding:4px 12px;border-left:3px solid var(--orange,#FF6200);background:var(--orange-faint,#FFF8F3);color:var(--gray-dark,#3D3D3D);border-radius:0 6px 6px 0;}",
      ".kba-bubble hr{border:none;border-top:1px solid #E0E0E0;margin:10px 0;}",
      /* fenced code blocks reuse the site .code-block look */
      ".kba-codewrap{position:relative;margin:8px 0;max-width:100%;}",
      ".kba-codewrap .code-block{margin:0;padding:12px 14px;border-radius:8px;overflow-x:auto;}",
      ".kba-codewrap .code-block pre{font-family:var(--mono,monospace);font-size:.89em;color:#E0E0E0;line-height:1.6;white-space:pre;}",
      ".kba-code-lang{position:absolute;top:7px;left:12px;font:600 10px/1 var(--mono,monospace);color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:.5px;}",
      ".kba-copy{position:absolute;top:7px;right:7px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);color:rgba(255,255,255,0.85);font:600 11px/1 var(--font,sans-serif);padding:5px 9px;border-radius:6px;cursor:pointer;transition:background .15s,color .15s;}",
      ".kba-copy:hover{background:rgba(255,255,255,0.22);color:#fff;}",
      ".kba-copy.done{color:#5DE8AA;border-color:rgba(93,232,170,.4);}",
      ".kba-copy:focus-visible{outline:2px solid #FFB27A;outline-offset:1px;}",
      /* caret + typing + error */
      ".kba-caret{display:inline-block;width:7px;height:1em;margin-left:1px;vertical-align:text-bottom;background:var(--orange,#FF6200);border-radius:1px;animation:kba-blink 1s step-start infinite;}",
      "@keyframes kba-blink{50%{opacity:0;}}",
      ".kba-typing{display:inline-flex;gap:4px;align-items:center;padding:2px 0;}",
      ".kba-typing i{width:7px;height:7px;border-radius:50%;background:var(--gray-light,#C8C8C8);display:inline-block;animation:kba-bounce 1.2s infinite ease-in-out;}",
      ".kba-typing i:nth-child(2){animation-delay:.18s;}",
      ".kba-typing i:nth-child(3){animation-delay:.36s;}",
      "@keyframes kba-bounce{0%,80%,100%{transform:scale(.6);opacity:.5;}40%{transform:scale(1);opacity:1;}}",
      ".kba-error{color:var(--fort-text,#B5231A);background:var(--fort-pale,#FFF0EF);border:1px solid #F3C9C5;border-radius:8px;padding:8px 10px;margin:8px 0 0;font-size:.93em;}",
      ".kba-dim{color:var(--gray-mid,#666);font-size:.93em;font-style:italic;}",
      /* footer / input */
      ".kba-footer{flex-shrink:0;display:flex;align-items:flex-end;gap:8px;padding:12px 14px;border-top:1px solid #ECECEC;background:#fff;}",
      ".kba-input{flex:1;min-width:0;resize:none;border:1.5px solid #DADADA;border-radius:12px;padding:10px 12px;font-family:var(--font,sans-serif);font-size:13.5px;line-height:1.5;color:var(--black,#1A1A1A);max-height:120px;overflow-y:auto;background:#fff;}",
      ".kba-input:focus{outline:none;border-color:var(--orange,#FF6200);box-shadow:0 0 0 3px rgba(255,98,0,0.14);}",
      ".kba-input:disabled{background:#F5F5F5;color:#999;}",
      ".kba-btn-send,.kba-btn-stop{flex-shrink:0;border:none;border-radius:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s,transform .12s;}",
      ".kba-btn-send{width:42px;height:42px;background:var(--orange-strong,#C24A00);color:#fff;}",
      ".kba-btn-send:hover{background:#A33E00;}",
      ".kba-btn-send:focus-visible,.kba-btn-stop:focus-visible{outline:3px solid var(--focus-ring,#B34200);outline-offset:2px;}",
      ".kba-btn-stop{height:42px;padding:0 14px;background:var(--black,#1A1A1A);color:#fff;font:600 13px/1 var(--font,sans-serif);}",
      ".kba-btn-stop:hover{background:#000;}",
      ".kba-btn-stop[hidden],.kba-btn-send[hidden]{display:none;}",
      /* settings form */
      ".kba-settings{padding:18px;overflow-y:auto;height:100%;}",
      ".kba-welcome{font-size:13.5px;line-height:1.6;color:var(--gray-dark,#3D3D3D);margin:0 0 16px;}",
      ".kba-field{margin:0 0 14px;}",
      ".kba-field label{display:block;font-size:12.5px;font-weight:700;color:var(--black,#1A1A1A);margin:0 0 5px;}",
      ".kba-field input,.kba-field select{width:100%;border:1.5px solid #DADADA;border-radius:9px;padding:9px 11px;font-family:var(--font,sans-serif);font-size:13.5px;color:var(--black,#1A1A1A);background:#fff;}",
      ".kba-field input:focus,.kba-field select:focus{outline:none;border-color:var(--orange,#FF6200);box-shadow:0 0 0 3px rgba(255,98,0,0.14);}",
      ".kba-key-row{display:flex;gap:7px;}",
      ".kba-key-row input{flex:1;min-width:0;}",
      ".kba-show{flex-shrink:0;border:1.5px solid #DADADA;background:#F5F5F5;border-radius:9px;padding:0 12px;font:600 12px/1 var(--font,sans-serif);color:var(--gray-dark,#3D3D3D);cursor:pointer;}",
      ".kba-show:hover{background:#ECECEC;}",
      ".kba-show:focus-visible,.kba-adv summary:focus-visible{outline:3px solid var(--focus-ring,#B34200);outline-offset:2px;}",
      ".kba-help{font-size:11.5px;color:var(--gray-mid,#666);margin:5px 0 0;line-height:1.5;}",
      ".kba-adv{margin:0 0 14px;}",
      ".kba-adv summary{cursor:pointer;font-size:12.5px;font-weight:700;color:var(--orange-text,#B34200);padding:4px 0;}",
      ".kba-adv[open] summary{margin-bottom:10px;}",
      ".kba-note{font-size:11.5px;line-height:1.55;color:var(--gray-dark,#3D3D3D);background:var(--orange-faint,#FFF8F3);border:1px solid #F6DFCB;border-radius:9px;padding:10px 12px;margin:0 0 14px;}",
      ".kba-note strong{color:var(--orange-text,#B34200);}",
      ".kba-storewarn{font-size:11.5px;color:var(--fort-text,#B5231A);margin:0 0 14px;}",
      ".kba-form-actions{display:flex;gap:9px;}",
      ".kba-btn{border-radius:10px;padding:10px 16px;font:600 13px/1 var(--font,sans-serif);cursor:pointer;border:1.5px solid #DADADA;background:#fff;color:var(--gray-dark,#3D3D3D);transition:background .15s,border-color .15s,color .15s;}",
      ".kba-btn:hover{border-color:var(--orange,#FF6200);color:var(--orange-text,#B34200);}",
      ".kba-btn:focus-visible{outline:3px solid var(--focus-ring,#B34200);outline-offset:2px;}",
      ".kba-btn-primary{background:var(--orange-strong,#C24A00);border-color:var(--orange-strong,#C24A00);color:#fff;}",
      ".kba-btn-primary:hover{background:#A33E00;border-color:#A33E00;color:#fff;}",
      /* ---- saved-chats list ---- */
      ".kba-chats-top{padding:12px 14px 8px;}",
      ".kba-newchat-big{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:11px;background:var(--orange-strong,#C24A00);color:#fff;font:700 13.5px/1 var(--font,sans-serif);padding:12px 14px;cursor:pointer;transition:background .15s;}",
      ".kba-newchat-big:hover{background:#A33E00;}",
      ".kba-newchat-big:focus-visible{outline:3px solid var(--focus-ring,#B34200);outline-offset:2px;}",
      ".kba-nc-plus{font-size:18px;font-weight:700;line-height:1;}",
      ".kba-chats-list{list-style:none;margin:0;padding:0 8px 4px;}",
      ".kba-chat-row{display:flex;align-items:center;gap:4px;border-radius:10px;padding:2px 4px;margin:0 0 2px;}",
      ".kba-chat-row:hover{background:#F5F5F5;}",
      ".kba-chat-row.is-active{background:var(--orange-faint,#FFF8F3);}",
      ".kba-chat-row.is-active .kba-chat-title{color:var(--orange-text,#B34200);font-weight:700;}",
      ".kba-chat-open{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:1px;background:none;border:none;text-align:left;cursor:pointer;padding:8px 8px;border-radius:8px;}",
      ".kba-chat-open:focus-visible{outline:3px solid var(--focus-ring,#B34200);outline-offset:1px;}",
      ".kba-chat-title{font-size:13.5px;font-weight:600;color:var(--black,#1A1A1A);line-height:1.35;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;width:100%;}",
      ".kba-chat-time{font-size:11px;color:var(--gray-mid,#666);}",
      ".kba-chat-acts{display:flex;gap:1px;flex-shrink:0;}",
      ".kba-chat-rename,.kba-chat-del{width:28px;height:28px;border:none;background:none;color:var(--gray-mid,#666);border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s;}",
      ".kba-chat-rename:hover{background:#ECECEC;color:var(--black,#1A1A1A);}",
      ".kba-chat-del:hover{background:var(--fort-pale,#FFF0EF);color:var(--fort-text,#B5231A);}",
      ".kba-chat-rename:focus-visible,.kba-chat-del:focus-visible{outline:2px solid var(--focus-ring,#B34200);outline-offset:1px;}",
      ".kba-rename-input{flex:1;min-width:0;margin:6px 4px;border:1.5px solid var(--orange,#FF6200);border-radius:8px;padding:7px 9px;font-family:var(--font,sans-serif);font-size:13.5px;color:var(--black,#1A1A1A);}",
      ".kba-rename-input:focus{outline:none;box-shadow:0 0 0 3px rgba(255,98,0,0.14);}",
      ".kba-chats-empty{padding:10px 18px;font-size:13px;color:var(--gray-mid,#666);line-height:1.6;}",
      ".kba-chats-note{padding:8px 18px 14px;font-size:11px;color:var(--gray-mid,#666);line-height:1.5;}",
      /* screen-reader only */
      ".kba-sr{position:absolute !important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}",
      /* ---- full-window page ---- */
      ".kba-page{display:flex;position:relative;height:min(78vh,820px);min-height:460px;border:1px solid #E7E7E9;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,0.08);font-family:var(--font,sans-serif);}",
      ".kba-page-sidebar{width:280px;flex-shrink:0;border-right:1px solid #ECECEC;background:#FAFAFA;display:flex;flex-direction:column;overflow:hidden;}",
      ".kba-side-list{flex:1;min-height:0;overflow-y:auto;}",
      ".kba-page-main{flex:1;min-width:0;display:flex;flex-direction:column;}",
      ".kba-page-main .kba-head{padding-left:14px;}",
      ".kba-page .kba-side-toggle{display:none;}",
      ".kba-page-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.35);z-index:4;border:0;}",
      ".kba-page-overlay[hidden]{display:none;}",
      "@media(max-width:720px){",
        ".kba-page .kba-side-toggle{display:flex;}",
        ".kba-page-sidebar{position:absolute;top:0;bottom:0;left:0;z-index:5;width:82%;max-width:300px;transform:translateX(-100%);transition:transform .2s ease;box-shadow:6px 0 24px rgba(0,0,0,0.18);}",
        ".kba-page.sidebar-open .kba-page-sidebar{transform:none;}",
      "}",
      /* mobile: panel near fullscreen */
      "@media(max-width:480px){.kba-panel{right:10px;left:10px;bottom:10px;top:10px;width:auto !important;height:auto !important;max-height:none;border-radius:14px;}.kba-fab{right:16px;bottom:16px;}.kb-top{right:16px !important;bottom:84px !important;}.kba-resize{display:none;}.kba-page{height:auto;min-height:0;}.kba-page-sidebar{width:86%;}}",
      /* reduced motion */
      "@media(prefers-reduced-motion:reduce){.kba-fab,.kba-panel,.kba-btn-send,.kba-icon-btn,.kba-copy,.kba-page-sidebar{transition:none;}.kba-fab:hover{transform:none;}.kba-fab-dot,.kba-caret,.kba-typing i{animation:none;}}"
    ].join("\n");
    document.head.appendChild(s);
  }

  /* ---------- init ---------- */
  function isPageMode() {
    var b = document.body;
    if (b && b.getAttribute && b.getAttribute("data-kb-assistant") === "page") return true;
    if (document.getElementById("kb-assistant-page")) return true;
    return false;
  }
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function init() {
    try {
      if (!document.body) return;
      chatsState = loadChats();
      uiPrefs = loadUI();
      injectCSS();
      if (isPageMode()) buildPage();
      else build();
    } catch (e) { /* never break the page */ }
  }
  ready(init);
})();
