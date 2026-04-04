import * as vscode from 'vscode';
import { formatMermaidText } from '../language/formatter';
import { getEditorContext, getMermaidBlockContainingCursor, getFenceContentRange } from '../utils/editor';
import { requireActiveEditor } from './helpers';

export function registerFormatMermaidDocumentCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.formatMermaidDocument', async () => {
    const editor = await requireActiveEditor();
    const context = getEditorContext(editor);

    if (context.kind === 'mermaid') {
      const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
      await editor.edit((editBuilder) => editBuilder.replace(fullRange, formatMermaidText(editor.document.getText())));
      return;
    }

    if (context.kind === 'markdown') {
      const block = getMermaidBlockContainingCursor(editor);
      if (!block) {
        throw new Error('Place the cursor inside a Mermaid block in Markdown to format it.');
      }
      const range = getFenceContentRange(editor.document, block);
      await editor.edit((editBuilder) => editBuilder.replace(range, formatMermaidText(block.content)));
      return;
    }

    throw new Error('Open a Mermaid or Markdown file first.');
  });
}
