import { CanvasDiagramFamily } from './canvasFamilies';

export interface CanvasRenderContext<TModel> {
  model: TModel;
}

export interface CanvasInspectorContext<TModel> {
  model: TModel;
}

export interface CanvasContextMenuContext<TModel> {
  model: TModel;
}

export interface CanvasFamilyUiAdapter<
  TFamily extends CanvasDiagramFamily,
  TModel
> {
  renderNodes(ctx: CanvasRenderContext<TModel>): void;
  renderEdges(ctx: CanvasRenderContext<TModel>): void;
  renderInspector(ctx: CanvasInspectorContext<TModel>): void;
  renderContextMenu(ctx: CanvasContextMenuContext<TModel>): void;
}
