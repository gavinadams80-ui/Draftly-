# Water Services / Stormwater — handover review

**Question:** does the stormwater/water‑services work done in Intelligence make
it into Engineering (and on to Drafting)?

**Short answer:** a path exists, but it is **lossy**, **barely surfaced**, and on
the current sample handoff it carries **nothing at all**. The user's suspicion is
well founded.

---

## The path that exists

`Intelligence export` → `handoffSchema.ts StormwaterSchema` → `App.tsx` import
(`swSummary`) → `siteConstraints.stormwater` → `designSetExport.ts` `drainage`
block → Drafting.

- **Schema (`handoffSchema.ts`)** reads stormwater from
  `engineeringPackage.stormwater` **or** `boundaries.stormwater`, and defines a
  fairly complete shape: `designRainfall {intensityMmHr, aepPercent, durationMin,
  source}`, `dischargePoints[] {index, downpipe, downpipeCapacityLs, servesM2,
  maxRoofM2, overCapacity}`, `totalCatchmentAreaM2`, `anyOverCapacity`, `notes`.
- **Import (`App.tsx` ~469)** collapses that into `swSummary` and stores it on
  `siteConstraints.stormwater`.
- **Display:** a single `Chip` (`App.tsx` ~1296) — `"Stormwater: N × DP"` with an
  over‑capacity warning. No detail, no review table, no calc.
- **Handover (`designSetExport.ts` ~153)** emits `results.drainage` from that
  summary.

## Finding 1 — the mapping is lossy

Even when Intelligence sends the full schema, Engineering keeps only part of it.

| Field Intelligence computes | Reaches Engineering? | Reaches Drafting? |
|---|---|---|
| `designRainfall.intensityMmHr` | ✅ | ✅ |
| `designRainfall.aepPercent` | ✅ | ✅ |
| `designRainfall.durationMin` | ❌ dropped | ❌ |
| `designRainfall.source` (IFD/ARI reference) | ❌ dropped | ❌ |
| `totalCatchmentAreaM2` | ✅ | ✅ |
| `anyOverCapacity` (aggregate) | ✅ | ✅ |
| per‑downpipe `label`/`downpipe` | ✅ | ✅ |
| per‑downpipe `downpipeCapacityLs` | ✅ | ✅ |
| per‑downpipe `servesM2` | ✅ | ✅ |
| per‑downpipe `maxRoofM2` | ❌ dropped | ❌ |
| per‑downpipe `overCapacity` (which DP) | ❌ dropped | ❌ |
| discharge‑point `index` | ❌ dropped | ❌ |
| `notes` | ❌ dropped | ❌ |

So the **storm definition** (duration + source) and the **per‑downpipe sizing
rationale** — the "quite a bit of work" — are discarded. `SiteConstraints.stormwater`
(`App.tsx` ~262) simply has no fields for them, and the same reduced set is what
goes to Drafting.

## Finding 2 — the sample handoff carries no stormwater at all

`sample-site-export.json` has **`boundaries.stormwater` = undefined**,
**`engineeringPackage.stormwater` = undefined**, and no water keys under
`research` or top‑level. So with the export we actually have, Engineering
receives **zero** water‑services data.

Two possibilities (cannot be resolved from this repo alone — needs the live
Intelligence output):
1. **Stale sample** — predates the water‑services feature; or
2. **Key/shape mismatch** — Intelligence emits water services under a different
   key (e.g. `research.stormwater`, a `services`/`water` object, or a different
   field layout) than the two keys the schema reads. Because Zod `.partial()`
   silently ignores unknown keys, a mismatch is **dropped without error** — which
   would exactly match "I don't believe it gets handed on."

**Action:** capture a real Intelligence export that includes the water‑services
work and diff its stormwater structure against `StormwaterSchema`. If the key or
shape differs, the schema/import is where to fix it.

## Finding 3 — it isn't tracked or surfaced

- No **checklist** item for water services (the new readiness checklist has
  `dr-drainage` for Drafting's *layout*, but nothing for "stormwater sized /
  received from Intelligence"). So a reviewer can't even see whether it arrived.
- No **computations‑sheet** row and no **compliance** consideration.
- Only the one chip in the site banner.

---

## Recommended fixes (Engineering scope)

1. **Make the pass‑through lossless.** Widen `SiteConstraints.stormwater` and the
   `swSummary` map to keep `durationMin`, `source`, per‑downpipe `maxRoofM2` +
   `overCapacity`, and `notes`; emit the **full `dischargePoints` shape** in
   `results.drainage` (see the target shape in the Drafting spec §5).
2. **Add a `si-water` checklist item** — auto‑ticks when stormwater data is
   present, so "received from Intelligence" is visible and gated.
3. **Surface a small drainage summary** in the site panel (intensity/AEP/source,
   per‑DP capacity vs serves, over‑capacity flags) and a row on the computations
   sheet.
4. **Verify the Intelligence emission key/shape** against `StormwaterSchema`
   (cross‑repo) — the most likely root cause of "nothing arrives".

Items 1–3 are local, low‑risk, and unblock Drafting's drainage sheet; item 4 is
the cross‑repo confirmation that the data is being emitted where Engineering looks.
