import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const artifactDir = path.join(projectRoot, '.artifacts', 'harness', 'builder-real');
const htmlPath = path.join(projectRoot, 'dist-harness', 'builder-real', 'index.html');
const stateId = process.env.BUILDER_REAL_STATE || 'flowchart-busy';
const viewportId = process.env.BUILDER_REAL_VIEWPORT || 'must-work-360';
const viewports = new Map([
  ['comfortable-540', { id: 'comfortable-540', width: 540, height: 1200 }],
  ['narrow-420', { id: 'narrow-420', width: 420, height: 1200 }],
  ['must-work-360', { id: 'must-work-360', width: 360, height: 1200 }],
  ['stress-320', { id: 'stress-320', width: 320, height: 1200 }]
]);
const viewport = viewports.get(viewportId) || viewports.get('must-work-360');

await mkdir(artifactDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
await page.goto(`file://${htmlPath}?state=${encodeURIComponent(stateId)}&viewport=${encodeURIComponent(viewport.id)}`);
await page.waitForFunction(() => Boolean(window.__BUILDER_REAL_HARNESS_READY__), { timeout: 15000 });
await page.waitForTimeout(800);
const output = path.join(artifactDir, `${stateId}__${viewport.width}__proof.png`);
await page.screenshot({ path: output, fullPage: true });
const state = await page.evaluate(() => window.__BUILDER_REAL_HARNESS_STATE__);
await browser.close();
console.log(`Captured Builder real-shell proof:`);
console.log(`  file:  ${output}`);
console.log(`  state: ${JSON.stringify(state)}`);
