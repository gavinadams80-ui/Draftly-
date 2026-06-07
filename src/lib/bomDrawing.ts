// ── Bill of Materials sheet ──
// Renders the material take-off as an AS1100-style schedule table for the
// drawing set. Pure: takes the computed schedule, returns an inner SVG that
// withTitleBlock() frames onto an A3 sheet.

export interface BomLine {
  member: string;
  size: string;
  qty: number;
  totalLengthM: number;
  totalKg: number;
  cost: number;
}

export function generateBomSVG(
  lines: BomLine[],
  totalKg: number,
  totalCost: number,
  ratePerKg: number,
): string {
  const W = 760, H = 560;
  const mono = 'DM Mono,monospace';
  const dim = '#6b7090';
  const text = '#c8cce0';
  const accent = '#c9a84c';
  const line = '#3a3d48';

  const x0 = 24, x1 = W - 24;
  const top = 56;
  const rowH = 22;

  // Column x-positions (left edges) and alignment
  const cols = [
    { x: x0 + 6, w: 250, label: 'MEMBER', align: 'start' as const },
    { x: x0 + 256, w: 150, label: 'SECTION', align: 'start' as const },
    { x: x0 + 430, w: 60, label: 'QTY', align: 'end' as const },
    { x: x0 + 540, w: 80, label: 'LENGTH m', align: 'end' as const },
    { x: x0 + 640, w: 80, label: 'MASS kg', align: 'end' as const },
    { x: x1 - 6, w: 80, label: 'COST', align: 'end' as const },
  ];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">`;
  svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;
  svg += `<text x="${x0}" y="32" font-family="${mono}" font-size="14" fill="${text}" font-weight="700">BILL OF MATERIALS — STEEL TAKE-OFF</text>`;
  svg += `<text x="${x1}" y="32" text-anchor="end" font-family="${mono}" font-size="9" fill="${dim}">Rate $${ratePerKg.toFixed(2)}/kg · indicative</text>`;

  // Header row
  const headY = top;
  svg += `<line x1="${x0}" y1="${headY + 5}" x2="${x1}" y2="${headY + 5}" stroke="${accent}" stroke-width="1"/>`;
  for (const c of cols) {
    svg += `<text x="${c.x}" y="${headY}" text-anchor="${c.align}" font-family="${mono}" font-size="9" fill="${accent}" font-weight="700">${c.label}</text>`;
  }

  // Rows
  let y = headY + rowH;
  for (const l of lines) {
    const cells = [l.member, l.size, String(l.qty), l.totalLengthM.toFixed(1), l.totalKg.toFixed(0), '$' + l.cost.toFixed(0)];
    cells.forEach((val, i) => {
      const c = cols[i];
      const fill = i === 5 ? accent : i <= 1 ? text : dim;
      svg += `<text x="${c.x}" y="${y}" text-anchor="${c.align}" font-family="${mono}" font-size="9" fill="${fill}">${val}</text>`;
    });
    svg += `<line x1="${x0}" y1="${y + 6}" x2="${x1}" y2="${y + 6}" stroke="${line}" stroke-width="0.4"/>`;
    y += rowH;
  }

  // Total row
  y += 4;
  svg += `<line x1="${x0}" y1="${y - rowH + 6}" x2="${x1}" y2="${y - rowH + 6}" stroke="${accent}" stroke-width="1"/>`;
  svg += `<text x="${cols[0].x}" y="${y}" font-family="${mono}" font-size="11" fill="${text}" font-weight="700">TOTAL</text>`;
  svg += `<text x="${cols[4].x}" y="${y}" text-anchor="end" font-family="${mono}" font-size="11" fill="${text}" font-weight="700">${totalKg.toFixed(0)} kg</text>`;
  svg += `<text x="${cols[5].x}" y="${y}" text-anchor="end" font-family="${mono}" font-size="11" fill="${accent}" font-weight="700">$${totalCost.toFixed(0)}</text>`;

  // Notes
  svg += `<text x="${x0}" y="${H - 28}" font-family="${mono}" font-size="8" fill="${dim}">Indicative steel-only take-off from frame geometry and the selected sections, including lateral / longitudinal bracing.</text>`;
  svg += `<text x="${x0}" y="${H - 16}" font-family="${mono}" font-size="8" fill="${dim}">Excludes connections, fixings, footings, roof/wall sheeting and labour. Confirm quantities against the issued drawings before ordering.</text>`;

  svg += `</svg>`;
  return svg;
}
