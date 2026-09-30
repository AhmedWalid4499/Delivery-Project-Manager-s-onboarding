/* ═══════════════════════════════════════════════════════════
   DPM Knowledge Base — TOOL LAUNCHER  (launcher.js)
   ───────────────────────────────────────────────────────────
   One-click links to the systems a DPM uses on every delivery.

   HOW TO USE IT ON A PAGE
     <div data-kb-launcher="compact"></div>   a wrapping row of chips
     <div data-kb-launcher="full"></div>      grouped cards + "Set my links"
     <script src="launcher.js"></script>      (load it before shared.js)
   Every [data-kb-launcher] element is rendered automatically.
   From code:  KBLauncher.render(element, { mode: "compact" | "full" })

   PER-VIEWER LINKS
   Each viewer can paste their own link per tool ("Set my links").
   Those links are saved ONLY in that viewer's browser (localStorage
   key "dpmkb_tool_links") and override the team default below.
   Nothing is sent anywhere. tools.html#edit opens the editor.
═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.KBLauncher) return;

  /* ── TOOLS · the team defaults ─────────────────────────────
     `url` is the TEAM DEFAULT link that every viewer sees until
     they set their own (a viewer's own link always wins).

     !! THIS REPOSITORY IS PUBLIC !!
     Anything typed in this file is visible to anyone on the
     internet. That is why only the generic, public entry points
     (Power BI, Power Automate) are filled in, and every internal
     tool has url: "". Do NOT paste internal hostnames or intranet
     URLs here while the repo is public. Once the site is hosted
     privately, team defaults can be filled in with a full
     https:// address. Until then, each DPM sets their own links
     via "Set my links" on tools.html.

     Fields: id (unique, lowercase a-z 0-9 -), name, short (optional,
     used on compact chips), purpose, emoji, group, url.
     `group` must be one of the GROUPS names below (anything else
     is shown in its own group after them).
  ─────────────────────────────────────────────────────────── */
  var TOOLS = [
    {
      id: "gold", name: "GOLD", emoji: "📦", group: "Delivery",
      purpose: "Order management — where the customer order lives. You track it and close the GOLD order at the end of delivery.",
      url: ""
    },
    {
      id: "servicenow", name: "ServiceNow (SNOW)", short: "ServiceNow", emoji: "🎫", group: "Delivery",
      purpose: "Change requests and CMDB updates (the record of what's installed) — change control around migration windows.",
      url: ""
    },
    {
      id: "machx", name: "MACHX", emoji: "🛠️", group: "Delivery",
      purpose: "Raise and manage TIM / VPO work orders that get engineering & staging done. An AP job needs one raise; a Switch/WLC job needs two.",
      url: ""
    },
    {
      id: "flip", name: "FLIP", emoji: "👷", group: "Delivery",
      purpose: "Book Field Engineers to attend site — used on Switch/WLC deliveries where hardware is handled on-site.",
      url: ""
    },
    {
      id: "dnac", name: "DNAC / Catalyst Center", short: "DNAC", emoji: "📡", group: "Delivery",
      purpose: "Cisco's network management platform. After migration you send the DNAC update so the new devices are managed and monitored.",
      url: ""
    },
    {
      id: "salto", name: "SALTO", emoji: "🧾", group: "Delivery",
      purpose: "The second order system — closed post-migration alongside GOLD.",
      url: ""
    },
    {
      id: "sharepoint", name: "SharePoint", emoji: "📁", group: "Delivery",
      purpose: "Where delivery documents live — upload the HOTO document, runbook and LLD (Low-Level Design) for each project.",
      url: ""
    },
    {
      id: "prime", name: "Oracle PRIME", short: "PRIME", emoji: "⏱️", group: "Reporting, time & automation",
      purpose: "Time entry — logging your hours against projects.",
      url: ""
    },
    {
      id: "powerbi", name: "Power BI", emoji: "📊", group: "Reporting, time & automation",
      purpose: "Dashboards and reporting on delivery status and KPIs.",
      url: "https://app.powerbi.com"
    },
    {
      id: "powerautomate", name: "Power Automate / Office Scripts", short: "Power Automate", emoji: "🤖", group: "Reporting, time & automation",
      purpose: "Automating repetitive steps (reminders, data prep) — much of it built by the Automation squad.",
      url: "https://make.powerautomate.com"
    }
  ];

  var GROUPS = [
    { name: "Delivery", blurb: "Core delivery tools — the order, the work, the people on site and the paperwork." },
    { name: "Reporting, time & automation", blurb: "Your time, the dashboards and the automations." }
  ];

  var STORE_KEY = "dpmkb_tool_links";
  var PROBE_KEY = "dpmkb_probe";
  var EDIT_HASH = "#edit";
  var DEFAULT_EDIT_HREF = "tools.html#edit";
  var MAX_URL = 2000;

  var saved = {};          // the viewer's own links: { toolId: "https://…" }
  var storageOK = true;    // becomes false as soon as any storage access throws
  var instances = [];
  var uid = 0;
  var hashHandled = false;

  TOOLS = TOOLS.filter(function (t) { return t && t.id && t.name; });

  /* ---------- small helpers ---------- */
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function groupOf(t) { return t.group || "Other"; }
  function domId(s) { return String(s).toLowerCase().replace(/[^a-z0-9-]+/g, "-"); }
  function mineFor(id) { return own(saved, id) ? saved[id] : ""; }

  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k, i, c;
    if (attrs) {
      for (k in attrs) {
        if (!own(attrs, k)) continue;
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "className") e.className = v;
        else if (k === "text") e.textContent = v;
        else e.setAttribute(k, v === true ? "" : String(v));
      }
    }
    if (kids) {
      for (i = 0; i < kids.length; i++) {
        c = kids[i];
        if (c == null) continue;
        e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return e;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  /* ---------- URL validation (http / https only) ---------- */
  function checkUrl(raw) {
    if (raw == null) return { ok: true, value: "" };
    if (typeof raw !== "string") return { ok: false, error: "That isn't a web address." };
    var s = raw.trim();
    if (!s) return { ok: true, value: "" };
    if (s.length > MAX_URL) return { ok: false, error: "That link is too long (2,000 characters max)." };
    if (/\s/.test(s)) return { ok: false, error: "A link can't contain spaces." };
    if (!/^https?:\/\//i.test(s)) {
      if (/^[a-z][a-z0-9+.\-]*:(?!\d)/i.test(s)) return { ok: false, error: "Only http:// and https:// links are allowed." };
      return { ok: false, error: "Start the link with https:// (or http://)." };
    }
    var href = s;
    if (typeof URL === "function") {
      var u;
      try { u = new URL(s); } catch (e) { return { ok: false, error: "That doesn't look like a valid web address." }; }
      if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Only http:// and https:// links are allowed." };
      if (!u.hostname) return { ok: false, error: "That link is missing a site name." };
      if (u.username || u.password) return { ok: false, error: "Don't put a username or password in the link." };
      href = u.href;
    } else if (!/^https?:\/\/[^\/?#@\s]+/i.test(s)) {
      return { ok: false, error: "That doesn't look like a valid web address." };
    }
    return { ok: true, value: href };
  }

  function hostOf(url) {
    try { if (typeof URL === "function") return new URL(url).host; } catch (e) { /* fall through */ }
    var m = /^https?:\/\/([^\/?#]+)/i.exec(url || "");
    return m ? m[1] : "";
  }

  function linkFor(t) {
    var mine = mineFor(t.id);
    if (mine) return { url: mine, source: "mine" };
    var team = checkUrl(t.url);
    if (team.ok && team.value) return { url: team.value, source: "team" };
    return { url: "", source: "none" };
  }

  function teamUrl(t) {
    var r = checkUrl(t.url);
    return r.ok ? r.value : "";
  }

  /* ---------- storage (every access wrapped; page still works in memory) ---------- */
  function probeStorage() {
    try {
      var ls = window.localStorage;
      ls.setItem(PROBE_KEY, "1");
      ls.removeItem(PROBE_KEY);
    } catch (e) { storageOK = false; }
  }
  function storageGet() {
    try { return window.localStorage.getItem(STORE_KEY); }
    catch (e) { storageOK = false; return null; }
  }
  function storageSet(obj) {
    try {
      if (Object.keys(obj).length) window.localStorage.setItem(STORE_KEY, JSON.stringify(obj));
      else window.localStorage.removeItem(STORE_KEY);
      return true;
    } catch (e) { storageOK = false; return false; }
  }
  function parseSaved(raw) {
    var out = {}, data, k, r;
    if (!raw || typeof raw !== "string") return out;
    try { data = JSON.parse(raw); } catch (e) { return out; }
    if (!data || Object.prototype.toString.call(data) !== "[object Object]") return out;
    for (k in data) {
      if (!own(data, k) || !/^[a-z0-9-]{1,40}$/.test(k)) continue;
      if (typeof data[k] !== "string") continue;
      r = checkUrl(data[k]);
      if (r.ok && r.value) out[k] = r.value;
    }
    return out;
  }
  function persist() { return storageSet(saved); }

  /* ---------- styles (injected once) ---------- */
  function injectCSS() {
    if (document.getElementById("kb-launcher-css")) return;
    var s = document.createElement("style");
    s.id = "kb-launcher-css";
    s.textContent = [
      ".kbl{--kbl-ink:var(--black,#1A1A1A);--kbl-muted:#5E5E5E;--kbl-accent:#A33E00;font-family:var(--font,sans-serif);min-width:0;max-width:100%;scroll-margin-top:84px;}",
      ".kbl *,.kbl *::before,.kbl *::after{box-sizing:border-box;}",
      ".kbl [hidden]{display:none !important;}",
      ".kbl-sr{position:absolute !important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}",
      ".kbl a:focus-visible,.kbl button:focus-visible,.kbl input:focus-visible{outline:3px solid var(--orange-dark,#CC4E00);outline-offset:2px;}",
      /* compact: chips */
      ".kbl-chips{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;align-items:center;gap:8px;}",
      ".kbl-chips li{margin:0;padding:0;min-width:0;max-width:100%;}",
      ".kbl-chip{display:inline-flex;align-items:center;gap:7px;max-width:100%;background:#fff;border:1px solid #E0E0E0;border-radius:999px;padding:6px 13px 6px 10px;font-size:13px;font-weight:600;line-height:1.3;color:var(--kbl-ink);text-decoration:none;transition:border-color .15s,box-shadow .15s,transform .15s;}",
      ".kbl-chip:hover{border-color:var(--orange,#FF6200);box-shadow:0 4px 14px rgba(255,98,0,0.14);transform:translateY(-1px);color:var(--kbl-ink);text-decoration:none;}",
      ".kbl-chip-ic{font-size:15px;line-height:1;flex-shrink:0;}",
      ".kbl-chip-nm{min-width:0;overflow-wrap:anywhere;}",
      ".kbl-chip.is-missing{background:var(--gray-faint,#F5F5F5);border-style:dashed;border-color:#B8B8B8;color:var(--kbl-muted);font-weight:500;}",
      ".kbl-chip.is-missing .kbl-chip-ic{filter:grayscale(1);opacity:.75;}",
      ".kbl-chip-add{flex-shrink:0;font-size:11px;font-weight:700;color:var(--kbl-accent);background:#fff;border:1px solid #F0CBB0;border-radius:999px;padding:1px 7px;white-space:nowrap;}",
      ".kbl-setlink{display:inline-flex;align-items:center;gap:5px;padding:6px 4px;font-size:12.5px;font-weight:600;color:var(--kbl-accent);text-decoration:underline;text-underline-offset:2px;}",
      ".kbl-setlink:hover{color:#7A2F00;text-decoration-thickness:2px;}",
      /* notices */
      ".kbl-note{display:flex;gap:8px;align-items:flex-start;margin:0 0 16px;background:#FFF7E0;border-left:3px solid #D39E00;border-radius:8px;padding:10px 14px;font-size:13px;line-height:1.55;color:var(--gray-dark,#3D3D3D);}",
      ".kbl-note-sm{display:block;margin:8px 0 0;background:none;border:0;padding:0;font-size:12px;color:var(--kbl-muted);}",
      ".kbl-intro{margin:0 0 18px;background:var(--cisco-pale,#E8F6FD);border-left:3px solid var(--cisco-blue,#1BA0D7);border-radius:8px;padding:12px 16px;font-size:13.5px;line-height:1.6;color:var(--gray-dark,#3D3D3D);}",
      ".kbl-intro strong{color:var(--kbl-ink);}",
      /* full: toolbar */
      ".kbl-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 16px;background:var(--orange-faint,#FFF8F3);border:1px solid var(--orange-pale,#FFF0E6);border-radius:12px;padding:14px 16px;margin:0 0 18px;}",
      ".kbl-bar-tx{flex:1 1 220px;min-width:0;}",
      ".kbl-summary{margin:0;font-size:14px;font-weight:700;color:var(--kbl-ink);}",
      ".kbl-status{margin:2px 0 0;min-height:1.3em;font-size:12.5px;color:var(--kbl-muted);overflow-wrap:anywhere;}",
      ".kbl-bar-btns{display:flex;flex-wrap:wrap;gap:8px;}",
      /* buttons */
      ".kbl-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;font-size:13px;font-weight:700;line-height:1.2;padding:9px 14px;border-radius:9px;border:1.5px solid transparent;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background .15s,border-color .15s,color .15s;}",
      ".kbl-btn:hover{text-decoration:none;}",
      ".kbl-btn-primary{background:var(--orange-dark,#CC4E00);color:#fff;}",
      ".kbl-btn-primary:hover{background:#A33E00;color:#fff;}",
      ".kbl-btn-edit{background:var(--black,#1A1A1A);color:#fff;}",
      ".kbl-btn-edit:hover{background:#3A3A3A;color:#fff;}",
      ".kbl-btn-edit[data-editing=\"true\"]{background:#0A7A4A;}",
      ".kbl-btn-edit[data-editing=\"true\"]:hover{background:#086640;}",
      ".kbl-btn-ghost{background:#fff;color:var(--kbl-accent);border-color:#EDB892;border-style:dashed;}",
      ".kbl-btn-ghost:hover{background:var(--orange-faint,#FFF8F3);border-color:var(--kbl-accent);color:#A33E00;}",
      ".kbl-btn-quiet{background:#fff;color:var(--gray-dark,#3D3D3D);border-color:#D2D2D2;}",
      ".kbl-btn-quiet:hover{border-color:var(--gray-dark,#3D3D3D);color:var(--kbl-ink);}",
      ".kbl-btn[disabled]{opacity:.5;cursor:not-allowed;}",
      ".kbl-btn-sm{padding:8px 12px;font-size:12.5px;}",
      /* full: groups + cards */
      ".kbl-group{margin:0 0 26px;min-width:0;}",
      ".kbl-group:last-child{margin-bottom:0;}",
      ".kbl-group-hd{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;margin:0 0 3px;}",
      ".kbl-group-title{font-size:12px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--gray-dark,#3D3D3D);}",
      ".kbl-group-ct{font-size:11.5px;color:var(--kbl-muted);}",
      ".kbl-group-blurb{margin:0 0 12px;font-size:13px;color:var(--kbl-muted);}",
      ".kbl-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;}",
      "@media(max-width:600px){.kbl-grid{grid-template-columns:1fr;}}",
      ".kbl-card{display:flex;flex-direction:column;min-width:0;margin:0;background:#fff;border:1px solid #EBEBEB;border-top:3px solid var(--orange,#FF6200);border-radius:12px;padding:16px 16px 15px;transition:box-shadow .2s,border-color .2s;}",
      ".kbl-card:hover{box-shadow:var(--shadow-hover,0 8px 40px rgba(255,98,0,0.13));}",
      ".kbl-card.is-missing{border-top-color:#C8C8C8;}",
      ".kbl-card.is-mine{border-top-color:#0A7A4A;}",
      ".kbl-card-top{display:flex;align-items:center;gap:12px;min-width:0;margin-bottom:9px;}",
      ".kbl-emoji{width:42px;height:42px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--orange-pale,#FFF0E6);font-size:21px;line-height:1;}",
      ".kbl-card.is-missing .kbl-emoji{background:var(--gray-faint,#F5F5F5);}",
      ".kbl-card-tt{flex:1;min-width:0;}",
      ".kbl-name{font-size:15.5px;font-weight:700;line-height:1.3;color:var(--kbl-ink);overflow-wrap:anywhere;}",
      ".kbl-src{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;}",
      ".kbl-src-mine{background:var(--green-pale,#E6F7F1);color:#0A7A4A;}",
      ".kbl-src-team{background:var(--orange-pale,#FFF0E6);color:#A33E00;}",
      ".kbl-src-none{background:var(--gray-faint,#F5F5F5);color:var(--kbl-muted);border:1px dashed #BDBDBD;}",
      ".kbl-purpose{flex:1;margin:0 0 10px;font-size:13px;line-height:1.6;color:#555;}",
      ".kbl-host{margin:0 0 10px;font-family:var(--mono,monospace);font-size:11.5px;color:var(--kbl-muted);overflow-wrap:anywhere;word-break:break-all;}",
      ".kbl-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}",
      ".kbl.is-editing .kbl-card.is-missing .kbl-actions{display:none;}",
      /* full: per-tool edit form */
      ".kbl-form{min-width:0;margin-top:12px;padding-top:12px;border-top:1px dashed #DCDCDC;}",
      ".kbl-label{display:block;margin-bottom:5px;font-size:12px;font-weight:700;color:var(--gray-dark,#3D3D3D);}",
      ".kbl-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0;}",
      ".kbl-input{flex:1 1 100%;width:100%;min-width:0;padding:9px 10px;font-family:var(--mono,monospace);font-size:12.5px;color:var(--kbl-ink);background:#fff;border:1.5px solid #8A8A8A;border-radius:8px;}",
      ".kbl-input:focus{border-color:var(--orange-dark,#CC4E00);}",
      ".kbl-input[aria-invalid=\"true\"]{border-color:#B3261E;background:#FFF6F6;}",
      ".kbl-saved{font-size:12px;font-weight:700;color:#0A7A4A;}",
      ".kbl-hint{margin:6px 0 0;font-size:11.5px;line-height:1.45;color:var(--kbl-muted);overflow-wrap:anywhere;}",
      ".kbl-err{margin:6px 0 0;font-size:12px;font-weight:600;line-height:1.45;color:#B3261E;overflow-wrap:anywhere;}",
      "@media(max-width:420px){.kbl-bar-btns{width:100%;}.kbl-bar-btns .kbl-btn{flex:1 1 auto;}}"
    ].join("\n");
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------- COMPACT mode: one wrapping row of chips ---------- */
  function renderCompact(inst) {
    var root = inst.root;
    clear(root);
    var list = h("ul", { className: "kbl-chips", "aria-label": "Tool shortcuts" });
    TOOLS.forEach(function (t) {
      var l = linkFor(t), label = t.short || t.name, a;
      if (l.url) {
        a = h("a", {
          className: "kbl-chip", href: l.url, target: "_blank", rel: "noopener noreferrer",
          title: t.name + " — " + t.purpose
        }, [
          h("span", { className: "kbl-chip-ic", "aria-hidden": "true", text: t.emoji || "🔗" }),
          h("span", { className: "kbl-chip-nm", text: label }),
          h("span", { className: "kbl-sr", text: " (opens in a new tab)" })
        ]);
      } else {
        a = h("a", {
          className: "kbl-chip is-missing", href: inst.editHref,
          title: "No link yet for " + t.name + " — add yours",
          "aria-label": t.name + ": no link yet — add your link"
        }, [
          h("span", { className: "kbl-chip-ic", "aria-hidden": "true", text: t.emoji || "🔗" }),
          h("span", { className: "kbl-chip-nm", text: label }),
          h("span", { className: "kbl-chip-add", "aria-hidden": "true", text: "Add link" })
        ]);
        a.addEventListener("click", function (e) { if (openEditOnThisPage(t.id)) e.preventDefault(); });
      }
      list.appendChild(h("li", null, [a]));
    });
    var set = h("a", { className: "kbl-setlink", href: inst.editHref }, [
      h("span", { "aria-hidden": "true", text: "⚙" }), " Set my links"
    ]);
    set.addEventListener("click", function (e) { if (openEditOnThisPage(null)) e.preventDefault(); });
    list.appendChild(h("li", null, [set]));
    root.appendChild(list);
    if (!storageOK) {
      root.appendChild(h("p", { className: "kbl-note kbl-note-sm", text: "This browser is blocking site storage, so personal links can't be saved here." }));
    }
  }

  /* ---------- FULL mode: grouped cards + editor ---------- */
  function groupNames() {
    var names = [], i, g;
    for (i = 0; i < GROUPS.length; i++) names.push(GROUPS[i].name);
    for (i = 0; i < TOOLS.length; i++) { g = groupOf(TOOLS[i]); if (names.indexOf(g) < 0) names.push(g); }
    return names;
  }
  function groupBlurb(name) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].name === name) return GROUPS[i].blurb || "";
    return "";
  }

  function renderFull(inst) {
    var root = inst.root;
    clear(root);
    inst.cards = {};

    inst.summary = h("p", { className: "kbl-summary" });
    inst.status = h("p", { className: "kbl-status", role: "status", "aria-live": "polite" });
    inst.clearBtn = h("button", { type: "button", className: "kbl-btn kbl-btn-quiet", text: "Clear all my links", hidden: true });
    inst.editBtn = h("button", { type: "button", className: "kbl-btn kbl-btn-edit", "data-editing": "false" });
    root.appendChild(h("div", { className: "kbl-bar" }, [
      h("div", { className: "kbl-bar-tx" }, [inst.summary, inst.status]),
      h("div", { className: "kbl-bar-btns" }, [inst.clearBtn, inst.editBtn])
    ]));

    inst.note = h("p", { className: "kbl-note", hidden: true }, [
      h("span", { "aria-hidden": "true", text: "⚠️" }),
      h("span", { text: "This browser isn't letting the page save data (private window or blocked site storage), so links you set here only last until you leave or reload this page." })
    ]);
    root.appendChild(inst.note);

    inst.intro = h("div", { className: "kbl-intro", hidden: true }, [
      h("strong", { text: "Setting your links. " }),
      "Paste the address you use for each tool — it must start with https:// (or http://) — then press Enter or Save. ",
      "Your link replaces the team default for you only; Reset goes back to the team default. ",
      "Links are saved only in this browser."
    ]);
    root.appendChild(inst.intro);

    groupNames().forEach(function (g) {
      var tools = TOOLS.filter(function (t) { return groupOf(t) === g; });
      if (!tools.length) return;
      var gid = "kbl-" + inst.n + "-g-" + domId(g);
      var grid = h("ul", { className: "kbl-grid", "aria-labelledby": gid });
      tools.forEach(function (t) { grid.appendChild(buildCard(inst, t)); });
      var blurb = groupBlurb(g);
      root.appendChild(h("div", { className: "kbl-group" }, [
        h("div", { className: "kbl-group-hd" }, [
          h("div", { className: "kbl-group-title", id: gid, role: "heading", "aria-level": "3", text: g }),
          h("span", { className: "kbl-group-ct", text: tools.length + (tools.length === 1 ? " tool" : " tools") })
        ]),
        blurb ? h("p", { className: "kbl-group-blurb", text: blurb }) : null,
        grid
      ]));
    });

    inst.editBtn.addEventListener("click", function () {
      if (inst.editing) finishEditing(inst);
      else openEdit(inst, null, false);
    });
    inst.clearBtn.addEventListener("click", function () { clearAll(inst); });

    setEditing(inst, false);
    paintFull(inst);
  }

  function buildCard(inst, t) {
    var base = "kbl-" + inst.n + "-" + domId(t.id);
    var c = { tool: t, synced: mineFor(t.id), flashT: 0 };

    c.src = h("span", { className: "kbl-src" });
    c.host = h("p", { className: "kbl-host" });
    c.actions = h("div", { className: "kbl-actions" });

    c.input = h("input", {
      type: "url", id: base + "-in", className: "kbl-input", name: t.id,
      inputmode: "url", autocomplete: "url", autocapitalize: "off", spellcheck: "false",
      placeholder: "https://…", "aria-describedby": base + "-err " + base + "-hint"
    });
    c.input.value = c.synced;
    c.err = h("p", { className: "kbl-err", id: base + "-err", hidden: true });
    var team = teamUrl(t);
    c.hint = h("p", {
      className: "kbl-hint", id: base + "-hint",
      text: team
        ? "Team default: " + team + " — used when this box is empty."
        : "No team default — while this box is empty the tool shows “Add link”."
    });
    c.saved = h("span", { className: "kbl-saved", hidden: true });
    c.resetBtn = h("button", { type: "button", className: "kbl-btn kbl-btn-quiet kbl-btn-sm" }, [
      "Reset", h("span", { className: "kbl-sr", text: " " + t.name + " to the team default" })
    ]);
    var saveBtn = h("button", { type: "submit", className: "kbl-btn kbl-btn-primary kbl-btn-sm" }, [
      "Save", h("span", { className: "kbl-sr", text: " " + t.name + " link" })
    ]);
    c.form = h("form", { className: "kbl-form", novalidate: true, hidden: true }, [
      h("label", { className: "kbl-label", "for": c.input.id, text: "Your " + t.name + " link" }),
      h("div", { className: "kbl-row" }, [c.input, saveBtn, c.resetBtn, c.saved]),
      c.err,
      c.hint
    ]);

    c.li = h("li", { className: "kbl-card" }, [
      h("div", { className: "kbl-card-top" }, [
        h("span", { className: "kbl-emoji", "aria-hidden": "true", text: t.emoji || "🔗" }),
        h("div", { className: "kbl-card-tt" }, [
          h("div", { className: "kbl-name", role: "heading", "aria-level": "4", text: t.name }),
          c.src
        ])
      ]),
      h("p", { className: "kbl-purpose", text: t.purpose || "" }),
      c.host,
      c.actions,
      c.form
    ]);

    c.form.addEventListener("submit", function (e) { e.preventDefault(); commit(inst, t.id, true); });
    c.input.addEventListener("change", function () { commit(inst, t.id, false); });
    c.input.addEventListener("input", function () { if (!c.err.hidden) clearErr(c); });
    c.resetBtn.addEventListener("click", function () { resetTool(inst, t.id); });

    inst.cards[t.id] = c;
    return c.li;
  }

  function paintCard(inst, id) {
    var c = inst.cards[id];
    if (!c) return;
    var t = c.tool, l = linkFor(t), mine = mineFor(id);

    c.li.className = "kbl-card" + (l.url ? "" : " is-missing") + (l.source === "mine" ? " is-mine" : "");
    c.src.className = "kbl-src kbl-src-" + l.source;
    c.src.textContent = l.source === "mine" ? "Your link" : (l.source === "team" ? "Team default" : "No link yet");

    var host = l.url ? hostOf(l.url) : "";
    c.host.textContent = host;
    c.host.hidden = !host;

    /* rebuild the action only when the link changed (keeps focus / pending clicks intact) */
    if (c.painted && c.lastUrl === l.url) {
      syncInput(c, mine);
      return;
    }
    c.painted = true;
    c.lastUrl = l.url;
    clear(c.actions);
    if (l.url) {
      c.actions.appendChild(h("a", { className: "kbl-btn kbl-btn-primary", href: l.url, target: "_blank", rel: "noopener noreferrer" }, [
        "Open",
        h("span", { className: "kbl-sr", text: " " + t.name + " (opens in a new tab)" }),
        h("span", { "aria-hidden": "true", text: "↗" })
      ]));
    } else {
      var add = h("button", { type: "button", className: "kbl-btn kbl-btn-ghost" }, [
        h("span", { "aria-hidden": "true", text: "+" }),
        "Add link",
        h("span", { className: "kbl-sr", text: " for " + t.name })
      ]);
      add.addEventListener("click", function () { openEdit(inst, id, false); });
      c.actions.appendChild(add);
    }

    syncInput(c, mine);
  }

  /* keep the box in step with the saved link unless the viewer is mid-edit */
  function syncInput(c, mine) {
    if (c.input.value.trim() === c.synced) {
      c.input.value = mine;
      c.synced = mine;
    }
  }

  function paintSummary(inst) {
    var linked = 0, mine = 0;
    TOOLS.forEach(function (t) {
      var l = linkFor(t);
      if (l.url) linked++;
      if (l.source === "mine") mine++;
    });
    inst.summary.textContent = linked + " of " + TOOLS.length + " tools linked" + (mine ? " · " + mine + " set by you" : "");
    inst.clearBtn.disabled = Object.keys(saved).length === 0;
    inst.note.hidden = storageOK;
  }

  function paintFull(inst) {
    TOOLS.forEach(function (t) { paintCard(inst, t.id); });
    paintSummary(inst);
  }

  function refreshAll() {
    for (var i = 0; i < instances.length; i++) {
      var inst = instances[i];
      if (inst.mode === "full") paintFull(inst);
      else renderCompact(inst);
    }
  }

  /* ---------- edit mode ---------- */
  function showErr(c, msg) {
    c.err.textContent = "⚠ " + msg;
    c.err.hidden = false;
    c.input.setAttribute("aria-invalid", "true");
  }
  function clearErr(c) {
    c.err.textContent = "";
    c.err.hidden = true;
    c.input.removeAttribute("aria-invalid");
  }
  function announce(inst, msg) {
    if (!inst.status) return;
    inst.status.textContent = "";
    setTimeout(function () { inst.status.textContent = msg; }, 40);
  }
  function flash(c, msg) {
    c.saved.textContent = "✓ " + msg;
    c.saved.hidden = false;
    clearTimeout(c.flashT);
    c.flashT = setTimeout(function () { c.saved.hidden = true; c.saved.textContent = ""; }, 2600);
  }
  function notSavedNote(ok) {
    return ok ? "" : " (Kept for this visit only — this browser isn't saving.)";
  }

  function setEditing(inst, on) {
    if (on && !inst.editing) inst.editChanges = 0;
    inst.editing = !!on;
    if (on) inst.root.classList.add("is-editing");
    else inst.root.classList.remove("is-editing");
    /* the label itself says the state ("Set my links" / "Done"), so no aria-pressed:
       "Done, toggle button, pressed" contradicted itself */
    inst.editBtn.setAttribute("data-editing", on ? "true" : "false");
    clear(inst.editBtn);
    inst.editBtn.appendChild(h("span", { "aria-hidden": "true", text: on ? "✓" : "⚙" }));
    inst.editBtn.appendChild(document.createTextNode(on ? " Done" : " Set my links"));
    inst.clearBtn.hidden = !on;
    inst.intro.hidden = !on;
    TOOLS.forEach(function (t) {
      var c = inst.cards[t.id];
      if (!c) return;
      c.form.hidden = !on;
      if (on) {
        clearErr(c);
        c.input.value = mineFor(t.id);
        c.synced = c.input.value;
      }
    });
  }

  function firstCardToFill(inst) {
    var first = null, i, c;
    for (i = 0; i < TOOLS.length; i++) {
      c = inst.cards[TOOLS[i].id];
      if (!c) continue;
      if (!first) first = c;
      if (!linkFor(TOOLS[i]).url) return c;
    }
    return first;
  }

  function openEdit(inst, focusId, scrollToTop) {
    var wasEditing = inst.editing;
    if (!wasEditing) setEditing(inst, true);
    var c = (focusId && inst.cards[focusId]) || firstCardToFill(inst);
    if (scrollToTop) {
      try { inst.root.scrollIntoView({ block: "start" }); } catch (e) { inst.root.scrollIntoView(true); }
      if (c) { try { c.input.focus({ preventScroll: true }); } catch (e2) { c.input.focus(); } }
    } else if (c) {
      c.input.focus();
    }
    if (!wasEditing || scrollToTop) announce(inst, "Editing your links. Press Done when you're finished.");
  }

  /* Used by compact chips: if a full launcher is on this page, open it here. */
  function openEditOnThisPage(toolId) {
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].mode === "full") { openEdit(instances[i], toolId, true); return true; }
    }
    return false;
  }

  function commit(inst, id, explicit) {
    var c = inst.cards[id];
    if (!c) return false;
    var t = c.tool, r = checkUrl(c.input.value), prev = mineFor(id);
    if (!r.ok) {
      showErr(c, r.error);
      if (explicit) c.input.focus();
      announce(inst, t.name + ": " + r.error);
      return false;
    }
    clearErr(c);
    c.input.value = r.value;
    c.synced = r.value;
    if (r.value === prev) {
      if (explicit) {
        flash(c, r.value ? "Saved" : "Using team default");
        announce(inst, r.value ? "Your " + t.name + " link is saved." : t.name + " uses the team default.");
      }
      return true;
    }
    if (r.value) saved[id] = r.value;
    else delete saved[id];
    inst.editChanges = (inst.editChanges || 0) + 1;
    var ok = persist();
    refreshAll();
    flash(c, r.value ? "Saved" : "Removed");
    announce(inst, (r.value
      ? "Saved your " + t.name + " link."
      : "Removed your " + t.name + " link" + (teamUrl(t) ? " — using the team default." : ".")) + notSavedNote(ok));
    return true;
  }

  function resetTool(inst, id) {
    var c = inst.cards[id];
    if (!c) return;
    var t = c.tool, had = !!mineFor(id), ok = true;
    clearErr(c);
    c.input.value = "";
    c.synced = "";
    if (had) {
      delete saved[id];
      inst.editChanges = (inst.editChanges || 0) + 1;
      ok = persist();
      refreshAll();
    }
    flash(c, "Reset");
    announce(inst, t.name + (teamUrl(t) ? " now uses the team default." : " has no link set.") + notSavedNote(ok));
    c.input.focus();
  }

  function clearAll(inst) {
    if (!Object.keys(saved).length) return;
    var sure = true;
    try { sure = window.confirm("Remove all the links you set in this browser? Team defaults stay."); } catch (e) { sure = true; }
    if (!sure) return;
    saved = {};
    inst.editChanges = (inst.editChanges || 0) + 1;
    var ok = persist();
    TOOLS.forEach(function (t) {
      var c = inst.cards[t.id];
      if (!c) return;
      clearErr(c);
      c.input.value = "";
      c.synced = "";
    });
    refreshAll();
    announce(inst, "All your links were removed. Team defaults are shown." + notSavedNote(ok));
    inst.editBtn.focus();
  }

  /* "Done": save anything still typed-but-unsaved, then close (or point at errors). */
  function finishEditing(inst) {
    var firstBad = null, changed = 0;
    TOOLS.forEach(function (t) {
      var c = inst.cards[t.id];
      if (!c) return;
      var prev = mineFor(t.id);
      var r = checkUrl(c.input.value);
      if (!r.ok) {
        showErr(c, r.error);
        if (!firstBad) firstBad = c;
        return;
      }
      clearErr(c);
      c.input.value = r.value;
      c.synced = r.value;
      if (r.value !== prev) {
        if (r.value) saved[t.id] = r.value;
        else delete saved[t.id];
        changed++;
      }
    });
    var ok = changed ? persist() : storageOK;
    if (changed) { inst.editChanges = (inst.editChanges || 0) + changed; refreshAll(); }
    if (firstBad) {
      firstBad.input.focus();
      announce(inst, "Check the highlighted link — it can't be saved as it is.");
      return;
    }
    var any = inst.editChanges > 0;
    setEditing(inst, false);
    paintFull(inst);
    /* drop "#edit" so a reload doesn't reopen the editor */
    if ((location.hash || "").toLowerCase() === EDIT_HASH) {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
    }
    announce(inst, (any ? "Your links are saved." : "Done — no changes.") + notSavedNote(ok));
    inst.editBtn.focus();
  }

  /* ---------- public API ---------- */
  function safeEditHref(v) {
    if (typeof v !== "string" || !v.trim()) return DEFAULT_EDIT_HREF;
    /* browsers ignore tabs/newlines/control chars in a scheme ("java\tscript:"), so test without them */
    if (/^(javascript|data|vbscript):/i.test(v.replace(/[\u0000- ]+/g, ""))) return DEFAULT_EDIT_HREF;
    return v.trim();
  }

  function render(el, opts) {
    if (typeof el === "string") el = document.querySelector(el);
    if (!el || el.nodeType !== 1) return null;
    opts = opts || {};
    var mode = String(opts.mode || el.getAttribute("data-kb-launcher") || "compact").toLowerCase() === "full" ? "full" : "compact";
    injectCSS();

    if (el.__kbl) {
      var idx = instances.indexOf(el.__kbl);
      if (idx >= 0) instances.splice(idx, 1);
    }
    var inst = { n: ++uid, root: el, mode: mode, editing: false, cards: {}, editHref: safeEditHref(opts.editHref) };
    el.__kbl = inst;
    el.classList.add("kbl");
    el.classList.remove("kbl-compact", "kbl-full", "is-editing");
    el.classList.add("kbl-" + mode);
    instances.push(inst);

    if (mode === "full") {
      renderFull(inst);
      if (!hashHandled && (location.hash || "").toLowerCase() === EDIT_HASH) {
        hashHandled = true;
        setEditing(inst, true);
        /* wait for the page layout to settle (kb-ui inserts the TOC), then scroll + focus */
        var go = function () { setTimeout(function () { openEdit(inst, null, true); }, 120); };
        if (document.readyState === "complete") go();
        else window.addEventListener("load", go);
      }
    } else {
      renderCompact(inst);
    }
    return el;
  }

  function autoRender() {
    var els = document.querySelectorAll("[data-kb-launcher]");
    for (var i = 0; i < els.length; i++) {
      if (!els[i].__kbl) render(els[i], { mode: els[i].getAttribute("data-kb-launcher") });
    }
  }

  /* ---------- init ---------- */
  probeStorage();
  saved = parseSaved(storageGet());

  window.addEventListener("hashchange", function () {
    if ((location.hash || "").toLowerCase() === EDIT_HASH) openEditOnThisPage(null);
  });

  /* keep several open tabs in sync */
  window.addEventListener("storage", function (e) {
    if (e.key !== null && e.key !== STORE_KEY) return;
    var raw = storageGet();
    if (!storageOK) return;
    saved = parseSaved(raw);
    refreshAll();
  });

  window.KBLauncher = {
    render: render,
    refresh: refreshAll
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoRender);
  else autoRender();
})();
