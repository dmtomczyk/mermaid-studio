import { CanvasDiagramFamily } from './canvasFamilies';

export interface CanvasNodeBase {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface CanvasEdgeBase {
  id: string;
  from: string;
  to: string;
}

export interface CanvasDiagramModelBase<
  TFamily extends CanvasDiagramFamily,
  TNode extends CanvasNodeBase,
  TEdge extends CanvasEdgeBase
> {
  family: TFamily;
  nodes: TNode[];
  edges: TEdge[];
}

export interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
