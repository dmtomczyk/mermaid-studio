import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

let canvasOutputChannel: vscode.OutputChannel | undefined;

export function getCanvasOutputChannel(): vscode.OutputChannel {
  if (!canvasOutputChannel) {
    canvasOutputChannel = vscode.window.createOutputChannel('Mermaid Studio Canvas');
  }
  return canvasOutputChannel;
}

export function logCanvasHostEvent(kind: string, details?: unknown): void {
  const channel = getCanvasOutputChannel();
  const timestamp = new Date().toISOString();
  const suffix = details === undefined
    ? ''
    : ' ' + safeStringify(details);
  const line = `[${timestamp}] ${kind}${suffix}`;
  channel.appendLine(line);
  appendCanvasLogLine(line);
}

function appendCanvasLogLine(line: string): void {
  try {
    const filePath = getCanvasLogFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, line + '\n', 'utf8');
  } catch {
    // avoid crashing the extension over diagnostics logging
  }
}

function getCanvasLogFilePath(): string {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const root = workspaceFolder || process.cwd();
  return path.join(root, '.local-docs', 'logs', 'canvas-debug.log');
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
