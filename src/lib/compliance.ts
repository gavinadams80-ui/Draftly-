// ── As-designed compliance re-check ──
// Intelligence runs a compliance pass against the *sited* structure. Once the
// structure is engineered here, dimensions can change (pitch, span, standoff →
// ridge height; footprint), so we re-validate the AS-DESIGNED structure against
// the council constraints carried in the handoff. This is what closes the
// compliance loop the handoff used to drop.

export interface ComplianceCheck {
  label: string;
  required: string;   // human-readable requirement
  actual: string;     // human-readable as-designed value
  pass: boolean | null; // null = insufficient data to assess
}

export interface AsDesignedInputs {
  maxHeight?: number;          // m — allowed (research.max_height)
  designedRidge?: number;      // m — as-designed highest point
  requiredSetbacks?: { front?: number; side?: number; rear?: number };
  actualOffsets?: { front?: number; rear?: number; left?: number; right?: number };
  siteCoverage?: number;       // % — allowed (research.site_coverage)
  footprintM2?: number;        // m² — as-designed building footprint
  siteAreaM2?: number;         // m² — lot area
}

const m  = (v?: number) => (v === undefined ? '—' : `${v.toFixed(2)} m`);
const m1 = (v?: number) => (v === undefined ? '—' : `${v.toFixed(1)} m`);

/** Build the as-designed compliance checklist. Side setback applies to both left & right. */
export function checkAsDesigned(i: AsDesignedInputs): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // ── Height ──
  if (i.maxHeight !== undefined) {
    const pass = i.designedRidge !== undefined ? i.designedRidge <= i.maxHeight + 1e-6 : null;
    checks.push({
      label: 'Building height',
      required: `≤ ${m1(i.maxHeight)}`,
      actual: i.designedRidge !== undefined ? `${m(i.designedRidge)} ridge` : '—',
      pass,
    });
  }

  // ── Setbacks (required vs actual offset) ──
  const req = i.requiredSetbacks ?? {};
  const act = i.actualOffsets ?? {};
  const setbackRow = (label: string, required?: number, actual?: number) => {
    if (required === undefined && actual === undefined) return;
    const pass = required !== undefined && actual !== undefined ? actual >= required - 1e-6 : null;
    checks.push({
      label: `${label} setback`,
      required: required !== undefined ? `≥ ${m1(required)}` : '—',
      actual: m(actual),
      pass,
    });
  };
  setbackRow('Front', req.front, act.front);
  setbackRow('Rear', req.rear, act.rear);
  setbackRow('Left', req.side, act.left);   // 'side' requirement applies to both flanks
  setbackRow('Right', req.side, act.right);

  // ── Site coverage ──
  if (i.siteCoverage !== undefined) {
    const actualPct = i.footprintM2 !== undefined && i.siteAreaM2 ? (i.footprintM2 / i.siteAreaM2) * 100 : undefined;
    const pass = actualPct !== undefined ? actualPct <= i.siteCoverage + 1e-6 : null;
    checks.push({
      label: 'Site coverage',
      required: `≤ ${i.siteCoverage.toFixed(0)}%`,
      actual: actualPct !== undefined ? `${actualPct.toFixed(1)}%` : '—',
      pass,
    });
  }

  return checks;
}

export interface ComplianceSummary {
  checks: ComplianceCheck[];
  passCount: number;
  failCount: number;
  unknownCount: number;
  allPass: boolean;     // true only if there is ≥1 check and none fail/unknown
  assessable: number;   // checks with a definite pass/fail
}

export function summarise(checks: ComplianceCheck[]): ComplianceSummary {
  const passCount = checks.filter(c => c.pass === true).length;
  const failCount = checks.filter(c => c.pass === false).length;
  const unknownCount = checks.filter(c => c.pass === null).length;
  const assessable = passCount + failCount;
  return {
    checks,
    passCount,
    failCount,
    unknownCount,
    assessable,
    allPass: checks.length > 0 && failCount === 0,
  };
}
