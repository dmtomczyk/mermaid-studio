import * as path from 'path';
import * as vscode from 'vscode';

declare const __DEBUG__: boolean;
import {
  ClassDiagramCanvasModel,
  generateClassDiagramSource,
  normalizeClassDiagramModel,
  validateClassDiagramModel
} from './classDiagramModel';
import { createDiagramCanvasHtml } from './diagramCanvasHtml';
import { logCanvasHostEvent } from './canvasOutput';
import { runCanvasWebviewDiagnostics } from './canvasWebviewDiagnostics';
import { isCanvasFamilyImplemented } from './canvasFamilyDetection';
import {
  buildDiagramCanvasViewState,
  DiagramCanvasSource,
  getDiagramCanvasTitle,
  resolveInitialCanvasSource
} from './canvasState';
import {
  applyCanvasToDocument,
  createCanvasFile,
  openCanvasLinkedFile,
  openCanvasPreview,
  reimportCanvasFromDocument
} from './canvasDocumentActions';

export class DiagramCanvasPanel {
  public static current: DiagramCanvasPanel | undefined;

  public static async createOrShow(extensionUri: vscode.Uri): Promise<DiagramCanvasPanel | undefined> {
    const source = await resolveInitialCanvasSource();

    if (!isCanvasFamilyImplemented(source.source.kind)) {
      await vscode.window.showInformationMessage(`Diagram Canvas support for ${source.source.kind} is not wired yet. Host-side family detection is in place; runtime editing is next.`);
      return undefined;
    }

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
          case 'canvasDebug':
            logCanvasHostEvent(`webview:${message.kind || 'debug'}`, message.details);
            break;
          case 'canvasError':
            logCanvasHostEvent(`webview:error:${message.kind || 'runtime'}`, {
              message: message.message,
              source: message.source,
              lineno: message.lineno,
              colno: message.colno,
              stack: message.stack,
              details: message.details
            });
            break;
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
            await createCanvasFile(this.model);
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
    this.panel.title = getDiagramCanvasTitle(this.source);
    await this.pushState();
  }

  private async pushState(): Promise<void> {
    const issues = validateClassDiagramModel(this.model);
    this.panel.webview.postMessage(buildDiagramCanvasViewState(this.source, this.model, issues));
  }

  private async applyToDocument(): Promise<void> {
    this.source = await applyCanvasToDocument(this.source, this.model);
    await vscode.window.showInformationMessage('Applied Diagram Canvas Mermaid source to the linked Mermaid document.');
    await this.refresh();
  }

  private async reimportFromDocument(): Promise<void> {
    this.model = await reimportCanvasFromDocument(this.source);
    await this.refresh();
    await vscode.window.showInformationMessage('Re-imported class diagram source into the Diagram Canvas.');
  }

  private async openPreview(): Promise<void> {
    await openCanvasPreview(this.extensionUri, this.source, this.model);
  }

  private async openLinkedFile(): Promise<void> {
    await openCanvasLinkedFile(this.source);
  }

  private getHtml(): string {
    const html = createDiagramCanvasHtml({
      cspSource: this.panel.webview.cspSource,
      nonce: createNonce(),
      debugEnabled: __DEBUG__
    });

    const diagnostics = runCanvasWebviewDiagnostics(html, {
      debugEnabled: __DEBUG__,
      outputDir: path.join(process.cwd(), '.local-docs', 'logs')
    });

    if (!diagnostics.syntaxOk) {
      logCanvasHostEvent('webview:syntax-preflight:failed', {
        error: diagnostics.syntaxError,
        htmlPath: diagnostics.htmlPath,
        scriptPath: diagnostics.scriptPath
      });
    } else {
      logCanvasHostEvent('webview:syntax-preflight:passed', __DEBUG__
        ? {
            htmlPath: diagnostics.htmlPath,
            scriptPath: diagnostics.scriptPath
          }
        : undefined);
    }

    return html;
  }
}

function createNonce(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}
