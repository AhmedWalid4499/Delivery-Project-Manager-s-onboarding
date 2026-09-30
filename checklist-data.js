/* ═══════════════════════════════════════════════════════════
   DPM Knowledge Base — Delivery Checklist data
   ───────────────────────────────────────────────────────────
   Used by checklist.html and by its Excel export
   (checklist-export.js). One entry per delivery type. The steps
   mirror the process pages word for word:
     ap  → process-ap.html          (LAN — AP / wireless)
     wlc → process-wlc-switch.html  (LAN — WLC & Switch)
     wan → wan-process.html         (WAN delivery)
   If you change a step on a process page, change it here too.

   EDITING RULES — please read before changing anything
   • Step ids (e.g. "ap.p2.s07") are the keys that everyone's saved
     progress is stored under. Never change, renumber or reuse an
     existing id.
   • Rewording a step: edit "text" only — everyone keeps their ticks.
   • Adding a step: give it a NEW id (the next unused number in that
     phase, e.g. "ap.p2.s15"), even if you insert it in the middle —
     the number shown on screen comes from the step's position.
     A new step also needs "why" and "plan" (see below).
   • Removing a step: delete it. Old ticks for it are simply ignored.
   • LAN steps use "team" (who is involved, as on the process page);
     WAN steps use "owner" (OB / Carrier / Customer / Courier …).
   • Optional per step: "note" (short tip), "tools" (array of tool
     names), "link" ({ href: "some-page.html", label: "…" } —
     pages on this site only).
   • Bump "updated" (YYYY-MM-DD) whenever you change the steps.

   EXPLANATIONS & PLAN — used by the Excel export and its Gantt chart
   • step.why — 1–2 plain-English sentences (260 characters max) on
     what the step means and why it matters.
   • step.plan — { start, days }: start = working days (Mon–Fri)
     after kick-off (0 = the kick-off day); days = length in working
     days (at least 1; 0 is only for milestones).
   • phase.summary — 1–2 sentences on what the phase is for.
   • phase.milestone (optional) — { name, plan: { start, days: 0 } }.
   • type.overview — the delivery's introduction: summary, keyFacts,
     roles [{ role, part }], tools [{ name, use }], tips,
     terms [{ term, meaning }], planSource and planNote.
   • type.planExtras — tasks in the plan that are not checklist steps,
     [{ name, phaseId, plan, milestone }]; shown on the Gantt only.
   • Keep every "why", summary and overview text grounded in the
     handbook and this site's process pages: no invented facts, and
     no names, emails, internal hostnames or URLs (the repository is
     public). If the sources disagree, raise it with the SMEs.
   • Where the plan comes from — the MS Project file named in each
     overview.planSource (indicative, single site):
       ap  → "MLAN Process (MPP).mpp"
       wlc → "MLAN Tasks (WLC and Switches).mpp"
       wan → "WAN Project Timeline (1).mpp"
     LAN (ap, wlc): the plan's dates and durations, in working days.
     Both plans tie migration day only to the invitations, so here the
     During-Migration steps start after the last Pre-Migration step.
     On AP, Post-Migration also waits for the customer's confirmation,
     and two steps the plan's levelling pushed out of order sit on
     the date their links give. Each planNote explains the changes.
     WAN: every phase in the plan starts on day 0, so the phases are
     chained in handbook order using the plan's phase durations, and
     each step spans its phase (the plan gives every sub-task a
     default 1 day). Phases 6–7 are zero-day milestones there, so
     they sit on the last day of phase 5.
     If a new step has no task in the plan, give it the plan of the
     step next to it.
═══════════════════════════════════════════════════════════ */
window.KB_CHECKLISTS = {
  version: 1,
  updated: "2026-09-30",
  types: {

    /* ─────────────────────── LAN — AP ─────────────────────── */
    ap: {
      title: "LAN — AP (wireless) process",
      short: "AP",
      icon: "📡",
      sourcePage: "process-ap.html",
      blurb: "The customer mounts the APs and the VPO stages them remotely — no Field Engineer on site, one MACHX raise, and Option 43 must be verified.",
      overview: {
        summary: "The AP process is the wireless flavour of LAN delivery. Old access points at a customer site are replaced with new Cisco Catalyst APs managed by a Wireless LAN Controller (WLC). You don't do the technical work yourself. You coordinate the ODM and supply chain, the Solution Consultant, the VPO, the customer and the DHCP and change teams through four phases: Ordering, Pre-Migration, During Migration and Post-Migration. What sets it apart is that the customer mounts the APs and the VPO stages them remotely, so no Field Engineer goes on site and there is only one MACHX raise. The one check you must never skip is DHCP Option 43.",
        keyFacts: [
          "4 phases and 36 steps: Ordering → Pre-Migration → During Migration → Post-Migration.",
          "Ordering and Pre-Migration usually take 3–5 weeks together. The cutover itself usually takes a few hours to a day.",
          "The customer mounts the APs, so there is no Field Engineer and no FLIP booking. WLC & Switch books a Field Engineer through FLIP.",
          "The VPO stages the APs remotely. There is no formal staging session or post-staging email, unlike WLC & Switch.",
          "One MACHX raise. WLC & Switch needs two: one before staging and one before migration.",
          "The unique pre-check is DHCP Option 43. Without it the APs get an IP address but never find the WLC.",
          "UAT order: all SSIDs first, then each AP, then all connected services. A success notification is always sent afterwards."
        ],
        roles: [
          { role: "DPM (you)", part: "Accountable for the whole delivery: GOLD/SALTO accuracy, the dates, the MACHX raise, the ServiceNow change, status updates, CMDB/DNAC updates, the HOTO package and closing the orders." },
          { role: "Project Manager (PM)", part: "Owns scope, BOM and the commercial relationship. Checks the GOLD and SALTO orders with you, helps decide where staging happens, and is an optional attendee on migrations." },
          { role: "Solution Consultant (SC)", part: "Owns the design. Prepares the runbook and LLD, agrees the switch ports for the APs, joins the planning call and is an optional attendee on migrations." },
          { role: "VPO", part: "The engineering and staging resource requested through MACHX. Stages the APs remotely, migrates them on the migration call and is consulted on the DNAC update." },
          { role: "ODM / Supply Chain", part: "The Order Delivery Manager and supply chain handle hardware ordering, the EDD, warehouse arrival and shipping to site. The ODM also joins the GOLD and SALTO order closures." },
          { role: "Customer", part: "Mounts the APs and connects them to the switch, confirms the migration date by email, returns the UAT document and runs the UAT on migration day." },
          { role: "DHCP Team / Change Manager", part: "Checks Option 43 on the DHCP scope for the AP VLAN and configures it if it is missing. The Change Manager joins when a change is needed." },
          { role: "CMDB Team", part: "Updates the CMDB records for the devices added and removed after the migration." },
          { role: "HOTO Manager", part: "Receives the HOTO document and signs off the hand-over to operations." }
        ],
        tools: [
          { name: "GOLD", use: "Check the order scope at kick-off, assign the order to yourself and close it after the migration." },
          { name: "SALTO", use: "Make sure the SALTO order matches the GOLD scope, then close it together with GOLD after the migration." },
          { name: "ServiceNow (SNOW)", use: "Raise the change request before the migration and send the CMDB update after it." },
          { name: "MACHX", use: "Raise the single VPO work order that covers both staging and migration." },
          { name: "DNAC / Catalyst Center", use: "Send the DNAC update after the migration so the new APs are managed and monitored." },
          { name: "SharePoint", use: "Upload the HOTO document, runbook and LLD at close-out." },
          { name: "Option 43 calculator (Knowledge Base)", use: "Generate the Option 43 hex value for the WLC IP addresses to give to the DHCP team." }
        ],
        tips: [
          "Check Option 43 well before migration day. It is the most common reason AP migrations fail, and the Knowledge Base Option 43 calculator gives you the hex value.",
          "On the planning call, make it clear that the customer's team mounts the APs. No Field Engineer comes to site in this process.",
          "Get the migration date confirmed in writing, by email, before you raise the change request and the MACHX.",
          "Send the UAT document early so the customer can add critical services and name testers who are available during the window.",
          "The Email Templates page has ready-made emails for most AP steps: EDD request, receipt check, mount & connect, Option 43, UAT, migration invitation, success notification, CMDB, DNAC and HOTO.",
          "Keep ownership clear: the PM owns scope and BOM, the SC owns the runbook and LLD, and you own the dates, the MACHX raise and the HOTO package."
        ],
        terms: [
          { term: "AP (Access Point)", meaning: "A device that broadcasts Wi-Fi so wireless clients can connect to the wired network. Enterprise APs are managed by a WLC." },
          { term: "WLC (Wireless LAN Controller)", meaning: "Manages all the APs from one place: pushes configuration, enforces security policies and handles roaming." },
          { term: "Option 43 (DHCP)", meaning: "The DHCP setting that tells an AP where to find its controller. Without it APs get an IP address but never join the WLC." },
          { term: "SSID", meaning: "A Wi-Fi network name that users see. UAT tests every SSID before testing each AP." },
          { term: "VPO", meaning: "The engineering and staging resource that stages and migrates the devices, requested through a MACHX work order." },
          { term: "MACHX", meaning: "The tool for raising and managing VPO work orders. AP needs one raise; WLC & Switch needs two." },
          { term: "EDD (Estimated Date of Delivery)", meaning: "The date the ordered hardware is expected, obtained from the ODM during Ordering." },
          { term: "UAT (User Acceptance Testing)", meaning: "The customer's tests after the migration to confirm that services work." },
          { term: "LLD (Low-Level Design)", meaning: "The detailed technical design document for the build, prepared by the SC with the runbook." },
          { term: "HOTO (Hand-Over-To-Operations)", meaning: "The formal sign-off that hands the delivered, tested environment to the support/operations teams." }
        ],
        planSource: "MLAN Process (MPP).mpp",
        planNote: "Indicative single-site timeline from the MS Project plan 'MLAN Process (MPP).mpp', in working days (Mon–Fri) from kick-off. Dates and durations come from the plan, so some steps run in parallel. Taken literally, the plan's links put migration day before the hardware reaches the site, so here the migration-day steps start after the last Pre-Migration step, Post-Migration starts once the customer confirms everything works, and two steps the plan had pushed out of order ('Assign the GOLD order to yourself' and 'Send the customer the UAT Test document') sit on the date their links give. MS Project counts whole days, so the migration-day tasks show as consecutive days although the cutover itself usually takes a few hours to a day. Bars show work time, not waiting time such as hardware delivery. Re-plan around your real EDD and the migration date the customer confirms."
      },
      planExtras: [],
      phases: [
        { id: "ap.p1", name: "Ordering",
          summary: "Get the order right and the hardware moving. Check that GOLD and SALTO match the scope, chase supply chain for an EDD, confirm the APs reach the warehouse and ship them to the customer site. Meanwhile, make sure the SC is preparing the runbook and LLD.",
          milestone: { name: "Finish Phase 1 (Ordering)", plan: { start: 20, days: 0 } },
          steps: [
          { id: "ap.p1.s01", text: "Make sure the GOLD order is created with the right scope", team: "DPM · Project Manager", tools: ["GOLD"],
            why: "GOLD is where the customer order lives: you track it from kick-off and close it at the end. Checking with the PM (who owns scope and BOM) that it holds the right scope means everything ordered and delivered afterwards matches what was sold.",
            plan: { start: 0, days: 2 } },
          { id: "ap.p1.s02", text: "Make sure the SALTO order is created correctly, matching the GOLD order scope", team: "DPM · Project Manager", tools: ["SALTO"],
            why: "SALTO is the second order system, closed alongside GOLD after the migration. Its order must match the GOLD scope so both records describe the same delivery and can be closed cleanly at the end.",
            plan: { start: 2, days: 1 } },
          { id: "ap.p1.s03", text: "Assign the GOLD order to yourself", team: "DPM", tools: ["GOLD"],
            why: "Assigning the GOLD order to yourself makes you the visible owner of this delivery in the order system, as the DPM who tracks it and closes it after the migration.",
            plan: { start: 3, days: 1 } },
          { id: "ap.p1.s04", text: "Contact supply chain for ordering progress", team: "DPM · ODM · Supply Chain",
            why: "Supply chain does the hardware ordering and shipping, but you stay accountable for it. Asking for the status early brings back-orders or delays to light while there is still time to re-plan staging and the migration date.",
            plan: { start: 3, days: 1 } },
          { id: "ap.p1.s05", text: "Get an EDD (Estimated Date of Delivery)", team: "DPM · ODM",
            why: "The EDD (Estimated Date of Delivery) is when the ordered hardware is expected. You get it from the ODM, and it anchors the rest of the plan: staging, the customer call and the migration date all depend on it.",
            plan: { start: 4, days: 1 } },
          { id: "ap.p1.s06", text: "Confirm the devices have successfully arrived at the warehouse", team: "DPM · ODM · Supply Chain",
            why: "Confirming the APs have actually reached the warehouse turns the EDD into a fact. The staging decision and the shipment to the customer site both wait on the hardware being physically in hand.",
            plan: { start: 5, days: 3 } },
          { id: "ap.p1.s07", text: "Confirm with the consultant that the runbook + LLD are being prepared for the site", team: "DPM · Solution Consultant · Supply Chain",
            why: "The Solution Consultant owns the design: the runbook and the LLD (Low-Level Design, the detailed technical design). Checking now that they are in progress stops the design becoming a blocker when staging and migration are due.",
            plan: { start: 5, days: 1 } },
          { id: "ap.p1.s08", text: "Check whether the devices are to be staged in the warehouse or at the customer site", team: "DPM · Project Manager",
            why: "Agree with the PM where the devices will be prepared: in the warehouse or at the customer site. The answer decides whether warehouse staging (the next step) is needed before the devices are shipped to site.",
            plan: { start: 17, days: 1 } },
          { id: "ap.p1.s09", text: "Stage the devices at the warehouse if needed (send FE to site)", team: "DPM · ODM · Project Manager",
            why: "Only needed if the previous check chose the warehouse: the devices are prepared there, with the ODM and PM, before they ship. If staging happens at the customer site instead, this step does not apply.",
            plan: { start: 18, days: 1 } },
          { id: "ap.p1.s10", text: "Raise a shipping alert for the devices to the customer site", team: "DPM · ODM · Supply Chain",
            why: "The shipping alert gets the devices sent from the warehouse to the customer site. Supply chain handles the shipping but you are accountable for it, and this step closes the Ordering phase.",
            plan: { start: 19, days: 2 } }
        ] },
        { id: "ap.p2", name: "Pre-Migration",
          summary: "Prepare the site, the people and the approvals. The customer mounts and connects the APs and the VPO stages them remotely. You verify DHCP Option 43, get the date confirmed by email, raise the ServiceNow change and the single MACHX, and exchange the UAT document.",
          milestone: { name: "Finish Phase 2 (Pre-Migration)", plan: { start: 26, days: 0 } },
          steps: [
          { id: "ap.p2.s01", text: "Confirm with supply chain that the order has arrived at the customer site", team: "DPM · Supply Chain",
            why: "Before involving the customer, get supply chain to confirm the hardware has actually been delivered to the site. The customer cannot mount APs that have not arrived.",
            plan: { start: 19, days: 1 } },
          { id: "ap.p2.s02", text: "Send to the customer and confirm receipt with them", team: "DPM",
            why: "Ask the customer to confirm the delivery arrived in full and in good condition, and where it is stored until installation. Missing or damaged items found now can be fixed well before the migration.",
            plan: { start: 21, days: 1 } },
          { id: "ap.p2.s03", text: "Confirm with the SC that the runbook is prepared", team: "DPM · Solution Consultant",
            why: "In Ordering you checked the runbook was being written; now confirm with the SC that it is ready. Staging and the migration rely on the runbook and LLD, so they must exist before those dates are set.",
            plan: { start: 6, days: 1 } },
          { id: "ap.p2.s04", text: "Set up a call with the customer — align on a possible migration date and explain that the customer will be the one mounting the APs", team: "DPM · PM · Solution Consultant · VPO",
            why: "This call agrees a possible migration date and sets the key expectation of the AP process: the customer's own team mounts the APs, as no Field Engineer comes to site. Invite the PM, SC and VPO so questions are answered in one go.",
            plan: { start: 7, days: 2 } },
          { id: "ap.p2.s05", text: "Send the customer to connect the APs to the switch", team: "DPM",
            why: "Ask the customer's on-site team to mount the new APs, connect each one to the switch port agreed with the SC, and confirm how many are in place. Once they confirm, the VPO can stage the APs remotely.",
            plan: { start: 23, days: 1 } },
          { id: "ap.p2.s06", text: "Send to the VPOs to stage the APs", team: "DPM · VPO",
            why: "Staging means the VPO pre-configures the new APs remotely, ready for the migration. The VPO is Responsible for staging and you stay Accountable, so request it and follow it through.",
            plan: { start: 24, days: 2 } },
          { id: "ap.p2.s07", text: "Send the customer the UAT Test document", team: "DPM",
            why: "The UAT (User Acceptance Testing) document lists the tests the customer runs after migration: for APs, each SSID first, then each AP. Sending it early lets them add critical services and name the testers for the window.",
            plan: { start: 23, days: 1 } },
          { id: "ap.p2.s08", text: "Get confirmation from the customer on the migration date (by email)", team: "DPM",
            why: "A written confirmation of the date and window is the go-ahead to raise the change request and the MACHX for the VPOs. Having it by email puts the agreed date on record if it is questioned later.",
            plan: { start: 10, days: 1 } },
          { id: "ap.p2.s09", text: "Raise a change request on SNOW (ServiceNow)", team: "DPM", tools: ["ServiceNow"],
            why: "ServiceNow is used for change control around migration windows. The change request gets the migration formally approved before the work touches the customer's live network; raising it is yours (Accountable and Responsible).",
            plan: { start: 26, days: 1 } },
          { id: "ap.p2.s10", text: "Check that Option 43 is configured", team: "DPM · DHCP Team",
            note: "⚠️ Critical — the AP cannot find the WLC without it. Verify on the DHCP scope for the AP VLAN.",
            link: { href: "option43.html", label: "Option 43 calculator →" },
            why: "Option 43 is the DHCP setting that tells a booting AP where its WLC is. Without it the AP gets an IP address but never joins the controller, the most common AP-migration failure. Check it with the DHCP team on the AP VLAN's scope.",
            plan: { start: 7, days: 1 } },
          { id: "ap.p2.s11", text: "Raise an Option 43 request if needed", team: "DPM · DHCP Team · Change Manager",
            why: "If the check shows Option 43 is missing, ask the DHCP team to configure it on the AP VLAN's scope, with the Change Manager involved if a change is needed. The Knowledge Base Option 43 calculator generates the hex value.",
            plan: { start: 8, days: 1 } },
          { id: "ap.p2.s12", text: "Raise MACHX for the VPOs", team: "DPM", tools: ["MACHX"],
            note: "The single MACHX raise for the AP process (covers staging & migration).",
            why: "MACHX is where VPO work orders are raised; it is how the VPO's staging and migration work gets requested. The AP process needs only this single raise (WLC & Switch needs two).",
            plan: { start: 24, days: 1 } },
          { id: "ap.p2.s13", text: "Get the answered UAT document back from the customer", team: "DPM",
            why: "The returned UAT document confirms the tests to run, any critical services the customer added and who will test during the window. Without it there is no agreed checklist for sign-off on migration day.",
            plan: { start: 25, days: 1 } },
          { id: "ap.p2.s14", text: "Send migration invitations to the customer and VPO (PM and SC as optional on all migrations)", team: "DPM · PM · Solution Consultant · VPO",
            why: "The invitation books the customer's testers and the VPO for the migration window and explains how the session will run. The PM and SC are added as optional on every migration so they can join if needed.",
            plan: { start: 11, days: 1 } }
        ] },
        { id: "ap.p3", name: "During Migration",
          summary: "The cutover itself, usually a few hours to a day. Join the call with the VPO and track which APs are migrated. The customer tests every SSID, then every AP, then the connected services, and confirms everything works.",
          milestone: { name: "Finish Phase 3 (During Migration)", plan: { start: 31, days: 0 } },
          steps: [
          { id: "ap.p3.s01", text: "Join the migration call", team: "DPM · VPO",
            why: "On the day the VPO migrates the APs while you track progress on the call and keep the customer informed. The VPO is Responsible for the cutover; you remain Accountable for it.",
            plan: { start: 27, days: 1 } },
          { id: "ap.p3.s02", text: "Keep track of all the APs that are migrated and still pending migration", team: "DPM · VPO",
            why: "Keep a live list of which APs are migrated and which are still pending. It shows everyone the real progress, flags any AP that has not come up, and tells you when the whole site is done.",
            plan: { start: 27, days: 1 } },
          { id: "ap.p3.s03", text: "Ask the customer to do UAT for all SSIDs, and then for all APs", team: "DPM · VPO",
            why: "SSIDs are the Wi-Fi network names users see. Testing every SSID first proves each wireless network works; testing each AP next proves every access point serves them. This test order is specific to the AP process.",
            plan: { start: 28, days: 1 } },
          { id: "ap.p3.s04", text: "Ask the customer to fully test all services connected to the APs", team: "DPM · VPO",
            why: "Beyond joining the Wi-Fi, the customer checks the services their users rely on through the APs, as listed in the UAT document. Issues found now can be fixed while the VPO is still on the call.",
            plan: { start: 29, days: 1 } },
          { id: "ap.p3.s05", text: "Get confirmation from the customer that everything is working", team: "DPM · VPO",
            why: "The customer runs UAT, so their confirmation that all tests passed is the sign-off that the migration is complete. Get it explicitly: it is what your success notification reports.",
            plan: { start: 30, days: 2 } }
        ] },
        { id: "ap.p4", name: "Post-Migration",
          summary: "Close everything cleanly. Send the success notification, update CMDB and DNAC, and close the GOLD and SALTO orders. Upload the HOTO document, runbook and LLD to SharePoint and send the HOTO document to the HOTO Manager for sign-off.",
          steps: [
          { id: "ap.p4.s01", text: "Send the success notification", team: "DPM",
            why: "The success notification formally tells the customer the migration is complete and tested, and what happens next (records updated, hand-over to operations). In the AP process it is always sent.",
            plan: { start: 32, days: 1 } },
          { id: "ap.p4.s02", text: "Send the CMDB update", team: "DPM · CMDB Team", tools: ["ServiceNow"],
            why: "The CMDB, kept in ServiceNow, is the record of what's installed. Updating it with the devices added and removed means support teams see the site as it really is after the migration.",
            plan: { start: 32, days: 1 } },
          { id: "ap.p4.s03", text: "Send the DNAC update", team: "DPM · VPO", tools: ["DNAC"],
            why: "DNAC (Catalyst Center) is Cisco's network management platform. Sending the update, with the VPO, makes sure the new APs are managed and monitored once the project is handed over.",
            plan: { start: 32, days: 1 } },
          { id: "ap.p4.s04", text: "Close the GOLD order", team: "DPM · ODM", tools: ["GOLD"],
            why: "Closing the GOLD order, with the ODM, ends the order record you have tracked since kick-off. Closed GOLD and SALTO orders are part of what a finished AP delivery looks like.",
            plan: { start: 33, days: 1 } },
          { id: "ap.p4.s05", text: "Close the SALTO order", team: "DPM · ODM", tools: ["SALTO"],
            why: "SALTO is closed alongside GOLD after the migration. Closing both together leaves no open order behind for a delivery that is already live.",
            plan: { start: 33, days: 1 } },
          { id: "ap.p4.s06", text: "Upload the HOTO document and runbook (including LLD) to SharePoint", team: "DPM", tools: ["SharePoint"],
            why: "SharePoint is where delivery documents live. Uploading the HOTO document with the runbook and LLD gives the operations team the paperwork they need to support the site after hand-over.",
            plan: { start: 34, days: 1 } },
          { id: "ap.p4.s07", text: "Send the HOTO document to the HOTO Manager", team: "DPM · HOTO Manager",
            why: "HOTO (Hand-Over-To-Operations) is the formal sign-off handing the delivered, tested site to the operations teams. Sending the document to the HOTO Manager is the final step, and a clean HOTO is the goal of every delivery.",
            plan: { start: 35, days: 1 } }
        ] }
      ]
    },

    /* ─────────────────── LAN — WLC & Switch ─────────────────── */
    wlc: {
      title: "LAN — WLC & Switch process",
      short: "WLC & Switch",
      icon: "🔌",
      sourcePage: "process-wlc-switch.html",
      blurb: "Adds IP addresses from the TDT, an external dry run, a Field Engineer booked via FLIP, a formal staging session and two MACHX raises.",
      overview: {
        summary: "The WLC & Switch process replaces a customer's old network switches or Wireless LAN Controllers with new Cisco Catalyst hardware. Every device in the building plugs into a switch, so a failed cutover can take a whole floor or building offline. That is why this process adds IP addresses from the TDT, an external dry run with the customer, a formal staging session, a Field Engineer booked via FLIP and two MACHX raises. It runs in four phases (Ordering, Pre-Migration, During Migration, Post-Migration) and ends with a clean HOTO. As DPM you are accountable from start to finish: you coordinate the specialists rather than configure the devices yourself.",
        keyFacts: [
          "4 phases, 40 steps and 7 tools: GOLD, SALTO, FLIP, ServiceNow, MACHX, DNAC and SharePoint.",
          "Two MACHX raises: one for the staging activity and one for the migration. The AP process needs only one.",
          "A Field Engineer is booked via FLIP to handle the hardware on site. In the AP process the customer mounts the APs themselves.",
          "IP addresses come from the TDT before staging. This step is unique to the WLC/Switch process; the AP process verifies Option 43 instead.",
          "External dry run with the VPO, SC and customer. Always check for 3rd-party servers such as DXC.",
          "During migration the customer tests all services on each migrated switch. A multi-day migration needs a partial-migration email each day and the success notification on the last day.",
          "The indicative single-site plan runs about 24 working days from kick-off to the end of Post-Migration, and the migration itself is planned as one day."
        ],
        roles: [
          { role: "DPM (you)", part: "Accountable from start to finish: the dates, the GOLD/SALTO orders, both MACHX raises, the Field Engineer dispatch, the ServiceNow change, all status communications and the HOTO package." },
          { role: "Project Manager (PM)", part: "Owns the scope, the BOM and the commercial relationship. Checks the GOLD/SALTO order scope with you, decides with you whether staging happens in the warehouse or on site, and is an optional attendee on migration invitations." },
          { role: "Solution Consultant (SC)", part: "Owns the technical design: prepares the runbook and LLD, joins the external dry run and staging, and is an optional attendee on migration invitations." },
          { role: "VPO / TIM", part: "Engineering and staging resource, requested via MACHX. Runs the staging, the dry run and the migration with you, and supports the DNAC update." },
          { role: "Field Engineer (FE)", part: "Booked via FLIP. Handles the physical hardware on site for the cutover." },
          { role: "ODM (Order Delivery Manager) & Supply Chain", part: "Hardware ordering and logistics: the EDD, warehouse arrival, shipping alert and delivery to site. The ODM also books the Field Engineer and helps close the GOLD and SALTO orders." },
          { role: "TDT", part: "Provides the IP addressing for the new devices before staging." },
          { role: "Customer", part: "Confirms receipt of the hardware, agrees the staging and migration dates, joins the external dry run and runs UAT on every service connected to the migrated switches." },
          { role: "Change Manager", part: "Helps line up the support teams needed on migration day (e.g. DXC, ODC, DHCP) and is included on the migration invitations." },
          { role: "CMDB Team / HOTO Manager", part: "The CMDB team records the new devices after migration. The HOTO Manager receives the HOTO document for the hand-over to operations." }
        ],
        tools: [
          { name: "GOLD", use: "Check the order scope at the start, assign the order to yourself, and close it after the migration." },
          { name: "SALTO", use: "Make sure it matches the GOLD order scope, then close it alongside GOLD after the migration." },
          { name: "FLIP", use: "Book the Field Engineer for on-site work. Used on Switch/WLC jobs only." },
          { name: "MACHX", use: "Raise VPO work orders twice: once before staging and once before the migration." },
          { name: "ServiceNow (SNOW)", use: "Raise the migration change request, and the CMDB update that records the new devices." },
          { name: "DNAC / Catalyst Center", use: "Send the DNAC update after the migration so the new devices are managed and monitored." },
          { name: "SharePoint", use: "Upload the HOTO document, runbook and LLD at the end of the delivery." }
        ],
        tips: [
          "In the external dry run, always check for 3rd-party servers (e.g. DXC). They may have special VLAN or routing needs that are not in the standard runbook.",
          "Never skip or rush staging. If the new switch is not pre-configured to match the old one exactly, the cutover will fail.",
          "Ask the TDT for the IP addresses early, because the devices cannot be staged without them.",
          "Remember the two MACHX raises: the first for staging and the second for the migration.",
          "Confirm prerequisites before the migration window, not during it. If the cutover runs over several days, send a partial-migration email each day.",
          "Starter drafts for each email and invite are on the Email Templates page (WLC & Switch filter). They are drafts, not official wording, so read them through before sending."
        ],
        terms: [
          { term: "WLC", meaning: "Wireless LAN Controller: centrally manages multiple access points." },
          { term: "MACHX", meaning: "The tool used to raise and manage VPO work orders. This process needs two raises: staging and migration." },
          { term: "FLIP", meaning: "The tool used to book a Field Engineer for on-site work." },
          { term: "TDT", meaning: "The team that provides the IP addressing for the new devices." },
          { term: "EDD", meaning: "Estimated Date of Delivery: when the ordered hardware is expected." },
          { term: "LLD", meaning: "Low-Level Design: the detailed technical design document for the build." },
          { term: "Staging", meaning: "Pre-configuring the new hardware to match the old before the cutover." },
          { term: "Dry run", meaning: "A walk-through of the migration plan with the VPO, SC and customer before the day." },
          { term: "UAT", meaning: "User Acceptance Testing: the customer confirms services work after the migration." },
          { term: "HOTO", meaning: "Hand-Over-To-Operations: the formal sign-off that hands the delivered environment to support." }
        ],
        planSource: "MLAN Tasks (WLC and Switches).mpp",
        planNote: "Offsets and durations come from the MS Project plan 'MLAN Tasks (WLC and Switches)', which the handbook describes as indicative of a single-site delivery. Some tasks run in parallel or overlap where the plan links them. The plan does not tie migration day to 'Align any teams you'll need during migration', so here the migration starts once every Pre-Migration step is done, 2 working days later than in the plan. That makes about 24 working days from kick-off to the end of Post-Migration, with the migration itself planned as one day. Real dates depend on the EDD and on the staging and migration dates the customer agrees, so adjust once those are known. A multi-day migration lengthens phases 3 and 4."
      },
      planExtras: [],
      phases: [
        { id: "wlc.p1", name: "Ordering",
          summary: "Get the GOLD and SALTO orders right and take ownership of them, then follow the hardware from order to warehouse using the EDD. Decide where staging happens and ship the devices to the customer site.",
          milestone: { name: "Finish Phase 1 (Ordering)", plan: { start: 8, days: 0 } },
          steps: [
          { id: "wlc.p1.s01", text: "Make sure the GOLD order is created with the right scope", team: "DPM · Project Manager", tools: ["GOLD"],
            why: "GOLD is the order-management system where the customer order lives. Checking its scope now, with the PM who owns scope and the BOM, means the right hardware and services are ordered and nothing has to be fixed later.",
            plan: { start: 0, days: 1 } },
          { id: "wlc.p1.s02", text: "Make sure the SALTO order is created correctly, matching the GOLD order scope", team: "DPM · Project Manager", tools: ["SALTO"],
            why: "SALTO is the second order system and must match the GOLD order scope. Checking they agree now avoids mismatches later, because you close both orders together after the migration.",
            plan: { start: 1, days: 1 } },
          { id: "wlc.p1.s03", text: "Assign the GOLD order to yourself", team: "DPM", tools: ["GOLD"],
            why: "Assigning the GOLD order to yourself marks you as the DPM who owns this delivery, so you can track it, keep the order record accurate and close it at the end.",
            plan: { start: 2, days: 1 } },
          { id: "wlc.p1.s04", text: "Contact supply chain for ordering progress", team: "DPM · Supply Chain",
            why: "Supply Chain handles hardware logistics. Checking ordering progress early lets you spot delays and flag them before they push back the staging and migration dates.",
            plan: { start: 2, days: 2 } },
          { id: "wlc.p1.s05", text: "Get an EDD (Estimated Date of Delivery)", team: "DPM · ODM",
            why: "The EDD (Estimated Date of Delivery) is when the ordered hardware is expected. You get it from the ODM and use it to plan the rest of the migration, so every later date depends on it.",
            plan: { start: 2, days: 2 } },
          { id: "wlc.p1.s06", text: "Confirm the devices have successfully arrived at the warehouse", team: "ODM · Supply Chain",
            why: "The ODM and Supply Chain confirm the new switches or WLCs have reached the warehouse. Nothing can be staged or shipped to the customer until the hardware is physically in stock.",
            plan: { start: 5, days: 1 } },
          { id: "wlc.p1.s07", text: "Confirm with the consultant that the runbook + LLD are being prepared for the site", team: "DPM · Solution Consultant",
            why: "The SC owns the design: the runbook (the step-by-step migration plan) and the LLD (Low-Level Design). Checking they are being prepared now means they will be ready for staging and the dry run.",
            plan: { start: 5, days: 1 } },
          { id: "wlc.p1.s08", text: "Check whether the devices are to be staged in the warehouse or at the customer site", team: "DPM · Project Manager",
            why: "Agree with the PM where the devices will be staged (pre-configured): in the warehouse before shipping, or at the customer site. The answer decides whether the next step is needed.",
            plan: { start: 6, days: 1 } },
          { id: "wlc.p1.s09", text: "Stage the devices at the warehouse if needed (send FE to site)", team: "DPM · ODM · Solution Consultant · VPO",
            why: "If staging is to happen in the warehouse, arrange it now with the ODM, SC and VPO. Staging pre-configures the new devices to match the old ones, which the cutover depends on. Skip this if staging will be on site.",
            plan: { start: 7, days: 1 } },
          { id: "wlc.p1.s10", text: "Raise a shipping alert for the devices to the customer site", team: "ODM · Supply Chain",
            why: "The ODM and Supply Chain raise a shipping alert so the devices are sent to the customer site. This is the last Ordering step; Pre-Migration starts once the hardware is on its way.",
            plan: { start: 8, days: 1 } }
        ] },
        { id: "wlc.p2", name: "Pre-Migration",
          summary: "The longest phase: IP addresses from the TDT, the runbook, an external dry run with the customer, a Field Engineer booked via FLIP, a formal staging session and two MACHX raises. It ends with a confirmed migration date, a ServiceNow change, the UAT document and the migration invitations.",
          milestone: { name: "Finish Phase 2 (Pre-Migration)", plan: { start: 20, days: 0 } },
          steps: [
          { id: "wlc.p2.s01", text: "Confirm with supply chain that the order has arrived at the customer site", team: "Supply Chain · ODM",
            why: "Supply Chain and the ODM confirm the hardware has been delivered to the customer site. Staging, the Field Engineer visit and the migration all depend on the devices being there.",
            plan: { start: 9, days: 1 } },
          { id: "wlc.p2.s02", text: "Send to the customer and confirm receipt with them", team: "DPM",
            why: "Contact the customer to confirm they have received the equipment. Their confirmation avoids surprises, such as hardware not being found on site when staging or the cutover begins.",
            plan: { start: 10, days: 1 } },
          { id: "wlc.p2.s03", text: "Get the IP addresses from the TDT", team: "DPM · TDT", tools: ["TDT"],
            note: "Unique to the WLC/Switch process — addressing is needed before staging.",
            why: "The TDT provides the IP addressing for the new switches and WLCs. This step is unique to the WLC/Switch process: the devices cannot be pre-configured in staging without their addresses.",
            plan: { start: 11, days: 1 } },
          { id: "wlc.p2.s04", text: "Confirm with the SC that the runbook is prepared", team: "DPM · Solution Consultant",
            why: "Check with the SC that the runbook is complete. It is the step-by-step plan that the dry run, staging and migration follow, so it must be ready before you schedule them.",
            plan: { start: 12, days: 1 } },
          { id: "wlc.p2.s05", text: "Set up an external dry run with the VPO, SC, and customer", team: "DPM · Solution Consultant · VPO",
            why: "An external dry run walks the VPO, SC and customer through the migration plan before the day, so nothing is discovered for the first time in the maintenance window. Unlike the AP process, the customer takes part.",
            plan: { start: 13, days: 1 } },
          { id: "wlc.p2.s06", text: "Set up dates for the staging with the customer", team: "DPM",
            why: "Agree the staging dates with the customer. You are accountable for these dates, and they drive the Field Engineer booking, the first MACHX raise and the staging invitation.",
            plan: { start: 12, days: 1 } },
          { id: "wlc.p2.s07", text: "Book the Field Engineer", team: "ODM", tools: ["FLIP"],
            why: "A Field Engineer is booked through FLIP to handle the hardware on site. Switch/WLC jobs need someone on site, unlike AP jobs where the customer mounts the APs; you stay accountable for the dispatch.",
            plan: { start: 13, days: 1 } },
          { id: "wlc.p2.s08", text: "Raise MACHX for the VPOs", team: "DPM", tools: ["MACHX"],
            note: "First MACHX raise — for the staging activity.",
            why: "MACHX is where you raise VPO work orders. This first raise requests the VPO for the staging activity so the engineering work gets done; a second raise follows later for the migration.",
            plan: { start: 13, days: 1 } },
          { id: "wlc.p2.s09", text: "Send the invitation for staging", team: "DPM",
            why: "Send the staging meeting invitation to the people involved (such as the VPO, SC and customer) so everyone holds the agreed date and time and knows what will happen.",
            plan: { start: 13, days: 1 } },
          { id: "wlc.p2.s10", text: "Run the staging activity", team: "DPM · Solution Consultant · VPO",
            why: "In staging, the VPO (with the SC) pre-configures the new switches or WLCs to match the old ones. It is a common failure point: if staging is skipped or rushed, the cutover will fail.",
            plan: { start: 14, days: 1 } },
          { id: "wlc.p2.s11", text: "Send the post-staging email, including daily status (if it runs more than one day)", team: "DPM",
            why: "Tell the customer and the team how staging went and what comes next. If staging runs over more than one day, send a daily status so everyone knows what is done and what is pending.",
            plan: { start: 15, days: 1 } },
          { id: "wlc.p2.s12", text: "Follow up the external dry run with the VPO, SC, and customer — check for 3rd-party servers", team: "DPM · Solution Consultant · VPO",
            note: "⚠️ Explicitly check for DXC or other vendor servers with special requirements.",
            why: "Finish the dry run with the VPO, SC and customer and explicitly check for 3rd-party servers (e.g. DXC). They may have special VLAN or routing needs that are not in the standard runbook — a top failure point.",
            plan: { start: 15, days: 1 } },
          { id: "wlc.p2.s13", text: "Send the customer the UAT Test document", team: "DPM",
            why: "UAT (User Acceptance Testing) is how the customer confirms services work after migration. Sending the UAT document now gives them time to prepare their tests and testers for migration day.",
            plan: { start: 16, days: 1 } },
          { id: "wlc.p2.s14", text: "Get confirmation from the customer on the migration date", team: "DPM",
            why: "Get the customer's clear confirmation of the migration date. In the plan, the change request, the second MACHX raise and the migration invitations all follow this confirmation.",
            plan: { start: 17, days: 1 } },
          { id: "wlc.p2.s15", text: "Raise a change request on SNOW (ServiceNow)", team: "DPM", tools: ["ServiceNow"],
            why: "Raise a change request in ServiceNow (SNOW) so the migration goes through change control for its window. Changes are reviewed and approved before a cutover can go ahead.",
            plan: { start: 18, days: 1 } },
          { id: "wlc.p2.s16", text: "Align any teams you'll need during migration (DXC, ODC, DHCP teams)", team: "DPM · Change Manager",
            why: "Line up every support team you will need on the day, such as the DXC, ODC or DHCP teams, with the Change Manager. Confirming them in advance stops the cutover stalling while someone is found.",
            plan: { start: 19, days: 2 } },
          { id: "wlc.p2.s17", text: "Raise MACHX for the VPOs", team: "DPM", tools: ["MACHX"],
            note: "Second MACHX raise — for the migration activity.",
            why: "The second MACHX raise requests the VPO for the migration itself. Switch/WLC jobs need two raises (staging + migration); without this one, the VPO work for the cutover is not requested.",
            plan: { start: 18, days: 1 } },
          { id: "wlc.p2.s18", text: "Get the answered UAT document back from the customer", team: "DPM",
            why: "Get the completed UAT document back from the customer before migration day. It shows they have reviewed the tests and are ready to run them as soon as switches are migrated.",
            plan: { start: 17, days: 1 } },
          { id: "wlc.p2.s19", text: "Send migration invitations to the customer and VPO (PM and SC as optional on all migrations)", team: "DPM · PM · Solution Consultant · VPO · Change Manager",
            why: "Send the migration invitations to the customer and VPO, with the PM and SC as optional attendees. This locks in the people and the window for the cutover and closes Pre-Migration.",
            plan: { start: 18, days: 1 } }
        ] },
        { id: "wlc.p3", name: "During Migration",
          summary: "The cutover in the agreed maintenance window. Join the migration call, track each switch as it is migrated, and have the customer test every service connected to it until they confirm everything works.",
          milestone: { name: "Finish Phase 3 (During Migration)", plan: { start: 21, days: 0 } },
          steps: [
          { id: "wlc.p3.s01", text: "Join the migration call", team: "DPM · VPO",
            why: "Join the migration call with the VPO to coordinate the cutover in the agreed window, keep everyone aligned and deal with issues as they arise. The VPO and Field Engineer do the technical work.",
            plan: { start: 21, days: 1 } },
          { id: "wlc.p3.s02", text: "Keep track of all the switches that have been migrated and which are still pending", team: "DPM",
            why: "Keep a live list of which switches are migrated and which are still pending. It keeps the call organised and gives you accurate facts for the partial-migration or success email afterwards.",
            plan: { start: 21, days: 1 } },
          { id: "wlc.p3.s03", text: "Ask the customer to fully test all services connected to the migrated switches", team: "DPM",
            why: "Ask the customer to test every service on each migrated switch (phones, PCs, printers, APs, servers). Switches carry all traffic, so one missed service can leave users without a connection.",
            plan: { start: 21, days: 1 } },
          { id: "wlc.p3.s04", text: "Get confirmation from the customer that everything is working", team: "DPM",
            why: "Get the customer's explicit confirmation that everything works. This is their acceptance (UAT) of the migration and the trigger for the post-migration steps.",
            plan: { start: 21, days: 1 } }
        ] },
        { id: "wlc.p4", name: "Post-Migration",
          summary: "Report the outcome: a partial-migration email per day, or the success notification. Then update the CMDB and DNAC, close GOLD and SALTO, and hand over to operations with the HOTO document, runbook and LLD.",
          milestone: { name: "Finish Phase 4 (Post-Migration)", plan: { start: 23, days: 0 } },
          steps: [
          { id: "wlc.p4.s01", text: "Send the partial-migration email if it runs over multiple days (template provided); on a single day, or the last migration day, send the success notification", team: "DPM",
            why: "If the migration runs over several days, send the partial-migration email each day (template provided); on a single day or the last day, send the success notification so everyone knows the outcome.",
            plan: { start: 22, days: 1 } },
          { id: "wlc.p4.s02", text: "Send the CMDB update", team: "DPM · CMDB Team", tools: ["ServiceNow"],
            why: "The CMDB, in ServiceNow, is the record of what is installed. Sending the update to the CMDB team makes sure the new devices are recorded correctly for operations and support.",
            plan: { start: 22, days: 1 } },
          { id: "wlc.p4.s03", text: "Send the DNAC update", team: "DPM · VPO", tools: ["DNAC"],
            why: "DNAC (Catalyst Center) is Cisco's network management platform. Sending the DNAC update, with the VPO, means the new devices are managed and monitored after go-live.",
            plan: { start: 22, days: 1 } },
          { id: "wlc.p4.s04", text: "Close the GOLD order", team: "DPM · ODM", tools: ["GOLD"],
            why: "Close the GOLD order with the ODM now that the site is live. A delivery is only finished when every system is closed cleanly.",
            plan: { start: 23, days: 1 } },
          { id: "wlc.p4.s05", text: "Close the SALTO order", team: "DPM · ODM", tools: ["SALTO"],
            why: "Close the SALTO order alongside GOLD, with the ODM. Both order systems should end closed and matching the scope that was delivered.",
            plan: { start: 22, days: 2 } },
          { id: "wlc.p4.s06", text: "Upload the HOTO document and runbook (including LLD) to SharePoint", team: "DPM", tools: ["SharePoint"],
            why: "SharePoint is where delivery documents live. Uploading the HOTO document, runbook and LLD gives operations the full record of what was built and how.",
            plan: { start: 22, days: 1 } },
          { id: "wlc.p4.s07", text: "Send the HOTO document to the HOTO Manager", team: "DPM · HOTO Manager",
            why: "HOTO (Hand-Over-To-Operations) is the formal sign-off that hands the delivered, tested site to support. Sending the HOTO document to the HOTO Manager completes the delivery; a clean HOTO is the goal.",
            plan: { start: 22, days: 2 } }
        ] }
      ]
    },

    /* ───────────────────────── WAN ───────────────────────── */
    wan: {
      title: "WAN delivery process",
      short: "WAN",
      icon: "🌐",
      sourcePage: "wan-process.html",
      numbering: "dotted",
      blurb: "A carrier delivers the circuit before OB installs the routers — most steps depend on the carrier or the customer's local team, so the owner is shown on every step.",
      stages: [
        { id: "A", name: "Validate & Order", note: "Phases 1–3" },
        { id: "B", name: "Circuit Delivery", note: "Phases 4–8 · carrier-led" },
        { id: "C", name: "Router Install & Migration Prep", note: "Phases 9–12" },
        { id: "D", name: "Migration & HOTO", note: "Phases 13–14" }
      ],
      overview: {
        summary: "A WAN delivery connects a customer site to the wide-area network, usually by migrating it onto a new Orange Business SD-WAN service. Unlike a LAN migration, a third-party carrier first has to survey the site, install a physical circuit and hand it over before OB can install and connect its routers. The work runs through 14 phases in four stages (Validate & Order, Circuit Delivery, Router Install & Migration Prep, Migration & HOTO). It ends with one agreed cutover window, the customer's acceptance tests and, after hyper care, hand-over to operations. As DPM, most of your job is chasing dependencies you don't directly control: the carrier's dates and the customer's local team.",
        keyFacts: [
          "14 phases and 35 steps in four stages: Validate & Order (phases 1–3), Circuit Delivery (4–8, carrier-led), Router Install & Migration Prep (9–12) and Migration & HOTO (13–14).",
          "The carrier order cannot be placed until the customer's local team returns the validation of the order scope, site details and circuit DMARC points.",
          "The customer's local team owns 16 of the 35 steps and the carrier owns 6, so most of the DPM's work is chasing people rather than doing tasks.",
          "Carrier lead times dominate. The carrier typically acknowledges the order within 2–5 days, and arranging the site survey is the longest phase in the MS Project plan (15 working days).",
          "The routers are racked and connected to the WAN circuit first. The LAN is only activated at the cutover, in one agreed downtime window that the customer's CAB has approved.",
          "The site is handed over to operations 7 calendar days after the migration date, once the customer approves the exit from hyper care.",
          "Chained end to end, the plan's phase durations add up to about 54 working days (roughly 11 weeks) from kick-off to HOTO. This is indicative only."
        ],
        roles: [
          { role: "DPM (you)", part: "Accountable for the delivery end to end. You own the dates, chase the carrier and the customer's local team, make sure the local validation reached the customer, and land a clean cutover and HOTO." },
          { role: "OB local / delivery team", part: "Validates the order with the customer's local team, orders the circuit and hardware, and arranges shipment of the OB routers (steps 1.1, 2.1, 9.1)." },
          { role: "OB engineer & OB installation team", part: "The engineer racks the routers and connects them to the WAN circuit on site while the installation team supports remotely and tests connectivity (10.1). The engineer may also move the LAN cables at cutover (13.2)." },
          { role: "OB TM team", part: "Activates the LAN and tests the service remotely during the cutover (13.3)." },
          { role: "OB PM", part: "Sends the cutover meeting invite a week ahead and opens the Teams meeting on migration day (11.4, 13.1)." },
          { role: "Solution Consultant", part: "Design owner. In the MS Project plan they prepare the LLD before installation planning and migration, plus the vanilla router configs." },
          { role: "Carrier", part: "Acknowledges the order, surveys the site, installs the circuit and NTU, and hands the circuit over to OB (phases 3–8)." },
          { role: "Customer local team", part: "Validates the scope and site details, grants site access, gets landlord approvals, completes the in-house wiring to the server room, receives and stores the routers, escorts engineers and provides the testers." },
          { role: "Customer PM", part: "Submits the CAB request so the change is approved before the cutover date (12.1)." },
          { role: "Courier", part: "Delivers the router hardware to the customer site (9.5)." },
          { role: "Operations", part: "Take over support of the site at HOTO, after hyper care and with the customer's approval (phase 14)." }
        ],
        tools: [
          { name: "Microsoft Teams", use: "The OB PM sends the cutover meeting invite a week ahead (11.4) and opens the Teams meeting for the cutover on migration day (13.1)." },
          { name: "Email templates (this site)", use: "Starter drafts for WAN: the local validation request, the router installation date and escort contact, the cutover invite, the CAB reminder and the hyper-care exit. Adapt them before sending." },
          { name: "GOLD", use: "Order management, where the customer order lives. The handbook asks DPMs to keep order records accurate here, so keep the GOLD reference on the project." },
          { name: "SharePoint", use: "Where delivery documents live. The handbook says the HOTO document, runbook and LLD for each project are uploaded here." },
          { name: "MS Project: WAN Project Timeline", use: "The source of the phase durations behind this checklist's indicative Gantt. Re-plan as the carrier confirms real dates." }
        ],
        tips: [
          "Send the local validation request on day one (a starter template exists) and chase it. The carrier order waits for it.",
          "Ask about landlord approvals and the in-house wiring from the DMARC to the server room during validation. Both can block the circuit installation and may need several visits.",
          "Before booking the router installation, confirm three things: the circuit has been handed over to OB, someone will receive and store the routers, and the escort for the day is named.",
          "Send the cutover invite a week ahead, and check that CAB approval and the customer's testers are in place. If approval won't come in time, agree a new migration date.",
          "Treat the Gantt dates as indicative. Re-plan when the carrier confirms the survey and installation dates, and put any delay on record early.",
          "Count 7 calendar days of hyper care from the migration date, then ask the customer to approve the hand-over to operations."
        ],
        terms: [
          { term: "SD-WAN", meaning: "Software-Defined WAN: routes traffic across several WAN links based on application policy and link quality. It is the target service of most WAN deliveries." },
          { term: "Carrier", meaning: "The third-party provider that surveys the site, then installs the physical circuit and hands it over to OB." },
          { term: "DMARC (demarcation point)", meaning: "The point where the carrier's circuit ends and the customer's in-house wiring begins. It has nothing to do with email DMARC." },
          { term: "NTU (Network Termination Unit)", meaning: "The carrier's device at the site edge that terminates the WAN circuit. The carrier engineer installs it." },
          { term: "LLD (Low-Level Design)", meaning: "The detailed technical design document for the build, prepared by the consultant." },
          { term: "SAT (Service Acceptance Test)", meaning: "The customer's test that the new service works as expected before they formally accept it." },
          { term: "CAB (Change Advisory Board)", meaning: "The board that approves the change before the cutover. On WAN, the customer PM submits the request." },
          { term: "Cutover", meaning: "The switch from the current service to the new SD-WAN service, done in one agreed downtime window." },
          { term: "Hyper care", meaning: "The close-support period right after go-live. On WAN the site exits it about 7 calendar days after the migration." },
          { term: "HOTO (Hand-Over-To-Operations)", meaning: "The formal hand-over of the finished site from the project team to the operations/support team." }
        ],
        planSource: "WAN Project Timeline (1).mpp",
        planNote: "Indicative: MS Project WAN phase durations chained in sequence; carrier dates will move it. Phases 6–7 are zero-day milestones in the plan, so allow real time for landlord approvals, in-house wiring and the circuit installation."
      },
      planExtras: [
        { name: "Make sure the local validation reached the customer (DPM)", phaseId: "wan.p1", plan: { start: 0, days: 1 }, milestone: false },
        { name: "OB contacts HQ to let them know the installation date", phaseId: "wan.p6", plan: { start: 26, days: 1 }, milestone: false },
        { name: "Consultant prepares the vanilla configs and uploads them to the tools", phaseId: "wan.p8", plan: { start: 27, days: 1 }, milestone: false },
        { name: "LLD prepared by the consultant (before installation planning and migration)", phaseId: "wan.p8", plan: { start: 31, days: 0 }, milestone: true },
        { name: "Staging the router in the warehouse", phaseId: "wan.p9", plan: { start: 32, days: 0 }, milestone: true },
        { name: "Check router availability in the warehouse", phaseId: "wan.p9", plan: { start: 32, days: 1 }, milestone: false },
        { name: "Vanilla configs shared by email and on the tools", phaseId: "wan.p9", plan: { start: 32, days: 1 }, milestone: false },
        { name: "Check with the LDM whether the router is shipped to the customer or hand-carried by the FE", phaseId: "wan.p9", plan: { start: 32, days: 1 }, milestone: false },
        { name: "Send the meeting invite for the router installation", phaseId: "wan.p9", plan: { start: 32, days: 1 }, milestone: false }
      ],
      phases: [
        { id: "wan.p1", stage: "A", name: "Local validation",
          summary: "OB's local team asks the customer's local team to confirm the order scope, site details and circuit DMARC points. This is mandatory: nothing can be ordered from the carrier until the customer answers.",
          steps: [
          { id: "wan.p1.s01", text: "OB local team contacts the customer's local team to validate the order scope, site details, circuit DMARC points, etc.", owner: "OB",
            why: "The first step of every WAN delivery: confirm what is ordered, the site details and where the carrier's circuit should end (the DMARC point). Getting this right up front means the carrier order is placed correctly.",
            plan: { start: 0, days: 5 } },
          { id: "wan.p1.s02", text: "Customer local team responds to the validation request and provides all details", owner: "Customer",
            note: "Mandatory — OB cannot place the order with the carrier until this is returned.",
            why: "The customer's answer is mandatory: OB cannot place the order with the carrier until the validation comes back. Chase it, because every day it is late delays the whole delivery.",
            plan: { start: 0, days: 5 } }
        ] },
        { id: "wan.p2", stage: "A", name: "Ordering circuit & hardware",
          summary: "Once the customer has validated the details, the OB delivery team orders the circuit from the carrier and the router hardware.",
          steps: [
          { id: "wan.p2.s01", text: "Once the order is validated by the customer's local contact, OB delivery team orders the hardware & circuit", owner: "OB",
            why: "With the details validated, OB orders the circuit from the carrier and the router hardware. This starts the carrier's lead time, which drives most of the WAN timeline.",
            plan: { start: 5, days: 1 } }
        ] },
        { id: "wan.p3", stage: "A", name: "Carrier acknowledge",
          summary: "The carrier confirms it has received the circuit order, typically within 2–5 days. The acknowledgement signals that the carrier-led circuit delivery has started.",
          steps: [
          { id: "wan.p3.s01", text: "The carrier acknowledges the order", owner: "Carrier",
            note: "Typically within 2–5 days of the order being placed.",
            why: "The carrier confirms it has accepted the circuit order, typically within 2–5 days. If nothing arrives, follow up: the carrier-led phases (survey, installation, handover) only start after this.",
            plan: { start: 6, days: 5 } }
        ] },
        { id: "wan.p4", stage: "B", name: "Arrange circuit site survey",
          summary: "The carrier contacts the customer's local team to book a site survey that confirms the work needed and the exact delivery dates. At 15 working days it is the longest phase in the MS Project plan, because the carrier and the customer have to agree a date.",
          steps: [
          { id: "wan.p4.s01", text: "Carrier contacts the customer's local team to arrange a site survey — to confirm the work required to deliver the circuits and the exact delivery dates", owner: "Carrier",
            why: "The carrier books a site survey with the customer's local team to confirm the work needed to deliver the circuit and the exact delivery dates. Until then, carrier dates are only estimates.",
            plan: { start: 11, days: 15 } },
          { id: "wan.p4.s02", text: "Customer local team responds to the carrier to confirm a date", owner: "Customer",
            why: "The survey can only be booked once the customer's local team confirms a date with the carrier. It is a dependency you don't control directly, so check that the customer has replied.",
            plan: { start: 11, days: 15 } }
        ] },
        { id: "wan.p5", stage: "B", name: "Circuit site survey",
          summary: "A carrier engineer visits the site to survey it, and the customer's local team must give them access.",
          steps: [
          { id: "wan.p5.s01", text: "Carrier engineer is on site to run the site survey", owner: "Carrier",
            why: "A carrier engineer visits the site to check how the circuit will be delivered. The result shapes the installation work, including whether landlord approvals or several visits are needed.",
            plan: { start: 26, days: 1 } },
          { id: "wan.p5.s02", text: "Customer local team grants the carrier engineer access to site to complete the survey", owner: "Customer",
            why: "The carrier engineer can't survey without site access, so the customer's local team must let them in on the agreed day. A missed visit has to be rebooked with the carrier.",
            plan: { start: 26, days: 1 } }
        ] },
        { id: "wan.p6", stage: "B", name: "Arrange circuit installation",
          summary: "The carrier books the circuit and NTU installation with the customer, who handles any landlord approvals, grants access and completes the in-house wiring from the DMARC to the server room. MS Project shows this phase as a milestone, but the customer-side work can take several visits.",
          milestone: { name: "Circuit installation arranged", plan: { start: 26, days: 0 } },
          steps: [
          { id: "wan.p6.s01", text: "Carrier contacts the customer's local team again to arrange the circuit installation and install the carrier NTU devices", owner: "Carrier",
            why: "The carrier books the circuit installation with the customer's local team, including the NTU (the carrier device at the site edge that terminates the circuit). This sets the installation date in your plan.",
            plan: { start: 26, days: 1 } },
          { id: "wan.p6.s02", text: "Obtain landlord approvals where required", owner: "Customer",
            note: "In some cases installation needs landlord approval — this requires customer support and may need multiple visits based on the survey results.",
            why: "Some buildings need the landlord's approval before the carrier can install. The customer's local team must get it, and it may take several visits depending on the survey, so raise it early.",
            plan: { start: 26, days: 1 } },
          { id: "wan.p6.s03", text: "Customer local team responds to the carrier and grants access to complete the circuit installation", owner: "Customer",
            why: "The carrier can only install once the customer's local team replies and grants access. Check the date is agreed so the installation isn't postponed.",
            plan: { start: 26, days: 1 } },
          { id: "wan.p6.s04", text: "Customer completes the in-house wiring to extend the circuit from the carrier DMARC up to the server room where the OB routers will be installed", owner: "Customer",
            why: "The DMARC is where the carrier's circuit ends and the customer's wiring begins. The customer must extend the circuit from there to the server room where the OB routers will be installed.",
            plan: { start: 26, days: 1 } }
        ] },
        { id: "wan.p7", stage: "B", name: "Circuit installation",
          summary: "The carrier engineer installs the circuit on site, escorted by the customer's local team. It is a milestone in the MS Project plan.",
          milestone: { name: "Circuit installed", plan: { start: 26, days: 0 } },
          steps: [
          { id: "wan.p7.s01", text: "Carrier engineer is on site to run the circuit installation", owner: "Carrier",
            why: "The carrier engineer comes on site to install the physical circuit. Track this date closely: router installation can't start until the circuit is installed and handed over to OB.",
            plan: { start: 26, days: 1 } },
          { id: "wan.p7.s02", text: "Customer local team escorts the carrier engineer", owner: "Customer",
            why: "The customer's local team must escort the carrier engineer on site. Make sure someone is named and available on the day so the installation can go ahead.",
            plan: { start: 26, days: 1 } }
        ] },
        { id: "wan.p8", stage: "B", name: "Circuit handover to OB",
          summary: "After installation, the carrier hands the circuit over to Orange Business, which ends the carrier-led stage. In the MS Project plan the consultant also prepares the LLD and the vanilla router configs during this phase.",
          steps: [
          { id: "wan.p8.s01", text: "After the circuit is successfully installed by the local carrier, the circuit is handed over to the OB team", owner: "Carrier → OB",
            why: "Once the circuit is installed, the carrier hands it over to Orange Business. This ends the carrier-led stage and triggers router installation planning (phase 9).",
            plan: { start: 27, days: 5 } }
        ] },
        { id: "wan.p9", stage: "C", name: "Router installation planning",
          summary: "OB arranges the router shipment and agrees the installation date with the customer's local team, who name an escort contact. A courier delivers the hardware, and the customer stores it until the OB engineer arrives.",
          steps: [
          { id: "wan.p9.s01", text: "Once the circuit is handed over, OB local delivery team contacts the customer's local team to arrange the OB routers' shipment to the customer", owner: "OB",
            why: "With the circuit handed over, OB's local delivery team contacts the customer's local team to arrange shipping the OB routers to site, so the hardware is there before installation.",
            plan: { start: 32, days: 5 } },
          { id: "wan.p9.s02", text: "Agree on the installation date", owner: "OB",
            note: "The OB engineer can sometimes carry the routers on the day, but the standard process ships the hardware to site beforehand.",
            why: "OB and the customer agree the day the OB engineer installs the routers. The standard process ships the hardware to site beforehand; the engineer carrying the routers on the day is the exception.",
            plan: { start: 32, days: 5 } },
          { id: "wan.p9.s03", text: "Customer local team confirms the installation date and shares the local contact who will escort the OB engineer", owner: "Customer",
            why: "The customer confirms the installation date and names the local contact who will escort the OB engineer. On the day, the escort guides the engineer to the server room (step 10.2).",
            plan: { start: 32, days: 5 } },
          { id: "wan.p9.s04", text: "Hardware shipment to the customer site", owner: "OB",
            why: "The routers are shipped to the customer site before the installation date, which is the standard process. Check they will arrive in time for the agreed date.",
            plan: { start: 32, days: 5 } },
          { id: "wan.p9.s05", text: "Courier contacts the customer's local team to ship the new hardware to site", owner: "Courier",
            why: "The courier contacts the customer's local team to deliver the new hardware to site. Make sure the customer knows it is coming and who will receive it.",
            plan: { start: 32, days: 5 } },
          { id: "wan.p9.s06", text: "Customer local team responds to the courier and collects the new devices", owner: "Customer",
            why: "Someone on site must answer the courier and collect the devices. If nobody does, the routers may not be on site for the installation date.",
            plan: { start: 32, days: 5 } },
          { id: "wan.p9.s07", text: "Customer local team stores the hardware until the installation date, then hands it to the OB engineer", owner: "Customer",
            why: "The customer keeps the routers safe until the installation day, then hands them to the OB engineer. Without the hardware on site, the installation can't go ahead.",
            plan: { start: 32, days: 5 } }
        ] },
        { id: "wan.p10", stage: "C", name: "Router installation & service acceptance test",
          summary: "An OB engineer racks the routers and connects them to the new WAN circuit while the OB installation team tests connectivity remotely. The site stays on its current service until the cutover.",
          steps: [
          { id: "wan.p10.s01", text: "OB engineer visits the site and racks & connects the routers to the WAN connection; OB installation team supports remotely and tests connectivity", owner: "OB",
            note: "The LAN connection is kept unshut (inactive) at this stage — activation happens at cutover.",
            why: "The OB engineer racks the routers and connects them to the new WAN circuit while the OB installation team tests connectivity remotely. Users stay on the current service until the cutover (phase 13).",
            plan: { start: 37, days: 1 } },
          { id: "wan.p10.s02", text: "Customer local team escorts the OB engineer and guides them to the server room where the devices will be installed", owner: "Customer",
            why: "The customer's local team escorts the OB engineer and guides them to the server room where the routers go. Check the escort named in step 9.3 is available on the day.",
            plan: { start: 37, days: 1 } }
        ] },
        { id: "wan.p11", stage: "C", name: "Migration planning",
          summary: "OB and the customer agree the cutover date and downtime window and make sure the customer's testers will be available. The meeting invite goes out a week ahead to secure everyone.",
          steps: [
          { id: "wan.p11.s01", text: "OB & customer project teams plan a date to cut over the current service and migrate to the new SD-WAN solution", owner: "OB",
            why: "OB and the customer's project team pick a date to cut over from the current service to the new SD-WAN solution. The cutover is a single change window, so everyone works to that date.",
            plan: { start: 38, days: 5 } },
          { id: "wan.p11.s02", text: "Customer local & project team confirm a date & downtime window to activate the LAN connectivity & SD-WAN solution", owner: "Customer",
            why: "The customer confirms the date and the downtime window in which the LAN connectivity and SD-WAN will be activated. The site is affected during this window, so it must be agreed in advance.",
            plan: { start: 38, days: 5 } },
          { id: "wan.p11.s03", text: "Customer local testers are available during the agreed window to run the acceptance testing", owner: "Customer",
            why: "The customer's testers must be available during the window to run the acceptance tests. Without them, nobody can confirm the service works after the cutover.",
            plan: { start: 38, days: 5 } },
          { id: "wan.p11.s04", text: "OB PM sends a team meeting invite for the activity a week in advance to secure all resources", owner: "OB PM",
            why: "Sending the meeting invite a week ahead secures everyone for the cutover window: the customer's local team and testers, the OB engineer and the OB TM team.",
            plan: { start: 38, days: 5 } }
        ] },
        { id: "wan.p12", stage: "C", name: "Submit change for CAB approval",
          summary: "The customer PM submits the change to their Change Advisory Board, which must approve it before the cutover date.",
          steps: [
          { id: "wan.p12.s01", text: "Customer PM submits a CAB request to be approved prior to the cutover date", owner: "Customer",
            why: "The customer PM submits the change to their Change Advisory Board (CAB), which must approve it before the cutover date. If approval isn't in place in time, a new migration date has to be agreed.",
            plan: { start: 43, days: 5 } }
        ] },
        { id: "wan.p13", stage: "D", name: "Migration & customer acceptance test",
          summary: "In the agreed window, OB opens the Teams call and the LAN cables move to the new routers. The OB TM team then activates the LAN and tests remotely, and the customer's testers confirm the service works.",
          steps: [
          { id: "wan.p13.s01", text: "OB PM opens the Teams meeting", owner: "OB PM",
            why: "The OB PM opens the Teams meeting at the start of the window, so OB, the customer's engineers and the testers work through the cutover together on one call.",
            plan: { start: 48, days: 1 } },
          { id: "wan.p13.s02", text: "OB engineer or customer local engineer connects the LAN cables to the new routers", owner: "OB / Customer",
            why: "The LAN cables are moved to the new routers by the OB engineer or the customer's local engineer. This is the physical part of the cutover.",
            plan: { start: 48, days: 1 } },
          { id: "wan.p13.s03", text: "OB TM team activates the LAN & tests the service remotely", owner: "OB TM",
            why: "The OB TM team activates the LAN on the new routers and tests the service remotely. This is when the site starts running on the new SD-WAN service.",
            plan: { start: 48, days: 1 } },
          { id: "wan.p13.s04", text: "Customer local testers run the acceptance testing and confirm the service is working as expected", owner: "Customer",
            why: "The customer's testers run the acceptance tests and confirm the service works as expected. Their confirmation shows the cutover succeeded; hyper care then runs until the hand-over.",
            plan: { start: 48, days: 1 } }
        ] },
        { id: "wan.p14", stage: "D", name: "HOTO — hand over to operations",
          summary: "After 7 calendar days of hyper care from the migration date, and with the customer's approval, the OB project team hands the site over to operations.",
          steps: [
          { id: "wan.p14.s01", text: "OB project team hands the new site over to operations after 7 calendar days from the migration date", owner: "OB",
            why: "Hyper care is the close-support period after go-live. After 7 calendar days from the migration date, the OB project team hands the site over to operations (HOTO), the goal of every delivery.",
            plan: { start: 49, days: 5 } },
          { id: "wan.p14.s02", text: "Customer local & project team approve the site to exit hyper care and hand over to operations", owner: "Customer",
            why: "The customer's local and project team approve the site leaving hyper care. With their approval, the operations team takes over support of the site.",
            plan: { start: 49, days: 5 } }
        ] }
      ]
    }

  }
};
