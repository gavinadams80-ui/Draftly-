// ── Portal Frame Analysis ──
// Exact 2D elastic frame analysis (direct stiffness method) of a symmetric
// pitched portal frame: two columns, two rafters meeting at an apex, with
// either PINNED or FIXED bases.
//
// Why this exists: the rest of the engine sizes every member as a simply-
// supported beam (M = wL²/8). That is correct for a TIED rafter/truss (the
// bottom chord takes the horizontal thrust). It is WRONG for an untied PORTAL
// frame, where the rigid knee joints develop a hogging knee moment, push that
// moment down the columns to the base, and generate a horizontal base thrust
// (spread). This module returns the real frame actions — knee/apex/rafter/
// column moments, base thrust, and vertical deflection — so the untied case
// can be sized against what actually happens, not a simple span.
//
// Units: lengths m, forces kN, moments kNm, E in MPa, I in mm⁴, A in m².
// Internally E is converted to kN/m² (×1000) and I to m⁴ (×1e-12).

export type BaseFixity = 'pinned' | 'fixed';

export interface PortalMemberProps {
  E: number;   // MPa
  I: number;   // mm⁴
  A: number;   // m²  (axial area; minor influence on moments)
}

export interface PortalFrameInput {
  span: number;        // m — eaves-to-eaves (building width)
  eaveHeight: number;  // m — column height to the knee
  pitchDeg: number;    // roof pitch, degrees (0 = flat)
  w: number;           // kN/m — gravity UDL per HORIZONTAL metre on the rafters (already load-factored)
  baseFixity: BaseFixity;
  column: PortalMemberProps;
  rafter: PortalMemberProps;
}

export interface PortalFrameResult {
  baseFixity: BaseFixity;
  span: number;
  eaveHeight: number;
  rise: number;          // m — ridge height above eaves
  rafterLength: number;  // m — sloped length of one rafter
  w: number;             // kN/m (horizontal)
  V: number;             // kN — vertical base reaction (each base) = wL/2
  H: number;             // kN — horizontal base thrust (each base, inward +)
  M_knee: number;        // kNm — |moment| at the eaves/knee joint
  M_apex: number;        // kNm — |moment| at the ridge/apex
  M_base: number;        // kNm — |moment| at the base (0 for pinned)
  M_rafterMax: number;   // kNm — max |moment| anywhere along a rafter (sizes the rafter)
  M_columnMax: number;   // kNm — max |moment| in a column (sizes the column)
  apexVertDelta: number; // mm — downward vertical deflection at the apex (serviceability)
  // Diagnostics
  nodeDisp: number[];    // raw nodal displacement vector [u,v,θ]×5 (m, m, rad)
}

// ── Small dense linear solver: Gaussian elimination with partial pivoting ──
function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  // Work on copies
  const M = A.map((row) => row.slice());
  const x = b.slice();
  for (let col = 0; col < n; col++) {
    // Pivot
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-18) continue; // singular/constrained row — skip
    if (piv !== col) { [M[piv], M[col]] = [M[col], M[piv]]; [x[piv], x[col]] = [x[col], x[piv]]; }
    const d = M[col][col];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      if (f === 0) continue;
      for (let c = col; c < n; c++) M[r][c] -= f * M[col][c];
      x[r] -= f * x[col];
    }
  }
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (Math.abs(M[i][i]) > 1e-18) out[i] = x[i] / M[i][i];
  }
  return out;
}

// 6×6 local stiffness for a prismatic 2D frame element.
function localK(EA: number, EI: number, L: number): number[][] {
  const a = EA / L;
  const b1 = 12 * EI / (L * L * L);
  const b2 = 6 * EI / (L * L);
  const b3 = 4 * EI / L;
  const b4 = 2 * EI / L;
  return [
    [ a, 0, 0, -a, 0, 0],
    [ 0, b1, b2, 0, -b1, b2],
    [ 0, b2, b3, 0, -b2, b4],
    [-a, 0, 0, a, 0, 0],
    [ 0, -b1, -b2, 0, b1, -b2],
    [ 0, b2, b4, 0, -b2, b3],
  ];
}

// Transformation matrix (global → local) for member at angle φ (c=cosφ, s=sinφ).
function transform(c: number, s: number): number[][] {
  return [
    [ c, s, 0, 0, 0, 0],
    [-s, c, 0, 0, 0, 0],
    [ 0, 0, 1, 0, 0, 0],
    [ 0, 0, 0, c, s, 0],
    [ 0, 0, 0, -s, c, 0],
    [ 0, 0, 0, 0, 0, 1],
  ];
}

function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length, m = B[0].length, k = B.length;
  const C = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++)
    for (let p = 0; p < k; p++) {
      const aip = A[i][p];
      if (aip === 0) continue;
      for (let j = 0; j < m; j++) C[i][j] += aip * B[p][j];
    }
  return C;
}
function matT(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map((row) => row[j]));
}
function matVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
}

/**
 * Analyse a symmetric pitched portal frame under a gravity UDL.
 *
 * Node layout (x right, y up), origin at the left base:
 *   N0 (0,0) left base · N1 (0,h) left knee · N2 (L/2, h+rise) apex
 *   N3 (L,h) right knee · N4 (L,0) right base
 * Elements: E0 N0-N1 (col) · E1 N1-N2 (rafter) · E2 N2-N3 (rafter) · E3 N3-N4 (col)
 */
export function calcPortalFrame(inp: PortalFrameInput): PortalFrameResult {
  const { span: L, eaveHeight: h, pitchDeg, w, baseFixity } = inp;
  const pitch = (pitchDeg * Math.PI) / 180;
  const rise = (L / 2) * Math.tan(pitch);
  const rafterLen = (L / 2) / Math.cos(pitch);

  // Element material/section → consistent units
  const colEI = inp.column.E * 1000 * inp.column.I * 1e-12; // kN·m²
  const rafEI = inp.rafter.E * 1000 * inp.rafter.I * 1e-12;
  const colEA = inp.column.E * 1000 * inp.column.A;          // kN
  const rafEA = inp.rafter.E * 1000 * inp.rafter.A;

  const nodes = [
    [0, 0],
    [0, h],
    [L / 2, h + rise],
    [L, h],
    [L, 0],
  ];
  // [ni, nj, EA, EI, hasUDL]
  const elems: [number, number, number, number, boolean][] = [
    [0, 1, colEA, colEI, false],
    [1, 2, rafEA, rafEI, true],
    [2, 3, rafEA, rafEI, true],
    [3, 4, colEA, colEI, false],
  ];

  const nDof = nodes.length * 3;
  const K = Array.from({ length: nDof }, () => new Array(nDof).fill(0));
  const F = new Array(nDof).fill(0);

  // Gravity UDL: w per horizontal metre → per rafter member length, vertical
  // intensity q_v = w·cosα (so q_v·rafterLen = w·(L/2)). Apply as global (0,-q_v).
  const q_v = w * Math.cos(pitch);

  // Keep per-element data for force recovery
  const elemData: { dofs: number[]; kl: number[][]; T: number[][]; fefLocal: number[] }[] = [];

  for (const [ni, nj, EA, EI, hasUDL] of elems) {
    const [xi, yi] = nodes[ni];
    const [xj, yj] = nodes[nj];
    const dx = xj - xi, dy = yj - yi;
    const Lm = Math.hypot(dx, dy);
    const c = dx / Lm, s = dy / Lm;

    const kl = localK(EA, EI, Lm);
    const T = transform(c, s);
    const kg = matMul(matMul(matT(T), kl), T); // global element stiffness

    const dofs = [ni * 3, ni * 3 + 1, ni * 3 + 2, nj * 3, nj * 3 + 1, nj * 3 + 2];

    // Fixed-end forces from a global distributed load (0, -q_v) per member length
    let fefLocal = [0, 0, 0, 0, 0, 0];
    if (hasUDL) {
      // global load per length → local components
      const qlx = c * 0 + s * -q_v;       // load along local x
      const qly = -s * 0 + c * -q_v;       // load along local y (transverse)
      // {FEF} = fixed-end REACTIONS (forces restraining the member) = −(load resultants).
      // This sign makes both the equivalent-load assembly P = −[T]ᵀ{FEF} and the
      // member-force recovery q = [k][T]{d} + {FEF} come out physically correct.
      fefLocal = [
        -(qlx * Lm) / 2,
        -(qly * Lm) / 2,
        -(qly * Lm * Lm) / 12,
        -(qlx * Lm) / 2,
        -(qly * Lm) / 2,
        (qly * Lm * Lm) / 12,
      ];
      // Equivalent nodal load applied to the structure = -(T^T · {FEF})
      const fefGlobal = matVec(matT(T), fefLocal);
      for (let a = 0; a < 6; a++) F[dofs[a]] -= fefGlobal[a];
    }

    // Assemble
    for (let a = 0; a < 6; a++)
      for (let bb = 0; bb < 6; bb++) K[dofs[a]][dofs[bb]] += kg[a][bb];

    elemData.push({ dofs, kl, T, fefLocal });
  }

  // Boundary conditions: penalty method (large stiffness on constrained DOFs).
  // Bases N0, N4. Pinned: u,v fixed. Fixed: u,v,θ fixed.
  const constrained: number[] = [0, 1, 12, 13]; // u,v of N0 and N4
  if (baseFixity === 'fixed') constrained.push(2, 14); // θ of N0, N4
  // Pick a penalty relative to the largest diagonal term
  let kmax = 0;
  for (let i = 0; i < nDof; i++) kmax = Math.max(kmax, Math.abs(K[i][i]));
  const PEN = kmax * 1e8;
  for (const d of constrained) { K[d][d] += PEN; F[d] = 0; }

  const disp = solveLinear(K, F);

  // ── Recover element end moments (local) ──
  // f_local = k_local · (T · d_global) + fefLocal ; local moments at indices 2,5
  const endMoments: { Mi: number; Mj: number; rafterTransverseQ: number; Lm: number }[] = [];
  elemData.forEach(({ dofs, kl, T, fefLocal }, idx) => {
    const dg = dofs.map((d) => disp[d]);
    const dl = matVec(T, dg);
    const fl = matVec(kl, dl).map((v, i) => v + fefLocal[i]);
    const [ni, nj] = [elems[idx][0], elems[idx][1]];
    const Lm = Math.hypot(nodes[nj][0] - nodes[ni][0], nodes[nj][1] - nodes[ni][1]);
    // transverse UDL magnitude in local frame (for span-moment search on rafters)
    const qly = elems[idx][4] ? Math.cos(pitch) * -q_v : 0; // local-y intensity (negative)
    endMoments.push({ Mi: fl[2], Mj: fl[5], rafterTransverseQ: qly, Lm });
  });

  // Knee = top of left column (E0 Mj) and start of left rafter (E1 Mi) — equal & opposite in equilibrium
  const M_knee = Math.abs(endMoments[0].Mj);
  const M_apex = Math.abs(endMoments[1].Mj); // left rafter end at apex
  const M_base = baseFixity === 'fixed' ? Math.abs(endMoments[0].Mi) : 0;
  const M_columnMax = Math.max(M_knee, M_base);

  // Max moment along a rafter: end moments + parabola from transverse UDL.
  // M(x) = Mi_signed·(1 - x/L) ... but simplest: M(x) linear-from-ends + q·x·(L-x)/2.
  // Use signed end moments with sagging-positive parabola.
  const e1 = endMoments[1];
  // Convert local nodal end moments (CCW-positive) to bending moments (sagging +):
  // BM at the i-end = −Mi_nodal, BM at the j-end = +Mj_nodal.
  const BMi = -e1.Mi, BMj = e1.Mj, Lm = e1.Lm;
  const q = Math.abs(e1.rafterTransverseQ); // |kN/m| transverse UDL on rafter
  // Bending moment along the member = linear end-moment line + simply-supported
  // parabola of the member's own UDL. Sample for the max |M|.
  let M_rafterMax = Math.max(Math.abs(BMi), Math.abs(BMj));
  const N = 20;
  for (let k = 1; k < N; k++) {
    const x = (k / N) * Lm;
    const Mlin = BMi + ((BMj - BMi) * x) / Lm;
    const Mparab = (q * x * (Lm - x)) / 2;
    const Mx = Mlin + Mparab;
    if (Math.abs(Mx) > M_rafterMax) M_rafterMax = Math.abs(Mx);
  }

  // Reactions: R = K_orig·d − F_applied. Recompute base horizontal/vertical from penalty DOFs.
  // With penalty, reaction at a constrained DOF ≈ PEN·(−disp) ... but disp≈0 there.
  // Cleaner: sum element end forces into the base nodes.
  // Vertical reaction each base = wL/2 by statics.
  const V = (w * L) / 2;
  // Horizontal thrust: take left column base local axial/shear → global x reaction.
  // Recover E0 end forces in global, read node N0 x-force.
  const e0 = elemData[0];
  const dg0 = e0.dofs.map((d) => disp[d]);
  const dl0 = matVec(e0.T, dg0);
  const fl0 = matVec(e0.kl, dl0).map((v, i) => v + e0.fefLocal[i]);
  const fg0 = matVec(matT(e0.T), fl0); // global end forces [Fxi,Fyi,Mi,Fxj,Fyj,Mj]
  const H = Math.abs(fg0[0]); // horizontal force at N0

  // Apex vertical deflection (node N2 v-DOF), m → mm (downward positive)
  const apexVertDelta = -disp[2 * 3 + 1] * 1000;

  return {
    baseFixity, span: L, eaveHeight: h, rise, rafterLength: rafterLen, w,
    V, H, M_knee, M_apex, M_base, M_rafterMax, M_columnMax, apexVertDelta,
    nodeDisp: disp,
  };
}

export interface PortalLateralResult {
  H_lateral: number;   // kN — total horizontal load applied at the eaves
  swayMm: number;      // mm — horizontal drift at the eaves
  M_kneeLat: number;   // kNm — knee moment from sway (max of the two knees)
  M_columnLat: number; // kNm — max column moment from sway (knee or base)
  M_baseLat: number;   // kNm — base moment (0 for pinned)
  baseShear: number;   // kN — horizontal reaction summed at the two bases
}

/**
 * Lateral (wind/notional) analysis of the same pitched portal: a horizontal
 * load H applied at the windward eaves makes the frame SWAY. Returns the drift
 * and the sway-induced knee/column/base moments — the actions the gravity-only
 * model misses. Pure horizontal nodal load (no member UDL → no fixed-end forces).
 */
export function calcPortalLateral(inp: PortalFrameInput, H_lateral: number): PortalLateralResult {
  const { span: L, eaveHeight: h, pitchDeg, baseFixity } = inp;
  const pitch = (pitchDeg * Math.PI) / 180;
  const rise = (L / 2) * Math.tan(pitch);

  const colEI = inp.column.E * 1000 * inp.column.I * 1e-12;
  const rafEI = inp.rafter.E * 1000 * inp.rafter.I * 1e-12;
  const colEA = inp.column.E * 1000 * inp.column.A;
  const rafEA = inp.rafter.E * 1000 * inp.rafter.A;

  const nodes = [[0, 0], [0, h], [L / 2, h + rise], [L, h], [L, 0]];
  const elems: [number, number, number, number][] = [
    [0, 1, colEA, colEI],
    [1, 2, rafEA, rafEI],
    [2, 3, rafEA, rafEI],
    [3, 4, colEA, colEI],
  ];

  const nDof = nodes.length * 3;
  const K = Array.from({ length: nDof }, () => new Array(nDof).fill(0));
  const F = new Array(nDof).fill(0);
  const elemData: { dofs: number[]; kl: number[][]; T: number[][] }[] = [];

  for (const [ni, nj, EA, EI] of elems) {
    const dx = nodes[nj][0] - nodes[ni][0], dy = nodes[nj][1] - nodes[ni][1];
    const Lm = Math.hypot(dx, dy);
    const c = dx / Lm, s = dy / Lm;
    const kl = localK(EA, EI, Lm);
    const T = transform(c, s);
    const kg = matMul(matMul(matT(T), kl), T);
    const dofs = [ni * 3, ni * 3 + 1, ni * 3 + 2, nj * 3, nj * 3 + 1, nj * 3 + 2];
    for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) K[dofs[a]][dofs[b]] += kg[a][b];
    elemData.push({ dofs, kl, T });
  }

  // Horizontal load at the windward eaves (node N1, u-DOF = index 3)
  F[3] += H_lateral;

  const constrained: number[] = [0, 1, 12, 13];
  if (baseFixity === 'fixed') constrained.push(2, 14);
  let kmax = 0;
  for (let i = 0; i < nDof; i++) kmax = Math.max(kmax, Math.abs(K[i][i]));
  const PEN = kmax * 1e8;
  for (const d of constrained) { K[d][d] += PEN; F[d] = 0; }

  const disp = solveLinear(K, F);

  // Sway = horizontal drift at the eaves (average of the two eaves nodes)
  const swayMm = ((disp[3] + disp[9]) / 2) * 1000;

  // Element end moments (no FEF term for a nodal-load-only case)
  const Mend = elemData.map(({ dofs, kl, T }) => {
    const dl = matVec(T, dofs.map((d) => disp[d]));
    const fl = matVec(kl, dl);
    return { Mi: fl[2], Mj: fl[5] };
  });
  // Knees: top of each column (E0 Mj, E3 Mi)
  const M_kneeLat = Math.max(Math.abs(Mend[0].Mj), Math.abs(Mend[3].Mi));
  const M_baseLat = baseFixity === 'fixed' ? Math.max(Math.abs(Mend[0].Mi), Math.abs(Mend[3].Mj)) : 0;
  const M_columnLat = Math.max(M_kneeLat, M_baseLat);

  return { H_lateral, swayMm: Math.abs(swayMm), M_kneeLat, M_columnLat, M_baseLat, baseShear: Math.abs(H_lateral) };
}
