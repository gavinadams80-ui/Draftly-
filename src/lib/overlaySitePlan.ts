// Site Plan — Planning Overlays / Setbacks & Easements.
//
// A self-contained SVG of the lot that can layer, as needed: a GPS/aerial underlay, the proposed
// structure, the greyed no-build setback zone (from the measured offsets), registered easements
// (greyed + marked), and planning overlays — each clipped to the parcel so anything covering only
// PART of the block reads correctly. Geometry is carried from Draftly Intelligence (official gov
// spatial layers + the siting tool); this just renders it onto the block so an engineer/inspector
// has one clear visual to make and discuss decisions against.
//
// Pure: geometry in, SVG string out. Owns its own lat/lng → metre projection so every layer shares
// one coordinate frame and stays aligned. No dependency on the shared drawings package.

export interface LatLng { lat: number; lng: number }

export interface OverlayShapeInput {
  code?: string;
  name?: string;
  type?: string;
  partial?: boolean;     // true = covers only part of the lot
  rings?: LatLng[][];    // polygon parts (outer + holes), parcel-intersected
}

export interface EasementInput {
  kind: 'line' | 'polygon';
  label?: string;
  coords: LatLng[];
}

export interface OverlaySitePlanInput {
  lotPts: LatLng[];
  overlays?: OverlayShapeInput[];
  footprint?: LatLng[];
  frontBoundaryIndex?: number;
  areaM2?: number;
  council?: string;
  easements?: EasementInput[];
  offsets?: { front?: number; rear?: number; left?: number; right?: number }; // measured setbacks (m)
  aerial?: { imageBase64?: string; bbox?: [number, number, number, number] }; // [w, s, e, n]
  legendTitle?: string;  // legend header (default 'PLANNING OVERLAYS')
}

const FONT = "'DM Mono', ui-monospace, monospace";
const GREY = '#6b6b6b';

// Overlay colour by classified type (matches the Intelligence siting-map palette intent).
function overlayColor(type?: string): string {
  switch ((type || '').toLowerCase()) {
    case 'bushfire':       return '#e8743b';
    case 'flood':
    case 'inundation':     return '#3b82c4';
    case 'heritage':       return '#9b59b6';
    case 'environmental':
    case 'vegetation':
    case 'significant landscape': return '#4a9b5e';
    case 'erosion':
    case 'landslip':       return '#b08d57';
    default:               return '#c9a84c'; // gold accent — generic overlay
  }
}

// Equirectangular projection to local metres about the lot centroid (north up). Scaling to the
// sheet happens after, so the absolute origin is irrelevant; metres keep the scale bar honest.
function projector(lat0: number, lng0: number) {
  const R = 6371000, k = Math.cos((lat0 * Math.PI) / 180);
  return (p: LatLng) => ({
    x: ((p.lng - lng0) * Math.PI) / 180 * R * k,
    y: -(((p.lat - lat0) * Math.PI) / 180) * R, // flip so geographic north is up
  });
}

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));
}

interface XY { x: number; y: number }
function polyCentroid(pts: XY[]): XY {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
}

// Per-edge no-build setback distances (metres). Maps front/rear/left/right onto the lot edges using
// the known front edge; falls back to a uniform inset (smallest provided offset) when front is
// unknown or the lot isn't a simple quad. Returns one distance per edge (0 = no band).
function edgeSetbacks(lotM: XY[], offsets: NonNullable<OverlaySitePlanInput['offsets']>, frontIdx?: number): number[] {
  const n = lotM.length;
  const vals = [offsets.front, offsets.rear, offsets.left, offsets.right].filter((v): v is number => typeof v === 'number' && v > 0);
  if (!vals.length) return new Array(n).fill(0);
  const out = new Array(n).fill(0);

  if (typeof frontIdx === 'number' && frontIdx >= 0 && frontIdx < n && n === 4) {
    // A quad: opposite edge is the rear, the other two are the sides. (Reliable index arithmetic —
    // a geometric left/right split is ambiguous, so the two sides take left/right deterministically;
    // the plan is captioned indicative and the inspector reads the actual figures off it.)
    out[frontIdx] = offsets.front ?? 0;
    out[(frontIdx + 2) % 4] = offsets.rear ?? 0;
    out[(frontIdx + 1) % 4] = offsets.right ?? offsets.left ?? 0;
    out[(frontIdx + 3) % 4] = offsets.left ?? offsets.right ?? 0;
    return out;
  }
  // Fallback — uniform inset by the smallest provided setback.
  const uni = Math.min(...vals);
  return new Array(n).fill(uni);
}

export function generateOverlaySitePlanSVG(input: OverlaySitePlanInput): string {
  const { lotPts, overlays, footprint, frontBoundaryIndex, areaM2, council, easements, offsets, aerial } = input;
  if (!lotPts || lotPts.length < 3) return '';

  // Sheet layout — drawing on the left, legend column on the right.
  const W = 1000, H = 700, M = 44;
  const legendW = 250;
  const plot = { x0: M, y0: M, x1: W - legendW - M, y1: H - M };
  const plotW = plot.x1 - plot.x0, plotH = plot.y1 - plot.y0;

  // Centroid of the lot for the projection origin.
  const lat0 = lotPts.reduce((s, p) => s + p.lat, 0) / lotPts.length;
  const lng0 = lotPts.reduce((s, p) => s + p.lng, 0) / lotPts.length;
  const proj = projector(lat0, lng0);

  const lotM = lotPts.map(proj);
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of lotM) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); }
  const bw = Math.max(maxx - minx, 0.001), bh = Math.max(maxy - miny, 0.001);
  const pad = 1.08;
  const scale = Math.min(plotW / (bw * pad), plotH / (bh * pad)); // px per metre
  const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
  const offx = plot.x0 + plotW / 2, offy = plot.y0 + plotH / 2;
  const mapM = (m: XY): XY => ({ x: offx + (m.x - cx) * scale, y: offy + (m.y - cy) * scale });
  const map = (p: LatLng): XY => mapM(proj(p));
  const ptsAttr = (ring: LatLng[]) => ring.map((p) => { const m = map(p); return `${m.x.toFixed(1)},${m.y.toFixed(1)}`; }).join(' ');
  const ptsAttrXY = (ring: XY[]) => ring.map((m) => { const s = mapM(m); return `${s.x.toFixed(1)},${s.y.toFixed(1)}`; }).join(' ');

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}">`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`);

  // Defs — lot clip-path + a grey diagonal hatch for easement areas.
  parts.push(`<defs><clipPath id="lotclip"><polygon points="${ptsAttr(lotPts)}"/></clipPath>`
    + `<pattern id="easehatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`
    + `<rect width="7" height="7" fill="${GREY}" fill-opacity="0.10"/><line x1="0" y1="0" x2="0" y2="7" stroke="${GREY}" stroke-width="1.4" stroke-opacity="0.55"/></pattern></defs>`);

  const hasAerial = !!(aerial?.imageBase64 && aerial.bbox && aerial.bbox.length === 4);

  // GPS/aerial underlay (base64 only — an external url won't embed in the exported PDF), clipped to lot.
  if (hasAerial) {
    const [w, s, e, n] = aerial!.bbox!;
    const tl = map({ lat: n, lng: w }), br = map({ lat: s, lng: e });
    const ix = Math.min(tl.x, br.x), iy = Math.min(tl.y, br.y);
    const iw = Math.abs(br.x - tl.x), ih = Math.abs(br.y - tl.y);
    const raw = aerial!.imageBase64!.startsWith('data:') ? aerial!.imageBase64! : `data:image/jpeg;base64,${aerial!.imageBase64!}`;
    parts.push(`<image href="${esc(raw)}" x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" preserveAspectRatio="none" opacity="0.85" clip-path="url(#lotclip)"/>`);
  }

  // Lot fill — solid when there's no aerial, a faint wash over the aerial so lines stay legible.
  parts.push(`<polygon points="${ptsAttr(lotPts)}" fill="${hasAerial ? '#ffffff' : '#f6f4ee'}" fill-opacity="${hasAerial ? 0.08 : 1}" stroke="none"/>`);

  // No-build setback zone — grey perimeter bands inset from each edge by the measured offset.
  const setbacks = offsets ? edgeSetbacks(lotM, offsets, frontBoundaryIndex) : [];
  let drewSetback = false;
  if (setbacks.some((d) => d > 0)) {
    const cen = polyCentroid(lotM);
    parts.push(`<g clip-path="url(#lotclip)">`);
    const n = lotM.length;
    for (let i = 0; i < n; i++) {
      const d = setbacks[i];
      if (!(d > 0)) continue;
      const a = lotM[i], b = lotM[(i + 1) % n];
      const ex = b.x - a.x, ey = b.y - a.y, len = Math.hypot(ex, ey) || 1;
      // Inward normal (toward the centroid).
      let nx = -ey / len, ny = ex / len;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if ((cen.x - mid.x) * nx + (cen.y - mid.y) * ny < 0) { nx = -nx; ny = -ny; }
      const band: XY[] = [a, b, { x: b.x + nx * d, y: b.y + ny * d }, { x: a.x + nx * d, y: a.y + ny * d }];
      parts.push(`<polygon points="${ptsAttrXY(band)}" fill="${GREY}" fill-opacity="0.30" stroke="none"/>`);
      // Building line (inner edge of the band) + distance label, nudged inboard so it stays legible.
      const i1 = mapM({ x: a.x + nx * d, y: a.y + ny * d }), i2 = mapM({ x: b.x + nx * d, y: b.y + ny * d });
      parts.push(`<line x1="${i1.x.toFixed(1)}" y1="${i1.y.toFixed(1)}" x2="${i2.x.toFixed(1)}" y2="${i2.y.toFixed(1)}" stroke="${GREY}" stroke-width="1.2" stroke-dasharray="6,4"/>`);
      // Label sits just inside the building line (offset a touch further toward the centre than the band).
      const lp = mapM({ x: mid.x + nx * d, y: mid.y + ny * d });
      const inwx = (cen.x - mid.x), inwy = (cen.y - mid.y), inwl = Math.hypot(inwx, inwy) || 1;
      const lxp = lp.x + (inwx / inwl) * 14, lyp = lp.y + (inwy / inwl) * 14;
      const lbl = `${d.toFixed(1)} m`;
      parts.push(`<rect x="${(lxp - lbl.length * 3.1).toFixed(1)}" y="${(lyp - 9).toFixed(1)}" width="${(lbl.length * 6.2).toFixed(1)}" height="13" fill="#fff" fill-opacity="0.78"/>`);
      parts.push(`<text x="${lxp.toFixed(1)}" y="${(lyp + 1).toFixed(1)}" font-size="10" fill="${GREY}" text-anchor="middle">${lbl}</text>`);
      drewSetback = true;
    }
    parts.push(`</g>`);
  }

  // Overlays, clipped to the lot. Each overlay is one path of all its rings (evenodd = holes subtract).
  const drawnOv = (overlays || []).filter((o) => o.rings && o.rings.length);
  if (drawnOv.length) {
    parts.push(`<g clip-path="url(#lotclip)">`);
    drawnOv.forEach((o) => {
      const col = overlayColor(o.type);
      const d = (o.rings || [])
        .filter((r) => r.length >= 3)
        .map((r) => 'M' + r.map((p) => { const m = map(p); return `${m.x.toFixed(1)} ${m.y.toFixed(1)}`; }).join(' L') + ' Z')
        .join(' ');
      if (d) parts.push(`<path d="${d}" fill="${col}" fill-opacity="0.34" fill-rule="evenodd" stroke="${col}" stroke-width="1.4" stroke-dasharray="5,3" stroke-opacity="0.9"/>`);
    });
    parts.push(`</g>`);
  }

  // Easements — greyed, clipped to lot, with a marker tag. Polygons hatch; lines draw a bold run.
  const drawnEase = (easements || []).filter((e) => e.coords && e.coords.length >= 2);
  if (drawnEase.length) {
    parts.push(`<g clip-path="url(#lotclip)">`);
    drawnEase.forEach((e) => {
      if (e.kind === 'polygon' && e.coords.length >= 3) {
        parts.push(`<polygon points="${ptsAttr(e.coords)}" fill="url(#easehatch)" stroke="${GREY}" stroke-width="1.6"/>`);
      } else {
        const dpath = 'M' + e.coords.map((p) => { const m = map(p); return `${m.x.toFixed(1)} ${m.y.toFixed(1)}`; }).join(' L');
        parts.push(`<path d="${dpath}" fill="none" stroke="${GREY}" stroke-width="3.2" stroke-opacity="0.85"/>`);
        parts.push(`<path d="${dpath}" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="3,3"/>`);
      }
    });
    parts.push(`</g>`);
    // Markers (outside the clip so the tag is always readable).
    drawnEase.forEach((e) => {
      const mids = e.coords.map(map);
      const c = polyCentroid(e.kind === 'line' ? [mids[Math.floor(mids.length / 2)]] : mids);
      parts.push(`<g><rect x="${(c.x - 7).toFixed(1)}" y="${(c.y - 7).toFixed(1)}" width="14" height="14" fill="${GREY}" rx="2"/>`
        + `<text x="${c.x.toFixed(1)}" y="${(c.y + 3.5).toFixed(1)}" font-size="10" fill="#fff" text-anchor="middle" font-weight="bold">E</text></g>`);
    });
  }

  // Lot boundary on top.
  parts.push(`<polygon points="${ptsAttr(lotPts)}" fill="none" stroke="#1a1a1a" stroke-width="2"/>`);

  // Front boundary highlight (if known).
  if (typeof frontBoundaryIndex === 'number' && frontBoundaryIndex >= 0 && frontBoundaryIndex < lotPts.length) {
    const a = map(lotPts[frontBoundaryIndex]);
    const b = map(lotPts[(frontBoundaryIndex + 1) % lotPts.length]);
    parts.push(`<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#1a1a1a" stroke-width="4"/>`);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    parts.push(`<text x="${mx.toFixed(1)}" y="${(my + 16).toFixed(1)}" font-size="12" fill="#1a1a1a" text-anchor="middle">FRONT</text>`);
  }

  // Proposed structure footprint.
  if (footprint && footprint.length >= 3) {
    parts.push(`<polygon points="${ptsAttr(footprint)}" fill="#1a1a1a" fill-opacity="0.12" stroke="#1a1a1a" stroke-width="1.6"/>`);
    const fc = footprint.reduce((s, p) => ({ x: s.x + map(p).x, y: s.y + map(p).y }), { x: 0, y: 0 });
    parts.push(`<text x="${(fc.x / footprint.length).toFixed(1)}" y="${(fc.y / footprint.length).toFixed(1)}" font-size="11" fill="#1a1a1a" text-anchor="middle">PROPOSED</text>`);
  }

  // North arrow (geographic north is up).
  const nx = plot.x1 - 26, ny = plot.y0 + 34;
  parts.push(`<g stroke="#1a1a1a" fill="#1a1a1a"><line x1="${nx}" y1="${ny + 20}" x2="${nx}" y2="${ny - 16}" stroke-width="1.6"/><polygon points="${nx},${ny - 22} ${nx - 5},${ny - 12} ${nx + 5},${ny - 12}"/></g>`);
  parts.push(`<text x="${nx}" y="${ny + 34}" font-size="11" fill="#1a1a1a" text-anchor="middle">N</text>`);

  // Scale bar — pick a round metre length ~120px wide.
  const targetM = 120 / scale;
  const niceM = [1, 2, 5, 10, 20, 50, 100, 200].reduce((a, v) => (Math.abs(v - targetM) < Math.abs(a - targetM) ? v : a), 1);
  const sbPx = niceM * scale;
  const sbx = plot.x0 + 8, sby = plot.y1 - 12;
  parts.push(`<line x1="${sbx}" y1="${sby}" x2="${(sbx + sbPx).toFixed(1)}" y2="${sby}" stroke="#1a1a1a" stroke-width="2"/>`);
  parts.push(`<line x1="${sbx}" y1="${sby - 4}" x2="${sbx}" y2="${sby + 4}" stroke="#1a1a1a" stroke-width="2"/>`);
  parts.push(`<line x1="${(sbx + sbPx).toFixed(1)}" y1="${sby - 4}" x2="${(sbx + sbPx).toFixed(1)}" y2="${sby + 4}" stroke="#1a1a1a" stroke-width="2"/>`);
  parts.push(`<text x="${(sbx + sbPx / 2).toFixed(1)}" y="${sby - 8}" font-size="11" fill="#1a1a1a" text-anchor="middle">${niceM} m</text>`);

  // ── Legend column ──
  const lx = W - legendW - 8;
  parts.push(`<line x1="${lx}" y1="${M}" x2="${lx}" y2="${H - M}" stroke="#ddd" stroke-width="1"/>`);
  let ly = M + 6;
  parts.push(`<text x="${lx + 14}" y="${ly + 6}" font-size="14" fill="#1a1a1a" font-weight="bold">${esc(input.legendTitle || 'PLANNING OVERLAYS')}</text>`);
  ly += 26;
  if (council) { parts.push(`<text x="${lx + 14}" y="${ly}" font-size="11" fill="#555">${esc(council)}</text>`); ly += 18; }
  if (typeof areaM2 === 'number' && areaM2 > 0) { parts.push(`<text x="${lx + 14}" y="${ly}" font-size="11" fill="#555">Lot area: ${Math.round(areaM2).toLocaleString()} m²</text>`); ly += 20; }
  if (hasAerial) { parts.push(`<text x="${lx + 14}" y="${ly}" font-size="10" fill="#777">Aerial: gov satellite imagery</text>`); ly += 18; }

  const legendRow = (swatch: string, lines: string[], note?: string, noteColor = '#555') => {
    parts.push(swatch.replace('{X}', `${lx + 14}`).replace('{Y}', `${ly - 9}`));
    lines.forEach((ln, i) => parts.push(`<text x="${lx + 34}" y="${ly + 2 + i * 14}" font-size="11" fill="#1a1a1a">${esc(ln)}</text>`));
    ly += 2 + lines.length * 14;
    if (note) { parts.push(`<text x="${lx + 34}" y="${ly + 2}" font-size="10" fill="${noteColor}">${esc(note)}</text>`); ly += 14; }
    ly += 8;
  };

  if (drewSetback) {
    legendRow(`<rect x="{X}" y="{Y}" width="14" height="14" fill="${GREY}" fill-opacity="0.22"/>`, ['No-build setback'], 'measured offsets — confirm w/ surveyor');
  }
  if (drawnEase.length) {
    legendRow(`<rect x="{X}" y="{Y}" width="14" height="14" fill="url(#easehatch)" stroke="${GREY}" stroke-width="1.4"/>`, ['Easement / no-build'], `${drawnEase.length} registered — do not build over`);
  }
  if (!drawnOv.length && !drewSetback && !drawnEase.length) {
    parts.push(`<text x="${lx + 14}" y="${ly + 4}" font-size="11" fill="#555">No mapped constraints on this lot.</text>`);
  } else {
    drawnOv.forEach((o) => {
      const col = overlayColor(o.type);
      const label = `${o.code ? o.code + ' — ' : ''}${o.name || o.type || 'Overlay'}`;
      legendRow(
        `<rect x="{X}" y="{Y}" width="14" height="14" fill="${col}" fill-opacity="0.34" stroke="${col}" stroke-width="1.4"/>`,
        wrap(label, 26),
        o.partial ? '▲ covers PART of the lot' : 'covers the whole lot',
        o.partial ? '#b8430f' : '#555',
      );
    });
  }

  // Footer caveat.
  parts.push(`<text x="${lx + 14}" y="${H - M - 16}" font-size="9.5" fill="#888">Indicative, from gov spatial data</text>`);
  parts.push(`<text x="${lx + 14}" y="${H - M - 4}" font-size="9.5" fill="#888">+ siting measurements — confirm</text>`);
  parts.push(`<text x="${lx + 14}" y="${H - M + 8}" font-size="9.5" fill="#888">extents/offsets before lodging.</text>`);

  parts.push(`</svg>`);
  return parts.join('');
}

// Simple greedy word wrap to a character budget.
function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out.length ? out : [text];
}
