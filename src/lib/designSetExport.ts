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
type Sel = { sec?: AnySec } | null | undefined;

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
    provisionalSetbacks?: { front?: number; rear?: number; left?: number; right?: number };
    maxHeight?: number;
    siteCoverage?: number;
  };
  // Roof/pitch direction + which sides fix to the dwelling — for the site plan.
  ridgeBearing?: number;  // deg
  connection?: { sides?: Record<string, boolean>; lengths?: Record<string, number | null> };
}

function member(id: string, role: string, sel: Sel): DesignMember | null {
  const s = sel?.sec;
  if (!s || !s.size) return null;
  return { id, role, section: s.size, d: s.d ?? 0, b: s.b, t: s.t, check: { pass: true } };
}

const m = (metres: number) => Math.round(metres * 1000); // m → mm

/** Build the `.designset.json` string for the current design. */
export function buildDesignSetJSON(src: DesignSetSource): string {
  const c = src.config;
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
