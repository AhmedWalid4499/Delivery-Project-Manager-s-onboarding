# DPM Knowledge Base

A static website for **Delivery Project Managers (DPMs)** in Orange Business's Europe Delivery Project Management team (part of Order to Bill). New DPMs use it to learn the role, the team, the tools and the delivery processes, and to look things up once they are working on deliveries.

The site is built from the **DPM Onboarding Handbook, Edition 1.3** ([`DPM-Onboarding-Handbook.pdf`](DPM-Onboarding-Handbook.pdf)). The home page carries the handbook in full. The other pages go deeper: networking basics, vendor hardware, the AP, WLC & Switch and WAN delivery processes, the RACI matrix, the team and squads, a glossary, and working tools (delivery checklists, email templates, a tool launcher and an Option 43 calculator).

The **Onboarding squad** maintains the site. This README is written for them.

**How it is built:** plain HTML pages, one shared stylesheet (`shared.css`) and vanilla JavaScript. There is no build step, framework or package manager. You edit a file and that edit is the change. The only generated files are `search-index.json` and `page-meta.json`, and a GitHub Actions workflow rebuilds both on every push to `main`.

## Contents

- [Before you publish: hosting and visibility](#before-you-publish-hosting-and-visibility)
- [Where to make common changes](#where-to-make-common-changes)
- [File map](#file-map)
- [Editing a page](#editing-a-page)
- [Adding a new page](#adding-a-new-page)
- [Content that lives in more than one place](#content-that-lives-in-more-than-one-place)
- [Data-driven features](#data-driven-features)
- [Live editors (squads and glossary)](#live-editors-squads-and-glossary)
- [Search index and page metadata](#search-index-and-page-metadata)
- [Local preview](#local-preview)
- [Browser storage](#browser-storage)
- [Accessibility conventions](#accessibility-conventions)
- [Open content questions for SMEs](#open-content-questions-for-smes)

---

## Before you publish: hosting and visibility

> **The site owner needs to make a decision before GitHub Pages is switched on.**

What is true of the repository today:

- The GitHub repository is **public**. Anyone can read and download every file in it, including the full git history. That is true whether or not GitHub Pages is enabled.
- `DPM-Onboarding-Handbook.pdf` is marked **"Internal Use Only"** on every page. The footers of the home page and several other pages (for example `raci.html` and `tools.html`) say "Internal Use Only" too.
- The site names Orange employees and shows their **work email addresses**. The four cluster pages list every DPM and the five squad pages list squad members. `people.json` (77 entries) and `squads.json` store names, emails and clusters. `index.html` and `org-chart.html` name the leadership, the cluster managers and the SMEs.
- Making the repository private later, or deleting files, doesn't remove copies that were already cloned, forked or cached. Deleted files also stay in the git history unless that history is rewritten.

Before the site goes live, the owner must choose one of these options:

| Option | What to know |
|---|---|
| **Host it internally**, for example on Azure Static Web Apps with Microsoft Entra ID sign-in | Only signed-in colleagues can open the site. Access rules go in a `staticwebapp.config.json` file. To limit sign-in to the Orange tenant you need your own Entra ID app registration (custom authentication, which needs the Standard plan). You also have to configure the host to serve `404.html` for missing pages. |
| **SharePoint** | The team already knows it. However, SharePoint Online normally offers `.html` files as downloads instead of displaying them as pages, so check with your SharePoint administrators before you choose it. |
| **Make the GitHub repository private** | This removes public access to the source files. Publishing a private repository with GitHub Pages needs a paid GitHub plan. The published site is still public on the internet unless the repository belongs to an organisation on GitHub Enterprise Cloud that restricts Pages access to its members. |

Whichever option you choose, two parts of the site currently depend on the repository being public:

- **Live editors.** The squad pages and the glossary read `squads.json`, `people.json` and `glossary.json` from `raw.githubusercontent.com` without signing in. Once the repository is private, those reads fail and live additions stop showing. The static page content is not affected. See [Live editors](#live-editors-squads-and-glossary).
- **Tool launcher.** The team link for every internal tool is left empty on purpose. Once the site is hosted privately, you can fill in team default links in `launcher.js`. See [Tool launcher](#tool-launcher-launcherjs).

Some requests leave the site to external hosts:

- `shared.css` loads the Sora and JetBrains Mono fonts from Google Fonts on every page.
- The live editors read from `raw.githubusercontent.com`, and they write to `api.github.com` when someone saves.

Keep these in mind if an internal host applies a Content Security Policy.

**While the repository is public,** don't commit any of these:

- more personal data, such as email addresses
- internal hostnames or URLs
- customer names or real customer data

---

## Where to make common changes

| I want to… | Edit |
|---|---|
| Fix wording on a page | That page's `.html` file |
| Change a delivery process step | The process page **and** `checklist-data.js` (see [the sync list](#content-that-lives-in-more-than-one-place)) |
| Add, move or remove a DPM | The cluster page, `index.html` (`#team` counts), `people.json`, and `org-chart.html` if a manager or SME changes |
| Change squad membership | The squad page (cards and the "N members" line) and the count on `index.html` (`#squads`) |
| Add a tool or a team default tool link | `launcher.js` (`TOOLS`), and the two tools tables in `index.html` (`#tools`) |
| Replace a starter email with official wording | `templates-data.js`: paste the wording in and set `draft: false` |
| Tell people what changed | `whats-new-data.js`: add one entry at the top |
| Add a glossary term | `glossary.html` (permanent), or the "Add glossary term" editor on the page (see [Live editors](#live-editors-squads-and-glossary)) |
| Add a page | See [Adding a new page](#adding-a-new-page) |

---

## File map

All pages sit in the repository root. The build script only indexes root-level `*.html` files, and every link on the site is relative. The **Search category** column is the category `build-search-index.ps1` gives each page in site search.

### Home and handbook

| File | Purpose | Search category |
|---|---|---|
| `index.html` | Home page. The handbook in full (01 What is a DPM · 02 Team · 03 Squads · 04 Tools · 05 Delivery process · 06 Networking · 07 Vendors · 08 First weeks · 09 Key terms), plus the daily toolkit, the latest "What's new" entries and the main search box. | Home |
| `DPM-Onboarding-Handbook.pdf` | The source handbook, Edition 1.3, marked Internal Use Only. Download links on `index.html`, `raci.html` and `org-chart.html`. | not indexed |

### Networking topics

| File | Purpose | Search category |
|---|---|---|
| `lan-wan-basics.html` | How networks are structured, how data travels and what each device does. | Networking |
| `ip-routing.html` | IP addressing, routing tables, OSPF, BGP and EIGRP. | Networking |
| `switching.html` | Switching, VLANs, STP and stacking. | Networking |
| `wireless.html` | Access points, WLCs, Wi-Fi standards, SSIDs and roaming. | Networking |
| `firewalls.html` | Next-generation firewalls, zones, NAT, IPsec VPN, SSL inspection and IPS, across the three vendors. | Networking |
| `zscaler.html` | Zscaler cloud security (ZIA / ZPA), Zero Trust and SASE. | Networking |

### Vendors and devices

| File | Purpose | Search category |
|---|---|---|
| `devices.html` | Hub page: a quick picture of Cisco, Palo Alto Networks and Fortinet, with links to each guide. | Vendors |
| `cisco.html` | Cisco switches, routers, firewalls, APs, WLCs and management platforms, with port diagrams and specs. | Vendors |
| `paloalto.html` | PA-Series firewalls, Panorama and Prisma. | Vendors |
| `fortinet.html` | FortiGate, FortiSwitch, FortiAP, FortiWLC, FortiManager and FortiAnalyzer. | Vendors |

### Processes

| File | Purpose | Search category |
|---|---|---|
| `lan-process.html` | LAN overview. Pick the AP or WLC & Switch process, with step, phase and tool counts and a key-differences table. | Process |
| `process-ap.html` | AP (wireless) migration process: 36 steps in 4 phases, with a Gantt timeline. | Process |
| `process-wlc-switch.html` | WLC & Switch migration process: 40 steps in 4 phases, with a Gantt timeline. | Process |
| `wan-process.html` | WAN / SD-WAN delivery: 14 phases (35 steps), from local validation to hand-over to operations. | Process |

### Team and squads

| File | Purpose | Search category |
|---|---|---|
| `org-chart.html` | Management chart: leadership, the four cluster managers, and the SMEs under each manager. | Team |
| `karim-elzarka.html`, `peter-sabet.html`, `maryam-etry.html`, `mona-tantawy.html` | One page per cluster (N&S EU · Inc. Trans, GEA, Benelux, Swiss · DACH). Each lists the manager and every DPM with email and SME tag. | Team |
| `automation-squad.html`, `marketing-squad.html`, `hiring-squad.html`, `onboarding-squad.html`, `presales-squad.html` | Squad members, with the "Add DPM to this squad" live editor. | Squads |
| `squad-data.js` | The squad live editor. | – |
| `squads.json` | Members added through the live editor: `{"squads": {"automation": [{"name", "email", "cluster"}], …}}`. | – |
| `people.json` | All 77 DPMs (name, email, cluster). It is used only for the squad editor's name autocomplete. | – |

### Tools

| File | Purpose | Search category |
|---|---|---|
| `checklist.html` + `checklist-data.js` | Delivery checklist: tick AP, WLC & Switch or WAN steps per project, copy a status update, export or import a backup. | Tools |
| `templates.html` + `templates-data.js` | Email and meeting-invite starter drafts for each process step, filled in from one form. | Tools |
| `tools.html` + `launcher.js` | Tool launcher: one-click links to GOLD, ServiceNow, MACHX, FLIP, and more. `launcher.js` also draws the compact toolkit row on `index.html`. | Tools |
| `option43.html` | Option 43 calculator: builds the DHCP Option 43 hex string with a byte-by-byte breakdown. | Reference |

### Reference

| File | Purpose | Search category |
|---|---|---|
| `raci.html` | RACI matrix from the handbook. | Reference |
| `glossary.html` + `glossary-data.js` + `glossary.json` | About 80 terms with a filter box. `glossary-data.js` adds the "Add glossary term" live editor, which saves new terms to `glossary.json`. | Reference |
| `resources.html` | External learning resources: vendor docs, training and standards. | Reference |
| `whats-new.html` + `whats-new-data.js` | Release notes, plus the ten most recently updated pages (from `page-meta.json`). | Reference |

### Infrastructure

| File | Purpose |
|---|---|
| `shared.css` | All shared styles and the design tokens (`:root`). |
| `shared.js` | The last script on every page. It loads `search.js`, `kb-ui.js` and `assistant.js`, and holds small helpers used by `wireless.html` (vendor tabs, port tooltips). It also contains a `NAV_HTML` template that **no page uses** (see [Editing a page](#editing-a-page)). |
| `kb-ui.js` | Experience layer added to every page: hero search button, themed hero background icons (`PAGE_ICONS`), heading anchors, the "On this page" contents box, reading progress bar, back-to-top button, table wrappers, code copy buttons, mobile menu, reveal-on-scroll, and the "Updated … · What's new" stamp. |
| `search.js` | Site search: a "Search" pill in the nav, and an overlay opened with Ctrl K or any `[data-kb-open]` / `[data-kbq]` element. Reads `search-index.json`. |
| `assistant.js` | AI assistant: a floating, resizable "Ask the DPM Assistant" button (bottom-right) on every page that opens a chat, plus the full-window two-pane app rendered on `assistant.html`. Each user brings their own Anthropic API key; answers stream in and render as Markdown; multiple chats are saved per-browser. See [AI assistant](#ai-assistant-assistantjs). |
| `assistant.html` | The assistant's full-window page: the standard scaffold plus a `#kb-assistant-page` container (and `data-kb-assistant="page"` on `<body>`) that tells `assistant.js` to render the two-pane chat app instead of the corner bubble. Linked from the home toolkit. |
| `panel-data.js` | `window.KB_PANELS`: the front/rear port inventory of every device drawn on `cisco.html`, `paloalto.html` and `fortinet.html`, taken from the vendor data sheet or hardware installation guide cited in each entry. The header comment explains how to add or edit a device and the numbering rules (odd ports on the top row, even below, in groups of 12). |
| `panels.js` | `window.KBPanels`: on DOM ready it draws every `<div class="port-diagram-wrap" data-panel="<id>">` from `panel-data.js` as a realistic front/rear panel (Front/Rear tabs, grouped two-row port grids, SFP/QSFP cages, module slots, PSUs, fans, legend, source link and confidence note), injecting its own scoped CSS once. Load `panel-data.js` then `panels.js` before `shared.js`. |
| `search-index.json` | **Generated.** Full text of every page, plus every glossary term. |
| `page-meta.json` | **Generated.** Title and last-updated date of every page. |
| `build-search-index.ps1` | Generates the two files above. |
| `.github/workflows/rebuild-search-index.yml` | Runs the script on every push to `main` and commits the result. |
| `404.html` | "Page not found" page with search and "did you mean" suggestions. It is not indexed. |
| `favicon.svg` | Site icon. |
| `README.md` | This file. |

---

## Editing a page

### Workflow

1. Edit the file, either on GitHub or in a local clone. Save pages as UTF-8, because they use emoji and typographic dashes.
2. Preview it locally (see [Local preview](#local-preview)). Open the browser console (F12) and check that there are no errors.
3. Commit to `main`. The workflow then rebuilds `search-index.json` and `page-meta.json` for you.
4. If readers will notice the change, add an entry to `whats-new-data.js` (see [What's new](#whats-new-whats-new-datajs)).

### Page scaffold rules

**Start every new page from a copy of `raci.html`.** It is the reference scaffold:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page Name — DPM Knowledge Base</title>
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="stylesheet" href="shared.css">
<style>/* styles for this page only */</style>
</head>
<body>

<nav class="topnav"> … copied unchanged from raci.html … </nav>

<div class="page-hero dark">
  <div class="hero-content">
    <div class="hero-tag">📋 DPM Reference</div>
    <h1>The <span>Highlighted</span> Title</h1>
    <p class="hero-sub">One or two sentences on what this page is for.</p>
  </div>
</div>

<div class="content">
  <div class="section">
    <div class="section-header">
      <h2>Section title</h2>
      <div class="divider"></div>
      <p>Short intro to the section.</p>
    </div>
    …
  </div>
</div>

<footer class="footer">
  <p>DPM <span>Knowledge Base</span> &nbsp;·&nbsp; Onboarding Handbook Ed.&nbsp;1.3 &nbsp;·&nbsp; Internal Use Only</p>
</footer>
<script src="shared.js"></script>
</body>
</html>
```

The rules:

- **Title.** Use `Page Name — DPM Knowledge Base` (with an em dash). The build script strips the suffix after the dash to get the name shown in search and in `page-meta.json`. The process pages use `— DPM Process Guide`.
- **Favicon and stylesheet.** Every page has the same two `<link>` lines. Put page-only CSS in a `<style>` block in the `<head>` and use the tokens from `shared.css` (`var(--orange-dark)`, `var(--gray-dark)`, and so on) rather than new hex values.
- **Navigation.** Every page, including `404.html`, has the **same hard-coded `<nav class="topnav">` block** with the same nine links: Home, LAN / WAN, IP Routing, Switching, Wireless, Firewalls, Zscaler, Devices, Glossary. If the page is one of those nine, add `active` to its link (`class="nav-link active"`). The `NAV_HTML` template in `shared.js` only runs on a page with a `#topnav-placeholder` element, and no page has one. So to change the navigation you must edit the block in **every** `.html` file.
- **Hero.** Most pages use `.page-hero dark` > `.hero-content` > `.hero-tag`, `<h1>` (a `<span>` in the h1 is shown in orange) and `.hero-sub`. The variants are:
  - `.cisco-hero`, `.palo-hero` and `.fort-hero` on the vendor pages
  - `.proc-hero` on the process pages
  - `.sq-hero` on squad pages
  - `.mgr-hero` on cluster pages
  - `.kb-hero` on the home page only
- **Content wrapper.** Use `.content` (960 px wide) or `.content-wide` (1,100 px). The process pages use `.proc-content`. `kb-ui.js` only adds the contents box, heading anchors and table wrappers inside one of these three.
- **Headings.** Use one `<h1>`, in the hero. Use `<h2>` for sections and `<h3>` for subsections. `kb-ui.js` builds the "On this page" box from the `h2` and `h3` headings when there are at least three. It gives each heading an id from its text, so **if you link to a section, give the heading or section an explicit `id`**, because auto-generated ids change when the wording does.
- **Scripts.** Put data and page scripts **before** `shared.js`, and make `shared.js` the **last** script (for example: `launcher.js`, `whats-new-data.js`, then `shared.js`). Every page follows this today, including the squad pages (`squad-data.js`) and `glossary.html` (`glossary-data.js`).
- **Footer.** Use the footer line shown above, copied from `raci.html`. The home page and the newer pages use it. The older topic, vendor, process, team and squad pages still have a shorter footer that links back to Home (or to Squads / LAN Process).
- **Reusable blocks** from `shared.css`:
  - `.alert.orange|green|blue|purple` (an `.alert-icon` plus a `<p>`)
  - `.card`, `.grid-2`, `.grid-3` and `.grid-auto`
  - `.topic-nav` / `.topic-nav-card`
  - `.data-table`
  - `.code-block`
  - `.glossary-grid` / `.glossary-item`

**What you don't need to build by hand**, because `kb-ui.js` and `search.js` add it to every page:

- The search button in the hero, and the nav Search pill.
- The contents box.
- Heading anchors.
- The progress bar and back-to-top button.
- The mobile menu, which copies the nav links.
- Horizontal scrolling for tables. `kb-ui.js` wraps any table in `.kb-tablewrap`.
- Copy buttons on `.code-block` elements.
- The "Updated …" stamp.

### Browser caching of scripts

`shared.js` loads `search.js?v=6`, `kb-ui.js?v=10` and `assistant.js?v=4`. **When you change `search.js`, `kb-ui.js` or `assistant.js`, increase that number in `shared.js`** so that browsers fetch the new copy. Other files are not versioned. If an edit doesn't show up, do a hard refresh (Ctrl F5).

### Before you push

- Preview the page locally with the browser console open.
- **Data files** (`checklist-data.js`, `templates-data.js`, `whats-new-data.js`, `launcher.js`) are plain ES5, so Windows can syntax-check them with no extra tools. Run this from the repository folder in PowerShell:

  ```powershell
  cscript //nologo '//E:{16d51579-a30b-4c8b-a276-0ff4dc41e755}' checklist-data.js
  ```

  If the output is `JavaScript runtime error: 'window' is undefined`, the syntax is fine. If it is `JavaScript compilation error` with a line and column, fix that spot. The engine only understands ES5, so it can't check `shared.js`, which uses newer syntax.
- If you changed `kb-ui.js` or `search.js`, increase the `?v=` number in `shared.js`.
- If you changed `build-search-index.ps1`, run the checks in [Search index](#search-index-and-page-metadata).
- The repository is public: check that you haven't added emails, internal hostnames or URLs, or customer data.

---

## Adding a new page

1. **Scaffold.** Copy `raci.html` to a new root-level file named in lowercase with dashes, such as `my-topic.html`. Change the `<title>`, hero and content. Delete the RACI-specific `<style>` rules. Keep the nav block and the footer as they are.
2. **Hero icons.** In `kb-ui.js`, add the page to `PAGE_ICONS`. The key is the file name without `.html`, and the value is up to four names from the `ICONS` map just above it (`globe`, `wifi`, `shield`, `lock`, `cloud`, `server`, `sw`, `nodes`, `route`, `book`, `list`, `chip`, `flame`, `signal`, `check`, `key`, `eth`):

   ```js
   "my-topic":           ["book", "list", "nodes", "globe"],
   ```

   This applies to `.page-hero` and `.proc-hero` pages. Then increase `kb-ui.js?v=` in `shared.js`.
3. **Search category.** In `build-search-index.ps1`, add the file name to the matching line in `Get-Category`:
   - `Networking`, `Vendors`, `Process`, `Tools`, `Reference` or `Team`.
   - Pages ending in `-squad.html` are matched as `Squads` automatically.
   - Any page you don't add gets the category `Page`.

   **Keep the file pure ASCII.** If you invent a new category, also add it to the `CAT` map in `search.js` (tile colour `c`, an AA text colour `t` with at least 4.5:1 on white and on #FFE8D6, and an icon; increase `search.js?v=`) and to `CAT_ICON` in `404.html`.
4. **Link it.** Add a card or link in the right section of `index.html`, for example a `.topic-nav-card` under `#networking` or in the `#toolkit` grid. Also link it from related pages. Only add it to the top nav if it is a top-level topic, because that means editing the nav block in every page.
5. **Announce it.** Add a `New` entry to `whats-new-data.js`.
6. **Push.** The workflow adds the page to search, to the "did you mean" suggestions on `404.html` and to `page-meta.json`. To see search results before you push, run the build script locally.

---

## Content that lives in more than one place

Several facts appear on more than one page. When one of them changes, update every place listed:

| What changed | Primary place | Also update |
|---|---|---|
| **A process step** (AP, WLC & Switch, WAN) | The step cards on `process-ap.html`, `process-wlc-switch.html` and `wan-process.html` | `checklist-data.js` (same wording; keep the step `id`, see below)<br>The `step` quotes in `templates-data.js`<br>The step / phase / tool counts and the key-differences table on `lan-process.html`<br>The lifecycle strip and the "AP vs WLC / Switch" table in `index.html` (`#processes`)<br>The handbook PDF is the source; raise any difference with the SMEs (see [Open content questions](#open-content-questions-for-smes)) |
| **The team** (people, counts, SMEs, managers) | The four cluster pages: the full DPM list, the "N team members" line and the `DPM / SME` tags | `index.html` `#team`: the leadership strip, the team stats (77 DPMs · 4 clusters · 4 SMEs · 5 squads) and the cluster cards (DPM count and SME names)<br>`org-chart.html`: leaders, cluster managers and SMEs<br>`people.json`: every DPM's name, email and cluster, used by the squad editor's autocomplete |
| **Squad members** | The five `*-squad.html` pages: the static cards and the "N members" line | `squads.json`: the live additions shown on top of the static cards<br>`index.html` `#squads`: the member count on each squad card, and "Cross-team squads" in `#team` |
| **Tool descriptions** | `launcher.js` (`TOOLS[].purpose`) | The two tools tables in `index.html` (`#tools`)<br>The matching entries in `glossary.html` |
| **Glossary size** | `glossary.html` (80 terms today) | "80+ terms", which appears twice in `index.html`<br>The 10 short definitions in `index.html` (`#key-terms`) |
| **Navigation** | The `<nav class="topnav">` block | Every `.html` file, including `404.html` |
| **Handbook edition** | `DPM-Onboarding-Handbook.pdf` | The footers that say "Onboarding Handbook Ed. 1.3", the home hero tag and download banner, and the handbook links on `raci.html` and `org-chart.html`. Search the repository for `1.3`. |

Live additions do **not** update any counts. At the time of writing, `squads.json` holds one live addition to the Automation squad. So `automation-squad.html` shows five cards, while its "N members" line and the home page both still say 4. From time to time:

1. Copy live additions into the static cards on the squad page.
2. Update the counts.

Leaving an entry in `squads.json` after you have copied it is harmless, because cards are de-duplicated by email.

---

## Data-driven features

### Delivery checklist (`checklist-data.js`)

`checklist.html` builds its checklists from `window.KB_CHECKLISTS` in `checklist-data.js`. There is one entry per delivery type:

- `ap` comes from `process-ap.html`
- `wlc` comes from `process-wlc-switch.html`
- `wan` comes from `wan-process.html`

The step texts mirror the process pages word for word. If you change a step on a process page, change it here too.

**Step ids are permanent.** Everyone's saved ticks are stored under ids such as `ap.p2.s07`.

- **Rewording a step:** edit `text` only. Everyone keeps their ticks.
- **Adding a step:** give it a **new** id, the next unused number in that phase (for example `ap.p2.s15`), even if you insert it in the middle. The number shown on screen comes from the step's position.
- **Removing a step:** delete it. Old ticks for it are ignored.
- **Never** change, renumber or reuse an existing id.

Other fields:

- LAN steps use `team`. WAN steps use `owner` (OB / Carrier / Customer / Courier …), and WAN phases also carry a `stage` (A–D).
- Optional fields: `note` (a short tip), `tools` (an array of tool names) and `link` (`{ href: "page.html", label: "…" }`, pages on this site only).
- Update `updated: "YYYY-MM-DD"` at the top whenever you change steps.

Other things to know:

- **Deep links:** `checklist.html?type=ap`, `?type=wlc` or `?type=wan`. The process pages link to these.
- **Where progress is saved:** only in the viewer's browser (`dpmkb_checklists_v1`). Users move it between devices with **Export backup** / **Import backup**, which produces a `dpm-checklists-backup-YYYY-MM-DD.json` file.

### Email templates (`templates-data.js`)

`templates.html` renders `window.KB_TEMPLATES` from `templates-data.js`. You don't need to change any other file. The header comment in that file is the full reference. In short:

- **Every template is a starter draft.** They were written from the handbook's process steps and are **not** the team's official wording. Templates default to `draft: true`, which shows a "Draft" tag. When the team agrees official wording, paste it in and set `draft: false`. The warning banner at the top of the page disappears once no drafts are left. Today all 24 templates are drafts.
- **`fields`** are the form inputs: `key`, `label`, `placeholder`, `group`, and optionally `hint` and `multiline`.
  - In text, write `{{key}}` to insert a value.
  - If a field is left blank, the copied text shows `[label]` instead.
  - Text in `[square brackets]` is a note the sender must complete or delete. The page highlights it.
- **`templates`** have these properties:
  - `id`: unique; used in links such as `templates.html#tmpl-<id>`
  - `process`: `ap`, `wlc`, `wan`
  - `phase`: one of the four `phases` names
  - `kind`: `email` or `invite`
  - `audience`: `customer`, `internal` or `mixed`
  - `step`: a quote from the process page
  - `to` / `cc`: **roles, never addresses**
  - `subject`
  - `body`: an array of lines, where `""` is a blank line
- **Links:** `templates.html?process=ap|wlc|wan` (and `&phase=`) opens a filtered view. The process pages link to it.
- **Writing rules:** use international / British English. Customer-facing text must not use internal tool names (GOLD, SALTO, MACHX, FLIP, ServiceNow / SNOW, VPO, TIM) and must explain UAT, HOTO, DMARC and CAB.
- The field values a viewer types are saved only in their browser (`dpmkb_tpl_fields`).

### Tool launcher (`launcher.js`)

The `TOOLS` array near the top of `launcher.js` defines every tool. Each entry has these fields:

- `id`: unique; lowercase `a-z`, `0-9`, `-`; at most 40 characters
- `name`
- `short` (optional): used on compact chips
- `purpose`
- `emoji`
- `group`: must be one of the `GROUPS` names, `Delivery` or `Reporting, time & automation`
- `url`

`launcher.js` renders every `[data-kb-launcher]` element on a page: `"full"` on `tools.html` and `"compact"` on the `index.html` toolkit. Load it before `shared.js`.

- **Team defaults and the public repository.** `url` is the team default link everyone sees until they set their own. Because the repository is public, only generic public entry points (Power BI, Power Automate) have a URL, and **every internal tool has `url: ""`**. **Don't add internal hostnames or intranet URLs while the repository is public.** Once the site is hosted privately, fill them in with full `https://` addresses.
- **Per-viewer links.** Each viewer can use **Set my links** on `tools.html` (or go to `tools.html#edit`) to save their own link for each tool. These links are stored only in that browser (`dpmkb_tool_links`) and override the team default. Only `http(s)` links are accepted, with no username or password in them.
- **Don't rename an `id`.** Saved links are keyed by it, so viewers would lose the link they set.

### What's new (`whats-new-data.js`)

`whats-new-data.js` feeds both `whats-new.html` and the "What's new" list on the home page. To add an entry, copy this block to the **top** of `KB_WHATS_NEW` (newest first) and keep the comma after `}`:

```js
{
  date:  '2026-10-15',          // YYYY-MM-DD, the day it went live
  tag:   'New',                 // 'New' | 'Improved' | 'Fixed'
  title: 'Short, plain-English name of the change',
  desc:  'One or two sentences: what changed for a DPM and why it helps.',
  links: [{ href: 'page.html', label: 'Open the page' }]   // or [] for none
},
```

The rules:

- **Plain text only**, because everything is escaped when shown. Inside `'…'` strings, write apostrophes as `’` or `\'`.
- **Links** go to pages on this site (`raci.html`, `index.html#tools`) or to full `https://` addresses. Only link to pages that exist. The first link is the one used on the home page list.
- **Dates:** entries with the same date are shown as one release. Entries 21 days old or less get a "Recent" dot automatically. An entry with an invalid date or no title is skipped silently.
- **Publishing:** there is nothing to rebuild. The page reads the file directly.

### "Updated" stamps (`page-meta.json`)

`build-search-index.ps1` writes `page-meta.json`:

```json
{
  "generated": "YYYY-MM-DD",
  "pages": {
    "raci.html": {"title": "RACI Matrix", "updated": "YYYY-MM-DD"}
  }
}
```

The `updated` value is set like this:

- Normally it is the date of the last git commit that touched the file. Any commit counts, including small fixes.
- If the file has uncommitted changes or isn't tracked yet, it is today's date.
- If git isn't available, it is the file's modified time.

`404.html` is left out. The file is used in two places:

- `kb-ui.js` adds "Updated D Mon YYYY · What's new →" to every page hero.
- `whats-new.html` lists the ten most recently updated pages.

If the file is missing, both features hide themselves quietly. **Don't edit it by hand.** It is regenerated on every push.

### AI assistant (`assistant.js`)

`assistant.js` adds a floating **"Ask the DPM Assistant"** button in the bottom-right corner of every page (bootstrapped by `shared.js`, after `kb-ui.js`, so there are no per-page edits). It opens a chat panel that can explain anything on the site — networking, the delivery process, the tools — in plain language. The current page's title, path and main readable text are sent as context with each question, so the assistant can help the reader understand what they are looking at. Answers **stream in** and render as Markdown (headings, bold, lists, **GitHub-flavoured tables**, task-list checkboxes, inline code, fenced code blocks with a copy button), like ChatGPT or Claude.

- **It searches the whole Knowledge Base (retrieval + citations).** On first use it fetches `search-index.json` once (the same index site search uses) and caches it. For each question it scores the index the same way `search.js` does, picks the top ~3–4 distinct pages (excluding the current page, at most one glossary entry), takes the most relevant ~1,200–1,500 characters of each, and adds them to the system prompt under a **"RELEVANT KNOWLEDGE BASE PAGES"** section alongside the (slightly smaller) current-page context. The persona tells the model to answer primarily from those pages and to **cite each page it uses with an inline Markdown link to its path** (for example `[Wireless](wireless.html)`), and never to invent pages or links. A small **"Pages searched"** row of chips linking to the retrieved pages appears under a completed answer. If the index can't be loaded, it falls back silently to current-page-only context, exactly as before.
- **Ask it from the search box (hand-off).** The Ctrl K search overlay shows a first row — **"✨ Ask the DPM Assistant about …"** — on any non-empty query. Selecting it (click or Enter) closes the overlay and calls `window.KBAssistant.ask(query)`. If `assistant.js` hasn't loaded yet, the row's own `href` is a working fallback to `assistant.html?q=<query>`. The top page result stays the default selection, so Enter still opens the best page as before.
- **Public API and deep link.** As soon as it initialises, `assistant.js` exposes **`window.KBAssistant`** with `open()` and `ask(text)`. `ask(text)` opens the assistant (panel in the corner, or the conversation on `assistant.html`), ensures a chat exists, drops the text into the composer and submits it; if no API key is set yet it opens settings and keeps the text ready in the composer for after the key is saved. On load it also reads a **`?q=`** (or `?ask=`) query parameter, asks it once, and strips the parameter from the URL with `history.replaceState` so a refresh doesn't resend. This is what the search hand-off and links such as `assistant.html?q=Option%2043` use.

**Bring your own key.** The assistant has no shared or built-in key — the repository is public, so none can be committed. Each reader opens the panel, enters **their own personal Anthropic API key** and, optionally, a **workspace id (workid)**, and picks a model. All of this is stored only in their own browser (see [Browser storage](#browser-storage)); nothing is sent anywhere except directly from their browser to Anthropic.

- **Resizable and readable.** On desktop, drag the panel's **top-left corner** (pointer or keyboard — the handle is a `role="separator"` with Arrow-key resizing in 24px steps) to make it bigger or smaller, clamped between ~320×380 and ~`min(96vw,900)`×`92vh`; a **maximize/restore** button toggles a large docked size. An **A-/A+** control scales just the message text (not the chrome) via the `--kba-fontscale` custom property. The chosen size, maximized state and text size are remembered in `localStorage` key **`dpmkb_assistant_ui`** (`{w,h,maximized,fontScale}`). On phones the panel stays near-fullscreen regardless.
- **Multiple saved chats.** Conversations are kept in `localStorage` key **`dpmkb_assistant_chats`** (`{version,activeId,chats:[{id,title,created,updated,messages}]}`) — up to 50 chats, ~200 messages each. Open the **Chats** list (header) to switch, rename (inline) or delete a chat, or start a **New chat**; titles auto-fill from the first message. The system prompt and page context are rebuilt per request, never stored. On first load with this version, a non-empty legacy `dpmkb_assistant_thread` is **migrated once** into a single chat (the old key is left untouched but is no longer the source of truth). **Saved chats live only in this browser on this device — they are not synced or shared.**
- **Full-window page (`assistant.html`).** A dedicated page (marked with `data-kb-assistant="page"`) where `assistant.js` renders a full-window two-pane app — a saved-chats sidebar on the left, the conversation on the right — using the **same** chats data, settings, streaming and Markdown as the corner bubble (shared code, not a fork). The corner panel's **⤢ Open in full window** button opens it in a new tab; the corner FAB/panel is suppressed on that page. Both read the same `localStorage`, so chats and settings stay consistent (there is no live cross-tab sync, but a `storage` event refreshes the list, and state is correct after reopen).

- **How a request is made.** It calls `POST https://api.anthropic.com/v1/messages` with `x-api-key`, `anthropic-version: 2023-06-01` and, crucially, **`anthropic-dangerous-direct-browser-access: true`** — without that last header the browser blocks the call with a CORS error. The optional **workid** is sent as the **`anthropic-workspace-id`** header on each request (required when the key is not workspace-scoped; a workspace-scoped key ignores it). The endpoint can be overridden under **Advanced**, defaulting to the address above.
- **Models offered.** Claude Opus 5.5 (`claude-opus-5-5`, default, most capable), Claude Sonnet 5 (`claude-sonnet-5`, balanced) and Claude Haiku 4.5 (`claude-haiku-4-5`, fastest).
- **Security caveats.** The key is stored in `localStorage` (`dpmkb_assistant_cfg`) **in plain text**, where any script on the same origin — and anyone with access to the browser — can read it. The panel's settings make this clear and offer a **Clear key** button. Readers should use their own personal key, never a shared or production one. Because the repository is public, never hard-code a key, a workspace id or an endpoint in `assistant.js`.
- **To change the persona or the models.** Edit `assistant.js`: `PERSONA` is the system prompt that sets how the assistant answers (plain-language, British English, cite KB pages, no invented Orange-internal specifics); `MODELS` / `DEFAULT_MODEL` are the models in the settings dropdown. The Markdown renderer (`mdToHtml`) is a small, dependency-free function in the same file that escapes all model output **first**, then formats it (including GFM pipe tables wrapped in a horizontal-scroll container and task-list checkboxes). Links are restricted to `http(s)` URLs **and** bare site-relative `.html` paths (so the model's `[Wireless](wireless.html)` citations work); `javascript:`, `data:` and protocol-relative links are rejected. The retrieval helpers (`ensureKbIndex`, `kbRetrieve`, `buildSystem`) live in the same file. After editing, bump `assistant.js?v=` in `shared.js` (see [Browser caching of scripts](#browser-caching-of-scripts)).
- **No libraries, ES5-friendly.** Like the other scripts it uses no frameworks and is written to pass the Chakra ES5 check, although it relies on the real browser for `fetch` streaming, `AbortController` and `TextDecoder`.

---

## Live editors (squads and glossary)

### How they work

- Each squad page sets `window.SQUAD_KEY` (`automation`, `marketing`, `hiring`, `onboarding` or `presales`) and then loads `squad-data.js`. `glossary.html` loads `glossary-data.js`.
- **Reading.** On page load, the script fetches the JSON file from `raw.githubusercontent.com` (branch `main`, falling back to `master`). It then adds any entries that aren't already on the page: squad members are matched by email, glossary terms by name (case-insensitive). The squad editor also fetches `people.json` so it can suggest names and fill in email and cluster.
- **Writing.** The editor clicks **Add DPM to this squad** or **Add glossary term**. The first time they save, they paste a **GitHub token** into a password field. The token is stored in plain text in that browser's `localStorage` under **`dpmkb_gh_token`**, and both editors share it. The script then:
  1. reads the file through the GitHub REST API (`/repos/…/contents/…`)
  2. appends the entry
  3. writes it back with a commit **straight to `main`** (for example "Add … to automation squad" or "Add glossary term: …")

  There is no review step: the change is live for everyone within a minute or two. That commit also triggers the search-index rebuild, so new glossary terms become searchable.
- **Signing out.** The **Editor mode** button shows whether a token is saved. When a token is saved, clicking it offers to forget the token.
- **Configuration.** Both scripts have a `CONFIG` block (`owner`, `repo`, `branch`, file paths). Update it if the repository is renamed, moved or changes its default branch.

### Security recommendations

A token with write access can change **any** file in the repository. The page only limits what its own form sends, and the token sits unencrypted in `localStorage`, where any script running on the same origin can read it. On GitHub Pages, all project sites of the same account share one origin (`<account>.github.io`), so they also share `localStorage`.

If you keep the editors:

- Use a **fine-grained personal access token**. In GitHub, go to Settings → Developer settings → Personal access tokens → Fine-grained tokens and set:
  - **Repository access:** "Only select repositories", with only this repository selected.
  - **Repository permissions:** **Contents: Read and write** and nothing else. Metadata: Read-only is added automatically.
  - **Expiration:** short, for example 7–30 days.
- **Never use a classic token.** Its `repo` scope gives access to every repository the account can reach.
- If this repository isn't offered under "Only select repositories" for your account, ask the owner. Don't fall back to a classic token.
- Click **Editor mode → forget token** when you finish, and always on a shared computer. Revoke tokens you no longer need.
- If `main` is protected in a way that blocks direct pushes, the editors' saves are rejected, just like the workflow's commit.

**Consider replacing the editors with a form-based workflow.** For example, people submit additions through a GitHub issue form or a Microsoft Form, and a maintainer updates the page. This removes tokens from browsers, adds a review step, and keeps working after the site moves to private hosting.

### Known limitations

- **There is no remove button.** To remove an entry, edit `squads.json` or `glossary.json` in the repository. Each browser also keeps its own additions in `dpmkb_pending_adds` / `dpmkb_pending_glossary` and shows them until that browser's site data is cleared, even after you remove them from the JSON file.
- **Live additions don't update counts.** They change neither the "N members" line nor the home page counts (see [the sync list](#content-that-lives-in-more-than-one-place)).
- **They need a public repository.** Reads from `raw.githubusercontent.com` only work while the repository is public.
- **Local preview writes to the real repository.** A local preview still reads and writes the real repository on GitHub, not your local files.

---

## Search index and page metadata

`build-search-index.ps1` writes two files:

- **`search-index.json`** holds, for every root-level page except `404.html`: its title, category, headings (`h1`–`h4`) and up to 12,000 characters of body text (with the nav, footer, scripts and styles removed). It also holds every glossary term: those in `glossary.html`, plus live terms from `glossary.json` that `glossary.html` doesn't already define. `search.js` and the 404 suggestions read this file.
- **`page-meta.json`** is described under ["Updated" stamps](#updated-stamps-page-metajson).

### Automatic rebuild (CI)

`.github/workflows/rebuild-search-index.yml` runs on **every push to `main`**. Pushes that change only the two generated files are ignored. You can also start it by hand from the Actions tab (**Rebuild search index → Run workflow**). The workflow:

1. checks out `main` with full history, so git dates are real
2. runs the script with PowerShell 7 on Linux
3. if either file changed, commits it as `github-actions[bot]` with the message `chore: rebuild search index`

The live editors also commit to `main`. If the push is rejected because `main` has moved, the workflow rebases, rebuilds and retries up to three times. The commit message deliberately leaves out `[skip ci]`, so a branch-published GitHub Pages site still redeploys.

In short, you don't need to run the script before pushing.

### Running it by hand

Run it from the repository folder when you want to preview search or the "Updated" stamps locally:

```powershell
# Windows PowerShell 5.1
powershell -ExecutionPolicy Bypass -File build-search-index.ps1
# PowerShell 7 (any OS)
pwsh -NoProfile -File build-search-index.ps1
```

It prints `search-index.json rebuilt - N entries.` and `page-meta.json rebuilt - N pages.` The script writes identical output on PowerShell 5.1 and 7, so committing a local run is fine. The only difference is that a local run dates any file with uncommitted changes as today. The workflow then rebuilds from `main` anyway.

If you get a merge conflict in either generated file, take either version and re-run the script, or just push and let the workflow regenerate it.

### Rules for editing `build-search-index.ps1`

- **Keep it pure ASCII.** Windows PowerShell 5.1 reads a BOM-less script as ANSI, so a single em dash can break it. Build non-ASCII characters with `[char]0x2014` and similar, as the script already does.
- **It must run on both Windows PowerShell 5.1 and PowerShell 7**, because CI runs `pwsh` on Linux. That rules out:
  - the `?:` ternary
  - `??`
  - `&&` / `||`
  - `ConvertFrom-Json -AsHashtable`
- **JSON output.** JSON is written by the script's own small writer (not `ConvertTo-Json`), as UTF-8 without a BOM, with pages sorted ordinally, so the output doesn't churn between runs.
- **Checks.** After editing, run both of these. Each should print `0`:

  ```powershell
  @([IO.File]::ReadAllBytes("$PWD\build-search-index.ps1") | Where-Object { $_ -gt 127 }).Count      # non-ASCII bytes
  $e = $null; [void][System.Management.Automation.Language.Parser]::ParseFile("$PWD\build-search-index.ps1", [ref]$null, [ref]$e); $e.Count   # parse errors
  ```

### One-time GitHub settings

1. **Settings → Actions → General → Actions permissions:** allow Actions to run. The workflow uses `actions/checkout@v4`.
2. On the same page, under **Workflow permissions:** choose **Read and write permissions** and save. The workflow file also requests `contents: write`.
3. **Settings → Branches / Rules:** if `main` has a branch protection rule or ruleset that blocks direct pushes, allow **`github-actions[bot]`** to push to `main`. Otherwise the rebuild commit is rejected. The live editors push to `main` too.
4. Start the workflow once by hand from the Actions tab, and check that it finishes green.

---

## Local preview

Pages load `search-index.json` and `page-meta.json` with JavaScript, and browsers block that on `file://` pages. Search, the "Updated" stamps and "Recently updated pages" would all be missing if you opened the files directly, so preview through a small local web server instead. The snippet below needs nothing but Windows PowerShell 5.1 (or PowerShell 7).

**Step 1: start the server.** Open PowerShell **in the repository folder**, paste the whole block and press Enter:

```powershell
& {
  $ErrorActionPreference = 'Stop'
  $port  = 8080                                    # change this if the port is busy
  $root  = (Get-Location).Path.TrimEnd('\') + '\'
  $types = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'
              '.js'='text/javascript; charset=utf-8'; '.json'='application/json; charset=utf-8'
              '.svg'='image/svg+xml'; '.pdf'='application/pdf'; '.png'='image/png' }
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("http://localhost:$port/")
  $listener.Start()
  Write-Host "Serving $root at http://localhost:$port/  (press Ctrl+C to stop)"
  try {
    while ($true) {
      $task = $listener.GetContextAsync()
      while (-not $task.AsyncWaitHandle.WaitOne(500)) { }   # lets Ctrl+C through
      $ctx  = $task.GetAwaiter().GetResult()
      $rel  = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if (-not $rel) { $rel = 'index.html' }
      $file = [IO.Path]::GetFullPath((Join-Path $root $rel))
      $code = 200
      if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or
          -not (Test-Path -LiteralPath $file -PathType Leaf)) {
        $file = Join-Path $root '404.html'; $code = 404
      }
      $ext   = [IO.Path]::GetExtension($file).ToLowerInvariant()
      $bytes = [IO.File]::ReadAllBytes($file)
      $ctx.Response.StatusCode  = $code
      $ctx.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' })
      $ctx.Response.Headers.Add('Cache-Control', 'no-store')
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $ctx.Response.Close()
    }
  } finally { $listener.Close() }
}
```

**Step 2: open the site.** Go to **http://localhost:8080/** in your browser, or run `Start-Process http://localhost:8080/` from a second PowerShell window.

**Step 3: stop the server.** Press **Ctrl+C** in the server window.

Things to know:

- Missing pages get `404.html` with a 404 status, as on GitHub Pages.
- The server doesn't cache, so a normal refresh shows your edits.
- To see your local changes in search and in the "Updated" stamps, run `build-search-index.ps1` first.
- The squad pages and the glossary still read live data from the public repository on GitHub, and their editors still write to it.
- `404.html` rewrites relative links through a `<base href>`:
  - On a `*.github.io` project site, it points them at the repository folder.
  - Everywhere else, including `localhost`, it uses the site root `/`.

  If the site is ever served from a sub-folder on another host, update that logic at the top of `404.html`.

---

## Browser storage

Everything the site stores lives only in the viewer's own browser (per device and per browser profile) in `localStorage`. The site never uploads any of it, with one exception: when someone saves in a live editor, the token in `dpmkb_gh_token` is sent to the GitHub API to make the commit. Each script also handles storage being unavailable (for example in a private window).

| Key | Set by | What it holds |
|---|---|---|
| `dpmkb_checklists_v1` | `checklist.html` | The viewer's checklist projects: names, ticked steps and notes. |
| `dpmkb_checklists_v1_unreadable` | `checklist.html` | A copy of checklist data that couldn't be read, kept so it can be recovered. |
| `dpmkb_tool_links` | `launcher.js` | The viewer's own links for each tool. |
| `dpmkb_probe` | `launcher.js` | A test value, written and removed at once to check that storage works. |
| `dpmkb_tpl_fields` | `templates.html` | Values typed into the template form (names, dates, references). |
| `dpmkb_tpl_panel` | `templates.html` | Whether the template fields panel is `open` or `closed`. |
| `dpmkb_tpl_probe` | `templates.html` | A test value, written and removed at once. |
| `dpmkb_gh_token` | `squad-data.js`, `glossary-data.js` | The GitHub token for the live editors, in plain text (see [Security recommendations](#security-recommendations)). |
| `dpmkb_assistant_cfg` | `assistant.js` | The AI assistant's config: the reader's Anthropic API key (plain text), workspace id, chosen model and endpoint (see [AI assistant](#ai-assistant-assistantjs)). |
| `dpmkb_assistant_chats` | `assistant.js` | The reader's saved assistant conversations: `{version, activeId, chats:[{id,title,created,updated,messages}]}` (up to 50 chats, ~200 messages each), per-browser only. Switch/rename/delete from the Chats list. |
| `dpmkb_assistant_ui` | `assistant.js` | The assistant's UI preferences: panel size, maximized state and message text size — `{w, h, maximized, fontScale}`. |
| `dpmkb_assistant_thread` | `assistant.js` | **Legacy** single conversation (the last ~24 messages) from before saved chats. Migrated once into `dpmkb_assistant_chats` on first load with the new version, then left untouched and no longer used. |
| `dpmkb_assistant_seen` | `assistant.js` | A flag that the reader has opened the assistant once (hides the welcome dot). |
| `dpmkb_pending_adds` | `squad-data.js` | Squad members added from this browser, shown straight away. They are never cleared automatically. |
| `dpmkb_pending_glossary` | `glossary-data.js` | Glossary terms added from this browser. They are never cleared automatically. |

Checklist notes and template fields may contain customer names. They stay on that device. Viewers can clear them with their browser's "clear site data".

---

## Accessibility conventions

Text must have a contrast ratio of at least **4.5:1** against its background (WCAG 2.1 AA). That rule applies to all orange and grey text. Large text (24 px, or 18.66 px bold) needs at least 3:1.

`shared.css` has separate tokens for text. Use the bright brand and vendor colours for borders, bars, icons and large headings, and the text tokens for anything small.

| Token | On white | On its pale tint | Use for |
|---|---|---|---|
| `--orange` #FF6200 | 3.0 | 2.69 | Borders, bars, icons, large text. **Not** small text, and not a fill behind small white text. |
| `--orange-light` #FF8C42 | 2.31 | 2.08 | Text on the dark nav, heroes and panels only (7.5:1 on `--black`). |
| `--orange-text` #B34200 | 5.68 | 5.10 | Links and small orange text on any light background. |
| `--orange-dark` #B34200 | 5.68 | 5.10 | Same value as `--orange-text`; kept for existing rules. |
| `--orange-strong` #C24A00 | 4.91 | – | Fills that carry small white text (active nav pill, step numbers, buttons). White on it is 4.91:1. |
| `--gray-mid` #666666 | 5.74 | 5.27 on #F5F5F5 | Secondary text. |
| `--gray-light` #C8C8C8 | 1.67 | 1.53 | Decoration only. |
| `--cisco-text` #0B6A93 | 6.00 | 5.44 | Cisco text, and fills behind white text. |
| `--palo-text` #B83A12 | 5.75 | 5.22 | Palo Alto text and fills. |
| `--fort-text` #B5231A | 6.52 | 5.89 | Fortinet text and fills. |
| `--green-text` #0A7A4A | 5.39 | 4.86 | Green text and fills. |
| `--purple` #7C3AED | 5.70 | – | Passes as it is. |

`--cisco-blue`, `--palo-orange`, `--fort-red` and `--green` stay for borders and fills without text.

Focus rings use `--focus-ring` (#B34200) on light backgrounds and `--focus-ring-dark` (#FFB27A, 9.9:1 on `--black`) on dark ones. `shared.css` sets both for `:focus-visible` on every page.

Other conventions to follow in new content:

- **Decorative emoji and icons** go in `<span aria-hidden="true">`. The hero background icons that `kb-ui.js` adds are already hidden from screen readers.
- **Buttons and fields.** Use `<button type="button">` for actions. Give icon-only buttons an `aria-label`. Give every form field a `<label>`. To hide a label visually, use the `.sr-only` class from `shared.css`.
- **Keyboard focus** must stay visible. `shared.css` draws a 3 px outline on `:focus-visible`: `--focus-ring` on light backgrounds, and `--focus-ring-dark` or white on dark ones. Don't remove outlines without replacing them.
- **Colour alone** must not carry meaning. For example, RACI cells show a letter as well as a colour.
- **Headings** go in order (one `h1`, then `h2`, then `h3`). Link text should make sense out of context ("Open the AP checklist", not "click here").
- **Motion:** when the viewer asks for reduced motion (`prefers-reduced-motion`), `kb-ui.js` skips its reveal animations and smooth scrolling, and `shared.css` turns off transitions and hover lifts. Follow the same rule for any new animation.

---

## Open content questions for SMEs

The site follows the handbook, but these points are inconsistent or unclear in the handbook or between pages. They need an answer from a subject-matter expert. Once a question is settled, update every place listed in [the sync list](#content-that-lives-in-more-than-one-place).

1. **Three phases or four step groups?** Two framings are in use:
   - The handbook's Section 6 intro and `index.html` (`#processes`) say every delivery "follows the same three phases": Pre-migration, Migration, Post-migration / HOTO.
   - The LAN step lists in the handbook and on `process-ap.html`, `process-wlc-switch.html` and `lan-process.html` use four groups: Ordering, Pre-Migration, During Migration and Post-Migration. The WAN process uses 14 phases.

   Which framing should the site present?
2. **Who books the Field Engineer?** Two pages disagree:
   - On `process-wlc-switch.html` (Pre-migration step 07) and in `checklist-data.js` (`wlc.p2.s07`), "Book the Field Engineer" is assigned to the ODM.
   - The RACI matrix (`raci.html`, from the handbook) shows the DPM as A/R for "Field Engineer booking (FLIP)", and the golden rule names Field Engineer dispatch as the DPM's.
3. **Is there an AP dry run?** Two sources disagree:
   - The handbook's AP vs WLC / Switch table, repeated in `index.html` (`#processes`), gives the AP dry run as "Internal — VPO & SC only".
   - `lan-process.html` says "No separate dry run — the APs are staged remotely by the VPO".
   - The AP step list has no dry-run step.
4. **What is the unique WLC / Switch pre-check?** Two sources disagree:
   - The handbook table and `index.html` say "Second MACHX raise before migration".
   - `lan-process.html` says "IP addresses obtained from the TDT before staging".
5. **Does the AP process use a Field Engineer?** AP Ordering step 09 reads "Stage the devices at the warehouse if needed (send FE to site)". The same wording appears in the handbook, on `process-ap.html` and in `checklist-data.js` (`ap.p1.s09`). But the AP process has no Field Engineer (the customer mounts the APs), and `lan-process.html` marks FLIP as "Not used" for AP.
6. **Is the LAN connection active at WAN step 10.1?** The note on `wan-process.html` and in `checklist-data.js` (`wan.p10.s01`) says "The LAN connection is kept unshut (inactive) at this stage — activation happens at cutover". The handbook says "kept unshut". In device terms "unshut" usually means enabled, which reads as the opposite of "inactive". Please confirm the intended state of the LAN connection before cutover.
7. **Is there a partial-migration template?** WLC / Switch Post-migration step 01 says to send the partial-migration email "(template provided)". The handbook doesn't include a template. `templates.html` has only a starter draft (`partial-migration`).
8. **Which email templates are official?** All 24 templates in `templates-data.js` are starter drafts written from the process steps. The team needs to supply or approve official wording, and then set `draft: false` on each one.
9. **Should customers see the GOLD order number?** The customer-facing templates `wan-local-validation`, `hw-receipt` and `success-notification` include "Order reference: {{orderRef}}". That field is labelled "Order ref (GOLD)", so these emails give customers the internal GOLD order number, while the writing rules keep internal tool names out of customer-facing text. Please confirm whether customers should see the GOLD reference or a different one.
