import { CanvasEdgeBase, CanvasNodeBase } from '../../types/canvasCoreTypes';

export interface ClassDiagramCanvasNode extends CanvasNodeBase {
  name: string;
  members: string[];
}

export type ClassDiagramRelationType = '-->' | '<|--' | '*--' | 'o--' | '..>' | '--';

export interface ClassDiagramCanvasEdge extends CanvasEdgeBase {
  type: ClassDiagramRelationType | string;
  label?: string;
}

export interface ClassDiagramCanvasModel {
  family: 'classDiagram';
  classes: ClassDiagramCanvasNode[];
  relations: ClassDiagramCanvasEdge[];
}
