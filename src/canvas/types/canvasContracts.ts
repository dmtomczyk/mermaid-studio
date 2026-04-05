import { MermaidDiagramFamily } from './mermaidFamilies';
import { CanvasDiagramFamily } from './canvasFamilies';
import { CanvasBounds, CanvasEdgeBase, CanvasNodeBase } from './canvasCoreTypes';
import { CanvasSelectionState } from './canvasStateTypes';
import { ValidationIssue } from './validationTypes';
import { CanvasTemplate } from './templates';

export interface MermaidFamilyModelAdapter<
  TFamily extends MermaidDiagramFamily,
  TModel
> {
  family: TFamily;
  createEmptyModel(): TModel;
  parseMermaid(source: string): TModel;
  generateMermaid(model: TModel): string;
  validate(model: TModel): ValidationIssue[];
}

export interface CanvasFamilyAdapter<
  TFamily extends CanvasDiagramFamily,
  TModel,
  TNode extends CanvasNodeBase,
  TEdge extends CanvasEdgeBase
> extends MermaidFamilyModelAdapter<TFamily, TModel> {
  getNodes(model: TModel): TNode[];
  getEdges(model: TModel): TEdge[];

  getTemplates(): CanvasTemplate[];

  canStartConnection(model: TModel, nodeId: string): boolean;
  canCompleteConnection(model: TModel, fromId: string, toId: string): boolean;
  createConnection(model: TModel, fromId: string, toId: string): TModel;

  deleteNode(model: TModel, nodeId: string): TModel;
  deleteEdge(model: TModel, edgeId: string): TModel;
  moveNode(model: TModel, nodeId: string, next: { x: number; y: number }): TModel;

  getDiagramBounds(model: TModel): CanvasBounds | null;
  getSelectionBounds(model: TModel, selection: CanvasSelectionState): CanvasBounds | null;
}
