# Parametric Member Blocks & Design-Set Round-Trip — Roadmap

**Status:** Proposal / discussion (2026-06-07)
**Scope:** Draftly-Drafting (the editor) ⇄ Draftly-Engineering (the calc model)
**Builds on:** [`shared-drawing-library.md`](./shared-drawing-library.md),
[`connection-library-roadmap.md`](./connection-library-roadmap.md), and the existing
`src/lib/handoffSchema.ts` contract. Schema sketch: [`src/lib/designSet.ts`](../src/lib/designSet.ts).

---

## 1. The dream, in one sentence

> **Drafting becomes a parametric structural editor: you search the section/material catalogue,
> drop an editable member block (e.g. RHS 100×50×3 side profile) onto a project sheet, draw/trim/
> miter/rotate it with grips like any CAD block — and every block stays linked to Engineering's
> calculation for that member, so the design set rounds back and updates the engineering.**

A drawn block is not "dumb geometry" — it's a **smart block** that knows it's an RHS 100×50×3 acting
as a rafter, and carries the identity needed to round-trip.

```
  ENGINEERING                      SHARED CONTRACT                    DRAFTING
  sizes members  ──DesignSet──▶  MemberInstance[] + Joint[]  ──▶  editable blocks on sheets
       ▲                          (mm, stable ids)                  draw / trim / miter / grips
       │                                                                    │
       └──────── re-run calc ◀── drawn geometry (lengths, angles, joints) ◀─┘
                 (cells update)        upload DesignSet back
```

---

## 2. Core concept: a block = geometry + identity + data

Today a Drafting element is **geometry only** (`data-keypts`). To do this, every block carries three
layers of information:

1. **Geometry** — how it's drawn (already exists).
2. **Semantic/data** — *what it is*: the member, its section, role, form, view.
3. **Link** — *which Engineering calc cell it's bound to*, so edits round-trip.

### Two senses of "layer" — we need both
- **CAD layers** (organise the drawing): `grid`, `members`, `dimensions`, `annotations`, `hidden`,
  `connections` — each with visibility/lock. Drafting is currently flat; this is new.
- **Data layers** (metadata per block): the fields in §3.

---

## 3. The data model

Defined as a versioned, Zod-validated contract in
[`src/lib/designSet.ts`](../src/lib/designSet.ts) (mirrors `handoffSchema.ts` conventions).

- **`MemberInstance`** — one placed member: `id` (stable UUID), `section`, `role`, `form`, `view`,
  `geometry` (anchor/direction/`lengthMm`/rotation/miters — **all mm**), `layer`, `endpoints`
  (joint refs), `engineering` (designId / memberId / `sourceOfTruth`), `overrides`.
- **`Joint`** — a connection between member ends: `members[]`, `point`, optional
  `connectionCardId` → links straight to the `@draftly/drawings` ConnectionCard catalogue (DRF-…).
- **`SheetLayout`** — your "project sheet template": `view`, `scale`, `memberIds[]`, `order`.
  Add/remove members or sheets at any time, like the PDF underlay.
- **`DesignSet`** — the round-trip envelope: `version`, `sourceDesignId`, `sheets[]`, `members[]`,
  `joints[]`, `sectionsUsed[]` (self-contained, opens without the DB).

`parseDesignSet()` validates on import (never throws); `mergeById()` makes a re-import update members
in place instead of duplicating.

---

## 4. Connecting to Engineering "cells" (the round-trip)

The linchpin is the **stable `id`** + a **field-ownership rule** (`sourceOfTruth`):

- **Engineering → Drafting:** Engineering sizes members → emits a `DesignSet` (`sourceOfTruth:
  'engineering'`). Drafting renders each as an editable block via `@draftly/drawings`.
- **Drafting → Engineering:** you draw/trim/extend. `lengthMm`, angles and joint positions are now
  *measured facts*. On upload, Engineering matches by `id`, reads geometry back into its calc inputs
  (length → span → bending/deflection check; joint positions → reactions), **re-runs sizing**, and
  pushes updated sections back down (which re-render the blocks).
- **Conflicts:** when a drawn value disagrees with the engineered assumption, `sourceOfTruth` +
  `overrides` make it a *detected* conflict ("this rafter is now 4.2 m — recheck"), not silent drift.

"Engineering cells" = its calc inputs/outputs. The connector is a **mapping function**
`DesignSet.members[] → ProjectConfig/member inputs`, keyed by `id`, with an ID-merge.

---

## 5. What we need to build

| Piece | Where | Status |
|---|---|---|
| Member-profile block renderer (`section + view + length → editable SVG`) | `@draftly/drawings` | **mostly exists** — `generateThreeViewSVG` draws profiles; generalise to one editable profile per view |
| Searchable section/material catalogue ("database" of cards) | shared (`@draftly/data`) | Engineering `SectionDB` exists — promote + make queryable |
| Saved plan/side/section drawings, searchable | shared + a store | generators exist; add naming/indexing |
| Smart-block metadata on canvas (`data-member-id`, `data-section`, `data-role`, `data-view`, `data-layer`) | Drafting `tracer.ts` | extend existing `data-*` pattern |
| CAD layer system (named, visibility, lock) | Drafting | new (currently flat) |
| Assembly/joint model | shared schema | **sketched** — `designSet.ts` |
| `DesignSet` round-trip schema + validation | shared schema | **sketched** — `designSet.ts` |
| Engineering connector (DesignSet ↔ calc cells, id-keyed merge) | Engineering | new |

---

## 6. The genuinely hard parts
1. **Multi-view consistency** — same member in plan/side/section must stay in sync. Start simple:
   views are independent layouts that *reference* one `MemberInstance` (one truth, many drawings) —
   not full 3D auto-projection.
2. **Units** — store **mm** in metadata; px is display only (same rule as connection cards).
3. **Reconciliation** — `sourceOfTruth` + `overrides` decide who wins when drawn ≠ engineered.
4. **Identity stability** — never lose `id` through trim/mirror/copy. Copy = new id; trim/extend =
   same id. This is the linchpin of the round-trip.

---

## 7. Smallest first slice (prove the loop)
One member, one view, full round-trip:
Engineering sizes a single rafter → exports a `DesignSet` with one `MemberInstance` → Drafting drops
it as an editable RHS side-profile block with grips → you change its length → upload → Engineering
reads the new length back into its rafter calc and re-checks. If that loop works for one member,
the rest is repetition.

---

## 8. Guardrails (consistent with the shared-package rules)
- Contract is **versioned + additive-by-default** (`DESIGN_SET_VERSION`); validate on import.
- Geometry crosses the boundary in **mm only**.
- The schema is **pure data** — no React/DOM; lives in `@draftly/handoff`/`@draftly/drawings` once
  the shared repo is in session scope (parked in `src/lib/designSet.ts` next to `handoffSchema.ts`
  until then; keep in sync if duplicated).
- Block **rendering** lives in `@draftly/drawings`; block **editing** stays in Drafting.
