import * as vscode from 'vscode';
import { createUntitledMermaidDocument } from '../utils/editor';
import { parseMarkdownFences } from '../utils/markdown';
import { promptForMermaidSaveUri, writeAndOpenFile } from '../utils/files';
import { pickMarkdownMermaidBlock, requireActiveEditor } from './helpers';

export function registerExtractMermaidBlockCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.extractMermaidBlock', async () => {
    const editor = await requireActiveEditor();
    if (editor.document.languageId !== 'markdown') {
      throw new Error('This command works in Markdown files.');
    }

    const positionLine = editor.selection.active.line;
    const blocks = parseMarkdownFences(editor.document.getText()).filter((block) => block.isMermaid);
    if (!blocks.length) {
      throw new Error('No Mermaid blocks were found in this Markdown file.');
    }

    let block = blocks.find((candidate) => positionLine >= candidate.startLine && positionLine <= candidate.endLine);
    if (!block) {
      block = await pickMarkdownMermaidBlock(blocks);
    }
    if (!block) {
      return;
    }

    const destination = await vscode.window.showQuickPick(
      [
        { label: 'Create untitled .mmd file', action: 'untitled' as const },
        { label: 'Save to .mmd file…', action: 'save' as const }
      ],
      { placeHolder: 'How should the extracted Mermaid block be written?' }
    );

    if (!destination) {
      return;
    }

    if (destination.action === 'untitled') {
      await createUntitledMermaidDocument(block.content, vscode.workspace.getWorkspaceFolder(editor.document.uri));
      return;
    }

    const saveUri = await promptForMermaidSaveUri('extracted-diagram.mmd');
    if (!saveUri) {
      return;
    }
    await writeAndOpenFile(saveUri, block.content, 'mermaid');
  });
}
