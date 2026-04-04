export type BuilderDiagramType = 'flowchart' | 'sequence';

export interface FlowNode {
  id: string;
  label: string;
  shape: 'rectangle' | 'rounded' | 'circle' | 'diamond' | 'database';
  x?: number;
  y?: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  style: 'solid' | 'dotted';
  label?: string;
}

export interface SequenceParticipant {
  id: string;
  label: string;
}

export interface SequenceMessage {
  from: string;
  to: string;
  style: 'solid' | 'dashed';
  label?: string;
}

export interface BuilderDiagramState {
  diagramType: BuilderDiagramType;
  direction: 'TD' | 'LR' | 'RL' | 'BT';
  nodes: FlowNode[];
  edges: FlowEdge[];
  participants: SequenceParticipant[];
  messages: SequenceMessage[];
  source: string;
  preset?: string;
}

export interface BuilderEditorStatus {
  kind: 'mermaid' | 'markdown' | 'other' | 'none';
  fileName?: string;
  summary: string;
  detail: string;
  canInsert: boolean;
}

export interface BuilderCanvasSelection {
  sourceId: string;
}

export interface BuilderCanvasView {
  zoom: number;
}

export interface BuilderViewState extends BuilderDiagramState {
  editorStatus: BuilderEditorStatus;
  importStatus: string;
  canvasSelection: BuilderCanvasSelection;
  canvasView: BuilderCanvasView;
}

export interface BuilderPreset extends BuilderDiagramState {
  label: string;
}

export type BuilderPresetMap = Record<BuilderDiagramType, Record<string, BuilderPreset>>;

export interface BuilderCanvasDragState {
  index: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
}

export interface BuilderCanvasPanState {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
}

export interface BuilderElements {
  diagramType: HTMLSelectElement;
  preset: HTMLSelectElement;
  loadPreset: HTMLButtonElement;
  clear: HTMLButtonElement;
  importActiveDocument: HTMLButtonElement;
  openPreview: HTMLButtonElement;
  refreshContext: HTMLButtonElement;
  editorSummary: HTMLElement;
  editorDetail: HTMLElement;
  importStatus: HTMLElement;
  statusCard: HTMLElement;
  direction: HTMLSelectElement;
  nodeCount: HTMLInputElement;
  edgeCount: HTMLInputElement;
  validationSummary: HTMLElement;
  validationList: HTMLElement;
  participantCount: HTMLInputElement;
  messageCount: HTMLInputElement;
  sequenceValidationSummary: HTMLElement;
  sequenceValidationList: HTMLElement;
  flowSettingsSection: HTMLElement;
  sequenceSettingsSection: HTMLElement;
  flowNodesSection: HTMLElement;
  flowEdgesSection: HTMLElement;
  flowCanvasSection: HTMLElement;
  sequenceParticipantsSection: HTMLElement;
  sequenceMessagesSection: HTMLElement;
  quickNodeLabel: HTMLInputElement;
  quickNodeId: HTMLInputElement;
  quickNodeShape: HTMLSelectElement;
  addNode: HTMLButtonElement;
  nodes: HTMLElement;
  quickEdgeFrom: HTMLSelectElement;
  quickEdgeTo: HTMLSelectElement;
  quickEdgeStyle: HTMLSelectElement;
  quickEdgeLabel: HTMLInputElement;
  addEdge: HTMLButtonElement;
  edges: HTMLElement;
  flowCanvas: HTMLElement;
  canvasZoomOut: HTMLButtonElement;
  canvasZoomReset: HTMLButtonElement;
  canvasZoomIn: HTMLButtonElement;
  canvasFit: HTMLButtonElement;
  quickParticipantLabel: HTMLInputElement;
  quickParticipantId: HTMLInputElement;
  addParticipant: HTMLButtonElement;
  participants: HTMLElement;
  quickMessageFrom: HTMLSelectElement;
  quickMessageTo: HTMLSelectElement;
  quickMessageStyle: HTMLSelectElement;
  quickMessageLabel: HTMLInputElement;
  addMessage: HTMLButtonElement;
  messages: HTMLElement;
  source: HTMLTextAreaElement;
  generate: HTMLButtonElement;
  renderSource: HTMLButtonElement;
  copy: HTMLButtonElement;
  preview: HTMLElement;
  previewStatus: HTMLElement;
  insert: HTMLButtonElement;
  createFile: HTMLButtonElement;
}

export interface BuilderAppContext {
  vscode: { postMessage(message: unknown): void; getState(): unknown; setState(state: unknown): void };
  mermaid: { render(id: string, code: string): Promise<{ svg: string }> };
  presets: BuilderPresetMap;
  defaultState: BuilderViewState;
  state: BuilderViewState;
  elements: BuilderElements;
  canvasDrag: BuilderCanvasDragState | null;
  canvasPan: BuilderCanvasPanState | null;
  renderAll(): void;
  regenerateFromBuilder(): void;
  renderCurrentSource(): Promise<void>;
  persistState(): void;
  loadPreset(key: string): void;
  setCanvasZoom(nextZoom: number): void;
  fitCanvasToView(): void;
}
