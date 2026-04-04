import * as vscode from 'vscode';

export type MermaidDiagramFamilyId =
  | 'flowchart'
  | 'graph'
  | 'sequenceDiagram'
  | 'classDiagram'
  | 'stateDiagram-v2'
  | 'erDiagram'
  | 'gantt'
  | 'mindmap'
  | 'gitGraph'
  | 'architecture-beta';

export interface MermaidDiagramFamily {
  id: MermaidDiagramFamilyId;
  label: string;
  supportTier: 1 | 2 | 3;
}

export const DIAGRAM_FAMILIES: MermaidDiagramFamily[] = [
  { id: 'flowchart', label: 'Flowchart', supportTier: 1 },
  { id: 'graph', label: 'Graph', supportTier: 1 },
  { id: 'sequenceDiagram', label: 'Sequence Diagram', supportTier: 1 },
  { id: 'classDiagram', label: 'Class Diagram', supportTier: 2 },
  { id: 'stateDiagram-v2', label: 'State Diagram', supportTier: 2 },
  { id: 'erDiagram', label: 'ER Diagram', supportTier: 2 },
  { id: 'gantt', label: 'Gantt', supportTier: 2 },
  { id: 'mindmap', label: 'Mindmap', supportTier: 3 },
  { id: 'gitGraph', label: 'Git Graph', supportTier: 2 },
  { id: 'architecture-beta', label: 'Architecture', supportTier: 3 }
];

const DIAGRAM_ROOT_REGEX = /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram-v2|erDiagram|gantt|mindmap|gitGraph|architecture-beta)\b/;

export function detectDiagramType(document: vscode.TextDocument, position: vscode.Position): MermaidDiagramFamilyId | undefined {
  let latestMatch: MermaidDiagramFamilyId | undefined;
  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex += 1) {
    const text = document.lineAt(lineIndex).text.trim();
    if (!text || text.startsWith('%%')) {
      continue;
    }
    const match = text.match(DIAGRAM_ROOT_REGEX);
    if (match) {
      latestMatch = match[1] as MermaidDiagramFamilyId;
    }
    if (lineIndex >= position.line) {
      return latestMatch;
    }
  }
  return latestMatch;
}
