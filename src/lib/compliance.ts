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
  rule: string;       // plain-English rule being applied (the "why")
  note?: string;      // margin reasoning for this specific result
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

  // ── Height ── (smaller is safer: must be at or under the limit)
  if (i.maxHeight !== undefined) {
    const pass = i.designedRidge !== undefined ? i.designedRidge <= i.maxHeight + 1e-6 : null;
    let note: string | undefined;
    if (i.designedRidge !== undefined) {
      const margin = i.maxHeight - i.designedRidge;
      note = margin >= 0 ? `${margin.toFixed(2)} m below limit` : `${(-margin).toFixed(2)} m over limit`;
    }
    checks.push({
      label: 'Building height',
      required: `≤ ${m1(i.maxHeight)}`,
      actual: i.designedRidge !== undefined ? `${m(i.designedRidge)} ridge` : '—',
      pass,
      rule: 'The highest point (ridge) of the as-engineered roof must not exceed the council height limit.',
      note,
    });
  }

  // ── Setbacks (required vs actual offset; bigger is safer: must meet or exceed) ──
  const req = i.requiredSetbacks ?? {};
  const act = i.actualOffsets ?? {};
  const setbackRow = (label: string, required?: number, actual?: number) => {
    if (required === undefined && actual === undefined) return;
    const pass = required !== undefined && actual !== undefined ? actual >= required - 1e-6 : null;
    let note: string | undefined;
    if (required !== undefined && actual !== undefined) {
      const margin = actual - required;
      note = margin >= 0 ? `${margin.toFixed(2)} m clearance` : `${(-margin).toFixed(2)} m short`;
    }
    checks.push({
      label: `${label} setback`,
      required: required !== undefined ? `≥ ${m1(required)}` : '—',
      actual: m(actual),
      pass,
      rule: `The measured distance from the structure to the ${label.toLowerCase()} boundary must be at least the required planning setback.`,
      note,
    });
  };
  setbackRow('Front', req.front, act.front);
  setbackRow('Rear', req.rear, act.rear);
  setbackRow('Left', req.side, act.left);   // 'side' requirement applies to both flanks
  setbackRow('Right', req.side, act.right);

  // ── Site coverage ── (smaller is safer: must be at or under the limit)
  if (i.siteCoverage !== undefined) {
    const actualPct = i.footprintM2 !== undefined && i.siteAreaM2 ? (i.footprintM2 / i.siteAreaM2) * 100 : undefined;
    const pass = actualPct !== undefined ? actualPct <= i.siteCoverage + 1e-6 : null;
    let note: string | undefined;
    if (actualPct !== undefined) {
      const margin = i.siteCoverage - actualPct;
      note = margin >= 0 ? `${margin.toFixed(1)}% headroom` : `${(-margin).toFixed(1)}% over`;
    }
    checks.push({
      label: 'Site coverage',
      required: `≤ ${i.siteCoverage.toFixed(0)}%`,
      actual: actualPct !== undefined ? `${actualPct.toFixed(1)}%` : '—',
      pass,
      rule: 'Total building footprint as a percentage of the lot area must not exceed the council coverage limit.',
      note,
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
