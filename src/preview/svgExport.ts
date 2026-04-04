import { PreviewRenderEntry, PreviewRenderState } from './renderState';

export type SvgExportEntry = PreviewRenderEntry;
export type SvgExportRenderState = PreviewRenderState;

export function getExportableSvgEntries(renderState: SvgExportRenderState): SvgExportEntry[] {
  return renderState.entries.filter((entry) => typeof entry.svg === 'string' && entry.svg.trim().length > 0);
}

export function selectSvgExports(renderState: SvgExportRenderState, mode: 'current' | 'all'): SvgExportEntry[] {
  const entries = getExportableSvgEntries(renderState);
  if (mode === 'all') {
    return entries;
  }

  const activeSvg = typeof renderState.activeSvg === 'string' && renderState.activeSvg.trim().length > 0
    ? renderState.activeSvg
    : undefined;

  if (activeSvg) {
    const matchingEntry = entries.find((entry) => entry.svg === activeSvg);
    return [{ title: matchingEntry?.title ?? 'Current diagram', svg: activeSvg }];
  }

  return entries.length > 0 ? [entries[0]] : [];
}

export function prepareSvgForExport(svg: string): string {
  const trimmed = svg.trim();
  if (!trimmed.startsWith('<svg')) {
    return svg;
  }

  let output = trimmed;
  let rootAttrs = '';

  if (!/\sxmlns=/.test(output)) {
    output = output.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  output = output.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    rootAttrs = attrs;
    const styleMatch = attrs.match(/\sstyle=(['"])(.*?)\1/);
    const exportSvgStyle = 'background:#ffffff;color:#111827;';

    if (styleMatch) {
      const existingStyle = styleMatch[2].trim();
      const mergedStyle = mergeInlineStyles(existingStyle, exportSvgStyle);
      const mergedAttrs = attrs.replace(/\sstyle=(['"])(.*?)\1/, ` style="${mergedStyle}"`);
      rootAttrs = mergedAttrs;
      return `<svg${mergedAttrs}>`;
    }

    rootAttrs = `${attrs} style="${exportSvgStyle}"`;
    return `<svg${rootAttrs}>`;
  });

  const exportStyle = [
    '<style>',
    'text, tspan, .label, .nodeLabel, .edgeLabel text, .messageText, .loopText, .noteText, .actor { fill: #111827 !important; color: #111827 !important; }',
    'foreignObject, foreignObject div, foreignObject span, foreignObject p, .nodeLabel p, .nodeLabel div, .markdown-node-label, .markdown-node-label p { color: #111827 !important; fill: #111827 !important; background: transparent !important; }',
    'line, path, polyline, polygon { stroke: #1f2937 !important; }',
    'marker path, .marker path { fill: #1f2937 !important; stroke: #1f2937 !important; }',
    '.edgeLabel rect, .labelBkg, .label-container { fill: #ffffff !important; opacity: 1 !important; }',
    '</style>'
  ].join('');

  const backgroundRect = createBackgroundRect(rootAttrs);
  output = output.replace(/<svg\b[^>]*>/, (match) => `${match}${backgroundRect}${exportStyle}`);
  output = flattenForeignObjectLabels(output);
  output = injectInlineForeignObjectTextStyles(output);

  return `${output}\n`;
}

function mergeInlineStyles(existing: string, extra: string): string {
  const normalizedExisting = existing.trim().replace(/;?\s*$/, ';');
  const normalizedExtra = extra.trim().replace(/^\s*;?/, '').replace(/;?\s*$/, ';');
  return `${normalizedExisting}${normalizedExtra}`;
}

function createBackgroundRect(rootAttrs: string): string {
  const viewBoxMatch = rootAttrs.match(/\sviewBox=(['"])(.*?)\1/);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[2].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
      const [x, y, width, height] = parts;
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#ffffff"></rect>`;
    }
  }

  return '<rect width="100%" height="100%" fill="#ffffff"></rect>';
}

function injectInlineForeignObjectTextStyles(svg: string): string {
  if (!svg.includes('<foreignObject')) {
    return svg;
  }

  const textStyle = 'color:#111827;fill:#111827;background:transparent;';
  return svg.replace(/<(div|span|p)\b([^>]*)>/g, (_match, tagName: string, attrs: string) => {
    const styleMatch = attrs.match(/\sstyle=(['"])(.*?)\1/);
    if (styleMatch) {
      const mergedStyle = mergeInlineStyles(styleMatch[2], textStyle);
      const mergedAttrs = attrs.replace(/\sstyle=(['"])(.*?)\1/, ` style="${mergedStyle}"`);
      return `<${tagName}${mergedAttrs}>`;
    }

    return `<${tagName}${attrs} style="${textStyle}">`;
  });
}

function flattenForeignObjectLabels(svg: string): string {
  if (!svg.includes('<foreignObject')) {
    return svg;
  }

  return svg.replace(/<foreignObject\b([^>]*)>([\s\S]*?)<\/foreignObject>/g, (_match, attrs: string, inner: string) => {
    const width = parseNumericAttribute(attrs, 'width') ?? 0;
    const height = parseNumericAttribute(attrs, 'height') ?? 0;
    const x = parseNumericAttribute(attrs, 'x') ?? 0;
    const y = parseNumericAttribute(attrs, 'y') ?? 0;
    const className = extractClassName(inner);
    const lines = extractForeignObjectTextLines(inner);

    if (!lines.length) {
      return '';
    }

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const classAttr = className ? ` class="${escapeXmlAttribute(className)}"` : '';
    const commonAttrs = `${classAttr} fill="#111827" text-anchor="middle" dominant-baseline="middle" style="fill:#111827;color:#111827;"`;

    if (lines.length === 1) {
      return `<text x="${centerX}" y="${centerY}"${commonAttrs}>${escapeXmlText(lines[0])}</text>`;
    }

    const firstDy = `${-((lines.length - 1) * 0.6)}em`;
    const tspans = lines
      .map((line, index) => `<tspan x="${centerX}" dy="${index === 0 ? firstDy : '1.2em'}">${escapeXmlText(line)}</tspan>`)
      .join('');
    return `<text x="${centerX}" y="${centerY}"${commonAttrs}>${tspans}</text>`;
  });
}

function extractForeignObjectTextLines(inner: string): string[] {
  const paragraphMatches = [...inner.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((match) => decodeHtmlEntities(stripHtmlTags(match[1])));
  if (paragraphMatches.length) {
    return paragraphMatches.map((line) => normalizeText(line)).filter(Boolean);
  }

  const withBreaks = inner.replace(/<br\s*\/?>/gi, '\n');
  const stripped = decodeHtmlEntities(stripHtmlTags(withBreaks));
  return stripped.split(/\r?\n/).map((line) => normalizeText(line)).filter(Boolean);
}

function extractClassName(inner: string): string {
  const classMatch = inner.match(/\sclass=(['"])(.*?)\1/);
  return classMatch?.[2]?.trim() || '';
}

function parseNumericAttribute(attrs: string, name: string): number | undefined {
  const match = attrs.match(new RegExp(`\\s${name}=(["'])(.*?)\\1`));
  if (!match) {
    return undefined;
  }
  const value = Number.parseFloat(match[2]);
  return Number.isFinite(value) ? value : undefined;
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ');
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value: string): string {
  const named = value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return named.replace(/&#(x?[0-9a-fA-F]+);/g, (_match, code: string) => {
    const parsed = code.startsWith('x') || code.startsWith('X')
      ? Number.parseInt(code.slice(1), 16)
      : Number.parseInt(code, 10);
    return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : _match;
  });
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value).replace(/"/g, '&quot;');
}
