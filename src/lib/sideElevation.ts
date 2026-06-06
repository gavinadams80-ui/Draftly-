// ── Side elevation ──
// Long-side view (looking along the width): depth × height. Shows the line of
// posts along the depth, the existing dwelling at the attached end, the eave and
// ridge lines, ground line, and overall dimensions. Parametric — derived purely
// from the project config. Output is a plain SVG string for withTitleBlock().

const mono = 'DM Mono,monospace';
const lineCol = '#c8cce0';
const dimCol = '#9aa0bc';
const steelCol = '#c9a84c';
const groundCol = '#6db87a';

export function generateSideElevationSVG(
  depthM: number,
  eaveHeightM: number,
  widthM: number,
  pitchDeg: number,
  isGable: boolean,
  portalCount: number,
  attachment: string,
): string {
  const VB_W = 720;
  const VB_H = 440;
  const ML = 60, MR = 70, MT = 40, MB = 70;

  const rise = (isGable ? widthM / 2 : widthM) * Math.tan((pitchDeg * Math.PI) / 180);
  const ridgeM = eaveHeightM + Math.max(0, rise);

  const drawW = VB_W - ML - MR;
  const drawH = VB_H - MT - MB;
  const sxScale = drawW / Math.max(0.5, depthM);
  const syScale = drawH / Math.max(0.5, ridgeM * 1.1);
  const sc = Math.min(sxScale, syScale);

  const groundY = VB_H - MB;
  const x0 = ML;                          // depth = 0 (attached / house end)
  const X = (m: number) => x0 + m * sc;   // along depth
  const Y = (m: number) => groundY - m * sc; // height up

  const attached = attachment === 'attached' || attachment === 'three-side';

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}">`;

  // Ground line
  s += `<line x1="${ML - 20}" y1="${groundY}" x2="${VB_W - MR + 20}" y2="${groundY}" stroke="${groundCol}" stroke-width="1.6"/>`;
  for (let gx = ML - 12; gx < VB_W - MR + 20; gx += 14) {
    s += `<line x1="${gx}" y1="${groundY}" x2="${gx - 7}" y2="${groundY + 8}" stroke="${groundCol}" stroke-width="0.7" opacity="0.6"/>`;
  }

  // Existing dwelling at the attached (left) end
  if (attached) {
    const hw = 26;
    s += `<rect x="${x0 - hw}" y="${Y(ridgeM) - 6}" width="${hw}" height="${groundY - (Y(ridgeM) - 6)}" fill="rgba(255,255,255,0.05)" stroke="${lineCol}" stroke-width="1"/>`;
    for (let hy = Y(ridgeM); hy < groundY; hy += 10) {
      s += `<line x1="${x0 - hw}" y1="${hy}" x2="${x0}" y2="${hy - 8}" stroke="${lineCol}" stroke-width="0.4" opacity="0.5"/>`;
    }
    s += `<text x="${x0 - hw / 2}" y="${Y(ridgeM) - 10}" font-family="${mono}" font-size="8" fill="${dimCol}" text-anchor="middle">EXISTING</text>`;
    s += `<text x="${x0 - hw / 2}" y="${Y(ridgeM) - 1}" font-family="${mono}" font-size="8" fill="${dimCol}" text-anchor="middle">DWELLING</text>`;
  }

  // Posts along the depth
  const nPosts = Math.max(2, portalCount);
  const postXs: number[] = [];
  for (let i = 0; i < nPosts; i++) {
    const m = (i / (nPosts - 1)) * depthM;
    postXs.push(m);
    const px = X(m);
    s += `<line x1="${px}" y1="${groundY}" x2="${px}" y2="${Y(eaveHeightM)}" stroke="${steelCol}" stroke-width="2.2"/>`;
    // footing
    s += `<rect x="${px - 5}" y="${groundY}" width="10" height="9" fill="rgba(201,168,76,0.25)" stroke="${steelCol}" stroke-width="0.6"/>`;
  }

  // Eave / fascia line (front edge of roof) and ridge line
  s += `<line x1="${X(0)}" y1="${Y(eaveHeightM)}" x2="${X(depthM)}" y2="${Y(eaveHeightM)}" stroke="${steelCol}" stroke-width="2.2"/>`;
  if (ridgeM > eaveHeightM + 0.01) {
    s += `<line x1="${X(0)}" y1="${Y(ridgeM)}" x2="${X(depthM)}" y2="${Y(ridgeM)}" stroke="${steelCol}" stroke-width="1.4" stroke-dasharray="6,3"/>`;
    s += `<text x="${X(depthM / 2)}" y="${Y(ridgeM) - 5}" font-family="${mono}" font-size="8" fill="${dimCol}" text-anchor="middle">RIDGE LINE (beyond)</text>`;
    // light roof slope hints at the near gable end
    s += `<line x1="${X(0)}" y1="${Y(eaveHeightM)}" x2="${X(0)}" y2="${Y(ridgeM)}" stroke="${steelCol}" stroke-width="0.8" opacity="0.5"/>`;
    s += `<line x1="${X(depthM)}" y1="${Y(eaveHeightM)}" x2="${X(depthM)}" y2="${Y(ridgeM)}" stroke="${steelCol}" stroke-width="0.8" opacity="0.5"/>`;
  }

  // ── Dimensions ──
  // Depth (bottom)
  const dimY = groundY + 34;
  s += `<line x1="${X(0)}" y1="${dimY}" x2="${X(depthM)}" y2="${dimY}" stroke="${dimCol}" stroke-width="0.7"/>`;
  s += `<line x1="${X(0)}" y1="${dimY - 4}" x2="${X(0)}" y2="${dimY + 4}" stroke="${dimCol}" stroke-width="0.7"/>`;
  s += `<line x1="${X(depthM)}" y1="${dimY - 4}" x2="${X(depthM)}" y2="${dimY + 4}" stroke="${dimCol}" stroke-width="0.7"/>`;
  s += `<text x="${X(depthM / 2)}" y="${dimY - 4}" font-family="${mono}" font-size="9" fill="${dimCol}" text-anchor="middle">DEPTH ${depthM.toFixed(2)} m</text>`;

  // Post spacing (one bay)
  if (nPosts >= 2) {
    const bay = depthM / (nPosts - 1);
    const sy2 = groundY + 16;
    s += `<line x1="${X(0)}" y1="${sy2}" x2="${X(bay)}" y2="${sy2}" stroke="${dimCol}" stroke-width="0.6" opacity="0.8"/>`;
    s += `<text x="${X(bay / 2)}" y="${sy2 - 3}" font-family="${mono}" font-size="7.5" fill="${dimCol}" text-anchor="middle">${bay.toFixed(2)} m c/c</text>`;
  }

  // Heights (right)
  const dimX = X(depthM) + 30;
  const hDim = (m: number, label: string) => {
    s += `<line x1="${dimX}" y1="${groundY}" x2="${dimX}" y2="${Y(m)}" stroke="${dimCol}" stroke-width="0.7"/>`;
    s += `<line x1="${dimX - 4}" y1="${Y(m)}" x2="${dimX + 4}" y2="${Y(m)}" stroke="${dimCol}" stroke-width="0.7"/>`;
    s += `<line x1="${dimX - 4}" y1="${groundY}" x2="${dimX + 4}" y2="${groundY}" stroke="${dimCol}" stroke-width="0.7"/>`;
    s += `<text x="${dimX + 6}" y="${Y(m) + 3}" font-family="${mono}" font-size="8" fill="${dimCol}">${label} ${m.toFixed(2)} m</text>`;
  };
  hDim(eaveHeightM, 'EAVE');
  if (ridgeM > eaveHeightM + 0.01) {
    const dimX2 = dimX + 2;
    s += `<line x1="${dimX2 + 20}" y1="${groundY}" x2="${dimX2 + 20}" y2="${Y(ridgeM)}" stroke="${dimCol}" stroke-width="0.5" opacity="0.7"/>`;
    s += `<text x="${dimX2 + 24}" y="${Y(ridgeM) + 3}" font-family="${mono}" font-size="8" fill="${steelCol}">RIDGE ${ridgeM.toFixed(2)} m</text>`;
  }

  // Title
  s += `<text x="${ML}" y="${MT - 14}" font-family="${mono}" font-size="10" fill="${lineCol}">SIDE ELEVATION — ${nPosts} posts @ ${(depthM / (nPosts - 1)).toFixed(2)} m c/c</text>`;

  s += `</svg>`;
  return s;
}
