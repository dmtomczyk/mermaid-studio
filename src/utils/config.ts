import * as vscode from 'vscode';

export interface MermaidBuilderConfig {
  markdownFenceLanguage: 'mermaidjs' | 'mermaid';
  insertMarkdownFencesByDefault: boolean;
  previewAutoRefresh: boolean;
  previewDebounceMs: number;
}

export function getConfig(): MermaidBuilderConfig {
  const config = vscode.workspace.getConfiguration('mermaidstudio');
  return {
    markdownFenceLanguage: config.get<'mermaidjs' | 'mermaid'>('markdownFenceLanguage', 'mermaid'),
    insertMarkdownFencesByDefault: config.get<boolean>('insertMarkdownFencesByDefault', true),
    previewAutoRefresh: config.get<boolean>('preview.autoRefresh', true),
    previewDebounceMs: config.get<number>('preview.debounceMs', 250)
  };
}
