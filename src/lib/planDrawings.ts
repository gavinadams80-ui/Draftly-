// ── Building Layout & Roof Geometry Drawing Engine ──
// Generates plan view SVG and roof pitch "Y diagram"

// ── Roof Geometry Diagram ("Y diagram") ──
export function generateRoofGeometrySVG(
  span: number,     // m — full width
  pitch: number,    // degrees
  height: number,   // m — eave height
  isGable: boolean,
): string {
  const W = 480, H = 280;
  const margin = { top: 30, right: 30, bottom: 50, left: 55 };
  const drawW = W - margin.left - margin.right;
  const drawH = H - margin.top - margin.bottom;

  const rise = (span / 2) * Math.tan(pitch * Math.PI / 180);
  const rafterLen = Math.sqrt(Math.pow(span / 2, 2) + Math.pow(rise, 2));

  const maxW = span;
  const maxH = Math.max(rise, height * 0.3);
  const sc = Math.min(drawW / maxW, drawH / maxH) * 0.85;

  const triW = span * sc;
  const triH = rise * sc;

  const baseY = margin.top + drawH;
  const leftX = margin.left + (drawW - triW) / 2;
  const rightX = leftX + triW;
  const apexX = leftX + triW / 2;
  const apexY = baseY - triH;

  const dimCol = '#6b7090';
  const frameCol = '#c9a84c';
  const rafterCol = '#8bc34a';
  const textCol = '#c8cce0';
  const mono = 'DM Mono,monospace';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">`;
  svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;

  svg += `<text x="${W / 2}" y="16" text-anchor="middle" font-family="${mono}" font-size="11" fill="${textCol}" font-weight="600">ROOF GEOMETRY · ${isGable ? 'GABLE' : 'SKILLION'} · ${pitch}° pitch</text>`;

  if (isGable) {
    svg += `<line x1="${leftX}" y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="${rafterCol}" stroke-width="2"/>`;
    svg += `<line x1="${rightX}" y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="${rafterCol}" stroke-width="2"/>`;
    svg += `<line x1="${leftX}" y1="${baseY}" x2="${rightX}" y2="${baseY}" stroke="${frameCol}" stroke-width="2.5"/>`;
    svg += `<line x1="${apexX}" y1="${apexY}" x2="${apexX}" y2="${baseY}" stroke="${dimCol}" stroke-width="0.6" stroke-dasharray="4,3"/>`;

    const arcR = 25;
    svg += `<path d="M ${leftX + arcR},${baseY} A ${arcR},${arcR} 0 0 0 ${leftX + arcR * Math.cos((180 - pitch) * Math.PI / 180)},${baseY + arcR * Math.sin((180 - pitch) * Math.PI / 180)}" fill="none" stroke="${dimCol}" stroke-width="0.6"/>`;
    svg += `<text x="${leftX + arcR + 5}" y="${baseY - 5}" font-family="${mono}" font-size="7" fill="${dimCol}">${pitch}°</text>`;
    svg += `<path d="M ${rightX - arcR},${baseY} A ${arcR},${arcR} 0 0 1 ${rightX - arcR * Math.cos((180 - pitch) * Math.PI / 180)},${baseY + arcR * Math.sin((180 - pitch) * Math.PI / 180)}" fill="none" stroke="${dimCol}" stroke-width="0.6"/>`;
    svg += `<text x="${rightX - arcR - 25}" y="${baseY - 5}" font-family="${mono}" font-size="7" fill="${dimCol}">${pitch}°</text>`;

    const dimY = baseY + 18;
    svg += `<line x1="${leftX}" y1="${dimY}" x2="${rightX}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${leftX}" y1="${baseY + 3}" x2="${leftX}" y2="${dimY - 2}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${rightX}" y1="${baseY + 3}" x2="${rightX}" y2="${dimY - 2}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<text x="${(leftX + rightX) / 2}" y="${dimY + 10}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${textCol}" font-weight="600">SPAN ${span.toFixed(2)}m</text>`;

    const dimX = apexX + 8;
    svg += `<line x1="${dimX}" y1="${apexY}" x2="${dimX}" y2="${baseY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<text x="${dimX + 3}" y="${(apexY + baseY) / 2 + 3}" font-family="${mono}" font-size="7" fill="${textCol}">RISE ${rise.toFixed(3)}m</text>`;

    const rafterMidX = (leftX + apexX) / 2;
    const rafterMidY = (baseY + apexY) / 2;
    svg += `<text x="${rafterMidX - 35}" y="${rafterMidY - 5}" font-family="${mono}" font-size="7" fill="${rafterCol}" transform="rotate(-${pitch},${rafterMidX - 35},${rafterMidY - 5})">RAFTER ${rafterLen.toFixed(3)}m</text>`;
    svg += `<text x="${(leftX + apexX) / 2}" y="${baseY + 5}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${dimCol}">${(span / 2).toFixed(2)}m</text>`;

    svg += `<line x1="${leftX}" y1="${baseY - 4}" x2="${leftX}" y2="${baseY + 4}" stroke="${frameCol}" stroke-width="1.5"/>`;
    svg += `<text x="${leftX}" y="${baseY + 14}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${frameCol}">POST</text>`;
    svg += `<line x1="${rightX}" y1="${baseY - 4}" x2="${rightX}" y2="${baseY + 4}" stroke="${frameCol}" stroke-width="1.5"/>`;
    svg += `<text x="${rightX}" y="${baseY + 14}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${frameCol}">POST</text>`;
    svg += `<line x1="${apexX}" y1="${baseY - 4}" x2="${apexX}" y2="${baseY + 4}" stroke="${frameCol}" stroke-width="1.5"/>`;
    svg += `<text x="${apexX}" y="${baseY + 14}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${frameCol}">RIDGE</text>`;
  } else {
    const skillionH = triH * 0.6;
    const topY = baseY - skillionH;
    svg += `<line x1="${leftX}" y1="${topY}" x2="${rightX}" y2="${baseY}" stroke="${rafterCol}" stroke-width="2"/>`;
    svg += `<line x1="${leftX}" y1="${baseY}" x2="${rightX}" y2="${baseY}" stroke="${frameCol}" stroke-width="2.5"/>`;
    svg += `<line x1="${leftX}" y1="${topY}" x2="${leftX}" y2="${baseY}" stroke="${frameCol}" stroke-width="2"/>`;
    const dimY = baseY + 22;
    svg += `<text x="${W / 2}" y="${dimY}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${textCol}" font-weight="600">SPAN ${span.toFixed(2)}m · SKILLION ${pitch}°</text>`;
    svg += `<text x="${W - 10}" y="${margin.top + 14}" text-anchor="end" font-family="${mono}" font-size="8" fill="${dimCol}">Span: ${span.toFixed(2)}m</text>`;
    svg += `<text x="${W - 10}" y="${margin.top + 26}" text-anchor="end" font-family="${mono}" font-size="8" fill="${dimCol}">Rise: ${(span * Math.tan(pitch * Math.PI / 180)).toFixed(3)}m</text>`;
    svg += `<text x="${W - 10}" y="${margin.top + 38}" text-anchor="end" font-family="${mono}" font-size="8" fill="${dimCol}">Pitch: ${pitch}°</text>`;
  }

  if (isGable) {
    const stats = [
      `Span: ${span.toFixed(2)}m`,
      `Rise: ${rise.toFixed(3)}m`,
      `Rafter: ${rafterLen.toFixed(3)}m`,
      `Pitch: ${pitch}°`,
      `Gable H: ${height.toFixed(2)}m`,
    ];
    stats.forEach((s, i) => {
      svg += `<text x="${W - 10}" y="${margin.top + 14 + i * 12}" text-anchor="end" font-family="${mono}" font-size="8" fill="${dimCol}">${s}</text>`;
    });
  }

  svg += `</svg>`;
  return svg;
}

// ── Building Plan View — 3-Side Attached ──
// Shows house wrapping around on 3 sides with 150mm standoff
export function generateBuildingPlanSVG(
  width: number,       // m — structure span (across the gable)
  depth: number,       // m — structure depth (along the house)
  _height: number,     // reserved
  _pitch: number,      // reserved
  attachment: string,  // 'freestanding' | 'attached' | 'three-side'
  portalFrameCount: number,
  isGable: boolean,
  standoff: number = 0.15,  // m — standoff from brick wall (default 150mm)
): string {
  const W = 560, H = 420;
  const margin = { top: 40, right: 40, bottom: 55, left: 55 };
  const drawW = W - margin.left - margin.right;
  const drawH = H - margin.top - margin.bottom;

  // House dimensions (larger than structure, wraps around)
  const houseDepth = depth + 2.0;  // house extends 2m beyond structure at back
  const houseLeftWidth = width * 0.4;  // house extends left
  const houseRightInset = 1.8;  // house stops 1.8m from bottom-right corner

  // Total drawing bounds
  const totalW = width + houseLeftWidth + standoff + 1.0;
  const totalD = houseDepth + standoff + 1.0;

  const sc = Math.min(drawW / totalW, drawH / totalD) * 0.88;

  const so = standoff * sc;  // standoff in pixels

  // Structure position (offset from house walls by standoff)
  const structW = width * sc;
  const structD = depth * sc;
  const structX = margin.left + houseLeftWidth * sc + so;
  const structY = margin.top + (houseDepth - depth) * sc + so;

  // Draw house as L-shape (3 sides)
  const hL = margin.left;  // house left
  const hR = margin.left + (houseLeftWidth + width) * sc + so;  // house right
  const hT = margin.top;   // house top
  const hB = margin.top + houseDepth * sc + so;  // house bottom
  const hStopY = hB - houseRightInset * sc;  // where right wall stops

  const dimCol = '#6b7090';
  const houseCol = '#888';
  const houseFill = 'rgba(136,136,136,0.08)';
  const structCol = '#c9a84c';
  const structFill = 'rgba(201,168,76,0.06)';
  const postCol = '#8bc34a';
  const rafterCol = '#c9a84c';
  const textCol = '#c8cce0';
  const standoffCol = '#2196f3';
  const mono = 'DM Mono,monospace';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">`;
  svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;

  const attachLabel = attachment === 'three-side' ? '3-SIDE ATTACHED' : attachment === 'attached' ? 'ATTACHED' : 'FREESTANDING';
  svg += `<text x="${W / 2}" y="18" text-anchor="middle" font-family="${mono}" font-size="11" fill="${textCol}" font-weight="600">PLAN VIEW · ${attachLabel} · ${width.toFixed(2)}m × ${depth.toFixed(2)}m · ${(standoff * 1000).toFixed(0)}mm standoff</text>`;

  // ── House walls (L-shape for 3-side attached) ──
  if (attachment === 'three-side') {
    // House left wall (full height)
    svg += `<rect x="${hL}" y="${hT}" width="${houseLeftWidth * sc}" height="${houseDepth * sc + so}" fill="${houseFill}" stroke="${houseCol}" stroke-width="1" stroke-dasharray="4,3"/>`;
    // House back wall (full width)
    svg += `<rect x="${hL}" y="${hT}" width="${(houseLeftWidth + width) * sc + so}" height="${(houseDepth - depth) * sc + so}" fill="${houseFill}" stroke="${houseCol}" stroke-width="1" stroke-dasharray="4,3"/>`;
    // House right wall (partial - stops before corner)
    svg += `<rect x="${hR - houseLeftWidth * sc}" y="${hT}" width="${houseLeftWidth * sc}" height="${(houseDepth - houseRightInset) * sc + so}" fill="${houseFill}" stroke="${houseCol}" stroke-width="1" stroke-dasharray="4,3"/>`;

    // House labels
    svg += `<text x="${hL + houseLeftWidth * sc / 2}" y="${hT + houseDepth * sc / 2}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${houseCol}" font-style="italic">EXISTING</text>`;
    svg += `<text x="${hL + houseLeftWidth * sc / 2}" y="${hT + houseDepth * sc / 2 + 12}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${houseCol}" font-style="italic">DWELLING</text>`;

    // Gap label where house stops
    svg += `<text x="${hR + 8}" y="${hStopY + 20}" font-family="${mono}" font-size="7" fill="${houseCol}" font-style="italic">gap</text>`;
    svg += `<text x="${hR + 8}" y="${hStopY + 32}" font-family="${mono}" font-size="7" fill="${houseCol}">${houseRightInset.toFixed(1)}m</text>`;

    // Standoff dimension arrows
    // Left standoff
    svg += `<line x1="${structX - so}" y1="${structY}" x2="${structX}" y2="${structY}" stroke="${standoffCol}" stroke-width="1" stroke-dasharray="3,2"/>`;
    svg += `<text x="${structX - so / 2}" y="${structY - 4}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${standoffCol}">${(standoff * 1000).toFixed(0)}mm</text>`;
    // Back standoff
    svg += `<line x1="${structX}" y1="${structY - so}" x2="${structX}" y2="${structY}" stroke="${standoffCol}" stroke-width="1" stroke-dasharray="3,2"/>`;
    svg += `<text x="${structX + 10}" y="${structY - so / 2}" font-family="${mono}" font-size="6" fill="${standoffCol}">${(standoff * 1000).toFixed(0)}mm</text>`;

  } else if (attachment === 'attached') {
    // Single wall attachment
    svg += `<rect x="${structX}" y="${structY - so - 20}" width="${structW}" height="20" fill="${houseFill}" stroke="${houseCol}" stroke-width="1" stroke-dasharray="4,3"/>`;
    svg += `<text x="${structX + structW / 2}" y="${structY - so - 6}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${houseCol}" font-style="italic">EXISTING DWELLING</text>`;
  } else {
    // Freestanding - small house reference
    svg += `<rect x="${structX + structW + 15}" y="${structY + structD / 2 - 15}" width="40" height="30" fill="${houseFill}" stroke="${houseCol}" stroke-width="1" stroke-dasharray="4,3"/>`;
    svg += `<text x="${structX + structW + 35}" y="${structY + structD / 2 + 3}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${houseCol}" font-style="italic">HOUSE</text>`;
  }

  // ── Structure footprint ──
  svg += `<rect x="${structX}" y="${structY}" width="${structW}" height="${structD}" fill="${structFill}" stroke="${structCol}" stroke-width="1.5"/>`;
  svg += `<defs><pattern id="structHatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${structCol}" stroke-width="0.5" opacity="0.25"/></pattern></defs>`;
  svg += `<rect x="${structX}" y="${structY}" width="${structW}" height="${structD}" fill="url(#structHatch)"/>`;

  // ── Portal frame lines ──
  const frameSpacing = structD / (portalFrameCount - 1);
  for (let i = 0; i < portalFrameCount; i++) {
    const fy = structY + i * frameSpacing;
    svg += `<line x1="${structX}" y1="${fy}" x2="${structX + structW}" y2="${fy}" stroke="${rafterCol}" stroke-width="0.8" opacity="0.5"/>`;

    const postSize = 4;
    // Left post
    svg += `<rect x="${structX - postSize / 2}" y="${fy - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="${postCol}" stroke-width="0.5"/>`;
    // Right post (except if this is the back frame attached to house on right side)
    if (attachment !== 'three-side' || i * frameSpacing < (depth - houseRightInset) * sc) {
      svg += `<rect x="${structX + structW - postSize / 2}" y="${fy - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="${postCol}" stroke-width="0.5"/>`;
    }

    if (i === 0 || i === portalFrameCount - 1) {
      svg += `<text x="${structX - 12}" y="${fy + 2}" text-anchor="end" font-family="${mono}" font-size="6" fill="${postCol}">F${i + 1}</text>`;
    }
  }

  // Corner column (bottom right) — special marking
  if (attachment === 'three-side') {
    const cornerX = structX + structW;
    const cornerY = structY + structD;
    svg += `<circle cx="${cornerX}" cy="${cornerY}" r="5" fill="none" stroke="#f44336" stroke-width="1.5"/>`;
    svg += `<circle cx="${cornerX}" cy="${cornerY}" r="2" fill="#f44336"/>`;
    svg += `<text x="${cornerX + 8}" y="${cornerY + 3}" font-family="${mono}" font-size="7" fill="#f44336" font-weight="600">CORNER POST</text>`;
    svg += `<text x="${cornerX + 8}" y="${cornerY + 13}" font-family="${mono}" font-size="6" fill="${dimCol}">bolted through ledger</text>`;
  }

  // ── Purlin lines ──
  const nPurlins = Math.max(3, Math.floor(width / 0.8));
  for (let i = 1; i < nPurlins; i++) {
    const px = structX + (i / nPurlins) * structW;
    svg += `<line x1="${px}" y1="${structY}" x2="${px}" y2="${structY + structD}" stroke="${dimCol}" stroke-width="0.4" stroke-dasharray="3,3" opacity="0.4"/>`;
  }

  // ── Gable end indicators ──
  if (isGable) {
    svg += `<text x="${structX + structW / 2}" y="${structY - 6}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${structCol}">▼ GABLE END (infill)</text>`;
    svg += `<text x="${structX + structW / 2}" y="${structY + structD + 12}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${structCol}">▲ GABLE END (infill)</text>`;
  }

  // ── Member labels ──
  const midX = structX + structW / 2;
  if (attachment !== 'freestanding') {
    svg += `<text x="${midX}" y="${structY + 10}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${textCol}">LEDGER BEAM →</text>`;
  }
  svg += `<text x="${midX}" y="${structY + structD - 5}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${textCol}">← FASCIA BEAM</text>`;

  // ── Dimensions ──
  const dimTop = structY - 20;
  svg += `<line x1="${structX}" y1="${dimTop}" x2="${structX + structW}" y2="${dimTop}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<line x1="${structX}" y1="${structY - 3}" x2="${structX}" y2="${dimTop + 2}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<line x1="${structX + structW}" y1="${structY - 3}" x2="${structX + structW}" y2="${dimTop + 2}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<text x="${midX}" y="${dimTop - 3}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}">${width.toFixed(2)}m SPAN</text>`;

  const dimLeft = structX - 25;
  svg += `<line x1="${dimLeft}" y1="${structY}" x2="${dimLeft}" y2="${structY + structD}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<line x1="${structX - 3}" y1="${structY}" x2="${dimLeft + 2}" y2="${structY}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<line x1="${structX - 3}" y1="${structY + structD}" x2="${dimLeft + 2}" y2="${structY + structD}" stroke="${dimCol}" stroke-width="0.6"/>`;
  svg += `<text x="${dimLeft - 3}" y="${structY + structD / 2 + 3}" text-anchor="middle" transform="rotate(-90,${dimLeft - 3},${structY + structD / 2 + 3})" font-family="${mono}" font-size="7" fill="${dimCol}">${depth.toFixed(2)}m DEPTH</text>`;

  // ── Legend ──
  const legX = W - 130;
  const legY = H - 85;
  svg += `<rect x="${legX}" y="${legY}" width="120" height="65" fill="rgba(21,22,24,0.8)" stroke="${dimCol}" stroke-width="0.5" rx="4"/>`;
  svg += `<text x="${legX + 5}" y="${legY + 10}" font-family="${mono}" font-size="7" fill="${dimCol}" font-weight="600">LEGEND</text>`;
  svg += `<rect x="${legX + 5}" y="${legY + 16}" width="8" height="8" fill="${postCol}"/>`;
  svg += `<text x="${legX + 16}" y="${legY + 23}" font-family="${mono}" font-size="7" fill="${textCol}">Column/Post</text>`;
  svg += `<line x1="${legX + 5}" y1="${legY + 32}" x2="${legX + 13}" y2="${legY + 32}" stroke="${rafterCol}" stroke-width="1.5"/>`;
  svg += `<text x="${legX + 16}" y="${legY + 35}" font-family="${mono}" font-size="7" fill="${textCol}">Rafter/Beam</text>`;
  svg += `<line x1="${legX + 5}" y1="${legY + 42}" x2="${legX + 13}" y2="${legY + 42}" stroke="${dimCol}" stroke-width="0.5" stroke-dasharray="2,2"/>`;
  svg += `<text x="${legX + 16}" y="${legY + 45}" font-family="${mono}" font-size="7" fill="${textCol}">Purlin</text>`;
  svg += `<circle cx="${legX + 9}" cy="${legY + 54}" r="3" fill="none" stroke="#f44336" stroke-width="1"/>`;
  svg += `<text x="${legX + 16}" y="${legY + 57}" font-family="${mono}" font-size="7" fill="#f44336">Corner Post</text>`;

  svg += `</svg>`;
  return svg;
}
