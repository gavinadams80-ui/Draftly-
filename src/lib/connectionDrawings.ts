// ── Connection Detail Drawings — AS1100 Standard ──
// SVG diagrams with proper engineering drawing frames, dimensioning,
// material callouts, and title blocks per AS1100.101 / AS1100.301

import type { Section } from '@/types';
import { generateDrawingFrame, type DrawingInfo } from './drawingFrame';

const mono = 'DM Mono,monospace';
const C_DIM = '#8a8e9e';
const C_TEXT = '#c8cce0';
const C_BRICK = '#B8860B'; const C_BRICK_FILL = 'rgba(184,134,11,0.18)';
const C_LEDGER = '#c9a84c'; const C_LEDGER_FILL = 'rgba(201,168,76,0.2)';
const C_POST = '#8bc34a'; const C_POST_FILL = 'rgba(139,195,74,0.2)';
const C_BOLT = '#f44336';
const C_STANDOFF = '#2196f3'; const C_STANDOFF_FILL = 'rgba(33,150,243,0.18)';
const C_PLATE = '#ff9800'; const C_PLATE_FILL = 'rgba(255,152,0,0.2)';
const T = 1.2, M = 0.6, F = 0.3;

// ── Drawing primitives ──
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
function dimV(x1: number, y1: number, x2: number, y2: number, label: string, off: number): string {
  let s = '';
  s += `<line x1="${x1}" y1="${y1}" x2="${x1 - off - 2}" y2="${y1}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x2}" y1="${y2}" x2="${x2 - off - 2}" y2="${y2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x1 - off}" y1="${y1}" x2="${x2 - off}" y2="${y2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += arrow(x1 - off, y1, 90); s += arrow(x2 - off, y2, 270);
  s += `<text x="${x1 - off - 4}" y="${(y1 + y2) / 2 + 3}" text-anchor="middle" transform="rotate(-90,${x1 - off - 4},${(y1 + y2) / 2 + 3})" font-family="${mono}" font-size="7" fill="${C_TEXT}">${label}</text>`;
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
function hatch(x: number, y: number, w: number, h: number, sp = 5, col: string): string {
  let d = '', diag = Math.sqrt(w * w + h * h);
  for (let i = -diag; i < diag + w; i += sp) d += `M ${x + i},${y} L ${x + i - h},${y + h} `;
  return `<path d="${d}" stroke="${col}" stroke-width="0.25" opacity="0.5"/>`;
}

// Parse C-section dimensions from size string
function parseCDims(size: string): { d: number; b: number; t: number } {
  const m = size.match(/C(\d+)\s*[×x]\s*(\d+)\s*[×x]\s*([\d.]+)/);
  if (m) return { d: parseInt(m[1]), b: parseInt(m[2]), t: parseFloat(m[3]) };
  return { d: 150, b: 50, t: 1.6 };
}

// ── Corner Post Detail — AS1100 ──
export function generateCornerPostSVG(
  ledgerSec: Section | null,
  postSec: Section | null,
): string {
  const info: DrawingInfo = {
    title: 'CORNER POST · LEDGER CONNECTION',
    drawingNo: 'DRF-003-POST-01',
    scale: '1 : 5',
    date: '29/05/2026',
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const ledSize = ledgerSec?.size || 'C150×50×1.9';
  const postSize = postSec?.size || 'C100×50×1.6';
  const ledDims = parseCDims(ledSize);
  const postDims = parseCDims(postSize);

  // Working area
  const wx = 30, wy = 15;
  const sc = 0.5;
  const cx = wx + 160;
  const cy = wy + 180;

  // Ledger beam (horizontal)
  const ledW = 220 * sc;
  const ledD = ledDims.d * sc;
  const ledX = cx - ledW;
  const ledY = cy - ledD / 2;
  svg += `<rect x="${ledX}" y="${ledY}" width="${ledW}" height="${ledD}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  // Web line
  svg += `<line x1="${ledX}" y1="${cy}" x2="${cx}" y2="${cy}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  // Lip returns
  const lip = 10 * sc;
  svg += `<line x1="${ledX}" y1="${ledY}" x2="${ledX - lip}" y2="${ledY}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += `<line x1="${ledX}" y1="${ledY + ledD}" x2="${ledX - lip}" y2="${ledY + ledD}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += callout(ledX + ledW / 2, ledY - 8, ledSize, ledX + ledW / 2, ledY);

  // Post (vertical)
  const postH = 120 * sc;
  const postD = postDims.d * sc;
  const postX = cx - postD / 2;
  const postY = cy;
  svg += `<rect x="${postX}" y="${postY}" width="${postD}" height="${postH}" fill="${C_POST_FILL}" stroke="${C_POST}" stroke-width="${T}"/>`;
  // Web
  svg += `<line x1="${cx}" y1="${postY}" x2="${cx}" y2="${postY + postH}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  // Lip returns
  svg += `<line x1="${postX}" y1="${postY}" x2="${postX - lip}" y2="${postY}" stroke="${C_POST}" stroke-width="${M}"/>`;
  svg += `<line x1="${postX + postD}" y1="${postY}" x2="${postX + postD + lip}" y2="${postY}" stroke="${C_POST}" stroke-width="${M}"/>`;
  svg += callout(postX + postD + 15, postY + postH / 2, postSize, postX + postD, postY + postH / 2);

  // M12 bolts through ledger into post
  svg += `<circle cx="${cx - 15}" cy="${cy}" r="3" fill="none" stroke="${C_BOLT}" stroke-width="${M}"/>`;
  svg += `<circle cx="${cx + 8}" cy="${cy}" r="3" fill="none" stroke="${C_BOLT}" stroke-width="${M}"/>`;
  svg += callout(cx + 35, cy - 15, '2× M12 BOLTS', cx + 12, cy);

  // Base plate
  const bpW = 80 * sc;
  const bpH = 6 * sc;
  const bpY = postY + postH;
  svg += `<rect x="${cx - bpW / 2}" y="${bpY}" width="${bpW}" height="${bpH}" fill="rgba(170,170,170,0.2)" stroke="#aaa" stroke-width="${M}"/>`;
  svg += callout(cx + bpW / 2 + 10, bpY + bpH / 2, '150×150×8 BASE PLATE', cx + bpW / 2, bpY + bpH / 2);

  // Concrete pad
  const padW = 140 * sc;
  const padH = 25 * sc;
  svg += `<rect x="${cx - padW / 2}" y="${bpY + bpH}" width="${padW}" height="${padH}" fill="rgba(150,150,150,0.12)" stroke="#888" stroke-width="${M}"/>`;
  svg += hatch(cx - padW / 2, bpY + bpH, padW, padH, 3, '#888');
  svg += callout(cx + padW / 2 + 10, bpY + bpH + padH / 2, '400×400×300 CONC PAD', cx + padW / 2, bpY + bpH + padH / 2);

  // Ground line
  const gy = bpY + bpH + padH;
  svg += `<line x1="${wx}" y1="${gy}" x2="${wx + 350}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += hatch(wx, gy - 4, 350, 4, 2, C_TEXT);
  svg += `<text x="${wx + 5}" y="${gy + 10}" font-family="${mono}" font-size="6" fill="${C_DIM}">GROUND LEVEL</text>`;

  // Dimensions
  svg += dimH(postX, gy + 6, postX + postD, gy + 6, `${postDims.d}`, 6);
  svg += dimV(postX - 10, postY, postX - 10, bpY, `${postDims.d}`, 8);
  svg += dimH(cx - bpW / 2, gy + 14, cx + bpW / 2, gy + 14, '150', 6);

  // Notes
  const nx = wx + 220, ny = wy + 10;
  svg += `<rect x="${nx}" y="${ny}" width="155" height="60" fill="rgba(0,0,0,0.25)" stroke="${C_DIM}" stroke-width="0.25" rx="2"/>`;
  svg += `<text x="${nx + 5}" y="${ny + 12}" font-family="${mono}" font-size="7" fill="${C_TEXT}" font-weight="600">NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 23}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Post INSIDE frame, bolted</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 33}" font-family="${mono}" font-size="6" fill="${C_DIM}">  through ledger</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 43}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Base plate: gal steel</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 53}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Conc pad to AS3600</text>`;

  // Section mark
  svg += `<circle cx="${wx + 10}" cy="${wy + 12}" r="7" fill="none" stroke="${C_DIM}" stroke-width="${M}"/>`;
  svg += `<text x="${wx + 10}" y="${wy + 16}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${C_TEXT}" font-weight="600">A</text>`;

  svg += `</svg>`;
  return svg;
}

// ── Rafter to Ledger Connection — AS1100 ──
export function generateRafterLedgerSVG(
  rafterSec: Section | null,
  ledgerSec: Section | null,
): string {
  const info: DrawingInfo = {
    title: 'RAFTER → LEDGER CONNECTION',
    drawingNo: 'DRF-004-RAFT-01',
    scale: '1 : 5',
    date: '29/05/2026',
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const raftSize = rafterSec?.size || 'C250×65×2.4';
  const ledSize = ledgerSec?.size || 'C150×50×1.9';
  const raftDims = parseCDims(raftSize);
  const ledDims = parseCDims(ledSize);

  const wx = 30, wy = 15;
  const sc = 0.5;
  const cx = wx + 200;
  const baseY = wy + 200;

  // Ledger (horizontal)
  const ledW = 200 * sc;
  const ledD = ledDims.d * sc;
  svg += `<rect x="${cx - ledW / 2}" y="${baseY - ledD}" width="${ledW}" height="${ledD}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  svg += `<line x1="${cx - ledW / 2}" y1="${baseY - ledD / 2}" x2="${cx + ledW / 2}" y2="${baseY - ledD / 2}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  svg += callout(cx, baseY + 12, ledSize, cx, baseY);

  // Rafter (angled at 10°)
  const raftD = raftDims.d * sc;
  const raftL = 160 * sc;
  const angle = 10 * Math.PI / 180;
  const rEx = cx + 30;
  const rEy = baseY - ledD - 60 * sc;
  const rSx = rEx - raftL * Math.cos(angle);
  const rSy = rEy + raftL * Math.sin(angle);

  // Draw rafter as a filled polygon
  const perpX = Math.sin(angle) * raftD;
  const perpY = Math.cos(angle) * raftD;
  svg += `<polygon points="${rSx},${rSy} ${rEx},${rEy} ${rEx + perpX},${rEy + perpY} ${rSx + perpX},${rSy + perpY}" fill="${C_POST_FILL}" stroke="${C_POST}" stroke-width="${T}"/>`;
  // Web line
  const wSx = rSx + perpX * 0.5, wSy = rSy + perpY * 0.5;
  const wEx = rEx + perpX * 0.5, wEy = rEy + perpY * 0.5;
  svg += `<line x1="${wSx}" y1="${wSy}" x2="${wEx}" y2="${wEy}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;

  svg += callout(rEx + 15, rEy + 10, raftSize, rEx, rEy + perpY / 2);

  // Birdsmouth cut detail
  svg += `<line x1="${rSx}" y1="${rSy}" x2="${rSx + 15}" y2="${rSy}" stroke="${C_BOLT}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  svg += `<line x1="${rSx + 15}" y1="${rSy}" x2="${rSx + 15}" y2="${rSy + 15}" stroke="${C_BOLT}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  svg += callout(rSx + 25, rSy - 5, 'BIRDSMOUTH', rSx + 8, rSy);

  // M12 bolt
  svg += `<circle cx="${rSx + 20}" cy="${baseY - ledD / 2}" r="3" fill="none" stroke="${C_BOLT}" stroke-width="${M}"/>`;
  svg += callout(rSx + 30, baseY - ledD / 2 - 12, 'M12 BOLT', rSx + 22, baseY - ledD / 2);

  // Dimensions
  svg += dimV(rEx + perpX + 15, rEy, rEx + perpX + 15, rEy + perpY, `${raftDims.d}`, 12);

  // Notes
  const nx = wx + 260, ny = wy + 10;
  svg += `<rect x="${nx}" y="${ny}" width="140" height="55" fill="rgba(0,0,0,0.25)" stroke="${C_DIM}" stroke-width="0.25" rx="2"/>`;
  svg += `<text x="${nx + 5}" y="${ny + 12}" font-family="${mono}" font-size="7" fill="${C_TEXT}" font-weight="600">DETAIL NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 23}" font-family="${mono}" font-size="6" fill="${C_DIM}">• 10° roof pitch</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 33}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Birdsmouth seat cut</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 43}" font-family="${mono}" font-size="6" fill="${C_DIM}">• M12 through-bolt</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 53}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Cleat bracket alt.</text>`;

  // Pitch angle arc
  const arcR = 30;
  svg += `<path d="M ${cx} ${baseY - ledD - arcR} A ${arcR} ${arcR} 0 0 0 ${cx + arcR * Math.sin(angle)} ${baseY - ledD - arcR * Math.cos(angle)}" fill="none" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${cx + 18}" y="${baseY - ledD - 18}" font-family="${mono}" font-size="7" fill="${C_DIM}">10°</text>`;

  // Section mark
  svg += `<circle cx="${wx + 10}" cy="${wy + 12}" r="7" fill="none" stroke="${C_DIM}" stroke-width="${M}"/>`;
  svg += `<text x="${wx + 10}" y="${wy + 16}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${C_TEXT}" font-weight="600">A</text>`;

  svg += `</svg>`;
  return svg;
}

// ── Cross-Bracing Detail — AS1100 ──
export function generateCrossBracingSVG(
  bayWidth: number,
  bayHeight: number,
  bracingSec: Section | null,
): string {
  const info: DrawingInfo = {
    title: 'CROSS-BRACING (X-BRACE) · END BAY',
    drawingNo: 'DRF-005-BRACE-01',
    scale: 'NTS',
    date: '29/05/2026',
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const braceSize = bracingSec?.size || 'C75×40×1.2';

  const wx = 30, wy = 15;
  const sc = 35; // scale factor for bay dimensions
  const bw = bayWidth * sc;
  const bh = bayHeight * sc * 0.6; // compress height for fit

  const leftX = wx + 80;
  const rightX = leftX + bw;
  const topY = wy + 40;
  const botY = topY + bh;

  // Posts
  const postW = 12;
  svg += `<rect x="${leftX - postW / 2}" y="${topY}" width="${postW}" height="${bh}" fill="${C_POST_FILL}" stroke="${C_POST}" stroke-width="${T}"/>`;
  svg += `<rect x="${rightX - postW / 2}" y="${topY}" width="${postW}" height="${bh}" fill="${C_POST_FILL}" stroke="${C_POST}" stroke-width="${T}"/>`;
  svg += callout(leftX - 35, topY + bh / 2, 'POST', leftX - postW / 2, topY + bh / 2);
  svg += callout(rightX + 25, topY + bh / 2, 'POST', rightX + postW / 2, topY + bh / 2);

  // Rafter (top)
  svg += `<line x1="${leftX}" y1="${topY}" x2="${rightX}" y2="${topY}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += callout((leftX + rightX) / 2, topY - 8, 'RAFTER', (leftX + rightX) / 2, topY);

  // X-braces (tension-only, dashed)
  svg += `<line x1="${leftX}" y1="${topY}" x2="${rightX}" y2="${botY}" stroke="${C_STANDOFF}" stroke-width="${M}" stroke-dasharray="6,3"/>`;
  svg += `<line x1="${rightX}" y1="${topY}" x2="${leftX}" y2="${botY}" stroke="${C_STANDOFF}" stroke-width="${M}" stroke-dasharray="6,3"/>`;

  // Centre intersection bolt
  svg += `<circle cx="${(leftX + rightX) / 2}" cy="${(topY + botY) / 2}" r="3" fill="none" stroke="${C_STANDOFF}" stroke-width="${M}"/>`;

  // Bracing section callout
  svg += callout(rightX + 40, (topY + botY) / 2, braceSize, rightX + 10, (topY + botY) / 2);

  // Dimensions
  svg += dimH(leftX, botY + 10, rightX, botY + 10, `${bayWidth.toFixed(2)}m`, 10);
  svg += dimV(rightX + 18, topY, rightX + 18, botY, `${bayHeight.toFixed(2)}m`, 12);

  // Notes
  const nx = wx + 280, ny = wy + 10;
  svg += `<rect x="${nx}" y="${ny}" width="155" height="70" fill="rgba(0,0,0,0.25)" stroke="${C_DIM}" stroke-width="0.25" rx="2"/>`;
  svg += `<text x="${nx + 5}" y="${ny + 12}" font-family="${mono}" font-size="7" fill="${C_TEXT}" font-weight="600">NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 23}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Tension-only design</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 33}" font-family="${mono}" font-size="6" fill="${C_DIM}">• One brace active at a time</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 43}" font-family="${mono}" font-size="6" fill="${C_DIM}">• M12 bolts at ends</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 53}" font-family="${mono}" font-size="6" fill="${C_DIM}">• End bay only for 3-side</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 63}" font-family="${mono}" font-size="6" fill="${C_DIM}">• AS4600 cold-formed design</text>`;

  // Section mark
  svg += `<circle cx="${wx + 10}" cy="${wy + 12}" r="7" fill="none" stroke="${C_DIM}" stroke-width="${M}"/>`;
  svg += `<text x="${wx + 10}" y="${wy + 16}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${C_TEXT}" font-weight="600">A</text>`;

  svg += `</svg>`;
  return svg;
}

// ── Ledger to Wall Connection — AS1100 ──
// (standoff bracket detail for the ledger beam fixed to existing brick wall)
export function generateLedgerConnectionSVG(
  standoffMm: number,
  ledgerSec: Section | null,
  memberForm: string,
): string {
  const info: DrawingInfo = {
    title: `LEDGER · ${standoffMm}mm STANDOFF TO BRICK`,
    drawingNo: 'DRF-006-LEDG-01',
    scale: '1 : 5',
    date: '29/05/2026',
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const size = ledgerSec?.size || 'C150×50×1.9';
  const dims = parseCDims(size);
  const isPlate = memberForm === 'plate';
  const sc = 0.5;

  const wx = 30, wy = 15;
  const wallX = wx + 60;
  const wallW = 110 * sc;

  const cDepth = dims.d;
  const cFlange = dims.b;
  const cThick = Math.max(dims.t, 2);

  const bracketW = standoffMm * sc;
  const bracketH = 60 * sc;
  const bracketX = wallX + wallW;
  const bracketY = wy + 100;

  // Brick wall
  svg += `<rect x="${wallX}" y="${wy + 30}" width="${wallW}" height="${200 * sc}" fill="${C_BRICK_FILL}" stroke="${C_BRICK}" stroke-width="${T}"/>`;
  for (let y = wy + 35; y < wy + 30 + 200 * sc - 5; y += 7.6 * sc) {
    svg += `<line x1="${wallX}" y1="${y}" x2="${wallX + wallW}" y2="${y}" stroke="${C_BRICK}" stroke-width="0.3" opacity="0.4"/>`;
  }
  svg += callout(wallX - 20, wy + 80, '110mm BRICK', wallX, wy + 80);

  // Standoff bracket (gal angle)
  svg += `<rect x="${bracketX}" y="${bracketY}" width="${bracketW}" height="${bracketH}" fill="${C_STANDOFF_FILL}" stroke="${C_STANDOFF}" stroke-width="${T}" rx="2"/>`;
  svg += callout(bracketX + bracketW / 2, bracketY - 10, `${standoffMm}mm BRACKET`, bracketX + bracketW / 2, bracketY);

  // Chem anchors through bracket into wall
  const aY1 = bracketY + bracketH * 0.3;
  const aY2 = bracketY + bracketH * 0.7;
  svg += `<line x1="${wallX + wallW - 5}" y1="${aY1}" x2="${bracketX + 5}" y2="${aY1}" stroke="${C_BOLT}" stroke-width="2"/>`;
  svg += `<line x1="${wallX + wallW - 5}" y1="${aY2}" x2="${bracketX + 5}" y2="${aY2}" stroke="${C_BOLT}" stroke-width="2"/>`;
  svg += callout(wallX + wallW / 2, aY1 + 3, 'M12', wallX + wallW / 2, aY1);
  svg += callout(wallX + wallW / 2, aY2 + 10, '@600ctr', wallX + wallW / 2, aY2);

  // C-section ledger (web against bracket, open face right)
  const cy = bracketY + (bracketH - cDepth * sc) / 2;
  const webX = bracketX + bracketW;
  const cThPx = Math.max(cThick * sc, 2);
  const cFlPx = cFlange * sc;
  const cDpPx = cDepth * sc;

  // Web
  svg += `<rect x="${webX}" y="${cy}" width="${cThPx}" height="${cDpPx}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  // Top flange
  svg += `<rect x="${webX + cThPx}" y="${cy}" width="${cFlPx}" height="${cThPx}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  // Bottom flange
  svg += `<rect x="${webX + cThPx}" y="${cy + cDpPx - cThPx}" width="${cFlPx}" height="${cThPx}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  // Lips
  const lipPx = Math.max(cFlPx * 0.25, 3);
  svg += `<rect x="${webX + cThPx + cFlPx - lipPx}" y="${cy + cThPx}" width="${lipPx}" height="${cThPx}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += `<rect x="${webX + cThPx + cFlPx - lipPx}" y="${cy + cDpPx - cThPx * 2}" width="${lipPx}" height="${cThPx}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;

  // Plate infill (if selected)
  let outerFaceX = webX + cThPx + cFlPx;
  if (isPlate) {
    const plateTh = 5;
    svg += `<rect x="${outerFaceX}" y="${cy}" width="${plateTh}" height="${cDpPx}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
    // Screws
    [-cDpPx * 0.25, 0, cDpPx * 0.25].forEach((dy) => {
      svg += `<circle cx="${outerFaceX + plateTh / 2}" cy="${cy + cDpPx / 2 + dy}" r="1.5" fill="${C_PLATE}" opacity="0.7"/>`;
    });
    svg += callout(outerFaceX + plateTh + 5, cy + cDpPx / 2, 'PLATE INFILL', outerFaceX + plateTh, cy + cDpPx / 2);
    outerFaceX += plateTh;
  }

  svg += callout(webX + cThPx + cFlPx + 15, cy + cDpPx / 2, size, webX + cThPx + cFlPx, cy + cDpPx / 2);

  // Bolts through bracket into C-section web
  const boltY = cy + cDpPx / 2;
  svg += `<circle cx="${webX + cThPx / 2}" cy="${boltY - cDpPx * 0.2}" r="2.5" fill="none" stroke="${C_BOLT}" stroke-width="${M}"/>`;
  svg += `<circle cx="${webX + cThPx / 2}" cy="${boltY + cDpPx * 0.2}" r="2.5" fill="none" stroke="${C_BOLT}" stroke-width="${M}"/>`;

  // Dimensions
  const dimY = wy + 200;
  svg += dimH(wallX, dimY, outerFaceX, dimY, `${standoffMm + cDepth + (isPlate ? 5 : 0)}mm`, 10);
  svg += dimH(bracketX, dimY - 18, webX, dimY - 18, `${standoffMm}mm`, 6);

  // Notes
  const nx = wx + 260, ny = wy + 10;
  const nh = isPlate ? 70 : 50;
  svg += `<rect x="${nx}" y="${ny}" width="140" height="${nh}" fill="rgba(0,0,0,0.25)" stroke="${C_DIM}" stroke-width="0.25" rx="2"/>`;
  svg += `<text x="${nx + 5}" y="${ny + 12}" font-family="${mono}" font-size="7" fill="${C_TEXT}" font-weight="600">DETAIL</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 23}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Open face → gutter</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 33}" font-family="${mono}" font-size="6" fill="${C_DIM}">• Web against bracket</text>`;
  if (isPlate) {
    svg += `<text x="${nx + 5}" y="${ny + 43}" font-family="${mono}" font-size="6" fill="${C_PLATE}">• + plate infill (boxed)</text>`;
    svg += `<text x="${nx + 5}" y="${ny + 53}" font-family="${mono}" font-size="6" fill="${C_DIM}">• LTB factor 0.92</text>`;
    svg += `<text x="${nx + 5}" y="${ny + 63}" font-family="${mono}" font-size="6" fill="${C_DIM}">• #14 tek screws @ 300</text>`;
  } else {
    svg += `<text x="${nx + 5}" y="${ny + 43}" font-family="${mono}" font-size="6" fill="${C_DIM}">• LTB factor 0.65</text>`;
  }

  // Section mark
  svg += `<circle cx="${wx + 10}" cy="${wy + 12}" r="7" fill="none" stroke="${C_DIM}" stroke-width="${M}"/>`;
  svg += `<text x="${wx + 10}" y="${wy + 16}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${C_TEXT}" font-weight="600">A</text>`;

  svg += `</svg>`;
  return svg;
}
