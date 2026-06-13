# Draftly Monorepo — Migration Plan

**Decision (2026-06-13):** fold the four Draftly repos into **one workspace monorepo** so the
shared code is an *internal* dependency, not a pinned git tag. This kills the version-drift pain
(tag → push → re-pin both apps → fight npm cache) documented across the CLAUDE.md handovers.

This plan supersedes the migration sketch in [shared-drawing-library.md](shared-drawing-library.md)
(which proposed the same structure on 2026-06-06) with a concrete, grounded sequence.

> **Scope guardrail — "one repo" ≠ "one app".** This plan unifies the *repo*. Engineering and
> Drafting stay **separate apps** that share packages. Fusing them into a single UI is a separate,
> optional, later decision and is **not** required to fix versioning. Do not let it creep in here.

---

## Why (the problem, in one line)

Both apps pin the shared lib as a git tag:

```
Draftly-Eng/package.json            "@draftly/drawings": "github:…/Draftly-Drawings#v0.12.0"
Draftly-Drafting/client/package.json "@draftly/drawings": "github:…/Draftly-Drawings#v0.12.0"
```

…and the handover *contract* is duplicated: Engineering owns `handoffSchema.ts` / `overlays.ts` /
`compliance.ts`, but Drafting can't import them, so it hand-re-parses the payload in
`designSetImport.ts` (`readDesignSetExtras`). One contract, two codebases, synced by hand.

A workspace makes the lib `workspace:*` (no tags, no cache) and lets **both** apps import the
**same** contract package. A contract change + both consumers land in **one commit**.

---

## Target layout

```
draftly/                         # new git repo
  package.json                   # workspaces: ["packages/*", "apps/*"]
  pnpm-workspace.yaml            # (if pnpm — recommended)
  tsconfig.base.json             # shared compiler options; apps/pkgs extend it
  README.md
  packages/
    handoff/                     # @draftly/handoff  — the contract (NEW, extracted from Eng)
    drawings/                    # @draftly/drawings — SVG generators (from Draftly-Drawings)
  apps/
    engineering/                 # from Draftly-Eng
    drafting/                    # from Draftly-Drafting  (client/ flattened up; server/ kept)
    intelligence/                # from Draftly-Intelligence (Express + Kimi research server)
```

Dependency DAG (acyclic): `handoff` → (nothing) · `drawings` → `handoff` · apps → both.

---

## Decisions to lock before starting

1. **Package manager: pnpm** (recommended) over npm workspaces. pnpm's content-addressed store
   dedupes node_modules hard and its resolution is strict + fast — a direct upgrade over the npm
   cache behaviour that has bitten us. (npm workspaces also work; pnpm is the better call.)

2. **Toolchain: align DOWN onto Engineering's proven set first**, upgrade later as one isolated PR.
   - Engineering: Vite **7** · TS **5.9** · ESLint **9** · `@vitejs/plugin-react` **5**
   - Drafting:    Vite **8** · TS **~6.0** · ESLint **10** · `@vitejs/plugin-react` **6**
   - Eng carries the heavy dependency surface (all of Radix/shadcn + Tailwind). Standardise on the
     versions already proven against that surface, hoist them to the root `devDependencies`, then
     do Vite 7→8 / TS 5→6 / ESLint 9→10 as a **separate** follow-up so a toolchain bug can't be
     confused with a migration bug. Both apps are already on React 19 — no React jump needed.

3. **Consume `drawings`/`handoff` from source in dev.** Add a `"development"` export condition (or
   a Vite alias) pointing at `src/index.ts`, so editing a generator hot-reloads in the app with no
   rebuild. Keep `tsc` builds for typecheck/CI. This instant-feedback loop is the single biggest
   day-to-day win of the merge — it's the thing the tag dance was stealing.

4. **`@draftly/handoff` contents (verified low-coupling — easy extract):**
   - `handoffSchema.ts` → imports only `zod`.
   - `overlays.ts`      → imports only `./handoffSchema`.
   - `compliance.ts`    → no imports.
   - `checklist.ts`     → no imports (optional; include it).
   - **Stays in `apps/engineering`:** `designSetExport.ts` (depends on Eng's `ProjectConfig`).
   - **Move into `handoff` (optional, cleaner):** `designSet.ts` is currently in `drawings`; it's a
     pure contract. Moving it to `handoff` and having `drawings` depend on `handoff` for the
     `DesignSet` type makes the DAG read correctly. Defer if it churns too much — `drawings`
     re-exporting it also works.

---

## Migration steps

1. **Stand up `draftly/`** — new repo, root `package.json` with `workspaces`, `pnpm-workspace.yaml`,
   `tsconfig.base.json`, root `.gitignore`, `.editorconfig`.

2. **Bring the code in, preserving history** — `git subtree add --prefix=packages/drawings <url>`
   etc. for each of the four repos. (Subtree keeps the rich CLAUDE.md handover history. If history
   isn't worth the friction, a plain copy is fine and the old repos stay as read-only archives.)

3. **Flatten Drafting** — move `apps/drafting/client/*` up to `apps/drafting/`; keep `server/`
   alongside. Fix the few relative paths the flatten touches.

4. **Hoist + align dev tooling** to the root (single Vite/TS/ESLint/plugin-react version per
   decision 2). Each app keeps a thin `vite.config.ts` / `tsconfig.json` that extends the base.

5. **Repoint the lib** — change both `@draftly/drawings` deps from the github tag to `workspace:*`.
   Delete every tag/re-pin instruction from the CLAUDE.md files; the dance is gone.

6. **Extract `@draftly/handoff`** — move the four contract files in; Engineering imports flip from
   `@/lib/handoffSchema` → `@draftly/handoff`; **Drafting deletes its hand-parse** and imports the
   same schema/overlays. This is the moment the duplication dies.

7. **Install + green build** — `pnpm install`; `pnpm -r build`; run `engineering` and `drafting`
   dev servers; smoke-test a DesignSet export (Eng) → import (Drafting) round-trip.

8. **Housekeeping** — move each `CLAUDE.md` into its app/package dir; write the root `README.md`
   (how to run each app, the DAG, the "one repo ≠ one app" rule); add a root pointer in each old
   repo's README. Re-enable autosave paths if any are path-relative.

9. **Then — and only then — wire the connections pipeline** (the drill-down work). With the contract
   in one place, adding connections to the `DesignSet` is one branch across `drawings` + both apps,
   not a cross-repo tag dance. **Sequence matters: monorepo first, pipeline second.**

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Toolchain jump (Vite 7→8, TS 5→6, ESLint 9→10) | Align on Eng's proven set first; upgrade as a separate PR. |
| Radix / React 19 compat surprises | Already both on React 19; no change. |
| Drafting's Express server + Intelligence server | Keep as workspace members; add root scripts to run them. No code change. |
| Losing git history | `git subtree` merge preserves it; else archive the old repos read-only. |
| node_modules disk growth as the app grows | pnpm content-addressed store dedupes; not a repo-size problem. |

---

## On scale (why this structure is the *right* bet for a half-built app)

Current source is ~35k LOC total (Eng ~13.3k · Drafting ~14k · drawings ~7.2k · intelligence small)
— **small** by any standard. Real-world monorepos run from hundreds of thousands to millions of
lines; git and the tooling are nowhere near a wall at our scale, and won't be for years.

The limit you hit long before "the repo is too big" is **install / typecheck / build time** — a
tooling concern solved by workspace task caching (Turborepo or Nx), not a repo-size ceiling. And
the monorepo is precisely what lets the app grow without becoming one unmaintainable blob: each new
capability (modeling, electrical design, more disciplines) lands as its **own package**
— `@draftly/modeling`, `@draftly/electrical`, … — isolated, testable, independently versioned in
spirit but always in sync in practice. Growth becomes "add a package," not "swell one app."
