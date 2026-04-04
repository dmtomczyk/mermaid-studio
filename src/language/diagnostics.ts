import * as vscode from 'vscode';

export class MermaidDiagnostics {
  private readonly collection: vscode.DiagnosticCollection;

  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection('mermaidstudio');
  }

  dispose(): void {
    this.collection.dispose();
  }

  clear(uri?: vscode.Uri): void {
    if (uri) {
      this.collection.delete(uri);
      return;
    }
    this.collection.clear();
  }

  set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
    this.collection.set(uri, diagnostics);
  }

  setSingleError(uri: vscode.Uri, range: vscode.Range, message: string): void {
    this.collection.set(uri, [new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error)]);
  }
}
