import mermaid from 'mermaid';
import { BUILDER_HARNESS_STATES } from './states';
import { BUILDER_VIEWPORT_PRESETS } from '../shared/viewportPresets';
import { sanitizeStateInPlace } from '../../src/webview/builder/sanitize';
import { buildMermaidFromState } from '../../src/webview/builder/generate';
import { renderMiniCanvas } from '../../src/webview/builder/renderFlowCanvas';
import { renderCurrentSource } from '../../src/webview/builder/renderPreview';
import { BuilderAppContext, BuilderViewState } from '../../src/webview/builder/types';

const stateSelect = document.getElementById('stateSelect') as HTMLSelectElement;
const viewportSelect = document.getElementById('viewportSelect') as HTMLSelectElement;
const viewport = document.getElementById('builderViewport') as HTMLElement;
const stateTitle = document.getElementById('stateTitle') as HTMLElement;
const stateDescription = document.getElementById('stateDescription') as HTMLElement;
const viewportLabel = document.getElementById('viewportLabel') as HTMLElement;
const editorSummary = document.getElementById('editorSummary') as HTMLElement;
const editorDetail = document.getElementById('editorDetail') as HTMLElement;
const importStatus = document.getElementById('importStatus') as HTMLElement;
const builderModeBadge = document.getElementById('builderModeBadge') as HTMLElement;
const diagramType = document.getElementById('diagramType') as HTMLInputElement;
const direction = document.getElementById('direction') as HTMLInputElement;
const flowSection = document.getElementById('flowSection') as HTMLElement;
const sequenceSection = document.getElementById('sequenceSection') as HTMLElement;
const flowCounts = document.getElementById('flowCounts') as HTMLElement;
const sequenceCounts = document.getElementById('sequenceCounts') as HTMLElement;
const flowNodes = document.getElementById('flowNodes') as HTMLElement;
const flowEdges = document.getElementById('flowEdges') as HTMLElement;
const participants = document.getElementById('participants') as HTMLElement;
const messages = document.getElementById('messages') as HTMLElement;

const elements = {
  source: document.getElementById('source') as HTMLTextAreaElement,
  preview: document.getElementById('preview') as HTMLElement,
  previewStatus: document.getElementById('previewStatus') as HTMLElement,
  flowCanvas: document.getElementById('flowCanvas') as HTMLElement
};

declare global {
  interface Window {
    __BUILDER_HARNESS_READY__?: boolean;
    __BUILDER_HARNESS_STATE__?: { stateId: string; viewportId: string; width: number; height: number };
  }
}

function fillSelect(select: HTMLSelectElement, options: Array<{ value: string; label: string }>) {
  select.innerHTML = options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('');
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCardList(container: HTMLElement, title: string, items: string[]): void {
  if (!items.length) {
    container.innerHTML = `<div class="card"><div class="muted">No ${title.toLowerCase()} yet.</div></div>`;
    return;
  }
  container.innerHTML = items.join('');
}

function renderFlowCards(state: BuilderViewState): void {
  renderCardList(flowNodes, 'Nodes', state.nodes.map((node) => `
    <div class="card">
      <div class="card-title">${escapeHtml(node.label)} <span class="muted">(${escapeHtml(node.id)})</span></div>
      <div class="compact-card-grid compact-card-grid-3">
        <label>Shape<input readonly value="${escapeHtml(node.shape)}" /></label>
        <label>X<input readonly value="${node.x ?? ''}" /></label>
        <label>Y<input readonly value="${node.y ?? ''}" /></label>
      </div>
      <div class="compact-actions-row"><span>Copy</span><span>Flip</span><span>Del</span></div>
    </div>
  `));

  renderCardList(flowEdges, 'Edges', state.edges.map((edge) => `
    <div class="card">
      <div class="card-title">${escapeHtml(edge.from)} → ${escapeHtml(edge.to)}</div>
      <div class="compact-card-grid compact-card-grid-3">
        <label>Style<input readonly value="${escapeHtml(edge.style)}" /></label>
        <label>Label<input readonly value="${escapeHtml(edge.label || '')}" /></label>
        <label>Direction<input readonly value="${escapeHtml(state.direction)}" /></label>
      </div>
      <div class="compact-actions-row"><span>Copy</span><span>Flip</span><span>Del</span></div>
    </div>
  `));
}

function renderSequenceCards(state: BuilderViewState): void {
  renderCardList(participants, 'Participants', state.participants.map((participant) => `
    <div class="card">
      <div class="card-title">${escapeHtml(participant.label)} <span class="muted">(${escapeHtml(participant.id)})</span></div>
      <div class="compact-card-grid compact-card-grid-2">
        <label>Label<input readonly value="${escapeHtml(participant.label)}" /></label>
        <label>ID<input readonly value="${escapeHtml(participant.id)}" /></label>
      </div>
      <div class="compact-actions-row"><span>Copy</span><span>Del</span></div>
    </div>
  `));

  renderCardList(messages, 'Messages', state.messages.map((message) => `
    <div class="card">
      <div class="card-title">${escapeHtml(message.from)} → ${escapeHtml(message.to)}</div>
      <div class="compact-card-grid compact-card-grid-3">
        <label>Style<input readonly value="${escapeHtml(message.style)}" /></label>
        <label>Label<input readonly value="${escapeHtml(message.label || '')}" /></label>
        <label>Participants<input readonly value="${state.participants.length}" /></label>
      </div>
      <div class="compact-actions-row"><span>Copy</span><span>Flip</span><span>Del</span></div>
    </div>
  `));
}

async function renderHarness(): Promise<void> {
  const caseDef = BUILDER_HARNESS_STATES.find((item) => item.id === stateSelect.value) || BUILDER_HARNESS_STATES[0];
  const viewportDef = BUILDER_VIEWPORT_PRESETS.find((item) => item.id === viewportSelect.value) || BUILDER_VIEWPORT_PRESETS[0];
  const state: BuilderViewState = JSON.parse(JSON.stringify(caseDef.state));
  sanitizeStateInPlace(state);
  state.source = buildMermaidFromState(state);

  viewport.style.setProperty('--builder-width', `${viewportDef.width}px`);
  viewport.style.width = `${viewportDef.width}px`;
  stateTitle.textContent = caseDef.title;
  stateDescription.textContent = caseDef.description;
  viewportLabel.textContent = `${viewportDef.width}×${viewportDef.height}`;
  editorSummary.textContent = state.editorStatus.summary;
  editorDetail.textContent = state.editorStatus.detail;
  importStatus.textContent = state.importStatus;
  builderModeBadge.textContent = state.diagramType === 'sequence' ? 'Tier 1 sequence view' : 'Tier 1 flowchart view';
  diagramType.value = state.diagramType;
  direction.value = state.direction;
  flowSection.classList.toggle('hidden', state.diagramType !== 'flowchart');
  sequenceSection.classList.toggle('hidden', state.diagramType !== 'sequence');
  flowCounts.textContent = `${state.nodes.length} nodes · ${state.edges.length} edges`;
  sequenceCounts.textContent = `${state.participants.length} participants · ${state.messages.length} messages`;

  (document.getElementById('quickNodeLabel') as HTMLInputElement).value = state.nodes[0]?.label || '';
  (document.getElementById('quickNodeId') as HTMLInputElement).value = state.nodes[0]?.id || '';
  (document.getElementById('quickNodeShape') as HTMLInputElement).value = state.nodes[0]?.shape || '';
  (document.getElementById('quickEdgeFrom') as HTMLInputElement).value = state.edges[0]?.from || '';
  (document.getElementById('quickEdgeTo') as HTMLInputElement).value = state.edges[0]?.to || '';
  (document.getElementById('quickEdgeStyle') as HTMLInputElement).value = state.edges[0]?.style || '';
  (document.getElementById('quickEdgeLabel') as HTMLInputElement).value = state.edges[0]?.label || '';
  (document.getElementById('quickParticipantLabel') as HTMLInputElement).value = state.participants[0]?.label || '';
  (document.getElementById('quickParticipantId') as HTMLInputElement).value = state.participants[0]?.id || '';
  (document.getElementById('quickMessageFrom') as HTMLInputElement).value = state.messages[0]?.from || '';
  (document.getElementById('quickMessageTo') as HTMLInputElement).value = state.messages[0]?.to || '';
  (document.getElementById('quickMessageStyle') as HTMLInputElement).value = state.messages[0]?.style || '';
  (document.getElementById('quickMessageLabel') as HTMLInputElement).value = state.messages[0]?.label || '';

  renderFlowCards(state);
  renderSequenceCards(state);

  const context = {
    state,
    elements,
    canvasDrag: null,
    canvasPan: null,
    persistState() {},
    renderAll() {},
    vscode: { postMessage() {}, getState() { return {}; }, setState() {} },
    mermaid,
    presets: { flowchart: {}, sequence: {} },
    defaultState: state,
    regenerateFromBuilder() {},
    loadPreset() {},
    setCanvasZoom() {},
    fitCanvasToView() {},
    renderCurrentSource() { return renderCurrentSource(context as unknown as BuilderAppContext); }
  } as unknown as BuilderAppContext;

  renderMiniCanvas(context);
  elements.source.value = state.source;
  await renderCurrentSource(context);

  window.__BUILDER_HARNESS_READY__ = true;
  window.__BUILDER_HARNESS_STATE__ = {
    stateId: caseDef.id,
    viewportId: viewportDef.id,
    width: viewportDef.width,
    height: viewportDef.height
  };
}

async function main(): Promise<void> {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' });
  fillSelect(stateSelect, BUILDER_HARNESS_STATES.map((item) => ({ value: item.id, label: item.title })));
  fillSelect(viewportSelect, BUILDER_VIEWPORT_PRESETS.map((item) => ({ value: item.id, label: `${item.width}px` })));
  stateSelect.addEventListener('change', () => { void renderHarness(); });
  viewportSelect.addEventListener('change', () => { void renderHarness(); });
  await renderHarness();
}

void main();
