import * as path from 'path';
import * as vscode from 'vscode';
import { MermaidDiagnostics } from '../language/diagnostics';
import { offsetAt } from '../utils/markdown';
import { PreviewBlock } from './blocks';
import {
  buildMarkdownPreviewModel,
  buildMermaidPreviewModel
} from './documentModel';
import {
  createFallbackPreviewRenderState,
  normalizePreviewRenderState,
  PreviewRenderState
} from './renderState';

interface PreviewSource {
  documentUri: vscode.Uri;
  kind: 'mermaid' | 'markdown';
  markdownMode?: 'nearest' | 'containing';
  anchorPosition: { line: number; character: number };
}

export class MermaidPreviewPanel {
  public static current: MermaidPreviewPanel | undefined;

  public static async createOrShow(
    extensionUri: vscode.Uri,
    diagnostics: MermaidDiagnostics,
    source: PreviewSource
  ): Promise<MermaidPreviewPanel> {
    if (MermaidPreviewPanel.current) {
      MermaidPreviewPanel.current.source = source;
      MermaidPreviewPanel.current.panel.reveal(vscode.ViewColumn.Beside);
      await MermaidPreviewPanel.current.refresh();
      return MermaidPreviewPanel.current;
    }

    const panel = vscode.window.createWebviewPanel('mermaidStudioPreview', 'Mermaid Preview', vscode.ViewColumn.Beside, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extensionUri, 'media')
      ]
    });

    MermaidPreviewPanel.current = new MermaidPreviewPanel(extensionUri, panel, diagnostics, source);
    await MermaidPreviewPanel.current.refresh();
    return MermaidPreviewPanel.current;
  }

  private currentRange: vscode.Range | undefined;
  private lastSvg = '';
  private pendingSvgResolvers: Array<(svg: string | undefined) => void> = [];
  private pendingRenderStateResolvers: Array<(state: PreviewRenderState) => void> = [];

  private constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly panel: vscode.WebviewPanel,
    private readonly diagnostics: MermaidDiagnostics,
    private source: PreviewSource
  ) {
    this.panel.webview.html = this.getHtml();

    this.panel.onDidDispose(() => {
      MermaidPreviewPanel.current = undefined;
      this.diagnostics.clear();
    });

    this.panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'renderSuccess') {
        this.lastSvg = message.svg ?? '';
        this.diagnostics.clear(this.source.documentUri);
      }

      if (message.type === 'renderError') {
        const range = this.currentRange ?? new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
        this.diagnostics.setSingleError(this.source.documentUri, range, String(message.message ?? 'Mermaid render failed.'));
      }

      if (message.type === 'activeSvgResponse') {
        const svg = typeof message.svg === 'string' && message.svg.length > 0 ? message.svg : undefined;
        while (this.pendingSvgResolvers.length) {
          this.pendingSvgResolvers.shift()?.(svg);
        }
      }

      if (message.type === 'renderStateResponse') {
        const renderState = normalizePreviewRenderState(message);
        while (this.pendingRenderStateResolvers.length) {
          this.pendingRenderStateResolvers.shift()?.(renderState);
        }
      }
    });
  }

  exportSvg(): string | undefined {
    return this.lastSvg || undefined;
  }

  async requestCurrentSvg(timeoutMs = 1500): Promise<string | undefined> {
    const state = await this.requestRenderState(timeoutMs);
    return state.activeSvg ?? this.lastSvg ?? undefined;
  }

  async requestRenderState(timeoutMs = 1500): Promise<PreviewRenderState> {
    return new Promise<PreviewRenderState>((resolve) => {
      const timeout = setTimeout(() => {
        this.pendingRenderStateResolvers = this.pendingRenderStateResolvers.filter((entry) => entry !== resolver);
        resolve(createFallbackPreviewRenderState(this.lastSvg));
      }, timeoutMs);

      const resolver = (state: PreviewRenderState) => {
        clearTimeout(timeout);
        resolve(state);
      };

      this.pendingRenderStateResolvers.push(resolver);
      this.panel.webview.postMessage({ type: 'requestRenderState' });
    });
  }

  updateSelection(editor: vscode.TextEditor): void {
    if (editor.document.uri.toString() !== this.source.documentUri.toString()) {
      return;
    }

    this.source = {
      ...this.source,
      anchorPosition: { line: editor.selection.active.line, character: editor.selection.active.character }
    };
  }

  async handleDocumentChanged(document: vscode.TextDocument): Promise<void> {
    if (document.uri.toString() !== this.source.documentUri.toString()) {
      return;
    }
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const document = await vscode.workspace.openTextDocument(this.source.documentUri);
    this.panel.title = document.fileName ? `Mermaid Preview: ${path.basename(document.fileName)}` : 'Mermaid Preview';

    const text = document.getText();

    if (this.source.kind === 'mermaid') {
      const model = buildMermaidPreviewModel(text, path.basename(document.fileName), this.source.anchorPosition.line);
      if (!model) {
        this.currentRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
        this.panel.webview.postMessage({
          type: 'empty',
          message: 'No Mermaid diagram content found in this file.'
        });
        this.diagnostics.clear(this.source.documentUri);
        return;
      }

      this.currentRange = getBlockRange(document, text, model.blocks[model.activeIndex] ?? model.blocks[0]);
      this.panel.webview.postMessage({
        type: 'renderBlocks',
        blocks: model.blocks,
        activeIndex: model.activeIndex,
        title: model.title
      });
      return;
    }

    const model = buildMarkdownPreviewModel(
      text,
      path.basename(document.fileName),
      this.source.anchorPosition,
      this.source.markdownMode === 'containing' ? 'containing' : 'nearest'
    );

    if (!model) {
      this.currentRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
      this.panel.webview.postMessage({
        type: 'empty',
        message: 'No Mermaid block found in this Markdown document.'
      });
      this.diagnostics.clear(this.source.documentUri);
      return;
    }

    this.currentRange = getBlockRange(document, text, model.blocks[model.activeIndex] ?? model.blocks[0]);

    this.panel.webview.postMessage({
      type: 'renderBlocks',
      blocks: model.blocks,
      activeIndex: model.activeIndex,
      title: model.title
    });
  }

  private getHtml(): string {
    const nonce = createNonce();
    const mermaidScriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'vendor', 'mermaid.min.js')
    );

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${this.panel.webview.cspSource} data:; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${this.panel.webview.cspSource};" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: var(--vscode-font-family); padding: 0; margin: 0; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
      header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--vscode-panel-border); }
      #title { font-weight: 600; }
      #status { color: var(--vscode-descriptionForeground); font-size: 12px; }
      #error { display: none; color: var(--vscode-errorForeground); background: color-mix(in srgb, var(--vscode-errorForeground) 10%, transparent); padding: 10px 16px; }
      #canvas { padding: 16px; overflow: auto; display: grid; gap: 16px; }
      .hint { padding: 24px 16px; color: var(--vscode-descriptionForeground); }
      .card { border: 1px solid var(--vscode-panel-border); border-radius: 10px; overflow: hidden; background: var(--vscode-editor-background); }
      .card.active { border-color: var(--vscode-focusBorder); box-shadow: inset 0 0 0 1px var(--vscode-focusBorder); }
      .card-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--vscode-panel-border); }
      .card-title { font-weight: 600; }
      .card-subtitle { color: var(--vscode-descriptionForeground); font-size: 12px; }
      .card-body { padding: 12px; overflow: auto; background: #ffffff; }
      svg { max-width: 100%; height: auto; display: block; background: #ffffff; }
      pre { white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <header>
      <div id="title">Mermaid Preview</div>
      <div id="status">Waiting for diagram…</div>
    </header>
    <div id="error"></div>
    <div id="canvas"><div class="hint">Open a Mermaid or Markdown file to preview a diagram.</div></div>
    <script nonce="${nonce}" src="${mermaidScriptUri}"></script>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        flowchart: { htmlLabels: false, useMaxWidth: true },
        fontFamily: 'Arial, Helvetica, sans-serif',
        themeVariables: {
          background: '#ffffff',
          primaryColor: '#ffffff',
          primaryTextColor: '#111827',
          primaryBorderColor: '#1f2937',
          lineColor: '#1f2937',
          textColor: '#111827',
          mainBkg: '#ffffff',
          secondaryColor: '#f3f4f6',
          tertiaryColor: '#f9fafb',
          clusterBkg: '#ffffff',
          clusterBorder: '#9ca3af',
          edgeLabelBackground: '#ffffff',
          actorBkg: '#ffffff',
          actorBorder: '#1f2937',
          actorTextColor: '#111827',
          noteBkgColor: '#fff7cc',
          noteBorderColor: '#d4b106',
          noteTextColor: '#111827',
          sequenceNumberColor: '#111827',
          signalColor: '#1f2937',
          labelBoxBkgColor: '#ffffff',
          labelBoxBorderColor: '#1f2937',
          labelTextColor: '#111827'
        }
      });
      const title = document.getElementById('title');
      const status = document.getElementById('status');
      const error = document.getElementById('error');
      const canvas = document.getElementById('canvas');
      let activeSvg = '';
      let activeIndex = 0;
      let renderedEntries = [];

      async function renderBlocks(blocks, nextActiveIndex, renderTitle) {
        title.textContent = renderTitle || 'Mermaid Preview';
        status.textContent = 'Rendering…';
        error.style.display = 'none';
        error.textContent = '';
        canvas.innerHTML = '';
        activeIndex = typeof nextActiveIndex === 'number' ? nextActiveIndex : 0;

        if (!blocks || !blocks.length) {
          renderedEntries = [];
          activeSvg = '';
          canvas.innerHTML = '<div class="hint">No Mermaid content to render.</div>';
          status.textContent = 'No content';
          return;
        }

        const rendered = [];
        for (let index = 0; index < blocks.length; index += 1) {
          const block = blocks[index];
          try {
            const id = 'mermaid-' + Date.now() + '-' + index;
            const result = await mermaid.render(id, block.mermaid);
            rendered.push({ ok: true, svg: result.svg, block, index });
          } catch (renderError) {
            const message = renderError instanceof Error ? renderError.message : String(renderError);
            rendered.push({ ok: false, message, block, index, source: block.mermaid });
          }
        }

        renderedEntries = rendered.filter((entry) => entry.ok).map((entry) => ({ title: entry.block.title, svg: entry.svg }));

        rendered.forEach((entry) => {
          const card = document.createElement('section');
          card.className = 'card' + (entry.index === activeIndex ? ' active' : '');
          const header = document.createElement('div');
          header.className = 'card-header';
          header.innerHTML = '<div class="card-title"></div><div class="card-subtitle"></div>';
          header.querySelector('.card-title').textContent = entry.block.title;
          header.querySelector('.card-subtitle').textContent = entry.ok ? 'Rendered' : 'Render error';
          const body = document.createElement('div');
          body.className = 'card-body';
          if (entry.ok) {
            body.innerHTML = entry.svg;
          } else {
            body.innerHTML = '<pre></pre>';
            body.querySelector('pre').textContent = entry.source;
          }
          card.appendChild(header);
          card.appendChild(body);
          card.addEventListener('click', () => {
            activeIndex = entry.index;
            activeSvg = entry.ok ? entry.svg : '';
            renderSelectionState();
            if (entry.ok) {
              vscode.postMessage({ type: 'renderSuccess', svg: entry.svg });
            }
          });
          canvas.appendChild(card);
        });

        const activeEntry = rendered[activeIndex] || rendered[0];
        renderSelectionState();
        if (activeEntry && activeEntry.ok) {
          activeSvg = activeEntry.svg;
          status.textContent = rendered.filter((entry) => entry.ok).length + '/' + rendered.length + ' diagram' + (rendered.length === 1 ? '' : 's') + ' rendered';
          vscode.postMessage({ type: 'renderSuccess', svg: activeEntry.svg });
        } else {
          activeSvg = '';
          status.textContent = 'Render error';
          const firstError = rendered.find((entry) => !entry.ok);
          error.textContent = firstError?.message ?? 'Mermaid render failed.';
          error.style.display = 'block';
          vscode.postMessage({ type: 'renderError', message: firstError?.message ?? 'Mermaid render failed.' });
        }
      }

      function renderSelectionState() {
        Array.from(canvas.querySelectorAll('.card')).forEach((card, index) => {
          card.classList.toggle('active', index === activeIndex);
        });
      }

      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'renderBlocks') {
          renderBlocks(message.blocks, message.activeIndex, message.title);
        }
        if (message.type === 'empty') {
          title.textContent = 'Mermaid Preview';
          status.textContent = 'No Mermaid block';
          error.style.display = 'none';
          canvas.innerHTML = '<div class="hint">' + message.message + '</div>';
        }
        if (message.type === 'requestActiveSvg') {
          vscode.postMessage({ type: 'activeSvgResponse', svg: activeSvg || '' });
        }
        if (message.type === 'requestRenderState') {
          vscode.postMessage({ type: 'renderStateResponse', activeSvg: activeSvg || '', entries: renderedEntries });
        }
      });
    </script>
  </body>
</html>`;
  }
}

function getBlockRange(document: vscode.TextDocument, text: string, block: PreviewBlock): vscode.Range {
  const startOffset = offsetAt(text, { line: block.startLine - 1, character: 0 });
  const endLineText = document.lineAt(block.endLine - 1).text;
  const endOffset = offsetAt(text, { line: block.endLine - 1, character: endLineText.length });
  return new vscode.Range(document.positionAt(startOffset), document.positionAt(endOffset));
}

function createNonce(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export type { PreviewSource };
