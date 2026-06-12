// ── Draftly Intelligence → Engineering handoff contract ──
// Single source of truth for the `projectData` payload that Draftly-Intelligence
// exports (see Draftly-Intelligence/client/js/app.js → exportProject / sSaveSitingToProject).
// Validated with Zod on import so a malformed/partial file fails loudly with a
// useful message instead of silently dropping fields.
//
// Versioned: bump HANDOFF_VERSION when the shape changes and keep this file in
// sync across both repos.

import { z } from 'zod';

export const HANDOFF_VERSION = '1.4.0';

// Intelligence emits numbers inconsistently (sometimes "3.5", sometimes 3.5,
// sometimes ""). Coerce anything number-like to a number, everything else to undefined.
const numish = z.preprocess((v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const SetbacksSchema = z.object({
  front: numish,
  side: numish,
  rear: numish,
}).partial();

const OffsetsSchema = z.object({
  front: numish,
  rear: numish,
  left: numish,
  right: numish,
}).partial();

const LatLngSchema = z.object({ lat: z.number(), lng: z.number() });

// `attachment` is canonically a string ('freestanding' | 'attached' | 'three-side').
// Older Intelligence builds emitted it as a rich object ({ sides, lengths, count }),
// which hard-failed the import ("attachment: expected string, received object").
// Coerce any object form down to the canonical string so a stale export degrades
// gracefully instead of breaking the whole load.
const attachmentish = z.preprocess((v) => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as { count?: number; sides?: Record<string, unknown> };
    const count = typeof o.count === 'number'
      ? o.count
      : Object.values(o.sides ?? {}).filter(Boolean).length;
    return count === 0 ? 'freestanding' : count >= 3 ? 'three-side' : 'attached';
  }
  return undefined;
}, z.string().optional());

// Overlays may arrive as a plain name string (current Intelligence output) or,
// once Intelligence enriches the handoff, as a structured object carrying the
// overlay code, type, bushfire BAL level, specific requirements and a source URL.
const OverlayObjectSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  type: z.string().optional(),
  level: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  source_url: z.string().optional(),
}).partial();
const OverlaySchema = z.union([z.string(), OverlayObjectSchema]);
export type HandoffOverlay = z.infer<typeof OverlaySchema>;

// Overlay GEOMETRY carried from the siting tool — the actual overlay polygon(s) intersecting the
// lot, plus a `partial` flag (true = covers only part of the block, e.g. a corner-clipping bushfire
// overlay). Drawn on the Engineering site plan so the overlay's extent over the block is explicit.
const OverlayShapeSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  partial: z.boolean().optional(),               // true = covers only part of the lot
  rings: z.array(z.array(LatLngSchema)).optional(),  // polygon parts (lat/lng), parcel-intersected
}).partial();
export type HandoffOverlayShape = z.infer<typeof OverlayShapeSchema>;

// Easements / no-build runs carried from the siting tool. Two sources: auto-detected from the
// authoritative gov easement layer (`research.easements.features`, usually line runs with `coords`)
// and user-traced polygons (`boundaries.easements`, closed `polygon`s). Both drawn greyed on the plan.
const EasementFeatureSchema = z.object({
  kind: z.string().optional(),                 // 'line' | 'polygon'
  pfi: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  coords: z.array(LatLngSchema).optional(),
}).partial();
const EasementPolygonSchema = z.object({
  index: z.number().optional(),
  label: z.string().nullable().optional(),
  polygon: z.array(LatLngSchema).optional(),
  areaM2: z.number().nullable().optional(),
}).partial();

// Stormwater set-out the siting tool computes — design rainfall + the downpipes
// and the catchment they each serve. Carried so Drafting can build the drainage
// sheet instead of re-deriving it. Catchment polygons are intentionally left out
// (Drafting redraws them); we keep the sizing numbers.
const StormwaterSchema = z.object({
  designRainfall: z.object({
    intensityMmHr: numish,
    aepPercent: numish,
    durationMin: numish,
    source: z.string().optional(),
  }).partial().optional(),
  dischargePoints: z.array(z.object({
    index: z.number().optional(),
    lat: numish, lng: numish,                    // downpipe position on the building edge
    downpipe: z.string().nullable().optional(),  // chosen type label, e.g. "Round 100 mm"
    downpipeCapacityLs: numish,
    servesM2: numish,
    maxRoofM2: numish,
    existingRoofM2: numish,
    overCapacity: z.boolean().optional(),
    shared: z.boolean().optional(),              // true = shares the existing dwelling downpipe (flashing only)
  }).partial()).optional(),
  catchments: z.array(z.object({                 // roof areas draining to each downpipe (for the plan)
    section: z.number().optional(),
    areaM2: numish,
    polygon: z.array(LatLngSchema).optional(),
    dischargePoint: z.number().nullable().optional(),  // 1-based index into dischargePoints
    shared: z.boolean().optional(),
  }).partial()).optional(),
  totalCatchmentAreaM2: numish,
  anyOverCapacity: z.boolean().optional(),
  notes: z.string().optional(),
}).partial();
export type HandoffStormwater = z.infer<typeof StormwaterSchema>;

// A placed electrical item on the plan (board / switch / light / GPO).
const ElecNodeSchema = z.object({
  lat: numish, lng: numish,
  ip: z.string().optional(),
  fixtureType: z.string().optional(),
  area: z.string().optional(),
  label: z.string().optional(),
}).partial();

// Electrical / lighting scope captured in Intelligence. Draftly documents and
// coordinates this; a LICENSED ELECTRICIAN designs, installs and certifies it
// (see docs/ELECTRICAL_LIGHTING_SCOPE.md). Carried so Drafting can draw the
// layout and the certificate becomes a tracked item.
const ElectricalSchema = z.object({
  scope: z.string().optional(),
  supply: z.object({
    phases: numish,
    existingBoardSpareWays: numish,
    needsUpgrade: z.boolean().optional(),
  }).partial().optional(),
  luminaires: z.array(z.object({
    type: z.string().optional(),
    ip: z.string().optional(),
    qty: numish,
    location: z.string().optional(),
    control: z.string().optional(),
  }).partial()).optional(),
  gpos: z.array(z.object({
    qty: numish,
    ip: z.string().optional(),
    location: z.string().optional(),
  }).partial()).optional(),
  lightSpillConstraint: z.boolean().optional(),  // AS 4282 / overlay-driven
  standardsNote: z.string().optional(),
  notes: z.string().optional(),
  // Tap-to-place layout from the siting tool — positions + the drawn wiring run. Drawn on the
  // Engineering electrical-layout sheet; the BOM (cable/fixings/etc.) is derived from it.
  layout: z.object({
    switchboard: ElecNodeSchema.nullable().optional(),
    switches: z.array(ElecNodeSchema).optional(),
    lights: z.array(ElecNodeSchema).optional(),
    gpos: z.array(ElecNodeSchema).optional(),
    wires: z.array(z.object({ from: LatLngSchema, to: LatLngSchema }).partial()).optional(),
  }).partial().optional(),
}).partial();
export type HandoffElectrical = z.infer<typeof ElectricalSchema>;

// v1.4.0: Intelligence emits a curated `engineeringPackage` — the vetted, ready-
// to-engineer view (a superset of the loose top-level fields). We prefer it when
// present and fall back to the legacy `boundaries`/`research` fields otherwise.
const EngineeringPackageSchema = z.object({
  schemaVersion: z.string().optional(),
  structure: z.object({
    widthM: numish, depthM: numish,
    roofType: z.string().optional(),
    pitchDeg: numish,
    gutterHeightM: numish, fasciaHeightM: numish, ridgeHeightM: numish,
    rotationDeg: numish,
  }).partial().optional(),
  attachment: z.object({
    type: z.string().optional(),
    existingGutterOverhangMm: numish,
    frameStandoffMm: numish,
  }).partial().optional(),
  setbacks: OffsetsSchema.optional(),
  site: z.object({
    areaM2: z.number().nullable().optional(),
    lotPolygon: z.array(LatLngSchema).optional(),
    frontBoundaryIndex: z.number().nullable().optional(),
    northBearingDeg: z.number().nullable().optional(),
    overlays: z.array(OverlayShapeSchema).optional(),  // confirmed overlays + geometry
  }).partial().optional(),
  stormwater: StormwaterSchema.optional(),
  electrical: ElectricalSchema.optional(),
  ready: z.boolean().optional(),
}).partial();

export const HandoffSchema = z.object({
  site: z.object({
    fullAddress: z.string().optional(),
    suburb: z.string().optional(),
    state: z.string().optional(),
    postcode: z.string().optional(),
    projectType: z.string().optional(),
  }).partial().optional(),

  research: z.object({
    council: z.string().optional(),
    zone: z.string().optional(),
    zone_name: z.string().optional(),
    max_height: numish,        // m — allowed building height
    site_coverage: numish,     // % — max site coverage
    setbacks: SetbacksSchema.optional(),  // required planning setbacks
    setbacks_estimated: z.boolean().optional(),  // true = estimated (Reg 79/doc), not gov-verified → provisional
    overlays: z.array(OverlaySchema).optional(),
    easements: z.object({                       // auto-detected gov easement runs (Vicmap etc.)
      source: z.string().optional(),
      features: z.array(EasementFeatureSchema).optional(),
    }).partial().nullable().optional(),
    confidence: z.string().optional(),
    source_url: z.string().optional(),
    notes: z.string().optional(),
  }).partial().optional(),

  boundaries: z.object({
    site: z.object({
      areaM2: z.number().nullable().optional(),
      lotPts: z.array(LatLngSchema).optional(),
      frontBoundaryIndex: z.number().optional(),  // which lotPts edge is the labelled front
      aerial: z.object({                          // optional satellite context underlay
        imageBase64: z.string().optional(),
        url: z.string().optional(),
        bbox: z.array(z.number()).optional(),     // [w, s, e, n]
      }).partial().optional(),
    }).partial().optional(),
    building: z.object({
      width: numish,
      depth: numish,
      gutterHeight: numish,
      fasciaHeight: numish,
      pitch: numish,
      ridgeHeight: numish,
      height: numish,          // highest point (ridge, for compliance)
      footprint: z.array(LatLngSchema).optional(),  // placed corners (exact site-plan position)
      rotationDeg: numish,                          // clockwise from north
      roofType: z.string().optional(),              // 'gable' | 'skillion' | ... — drives config.roofType
      existingGutterOverhangMm: numish,             // overhang of the existing dwelling's gutter (wall-section set-out)
      frameStandoffMm: numish,                      // new frame's standoff from the dwelling — drives the standoff input
    }).partial().optional(),
    attachment: attachmentish,
    // Rich per-side attachment detail (which sides are fixed to the dwelling + connection
    // lengths). `attachment` (above) stays the canonical string; this carries the extra detail.
    attachmentDetail: z.object({
      sides: z.record(z.string(), z.boolean()).optional(),
      lengths: z.record(z.string(), z.number().nullable()).optional(),
      count: z.number().optional(),
    }).partial().optional(),
    northBearing: z.number().optional(),
    offsets: OffsetsSchema.optional(),    // ACTUAL measured setbacks from the siting tool
    ridgeBearing: z.number().nullable().optional(),
    ridgeLength: z.number().nullable().optional(),
    ridge: z.object({                     // ridge line endpoints (for site plan)
      from: LatLngSchema.optional(),
      to: LatLngSchema.optional(),
      bearing: numish,
      lengthM: numish,
    }).partial().optional(),
    stormwater: StormwaterSchema.optional(),  // downpipes + catchment sizing from the siting tool
    electrical: ElectricalSchema.optional(),  // lighting/electrical scope (executed + certified by a licensed electrician)
    easements: z.array(EasementPolygonSchema).nullable().optional(),  // user-traced no-build polygons
    // Planning overlays the user confirmed, WITH geometry — for the site-plan overlay sheet.
    overlayReview: z.object({
      confirmed: z.array(z.string()).optional(),
      excluded: z.array(z.string()).optional(),
      shapes: z.array(OverlayShapeSchema).optional(),
    }).partial().optional(),
  }).partial().optional(),

  compliance: z.object({
    approved: z.boolean().optional(),
    passCount: z.number().optional(),
    totalChecks: z.number().optional(),   // legacy (pre-1.4); newer exports send the counts below
    failCount: z.number().optional(),
    missingCount: z.number().optional(),
    infoCount: z.number().optional(),
    bal: z.string().nullable().optional(),
    floodRisk: z.string().nullable().optional(),
    checkedAt: z.string().optional(),
    approvedAt: z.string().optional(),
  }).partial().optional(),

  // v1.4.0 curated handoff — preferred over the loose fields above when present.
  engineeringPackage: EngineeringPackageSchema.optional(),

  // Submission/applicant details — the home owner goes on the drawings' title block.
  submission: z.object({
    applicant: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }).partial().optional(),
  }).partial().optional(),

  status: z.string().optional(),
  version: z.string().optional(),
}).partial();

export type Handoff = z.infer<typeof HandoffSchema>;

export interface ParseResult {
  ok: boolean;
  data?: Handoff;
  error?: string;
}

/** Parse + validate a Draftly Intelligence export string. Never throws. */
export function parseHandoff(jsonString: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  const result = HandoffSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? first.path.join('.') : 'root';
    return {
      ok: false,
      error: `Not a valid Draftly Intelligence export (${where}: ${first?.message ?? 'unknown shape'}).`,
    };
  }

  // Sanity: a real export has at least one of these top-level sections.
  const d = result.data;
  if (!d.site && !d.research && !d.boundaries) {
    return { ok: false, error: 'File parsed but contains no Draftly Intelligence project data.' };
  }

  return { ok: true, data: d };
}
