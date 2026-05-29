// ── Socket Joint & Fascia Penetration — AS1100 Standard ──
// Rafter (C250×65) slides over 50×50 SHS stub with packer plates
// 65×65 SHS continuous through existing fascia

import { generateDrawingFrame, type DrawingInfo } from './drawingFrame';

const mono = 'DM Mono,monospace';
const C_DIM = '#8a8e9e';
const C_TEXT = '#c8cce0';
const C_RAFT = '#c9a84c'; const C_RAFT_FILL = 'rgba(201,168,76,0.15)';
const C_PACK = '#ff9800'; const C_PACK_FILL = 'rgba(255,152,0,0.3)';
const C_SHS = '#2196f3'; const C_SHS_FILL = 'rgba(33,150,243,0.2)';
const C_SCREW = '#aaa';
const C_BRICK = '#B8860B'; const C_BRICK_FILL = 'rgba(184,134,11,0.18)';
const C_FASCIA = '#D2691E'; const C_FASCIA_FILL = 'rgba(210,105,30,0.18)';
const T = 1.2, M = 0.6, F = 0.3;

function arrow(x: number, y: number, a: number, s = 3.5): string {
  const r = a * Math.PI / 180;
  const x1 = x + s * Math.cos(r), y1 = y + s * Math.sin(r);
  const x2 = x + s * 0.35 * Math.cos(r + 2.4), y2 = y + s * 0.35 * Math.sin(r + 2.4);
  const x3 = x + s * 0.35 * Math.cos(r - 2.4), y3 = y + s * 0.35 * Math.sin(r - 2.4);
  return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${C_DIM}"/>`;
}
function dimH(x1: number, y1: number, x2: number, y2: number, label: string, off: number): string {
  let s = '';
  s += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1 - off - 2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y2 - off - 2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x1}" y1="${y1 - off}" x2="${x2}" y2="${y2 - off}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += arrow(x1, y1 - off, 0); s += arrow(x2, y2 - off, 180);
  s += `<text x="${(x1 + x2) / 2}" y="${y1 - off - 4}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${C_TEXT}">${label}</text>`;
  return s;
}
function callout(x: number, y: number, text: string, lx: number, ly: number): string {
  let s = `<line x1="${lx}" y1="${ly}" x2="${x}" y2="${y}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<circle cx="${x}" cy="${y}" r="1.5" fill="${C_DIM}"/>`;
  const w = text.length * 5 + 10;
  s += `<rect x="${x + 3}" y="${y - 6}" width="${w}" height="13" fill="rgba(26,26,30,0.92)" stroke="${C_DIM}" stroke-width="0.25" rx="1"/>`;
  s += `<text x="${x + 6}" y="${y + 3.5}" font-family="${mono}" font-size="6.5" fill="${C_TEXT}">${text}</text>`;
  return s;
}

// ── Socket Joint Detail — AS1100 ──
export function generateSocketJointSVG(): string {
  const info: DrawingInfo = {
    title: 'SOCKET JOINT · RAFT ER TO 65×65 STANDOFF',
    drawingNo: 'DRF-007-SOCK-01',
    scale: '1 : 5',
    date: '29/05/2026',
    revision: 'A',
    material: 'AS1163 C350 · AS4680 GAL',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const wx = 30, wy = 15;
  const sc = 0.5;

  // ── ELEVATION VIEW (left side) ──
  const ex = wx + 30, ey = wy + 30;

  svg += `<text x="${ex}" y="${ey - 5}" font-family="${mono}" font-size="8" fill="${C_SHS}" font-weight="600">ELEVATION</text>`;

  // Rafter (C250×65) — horizontal
  const raftH = 65 * sc;
  const raftL = 160 * sc;
  const raftY = ey + 40;
  svg += `<rect x="${ex}" y="${raftY}" width="${raftL}" height="${raftH}" fill="${C_RAFT_FILL}" stroke="${C_RAFT}" stroke-width="${T}"/>`;
  // Web line
  svg += `<line x1="${ex + 8 * sc}" y1="${raftY}" x2="${ex + 8 * sc}" y2="${raftY + raftH}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  // Lip lines
  svg += `<line x1="${ex + raftL - 4}" y1="${raftY + 3}" x2="${ex + raftL}" y2="${raftY + 3}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += `<line x1="${ex + raftL - 4}" y1="${raftY + raftH - 3}" x2="${ex + raftL}" y2="${raftY + raftH - 3}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += callout(ex + raftL / 2, raftY - 8, 'C250×65×2.4 RAFTER', ex + raftL / 2, raftY);

  // 50×50 SHS stub — vertical
  const shsStubS = 50 * sc;
  const shsStubY = raftY - 40 * sc;
  const shsStubH = shsStubS + 40 * sc;
  svg += `<rect x="${ex + raftL - shsStubS}" y="${shsStubY}" width="${shsStubS}" height="${shsStubH}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += callout(ex + raftL - shsStubS / 2, shsStubY - 8, '50×50×4 SHS STUB', ex + raftL - shsStubS / 2, shsStubY);

  // 65×65 SHS continuous — horizontal, below
  const bigShsY = shsStubY + shsStubH + 8 * sc;
  const bigShsH = 65 * sc;
  svg += `<rect x="${ex}" y="${bigShsY}" width="${raftL}" height="${bigShsH}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += `<line x1="${ex + 13 * sc}" y1="${bigShsY}" x2="${ex + 13 * sc}" y2="${bigShsY + bigShsH}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="2,2"/>`;
  svg += callout(ex + 5, bigShsY + bigShsH / 2 + 3, '65×65 SHS CONT.', ex + 5, bigShsY + bigShsH / 2);

  // Weld symbol at junction
  svg += `<line x1="${ex + raftL - shsStubS - 5}" y1="${bigShsY}" x2="${ex + raftL}" y2="${bigShsY}" stroke="#ff9800" stroke-width="${M}"/>`;
  svg += `<text x="${ex + raftL - shsStubS / 2}" y="${bigShsY - 3}" text-anchor="middle" font-family="${mono}" font-size="5" fill="#ff9800">FILLET WELD</text>`;

  // Screws
  const screwY1 = raftY + raftH / 2 - 12 * sc;
  const screwY2 = raftY + raftH / 2 + 12 * sc;
  const screwX = ex + raftL - shsStubS / 2;
  [screwY1, screwY2].forEach((sy) => {
    svg += `<circle cx="${screwX - 15 * sc}" cy="${sy}" r="2" fill="none" stroke="${C_SCREW}" stroke-width="${M}"/>`;
    svg += `<circle cx="${screwX + 15 * sc}" cy="${sy}" r="2" fill="none" stroke="${C_SCREW}" stroke-width="${M}"/>`;
  });
  svg += `<text x="${screwX}" y="${raftY + raftH + 12}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${C_SCREW}">4× M10 FHCS per side</text>`;

  // ── SECTION A-A (right side) ──
  const sx = wx + 260, sy = wy + 30;
  const sw = 160, sh = 170;

  svg += `<text x="${sx}" y="${sy - 5}" font-family="${mono}" font-size="8" fill="${C_SHS}" font-weight="600">SECTION A-A</text>`;

  // C-section end view
  const cExt = 65 * sc;
  const cThick = Math.max(2.4 * sc, 2);
  const lipLen = 12 * sc;
  const cx2 = sx + sw / 2;
  const cy2 = sy + sh / 2;
  const cTop = cy2 - cExt / 2;
  const cBot = cy2 + cExt / 2;
  const cLeft = cx2 - cExt / 2;
  const cRight = cx2 + cExt / 2;

  // Top flange
  svg += `<rect x="${cLeft}" y="${cTop}" width="${cExt}" height="${cThick}" fill="${C_RAFT_FILL}" stroke="${C_RAFT}" stroke-width="${T}"/>`;
  // Bottom flange
  svg += `<rect x="${cLeft}" y="${cBot - cThick}" width="${cExt}" height="${cThick}" fill="${C_RAFT_FILL}" stroke="${C_RAFT}" stroke-width="${T}"/>`;
  // Web
  svg += `<rect x="${cLeft}" y="${cTop}" width="${cThick}" height="${cExt}" fill="${C_RAFT_FILL}" stroke="${C_RAFT}" stroke-width="${T}"/>`;
  // Lips
  svg += `<rect x="${cRight - lipLen}" y="${cTop + cThick}" width="${lipLen}" height="${cThick}" fill="${C_RAFT_FILL}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += `<rect x="${cRight - lipLen}" y="${cBot - cThick * 2}" width="${lipLen}" height="${cThick}" fill="${C_RAFT_FILL}" stroke="${C_RAFT}" stroke-width="${M}"/>`;

  // 50×50 SHS inside
  const shsInS = 50 * sc;
  const shsInX = cx2 - shsInS / 2;
  const shsInY = cy2 - shsInS / 2;
  svg += `<rect x="${shsInX}" y="${shsInY}" width="${shsInS}" height="${shsInS}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;

  // Packer plates (50×5mm)
  const packerW = (cExt - shsInS) / 2 - cThick;
  svg += `<rect x="${shsInX + shsInS}" y="${cTop + cThick}" width="${packerW}" height="${cThick}" fill="${C_PACK_FILL}" stroke="${C_PACK}" stroke-width="${M}"/>`;
  svg += `<rect x="${shsInX + shsInS}" y="${cBot - cThick * 2}" width="${packerW}" height="${cThick}" fill="${C_PACK_FILL}" stroke="${C_PACK}" stroke-width="${M}"/>`;
  svg += `<rect x="${shsInX + shsInS}" y="${shsInY + cThick}" width="${packerW}" height="${shsInS - cThick * 2}" fill="${C_PACK_FILL}" stroke="${C_PACK}" stroke-width="M}" opacity="0.4"/>`;

  // Screw positions
  const screwX2 = shsInX + shsInS + packerW / 2;
  svg += `<circle cx="${screwX2}" cy="${cTop + cThick / 2}" r="1.8" fill="${C_SCREW}"/>`;
  svg += `<circle cx="${screwX2}" cy="${cBot - cThick / 2}" r="1.8" fill="${C_SCREW}"/>`;

  // Labels
  svg += callout(cRight + 5, cTop + 5, 'C-FLANGE', cRight, cTop + cThick / 2);
  svg += callout(shsInX + shsInS / 2, shsInY + shsInS + 10, '50×50 SHS', shsInX + shsInS / 2, shsInY + shsInS);
  svg += callout(shsInX + shsInS + packerW / 2, cBot + 12, '50×5 PACKER', shsInX + shsInS + packerW / 2, cBot);

  // Dimensions
  svg += dimH(cLeft, cBot + 20, cRight, cBot + 20, '65', 10);
  svg += dimH(shsInX, shsInY + shsInS + 30, shsInX + shsInS, shsInY + shsInS + 30, '50', 6);

  // ── Notes ──
  const nx = wx + 30, ny = wy + 240;
  svg += `<rect x="${nx}" y="${ny}" width="390" height="55" fill="rgba(0,0,0,0.25)" stroke="${C_DIM}" stroke-width="0.25" rx="2"/>`;
  svg += `<text x="${nx + 5}" y="${ny + 12}" font-family="${mono}" font-size="7" fill="${C_TEXT}" font-weight="600">JOINT SPECIFICATION</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 23}" font-family="${mono}" font-size="6" fill="${C_DIM}">• 50×50×4 SHS stub, height 220mm (into rafter) · Packer plates: 50×5mm flat bar, weld both faces</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 33}" font-family="${mono}" font-size="6" fill="${C_DIM}">• M10×25 FHCS, 4 per side, into tapped 50×50 · Time-Sert or helicoil for thread strength</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 43}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Slip fit: 0.5mm clearance, no force required · Weld: 6mm fillet all-around stub to 65×65</text>`;

  // Section mark
  svg += `<circle cx="${wx + 10}" cy="${wy + 12}" r="7" fill="none" stroke="${C_DIM}" stroke-width="${M}"/>`;
  svg += `<text x="${wx + 10}" y="${wy + 16}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${C_TEXT}" font-weight="600">A</text>`;

  svg += `</svg>`;
  return svg;
}

// ── Fascia Penetration Detail — AS1100 ──
export function generateFasciaPenetrationSVG(): string {
  const info: DrawingInfo = {
    title: 'FASCIA PENETRATION · 65×65 SHS',
    drawingNo: 'DRF-008-FASC-01',
    scale: '1 : 5',
    date: '29/05/2026',
    revision: 'A',
    material: 'AS1163 C350 · AS4680 GAL',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const wx = 30, wy = 15;
  const sc = 0.5;

  const wallX = wx + 50;
  const wallW = 110 * sc;
  const fasciaX = wallX + wallW + 20 * sc;
  const shsSize = 65 * sc;
  const cy = wy + 130;

  // Brick wall
  svg += `<rect x="${wallX}" y="${wy + 30}" width="${wallW}" height="${180 * sc}" fill="${C_BRICK_FILL}" stroke="${C_BRICK}" stroke-width="${T}"/>`;
  for (let y = wy + 35; y < wy + 30 + 180 * sc - 5; y += 7.6 * sc) {
    svg += `<line x1="${wallX}" y1="${y}" x2="${wallX + wallW}" y2="${y}" stroke="${C_BRICK}" stroke-width="0.3" opacity="0.4"/>`;
  }
  svg += callout(wallX - 15, cy, '110mm BRICK', wallX, cy);

  // Stud/top plate
  svg += `<rect x="${wallX + wallW + 5 * sc}" y="${cy - 15 * sc}" width="${45 * sc}" height="${30 * sc}" fill="rgba(139,195,74,0.12)" stroke="#8bc34a" stroke-width="${M}"/>`;
  svg += callout(wallX + wallW + 25 * sc, cy + 25 * sc, '90×45 STUD', wallX + wallW + 25 * sc, cy + 15 * sc);

  // Fascia board
  const fascThick = 30 * sc;
  svg += `<rect x="${fasciaX}" y="${cy - 50 * sc}" width="${fascThick}" height="${100 * sc}" fill="${C_FASCIA_FILL}" stroke="${C_FASCIA}" stroke-width="${T}"/>`;
  svg += callout(fasciaX + fascThick + 10, cy, '30mm FASCIA', fasciaX + fascThick, cy);

  // 65×65 SHS passing through
  const shsX = fasciaX - 10 * sc;
  svg += `<rect x="${shsX}" y="${cy - shsSize / 2}" width="${shsSize + 20 * sc}" height="${shsSize}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += `<line x1="${shsX + 13 * sc}" y1="${cy - shsSize / 2}" x2="${shsX + 13 * sc}" y2="${cy + shsSize / 2}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="2,2"/>`;
  svg += callout(shsX + shsSize / 2, cy - shsSize / 2 - 10, '65×65 SHS', shsX + shsSize / 2, cy - shsSize / 2);

  // Gap around SHS (sealed)
  svg += `<rect x="${fasciaX - 2}" y="${cy - shsSize / 2 - 4}" width="${fascThick + 4}" height="${shsSize + 8}" fill="none" stroke="#ff9800" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  svg += callout(fasciaX + fascThick + 30, cy - shsSize / 2 - 8, '3mm GAP', fasciaX + fascThick + 2, cy - shsSize / 2 - 4);

  // Fixings into stud
  svg += `<line x1="${wallX + wallW + 20 * sc}" y1="${cy - 8 * sc}" x2="${shsX + 5 * sc}" y2="${cy - 8 * sc}" stroke="${C_SCREW}" stroke-width="2"/>`;
  svg += `<line x1="${wallX + wallW + 20 * sc}" y1="${cy + 8 * sc}" x2="${shsX + 5 * sc}" y2="${cy + 8 * sc}" stroke="${C_SCREW}" stroke-width="2"/>`;
  svg += callout(wallX + wallW + 30 * sc, cy - 15 * sc, 'M12×100 LAG', wallX + wallW + 25 * sc, cy - 8 * sc);
  svg += callout(wallX + wallW + 30 * sc, cy + 18 * sc, '@ 600 CTR', wallX + wallW + 25 * sc, cy + 8 * sc);

  // Dimensions
  svg += dimH(fasciaX, cy + shsSize / 2 + 18, fasciaX + fascThick, cy + shsSize / 2 + 18, '30', 8);

  // Notes
  const nx = wx + 260, ny = wy + 10;
  svg += `<rect x="${nx}" y="${ny}" width="155" height="80" fill="rgba(0,0,0,0.25)" stroke="${C_DIM}" stroke-width="0.25" rx="2"/>`;
  svg += `<text x="${nx + 5}" y="${ny + 12}" font-family="${mono}" font-size="7" fill="${C_TEXT}" font-weight="600">INSTALL NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 23}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Cut 70×70 hole in fascia</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 33}" font-family="${mono}" font-size="6" fill="${C_DIM}">• 3mm gap all around SHS</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 43}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Fill gap with Sikaflex</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 53}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Fix to stud @ 600ctr</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 63}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Paint SHS to match</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 73}" font-family="${mono}" font-size="6" fill="#ff9800">• SHS is structural</text>`;

  // Section mark
  svg += `<circle cx="${wx + 10}" cy="${wy + 12}" r="7" fill="none" stroke="${C_DIM}" stroke-width="${M}"/>`;
  svg += `<text x="${wx + 10}" y="${wy + 16}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${C_TEXT}" font-weight="600">A</text>`;

  svg += `</svg>`;
  return svg;
}
