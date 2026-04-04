import { BuilderViewState } from './types';

export function validateFlowState(state: BuilderViewState): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  if (!state.nodes.length) {
    issues.push('Add at least one node.');
  }
  state.nodes.forEach((node, index) => {
    if (!node.id || !node.id.trim()) {
      issues.push(`Node ${index + 1} is missing an ID.`);
    }
    if (ids.has(node.id)) {
      issues.push(`Node ${index + 1} reuses ID: ${node.id}`);
    }
    ids.add(node.id);
    if (!node.label || !node.label.trim()) {
      issues.push(`Node ${index + 1} is missing a label.`);
    }
  });
  state.edges.forEach((edge, index) => {
    if (!ids.has(edge.from)) {
      issues.push(`Edge ${index + 1} references missing source: ${edge.from}`);
    }
    if (!ids.has(edge.to)) {
      issues.push(`Edge ${index + 1} references missing target: ${edge.to}`);
    }
  });
  return issues;
}

export function validateSequenceState(state: BuilderViewState): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  if (!state.participants.length) {
    issues.push('Add at least one participant.');
  }
  state.participants.forEach((participant, index) => {
    if (!participant.id || !participant.id.trim()) {
      issues.push(`Participant ${index + 1} is missing an ID.`);
    }
    if (ids.has(participant.id)) {
      issues.push(`Participant ${index + 1} reuses ID: ${participant.id}`);
    }
    ids.add(participant.id);
    if (!participant.label || !participant.label.trim()) {
      issues.push(`Participant ${index + 1} is missing a label.`);
    }
  });
  state.messages.forEach((message, index) => {
    if (!ids.has(message.from)) {
      issues.push(`Message ${index + 1} references missing sender: ${message.from}`);
    }
    if (!ids.has(message.to)) {
      issues.push(`Message ${index + 1} references missing receiver: ${message.to}`);
    }
    if (!message.label || !String(message.label).trim()) {
      issues.push(`Message ${index + 1} is missing a label.`);
    }
  });
  return issues;
}
