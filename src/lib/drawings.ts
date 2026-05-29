// ── Three-View Section Drawing Engine v3 ──
// Ported from Draftly — orthographic end/side/plan views per AS/NZS 4600
// C-sections: flange lip returns + bend radius r=t
// RHS/SHS: hollow rectangle with correct corner radii
// Plate infill: flat plate shown covering C-section open face → boxed section
// B2B: two C-sections joined web-to-web
// F2F: two C-sections joined open-face to open-face → box section

import type { Section, MemberForm } from '@/types';

interface ParsedDims {
  type: 'C' | 'C2B' | 'C2F' | 'SHS' | 'RHS' | 'RECT';
  d: number;
  b: number;
  t: number;
  lip: number;
}

// ── Parse section size string into dimensions ──
function parseSectionDims(sec: Section): ParsedDims {
  const size = sec.size || '';
  let d = sec.d || 100;
  let t = sec.t || 2.0;
  let b = sec.b || null;

  if (!b) {
    const nums = size.replace(/[^\d.×x\s]/g, ' ').trim()
      .split(/[\s×x]+/).map(Number).filter((n) => n > 0);

    if (size.match(/^C/)) {
      d = nums[0] || d;
      b = nums[1] || 50;
      t = nums[2] || t;
      return { type: 'C', d, b, t, lip: Math.max(10, (b as number) * 0.22) };
    } else if (size.match(/^SHS/)) {
      d = nums[0] || d;
      b = nums[0] || d;
      t = nums[2] || t;
      return { type: 'SHS', d, b, t, lip: 0 };
    } else if (size.match(/^RHS/)) {
      d = nums[0] || d;
      b = nums[1] || 50;
      t = nums[2] || t;
      return { type: 'RHS', d, b, t, lip: 0 };
    } else if (size.match(/^2\//) || size.match(/^2×/) || size.match(/^2C/)) {
      const inner = size.replace(/^2\//, '').replace(/^2×/, '').replace(/^2/, '');
      const inums = inner.replace(/[^\d.×x\s]/g, ' ').trim()
        .split(/[\s×x]+/).map(Number).filter((n) => n > 0);
      d = inums[0] || d;
      b = inums[1] || 65;
      t = inums[2] || t;
      const lip2 = Math.max(10, (b as number) * 0.22);
      const gradeStr = (sec.grade || '').toLowerCase();
      const c2type = gradeStr.indexOf('f2f') !== -1 ? 'C2F' : 'C2B';
      return { type: c2type as 'C2B' | 'C2F', d, b, t, lip: lip2 };
    } else {
      d = nums[0] || d;
      b = nums[1] || 50;
      t = 0;
      return { type: 'RECT', d, b, t, lip: 0 };
    }
  }
  return { type: 'C', d, b: b as number, t, lip: Math.max(10, (b as number) * 0.22) };
}

// ═══════════════════════════════════════════════════
// C-SECTION END VIEW — lipped C with bend radii
// ═══════════════════════════════════════════════════
function cSectionEndPath(cx: number, cy: number, d_mm: number, b_mm: number, t_mm: number, lip_mm: number, sc: number): string {
  const D = d_mm * sc, B = b_mm * sc;
  const T = Math.max(t_mm * sc, 3.5);
  const L = Math.max(lip_mm * sc, 9.0);
  let Ri = Math.max(T * 0.4, 1.0);
  let Ro = Ri + T;
  Ro = Math.min(Ro, B * 0.35, D * 0.25);
  Ri = Math.min(Ri, L * 0.35, (B - T) * 0.3);
  Ri = Math.max(Ri, 0.5);
  Ro = Math.max(Ro, Ri + T * 0.5);

  const xWL  = cx - B;
  const xWR  = cx - B + T;
  const xFL  = cx;
  const xFLi = cx - T;

  const yTO = cy - D / 2;
  const yTI = yTO + T;
  const yBO = cy + D / 2;
  const yBI = yBO - T;

  const p: string[] = [];
  p.push('M ' + (xWL + Ro) + ',' + yTO);
  p.push('L ' + (xFL - Ro) + ',' + yTO);
  p.push('A ' + Ro + ',' + Ro + ' 0 0 1 ' + xFL + ',' + (yTO + Ro));
  p.push('L ' + xFL + ',' + (yTO + L - Ri));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 1 ' + (xFL - Ri) + ',' + (yTO + L));
  p.push('L ' + (xFLi + Ri) + ',' + (yTO + L));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 0 ' + xFLi + ',' + (yTO + L - Ri));
  p.push('L ' + xFLi + ',' + (yTI + Ri));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 0 ' + (xFLi - Ri) + ',' + yTI);
  p.push('L ' + (xWR + Ri) + ',' + yTI);
  p.push('A ' + Ri + ',' + Ri + ' 0 0 0 ' + xWR + ',' + (yTI + Ri));
  p.push('L ' + xWR + ',' + (yBI - Ri));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 0 ' + (xWR + Ri) + ',' + yBI);
  p.push('L ' + (xFLi - Ri) + ',' + yBI);
  p.push('A ' + Ri + ',' + Ri + ' 0 0 0 ' + xFLi + ',' + (yBI + Ri));
  p.push('L ' + xFLi + ',' + (yBO - L + Ri));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 1 ' + (xFLi + Ri) + ',' + (yBO - L));
  p.push('L ' + (xFL - Ri) + ',' + (yBO - L));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 1 ' + xFL + ',' + (yBO - L + Ro));
  p.push('L ' + xFL + ',' + (yBO - Ro));
  p.push('A ' + Ro + ',' + Ro + ' 0 0 1 ' + (xFL - Ro) + ',' + yBO);
  p.push('L ' + (xWL + Ro) + ',' + yBO);
  p.push('A ' + Ro + ',' + Ro + ' 0 0 1 ' + xWL + ',' + (yBO - Ro));
  p.push('L ' + xWL + ',' + (yTO + Ro));
  p.push('A ' + Ro + ',' + Ro + ' 0 0 1 ' + (xWL + Ro) + ',' + yTO);
  p.push('Z');
  return p.join(' ');
}

// ── Mirrored C-section — open face on LEFT, web on RIGHT ──
function cSectionEndPathMirrored(mirrorX: number, cy: number, d_mm: number, b_mm: number, t_mm: number, lip_mm: number, sc: number): string {
  const D = d_mm * sc, B = b_mm * sc;
  const T = Math.max(t_mm * sc, 3.5);
  const L = Math.max(lip_mm * sc, 9.0);
  let Ri = Math.max(T * 0.4, 1.0);
  let Ro = Ri + T;
  Ro = Math.min(Ro, B * 0.35, D * 0.25);
  Ri = Math.min(Ri, L * 0.35, (B - T) * 0.3);
  Ri = Math.max(Ri, 0.5);
  Ro = Math.max(Ro, Ri + T * 0.5);

  const mx = mirrorX;
  const xWL  = mx + B;
  const xWR  = mx + B - T;
  const xFL  = mx;
  const xFLi = mx + T;

  const yTO = cy - D / 2;
  const yTI = yTO + T;
  const yBO = cy + D / 2;
  const yBI = yBO - T;

  const p: string[] = [];
  p.push('M ' + (xWL - Ro) + ',' + yTO);
  p.push('L ' + (xFL + Ro) + ',' + yTO);
  p.push('A ' + Ro + ',' + Ro + ' 0 0 0 ' + xFL + ',' + (yTO + Ro));
  p.push('L ' + xFL + ',' + (yTO + L - Ri));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 0 ' + (xFL + Ri) + ',' + (yTO + L));
  p.push('L ' + (xFLi - Ri) + ',' + (yTO + L));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 1 ' + xFLi + ',' + (yTO + L - Ri));
  p.push('L ' + xFLi + ',' + (yTI + Ri));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 1 ' + (xFLi + Ri) + ',' + yTI);
  p.push('L ' + (xWR - Ri) + ',' + yTI);
  p.push('A ' + Ri + ',' + Ri + ' 0 0 1 ' + xWR + ',' + (yTI + Ri));
  p.push('L ' + xWR + ',' + (yBI - Ri));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 1 ' + (xWR - Ri) + ',' + yBI);
  p.push('L ' + (xFLi + Ri) + ',' + yBI);
  p.push('A ' + Ri + ',' + Ri + ' 0 0 1 ' + xFLi + ',' + (yBI + Ri));
  p.push('L ' + xFLi + ',' + (yBO - L + Ri));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 0 ' + (xFLi - Ri) + ',' + (yBO - L));
  p.push('L ' + (xFL + Ri) + ',' + (yBO - L));
  p.push('A ' + Ri + ',' + Ri + ' 0 0 0 ' + xFL + ',' + (yBO - L + Ro));
  p.push('L ' + xFL + ',' + (yBO - Ro));
  p.push('A ' + Ro + ',' + Ro + ' 0 0 0 ' + (xFL + Ro) + ',' + yBO);
  p.push('L ' + (xWL - Ro) + ',' + yBO);
  p.push('A ' + Ro + ',' + Ro + ' 0 0 0 ' + xWL + ',' + (yBO - Ro));
  p.push('L ' + xWL + ',' + (yTO + Ro));
  p.push('A ' + Ro + ',' + Ro + ' 0 0 0 ' + (xWL - Ro) + ',' + yTO);
  p.push('Z');
  return p.join(' ');
}

// ── RHS/SHS END VIEW ──
function rhsEndPath(cx: number, cy: number, d_mm: number, b_mm: number, t_mm: number, sc: number): string {
  const hd = d_mm * sc / 2, hb = b_mm * sc / 2, ht = t_mm * sc;
  let ro = ht * 1.5;
  let ri = ht * 0.5;
  ro = Math.min(ro, hb * 0.35, hd * 0.35);
  ri = Math.min(ri, (hb - ht) * 0.35, (hd - ht) * 0.35);
  ri = Math.max(ri, 0.5);

  const x0 = cx - hb, y0 = cy - hd, x1 = cx + hb, y1 = cy + hd;
  const xi0 = x0 + ht, yi0 = y0 + ht, xi1 = x1 - ht, yi1 = y1 - ht;

  const outer = [
    'M', x0 + ro, y0,
    'L', x1 - ro, y0, 'A', ro, ro, '0 0 1', x1, y0 + ro,
    'L', x1, y1 - ro, 'A', ro, ro, '0 0 1', x1 - ro, y1,
    'L', x0 + ro, y1, 'A', ro, ro, '0 0 1', x0, y1 - ro,
    'L', x0, y0 + ro, 'A', ro, ro, '0 0 1', x0 + ro, y0, 'Z',
  ].join(' ');

  const inner = [
    'M', xi0 + ri, yi0,
    'L', xi1 - ri, yi0, 'A', ri, ri, '0 0 0', xi1, yi0 + ri,
    'L', xi1, yi1 - ri, 'A', ri, ri, '0 0 0', xi1 - ri, yi1,
    'L', xi0 + ri, yi1, 'A', ri, ri, '0 0 0', xi0, yi1 - ri,
    'L', xi0, yi0 + ri, 'A', ri, ri, '0 0 0', xi0 + ri, yi0, 'Z',
  ].join(' ');

  return outer + ' ' + inner;
}

// ═══════════════════════════════════════════════════
// MAIN THREE-VIEW SVG GENERATOR
// ═══════════════════════════════════════════════════
let strokeCol = '#4caf50'; // default, overridden per-call

export function generateThreeViewSVG(sec: Section, utilColor: string, memberForm?: MemberForm): string {
  const dims = parseSectionDims(sec);
  strokeCol = utilColor;

  const W = 420, H = 220;
  const LCW = 130;
  const GUTTER = 6;
  const RCX0 = LCW + GUTTER;
  const LABEL_H = 14;
  const FOOTER_H = 16;

  const bg = 'transparent';
  const dimCol = '#6b7090';
  const dashCol = utilColor;
  const textCol = '#c8cce0';
  const noteCol = '#8a8c84';
  const mono = 'DM Mono,monospace';

  const hexToRgba = (hex: string, a: number) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const bl = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r},${g},${bl},${a})`;
  };
  const fillCol = hexToRgba(utilColor, 0.18);
  const fillPlate = hexToRgba(utilColor, 0.35); // plate is more opaque

  const isC = dims.type === 'C';
  const isC2B = dims.type === 'C2B';
  const isC2F = dims.type === 'C2F';
  const isC2 = isC2B || isC2F;
  const isRHSsec = dims.type === 'SHS' || dims.type === 'RHS';
  const wMult = isC2 ? 2 : 1;
  const isPlateForm = memberForm === 'plate';

  const endZoneH = Math.round((H - FOOTER_H) * 0.62);
  const DIM_MARGIN = 22;
  const endAvailH = endZoneH - LABEL_H - 10;
  const endAvailW = LCW - DIM_MARGIN - 6;

  // For plate form, C-section is wider visually (plate extends beyond flange)
  const visualBMult = isPlateForm ? (isC ? 1.4 : wMult) : wMult;

  const sc_h = endAvailH * 0.88 / dims.d;
  const sc_w = endAvailW * 0.88 / (dims.b * visualBMult);
  const sc = Math.max(0.12, Math.min(sc_h, sc_w, 4.0));

  const B = dims.b * sc;
  const D = dims.d * sc;
  const T = Math.max(dims.t * sc, 3.0);
  const Lp = Math.max(dims.lip * sc, 7.0);

  const scaleRatioNum = Math.round(dims.d / D * 10) / 10;
  const scaleLabel = '1:' + scaleRatioNum.toFixed(1);

  const endCY = LABEL_H + (endZoneH - LABEL_H) / 2;
  const endCX_zone = DIM_MARGIN + endAvailW / 2;

  let endPath = '';
  let endExtras = ''; // screws, annotations on end view
  let drawLeft = 0, drawRight = 0, drawTop = 0, drawBottom = 0;

  if (isPlateForm && isC) {
    // C + plate infill: draw C-section with plate covering open face
    let cx_c = endCX_zone + B * 0.2;
    cx_c = Math.min(cx_c, LCW - 16);
    const plateT = Math.max(T * 1.2, 4);
    endPath = cSectionEndPath(cx_c, endCY, dims.d, dims.b, dims.t, dims.lip, sc);
    // Plate covering open face
    const xPlateRight = cx_c + plateT;
    const yTO = endCY - D / 2;
    const yBO = endCY + D / 2;
    endExtras = `<rect x="${cx_c}" y="${yTO}" width="${plateT}" height="${D}" fill="${fillPlate}" stroke="${strokeCol}" stroke-width="1"/>`;
    // Screws shown as dots
    const screwCX = cx_c + plateT / 2;
    [-D * 0.25, 0, D * 0.25].forEach((dy) => {
      endExtras += `<circle cx="${screwCX}" cy="${endCY + dy}" r="1.5" fill="${strokeCol}" opacity="0.7"/>`;
    });
    drawLeft = cx_c - B; drawRight = xPlateRight;
    drawTop = yTO; drawBottom = yBO;
  } else if (isC || isC2) {
    if (isC2B || (memberForm === 'b2b' && !isC2B)) {
      // BACK-TO-BACK: webs meet at centre
      const cx_b2b = endCX_zone;
      const mx1 = cx_b2b - B;
      const cx2 = cx_b2b + B;
      endPath = cSectionEndPathMirrored(mx1, endCY, dims.d, dims.b, dims.t, dims.lip, sc) + ' ' +
                cSectionEndPath(cx2, endCY, dims.d, dims.b, dims.t, dims.lip, sc);
      // Centre join line
      endExtras = `<line x1="${cx_b2b}" y1="${endCY - D / 2}" x2="${cx_b2b}" y2="${endCY + D / 2}" stroke="${dimCol}" stroke-width="0.8" stroke-dasharray="4,2" opacity="0.6"/>`;
      drawLeft = cx_b2b - B; drawRight = cx_b2b + B;
      drawTop = endCY - D / 2; drawBottom = endCY + D / 2;
    } else if (isC2F) {
      // FACE-TO-FACE: open faces meet at centre, webs extend outward
      const cx_f2f = endCX_zone;
      endPath = cSectionEndPath(cx_f2f, endCY, dims.d, dims.b, dims.t, dims.lip, sc) + ' ' +
                cSectionEndPathMirrored(cx_f2f, endCY, dims.d, dims.b, dims.t, dims.lip, sc);
      drawLeft = cx_f2f - B; drawRight = cx_f2f + B;
      drawTop = endCY - D / 2; drawBottom = endCY + D / 2;
    } else {
      // Single C
      let cx_c = endCX_zone + B / 2;
      cx_c = Math.min(cx_c, LCW - 4);
      endPath = cSectionEndPath(cx_c, endCY, dims.d, dims.b, dims.t, dims.lip, sc);
      drawLeft = cx_c - B; drawRight = cx_c;
      drawTop = endCY - D / 2; drawBottom = endCY + D / 2;
    }
  } else if (isRHSsec) {
    const cx_rhs = endCX_zone;
    endPath = rhsEndPath(cx_rhs, endCY, dims.d, dims.b, dims.t, sc);
    drawLeft = cx_rhs - B / 2; drawRight = cx_rhs + B / 2;
    drawTop = endCY - D / 2; drawBottom = endCY + D / 2;
  } else {
    const cx_r = endCX_zone;
    endPath = `M ${cx_r - B / 2},${endCY - D / 2} L ${cx_r + B / 2},${endCY - D / 2} L ${cx_r + B / 2},${endCY + D / 2} L ${cx_r - B / 2},${endCY + D / 2} Z`;
    drawLeft = cx_r - B / 2; drawRight = cx_r + B / 2;
    drawTop = endCY - D / 2; drawBottom = endCY + D / 2;
  }

  const endW = drawRight - drawLeft;
  const endH = drawBottom - drawTop;

  // ── Plan view ──
  const planZoneTop = endZoneH + 2;
  const planZoneH = H - FOOTER_H - planZoneTop - 2;
  const planCY2 = planZoneTop + LABEL_H + (planZoneH - LABEL_H) / 2;
  const planRun = Math.min(planZoneH - LABEL_H - 4, 44);
  const pX0 = (LCW - endW) / 2;
  const pX1 = pX0 + endW;
  const pY0 = planCY2 - planRun / 2;
  const pY1 = planCY2 + planRun / 2;

  let planSvg = `<rect x="${pX0}" y="${pY0}" width="${endW}" height="${planRun}" fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.2"/>`;
  if (isC || isC2 || isRHSsec || isPlateForm) {
    const inset = T;
    planSvg += `<line x1="${pX0 + inset}" y1="${pY0}" x2="${pX0 + inset}" y2="${pY1}" stroke="${dashCol}" stroke-width="0.6" stroke-dasharray="3,2" opacity="0.6"/>`;
    planSvg += `<line x1="${pX1 - inset}" y1="${pY0}" x2="${pX1 - inset}" y2="${pY1}" stroke="${dashCol}" stroke-width="0.6" stroke-dasharray="3,2" opacity="0.6"/>`;
  }
  if (isC2B || isPlateForm) {
    const pcx = (pX0 + pX1) / 2;
    planSvg += `<line x1="${pcx}" y1="${pY0}" x2="${pcx}" y2="${pY1}" stroke="${dashCol}" stroke-width="0.8" stroke-dasharray="4,2" opacity="0.7"/>`;
  }

  // ── Side view ──
  const sY0 = LABEL_H + 4;
  const sY1 = H - FOOTER_H - 4;
  const sideH = sY1 - sY0;
  const secSideH = Math.min(endH, sideH - 10);
  const sCY = (sY0 + sY1) / 2;
  const sX0 = RCX0;
  const sX1 = W - 4;
  const sideRun = sX1 - sX0;
  const ssY0 = sCY - secSideH / 2;
  const ssY1 = sCY + secSideH / 2;

  let sideSvg = `<rect x="${sX0}" y="${ssY0}" width="${sideRun}" height="${secSideH}" fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.2"/>`;

  // Internal lines: top/bottom flange inner edges
  if (isC || isC2 || isRHSsec || isPlateForm) {
    sideSvg += `<line x1="${sX0}" y1="${ssY0 + T}" x2="${sX1}" y2="${ssY0 + T}" stroke="${dashCol}" stroke-width="0.7" stroke-dasharray="4,3" opacity="0.8"/>`;
    sideSvg += `<line x1="${sX0}" y1="${ssY1 - T}" x2="${sX1}" y2="${ssY1 - T}" stroke="${dashCol}" stroke-width="0.7" stroke-dasharray="4,3" opacity="0.8"/>`;
  }
  // Lip end lines
  if (isC || isC2B || isC2F) {
    sideSvg += `<line x1="${sX0}" y1="${ssY0 + Lp}" x2="${sX1}" y2="${ssY0 + Lp}" stroke="${dashCol}" stroke-width="0.5" stroke-dasharray="2,3" opacity="0.55"/>`;
    sideSvg += `<line x1="${sX0}" y1="${ssY1 - Lp}" x2="${sX1}" y2="${ssY1 - Lp}" stroke="${dashCol}" stroke-width="0.5" stroke-dasharray="2,3" opacity="0.55"/>`;
  }
  // Plate edge line in side view
  if (isPlateForm) {
    const plateT = Math.max(T * 1.2, 4);
    sideSvg += `<line x1="${sX0}" y1="${ssY0 + plateT}" x2="${sX1}" y2="${ssY0 + plateT}" stroke="${dashCol}" stroke-width="0.9" stroke-dasharray="5,3" opacity="0.9"/>`;
  }
  // C2B centre web join
  if (isC2B || memberForm === 'b2b') {
    sideSvg += `<line x1="${sX0}" y1="${sCY}" x2="${sX1}" y2="${sCY}" stroke="${dashCol}" stroke-width="0.5" stroke-dasharray="5,3" opacity="0.4"/>`;
  }

  // Connection note
  let connNote = '';
  if (isC2B || memberForm === 'b2b') {
    connNote = `<text x="${sX0 + 4}" y="${sY0 + 10}" font-family="${mono}" font-size="7" fill="${noteCol}">B2B — webs bolted/stitched at 600 ctrs</text>`;
  } else if (isC2F) {
    connNote = `<text x="${sX0 + 4}" y="${sY0 + 10}" font-family="${mono}" font-size="7" fill="${noteCol}">F2F — flanges screwed, forms box section</text>`;
  } else if (isPlateForm) {
    connNote = `<text x="${sX0 + 4}" y="${sY0 + 10}" font-family="${mono}" font-size="7" fill="${noteCol}">Plate infill screwed to open face — box section</text>`;
  }

  // ── Dimension annotations ──
  let dAnno = '';
  const gap = 7, ext = 3;
  const dX = drawLeft - gap;
  dAnno += `<line x1="${dX - ext}" y1="${drawTop}" x2="${dX + 2}" y2="${drawTop}" stroke="${dimCol}" stroke-width="0.7"/>`;
  dAnno += `<line x1="${dX - ext}" y1="${drawBottom}" x2="${dX + 2}" y2="${drawBottom}" stroke="${dimCol}" stroke-width="0.7"/>`;
  dAnno += `<line x1="${dX}" y1="${drawTop}" x2="${dX}" y2="${drawBottom}" stroke="${dimCol}" stroke-width="0.7"/>`;
  const dLabelX = Math.max(dX - 4, 4);
  dAnno += `<text x="${dLabelX}" y="${endCY + 3}" text-anchor="middle" transform="rotate(-90,${dLabelX},${endCY})" font-family="${mono}" font-size="7" fill="${dimCol}">d=${dims.d}mm</text>`;

  const bY = drawBottom + gap;
  if (bY + 10 < endZoneH) {
    dAnno += `<line x1="${drawLeft}" y1="${bY - ext}" x2="${drawLeft}" y2="${bY + 2}" stroke="${dimCol}" stroke-width="0.7"/>`;
    dAnno += `<line x1="${drawRight}" y1="${bY - ext}" x2="${drawRight}" y2="${bY + 2}" stroke="${dimCol}" stroke-width="0.7"/>`;
    dAnno += `<line x1="${drawLeft}" y1="${bY}" x2="${drawRight}" y2="${bY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    let bLabel = `b=${dims.b}mm`;
    if (isC2B || memberForm === 'b2b') bLabel = `b=${dims.b}mm ×2 (B2B)`;
    else if (isPlateForm) bLabel = `b=${dims.b}mm + plate`;
    dAnno += `<text x="${(drawLeft + drawRight) / 2}" y="${bY + 8}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}">${bLabel}</text>`;
  }
  dAnno += `<text x="${drawRight + 3}" y="${drawTop + 9}" font-family="${mono}" font-size="6" fill="${dimCol}">t=${dims.t}</text>`;

  // ── View labels ──
  const labels =
    `<text x="${LCW / 2}" y="11" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}" letter-spacing="0.06em">END VIEW</text>` +
    `<text x="${LCW / 2}" y="${planZoneTop + 11}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}" letter-spacing="0.06em">PLAN VIEW</text>` +
    `<text x="${sX0 + sideRun / 2}" y="11" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}" letter-spacing="0.06em">SIDE VIEW</text>`;

  const divider = `<line x1="${LCW + 2}" y1="2" x2="${LCW + 2}" y2="${H - FOOTER_H - 2}" stroke="${dimCol}" stroke-width="0.4" opacity="0.3"/>`;
  const hdivider = `<line x1="2" y1="${endZoneH}" x2="${LCW - 2}" y2="${endZoneH}" stroke="${dimCol}" stroke-width="0.4" opacity="0.3"/>`;

  const projLines =
    `<line x1="${drawRight + 2}" y1="${drawTop}" x2="${sX0 - 2}" y2="${ssY0}" stroke="${dimCol}" stroke-width="0.4" stroke-dasharray="2,3" opacity="0.35"/>` +
    `<line x1="${drawRight + 2}" y1="${drawBottom}" x2="${sX0 - 2}" y2="${ssY1}" stroke="${dimCol}" stroke-width="0.4" stroke-dasharray="2,3" opacity="0.35"/>`;

  const footerY = H - 4;
  const formNote = memberForm && memberForm !== 'open' ? ` · ${memberForm.toUpperCase()}` : '';
  const footer = `<text x="${W / 2}" y="${footerY}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${textCol}" font-weight="600">${sec.size || ''} · ${sec.grade || ''}${formNote} · ${scaleLabel}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">` +
    `<rect width="${W}" height="${H}" fill="${bg}"/>` +
    divider + hdivider + labels + projLines +
    `<path d="${endPath}" fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.5" fill-rule="evenodd"/>` +
    endExtras + planSvg + sideSvg + connNote + dAnno + footer +
    `</svg>`;
}
// ── Gable Infill Layout SVG ──
// Shows the gable triangle with dropper positions, panel layout, and dimensions

export function generateGableInfillSVG(
  gableWidth: number,
  gableHeight: number,
  nBays: number,
  dropperSpacing: number,
  claddingName: string,
  panelWidth: number,
): string {
  const W = 480;
  const H = 220;
  const margin = { top: 30, right: 20, bottom: 35, left: 55 };
  const drawW = W - margin.left - margin.right;
  const drawH = H - margin.top - margin.bottom;

  // Scale to fit
  const sc = Math.min(drawW / gableWidth, drawH / gableHeight) * 0.85;
  const triW = gableWidth * sc;
  const triH = gableHeight * sc;

  const baseY = margin.top + drawH;
  const leftX = margin.left + (drawW - triW) / 2;
  const rightX = leftX + triW;
  const apexX = leftX + triW / 2;
  const apexY = baseY - triH;

  const dimCol = '#6b7090';
  const textCol = '#c8cce0';
  const frameCol = '#c9a84c';
  const panelFill = 'rgba(201,168,76,0.06)';
  const dropperCol = '#8bc34a';
  const mono = 'DM Mono,monospace';

  // Gable triangle outline
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">`;
  svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;

  // Fill the gable triangle
  svg += `<polygon points="${leftX},${baseY} ${apexX},${apexY} ${rightX},${baseY}" fill="${panelFill}" stroke="${frameCol}" stroke-width="1.5"/>`;

  // Draw droppers (vertical lines at bay boundaries)
  for (let i = 0; i <= nBays; i++) {
    const dx = leftX + (i / nBays) * triW;
    // Height at this x-position on the triangle
    const halfW = triW / 2;
    const distFromCentre = Math.abs(dx - apexX);
    const dh = triH * (1 - distFromCentre / halfW);
    const topY = baseY - dh;

    // Dropper line
    if (dh > 2) {
      svg += `<line x1="${dx}" y1="${topY}" x2="${dx}" y2="${baseY}" stroke="${dropperCol}" stroke-width="1" stroke-dasharray="3,2"/>`;
    }

    // Panel number at top of each dropper
    if (i < nBays) {
      const labelX = dx + triW / nBays / 2;
      const labelDist = Math.abs(labelX - apexX);
      const labelH = triH * (1 - labelDist / halfW);
      const labelY = baseY - labelH / 2;
      svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${frameCol}" opacity="0.6">P${i + 1}</text>`;
    }

    // Spacing dimension at bottom
    if (i < nBays) {
      const dimY = baseY + 16;
      const dimX1 = dx;
      const dimX2 = dx + triW / nBays;
      svg += `<line x1="${dimX1}" y1="${dimY}" x2="${dimX2}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.6"/>`;
      svg += `<line x1="${dimX1}" y1="${dimY - 3}" x2="${dimX1}" y2="${dimY + 1}" stroke="${dimCol}" stroke-width="0.6"/>`;
      svg += `<line x1="${dimX2}" y1="${dimY - 3}" x2="${dimX2}" y2="${dimY + 1}" stroke="${dimCol}" stroke-width="0.6"/>`;
      const spMM = Math.round(dropperSpacing * 1000);
      svg += `<text x="${(dimX1 + dimX2) / 2}" y="${dimY + 9}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}">${spMM}mm</text>`;
    }
  }

  // Bottom chord (heavy line)
  svg += `<line x1="${leftX}" y1="${baseY}" x2="${rightX}" y2="${baseY}" stroke="${frameCol}" stroke-width="2.5"/>`;

  // Rafters (heavy lines)
  svg += `<line x1="${leftX}" y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="${frameCol}" stroke-width="2"/>`;
  svg += `<line x1="${rightX}" y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="${frameCol}" stroke-width="2"/>`;

  // Gable height dimension (left side)
  const dimX = leftX - 10;
  svg += `<line x1="${dimX}" y1="${baseY}" x2="${dimX}" y2="${apexY}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<line x1="${dimX - 3}" y1="${baseY}" x2="${dimX + 1}" y2="${baseY}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<line x1="${dimX - 3}" y1="${apexY}" x2="${dimX + 1}" y2="${apexY}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<text x="${dimX - 4}" y="${(baseY + apexY) / 2 + 3}" text-anchor="middle" transform="rotate(-90,${dimX - 4},${(baseY + apexY) / 2})" font-family="${mono}" font-size="7" fill="${dimCol}">h=${(gableHeight * 1000).toFixed(0)}mm</text>`;

  // Gable width dimension (below)
  svg += `<text x="${(leftX + rightX) / 2}" y="${baseY + 28}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}">w=${(gableWidth * 1000).toFixed(0)}mm</text>`;

  // Title
  svg += `<text x="${W / 2}" y="14" text-anchor="middle" font-family="${mono}" font-size="9" fill="${textCol}" font-weight="600">GABLE INFILL — ${nBays} panel${nBays > 1 ? 's' : ''} × ${Math.round(panelWidth * 1000)}mm</text>`;

  // Footer
  svg += `<text x="${W / 2}" y="${H - 6}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}">${claddingName} · Cold-formed angle frame · Screws at 300 ctrs</text>`;

  svg += `</svg>`;
  return svg;
}
