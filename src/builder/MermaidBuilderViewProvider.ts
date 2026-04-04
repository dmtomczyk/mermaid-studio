import * as vscode from 'vscode';
import { parseMermaidToBuilderState } from './parser';
import { renderBuilderShell } from './renderBuilderShell';
import { BuilderEditorStatus } from '../webview/builder/types';
import { createUntitledMermaidDocument, getEditorContext, getMermaidBlockContainingCursor, getNearestMarkdownMermaidBlock, insertMermaidText } from '../utils/editor';

export class MermaidBuilderViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'mermaidStudio.builderView';

  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'media'),
        vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview')
      ]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      try {
        switch (message.type) {
          case 'insert': {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
              throw new Error('Open a Mermaid or Markdown editor before inserting.');
            }
            const mermaid = String(message.mermaid ?? '').trim();
            if (!mermaid) {
              throw new Error('There is no Mermaid text to insert.');
            }
            await insertMermaidText(editor, mermaid, {
              replaceCurrentMarkdownMermaidBlock: true,
              wrapMarkdown: true
            });
            await this.postEditorStatus();
            break;
          }
          case 'createFile': {
            const mermaid = String(message.mermaid ?? '').trim();
            if (!mermaid) {
              throw new Error('There is no Mermaid text to write to a file.');
            }
            await createUntitledMermaidDocument(mermaid, vscode.workspace.workspaceFolders?.[0]);
            await this.postEditorStatus();
            break;
          }
          case 'copy': {
            await vscode.env.clipboard.writeText(String(message.mermaid ?? ''));
            vscode.window.showInformationMessage('Copied Mermaid source to the clipboard.');
            break;
          }
          case 'openPreview': {
            await vscode.commands.executeCommand('mermaidstudio.openPreview');
            break;
          }
          case 'requestEditorStatus': {
            await this.postEditorStatus();
            break;
          }
          case 'importActiveDocument': {
            await this.importFromActiveEditor();
            break;
          }
          case 'showError': {
            vscode.window.showErrorMessage(String(message.message ?? 'Mermaid Studio error'));
            break;
          }
          default:
            break;
        }
      } catch (error) {
        vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
      }
    });

    void this.postEditorStatus();
  }

  public notifyEditorContextChanged(): void {
    void this.postEditorStatus();
  }

  private async importFromActiveEditor(): Promise<void> {
    if (!this.view) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error('Open a Mermaid or Markdown file to import into the builder.');
    }

    const context = getEditorContext(editor);
    let source = '';
    let detail = '';

    if (context.kind === 'mermaid') {
      source = editor.document.getText();
      detail = `Imported Mermaid from ${basename(editor.document.fileName) || 'untitled file'}.`;
    } else if (context.kind === 'markdown') {
      const block = getMermaidBlockContainingCursor(editor) ?? getNearestMarkdownMermaidBlock(editor);
      if (!block) {
        throw new Error('No Mermaid block found in the active Markdown document.');
      }
      source = block.content;
      detail = `Imported Mermaid block from ${basename(editor.document.fileName) || 'Markdown file'} (lines ${block.startLine + 1}-${block.endLine + 1}).`;
    } else {
      throw new Error('Open a Mermaid or Markdown file to import into the builder.');
    }

    const result = parseMermaidToBuilderState(source);
    this.view.webview.postMessage({
      type: 'loadDiagramState',
      state: result.state,
      info: detail,
      warnings: result.warnings
    });
    await this.postEditorStatus();
  }

  private async postEditorStatus(): Promise<void> {
    if (!this.view) {
      return;
    }
    this.view.webview.postMessage({
      type: 'editorStatus',
      status: this.describeActiveEditor()
    });
  }

  private describeActiveEditor(): BuilderEditorStatus {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return {
        kind: 'none',
        summary: 'No active editor',
        detail: 'Open a Mermaid or Markdown file to insert generated diagrams.',
        canInsert: false
      };
    }

    const context = getEditorContext(editor);
    const fileName = basename(editor.document.fileName) || 'Untitled';

    if (context.kind === 'mermaid') {
      return {
        kind: 'mermaid',
        fileName,
        summary: `Target: Mermaid file · ${fileName}`,
        detail: 'Insert will write raw Mermaid at the current selection.',
        canInsert: true
      };
    }

    if (context.kind === 'markdown') {
      if (context.containingFence && !context.mermaidFence) {
        return {
          kind: 'markdown',
          fileName,
          summary: `Target: Markdown file · ${fileName}`,
          detail: 'Cursor is inside a non-Mermaid code fence. Move the cursor to insert or replace Mermaid safely.',
          canInsert: false
        };
      }

      if (context.mermaidFence) {
        return {
          kind: 'markdown',
          fileName,
          summary: `Target: Mermaid block in Markdown · ${fileName}`,
          detail: 'Insert will replace the current Mermaid block content without nesting fences.',
          canInsert: true
        };
      }

      return {
        kind: 'markdown',
        fileName,
        summary: `Target: Markdown file · ${fileName}`,
        detail: 'Insert will add a fenced Mermaid block at the cursor.',
        canInsert: true
      };
    }

    return {
      kind: 'other',
      fileName,
      summary: `Target: Unsupported editor · ${fileName}`,
      detail: 'Open a Mermaid or Markdown file to insert generated diagrams.',
      canInsert: false
    };
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = createNonce();
    const mermaidScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'vendor', 'mermaid.min.js')
    );
    const builderScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview', 'builder.js'));

    return renderBuilderShell({
      mermaidScriptSrc: mermaidScriptUri.toString(),
      builderScriptSrc: builderScriptUri.toString(),
      cspSource: webview.cspSource,
      nonce,
      hostKind: 'vscode-webview'
    });
  }
}

function createNonce(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function basename(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}
