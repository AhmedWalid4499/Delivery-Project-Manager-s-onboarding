/* ============================================================
   DPM-KB · Glossary store
   ------------------------------------------------------------
   Adds glossary terms and saves them into the repo (glossary.json)
   so every visitor sees them. Reuses the SAME GitHub token as the
   squad editor (localStorage key "dpmkb_gh_token").
============================================================ */
(function () {
  "use strict";

  var CONFIG = {
    owner:   "AhmedWalid4499",
    repo:    "DPM-KB",
    branch:  "main",            // change to "master" if that's your default branch
    dataPath:"glossary.json"
  };

  var TK   = "dpmkb_gh_token";          // SAME token key as squad-data.js
  var PEND = "dpmkb_pending_glossary";  // optimistic local adds

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
    });
  }
  function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64decode(b)  { return decodeURIComponent(escape(atob(b))); }
  function rawUrl(branch) {
    return "https://raw.githubusercontent.com/" + CONFIG.owner + "/" + CONFIG.repo +
           "/" + branch + "/" + CONFIG.dataPath + "?cb=" + Date.now();
  }
  function api() {
    return "https://api.github.com/repos/" + CONFIG.owner + "/" + CONFIG.repo + "/contents/" + CONFIG.dataPath;
  }
  function letterOf(term) {
    var c = (term || "").trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(c) ? c : "#";
  }

  var content = $("#glossary-content");
  if (!content) return;
  var accent = "#FF7900";

  /* ---------- dedupe set of existing terms ---------- */
  function existingTerms() {
    var set = {};
    Array.prototype.forEach.call(content.querySelectorAll(".glossary-term"), function (t) {
      set[(t.textContent || "").trim().toLowerCase()] = 1;
    });
    return set;
  }

  // A header is a single letter ("A"), a range ("T – Z"), or "#".
  function coversLetter(header, L) {
    header = (header || "").trim().toUpperCase();
    var m = header.match(/^([A-Z])\s*[\u2013\u2014-]\s*([A-Z])$/); // range, any dash
    if (m) return L >= m[1] && L <= m[2];
    if (/^[A-Z]$/.test(header)) return header === L;
    if (header === "#") return L === "#";
    return false;
  }
  function startLetter(header) {
    header = (header || "").trim().toUpperCase();
    var m = header.match(/^([A-Z])/);
    return m ? m[1] : "{"; // "#"/other sorts after Z
  }
  function sectionForLetter(L) {
    var secs = content.querySelectorAll(".section");
    for (var i = 0; i < secs.length; i++) {
      var h = secs[i].querySelector(".section-header h2");
      if (h && coversLetter(h.textContent, L)) return secs[i];
    }
    return null;
  }
  function makeSection(L) {
    var sec = document.createElement("div");
    sec.className = "section";
    sec.innerHTML = '<div class="section-header"><h2>' + esc(L) + '</h2><div class="divider"></div></div>' +
                    '<div class="glossary-grid"></div>';
    // insert in alphabetical order by each section's start letter ("#" goes last)
    var target = (L === "#") ? "{" : L;
    var secs = content.querySelectorAll(".section");
    var ref = null;
    for (var i = 0; i < secs.length; i++) {
      if (startLetter(secs[i].querySelector(".section-header h2").textContent) > target) { ref = secs[i]; break; }
    }
    content.insertBefore(sec, ref);
    return sec;
  }
  function renderTerm(t) {
    if (!t || !t.term) return;
    var L = letterOf(t.term);
    var sec = sectionForLetter(L) || makeSection(L);
    var grid = sec.querySelector(".glossary-grid");
    var item = document.createElement("div");
    item.className = "glossary-item";
    item.setAttribute("data-added", "1");
    item.innerHTML = '<div class="glossary-term">' + esc(t.term) + '</div>' +
                     '<div class="glossary-def">' + esc(t.def) + '</div>';
    grid.appendChild(item);
  }
  function addTerms(list) {
    var seen = existingTerms();
    (list || []).forEach(function (t) {
      var k = (t.term || "").trim().toLowerCase();
      if (k && !seen[k]) { renderTerm(t); seen[k] = 1; }
    });
  }

  /* ---------- optimistic local cache ---------- */
  function pending() { try { return JSON.parse(localStorage.getItem(PEND) || "[]"); } catch (e) { return []; } }
  function addPending(t) { try { var p = pending(); p.push(t); localStorage.setItem(PEND, JSON.stringify(p)); } catch (e) {} }

  /* ---------- load data ---------- */
  fetch(rawUrl(CONFIG.branch))
    .then(function (r) {
      if (r.ok) return r.json();
      if (CONFIG.branch !== "master") return fetch(rawUrl("master")).then(function (r2) { return r2.ok ? r2.json() : null; });
      return null;
    })
    .then(function (data) {
      addTerms((data && data.terms) ? data.terms : []);
      addTerms(pending());
    })
    .catch(function () { addTerms(pending()); });

  /* ---------- token ---------- */
  function getToken() { return localStorage.getItem(TK) || ""; }
  function setToken(t) { if (t) localStorage.setItem(TK, t); else localStorage.removeItem(TK); refreshBar(); }

  /* ---------- styles ---------- */
  var css = document.createElement("style");
  css.textContent =
    ".gl-addbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:8px;}" +
    ".gl-add{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#fff;" +
      "background:" + accent + ";border:none;border-radius:9px;padding:11px 18px;cursor:pointer;transition:filter .15s;}" +
    ".gl-add:hover{filter:brightness(1.08);}" +
    ".gl-edit{font-size:12.5px;font-weight:600;color:#666;background:#F2F2F2;border:1px solid #E2E2E2;border-radius:8px;padding:9px 13px;cursor:pointer;}" +
    ".gl-edit:hover{background:#EAEAEA;}" +
    ".gl-edit.on{color:#0E7A3A;background:#E6F7EF;border-color:#A8E0C2;}" +
    ".gl-note{font-size:12px;color:#999;margin-bottom:14px;}" +
    ".gl-status{font-size:13px;font-weight:600;margin-bottom:16px;padding:11px 14px;border-radius:9px;display:none;}" +
    ".gl-status.show{display:block;}" +
    ".gl-status.ok{background:#E6F7EF;color:#0E7A3A;border:1px solid #A8E0C2;}" +
    ".gl-status.err{background:#FDECEC;color:#C0392B;border:1px solid #F0B6B0;}" +
    ".gl-status.info{background:#EEF4FF;color:#1A4E8A;border:1px solid #BCD2F5;}" +
    ".gl-ov{position:fixed;inset:0;background:rgba(10,15,25,0.55);display:none;align-items:center;justify-content:center;z-index:9999;padding:20px;}" +
    ".gl-ov.show{display:flex;}" +
    ".gl-modal{background:#fff;border-radius:16px;max-width:460px;width:100%;padding:26px 26px 24px;box-shadow:0 24px 70px rgba(0,0,0,0.3);max-height:90vh;overflow:auto;}" +
    ".gl-modal h3{font-size:19px;font-weight:800;color:#1A1A1A;margin-bottom:4px;}" +
    ".gl-modal .sub{font-size:13px;color:#777;margin-bottom:18px;}" +
    ".gl-field{margin-bottom:14px;}" +
    ".gl-field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:5px;}" +
    ".gl-field input,.gl-field textarea{width:100%;font-size:14px;padding:10px 12px;border:1px solid #DDD;border-radius:8px;font-family:inherit;}" +
    ".gl-field textarea{min-height:90px;resize:vertical;line-height:1.5;}" +
    ".gl-field input:focus,.gl-field textarea:focus{outline:none;border-color:" + accent + ";box-shadow:0 0 0 3px " + accent + "22;}" +
    ".gl-tokbox{background:#FFFBF0;border:1px solid #F0DCA0;border-radius:10px;padding:14px;margin-bottom:16px;}" +
    ".gl-tokbox p{font-size:12px;color:#7A5E1A;margin-bottom:9px;line-height:1.5;}" +
    ".gl-tokbox a{color:#B5781A;font-weight:700;}" +
    ".gl-actions{display:flex;gap:10px;margin-top:6px;}" +
    ".gl-actions button{flex:1;font-size:14px;font-weight:700;padding:11px;border-radius:9px;cursor:pointer;border:none;}" +
    ".gl-save{color:#fff;background:" + accent + ";}.gl-save:hover{filter:brightness(1.08);}" +
    ".gl-cancel{color:#555;background:#EFEFEF;}.gl-cancel:hover{background:#E4E4E4;}";
  document.head.appendChild(css);

  /* ---------- add bar (top of glossary) ---------- */
  var bar = document.createElement("div");
  bar.className = "gl-addbar";
  bar.innerHTML = '<button class="gl-add" id="glAdd">\u2795 Add glossary term</button>' +
                  '<button class="gl-edit" id="glEdit"></button>';
  var note = document.createElement("div");
  note.className = "gl-note";
  note.textContent = "New terms are saved to the site for everyone and slot into the right letter automatically.";
  var status = document.createElement("div");
  status.className = "gl-status";
  content.insertBefore(bar, content.firstChild);
  bar.parentNode.insertBefore(note, bar.nextSibling);
  note.parentNode.insertBefore(status, note.nextSibling);

  function refreshBar() {
    var on = !!getToken(), b = $("#glEdit");
    b.className = "gl-edit" + (on ? " on" : "");
    b.textContent = on ? "\uD83D\uDD13 Editor mode: on \u00B7 forget token" : "\uD83D\uDD12 Editor mode";
  }
  function showStatus(msg, kind) { status.className = "gl-status show " + (kind || "info"); status.innerHTML = msg; }

  $("#glEdit").addEventListener("click", function () {
    if (getToken()) { if (confirm("Forget the saved GitHub token on this browser?")) setToken(""); }
    else openModal(true);
  });
  $("#glAdd").addEventListener("click", function () { openModal(false); });
  refreshBar();

  /* ---------- modal ---------- */
  var ov = document.createElement("div");
  ov.className = "gl-ov";
  ov.innerHTML =
    '<div class="gl-modal" role="dialog" aria-modal="true">' +
      '<h3>Add a glossary term</h3>' +
      '<div class="sub">It will be placed under the correct letter automatically.</div>' +
      '<div class="gl-tokbox" id="glTokBox">' +
        '<p>Saving requires the one-time GitHub token (fine-grained, <b>Contents: Read &amp; write</b> on DPM-KB), stored only in this browser. ' +
        'This is the same token used for the squads. ' +
        '<a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Create a token \u2192</a></p>' +
        '<div class="gl-field" style="margin-bottom:0;"><label>GitHub token</label>' +
        '<input type="password" id="glTok" placeholder="github_pat_..."></div>' +
      '</div>' +
      '<div class="gl-field"><label>Term</label><input id="glTerm" placeholder="e.g. VRF (Virtual Routing and Forwarding)"></div>' +
      '<div class="gl-field"><label>Definition</label><textarea id="glDef" placeholder="A plain-English explanation..."></textarea></div>' +
      '<div class="gl-actions">' +
        '<button class="gl-cancel" id="glCancel">Cancel</button>' +
        '<button class="gl-save" id="glSave">Save</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);

  function openModal(tokenFocus) {
    $("#glTokBox").style.display = getToken() ? "none" : "block";
    if (!getToken()) $("#glTok").value = "";
    if (!tokenFocus) { $("#glTerm").value = ""; $("#glDef").value = ""; }
    ov.className = "gl-ov show";
    setTimeout(function () { (tokenFocus ? $("#glTok") : $("#glTerm")).focus(); }, 40);
  }
  function closeModal() { ov.className = "gl-ov"; }
  $("#glCancel").addEventListener("click", closeModal);
  ov.addEventListener("click", function (e) { if (e.target === ov) closeModal(); });

  $("#glSave").addEventListener("click", function () {
    var tokInput = $("#glTok").value.trim();
    if (tokInput) setToken(tokInput);
    if (!getToken()) { showStatus("Enter a GitHub token first (box at the top of the form).", "err"); $("#glTokBox").style.display = "block"; return; }

    var entry = { term: $("#glTerm").value.trim(), def: $("#glDef").value.trim() };
    if (!entry.term || !entry.def) { showStatus("Please enter both a term and a definition.", "err"); return; }

    $("#glSave").disabled = true; $("#glSave").textContent = "Saving...";
    commit(entry).then(function (res) {
      $("#glSave").disabled = false; $("#glSave").textContent = "Save";
      if (res && res.dup) { showStatus("\u201C" + esc(entry.term) + "\u201D is already in the glossary.", "info"); closeModal(); return; }
      renderTerm(entry); addPending(entry); closeModal();
      showStatus("\u2705 Added \u201C" + esc(entry.term) + "\u201D. Others will see it within a minute or two.", "ok");
    }).catch(function (err) {
      $("#glSave").disabled = false; $("#glSave").textContent = "Save";
      var m = String(err && err.message || err);
      if (m === "auth") { showStatus("That token was rejected. Make sure it has <b>Contents: Read &amp; write</b> on DPM-KB, then set it again via Editor mode.", "err"); setToken(""); $("#glTokBox").style.display = "block"; }
      else { showStatus("Couldn't save: " + esc(m) + ". Check the branch name in glossary-data.js and the token permissions.", "err"); }
    });
  });

  /* ---------- commit ---------- */
  function commit(entry) {
    var token = getToken();
    return fetch(api() + "?ref=" + CONFIG.branch, {
      headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" }
    }).then(function (r) {
      if (r.status === 404) return { sha: null, json: { terms: [] } };
      if (r.status === 401 || r.status === 403) throw new Error("auth");
      if (!r.ok) throw new Error("read " + r.status);
      return r.json().then(function (j) { return { sha: j.sha, json: JSON.parse(b64decode(j.content)) }; });
    }).then(function (cur) {
      var data = cur.json || {}; data.terms = data.terms || [];
      var dup = data.terms.some(function (x) { return (x.term || "").trim().toLowerCase() === entry.term.toLowerCase(); });
      if (dup) return { dup: true };
      data.terms.push(entry);
      var body = {
        message: "Add glossary term: " + entry.term,
        content: b64encode(JSON.stringify(data, null, 2)),
        branch:  CONFIG.branch
      };
      if (cur.sha) body.sha = cur.sha;
      return fetch(api(), {
        method: "PUT",
        headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (r.status === 401 || r.status === 403) throw new Error("auth");
        if (!r.ok) return r.json().then(function (e) { throw new Error(e.message || ("write " + r.status)); });
        return { ok: true };
      });
    });
  }
})();
