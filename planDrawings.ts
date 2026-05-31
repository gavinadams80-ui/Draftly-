// ── Building Layout & Roof Geometry Drawing Engine ──
// V3: BRICK WALL dimensions input, auto-calculated clear span, unlimited offsets

import type { DrawingParams } from './drawingParams';

// ── Roof Geometry Diagram ──
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
// V3: width/depth = BRICK WALL dimensions. Structure auto-inset by (standoff + fascia).
// Offset = 0 to full depth (how much of the side is NOT covered by house wall).
export function generateBuildingPlanSVG(
  brickWidth: number,      // ← BRICK WALL dimension from site measure
  brickDepth: number,       // ← BRICK WALL dimension from site measure
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

  // Attachment configuration
  const attachBack = p.attachBack !== false;
  const attachLeft = p.attachLeft !== false;
  const attachRight = p.attachRight !== false;
  const attachFront = p.attachFront === true;
  const rightOffsetMm = p.rightOffsetMm || 0;
  const leftOffsetMm = p.leftOffsetMm || 0;
  const backOffsetMm = p.backOffsetMm || 0;

  // ── CRITICAL: Calculate total inset from brick wall ──
  // Structure sits (standoff + fascia thickness) IN from brick wall face on each attached side
  const standoffMm = p.standoffMm || 150;
  const fasciaMm = p.fasciaThickness || 30;
  const totalInsetMm = standoffMm + fasciaMm;  // e.g. 150 + 30 = 180mm
  const totalInsetM = totalInsetMm / 1000;

  // ── Calculate CLEAR SPAN (actual structure dimensions) ──
  // These are the dimensions the engineering uses for rafters, purlins, etc.
  const structWidth = brickWidth
    - (attachLeft ? totalInsetM : 0)
    - (attachRight ? totalInsetM : 0);
  const structDepth = brickDepth
    - (attachBack ? totalInsetM : 0)
    - (attachFront ? totalInsetM : 0);

  // Ensure non-negative
  const safeStructWidth = Math.max(structWidth, 0.5);
  const safeStructDepth = Math.max(structDepth, 0.5);

  const W = 640, H = 520;
  const margin = { top: 55, right: 55, bottom: 80, left: 80 };
  const drawW = W - margin.left - margin.right;
  const drawH = H - margin.top - margin.bottom;

  // Scale based on BRICK WALL dimensions (the outer envelope)
  const totalW = brickWidth + 3.0;
  const totalD = brickDepth + 2.5;
  const sc = Math.min(drawW / totalW, drawH / totalD) * 0.85;

  const brickW_px = brickWidth * sc;
  const brickD_px = brickDepth * sc;
  const structW_px = safeStructWidth * sc;
  const structD_px = safeStructDepth * sc;

  // Position brick wall
  const brickX = margin.left + 1.5 * sc;
  const brickY = margin.top + 1.0 * sc;

  // Structure is inset inside brick wall
  const structX = brickX + (attachLeft ? totalInsetM * sc : 0);
  const structY = brickY + (attachBack ? totalInsetM * sc : 0);

  const dimCol = '#6b7090';
  const houseCol = '#888';
  const houseFill = 'rgba(136,136,136,0.06)';
  const houseWallFill = 'rgba(136,136,136,0.12)';
  const structCol = '#c9a84c';
  const structFill = 'rgba(201,168,76,0.08)';
  const postCol = '#8bc34a';
  const connCol = '#2196f3';
  const rafterCol = '#c9a84c';
  const textCol = '#c8cce0';
  const insetCol = '#ff9800';
  const mono = 'DM Mono,monospace';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="background:transparent;max-width:100%;">`;

  // Title
  const attachLabel = attachBack && attachLeft && attachRight ? '3-SIDE ATTACHED' :
                       attachBack && attachLeft ? '2-SIDE (Back+Left)' :
                       attachBack && attachRight ? '2-SIDE (Back+Right)' :
                       attachBack ? 'BACK ATTACHED' :
                       attachLeft ? 'LEFT ATTACHED' :
                       attachRight ? 'RIGHT ATTACHED' : 'FREESTANDING';
  svg += `<text x="${W / 2}" y="24" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="12" font-weight="bold">PLAN VIEW · ${attachLabel}</text>`;
  svg += `<text x="${W / 2}" y="40" text-anchor="middle" fill="${dimCol}" font-family="${mono}" font-size="9">Brick Wall: ${brickWidth.toFixed(2)}m × ${brickDepth.toFixed(2)}m · Clear Span: ${safeStructWidth.toFixed(3)}m × ${safeStructDepth.toFixed(3)}m</text>`;

  // ── BRICK WALL OUTLINE (measured on site) ──
  // Draw as light dotted rectangle showing the full measured envelope
  svg += `<rect x="${brickX}" y="${brickY}" width="${brickW_px}" height="${brickD_px}" fill="${houseFill}" stroke="${houseCol}" stroke-width="1" stroke-dasharray="6,3"/>`;
  if (showLabels) {
    svg += `<text x="${brickX + 10}" y="${brickY + 16}" fill="${houseCol}" font-family="${mono}" font-size="8">BRICK WALL ENVELOPE</text>`;
    svg += `<text x="${brickX + 10}" y="${brickY + 28}" fill="${houseCol}" font-family="${mono}" font-size="7">(site measure)</text>`;
  }

  // ── INSET DIMENSION LINES (showing standoff + fascia) ──
  if (showDims && (attachBack || attachLeft || attachRight || attachFront)) {
    const insetText = `${totalInsetMm}mm inset`;
    if (attachBack) {
      svg += `<line x1="${brickX}" y1="${brickY + totalInsetM * sc / 2}" x2="${brickX + brickW_px}" y2="${brickY + totalInsetM * sc / 2}" stroke="${insetCol}" stroke-width="0.3" stroke-dasharray="2,2"/>`;
      svg += `<text x="${brickX + brickW_px + 4}" y="${brickY + totalInsetM * sc / 2 + 3}" fill="${insetCol}" font-family="${mono}" font-size="7">${insetText}</text>`;
    }
    if (attachLeft) {
      svg += `<line x1="${brickX + totalInsetM * sc / 2}" y1="${brickY}" x2="${brickX + totalInsetM * sc /  2}" y2="${brickY + brickD_px}" stroke="${insetCol}" stroke-width="0.3" stroke-dasharray="2,2"/>`;
      svg += `<text x="${brickX + totalInsetM * sc / 2}" y="${brickY - 4}" text-anchor="middle" fill="${insetCol}" font-family="${mono}" font-size="7">${insetText}</text>`;
    }
  }

  // ── HOUSE WALLS (solid lines on attached sides) ──
  // Back wall
  if (attachBack) {
    const backOffsetPx = (backOffsetMm / 1000) * sc;
    const wallStartY = brickY;
    const wallEndY = brickY + brickD_px - backOffsetPx;
    svg += `<line x1="${brickX}" y1="${wallStartY}" x2="${brickX + brickW_px}" y2="${wallStartY}" stroke="${houseCol}" stroke-width="3"/>`;
    svg += `<rect x="${brickX}" y="${wallStartY}" width="${brickW_px}" height="${Math.max(totalInsetM * sc, 6)}" fill="${houseWallFill}" stroke="none"/>`;
    if (backOffsetPx > 2) {
      svg += `<line x1="${brickX + brickW_px - 20}" y1="${wallEndY}" x2="${brickX + brickW_px}" y2="${wallEndY}" stroke="${houseCol}" stroke-width="3"/>`;
      svg += `<line x1="${brickX}" y1="${wallEndY}" x2="${brickX + 20}" y2="${wallEndY}" stroke="${houseCol}" stroke-width="3"/>`;
      // Offset indicator
      svg += `<line x1="${brickX + brickW_px + 12}" y1="${wallEndY}" x2="${brickX + brickW_px + 12}" y2="${brickY + brickD_px}" stroke="#f44336" stroke-width="0.5" stroke-dasharray="3,2"/>`;
      svg += `<text x="${brickX + brickW_px + 16}" y="${(wallEndY + brickY + brickD_px) / 2 + 3}" fill="#f44336" font-family="${mono}" font-size="8" font-weight="bold" transform="rotate(90 ${brickX + brickW_px + 16} ${(wallEndY + brickY + brickD_px) / 2})">${backOffsetMm}mm</text>`;
    }
    if (showLabels) {
      svg += `<text x="${brickX + brickW_px / 2}" y="${wallStartY - 8}" text-anchor="middle" fill="${houseCol}" font-family="${mono}" font-size="9" font-weight="bold">BACK WALL</text>`;
    }
  }

  // Left wall
  if (attachLeft) {
    const leftOffsetPx = (leftOffsetMm / 1000) * sc;
    const wallStartX = brickX;
    const wallEndX = brickX + brickW_px - leftOffsetPx;
    svg += `<line x1="${wallStartX}" y1="${brickY}" x2="${wallStartX}" y2="${brickY + brickD_px}" stroke="${houseCol}" stroke-width="3"/>`;
    svg += `<rect x="${wallStartX}" y="${brickY}" width="${Math.max(totalInsetM * sc, 6)}" height="${brickD_px}" fill="${houseWallFill}" stroke="none"/>`;
    if (leftOffsetPx > 2) {
      svg += `<line x1="${wallEndX}" y1="${brickY + brickD_px - 20}" x2="${wallEndX}" y2="${brickY + brickD_px}" stroke="${houseCol}" stroke-width="3"/>`;
      svg += `<line x1="${wallEndX}" y1="${brickY}" x2="${wallEndX}" y2="${brickY + 20}" stroke="${houseCol}" stroke-width="3"/>`;
      svg += `<line x1="${wallEndX}" y1="${brickY + brickD_px + 12}" x2="${brickX + brickW_px}" y2="${brickY + brickD_px + 12}" stroke="#f44336" stroke-width="0.5" stroke-dasharray="3,2"/>`;
      svg += `<text x="${(wallEndX + brickX + brickW_px) / 2}" y="${brickY + brickD_px + 24}" text-anchor="middle" fill="#f44336" font-family="${mono}" font-size="8" font-weight="bold">${leftOffsetMm}mm</text>`;
    }
    if (showLabels) {
      svg += `<text x="${wallStartX - 8}" y="${brickY + brickD_px / 2}" text-anchor="end" fill="${houseCol}" font-family="${mono}" font-size="9" font-weight="bold" transform="rotate(-90 ${wallStartX - 8} ${brickY + brickD_px / 2})">LEFT WALL</text>`;
    }
  }

  // Right wall
  if (attachRight) {
    const rightOffsetPx = (rightOffsetMm / 1000) * sc;
    const wallStartX = brickX + brickW_px;
    const wallEndX = brickX + rightOffsetPx; // offset from left? No, offset from front
    // Right wall goes from back (brickY) down to (brickY + brickD_px - rightOffsetPx)
    const wallStopY = brickY + brickD_px - rightOffsetPx;
    svg += `<line x1="${wallStartX}" y1="${brickY}" x2="${wallStartX}" y2="${wallStopY}" stroke="${houseCol}" stroke-width="3"/>`;
    svg += `<rect x="${wallStartX - Math.max(totalInsetM * sc, 6)}" y="${brickY}" width="${Math.max(totalInsetM * sc, 6)}" height="${wallStopY - brickY}" fill="${houseWallFill}" stroke="none"/>`;
    if (rightOffsetPx > 2) {
      svg += `<line x1="${wallStartX}" y1="${wallStopY}" x2="${wallStartX - 20}" y2="${wallStopY}" stroke="${houseCol}" stroke-width="3"/>`;
      svg += `<line x1="${wallStartX}" y1="${wallStopY}" x2="${wallStartX}" y2="${wallStopY + 20}" stroke="${houseCol}" stroke-width="3"/>`;
      // Offset dimension
      svg += `<line x1="${wallStartX + 12}" y1="${wallStopY}" x2="${wallStartX + 12}" y2="${brickY + brickD_px}" stroke="#f44336" stroke-width="0.5" stroke-dasharray="3,2"/>`;
      svg += `<line x1="${wallStartX}" y1="${wallStopY}" x2="${wallStartX + 16}" y2="${wallStopY}" stroke="#f44336" stroke-width="0.5"/>`;
      svg += `<line x1="${wallStartX}" y1="${brickY + brickD_px}" x2="${wallStartX + 16}" y2="${brickY + brickD_px}" stroke="#f44336" stroke-width="0.5"/>`;
      svg += `<text x="${wallStartX + 18}" y="${(wallStopY + brickY + brickD_px) / 2 + 3}" fill="#f44336" font-family="${mono}" font-size="8" font-weight="bold" transform="rotate(90 ${wallStartX + 18} ${(wallStopY + brickY + brickD_px) / 2})">${rightOffsetMm}mm OFFSET</text>`;
    }
    if (showLabels) {
      svg += `<text x="${wallStartX + 8}" y="${brickY + (wallStopY - brickY) / 2}" text-anchor="start" fill="${houseCol}" font-family="${mono}" font-size="9" font-weight="bold" transform="rotate(90 ${wallStartX + 8} ${brickY + (wallStopY - brickY) / 2})">RIGHT WALL</text>`;
    }
  }

  // Front wall
  if (attachFront) {
    svg += `<line x1="${brickX}" y1="${brickY + brickD_px}" x2="${brickX + brickW_px}" y2="${brickY + brickD_px}" stroke="${houseCol}" stroke-width="3"/>`;
    svg += `<rect x="${brickX}" y="${brickY + brickD_px - Math.max(totalInsetM * sc, 6)}" width="${brickW_px}" height="${Math.max(totalInsetM * sc, 6)}" fill="${houseWallFill}" stroke="none"/>`;
    if (showLabels) {
      svg += `<text x="${brickX + brickW_px / 2}" y="${brickY + brickD_px + 14}" text-anchor="middle" fill="${houseCol}" font-family="${mono}" font-size="9" font-weight="bold">FRONT WALL</text>`;
    }
  }

  // ── STRUCTURE FOOTPRINT (clear span) ──
  svg += `<rect x="${structX}" y="${structY}" width="${structW_px}" height="${structD_px}" fill="${structFill}" stroke="${structCol}" stroke-width="2.5" stroke-dasharray="5,3"/>`;
  svg += `<rect x="${structX + 3}" y="${structY + 3}" width="${structW_px - 6}" height="${structD_px - 6}" fill="none" stroke="${structCol}" stroke-width="0.5" stroke-dasharray="2,2"/>`;
  if (showLabels) {
    svg += `<text x="${structX + structW_px / 2}" y="${structY + structD_px / 2}" text-anchor="middle" fill="${structCol}" font-family="${mono}" font-size="10" font-weight="bold" opacity="0.4">STRUCTURE</text>`;
    svg += `<text x="${structX + structW_px / 2}" y="${structY + structD_px / 2 + 12}" text-anchor="middle" fill="${structCol}" font-family="${mono}" font-size="8" opacity="0.4">${safeStructWidth.toFixed(3)}m × ${safeStructDepth.toFixed(3)}m</text>`;
  }

  // ── PORTAL FRAME LINES (rafters) ──
  const frameSpacing = structD_px / (portalFrameCount - 1);
  for (let i = 0; i < portalFrameCount; i++) {
    const fy = structY + i * frameSpacing;
    svg += `<line x1="${structX}" y1="${fy}" x2="${structX + structW_px}" y2="${fy}" stroke="${rafterCol}" stroke-width="1.5"/>`;
    if (showLabels && (i === 0 || i === portalFrameCount - 1)) {
      svg += `<text x="${structX - 20}" y="${fy + 3}" text-anchor="end" fill="${dimCol}" font-family="${mono}" font-size="8">F${i + 1}</text>`;
    }
  }

  // ── POSTS & CONNECTIONS ──
  const postSize = 10;
  const postHalf = postSize / 2;
  const bracketW = 16;
  const bracketH = 10;

  if (showPosts) {
    // Determine free corners
    const backFree = !attachBack;
    const leftFree = !attachLeft;
    const rightFree = !attachRight;
    const frontFree = !attachFront;

    // STANDALONE COLUMNS (only at corners where BOTH adjacent edges are free)
    // Back-Left corner
    if (backFree && leftFree) {
      svg += `<rect x="${structX - postHalf}" y="${structY - postHalf}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="#fff" stroke-width="1.5"/>`;
      svg += `<circle cx="${structX}" cy="${structY}" r="14" fill="none" stroke="${postCol}" stroke-width="1" stroke-dasharray="2,2"/>`;
    }
    // Back-Right corner
    if (backFree && rightFree) {
      svg += `<rect x="${structX + structW_px - postHalf}" y="${structY - postHalf}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="#fff" stroke-width="1.5"/>`;
      svg += `<circle cx="${structX + structW_px}" cy="${structY}" r="14" fill="none" stroke="${postCol}" stroke-width="1" stroke-dasharray="2,2"/>`;
    }
    // Front-Left corner
    if (frontFree && leftFree) {
      svg += `<rect x="${structX - postHalf}" y="${structY + structD_px - postHalf}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="#fff" stroke-width="1.5"/>`;
      svg += `<circle cx="${structX}" cy="${structY + structD_px}" r="14" fill="none" stroke="${postCol}" stroke-width="1" stroke-dasharray="2,2"/>`;
    }
    // Front-Right corner — THE STANDALONE COLUMN (when right wall is offset)
    if (frontFree && rightFree) {
      svg += `<rect x="${structX + structW_px - postHalf}" y="${structY + structD_px - postHalf}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="#fff" stroke-width="1.5"/>`;
      svg += `<circle cx="${structX + structW_px}" cy="${structY + structD_px}" r="16" fill="none" stroke="#f44336" stroke-width="1.5" stroke-dasharray="3,2"/>`;
      if (showLabels) {
        svg += `<text x="${structX + structW_px + 18}" y="${structY + structD_px + 4}" fill="#f44336" font-family="${mono}" font-size="9" font-weight="bold">STANDALONE COLUMN</text>`;
        svg += `<text x="${structX + structW_px + 18}" y="${structY + structD_px + 16}" fill="#f44336" font-family="${mono}" font-size="8">concrete pad + base plate</text>`;
      }
    }

    // FASCIA BRACKETS on attached edges (NOT standalone columns)
    // Back edge brackets
    if (attachBack) {
      for (let i = 0; i < portalFrameCount; i++) {
        const fx = structX + i * (structW_px / (portalFrameCount - 1));
        svg += `<rect x="${fx - bracketW / 2}" y="${structY - bracketH}" width="${bracketW}" height="${bracketH}" fill="${connCol}" stroke="#fff" stroke-width="0.5" rx="1"/>`;
        svg += `<line x1="${fx}" y1="${structY - bracketH}" x2="${fx}" y2="${structY}" stroke="${connCol}" stroke-width="0.5" stroke-dasharray="2,2"/>`;
      }
      if (showLabels) {
        svg += `<text x="${structX + structW_px / 2}" y="${structY - bracketH - 4}" text-anchor="middle" fill="${connCol}" font-family="${mono}" font-size="8" font-weight="bold">FASCIA BRACKETS @ ${standoffMm}mm</text>`;
      }
    }

    // Left edge brackets
    if (attachLeft) {
      for (let i = 0; i < portalFrameCount; i++) {
        const fy = structY + i * frameSpacing;
        svg += `<rect x="${structX - bracketH}" y="${fy - bracketW / 2}" width="${bracketH}" height="${bracketW}" fill="${connCol}" stroke="#fff" stroke-width="0.5" rx="1"/>`;
        svg += `<line x1="${structX - bracketH}" y1="${fy}" x2="${structX}" y2="${fy}" stroke="${connCol}" stroke-width="0.5" stroke-dasharray="2,2"/>`;
      }
      if (showLabels) {
        svg += `<text x="${structX - bracketH - 4}" y="${structY + structD_px / 2}" text-anchor="end" fill="${connCol}" font-family="${mono}" font-size="8" font-weight="bold" transform="rotate(-90 ${structX - bracketH - 4} ${structY + structD_px / 2})">FASCIA BRACKETS</text>`;
      }
    }

    // Right edge brackets (only up to the offset point!)
    if (attachRight) {
      const rightWallStopY = brickY + brickD_px - (rightOffsetMm / 1000) * sc;
      const bracketCount = Math.max(1, Math.floor((rightWallStopY - structY) / frameSpacing));
      for (let i = 0; i <= bracketCount; i++) {
        const fy = structY + i * frameSpacing;
        if (fy <= rightWallStopY + 2) {
          svg += `<rect x="${structX + structW_px}" y="${fy - bracketW / 2}" width="${bracketH}" height="${bracketW}" fill="${connCol}" stroke="#fff" stroke-width="0.5" rx="1"/>`;
          svg += `<line x1="${structX + structW_px}" y1="${fy}" x2="${structX + structW_px + bracketH}" y2="${fy}" stroke="${connCol}" stroke-width="0.5" stroke-dasharray="2,2"/>`;
        }
      }
      if (showLabels) {
        svg += `<text x="${structX + structW_px + bracketH + 4}" y="${(structY + rightWallStopY) / 2}" text-anchor="start" fill="${connCol}" font-family="${mono}" font-size="8" font-weight="bold" transform="rotate(90 ${structX + structW_px + bracketH + 4} ${(structY + rightWallStopY) / 2})">FASCIA BRACKETS</text>`;
      }
    }

    // Front edge columns (if front is free)
    if (frontFree) {
      for (let i = 0; i < portalFrameCount; i++) {
        const fx = structX + i * (structW_px / (portalFrameCount - 1));
        svg += `<rect x="${fx - postHalf}" y="${structY + structD_px - postHalf}" width="${postSize}" height="${postSize}" fill="${postCol}" stroke="#fff" stroke-width="1.5"/>`;
      }
      if (showLabels) {
        svg += `<text x="${structX + structW_px / 2}" y="${structY + structD_px + 18}" text-anchor="middle" fill="${postCol}" font-family="${mono}" font-size="8" font-weight="bold">FRONT COLUMNS</text>`;
      }
    }
  }

  // ── PURLIN LINES ──
  if (showPurlins) {
    const nPurlins = Math.max(3, Math.floor(safeStructWidth / 0.8));
    for (let i = 1; i < nPurlins; i++) {
      const px = structX + (i / nPurlins) * structW_px;
      svg += `<line x1="${px}" y1="${structY}" x2="${px}" y2="${structY + structD_px}" stroke="${dimCol}" stroke-width="0.3" stroke-dasharray="2,3"/>`;
    }
  }

  // ── GABLE END INDICATORS ──
  if (isGable && showLabels) {
    svg += `<text x="${structX + structW_px / 2}" y="${structY - 10}" text-anchor="middle" fill="${structCol}" font-family="${mono}" font-size="8">▼ GABLE END (infill)</text>`;
    svg += `<text x="${structX + structW_px / 2}" y="${structY + structD_px + 14}" text-anchor="middle" fill="${structCol}" font-family="${mono}" font-size="8">▲ GABLE END (infill)</text>`;
  }

  // ── MEMBER LABELS ──
  if (showLabels) {
    const midX = structX + structW_px / 2;
    if (attachBack) svg += `<text x="${midX}" y="${structY + 14}" text-anchor="middle" fill="${rafterCol}" font-family="${mono}" font-size="8">LEDGER BEAM (attached)</text>`;
    if (attachLeft) svg += `<text x="${structX + 14}" y="${structY + structD_px / 2}" text-anchor="start" fill="${rafterCol}" font-family="${mono}" font-size="8" transform="rotate(90 ${structX + 14} ${structY + structD_px / 2})">LEDGER</text>`;
    if (attachRight) svg += `<text x="${structX + structW_px - 14}" y="${structY + structD_px / 2}" text-anchor="end" fill="${rafterCol}" font-family="${mono}" font-size="8" transform="rotate(90 ${structX + structW_px - 14} ${structY + structD_px / 2})">LEDGER</text>`;
    if (!attachFront) svg += `<text x="${midX}" y="${structY + structD_px - 8}" text-anchor="middle" fill="${rafterCol}" font-family="${mono}" font-size="8">FASCIA BEAM (free)</text>`;
  }

  // ── DIMENSIONS ──
  if (showDims) {
    // BRICK WALL width (outer measure)
    const dimTop = brickY - 30;
    svg += `<line x1="${brickX}" y1="${dimTop}" x2="${brickX + brickW_px}" y2="${dimTop}" stroke="${houseCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${brickX}" y1="${brickY - 3}" x2="${brickX}" y2="${dimTop + 3}" stroke="${houseCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${brickX + brickW_px}" y1="${brickY - 3}" x2="${brickX + brickW_px}" y2="${dimTop + 3}" stroke="${houseCol}" stroke-width="0.5"/>`;
    svg += `<text x="${brickX + brickW_px / 2}" y="${dimTop - 4}" text-anchor="middle" fill="${houseCol}" font-family="${mono}" font-size="9" font-weight="bold">${brickWidth.toFixed(2)}m BRICK WALL</text>`;

    // BRICK WALL depth
    const dimLeft = brickX - 30;
    svg += `<line x1="${dimLeft}" y1="${brickY}" x2="${dimLeft}" y2="${brickY + brickD_px}" stroke="${houseCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${brickX - 3}" y1="${brickY}" x2="${dimLeft + 3}" y2="${brickY}" stroke="${houseCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${brickX - 3}" y1="${brickY + brickD_px}" x2="${dimLeft + 3}" y2="${brickY + brickD_px}" stroke="${houseCol}" stroke-width="0.5"/>`;
    svg += `<text x="${dimLeft - 4}" y="${brickY + brickD_px / 2 + 3}" text-anchor="end" fill="${houseCol}" font-family="${mono}" font-size="9" font-weight="bold" transform="rotate(-90 ${dimLeft - 4} ${brickY + brickD_px / 2})">${brickDepth.toFixed(2)}m</text>`;

    // CLEAR SPAN width (structure)
    const dimStructTop = structY - 18;
    svg += `<line x1="${structX}" y1="${dimStructTop}" x2="${structX + structW_px}" y2="${dimStructTop}" stroke="${structCol}" stroke-width="0.5" stroke-dasharray="3,2"/>`;
    svg += `<line x1="${structX}" y1="${structY - 3}" x2="${structX}" y2="${dimStructTop + 3}" stroke="${structCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${structX + structW_px}" y1="${structY - 3}" x2="${structX + structW_px}" y2="${dimStructTop + 3}" stroke="${structCol}" stroke-width="0.5"/>`;
    svg += `<text x="${structX + structW_px / 2}" y="${dimStructTop - 4}" text-anchor="middle" fill="${structCol}" font-family="${mono}" font-size="9" font-weight="bold">CLEAR SPAN ${safeStructWidth.toFixed(3)}m</text>`;

    // CLEAR SPAN depth
    const dimStructLeft = structX - 22;
    svg += `<line x1="${dimStructLeft}" y1="${structY}" x2="${dimStructLeft}" y2="${structY + structD_px}" stroke="${structCol}" stroke-width="0.5" stroke-dasharray="3,2"/>`;
    svg += `<line x1="${structX - 3}" y1="${structY}" x2="${dimStructLeft + 3}" y2="${structY}" stroke="${structCol}" stroke-width="0.5"/>`;
    svg += `<line x1="${structX - 3}" y1="${structY + structD_px}" x2="${dimStructLeft + 3}" y2="${structY + structD_px}" stroke="${structCol}" stroke-width="0.5"/>`;
    svg += `<text x="${dimStructLeft - 4}" y="${structY + structD_px / 2 + 3}" text-anchor="end" fill="${structCol}" font-family="${mono}" font-size="9" font-weight="bold" transform="rotate(-90 ${dimStructLeft - 4} ${structY + structD_px / 2})">${safeStructDepth.toFixed(3)}m</text>`;
  }

  // ── LEGEND ──
  if (showLabels) {
    const legX = W - 155;
    const legY = H - 110;
    svg += `<rect x="${legX}" y="${legY}" width="145" height="98" rx="3" fill="rgba(30,30,40,0.7)" stroke="${dimCol}" stroke-width="0.5"/>`;
    svg += `<text x="${legX + 72}" y="${legY + 12}" text-anchor="middle" fill="${textCol}" font-family="${mono}" font-size="9" font-weight="bold">LEGEND</text>`;

    svg += `<rect x="${legX + 8}" y="${legY + 20}" width="8" height="8" fill="${postCol}" stroke="#fff" stroke-width="1"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 27}" fill="${dimCol}" font-family="${mono}" font-size="8">Standalone Column</text>`;

    svg += `<rect x="${legX + 8}" y="${legY + 34}" width="10" height="6" fill="${connCol}" stroke="#fff" stroke-width="0.5" rx="1"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 40}" fill="${dimCol}" font-family="${mono}" font-size="8">Fascia Bracket</text>`;

    svg += `<line x1="${legX + 8}" y1="${legY + 52}" x2="${legX + 18}" y2="${legY + 52}" stroke="${rafterCol}" stroke-width="2"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 56}" fill="${dimCol}" font-family="${mono}" font-size="8">Rafter / Beam</text>`;

    svg += `<line x1="${legX + 8}" y1="${legY + 66}" x2="${legX + 18}" y2="${legY + 66}" stroke="${dimCol}" stroke-width="0.5" stroke-dasharray="2,3"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 70}" fill="${dimCol}" font-family="${mono}" font-size="8">Purlin</text>`;

    svg += `<circle cx="${legX + 13}" cy="${legY + 82}" r="5" fill="none" stroke="#f44336" stroke-width="1" stroke-dasharray="2,2"/>`;
    svg += `<text x="${legX + 22}" y="${legY + 86}" fill="${dimCol}" font-family="${mono}" font-size="8">Free Corner</text>`;
  }

  svg += '</svg>';
  return svg;
}
