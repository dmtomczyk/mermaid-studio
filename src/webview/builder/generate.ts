import { BuilderViewState, FlowNode } from './types';
import { escapeMermaidInline, sanitizeId } from './utils';

export function buildMermaidFromState(state: BuilderViewState): string {
  if (state.diagramType === 'sequence') {
    const lines = ['sequenceDiagram'];
    state.participants.forEach((participant) => {
      if (participant.label && participant.label !== participant.id) {
        lines.push(`    participant ${participant.id} as "${escapeMermaidInline(participant.label)}"`);
      } else {
        lines.push(`    participant ${participant.id}`);
      }
    });
    state.messages.forEach((message) => {
      const arrow = message.style === 'dashed' ? '-->>' : '->>';
      const label = message.label ? `: ${escapeMermaidInline(message.label)}` : '';
      lines.push(`    ${message.from}${arrow}${message.to}${label}`);
    });
    return lines.join('\n');
  }

  const lines = [`flowchart ${state.direction}`];
  state.edges.forEach((edge) => {
    const fromNode = state.nodes.find((node) => node.id === edge.from);
    const toNode = state.nodes.find((node) => node.id === edge.to);
    if (!fromNode || !toNode) {
      return;
    }
    const arrow = edge.style === 'dotted' ? '-.->' : '-->';
    const label = edge.label ? `|${escapeMermaidInline(edge.label)}|` : '';
    lines.push(`    ${renderFlowNodeSyntax(fromNode)} ${arrow}${label} ${renderFlowNodeSyntax(toNode)}`);
  });
  return lines.join('\n');
}

export function renderFlowNodeSyntax(node: FlowNode): string {
  const id = sanitizeId(node.id || 'Node');
  const label = escapeMermaidInline(node.label || id);
  switch (node.shape) {
    case 'rounded':
      return `${id}(["${label}"])`;
    case 'circle':
      return `${id}(("${label}"))`;
    case 'diamond':
      return `${id}{"${label}"}`;
    case 'database':
      return `${id}[("${label}")]`;
    default:
      return `${id}["${label}"]`;
  }
}
