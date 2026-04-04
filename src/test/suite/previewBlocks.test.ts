import * as assert from 'assert';
import { suite, test } from 'mocha';
import {
  createMarkdownPreviewBlocks,
  getActiveMarkdownBlockIndex,
  getActiveMermaidBlockIndex,
  splitMermaidSourceIntoBlocks
} from '../../preview/blocks';

suite('preview blocks', () => {
  test('splits mixed Mermaid files into top-level diagram blocks', () => {
    const source = [
      '%% overview',
      'flowchart TD',
      '    A[Start] --> B[Middle]',
      '',
      'sequenceDiagram',
      '    participant User',
      '    participant App',
      '    User->>App: request',
      '',
      'gantt',
      '    title Sprint',
      '    dateFormat YYYY-MM-DD'
    ].join('\n');

    const blocks = splitMermaidSourceIntoBlocks(source, 'mixed.mmd');

    assert.strictEqual(blocks.length, 3);
    assert.strictEqual(blocks[0].startLine, 2);
    assert.strictEqual(blocks[0].endLine, 3);
    assert.ok(blocks[0].mermaid.startsWith('flowchart TD'));
    assert.strictEqual(blocks[1].startLine, 5);
    assert.strictEqual(blocks[1].endLine, 8);
    assert.ok(blocks[1].mermaid.startsWith('sequenceDiagram'));
    assert.strictEqual(blocks[2].startLine, 10);
    assert.strictEqual(blocks[2].endLine, 12);
    assert.ok(blocks[2].mermaid.startsWith('gantt'));
  });

  test('does not mis-detect prefixes that only start with a root keyword', () => {
    const source = [
      'graphical note',
      'sequenceDiagrammatic note',
      'flowchart TD',
      '    A --> B'
    ].join('\n');

    const blocks = splitMermaidSourceIntoBlocks(source, 'prefixes.mmd');

    assert.strictEqual(blocks.length, 1);
    assert.ok(blocks[0].mermaid.startsWith('flowchart TD'));
  });

  test('falls back to a single block when no root keyword is detected', () => {
    const source = 'A --> B';
    const blocks = splitMermaidSourceIntoBlocks(source, 'untitled.mmd');

    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].title, 'untitled.mmd');
    assert.strictEqual(blocks[0].startLine, 1);
    assert.strictEqual(blocks[0].endLine, 1);
  });

  test('selects containing block when the cursor is inside one', () => {
    const blocks = [
      { mermaid: 'flowchart TD\nA --> B', title: 'Flow', startLine: 1, endLine: 2 },
      { mermaid: 'sequenceDiagram\nA->>B: hi', title: 'Sequence', startLine: 5, endLine: 6 }
    ];

    assert.strictEqual(getActiveMermaidBlockIndex(blocks, 5), 1);
  });

  test('selects nearest block when the cursor is between blocks', () => {
    const blocks = [
      { mermaid: 'flowchart TD\nA --> B', title: 'Flow', startLine: 1, endLine: 2 },
      { mermaid: 'sequenceDiagram\nA->>B: hi', title: 'Sequence', startLine: 7, endLine: 8 }
    ];

    assert.strictEqual(getActiveMermaidBlockIndex(blocks, 3), 0);
    assert.strictEqual(getActiveMermaidBlockIndex(blocks, 5), 1);
  });

  test('creates markdown preview blocks from Mermaid fences only', () => {
    const markdown = [
      '# Notes',
      '',
      '```js',
      'console.log("ignore")',
      '```',
      '',
      '```mermaidjs',
      'flowchart TD',
      '    A --> B',
      '```',
      '',
      '```mermaid',
      'sequenceDiagram',
      '    A->>B: hi',
      '```'
    ].join('\n');

    const blocks = createMarkdownPreviewBlocks(markdown);
    assert.strictEqual(blocks.length, 2);
    assert.strictEqual(blocks[0].title, 'Lines 7-10');
    assert.ok(blocks[0].mermaid.startsWith('flowchart TD'));
    assert.strictEqual(blocks[1].title, 'Lines 12-15');
    assert.ok(blocks[1].mermaid.startsWith('sequenceDiagram'));
  });

  test('selects nearest markdown Mermaid block by cursor location', () => {
    const markdown = [
      '# Notes',
      '',
      '```mermaid',
      'flowchart TD',
      '    A --> B',
      '```',
      '',
      'middle text',
      '',
      '```mermaidjs',
      'sequenceDiagram',
      '    A->>B: hi',
      '```'
    ].join('\n');

    assert.strictEqual(getActiveMarkdownBlockIndex(markdown, { line: 3, character: 0 }, 'nearest'), 0);
    assert.strictEqual(getActiveMarkdownBlockIndex(markdown, { line: 8, character: 0 }, 'nearest'), 1);
  });

  test('containing markdown mode falls back to the first block when outside Mermaid fences', () => {
    const markdown = [
      '# Notes',
      '',
      '```mermaid',
      'flowchart TD',
      '    A --> B',
      '```',
      '',
      'plain text',
      '',
      '```mermaidjs',
      'sequenceDiagram',
      '    A->>B: hi',
      '```'
    ].join('\n');

    assert.strictEqual(getActiveMarkdownBlockIndex(markdown, { line: 7, character: 0 }, 'containing'), 0);
    assert.strictEqual(getActiveMarkdownBlockIndex(markdown, { line: 10, character: 0 }, 'containing'), 1);
  });
});
