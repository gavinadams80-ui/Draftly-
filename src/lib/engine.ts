// ── Engineering Calculation Engine ──
// AS/NZS 4600 (cold-formed), AS4100 (steel), AS1720 (timber), AS1664 (aluminium)

import type { Section, UtilResult, MemberForm, BracingType } from '@/types';

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

// ── Forms actually present in a section pool ──
// Drives the member selectors dynamically so any form the DB supports is offered
// (no hard caps). 'plate' is a detail on a single C-section, so it's available
// whenever open C-sections are present.
const FORM_LABELS: Record<MemberForm, string> = {
  open: 'Single C open',
  plate: 'C + plate infill (boxed)',
  b2b: '2C back-to-back',
  rhs: 'RHS / SHS closed',
};
export function formsAvailableIn(sectionList: Section[]): { value: MemberForm; label: string }[] {
  const present = new Set<MemberForm>();
  for (const s of sectionList || []) {
    const f = classifySectionForm(s.size) as MemberForm; // 'open' | 'b2b' | 'rhs'
    present.add(f);
    if (f === 'open') present.add('plate');
  }
  const order: MemberForm[] = ['open', 'plate', 'b2b', 'rhs'];
  const out = order.filter((f) => present.has(f)).map((f) => ({ value: f, label: FORM_LABELS[f] }));
  return out.length ? out : [{ value: 'open', label: FORM_LABELS.open }];
}

// Lightest passing result that matches the preferred form; falls back to the
// lightest passing of any form so a valid section is always chosen.
export function lightestPassingForm(results: UtilResult[], form: MemberForm): UtilResult | null {
  const want = form === 'plate' ? 'open' : form; // plate sits on open C-sections
  const inForm = results.filter((r) => classifySectionForm(r.sec.size) === want);
  return lightestPassing(inForm) || lightestPassing(results);
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

  const memberForm = options?.memberForm;

  for (let i = 0; i < sectionList.length; i++) {
    const sec = sectionList[i];
    if (!sec || !sec.Z) continue;

    // LTB factor is per-SECTION so a mixed pool (C + B2B + RHS) sizes correctly:
    // RHS/SHS closed = 1.0, back-to-back = 0.85, single C = 0.65 (0.92 when boxed
    // with a plate). This lets the selector offer any section the DB supports.
    const secForm = classifySectionForm(sec.size); // 'open' | 'b2b' | 'rhs'
    const isRHS = secForm === 'rhs';
    let ltbFactor: number;
    if (isRHS) ltbFactor = 1.0;
    else if (secForm === 'b2b') ltbFactor = 0.85;
    else ltbFactor = memberForm === 'plate' ? 0.92 : 0.65; // single C, boxed or open
    if (options?.ltbFactor != null && !isRHS) ltbFactor = options.ltbFactor;

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

// ── Size sections against explicit design actions ──
// Used for PORTAL-frame members, where the demand moment / axial / deflection
// come from a frame analysis (calcPortalFrame) rather than a simple wL²/8 span.
// Deflection scales ~ 1/I from the seed analysis (moment distribution is
// near-constant with section). Columns get a beam-column interaction check.
export function calcUtilisationCustom(
  sectionList: Section[],
  material: string,
  demand: {
    Mdesign: number;      // kNm — design bending moment
    deltaDesign: number;  // mm — deflection computed at seedI
    deltaMax: number;     // mm — deflection limit
    seedI: number;        // mm⁴ — I used to compute deltaDesign
    Naxial?: number;      // kN — design axial compression (columns)
    bucklingLen?: number; // m — effective length for column compression
  },
  options?: { memberForm?: MemberForm }
): UtilResult[] {
  if (!sectionList || !sectionList.length) return [];
  const phi = PHI[material] || 0.85;
  const memberForm = options?.memberForm;
  let formLtb = 1.0;
  if (memberForm === 'open') formLtb = 0.65;
  else if (memberForm === 'plate') formLtb = 0.92;
  else if (memberForm === 'b2b') formLtb = 0.85;
  else if (memberForm === 'rhs') formLtb = 1.0;

  const results: UtilResult[] = [];
  for (const sec of sectionList) {
    if (!sec || !sec.Z) continue;
    const isRHS = classifySectionForm(sec.size) === 'rhs';
    const ltb = isRHS ? 1.0 : formLtb;
    const MCapFull = (phi * (sec.fy || 450) * sec.Z) / 1e6;
    const MCap = MCapFull * ltb;
    const utilBend = MCap > 0 ? (demand.Mdesign / MCap) * 100 : 999;

    // Deflection scales ~ 1/I from the seed analysis
    const delta = demand.deltaDesign * (demand.seedI / (sec.I || 1));
    const utilDefl = demand.deltaMax > 0 ? (delta / demand.deltaMax) * 100 : 0;

    let util: number;
    if (demand.Naxial && demand.Naxial > 0) {
      // Beam-column interaction: M*/φMs + N*/φNc ≤ 1
      const A_mm2 = ((sec.wt || 5) / 7850) * 1e6; // area from mass/density
      const Ns = (phi * A_mm2 * (sec.fy || 450)) / 1000; // kN squash capacity
      let alpha = 1;
      if (demand.bucklingLen) {
        const r = Math.sqrt((sec.I || 1) / A_mm2); // mm radius of gyration
        const lambda = (demand.bucklingLen * 1000) / r;
        alpha = 1 / (1 + Math.pow(lambda / 100, 2)); // simple column-curve reduction
      }
      const Nc = Ns * alpha;
      const interaction =
        (MCap > 0 ? demand.Mdesign / MCap : 9) + (Nc > 0 ? demand.Naxial / Nc : 9);
      util = Math.max(interaction * 100, utilDefl);
    } else {
      util = Math.max(utilBend, utilDefl);
    }

    const passed = util <= 100;
    const color = util < 70 ? '#4caf50' : util < 85 ? '#8bc34a' : util < 100 ? '#ff9800' : '#f44336';
    results.push({
      sec, util, passed, color,
      M: demand.Mdesign, MCap, delta, deltaMax: demand.deltaMax,
      label: sec.size + ' — ' + util.toFixed(1) + '%',
      MCapFull, ltbFactor: ltb, isRHS,
    });
  }
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

// ── Bracing advisory ──
// Material- and openness-aware guidance for how a shed-type structure should be
// braced (AS practice): C-section frames are flexible and need more bracing
// (cross + knee/apex + fly bracing); RHS frames are stiff and can rely on rigid
// portal action with limited end-bay bracing. Open-front structures lose the
// front-wall diaphragm so longitudinal load must be carried by wall/roof bracing.
const OPEN_FRONT_TYPES = ['carport', 'pergola', 'patio', 'verandah', 'deck'];
export function bracingAdvice(opts: {
  material: string;
  buildingType: string;
  attachment: string;
  span: number;       // m
  windKpa: number;
  openSides?: string[];  // faces NOT fixed to the dwelling (from per-side detail)
}): { recommended: BracingType; rationale: string; flyBrace: string | null; longitudinal: string | null; openSides: string | null } {
  const isRHS = opts.material === 'steel';
  const openFront = OPEN_FRONT_TYPES.includes(opts.buildingType);
  const attached = opts.attachment === 'attached' || opts.attachment === 'three-side';
  const bigSpan = opts.span > 7;
  const highWind = opts.windKpa >= 1.0;

  let recommended: BracingType;
  let rationale: string;
  if (attached) {
    recommended = 'tied-to-wall';
    rationale = `${opts.attachment === 'three-side' ? 'Three-side attached' : 'Attached'} — the existing dwelling wall${opts.attachment === 'three-side' ? 's' : ''} provide${opts.attachment === 'three-side' ? '' : 's'} the primary lateral restraint, so tie back to the house with adequate fixings${openFront ? ' and still brace the open front bay (cross-brace + roof plane)' : ''}. The ${isRHS ? 'RHS' : 'C-section'} frames carry gravity as before${!isRHS ? ', and still need fly bracing' : ''}.`;
  } else if (isRHS) {
    recommended = 'moment-frame';
    rationale = `RHS frames are stiff and strong — rely on rigid portal (moment) action${
      openFront ? ', plus limited rod cross-bracing in the rear/side end bays and roof plane to keep the front clear'
                : ', with light end-bay rod bracing'
    }.`;
  } else {
    recommended = openFront ? 'cross-brace' : bigSpan ? 'knee-brace' : 'cross-brace';
    rationale = `C-section frames are lighter and more flexible — bare moment-frame sway is usually too large. Combine ${
      openFront ? 'cross-bracing in the side/rear end bays + roof-plane bracing' : 'end-bay cross-bracing'
    }${bigSpan ? ' and knee/apex braces at the portals' : ''}${highWind ? '; heavier layout for the high wind pressure' : ''}.`;
  }

  const flyBrace = !isRHS
    ? `Provide fly bracing from the C-section column/rafter flanges to the purlins/girts at ≤ ${bigSpan ? '1.5' : '2.5'} m centres to restrain flange (lateral-torsional) buckling — the 0.65 LTB factor assumes this restraint is present.`
    : null;

  const longitudinal = openFront
    ? `Open-front: the missing front wall removes diaphragm action along the building. Carry longitudinal wind with diagonal cross-bracing in the side/rear walls + roof-plane bracing between frames, or make one or more bays a full moment frame.`
    : null;

  // When per-side detail is available, the dwelling restrains the attached faces;
  // only the OPEN faces need a bracing/restraint scheme designed for them.
  const openSides = opts.openSides && opts.openSides.length
    ? `Per-side attachment: the dwelling restrains the attached face${attached ? 's' : ''}; brace the open side${opts.openSides.length > 1 ? 's' : ''} (${opts.openSides.join(', ')}) — these carry the full lateral demand in their direction.`
    : null;

  return { recommended, rationale, flyBrace, longitudinal, openSides };
}

// ── Bracing factor from attachment ──
// Coarse, single-scalar restraint keyed off the 3-value enum. Used for the
// gravity span reduction and as the FALLBACK for lateral demand when no per-side
// attachment detail is available.
export function getBracingFactor(attachment: string): number {
  if (attachment === 'three-side') return 0.35;
  if (attachment === 'attached') return 0.55;
  return 1.0;
}

// ── Lateral restraint from dwelling attachment (per-side) ──
// The coarse `attachment` enum collapses the real per-face detail the user enters
// in Intelligence into one number, then applies it equally to both directions.
// When the handoff supplies WHICH faces fix to the dwelling, resolve the restraint
// PER DIRECTION. A wall bolted to the rigid dwelling stops the structure
// translating perpendicular to that wall, so:
//   • the long eaves walls (front/back, parallel to the ridge) restrain the
//     TRANSVERSE direction — the portal-frame sway across the span; and
//   • the gable end walls (left/right) restrain the LONGITUDINAL direction —
//     racking along the building length.
// Open (non-attached) sides give no restraint and must be braced. Each factor
// scales the design wind demand in that direction (1.0 = unrestrained / full).
export interface LateralRestraint {
  transverse: number;       // factor on the in-plane (frame-sway) wind demand
  longitudinal: number;     // factor on the end-wall / longitudinal wind demand
  attachedSides: string[];  // faces fixed to the dwelling (perSide only)
  openSides: string[];      // faces that must be braced (perSide only)
  perSide: boolean;         // true when resolved from real per-side data
}

// Faces grouped by the bracing direction each one restrains.
export const TRANSVERSE_SIDES = ['front', 'back'] as const;   // long eaves walls (∥ ridge)
export const LONGITUDINAL_SIDES = ['left', 'right'] as const; // gable end walls (⊥ ridge)
const LATERAL_SIDES = [...TRANSVERSE_SIDES, ...LONGITUDINAL_SIDES] as const;

// One restrained wall in a direction ≈ 0.55× demand, both opposite walls ≈ 0.35×
// — calibrated to the legacy coarse factors for 'attached' and 'three-side' so a
// single-side attachment keeps the same demand it had before, per direction.
function pairRestraintFactor(attachedCount: number): number {
  if (attachedCount >= 2) return 0.35;
  if (attachedCount === 1) return 0.55;
  return 1.0;
}

export function getLateralRestraint(
  attachment: string,
  connectionSides?: Record<string, boolean> | null,
): LateralRestraint {
  const attached = connectionSides
    ? LATERAL_SIDES.filter((s) => connectionSides[s])
    : [];
  // Per-side detail present and meaningful → resolve each direction independently.
  if (attached.length > 0) {
    const tN = TRANSVERSE_SIDES.filter((s) => connectionSides![s]).length;
    const lN = LONGITUDINAL_SIDES.filter((s) => connectionSides![s]).length;
    return {
      transverse: pairRestraintFactor(tN),
      longitudinal: pairRestraintFactor(lN),
      attachedSides: attached.slice(),
      openSides: LATERAL_SIDES.filter((s) => !connectionSides![s]),
      perSide: true,
    };
  }
  // Fallback: no usable per-side data — apply the coarse enum factor to both
  // directions (legacy behaviour) so imports without attachmentDetail are unchanged.
  const f = getBracingFactor(attachment);
  return { transverse: f, longitudinal: f, attachedSides: [], openSides: [], perSide: false };
}

// ── Calc self-checks for the per-side lateral restraint ──
// No test runner in this repo (TS is the correctness gate), so these are pure,
// deterministic assertions that can be executed standalone (see scripts/) or
// imported into a future test harness. Each returns {name, pass}.
export function runLateralRestraintChecks(): { name: string; pass: boolean; detail: string }[] {
  const out: { name: string; pass: boolean; detail: string }[] = [];
  const approx = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const check = (name: string, pass: boolean, detail = '') => out.push({ name, pass, detail });

  // 1. No per-side data → falls back to the coarse enum, equal in both directions.
  const free = getLateralRestraint('freestanding');
  check('freestanding fallback = 1.0 both dirs',
    approx(free.transverse, 1.0) && approx(free.longitudinal, 1.0) && !free.perSide,
    `t=${free.transverse} l=${free.longitudinal} perSide=${free.perSide}`);
  const att = getLateralRestraint('attached');
  check('attached fallback = 0.55 both dirs',
    approx(att.transverse, 0.55) && approx(att.longitudinal, 0.55) && !att.perSide,
    `t=${att.transverse} l=${att.longitudinal}`);
  const three = getLateralRestraint('three-side');
  check('three-side fallback = 0.35 both dirs',
    approx(three.transverse, 0.35) && approx(three.longitudinal, 0.35), `t=${three.transverse} l=${three.longitudinal}`);

  // 2. Empty per-side object → still the coarse fallback (nothing actually attached).
  const emptyObj = getLateralRestraint('attached', { front: false, back: false, left: false, right: false });
  check('all-false sides → coarse fallback',
    !emptyObj.perSide && approx(emptyObj.transverse, 0.55), `perSide=${emptyObj.perSide} t=${emptyObj.transverse}`);

  // 3. Lean-to attached on the BACK long wall only: transverse restrained (0.55),
  //    longitudinal OPEN (1.0) — the key bug the old single scalar masked.
  const backOnly = getLateralRestraint('attached', { back: true });
  check('back-only: transverse 0.55, longitudinal 1.0 (open ends)',
    approx(backOnly.transverse, 0.55) && approx(backOnly.longitudinal, 1.0) && backOnly.perSide,
    `t=${backOnly.transverse} l=${backOnly.longitudinal} open=[${backOnly.openSides}]`);

  // 4. Attached on one gable END only: longitudinal restrained, transverse open.
  const leftOnly = getLateralRestraint('attached', { left: true });
  check('left-only: transverse 1.0 (open), longitudinal 0.55',
    approx(leftOnly.transverse, 1.0) && approx(leftOnly.longitudinal, 0.55),
    `t=${leftOnly.transverse} l=${leftOnly.longitudinal}`);

  // 5. Three-side wrap {back,left,right}: one long wall + both ends.
  //    Transverse from back (1 wall → 0.55); longitudinal from both ends (→ 0.35).
  const wrap = getLateralRestraint('three-side', { back: true, left: true, right: true, front: false });
  check('wrap {back,left,right}: transverse 0.55, longitudinal 0.35',
    approx(wrap.transverse, 0.55) && approx(wrap.longitudinal, 0.35) &&
    wrap.openSides.length === 1 && wrap.openSides[0] === 'front',
    `t=${wrap.transverse} l=${wrap.longitudinal} open=[${wrap.openSides}]`);

  // 6. Both long walls attached → transverse fully restrained (0.35).
  const bothLong = getLateralRestraint('three-side', { front: true, back: true });
  check('front+back: transverse 0.35',
    approx(bothLong.transverse, 0.35) && approx(bothLong.longitudinal, 1.0),
    `t=${bothLong.transverse} l=${bothLong.longitudinal}`);

  return out;
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
  gableWidth: number,       // m — full width between gable posts
  gableHeight: number,      // m — height at centre (full rafter rise to ridge)
  pitch: number,            // degrees
  claddingId: string,
  windPressure: number = 0.5, // kPa — default site wind pressure
  rafterDepthMm: number = 0,  // mm — rafter section depth (subtracts from available height)
  chordDepthMm:  number = 0   // mm — bottom chord section depth (subtracts from base)
): import('@/types').GableInfillResult {
  const cladding = getCladdingType(claddingId);
  const maxSpanH = cladding.maxSpanH / 1000;  // mm → m

  // Net clear height at centre = gableHeight minus rafter and chord depths
  // Rafter bottom face is approximately (rafterDepth/2)/cos(pitch) below the centreline
  const pitchRad = pitch * Math.PI / 180;
  const rafterClearance = (rafterDepthMm / 1000) / Math.cos(pitchRad); // vertical clearance from rafter
  const chordClearance  = chordDepthMm / 1000;
  const netGableHeight  = Math.max(0.1, gableHeight - rafterClearance - chordClearance);

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

  // Dropper heights vary along gable — NET clear height between rafter and bottom chord
  const dropperHeights: number[] = [];
  for (let i = 0; i < nDroppers; i++) {
    const x = (i / (nDroppers - 1)) * gableWidth;
    const halfW = gableWidth / 2;
    const distFromCentre = Math.abs(x - halfW);
    // Gross height at this x, then subtract steel member depths
    const hGross = gableHeight * (1 - distFromCentre / halfW);
    const hNet   = Math.max(0, hGross - rafterClearance - chordClearance);
    dropperHeights.push(hNet);
  }

  const maxDropperH = Math.max(...dropperHeights);
  const avgPanelH = netGableHeight * 0.5;  // average NET height of panels

  // Cladding area — based on NET clear opening
  const claddingArea = gableWidth * avgPanelH;

  // Sheet count (assume sheets run vertically, 1.0m wide × up to 6.0m long)
  const sheetW = 1.0;  // typical polycarbonate sheet width
  const sheetL = 6.0;  // typical length
  const sheetsNeeded = Math.ceil(claddingArea / (sheetW * sheetL)) * 1.2;  // +20% waste

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
