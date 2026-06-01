// ── Wall Section Drawing — Standard Brick Veneer — Drawing A-A ──
// Two mirrored walls. Each wall: timber frame (outer thin strip) + brick veneer (inner).
// Brick finishes lower than timber at the top (step detail).
// Start simple — walls and slab only. Add details incrementally.

export function generateWallSectionSVG(
  spanMm = 6000,
  pitchDeg = 10,
  purlinD  = 100,   // mm — purlin section depth (from engineering)
  purlinBf = 50,    // mm — purlin flange width
  purlinT  = 1.5,   // mm — purlin wall thickness
  showBottomChord = false,             // true for gable end frames (PF1 & PF3)
  bottomChordD    = 150,               // mm — bottom chord section depth
  frameType: 'back' | 'intermediate' | 'front' = 'intermediate',
  columnD         = 100,               // mm — column section depth (PF3 right side)
): string {
  const W = 1060, H = 600;
  const sc = 0.12; // px/mm


  const brickFill   = 'rgba(190,105,50,0.45)';
  const brickStroke = '#c0632a';
  const timberFill  = 'rgba(200,168,70,0.35)';
  const timberStroke = '#a08030';
  const concFill    = 'rgba(130,130,130,0.28)';
  const concStroke  = '#888';

  const groundCol   = '#555';

  // ── Key dimensions (mm) ──
  const TW        = 90;   // timber frame width (outer strip)
  const CW        = 30;   // cavity
  const BW        = 110;  // brick veneer width
  const SLAB_H    = 100;
  const WALL_H    = 2500; // timber full height (FFL → top of timber)
  const BRICK_H   = 2380; // brick stops this high from FFL (120mm lower than timber)
  const COURSE    = 76;   // brick course height

  // ── px ──
  const tPx     = TW * sc;       // 13.2
  const cPx     = CW * sc;       //  3.6
  const bPx     = BW * sc;       // 10.8
  const spPx    = spanMm * sc;   // 720
  const coursePx = COURSE * sc;

  // ── X layout ──
  // LEFT WALL (left to right): TIMBER | cavity | BRICK
  // RIGHT WALL (left to right): BRICK | cavity | TIMBER
  const mL    = 95;
  // Left wall
  const lTL   = mL;                   // left timber outer face
  const lTR   = lTL + tPx;           // left timber right face
  const lCR   = lTR + cPx;           // cavity right
  const lBL   = lCR;                  // left brick left face
  const lBR   = lBL + bPx;           // left brick right face = interior face of left wall
  // Span
  const rBL   = lBR + spPx;          // right brick left face = interior face of right wall
  const rBR   = rBL + bPx;           // right brick right face
  const rCL   = rBR;                  // cavity left (right wall)
  const rTL   = rCL + cPx;           // right timber left face
  const rTR   = rTL + tPx;           // right timber outer face
  const midX  = (lBR + rBL) / 2;

  // ── Y layout ──
  const slabBotY   = H - 50;
  const fflY       = slabBotY - SLAB_H * sc;
  const timberTopY = fflY - WALL_H * sc;   // top of timber frame
  const brickTopY  = fflY - BRICK_H * sc;  // top of brick (lower)

  const r  = (n: number) => n.toFixed(1);
  const ln = (x1: number, y1: number, x2: number, y2: number, col: string, sw = 0.7, dash = '') =>
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${col}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const rx = (x: number, y: number, w: number, h: number, fill: string, stroke: string, sw = 0.8) =>
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;


  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;">`;
  svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;
  // title deferred

  // ── CONCRETE SLAB ──
  svg += rx(lTL, fflY, rTR - lTL, SLAB_H * sc, concFill, concStroke, 0.8);
  for (let hx = lTL; hx < rTR + 12; hx += 10) {
    const x2 = Math.min(hx + SLAB_H * sc, rTR);
    svg += ln(hx, fflY, x2, Math.min(slabBotY, fflY + (x2 - hx)), concStroke, 0.5);
  }
  svg += rx(mL - 5, slabBotY, rTR - mL + 10, 5, 'rgba(80,80,80,0.4)', 'none', 0);
  for (let gx = mL; gx < rTR; gx += 7)
    svg += ln(gx, slabBotY, gx - 8, slabBotY + 5, groundCol, 0.5);
  // CONC. SLAB label deferred

  // ── DRAW WALL helper (left wall: timber left, brick right; mirrored for right) ──
  const drawOneWall = (tL: number, bL: number, brickH: number, _timberH: number, isMirrored: boolean) => {
    let s = '';
    const wallBot = fflY;

    // TIMBER — full height
    s += rx(tL, timberTopY, tPx, wallBot - timberTopY, timberFill, timberStroke, 0.9);
    // Timber grain lines (horizontal)
    for (let ty = timberTopY + 8; ty < wallBot; ty += 12)
      s += ln(tL + 1, ty, tL + tPx - 1, ty, timberStroke, 0.3);

    // BRICK — stops lower (brickTopY)
    const bTop = fflY - brickH * sc;
    s += rx(bL, bTop, bPx, wallBot - bTop, brickFill, brickStroke, 0.8);
    // Brick courses
    for (let cy = bTop; cy < wallBot; cy += coursePx)
      s += ln(bL, cy, bL + bPx, cy, brickStroke, 0.45);

    // Offset step at top — show the brick-to-timber step clearly
    // Horizontal line at brick top
    if (!isMirrored) {
      // Left wall: timber left, brick right
      s += ln(tL, bTop, bL + bPx, bTop, timberStroke, 0.6, '3,3');
    } else {
      s += ln(bL, bTop, bL + bPx + cPx + tPx, bTop, timberStroke, 0.6, '3,3');
    }

    return s;
  };

  // LEFT WALL: timber strip on left (lTL), brick on right (lBL)
  svg += drawOneWall(lTL, lBL, BRICK_H, WALL_H, false);
  // RIGHT WALL — omitted for PF3 front (no wall at that depth)
  if (frameType !== 'front') {
    svg += drawOneWall(rTL, rBL, BRICK_H, WALL_H, true);
  }

  // (dimensions deferred — added after all geometry is complete)

  // ── FASCIA C-SECTION ──
  // 200mm high × 30mm deep × 1mm thick steel C-channel, drawn in blue.
  // Web sits on the cavity face of the brick; flanges project into cavity toward timber.
  // Positioned 10mm below the top of the last brick course.
  const fasciaCol    = '#2196f3';
  const fasciaH_mm   = 200;
  const fasciaD_mm   = 30;   // flange depth (projects into cavity)
  const fasciaTopMM  = 10;   // mm below brick top
  // Position: bottom of C sits 10mm below top brick, body extends UPWARD 200mm
  const fBotY  = brickTopY + fasciaTopMM * sc;   // bottom edge = 10mm below top of brick
  const fTopY  = fBotY - fasciaH_mm * sc;         // top edge = 200mm above bottom
  const fDepth = fasciaD_mm * sc;
  const fSW    = 1.5;   // stroke-width (represents 1mm steel, min visible)

  // LEFT WALL — flange tips sit against brick inner face (lBR), web projects into span
  // Shift C right by fDepth so back flanges are at brick, web sticks out toward span
  const lWebX = lBR + fDepth;
  svg += ln(lWebX, fTopY, lWebX, fBotY,      fasciaCol, fSW);           // web (in span)
  svg += ln(lWebX, fTopY, lBR,   fTopY,      fasciaCol, fSW);           // top flange tip → at brick
  svg += ln(lWebX, fBotY, lBR,   fBotY,      fasciaCol, fSW);           // bottom flange tip → at brick

  // RIGHT fascia
  const rWebX = rBL - fDepth;
  if (frameType === 'back') {
    // PF1 only: normal side-profile fascia at brick wall
    svg += ln(rWebX, fTopY, rWebX, fBotY, fasciaCol, fSW);
    svg += ln(rWebX, fTopY, rBL,   fTopY, fasciaCol, fSW);
    svg += ln(rWebX, fBotY, rBL,   fBotY, fasciaCol, fSW);
  } else if (frameType === 'intermediate') {
    // PF2: TWO fascia visible —
    // 1) Original wall fascia (side profile, runs left-right along wall face, running BACK toward us)
    svg += ln(rWebX, fTopY, rWebX, fBotY, fasciaCol, fSW);
    svg += ln(rWebX, fTopY, rBL,   fTopY, fasciaCol, fSW);
    svg += ln(rWebX, fBotY, rBL,   fBotY, fasciaCol, fSW);
    // 2) Span fascia end profile (C150×50×1.9 runs depth-wise toward PF3, AWAY from us)
    const epD2   = 150 * sc;
    const epBf2  = 50  * sc;
    const epT2   = Math.max(1.2, 1.9 * sc);
    const eX2b   = rWebX - 150 * sc;
    const eX1b   = eX2b - epBf2;
    const epTopY2 = brickTopY - epD2;
    svg += `<rect x="${eX1b.toFixed(1)}" y="${epTopY2.toFixed(1)}" width="${epBf2.toFixed(1)}" height="${epD2.toFixed(1)}" fill="rgba(33,150,243,0.25)" stroke="${fasciaCol}" stroke-width="${fSW}"/>`;
    svg += `<rect x="${eX1b.toFixed(1)}" y="${(epTopY2 + epT2).toFixed(1)}" width="${(epBf2 - epT2).toFixed(1)}" height="${(epD2 - 2 * epT2).toFixed(1)}" fill="rgba(15,16,20,0.85)"/>`;
  } else {
    // PF3: end profile only (C150×50×1.9, runs AWAY from us toward PF2)
    const epD    = 150 * sc;
    const epBf   = 50  * sc;
    const epT    = Math.max(1.2, 1.9 * sc);
    const eX2   = rWebX - 150 * sc;
    const eX1   = eX2 - epBf;
    const epTopY = brickTopY - epD;
    svg += `<rect x="${eX1.toFixed(1)}" y="${epTopY.toFixed(1)}" width="${epBf.toFixed(1)}" height="${epD.toFixed(1)}" fill="rgba(33,150,243,0.25)" stroke="${fasciaCol}" stroke-width="${fSW}"/>`;
    svg += `<rect x="${eX1.toFixed(1)}" y="${(epTopY + epT).toFixed(1)}" width="${(epBf - epT).toFixed(1)}" height="${(epD - 2 * epT).toFixed(1)}" fill="rgba(15,16,20,0.85)"/>`;
  }

  // ── GUTTER PROFILE ──
  // Bottom of gutter = 110mm below fascia bottom flange (fBotY)
  // Profile: 115mm wide, 62mm left leg, 90mm right/inner leg with hook return
  const gutCol    = '#c8cce0';     // black line work
  const gutW      = 115 * sc;      // 115mm bottom width
  const gutLegL   = 62  * sc;      // 62mm left/outer leg
  const gutLegR   = 90  * sc;      // 90mm right/inner leg (with hook)
  const gutHook   = 8   * sc;      // hook return width
  const gutHookUp = 6   * sc;      // hook curl height
  const gutGap    = 110 * sc;      // gap from fascia bottom flange to gutter bottom
  const gutBotY   = fBotY - gutGap;  // 110mm ABOVE fascia bottom flange
  const gutSW     = 1.2;

  // ── LEFT WALL gutter ──
  // Back of gutter 30mm into the span from the fascia face
  const gutOffset = 30 * sc;
  const gLInnX = lBR + gutOffset;        // back / inner hook leg — 30mm into span
  const gLOutX = gLInnX + gutW;          // front / outer leg — 115mm further in

  svg += ln(gLInnX, gutBotY, gLOutX,  gutBotY, gutCol, gutSW);           // bottom
  svg += ln(gLInnX, gutBotY, gLInnX,  gutBotY - gutLegL, gutCol, gutSW); // inner leg (62mm) — against fascia
  svg += ln(gLOutX, gutBotY, gLOutX,  gutBotY - gutLegR, gutCol, gutSW); // outer leg (90mm) — toward span
  // Hook on outer (span) leg
  svg += ln(gLOutX, gutBotY - gutLegR, gLOutX + gutHook, gutBotY - gutLegR, gutCol, gutSW);
  svg += ln(gLOutX + gutHook, gutBotY - gutLegR, gLOutX + gutHook, gutBotY - gutLegR - gutHookUp, gutCol, gutSW);

  // ── RIGHT WALL gutter (mirrored) ──
  // Back of gutter (inner/hook leg) aligns with fascia face (rBL)
  // Gutter extends INTO THE SPAN (leftward from rBL)
  const gRInnX = rBL - gutOffset;        // back / inner hook leg — 30mm into span
  const gROutX = gRInnX - gutW;          // front / outer leg — 115mm further in

  svg += ln(gRInnX, gutBotY, gROutX, gutBotY, gutCol, gutSW);  // bottom
  if (frameType === 'front') {
    // PF3 only: tall inner leg (90mm) with hook clips onto fascia; short outer leg faces span
    svg += ln(gRInnX, gutBotY, gRInnX, gutBotY - gutLegR, gutCol, gutSW); // inner (90mm)
    svg += ln(gROutX, gutBotY, gROutX, gutBotY - gutLegL, gutCol, gutSW); // outer (62mm)
    svg += ln(gRInnX, gutBotY - gutLegR, gRInnX + gutHook, gutBotY - gutLegR, gutCol, gutSW);
    svg += ln(gRInnX + gutHook, gutBotY - gutLegR, gRInnX + gutHook, gutBotY - gutLegR - gutHookUp, gutCol, gutSW);
  } else {
    // PF1 & PF2: original — inner leg 62mm, outer leg 90mm with hook toward span
    svg += ln(gRInnX, gutBotY, gRInnX, gutBotY - gutLegL, gutCol, gutSW); // inner (62mm)
    svg += ln(gROutX, gutBotY, gROutX, gutBotY - gutLegR, gutCol, gutSW); // outer (90mm)
    svg += ln(gROutX, gutBotY - gutLegR, gROutX - gutHook, gutBotY - gutLegR, gutCol, gutSW);
    svg += ln(gROutX - gutHook, gutBotY - gutLegR, gROutX - gutHook, gutBotY - gutLegR - gutHookUp, gutCol, gutSW);
  }

  // ── RHS STANDOFF — 75×50×3mm steel, side profile ──
  // Runs horizontally from outer timber face through wall + fascia, 150mm into span past fascia web.
  // Side profile: 75mm tall, full run length visible. Centred on the fascia.
  const rhsCol     = '#f44336';
  const rhsFill    = 'rgba(244,67,54,0.18)';
  const RHS_H      = 75;   // mm — visible height in side profile
  const RHS_T      = 3;    // mm — wall thickness (shown as stroke weight)
  const RHS_PAST   = 150;  // mm past fascia web
  const rhsH    = RHS_H * sc;
  const rhsBotY = brickTopY;          // bottom edge flush with top of bricks
  const rhsTopY = rhsBotY - rhsH;     // 75mm above that

  // LEFT WALL: starts 90mm in from lTL (stops at timber face, not through it)
  const lRhsStartX = lTL + 90 * sc;
  const lRhsEndX   = lWebX + RHS_PAST * sc;
  svg += `<rect x="${lRhsStartX.toFixed(1)}" y="${rhsTopY.toFixed(1)}" width="${(lRhsEndX - lRhsStartX).toFixed(1)}" height="${rhsH.toFixed(1)}" fill="${rhsFill}" stroke="${rhsCol}" stroke-width="${RHS_T * sc * 0.5}"/>`;

  // RIGHT standoff — omitted for PF3 front
  const rRhsStartX = rTR - 90 * sc;
  const rRhsEndX   = rWebX - RHS_PAST * sc;
  if (frameType !== 'front') {
    svg += `<rect x="${rRhsEndX.toFixed(1)}" y="${rhsTopY.toFixed(1)}" width="${(rRhsStartX - rRhsEndX).toFixed(1)}" height="${rhsH.toFixed(1)}" fill="${rhsFill}" stroke="${rhsCol}" stroke-width="${RHS_T * sc * 0.5}"/>`;
  }

  // ── RAFTER SECTIONS — peak A-frame, side profile ──
  // Plumb cut at ridge (vertical) only — eave end unchanged (perpendicular to rafter).
  // Shifted down 75mm.
  const pitchRad    = pitchDeg * Math.PI / 180;
  const d           = 250 * sc;         // 250mm visible depth
  const bearY       = rhsTopY + 75 * sc; // shifted down 75mm
  const lBearX      = lRhsEndX;
  const rBearX      = rRhsEndX;

  // Ridge
  const halfRun  = midX - lBearX;
  const ridgeX   = midX;
  const ridgeY   = bearY - halfRun * Math.tan(pitchRad);

  // (unit vectors and lengths defined below after eaveTopY)

  // Plumb-cut ridge top: intersection of each top-face line with x = ridgeX
  const ridgeTopY = ridgeY - d / Math.cos(pitchRad);

  const poly = (pts: [number, number][], fill: string, stroke: string, sw = 0.8) => {
    const s = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return `<polygon points="${s}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  };

  // Rafter colours — blue (distinct from red standoffs)
  const rafterFill = 'rgba(33,150,243,0.18)';
  const rafterCol  = '#2196f3';

  // Plumb-cut eave top: straight up from bearing point
  const eaveTopY = bearY - d / Math.cos(pitchRad);

  // ── Unit vectors (defined here — used by insulation, purlins & cleats below) ──
  const lDxV = ridgeX - lBearX, lDyV = ridgeY - bearY;
  const lLen = Math.sqrt(lDxV*lDxV + lDyV*lDyV);
  const luX  = (lBearX - ridgeX) / lLen;   // -cos θ
  const luY  = (bearY  - ridgeY) / lLen;   //  sin θ
  const lnX  =  luY;                        //  sin θ  (into rafter)
  const lnY  = -luX;                        //  cos θ  (downward)

  const rDxV = rBearX - ridgeX, rDyV = bearY - ridgeY;
  const rLen = Math.sqrt(rDxV*rDxV + rDyV*rDyV);
  const ruX  = (rBearX - ridgeX) / rLen;   //  cos θ
  const ruY  = (bearY  - ridgeY) / rLen;   //  sin θ
  const rnX  = -ruY;                        // -sin θ  (into rafter)
  const rnY  =  ruX;                        //  cos θ  (downward)

  // Left rafter: plumb cut at both eave and ridge
  svg += poly([
    [lBearX, bearY    ],
    [ridgeX, ridgeY   ],
    [ridgeX, ridgeTopY],
    [lBearX, eaveTopY ],
  ], rafterFill, rafterCol, 0.8);

  // Right rafter: mirror
  svg += poly([
    [ridgeX, ridgeY   ],
    [rBearX, bearY    ],
    [rBearX, eaveTopY ],
    [ridgeX, ridgeTopY],
  ], rafterFill, rafterCol, 0.8);

  // ── RIDGE FLASHING — standard Australian angular ridge cap ──
  // Profile: 150mm legs each side, flat crown ~60mm, sits on top of roof sheets.
  // Reference: Lysaght/BlueScope standard angular ridge capping.
  const ridgeLegMm  = 150;
  const crownHalfMm = 30;   // half-crown width = 30mm each side of ridge
  const crownRiseMm = 18;   // crown rises ~18mm above sheet surface at ridge
  const capThickPx  = Math.max(1.5, 0.6 * sc);

  // These will be computed after insAndSheet is known — deferred below
  // ── (ridge flashing drawn after insulation/sheet so it sits on top) ──

  // ── BOTTOM CHORD — gable end frames (PF1 & PF3) only ──
  if (showBottomChord) {
    const bcH = bottomChordD * sc;
    svg += `<rect x="${lBearX.toFixed(1)}" y="${(bearY - bcH).toFixed(1)}" width="${(rBearX - lBearX).toFixed(1)}" height="${bcH.toFixed(1)}" fill="${rafterFill}" stroke="${rafterCol}" stroke-width="0.8"/>`;
  }

  // ── COLUMN — PF3 front only, at right rafter bearing ──
  // Replaces the right wall. Side profile: column width × full height from FFL to bearing.
  if (frameType === 'front') {
    const colW   = columnD * sc;
    const colInset = 35 * sc;           // 35mm in from the rafter end
    const colX2  = rBearX - colInset;   // outer face of column
    const colX1  = colX2 - colW;        // inner face
    const colCx  = (colX1 + colX2) / 2; // centre for base plate
    svg += `<rect x="${colX1.toFixed(1)}" y="${bearY.toFixed(1)}" width="${colW.toFixed(1)}" height="${(fflY - bearY).toFixed(1)}" fill="${rhsFill}" stroke="${rhsCol}" stroke-width="0.9"/>`;
    // Column base plate
    const bpW = colW * 1.6, bpH = 8;
    svg += `<rect x="${(colCx - bpW/2).toFixed(1)}" y="${(fflY - bpH).toFixed(1)}" width="${bpW.toFixed(1)}" height="${bpH}" fill="${rhsFill}" stroke="${rhsCol}" stroke-width="0.9"/>`;
  }

  // ── INSULATION + ROOF SHEET ──
  const insThickPx  = 75  * sc;
  const sheetPx     = Math.max(2.0, 0.6 * sc);
  const overlapPx   = 75  * sc;   // 75mm recommended overhang into gutter
  const insFill     = 'rgba(255,200,60,0.28)';
  const insStroke   = '#c8a010';
  const sheetFill   = 'rgba(160,200,220,0.85)';
  const sheetStroke = '#80b0c8';

  // Sky normal = opposite of into-rafter (left rafter): (-lnX, -lnY)
  const skyX = -lnX;  // -sin θ  (leftward)
  const skyY = -lnY;  // -cos θ  (upward in SVG)

  // ── Left insulation: ridge → eave, on rafter top ──
  const liB1: [number,number] = [lBearX, eaveTopY];
  const liB2: [number,number] = [ridgeX, ridgeTopY];
  const liT2: [number,number] = [ridgeX + skyX*insThickPx, ridgeTopY + skyY*insThickPx];
  const liT1: [number,number] = [lBearX + skyX*insThickPx, eaveTopY  + skyY*insThickPx];
  svg += poly([liB1, liB2, liT2, liT1], insFill, insStroke, 0.6);
  // Diagonal hatching — clipped to the insulation parallelogram
  const liPts = [liB1, liB2, liT2, liT1].map(p => p.join(',')).join(' ');
  svg += `<clipPath id="liClip"><polygon points="${liPts}"/></clipPath>`;
  svg += `<g clip-path="url(#liClip)">`;
  for (let t = -insThickPx; t < (ridgeX - lBearX + insThickPx * 2); t += 8) {
    const x1 = lBearX + t, y1 = eaveTopY + skyY*insThickPx - 4;
    const x2 = lBearX + t + insThickPx * 1.2, y2 = eaveTopY + 4;
    svg += ln(x1, y1, x2, y2, insStroke, 0.5);
  }
  svg += `</g>`;

  // ── Left roof sheet: on top of insulation, extends 40mm past eave ──
  const lSB1 = liT1;
  const lSB2 = liT2;
  const lSB3: [number,number] = [lBearX + skyX*insThickPx + luX*overlapPx,
                                  eaveTopY + skyY*insThickPx + luY*overlapPx];
  svg += poly(
    [[lSB2[0]+skyX*sheetPx, lSB2[1]+skyY*sheetPx] as [number,number],
     [lSB1[0]+skyX*sheetPx, lSB1[1]+skyY*sheetPx] as [number,number],
     [lSB3[0]+skyX*sheetPx, lSB3[1]+skyY*sheetPx] as [number,number],
     lSB3, lSB1, lSB2],
    sheetFill, sheetStroke, 0.8);

  // ── Right: sky normal = (-rnX, -rnY) = (sinθ, -cosθ) ──
  const rSkyX = -rnX;
  const rSkyY = -rnY;

  const riB1: [number,number] = [rBearX, eaveTopY];
  const riB2: [number,number] = [ridgeX, ridgeTopY];
  const riT2: [number,number] = [ridgeX + rSkyX*insThickPx, ridgeTopY + rSkyY*insThickPx];
  const riT1: [number,number] = [rBearX + rSkyX*insThickPx, eaveTopY  + rSkyY*insThickPx];
  svg += poly([riB1, riB2, riT2, riT1], insFill, insStroke, 0.6);
  // Diagonal hatching — clipped to right insulation parallelogram
  const riPts = [riB1, riB2, riT2, riT1].map(p => p.join(',')).join(' ');
  svg += `<clipPath id="riClip"><polygon points="${riPts}"/></clipPath>`;
  svg += `<g clip-path="url(#riClip)">`;
  for (let t = -insThickPx; t < (rBearX - ridgeX + insThickPx * 2); t += 8) {
    const x1 = ridgeX + t, y1 = ridgeTopY + rSkyY*insThickPx - 4;
    const x2 = ridgeX + t + insThickPx * 1.2, y2 = ridgeTopY + 4;
    svg += ln(x1, y1, x2, y2, insStroke, 0.5);
  }
  svg += `</g>`;

  // ── EAVE FLASHING — runs under roof sheet, down insulation end, folds to gutter ──
  // Colorbond/aluminium eave flashing protects insulation end face at the eave.
  // Path: under sheet → down insulation end face → fold out just above gutter → down to rolled lip.
  const flashCol  = '#b0c8d8';
  const flashSW   = 1.8;

  // Left flashing — down insulation face + 5mm, fold OUT 20mm, then drop
  const flashOut  = 30 * sc;     // 30mm horizontal fold
  const flashDrop = 40 * sc;     // 40mm drop after fold
  const lfP1: [number,number] = [lBearX + skyX*insThickPx, eaveTopY + skyY*insThickPx]; // top of insulation at eave
  const lfP2: [number,number] = [lBearX, eaveTopY];                                     // bottom of insulation (rafter top face)
  const lfP3: [number,number] = [lBearX, eaveTopY + 5*sc];                              // 5mm below insulation bottom
  const lfP4: [number,number] = [lBearX - flashOut, eaveTopY + 5*sc];                   // fold OUT 20mm toward exterior
  const lfP5: [number,number] = [lBearX - flashOut, eaveTopY + 5*sc + flashDrop];       // drop 20mm
  [
    [lfP1, lfP2], [lfP2, lfP3], [lfP3, lfP4], [lfP4, lfP5],
  ].forEach(([a, b]) => {
    svg += ln(a[0], a[1], b[0], b[1], flashCol, flashSW);
  });

  const rSB1 = riT1;
  const rSB2 = riT2;
  const rSB3: [number,number] = [rBearX + rSkyX*insThickPx + ruX*overlapPx,
                                  eaveTopY + rSkyY*insThickPx + ruY*overlapPx];
  svg += poly(
    [[rSB2[0]+rSkyX*sheetPx, rSB2[1]+rSkyY*sheetPx] as [number,number],
     [rSB1[0]+rSkyX*sheetPx, rSB1[1]+rSkyY*sheetPx] as [number,number],
     [rSB3[0]+rSkyX*sheetPx, rSB3[1]+rSkyY*sheetPx] as [number,number],
     rSB3, rSB1, rSB2],
    sheetFill, sheetStroke, 0.8);

  // Right flashing — omitted for PF3 front
  if (frameType !== 'front') {
  const rfP1: [number,number] = [rBearX + rSkyX*insThickPx, eaveTopY + rSkyY*insThickPx];
  const rfP2: [number,number] = [rBearX, eaveTopY];
  const rfP3: [number,number] = [rBearX, eaveTopY + 5*sc];
  const rfP4: [number,number] = [rBearX + flashOut, eaveTopY + 5*sc];   // fold OUT rightward 20mm
  const rfP5: [number,number] = [rBearX + flashOut, eaveTopY + 5*sc + flashDrop];
  [
    [rfP1, rfP2], [rfP2, rfP3], [rfP3, rfP4], [rfP4, rfP5],
  ].forEach(([a, b]) => {
    svg += ln(a[0], a[1], b[0], b[1], flashCol, flashSW);
  });
  } // end if frameType !== 'front'

  // ── RIDGE FLASHING — draw now that insAndSheet is known ──
  {
    const insAndSheet = insThickPx + sheetPx;
    const rlPx  = ridgeLegMm  * sc;  // 150mm leg
    const crHPx = crownHalfMm * sc;  // 30mm half-crown
    const crRPx = crownRiseMm * sc;  // 18mm rise

    // Sheet top at ridge (same Y both sides for symmetric gable)
    const shRY = ridgeTopY + skyY * insAndSheet;   // Y of sheet top at ridge

    // Left sheet top X at ridge
    const lShRX = ridgeX + skyX * insAndSheet;
    // Right sheet top X at ridge
    const rShRX = ridgeX + rSkyX * insAndSheet;

    // Left leg end (150mm down left slope, on sheet surface)
    const lLegX = lShRX + luX * rlPx;
    const lLegY = shRY  + luY * rlPx;
    // Right leg end
    const rLegX = rShRX + ruX * rlPx;
    const rLegY = shRY  + ruY * rlPx;

    // Crown top Y (rises crRPx above sheet surface at ridge)
    const crY = shRY - crRPx;

    const capFill   = 'rgba(190,210,220,0.92)';
    const capStroke = '#6888a0';

    // Ridge cap polygon — outer face then inner face (on sheets):
    // Outer: left-leg-outer → left-crown → crown-flat → right-crown → right-leg-outer
    // Inner: right-leg-on-sheet → right-sheet-at-ridge → left-sheet-at-ridge → left-leg-on-sheet
    svg += poly([
      // Outer face (going left to right across ridge)
      [lLegX + skyX*capThickPx,  lLegY + skyY*capThickPx   ] as [number,number], // left leg outer bottom
      [ridgeX - crHPx + skyX*capThickPx, crY               ] as [number,number], // left crown outer
      [ridgeX + crHPx + rSkyX*capThickPx, crY              ] as [number,number], // right crown outer
      [rLegX + rSkyX*capThickPx, rLegY + rSkyY*capThickPx  ] as [number,number], // right leg outer bottom
      // Inner face (sitting on sheets, going back right to left)
      [rLegX,  rLegY ] as [number,number],  // right leg on sheet
      [rShRX,  shRY  ] as [number,number],  // right at ridge on sheet
      [lShRX,  shRY  ] as [number,number],  // left at ridge on sheet
      [lLegX,  lLegY ] as [number,number],  // left leg on sheet
    ], capFill, capStroke, 0.8);

    // Small upward hem at each leg end (5mm return)
    const hemMm = 5 * sc;
    svg += ln(lLegX, lLegY, lLegX + skyX*hemMm, lLegY + skyY*hemMm, capStroke, 1.2);
    svg += ln(rLegX, rLegY, rLegX + rSkyX*hemMm, rLegY + rSkyY*hemMm, capStroke, 1.2);
  }

  // ── PURLIN END PROFILES — 5 per rafter, top flush with rafter top ──
  // 75mm from each end, 3 evenly spaced between. Shown as end cross-sections.
  const purlinCount  = 5;
  // purlin75 = 75 * sc — reserved for future purlin position drawing
  const pD           = purlinD  * sc;      // section depth px
  const pBf          = purlinBf * sc;      // flange width px (half each side of centre)
  const pT           = Math.max(1.2, purlinT * sc); // wall thickness px (min 1.2 visible)
  const purlinCol2   = '#4488cc';          // blue for purlins
  const purlinFill2  = 'rgba(68,136,204,0.25)';

  // (unit vectors luX/luY/lnX/lnY/ruX/ruY/rnX/rnY defined above in rafter section)

  // Left rafter positions from ridge (mm): 75, even×3, lLen_mm-75
  const lLen_mm  = lLen / sc;
  const lStep    = (lLen_mm - 150) / (purlinCount - 1);
  const lPosMm   = Array.from({length: purlinCount}, (_, i) => 75 + i * lStep);

  const drawPurlinSection = (
    cx: number, cy_top: number,   // centre point ON the rafter top face
    ux: number, uy: number,       // along-rafter unit vector (ridge→eave)
    nx: number, ny: number,       // into-rafter normal
    hw: number, depth: number, thick: number,
  ) => {
    // Outer rectangle (simplified C in end view — just filled rect with slight transparency)
    const p1 = [cx - hw*ux, cy_top - hw*uy] as [number,number];
    const p2 = [cx + hw*ux, cy_top + hw*uy] as [number,number];
    const p3 = [p2[0] + depth*nx, p2[1] + depth*ny] as [number,number];
    const p4 = [p1[0] + depth*nx, p1[1] + depth*ny] as [number,number];
    // Outer shell
    let s = poly([p1,p2,p3,p4], purlinFill2, purlinCol2, 0.8);
    // Inner void (hollow section — inset by wall thickness)
    const ix = thick * nx, iy = thick * ny;
    const iw = hw - thick;
    const iDepth = depth - 2 * thick;
    if (iDepth > 0.5 && iw > 0.3) {
      const ip1 = [cx - iw*ux + ix, cy_top - iw*uy + iy] as [number,number];
      const ip2 = [cx + iw*ux + ix, cy_top + iw*uy + iy] as [number,number];
      const ip3 = [ip2[0] + iDepth*nx, ip2[1] + iDepth*ny] as [number,number];
      const ip4 = [ip1[0] + iDepth*nx, ip1[1] + iDepth*ny] as [number,number];
      s += poly([ip1,ip2,ip3,ip4], 'rgba(15,16,20,0.7)', 'none', 0);
    }
    return s;
  };

  // LEFT RAFTER purlins
  for (const posMm of lPosMm) {
    const f   = posMm / lLen_mm;
    const cx  = ridgeX    + f * (lBearX - ridgeX);
    const cyt = ridgeTopY + f * (eaveTopY - ridgeTopY);  // on rafter top face
    svg += drawPurlinSection(cx, cyt, luX, luY, lnX, lnY, pBf/2, pD, pT);
  }

  // RIGHT RAFTER purlins (mirror)
  const rLen_mm = rLen / sc;
  const rStep   = (rLen_mm - 150) / (purlinCount - 1);
  const rPosMm  = Array.from({length: purlinCount}, (_, i) => 75 + i * rStep);
  for (const posMm of rPosMm) {
    const f   = posMm / rLen_mm;
    const cx  = ridgeX    + f * (rBearX - ridgeX);
    const cyt = ridgeTopY + f * (eaveTopY - ridgeTopY);
    svg += drawPurlinSection(cx, cyt, ruX, ruY, rnX, rnY, pBf/2, pD, pT);
  }

  // ── CLEAT FLAT BAR — 50×5mm, end profile inside each purlin at rafter interface ──
  // Shown as its cross-section: 5mm thick (visible width) × 50mm tall, at the interface.
  const cleatCol  = '#c8a030';                     // amber — distinguishable from blue purlin
  const cleatFill = 'rgba(200,160,48,0.55)';
  const cleatH    = 50  * sc;                      // 50mm height into rafter
  const cleatHw   = Math.max(1.5, (5 / 2) * sc);  // half of 5mm thickness — min 1.5px

  const drawCleat = (
    cx: number, cy_top: number,
    ux: number, uy: number,
    nx: number, ny: number,
    hw: number, depth: number,
  ) => {
    const c1 = [cx - hw*ux, cy_top - hw*uy] as [number,number];
    const c2 = [cx + hw*ux, cy_top + hw*uy] as [number,number];
    const c3 = [c2[0] + depth*nx, c2[1] + depth*ny] as [number,number];
    const c4 = [c1[0] + depth*nx, c1[1] + depth*ny] as [number,number];
    return poly([c1,c2,c3,c4], cleatFill, cleatCol, 0.8);
  };

  // Left rafter cleats — one per purlin, at the interface (cyt = rafter top face)
  for (const posMm of lPosMm) {
    const f   = posMm / lLen_mm;
    const cx  = ridgeX    + f * (lBearX - ridgeX);
    const cyt = ridgeTopY + f * (eaveTopY - ridgeTopY);
    svg += drawCleat(cx, cyt, luX, luY, lnX, lnY, cleatHw, cleatH);
  }

  // Right rafter cleats (mirrored)
  for (const posMm of rPosMm) {
    const f   = posMm / rLen_mm;
    const cx  = ridgeX    + f * (rBearX - ridgeX);
    const cyt = ridgeTopY + f * (eaveTopY - ridgeTopY);
    svg += drawCleat(cx, cyt, ruX, ruY, rnX, rnY, cleatHw, cleatH);
  }

  // ── VERTICAL CONNECTOR — 75×50 RHS, going UP from standoff end ──
  // 230mm long, both cuts at pitchDeg off horizontal (matching rafter plane).
  // Red, same section as standoff. Shown in side view: 50mm wide.
  const connW   = 75 * sc;        // 75mm visible width in side view
  const connL   = 230 * sc;       // 230mm length along vertical axis
  const connTan = Math.tan(pitchRad);
  const connBotY = brickTopY;     // aligned with bottom corner of standoff (down 75mm)

  // LEFT connector — 75mm wide, base at brickTopY, going UP 230mm
  // Rafter slopes UP to the RIGHT → right side of cut is higher (lower Y)
  const lcBL = [lRhsEndX,          connBotY                           ] as [number,number];
  const lcBR = [lRhsEndX + connW,  connBotY - connW * connTan         ] as [number,number];
  const lcTR = [lRhsEndX + connW,  connBotY - connL - connW * connTan ] as [number,number];
  const lcTL = [lRhsEndX,          connBotY - connL                   ] as [number,number];
  svg += poly([lcBL, lcBR, lcTR, lcTL], rhsFill, rhsCol, 0.8);

  // RIGHT connector — omitted for PF3 front
  if (frameType !== 'front') {
    const rcBR = [rRhsEndX,          connBotY                           ] as [number,number];
    const rcBL = [rRhsEndX - connW,  connBotY - connW * connTan         ] as [number,number];
    const rcTL = [rRhsEndX - connW,  connBotY - connL - connW * connTan ] as [number,number];
    const rcTR = [rRhsEndX,          connBotY - connL                   ] as [number,number];
    svg += poly([rcBR, rcBL, rcTL, rcTR], rhsFill, rhsCol, 0.8);
  }

  // (labels deferred — added after all geometry is complete)

  svg += `</svg>`;
  return svg;
}
