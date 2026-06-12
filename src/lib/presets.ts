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
      'Cold-rolled C-section rafters & columns with a plate welded to the face (LTB 0.92). Three frames.',
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
    // Cold-rolled C with a plate on the face → MemberForm 'plate' (LTB 0.92).
    // Applied to the moment-frame members (rafter + portal column) and the gable
    // rafters/top-chord that read on the three rafter sections.
    forms: {
      beam: 'plate',
      post: 'plate',
      gableChord: 'plate',
      gableTopChord: 'plate',
    },
  },
];
