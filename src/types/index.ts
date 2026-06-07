// ── Core Types for Draftly Structural Designer ──

export interface Section {
  size: string;
  d: number;        // depth mm
  b?: number;       // flange width mm
  t: number;        // thickness mm
  Z: number;        // section modulus mm³
  I: number;        // second moment of area mm⁴
  E: number;        // Young's modulus MPa
  fy: number;       // yield strength MPa
  wt: number;       // kg/m
  grade: string;
  fb?: number;      // bending strength (if different from fy)
}

export interface SectionDB {
  posts: Section[];
  beams: Section[];
  rafters: Section[];
}

export interface UtilResult {
  sec: Section;
  util: number;
  passed: boolean;
  color: string;
  M: number;
  MCap: number;
  delta: number;
  deltaMax: number;
  label: string;
  // Purlin-specific
  MCapFull?: number;
  ltbFactor?: number;
  isRHS?: boolean;
}

export type MemberType = 'post' | 'beam' | 'purlin' | 'ledger' | 'fascia' | 'gableChord' | 'gableDropper' | 'gableTopChord';

export type MemberForm = 'open' | 'b2b' | 'rhs' | 'plate';

export type ConstructionType = 'timber' | 'steel' | 'aluminium' | 'csection';

export type BuildingType =
  | 'pergola'
  | 'carport'
  | 'shed'
  | 'verandah'
  | 'extension'
  | 'deck'
  | 'patio';

export type RoofType = 'flat' | 'gable' | 'hip' | 'skillion' | 'open';

export type AttachmentType = 'freestanding' | 'attached' | 'three-side';

// Intermediate-frame structural type:
//  'tied-rafter' — rafters tied at the bottom by a chord (truss). The tie takes
//                  the horizontal thrust; rafters act as top chords, columns axial.
//  'portal'      — rigid moment frame, no bottom chord. Knee moments develop,
//                  columns carry moment, the base develops horizontal thrust.
export type IntermediateFrameType = 'tied-rafter' | 'portal';

// Base fixity for portal-frame analysis.
export type BaseFixity = 'pinned' | 'fixed';

// How the structure resists in-plane lateral (wind) load:
//  'moment-frame' — the portal knees resist it by bending (frame sways).
//  'cross-brace'  — diagonal tension brace in a bay takes it as axial; little sway.
//  'knee-brace'   — diagonal struts at the knees stiffen the frame (reduced sway).
//  'diaphragm'    — roof/wall sheeting acts as a shear diaphragm; little sway.
//  'tied-to-wall' — attached structure restrained by the existing dwelling wall.
export type BracingType = 'moment-frame' | 'cross-brace' | 'knee-brace' | 'diaphragm' | 'tied-to-wall';

export interface MemberForms {
  post: MemberForm;
  beam: MemberForm;
  purlin: MemberForm;
  ledger: MemberForm;
  fascia: MemberForm;
  gableChord: MemberForm;
  gableDropper: MemberForm;
  gableTopChord: MemberForm;
}

export interface MemberOverrides {
  post: string | null;
  beam: string | null;
  purlin: string | null;
  ledger: string | null;
  fascia: string | null;
  gableChord: string | null;
  gableDropper: string | null;
  gableTopChord: string | null;
}

export interface ProjectConfig {
  buildingType: BuildingType;
  constructionType: ConstructionType;
  attachment: AttachmentType;
  roofType: RoofType;
  width: number;       // m
  depth: number;       // m
  height: number;      // m
  pitch: number;       // degrees
  portalFrameCount: number;
  // Intermediate frames: simple tied rafter (truss) vs untied portal moment frame.
  intermediateFrame: IntermediateFrameType;
  baseFixity: BaseFixity;   // only used when intermediateFrame === 'portal'
  // Lateral stability
  bracing: BracingType;
  windPressureKpa: number;  // net horizontal design wind pressure (ultimate)
}

export interface RoofingProfile {
  id: string;
  name: string;
  category: string;
  endSpan: number;      // mm
  internalSpan: number; // mm
  pitchMin: number;
  pitchMax: number;
  insulation: boolean;
}

// ── Cladding for gable/wall infill ──
export interface CladdingType {
  id: string;
  name: string;
  category: string;
  maxSpanH: number;      // max horizontal span between supports (mm)
  maxSpanV: number;      // max vertical span between supports (mm)
  weight: number;        // kg/m²
  thickness: number;     // mm
  transparency: number;  // 0-100% light transmission
  description: string;
}

// ── Gable infill panel result ──
export interface GableInfillResult {
  cladding: CladdingType;
  gableWidth: number;
  gableHeight: number;
  nBays: number;
  dropperSpacing: number;
  nDroppers: number;     // includes end posts
  panelWidth: number;
  dropperHeightMax: number;
  claddingArea: number;
  claddingSheets: number;
  frameAngleM: number;   // metres of cold-formed angle trim
  dropperEngineering: {
    maxDropperHeight: number;
    windLoad: number;    // kN/m on dropper
    utilisation: number;
    passed: boolean;
  };
}

export interface ConnectionDetail {
  id: string;
  name: string;
  category: string;
  capacity: string;
  material: string;
  costEach: number;
  engineerRequired: boolean;
}

export interface BuildingTypeConfig {
  id: BuildingType;
  name: string;
  icon: string;
  description: string;
  defaultSpan: number;
  defaultDepth: number;
  defaultHeight: number;
  maxSpan: number;
  maxDepth: number;
  complexity: 'low' | 'medium' | 'high';
}
