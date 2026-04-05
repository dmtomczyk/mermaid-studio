import { CanvasFamilyAdapter } from '../../types/canvasContracts';
import { CanvasSelectionState } from '../../types/canvasStateTypes';
import { CanvasTemplate } from '../../types/templates';
import {
  ClassDiagramCanvasEdge,
  ClassDiagramCanvasModel,
  ClassDiagramCanvasNode
} from './classDiagramTypes';
import { CLASS_DIAGRAM_TEMPLATES } from './classDiagramTemplates';
import {
  createEmptyClassDiagramModel,
  generateClassDiagramSource,
  parseClassDiagramToModel,
  validateClassDiagramModel
} from '../../classDiagramModel';
import {
  getClassDiagramDiagramBounds,
  getClassDiagramSelectionBounds
} from './classDiagramBounds';

function getClassById(model: ClassDiagramCanvasModel, nodeId: string): ClassDiagramCanvasNode | undefined {
  return model.classes.find((entry) => entry.id === nodeId);
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
    return CLASS_DIAGRAM_TEMPLATES;
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

  getDiagramBounds(model: ClassDiagramCanvasModel) {
    return getClassDiagramDiagramBounds(model);
  },

  getSelectionBounds(
    model: ClassDiagramCanvasModel,
    selection: CanvasSelectionState
  ) {
    return getClassDiagramSelectionBounds(model, selection);
  }
};
