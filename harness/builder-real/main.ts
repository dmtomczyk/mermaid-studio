import { renderBuilderShell } from '../../src/builder/renderBuilderShell';
import { BUILDER_VIEWPORT_PRESETS } from '../shared/viewportPresets';
import { BUILDER_HARNESS_STATES } from '../builder/states';
import { installBuilderHarnessHostStub } from './hostStub';

const stateId = new URLSearchParams(window.location.search).get('state') || 'flowchart-busy';
const viewportId = new URLSearchParams(window.location.search).get('viewport') || 'must-work-360';
const viewport = BUILDER_VIEWPORT_PRESETS.find((item) => item.id === viewportId) || BUILDER_VIEWPORT_PRESETS[0];

function ensureHarnessThemeVariables(): void {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --vscode-font-family: Inter, system-ui, sans-serif;
      --vscode-editor-font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      --vscode-editor-foreground: #e5e7eb;
      --vscode-sideBar-background: #0f172a;
      --vscode-editor-background: #111827;
      --vscode-panel-border: #334155;
      --vscode-input-background: #0b1220;
      --vscode-input-foreground: #e5e7eb;
      --vscode-input-border: #334155;
      --vscode-button-background: #2563eb;
      --vscode-button-foreground: #eff6ff;
      --vscode-button-secondaryBackground: #1e293b;
      --vscode-button-secondaryForeground: #e2e8f0;
      --vscode-descriptionForeground: #94a3b8;
      --vscode-errorForeground: #f87171;
      --vscode-focusBorder: #60a5fa;
      color-scheme: dark;
      background: #0f172a;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #0f172a;
    }
  `;
  document.head.appendChild(style);
}

function mountHarnessChrome(): void {
  const header = document.createElement('div');
  header.style.cssText = 'padding:12px 14px; border-bottom:1px solid #334155; background:#020617; color:#cbd5e1; font:12px Inter,system-ui,sans-serif;';
  header.innerHTML = `<strong>Builder Real-Shell Harness</strong> · state=${stateId} · viewport=${viewport.id} (${viewport.width}x${viewport.height}) · shared shell`;
  document.body.prepend(header);
}

function bootstrap(): void {
  ensureHarnessThemeVariables();
  installBuilderHarnessHostStub({
    stateId,
    viewport,
    onStatus(message) {
      const existing = document.getElementById('harness-status');
      if (existing) {
        existing.textContent = message;
      }
    }
  });

  document.documentElement.style.width = `${viewport.width}px`;
  document.body.style.width = `${viewport.width}px`;
  document.body.innerHTML = renderBuilderShell({
    mermaidScriptSrc: '../../media/vendor/mermaid.min.js',
    builderScriptSrc: './runtime.js',
    hostKind: 'browser-harness'
  });
  document.body.style.width = `${viewport.width}px`;
  mountHarnessChrome();

  const status = document.createElement('div');
  status.id = 'harness-status';
  status.style.cssText = 'padding:8px 14px; border-bottom:1px solid #334155; background:#111827; color:#94a3b8; font:12px Inter,system-ui,sans-serif;';
  status.textContent = 'Booting real-shell harness…';
  document.body.prepend(status);

  const mermaidScript = document.createElement('script');
  mermaidScript.src = '../../media/vendor/mermaid.min.js';
  document.body.appendChild(mermaidScript);

  mermaidScript.addEventListener('load', () => {
    const runtimeScript = document.createElement('script');
    runtimeScript.src = './runtime.js';
    document.body.appendChild(runtimeScript);
  });
}

bootstrap();
