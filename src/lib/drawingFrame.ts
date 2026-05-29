// ── AS1100 / ISO Drawing Frame & Standards ──
// Proper engineering drawing sheet format with title block

const mono = 'DM Mono,monospace';
const frameCol = '#4a4a4a';
const dimCol = '#6b7090';
const textCol = '#c8cce0';

// Standard A3 sheet: 297 × 420 mm
// Border: 20mm binding edge (left), 10mm other sides
// Working area: 267 × 400 mm
const A3_W = 420;  // mm → pixels (420px at 1:1 scale representation)
const A3_H = 297;
const BIND = 20;    // binding edge
const BORDER = 10;  // top, right, bottom
const TB_H = 45;    // title block height
const TB_W = 180;   // title block width

export interface DrawingInfo {
  title: string;
  drawingNo: string;
  scale: string;
  date: string;
  revision: string;
  material?: string;
  sheet?: string;
}

// Generate the drawing frame with title block
export function generateDrawingFrame(info: DrawingInfo): string {
  // Scale up for SVG (1mm = 1.5px for readability on screen)
  const sc = 1.5;
  const w = A3_W * sc;
  const h = A3_H * sc;
  const bind = BIND * sc;
  const border = BORDER * sc;
  const tbH = TB_H * sc;
  const tbW = TB_W * sc;

  // Inner border
  const ix1 = bind;
  const iy1 = border;
  const ix2 = w - border;
  const iy2 = h - border - tbH;

  // Title block position (bottom-right inside border)
  const tbX = w - border - tbW;
  const tbY = h - border - tbH;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${w}px;display:block;" id="drawing-sheet">`;

  // ── Outer border (sheet edge) ──
  svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="#1a1a1e" stroke="${frameCol}" stroke-width="0.5"/>`;

  // ── Inner border (working area) ──
  svg += `<rect x="${ix1}" y="${iy1}" width="${ix2 - ix1}" height="${iy2 - iy1}" fill="none" stroke="${frameCol}" stroke-width="1.2"/>`;

  // ── Corner marks (AS1100 style) ──
  const cm = 3; // corner mark length
  // Top-left
  svg += `<line x1="${ix1}" y1="${iy1}" x2="${ix1 + cm}" y2="${iy1}" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${ix1}" y1="${iy1}" x2="${ix1}" y2="${iy1 + cm}" stroke="${frameCol}" stroke-width="0.8"/>`;
  // Top-right
  svg += `<line x1="${ix2}" y1="${iy1}" x2="${ix2 - cm}" y2="${iy1}" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${ix2}" y1="${iy1}" x2="${ix2}" y2="${iy1 + cm}" stroke="${frameCol}" stroke-width="0.8"/>`;
  // Bottom-left (title block area)
  svg += `<line x1="${ix1}" y1="${iy2}" x2="${ix1 + cm}" y2="${iy2}" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${ix1}" y1="${iy2}" x2="${ix1}" y2="${iy2 - cm}" stroke="${frameCol}" stroke-width="0.8"/>`;

  // ── Title Block ──
  // Background
  svg += `<rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH}" fill="rgba(40,40,48,0.9)" stroke="${frameCol}" stroke-width="0.8"/>`;

  // Title block grid
  // Row 1: Title (full width)
  svg += `<rect x="${tbX}" y="${tbY}" width="${tbW}" height="${tbH * 0.35}" fill="none" stroke="${frameCol}" stroke-width="0.5"/>`;
  // Row 2: Drawing no | Scale | Rev | Date
  svg += `<line x1="${tbX}" y1="${tbY + tbH * 0.35}" x2="${tbX + tbW}" y2="${tbY + tbH * 0.35}" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX + tbW * 0.45}" y1="${tbY + tbH * 0.35}" x2="${tbX + tbW * 0.45}" y2="${tbY + tbH}" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX + tbW * 0.7}" y1="${tbY + tbH * 0.35}" x2="${tbX + tbW * 0.7}" y2="${tbY + tbH}" stroke="${frameCol}" stroke-width="0.5"/>`;
  svg += `<line x1="${tbX + tbW * 0.85}" y1="${tbY + tbH * 0.35}" x2="${tbX + tbW * 0.85}" y2="${tbY + tbH}" stroke="${frameCol}" stroke-width="0.5"/>`;
  // Row 3: Material | Sheet | Project
  svg += `<line x1="${tbX}" y1="${tbY + tbH * 0.65}" x2="${tbX + tbW}" y2="${tbY + tbH * 0.65}" stroke="${frameCol}" stroke-width="0.5"/>`;

  // Title block content
  svg += `<text x="${tbX + 4}" y="${tbY + tbH * 0.25}" font-family="${mono}" font-size="${tbH * 0.14}" fill="${textCol}" font-weight="700">${info.title}</text>`;

  svg += `<text x="${tbX + 2}" y="${tbY + tbH * 0.52}" font-family="${mono}" font-size="${tbH * 0.09}" fill="${dimCol}">DRAWING NO</text>`;
  svg += `<text x="${tbX + 2}" y="${tbY + tbH * 0.62}" font-family="${mono}" font-size="${tbH * 0.12}" fill="${textCol}">${info.drawingNo}</text>`;

  svg += `<text x="${tbX + tbW * 0.46}" y="${tbY + tbH * 0.52}" font-family="${mono}" font-size="${tbH * 0.09}" fill="${dimCol}">SCALE</text>`;
  svg += `<text x="${tbX + tbW * 0.46}" y="${tbY + tbH * 0.62}" font-family="${mono}" font-size="${tbH * 0.12}" fill="${textCol}">${info.scale}</text>`;

  svg += `<text x="${tbX + tbW * 0.71}" y="${tbY + tbH * 0.52}" font-family="${mono}" font-size="${tbH * 0.09}" fill="${dimCol}">REV</text>`;
  svg += `<text x="${tbX + tbW * 0.71}" y="${tbY + tbH * 0.62}" font-family="${mono}" font-size="${tbH * 0.12}" fill="${textCol}">${info.revision}</text>`;

  svg += `<text x="${tbX + tbW * 0.86}" y="${tbY + tbH * 0.52}" font-family="${mono}" font-size="${tbH * 0.09}" fill="${dimCol}">DATE</text>`;
  svg += `<text x="${tbX + tbW * 0.86}" y="${tbY + tbH * 0.62}" font-family="${mono}" font-size="${tbH * 0.12}" fill="${textCol}">${info.date}</text>`;

  if (info.material) {
    svg += `<text x="${tbX + 2}" y="${tbY + tbH * 0.82}" font-family="${mono}" font-size="${tbH * 0.09}" fill="${dimCol}">MATERIAL</text>`;
    svg += `<text x="${tbX + 2}" y="${tbY + tbH * 0.92}" font-family="${mono}" font-size="${tbH * 0.10}" fill="${textCol}">${info.material}</text>`;
  }

  if (info.sheet) {
    svg += `<text x="${tbX + tbW * 0.46}" y="${tbY + tbH * 0.82}" font-family="${mono}" font-size="${tbH * 0.09}" fill="${dimCol}">SHEET</text>`;
    svg += `<text x="${tbX + tbW * 0.46}" y="${tbY + tbH * 0.92}" font-family="${mono}" font-size="${tbH * 0.10}" fill="${textCol}">${info.sheet}</text>`;
  }

  // Draftly logo
  svg += `<text x="${tbX + tbW * 0.86}" y="${tbY + tbH * 0.82}" font-family="${mono}" font-size="${tbH * 0.09}" fill="${dimCol}">PROJECT</text>`;
  svg += `<text x="${tbX + tbW * 0.86}" y="${tbY + tbH * 0.92}" font-family="${mono}" font-size="${tbH * 0.10}" fill="${textCol}">Draftly</text>`;

  // Zone marks (A-H across top, 1-8 down side)
  const zonesX = ['A','B','C','D','E','F','G','H'];
  const zoneW = (ix2 - ix1) / zonesX.length;
  zonesX.forEach((z, i) => {
    svg += `<text x="${ix1 + zoneW * (i + 0.5)}" y="${iy1 - 2}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${dimCol}">${z}</text>`;
  });
  const zonesY = ['1','2','3','4','5','6','7','8'];
  const zoneH = (iy2 - iy1) / zonesY.length;
  zonesY.forEach((z, i) => {
    svg += `<text x="${ix1 - 4}" y="${iy1 + zoneH * (i + 0.5)}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${dimCol}">${z}</text>`;
  });

  // Projection symbol (third angle - AS1100)
  const psX = tbX - 25;
  const psY = tbY + tbH / 2;
  svg += `<circle cx="${psX}" cy="${psY}" r="10" fill="none" stroke="${frameCol}" stroke-width="0.8"/>`;
  svg += `<text x="${psX}" y="${psY + 3}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${dimCol}">3rd</text>`;

  svg += `</svg>`;

  return svg;
}

// Get the working area dimensions for placing content
export function getWorkingArea(): { x: number; y: number; w: number; h: number } {
  const sc = 1.5;
  return {
    x: BIND * sc,
    y: BORDER * sc,
    w: (A3_W - BORDER * 2) * sc,
    h: (A3_H - BORDER * 2 - TB_H) * sc,
  };
}
