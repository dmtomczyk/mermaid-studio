import * as vscode from 'vscode';
import { MermaidPreviewPanel } from '../preview/MermaidPreviewPanel';
import { requireActiveEditor } from './helpers';
import { CommandContext } from './types';
import { getEditorContext } from '../utils/editor';

export function registerOpenPreviewCommand(commandContext: CommandContext): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.openPreview', async () => {
    const editor = await requireActiveEditor();
    const editorContext = getEditorContext(editor);

    if (editorContext.kind === 'other') {
      throw new Error('Open a Mermaid or Markdown file first.');
    }

    await MermaidPreviewPanel.createOrShow(commandContext.extensionUri, commandContext.diagnostics, {
      mode: 'document',
      documentUri: editor.document.uri,
      kind: editorContext.kind,
      markdownMode: editorContext.kind === 'markdown' ? 'nearest' : undefined,
      anchorPosition: { line: editor.selection.active.line, character: editor.selection.active.character }
    });
  });
}
