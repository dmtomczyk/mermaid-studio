import * as vscode from 'vscode';
import { getReferenceExampleRelativePath } from '../registry/exampleRegistry';

export function registerOpenReferenceExampleCommand(extensionUri: vscode.Uri): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.openReferenceExample', async (topic?: string) => {
    const relativePath = getReferenceExampleRelativePath(topic);
    const uri = vscode.Uri.joinPath(extensionUri, ...relativePath.split('/'));
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, { preview: false });
  });
}
