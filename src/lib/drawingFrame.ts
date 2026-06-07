// Facade → @draftly/drawings (shared library). Logic lives in the package;
// this thin re-export keeps existing @/lib import sites working unchanged.
// One source of truth — see docs/connection-library-roadmap.md.
export type { DrawingInfo } from '@draftly/drawings';
export { generateDrawingFrame, getWorkingArea } from '@draftly/drawings';
