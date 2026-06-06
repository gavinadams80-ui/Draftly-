import { useState, useMemo, useCallback, Fragment } from 'react';
import type {
  ProjectConfig, MemberForms, MemberOverrides, MemberForm,
  ConstructionType, BuildingType, RoofType, AttachmentType,
  UtilResult,
} from '@/types';
import {
  getSectionDB,
} from '@/lib/sections';
import {
  calcUtilisation, filterByForm,
  lightestPassing, getAvailableForms, getBracingFactor,
  BUILDING_TYPES, MATERIAL_LABELS, STANDARDS,
  ROOFING_PROFILES, getRoofingProfile,
  CLADDING_TYPES, calcGableInfill,
  getConnectionsForMember,
} from '@/lib/engine';
import { generateThreeViewSVG, generateGableInfillSVG } from '@/lib/drawings';
import { generateBuildingPlanSVG, generateRoofGeometrySVG } from '@/lib/planDrawings';
import { withTitleBlock, DEFAULT_TITLE_BLOCK, type TitleBlockData } from '@/lib/titleBlock';
import { generateCornerPostSVG, generateRafterLedgerSVG, generateCrossBracingSVG } from '@/lib/connectionDrawings';
import { generateSocketJointSVG, generateFasciaPenetrationSVG } from '@/lib/socketJointDrawing';
import { generateWallSectionSVG } from '@/lib/wallSection';
import { generateFullElevationSVG } from '@/lib/fullElevation';
import { parseHandoff } from '@/lib/handoffSchema';
import { checkAsDesigned, summarise } from '@/lib/compliance';
import { normalizeOverlays, getOverlayGuidance, type NormalizedOverlay } from '@/lib/overlays';
import { generateSitePlanSVG, type LatLng } from '@/lib/sitePlan';
import type { ExportSheet } from '@/lib/exportPdf';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import './App.css';

// ── Default state ──
const DEFAULT_CONFIG: ProjectConfig = {
  buildingType: 'pergola',
  constructionType: 'csection',
  attachment: 'three-side',
  roofType: 'gable',
  width: 9.27,
  depth: 5.77,
  height: 3.5,
  pitch: 10,
  portalFrameCount: 3,
};

const DEFAULT_FORMS: MemberForms = {
  post: 'open',
  beam: 'open',
  purlin: 'open',
  ledger: 'open',
  fascia: 'open',
  gableChord: 'open',
  gableDropper: 'open',
  gableTopChord: 'open',   // rafter sized as truss top chord (compression)
};

const DEFAULT_OVERRIDES: MemberOverrides = {
  post: null,
  beam: null,
  purlin: null,
  ledger: null,
  fascia: null,
  gableChord: null,
  gableDropper: null,
  gableTopChord: null,
};

// ── Status badge helper ──
function StatusBadge({ util }: { util: number }) {
  const status = util < 70 ? 'PASS' : util < 85 ? 'PASS' : util < 100 ? 'MARGINAL' : 'FAIL';
  const color = util < 70 ? '#4caf50' : util < 85 ? '#8bc34a' : util < 100 ? '#ff9800' : '#f44336';
  const bg = util < 70 ? 'rgba(76,175,80,0.12)' : util < 85 ? 'rgba(139,195,26,0.12)' : util < 100 ? 'rgba(255,152,0,0.12)' : 'rgba(244,67,54,0.12)';
  return (
    <span style={{
      fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 700, color,
      background: bg, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.04em',
    }}>
      {status} {util.toFixed(1)}%
    </span>
  );
}

// ── Member Card ──
function MemberCard({
  label, icon, result, dropdown, onFormChange, availableForms, currentForm,
}: {
  label: string;
  icon: string;
  result: UtilResult | null;
  dropdown: React.ReactNode;
  onFormChange: (form: string) => void;
  availableForms: { value: string; label: string }[];
  currentForm: string;
}) {
  const [open, setOpen] = useState(false);
  if (!result) {
    return (
      <Card style={{ background: 'var(--surface2)', borderColor: 'var(--border2)' }}>
        <CardContent className="p-3">
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>
            {icon} {label}
          </div>
          <div style={{ color: '#f44336', fontSize: '12px', marginTop: 4 }}>No sections available</div>
        </CardContent>
      </Card>
    );
  }

  const u = result.util;
  // Prominent colour coding: green < 70%, light-green 70-85%, amber 85-100%, red > 100%
  const bg       = u < 70 ? 'rgba(76,175,80,0.14)' : u < 85 ? 'rgba(139,195,26,0.12)' : u < 100 ? 'rgba(255,152,0,0.10)' : 'rgba(244,67,54,0.10)';
  const borderCol = u < 70 ? 'rgba(76,175,80,0.55)' : u < 85 ? 'rgba(139,195,26,0.50)' : u < 100 ? 'rgba(255,152,0,0.55)' : 'rgba(244,67,54,0.55)';
  const svgBg    = u < 70 ? 'rgba(76,175,80,0.06)' : u < 85 ? 'rgba(139,195,26,0.05)' : u < 100 ? 'rgba(255,152,0,0.05)' : 'rgba(244,67,54,0.05)';
  const statusColor = u < 70 ? '#4caf50' : u < 85 ? '#8bc34a' : u < 100 ? '#ff9800' : '#f44336';

  const svgHtml = result.sec ? generateThreeViewSVG(result.sec, statusColor, currentForm as MemberForm) : '';

  return (
    <Card style={{ background: bg, border: `1.5px solid ${borderCol}` }}>
      <CardContent className="p-3">
        {/* Header — click to expand/collapse */}
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}
          title={open ? 'Collapse' : 'Expand for full detail'}
        >
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
          <StatusBadge util={u} />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 2 }}>{open ? '▾' : '▸'}</span>
        </button>

        {/* Section thumbnail — clipped to a tidy height when collapsed */}
        <div
          onClick={() => setOpen((o) => !o)}
          style={{ background: svgBg, borderRadius: '4px', padding: '4px', marginBottom: 8, border: `1px solid ${borderCol}`, maxHeight: open ? 'none' : 116, overflow: 'hidden', cursor: 'pointer' }}
        >
          <div dangerouslySetInnerHTML={{ __html: svgHtml }} />
        </div>

        {/* Identity line — always visible */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text)', fontWeight: 600 }}>{result.sec.size}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{result.sec.wt} kg/m</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: open ? 8 : 0 }}>
          {result.sec.grade}
        </div>

        {/* Detail — only when expanded */}
        {open && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '10px', fontFamily: 'var(--mono)', marginBottom: 8 }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '3px 6px', borderRadius: '3px', color: 'var(--text-muted)' }}>
                M <span style={{ color: 'var(--text)' }}>{result.M.toFixed(2)}</span> kNm
              </div>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '3px 6px', borderRadius: '3px', color: 'var(--text-muted)' }}>
                M&#x03C6; <span style={{ color: statusColor }}>{result.MCap.toFixed(2)}</span> kNm
              </div>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '3px 6px', borderRadius: '3px', color: 'var(--text-muted)' }}>
                &#x03B4; <span style={{ color: 'var(--text)' }}>{result.delta.toFixed(1)}</span> mm
              </div>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '3px 6px', borderRadius: '3px', color: 'var(--text-muted)' }}>
                &#x03B4;max <span style={{ color: 'var(--text)' }}>{result.deltaMax.toFixed(1)}</span> mm
              </div>
            </div>

            {/* Member Form selector */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 3 }}>
                Member form
              </label>
              <select
                value={currentForm}
                onChange={(e) => onFormChange(e.target.value)}
                style={{
                  width: '100%', padding: '6px 8px', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '4px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer',
                }}
              >
                {availableForms.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {dropdown}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Small pill badge for the site constraints banner ──
function Chip({ label, warn = false }: { label: string; warn?: boolean }) {
  return (
    <span style={{
      fontSize: '10px', fontFamily: 'var(--mono)', padding: '2px 8px', borderRadius: '4px',
      background: warn ? 'rgba(224,108,108,0.12)' : 'rgba(255,255,255,0.06)',
      color: warn ? '#e06c6c' : 'var(--text-muted)',
      border: `1px solid ${warn ? 'rgba(224,108,108,0.3)' : 'var(--border)'}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ── Intelligence handoff payload (subset we care about) ──
interface SiteConstraints {
  address: string;
  zone?: string;
  council?: string;
  maxHeight?: number;   // metres
  setbacks?: { front?: number; side?: number; rear?: number };   // required (planning)
  offsets?: { front?: number; rear?: number; left?: number; right?: number }; // actual measured
  siteCoverage?: number; // %
  siteAreaM2?: number;   // lot area from siting tool
  overlays?: NormalizedOverlay[];
  confidence?: string;
  importedCompliance?: { approved?: boolean; passCount?: number; totalChecks?: number };
  // Site-plan geometry (drawn by Engineering; sent by Intelligence)
  lotPts?: LatLng[];
  footprint?: LatLng[];
  frontBoundaryIndex?: number;
}

// Map Intelligence projectType strings → Engineering BuildingType enum
const PROJECT_TYPE_MAP: Record<string, BuildingType> = {
  pergola: 'pergola', carport: 'carport', shed: 'shed',
  verandah: 'verandah', extension: 'extension', deck: 'deck', patio: 'patio',
  'new dwelling': 'extension', house: 'extension', garage: 'carport',
  'granny flat': 'extension', 'secondary dwelling': 'extension',
};

// ── Wizard steps (top nav + prev/next at bottom) ──
const STEPS = [
  { id: 'structure', label: 'Structure' },
  { id: 'members',   label: 'Member Sizing' },
  { id: 'frames',    label: 'Portal Frames' },
  { id: 'drawings',  label: 'Drawings' },
] as const;

// ── Main App ──
export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG);
  const [forms, setForms] = useState<MemberForms>(DEFAULT_FORMS);
  const [overrides, setOverrides] = useState<MemberOverrides>(DEFAULT_OVERRIDES);
  const [selectedProfile, setSelectedProfile] = useState('trimdek-42');
  const [showAllPassing, setShowAllPassing] = useState(false);
  const [activeTab, setActiveTab] = useState('structure');
  const [selectedCladding, setSelectedCladding] = useState('poly-twin-10');
  const [standoff, setStandoff] = useState(150);        // mm — standoff from house fascia
  const [leftSetback, setLeftSetback] = useState(0);    // m — right-side wall stops this far from front (0 = full depth)
  const [rightSetback, setRightSetback] = useState(1.8); // m — right-side wall stops this far from front
  const [titleBlock, setTitleBlock] = useState<TitleBlockData>(DEFAULT_TITLE_BLOCK);
  const [siteConstraints, setSiteConstraints] = useState<SiteConstraints | null>(null);
  const [northRotation, setNorthRotation] = useState(0); // degrees clockwise, 0 = north up
  const updateTB = useCallback((patch: Partial<TitleBlockData>) =>
    setTitleBlock(prev => ({ ...prev, ...patch })), []);

  const importIntelligenceProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseHandoff(e.target?.result as string);
      if (!parsed.ok || !parsed.data) {
        alert(parsed.error ?? 'Could not read project file — make sure it is a valid Draftly Intelligence export.');
        return;
      }
      const payload = parsed.data;
      const b = payload.boundaries?.building ?? {};
      const r = payload.research ?? {};
      const s = payload.site ?? {};
      const o = payload.boundaries?.offsets;

      // Pre-fill dimensions from building footprint (validator already coerced to numbers)
      const patch: Partial<ProjectConfig> = {};
      if (b.width !== undefined) patch.width = b.width;
      if (b.depth !== undefined) patch.depth = b.depth;
      if (b.height !== undefined) patch.height = b.height;

      // Map project type
      const rawType = (s.projectType ?? '').toLowerCase();
      const mappedType = PROJECT_TYPE_MAP[rawType];
      if (mappedType) patch.buildingType = mappedType;

      // Attachment type from siting tool
      const att = payload.boundaries?.attachment;
      if (att === 'freestanding' || att === 'attached' || att === 'three-side') {
        patch.attachment = att as AttachmentType;
      }

      // Pitch and eave height from siting tool
      if (b.pitch !== undefined)        patch.pitch  = b.pitch;
      if (b.gutterHeight !== undefined) patch.height = b.gutterHeight;

      // Drive plan-drawing wall setbacks from the ACTUAL measured offsets (left/right
      // are the side flanks). Previously these were ignored and hand-typed.
      if (o?.left  !== undefined) setLeftSetback(o.left);
      if (o?.right !== undefined) setRightSetback(o.right);

      // Pre-fill title block with site address + council
      if (s.fullAddress || r.council) {
        updateTB({
          projectName: s.fullAddress ?? '',
          propertyAddress: s.fullAddress ?? '',
          council: r.council ?? '',
          date: new Date().toLocaleDateString('en-AU'),
        });
      }

      if (typeof payload.boundaries?.northBearing === 'number') {
        setNorthRotation(payload.boundaries.northBearing);
      }

      setConfig(prev => ({ ...prev, ...patch }));
      setOverrides({ post: null, beam: null, purlin: null, ledger: null, fascia: null, gableChord: null, gableDropper: null, gableTopChord: null } as MemberOverrides);

      // Store site constraints — including the offsets and Intelligence's own
      // compliance verdict, which are carried through (no longer dropped).
      setSiteConstraints({
        address: s.fullAddress ?? '',
        zone: r.zone,
        council: r.council,
        maxHeight: r.max_height,
        setbacks: r.setbacks ? { front: r.setbacks.front, side: r.setbacks.side, rear: r.setbacks.rear } : undefined,
        offsets: o ? { front: o.front, rear: o.rear, left: o.left, right: o.right } : undefined,
        siteCoverage: r.site_coverage,
        siteAreaM2: payload.boundaries?.site?.areaM2 ?? undefined,
        overlays: normalizeOverlays(r.overlays),
        confidence: r.confidence,
        lotPts: payload.boundaries?.site?.lotPts,
        footprint: payload.boundaries?.building?.footprint,
        frontBoundaryIndex: payload.boundaries?.site?.frontBoundaryIndex,
        importedCompliance: payload.compliance ? {
          approved: payload.compliance.approved,
          passCount: payload.compliance.passCount,
          totalChecks: payload.compliance.totalChecks,
        } : undefined,
      });

      setActiveTab('structure');
    };
    reader.readAsText(file);
  }, [updateTB]);

  const updateConfig = useCallback((patch: Partial<ProjectConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateForm = useCallback((member: keyof MemberForms | string, form: string) => {
    setForms((prev) => ({ ...prev, [member]: form }));
  }, []);

  const setOverride = useCallback((member: keyof MemberOverrides, size: string | null) => {
    setOverrides((prev) => ({ ...prev, [member]: size }));
  }, []);

  const resetOverrides = useCallback(() => {
    setOverrides(DEFAULT_OVERRIDES);
  }, []);

  // ── As-designed compliance re-check against carried-through site constraints ──
  const compliance = useMemo(() => {
    if (!siteConstraints) return null;
    // As-designed ridge height: eave height + roof rise over the clear span.
    const actualSpan = Math.max(0.5, config.width - 2 * (standoff / 1000));
    const isGable = config.roofType === 'gable';
    const rise = (isGable ? actualSpan / 2 : actualSpan) * Math.tan(config.pitch * Math.PI / 180);
    const designedRidge = config.height + rise;
    const footprintM2 = config.width * config.depth;

    const checks = checkAsDesigned({
      maxHeight: siteConstraints.maxHeight,
      designedRidge,
      requiredSetbacks: siteConstraints.setbacks,
      actualOffsets: siteConstraints.offsets,
      siteCoverage: siteConstraints.siteCoverage,
      footprintM2,
      siteAreaM2: siteConstraints.siteAreaM2,
    });
    if (!checks.length) return null;
    return summarise(checks);
  }, [siteConstraints, config.width, config.depth, config.height, config.pitch, config.roofType, standoff]);

  const [isExporting, setIsExporting] = useState(false);

  // ── Engineering calculations ──
  const calc = useMemo(() => {
    const sections = getSectionDB(config.constructionType);
    const bracingFactor = getBracingFactor(config.attachment);

    // Actual structural span = brick-to-brick width minus standoff on each side
    const actualSpan = Math.max(0.5, config.width - 2 * (standoff / 1000));

    const effectiveSpan = actualSpan * Math.sqrt(bracingFactor);
    const postSpan = config.attachment === 'three-side' ? actualSpan * 0.25 : effectiveSpan;

    const profile = getRoofingProfile(selectedProfile);
    const purlinSpacing = profile.internalSpan / 1000;

    const frameSpacing = config.depth / (config.portalFrameCount - 1);
    const phi = config.constructionType === 'timber' ? 0.85 : config.constructionType === 'aluminium' ? 0.65 : 0.90;

    // ── POST (column) ──
    const postFiltered = filterByForm(sections.posts, forms.post);
    const postResults = calcUtilisation(
      postFiltered.length ? postFiltered : sections.posts,
      config.height, 1.5, config.constructionType,
      { memberForm: forms.post }
    );
    let selPost = overrides.post ? postResults.find((r) => r.sec.size === overrides.post) || null : null;
    if (!selPost) selPost = lightestPassing(postResults);

    // ── BEAM (rafter) ── uses actual structural span (minus standoff)
    const beamFiltered = filterByForm(sections.beams || sections.rafters, forms.beam);
    const beamResults = calcUtilisation(
      beamFiltered.length ? beamFiltered : sections.beams || sections.rafters,
      actualSpan, 1.5, config.constructionType,
      { memberForm: forms.beam }
    );
    let selBeam = overrides.beam ? beamResults.find((r) => r.sec.size === overrides.beam) || null : null;
    if (!selBeam) selBeam = lightestPassing(beamResults);

    // ── PURLIN ── spans between portal frames
    const purlinFiltered = filterByForm(sections.rafters, forms.purlin);
    const purlinResults = calcUtilisation(
      purlinFiltered.length ? purlinFiltered : sections.rafters,
      frameSpacing, purlinSpacing, config.constructionType,
      { isPurlin: true, memberForm: forms.purlin }
    );
    let selPurlin = overrides.purlin ? purlinResults.find((r) => r.sec.size === overrides.purlin) || null : null;
    if (!selPurlin) selPurlin = lightestPassing(purlinResults);

    // ── LEDGER ── attached to house wall, spans between portal frame rafters
    // The ledger is an outrigger off the house. It spans frame-to-frame.
    const ledgerFiltered = filterByForm(sections.beams || sections.rafters, forms.ledger);
    const ledgerResults = calcUtilisation(
      ledgerFiltered.length ? ledgerFiltered : sections.beams || sections.rafters,
      frameSpacing, purlinSpacing / 2, config.constructionType,
      { memberForm: forms.ledger }
    );
    let selLedger = overrides.ledger ? ledgerResults.find((r) => r.sec.size === overrides.ledger) || null : null;
    if (!selLedger) selLedger = lightestPassing(ledgerResults);

    // ── FASCIA ── outrigger at open gable end, spans between portal frame rafters
    // Same span as ledger — frame-to-frame with standoff brackets
    const fasciaFiltered = filterByForm(sections.beams || sections.rafters, forms.fascia);
    const fasciaResults = calcUtilisation(
      fasciaFiltered.length ? fasciaFiltered : sections.beams || sections.rafters,
      frameSpacing, purlinSpacing / 2, config.constructionType,
      { memberForm: forms.fascia }
    );
    let selFascia = overrides.fascia ? fasciaResults.find((r) => r.sec.size === overrides.fascia) || null : null;
    if (!selFascia) selFascia = lightestPassing(fasciaResults);

    // ── GABLE BOTTOM CHORD ── tie beam in tension; bending only between droppers
    // Effective bending span = dropper spacing ≈ cladding panel width (~927mm).
    // NOT the full gable width — the chord is a tension member, not a beam.
    // Use purlinSpacing as a conservative proxy for dropper spacing.
    const chordBendingSpan = purlinSpacing; // ~1.35m — bending between dropper attachment pts
    const gableChordFiltered = filterByForm(sections.beams || sections.rafters, forms.gableChord);
    const gableChordResults = calcUtilisation(
      gableChordFiltered.length ? gableChordFiltered : sections.beams || sections.rafters,
      chordBendingSpan, frameSpacing / 2, config.constructionType,
      { memberForm: forms.gableChord }
    );
    let selGableChord = overrides.gableChord ? gableChordResults.find((r) => r.sec.size === overrides.gableChord) || null : null;
    if (!selGableChord) selGableChord = lightestPassing(gableChordResults);

    // ── GABLE DROPPER ── net clear height between rafter bottom face and chord top face
    const dropperHeight = (actualSpan / 2) * Math.tan(config.pitch * Math.PI / 180);
    const pitchRad = config.pitch * Math.PI / 180;
    const rafterClear = (selBeam?.sec.d ?? 0) / 1000 / Math.cos(pitchRad);
    const chordClear  = (selGableChord?.sec.d ?? 0) / 1000;
    const netDropperH = Math.max(0.05, dropperHeight - rafterClear - chordClear);
    const gableDropperFiltered = filterByForm(sections.posts, forms.gableDropper);
    const gableDropperResults = calcUtilisation(
      gableDropperFiltered.length ? gableDropperFiltered : sections.posts,
      Math.max(netDropperH, 0.1), frameSpacing, config.constructionType,
      { memberForm: forms.gableDropper }
    );
    let selGableDropper = overrides.gableDropper ? gableDropperResults.find((r) => r.sec.size === overrides.gableDropper) || null : null;
    if (!selGableDropper) selGableDropper = lightestPassing(gableDropperResults);

    // ── GABLE TOP CHORD (TRUSS) ── rafter sized as compression strut
    // In a tied portal (triangulated), the rafter carries axial compression.
    // Critical buckling length = purlin spacing (purlins provide lateral restraint).
    // Use beam sections db; span = purlinSpacing gives conservative capacity proxy.
    const gableTopChordFiltered = filterByForm(sections.beams || sections.rafters, forms.gableTopChord);
    const gableTopChordResults = calcUtilisation(
      gableTopChordFiltered.length ? gableTopChordFiltered : sections.beams || sections.rafters,
      purlinSpacing, frameSpacing / 2, config.constructionType,
      { memberForm: forms.gableTopChord }
    );
    let selGableTopChord = overrides.gableTopChord
      ? gableTopChordResults.find((r) => r.sec.size === overrides.gableTopChord) || null
      : null;
    if (!selGableTopChord) selGableTopChord = lightestPassing(gableTopChordResults);

    // Axial compression in top chord: H = w·L²/(8·h), F = H/cos(θ)
    const roofUDL = 0.6; // kN/m² — conservative DL + LL for truss analysis
    const H_thrust = roofUDL * actualSpan * actualSpan / (8 * (dropperHeight || 0.01));
    const topChordAxialKN = H_thrust / Math.cos(pitchRad);

    return {
      postResults, beamResults, purlinResults, ledgerResults, fasciaResults,
      gableChordResults, gableDropperResults, gableTopChordResults,
      selPost, selBeam, selPurlin, selLedger, selFascia,
      selGableChord, selGableDropper, selGableTopChord,
      postSpan, frameSpacing, purlinSpacing, bracingFactor, phi,
      dropperHeight, netDropperH, topChordAxialKN,
    };
  }, [config, forms, overrides, selectedProfile]);

  // ── Submission drawing set — single source for the on-screen sheets and the PDF ──
  const submissionSheets = useMemo<(ExportSheet & { description?: string })[]>(() => {
    const sheets: (ExportSheet & { description?: string })[] = [];

    // Site plan — only when Intelligence has sent lot geometry.
    if (siteConstraints?.lotPts && siteConstraints.lotPts.length >= 3) {
      const planSvg = generateSitePlanSVG({
        lotPts: siteConstraints.lotPts,
        areaM2: siteConstraints.siteAreaM2,
        footprint: siteConstraints.footprint,
        offsets: siteConstraints.offsets,
        frontBoundaryIndex: siteConstraints.frontBoundaryIndex,
        council: siteConstraints.council,
        buildingWidth: config.width,
        buildingDepth: config.depth,
      });
      if (planSvg) {
        sheets.push({
          title: 'Site Plan — Structure on Lot', number: 'S-000',
          svg: withTitleBlock(planSvg, titleBlock, 'Site Plan — Structure on Lot', 'S-000', 1, 1, 'NTS'),
          description: 'Lot boundary with the proposed structure positioned to the measured setbacks. Boundary lengths, lot area and north shown.',
        });
      }
    }

    const planDesc =
      'Structure in plan relative to the existing dwelling. ' +
      (config.attachment === 'three-side' ? 'Three-side attached — wraps the corner of the house. '
        : config.attachment === 'attached' ? 'Attached — fixed along one wall. '
        : 'Freestanding — independent structure with 4 posts. ') +
      'Portal frames shown with post locations and purlin lines.';

    sheets.push({
      title: 'Plan View — Structure Layout', number: 'S-001',
      svg: withTitleBlock(generateBuildingPlanSVG(
        config.width, config.depth, config.height, config.pitch,
        config.attachment, config.portalFrameCount, config.roofType === 'gable',
        standoff / 1000, leftSetback, rightSetback, calc.purlinSpacing, northRotation,
      ), titleBlock, 'Plan View — Structure Layout', 'S-001', 1, 1, 'NTS'),
      description: planDesc,
    });

    sheets.push({
      title: 'Roof Geometry Diagram', number: 'S-002',
      svg: withTitleBlock(generateRoofGeometrySVG(
        config.width, config.pitch, config.height, config.roofType === 'gable',
        calc.selBeam?.sec.size ?? null, calc.selLedger?.sec.size ?? null, standoff / 1000,
      ), titleBlock, 'Roof Geometry — Side View', 'S-002', 1, 1, 'NTS'),
      description: 'Triangular geometry showing span, rise and rafter length. Pitch angles marked; gable apex = half-span × tan(pitch).',
    });

    sheets.push({
      title: 'Section A-A — Portal Frame 1 · Back (House Connection)', number: 'S-003',
      svg: withTitleBlock(generateWallSectionSVG(
        config.depth * 1000, config.pitch,
        calc.selPurlin?.sec.d ?? 100, calc.selPurlin?.sec.b ?? 50, calc.selPurlin?.sec.t ?? 1.5,
        true, calc.selLedger?.sec.d ?? 150, 'back',
      ), titleBlock, 'Section A-A — PF1 Back (House Connection)', 'S-003', 1, 3, 'NTS'),
    });

    sheets.push({
      title: 'Section A-A — Portal Frame 2 · Intermediate (Middle)', number: 'S-004',
      svg: withTitleBlock(generateWallSectionSVG(
        config.depth * 1000, config.pitch,
        calc.selPurlin?.sec.d ?? 100, calc.selPurlin?.sec.b ?? 50, calc.selPurlin?.sec.t ?? 1.5,
      ), titleBlock, 'Section A-A — PF2 Intermediate', 'S-004', 2, 3, 'NTS'),
    });

    sheets.push({
      title: 'Section A-A — Portal Frame 3 · Front (Fascia End)', number: 'S-005',
      svg: withTitleBlock(generateWallSectionSVG(
        config.depth * 1000, config.pitch,
        calc.selPurlin?.sec.d ?? 100, calc.selPurlin?.sec.b ?? 50, calc.selPurlin?.sec.t ?? 1.5,
        true, calc.selLedger?.sec.d ?? 150, 'front', calc.selPost?.sec.d ?? 100,
      ), titleBlock, 'Section A-A — PF3 Front (Fascia End)', 'S-005', 3, 3, 'NTS'),
    });

    sheets.push({
      title: 'Full Detail Elevation — Wall (A-A) · Socket Joint (B-B) · Post (C-C)', number: 'S-006',
      svg: withTitleBlock(generateFullElevationSVG(), titleBlock, 'Full Detail Elevation', 'S-006', 1, 1, 'NTS'),
      description: 'Three-panel detail elevation per AS1100. Left: dwelling wall at eave with 65×65 SHS standoff. Centre: socket joint — 50×50 stub with packers. Right: corner post base with concrete pad and anchors.',
    });

    return sheets;
  }, [config, standoff, leftSetback, rightSetback, calc, northRotation, titleBlock, siteConstraints]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const { exportSheetsToPDF } = await import('@/lib/exportPdf'); // lazy: keeps jsPDF out of the initial bundle
      const base = (titleBlock.projectName || 'draftly').replace(/[^\w-]+/g, '-').slice(0, 40).replace(/^-+|-+$/g, '');
      await exportSheetsToPDF(submissionSheets, `${base || 'draftly'}-drawings.pdf`);
    } catch (err) {
      alert('PDF export failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  }, [submissionSheets, titleBlock.projectName]);

  // ── Gable infill calculation ──
  const gableInfill = useMemo(() => {
    const actualSpanG = Math.max(0.5, config.width - 2 * (standoff / 1000));
    const dropperHeight = (actualSpanG / 2) * Math.tan(config.pitch * Math.PI / 180);
    return calcGableInfill(
      actualSpanG,
      dropperHeight,
      config.pitch,
      selectedCladding,
      0.5,
      calc.selBeam?.sec.d ?? 0,       // rafter depth — deducted from top
      calc.selGableChord?.sec.d ?? 0, // bottom chord depth — deducted from base
    );
  }, [config.width, config.pitch, selectedCladding, calc.selBeam, calc.selGableChord]);

  // ── Dropdown builder ──
  function buildDropdown(member: keyof MemberOverrides, results: UtilResult[], selected: UtilResult | null) {
    if (!results.length) return <select disabled style={{ width: '100%', padding: '6px', fontSize: '11px' }}><option>No sections</option></select>;
    return (
      <select
        value={overrides[member] || selected?.sec.size || ''}
        onChange={(e) => setOverride(member, e.target.value || null)}
        style={{
          width: '100%', padding: '6px 8px', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '4px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer',
        }}
      >
        <option value="">Auto-select smallest passing</option>
        {results.map((r) => {
          const marker = r.passed ? '✓' : '✗';
          const isSel = selected && r.sec.size === selected.sec.size;
          return (
            <option key={r.sec.size} value={r.sec.size} style={{ color: r.color }}>
              {r.sec.size} {marker} {r.util.toFixed(1)}%{isSel ? ' ★' : ''}
            </option>
          );
        })}
      </select>
    );
  }

  const isPortal = config.constructionType === 'csection' || config.constructionType === 'steel';
  // Form-aware labels
  const formTag = (f: MemberForm) => f === 'rhs' ? 'RHS' : f === 'plate' ? 'C+PLATE' : f === 'b2b' ? 'B2B' : 'C open';
  const purlinLabel = `PURLIN (${formTag(forms.purlin)})`;
  const postLabel = `COLUMN (${formTag(forms.post)})`;
  const beamLabel = `${isPortal ? 'RAFTER' : 'BEAM'} (${formTag(forms.beam)})`;

  // Check for all-fail condition
  const allFail = calc.postResults.length && !calc.selPost?.passed &&
                  calc.beamResults.length && !calc.selBeam?.passed &&
                  calc.purlinResults.length && !calc.selPurlin?.passed;

  return (
    <div className="app-container">
      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-mark">
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111210" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/>
              </svg>
            </div>
            <span className="logo-name">Draftly</span>
          </div>
          <span className="logo-tagline">Structural Designer</span>
        </div>
        <div className="header-right">
          <Badge variant="outline" style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.06em' }}>
            {STANDARDS[config.constructionType]}
          </Badge>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--mono)',
            background: 'var(--accent)', color: '#fff', fontWeight: 600, letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}>
            ↑ Import Site
            <input
              type="file" accept=".json" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importIntelligenceProject(f); e.target.value = ''; }}
            />
          </label>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="app-main">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* ── STEP NAV (top, sticky) ── */}
          <TabsList className="tabs-custom" style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--bg, #111210)' }}>
            {STEPS.map((s, idx) => (
              <TabsTrigger key={s.id} value={s.id} className="tab-trigger">
                <span style={{ opacity: 0.5, marginRight: 6, fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</span>{s.label}
              </TabsTrigger>
            ))}
          </TabsList>

        {/* ── INFO PANEL ── */}
        <div className="info-panel">
          Each structural member is designed independently for the selected material system. Use{' '}
          <strong>Member form</strong> on each card to choose the section family (open C, back-to-back C, RHS/SHS).{' '}
          The calculator recommends the smallest member in that family that passes the span and load;{' '}
          you can override it via the dropdown.
        </div>

        {/* ── SITE CONSTRAINTS BANNER ── */}
        {siteConstraints && (
          <div style={{
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.35)',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
            display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
              Site
            </span>
            {siteConstraints.address && (
              <span style={{ fontSize: '11px', color: 'var(--text)', marginRight: 8, flex: '1 1 200px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {siteConstraints.address}
              </span>
            )}
            {siteConstraints.zone && (
              <Chip label={`Zone: ${siteConstraints.zone}`} />
            )}
            {siteConstraints.council && (
              <Chip label={siteConstraints.council} />
            )}
            {siteConstraints.maxHeight !== undefined && (
              <Chip label={`Max H: ${siteConstraints.maxHeight}m`} warn={config.height > siteConstraints.maxHeight} />
            )}
            {siteConstraints.setbacks && (
              <>
                {siteConstraints.setbacks.front !== undefined && <Chip label={`F: ${siteConstraints.setbacks.front}m`} />}
                {siteConstraints.setbacks.side !== undefined && <Chip label={`S: ${siteConstraints.setbacks.side}m`} />}
                {siteConstraints.setbacks.rear !== undefined && <Chip label={`R: ${siteConstraints.setbacks.rear}m`} />}
              </>
            )}
            {siteConstraints.siteCoverage !== undefined && (
              <Chip label={`Cov: ${siteConstraints.siteCoverage}%`} />
            )}
            {siteConstraints.overlays?.map(o => <Chip key={o.name} label={o.name} warn />)}
            {siteConstraints.confidence === 'low' && (
              <Chip label="Low confidence" warn />
            )}
            <button
              onClick={() => setSiteConstraints(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '2px 4px' }}
              title="Dismiss"
            >×</button>
          </div>
        )}

        {/* ── AS-DESIGNED COMPLIANCE PANEL ── */}
        {compliance && (
          <div style={{
            background: 'var(--surface)', border: `1px solid ${compliance.failCount > 0 ? 'rgba(224,108,108,0.45)' : 'rgba(109,184,122,0.4)'}`,
            borderRadius: '8px', padding: '12px 14px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                As-Designed Compliance
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                engineering re-check
              </span>
              <span style={{
                fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                color: compliance.failCount > 0 ? '#e06c6c' : '#6db87a',
                background: compliance.failCount > 0 ? 'rgba(224,108,108,0.12)' : 'rgba(109,184,122,0.12)',
              }}>
                {compliance.passCount}/{compliance.assessable} PASS
                {compliance.failCount > 0 && ` · ${compliance.failCount} FAIL`}
              </span>
              {compliance.unknownCount > 0 && (
                <Chip label={`${compliance.unknownCount} need data`} />
              )}
              {siteConstraints?.importedCompliance && (
                <span
                  title="The verdict Site Intelligence recorded when the structure was first positioned on the lot. This panel re-checks the structure as it is now engineered, which can differ."
                  style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginLeft: 'auto', cursor: 'help' }}
                >
                  Site Intelligence (at siting): {siteConstraints.importedCompliance.approved ? '✅ approved' : '❌ issues'}
                  {siteConstraints.importedCompliance.passCount !== undefined &&
                    ` (${siteConstraints.importedCompliance.passCount}/${siteConstraints.importedCompliance.totalChecks})`}
                </span>
              )}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
              How the structure <em>as engineered here</em> measures against {siteConstraints?.council || 'the council'}'s planning rules.{' '}
              <strong style={{ color: '#6db87a' }}>PASS</strong> = the rule is satisfied — setbacks must be <strong>≥</strong> the required distance; height and site coverage must be <strong>≤</strong> the limit.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,0.9fr) 0.8fr minmax(150px,1.3fr) 64px', gap: '5px 12px', fontSize: '11px', fontFamily: 'var(--mono)', alignItems: 'baseline' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Check</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Required</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>As designed</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Result</div>
              {compliance.checks.map((c) => {
                const col = c.pass === false ? '#e06c6c' : c.pass === true ? '#6db87a' : 'var(--text-muted)';
                return (
                  <Fragment key={c.label}>
                    <div style={{ color: 'var(--text)', cursor: 'help' }} title={c.rule}>{c.label}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{c.required}</div>
                    <div style={{ color: 'var(--text)' }}>
                      {c.actual}
                      {c.note && <span style={{ color: col, marginLeft: 6, fontSize: '10px' }}>({c.note})</span>}
                    </div>
                    <div style={{ color: col, textAlign: 'right', fontWeight: 700 }}>
                      {c.pass === false ? '✗ FAIL' : c.pass === true ? '✓ PASS' : '—'}
                    </div>
                  </Fragment>
                );
              })}
            </div>
            {/* Reconcile the two verdicts so 5/5-approved-but-1-fail isn't confusing */}
            {siteConstraints?.importedCompliance?.approved && compliance.failCount > 0 && (
              <div style={{
                fontSize: '10px', color: '#e06c6c', marginTop: 10, padding: '6px 10px',
                background: 'rgba(224,108,108,0.08)', border: '1px solid rgba(224,108,108,0.25)', borderRadius: '6px', lineHeight: 1.5,
              }}>
                ⚠ Site Intelligence approved this at the <strong>siting</strong> stage, but the <strong>as-engineered</strong> re-check finds {compliance.failCount} issue{compliance.failCount > 1 ? 's' : ''}. The dimensions or measured setbacks have changed since siting — resolve {compliance.failCount > 1 ? 'these' : 'this'} before submission.
              </div>
            )}
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>
              Ridge height is computed from the engineered pitch + clear span. Setbacks are the measured offsets carried over from Site Intelligence. Hover a check for the rule applied.
            </div>
          </div>
        )}

        {/* ── SITE OVERLAYS — ACTION REQUIRED ── */}
        {siteConstraints?.overlays && siteConstraints.overlays.length > 0 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid rgba(224,108,108,0.35)',
            borderRadius: '8px', padding: '12px 14px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Site Overlays — Action Required
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                {siteConstraints.overlays.length} flagged
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
              These planning overlays apply extra controls to the site. Each is summarised below with what it means and the steps to keep your design compliant. Always confirm the specifics with {siteConstraints.council || 'your council'}.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {siteConstraints.overlays.map((o) => {
                const g = getOverlayGuidance(o);
                const sev = g.severity === 'critical' ? '#e06c6c' : g.severity === 'caution' ? 'var(--accent)' : 'var(--text-muted)';
                const sevBg = g.severity === 'critical' ? 'rgba(224,108,108,0.12)' : g.severity === 'caution' ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.06)';
                return (
                  <div key={o.name} style={{
                    background: 'var(--surface2)', borderRadius: '6px', padding: '12px',
                    borderLeft: `3px solid ${sev}`, border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{g.title}</span>
                      <span style={{
                        fontSize: '9px', fontFamily: 'var(--mono)', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                        color: sev, background: sevBg, textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {g.severityLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 10 }}>
                      {g.whatItMeans}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                          What it means for your design
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: '11px', color: 'var(--text)', lineHeight: 1.6 }}>
                          {g.designImplications.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>

                      <div>
                        <div style={{ fontSize: '9px', color: '#6db87a', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                          Your action plan
                        </div>
                        <ol style={{ margin: 0, paddingLeft: 18, fontSize: '11px', color: 'var(--text)', lineHeight: 1.6 }}>
                          {g.actions.map((a, i) => <li key={i}>{a}</li>)}
                        </ol>
                      </div>

                      {g.draftlyHelps && (
                        <div style={{
                          fontSize: '10px', color: 'var(--text)', lineHeight: 1.5,
                          background: 'rgba(109,184,122,0.08)', border: '1px solid rgba(109,184,122,0.25)',
                          borderRadius: '6px', padding: '8px 10px',
                        }}>
                          <strong style={{ color: '#6db87a' }}>✓ Draftly helps:</strong> {g.draftlyHelps}
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 10, lineHeight: 1.5 }}>
                      Refs: {g.standards.join(' · ')}
                      {g.sourceUrl && <> · <a href={g.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>council source</a></>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

          {/* ── TAB: STRUCTURE CONFIG ── */}
          <TabsContent value="structure">
            <div className="config-grid">
              {/* Building Type */}
              <div className="config-card">
                <label className="config-label">Building Type</label>
                <div className="building-grid">
                  {BUILDING_TYPES.map((bt) => (
                    <button
                      key={bt.id}
                      className={`building-btn ${config.buildingType === bt.id ? 'active' : ''}`}
                      onClick={() => {
                        updateConfig({
                          buildingType: bt.id as BuildingType,
                          width: bt.defaultSpan,
                          depth: bt.defaultDepth,
                          height: bt.defaultHeight,
                        });
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{bt.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>{bt.name}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{bt.complexity}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Construction Type */}
              <div className="config-card">
                <label className="config-label">Frame Material</label>
                <div className="material-grid">
                  {(['timber', 'steel', 'csection', 'aluminium'] as ConstructionType[]).map((ct) => (
                    <button
                      key={ct}
                      className={`material-btn ${config.constructionType === ct ? 'active' : ''}`}
                      onClick={() => updateConfig({ constructionType: ct })}
                    >
                      <span style={{ fontSize: '16px' }}>
                        {ct === 'timber' ? '🪵' : ct === 'steel' ? '⚙' : ct === 'csection' ? '⚡' : '🔩'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>
                        {ct === 'csection' ? 'C-Section' : ct.charAt(0).toUpperCase() + ct.slice(1)}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                        {MATERIAL_LABELS[ct].split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachment */}
              <div className="config-card">
                <label className="config-label">Attachment</label>
                <div className="attach-grid">
                  {([
                    { value: 'freestanding', label: 'Freestanding', sub: '4 posts, independent' },
                    { value: 'attached', label: 'Attached', sub: 'Fixed to dwelling' },
                    { value: 'three-side', label: '3-Side Attached', sub: 'Dwelling on 3 sides' },
                  ] as { value: AttachmentType; label: string; sub: string }[]).map((a) => (
                    <button
                      key={a.value}
                      className={`attach-btn ${config.attachment === a.value ? 'active' : ''}`}
                      onClick={() => updateConfig({ attachment: a.value })}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>{a.label}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{a.sub}</span>
                      {a.value === 'three-side' && (
                        <span style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>Bracing 35%</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div className="config-card">
                <label className="config-label">Dimensions</label>
                <div className="dim-grid">
                  <div className="dim-field">
                    <label>Span (m)</label>
                    <input
                      type="number" step="0.01" min="0.5" max="30"
                      value={config.width}
                      onChange={(e) => updateConfig({ width: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="dim-field">
                    <label>Depth (m)</label>
                    <input
                      type="number" step="0.01" min="0.5" max="30"
                      value={config.depth}
                      onChange={(e) => updateConfig({ depth: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="dim-field">
                    <label>Height (m)</label>
                    <input
                      type="number" step="0.1" min="1.5" max="10"
                      value={config.height}
                      onChange={(e) => updateConfig({ height: parseFloat(e.target.value) || 2 })}
                    />
                  </div>
                  <div className="dim-field">
                    <label>Roof pitch (°)</label>
                    <input
                      type="number" step="0.5" min="0" max="45"
                      value={config.pitch}
                      onChange={(e) => updateConfig({ pitch: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="dim-field">
                    <label>Wall standoff (mm)</label>
                    <input
                      type="number" step="10" min="50" max="500"
                      value={standoff}
                      onChange={(e) => setStandoff(parseInt(e.target.value) || 150)}
                    />
                  </div>
                  <div className="dim-field">
                    <label>Left wall setback (m)</label>
                    <input
                      type="number" step="0.1" min="0" max={config.depth}
                      value={leftSetback}
                      onChange={(e) => setLeftSetback(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="dim-field">
                    <label>Right wall setback (m)</label>
                    <input
                      type="number" step="0.1" min="0" max={config.depth}
                      value={rightSetback}
                      onChange={(e) => setRightSetback(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="dim-field">
                    <label>North bearing (°)</label>
                    <input
                      type="number" step="1" min="0" max="359"
                      value={northRotation}
                      onChange={(e) => setNorthRotation(parseFloat(e.target.value) || 0)}
                      title="Degrees clockwise from drawing up. 0 = north is up."
                    />
                  </div>
                </div>
              </div>

              {/* ── Title Block ── */}
              <div className="config-card">
                <label className="config-label">Title Block — Drawing Register</label>
                <div className="dim-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {([
                    ['Project Name',     'projectName',     titleBlock.projectName],
                    ['Project Number',   'projectNumber',   titleBlock.projectNumber],
                    ['Client / Owner',   'clientName',      titleBlock.clientName],
                    ['Property Address', 'propertyAddress', titleBlock.propertyAddress],
                    ['Council',          'council',         titleBlock.council],
                    ['Designed By',      'designedBy',      titleBlock.designedBy],
                    ['Drawn By',         'drawnBy',         titleBlock.drawnBy],
                    ['Checked By',       'checkedBy',       titleBlock.checkedBy],
                    ['Approved By',      'approvedBy',      titleBlock.approvedBy],
                    ['Revision',         'revision',        titleBlock.revision],
                    ['Date',             'date',            titleBlock.date],
                  ] as [string, keyof typeof titleBlock, string][]).map(([label, key, val]) => (
                    <div className="dim-field" key={key}>
                      <label>{label}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={e => updateTB({ [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="dim-field">
                    <label>Status</label>
                    <select
                      value={titleBlock.status}
                      onChange={e => updateTB({ status: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '12px' }}
                    >
                      {['For Approval', 'For Construction', 'As Constructed', 'Preliminary'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dim-field">
                    <label>Document Type</label>
                    <input type="text" value={titleBlock.documentType} onChange={e => updateTB({ documentType: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Roofing Profile */}
              <div className="config-card">
                <label className="config-label">Roofing Profile</label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '6px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  {ROOFING_PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.internalSpan}mm spacing</option>
                  ))}
                </select>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--mono)' }}>
                  Purlin spacing: {Math.round(calc.purlinSpacing * 1000)}mm centres
                </div>
              </div>

              {/* Roof Type */}
              <div className="config-card">
                <label className="config-label">Roof Type</label>
                <div className="roof-grid">
                  {([
                    { value: 'flat', label: 'Flat / Skillion', icon: '▬' },
                    { value: 'gable', label: 'Gable', icon: '🔺' },
                    { value: 'hip', label: 'Hip', icon: '◆' },
                    { value: 'skillion', label: 'Skillion', icon: '◿' },
                    { value: 'open', label: 'Open', icon: '▦' },
                  ] as { value: RoofType; label: string; icon: string }[]).map((r) => (
                    <button
                      key={r.value}
                      className={`roof-btn ${config.roofType === r.value ? 'active' : ''}`}
                      onClick={() => updateConfig({ roofType: r.value })}
                    >
                      <span style={{ fontSize: '16px' }}>{r.icon}</span>
                      <span style={{ fontSize: '11px' }}>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB: MEMBER SIZING ── */}
          <TabsContent value="members">
            <div className="sizing-header">
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>
                  {MATERIAL_LABELS[config.constructionType]} · {config.attachment.replace('-', '-')} · Bracing {(calc.bracingFactor * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                  Load: {0.74} kPa ultimate / {0.48} kPa service · Deflection: span/250
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={resetOverrides} className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>
                  Reset to Auto-Select
                </button>
                <button
                  onClick={() => setShowAllPassing(!showAllPassing)}
                  className="btn-accent"
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  {showAllPassing ? 'Hide' : 'Show'} All Passing ▾
                </button>
              </div>
            </div>

            {allFail && (
              <div className="alert-error">
                <strong>Structural engineer required.</strong> No standard sections pass for this span/loading. Engineer to specify custom section.
              </div>
            )}
            {config.width > 7 && !allFail && (
              <div className="alert-warn">
                <strong>Long span {config.width.toFixed(2)}m:</strong> Flat plate welded to open face of rafter and column C-sections significantly increases torsional stiffness — consider C+plate member form.
              </div>
            )}

            <div className="member-grid">
              <MemberCard
                label={postLabel}
                icon="■"
                result={calc.selPost}
                dropdown={buildDropdown('post', calc.postResults, calc.selPost)}
                onFormChange={(f) => updateForm('post', f)}
                availableForms={getAvailableForms('post')}
                currentForm={forms.post}
              />
              <MemberCard
                label={beamLabel}
                icon="▶"
                result={calc.selBeam}
                dropdown={buildDropdown('beam', calc.beamResults, calc.selBeam)}
                onFormChange={(f) => updateForm('beam', f)}
                availableForms={getAvailableForms('beam')}
                currentForm={forms.beam}
              />
              <MemberCard
                label={purlinLabel}
                icon="◆"
                result={calc.selPurlin}
                dropdown={buildDropdown('purlin', calc.purlinResults, calc.selPurlin)}
                onFormChange={(f) => updateForm('purlin', f)}
                availableForms={getAvailableForms('purlin')}
                currentForm={forms.purlin}
              />
              <MemberCard
                label="LEDGER BEAM"
                icon="═"
                result={calc.selLedger}
                dropdown={buildDropdown('ledger', calc.ledgerResults, calc.selLedger)}
                onFormChange={(f) => updateForm('ledger', f)}
                availableForms={getAvailableForms('ledger')}
                currentForm={forms.ledger}
              />
              <MemberCard
                label="FASCIA BEAM"
                icon="═"
                result={calc.selFascia}
                dropdown={buildDropdown('fascia', calc.fasciaResults, calc.selFascia)}
                onFormChange={(f) => updateForm('fascia', f)}
                availableForms={getAvailableForms('fascia')}
                currentForm={forms.fascia}
              />
            </div>

            {/* ════════════════════════════════════════════════════════
                GABLE END RAFTER — TIED PORTAL (TRUSS ASSEMBLY)
                PF1 & PF3 only: rafter acts as top chord in compression
                when the bottom chord creates a triangulated frame.
                ════════════════════════════════════════════════════════ */}
            {config.roofType === 'gable' && (
              <div style={{
                marginTop: 20,
                border: '2px solid #c9a84c',
                borderRadius: 10,
                background: 'rgba(201,168,76,0.06)',
                padding: '14px 16px',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>🔺</span>
                  <div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 700, color: '#c9a84c', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      GABLE END RAFTER · TIED PORTAL (TRUSS ASSEMBLY)
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                      PF1 &amp; PF3 — rafter is TOP CHORD in axial compression · Bottom chord carries TENSION
                    </div>
                  </div>
                </div>

                {/* Truss force summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Axial compression (top chord)', value: `${(calc.topChordAxialKN ?? 0).toFixed(1)} kN`, color: '#f44336' },
                    { label: 'Buckling length (purlin c/c)',   value: `${(calc.purlinSpacing * 1000).toFixed(0)} mm`, color: '#2196f3' },
                    { label: 'Current beam rafter',            value: calc.selBeam?.sec.size ?? '—',               color: '#888' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: '14px', fontFamily: 'var(--mono)', fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Member selectors — all three gable members live here */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#c9a84c', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Top Chord (Rafter as Truss)
                    </div>
                    <MemberCard
                      label="GABLE TOP CHORD · TRUSS RAFTER"
                      icon="╱"
                      result={calc.selGableTopChord}
                      dropdown={buildDropdown('gableTopChord', calc.gableTopChordResults, calc.selGableTopChord)}
                      onFormChange={(f) => updateForm('gableTopChord', f)}
                      availableForms={getAvailableForms('gableTopChord')}
                      currentForm={forms.gableTopChord}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#c9a84c', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Bottom Chord (Tie Beam — Tension)
                    </div>
                    <MemberCard
                      label="GABLE BOTTOM CHORD · TIE BEAM"
                      icon="▭"
                      result={calc.selGableChord}
                      dropdown={buildDropdown('gableChord', calc.gableChordResults, calc.selGableChord)}
                      onFormChange={(f) => updateForm('gableChord', f)}
                      availableForms={getAvailableForms('gableChord')}
                      currentForm={forms.gableChord}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#c9a84c', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Dropper (Infill Mullion) · net h={calc.netDropperH?.toFixed(2)}m
                    </div>
                    <MemberCard
                      label="GABLE DROPPER"
                      icon="│"
                      result={calc.selGableDropper}
                      dropdown={buildDropdown('gableDropper', calc.gableDropperResults, calc.selGableDropper)}
                      onFormChange={(f) => updateForm('gableDropper', f)}
                      availableForms={getAvailableForms('gableDropper')}
                      currentForm={forms.gableDropper}
                    />
                  </div>
                </div>

                {/* Weight comparison note */}
                {calc.selGableTopChord && calc.selBeam && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 6, fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <span style={{ color: '#4caf50', fontWeight: 700 }}>✓ TRUSS SAVING: </span>
                    Truss top chord <span style={{ color: '#c9a84c' }}>{calc.selGableTopChord.sec.size}</span> ({calc.selGableTopChord.sec.wt.toFixed(2)} kg/m)
                    {' '}vs moment-frame rafter <span style={{ color: '#888' }}>{calc.selBeam.sec.size}</span> ({calc.selBeam.sec.wt.toFixed(2)} kg/m)
                    {' '}— <span style={{ color: '#4caf50' }}>{((1 - calc.selGableTopChord.sec.wt / calc.selBeam.sec.wt) * 100).toFixed(0)}% lighter</span> per rafter for PF1 &amp; PF3.
                    Note: axial compression ({(calc.topChordAxialKN ?? 0).toFixed(1)} kN) governs — verify to AS4600.
                  </div>
                )}
              </div>
            )}

            {/* ── GABLE INFILL SECTION ── */}
            {config.roofType === 'gable' && (
              <div style={{ marginTop: 20 }}>
                <Card style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <CardContent className="p-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: '16px' }}>▲</span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', flex: 1 }}>
                        Gable End Infill
                      </span>
                      {gableInfill.cladding.transparency > 50 && (
                        <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                          {gableInfill.cladding.transparency}% light transmission
                        </span>
                      )}
                    </div>

                    {/* Cladding selector */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)', display: 'block', marginBottom: 6 }}>
                        Cladding type
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
                        {CLADDING_TYPES.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCladding(c.id)}
                            style={{
                              display: 'flex', flexDirection: 'column', gap: 2,
                              padding: '10px 12px', background: selectedCladding === c.id ? 'rgba(201,168,76,0.12)' : 'var(--surface2)',
                              border: selectedCladding === c.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                              borderRadius: '6px', color: 'var(--text)', cursor: 'pointer',
                              textAlign: 'left', transition: 'all 0.15s ease',
                            }}
                          >
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{c.name}</span>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{c.description}</span>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                              Max span: {c.maxSpanH}mm H / {c.maxSpanV}mm V · {c.weight} kg/m²
                              {c.transparency > 0 && ` · ${c.transparency}% light`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SVG layout */}
                    <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '6px', marginBottom: 12, border: '1px solid var(--border2)' }}>
                      <div dangerouslySetInnerHTML={{
                        __html: generateGableInfillSVG(
                          gableInfill.gableWidth,
                          gableInfill.gableHeight,
                          gableInfill.nBays,
                          gableInfill.dropperSpacing,
                          gableInfill.cladding.name,
                          gableInfill.panelWidth,
                        )
                      }} />
                    </div>

                    {/* Summary grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6, fontSize: '10px', fontFamily: 'var(--mono)' }}>
                      <div style={{ background: 'var(--surface2)', padding: '8px 10px', borderRadius: '4px' }}>
                        <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.06em', marginBottom: 3 }}>Panels</div>
                        <div style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700 }}>{gableInfill.nBays}</div>
                        <div style={{ color: 'var(--text-muted)' }}>@ {Math.round(gableInfill.panelWidth * 1000)}mm wide</div>
                      </div>
                      <div style={{ background: 'var(--surface2)', padding: '8px 10px', borderRadius: '4px' }}>
                        <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.06em', marginBottom: 3 }}>Droppers</div>
                        <div style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700 }}>{Math.max(0, gableInfill.nDroppers - 2)}</div>
                        <div style={{ color: 'var(--text-muted)' }}>intermediate + 2 posts</div>
                      </div>
                      <div style={{ background: 'var(--surface2)', padding: '8px 10px', borderRadius: '4px' }}>
                        <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.06em', marginBottom: 3 }}>Cladding area</div>
                        <div style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700 }}>{gableInfill.claddingArea.toFixed(1)}</div>
                        <div style={{ color: 'var(--text-muted)' }}>m² · ~{gableInfill.claddingSheets} sheets</div>
                      </div>
                      <div style={{ background: 'var(--surface2)', padding: '8px 10px', borderRadius: '4px' }}>
                        <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.06em', marginBottom: 3 }}>Angle trim</div>
                        <div style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 700 }}>{gableInfill.frameAngleM.toFixed(1)}</div>
                        <div style={{ color: 'var(--text-muted)' }}>m cold-formed angle</div>
                      </div>
                      <div style={{ background: gableInfill.dropperEngineering.passed ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)', padding: '8px 10px', borderRadius: '4px', border: gableInfill.dropperEngineering.passed ? '1px solid rgba(76,175,80,0.25)' : '1px solid rgba(244,67,54,0.25)' }}>
                        <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.06em', marginBottom: 3 }}>Dropper util</div>
                        <div style={{ color: gableInfill.dropperEngineering.passed ? '#4caf50' : '#f44336', fontSize: '16px', fontWeight: 700 }}>{gableInfill.dropperEngineering.utilisation}%</div>
                        <div style={{ color: 'var(--text-muted)' }}>wind @ {gableInfill.dropperEngineering.windLoad.toFixed(2)} kN/m</div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginTop: 10, fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Each panel framed with cold-formed angle (25×25×2.5 EA) on all four sides, screwed at 300mm centres.
                      Droppers are C100×50×1.6 G450 gal C-sections, fixed to rafter and bottom chord with M12 bolts.
                      {gableInfill.cladding.transparency > 50 && ' Polycarbonate sheets lapped 150mm at joins, sealed with compatible tape.'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* All Passing Sections panel */}
            {showAllPassing && (
              <div style={{ marginTop: 16 }}>
                <AllPassingPanel
                  postResults={calc.postResults}
                  beamResults={calc.beamResults}
                  purlinResults={calc.purlinResults}
                  onApply={(size, member) => setOverride(member as keyof MemberOverrides, size)}
                />
              </div>
            )}
          </TabsContent>

          {/* ── TAB: PORTAL FRAMES ── */}
          <TabsContent value="frames">
            <div className="config-card" style={{ maxWidth: 600 }}>
              <label className="config-label">Portal Frame Layout</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end', marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>No. of frames</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => updateConfig({ portalFrameCount: Math.max(2, config.portalFrameCount - 1) })} className="btn-adjust">−</button>
                    <input
                      type="number" min={2} max={10} step={1}
                      value={config.portalFrameCount}
                      onChange={(e) => updateConfig({ portalFrameCount: Math.max(2, Math.min(10, parseInt(e.target.value) || 2)) })}
                      style={{ width: 48, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '4px', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '16px', padding: '4px', fontWeight: 700 }}
                    />
                    <button onClick={() => updateConfig({ portalFrameCount: Math.min(10, config.portalFrameCount + 1) })} className="btn-adjust">+</button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Frame spacing</div>
                  <div style={{ fontSize: '18px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{calc.frameSpacing.toFixed(2)} m</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>along {config.depth.toFixed(2)}m depth</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Purlin span</div>
                  <div style={{ fontSize: '18px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{calc.frameSpacing.toFixed(2)} m</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>@ {Math.round(calc.purlinSpacing * 1000)}mm centres</div>
                </div>
              </div>

              {/* Frame count options table */}
              <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Frame Count Options — click to select
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 60px 55px 65px 55px 55px 65px', gap: 4, fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)', padding: '4px 0', marginBottom: 4 }}>
                  <span>Frames</span><span>Spacing</span><span>Purlin%</span><span>Purlins</span><span>Rafter m</span><span>Purlin m</span><span>~Steel $</span>
                </div>
                {Array.from({ length: 6 }, (_, i) => i + 2).map((nf) => {
                  const fs = config.depth / (nf - 1);
                  const wPurlin = 0.74 * calc.purlinSpacing;
                  const Mreq = wPurlin * fs * fs / 8;
                  const purlinUtil = calc.selPurlin?.MCap ? (Mreq / calc.selPurlin.MCap) * 100 : 999;
                  const bays = nf - 1;
                  const purlinsPerBay = Math.max(0, Math.ceil(fs / calc.purlinSpacing) - 1);
                  const rafterLm = nf * config.width;
                  const purlinLm = purlinsPerBay * bays * config.width;
                  const totalLm = rafterLm + purlinLm;
                  const col = purlinUtil < 70 ? '#4caf50' : purlinUtil < 85 ? '#8bc34a' : purlinUtil < 100 ? '#ff9800' : '#f44336';
                  const isRec = nf === config.portalFrameCount;
                  return (
                    <div
                      key={nf}
                      onClick={() => updateConfig({ portalFrameCount: nf })}
                      style={{
                        display: 'grid', gridTemplateColumns: '70px 60px 55px 65px 55px 55px 65px', gap: 4, padding: '4px 8px',
                        background: isRec ? 'rgba(201,168,76,0.08)' : 'transparent',
                        border: isRec ? '1px solid rgba(201,168,76,0.35)' : '1px solid transparent',
                        borderRadius: 4, cursor: 'pointer', fontSize: '10px', fontFamily: 'var(--mono)',
                      }}
                    >
                      <span style={{ color: isRec ? '#c9a84c' : 'var(--text)', fontWeight: isRec ? 700 : 400 }}>{nf} {isRec ? '★' : ''}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{fs.toFixed(2)}m</span>
                      <span style={{ color: col }}>{purlinUtil < 999 ? Math.round(purlinUtil) + '%' : 'FAIL'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{purlinsPerBay}×{bays}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{rafterLm.toFixed(1)}m</span>
                      <span style={{ color: 'var(--text-muted)' }}>{purlinLm.toFixed(1)}m</span>
                      <span style={{ color: 'var(--text-muted)' }}>${Math.round(totalLm * 38).toLocaleString()}</span>
                    </div>
                  );
                })}
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                  ★ Currently selected. Purlin% = utilisation at that frame spacing. Steel $ indicative at ~$38/lm supply only.
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB: DRAWINGS ── */}
          <TabsContent value="drawings">
            <div className="config-grid" style={{ gridTemplateColumns: '1fr' }}>
              {/* Export submission set */}
              <div className="config-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <label className="config-label" style={{ marginBottom: 2 }}>Submission Drawing Set</label>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                    {submissionSheets.length} A3 sheets · exports to one multi-page PDF with title blocks
                  </div>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  style={{ fontSize: '12px', padding: '10px 20px', background: 'var(--accent)', color: '#111210', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: isExporting ? 'wait' : 'pointer', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', opacity: isExporting ? 0.6 : 1 }}
                >
                  {isExporting ? 'Generating…' : '⤓ Generate Submission PDF'}
                </button>
              </div>

              {/* Title-blocked sheets — single source: submissionSheets (also used by the PDF export) */}
              {submissionSheets.map((s) => (
                <div className="config-card" key={s.number}>
                  <label className="config-label">{s.number} · {s.title}</label>
                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '6px', border: '1px solid var(--border2)', marginBottom: 8 }}>
                    <div dangerouslySetInnerHTML={{ __html: s.svg }} />
                  </div>
                  {s.description && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
                      {s.description}
                    </div>
                  )}
                </div>
              ))}

              {/* Connection Detail Drawings */}
              <div className="config-card">
                <label className="config-label">Connection Details (using selected members)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '6px', border: '1px solid var(--border2)' }}>
                    <div dangerouslySetInnerHTML={{ __html: generateCornerPostSVG(calc.selLedger?.sec || null, calc.selPost?.sec || null) }} />
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '6px', border: '1px solid var(--border2)' }}>
                    <div dangerouslySetInnerHTML={{ __html: generateRafterLedgerSVG(calc.selBeam?.sec || null, calc.selLedger?.sec || null) }} />
                  </div>
                </div>
              </div>

              {/* Cross-Bracing Detail */}
              <div className="config-card">
                <label className="config-label">Cross-Bracing (X-Brace) — Lateral Stability</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '6px', border: '1px solid var(--border2)' }}>
                    <div dangerouslySetInnerHTML={{ __html: generateCrossBracingSVG(calc.frameSpacing, config.height, calc.selPurlin?.sec || null) }} />
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', lineHeight: 1.7, padding: '8px' }}>
                    <div style={{ color: 'var(--accent)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Cross-Bracing Notes</div>
                    <div>• Resists lateral wind and racking forces</div>
                    <div>• Typically placed in <strong>end bays</strong></div>
                    <div>• Uses smallest C-section (e.g. C75×40×1.2)</div>
                    <div>• Bolted to posts and rafters with M12</div>
                    <div>• Tension-only design (one brace active at a time)</div>
                    <div>• Prevents portal frame sway</div>
                    <div style={{ marginTop: 8, color: 'var(--text-subtle)' }}>
                      For 3-side attached: bracing only needed in
                      open gable end bay (bay nearest corner post).
                    </div>
                    <div style={{ marginTop: 6, color: 'var(--warn)' }}>
                      Critical for structures {'>'} 6m span or
                      wind regions {'>'} N2.
                    </div>
                  </div>
                </div>
              </div>

              {/* Socket Joint Detail */}
              <div className="config-card">
                <label className="config-label">Socket Joint — Rafter to 65×65 Standoff (no visible end plate)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '6px', border: '1px solid var(--border2)' }}>
                    <div dangerouslySetInnerHTML={{ __html: generateSocketJointSVG() }} />
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', lineHeight: 1.7, padding: '8px' }}>
                    <div style={{ color: 'var(--accent)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>How It Works</div>
                    <div>• 65×65 SHS runs continuous, through fascia</div>
                    <div>• 50×50 SHS stub welded to top face at each rafter</div>
                    <div>• 50×5mm packer plates welded both faces of 50×50</div>
                    <div>• Packers bring 50×50 out to 60mm (C-section internal)</div>
                    <div>• Rafter (C250×65) slips over from above</div>
                    <div>• 4× M10 FHCS per side into tapped 50×50</div>
                    <div style={{ marginTop: 8, color: 'var(--text-subtle)' }}>
                      Result: zero visible plates, just clean
                      socket heads on the rafter flanges. The
                      65×65 reads as one continuous line.
                    </div>
                  </div>
                </div>
              </div>

              {/* Fascia Penetration Detail */}
              <div className="config-card">
                <label className="config-label">Fascia Penetration — 65×65 through existing fascia</label>
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '6px', border: '1px solid var(--border2)', maxWidth: 480 }}>
                  <div dangerouslySetInnerHTML={{ __html: generateFasciaPenetrationSVG() }} />
                </div>
              </div>

              {/* Connection Inventory */}
              <div className="config-card">
                <label className="config-label">Connection Inventory</label>
                <div style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Connections required for each member type in this structure
                </div>
                {(['post', 'beam', 'purlin', 'ledger', 'fascia', 'gableChord', 'gableDropper', 'gableTopChord'] as const).map((member) => {
                  const conns = getConnectionsForMember(member);
                  const labels: Record<string, string> = {
                    post: 'COLUMN / POST', beam: 'RAFTER / BEAM', purlin: 'PURLIN',
                    ledger: 'LEDGER BEAM', fascia: 'FASCIA BEAM',
                    gableChord: 'GABLE BOTTOM CHORD', gableDropper: 'GABLE DROPPER', gableTopChord: 'GABLE TOP CHORD (TRUSS)',
                  };
                  return (
                    <div key={member} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px', background: 'var(--surface2)', borderRadius: '4px 4px 0 0' }}>
                        {labels[member]}
                      </div>
                      <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                        {conns.map((c) => (
                          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px', gap: 8, padding: '5px 8px', borderBottom: '1px solid var(--border2)', fontSize: '10px', fontFamily: 'var(--mono)' }}>
                            <div>
                              <div style={{ color: 'var(--text)', fontWeight: 500 }}>{c.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{c.capacity}</div>
                              <div style={{ color: 'var(--text-subtle)', fontSize: '8px', marginTop: 2 }}>
                                {c.components.join(' · ')}
                              </div>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '9px', textAlign: 'right' }}>
                              {c.standard}
                              {c.engineerRequired && <span style={{ color: '#f44336', marginLeft: 4 }}>ENG*</span>}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '9px', textAlign: 'right' }}>
                              {c.timeMin}min
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                  * ENG = engineer certification required. All connections to AS4600 / AS4100 / AS5216.
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── STEP PREV / NEXT (bottom) ── */}
          {(() => {
            const idx = STEPS.findIndex(s => s.id === activeTab);
            const prev = idx > 0 ? STEPS[idx - 1] : null;
            const next = idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn-ghost"
                  onClick={() => prev && setActiveTab(prev.id)}
                  style={{ visibility: prev ? 'visible' : 'hidden', fontSize: '12px', padding: '8px 16px', fontFamily: 'var(--mono)' }}
                >
                  ← {prev?.label}
                </button>
                <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Step {idx + 1} of {STEPS.length}
                </span>
                {next ? (
                  <button
                    onClick={() => setActiveTab(next.id)}
                    style={{ fontSize: '12px', padding: '8px 18px', background: 'var(--accent)', color: '#111210', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}
                  >
                    {next.label} →
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: '#6db87a', whiteSpace: 'nowrap' }}>Final step ✓</span>
                )}
              </div>
            );
          })()}
        </Tabs>
      </main>
    </div>
  );
}

// ── All Passing Sections Panel ──
function AllPassingPanel({
  postResults, beamResults, purlinResults, onApply,
}: {
  postResults: UtilResult[];
  beamResults: UtilResult[];
  purlinResults: UtilResult[];
  onApply: (size: string, member: string) => void;
}) {
  const mono = { fontFamily: 'var(--mono)', fontSize: '10px' };
  const headerStyle = { display: 'grid', gridTemplateColumns: '1fr 55px 60px 60px 55px', gap: 4, padding: '4px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', ...mono } as const;

  function SectionRows({ results, label }: { results: UtilResult[]; label: string }) {
    const passing = results.filter((r) => r.util <= 100);
    if (!passing.length) return <div style={{ padding: '6px 8px', ...mono, color: 'var(--text-muted)' }}>No passing sections</div>;
    return (
      <>
        {passing.map((r) => {
          const u = r.util;
          const col = u < 70 ? '#4caf50' : u < 85 ? '#8bc34a' : '#ff9800';
          return (
            <div
              key={r.sec.size}
              onClick={() => onApply(r.sec.size, label)}
              style={{ display: 'grid', gridTemplateColumns: '1fr 55px 60px 60px 55px', gap: 4, padding: '4px 8px', ...mono, cursor: 'pointer', borderBottom: '1px solid var(--border2)' }}
              title="Click to apply"
            >
              <span style={{ color: 'var(--text)' }}>{r.sec.size}</span>
              <span style={{ color: col }}>{u.toFixed(1)}%</span>
              <span style={{ color: 'var(--text-muted)' }}>{r.M.toFixed(2)}</span>
              <span style={{ color: col }}>{r.MCap.toFixed(2)}</span>
              <span style={{ color: 'var(--text-muted)' }}>{r.delta.toFixed(1)}</span>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <Card style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <CardContent className="p-3">
        <div style={{ ...mono, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          All Passing Sections — click row to apply
        </div>

        {(['post', 'beam', 'purlin'] as const).map((member) => {
          const results = member === 'post' ? postResults : member === 'beam' ? beamResults : purlinResults;
          const label = member === 'post' ? 'COLUMN' : member === 'beam' ? 'RAFTER' : 'PURLIN';
          return (
            <div key={member} style={{ marginBottom: 10 }}>
              <div style={{ ...mono, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px', background: 'var(--surface2)', borderRadius: '4px 4px 0 0', fontSize: '9px' }}>
                {label}
              </div>
              <div style={headerStyle}>
                <span>Section</span><span>Util%</span><span>M kNm</span><span>M&#x03C6; kNm</span><span>&#x03B4; mm</span>
              </div>
              <SectionRows results={results} label={member} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
