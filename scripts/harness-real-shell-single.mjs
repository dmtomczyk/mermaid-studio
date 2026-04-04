import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'dist-harness', 'builder-real', 'index.html');
const artifactDir = path.join(projectRoot, '.artifacts', 'harness', 'builder-real');

const states = new Set(['flowchart-empty', 'flowchart-busy', 'sequence-empty', 'sequence-busy', 'imported-mixed-stress']);
const viewports = new Map([
  ['comfortable-540', { id: 'comfortable-540', width: 540, height: 1200 }],
  ['narrow-420', { id: 'narrow-420', width: 420, height: 1200 }],
  ['must-work-360', { id: 'must-work-360', width: 360, height: 1200 }],
  ['stress-320', { id: 'stress-320', width: 320, height: 1200 }]
]);

const args = process.argv.slice(2);
let stateId = 'flowchart-busy';
let viewportId = 'must-work-360';

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--state') {
    stateId = args[index + 1] || stateId;
    index += 1;
  } else if (arg === '--viewport') {
    viewportId = args[index + 1] || viewportId;
    index += 1;
  }
}

if (!states.has(stateId)) {
  console.error(`Unknown state '${stateId}'. Allowed: ${Array.from(states).join(', ')}`);
  process.exit(1);
}

const viewport = viewports.get(viewportId);
if (!viewport) {
  console.error(`Unknown viewport '${viewportId}'. Allowed: ${Array.from(viewports.keys()).join(', ')}`);
  process.exit(1);
}

await mkdir(artifactDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
await page.goto(`file://${htmlPath}?state=${encodeURIComponent(stateId)}&viewport=${encodeURIComponent(viewport.id)}`);
await page.waitForFunction(() => Boolean(window.__BUILDER_REAL_HARNESS_READY__), { timeout: 15000 });
await page.waitForTimeout(800);
const output = path.join(artifactDir, `${stateId}__${viewport.width}__single.png`);
await page.screenshot({ path: output, fullPage: true });
await browser.close();
console.log(`Captured Builder real-shell single screenshot:`);
console.log(`  state:    ${stateId}`);
console.log(`  viewport: ${viewport.id} (${viewport.width}x${viewport.height})`);
console.log(`  file:     ${output}`);
