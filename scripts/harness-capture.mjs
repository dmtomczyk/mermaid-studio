import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'dist-harness', 'builder', 'index.html');
const artifactDir = path.join(projectRoot, '.artifacts', 'harness', 'builder');

const stateIds = ['flowchart-empty', 'flowchart-busy', 'sequence-empty', 'sequence-busy', 'imported-mixed-stress'];
const viewports = [
  { id: 'comfortable-540', width: 540, height: 1200 },
  { id: 'narrow-420', width: 420, height: 1200 },
  { id: 'must-work-360', width: 360, height: 1200 },
  { id: 'stress-320', width: 320, height: 1200 }
];

await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const manifest = [];

for (const viewport of viewports) {
  for (const stateId of stateIds) {
    console.log(`Capturing ${stateId} @ ${viewport.id} (${viewport.width}x${viewport.height})`);
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

    const fileName = `${stateId}__${viewport.width}.png`;
    const outPath = path.join(artifactDir, fileName);
    await page.screenshot({ path: outPath, fullPage: true });
    manifest.push({
      stateId,
      viewportId: viewport.id,
      width: viewport.width,
      height: viewport.height,
      file: fileName
    });
    await page.close();
  }
}

await writeFile(path.join(artifactDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();
console.log(`Captured ${manifest.length} Builder harness screenshots to ${artifactDir}`);
