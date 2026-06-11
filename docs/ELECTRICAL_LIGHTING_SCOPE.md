# Electrical / Lighting — process, legal requirements, scope & documentation

**Purpose:** map how lighting (and any electrical) is added to a Draftly structure
— who is legally allowed to do it, what standards apply, how it flows through the
Intelligence → Engineering → Drafting → Certification pipeline (the same pattern
as water services), the scope of work, and the documentation required.

> ⚠ **Not legal/electrical advice.** Electrical licensing and certification are
> **state‑based** in Australia and change over time. Everything below must be
> confirmed with a **licensed electrician** and the relevant state electrical
> safety regulator before it is relied on. Treat the standard/regulator
> references as the *starting point*, not the final word.

---

## 1. Who is legally allowed to do it

- **Fixed/240 V electrical work must be done by a licensed/registered
  electrician.** DIY fixed wiring is illegal in every Australian state. The
  builder, draughtsperson and structural engineer **do not** design or install it
  and **do not** certify it.
- Licensing is per state, e.g. **VIC** Energy Safe Victoria (ESV) · **NSW** Fair
  Trading · **QLD** Electrical Safety Office · **SA/WA/TAS** their equivalents.
- **Extra‑low voltage (ELV)** feature/garden lighting (≤ 50 V AC / 120 V ripple‑
  free DC, e.g. 12 V LED on a plug‑in transformer) — the ELV side can often be
  installed by others, **but the 240 V supply / transformer connection still needs
  a licensed electrician.** Confirm per state.

## 2. Standards that apply

| Standard | Covers |
|---|---|
| **AS/NZS 3000** (Wiring Rules) | The core installation standard — circuits, protection, RCDs, isolation, earthing. |
| **AS/NZS 3008** | Cable selection / current‑carrying capacity & voltage drop. |
| **AS/NZS 3018** (or state guide) | Domestic installation practice. |
| **AS/NZS 3019** | Periodic verification / testing of installations. |
| **AS/NZS 1680** | Interior / workplace lighting design (if the space is a workspace). |
| **AS 4282** | Control of the obtrusive effects of **outdoor** lighting (light spill to neighbours — relevant in some overlays/zones). |
| **IP rating (AS 60529)** | Ingress protection of fittings — outdoor/exposed luminaires need a suitable IP (e.g. **IP44+** exposed, higher near water). |

Key AS/NZS 3000 points for a patio/carport/shed: **RCD protection** on lighting
and socket‑outlet circuits; weatherproof, UV‑stable, correctly‑IP‑rated fittings
outdoors; correct isolation/switchboard arrangement when tying into the existing
dwelling supply.

## 3. Planning / building approval

- Lighting itself **usually needs no planning approval**, but **AS 4282** (light
  spill) can apply in some zones/overlays, and **heritage/environmental overlays**
  may restrict fittings — this is exactly the kind of constraint Intelligence
  already captures (overlays), so it should drive an electrical flag.
- The electrical work is **self‑certified by the electrician** via the state
  certificate (below) — it is generally **not** signed off by the building
  surveyor, though the surveyor/relevant‑authority may require the certificate as
  part of the occupancy/final.

## 4. How it maps to the pipeline (same pattern as water services)

| Stage | What it handles | Owner |
|---|---|---|
| **Site Intelligence** | Capture the **lighting intent/scope** (what the client wants), the **existing supply** (switchboard spare capacity, single/three‑phase, meter), and any **overlay/zone constraint** (AS 4282 light spill, heritage). | Intelligence |
| **Engineering** *(this app)* | **Not** electrical design — but the structure must **accommodate** it: luminaire fixing points on the steel, cable penetrations/conduit routes, an allowance for fitting + cable dead load (negligible, but stated), and not blocking the electrician's route. Carry the electrical scope through the handoff untouched. | Engineering |
| **Drafting** | Produce the **electrical layout sheet** — luminaire / switch / GPO positions, circuit grouping, a legend, and notes citing AS/NZS 3000 + "all electrical work by a licensed electrician; CES/CCEW required". | Drafting |
| **Certification** | The **licensed electrician** designs the circuits, installs, tests and issues the **electrical safety certificate** (state‑specific, §6). This is a **separate certifier** from the structural engineer and surveyor. | Electrician |

## 5. Scope of work (what the electrician delivers)

1. **Design** — circuit layout, cable sizing (AS/NZS 3008), protection (MCB/RCD),
   switchboard/sub‑board arrangement, luminaire selection (IP‑rated for location,
   lumen/lux to suit), switching/control (manual, sensor, timer).
2. **Supply** — connect to the existing dwelling board or a new sub‑board; confirm
   spare capacity / upgrade if needed; isolation + labelling.
3. **Install** — fix luminaires to the structure at the provided points, run
   cabling in suitable enclosures, weatherproof outdoor penetrations.
4. **Test & verify** — insulation resistance, earth continuity, polarity, **RCD
   trip test**, per AS/NZS 3000/3019.
5. **Certify** — issue the state electrical safety certificate (§6) and as‑installed
   info.

## 6. Documentation required

- **Electrical layout / lighting plan** (Drafting) — positions, circuits, legend,
  switching, AS references, "licensed electrician + certificate required" note.
- **Circuit / load schedule** and **switchboard schedule** (electrician).
- **Cable sizing & voltage‑drop calc** (AS/NZS 3008) where required.
- **Test results** (insulation resistance, earth continuity, RCD trip).
- **State electrical safety certificate** — the legal sign‑off, e.g.:
  - **VIC**: Certificate of Electrical Safety (CES) via ESV (+ prescribed/​non‑
    prescribed inspection where applicable).
  - **NSW**: Certificate of Compliance — Electrical Work (CCEW).
  - **QLD**: Certificate of Testing & Safety / electrical work request as required.
  - *(other states: their equivalent — confirm.)*
- **As‑installed** mark‑up if the layout changed on site.

## 7. Proposed wiring into Draftly (mirrors the water‑services pattern)

To carry electrical/lighting the same lossless way water now is:

1. **Handoff schema** — add an `electrical` block to `handoffSchema.ts`, e.g.:
   ```jsonc
   "electrical": {
     "scope": "feature + task lighting to patio",
     "supply": { "phases": 1, "existingBoardSpareWays": 2, "needsUpgrade": false },
     "luminaires": [ { "type": "LED batten", "ip": "IP65", "qty": 4, "location": "rafters", "control": "wall switch" } ],
     "gpos": [ { "qty": 1, "ip": "IP53", "location": "post" } ],
     "lightSpillConstraint": false,        // AS 4282 / overlay-driven
     "standardsNote": "All work by licensed electrician to AS/NZS 3000; CES/CCEW required.",
     "notes": ""
   }
   ```
2. **Engineering** — carry it through `siteConstraints.electrical` → the designset
   `results.electrical` (lossless, like `drainageDetail`); add structural
   provisions (fixing points / penetrations) as needed.
3. **Checklist** — add items mirroring water:
   - `si-electrical` (Site Intelligence) — *Lighting/electrical scope captured* —
     auto‑ticks when an `electrical` block is present.
   - `dr-electrical` (Drafting) — *Electrical layout drawn*.
   - `ce-electrical` (Certification) — ***Electrical safety certificate issued*** —
     the licensed electrician's sign‑off, alongside surveyor + engineer.
4. **Drafting** — the electrical layout sheet + the mandatory "licensed electrician
   / certificate required" notes.

This keeps the **legal reality front‑and‑centre**: Draftly *documents and
coordinates* the lighting, but the licensed electrician *designs, installs and
certifies* it, and that certificate is a tracked, required item before the job is
"issued".

---

## 8. Open items / to confirm

- Confirm the **per‑state certificate** names + when inspection is mandatory.
- Confirm whether the **building surveyor** requires the electrical certificate at
  final/occupancy for the relevant structure class.
- Decide how much **electrical design** (if any) Draftly should attempt vs leave
  wholly to the electrician — recommendation: **document + coordinate only**, never
  auto‑design circuits.
- Wire the schema/checklist/sheet items in §7 once the scope is agreed (none built
  yet — this doc is the map/scope you asked for).
