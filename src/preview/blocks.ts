import {
  findMermaidFenceContainingPosition,
  findNearestMermaidFence,
  parseMarkdownFences,
  TextPosition
} from '../utils/markdown';

export interface PreviewBlock {
  mermaid: string;
  title: string;
  startLine: number;
  endLine: number;
}

const MERMAID_ROOT_KEYWORDS = [
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram-v2',
  'erDiagram',
  'gantt',
  'mindmap',
  'gitGraph',
  'architecture-beta',
  'journey',
  'pie',
  'timeline',
  'quadrantChart',
  'requirementDiagram',
  'xychart-beta',
  'sankey-beta'
];

export function splitMermaidSourceIntoBlocks(text: string, fileName: string): PreviewBlock[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const roots: Array<{ line: number; header: string }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('%%')) {
      continue;
    }
    if (MERMAID_ROOT_KEYWORDS.some((keyword) => matchesRootKeyword(trimmed, keyword))) {
      roots.push({ line: index, header: trimmed });
    }
  }

  if (!roots.length) {
    const normalized = text.trim();
    return normalized
      ? [{ mermaid: normalized, title: fileName, startLine: 1, endLine: lines.length }]
      : [];
  }

  return roots
    .map((root, index) => {
      const nextRoot = roots[index + 1];
      const endLineExclusive = nextRoot ? nextRoot.line : lines.length;
      const blockLines = lines.slice(root.line, endLineExclusive);
      while (blockLines.length > 0 && !blockLines[blockLines.length - 1].trim()) {
        blockLines.pop();
      }
      const title = `Lines ${root.line + 1}-${root.line + blockLines.length} · ${root.header}`;
      return {
        mermaid: blockLines.join('\n').trim(),
        title,
        startLine: root.line + 1,
        endLine: root.line + blockLines.length
      };
    })
    .filter((block) => block.mermaid.length > 0);
}

export function createMarkdownPreviewBlocks(text: string): PreviewBlock[] {
  return parseMarkdownFences(text)
    .filter((candidate) => candidate.isMermaid)
    .map<PreviewBlock>((block) => ({
      mermaid: block.content,
      title: `Lines ${block.startLine + 1}-${block.endLine + 1}`,
      startLine: block.startLine + 1,
      endLine: block.endLine + 1
    }));
}

export function getActiveMermaidBlockIndex(blocks: PreviewBlock[], activeLineZeroBased: number): number {
  const activeLine = activeLineZeroBased + 1;
  const containing = blocks.findIndex((block) => activeLine >= block.startLine && activeLine <= block.endLine);
  if (containing >= 0) {
    return containing;
  }

  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  blocks.forEach((block, index) => {
    const distance = activeLine < block.startLine ? block.startLine - activeLine : activeLine - block.endLine;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

export function getActiveMarkdownBlockIndex(
  text: string,
  position: TextPosition,
  mode: 'nearest' | 'containing'
): number {
  const mermaidBlocks = parseMarkdownFences(text).filter((candidate) => candidate.isMermaid);
  if (!mermaidBlocks.length) {
    return 0;
  }

  const activeBlock = mode === 'containing'
    ? findMermaidFenceContainingPosition(text, position) ?? mermaidBlocks[0]
    : findNearestMermaidFence(text, position) ?? mermaidBlocks[0];

  const index = mermaidBlocks.findIndex((block) => block.startLine === activeBlock.startLine && block.endLine === activeBlock.endLine);
  return index >= 0 ? index : 0;
}

function matchesRootKeyword(line: string, keyword: string): boolean {
  return new RegExp(`^${escapeRegExp(keyword)}(?:\\s|$)`).test(line);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
