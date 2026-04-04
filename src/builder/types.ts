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

export interface BuilderImportResult {
  state: BuilderDiagramState;
  warnings: string[];
}
