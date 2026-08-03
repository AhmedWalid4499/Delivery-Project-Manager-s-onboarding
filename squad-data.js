/* ============================================================
   DPM-KB · Squad membership store
   ------------------------------------------------------------
   Saves squad additions into the GitHub repo itself (squads.json)
   so every visitor sees them — no Firebase, no separate backend.

   • Viewers READ squads.json via GitHub's raw CDN (no token, unlimited).
   • Editors ADD members; the change is committed to the repo through
     the GitHub API using a fine-grained token kept ONLY in their browser.

   To use on a different repo/branch, edit CONFIG below.
============================================================ */
(function () {
  "use strict";

  var CONFIG = {
    owner:      "AhmedWalid4499",
    repo:       "DPM-KB",
    branch:     "main",          // change to "master" if that's your default branch
    dataPath:   "squads.json",
    peoplePath: "people.json"
  };

  var TK   = "dpmkb_gh_token";       // localStorage: GitHub token (editor only)
  var PEND = "dpmkb_pending_adds";   // localStorage: optimistic local adds

  var key = window.SQUAD_KEY;
  if (!key) return;

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function initials(n) {
    var t = (n || "").trim().split(/\s+/);
    if (!t.length || !t[0]) return "?";
    return ((t[0][0] || "") + (t.length > 1 ? t[t.length - 1][0] : (t[0][1] || ""))).toUpperCase();
  }
  function shortCluster(c) { return c === "N&S EU (Inc. Trans)" ? "N&S EU" : (c || ""); }
  function esc(s) {
    return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
    });
  }
  function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64decode(b)  { return decodeURIComponent(escape(atob(b))); }
  function rawUrl(path, branch) {
    return "https://raw.githubusercontent.com/" + CONFIG.owner + "/" + CONFIG.repo +
           "/" + branch + "/" + path + "?cb=" + Date.now();
  }
  function api(path) {
    return "https://api.github.com/repos/" + CONFIG.owner + "/" + CONFIG.repo + "/contents/" + path;
  }

  var grid = $(".emp-grid");
  if (!grid) return;
  var accent = ((getComputedStyle($(".content-wide") || document.body)
                 .getPropertyValue("--c")) || "#FF6200").trim() || "#FF6200";

  /* ---------- render added cards ---------- */
  function existingEmails() {
    var set = {};
    Array.prototype.forEach.call(grid.querySelectorAll(".emp-email"), function (a) {
      set[(a.textContent || "").trim().toLowerCase()] = 1;
    });
    return set;
  }
  function renderCard(m) {
    if (!m || !m.email) return;
    var card = document.createElement("div");
    card.className = "emp-card";
    card.setAttribute("data-added", "1");
    card.innerHTML =
      '<div class="emp-avatar">' + esc(initials(m.name)) + '</div>' +
      '<div class="emp-info"><div class="emp-name">' + esc(m.name) + '</div>' +
      '<a class="emp-email" href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a></div>' +
      '<span class="emp-role" title="' + esc(m.cluster || "") + '">' + esc(shortCluster(m.cluster)) + '</span>';
    grid.appendChild(card);
  }
  function addMembers(list) {
    var seen = existingEmails();
    (list || []).forEach(function (m) {
      var e = (m.email || "").toLowerCase();
      if (e && !seen[e]) { renderCard(m); seen[e] = 1; }
    });
  }

  /* ---------- optimistic local cache ---------- */
  function pendingFor() {
    try { return (JSON.parse(localStorage.getItem(PEND) || "{}")[key]) || []; }
    catch (e) { return []; }
  }
  function addPending(m) {
    try {
      var p = JSON.parse(localStorage.getItem(PEND) || "{}");
      p[key] = p[key] || []; p[key].push(m);
      localStorage.setItem(PEND, JSON.stringify(p));
    } catch (e) {}
  }

  /* ---------- load squad data ---------- */
  function fetchData() {
    return fetch(rawUrl(CONFIG.dataPath, CONFIG.branch))
      .then(function (r) {
        if (r.ok) return r.json();
        if (CONFIG.branch !== "master")
          return fetch(rawUrl(CONFIG.dataPath, "master")).then(function (r2) { return r2.ok ? r2.json() : null; });
        return null;
      }).catch(function () { return null; });
  }
  fetchData().then(function (data) {
    var list = (data && data.squads && data.squads[key]) ? data.squads[key] : [];
    addMembers(list);
    addMembers(pendingFor());
  });

  /* ---------- people directory (for the add form) ---------- */
  var PEOPLE = [];
  fetch(rawUrl(CONFIG.peoplePath, CONFIG.branch))
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (p) { PEOPLE = p || []; fillDatalist(); })
    .catch(function () {});

  /* ---------- token ---------- */
  function getToken() { return localStorage.getItem(TK) || ""; }
  function setToken(t) { if (t) localStorage.setItem(TK, t); else localStorage.removeItem(TK); refreshBar(); }

  /* ---------- inject styles ---------- */
  var css = document.createElement("style");
  css.textContent =
    ".sq-addbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:26px;}" +
    ".sq-add{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;" +
      "color:#fff;background:" + accent + ";border:none;border-radius:9px;padding:11px 18px;cursor:pointer;transition:filter .15s;}" +
    ".sq-add:hover{filter:brightness(1.1);}" +
    ".sq-edit{font-size:12.5px;font-weight:600;color:#666;background:#F2F2F2;border:1px solid #E2E2E2;" +
      "border-radius:8px;padding:9px 13px;cursor:pointer;}" +
    ".sq-edit:hover{background:#EAEAEA;}" +
    ".sq-edit.on{color:#0E7A3A;background:#E6F7EF;border-color:#A8E0C2;}" +
    ".sq-note{font-size:12px;color:#999;margin-top:9px;}" +
    ".sq-status{font-size:13px;font-weight:600;margin-top:12px;padding:11px 14px;border-radius:9px;display:none;}" +
    ".sq-status.show{display:block;}" +
    ".sq-status.ok{background:#E6F7EF;color:#0E7A3A;border:1px solid #A8E0C2;}" +
    ".sq-status.err{background:#FDECEC;color:#C0392B;border:1px solid #F0B6B0;}" +
    ".sq-status.info{background:#EEF4FF;color:#1A4E8A;border:1px solid #Bcd2f5;}" +
    ".sq-ov{position:fixed;inset:0;background:rgba(10,15,25,0.55);display:none;align-items:center;" +
      "justify-content:center;z-index:9999;padding:20px;}" +
    ".sq-ov.show{display:flex;}" +
    ".sq-modal{background:#fff;border-radius:16px;max-width:440px;width:100%;padding:26px 26px 24px;" +
      "box-shadow:0 24px 70px rgba(0,0,0,0.3);max-height:90vh;overflow:auto;}" +
    ".sq-modal h3{font-size:19px;font-weight:800;color:#1A1A1A;margin-bottom:4px;}" +
    ".sq-modal .sub{font-size:13px;color:#777;margin-bottom:18px;}" +
    ".sq-field{margin-bottom:14px;}" +
    ".sq-field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:5px;}" +
    ".sq-field input{width:100%;font-size:14px;padding:10px 12px;border:1px solid #DDD;border-radius:8px;font-family:inherit;}" +
    ".sq-field input:focus{outline:none;border-color:" + accent + ";box-shadow:0 0 0 3px " + accent + "22;}" +
    ".sq-tokbox{background:#FFFBF0;border:1px solid #F0DCA0;border-radius:10px;padding:14px;margin-bottom:16px;}" +
    ".sq-tokbox p{font-size:12px;color:#7A5E1A;margin-bottom:9px;line-height:1.5;}" +
    ".sq-tokbox a{color:#B5781A;font-weight:700;}" +
    ".sq-actions{display:flex;gap:10px;margin-top:6px;}" +
    ".sq-actions button{flex:1;font-size:14px;font-weight:700;padding:11px;border-radius:9px;cursor:pointer;border:none;}" +
    ".sq-save{color:#fff;background:" + accent + ";}" +
    ".sq-save:hover{filter:brightness(1.1);}" +
    ".sq-cancel{color:#555;background:#EFEFEF;}" +
    ".sq-cancel:hover{background:#E4E4E4;}";
  document.head.appendChild(css);

  /* ---------- build add-bar ---------- */
  var bar = document.createElement("div");
  bar.className = "sq-addbar";
  bar.innerHTML =
    '<button class="sq-add" id="sqAdd">\u2795 Add DPM to this squad</button>' +
    '<button class="sq-edit" id="sqEdit"></button>';
  var note = document.createElement("div");
  note.className = "sq-note";
  note.innerHTML = "Additions are saved to the site for everyone (they appear for other people within a minute or two).";
  var status = document.createElement("div");
  status.className = "sq-status";

  var cw = $(".content-wide");
  (cw || grid.parentNode).insertBefore(bar, grid.nextSibling);
  bar.parentNode.insertBefore(note, bar.nextSibling);
  note.parentNode.insertBefore(status, note.nextSibling);

  function refreshBar() {
    var on = !!getToken();
    var b = $("#sqEdit");
    b.className = "sq-edit" + (on ? " on" : "");
    b.textContent = on ? "\uD83D\uDD13 Editor mode: on \u00B7 forget token" : "\uD83D\uDD12 Editor mode";
  }
  function showStatus(msg, kind) {
    status.className = "sq-status show " + (kind || "info");
    status.innerHTML = msg;
  }

  $("#sqEdit").addEventListener("click", function () {
    if (getToken()) { if (confirm("Forget the saved GitHub token on this browser?")) setToken(""); }
    else openModal(true);
  });
  $("#sqAdd").addEventListener("click", function () { openModal(false); });
  refreshBar();

  /* ---------- build modal ---------- */
  var ov = document.createElement("div");
  ov.className = "sq-ov";
  ov.innerHTML =
    '<div class="sq-modal" role="dialog" aria-modal="true">' +
      '<h3>Add a DPM</h3>' +
      '<div class="sub">Type a name to pick an existing DPM (email & cluster auto-fill), or enter someone new.</div>' +
      '<div class="sq-tokbox" id="sqTokBox">' +
        '<p>Saving requires a one-time GitHub token (fine-grained, <b>Contents: Read &amp; write</b> on DPM-KB). ' +
        'It is stored only in this browser. ' +
        '<a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Create a token \u2192</a></p>' +
        '<div class="sq-field" style="margin-bottom:0;"><label>GitHub token</label>' +
        '<input type="password" id="sqTok" placeholder="github_pat_..."></div>' +
      '</div>' +
      '<div class="sq-field"><label>Name</label><input id="sqName" list="sqPeople" autocomplete="off" placeholder="Start typing a name..."></div>' +
      '<datalist id="sqPeople"></datalist>' +
      '<div class="sq-field"><label>Email</label><input id="sqEmail" type="email" placeholder="name@orange.com"></div>' +
      '<div class="sq-field"><label>Cluster</label><input id="sqCluster" placeholder="e.g. N&S EU (Inc. Trans), Swiss, GEA, Benelux"></div>' +
      '<div class="sq-actions">' +
        '<button class="sq-cancel" id="sqCancel">Cancel</button>' +
        '<button class="sq-save" id="sqSave">Save</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);

  function fillDatalist() {
    var dl = $("#sqPeople"); if (!dl) return;
    dl.innerHTML = PEOPLE.map(function (p) {
      return '<option value="' + esc(p.name) + '">' + esc(p.email) + " \u00B7 " + esc(p.cluster) + "</option>";
    }).join("");
  }
  // auto-fill email + cluster when a known name is chosen
  ov.querySelector("#sqName").addEventListener("input", function () {
    var v = this.value.trim().toLowerCase();
    var hit = PEOPLE.filter(function (p) { return p.name.toLowerCase() === v; })[0];
    if (hit) { $("#sqEmail").value = hit.email; $("#sqCluster").value = hit.cluster; }
  });

  function openModal(tokenFocus) {
    $("#sqTokBox").style.display = getToken() ? "none" : "block";
    if (!getToken()) $("#sqTok").value = "";
    if (!tokenFocus) { $("#sqName").value = ""; $("#sqEmail").value = ""; $("#sqCluster").value = ""; }
    ov.className = "sq-ov show";
    setTimeout(function () { (tokenFocus ? $("#sqTok") : $("#sqName")).focus(); }, 40);
  }
  function closeModal() { ov.className = "sq-ov"; }
  $("#sqCancel").addEventListener("click", closeModal);
  ov.addEventListener("click", function (e) { if (e.target === ov) closeModal(); });

  $("#sqSave").addEventListener("click", function () {
    var tokInput = $("#sqTok").value.trim();
    if (tokInput) setToken(tokInput);
    if (!getToken()) { showStatus("Enter a GitHub token first (see the box at the top of the form).", "err"); $("#sqTokBox").style.display = "block"; return; }

    var member = {
      name:    $("#sqName").value.trim(),
      email:   $("#sqEmail").value.trim(),
      cluster: $("#sqCluster").value.trim()
    };
    if (!member.name || !member.email || member.email.indexOf("@") < 0) {
      showStatus("Please enter a name and a valid email.", "err"); return;
    }
    $("#sqSave").disabled = true; $("#sqSave").textContent = "Saving...";
    commit(member).then(function (res) {
      $("#sqSave").disabled = false; $("#sqSave").textContent = "Save";
      if (res && res.dup) { showStatus(esc(member.name) + " is already in this squad.", "info"); closeModal(); return; }
      renderCard(member); addPending(member); closeModal();
      showStatus("\u2705 Saved " + esc(member.name) + " to the squad. Others will see it within a minute or two.", "ok");
    }).catch(function (err) {
      $("#sqSave").disabled = false; $("#sqSave").textContent = "Save";
      var m = String(err && err.message || err);
      if (m === "auth") { showStatus("That token was rejected. Check it has <b>Contents: Read &amp; write</b> on DPM-KB, then set it again via Editor mode.", "err"); setToken(""); $("#sqTokBox").style.display = "block"; }
      else { showStatus("Couldn't save: " + esc(m) + ". Check the branch name in squad-data.js and the token permissions.", "err"); }
    });
  });

  /* ---------- commit to repo ---------- */
  function commit(member) {
    var token = getToken();
    return fetch(api(CONFIG.dataPath) + "?ref=" + CONFIG.branch, {
      headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" }
    }).then(function (r) {
      if (r.status === 404) return { sha: null, json: { squads: {} } };
      if (r.status === 401 || r.status === 403) throw new Error("auth");
      if (!r.ok) throw new Error("read " + r.status);
      return r.json().then(function (j) { return { sha: j.sha, json: JSON.parse(b64decode(j.content)) }; });
    }).then(function (cur) {
      var data = cur.json || {}; data.squads = data.squads || {}; data.squads[key] = data.squads[key] || [];
      var dup = data.squads[key].some(function (x) { return (x.email || "").toLowerCase() === member.email.toLowerCase(); });
      if (dup) return { dup: true };
      data.squads[key].push(member);
      var body = {
        message: "Add " + member.name + " to " + key + " squad",
        content: b64encode(JSON.stringify(data, null, 2)),
        branch:  CONFIG.branch
      };
      if (cur.sha) body.sha = cur.sha;
      return fetch(api(CONFIG.dataPath), {
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
