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
}

/** Parse + map a handback DesignSet onto Engineering's inputs. Throws on bad input. */
export function readDesignSetForReview(json: string): ReviewInputs {
  const ds = parseDesignSet(json);
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
  };
}
