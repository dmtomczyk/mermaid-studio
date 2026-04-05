import * as vscode from 'vscode';
import { DiagramCanvasPanel } from '../canvas/DiagramCanvasPanel';

export function registerOpenDiagramCanvasCommand(extensionUri: vscode.Uri): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.openDiagramCanvas', async () => {
    await DiagramCanvasPanel.createOrShow(extensionUri);
  });
}
