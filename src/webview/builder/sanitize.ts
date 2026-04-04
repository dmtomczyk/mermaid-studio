import { BuilderViewState, FlowNode, SequenceParticipant } from './types';
import { escapeMermaidInline, sanitizeId } from './utils';

export function sanitizeStateInPlace(targetState: BuilderViewState): void {
  targetState.diagramType = targetState.diagramType === 'sequence' ? 'sequence' : 'flowchart';
  targetState.direction = ['TD', 'LR', 'RL', 'BT'].includes(targetState.direction) ? targetState.direction : 'TD';

  if (targetState.diagramType === 'sequence') {
    targetState.nodes = [];
    targetState.edges = [];
    sanitizeSequenceStateInPlace(targetState);
    return;
  }

  targetState.participants = [];
  targetState.messages = [];
  sanitizeFlowStateInPlace(targetState);
}

export function sanitizeSequenceStateInPlace(targetState: BuilderViewState): void {
  const participantIds = new Set<string>();
  const sanitizedParticipants: SequenceParticipant[] = [];

  for (const rawParticipant of Array.isArray(targetState.participants) ? targetState.participants : []) {
    const id = sanitizeId(rawParticipant?.id || rawParticipant?.label || 'Actor');
    const label = escapeMermaidInline(rawParticipant?.label || rawParticipant?.id || 'Participant');
    if (!id || participantIds.has(id)) {
      continue;
    }
    participantIds.add(id);
    sanitizedParticipants.push({ id, label });
  }

  const sanitizedMessages: Array<{ from: string; to: string; style: 'solid' | 'dashed'; label: string }> = [];
  for (const rawMessage of Array.isArray(targetState.messages) ? targetState.messages : []) {
    const from = sanitizeId(rawMessage?.from || '');
    const to = sanitizeId(rawMessage?.to || '');
    const label = escapeMermaidInline(rawMessage?.label || '');
    if (!from || !to || !participantIds.has(from) || !participantIds.has(to) || !label) {
      continue;
    }
    sanitizedMessages.push({
      from,
      to,
      style: rawMessage?.style === 'dashed' ? 'dashed' : 'solid',
      label
    });
  }

  targetState.participants = sanitizedParticipants;
  targetState.messages = sanitizedMessages;
}

export function sanitizeFlowStateInPlace(targetState: BuilderViewState): void {
  const nodeIds = new Set<string>();
  const sanitizedNodes: FlowNode[] = [];

  for (const rawNode of Array.isArray(targetState.nodes) ? targetState.nodes : []) {
    const id = sanitizeId(rawNode?.id || rawNode?.label || 'Node');
    if (!id || nodeIds.has(id)) {
      continue;
    }
    nodeIds.add(id);
    sanitizedNodes.push({
      id,
      label: escapeMermaidInline(rawNode?.label || rawNode?.id || id),
      shape: ['rectangle', 'rounded', 'circle', 'diamond', 'database'].includes(rawNode?.shape) ? rawNode.shape : 'rectangle',
      x: typeof rawNode?.x === 'number' ? rawNode.x : undefined,
      y: typeof rawNode?.y === 'number' ? rawNode.y : undefined
    });
  }

  const sanitizedEdges: Array<{ from: string; to: string; style: 'solid' | 'dotted'; label: string }> = [];
  for (const rawEdge of Array.isArray(targetState.edges) ? targetState.edges : []) {
    const from = sanitizeId(rawEdge?.from || '');
    const to = sanitizeId(rawEdge?.to || '');
    if (!from || !to || !nodeIds.has(from) || !nodeIds.has(to)) {
      continue;
    }
    sanitizedEdges.push({
      from,
      to,
      style: rawEdge?.style === 'dotted' ? 'dotted' : 'solid',
      label: escapeMermaidInline(rawEdge?.label || '')
    });
  }

  targetState.nodes = sanitizedNodes;
  targetState.edges = sanitizedEdges;
}

export function createUniqueFlowNodeId(state: BuilderViewState, seed: string): string {
  const base = sanitizeId(seed) || 'Node';
  let candidate = base;
  let counter = 2;
  const existing = new Set(state.nodes.map((node) => node.id));
  while (existing.has(candidate)) {
    candidate = `${base}_${counter}`;
    counter += 1;
  }
  return candidate;
}

export function ensureUniqueFlowNodeId(state: BuilderViewState, candidate: string, currentIndex: number): string {
  const existing = new Set(state.nodes.filter((_, index) => index !== currentIndex).map((node) => node.id));
  if (!existing.has(candidate)) {
    return candidate;
  }
  let next = candidate;
  let counter = 2;
  while (existing.has(next)) {
    next = `${candidate}_${counter}`;
    counter += 1;
  }
  return next;
}

export function createUniqueParticipantId(state: BuilderViewState, seed: string): string {
  const base = sanitizeId(seed) || 'Actor';
  let candidate = base;
  let counter = 2;
  const existing = new Set(state.participants.map((participant) => participant.id));
  while (existing.has(candidate)) {
    candidate = `${base}_${counter}`;
    counter += 1;
  }
  return candidate;
}

export function ensureUniqueParticipantId(state: BuilderViewState, candidate: string, currentIndex: number): string {
  const existing = new Set(state.participants.filter((_, index) => index !== currentIndex).map((participant) => participant.id));
  if (!existing.has(candidate)) {
    return candidate;
  }
  let next = candidate;
  let counter = 2;
  while (existing.has(next)) {
    next = `${candidate}_${counter}`;
    counter += 1;
  }
  return next;
}
