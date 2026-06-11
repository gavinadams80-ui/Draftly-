// ── Export the current design as a DesignSet (Engineering → Drafting) ──
// Maps Engineering's live state (config + selected sections + schedule + title
// block) onto the shared @draftly/drawings DesignSet contract and serializes it
// to a `.designset.json` Drafting can open to generate the drawings.

import {
  serializeDesignSet,
  type DesignMember,
  type ScheduleLine,
  type TitleBlockData,
} from '@draftly/drawings';
import type { ProjectConfig } from '@/types';

type AnySec = { size?: string; d?: number; b?: number; t?: number } | null | undefined;
// The live calc result carries the real pass/utilisation — handed over so Drafting
// sees the true member status instead of an assumed "pass".
type Sel = { sec?: AnySec; passed?: boolean; util?: number } | null | undefined;

// ── Ridge orientation + per-side attachment (carried from Intelligence) ──
// The shared lib (≥ v0.11.0) defines these on DesignGeometry; this app still
// pins an older lib, so they're declared locally and merged into the emitted
// geometry as data — makeDesignSet copies `geometry` wholesale, so the extra
// keys survive serialization regardless of the pinned type.
export type RidgeAxis = 'width' | 'depth';
export type BuildingSide = 'back' | 'front' | 'left' | 'right';

/**
 * Resolve the ridge axis from Intelligence's site layout. `rotationDeg` is the
 * compass bearing of footprint edge 0→1 — by Intelligence's construction that
 * edge runs along the DEPTH axis (see sPlaceStructure). Comparing the ridge
 * bearing to it tells us whether the ridge runs along the depth or the width.
 * Returns undefined when either bearing is missing, so the drawings fall back to
 * their legacy assumption (ridge ∥ depth, frames span the width).
 */
export function deriveRidgeAxis(rotationDeg?: number | null, ridgeBearing?: number | null): RidgeAxis | undefined {
  if (rotationDeg == null || ridgeBearing == null) return undefined;
  if (!Number.isFinite(rotationDeg) || !Number.isFinite(ridgeBearing)) return undefined;
  let delta = Math.abs(ridgeBearing - rotationDeg) % 180;  // fold to [0,180)
  if (delta > 90) delta = 180 - delta;                     // fold to [0,90]
  return delta <= 45 ? 'depth' : 'width';
}

const SIDE_ORDER: BuildingSide[] = ['back', 'front', 'left', 'right'];

/** Which faces attach to the dwelling, from Intelligence's per-side connection flags. */
export function deriveAttachedSides(sides?: Record<string, boolean> | null): BuildingSide[] | undefined {
  if (!sides) return undefined;
  const out = SIDE_ORDER.filter(s => sides[s]);
  return out.length ? out : undefined;
}

export interface DesignSetSource {
  config: ProjectConfig;
  calc: {
    selBeam: Sel; selPost: Sel; selPurlin: Sel; selLedger: Sel;
    selFascia: Sel; selGableChord: Sel; selGableDropper: Sel;
    purlinSpacing: number;
  };
  titleBlock: Partial<TitleBlockData>;
  standoff: number;        // mm
  leftSetback: number;     // m
  rightSetback: number;    // m
  northRotation: number;
  cladding?: string;
  schedule: { lines: ScheduleLine[]; totalKg: number; totalCost: number };
  ratePerKg: number;
  // Carried verbatim from Intelligence (metres) so Drafting can dimension the
  // wall section and auto-size the fascia/gutter from the source data. The
  // engineered eave height is geometry.height; these are the as-sited values.
  heights?: { gutter?: number; fascia?: number; ridge?: number };
  // Overhang of the existing dwelling gutter (mm) — wall-section set-out for Drafting.
  gutterOverhang?: number;
  // Stormwater sizing for Drafting's drainage sheet (carried from siting).
  drainage?: {
    designIntensityMmHr?: number;
    aepPercent?: number;
    totalCatchmentAreaM2?: number;
    anyOverCapacity?: boolean;
    downpipes?: { label?: string; capacityLs?: number; servesM2?: number }[];
  };
  // Free-text planning notes the user typed in Intelligence — passed through so
  // Drafting sees them and can answer them on the drawings.
  notes?: string;
  // Planning setbacks brought forward: the council-required ones (when confirmed)
  // and the measured offsets as the provisional build line, plus height/coverage.
  planning?: {
    requiredSetbacks?: { front?: number; side?: number; rear?: number };
    requiredSetbacksEstimated?: boolean;   // required setbacks are estimates → provisional
    provisionalSetbacks?: { front?: number; rear?: number; left?: number; right?: number };
    maxHeight?: number;
    siteCoverage?: number;
  };
  // Roof/pitch direction + which sides fix to the dwelling — for the site plan.
  ridgeBearing?: number;  // deg — ridge line bearing (compass)
  rotationDeg?: number;   // deg — bearing of footprint edge 0→1 (the depth axis), for the ridge-axis resolve
  connection?: { sides?: Record<string, boolean>; lengths?: Record<string, number | null> };
  // Progressive handover checklist — carried so Drafting continues ticking the
  // drafting + certification items and the list keeps its state across the boundary.
  readiness?: {
    percent: number;
    readyForHandover: boolean;
    items: { id: string; status: 'done' | 'todo' | 'na' }[];
  };
}

function member(id: string, role: string, sel: Sel): DesignMember | null {
  const s = sel?.sec;
  if (!s || !s.size) return null;
  const pass = sel?.passed ?? true;
  const note = typeof sel?.util === 'number' ? `${sel.util.toFixed(0)}% utilisation` : undefined;
  return { id, role, section: s.size, d: s.d ?? 0, b: s.b, t: s.t, check: { pass, ...(note ? { note } : {}) } };
}

const m = (metres: number) => Math.round(metres * 1000); // m → mm

/** Build the `.designset.json` string for the current design. */
export function buildDesignSetJSON(src: DesignSetSource): string {
  const c = src.config;
  // Orientation resolved from Intelligence's site layout (both optional — when
  // absent the drawings keep their legacy assumption: ridge ∥ depth, frames span
  // the width, dwelling on the back face).
  const ridgeAxis = deriveRidgeAxis(src.rotationDeg, src.ridgeBearing);
  const attachedSides = deriveAttachedSides(src.connection?.sides);
  const members = [
    member('m-rafter', 'rafter', src.calc.selBeam),
    member('m-post', 'post', src.calc.selPost),
    member('m-purlin', 'purlin', src.calc.selPurlin),
    member('m-ledger', 'ledger', src.calc.selLedger),
    member('m-fascia', 'fascia', src.calc.selFascia),
    member('m-gchord', 'gableChord', src.calc.selGableChord),
    member('m-gdropper', 'gableDropper', src.calc.selGableDropper),
  ].filter((x): x is DesignMember => !!x);

  return serializeDesignSet(
    {
      project: src.titleBlock,
      geometry: {
        structureType: String(c.buildingType),
        roofType: c.roofType === 'gable' ? 'gable' : 'skillion',
        attachment: c.attachment as 'freestanding' | 'attached' | 'three-side',
        width: m(c.width), depth: m(c.depth), height: m(c.height),
        pitch: c.pitch,
        portalFrameCount: c.portalFrameCount,
        standoff: src.standoff,
        setbacks: { left: m(src.leftSetback), right: m(src.rightSetback) },
        northRotation: src.northRotation,
        cladding: src.cladding,
        // Carried from Intelligence (extra keys survive — see note above). Drives
        // Drafting's section span + plan orientation; omitted ⇒ legacy fallback.
        ...(ridgeAxis ? { ridgeAxis } : {}),
        ...(attachedSides ? { attachedSides } : {}),
      },
      members,
      results: {
        purlinSpacing: m(src.calc.purlinSpacing),
        // Vertical set-out for Drafting's wall section (mm). undefined keys are
        // dropped by JSON.stringify, so absent source data stays absent.
        eaveHeight: m(c.height),
        gutterHeight: src.heights?.gutter !== undefined ? m(src.heights.gutter) : undefined,
        fasciaHeight: src.heights?.fascia !== undefined ? m(src.heights.fascia) : undefined,
        ridgeHeight: src.heights?.ridge !== undefined ? m(src.heights.ridge) : undefined,
        ...(src.gutterOverhang !== undefined ? { existingGutterOverhangMm: src.gutterOverhang } : {}),
        // Conform to the lib's DesignDrainage (required fields) — our carried summary is loose.
        ...(src.drainage ? {
          drainage: {
            designIntensityMmHr: src.drainage.designIntensityMmHr ?? 0,
            aepPercent: src.drainage.aepPercent ?? 0,
            totalCatchmentAreaM2: src.drainage.totalCatchmentAreaM2 ?? 0,
            anyOverCapacity: src.drainage.anyOverCapacity ?? false,
            downpipes: (src.drainage.downpipes ?? []).map((d, i) => ({
              label: d.label ?? `DP${i + 1}`,
              capacityLs: d.capacityLs ?? 0,
              servesM2: d.servesM2 ?? 0,
            })),
          },
        } : {}),
        ...(src.notes ? { siteNotes: src.notes } : {}),
        ...(src.planning ? { planning: src.planning } : {}),
        ...(src.ridgeBearing !== undefined ? { ridgeBearing: src.ridgeBearing } : {}),
        ...(src.connection ? { connection: src.connection } : {}),
        ...(src.readiness ? { readiness: src.readiness } : {}),
      },
      loads: { windUltimateKpa: c.windPressureKpa },
      schedule: {
        currency: 'AUD',
        ratePerKg: src.ratePerKg,
        totalKg: src.schedule.totalKg,
        totalCost: src.schedule.totalCost,
        lines: src.schedule.lines,
      },
    },
    { by: 'Draftly-Engineering', libVersion: '0.6.0' },
  );
}

/** Build + download the design as a `.designset.json` file. */
export function downloadDesignSet(src: DesignSetSource): void {
  const json = buildDesignSetJSON(src);
  const base = (src.titleBlock.projectName || 'design')
    .replace(/[^\w-]+/g, '-').slice(0, 40).replace(/^-+|-+$/g, '') || 'design';
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${base}.designset.json`; a.click();
  URL.revokeObjectURL(url);
}
