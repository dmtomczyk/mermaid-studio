import * as assert from 'assert';
import { suite, test } from 'mocha';
import {
  createWrappedInsertion,
  findMermaidFenceContainingPosition,
  findNearestMermaidFence,
  parseMarkdownFences,
  replaceFenceContent,
  wrapMermaidBlock
} from '../../utils/markdown';

suite('markdown helpers', () => {
  const markdown = [
    '# Notes',
    '',
    '```mermaidjs',
    'flowchart TD',
    '    A --> B',
    '```',
    '',
    'More text',
    '',
    '```mermaid',
    'sequenceDiagram',
    '    A->>B: hi',
    '```'
  ].join('\n');

  test('detects Mermaid fences', () => {
    const fences = parseMarkdownFences(markdown).filter((block) => block.isMermaid);
    assert.strictEqual(fences.length, 2);
    assert.strictEqual(fences[0].content.trim(), 'flowchart TD\n    A --> B');
  });

  test('detects cursor inside Mermaid fence', () => {
    const block = findMermaidFenceContainingPosition(markdown, { line: 3, character: 1 });
    assert.ok(block);
    assert.strictEqual(block?.startLine, 2);
  });

  test('finds nearest Mermaid fence', () => {
    const block = findNearestMermaidFence(markdown, { line: 8, character: 0 });
    assert.ok(block);
    assert.strictEqual(block?.startLine, 9);
  });

  test('wraps Mermaid content for Markdown', () => {
    const wrapped = wrapMermaidBlock('flowchart TD\n    A --> B', 'mermaidjs');
    assert.strictEqual(wrapped, '```mermaidjs\nflowchart TD\n    A --> B\n```');
  });

  test('inserts fenced Mermaid block into Markdown cleanly', () => {
    const insertion = createWrappedInsertion('# Title\nParagraph', { line: 1, character: 9 }, 'flowchart TD\n    A --> B', 'mermaidjs');
    assert.ok(insertion.replacement.includes('```mermaidjs'));
    assert.ok(insertion.replacement.startsWith('\n\n'));
  });

  test('extracts and replaces Mermaid block content without nesting fences', () => {
    const block = parseMarkdownFences(markdown).filter((candidate) => candidate.isMermaid)[0];
    const updated = replaceFenceContent(markdown, block, 'flowchart LR\n    X --> Y');
    assert.ok(updated.includes('```mermaidjs\nflowchart LR\n    X --> Y\n```'));
  });
});
