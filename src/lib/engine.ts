// ── Engineering Calculation Engine ──
// AS/NZS 4600 (cold-formed), AS4100 (steel), AS1720 (timber), AS1664 (aluminium)

import type { Section, UtilResult, MemberForm } from '@/types';

// ── Load constants ──
export const LOAD_KPA_ULTIMATE = 0.74;    // kN/m² (1.2G + 1.5Q)
export const LOAD_KPA_SERVICE = 0.48;     // kN/m² (G + Q)
export const DEFLECT_LIMIT_TOTAL = 250;   // span/250
export const DEFLECT_LIMIT_LIVE = 500;    // span/500

// ── Capacity reduction factors per AS standards ──
export const PHI: Record<string, number> = {
  timber: 0.85,
  steel: 0.90,
  aluminium: 0.65,
  csection: 0.90,
};

// ── Classify section form from size string ──
export function classifySectionForm(size: string): 'open' | 'b2b' | 'rhs' {
  const s = (size || '').toUpperCase().trim();
  if (s.indexOf('RHS') === 0 || s.indexOf('SHS') === 0) return 'rhs';
  if (s.indexOf('2/') === 0 || s.indexOf('2×') === 0 || s.indexOf('2/C') === 0) return 'b2b';
  return 'open';
}

// ── Get available forms for a member type ──
// Plate infill = single C + flat plate screwed to open face (box section)
// B2B = two C-sections joined web-to-web (I-section)
// RHS = closed hollow section, no LTB
export function getAvailableForms(memberType: string): { value: MemberForm; label: string }[] {
  const openC  = { value: 'open' as MemberForm, label: 'Single C open' };
  const plate  = { value: 'plate' as MemberForm, label: 'C + plate infill (boxed)' };
  const b2b    = { value: 'b2b' as MemberForm, label: '2C back-to-back' };
  const rhs    = { value: 'rhs' as MemberForm, label: 'RHS / SHS closed' };
  switch (memberType) {
    case 'post':
      return [openC, plate, b2b, rhs];
    case 'beam':
      return [openC, plate, b2b, rhs];
    case 'purlin':
      return [openC, b2b, rhs]; // purlins: no plate (roofing sheet does that job)
    case 'ledger':
      return [openC, plate]; // ledger: single C or C+plate (for boxed look)
    case 'fascia':
      return [openC, plate]; // fascia: single C or C+plate (for boxed look)
    case 'gableChord':
      return [openC, rhs]; // bottom chord: single C or RHS
    case 'gableDropper':
      return [openC, rhs]; // dropper: single C or RHS post
    default:
      return [openC, plate, b2b, rhs];
  }
}

// ── Filter sections by member form ──
// 'plate' uses single C-sections from DB (plate is a construction detail, not a section type)
export function filterByForm(sections: Section[], form: MemberForm): Section[] {
  return sections.filter((sec) => {
    const f = classifySectionForm(sec.size);
    if (form === 'rhs') return f === 'rhs';
    if (form === 'b2b') return f === 'b2b';
    // 'open' and 'plate' both use single C-sections from DB
    return f === 'open';
  });
}

// ── Calculate utilisation for all sections in a list ──
// LTB factors: open C = 0.65, plate infill = 0.92 (closes section), RHS = 1.0, B2B = 0.85
export function calcUtilisation(
  sectionList: Section[],
  span: number,      // metres
  spacing: number,   // metres (tributary width)
  material: string,
  options?: {
    isColumn?: boolean;
    ltbFactor?: number;  // lateral torsional buckling factor override
    isPurlin?: boolean;
    memberForm?: MemberForm;  // determines default LTB factor
  }
): UtilResult[] {
  if (!sectionList || !sectionList.length) return [];
  const phi = PHI[material] || 0.85;
  const results: UtilResult[] = [];

  // Determine LTB factor from member form
  const memberForm = options?.memberForm;
  let formLtbFactor = 1.0;
  if (memberForm === 'open') formLtbFactor = 0.65;
  else if (memberForm === 'plate') formLtbFactor = 0.92;  // plate closes section, near-RHS behaviour
  else if (memberForm === 'b2b') formLtbFactor = 0.85;    // B2B partially restrains
  else if (memberForm === 'rhs') formLtbFactor = 1.0;

  for (let i = 0; i < sectionList.length; i++) {
    const sec = sectionList[i];
    if (!sec || !sec.Z) continue;

    const isRHS = classifySectionForm(sec.size) === 'rhs';
    let ltbFactor = 1.0;
    if (!isRHS) {
      // Use explicit override, or derive from member form
      ltbFactor = options?.ltbFactor ?? formLtbFactor;
    }

    const wU = LOAD_KPA_ULTIMATE * spacing;   // kN/m
    const wS = LOAD_KPA_SERVICE * spacing;    // kN/m
    const M = wU * span * span / 8;           // kNm
    const MCapFull = phi * (sec.fy || 450) * sec.Z / 1e6; // kNm
    const MCap = MCapFull * ltbFactor;
    const utilBend = MCap > 0 ? (M / MCap * 100) : 999;

    const L_mm = span * 1000;
    const delta = (5 * wS * Math.pow(L_mm, 4)) / (384 * (sec.E || 200000) * (sec.I || 1));
    const deltaMax = L_mm / DEFLECT_LIMIT_TOTAL;
    const utilDefl = deltaMax > 0 ? (delta / deltaMax * 100) : 0;

    const util = Math.max(utilBend, utilDefl);
    const passed = util <= 100;
    const color = util < 70 ? '#4caf50' : util < 85 ? '#8bc34a' : util < 100 ? '#ff9800' : '#f44336';

    // Build LTB note
    let ltbNote = '';
    if (isRHS) {
      ltbNote = '(RHS·no LTB)';
    } else if (ltbFactor >= 0.9) {
      ltbNote = memberForm === 'plate' ? '(+plate·LTB×0.92)' : '(+plate·LTB×0.92)';
    } else if (ltbFactor >= 0.8) {
      ltbNote = '(B2B·LTB×0.85)';
    } else {
      ltbNote = '(C·LTB×0.65)';
    }

    results.push({
      sec,
      util,
      passed,
      color,
      M,
      MCap,
      delta,
      deltaMax,
      label: sec.size + ' ' + ltbNote + ' — ' + util.toFixed(1) + '%',
      MCapFull: MCapFull,
      ltbFactor: ltbFactor,
      isRHS: isRHS,
    });
  }

  // Sort by weight ascending — smallest/lightest section first
  // so lightestPassing() picks the smallest section that passes
  results.sort((a, b) => (a.sec.wt || 0) - (b.sec.wt || 0));
  return results;
}

// ── Select smallest passing section ──
export function selectMemberByCapacity(
  sections: Section[],
  span: number,
  loadKPa: number,
  spacing: number,
  material: string
): Section & { calcSpan: number; calcM: number; calcMCap: number; calcDelta: number; calcDeltaMax: number; utilisation: string; passed: boolean } {
  const phi = PHI[material] || 0.85;
  const w_ult = loadKPa * spacing;
  const w_svc = LOAD_KPA_SERVICE * spacing;
  const M = w_ult * span * span / 8;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const fb_actual = sec.fb || sec.fy;
    const M_cap = phi * fb_actual * sec.Z / 1e6;
    if (M_cap < M) continue;

    const w_N_per_mm = w_svc;
    const L_mm = span * 1000;
    const delta = (5 * w_N_per_mm * Math.pow(L_mm, 4)) / (384 * sec.E * sec.I);
    const delta_max = L_mm / DEFLECT_LIMIT_TOTAL;
    if (delta > delta_max) continue;

    return {
      ...sec,
      calcSpan: span,
      calcM: M,
      calcMCap: M_cap,
      calcDelta: delta,
      calcDeltaMax: delta_max,
      utilisation: (M / M_cap * 100).toFixed(1),
      passed: true,
    };
  }

  // Nothing passed — return largest with warning
  const largest = sections[sections.length - 1];
  return {
    ...largest,
    calcSpan: span,
    calcM: M,
    calcMCap: (phi * (largest.fb || largest.fy) * largest.Z / 1e6),
    calcDelta: (5 * w_svc * Math.pow(span * 1000, 4)) / (384 * largest.E * largest.I),
    calcDeltaMax: (span * 1000) / DEFLECT_LIMIT_TOTAL,
    utilisation: '>100',
    passed: false,
  };
}

// ── Find section by size string ──
export function findSectionBySize(sectionList: Section[], size: string | null): Section | null {
  if (!size) return null;
  return sectionList.find((s) => s.size === size) || null;
}

// ── Lightest passing result ──
export function lightestPassing(results: UtilResult[]): UtilResult | null {
  return results.find((r) => r.passed) || (results.length ? results[0] : null);
}

// ── Bracing factor from attachment ──
export function getBracingFactor(attachment: string): number {
  if (attachment === 'three-side') return 0.35;
  if (attachment === 'attached') return 0.55;
  return 1.0;
}

// ── Roofing profiles ──
export const ROOFING_PROFILES = [
  { id:'trimdek-42',    name:'Trimdek (0.42 BMT)',     category:'colorbond-steel', endSpan:1050, internalSpan:1350, pitchMin:2,  pitchMax:30 },
  { id:'trimdek-35',    name:'Trimdek (0.35 BMT)',     category:'colorbond-steel', endSpan:900,  internalSpan:1200, pitchMin:2,  pitchMax:30 },
  { id:'custom-orb-35', name:'Custom Orb (0.35 BMT)',  category:'colorbond-steel', endSpan:750,  internalSpan:1000, pitchMin:5,  pitchMax:35 },
  { id:'spandek',       name:'Spandek',                category:'colorbond-steel', endSpan:1200, internalSpan:1500, pitchMin:2,  pitchMax:30 },
  { id:'kliplok',       name:'Kliplok',                category:'colorbond-steel', endSpan:1800, internalSpan:2100, pitchMin:1,  pitchMax:15 },
  { id:'polycarb-twin', name:'Polycarbonate Twinwall', category:'polycarbonate',   endSpan:600,  internalSpan:750,  pitchMin:5,  pitchMax:45 },
  { id:'timber-batten', name:'Timber Battens',         category:'timber',          endSpan:450,  internalSpan:600,  pitchMin:15, pitchMax:45 },
  { id:'louvre-alum',   name:'Aluminium Louvres',      category:'aluminium',       endSpan:900,  internalSpan:1200, pitchMin:0,  pitchMax:90 },
];

export function getRoofingProfile(id: string) {
  return ROOFING_PROFILES.find((p) => p.id === id) || ROOFING_PROFILES[0];
}

// ── Gable infill cladding types ──
export const CLADDING_TYPES = [
  { id:'poly-twin-10', name:'Polycarbonate Twinwall 10mm', category:'polycarbonate', maxSpanH:1000, maxSpanV:1200, weight:1.5,  thickness:10, transparency:82, description:'Clear twinwall, high light transmission' },
  { id:'poly-twin-16', name:'Polycarbonate Twinwall 16mm', category:'polycarbonate', maxSpanH:1500, maxSpanV:1500, weight:2.5,  thickness:16, transparency:80, description:'Thicker twinwall for longer spans' },
  { id:'poly-solid-6', name:'Polycarbonate Solid 6mm',     category:'polycarbonate', maxSpanH:800,  maxSpanV:900,  weight:1.2,  thickness:6,  transparency:90, description:'Clear solid sheet, maximum light' },
  { id:'trimdek-42',   name:'Trimdek (0.42 BMT)',          category:'colorbond-steel', maxSpanH:1050, maxSpanV:1350, weight:4.5,  thickness:0.42, transparency:0,  description:'Same as roofing, no light transmission' },
  { id:'custom-orb',   name:'Custom Orb (0.35 BMT)',       category:'colorbond-steel', maxSpanH:750,  maxSpanV:1000, weight:3.5,  thickness:0.35, transparency:0,  description:'Traditional corrugated profile' },
  { id:'fc-sheet-6',   name:'Fibre Cement 6mm',            category:'fibre-cement',    maxSpanH:450,  maxSpanV:600,  weight:9.0,  thickness:6,  transparency:0,  description:'Painted fibre cement sheet' },
  { id:'weatherboard', name:'Timber Weatherboard',         category:'timber',          maxSpanH:600,  maxSpanV:600,  weight:6.0,  thickness:20, transparency:0,  description:'Traditional timber cladding' },
  { id:'open-frame',   name:'Open Frame (no cladding)',    category:'open',            maxSpanH:3000, maxSpanV:3000, weight:0,    thickness:0,  transparency:100, description:'Just the frame, no infill' },
] as const;

export function getCladdingType(id: string) {
  return CLADDING_TYPES.find((c) => c.id === id) || CLADDING_TYPES[0];
}

// ── Gable infill calculator ──
// Determines dropper layout based on cladding selection
export function calcGableInfill(
  gableWidth: number,   // m — full width between gable posts
  gableHeight: number,  // m — height at centre (rafter rise)
  _pitch: number,       // degrees (reserved for future pitch-dependent cladding)
  claddingId: string,
  windPressure: number = 0.5  // kPa — default site wind pressure
): import('@/types').GableInfillResult {
  const cladding = getCladdingType(claddingId);
  const maxSpanH = cladding.maxSpanH / 1000;  // mm → m

  // Calculate number of bays (panels) across the gable
  // nBays must be integer, spacing = width / nBays
  let nBays = Math.max(1, Math.ceil(gableWidth / maxSpanH));
  let spacing = gableWidth / nBays;

  // Refine: if spacing is very close to max, add a bay for safety
  if (spacing > maxSpanH * 0.95) {
    nBays += 1;
    spacing = gableWidth / nBays;
  }

  // Total droppers = bay boundaries + 1
  const nDroppers = nBays + 1;
  const panelWidth = spacing;

  // Dropper heights vary along gable — triangular profile
  // Centre dropper = max height, edge droppers = 0 (at posts)
  const dropperHeights: number[] = [];
  for (let i = 0; i < nDroppers; i++) {
    const x = (i / (nDroppers - 1)) * gableWidth;  // position from left
    const halfW = gableWidth / 2;
    const distFromCentre = Math.abs(x - halfW);
    // Height at this position on the triangular gable
    const h = gableHeight * (1 - distFromCentre / halfW);
    dropperHeights.push(Math.max(h, 0));
  }

  const maxDropperH = Math.max(...dropperHeights);
  const avgPanelH = gableHeight * 0.5;  // average height of triangular panel

  // Cladding area (sum of all triangular/rectangular panels)
  const claddingArea = gableWidth * avgPanelH;

  // Sheet count (assume sheets run vertically, 1.0m wide × up to 6.0m long)
  const sheetW = 1.0;  // typical polycarbonate sheet width
  const sheetL = 6.0;  // typical length
  const sheetsNeeded = Math.ceil(claddingArea / (sheetW * sheetL)) * 1.2;  // +20% waste

  // Cold-formed angle trim: perimeter of each panel × nBays
  // Per panel: top (panelWidth) + bottom (panelWidth) + 2 sides (avg height)
  const perimPerPanel = 2 * panelWidth + 2 * avgPanelH;
  const frameAngleM = perimPerPanel * nBays;

  // Engineering: each dropper resists wind on its tributary area
  // Tributary width = half panel each side
  const tribWidth = panelWidth;  // m — conservative
  const tribHeight = maxDropperH;  // m
  const tribArea = tribWidth * tribHeight;
  const windLoadPerDropper = windPressure * tribArea;  // kN
  const windLoadPerM = maxDropperH > 0 ? windLoadPerDropper / maxDropperH : 0;  // kN/m

  // Simple dropper utilisation: axial capacity of C100×50×1.6
  // Capacity ~10kN in compression for short members, ~5kN for 1m+
  const axialCap = maxDropperH > 1.0 ? 5.0 : maxDropperH > 0.5 ? 8.0 : 12.0;  // kN
  const dropperUtil = axialCap > 0 ? (windLoadPerDropper / axialCap * 100) : 0;

  return {
    cladding,
    gableWidth,
    gableHeight,
    nBays,
    dropperSpacing: spacing,
    nDroppers,
    panelWidth,
    dropperHeightMax: maxDropperH,
    claddingArea,
    claddingSheets: Math.ceil(sheetsNeeded),
    frameAngleM,
    dropperEngineering: {
      maxDropperHeight: maxDropperH,
      windLoad: windLoadPerM,
      utilisation: Math.round(dropperUtil * 10) / 10,
      passed: dropperUtil <= 100,
    },
  };
}

// ── Connection types ──
export interface ConnectionType {
  id: string;
  name: string;
  category: string;       // 'post-base' | 'rafter-post' | 'purlin-rafter' | 'ledger-wall' | 'fascia-bracket' | 'gable' | 'general'
  capacity: string;       // description of load capacity
  components: string[];   // list of components needed
  tools: string[];        // tools required
  timeMin: number;        // estimated install time in minutes
  engineerRequired: boolean;
  standard?: string;      // AS standard reference
}

export const CONNECTION_TYPES: ConnectionType[] = [
  // Post bases
  { id:'pb-ub',    name:'U-Bolt Base Plate',        category:'post-base', capacity:'10kN vertical, 5kN horizontal', components:['UB100 gal base plate','M16×120 chem anchors ×2','M12 U-bolt ×2'], tools:[' SDS drill 16mm',' torque wrench'], timeMin:15, engineerRequired:false, standard:'AS4600' },
  { id:'pb-pb',    name:'Pryda Post Base',          category:'post-base', capacity:'15kN vertical, 8kN horizontal', components:['Pryda PB100 post base','M16×150 chem anchors ×4','M12 bolts ×4'], tools:[' SDS drill 16mm',' torque wrench'], timeMin:20, engineerRequired:false, standard:'AS4600' },
  { id:'pb-sp',    name:'Screw Pile',               category:'post-base', capacity:'30kN vertical, 12kN moment',    components:['76mm gal screw pile 1.2m',' welded cap plate'], tools:['excavator or screw pile driver'], timeMin:30, engineerRequired:true, standard:'AS2159' },
  { id:'pb-pf',    name:'Pad Footing',               category:'post-base', capacity:'50kN vertical, 20kN moment',    components:['400×400×300 concrete pad',' N12 rebar cage','M24 anchor bolts ×4'], tools:['excavator',' concrete'], timeMin:120, engineerRequired:true, standard:'AS3600' },
  // Rafter to post
  { id:'rp-bb',    name:'Bolted Bracket',           category:'rafter-post', capacity:'8kN moment, 15kN shear',        components:['C200×60×2.4 bracket plate','M16 bolts ×4',' washers'], tools:['drill 16mm',' spanners'], timeMin:25, engineerRequired:false, standard:'AS4600' },
  { id:'rp-wb',    name:'Welded Bracket (shop)',    category:'rafter-post', capacity:'12kN moment, 20kN shear',       components:['Shop-welded knee bracket','M20 bolts ×4'], tools:['crane or HIAB'], timeMin:10, engineerRequired:false, standard:'AS4100' },
  { id:'rp-ea',    name:'End Apex Bracket',         category:'rafter-post', capacity:'6kN thrust, 10kN vertical',     components:['Apex bracket kit','M12 bolts ×4'], tools:['drill 12mm',' spanners'], timeMin:15, engineerRequired:false, standard:'AS4600' },
  // Purlin to rafter
  { id:'pr-cb',    name:'Cleat Bolted',             category:'purlin-rafter', capacity:'3kN vertical, 1.5kN lateral',  components:['C75×40 cleat','M12 bolts ×2'], tools:['drill 12mm',' spanners'], timeMin:8, engineerRequired:false, standard:'AS4600' },
  { id:'pr-sc',    name:'Screw Fixed',              category:'purlin-rafter', capacity:'2kN vertical, 1kN lateral',    components:['#14×50 self-drilling screws ×4'], tools:['impact driver'], timeMin:5, engineerRequired:false, standard:'AS4600' },
  { id:'pr-br',    name:'Bridging/Stay',            category:'purlin-rafter', capacity:'1kN lateral restraint',        components:[' bridging clip','M10 bolt'], tools:['drill 10mm'], timeMin:5, engineerRequired:false, standard:'AS4600' },
  // Ledger to wall
  { id:'lw-la',    name:'L-Angle Bolted',           category:'ledger-wall', capacity:'5kN/m vertical, 2kN/m horizontal', components:['100×100×10 EA gal angle','M12×120 chem anchors @ 600ctr','M16 bolts'], tools:['SDS drill 12mm',' torque wrench'], timeMin:20, engineerRequired:false, standard:'AS4600' },
  { id:'lw-st',    name:'Standoff Bracket',         category:'ledger-wall', capacity:'3kN/m vertical, 1.5kN/m horizontal', components:['150mm standoff bracket gal','M12×150 chem anchors @ 600ctr'], tools:['SDS drill 12mm'], timeMin:15, engineerRequired:false, standard:'AS4600' },
  // Fascia bracket
  { id:'fb-sb',    name:'Standoff Fascia Bracket',  category:'fascia-bracket', capacity:'2kN/m vertical',            components:['150mm standoff bracket gal','M12×150 chem anchors @ 600ctr'], tools:['SDS drill 12mm'], timeMin:15, engineerRequired:false, standard:'AS4600' },
  { id:'fb-eb',    name:'Extended Box Bracket',     category:'fascia-bracket', capacity:'3kN/m vertical, 800mm reach', components:['Extended box bracket kit','M16 chem anchors @ 600ctr'], tools:['SDS drill 16mm'], timeMin:20, engineerRequired:false, standard:'AS4600' },
  // Gable connections
  { id:'gc-db',    name:'Dropper Bolted',           category:'gable', capacity:'5kN compression',                 components:['C100×50×1.6 dropper','M12 bolts ×2 each end'], tools:['drill 12mm',' spanners'], timeMin:10, engineerRequired:false, standard:'AS4600' },
  { id:'gc-tb',    name:'Top Bracket to Rafter',    category:'gable', capacity:'3kN horizontal',                  components:['Angle bracket','M12 bolts ×4'], tools:['drill 12mm'], timeMin:10, engineerRequired:false, standard:'AS4600' },
  { id:'gc-ac',    name:'Angle Frame Clip',         category:'gable', capacity:'1kN/m (cladding frame)',            components:['25×25×2.5 EA angle','#12 screws @ 300ctr'], tools:['impact driver',' tin snips'], timeMin:8, engineerRequired:false, standard:'AS4600' },
  // General
  { id:'gn-sd',    name:'Self-Drilling Screw',      category:'general', capacity:'1kN per screw',                   components:['#14×50 hex head self-driller gal'], tools:['impact driver'], timeMin:1, engineerRequired:false, standard:'AS4600' },
  { id:'gn-cb',    name:'Chemical Anchor Bolt',     category:'general', capacity:'20kN per bolt (concrete)',        components:['M16×150 chem anchor','resin cartridge'], tools:['SDS drill 16mm','blow pump'], timeMin:10, engineerRequired:false, standard:'AS5216' },
  { id:'gn-wl',    name:'Welded Lap Joint',         category:'general', capacity:'Full section capacity',           components:['Shop welded','NDT inspection'], tools:['welder',' NDT'], timeMin:30, engineerRequired:true, standard:'AS4100' },
];

// Get connections for a member type
export function getConnectionsForMember(memberType: string): ConnectionType[] {
  const map: Record<string, string[]> = {
    post: ['post-base'],
    beam: ['rafter-post'],
    rafter: ['rafter-post'],
    purlin: ['purlin-rafter'],
    ledger: ['ledger-wall'],
    fascia: ['fascia-bracket'],
    gableChord: ['gable'],
    gableDropper: ['gable'],
  };
  const cats = map[memberType] || [];
  return CONNECTION_TYPES.filter((c) => cats.includes(c.category));
}

// ── Building type configs ──
export const BUILDING_TYPES = [
  { id:'pergola',    name:'Pergola',      icon:'◈', description:'Open outdoor structure',      defaultSpan:5.0, defaultDepth:4.0, defaultHeight:2.7, maxSpan:12, maxDepth:15, complexity:'low'  },
  { id:'carport',    name:'Carport',      icon:'◻', description:'Vehicle shelter, roofed',     defaultSpan:6.0, defaultDepth:6.0, defaultHeight:2.7, maxSpan:12, maxDepth:15, complexity:'low'  },
  { id:'verandah',   name:'Verandah',     icon:'▭', description:'Covered walkway / porch',     defaultSpan:3.0, defaultDepth:8.0, defaultHeight:2.7, maxSpan:8,  maxDepth:20, complexity:'med'  },
  { id:'shed',       name:'Shed',         icon:'▣', description:'Enclosed storage building',   defaultSpan:6.0, defaultDepth:8.0, defaultHeight:2.7, maxSpan:20, maxDepth:30, complexity:'med'  },
  { id:'patio',      name:'Patio Cover',  icon:'◰', description:'Attached flat/gable cover',   defaultSpan:6.0, defaultDepth:6.0, defaultHeight:2.7, maxSpan:10, maxDepth:12, complexity:'low'  },
  { id:'deck',       name:'Deck / Patio', icon:'▪', description:'Elevated outdoor platform',   defaultSpan:5.0, defaultDepth:6.0, defaultHeight:2.7, maxSpan:8,  maxDepth:12, complexity:'med'  },
  { id:'extension',  name:'Extension',    icon:'▩', description:'Dwelling room addition',      defaultSpan:4.0, defaultDepth:6.0, defaultHeight:2.7, maxSpan:8,  maxDepth:10, complexity:'high' },
] as const;

// ── Material labels ──
export const MATERIAL_LABELS: Record<string, string> = {
  timber: 'F17 Hardwood / GL18',
  steel: 'C350/C450 Structural RHS/SHS',
  aluminium: '6061-T6 Extruded',
  csection: 'Cold Formed C-Section G450',
};

export const STANDARDS: Record<string, string> = {
  timber: 'AS1684, AS1720.1',
  steel: 'AS4100, AS4600',
  aluminium: 'AS1664, AS/NZS 1170',
  csection: 'AS4600, NZS4600',
};
