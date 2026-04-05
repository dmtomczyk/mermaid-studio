import * as path from 'path';
import * as vscode from 'vscode';

declare const __DEBUG__: boolean;
import {
  ClassDiagramCanvasModel,
  ClassDiagramValidationIssue,
  createEmptyClassDiagramModel,
  generateClassDiagramSource,
  looksLikeClassDiagram,
  normalizeClassDiagramModel,
  parseClassDiagramToModel,
  validateClassDiagramModel
} from './classDiagramModel';
import { createUntitledMermaidDocument, getEditorContext, insertMermaidText } from '../utils/editor';
import { MermaidPreviewPanel } from '../preview/MermaidPreviewPanel';
import { createDiagramCanvasHtml } from './diagramCanvasHtml';

interface DiagramCanvasSource {
  documentUri?: vscode.Uri;
  kind: 'classDiagram';
}

export class DiagramCanvasPanel {
  public static current: DiagramCanvasPanel | undefined;

  public static async createOrShow(extensionUri: vscode.Uri): Promise<DiagramCanvasPanel> {
    const source = await resolveInitialCanvasSource();

    if (DiagramCanvasPanel.current) {
      DiagramCanvasPanel.current.source = source.source;
      DiagramCanvasPanel.current.model = source.model;
      DiagramCanvasPanel.current.panel.reveal(vscode.ViewColumn.Active);
      await DiagramCanvasPanel.current.refresh();
      return DiagramCanvasPanel.current;
    }

    const panel = vscode.window.createWebviewPanel(
      'mermaidStudioDiagramCanvas',
      'Mermaid Diagram Canvas',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    DiagramCanvasPanel.current = new DiagramCanvasPanel(extensionUri, panel, source.source, source.model);
    await DiagramCanvasPanel.current.refresh();
    return DiagramCanvasPanel.current;
  }

  private constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly panel: vscode.WebviewPanel,
    private source: DiagramCanvasSource,
    private model: ClassDiagramCanvasModel
  ) {
    this.panel.webview.html = this.getHtml();

    this.panel.onDidDispose(() => {
      DiagramCanvasPanel.current = undefined;
    });

    this.panel.webview.onDidReceiveMessage(async (message) => {
      try {
        switch (message?.type) {
          case 'requestState':
            await this.pushState();
            break;
          case 'stateChanged':
            this.model = normalizeClassDiagramModel(message.model);
            await this.pushState();
            break;
          case 'applyToDocument':
            this.model = normalizeClassDiagramModel(message.model);
            await this.applyToDocument();
            break;
          case 'createFile':
            this.model = normalizeClassDiagramModel(message.model);
            await createUntitledMermaidDocument(generateClassDiagramSource(this.model));
            await vscode.window.showInformationMessage('Created a new Mermaid file from the Diagram Canvas.');
            break;
          case 'copyMermaid':
            this.model = normalizeClassDiagramModel(message.model);
            await vscode.env.clipboard.writeText(generateClassDiagramSource(this.model));
            await vscode.window.showInformationMessage('Copied Mermaid source from the Diagram Canvas.');
            break;
          case 'reimportFromDocument':
            await this.reimportFromDocument();
            break;
          case 'openPreview':
            await this.openPreview();
            break;
          case 'openLinkedFile':
            await this.openLinkedFile();
            break;
        }
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        await vscode.window.showErrorMessage(messageText);
      }
    });
  }

  private async refresh(): Promise<void> {
    this.panel.title = this.source.documentUri
      ? `Diagram Canvas: ${path.basename(this.source.documentUri.fsPath)}`
      : 'Diagram Canvas: classDiagram';

    await this.pushState();
  }

  private async pushState(): Promise<void> {
    const issues = validateClassDiagramModel(this.model);
    const linkedFileLabel = this.source.documentUri
      ? path.basename(this.source.documentUri.fsPath)
      : 'Untitled canvas';
    const linkedFileKind = this.source.documentUri
      ? path.extname(this.source.documentUri.fsPath).toLowerCase() === '.md'
        ? 'markdown'
        : 'mermaid'
      : 'ephemeral';
    this.panel.webview.postMessage({
      type: 'setState',
      sourceLabel: linkedFileLabel,
      linkedFileLabel,
      linkedFileKind,
      model: this.model,
      mermaid: generateClassDiagramSource(this.model),
      canReimport: Boolean(this.source.documentUri),
      canOpenLinkedFile: Boolean(this.source.documentUri),
      canApply: !issues.some((issue) => issue.level === 'error'),
      issues
    });
  }

  private async applyToDocument(): Promise<void> {
    const issues = validateClassDiagramModel(this.model).filter((issue) => issue.level === 'error');
    if (issues.length) {
      throw new Error(`Fix ${issues.length} validation error${issues.length === 1 ? '' : 's'} before applying the canvas.`);
    }

    const mermaid = generateClassDiagramSource(this.model);
    const targetEditor = await this.resolveTargetEditorForApply(mermaid);
    const context = getEditorContext(targetEditor);

    if (context.kind === 'mermaid') {
      const fullRange = new vscode.Range(
        targetEditor.document.positionAt(0),
        targetEditor.document.positionAt(targetEditor.document.getText().length)
      );
      await targetEditor.edit((editBuilder) => editBuilder.replace(fullRange, mermaid));
    } else {
      await insertMermaidText(targetEditor, mermaid, {
        replaceCurrentMarkdownMermaidBlock: true,
        wrapMarkdown: true
      });
    }

    this.source = {
      kind: 'classDiagram',
      documentUri: targetEditor.document.uri
    };

    await vscode.window.showInformationMessage('Applied Diagram Canvas Mermaid source to the linked Mermaid document.');
    await this.refresh();
  }

  private async reimportFromDocument(): Promise<void> {
    if (!this.source.documentUri) {
      throw new Error('This canvas was not opened from a Mermaid document.');
    }

    const document = await vscode.workspace.openTextDocument(this.source.documentUri);
    const text = document.getText();
    if (!looksLikeClassDiagram(text)) {
      throw new Error('The linked document is no longer a supported classDiagram source.');
    }

    this.model = parseClassDiagramToModel(text);
    await this.refresh();
    await vscode.window.showInformationMessage('Re-imported class diagram source into the Diagram Canvas.');
  }

  private async openPreview(): Promise<void> {
    if (this.source.documentUri) {
      const document = await vscode.workspace.openTextDocument(this.source.documentUri);
      await vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });
      await vscode.commands.executeCommand('mermaidstudio.openPreview');
      return;
    }

    const linkedLabel = 'Diagram Canvas';
    await MermaidPreviewPanel.createOrShow(this.extensionUri, undefined, {
      mode: 'virtual',
      key: 'diagram-canvas-preview',
      title: `Mermaid Preview: ${linkedLabel}`,
      mermaid: generateClassDiagramSource(this.model)
    });
  }

  private async openLinkedFile(): Promise<void> {
    if (!this.source.documentUri) {
      throw new Error('This canvas is not currently linked to a file.');
    }
    const document = await vscode.workspace.openTextDocument(this.source.documentUri);
    await vscode.window.showTextDocument(document, { preview: false });
  }

  private async resolveTargetEditorForApply(mermaid: string): Promise<vscode.TextEditor> {
    if (this.source.documentUri) {
      const document = await vscode.workspace.openTextDocument(this.source.documentUri);
      return vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });
    }

    const targetUri = await vscode.window.showSaveDialog({
      saveLabel: 'Save Mermaid Diagram',
      filters: {
        'Mermaid Files': ['mmd'],
        'Markdown Files': ['md']
      },
      defaultUri: vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 'diagram.mmd'))
    });

    if (!targetUri) {
      throw new Error('Save cancelled.');
    }

    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(mermaid, 'utf8'));
    const document = await vscode.workspace.openTextDocument(targetUri);
    return vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });
  }

  private getHtml(): string {
    return createDiagramCanvasHtml({
      cspSource: this.panel.webview.cspSource,
      nonce: createNonce(),
      debugEnabled: __DEBUG__
    });
  }
}

async function resolveInitialCanvasSource(): Promise<{ source: DiagramCanvasSource; model: ClassDiagramCanvasModel }> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return {
      source: { kind: 'classDiagram' },
      model: createEmptyClassDiagramModel()
    };
  }

  const text = editor.document.getText();
  if (looksLikeClassDiagram(text)) {
    return {
      source: {
        kind: 'classDiagram',
        documentUri: editor.document.uri
      },
      model: parseClassDiagramToModel(text)
    };
  }

  return {
    source: { kind: 'classDiagram' },
    model: createEmptyClassDiagramModel()
  };
}

function createNonce(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}
