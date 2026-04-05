import * as vscode from 'vscode';
import { MermaidPreviewPanel } from '../preview/MermaidPreviewPanel';
import { requireActiveEditor } from './helpers';
import { CommandContext } from './types';

export function registerPreviewMarkdownBlockCommand(commandContext: CommandContext): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.previewMarkdownBlock', async () => {
    const editor = await requireActiveEditor();
    if (editor.document.languageId !== 'markdown') {
      throw new Error('This command works in Markdown files.');
    }

    await MermaidPreviewPanel.createOrShow(commandContext.extensionUri, commandContext.diagnostics, {
      mode: 'document',
      documentUri: editor.document.uri,
      kind: 'markdown',
      markdownMode: 'containing',
      anchorPosition: { line: editor.selection.active.line, character: editor.selection.active.character }
    });
  });
}
