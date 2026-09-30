/* ============================================================
   DPM Knowledge Base · Email templates (data only)
   ------------------------------------------------------------
   Used by templates.html. Edit the wording here — no other file
   needs to change.

   STATUS: every template below is a STARTER DRAFT written from
   the handbook's process steps. It is NOT the team's official
   wording. When the team agrees an official version, paste it in
   and set  draft: false  on that template (this removes its
   "Draft" tag; the warning banner disappears once no drafts are
   left).

   This repository is PUBLIC. Never add personal email addresses,
   internal hostnames, internal URLs or real customer data here.

   ── fields ─────────────────────────────────────────────────
   { key, label, placeholder, group, hint?, multiline? }
     key         letters/digits/underscore; used as {{key}} in text
     label       shown on the form, and as [label] in copied text
                 when the field is left blank
     group       fields with the same group are shown together
     multiline   true = a text area instead of a one-line input

   ── templates ──────────────────────────────────────────────
   { id, title, process, phase, kind, audience, step, to, cc,
     subject, body, draft? }
     id        unique, lowercase-with-dashes (used in links:
               templates.html#tmpl-<id>)
     process   any of "ap", "wlc", "wan"
     phase     one of the names in  phases  below
     kind      "email" or "invite" (a Teams / Outlook meeting)
     audience  "customer" (customer-facing), "internal", or
               "mixed" (customer and Orange Business attendees)
     step      the process step it serves, quoted from the
               process pages (a string, or an array of strings)
     to / cc   ROLES, never addresses
     subject   text with {{placeholders}}
     body      an array of lines (use "" for a blank line), or a
               single string with \n line breaks

   Writing rules
     • International / British English, concise and polite.
     • Customer-facing text must not use internal tool names
       (GOLD, SALTO, MACHX, FLIP, ServiceNow/SNOW, VPO, TIM) and
       must explain terms such as UAT, HOTO, DMARC and CAB.
     • [Square brackets] = a note the sender must complete or
       delete before sending. They are highlighted on the page.
============================================================ */
window.KB_TEMPLATES = {

  phases: ["Ordering", "Pre-migration", "Migration", "Post-migration"],

  fields: [
    { key: "yourName",  label: "Your name", placeholder: "e.g. Sam Taylor", group: "You" },
    { key: "signature", label: "Your role / signature line", placeholder: "e.g. Delivery Project Manager, Orange Business", group: "You",
      hint: "Shown under your name at the end of every email." },

    { key: "customer",        label: "Customer", placeholder: "e.g. Example Ltd", group: "Project" },
    { key: "site",            label: "Site", placeholder: "e.g. Brussels HQ", group: "Project" },
    { key: "orderRef",        label: "Order ref (GOLD)", placeholder: "e.g. the GOLD order number", group: "Project" },
    { key: "customerContact", label: "Customer contact name", placeholder: "e.g. Alex Martin", group: "Project" },
    { key: "scope",           label: "Devices / scope", placeholder: "e.g. 24 access points, floors 1-3", group: "Project",
      hint: "What is being delivered or replaced." },

    { key: "migrationDate",   label: "Migration date", placeholder: "e.g. Tuesday 14 October 2026", group: "Dates" },
    { key: "migrationWindow", label: "Migration window", placeholder: "e.g. 22:00-02:00 CET", group: "Dates" },
    { key: "stagingDate",     label: "Staging date(s)", placeholder: "e.g. 6-7 October 2026", group: "Dates" },
    { key: "dryRunDate",      label: "Dry-run date & time", placeholder: "e.g. Thursday 9 October, 10:00 CET", group: "Dates" },
    { key: "installDate",     label: "Router installation date (WAN)", placeholder: "e.g. Monday 6 October 2026", group: "Dates" },
    { key: "nextDate",        label: "Next session date", placeholder: "e.g. Wednesday 15 October 2026", group: "Dates" },
    { key: "responseDate",    label: "Reply needed by", placeholder: "e.g. Friday 3 October 2026", group: "Dates",
      hint: "Used wherever an email asks for a reply or a document by a date." },

    { key: "doneSummary",      label: "Completed so far", placeholder: "e.g. 12 of 24 switches (floors 1-3), all tests passed", group: "Progress (multi-day work)", multiline: true,
      hint: "For post-staging and partial-migration updates." },
    { key: "remainingSummary", label: "Still to do", placeholder: "e.g. 12 switches (floors 4-6)", group: "Progress (multi-day work)", multiline: true },

    { key: "changeRef", label: "Change ref (ServiceNow)", placeholder: "e.g. the CHG number", group: "Internal references" },
    { key: "machxRef",  label: "MACHX ref", placeholder: "e.g. the MACHX request number", group: "Internal references" }
  ],

  templates: [

    /* ─────────────────────────── ORDERING ─────────────────────────── */
    {
      id: "edd-request",
      title: "Ordering progress & EDD request",
      process: ["ap", "wlc"],
      phase: "Ordering",
      kind: "email",
      audience: "internal",
      step: "AP & WLC/Switch · Ordering 04–05: “Contact supply chain for ordering progress” and “Get an EDD (Estimated Date of Delivery)”",
      to: "Supply Chain / ODM (Order Delivery Manager)",
      cc: "PM",
      subject: "{{customer}} - {{site}}: ordering status and EDD - GOLD {{orderRef}}",
      body: [
        "Hello team,",
        "",
        "Could you please share the current ordering status for the order below, together with the EDD (Estimated Date of Delivery) to the warehouse?",
        "",
        "Customer: {{customer}}",
        "Site: {{site}}",
        "Order ref (GOLD): {{orderRef}}",
        "Scope: {{scope}}",
        "",
        "Please also let me know if any items are back-ordered or at risk of delay, so that I can plan staging and the migration date accordingly.",
        "",
        "Many thanks,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wan-local-validation",
      title: "WAN: local validation request",
      process: ["wan"],
      phase: "Ordering",
      kind: "email",
      audience: "customer",
      step: [
        "WAN · Phase 1.1: “OB local team contacts the customer's local team to validate the order scope, site details, circuit DMARC points, etc.”",
        "WAN · Phase 1.2: “Customer local team responds to the validation request and provides all details” — mandatory before the carrier order can be placed."
      ],
      to: "Customer local site team",
      cc: "Customer PM; Orange Business PM",
      subject: "{{customer}} - {{site}}: new WAN service - please validate the site details by {{responseDate}}",
      body: [
        "Dear {{customerContact}},",
        "",
        "Orange Business is preparing the delivery of the new WAN service for {{site}}. Before we can place the circuit order with the local carrier, we need your local team to validate the details below.",
        "",
        "Order reference: {{orderRef}}",
        "",
        "Please confirm or correct:",
        "1. Order scope: {{scope}}",
        "2. Site details: full site address, building and floor, opening hours and any access restrictions.",
        "3. Site contacts: the local contact(s) for the carrier and for our engineer, with phone numbers.",
        "4. Circuit demarcation (DMARC) point: where the carrier's circuit should terminate on site (for example, the building's main telecoms room), and where the server room that will host our routers is located.",
        "5. Anything that may affect installation, such as landlord approvals or building works.",
        "",
        "This validation is mandatory: we cannot place the order with the carrier until we receive it. Could you please reply by {{responseDate}}?",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    /* ───────────────────────── PRE-MIGRATION ───────────────────────── */
    {
      id: "hw-receipt",
      title: "Equipment delivered - confirm receipt",
      process: ["ap", "wlc"],
      phase: "Pre-migration",
      kind: "email",
      audience: "customer",
      step: "AP & WLC/Switch · Pre-migration 02: “Send to the customer and confirm receipt with them”",
      to: "Customer technical contact",
      cc: "PM",
      subject: "{{customer}} - {{site}}: new equipment delivered - please confirm receipt",
      body: [
        "Dear {{customerContact}},",
        "",
        "Our logistics team has confirmed that the new network equipment for {{site}} has been delivered to your site.",
        "",
        "Order reference: {{orderRef}}",
        "Equipment: {{scope}}",
        "",
        "Could you please confirm that the delivery has been received in full and in good condition, and let me know where it is stored until the installation?",
        "",
        "If anything is missing or damaged, please tell me by {{responseDate}} so that we can resolve it well before the migration.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wlc-tdt-ip",
      title: "IP addressing request (TDT)",
      process: ["wlc"],
      phase: "Pre-migration",
      kind: "email",
      audience: "internal",
      step: "WLC/Switch · Pre-migration 03: “Get the IP addresses from the TDT” — addressing is needed before staging.",
      to: "TDT (IP addressing team)",
      cc: "SC",
      subject: "{{customer}} - {{site}}: IP addressing needed before staging - GOLD {{orderRef}}",
      body: [
        "Hello team,",
        "",
        "Could you please provide the IP addressing for the new equipment below? We need it before staging, which is planned for {{stagingDate}}.",
        "",
        "Customer: {{customer}}",
        "Site: {{site}}",
        "Order ref (GOLD): {{orderRef}}",
        "Scope: {{scope}}",
        "",
        "Addressing needed: [e.g. management IP addresses, subnets, gateways and VLANs, as per the LLD]",
        "",
        "Please send the details to me and to the Solution Consultant by {{responseDate}}.",
        "",
        "Many thanks,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "ap-alignment-call",
      title: "Migration-date alignment call (AP)",
      process: ["ap"],
      phase: "Pre-migration",
      kind: "invite",
      audience: "mixed",
      step: "AP · Pre-migration 04: “Set up a call with the customer — align on a possible migration date and explain that the customer will be the one mounting the APs”",
      to: "Customer technical contact",
      cc: "PM; SC; VPO",
      subject: "{{customer}} - {{site}}: access point replacement - planning call",
      body: [
        "Dear {{customerContact}},",
        "",
        "I would like to set up a short call to plan the replacement of the wireless access points (APs) at {{site}}.",
        "",
        "Agenda:",
        "1. Agree a possible migration date and time window (proposal: {{migrationDate}}, {{migrationWindow}}).",
        "2. Mounting the new APs: for this delivery, your team mounts the new access points and connects them to the network switches. We will walk through what this involves and answer any questions.",
        "3. Next steps: remote pre-configuration of the APs by our engineers, the User Acceptance Test (UAT) document, and the change approval.",
        "",
        "From Orange Business: myself (Delivery Project Manager), with our Project Manager, Solution Consultant and implementation engineer.",
        "",
        "Please feel free to forward this invitation to anyone on your side who should join, such as your on-site IT contact.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wlc-dry-run-invite",
      title: "External dry-run invitation",
      process: ["wlc"],
      phase: "Pre-migration",
      kind: "invite",
      audience: "mixed",
      step: [
        "WLC/Switch · Pre-migration 05: “Set up an external dry run with the VPO, SC, and customer”",
        "WLC/Switch · Pre-migration 12: “Follow up the external dry run with the VPO, SC, and customer — check for 3rd-party servers”"
      ],
      to: "Customer technical contact; VPO; SC",
      cc: "PM (optional)",
      subject: "{{customer}} - {{site}}: migration dry run - {{dryRunDate}}",
      body: [
        "Dear all,",
        "",
        "This invitation is for the dry run of the migration planned at {{site}}.",
        "",
        "Dry run: {{dryRunDate}}",
        "Planned migration: {{migrationDate}}, {{migrationWindow}}",
        "",
        "The dry run lets us walk through the migration plan step by step with your team before the day, so that nothing is discovered for the first time during the maintenance window.",
        "",
        "Agenda:",
        "1. Walk-through of the migration plan and timings.",
        "2. Devices and services connected to each switch (for example phones, PCs, printers, cameras and wireless access points).",
        "3. Third-party servers and systems: please bring details of any servers or appliances managed by another supplier that connect to these switches, including any special VLAN, IP addressing or routing requirements.",
        "4. Rollback plan, contacts and communication during the migration.",
        "5. Testing: who will test which services after the migration (User Acceptance Test).",
        "",
        "To prepare, please invite the colleagues who know the connected systems, and any third-party suppliers who should be involved.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wlc-planning-call",
      title: "Staging & migration planning call (WLC/Switch)",
      process: ["wlc"],
      phase: "Pre-migration",
      kind: "invite",
      audience: "mixed",
      step: "WLC/Switch · Pre-migration 06: “Set up dates for the staging with the customer”",
      to: "Customer technical contact",
      cc: "PM; SC; VPO",
      subject: "{{customer}} - {{site}}: switch / controller replacement - staging and migration planning",
      body: [
        "Dear {{customerContact}},",
        "",
        "I would like to set up a call to plan the replacement of the network switches / wireless controller at {{site}}.",
        "",
        "Agenda:",
        "1. Staging: agree the date(s) on which our engineers pre-configure the new equipment to match your current setup (proposal: {{stagingDate}}).",
        "2. Migration: agree a possible migration date and maintenance window (proposal: {{migrationDate}}, {{migrationWindow}}).",
        "3. On-site support: an Orange Business field engineer will attend on the migration day. Please let us know about any site access requirements.",
        "4. Next steps: the dry run with your team, the User Acceptance Test (UAT) document and the change approval.",
        "",
        "From Orange Business: myself (Delivery Project Manager), with our Project Manager, Solution Consultant and implementation engineer.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "ap-mount-connect",
      title: "Request to mount & connect the new APs",
      process: ["ap"],
      phase: "Pre-migration",
      kind: "email",
      audience: "customer",
      step: "AP · Pre-migration 05: “Send the customer to connect the APs to the switch” — in the AP process the customer mounts the APs; there is no Field Engineer on site.",
      to: "Customer technical contact / on-site IT",
      cc: "PM",
      subject: "{{customer}} - {{site}}: please mount and connect the new access points by {{responseDate}}",
      body: [
        "Dear {{customerContact}},",
        "",
        "As agreed on our call, the next step for the access point (AP) replacement at {{site}} is for your on-site team to mount the new APs and connect them to the network.",
        "",
        "Equipment: {{scope}}",
        "Please complete by: {{responseDate}}",
        "Planned migration: {{migrationDate}}, {{migrationWindow}}",
        "",
        "Could your team please:",
        "1. Mount each new AP in its planned location.",
        "2. Connect each AP to the switch port agreed with our Solution Consultant.",
        "3. Reply to confirm how many APs are mounted and connected, ideally with a list of their locations (for example floor and room).",
        "",
        "If a switch port does not provide power (PoE) to the APs, or a location is not accessible, please let me know before you start.",
        "",
        "Once you confirm, our engineers will pre-configure the APs remotely. No further action is needed from your side for that step.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wlc-staging-invite",
      title: "Staging session invitation",
      process: ["wlc"],
      phase: "Pre-migration",
      kind: "invite",
      audience: "mixed",
      step: "WLC/Switch · Pre-migration 09: “Send the invitation for staging” (the staging itself is step 10).",
      to: "VPO; SC; Customer technical contact (if joining)",
      cc: "PM (optional); Field Engineer (if on site)",
      subject: "{{customer}} - {{site}}: staging session - {{stagingDate}}",
      body: [
        "Dear all,",
        "",
        "This invitation is for the staging session for {{customer}} - {{site}}.",
        "",
        "Date(s): {{stagingDate}}",
        "Location: [warehouse / customer site]",
        "Equipment: {{scope}}",
        "Planned migration: {{migrationDate}}, {{migrationWindow}}",
        "",
        "Purpose: to pre-configure the new equipment so that it matches the current setup, and to confirm it is ready for the migration.",
        "",
        "Before the session, please make sure that:",
        "- the latest runbook and Low-Level Design (LLD) are available;",
        "- the equipment is available at the staging location;",
        "- any remote or physical access needed for the session is in place.",
        "",
        "I will send a status update at the end of each staging day.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wlc-post-staging",
      title: "Post-staging status (daily if staging runs over several days)",
      process: ["wlc"],
      phase: "Pre-migration",
      kind: "email",
      audience: "mixed",
      step: "WLC/Switch · Pre-migration 11: “Send the post-staging email, including daily status (if it runs more than one day)”",
      to: "Customer technical contact; SC; VPO",
      cc: "PM",
      subject: "{{customer}} - {{site}}: staging status - [day X of Y / complete]",
      body: [
        "Dear all,",
        "",
        "Please find below the status of the staging activity for {{site}}.",
        "",
        "Staging date(s): {{stagingDate}}",
        "Overall status: [Completed / In progress / Blocked]",
        "",
        "Completed:",
        "{{doneSummary}}",
        "",
        "Remaining:",
        "{{remainingSummary}}",
        "",
        "Issues and actions:",
        "- [None / describe each issue, its owner and due date]",
        "",
        "Next step: [next staging day / dry-run follow-up / migration]",
        "Date: {{nextDate}}",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "uat-send",
      title: "UAT test document - send it and ask for it back",
      process: ["ap", "wlc"],
      phase: "Pre-migration",
      kind: "email",
      audience: "customer",
      step: [
        "AP Pre-migration 07 / WLC/Switch Pre-migration 13: “Send the customer the UAT Test document”",
        "AP Pre-migration 13 / WLC/Switch Pre-migration 18: “Get the answered UAT document back from the customer”"
      ],
      to: "Customer technical contact",
      cc: "PM",
      subject: "{{customer}} - {{site}}: User Acceptance Test (UAT) document - please return by {{responseDate}}",
      body: [
        "Dear {{customerContact}},",
        "",
        "Please find attached the User Acceptance Test (UAT) document for the migration at {{site}}, planned for {{migrationDate}}.",
        "",
        "The UAT document lists the tests your team will run after the migration to confirm that everything works as expected:",
        "- for access point migrations, each Wi-Fi network (SSID) is tested first, then each access point;",
        "- for switch migrations, all services connected to each migrated switch are tested.",
        "",
        "Could you please:",
        "1. Review the tests and add any services or applications that are critical for your users at this site (for example business applications, phones, printers or cameras).",
        "2. Name the person(s) who will run the tests, and confirm they are available during the migration window ({{migrationWindow}}).",
        "3. Return the completed document to me by {{responseDate}}.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "migration-date-confirm",
      title: "Migration-date confirmation request",
      process: ["ap", "wlc"],
      phase: "Pre-migration",
      kind: "email",
      audience: "customer",
      step: [
        "AP · Pre-migration 08: “Get confirmation from the customer on the migration date (by email)”",
        "WLC/Switch · Pre-migration 14: “Get confirmation from the customer on the migration date”"
      ],
      to: "Customer technical contact",
      cc: "PM",
      subject: "{{customer}} - {{site}}: please confirm the migration date - {{migrationDate}}",
      body: [
        "Dear {{customerContact}},",
        "",
        "Following our discussions, could you please confirm by reply to this email that the migration at {{site}} can go ahead as follows?",
        "",
        "Date: {{migrationDate}}",
        "Window: {{migrationWindow}}",
        "Scope: {{scope}}",
        "",
        "Your written confirmation allows us to raise the change request and book our engineers for this window.",
        "",
        "It would also help if you could confirm:",
        "- the on-site contact and site access arrangements for the day;",
        "- the person(s) who will run the User Acceptance Tests after the migration;",
        "- any business events or change-freeze periods around this date that we should be aware of.",
        "",
        "Please reply by {{responseDate}}.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "ap-option43",
      title: "Option 43 check / request (DHCP team)",
      process: ["ap"],
      phase: "Pre-migration",
      kind: "email",
      audience: "internal",
      step: [
        "AP · Pre-migration 10: “Check that Option 43 is configured” — critical: the AP cannot find the WLC without it.",
        "AP · Pre-migration 11: “Raise an Option 43 request if needed”"
      ],
      to: "DHCP team",
      cc: "Change Manager (if a change is needed); SC",
      subject: "{{customer}} - {{site}}: DHCP Option 43 for the new access points - needed by {{responseDate}}",
      body: [
        "Hello team,",
        "",
        "For the access point (AP) replacement at {{customer}} - {{site}}, planned for {{migrationDate}}, the new APs need DHCP Option 43 on the DHCP scope that serves the AP VLAN. Option 43 tells each AP the IP address of the wireless controller (WLC) it should join; without it, the APs get an IP address but never join the controller.",
        "",
        "Please [check that Option 43 is already configured / configure Option 43] as follows:",
        "- DHCP scope / AP VLAN: [scope or VLAN]",
        "- WLC IP address(es): [controller IP address(es)]",
        "- Option 43 value (hex): [value - generate it with the Option 43 calculator in the DPM Knowledge Base]",
        "",
        "Please confirm once this is done, by {{responseDate}} if possible, and let me know if a change request is needed on your side.",
        "",
        "Many thanks,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wlc-migration-teams",
      title: "Migration support teams alignment (DXC, ODC, DHCP)",
      process: ["wlc"],
      phase: "Pre-migration",
      kind: "email",
      audience: "internal",
      step: "WLC/Switch · Pre-migration 16: “Align any teams you'll need during migration (DXC, ODC, DHCP teams)”",
      to: "Supporting teams needed on the day (e.g. DXC, ODC, DHCP)",
      cc: "Change Manager; SC",
      subject: "{{customer}} - {{site}}: support needed during the network migration - {{migrationDate}}",
      body: [
        "Hello team,",
        "",
        "We are migrating the network equipment at {{customer}} - {{site}} on {{migrationDate}}, {{migrationWindow}}, and your team's support may be needed during the migration window.",
        "",
        "Change ref (ServiceNow): {{changeRef}}",
        "Scope: {{scope}}",
        "",
        "Could you please:",
        "1. Confirm a named contact who will be available during the window, with a phone number.",
        "2. Confirm any preparation needed on your side before the migration: [e.g. server, DHCP or firewall checks].",
        "3. Let me know of any constraints on timing.",
        "",
        "I will add your contact to the migration invitation.",
        "",
        "Many thanks,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "migration-invite",
      title: "Migration invitation",
      process: ["ap", "wlc"],
      phase: "Pre-migration",
      kind: "invite",
      audience: "mixed",
      step: "AP Pre-migration 14 / WLC/Switch Pre-migration 19: “Send migration invitations to the customer and VPO (PM and SC as optional on all migrations)”",
      to: "Customer technical contact; customer testers; VPO",
      cc: "Optional attendees: PM; SC",
      subject: "{{customer}} - {{site}}: network migration - {{migrationDate}}, {{migrationWindow}}",
      body: [
        "Dear all,",
        "",
        "This invitation is for the migration of the network equipment at {{customer}} - {{site}}.",
        "",
        "Date: {{migrationDate}}",
        "Window: {{migrationWindow}}",
        "Scope: {{scope}}",
        "",
        "How the session will run:",
        "1. Our engineers migrate the devices one by one, and I track progress on the call.",
        "2. As devices are migrated, your testers run the tests in the User Acceptance Test (UAT) document.",
        "3. Once all tests pass, we confirm together that the migration is complete, and I send a confirmation email.",
        "",
        "What we need from your side:",
        "- Your testers on this call for the whole window.",
        "- A contact who can take decisions if an issue arises (for example, whether to roll back).",
        "- [Switch migrations only: site access for our field engineer from the start of the window.]",
        "",
        "Please join using the meeting link in this invitation.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wan-router-install",
      title: "WAN: router installation date & escort contact",
      process: ["wan"],
      phase: "Pre-migration",
      kind: "email",
      audience: "customer",
      step: [
        "WAN · Phase 9.1–9.2: arrange the OB routers' shipment and “Agree on the installation date”",
        "WAN · Phase 9.3: “Customer local team confirms the installation date and shares the local contact who will escort the OB engineer”"
      ],
      to: "Customer local site team",
      cc: "Customer PM; Orange Business PM",
      subject: "{{customer}} - {{site}}: router installation on {{installDate}} - please confirm",
      body: [
        "Dear {{customerContact}},",
        "",
        "The carrier circuit for {{site}} has been handed over to Orange Business, so the next step is to install our routers.",
        "",
        "Proposed installation date: {{installDate}}",
        "",
        "Could you please confirm by {{responseDate}}:",
        "1. That the installation date works for your site.",
        "2. The name and phone number of the local contact who will escort our engineer on the day and guide them to the server room.",
        "3. Who will receive the routers: they will be shipped to site before the installation date, so please confirm who will collect them and keep them safe until our engineer arrives.",
        "4. That the in-house cabling from the carrier's termination point (DMARC) to the server room is complete.",
        "",
        "On the day, our engineer will rack the routers, connect them to the new WAN circuit and test the connectivity with our remote team. Your users stay on the current service until the migration, which we will plan with you separately.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wan-cutover-invite",
      title: "WAN: cutover meeting invite (a week ahead)",
      process: ["wan"],
      phase: "Pre-migration",
      kind: "invite",
      audience: "mixed",
      step: "WAN · Phase 11.4: “OB PM sends a team meeting invite for the activity a week in advance to secure all resources”",
      to: "Customer PM; customer local team and testers; OB engineer; OB TM team",
      cc: "OB PM (if you are not the sender)",
      subject: "{{customer}} - {{site}}: SD-WAN migration - {{migrationDate}}, {{migrationWindow}}",
      body: [
        "Dear all,",
        "",
        "This Teams meeting is for the migration (cutover) of {{site}} to the new SD-WAN service. I am sending it a week in advance to secure everyone's availability.",
        "",
        "Date: {{migrationDate}}",
        "Downtime window: {{migrationWindow}}",
        "",
        "How the session will run:",
        "1. Orange Business opens the Teams meeting at the start of the window.",
        "2. The LAN cables are moved to the new routers, by our engineer or your local engineer as agreed.",
        "3. Our team activates the LAN connection and tests the service remotely.",
        "4. Your local testers run the acceptance tests and confirm that the service is working as expected.",
        "",
        "Before the day, please make sure that:",
        "- your local testers are available for the whole window;",
        "- the change has been approved by your Change Advisory Board (CAB);",
        "- site access is arranged for anyone attending on site.",
        "",
        "Please accept this invitation, or let me know of any conflict as soon as possible.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wan-cab-reminder",
      title: "WAN: CAB approval reminder (customer PM)",
      process: ["wan"],
      phase: "Pre-migration",
      kind: "email",
      audience: "customer",
      step: "WAN · Phase 12.1: “Customer PM submits a CAB request to be approved prior to the cutover date”",
      to: "Customer PM",
      cc: "Orange Business PM",
      subject: "{{customer}} - {{site}}: CAB approval needed before the SD-WAN migration on {{migrationDate}}",
      body: [
        "Dear [Customer PM name],",
        "",
        "A reminder that the migration of {{site}} to the new SD-WAN service is planned for {{migrationDate}}, {{migrationWindow}}.",
        "",
        "The change needs to be approved by your Change Advisory Board (CAB) before the cutover date. Could you please:",
        "1. Confirm that the CAB request has been submitted, and share its reference.",
        "2. Confirm the approval once it is received, ideally by {{responseDate}}.",
        "",
        "If you need anything from us for the submission (for example the migration plan, downtime window, rollback approach or contact list), let me know and I will send it straight away.",
        "",
        "If approval is not in place in time, we will need to agree a new migration date together.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    /* ───────────────────────── POST-MIGRATION ───────────────────────── */
    {
      id: "partial-migration",
      title: "Partial-migration update (multi-day migration)",
      process: ["wlc"],
      phase: "Post-migration",
      kind: "email",
      audience: "customer",
      step: "WLC/Switch · Post-migration 01: “Send the partial-migration email if it runs over multiple days (template provided); on a single day, or the last migration day, send the success notification”",
      to: "Customer technical contact",
      cc: "PM; SC; VPO",
      subject: "{{customer}} - {{site}}: migration progress - [day X of Y] completed",
      body: [
        "Dear {{customerContact}},",
        "",
        "Today's migration session at {{site}} is complete. As planned, the migration runs over several days, so here is where we stand.",
        "",
        "Session date: {{migrationDate}}",
        "",
        "Completed so far:",
        "{{doneSummary}}",
        "",
        "Testing: your team has tested the services connected to the migrated devices and confirmed that they are working. [Amend if any tests are outstanding.]",
        "",
        "Still to do:",
        "{{remainingSummary}}",
        "",
        "Next session: {{nextDate}}, {{migrationWindow}}",
        "",
        "Open points:",
        "- [None / describe each issue, its owner and due date]",
        "",
        "I will send a final confirmation once the last session is complete.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "success-notification",
      title: "Migration success notification",
      process: ["ap", "wlc"],
      phase: "Post-migration",
      kind: "email",
      audience: "customer",
      step: [
        "AP · Post-migration 01: “Send the success notification”",
        "WLC/Switch · Post-migration 01: “… on a single day, or the last migration day, send the success notification”"
      ],
      to: "Customer technical contact",
      cc: "PM; SC; VPO",
      subject: "{{customer}} - {{site}}: migration completed successfully",
      body: [
        "Dear {{customerContact}},",
        "",
        "I am pleased to confirm that the migration at {{site}} was completed successfully on {{migrationDate}}.",
        "",
        "Scope: {{scope}}",
        "Order reference: {{orderRef}}",
        "",
        "All migrated devices are online, and your team has tested and confirmed that the connected services are working as expected.",
        "",
        "Next steps on our side:",
        "- We will update our inventory and network-management records with the new equipment.",
        "- We will then hand the site over to our operations (support) team, who will look after it from now on.",
        "",
        "If you notice anything unusual over the coming days, please reply to this email or contact me directly.",
        "",
        "Thank you to you and your team for your support throughout the project.",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "cmdb-update",
      title: "CMDB update request",
      process: ["ap", "wlc"],
      phase: "Post-migration",
      kind: "email",
      audience: "internal",
      step: "AP & WLC/Switch · Post-migration 02: “Send the CMDB update”",
      to: "CMDB team",
      cc: "",
      subject: "CMDB update: {{customer}} - {{site}} - GOLD {{orderRef}} / {{changeRef}}",
      body: [
        "Hello CMDB team,",
        "",
        "Please update the CMDB for the site below following a completed migration.",
        "",
        "Customer: {{customer}}",
        "Site: {{site}}",
        "Order ref (GOLD): {{orderRef}}",
        "Change ref (ServiceNow): {{changeRef}}",
        "Migration date: {{migrationDate}}",
        "Scope: {{scope}}",
        "",
        "Changes:",
        "- Added: [new devices - hostname, model, serial number]",
        "- Removed / decommissioned: [old devices - hostname, serial number]",
        "",
        "The full device list is attached. Please confirm once the records are updated.",
        "",
        "Many thanks,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "dnac-update",
      title: "DNAC update request",
      process: ["ap", "wlc"],
      phase: "Post-migration",
      kind: "email",
      audience: "internal",
      step: "AP & WLC/Switch · Post-migration 03: “Send the DNAC update” — so the new devices are managed and monitored.",
      to: "VPO",
      cc: "SC",
      subject: "DNAC update: {{customer}} - {{site}} - MACHX {{machxRef}}",
      body: [
        "Hello,",
        "",
        "The migration at {{customer}} - {{site}} was completed on {{migrationDate}}. Please update DNAC (Catalyst Center) so that the new devices are managed and monitored.",
        "",
        "Order ref (GOLD): {{orderRef}}",
        "MACHX ref: {{machxRef}}",
        "Change ref (ServiceNow): {{changeRef}}",
        "Scope: {{scope}}",
        "",
        "[Add any specifics, e.g. devices to remove.]",
        "",
        "Please confirm once this is done, and let me know if you need anything from my side.",
        "",
        "Many thanks,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "hoto-handover",
      title: "HOTO document to the HOTO Manager",
      process: ["ap", "wlc"],
      phase: "Post-migration",
      kind: "email",
      audience: "internal",
      step: [
        "AP & WLC/Switch · Post-migration 06: “Upload the HOTO document and runbook (including LLD) to SharePoint”",
        "AP & WLC/Switch · Post-migration 07: “Send the HOTO document to the HOTO Manager”"
      ],
      to: "HOTO Manager",
      cc: "PM",
      subject: "HOTO: {{customer}} - {{site}} - GOLD {{orderRef}}",
      body: [
        "Hello,",
        "",
        "Please find the Hand-Over-To-Operations (HOTO) document for the delivery below, for your review and sign-off.",
        "",
        "Customer: {{customer}}",
        "Site: {{site}}",
        "Order ref (GOLD): {{orderRef}}",
        "Change ref (ServiceNow): {{changeRef}}",
        "Migration date: {{migrationDate}}",
        "Scope: {{scope}}",
        "",
        "The HOTO document, runbook and LLD are uploaded to SharePoint: [link to the project folder]",
        "",
        "Close-out status:",
        "- Migration completed and UAT confirmed by the customer: [yes / date]",
        "- CMDB update: [requested / done]",
        "- DNAC update: [requested / done]",
        "- GOLD and SALTO orders: [closed / pending]",
        "",
        "Please let me know if anything is missing.",
        "",
        "Many thanks,",
        "{{yourName}}",
        "{{signature}}"
      ]
    },

    {
      id: "wan-hyper-care-exit",
      title: "WAN: hyper-care exit & hand-over approval",
      process: ["wan"],
      phase: "Post-migration",
      kind: "email",
      audience: "customer",
      step: [
        "WAN · Phase 14.1: “OB project team hands the new site over to operations after 7 calendar days from the migration date”",
        "WAN · Phase 14.2: “Customer local & project team approve the site to exit hyper care and hand over to operations”"
      ],
      to: "Customer PM; customer local team",
      cc: "Orange Business PM",
      subject: "{{customer}} - {{site}}: end of hyper-care - approval to hand over to operations",
      body: [
        "Dear {{customerContact}},",
        "",
        "It has now been seven calendar days since the migration of {{site}} to the new SD-WAN service on {{migrationDate}}. During this hyper-care period, the project team has monitored the site closely.",
        "",
        "Status: [no open issues / list any open issues and their status]",
        "",
        "We would now like to close hyper-care and hand the site over to our operations (support) team, who will support it from now on. Could you please confirm by {{responseDate}} that you approve the hand-over?",
        "",
        "After the hand-over, please report any incidents through your usual Orange Business support channel: [support contact details]",
        "",
        "Kind regards,",
        "{{yourName}}",
        "{{signature}}"
      ]
    }

  ]
};
