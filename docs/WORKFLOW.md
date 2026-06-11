# Draftly — end-to-end workflow & status

The three apps form one pipeline. This is the map, the day-to-day workflow, what's
built, and what's next. Companion docs: `DRAFTING_HANDOVER_SPEC.md` (the contract),
`WATER_SERVICES_REVIEW.md`, `ELECTRICAL_LIGHTING_SCOPE.md`.

```
Site Intelligence ──.designset.json──► Engineering ──.designset.json──► Drafting ──hand-back──► Engineering ──► Certification
 (capture)                              (size + check)                   (draw + finalise)        (re-check)        (issue)
```

## The pipeline

1. **Site Intelligence** — address → planning data, siting on the cadastre, setbacks,
   overlays, **stormwater** (downpipes + catchment), and **electrical/lighting scope**
   (luminaire fixtures via dropdown, supply, light-spill). Emits a handoff
   (`boundaries.*` + `engineeringPackage.*`).
2. **Engineering** (this app) — imports the handoff, sizes every member, runs the
   portal/tied-rafter frame analysis, lateral/bracing (incl. the ply-ceiling
   diaphragm), re-checks planning compliance, and emits the **computations sheet**.
   Hands over a `.designset.json`.
3. **Drafting** — opens the design set as editable 1:1 geometry, draws details +
   the **electrical layout** (own layer/colour), ticks its handover items, and
   **hands back** the design set.
4. **Engineering** re-import re-runs the calcs on the returned design → calc PDF.
5. **Certification** — final print + surveyor + engineer (+ electrician) sign-off,
   tracked as the last checklist stage.

## Save a design as a Drafting start point (the workflow you asked about)

1. **Engineering → Drawings tab → ⚙ Export DesignSet** — downloads
   `<project>.designset.json` (carries geometry, sections + real pass/util, heights,
   drainage detail, electrical scope, and the readiness checklist).
2. **Drafting → File ▤ → ⚙ Open Engineering DesignSet…** — rebuilds it as editable
   geometry.
3. **Drafting → File ▤ → ✓ Save** — banks it in the library under a name; reopen +
   modify any time. (Also keep the downloaded `.json` as a portable snapshot.)
4. When changed, **↩ Hand back to Engineering…** returns it (with your `dr-`/`ce-`
   ticks) for a re-check.

## Progressive handover checklist

One list spans all four stages and **auto-ticks as data/docs arrive**; the
Drafting + certification ticks travel in `results.readiness` and merge back.
Item ids + ownership are in `DRAFTING_HANDOVER_SPEC.md §3`. Soft issue-gate: the
exports warn on outstanding items but stay enabled.

## What's built (this round)

- **Per-side attachment → lateral restraint** (transverse/longitudinal from the
  attached faces, not just the coarse enum).
- **Ply ceiling diaphragm** bracing: screw-fixed vs **timber-battened (contained)**
  detail, light-vs-heavy mass comparison, + **C-section web-bearing** check.
- **Structural computations sheet** (S-010+) — every value with formula + basis,
  ASSUMED items flagged for the engineer.
- **Readiness checklist** (Intelligence/Engineering/Drafting/Certification) +
  lossless **water services** (`si-water`) + **electrical** scope (`si-/dr-/ce-`).
- **Intelligence**: electrical/lighting capture with a **fixture-type dropdown**;
  approval panel now **explains** the 3 m / 10 m² figures are the permit-exemption
  caps, not the zone height limit.
- **Drafting**: electrical **symbol placement** (outdoor fixture range, light
  spread, mount height, switch, GPO, fuse box) on its own amber layer; placing it
  ticks `dr-electrical` on hand-back.
- **Engineering**: estimated setbacks with a robust margin show green (still
  labelled estimated); on-the-line ones stay "confirm". Intermediate-frame section
  now names the **roof form** (Gable/Skillion/Flat) + mono-pitch caveat.

## Verification status

- **Cross-repo data round-trip PASS** (headless, real code): Eng export →
  Drafting parse + extras + tick → hand-back → Eng re-import. Sections, real
  pass/util, heights, drainage detail, electrical, and checklist ticks all survive.
- Calc self-checks: `npm run check:lateral` (lateral/diaphragm/computations/
  checklist) + `npm run check:handoff` (canonical fixture).
- **Not yet automated:** the pure-UI layer — the Export *download*, the file
  *picker* upload, canvas render, Save-to-library. Standard + reviewed, but worth a
  live click-through.

## Next steps / backlog

1. **Flat roof — in-depth pass** (deferred by request). Revisit the flat/skillion
   frame geometry and loads properly.
2. **Skillion portal = true mono-pitch frame.** `calcPortalFrame` models a
   symmetric gable apex; skillion is currently approximated + caveated. Add a real
   mono-pitch frame analysis.
3. **Auto electrical layout SHEET in Drafting.** Symbol placement + the
   `elecLegendLine` helper exist; wire an auto-generated legend block + a composed
   electrical sheet (currently drawn manually).
4. **Live UI click-through** of Export → Open → Save-to-library → Hand-back on the
   deployed apps (the one layer the headless round-trip can't cover).
5. **Regulatory confirmations** (engineer's call, not auto): per-state electrical
   certificate names; VIC building-permit exemption *by structure type* (the 10 m²/
   3 m Class-10a caps are applied to all ancillary types today).
6. **Tunables** to confirm: `EST_ROBUST_MARGIN_M` (1.0 m setback buffer),
   `CONTAINED_FIXING_SHEAR_KN`/`WEB_BEARING` (ASSUMED diaphragm constants),
   `CEILING_SCREW_SHEAR_KN`, LTB factors.
7. **Intelligence emit confirmation** for electrical (now built) on a real export.

## Repos & deploys

- **Engineering** — work merged to `main`.
- **Intelligence** — `gavinadams80-ui/Draftly-Intelligence`, **auto-deploys from main** (Vercel).
- **Drafting** — `gavinadams80-ui/Draftly-Drafting`, **auto-deploys from main** (Vercel).

All session feature branches merged + deleted. Remaining `claude/*` branches are
pre-existing / in other worktrees — left untouched.
