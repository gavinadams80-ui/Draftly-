// ── Session autosave (localStorage) ──
// The app holds the whole design in React state; before this existed, closing
// or refreshing the tab silently destroyed the design unless the user had
// manually exported a .designset.json. This persists the design INPUTS on
// every change and offers them back on the next load.
//
// Storage-shape-agnostic: the caller owns the state type. The key is
// versioned — bump it when the saved shape changes incompatibly; old
// payloads are simply discarded (parse/validate failures return null).

const KEY = 'draftly-eng.autosave.v1';
const DEBOUNCE_MS = 800;

export interface AutosavePayload<S> {
  savedAt: string; // ISO timestamp
  state: S;
}

export function loadAutosave<S>(): AutosavePayload<S> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutosavePayload<S>;
    if (!parsed || typeof parsed.savedAt !== 'string' || parsed.state == null) return null;
    return parsed;
  } catch {
    return null;
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Debounced save — call freely from an effect; writes settle after a pause. */
export function saveAutosaveDebounced<S>(state: S): void {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ savedAt: new Date().toISOString(), state }));
    } catch {
      // Quota or privacy mode — autosave is best-effort; never break the app.
    }
  }, DEBOUNCE_MS);
}

export function clearAutosave(): void {
  clearTimeout(timer);
  timer = undefined;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
