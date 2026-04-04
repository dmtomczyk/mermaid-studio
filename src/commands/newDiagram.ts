import * as vscode from 'vscode';
import { pickTemplate, requireActiveEditor } from './helpers';
import { createUntitledMermaidDocument, getEditorContext, insertMermaidText } from '../utils/editor';

export function registerNewDiagramCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.newDiagram', async () => {
    const editor = await requireActiveEditor();
    const template = await pickTemplate('Choose a Mermaid diagram starter');
    if (!template) {
      return;
    }

    const editorContext = getEditorContext(editor);
    if (editorContext.kind === 'markdown') {
      const action = await vscode.window.showQuickPick(
        [
          { label: 'Insert Mermaid block here', action: 'insert' as const },
          { label: 'Create new Mermaid file', action: 'file' as const }
        ],
        { placeHolder: 'How should Mermaid Studio create the diagram?' }
      );

      if (!action) {
        return;
      }

      if (action.action === 'insert') {
        await insertMermaidText(editor, template.mermaid, { wrapMarkdown: true });
        return;
      }

      await createUntitledMermaidDocument(template.mermaid, vscode.workspace.getWorkspaceFolder(editor.document.uri));
      return;
    }

    if (editorContext.kind === 'mermaid') {
      await insertMermaidText(editor, template.mermaid);
      return;
    }

    await createUntitledMermaidDocument(template.mermaid, vscode.workspace.workspaceFolders?.[0]);
  });
}
