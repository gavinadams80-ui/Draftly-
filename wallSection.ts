// ── Wall Section Detail — AS1100 Standard Engineering Drawing ──
// NOW EDITABLE: accepts DrawingParams for all configurable dimensions

import { generateDrawingFrame, type DrawingInfo } from './drawingFrame';
import type { DrawingParams } from './drawingParams';

const mono = 'DM Mono,monospace';
const C_DIM = '#8a8e9e';
const C_TEXT = '#c8cce0';

const C_BRICK = '#B8860B'; const C_BRICK_FILL = 'rgba(184,134,11,0.18)';
const C_STUD = '#8bc34a'; const C_STUD_FILL = 'rgba(139,195,74,0.12)';
const C_PLATE = '#c9a84c'; const C_PLATE_FILL = 'rgba(201,168,76,0.25)';
const C_FASCIA = '#D2691E'; const C_FASCIA_FILL = 'rgba(210,105,30,0.18)';
const C_GUTTER = '#708090'; const C_GUTTER_FILL = 'rgba(112,128,144,0.15)';
const C_SHS = '#2196f3'; const C_SHS_FILL = 'rgba(33,150,243,0.18)';
const C_STRAP = '#aaa';
const C_NEW = '#4caf50';

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
  const w = text.length * 4.5 + 8;
  s += `<rect x="${x - w / 2}" y="${y - 6}" width="${w}" height="12" rx="2" fill="rgba(30,30,40,0.85)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<text x="${x}" y="${y + 3}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="8">${text}</text>`;
  return s;
}

function hatch(x: number, y: number, w: number, h: number, sp = 5, col: string): string {
  let d = '', diag = Math.sqrt(w * w + h * h);
  for (let i = -diag; i < diag + w; i += sp) d += `M ${x + i},${y} L ${x + i - h},${y + h} `;
  return `<path d="${d}" stroke="${col}" stroke-width="0.5" fill="none"/>`;
}

// Parse stud size string
function parseStudSize(size: string): { w: number; d: number } {
  const m = size.match(/(\d+)x(\d+)/);
  if (m) return { w: parseInt(m[1]), d: parseInt(m[2]) };
  return { w: 90, d: 45 };
}

// Parse SHS size string
function parseShsSize(size: string): { s: number } {
  const m = size.match(/(\d+)x(\d+)/);
  if (m) return { s: parseInt(m[1]) };
  return { s: 65 };
}

// Parse lag screw size
function parseLagSize(size: string): { dia: number; len: number } {
  const m = size.match(/M(\d+)x(\d+)/);
  if (m) return { dia: parseInt(m[1]), len: parseInt(m[2]) };
  return { dia: 12, len: 100 };
}

export function generateWallSectionSVG(params?: DrawingParams): string {
  const p = params || getDefaultDrawingParams();

  const studDims = parseStudSize(p.studSize);
  const shsDims = parseShsSize(p.shsStandoff);
  const lagDims = parseLagSize(p.lagScrewSize);

  const info: DrawingInfo = {
    title: 'SECTION A-A — EXISTING DWELLING WALL AT EAVE',
    drawingNo: 'DRF-001-SEC-A',
    scale: '1 : 5',
    date: new Date().toLocaleDateString('en-AU'),
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 3',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const wx = 30, wy = 15;
  const ww = 585, wh = 363;
  const sc = 0.5;

  const gy = wy + wh - 30;
  svg += `<line x1="${wx}" y1="${gy}" x2="${wx + ww}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}" stroke-dasharray="4,3"/>`;
  svg += hatch(wx, gy - 6, ww, 6, 3, C_TEXT);
  svg += `<text x="${wx + ww - 5}" y="${gy + 12}" text-anchor="end" fill="${C_TEXT}" font-family="${mono}" font-size="9">GROUND LEVEL</text>`;

  // Brick veneer
  const bx = wx + 70;
  const bt = p.brickThickness * sc;
  const by1 = gy - 400 * sc;
  const by2 = gy;
  svg += `<rect x="${bx}" y="${by1}" width="${bt}" height="${by2 - by1}" fill="${C_BRICK_FILL}" stroke="${C_BRICK}" stroke-width="${T}"/>`;
  for (let y = by2; y > by1 + 5; y -= 38 * sc) {
    svg += `<line x1="${bx}" y1="${y}" x2="${bx + bt}" y2="${y}" stroke="${C_BRICK}" stroke-width="${F}"/>`;
  }
  svg += callout(bx - 35, by1 + 80, `${p.brickThickness}mm BRICK VENEER`, bx, by1 + 80);

  // Cavity
  const cx = bx + bt;
  const cw = p.cavityWidth * sc;
  svg += `<rect x="${cx}" y="${by1}" width="${cw}" height="${by2 - by1}" fill="none" stroke="${C_TEXT}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  svg += callout(cx + 8, by1 + 60, `${p.cavityWidth}mm CAVITY + SARKING`, cx + cw, by1 + 60);

  // Stud frame
  const sx = cx + cw;
  const sw = studDims.w * sc;
  for (let i = 0; i < 3; i++) {
    const x = sx + i * 22.5 * sc;
    svg += `<rect x="${x}" y="${by1}" width="${sw * 0.25}" height="${by2 - by1}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${M}"/>`;
  }
  svg += hatch(sx, by1, sw, by2 - by1, 3, C_STUD);
  svg += callout(sx + sw + 8, by1 + 50, `${studDims.w}x${studDims.d} T/P STUDS @ 450 CTR`, sx + sw, by1 + 50);

  // Plasterboard
  const px = sx + sw;
  const pw = 10 * sc;
  svg += `<rect x="${px}" y="${by1}" width="${pw}" height="${by2 - by1}" fill="none" stroke="${C_TEXT}" stroke-width="${M}"/>`;
  svg += callout(px + 12, by1 + 35, '10mm PLASTERBOARD', px + pw, by1 + 35);

  // Top plate
  const plateY = by1;
  const ph = 45 * sc;
  svg += `<rect x="${sx}" y="${plateY - ph}" width="${sw}" height="${ph}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
  svg += hatch(sx, plateY - ph, sw, ph, 2, C_PLATE);
  svg += callout(sx + sw + 8, plateY - ph / 2, `${studDims.w}x${studDims.d} F17 TOP PLATE`, sx + sw, plateY - ph / 2);

  // Existing rafter
  const rh = 35 * sc;
  const ry = plateY - ph - rh;
  svg += `<rect x="${sx}" y="${ry}" width="${sw}" height="${rh}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${T}"/>`;
  svg += `<line x1="${sx}" y1="${ry + rh * 0.3}" x2="${sx + sw * 0.4}" y2="${ry + rh}" stroke="${C_STUD}" stroke-width="${M}"/>`;
  svg += `<line x1="${sx + sw * 0.4}" y1="${ry + rh}" x2="${sx + sw}" y2="${ry + rh}" stroke="${C_STUD}" stroke-width="${T}"/>`;
  svg += callout(sx + sw + 8, ry + rh / 2, `${studDims.w}x35 F17 RAFTER`, sx + sw, ry + rh / 2);

  // Anti-lift strap
  const strapX = sx + sw / 2;
  svg += `<line x1="${strapX}" y1="${ry + 5}" x2="${strapX}" y2="${plateY - ph - 5}" stroke="${C_STRAP}" stroke-width="${T}"/>`;
  svg += `<line x1="${strapX - 3}" y1="${ry + 8}" x2="${strapX + 3}" y2="${ry + 8}" stroke="${C_STRAP}" stroke-width="${M}"/>`;
  svg += `<line x1="${strapX - 3}" y1="${plateY - ph - 8}" x2="${strapX + 3}" y2="${plateY - ph - 8}" stroke="${C_STRAP}" stroke-width="${M}"/>`;
  svg += `<line x1="${strapX}" y1="${ry + 5}" x2="${strapX + 15}" y2="${ry - 5}" stroke="${C_STRAP}" stroke-width="${F}"/>`;
  svg += callout(strapX + 10, ry + 20, 'ANTI-LIFT STRAP (TCSB)', strapX, ry + 15);

  // Fascia board
  const ft = p.fasciaThickness * sc;
  const fo = 40 * sc;
  const fx = bx - fo;
  const fy = ry - 3 * sc;
  svg += `<rect x="${fx}" y="${fy - ft}" width="${fo + bt + 5 * sc}" height="${ft}" fill="${C_FASCIA_FILL}" stroke="${C_FASCIA}" stroke-width="${T}"/>`;
  svg += hatch(fx, fy - ft, fo + bt + 5 * sc, ft, 2, C_FASCIA);
  svg += callout(fx - 5, fy - ft / 2, `${p.fasciaThickness}mm FASCIA BOARD`, fx, fy - ft / 2);

  // Gutter
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
  svg += `<path d="${gp}" fill="${C_GUTTER_FILL}" stroke="${C_GUTTER}" stroke-width="${T}"/>`;
  svg += callout(gpx + 15, gpy + 8, `${p.gutterType.toUpperCase()} GUTTER`, fx + 5 * sc, gpy + 12 * sc);

  // SHS standoff (NEW WORK)
  const shsS = shsDims.s * sc;
  const shx = fx + (fo + bt) / 2 - shsS / 2;
  const shy1 = wy + 5;
  const shy2 = fy + 8 * sc;
  svg += `<rect x="${shx}" y="${shy1}" width="${shsS}" height="${shy2 - shy1}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += `<rect x="${shx + 2}" y="${shy1}" width="${shsS - 4}" height="${shy2 - shy1}" fill="none" stroke="${C_SHS}" stroke-width="${M}" stroke-dasharray="2,2"/>`;
  svg += hatch(shx, shy1, shsS, shy2 - shy1, 2, C_SHS);

  // NEW WORK label
  svg += `<rect x="${shx + shsS + 5}" y="${shy1 + 10}" width="60" height="28" rx="3" fill="none" stroke="${C_NEW}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  svg += `<text x="${shx + shsS + 35}" y="${shy1 + 22}" text-anchor="middle" fill="${C_NEW}" font-family="${mono}" font-size="8" font-weight="bold">NEW WORK</text>`;
  svg += `<text x="${shx + shsS + 35}" y="${shy1 + 32}" text-anchor="middle" fill="${C_NEW}" font-family="${mono}" font-size="8">${p.shsStandoff} SHS</text>`;

  // Fixings to top plate — lag screws
  const lagSpacingPx = p.lagScrewSpacing * sc;
  const nLags = Math.floor((shy2 - shy1) / lagSpacingPx) + 1;
  for (let i = 0; i < nLags; i++) {
    const ly = shy1 + 20 * sc + i * lagSpacingPx;
    if (ly < shy2 - 10 * sc) {
      svg += `<circle cx="${shx + shsS / 2}" cy="${ly}" r="${Math.max(lagDims.dia * 0.15, 2)}" fill="none" stroke="#f44336" stroke-width="1"/>`;
      svg += `<line x1="${shx + shsS / 2 - 2}" y1="${ly}" x2="${shx + shsS / 2 + 2}" y2="${ly}" stroke="#f44336" stroke-width="0.8"/>`;
    }
  }
  svg += `<text x="${shx + shsS + 35}" y="${shy2 - 10}" text-anchor="middle" fill="#f44336" font-family="${mono}" font-size="8">${p.lagScrewSize} LAG @ ${p.lagScrewSpacing} CTR</text>`;

  // DIMENSIONS
  svg += dimV(gpx, gpy, gpx, fy, '200', 20);
  svg += dimH(fx, gpy + 15 * sc, gpx, gpy + 15 * sc, '85', 8);
  svg += dimV(fx - 12, fy, fx - 12, fy - ft, `${p.fasciaThickness}`, 8);
  svg += dimV(gpx - 4, gpy, gpx - 4, gpy + 15 * sc, '30', 0);
  svg += dimH(bx, gy + 12, bx + bt, gy + 12, `${p.brickThickness}`, 8);
  svg += dimH(bx + bt, gy + 12, bx + bt + cw, gy + 12, `${p.cavityWidth}`, 8);
  svg += dimH(sx, gy + 22, sx + sw, gy + 22, `${studDims.w}`, 8);

  // General notes
  const nx = wx + ww - 160, ny = wy + wh - 95;
  svg += `<rect x="${nx}" y="${ny}" width="150" height="75" rx="3" fill="rgba(30,30,40,0.7)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${nx + 75}" y="${ny + 12}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">GENERAL NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 26}" fill="${C_TEXT}" font-family="${mono}" font-size="7">1. All dimensions in millimetres</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 38}" fill="${C_TEXT}" font-family="${mono}" font-size="7">2. Drawn to AS1100.101 / AS1100.301</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 50}" fill="${C_TEXT}" font-family="${mono}" font-size="7">3. Existing construction as measured on site</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 62}" fill="${C_TEXT}" font-family="${mono}" font-size="7">4. Green outlines indicate NEW WORK</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 74}" fill="${C_TEXT}" font-family="${mono}" font-size="7">5. All structural steel to AS1163 Grade C350</text>`;

  // Section mark A-A
  svg += `<circle cx="${wx + 30}" cy="${wy + 30}" r="12" fill="none" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += `<text x="${wx + 30}" y="${wy + 34}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">A</text>`;
  svg += `<text x="${wx + 50}" y="${wy + 34}" fill="${C_TEXT}" font-family="${mono}" font-size="8">VIEW DIR →</text>`;

  svg += '</svg>';
  return svg;
}

function getDefaultDrawingParams(): DrawingParams {
  return {
    standoffMm: 150, boltSize: 'M12', boltSpacing: 600, weldSize: 6,
    brickThickness: 110, cavityWidth: 50, studSize: '90x45',
    fasciaThickness: 30, gutterType: 'colorbond', shsStandoff: '65x65',
    lagScrewSize: 'M12x100', lagScrewSpacing: 600,
    stubShs: '50x50x4', packerSize: '50x5', rafterSize: 'C250x65x2.4',
    screwSize: 'M10', screwsPerSide: 4, stubHeight: 220,
    shsSize: '65x65', gapSize: 3, sealant: 'Sikaflex',
    postSize: 'C100x50x1.6', ledgerSize: 'C150x50x1.9',
    basePlateSize: '150x150x8', anchorSize: 'M16', concretePad: '400x400x300',
    pitchAngle: 10, birdsmouthDepth: 25, boltThroughSize: 'M12',
    braceSize: 'C75x40x1.2', bayWidth: 3.0, bayHeight: 2.7,
    bracketType: 'angle', bracketMaterial: 'gal-steel',
    panel1Enabled: true, panel2Enabled: true, panel3Enabled: true,
    showDimensions: true, showPurlins: true, showPosts: true, showLabels: true,
    showRafterLength: true, showRise: true, showPitchArc: true,
  };
}
