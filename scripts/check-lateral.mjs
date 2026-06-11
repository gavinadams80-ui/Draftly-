// Standalone runner for the per-side lateral-restraint calc checks.
// No test runner is configured, so we bundle engine.ts with esbuild (its only
// import is a type-only import, fully erased) and execute the self-checks.
//   node scripts/check-lateral.mjs
import { build } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const enginePath = resolve(here, '../src/lib/engine.ts');

const result = await build({
  entryPoints: [enginePath],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});

const tmp = mkdtempSync(resolve(tmpdir(), 'lateral-check-'));
const bundlePath = resolve(tmp, 'engine.mjs');
writeFileSync(bundlePath, result.outputFiles[0].text);

try {
  const mod = await import(pathToFileURL(bundlePath).href);
  const checks = [...mod.runLateralRestraintChecks(), ...mod.runPlyDiaphragmChecks()];
  let failed = 0;
  for (const c of checks) {
    const tag = c.pass ? 'PASS' : 'FAIL';
    if (!c.pass) failed++;
    console.log(`  [${tag}] ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  console.log(`\n${checks.length - failed}/${checks.length} checks passed.`);
  process.exit(failed ? 1 : 0);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
