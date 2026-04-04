import * as vscode from 'vscode';
import { getConfig } from './config';
import {
  createWrappedInsertion,
  findFenceContainingPosition,
  findMermaidFenceContainingPosition,
  findNearestMermaidFence,
  isMarkdownLanguageId,
  isMermaidLanguageId,
  MarkdownFenceBlock,
  offsetAt,
  rangeWithinFenceContent,
  replaceFenceContent,
  replaceRange,
  TextRange,
  wrapMermaidBlock
} from './markdown';

export interface EditorContext {
  kind: 'markdown' | 'mermaid' | 'other';
  containingFence?: MarkdownFenceBlock;
  mermaidFence?: MarkdownFenceBlock;
}

export interface InsertMermaidOptions {
  replaceCurrentMarkdownMermaidBlock?: boolean;
  wrapMarkdown?: boolean;
}

export function getEditorContext(editor: vscode.TextEditor): EditorContext {
  const kind = isMarkdownLanguageId(editor.document.languageId)
    ? 'markdown'
    : isMermaidLanguageId(editor.document.languageId)
      ? 'mermaid'
      : 'other';

  if (kind !== 'markdown') {
    return { kind };
  }

  const text = editor.document.getText();
  const position = { line: editor.selection.active.line, character: editor.selection.active.character };
  return {
    kind,
    containingFence: findFenceContainingPosition(text, position),
    mermaidFence: findMermaidFenceContainingPosition(text, position)
  };
}

export async function insertMermaidText(
  editor: vscode.TextEditor,
  rawMermaid: string,
  options: InsertMermaidOptions = {}
): Promise<void> {
  const config = getConfig();
  const context = getEditorContext(editor);
  const selection = editor.selection;

  if (context.kind === 'other') {
    throw new Error('Open a Mermaid or Markdown file first.');
  }

  if (context.kind === 'mermaid') {
    await editor.edit((editBuilder) => {
      const target = selection.isEmpty ? new vscode.Range(selection.active, selection.active) : selection;
      editBuilder.replace(target, rawMermaid);
    });
    return;
  }

  if (context.containingFence && !context.mermaidFence) {
    throw new Error('Cursor is inside a non-Mermaid code fence. Move the cursor or selection first.');
  }

  const text = editor.document.getText();
  const wrapMarkdown = options.wrapMarkdown ?? config.insertMarkdownFencesByDefault;

  if (context.mermaidFence) {
    const fullRange: TextRange = {
      start: { line: selection.start.line, character: selection.start.character },
      end: { line: selection.end.line, character: selection.end.character }
    };

    if (options.replaceCurrentMarkdownMermaidBlock) {
      const updated = replaceFenceContent(text, context.mermaidFence, rawMermaid);
      const fullDocumentRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(text.length)
      );
      await editor.edit((editBuilder) => editBuilder.replace(fullDocumentRange, updated));
      return;
    }

    if (!selection.isEmpty && rangeWithinFenceContent(text, fullRange, context.mermaidFence)) {
      const start = offsetAt(text, fullRange.start);
      const end = offsetAt(text, fullRange.end);
      const updated = replaceRange(text, start, end, rawMermaid);
      const fullDocumentRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(text.length)
      );
      await editor.edit((editBuilder) => editBuilder.replace(fullDocumentRange, updated));
      return;
    }

    await editor.edit((editBuilder) => {
      const target = selection.isEmpty ? new vscode.Range(selection.active, selection.active) : selection;
      editBuilder.replace(target, rawMermaid);
    });
    return;
  }

  if (!wrapMarkdown) {
    await editor.edit((editBuilder) => {
      const target = selection.isEmpty ? new vscode.Range(selection.active, selection.active) : selection;
      editBuilder.replace(target, rawMermaid);
    });
    return;
  }

  const replacement = wrapMermaidBlock(rawMermaid, config.markdownFenceLanguage);

  if (!selection.isEmpty) {
    await editor.edit((editBuilder) => editBuilder.replace(selection, replacement));
    return;
  }

  const insertion = createWrappedInsertion(
    text,
    { line: selection.active.line, character: selection.active.character },
    rawMermaid,
    config.markdownFenceLanguage
  );

  await editor.edit((editBuilder) => {
    editBuilder.replace(
      new vscode.Range(editor.document.positionAt(insertion.start), editor.document.positionAt(insertion.end)),
      insertion.replacement
    );
  });
}

export function getNearestMarkdownMermaidBlock(editor: vscode.TextEditor): MarkdownFenceBlock | undefined {
  const text = editor.document.getText();
  const position = { line: editor.selection.active.line, character: editor.selection.active.character };
  return findNearestMermaidFence(text, position);
}

export function getMermaidBlockContainingCursor(editor: vscode.TextEditor): MarkdownFenceBlock | undefined {
  const text = editor.document.getText();
  const position = { line: editor.selection.active.line, character: editor.selection.active.character };
  return findMermaidFenceContainingPosition(text, position);
}

export function getBlockRange(document: vscode.TextDocument, block: MarkdownFenceBlock): vscode.Range {
  const startOffset = offsetAt(document.getText(), { line: block.startLine, character: 0 });
  const endLineText = document.lineAt(block.endLine).text;
  const endOffset = offsetAt(document.getText(), { line: block.endLine, character: endLineText.length });
  return new vscode.Range(document.positionAt(startOffset), document.positionAt(endOffset));
}

export function getFenceContentRange(document: vscode.TextDocument, block: MarkdownFenceBlock): vscode.Range {
  const text = document.getText();
  const startOffset = offsetAt(text, { line: block.contentStartLine, character: 0 });
  const endOffset = offsetAt(text, { line: block.endLine, character: 0 });
  return new vscode.Range(document.positionAt(startOffset), document.positionAt(endOffset));
}

export async function createUntitledMermaidDocument(
  mermaid: string,
  workspaceFolder?: vscode.WorkspaceFolder
): Promise<vscode.TextEditor> {
  const basePath = workspaceFolder?.uri.fsPath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
  const untitledPath = basePath
    ? vscode.Uri.file(`${basePath}/diagram-${Date.now()}.mmd`).with({ scheme: 'untitled' })
    : vscode.Uri.parse(`untitled:diagram-${Date.now()}.mmd`);

  const document = await vscode.workspace.openTextDocument(untitledPath);
  const editor = await vscode.window.showTextDocument(document, { preview: false });
  await editor.edit((editBuilder) => editBuilder.insert(new vscode.Position(0, 0), mermaid));
  return editor;
}

