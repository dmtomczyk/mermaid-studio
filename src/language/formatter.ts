import * as vscode from 'vscode';

export function formatMermaidText(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let indentLevel = 0;
  const formatted: string[] = [];

  for (const originalLine of lines) {
    const trimmedRight = originalLine.replace(/[ \t]+$/g, '');
    const trimmed = trimmedRight.trim();

    if (!trimmed) {
      if (formatted[formatted.length - 1] !== '') {
        formatted.push('');
      }
      continue;
    }

    const lower = trimmed.toLowerCase();
    if (lower === 'end') {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indent = '    '.repeat(indentLevel);
    formatted.push(`${indent}${trimmed}`);

    if (lower.startsWith('subgraph ')) {
      indentLevel += 1;
    }
  }

  while (formatted.length > 0 && formatted[formatted.length - 1] === '') {
    formatted.pop();
  }

  return `${formatted.join('\n')}\n`;
}

export class MermaidFormattingProvider implements vscode.DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
    return [vscode.TextEdit.replace(fullRange, formatMermaidText(document.getText()))];
  }
}
