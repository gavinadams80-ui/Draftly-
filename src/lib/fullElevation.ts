// ── Full Elevation Assembly — AS1100 Standard ──
// Three-panel detail elevation showing the complete attached structure:
// LEFT:   Section A-A — Existing dwelling wall at eave (house connection)
// CENTRE: Section B-B — Socket joint at middle rafter (mirrored)
// RIGHT:  Section C-C — Corner post base at gable end
// Uses a custom wide frame (A2-ish) to give each panel adequate space

import { type DrawingInfo } from './drawingFrame';

const mono = 'DM Mono,monospace';
const C_DIM = '#8a8e9e';
const C_TEXT = '#c8cce0';
const frameCol = '#4a4a4a';
const dimCol = '#6b7090';
const textCol = '#c8cce0';

// Material colours
const C_BRICK = '#B8860B'; const C_BRICK_FILL = 'rgba(184,134,11,0.18)';
const C_STUD = '#8bc34a'; const C_STUD_FILL = 'rgba(139,195,74,0.12)';
const C_PLATE = '#c9a84c'; const C_PLATE_FILL = 'rgba(201,168,76,0.25)';
const C_FASCIA = '#D2691E'; const C_FASCIA_FILL = 'rgba(210,105,30,0.18)';
const C_GUTTER = '#708090'; const C_GUTTER_FILL = 'rgba(112,128,144,0.15)';
const C_SHS = '#2196f3'; const C_SHS_FILL = 'rgba(33,150,243,0.18)';
const C_NEW = '#4caf50';
const C_CSECTION = '#c9a84c'; const C_CSECTION_FILL = 'rgba(201,168,76,0.15)';
const C_BOLTS = '#f44336';

// Line weights per AS1100
const T = 1.2, M = 0.6, F = 0.3;

// Custom wide frame for three-panel layout (A2-ish landscape)
const WFRAME_W = 900;
const WFRAME_H = 480;
const WBIND = 30;
const WBORDER = 12;
const WTB_H = 55;

function generateWideFrame(info: DrawingInfo): string {
  const w = WFRAME_W, h = WFRAME_H;
  const bind = WBIND, border = WBORDER, tbH = WTB_H;
  const ix1 = bind, iy1 = border;
  const ix2 = w - border;
  const iy2 = h - border - tbH;
  const tbX = w - border - 220;
  const tbY = h - border - tbH;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${w}px;display:block;" id="drawing-sheet">`;
  svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="#1a1a1e" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<rect x="${ix1}" y="${iy1}" width="${ix2 - ix1}" height="${iy2 - iy1}" fill="none" stroke="${frameCol}" stroke-width="1.2"/>`;

  // Corner marks
  const cm = 3;
  svg += `<line x1="${ix1}" y1="${iy1}" x2="${ix1 + cm}" y2="${iy1}" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${ix1}" y1="${iy1}" x2="${ix1}" y2="${iy1 + cm}" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${ix2}" y1="${iy1}" x2="${ix2 - cm}" y2="${iy1}" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${ix2}" y1="${iy1}" x2="${ix2}" y2="${iy1 + cm}" stroke="${frameCol}" stroke-width="0.8"/>`;

  // Title block
  svg += `<rect x="${tbX}" y="${tbY}" width="220" height="${tbH}" fill="rgba(40,40,48,0.9)" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<rect x="${tbX}" y="${tbY}" width="220" height="${tbH * 0.35}" fill="none" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX}" y1="${tbY + tbH * 0.35}" x2="${tbX + 220}" y2="${tbY + tbH * 0.35}" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX + 100}" y1="${tbY + tbH * 0.35}" x2="${tbX + 100}" y2="${tbY + tbH}" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX + 160}" y1="${tbY + tbH * 0.35}" x2="${tbX + 160}" y2="${tbY + tbH}" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX}" y1="${tbY + tbH * 0.65}" x2="${tbX + 220}" y2="${tbY + tbH * 0.65}" stroke="${frameCol}" stroke-width="0.5"/>`;

  svg += `<text x="${tbX + 5}" y="${tbY + tbH * 0.24}" font-family="${mono}" font-size="11" fill="${textCol}" font-weight="700">${info.title}</text>`;
  svg += `<text x="${tbX + 4}" y="${tbY + tbH * 0.52}" font-family="${mono}" font-size="8" fill="${dimCol}">DRAWING NO</text>`;
  svg += `<text x="${tbX + 4}" y="${tbY + tbH * 0.62}" font-family="${mono}" font-size="10" fill="${textCol}">${info.drawingNo}</text>`;
  svg += `<text x="${tbX + 104}" y="${tbY + tbH * 0.52}" font-family="${mono}" font-size="8" fill="${dimCol}">SCALE</text>`;
  svg += `<text x="${tbX + 104}" y="${tbY + tbH * 0.62}" font-family="${mono}" font-size="10" fill="${textCol}">${info.scale}</text>`;
  svg += `<text x="${tbX + 164}" y="${tbY + tbH * 0.52}" font-family="${mono}" font-size="8" fill="${dimCol}">DATE</text>`;
  svg += `<text x="${tbX + 164}" y="${tbY + tbH * 0.62}" font-family="${mono}" font-size="10" fill="${textCol}">${info.date}</text>`;
  svg += `<text x="${tbX + 4}" y="${tbY + tbH * 0.82}" font-family="${mono}" font-size="8" fill="${dimCol}">MATERIAL</text>`;
  svg += `<text x="${tbX + 4}" y="${tbY + tbH * 0.92}" font-family="${mono}" font-size="9" fill="${textCol}">${info.material}</text>`;
  svg += `<text x="${tbX + 104}" y="${tbY + tbH * 0.82}" font-family="${mono}" font-size="8" fill="${dimCol}">SHEET</text>`;
  svg += `<text x="${tbX + 104}" y="${tbY + tbH * 0.92}" font-family="${mono}" font-size="9" fill="${textCol}">${info.sheet}</text>`;
  svg += `<text x="${tbX + 164}" y="${tbY + tbH * 0.82}" font-family="${mono}" font-size="8" fill="${dimCol}">PROJECT</text>`;
  svg += `<text x="${tbX + 164}" y="${tbY + tbH * 0.92}" font-family="${mono}" font-size="9" fill="${textCol}">Draftly</text>`;

  // Third angle projection
  const psX = tbX - 30, psY = tbY + tbH / 2;
  svg += `<circle cx="${psX}" cy="${psY}" r="12" fill="none" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<text x="${psX}" y="${psY + 4}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${dimCol}">3rd</text>`;

  // Zone marks
  const zonesX = ['A','B','C','D','E','F','G','H','J','K'];
  const zoneW = (ix2 - ix1) / zonesX.length;
  zonesX.forEach((z, i) => {
    svg += `<text x="${ix1 + zoneW * (i + 0.5)}" y="${iy1 - 2}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${dimCol}">${z}</text>`;
  });

  // Return without closing — panels will be added
  return svg;
}

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
  s += arrow(x1, y1 - off, 0);
  s += arrow(x2, y2 - off, 180);
  s += `<text x="${(x1 + x2) / 2}" y="${y1 - off - 4}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${C_TEXT}">${label}</text>`;
  return s;
}

function dimV(x1: number, y1: number, x2: number, y2: number, label: string, off: number): string {
  let s = '';
  s += `<line x1="${x1}" y1="${y1}" x2="${x1 - off - 2}" y2="${y1}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x2}" y1="${y2}" x2="${x2 - off - 2}" y2="${y2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x1 - off}" y1="${y1}" x2="${x2 - off}" y2="${y2}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += arrow(x1 - off, y1, 90);
  s += arrow(x2 - off, y2, 270);
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

// ── Panel 1: Existing Dwelling Wall Section (LEFT) ──
function drawWallSection(px: number, py: number, pw: number, ph: number): string {
  let s = '';
  const sc = 0.5;
  const gy = py + ph - 20; // ground line

  // Ground
  s += `<line x1="${px}" y1="${gy}" x2="${px + pw}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  s += hatch(px, gy - 6, pw, 6, 3, C_TEXT);
  s += `<text x="${px + 5}" y="${gy + 12}" font-family="${mono}" font-size="6" fill="${C_DIM}">GROUND</text>`;

  // Show 350mm of wall
  const by1 = gy - 350 * sc;
  const by2 = gy;

  // Brick
  const bx = px + 30;
  const bt = 110 * sc;
  s += `<rect x="${bx}" y="${by1}" width="${bt}" height="${by2 - by1}" fill="${C_BRICK_FILL}" stroke="${C_BRICK}" stroke-width="${T}"/>`;
  s += hatch(bx, by1, bt, by2 - by1, 4, C_BRICK);
  s += callout(bx - 25, by1 + 60, '110mm BRICK', bx, by1 + 60);

  // Cavity
  const cx = bx + bt;
  const cw = 50 * sc;
  s += `<rect x="${cx}" y="${by1}" width="${cw}" height="${by2 - by1}" fill="rgba(100,150,200,0.04)" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="2,2"/>`;

  // Studs
  const sx = cx + cw;
  const sw = 90 * sc;
  for (let i = 0; i < 3; i++) {
    const xx = sx + i * 22.5 * sc;
    s += `<rect x="${xx}" y="${by1}" width="${4.5 * sc}" height="${by2 - by1}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${M}"/>`;
  }
  s += hatch(sx, by1, sw, by2 - by1, 3, C_STUD);

  // Plasterboard
  const pbx = sx + sw;
  s += `<rect x="${pbx}" y="${by1}" width="${10 * sc}" height="${by2 - by1}" fill="rgba(255,255,255,0.06)" stroke="#ccc" stroke-width="${F}"/>`;

  // Top plate
  const plateY = by1;
  const tph = 45 * sc;
  s += `<rect x="${sx}" y="${plateY - tph}" width="${sw}" height="${tph}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
  s += hatch(sx, plateY - tph, sw, tph, 2, C_PLATE);

  // Existing rafter
  const rh = 35 * sc;
  const ry = plateY - tph - rh;
  s += `<rect x="${sx}" y="${ry}" width="${sw}" height="${rh}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${M}"/>`;

  // Fascia
  const ft = 30 * sc;
  const fo = 40 * sc;
  const fx = bx - fo;
  const fy = ry - 3 * sc;
  s += `<rect x="${fx}" y="${fy - ft}" width="${fo + bt + 5 * sc}" height="${ft}" fill="${C_FASCIA_FILL}" stroke="${C_FASCIA}" stroke-width="${T}"/>`;
  s += hatch(fx, fy - ft, fo + bt + 5 * sc, ft, 2, C_FASCIA);

  // Gutter (simplified)
  const gpx = fx - 85 * sc;
  const gpy = fy - ft - 8 * sc;
  s += `<rect x="${gpx}" y="${gpy}" width="${85 * sc}" height="${20 * sc}" fill="${C_GUTTER_FILL}" stroke="${C_GUTTER}" stroke-width="${M}" rx="2"/>`;

  // 65×65 SHS standoff (NEW WORK)
  const shsS = 65 * sc;
  const shx = fx + (fo + bt) / 2 - shsS / 2;
  const shy1 = py + 5;
  const shy2 = fy + 6 * sc;
  s += `<rect x="${shx}" y="${shy1}" width="${shsS}" height="${shy2 - shy1}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  s += hatch(shx, shy1, shsS, shy2 - shy1, 2, C_SHS);

  // NEW WORK label
  s += `<rect x="${shx + shsS + 4}" y="${shy1 + 5}" width="58" height="22" fill="rgba(76,175,80,0.08)" stroke="${C_NEW}" stroke-width="0.5" rx="2"/>`;
  s += `<text x="${shx + shsS + 7}" y="${shy1 + 15}" font-family="${mono}" font-size="7" fill="${C_NEW}" font-weight="600">NEW WORK</text>`;
  s += `<text x="${shx + shsS + 7}" y="${shy1 + 22}" font-family="${mono}" font-size="6" fill="${C_NEW}">65×65 SHS</text>`;

  // Panel label
  s += `<rect x="${px}" y="${py}" width="60" height="16" fill="rgba(33,150,243,0.15)" stroke="${C_SHS}" stroke-width="0.5" rx="2"/>`;
  s += `<text x="${px + 4}" y="${py + 11}" font-family="${mono}" font-size="8" fill="${C_SHS}" font-weight="600">SECT A-A</text>`;

  // Dimensions
  s += dimH(bx, gy + 8, bx + bt, gy + 8, '110', 6);
  s += dimH(bx + bt, gy + 8, bx + bt + cw, gy + 8, '50', 6);
  s += dimH(sx, gy + 16, sx + sw, gy + 16, '90', 6);
  s += dimV(gpx, gpy, gpx, fy, '200', 18);

  return s;
}

// ── Panel 2: Socket Joint Detail (CENTRE) ──
function drawSocketJoint(px: number, py: number, pw: number, ph: number): string {
  let s = '';
  const sc = 0.5;
  const cx = px + pw / 2;

  // Ground line
  const gy = py + ph - 20;
  s += `<line x1="${px}" y1="${gy}" x2="${px + pw}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  s += hatch(px, gy - 6, pw, 6, 3, C_TEXT);

  // 65×65 SHS continuous (vertical)
  const shsS = 65 * sc;
  const shx = cx - shsS / 2;
  const shy1 = py + 5;
  const shy2 = gy;
  s += `<rect x="${shx}" y="${shy1}" width="${shsS}" height="${shy2 - shy1}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  s += hatch(shx, shy1, shsS, shy2 - shy1, 2, C_SHS);

  // Weld symbol at base
  s += `<line x1="${shx - 5}" y1="${shy2 - 3}" x2="${shx + shsS + 5}" y2="${shy2 - 3}" stroke="${C_SHS}" stroke-width="${M}"/>`;
  s += `<text x="${cx}" y="${shy2 - 6}" text-anchor="middle" font-family="${mono}" font-size="5" fill="${C_DIM}">WELD TO BASE PLATE</text>`;

  // 50×50 SHS stub (horizontal, welded to top face of 65×65)
  const stubS = 50 * sc;
  const stubLen = 120 * sc;
  const stubY = shy1 + 80 * sc; // position along 65×65
  const stubX = cx - stubS / 2;
  s += `<rect x="${stubX - stubLen / 2}" y="${stubY - stubS}" width="${stubLen}" height="${stubS}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  s += hatch(stubX - stubLen / 2, stubY - stubS, stubLen, stubS, 2, C_SHS);

  // Weld symbols on stub
  s += `<line x1="${cx - 3}" y1="${stubY}" x2="${cx + 3}" y2="${stubY}" stroke="#ff9800" stroke-width="${M}"/>`;
  s += `<text x="${cx + 8}" y="${stubY + 2}" font-family="${mono}" font-size="5" fill="#ff9800">FILLET WELD</text>`;

  // Packer plates (50×5mm each face)
  const pkW = 50 * sc;
  const pkH = 5 * sc;
  // Front packer
  s += `<rect x="${stubX - pkW / 2}" y="${stubY - stubS - pkH}" width="${pkW}" height="${pkH}" fill="rgba(255,152,0,0.2)" stroke="#ff9800" stroke-width="${M}"/>`;
  // Rear packer
  s += `<rect x="${stubX - pkW / 2}" y="${stubY}" width="${pkW}" height="${pkH}" fill="rgba(255,152,0,0.2)" stroke="#ff9800" stroke-width="${M}"/>`;

  // C250×65 rafter (slips over the stub)
  const cd = 250 * sc; // rafter depth
  const cb = 65 * sc;  // rafter width
  const ct = 2.4 * sc; // thickness (not to scale for clarity)
  const rax = stubX - cd / 2;
  const ray = stubY - stubS - pkH - 5 * sc; // sits on packers
  // Draw rafter as open C-section (front view = rectangle with hidden lines)
  s += `<rect x="${rax}" y="${ray}" width="${cd}" height="${cb}" fill="none" stroke="${C_CSECTION}" stroke-width="${T}"/>`;
  // Back flange (hidden)
  s += `<line x1="${rax}" y1="${ray + cb}" x2="${rax + cd}" y2="${ray + cb}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  // Web line (hidden)
  s += `<line x1="${rax + ct}" y1="${ray}" x2="${rax + ct}" y2="${ray + cb}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  s += `<line x1="${rax + cd - ct}" y1="${ray}" x2="${rax + cd - ct}" y2="${ray + cb}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;

  // Lip returns on C-section
  const lip = 12 * sc;
  s += `<line x1="${rax + ct}" y1="${ray}" x2="${rax + ct}" y2="${ray - lip}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;
  s += `<line x1="${rax + ct}" y1="${ray - lip}" x2="${rax}" y2="${ray - lip}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;
  s += `<line x1="${rax + cd - ct}" y1="${ray}" x2="${rax + cd - ct}" y2="${ray - lip}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;
  s += `<line x1="${rax + cd - ct}" y1="${ray - lip}" x2="${rax + cd}" y2="${ray - lip}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;

  // M10 FHCS bolts (4 per side)
  for (let i = 0; i < 4; i++) {
    const bx = rax + 30 * sc + i * 45 * sc;
    s += `<circle cx="${bx}" cy="${ray + stubS / 2}" r="2" fill="none" stroke="${C_BOLTS}" stroke-width="0.8"/>`;
    s += `<circle cx="${bx}" cy="${ray + stubS / 2}" r="0.8" fill="${C_BOLTS}"/>`;
  }
  s += `<text x="${rax + cd / 2}" y="${ray + cb + 12}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${C_BOLTS}">4× M10 FHCS EA SIDE → TAPPED 50×50</text>`;

  // Callouts
  s += callout(cx + shsS / 2 + 10, shy1 + 30, '65×65 SHS CONTINUOUS', cx + shsS / 2, shy1 + 30);
  s += callout(cx + stubLen / 2 + 8, stubY - stubS / 2, '50×50 SHS STUB', cx + stubLen / 2, stubY - stubS / 2);
  s += callout(rax + cd + 5, ray + cb / 2, 'C250×65×2.4 RAFTER', rax + cd, ray + cb / 2);

  // Packer callout
  s += callout(cx + pkW / 2 + 15, stubY - stubS - pkH / 2, '50×5 PACKER', cx + pkW / 2, stubY - stubS - pkH / 2);

  // Dimensions
  s += dimV(shx + shsS + 8, shy1, shx + shsS + 8, shy2, 'HEIGHT', 25);
  s += dimH(rax, ray - lip - 8, rax + cd, ray - lip - 8, '250', 6);

  // Panel label
  s += `<rect x="${px}" y="${py}" width="60" height="16" fill="rgba(33,150,243,0.15)" stroke="${C_SHS}" stroke-width="0.5" rx="2"/>`;
  s += `<text x="${px + 4}" y="${py + 11}" font-family="${mono}" font-size="8" fill="${C_SHS}" font-weight="600">SECT B-B</text>`;

  return s;
}

// ── Panel 3: Corner Post Detail (RIGHT) ──
function drawCornerPost(px: number, py: number, pw: number, ph: number): string {
  let s = '';
  const sc = 0.5;
  const cx = px + pw / 2;

  // Ground
  const gy = py + ph - 20;
  s += `<line x1="${px}" y1="${gy}" x2="${px + pw}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  s += hatch(px, gy - 6, pw, 6, 3, C_TEXT);

  // Concrete footing
  const fw = 200 * sc;
  const fh = 40 * sc;
  s += `<rect x="${cx - fw / 2}" y="${gy}" width="${fw}" height="${fh}" fill="rgba(150,150,150,0.15)" stroke="#888" stroke-width="${M}"/>`;
  s += hatch(cx - fw / 2, gy, fw, fh, 3, '#888');
  s += `<text x="${cx}" y="${gy + fh / 2 + 3}" text-anchor="middle" font-family="${mono}" font-size="6" fill="#888">400×400×300 CONC PAD</text>`;

  // Base plate
  const bpW = 120 * sc;
  const bpH = 8 * sc;
  const bpY = gy - bpH;
  s += `<rect x="${cx - bpW / 2}" y="${bpY}" width="${bpW}" height="${bpH}" fill="rgba(201,168,76,0.3)" stroke="${C_PLATE}" stroke-width="${T}"/>`;
  s += callout(cx + bpW / 2 + 10, bpY + bpH / 2, '150×150×8 BASE PLATE', cx + bpW / 2, bpY + bpH / 2);

  // Post (C100×50 or similar)
  const postD = 100 * sc;
  const postB = 50 * sc;
  const postY = bpY - postD;
  s += `<rect x="${cx - postB / 2}" y="${postY}" width="${postB}" height="${postD}" fill="${C_CSECTION_FILL}" stroke="${C_CSECTION}" stroke-width="${T}"/>`;
  // Web (hidden)
  s += `<line x1="${cx}" y1="${postY}" x2="${cx}" y2="${bpY}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;
  // Lip returns
  const lip = 10 * sc;
  s += `<line x1="${cx - postB / 2}" y1="${postY}" x2="${cx - postB / 2 - lip}" y2="${postY}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;
  s += `<line x1="${cx + postB / 2}" y1="${postY}" x2="${cx + postB / 2 + lip}" y2="${postY}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;
  s += `<line x1="${cx - postB / 2}" y1="${bpY}" x2="${cx - postB / 2 - lip}" y2="${bpY}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;
  s += `<line x1="${cx + postB / 2}" y1="${bpY}" x2="${cx + postB / 2 + lip}" y2="${bpY}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;

  s += callout(cx + postB / 2 + 15, postY + postD / 2, 'C100×50×1.6 POST', cx + postB / 2, postY + postD / 2);

  // M16 anchor bolts (4)
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const bx = cx - 35 * sc + i * 70 * sc;
      const by = bpY + 4 * sc;
      s += `<circle cx="${bx}" cy="${by}" r="3" fill="none" stroke="${C_BOLTS}" stroke-width="0.8"/>`;
      s += `<line x1="${bx}" y1="${by}" x2="${bx}" y2="${gy + 5}" stroke="${C_BOLTS}" stroke-width="${F}" stroke-dasharray="2,2"/>`;
    }
  }
  s += `<text x="${cx + bpW / 2 + 5}" y="${bpY + 20}" font-family="${mono}" font-size="5" fill="${C_BOLTS}">4× M16 ANCHORS</text>`;

  // Rafter connection at top (bolted bracket)
  const rafterD = 60 * sc; // depth in elevation view
  const rafterB = 150 * sc;
  const rafterY = postY - 10 * sc;
  s += `<rect x="${cx}" y="${rafterY - rafterD}" width="${rafterB}" height="${rafterD}" fill="${C_CSECTION_FILL}" stroke="${C_CSECTION}" stroke-width="${T}"/>`;
  // Web
  s += `<line x1="${cx}" y1="${rafterY - rafterD / 2}" x2="${cx + rafterB}" y2="${rafterY - rafterD / 2}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="3,2"/>`;

  // Knee bracket
  s += `<polygon points="${cx},${rafterY} ${cx + 30 * sc},${rafterY} ${cx},${rafterY - 30 * sc}" fill="rgba(201,168,76,0.15)" stroke="${C_PLATE}" stroke-width="${M}"/>`;
  s += `<text x="${cx + 8}" y="${rafterY - 8}" font-family="${mono}" font-size="5" fill="${C_PLATE}">BRACKET</text>`;

  // Panel label
  s += `<rect x="${px}" y="${py}" width="60" height="16" fill="rgba(33,150,243,0.15)" stroke="${C_SHS}" stroke-width="0.5" rx="2"/>`;
  s += `<text x="${px + 4}" y="${py + 11}" font-family="${mono}" font-size="8" fill="${C_SHS}" font-weight="600">SECT C-C</text>`;

  // Dimensions
  s += dimV(cx - postB / 2 - 15, postY, cx - postB / 2 - 15, bpY, '100', 12);
  s += dimH(cx - postB / 2, gy + 10, cx + postB / 2, gy + 10, '50', 6);

  return s;
}

// ── Main function ──
export function generateFullElevationSVG(): string {
  const info: DrawingInfo = {
    title: 'DETAIL ELEVATION — ATTACHED GABLE STRUCTURE',
    drawingNo: 'DRF-002-ELEV-01',
    scale: '1 : 5',
    date: '29/05/2026',
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  // Use wide frame for three-panel layout
  let svg = generateWideFrame(info);

  // Three panels across the wide working area
  const wx = WBIND, wy = WBORDER;
  const ww = WFRAME_W - WBIND - WBORDER;
  const wh = WFRAME_H - WBORDER - WTB_H;
  const gap = 18;
  const panelW = (ww - gap * 2) / 3; // ~274px each
  const panelH = wh - 40;
  const panelY = wy + 12;

  // Panel separators (light vertical lines)
  const sep1 = wx + panelW;
  const sep2 = wx + panelW * 2 + gap;
  svg += `<line x1="${sep1}" y1="${panelY}" x2="${sep1}" y2="${panelY + panelH}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="4,4"/>`;
  svg += `<line x1="${sep2}" y1="${panelY}" x2="${sep2}" y2="${panelY + panelH}" stroke="${C_DIM}" stroke-width="${F}" stroke-dasharray="4,4"/>`;

  // Panel 1: Wall Section (left)
  svg += drawWallSection(wx, panelY, panelW, panelH);

  // Panel 2: Socket Joint (centre)
  svg += drawSocketJoint(wx + panelW + gap, panelY, panelW, panelH);

  // Panel 3: Corner Post (right)
  svg += drawCornerPost(wx + panelW * 2 + gap * 2, panelY, panelW, panelH);

  // Section reference table at bottom
  const tx = wx;
  const ty = panelY + panelH + 8;
  const refH = 50;
  svg += `<rect x="${tx}" y="${ty}" width="420" height="${refH}" fill="rgba(0,0,0,0.25)" stroke="${C_DIM}" stroke-width="0.3" rx="2"/>`;
  svg += `<text x="${tx + 8}" y="${ty + 14}" font-family="${mono}" font-size="8" fill="${C_TEXT}" font-weight="600">SECTION REFERENCES</text>`;
  svg += `<text x="${tx + 8}" y="${ty + 27}" font-family="${mono}" font-size="7" fill="${C_DIM}">A-A  Existing dwelling wall at eave — 65×65 SHS standoff, M12×100 lag screws @ 600 ctr into top plate</text>`;
  svg += `<text x="${tx + 8}" y="${ty + 38}" font-family="${mono}" font-size="7" fill="${C_DIM}">B-B  Socket joint at rafter — 50×50×4 SHS stub + 50×5 packers, C250×65×2.4 rafter slips over, 4× M10 FHCS ea side</text>`;
  svg += `<text x="${tx + 8}" y="${ty + 49}" font-family="${mono}" font-size="7" fill="${C_DIM}">C-C  Corner post base — C100×50×1.6 post on 150×150×8 base plate, 4× M16 chem anchors into 400×400×300 conc pad</text>`;

  // General notes
  svg += `<rect x="${tx + 435}" y="${ty}" width="420" height="${refH}" fill="rgba(0,0,0,0.25)" stroke="${C_DIM}" stroke-width="0.3" rx="2"/>`;
  svg += `<text x="${tx + 443}" y="${ty + 14}" font-family="${mono}" font-size="8" fill="${C_TEXT}" font-weight="600">NOTES</text>`;
  svg += `<text x="${tx + 443}" y="${ty + 27}" font-family="${mono}" font-size="7" fill="${C_DIM}">• All structural steel to AS1163 Grade C350, galvanized to AS4680</text>`;
  svg += `<text x="${tx + 443}" y="${ty + 38}" font-family="${mono}" font-size="7" fill="${C_DIM}">• All dimensions in millimetres unless noted — see DRF-001-SEC-A for full wall detail</text>`;
  svg += `<text x="${tx + 443}" y="${ty + 49}" font-family="${mono}" font-size="7" fill="${C_DIM}">• All welding to AS1554.1, all fixings to AS5216 — engineer certify pad footings</text>`;

  svg += '</svg>';
  return svg;
}
