export interface BuilderShellRenderOptions {
  mermaidScriptSrc: string;
  builderScriptSrc: string;
  cspSource?: string;
  nonce?: string;
  hostKind: 'vscode-webview' | 'browser-harness';
}

export function renderBuilderShell(options: BuilderShellRenderOptions): string {
  const { mermaidScriptSrc, builderScriptSrc, cspSource, nonce, hostKind } = options;
  const cspMeta = hostKind === 'vscode-webview'
    ? `    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} data:; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${cspSource};" />\n`
    : '';
  const scriptNonce = hostKind === 'vscode-webview' ? ` nonce="${nonce}"` : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
${cspMeta}    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root { color-scheme: light dark; }
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-editor-foreground);
        background: var(--vscode-sideBar-background);
        padding: 12px;
        margin: 0;
        overflow-x: hidden;
      }
      h1, h2, h3 { margin: 0; }
      h2 { font-size: 15px; }
      h3 {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--vscode-descriptionForeground);
      }
      label {
        display: block;
        font-size: 12px;
        margin-bottom: 4px;
        overflow-wrap: anywhere;
      }
      input, select, textarea, button {
        font: inherit;
        box-sizing: border-box;
        min-width: 0;
      }
      input, select, textarea {
        width: 100%;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
        border-radius: 6px;
        padding: 6px 8px;
      }
      textarea {
        min-height: 160px;
        resize: vertical;
        line-height: 1.45;
      }
      button {
        border: 1px solid var(--vscode-button-border, transparent);
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-radius: 6px;
        padding: 6px 10px;
        cursor: pointer;
        max-width: 100%;
        white-space: normal;
        overflow-wrap: anywhere;
      }
      button.secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
      }
      button.ghost {
        background: transparent;
        border-color: var(--vscode-panel-border);
        color: var(--vscode-editor-foreground);
      }
      button.small {
        padding: 4px 8px;
        font-size: 12px;
      }
      button:disabled { cursor: not-allowed; opacity: 0.55; }
      .stack {
        display: grid;
        gap: 12px;
        min-width: 0;
      }
      .section {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 10px;
        background: color-mix(in srgb, var(--vscode-sideBar-background) 88%, var(--vscode-editor-background));
        min-width: 0;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .grid-2, .grid-3 {
        display: grid;
        gap: 8px;
        min-width: 0;
      }
      .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .grid-2 > *,
      .grid-3 > * {
        min-width: 0;
      }
      .toolbar, .subtoolbar, .actions-inline {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        min-width: 0;
      }
      .toolbar > *,
      .subtoolbar > *,
      .actions-inline > * {
        min-width: 0;
      }
      .subtoolbar { margin-top: 8px; }
      .meta {
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        overflow-wrap: anywhere;
      }
      .status-card { border-left: 3px solid var(--vscode-button-background); }
      .status-card.blocked { border-left-color: var(--vscode-errorForeground); }
      .badge-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
      .badge {
        font-size: 11px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 999px;
        padding: 2px 8px;
        color: var(--vscode-descriptionForeground);
      }
      .item-list { display: grid; gap: 6px; }
      .card {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 7px;
        padding: 8px;
        background: var(--vscode-editor-background);
        min-width: 0;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        flex-wrap: wrap;
        min-width: 0;
      }
      .section-header > *,
      .card-header > * {
        min-width: 0;
      }
      .card-title { font-size: 11px; font-weight: 600; }
      .compact-card {
        padding: 6px;
      }
      .compact-card-header {
        margin-bottom: 2px;
      }
      .compact-actions {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, auto));
        gap: 3px;
      }
      .compact-actions-row {
        margin-bottom: 4px;
        justify-content: start;
      }
      .compact-actions > button {
        padding: 2px 5px;
        font-size: 10px;
        line-height: 1.2;
      }
      .compact-card-grid {
        gap: 4px;
      }
      .compact-card-grid label {
        margin-bottom: 1px;
        font-size: 10px;
      }
      .compact-card-grid input,
      .compact-card-grid select {
        padding: 4px 6px;
        min-height: 28px;
      }
      .compact-panel-grid {
        gap: 6px;
      }
      .compact-panel-grid label {
        margin-bottom: 2px;
        font-size: 11px;
      }
      .compact-panel-grid input,
      .compact-panel-grid select {
        padding: 5px 7px;
        min-height: 30px;
      }
      .compact-panel-grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .compact-panel-grid-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .compact-panel-grid-3 > :last-child {
        grid-column: 1 / -1;
      }
      .compact-panel-actions > button {
        padding: 4px 8px;
        font-size: 11px;
      }
      .status-card-actions {
        margin-top: 6px;
      }
      .status-card-actions > button {
        flex: 1 1 110px;
        padding: 4px 8px;
        font-size: 11px;
      }
      .compact-card-grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .compact-card-grid-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .compact-card-grid-3 > :last-child {
        grid-column: 1 / -1;
      }
      .preview {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 10px;
        background: var(--vscode-editor-background);
        overflow: auto;
        min-height: 120px;
      }
      .preview-error { color: var(--vscode-errorForeground); white-space: pre-wrap; margin-bottom: 10px; }
      .preview-error-source {
        white-space: pre-wrap;
        overflow: auto;
        padding: 10px;
        border-radius: 6px;
        border: 1px solid var(--vscode-panel-border);
        background: color-mix(in srgb, var(--vscode-editor-background) 94%, transparent);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 12px;
        overflow-wrap: anywhere;
      }
      .hidden { display: none; }
      .list { margin: 0; padding-left: 18px; }
      .list li { margin: 4px 0; }
      .mono { font-family: var(--vscode-editor-font-family, monospace); }
      .canvas-toolbar {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 8px;
        min-width: 0;
      }
      .canvas-toolbar > * {
        min-width: 0;
      }
      .canvas {
        position: relative;
        min-height: 160px;
        max-height: 240px;
        border: 1px dashed var(--vscode-panel-border);
        border-radius: 8px;
        background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-sideBar-background));
        overflow: auto;
        cursor: grab;
      }
      .canvas.viewport-panning {
        cursor: grabbing;
      }
      .canvas-surface {
        position: relative;
        min-width: 100%;
        min-height: 160px;
      }
      .canvas-content {
        position: relative;
        transform-origin: top left;
      }
      .sequence-lane {
        position: absolute;
        top: 54px;
        bottom: 12px;
        width: 2px;
        background: color-mix(in srgb, var(--vscode-descriptionForeground) 55%, transparent);
      }
      .sequence-header {
        position: absolute;
        min-width: 100px;
        max-width: 140px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid var(--vscode-panel-border);
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        text-align: center;
        font-size: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      }
      .sequence-message {
        position: absolute;
        height: 2px;
        transform-origin: left center;
        background: var(--vscode-focusBorder);
      }
      .sequence-message.dashed {
        background: repeating-linear-gradient(90deg, var(--vscode-focusBorder), var(--vscode-focusBorder) 6px, transparent 6px, transparent 12px);
      }
      .sequence-label {
        position: absolute;
        transform: translate(-50%, -50%);
        padding: 2px 6px;
        border-radius: 999px;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        color: var(--vscode-editor-foreground);
        font-size: 11px;
        white-space: nowrap;
      }
      .canvas-hint {
        position: sticky;
        right: 8px;
        top: 8px;
        z-index: 5;
        float: right;
        margin: 6px;
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        background: color-mix(in srgb, var(--vscode-editor-background) 86%, transparent);
        padding: 2px 6px;
        border-radius: 999px;
      }
      .canvas-node {
        position: absolute;
        z-index: 2;
        min-width: 78px;
        max-width: 140px;
        padding: 8px 10px;
        border-radius: 999px;
        border: 1px solid var(--vscode-panel-border);
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        cursor: grab;
        user-select: none;
        text-align: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      }
      .canvas-node.selected {
        outline: 2px solid var(--vscode-focusBorder);
      }
      .canvas-line {
        position: absolute;
        z-index: 1;
        transform-origin: left center;
        height: 2px;
        background: var(--vscode-descriptionForeground);
        opacity: 0.6;
      }
      svg { max-width: 100%; height: auto; }

      @media (max-width: 560px) {
        body { padding: 10px; }
        .section { padding: 9px; }
        .grid-2,
        .grid-3 { grid-template-columns: minmax(0, 1fr); }
        .compact-hide {
          display: none !important;
        }
        #flowNodesSection,
        #flowEdgesSection,
        #sequenceParticipantsSection,
        #sequenceMessagesSection,
        #flowCanvasSection {
          padding: 8px;
        }
        #flowNodesSection .section-header,
        #flowEdgesSection .section-header,
        #sequenceParticipantsSection .section-header,
        #sequenceMessagesSection .section-header,
        #flowCanvasSection .section-header {
          margin-bottom: 6px;
        }
        .actions-inline > button,
        .toolbar > button,
        .subtoolbar > button {
          flex: 1 1 120px;
          padding: 5px 8px;
          font-size: 11px;
        }
        .compact-panel-grid-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .compact-panel-grid-3 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .compact-panel-grid-3 > :last-child {
          grid-column: 1 / -1;
        }
        .compact-card-grid-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .compact-card-grid-3 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .compact-card-grid-3 > :last-child {
          grid-column: 1 / -1;
        }
        .compact-card {
          padding: 7px;
        }
        .card-title {
          font-size: 11px;
        }
        .item-list {
          gap: 6px;
        }
        .canvas-toolbar {
          gap: 4px;
        }
        .canvas-toolbar > button {
          flex: 1 1 68px;
          padding: 4px 6px;
          font-size: 11px;
        }
        .canvas-hint {
          margin: 4px;
          padding: 2px 6px;
          font-size: 10px;
        }
        .sequence-header,
        .canvas-node {
          min-width: 64px;
          max-width: 104px;
          padding: 6px 8px;
          font-size: 11px;
        }
        textarea {
          min-height: 124px;
        }
        .canvas {
          min-height: 144px;
          max-height: 220px;
        }
        .canvas-surface {
          min-height: 144px;
        }
      }

      @media (max-width: 420px) {
        body { padding: 8px; }
        .section { padding: 8px; border-radius: 6px; }
        .stack { gap: 8px; }
        .grid-2,
        .grid-3 {
          grid-template-columns: minmax(0, 1fr);
        }
        .compact-panel-grid-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .compact-panel-grid-3 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .compact-panel-grid-3 > :last-child {
          grid-column: 1 / -1;
        }
        .section-header {
          align-items: flex-start;
        }
        .actions-inline,
        .toolbar,
        .subtoolbar {
          flex-direction: column;
          align-items: stretch;
        }
        .actions-inline > button,
        .toolbar > button,
        .subtoolbar > button {
          width: 100%;
          flex: 1 1 auto;
        }
        .canvas-toolbar > button {
          flex: 1 1 44%;
        }
        .preview {
          min-height: 96px;
          padding: 8px;
        }
        .canvas {
          min-height: 132px;
          max-height: 180px;
        }
        .canvas-surface {
          min-height: 132px;
        }
      }
    </style>
  </head>
  <body>
    <div class="stack">
      <section class="section status-card" id="statusCard">
        <div class="section-header">
          <h2>Builder</h2>
        </div>
        <div class="actions-inline status-card-actions">
          <button id="importActiveDocument" class="ghost small">Import Active</button>
          <button id="openPreview" class="ghost small">Open Preview</button>
          <button id="refreshContext" class="ghost small">Refresh</button>
        </div>
        <div id="editorSummary">Checking active editor…</div>
        <div id="editorDetail" class="meta"></div>
        <div id="importStatus" class="meta" style="margin-top:8px;"></div>
        <div class="badge-row compact-hide">
          <span class="badge">Flowchart builder</span>
          <span class="badge">Sequence builder</span>
          <span class="badge">Markdown-aware insert</span>
        </div>
        <div class="meta compact-hide" style="margin-top:8px;">
          Full interactive builder support is focused on <span class="mono">flowchart</span> and <span class="mono">sequenceDiagram</span>.
          For other Mermaid families, use source editing, <span class="mono">/snippet</span>, preview, and the bundled reference examples.
        </div>
      </section>

      <section class="section compact-hide">
        <div class="section-header">
          <h3>Quick Start Tips</h3>
          <span class="meta">Fast paths for most users.</span>
        </div>
        <ul class="list">
          <li>Type <span class="mono">/flow</span>, <span class="mono">/sequence</span>, or <span class="mono">/snippet</span> in Mermaid editors for fast insertion.</li>
          <li>Use <span class="mono">Ctrl/Cmd + Click</span> or <span class="mono">Open Reference for Symbol Under Cursor</span> on Mermaid keywords to jump to bundled examples.</li>
          <li>Top-level starters are protected so they do not accidentally get inserted into an existing diagram without confirmation.</li>
        </ul>
      </section>

      <section class="section">
        <div class="section-header">
          <h3>Quick Start</h3>
          <span class="meta">Switch modes, load presets, or import existing Mermaid.</span>
        </div>
        <div class="grid-2">
          <div>
            <label for="diagramType">Diagram type</label>
            <select id="diagramType">
              <option value="flowchart">Flowchart</option>
              <option value="sequence">Sequence</option>
            </select>
          </div>
          <div>
            <label for="preset">Preset</label>
            <select id="preset"></select>
          </div>
        </div>
        <div class="subtoolbar">
          <button id="loadPreset" class="secondary">Load Preset</button>
          <button id="clear" class="ghost">Clear</button>
        </div>
      </section>

      <section class="section" id="flowSettingsSection">
        <div class="section-header">
          <h3>Flow Settings</h3>
          <span class="meta">Direction and validation.</span>
        </div>
        <div class="grid-3 compact-panel-grid compact-panel-grid-3">
          <div>
            <label for="direction">Direction</label>
            <select id="direction">
              <option value="TD">TD</option>
              <option value="LR">LR</option>
              <option value="RL">RL</option>
              <option value="BT">BT</option>
            </select>
          </div>
          <div>
            <label>Nodes</label>
            <input id="nodeCount" readonly />
          </div>
          <div>
            <label>Edges</label>
            <input id="edgeCount" readonly />
          </div>
        </div>
        <div id="validationSummary" class="meta" style="margin-top:8px;">No validation issues.</div>
        <ul id="validationList" class="list hidden"></ul>
      </section>

      <section class="section hidden" id="sequenceSettingsSection">
        <div class="section-header">
          <h3>Sequence Settings</h3>
          <span class="meta">Participants, messages, and validation.</span>
        </div>
        <div class="grid-2">
          <div>
            <label>Participants</label>
            <input id="participantCount" readonly />
          </div>
          <div>
            <label>Messages</label>
            <input id="messageCount" readonly />
          </div>
        </div>
        <div id="sequenceValidationSummary" class="meta" style="margin-top:8px;">No validation issues.</div>
        <ul id="sequenceValidationList" class="list hidden"></ul>
      </section>

      <section class="section" id="flowNodesSection">
        <div class="section-header">
          <h3>Nodes</h3>
          <span class="meta">Quick-add and refine flowchart nodes.</span>
        </div>
        <div class="grid-3 compact-panel-grid compact-panel-grid-3">
          <div>
            <label for="quickNodeLabel">Label</label>
            <input id="quickNodeLabel" placeholder="e.g. API Gateway" />
          </div>
          <div>
            <label for="quickNodeId">ID</label>
            <input id="quickNodeId" placeholder="auto" />
          </div>
          <div>
            <label for="quickNodeShape">Shape</label>
            <select id="quickNodeShape">
              <option value="rectangle">Rectangle</option>
              <option value="rounded">Rounded</option>
              <option value="circle">Circle</option>
              <option value="diamond">Diamond</option>
              <option value="database">Database</option>
            </select>
          </div>
        </div>
        <div class="subtoolbar compact-panel-actions">
          <button id="addNode">Add Node</button>
        </div>
        <div id="nodes" class="item-list" style="margin-top:10px;"></div>
      </section>

      <section class="section" id="flowEdgesSection">
        <div class="section-header">
          <h3>Edges</h3>
          <span class="meta">Connect nodes with labels and reorder edges if needed.</span>
        </div>
        <div class="grid-2 compact-panel-grid compact-panel-grid-2">
          <div>
            <label for="quickEdgeFrom">From</label>
            <select id="quickEdgeFrom"></select>
          </div>
          <div>
            <label for="quickEdgeTo">To</label>
            <select id="quickEdgeTo"></select>
          </div>
          <div>
            <label for="quickEdgeStyle">Style</label>
            <select id="quickEdgeStyle">
              <option value="solid">Solid</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
          <div>
            <label for="quickEdgeLabel">Label</label>
            <input id="quickEdgeLabel" placeholder="optional" />
          </div>
        </div>
        <div class="subtoolbar compact-panel-actions">
          <button id="addEdge">Add Edge</button>
        </div>
        <div id="edges" class="item-list" style="margin-top:10px;"></div>
      </section>

      <section class="section" id="flowCanvasSection">
        <div class="section-header">
          <h3>Canvas / Overview</h3>
          <span class="meta">Flowcharts support draggable nodes; sequence diagrams show a lane overview. Drag empty space to pan, or use zoom controls to fit.</span>
        </div>
        <div class="canvas-toolbar">
          <button id="canvasZoomOut" class="ghost small">−</button>
          <button id="canvasZoomReset" class="ghost small">100%</button>
          <button id="canvasZoomIn" class="ghost small">+</button>
          <button id="canvasFit" class="secondary small">Fit</button>
        </div>
        <div id="flowCanvas" class="canvas">
          <div class="canvas-hint">Builder-only layout helper</div>
        </div>
      </section>

      <section class="section hidden" id="sequenceParticipantsSection">
        <div class="section-header">
          <h3>Participants</h3>
          <span class="meta">Add actors/services for the sequence.</span>
        </div>
        <div class="grid-2">
          <div>
            <label for="quickParticipantLabel">Label</label>
            <input id="quickParticipantLabel" placeholder="e.g. End User" />
          </div>
          <div>
            <label for="quickParticipantId">ID</label>
            <input id="quickParticipantId" placeholder="auto" />
          </div>
        </div>
        <div class="subtoolbar">
          <button id="addParticipant">Add Participant</button>
        </div>
        <div id="participants" class="item-list" style="margin-top:10px;"></div>
      </section>

      <section class="section hidden" id="sequenceMessagesSection">
        <div class="section-header">
          <h3>Messages</h3>
          <span class="meta">Define ordered calls and responses.</span>
        </div>
        <div class="grid-2">
          <div>
            <label for="quickMessageFrom">From</label>
            <select id="quickMessageFrom"></select>
          </div>
          <div>
            <label for="quickMessageTo">To</label>
            <select id="quickMessageTo"></select>
          </div>
          <div>
            <label for="quickMessageStyle">Style</label>
            <select id="quickMessageStyle">
              <option value="solid">Request</option>
              <option value="dashed">Response</option>
            </select>
          </div>
          <div>
            <label for="quickMessageLabel">Label</label>
            <input id="quickMessageLabel" placeholder="optional message" />
          </div>
        </div>
        <div class="subtoolbar">
          <button id="addMessage">Add Message</button>
        </div>
        <div id="messages" class="item-list" style="margin-top:10px;"></div>
      </section>

      <section class="section">
        <div class="section-header">
          <h3>Generated Mermaid</h3>
          <span class="meta">You can import, build structurally, or edit the source directly.</span>
        </div>
        <textarea id="source" class="mono"></textarea>
        <div class="toolbar" style="margin-top:10px;">
          <button id="generate">Regenerate from Builder</button>
          <button id="renderSource" class="secondary">Render Current Source</button>
          <button id="copy">Copy Mermaid</button>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h3>Rendered Preview</h3>
          <span id="previewStatus" class="meta">Live preview</span>
        </div>
        <div id="preview" class="preview"><span class="meta">Generate a diagram to render it here.</span></div>
        <div class="toolbar" style="margin-top:10px;">
          <button id="insert">Insert</button>
          <button id="createFile" class="secondary">Create New File</button>
        </div>
      </section>
    </div>

    <script${scriptNonce} src="${mermaidScriptSrc}"></script>
    <script${scriptNonce} src="${builderScriptSrc}"></script>
  </body>
</html>`;
}
