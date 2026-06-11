// ── Structural Computations sheet ──
// A transparent, engineer-reviewable calc set. Every value is shown with its
// formula/substitution and its BASIS: a standard reference, a project input, or
// an explicit ASSUMPTION the reviewing engineer is expected to confirm or amend.
// Nothing is hidden — the constants come straight from engine.ts (single source
// of truth) so the sheet can never drift from what the app actually computed.
//
// buildComputations() assembles the calc as structured sections/rows;
// generateComputationsSheetSVGs() paginates them onto A3-style inner SVGs that
// withTitleBlock() frames for the drawing set + PDF.

import type { ProjectConfig, UtilResult } from '@/types';
import {
  LOAD_KPA_ULTIMATE, LOAD_KPA_SERVICE, DEFLECT_LIMIT_TOTAL, DEFLECT_LIMIT_LIVE,
  PHI, LTB_FACTORS, BRACING_FACTORS,
  CEILING_SCREW_SHEAR_KN, CONTAINED_FIXING_SHEAR_KN,
  PLY_DENSITY_KG_M3, TIMBER_DENSITY_KG_M3, BATTEN_W_M, BATTEN_D_M,
  CEILING_INSULATION_KPA, CEILING_TRIB_WALL_FRACTION, WEB_BEARING,
  calcPlyCeilingDiaphragm,
  type LateralRestraint, type PlyDiaphragmResult,
} from '@/lib/engine';

// kind drives the colour + tag so an engineer can see at a glance what to review.
export type RowKind = 'normal' | 'assumed' | 'standard' | 'input' | 'pass' | 'fail' | 'note';
export interface CompRow {
  ref?: string;    // symbol or clause
  desc: string;    // what it is
  expr?: string;   // formula / substitution OR the basis note
  value?: string;  // formatted result
  kind?: RowKind;
}
export interface CompSection {
  heading: string;
  rows: CompRow[];
}

export interface ComputationMember {
  label: string;
  result: UtilResult | null;
  span: number;     // m
  spacing: number;  // m — tributary width
  demandNote?: string; // overrides the wL²/8 note (e.g. portal frame analysis)
}

export interface ComputationsInput {
  config: ProjectConfig;
  standoff: number;        // mm
  actualSpan: number;      // m — structural span (width − standoff both sides)
  frameSpacing: number;    // m
  restraint: LateralRestraint;
  members: ComputationMember[];
  H_wind: number;          // kN — transverse wind on one frame at the eaves
  H_long: number;          // kN — longitudinal wind on the end wall
  plyDiaphragm: PlyDiaphragmResult | null;
}

const n2 = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '—');
const n1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : '—');
const n0 = (v: number) => (Number.isFinite(v) ? v.toFixed(0) : '—');

const MATERIAL_STANDARD: Record<string, string> = {
  timber: 'AS1720.1', steel: 'AS4100', aluminium: 'AS1664', csection: 'AS/NZS 4600',
};

// ── Assemble the computation as sections ──
export function buildComputations(inp: ComputationsInput): CompSection[] {
  const { config } = inp;
  const phi = PHI[config.constructionType] ?? 0.85;
  const matStd = MATERIAL_STANDARD[config.constructionType] ?? '—';
  const sections: CompSection[] = [];

  // ── 1 · Design basis & assumptions ──
  const basis: CompRow[] = [
    { ref: 'q_ult', desc: 'Ultimate roof UDL (1.2G + 1.5Q)', expr: 'ASSUMED roof G/Q — confirm site loads', value: `${n2(LOAD_KPA_ULTIMATE)} kPa`, kind: 'assumed' },
    { ref: 'q_svc', desc: 'Serviceability UDL (G + Q)', expr: 'ASSUMED roof G/Q — confirm site loads', value: `${n2(LOAD_KPA_SERVICE)} kPa`, kind: 'assumed' },
    { ref: 'Δ_lim', desc: 'Deflection limit (total / live)', expr: 'AS/NZS 1170.0 serviceability', value: `L/${DEFLECT_LIMIT_TOTAL} · L/${DEFLECT_LIMIT_LIVE}`, kind: 'standard' },
    { ref: 'φ', desc: `Capacity reduction factor (${config.constructionType})`, expr: matStd, value: n2(phi), kind: 'standard' },
    { ref: 'k_LTB', desc: 'LTB factor — open C / +plate / B2B / RHS', expr: 'ASSUMED — simplified; cf. AS/NZS 4600 §3.3', value: `${LTB_FACTORS.open} / ${LTB_FACTORS.plate} / ${LTB_FACTORS.b2b} / ${LTB_FACTORS.rhs}`, kind: 'assumed' },
    { ref: 'k_att', desc: 'Attachment restraint — free / attached / 3-side', expr: 'ASSUMED restraint factors', value: `${BRACING_FACTORS.freestanding} / ${BRACING_FACTORS.attached} / ${BRACING_FACTORS.threeSide}`, kind: 'assumed' },
    { ref: 'p_w', desc: 'Design wind pressure (ultimate, net)', expr: 'project input', value: `${n2(config.windPressureKpa)} kPa`, kind: 'input' },
  ];
  // Geometry inputs
  basis.push(
    { ref: 'W', desc: 'Structural span (width − standoff both sides)', expr: `${n2(config.width)} − 2×${n0(inp.standoff)}mm`, value: `${n2(inp.actualSpan)} m`, kind: 'input' },
    { ref: 'D', desc: 'Building length / depth', expr: 'project input', value: `${n2(config.depth)} m`, kind: 'input' },
    { ref: 'H', desc: 'Eaves height · pitch', expr: 'project input', value: `${n2(config.height)} m · ${n0(config.pitch)}°`, kind: 'input' },
  );
  // Ceiling-diaphragm assumptions (only when that scheme is in play)
  if (inp.plyDiaphragm) {
    basis.push(
      { ref: 'Q_scr', desc: 'Design shear per ceiling screw', expr: 'ASSUMED — confirm fastener + ply bearing', value: `${n1(CEILING_SCREW_SHEAR_KN)} kN`, kind: 'assumed' },
      { ref: 'Q_bat', desc: 'Design shear per contained timber batten', expr: 'ASSUMED — confirm vs local C-section web bearing', value: `${n1(CONTAINED_FIXING_SHEAR_KN)} kN`, kind: 'assumed' },
      { ref: 'h_trib', desc: 'Wall-height fraction reaching the ceiling plane', expr: 'ASSUMED tributary rule', value: n2(CEILING_TRIB_WALL_FRACTION), kind: 'assumed' },
      { ref: 'ρ', desc: 'Densities — ply / timber batten', expr: 'ASSUMED material properties', value: `${n0(PLY_DENSITY_KG_M3)} / ${n0(TIMBER_DENSITY_KG_M3)} kg/m³`, kind: 'assumed' },
      { ref: 'batt', desc: 'Batten cross-section · ceiling insulation', expr: 'ASSUMED', value: `${n0(BATTEN_W_M * 1000)}×${n0(BATTEN_D_M * 1000)} mm · ${n2(CEILING_INSULATION_KPA)} kPa`, kind: 'assumed' },
      { ref: 'R_w', desc: 'Web-bearing coeffs C / Cr / Cn / Ch · φ', expr: 'ASSUMED — AS/NZS 4600 §3.3.6, lipped-C IOF', value: `${WEB_BEARING.C}/${WEB_BEARING.Cr}/${WEB_BEARING.Cn}/${WEB_BEARING.Ch} · ${n2(WEB_BEARING.phi)}`, kind: 'assumed' },
    );
  }
  sections.push({ heading: '1 · Design basis & assumptions', rows: basis });

  // ── 2 · Member design ──
  inp.members.forEach((m, i) => {
    const r = m.result;
    const rows: CompRow[] = [];
    if (!r) {
      rows.push({ desc: 'No passing section found in the pool.', kind: 'fail' });
      sections.push({ heading: `${2 + i} · ${m.label}`, rows });
      return;
    }
    const sec = r.sec;
    const wU = LOAD_KPA_ULTIMATE * m.spacing;
    const wS = LOAD_KPA_SERVICE * m.spacing;
    const utilBend = r.MCap > 0 ? (r.M / r.MCap) * 100 : 999;
    const utilDefl = r.deltaMax > 0 ? (r.delta / r.deltaMax) * 100 : 0;
    rows.push(
      { ref: 'sec', desc: 'Selected section', expr: `Z=${n0(sec.Z)}mm³ · I=${(sec.I / 1e6).toFixed(2)}e6mm⁴ · f_y=${n0(sec.fy)}MPa`, value: sec.size, kind: 'normal' },
      { ref: 'L', desc: 'Design span', value: `${n2(m.span)} m`, kind: 'input' },
      { ref: 's', desc: 'Tributary width', value: `${n2(m.spacing)} m`, kind: 'input' },
      { ref: 'w*', desc: 'Ultimate line load', expr: `q_ult·s = ${n2(LOAD_KPA_ULTIMATE)}×${n2(m.spacing)}`, value: `${n2(wU)} kN/m`, kind: 'normal' },
      { ref: 'M*', desc: 'Design bending moment', expr: m.demandNote ?? `w*·L²/8 = ${n2(wU)}×${n2(m.span)}²/8`, value: `${n2(r.M)} kNm`, kind: 'normal' },
      { ref: 'φM_s', desc: `Bending capacity (k_LTB=${n2(r.ltbFactor ?? 1)})`, expr: `φ·f_y·Z·k_LTB`, value: `${n2(r.MCap)} kNm`, kind: 'normal' },
      { ref: '', desc: 'Bending utilisation  M*/φM_s', value: `${n0(utilBend)} %`, kind: utilBend <= 100 ? 'pass' : 'fail' },
      { ref: 'δ', desc: `Deflection vs limit (L/${DEFLECT_LIMIT_TOTAL})`, expr: `5·w_s·L⁴/384EI  (w_s=${n2(wS)} kN/m)`, value: `${n1(r.delta)} / ${n1(r.deltaMax)} mm`, kind: 'normal' },
      { ref: '', desc: 'Deflection utilisation', value: `${n0(utilDefl)} %`, kind: utilDefl <= 100 ? 'pass' : 'fail' },
      { ref: '', desc: 'Governing utilisation', value: `${n0(r.util)} %  ${r.passed ? 'PASS' : 'FAIL'}`, kind: r.passed ? 'pass' : 'fail' },
    );
    sections.push({ heading: `${2 + i} · ${m.label} — ${sec.size}`, rows });
  });

  // ── Lateral stability ──
  const ln = 2 + inp.members.length;
  const lat: CompRow[] = [
    { ref: '', desc: 'Bracing scheme', value: config.bracing, kind: 'input' },
    { ref: 'k_t / k_l', desc: `Restraint (transverse / longitudinal)${inp.restraint.perSide ? ' — per-side' : ' — from attachment enum'}`, expr: inp.restraint.perSide ? `attached: ${inp.restraint.attachedSides.join(', ') || 'none'}` : config.attachment, value: `${n2(inp.restraint.transverse)} / ${n2(inp.restraint.longitudinal)}`, kind: 'assumed' },
    { ref: 'H_w', desc: 'Transverse wind on one frame (eaves)', expr: `p_w·spacing·h·k_t`, value: `${n1(inp.H_wind)} kN`, kind: 'normal' },
    { ref: 'H_l', desc: 'Longitudinal wind on the end wall', expr: `p_w·A_end·k_l`, value: `${n1(inp.H_long)} kN`, kind: 'normal' },
  ];
  const pd = inp.plyDiaphragm;
  if (pd) {
    lat.push(
      { ref: 'v_T/v_L', desc: 'Diaphragm unit shear (transverse / long.)', expr: `(w·L/2)/depth`, value: `${n2(pd.vTransverse)} / ${n2(pd.vLongitudinal)} kN/m`, kind: 'normal' },
      { ref: 'v*', desc: `Governing unit shear (${pd.governing})`, value: `${n2(pd.vDemand)} kN/m`, kind: 'normal' },
      { ref: 'fixing', desc: `Detail — ${pd.detail}`, expr: `Q/v* → spacing (Q=${n1(pd.perFixingKN)} kN)`, value: `${pd.plyThicknessMm}mm ply @ ${pd.edgeSpacingMm}mm`, kind: pd.edgeSpacingOk ? 'pass' : 'fail' },
      ...(pd.detail === 'timber-battened' && pd.webBearingKN > 0 ? [
        { ref: 'φR_w', desc: `Steel web bearing per batten (AS/NZS 4600 §3.3.6)`, expr: `vs timber ${n1(CONTAINED_FIXING_SHEAR_KN)} kN → ${pd.containedGovern} governs`, value: `${n1(pd.webBearingKN)} kN`, kind: (pd.containedGovern === 'steel' ? 'assumed' : 'pass') as RowKind },
      ] : []),
      { ref: 'C', desc: 'Diaphragm chord force (perimeter purlin)', expr: `w·L²/8 / depth`, value: `${n1(pd.chordForceKN)} kN`, kind: 'normal' },
      { ref: 'mass', desc: 'Ceiling mass vs 12mm screw-fixed baseline', expr: `ply + battens`, value: `${n0(pd.totalMassKg)} / ${n0(pd.baseline12mmMassKg)} kg`, kind: 'note' },
    );
  }
  sections.push({ heading: `${ln} · Lateral stability & bracing`, rows: lat });

  return sections;
}

// ── Render the sections onto one or more inner SVGs (paginated) ──
// Matches the BOM sheet geometry (760×560) so withTitleBlock() frames it the
// same way. Returns one inner-SVG string per page.
export function generateComputationsSheetSVGs(sections: CompSection[]): string[] {
  const W = 760, H = 560;
  const mono = 'DM Mono,monospace';
  const dim = '#6b7090', text = '#c8cce0', accent = '#c9a84c';
  const assumed = '#e0a35c', green = '#5fbf6a', red = '#e06b6b', blue = '#6aa0e0', line = '#3a3d48';
  const x0 = 24, x1 = W - 24;
  const xRef = x0 + 4, xDesc = x0 + 64, xExpr = x0 + 300, xVal = x1 - 4;
  const top = 56, rowH = 16, bottom = H - 28;

  const colour = (k?: RowKind) =>
    k === 'assumed' ? assumed : k === 'pass' ? green : k === 'fail' ? red : k === 'input' ? blue : k === 'standard' ? dim : text;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Greedy pack sections into pages by available height.
  type Item = { type: 'head' | 'row'; head?: string; row?: CompRow };
  const items: Item[] = [];
  for (const s of sections) {
    items.push({ type: 'head', head: s.heading });
    for (const r of s.rows) items.push({ type: 'row', row: r });
  }

  const pages: string[][] = [];
  let cur: string[] = [];
  let y = top;
  const flush = () => { if (cur.length) { pages.push(cur); cur = []; y = top; } };

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const stepH = it.type === 'head' ? rowH + 10 : rowH;
    // Avoid orphaning a heading at the very bottom.
    const lookahead = it.type === 'head' ? stepH + rowH * 2 : stepH;
    if (y + lookahead > bottom) flush();
    if (it.type === 'head') {
      y += 8;
      cur.push(`<line x1="${x0}" y1="${y - 9}" x2="${x1}" y2="${y - 9}" stroke="${accent}" stroke-width="1"/>`);
      cur.push(`<text x="${xRef}" y="${y}" font-family="${mono}" font-size="10" fill="${accent}" font-weight="700">${esc(it.head!.toUpperCase())}</text>`);
      y += rowH + 2;
    } else {
      const r = it.row!;
      const c = colour(r.kind);
      if (r.ref) cur.push(`<text x="${xRef}" y="${y}" font-family="${mono}" font-size="8" fill="${dim}">${esc(r.ref)}</text>`);
      cur.push(`<text x="${xDesc}" y="${y}" font-family="${mono}" font-size="8.5" fill="${text}">${esc(r.desc)}</text>`);
      if (r.expr) cur.push(`<text x="${xExpr}" y="${y}" font-family="${mono}" font-size="8" fill="${r.kind === 'assumed' ? assumed : dim}">${esc(r.expr)}</text>`);
      if (r.value) cur.push(`<text x="${xVal}" y="${y}" text-anchor="end" font-family="${mono}" font-size="9" fill="${c}" font-weight="${r.kind === 'pass' || r.kind === 'fail' ? 700 : 400}">${esc(r.value)}</text>`);
      cur.push(`<line x1="${x0}" y1="${y + 4}" x2="${x1}" y2="${y + 4}" stroke="${line}" stroke-width="0.3"/>`);
      y += rowH;
    }
  }
  flush();

  const total = pages.length;
  return pages.map((body, idx) => {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">`;
    svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;
    svg += `<text x="${x0}" y="32" font-family="${mono}" font-size="14" fill="${text}" font-weight="700">STRUCTURAL COMPUTATIONS</text>`;
    svg += `<text x="${x1}" y="32" text-anchor="end" font-family="${mono}" font-size="9" fill="${dim}">For engineer review · sheet ${idx + 1} of ${total}</text>`;
    svg += body.join('');
    // Legend / disclaimer footer
    svg += `<text x="${x0}" y="${H - 16}" font-family="${mono}" font-size="8" fill="${assumed}">ASSUMED values are placeholders for the reviewing engineer to confirm or amend.</text>`;
    svg += `<text x="${x1}" y="${H - 16}" text-anchor="end" font-family="${mono}" font-size="8" fill="${dim}">input · standard · assumed · pass/fail colour-coded</text>`;
    svg += `</svg>`;
    return svg;
  });
}

// ── Self-checks ──
export function runComputationsChecks(): { name: string; pass: boolean; detail: string }[] {
  const out: { name: string; pass: boolean; detail: string }[] = [];
  const check = (name: string, pass: boolean, detail = '') => out.push({ name, pass, detail });

  const sample = buildComputations({
    config: { buildingType: 'patio', constructionType: 'csection', attachment: 'three-side', roofType: 'gable',
      width: 6, depth: 5, height: 2.7, pitch: 10, portalFrameCount: 3, intermediateFrame: 'tied-rafter',
      baseFixity: 'pinned', bracing: 'moment-frame', windPressureKpa: 0.7 },
    standoff: 150, actualSpan: 5.7, frameSpacing: 2.5,
    restraint: { transverse: 0.55, longitudinal: 0.35, attachedSides: ['back', 'left', 'right'], openSides: ['front'], perSide: true },
    members: [], H_wind: 4, H_long: 6, plyDiaphragm: null,
  });

  check('produces a design-basis section first',
    sample.length > 0 && /design basis/i.test(sample[0].heading), sample[0]?.heading ?? 'none');

  // Every ASSUMED row must carry a basis note (no unlabelled assumption).
  const assumedRows = sample.flatMap((s) => s.rows).filter((r) => r.kind === 'assumed');
  const allLabelled = assumedRows.length > 0 && assumedRows.every((r) => (r.expr ?? '').trim().length > 0);
  check('every ASSUMED row has a basis note', allLabelled, `${assumedRows.length} assumed rows`);

  // Renders to at least one page of valid SVG.
  const svgs = generateComputationsSheetSVGs(sample);
  check('renders ≥1 SVG page', svgs.length >= 1 && svgs[0].startsWith('<svg'), `${svgs.length} page(s)`);

  // With a ply ceiling diaphragm, its ASSUMED constants + diaphragm rows surface.
  const ply = calcPlyCeilingDiaphragm({ width: 6, depth: 5, wallHeight: 2.7, rise: 0.5, windKpa: 0.7, transverse: 0.55, longitudinal: 0.35, detail: 'timber-battened' });
  const withPly = buildComputations({
    config: { buildingType: 'patio', constructionType: 'csection', attachment: 'three-side', roofType: 'gable',
      width: 6, depth: 5, height: 2.7, pitch: 10, portalFrameCount: 3, intermediateFrame: 'tied-rafter',
      baseFixity: 'pinned', bracing: 'ply-ceiling-diaphragm', windPressureKpa: 0.7 },
    standoff: 150, actualSpan: 5.7, frameSpacing: 2.5,
    restraint: { transverse: 0.55, longitudinal: 0.35, attachedSides: ['back', 'left', 'right'], openSides: ['front'], perSide: true },
    members: [], H_wind: 4, H_long: 6, plyDiaphragm: ply,
  });
  const flatRefs = withPly.flatMap((s) => s.rows.map((r) => r.ref ?? ''));
  check('ply-diaphragm: ceiling assumptions + shear rows present',
    flatRefs.includes('Q_bat') && flatRefs.includes('v*') && flatRefs.includes('fixing'),
    flatRefs.filter((r) => ['Q_scr', 'Q_bat', 'v*', 'fixing', 'mass'].includes(r)).join(','));

  return out;
}
