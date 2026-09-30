/* ═══════════════════════════════════════════════════════════
   Orange Business — Network Knowledge Base
   KB EXPERIENCE LAYER  ·  makes every page feel like a real,
   navigable knowledge base — with zero per-page edits.
   ───────────────────────────────────────────────────────────
   Loaded on every page (bootstrapped by shared.js). Adds:
   • a search bar in every hero            • reading-progress bar
   • an "On this page" TOC + scroll-spy    • back-to-top button
   • deep-linkable section anchors          • code copy buttons
   • responsive tables + mobile nav menu    • reveal-on-scroll
   • an "Updated <date>" stamp in the hero (from page-meta.json)
   All additive & defensive — if this script fails, pages still
   work exactly as before.
═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__kbUI) return;
  window.__kbUI = 1;

  var root = document.documentElement;
  root.classList.add("kb-enh");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var MAG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';

  /* init() is invoked at the very bottom, after all declarations
     and module-scope vars (tocLinks/bar/topBtn/spy) are initialized. */

  /* ---------- search in every hero ---------- */
  function heroSearch() {
    var heroes = document.querySelectorAll(".page-hero, .proc-hero, .sq-hero, .mgr-hero");
    [].forEach.call(heroes, function (hero) {
      if (hero.querySelector(".kb-herosearch")) return;
      var host = hero.querySelector(".hero-content") || hero;
      var b = el("button", "kb-herosearch",
        MAG + '<span>Search the knowledge base…</span><kbd>Ctrl K</kbd>');
      b.type = "button";
      b.setAttribute("aria-label", "Search the knowledge base");
      b.addEventListener("click", function () { if (window.KBSearch) window.KBSearch.open(""); });
      host.appendChild(b);
    });
  }

  /* ---------- themed hero background icons ---------- */
  var ICONS = {
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18",
    wifi:  "M2.5 8.5a15 15 0 0 1 19 0M5.5 12a10 10 0 0 1 13 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01",
    shield:"M12 3l7 3v5c0 4.6-3 7.9-7 9.7-4-1.8-7-5.1-7-9.7V6z",
    lock:  "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
    cloud: "M7 18a4 4 0 0 1 0-8 6 6 0 0 1 11.3 1.6A3.5 3.5 0 0 1 17.5 18z",
    server:"M4 4h16v6H4zM4 14h16v6H4zM7.5 7h.01M7.5 17h.01",
    sw:    "M3 9h18v7H3zM7 9V6M12 9V6M17 9V6M6.5 12.5h.01M9.5 12.5h.01M12.5 12.5h.01",
    nodes: "M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM18 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 8v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8M12 14v-2",
    route: "M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM18 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 6h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h6",
    book:  "M5 4h11a2 2 0 0 1 2 2v12H7a2 2 0 0 0-2 2zM5 18a2 2 0 0 1 2-2h11",
    list:  "M4 6h16M4 12h16M4 18h10",
    chip:  "M7 7h10v10H7zM10 3v2M14 3v2M10 19v2M14 19v2M3 10h2M3 14h2M19 10h2M19 14h2",
    flame: "M12 3c.5 3 3.6 4 3.6 8a3.6 3.6 0 0 1-7.2 0c0-1.8.9-2.9 1.9-3.7.2 1.7 1.7 1.7 1.7 0 0-1.7 0-3 0-4.3z",
    signal:"M4 20a12 12 0 0 1 16 0M8 20a7 7 0 0 1 8 0M12 20h.01",
    check: "M5 4h14v16H5zM8.5 10.5l2.2 2.2L15 8.5M8.5 15.5h7",
    key:   "M9 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 12h8M17 12v3M20 12v3",
    eth:   "M5 8h14v8H5zM8 16v2M12 16v2M16 16v2M8 8V6h8v2"
  };
  var PAGE_ICONS = {
    "lan-wan-basics":     ["globe", "nodes", "server", "wifi"],
    "ip-routing":         ["route", "nodes", "globe", "list"],
    "switching":          ["sw", "eth", "nodes", "server"],
    "wireless":           ["wifi", "signal", "nodes", "wifi"],
    "firewalls":          ["shield", "lock", "flame", "key"],
    "zscaler":            ["cloud", "shield", "lock", "globe"],
    "glossary":           ["book", "list", "globe", "nodes"],
    "devices":            ["server", "chip", "sw", "shield"],
    "cisco":              ["sw", "server", "wifi", "shield"],
    "paloalto":           ["shield", "lock", "cloud", "key"],
    "fortinet":           ["shield", "flame", "lock", "server"],
    "lan-process":        ["check", "nodes", "sw", "wifi"],
    "process-ap":         ["wifi", "check", "signal", "nodes"],
    "process-wlc-switch": ["sw", "check", "server", "eth"],
    "wan-process":        ["globe", "cloud", "route", "check"],
    "option43":           ["wifi", "nodes", "route", "list"],
    "resources":          ["book", "list", "globe", "nodes"],
    "raci":               ["check", "list", "nodes", "key"],
    "checklist":          ["check", "list", "wifi", "globe"],
    "templates":          ["list", "check", "book", "nodes"],
    "tools":              ["key", "server", "list", "nodes"],
    "whats-new":          ["list", "signal", "check", "book"],
    "org-chart":          ["nodes", "globe", "list", "book"]
  };
  function heroDecor() {
    var page = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
    var names = PAGE_ICONS[page];
    if (!names) return;
    var hero = document.querySelector(".page-hero, .proc-hero");
    if (!hero || hero.querySelector(".kb-herobg")) return;
    var bg = el("div", "kb-herobg"); bg.setAttribute("aria-hidden", "true");
    var pos = [{ t: "15%", l: "6%", s: 52 }, { t: "22%", r: "8%", s: 62 }, { b: "16%", l: "15%", s: 46 }, { b: "26%", r: "13%", s: 54 }];
    names.slice(0, 4).forEach(function (nm, i) {
      var d = ICONS[nm]; if (!d) return;
      var p = pos[i] || pos[0];
      var st = "width:" + p.s + "px;height:" + p.s + "px;";
      if (p.t) st += "top:" + p.t + ";"; if (p.b) st += "bottom:" + p.b + ";";
      if (p.l) st += "left:" + p.l + ";"; if (p.r) st += "right:" + p.r + ";";
      bg.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24" style="' + st + '"><path d="' + d + '"/></svg>');
    });
    hero.insertBefore(bg, hero.firstChild);
  }

  /* ---------- heading ids + anchors ---------- */
  function slug(s) {
    return (s || "").toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60) || "section";
  }
  /* visible heading text without decorative (aria-hidden) parts such as emoji */
  function headingText(h) {
    var c = h.cloneNode(true);
    [].forEach.call(c.querySelectorAll("[aria-hidden='true'], .kb-anchor"), function (n) { n.parentNode.removeChild(n); });
    return (c.textContent || "").replace(/\s+/g, " ").trim();
  }
  function anchorsAndHeadings(wrap) {
    if (!wrap) return [];
    /* card titles inside links/buttons (and opted-out blocks) are not sections:
       no nested interactive anchor, and no TOC entry */
    var hs = [].slice.call(wrap.querySelectorAll("h2, h3")).filter(function (h) {
      return !h.closest("a, button, [role='link'], [role='button'], [data-kb-noanchor]");
    });
    var used = {};
    hs.forEach(function (h) {
      var text = headingText(h);
      h.setAttribute("data-kb-title", text);
      var id = h.id;
      if (!id) { id = slug(text); if (used[id]) { var n = 2; while (used[id + "-" + n]) n++; id = id + "-" + n; } h.id = id; }
      used[id] = 1;
      h.classList.add("kb-h");
      /* Mouse convenience only: kept out of the tab order and the accessibility
         tree so it neither adds invisible tab stops nor pollutes the heading's
         name. Keyboard users get the same deep links from the TOC. */
      var a = el("a", "kb-anchor", "#");
      a.href = "#" + id;
      a.tabIndex = -1;
      a.setAttribute("aria-hidden", "true");
      h.appendChild(a);
    });
    return hs;
  }

  /* ---------- "On this page" TOC ---------- */
  var tocLinks = [];
  function buildTOC(wrap, headings) {
    if (!wrap || headings.length < 3) return;
    var toc = el("nav", "kb-toc");
    toc.setAttribute("aria-label", "On this page");
    var head = el("button", "kb-toc-head",
      '<span>On this page</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>');
    head.type = "button";
    var list = el("ol", "kb-toc-list");
    list.id = "kb-toc-list";
    head.setAttribute("aria-controls", list.id);
    headings.forEach(function (h) {
      var li = el("li", "kb-toc-" + h.tagName.toLowerCase());
      var a = el("a", null, "");
      a.href = "#" + h.id;
      a.textContent = h.getAttribute("data-kb-title") || h.textContent;
      a.addEventListener("click", function (e) { e.preventDefault(); go(h); });
      li.appendChild(a);
      list.appendChild(li);
      tocLinks.push({ a: a, h: h });
    });
    toc.appendChild(head); toc.appendChild(list);
    /* collapsed = list hidden from keyboard and AT too (CSS visibility), with the
       state exposed on the toggle */
    function setCollapsed(c) {
      toc.classList.toggle("collapsed", c);
      head.setAttribute("aria-expanded", c ? "false" : "true");
    }
    setCollapsed(window.innerWidth <= 760);
    head.addEventListener("click", function () { setCollapsed(!toc.classList.contains("collapsed")); });
    // insert after the hero-adjacent first block: at top of content wrap
    wrap.insertBefore(toc, wrap.firstChild);
  }
  /* move keyboard focus along with the scroll, so the next Tab continues from
     the chosen section rather than from the control that was activated */
  function focusNoScroll(t) {
    if (!t) return;
    if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
    try { t.focus({ preventScroll: true }); } catch (e) { try { t.focus(); } catch (e2) { /* ignore */ } }
  }
  function go(h) {
    h.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#" + h.id);
    focusNoScroll(h);
  }

  /* ---------- responsive tables ---------- */
  function wrapTables(wrap) {
    if (!wrap) return;
    [].forEach.call(wrap.querySelectorAll("table"), function (t) {
      if (t.closest(".kb-tablewrap")) return;
      var w = el("div", "kb-tablewrap");
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
  }

  /* ---------- code copy buttons ---------- */
  function codeCopy(wrap) {
    if (!wrap) return;
    [].forEach.call(wrap.querySelectorAll(".code-block"), function (cb) {
      if (cb.parentNode.classList.contains("kb-codewrap")) return;
      var w = el("div", "kb-codewrap");
      cb.parentNode.insertBefore(w, cb); w.appendChild(cb);
      var btn = el("button", "kb-copy", "Copy"); btn.type = "button";
      btn.addEventListener("click", function () { copyText(cb.innerText, btn); });
      w.appendChild(btn);
    });
  }
  /* one shared, visually hidden live region for short confirmations */
  var liveEl;
  function announce(msg) {
    if (!liveEl) {
      liveEl = el("div", "kb-sr kb-live");
      liveEl.setAttribute("role", "status");
      liveEl.setAttribute("aria-live", "polite");
      liveEl.setAttribute("aria-atomic", "true");
      document.body.appendChild(liveEl);
    }
    liveEl.textContent = "";
    setTimeout(function () { liveEl.textContent = msg; }, 60);
  }
  window.KBAnnounce = function (msg) { try { announce(String(msg || "")); } catch (e) { /* optional */ } };
  function copyText(txt, btn) {
    function done() { btn.textContent = "Copied!"; btn.classList.add("done"); announce("Code copied to clipboard"); setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1400); }
    function fb() { try { var ta = el("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); } catch (e) {} done(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fb); else fb();
  }

  /* ---------- reveal-on-scroll (below-fold only) ---------- */
  function revealSections(wrap) {
    if (!wrap || reduce || !("IntersectionObserver" in window)) return;
    var vh = window.innerHeight;
    var els = [].slice.call(wrap.querySelectorAll(".section, .device-detail, .phase-block, .migration-intro"));
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("kb-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });
    els.forEach(function (e) {
      var top = e.getBoundingClientRect().top;
      if (top > vh * 0.9) { e.classList.add("kb-reveal"); io.observe(e); }
    });
  }

  /* ---------- reading progress ---------- */
  var bar;
  function progressBar() { bar = el("div", "kb-progress"); document.body.appendChild(bar); }

  /* ---------- back to top ---------- */
  var topBtn;
  function backToTop() {
    topBtn = el("button", "kb-top",
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>');
    topBtn.type = "button";
    topBtn.setAttribute("aria-label", "Back to top");
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      /* keyboard focus goes back to the top as well */
      focusNoScroll(document.querySelector(".kb-main h1, .page-hero h1, .proc-hero h1, .kb-hero h1, h1") || mainEl);
    });
    document.body.appendChild(topBtn);
  }

  /* ---------- landmarks: skip link, main, labelled primary nav, current page ---------- */
  var mainEl = null;
  function landmarks(wrap) {
    var nav = document.querySelector(".topnav");
    if (nav && !nav.hasAttribute("aria-label")) nav.setAttribute("aria-label", "Primary");
    if (nav) {
      var file = currentFile();
      [].forEach.call(nav.querySelectorAll(".topnav-links a[href]"), function (a) {
        /* "page" only for a link to this very page; a highlighted parent section
           (e.g. Devices while on cisco.html) is the current location, not the page */
        if (a.getAttribute("href") === file) a.setAttribute("aria-current", "page");
        else if (a.classList.contains("active")) a.setAttribute("aria-current", "true");
      });
    }
    mainEl = document.querySelector("main, [role='main']");
    if (!mainEl && wrap) {
      mainEl = wrap;
      if (wrap.tagName !== "MAIN") wrap.setAttribute("role", "main");
    }
    if (!mainEl) return;
    if (!mainEl.id) mainEl.id = "main";
    if (!mainEl.hasAttribute("tabindex")) mainEl.setAttribute("tabindex", "-1");
    mainEl.classList.add("kb-main");
    if (document.querySelector(".kb-skip")) return;
    var skip = el("a", "kb-skip", "Skip to main content");
    skip.href = "#" + mainEl.id;
    skip.addEventListener("click", function (e) {
      e.preventDefault();
      mainEl.scrollIntoView({ block: "start" });
      focusNoScroll(mainEl);
    });
    document.body.insertBefore(skip, document.body.firstChild);
  }

  /* ---------- mobile nav ---------- */
  function mobileNav() {
    var nav = document.querySelector(".topnav");
    var links = nav && nav.querySelector(".topnav-links");
    if (!nav || !links || nav.querySelector(".kb-hamburger")) return;
    var btn = el("button", "kb-hamburger",
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>');
    btn.type = "button"; btn.setAttribute("aria-label", "Menu"); btn.setAttribute("aria-expanded", "false");
    var menu = el("nav", "kb-navmenu"); menu.setAttribute("aria-label", "Site");
    menu.id = "kb-navmenu";
    btn.setAttribute("aria-controls", menu.id);
    var file = location.pathname.split("/").pop() || "index.html";
    [].forEach.call(links.querySelectorAll("a[href]"), function (a) {
      var cur = a.getAttribute("href") === file;
      /* the section the page belongs to (e.g. Devices on cisco.html) is marked too */
      var sect = !cur && a.classList.contains("active");
      var m = el("a", cur || sect ? "active" : null, a.textContent);
      m.href = a.getAttribute("href");
      if (cur) m.setAttribute("aria-current", "page");
      else if (sect) m.setAttribute("aria-current", "true");
      m.addEventListener("click", function () { closeMenu(); });
      menu.appendChild(m);
    });
    function isOpen() { return menu.classList.contains("open"); }
    function openMenu(focusFirst) {
      menu.classList.add("open"); btn.setAttribute("aria-expanded", "true");
      if (focusFirst) { var f = menu.querySelector("a"); if (f) f.focus(); }
    }
    function closeMenu(returnFocus) {
      if (!isOpen()) return;
      menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
      if (returnFocus) btn.focus();
    }
    /* e.detail === 0 means keyboard activation: move focus into the menu */
    btn.addEventListener("click", function (e) { e.stopPropagation(); isOpen() ? closeMenu() : openMenu(e.detail === 0); });
    document.addEventListener("click", function (e) { if (isOpen() && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen()) closeMenu(menu.contains(document.activeElement) || document.activeElement === btn); });
    /* close when keyboard focus leaves the toggle + menu pair */
    menu.addEventListener("focusout", function (e) {
      var to = e.relatedTarget;
      if (to && !menu.contains(to) && to !== btn) closeMenu();
    });
    nav.appendChild(btn);
    /* straight after the toggle in the DOM (it is position:fixed, so layout is
       unchanged) so Tab goes from the button into the menu */
    btn.parentNode.insertBefore(menu, btn.nextSibling);
  }

  /* ---------- hash scroll on load ---------- */
  function hashScroll() {
    if (!location.hash) return;
    var t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(function () { t.scrollIntoView(); }, 60);
  }

  /* ---------- "Updated <date> · What's new" stamp in the hero ----------
     Dates come from page-meta.json (written by build-search-index.ps1).
     Optional: if the file, the page entry or the hero is missing, or
     fetch is unavailable, nothing is shown and nothing throws. */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function currentFile() {
    var seg = (location.pathname || "").split("/").pop() || "";
    try { seg = decodeURIComponent(seg); } catch (e) { /* keep it as typed */ }
    return seg || "index.html";
  }
  /* "YYYY-MM-DD" as a LOCAL calendar date (new Date("YYYY-MM-DD") would be UTC) */
  function localDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === "string" ? s.trim() : "");
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1, d = +m[3], dt = new Date(y, mo, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
    return dt;
  }
  function stampHost(hero) {
    if (hero.classList.contains("kb-hero")) return hero.querySelector(".kb-hero-inner") || hero;
    /* squad / manager heroes lay .hero-content out as a row: join the text column */
    if (hero.classList.contains("sq-hero") || hero.classList.contains("mgr-hero")) {
      var h1 = hero.querySelector("h1");
      if (h1 && h1.parentNode) return h1.parentNode;
    }
    return hero.querySelector(".hero-content") || hero;
  }
  function addStamp(hero, file, meta) {
    var pages = meta && meta.pages;
    if (!pages || typeof pages !== "object" || !Object.prototype.hasOwnProperty.call(pages, file)) return;
    var info = pages[file], iso = info && typeof info.updated === "string" ? info.updated.trim() : "";
    var dt = localDate(iso);
    if (!dt || hero.querySelector(".kb-updated")) return;
    var p = el("p", "kb-updated");
    p.appendChild(document.createTextNode("Updated "));
    var t = document.createElement("time");
    t.setAttribute("datetime", iso);
    t.textContent = dt.getDate() + " " + MONTHS[dt.getMonth()] + " " + dt.getFullYear();
    p.appendChild(t);
    if (file !== "whats-new.html") {
      p.appendChild(document.createTextNode(" · "));
      var a = el("a", null, "What's new <span aria-hidden=\"true\">→</span>");
      a.href = "whats-new.html";
      p.appendChild(a);
    }
    stampHost(hero).appendChild(p);
  }
  function updatedStamp() {
    var file = currentFile();
    if (file === "404.html" || document.querySelector(".nf-hero")) return;
    if (!window.fetch) return;
    var hero = document.querySelector(".kb-hero, .page-hero, .proc-hero, .sq-hero, .mgr-hero");
    if (!hero) return;
    try {
      window.fetch("page-meta.json", { cache: "no-cache" })
        .then(function (r) { return r && r.ok ? r.json() : null; })
        .then(function (meta) { try { addStamp(hero, file, meta); } catch (e) { /* optional */ } })
        ["catch"](function () { /* no stamp */ });
    } catch (e) { /* no stamp */ }
  }

  /* ---------- unified scroll handler (progress + back-to-top + scroll-spy) ---------- */
  var spy = [];
  function scrollSpyInit(headings) {
    spy = (headings || []).map(function (h) { return h; });
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var doc = document.documentElement;
        var st = window.pageYOffset || doc.scrollTop;
        var max = (doc.scrollHeight - doc.clientHeight) || 1;
        if (bar) bar.style.width = Math.max(0, Math.min(100, (st / max) * 100)) + "%";
        if (topBtn) topBtn.classList.toggle("show", st > 420);
        if (tocLinks.length) {
          /* Measure each heading's page position now, from its on-screen box.
             offsetTop is relative to the offsetParent, and a section that is
             still waiting to reveal (.kb-reveal carries a transform) becomes
             that offsetParent, so headings inside it reported ~0 and the last
             TOC entry lit up at the top of the page. Hidden headings (e.g.
             filtered out) have an empty box and are skipped. */
          var offset = st + 96, cur = -1;
          for (var i = 0; i < spy.length; i++) {
            var r = spy[i].getBoundingClientRect();
            if (!r.width && !r.height) continue;
            if (r.top + st <= offset) cur = i; else break;
          }
          if (cur < 0) cur = 0;
          for (var j = 0; j < tocLinks.length; j++) tocLinks[j].a.classList.toggle("active", j === cur);
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- styles ---------- */
  function injectCSS() {
    if (document.getElementById("kb-ui-css")) return;
    var s = el("style"); s.id = "kb-ui-css";
    s.textContent = [
      /* hero search */
      ".kb-herosearch{display:inline-flex;align-items:center;gap:10px;margin-top:22px;max-width:460px;width:100%;background:rgba(255,255,255,0.97);border:none;border-radius:11px;padding:12px 15px;cursor:text;box-shadow:0 10px 30px rgba(0,0,0,0.18);transition:transform .15s,box-shadow .15s;text-align:left;font-family:inherit;vertical-align:middle;}",
      ".kb-herosearch:hover{transform:translateY(-1px);box-shadow:0 14px 38px rgba(0,0,0,0.26);}",
      ".kb-herosearch>svg{color:#FF6200;flex-shrink:0;}",
      ".kb-herosearch span{flex:1;min-width:0;color:#616161;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".kb-herosearch kbd{flex-shrink:0;background:#F3F3F3;border:1px solid #E0E0E0;border-radius:5px;color:#616161;font:600 10.5px/1 var(--mono,monospace);padding:5px 7px;}",
      "@media(max-width:600px){.kb-herosearch kbd{display:none;}.kb-herosearch{margin-top:18px;}}",
      /* "Updated … · What's new" stamp: its own dark translucent backing keeps
         white text >= 4.5:1 on every hero, including the orange home hero */
      "html.kb-enh .kb-updated{display:table;max-width:100%;margin:16px auto 0;padding:5px 13px;border-radius:999px;background:rgba(0,0,0,0.38);border:1px solid rgba(255,255,255,0.16);color:#fff;font:400 12.5px/1.5 var(--font,sans-serif);text-align:center;}",
      "html.kb-enh .sq-hero .kb-updated,html.kb-enh .mgr-hero .kb-updated{margin:14px 0 0;}",
      "html.kb-enh .kb-updated time{font-weight:600;}",
      "html.kb-enh .kb-updated a{color:#fff;font-weight:600;text-decoration:underline;text-decoration-color:rgba(255,255,255,0.6);text-underline-offset:2px;}",
      "html.kb-enh .kb-updated a:hover{text-decoration-color:#fff;}",
      "html.kb-enh .kb-updated a:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:3px;}",
      /* heading anchors */
      ".kb-h{scroll-margin-top:80px;}",
      ".kb-anchor{opacity:0;margin-left:8px;color:#B34200;text-decoration:none;font-weight:700;font-size:.82em;transition:opacity .12s;}",
      ".kb-h:hover .kb-anchor{opacity:.75;}",
      ".kb-anchor:hover,.kb-anchor:focus,.kb-anchor:focus-visible{opacity:1;}",
      ".kb-anchor:focus-visible{outline:2px solid #B34200;outline-offset:2px;border-radius:3px;}",
      /* programmatic focus targets (TOC jumps, skip link, back-to-top) */
      ".kb-h[tabindex=\"-1\"]:focus,.kb-main:focus,h1[tabindex=\"-1\"]:focus{outline:none;}",
      /* skip link + shared live region */
      ".kb-skip{position:absolute;left:12px;top:-60px;z-index:10000;background:#1A1A1A;color:#fff !important;font:600 14px/1 var(--font,sans-serif);padding:12px 16px;border-radius:0 0 8px 8px;border:2px solid #FFB27A;border-top:none;text-decoration:none !important;}",
      ".kb-skip:focus{top:0;outline:3px solid #FFB27A;outline-offset:0;}",
      ".kb-sr{position:absolute !important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}",
      /* TOC */
      ".kb-toc{margin:0 0 30px;border:1px solid #E7E7E9;border-radius:12px;background:#FAFAFB;overflow:hidden;}",
      ".kb-toc-head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:none;border:none;padding:13px 18px;cursor:pointer;font:700 11.5px/1 var(--font,sans-serif);letter-spacing:.7px;text-transform:uppercase;color:#555;}",
      ".kb-toc-head svg{transition:transform .2s;color:#B34200;flex-shrink:0;}",
      ".kb-toc.collapsed .kb-toc-head svg{transform:rotate(-90deg);}",
      ".kb-toc-list{list-style:none;margin:0;padding:2px 12px 12px;max-height:60vh;overflow:auto;visibility:visible;transition:max-height .25s ease,padding .25s ease,visibility 0s linear 0s;}",
      /* collapsed: hidden from Tab and screen readers once the close animation ends */
      ".kb-toc.collapsed .kb-toc-list{max-height:0;padding-top:0;padding-bottom:0;visibility:hidden;transition:max-height .25s ease,padding .25s ease,visibility 0s linear .25s;}",
      ".kb-toc-list li{margin:0;}",
      ".kb-toc-list a{display:block;padding:6px 12px;border-left:2px solid transparent;color:#5A5A5A;text-decoration:none;font-size:13px;line-height:1.35;border-radius:0 6px 6px 0;transition:color .12s,background .12s,border-color .12s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".kb-toc-list a:hover{color:#B34200;background:#FFF3EA;}",
      ".kb-toc-list li.kb-toc-h3 a{padding-left:26px;font-size:12.5px;color:#666;}",
      ".kb-toc-list a.active{color:#A33E00;border-left-color:#FF6200;background:#FFF3EA;font-weight:600;}",
      ".kb-toc-list a{text-decoration:none !important;}",
      ".kb-toc-list a:focus-visible{outline:2px solid #B34200;outline-offset:-2px;}",
      "@media(max-width:760px){.kb-toc-list a{white-space:normal;overflow:visible;}}",
      /* tables */
      ".kb-tablewrap{position:relative;overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;min-width:0;margin:0 0 4px;}",
      ".kb-enh .grid-2>*,.kb-enh .grid-3>*,.kb-enh .grid-auto>*{min-width:0;}",
      ".kb-enh .content pre,.kb-enh .content-wide pre,.kb-enh .proc-content pre{max-width:100%;overflow-x:auto;}",
      /* code copy */
      ".kb-codewrap{position:relative;min-width:0;max-width:100%;}",
      ".kb-copy{position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);color:rgba(255,255,255,0.8);font:600 11px/1 var(--font,sans-serif);padding:5px 10px;border-radius:6px;cursor:pointer;opacity:0;transition:opacity .15s,background .15s,color .15s;}",
      ".kb-codewrap:hover .kb-copy,.kb-copy:focus{opacity:1;}",
      ".kb-copy:hover{background:rgba(255,255,255,0.2);color:#fff;}",
      ".kb-copy.done{color:#5DE8AA;border-color:rgba(93,232,170,.4);}",
      "@media(max-width:760px){.kb-copy{opacity:1;}}",
      /* progress + back-to-top */
      ".kb-progress{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,#FF8C42,#FF6200);z-index:250;transition:width .08s linear;pointer-events:none;}",
      ".kb-top{position:fixed;bottom:22px;right:22px;width:44px;height:44px;border-radius:50%;background:#1A1A1A;color:#fff;border:none;box-shadow:0 6px 22px rgba(0,0,0,0.28);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transform:translateY(10px);transition:all .2s;z-index:240;}",
      ".kb-top.show{opacity:1;visibility:visible;transform:none;}",
      ".kb-top:hover{background:#FF6200;}",
      /* reveal */
      ".kb-enh .kb-reveal{opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s ease;}",
      ".kb-enh .kb-reveal.kb-in{opacity:1;transform:none;}",
      /* mobile nav */
      ".kb-hamburger{display:none;align-items:center;justify-content:center;margin-left:10px;flex-shrink:0;width:38px;height:32px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.16);color:#fff;border-radius:8px;cursor:pointer;}",
      ".kb-hamburger:hover{background:rgba(255,255,255,0.15);}",
      ".kb-navmenu{position:fixed;top:58px;left:0;right:0;background:#141414;border-bottom:3px solid #FF6200;display:none;flex-direction:column;padding:8px;z-index:230;box-shadow:0 16px 34px rgba(0,0,0,0.34);max-height:calc(100vh - 58px);overflow-y:auto;}",
      ".kb-navmenu.open{display:flex;}",
      ".kb-navmenu a{color:rgba(255,255,255,0.82);padding:13px 16px;border-radius:9px;text-decoration:none;font-size:15px;font-weight:500;}",
      ".kb-navmenu a:hover,.kb-navmenu a.active{background:rgba(255,98,0,0.16);color:#fff;}",
      /* current page: a non-colour marker (left bar + weight) as well as the tint */
      ".kb-navmenu a.active{box-shadow:inset 4px 0 0 #FF6200;font-weight:700;}",
      ".kb-navmenu a:focus-visible{outline:3px solid #FFB27A;outline-offset:-3px;}",
      "@media(max-width:1024px){html.kb-enh .topnav-links{display:none;}html.kb-enh .kb-hamburger{display:inline-flex;}}",
      "@media(min-width:1025px){.kb-navmenu{display:none !important;}}",
      /* nav crowding on small laptops */
      ".kb-enh .topnav-logo{font-size:11.5px;letter-spacing:0;}",
      "@media(max-width:1280px){.topnav-badge{display:none !important;}.kb-navsearch-t{display:none !important;}.kb-navsearch-k{display:none !important;}.kb-navsearch{padding:6px !important;}}",
      "@media(max-width:1180px) and (min-width:1025px){.topnav{padding:0 18px;}.topnav-links{gap:0;}.nav-link{padding:6px 9px;font-size:12.5px;}}",
      /* centered heroes (like the home page) */
      ".kb-enh .page-hero{text-align:center;}",
      ".kb-enh .page-hero .hero-content{margin-left:auto;margin-right:auto;}",
      ".kb-enh .page-hero .hero-sub{margin-left:auto;margin-right:auto;}",
      ".kb-enh .proc-hero{position:relative;overflow:hidden;}",
      /* themed hero background icons */
      ".kb-herobg{position:absolute;inset:0;pointer-events:none;overflow:hidden;opacity:.14;z-index:0;}",
      ".kb-herobg svg{position:absolute;stroke:#fff;stroke-width:1.4;fill:none;}",
      ".kb-enh .page-hero>:not(.kb-herobg),.kb-enh .proc-hero>:not(.kb-herobg){position:relative;z-index:1;}",
      /* front-panel realism (applies to every vendor port diagram) */
      ".kb-enh .port-diagram-wrap{background:linear-gradient(180deg,#161616,#0c0c0c)!important;box-shadow:0 6px 22px rgba(0,0,0,0.35);border:1px solid #000;}",
      ".kb-enh .port-face{background:linear-gradient(180deg,#272727,#171717)!important;border:1px solid rgba(255,255,255,0.08)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),inset 0 -14px 26px rgba(0,0,0,0.45)!important;}",
      ".kb-enh .p-body{box-shadow:inset 0 0 0 1px rgba(0,0,0,0.35),0 1px 2px rgba(0,0,0,0.45)!important;}",
      ".kb-enh .p-rj45 .p-body{position:relative;border-radius:2px 2px 4px 4px!important;background-image:linear-gradient(180deg,rgba(255,255,255,0.07),transparent 45%)!important;}",
      ".kb-enh .p-rj45 .p-body::after{content:'';position:absolute;left:50%;bottom:-3px;transform:translateX(-50%);width:9px;height:3px;background:currentColor;opacity:.4;border-radius:0 0 2px 2px;}",
      ".kb-enh .p-sfp .p-body,.kb-enh .p-qsfp .p-body{border-radius:2px!important;background-image:linear-gradient(90deg,rgba(255,255,255,0.1),transparent 32%)!important;}"
    ].join("\n");
    document.head.appendChild(s);
  }

  /* ---------- init (after all declarations & module vars) ----------
     Each step is isolated so one failing (e.g. an unexpected page
     structure) never stops the others or throws to the page. */
  function safe(fn, arg, arg2) { try { return fn(arg, arg2); } catch (e) { return undefined; } }
  ready(function () {
    safe(injectCSS);
    safe(heroSearch);
    safe(heroDecor);
    var wrap = document.querySelector(".content, .content-wide, .proc-content");
    safe(landmarks, wrap);
    var headings = safe(anchorsAndHeadings, wrap) || [];
    safe(buildTOC, wrap, headings);
    safe(wrapTables, wrap);
    safe(codeCopy, wrap);
    safe(revealSections, wrap);
    safe(progressBar);
    safe(backToTop);
    safe(mobileNav);
    safe(hashScroll);
    safe(scrollSpyInit, headings);
    safe(updatedStamp);
  });
})();
