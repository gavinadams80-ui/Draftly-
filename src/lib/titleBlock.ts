// ── Standard Engineering Title Block ──
// Appended to the bottom of any drawing SVG.
// Follows AS1100 / council submission formatting guidelines.

export interface TitleBlockData {
  projectName:     string;
  projectNumber:   string;
  clientName:      string;
  propertyAddress: string;
  council:         string;
  designedBy:      string;
  drawnBy:         string;
  checkedBy:       string;
  approvedBy:      string;
  revision:        string;
  date:            string;
  status:          string; // 'For Approval' | 'For Construction' | 'As Constructed' | 'Preliminary'
  documentType:    string;
}

export const DEFAULT_TITLE_BLOCK: TitleBlockData = {
  projectName:     '',
  projectNumber:   '',
  clientName:      '',
  propertyAddress: '',
  council:         '',
  designedBy:      '',
  drawnBy:         '',
  checkedBy:       '',
  approvedBy:      '',
  revision:        'A',
  date:            new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  status:          'For Approval',
  documentType:    'Structural Drawing',
};

/** Renders the title block SVG fragment positioned at (x, y) within a drawing of width W. */
function renderBlock(
  x: number, y: number, W: number,
  tb: TitleBlockData,
  drawingTitle: string,
  drawingNumber: string,
  sheet: number,
  totalSheets: number,
  scale: string,
): string {
  const H_BLOCK = 80;
  const mono    = 'DM Mono,monospace';
  const border  = '#c8cce0';
  const fill    = 'rgba(255,255,255,0.04)';
  const labelCol = '#9090a0';
  const valueCol = '#e8eaf0';
  const accentCol = '#c9a84c';

  // ── Column widths (fractions of W) ──
  // Layout: [left-wide] [mid] [right-narrow]
  const colA = W * 0.38; // project / client info
  const colB = W * 0.38; // drawing info
  const colC = W * 0.24; // numbers / stamps

  const bx = x, by = y;
  const rowH = H_BLOCK / 4; // 4 rows

  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${border}" stroke-width="0.5"/>`;

  const cell = (cx: number, cy: number, cw: number, ch: number, label: string, value: string, accent = false) => {
    const lx = cx + 3, ly = cy + 8;
    const vx = cx + 3, vy = cy + ch - 4;
    return [
      `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="${fill}" stroke="${border}" stroke-width="0.5"/>`,
      label ? `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-family="${mono}" font-size="5.5" fill="${labelCol}" font-weight="600">${label.toUpperCase()}</text>` : '',
      value ? `<text x="${vx.toFixed(1)}" y="${vy.toFixed(1)}" font-family="${mono}" font-size="${accent ? 8 : 7}" fill="${accent ? accentCol : valueCol}" font-weight="${accent ? '700' : '400'}">${value}</text>` : '',
    ].join('');
  };

  const statusColors: Record<string, string> = {
    'For Approval':    '#f59e0b',
    'For Construction': '#22c55e',
    'As Constructed':  '#3b82f6',
    'Preliminary':     '#a78bfa',
  };
  const statusCol = statusColors[tb.status] || accentCol;

  let s = '';

  // Outer border
  s += `<rect x="${bx}" y="${by}" width="${W}" height="${H_BLOCK}" fill="rgba(15,16,20,0.95)" stroke="${border}" stroke-width="0.8"/>`;

  // ── Row 0: Project name | Drawing title | DRG No ──
  const r0y = by;
  s += cell(bx,        r0y, colA, rowH, 'Project',       tb.projectName  || '—');
  s += cell(bx + colA, r0y, colB, rowH, 'Drawing Title', drawingTitle    || '—', true);
  s += cell(bx + colA + colB, r0y, colC, rowH, 'Drawing No.', drawingNumber || '—');

  // ── Row 1: Client | Address | Sheet X of Y ──
  const r1y = by + rowH;
  s += cell(bx,        r1y, colA, rowH, 'Client / Owner', tb.clientName       || '—');
  s += cell(bx + colA, r1y, colB, rowH, 'Address',        tb.propertyAddress  || '—');
  s += cell(bx + colA + colB, r1y, colC, rowH, 'Sheet', `${sheet} of ${totalSheets}`);

  // ── Row 2: Designed | Drawn | Checked | Date | Scale ──
  const r2y = by + rowH * 2;
  const qA = colA / 2, qB = colB / 2;
  s += cell(bx,            r2y, qA, rowH, 'Designed By', tb.designedBy || '—');
  s += cell(bx + qA,       r2y, qA, rowH, 'Drawn By',    tb.drawnBy    || '—');
  s += cell(bx + colA,     r2y, qB, rowH, 'Checked By',  tb.checkedBy  || '—');
  s += cell(bx + colA + qB, r2y, qB, rowH, 'Approved By', tb.approvedBy || '—');
  s += cell(bx + colA + colB, r2y, colC / 2, rowH, 'Date',  tb.date   || '—');
  s += cell(bx + colA + colB + colC / 2, r2y, colC / 2, rowH, 'Scale', scale || 'NTS');

  // ── Row 3: Council | Project No | Revision | Status | Doc Type ──
  const r3y = by + rowH * 3;
  const cW1 = colA * 0.55, cW2 = colA * 0.45;
  s += cell(bx,      r3y, cW1, rowH, 'Council', tb.council       || '—');
  s += cell(bx + cW1, r3y, cW2, rowH, 'Project No.', tb.projectNumber || '—');
  s += cell(bx + colA, r3y, colB * 0.25, rowH, 'Rev.', tb.revision || 'A');
  s += cell(bx + colA + colB * 0.25, r3y, colB * 0.75, rowH, 'Document Type', tb.documentType || '—');

  // Status stamp (right column row 3) — coloured
  const sRX = bx + colA + colB;
  s += `<rect x="${sRX.toFixed(1)}" y="${r3y.toFixed(1)}" width="${colC.toFixed(1)}" height="${rowH.toFixed(1)}" fill="rgba(15,16,20,0.95)" stroke="${border}" stroke-width="0.5"/>`;
  s += `<rect x="${(sRX + 2).toFixed(1)}" y="${(r3y + 2).toFixed(1)}" width="${(colC - 4).toFixed(1)}" height="${(rowH - 4).toFixed(1)}" fill="${statusCol}" opacity="0.15" rx="2"/>`;
  s += `<text x="${(sRX + colC / 2).toFixed(1)}" y="${(r3y + rowH / 2 + 4).toFixed(1)}" text-anchor="middle" font-family="${mono}" font-size="7.5" fill="${statusCol}" font-weight="700">${tb.status.toUpperCase()}</text>`;

  // Draftly watermark (right edge, small)
  s += `<text x="${(bx + W - 4).toFixed(1)}" y="${(by + H_BLOCK - 3).toFixed(1)}" text-anchor="end" font-family="${mono}" font-size="5" fill="${labelCol}" opacity="0.5">Generated by Draftly Structural Designer</text>`;

  return s;
}

// ── A3 landscape sheet dimensions at 72 dpi (420mm × 297mm) ──
const A3_W  = 1190; // px  ≈ 420mm
const A3_H  = 842;  // px  ≈ 297mm
const TB_H  = 80;   // px title block height  ≈ 28mm
const BORDER = 15;  // px border / margin inside sheet

/**
 * Places an existing drawing SVG onto a standard A3 landscape sheet.
 * The drawing is scaled to fit the upper drawing area; the title block
 * spans the full A3 width at the bottom.
 */
export function withTitleBlock(
  svgString: string,
  tb: TitleBlockData,
  drawingTitle: string,
  drawingNumber: string,
  sheet: number = 1,
  totalSheets: number = 1,
  scale: string = 'NTS',
): string {
  if (!svgString) return svgString;

  // ── Parse original drawing dimensions ──
  const vbMatch = svgString.match(/viewBox="([\d.\s-]+)"/);
  if (!vbMatch) return svgString;
  const parts = vbMatch[1].trim().split(/\s+/).map(Number);
  const [origX, origY, origW, origH] = parts.length === 4
    ? parts : [0, 0, parts[0] ?? 600, parts[1] ?? 400];

  // ── Drawing area = A3 sheet minus title block and borders ──
  const drawAreaW = A3_W - BORDER * 2;
  const drawAreaH = A3_H - TB_H - BORDER * 2;

  // Scale content to fit, preserving aspect ratio
  const sx = drawAreaW / origW;
  const sy = drawAreaH / origH;
  const sc = Math.min(sx, sy);

  // Centre the scaled drawing within the draw area
  const scaledW = origW * sc;
  const scaledH = origH * sc;
  const offsetX = BORDER + (drawAreaW - scaledW) / 2;
  const offsetY = BORDER + (drawAreaH - scaledH) / 2;

  // ── Extract inner SVG content (everything between <svg ...> and </svg>) ──
  const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const innerContent = innerMatch ? innerMatch[1] : '';

  // ── Build A3 sheet SVG ──
  const mono = 'DM Mono,monospace';
  const borderCol = '#6b7090';

  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${A3_W} ${A3_H}" style="width:100%;max-width:${A3_W}px;display:block;background:#12131a;">`;

  // Sheet background + outer border
  out += `<rect width="${A3_W}" height="${A3_H}" fill="#12131a"/>`;
  out += `<rect x="${BORDER / 2}" y="${BORDER / 2}" width="${A3_W - BORDER}" height="${A3_H - BORDER}" fill="none" stroke="${borderCol}" stroke-width="0.8"/>`;

  // Inner border / drawing frame (above title block)
  out += `<rect x="${BORDER}" y="${BORDER}" width="${drawAreaW}" height="${drawAreaH}" fill="none" stroke="${borderCol}" stroke-width="0.5" stroke-dasharray="4,3" opacity="0.4"/>`;

  // ── Drawing content, scaled and centred ──
  // Wrap inside a new svg element that sets the coordinate space back to the original
  out += `<svg x="${offsetX}" y="${offsetY}" width="${scaledW}" height="${scaledH}" viewBox="${origX} ${origY} ${origW} ${origH}">`;
  out += innerContent;
  out += `</svg>`;

  // ── Title block across the full A3 width ──
  out += renderBlock(0, A3_H - TB_H, A3_W, tb, drawingTitle, drawingNumber, sheet, totalSheets, scale);

  out += `</svg>`;
  return out;
}
