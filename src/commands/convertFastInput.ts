import * as vscode from 'vscode';
import { transpileShorthand, ShorthandParseError } from '../shorthand';
import { createUntitledMermaidDocument, getEditorContext, insertMermaidText } from '../utils/editor';
import { CommandContext } from './types';
import { requireActiveEditor } from './helpers';

export function registerConvertFastInputCommand(commandContext: CommandContext): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.convertFastInput', async () => {
    const editor = await requireActiveEditor();
    const selectionText = editor.document.getText(editor.selection).trim();
    const source = selectionText || await promptForShorthand();
    if (!source) {
      return;
    }

    try {
      const result = transpileShorthand(source);
      commandContext.diagnostics.clear(editor.document.uri);

      const action = await vscode.window.showQuickPick(
        [
          { label: 'Replace selection', action: 'replace' as const },
          { label: 'Insert at cursor', action: 'insert' as const },
          { label: 'Create new Mermaid file', action: 'file' as const }
        ],
        { placeHolder: 'How should the converted Mermaid be applied?' }
      );

      if (!action) {
        return;
      }

      if (action.action === 'file') {
        await createUntitledMermaidDocument(result.mermaid, vscode.workspace.getWorkspaceFolder(editor.document.uri));
        return;
      }

      const editorContext = getEditorContext(editor);
      await insertMermaidText(editor, result.mermaid, {
        replaceCurrentMarkdownMermaidBlock:
          action.action === 'replace' && editorContext.kind === 'markdown' && Boolean(editorContext.mermaidFence),
        wrapMarkdown: editorContext.kind === 'markdown'
      });
    } catch (error) {
      if (error instanceof ShorthandParseError) {
        const lineIndex = Math.max(0, error.line - 1);
        const line = editor.document.lineAt(Math.min(lineIndex, editor.document.lineCount - 1));
        commandContext.diagnostics.setSingleError(editor.document.uri, line.range, error.message);
        vscode.window.showErrorMessage(error.message);
        return;
      }
      throw error;
    }
  });
}

async function promptForShorthand(): Promise<string | undefined> {
  const input = await vscode.window.showInputBox({
    prompt: 'Paste shorthand input. Use \\n in the prompt for new lines if needed.',
    placeHolder: 'flow TD\\nClient -> API -> DB'
  });
  return input?.replace(/\\n/g, '\n');
}
