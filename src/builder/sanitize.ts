import { BuilderDiagramState, FlowEdge, FlowNode, SequenceMessage, SequenceParticipant } from './types';

type PartialBuilderDiagramState = Partial<BuilderDiagramState> & {
  nodes?: Array<Partial<FlowNode>>;
  edges?: Array<Partial<FlowEdge>>;
  participants?: Array<Partial<SequenceParticipant>>;
  messages?: Array<Partial<SequenceMessage>>;
};

const VALID_DIRECTIONS = new Set<BuilderDiagramState['direction']>(['TD', 'LR', 'RL', 'BT']);
const VALID_FLOW_SHAPES = new Set<FlowNode['shape']>(['rectangle', 'rounded', 'circle', 'diamond', 'database']);

export function sanitizeBuilderState(input: PartialBuilderDiagramState): BuilderDiagramState {
  const diagramType = input.diagramType === 'sequence' ? 'sequence' : 'flowchart';
  const direction = VALID_DIRECTIONS.has(input.direction as BuilderDiagramState['direction'])
    ? (input.direction as BuilderDiagramState['direction'])
    : 'TD';

  if (diagramType === 'sequence') {
    const participants = sanitizeSequenceParticipants(input.participants);
    const participantIds = new Set(participants.map((participant) => participant.id));
    const messages = sanitizeSequenceMessages(input.messages, participantIds);

    return {
      diagramType,
      direction,
      nodes: [],
      edges: [],
      participants,
      messages,
      source: typeof input.source === 'string' ? input.source : '',
      preset: typeof input.preset === 'string' ? input.preset : undefined
    };
  }

  const nodes = sanitizeFlowNodes(input.nodes);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = sanitizeFlowEdges(input.edges, nodeIds);

  return {
    diagramType,
    direction,
    nodes,
    edges,
    participants: [],
    messages: [],
    source: typeof input.source === 'string' ? input.source : '',
    preset: typeof input.preset === 'string' ? input.preset : undefined
  };
}

function sanitizeSequenceParticipants(participants: PartialBuilderDiagramState['participants']): SequenceParticipant[] {
  const ids = new Set<string>();
  const sanitized: SequenceParticipant[] = [];

  for (const rawParticipant of Array.isArray(participants) ? participants : []) {
    const id = sanitizeOptionalId(rawParticipant?.id || rawParticipant?.label || 'Actor');
    const label = escapeMermaidInline(rawParticipant?.label || rawParticipant?.id || 'Participant');
    if (!id || ids.has(id)) {
      continue;
    }
    ids.add(id);
    sanitized.push({ id, label });
  }

  return sanitized;
}

function sanitizeSequenceMessages(
  messages: PartialBuilderDiagramState['messages'],
  participantIds: Set<string>
): SequenceMessage[] {
  const sanitized: SequenceMessage[] = [];

  for (const rawMessage of Array.isArray(messages) ? messages : []) {
    const from = sanitizeOptionalId(rawMessage?.from || '');
    const to = sanitizeOptionalId(rawMessage?.to || '');
    const label = escapeMermaidInline(rawMessage?.label || '');

    if (!from || !to || !participantIds.has(from) || !participantIds.has(to) || !label) {
      continue;
    }

    sanitized.push({
      from,
      to,
      style: rawMessage?.style === 'dashed' ? 'dashed' : 'solid',
      label
    });
  }

  return sanitized;
}

function sanitizeFlowNodes(nodes: PartialBuilderDiagramState['nodes']): FlowNode[] {
  const ids = new Set<string>();
  const sanitized: FlowNode[] = [];

  for (const rawNode of Array.isArray(nodes) ? nodes : []) {
    const id = sanitizeOptionalId(rawNode?.id || rawNode?.label || 'Node');
    if (!id || ids.has(id)) {
      continue;
    }

    ids.add(id);
    sanitized.push({
      id,
      label: escapeMermaidInline(rawNode?.label || rawNode?.id || id),
      shape: VALID_FLOW_SHAPES.has(rawNode?.shape as FlowNode['shape']) ? (rawNode?.shape as FlowNode['shape']) : 'rectangle',
      x: typeof rawNode?.x === 'number' ? rawNode.x : undefined,
      y: typeof rawNode?.y === 'number' ? rawNode.y : undefined
    });
  }

  return sanitized;
}

function sanitizeFlowEdges(edges: PartialBuilderDiagramState['edges'], nodeIds: Set<string>): FlowEdge[] {
  const sanitized: FlowEdge[] = [];

  for (const rawEdge of Array.isArray(edges) ? edges : []) {
    const from = sanitizeOptionalId(rawEdge?.from || '');
    const to = sanitizeOptionalId(rawEdge?.to || '');
    if (!from || !to || !nodeIds.has(from) || !nodeIds.has(to)) {
      continue;
    }

    sanitized.push({
      from,
      to,
      style: rawEdge?.style === 'dotted' ? 'dotted' : 'solid',
      label: escapeMermaidInline(rawEdge?.label || '')
    });
  }

  return sanitized;
}

function sanitizeOptionalId(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }

  const normalized = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  if (!normalized) {
    return '';
  }

  return /^[0-9]/.test(normalized) ? `n_${normalized}` : normalized;
}

function escapeMermaidInline(value: string): string {
  return String(value || '')
    .replace(/\r?\n|\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\|/g, '&#124;')
    .replace(/"/g, '\\"');
}
