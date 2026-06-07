// ── Draftly Design-Set contract (Engineering ⇄ Drafting) ──
// PROPOSAL / v0 sketch. The round-trip envelope for *parametric member blocks*:
//   Engineering sizes members  ->  Drafting draws them as editable blocks  ->
//   the drawn geometry rounds back to Engineering and re-feeds its calculations.
//
// A drawn block is a "smart block": geometry + identity + data. The stable
// `id` on each MemberInstance is the linchpin that lets edits round-trip and
// stay bound to an Engineering calc cell.
//
// Mirrors handoffSchema.ts conventions: versioned, Zod-validated, never throws.
// TARGET HOME: the shared package (@draftly/handoff) once Draftly-Drawings is in
// session scope. Lives here next to handoffSchema.ts for now — keep in sync if
// duplicated into Drafting.
//
// See docs/parametric-member-blocks-roadmap.md for the full design.

import { z } from 'zod';

export const DESIGN_SET_VERSION = '0.1.0';

// Geometry ALWAYS crosses this boundary in real-world millimetres. Pixels are a
// Drafting display concern only and never appear in a DesignSet.
const PointSchema = z.object({ x: z.number(), y: z.number() });
export type Point = z.infer<typeof PointSchema>;

// Structural section (RHS 100x50x3, C150x50x1.9, ...). A self-contained mirror
// of the apps' `Section` type so a DesignSet validates without the section DB.
const SectionSchema = z.object({
  size: z.string(),               // 'RHS 100×50×3'
  d: z.number(),                  // depth mm
  b: z.number().optional(),       // width/flange mm
  t: z.number(),                  // thickness mm
  Z: z.number().optional(),       // section modulus mm³
  I: z.number().optional(),       // second moment of area mm⁴
  E: z.number().optional(),       // Young's modulus MPa
  fy: z.number().optional(),      // yield strength MPa
  wt: z.number().optional(),      // kg/m
  grade: z.string().optional(),
  fb: z.number().optional(),
});
export type DesignSection = z.infer<typeof SectionSchema>;

// ── Enumerations (Zod const + inferred type) ──
export const MemberRoleEnum = z.enum([
  'post', 'beam', 'rafter', 'purlin', 'ledger', 'fascia', 'brace', 'gableChord', 'other',
]);
export type MemberRole = z.infer<typeof MemberRoleEnum>;

export const MemberFormEnum = z.enum(['open', 'b2b', 'rhs', 'plate']);
export type MemberForm = z.infer<typeof MemberFormEnum>;

export const DrawingViewEnum = z.enum(['plan', 'side', 'section', 'profile']);
export type DrawingView = z.infer<typeof DrawingViewEnum>;

// Which app owns the truth for a member's fields, so a drawn value diverging
// from the engineered value is a *detected* conflict, not silent drift.
export const SourceOfTruthEnum = z.enum(['engineering', 'drafting']);
export type SourceOfTruth = z.infer<typeof SourceOfTruthEnum>;

// ── How a member is drawn (all mm / degrees) ──
const MemberGeometrySchema = z.object({
  anchor: PointSchema,                       // start point (mm)
  directionDeg: z.number(),                  // bearing of the member axis
  lengthMm: z.number(),                      // editable via grip drag
  rotationDeg: z.number().default(0),        // profile orientation
  miterStartDeg: z.number().optional(),      // joint cut at the start end
  miterEndDeg: z.number().optional(),        // joint cut at the finish end
});
export type MemberGeometry = z.infer<typeof MemberGeometrySchema>;

const EndpointSchema = z.object({ jointId: z.string().optional() });

// ── A single placed member: the "smart block" ──
export const MemberInstanceSchema = z.object({
  id: z.string(),                            // stable UUID — anchor of the round-trip

  // what it is
  section: SectionSchema,
  role: MemberRoleEnum,
  form: MemberFormEnum.default('rhs'),

  // how it's drawn
  view: DrawingViewEnum,
  geometry: MemberGeometrySchema,
  layer: z.string().default('members'),      // CAD layer name

  // how it connects
  endpoints: z
    .object({ start: EndpointSchema.optional(), end: EndpointSchema.optional() })
    .default({}),

  // link back to Engineering
  engineering: z
    .object({
      designId: z.string().optional(),
      memberId: z.string().optional(),       // the calc cell/row this binds to
      sourceOfTruth: SourceOfTruthEnum.default('engineering'),
    })
    .default({ sourceOfTruth: 'engineering' }),

  // manual edits diverging from the engineered value (the conflict surface)
  overrides: z.record(z.string(), z.unknown()).optional(),

  label: z.string().optional(),              // optional display tag, e.g. 'R3'
});
export type MemberInstance = z.infer<typeof MemberInstanceSchema>;

// ── A connection where member ends meet ──
export const JointSchema = z.object({
  id: z.string(),
  members: z.array(z.string()),              // member ids meeting here
  point: PointSchema,                        // location (mm)
  connectionCardId: z.string().optional(),   // -> @draftly/drawings ConnectionCard (DRF-...)
});
export type Joint = z.infer<typeof JointSchema>;

// ── A sheet in the project set (add/remove members & sheets anytime) ──
export const SheetLayoutSchema = z.object({
  id: z.string(),
  title: z.string(),
  view: DrawingViewEnum,
  scale: z.string().optional(),              // '1:50'
  memberIds: z.array(z.string()).default([]),
  order: z.number().optional(),
});
export type SheetLayout = z.infer<typeof SheetLayoutSchema>;

// ── The round-trip envelope ──
export const DesignSetSchema = z.object({
  version: z.string().default(DESIGN_SET_VERSION),
  sourceDesignId: z.string().optional(),
  createdAt: z.string().optional(),
  sheets: z.array(SheetLayoutSchema).default([]),
  members: z.array(MemberInstanceSchema).default([]),
  joints: z.array(JointSchema).default([]),
  sectionsUsed: z.array(SectionSchema).default([]),   // self-contained catalogue
});
export type DesignSet = z.infer<typeof DesignSetSchema>;

export interface ParseResult {
  ok: boolean;
  data?: DesignSet;
  error?: string;
}

/** Parse + validate a Design-Set JSON string. Never throws. */
export function parseDesignSet(jsonString: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  const result = DesignSetSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? first.path.join('.') : 'root';
    return {
      ok: false,
      error: `Not a valid Draftly Design Set (${where}: ${first?.message ?? 'unknown shape'}).`,
    };
  }
  return { ok: true, data: result.data };
}

/**
 * Merge an incoming DesignSet into an existing one by member id, so a round-trip
 * re-import updates members in place instead of duplicating them. Incoming
 * fields win on collision (caller decides ownership via `sourceOfTruth` before
 * calling — e.g. Engineering only overwrites engineering-owned members).
 */
export function mergeById(base: DesignSet, incoming: DesignSet): DesignSet {
  const byId = new Map<string, MemberInstance>(base.members.map((m) => [m.id, m]));
  for (const m of incoming.members) {
    const existing = byId.get(m.id);
    byId.set(m.id, existing ? { ...existing, ...m } : m);
  }
  return { ...base, ...incoming, members: [...byId.values()] };
}

/** Create an empty, valid DesignSet (handy as an editor starting point). */
export function emptyDesignSet(sourceDesignId?: string): DesignSet {
  return DesignSetSchema.parse({ sourceDesignId, createdAt: new Date().toISOString() });
}
