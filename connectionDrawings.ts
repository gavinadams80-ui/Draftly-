// ── Connection Detail Drawings — AS1100 Standard ──
// FIXED: Gutter added to ledger, rafter orientation corrected, layouts fit frame

import type { DrawingParams } from './drawingParams';
// ── Inline DrawingFrame (self-contained) ──
interface DrawingInfo {
  title: string;
  drawingNo: string;
  scale: string;
  date: string;
  revision: string;
  material: string;
  sheet: string;
}

const _mono = 'DM Mono,monospace';
const _frameCol = '#4a4a4a';
const _dimCol = '#6b7090';
const _textCol = '#c8cce0';

function generateDrawingFrame(info: DrawingInfo): string {
  const w = 420, h = 297, border = 12, tbH = 50;
  const tbX = w - border - 200;
  const tbY = h - border - tbH;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="background:transparent;max-width:100%;">`;
  svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${_frameCol}" stroke-width="1"/>`;
  svg += `<rect x="${border}" y="${border}" width="${w - border * 2}" height="${h - border * 2 - tbH}" fill="none" stroke="${_frameCol}" stroke-width="0.5"/>`;
  svg += `<rect x="${tbX}" y="${tbY}" width="200" height="${tbH}" fill="none" stroke="${_frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX}" y1="${tbY + 16}" x2="${tbX + 200}" y2="${tbY + 16}" stroke="${_frameCol}" stroke-width="0.3"/>`;
  svg += `<line x1="${tbX + 100}" y1="${tbY}" x2="${tbX + 100}" y2="${tbY + 16}" stroke="${_frameCol}" stroke-width="0.3"/>`;
  svg += `<line x1="${tbX + 50}" y1="${tbY + 16}" x2="${tbX + 50}" y2="${tbY + tbH}" stroke="${_frameCol}" stroke-width="0.3"/>`;
  svg += `<line x1="${tbX + 150}" y1="${tbY + 16}" x2="${tbX + 150}" y2="${tbY + tbH}" stroke="${_frameCol}" stroke-width="0.3"/>`;
  svg += `<text x="${tbX + 100}" y="${tbY + 12}" text-anchor="middle" fill="${_textCol}" font-family="${_mono}" font-size="10" font-weight="bold">${info.title}</text>`;
  svg += `<text x="${tbX + 25}" y="${tbY + 28}" text-anchor="middle" fill="${_dimCol}" font-family="${_mono}" font-size="7">DRAWING NO</text>`;
  svg += `<text x="${tbX + 25}" y="${tbY + 40}" text-anchor="middle" fill="${_textCol}" font-family="${_mono}" font-size="8" font-weight="bold">${info.drawingNo}</text>`;
  svg += `<text x="${tbX + 75}" y="${tbY + 28}" text-anchor="middle" fill="${_dimCol}" font-family="${_mono}" font-size="7">SCALE</text>`;
  svg += `<text x="${tbX + 75}" y="${tbY + 40}" text-anchor="middle" fill="${_textCol}" font-family="${_mono}" font-size="8" font-weight="bold">${info.scale}</text>`;
  svg += `<text x="${tbX + 125}" y="${tbY + 28}" text-anchor="middle" fill="${_dimCol}" font-family="${_mono}" font-size="7">DATE</text>`;
  svg += `<text x="${tbX + 125}" y="${tbY + 40}" text-anchor="middle" fill="${_textCol}" font-family="${_mono}" font-size="8" font-weight="bold">${info.date}</text>`;
  svg += `<text x="${tbX + 175}" y="${tbY + 28}" text-anchor="middle" fill="${_dimCol}" font-family="${_mono}" font-size="7">MATERIAL</text>`;
  svg += `<text x="${tbX + 175}" y="${tbY + 40}" text-anchor="middle" fill="${_textCol}" font-family="${_mono}" font-size="8">${info.material}</text>`;
  svg += `<text x="${tbX + 50}" y="${tbY + 52}" text-anchor="middle" fill="${_dimCol}" font-family="${_mono}" font-size="7">SHEET</text>`;
  svg += `<text x="${tbX + 50}" y="${tbY + 64}" text-anchor="middle" fill="${_textCol}" font-family="${_mono}" font-size="8">${info.sheet}</text>`;
  svg += `<text x="${tbX + 125}" y="${tbY + 52}" text-anchor="middle" fill="${_dimCol}" font-family="${_mono}" font-size="7">PROJECT</text>`;
  svg += `<text x="${tbX + 125}" y="${tbY + 64}" text-anchor="middle" fill="${_textCol}" font-family="${_mono}" font-size="8">Draftly</text>`;
  return svg;
}



const mono = 'DM Mono,monospace';
const C_DIM = '#8a8e9e';
const C_TEXT = '#c8cce0';
const C_BRICK = '#B8860B'; const C_BRICK_FILL = 'rgba(184,134,11,0.18)';
const C_LEDGER = '#c9a84c'; const C_LEDGER_FILL = 'rgba(201,168,76,0.2)';
const C_POST = '#8bc34a'; const C_POST_FILL = 'rgba(139,195,74,0.2)';
const C_BOLT = '#f44336';
const C_STANDOFF = '#2196f3'; const C_STANDOFF_FILL = 'rgba(33,150,243,0.18)';
const C_PLATE = '#ff9800'; const C_PLATE_FILL = 'rgba(255,152,0,0.2)';
const C_SCREW = '#ff5722';
const C_GUTTER = '#708090'; const C_GUTTER_FILL = 'rgba(112,128,144,0.15)';
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
  s += `<line x1="${x1}" y1="${y1 - off}" x2="${x2}" y2="${y2 - off}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1 - off - 3}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y2 - off - 3}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += arrow(x1, y1 - off, 0); s += arrow(x2, y2 - off, 180);
  s += `<text x="${(x1 + x2) / 2}" y="${y1 - off - 4}" text-anchor="middle" fill="${C_DIM}" font-family="${mono}" font-size="9">${label}</text>`;
  return s;
}
function dimV(x1: number, y1: number, x2: number, y2: number, label: string, off: number): string {
  let s = '';
  s += `<line x1="${x1 - off}" y1="${y1}" x2="${x2 - off}" y2="${y2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x1}" y1="${y1}" x2="${x1 - off - 3}" y2="${y1}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x2}" y1="${y2}" x2="${x2 - off - 3}" y2="${y2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += arrow(x1 - off, y1, 90); s += arrow(x2 - off, y2, 270);
  s += `<text x="${x1 - off - 4}" y="${(y1 + y2) / 2 + 3}" text-anchor="end" fill="${C_DIM}" font-family="${mono}" font-size="9">${label}</text>`;
  return s;
}
function callout(x: number, y: number, text: string, lx: number, ly: number): string {
  let s = `<line x1="${lx}" y1="${ly}" x2="${x}" y2="${y}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  const w = text.length * 5.5 + 14;
  s += `<rect x="${x - w / 2}" y="${y - 7}" width="${w}" height="14" rx="2" fill="rgba(30,30,40,0.85)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="8">${text}</text>`;
  return s;
}
function hatch(x: number, y: number, w: number, h: number, sp = 5, col: string): string {
  let d = '', diag = Math.sqrt(w * w + h * h);
  for (let i = -diag; i < diag + w; i += sp) d += `M ${x + i},${y} L ${x + i - h},${y + h} `;
  return `<path d="${d}" stroke="${col}" stroke-width="0.5" fill="none"/>`;
}

// Parse C-section dimensions
function parseCDims(size: string): { d: number; b: number; t: number } {
  const m = size.match(/C(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*([\d.]+)/);
  if (m) return { d: parseInt(m[1]), b: parseInt(m[2]), t: parseFloat(m[3]) };
  return { d: 150, b: 50, t: 1.6 };
}

// Parse base plate: "150x150x8" → { w: 150, h: 150, t: 8 }
function parsePlateSize(size: string): { w: number; h: number; t: number } {
  const parts = size.split(/[x×]/);
  if (parts.length >= 3) return { w: parseInt(parts[0]), h: parseInt(parts[1]), t: parseInt(parts[2]) };
  return { w: 150, h: 150, t: 8 };
}

// Parse concrete pad: "400x400x300" → { w: 400, d: 400, h: 300 }
function parsePadSize(size: string): { w: number; d: number; h: number } {
  const parts = size.split(/[x×]/);
  if (parts.length >= 3) return { w: parseInt(parts[0]), d: parseInt(parts[1]), h: parseInt(parts[2]) };
  return { w: 400, d: 400, h: 300 };
}

// ── Corner Post Detail — AS1100 ──
export function generateCornerPostSVG(params?: DrawingParams): string {
  const p = params || {
    postSize: 'C100x50x1.6', ledgerSize: 'C150x50x1.9',
    basePlateSize: '150x150x8', anchorSize: 'M16', concretePad: '400x400x300',
    boltSize: 'M12', boltSpacing: 600
  } as DrawingParams;

  const postDims = parseCDims(p.postSize || 'C100x50x1.6');
  const ledDims = parseCDims(p.ledgerSize || 'C150x50x1.9');
  const bpDims = parsePlateSize(p.basePlateSize || '150x150x8');
  const padDims = parsePadSize(p.concretePad || '400x400x300');
  const anchorDia = parseInt((p.anchorSize || 'M16').replace('M', ''));
  const boltDia = parseInt((p.boltSize || 'M12').replace('M', ''));

  const info: DrawingInfo = {
    title: 'CORNER POST · LEDGER CONNECTION',
    drawingNo: 'DRF-003-POST-01',
    scale: '1 : 5',
    date: new Date().toLocaleDateString('en-AU'),
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

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
  svg += `<line x1="${ledX + ledW * 0.15}" y1="${ledY + ledD / 2}" x2="${ledX + ledW * 0.85}" y2="${ledY + ledD / 2}" stroke="${C_LEDGER}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  const lip = 10 * sc;
  svg += `<line x1="${ledX}" y1="${ledY + lip}" x2="${ledX + ledW}" y2="${ledY + lip}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += `<line x1="${ledX}" y1="${ledY + ledD - lip}" x2="${ledX + ledW}" y2="${ledY + ledD - lip}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += callout(ledX + ledW / 2, ledY - 10, p.ledgerSize || 'C150x50x1.9', ledX + ledW / 2, ledY);

  // Post (vertical) — FIXED: proper C-section profile with lips
  const postH = 120 * sc;
  const postD = postDims.d * sc;
  const postB = postDims.b * sc;
  const postX = cx - postB / 2;
  const postY = cy;
  svg += `<rect x="${postX}" y="${postY}" width="${postB}" height="${postH}" fill="${C_POST_FILL}" stroke="${C_POST}" stroke-width="${T}"/>`;
  svg += `<line x1="${postX + postB / 2}" y1="${postY + postH * 0.15}" x2="${postX + postB / 2}" y2="${postY + postH * 0.85}" stroke="${C_POST}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  const postLip = Math.max(postDims.b * 0.2 * sc, 3);
  svg += `<line x1="${postX + postLip}" y1="${postY}" x2="${postX + postLip}" y2="${postY + postH}" stroke="${C_POST}" stroke-width="${M}"/>`;
  svg += `<line x1="${postX + postB - postLip}" y1="${postY}" x2="${postX + postB - postLip}" y2="${postY + postH}" stroke="${C_POST}" stroke-width="${M}"/>`;
  svg += callout(postX + postB + 15, postY + postH / 2, p.postSize || 'C100x50x1.6', postX + postB, postY + postH / 2);

  // M12 bolts through ledger into post
  svg += `<circle cx="${cx}" cy="${cy - 15}" r="${boltDia * 0.15}" fill="none" stroke="${C_BOLT}" stroke-width="1"/>`;
  svg += `<circle cx="${cx}" cy="${cy + 15}" r="${boltDia * 0.15}" fill="none" stroke="${C_BOLT}" stroke-width="1"/>`;
  svg += callout(cx + 35, cy - 15, `2x ${p.boltSize || 'M12'} BOLTS`, cx + 12, cy);

  // Base plate
  const bpW = bpDims.w * sc;
  const bpH = bpDims.t * sc;
  const bpY = postY + postH;
  svg += `<rect x="${cx - bpW / 2}" y="${bpY}" width="${bpW}" height="${bpH}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
  svg += callout(cx + bpW / 2 + 10, bpY + bpH / 2, `${p.basePlateSize || '150x150x8'} BASE PLATE`, cx + bpW / 2, bpY + bpH / 2);

  // Concrete pad
  const padW = padDims.w * sc;
  const padH = padDims.h * sc;
  svg += `<rect x="${cx - padW / 2}" y="${bpY + bpH}" width="${padW}" height="${padH}" fill="none" stroke="#888" stroke-width="${M}"/>`;
  svg += hatch(cx - padW / 2, bpY + bpH, padW, padH, 3, '#888');
  svg += callout(cx + padW / 2 + 10, bpY + bpH + padH / 2, `${p.concretePad || '400x400x300'} CONC PAD`, cx + padW / 2, bpY + bpH + padH / 2);

  // Ground line
  const gy = bpY + bpH + padH;
  svg += `<line x1="${wx}" y1="${gy}" x2="${wx + 350}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}" stroke-dasharray="4,3"/>`;
  svg += hatch(wx, gy - 4, 350, 4, 2, C_TEXT);
  svg += `<text x="${wx + 340}" y="${gy + 12}" text-anchor="end" fill="${C_TEXT}" font-family="${mono}" font-size="9">GROUND LEVEL</text>`;

  // Anchor bolts — FIXED: proper spacing inside plate
  const anchorSpreadX = bpW * 0.6;
  const anchorSpreadY = bpH * 0.5;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const bx_pos = cx - anchorSpreadX / 2 + i * anchorSpreadX;
      const by_pos = bpY + anchorSpreadY / 2 + j * anchorSpreadY;
      svg += `<circle cx="${bx_pos}" cy="${by_pos}" r="${anchorDia * 0.15}" fill="none" stroke="${C_BOLT}" stroke-width="1"/>`;
      svg += `<line x1="${bx_pos - 2}" y1="${by_pos}" x2="${bx_pos + 2}" y2="${by_pos}" stroke="${C_BOLT}" stroke-width="0.8"/>`;
    }
  }
  svg += `<text x="${cx}" y="${bpY - 5}" text-anchor="middle" fill="${C_BOLT}" font-family="${mono}" font-size="8">4x ${p.anchorSize || 'M16'} ANCHORS</text>`;

  // Dimensions — FIXED: moved to bottom so they don't overlap
  svg += dimH(postX, gy + 8, postX + postB, gy + 8, `${postDims.d}`, 6);
  svg += dimV(postX - 10, postY, postX - 10, bpY, `${postDims.d}`, 8);
  svg += dimH(cx - bpW / 2, gy + 16, cx + bpW / 2, gy + 16, `${bpDims.w}`, 6);

  // Notes
  const nx = wx + 220, ny = wy + 10;
  svg += `<rect x="${nx}" y="${ny}" width="140" height="55" rx="3" fill="rgba(30,30,40,0.7)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${nx + 70}" y="${ny + 12}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 26}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Post INSIDE frame, bolted</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 38}" fill="${C_TEXT}" font-family="${mono}" font-size="7">  through ledger</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 50}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Base plate: gal steel</text>`;

  // Section mark
  svg += `<circle cx="${wx + 30}" cy="${wy + 30}" r="12" fill="none" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += `<text x="${wx + 30}" y="${wy + 34}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">A</text>`;

  svg += '</svg>';
  return svg;
}

// ── Rafter to Ledger Connection — AS1100 ──
// FIXED: C-section open face now points toward gutter (downward)
export function generateRafterLedgerSVG(params?: DrawingParams): string {
  const p = params || {
    rafterSize: 'C250x65x2.4', ledgerSize: 'C150x50x1.9',
    pitchAngle: 10, birdsmouthDepth: 25, boltThroughSize: 'M12'
  } as DrawingParams;

  const raftDims = parseCDims(p.rafterSize || 'C250x65x2.4');
  const ledDims = parseCDims(p.ledgerSize || 'C150x50x1.9');
  const pitch = p.pitchAngle || 10;
  const birdsmouth = p.birdsmouthDepth || 25;
  const boltDia = parseInt((p.boltThroughSize || 'M12').replace('M', ''));

  const info: DrawingInfo = {
    title: 'RAFTER → LEDGER CONNECTION',
    drawingNo: 'DRF-004-RAFT-01',
    scale: '1 : 5',
    date: new Date().toLocaleDateString('en-AU'),
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const wx = 30, wy = 15;
  const sc = 0.5;
  const cx = wx + 200;
  const baseY = wy + 200;

  // Ledger (horizontal)
  const ledW = 200 * sc;
  const ledD = ledDims.d * sc;
  const ledX = cx - ledW / 2;
  const ledY = baseY;
  svg += `<rect x="${ledX}" y="${ledY}" width="${ledW}" height="${ledD}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  svg += `<line x1="${ledX + ledW * 0.15}" y1="${ledY + ledD / 2}" x2="${ledX + ledW * 0.85}" y2="${ledY + ledD / 2}" stroke="${C_LEDGER}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  const ledLip = Math.max(ledDims.b * 0.2 * sc, 3);
  svg += `<line x1="${ledX}" y1="${ledY + ledLip}" x2="${ledX + ledW}" y2="${ledY + ledLip}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += `<line x1="${ledX}" y1="${ledY + ledD - ledLip}" x2="${ledX + ledW}" y2="${ledY + ledD - ledLip}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += callout(cx, ledY + 12, p.ledgerSize || 'C150x50x1.9', cx, ledY);

  // Rafter (angled at pitch) — FIXED: open face points down (toward gutter/interior)
  const raftD = raftDims.d * sc;
  const raftL = 160 * sc;
  const angle = pitch * Math.PI / 180;
  const rEx = cx + 30; // wall/ledger end (right side)
  const rEy = ledY - ledD - 60 * sc; // above ledger
  const rSx = rEx - raftL * Math.cos(angle); // ridge end (left, higher)
  const rSy = rEy + raftL * Math.sin(angle); // lower y = further down screen

  // Perpendicular offset for C-section depth (open face DOWN)
  const perpX = Math.sin(angle) * raftD;
  const perpY = -Math.cos(angle) * raftD; // negative = downward (toward gutter)

  // Draw C-section profile: web + flanges + lips
  const webSx = rSx, webSy = rSy;
  const webEx = rEx, webEy = rEy;
  const flange1Sx = webSx + perpX, flange1Sy = webSy + perpY;
  const flange1Ex = webEx + perpX, flange1Ey = webEy + perpY;

  svg += `<polygon points="${webSx},${webSy} ${webEx},${webEy} ${flange1Ex},${flange1Ey} ${flange1Sx},${flange1Sy}" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;

  // Web centreline
  const wSx = webSx + perpX * 0.5, wSy = webSy + perpY * 0.5;
  const wEx = webEx + perpX * 0.5, wEy = webEy + perpY * 0.5;
  svg += `<line x1="${wSx}" y1="${wSy}" x2="${wEx}" y2="${wEy}" stroke="${C_LEDGER}" stroke-width="${M}" stroke-dasharray="3,2"/>`;

  // Flange lips (return lips pointing down)
  const lipLen = Math.max(raftDims.b * 0.25 * sc, 3);
  svg += `<line x1="${flange1Sx}" y1="${flange1Sy}" x2="${flange1Sx + lipLen * Math.cos(angle)}" y2="${flange1Sy + lipLen * Math.sin(angle)}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += `<line x1="${flange1Ex}" y1="${flange1Ey}" x2="${flange1Ex + lipLen * Math.cos(angle)}" y2="${flange1Ey + lipLen * Math.sin(angle)}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;

  svg += callout(rEx + 15, rEy + 10, p.rafterSize || 'C250x65x2.4', rEx, rEy + perpY / 2);

  // Birdsmouth cut detail — at the ledger end (rEx, rEy)
  const bmDepth = birdsmouth * sc;
  const bmX1 = rEx - bmDepth * Math.cos(angle);
  const bmY1 = rEy - bmDepth * Math.sin(angle);
  const bmX2 = rEx + perpX * 0.3;
  const bmY2 = rEy + perpY * 0.3;
  svg += `<line x1="${rEx}" y1="${rEy}" x2="${bmX1}" y2="${bmY1}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  svg += `<line x1="${bmX1}" y1="${bmY1}" x2="${bmX2}" y2="${bmY2}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  svg += callout(rEx + 25, rEy - 5, `BIRDSMOUTH ${birdsmouth}mm`, rEx + 8, rEy);

  // M12 bolt through rafter web into ledger
  const boltX = rEx - 15 * Math.cos(angle);
  const boltY = rEy - 15 * Math.sin(angle) + perpY * 0.5;
  svg += `<circle cx="${boltX}" cy="${boltY}" r="${boltDia * 0.15}" fill="none" stroke="${C_BOLT}" stroke-width="1"/>`;
  svg += callout(boltX + 20, boltY - 12, `${p.boltThroughSize || 'M12'} BOLT`, boltX + 12, boltY);

  // Dimensions
  svg += dimV(rEx + perpX + 20, rEy, rEx + perpX + 20, rEy + perpY, `${raftDims.d}`, 12);

  // Notes
  const nx = wx + 260, ny = wy + 10;
  svg += `<rect x="${nx}" y="${ny}" width="140" height="60" rx="3" fill="rgba(30,30,40,0.7)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${nx + 70}" y="${ny + 12}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">DETAIL NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 26}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• ${pitch}° roof pitch</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 38}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Birdsmouth seat cut ${birdsmouth}mm</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 50}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• ${p.boltThroughSize || 'M12'} through-bolt</text>`;

  // Pitch angle arc
  const arcR = 30;
  const arcCx = ledX + ledW;
  const arcCy = ledY;
  svg += `<path d="M ${arcCx + arcR} ${arcCy - arcR} A ${arcR} ${arcR} 0 0 1 ${arcCx + arcR * Math.cos(angle)} ${arcCy - arcR * Math.sin(angle)}" fill="none" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${arcCx + arcR + 5}" y="${arcCy - arcR / 2}" fill="${C_DIM}" font-family="${mono}" font-size="9">${pitch}°</text>`;

  // Section mark
  svg += `<circle cx="${wx + 30}" cy="${wy + 30}" r="12" fill="none" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += `<text x="${wx + 30}" y="${wy + 34}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">A</text>`;

  svg += '</svg>';
  return svg;
}

// ── Cross-Bracing Detail — AS1100 ──
export function generateCrossBracingSVG(params?: DrawingParams): string {
  const p = params || {
    braceSize: 'C75x40x1.2', bayWidth: 3.0, bayHeight: 2.7,
    boltSize: 'M12'
  } as DrawingParams;

  const braceDims = parseCDims(p.braceSize || 'C75x40x1.2');
  const bw = p.bayWidth || 3.0;
  const bh = p.bayHeight || 2.7;
  const boltDia = parseInt((p.boltSize || 'M12').replace('M', ''));

  const info: DrawingInfo = {
    title: 'CROSS-BRACING (X-BRACE) · END BAY',
    drawingNo: 'DRF-005-BRACE-01',
    scale: 'NTS',
    date: new Date().toLocaleDateString('en-AU'),
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const wx = 30, wy = 15;
  const sc = 35;
  const bayW = bw * sc;
  const bayH = bh * sc * 0.6;

  const leftX = wx + 80;
  const rightX = leftX + bayW;
  const topY = wy + 40;
  const botY = topY + bayH;

  // Posts
  const postW = 12;
  svg += `<rect x="${leftX - postW / 2}" y="${topY}" width="${postW}" height="${bayH}" fill="${C_POST_FILL}" stroke="${C_POST}" stroke-width="${T}"/>`;
  svg += `<rect x="${rightX - postW / 2}" y="${topY}" width="${postW}" height="${bayH}" fill="${C_POST_FILL}" stroke="${C_POST}" stroke-width="${T}"/>`;
  svg += callout(leftX - 35, topY + bayH / 2, 'POST', leftX - postW / 2, topY + bayH / 2);
  svg += callout(rightX + 25, topY + bayH / 2, 'POST', rightX + postW / 2, topY + bayH / 2);

  // Rafter (top)
  svg += `<rect x="${leftX}" y="${topY - 6}" width="${bayW}" height="6" fill="${C_LEDGER_FILL}" stroke="${C_LEDGER}" stroke-width="${T}"/>`;
  svg += callout((leftX + rightX) / 2, topY - 8, 'RAFTER', (leftX + rightX) / 2, topY);

  // X-braces (tension-only, dashed)
  svg += `<line x1="${leftX}" y1="${botY}" x2="${rightX}" y2="${topY}" stroke="${C_STANDOFF}" stroke-width="${T}" stroke-dasharray="6,3"/>`;
  svg += `<line x1="${leftX}" y1="${topY}" x2="${rightX}" y2="${botY}" stroke="${C_STANDOFF}" stroke-width="${T}" stroke-dasharray="6,3"/>`;

  // Centre intersection bolt
  svg += `<circle cx="${(leftX + rightX) / 2}" cy="${(topY + botY) / 2}" r="${boltDia * 0.15}" fill="none" stroke="${C_BOLT}" stroke-width="1"/>`;

  // Bracing section callout
  svg += callout(rightX + 40, (topY + botY) / 2, p.braceSize || 'C75x40x1.2', rightX + 10, (topY + botY) / 2);

  // Dimensions
  svg += dimH(leftX, botY + 10, rightX, botY + 10, `${bw.toFixed(2)}m`, 10);
  svg += dimV(rightX + 18, topY, rightX + 18, botY, `${bh.toFixed(2)}m`, 12);

  // Notes
  const nx = wx + 280, ny = wy + 10;
  svg += `<rect x="${nx}" y="${ny}" width="150" height="72" rx="3" fill="rgba(30,30,40,0.7)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${nx + 75}" y="${ny + 12}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 26}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Tension-only design</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 38}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• One brace active at a time</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 50}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• ${p.boltSize || 'M12'} bolts at ends</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 62}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• End bay only for 3-side</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 74}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• AS4600 cold-formed design</text>`;

  // Section mark
  svg += `<circle cx="${wx + 30}" cy="${wy + 30}" r="12" fill="none" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += `<text x="${wx + 30}" y="${wy + 34}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">A</text>`;

  svg += '</svg>';
  return svg;
}

// ── Ledger to Wall Connection — AS1100 ──
// FIXED: Added Colorbond gutter above ledger, improved C-section profile
export function generateLedgerConnectionSVG(params?: DrawingParams): string {
  const p = params || {
    standoffMm: 150, ledgerSize: 'C150x50x1.9',
    bracketType: 'angle', bracketMaterial: 'gal-steel',
    boltSize: 'M12', boltSpacing: 600
  } as DrawingParams;

  const ledDims = parseCDims(p.ledgerSize || 'C150x50x1.9');
  const standoff = p.standoffMm || 150;
  const boltDia = parseInt((p.boltSize || 'M12').replace('M', ''));
  const isPlate = p.bracketType === 'plate' || false;

  const info: DrawingInfo = {
    title: `LEDGER · ${standoff}mm STANDOFF TO BRICK`,
    drawingNo: 'DRF-006-LEDG-01',
    scale: '1 : 5',
    date: new Date().toLocaleDateString('en-AU'),
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const wx = 30, wy = 15;
  const sc = 0.5;
  const wallX = wx + 60;
  const wallW = 110 * sc;

  const cDepth = ledDims.d;
  const cFlange = ledDims.b;
  const cThick = Math.max(ledDims.t, 2);

  const bracketW = standoff * sc;
  const bracketH = 60 * sc;
  const bracketX = wallX + wallW;
  const bracketY = wy + 100;

  // Brick wall
  svg += `<rect x="${wallX}" y="${wy + 35}" width="${wallW}" height="${180 * sc}" fill="${C_BRICK_FILL}" stroke="${C_BRICK}" stroke-width="${T}"/>`;
  for (let y = wy + 35; y < wy + 30 + 180 * sc - 5; y += 7.6 * sc) {
    svg += `<line x1="${wallX}" y1="${y}" x2="${wallX + wallW}" y2="${y}" stroke="${C_BRICK}" stroke-width="${F}"/>`;
  }
  svg += callout(wallX - 20, wy + 80, '110mm BRICK', wallX, wy + 80);

  // Standoff bracket
  const bracketColor = p.bracketMaterial === 'stainless' ? '#c0c0c0' : p.bracketMaterial === 'aluminium' ? '#a0a0a0' : C_STANDOFF;
  svg += `<rect x="${bracketX}" y="${bracketY}" width="${bracketW}" height="${bracketH}" fill="${C_STANDOFF_FILL}" stroke="${bracketColor}" stroke-width="${T}"/>`;
  svg += callout(bracketX + bracketW / 2, bracketY - 10, `${standoff}mm ${p.bracketType?.toUpperCase() || 'ANGLE'} BRACKET`, bracketX + bracketW / 2, bracketY);

  // Chem anchors through bracket into wall
  const aY1 = bracketY + bracketH * 0.3;
  const aY2 = bracketY + bracketH * 0.7;
  svg += `<circle cx="${wallX + wallW / 2}" cy="${aY1}" r="${boltDia * 0.15}" fill="none" stroke="${C_BOLT}" stroke-width="1"/>`;
  svg += `<circle cx="${wallX + wallW / 2}" cy="${aY2}" r="${boltDia * 0.15}" fill="none" stroke="${C_BOLT}" stroke-width="1"/>`;
  svg += callout(wallX + wallW / 2, aY1 + 3, p.boltSize || 'M12', wallX + wallW / 2, aY1);
  svg += callout(wallX + wallW / 2, aY2 + 10, `@${p.boltSpacing || 600}ctr`, wallX + wallW / 2, aY2);

  // C-section ledger — FIXED: proper profile with web, flanges, lips
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
  // Return lips
  const lipPx = Math.max(cFlPx * 0.25, 3);
  svg += `<line x1="${webX + cThPx + cFlPx - lipPx}" y1="${cy + cThPx}" x2="${webX + cThPx + cFlPx}" y2="${cy + cThPx}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;
  svg += `<line x1="${webX + cThPx + cFlPx - lipPx}" y1="${cy + cDpPx - cThPx}" x2="${webX + cThPx + cFlPx}" y2="${cy + cDpPx - cThPx}" stroke="${C_LEDGER}" stroke-width="${M}"/>`;

  // Plate infill (if selected)
  let outerFaceX = webX + cThPx + cFlPx;
  if (isPlate) {
    const plateTh = 5;
    svg += `<rect x="${outerFaceX}" y="${cy}" width="${plateTh}" height="${cDpPx}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
    [-cDpPx * 0.25, 0, cDpPx * 0.25].forEach((dy) => {
      svg += `<circle cx="${outerFaceX + plateTh / 2}" cy="${cy + cDpPx / 2 + dy}" r="2" fill="none" stroke="${C_SCREW}" stroke-width="0.8"/>`;
    });
    svg += callout(outerFaceX + plateTh + 5, cy + cDpPx / 2, 'PLATE INFILL', outerFaceX + plateTh, cy + cDpPx / 2);
    outerFaceX += plateTh;
  }

  svg += callout(webX + cThPx + cFlPx + 15, cy + cDpPx / 2, p.ledgerSize || 'C150x50x1.9', webX + cThPx + cFlPx, cy + cDpPx / 2);

  // Bolts through bracket into C-section web
  const boltY = cy + cDpPx / 2;
  svg += `<circle cx="${bracketX + bracketW / 2}" cy="${boltY}" r="${boltDia * 0.15}" fill="none" stroke="${C_BOLT}" stroke-width="1"/>`;
  svg += `<line x1="${bracketX + bracketW / 2 - 2}" y1="${boltY}" x2="${bracketX + bracketW / 2 + 2}" y2="${boltY}" stroke="${C_BOLT}" stroke-width="0.8"/>`;

  // ── GUTTER ABOVE LEDGER — NEW ──
  const gutterY = cy - 25 * sc;
  const gutterW = cFlPx + 40 * sc;
  const gutterX = webX + cThPx - 10 * sc;
  // Simple Colorbond gutter profile
  svg += `<path d="M ${gutterX} ${gutterY + 15 * sc} L ${gutterX} ${gutterY} Q ${gutterX + 3 * sc} ${gutterY - 1.5 * sc} ${gutterX + 6 * sc} ${gutterY} L ${gutterX + gutterW} ${gutterY + 5 * sc} Q ${gutterX + gutterW + 3 * sc} ${gutterY + 7 * sc} ${gutterX + gutterW + 3 * sc} ${gutterY + 15 * sc} L ${gutterX + gutterW + 1.5 * sc} ${gutterY + 15 * sc} L ${gutterX + gutterW + 1.5 * sc} ${gutterY + 12 * sc} L ${gutterX + 3 * sc} ${gutterY + 12 * sc} L ${gutterX + 3 * sc} ${gutterY + 15 * sc} Z" fill="${C_GUTTER_FILL}" stroke="${C_GUTTER}" stroke-width="${T}"/>`;
  svg += callout(gutterX + gutterW / 2, gutterY - 8, 'Colorbond Gutter', gutterX + gutterW / 2, gutterY);

  // Fascia behind gutter
  const fasciaH = 20 * sc;
  svg += `<rect x="${wallX}" y="${gutterY - fasciaH}" width="${wallW + bracketW + cThPx + cFlPx + 10 * sc}" height="${fasciaH}" fill="${C_FASCIA_FILL}" stroke="${C_FASCIA}" stroke-width="${T}"/>`;

  // Dimensions
  const dimY = wy + 200;
  svg += dimH(wallX, dimY, outerFaceX, dimY, `${standoff + cDepth + (isPlate ? 5 : 0)}mm`, 10);
  svg += dimH(bracketX, dimY - 18, webX, dimY - 18, `${standoff}mm`, 6);

  // Notes
  const nx = wx + 260, ny = wy + 10;
  const nh = isPlate ? 70 : 50;
  svg += `<rect x="${nx}" y="${ny}" width="150" height="${nh}" rx="3" fill="rgba(30,30,40,0.7)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${nx + 75}" y="${ny + 12}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">DETAIL</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 26}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Open face → gutter</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 38}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Web against bracket</text>`;
  if (isPlate) {
    svg += `<text x="${nx + 5}" y="${ny + 50}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• + plate infill (boxed)</text>`;
    svg += `<text x="${nx + 5}" y="${ny + 62}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• LTB factor 0.92</text>`;
    svg += `<text x="${nx + 5}" y="${ny + 74}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• #14 tek screws @ 300</text>`;
  } else {
    svg += `<text x="${nx + 5}" y="${ny + 50}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• LTB factor 0.65</text>`;
  }

  // Section mark
  svg += `<circle cx="${wx + 30}" cy="${wy + 30}" r="12" fill="none" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += `<text x="${wx + 30}" y="${wy + 34}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">A</text>`;

  svg += '</svg>';
  return svg;
}
