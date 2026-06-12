// ── Session autosave (localStorage) ──
// The app keeps ALL design state in React state — closing or refreshing the tab
// destroys the design. This module persists a debounce-snapshot of that state
// under a versioned key so the session survives a reload. It is intentionally
// schema-agnostic: App.tsx owns the snapshot shape and validates it on restore;
// this module only handles the storage envelope (versioning, timestamps,
// corruption, quota).

const KEY = 'draftly-eng:autosave:v1';
const VERSION = 1;

interface Envelope {
  v: number;
  savedAt: number;       // epoch ms
  state: Record<string, unknown>;
}

/**
 * Persist a snapshot. Returns the save timestamp, or null if storage is
 * unavailable/full. On a quota failure (e.g. a multi-MB aerial photo in the
 * snapshot) it retries once with `slimState` — a caller-provided copy with the
 * large payloads stripped — so the design data still survives even when the
 * imagery doesn't.
 */
export function saveSession(state: object, slimState?: object): number | null {
  const savedAt = Date.now();
  for (const s of slimState ? [state, slimState] : [state]) {
    try {
      const envelope: Envelope = { v: VERSION, savedAt, state: s as Record<string, unknown> };
      localStorage.setItem(KEY, JSON.stringify(envelope));
      return savedAt;
    } catch {
      // QuotaExceeded, storage disabled, or a non-serializable value — try the
      // slim snapshot (if any), otherwise give up quietly: autosave must never
      // break the app.
    }
  }
  return null;
}

/**
 * Read the saved snapshot. Returns null (and discards the entry) when nothing
 * is saved, the JSON is corrupt, or the envelope doesn't match this version —
 * schema drift means "start clean", never a crash.
 */
export function loadSession(): { savedAt: number; state: Record<string, unknown> } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const env = JSON.parse(raw) as Partial<Envelope> | null;
    if (
      !env || typeof env !== 'object' ||
      env.v !== VERSION ||
      typeof env.savedAt !== 'number' ||
      !env.state || typeof env.state !== 'object' || Array.isArray(env.state)
    ) {
      clearSession();
      return null;
    }
    return { savedAt: env.savedAt, state: env.state };
  } catch {
    clearSession();
    return null;
  }
}

/** Drop the saved snapshot ("Start fresh"). */
export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}

/** "14:32" for a same-day save, "12 Jun, 14:32" otherwise. */
export function formatSavedTime(at: number): string {
  const d = new Date(at);
  const time = d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}, ${time}`;
}
