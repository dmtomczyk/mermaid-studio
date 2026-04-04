import * as vscode from 'vscode';
import { MermaidBuilderViewProvider } from '../builder/MermaidBuilderViewProvider';
import { MermaidDiagnostics } from '../language/diagnostics';

export interface CommandContext {
  extensionUri: vscode.Uri;
  diagnostics: MermaidDiagnostics;
  builderProvider: MermaidBuilderViewProvider;
}
