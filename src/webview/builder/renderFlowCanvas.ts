import { renderSequenceOverview } from './renderSequenceOverview';
import { BuilderAppContext } from './types';
import { clamp } from './utils';

export function renderMiniCanvas(context: BuilderAppContext): void {
  const { state, elements } = context;
  const scrollLeft = elements.flowCanvas.scrollLeft;
  const scrollTop = elements.flowCanvas.scrollTop;
  const zoom = clamp(state.canvasView.zoom || 1, 0.4, 2.5);
  state.canvasView.zoom = zoom;
  elements.flowCanvas.innerHTML = '<div class="canvas-hint">Drag empty space to pan · zoom supported</div>';

  if (state.diagramType === 'sequence') {
    renderSequenceOverview(context, scrollLeft, scrollTop, zoom);
    return;
  }

  if (state.diagramType !== 'flowchart' || !state.nodes.length) {
    const empty = document.createElement('div');
    empty.className = 'meta';
    empty.style.padding = '16px';
    empty.textContent = state.diagramType === 'flowchart'
      ? 'Add nodes to use the mini canvas.'
      : 'Canvas overview is available for flowcharts and sequence diagrams.';
    elements.flowCanvas.appendChild(empty);
    return;
  }

  const surface = document.createElement('div');
  surface.className = 'canvas-surface';
  const content = document.createElement('div');
  content.className = 'canvas-content';
  surface.appendChild(content);
  elements.flowCanvas.appendChild(surface);

  const positions = new Map<string, { x: number; y: number }>();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;

  state.nodes.forEach((node, index) => {
    const x = typeof node.x === 'number' ? node.x : 32 + (index % 3) * 128;
    const y = typeof node.y === 'number' ? node.y : 28 + Math.floor(index / 3) * 92;
    node.x = x;
    node.y = y;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    positions.set(node.id, { x, y });
  });

  if (minX < 16 || minY < 16) {
    const shiftX = minX < 16 ? 16 - minX : 0;
    const shiftY = minY < 16 ? 16 - minY : 0;
    state.nodes.forEach((node) => {
      node.x = (node.x || 0) + shiftX;
      node.y = (node.y || 0) + shiftY;
    });
    return renderMiniCanvas(context);
  }

  const compactCanvas = (elements.flowCanvas.clientWidth || 0) <= 340;
  const viewportWidth = Math.max(elements.flowCanvas.clientWidth || 0, compactCanvas ? 240 : 300);
  const viewportHeight = Math.max(elements.flowCanvas.clientHeight || 0, compactCanvas ? 180 : 220);
  const rawWidth = Math.max(viewportWidth / zoom, maxX + (compactCanvas ? 120 : 180));
  const rawHeight = Math.max(viewportHeight / zoom, maxY + 96);
  surface.style.width = `${Math.max(viewportWidth, rawWidth * zoom)}px`;
  surface.style.height = `${Math.max(viewportHeight, rawHeight * zoom)}px`;
  content.style.width = `${rawWidth}px`;
  content.style.height = `${rawHeight}px`;
  content.style.transform = `scale(${zoom})`;

  state.edges.forEach((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) {
      return;
    }
    const line = document.createElement('div');
    line.className = 'canvas-line';
    const xOffset = compactCanvas ? 40 : 48;
    const yOffset = compactCanvas ? 16 : 18;
    const x1 = from.x + xOffset;
    const y1 = from.y + yOffset;
    const x2 = to.x + xOffset;
    const y2 = to.y + yOffset;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.opacity = edge.style === 'dotted' ? '0.35' : '0.6';
    if (edge.style === 'dotted') {
      line.style.background = 'repeating-linear-gradient(90deg, var(--vscode-descriptionForeground), var(--vscode-descriptionForeground) 6px, transparent 6px, transparent 12px)';
    }
    content.appendChild(line);
  });

  state.nodes.forEach((node, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'canvas-node';
    if (state.canvasSelection.sourceId === node.id) {
      button.classList.add('selected');
    }
    button.style.left = `${node.x}px`;
    button.style.top = `${node.y}px`;
    button.textContent = node.label;
    button.title = 'Drag to move. Click one node, then another to fill the edge form.';
    button.dataset.index = String(index);
    setupCanvasNodeInteractions(context, button, index);
    content.appendChild(button);
  });

  elements.flowCanvas.scrollLeft = Math.min(scrollLeft, Math.max(0, surface.scrollWidth - elements.flowCanvas.clientWidth));
  elements.flowCanvas.scrollTop = Math.min(scrollTop, Math.max(0, surface.scrollHeight - elements.flowCanvas.clientHeight));
}

export function setupCanvasNodeInteractions(context: BuilderAppContext, button: HTMLButtonElement, index: number): void {
  button.addEventListener('mousedown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = context.elements.flowCanvas.getBoundingClientRect();
    const node = context.state.nodes[index];
    const zoom = context.state.canvasView.zoom || 1;
    context.canvasDrag = {
      index,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: (event.clientX - rect.left + context.elements.flowCanvas.scrollLeft) / zoom - (node.x || 0),
      offsetY: (event.clientY - rect.top + context.elements.flowCanvas.scrollTop) / zoom - (node.y || 0),
      moved: false
    };
  });
}

export function onCanvasDragMove(context: BuilderAppContext, event: MouseEvent): void {
  if (!context.canvasDrag) {
    return;
  }
  const rect = context.elements.flowCanvas.getBoundingClientRect();
  const node = context.state.nodes[context.canvasDrag.index];
  if (!node) {
    return;
  }
  if (Math.abs(event.clientX - context.canvasDrag.startX) > 3 || Math.abs(event.clientY - context.canvasDrag.startY) > 3) {
    context.canvasDrag.moved = true;
  }
  const zoom = context.state.canvasView.zoom || 1;
  const content = context.elements.flowCanvas.querySelector('.canvas-content') as HTMLElement | null;
  const maxWidth = content ? content.clientWidth - 110 : Math.max(8, rect.width / zoom - 110);
  const maxHeight = content ? content.clientHeight - 44 : Math.max(8, rect.height / zoom - 44);
  node.x = clamp((event.clientX - rect.left + context.elements.flowCanvas.scrollLeft) / zoom - context.canvasDrag.offsetX, 8, Math.max(8, maxWidth));
  node.y = clamp((event.clientY - rect.top + context.elements.flowCanvas.scrollTop) / zoom - context.canvasDrag.offsetY, 8, Math.max(8, maxHeight));
  renderMiniCanvas(context);
  context.persistState();
}

export function onCanvasDragEnd(context: BuilderAppContext): void {
  if (!context.canvasDrag) {
    return;
  }
  const { index, moved } = context.canvasDrag;
  context.canvasDrag = null;
  if (moved) {
    renderMiniCanvas(context);
    context.persistState();
    return;
  }
  const node = context.state.nodes[index];
  if (!node) {
    return;
  }
  if (!context.state.canvasSelection.sourceId) {
    context.state.canvasSelection.sourceId = node.id;
    context.elements.quickEdgeFrom.value = node.id;
    renderMiniCanvas(context);
    context.persistState();
    return;
  }
  if (context.state.canvasSelection.sourceId === node.id) {
    context.state.canvasSelection.sourceId = '';
    renderMiniCanvas(context);
    context.persistState();
    return;
  }
  context.elements.quickEdgeFrom.value = context.state.canvasSelection.sourceId;
  context.elements.quickEdgeTo.value = node.id;
  context.state.canvasSelection.sourceId = '';
  renderMiniCanvas(context);
  context.persistState();
}

export function setCanvasZoom(context: BuilderAppContext, nextZoom: number): void {
  context.state.canvasView.zoom = clamp(nextZoom, 0.4, 2.5);
  context.renderAll();
  context.persistState();
}

export function fitCanvasToView(context: BuilderAppContext): void {
  const { state, elements } = context;

  if (state.diagramType === 'sequence') {
    if (!state.participants.length) {
      setCanvasZoom(context, 1);
      return;
    }
    const rawWidth = Math.max(260, state.participants.length * 170);
    const rawHeight = Math.max(200, 90 + state.messages.length * 56);
    const viewportWidth = Math.max(elements.flowCanvas.clientWidth - 24, 220);
    const viewportHeight = Math.max(elements.flowCanvas.clientHeight - 24, 160);
    const fittedZoom = clamp(Math.min(viewportWidth / rawWidth, viewportHeight / rawHeight), 0.4, 2.5);
    state.canvasView.zoom = fittedZoom;
    context.renderAll();
    requestAnimationFrame(() => {
      elements.flowCanvas.scrollLeft = 0;
      elements.flowCanvas.scrollTop = 0;
      context.persistState();
    });
    return;
  }

  if (!state.nodes.length) {
    setCanvasZoom(context, 1);
    return;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  state.nodes.forEach((node) => {
    minX = Math.min(minX, node.x || 0);
    minY = Math.min(minY, node.y || 0);
    maxX = Math.max(maxX, (node.x || 0) + 120);
    maxY = Math.max(maxY, (node.y || 0) + 50);
  });
  const viewportWidth = Math.max(elements.flowCanvas.clientWidth - 24, 220);
  const viewportHeight = Math.max(elements.flowCanvas.clientHeight - 24, 160);
  const rawWidth = Math.max(1, maxX - minX + 32);
  const rawHeight = Math.max(1, maxY - minY + 32);
  const fittedZoom = clamp(Math.min(viewportWidth / rawWidth, viewportHeight / rawHeight), 0.4, 2.5);
  state.canvasView.zoom = fittedZoom;
  context.renderAll();
  requestAnimationFrame(() => {
    elements.flowCanvas.scrollLeft = Math.max(0, minX * fittedZoom - 12);
    elements.flowCanvas.scrollTop = Math.max(0, minY * fittedZoom - 12);
    context.persistState();
  });
}

export function onCanvasPanStart(context: BuilderAppContext, event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (target?.closest('.canvas-node')) {
    return;
  }
  context.canvasPan = {
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: context.elements.flowCanvas.scrollLeft,
    scrollTop: context.elements.flowCanvas.scrollTop
  };
  context.elements.flowCanvas.classList.add('viewport-panning');
}

export function onCanvasPanMove(context: BuilderAppContext, event: MouseEvent): void {
  if (!context.canvasPan || context.canvasDrag) {
    return;
  }
  context.elements.flowCanvas.scrollLeft = context.canvasPan.scrollLeft - (event.clientX - context.canvasPan.startX);
  context.elements.flowCanvas.scrollTop = context.canvasPan.scrollTop - (event.clientY - context.canvasPan.startY);
}

export function onCanvasPanEnd(context: BuilderAppContext): void {
  if (!context.canvasPan) {
    return;
  }
  context.canvasPan = null;
  context.elements.flowCanvas.classList.remove('viewport-panning');
}
