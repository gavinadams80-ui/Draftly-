// ── Socket Joint & Fascia Penetration — AS1100 Standard ──
// NOW EDITABLE: accepts DrawingParams for all configurable dimensions

import { generateDrawingFrame, type DrawingInfo } from './drawingFrame';
import type { DrawingParams } from './drawingParams';

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
  s += `<line x1="${x1}" y1="${y1 - off}" x2="${x2}" y2="${y2 - off}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y1 - off - 3}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y2 - off - 3}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += arrow(x1, y1 - off, 0); s += arrow(x2, y2 - off, 180);
  s += `<text x="${(x1 + x2) / 2}" y="${y1 - off - 4}" text-anchor="middle" fill="${C_DIM}" font-family="${mono}" font-size="9">${label}</text>`;
  return s;
}
function callout(x: number, y: number, text: string, lx: number, ly: number): string {
  let s = `<line x1="${lx}" y1="${ly}" x2="${x}" y2="${y}" stroke="${C_DIM}" stroke-width="${F}"/>`;
  const w = text.length * 5 + 10;
  s += `<rect x="${x - w / 2}" y="${y - 6}" width="${w}" height="12" rx="2" fill="rgba(30,30,40,0.85)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  s += `<text x="${x}" y="${y + 3}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="8">${text}</text>`;
  return s;
}

// Parse SHS size: "50x50x4" → { s: 50, t: 4 }
function parseShsStub(size: string): { s: number; t: number } {
  const parts = size.split(/[x×]/);
  if (parts.length >= 3) return { s: parseInt(parts[0]), t: parseInt(parts[2]) };
  if (parts.length >= 2) return { s: parseInt(parts[0]), t: parseInt(parts[1]) };
  return { s: 50, t: 4 };
}

// Parse packer: "50x5" → { w: 50, t: 5 }
function parsePacker(size: string): { w: number; t: number } {
  const parts = size.split(/[x×]/);
  if (parts.length >= 2) return { w: parseInt(parts[0]), t: parseInt(parts[1]) };
  return { w: 50, t: 5 };
}

// Parse C-section: "C250x65x2.4" → { d: 250, b: 65, t: 2.4 }
function parseCSection(size: string): { d: number; b: number; t: number } {
  const m = size.match(/C(\d+)[x×](\d+)[x×]([\d.]+)/);
  if (m) return { d: parseInt(m[1]), b: parseInt(m[2]), t: parseFloat(m[3]) };
  return { d: 250, b: 65, t: 2.4 };
}

export function generateSocketJointSVG(params?: DrawingParams): string {
  const p = params || {
    stubShs: '50x50x4', packerSize: '50x5', rafterSize: 'C250x65x2.4',
    screwSize: 'M10', screwsPerSide: 4, stubHeight: 220, weldSize: 6,
    shsStandoff: '65x65', standoffMm: 150
  } as DrawingParams;

  const stub = parseShsStub(p.stubShs || '50x50x4');
  const packer = parsePacker(p.packerSize || '50x5');
  const rafter = parseCSection(p.rafterSize || 'C250x65x2.4');
  const standoff = parseShsStub(p.shsStandoff || '65x65');
  const screwDia = parseInt((p.screwSize || 'M10').replace('M', ''));
  const nScrews = p.screwsPerSide || 4;
  const stubH = p.stubHeight || 220;
  const weld = p.weldSize || 6;

  const info: DrawingInfo = {
    title: `SOCKET JOINT · RAFTER TO ${p.shsStandoff || '65x65'} STANDOFF`,
    drawingNo: 'DRF-007-SOCK-01',
    scale: '1 : 5',
    date: new Date().toLocaleDateString('en-AU'),
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

  svg += `<text x="${ex}" y="${ey - 8}" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">ELEVATION</text>`;

  // Rafter (C-section) — horizontal
  const raftH = rafter.b * sc;
  const raftL = 160 * sc;
  const raftY = ey + 40;
  svg += `<rect x="${ex}" y="${raftY}" width="${raftL}" height="${raftH}" fill="${C_RAFT_FILL}" stroke="${C_RAFT}" stroke-width="${T}"/>`;
  // Web line
  svg += `<line x1="${ex + raftL * 0.15}" y1="${raftY + raftH / 2}" x2="${ex + raftL * 0.85}" y2="${raftY + raftH / 2}" stroke="${C_RAFT}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  // Lip returns
  const lip = Math.max(rafter.b * 0.2, 10) * sc;
  svg += `<line x1="${ex}" y1="${raftY + lip}" x2="${ex + raftL}" y2="${raftY + lip}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += `<line x1="${ex}" y1="${raftY + raftH - lip}" x2="${ex + raftL}" y2="${raftY + raftH - lip}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += callout(ex + raftL / 2, raftY - 8, `${p.rafterSize || 'C250x65x2.4'} RAFTER`, ex + raftL / 2, raftY);

  // 50x50 SHS stub — vertical
  const shsStubS = stub.s * sc;
  const shsStubY = raftY - stubH * sc * 0.4; // stub extends into rafter
  const shsStubH = shsStubS + stubH * sc * 0.4;
  svg += `<rect x="${ex + raftL - shsStubS}" y="${shsStubY}" width="${shsStubS}" height="${shsStubH}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += callout(ex + raftL - shsStubS / 2, shsStubY - 8, `${p.stubShs || '50x50x4'} SHS STUB`, ex + raftL - shsStubS / 2, shsStubY);

  // 65x65 SHS continuous — horizontal, below
  const bigShsY = shsStubY + shsStubH + 8 * sc;
  const bigShsH = standoff.s * sc;
  svg += `<rect x="${ex}" y="${bigShsY}" width="${raftL}" height="${bigShsH}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += `<rect x="${ex + 2}" y="${bigShsY + 2}" width="${raftL - 4}" height="${bigShsH - 4}" fill="none" stroke="${C_SHS}" stroke-width="${M}" stroke-dasharray="2,2"/>`;
  svg += callout(ex + 5, bigShsY + bigShsH / 2 + 3, `${p.shsStandoff || '65x65'} SHS CONT.`, ex + 5, bigShsY + bigShsH / 2);

  // Weld symbol at junction
  svg += `<line x1="${ex + raftL - shsStubS - 5}" y1="${bigShsY}" x2="${ex + raftL + 5}" y2="${bigShsY}" stroke="${C_SHS}" stroke-width="${M}"/>`;
  svg += `<text x="${ex + raftL + 10}" y="${bigShsY + 3}" fill="${C_SHS}" font-family="${mono}" font-size="7">${weld}mm FILLET WELD</text>`;

  // Screws
  const screwSpacing = raftH / (nScrews + 1);
  for (let i = 1; i <= nScrews; i++) {
    const sy = raftY + i * screwSpacing;
    const sx_pos = ex + raftL - shsStubS / 2;
    svg += `<circle cx="${sx_pos}" cy="${sy}" r="${Math.max(screwDia * 0.15, 2)}" fill="none" stroke="${C_SCREW}" stroke-width="1"/>`;
    svg += `<line x1="${sx_pos - 2}" y1="${sy}" x2="${sx_pos + 2}" y2="${sy}" stroke="${C_SCREW}" stroke-width="0.8"/>`;
  }
  svg += `<text x="${ex + raftL + 5}" y="${raftY + raftH / 2}" fill="${C_SCREW}" font-family="${mono}" font-size="8">${nScrews}x ${p.screwSize || 'M10'} FHCS per side</text>`;

  // ── SECTION A-A (right side) ──
  const sx = wx + 260, sy = wy + 30;
  const sw = 160, sh = 170;

  svg += `<text x="${sx}" y="${sy - 8}" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">SECTION A-A</text>`;

  // C-section end view
  const cExt = rafter.b * sc;
  const cThick = Math.max(rafter.t * sc, 2);
  const lipLen = Math.max(rafter.b * 0.2, 10) * sc;
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
  svg += `<rect x="${cLeft + cThick}" y="${cTop + cThick}" width="${cExt - cThick * 2}" height="${cBot - cTop - cThick * 2}" fill="none" stroke="${C_RAFT}" stroke-width="${M}" stroke-dasharray="3,2"/>`;
  // Lips
  svg += `<line x1="${cLeft}" y1="${cTop + cThick}" x2="${cLeft + lipLen}" y2="${cTop + cThick}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += `<line x1="${cRight - lipLen}" y1="${cTop + cThick}" x2="${cRight}" y2="${cTop + cThick}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += `<line x1="${cLeft}" y1="${cBot - cThick}" x2="${cLeft + lipLen}" y2="${cBot - cThick}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += `<line x1="${cRight - lipLen}" y1="${cBot - cThick}" x2="${cRight}" y2="${cBot - cThick}" stroke="${C_RAFT}" stroke-width="${M}"/>`;

  // SHS inside
  const shsInS = stub.s * sc;
  const shsInX = cx2 - shsInS / 2;
  const shsInY = cy2 - shsInS / 2;
  svg += `<rect x="${shsInX}" y="${shsInY}" width="${shsInS}" height="${shsInS}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += `<rect x="${shsInX + 2}" y="${shsInY + 2}" width="${shsInS - 4}" height="${shsInS - 4}" fill="none" stroke="${C_SHS}" stroke-width="${M}" stroke-dasharray="2,2"/>`;

  // Packer plates
  const packerW = (cExt - shsInS) / 2 - cThick;
  const packerT = packer.t * sc;
  svg += `<rect x="${shsInX + shsInS}" y="${shsInY}" width="${packerW}" height="${packerT}" fill="${C_PACK_FILL}" stroke="${C_PACK}" stroke-width="${T}"/>`;
  svg += `<rect x="${shsInX + shsInS}" y="${shsInY + shsInS - packerT}" width="${packerW}" height="${packerT}" fill="${C_PACK_FILL}" stroke="${C_PACK}" stroke-width="${T}"/>`;
  svg += `<rect x="${shsInX - packerW}" y="${shsInY}" width="${packerW}" height="${packerT}" fill="${C_PACK_FILL}" stroke="${C_PACK}" stroke-width="${T}"/>`;
  svg += `<rect x="${shsInX - packerW}" y="${shsInY + shsInS - packerT}" width="${packerW}" height="${packerT}" fill="${C_PACK_FILL}" stroke="${C_PACK}" stroke-width="${T}"/>`;

  // Screw positions
  const screwX2 = shsInX + shsInS + packerW / 2;
  for (let i = 0; i < nScrews; i++) {
    const sy = shsInY + (i + 1) * (shsInS / (nScrews + 1));
    svg += `<circle cx="${screwX2}" cy="${sy}" r="${Math.max(screwDia * 0.15, 2)}" fill="none" stroke="${C_SCREW}" stroke-width="1"/>`;
  }

  // Labels
  svg += callout(cRight + 5, cTop + 5, 'C-FLANGE', cRight, cTop + cThick / 2);
  svg += callout(shsInX + shsInS / 2, shsInY + shsInS + 10, `${p.stubShs || '50x50'} SHS`, shsInX + shsInS / 2, shsInY + shsInS);
  svg += callout(shsInX + shsInS + packerW / 2, cBot + 12, `${p.packerSize || '50x5'} PACKER`, shsInX + shsInS + packerW / 2, cBot);

  // Dimensions
  svg += dimH(cLeft, cBot + 20, cRight, cBot + 20, `${rafter.b}`, 10);
  svg += dimH(shsInX, shsInY + shsInS + 30, shsInX + shsInS, shsInY + shsInS + 30, `${stub.s}`, 6);

  // ── Notes ──
  const nx = wx + 30, ny = wy + 240;
  svg += `<rect x="${nx}" y="${ny}" width="520" height="42" rx="3" fill="rgba(30,30,40,0.7)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${nx + 260}" y="${ny + 12}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">JOINT SPECIFICATION</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 26}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• ${p.stubShs || '50x50x4'} SHS stub, height ${stubH}mm (into rafter) · Packer plates: ${p.packerSize || '50x5'} flat bar, weld both faces</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 38}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• ${p.screwSize || 'M10'}x25 FHCS, ${nScrews} per side, into tapped ${p.stubShs?.split('x')[0] || '50'}x${p.stubShs?.split('x')[1] || '50'} · Time-Sert or helicoil for thread strength</text>`;

  // Section mark
  svg += `<circle cx="${wx + 30}" cy="${wy + 30}" r="12" fill="none" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += `<text x="${wx + 30}" y="${wy + 34}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">A</text>`;

  svg += '</svg>';
  return svg;
}

// ── Fascia Penetration Detail — AS1100 ──
export function generateFasciaPenetrationSVG(params?: DrawingParams): string {
  const p = params || {
    shsSize: '65x65', gapSize: 3, sealant: 'Sikaflex',
    fasciaThickness: 30, brickThickness: 110, lagScrewSize: 'M12x100', lagScrewSpacing: 600
  } as DrawingParams;

  const shsDims = parseShsStub(p.shsSize || '65x65');
  const lagDia = parseInt((p.lagScrewSize || 'M12x100').replace('M', '').split('x')[0]);

  const info: DrawingInfo = {
    title: `FASCIA PENETRATION · ${p.shsSize || '65x65'} SHS`,
    drawingNo: 'DRF-008-FASC-01',
    scale: '1 : 5',
    date: new Date().toLocaleDateString('en-AU'),
    revision: 'A',
    material: 'AS1163 C350 · AS4680 GAL',
    sheet: '1 OF 1',
  };

  let svg = generateDrawingFrame(info);
  svg = svg.replace('</svg>', '');

  const wx = 30, wy = 15;
  const sc = 0.5;
  const wallX = wx + 60;
  const wallW = (p.brickThickness || 110) * sc;
  const fasciaX = wallX + wallW + 20 * sc;
  const shsSize = shsDims.s * sc;
  const cy = wy + 130;

  // Brick wall
  svg += `<rect x="${wallX}" y="${wy + 35}" width="${wallW}" height="${180 * sc}" fill="${C_BRICK_FILL}" stroke="${C_BRICK}" stroke-width="${T}"/>`;
  for (let y = wy + 35; y < wy + 30 + 180 * sc - 5; y += 7.6 * sc) {
    svg += `<line x1="${wallX}" y1="${y}" x2="${wallX + wallW}" y2="${y}" stroke="${C_BRICK}" stroke-width="${F}"/>`;
  }
  svg += callout(wallX - 20, wy + 80, `${p.brickThickness || 110}mm BRICK`, wallX, wy + 80);

  // Stud/top plate
  svg += `<rect x="${wallX + wallW}" y="${cy + 15 * sc}" width="${45 * sc}" height="${90 * sc}" fill="${C_RAFT_FILL}" stroke="${C_RAFT}" stroke-width="${M}"/>`;
  svg += callout(wallX + wallW + 25 * sc, cy + 25 * sc, '90x45 STUD', wallX + wallW + 25 * sc, cy + 15 * sc);

  // Fascia board
  const fascThick = (p.fasciaThickness || 30) * sc;
  svg += `<rect x="${fasciaX}" y="${cy - shsSize / 2 - 20 * sc}" width="${fascThick}" height="${shsSize + 40 * sc}" fill="${C_FASCIA_FILL}" stroke="${C_FASCIA}" stroke-width="${T}"/>`;
  svg += callout(fasciaX + fascThick + 10, cy, `${p.fasciaThickness || 30}mm FASCIA`, fasciaX + fascThick, cy);

  // SHS passing through
  const shsX = fasciaX - 10 * sc;
  svg += `<rect x="${shsX}" y="${cy - shsSize / 2}" width="${shsSize}" height="${shsSize}" fill="${C_SHS_FILL}" stroke="${C_SHS}" stroke-width="${T}"/>`;
  svg += `<rect x="${shsX + 2}" y="${cy - shsSize / 2 + 2}" width="${shsSize - 4}" height="${shsSize - 4}" fill="none" stroke="${C_SHS}" stroke-width="${M}" stroke-dasharray="2,2"/>`;
  svg += callout(shsX + shsSize / 2, cy - shsSize / 2 - 10, `${p.shsSize || '65x65'} SHS`, shsX + shsSize / 2, cy - shsSize / 2);

  // Gap around SHS (sealed)
  const gap = (p.gapSize || 3) * sc;
  svg += `<rect x="${shsX - gap}" y="${cy - shsSize / 2 - gap}" width="${shsSize + gap * 2}" height="${shsSize + gap * 2}" fill="none" stroke="${C_PACK}" stroke-width="${M}" stroke-dasharray="2,2"/>`;
  svg += callout(fasciaX + fascThick + 30, cy - shsSize / 2 - 8, `${p.gapSize || 3}mm GAP`, fasciaX + fascThick + 2, cy - shsSize / 2 - 4);

  // Fixings into stud
  svg += `<circle cx="${wallX + wallW + 25 * sc}" cy="${cy - 15 * sc}" r="${lagDia * 0.15}" fill="none" stroke="#f44336" stroke-width="1"/>`;
  svg += `<line x1="${wallX + wallW + 25 * sc - 2}" y1="${cy - 15 * sc}" x2="${wallX + wallW + 25 * sc + 2}" y2="${cy - 15 * sc}" stroke="#f44336" stroke-width="0.8"/>`;
  svg += `<circle cx="${wallX + wallW + 25 * sc}" cy="${cy + 15 * sc}" r="${lagDia * 0.15}" fill="none" stroke="#f44336" stroke-width="1"/>`;
  svg += callout(wallX + wallW + 30 * sc, cy - 15 * sc, p.lagScrewSize || 'M12x100 LAG', wallX + wallW + 25 * sc, cy - 8 * sc);
  svg += callout(wallX + wallW + 30 * sc, cy + 18 * sc, `@ ${p.lagScrewSpacing || 600} CTR`, wallX + wallW + 25 * sc, cy + 8 * sc);

  // Dimensions
  svg += dimH(fasciaX, cy + shsSize / 2 + 18, fasciaX + fascThick, cy + shsSize / 2 + 18, `${p.fasciaThickness || 30}`, 8);

  // Notes
  const nx = wx + 260, ny = wy + 10;
  svg += `<rect x="${nx}" y="${ny}" width="150" height="72" rx="3" fill="rgba(30,30,40,0.7)" stroke="${C_DIM}" stroke-width="${F}"/>`;
  svg += `<text x="${nx + 75}" y="${ny + 12}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="9" font-weight="bold">INSTALL NOTES</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 26}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Cut ${shsDims.s + 5}x${shsDims.s + 5} hole in fascia</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 38}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• ${p.gapSize || 3}mm gap all around SHS</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 50}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Fill gap with ${p.sealant || 'Sikaflex'}</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 62}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Fix to stud @ ${p.lagScrewSpacing || 600}ctr</text>`;
  svg += `<text x="${nx + 5}" y="${ny + 74}" fill="${C_TEXT}" font-family="${mono}" font-size="7">• Paint SHS to match · SHS is structural</text>`;

  // Section mark
  svg += `<circle cx="${wx + 30}" cy="${wy + 30}" r="12" fill="none" stroke="${C_TEXT}" stroke-width="${T}"/>`;
  svg += `<text x="${wx + 30}" y="${wy + 34}" text-anchor="middle" fill="${C_TEXT}" font-family="${mono}" font-size="10" font-weight="bold">A</text>`;

  svg += '</svg>';
  return svg;
}
