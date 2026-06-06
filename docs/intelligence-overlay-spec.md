# Intelligence → Engineering: Overlay Research Spec

**Status:** Engineering side is built and live (consumes this today, backward-compatible).
**Action:** implement the structured overlay output in **Draftly-Intelligence** so flagged
overlays carry enough detail for Engineering to give the user accurate, actionable guidance.

This is the canonical contract. The Zod schema that enforces it lives in
`src/lib/handoffSchema.ts` (Engineering); the guidance knowledge base that consumes it lives
in `src/lib/overlays.ts`. Keep this doc in sync with both.

---

## 1. What Engineering does with overlays

When a project is imported, every entry in `research.overlays` is:

1. **Normalised** (`normalizeOverlays`) — strings and objects both become a common shape.
2. **Classified** (`classify`) — matched to a known overlay type by keyword on
   `type` → `code` → `name` (first match wins).
3. **Expanded** (`getOverlayGuidance`) into a card with: what it means, design implications,
   an ordered action plan, the standards/clauses that apply, and (where relevant) how the
   steel-frame approach already helps.

The richer the data Intelligence sends, the more specific that card becomes.

---

## 2. The overlay object (target output)

`research.overlays` is an **array** whose items may be a plain string **or** an object.
Send objects going forward:

```jsonc
{
  "name": "Bushfire Management Overlay",   // required — human-readable label
  "code": "BMO",                           // scheme code: BMO, HO, LSIO, SBO, VPO, SLO, ESO, EMO, DDO …
  "type": "bushfire",                      // canonical type (see §3) — most reliable signal for classification
  "level": "BAL-29",                       // bushfire only: BAL-LOW | BAL-12.5 | BAL-19 | BAL-29 | BAL-40 | BAL-FZ
  "requirements": [                        // specific, site-derived requirements (free text, shown as extra action steps)
    "Defendable space of 10 m to be maintained around the structure",
    "Static water supply of 10,000 L for firefighting"
  ],
  "source_url": "https://www.planning.vic.gov.au/..."  // link to the scheme/mapping the data came from
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | Display label. If omitted, Engineering falls back to `code` → `type`. |
| `code` | string | recommended | Planning-scheme code. Drives classification if `type` is absent. |
| `type` | string | **recommended** | Canonical key (§3). Most reliable classifier — set this when you can. |
| `level` | string | bushfire only | BAL rating. Surfaces in the card title and tunes the advice. |
| `requirements` | string[] | optional | Site-specific obligations; each becomes a "From council research:" action step. |
| `source_url` | string | optional | Rendered as a "council source" link on the card. |

**Backward compatible:** a plain string (e.g. `"Heritage Overlay HO123"`) still works —
Engineering classifies it by keyword. Objects are strictly better.

---

## 3. Canonical `type` values (and how strings are matched)

`type` is preferred; if absent, Engineering keyword-matches `code`/`name`. Supported keys and
the patterns that resolve to them:

| `type` | Matches (regex, case-insensitive on type/code/name) | Severity in UI |
|---|---|---|
| `bushfire` | `bushfire`, `bmo`, `bal`, `bpa` | critical |
| `heritage` | `heritage`, `ho` | caution |
| `flood` | `inundation`, `flood`, `lsio`, `sbo`, `floodway`, `fo` | critical |
| `vegetation` | `vegetation`, `vpo`, `tree` | caution |
| `landscape` | `significant landscape`, `slo` | caution |
| `environmental` | `environmental significance`, `eso` | caution |
| `erosion` | `erosion`, `emo`, `salinity` | caution |
| `design` | `design development`, `ddo` | caution |
| _anything else_ | → `other` (safe generic guidance) | info |

Sending an unknown/new overlay is safe — it renders the generic "confirm requirements with
council" card rather than failing.

---

## 4. What Intelligence should research per overlay

For each overlay found at the address, try to populate:

- **All overlays:** `name`, `code`, `type`, and a `source_url` to the mapping/scheme.
- **Bushfire (BMO):** the **BAL `level`** if determinable, plus `requirements` such as
  defendable-space distance and static water-supply volume (these come from the BMO schedule /
  bushfire planning provisions and a site assessment).
- **Heritage (HO):** the heritage place/precinct reference (put in `name`/`code`), and any
  `requirements` like "permit required for buildings and works visible from the street".
- **Flood (LSIO/SBO/FO):** the **minimum floor level / applicable flood level** and the
  **referral authority** (e.g. Melbourne Water) as `requirements`.
- **Vegetation/Landscape/Environmental:** what is protected and whether a permit is triggered.

If a value can't be found confidently, omit it — partial objects are fine and Engineering
fills the gap with general guidance.

---

## 5. Implementation notes for Draftly-Intelligence

- Where it's produced: the Kimi research path (`server/kimi.js` → `/api/kimi/research`),
  which currently returns `research.overlays`. Change that field from `string[]` to the
  object array above. See `handover_intelligence` memory for the research response shape.
- Prompt the model to return overlays as structured objects with the fields in §2, using the
  canonical `type` values in §3, and to include numeric `requirements` (defendable space,
  water supply, flood level) verbatim where the scheme states them.
- Keep emitting a `name` for every overlay even when other fields are unknown.
- No Engineering changes are required when this lands — the schema already accepts it and the
  guidance cards upgrade automatically (BAL in title, requirements appended, source linked).

---

## 6. Reference example (current sample fixture)

`sample-site-export.json` in the Engineering repo shows both forms — a fully structured BMO
(with `level` + `requirements` + `source_url`) and a plain-string heritage overlay — and is
the quickest way to see how each renders.
