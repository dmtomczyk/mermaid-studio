import { BuilderAppContext } from './types';

export function renderSequenceOverview(context: BuilderAppContext, scrollLeft: number, scrollTop: number, zoom: number): void {
  const { state, elements } = context;

  if (!state.participants.length) {
    const empty = document.createElement('div');
    empty.className = 'meta';
    empty.style.padding = '16px';
    empty.textContent = 'Add participants to see a sequence overview.';
    elements.flowCanvas.appendChild(empty);
    return;
  }

  const surface = document.createElement('div');
  surface.className = 'canvas-surface';
  const content = document.createElement('div');
  content.className = 'canvas-content';
  surface.appendChild(content);
  elements.flowCanvas.appendChild(surface);

  const compactCanvas = (elements.flowCanvas.clientWidth || 0) <= 340;
  const laneSpacing = compactCanvas ? 132 : 170;
  const leftPad = compactCanvas ? 32 : 70;
  const topPad = compactCanvas ? 12 : 18;
  const messageTop = compactCanvas ? 64 : 84;
  const messageSpacing = compactCanvas ? 44 : 54;
  const rawWidth = Math.max(compactCanvas ? 240 : 300, leftPad * 2 + Math.max(0, state.participants.length - 1) * laneSpacing + (compactCanvas ? 88 : 120));
  const rawHeight = Math.max(compactCanvas ? 180 : 220, messageTop + Math.max(1, state.messages.length) * messageSpacing + 40);
  const viewportWidth = Math.max(elements.flowCanvas.clientWidth || 0, compactCanvas ? 240 : 300);
  const viewportHeight = Math.max(elements.flowCanvas.clientHeight || 0, compactCanvas ? 180 : 220);

  surface.style.width = `${Math.max(viewportWidth, rawWidth * zoom)}px`;
  surface.style.height = `${Math.max(viewportHeight, rawHeight * zoom)}px`;
  content.style.width = `${rawWidth}px`;
  content.style.height = `${rawHeight}px`;
  content.style.transform = `scale(${zoom})`;

  const positions = new Map<string, number>();
  state.participants.forEach((participant, index) => {
    const x = leftPad + index * laneSpacing;
    positions.set(participant.id, x);
    const laneCenterOffset = compactCanvas ? 40 : 50;

    const lane = document.createElement('div');
    lane.className = 'sequence-lane';
    lane.style.left = `${x + laneCenterOffset}px`;
    content.appendChild(lane);

    const header = document.createElement('div');
    header.className = 'sequence-header';
    header.style.left = `${x}px`;
    header.style.top = `${topPad}px`;
    header.textContent = participant.label || participant.id;
    header.title = participant.id;
    content.appendChild(header);
  });

  state.messages.forEach((message, index) => {
    const fromX = positions.get(message.from);
    const toX = positions.get(message.to);
    if (typeof fromX !== 'number' || typeof toX !== 'number') {
      return;
    }
    const y = messageTop + index * messageSpacing;
    const laneCenterOffset = compactCanvas ? 40 : 50;
    const x1 = fromX + laneCenterOffset;
    const x2 = toX + laneCenterOffset;
    const left = Math.min(x1, x2);
    const width = Math.max(14, Math.abs(x2 - x1));

    const line = document.createElement('div');
    line.className = `sequence-message ${message.style === 'dashed' ? 'dashed' : ''}`;
    line.style.left = `${left}px`;
    line.style.top = `${y}px`;
    line.style.width = `${width}px`;
    content.appendChild(line);

    const label = document.createElement('div');
    label.className = 'sequence-label';
    label.style.left = `${left + width / 2}px`;
    label.style.top = `${y - 10}px`;
    label.textContent = `${message.from} → ${message.to}${message.label ? `: ${message.label}` : ''}`;
    content.appendChild(label);
  });

  elements.flowCanvas.scrollLeft = Math.min(scrollLeft, Math.max(0, surface.scrollWidth - elements.flowCanvas.clientWidth));
  elements.flowCanvas.scrollTop = Math.min(scrollTop, Math.max(0, surface.scrollHeight - elements.flowCanvas.clientHeight));
}
