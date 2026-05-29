// ── Wall Section Detail — AS1100 Standard Engineering Drawing ──
// Section A-A through existing dwelling wall at eave
// Focus on eave connection detail — the critical area for standoff design

import { generateDrawingFrame, type DrawingInfo } from './drawingFrame';

const mono = 'DM Mono,monospace';
const C_DIM = '#8a8e9e';
const C_TEXT = '#c8cce0';

// Material colours
const C_BRICK = '#B8860B'; const C_BRICK_FILL = 'rgba(184,134,11,0.18)';
const C_STUD = '#8bc34a'; const C_STUD_FILL = 'rgba(139,195,74,0.12)';
const C_PLATE = '#c9a84c'; const C_PLATE_FILL = 'rgba(201,168,76,0.25)';
const C_FASCIA = '#D2691E'; const C_FASCIA_FILL = 'rgba(210,105,30,0.18)';
const C_GUTTER = '#708090'; const C_GUTTER_FILL = 'rgba(112,128,144,0.15)';
const C_SHS = '#2196f3'; const C_SHS_FILL = 'rgba(33,150,243,0.18)';
const C_STRAP = '#aaa';
const C_NEW = '#4caf50';

// Line weights
const T = 1.2, M = 0.6, F = 0.3;

// Arrowhead
function arrow(x: number, y: number, a: number, s = 3.5): string {
  const r = a * Math.PI / 180;
  const x1 = x + s * Math.cos(r), y1 = y + s * Math.sin(r);
  const x2 = x + s * 0.35 * Math.cos(r + 2.4), y2 = y + s * 0.35 * Math.sin(r + 2.4);
  const x3 = x + s * 0.35 * Math.cos(r - 2.4), y3 = y + s * 0.35 * Math.sin(r - 2.4);
  return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${C_DIM}"/>`;
}

// Dimension line with extension lines (AS1100 style)
function dimH(x1: number, y1: number, x2: number, y2: number, label: string, off: number): string {
  let s = '';
  s += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1 - off - 2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y2 - off - 2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x1}" y1="${y1 - off}" x2="${x2}" y2="${y2 - off}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += arrow(x1, y1 - off, 0);
  s += arrow(x2, y2 - off, 180);
  s += `<text x="${(x1 + x2) / 2}" y="${y1 - off - 3}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${C_TEXT}">${label}</text>`;
  return s;
}
function dimV(x1: number, y1: number, x2: number, y2: number, label: string, off: number): string {
  let s = '';
  s += `<line x1="${x1}" y1="${y1}" x2="${x1 - off - 2}" y2="${y1}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x2}" y1="${y2}" x2="${x2 - off - 2}" y2="${y2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x1 - off}" y1="${y1}" x2="${x2 - off}" y2="${y2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += arrow(x1 - off, y1, 90);
  s += arrow(x2 - off, y2, 270);
  s += `<text x="${x1 - off - 3}" y="${(y1 + y2) / 2 + 3}" text-anchor="middle" transform="rotate(-90,${x1 - off - 3},${(y1 + y2) / 2 + 3})" font-family="${mono}" font-size="7" fill="${C_TEXT}">${label}</text>`;
  return s;
}

// Material callout with leader
function callout(x: number, y: number, text: string, lx: number, ly: number): string {
  let s = `<line x1="${lx}" y1="${ly}" x2="${x}" y2="${y}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<circle cx="${x}" cy="${y}" r="1.2" fill="${C_DIM}"/>`;
  const w = text.length * 4.5 + 8;
  s += `<rect x="${x + 2}" y="${y - 5}" width="${w}" height="11" fill="rgba(26,26,30,0.92)" stroke="${C_DIM}" stroke-width="0.25" rx="1"/>`;
  s += `<text x="${x + 5}" y="${y + 3}" font-family="${mono}" font-size="6" fill="${C_TEXT}">${text}</text>`;
  return s;
}

// 45° hatching
function hatch(x: number, y: number, w: number, h: number, sp = 5, col: string): string {
  let d = '', diag = Math.sqrt(w * w + h * h);
  for (let i = -diag; i < diag + w; i += sp) d += `M ${x + i},${y} L ${x + i - h},${y + h} `;
  return `<path d="${d}" stroke="${col}" stroke-width="0.2" opacity="0.5"/>`;
}

export function generateWallSectionSVG(): string {
  const info: DrawingInfo = {
    title: 'SECTION A-A — EXISTING DWELLING WALL AT EAVE',
    drawingNo: 'DRF-001-SEC-A',
    scale: '1 : 5',
    date: '29/05/2026',
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 3',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  // Working area (full A3 frame working area at 1.5x scale)
  const wx = 30, wy = 15;
  const ww = 585, wh = 363;

  // Scale: 1:5 representation (1mm = 0.5px for web display within A3 frame)
  // Actual dimensions in mm × 0.5 = pixels — readable detail
  const sc = 0.5;

  // ── Ground line ──
  const gy = wy + wh - 30;
  svg += `<line x1="${wx}" y1="${gy}" x2="${wx + ww}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += hatch(wx, gy - 6, ww, 6, 3, C_TEXT);
  svg += `<text x="${wx + 5}" y="${gy + 12}" font-family="${mono}" font-size="7" fill="${C_DIM}">GROUND LEVEL</text>`;

  // ── Brick veneer ──
  const bx = wx + 70;
  const bt = 110 * sc; // 55px
  const by1 = gy - 400 * sc; // show 400mm of wall above ground
  const by2 = gy;
  svg += `<rect x="${bx}" y="${by1}" width="${bt}" height="${by2 - by1}" fill="${C_BRICK_FILL}" stroke="${C_BRICK}" stroke-width="${T}"/>`;
  svg += hatch(bx, by1, bt, by2 - by1, 4, C_BRICK);
  // Courses — standard 76mm course height at scale
  for (let y = by2; y > by1 + 5; y -= 38 * sc) {
    svg += `<line x1="${bx}" y1="${y}" x2="${bx + bt}" y2="${y}" stroke="${C_BRICK}" stroke-width="0.3" opacity="0.4"/>`;
  }
  svg += callout(bx - 35, by1 + 80, '110mm BRICK VENEER', bx, by1 + 80);

  // ── Cavity ──
  const cx = bx + bt;
  const cw = 50 * sc; // 25px
  svg += `<rect x="${cx}" y="${by1}" width="${cw}" height="${by2 - by1}" fill="rgba(100,150,200,0.04)" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="2,2"/>`;
  svg += callout(cx + 8, by1 + 60, '50mm CAVITY + SARKING', cx + cw, by1 + 60);

  // ── Stud frame ──
  const sx = cx + cw;
  const sw = 90 * sc; // 45px
  // Studs @ 450ctr — show 3 studs in 400mm height
  for (let i = 0; i < 3; i++) {
    const x = sx + i * 22.5 * sc;
    svg += `<rect x="${x}" y="${by1}" width="${4.5 * sc}" height="${by2 - by1}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${M}"/>`;
  }
  svg += hatch(sx, by1, sw, by2 - by1, 3, C_STUD);
  svg += callout(sx + sw + 8, by1 + 50, '90×45 T/P STUDS @ 450 CTR', sx + sw, by1 + 50);

  // ── Plasterboard ──
  const px = sx + sw;
  const pw = 10 * sc; // 5px
  svg += `<rect x="${px}" y="${by1}" width="${pw}" height="${by2 - by1}" fill="rgba(255,255,255,0.06)" stroke="#ccc" stroke-width="${F}"/>`;
  svg += callout(px + 12, by1 + 35, '10mm PLASTERBOARD', px + pw, by1 + 35);

  // ── Top plate ──
  const plateY = by1;
  const ph = 45 * sc; // 22.5px
  svg += `<rect x="${sx}" y="${plateY - ph}" width="${sw}" height="${ph}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
  svg += hatch(sx, plateY - ph, sw, ph, 2, C_PLATE);
  svg += callout(sx + sw + 8, plateY - ph / 2, '90×45 F17 TOP PLATE', sx + sw, plateY - ph / 2);

  // ── Existing rafter ──
  const rh = 35 * sc; // 17.5px
  const ry = plateY - ph - rh;
  svg += `<rect x="${sx}" y="${ry}" width="${sw}" height="${rh}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${M}"/>`;
  // Birdsmouth detail
  svg += `<line x1="${sx + sw - 6 * sc}" y1="${ry}" x2="${sx + sw - 6 * sc}" y2="${plateY - ph}" stroke="${C_STUD}" stroke-width="${F}" stroke-dasharray="2,2"/>`;
  svg += `<line x1="${sx + sw - 6 * sc}" y1="${plateY - ph}" x2="${sx + sw}" y2="${plateY - ph}" stroke="${C_STUD}" stroke-width="${F}" stroke-dasharray="2,2"/>`;
  svg += callout(sx + sw + 8, ry + rh / 2, '90×35 F17 RAFTER', sx + sw, ry + rh / 2);

  // ── Anti-lift strap ──
  const strapX = sx + sw / 2;
  svg += `<line x1="${strapX}" y1="${ry + rh}" x2="${strapX}" y2="${plateY - ph}" stroke="${C_STRAP}" stroke-width="${M}"/>`;
  svg += `<circle cx="${strapX - 2}" cy="${ry + rh + 2}" r="1" fill="${C_STRAP}"/>`;
  svg += `<circle cx="${strapX + 2}" cy="${ry + rh + 2}" r="1" fill="${C_STRAP}"/>`;
  svg += `<circle cx="${strapX - 2}" cy="${plateY - ph - 2}" r="1" fill="${C_STRAP}"/>`;
  svg += `<circle cx="${strapX + 2}" cy="${plateY - ph - 2}" r="1" fill="${C_STRAP}"/>`;
  svg += callout(strapX + 10, ry + 20, 'ANTI-LIFT STRAP (TCSB)', strapX, ry + 15);

  // ── Fascia board ──
  const ft = 30 * sc; // 15px
  const fo = 40 * sc; // 20px overhang
  const fx = bx - fo;
  const fy = ry - 3 * sc;
  svg += `<rect x="${fx}" y="${fy - ft}" width="${fo + bt + 5 * sc}" height="${ft}" fill="${C_FASCIA_FILL}" stroke="${C_FASCIA}" stroke-width="${T}"/>`;
  svg += hatch(fx, fy - ft, fo + bt + 5 * sc, ft, 2, C_FASCIA);
  svg += callout(fx - 5, fy - ft / 2, '30mm FASCIA BOARD', fx, fy - ft / 2);

  // ── Gutter ──
  const gpx = fx - 85 * sc;
  const gpy = fy - ft - 8 * sc;
  const gp = [
    'M', gpx, gpy + 20 * sc,
    'L', gpx, gpy,
    'Q', gpx + 3 * sc, gpy - 1.5 * sc, gpx + 6 * sc, gpy,
    'L', fx + 2 * sc, gpy + 5 * sc,
    'Q', fx + 3 * sc, gpy + 7 * sc, fx + 3 * sc, gpy + 20 * sc,
    'L', fx + 1.5 * sc, gpy + 20 * sc,
    'L', fx + 1.5 * sc, gpy + 17 * sc,
    'L', gpx + 3 * sc, gpy + 17 * sc,
    'L', gpx + 3 * sc, gpy + 20 * sc,
    'Z',
  ].join(' ');
  svg += `<path d="${gp}" fill="${C_GUTTER_FILL}" stroke="${C_GUTTER}" stroke-width="${M}"/>`;
  svg += callout(gpx + 15, gpy + 8, 'COLORBOND GUTTER', fx + 5 * sc, gpy + 12 * sc);

  // ── 65×65 SHS standoff (NEW WORK) ──
  const shsS = 65 * sc; // 32.5px
  const shx = fx + (fo + bt) / 2 - shsS / 2;
  const shy1 = wy + 5;
  const shy2 = fy + 8 * sc;
  svg += `<rect x="${shx}" y="${shy1}" width="${shsS}" height="${shy2 - shy1}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += `<line x1="${shx + 13 * sc}" y1="${shy1}" x2="${shx + 13 * sc}" y2="${shy2}" stroke="${C_SHS}" stroke-width="${F}" stroke-dasharray="2,2"/>`;
  svg += `<line x1="${shx + shsS - 13 * sc}" y1="${shy1}" x2="${shx + shsS - 13 * sc}" y2="${shy2}" stroke="${C_SHS}" stroke-width="${F}" stroke-dasharray="2,2"/>`;
  svg += hatch(shx, shy1, shsS, shy2 - shy1, 2, C_SHS);

  // NEW WORK label
  svg += `<rect x="${shx + shsS + 5}" y="${shy1 + 5}" width="62" height="24" fill="rgba(76,175,80,0.08)" stroke="${C_NEW}" stroke-width="0.5" rx="2"/>`;
  svg += `<text x="${shx + shsS + 8}" y="${shy1 + 16}" font-family="${mono}" font-size="7" fill="${C_NEW}" font-weight="600">NEW WORK</text>`;
  svg += `<text x="${shx + shsS + 8}" y="${shy1 + 23}" font-family="${mono}" font-size="6" fill="${C_NEW}">65×65 SHS</text>`;

  // Fixings to top plate — M12 lag screws
  svg += `<line x1="${sx + sw / 2}" y1="${plateY - ph}" x2="${shx + shsS / 2}" y2="${shy2 - 15 * sc}" stroke="#f44336" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  svg += `<text x="${(sx + sw / 2 + shx + shsS / 2) / 2}" y="${plateY - ph - 15}" text-anchor="middle" font-family="${mono}" font-size="6" fill="#f44336">M12×100 LAG SCREW @ 600 CTR</text>`;

  // ── DIMENSIONS ──
  // 200mm: fascia bottom → gutter top lip
  svg += dimV(gpx, gpy, gpx, fy, '200', 20);
  // 85mm: fascia face → gutter front
  svg += dimH(fx, gpy + 15 * sc, gpx, gpy + 15 * sc, '85', 8);
  // 30mm: fascia thickness
  svg += dimV(fx - 12, fy, fx - 12, fy - ft, '30', 8);
  // 30mm: gutter rise
  svg += dimV(gpx - 4, gpy, gpx - 4, gpy + 15 * sc, '30', 0);
  // 110mm: brick
  svg += dimH(bx, gy + 12, bx + bt, gy + 12, '110', 8);
  // 50mm: cavity
  svg += dimH(bx + bt, gy + 12, bx + bt + cw, gy + 12, '50', 8);
  // 90mm: stud
  svg += dimH(sx, gy + 22, sx + sw, gy + 22, '90', 8);

  // ── General notes ──
  const nx = wx + ww - 160, ny = wy + wh - 95;
  svg += `<rect x="${nx}" y="${ny}" width="155" height="65" fill="rgba(0,0,0,0.3)" stroke="${C_DIM}" stroke-width="0.25" rx="2"/>`;
  svg += `<text x="${nx + 5}" y="${ny + 12}" font-family="${mono}" font-size="7" fill="${C_TEXT}" font-weight="600">GENERAL NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 22}" font-family="${mono}" font-size="6" fill="${C_DIM}">1. All dimensions in millimetres</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 31}" font-family="${mono}" font-size="6" fill="${C_DIM}">2. Drawn to AS1100.101 / AS1100.301</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 40}" font-family="${mono}" font-size="6" fill="${C_DIM}">3. Existing construction as measured on site</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 49}" font-family="${mono}" font-size="6" fill="${C_NEW}">4. Green outlines indicate NEW WORK</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 58}" font-family="${mono}" font-size="6" fill="${C_DIM}">5. All structural steel to AS1163 Grade C350</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 67}" font-family="${mono}" font-size="6" fill="${C_DIM}">6. Timber to AS1684, F5/F17 as noted</text>`;

  // Section mark A-A
  svg += `<circle cx="${wx + 10}" cy="${wy + 12}" r="7" fill="none" stroke="${C_DIM}" stroke-width="${M}"/>`;
  svg += `<text x="${wx + 10}" y="${wy + 16}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${C_TEXT}" font-weight="600">A</text>`;
  svg += `<text x="${wx + 22}" y="${wy + 16}" font-family="${mono}" font-size="7" fill="${C_DIM}">VIEW DIR →</text>`;

  svg += `</svg>`;
  return svg;
}
