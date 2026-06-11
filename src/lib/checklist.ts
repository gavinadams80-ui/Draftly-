// ── Progressive handover / certification checklist ──
// One list that spans the whole pipeline — Site Intelligence → Engineering →
// Drafting → Certification. Items AUTO-TICK as the underlying data/docs arrive
// (computed from whatever state is present), so the list fills itself in as the
// job progresses. Engineering owns stages 1–2; the Drafting + Certification ticks
// travel in the designset (`carried`) and are merged back so the list keeps its
// state across the boundary, finishing with the surveyor + engineer sign-off.

export type ChecklistStage = 'intelligence' | 'engineering' | 'drafting' | 'certification';
export type ItemStatus = 'done' | 'todo' | 'na';

export interface ChecklistItem {
  id: string;
  stage: ChecklistStage;
  label: string;
  status: ItemStatus;
  required: boolean;   // a hard requirement for issue (vs a nice-to-have)
  detail?: string;     // short hint on what satisfies it / what's missing
}

// Everything buildChecklist needs, as primitives/booleans so the model stays
// decoupled from the app's live objects (and is trivially testable).
export interface ChecklistState {
  hasSite: boolean;
  address?: string;
  council?: string;
  zone?: string;
  maxHeight?: number;
  hasSetbacks: boolean;       // required setbacks OR measured offsets present
  hasLotGeometry: boolean;    // lot polygon (≥3 pts)
  overlaysCount: number;
  sitingComplianceKnown: boolean;
  heights: { gutter: boolean; fascia: boolean; ridge: boolean };
  hasConnectionDetail: boolean;
  windKpa: number;
  dimsSet: boolean;
  allMembersPass: boolean;
  lateralResolved: boolean;   // a bracing scheme is chosen and its check is OK
  compliance: { assessable: number; failCount: number } | null;
  hasComputations: boolean;
  // Drafting/Certification ticks returned in a handback designset (merged in).
  carried?: { id: string; status: ItemStatus }[];
}

const STAGE_LABEL: Record<ChecklistStage, string> = {
  intelligence: 'Site Intelligence',
  engineering: 'Engineering',
  drafting: 'Drafting',
  certification: 'Certification',
};
export const STAGE_ORDER: ChecklistStage[] = ['intelligence', 'engineering', 'drafting', 'certification'];
export const stageLabel = (s: ChecklistStage) => STAGE_LABEL[s];

const tick = (cond: boolean): ItemStatus => (cond ? 'done' : 'todo');

export function buildChecklist(s: ChecklistState): ChecklistItem[] {
  const c = s.compliance;
  const items: ChecklistItem[] = [
    // ── 1 · Site Intelligence (gathered upstream) ──
    { id: 'si-address', stage: 'intelligence', required: true, label: 'Site address & lot identified',
      status: tick(!!s.address), detail: s.address || 'import the Intelligence handoff' },
    { id: 'si-lot', stage: 'intelligence', required: true, label: 'Lot boundary geometry',
      status: tick(s.hasLotGeometry), detail: s.hasLotGeometry ? 'polygon present' : 'no lot polygon in handoff' },
    { id: 'si-planning', stage: 'intelligence', required: true, label: 'Planning rules (council, zone, height)',
      status: tick(!!s.council && (s.maxHeight !== undefined || !!s.zone)),
      detail: [s.council, s.zone, s.maxHeight !== undefined ? `≤${s.maxHeight} m` : undefined].filter(Boolean).join(' · ') || 'missing' },
    { id: 'si-setbacks', stage: 'intelligence', required: true, label: 'Setbacks / offsets recorded',
      status: tick(s.hasSetbacks), detail: s.hasSetbacks ? undefined : 'no setbacks or offsets' },
    { id: 'si-heights', stage: 'intelligence', required: true, label: 'Set-out heights carried (gutter/ridge)',
      status: tick(s.heights.gutter || s.heights.ridge), detail: 'for the wall section in Drafting' },
    { id: 'si-attachment', stage: 'intelligence', required: false, label: 'Per-side dwelling attachment captured',
      status: s.hasConnectionDetail ? 'done' : (s.hasSite ? 'na' : 'todo'),
      detail: s.hasConnectionDetail ? undefined : 'falls back to the attachment type' },
    { id: 'si-overlays', stage: 'intelligence', required: false, label: 'Site overlays identified',
      status: s.hasSite ? 'done' : 'todo', detail: s.overlaysCount > 0 ? `${s.overlaysCount} overlay(s) — review actions` : 'none flagged' },
    { id: 'si-compliance', stage: 'intelligence', required: false, label: 'Siting compliance verdict recorded',
      status: tick(s.sitingComplianceKnown) },

    // ── 2 · Engineering (this app) ──
    { id: 'en-dims', stage: 'engineering', required: true, label: 'Structure dimensions confirmed',
      status: tick(s.dimsSet) },
    { id: 'en-wind', stage: 'engineering', required: true, label: 'Design wind pressure set',
      status: tick(s.windKpa > 0), detail: `${s.windKpa} kPa` },
    { id: 'en-members', stage: 'engineering', required: true, label: 'All structural members pass',
      status: tick(s.allMembersPass), detail: s.allMembersPass ? undefined : 'a member is over-utilised' },
    { id: 'en-lateral', stage: 'engineering', required: true, label: 'Lateral stability / bracing designed',
      status: tick(s.lateralResolved), detail: s.lateralResolved ? undefined : 'resolve drift / diaphragm / brace' },
    { id: 'en-compliance', stage: 'engineering', required: true, label: 'As-engineered compliance clear',
      status: c ? (c.assessable > 0 && c.failCount === 0 ? 'done' : 'todo') : 'todo',
      detail: c ? (c.failCount > 0 ? `${c.failCount} fail` : c.assessable > 0 ? 'no fails' : 'no assessable checks') : 'needs site planning data' },
    { id: 'en-comps', stage: 'engineering', required: true, label: 'Structural computations generated',
      status: tick(s.hasComputations), detail: 'engineer-review calc sheet' },

    // ── 3 · Drafting (downstream — ticked there, carried back) ──
    { id: 'dr-drawings', stage: 'drafting', required: true, label: 'Drawing set generated', status: 'todo' },
    { id: 'dr-connections', stage: 'drafting', required: true, label: 'Connection details finalised', status: 'todo' },
    { id: 'dr-footings', stage: 'drafting', required: true, label: 'Footing / slab detail finalised', status: 'todo' },
    { id: 'dr-drainage', stage: 'drafting', required: false, label: 'Drainage layout finalised', status: 'todo' },

    // ── 4 · Certification (final issue) ──
    { id: 'ce-print', stage: 'certification', required: true, label: 'Final print issued', status: 'todo' },
    { id: 'ce-surveyor', stage: 'certification', required: true, label: 'Surveyor sign-off', status: 'todo' },
    { id: 'ce-engineer', stage: 'certification', required: true, label: 'Engineer certification', status: 'todo' },
  ];

  // Merge any carried Drafting/Certification ticks from a handback designset.
  if (s.carried && s.carried.length) {
    const map = new Map(s.carried.map((x) => [x.id, x.status] as const));
    for (const it of items) {
      const v = map.get(it.id);
      if (v) it.status = v;
    }
  }
  return items;
}

export interface ChecklistSummary {
  items: ChecklistItem[];
  byStage: { stage: ChecklistStage; label: string; done: number; total: number; items: ChecklistItem[] }[];
  doneCount: number;       // done or n/a across all
  totalCount: number;
  percent: number;         // overall progress 0–100
  // Handover gate = the required Intelligence + Engineering items (what Engineering
  // must finish before handing to Drafting). 'na' counts as satisfied.
  handoverOutstanding: ChecklistItem[];
  readyForHandover: boolean;
  requiredOutstanding: ChecklistItem[]; // every required item still 'todo' (whole pipeline)
}

const satisfied = (it: ChecklistItem) => it.status === 'done' || it.status === 'na';

export function summariseChecklist(items: ChecklistItem[]): ChecklistSummary {
  const byStage = STAGE_ORDER.map((stage) => {
    const its = items.filter((i) => i.stage === stage);
    return { stage, label: STAGE_LABEL[stage], items: its, total: its.length, done: its.filter(satisfied).length };
  });
  const doneCount = items.filter(satisfied).length;
  const totalCount = items.length;
  const handoverOutstanding = items.filter(
    (i) => (i.stage === 'intelligence' || i.stage === 'engineering') && i.required && !satisfied(i),
  );
  const requiredOutstanding = items.filter((i) => i.required && !satisfied(i));
  return {
    items, byStage,
    doneCount, totalCount,
    percent: totalCount ? Math.round((doneCount / totalCount) * 100) : 0,
    handoverOutstanding,
    readyForHandover: handoverOutstanding.length === 0,
    requiredOutstanding,
  };
}

/** Compact form for travelling in the designset (id + status only). */
export function serializeChecklist(items: ChecklistItem[]): { id: string; status: ItemStatus }[] {
  return items.map((i) => ({ id: i.id, status: i.status }));
}

// ── Self-checks ──
export function runChecklistChecks(): { name: string; pass: boolean; detail: string }[] {
  const out: { name: string; pass: boolean; detail: string }[] = [];
  const check = (name: string, pass: boolean, detail = '') => out.push({ name, pass, detail });

  // Empty project: nothing gathered → most items todo, not ready for handover.
  const empty = summariseChecklist(buildChecklist({
    hasSite: false, hasSetbacks: false, hasLotGeometry: false, overlaysCount: 0,
    sitingComplianceKnown: false, heights: { gutter: false, fascia: false, ridge: false },
    hasConnectionDetail: false, windKpa: 0, dimsSet: false, allMembersPass: false,
    lateralResolved: false, compliance: null, hasComputations: false,
  }));
  check('empty project is not ready for handover', !empty.readyForHandover && empty.handoverOutstanding.length > 0,
    `${empty.handoverOutstanding.length} outstanding`);

  // Fully gathered + engineered: stages 1–2 satisfied → ready to hand over,
  // but the whole pipeline isn't done (Drafting + Certification still todo).
  const ready = summariseChecklist(buildChecklist({
    hasSite: true, address: '1 Test St', council: 'Test Shire', zone: 'GRZ', maxHeight: 5,
    hasSetbacks: true, hasLotGeometry: true, overlaysCount: 1, sitingComplianceKnown: true,
    heights: { gutter: true, fascia: true, ridge: true }, hasConnectionDetail: true,
    windKpa: 0.74, dimsSet: true, allMembersPass: true, lateralResolved: true,
    compliance: { assessable: 4, failCount: 0 }, hasComputations: true,
  }));
  check('fully engineered → ready for handover', ready.readyForHandover, `${ready.handoverOutstanding.length} outstanding`);
  check('pipeline not complete until Drafting + Certification', ready.requiredOutstanding.length > 0 && ready.percent < 100,
    `${ready.percent}% · ${ready.requiredOutstanding.length} required left`);

  // A failing member un-ticks the engineering gate.
  const fail = summariseChecklist(buildChecklist({
    hasSite: true, address: 'x', council: 'c', zone: 'z', maxHeight: 5, hasSetbacks: true, hasLotGeometry: true,
    overlaysCount: 0, sitingComplianceKnown: true, heights: { gutter: true, fascia: false, ridge: true },
    hasConnectionDetail: true, windKpa: 0.74, dimsSet: true, allMembersPass: false, lateralResolved: true,
    compliance: { assessable: 4, failCount: 0 }, hasComputations: true,
  }));
  check('failing member blocks handover', !fail.readyForHandover && fail.handoverOutstanding.some((i) => i.id === 'en-members'),
    `${fail.handoverOutstanding.map((i) => i.id).join(',')}`);

  // Carried Drafting/Certification ticks are merged from a handback.
  const carried = buildChecklist({
    hasSite: true, address: 'x', council: 'c', zone: 'z', maxHeight: 5, hasSetbacks: true, hasLotGeometry: true,
    overlaysCount: 0, sitingComplianceKnown: true, heights: { gutter: true, fascia: true, ridge: true },
    hasConnectionDetail: true, windKpa: 0.74, dimsSet: true, allMembersPass: true, lateralResolved: true,
    compliance: { assessable: 4, failCount: 0 }, hasComputations: true,
    carried: [{ id: 'dr-drawings', status: 'done' }, { id: 'ce-surveyor', status: 'done' }],
  });
  const drDraw = carried.find((i) => i.id === 'dr-drawings');
  const ceSurv = carried.find((i) => i.id === 'ce-surveyor');
  check('carried handback ticks are merged', drDraw?.status === 'done' && ceSurv?.status === 'done',
    `dr-drawings=${drDraw?.status} ce-surveyor=${ceSurv?.status}`);

  return out;
}
