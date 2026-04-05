import { CanvasFamilyAdapter } from '../../types/canvasContracts';
import { CanvasBounds } from '../../types/canvasCoreTypes';
import { CanvasSelectionState } from '../../types/canvasStateTypes';
import { CanvasTemplate } from '../../types/templates';
import {
  ClassDiagramCanvasEdge,
  ClassDiagramCanvasModel,
  ClassDiagramCanvasNode
} from './classDiagramTypes';
import {
  createEmptyClassDiagramModel,
  generateClassDiagramSource,
  parseClassDiagramToModel,
  validateClassDiagramModel
} from '../../classDiagramModel';

const CLASS_TEMPLATES: CanvasTemplate[] = [
  { id: 'empty', label: 'Blank Class', category: 'class' },
  { id: 'entity', label: 'Entity', category: 'class' },
  { id: 'service', label: 'Service', category: 'class' },
  { id: 'controller', label: 'Controller', category: 'class' },
  { id: 'repository', label: 'Repository', category: 'class' },
  { id: 'value-object', label: 'Value Object', category: 'class' }
];

function getClassById(model: ClassDiagramCanvasModel, nodeId: string): ClassDiagramCanvasNode | undefined {
  return model.classes.find((entry) => entry.id === nodeId);
}

function getClassBounds(entry: ClassDiagramCanvasNode): CanvasBounds {
  return {
    x: entry.x,
    y: entry.y,
    width: entry.width || 220,
    height: entry.height || 120
  };
}

export const classDiagramAdapter: CanvasFamilyAdapter<
  'classDiagram',
  ClassDiagramCanvasModel,
  ClassDiagramCanvasNode,
  ClassDiagramCanvasEdge
> = {
  family: 'classDiagram',

  createEmptyModel(): ClassDiagramCanvasModel {
    return createEmptyClassDiagramModel();
  },

  parseMermaid(source: string): ClassDiagramCanvasModel {
    return parseClassDiagramToModel(source);
  },

  generateMermaid(model: ClassDiagramCanvasModel): string {
    return generateClassDiagramSource(model);
  },

  validate(model: ClassDiagramCanvasModel) {
    return validateClassDiagramModel(model).map((issue) => ({
      level: issue.level,
      message: issue.message,
      targetId: issue.targetId,
      path: issue.target
    }));
  },

  getNodes(model: ClassDiagramCanvasModel): ClassDiagramCanvasNode[] {
    return model.classes;
  },

  getEdges(model: ClassDiagramCanvasModel): ClassDiagramCanvasEdge[] {
    return model.relations;
  },

  getTemplates(): CanvasTemplate[] {
    return CLASS_TEMPLATES;
  },

  canStartConnection(model: ClassDiagramCanvasModel, nodeId: string): boolean {
    return Boolean(getClassById(model, nodeId));
  },

  canCompleteConnection(model: ClassDiagramCanvasModel, fromId: string, toId: string): boolean {
    return Boolean(fromId && toId && fromId !== toId && getClassById(model, fromId) && getClassById(model, toId));
  },

  createConnection(model: ClassDiagramCanvasModel, fromId: string, toId: string): ClassDiagramCanvasModel {
    if (!this.canCompleteConnection(model, fromId, toId)) {
      return model;
    }

    const nextIndex = model.relations.length + 1;
    return {
      ...model,
      relations: model.relations.concat({
        id: `relation-${nextIndex}`,
        from: fromId,
        to: toId,
        type: '-->',
        label: ''
      })
    };
  },

  deleteNode(model: ClassDiagramCanvasModel, nodeId: string): ClassDiagramCanvasModel {
    return {
      ...model,
      classes: model.classes.filter((entry) => entry.id !== nodeId),
      relations: model.relations.filter((entry) => entry.from !== nodeId && entry.to !== nodeId)
    };
  },

  deleteEdge(model: ClassDiagramCanvasModel, edgeId: string): ClassDiagramCanvasModel {
    return {
      ...model,
      relations: model.relations.filter((entry) => entry.id !== edgeId)
    };
  },

  moveNode(
    model: ClassDiagramCanvasModel,
    nodeId: string,
    next: { x: number; y: number }
  ): ClassDiagramCanvasModel {
    return {
      ...model,
      classes: model.classes.map((entry) =>
        entry.id === nodeId
          ? { ...entry, x: next.x, y: next.y }
          : entry
      )
    };
  },

  getDiagramBounds(model: ClassDiagramCanvasModel): CanvasBounds | null {
    if (!model.classes.length) {
      return null;
    }
    const bounds = model.classes.map(getClassBounds);
    const minX = Math.min(...bounds.map((entry) => entry.x));
    const minY = Math.min(...bounds.map((entry) => entry.y));
    const maxX = Math.max(...bounds.map((entry) => entry.x + entry.width));
    const maxY = Math.max(...bounds.map((entry) => entry.y + entry.height));
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },

  getSelectionBounds(
    model: ClassDiagramCanvasModel,
    selection: CanvasSelectionState
  ): CanvasBounds | null {
    if (selection.selectedNodeId) {
      const selected = getClassById(model, selection.selectedNodeId);
      return selected ? getClassBounds(selected) : null;
    }

    if (selection.selectedEdgeId) {
      const relation = model.relations.find((entry) => entry.id === selection.selectedEdgeId);
      if (!relation) {
        return null;
      }
      const fromClass = getClassById(model, relation.from);
      const toClass = getClassById(model, relation.to);
      if (!fromClass || !toClass) {
        return null;
      }
      const fromBounds = getClassBounds(fromClass);
      const toBounds = getClassBounds(toClass);
      const minX = Math.min(fromBounds.x, toBounds.x);
      const minY = Math.min(fromBounds.y, toBounds.y);
      const maxX = Math.max(fromBounds.x + fromBounds.width, toBounds.x + toBounds.width);
      const maxY = Math.max(fromBounds.y + fromBounds.height, toBounds.y + toBounds.height);
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    return null;
  }
};
