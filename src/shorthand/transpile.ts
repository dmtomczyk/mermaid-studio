import { escapeMermaidLabel, sanitizeId } from '../utils/id';

export interface ShorthandResult {
  mode: 'flow' | 'sequence';
  mermaid: string;
}

export class ShorthandParseError extends Error {
  constructor(message: string, public readonly line: number, public readonly column = 1) {
    super(message);
    this.name = 'ShorthandParseError';
  }
}

interface NodeRef {
  id: string;
  label: string;
  explicitLabel: boolean;
}

interface ParsedEdgeLine {
  nodes: NodeRef[];
  arrows: Array<'->' | '-->'>;
  label?: string;
}

export function transpileShorthand(input: string): ShorthandResult {
  const normalized = input.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    throw new ShorthandParseError('Shorthand input is empty.', 1);
  }

  const lines = normalized.split('\n');
  const header = lines[0].trim();
  const bodyLines = lines.slice(1).filter((line) => line.trim().length > 0);

  if (!bodyLines.length) {
    throw new ShorthandParseError('Add at least one shorthand edge after the header.', 1);
  }

  const flowHeader = header.match(/^flow\s+(LR|TD|RL|BT)$/i);
  if (flowHeader) {
    return {
      mode: 'flow',
      mermaid: transpileFlow(flowHeader[1].toUpperCase(), bodyLines)
    };
  }

  if (/^sequence$/i.test(header)) {
    return {
      mode: 'sequence',
      mermaid: transpileSequence(bodyLines)
    };
  }

  throw new ShorthandParseError(
    'Unknown shorthand header. Use “flow LR|TD|RL|BT” or “sequence”.',
    1
  );
}

function transpileFlow(direction: string, lines: string[]): string {
  const output = [`flowchart ${direction}`];

  lines.forEach((line, index) => {
    const parsed = parseEdgeLine(line, index + 2);
    parsed.arrows.forEach((arrow, edgeIndex) => {
      const left = renderFlowNode(parsed.nodes[edgeIndex]);
      const right = renderFlowNode(parsed.nodes[edgeIndex + 1]);
      const mermaidArrow = arrow === '->' ? '-->' : '-.->';
      const label = parsed.label && edgeIndex === parsed.arrows.length - 1 ? `|${parsed.label}|` : '';
      output.push(`    ${left} ${mermaidArrow}${label} ${right}`);
    });
  });

  return output.join('\n');
}

function transpileSequence(lines: string[]): string {
  const participants = new Map<string, NodeRef>();
  const edges: string[] = [];

  lines.forEach((line, index) => {
    const parsed = parseEdgeLine(line, index + 2);
    if (parsed.arrows.length !== 1 || parsed.nodes.length !== 2) {
      throw new ShorthandParseError('Sequence shorthand supports one edge per line.', index + 2);
    }

    for (const node of parsed.nodes) {
      if (!participants.has(node.id)) {
        participants.set(node.id, node);
      }
    }

    const mermaidArrow = parsed.arrows[0] === '->' ? '->>' : '-->>';
    edges.push(`    ${parsed.nodes[0].id}${mermaidArrow}${parsed.nodes[1].id}${parsed.label ? `: ${parsed.label}` : ''}`);
  });

  const output = ['sequenceDiagram'];
  for (const participant of participants.values()) {
    if (participant.explicitLabel) {
      output.push(`    participant ${participant.id} as ${participant.label}`);
    } else {
      output.push(`    participant ${participant.id}`);
    }
  }
  output.push(...edges);
  return output.join('\n');
}

function parseEdgeLine(rawLine: string, lineNumber: number): ParsedEdgeLine {
  const line = rawLine.replace(/^\s*-\s*/, '').trim();
  if (!line) {
    throw new ShorthandParseError('Empty shorthand line.', lineNumber);
  }

  const { edgePart, label } = splitLabel(line);
  const { parts, arrows } = splitByArrows(edgePart, lineNumber);

  if (!arrows.length || parts.length < 2) {
    throw new ShorthandParseError('Expected an arrow like “A -> B” or “A --> B”.', lineNumber);
  }

  return {
    nodes: parts.map((part) => parseNode(part, lineNumber)),
    arrows,
    label
  };
}

function splitLabel(line: string): { edgePart: string; label?: string } {
  let inQuotes = false;
  let bracketDepth = 0;
  let labelIndex = -1;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index - 1] !== '\\') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes) {
      if (char === '[') {
        bracketDepth += 1;
      } else if (char === ']') {
        bracketDepth = Math.max(0, bracketDepth - 1);
      } else if (char === ':' && bracketDepth === 0) {
        labelIndex = index;
      }
    }
  }

  if (labelIndex === -1) {
    return { edgePart: line };
  }

  return {
    edgePart: line.slice(0, labelIndex).trim(),
    label: line.slice(labelIndex + 1).trim()
  };
}

function splitByArrows(line: string, lineNumber: number): {
  parts: string[];
  arrows: Array<'->' | '-->'>;
} {
  const parts: string[] = [];
  const arrows: Array<'->' | '-->'> = [];
  let buffer = '';
  let inQuotes = false;
  let bracketDepth = 0;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index - 1] !== '\\') {
      inQuotes = !inQuotes;
      buffer += char;
      continue;
    }

    if (!inQuotes) {
      if (char === '[') {
        bracketDepth += 1;
      } else if (char === ']') {
        bracketDepth = Math.max(0, bracketDepth - 1);
      }

      if (bracketDepth === 0 && line.startsWith('-->', index)) {
        parts.push(buffer.trim());
        buffer = '';
        arrows.push('-->');
        index += 2;
        continue;
      }
      if (bracketDepth === 0 && line.startsWith('->', index)) {
        parts.push(buffer.trim());
        buffer = '';
        arrows.push('->');
        index += 1;
        continue;
      }
    }

    buffer += char;
  }

  if (inQuotes || bracketDepth !== 0) {
    throw new ShorthandParseError('Unclosed quote or bracket in shorthand line.', lineNumber);
  }

  parts.push(buffer.trim());
  return { parts, arrows };
}

function parseNode(token: string, lineNumber: number): NodeRef {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new ShorthandParseError('Missing node near arrow.', lineNumber);
  }

  const aliasMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*\[\s*"([^"]+)"\s*\]$/);
  if (aliasMatch) {
    return {
      id: sanitizeId(aliasMatch[1]),
      label: aliasMatch[2],
      explicitLabel: true
    };
  }

  const aliasUnquotedMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*\[\s*([^\]]+?)\s*\]$/);
  if (aliasUnquotedMatch) {
    return {
      id: sanitizeId(aliasUnquotedMatch[1]),
      label: aliasUnquotedMatch[2].trim(),
      explicitLabel: true
    };
  }

  const quotedMatch = trimmed.match(/^"([^"]+)"$/);
  if (quotedMatch) {
    return {
      id: sanitizeId(quotedMatch[1]),
      label: quotedMatch[1],
      explicitLabel: true
    };
  }

  return {
    id: sanitizeId(trimmed),
    label: trimmed,
    explicitLabel: false
  };
}

function renderFlowNode(node: NodeRef): string {
  const simpleLabel = /^[A-Za-z0-9_]+$/.test(node.label) ? node.label : `"${escapeMermaidLabel(node.label)}"`;
  return `${node.id}[${simpleLabel}]`;
}
