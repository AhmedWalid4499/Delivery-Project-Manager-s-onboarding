/* ═══════════════════════════════════════════════════════════════════════
   KBPanels — data-driven front/rear panel renderer (ES5, no dependencies)
   ───────────────────────────────────────────────────────────────────────
   Usage in a page (before shared.js):
     <script src="panel-data.js"></script><script src="panels.js"></script>
     <div class="port-diagram-wrap" data-panel="cisco-c9300-48p"></div>

   On DOM ready every [data-panel="<id>"] is filled with:
     • a title bar (model · form factor · Front/Rear tabs when >1 face)
     • each face as a chassis strip: port blocks left → right in datasheet
       order; 2-row blocks are a real grid (odd numbers top, even bottom, in
       groups of groupOf with a gap and a "1–12" label); SFP/QSFP cages,
       dashed module slots, mgmt/console/USB shapes, PSU bays, fans, LEDs,
       antennas. Every port has a title tooltip + aria-label
       ("Gi1/0/17 · 1G PoE+ RJ45 — 48× …").
     • a legend (only the kinds present), the source link, a confidence
       badge when not "high", and the data "note".
   The strip scrolls horizontally inside its own container on narrow
   screens (never the page). Missing data renders a small note, never throws.
   Public API: window.KBPanels.renderAll(), .render(el, id), .refresh()
   ═══════════════════════════════════════════════════════════════════════ */
(function (root, doc) {
  'use strict';
  if (!doc) { return; }

  /* ── colour semantics (shared with the old hand-drawn panels) ────────
     blue = copper Ethernet, teal = PoE copper, orange = SFP/fibre,
     yellow = SFP28, magenta = QSFP, green = mgmt, purple = console,
     grey = USB, lime = power, red = HA, amber = WAN, Fortinet red = FortiLink.
     All ≥ 3:1 against the dark chassis (#1c1e22). */
  var COLORS = {
    eth: '#4A9EFF', poe: '#00E5CC', sfp: '#FF8C42', sfp28: '#FFD700',
    qsfp: '#DA70D6', mgmt: '#00CC6A', console: '#B388FF', usb: '#A8A8A8',
    psu: '#78C800', fan: '#9AA0A6', led: '#00CC6A', antenna: '#7DD3F0',
    module: '#9DB4D8', ha: '#FF4D6A', wan: '#F5A623', fortilink: '#F0523F'
  };
  var FORM_LABEL = { '1RU': '1U rack', '2RU': '2U rack', 'desktop': 'Desktop', 'AP': 'Access point', 'chassis': 'Chassis' };
  var KIND_DESC = {
    rj45: 'RJ45', sfp: 'SFP/SFP+', sfp28: 'SFP28', qsfp: 'QSFP', 'qsfp-dd': 'QSFP-DD',
    mgmt: 'management', console: 'console', usb: 'USB', psu: 'power', fan: 'fan',
    led: 'LED', antenna: 'antenna', module: 'module slot', blank: ''
  };
  var KIND_TEXT = { mgmt: 'MGT', console: 'CON', usb: 'USB', psu: 'PSU', fan: '', led: '', antenna: '', rj45: 'ETH', sfp: 'SFP', sfp28: 'SFP', qsfp: 'QSFP', 'qsfp-dd': 'QSFP' };
  /* estimated rendered width of one unit, used to decide short vs full caption */
  var UNIT_W = { rj45: 24, mgmt: 24, console: 24, sfp: 33, sfp28: 33, qsfp: 43, 'qsfp-dd': 43, usb: 20, psu: 58, fan: 28, led: 14, antenna: 22, module: 100, blank: 90 };

  /* ── helpers ─────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function has(arr, v) { if (!arr) { return false; } for (var i = 0; i < arr.length; i++) { if (arr[i] === v) { return true; } } return false; }
  function num(v, d) { v = parseInt(v, 10); return isNaN(v) ? d : v; }

  function blockColor(b) {
    if (has(b.tags, 'ha')) { return COLORS.ha; }
    if (has(b.tags, 'fortilink')) { return COLORS.fortilink; }
    if (has(b.tags, 'wan') && (b.kind === 'rj45' || b.kind === 'sfp')) { return COLORS.wan; }
    switch (b.kind) {
      case 'rj45': return b.poe ? COLORS.poe : COLORS.eth;
      case 'sfp': return COLORS.sfp;
      case 'sfp28': return COLORS.sfp28;
      case 'qsfp': case 'qsfp-dd': return COLORS.qsfp;
      case 'mgmt': return COLORS.mgmt;
      case 'console': return COLORS.console;
      case 'usb': return COLORS.usb;
      case 'psu': return COLORS.psu;
      case 'fan': return COLORS.fan;
      case 'led': return COLORS.led;
      case 'antenna': return COLORS.antenna;
      case 'module': return COLORS.module;
      default: return '#BBBBBB';
    }
  }
  function poeText(b) {
    var l = b.label || '';
    if (!b.poe) { return ''; }
    if (/PoE\+\+|802\.3bt/i.test(l)) { return 'PoE++'; }
    if (/PoE\+|802\.3at/i.test(l)) { return 'PoE+'; }
    return 'PoE';
  }
  function shortLabel(b) {
    if (b.short) { return b.short; }
    var s = String(b.label || '');
    var cut = s.search(/ — | - | \(|: /);
    if (cut > 0) { s = s.slice(0, cut); }
    if (s.length > 26) { s = s.slice(0, 24) + '…'; }
    return s;
  }
  /* text printed inside a port */
  function portText(b, n, i) {
    if (b.labels && b.labels[i] != null) { return String(b.labels[i]); }
    if (n == null) { return KIND_TEXT[b.kind] || ''; }
    if (b.kind === 'psu' && !b.prefix) { return (b.count || 1) > 1 ? 'PSU' + n : 'PSU'; }
    var p = b.prefix || '';
    if (p && p.indexOf('/') < 0 && p.length <= 4 && !/^(port|lan|eth)$/i.test(p)) { return (p + n).toUpperCase(); }
    return String(n);
  }
  /* interface name used in the tooltip / aria-label */
  function portName(b, n, i) {
    if (b.names && b.names[i] != null) { return String(b.names[i]); }
    if (b.prefix && n != null) { return b.prefix + n; }
    if (b.labels && b.labels[i] != null) { return String(b.labels[i]); }
    var base = shortLabel(b);
    return (b.count || 1) > 1 ? base + ' ' + (i + 1) : base;
  }
  function portTitle(b, n, i) {
    var parts = [];
    if (b.speed) { parts.push(b.speed); }
    var pt = poeText(b); if (pt) { parts.push(pt); }
    if (KIND_DESC[b.kind]) { parts.push(KIND_DESC[b.kind]); }
    var s = portName(b, n, i);
    if (parts.length) { s += ' · ' + parts.join(' '); }
    if (b.label && b.label !== s) { s += ' — ' + b.label; }
    return s;
  }
  /* short silk-screen text at the left of the front face (whole words, <= 22 chars) */
  function brandText(model) {
    var words = String(model).replace(/\s*\(.*$/, '').replace(/\s[—–-]\s.*$/, '').split(/\s+/), out = '';
    for (var i = 0; i < words.length; i++) {
      if (!words[i]) { continue; }
      if (out && (out + ' ' + words[i]).length > 22) { break; }
      out = out ? out + ' ' + words[i] : words[i];
    }
    return out || String(model);
  }
  function moduleText(b, n, i) {
    if (b.labels && b.labels[i] != null) { return String(b.labels[i]); }
    var cnt = b.count || 1;
    if (cnt > 4) { return String(n != null ? n : i + 1); }
    if (b.prefix && n != null) { return b.prefix + n; }
    var base = shortLabel(b);
    return cnt > 1 ? base + ' ' + (i + 1) : base;
  }

  /* ── grid maths: groups → rows → cells (odd numbers on top) ─────── */
  function layout(b) {
    var count = num(b.count, 1), rows = num(b.rows, 1), g = num(b.groupOf, 0) || count;
    var numbering = b.numbering || (count > 1 ? 'sequential' : 'none');
    var start = (b.startAt != null) ? num(b.startAt, 1) : 1;
    if (rows < 1) { rows = 1; }
    var groups = [];
    for (var gi = 0; gi * g < count; gi++) {
      var n = Math.min(g, count - gi * g);
      var cols = rows > 1 ? Math.ceil(n / rows) : n;
      var cells = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var k = (numbering === 'odd-top' && rows === 2) ? (c * 2 + r) : (r * cols + c);
          if (k >= n) { cells.push(null); continue; }
          var i = gi * g + k;
          cells.push({ i: i, n: (numbering === 'none') ? null : start + i, row: r });
        }
      }
      groups.push({ cols: cols, rows: rows, cells: cells, first: start + gi * g, last: start + gi * g + n - 1, numbered: numbering !== 'none' });
    }
    return { groups: groups, count: count, rows: rows, cols: groups.length ? groups[0].cols : 1 };
  }
  function estWidth(b, lay) {
    var u = UNIT_W[b.kind] || 24, w = 0;
    for (var i = 0; i < lay.groups.length; i++) { w += lay.groups[i].cols * u + 8; }
    return w;
  }

  /* ── block renderers ─────────────────────────────────────────────── */
  function shapeClass(b) {
    var k = b.kind, l = (b.label || '').toLowerCase(), cls = k;
    if (k === 'console' && /usb/.test(l)) { cls += ' mini'; }
    if (k === 'usb' && /type-c|usb-c/.test(l)) { cls += ' usbc'; }
    if (k === 'psu' && /adapter|jack|inlet|vdc|v dc|12 v|54 v|dc in/.test(l)) { cls += ' jack'; }
    if (k === 'module' && num(b.count, 1) > 4) { cls += ' bay'; }
    if (k === 'module' && num(b.rows, 1) > 1) { cls += ' slim'; }
    return cls;
  }
  function antennaSvg() {
    return '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">' +
      '<path d="M10 18V8" stroke="currentColor" stroke-width="1.6" fill="none"/>' +
      '<circle cx="10" cy="7" r="1.8" fill="currentColor"/>' +
      '<path d="M5.5 3.5a6.5 6.5 0 0 1 9 0M7.2 5.6a4 4 0 0 1 5.6 0" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>';
  }
  function fanSvg() {
    return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="12" r="2" fill="currentColor"/>' +
      '<path d="M12 10c-1-3-4-4-6-2 2 0 4 1 6 2zM14 12c3-1 4-4 2-6 0 2-1 4-2 6zM12 14c1 3 4 4 6 2-2 0-4-1-6-2zM10 12c-3 1-4 4-2 6 0-2 1-4 2-6z" fill="currentColor" opacity=".75"/></svg>';
  }

  function renderPort(b, cell, color) {
    var isBlank = b.kind === 'blank';
    if (isBlank) {
      return '<span class="kbp-chip" title="' + esc(b.label) + '">' + esc(b.short || b.label) + '</span>';
    }
    var i = cell ? cell.i : 0, n = cell ? cell.n : null;
    var title = portTitle(b, n, i);
    var inner, cls = 'kbp-p ' + shapeClass(b);
    if (cell && cell.row > 0 && (b.kind === 'rj45' || b.kind === 'mgmt')) { cls += ' flip'; }
    if (has(b.tags, 'fortilink') || has(b.tags, 'stack')) { cls += ' dashed'; }
    switch (b.kind) {
      case 'module': inner = esc(moduleText(b, n, i)); break;
      case 'fan': inner = fanSvg(); break;
      case 'antenna': inner = antennaSvg(); break;
      case 'led': inner = ''; break;
      default: inner = esc(portText(b, n, i));
    }
    var html = '<span class="' + cls + '" role="img" style="--c:' + color + '" title="' + esc(title) + '" aria-label="' + esc(title) + '">' + inner + '</span>';
    if (b.kind === 'led' && b.labels && b.labels[i] != null) {
      html = '<span class="kbp-ledwrap">' + html + '<span class="kbp-ledtxt" aria-hidden="true">' + esc(b.labels[i]) + '</span></span>';
    }
    return html;
  }

  function renderBlock(b) {
    if (!b || !b.kind) { return ''; }
    var color = blockColor(b), lay = layout(b), wide = estWidth(b, lay) >= 150;
    var html = '<div class="kbp-blk' + (wide ? '' : ' narrow') + ' kbp-k-' + esc(b.kind) + '">';
    if (b.kind === 'blank') {
      html += renderPort(b, null, color) + '</div>';
      return html;
    }
    html += '<div class="kbp-groups">';
    for (var gi = 0; gi < lay.groups.length; gi++) {
      var g = lay.groups[gi];
      html += '<div class="kbp-grp"><div class="kbp-grid" style="grid-template-columns:repeat(' + g.cols + ',auto)">';
      for (var ci = 0; ci < g.cells.length; ci++) {
        var cell = g.cells[ci];
        html += cell ? renderPort(b, cell, color) : '<span class="kbp-empty" aria-hidden="true"></span>';
      }
      html += '</div>';
      if (lay.groups.length > 1 && g.numbered) {
        html += '<div class="kbp-glabel" aria-hidden="true">' + g.first + (g.last > g.first ? '–' + g.last : '') + '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    var cap = wide ? (b.label || '') : shortLabel(b);
    if (!wide && b.kind === 'module' && num(b.count, 1) === 1) { cap = ''; } /* the slot already shows its name */
    html += '<div class="kbp-cap" title="' + esc(b.label) + '">' + esc(cap) + '</div></div>';
    return html;
  }

  /* ── legend ──────────────────────────────────────────────────────── */
  function legendFor(dev) {
    var seen = {}, items = [];
    function add(key, color, text, style) { if (seen[key]) { return; } seen[key] = 1; items.push({ c: color, t: text, s: style || '' }); }
    for (var f = 0; f < dev.faces.length; f++) {
      var blocks = dev.faces[f].blocks || [];
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (has(b.tags, 'ha')) { add('ha', COLORS.ha, 'HA link'); continue; }
        if (has(b.tags, 'fortilink')) { add('fl', COLORS.fortilink, 'FortiLink', 'dashed'); continue; }
        if (has(b.tags, 'wan') && (b.kind === 'rj45' || b.kind === 'sfp')) { add('wan', COLORS.wan, 'WAN'); continue; }
        switch (b.kind) {
          case 'rj45': if (b.poe) { add('poe', COLORS.poe, 'RJ45 PoE'); } else { add('eth', COLORS.eth, 'RJ45 copper'); } break;
          case 'sfp': add('sfp', COLORS.sfp, 'SFP / SFP+'); break;
          case 'sfp28': add('sfp28', COLORS.sfp28, 'SFP28 (25G)'); break;
          case 'qsfp': case 'qsfp-dd': add('qsfp', COLORS.qsfp, 'QSFP / QSFP28'); break;
          case 'module': add('mod', COLORS.module, 'Module slot / bay', 'dashed'); break;
          case 'mgmt': add('mgmt', COLORS.mgmt, 'Mgmt (OOB)'); break;
          case 'console': add('con', COLORS.console, 'Console'); break;
          case 'usb': add('usb', COLORS.usb, 'USB'); break;
          case 'psu': add('psu', COLORS.psu, 'Power'); break;
          case 'fan': add('fan', COLORS.fan, 'Fan'); break;
          case 'led': add('led', COLORS.led, 'LED / button', 'dot'); break;
          case 'antenna': add('ant', COLORS.antenna, 'Antenna'); break;
        }
      }
    }
    if (!items.length) { return ''; }
    var html = '<div class="kbp-legend" aria-label="Legend">';
    for (var k = 0; k < items.length; k++) {
      html += '<span class="kbp-lg"><i class="' + items[k].s + '" style="--c:' + items[k].c + '" aria-hidden="true"></i>' + esc(items[k].t) + '</span>';
    }
    return html + '</div>';
  }

  /* ── one panel ───────────────────────────────────────────────────── */
  var uid = 0;
  function panelHtml(dev, id) {
    var faces = dev.faces || [], multi = faces.length > 1, pid = 'kbp' + (++uid);
    var html = '<div class="kbp" data-vendor="' + esc(dev.vendor || '') + '" data-form="' + esc(dev.form || '') + '">';
    html += '<div class="kbp-head"><span class="kbp-model">' + esc(dev.model || id) + '</span>';
    if (dev.form) { html += '<span class="kbp-form">' + esc(FORM_LABEL[dev.form] || dev.form) + '</span>'; }
    if (multi) {
      html += '<div class="kbp-tabs" role="tablist" aria-label="Panel faces">';
      for (var t = 0; t < faces.length; t++) {
        html += '<button type="button" class="kbp-tab" role="tab" id="' + pid + '-t' + t + '" aria-controls="' + pid + '-f' + t + '" aria-selected="' + (t === 0 ? 'true' : 'false') + '" tabindex="' + (t === 0 ? '0' : '-1') + '" data-face="' + t + '">' + esc(faces[t].name || ('Face ' + (t + 1))) + '</button>';
      }
      html += '</div>';
    }
    html += '</div>';
    for (var f = 0; f < faces.length; f++) {
      var face = faces[f], blocks = face.blocks || [];
      html += '<div class="kbp-face" id="' + pid + '-f' + f + '"' + (multi ? ' role="tabpanel" aria-labelledby="' + pid + '-t' + f + '"' : '') + (f > 0 ? ' hidden' : '') + '>';
      html += '<div class="kbp-facename">' + esc(face.name || '') + '</div>';
      html += '<div class="kbp-scroll" tabindex="0" role="group" aria-label="' + esc((face.name || 'Panel') + ' of ' + (dev.model || id)) + '"><div class="kbp-chassis">';
      var rack = dev.form === '1RU' || dev.form === '2RU' || dev.form === 'chassis';
      if (rack) { html += '<span class="kbp-ear" aria-hidden="true"></span>'; }
      html += '<div class="kbp-strip">';
      if (f === 0 && dev.model) { html += '<span class="kbp-brand" aria-hidden="true">' + esc(brandText(dev.model)) + '</span>'; }
      if (!blocks.length) { html += '<span class="kbp-chip">No connectors on this face</span>'; }
      for (var i = 0; i < blocks.length; i++) { html += renderBlock(blocks[i]); }
      html += '</div>';
      if (rack) { html += '<span class="kbp-ear r" aria-hidden="true"></span>'; }
      html += '</div></div><span class="kbp-hint" aria-hidden="true">scroll →</span></div>';
    }
    html += legendFor(dev);
    html += '<div class="kbp-foot">';
    if (dev.source && dev.source.url) {
      html += 'Port layout per <a href="' + esc(dev.source.url) + '" target="_blank" rel="noopener">' + esc(dev.source.label || dev.source.url) + ' ↗</a>';
    } else {
      html += 'Source: ' + esc((dev.source && dev.source.label) || 'not recorded');
    }
    if (dev.confidence && dev.confidence !== 'high') {
      html += ' <span class="kbp-conf kbp-conf-' + esc(dev.confidence) + '">' + esc(dev.confidence) + ' confidence</span>';
    }
    html += '</div>';
    if (dev.note) { html += '<p class="kbp-note">' + esc(dev.note) + '</p>'; }
    return html + '</div>';
  }

  function missingHtml(id) {
    return '<div class="kbp kbp-missing" role="note">Panel data missing for “' + esc(id) + '” — add it to panel-data.js.</div>';
  }

  /* ── behaviour: tabs + scroll hint ───────────────────────────────── */
  function checkScroll(face) {
    var sc = face.querySelector('.kbp-scroll');
    if (!sc) { return; }
    var can = sc.scrollWidth > sc.clientWidth + 2 && sc.scrollLeft < 4;
    if (can) { face.className = face.className.replace(/\s*can-scroll/, '') + ' can-scroll'; }
    else { face.className = face.className.replace(/\s*can-scroll/, ''); }
  }
  function refreshAll() {
    var faces = doc.querySelectorAll('.kbp-face');
    for (var i = 0; i < faces.length; i++) { if (!faces[i].hasAttribute('hidden')) { checkScroll(faces[i]); } }
  }
  function wire(el) {
    var tabs = el.querySelectorAll('.kbp-tab'), faces = el.querySelectorAll('.kbp-face'), scrolls = el.querySelectorAll('.kbp-scroll');
    function select(idx, focus) {
      for (var i = 0; i < tabs.length; i++) {
        var on = i === idx;
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[i].setAttribute('tabindex', on ? '0' : '-1');
        if (on && focus) { tabs[i].focus(); }
      }
      for (var f = 0; f < faces.length; f++) {
        if (f === idx) { faces[f].removeAttribute('hidden'); checkScroll(faces[f]); } else { faces[f].setAttribute('hidden', ''); }
      }
    }
    for (var t = 0; t < tabs.length; t++) {
      (function (tab, idx) {
        tab.addEventListener('click', function () { select(idx, false); });
        tab.addEventListener('keydown', function (e) {
          var k = e.key || e.keyCode, n = null;
          if (k === 'ArrowRight' || k === 'Right' || k === 39) { n = (idx + 1) % tabs.length; }
          else if (k === 'ArrowLeft' || k === 'Left' || k === 37) { n = (idx - 1 + tabs.length) % tabs.length; }
          else if (k === 'Home' || k === 36) { n = 0; }
          else if (k === 'End' || k === 35) { n = tabs.length - 1; }
          if (n !== null) { e.preventDefault(); select(n, true); }
        });
      })(tabs[t], t);
    }
    for (var s = 0; s < scrolls.length; s++) {
      (function (sc) {
        sc.addEventListener('scroll', function () { checkScroll(sc.parentNode); });
      })(scrolls[s]);
    }
    for (var f = 0; f < faces.length; f++) { if (!faces[f].hasAttribute('hidden')) { checkScroll(faces[f]); } }
  }

  /* ── public API ──────────────────────────────────────────────────── */
  function render(el, id) {
    id = id || el.getAttribute('data-panel');
    var data = root.KB_PANELS || {}, dev = data[id];
    try {
      if (!dev || !dev.faces || !dev.faces.length) { el.innerHTML = missingHtml(id); return false; }
      el.innerHTML = panelHtml(dev, id);
      wire(el);
      el.setAttribute('data-panel-rendered', '1');
      return true;
    } catch (e) {
      try { el.innerHTML = missingHtml(id); } catch (e2) { /* ignore */ }
      return false;
    }
  }
  function renderAll() {
    injectCss();
    var els = doc.querySelectorAll('[data-panel]'), n = 0;
    for (var i = 0; i < els.length; i++) { if (render(els[i])) { n++; } }
    return n;
  }

  /* ── styles (injected once) ──────────────────────────────────────── */
  function injectCss() {
    if (doc.getElementById('kb-panels-css')) { return; }
    var s = doc.createElement('style');
    s.id = 'kb-panels-css';
    s.textContent = [
      '.port-diagram-wrap[data-panel]{min-width:0;max-width:100%;overflow:hidden;}',
      '.kbp{--pw:22px;--ph:18px;--sw:31px;--sh:13px;--qw:41px;--qh:15px;--mh:44px;--accent:#0B6A93;font-family:var(--mono,"JetBrains Mono",monospace);color:#e6e6e6;}',
      '.kbp[data-vendor=paloalto]{--accent:#B83A12;}.kbp[data-vendor=fortinet]{--accent:#B5231A;}',
      '.kbp-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-bottom:10px;}',
      '.kbp-model{font:600 12.5px/1.3 var(--font,sans-serif);color:#fff;}',
      '.kbp-form{font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.22);border-radius:4px;padding:2px 6px;}',
      '.kbp-tabs{margin-left:auto;display:flex;flex-wrap:wrap;gap:4px;}',
      '.kbp-tab{background:transparent;border:1px solid rgba(255,255,255,.28);color:#fff;font:600 10.5px/1 var(--font,sans-serif);padding:5px 10px;border-radius:999px;cursor:pointer;transition:background .15s,border-color .15s;}',
      '.kbp-tab:hover{border-color:#fff;}',
      '.kbp-tab[aria-selected=true]{background:var(--accent);border-color:var(--accent);}',
      '.kbp :focus-visible{outline:3px solid var(--focus-ring-dark,#FFB27A);outline-offset:2px;}',
      '.kbp-face{position:relative;}.kbp-face[hidden]{display:none;}',
      '.kbp-facename{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.72);margin:0 0 6px;}',
      '.kbp-scroll{position:relative;overflow-x:auto;overflow-y:hidden;max-width:100%;padding-bottom:6px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.35) transparent;-webkit-overflow-scrolling:touch;}',
      '.kbp-chassis{display:inline-flex;align-items:stretch;min-width:100%;background:linear-gradient(180deg,#34363a 0%,#25272b 40%,#1c1e22 100%);border:1px solid #060606;border-radius:3px;box-shadow:inset 0 1px 0 rgba(255,255,255,.09),inset 0 -1px 0 rgba(0,0,0,.6),0 3px 8px rgba(0,0,0,.55);}',
      '.kbp[data-form=desktop] .kbp-chassis,.kbp[data-form=AP] .kbp-chassis{border-radius:8px;}',
      '.kbp-ear{flex:0 0 13px;border-right:1px solid #0b0b0b;background:radial-gradient(circle at 6.5px 9px,#0a0a0a 2.2px,rgba(0,0,0,0) 3px),radial-gradient(circle at 6.5px calc(100% - 9px),#0a0a0a 2.2px,rgba(0,0,0,0) 3px),linear-gradient(90deg,#3c3e42,#2b2d31);}',
      '.kbp-ear.r{border-right:0;border-left:1px solid #0b0b0b;}',
      '.kbp-strip{display:flex;align-items:flex-end;gap:16px;padding:12px 14px 9px;flex:1 1 auto;}',
      '.kbp[data-form="2RU"] .kbp-strip{padding-top:24px;padding-bottom:20px;}',
      '.kbp[data-form=chassis] .kbp-strip{flex-wrap:wrap;align-items:flex-start;row-gap:18px;padding:16px;}',
      '.kbp-brand{align-self:flex-start;font:700 8px/1.25 var(--font,sans-serif);color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.6px;max-width:80px;max-height:30px;overflow:hidden;padding:2px 8px 2px 0;border-right:1px solid rgba(255,255,255,.12);flex:0 0 auto;}',
      '.kbp-blk{display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto;}',
      '.kbp-groups{display:flex;gap:8px;align-items:flex-end;}',
      '.kbp-grp{display:flex;flex-direction:column;align-items:center;gap:3px;}',
      '.kbp-grid{display:grid;gap:4px 2px;padding:3px;background:rgba(0,0,0,.38);border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.65),inset 0 1px 2px rgba(0,0,0,.6);}',
      '.kbp-k-led .kbp-grid,.kbp-k-antenna .kbp-grid{background:transparent;box-shadow:none;gap:4px 5px;align-items:end;}',
      '.kbp-k-fan .kbp-grid{background:rgba(0,0,0,.25);}',
      '.kbp-empty{display:block;}',
      '.kbp-glabel{font-size:8px;color:rgba(255,255,255,.66);letter-spacing:.3px;}',
      '.kbp-cap{width:0;min-width:100%;height:22px;overflow:hidden;font-size:8.5px;line-height:1.3;color:rgba(255,255,255,.74);text-align:left;}',
      '.kbp-blk.narrow .kbp-cap{width:auto;min-width:0;max-width:76px;text-align:center;}',
      /* port shapes */
      '.kbp-p{position:relative;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;font-size:7.5px;font-weight:600;line-height:1;letter-spacing:0;border:1.5px solid var(--c);color:var(--c);background:linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,.6));border-radius:2px;cursor:default;white-space:nowrap;transition:transform .12s;box-shadow:inset 0 0 0 1px rgba(0,0,0,.4);}',
      '.kbp-p:hover{transform:scale(1.2);z-index:2;}',
      '.kbp-p.dashed{border-style:dashed;}',
      '.kbp-p.rj45,.kbp-p.mgmt,.kbp-p.console{width:var(--pw);height:var(--ph);border-radius:2px 2px 3px 3px;}',
      '.kbp-p.rj45::after,.kbp-p.mgmt::after,.kbp-p.console::after{content:"";position:absolute;left:50%;bottom:-1.5px;width:9px;height:3px;margin-left:-4.5px;background:var(--c);opacity:.6;border-radius:0 0 2px 2px;}',
      '.kbp-p.flip{border-radius:3px 3px 2px 2px;}',
      '.kbp-p.flip::after{bottom:auto;top:-1.5px;border-radius:2px 2px 0 0;}',
      '.kbp-p.console.mini{width:17px;height:11px;border-radius:3px;font-size:6px;}',
      '.kbp-p.console.mini::after{display:none;}',
      '.kbp-p.sfp,.kbp-p.sfp28{width:var(--sw);height:var(--sh);border-radius:1px;font-size:7px;}',
      '.kbp-p.qsfp,.kbp-p.qsfp-dd{width:var(--qw);height:var(--qh);border-radius:1px;font-size:7px;}',
      '.kbp-p.sfp::before,.kbp-p.sfp28::before,.kbp-p.qsfp::before,.kbp-p.qsfp-dd::before{content:"";position:absolute;left:2px;right:2px;top:1.5px;height:1px;background:var(--c);opacity:.35;}',
      '.kbp-p.usb{width:17px;height:9px;border-radius:1px;font-size:5.5px;}',
      '.kbp-p.usb.usbc{border-radius:5px;}',
      '.kbp-p.psu{width:56px;height:30px;border-radius:2px;font-size:8px;padding-left:14px;justify-content:flex-start;}',
      '.kbp-p.psu::before{content:"";position:absolute;left:4px;top:50%;width:8px;height:10px;margin-top:-5px;border:1.5px solid var(--c);border-radius:1px 1px 4px 4px;opacity:.85;}',
      '.kbp-p.psu.jack{width:18px;height:18px;border-radius:50%;padding:0;justify-content:center;font-size:0;}',
      '.kbp-p.psu.jack::before{left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;border-width:1.5px;}',
      '.kbp-p.fan{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle,#1a1a1a 0,#101010 70%);}',
      '.kbp-p.fan svg{width:20px;height:20px;}',
      '.kbp-p.antenna{width:22px;height:22px;border-radius:4px;border-style:solid;}',
      '.kbp-p.led{width:7px;height:7px;border:0;border-radius:50%;background:var(--c);box-shadow:0 0 5px var(--c),0 0 1px #000;}',
      '.kbp-ledwrap{display:inline-flex;flex-direction:column;align-items:center;gap:3px;}',
      '.kbp-ledtxt{font-size:6px;color:rgba(255,255,255,.7);letter-spacing:.2px;}',
      '.kbp-p.module{min-width:96px;height:var(--mh);border-style:dashed;border-radius:3px;padding:3px 7px;font-size:8px;line-height:1.25;white-space:normal;text-align:center;background:rgba(0,0,0,.35);}',
      '.kbp-p.module.slim{height:26px;}',
      '.kbp-p.module.bay{min-width:0;width:20px;height:var(--mh);padding:0;font-size:7px;}',
      '.kbp-chip{display:inline-block;max-width:128px;font-size:8px;line-height:1.3;color:rgba(255,255,255,.7);border:1px dotted rgba(255,255,255,.3);border-radius:3px;padding:4px 7px;text-align:center;align-self:center;}',
      /* scroll hint */
      '.kbp-hint{display:none;position:absolute;right:0;top:20px;font:600 9px/1 var(--font,sans-serif);color:#fff;background:rgba(0,0,0,.72);padding:4px 7px;border-radius:0 3px 0 4px;pointer-events:none;}',
      '.kbp-face.can-scroll .kbp-hint{display:block;}',
      '.kbp-face.can-scroll::after{content:"";position:absolute;right:0;top:20px;bottom:8px;width:34px;background:linear-gradient(90deg,rgba(17,17,17,0),rgba(17,17,17,.85));pointer-events:none;}',
      /* legend + footer */
      '.kbp-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:12px;}',
      '.kbp-lg{display:inline-flex;align-items:center;gap:6px;font-size:10px;color:rgba(255,255,255,.8);}',
      '.kbp-lg i{display:inline-block;width:12px;height:9px;border:1.5px solid var(--c);border-radius:2px;background:rgba(0,0,0,.4);box-shadow:inset 0 0 0 4px rgba(0,0,0,0);}',
      '.kbp-lg i.dashed{border-style:dashed;}',
      '.kbp-lg i.dot{width:8px;height:8px;border:0;border-radius:50%;background:var(--c);box-shadow:0 0 4px var(--c);}',
      '.kbp-foot{margin-top:10px;font:400 11px/1.55 var(--font,sans-serif);color:rgba(255,255,255,.78);}',
      '.kbp-foot a{color:#FFB27A;text-decoration:underline;text-underline-offset:2px;}.kbp-foot a:hover{color:#fff;}',
      '.kbp-conf{display:inline-block;vertical-align:middle;font-size:9px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;border-radius:4px;padding:1px 6px;margin-left:6px;border:1px solid;}',
      '.kbp-conf-medium{color:#FFD166;border-color:#FFD166;}.kbp-conf-low{color:#FF8A80;border-color:#FF8A80;}',
      '.kbp-note{margin:6px 0 0;font:400 11px/1.55 var(--font,sans-serif);color:rgba(255,255,255,.72);}',
      '.kbp-missing{font:500 12px/1.5 var(--font,sans-serif);color:#FFD166;border:1px dashed rgba(255,209,102,.5);border-radius:6px;padding:10px 12px;}',
      /* narrow screens: slightly smaller ports */
      '@media(max-width:640px){.kbp{--pw:19px;--ph:16px;--sw:27px;--sh:12px;--qw:35px;--qh:14px;--mh:40px;}.kbp-p{font-size:6.5px;}.kbp-p.module{min-width:84px;font-size:7.5px;}.kbp-strip{gap:12px;padding:10px 10px 8px;}.kbp-tabs{margin-left:0;}}',
      '@media(prefers-reduced-motion:reduce){.kbp *{transition:none!important;}.kbp-p:hover{transform:none;}}'
    ].join('\n');
    (doc.head || doc.documentElement).appendChild(s);
  }

  /* ── boot ────────────────────────────────────────────────────────── */
  var resizeTimer = null;
  function onResize() { if (resizeTimer) { clearTimeout(resizeTimer); } resizeTimer = setTimeout(refreshAll, 120); }
  function boot() {
    try { renderAll(); } catch (e) { /* never break the page */ }
    if (root.addEventListener) { root.addEventListener('resize', onResize); }
    /* re-check once web fonts have settled */
    setTimeout(refreshAll, 400);
  }
  root.KBPanels = { render: render, renderAll: renderAll, refresh: refreshAll, colors: COLORS };
  if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
