import * as vscode from 'vscode';
import { getConfig } from '../utils/config';
import { getEditorContext } from '../utils/editor';
import { MarkdownFenceBlock, summarizeFence, wrapMermaidBlock } from '../utils/markdown';
import { MERMAID_TEMPLATES, MermaidTemplate } from '../utils/templates';

export async function requireActiveEditor(): Promise<vscode.TextEditor> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    throw new Error('Open a Mermaid or Markdown file first.');
  }
  return editor;
}

export async function pickTemplate(placeHolder = 'Choose a Mermaid template'): Promise<MermaidTemplate | undefined> {
  return vscode.window.showQuickPick(
    MERMAID_TEMPLATES.map((template) => ({
      label: template.label,
      description: template.description,
      template
    })),
    { placeHolder }
  ).then((item) => item?.template);
}

export function wrapForCurrentEditor(editor: vscode.TextEditor, mermaid: string): string {
  const context = getEditorContext(editor);
  if (context.kind === 'markdown' && !context.mermaidFence && getConfig().insertMarkdownFencesByDefault) {
    return wrapMermaidBlock(mermaid, getConfig().markdownFenceLanguage);
  }
  return mermaid;
}

export async function pickMarkdownMermaidBlock(
  blocks: MarkdownFenceBlock[]
): Promise<MarkdownFenceBlock | undefined> {
  return vscode.window.showQuickPick(
    blocks.map((block) => ({
      label: summarizeFence(block),
      description: 'Mermaid block',
      block
    })),
    { placeHolder: 'Choose a Mermaid block' }
  ).then((item) => item?.block);
}
