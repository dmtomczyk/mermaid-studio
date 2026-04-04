import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const webviewDistDir = path.join(distDir, 'webview');
const vendorDir = path.join(projectRoot, 'media', 'vendor');

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await mkdir(webviewDistDir, { recursive: true });
  await mkdir(vendorDir, { recursive: true });

  await build({
    entryPoints: [path.join(projectRoot, 'src', 'extension.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: path.join(distDir, 'extension.js'),
    external: ['vscode'],
    sourcemap: false,
    minify: false,
    logLevel: 'info'
  });

  await build({
    entryPoints: [path.join(projectRoot, 'src', 'webview', 'builder', 'index.ts')],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: path.join(webviewDistDir, 'builder.js'),
    sourcemap: false,
    minify: true,
    logLevel: 'info'
  });

  await copyFile(
    path.join(projectRoot, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'),
    path.join(vendorDir, 'mermaid.min.js')
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
