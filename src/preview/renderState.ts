export interface PreviewRenderEntry {
  title: string;
  svg: string;
}

export interface PreviewRenderState {
  activeSvg?: string;
  entries: PreviewRenderEntry[];
}

export function createFallbackPreviewRenderState(lastSvg?: string): PreviewRenderState {
  const normalizedSvg = typeof lastSvg === 'string' && lastSvg.trim().length > 0 ? lastSvg : undefined;
  return {
    activeSvg: normalizedSvg,
    entries: normalizedSvg ? [{ title: 'Current diagram', svg: normalizedSvg }] : []
  };
}

export function normalizePreviewRenderState(message: unknown): PreviewRenderState {
  const candidate = (message || {}) as { activeSvg?: unknown; entries?: unknown };
  const entries = Array.isArray(candidate.entries)
    ? candidate.entries.filter((entry): entry is PreviewRenderEntry => {
        return Boolean(
          entry &&
          typeof entry === 'object' &&
          typeof (entry as PreviewRenderEntry).title === 'string' &&
          typeof (entry as PreviewRenderEntry).svg === 'string'
        );
      })
    : [];

  return {
    activeSvg: typeof candidate.activeSvg === 'string' && candidate.activeSvg.trim().length > 0
      ? candidate.activeSvg
      : undefined,
    entries
  };
}
