import { TextPosition } from '../utils/markdown';
import {
  createMarkdownPreviewBlocks,
  getActiveMarkdownBlockIndex,
  getActiveMermaidBlockIndex,
  PreviewBlock,
  splitMermaidSourceIntoBlocks
} from './blocks';

export interface PreviewDocumentModel {
  blocks: PreviewBlock[];
  activeIndex: number;
  title: string;
}

export function buildMermaidPreviewModel(text: string, fileName: string, activeLineZeroBased: number): PreviewDocumentModel | undefined {
  const blocks = splitMermaidSourceIntoBlocks(text, fileName);
  if (!blocks.length) {
    return undefined;
  }

  return {
    blocks,
    activeIndex: getActiveMermaidBlockIndex(blocks, activeLineZeroBased),
    title: `${fileName} · ${blocks.length} Mermaid diagram${blocks.length === 1 ? '' : 's'}`
  };
}

export function buildMarkdownPreviewModel(
  text: string,
  fileName: string,
  anchorPosition: TextPosition,
  markdownMode: 'nearest' | 'containing'
): PreviewDocumentModel | undefined {
  const blocks = createMarkdownPreviewBlocks(text);
  if (!blocks.length) {
    return undefined;
  }

  return {
    blocks,
    activeIndex: getActiveMarkdownBlockIndex(text, anchorPosition, markdownMode),
    title: `${fileName} · ${blocks.length} Mermaid block${blocks.length === 1 ? '' : 's'}`
  };
}
