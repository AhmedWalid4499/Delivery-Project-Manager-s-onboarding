/* ═══════════════════════════════════════════════════════════
   DPM Knowledge Base — Delivery Checklist data
   ───────────────────────────────────────────────────────────
   Used by checklist.html. One entry per delivery type. The steps
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
   • Removing a step: delete it. Old ticks for it are simply ignored.
   • LAN steps use "team" (who is involved, as on the process page);
     WAN steps use "owner" (OB / Carrier / Customer / Courier …).
   • Optional per step: "note" (short tip), "tools" (array of tool
     names), "link" ({ href: "some-page.html", label: "…" } —
     pages on this site only).
   • Bump "updated" (YYYY-MM-DD) whenever you change the steps.
═══════════════════════════════════════════════════════════ */
window.KB_CHECKLISTS = {
  version: 1,
  updated: "2026-09-29",
  types: {

    /* ─────────────────────── LAN — AP ─────────────────────── */
    ap: {
      title: "LAN — AP (wireless) process",
      short: "AP",
      icon: "📡",
      sourcePage: "process-ap.html",
      blurb: "The customer mounts the APs and the VPO stages them remotely — no Field Engineer on site, one MACHX raise, and Option 43 must be verified.",
      phases: [
        { id: "ap.p1", name: "Ordering", steps: [
          { id: "ap.p1.s01", text: "Make sure the GOLD order is created with the right scope", team: "DPM · Project Manager", tools: ["GOLD"] },
          { id: "ap.p1.s02", text: "Make sure the SALTO order is created correctly, matching the GOLD order scope", team: "DPM · Project Manager", tools: ["SALTO"] },
          { id: "ap.p1.s03", text: "Assign the GOLD order to yourself", team: "DPM", tools: ["GOLD"] },
          { id: "ap.p1.s04", text: "Contact supply chain for ordering progress", team: "DPM · ODM · Supply Chain" },
          { id: "ap.p1.s05", text: "Get an EDD (Estimated Date of Delivery)", team: "DPM · ODM" },
          { id: "ap.p1.s06", text: "Confirm the devices have successfully arrived at the warehouse", team: "DPM · ODM · Supply Chain" },
          { id: "ap.p1.s07", text: "Confirm with the consultant that the runbook + LLD are being prepared for the site", team: "DPM · Solution Consultant · Supply Chain" },
          { id: "ap.p1.s08", text: "Check whether the devices are to be staged in the warehouse or at the customer site", team: "DPM · Project Manager" },
          { id: "ap.p1.s09", text: "Stage the devices at the warehouse if needed (send FE to site)", team: "DPM · ODM · Project Manager" },
          { id: "ap.p1.s10", text: "Raise a shipping alert for the devices to the customer site", team: "DPM · ODM · Supply Chain" }
        ] },
        { id: "ap.p2", name: "Pre-Migration", steps: [
          { id: "ap.p2.s01", text: "Confirm with supply chain that the order has arrived at the customer site", team: "DPM · Supply Chain" },
          { id: "ap.p2.s02", text: "Send to the customer and confirm receipt with them", team: "DPM" },
          { id: "ap.p2.s03", text: "Confirm with the SC that the runbook is prepared", team: "DPM · Solution Consultant" },
          { id: "ap.p2.s04", text: "Set up a call with the customer — align on a possible migration date and explain that the customer will be the one mounting the APs", team: "DPM · PM · Solution Consultant · VPO" },
          { id: "ap.p2.s05", text: "Send the customer to connect the APs to the switch", team: "DPM" },
          { id: "ap.p2.s06", text: "Send to the VPOs to stage the APs", team: "DPM · VPO" },
          { id: "ap.p2.s07", text: "Send the customer the UAT Test document", team: "DPM" },
          { id: "ap.p2.s08", text: "Get confirmation from the customer on the migration date (by email)", team: "DPM" },
          { id: "ap.p2.s09", text: "Raise a change request on SNOW (ServiceNow)", team: "DPM", tools: ["ServiceNow"] },
          { id: "ap.p2.s10", text: "Check that Option 43 is configured", team: "DPM · DHCP Team",
            note: "⚠️ Critical — the AP cannot find the WLC without it. Verify on the DHCP scope for the AP VLAN.",
            link: { href: "option43.html", label: "Option 43 calculator →" } },
          { id: "ap.p2.s11", text: "Raise an Option 43 request if needed", team: "DPM · DHCP Team · Change Manager" },
          { id: "ap.p2.s12", text: "Raise MACHX for the VPOs", team: "DPM", tools: ["MACHX"],
            note: "The single MACHX raise for the AP process (covers staging & migration)." },
          { id: "ap.p2.s13", text: "Get the answered UAT document back from the customer", team: "DPM" },
          { id: "ap.p2.s14", text: "Send migration invitations to the customer and VPO (PM and SC as optional on all migrations)", team: "DPM · PM · Solution Consultant · VPO" }
        ] },
        { id: "ap.p3", name: "During Migration", steps: [
          { id: "ap.p3.s01", text: "Join the migration call", team: "DPM · VPO" },
          { id: "ap.p3.s02", text: "Keep track of all the APs that are migrated and still pending migration", team: "DPM · VPO" },
          { id: "ap.p3.s03", text: "Ask the customer to do UAT for all SSIDs, and then for all APs", team: "DPM · VPO" },
          { id: "ap.p3.s04", text: "Ask the customer to fully test all services connected to the APs", team: "DPM · VPO" },
          { id: "ap.p3.s05", text: "Get confirmation from the customer that everything is working", team: "DPM · VPO" }
        ] },
        { id: "ap.p4", name: "Post-Migration", steps: [
          { id: "ap.p4.s01", text: "Send the success notification", team: "DPM" },
          { id: "ap.p4.s02", text: "Send the CMDB update", team: "DPM · CMDB Team", tools: ["ServiceNow"] },
          { id: "ap.p4.s03", text: "Send the DNAC update", team: "DPM · VPO", tools: ["DNAC"] },
          { id: "ap.p4.s04", text: "Close the GOLD order", team: "DPM · ODM", tools: ["GOLD"] },
          { id: "ap.p4.s05", text: "Close the SALTO order", team: "DPM · ODM", tools: ["SALTO"] },
          { id: "ap.p4.s06", text: "Upload the HOTO document and runbook (including LLD) to SharePoint", team: "DPM", tools: ["SharePoint"] },
          { id: "ap.p4.s07", text: "Send the HOTO document to the HOTO Manager", team: "DPM · HOTO Manager" }
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
      phases: [
        { id: "wlc.p1", name: "Ordering", steps: [
          { id: "wlc.p1.s01", text: "Make sure the GOLD order is created with the right scope", team: "DPM · Project Manager", tools: ["GOLD"] },
          { id: "wlc.p1.s02", text: "Make sure the SALTO order is created correctly, matching the GOLD order scope", team: "DPM · Project Manager", tools: ["SALTO"] },
          { id: "wlc.p1.s03", text: "Assign the GOLD order to yourself", team: "DPM", tools: ["GOLD"] },
          { id: "wlc.p1.s04", text: "Contact supply chain for ordering progress", team: "DPM · Supply Chain" },
          { id: "wlc.p1.s05", text: "Get an EDD (Estimated Date of Delivery)", team: "DPM · ODM" },
          { id: "wlc.p1.s06", text: "Confirm the devices have successfully arrived at the warehouse", team: "ODM · Supply Chain" },
          { id: "wlc.p1.s07", text: "Confirm with the consultant that the runbook + LLD are being prepared for the site", team: "DPM · Solution Consultant" },
          { id: "wlc.p1.s08", text: "Check whether the devices are to be staged in the warehouse or at the customer site", team: "DPM · Project Manager" },
          { id: "wlc.p1.s09", text: "Stage the devices at the warehouse if needed (send FE to site)", team: "DPM · ODM · Solution Consultant · VPO" },
          { id: "wlc.p1.s10", text: "Raise a shipping alert for the devices to the customer site", team: "ODM · Supply Chain" }
        ] },
        { id: "wlc.p2", name: "Pre-Migration", steps: [
          { id: "wlc.p2.s01", text: "Confirm with supply chain that the order has arrived at the customer site", team: "Supply Chain · ODM" },
          { id: "wlc.p2.s02", text: "Send to the customer and confirm receipt with them", team: "DPM" },
          { id: "wlc.p2.s03", text: "Get the IP addresses from the TDT", team: "DPM · TDT", tools: ["TDT"],
            note: "Unique to the WLC/Switch process — addressing is needed before staging." },
          { id: "wlc.p2.s04", text: "Confirm with the SC that the runbook is prepared", team: "DPM · Solution Consultant" },
          { id: "wlc.p2.s05", text: "Set up an external dry run with the VPO, SC, and customer", team: "DPM · Solution Consultant · VPO" },
          { id: "wlc.p2.s06", text: "Set up dates for the staging with the customer", team: "DPM" },
          { id: "wlc.p2.s07", text: "Book the Field Engineer", team: "ODM", tools: ["FLIP"] },
          { id: "wlc.p2.s08", text: "Raise MACHX for the VPOs", team: "DPM", tools: ["MACHX"],
            note: "First MACHX raise — for the staging activity." },
          { id: "wlc.p2.s09", text: "Send the invitation for staging", team: "DPM" },
          { id: "wlc.p2.s10", text: "Run the staging activity", team: "DPM · Solution Consultant · VPO" },
          { id: "wlc.p2.s11", text: "Send the post-staging email, including daily status (if it runs more than one day)", team: "DPM" },
          { id: "wlc.p2.s12", text: "Follow up the external dry run with the VPO, SC, and customer — check for 3rd-party servers", team: "DPM · Solution Consultant · VPO",
            note: "⚠️ Explicitly check for DXC or other vendor servers with special requirements." },
          { id: "wlc.p2.s13", text: "Send the customer the UAT Test document", team: "DPM" },
          { id: "wlc.p2.s14", text: "Get confirmation from the customer on the migration date", team: "DPM" },
          { id: "wlc.p2.s15", text: "Raise a change request on SNOW (ServiceNow)", team: "DPM", tools: ["ServiceNow"] },
          { id: "wlc.p2.s16", text: "Align any teams you'll need during migration (DXC, ODC, DHCP teams)", team: "DPM · Change Manager" },
          { id: "wlc.p2.s17", text: "Raise MACHX for the VPOs", team: "DPM", tools: ["MACHX"],
            note: "Second MACHX raise — for the migration activity." },
          { id: "wlc.p2.s18", text: "Get the answered UAT document back from the customer", team: "DPM" },
          { id: "wlc.p2.s19", text: "Send migration invitations to the customer and VPO (PM and SC as optional on all migrations)", team: "DPM · PM · Solution Consultant · VPO · Change Manager" }
        ] },
        { id: "wlc.p3", name: "During Migration", steps: [
          { id: "wlc.p3.s01", text: "Join the migration call", team: "DPM · VPO" },
          { id: "wlc.p3.s02", text: "Keep track of all the switches that have been migrated and which are still pending", team: "DPM" },
          { id: "wlc.p3.s03", text: "Ask the customer to fully test all services connected to the migrated switches", team: "DPM" },
          { id: "wlc.p3.s04", text: "Get confirmation from the customer that everything is working", team: "DPM" }
        ] },
        { id: "wlc.p4", name: "Post-Migration", steps: [
          { id: "wlc.p4.s01", text: "Send the partial-migration email if it runs over multiple days (template provided); on a single day, or the last migration day, send the success notification", team: "DPM" },
          { id: "wlc.p4.s02", text: "Send the CMDB update", team: "DPM · CMDB Team", tools: ["ServiceNow"] },
          { id: "wlc.p4.s03", text: "Send the DNAC update", team: "DPM · VPO", tools: ["DNAC"] },
          { id: "wlc.p4.s04", text: "Close the GOLD order", team: "DPM · ODM", tools: ["GOLD"] },
          { id: "wlc.p4.s05", text: "Close the SALTO order", team: "DPM · ODM", tools: ["SALTO"] },
          { id: "wlc.p4.s06", text: "Upload the HOTO document and runbook (including LLD) to SharePoint", team: "DPM", tools: ["SharePoint"] },
          { id: "wlc.p4.s07", text: "Send the HOTO document to the HOTO Manager", team: "DPM · HOTO Manager" }
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
      phases: [
        { id: "wan.p1", stage: "A", name: "Local validation", steps: [
          { id: "wan.p1.s01", text: "OB local team contacts the customer's local team to validate the order scope, site details, circuit DMARC points, etc.", owner: "OB" },
          { id: "wan.p1.s02", text: "Customer local team responds to the validation request and provides all details", owner: "Customer",
            note: "Mandatory — OB cannot place the order with the carrier until this is returned." }
        ] },
        { id: "wan.p2", stage: "A", name: "Ordering circuit & hardware", steps: [
          { id: "wan.p2.s01", text: "Once the order is validated by the customer's local contact, OB delivery team orders the hardware & circuit", owner: "OB" }
        ] },
        { id: "wan.p3", stage: "A", name: "Carrier acknowledge", steps: [
          { id: "wan.p3.s01", text: "The carrier acknowledges the order", owner: "Carrier",
            note: "Typically within 2–5 days of the order being placed." }
        ] },
        { id: "wan.p4", stage: "B", name: "Arrange circuit site survey", steps: [
          { id: "wan.p4.s01", text: "Carrier contacts the customer's local team to arrange a site survey — to confirm the work required to deliver the circuits and the exact delivery dates", owner: "Carrier" },
          { id: "wan.p4.s02", text: "Customer local team responds to the carrier to confirm a date", owner: "Customer" }
        ] },
        { id: "wan.p5", stage: "B", name: "Circuit site survey", steps: [
          { id: "wan.p5.s01", text: "Carrier engineer is on site to run the site survey", owner: "Carrier" },
          { id: "wan.p5.s02", text: "Customer local team grants the carrier engineer access to site to complete the survey", owner: "Customer" }
        ] },
        { id: "wan.p6", stage: "B", name: "Arrange circuit installation", steps: [
          { id: "wan.p6.s01", text: "Carrier contacts the customer's local team again to arrange the circuit installation and install the carrier NTU devices", owner: "Carrier" },
          { id: "wan.p6.s02", text: "Obtain landlord approvals where required", owner: "Customer",
            note: "In some cases installation needs landlord approval — this requires customer support and may need multiple visits based on the survey results." },
          { id: "wan.p6.s03", text: "Customer local team responds to the carrier and grants access to complete the circuit installation", owner: "Customer" },
          { id: "wan.p6.s04", text: "Customer completes the in-house wiring to extend the circuit from the carrier DMARC up to the server room where the OB routers will be installed", owner: "Customer" }
        ] },
        { id: "wan.p7", stage: "B", name: "Circuit installation", steps: [
          { id: "wan.p7.s01", text: "Carrier engineer is on site to run the circuit installation", owner: "Carrier" },
          { id: "wan.p7.s02", text: "Customer local team escorts the carrier engineer", owner: "Customer" }
        ] },
        { id: "wan.p8", stage: "B", name: "Circuit handover to OB", steps: [
          { id: "wan.p8.s01", text: "After the circuit is successfully installed by the local carrier, the circuit is handed over to the OB team", owner: "Carrier → OB" }
        ] },
        { id: "wan.p9", stage: "C", name: "Router installation planning", steps: [
          { id: "wan.p9.s01", text: "Once the circuit is handed over, OB local delivery team contacts the customer's local team to arrange the OB routers' shipment to the customer", owner: "OB" },
          { id: "wan.p9.s02", text: "Agree on the installation date", owner: "OB",
            note: "The OB engineer can sometimes carry the routers on the day, but the standard process ships the hardware to site beforehand." },
          { id: "wan.p9.s03", text: "Customer local team confirms the installation date and shares the local contact who will escort the OB engineer", owner: "Customer" },
          { id: "wan.p9.s04", text: "Hardware shipment to the customer site", owner: "OB" },
          { id: "wan.p9.s05", text: "Courier contacts the customer's local team to ship the new hardware to site", owner: "Courier" },
          { id: "wan.p9.s06", text: "Customer local team responds to the courier and collects the new devices", owner: "Customer" },
          { id: "wan.p9.s07", text: "Customer local team stores the hardware until the installation date, then hands it to the OB engineer", owner: "Customer" }
        ] },
        { id: "wan.p10", stage: "C", name: "Router installation & service acceptance test", steps: [
          { id: "wan.p10.s01", text: "OB engineer visits the site and racks & connects the routers to the WAN connection; OB installation team supports remotely and tests connectivity", owner: "OB",
            note: "The LAN connection is kept unshut (inactive) at this stage — activation happens at cutover." },
          { id: "wan.p10.s02", text: "Customer local team escorts the OB engineer and guides them to the server room where the devices will be installed", owner: "Customer" }
        ] },
        { id: "wan.p11", stage: "C", name: "Migration planning", steps: [
          { id: "wan.p11.s01", text: "OB & customer project teams plan a date to cut over the current service and migrate to the new SD-WAN solution", owner: "OB" },
          { id: "wan.p11.s02", text: "Customer local & project team confirm a date & downtime window to activate the LAN connectivity & SD-WAN solution", owner: "Customer" },
          { id: "wan.p11.s03", text: "Customer local testers are available during the agreed window to run the acceptance testing", owner: "Customer" },
          { id: "wan.p11.s04", text: "OB PM sends a team meeting invite for the activity a week in advance to secure all resources", owner: "OB PM" }
        ] },
        { id: "wan.p12", stage: "C", name: "Submit change for CAB approval", steps: [
          { id: "wan.p12.s01", text: "Customer PM submits a CAB request to be approved prior to the cutover date", owner: "Customer" }
        ] },
        { id: "wan.p13", stage: "D", name: "Migration & customer acceptance test", steps: [
          { id: "wan.p13.s01", text: "OB PM opens the Teams meeting", owner: "OB PM" },
          { id: "wan.p13.s02", text: "OB engineer or customer local engineer connects the LAN cables to the new routers", owner: "OB / Customer" },
          { id: "wan.p13.s03", text: "OB TM team activates the LAN & tests the service remotely", owner: "OB TM" },
          { id: "wan.p13.s04", text: "Customer local testers run the acceptance testing and confirm the service is working as expected", owner: "Customer" }
        ] },
        { id: "wan.p14", stage: "D", name: "HOTO — hand over to operations", steps: [
          { id: "wan.p14.s01", text: "OB project team hands the new site over to operations after 7 calendar days from the migration date", owner: "OB" },
          { id: "wan.p14.s02", text: "Customer local & project team approve the site to exit hyper care and hand over to operations", owner: "Customer" }
        ] }
      ]
    }

  }
};
