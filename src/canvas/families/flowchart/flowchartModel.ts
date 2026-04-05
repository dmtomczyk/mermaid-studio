import { ValidationIssue } from '../../types/validationTypes';
import {
  FlowchartCanvasEdge,
  FlowchartCanvasModel,
  FlowchartCanvasNode,
  FlowchartDirection,
  FlowchartEdgeType,
  FlowchartNodeShape
} from './flowchartTypes';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 84;
const DEFAULT_DIRECTION: FlowchartDirection = 'TB';
const DEFAULT_EDGE_TYPE: FlowchartEdgeType = '-->';

export function createEmptyFlowchartModel(): FlowchartCanvasModel {
  return {
    family: 'flowchart',
    direction: DEFAULT_DIRECTION,
    nodes: [
      {
        id: 'node-1',
        label: 'Start',
        shape: 'stadium',
        x: 160,
        y: 120,
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT
      },
      {
        id: 'node-2',
        label: 'Process',
        shape: 'rect',
        x: 420,
        y: 240,
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT
      }
    ],
    edges: [
      {
        id: 'edge-1',
        from: 'node-1',
        to: 'node-2',
        type: '-->',
        label: ''
      }
    ]
  };
}

export function generateFlowchartSource(model: FlowchartCanvasModel): string {
  const lines: string[] = [`flowchart ${model.direction || DEFAULT_DIRECTION}`];

  for (const node of model.nodes) {
    lines.push(`  ${node.id}${formatFlowchartNodeSyntax(node)}`);
  }

  if (model.edges.length) {
    lines.push('');
    for (const edge of model.edges) {
      const label = edge.label?.trim();
      const edgeType = sanitizeFlowchartEdgeType(edge.type);
      lines.push(label
        ? `  ${edge.from} ${edgeType}|${label}| ${edge.to}`
        : `  ${edge.from} ${edgeType} ${edge.to}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function validateFlowchartModel(model: FlowchartCanvasModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set<string>();

  for (const node of model.nodes) {
    if (!node.id.trim()) {
      issues.push({ level: 'error', message: 'Flowchart node id cannot be empty.', targetId: node.id || undefined, path: 'node.id' });
    }
    if (nodeIds.has(node.id)) {
      issues.push({ level: 'error', message: `Duplicate flowchart node id: ${node.id}`, targetId: node.id, path: 'node.id' });
    }
    nodeIds.add(node.id);
    if (!node.label.trim()) {
      issues.push({ level: 'warning', message: 'Flowchart node label is empty.', targetId: node.id, path: 'node.label' });
    }
  }

  for (const edge of model.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      issues.push({ level: 'error', message: 'Flowchart edge references a missing node.', targetId: edge.id, path: 'edge.endpoints' });
    }
    if (edge.from === edge.to) {
      issues.push({ level: 'warning', message: 'Self-loop flowchart edge.', targetId: edge.id, path: 'edge.endpoints' });
    }
  }

  return issues;
}

export function parseFlowchartToModel(source: string): FlowchartCanvasModel {
  const lines = source.split(/\r?\n/);
  const model: FlowchartCanvasModel = {
    family: 'flowchart',
    direction: DEFAULT_DIRECTION,
    nodes: [],
    edges: []
  };

  const seen = new Map<string, FlowchartCanvasNode>();
  let edgeIndex = 1;
  let layoutIndex = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%')) {
      continue;
    }

    const headerMatch = /^flowchart\s+(TB|TD|BT|LR|RL)\b/i.exec(line) || /^graph\s+(TB|TD|BT|LR|RL)\b/i.exec(line);
    if (headerMatch) {
      model.direction = headerMatch[1].toUpperCase() as FlowchartDirection;
      continue;
    }

    const edgeMatch = /^([A-Za-z_][\w-]*)\s*(-->|---|-\.->|==>)(?:\|([^|]*)\|)?\s*([A-Za-z_][\w-]*)$/.exec(line);
    if (edgeMatch) {
      const [, fromId, type, label, toId] = edgeMatch;
      const from = ensureFlowchartNode(model, seen, fromId, layoutIndex++);
      const to = ensureFlowchartNode(model, seen, toId, layoutIndex++);
      model.edges.push({
        id: `edge-${edgeIndex++}`,
        from: from.id,
        to: to.id,
        type: sanitizeFlowchartEdgeType(type),
        label: label?.trim() || undefined
      });
      continue;
    }

    const nodeMatch = /^([A-Za-z_][\w-]*)(.*)$/.exec(line);
    if (nodeMatch) {
      const [, id, rest] = nodeMatch;
      const parsed = parseFlowchartNodeTail(rest.trim());
      const node = ensureFlowchartNode(model, seen, id, layoutIndex++);
      node.label = parsed.label || node.label;
      node.shape = parsed.shape || node.shape;
    }
  }

  return model.nodes.length ? model : createEmptyFlowchartModel();
}

function ensureFlowchartNode(
  model: FlowchartCanvasModel,
  seen: Map<string, FlowchartCanvasNode>,
  id: string,
  layoutIndex: number
): FlowchartCanvasNode {
  const existing = seen.get(id);
  if (existing) {
    return existing;
  }

  const node: FlowchartCanvasNode = {
    id,
    label: humanizeFlowchartId(id),
    shape: 'rect',
    x: 160 + (layoutIndex % 3) * 240,
    y: 120 + Math.floor(layoutIndex / 3) * 160,
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT
  };
  seen.set(id, node);
  model.nodes.push(node);
  return node;
}

function parseFlowchartNodeTail(tail: string): { label?: string; shape?: FlowchartNodeShape } {
  if (!tail) {
    return {};
  }

  if (/^\[.*\]$/.test(tail)) {
    return { label: tail.slice(1, -1), shape: 'rect' };
  }
  if (/^\(.*\)$/.test(tail)) {
    return { label: tail.slice(1, -1), shape: 'rounded' };
  }
  if (/^\(\[.*\]\)$/.test(tail)) {
    return { label: tail.slice(2, -2), shape: 'stadium' };
  }
  if (/^\{.*\}$/.test(tail)) {
    return { label: tail.slice(1, -1), shape: 'diam' };
  }
  if (/^\(\(.*\)\)$/.test(tail)) {
    return { label: tail.slice(2, -2), shape: 'circle' };
  }

  return { label: tail.trim() || undefined };
}

function formatFlowchartNodeSyntax(node: FlowchartCanvasNode): string {
  const label = escapeFlowchartLabel(node.label || node.id);
  switch (node.shape) {
    case 'rounded':
      return `(${label})`;
    case 'stadium':
      return `([${label}])`;
    case 'diam':
      return `{${label}}`;
    case 'circle':
      return `((${label}))`;
    default:
      return `[${label}]`;
  }
}

function sanitizeFlowchartEdgeType(type: string | undefined): FlowchartEdgeType {
  if (type === '---' || type === '-.->' || type === '==>') {
    return type;
  }
  return DEFAULT_EDGE_TYPE;
}

function escapeFlowchartLabel(label: string): string {
  return String(label).replace(/\]/g, '\\]');
}

function humanizeFlowchartId(id: string): string {
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
