import { sanitizeStateInPlace } from './sanitize';
import { BuilderElements, BuilderPresetMap, BuilderViewState } from './types';
import { byId, clone, escapeHtml } from './utils';

export const PRESETS: BuilderPresetMap = {
  flowchart: {
    starter: {
      label: 'Starter flow',
      diagramType: 'flowchart',
      direction: 'TD',
      nodes: [
        { id: 'A', label: 'Start', shape: 'rectangle', x: 36, y: 56 },
        { id: 'B', label: 'End', shape: 'rounded', x: 220, y: 56 }
      ],
      edges: [{ from: 'A', to: 'B', style: 'solid', label: '' }],
      participants: [],
      messages: [],
      source: ''
    },
    decision: {
      label: 'Decision tree',
      diagramType: 'flowchart',
      direction: 'TD',
      nodes: [
        { id: 'Request', label: 'Request', shape: 'rectangle', x: 120, y: 26 },
        { id: 'Valid', label: 'Valid?', shape: 'diamond', x: 120, y: 116 },
        { id: 'Accept', label: 'Process', shape: 'rounded', x: 28, y: 214 },
        { id: 'Reject', label: 'Reject', shape: 'rounded', x: 222, y: 214 }
      ],
      edges: [
        { from: 'Request', to: 'Valid', style: 'solid', label: '' },
        { from: 'Valid', to: 'Accept', style: 'solid', label: 'yes' },
        { from: 'Valid', to: 'Reject', style: 'dotted', label: 'no' }
      ],
      participants: [],
      messages: [],
      source: ''
    },
    service: {
      label: 'Service architecture',
      diagramType: 'flowchart',
      direction: 'LR',
      nodes: [
        { id: 'Client', label: 'Client', shape: 'rectangle', x: 20, y: 92 },
        { id: 'API', label: 'Public API', shape: 'rounded', x: 170, y: 92 },
        { id: 'Auth', label: 'Auth Service', shape: 'rounded', x: 330, y: 26 },
        { id: 'DB', label: 'Database', shape: 'database', x: 330, y: 160 }
      ],
      edges: [
        { from: 'Client', to: 'API', style: 'solid', label: 'request' },
        { from: 'API', to: 'Auth', style: 'dotted', label: 'validate' },
        { from: 'API', to: 'DB', style: 'solid', label: 'read/write' }
      ],
      participants: [],
      messages: [],
      source: ''
    },
    blank: {
      label: 'Blank canvas',
      diagramType: 'flowchart',
      direction: 'TD',
      nodes: [],
      edges: [],
      participants: [],
      messages: [],
      source: ''
    }
  },
  sequence: {
    starter: {
      label: 'Request / response',
      diagramType: 'sequence',
      direction: 'TD',
      nodes: [],
      edges: [],
      participants: [
        { id: 'User', label: 'User' },
        { id: 'App', label: 'App' }
      ],
      messages: [
        { from: 'User', to: 'App', style: 'solid', label: 'request' },
        { from: 'App', to: 'User', style: 'dashed', label: 'response' }
      ],
      source: ''
    },
    login: {
      label: 'Login flow',
      diagramType: 'sequence',
      direction: 'TD',
      nodes: [],
      edges: [],
      participants: [
        { id: 'User', label: 'End User' },
        { id: 'App', label: 'Mobile App' },
        { id: 'API', label: 'Auth API' }
      ],
      messages: [
        { from: 'User', to: 'App', style: 'solid', label: 'login' },
        { from: 'App', to: 'API', style: 'solid', label: 'auth request' },
        { from: 'API', to: 'App', style: 'dashed', label: 'token' },
        { from: 'App', to: 'User', style: 'dashed', label: 'success' }
      ],
      source: ''
    },
    review: {
      label: 'Approval flow',
      diagramType: 'sequence',
      direction: 'TD',
      nodes: [],
      edges: [],
      participants: [
        { id: 'Author', label: 'Author' },
        { id: 'Reviewer', label: 'Reviewer' },
        { id: 'System', label: 'System' }
      ],
      messages: [
        { from: 'Author', to: 'System', style: 'solid', label: 'submit draft' },
        { from: 'System', to: 'Reviewer', style: 'solid', label: 'request review' },
        { from: 'Reviewer', to: 'System', style: 'dashed', label: 'approve' },
        { from: 'System', to: 'Author', style: 'dashed', label: 'approved' }
      ],
      source: ''
    },
    blank: {
      label: 'Blank sequence',
      diagramType: 'sequence',
      direction: 'TD',
      nodes: [],
      edges: [],
      participants: [],
      messages: [],
      source: ''
    }
  }
};

export function createDefaultState(): BuilderViewState {
  return {
    diagramType: 'flowchart',
    direction: 'TD',
    nodes: PRESETS.flowchart.starter.nodes.map(clone),
    edges: PRESETS.flowchart.starter.edges.map(clone),
    participants: [],
    messages: [],
    source: '',
    preset: 'starter',
    editorStatus: {
      kind: 'none',
      summary: 'No active editor',
      detail: 'Open a Mermaid or Markdown file to insert generated diagrams.',
      canInsert: false
    },
    importStatus: '',
    canvasSelection: { sourceId: '' },
    canvasView: { zoom: 1 }
  };
}

export function createInitialState(vscode: { getState(): unknown }, defaultState: BuilderViewState): BuilderViewState {
  const persisted = (vscode.getState() || {}) as Partial<BuilderViewState>;
  const state: BuilderViewState = {
    ...defaultState,
    ...persisted,
    nodes: Array.isArray(persisted.nodes) ? persisted.nodes.map(clone) : defaultState.nodes.map(clone),
    edges: Array.isArray(persisted.edges) ? persisted.edges.map(clone) : defaultState.edges.map(clone),
    participants: Array.isArray(persisted.participants) ? persisted.participants.map(clone) : [],
    messages: Array.isArray(persisted.messages) ? persisted.messages.map(clone) : [],
    editorStatus: persisted.editorStatus || defaultState.editorStatus,
    canvasSelection: persisted.canvasSelection || defaultState.canvasSelection,
    canvasView: persisted.canvasView || defaultState.canvasView
  };
  sanitizeStateInPlace(state);
  return state;
}

export function collectElements(): BuilderElements {
  return {
    diagramType: byId<HTMLSelectElement>('diagramType'),
    preset: byId<HTMLSelectElement>('preset'),
    loadPreset: byId<HTMLButtonElement>('loadPreset'),
    clear: byId<HTMLButtonElement>('clear'),
    importActiveDocument: byId<HTMLButtonElement>('importActiveDocument'),
    openPreview: byId<HTMLButtonElement>('openPreview'),
    refreshContext: byId<HTMLButtonElement>('refreshContext'),
    editorSummary: byId('editorSummary'),
    editorDetail: byId('editorDetail'),
    importStatus: byId('importStatus'),
    statusCard: byId('statusCard'),
    direction: byId<HTMLSelectElement>('direction'),
    nodeCount: byId<HTMLInputElement>('nodeCount'),
    edgeCount: byId<HTMLInputElement>('edgeCount'),
    validationSummary: byId('validationSummary'),
    validationList: byId('validationList'),
    participantCount: byId<HTMLInputElement>('participantCount'),
    messageCount: byId<HTMLInputElement>('messageCount'),
    sequenceValidationSummary: byId('sequenceValidationSummary'),
    sequenceValidationList: byId('sequenceValidationList'),
    flowSettingsSection: byId('flowSettingsSection'),
    sequenceSettingsSection: byId('sequenceSettingsSection'),
    flowNodesSection: byId('flowNodesSection'),
    flowEdgesSection: byId('flowEdgesSection'),
    flowCanvasSection: byId('flowCanvasSection'),
    sequenceParticipantsSection: byId('sequenceParticipantsSection'),
    sequenceMessagesSection: byId('sequenceMessagesSection'),
    quickNodeLabel: byId<HTMLInputElement>('quickNodeLabel'),
    quickNodeId: byId<HTMLInputElement>('quickNodeId'),
    quickNodeShape: byId<HTMLSelectElement>('quickNodeShape'),
    addNode: byId<HTMLButtonElement>('addNode'),
    nodes: byId('nodes'),
    quickEdgeFrom: byId<HTMLSelectElement>('quickEdgeFrom'),
    quickEdgeTo: byId<HTMLSelectElement>('quickEdgeTo'),
    quickEdgeStyle: byId<HTMLSelectElement>('quickEdgeStyle'),
    quickEdgeLabel: byId<HTMLInputElement>('quickEdgeLabel'),
    addEdge: byId<HTMLButtonElement>('addEdge'),
    edges: byId('edges'),
    flowCanvas: byId('flowCanvas'),
    canvasZoomOut: byId<HTMLButtonElement>('canvasZoomOut'),
    canvasZoomReset: byId<HTMLButtonElement>('canvasZoomReset'),
    canvasZoomIn: byId<HTMLButtonElement>('canvasZoomIn'),
    canvasFit: byId<HTMLButtonElement>('canvasFit'),
    quickParticipantLabel: byId<HTMLInputElement>('quickParticipantLabel'),
    quickParticipantId: byId<HTMLInputElement>('quickParticipantId'),
    addParticipant: byId<HTMLButtonElement>('addParticipant'),
    participants: byId('participants'),
    quickMessageFrom: byId<HTMLSelectElement>('quickMessageFrom'),
    quickMessageTo: byId<HTMLSelectElement>('quickMessageTo'),
    quickMessageStyle: byId<HTMLSelectElement>('quickMessageStyle'),
    quickMessageLabel: byId<HTMLInputElement>('quickMessageLabel'),
    addMessage: byId<HTMLButtonElement>('addMessage'),
    messages: byId('messages'),
    source: byId<HTMLTextAreaElement>('source'),
    generate: byId<HTMLButtonElement>('generate'),
    renderSource: byId<HTMLButtonElement>('renderSource'),
    copy: byId<HTMLButtonElement>('copy'),
    preview: byId('preview'),
    previewStatus: byId('previewStatus'),
    insert: byId<HTMLButtonElement>('insert'),
    createFile: byId<HTMLButtonElement>('createFile')
  };
}

export function hydratePresetOptions(elements: BuilderElements, state: BuilderViewState): void {
  const presets = PRESETS[state.diagramType] || {};
  elements.preset.innerHTML = Object.entries(presets)
    .map(([key, preset]) => `<option value="${escapeHtml(key)}">${escapeHtml(preset.label)}</option>`)
    .join('');
  elements.preset.value = presets[state.preset || ''] ? state.preset || 'starter' : 'starter';
  state.preset = elements.preset.value;
}

export function clearQuickForms(elements: BuilderElements): void {
  elements.quickNodeLabel.value = '';
  elements.quickNodeId.value = '';
  delete elements.quickNodeId.dataset.userEdited;
  elements.quickEdgeLabel.value = '';
  elements.quickParticipantLabel.value = '';
  elements.quickParticipantId.value = '';
  delete elements.quickParticipantId.dataset.userEdited;
  elements.quickMessageLabel.value = '';
}

export function loadImportedState(state: BuilderViewState, importedState: Partial<BuilderViewState>, info: string, warnings: string[]): void {
  state.diagramType = importedState.diagramType === 'sequence' ? 'sequence' : 'flowchart';
  state.direction = importedState.direction || 'TD';
  state.nodes = Array.isArray(importedState.nodes)
    ? importedState.nodes.map((node, index) => ({
        ...clone(node),
        x: typeof node.x === 'number' ? node.x : 36 + (index % 3) * 128,
        y: typeof node.y === 'number' ? node.y : 32 + Math.floor(index / 3) * 96
      }))
    : [];
  state.edges = Array.isArray(importedState.edges) ? importedState.edges.map(clone) : [];
  state.participants = Array.isArray(importedState.participants) ? importedState.participants.map(clone) : [];
  state.messages = Array.isArray(importedState.messages) ? importedState.messages.map(clone) : [];
  state.source = importedState.source || '';
  state.preset = 'starter';
  state.canvasSelection = { sourceId: '' };
  state.canvasView = { zoom: 1 };
  sanitizeStateInPlace(state);
  state.importStatus = info || 'Imported Mermaid into the builder.';
  if (warnings.length) {
    state.importStatus += ` Warnings: ${warnings.join(' · ')}`;
  }
}
