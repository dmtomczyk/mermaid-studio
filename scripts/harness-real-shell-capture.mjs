import { mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'dist-harness', 'builder-real', 'index.html');
const artifactDir = path.join(projectRoot, '.artifacts', 'harness', 'builder-real');

const stateIds = ['flowchart-empty', 'flowchart-busy', 'sequence-empty', 'sequence-busy', 'imported-mixed-stress'];
const viewports = [
  { id: 'comfortable-540', width: 540, height: 1200 },
  { id: 'narrow-420', width: 420, height: 1200 },
  { id: 'must-work-360', width: 360, height: 1200 },
  { id: 'stress-320', width: 320, height: 1200 }
];

await mkdir(artifactDir, { recursive: true });
for (const entry of await readdir(artifactDir)) {
  if (entry.endsWith('.png') || entry === 'manifest.json') {
    await rm(path.join(artifactDir, entry), { force: true });
  }
}

const browser = await chromium.launch({ headless: true });
const manifest = [];

for (const viewport of viewports) {
  for (const stateId of stateIds) {
    console.log(`Capturing real-shell ${stateId} @ ${viewport.id} (${viewport.width}x${viewport.height})`);
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.goto(`file://${htmlPath}?state=${encodeURIComponent(stateId)}&viewport=${encodeURIComponent(viewport.id)}`);
    await page.waitForFunction(() => Boolean(window.__BUILDER_REAL_HARNESS_READY__), { timeout: 15000 });
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => window.__BUILDER_REAL_HARNESS_STATE__);
    if (!info || info.stateId !== stateId || info.viewportId !== viewport.id) {
      throw new Error(`Real-shell harness did not settle on ${stateId} @ ${viewport.id}`);
    }
    const fileName = `${stateId}__${viewport.width}.png`;
    const outPath = path.join(artifactDir, fileName);
    await page.screenshot({ path: outPath, fullPage: true });
    manifest.push({ stateId, viewportId: viewport.id, width: viewport.width, height: viewport.height, file: fileName });
    await page.close();
  }
}

await writeFile(path.join(artifactDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();
console.log(`Captured ${manifest.length} real-shell Builder screenshots to ${artifactDir}`);
