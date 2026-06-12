// Services plans — Electrical Layout + Stormwater / Drainage — each with a basic Bill of Materials.
//
// Self-contained pure SVG (geometry in, string out), sharing the same lat/lng → metre projection as
// the site-plan sheets so everything lines up. The BOMs are INDICATIVE allowances derived from what
// was placed/traced in Draftly Intelligence — the sheets are clearly captioned that the work must be
// installed and certified by a licensed tradesperson (electrician AS/NZS 3000 / plumber AS/NZS 3500.3).

export interface LatLng { lat: number; lng: number }

export interface ElecNode { kind?: 'board' | 'switch' | 'light' | 'gpo'; lat: number; lng: number; ip?: string; fixtureType?: string; area?: string }
export interface Wire { from: LatLng; to: LatLng }
export interface Downpipe { lat?: number; lng?: number; downpipe?: string | null; downpipeCapacityLs?: number; servesM2?: number; existingRoofM2?: number; shared?: boolean }
export interface Catchment { polygon?: LatLng[]; shared?: boolean; dischargePoint?: number | null }
export interface BomItem { qty: number; unit: string; desc: string; note?: boolean; consumable?: boolean }

const FONT = "'DM Mono', ui-monospace, monospace";
const R = 6371000;

function haversine(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180, lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
function esc(s: string): string { return String(s).replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;')); }

// ── BOM builders ──────────────────────────────────────────────────────────────────────────────

// uPVC stormwater pipe size to match the chosen downpipe.
function pvcSize(label?: string | null): string {
  const l = (label || '').toLowerCase();
  if (l.includes('90')) return 'DN90';
  return 'DN100';
}

export function buildPlumbingBOM(downpipes: Downpipe[]): { items: BomItem[]; newCount: number; sharedCount: number } {
  const news = downpipes.filter((d) => !d.shared);
  const shared = downpipes.filter((d) => d.shared);
  const items: BomItem[] = [];
  if (news.length) {
    const n = news.length;
    // Predominant downpipe type for the line description.
    const counts: Record<string, number> = {};
    news.forEach((d) => { const k = d.downpipe || 'downpipe'; counts[k] = (counts[k] || 0) + 1; });
    const typeLabel = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const pvc = pvcSize(typeLabel);
    items.push({ qty: n, unit: 'no', desc: `Downpipe — ${typeLabel} (allow ~3 m drop each)` });
    items.push({ qty: n * 2, unit: 'no', desc: 'Downpipe brackets / fixing clips' });
    items.push({ qty: n, unit: 'no', desc: 'Rainwater outlet ("pop") — gutter to downpipe' });
    items.push({ qty: n, unit: 'no', desc: 'Downpipe shoe / offset — ground connection' });
    items.push({ qty: n, unit: 'm', desc: `uPVC stormwater pipe ${pvc} — to underground drain`, consumable: true });
    items.push({ qty: n * 3, unit: 'no', desc: `uPVC ${pvc} fittings — bend, adaptor, drain connector` });
  }
  if (shared.length) {
    items.push({ qty: shared.length, unit: 'no', note: true, desc: 'Shared with existing dwelling downpipe — under-sheet flashing to existing gutter (provided in the shed build). No new stormwater plumbing.' });
  }
  return { items, newCount: news.length, sharedCount: shared.length };
}

export function buildElectricalBOM(nodes: ElecNode[], wires: Wire[]): { items: BomItem[] } {
  const lights = nodes.filter((n) => n.kind === 'light');
  const switches = nodes.filter((n) => n.kind === 'switch');
  const gpos = nodes.filter((n) => n.kind === 'gpo');
  const board = nodes.find((n) => n.kind === 'board');
  const items: BomItem[] = [];

  // Lights grouped by type + IP.
  const lg: Record<string, { qty: number; type: string; ip: string }> = {};
  lights.forEach((n) => {
    const type = n.fixtureType || 'Light fitting', ip = n.ip || '';
    const k = type + '|' + ip;
    if (!lg[k]) lg[k] = { qty: 0, type, ip };
    lg[k].qty++;
  });
  Object.values(lg).forEach((g) => items.push({ qty: g.qty, unit: 'no', desc: `Light fitting — ${g.type}${g.ip ? ' (' + g.ip + ')' : ''}` }));
  if (switches.length) items.push({ qty: switches.length, unit: 'no', desc: 'Switch — weatherproof, exterior (IP-rated)' });
  if (gpos.length) {
    const ip = gpos.find((g) => g.ip)?.ip || 'IP53';
    items.push({ qty: gpos.length, unit: 'no', desc: `GPO — weatherproof (${ip})` });
  }

  // Cable — classify each drawn run: any leg touching a GPO is "power" (2.5 mm²), else lighting (1.5 mm²).
  let lightLen = 0, powerLen = 0;
  const near = (p: LatLng, kind: ElecNode['kind']) => nodes.some((n) => n.kind === kind && Math.abs(n.lat - p.lat) < 1e-7 && Math.abs(n.lng - p.lng) < 1e-7);
  wires.forEach((w) => {
    if (!w.from || !w.to) return;
    const len = haversine(w.from, w.to);
    const isPower = near(w.from, 'gpo') || near(w.to, 'gpo');
    if (isPower) powerLen += len; else lightLen += len;
  });
  // Base run lengths + vertical drops (wastage is added separately as a provisional allowance).
  const lightingM = Math.ceil(lightLen + switches.length * 2.5 + lights.length * 0.5);
  const powerM = Math.ceil(powerLen + gpos.length * 0.5);
  if (lightingM > 0) items.push({ qty: lightingM, unit: 'm', desc: 'Cable — 1.5 mm² TPS (lighting)', consumable: true });
  if (powerM > 0) items.push({ qty: powerM, unit: 'm', desc: 'Cable — 2.5 mm² TPS (power / GPO)', consumable: true });

  // Protection — one new circuit per service present.
  const circuits = (lights.length ? 1 : 0) + (gpos.length ? 1 : 0);
  if (circuits) items.push({ qty: circuits, unit: 'no', desc: `RCBO / MCB — new circuit${circuits > 1 ? 's' : ''} at ${board ? 'the board' : 'switchboard'}` });

  // Fixings + sundries — indicative allowances.
  const fixtureCount = lights.length + switches.length + gpos.length;
  if (fixtureCount) items.push({ qty: fixtureCount, unit: 'set', desc: 'Fixture fixings — mounts / screws / plugs' });
  const totalM = lightingM + powerM;
  if (totalM) items.push({ qty: Math.ceil(totalM / 0.6), unit: 'no', desc: 'Cable saddles / clips (≈ 1 per 600 mm)' });
  if (fixtureCount) {
    items.push({ qty: Math.max(2, Math.ceil(lights.length / 2)), unit: 'no', desc: 'Junction boxes — weatherproof' });
    items.push({ qty: 1, unit: 'lot', desc: 'Sundries — conduit / glands / connectors / IP sealant (allow)' });
  }
  return { items };
}

// ── Shared drawing scaffolding ──────────────────────────────────────────────────────────────────

interface XY { x: number; y: number }
const W = 1000, H = 700, M = 44, PANEL = 300;

function frame(lotPts: LatLng[]) {
  const plot = { x0: M, y0: M, x1: W - PANEL - M, y1: H - M };
  const lat0 = lotPts.reduce((s, p) => s + p.lat, 0) / lotPts.length;
  const lng0 = lotPts.reduce((s, p) => s + p.lng, 0) / lotPts.length;
  const k = Math.cos(lat0 * Math.PI / 180);
  const proj = (p: LatLng): XY => ({ x: (p.lng - lng0) * Math.PI / 180 * R * k, y: -((p.lat - lat0) * Math.PI / 180) * R });
  const lotM = lotPts.map(proj);
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of lotM) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); }
  const bw = Math.max(maxx - minx, 0.001), bh = Math.max(maxy - miny, 0.001);
  const plotW = plot.x1 - plot.x0, plotH = plot.y1 - plot.y0;
  const scale = Math.min(plotW / (bw * 1.08), plotH / (bh * 1.08));
  const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
  const offx = plot.x0 + plotW / 2, offy = plot.y0 + plotH / 2;
  const map = (p: LatLng): XY => { const q = proj(p); return { x: offx + (q.x - cx) * scale, y: offy + (q.y - cy) * scale }; };
  return { plot, map, scale };
}
function ptsAttr(ring: LatLng[], map: (p: LatLng) => XY) { return ring.map((p) => { const m = map(p); return `${m.x.toFixed(1)},${m.y.toFixed(1)}`; }).join(' '); }

function lotAndStructure(parts: string[], lotPts: LatLng[], footprint: LatLng[] | undefined, map: (p: LatLng) => XY) {
  parts.push(`<polygon points="${ptsAttr(lotPts, map)}" fill="#f6f4ee" stroke="#1a1a1a" stroke-width="2"/>`);
  if (footprint && footprint.length >= 3) {
    parts.push(`<polygon points="${ptsAttr(footprint, map)}" fill="#1a1a1a" fill-opacity="0.10" stroke="#1a1a1a" stroke-width="1.6"/>`);
    const fc = footprint.reduce((s, p) => ({ x: s.x + map(p).x, y: s.y + map(p).y }), { x: 0, y: 0 });
    parts.push(`<text x="${(fc.x / footprint.length).toFixed(1)}" y="${(fc.y / footprint.length).toFixed(1)}" font-size="11" fill="#1a1a1a" text-anchor="middle">PROPOSED</text>`);
  }
}
function northAndScale(parts: string[], plot: { x0: number; y0: number; x1: number; y1: number }, scale: number) {
  const nx = plot.x1 - 26, ny = plot.y0 + 34;
  parts.push(`<g stroke="#1a1a1a" fill="#1a1a1a"><line x1="${nx}" y1="${ny + 20}" x2="${nx}" y2="${ny - 16}" stroke-width="1.6"/><polygon points="${nx},${ny - 22} ${nx - 5},${ny - 12} ${nx + 5},${ny - 12}"/></g><text x="${nx}" y="${ny + 34}" font-size="11" fill="#1a1a1a" text-anchor="middle">N</text>`);
  const niceM = [1, 2, 5, 10, 20, 50, 100].reduce((a, v) => (Math.abs(v - 120 / scale) < Math.abs(a - 120 / scale) ? v : a), 1);
  const sb = niceM * scale, sx = plot.x0 + 8, sy = plot.y1 - 12;
  parts.push(`<line x1="${sx}" y1="${sy}" x2="${(sx + sb).toFixed(1)}" y2="${sy}" stroke="#1a1a1a" stroke-width="2"/><line x1="${sx}" y1="${sy - 4}" x2="${sx}" y2="${sy + 4}" stroke="#1a1a1a" stroke-width="2"/><line x1="${(sx + sb).toFixed(1)}" y1="${sy - 4}" x2="${(sx + sb).toFixed(1)}" y2="${sy + 4}" stroke="#1a1a1a" stroke-width="2"/><text x="${(sx + sb / 2).toFixed(1)}" y="${sy - 8}" font-size="11" fill="#1a1a1a" text-anchor="middle">${niceM} m</text>`);
}
// Right-hand panel: a titled BOM table + a provisional wastage line + a disclaimer footer.
function bomPanel(parts: string[], title: string, items: BomItem[], accent: string, disclaimer: string[], wastagePct = 0, consumableLabel = 'consumables') {
  const lx = W - PANEL - 8;
  parts.push(`<line x1="${lx}" y1="${M}" x2="${lx}" y2="${H - M}" stroke="#ddd" stroke-width="1"/>`);
  let y = M + 8;
  parts.push(`<text x="${lx + 14}" y="${y + 6}" font-size="13" fill="#1a1a1a" font-weight="bold">${esc(title)}</text>`);
  y += 24;
  parts.push(`<text x="${lx + 14}" y="${y}" font-size="9" fill="${accent}" font-family="${FONT}">QTY  ITEM</text>`);
  y += 6;
  parts.push(`<line x1="${lx + 14}" y1="${y}" x2="${W - 14}" y2="${y}" stroke="#e2e2e2" stroke-width="1"/>`);
  y += 14;
  if (!items.length) { parts.push(`<text x="${lx + 14}" y="${y}" font-size="10.5" fill="#777">Nothing placed/traced.</text>`); y += 16; }
  items.forEach((it) => {
    const qtyTxt = it.note ? '—' : `${it.qty} ${it.unit}`;
    parts.push(`<text x="${lx + 14}" y="${y}" font-size="10" fill="${it.note ? accent : '#1a1a1a'}" font-family="${FONT}">${esc(qtyTxt)}</text>`);
    const lines = wrap(it.desc, it.note ? 34 : 30);
    lines.forEach((ln, i) => parts.push(`<text x="${lx + 64}" y="${(y + i * 12).toFixed(1)}" font-size="10" fill="${it.note ? '#555' : '#1a1a1a'}">${esc(ln)}</text>`));
    y += Math.max(14, lines.length * 12 + 4);
  });
  // Wastage — a PROVISIONAL allowance on the cut-to-length consumables, set in the app (adjustable).
  if (wastagePct > 0) {
    const consumableM = items.filter((it) => it.consumable && it.unit === 'm').reduce((s, it) => s + it.qty, 0);
    const extra = Math.ceil(consumableM * wastagePct / 100);
    parts.push(`<line x1="${lx + 14}" y1="${y - 2}" x2="${W - 14}" y2="${y - 2}" stroke="#e2e2e2" stroke-width="1"/>`);
    y += 12;
    parts.push(`<text x="${lx + 14}" y="${y}" font-size="10" fill="${accent}" font-family="${FONT}" font-weight="bold">+${wastagePct}%</text>`);
    const wl = wrap(`Wastage allowance (provisional sum) — ≈ +${extra} m ${consumableLabel}. Adjust for installation method; a field call for the licensed tradesperson.`, 32);
    wl.forEach((ln, i) => parts.push(`<text x="${lx + 64}" y="${(y + i * 12).toFixed(1)}" font-size="10" fill="#555">${esc(ln)}</text>`));
    y += wl.length * 12 + 4;
  }
  // Disclaimer footer.
  let dy = H - M - (disclaimer.length * 11) - 4;
  parts.push(`<line x1="${lx + 14}" y1="${dy - 10}" x2="${W - 14}" y2="${dy - 10}" stroke="#e2e2e2" stroke-width="1"/>`);
  disclaimer.forEach((ln) => { parts.push(`<text x="${lx + 14}" y="${dy}" font-size="8.5" fill="#888">${esc(ln)}</text>`); dy += 11; });
}
function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/), out: string[] = []; let line = '';
  for (const w of words) { if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }
  if (line) out.push(line);
  return out.length ? out : [text];
}

// ── Stormwater / Drainage plan ──────────────────────────────────────────────────────────────────

export interface StormwaterPlanInput {
  lotPts: LatLng[];
  footprint?: LatLng[];
  downpipes: Downpipe[];
  catchments?: Catchment[];
  designIntensityMmHr?: number;
  wastagePct?: number;
}
export function generateStormwaterPlanSVG(input: StormwaterPlanInput): string {
  const { lotPts, footprint, downpipes, catchments } = input;
  if (!lotPts || lotPts.length < 3) return '';
  const { plot, map, scale } = frame(lotPts);
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}"><rect width="${W}" height="${H}" fill="#fff"/>`);
  lotAndStructure(parts, lotPts, footprint, map);
  // Catchments (roof areas) — cyan; shared (existing roof) hatched-grey.
  (catchments || []).forEach((c) => {
    if (!c.polygon || c.polygon.length < 3) return;
    const col = c.shared ? '#888' : '#2bb6c9';
    parts.push(`<polygon points="${ptsAttr(c.polygon, map)}" fill="${col}" fill-opacity="0.16" stroke="${col}" stroke-width="1.4" stroke-dasharray="${c.shared ? '4,3' : ''}"/>`);
  });
  // Downpipes — new = filled cyan; shared = hollow with an "S".
  (downpipes || []).forEach((d, i) => {
    if (d.lat == null || d.lng == null) return;
    const m = map({ lat: d.lat, lng: d.lng });
    if (d.shared) {
      parts.push(`<circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="7" fill="#fff" stroke="#888" stroke-width="2.5"/><text x="${m.x.toFixed(1)}" y="${(m.y + 3.5).toFixed(1)}" font-size="9" fill="#888" text-anchor="middle" font-weight="bold">S</text>`);
    } else {
      parts.push(`<circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="7" fill="#2bb6c9" stroke="#1a1a1a" stroke-width="2"/><text x="${(m.x + 11).toFixed(1)}" y="${(m.y + 4).toFixed(1)}" font-size="10" fill="#1a1a1a">DP${i + 1}</text>`);
    }
  });
  northAndScale(parts, plot, scale);
  const bom = buildPlumbingBOM(downpipes || []);
  const disclaimer = [
    'Indicative drainage layout + BOM only.',
    'Roof/stormwater plumbing to AS/NZS 3500.3,',
    'installed & certified by a LICENSED PLUMBER.',
    'Confirm legal point of discharge with council.',
  ];
  bomPanel(parts, 'STORMWATER — BOM', bom.items, '#2bb6c9', disclaimer, input.wastagePct ?? 0, 'uPVC pipe');
  parts.push(`</svg>`);
  return parts.join('');
}

// ── Electrical layout plan ──────────────────────────────────────────────────────────────────────

const ELEC_GLYPH: Record<string, { g: string; c: string; sq?: boolean }> = {
  board: { g: 'DB', c: '#d4a72c', sq: true },
  switch: { g: 'S', c: '#d4a72c' },
  light: { g: '◎', c: '#e8b33b' },
  gpo: { g: 'G', c: '#c9883b' },
};
function curve(a: XY, b: XY): string {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
  const cx = mx - dy * 0.18, cy = my + dx * 0.18;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}
export interface ElectricalPlanInput {
  lotPts: LatLng[];
  footprint?: LatLng[];
  nodes: ElecNode[];
  wires: Wire[];
  wastagePct?: number;
}
export function generateElectricalPlanSVG(input: ElectricalPlanInput): string {
  const { lotPts, footprint, nodes, wires } = input;
  if (!lotPts || lotPts.length < 3) return '';
  const { plot, map, scale } = frame(lotPts);
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}"><rect width="${W}" height="${H}" fill="#fff"/>`);
  lotAndStructure(parts, lotPts, footprint, map);
  // Wiring runs (curved).
  (wires || []).forEach((w) => { if (w.from && w.to) parts.push(`<path d="${curve(map(w.from), map(w.to))}" fill="none" stroke="#e8b33b" stroke-width="2.2" opacity="0.9"/>`); });
  // Nodes.
  (nodes || []).forEach((n) => {
    const g = ELEC_GLYPH[n.kind || 'light'] || ELEC_GLYPH.light;
    const m = map({ lat: n.lat, lng: n.lng });
    if (g.sq) parts.push(`<rect x="${(m.x - 9).toFixed(1)}" y="${(m.y - 9).toFixed(1)}" width="18" height="18" rx="3" fill="${g.c}" stroke="#1a1a1a" stroke-width="2"/>`);
    else parts.push(`<circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="9" fill="${g.c}" stroke="#1a1a1a" stroke-width="2"/>`);
    parts.push(`<text x="${m.x.toFixed(1)}" y="${(m.y + 3.5).toFixed(1)}" font-size="9" fill="#1a1a1a" text-anchor="middle" font-weight="bold">${esc(g.g)}</text>`);
  });
  northAndScale(parts, plot, scale);
  const bom = buildElectricalBOM(nodes || [], wires || []);
  const disclaimer = [
    'Indicative lighting layout + BOM only.',
    'All electrical work to AS/NZS 3000, installed &',
    'certified by a LICENSED ELECTRICIAN (CES/CCEW).',
    'Cable sizes/lengths to be confirmed on site.',
  ];
  bomPanel(parts, 'ELECTRICAL — BOM', bom.items, '#d4a72c', disclaimer, input.wastagePct ?? 0, 'cable');
  parts.push(`</svg>`);
  return parts.join('');
}
