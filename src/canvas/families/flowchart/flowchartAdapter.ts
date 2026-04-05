import { CanvasFamilyAdapter } from '../../types/canvasContracts';
import { CanvasSelectionState } from '../../types/canvasStateTypes';
import { CanvasTemplate } from '../../types/templates';
import {
  FlowchartCanvasEdge,
  FlowchartCanvasModel,
  FlowchartCanvasNode
} from './flowchartTypes';
import { FLOWCHART_TEMPLATES } from './flowchartTemplates';
import {
  createEmptyFlowchartModel,
  generateFlowchartSource,
  parseFlowchartToModel,
  validateFlowchartModel
} from './flowchartModel';

function getNodeById(model: FlowchartCanvasModel, nodeId: string): FlowchartCanvasNode | undefined {
  return model.nodes.find((entry) => entry.id === nodeId);
}

function getNodeBounds(node: FlowchartCanvasNode) {
  return {
    x: node.x,
    y: node.y,
    width: node.width || 180,
    height: node.height || 84
  };
}

export const flowchartAdapter: CanvasFamilyAdapter<
  'flowchart',
  FlowchartCanvasModel,
  FlowchartCanvasNode,
  FlowchartCanvasEdge
> = {
  family: 'flowchart',

  createEmptyModel() {
    return createEmptyFlowchartModel();
  },

  parseMermaid(source: string) {
    return parseFlowchartToModel(source);
  },

  generateMermaid(model: FlowchartCanvasModel) {
    return generateFlowchartSource(model);
  },

  validate(model: FlowchartCanvasModel) {
    return validateFlowchartModel(model);
  },

  getNodes(model: FlowchartCanvasModel) {
    return model.nodes;
  },

  getEdges(model: FlowchartCanvasModel) {
    return model.edges;
  },

  getTemplates(): CanvasTemplate[] {
    return FLOWCHART_TEMPLATES;
  },

  canStartConnection(model: FlowchartCanvasModel, nodeId: string) {
    return Boolean(getNodeById(model, nodeId));
  },

  canCompleteConnection(model: FlowchartCanvasModel, fromId: string, toId: string) {
    return Boolean(fromId && toId && fromId !== toId && getNodeById(model, fromId) && getNodeById(model, toId));
  },

  createConnection(model: FlowchartCanvasModel, fromId: string, toId: string) {
    if (!this.canCompleteConnection(model, fromId, toId)) {
      return model;
    }
    const nextIndex = model.edges.length + 1;
    return {
      ...model,
      edges: model.edges.concat({
        id: `edge-${nextIndex}`,
        from: fromId,
        to: toId,
        type: '-->',
        label: ''
      })
    };
  },

  deleteNode(model: FlowchartCanvasModel, nodeId: string) {
    return {
      ...model,
      nodes: model.nodes.filter((entry) => entry.id !== nodeId),
      edges: model.edges.filter((entry) => entry.from !== nodeId && entry.to !== nodeId)
    };
  },

  deleteEdge(model: FlowchartCanvasModel, edgeId: string) {
    return {
      ...model,
      edges: model.edges.filter((entry) => entry.id !== edgeId)
    };
  },

  moveNode(model: FlowchartCanvasModel, nodeId: string, next: { x: number; y: number }) {
    return {
      ...model,
      nodes: model.nodes.map((entry) => entry.id === nodeId ? { ...entry, x: next.x, y: next.y } : entry)
    };
  },

  getDiagramBounds(model: FlowchartCanvasModel) {
    if (!model.nodes.length) {
      return null;
    }
    const bounds = model.nodes.map(getNodeBounds);
    const minX = Math.min(...bounds.map((entry) => entry.x)) - 80;
    const minY = Math.min(...bounds.map((entry) => entry.y)) - 80;
    const maxX = Math.max(...bounds.map((entry) => entry.x + entry.width)) + 80;
    const maxY = Math.max(...bounds.map((entry) => entry.y + entry.height)) + 80;
    return {
      x: minX,
      y: minY,
      width: Math.max(240, maxX - minX),
      height: Math.max(180, maxY - minY)
    };
  },

  getSelectionBounds(model: FlowchartCanvasModel, selection: CanvasSelectionState) {
    if (selection.selectedNodeId) {
      const node = getNodeById(model, selection.selectedNodeId);
      if (!node) {
        return null;
      }
      const bounds = getNodeBounds(node);
      return {
        x: bounds.x - 60,
        y: bounds.y - 60,
        width: bounds.width + 120,
        height: bounds.height + 120
      };
    }

    if (selection.selectedEdgeId) {
      const edge = model.edges.find((entry) => entry.id === selection.selectedEdgeId);
      if (!edge) {
        return null;
      }
      const from = getNodeById(model, edge.from);
      const to = getNodeById(model, edge.to);
      if (!from || !to) {
        return null;
      }
      const fromBounds = getNodeBounds(from);
      const toBounds = getNodeBounds(to);
      const minX = Math.min(fromBounds.x, toBounds.x) - 80;
      const minY = Math.min(fromBounds.y, toBounds.y) - 80;
      const maxX = Math.max(fromBounds.x + fromBounds.width, toBounds.x + toBounds.width) + 80;
      const maxY = Math.max(fromBounds.y + fromBounds.height, toBounds.y + toBounds.height) + 80;
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
