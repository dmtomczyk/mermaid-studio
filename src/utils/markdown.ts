export interface TextPosition {
  line: number;
  character: number;
}

export interface TextRange {
  start: TextPosition;
  end: TextPosition;
}

export interface MarkdownFenceBlock {
  startLine: number;
  endLine: number;
  contentStartLine: number;
  contentEndLine: number;
  fenceChar: '`' | '~';
  fenceLength: number;
  info: string;
  language: string;
  isMermaid: boolean;
  content: string;
}

const OPEN_FENCE_REGEX = /^\s*(`{3,}|~{3,})(.*)$/;

export function isMarkdownLanguageId(languageId: string): boolean {
  return languageId === 'markdown';
}

export function isMermaidLanguageId(languageId: string): boolean {
  return languageId === 'mermaid';
}

export function isMermaidFenceLanguage(language: string): boolean {
  const normalized = language.trim().toLowerCase();
  return normalized === 'mermaid' || normalized === 'mermaidjs';
}

export function getLineStartOffsets(text: string): number[] {
  const offsets = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') {
      offsets.push(index + 1);
    }
  }
  return offsets;
}

export function offsetAt(text: string, position: TextPosition): number {
  const offsets = getLineStartOffsets(text);
  const lineStart = offsets[Math.min(position.line, offsets.length - 1)] ?? text.length;
  return Math.min(lineStart + position.character, text.length);
}

export function positionAt(text: string, offset: number): TextPosition {
  const safeOffset = Math.max(0, Math.min(offset, text.length));
  const offsets = getLineStartOffsets(text);
  let line = 0;
  for (let index = 0; index < offsets.length; index += 1) {
    if (offsets[index] > safeOffset) {
      break;
    }
    line = index;
  }
  return {
    line,
    character: safeOffset - offsets[line]
  };
}

export function parseMarkdownFences(text: string): MarkdownFenceBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: MarkdownFenceBlock[] = [];
  let open:
    | {
        startLine: number;
        fenceChar: '`' | '~';
        fenceLength: number;
        info: string;
      }
    | undefined;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];

    if (!open) {
      const match = line.match(OPEN_FENCE_REGEX);
      if (!match) {
        continue;
      }

      const fence = match[1];
      open = {
        startLine: lineIndex,
        fenceChar: fence[0] as '`' | '~',
        fenceLength: fence.length,
        info: (match[2] ?? '').trim()
      };
      continue;
    }

    const closeRegex = new RegExp(`^\\s*${open.fenceChar}{${open.fenceLength},}\\s*$`);
    if (!closeRegex.test(line)) {
      continue;
    }

    const language = open.info.split(/\s+/)[0] ?? '';
    blocks.push({
      startLine: open.startLine,
      endLine: lineIndex,
      contentStartLine: open.startLine + 1,
      contentEndLine: lineIndex - 1,
      fenceChar: open.fenceChar,
      fenceLength: open.fenceLength,
      info: open.info,
      language,
      isMermaid: isMermaidFenceLanguage(language),
      content: lines.slice(open.startLine + 1, lineIndex).join('\n')
    });
    open = undefined;
  }

  return blocks;
}

export function findFenceContainingPosition(text: string, position: TextPosition): MarkdownFenceBlock | undefined {
  return parseMarkdownFences(text).find((block) => position.line >= block.startLine && position.line <= block.endLine);
}

export function findMermaidFenceContainingPosition(text: string, position: TextPosition): MarkdownFenceBlock | undefined {
  return parseMarkdownFences(text).find(
    (block) => block.isMermaid && position.line >= block.startLine && position.line <= block.endLine
  );
}

export function findNearestMermaidFence(text: string, position: TextPosition): MarkdownFenceBlock | undefined {
  const blocks = parseMarkdownFences(text).filter((block) => block.isMermaid);
  if (!blocks.length) {
    return undefined;
  }

  const containing = blocks.find((block) => position.line >= block.startLine && position.line <= block.endLine);
  if (containing) {
    return containing;
  }

  return blocks
    .slice()
    .sort((left, right) => distanceToBlock(position.line, left) - distanceToBlock(position.line, right))[0];
}

function distanceToBlock(line: number, block: MarkdownFenceBlock): number {
  if (line < block.startLine) {
    return block.startLine - line;
  }
  if (line > block.endLine) {
    return line - block.endLine;
  }
  return 0;
}

export function getFenceContentOffsets(text: string, block: MarkdownFenceBlock): { start: number; end: number } {
  const offsets = getLineStartOffsets(text);
  const start = offsets[Math.min(block.contentStartLine, offsets.length - 1)] ?? text.length;
  const end = offsets[Math.min(block.endLine, offsets.length - 1)] ?? text.length;
  return { start, end };
}

export function rangeWithinFenceContent(text: string, range: TextRange, block: MarkdownFenceBlock): boolean {
  const contentOffsets = getFenceContentOffsets(text, block);
  const rangeStart = offsetAt(text, range.start);
  const rangeEnd = offsetAt(text, range.end);
  return rangeStart >= contentOffsets.start && rangeEnd <= contentOffsets.end;
}

export function replaceFenceContent(text: string, block: MarkdownFenceBlock, rawMermaid: string): string {
  const { start, end } = getFenceContentOffsets(text, block);
  const normalized = rawMermaid.trim();
  const replacement = normalized ? `${normalized}\n` : '';
  return `${text.slice(0, start)}${replacement}${text.slice(end)}`;
}

export function wrapMermaidBlock(rawMermaid: string, fenceLanguage: string): string {
  const trimmed = rawMermaid.trim();
  return ['```' + fenceLanguage, trimmed, '```'].join('\n');
}

export function createWrappedInsertion(text: string, position: TextPosition, rawMermaid: string, fenceLanguage: string): {
  start: number;
  end: number;
  replacement: string;
} {
  const offset = offsetAt(text, position);
  const block = wrapMermaidBlock(rawMermaid, fenceLanguage);
  const before = text.slice(0, offset);
  const after = text.slice(offset);

  let replacement = block;
  if (before.length > 0 && !before.endsWith('\n\n')) {
    replacement = before.endsWith('\n') ? `\n${replacement}` : `\n\n${replacement}`;
  }
  if (after.length > 0 && !after.startsWith('\n\n')) {
    replacement = after.startsWith('\n') ? `${replacement}\n` : `${replacement}\n\n`;
  }

  return {
    start: offset,
    end: offset,
    replacement
  };
}

export function replaceRange(text: string, start: number, end: number, replacement: string): string {
  return `${text.slice(0, start)}${replacement}${text.slice(end)}`;
}

export function summarizeFence(block: MarkdownFenceBlock): string {
  const firstContentLine = block.content.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '(empty block)';
  return `Lines ${block.startLine + 1}-${block.endLine + 1}: ${firstContentLine.trim()}`;
}
