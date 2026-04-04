import * as vscode from 'vscode';
import { getReferenceExampleRelativePath } from '../registry/exampleRegistry';
import { getReferenceTargetAtPosition } from './referenceSupport';

export class MermaidReferenceDefinitionProvider implements vscode.DefinitionProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Definition | undefined> {
    const target = getReferenceTargetAtPosition(document, position);
    if (!target) {
      return undefined;
    }

    const relativePath = getReferenceExampleRelativePath(target.topic);
    const uri = vscode.Uri.joinPath(this.extensionUri, ...relativePath.split('/'));
    return new vscode.Location(uri, new vscode.Position(0, 0));
  }
}
