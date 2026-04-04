import * as path from 'path';
import * as vscode from 'vscode';

export async function promptForMermaidSaveUri(defaultFileName = 'diagram.mmd'): Promise<vscode.Uri | undefined> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const defaultUri = workspaceFolder
    ? vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, defaultFileName))
    : undefined;

  const selected = await vscode.window.showSaveDialog({
    defaultUri,
    filters: {
      'Mermaid files': ['mmd', 'mermaid']
    },
    saveLabel: 'Save Mermaid File'
  });

  return selected ? ensureFileExtension(selected, '.mmd') : undefined;
}

export function ensureFileExtension(uri: vscode.Uri, preferredExtension: string): vscode.Uri {
  const normalizedExtension = preferredExtension.startsWith('.') ? preferredExtension : `.${preferredExtension}`;
  if (path.extname(uri.fsPath)) {
    return uri;
  }
  return uri.with({ path: `${uri.path}${normalizedExtension}` });
}

export async function promptForSvgSaveUri(defaultFileName = 'diagram.svg'): Promise<vscode.Uri | undefined> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const defaultUri = workspaceFolder
    ? vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, defaultFileName))
    : undefined;

  const selected = await vscode.window.showSaveDialog({
    defaultUri,
    filters: {
      SVG: ['svg']
    },
    saveLabel: 'Export SVG'
  });

  return selected ? ensureFileExtension(selected, '.svg') : undefined;
}

export async function promptForFolder(defaultFolderName = 'mermaid-exports'): Promise<vscode.Uri | undefined> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const defaultUri = workspaceFolder
    ? vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, defaultFolderName))
    : undefined;

  const selected = await vscode.window.showOpenDialog({
    defaultUri,
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Choose Export Folder'
  });

  return selected?.[0];
}

export function sanitizeFileStem(input: string, fallback = 'diagram'): string {
  const normalized = input
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  return normalized || fallback;
}

export async function writeAndOpenFile(uri: vscode.Uri, content: string, language?: string): Promise<vscode.TextEditor> {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
  const document = await vscode.workspace.openTextDocument(uri);
  return vscode.window.showTextDocument(language ? await vscode.languages.setTextDocumentLanguage(document, language) : document, {
    preview: false
  });
}
