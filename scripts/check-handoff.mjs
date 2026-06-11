// Validates the canonical full handoff fixture against the Engineering schema and
// asserts the water-services + electrical blocks parse through intact. This is the
// receiving-end proof that an Intelligence export of this shape is consumed.
//   node scripts/check-handoff.mjs
import { build } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFileSync, rmSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../src');

const result = await build({
  entryPoints: [resolve(src, 'lib/handoffSchema.ts')],
  bundle: true, format: 'esm', platform: 'node', write: false,
  alias: { '@': src },
});
const tmp = mkdtempSync(resolve(tmpdir(), 'handoff-check-'));
const p = resolve(tmp, 'handoffSchema.mjs');
writeFileSync(p, result.outputFiles[0].text);

const out = [];
const check = (name, pass, detail = '') => out.push({ name, pass, detail });

try {
  const { parseHandoff } = await import(pathToFileURL(p).href);
  const json = readFileSync(resolve(here, '../sample-site-export-full.json'), 'utf8');
  const r = parseHandoff(json);

  check('fixture parses as a valid handoff', r.ok, r.error ?? '');
  const d = r.data ?? {};
  const swB = d.boundaries?.stormwater;
  const swE = d.engineeringPackage?.stormwater;
  check('stormwater present under boundaries + engineeringPackage', !!swB && !!swE,
    `b=${!!swB} ep=${!!swE}`);
  check('storm definition survives (duration + source)',
    swB?.designRainfall?.durationMin === 5 && swB?.designRainfall?.source === 'BoM IFD 2016',
    `${swB?.designRainfall?.durationMin}min ${swB?.designRainfall?.source}`);
  check('per-downpipe sizing survives (maxRoofM2 + per-DP overCapacity)',
    Array.isArray(swB?.dischargePoints) && swB.dischargePoints.length === 2 &&
    swB.dischargePoints[1].maxRoofM2 === 24 && swB.dischargePoints[1].overCapacity === true,
    `${swB?.dischargePoints?.length} DPs`);
  const elB = d.boundaries?.electrical;
  const elE = d.engineeringPackage?.electrical;
  check('electrical present under boundaries + engineeringPackage', !!elB && !!elE,
    `b=${!!elB} ep=${!!elE}`);
  check('electrical scope + luminaires + light-spill survive',
    !!elB?.scope && Array.isArray(elB?.luminaires) && elB.luminaires.length === 2 && elB.lightSpillConstraint === true,
    `${elB?.luminaires?.length} luminaires, spill=${elB?.lightSpillConstraint}`);

  let failed = 0;
  for (const c of out) { if (!c.pass) failed++; console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}${c.detail ? `  (${c.detail})` : ''}`); }
  console.log(`\n${out.length - failed}/${out.length} checks passed.`);
  process.exit(failed ? 1 : 0);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
