import { MermaidDiagramFamily } from './mermaidFamilies';

export type CanvasDiagramFamily = Extract<
  MermaidDiagramFamily,
  'classDiagram' | 'flowchart' | 'stateDiagram' | 'erDiagram' | 'block' | 'architecture' | 'c4'
>;
