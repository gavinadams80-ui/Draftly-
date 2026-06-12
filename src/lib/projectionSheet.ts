// ── Projection sheet: plan over Section A-A ──
// Composes a building plan view directly ABOVE a cross-section so the two share a
// single vertical projection line through the roof centreline (ridge / mid-span).
// The reader can project up/down between the plan and the section, AS1100 third-angle
// style. Both inputs are raw drawing SVGs (NOT title-blocked); the result is an inner
// SVG string to hand to withTitleBlock().
//
// Alignment: each child drawing is nested at 1:1 and translated so its own roof
// centreline lands on a common sheet centreline (CX). The centreline x WITHIN each
// drawing's coordinate space is computed by planRidgeX()/sectionRidgeX(), which mirror
// the layout maths in @draftly/drawings (planDrawings.ts / wallSection.ts). If those
// generators change their canvas/scale, these mirrors must track them.

import type { ProjectConfig } from '@/types';

const MONO = 'DM Mono,monospace';

/** Parse `viewBox="minX minY w h"` → numbers. */
function parseViewBox(svg: string): { minX: number; minY: number; w: number; h: number } {
  const m = svg.match(/viewBox="([^"]+)"/);
  if (!m) return { minX: 0, minY: 0, w: 100, h: 100 };
  const [minX, minY, w, h] = m[1].trim().split(/\s+/).map(Number);
  return { minX, minY, w, h };
}

/** Re-wrap a standalone drawing SVG as a positioned nested <svg> at 1:1 (keeps its viewBox). */
function placeNested(svg: string, x: number, y: number): string {
  const { w, h } = parseViewBox(svg);
  const vb = (svg.match(/viewBox="([^"]+)"/) || [, `0 0 ${w} ${h}`])[1];
  // Strip the outer <svg …> open tag (and its style="width:100%…", which would otherwise
  // size the nested svg to the parent viewport) and the closing tag; re-wrap.
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}" viewBox="${vb}">${inner}</svg>`;
}

/**
 * x of the roof centreline (ridge / gable apex) WITHIN generateBuildingPlanSVG's own
 * 700×580 viewBox. Mirrors planDrawings.ts: frameMidX = structLeftX + width·sc/2
 * (the standoff inset cancels), with the default (no explicit scale) page-fit.
 */
export function planRidgeX(config: ProjectConfig): number {
  const W = 700, H = 580;
  const margin = { top: 60, right: 85, bottom: 140, left: 90 };
  const drawW = W - margin.left - margin.right; // 525
  const drawH = H - margin.top - margin.bottom; // 380
  const sideClear = config.attachment === 'three-side' ? 0.4 : 0.7;
  const wallThick = 0.35;
  const totalW = config.width + sideClear * 2;
  const totalH = wallThick + config.depth;
  const sc = Math.min(drawW / totalW, drawH / totalH) * 0.88; // px per m
  const structLeftX = margin.left + sideClear * sc;
  return structLeftX + (config.width * sc) / 2;
}

/**
 * x of the gable apex / mid-span WITHIN generateWallSectionSVG's own viewBox, at the
 * default scale (0.12). Mirrors wallSection.ts: midX = lBR + spPx/2, lBR = 95 + 230·sc.
 * `spanMm` is the span passed to the section generator (the same value used for the sheet).
 */
export function sectionRidgeX(spanMm: number): number {
  const sc = 0.12;
  const lBR = 95 + 230 * sc;      // 122.6
  const spPx = spanMm * sc;
  return lBR + spPx / 2;
}

export interface PlanOverSectionOpts {
  sectionLabel?: string; // e.g. 'A-A'
  planTitle?: string;
  sectionTitle?: string;
}

/**
 * Stack `planSvg` above `sectionSvg`, aligned so each drawing's roof centreline sits on
 * one vertical projection line. `planCentreX` / `sectionCentreX` are the centreline x in
 * each drawing's own coordinate space (use planRidgeX / sectionRidgeX).
 */
export function composePlanOverSection(
  planSvg: string,
  sectionSvg: string,
  planCentreX: number,
  sectionCentreX: number,
  opts: PlanOverSectionOpts = {},
): string {
  const plan = parseViewBox(planSvg);
  const sec = parseViewBox(sectionSvg);

  const LM = 24, RM = 24;        // left / right sheet margin
  const TOP = 46;                // room for the PLAN caption
  const GAP = 76;                // gap between plan bottom and section top (projection band)
  const BOT = 28;

  // Each child's on-sheet x of its centreline = childX + (centreX − minX). Solve so both
  // land on the common CX; CX chosen so the wider-offset child gets the left margin.
  const planOff = planCentreX - plan.minX;
  const secOff = sectionCentreX - sec.minX;
  const CX = LM + Math.max(planOff, secOff);
  const planX = CX - planOff;
  const secX = CX - secOff;

  const planY = TOP;
  const secY = TOP + plan.h + GAP;

  const sheetW = Math.max(planX + plan.w, secX + sec.w) + RM;
  const sheetH = secY + sec.h + BOT;

  const lineTop = planY;
  const lineBot = secY + sec.h;
  const secLabel = opts.sectionLabel ?? 'A-A';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetW.toFixed(0)} ${sheetH.toFixed(0)}" style="width:100%;max-width:${sheetW.toFixed(0)}px;display:block;">`;
  svg += `<rect width="${sheetW.toFixed(0)}" height="${sheetH.toFixed(0)}" fill="transparent"/>`;

  // ── Projection centreline through both drawings ──
  svg += `<line x1="${CX.toFixed(1)}" y1="${lineTop.toFixed(1)}" x2="${CX.toFixed(1)}" y2="${lineBot.toFixed(1)}" stroke="#c9a84c" stroke-width="0.8" stroke-dasharray="2 3 8 3" opacity="0.85"/>`;
  // Centreline ticks / callout in the projection band.
  const bandY = planY + plan.h + GAP / 2;
  svg += `<circle cx="${CX.toFixed(1)}" cy="${bandY.toFixed(1)}" r="3" fill="none" stroke="#c9a84c" stroke-width="0.8"/>`;
  svg += `<text x="${(CX + 8).toFixed(1)}" y="${(bandY + 3).toFixed(1)}" font-family="${MONO}" font-size="9" fill="#c9a84c">ROOF ℄ — project up / down</text>`;
  // Down-arrows hinting the projection direction.
  svg += `<path d="M ${CX.toFixed(1)} ${(bandY - 16).toFixed(1)} v 8 m -3 -3 l 3 3 l 3 -3" stroke="#c9a84c" stroke-width="0.8" fill="none" opacity="0.7"/>`;
  svg += `<path d="M ${CX.toFixed(1)} ${(bandY + 8).toFixed(1)} v 8 m -3 -3 l 3 3 l 3 -3" stroke="#c9a84c" stroke-width="0.8" fill="none" opacity="0.7"/>`;

  // ── Captions ──
  svg += `<text x="${planX.toFixed(1)}" y="${(planY - 14).toFixed(1)}" font-family="${MONO}" font-size="13" font-weight="700" fill="#c8cce0">${opts.planTitle ?? 'PLAN'}</text>`;
  svg += `<text x="${secX.toFixed(1)}" y="${(secY - 12).toFixed(1)}" font-family="${MONO}" font-size="13" font-weight="700" fill="#c8cce0">${opts.sectionTitle ?? `SECTION ${secLabel}`}</text>`;

  // ── The two drawings ──
  svg += placeNested(planSvg, planX, planY);
  svg += placeNested(sectionSvg, secX, secY);

  svg += `</svg>`;
  return svg;
}
