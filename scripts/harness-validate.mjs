import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist-harness', 'mermaid');
const htmlPath = path.join(distDir, 'index.html');
const artifactDir = path.join(projectRoot, '.artifacts', 'harness');
const outputPath = path.join(artifactDir, 'mermaid-validation.json');

await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
await page.goto(`file://${htmlPath}`);
await page.waitForFunction(() => Boolean(window.__MERMAID_HARNESS_SUMMARY__));

const payload = await page.evaluate(() => ({
  summary: window.__MERMAID_HARNESS_SUMMARY__,
  results: window.__MERMAID_HARNESS_RESULTS__
}));

await writeFile(outputPath, JSON.stringify(payload, null, 2));
await browser.close();

console.log(`Wrote Mermaid harness results to ${outputPath}`);
console.log(`Summary: ${payload.summary?.passed}/${payload.summary?.total} passed`);

if (!payload.summary?.ok) {
  process.exitCode = 1;
}
