# Draftly Structural Designer

A structural engineering tool for outdoor structures (pergolas, carports, verandahs, sheds) built for builders, renovators, and developers who need council-ready drawings.

## What It Does

- **Member Sizing** — Calculates the lightest passing C-section, RHS/SHS, timber, or aluminium member for each structural element (posts, rafters, purlins, ledgers, fascia) per AS/NZS 4600
- **Member Forms** — Choose from open C-section, C+plate infill, back-to-back C, or RHS/SHS. Each form applies the correct LTB factor automatically
- **Gable Infill** — Designs gable end panels with cladding selection (polycarbonate, Trimdek, Custom Orb, etc.) and calculates dropper spacing
- **AS1100 Drawings** — Generates engineering-standard drawings with proper title blocks, dimensioning, material callouts, and section marks:
  - Plan view with structure layout relative to existing dwelling
  - Roof geometry diagram with pitch, span, rise, rafter length
  - Full detail elevation (3-panel: wall section / socket joint / corner post)
  - Individual connection details (corner post, rafter-ledger, cross-bracing, socket joint, fascia penetration)
  - Connection inventory with standards and install times

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- SVG generation for all engineering drawings (AS1100 compliant)

## Standards Reference

- AS/NZS 4600 — Cold-formed steel structures
- AS1100.101 / AS1100.301 — Technical drawing
- AS1163 — Structural steel hollow sections
- AS4680 — Hot-dip galvanizing
- AS1684 — Timber framing
- AS3600 — Concrete structures
- AS5216 — Structural fixing

## Getting Started

```bash
npm install
npm run dev
```

## Drawing Register

| Drawing No | Title |
|---|---|
| DRF-001-SEC-A | Section A-A — Existing Dwelling Wall at Eave |
| DRF-002-ELEV-01 | Detail Elevation — Attached Gable Structure (3-panel) |
| DRF-003-POST-01 | Corner Post / Ledger Connection |
| DRF-004-RAFT-01 | Rafter to Ledger Connection |
| DRF-005-BRACE-01 | Cross-Bracing (X-Brace) — End Bay |
| DRF-007-SOCK-01 | Socket Joint — Rafter to 65x65 Standoff |
| DRF-008-FASC-01 | Fascia Penetration — 65x65 SHS |
