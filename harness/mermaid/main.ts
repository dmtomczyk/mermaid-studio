import mermaid from 'mermaid';
import { MERMAID_HARNESS_CASES } from './cases';

interface MermaidHarnessResult {
  id: string;
  family: string;
  origin: string;
  title: string;
  source: string;
  ok: boolean;
  error?: string;
}

declare global {
  interface Window {
    __MERMAID_HARNESS_RESULTS__?: MermaidHarnessResult[];
    __MERMAID_HARNESS_SUMMARY__?: { total: number; passed: number; failed: number; ok: boolean };
  }
}

const summaryEl = document.getElementById('summary') as HTMLDivElement;
const statusTextEl = document.getElementById('statusText') as HTMLSpanElement;
const casesEl = document.getElementById('cases') as HTMLDivElement;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderCaseResult(result: MermaidHarnessResult, svg?: string): void {
  const section = document.createElement('section');
  section.className = 'case';
  section.innerHTML = `
    <div><strong>${escapeHtml(result.title)}</strong> <span class="muted">(${escapeHtml(result.id)} · ${escapeHtml(result.family)} · ${escapeHtml(result.origin)})</span></div>
    <div class="${result.ok ? 'ok' : 'fail'}">${result.ok ? 'PASS' : 'FAIL'}</div>
    ${result.error ? `<pre>${escapeHtml(result.error)}</pre>` : ''}
    <div class="muted">Source</div>
    <pre>${escapeHtml(result.source)}</pre>
    ${svg ? `<div class="muted">Rendered SVG</div><div class="render">${svg}</div>` : ''}
  `;
  casesEl.appendChild(section);
}

async function main(): Promise<void> {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' });

  const results: MermaidHarnessResult[] = [];
  let passed = 0;

  for (const testCase of MERMAID_HARNESS_CASES) {
    try {
      const renderId = `mermaid-harness-${testCase.id}`;
      const { svg } = await mermaid.render(renderId, testCase.source);
      const result: MermaidHarnessResult = {
        id: testCase.id,
        family: testCase.family,
        origin: testCase.origin,
        title: testCase.title,
        source: testCase.source,
        ok: true
      };
      results.push(result);
      passed += 1;
      renderCaseResult(result, svg);
    } catch (error) {
      const result: MermaidHarnessResult = {
        id: testCase.id,
        family: testCase.family,
        origin: testCase.origin,
        title: testCase.title,
        source: testCase.source,
        ok: false,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      };
      results.push(result);
      renderCaseResult(result);
    }
  }

  const failed = results.length - passed;
  const ok = failed === 0;
  window.__MERMAID_HARNESS_RESULTS__ = results;
  window.__MERMAID_HARNESS_SUMMARY__ = { total: results.length, passed, failed, ok };

  statusTextEl.textContent = `${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`;
  statusTextEl.className = ok ? 'ok' : 'fail';
  summaryEl.setAttribute('data-ok', ok ? 'true' : 'false');
}

main().catch((error) => {
  statusTextEl.textContent = `Harness boot failed: ${error instanceof Error ? error.message : String(error)}`;
  statusTextEl.className = 'fail';
});
