import { build } from 'esbuild';
import { mkdir, rm, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist-harness');
const mermaidDir = path.join(distDir, 'mermaid');
const builderDir = path.join(distDir, 'builder');
const builderRealDir = path.join(distDir, 'builder-real');

await rm(distDir, { recursive: true, force: true });
await mkdir(mermaidDir, { recursive: true });
await mkdir(builderDir, { recursive: true });
await mkdir(builderRealDir, { recursive: true });

await build({
  entryPoints: [path.join(projectRoot, 'harness', 'mermaid', 'main.ts')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  outfile: path.join(mermaidDir, 'main.js'),
  sourcemap: false,
  minify: false,
  logLevel: 'info'
});

await build({
  entryPoints: [path.join(projectRoot, 'harness', 'builder', 'main.ts')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  outfile: path.join(builderDir, 'main.js'),
  sourcemap: false,
  minify: false,
  logLevel: 'info'
});

await build({
  entryPoints: [path.join(projectRoot, 'harness', 'builder-real', 'main.ts')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  outfile: path.join(builderRealDir, 'main.js'),
  sourcemap: false,
  minify: false,
  logLevel: 'info'
});

await copyFile(
  path.join(projectRoot, 'dist', 'webview', 'builder.js'),
  path.join(builderRealDir, 'runtime.js')
);

await copyFile(
  path.join(projectRoot, 'harness', 'mermaid', 'index.html'),
  path.join(mermaidDir, 'index.html')
);
await copyFile(
  path.join(projectRoot, 'harness', 'builder', 'index.html'),
  path.join(builderDir, 'index.html')
);
await copyFile(
  path.join(projectRoot, 'harness', 'builder', 'styles.css'),
  path.join(builderDir, 'styles.css')
);
await copyFile(
  path.join(projectRoot, 'harness', 'builder-real', 'index.html'),
  path.join(builderRealDir, 'index.html')
);
