import { CanvasBounds } from '../../types/canvasCoreTypes';
import { CanvasSelectionState } from '../../types/canvasStateTypes';
import { ClassDiagramCanvasModel, ClassDiagramCanvasNode } from './classDiagramTypes';

const CLASS_WIDTH = 220;
const CLASS_HEIGHT = 120;
const DIAGRAM_PADDING = 80;
const SELECTION_PADDING = 60;
const RELATION_PADDING = 80;

function getNodeBounds(node: ClassDiagramCanvasNode): CanvasBounds {
  return {
    x: node.x,
    y: node.y,
    width: node.width || CLASS_WIDTH,
    height: node.height || CLASS_HEIGHT
  };
}

export function getClassDiagramDiagramBounds(model: ClassDiagramCanvasModel): CanvasBounds | null {
  if (!model.classes.length) {
    return null;
  }

  const bounds = model.classes.map(getNodeBounds);
  const minX = Math.min(...bounds.map((entry) => entry.x)) - DIAGRAM_PADDING;
  const minY = Math.min(...bounds.map((entry) => entry.y)) - DIAGRAM_PADDING;
  const maxX = Math.max(...bounds.map((entry) => entry.x + entry.width)) + DIAGRAM_PADDING;
  const maxY = Math.max(...bounds.map((entry) => entry.y + entry.height)) + DIAGRAM_PADDING;

  return {
    x: minX,
    y: minY,
    width: Math.max(240, maxX - minX),
    height: Math.max(180, maxY - minY)
  };
}

export function getClassDiagramSelectionBounds(
  model: ClassDiagramCanvasModel,
  selection: CanvasSelectionState
): CanvasBounds | null {
  if (selection.selectedNodeId) {
    const selected = model.classes.find((entry) => entry.id === selection.selectedNodeId);
    if (!selected) {
      return null;
    }
    const bounds = getNodeBounds(selected);
    return {
      x: bounds.x - SELECTION_PADDING,
      y: bounds.y - SELECTION_PADDING,
      width: bounds.width + SELECTION_PADDING * 2,
      height: bounds.height + SELECTION_PADDING * 2
    };
  }

  if (selection.selectedEdgeId) {
    const relation = model.relations.find((entry) => entry.id === selection.selectedEdgeId);
    if (!relation) {
      return null;
    }
    const from = model.classes.find((entry) => entry.id === relation.from);
    const to = model.classes.find((entry) => entry.id === relation.to);
    if (!from || !to) {
      return null;
    }
    const fromBounds = getNodeBounds(from);
    const toBounds = getNodeBounds(to);
    const minX = Math.min(fromBounds.x, toBounds.x) - RELATION_PADDING;
    const minY = Math.min(fromBounds.y, toBounds.y) - RELATION_PADDING;
    const maxX = Math.max(fromBounds.x + fromBounds.width, toBounds.x + toBounds.width) + RELATION_PADDING;
    const maxY = Math.max(fromBounds.y + fromBounds.height, toBounds.y + toBounds.height) + RELATION_PADDING;
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  return null;
}
