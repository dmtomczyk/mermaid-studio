import { CanvasDiagramModelBase, CanvasEdgeBase, CanvasNodeBase } from '../../types/canvasCoreTypes';

export type FlowchartNodeShape =
  | 'rect'
  | 'rounded'
  | 'stadium'
  | 'diam'
  | 'hexagon'
  | 'cyl'
  | 'circle'
  | 'dbl-circ'
  | 'lean-r'
  | 'lean-l'
  | 'trap-b'
  | 'trap-t'
  | 'fr-rect'
  | 'text';

export type FlowchartEdgeType = '-->' | '---' | '-.->' | '==>';
export type FlowchartDirection = 'TB' | 'TD' | 'BT' | 'LR' | 'RL';

export interface FlowchartCanvasNode extends CanvasNodeBase {
  label: string;
  shape: FlowchartNodeShape;
  style?: string;
  className?: string;
}

export interface FlowchartCanvasEdge extends CanvasEdgeBase {
  type: FlowchartEdgeType;
  label?: string;
  style?: string;
  className?: string;
  animate?: boolean;
  animationSpeed?: 'fast' | 'slow';
  curve?: string;
}

export interface FlowchartCanvasModel extends CanvasDiagramModelBase<
  'flowchart',
  FlowchartCanvasNode,
  FlowchartCanvasEdge
> {
  direction: FlowchartDirection;
}
