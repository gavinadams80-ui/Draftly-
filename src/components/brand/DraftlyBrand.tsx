// Draftly brand kit — one source of truth for the logo mark, the wordmark lockup,
// and the cross-app pipeline strip. The purple mark (#863bff family) is THE Draftly
// glyph; gold (--accent) stays the interface accent. Self-contained so it can drop
// into the header without new CSS plumbing.

import { Fragment } from 'react';

// ── The Draftly mark ──────────────────────────────────────────────────────────
// Crisp, flat rendition of the favicon glyph (built to read sharp at 16–64px).
export function DraftlyMark({ size = 24, title = 'Draftly' }: { size?: number; title?: string }) {
  const h = Math.round((size * 46) / 48);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 48 46"
      fill="none"
      role="img"
      aria-label={title}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="draftly-mark-grad" x1="2" y1="0" x2="46" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9a5cff" />
          <stop offset="0.55" stopColor="#863bff" />
          <stop offset="1" stopColor="#7212ff" />
        </linearGradient>
      </defs>
      <path
        fill="url(#draftly-mark-grad)"
        d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
      />
    </svg>
  );
}

// ── The wordmark lockup (mark + "Draftly" + tagline) ────────────────────────────
export function DraftlyLogo({ tagline, onClick }: { tagline?: string; onClick?: () => void }) {
  return (
    <div className="logo-mark" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <DraftlyMark size={26} />
      <span className="logo-name">Draftly</span>
      {tagline && <span className="logo-tagline">{tagline}</span>}
    </div>
  );
}

// ── Cross-app pipeline strip ────────────────────────────────────────────────────
// Site Intelligence → Engineering → Drafting → Certification. Shows where you are in
// the suite; done stages read dim+ticked, the current stage glows gold, upcoming
// stages are muted. A stage may carry a handoff action (import/export) — those become
// clickable so the "next step" is one tap away.
export type PipelineStage = 'intelligence' | 'engineering' | 'drafting' | 'certification';

const STAGES: { id: PipelineStage; label: string; short: string }[] = [
  { id: 'intelligence',  label: 'Site Intelligence', short: 'Intel' },
  { id: 'engineering',   label: 'Engineering',       short: 'Eng' },
  { id: 'drafting',      label: 'Drafting',          short: 'Draft' },
  { id: 'certification', label: 'Certification',      short: 'Cert' },
];

export interface PipelineAction {
  label: string;
  onClick: () => void;
}

export function PipelineStrip({
  current,
  actions = {},
  compact = false,
}: {
  current: PipelineStage;
  actions?: Partial<Record<PipelineStage, PipelineAction>>;
  compact?: boolean;
}) {
  const curIdx = STAGES.findIndex(s => s.id === current);
  return (
    <nav
      aria-label="Draftly workflow"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--mono)' }}
    >
      {STAGES.map((s, i) => {
        const state = i < curIdx ? 'done' : i === curIdx ? 'current' : 'upcoming';
        const action = actions[s.id];
        const color =
          state === 'current' ? 'var(--accent)' :
          state === 'done'    ? 'var(--success)' :
          action              ? '#b8baf0' : 'var(--text-subtle)';
        const chip = (
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: compact ? 10 : 11, fontWeight: state === 'current' ? 700 : 500,
              letterSpacing: '0.04em', color,
              padding: state === 'current' ? '3px 9px' : '3px 6px',
              borderRadius: 5,
              background: state === 'current' ? 'rgba(201,168,76,0.12)' : 'transparent',
              border: state === 'current' ? '1px solid rgba(201,168,76,0.35)' : '1px solid transparent',
              textTransform: 'uppercase',
            }}
          >
            {state === 'done' && <span style={{ fontSize: 10 }}>✓</span>}
            {compact ? s.short : s.label}
          </span>
        );
        return (
          <Fragment key={s.id}>
            {i > 0 && <span style={{ color: 'var(--border2)', fontSize: 11 }}>→</span>}
            {action ? (
              <button
                type="button"
                onClick={action.onClick}
                title={action.label}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                {chip}
              </button>
            ) : chip}
          </Fragment>
        );
      })}
    </nav>
  );
}
