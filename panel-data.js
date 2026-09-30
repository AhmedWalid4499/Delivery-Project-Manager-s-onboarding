/* ═══════════════════════════════════════════════════════════════════════
   KB_PANELS — front / rear panel inventories for the vendor device pages
   Rendered by panels.js into every  <div class="port-diagram-wrap" data-panel="<id>">
   ───────────────────────────────────────────────────────────────────────
   HOW TO ADD OR EDIT A DEVICE
   1. Copy one of the blocks below, give it a new unique id (vendor-model,
      lowercase, hyphens) and put <div class="port-diagram-wrap"
      data-panel="that-id"></div> in the page where the panel should appear.
   2. Fill the fields ONLY from the vendor's official data sheet or hardware
      installation guide and cite it in "source" (public vendor URL). Never
      guess a count: if the document cannot be found keep confidence "low"
      and say so in "note".
   3. Faces are drawn in array order, blocks left → right in array order
      (datasheet order). Anything not on a face (external adapter, Kensington
      slot…) goes in a "blank" block so the reader sees it is accounted for.

   FIELDS
     model, vendor ("cisco" | "paloalto" | "fortinet"),
     form   ("1RU" | "2RU" | "desktop" | "AP" | "chassis"),
     source {label, url}, confidence ("high" | "medium" | "low"),
     note   — caveat shown under the panel (variants, inferred layout…),
     faces  [{name, blocks:[block…]}]
   block:
     kind   rj45 | sfp | sfp28 | qsfp | qsfp-dd | mgmt | console | usb |
            psu | fan | module | led | antenna | blank
     label  full description (shown as the block caption / tooltip)
     count, rows (1 | 2 | 3), numbering ("odd-top" | "sequential" | "none"),
     startAt, groupOf, speed ("1G" | "mGig" | "10G" | "25G" | "40G" | "100G" | ""),
     poe (true/false), prefix (interface prefix: "Gi1/0/" → Gi1/0/17),
     tags   ["uplink" | "ha" | "wan" | "fortilink" | "stack" | "shared" | …]
     optional: short  — short caption for narrow blocks (default: label cut
                        at the first " — " / " (" / ":")
               labels — text printed IN each port when there is no numbering
                        (e.g. ["DMZ","MGMT"]);  names — matching tooltip names

   NUMBERING RULES (how real switches are silk-screened)
     rows:2 + numbering:"odd-top"   → odd numbers on the top row, even below,
                                      in groups of groupOf (1–12, 13–24 …)
     rows:2 + numbering:"sequential"→ first half of each group on top, rest
                                      below (2×2 uplink blocks, stacked pairs)
     rows:1 + numbering:"sequential"→ one row, startAt, startAt+1 …
     numbering:"none"               → use labels[] (or the kind's short name)
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  root.KB_PANELS = {

    /* ═══════════════════════ CISCO ═══════════════════════ */

    /* Catalyst 9200L-48P-4X — HIG "Product Overview" */
    "cisco-c9200l-48p": {
      model: "Catalyst 9200L-48P-4X (C9200L-48P-4X)", vendor: "cisco", form: "1RU",
      source: { label: "Cisco Catalyst 9200 Series Switches Hardware Installation Guide — Product Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/hardware/install/b-c9200-hig/product_overview.html" },
      confidence: "high",
      note: "Drawn as the -4X variant (4× 1/10G SFP+ fixed uplinks); the -4G variant has 4× 1G SFP instead. PoE budget is 740 W with one PWR-C5-1KWAC (1440 W with two). Stacking is StackWise-80 via the optional C9200L-STACK-KIT. The RJ45 console and the mgmt port are on the rear, not the front; the 2×2 uplink arrangement follows Cisco convention.",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "48× 10/100/1000 PoE+ (Gi1/0/1–48)", count: 48, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 12, speed: "1G", poe: true, prefix: "Gi1/0/" },
          { kind: "sfp", label: "4× 1/10G SFP+ fixed uplinks (Te1/1/1–4)", short: "Uplinks Te1/1/1–4", count: 4, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 4, speed: "10G", poe: false, prefix: "Te1/1/", tags: ["uplink"] },
          { kind: "usb", label: "USB 2.0 Type-A (storage)", short: "USB-A", count: 1 },
          { kind: "console", label: "Mini-USB Type-B console", short: "Console mini-USB", count: 1 },
          { kind: "led", label: "Mode button + Blue Beacon (UID)", short: "Mode / UID", count: 2, labels: ["MODE", "UID"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "mgmt", label: "10/100/1000 mgmt Ethernet (RJ45, OOB)", short: "MGMT", count: 1 },
          { kind: "module", label: "StackWise-80 ports (optional C9200L-STACK-KIT)", short: "StackWise-80", count: 2, tags: ["stack"] },
          { kind: "psu", label: "2× PSU slots (PWR-C5-1KWAC default, 2nd optional for 1+1)", short: "PSU 1+1", count: 2 },
          { kind: "fan", label: "2× fixed internal fans (not FRU)", short: "Fans (fixed)", count: 2 }
        ] }
      ]
    },

    /* Catalyst 9300-48P — HIG "Product Overview" */
    "cisco-c9300-48p": {
      model: "Catalyst 9300-48P (C9300-48P)", vendor: "cisco", form: "1RU",
      source: { label: "Cisco Catalyst 9300 Series Switches Hardware Installation Guide — Product Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig/Product-overview.html" },
      confidence: "high",
      note: "Uplinks come from a single front network-module slot (no fixed uplinks). StackWise-480, StackPower, the RJ45 console, mgmt Ethernet and the USB 3.0 SSD port are on the rear. Default PSU is 715 W AC (PoE budget 445 W); the 1100 W PSU option gives 890 W (single) / 1480 W (dual).",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "48× 10/100/1000 PoE+ (Gi1/0/1–48)", count: 48, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 12, speed: "1G", poe: true, prefix: "Gi1/0/" },
          { kind: "module", label: "Network module slot: C9300-NM-4G (4×1G SFP), -8X (8×10G SFP+), -2Q (2×40G QSFP+), -2Y (2×25G SFP28), -4M (4× mGig)", short: "NM slot (uplinks)", count: 1, tags: ["uplink"] },
          { kind: "usb", label: "USB 2.0 Type-A (storage)", short: "USB-A", count: 1 },
          { kind: "console", label: "Mini-USB Type-B console", short: "Console mini-USB", count: 1 },
          { kind: "led", label: "Mode button + Blue Beacon (UID)", short: "Mode / UID", count: 2, labels: ["MODE", "UID"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "module", label: "StackWise-480 stack ports", short: "StackWise-480", count: 2, tags: ["stack"] },
          { kind: "module", label: "StackPower connectors", short: "StackPower", count: 2, tags: ["stackpower"] },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "mgmt", label: "10/100/1000 mgmt Ethernet (RJ45, OOB)", short: "MGMT", count: 1 },
          { kind: "usb", label: "USB 3.0 (external SSD-120G)", short: "USB 3.0 (SSD)", count: 1 },
          { kind: "fan", label: "3× hot-swap fan modules", short: "Fans (hot-swap)", count: 3 },
          { kind: "psu", label: "2× PSU slots (1+1; 715 W AC default, 350/1100 W options)", short: "PSU 1+1", count: 2 }
        ] }
      ]
    },

    /* Catalyst 9500-32C — HIG "Product Overview" (two-row layout from the HIG figure / Cisco convention) */
    "cisco-c9500-32c": {
      model: "Catalyst 9500-32C (C9500-32C)", vendor: "cisco", form: "1RU",
      source: { label: "Cisco Catalyst 9500 Series Switches Hardware Installation Guide — Product Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9500/hardware/install/b_catalyst_9500_hig/9500_product-overview.html" },
      confidence: "medium",
      note: "32× 40/100G QSFP28 (ports 1–32), each breakable to 4×25G / 4×10G, with mgmt, console and USB on the front. The two-row odd-top arrangement follows Cisco convention (the HIG shows it only in a figure). StackWise Virtual uses ordinary front ports, not dedicated SVL ports; the SATA SSD slot is on the rear.",
      faces: [
        { name: "Front", blocks: [
          { kind: "qsfp", label: "32× 40/100G QSFP28 (Hu1/0/1–32)", count: 32, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 8, speed: "100G", poe: false, prefix: "Hu1/0/" },
          { kind: "mgmt", label: "10/100/1000 mgmt Ethernet (RJ45, OOB)", short: "MGMT", count: 1 },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "console", label: "Mini-USB Type-B console", short: "Console mini-USB", count: 1 },
          { kind: "usb", label: "USB 3.0 Type-A host", short: "USB-A", count: 1 },
          { kind: "led", label: "Mode/reset button + Blue Beacon (UID)", short: "Mode / UID", count: 2, labels: ["MODE", "UID"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× hot-swap PSU slots (1+1, 1600 W AC or DC)", short: "PSU 1+1", count: 2 },
          { kind: "fan", label: "5× fan modules (Fan 0–4)", short: "Fans 0–4", count: 5 },
          { kind: "module", label: "SATA SSD module slot", short: "SATA SSD", count: 1, tags: ["storage"] }
        ] }
      ]
    },

    /* Catalyst 9800-40 WLC — HIG "Overview" */
    "cisco-c9800-40": {
      model: "Catalyst 9800-40 Wireless Controller (C9800-40-K9)", vendor: "cisco", form: "1RU",
      source: { label: "Cisco Catalyst 9800-40 Wireless Controller Hardware Installation Guide — Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/9800-40/installation-guide/b-wlc-ig-9800-40/overview.html" },
      confidence: "high",
      note: "No RJ45 data ports: the data uplinks are 4× 1/10G SFP+ (Te0/0/0–3). The RJ45 RP (redundancy) and RJ45 SP (service/management, Gi0) ports are separate. PSUs are dual hot-swappable at the rear.",
      faces: [
        { name: "Front", blocks: [
          { kind: "sfp", label: "4× 1/10G SFP+ data ports (Te0/0/0–3)", short: "Te0/0/0–3 data", count: 4, rows: 1, numbering: "sequential", startAt: 0, groupOf: 4, speed: "10G", poe: false, prefix: "Te0/0/" },
          { kind: "rj45", label: "RP — 10/100/1000 redundancy port (RJ45, HA SSO)", short: "RP (HA)", count: 1, speed: "1G", poe: false, labels: ["RP"], tags: ["ha"] },
          { kind: "mgmt", label: "SP — 10/100/1000 service/mgmt port (RJ45, Gi0)", short: "SP (mgmt)", count: 1, labels: ["SP"] },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "console", label: "Mini-USB console", short: "Console mini-USB", count: 1 },
          { kind: "usb", label: "2× USB 3.0 Type-A", short: "USB 3.0 ×2", count: 2 },
          { kind: "led", label: "PWR / SYS / ALM / HA / EN / SSD LEDs", short: "Status LEDs", count: 6, labels: ["PWR", "SYS", "ALM", "HA", "EN", "SSD"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× hot-swap PSU bays (1+1, 750 W AC)", short: "PSU 1+1", count: 2 },
          { kind: "fan", label: "6× internal fans (0–5)", short: "Fans 0–5", count: 6 }
        ] }
      ]
    },

    /* Catalyst 9800-L (copper) — HIG "Overview" */
    "cisco-c9800-l": {
      model: "Catalyst 9800-L Copper (C9800-L-C-K9)", vendor: "cisco", form: "1RU",
      source: { label: "Cisco Catalyst 9800-L Wireless Controller Hardware Installation Guide — Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/9800-L/installation-guide/b-wlc-ig-9800-L/overview.html" },
      confidence: "high",
      note: "Drawn as the copper C9800-L-C-K9: 4× mGig RJ45 (1/2.5G, Gi0/0/0–3) + 2× 10G mGig RJ45 (Te0/0/4–5). The fibre C9800-L-F-K9 has 4× 1G SFP + 2× 10G SFP+ instead. Powered by an external 110 W 12 VDC adapter (no internal redundant PSU).",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "4× 1G/2.5G mGig RJ45 data ports (Gi0/0/0–3)", short: "Gi0/0/0–3 mGig", count: 4, rows: 1, numbering: "sequential", startAt: 0, groupOf: 4, speed: "mGig", poe: false, prefix: "Gi0/0/" },
          { kind: "rj45", label: "2× 1/2.5/5/10G mGig RJ45 data ports (Te0/0/4–5)", short: "Te0/0/4–5 10G", count: 2, rows: 1, numbering: "sequential", startAt: 4, groupOf: 2, speed: "10G", poe: false, prefix: "Te0/0/", tags: ["uplink"] },
          { kind: "rj45", label: "RP — redundancy port (RJ45, HA SSO)", short: "RP (HA)", count: 1, speed: "1G", poe: false, labels: ["RP"], tags: ["ha"] },
          { kind: "mgmt", label: "SP — service/mgmt port (RJ45, Gi0, OOB)", short: "SP (mgmt)", count: 1, labels: ["SP"] },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "console", label: "Micro-USB console", short: "Console micro-USB", count: 1 },
          { kind: "usb", label: "USB 3.0 Type-A", short: "USB 3.0", count: 1 },
          { kind: "led", label: "SYS / ALM / HA / SP / RP LEDs + reset", short: "Status LEDs", count: 5, labels: ["SYS", "ALM", "HA", "SP", "RP"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "12 VDC inlet for external 110 W adapter (C9800-AC-110W), single", short: "12 VDC in", count: 1 },
          { kind: "blank", label: "Kensington security slot", count: 1 }
        ] }
      ]
    },

    /* Catalyst Wireless CW9162I — data sheet */
    "cisco-cw9162i": {
      model: "Catalyst Wireless CW9162I (Wi-Fi 6E, 2×2 tri-band)", vendor: "cisco", form: "AP",
      source: { label: "Cisco Catalyst 9162 Series Access Points Data Sheet",
                url: "https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-9100ax-access-points/cat-9162-series-access-points-ds.html" },
      confidence: "high",
      note: "Wi-Fi 6E (2.4/5/6 GHz, 2×2 each) with a 2.5G mGig uplink. 802.3at PoE+ (25.5 W) for full operation, reduced radios on 802.3af; optional 12 V DC adapter. Internal antennas; the connectors are on the mounting face.",
      faces: [
        { name: "Underside", blocks: [
          { kind: "rj45", label: "1× 100M/1G/2.5G mGig Ethernet, PoE-in (802.3at; 802.3af reduced)", short: "mGig PoE-in", count: 1, speed: "mGig", poe: true, labels: ["2.5G"], tags: ["uplink", "poe-in"] },
          { kind: "console", label: "RJ45 management console", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "USB 2.0 (4.5 W)", short: "USB 2.0", count: 1 },
          { kind: "psu", label: "12 VDC input (optional MA-PWR-30W adapter)", short: "12 VDC in", count: 1 },
          { kind: "antenna", label: "Internal omnidirectional antennas (2.4/5/6 GHz, 2×2)", short: "Internal antennas", count: 1 },
          { kind: "led", label: "Status LED + Mode button", short: "Status / Mode", count: 2, labels: ["STAT", "MODE"] }
        ] }
      ]
    },

    /* Catalyst Wireless CW9166I — data sheet */
    "cisco-cw9166i": {
      model: "Catalyst Wireless CW9166I (Wi-Fi 6E, 4×4 tri-band)", vendor: "cisco", form: "AP",
      source: { label: "Cisco Catalyst 9166 Series Access Points Data Sheet",
                url: "https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-9166-series-access-points/catalyst-9166-series-access-points-ds.html" },
      confidence: "high",
      note: "Uplink is 5G mGig (100M/1G/2.5G/5G) and the USB port is USB 2.0 Type-A (4.5 W). 802.3bt for full features (30.5 W); on 802.3at all radios run but USB is disabled; optional 54 V DC adapter. Internal antennas plus a BLE/IoT radio.",
      faces: [
        { name: "Underside", blocks: [
          { kind: "rj45", label: "1× 100M/1G/2.5G/5G mGig Ethernet, PoE-in (802.3bt; 802.3at with USB off)", short: "mGig PoE-in", count: 1, speed: "mGig", poe: true, labels: ["5G"], tags: ["uplink", "poe-in"] },
          { kind: "console", label: "RJ45 management console", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "USB 2.0 Type-A (4.5 W; disabled on 802.3at)", short: "USB 2.0", count: 1 },
          { kind: "psu", label: "54 VDC input (optional MA-PWR-50WAC adapter)", short: "54 VDC in", count: 1 },
          { kind: "antenna", label: "Internal omnidirectional antennas (2.4/5/6 GHz, 4×4) + BLE/IoT", short: "Internal antennas", count: 1 },
          { kind: "led", label: "Status LED + Mode button", short: "Status / Mode", count: 2, labels: ["STAT", "MODE"] }
        ] }
      ]
    },

    /* Catalyst 8300 C8300-1N1S-6T — HIG "Overview" */
    "cisco-c8300-1n1s-6t": {
      model: "Catalyst 8300 Edge Platform C8300-1N1S-6T", vendor: "cisco", form: "1RU",
      source: { label: "Hardware Installation Guide for Cisco Catalyst 8300 Series Edge Platforms — Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/routers/cloud_edge/c8300/hardware_installation/b-catalyst-8300-series-edge-platforms-hig/m-overview.html" },
      confidence: "high",
      note: "6T = 6× 1GE onboard: 4× RJ45 (Gi0/0/0–3) + 2× SFP (Gi0/0/4–5); no 10G on this SKU (the 4T2X adds 2× SFP+). One NIM slot and one SM slot on the I/O (front) side; the cellular PIM slot, dual hot-swap PSUs and the 3-fan tray are on the rear.",
      faces: [
        { name: "Front (I/O side)", blocks: [
          { kind: "rj45", label: "4× 1GE RJ45 (Gi0/0/0–3)", short: "Gi0/0/0–3", count: 4, rows: 2, numbering: "sequential", startAt: 0, groupOf: 4, speed: "1G", poe: false, prefix: "Gi0/0/" },
          { kind: "sfp", label: "2× 1GE SFP (Gi0/0/4–5)", short: "Gi0/0/4–5 SFP", count: 2, rows: 1, numbering: "sequential", startAt: 4, groupOf: 2, speed: "1G", poe: false, prefix: "Gi0/0/" },
          { kind: "module", label: "NIM slot (1): NIM-1GE-CU-SFP, NIM-2T/4T serial, NIM-xMFT-T1/E1, NIM-VAB-A DSL, NIM-ES2-4/8 switch, etc.", short: "NIM slot 1", count: 1, tags: ["nim"] },
          { kind: "module", label: "SM slot (1): SM-X service modules (e.g. SM-X-16G4M2X switch, UCS-E)", short: "SM slot 1", count: 1, tags: ["sm"] },
          { kind: "mgmt", label: "Gi0 mgmt Ethernet (RJ45, OOB)", short: "Gi0 MGMT", count: 1 },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "console", label: "Micro-USB console", short: "Console micro-USB", count: 1 },
          { kind: "usb", label: "USB 3.0 Type-A (USB 0) + USB 3.0 Type-C (USB 1)", short: "USB-A + USB-C", count: 2, labels: ["A", "C"] },
          { kind: "module", label: "M.2 storage slot (16 GB default)", short: "M.2 storage", count: 1, tags: ["storage"] }
        ] },
        { name: "Rear (PSU/fan side)", blocks: [
          { kind: "psu", label: "2× hot-swap AC/DC PSU (PSU0, PSU1; 1+1, ships dual)", short: "PSU0 / PSU1", count: 2, labels: ["PSU0", "PSU1"] },
          { kind: "fan", label: "Internal 3-fan tray", short: "3-fan tray", count: 3 },
          { kind: "module", label: "PIM slot 1 (P-LTE / P-5G cellular module)", short: "PIM slot 1 (cellular)", count: 1, tags: ["pim"] }
        ] }
      ]
    },

    /* Catalyst 8500 C8500-12X4QC — HIG "Overview" (bay two-row arrangement inferred) */
    "cisco-c8500-12x4qc": {
      model: "Catalyst 8500 Edge Platform C8500-12X4QC", vendor: "cisco", form: "1RU",
      source: { label: "Cisco Catalyst 8500 Series Edge Platforms Hardware Installation Guide — Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/routers/cloud_edge/c8500/hardware-installation-guide/b_C8500_HIG/m_Router_Overview.html" },
      confidence: "medium",
      note: "Onboard: 12× 1/10G SFP+ (Bay 0: 8, Bay 1: 4) + 4× QSFP cages (1 in Bay 1, configurable 40/100G; 3 in Bay 2 usable as 3× 40G or 1× 100G). There are no 1G RJ45 data ports. Counts are from the HIG; the two-row arrangement of the SFP+ bays is inferred. Rear: 2 PSU slots (750 W AC / 950 W DC) and one field-replaceable tray with 6 fans.",
      faces: [
        { name: "Front", blocks: [
          { kind: "sfp", label: "Bay 0: 8× 1/10G SFP+ (Te0/0/0–7)", short: "Bay 0 · Te0/0/0–7", count: 8, rows: 2, numbering: "sequential", startAt: 0, groupOf: 8, speed: "10G", poe: false, prefix: "Te0/0/" },
          { kind: "sfp", label: "Bay 1: 4× 1/10G SFP+ (Te0/1/0–3)", short: "Bay 1 · Te0/1/0–3", count: 4, rows: 2, numbering: "sequential", startAt: 0, groupOf: 4, speed: "10G", poe: false, prefix: "Te0/1/" },
          { kind: "qsfp", label: "Bay 1: 1× QSFP 40G/100G (configurable)", short: "Bay 1 QSFP", count: 1, rows: 1, numbering: "sequential", startAt: 4, groupOf: 1, speed: "100G", poe: false, prefix: "QSFP 0/1/" },
          { kind: "qsfp", label: "Bay 2: 3× QSFP — 3× 40G or 1× 100G", short: "Bay 2 QSFP ×3", count: 3, rows: 1, numbering: "sequential", startAt: 0, groupOf: 3, speed: "40G", poe: false, prefix: "QSFP 0/2/" },
          { kind: "mgmt", label: "Gi0 mgmt Ethernet (RJ45, OOB)", short: "Gi0 MGMT", count: 1 },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "console", label: "Micro-USB console", short: "Console micro-USB", count: 1 },
          { kind: "usb", label: "2× USB 3.0 Type-A", short: "USB 3.0 ×2", count: 2 },
          { kind: "led", label: "PWR / STAT / ALM (minor/major/critical) LEDs", short: "Status LEDs", count: 5, labels: ["PWR", "STAT", "MIN", "MAJ", "CRIT"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× PSU slots (1+1; 750 W AC or 950 W DC)", short: "PSU 1+1", count: 2 },
          { kind: "fan", label: "Field-replaceable fan tray (6 fans)", short: "Fan tray (6)", count: 6 }
        ] }
      ]
    },

    /* ISR 1100 — C1111-4P — HIG "Overview" */
    "cisco-isr1111-4p": {
      model: "ISR 1100 — C1111-4P", vendor: "cisco", form: "desktop",
      source: { label: "Hardware Installation Guide for the Cisco 1000 Series ISR — Overview (C1100)",
                url: "https://www.cisco.com/c/en/us/td/docs/routers/access/1100/hardware/installation/guide/b-cisco-1100-series-hig/c1100_overview.pdf" },
      confidence: "high",
      note: "The ISR 1100 is a family; this panel is the C1111-4P (2× WAN + 4× LAN). WAN Gi0/0/0 is a combo port (RJ45 or SFP), Gi0/0/1 is RJ45-only; the LAN is a 4-port GE switch (Gi0/1/0–3). There is no dedicated mgmt Ethernet port. All connectors are on the back / I/O side; the front only has LEDs. External 12 VDC adapter.",
      faces: [
        { name: "Rear (I/O side)", blocks: [
          { kind: "rj45", label: "WAN Gi0/0/0 — combo: RJ45 or SFP (1G)", short: "WAN Gi0/0/0 (combo)", count: 1, rows: 1, numbering: "sequential", startAt: 0, speed: "1G", poe: false, prefix: "Gi0/0/", tags: ["wan", "combo"] },
          { kind: "sfp", label: "WAN Gi0/0/0 SFP cage (shares the interface with the RJ45)", short: "Gi0/0/0 SFP", count: 1, rows: 1, numbering: "sequential", startAt: 0, speed: "1G", poe: false, prefix: "Gi0/0/", tags: ["wan", "combo"] },
          { kind: "rj45", label: "WAN Gi0/0/1 — RJ45 (1G)", short: "WAN Gi0/0/1", count: 1, rows: 1, numbering: "sequential", startAt: 1, speed: "1G", poe: false, prefix: "Gi0/0/", tags: ["wan"] },
          { kind: "rj45", label: "4× GE LAN switch ports (Gi0/1/0–3)", short: "LAN Gi0/1/0–3", count: 4, rows: 1, numbering: "sequential", startAt: 0, groupOf: 4, speed: "1G", poe: false, prefix: "Gi0/1/" },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "console", label: "Micro-USB console", short: "Console micro-USB", count: 1 },
          { kind: "usb", label: "USB 3.0 Type-A", short: "USB 3.0", count: 1 },
          { kind: "psu", label: "4-pin 12 VDC inlet (external adapter) + power switch", short: "12 VDC in", count: 1 },
          { kind: "blank", label: "Reset button, Kensington slot, ground", count: 1 }
        ] },
        { name: "Front", blocks: [
          { kind: "led", label: "Status / VPN / switch-port LEDs only — no connectors", short: "Status LEDs only", count: 3, labels: ["SYS", "VPN", "SW"] }
        ] }
      ]
    },

    /* Secure Firewall 1220CX — HIG "Overview" */
    "cisco-fpr1220cx": {
      model: "Cisco Secure Firewall 1220CX", vendor: "cisco", form: "desktop",
      source: { label: "Cisco Secure Firewall 1210CE, 1210CP, and 1220CX Hardware Installation Guide — Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/security/secure-firewall/hardware/1210-20/hw-install-1210-20/m_overview.html" },
      confidence: "high",
      note: "The 1220CX has 8× 1G RJ45 (Ethernet 1/1–1/8) + 2× 1/10G SFP+ (Ethernet 1/9–1/10). PoE is not supported on the 1220CX — only the 1210CP powers ports 1/5–1/8. All ports are on the rear; the front has no connectors. External 12 V / 66 W supply; single internal fan.",
      faces: [
        { name: "Rear", blocks: [
          { kind: "rj45", label: "8× 10M/100M/1G RJ45 data (Ethernet 1/1–1/8, no PoE)", count: 8, rows: 1, numbering: "sequential", startAt: 1, groupOf: 8, speed: "1G", poe: false, prefix: "Eth1/" },
          { kind: "sfp", label: "2× 1/10G SFP+ data (Ethernet 1/9–1/10)", short: "Eth1/9–10 SFP+", count: 2, rows: 1, numbering: "sequential", startAt: 9, groupOf: 2, speed: "10G", poe: false, prefix: "Eth1/" },
          { kind: "mgmt", label: "1G mgmt Ethernet (RJ45, Management 1/1)", short: "Mgmt 1/1", count: 1 },
          { kind: "console", label: "RJ45 console (RS-232)", short: "Console RJ45", count: 1 },
          { kind: "console", label: "USB-C console", short: "Console USB-C", count: 1 },
          { kind: "usb", label: "USB 3.0 Type-A", short: "USB 3.0", count: 1 },
          { kind: "psu", label: "Power inlet — external 12 V / 66 W supply, single", short: "12 V in", count: 1 },
          { kind: "blank", label: "Power button + recessed reset", count: 1 }
        ] },
        { name: "Front", blocks: [
          { kind: "blank", label: "No connectors or LEDs on the front panel", count: 1 }
        ] }
      ]
    },

    /* Secure Firewall 3105 — HIG "Overview" */
    "cisco-fpr3105": {
      model: "Cisco Secure Firewall 3105", vendor: "cisco", form: "1RU",
      source: { label: "Cisco Secure Firewall 3100 Series Hardware Installation Guide — Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/security/secure-firewall/hardware/3100/fw-3100-install/m-overview.html" },
      confidence: "high",
      note: "Fixed I/O is 8× 1G RJ45 (Ethernet 1/1–1/8) + 8× 1/10G SFP+ (Ethernet 1/9–1/16) plus one network-module slot. There is no dedicated HA port (HA uses a data interface) and the management port is a 1/10G SFP, not RJ45. Ships with one 400 W PSU; the second is optional.",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "8× 10M/100M/1G RJ45 data (Ethernet 1/1–1/8)", count: 8, rows: 1, numbering: "sequential", startAt: 1, groupOf: 8, speed: "1G", poe: false, prefix: "Eth1/" },
          { kind: "sfp", label: "8× 1/10G SFP+ data (Ethernet 1/9–1/16)", count: 8, rows: 1, numbering: "sequential", startAt: 9, groupOf: 8, speed: "10G", poe: false, prefix: "Eth1/" },
          { kind: "module", label: "Network module slot (NM-2): 8× 1G RJ45, 8× 1/10G SFP+, 4× 25G SFP28, 2× 40G QSFP, 6-port fail-to-wire modules", short: "NetMod slot 2", count: 1, tags: ["netmod"] },
          { kind: "mgmt", label: "Management 1/1 — 1/10G SFP", short: "Mgmt 1/1 (SFP)", count: 1, labels: ["SFP"] },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "USB 3.1 Type-A (900 mA)", short: "USB 3.1", count: 1 },
          { kind: "module", label: "2× NVMe SSD slots (SSD-1 populated, 900 GB)", short: "SSD", count: 2, tags: ["storage"] },
          { kind: "led", label: "Power / System / Alarm / Managed / Activity LEDs + recessed reset", short: "Status LEDs", count: 5, labels: ["PWR", "SYS", "ALM", "MGD", "ACT"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× hot-swap PSU slots (PSU-1 ships, PSU-2 optional; 400 W AC or DC)", short: "PSU-1 / PSU-2", count: 2 },
          { kind: "fan", label: "2× hot-swap dual-fan modules (3+1 redundancy)", short: "Fan modules ×2", count: 2 },
          { kind: "blank", label: "Power switch + grounding pad", count: 1 }
        ] }
      ]
    },

    /* ASA 5506-X — HIG "Overview" */
    "cisco-asa5506x": {
      model: "ASA 5506-X with FirePOWER Services", vendor: "cisco", form: "desktop",
      source: { label: "Cisco ASA 5506-X, ASA 5506W-X, and ASA 5506H-X Hardware Installation Guide — Overview",
                url: "https://www.cisco.com/c/en/us/td/docs/security/asa/hw/maintenance/5506xguide/b_Install_Guide_5506/b_Install_Guide_5506_chapter_01.html" },
      confidence: "high",
      note: "All connectors are on the rear (the front has no connectors or LEDs). The eight GE ports sit in a single row numbered 1–8 left to right, with Management 1/1 and the consoles to their right. Powered by an external adapter. The 5506W-X adds internal Wi-Fi; the 5506H-X has only 4 GE ports in two rows.",
      faces: [
        { name: "Rear", blocks: [
          { kind: "rj45", label: "8× 10/100/1000 RJ45 data (GigabitEthernet 1/1–1/8)", count: 8, rows: 1, numbering: "sequential", startAt: 1, groupOf: 8, speed: "1G", poe: false, prefix: "Gi1/" },
          { kind: "mgmt", label: "Management 1/1 — 1G RJ45 (mgmt only)", short: "Mgmt 1/1", count: 1 },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "console", label: "Mini-USB Type-B console", short: "Console mini-USB", count: 1 },
          { kind: "usb", label: "USB Type-A (external storage)", short: "USB-A", count: 1 },
          { kind: "psu", label: "DC inlet for external power adapter, single", short: "DC in", count: 1 },
          { kind: "blank", label: "Recessed reset button + Kensington slot", count: 1 }
        ] },
        { name: "Front", blocks: [
          { kind: "blank", label: "No connectors — Power / Status / Active / WLAN LEDs are on the top-left edge", count: 1 }
        ] }
      ]
    },

    /* Nexus 93180YC-FX — data sheet (row arrangement per Nexus convention) */
    "cisco-n93180yc-fx": {
      model: "Nexus 93180YC-FX (N9K-C93180YC-FX)", vendor: "cisco", form: "1RU",
      source: { label: "Cisco Nexus 9300-FX Series Switches Data Sheet",
                url: "https://www.cisco.com/c/en/us/products/collateral/switches/nexus-9000-series-switches/datasheet-c78-742284.html" },
      confidence: "medium",
      note: "Data sheet: 48× 1/10/25G SFP28 (Eth1/1–48) + 6× 40/100G QSFP28 (Eth1/49–54); RJ45 mgmt0, RJ45 console and USB are on the PSU/fan side, with up to 2 PSUs and 4 hot-swap fans. The odd-top two-row arrangement and the 2×3 uplink block follow Nexus convention (not stated in the data-sheet text).",
      faces: [
        { name: "Front (port side)", blocks: [
          { kind: "sfp28", label: "48× 1/10/25G SFP28 (Eth1/1–48)", count: 48, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 12, speed: "25G", poe: false, prefix: "Eth1/" },
          { kind: "qsfp", label: "6× 40/100G QSFP28 uplinks (Eth1/49–54)", short: "Uplinks Eth1/49–54", count: 6, rows: 2, numbering: "odd-top", startAt: 49, groupOf: 6, speed: "100G", poe: false, prefix: "Eth1/", tags: ["uplink"] }
        ] },
        { name: "Rear (PSU/fan side)", blocks: [
          { kind: "mgmt", label: "mgmt0 — 10/100/1000 RJ45", short: "mgmt0", count: 1 },
          { kind: "console", label: "RJ45 console", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "USB Type-A", short: "USB-A", count: 1 },
          { kind: "psu", label: "2× hot-swap PSU slots (1+1; 500 W AC, 930 W DC or 1200 W HVAC/HVDC)", short: "PSU 1+1", count: 2 },
          { kind: "fan", label: "4× hot-swap fan modules (port-side intake or exhaust)", short: "Fan modules ×4", count: 4 }
        ] }
      ]
    },

    /* Aironet 1542I — data sheet */
    "cisco-air-ap1542i": {
      model: "Aironet 1542I Outdoor Access Point (AIR-AP1542I)", vendor: "cisco", form: "AP",
      source: { label: "Cisco Aironet 1540 Series Outdoor Access Points Data Sheet",
                url: "https://www.cisco.com/c/en/us/products/collateral/wireless/aironet-1540-series/datasheet-c78-738585.html" },
      confidence: "high",
      note: "The 1542I has ONE Ethernet port (10/100/1000 PoE-in, 802.3af/at, 13.9 W max) plus an RJ45 console under a sealed cap — no second GE port, no PoE-out, no DC input and no USB. Internal semi-omnidirectional antennas; IP67.",
      faces: [
        { name: "Base connectors", blocks: [
          { kind: "rj45", label: "1× 10/100/1000 PoE-in / data (RJ45, weather-sealed; 802.3af/at)", short: "GE PoE-in", count: 1, speed: "1G", poe: true, labels: ["PoE"], tags: ["uplink", "poe-in"] },
          { kind: "console", label: "RJ45 management console (under sealed cap)", short: "Console (capped)", count: 1 },
          { kind: "antenna", label: "Internal dual-band semi-omni antennas (5 dBi)", short: "Internal antennas", count: 1 },
          { kind: "led", label: "Status LED in the centre of the reset button", short: "Status / reset", count: 1, labels: ["STAT"] }
        ] }
      ]
    },

    /* ═══════════════════════ PALO ALTO NETWORKS ═══════════════════════ */

    /* PA-220 — hardware reference (front + back panel pages) */
    "paloalto-pa-220": {
      model: "PA-220", vendor: "paloalto", form: "desktop",
      source: { label: "Palo Alto Networks PA-220 Hardware Reference — Front Panel / Back Panel",
                url: "https://docs.paloaltonetworks.com/hardware/pa-220-hardware-reference/pa-220-firewall-overview/pa-220-front-panel" },
      confidence: "medium",
      note: "Counts are from the PA-220 hardware reference. The 8 RJ45 ports are drawn as the vendor's stacked 2×4 block with odd numbers on top (the reference shows the layout only in a figure). HA1 uses the MGT port and HA2 a data port — there are no dedicated HA ports. Power is via external adapters (one shipped; PWR 2 accepts a second for redundancy). No fans are listed.",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "8× 10/100/1000 RJ45 data ports (Ethernet 1/1–1/8)", count: 8, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 4, speed: "1G", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "mgmt", label: "MGT — 10/100/1000 RJ45 out-of-band management (HA1 in HA pairs)", short: "MGT", count: 1, labels: ["MGT"], speed: "1G", tags: ["oob"] },
          { kind: "console", label: "CONSOLE — RJ45 serial (9600 8N1)", short: "Console RJ45", count: 1 },
          { kind: "console", label: "CONSOLE — Micro-USB serial", short: "Console micro-USB", count: 1, tags: ["micro-usb"] },
          { kind: "usb", label: "USB Type-A (bootstrap bundle)", short: "USB-A", count: 1 },
          { kind: "led", label: "5× status LEDs (PWR, STATUS, TEMP, ALARM, HA)", short: "Status LEDs", count: 5, labels: ["PWR", "STAT", "TEMP", "ALM", "HA"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× external power-adapter inputs (PWR 1 / PWR 2; one adapter shipped, second for redundancy)", short: "PWR 1 / PWR 2 (adapters)", count: 2, labels: ["PWR1", "PWR2"], tags: ["external-adapter"] },
          { kind: "blank", label: "Single-post ground stud", count: 1, tags: ["ground"] }
        ] }
      ]
    },

    /* PA-450 (PA-400 family) — hardware reference */
    "paloalto-pa-450": {
      model: "PA-450", vendor: "paloalto", form: "1RU",
      source: { label: "Palo Alto Networks PA-400 Series Hardware Reference — Front Panel / Back Panel / Physical Specifications",
                url: "https://docs.paloaltonetworks.com/hardware/pa-400-hardware-reference/pa-400-firewall-overview/pa-400-front-panel" },
      confidence: "medium",
      note: "Drawn as the PA-450. The hardware reference states the PA-440/PA-450/PA-460 front panels are identical: 8× RJ45 1G data ports, MGT, RJ45 + Micro-USB console, 2× USB, 6 LEDs — no SFP ports and no dedicated HA ports (HA1 runs over MGT or a data port). 1.75 in high, 8 in wide, rack-mountable with the supplied 1U kit. Row layout is not described in text; drawn as the vendor's stacked 2×4 block (odd on top). Two adapter inputs on the rear (one 50 W adapter shipped). PA-415/PA-445 differ: 2 extra SFP/RJ45 combo ports, PoE on ports 6–9 and only 3 LEDs; the PA-410 has 7 data ports and an RJ45-only console.",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "8× 10/100/1000 RJ45 data ports (Ethernet 1/1–1/8)", count: 8, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 4, speed: "1G", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "mgmt", label: "MGT — 1G RJ45 out-of-band management", short: "MGT", count: 1, labels: ["MGT"], speed: "1G", tags: ["oob"] },
          { kind: "console", label: "CONSOLE — Micro-USB serial", short: "Console micro-USB", count: 1, tags: ["micro-usb"] },
          { kind: "console", label: "CONSOLE — RJ45 serial (9600 8N1)", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "2× USB Type-A (bootstrap / debug)", short: "USB-A ×2", count: 2, rows: 2, numbering: "sequential", startAt: 1 },
          { kind: "led", label: "6× status LEDs", short: "Status LEDs", count: 6 }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× power-adapter inputs (PWR 1 / PWR 2; one 50 W adapter shipped, second for redundancy)", short: "PWR 1 / PWR 2 (adapters)", count: 2, labels: ["PWR1", "PWR2"], tags: ["external-adapter"] },
          { kind: "blank", label: "Single-post ground stud", count: 1, tags: ["ground"] }
        ] }
      ]
    },

    /* PA-3440 (PA-3400 family) — hardware reference */
    "paloalto-pa-3440": {
      model: "PA-3440", vendor: "paloalto", form: "1RU",
      source: { label: "Palo Alto Networks PA-3400 Series Hardware Reference — Front Panel / Back Panel / Physical Specifications",
                url: "https://docs.paloaltonetworks.com/hardware/pa-3400-hardware-reference/pa-3400-series-overview/front-panel-3400-series" },
      confidence: "medium",
      note: "Drawn as the PA-3440. Ports 1–12 RJ45 multi-gig (port 1 = ZTP), 13–22 SFP/SFP+, 23–26 SFP28, 35–36 QSFP+/QSFP28 (PA-3430/PA-3440 only; their breakout ports are 27–34), HSCI SFP+ 10G, HA1-A/HA1-B RJ45, MGT RJ45, RJ45 + Micro-USB console, USB, 9 LEDs and a system-drive cover. The reference does not describe the row layout in text; pluggable cages are drawn as stacked pairs with odd numbers on top (vendor convention). Rear: PS1/PS2 (AC C14 or DC) and the fan assemblies are not field-replaceable; the fan count is not stated.",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "12× multi-gig RJ45 10M/100M/1G/2.5G/5G/10G (Ethernet 1/1–1/12; port 1 = ZTP)", count: 12, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 6, speed: "mGig", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "sfp", label: "10× SFP/SFP+ 1G/10G (Ethernet 1/13–1/22; any can be remapped as HA1)", count: 10, rows: 2, numbering: "odd-top", startAt: 13, groupOf: 10, speed: "10G", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "sfp28", label: "4× SFP28 25G (also 1G/10G) (Ethernet 1/23–1/26; RS-FEC)", short: "SFP28 23–26", count: 4, rows: 2, numbering: "odd-top", startAt: 23, groupOf: 4, speed: "25G", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "qsfp", label: "2× QSFP+/QSFP28 40G/100G (Ethernet 1/35–1/36; breakout to 4×10G/4×25G = ports 27–34) — PA-3430/3440 only", short: "QSFP28 35–36", count: 2, rows: 2, numbering: "odd-top", startAt: 35, groupOf: 2, speed: "100G", poe: false, prefix: "Ethernet 1/", tags: ["data", "3430-3440-only"] },
          { kind: "sfp", label: "HSCI — 1× SFP+ 10G (HA2 data link; HA2/HA3 in active/active)", short: "HSCI (HA2)", count: 1, speed: "10G", poe: false, labels: ["HSCI"], tags: ["ha"] },
          { kind: "rj45", label: "HA1-A / HA1-B — 2× 10/100/1000 RJ45 HA control", short: "HA1-A / HA1-B", count: 2, rows: 2, numbering: "none", speed: "1G", poe: false, labels: ["A", "B"], names: ["HA1-A", "HA1-B"], tags: ["ha"] },
          { kind: "mgmt", label: "MGT — 10/100/1000 RJ45 out-of-band management", short: "MGT", count: 1, labels: ["MGT"], speed: "1G", tags: ["oob"] },
          { kind: "console", label: "CONSOLE — RJ45 serial (9600 8N1)", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "USB Type-A (bootstrap bundle)", short: "USB-A", count: 1 },
          { kind: "console", label: "CONSOLE — Micro-USB serial", short: "Console micro-USB", count: 1, tags: ["micro-usb"] },
          { kind: "led", label: "9× status LEDs", short: "Status LEDs", count: 9 },
          { kind: "module", label: "System drive cover (internal SSD)", short: "System drive", count: 1, tags: ["storage"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× power supplies PS1 / PS2 (AC C14 or DC; redundant; not field-replaceable)", short: "PS1 / PS2", count: 2, labels: ["PS1", "PS2"], tags: ["1+1"] },
          { kind: "fan", label: "Fan assemblies (count not stated by the vendor; not field-replaceable)", short: "Fans (count n/s)", count: 1, tags: ["count-unverified"] },
          { kind: "blank", label: "Single-post ground stud", count: 1, tags: ["ground"] }
        ] }
      ]
    },

    /* PA-5440 (PA-5400 family) — hardware reference */
    "paloalto-pa-5440": {
      model: "PA-5440", vendor: "paloalto", form: "2RU",
      source: { label: "Palo Alto Networks PA-5400 Series Hardware Reference — Front Panel / Back Panel / Port LEDs / Physical Specifications",
                url: "https://docs.paloaltonetworks.com/hardware/pa-5400-hardware-reference/pa-5400-series-firewall-overview/pa-5400-series-front-and-back-panel-descriptions/pa-5400-series-front-panel" },
      confidence: "medium",
      note: "Drawn as the PA-5440; the hardware reference gives one common front panel for PA-5410/5420/5430/5440/5445. Ports 1–8 RJ45 multi-gig (port 1 = ZTP), 9–20 SFP/SFP+, 21–24 SFP28, four physical QSFP28 ports numbered 41–44 (their breakout sub-ports are 25–40), HSCI 40G, HA1-A/HA1-B SFP+, MGT as an SFP+ port (1G copper/fibre or 10G fibre), RJ45 + Micro-USB console, USB, 8 LEDs and a system-drive module. 2U (3.44 in). The PA-5400 (non-5450) has no expansion/NPC slots. Rear: PWR1/PWR2 hot-swappable AC/DC (one required, second for redundancy/load-share), three dual-rotor fans, ESD port and ground stud. Cages are drawn as stacked pairs with odd numbers on top (layout not described in text).",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "8× multi-gig RJ45 10M–10G (Ethernet 1/1–1/8; port 1 = ZTP)", count: 8, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 4, speed: "mGig", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "sfp", label: "12× SFP/SFP+ 1G/10G (Ethernet 1/9–1/20; any can be remapped as HA1)", count: 12, rows: 2, numbering: "odd-top", startAt: 9, groupOf: 6, speed: "10G", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "sfp28", label: "4× SFP28 25G (also 1G/10G) (Ethernet 1/21–1/24; RS-FEC)", short: "SFP28 21–24", count: 4, rows: 2, numbering: "odd-top", startAt: 21, groupOf: 4, speed: "25G", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "qsfp", label: "4× QSFP+/QSFP28 40G/100G (Ethernet 1/41–1/44; breakout 4×10G/4×25G = ports 25–40)", short: "QSFP28 41–44", count: 4, rows: 2, numbering: "odd-top", startAt: 41, groupOf: 4, speed: "100G", poe: false, prefix: "Ethernet 1/", tags: ["data"] },
          { kind: "qsfp", label: "HSCI — 1× 40G QSFP+ (HA2 data link; HA2/HA3 in active/active)", short: "HSCI (HA2)", count: 1, speed: "40G", poe: false, labels: ["HSCI"], tags: ["ha"] },
          { kind: "sfp", label: "HA1-A / HA1-B — 2× SFP+ 1G/10G HA control", short: "HA1-A / HA1-B", count: 2, rows: 2, numbering: "none", speed: "10G", poe: false, labels: ["A", "B"], names: ["HA1-A", "HA1-B"], tags: ["ha"] },
          { kind: "mgmt", label: "MGT — SFP+ 1G/10G out-of-band management (10G fibre only)", short: "MGT (SFP+)", count: 1, labels: ["MGT"], speed: "10G", tags: ["oob", "sfp+"] },
          { kind: "console", label: "CONSOLE — RJ45 serial (9600 8N1)", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "USB Type-A (bootstrap bundle)", short: "USB-A", count: 1 },
          { kind: "console", label: "CONSOLE — Micro-USB serial", short: "Console micro-USB", count: 1, tags: ["micro-usb"] },
          { kind: "led", label: "8× status LEDs", short: "Status LEDs", count: 8 },
          { kind: "module", label: "System drive module (SSDs)", short: "System drive", count: 1, tags: ["storage"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× hot-swappable power supplies PWR1 / PWR2 (AC C14 or DC; 1 required, 2nd = redundancy / load share)", short: "PWR1 / PWR2", count: 2, labels: ["PWR1", "PWR2"], tags: ["1+1", "hot-swap"] },
          { kind: "fan", label: "3× dual-rotor fan modules (individually replaceable)", short: "Fan modules ×3", count: 3, tags: ["hot-swap"] },
          { kind: "blank", label: "ESD port + two-post ground stud", count: 1, tags: ["ground"] }
        ] }
      ]
    },

    /* PA-7050 chassis — PA-7000 hardware reference */
    "paloalto-pa-7050": {
      model: "PA-7050", vendor: "paloalto", form: "chassis",
      source: { label: "Palo Alto Networks PA-7000 Series Hardware Reference — PA-7050 Front Panel (AC), SMC / NPC Component Descriptions, Physical Specifications",
                url: "https://docs.paloaltonetworks.com/hardware/pa-7000-hardware-reference/pa-7000-series-firewall-overview/pa-7050-front-and-back-panel-descriptions/pa-7050-front-panel-ac" },
      confidence: "medium",
      note: "PA-7050 only (the PA-7080 is not drawn). 9U chassis with EIGHT front card slots: slot 4 must hold the Switch Management Card (SMC), slot 8 the log card (LPC = Log Processing Card or LFC = Log Forwarding Card), and slots 1–3 and 5–7 take up to six Network Processing Cards (NPCs) — the interface cards (PA-7000 100G NPC: 4× QSFP+/QSFP28 40/100G + 8× SFP/SFP+ 1/10G; or 20GXM / 20GQXM). The SMC carries MGT, console, USB, HA1-A/HA1-B and HSCI-A/HSCI-B. Four hot-swappable PSUs sit in front bays (switches on the rear); full redundancy needs twice the minimum PSU count for the installed NPCs. Two fan trays and a replaceable air filter. The slot order in the vendor figure is not described in text.",
      faces: [
        { name: "Front", blocks: [
          { kind: "module", label: "Slots 1–3 — NPC bays (PA-7000 100G NPC: 4× 40/100G QSFP28 + 8× 1/10G SFP/SFP+; or 20GXM / 20GQXM NPC)", short: "NPC bays 1–3", count: 3, rows: 3, numbering: "sequential", startAt: 1, groupOf: 3, speed: "100G", poe: false, prefix: "Slot ", tags: ["npc"] },
          { kind: "module", label: "Slot 4 — Switch Management Card (SMC), mandatory", short: "SMC", count: 1, rows: 1, numbering: "sequential", startAt: 4, prefix: "Slot ", labels: ["Slot 4 · SMC"], tags: ["smc"] },
          { kind: "mgmt", label: "SMC: MGT — 10/100/1000 RJ45 management", short: "SMC MGT", count: 1, labels: ["MGT"], speed: "1G", tags: ["smc", "oob"] },
          { kind: "console", label: "SMC: CONSOLE — RJ45 serial", short: "SMC console", count: 1, tags: ["smc"] },
          { kind: "usb", label: "SMC: USB Type-A (bootstrap bundle)", short: "SMC USB", count: 1, tags: ["smc"] },
          { kind: "rj45", label: "SMC: HA1-A / HA1-B — 2× 10/100/1000 RJ45 HA control", short: "HA1-A / HA1-B", count: 2, rows: 1, numbering: "none", speed: "1G", poe: false, labels: ["A", "B"], names: ["HA1-A", "HA1-B"], tags: ["smc", "ha"] },
          { kind: "qsfp", label: "SMC: HSCI-A / HSCI-B — 2× 40G QSFP+ HA data links", short: "HSCI-A / HSCI-B", count: 2, rows: 1, numbering: "none", speed: "40G", poe: false, labels: ["A", "B"], names: ["HSCI-A", "HSCI-B"], tags: ["smc", "ha"] },
          { kind: "led", label: "SMC: 8× status LEDs", short: "SMC LEDs", count: 8, tags: ["smc"] },
          { kind: "module", label: "Slots 5–7 — NPC bays (same options as slots 1–3)", short: "NPC bays 5–7", count: 3, rows: 3, numbering: "sequential", startAt: 5, groupOf: 3, speed: "100G", poe: false, prefix: "Slot ", tags: ["npc"] },
          { kind: "module", label: "Slot 8 — Log card: LPC (Log Processing Card) or LFC (Log Forwarding Card), mandatory", short: "Log card", count: 1, rows: 1, numbering: "sequential", startAt: 8, prefix: "Slot ", labels: ["Slot 8 · LPC/LFC"], tags: ["log"] },
          { kind: "psu", label: "4× front power-supply bays (AC or DC, hot-swappable; ships with 4; redundancy = 2× the minimum for the installed NPCs)", short: "PSU bays ×4", count: 4, rows: 1, numbering: "sequential", startAt: 1, tags: ["hot-swap"] },
          { kind: "fan", label: "2× fan trays (intake + exhaust)", short: "Fan trays ×2", count: 2 },
          { kind: "blank", label: "Replaceable air filter + ESD grounding jack", count: 1, tags: ["ground"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "4× AC power switches / inlets (one per front PSU)", short: "AC inlets ×4", count: 4, rows: 1, numbering: "sequential", startAt: 1, tags: ["power"] },
          { kind: "blank", label: "Ground studs", count: 1, tags: ["ground"] }
        ] }
      ]
    },

    /* Panorama M-500 — vendor hardware reference guide (mirrored PDF; M-500 is EoL) */
    "paloalto-m-500": {
      model: "Panorama M-500", vendor: "paloalto", form: "2RU",
      source: { label: "Palo Alto Networks M-500 Appliance Hardware Reference Guide (vendor PDF, mirrored — the M-500 is end-of-life)",
                url: "https://digitalscepter.com/assets/hardware_references/m-500.pdf" },
      confidence: "medium",
      note: "2U appliance: the front is 24× 2.5-inch drive bays (A1–L2, RAID-1 pairs, up to 24 TB) and ALL network/console ports are on the rear — MGT (RJ45), Eth1–Eth3 (RJ45; Eth1/Eth2 usable for Panorama/log traffic, Eth3 reserved), Eth4/Eth5 (2× 10 GbE SFP+), DB-9 serial console, 4× USB (reserved), covered VGA, UID LED/button, 2× 1200 W redundant hot-swappable PSUs. Palo Alto no longer lists the M-500 guide on docs.paloaltonetworks.com, so the source is a mirror of the vendor PDF; the current equivalent is the M-700 (M-300/M-700 hardware reference).",
      faces: [
        { name: "Front", blocks: [
          { kind: "module", label: "24× 2.5-inch hot-swap drive bays (A1–L2, RAID-1 pairs; up to 24× 2 TB)", short: "Drive", count: 24, rows: 1, numbering: "sequential", startAt: 1, groupOf: 12, tags: ["storage"] },
          { kind: "led", label: "Power / drive-activity / UID LEDs and power button", short: "PWR / HDD / UID", count: 3, labels: ["PWR", "HDD", "UID"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "mgmt", label: "MGT — RJ45 10/100/1000 management", short: "MGT", count: 1, labels: ["MGT"], speed: "1G", tags: ["oob"] },
          { kind: "rj45", label: "Eth1–Eth3 — 3× RJ45 10/100/1000 (Eth1/Eth2 for Panorama & log traffic; Eth3 reserved)", short: "Eth1–Eth3", count: 3, rows: 1, numbering: "sequential", startAt: 1, groupOf: 3, speed: "1G", poe: false, prefix: "Eth", tags: ["data"] },
          { kind: "sfp", label: "Eth4–Eth5 — 2× 10 GbE SFP+", short: "Eth4–Eth5 SFP+", count: 2, rows: 1, numbering: "sequential", startAt: 4, groupOf: 2, speed: "10G", poe: false, prefix: "Eth", tags: ["data"] },
          { kind: "console", label: "CONSOLE — DB-9 serial", short: "Console DB-9", count: 1, tags: ["db9"] },
          { kind: "usb", label: "4× USB (reserved for future use)", short: "USB ×4 (reserved)", count: 4, rows: 2, numbering: "sequential", startAt: 1 },
          { kind: "blank", label: "VGA (covered, reserved) + UID LED/button", count: 1 },
          { kind: "psu", label: "2× 1200 W redundant hot-swappable power supplies", short: "PSU 1+1 (1200 W)", count: 2, tags: ["1+1", "hot-swap"] }
        ] }
      ]
    },

    /* ═══════════════════════ FORTINET ═══════════════════════ */

    /* FortiGate 40F — data sheet + QuickStart Guide */
    "fortinet-fg-40f": {
      model: "FortiGate 40F (FG-40F)", vendor: "fortinet", form: "desktop",
      source: { label: "Fortinet FortiGate 40F Series data sheet (hardware section) + FortiGate/FortiWiFi 40F & 60F Series QuickStart Guide",
                url: "https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/fortigate-fortiwifi-40f-series.pdf" },
      confidence: "high",
      note: "Desktop / wall-mount unit; all connectors are on the rear edge. The FG-40F has ONE WAN port (not WAN1/WAN2) and no dedicated MGMT port: 5× GE RJ45 total = WAN + FortiLink A + ports 1–3. RJ45 console; external 12 V adapter. QuickStart Guide: docs.fortinet.com/document/fortigate/hardware/fortigate-fortiwifi-40f-3g4g-60f-series",
      faces: [
        { name: "Rear (connector side)", blocks: [
          { kind: "psu", label: "12 V DC power jack (external 100–240 V AC adapter)", short: "12 V DC in", count: 1 },
          { kind: "usb", label: "1× USB 3.0 Type-A", short: "USB 3.0", count: 1 },
          { kind: "console", label: "Console RJ45 (RS-232 CLI)", short: "Console RJ45", count: 1 },
          { kind: "rj45", label: "WAN — 1× GE RJ45", short: "WAN", count: 1, rows: 1, numbering: "none", speed: "1G", poe: false, labels: ["WAN"], names: ["wan"], tags: ["wan"] },
          { kind: "rj45", label: "FortiLink port A — 1× GE RJ45 (default FortiLink, can be reassigned as LAN)", short: "FortiLink A", count: 1, rows: 1, numbering: "none", speed: "1G", poe: false, labels: ["A"], names: ["a"], tags: ["fortilink"] },
          { kind: "rj45", label: "3× GE RJ45 internal switch ports (1–3)", short: "LAN 1–3", count: 3, rows: 1, numbering: "sequential", startAt: 1, groupOf: 3, speed: "1G", poe: false, prefix: "lan" }
        ] }
      ]
    },

    /* FortiGate 60F — data sheet + QuickStart Guide */
    "fortinet-fg-60f": {
      model: "FortiGate 60F (FG-60F)", vendor: "fortinet", form: "desktop",
      source: { label: "Fortinet FortiGate 60F Series data sheet (hardware section) + FortiGate/FortiWiFi 40F & 60F Series QuickStart Guide",
                url: "https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/fortigate-fortiwifi-60f-series.pdf" },
      confidence: "high",
      note: "Desktop / wall-mount (optional SP-RACKTRAY-02 rack tray). 10× GE RJ45 total: WAN1, WAN2, DMZ, FortiLink A & B (default FortiLink auto-detect), internal 1–5. No dedicated MGMT port; RJ45 console. QuickStart Guide: docs.fortinet.com/document/fortigate/hardware/fortigate-fortiwifi-40f-3g4g-60f-series",
      faces: [
        { name: "Rear (connector side)", blocks: [
          { kind: "psu", label: "12 V DC power jack (external 100–240 V AC adapter)", short: "12 V DC in", count: 1 },
          { kind: "usb", label: "1× USB 3.0 Type-A", short: "USB 3.0", count: 1 },
          { kind: "console", label: "Console RJ45 (RS-232 CLI)", short: "Console RJ45", count: 1 },
          { kind: "rj45", label: "WAN1 / WAN2 — 2× GE RJ45", short: "WAN1 / WAN2", count: 2, rows: 1, numbering: "sequential", startAt: 1, groupOf: 2, speed: "1G", poe: false, prefix: "wan", tags: ["wan"] },
          { kind: "rj45", label: "DMZ — 1× GE RJ45", short: "DMZ", count: 1, rows: 1, numbering: "none", speed: "1G", poe: false, labels: ["DMZ"], names: ["dmz"], tags: ["dmz"] },
          { kind: "rj45", label: "FortiLink ports A / B — 2× GE RJ45 (default FortiLink auto-detect)", short: "FortiLink A / B", count: 2, rows: 1, numbering: "none", speed: "1G", poe: false, labels: ["A", "B"], names: ["a", "b"], tags: ["fortilink"] },
          { kind: "rj45", label: "5× GE RJ45 internal switch ports (1–5)", short: "internal 1–5", count: 5, rows: 1, numbering: "sequential", startAt: 1, groupOf: 5, speed: "1G", poe: false, prefix: "internal" }
        ] }
      ]
    },

    /* FortiGate 80F — QuickStart Guide */
    "fortinet-fg-80f": {
      model: "FortiGate 80F (FG-80F)", vendor: "fortinet", form: "desktop",
      source: { label: "Fortinet FortiGate 80F Series QuickStart Guide (FG-80F/81F/80F-POE/80F-DSL/80F-Bypass)",
                url: "https://docs.fortinet.com/document/fortigate/hardware/fortigate-80f-series-quickstart-guide" },
      confidence: "high",
      note: "The FG-80F is a desktop unit (wall-mount kit / optional rack tray), not 1U; connectors are on the rear in two rows. WAN1/WAN2 are shared-media pairs with SFP1/SFP2 (two WAN links, each RJ45 OR SFP). LAN = ports 1–6 plus FortiLink A/B (8 RJ45). No dedicated MGMT port. External 12 V DC 3 A adapter with an optional second redundant adapter. The FG-80F-POE variant adds PoE on ports 1–4; the FG-80F-Bypass pairs WAN1 + port1.",
      faces: [
        { name: "Rear (connector side)", blocks: [
          { kind: "console", label: "Console RJ45 (top) — RS-232 CLI", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "1× USB 3.0 Type-A (below the console)", short: "USB 3.0", count: 1 },
          { kind: "sfp", label: "SFP1 (top) / SFP2 (bottom) — 2× GE SFP, shared media with WAN1/WAN2", short: "SFP1 / SFP2 (shared)", count: 2, rows: 2, numbering: "sequential", startAt: 1, groupOf: 2, speed: "1G", poe: false, prefix: "sfp", tags: ["wan", "shared"] },
          { kind: "rj45", label: "WAN1 (top) / WAN2 (bottom) — 2× GE RJ45, shared media with SFP1/SFP2", short: "WAN1 / WAN2 (shared)", count: 2, rows: 2, numbering: "sequential", startAt: 1, groupOf: 2, speed: "1G", poe: false, prefix: "wan", tags: ["wan", "shared"] },
          { kind: "rj45", label: "6× GE RJ45 internal ports 1–6 (1/3/5 top, 2/4/6 bottom)", short: "Ports 1–6", count: 6, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 6, speed: "1G", poe: false, prefix: "port" },
          { kind: "rj45", label: "FortiLink A (top) / B (bottom) — 2× GE RJ45 FortiLink", short: "FortiLink A / B", count: 2, rows: 2, numbering: "none", speed: "1G", poe: false, labels: ["A", "B"], names: ["a", "b"], tags: ["fortilink"] },
          { kind: "psu", label: "12 V DC 3 A power input (external adapter; optional redundant adapter)", short: "12 V DC in", count: 1 }
        ] }
      ]
    },

    /* FortiGate 100F — QuickStart Guide */
    "fortinet-fg-100f": {
      model: "FortiGate 100F (FG-100F; the 101F has identical ports + SSD)", vendor: "fortinet", form: "1RU",
      source: { label: "Fortinet FortiGate 100F Series QuickStart Guide (front/rear panel)",
                url: "https://docs.fortinet.com/document/fortigate/hardware/fortigate-100f-series-qsg" },
      confidence: "high",
      note: "Front panel, left to right: USB + console, DMZ over MGMT, WAN1 over WAN2, HA1 over HA2, RJ45 1–12 (odd top / even bottom), X1 over X2 (10GE SFP+ FortiLink), SFP 13–16, then SFP 17–20 and RJ45 17–20 (shared-media pairs — each number is RJ45 OR SFP). So: 22 data ports = 12 RJ45 + 2× 10G SFP+ + 8 GE SFP (4 shared), plus DMZ, MGMT, WAN1/2 and TWO HA ports. Rear: two redundant PSUs.",
      faces: [
        { name: "Front", blocks: [
          { kind: "usb", label: "1× USB 3.0 Type-A", short: "USB 3.0", count: 1 },
          { kind: "console", label: "Console RJ45 (RS-232 CLI)", short: "Console RJ45", count: 1 },
          { kind: "rj45", label: "DMZ (top) / MGMT (bottom) — 2× GE RJ45 (MGMT default 192.168.1.99)", short: "DMZ / MGMT", count: 2, rows: 2, numbering: "none", speed: "1G", poe: false, labels: ["DMZ", "MGMT"], names: ["dmz", "mgmt"], tags: ["mgmt", "dmz"] },
          { kind: "rj45", label: "WAN1 (top) / WAN2 (bottom) — 2× GE RJ45", short: "WAN1 / WAN2", count: 2, rows: 2, numbering: "sequential", startAt: 1, groupOf: 2, speed: "1G", poe: false, prefix: "wan", tags: ["wan"] },
          { kind: "rj45", label: "HA1 (top) / HA2 (bottom) — 2× GE RJ45 heartbeat", short: "HA1 / HA2", count: 2, rows: 2, numbering: "sequential", startAt: 1, groupOf: 2, speed: "1G", poe: false, prefix: "ha", tags: ["ha"] },
          { kind: "rj45", label: "12× GE RJ45 ports 1–12 (odd top / even bottom)", count: 12, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 12, speed: "1G", poe: false, prefix: "port" },
          { kind: "sfp", label: "X1 (top) / X2 (bottom) — 2× 10GE SFP+ FortiLink auto-discovery ports", short: "X1 / X2 FortiLink", count: 2, rows: 2, numbering: "sequential", startAt: 1, groupOf: 2, speed: "10G", poe: false, prefix: "x", tags: ["fortilink", "uplink"] },
          { kind: "sfp", label: "4× GE SFP ports 13–16 (13/15 top, 14/16 bottom)", short: "SFP 13–16", count: 4, rows: 2, numbering: "odd-top", startAt: 13, groupOf: 4, speed: "1G", poe: false, prefix: "port" },
          { kind: "sfp", label: "4× GE SFP ports 17–20 (shared media with RJ45 17–20)", short: "SFP 17–20 (shared)", count: 4, rows: 2, numbering: "odd-top", startAt: 17, groupOf: 4, speed: "1G", poe: false, prefix: "port", tags: ["shared"] },
          { kind: "rj45", label: "4× GE RJ45 ports 17–20 (shared media with SFP 17–20)", short: "RJ45 17–20 (shared)", count: 4, rows: 2, numbering: "odd-top", startAt: 17, groupOf: 4, speed: "1G", poe: false, prefix: "port", tags: ["shared"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× redundant PSU (PSU1 / PSU2), 100–240 V AC", short: "PSU1 / PSU2", count: 2 }
        ] }
      ]
    },

    /* FortiGate 200F — QuickStart Guide */
    "fortinet-fg-200f": {
      model: "FortiGate 200F (FG-200F; the 201F has identical ports + SSD)", vendor: "fortinet", form: "1RU",
      source: { label: "Fortinet FortiGate 200F Series QuickStart Guide (front/rear panel)",
                url: "https://docs.fortinet.com/document/fortigate/hardware/fortigate-200f-series-quickstart-guide" },
      confidence: "high",
      note: "Front, left to right: USB + console, HA over MGMT, RJ45 1–16 (odd top / even bottom, two blocks of 8), X1 over X2 (10GE SFP+ data), X3 over X4 (10GE SFP+ FortiLink auto-discovery), GE SFP 17–24 (two blocks of 4). 16× GE RJ45 + 8× GE SFP + 4× 10GE SFP+, one HA and one MGMT port. Rear: two redundant PSUs.",
      faces: [
        { name: "Front", blocks: [
          { kind: "usb", label: "1× USB 3.0 Type-A", short: "USB 3.0", count: 1 },
          { kind: "console", label: "Console RJ45 (RS-232 CLI)", short: "Console RJ45", count: 1 },
          { kind: "rj45", label: "HA (top) / MGMT (bottom) — 2× GE RJ45 (MGMT default 192.168.1.99)", short: "HA / MGMT", count: 2, rows: 2, numbering: "none", speed: "1G", poe: false, labels: ["HA", "MGMT"], names: ["ha", "mgmt"], tags: ["ha", "mgmt"] },
          { kind: "rj45", label: "16× GE RJ45 ports 1–16 (odd top / even bottom, blocks of 8)", count: 16, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 8, speed: "1G", poe: false, prefix: "port" },
          { kind: "sfp", label: "X1 (top) / X2 (bottom) — 2× 10GE SFP+", short: "X1 / X2 10GE", count: 2, rows: 2, numbering: "sequential", startAt: 1, groupOf: 2, speed: "10G", poe: false, prefix: "x", tags: ["uplink"] },
          { kind: "sfp", label: "X3 (top) / X4 (bottom) — 2× 10GE SFP+ FortiLink auto-discovery", short: "X3 / X4 FortiLink", count: 2, rows: 2, numbering: "sequential", startAt: 3, groupOf: 2, speed: "10G", poe: false, prefix: "x", tags: ["fortilink", "uplink"] },
          { kind: "sfp", label: "8× GE SFP ports 17–24 (odd top / even bottom, blocks of 4)", short: "SFP 17–24", count: 8, rows: 2, numbering: "odd-top", startAt: 17, groupOf: 4, speed: "1G", poe: false, prefix: "port" }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× redundant PSU, 100–240 V AC 2–1.2 A", short: "PSU 1+1", count: 2 }
        ] }
      ]
    },

    /* FortiGate 600F — Quick Start Guide (+ data sheet for the form factor) */
    "fortinet-fg-600f": {
      model: "FortiGate 600F (FG-600F; the 601F has identical ports + SSDs)", vendor: "fortinet", form: "1RU",
      source: { label: "Fortinet FortiGate 600F Quick Start Guide (front/rear panel); form factor 1 RU per the FortiGate 600F Series data sheet",
                url: "https://docs.fortinet.com/document/fortigate/hardware/fortigate-600f-quick-start-guide" },
      confidence: "high",
      note: "The FG-600F is 1 RU (data sheet: rack mount, 44.45 × 432 × 380 mm). Front, left to right: 2× USB, console, BLE button, HA over MGMT, RJ45 1–16 (odd top / even bottom, blocks of 8), GE SFP 17–24 (blocks of 4), X1–X4 10GE SFP+ (X1/X2 = FortiLink), X5–X8 ultra-low-latency 25GE SFP28 (also 10G/1G). Rear: SSD1/SSD2 bays, FAN1–FAN5, PWR1/PWR2 1+1 hot-swappable PSUs.",
      faces: [
        { name: "Front", blocks: [
          { kind: "usb", label: "2× USB 3.0 Type-A", short: "USB 3.0 ×2", count: 2 },
          { kind: "console", label: "Console RJ45 (RS-232 CLI) + BLE button", short: "Console RJ45 / BLE", count: 1 },
          { kind: "rj45", label: "HA (top) / MGMT (bottom) — 2× GE RJ45", short: "HA / MGMT", count: 2, rows: 2, numbering: "none", speed: "1G", poe: false, labels: ["HA", "MGMT"], names: ["ha", "mgmt"], tags: ["ha", "mgmt"] },
          { kind: "rj45", label: "16× GE RJ45 ports 1–16 (odd top / even bottom, blocks of 8)", count: 16, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 8, speed: "1G", poe: false, prefix: "port" },
          { kind: "sfp", label: "8× GE SFP ports 17–24 (odd top / even bottom, blocks of 4)", short: "SFP 17–24", count: 8, rows: 2, numbering: "odd-top", startAt: 17, groupOf: 4, speed: "1G", poe: false, prefix: "port" },
          { kind: "sfp", label: "X1–X4 — 4× 10GE SFP+ (X1/X2 FortiLink; X1/X3 top, X2/X4 bottom)", short: "X1–X4 10GE SFP+", count: 4, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 4, speed: "10G", poe: false, prefix: "x", tags: ["fortilink", "uplink"] },
          { kind: "sfp28", label: "X5–X8 — 4× 25GE SFP28 ultra-low-latency (25G/10G/1G; X5/X7 top, X6/X8 bottom)", short: "X5–X8 25GE ULL", count: 4, rows: 2, numbering: "odd-top", startAt: 5, groupOf: 4, speed: "25G", poe: false, prefix: "x", tags: ["uplink", "ull"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "module", label: "2× SSD bays (SSD1 / SSD2; populated on the FG-601F)", short: "SSD", count: 2 },
          { kind: "fan", label: "5× fan modules (FAN1–FAN5)", short: "FAN1–FAN5", count: 5 },
          { kind: "psu", label: "2× 1+1 redundant hot-swappable PSU (PWR1 / PWR2), 100–240 V AC 6 A max", short: "PWR1 / PWR2", count: 2, labels: ["PWR1", "PWR2"] }
        ] }
      ]
    },

    /* FortiSwitch 124E-POE — QuickStart Guide */
    "fortinet-fs-124e-poe": {
      model: "FortiSwitch 124E-POE (FS-124E-POE)", vendor: "fortinet", form: "1RU",
      source: { label: "Fortinet FortiSwitch 124E Series QuickStart Guide (FS-124E / 124E-POE / 124E-FPOE front panel)",
                url: "https://docs.fortinet.com/document/fortiswitch/hardware/fortiswitch-124e-series-quickstart-guide" },
      confidence: "high",
      note: "Drawn as the 124E-POE. Per the QSG only ports 1–12 are PoE (802.3af/at, 185 W budget) — ports 13–24 are plain GE; the 124E-FPOE powers all 24 (370 W) and the plain 124E has no PoE. There are FOUR GE SFP ports (25–28, stacked 25/26 and 27/28) and no dedicated FortiLink port (any port can be FortiLink). Console RJ45 at the far left; internal 100–240 V AC PSU on the rear; 19-inch rack brackets included with the POE/FPOE models.",
      faces: [
        { name: "Front", blocks: [
          { kind: "console", label: "Console RJ45 (RS-232 CLI)", short: "Console RJ45", count: 1 },
          { kind: "rj45", label: "12× GE RJ45 PoE+ ports 1–12 (802.3af/at, 185 W shared; odd top / even bottom)", count: 12, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 12, speed: "1G", poe: true, prefix: "port" },
          { kind: "rj45", label: "12× GE RJ45 non-PoE ports 13–24 (odd top / even bottom)", count: 12, rows: 2, numbering: "odd-top", startAt: 13, groupOf: 12, speed: "1G", poe: false, prefix: "port" },
          { kind: "sfp", label: "4× GE SFP ports 25–28 (25/27 top, 26/28 bottom) — uplink / FortiLink", short: "SFP 25–28 uplink", count: 4, rows: 2, numbering: "odd-top", startAt: 25, groupOf: 4, speed: "1G", poe: false, prefix: "port", tags: ["uplink", "fortilink"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "1× internal PSU, 100–240 V AC 50/60 Hz (3 A max) + grounding screw", short: "AC inlet (internal PSU)", count: 1 }
        ] }
      ]
    },

    /* FortiSwitch 248E-FPOE — QuickStart Guide + Secure Access data sheet */
    "fortinet-fs-248e-fpoe": {
      model: "FortiSwitch 248E-FPOE (FS-248E-FPOE)", vendor: "fortinet", form: "1RU",
      source: { label: "Fortinet FortiSwitch 248E Series QuickStart Guide + FortiSwitch Secure Access Series data sheet",
                url: "https://docs.fortinet.com/document/fortiswitch/hardware/fortiswitch-248e-series-quickstart-guide" },
      confidence: "medium",
      note: "Drawn as the 248E-FPOE (48 PoE+ ports, 740 W); on the 248E-POE only ports 1–24 are PoE (370 W) and 25–48 are plain GE. Both have 4× GE SFP (49–52) — there are no 10G SFP+ ports on the 248E. Dedicated MGMT RJ45 (192.168.1.99) and console RJ45 on the front; internal 100–240 V AC PSU (12 A max) plus a DC RPS input for the optional FRPS-740 redundant supply on the rear. Counts are from the QSG/data sheet; the two-row odd/even grouping in blocks of 12 is Fortinet's standard 48-port layout but was not legible in the QSG diagram.",
      faces: [
        { name: "Front", blocks: [
          { kind: "rj45", label: "48× GE RJ45 PoE+ ports 1–48 (802.3af/at, 740 W shared; odd top / even bottom, blocks of 12)", count: 48, rows: 2, numbering: "odd-top", startAt: 1, groupOf: 12, speed: "1G", poe: true, prefix: "port" },
          { kind: "sfp", label: "4× GE SFP ports 49–52 (49/51 top, 50/52 bottom) — uplink / FortiLink", short: "SFP 49–52 uplink", count: 4, rows: 2, numbering: "odd-top", startAt: 49, groupOf: 4, speed: "1G", poe: false, prefix: "port", tags: ["uplink", "fortilink"] },
          { kind: "mgmt", label: "MGMT — 1× RJ45 out-of-band management (192.168.1.99)", short: "MGMT", count: 1 },
          { kind: "console", label: "Console RJ45 (RS-232 CLI)", short: "Console RJ45", count: 1 }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "1× internal PSU, 100–240 V AC 12 A max", short: "AC inlet (internal PSU)", count: 1 },
          { kind: "psu", label: "RPS DC input (+12 V 14 A / −54 V 7.8 A) for the optional FRPS-740 redundant supply", short: "RPS DC in (FRPS-740)", count: 1 }
        ] }
      ]
    },

    /* FortiAP 431F — QuickStart Guide */
    "fortinet-fap-431f": {
      model: "FortiAP 431F (FAP-431F)", vendor: "fortinet", form: "AP",
      source: { label: "Fortinet FortiAP 431F/433F QuickStart Guide (interfaces)",
                url: "https://docs.fortinet.com/document/fortiap/hardware/fortiap-431f-433f-qsg" },
      confidence: "high",
      note: "Connector recess on the back of the ceiling-mount AP, in QSG order: LAN2/POE 1G, LAN1/POE 2.5G (primary uplink + power), console RJ45, reset, optional 12 V DC 2.5 A jack. The QSG rates both LAN ports as 802.3at PoE input. Antennas are internal on the 431F (the 433F is the external-antenna variant): four dual-band radiating antennas A1–A4 plus one scanning antenna A5.",
      faces: [
        { name: "Rear connectors", blocks: [
          { kind: "rj45", label: "LAN2 / POE 1G — 1× GE RJ45, 802.3at PoE input (secondary)", short: "LAN2 1G PoE", count: 1, rows: 1, numbering: "none", speed: "1G", poe: true, labels: ["LAN2"], names: ["lan2"], tags: ["secondary"] },
          { kind: "rj45", label: "LAN1 / POE 2.5G — 1× 2.5GE RJ45, 802.3at PoE input (primary uplink)", short: "LAN1 2.5G PoE", count: 1, rows: 1, numbering: "none", speed: "mGig", poe: true, labels: ["LAN1"], names: ["lan1"], tags: ["uplink", "primary"] },
          { kind: "console", label: "Console RJ45 (CLI)", short: "Console RJ45", count: 1 },
          { kind: "led", label: "Reset button", short: "Reset", count: 1, labels: ["RST"] },
          { kind: "psu", label: "Optional 12 V DC 2.5 A power jack (adapter not included)", short: "12 V DC in (opt.)", count: 1 },
          { kind: "antenna", label: "5 internal antennas (A1–A4 dual-band 2.4/5 GHz radios 1–2, A5 dedicated scanning radio)", short: "Internal antennas ×5", count: 5 }
        ] }
      ]
    },

    /* FortiAP 234F — QuickStart Guide (outdoor) */
    "fortinet-fap-234f": {
      model: "FortiAP 234F (FAP-234F)", vendor: "fortinet", form: "AP",
      source: { label: "Fortinet FortiAP 432F / 234F QuickStart Guide (interfaces)",
                url: "https://docs.fortinet.com/document/fortiap/hardware/fortiap-432f-234f-qsg" },
      confidence: "high",
      note: "Per the QSG the FAP-234F is an OUTDOOR AP (wall/pole mount kit, PoE injector included, IP67 Ethernet cable glands, −30 to 60 °C) with internal antennas and no USB port. Connectors (bottom, left to right): console RJ45, LAN2 1GE/PoE, LAN1 1GE/PoE (primary, 802.3at input via injector or PoE switch). Reset button under a sealed cap.",
      faces: [
        { name: "Bottom connectors (weather-sealed)", blocks: [
          { kind: "console", label: "Console RJ45 (CLI)", short: "Console RJ45", count: 1 },
          { kind: "rj45", label: "LAN2 — 1× GE RJ45, 802.3at PoE (secondary)", short: "LAN2 1G PoE", count: 1, rows: 1, numbering: "none", speed: "1G", poe: true, labels: ["LAN2"], names: ["lan2"], tags: ["secondary"] },
          { kind: "rj45", label: "LAN1 — 1× GE RJ45, 802.3at PoE input (primary uplink, IP67 gland)", short: "LAN1 1G PoE", count: 1, rows: 1, numbering: "none", speed: "1G", poe: true, labels: ["LAN1"], names: ["lan1"], tags: ["uplink", "primary"] },
          { kind: "led", label: "Reset button (sealed)", short: "Reset", count: 1, labels: ["RST"] },
          { kind: "antenna", label: "Internal dual-band antennas (2×2 2.4 GHz + 2×2 5 GHz) + BLE/Zigbee", short: "Internal antennas", count: 1 }
        ] }
      ]
    },

    /* FortiAP 432F — QuickStart Guide (outdoor, external antennas) */
    "fortinet-fap-432f": {
      model: "FortiAP 432F (FAP-432F)", vendor: "fortinet", form: "AP",
      source: { label: "Fortinet FortiAP 432F / 234F QuickStart Guide (interfaces)",
                url: "https://docs.fortinet.com/document/fortiap/hardware/fortiap-432f-234f-qsg" },
      confidence: "high",
      note: "Outdoor IP67 AP with external N-type antennas: 6× N-type connectors (A1–A4 dual-band for radios 1–2, one third-radio scanning antenna, one BLE antenna; the box ships 6 omni antennas). Connectors: LAN1 2.5GE PoE input (802.3at, 54 V injector included), LAN2 1GE PSE (PoE OUT to a downstream device), console RJ45, reset.",
      faces: [
        { name: "Bottom connectors (weather-sealed)", blocks: [
          { kind: "rj45", label: "LAN1 — 1× 2.5GE RJ45, 802.3at PoE input (primary uplink, IP67 gland)", short: "LAN1 2.5G PoE-in", count: 1, rows: 1, numbering: "none", speed: "mGig", poe: true, labels: ["LAN1"], names: ["lan1"], tags: ["uplink", "primary"] },
          { kind: "rj45", label: "LAN2 — 1× GE RJ45 PSE (PoE out to a downstream device)", short: "LAN2 1G PoE-out", count: 1, rows: 1, numbering: "none", speed: "1G", poe: true, labels: ["LAN2"], names: ["lan2"], tags: ["poe-out"] },
          { kind: "console", label: "Console RJ45 (CLI)", short: "Console RJ45", count: 1 },
          { kind: "led", label: "Reset button (sealed)", short: "Reset", count: 1, labels: ["RST"] },
          { kind: "antenna", label: "6× N-type external antenna connectors (A1–A4 dual-band, 1 scanning radio, 1 BLE)", short: "N-type antennas ×6", count: 6 }
        ] }
      ]
    },

    /* FortiWLC 500D — QuickStart Guide (legacy Meru line) */
    "fortinet-fwlc-500d": {
      model: "FortiWLC 500D (FWC-500D)", vendor: "fortinet", form: "1RU",
      source: { label: "Fortinet FortiWLC 500D QuickStart Guide (Ports & LEDs) — listed on the Wireless Controller hardware documentation page",
                url: "https://docs.fortinet.com/product/wireless-controller/hardware" },
      confidence: "medium",
      note: "Drawn as the FortiWLC 500D (legacy Meru-derived line). QSG port table: console RJ45 (RS-232, 115200), USB 2.0 Type-B, four dual-media GE ports (each one RJ45 10/100/1000BASE-T OR one SFP 1000BASE-X), two 10GE SFP+ (ports 9–10), and two redundant hot-swappable PSUs (1+1) on the rear; 1U chassis. The QSG lists no dedicated HA or MGMT port — HA and management run over the GE ports. Left-to-right order and the USB count are not stated in the QSG text.",
      faces: [
        { name: "Front", blocks: [
          { kind: "console", label: "Console RJ45 (RS-232 serial, 115200 bps)", short: "Console RJ45", count: 1 },
          { kind: "usb", label: "USB 2.0 Type-B (count not stated in the QSG)", short: "USB-B", count: 1 },
          { kind: "rj45", label: "4× GE RJ45 (dual-media ports 1–4, shared with the 4 GE SFP cages)", short: "GE 1–4 (dual-media)", count: 4, rows: 1, numbering: "sequential", startAt: 1, groupOf: 4, speed: "1G", poe: false, prefix: "port", tags: ["shared"] },
          { kind: "sfp", label: "4× GE SFP (dual-media, shared with RJ45 1–4 — one of each pair active)", short: "SFP 5–8 (dual-media)", count: 4, rows: 1, numbering: "sequential", startAt: 5, groupOf: 4, speed: "1G", poe: false, prefix: "port", tags: ["shared"] },
          { kind: "sfp", label: "2× 10GE SFP+ (ports 9–10, SR/LR)", short: "SFP+ 9–10", count: 2, rows: 1, numbering: "sequential", startAt: 9, groupOf: 2, speed: "10G", poe: false, prefix: "port", tags: ["uplink"] }
        ] },
        { name: "Rear", blocks: [
          { kind: "psu", label: "2× redundant hot-swappable PSU (1+1), 100–240 V AC 5–3 A", short: "PSU 1+1", count: 2 }
        ] }
      ]
    }
  };
})(typeof window !== 'undefined' ? window : this);
