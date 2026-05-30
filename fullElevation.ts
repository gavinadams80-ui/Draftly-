// ── Full Elevation Assembly — AS1100 Standard ──
// NOW EDITABLE: accepts DrawingParams for panel toggles and dimensions
// Three-panel detail elevation showing the complete attached structure

import { type DrawingInfo } from './drawingFrame';
import type { DrawingParams } from './drawingParams';

const mono = 'DM Mono,monospace';
const C_DIM = '#8a8e9e';
const C_TEXT = '#c8cce0';
const frameCol = '#4a4a4a';
const dimCol = '#6b7090';
const textCol = '#c8cce0';

const C_BRICK = '#B8860B'; const C_BRICK_FILL = 'rgba(184,134,11,0.18)';
const C_STUD = '#8bc34a'; const C_STUD_FILL = 'rgba(139,195,74,0.12)';
const C_PLATE = '#c9a84c'; const C_PLATE_FILL = 'rgba(201,168,76,0.25)';
const C_FASCIA = '#D2691E'; const C_FASCIA_FILL = 'rgba(210,105,30,0.18)';
const C_GUTTER = '#708090'; const C_GUTTER_FILL = 'rgba(112,128,144,0.15)';
const C_SHS = '#2196f3'; const C_SHS_FILL = 'rgba(33,150,243,0.18)';
const C_NEW = '#4caf50';
const C_CSECTION = '#c9a84c'; const C_CSECTION_FILL = 'rgba(201,168,76,0.15)';
const C_BOLTS = '#f44336';

const T = 1.2, M = 0.6, F = 0.3;

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

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="background:transparent;max-width:100%;">`;
  svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${frameCol}" stroke-width="1"/>`;
  svg += `<rect x="${bind}" y="${border}" width="${w - bind - border}" height="${h - border - tbH - border}" fill="none" stroke="${frameCol}" stroke-width="0.5"/>`;

  const cm = 3;
  svg += `<line x1="${bind}" y1="${border}" x2="${bind + cm}" y2="${border}" stroke="${frameCol}" stroke-width="1"/>`;
  svg += `<line x1="${bind}" y1="${border}" x2="${bind}" y2="${border + cm}" stroke="${frameCol}" stroke-width="1"/>`;
  svg += `<line x1="${w - border}" y1="${border}" x2="${w - border - cm}" y2="${border}" stroke="${frameCol}" stroke-width="1"/>`;
  svg += `<line x1="${w - border}" y1="${border}" x2="${w - border}" y2="${border + cm}" stroke="${frameCol}" stroke-width="1"/>`;

  svg += `<rect x="${tbX}" y="${tbY}" width="220" height="${tbH}" fill="none" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX}" y1="${tbY + 18}" x2="${tbX + 220}" y2="${tbY + 18}" stroke="${frameCol}" stroke-width="0.3"/>`;
  svg += `<line x1="${tbX + 110}" y1="${tbY}" x2="${tbX + 110}" y2="${tbY + 18}" stroke="${frameCol}" stroke-width="0.3"/>`;
  svg += `<line x1="${tbX + 55}" y1="${tbY + 18}" x2="${tbX + 55}" y2="${tbY + tbH}" stroke="${frameCol}" stroke-width="0.3"/>`;
  svg += `<line x1="${tbX + 165}" y1="${tbY + 18}" x2="${tbX + 165}" y2="${tbY + tbH}" stroke="${frameCol}" stroke-width="0.3"/>`;

  svg += `<text x="${tbX + 110}" y="${tbY + 14}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="11" font-weight="bold">${info.title}</text>`;
  svg += `<text x="${tbX + 27}" y="${tbY + 30}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="7">DRAWING NO</text>`;
  svg += `<text x="${tbX + 27}" y="${tbY + 42}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="9" font-weight="bold">${info.drawingNo}</text>`;
  svg += `<text x="${tbX + 82}" y="${tbY + 30}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="7">SCALE</text>`;
  svg += `<text x="${tbX + 82}" y="${tbY + 42}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="9" font-weight="bold">${info.scale}</text>`;
  svg += `<text x="${tbX + 137}" y="${tbY + 30}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="7">DATE</text>`;
  svg += `<text x="${tbX + 137}" y="${tbY + 42}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="9" font-weight="bold">${info.date}</text>`;
  svg += `<text x="${tbX + 192}" y="${tbY + 30}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="7">MATERIAL</text>`;
  svg += `<text x="${tbX + 192}" y="${tbY + 42}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="8">${info.material}</text>`;
  svg += `<text x="${tbX + 55}" y="${tbY + 54}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="7">SHEET</text>`;
  svg += `<text x="${tbX + 55}" y="${tbY + 66}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="8">${info.sheet}</text>`;
  svg += `<text x="${tbX + 137}" y="${tbY + 54}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="7">PROJECT</text>`;
  svg += `<text x="${tbX + 137}" y="${tbY + 66}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="8">Draftly</text>`;

  const psX = tbX - 30, psY = tbY + tbH / 2;
  svg += `<circle cx="${psX}" cy="${psY}" r="14" fill="none" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<text x="${psX}" y="${psY + 4}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="8">3rd</text>`;

  return svg;
}

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
  const w = text.length * 5 + 10;
  s += `<rect x="${x - w / 2}" y="${y - 6}" width="${w}" height="12" rx="2" fill="rgba(30,30,40,0.85)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<text x="${x}" y="${y + 3}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="8">${text}</text>`;
  return s;
}

function hatch(x: number, y: number, w: number, h: number, sp = 5, col: string): string {
  let d = '', diag = Math.sqrt(w * w + h * h);
  for (let i = -diag; i < diag + w; i += sp) d += `M ${x + i},${y} L ${x + i - h},${y + h} `;
  return `<path d="${d}" stroke="${col}" stroke-width="0.5" fill="none"/>`;
}

function drawWallSection(px: number, py: number, pw: number, ph: number): string {
  let s = '';
  const sc = 0.5;
  const gy = py + ph - 20;

  s += `<line x1="${px}" y1="${gy}" x2="${px + pw}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}" stroke-dasharray="4,3"/>`;
  s += hatch(px, gy - 6, pw, 6, 3, C_TEXT);
  s += `<text x="${px + pw - 5}" y="${gy + 12}" text-anchor="end" fill="${C_TEXT}" font-family="${mono}" font-size="8">GROUND</text>`;

  const by1 = gy - 350 * sc;
  const by2 = gy;

  const bx = px + 30;
  const bt = 110 * sc;
  s += `<rect x="${bx}" y="${by1}" width="${bt}" height="${by2 - by1}" fill="${C_BRICK_FILL}" stroke="${C_BRICK}" stroke-width="${T}"/>`;
  s += hatch(bx, by1, bt, by2 - by1, 4, C_BRICK);
  s += callout(bx - 25, by1 + 60, '110mm BRICK', bx, by1 + 60);

  const cx = bx + bt;
  const cw = 50 * sc;
  s += `<rect x="${cx}" y="${by1}" width="${cw}" height="${by2 - by1}" fill="none" stroke="${C_TEXT}" stroke-width="${M}" stroke-dasharray="3,2"/>`;

  const sx = cx + cw;
  const sw = 90 * sc;
  for (let i = 0; i < 3; i++) {
    const x = sx + i * 22.5 * sc;
    s += `<rect x="${x}" y="${by1}" width="${sw * 0.25}" height="${by2 - by1}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${M}"/>`;
  }
  s += hatch(sx, by1, sw, by2 - by1, 3, C_STUD);

  const pbx = sx + sw;
  s += `<rect x="${pbx}" y="${by1}" width="${10 * sc}" height="${by2 - by1}" fill="none" stroke="${C_TEXT}" stroke-width="${M}"/>`;

  const plateY = by1;
  const tph = 45 * sc;
  s += `<rect x="${sx}" y="${plateY - tph}" width="${sw}" height="${tph}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
  s += hatch(sx, plateY - tph, sw, tph, 2, C_PLATE);

  const rh = 35 * sc;
  const ry = plateY - tph - rh;
  s += `<rect x="${sx}" y="${ry}" width="${sw}" height="${rh}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${T}"/>`;

  const ft = 30 * sc;
  const fo = 40 * sc;
  const fx = bx - fo;
  const fy = ry - 3 * sc;
  s += `<rect x="${fx}" y="${fy - ft}" width="${fo + bt + 5 * sc}" height="${ft}" fill="${C_FASCIA_FILL}" stroke="${C_FASCIA}" stroke-width="${T}"/>`;
  s += hatch(fx, fy - ft, fo + bt + 5 * sc, ft, 2, C_FASCIA);

  const gpx = fx - 85 * sc;
  const gpy = fy - ft - 8 * sc;
  s += `<path d="M ${gpx} ${gpy + 20 * sc} L ${gpx} ${gpy} Q ${gpx + 3 * sc} ${gpy - 1.5 * sc} ${gpx + 6 * sc} ${gpy} L ${fx + 2 * sc} ${gpy + 5 * sc} Q ${fx + 3 * sc} ${gpy + 7 * sc} ${fx + 3 * sc} ${gpy + 20 * sc} L ${fx + 1.5 * sc} ${gpy + 20 * sc} L ${fx + 1.5 * sc} ${gpy + 17 * sc} L ${gpx + 3 * sc} ${gpy + 17 * sc} L ${gpx + 3 * sc} ${gpy + 20 * sc} Z" fill="${C_GUTTER_FILL}" stroke="${C_GUTTER}" stroke-width="${T}"/>`;

  const shsS = 65 * sc;
  const shx = fx + (fo + bt) / 2 - shsS / 2;
  const shy1 = py + 5;
  const shy2 = fy + 6 * sc;
  s += `<rect x="${shx}" y="${shy1}" width="${shsS}" height="${shy2 - shy1}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  s += hatch(shx, shy1, shsS, shy2 - shy1, 2, C_SHS);

  s += `<rect x="${shx + shsS + 5}" y="${shy1 + 10}" width="60" height="28" rx="3" fill="none" stroke="${C_NEW}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  s += `<text x="${shx + shsS + 35}" y="${shy1 + 22}" text-anchor="middle" fill="${C_NEW}" font-family="${mono}" font-size="8" font-weight="bold">NEW WORK</text>`;
  s += `<text x="${shx + shsS + 35}" y="${shy1 + 32}" text-anchor="middle" fill="${C_NEW}" font-family="${mono}" font-size="8">65x65 SHS</text>`;

  s += `<text x="${px + 5}" y="${py + 15}" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">SECT A-A</text>`;

  s += dimH(bx, gy + 8, bx + bt, gy + 8, '110', 6);
  s += dimH(bx + bt, gy + 8, bx + bt + cw, gy + 8, '50', 6);
  s += dimH(sx, gy + 16, sx + sw, gy + 16, '90', 6);

  return s;
}

function drawSocketJoint(px: number, py: number, pw: number, ph: number): string {
  let s = '';
  const sc = 0.5;
  const cx = px + pw / 2;

  const gy = py + ph - 20;
  s += `<line x1="${px}" y1="${gy}" x2="${px + pw}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}" stroke-dasharray="4,3"/>`;
  s += hatch(px, gy - 6, pw, 6, 3, C_TEXT);

  const shsS = 65 * sc;
  const shx = cx - shsS / 2;
  const shy1 = py + 5;
  const shy2 = gy;
  s += `<rect x="${shx}" y="${shy1}" width="${shsS}" height="${shy2 - shy1}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  s += hatch(shx, shy1, shsS, shy2 - shy1, 2, C_SHS);

  s += `<line x1="${shx - 5}" y1="${shy2}" x2="${shx + shsS + 5}" y2="${shy2}" stroke="${C_SHS}" stroke-width="${M}"/>`;
  s += `<text x="${shx + shsS + 10}" y="${shy2 + 3}" fill="${C_SHS}" font-family="${mono}" font-size="7">WELD TO BASE PLATE</text>`;

  const stubS = 50 * sc;
  const stubLen = 120 * sc;
  const stubY = shy1 + 80 * sc;
  const stubX = cx - stubS / 2;
  s += `<rect x="${stubX - stubLen / 2}" y="${stubY - stubS}" width="${stubLen}" height="${stubS}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  s += hatch(stubX - stubLen / 2, stubY - stubS, stubLen, stubS, 2, C_SHS);

  s += `<line x1="${stubX - stubLen / 2 - 5}" y1="${stubY - stubS}" x2="${stubX + stubLen / 2 + 5}" y2="${stubY - stubS}" stroke="${C_SHS}" stroke-width="${M}"/>`;
  s += `<text x="${stubX + stubLen / 2 + 10}" y="${stubY - stubS + 3}" fill="${C_SHS}" font-family="${mono}" font-size="7">FILLET WELD</text>`;

  const pkW = 50 * sc;
  const pkH = 5 * sc;
  s += `<rect x="${stubX + stubS}" y="${stubY - stubS}" width="${pkW}" height="${pkH}" fill="${C_CSECTION_FILL}" stroke="${C_CSECTION}" stroke-width="${T}"/>`;
  s += `<rect x="${stubX + stubS}" y="${stubY - pkH}" width="${pkW}" height="${pkH}" fill="${C_CSECTION_FILL}" stroke="${C_CSECTION}" stroke-width="${T}"/>`;
  s += `<rect x="${stubX - pkW}" y="${stubY - stubS}" width="${pkW}" height="${pkH}" fill="${C_CSECTION_FILL}" stroke="${C_CSECTION}" stroke-width="${T}"/>`;
  s += `<rect x="${stubX - pkW}" y="${stubY - pkH}" width="${pkW}" height="${pkH}" fill="${C_CSECTION_FILL}" stroke="${C_CSECTION}" stroke-width="${T}"/>`;

  const cd = 250 * sc;
  const cb = 65 * sc;
  const ct = 2.4 * sc;
  const rax = stubX - cd / 2;
  const ray = stubY - stubS - pkH - 5 * sc;
  s += `<rect x="${rax}" y="${ray}" width="${cd}" height="${cb}" fill="${C_CSECTION_FILL}" stroke="${C_CSECTION}" stroke-width="${T}"/>`;
  s += `<line x1="${rax + cd * 0.15}" y1="${ray + cb / 2}" x2="${rax + cd * 0.85}" y2="${ray + cb / 2}" stroke="${C_CSECTION}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  s += `<line x1="${rax}" y1="${ray + 12 * sc}" x2="${rax + cd}" y2="${ray + 12 * sc}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;
  s += `<line x1="${rax}" y1="${ray + cb - 12 * sc}" x2="${rax + cd}" y2="${ray + cb - 12 * sc}" stroke="${C_CSECTION}" stroke-width="${M}"/>`;

  for (let i = 0; i < 4; i++) {
    const bx = rax + 30 * sc + i * 45 * sc;
    s += `<circle cx="${bx}" cy="${ray + cb / 2 - 12 * sc}" r="2" fill="none" stroke="${C_BOLTS}" stroke-width="1"/>`;
    s += `<circle cx="${bx}" cy="${ray + cb / 2 + 12 * sc}" r="2" fill="none" stroke="${C_BOLTS}" stroke-width="1"/>`;
  }
  s += `<text x="${rax + cd + 5}" y="${ray + cb / 2}" fill="${C_BOLTS}" font-family="${mono}" font-size="7">4x M10 FHCS EA SIDE → TAPPED 50x50</text>`;

  s += callout(cx + shsS / 2 + 10, shy1 + 30, '65x65 SHS CONTINUOUS', cx + shsS / 2, shy1 + 30);
  s += callout(cx + stubLen / 2 + 8, stubY - stubS / 2, '50x50 SHS STUB', cx + stubLen / 2, stubY - stubS / 2);
  s += callout(rax + cd + 5, ray + cb / 2, 'C250x65x2.4 RAFTER', rax + cd, ray + cb / 2);
  s += callout(cx + pkW / 2 + 15, stubY - stubS - pkH / 2, '50x5 PACKER', cx + pkW / 2, stubY - stubS - pkH / 2);

  s += dimV(shx + shsS + 8, shy1, shx + shsS + 8, shy2, 'HEIGHT', 25);
  s += dimH(rax, ray - 12 * sc - 8, rax + cd, ray - 12 * sc - 8, '250', 6);

  s += `<text x="${px + 5}" y="${py + 15}" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">SECT B-B</text>`;

  return s;
}

function drawCornerPost(px: number, py: number, pw: number, ph: number): string {
  let s = '';
  const sc = 0.5;
  const cx = px + pw / 2;

  const gy = py + ph - 20;
  s += `<line x1="${px}" y1="${gy}" x2="${px + pw}" y2="${gy}" stroke="${C_TEXT}" stroke-width="${T}" stroke-dasharray="4,3"/>`;
  s += hatch(px, gy - 6, pw, 6, 3, C_TEXT);

  const fw = 200 * sc;
  const fh = 40 * sc;
  s += `<rect x="${cx - fw / 2}" y="${gy}" width="${fw}" height="${fh}" fill="none" stroke="#888" stroke-width="${M}"/>`;
  s += hatch(cx - fw / 2, gy, fw, fh, 3, '#888');
  s += `<text x="${cx}" y="${gy + fh + 12}" text-anchor="middle" fill="#888" font-family="${mono}" font-size="8">400x400x300 CONC PAD</text>`;

  const bpW = 120 * sc;
  const bpH = 8 * sc;
  const bpY = gy - bpH;
  s += `<rect x="${cx - bpW / 2}" y="${bpY}" width="${bpW}" height="${bpH}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
  s += callout(cx + bpW / 2 + 10, bpY + bpH / 2, '150x150x8 BASE PLATE', cx + bpW / 2, bpY + bpH / 2);

  const postD = 100 * sc;
  const postB = 50 * sc;
  const postY = bpY - postD;
  s += `<rect x="${cx - postB / 2}" y="${postY}" width="${postB}" height="${postD}" fill="${C_STUD_FILL}" stroke="${C_STUD}" stroke-width="${T}"/>`;
  s += `<line x1="${cx}" y1="${postY + postD * 0.15}" x2="${cx}" y2="${postY + postD * 0.85}" stroke="${C_STUD}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  const lip = 10 * sc;
  s += `<line x1="${cx - postB / 2 + lip}" y1="${postY}" x2="${cx - postB / 2 + lip}" y2="${postY + postD}" stroke="${C_STUD}" stroke-width="${M}"/>`;
  s += `<line x1="${cx + postB / 2 - lip}" y1="${postY}" x2="${cx + postB / 2 - lip}" y2="${postY + postD}" stroke="${C_STUD}" stroke-width="${M}"/>`;
  s += callout(cx + postB / 2 + 15, postY + postD / 2, 'C100x50x1.6 POST', cx + postB / 2, postY + postD / 2);

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const bx = cx - 35 * sc + i * 70 * sc;
      const by = bpY + 4 * sc;
      s += `<circle cx="${bx}" cy="${by}" r="2" fill="none" stroke="${C_BOLTS}" stroke-width="1"/>`;
      s += `<line x1="${bx - 2}" y1="${by}" x2="${bx + 2}" y2="${by}" stroke="${C_BOLTS}" stroke-width="0.8"/>`;
    }
  }
  s += `<text x="${cx}" y="${bpY - 5}" text-anchor="middle" fill="${C_BOLTS}" font-family="${mono}" font-size="8">4x M16 ANCHORS</text>`;

  const rafterD = 60 * sc;
  const rafterB = 150 * sc;
  const rafterY = postY - 10 * sc;
  s += `<rect x="${cx - rafterB / 2}" y="${rafterY}" width="${rafterB}" height="${rafterD}" fill="${C_CSECTION_FILL}" stroke="${C_CSECTION}" stroke-width="${T}"/>`;
  s += `<line x1="${cx - rafterB / 2 + rafterB * 0.15}" y1="${rafterY + rafterD / 2}" x2="${cx + rafterB / 2 - rafterB * 0.15}" y2="${rafterY + rafterD / 2}" stroke="${C_CSECTION}" stroke-width="${M}" stroke-dasharray="3,2"/>`;

  s += `<path d="M ${cx - 20} ${rafterY + rafterD + 5} L ${cx - 10} ${rafterY + rafterD + 15} L ${cx + 10} ${rafterY + rafterD + 15} L ${cx + 20} ${rafterY + rafterD + 5}" fill="${C_PLATE_FILL}" stroke="${C_PLATE}" stroke-width="${T}"/>`;
  s += `<text x="${cx}" y="${rafterY + rafterD + 25}" text-anchor="middle" fill="${C_PLATE}" font-family="${mono}" font-size="7">BRACKET</text>`;

  s += `<text x="${px + 5}" y="${py + 15}" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">SECT C-C</text>`;

  s += dimV(cx - postB / 2 - 15, postY, cx - postB / 2 - 15, bpY, '100', 12);
  s += dimH(cx - postB / 2, gy + 10, cx + postB / 2, gy + 10, '50', 6);

  return s;
}

export function generateFullElevationSVG(params?: DrawingParams): string {
  const p = params || {} as DrawingParams;
  const showP1 = p.panel1Enabled !== false;
  const showP2 = p.panel2Enabled !== false;
  const showP3 = p.panel3Enabled !== false;

  const info: DrawingInfo = {
    title: 'DETAIL ELEVATION — ATTACHED GABLE STRUCTURE',
    drawingNo: 'DRF-002-ELEV-01',
    scale: '1 : 5',
    date: new Date().toLocaleDateString('en-AU'),
    revision: 'A',
    material: 'AS PER CALL OUTS',
    sheet: '1 OF 1',
  };

  let svg = generateWideFrame(info);

  const wx = WBIND, wy = WBORDER;
  const ww = WFRAME_W - WBIND - WBORDER;
  const wh = WFRAME_H - WBORDER - WTB_H;
  const gap = 18;
  const panelW = (ww - gap * 2) / 3;
  const panelH = wh - 40;
  const panelY = wy + 12;

  const sep1 = wx + panelW;
  const sep2 = wx + panelW * 2 + gap;
  svg += `<line x1="${sep1}" y1="${panelY}" x2="${sep1}" y2="${panelY + panelH}" stroke="${dimCol}" stroke-width="0.3" stroke-dasharray="3,3"/>`;
  svg += `<line x1="${sep2}" y1="${panelY}" x2="${sep2}" y2="${panelY + panelH}" stroke="${dimCol}" stroke-width="0.3" stroke-dasharray="3,3"/>`;

  if (showP1) svg += drawWallSection(wx, panelY, panelW, panelH);
  if (showP2) svg += drawSocketJoint(wx + panelW + gap, panelY, panelW, panelH);
  if (showP3) svg += drawCornerPost(wx + panelW * 2 + gap * 2, panelY, panelW, panelH);

  const tx = wx;
  const ty = panelY + panelH + 8;
  svg += `<rect x="${tx}" y="${ty}" width="${ww}" height="50" rx="3" fill="rgba(30,30,40,0.7)" stroke="${dimCol}" stroke-width="${F}"/>`;
  svg += `<text x="${tx + 5}" y="${ty + 12}" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">SECTION REFERENCES</text>`;
  svg += `<text x="${tx + 5}" y="${ty + 26}" fill="${C_TEXT}" font-family="${mono}" font-size="7">A-A Existing dwelling wall at eave — 65x65 SHS standoff, M12x100 lag screws @ 600 ctr into top plate</text>`;
  svg += `<text x="${tx + 5}" y="${ty + 38}" fill="${C_TEXT}" font-family="${mono}" font-size="7">B-B Socket joint at rafter — 50x50x4 SHS stub + 50x5 packers, C250x65x2.4 rafter slips over, 4x M10 FHCS ea side</text>`;
  svg += `<text x="${tx + 5}" y="${ty + 50}" fill="${C_TEXT}" font-family="${mono}" font-size="7">C-C Corner post base — C100x50x1.6 post on 150x150x8 base plate, 4x M16 chem anchors into 400x400x300 conc pad</text>`;

  svg += `<rect x="${tx}" y="${ty + 55}" width="${ww}" height="42" rx="3" fill="rgba(30,30,40,0.7)" stroke="${dimCol}" stroke-width="${F}"/>`;
  svg += `<text x="${tx + 5}" y="${ty + 67}" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">NOTES</text>`;
  svg += `<text x="${tx + 5}" y="${ty + 81}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• All structural steel to AS1163 Grade C350, galvanized to AS4680</text>`;
  svg += `<text x="${tx + 5}" y="${ty + 93}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• All dimensions in millimetres unless noted — see DRF-001-SEC-A for full wall detail</text>`;

  svg += '</svg>';
  return svg;
}
