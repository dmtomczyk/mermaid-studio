import {
  createUniqueFlowNodeId,
  createUniqueParticipantId,
  ensureUniqueFlowNodeId,
  ensureUniqueParticipantId
} from './sanitize';
import { BuilderAppContext } from './types';
import { escapeHtml, moveItem, sanitizeId, toggleHidden } from './utils';
import { validateFlowState, validateSequenceState } from './validation';
import {
  fitCanvasToView,
  onCanvasDragEnd,
  onCanvasDragMove,
  onCanvasPanEnd,
  onCanvasPanMove,
  onCanvasPanStart,
  renderMiniCanvas,
  setCanvasZoom
} from './renderFlowCanvas';

export function renderAll(context: BuilderAppContext): void {
  const { state, elements } = context;
  elements.diagramType.value = state.diagramType;
  elements.direction.value = state.direction;
  elements.source.value = state.source || '';
  elements.canvasZoomReset.textContent = `${Math.round((state.canvasView.zoom || 1) * 100)}%`;
  renderModeVisibility(context);
  renderEditorStatus(context);
  renderFlowQuickOptions(context);
  renderFlowNodeCards(context);
  renderFlowEdgeCards(context);
  renderParticipantsQuickOptions(context);
  renderParticipantCards(context);
  renderMessageCards(context);
  renderValidation(context);
  renderMiniCanvas(context);
  updateActionButtons(context);
}

export function updateActionButtons(context: BuilderAppContext): void {
  const { state, elements } = context;
  const hasSource = Boolean(elements.source.value.trim());
  const canInsert = state.editorStatus.canInsert && hasSource;
  const hasCanvasOverview = state.diagramType === 'flowchart' || state.diagramType === 'sequence';
  elements.insert.disabled = !canInsert;
  elements.createFile.disabled = !hasSource;
  elements.copy.disabled = !hasSource;
  elements.renderSource.disabled = !hasSource;
  elements.addEdge.disabled = state.nodes.length < 2;
  elements.addMessage.disabled = state.participants.length < 2;
  elements.canvasZoomOut.disabled = !hasCanvasOverview;
  elements.canvasZoomReset.disabled = !hasCanvasOverview;
  elements.canvasZoomIn.disabled = !hasCanvasOverview;
  elements.canvasFit.disabled = !hasCanvasOverview;
}

export function wireEvents(context: BuilderAppContext): void {
  const { state, elements, vscode, defaultState } = context;

  elements.diagramType.value = state.diagramType;
  elements.direction.value = state.direction;

  elements.diagramType.addEventListener('change', () => {
    state.diagramType = elements.diagramType.value === 'sequence' ? 'sequence' : 'flowchart';
    state.preset = 'starter';
    context.loadPreset(state.preset);
  });

  elements.direction.addEventListener('change', () => {
    state.direction = elements.direction.value as BuilderAppContext['state']['direction'];
    context.regenerateFromBuilder();
  });

  elements.quickNodeLabel.addEventListener('input', () => {
    if (!elements.quickNodeId.dataset.userEdited) {
      elements.quickNodeId.value = createUniqueFlowNodeId(state, elements.quickNodeLabel.value || 'Node');
    }
  });
  elements.quickNodeId.addEventListener('input', () => {
    elements.quickNodeId.dataset.userEdited = elements.quickNodeId.value.trim() ? 'true' : '';
  });

  elements.quickParticipantLabel.addEventListener('input', () => {
    if (!elements.quickParticipantId.dataset.userEdited) {
      elements.quickParticipantId.value = createUniqueParticipantId(state, elements.quickParticipantLabel.value || 'Actor');
    }
  });
  elements.quickParticipantId.addEventListener('input', () => {
    elements.quickParticipantId.dataset.userEdited = elements.quickParticipantId.value.trim() ? 'true' : '';
  });

  elements.loadPreset.addEventListener('click', () => context.loadPreset(elements.preset.value || 'starter'));
  elements.clear.addEventListener('click', () => context.loadPreset('blank'));
  elements.importActiveDocument.addEventListener('click', () => vscode.postMessage({ type: 'importActiveDocument' }));
  elements.openPreview.addEventListener('click', () => vscode.postMessage({ type: 'openPreview' }));
  elements.refreshContext.addEventListener('click', () => vscode.postMessage({ type: 'requestEditorStatus' }));

  elements.addNode.addEventListener('click', () => addNodeFromQuickForm(context));
  elements.addEdge.addEventListener('click', () => addEdgeFromQuickForm(context));
  elements.addParticipant.addEventListener('click', () => addParticipantFromQuickForm(context));
  elements.addMessage.addEventListener('click', () => addMessageFromQuickForm(context));
  elements.canvasZoomOut.addEventListener('click', () => setCanvasZoom(context, state.canvasView.zoom / 1.2));
  elements.canvasZoomReset.addEventListener('click', () => setCanvasZoom(context, 1));
  elements.canvasZoomIn.addEventListener('click', () => setCanvasZoom(context, state.canvasView.zoom * 1.2));
  elements.canvasFit.addEventListener('click', () => fitCanvasToView(context));

  elements.generate.addEventListener('click', context.regenerateFromBuilder);
  elements.renderSource.addEventListener('click', () => {
    state.source = elements.source.value;
    context.persistState();
    void context.renderCurrentSource();
  });
  elements.copy.addEventListener('click', () => vscode.postMessage({ type: 'copy', mermaid: elements.source.value }));
  elements.insert.addEventListener('click', () => vscode.postMessage({ type: 'insert', mermaid: elements.source.value }));
  elements.createFile.addEventListener('click', () => vscode.postMessage({ type: 'createFile', mermaid: elements.source.value }));
  elements.source.addEventListener('input', () => {
    state.source = elements.source.value;
    context.persistState();
    updateActionButtons(context);
  });

  elements.flowCanvas.addEventListener('mousedown', (event) => onCanvasPanStart(context, event));
  window.addEventListener('mousemove', (event) => onCanvasDragMove(context, event));
  window.addEventListener('mouseup', () => onCanvasDragEnd(context));
  window.addEventListener('mousemove', (event) => onCanvasPanMove(context, event));
  window.addEventListener('mouseup', () => onCanvasPanEnd(context));

  window.addEventListener('message', (event) => {
    const message = event.data || {};
    if (message.type === 'editorStatus') {
      state.editorStatus = message.status || defaultState.editorStatus;
      renderEditorStatus(context);
      updateActionButtons(context);
      context.persistState();
    }
  });
}

function renderModeVisibility(context: BuilderAppContext): void {
  const { state, elements } = context;
  const flow = state.diagramType === 'flowchart';
  toggleHidden(elements.flowSettingsSection, !flow);
  toggleHidden(elements.flowNodesSection, !flow);
  toggleHidden(elements.flowEdgesSection, !flow);
  toggleHidden(elements.sequenceSettingsSection, flow);
  toggleHidden(elements.sequenceParticipantsSection, flow);
  toggleHidden(elements.sequenceMessagesSection, flow);
}

function renderEditorStatus(context: BuilderAppContext): void {
  const { state, elements } = context;
  elements.editorSummary.textContent = state.editorStatus.summary;
  elements.editorDetail.textContent = state.editorStatus.detail;
  elements.importStatus.textContent = state.importStatus || '';
  elements.statusCard.classList.toggle('blocked', !state.editorStatus.canInsert);
}

function renderValidation(context: BuilderAppContext): void {
  const { state, elements } = context;
  if (state.diagramType === 'flowchart') {
    const issues = validateFlowState(state);
    elements.nodeCount.value = String(state.nodes.length);
    elements.edgeCount.value = String(state.edges.length);
    setValidationUI(elements.validationSummary, elements.validationList, issues);
  } else {
    const issues = validateSequenceState(state);
    elements.participantCount.value = String(state.participants.length);
    elements.messageCount.value = String(state.messages.length);
    setValidationUI(elements.sequenceValidationSummary, elements.sequenceValidationList, issues);
  }
}

function setValidationUI(summaryEl: HTMLElement, listEl: HTMLElement, issues: string[]): void {
  if (!issues.length) {
    summaryEl.textContent = 'No validation issues.';
    listEl.classList.add('hidden');
    listEl.innerHTML = '';
    return;
  }
  summaryEl.textContent = `${issues.length} validation issue${issues.length === 1 ? '' : 's'} found.`;
  listEl.classList.remove('hidden');
  listEl.innerHTML = issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join('');
}

function renderFlowQuickOptions(context: BuilderAppContext): void {
  const { state, elements } = context;
  const options = state.nodes
    .map((node) => `<option value="${escapeHtml(node.id)}">${escapeHtml(node.id)} · ${escapeHtml(node.label)}</option>`)
    .join('');
  elements.quickEdgeFrom.innerHTML = options;
  elements.quickEdgeTo.innerHTML = options;
  if (state.nodes[0]) {
    elements.quickEdgeFrom.value = state.nodes[0].id;
  }
  if (state.nodes[1]) {
    elements.quickEdgeTo.value = state.nodes[1].id;
  } else if (state.nodes[0]) {
    elements.quickEdgeTo.value = state.nodes[0].id;
  }
}

function renderFlowNodeCards(context: BuilderAppContext): void {
  const { state, elements } = context;
  elements.nodes.innerHTML = '';
  state.nodes.forEach((node, index) => {
    const card = document.createElement('div');
    card.className = 'card compact-card';
    card.innerHTML = `
      <div class="card-header compact-card-header">
        <div class="card-title">Node ${index + 1}</div>
      </div>
      <div class="actions-inline compact-actions compact-actions-row">
        <button class="ghost small" data-action="move-up" data-index="${index}" title="Move up">↑</button>
        <button class="ghost small" data-action="move-down" data-index="${index}" title="Move down">↓</button>
        <button class="ghost small" data-action="duplicate" data-index="${index}" title="Duplicate">Copy</button>
        <button class="secondary small" data-action="remove" data-index="${index}" title="Remove">Del</button>
      </div>
      <div class="grid-3 compact-card-grid compact-card-grid-3">
        <div>
          <label>ID</label>
          <input data-kind="id" data-index="${index}" value="${escapeHtml(node.id)}" />
        </div>
        <div>
          <label>Label</label>
          <input data-kind="label" data-index="${index}" value="${escapeHtml(node.label)}" />
        </div>
        <div>
          <label>Shape</label>
          <select data-kind="shape" data-index="${index}">
            <option value="rectangle" ${node.shape === 'rectangle' ? 'selected' : ''}>Rectangle</option>
            <option value="rounded" ${node.shape === 'rounded' ? 'selected' : ''}>Rounded</option>
            <option value="circle" ${node.shape === 'circle' ? 'selected' : ''}>Circle</option>
            <option value="diamond" ${node.shape === 'diamond' ? 'selected' : ''}>Diamond</option>
            <option value="database" ${node.shape === 'database' ? 'selected' : ''}>Database</option>
          </select>
        </div>
      </div>`;
    elements.nodes.appendChild(card);
  });

  elements.nodes.querySelectorAll('input, select').forEach((element) => {
    element.addEventListener('input', (event) => onFlowNodeChange(context, event));
    element.addEventListener('change', (event) => onFlowNodeChange(context, event));
  });

  elements.nodes.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number((button as HTMLElement).dataset.index);
      const action = (button as HTMLElement).dataset.action;
      if (action === 'remove') {
        const removed = state.nodes[index];
        state.nodes.splice(index, 1);
        state.edges = state.edges.filter((edge) => edge.from !== removed.id && edge.to !== removed.id);
      }
      if (action === 'duplicate') {
        const node = state.nodes[index];
        state.nodes.splice(index + 1, 0, {
          ...JSON.parse(JSON.stringify(node)),
          id: createUniqueFlowNodeId(state, `${node.id}_copy`),
          label: `${node.label} Copy`,
          x: (node.x || 36) + 24,
          y: (node.y || 36) + 24
        });
      }
      if (action === 'move-up') {
        moveItem(state.nodes, index, index - 1);
      }
      if (action === 'move-down') {
        moveItem(state.nodes, index, index + 1);
      }
      context.renderAll();
      context.regenerateFromBuilder();
    });
  });
}

function renderFlowEdgeCards(context: BuilderAppContext): void {
  const { state, elements } = context;
  elements.edges.innerHTML = '';
  state.edges.forEach((edge, index) => {
    const optionsFrom = state.nodes
      .map((node) => `<option value="${escapeHtml(node.id)}" ${node.id === edge.from ? 'selected' : ''}>${escapeHtml(node.id)} · ${escapeHtml(node.label)}</option>`)
      .join('');
    const optionsTo = state.nodes
      .map((node) => `<option value="${escapeHtml(node.id)}" ${node.id === edge.to ? 'selected' : ''}>${escapeHtml(node.id)} · ${escapeHtml(node.label)}</option>`)
      .join('');
    const card = document.createElement('div');
    card.className = 'card compact-card';
    card.innerHTML = `
      <div class="card-header compact-card-header">
        <div class="card-title">Edge ${index + 1}</div>
      </div>
      <div class="actions-inline compact-actions compact-actions-row">
        <button class="ghost small" data-action="move-up" data-index="${index}" title="Move up">↑</button>
        <button class="ghost small" data-action="move-down" data-index="${index}" title="Move down">↓</button>
        <button class="ghost small" data-action="reverse" data-index="${index}" title="Reverse">Flip</button>
        <button class="secondary small" data-action="remove" data-index="${index}" title="Remove">Del</button>
      </div>
      <div class="grid-2 compact-card-grid compact-card-grid-2">
        <div>
          <label>From</label>
          <select data-kind="from" data-index="${index}">${optionsFrom}</select>
        </div>
        <div>
          <label>To</label>
          <select data-kind="to" data-index="${index}">${optionsTo}</select>
        </div>
        <div>
          <label>Style</label>
          <select data-kind="style" data-index="${index}">
            <option value="solid" ${edge.style === 'solid' ? 'selected' : ''}>Solid</option>
            <option value="dotted" ${edge.style === 'dotted' ? 'selected' : ''}>Dotted</option>
          </select>
        </div>
        <div>
          <label>Label</label>
          <input data-kind="label" data-index="${index}" value="${escapeHtml(edge.label || '')}" placeholder="optional" />
        </div>
      </div>`;
    elements.edges.appendChild(card);
  });

  elements.edges.querySelectorAll('input, select').forEach((element) => {
    element.addEventListener('input', (event) => onFlowEdgeChange(context, event));
    element.addEventListener('change', (event) => onFlowEdgeChange(context, event));
  });

  elements.edges.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number((button as HTMLElement).dataset.index);
      const action = (button as HTMLElement).dataset.action;
      if (action === 'remove') {
        state.edges.splice(index, 1);
      }
      if (action === 'reverse') {
        const edge = state.edges[index];
        state.edges[index] = { ...edge, from: edge.to, to: edge.from };
      }
      if (action === 'move-up') {
        moveItem(state.edges, index, index - 1);
      }
      if (action === 'move-down') {
        moveItem(state.edges, index, index + 1);
      }
      context.renderAll();
      context.regenerateFromBuilder();
    });
  });
}

function renderParticipantsQuickOptions(context: BuilderAppContext): void {
  const { state, elements } = context;
  const options = state.participants
    .map((participant) => `<option value="${escapeHtml(participant.id)}">${escapeHtml(participant.id)} · ${escapeHtml(participant.label)}</option>`)
    .join('');
  elements.quickMessageFrom.innerHTML = options;
  elements.quickMessageTo.innerHTML = options;
  if (state.participants[0]) {
    elements.quickMessageFrom.value = state.participants[0].id;
  }
  if (state.participants[1]) {
    elements.quickMessageTo.value = state.participants[1].id;
  } else if (state.participants[0]) {
    elements.quickMessageTo.value = state.participants[0].id;
  }
}

function renderParticipantCards(context: BuilderAppContext): void {
  const { state, elements } = context;
  elements.participants.innerHTML = '';
  state.participants.forEach((participant, index) => {
    const card = document.createElement('div');
    card.className = 'card compact-card';
    card.innerHTML = `
      <div class="card-header compact-card-header">
        <div class="card-title">Participant ${index + 1}</div>
      </div>
      <div class="actions-inline compact-actions compact-actions-row">
        <button class="ghost small" data-action="move-up" data-index="${index}" title="Move up">↑</button>
        <button class="ghost small" data-action="move-down" data-index="${index}" title="Move down">↓</button>
        <button class="ghost small" data-action="duplicate" data-index="${index}" title="Duplicate">Copy</button>
        <button class="secondary small" data-action="remove" data-index="${index}" title="Remove">Del</button>
      </div>
      <div class="grid-2 compact-card-grid compact-card-grid-2">
        <div>
          <label>ID</label>
          <input data-kind="id" data-index="${index}" value="${escapeHtml(participant.id)}" />
        </div>
        <div>
          <label>Label</label>
          <input data-kind="label" data-index="${index}" value="${escapeHtml(participant.label)}" />
        </div>
      </div>`;
    elements.participants.appendChild(card);
  });

  elements.participants.querySelectorAll('input').forEach((element) => {
    element.addEventListener('input', (event) => onParticipantChange(context, event));
    element.addEventListener('change', (event) => onParticipantChange(context, event));
  });

  elements.participants.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number((button as HTMLElement).dataset.index);
      const action = (button as HTMLElement).dataset.action;
      if (action === 'remove') {
        const removed = state.participants[index];
        state.participants.splice(index, 1);
        state.messages = state.messages.filter((message) => message.from !== removed.id && message.to !== removed.id);
      }
      if (action === 'duplicate') {
        const participant = state.participants[index];
        state.participants.splice(index + 1, 0, {
          id: createUniqueParticipantId(state, `${participant.id}_copy`),
          label: `${participant.label} Copy`
        });
      }
      if (action === 'move-up') {
        moveItem(state.participants, index, index - 1);
      }
      if (action === 'move-down') {
        moveItem(state.participants, index, index + 1);
      }
      context.renderAll();
      context.regenerateFromBuilder();
    });
  });
}

function renderMessageCards(context: BuilderAppContext): void {
  const { state, elements } = context;
  elements.messages.innerHTML = '';
  state.messages.forEach((message, index) => {
    const fromOptions = state.participants
      .map((participant) => `<option value="${escapeHtml(participant.id)}" ${participant.id === message.from ? 'selected' : ''}>${escapeHtml(participant.id)} · ${escapeHtml(participant.label)}</option>`)
      .join('');
    const toOptions = state.participants
      .map((participant) => `<option value="${escapeHtml(participant.id)}" ${participant.id === message.to ? 'selected' : ''}>${escapeHtml(participant.id)} · ${escapeHtml(participant.label)}</option>`)
      .join('');
    const card = document.createElement('div');
    card.className = 'card compact-card';
    card.innerHTML = `
      <div class="card-header compact-card-header">
        <div class="card-title">Message ${index + 1}</div>
      </div>
      <div class="actions-inline compact-actions compact-actions-row">
        <button class="ghost small" data-action="move-up" data-index="${index}" title="Move up">↑</button>
        <button class="ghost small" data-action="move-down" data-index="${index}" title="Move down">↓</button>
        <button class="ghost small" data-action="reverse" data-index="${index}" title="Reverse">Flip</button>
        <button class="secondary small" data-action="remove" data-index="${index}" title="Remove">Del</button>
      </div>
      <div class="grid-2 compact-card-grid compact-card-grid-2">
        <div>
          <label>From</label>
          <select data-kind="from" data-index="${index}">${fromOptions}</select>
        </div>
        <div>
          <label>To</label>
          <select data-kind="to" data-index="${index}">${toOptions}</select>
        </div>
        <div>
          <label>Style</label>
          <select data-kind="style" data-index="${index}">
            <option value="solid" ${message.style === 'solid' ? 'selected' : ''}>Request</option>
            <option value="dashed" ${message.style === 'dashed' ? 'selected' : ''}>Response</option>
          </select>
        </div>
        <div>
          <label>Label</label>
          <input data-kind="label" data-index="${index}" value="${escapeHtml(message.label || '')}" placeholder="optional" />
        </div>
      </div>`;
    elements.messages.appendChild(card);
  });

  elements.messages.querySelectorAll('input, select').forEach((element) => {
    element.addEventListener('input', (event) => onMessageChange(context, event));
    element.addEventListener('change', (event) => onMessageChange(context, event));
  });

  elements.messages.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number((button as HTMLElement).dataset.index);
      const action = (button as HTMLElement).dataset.action;
      if (action === 'remove') {
        state.messages.splice(index, 1);
      }
      if (action === 'reverse') {
        const current = state.messages[index];
        state.messages[index] = {
          ...current,
          from: current.to,
          to: current.from,
          style: current.style === 'solid' ? 'dashed' : 'solid'
        };
      }
      if (action === 'move-up') {
        moveItem(state.messages, index, index - 1);
      }
      if (action === 'move-down') {
        moveItem(state.messages, index, index + 1);
      }
      context.renderAll();
      context.regenerateFromBuilder();
    });
  });
}

function onFlowNodeChange(context: BuilderAppContext, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const index = Number(target.dataset.index);
  const kind = target.dataset.kind;
  const node = context.state.nodes[index];
  if (!node || !kind) {
    return;
  }

  if (kind === 'id') {
    const previousId = node.id;
    const nextId = ensureUniqueFlowNodeId(context.state, sanitizeId(target.value) || `Node_${index + 1}`, index);
    node.id = nextId;
    target.value = nextId;
    context.state.edges.forEach((edge) => {
      if (edge.from === previousId) {
        edge.from = nextId;
      }
      if (edge.to === previousId) {
        edge.to = nextId;
      }
    });
    if (context.state.canvasSelection.sourceId === previousId) {
      context.state.canvasSelection.sourceId = nextId;
    }
  } else if (kind === 'label') {
    node.label = target.value;
  } else if (kind === 'shape') {
    node.shape = target.value as typeof node.shape;
  }
  context.renderAll();
  context.regenerateFromBuilder();
}

function onFlowEdgeChange(context: BuilderAppContext, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const index = Number(target.dataset.index);
  const kind = target.dataset.kind as 'from' | 'to' | 'style' | 'label' | undefined;
  const edge = context.state.edges[index];
  if (!edge || !kind) {
    return;
  }
  if (kind === 'from' || kind === 'to' || kind === 'label') {
    edge[kind] = target.value;
  } else if (kind === 'style') {
    edge.style = target.value as 'solid' | 'dotted';
  }
  context.regenerateFromBuilder();
}

function onParticipantChange(context: BuilderAppContext, event: Event): void {
  const target = event.target as HTMLInputElement;
  const index = Number(target.dataset.index);
  const kind = target.dataset.kind;
  const participant = context.state.participants[index];
  if (!participant || !kind) {
    return;
  }
  if (kind === 'id') {
    const previousId = participant.id;
    const nextId = ensureUniqueParticipantId(context.state, sanitizeId(target.value) || `Actor_${index + 1}`, index);
    participant.id = nextId;
    target.value = nextId;
    context.state.messages.forEach((message) => {
      if (message.from === previousId) {
        message.from = nextId;
      }
      if (message.to === previousId) {
        message.to = nextId;
      }
    });
  } else if (kind === 'label') {
    participant.label = target.value;
  }
  context.renderAll();
  context.regenerateFromBuilder();
}

function onMessageChange(context: BuilderAppContext, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const index = Number(target.dataset.index);
  const kind = target.dataset.kind as 'from' | 'to' | 'style' | 'label' | undefined;
  const message = context.state.messages[index];
  if (!message || !kind) {
    return;
  }
  if (kind === 'from' || kind === 'to' || kind === 'label') {
    message[kind] = target.value;
  } else if (kind === 'style') {
    message.style = target.value as 'solid' | 'dashed';
  }
  context.regenerateFromBuilder();
}

function addNodeFromQuickForm(context: BuilderAppContext): void {
  const { state, elements } = context;
  const label = (elements.quickNodeLabel.value || '').trim() || `Node ${state.nodes.length + 1}`;
  const requestedId = (elements.quickNodeId.value || '').trim();
  const id = createUniqueFlowNodeId(state, requestedId || label);
  state.nodes.push({
    id,
    label,
    shape: elements.quickNodeShape.value as 'rectangle' | 'rounded' | 'circle' | 'diamond' | 'database',
    x: 36 + (state.nodes.length % 3) * 128,
    y: 32 + Math.floor(state.nodes.length / 3) * 96
  });
  elements.quickNodeLabel.value = '';
  elements.quickNodeId.value = '';
  delete elements.quickNodeId.dataset.userEdited;
  elements.quickNodeShape.value = 'rectangle';
  context.renderAll();
  context.regenerateFromBuilder();
}

function addEdgeFromQuickForm(context: BuilderAppContext): void {
  const { state, elements } = context;
  if (state.nodes.length < 2) {
    return;
  }
  const from = elements.quickEdgeFrom.value;
  const to = elements.quickEdgeTo.value;
  if (!from || !to) {
    return;
  }
  state.edges.push({
    from,
    to,
    style: elements.quickEdgeStyle.value as 'solid' | 'dotted',
    label: (elements.quickEdgeLabel.value || '').trim()
  });
  elements.quickEdgeLabel.value = '';
  context.renderAll();
  context.regenerateFromBuilder();
}

function addParticipantFromQuickForm(context: BuilderAppContext): void {
  const { state, elements } = context;
  const label = (elements.quickParticipantLabel.value || '').trim() || `Participant ${state.participants.length + 1}`;
  const requestedId = (elements.quickParticipantId.value || '').trim();
  const id = createUniqueParticipantId(state, requestedId || label);
  state.participants.push({ id, label });
  elements.quickParticipantLabel.value = '';
  elements.quickParticipantId.value = '';
  delete elements.quickParticipantId.dataset.userEdited;
  context.renderAll();
  context.regenerateFromBuilder();
}

function addMessageFromQuickForm(context: BuilderAppContext): void {
  const { state, elements, vscode } = context;
  if (state.participants.length < 2) {
    return;
  }
  const from = elements.quickMessageFrom.value;
  const to = elements.quickMessageTo.value;
  const label = (elements.quickMessageLabel.value || '').trim();
  if (!from || !to) {
    return;
  }
  if (!label) {
    vscode.postMessage({ type: 'showError', message: 'Sequence messages need a label.' });
    return;
  }
  state.messages.push({
    from,
    to,
    style: elements.quickMessageStyle.value as 'solid' | 'dashed',
    label
  });
  elements.quickMessageLabel.value = '';
  context.renderAll();
  context.regenerateFromBuilder();
}
