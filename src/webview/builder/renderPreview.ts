import { BuilderAppContext } from './types';
import { escapeHtml } from './utils';

export async function renderCurrentSource(context: BuilderAppContext): Promise<void> {
  const code = context.elements.source.value.trim();
  if (!code) {
    context.elements.preview.innerHTML = '<span class="meta">No Mermaid source to render yet.</span>';
    context.elements.previewStatus.textContent = 'No source';
    return;
  }

  try {
    const renderId = `builder-${Date.now()}`;
    const result = await context.mermaid.render(renderId, code);
    if (context.elements.source.value.trim() !== code) {
      return;
    }
    context.elements.preview.innerHTML = result.svg;
    context.elements.previewStatus.textContent = 'Rendered successfully';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const sourceHtml = escapeHtml(code);
    context.elements.preview.innerHTML = `<div class="preview-error">${escapeHtml(message)}</div><pre class="preview-error-source">${sourceHtml}</pre>`;
    context.elements.previewStatus.textContent = 'Render error';
  }
}
