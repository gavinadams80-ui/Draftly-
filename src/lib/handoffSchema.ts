// ── Draftly Intelligence → Engineering handoff contract ──
// Single source of truth for the `projectData` payload that Draftly-Intelligence
// exports (see Draftly-Intelligence/client/js/app.js → exportProject / sSaveSitingToProject).
// Validated with Zod on import so a malformed/partial file fails loudly with a
// useful message instead of silently dropping fields.
//
// Versioned: bump HANDOFF_VERSION when the shape changes and keep this file in
// sync across both repos.

import { z } from 'zod';

export const HANDOFF_VERSION = '1.1.0';

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
    overlays: z.array(OverlaySchema).optional(),
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
  }).partial().optional(),

  compliance: z.object({
    approved: z.boolean().optional(),
    passCount: z.number().optional(),
    totalChecks: z.number().optional(),
    checkedAt: z.string().optional(),
    approvedAt: z.string().optional(),
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
