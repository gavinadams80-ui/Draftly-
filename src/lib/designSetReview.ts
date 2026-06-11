// ── Import a Drafting handback for re-evaluation (Drafting → Engineering) ──
// Reads a `.designset.json`, maps it back onto Engineering's inputs (geometry →
// ProjectConfig, members → section overrides, loads → wind, project → title
// block). Setting these makes Engineering's existing reactive calc engine
// re-run: it re-checks each (possibly amended) member, re-values the design, and
// the calc PDF can then be issued. No new calc code — the engine is the judge.

import { parseDesignSet, type DesignSet, type TitleBlockData } from '@draftly/drawings';
import type { ProjectConfig, MemberOverrides } from '@/types';

export interface ReviewInputs {
  ds: DesignSet;
  config: Partial<ProjectConfig>;
  overrides: MemberOverrides;
  titleBlock: Partial<TitleBlockData>;
  northRotation: number;
  // Drafting/Certification checklist ticks returned in the handback, so the
  // progressive checklist keeps its downstream state when re-imported.
  carriedReadiness?: { id: string; status: 'done' | 'todo' | 'na' }[];
}

/** Parse + map a handback DesignSet onto Engineering's inputs. Throws on bad input. */
export function readDesignSetForReview(json: string): ReviewInputs {
  const ds = parseDesignSet(json);
  // Read the readiness block straight from the raw JSON — the typed parser may
  // drop unknown keys, but this carried list must survive the round-trip.
  let carriedReadiness: ReviewInputs['carriedReadiness'];
  try {
    const raw = JSON.parse(json) as { results?: { readiness?: { items?: unknown } } };
    const items = raw?.results?.readiness?.items;
    if (Array.isArray(items)) {
      carriedReadiness = items
        .filter((x): x is { id: string; status: 'done' | 'todo' | 'na' } =>
          !!x && typeof x.id === 'string' && ['done', 'todo', 'na'].includes(x.status))
        .map((x) => ({ id: x.id, status: x.status }));
    }
  } catch { /* ignore — handback without readiness */ }
  const g = ds.geometry;
  const sec = (role: string) => ds.members.find(m => m.role === role)?.section ?? null;
  const wind = typeof ds.loads?.windUltimateKpa === 'number' ? ds.loads.windUltimateKpa : undefined;

  return {
    ds,
    config: {
      attachment: g.attachment as ProjectConfig['attachment'],
      roofType: g.roofType as ProjectConfig['roofType'],
      width: g.width / 1000,
      depth: g.depth / 1000,
      height: g.height / 1000,
      pitch: g.pitch,
      portalFrameCount: g.portalFrameCount,
      ...(wind !== undefined ? { windPressureKpa: wind } : {}),
    },
    // Force the returned sections so the engine evaluates exactly what came back.
    overrides: {
      beam: sec('rafter'),
      post: sec('post'),
      purlin: sec('purlin'),
      ledger: sec('ledger'),
      fascia: sec('fascia'),
      gableChord: sec('gableChord'),
      gableDropper: sec('gableDropper'),
      gableTopChord: null,
    } as MemberOverrides,
    titleBlock: ds.project,
    northRotation: g.northRotation ?? 0,
    carriedReadiness,
  };
}
