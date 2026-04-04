import { BuilderViewState } from '../../src/webview/builder/types';

function baseEditorStatus(summary: string, detail: string) {
  return {
    kind: 'mermaid' as const,
    fileName: 'harness.mmd',
    summary,
    detail,
    canInsert: true
  };
}

export interface BuilderHarnessStateCase {
  id: string;
  title: string;
  description: string;
  state: BuilderViewState;
}

export const BUILDER_HARNESS_STATES: BuilderHarnessStateCase[] = [
  {
    id: 'flowchart-empty',
    title: 'Flowchart empty',
    description: 'Baseline empty flowchart builder shell.',
    state: {
      diagramType: 'flowchart',
      direction: 'TD',
      nodes: [],
      edges: [],
      participants: [],
      messages: [],
      source: '',
      preset: 'blank',
      editorStatus: baseEditorStatus('Mermaid file ready', 'Empty flowchart state for baseline layout review.'),
      importStatus: 'No import yet.',
      canvasSelection: { sourceId: '' },
      canvasView: { zoom: 1 }
    }
  },
  {
    id: 'flowchart-busy',
    title: 'Flowchart busy',
    description: 'Dense flowchart controls and canvas state.',
    state: {
      diagramType: 'flowchart',
      direction: 'LR',
      nodes: [
        { id: 'Client', label: 'External Client', shape: 'rectangle', x: 20, y: 92 },
        { id: 'Gateway', label: 'API Gateway', shape: 'rounded', x: 180, y: 92 },
        { id: 'Auth', label: 'Auth Service', shape: 'rounded', x: 360, y: 26 },
        { id: 'Rules', label: 'Rules Engine', shape: 'diamond', x: 360, y: 150 },
        { id: 'DB', label: 'Primary Database', shape: 'database', x: 560, y: 92 }
      ],
      edges: [
        { from: 'Client', to: 'Gateway', style: 'solid', label: 'request' },
        { from: 'Gateway', to: 'Auth', style: 'dotted', label: 'validate token' },
        { from: 'Gateway', to: 'Rules', style: 'solid', label: 'check policy' },
        { from: 'Rules', to: 'DB', style: 'solid', label: 'fetch policy state' }
      ],
      participants: [],
      messages: [],
      source: '',
      preset: 'service',
      editorStatus: baseEditorStatus('Mermaid file ready', 'Dense flowchart state for compact panel and canvas review.'),
      importStatus: 'Imported from current Mermaid document with light normalization.',
      canvasSelection: { sourceId: 'Gateway' },
      canvasView: { zoom: 0.9 }
    }
  },
  {
    id: 'sequence-empty',
    title: 'Sequence empty',
    description: 'Baseline empty sequence builder shell.',
    state: {
      diagramType: 'sequence',
      direction: 'TD',
      nodes: [],
      edges: [],
      participants: [],
      messages: [],
      source: '',
      preset: 'blank',
      editorStatus: baseEditorStatus('Markdown Mermaid block ready', 'Empty sequence state for baseline layout review.'),
      importStatus: 'No import yet.',
      canvasSelection: { sourceId: '' },
      canvasView: { zoom: 1 }
    }
  },
  {
    id: 'sequence-busy',
    title: 'Sequence busy',
    description: 'Dense sequence participants/messages and overview state.',
    state: {
      diagramType: 'sequence',
      direction: 'TD',
      nodes: [],
      edges: [],
      participants: [
        { id: 'User', label: 'End User' },
        { id: 'App', label: 'Web App' },
        { id: 'API', label: 'Auth API' },
        { id: 'Notify', label: 'Notification Service' }
      ],
      messages: [
        { from: 'User', to: 'App', style: 'solid', label: 'submit login' },
        { from: 'App', to: 'API', style: 'solid', label: 'authenticate' },
        { from: 'API', to: 'App', style: 'dashed', label: 'token + profile' },
        { from: 'App', to: 'Notify', style: 'solid', label: 'emit login event' },
        { from: 'Notify', to: 'User', style: 'dashed', label: 'push welcome toast' }
      ],
      source: '',
      preset: 'login',
      editorStatus: baseEditorStatus('Markdown Mermaid block ready', 'Dense sequence state for compact controls and overview review.'),
      importStatus: 'Imported from current Markdown fence.',
      canvasSelection: { sourceId: '' },
      canvasView: { zoom: 0.85 }
    }
  },
  {
    id: 'imported-mixed-stress',
    title: 'Imported mixed stress',
    description: 'Awkward imported labels and denser content to expose overflow issues.',
    state: {
      diagramType: 'flowchart',
      direction: 'TD',
      nodes: [
        { id: 'AO_Assessment', label: 'AO / Mission Readiness Assessment', shape: 'rectangle', x: 120, y: 26 },
        { id: 'Gap_Matrix', label: 'Capability Gap Matrix', shape: 'diamond', x: 120, y: 120 },
        { id: 'Roadmap', label: '90-Day Phased Roadmap + Dependencies', shape: 'rounded', x: 28, y: 236 },
        { id: 'Stakeholders', label: 'Stakeholder Review / Sovereignty Concerns', shape: 'rounded', x: 242, y: 236 },
        { id: 'Evidence', label: 'Evidence Appendix / Source Traceability', shape: 'database', x: 134, y: 352 }
      ],
      edges: [
        { from: 'AO_Assessment', to: 'Gap_Matrix', style: 'solid', label: 'distill mission pressures' },
        { from: 'Gap_Matrix', to: 'Roadmap', style: 'solid', label: 'prioritize actions' },
        { from: 'Gap_Matrix', to: 'Stakeholders', style: 'dotted', label: 'surface friction points' },
        { from: 'Stakeholders', to: 'Evidence', style: 'solid', label: 'record proof trail' }
      ],
      participants: [],
      messages: [],
      source: '',
      preset: 'imported',
      editorStatus: baseEditorStatus('Imported Mermaid content', 'Stress state with longer labels and imported-copy feel.'),
      importStatus: 'Imported Mermaid into the builder. Warnings: normalized long labels · rebuilt missing positions',
      canvasSelection: { sourceId: '' },
      canvasView: { zoom: 0.75 }
    }
  }
];
