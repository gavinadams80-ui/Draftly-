// ── Building Layout & Roof Geometry Drawing Engine ──
// Generates plan view SVG and roof pitch "Y diagram"

// ── Roof Geometry Diagram — side view cross-section ──
export function generateRoofGeometrySVG(
  span: number,              // m — brick-to-brick gable span
  pitch: number,             // degrees
  height: number,            // m — eave/wall height
  isGable: boolean,
  rafterSize?: string | null,       // section designation from engineering
  bottomChordSize?: string | null,  // section designation for bottom chord
  standoff: number = 0,     // m — standoff each side; actual frame = span − 2×standoff
): string {
  const W = 580, H = 390;
  const margin = { top: 55, right: 135, bottom: 90, left: 65 };
  const drawW = W - margin.left - margin.right;
  const drawH = H - margin.top - margin.bottom;

  // Actual structural span (frame is inset by standoff on each side)
  const actualSpan = Math.max(0.1, span - 2 * standoff);
  const rise       = (actualSpan / 2) * Math.tan(pitch * Math.PI / 180);
  const rafterLen  = Math.sqrt(Math.pow(actualSpan / 2, 2) + Math.pow(rise, 2));

  const sc   = Math.min(drawW / actualSpan, drawH / Math.max(rise, 0.5)) * 0.82;
  const triW = actualSpan * sc;
  const triH = rise * sc;

  const baseY  = margin.top + drawH;
  const leftX  = margin.left + (drawW - triW) / 2;
  const rightX = leftX + triW;
  const apexX  = leftX + triW / 2;
  const apexY  = baseY - triH;

  const dimCol     = '#6b7090';
  const frameCol   = '#c9a84c';
  const rafterCol  = '#8bc34a';
  const chordCol   = '#e07030';  // distinct colour for bottom chord
  const textCol    = '#c8cce0';
  const mono       = 'DM Mono,monospace';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">`;
  svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;

  svg += `<text x="${W / 2}" y="16" text-anchor="middle" font-family="${mono}" font-size="11" fill="${textCol}" font-weight="600">ROOF GEOMETRY · ${isGable ? 'GABLE' : 'SKILLION'} · ${pitch}°  PITCH  —  SIDE VIEW</text>`;

  if (isGable) {
    const pitchRad = pitch * Math.PI / 180;

    // ── Structure lines ──
    svg += `<line x1="${leftX}"  y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="${rafterCol}" stroke-width="2.5"/>`;
    svg += `<line x1="${rightX}" y1="${baseY}" x2="${apexX}" y2="${apexY}" stroke="${rafterCol}" stroke-width="2.5"/>`;
    svg += `<line x1="${leftX}"  y1="${baseY}" x2="${rightX}" y2="${baseY}" stroke="${chordCol}"  stroke-width="2.5"/>`;
    // Centre rise line (dashed reference)
    svg += `<line x1="${apexX}" y1="${apexY}" x2="${apexX}" y2="${baseY}" stroke="${dimCol}" stroke-width="0.6" stroke-dasharray="4,3"/>`;

    // ── RIDGE at apex — label raised clear of dimension tick ──
    svg += `<circle cx="${apexX}" cy="${apexY}" r="4" fill="${rafterCol}" opacity="0.9"/>`;
    svg += `<text x="${apexX}" y="${apexY - 24}" text-anchor="middle" font-family="${mono}" font-size="8.5" fill="${rafterCol}" font-weight="600">RIDGE</text>`;
    // Dotted leader from label down to apex node
    svg += `<line x1="${apexX}" y1="${apexY - 19}" x2="${apexX}" y2="${apexY - 5}" stroke="${rafterCol}" stroke-width="0.6" stroke-dasharray="2,2" opacity="0.6"/>`;

    // ── POST markers ──
    svg += `<circle cx="${leftX}"  cy="${baseY}" r="5" fill="${frameCol}" opacity="0.9"/>`;
    svg += `<circle cx="${rightX}" cy="${baseY}" r="5" fill="${frameCol}" opacity="0.9"/>`;

    // ── Pitch angle arcs — below baseline so they don't clash with rafter labels ──
    const arcR = 26;
    const arcPath = (cx: number, sweep: number) => {
      const endX = cx + (sweep === 0 ? arcR : -arcR) * Math.cos(pitchRad);
      const endY = baseY + arcR * Math.sin(pitchRad);
      return `M ${cx + (sweep === 0 ? arcR : -arcR)},${baseY} A ${arcR},${arcR} 0 0 ${sweep} ${endX},${endY}`;
    };
    svg += `<path d="${arcPath(leftX, 0)}"  fill="none" stroke="${dimCol}" stroke-width="0.8"/>`;
    svg += `<path d="${arcPath(rightX, 1)}" fill="none" stroke="${dimCol}" stroke-width="0.8"/>`;
    // Angle labels: below the baseline, inside the arc, not near the rafter
    svg += `<text x="${leftX  + 32}" y="${baseY + 20}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${dimCol}">${pitch}°</text>`;
    svg += `<text x="${rightX - 32}" y="${baseY + 20}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${dimCol}">${pitch}°</text>`;

    // ── RAFTER section label — right side, leader to right rafter midpoint ──
    const rafterMidY = (baseY + apexY) / 2;
    const rightRafterMidX = (rightX + apexX) / 2;
    if (rafterSize) {
      svg += `<text x="${rightX + 6}" y="${rafterMidY - 18}" text-anchor="start" font-family="${mono}" font-size="7.5" fill="${rafterCol}" font-weight="600">RAFTER</text>`;
      svg += `<text x="${rightX + 6}" y="${rafterMidY - 6}" text-anchor="start" font-family="${mono}" font-size="7" fill="${rafterCol}">[${rafterSize}]</text>`;
      svg += `<line x1="${rightX + 5}" y1="${rafterMidY - 9}" x2="${rightRafterMidX}" y2="${rafterMidY}" stroke="${rafterCol}" stroke-width="0.6" stroke-dasharray="2,2" opacity="0.6"/>`;
    } else {
      svg += `<text x="${rightX + 6}" y="${rafterMidY - 6}" text-anchor="start" font-family="${mono}" font-size="7.5" fill="${rafterCol}" font-weight="600">RAFTER</text>`;
      svg += `<line x1="${rightX + 5}" y1="${rafterMidY - 3}" x2="${rightRafterMidX}" y2="${rafterMidY}" stroke="${rafterCol}" stroke-width="0.6" stroke-dasharray="2,2" opacity="0.6"/>`;
    }

    // ── RAFTER dimension line — offset along left rafter leg ──
    // CW perpendicular of rafter direction = outward (upper-left) from the triangle
    const rdx = apexX - leftX, rdy = apexY - baseY;
    const rLen = Math.sqrt(rdx * rdx + rdy * rdy);
    const ux = rdx / rLen, uy = rdy / rLen;
    const offDist = 16; // px offset from rafter line
    const ox = uy * offDist;   // CW perp x = uy
    const oy = -ux * offDist;  // CW perp y = -ux
    // Dimension line parallel to rafter, offset outward
    svg += `<line x1="${leftX + ox}" y1="${baseY + oy}" x2="${apexX + ox}" y2="${apexY + oy}" stroke="${rafterCol}" stroke-width="0.8"/>`;
    // End ticks (perpendicular to rafter, at each node)
    svg += `<line x1="${leftX}" y1="${baseY}" x2="${leftX + ox * 1.6}" y2="${baseY + oy * 1.6}" stroke="${rafterCol}" stroke-width="0.8"/>`;
    svg += `<line x1="${apexX}" y1="${apexY}" x2="${apexX + ox * 1.6}" y2="${apexY + oy * 1.6}" stroke="${rafterCol}" stroke-width="0.8"/>`;
    // Length label along dimension line (rotated at pitch, offset further out)
    const dmX = (leftX + apexX) / 2 + ox * 1.4;
    const dmY = (baseY + apexY) / 2 + oy * 1.4;
    svg += `<text x="${dmX}" y="${dmY}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${rafterCol}" font-weight="600" transform="rotate(-${pitch},${dmX},${dmY})">${rafterLen.toFixed(3)}m</text>`;

    // ── BOTTOM CORD — to the left outside triangle with leader to chord ──
    const bcLabelX = leftX - 6;
    const bcLabelY = baseY + 6;
    svg += `<text x="${bcLabelX}" y="${bcLabelY}" text-anchor="end" font-family="${mono}" font-size="8" fill="${chordCol}" font-weight="600">BOTTOM CORD</text>`;
    if (bottomChordSize) {
      svg += `<text x="${bcLabelX}" y="${bcLabelY + 13}" text-anchor="end" font-family="${mono}" font-size="7.5" fill="${chordCol}">[${bottomChordSize}]</text>`;
    }
    // Leader from label to left end of bottom chord
    svg += `<line x1="${leftX}" y1="${baseY}" x2="${bcLabelX + 4}" y2="${bcLabelY - 4}" stroke="${chordCol}" stroke-width="0.6" stroke-dasharray="2,2" opacity="0.65"/>`;

    // ── POST labels — below baseline, left and right ──
    svg += `<text x="${leftX  - 2}" y="${baseY + 35}" text-anchor="middle" font-family="${mono}" font-size="6.5" fill="${frameCol}">COLUMN /</text>`;
    svg += `<text x="${leftX  - 2}" y="${baseY + 45}" text-anchor="middle" font-family="${mono}" font-size="6.5" fill="${frameCol}">STANDOFF</text>`;
    svg += `<text x="${rightX + 2}" y="${baseY + 35}" text-anchor="middle" font-family="${mono}" font-size="6.5" fill="${frameCol}">COLUMN /</text>`;
    svg += `<text x="${rightX + 2}" y="${baseY + 45}" text-anchor="middle" font-family="${mono}" font-size="6.5" fill="${frameCol}">STANDOFF</text>`;

    // ── Rise dimension (right of centre line) ──
    const dimRX = apexX + 12;
    svg += `<line x1="${dimRX}" y1="${apexY}" x2="${dimRX}" y2="${baseY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${dimRX - 3}" y1="${apexY}" x2="${dimRX + 3}" y2="${apexY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${dimRX - 3}" y1="${baseY}"  x2="${dimRX + 3}" y2="${baseY}"  stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<text x="${dimRX + 5}" y="${(apexY + baseY) / 2 + 3}" font-family="${mono}" font-size="7.5" fill="${textCol}">RISE  ${rise.toFixed(3)}m</text>`;

    // ── Half-span under rafter ──
    svg += `<text x="${(leftX + apexX) / 2}" y="${baseY + 7}" text-anchor="middle" font-family="${mono}" font-size="6.5" fill="${dimCol}">${(actualSpan / 2).toFixed(2)}m</text>`;

    // ── Span dimension — below baseline ──
    const dimY = baseY + 42;
    svg += `<line x1="${leftX}"  y1="${dimY}" x2="${rightX}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${leftX}"  y1="${baseY + 8}" x2="${leftX}"  y2="${dimY}" stroke="${dimCol}" stroke-width="0.4" stroke-dasharray="2,3" opacity="0.5"/>`;
    svg += `<line x1="${rightX}" y1="${baseY + 8}" x2="${rightX}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.4" stroke-dasharray="2,3" opacity="0.5"/>`;
    svg += `<line x1="${leftX  - 4}" y1="${dimY}" x2="${leftX  + 4}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${rightX - 4}" y1="${dimY}" x2="${rightX + 4}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<text x="${apexX}" y="${dimY - 4}" text-anchor="middle" font-family="${mono}" font-size="8.5" fill="${textCol}" font-weight="600">SPAN  ${actualSpan.toFixed(2)}m  (structure)</text>`;

    // ── Stats panel (top right, inside right margin) ──
    const offsetNote = standoff > 0
      ? `${span.toFixed(2)}m − ${(standoff * 2 * 1000).toFixed(0)}mm = ${actualSpan.toFixed(2)}m`
      : null;
    const stats = [
      `Brick span:  ${span.toFixed(2)}m`,
      `Frame span:  ${actualSpan.toFixed(2)}m`,
      ...(offsetNote ? [`(${offsetNote})`] : []),
      `Rise:        ${rise.toFixed(3)}m`,
      `Rafter:      ${rafterLen.toFixed(3)}m`,
      `Pitch:       ${pitch}°`,
      `Gable H:     ${height.toFixed(2)}m`,
    ];
    stats.forEach((s, i) => {
      svg += `<text x="${W - 10}" y="${margin.top + 12 + i * 14}" text-anchor="end" font-family="${mono}" font-size="8" fill="${dimCol}">${s}</text>`;
    });

    // ── Engineering note — bottom chord / portal frame type ──
    const noteY = H - 34;
    svg += `<line x1="10" y1="${noteY - 8}" x2="${W - 10}" y2="${noteY - 8}" stroke="${dimCol}" stroke-width="0.4" opacity="0.35"/>`;
    svg += `<text x="12" y="${noteY + 3}" font-family="${mono}" font-size="6.5" fill="${chordCol}" font-weight="600">NOTE:</text>`;
    svg += `<text x="52" y="${noteY + 3}" font-family="${mono}" font-size="6.5" fill="${dimCol}">Bottom chord (tie beam) used at GABLE END portal frames only  →  TIED PORTAL FRAMES.</text>`;
    svg += `<text x="52" y="${noteY + 15}" font-family="${mono}" font-size="6.5" fill="${dimCol}">All intermediate portal frames: rafter only, no bottom chord  →  MOMENT PORTAL FRAMES (rigid portal).</text>`;

  } else {
    // ── Skillion (mono-pitch) — single slope over the FULL span ──
    // Rise is measured across the whole span (not half-span as for a gable),
    // so a skillion at the same pitch climbs roughly twice as high.
    const pitchRad     = pitch * Math.PI / 180;
    const riseSk       = actualSpan * Math.tan(pitchRad);
    const rafterLenSk  = Math.sqrt(actualSpan * actualSpan + riseSk * riseSk);
    const scSk         = Math.min(drawW / actualSpan, drawH / Math.max(riseSk, 0.5)) * 0.82;
    const triWSk       = actualSpan * scSk;
    const triHSk       = riseSk * scSk;
    const leftXSk      = margin.left + (drawW - triWSk) / 2;
    const rightXSk     = leftXSk + triWSk;
    const topYSk       = baseY - triHSk;   // high (left) eave
    const lowYSk       = baseY;            // low (right) eave

    // ── Structure lines ──
    svg += `<line x1="${leftXSk}"  y1="${topYSk}" x2="${rightXSk}" y2="${lowYSk}" stroke="${rafterCol}" stroke-width="2.5"/>`; // rafter
    svg += `<line x1="${leftXSk}"  y1="${lowYSk}" x2="${rightXSk}" y2="${lowYSk}" stroke="${chordCol}"  stroke-width="2.5"/>`; // tie / wall plate level
    svg += `<line x1="${leftXSk}"  y1="${topYSk}" x2="${leftXSk}"  y2="${lowYSk}" stroke="${frameCol}"  stroke-width="2"/>`;   // high-side upstand
    // High and low support markers
    svg += `<circle cx="${leftXSk}"  cy="${topYSk}" r="5" fill="${frameCol}" opacity="0.9"/>`;
    svg += `<circle cx="${leftXSk}"  cy="${lowYSk}" r="5" fill="${frameCol}" opacity="0.9"/>`;
    svg += `<circle cx="${rightXSk}" cy="${lowYSk}" r="5" fill="${frameCol}" opacity="0.9"/>`;

    // ── Pitch angle arc at the low (right) corner ──
    const arcR = 26;
    const aEndX = rightXSk - arcR * Math.cos(pitchRad);
    const aEndY = lowYSk - arcR * Math.sin(pitchRad);
    svg += `<path d="M ${rightXSk - arcR},${lowYSk} A ${arcR},${arcR} 0 0 1 ${aEndX},${aEndY}" fill="none" stroke="${dimCol}" stroke-width="0.8"/>`;
    svg += `<text x="${rightXSk - 34}" y="${lowYSk - 8}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${dimCol}">${pitch}°</text>`;

    // ── Eave labels ──
    svg += `<text x="${leftXSk}"  y="${topYSk - 8}" text-anchor="middle" font-family="${mono}" font-size="8.5" fill="${rafterCol}" font-weight="600">HIGH EAVE</text>`;
    svg += `<text x="${rightXSk + 4}" y="${lowYSk - 8}" text-anchor="start" font-family="${mono}" font-size="8.5" fill="${rafterCol}" font-weight="600">LOW EAVE</text>`;

    // ── Rafter length label (rotated along slope) ──
    const dmX = (leftXSk + rightXSk) / 2;
    const dmY = (topYSk + lowYSk) / 2 - 8;
    const slopeDeg = Math.atan2(lowYSk - topYSk, rightXSk - leftXSk) * 180 / Math.PI;
    svg += `<text x="${dmX}" y="${dmY}" text-anchor="middle" font-family="${mono}" font-size="8" fill="${rafterCol}" font-weight="600" transform="rotate(${slopeDeg},${dmX},${dmY})">${rafterLenSk.toFixed(3)}m</text>`;
    if (rafterSize) {
      svg += `<text x="${dmX}" y="${dmY + 12}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${rafterCol}" transform="rotate(${slopeDeg},${dmX},${dmY + 12})">[${rafterSize}]</text>`;
    }

    // ── Rise dimension (left of high upstand) ──
    const dimLX = leftXSk - 14;
    svg += `<line x1="${dimLX}" y1="${topYSk}" x2="${dimLX}" y2="${lowYSk}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${dimLX - 3}" y1="${topYSk}" x2="${dimLX + 3}" y2="${topYSk}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${dimLX - 3}" y1="${lowYSk}" x2="${dimLX + 3}" y2="${lowYSk}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<text x="${dimLX - 6}" y="${(topYSk + lowYSk) / 2}" text-anchor="middle" transform="rotate(-90,${dimLX - 6},${(topYSk + lowYSk) / 2})" font-family="${mono}" font-size="7.5" fill="${textCol}">RISE ${riseSk.toFixed(3)}m</text>`;

    // ── Span dimension (below) ──
    const dimY = lowYSk + 30;
    svg += `<line x1="${leftXSk}"  y1="${dimY}" x2="${rightXSk}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${leftXSk}"  y1="${dimY - 4}" x2="${leftXSk}"  y2="${dimY + 4}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<line x1="${rightXSk}" y1="${dimY - 4}" x2="${rightXSk}" y2="${dimY + 4}" stroke="${dimCol}" stroke-width="0.7"/>`;
    svg += `<text x="${(leftXSk + rightXSk) / 2}" y="${dimY - 4}" text-anchor="middle" font-family="${mono}" font-size="8.5" fill="${textCol}" font-weight="600">SPAN ${actualSpan.toFixed(2)}m · SKILLION ${pitch}°</text>`;

    // ── Stats panel ──
    const statsS = [
      `Brick span:  ${span.toFixed(2)}m`,
      `Frame span:  ${actualSpan.toFixed(2)}m`,
      `Rise:        ${riseSk.toFixed(3)}m`,
      `Rafter:      ${rafterLenSk.toFixed(3)}m`,
      `Pitch:       ${pitch}°`,
      `High wall:   ${(height + riseSk).toFixed(2)}m`,
      `Low wall:    ${height.toFixed(2)}m`,
    ];
    statsS.forEach((s, i) => {
      svg += `<text x="${W - 10}" y="${margin.top + 12 + i * 14}" text-anchor="end" font-family="${mono}" font-size="8" fill="${dimCol}">${s}</text>`;
    });

    // ── Engineering note ──
    const noteY = H - 34;
    svg += `<line x1="10" y1="${noteY - 8}" x2="${W - 10}" y2="${noteY - 8}" stroke="${dimCol}" stroke-width="0.4" opacity="0.35"/>`;
    svg += `<text x="12" y="${noteY + 3}" font-family="${mono}" font-size="6.5" fill="${chordCol}" font-weight="600">NOTE:</text>`;
    svg += `<text x="52" y="${noteY + 3}" font-family="${mono}" font-size="6.5" fill="${dimCol}">Mono-pitch (skillion): single rafter from high to low eave — no ridge, no bottom-chord tie.</text>`;
    svg += `<text x="52" y="${noteY + 15}" font-family="${mono}" font-size="6.5" fill="${dimCol}">Rise = span × tan(pitch). Fall drains to the LOW eave gutter; high eave flashes to wall/parapet.</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ── Building Plan View ──
// Portal frames: A-frames spanning L→R (gable span). Spaced along depth.
// Ridge: centre line top→bottom. Purlins: parallel to ridge, per side.
// Left/right side walls extend to their configured depth (setbacks supported).
// Frame inset from brick walls by standoff on all connected sides.
export function generateBuildingPlanSVG(
  width: number,               // m — gable span (brick to brick, L→R)
  depth: number,               // m — structure depth (house wall to front)
  _height: number,
  _pitch: number,
  attachment: string,          // 'freestanding' | 'attached' | 'three-side'
  portalFrameCount: number,
  isGable: boolean,
  standoff: number = 0.15,     // m — standoff from house fascia
  leftSetback: number  = 0,    // m — left wall stops this far from front (0 = full)
  rightSetback: number = 0,    // m — right wall stops this far from front
  _purlinSpacing: number = 1.35, // m — from engineering calc
  northRotation: number = 0,   // degrees clockwise — 0 = north is up
): string {
  const W = 700, H = 580;
  const mono = 'DM Mono,monospace';

  // ── Colours ──
  const dimCol      = '#6b7090';
  const houseCol    = '#9090a0';
  const houseFill   = 'rgba(120,120,140,0.12)';
  const structCol   = '#c9a84c';
  const structFill  = 'rgba(201,168,76,0.05)';
  const postCol     = '#8bc34a';
  const frameCol    = '#c9a84c';
  const ridgeCol    = '#e8c060';
  const purlinCol   = '#4a7090';
  const standoffCol = '#2196f3';
  const textCol     = '#c8cce0';

  // ── Wall depths ──
  const wallThick      = 0.35; // m — drawn wall band thickness
  const leftWallDepth  = Math.max(0, depth - leftSetback);
  const rightWallDepth = Math.max(0, depth - rightSetback);

  // ── Scale ──
  // Wide margins: left/right for wall+dims, top for title+dims, bottom for labels+legend
  const sideClear = (attachment === 'three-side') ? 0.4 : 0.7; // m beyond struct for wall band
  const margin    = { top: 60, right: 85, bottom: 140, left: 90 };
  const drawW     = W - margin.left - margin.right;
  const drawH     = H - margin.top  - margin.bottom;
  const totalW    = width  + sideClear * 2;
  const totalH    = wallThick + depth; // house wall + depth (standoff absorbed within depth)
  const sc        = Math.min(drawW / totalW, drawH / totalH) * 0.88;

  const wallT = wallThick * sc;
  const so    = standoff  * sc;

  // ── Key Y coords (top = house wall) ──
  const wallTopY   = margin.top;
  const wallBotY   = wallTopY + wallT;
  const frameTopY  = wallBotY + so;            // ledger line (standoff inset from back wall fascia)
  const frameBotY  = wallBotY + depth * sc;    // fascia line = depth measured from back wall fascia

  // ── Key X coords ──
  // structLeftX/RightX = inner face of brick walls = the 'width' measurement
  const structLeftX  = margin.left + sideClear * sc;
  const structRightX = structLeftX + width * sc;
  const houseLeftX   = structLeftX - sideClear * sc;
  const houseRightX  = structRightX + sideClear * sc;

  // Frame inset by standoff from each connected wall
  const frameLeftX  = (attachment !== 'freestanding') ? structLeftX  + so : structLeftX;
  const frameRightX = (attachment !== 'freestanding') ? structRightX - so : structRightX;
  const frameMidX   = (frameLeftX + frameRightX) / 2;
  const frameMidY   = (frameTopY  + frameBotY)   / 2;

  // Right wall ends at this Y (structure boundary on right is only to here)
  const rightWallEndY = frameTopY + rightWallDepth * sc;

  // ── Portal frame Y positions — span exactly from ledger (frameTopY) to fascia (frameBotY) ──
  const frameYs: number[] = [];
  const frameSpanPx = frameBotY - frameTopY;
  if (portalFrameCount === 1) {
    frameYs.push(frameMidY);
  } else {
    for (let i = 0; i < portalFrameCount; i++) {
      frameYs.push(frameTopY + (i / (portalFrameCount - 1)) * frameSpanPx);
    }
  }

  // ── Purlin X positions ──
  // P1 at 75mm from ridge; P2–P4 evenly between P1 and eave; EAVE at frame edge
  const halfSpanPx = frameMidX - frameLeftX;
  const halfSpanM  = halfSpanPx / sc;
  const nearRidge  = 0.075;
  const remain     = halfSpanM - nearRidge;
  const pStep      = remain / 4; // 3 interior + 1 eave = 4 intervals
  const purlinMs   = [nearRidge, nearRidge + pStep, nearRidge + pStep * 2, nearRidge + pStep * 3, halfSpanM];
  const purlinXsL  = purlinMs.map(m => frameMidX - (m / halfSpanM) * halfSpanPx);
  const purlinXsR  = purlinMs.map(m => frameMidX + (m / halfSpanM) * halfSpanPx);

  // ── Skillion purlins — a single continuous run across the full frame width ──
  // Mono-pitch has no ridge: purlins march evenly from the high-side eave to the
  // low-side eave. First line 75mm off the high eave, last line at the low eave.
  const skillionN  = 9;
  const skFrameW   = frameRightX - frameLeftX;
  const skNearM    = 0.075;
  const skFullM    = skFrameW / sc;
  const skStep     = (skFullM - skNearM) / (skillionN - 1);
  const skillionMs = Array.from({ length: skillionN }, (_, i) => skNearM + i * skStep);
  const skillionXs = skillionMs.map(m => frameLeftX + (m / skFullM) * skFrameW);

  // ── Connection counts ──
  const leftCount  = frameYs.filter(fy => (fy - frameTopY) / sc <= leftWallDepth  + 0.01).length;
  const rightCount = frameYs.filter(fy => (fy - frameTopY) / sc <= rightWallDepth + 0.01).length;
  const houseConns = leftCount + rightCount + (attachment !== 'freestanding' ? 1 : 0);
  const cornerPostCount = frameYs.filter(fy => attachment === 'three-side' && (fy - frameTopY) / sc > rightWallDepth + 0.01).length;

  // ── SVG start ──
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">`;
  svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;

  // Defs
  svg += `<defs>`;
  svg += `<pattern id="houseHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${houseCol}" stroke-width="1.5" opacity="0.4"/></pattern>`;
  svg += `<pattern id="structHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${structCol}" stroke-width="0.4" opacity="0.15"/></pattern>`;
  svg += `</defs>`;

  // ── Title ──
  const attachLabel = attachment === 'three-side' ? '3-SIDE ATTACHED' : attachment === 'attached' ? 'ATTACHED' : 'FREESTANDING';
  svg += `<text x="${W / 2}" y="18" text-anchor="middle" font-family="${mono}" font-size="9.5" fill="${textCol}" font-weight="600">PLAN VIEW · ${isGable ? 'GABLE' : 'SKILLION'} · ${attachLabel} · ${width.toFixed(2)}m × ${depth.toFixed(2)}m · ${portalFrameCount} PORTAL FRAMES · ${(standoff * 1000).toFixed(0)}mm STANDOFF</text>`;

  // North arrow — rotated by northRotation degrees (clockwise) around its centre
  const nX = W - 28, nY = margin.top + 14;
  svg += `<g transform="rotate(${northRotation}, ${nX}, ${nY + 11})">`;
  svg += `<line x1="${nX}" y1="${nY + 12}" x2="${nX}" y2="${nY}" stroke="${dimCol}" stroke-width="1"/>`;
  svg += `<polygon points="${nX},${nY} ${nX - 4},${nY + 7} ${nX + 4},${nY + 7}" fill="${dimCol}"/>`;
  svg += `<text x="${nX}" y="${nY + 22}" text-anchor="middle" font-family="${mono}" font-size="6.5" fill="${dimCol}">N</text>`;
  svg += `</g>`;
  if (northRotation !== 0) {
    svg += `<text x="${nX}" y="${nY + 32}" text-anchor="middle" font-family="${mono}" font-size="5.5" fill="${dimCol}">${northRotation}°</text>`;
  }

  // ══════════════════════════════════════════════════════════════════
  // DIMENSIONS — all pushed out with dashed leaders, nothing overlaps
  // ══════════════════════════════════════════════════════════════════

  // Width (brick-to-brick) — above house wall
  const dimTopY = wallTopY - 24;
  svg += `<line x1="${structLeftX}" y1="${dimTopY}" x2="${structRightX}" y2="${dimTopY}" stroke="${dimCol}" stroke-width="0.7"/>`;
  svg += `<line x1="${structLeftX}" y1="${dimTopY - 3}" x2="${structLeftX}" y2="${dimTopY + 3}" stroke="${dimCol}" stroke-width="0.7"/>`;
  svg += `<line x1="${structRightX}" y1="${dimTopY - 3}" x2="${structRightX}" y2="${dimTopY + 3}" stroke="${dimCol}" stroke-width="0.7"/>`;
  svg += `<line x1="${structLeftX}" y1="${dimTopY + 3}" x2="${structLeftX}" y2="${wallTopY}" stroke="${dimCol}" stroke-width="0.4" stroke-dasharray="2,3" opacity="0.4"/>`;
  svg += `<line x1="${structRightX}" y1="${dimTopY + 3}" x2="${structRightX}" y2="${wallTopY}" stroke="${dimCol}" stroke-width="0.4" stroke-dasharray="2,3" opacity="0.4"/>`;
  svg += `<text x="${(structLeftX + structRightX) / 2}" y="${dimTopY - 5}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}">${width.toFixed(2)}m  (BRICK TO BRICK)</text>`;

  // Frame width dim (blue) — with tick marks and dotted witness lines down to frameLeftX/frameRightX
  const dimFrameY = wallTopY - 12;
  svg += `<line x1="${frameLeftX}" y1="${dimFrameY}" x2="${frameRightX}" y2="${dimFrameY}" stroke="${standoffCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${frameLeftX}"  y1="${dimFrameY - 4}" x2="${frameLeftX}"  y2="${dimFrameY + 4}" stroke="${standoffCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${frameRightX}" y1="${dimFrameY - 4}" x2="${frameRightX}" y2="${dimFrameY + 4}" stroke="${standoffCol}" stroke-width="0.8"/>`;
  // Dotted witness lines going DOWN from tick marks to where frameLeftX/frameRightX enter the structure
  svg += `<line x1="${frameLeftX}"  y1="${dimFrameY + 4}" x2="${frameLeftX}"  y2="${wallTopY}" stroke="${standoffCol}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.55"/>`;
  svg += `<line x1="${frameRightX}" y1="${dimFrameY + 4}" x2="${frameRightX}" y2="${wallTopY}" stroke="${standoffCol}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.55"/>`;
  svg += `<text x="${frameMidX}" y="${dimFrameY - 5}" text-anchor="middle" font-family="${mono}" font-size="5.5" fill="${standoffCol}">${((frameRightX - frameLeftX) / sc).toFixed(2)}m  frame  (−${(standoff * 1000).toFixed(0)}mm/side)</text>`;

  // ── Left depth dimensions — industry standard: largest dim furthest from building ──
  // Furthest out (gray): brick wall 5.77m  — from back wall fascia to front brick extent
  // Closer in (blue):   structure 5.62m    — from ledger to front (standoff absorbed)
  const structDepth = depth - standoff;
  const dimLXGray = houseLeftX - wallT - 44; // brick (gray) — outermost, largest dim
  const dimLXBlue = houseLeftX - wallT - 20; // structure (blue) — closer, smaller dim

  // ── Gray: brick depth (outermost) ──
  svg += `<line x1="${dimLXGray}" y1="${wallBotY}" x2="${dimLXGray}" y2="${frameBotY}" stroke="${dimCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${dimLXGray - 4}" y1="${wallBotY}"  x2="${dimLXGray + 4}" y2="${wallBotY}"  stroke="${dimCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${dimLXGray - 4}" y1="${frameBotY}" x2="${dimLXGray + 4}" y2="${frameBotY}" stroke="${dimCol}" stroke-width="0.8"/>`;
  // Dotted witness lines FROM left wall outer face → dim line (no crossing)
  svg += `<line x1="${dimLXGray + 4}" y1="${wallBotY}"  x2="${structLeftX - wallT}" y2="${wallBotY}"  stroke="${dimCol}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.55"/>`;
  svg += `<line x1="${dimLXGray + 4}" y1="${frameBotY}" x2="${structLeftX - wallT}" y2="${frameBotY}" stroke="${dimCol}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.55"/>`;
  const brickMidY = (wallBotY + frameBotY) / 2;
  svg += `<text x="${dimLXGray - 6}" y="${brickMidY + 3}" text-anchor="middle" transform="rotate(-90,${dimLXGray - 6},${brickMidY + 3})" font-family="${mono}" font-size="7" fill="${dimCol}">${depth.toFixed(2)}m  BRICK WALL</text>`;

  // ── Blue: structure depth (closer to building) ──
  svg += `<line x1="${dimLXBlue}" y1="${frameTopY}" x2="${dimLXBlue}" y2="${frameBotY}" stroke="${standoffCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${dimLXBlue - 4}" y1="${frameTopY}" x2="${dimLXBlue + 4}" y2="${frameTopY}" stroke="${standoffCol}" stroke-width="0.8"/>`;
  svg += `<line x1="${dimLXBlue - 4}" y1="${frameBotY}" x2="${dimLXBlue + 4}" y2="${frameBotY}" stroke="${standoffCol}" stroke-width="0.8"/>`;
  // Dotted witness lines FROM the frame left edge (frameLeftX) → dim line
  svg += `<line x1="${dimLXBlue + 4}" y1="${frameTopY}" x2="${frameLeftX}" y2="${frameTopY}" stroke="${standoffCol}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.55"/>`;
  svg += `<line x1="${dimLXBlue + 4}" y1="${frameBotY}" x2="${frameLeftX}" y2="${frameBotY}" stroke="${standoffCol}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.55"/>`;
  const structMidY2 = (frameTopY + frameBotY) / 2;
  svg += `<text x="${dimLXBlue - 6}" y="${structMidY2 + 3}" text-anchor="middle" transform="rotate(-90,${dimLXBlue - 6},${structMidY2 + 3})" font-family="${mono}" font-size="7" fill="${standoffCol}">${structDepth.toFixed(2)}m  STRUCTURE  (−${(standoff * 1000).toFixed(0)}mm)</text>`;

  // Portal frame spacing — right side
  if (frameYs.length > 1) {
    const spX   = houseRightX + wallT + 14;
    const spMid = (frameYs[0] + frameYs[1]) / 2;
    const spacing = (depth / (portalFrameCount - 1)).toFixed(2);
    svg += `<line x1="${spX}" y1="${frameYs[0]}" x2="${spX}" y2="${frameYs[1]}" stroke="${dimCol}" stroke-width="0.6"/>`;
    svg += `<line x1="${spX - 3}" y1="${frameYs[0]}" x2="${spX + 3}" y2="${frameYs[0]}" stroke="${dimCol}" stroke-width="0.6"/>`;
    svg += `<line x1="${spX - 3}" y1="${frameYs[1]}" x2="${spX + 3}" y2="${frameYs[1]}" stroke="${dimCol}" stroke-width="0.6"/>`;
    svg += `<line x1="${spX + 3}" y1="${frameYs[0]}" x2="${frameRightX}" y2="${frameYs[0]}" stroke="${dimCol}" stroke-width="0.4" stroke-dasharray="2,3" opacity="0.4"/>`;
    svg += `<text x="${spX + 6}" y="${spMid + 3}" font-family="${mono}" font-size="6" fill="${dimCol}">${spacing}m  c/c</text>`;
  }

  // Right setback — far right (if applicable)
  if (rightSetback > 0 && attachment === 'three-side') {
    const sbX = houseRightX + wallT + 40;
    svg += `<line x1="${sbX}" y1="${rightWallEndY}" x2="${sbX}" y2="${frameBotY}" stroke="${dimCol}" stroke-width="0.6" stroke-dasharray="3,2"/>`;
    svg += `<line x1="${sbX - 3}" y1="${rightWallEndY}" x2="${sbX + 3}" y2="${rightWallEndY}" stroke="${dimCol}" stroke-width="0.6"/>`;
    svg += `<line x1="${sbX - 3}" y1="${frameBotY}" x2="${sbX + 3}" y2="${frameBotY}" stroke="${dimCol}" stroke-width="0.6"/>`;
    svg += `<text x="${sbX + 6}" y="${(rightWallEndY + frameBotY) / 2 + 3}" font-family="${mono}" font-size="6" fill="${dimCol}">${rightSetback.toFixed(1)}m</text>`;
    svg += `<text x="${sbX + 6}" y="${(rightWallEndY + frameBotY) / 2 + 12}" font-family="${mono}" font-size="6" fill="${dimCol}">setback</text>`;
  }

  // ══════════════════════════════════════════════════════════════════
  // HOUSE WALLS
  // ══════════════════════════════════════════════════════════════════
  if (attachment !== 'freestanding') {
    // Back wall (horizontal band)
    svg += `<rect x="${houseLeftX}" y="${wallTopY}" width="${houseRightX - houseLeftX}" height="${wallT}" fill="${houseFill}" stroke="${houseCol}" stroke-width="1.2"/>`;
    svg += `<rect x="${houseLeftX}" y="${wallTopY}" width="${houseRightX - houseLeftX}" height="${wallT}" fill="url(#houseHatch)"/>`;
    svg += `<text x="${frameMidX}" y="${wallTopY + wallT / 2 + 3.5}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${houseCol}" font-weight="600">EXISTING DWELLING</text>`;
    // Fascia line (outer face of back wall)
    svg += `<line x1="${houseLeftX}" y1="${wallBotY}" x2="${houseRightX}" y2="${wallBotY}" stroke="${houseCol}" stroke-width="1.6"/>`;

    if (attachment === 'three-side') {
      // Left side wall (full depth or to leftSetback)
      svg += `<rect x="${structLeftX - wallT}" y="${wallBotY}" width="${wallT}" height="${leftWallDepth * sc}" fill="${houseFill}" stroke="${houseCol}" stroke-width="1"/>`;
      svg += `<rect x="${structLeftX - wallT}" y="${wallBotY}" width="${wallT}" height="${leftWallDepth * sc}" fill="url(#houseHatch)"/>`;
      svg += `<line x1="${structLeftX}" y1="${wallBotY}" x2="${structLeftX}" y2="${wallBotY + leftWallDepth * sc}" stroke="${houseCol}" stroke-width="1.2"/>`;

      // Right side wall (to rightWallDepth, stops at setback)
      svg += `<rect x="${structRightX}" y="${wallBotY}" width="${wallT}" height="${rightWallDepth * sc}" fill="${houseFill}" stroke="${houseCol}" stroke-width="1"/>`;
      svg += `<rect x="${structRightX}" y="${wallBotY}" width="${wallT}" height="${rightWallDepth * sc}" fill="url(#houseHatch)"/>`;
      svg += `<line x1="${structRightX}" y1="${wallBotY}" x2="${structRightX}" y2="${wallBotY + rightWallDepth * sc}" stroke="${houseCol}" stroke-width="1.2"/>`;

      // Right wall end marker
      if (rightSetback > 0) {
        const eY = wallBotY + rightWallDepth * sc;
        svg += `<line x1="${structRightX - 6}" y1="${eY}" x2="${structRightX + wallT + 6}" y2="${eY}" stroke="${houseCol}" stroke-width="1.2" stroke-dasharray="3,2"/>`;
      }
    }
  } else {
    const refX = houseLeftX - 48;
    svg += `<rect x="${refX}" y="${wallTopY + 4}" width="38" height="22" fill="${houseFill}" stroke="${houseCol}" stroke-width="0.8" stroke-dasharray="4,3"/>`;
    svg += `<text x="${refX + 19}" y="${wallTopY + 17}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${houseCol}">HOUSE</text>`;
  }

  // ══════════════════════════════════════════════════════════════════
  // STRUCTURE FOOTPRINT
  // Fill = full roof coverage area. Right boundary = solid to wall end, dashed beyond.
  // ══════════════════════════════════════════════════════════════════
  const fW = frameRightX - frameLeftX;
  const fH = frameBotY   - frameTopY;

  // Fill + hatch (full area)
  svg += `<rect x="${frameLeftX}" y="${frameTopY}" width="${fW}" height="${fH}" fill="${structFill}"/>`;
  svg += `<rect x="${frameLeftX}" y="${frameTopY}" width="${fW}" height="${fH}" fill="url(#structHatch)"/>`;

  // Standoff inset zones (subtle blue tint on each side)
  if (attachment !== 'freestanding' && so > 2) {
    svg += `<rect x="${structLeftX}" y="${frameTopY}" width="${so}" height="${fH}" fill="rgba(33,150,243,0.05)"/>`;
    svg += `<rect x="${frameRightX}" y="${frameTopY}" width="${so}" height="${fH}" fill="rgba(33,150,243,0.05)"/>`;
  }

  // Frame outline — drawn as individual lines so right edge can be dashed past wall end
  svg += `<line x1="${frameLeftX}" y1="${frameTopY}"  x2="${frameRightX}" y2="${frameTopY}"  stroke="${structCol}" stroke-width="1.5"/>`; // back
  svg += `<line x1="${frameLeftX}" y1="${frameTopY}"  x2="${frameLeftX}"  y2="${frameBotY}"  stroke="${structCol}" stroke-width="1.5"/>`; // left (full)
  svg += `<line x1="${frameLeftX}" y1="${frameBotY}"  x2="${frameRightX}" y2="${frameBotY}"  stroke="${structCol}" stroke-width="1.5"/>`; // front
  // Right: solid to wall end, dashed beyond
  svg += `<line x1="${frameRightX}" y1="${frameTopY}" x2="${frameRightX}" y2="${rightWallEndY}" stroke="${structCol}" stroke-width="1.5"/>`;
  if (rightWallEndY < frameBotY - 2) {
    svg += `<line x1="${frameRightX}" y1="${rightWallEndY}" x2="${frameRightX}" y2="${frameBotY}" stroke="${structCol}" stroke-width="1" stroke-dasharray="5,3" opacity="0.45"/>`;
    svg += `<line x1="${frameRightX - 5}" y1="${rightWallEndY}" x2="${frameRightX + 5}" y2="${rightWallEndY}" stroke="${houseCol}" stroke-width="1.2"/>`;
  }

  // ══════════════════════════════════════════════════════════════════
  // RIDGE BEAM (centre vertical dashed line)
  // ══════════════════════════════════════════════════════════════════
  if (isGable) {
    svg += `<line x1="${frameMidX}" y1="${frameTopY}" x2="${frameMidX}" y2="${frameBotY}" stroke="${ridgeCol}" stroke-width="1.8" stroke-dasharray="6,3"/>`;
    svg += `<text x="${frameMidX + 4}" y="${frameMidY + 3}" font-family="${mono}" font-size="6" fill="${ridgeCol}">RIDGE</text>`;
  }

  // ══════════════════════════════════════════════════════════════════
  // PURLIN LINES (vertical, parallel to ridge)
  // ══════════════════════════════════════════════════════════════════
  if (isGable) {
    for (let i = 0; i < purlinXsL.length; i++) {
      const isEave = i === purlinXsL.length - 1;
      const sw = isEave ? 1.0 : 0.6;
      const da = isEave ? '6,3' : '3,4';
      svg += `<line x1="${purlinXsL[i]}" y1="${frameTopY}" x2="${purlinXsL[i]}" y2="${frameBotY}" stroke="${purlinCol}" stroke-width="${sw}" stroke-dasharray="${da}" opacity="0.7"/>`;
      svg += `<line x1="${purlinXsR[i]}" y1="${frameTopY}" x2="${purlinXsR[i]}" y2="${frameBotY}" stroke="${purlinCol}" stroke-width="${sw}" stroke-dasharray="${da}" opacity="0.7"/>`;
    }
  } else {
    // Skillion — single continuous run; both ends are eaves (high left, low right)
    for (let i = 0; i < skillionXs.length; i++) {
      const isEave = i === 0 || i === skillionXs.length - 1;
      const sw = isEave ? 1.0 : 0.6;
      const da = isEave ? '6,3' : '3,4';
      svg += `<line x1="${skillionXs[i]}" y1="${frameTopY}" x2="${skillionXs[i]}" y2="${frameBotY}" stroke="${purlinCol}" stroke-width="${sw}" stroke-dasharray="${da}" opacity="0.7"/>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PORTAL FRAMES
  // ══════════════════════════════════════════════════════════════════
  const ps = 7;
  for (let i = 0; i < frameYs.length; i++) {
    const fy  = frameYs[i];
    const fdm = (fy - frameTopY) / sc;

    // Frame line (full width)
    svg += `<line x1="${frameLeftX}" y1="${fy}" x2="${frameRightX}" y2="${fy}" stroke="${frameCol}" stroke-width="2.2"/>`;

    // Label — left of house wall, clear of everything
    svg += `<text x="${houseLeftX - 8}" y="${fy + 4}" text-anchor="end" font-family="${mono}" font-size="7.5" fill="${frameCol}" font-weight="600">PF${i + 1}</text>`;

    // Ridge apex diamond (gable only — skillion has no ridge)
    if (isGable) {
      svg += `<polygon points="${frameMidX},${fy - 5} ${frameMidX + 4},${fy} ${frameMidX},${fy + 5} ${frameMidX - 4},${fy}" fill="${ridgeCol}" opacity="0.9"/>`;
    }

    // Left side — standoff or post
    const leftHasWall = (attachment === 'three-side') && fdm <= leftWallDepth + 0.01;
    if (leftHasWall) {
      const soW = Math.max(4, so * 0.55);
      svg += `<rect x="${frameLeftX - soW}" y="${fy - 2.5}" width="${soW}" height="5" fill="${standoffCol}" opacity="0.85"/>`;
      svg += `<circle cx="${frameLeftX}" cy="${fy}" r="4.5" fill="none" stroke="${standoffCol}" stroke-width="1.5"/>`;
      svg += `<circle cx="${frameLeftX}" cy="${fy}" r="1.8" fill="${standoffCol}"/>`;
      if (i === 0) {
        // Standoff label on first frame only — above PF1, clear of wall
        svg += `<text x="${houseLeftX - 8}" y="${fy - 14}" text-anchor="end" font-family="${mono}" font-size="5.5" fill="${standoffCol}">SHS STANDOFF</text>`;
        svg += `<text x="${houseLeftX - 8}" y="${fy - 6}" text-anchor="end" font-family="${mono}" font-size="5.5" fill="${standoffCol}">(TYP. ALL SIDES)</text>`;
      }
    } else {
      svg += `<rect x="${frameLeftX - ps / 2}" y="${fy - ps / 2}" width="${ps}" height="${ps}" fill="${postCol}" stroke="rgba(0,0,0,0.4)" stroke-width="0.5"/>`;
    }

    // Right side — standoff or corner post
    const rightHasWall = (attachment === 'three-side') && fdm <= rightWallDepth + 0.01;
    if (rightHasWall) {
      const soW = Math.max(4, so * 0.55);
      svg += `<rect x="${frameRightX}" y="${fy - 2.5}" width="${soW}" height="5" fill="${standoffCol}" opacity="0.85"/>`;
      svg += `<circle cx="${frameRightX}" cy="${fy}" r="4.5" fill="none" stroke="${standoffCol}" stroke-width="1.5"/>`;
      svg += `<circle cx="${frameRightX}" cy="${fy}" r="1.8" fill="${standoffCol}"/>`;
    } else {
      svg += `<rect x="${frameRightX - ps / 2}" y="${fy - ps / 2}" width="${ps}" height="${ps}" fill="${postCol}" stroke="rgba(0,0,0,0.4)" stroke-width="0.5"/>`;
      if (attachment === 'three-side') {
        svg += `<circle cx="${frameRightX}" cy="${fy}" r="6" fill="none" stroke="#f44336" stroke-width="1.5"/>`;
        if (i === frameYs.length - 1) {
          // Corner post label — to the right, clear of setback dim
          svg += `<text x="${frameRightX + 10}" y="${fy - 3}" font-family="${mono}" font-size="6" fill="#f44336" font-weight="600">CORNER POST</text>`;
          svg += `<text x="${frameRightX + 10}" y="${fy + 7}" font-family="${mono}" font-size="6" fill="${dimCol}">to ground</text>`;
        }
      }
    }

    // Freestanding — posts both sides
    if (attachment !== 'three-side') {
      svg += `<rect x="${frameLeftX  - ps / 2}" y="${fy - ps / 2}" width="${ps}" height="${ps}" fill="${postCol}" stroke="rgba(0,0,0,0.4)" stroke-width="0.5"/>`;
      svg += `<rect x="${frameRightX - ps / 2}" y="${fy - ps / 2}" width="${ps}" height="${ps}" fill="${postCol}" stroke="rgba(0,0,0,0.4)" stroke-width="0.5"/>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // LEDGER BEAM (back, house side only) — no full-width front fascia
  // ══════════════════════════════════════════════════════════════════
  svg += `<line x1="${frameLeftX}" y1="${frameTopY}" x2="${frameRightX}" y2="${frameTopY}" stroke="${frameCol}" stroke-width="2.8"/>`;
  // Ledger beam label deferred — connection detail to be resolved in elevation design

  // ── Fascia/gutter — only the open entrance section on the right side ──
  // Runs along the right edge from right wall end to the front (between PF2 and PF3)
  if (attachment === 'three-side' && rightSetback > 0) {
    svg += `<line x1="${frameRightX}" y1="${rightWallEndY}" x2="${frameRightX}" y2="${frameBotY}" stroke="${frameCol}" stroke-width="2.8"/>`;
    const fasciaLabelY = (rightWallEndY + frameBotY) / 2;
    svg += `<text x="${frameRightX + 8}" y="${fasciaLabelY - 2}" font-family="${mono}" font-size="6" fill="${frameCol}" font-weight="600">FASCIA / GUTTER</text>`;
    svg += `<text x="${frameRightX + 8}" y="${fasciaLabelY + 8}" font-family="${mono}" font-size="6" fill="${dimCol}">entrance opening</text>`;
  }

  // ══════════════════════════════════════════════════════════════════
  // RIDGE BACK CONNECTION (different symbol — bracket/cross at ledger centre)
  // ══════════════════════════════════════════════════════════════════
  if (attachment !== 'freestanding') {
    const rcX = frameMidX;
    svg += `<rect x="${rcX - 3}" y="${wallBotY}" width="6" height="${so}" fill="rgba(232,192,96,0.55)"/>`;
    if (isGable) {
      // Gable ridge bottom-chord tie connection to the house (cross symbol)
      svg += `<rect x="${rcX - 5}" y="${frameTopY - 5}" width="10" height="10" fill="none" stroke="${ridgeCol}" stroke-width="1.4"/>`;
      svg += `<line x1="${rcX - 5}" y1="${frameTopY - 5}" x2="${rcX + 5}" y2="${frameTopY + 5}" stroke="${ridgeCol}" stroke-width="0.9"/>`;
      svg += `<line x1="${rcX + 5}" y1="${frameTopY - 5}" x2="${rcX - 5}" y2="${frameTopY + 5}" stroke="${ridgeCol}" stroke-width="0.9"/>`;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // BOTTOM ANNOTATION STRIP  (between fascia and legend)
  // Gable labels, purlin labels, connection summary — nothing overlaps
  // ══════════════════════════════════════════════════════════════════
  const strip1 = frameBotY + 16; // row 1 — gable + fascia
  const strip2 = strip1 + 16;   // row 2 — purlin labels
  const strip3 = strip2 + 13;   // row 3 — purlin spacing note
  const strip4 = strip3 + 13;   // row 4 — connection summary

  // Gable end labels — both in bottom strip, nothing overlaps in the structure area
  if (isGable) {
    svg += `<text x="${frameMidX}" y="${strip1}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${structCol}" font-weight="600">▲ GABLE END — FRONT FACE</text>`;
    svg += `<text x="${frameMidX}" y="${strip1 + 11}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${structCol}" font-weight="600">▼ GABLE END — BACK FACE  (ridge btm chord conn. to house)</text>`;
  } else {
    // Skillion — fall (slope) runs across the span: high eave left, low eave right
    svg += `<text x="${frameMidX}" y="${strip1}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${structCol}" font-weight="600">SKILLION — FALL ACROSS SPAN  ◄ HIGH EAVE (left)   ·   LOW EAVE / GUTTER (right) ►</text>`;
    // Edge labels running along the two eaves
    svg += `<text x="${frameLeftX - 4}" y="${frameMidY}" text-anchor="middle" transform="rotate(-90,${frameLeftX - 4},${frameMidY})" font-family="${mono}" font-size="6" fill="${structCol}" font-weight="600">HIGH SIDE EAVE</text>`;
    svg += `<text x="${frameRightX + 9}" y="${frameMidY}" text-anchor="middle" transform="rotate(-90,${frameRightX + 9},${frameMidY})" font-family="${mono}" font-size="6" fill="${purlinCol}" font-weight="600">LOW EAVE / GUTTER</text>`;
  }

  // Purlin labels — one row below gable/eave label
  if (isGable) {
    for (let i = 0; i < purlinXsL.length; i++) {
      const isEave = i === purlinXsL.length - 1;
      const lbl = isEave ? 'EAVE' : `P${i + 1}`;
      svg += `<text x="${purlinXsL[i]}" y="${strip2}" text-anchor="middle" font-family="${mono}" font-size="5.5" fill="${purlinCol}">${lbl}</text>`;
      svg += `<text x="${purlinXsR[i]}" y="${strip2}" text-anchor="middle" font-family="${mono}" font-size="5.5" fill="${purlinCol}">${lbl}</text>`;
    }
    svg += `<text x="${frameMidX}" y="${strip3}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${dimCol}">P1 at 75mm from ridge  ·  P2–P4 evenly spaced  ·  EAVE at frame edge</text>`;
  } else {
    for (let i = 0; i < skillionXs.length; i++) {
      const lbl = i === 0 ? 'HE' : i === skillionXs.length - 1 ? 'LE' : `P${i}`;
      svg += `<text x="${skillionXs[i]}" y="${strip2}" text-anchor="middle" font-family="${mono}" font-size="5.5" fill="${purlinCol}">${lbl}</text>`;
    }
    svg += `<text x="${frameMidX}" y="${strip3}" text-anchor="middle" font-family="${mono}" font-size="6" fill="${dimCol}">HE = high eave (75mm in)  ·  P1–P${skillionXs.length - 2} evenly spaced  ·  LE = low eave at frame edge</text>`;
  }

  // Connection summary
  const connNote = isGable ? '1 gable btm chord conn.' : '1 high-side ledger conn.';
  const note = attachment === 'freestanding'
    ? `${portalFrameCount * 2} posts (freestanding)`
    : `${houseConns} connections to house  (${leftCount}L + ${rightCount}R + ${connNote})  ·  ${cornerPostCount} corner post${cornerPostCount !== 1 ? 's' : ''} to ground`;
  svg += `<text x="${W / 2}" y="${strip4}" text-anchor="middle" font-family="${mono}" font-size="7" fill="${dimCol}">${note}</text>`;

  // ══════════════════════════════════════════════════════════════════
  // LEGEND — horizontal bar at very bottom
  // ══════════════════════════════════════════════════════════════════
  const legY = H - 38;
  svg += `<line x1="10" y1="${legY - 10}" x2="${W - 10}" y2="${legY - 10}" stroke="${dimCol}" stroke-width="0.4" opacity="0.35"/>`;
  svg += `<text x="12" y="${legY + 4}" font-family="${mono}" font-size="6" fill="${dimCol}" font-weight="600">LEGEND:</text>`;

  type LegItem = [string, string, string];
  const legItems: LegItem[] = [
    ['square',    postCol,     'Base post'],
    ['hline',     frameCol,    'Portal frame'],
    ...(isGable ? [['vdash', ridgeCol, 'Ridge beam'] as LegItem] : []),
    ['vdash',     purlinCol,   'Purlin'],
    ['circle',    standoffCol, 'Standoff (SHS thru fascia)'],
    ...(isGable ? [['xcross', ridgeCol, 'Ridge btm chord conn.'] as LegItem] : []),
    ['hatch',     houseCol,    'Existing dwelling'],
    ['redcircle', '#f44336',   'Corner post'],
  ];
  let lx = 72;
  for (const [type, col, label] of legItems) {
    const cy = legY + 1;
    if      (type === 'square')    { svg += `<rect x="${lx}" y="${cy - 4}" width="7" height="7" fill="${col}"/>`; }
    else if (type === 'hline')     { svg += `<line x1="${lx}" y1="${cy}" x2="${lx + 11}" y2="${cy}" stroke="${col}" stroke-width="2.2"/>`; }
    else if (type === 'vdash')     { svg += `<line x1="${lx + 4}" y1="${cy - 5}" x2="${lx + 4}" y2="${cy + 5}" stroke="${col}" stroke-width="${col === ridgeCol ? 2 : 1}" stroke-dasharray="3,2"/>`; }
    else if (type === 'circle')    { svg += `<circle cx="${lx + 4}" cy="${cy}" r="3.5" fill="none" stroke="${col}" stroke-width="1.2"/><circle cx="${lx + 4}" cy="${cy}" r="1.5" fill="${col}"/>`; }
    else if (type === 'xcross')    { svg += `<rect x="${lx + 1}" y="${cy - 4}" width="8" height="8" fill="none" stroke="${col}" stroke-width="0.9"/><line x1="${lx + 1}" y1="${cy - 4}" x2="${lx + 9}" y2="${cy + 4}" stroke="${col}" stroke-width="0.8"/><line x1="${lx + 9}" y1="${cy - 4}" x2="${lx + 1}" y2="${cy + 4}" stroke="${col}" stroke-width="0.8"/>`; }
    else if (type === 'hatch')     { svg += `<rect x="${lx}" y="${cy - 4}" width="11" height="7" fill="${houseFill}" stroke="${col}" stroke-width="0.8"/>`; }
    else if (type === 'redcircle') { svg += `<circle cx="${lx + 4}" cy="${cy}" r="4.5" fill="none" stroke="${col}" stroke-width="1.2"/><circle cx="${lx + 4}" cy="${cy}" r="1.8" fill="${col}"/>`; }
    svg += `<text x="${lx + 14}" y="${cy + 4}" font-family="${mono}" font-size="6" fill="${textCol}">${label}</text>`;
    lx += label.length * 4.2 + 20;
  }

  svg += `</svg>`;
  return svg;
}
