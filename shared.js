/* ═══════════════════════════════════════════════════════════
   Orange Business — Network Knowledge Base
   Shared JavaScript  |  Single source of truth for the nav
═══════════════════════════════════════════════════════════ */

/* ── NAV HTML ──────────────────────────────────────────────
   Edit the nav ONLY here. Every page inherits it automatically.
   To add a new page: add one <a> line below, then create the file.
─────────────────────────────────────────────────────────── */
const NAV_HTML = `
<a href="index.html" class="topnav-brand">
  <div class="topnav-logo">OB</div>
  <div class="topnav-brand-text">Orange <span>Business</span></div>
</a>
<div class="topnav-links">
  <a href="index.html"          class="nav-link">Home</a>
  <a href="lan-wan-basics.html" class="nav-link">LAN / WAN</a>
  <a href="ip-routing.html"     class="nav-link">IP Routing</a>
  <a href="switching.html"      class="nav-link">Switching</a>
  <a href="wireless.html"       class="nav-link">Wireless</a>
  <a href="firewalls.html"      class="nav-link">Firewalls</a>
  <a href="zscaler.html"        class="nav-link">Zscaler</a>
  <a href="devices.html"        class="nav-link">Devices</a>
  <a href="glossary.html" class="nav-link">Glossary</a>
</div>
<div class="topnav-badge">New Hire Guide</div>
`;

/* ── INSERT NAV + MARK ACTIVE LINK ─────────────────────── */
function insertNav() {
  const placeholder = document.getElementById('topnav-placeholder');
  if (!placeholder) return;

  placeholder.innerHTML = NAV_HTML;

  const file = location.pathname.split('/').pop() || 'index.html';

  // Mark active on regular nav links
  placeholder.querySelectorAll('.nav-link[href]').forEach(link => {
    if (link.getAttribute('href') === file) link.classList.add('active');
  });

  // Mark active on dropdown items + highlight Devices button
  const dropdownBtn = placeholder.querySelector('.nav-dropdown-btn');
  placeholder.querySelectorAll('.nav-dropdown-item').forEach(item => {
    if (item.getAttribute('href') === file) {
      item.classList.add('active');
      if (dropdownBtn) {
        dropdownBtn.style.color = 'var(--orange)';
        dropdownBtn.style.background = 'rgba(255,255,255,0.08)';
      }
    }
  });

  // Dropdown: hover + click + close-on-outside-click
  const dropdown = placeholder.querySelector('.nav-dropdown');
  if (!dropdown) return;

  dropdown.addEventListener('mouseenter', () => dropdown.classList.add('open'));
  dropdown.addEventListener('mouseleave', () => dropdown.classList.remove('open'));
  dropdownBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown.classList.remove('open'));
}

// Run as soon as DOM is ready — works whether script is in <head> or <body>
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', insertNav);
} else {
  insertNav();
}


/* ── VENDOR TAB SWITCHING ───────────────────────────────── */
function showVendor(vendor, btn) {
  document.querySelectorAll('.vendor-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.vendor-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('vendor-' + vendor);
  if (panel) panel.classList.add('active');
  if (btn)   btn.classList.add('active');
}

/* ── SMOOTH SCROLL ──────────────────────────────────────── */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── COLLAPSIBLE SECTIONS ───────────────────────────────── */
function toggleCollapse(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

/* ── PORT TOOLTIPS ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.port[title]').forEach(port => {
    port.addEventListener('mouseenter', function () {
      const tip = document.createElement('div');
      tip.id = 'port-tip';
      tip.style.cssText = 'position:fixed;background:#1A1A1A;color:#fff;font-size:11px;font-family:monospace;padding:4px 8px;border-radius:4px;pointer-events:none;z-index:999;border:1px solid rgba(255,98,0,0.4);';
      tip.textContent = this.title;
      document.body.appendChild(tip);
    });
    port.addEventListener('mousemove', function (e) {
      const tip = document.getElementById('port-tip');
      if (tip) { tip.style.left = (e.clientX + 12) + 'px'; tip.style.top = (e.clientY - 28) + 'px'; }
    });
    port.addEventListener('mouseleave', function () {
      const tip = document.getElementById('port-tip');
      if (tip) tip.remove();
    });
  });
});
