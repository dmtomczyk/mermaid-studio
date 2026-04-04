import * as vscode from 'vscode';
import { getReferenceExampleRelativePath, getReferenceUrlForTopic } from '../registry/exampleRegistry';
import { getCurrentDiagramReferenceTarget, getReferenceTargetAtPosition } from '../language/referenceSupport';
import { requireActiveEditor } from './helpers';

export function registerOpenReferenceForSymbolCommand(extensionUri: vscode.Uri): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.openReferenceForSymbol', async () => {
    const editor = await requireActiveEditor();
    const position = editor.selection.active;
    const target = getReferenceTargetAtPosition(editor.document, position) ?? getCurrentDiagramReferenceTarget(editor.document, position);

    if (!target) {
      throw new Error('No Mermaid reference target found at the current cursor position.');
    }

    const action = await vscode.window.showQuickPick(
      [
        { label: `Open local example for ${target.topic}`, action: 'local' as const },
        { label: `Open Mermaid docs for ${target.topic}`, action: 'web' as const }
      ],
      { placeHolder: `Reference for ${target.token}` }
    );

    if (!action) {
      return;
    }

    if (action.action === 'local') {
      const relativePath = getReferenceExampleRelativePath(target.topic);
      const uri = vscode.Uri.joinPath(extensionUri, ...relativePath.split('/'));
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document, { preview: false });
      return;
    }

    await vscode.env.openExternal(vscode.Uri.parse(getReferenceUrlForTopic(target.topic)));
  });
}
