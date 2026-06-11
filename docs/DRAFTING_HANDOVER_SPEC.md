# Drafting Handover Spec — DesignSet contract & progressive checklist

**Scope:** how the **Drafting** app consumes the `.designset.json` handed over by
Draftly‑Engineering, and how it **writes back** so the progressive job checklist
keeps its state through to certification. This document lives in the Engineering
repo (the producer); implement the Drafting side against it.

Producer: `Draftly-Engineering/src/lib/designSetExport.ts` →
`buildDesignSetJSON()`. Re‑import (handback): `designSetReview.ts` →
`readDesignSetForReview()`.

---

## 1. What Drafting receives (`.designset.json`)

Serialized via the shared `@draftly/drawings` `serializeDesignSet()`. Shape
(lengths in **mm** unless noted):

```jsonc
{
  "project":  { /* TitleBlockData: projectName, address, council, clientName, date, ... */ },
  "geometry": {
    "structureType": "patio", "roofType": "gable|skillion",
    "attachment": "freestanding|attached|three-side",
    "width": 8970, "depth": 5770, "height": 2700, "pitch": 10,
    "portalFrameCount": 3, "standoff": 150,
    "setbacks": { "left": 0, "right": 1800 },
    "northRotation": 0, "cladding": "poly-twin-10",
    "ridgeAxis": "width|depth",            // optional — from Intelligence layout
    "attachedSides": ["back","left","right"] // optional — per-side attachment
  },
  "members": [
    // role ∈ rafter|post|purlin|ledger|fascia|gableChord|gableDropper
    { "id": "m-post", "role": "post", "section": "C20015", "d": 203, "b": 76, "t": 1.5,
      "check": { "pass": true, "note": "62% utilisation" } }  // ← real status (see §4)
  ],
  "results": {
    "purlinSpacing": 1350,
    "eaveHeight": 2700, "gutterHeight": 2750, "fasciaHeight": 2700, "ridgeHeight": 3300,
    "existingGutterOverhangMm": 300,
    "drainage":   { /* water services — see §5 */ },
    "siteNotes": "…",
    "planning":   { "requiredSetbacks": {...}, "provisionalSetbacks": {...}, "maxHeight": 5, "siteCoverage": 50 },
    "ridgeBearing": 92.0,
    "connection": { "sides": {...}, "lengths": {...} },
    "electrical":  { /* lighting/electrical scope — see ELECTRICAL_LIGHTING_SCOPE.md */ },
    "readiness":  { /* progressive checklist — see §3 */ }
  },
  "loads":    { "windUltimateKpa": 0.74 },
  "schedule": { "currency": "AUD", "ratePerKg": 6.5, "totalKg": 0, "totalCost": 0, "lines": [ ... ] }
}
```

Drafting **must not drop unknown keys** when it re‑serialises for the handback —
`results.readiness`, `results.drainage`, `geometry.ridgeAxis/attachedSides` are
carried as data and have to survive the round‑trip.

---

## 2. The handback (Drafting → Engineering)

Drafting returns the **same `.designset.json`**, optionally with:
- amended `members[].section` (if a draughtsperson re‑selected a size), and
- updated `results.readiness.items` (its stage ticks — see §3).

Engineering's `readDesignSetForReview()` maps geometry→`ProjectConfig`,
`members`→section overrides (so the calc **re‑runs and re‑checks** the returned
design), and reads `results.readiness.items` back to **merge** Drafting's ticks
into the live checklist. Engineering owns the recompute; Drafting never asserts a
member pass — it proposes a section, Engineering's engine is the judge.

---

## 3. Progressive checklist contract (`results.readiness`)

One checklist spans the whole pipeline and **auto‑ticks** as data arrives. Each
app owns its stages and writes only its own item ids; ticks travel in the
designset so the list keeps state across the boundary.

```jsonc
"readiness": {
  "percent": 62,                 // producer's overall % at export (informational)
  "readyForHandover": true,      // Engineering stages 1–2 complete
  "items": [ { "id": "si-address", "status": "done" }, ... ]  // id + status only
}
```

`status ∈ "done" | "todo" | "na"`. Item ids and ownership:

| id | Stage | Label | Owner (sets status) |
|---|---|---|---|
| `si-address` | Site Intelligence | Site address & lot identified | Intelligence → Engineering |
| `si-lot` | Site Intelligence | Lot boundary geometry | Intelligence → Engineering |
| `si-planning` | Site Intelligence | Planning rules (council, zone, height) | Intelligence → Engineering |
| `si-setbacks` | Site Intelligence | Setbacks / offsets recorded | Intelligence → Engineering |
| `si-heights` | Site Intelligence | Set‑out heights carried (gutter/ridge) | Intelligence → Engineering |
| `si-attachment` | Site Intelligence | Per‑side dwelling attachment captured | Intelligence → Engineering |
| `si-overlays` | Site Intelligence | Site overlays identified | Intelligence → Engineering |
| `si-water` | Site Intelligence | Water services / stormwater sized | Intelligence → Engineering |
| `si-compliance` | Site Intelligence | Siting compliance verdict recorded | Intelligence → Engineering |
| `en-dims` | Engineering | Structure dimensions confirmed | Engineering |
| `en-wind` | Engineering | Design wind pressure set | Engineering |
| `en-members` | Engineering | All structural members pass | Engineering |
| `en-lateral` | Engineering | Lateral stability / bracing designed | Engineering |
| `en-compliance` | Engineering | As‑engineered compliance clear | Engineering |
| `en-comps` | Engineering | Structural computations generated | Engineering |
| `dr-drawings` | **Drafting** | Drawing set generated | **Drafting** |
| `dr-connections` | **Drafting** | Connection details finalised | **Drafting** |
| `dr-footings` | **Drafting** | Footing / slab detail finalised | **Drafting** |
| `dr-drainage` | **Drafting** | Drainage layout finalised | **Drafting** |
| `dr-electrical` | **Drafting** | Electrical / lighting layout drawn | **Drafting** *(only when lighting in scope)* |
| `ce-print` | **Certification** | Final print issued | **Drafting** |
| `ce-surveyor` | **Certification** | Surveyor sign‑off | **Drafting** |
| `ce-engineer` | **Certification** | Engineer certification | **Drafting** |
| `ce-electrical` | **Certification** | Electrical safety certificate (CES/CCEW) | **Drafting / electrician** *(only when lighting in scope)* |

`dr-electrical` and `ce-electrical` are `na` (not required) when no lighting is in
scope. See `docs/ELECTRICAL_LIGHTING_SCOPE.md`.

**Drafting's job:** present the four items it owns (`dr-*`) plus the three
certification items (`ce-*`); set each to `done` as the draughtsperson completes
it; write them back into `results.readiness.items` on export. Don't touch `si-*`
or `en-*` — Engineering recomputes those. Unknown/extra ids must be preserved.

**Issue gate (soft):** the job is "ready to issue" only when every **required**
item is `done`/`na`. Final print + send‑to‑surveyor/engineer is the last stage —
warn on outstanding items but allow the user to proceed (override), matching
Engineering's soft gate.

**Adding items:** new ids are additive. An app that doesn't recognise an id must
pass it through untouched. Bump the handoff/lib version when the canonical id
list changes and keep this table in sync across the three repos.

---

## 4. Member status (fixed)

`members[].check.pass` now carries the **real** per‑member result from the calc
engine (previously hard‑coded `true`), with `check.note` = utilisation, e.g.
`"62% utilisation"`. Drafting may display this but must not author it — on
handback, Engineering re‑runs the engine and overwrites `check` from the live
calc.

---

## 5. Water services / drainage — two carriers (lossless)

Engineering now emits **both** under `results`:

**`drainage`** — conforms to the lib's `DesignDrainage` so Drafting's existing
consumer keeps working (reduced summary):

```jsonc
"drainage": {
  "designIntensityMmHr": 0, "aepPercent": 0,
  "totalCatchmentAreaM2": 0, "anyOverCapacity": false,
  "downpipes": [ { "label": "DP1", "capacityLs": 0, "servesM2": 0 } ]
}
```

**`drainageDetail`** — the **lossless** set carrying the storm definition + the
per‑downpipe sizing (the fields `DesignDrainage` has no room for). **Drafting's
drainage sheet should read this one.**

```jsonc
"drainageDetail": {
  "designRainfall": { "intensityMmHr": 0, "aepPercent": 0, "durationMin": 0, "source": "BoM IFD …" },
  "totalCatchmentAreaM2": 0, "anyOverCapacity": false, "notes": "",
  "dischargePoints": [
    { "index": 1, "downpipe": "DP1", "downpipeCapacityLs": 0, "servesM2": 0, "maxRoofM2": 0, "overCapacity": false }
  ]
}
```

Both are populated from the Intelligence handoff (`boundaries.stormwater` /
`engineeringPackage.stormwater`). ⚠ **Pre‑condition:** the current sample handoff
contains **no** stormwater — confirm Intelligence emits it under those keys with
the `StormwaterSchema` shape, or it arrives empty (see
`docs/WATER_SERVICES_REVIEW.md`).

---

## 6. Versioning

`buildDesignSetJSON()` stamps `{ by: 'Draftly-Engineering', libVersion }`. Treat
this spec as **v1**. Any change to the id list, the drainage shape, or the
geometry keys is a breaking change — bump the lib/handoff version and update this
doc + the matching contract in Intelligence and Drafting.
