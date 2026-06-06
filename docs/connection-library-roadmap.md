# Connection Library & Repo Integration — Roadmap

**Status:** Proposal / discussion (2026-06-06)
**Scope:** Draftly-Drafting ⇄ Draftly-Engineering (and how the contract touches Draftly-Intelligence)
**Builds on:** [`shared-drawing-library.md`](./shared-drawing-library.md) — that doc made the core
decision (one shared, framework-agnostic drawings package). This doc extends it with the part it
explicitly *deferred*: **who authors connection details, how they become parametric, and how
Engineering pulls them into designs.**

---

## 1. The dream, in one sentence

> **Drafting becomes the place we *author* connection details by hand; the shared library *stores*
> them as parametric "cards"; Engineering *instantiates* each card with the member sizes it already
> calculated and drops it straight into the design.**

A connection detail is drawn **once**. It then appears — identical in look, scale and title block —
wherever it's needed, and it redraws itself when the member changes from a C150 to a C250.

```
  ┌─────────────┐   authors    ┌──────────────────────┐   instantiates   ┌──────────────┐
  │  DRAFTING   │ ───────────▶ │   SHARED LIBRARY     │ ───────────────▶ │ ENGINEERING  │
  │ vector edit │   a card     │  @draftly/drawings   │  card + sizes    │  sizes member│
  │ (by hand)   │              │  connection catalog  │   → SVG          │  pulls card  │
  └─────────────┘              └──────────────────────┘                  └──────────────┘
        ▲                                                                        │
        └──────────────── same blocks available to drop on the canvas ◀─────────┘
```

---

## 2. Where we are today (so we build on reality, not a blank page)

| Piece | Repo | State |
|---|---|---|
| Vector editor (hand authoring) | Draftly-Drafting | **Live.** `tracer.ts` geometry engine, SVG elements with `data-keypts`, snap/OTRACK/grips, PDF underlay, Express upload/export. |
| Parametric drawing generators | Draftly-Engineering (`Draftly-`) | **Live.** `src/lib/*` emit AS1100 SVG from member sizes: `titleBlock`, `planDrawings`, `wallSection`, `fullElevation`, `sideElevation`, `sitePlan`, `drawings`. |
| **Connection details** | Draftly-Engineering | **Live, real generators** in `connectionDrawings.ts`: corner-post/ledger, rafter→ledger, cross-bracing, ledger standoff (+ `socketJointDrawing.ts`). Each is `(Section sizes) → SVG string` with dimensioning, callouts, bolt specs, title block. |
| Drawing register (the card list) | Draftly-Engineering | **Defined.** `DRF-001 … DRF-008` in the README — corner post, rafter-ledger, brace, socket joint, fascia penetration, etc. |
| Handoff contract | Draftly-Engineering ⇄ Intelligence | **Live.** `handoffSchema.ts` (Zod, versioned `1.1.0`) validates the Intelligence → Engineering payload. |
| Shared package | — | **Not yet.** Decided in `shared-drawing-library.md`; not extracted. |

**Key insight:** the "connection library" already exists as code — it's just trapped inside one app
and authored by hand-writing SVG. The work ahead is to (a) **share** it and (b) **open authoring**
to Drafting.

---

## 3. Target architecture

Two shared packages, consumed by every app:

- **`@draftly/drawings`** — pure TypeScript, no React/DOM in the core entry. SVG-string generators:
  title block, plan/section/elevation, **and the connection catalog**. A separate `/pdf` entry holds
  the DOM-dependent export helper so the core stays tree-shakeable. *(Per the existing decision doc.)*
- **`@draftly/handoff`** — the Zod contract (`handoffSchema.ts`) + `overlays.ts` + `compliance.ts`,
  already shared with Intelligence.

New in this roadmap, living inside `@draftly/drawings`:

- **The connection catalog** — a registry of connection **cards**, each one self-describing
  (id, label, the params it needs, the standards it cites, install time, and a `render()`).

### 3.1 The connection-card contract

The "card" is the unit Engineering "pulls in." A first-cut typed shape:

```ts
// @draftly/drawings/connections
export interface ConnectionCard {
  id: string;                 // 'DRF-003-POST-01'
  label: string;              // 'Corner Post · Ledger Connection'
  category: 'post' | 'rafter' | 'brace' | 'ledger' | 'socket' | 'fascia' | string;

  /** Declares what the card needs to render — the "information" Engineering feeds in. */
  params: ConnectionParamSpec;   // member-size slots, dimensions, options (e.g. plate infill)

  /** Standards + buildability metadata that ride along into the register/BOM. */
  standards: string[];        // ['AS/NZS 4600', 'AS1100.101']
  installMinutes?: number;
  fixings?: FixingSpec[];     // e.g. 2× M12, chem anchors @600

  /** The single source of truth for the picture. params in → SVG string out. */
  render(params: ConnectionParams): string;
}
```

`render` is *exactly* today's `generateCornerPostSVG(ledgerSec, postSec)` — wrapped so it advertises
its inputs instead of hiding them in a function signature. Engineering already has the member
`Section`s; it passes them as `params` and gets the sheet-ready SVG back.

### 3.2 Two authoring models (the one real design decision)

The hard part is bridging **hand-drawn** (Drafting) and **parametric** (Engineering). A detail
Engineering wires in can't be a flat picture — it must redraw for a different member. Two routes,
and they're an **evolution, not a fork**:

**Model A — Code-authored generators (the bridge, ship in days).**
Connections stay TS functions in `@draftly/drawings` (today's `connectionDrawings.ts`, moved). Drafting
*consumes* them as drag-in blocks; both apps render identically. Drafting "helps build" the library by
being where we prototype the look, which a dev then codifies into a generator.
- ✅ Almost free — the generators already exist and work.
- ✅ Fully parametric immediately (they already take `Section` sizes).
- ❌ Authoring still requires a developer to translate a hand drawing into code.

**Model B — Data-driven templates (the premium dream).**
A connection becomes a **declarative template**: geometry with *named parametric drivers*
(member-size refs, dimensions) + anchor points, rendered by one shared `renderTemplate(template, params)`.
Drafting becomes a true visual editor that **exports these templates**; Engineering instantiates them.
This is "draw it by hand → it becomes a real engineering object."
- ✅ Non-developers author real, parametric details in Drafting.
- ✅ One renderer, infinite details, no code per connection.
- ❌ Real work: we're defining a small parametric format (drivers, constraints, callout binding) and a
  Drafting export path + an Engineering instantiation path.

**Recommended sequence:** ship Model A to make the shared library physically real, define the template
format alongside, then migrate connections to Model B one card at a time. Both can coexist behind the
same `ConnectionCard.render()` interface — A cards render via code, B cards render via the template engine.

---

## 4. Repo coupling — pros & cons of all three

The shared package can be delivered three ways. None is wrong; they trade *upfront cost* against
*long-term cohesion*.

### Option 1 — Monorepo (`packages/*` + `apps/*`) — the existing doc's plan
One workspace; Engineering, Drafting, Intelligence become `apps/*`; shared code is `packages/*`.

| Pros | Cons |
|---|---|
| **Single source of truth** — one version, sheets can never diverge. | **Biggest upfront restructure** — move 3 repos, rewire CI/Vercel deploys. |
| **Atomic cross-app changes** — change the card contract + both consumers in one PR. | Vercel/deploy config must learn to build the right app per project. |
| No publish/version dance during fast iteration — apps import workspace packages directly. | Larger clone; contributors see everything (can be noise). |
| Easiest place to enforce one design-token palette + shared lint/tsconfig. | Git history of 3 repos has to be merged or restarted. |

**Best when:** the team is small/aligned and the apps genuinely move together (they do — a card
contract change ripples to all three).

### Option 2 — Shared package, separate repos (publish `@draftly/drawings`)
Keep all repos; publish the package privately (npm registry or GitHub Packages) and depend on it.

| Pros | Cons |
|---|---|
| **Lightest adoption** — repos stay as-is; just add a dependency. | **Version friction** — every library change = publish + bump + install in each consumer. |
| Clean public API boundary forces good package hygiene. | **Easy to drift** — apps can pin different versions → sheets diverge (the exact risk the lib exists to kill). |
| Independent deploys keep working untouched. | Slow inner loop (publish to test a change) unless you wire `npm link`/`file:` locally. |
| Access control per repo if that ever matters. | Cross-cutting changes span multiple PRs across repos — no atomic change. |

**Best when:** you need to disturb the existing repos/deploys as little as possible right now.

### Option 3 — Hybrid: shared package now, graduate to monorepo later
Start as Option 2 (or a `git` submodule / `file:` dep) to prove the library, then fold the repos into a
monorepo once the contract has stabilised.

| Pros | Cons |
|---|---|
| **Lowest risk path to value** — get the library live without the big restructure. | **You pay some migration cost twice** — set up packaging now, then move into the monorepo later. |
| Validates the card contract before committing to structure. | Interim period carries Option 2's drift risk (mitigate by pinning one version). |
| Natural decision point: graduate only if/when the coupling pain shows up. | Requires discipline to actually graduate rather than living in limbo. |

**Best when:** (likely us) the dream is clear but we want one proof point before a structural commit.

**A pragmatic mitigation for Options 2/3:** use a **`file:`/workspace path or git submodule** during
development so the inner loop stays fast (no publish to test), and pin a single version in all
consumers so sheets can't drift while separate.

> **Decision still open** — captured here for the team to choose. The phased roadmap below is written
> so Phase 1 is *identical* regardless of which coupling we pick; the choice only changes *where the
> package physically lives*.

---

## 5. Phased roadmap

**Phase 0 — Align (this doc).** Agree the loop, the card contract shape, Model A→B sequence, and the
coupling option.

**Phase 1 — Make the shared library real (Model A).**
1. Create `@draftly/drawings` (location per the coupling choice).
2. Move the pure generators out of Engineering: `titleBlock`, `connectionDrawings`, `socketJointDrawing`,
   `drawingFrame`, plan/section/elevation, `drawings`, and revive `drawingParams.ts`. Engineering swaps
   `@/lib/*` imports for `@draftly/drawings` — **no behaviour change** (the `submissionSheets` memo already
   centralises sheet generation; only import paths move).
3. Wrap each connection generator as a `ConnectionCard` and register them in a catalog.
4. Wire Drafting to import the catalog and drop cards onto the canvas as parametric blocks at correct scale.

**Phase 2 — Engineering "pulls the card in."**
5. Member cards in Engineering gain a *"add connection detail"* action that instantiates the matching
   `ConnectionCard` with the already-calculated `Section`s and appends it to the sheet set + drawing register.

**Phase 3 — Open authoring in Drafting (Model B).**
6. Define the connection-template format (drivers, anchors, callout binding).
7. Drafting export: turn a hand-drawn detail into a template (named dimension drivers, member slots).
8. `renderTemplate()` in `@draftly/drawings`; migrate one connection (e.g. corner post) end-to-end as the
   proof, then the rest card-by-card.

**Phase 4 — Catalog hygiene.** Versioning, one design-token palette, the drawing register auto-built from
the catalog, BOM/install-time rollups from card metadata.

---

## 6. Open questions / risks

- **Template expressiveness (Model B):** how much geometry logic (birdsmouth cuts, hatching, conditional
  plate infill) can be declarative vs. needs an escape hatch back to code? Likely a hybrid: declarative
  geometry + optional code "stamps."
- **Units & scale:** Drafting works in px with a calibration (`unitsPerPx`); Engineering works in mm at a
  fixed plot scale. The card contract must normalise to mm so a block lands at true scale on either surface.
- **Design tokens:** both apps already use the dark Draftly palette — extract it once into the package so
  colours/typography can't drift.
- **Title-block data:** comes from project context (Engineering has it; Drafting may not). Cards should take
  title-block data as a param, not bake it in.
- **Drafting is React 18, Engineering React 19:** fine — the shared package is framework-agnostic, so this
  never matters at the boundary.

---

## 7. TL;DR for the team

The dream is ~70% pre-built: real connection generators exist, the shared-package decision is made, and the
handoff contract is live. To finish it we: **(1)** extract `@draftly/drawings` and move the generators in
(Model A — fast, no behaviour change), **(2)** let Engineering pull cards in with live member sizes, then
**(3)** open visual authoring in Drafting via declarative templates (Model B). Coupling (monorepo vs shared
package vs hybrid) is the one open call — Phase 1 is the same either way.
