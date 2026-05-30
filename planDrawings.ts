// ── Building Layout & Roof Geometry Drawing Engine ──
// NOW EDITABLE: accepts DrawingParams for display toggles

import type { DrawingParams } from './drawingParams';

// ── Roof Geometry Diagram ("Y diagram") ──
export function generateRoofGeometrySVG(
  span: number,
  pitch: number,
  height: number,
  isGable: boolean,
  params?: DrawingParams
): string {
  const p = params || {} as DrawingParams;
  const showRafterLen = p.showRafterLength !== false;
  const showRise = p.showRise !== false;
  const showPitchArc = p.showPitchArc !== false;
  const showLabels = p.showLabels !== false;

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

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="background:transparent;max-width:100%;">`;

  svg += `<text x="${W / 2}" y="20" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="12" font-weight="bold">ROOF GEOMETRY · ${isGable ? 'GABLE' : 'SKILLION'} · ${pitch}° pitch</text>`;

  if (isGable) {
    svg += `<polygon points="${leftX},${baseY} ${apexX},${apexY} ${rightX},${baseY}" fill="none" stroke="${frameCol}" stroke-width="2"/>`;
    svg += `<line x1="${apexX}" y1="${apexY}" x2="${apexX}" y2="${baseY}" stroke="${dimCol}" stroke-width="0.5" stroke-dasharray="3,2"/>`;
    svg += `<line x1="${leftX}" y1="${baseY}" x2="${rightX}" y2="${baseY}" stroke="${frameCol}" stroke-width="2"/>`;

    if (showPitchArc) {
      const arcR = 25;
      svg += `<path d="M ${leftX + arcR} ${baseY} A ${arcR} ${arcR} 0 0 0 ${leftX + arcR * Math.cos(pitch * Math.PI / 180)} ${baseY - arcR * Math.sin(pitch * Math.PI / 180)}" fill="none" stroke="${dimCol}" stroke-width="0.5"/>`;
      svg += `<text x="${leftX + arcR + 5}" y="${baseY - arcR / 2}" fill="${dimCol}" font-family="${mono}" font-size="9">${pitch}°</text>`;
      svg += `<path d="M ${rightX - arcR} ${baseY} A ${arcR} ${arcR} 0 0 1 ${rightX - arcR * Math.cos(pitch * Math.PI / 180)} ${baseY - arcR * Math.sin(pitch * Math.PI / 180)}" fill="none" stroke="${dimCol}" stroke-width="0.5"/>`;
      svg += `<text x="${rightX - arcR - 20}" y="${baseY - arcR / 2}" fill="${dimCol}" font-family="${mono}" font-size="9">${pitch}°</text>`;
    }

    const dimY = baseY + 18;
    svg += `<line x1="${leftX}" y1="${dimY}" x2="${rightX}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${leftX}" y1="${baseY - 3}" x2="${leftX}" y2="${dimY + 3}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${rightX}" y1="${baseY - 3}" x2="${rightX}" y2="${dimY + 3}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<text x="${(leftX + rightX) / 2}" y="${dimY - 4}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="9">SPAN ${span.toFixed(2)}m</text>`;

    if (showRise) {
      const dimX = apexX + 8;
      svg += `<line x1="${dimX}" y1="${baseY}" x2="${dimX}" y2="${apexY}" stroke="${dimCol}" stroke-width="0.5"/>`;
      svg += `<text x="${dimX + 4}" y="${(baseY + apexY) / 2 + 3}" fill="${dimCol}" font-family="${mono}" font-size="9">RISE ${rise.toFixed(3)}m</text>`;
    }

    if (showRafterLen) {
      const rafterMidX = (leftX + apexX) / 2;
      const rafterMidY = (baseY + apexY) / 2;
      svg += `<text x="${rafterMidX}" y="${rafterMidY - 5}" text-anchor="middle" fill="${rafterCol}" font-family="${mono}" font-size="8">RAFTER ${rafterLen.toFixed(3)}m</text>`;
      svg += `<text x="${(leftX + apexX) / 2}" y="${baseY + 8}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="8">${(span / 2).toFixed(2)}m</text>`;
    }

    if (showLabels) {
      svg += `<text x="${leftX - 10}" y="${baseY + 15}" text-anchor="end" fill="${dimCol}" font-family="${mono}" font-size="8">POST</text>`;
      svg += `<line x1="${leftX}" y1="${baseY}" x2="${leftX}" y2="${baseY + 20}" stroke="${dimCol}" stroke-width="0.5"/>`;
      svg += `<text x="${rightX + 10}" y="${baseY + 15}" text-anchor="start" fill="${dimCol}" font-family="${mono}" font-size="8">POST</text>`;
      svg += `<line x1="${rightX}" y1="${baseY}" x2="${rightX}" y2="${baseY + 20}" stroke="${dimCol}" stroke-width="0.5"/>`;
      svg += `<text x="${apexX}" y="${apexY - 10}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="8">RIDGE</text>`;
    }
  } else {
    const skillionH = triH * 0.6;
    const topY = baseY - skillionH;
    svg += `<line x1="${leftX}" y1="${baseY}" x2="${rightX}" y2="${topY}" stroke="${frameCol}" stroke-width="2"/>`;
    svg += `<line x1="${leftX}" y1="${baseY}" x2="${rightX}" y2="${baseY}" stroke="${frameCol}" stroke-width="2"/>`;
    svg += `<line x1="${rightX}" y1="${topY}" x2="${rightX}" y2="${baseY}" stroke="${dimCol}" stroke-width="0.5" stroke-dasharray="3,2"/>`;
    const dimY = baseY + 22;
    svg += `<text x="${(leftX + rightX) / 2}" y="${dimY}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="9">SPAN ${span.toFixed(2)}m · SKILLION ${pitch}°</text>`;
    if (showLabels) {
      svg += `<text x="${leftX - 10}" y="${baseY + 10}" text-anchor="end" fill="${dimCol}" font-family="${mono}" font-size="8">Span: ${span.toFixed(2)}m</text>`;
      svg += `<text x="${rightX + 10}" y="${topY}" text-anchor="start" fill="${dimCol}" font-family="${mono}" font-size="8">Rise: ${(span * Math.tan(pitch * Math.PI / 180)).toFixed(3)}m</text>`;
      svg += `<text x="${rightX + 10}" y="${topY + 15}" text-anchor="start" fill="${dimCol}" font-family="${mono}" font-size="8">Pitch: ${pitch}°</text>`;
    }
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
      svg += `<text x="${W - 10}" y="${50 + i * 14}" text-anchor="end" fill="${dimCol}" font-family="${mono}" font-size="8">${s}</text>`;
    });
  }

  svg += '</svg>';
  return svg;
}

// ── Building Plan View ──
export function generateBuildingPlanSVG(
  width: number,
  depth: number,
  _height: number,
  _pitch: number,
  attachment: string,
  portalFrameCount: number,
  isGable: boolean,
  standoff: number = 0.15,
  params?: DrawingParams
): string {
  const p = params || {} as DrawingParams;
  const showDims = p.showDimensions !== false;
  const showPurlins = p.showPurlins !== false;
  const showPosts = p.showPosts !== false;
  const showLabels = p.showLabels !== false;

  const W = 560, H = 420;
  const margin = { top: 40, right: 40, bottom: 55, left: 55 };
  const drawW = W - margin.left - margin.right;
  const drawH = H - margin.top - margin.bottom;

  const houseDepth = depth + 2.0;
  const houseLeftWidth = width * 0.4;
  const houseRightInset = 1.8;

  const totalW = width + houseLeftWidth + standoff + 1.0;
  const totalD = houseDepth + standoff + 1.0;

  const sc = Math.min(drawW / totalW, drawH / totalD) * 0.88;
  const so = standoff * sc;

  const structW = width * sc;
  const structD = depth * sc;
  const structX = margin.left + houseLeftWidth * sc + so;
  const structY = margin.top + (houseDepth - depth) * sc + so;

  const hL = margin.left;
  const hR = margin.left + (houseLeftWidth + width) * sc + so;
  const hT = margin.top;
  const hB = margin.top + houseDepth * sc + so;
  const hStopY = hB - houseRightInset * sc;

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

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="background:transparent;max-width:100%;">`;

  const attachLabel = attachment === 'three-side' ? '3-SIDE ATTACHED' : attachment === 'attached' ? 'ATTACHED' : 'FREESTANDING';
  svg += `<text x="${W / 2}" y="22" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="12" font-weight="bold">PLAN VIEW · ${attachLabel} · ${width.toFixed(2)}m × ${depth.toFixed(2)}m · ${(standoff * 1000).toFixed(0)}mm standoff</text>`;

  // House walls
  if (attachment === 'three-side') {
    svg += `<line x1="${hL}" y1="${hT}" x2="${hL}" y2="${hB}" stroke="${houseCol}" stroke-width="2"/>`;
    svg += `<line x1="${hL}" y1="${hT}" x2="${hR}" y2="${hT}" stroke="${houseCol}" stroke-width="2"/>`;
    svg += `<line x1="${hR}" y1="${hT}" x2="${hR}" y2="${hStopY}" stroke="${houseCol}" stroke-width="2"/>`;
    if (showLabels) {
      svg += `<text x="${hL + 20}" y="${hT + 30}" fill="${houseCol}" font-family="${mono}" font-size="10">EXISTING</text>`;
      svg += `<text x="${hL + 20}" y="${hT + 44}" fill="${houseCol}" font-family="${mono}" font-size="10">DWELLING</text>`;
      svg += `<text x="${hR + 5}" y="${hStopY + 15}" fill="${houseCol}" font-family="${mono}" font-size="8">gap</text>`;
      svg += `<text x="${hR + 5}" y="${hStopY + 27}" fill="${houseCol}" font-family="${mono}" font-size="8">${houseRightInset.toFixed(1)}m</text>`;
    }
    if (showDims) {
      svg += `<line x1="${hL}" y1="${structY - 8}" x2="${structX}" y2="${structY - 8}" stroke="${standoffCol}" stroke-width="0.5" stroke-dasharray="3,2"/>`;
      svg += `<text x="${(hL + structX) / 2}" y="${structY - 12}" text-anchor="middle" fill="${standoffCol}" font-family="${mono}" font-size="8">${(standoff * 1000).toFixed(0)}mm</text>`;
      svg += `<line x1="${structX - 8}" y1="${hT}" x2="${structX - 8}" y2="${structY}" stroke="${standoffCol}" stroke-width="0.5" stroke-dasharray="3,2"/>`;
      svg += `<text x="${structX - 12}" y="${(hT + structY) / 2}" text-anchor="end" fill="${standoffCol}" font-family="${mono}" font-size="8" transform="rotate(-90 ${structX - 12} ${(hT + structY) / 2})">${(standoff * 1000).toFixed(0)}mm</text>`;
    }
  } else if (attachment === 'attached') {
    svg += `<line x1="${hL}" y1="${hT}" x2="${hR}" y2="${hT}" stroke="${houseCol}" stroke-width="2"/>`;
    if (showLabels) svg += `<text x="${hL + 20}" y="${hT - 10}" fill="${houseCol}" font-family="${mono}" font-size="10">EXISTING DWELLING</text>`;
  } else {
    svg += `<rect x="${hL + 50}" y="${hT + 50}" width="${80 * sc}" height="${60 * sc}" fill="${houseFill}" stroke="${houseCol}" stroke-width="1"/>`;
    if (showLabels) svg += `<text x="${hL + 50 + 40 * sc}" y="${hT + 50 + 30 * sc}" text-anchor="middle" fill="${houseCol}" font-family="${mono}" font-size="8">HOUSE</text>`;
  }

  // Structure footprint
  svg += `<rect x="${structX}" y="${structY}" width="${structW}" height="${structD}" fill="${structFill}" stroke="${structCol}" stroke-width="2" stroke-dasharray="4,2"/>`;
  svg += `<rect x="${structX + 2}" y="${structY + 2}" width="${structW - 4}" height="${structD - 4}" fill="none" stroke="${structCol}" stroke-width="0.5" stroke-dasharray="2,2"/>`;

  // Portal frame lines
  const frameSpacing = structD / (portalFrameCount - 1);
  for (let i = 0; i < portalFrameCount; i++) {
    const fy = structY + i * frameSpacing;
    svg += `<line x1="${structX}" y1="${fy}" x2="${structX + structW}" y2="${fy}" stroke="${rafterCol}" stroke-width="1"/>`;
    if (showPosts) {
      const postSize = 4;
      svg += `<rect x="${structX - postSize / 2}" y="${fy - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="${postCol}" stroke-width="1"/>`;
      if (attachment !== 'three-side' || i * frameSpacing < (depth - houseRightInset) * sc) {
        svg += `<rect x="${structX + structW - postSize / 2}" y="${fy - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="${postCol}" stroke-width="1"/>`;
      }
    }
    if (showLabels && (i === 0 || i === portalFrameCount - 1)) {
      svg += `<text x="${structX - 15}" y="${fy + 3}" text-anchor="end" fill="${dimCol}" font-family="${mono}" font-size="8">F${i + 1}</text>`;
    }
  }

  // Corner column
  if (attachment === 'three-side') {
    const cornerX = structX + structW;
    const cornerY = structY + structD;
    svg += `<circle cx="${cornerX}" cy="${cornerY}" r="6" fill="none" stroke="#f44336" stroke-width="1.5"/>`;
    svg += `<line x1="${cornerX - 4}" y1="${cornerY - 4}" x2="${cornerX + 4}" y2="${cornerY + 4}" stroke="#f44336" stroke-width="1"/>`;
    svg += `<line x1="${cornerX + 4}" y1="${cornerY - 4}" x2="${cornerX - 4}" y2="${cornerY + 4}" stroke="#f44336" stroke-width="1"/>`;
    if (showLabels) {
      svg += `<text x="${cornerX + 10}" y="${cornerY - 5}" fill="#f44336" font-family="${mono}" font-size="8">CORNER POST</text>`;
      svg += `<text x="${cornerX + 10}" y="${cornerY + 8}" fill="#f44336" font-family="${mono}" font-size="7">bolted through ledger</text>`;
    }
  }

  // Purlin lines
  if (showPurlins) {
    const nPurlins = Math.max(3, Math.floor(width / 0.8));
    for (let i = 1; i < nPurlins; i++) {
      const px = structX + (i / nPurlins) * structW;
      svg += `<line x1="${px}" y1="${structY}" x2="${px}" y2="${structY + structD}" stroke="${dimCol}" stroke-width="0.3" stroke-dasharray="2,3"/>`;
    }
  }

  // Gable end indicators
  if (isGable && showLabels) {
    svg += `<text x="${structX + structW / 2}" y="${structY - 8}" text-anchor="middle" fill="${structCol}" font-family="${mono}" font-size="8">▼ GABLE END (infill)</text>`;
    svg += `<text x="${structX + structW / 2}" y="${structY + structD + 12}" text-anchor="middle" fill="${structCol}" font-family="${mono}" font-size="8">▲ GABLE END (infill)</text>`;
  }

  // Member labels
  if (showLabels) {
    const midX = structX + structW / 2;
    if (attachment !== 'freestanding') svg += `<text x="${structX - 5}" y="${structY + structD / 2}" text-anchor="end" fill="${rafterCol}" font-family="${mono}" font-size="8">LEDGER BEAM →</text>`;
    svg += `<text x="${structX + structW + 5}" y="${structY + structD / 2}" text-anchor="start" fill="${rafterCol}" font-family="${mono}" font-size="8">← FASCIA BEAM</text>`;
  }

  // Dimensions
  if (showDims) {
    const dimTop = structY - 20;
    svg += `<line x1="${structX}" y1="${dimTop}" x2="${structX + structW}" y2="${dimTop}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${structX}" y1="${structY - 3}" x2="${structX}" y2="${dimTop + 3}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${structX + structW}" y1="${structY - 3}" x2="${structX + structW}" y2="${dimTop + 3}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<text x="${structX + structW / 2}" y="${dimTop - 4}" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="9">${width.toFixed(2)}m SPAN</text>`;

    const dimLeft = structX - 25;
    svg += `<line x1="${dimLeft}" y1="${structY}" x2="${dimLeft}" y2="${structY + structD}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${structX - 3}" y1="${structY}" x2="${dimLeft + 3}" y2="${structY}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${structX - 3}" y1="${structY + structD}" x2="${dimLeft + 3}" y2="${structY + structD}" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<text x="${dimLeft - 4}" y="${structY + structD / 2 + 3}" text-anchor="end" fill="${dimCol}" font-family="${mono}" font-size="9" transform="rotate(-90 ${dimLeft - 4} ${structY + structD / 2})">${depth.toFixed(2)}m DEPTH</text>`;
  }

  // Legend
  if (showLabels) {
    const legX = W - 130;
    const legY = H - 85;
    svg += `<rect x="${legX}" y="${legY}" width="120" height="70" rx="3" fill="rgba(30,30,40,0.6)" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<text x="${legX + 60}" y="${legY + 12}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="9" font-weight="bold">LEGEND</text>`;
    svg += `<rect x="${legX + 8}" y="${legY + 20}" width="8" height="8" fill="${postCol}"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 27}" fill="${dimCol}" font-family="${mono}" font-size="8">Column/Post</text>`;
    svg += `<line x1="${legX + 8}" y1="${legY + 36}" x2="${legX + 16}" y2="${legY + 36}" stroke="${rafterCol}" stroke-width="2"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 40}" fill="${dimCol}" font-family="${mono}" font-size="8">Rafter/Beam</text>`;
    svg += `<line x1="${legX + 8}" y1="${legY + 50}" x2="${legX + 16}" y2="${legY + 50}" stroke="${dimCol}" stroke-width="0.5" stroke-dasharray="2,3"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 54}" fill="${dimCol}" font-family="${mono}" font-size="8">Purlin</text>`;
    svg += `<circle cx="${legX + 12}" cy="${legY + 64}" r="3" fill="none" stroke="#f44336" stroke-width="1"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 68}" fill="${dimCol}" font-family="${mono}" font-size="8">Corner Post</text>`;
  }

  svg += '</svg>';
  return svg;
}
