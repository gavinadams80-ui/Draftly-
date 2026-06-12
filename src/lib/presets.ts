// ── Structural presets ──
// A preset is a one-tap starting point: it seeds the ProjectConfig, the per-member
// section forms, and a couple of layout fields (standoff / setbacks) so a known,
// repeatable design (e.g. the 9.27 m clear-span gable portal) can be recalled
// without re-entering every field. Presets are intentionally Partial — they only
// set what defines the design and leave everything else on the current value.

import type { ProjectConfig, MemberForms } from '@/types';

export interface StructuralPreset {
  id: string;
  name: string;        // short label for the picker chip
  summary: string;     // one-line description shown under the chip
  config: Partial<ProjectConfig>;
  forms?: Partial<MemberForms>;
  // Fixed section sizes (exact catalogue size strings) for members the design pins
  // regardless of span — e.g. the gable/infill members. Members not listed auto-size.
  overrides?: Partial<Record<keyof MemberForms, string>>;
  // Optional layout state that lives outside ProjectConfig in App.tsx.
  standoffMm?: number;
  leftSetback?: number;
  rightSetback?: number;
}

export const STRUCTURAL_PRESETS: StructuralPreset[] = [
  {
    id: 'gable-portal-927-cplate',
    name: '9.27 Clear-Span Gable · Portal · C+Plate',
    summary:
      '9.27 m clear span, gable rafter design with portal-frame intermediates. ' +
      'Portal rafters & columns: cold-rolled C with a plate on the face (300 C, LTB 0.92). ' +
      'Gable & infill: RHS 100×50×3.0.',
    config: {
      buildingType: 'pergola',
      constructionType: 'csection',
      roofType: 'gable',
      attachment: 'three-side',
      width: 9.27,
      pitch: 10,
      portalFrameCount: 3,
      intermediateFrame: 'portal',
      baseFixity: 'pinned',
      bracing: 'moment-frame',
    },
    // Portal moment-frame members → C with a face plate (LTB 0.92); auto-sizes to the
    // deepest passing C (≈ C300×70×3.0 at 9.27 m). Gable end frame + infill droppers →
    // RHS 100×50×3.0, pinned via overrides so they stay consistent across the design.
    forms: {
      beam: 'plate',
      post: 'plate',
      gableChord: 'rhs',
      gableDropper: 'rhs',
      gableTopChord: 'rhs',
    },
    overrides: {
      gableChord: 'RHS 100 × 50 × 3.0',
      gableDropper: 'RHS 100 × 50 × 3.0',
      gableTopChord: 'RHS 100 × 50 × 3.0',
    },
  },
];
