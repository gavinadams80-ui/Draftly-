// ── Planning overlay guidance ──
// Turns a flagged planning overlay (carried from Site Intelligence) into
// plain-English meaning, design implications, an action checklist, and the
// standards/clauses that apply — so the user can keep going with confidence.
//
// AU / Victoria planning context. This is general guidance to orient the user;
// the specific requirements for a site must always be confirmed with the
// responsible authority (council / referral authority).

import type { HandoffOverlay } from './handoffSchema';

export type OverlaySeverity = 'critical' | 'caution' | 'info';

export interface NormalizedOverlay {
  name: string;
  code?: string;
  type?: string;
  level?: string;          // e.g. "BAL-29" (bushfire)
  requirements?: string[]; // specific requirements carried from council research
  sourceUrl?: string;
}

export interface OverlayGuidance {
  type: string;
  title: string;
  severity: OverlaySeverity;
  severityLabel: string;
  whatItMeans: string;
  designImplications: string[];
  actions: string[];
  standards: string[];
  draftlyHelps?: string;   // how the current design approach already helps align
  level?: string;
  sourceUrl?: string;
}

/** Coerce the handoff overlays (string | object) into a consistent shape. */
export function normalizeOverlays(raw?: HandoffOverlay[]): NormalizedOverlay[] {
  if (!raw) return [];
  return raw
    .map((o): NormalizedOverlay => {
      if (typeof o === 'string') return { name: o };
      return {
        name: o.name ?? o.code ?? o.type ?? 'Overlay',
        code: o.code,
        type: o.type,
        level: o.level,
        requirements: o.requirements,
        sourceUrl: o.source_url,
      };
    })
    .filter((o) => o.name);
}

function classify(o: NormalizedOverlay): string {
  const hay = `${o.type ?? ''} ${o.code ?? ''} ${o.name ?? ''}`.toLowerCase();
  if (/bushfire|\bbmo\b|\bbal\b|\bbpa\b/.test(hay)) return 'bushfire';
  if (/heritage|\bho\b/.test(hay)) return 'heritage';
  if (/inundation|flood|\blsio\b|\bsbo\b|floodway|\bfo\b/.test(hay)) return 'flood';
  if (/vegetation|\bvpo\b|tree/.test(hay)) return 'vegetation';
  if (/significant landscape|\bslo\b/.test(hay)) return 'landscape';
  if (/environmental significance|\beso\b/.test(hay)) return 'environmental';
  if (/erosion|\bemo\b|salinity/.test(hay)) return 'erosion';
  if (/design.*development|\bddo\b/.test(hay)) return 'design';
  return 'other';
}

const BASE: Record<string, Omit<OverlayGuidance, 'level' | 'sourceUrl'>> = {
  bushfire: {
    type: 'bushfire',
    title: 'Bushfire Management Overlay',
    severity: 'critical',
    severityLabel: 'Action required',
    whatItMeans:
      'The site is in a designated bushfire-prone area. Buildings and works usually need a planning permit, and the structure must be built to a Bushfire Attack Level (BAL) set by a site assessment.',
    designImplications: [
      'A BAL rating (BAL-LOW → BAL-FZ) sets ember, radiant-heat and flame requirements for the structure.',
      'Non-combustible framing and roofing are strongly favoured; gaps must be ember-sealed (≤3 mm or steel mesh).',
      'Defendable space and a firefighting water supply may be required around the structure.',
      'An attached structure can change the dwelling’s BAL — assess the building as a whole.',
    ],
    actions: [
      'Confirm whether your structure triggers a permit under the BMO (most buildings/works do; some minor non-habitable works are exempt — check with council).',
      'Commission a BAL / bushfire hazard site assessment from a qualified consultant.',
      'Design the frame and cladding to the resulting BAL level.',
      'Add ember protection: steel mesh to all gaps and vents; no combustible infill near the dwelling.',
      'Maintain the required defendable space and keep the structure clear of overhanging vegetation.',
    ],
    standards: [
      'AS 3959 — Construction of buildings in bushfire-prone areas',
      'Planning Scheme Clause 44.06 — Bushfire Management Overlay',
    ],
    draftlyHelps:
      'Your steel / cold-formed C-section frame and steel roofing are non-combustible — a strong starting point for BAL compliance. Specify ember mesh on all openings and avoid combustible infill.',
  },
  heritage: {
    type: 'heritage',
    title: 'Heritage Overlay',
    severity: 'caution',
    severityLabel: 'Permit likely',
    whatItMeans:
      'The property or precinct has recognised heritage significance. A planning permit is almost always required for new buildings and works, and the design must not detract from that significance.',
    designImplications: [
      'Visibility from the street and impact on significant fabric are decisive — structures to the rear / not visible are easier to approve.',
      'Form, scale, materials and colour should be sympathetic, yet clearly distinguishable from the original (avoid mock-heritage).',
      'Lightweight, reversible structures that don’t damage significant fabric are favoured.',
    ],
    actions: [
      'Check whether the structure is visible from the street and whether it touches significant building fabric.',
      'Prepare a short Heritage Impact Statement describing the proposal and its effect on significance.',
      'Engage council’s heritage advisor early — many councils offer free pre-application advice.',
      'Choose a simple, recessive design with reversible fixings where possible.',
    ],
    standards: [
      'Planning Scheme Clause 43.01 — Heritage Overlay',
      'Australia ICOMOS Burra Charter (heritage best practice)',
    ],
    draftlyHelps:
      'A lightweight steel/timber structure sited to the rear is typically the most approvable — keep the form simple and the connections reversible.',
  },
  flood: {
    type: 'flood',
    title: 'Flood / Inundation Overlay',
    severity: 'critical',
    severityLabel: 'Referral likely',
    whatItMeans:
      'The land is subject to flooding. A planning permit and referral to the floodplain / water authority is usually required, with minimum floor levels and flood-compatible construction.',
    designImplications: [
      'A minimum finished floor level may be set above a defined flood level.',
      'Flood-compatible, water-resistant materials are required below the flood level.',
      'The structure must not impede flood flow — open structures are preferred over solid walls.',
    ],
    actions: [
      'Obtain the applicable flood level / minimum floor level from council or the water authority.',
      'Confirm referral requirements (works in an LSIO/FO are usually referred to the floodplain authority).',
      'Design footings and any enclosed areas for inundation; prefer open structures that pass flow.',
    ],
    standards: [
      'Planning Scheme Clause 44.04 (LSIO) / 44.05 (SBO) — flood overlays',
      'AS 3600 — Concrete structures (footings in flood conditions)',
    ],
    draftlyHelps:
      'Open, post-supported structures (no solid infill walls) pass flood flow and are far easier to approve in flood areas.',
  },
  vegetation: {
    type: 'vegetation',
    title: 'Vegetation Protection Overlay',
    severity: 'caution',
    severityLabel: 'Permit likely',
    whatItMeans:
      'Native or significant vegetation on the site is protected. A permit is usually required to remove, destroy or lop vegetation, and works near trees are controlled.',
    designImplications: [
      'Siting must avoid protected trees and their root zones (TPZ/SRZ).',
      'Footings near trees may need to be hand-dug or screw piles to limit root damage.',
    ],
    actions: [
      'Identify protected vegetation and tree protection zones on the site.',
      'Site the structure clear of canopy and root zones; if removal is unavoidable, apply for a vegetation removal permit.',
      'Consider an arborist report if footings fall within a tree protection zone.',
    ],
    standards: [
      'Planning Scheme Clause 42.02 — Vegetation Protection Overlay',
      'AS 4970 — Protection of trees on development sites',
    ],
    draftlyHelps:
      'Screw-pile footings (already in the connection library) minimise excavation and root disturbance near protected trees.',
  },
  landscape: {
    type: 'landscape',
    title: 'Significant Landscape Overlay',
    severity: 'caution',
    severityLabel: 'Permit likely',
    whatItMeans:
      'The area has a valued landscape character. Buildings and works are controlled to protect that character, often with limits on height, bulk, colour and visibility.',
    designImplications: [
      'Low-profile, recessive forms and muted colours are favoured.',
      'Height and visibility from key viewlines may be restricted.',
    ],
    actions: [
      'Check the overlay schedule for specific height, setback and colour controls.',
      'Choose muted, non-reflective finishes and keep the profile low.',
    ],
    standards: ['Planning Scheme Clause 42.03 — Significant Landscape Overlay'],
  },
  environmental: {
    type: 'environmental',
    title: 'Environmental Significance Overlay',
    severity: 'caution',
    severityLabel: 'Permit likely',
    whatItMeans:
      'The site has environmental significance (e.g. habitat, water catchment). A permit is usually required for buildings and works, with conditions to protect those values.',
    designImplications: [
      'Siting, drainage and earthworks are controlled to protect environmental values.',
      'Minimising site disturbance and runoff is generally required.',
    ],
    actions: [
      'Read the overlay schedule to identify the values being protected and any referral authority.',
      'Minimise excavation and manage stormwater on site.',
    ],
    standards: ['Planning Scheme Clause 42.01 — Environmental Significance Overlay'],
  },
  erosion: {
    type: 'erosion',
    title: 'Erosion / Land Stability Overlay',
    severity: 'caution',
    severityLabel: 'Geotech likely',
    whatItMeans:
      'The land is prone to erosion or instability. Earthworks and footings are controlled, and a geotechnical assessment is often required.',
    designImplications: [
      'Footing design must suit the assessed soil/slope conditions.',
      'Earthworks and drainage are controlled to avoid triggering instability.',
    ],
    actions: [
      'Obtain a geotechnical report for footing design on the assessed soil.',
      'Confirm permit and earthworks controls in the overlay schedule.',
    ],
    standards: [
      'Planning Scheme Clause 44.01 — Erosion Management Overlay',
      'AS 2870 — Residential slabs and footings',
    ],
  },
  design: {
    type: 'design',
    title: 'Design & Development Overlay',
    severity: 'caution',
    severityLabel: 'Built-form controls',
    whatItMeans:
      'Specific built-form controls apply on top of the zone — commonly height, setback, site coverage, materials or overshadowing requirements.',
    designImplications: [
      'Height, setback and coverage limits in the overlay schedule may be stricter than the base zone.',
      'Material and colour palettes may be prescribed.',
    ],
    actions: [
      'Read the overlay schedule and design your structure to its specific built-form requirements.',
      'Cross-check the compliance panel limits against the schedule values.',
    ],
    standards: ['Planning Scheme Clause 43.02 — Design and Development Overlay'],
  },
  other: {
    type: 'other',
    title: 'Planning Overlay',
    severity: 'info',
    severityLabel: 'Review',
    whatItMeans:
      'This overlay applies additional planning controls to the site. Confirm the specific requirements and whether a permit is triggered before finalising your design.',
    designImplications: [
      'Additional controls may affect siting, height, materials or whether a permit is required.',
    ],
    actions: [
      'Look up the overlay in the planning scheme (or ask council) to confirm what it controls.',
      'Check whether your structure triggers a planning permit.',
    ],
    standards: ['Refer to the relevant planning scheme clause for this overlay.'],
  },
};

/** Resolve full guidance for a flagged overlay, merging any council-supplied detail. */
export function getOverlayGuidance(o: NormalizedOverlay): OverlayGuidance {
  const key = classify(o);
  const base = BASE[key] ?? BASE.other;

  // Merge any specific requirements carried from Intelligence into the action list.
  const actions = o.requirements?.length
    ? [...base.actions, ...o.requirements.map((r) => `From council research: ${r}`)]
    : base.actions;

  // Surface a known bushfire BAL level in the title.
  const title = key === 'bushfire' && o.level ? `${base.title} — ${o.level}` : base.title;

  return { ...base, title, actions, level: o.level, sourceUrl: o.sourceUrl };
}
