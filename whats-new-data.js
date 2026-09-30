/* ═══════════════════════════════════════════════════════════
   DPM Knowledge Base — WHAT'S NEW  (release notes + renderer)
   ───────────────────────────────────────────────────────────
   This one file feeds the "What's new" page (whats-new.html)
   and the short "latest updates" list on the home page.

   HOW TO ADD AN ENTRY
   1. Copy the example below and paste it at the TOP of the
      KB_WHATS_NEW list (newest first). Keep the comma after }.

        {
          date:  '2026-10-15',          // YYYY-MM-DD, the day it went live
          tag:   'New',                 // 'New' | 'Improved' | 'Fixed'
          title: 'Short, plain-English name of the change',
          desc:  'One or two sentences: what changed for a DPM and why it helps.',
          links: [{ href: 'page.html', label: 'Open the page' }]   // or [] for none
        },

   2. Plain text only (no HTML) — everything is escaped when shown.
      Inside '...' strings, write apostrophes as ’ (or \').
   3. Links: relative paths to pages of this site ('raci.html',
      'index.html#tools') or full https:// addresses. Only link
      to pages that exist. The first link is also where the entry
      points to from the home page list.
   4. Entries with the same date are shown together as one release.
   5. Entries 21 days old or newer get a "Recent" dot automatically
      (worked out in each reader's browser from today's date).
   6. Save, commit and push — the page reads this file directly,
      so there is nothing else to rebuild.

   Showing the list somewhere else:
     <div data-kb-whatsnew-latest="5"></div>   (auto-rendered), or
     KBWhatsNew.renderLatest(element, 5) / KBWhatsNew.renderAll(element)
═══════════════════════════════════════════════════════════ */
window.KB_WHATS_NEW = [

  /* ── 30 Sep 2026 ─────────────────────────────────────────── */
  {
    date: '2026-09-30', tag: 'New',
    title: 'Export your checklist to Excel — with a Gantt chart',
    desc: 'One click on “Export to Excel” gives you a workbook for the project: an overview dashboard, every step with a plain-English explanation of what it means and why it matters, a day-by-day Gantt chart built from the team’s MS Project plans, a one-page guide to the service, and the RACI matrix. Change the kick-off date in the workbook and the whole plan moves.',
    links: [{ href: 'checklist.html', label: 'Open the checklists' }]
  },
  {
    date: '2026-09-30', tag: 'Improved',
    title: 'Checklist starts with your project details',
    desc: 'The “Start a new project” form now sits at the top of the page, so you enter the customer, site, kick-off date, target migration date and the people involved first — then the checklist opens straight away.',
    links: [{ href: 'checklist.html', label: 'Open the checklists' }]
  },

  /* ── 29 Sep 2026 ─────────────────────────────────────────── */
  {
    date: '2026-09-29', tag: 'New',
    title: 'Delivery checklists',
    desc: 'Tick off the AP, WLC & Switch and WAN delivery steps as you go. Progress is remembered for each project, so you can pick up where you left off — just as the handbook says: use the process steps as your live checklist on a delivery.',
    links: [{ href: 'checklist.html', label: 'Open the checklists' }]
  },
  {
    date: '2026-09-29', tag: 'New',
    title: 'Email templates — starter drafts',
    desc: 'Copy-ready starter drafts for the emails and meeting invites at each step of an AP, WLC & Switch or WAN delivery — from ordering and staging through migration invites, the partial-migration update and the success notification, to the UAT and HOTO documents. Fill in your project details once and every template updates as you type. These are starter drafts, not the team’s official wording, so check before you send.',
    links: [{ href: 'templates.html', label: 'Browse the templates' }]
  },
  {
    date: '2026-09-29', tag: 'New',
    title: 'Tool launcher',
    desc: 'One page for every system you use on a delivery — GOLD, ServiceNow, MACHX, FLIP, SharePoint, PRIME, Power BI and more. Save your own links once and your browser remembers them.',
    links: [{ href: 'tools.html', label: 'Open the launcher' }]
  },
  {
    date: '2026-09-29', tag: 'New',
    title: 'Org chart',
    desc: 'A visual organisation chart modelled on the handbook’s Management Chart page: who leads what, from Order to Bill down to each regional cluster, with every cluster’s Subject Matter Experts.',
    links: [{ href: 'org-chart.html', label: 'View the org chart' }]
  },
  {
    date: '2026-09-29', tag: 'New',
    title: 'What’s new page',
    desc: 'This page: every change to the Knowledge Base in one place, newest first, with filters for new features, improvements and fixes. The latest few also appear on the home page.',
    links: [{ href: 'whats-new.html', label: 'See all updates' }]
  },
  {
    date: '2026-09-29', tag: 'New',
    title: 'Your daily toolkit on the home page',
    desc: 'The home page now starts with the tools you open every day: one-click links to GOLD, ServiceNow, MACHX, FLIP and the rest (set your own links once and your browser remembers them), plus the Delivery Checklist, Email Templates, Option 43 Calculator and RACI Matrix. The latest updates are listed just below.',
    links: [{ href: 'index.html#toolkit', label: 'Open your toolkit' }]
  },
  {
    date: '2026-09-29', tag: 'Improved',
    title: '“Last updated” dates on every page',
    desc: 'Each page now shows when its content last changed, so you can trust that what you are reading is current. The most recently updated pages are also listed on the What’s new page.',
    links: [{ href: 'whats-new.html#recently-updated', label: 'Recently updated pages' }]
  },
  {
    date: '2026-09-29', tag: 'New',
    title: 'Editing guide for the Onboarding Squad',
    desc: 'A README in the site’s repository explains how to edit pages, where the data lives and how search is rebuilt — so the Onboarding Squad can look after the Knowledge Base.',
    links: []
  },
  {
    date: '2026-09-29', tag: 'Fixed',
    title: 'Search no longer goes out of date',
    desc: 'The search index now rebuilds automatically every time the site is updated. New pages and edits show up in Ctrl K search as soon as the update is published, instead of waiting for someone to run a script by hand.',
    links: []
  },
  {
    date: '2026-09-29', tag: 'Fixed',
    title: 'Back-to-top button works again',
    desc: 'The round arrow button in the bottom-right corner takes you back to the top of the page again, on every page. An old helper script had been silently blocking it.',
    links: []
  },
  {
    date: '2026-09-29', tag: 'Fixed',
    title: '“On this page” highlights the right section',
    desc: 'The “On this page” contents box now highlights the section you are actually reading. Before, it could highlight the last entry while you were still near the top of a long page.',
    links: []
  },
  {
    date: '2026-09-29', tag: 'Improved',
    title: 'Easier to read and use for everyone',
    desc: 'Accessibility pass: stronger colour contrast (including orange text on white), clearly visible keyboard focus, and proper labels on buttons and form fields for screen-reader users.',
    links: []
  },
  {
    date: '2026-09-29', tag: 'Improved',
    title: 'Friendlier “page not found” page',
    desc: 'Old or mistyped links now land on a helpful page where you can search the Knowledge Base or pick from suggested pages, instead of a bare error.',
    links: []
  },
  {
    date: '2026-09-29', tag: 'Improved',
    title: 'RACI page header matches the rest of the site',
    desc: 'The RACI matrix page now has the same subtle themed background icons in its header as every other page.',
    links: [{ href: 'raci.html', label: 'Open the RACI matrix' }]
  },

  /* ── 4 Sep 2026 ──────────────────────────────────────────── */
  {
    date: '2026-09-04', tag: 'New',
    title: 'RACI matrix page',
    desc: 'The full RACI matrix from the handbook on its own page: 16 delivery activities across 7 roles (DPM, PM, SC, VPO/TIM, FE, Supply Chain, Customer), colour-coded with a legend, role definitions and the DPM golden rule. Every activity has exactly one Accountable owner.',
    links: [{ href: 'raci.html', label: 'Open the RACI matrix' }]
  },

  /* ── 2 Sep 2026 ──────────────────────────────────────────── */
  {
    date: '2026-09-02', tag: 'Improved',
    title: 'Home page now follows the Onboarding Handbook',
    desc: 'The home page mirrors the DPM Onboarding Handbook (Ed. 1.3) end to end — the role, the team, the squads, tools, the delivery process, networking basics, vendor hardware, your first weeks and key terms — with a quick-jump bar to each part.',
    links: [{ href: 'index.html', label: 'Go to the home page' }]
  },
  {
    date: '2026-09-02', tag: 'New',
    title: 'What a DPM is, in a nutshell',
    desc: 'The role and its four core responsibilities, what good looks like, the RACI roles legend and the DPM golden rule — the best place to start on day one.',
    links: [{ href: 'index.html#what-is-dpm', label: 'Read the overview' }]
  },
  {
    date: '2026-09-02', tag: 'New',
    title: 'Tools & Systems overview',
    desc: 'What GOLD, ServiceNow, MACHX, FLIP, DNAC, SALTO, SharePoint, PRIME, Power BI and Power Automate are each used for, plus a quick mental model of how they fit together.',
    links: [{ href: 'index.html#tools', label: 'See the tools' }]
  },
  {
    date: '2026-09-02', tag: 'Improved',
    title: 'Delivery process at a glance',
    desc: 'The three delivery phases, the key differences between the LAN AP and WLC/Switch processes, and a note on WAN — with links into the full process guides.',
    links: [{ href: 'index.html#processes', label: 'See the delivery process' }]
  },
  {
    date: '2026-09-02', tag: 'New',
    title: 'Your First Few Weeks checklist',
    desc: 'What to do and learn in your first weeks as a DPM, plus key terms and where to get help when you are stuck.',
    links: [{ href: 'index.html#first-weeks', label: 'See your first weeks' }]
  },
  {
    date: '2026-09-02', tag: 'New',
    title: 'Download the Onboarding Handbook (PDF)',
    desc: 'The complete DPM Onboarding Handbook (Ed. 1.3) can now be downloaded from the home page to read offline.',
    links: [{ href: 'DPM-Onboarding-Handbook.pdf', label: 'Download the PDF' }]
  },
  {
    date: '2026-09-02', tag: 'New',
    title: 'Resources page',
    desc: 'Over 20 hand-picked external links: free training (Professor Messer, Cisco Skills for All, Palo Alto Beacon, Fortinet NSE, Zscaler Academy), vendor documentation, standards, and everyday tools such as Wireshark and ipcalc.',
    links: [{ href: 'resources.html', label: 'Browse the resources' }]
  },
  {
    date: '2026-09-02', tag: 'Improved',
    title: 'A site icon for your browser tab',
    desc: 'An orange open-book icon makes the Knowledge Base easy to spot among your tabs and bookmarks.',
    links: []
  },

  /* ── 18 Aug 2026 ─────────────────────────────────────────── */
  {
    date: '2026-08-18', tag: 'New',
    title: 'Search the whole Knowledge Base',
    desc: 'Press Ctrl K (or /) on any page, or use the Search button in the top bar, to search every page and every glossary term. Type a term such as “HOTO” and its definition comes up straight away.',
    links: []
  },
  {
    date: '2026-08-18', tag: 'New',
    title: 'Option 43 calculator',
    desc: 'Generate the DHCP Option 43 hex string for WLC discovery — Cisco WLC, Ruckus ZoneDirector and Ruckus SmartZone — with IP address checks, a byte-by-byte breakdown and one-click copy.',
    links: [
      { href: 'option43.html', label: 'Open the calculator' },
      { href: 'process-ap.html', label: 'AP migration process' }
    ]
  },
  {
    date: '2026-08-18', tag: 'Improved',
    title: 'Team and squads front and centre',
    desc: 'The home page now leads with the team: a card for each department with its manager, region and SMEs, a leadership strip, and a one-line “what they do” for every squad.',
    links: [
      { href: 'index.html#team', label: 'Meet the team' },
      { href: 'index.html#squads', label: 'The squads' }
    ]
  },
  {
    date: '2026-08-18', tag: 'Improved',
    title: 'Help-centre style home page',
    desc: 'A “How can we help?” search sits at the top of the home page, with popular searches such as AP Process, Option 43 and MACHX one click away.',
    links: [{ href: 'index.html', label: 'Go to the home page' }]
  },
  {
    date: '2026-08-18', tag: 'New',
    title: 'Easier to find your way around long pages',
    desc: 'An “On this page” contents box that follows you as you scroll, a reading-progress bar, a back-to-top button, and a link on every heading so you can share a direct link to a section.',
    links: []
  },
  {
    date: '2026-08-18', tag: 'Improved',
    title: 'Works on phones and tablets',
    desc: 'A proper menu button on small screens, wide tables that scroll sideways instead of breaking the page, and copy buttons on command examples.',
    links: []
  },
  {
    date: '2026-08-18', tag: 'Improved',
    title: 'Vendor device guides refreshed',
    desc: 'Current software for each vendor (Cisco IOS XE 17.18 with 17.15 as extended support, NX-OS 10.x and Secure Firewall FTD 7.x; Palo Alto PAN-OS 11.1 / 12.x; Fortinet FortiOS 7.6 with 7.4 LTS) and current models: Catalyst 8300 / 8500 routers, Secure Firewall 1220 / 3105, ASA 5506-X marked legacy, FortiGate 600E replaced by 600F.',
    links: [
      { href: 'cisco.html', label: 'Cisco' },
      { href: 'paloalto.html', label: 'Palo Alto' },
      { href: 'fortinet.html', label: 'Fortinet' }
    ]
  },
  {
    date: '2026-08-18', tag: 'Improved',
    title: 'More realistic front-panel diagrams',
    desc: 'Port diagrams on every vendor page now look closer to the real hardware — chassis depth, RJ45 tabs and SFP cages — so ports are easier to recognise on site.',
    links: [{ href: 'devices.html', label: 'Device guides' }]
  },
  {
    date: '2026-08-18', tag: 'Fixed',
    title: 'FortiGate high-end port details corrected',
    desc: 'The high-end FortiGate description wrongly said it had no copper ports. It now matches the spec: 16 × GE RJ45 alongside 8 × 10G SFP+.',
    links: [{ href: 'fortinet.html', label: 'Fortinet guide' }]
  },
  {
    date: '2026-08-18', tag: 'Fixed',
    title: 'Top menu fits on small laptops',
    desc: 'The top menu no longer overflows on smaller laptop screens: it switches to a menu button up to 1024px wide and tightens up just above that, so all nine links fit.',
    links: []
  },
  {
    date: '2026-08-18', tag: 'Improved',
    title: 'Now called the DPM Knowledge Base',
    desc: 'A clearer name across the menu, page titles and footers. Mentions of Orange Business in the content itself are unchanged.',
    links: []
  },
  {
    date: '2026-08-18', tag: 'Improved',
    title: 'Themed page headers',
    desc: 'Page titles are centred, with faint background icons that match each topic — routing, Wi-Fi, security, cloud, checklists and more.',
    links: []
  },

  /* ── 4 Aug 2026 ──────────────────────────────────────────── */
  {
    date: '2026-08-04', tag: 'New',
    title: '15 delivery terms added to the Glossary',
    desc: 'Including VPO, GOLD, SALTO, MACHX, FLIP, HOTO, Option 43, DMARC, NTU, CAB and SAT — the words you will hear in your first delivery calls.',
    links: [{ href: 'glossary.html', label: 'Open the Glossary' }]
  },
  {
    date: '2026-08-04', tag: 'Improved',
    title: 'Palo Alto and Fortinet line-ups brought up to date',
    desc: 'The Palo Alto guide now shows the current PA-3400, PA-5400 and PA-7500 series, and FortiWLC is flagged as a legacy product line.',
    links: [
      { href: 'paloalto.html', label: 'Palo Alto' },
      { href: 'fortinet.html', label: 'Fortinet' }
    ]
  },
  {
    date: '2026-08-04', tag: 'Improved',
    title: 'Leadership updated',
    desc: 'The team structure now shows the current Head of Order to Bill.',
    links: [{ href: 'index.html#team', label: 'The team' }]
  },
  {
    date: '2026-08-04', tag: 'Fixed',
    title: '“VPO” used consistently',
    desc: 'Leftover mentions of the old name “TIM” on the home page and the LAN process page now say “VPO”, matching how the team talks today.',
    links: [{ href: 'lan-process.html', label: 'LAN process' }]
  },

  /* ── 3 Aug 2026 ──────────────────────────────────────────── */
  {
    date: '2026-08-03', tag: 'Fixed',
    title: 'Squad and glossary additions save to the right place',
    desc: 'Adding a DPM to a squad or a term to the Glossary now saves to this Knowledge Base, so everyone sees the addition.',
    links: [{ href: 'glossary.html', label: 'Glossary' }]
  },
  {
    date: '2026-08-03', tag: 'New',
    title: 'The DPM Knowledge Base goes live',
    desc: 'One place for everything a new Delivery Project Manager needs: the onboarding hub, networking topics, vendor guides, the team and squad directories, the delivery process guides and a glossary.',
    links: [{ href: 'index.html', label: 'Go to the home page' }]
  },
  {
    date: '2026-08-03', tag: 'New',
    title: 'Delivery process guides',
    desc: 'Step-by-step AP migration, WLC & Switch migration and WAN delivery processes, built from real project plans.',
    links: [
      { href: 'process-ap.html', label: 'AP migration' },
      { href: 'process-wlc-switch.html', label: 'WLC & Switch' },
      { href: 'wan-process.html', label: 'WAN delivery' }
    ]
  },
  {
    date: '2026-08-03', tag: 'New',
    title: 'Networking topics explained',
    desc: 'LAN & WAN basics, IP routing, switching, wireless, firewalls and Zscaler — written for DPMs, no networking background needed.',
    links: [
      { href: 'lan-wan-basics.html', label: 'Start with LAN / WAN' },
      { href: 'wireless.html', label: 'Wireless' }
    ]
  },
  {
    date: '2026-08-03', tag: 'New',
    title: 'Vendor guides',
    desc: 'Cisco, Palo Alto Networks and Fortinet — the hardware you will meet on deliveries, with front-panel port diagrams and model specs.',
    links: [{ href: 'devices.html', label: 'Device guides' }]
  },
  {
    date: '2026-08-03', tag: 'New',
    title: 'Team and squad directories',
    desc: 'A page for each department manager and each squad (Onboarding, Hiring, Pre-Sales, Marketing, Automation). Squad members can be added straight from the page in Editor mode.',
    links: [{ href: 'onboarding-squad.html', label: 'Onboarding Squad' }]
  },
  {
    date: '2026-08-03', tag: 'New',
    title: 'Glossary',
    desc: 'An A–Z of the networking and delivery terms you will meet, with new terms addable in Editor mode.',
    links: [{ href: 'glossary.html', label: 'Open the Glossary' }]
  }
];


/* ═══════════════════════════════════════════════════════════
   Renderer — no need to edit below this line.
   window.KBWhatsNew.renderLatest(el, n)  compact list (home page)
   window.KBWhatsNew.renderAll(el)        filterable timeline
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TAGS = {
    'new':      'New',
    'improved': 'Improved',
    'fixed':    'Fixed'
  };
  var TAG_ORDER = ['new', 'improved', 'fixed'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var RECENT_DAYS = 21;
  var PAGE = 'whats-new.html';

  /* ---------- helpers ---------- */
  function str(v) { return v == null ? '' : String(v); }
  function esc(s) {
    return str(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(s).trim());
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1, d = +m[3];
    var dt = new Date(y, mo, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
    return dt;
  }
  function fmtDate(dt) { return dt.getDate() + ' ' + MON[dt.getMonth()] + ' ' + dt.getFullYear(); }
  function ageDays(dt) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((today.getTime() - dt.getTime()) / 86400000);
  }
  function slug(s) {
    return str(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '') || 'entry';
  }
  function isExternal(h) { return /^https?:\/\//i.test(h); }
  /* Only relative links inside the site, or http(s) addresses. */
  function safeHref(h) {
    h = str(h).trim();
    if (!h) return '';
    if (/[\x00-\x20\x7F]/.test(h)) return '';   /* no spaces or control characters */
    if (isExternal(h)) return h;
    if (/^[a-z][a-z0-9+.\-]*:/i.test(h) || /^[\/\\]{2}/.test(h)) return '';
    return h;
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* ---------- clean, validated, newest-first entries ---------- */
  function entries() {
    var src = window.KB_WHATS_NEW, out = [], used = {};
    if (!src || typeof src.length !== 'number') src = [];
    for (var i = 0; i < src.length; i++) {
      var e = src[i];
      if (!e || typeof e !== 'object') continue;
      var dt = parseDate(e.date);
      var title = str(e.title).trim();
      if (!dt || !title) continue;
      var tag = str(e.tag).trim().toLowerCase();
      if (!TAGS.hasOwnProperty(tag)) tag = 'improved';
      var links = [];
      var raw = (e.links && typeof e.links.length === 'number') ? e.links : [];
      for (var j = 0; j < raw.length; j++) {
        var l = raw[j];
        if (!l || typeof l !== 'object') continue;
        var href = safeHref(l.href);
        if (!href) continue;
        links.push({ href: href, label: str(l.label).trim() || href, ext: isExternal(href) });
      }
      var date = str(e.date).trim();
      var id = 'wn-' + date + '-' + slug(title);
      if (used[id]) { var n = 2; while (used[id + '-' + n]) n++; id = id + '-' + n; }
      used[id] = 1;
      var age = ageDays(dt);
      out.push({
        i: i, date: date, dt: dt, tag: tag, title: title,
        desc: str(e.desc).trim(), links: links, id: id,
        recent: age <= RECENT_DAYS
      });
    }
    out.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.i - b.i;
    });
    return out;
  }

  /* ---------- shared bits of markup ---------- */
  function tagPill(tag) {
    return '<span class="wn-tag wn-tag-' + tag + '">' + esc(TAGS[tag]) + '</span>';
  }
  function recentMark() {
    return '<span class="wn-recent" title="Added in the last ' + RECENT_DAYS + ' days">' +
             '<span class="wn-dot" aria-hidden="true"></span>Recent</span>';
  }
  function linkOpen(href, ext, cls) {
    return '<a class="' + cls + '" href="' + esc(href) + '"' +
           (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>';
  }
  var NEW_TAB = '<span class="wn-sr"> (opens in a new tab)</span>';

  /* ---------- compact list (home page) ---------- */
  function renderLatest(el, n) {
    if (!el) return;
    injectCSS();
    n = parseInt(n, 10);
    if (!(n > 0)) n = 5;
    var list = entries().slice(0, n);
    var h = '<div class="wnl">';
    if (!list.length) {
      h += '<p class="wnl-empty">No updates have been logged yet.</p>';
    } else {
      h += '<ul class="wnl-list">';
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        var first = e.links[0];
        var href = first ? first.href : PAGE + '#' + e.id;
        var ext = first ? first.ext : false;
        h += '<li class="wnl-row">' + linkOpen(href, ext, 'wnl-link') +
               '<time class="wnl-date" datetime="' + esc(e.date) + '">' + esc(fmtDate(e.dt)) + '</time>' +
               tagPill(e.tag) +
               (e.recent ? recentMark() : '') +
               '<span class="wnl-title">' + esc(e.title) + '</span>' +
               (ext ? NEW_TAB : '') +
             '</a></li>';
      }
      h += '</ul>';
    }
    h += '<a class="wnl-all" href="' + PAGE + '">See all updates <span aria-hidden="true">→</span></a>';
    h += '</div>';
    el.innerHTML = h;
    el.setAttribute('data-wn-rendered', '1');
  }

  /* ---------- full timeline (What's new page) ---------- */
  function itemHTML(e) {
    var h = '<li class="wn-item" id="' + esc(e.id) + '" data-tag="' + e.tag + '">' +
              '<div class="wn-meta">' + tagPill(e.tag) + (e.recent ? recentMark() : '') + '</div>' +
              '<h4 class="wn-title">' + esc(e.title) + '</h4>';
    if (e.desc) h += '<p class="wn-desc">' + esc(e.desc) + '</p>';
    if (e.links.length) {
      h += '<p class="wn-links">';
      for (var j = 0; j < e.links.length; j++) {
        var l = e.links[j];
        h += linkOpen(l.href, l.ext, 'wn-link') + esc(l.label) +
             (l.ext ? NEW_TAB + ' <span aria-hidden="true">↗</span>' : ' <span aria-hidden="true">→</span>') +
             '</a>';
      }
      h += '</p>';
    }
    return h + '</li>';
  }

  function renderAll(el) {
    if (!el) return;
    injectCSS();
    var list = entries();
    if (!list.length) {
      el.innerHTML = '<div class="wn"><p class="wn-none">No updates have been logged yet.</p></div>';
      el.setAttribute('data-wn-rendered', '1');
      return;
    }
    var counts = { all: list.length, 'new': 0, improved: 0, fixed: 0 };
    var i;
    for (i = 0; i < list.length; i++) counts[list[i].tag]++;

    var h = '<div class="wn">';
    h += '<div class="wn-filter" role="group" aria-label="Filter updates by type">';
    var chips = [['all', 'All']];
    for (i = 0; i < TAG_ORDER.length; i++) chips.push([TAG_ORDER[i], TAGS[TAG_ORDER[i]]]);
    for (i = 0; i < chips.length; i++) {
      var k = chips[i][0];
      h += '<button type="button" class="wn-chip wn-chip-' + k + '" data-f="' + k + '" aria-pressed="' + (k === 'all' ? 'true' : 'false') + '">' +
             esc(chips[i][1]) + ' <span class="wn-chip-n">' + counts[k] + '</span></button>';
    }
    h += '</div>';
    h += '<p class="wn-status" role="status" aria-live="polite"></p>';
    h += '<div class="wn-months">';
    var curMonth = '', curDate = '';
    for (i = 0; i < list.length; i++) {
      var e = list[i], mk = e.date.slice(0, 7);
      if (mk !== curMonth) {
        if (curMonth) h += '</ul></div></section>';
        curMonth = mk; curDate = '';
        h += '<section class="wn-month" data-month="' + mk + '">' +
               '<div class="wn-month-head">' +
                 '<h3 class="wn-month-h" id="wn-' + mk + '">' + esc(MONTH[e.dt.getMonth()] + ' ' + e.dt.getFullYear()) + '</h3>' +
                 '<span class="wn-month-n"></span>' +
               '</div>';
      }
      if (e.date !== curDate) {
        if (curDate) h += '</ul></div>';
        curDate = e.date;
        h += '<div class="wn-day' + (e.recent ? ' is-recent' : '') + '" data-date="' + e.date + '">' +
               '<div class="wn-day-h"><time datetime="' + e.date + '">' + esc(fmtDate(e.dt)) + '</time></div>' +
               '<ul class="wn-list">';
      }
      h += itemHTML(e);
    }
    h += '</ul></div></section>';
    h += '</div>';
    h += '<p class="wn-none" hidden>No updates of this type yet.</p>';
    h += '</div>';

    el.innerHTML = h;
    el.setAttribute('data-wn-rendered', '1');
    wireFilter(el, counts);
  }

  /* Filtering only shows/hides the rendered items (no re-render), so the
     "On this page" links built by kb-ui.js keep pointing at live headings. */
  function wireFilter(root, counts) {
    var chips = root.querySelectorAll('.wn-chip');
    var items = root.querySelectorAll('.wn-item');
    var days = root.querySelectorAll('.wn-day');
    var months = root.querySelectorAll('.wn-month');
    var status = root.querySelector('.wn-status');
    var none = root.querySelector('p.wn-none[hidden]');
    var i;

    function apply(f) {
      var shown = 0;
      for (i = 0; i < items.length; i++) {
        var ok = f === 'all' || items[i].getAttribute('data-tag') === f;
        items[i].hidden = !ok;
        if (ok) shown++;
      }
      for (i = 0; i < days.length; i++) {
        days[i].hidden = !days[i].querySelector('.wn-item:not([hidden])');
      }
      for (i = 0; i < months.length; i++) {
        var n = months[i].querySelectorAll('.wn-item:not([hidden])').length;
        months[i].hidden = n === 0;
        var c = months[i].querySelector('.wn-month-n');
        if (c) c.textContent = plural(n, 'update', 'updates');
      }
      for (i = 0; i < chips.length; i++) {
        chips[i].setAttribute('aria-pressed', chips[i].getAttribute('data-f') === f ? 'true' : 'false');
      }
      if (none) none.hidden = shown > 0;
      if (status) {
        status.textContent = f === 'all'
          ? 'Showing all ' + plural(counts.all, 'update', 'updates') + ', newest first.'
          : 'Showing ' + shown + ' “' + TAGS[f] + '” ' + (shown === 1 ? 'update' : 'updates') + ' of ' + counts.all + '.';
      }
    }

    for (i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function () {
        var f = this.getAttribute('data-f');
        if (f !== 'all' && !TAGS.hasOwnProperty(f)) f = 'all';
        apply(f);
      });
    }
    apply('all');
  }

  /* ---------- scoped styles (injected once) ---------- */
  function injectCSS() {
    if (document.getElementById('kb-whatsnew-css')) return;
    var s = document.createElement('style');
    s.id = 'kb-whatsnew-css';
    s.textContent = [
      '.wn [hidden],.wnl [hidden]{display:none !important;}',
      '.wn-sr{position:absolute !important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}',
      /* tag pills + recent dot (text colours meet WCAG AA on their backgrounds) */
      '.wn-tag{display:inline-block;flex-shrink:0;font:700 10.5px/1.3 var(--font,sans-serif);letter-spacing:.5px;text-transform:uppercase;padding:3px 9px;border-radius:20px;white-space:nowrap;border:1px solid transparent;}',
      '.wn-tag-new{background:#E6F7F1;color:#0A7A4A;border-color:#BFE8D6;}',
      '.wn-tag-improved{background:#E8F6FD;color:#0B6A93;border-color:#BEE3F5;}',
      '.wn-tag-fixed{background:#F3EEFF;color:#6D28D9;border-color:#DDD0FB;}',
      '.wn-recent{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;font:700 11px/1.3 var(--font,sans-serif);color:#B34200;white-space:nowrap;}',
      '.wn-dot{width:8px;height:8px;border-radius:50%;background:#FF6200;box-shadow:0 0 0 3px rgba(255,98,0,0.2);flex-shrink:0;}',
      /* compact list */
      '.wnl{background:#fff;border:1px solid #E6E6E6;border-radius:14px;overflow:hidden;}',
      '.wnl-list{list-style:none;margin:0;padding:0;}',
      '.wnl-row+.wnl-row{border-top:1px solid #F0F0F0;}',
      '.wnl-link{display:flex;align-items:center;flex-wrap:wrap;gap:6px 12px;padding:12px 18px;color:#1A1A1A;text-decoration:none !important;transition:background .15s;}',
      '.wnl-link:hover{background:#FFF8F3;}',
      '.wnl-date{flex-shrink:0;min-width:92px;font:500 12px/1.4 var(--mono,monospace);color:#5E5E5E;}',
      '.wnl-title{flex:1 1 180px;min-width:0;font-size:14px;font-weight:600;line-height:1.4;overflow-wrap:break-word;word-wrap:break-word;}',
      '.wnl-link:hover .wnl-title{color:#B34200;}',
      '.wnl-all{display:flex;align-items:center;gap:6px;padding:12px 18px;border-top:1px solid #F0F0F0;background:#FAFAFA;font-size:13px;font-weight:700;color:#B34200;}',
      '.wnl-all:hover{background:#FFF8F3;}',
      '.wnl-empty{margin:0;padding:16px 18px;font-size:13.5px;color:#5E5E5E;}',
      /* filter chips */
      '.wn-filter{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px;}',
      '.wn-chip{display:inline-flex;align-items:center;gap:8px;font:600 13px/1 var(--font,sans-serif);color:#3D3D3D;background:#fff;border:1.5px solid #D4D4D4;border-radius:20px;padding:8px 14px;cursor:pointer;transition:border-color .15s,background .15s,color .15s;}',
      '.wn-chip:hover{border-color:#FF6200;color:#B34200;}',
      '.wn-chip[aria-pressed="true"]{background:#1A1A1A;border-color:#1A1A1A;color:#fff;}',
      '.wn-chip-n{font:600 11px/1 var(--mono,monospace);background:rgba(0,0,0,0.07);border-radius:10px;padding:3px 7px;}',
      '.wn-chip[aria-pressed="true"] .wn-chip-n{background:rgba(255,255,255,0.2);}',
      '.wn-chip:focus-visible,.wn-link:focus-visible,.wnl-link:focus-visible,.wnl-all:focus-visible{outline:3px solid #B34200;outline-offset:2px;}',
      '.wn-status{font-size:12.5px;color:#5E5E5E;margin:0 0 24px;}',
      '.wn-none{font-size:14px;color:#5E5E5E;background:#FAFAFA;border:1px dashed #D4D4D4;border-radius:12px;padding:18px 20px;margin:0;}',
      /* months + day groups on a timeline rail */
      '.wn-month{margin:0 0 32px;}',
      '.wn-month-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 12px;margin:0 0 14px;}',
      '.wn-month-h{font-size:18px;font-weight:700;color:#1A1A1A;margin:0;}',
      '.wn-month-n{font-size:12px;font-weight:600;color:#5E5E5E;}',
      '.wn-day{position:relative;margin-left:7px;padding:0 0 8px 26px;border-left:2px solid #E8E8E8;min-width:0;}',
      '.wn-day-h{position:relative;margin:0 0 10px;font:700 12.5px/1.4 var(--mono,monospace);color:#3D3D3D;}',
      '.wn-day-h::before{content:"";position:absolute;left:-34px;top:50%;margin-top:-7px;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #BDBDBD;}',
      '.wn-day.is-recent .wn-day-h::before{border-color:#FF6200;background:#FFF0E6;}',
      '.wn-list{list-style:none;margin:0;padding:0;}',
      '.wn-item{min-width:0;background:#fff;border:1px solid #E6E6E6;border-radius:12px;padding:14px 18px;margin:0 0 12px;scroll-margin-top:84px;transition:border-color .2s,box-shadow .2s;}',
      '.wn-item:hover{border-color:rgba(255,98,0,0.35);box-shadow:0 6px 20px rgba(0,0,0,0.06);}',
      '.wn-item:target{border-color:#FF6200;box-shadow:0 0 0 3px rgba(255,98,0,0.2);}',
      '.wn-meta{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;margin:0 0 7px;}',
      '.wn-title{font-size:15.5px;font-weight:700;line-height:1.35;color:#1A1A1A;margin:0 0 4px;overflow-wrap:break-word;word-wrap:break-word;}',
      '.wn-desc{font-size:13.5px;line-height:1.65;color:#474747;margin:0;overflow-wrap:break-word;word-wrap:break-word;}',
      '.wn-links{display:flex;flex-wrap:wrap;gap:6px 18px;margin:10px 0 0;}',
      '.wn-link{font-size:13px;font-weight:700;color:#B34200;overflow-wrap:break-word;word-wrap:break-word;min-width:0;}',
      '@media(max-width:560px){.wn-day{margin-left:5px;padding-left:18px;}.wn-day-h::before{left:-26px;}.wn-item{padding:13px 14px;}.wnl-link,.wnl-all{padding-left:14px;padding-right:14px;}}',
      '@media(prefers-reduced-motion:reduce){.wn-item,.wn-chip,.wnl-link{transition:none;}}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  window.KBWhatsNew = {
    renderLatest: renderLatest,
    renderAll: renderAll,
    formatDate: function (s) { var d = parseDate(s); return d ? fmtDate(d) : ''; }
  };

  /* ---------- auto-render [data-kb-whatsnew-latest="5"] / [data-kb-whatsnew-all] ---------- */
  function autoInit() {
    var i, els = document.querySelectorAll('[data-kb-whatsnew-latest]');
    for (i = 0; i < els.length; i++) {
      if (!els[i].getAttribute('data-wn-rendered')) renderLatest(els[i], els[i].getAttribute('data-kb-whatsnew-latest'));
    }
    els = document.querySelectorAll('[data-kb-whatsnew-all]');
    for (i = 0; i < els.length; i++) {
      if (!els[i].getAttribute('data-wn-rendered')) renderAll(els[i]);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();
})();
