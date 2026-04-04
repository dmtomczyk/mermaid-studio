declare function acquireVsCodeApi(): { getState(): unknown; setState(state: unknown): void; postMessage(message: unknown): void };
declare const mermaid: { initialize(options: unknown): void; render(id: string, code: string): Promise<{ svg: string }> };

import { buildMermaidFromState } from './generate';
import { wireEvents, renderAll } from './forms';
import { persistState } from './persistence';
import { renderCurrentSource } from './renderPreview';
import { fitCanvasToView, setCanvasZoom } from './renderFlowCanvas';
import { sanitizeStateInPlace } from './sanitize';
import { clearQuickForms, collectElements, createDefaultState, createInitialState, hydratePresetOptions, loadImportedState, PRESETS } from './state';
import { BuilderAppContext } from './types';

const vscode = acquireVsCodeApi();

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'base',
  flowchart: { htmlLabels: false, useMaxWidth: true },
  fontFamily: 'Arial, Helvetica, sans-serif',
  themeVariables: {
    background: '#ffffff',
    primaryColor: '#ffffff',
    primaryTextColor: '#111827',
    primaryBorderColor: '#1f2937',
    lineColor: '#1f2937',
    textColor: '#111827',
    mainBkg: '#ffffff',
    secondaryColor: '#f3f4f6',
    tertiaryColor: '#f9fafb',
    clusterBkg: '#ffffff',
    clusterBorder: '#9ca3af',
    edgeLabelBackground: '#ffffff',
    actorBkg: '#ffffff',
    actorBorder: '#1f2937',
    actorTextColor: '#111827',
    noteBkgColor: '#fff7cc',
    noteBorderColor: '#d4b106',
    noteTextColor: '#111827',
    sequenceNumberColor: '#111827',
    signalColor: '#1f2937',
    labelBoxBkgColor: '#ffffff',
    labelBoxBorderColor: '#1f2937',
    labelTextColor: '#111827'
  }
});

const defaultState = createDefaultState();
const state = createInitialState(vscode, defaultState);
const elements = collectElements();

const context: BuilderAppContext = {
  vscode,
  mermaid,
  presets: PRESETS,
  defaultState,
  state,
  elements,
  canvasDrag: null,
  canvasPan: null,
  renderAll: () => renderAll(context),
  regenerateFromBuilder: () => regenerateFromBuilder(context),
  renderCurrentSource: () => renderCurrentSource(context),
  persistState: () => persistState(context),
  loadPreset: (key: string) => loadPreset(context, key),
  setCanvasZoom: (nextZoom: number) => setCanvasZoom(context, nextZoom),
  fitCanvasToView: () => fitCanvasToView(context)
};

hydratePresetOptions(elements, state);
wireEvents(context);
window.addEventListener('message', (event) => {
  const message = event.data || {};
  if (message.type === 'loadDiagramState' && message.state) {
    loadImportedState(state, message.state, message.info || '', Array.isArray(message.warnings) ? message.warnings : []);
    hydratePresetOptions(elements, state);
    context.renderAll();
    elements.source.value = state.source;
    void context.renderCurrentSource();
    context.persistState();
  }
});
context.renderAll();
context.regenerateFromBuilder();
vscode.postMessage({ type: 'requestEditorStatus' });

function loadPreset(context: BuilderAppContext, key: string): void {
  const preset = context.presets[context.state.diagramType][key] || context.presets[context.state.diagramType].starter;
  context.state.diagramType = preset.diagramType;
  context.state.direction = preset.direction;
  context.state.nodes = preset.nodes.map((node) => ({ ...node }));
  context.state.edges = preset.edges.map((edge) => ({ ...edge }));
  context.state.participants = preset.participants.map((participant) => ({ ...participant }));
  context.state.messages = preset.messages.map((message) => ({ ...message }));
  context.state.preset = key;
  context.state.canvasSelection = { sourceId: '' };
  context.state.canvasView = { zoom: 1 };
  sanitizeStateInPlace(context.state);
  context.state.importStatus = '';
  clearQuickForms(context.elements);
  hydratePresetOptions(context.elements, context.state);
  context.renderAll();
  context.regenerateFromBuilder();
}

function regenerateFromBuilder(context: BuilderAppContext): void {
  sanitizeStateInPlace(context.state);
  context.state.source = buildMermaidFromState(context.state);
  context.elements.source.value = context.state.source;
  context.renderAll();
  context.persistState();
  void context.renderCurrentSource();
}
