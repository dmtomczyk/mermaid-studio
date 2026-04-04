import * as vscode from 'vscode';
import { getReferenceExampleRelativePath } from '../registry/exampleRegistry';
import { getCurrentDiagramReferenceTarget } from '../language/referenceSupport';
import { requireActiveEditor } from './helpers';

export function registerOpenCurrentDiagramExampleCommand(extensionUri: vscode.Uri): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.openCurrentDiagramExample', async () => {
    const editor = await requireActiveEditor();
    const target = getCurrentDiagramReferenceTarget(editor.document, editor.selection.active);

    if (!target) {
      throw new Error('Could not determine the current Mermaid diagram type at the cursor.');
    }

    const relativePath = getReferenceExampleRelativePath(target.topic);
    const uri = vscode.Uri.joinPath(extensionUri, ...relativePath.split('/'));
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, { preview: false });
  });
}
