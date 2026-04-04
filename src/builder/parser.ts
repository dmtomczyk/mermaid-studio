import { sanitizeId } from '../utils/id';
import { sanitizeBuilderState } from './sanitize';
import { BuilderDiagramState, BuilderImportResult, FlowEdge, FlowNode, SequenceMessage, SequenceParticipant } from './types';

const DEFAULT_STATE: BuilderDiagramState = {
  diagramType: 'flowchart',
  direction: 'TD',
  nodes: [],
  edges: [],
  participants: [],
  messages: [],
  source: ''
};

export function parseMermaidToBuilderState(rawSource: string): BuilderImportResult {
  const source = rawSource.replace(/\r\n/g, '\n').trim();
  if (!source) {
    throw new Error('The Mermaid source is empty.');
  }

  const lines = source
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .filter((line) => line.trim().length > 0 && !line.trim().startsWith('%%'));

  const header = lines[0]?.trim() ?? '';
  if (/^(flowchart|graph)\b/i.test(header)) {
    return parseFlowchart(source, lines);
  }

  if (/^sequenceDiagram\b/i.test(header)) {
    return parseSequence(source, lines);
  }

  throw new Error('Only flowchart and sequenceDiagram imports are supported in the builder right now.');
}

function parseFlowchart(source: string, lines: string[]): BuilderImportResult {
  const warnings: string[] = [];
  const header = lines[0].trim();
  const directionMatch = header.match(/^(?:flowchart|graph)\s+(TD|LR|RL|BT)\b/i);
  const direction = (directionMatch?.[1]?.toUpperCase() as BuilderDiagramState['direction']) || 'TD';

  const nodeMap = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];

  for (const line of lines.slice(1)) {
    const edgeMatch = line.match(/^\s*(.+?)\s+(-\.->|-->)\s*(?:\|([^|]+)\|)?\s*(.+?)\s*$/);
    if (edgeMatch) {
      const left = parseFlowNodeToken(edgeMatch[1]);
      const right = parseFlowNodeToken(edgeMatch[4]);
      if (!left || !right) {
        warnings.push(`Skipped unsupported flowchart edge line: ${line.trim()}`);
        continue;
      }
      rememberFlowNode(nodeMap, left);
      rememberFlowNode(nodeMap, right);
      edges.push({
        from: left.id,
        to: right.id,
        style: edgeMatch[2] === '-.->' ? 'dotted' : 'solid',
        label: edgeMatch[3]?.trim() || ''
      });
      continue;
    }

    const standalone = parseFlowNodeToken(line.trim(), true);
    if (standalone) {
      rememberFlowNode(nodeMap, standalone);
      continue;
    }

    warnings.push(`Skipped unsupported flowchart line: ${line.trim()}`);
  }

  const state: BuilderDiagramState = sanitizeBuilderState({
    ...DEFAULT_STATE,
    diagramType: 'flowchart',
    direction,
    nodes: assignAutoLayout(Array.from(nodeMap.values())),
    edges,
    source
  });

  return { state, warnings };
}

function parseSequence(source: string, lines: string[]): BuilderImportResult {
  const warnings: string[] = [];
  const participantMap = new Map<string, SequenceParticipant>();
  const messages: SequenceMessage[] = [];

  for (const line of lines.slice(1)) {
    const participantAsMatch = line.match(/^\s*participant\s+([A-Za-z_][A-Za-z0-9_]*)\s+as\s+(.+?)\s*$/);
    if (participantAsMatch) {
      participantMap.set(participantAsMatch[1], {
        id: participantAsMatch[1],
        label: stripQuotes(participantAsMatch[2])
      });
      continue;
    }

    const participantMatch = line.match(/^\s*participant\s+([A-Za-z_][A-Za-z0-9_]*)\s*$/);
    if (participantMatch) {
      participantMap.set(participantMatch[1], {
        id: participantMatch[1],
        label: participantMatch[1]
      });
      continue;
    }

    const messageMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(->>|-->>)\s*([A-Za-z_][A-Za-z0-9_]*)(?:\s*:\s*(.+))?\s*$/);
    if (messageMatch) {
      const from = messageMatch[1];
      const to = messageMatch[3];
      if (!participantMap.has(from)) {
        participantMap.set(from, { id: from, label: from });
      }
      if (!participantMap.has(to)) {
        participantMap.set(to, { id: to, label: to });
      }
      messages.push({
        from,
        to,
        style: messageMatch[2] === '-->>' ? 'dashed' : 'solid',
        label: messageMatch[4]?.trim() || ''
      });
      continue;
    }

    warnings.push(`Skipped unsupported sequence line: ${line.trim()}`);
  }

  const state: BuilderDiagramState = sanitizeBuilderState({
    ...DEFAULT_STATE,
    diagramType: 'sequence',
    participants: Array.from(participantMap.values()),
    messages,
    source
  });

  return { state, warnings };
}

function parseFlowNodeToken(token: string, standaloneOnly = false): FlowNode | undefined {
  const trimmed = token.trim();
  if (!trimmed) {
    return undefined;
  }

  const patterns: Array<{ regex: RegExp; shape: FlowNode['shape']; labelIndex: number; idIndex?: number }> = [
    { regex: /^([A-Za-z_][A-Za-z0-9_]*)\(\["([^"]+)"\]\)$/u, shape: 'rounded', labelIndex: 2, idIndex: 1 },
    { regex: /^([A-Za-z_][A-Za-z0-9_]*)\(\((?:"([^"]+)"|([^\)]+))\)\)$/u, shape: 'circle', labelIndex: 2, idIndex: 1 },
    { regex: /^([A-Za-z_][A-Za-z0-9_]*)\{(?:"([^"]+)"|([^\}]+))\}$/u, shape: 'diamond', labelIndex: 2, idIndex: 1 },
    { regex: /^([A-Za-z_][A-Za-z0-9_]*)\[\((?:"([^"]+)"|([^\)]+))\)\]$/u, shape: 'database', labelIndex: 2, idIndex: 1 },
    { regex: /^([A-Za-z_][A-Za-z0-9_]*)\[(?:"([^"]+)"|([^\]]+))\]$/u, shape: 'rectangle', labelIndex: 2, idIndex: 1 },
    { regex: /^([A-Za-z_][A-Za-z0-9_]*)$/u, shape: 'rectangle', labelIndex: 1 }
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern.regex);
    if (!match) {
      continue;
    }

    const rawId = pattern.idIndex ? match[pattern.idIndex] : match[1];
    const label = stripQuotes(match[pattern.labelIndex] || match[pattern.labelIndex + 1] || rawId);
    return {
      id: sanitizeId(rawId),
      label,
      shape: pattern.shape
    };
  }

  if (!standaloneOnly) {
    return {
      id: sanitizeId(trimmed),
      label: trimmed,
      shape: 'rectangle'
    };
  }

  return undefined;
}

function rememberFlowNode(map: Map<string, FlowNode>, node: FlowNode | undefined): void {
  if (!node) {
    return;
  }

  const existing = map.get(node.id);
  if (!existing) {
    map.set(node.id, node);
    return;
  }

  if ((!existing.label || existing.label === existing.id) && node.label) {
    existing.label = node.label;
  }
  if (existing.shape === 'rectangle' && node.shape !== 'rectangle') {
    existing.shape = node.shape;
  }
}

function assignAutoLayout(nodes: FlowNode[]): FlowNode[] {
  return nodes.map((node, index) => ({
    ...node,
    x: 24 + (index % 3) * 128,
    y: 24 + Math.floor(index / 3) * 92
  }));
}

function stripQuotes(value: string): string {
  return value.trim().replace(/^"|"$/g, '');
}
