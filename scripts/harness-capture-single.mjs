import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'dist-harness', 'builder', 'index.html');
const artifactDir = path.join(projectRoot, '.artifacts', 'harness', 'builder');

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
  console.error(`Unknown state '${stateId}'.`);
  console.error(`Allowed states: ${Array.from(states).join(', ')}`);
  process.exit(1);
}

const viewport = viewports.get(viewportId);
if (!viewport) {
  console.error(`Unknown viewport '${viewportId}'.`);
  console.error(`Allowed viewports: ${Array.from(viewports.keys()).join(', ')}`);
  process.exit(1);
}

await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
await page.goto(`file://${htmlPath}`);
await page.waitForFunction(() => Boolean(window.__BUILDER_HARNESS_READY__), { timeout: 15000 });
await page.selectOption('#viewportSelect', viewport.id);
await page.selectOption('#stateSelect', stateId);
await page.waitForTimeout(400);

const stateInfo = await page.evaluate(() => window.__BUILDER_HARNESS_STATE__);
if (!stateInfo || stateInfo.stateId !== stateId || stateInfo.viewportId !== viewport.id) {
  throw new Error(`Builder harness did not settle on ${stateId} @ ${viewport.id}`);
}

const fileName = `${stateId}__${viewport.width}__single.png`;
const outPath = path.join(artifactDir, fileName);
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Captured single Builder harness screenshot:`);
console.log(`  state:    ${stateId}`);
console.log(`  viewport: ${viewport.id} (${viewport.width}x${viewport.height})`);
console.log(`  file:     ${outPath}`);
