import * as assert from 'assert';
import { suite, test } from 'mocha';
import { buildMarkdownPreviewModel, buildMermaidPreviewModel } from '../../preview/documentModel';

suite('preview document model', () => {
  test('builds a single-diagram Mermaid preview model', () => {
    const source = ['flowchart TD', '    A --> B'].join('\n');
    const model = buildMermaidPreviewModel(source, 'single.mmd', 0);

    assert.ok(model);
    assert.strictEqual(model?.blocks.length, 1);
    assert.strictEqual(model?.activeIndex, 0);
    assert.strictEqual(model?.title, 'single.mmd · 1 Mermaid diagram');
  });

  test('builds a mixed Mermaid preview model with active block by cursor line', () => {
    const source = [
      'flowchart TD',
      '    A --> B',
      '',
      'sequenceDiagram',
      '    A->>B: hi'
    ].join('\n');

    const model = buildMermaidPreviewModel(source, 'mixed.mmd', 4);

    assert.ok(model);
    assert.strictEqual(model?.blocks.length, 2);
    assert.strictEqual(model?.activeIndex, 1);
    assert.strictEqual(model?.title, 'mixed.mmd · 2 Mermaid diagrams');
  });

  test('builds a markdown preview model with nearest block selection', () => {
    const markdown = [
      '# Notes',
      '',
      '```mermaid',
      'flowchart TD',
      '    A --> B',
      '```',
      '',
      'text between blocks',
      '',
      '```mermaidjs',
      'sequenceDiagram',
      '    A->>B: hi',
      '```'
    ].join('\n');

    const model = buildMarkdownPreviewModel(markdown, 'notes.md', { line: 8, character: 0 }, 'nearest');

    assert.ok(model);
    assert.strictEqual(model?.blocks.length, 2);
    assert.strictEqual(model?.activeIndex, 1);
    assert.strictEqual(model?.title, 'notes.md · 2 Mermaid blocks');
  });

  test('returns undefined when no previewable content exists', () => {
    assert.strictEqual(buildMermaidPreviewModel('', 'empty.mmd', 0), undefined);
    assert.strictEqual(buildMarkdownPreviewModel('# Notes', 'notes.md', { line: 0, character: 0 }, 'nearest'), undefined);
  });
});
