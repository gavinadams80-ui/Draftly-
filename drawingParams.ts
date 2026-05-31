// ── Drawing Editable Parameters ──
// Schema for all configurable values in each drawing type

export interface DrawingParams {
  // ── Common / Global ──
  standoffMm: number;
  boltSize: string;
  boltSpacing: number;
  weldSize: number;

  // ── Attachment Configuration ──
  attachBack: boolean;
  attachLeft: boolean;
  attachRight: boolean;
  attachFront: boolean;
  rightOffsetMm: number;
  leftOffsetMm: number;
  backOffsetMm: number;

  // ── Wall Section (DRF-001) ──
  brickThickness: number;
  cavityWidth: number;
  studSize: string;
  fasciaThickness: number;
  gutterType: string;
  shsStandoff: string;
  lagScrewSize: string;
  lagScrewSpacing: number;

  // ── Socket Joint (DRF-007) ──
  stubShs: string;
  packerSize: string;
  rafterSize: string;
  screwSize: string;
  screwsPerSide: number;
  stubHeight: number;

  // ── Fascia Penetration (DRF-008) ──
  shsSize: string;
  gapSize: number;
  sealant: string;

  // ── Corner Post (DRF-003) ──
  postSize: string;
  ledgerSize: string;
  basePlateSize: string;
  anchorSize: string;
  concretePad: string;

  // ── Rafter to Ledger (DRF-004) ──
  pitchAngle: number;
  birdsmouthDepth: number;
  boltThroughSize: string;

  // ── Cross-Bracing (DRF-005) ──
  braceSize: string;
  bayWidth: number;
  bayHeight: number;

  // ── Ledger Connection (DRF-006) ──
  bracketType: string;
  bracketMaterial: string;

  // ── Full Elevation (DRF-002) ──
  panel1Enabled: boolean;
  panel2Enabled: boolean;
  panel3Enabled: boolean;

  // ── Plan View ──
  showDimensions: boolean;
  showPurlins: boolean;
  showPosts: boolean;
  showLabels: boolean;

  // ── Roof Geometry ──
  showRafterLength: boolean;
  showRise: boolean;
  showPitchArc: boolean;

  // ── Gutter ──
  showGutter: boolean;
}

export function getDefaultDrawingParams(): DrawingParams {
  return {
    standoffMm: 150,
    boltSize: 'M12',
    boltSpacing: 600,
    weldSize: 6,

    // Attachment defaults: 3-side (back + left + right)
    attachBack: true,
    attachLeft: true,
    attachRight: true,
    attachFront: false,
    rightOffsetMm: 1800,
    leftOffsetMm: 0,
    backOffsetMm: 0,

    brickThickness: 110,
    cavityWidth: 50,
    studSize: '90x45',
    fasciaThickness: 30,
    gutterType: 'colorbond',
    shsStandoff: '65x65',
    lagScrewSize: 'M12x100',
    lagScrewSpacing: 600,

    stubShs: '50x50x4',
    packerSize: '50x5',
    rafterSize: 'C250x65x2.4',
    screwSize: 'M10',
    screwsPerSide: 4,
    stubHeight: 220,

    shsSize: '65x65',
    gapSize: 3,
    sealant: 'Sikaflex',

    postSize: 'C100x50x1.6',
    ledgerSize: 'C150x50x1.9',
    basePlateSize: '150x150x8',
    anchorSize: 'M16',
    concretePad: '400x400x300',

    pitchAngle: 10,
    birdsmouthDepth: 25,
    boltThroughSize: 'M12',

    braceSize: 'C75x40x1.2',
    bayWidth: 3.0,
    bayHeight: 2.7,

    bracketType: 'angle',
    bracketMaterial: 'gal-steel',

    panel1Enabled: true,
    panel2Enabled: true,
    panel3Enabled: true,

    showDimensions: true,
    showPurlins: true,
    showPosts: true,
    showLabels: true,

    showRafterLength: true,
    showRise: true,
    showPitchArc: true,

    showGutter: true,
  };
}

export interface ParamMeta {
  key: keyof DrawingParams;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
  category: string;
  drawingIds: string[];
}

export const DRAWING_PARAM_META: ParamMeta[] = [
  // Attachment Configuration
  { key: 'attachBack', label: 'Attach to back wall', type: 'boolean', category: 'Attachment', drawingIds: ['plan'] },
  { key: 'attachLeft', label: 'Attach to left wall', type: 'boolean', category: 'Attachment', drawingIds: ['plan'] },
  { key: 'attachRight', label: 'Attach to right wall', type: 'boolean', category: 'Attachment', drawingIds: ['plan'] },
  { key: 'attachFront', label: 'Attach to front wall', type: 'boolean', category: 'Attachment', drawingIds: ['plan'] },
  // Offsets: 0 = full wrap, large number = no wrap. Using text input (no max) so any value works
  { key: 'rightOffsetMm', label: 'Right wall offset', type: 'number', min: 0, step: 50, unit: 'mm', category: 'Attachment', drawingIds: ['plan'] },
  { key: 'leftOffsetMm', label: 'Left wall offset', type: 'number', min: 0, step: 50, unit: 'mm', category: 'Attachment', drawingIds: ['plan'] },
  { key: 'backOffsetMm', label: 'Back wall offset', type: 'number', min: 0, step: 50, unit: 'mm', category: 'Attachment', drawingIds: ['plan'] },

  // Common
  { key: 'standoffMm', label: 'Standoff from wall', type: 'number', min: 50, max: 500, step: 10, unit: 'mm', category: 'Common', drawingIds: ['DRF-001','DRF-006','DRF-007','DRF-008','plan'] },
  { key: 'boltSize', label: 'Bolt size', type: 'select', options: ['M10','M12','M16','M20'], category: 'Common', drawingIds: ['DRF-003','DRF-004','DRF-005','DRF-006'] },
  { key: 'boltSpacing', label: 'Bolt spacing', type: 'number', min: 300, max: 1200, step: 50, unit: 'mm ctr', category: 'Common', drawingIds: ['DRF-003','DRF-006','DRF-007'] },
  { key: 'weldSize', label: 'Fillet weld size', type: 'number', min: 3, max: 12, step: 1, unit: 'mm', category: 'Common', drawingIds: ['DRF-007'] },

  // Wall Section
  { key: 'brickThickness', label: 'Brick thickness', type: 'number', min: 70, max: 230, step: 5, unit: 'mm', category: 'Wall Section', drawingIds: ['DRF-001'] },
  { key: 'cavityWidth', label: 'Cavity width', type: 'number', min: 25, max: 100, step: 5, unit: 'mm', category: 'Wall Section', drawingIds: ['DRF-001'] },
  { key: 'studSize', label: 'Timber stud size', type: 'select', options: ['90x45','90x35','70x35','70x45'], category: 'Wall Section', drawingIds: ['DRF-001'] },
  // fasciaThickness now also affects plan view clear span calculation
  { key: 'fasciaThickness', label: 'Fascia thickness', type: 'number', min: 15, max: 100, step: 5, unit: 'mm', category: 'Wall Section', drawingIds: ['DRF-001','DRF-008','plan'] },
  { key: 'shsStandoff', label: 'SHS standoff size', type: 'select', options: ['50x50','65x65','75x75','90x90'], category: 'Wall Section', drawingIds: ['DRF-001','DRF-007','DRF-008'] },
  { key: 'lagScrewSize', label: 'Lag screw size', type: 'select', options: ['M10x80','M12x100','M16x120'], category: 'Wall Section', drawingIds: ['DRF-001'] },
  { key: 'lagScrewSpacing', label: 'Lag screw spacing', type: 'number', min: 300, max: 1200, step: 50, unit: 'mm ctr', category: 'Wall Section', drawingIds: ['DRF-001'] },

  // Socket Joint
  { key: 'stubShs', label: 'Stub SHS size', type: 'select', options: ['40x40x3','50x50x3','50x50x4','65x65x4'], category: 'Socket Joint', drawingIds: ['DRF-007'] },
  { key: 'packerSize', label: 'Packer plate size', type: 'select', options: ['40x5','50x3','50x5','65x5'], category: 'Socket Joint', drawingIds: ['DRF-007'] },
  { key: 'rafterSize', label: 'Rafter C-section', type: 'select', options: ['C200x60x2.0','C250x65x2.4','C300x70x2.4','C350x75x3.0'], category: 'Socket Joint', drawingIds: ['DRF-007'] },
  { key: 'screwSize', label: 'Screw size', type: 'select', options: ['M8','M10','M12'], category: 'Socket Joint', drawingIds: ['DRF-007'] },
  { key: 'screwsPerSide', label: 'Screws per side', type: 'number', min: 2, max: 8, step: 1, unit: 'no.', category: 'Socket Joint', drawingIds: ['DRF-007'] },
  { key: 'stubHeight', label: 'Stub height into rafter', type: 'number', min: 150, max: 400, step: 10, unit: 'mm', category: 'Socket Joint', drawingIds: ['DRF-007'] },

  // Fascia Penetration
  { key: 'gapSize', label: 'Gap around SHS', type: 'number', min: 1, max: 10, step: 1, unit: 'mm', category: 'Fascia', drawingIds: ['DRF-008'] },
  { key: 'sealant', label: 'Sealant type', type: 'select', options: ['Sikaflex','polyurethane','silicone','butyl'], category: 'Fascia', drawingIds: ['DRF-008'] },

  // Corner Post
  { key: 'postSize', label: 'Post C-section', type: 'select', options: ['C75x40x1.2','C100x50x1.6','C150x50x1.9','C200x60x2.4'], category: 'Post', drawingIds: ['DRF-003'] },
  { key: 'ledgerSize', label: 'Ledger C-section', type: 'select', options: ['C100x50x1.6','C150x50x1.9','C200x60x2.4','C250x65x2.4'], category: 'Post', drawingIds: ['DRF-003','DRF-004'] },
  { key: 'basePlateSize', label: 'Base plate size', type: 'select', options: ['120x120x6','150x150x8','200x200x10','250x250x12'], category: 'Post', drawingIds: ['DRF-003'] },
  { key: 'anchorSize', label: 'Anchor bolt size', type: 'select', options: ['M12','M16','M20','M24'], category: 'Post', drawingIds: ['DRF-003'] },
  { key: 'concretePad', label: 'Concrete pad size', type: 'select', options: ['300x300x250','400x400x300','500x500x350','600x600x400'], category: 'Post', drawingIds: ['DRF-003'] },

  // Rafter
  { key: 'pitchAngle', label: 'Roof pitch', type: 'number', min: 0, max: 45, step: 1, unit: 'degrees', category: 'Rafter', drawingIds: ['DRF-004'] },
  { key: 'birdsmouthDepth', label: 'Birdsmouth depth', type: 'number', min: 15, max: 50, step: 5, unit: 'mm', category: 'Rafter', drawingIds: ['DRF-004'] },
  { key: 'boltThroughSize', label: 'Through-bolt size', type: 'select', options: ['M10','M12','M16'], category: 'Rafter', drawingIds: ['DRF-004'] },

  // Bracing
  { key: 'braceSize', label: 'Bracing C-section', type: 'select', options: ['C75x40x1.2','C100x50x1.6','C150x50x1.9'], category: 'Bracing', drawingIds: ['DRF-005'] },

  // Ledger Connection
  { key: 'bracketType', label: 'Bracket type', type: 'select', options: ['angle','plate','standoff','box'], category: 'Ledger', drawingIds: ['DRF-006'] },
  { key: 'bracketMaterial', label: 'Bracket material', type: 'select', options: ['gal-steel','stainless','aluminium'], category: 'Ledger', drawingIds: ['DRF-006'] },

  // Display toggles
  { key: 'showDimensions', label: 'Show dimensions', type: 'boolean', category: 'Display', drawingIds: ['plan','roof'] },
  { key: 'showPurlins', label: 'Show purlins', type: 'boolean', category: 'Display', drawingIds: ['plan'] },
  { key: 'showPosts', label: 'Show posts', type: 'boolean', category: 'Display', drawingIds: ['plan'] },
  { key: 'showLabels', label: 'Show labels', type: 'boolean', category: 'Display', drawingIds: ['plan','roof'] },
  { key: 'showRafterLength', label: 'Show rafter length', type: 'boolean', category: 'Display', drawingIds: ['roof'] },
  { key: 'showRise', label: 'Show rise dimension', type: 'boolean', category: 'Display', drawingIds: ['roof'] },
  { key: 'showPitchArc', label: 'Show pitch arc', type: 'boolean', category: 'Display', drawingIds: ['roof'] },
  { key: 'showGutter', label: 'Show gutter', type: 'boolean', category: 'Display', drawingIds: ['DRF-001','DRF-006'] },

  // Panel toggles (Full Elevation)
  { key: 'panel1Enabled', label: 'Show Wall Section panel', type: 'boolean', category: 'Panels', drawingIds: ['DRF-002'] },
  { key: 'panel2Enabled', label: 'Show Socket Joint panel', type: 'boolean', category: 'Panels', drawingIds: ['DRF-002'] },
  { key: 'panel3Enabled', label: 'Show Corner Post panel', type: 'boolean', category: 'Panels', drawingIds: ['DRF-002'] },
];

export function getParamsForDrawing(drawingId: string): ParamMeta[] {
  return DRAWING_PARAM_META.filter((p) => p.drawingIds.includes(drawingId));
}

export function groupParamsByCategory(params: ParamMeta[]): Record<string, ParamMeta[]> {
  const groups: Record<string, ParamMeta[]> = {};
  for (const p of params) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  }
  return groups;
}
