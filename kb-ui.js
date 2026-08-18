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

  /* ---------- heading ids + anchors ---------- */
  function slug(s) {
    return (s || "").toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60) || "section";
  }
  function anchorsAndHeadings(wrap) {
    if (!wrap) return [];
    var hs = [].slice.call(wrap.querySelectorAll("h2, h3"));
    var used = {};
    hs.forEach(function (h) {
      var text = (h.textContent || "").trim();
      h.setAttribute("data-kb-title", text);
      var id = h.id;
      if (!id) { id = slug(text); if (used[id]) { var n = 2; while (used[id + "-" + n]) n++; id = id + "-" + n; } h.id = id; }
      used[id] = 1;
      h.classList.add("kb-h");
      var a = el("a", "kb-anchor", "#");
      a.href = "#" + id;
      a.setAttribute("aria-label", "Link to this section");
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
    if (window.innerWidth <= 760) toc.classList.add("collapsed");
    head.addEventListener("click", function () { toc.classList.toggle("collapsed"); });
    // insert after the hero-adjacent first block: at top of content wrap
    wrap.insertBefore(toc, wrap.firstChild);
  }
  function go(h) {
    h.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (history.replaceState) history.replaceState(null, "", "#" + h.id);
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
  function copyText(txt, btn) {
    function done() { btn.textContent = "Copied!"; btn.classList.add("done"); setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1400); }
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
    topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
    document.body.appendChild(topBtn);
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
    var file = location.pathname.split("/").pop() || "index.html";
    [].forEach.call(links.querySelectorAll("a[href]"), function (a) {
      var m = el("a", a.getAttribute("href") === file ? "active" : null, a.textContent);
      m.href = a.getAttribute("href");
      m.addEventListener("click", function () { closeMenu(); });
      menu.appendChild(m);
    });
    function openMenu() { menu.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
    function closeMenu() { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function (e) { e.stopPropagation(); menu.classList.contains("open") ? closeMenu() : openMenu(); });
    document.addEventListener("click", function (e) { if (menu.classList.contains("open") && !menu.contains(e.target) && e.target !== btn) closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    nav.appendChild(btn);
    document.body.appendChild(menu);
  }

  /* ---------- hash scroll on load ---------- */
  function hashScroll() {
    if (!location.hash) return;
    var t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(function () { t.scrollIntoView(); }, 60);
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
          var offset = st + 96, cur = -1;
          for (var i = 0; i < spy.length; i++) { if (spy[i].offsetTop <= offset) cur = i; else break; }
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
      ".kb-herosearch span{flex:1;min-width:0;color:#8A8A8A;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".kb-herosearch kbd{flex-shrink:0;background:#F0F0F0;border:1px solid #E0E0E0;border-radius:5px;color:#999;font:600 10.5px/1 var(--mono,monospace);padding:5px 7px;}",
      "@media(max-width:600px){.kb-herosearch kbd{display:none;}.kb-herosearch{margin-top:18px;}}",
      /* heading anchors */
      ".kb-h{scroll-margin-top:80px;}",
      ".kb-anchor{opacity:0;margin-left:8px;color:#FF6200;text-decoration:none;font-weight:700;font-size:.82em;transition:opacity .12s;}",
      ".kb-h:hover .kb-anchor{opacity:.55;}",
      ".kb-anchor:hover{opacity:1;}",
      /* TOC */
      ".kb-toc{margin:0 0 30px;border:1px solid #E7E7E9;border-radius:12px;background:#FAFAFB;overflow:hidden;}",
      ".kb-toc-head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:none;border:none;padding:13px 18px;cursor:pointer;font:700 11.5px/1 var(--font,sans-serif);letter-spacing:.7px;text-transform:uppercase;color:#555;}",
      ".kb-toc-head svg{transition:transform .2s;color:#FF6200;flex-shrink:0;}",
      ".kb-toc.collapsed .kb-toc-head svg{transform:rotate(-90deg);}",
      ".kb-toc-list{list-style:none;margin:0;padding:2px 12px 12px;max-height:60vh;overflow:auto;transition:max-height .25s ease,padding .25s ease;}",
      ".kb-toc.collapsed .kb-toc-list{max-height:0;padding-top:0;padding-bottom:0;}",
      ".kb-toc-list li{margin:0;}",
      ".kb-toc-list a{display:block;padding:6px 12px;border-left:2px solid transparent;color:#5A5A5A;text-decoration:none;font-size:13px;line-height:1.35;border-radius:0 6px 6px 0;transition:color .12s,background .12s,border-color .12s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".kb-toc-list a:hover{color:#FF6200;background:#FFF3EA;}",
      ".kb-toc-list li.kb-toc-h3 a{padding-left:26px;font-size:12.5px;color:#8A8A8A;}",
      ".kb-toc-list a.active{color:#CC4E00;border-left-color:#FF6200;background:#FFF3EA;font-weight:600;}",
      /* tables */
      ".kb-tablewrap{overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%;min-width:0;margin:0 0 4px;}",
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
      "@media(max-width:820px){html.kb-enh .topnav-links{display:none;}html.kb-enh .kb-hamburger{display:inline-flex;}}",
      "@media(min-width:821px){.kb-navmenu{display:none !important;}}"
    ].join("\n");
    document.head.appendChild(s);
  }

  /* ---------- init (after all declarations & module vars) ---------- */
  ready(function () {
    injectCSS();
    heroSearch();
    var wrap = document.querySelector(".content, .content-wide, .proc-content");
    var headings = anchorsAndHeadings(wrap);
    buildTOC(wrap, headings);
    wrapTables(wrap);
    codeCopy(wrap);
    revealSections(wrap);
    progressBar();
    backToTop();
    mobileNav();
    hashScroll();
    scrollSpyInit(headings);
  });
})();
