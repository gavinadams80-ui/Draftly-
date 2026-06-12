// Site Plan — Planning Overlays.
//
// A self-contained SVG of the lot with every confirmed planning overlay drawn over it, clipped to
// the parcel so an overlay that covers only PART of the block (e.g. a bushfire overlay clipping one
// corner of a rural lot) reads correctly. The geometry is carried from Draftly Intelligence, where
// the overlays come straight from the official government spatial layers — this sheet just renders
// what was found onto the block so the engineer can make siting/design decisions against it.
//
// Pure: geometry in, SVG string out. No dependency on the shared drawings package — it owns its own
// lat/lng → metre projection so overlays and the lot share one coordinate frame and stay aligned.

export interface LatLng { lat: number; lng: number }

export interface OverlayShapeInput {
  code?: string;
  name?: string;
  type?: string;
  partial?: boolean;     // true = covers only part of the lot
  rings?: LatLng[][];    // polygon parts (outer + holes), parcel-intersected
}

export interface OverlaySitePlanInput {
  lotPts: LatLng[];
  overlays: OverlayShapeInput[];
  footprint?: LatLng[];
  frontBoundaryIndex?: number;
  areaM2?: number;
  council?: string;
}

const FONT = "'DM Mono', ui-monospace, monospace";

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

export function generateOverlaySitePlanSVG(input: OverlaySitePlanInput): string {
  const { lotPts, overlays, footprint, frontBoundaryIndex, areaM2, council } = input;
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

  // Fit the lot (the overlays are clipped to it, so the lot drives the bounds).
  const lotXY = lotPts.map(proj);
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of lotXY) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y); }
  const bw = Math.max(maxx - minx, 0.001), bh = Math.max(maxy - miny, 0.001);
  const pad = 1.08;
  const scale = Math.min(plotW / (bw * pad), plotH / (bh * pad)); // px per metre
  const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
  const offx = plot.x0 + plotW / 2, offy = plot.y0 + plotH / 2;
  const map = (p: LatLng) => {
    const q = proj(p);
    return { x: offx + (q.x - cx) * scale, y: offy + (q.y - cy) * scale };
  };
  const ptsAttr = (ring: LatLng[]) => ring.map((p) => { const m = map(p); return `${m.x.toFixed(1)},${m.y.toFixed(1)}`; }).join(' ');

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}">`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`);

  // Lot clip-path — overlays render only where they fall inside the block.
  parts.push(`<defs><clipPath id="lotclip"><polygon points="${ptsAttr(lotPts)}"/></clipPath></defs>`);

  // Lot fill.
  parts.push(`<polygon points="${ptsAttr(lotPts)}" fill="#f6f4ee" stroke="none"/>`);

  // Overlays, clipped to the lot. Each overlay is one path of all its rings (evenodd = holes subtract).
  const drawn = (overlays || []).filter((o) => o.rings && o.rings.length);
  parts.push(`<g clip-path="url(#lotclip)">`);
  drawn.forEach((o) => {
    const col = overlayColor(o.type);
    const d = (o.rings || [])
      .filter((r) => r.length >= 3)
      .map((r) => 'M' + r.map((p) => { const m = map(p); return `${m.x.toFixed(1)} ${m.y.toFixed(1)}`; }).join(' L') + ' Z')
      .join(' ');
    if (d) parts.push(`<path d="${d}" fill="${col}" fill-opacity="0.34" fill-rule="evenodd" stroke="${col}" stroke-width="1.4" stroke-dasharray="5,3" stroke-opacity="0.9"/>`);
  });
  parts.push(`</g>`);

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
  parts.push(`<text x="${lx + 14}" y="${ly + 6}" font-size="14" fill="#1a1a1a" font-weight="bold">PLANNING OVERLAYS</text>`);
  ly += 26;
  if (council) { parts.push(`<text x="${lx + 14}" y="${ly}" font-size="11" fill="#555">${esc(council)}</text>`); ly += 18; }
  if (typeof areaM2 === 'number' && areaM2 > 0) { parts.push(`<text x="${lx + 14}" y="${ly}" font-size="11" fill="#555">Lot area: ${Math.round(areaM2).toLocaleString()} m²</text>`); ly += 20; }

  if (!drawn.length) {
    parts.push(`<text x="${lx + 14}" y="${ly + 4}" font-size="11" fill="#555">No mapped overlays on this lot.</text>`);
  } else {
    drawn.forEach((o) => {
      const col = overlayColor(o.type);
      parts.push(`<rect x="${lx + 14}" y="${ly - 9}" width="14" height="14" fill="${col}" fill-opacity="0.34" stroke="${col}" stroke-width="1.4"/>`);
      const label = `${o.code ? o.code + ' — ' : ''}${o.name || o.type || 'Overlay'}`;
      const lines = wrap(label, 26);
      lines.forEach((ln, i) => parts.push(`<text x="${lx + 34}" y="${ly + 2 + i * 14}" font-size="11" fill="#1a1a1a">${esc(ln)}</text>`));
      ly += 2 + lines.length * 14;
      parts.push(`<text x="${lx + 34}" y="${ly + 2}" font-size="10" fill="${o.partial ? '#b8430f' : '#555'}">${o.partial ? '▲ covers PART of the lot' : 'covers the whole lot'}</text>`);
      ly += 22;
    });
  }

  // Footer caveat — honour the data-integrity intent (indicative, confirm extent on the portal).
  parts.push(`<text x="${lx + 14}" y="${H - M - 16}" font-size="9.5" fill="#888">Overlay extents are indicative,</text>`);
  parts.push(`<text x="${lx + 14}" y="${H - M - 4}" font-size="9.5" fill="#888">from gov spatial data — confirm</text>`);
  parts.push(`<text x="${lx + 14}" y="${H - M + 8}" font-size="9.5" fill="#888">the mapped extent on the portal.</text>`);

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
