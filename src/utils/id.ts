export function sanitizeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'node';
  }

  const normalized = trimmed
    .replace(/^['\"]|['\"]$/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  if (!normalized) {
    return 'node';
  }

  if (/^[0-9]/.test(normalized)) {
    return `n_${normalized}`;
  }

  return normalized;
}

export function escapeMermaidLabel(label: string): string {
  return label.replace(/\"/g, '\\\"');
}
