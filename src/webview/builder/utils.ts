export function sanitizeId(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }
  const normalized = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  if (!normalized) {
    return '';
  }
  return /^[0-9]/.test(normalized) ? `n_${normalized}` : normalized;
}

export function escapeMermaidInline(value: string): string {
  return String(value || '')
    .replace(/\r?\n|\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\|/g, '&#124;')
    .replace(/"/g, '\\"');
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function toggleHidden(element: HTMLElement, hidden: boolean): void {
  element.classList.toggle('hidden', hidden);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing builder element: ${id}`);
  }
  return element as T;
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): void {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return;
  }
  const [item] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, item);
}
