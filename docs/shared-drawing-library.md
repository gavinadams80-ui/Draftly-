# Shared Drawing Library — Engineering ⇄ Drafting

**Decision (2026-06-06):** the primary integration between Draftly-Engineering and
Draftly-Drafting is a **shared drawing library** — one framework-agnostic package both
apps import — rather than a one-way file handoff. Connection details are **deferred** and
will be authored *inside this shared package* once it exists (so both apps get them at once).

## Why
- Engineering *generates* drawings parametrically; Drafting is a *vector editor*. Both need
  the same primitives: title blocks, dimensioning, section/elevation/plan generators, PDF export.
- One source = no divergence in look, scale, or title block. A connection detail drawn once
  is available in both. This is exactly why connections were deferred — build them here, once.

## Target package: `@draftly/drawings`
Pure TypeScript, **no React, no DOM** (except the PDF helper, see below). Every generator
takes plain params and returns an SVG **string**.

Modules to move out of `Draftly-Engineering/src/lib` (they are already framework-agnostic):

| Module | Notes |
|---|---|
| `titleBlock.ts` | A3 sheet + title block wrapper (`withTitleBlock`) |
| `planDrawings.ts` | building plan + roof geometry |
| `wallSection.ts` | portal-frame cross sections |
| `fullElevation.ts` | 3-panel detail elevation |
| `sideElevation.ts` | long-side elevation |
| `sitePlan.ts` | lot + structure site plan |
| `drawings.ts` | three-view member preview, gable infill |
| `connectionDrawings.ts`, `socketJointDrawing.ts` | **placeholders today** — rebuild here later |
| `drawingFrame.ts` | shared frame helpers |
| `drawingParams.ts` | parametric detail controls (currently parked at repo root — revive here) |

Also extract a **`@draftly/handoff`** package: `handoffSchema.ts` (Zod contract),
`overlays.ts`, `compliance.ts`. Both Engineering and Intelligence touch the contract, so it
should be shared too.

**Stays app-specific:** React components (`App.tsx`, `MemberCard`), Drafting's `tracer.ts`,
Engineering's `engine.ts` calcs + `sections.ts` (could be shared later as `@draftly/standards`).

**PDF export (`exportPdf.ts`):** uses the DOM (`DOMParser`, off-screen host). Keep it in the
shared package but in a separate entry (`@draftly/drawings/pdf`) so the pure generators stay
DOM-free and tree-shakeable.

## Repo structure (npm/pnpm workspaces monorepo)
```
draftly/
  package.json            # workspaces: ["packages/*", "apps/*"]
  packages/
    drawings/             # @draftly/drawings  (SVG generators + titleBlock + pdf entry)
    handoff/              # @draftly/handoff   (schema + overlays + compliance)
  apps/
    engineering/          # current Draftly-
    drafting/             # current Draftly-Drafting
    intelligence/         # current Draftly-Intelligence
```
Alternative if a monorepo is too big a step now: publish `@draftly/drawings` as a private
package, or consume it via a git submodule / `file:` dependency. Monorepo is cleanest long-term.

## How each app uses it
- **Engineering:** swap `@/lib/<drawing>` imports for `@draftly/drawings`. No behaviour change
  (the `submissionSheets` memo already centralises sheet generation — only import paths move).
- **Drafting:** import the generators to drop **parametric blocks** (title block, section,
  connection detail) onto its canvas at the right scale; use `withTitleBlock` + the pdf entry
  for output. The hand-trace tools stay in Drafting; the parametric blocks come from the lib.
- **Connection details (deferred):** build each as a generator in `@draftly/drawings` taking
  the selected member sizes; Engineering calls them for the sheet set, Drafting offers them as
  drag-in blocks. Single implementation, both surfaces.

## Migration steps (when ready)
1. Stand up the workspace (`packages/`, `apps/`); move Engineering in as `apps/engineering`.
2. Create `packages/drawings`; move the pure modules above; fix imports; Engineering builds green.
3. Create `packages/handoff`; move schema/overlays/compliance; update both Engineering & Intelligence.
4. Bring Drafting in as `apps/drafting`; wire it to `@draftly/drawings`.
5. Build the connection details (and any new shared blocks) in `packages/drawings`.

## Guardrails
- Keep generators **pure string-returning** functions — no React, no DOM in the core entry.
- One design-token source (the dark Draftly palette) shared across apps.
- Version the package; both apps pin the same version so sheets never diverge.
