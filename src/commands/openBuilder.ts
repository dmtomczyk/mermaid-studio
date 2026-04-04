import * as vscode from 'vscode';

export function registerOpenBuilderCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.openBuilder', async () => {
    await vscode.commands.executeCommand('workbench.view.extension.mermaidStudio');
  });
}
