/* ═══════════════════════════════════════════════════════════
   DPM Knowledge Base — HOTO Pack Builder data
   ───────────────────────────────────────────────────────────
   Used by hoto.html and its Excel export (hoto-export.js).
   Two things live here:
     • trackers  — the columns of the LAN and WAN site/device
                   HOTO trackers (one row per device on LAN, one
                   row per site/circuit on WAN). These two layouts
                   mirror the team's LAN and WAN HOTO trackers.
     • readiness — the "is the pack complete?" checklist for each
                   service: the standard pack artefacts (runbook,
                   LLD, UAT sign-off) plus the closure steps that
                   also appear on the delivery checklist.

   PRIVACY / STORAGE
     This tool stores everything the DPM types (tracker rows and
     readiness overrides) only in the viewer's own browser
     (localStorage key "dpmkb_hoto_v1"). Nothing here — and
     nothing typed into the tool — is ever sent anywhere. Keep
     this file free of real customer, site or device data: the
     column lists below are generalised layouts only.

   HOW TO ADD A COLUMN
     Add an object to the right tracker's "columns" array, in the
     position you want it to appear:
        { key: "myKey", label: "My Column", type: "text", width: 20 }
     • key   — a short, unique, stable identifier (never reuse or
               rename one: it is how saved rows are keyed).
     • type  — "text" | "date" | "select". A "select" also needs
               options: ["A","B",…]. A "date" is written to Excel
               as a real date.
     • width — optional Excel column width (characters).

   HOW TO ADD A READINESS ITEM
     Add an object to readiness.lan or readiness.wan:
        { id: "myId", label: "…", detail: "…", stepId: "p4.s08" }
     • id     — short, unique, stable (keys the viewer's override).
     • stepId — OPTIONAL. The delivery-checklist step id WITHOUT
               the service prefix (e.g. "p4.s01" or "p13.s04").
               hoto.html resolves it against the project's own type
               (ap/wlc/wan) — so "p4.s01" becomes "ap.p4.s01" or
               "wlc.p4.s01" — and auto-ticks the item from the
               project's saved progress. Items with no stepId (the
               standard pack artefacts) are ticked by hand.
     Bump "updated" whenever you change anything here.
═══════════════════════════════════════════════════════════ */
window.KB_HOTO = {
  version: 1,
  updated: "2026-09-30",

  trackers: {

    /* ── LAN HOTO tracker — one row per device ── */
    lan: {
      label: "LAN HOTO tracker",
      rowNoun: "device",
      columns: [
        { key: "goldRef",       label: "Gold Ref",                    type: "text",   width: 16 },
        { key: "goLiveDate",    label: "Go-Live Date",                type: "date",   width: 14 },
        { key: "projectManager",label: "Project Manager",             type: "text",   width: 20 },
        { key: "city",          label: "City",                        type: "text",   width: 16 },
        { key: "country",       label: "Country",                     type: "text",   width: 14 },
        { key: "siteAddress",   label: "Site Address",                type: "text",   width: 30 },
        { key: "custSiteId",    label: "Customer Site ID",            type: "text",   width: 18 },
        { key: "custDeviceName",label: "Customer Device Name",        type: "text",   width: 22 },
        { key: "obsDeviceName", label: "OBS Device Name",             type: "text",   width: 22 },
        { key: "deviceType",    label: "Device Type",                 type: "select", width: 15,
          options: ["Switch", "WLC", "AP", "Router", "Firewall", "Other"] },
        { key: "switchNumber",  label: "Switch Number",               type: "text",   width: 14 },
        { key: "stackMaster",   label: "Stack Master Name",           type: "text",   width: 20 },
        { key: "deviceModel",   label: "Device Model",                type: "text",   width: 18 },
        { key: "usid",          label: "USID (Salto ID)",             type: "text",   width: 16 },
        { key: "wlcScope",      label: "WLC (Regional / Local)",      type: "select", width: 18,
          options: ["Regional", "Local"] },
        { key: "adminIp",       label: "Admin IP Address",            type: "text",   width: 18 },
        { key: "custIp",        label: "Customer IP Address",         type: "text",   width: 18 },
        { key: "serialNo",      label: "Device Serial No.",           type: "text",   width: 20 },
        { key: "localContact",  label: "Local Site Contact",          type: "text",   width: 22 },
        { key: "localPhone",    label: "Local Contact Phone/Mobile",  type: "text",   width: 22 },
        { key: "localEmail",    label: "Local Contact Email",         type: "text",   width: 26 }
      ]
    },

    /* ── WAN HOTO tracker — one row per site / circuit ── */
    wan: {
      label: "WAN HOTO tracker",
      rowNoun: "site / circuit",
      columns: [
        { key: "hotoSentDate",  label: "HOTO Package Sent Date",              type: "date",   width: 18 },
        { key: "migrationDate", label: "Site Migration Date",                 type: "date",   width: 16 },
        { key: "goldOrder",     label: "Gold Order",                          type: "text",   width: 16 },
        { key: "saltoOrder",    label: "Salto Order",                         type: "text",   width: 16 },
        { key: "usid",          label: "USID",                                type: "text",   width: 14 },
        { key: "site",          label: "Site",                                type: "text",   width: 22 },
        { key: "address",       label: "Address",                             type: "text",   width: 30 },
        { key: "building",      label: "Building",                            type: "text",   width: 16 },
        { key: "floor",         label: "Floor",                               type: "text",   width: 10 },
        { key: "roomNumber",    label: "Room Number",                         type: "text",   width: 14 },
        { key: "region",        label: "Region",                              type: "text",   width: 14 },
        { key: "city",          label: "City",                                type: "text",   width: 16 },
        { key: "country",       label: "Country",                             type: "text",   width: 14 },
        { key: "custContact",   label: "Customer Local Contact",              type: "text",   width: 24 },
        { key: "custEmail",     label: "Customer Local Contact Email",        type: "text",   width: 28 },
        { key: "circuitType",   label: "Circuit Type (VMI / BVPN)",           type: "select", width: 20,
          options: ["VMI", "BVPN", "Other"] },
        { key: "ipAddress",     label: "IP Address",                          type: "text",   width: 18 },
        { key: "gateway",       label: "Gateway",                             type: "text",   width: 18 },
        { key: "subnetMask",    label: "Subnet Mask",                         type: "text",   width: 18 },
        { key: "connectionType",label: "Connection Type (Standalone / Dual)", type: "select", width: 24,
          options: ["Standalone", "Dual"] },
        { key: "telco",         label: "Telco (Carrier Details)",             type: "text",   width: 24 },
        { key: "lec",           label: "LEC (if applicable)",                 type: "text",   width: 18 },
        { key: "lmpManagedBy",  label: "LMP Managed By",                      type: "text",   width: 18 },
        { key: "circuitId",     label: "Circuit ID",                          type: "text",   width: 20 },
        { key: "deviceOwner",   label: "Device Owned by / Managed by",        type: "text",   width: 24 },
        { key: "accessSpeed",   label: "Access Speed",                        type: "text",   width: 16 },
        { key: "ipBandwidth",   label: "IP Bandwidth",                        type: "text",   width: 16 }
      ]
    }
  },

  /* ── Readiness: the HOTO-pack completeness checklist per service ──
     stepId (where present) is resolved against the project type, so
     "p4.s01" → "ap.p4.s01" / "wlc.p4.s01" and "p13.s04" → "wan.p13.s04".
     Items with no stepId are the standard pack artefacts, ticked by hand. */
  readiness: {

    lan: [
      { id: "runbook",    label: "Runbook prepared",
        detail: "The migration runbook (with the LLD) is written and ready for hand-over." },
      { id: "lld",        label: "LLD prepared",
        detail: "The Low-Level Design is complete and attached to the pack." },
      { id: "uat",        label: "UAT completed & signed off by the customer",
        detail: "The customer has run User Acceptance Testing and signed it off." },
      { id: "success",    label: "Success notification sent", stepId: "p4.s01",
        detail: "The success notification has gone to the customer confirming the migration is complete and tested." },
      { id: "cmdb",       label: "CMDB update sent", stepId: "p4.s02",
        detail: "The CMDB (ServiceNow) has been updated with the devices added and removed." },
      { id: "dnac",       label: "DNAC update sent", stepId: "p4.s03",
        detail: "The DNAC / Catalyst Center update has been sent so the new devices are managed and monitored." },
      { id: "gold",       label: "GOLD order closed", stepId: "p4.s04",
        detail: "The GOLD order has been closed with the ODM." },
      { id: "salto",      label: "SALTO order closed", stepId: "p4.s05",
        detail: "The SALTO order has been closed alongside GOLD." },
      { id: "sharepoint", label: "HOTO document + runbook (incl. LLD) uploaded to SharePoint", stepId: "p4.s06",
        detail: "The HOTO document, runbook and LLD are uploaded to the SharePoint project folder." },
      { id: "handover",   label: "HOTO document sent to the HOTO Manager", stepId: "p4.s07",
        detail: "The HOTO document has gone to the HOTO Manager for sign-off — the goal of every delivery." }
    ],

    wan: [
      { id: "sat",        label: "Service Acceptance Test / UAT completed & signed off", stepId: "p13.s04",
        detail: "The customer's testers have run the acceptance tests and confirmed the service works as expected." },
      { id: "cab",        label: "CAB change approved (if applicable)", stepId: "p12.s01",
        detail: "The customer's Change Advisory Board approved the change before the cutover date." },
      { id: "migration",  label: "Migration completed & confirmed by the customer", stepId: "p13.s03",
        detail: "The LAN has been activated on the new routers and the site is running on the new SD-WAN service." },
      { id: "hypercare",  label: "Hyper-care period agreed (hand-over after the agreed calendar days)", stepId: "p14.s01",
        detail: "The close-support (hyper-care) period is agreed; the site hands over to operations after the agreed calendar days." },
      { id: "exit",       label: "Customer local project team approved site to exit hyper-care & hand over to operations", stepId: "p14.s02",
        detail: "The customer's local and project team have approved the site leaving hyper-care for operations." },
      { id: "sharepoint", label: "HOTO document uploaded to SharePoint",
        detail: "The HOTO document, runbook and LLD are uploaded to the SharePoint project folder." },
      { id: "handover",   label: "HOTO document sent to the HOTO Manager",
        detail: "The HOTO document has gone to the HOTO Manager for sign-off." },
      { id: "gold",       label: "GOLD order closed (if applicable)",
        detail: "Any GOLD order for this site has been closed." },
      { id: "salto",      label: "SALTO order closed (if applicable)",
        detail: "Any SALTO order for this site has been closed." }
    ]
  }
};
