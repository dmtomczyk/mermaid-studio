import { createDiagramCanvasWebviewScript } from './diagramCanvasWebviewScript';
import { CanvasDiagramFamily } from './types/canvasFamilies';

export interface DiagramCanvasHtmlParams {
  cspSource: string;
  nonce: string;
  debugEnabled: boolean;
  family: CanvasDiagramFamily;
}

export function createDiagramCanvasHtml(params: DiagramCanvasHtmlParams): string {
  const { cspSource, nonce, debugEnabled, family } = params;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        color-scheme: light dark;
        --canvas-bg:
          linear-gradient(90deg, rgba(127,127,127,0.12) 1px, transparent 1px),
          linear-gradient(rgba(127,127,127,0.12) 1px, transparent 1px),
          var(--vscode-editor-background);
        --card-bg: color-mix(in srgb, var(--vscode-editor-background) 90%, var(--vscode-panel-border));
      }
      * { box-sizing: border-box; }
      html, body {
        height: 100%;
      }
      body {
        margin: 0;
        font-family: var(--vscode-font-family);
        color: var(--vscode-editor-foreground);
        background: var(--vscode-editor-background);
        overflow: hidden;
      }
      button, input, textarea, select { font: inherit; }
      button {
        border: 1px solid var(--vscode-button-border, transparent);
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-radius: 6px;
        padding: 6px 10px;
        cursor: pointer;
      }
      button.secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
      }
      button.ghost {
        background: transparent;
        color: var(--vscode-editor-foreground);
        border-color: var(--vscode-panel-border);
      }
      button.danger {
        color: var(--vscode-errorForeground);
        border-color: color-mix(in srgb, var(--vscode-errorForeground) 65%, var(--vscode-panel-border));
        background: color-mix(in srgb, var(--vscode-errorForeground) 10%, transparent);
      }
      button.danger.secondary {
        color: var(--vscode-errorForeground);
        border-color: color-mix(in srgb, var(--vscode-errorForeground) 65%, var(--vscode-panel-border));
        background: color-mix(in srgb, var(--vscode-errorForeground) 12%, transparent);
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--vscode-panel-border);
      }
      h1 {
        margin: 0;
        font-size: 15px;
      }
      .meta {
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      main {
        display: grid;
        grid-template-columns: minmax(680px, 1.4fr) minmax(320px, 0.6fr);
        height: calc(100vh - 62px);
        min-height: calc(100vh - 62px);
        overflow: hidden;
      }
      .canvas-pane {
        display: grid;
        grid-template-rows: auto 1fr;
        min-height: 0;
        min-width: 0;
        overflow: hidden;
      }
      .toolbar {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--vscode-panel-border);
      }
      .toolbar .spacer { flex: 1 1 auto; }
      .canvas-shell {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        background: var(--canvas-bg);
        background-size: 24px 24px;
        scroll-behavior: smooth;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .canvas-shell::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }
      .canvas-shell.panning {
        cursor: grabbing;
        scroll-behavior: auto;
      }
      .canvas-stage {
        position: relative;
        width: 6000px;
        height: 4000px;
        transform-origin: 0 0;
      }
      svg.edges {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .edge-hit {
        stroke: transparent;
        stroke-width: 18;
        fill: none;
        cursor: pointer;
      }
      .edge-line {
        stroke: color-mix(in srgb, var(--vscode-editor-foreground) 76%, transparent);
        stroke-width: 2.5;
        fill: none;
        pointer-events: none;
      }
      .edge-line.dashed {
        stroke-dasharray: 8 6;
      }
      .edge-line.preview {
        stroke: var(--vscode-charts-orange);
        stroke-width: 4;
        stroke-dasharray: 10 6;
        opacity: 0.96;
      }
      .edge-line.selected {
        stroke: var(--vscode-focusBorder);
        stroke-width: 3.5;
      }
      .edge-label {
        fill: var(--vscode-descriptionForeground);
        font-size: 12px;
        cursor: pointer;
        user-select: none;
      }
      .edge-label.selected {
        fill: var(--vscode-focusBorder);
        font-weight: 700;
      }
      .edge-editor {
        position: absolute;
        min-width: 240px;
        padding: 10px;
        border: 1px solid var(--vscode-focusBorder);
        border-radius: 10px;
        background: color-mix(in srgb, var(--vscode-editor-background) 96%, var(--vscode-panel-border));
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.16);
        z-index: 15;
      }
      .edge-editor[hidden] {
        display: none;
      }
      .canvas-confirm-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--vscode-editor-background) 72%, transparent);
        backdrop-filter: blur(2px);
        z-index: 40;
      }
      .canvas-confirm-overlay[hidden] {
        display: none;
      }
      .canvas-confirm-card {
        width: min(420px, calc(100vw - 48px));
        padding: 16px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vscode-editor-background) 96%, var(--vscode-panel-border));
        box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
      }
      .canvas-confirm-card h2 {
        margin: 0 0 8px;
        font-size: 15px;
      }
      .canvas-confirm-card p {
        margin: 0;
        color: var(--vscode-descriptionForeground);
        line-height: 1.45;
      }
      .canvas-confirm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 14px;
      }
      .edge-editor-grid {
        display: grid;
        gap: 8px;
      }
      .class-node {
        position: absolute;
        min-width: 180px;
        max-width: 260px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vscode-editor-background) 95%, white 5%);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
        overflow: hidden;
        user-select: none;
      }
      .flowchart-node {
        display: grid;
        grid-template-rows: auto 1fr auto;
      }
      .flowchart-node .node-header {
        padding: 8px 10px;
      }
      .flowchart-node .node-body {
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 8px 12px;
      }
      .flowchart-node.flowchart-shape-circle {
        border-radius: 999px;
      }
      .flowchart-node.flowchart-shape-stadium,
      .flowchart-node.flowchart-shape-rounded {
        border-radius: 999px;
      }
      .flowchart-node.flowchart-shape-text {
        box-shadow: none;
        border-style: dashed;
        background: color-mix(in srgb, var(--vscode-editor-background) 98%, transparent);
      }
      .class-node.selected {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder), 0 12px 28px rgba(0, 0, 0, 0.16);
      }
      .class-node.connect-source {
        border-color: var(--vscode-charts-blue);
        box-shadow: 0 0 0 1px var(--vscode-charts-blue), 0 12px 28px rgba(0, 0, 0, 0.16);
      }
      .node-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
        background: var(--card-bg);
        cursor: grab;
      }
      .node-header-main {
        min-width: 0;
        flex: 1 1 auto;
      }
      .node-header-tools {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
      }
      .node-title {
        font-weight: 700;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .node-port {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        border: 2px solid var(--vscode-editor-background);
        background: var(--vscode-charts-blue);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--vscode-charts-blue) 70%, black 30%);
        cursor: crosshair;
      }
      .node-port.active {
        background: var(--vscode-charts-orange);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--vscode-charts-orange) 70%, black 30%);
      }
      .node-header:active { cursor: grabbing; }
      .node-body {
        padding: 10px 12px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        white-space: pre-wrap;
        min-height: 56px;
      }
      .node-member-line {
        display: block;
        white-space: pre-wrap;
      }
      .tok-visibility { color: #569cd6; font-weight: 700; }
      .tok-member-name { color: #9cdcfe; }
      .tok-type { color: #4ec9b0; }
      .tok-params { color: #d7ba7d; }
      .node-hint {
        padding: 8px 12px 10px;
        border-top: 1px solid color-mix(in srgb, var(--vscode-panel-border) 65%, transparent);
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
      }
      .node-actions {
        display: flex;
        gap: 6px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
      .node-actions button {
        padding: 4px 8px;
        font-size: 11px;
      }
      .canvas-hud {
        position: sticky;
        top: 0;
        left: 0;
        width: 100%;
        height: 0;
        pointer-events: none;
        z-index: 16;
      }
      .canvas-tip {
        position: absolute;
        right: 16px;
        top: 168px;
        max-width: 360px;
        padding: 10px 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-panel-border));
        box-shadow: 0 10px 22px rgba(0,0,0,0.12);
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        pointer-events: auto;
      }
      .minimap {
        position: absolute;
        right: 16px;
        top: 16px;
        width: 220px;
        height: 140px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        background: color-mix(in srgb, var(--vscode-editor-background) 95%, var(--vscode-panel-border));
        box-shadow: 0 10px 22px rgba(0,0,0,0.12);
        overflow: hidden;
        z-index: 12;
        cursor: pointer;
        pointer-events: auto;
      }
      .minimap-header {
        padding: 6px 8px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        border-bottom: 1px solid var(--vscode-panel-border);
      }
      .minimap-body {
        position: relative;
        width: 100%;
        height: calc(100% - 29px);
        background: linear-gradient(90deg, rgba(127,127,127,0.08) 1px, transparent 1px), linear-gradient(rgba(127,127,127,0.08) 1px, transparent 1px);
        background-size: 12px 12px;
      }
      .minimap-node {
        position: absolute;
        border-radius: 3px;
        background: color-mix(in srgb, var(--vscode-charts-blue) 70%, white 30%);
        border: 1px solid color-mix(in srgb, var(--vscode-charts-blue) 65%, black 35%);
      }
      .minimap-node.selected {
        background: color-mix(in srgb, var(--vscode-focusBorder) 75%, white 25%);
        border-color: var(--vscode-focusBorder);
      }
      .minimap-viewport {
        position: absolute;
        border: 2px solid var(--vscode-focusBorder);
        background: color-mix(in srgb, var(--vscode-focusBorder) 12%, transparent);
        border-radius: 4px;
        cursor: move;
      }
      .debug-panel {
        position: absolute;
        left: 16px;
        top: 16px;
        width: 320px;
        max-height: 240px;
        overflow: auto;
        padding: 10px 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        background: color-mix(in srgb, var(--vscode-editor-background) 96%, var(--vscode-panel-border));
        box-shadow: 0 10px 22px rgba(0,0,0,0.12);
        font-size: 11px;
        color: var(--vscode-editor-foreground);
        pointer-events: auto;
        white-space: pre-wrap;
      }
      .context-menu {
        position: absolute;
        min-width: 220px;
        padding: 8px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        background: color-mix(in srgb, var(--vscode-editor-background) 96%, var(--vscode-panel-border));
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
        z-index: 20;
      }
      .context-menu[hidden] {
        display: none;
      }
      .context-menu-title {
        padding: 6px 8px 8px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
      }
      .context-menu-actions {
        display: grid;
        gap: 6px;
      }
      .context-menu-actions button {
        width: 100%;
        text-align: left;
        background: transparent;
        color: var(--vscode-editor-foreground);
        border-color: var(--vscode-panel-border);
      }
      .context-menu-divider {
        margin: 4px 0;
        border-top: 1px solid var(--vscode-panel-border);
      }
      .sidebar {
        border-left: 1px solid var(--vscode-panel-border);
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 320px;
        overflow: auto;
      }
      .section {
        border-bottom: 1px solid var(--vscode-panel-border);
        padding: 14px 16px;
        min-height: 0;
        flex: 0 0 auto;
      }
      .section:last-child {
        min-height: 220px;
        display: flex;
        flex-direction: column;
      }
      .section h2 {
        margin: 0 0 10px;
        font-size: 13px;
      }
      label {
        display: grid;
        gap: 6px;
        margin-bottom: 10px;
        font-size: 12px;
      }
      input, textarea, select {
        width: 100%;
        border-radius: 6px;
        border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        padding: 8px;
      }
      textarea {
        min-height: 120px;
        resize: vertical;
      }
      .members-editor-preview {
        margin-top: 8px;
        padding: 8px;
        border: 1px dashed var(--vscode-panel-border);
        border-radius: 8px;
        background: color-mix(in srgb, var(--vscode-editor-background) 94%, var(--vscode-panel-border));
      }
      .member-snippet-bar {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 8px;
      }
      .member-snippet-bar button {
        padding: 4px 8px;
        font-size: 11px;
      }
      .member-editor-hint {
        margin-top: 8px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
      }
      .small-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .relation-list {
        display: grid;
        gap: 8px;
        max-height: 240px;
        overflow: auto;
      }
      .relation-row {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 10px;
        display: grid;
        gap: 8px;
        background: color-mix(in srgb, var(--vscode-editor-background) 95%, var(--vscode-panel-border));
      }
      .relation-row.selected {
        border-color: var(--vscode-focusBorder);
        box-shadow: inset 0 0 0 1px var(--vscode-focusBorder);
      }
      .relation-summary {
        font-size: 12px;
      }
      .inspector-empty {
        color: var(--vscode-descriptionForeground);
        font-style: italic;
      }
      pre, .code-block {
        margin: 0;
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .code-block {
        overflow: auto;
        min-height: 0;
      }
      .section:last-child .code-block {
        flex: 1 1 auto;
      }
      .code-line-root { display: block; }
      .tok-keyword { color: #c586c0; font-weight: 700; }
      .tok-identifier { color: #4ec9b0; font-weight: 600; }
      .tok-member { color: #dcdcaa; }
      .tok-relation { color: #d4d4d4; font-weight: 700; }
      .tok-label { color: #ce9178; }
      .tok-comment { color: #6a9955; font-style: italic; }
      .tok-invalid { text-decoration: underline wavy var(--vscode-errorForeground); text-underline-offset: 2px; }
      .validation-list {
        display: grid;
        gap: 8px;
      }
      .validation-item {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 12px;
      }
      .validation-item.error {
        border-color: var(--vscode-errorForeground);
        color: var(--vscode-errorForeground);
        background: color-mix(in srgb, var(--vscode-errorForeground) 10%, transparent);
      }
      .validation-item.warning {
        border-color: var(--vscode-editorWarning-foreground, #cca700);
        color: var(--vscode-editorWarning-foreground, #cca700);
        background: color-mix(in srgb, var(--vscode-editorWarning-foreground, #cca700) 10%, transparent);
      }
    </style>
  </head>
  <body>
    <header>
      <div>
        <h1>Diagram Canvas</h1>
        <div class="meta" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span id="sourceLabel">classDiagram canvas</span>
          <label style="display:inline-flex; gap:6px; align-items:center; margin:0;">
            <span id="familyPickerLabel">Family</span>
            <select id="familySelect" class="secondary" aria-label="Diagram family">
              <option value="classDiagram">Class Diagram</option>
              <option value="flowchart">Flowchart</option>
            </select>
          </label>
        </div>
      </div>
      <div class="actions">
        <button id="copyButton" class="secondary">Copy Mermaid</button>
        <button id="createFileButton" class="secondary">Create File</button>
        <button id="previewButton" class="secondary">Open Preview</button>
        <button id="applyButton">Apply to Document</button>
      </div>
    </header>
    <main>
      <section class="canvas-pane">
        <div class="toolbar">
          <select id="classTemplateSelect" class="secondary" aria-label="Canvas template">
            <option value="empty">Empty Class</option>
            <option value="entity">Entity / Model</option>
            <option value="service">Service</option>
            <option value="repository">Repository</option>
            <option value="controller">Controller</option>
            <option value="dto">DTO</option>
            <option value="component">Component</option>
          </select>
          <button id="addClassButton">Add this template</button>
          <div class="spacer"></div>
          <button id="fitDiagramButton" class="secondary">Fit Diagram</button>
          <button id="fitSelectionButton" class="secondary">Fit Selection</button>
          <button id="zoomActualButton" class="secondary">1:1</button>
          <button id="zoomOutButton" class="secondary">−</button>
          <button id="zoomResetButton" class="secondary">100%</button>
          <button id="zoomInButton" class="secondary">+</button>
          <span id="toolbarStatus" class="meta">Drag classes. Double-click bare canvas to place the selected template. Drag from ports to connect.</span>
        </div>
        <div id="canvasShell" class="canvas-shell">
          <div class="canvas-hud">
            ${debugEnabled ? '<div id="debugPanel" class="debug-panel"></div>' : ''}
            <div id="minimap" class="minimap">
              <div class="minimap-header">Minimap</div>
              <div id="minimapBody" class="minimap-body"></div>
            </div>
            <div class="canvas-tip">
              <strong>Canvas direction</strong><br/>
              This is now intentionally canvas-first: direct node manipulation on the stage, selected edge editing, and Mermaid source as generated output rather than the main editing surface.
            </div>
          </div>
          <div id="canvasStage" class="canvas-stage">
            <svg id="edgeLayer" class="edges"></svg>
            <div id="nodeLayer"></div>
            <div id="edgeEditor" class="edge-editor" hidden></div>
            <div id="contextMenu" class="context-menu" hidden>
              <div id="contextMenuTitle" class="context-menu-title">Canvas actions</div>
              <div class="context-menu-actions">
                <button type="button" data-context-action="add-class">Add class here</button>
                <button type="button" data-context-action="add-template-class">Add selected template here</button>
                <button type="button" data-context-action="duplicate-class">Duplicate selected class here</button>
                <button type="button" data-context-action="connect-here">Connect selected class from here</button>
                <div class="context-menu-divider"></div>
                <button type="button" class="danger" data-context-action="delete-selected">Delete selected</button>
                <button type="button" data-context-action="cancel-connect">Cancel connect mode</button>
              </div>
            </div>
          </div>
          <div id="canvasConfirmOverlay" class="canvas-confirm-overlay" hidden>
            <div class="canvas-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="canvasConfirmTitle" aria-describedby="canvasConfirmBody">
              <h2 id="canvasConfirmTitle">Confirm action</h2>
              <p id="canvasConfirmBody">Are you sure?</p>
              <div class="canvas-confirm-actions">
                <button id="canvasConfirmCancelButton" type="button" class="secondary">Cancel</button>
                <button id="canvasConfirmAcceptButton" type="button" class="danger">Continue</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside class="sidebar">
        <section class="section">
          <h2>Source</h2>
          <div id="linkedFileInfo" class="meta"></div>
          <div class="small-actions" style="margin-top:10px;">
            <button id="openLinkedFileButton" class="secondary">Open Linked File</button>
            <button id="reimportButton" class="secondary">Re-import</button>
          </div>
        </section>

        <section class="section">
          <h2 id="templateSectionTitle">Add Class</h2>
          <div id="templatePreview" class="meta"></div>
          <div class="small-actions" style="margin-top:10px;">
            <button id="addTemplateFromSidebarButton">Add this template to canvas</button>
          </div>
        </section>

        <section class="section">
          <h2 id="inspectorTitle">Inspector</h2>
          <div id="inspectorBody"></div>
        </section>

        <section class="section">
          <h2 id="relationSectionTitle">Relationships</h2>
          <div id="relationList" class="relation-list"></div>
        </section>

        <section class="section">
          <h2>Validation</h2>
          <div id="validationList" class="validation-list"></div>
        </section>

        <section class="section">
          <h2>Generated Mermaid</h2>
          <div id="mermaidSource" class="code-block" aria-label="Generated Mermaid source"></div>
        </section>
      </aside>
    </main>

    <script nonce="${nonce}">${createDiagramCanvasWebviewScript({ debugEnabled, family })}</script>
  </body>
</html>`;
}
