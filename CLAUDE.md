# CLAUDE.md

> ## ⛔ ARCHIVED — this repo is superseded by the `Draftly-HQ` monorepo
> Do **not** develop here. All active work (Engineering + Drafting + shared `@draftly/*` packages)
> lives in **[`gavinadams80-ui/Draftly-HQ`](https://github.com/gavinadams80-ui/Draftly-HQ)**.
> If a session opened this repo by mistake, stop and switch to `Draftly-HQ`. The notes below are
> retained for history only.
>
> ⚠️ Known gap: the 2026-06-14 branding work (Draftly logo + cross-app pipeline strip, PR #22)
> landed HERE, not in the monorepo — it still needs porting into `Draftly-HQ`.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⭐ Latest handover — Branding + cross-app pipeline strip (2026-06-14)
- **NOT yet on `main`.** Branch `claude/site-upgrades-u6146r`, **draft PR #22** (CI green + Vercel
  deploy success, `mergeable_state: clean`). Companion work in Drafting (`Draftly-Drafting` PR #46)
  — review/merge the two together. (User's "site upgrades" meant *branding + the app-to-app
  walk-through*, NOT the engineering site-plan sheets.)
- **Shared brand module** `src/components/brand/DraftlyBrand.tsx` (self-contained; duplicated in
  Drafting — the apps share `@draftly/drawings` but no React UI layer):
  - `DraftlyMark` — crisp flat purple `#863bff` Draftly glyph (favicon path, gradient, no blur).
  - `DraftlyLogo` — mark + "Draftly" wordmark + tagline; reuses the existing `.logo-mark` /
    `.logo-name` / `.logo-tagline` CSS (the old `.logo-icon` gold square is now unused — left in CSS).
  - `PipelineStrip` — Site Intelligence → Engineering → Drafting → Certification; current stage
    gold-highlighted.
- **Header** (App.tsx ~1549): generic gold hexagon icon → the real Draftly mark; added
  `PipelineStrip current="engineering"` with the Drafting chip wired to `handleExportDesignSet`
  (hand the DesignSet over).
- **Favicon** — Eng had NONE; added `public/favicon.svg` (same mark as Drafting) + `<link>` in
  `index.html`; title is now `Draftly · Structural Designer`.
- **Brand decision** (user had no preference): purple mark = logo glyph; gold `#c9a84c` stays the
  UI/drawing accent.
- **LEFT TO DO:** (a) **cross-app URL launch links** from the pipeline stages once deployed URLs
  are known. (b) merge PR #22 + Drafting PR #46 to `main` together (both still draft).

## ⭐ Session handover — Engineering presets + 1:1 gable-frame model (2026-06-12)

Branch `claude/engineering-presets-pdf-enak5m`, merged to `main`. Spanned two repos:
`Draftly-` (this, engineering) and `@draftly/drawings` (Draftly-Drawings, bumped 0.11.0 → 0.12.0).

**1. Structural presets** (`src/lib/presets.ts`) — one-tap config starting points. First preset
*"9.27 Clear-Span Gable · Portal · C+Plate"* seeds 9.27 m clear span, gable, portal-frame
intermediates, 10° pitch, 3 frames, three-side attached. Portal rafter/column → C300×70×3.0 **+
plate** (form `'plate'`, LTB 0.92, auto-picks deepest passing C). Gable end frame + infill →
**RHS 100×50×3.0** (pinned via `overrides`). `applyPreset()` seeds config + forms + overrides +
standoff/setbacks. Picker chips at the top of the Structure tab.

**2. 1:1 gable-frame model** (`@draftly/drawings` `generateGableFrameModelSVG`) — the **canonical
section drawing**. It **replaces** the old `generateWallSectionSVG` sheets (S-004/5/6) and the
plan-over-section projection (S-001a), both now **retired** from `submissionSheets`. Sheets now
emitted: **S-001b/c/d** = one section per frame (A-A/B-B/C-C). Drawn from REAL steel members
(catalogue depth, C lips / RHS box, plate on the C open face) at true 1:1; member sizes track the
engineering pick (`calc.sel*`). No page furniture (the `withTitleBlock` wrap is a placeholder for
a future **layout tab**).
- **A-A, C-C** = gable-end tied trusses: RHS infill (rafters + bottom-chord tie + droppers; 100 mm
  face to viewer; centred on the apex, symmetric; chord inset to clear the fascia/inner column).
- **B-B** = untied portal moment frame (C+plate rafters & columns; no tie/droppers).
- **Roof plan** (span × depth: frames + purlins) projects to the section; plan purlins segmented
  between frames. Purlins: ridge 75 mm off apex, eave flush with rafter end, **even** spacing
  (max = roofing-profile `internalSpan`, remainder spread over the bays); section end-views rotated
  flush to the rafter pitch; **dropper layout from `calcGableInfill`**.
- **Attached (brick) variant** — `generateBrickWallBlock` (timber 90×45 + cavity + brick + fascia C
  + gutter) on both sides, gap = clear span; fascia/gutter heights + gutter overhang from **Site
  Intelligence** (`siteConstraints.fasciaHeight / gutterHeight / existingGutterOverhangMm`); **red
  RHS through-fascia wall attachment** (internal sleeve) sitting on the brick top. Rafter offset =
  frame stand-off.
- **Freestanding variant** — steel **column→rafter knee**: column continues to the rafter top
  (pitch-cut), rafter + chords cut to the inner column face, **2 laser-cut sleeve plates** (top
  rhombus with plumb-cut ends + bottom square, 150×75 mm, 2× 20 mm holes 30 mm off edges) welded to
  the column top into the sections; column extended out to the fascia face; eave purlin becomes a
  plumb **fascia + gutter** (continuous along the eave in plan). Fascia/gutter sit 150 mm out from
  the rafter eave (column 100 + fascia 50) = the attached standoff, so the two **overlay**.

**Key files**: `src/lib/presets.ts`; `src/App.tsx` (preset picker + `submissionSheets`);
`@draftly/drawings/src/gableFrameModel.ts`, `.../brickWallBlock.ts`; `.../wallSection.ts` (canvas
now auto-fits spans ≤ ~15 m — legacy, superseded by the model for sections).

**Next**: real layout/paperspace tab; plate face-flush vs centred (currently centred); make the
freestanding fascia offset track the Intelligence stand-off if it changes from 150; further
development in Drafting (the CAD app consumes the model).

**Follow-up (2026-06-13, PR #19):** the loose ends the sandboxed session couldn't push are closed —
`v0.12.0` tag now EXISTS on Draftly-Drawings (= main merge `cba979f`); `package.json` pins
`#v0.12.0` (tag, not raw SHA); `projectionSheet.ts` deletion landed; session branches trimmed and
auto-delete-on-merge enabled repo-wide. Drafting now renders the SAME model on DesignSet import
(Drafting PR #43, `designSetModel.ts` → `generateGableFrameModelSVG` for gable A-A/B-B/C-C).
⚠️ npm gotcha: npm cached a stale resolution for an earlier transient `v0.12.0` ref — if an install
shows 0.11.0, run `npm update @draftly/drawings` (cache clean does NOT fix it).

**Session autosave (2026-06-13, PR #21):** the app had NO persistence — closing/refreshing the tab
silently destroyed the design (this nearly lost real work twice). Now `src/lib/autosave.ts` +
wiring in `App.tsx` debounce-saves the design INPUTS (config, forms, overrides, profile/cladding,
standoff, setbacks, diaphragm detail, title block, site constraints, north rotation) to
localStorage key `draftly-eng.autosave.v1` on every change, and restores them on next load via a
"↻ Design restored from autosave" banner with a **Start fresh** button. The aerial underlay base64
is STRIPPED before saving (quota). Verified live: write-on-load (12 keys) + restore + Start-fresh.
A duplicate impl from a parallel session (PR #20, branch `claude/frosty-proskuriakova`) was CLOSED
unmerged — this (#21) is the one on main; bump the key version if the saved shape changes.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

There are no tests. TypeScript is the primary correctness check — run `npm run build` to catch type errors before committing.

## Architecture

Single-page React app (Vite + TypeScript). All state lives in `App.tsx`; there is no global state library.

### Core data flow

1. **User configures** `ProjectConfig` (dimensions, material, attachment, roof type) in the Structure tab.
2. **`useMemo` in App.tsx** calls `calcUtilisation()` from `src/lib/engine.ts` for every structural member (post, beam, purlin, ledger, fascia, gable chord, gable dropper, gable top chord). This runs on every config or form change.
3. **Results** (`UtilResult[]`) are passed to `MemberCard` components that display utilisation %, bending moment, and deflection.
4. **SVG drawings** are generated by pure functions in `src/lib/` and injected via `dangerouslySetInnerHTML`.

### Engineering engine (`src/lib/engine.ts`)

- `calcUtilisation()` — the central calculation. Takes a section list, span, tributary spacing, material, and optional `memberForm`. Returns `UtilResult[]` sorted by weight (lightest first). Applies LTB factors per section form: open C = 0.65, C+plate = 0.92, B2B = 0.85, RHS = 1.0.
- `lightestPassing()` — picks the first passing result from a sorted list.
- `filterByForm()` — filters a section DB array to only sections matching the chosen member form (open/b2b/rhs; 'plate' reuses open C sections).
- `getBracingFactor()` — returns a factor (0.35–1.0) applied to effective span based on attachment type.
- `calcGableInfill()` — separate calculator for gable end cladding panels and dropper layout.
- Load constants: 0.74 kPa ultimate (1.2G + 1.5Q), 0.48 kPa service, deflection limit span/250.

### Section database (`src/lib/sections.ts`)

`getSectionDB(constructionType)` returns a `SectionDB` with `posts`, `beams`, and `rafters` arrays. Each `Section` object has `d` (depth mm), `t` (thickness mm), `Z` (section modulus mm³), `I` (second moment mm⁴), `E` (MPa), `fy` (MPa), `wt` (kg/m). Four material systems: `csection` (G450 cold-formed C), `steel` (structural RHS/SHS), `timber` (F17/GL18), `aluminium` (6061-T6).

Section form is identified from the size string prefix: `RHS`/`SHS` → rhs, `2/` → b2b, everything else → open.

### Drawing libraries (`src/lib/`)

All drawing functions are pure — they take geometry/section parameters and return an SVG string.

| File | What it draws |
|---|---|
| `drawings.ts` | Three-view cross-section of a single member (`generateThreeViewSVG`) |
| `planDrawings.ts` | Building plan view + roof geometry side view |
| `wallSection.ts` | Wall section detail |
| `fullElevation.ts` | Full building elevation |
| `connectionDrawings.ts` | Corner post, rafter-ledger, cross-bracing details |
| `socketJointDrawing.ts` | Socket joint and fascia penetration details |
| `titleBlock.ts` | `withTitleBlock()` wrapper — adds AS1100-style title block to any SVG |

### Intelligence integration

`App.tsx` has `importIntelligenceProject()` which reads a JSON export from the Draftly Intelligence tool (a separate product). It maps `payload.boundaries`, `payload.research`, and `payload.site` fields into `ProjectConfig`, title block fields, and a `SiteConstraints` banner. The JSON schema is not defined in this repo — handle it defensively.

### Types (`src/types/`)

Key types: `ProjectConfig`, `Section`, `SectionDB`, `UtilResult`, `MemberForm` (`'open' | 'b2b' | 'rhs' | 'plate'`), `MemberForms`, `MemberOverrides`, `GableInfillResult`.

### UI

Radix UI primitives wrapped as shadcn/ui components in `src/components/ui/`. Styling is CSS variables in `App.css` (`--surface`, `--text`, `--accent` `#c9a84c` gold, `--mono` monospace font). Tailwind is available but the main layout uses plain CSS classes in `App.css`.

## Key constraints

- **Standards**: AS/NZS 4600 (cold-formed), AS4100 (structural steel), AS1720.1 (timber), AS1664 (aluminium), AS1100 (drawings).
- **Phi factors**: timber 0.85, steel/csection 0.90, aluminium 0.65.
- **Deflection limit**: span/250 (total), span/500 (live) — hardcoded in `engine.ts`.
- **LTB**: open C-sections always apply a 0.65 lateral-torsional buckling factor. Changing this or the load constants affects every member calculation.
- SVG drawings use `DM Mono` as the primary font — ensure it's referenced consistently when adding new drawing functions.
