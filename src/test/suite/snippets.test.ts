import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { suite, test } from 'mocha';

function loadJson(relativePath: string): any {
  const filePath = path.resolve(__dirname, '../../../', relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

suite('snippet coverage', () => {
  test('mermaid snippets include core starter diagram types', () => {
    const snippets = loadJson('snippets/mermaid.json');
    const required = [
      'Flowchart TD',
      'Flowchart LR',
      'Sequence Diagram',
      'Class Diagram',
      'State Diagram',
      'ER Diagram',
      'Gantt',
      'Mindmap',
      'Git Graph',
      'Architecture'
    ];

    for (const key of required) {
      assert.ok(snippets[key], `Missing snippet: ${key}`);
    }
  });

  test('markdown snippets include core starter diagram blocks', () => {
    const snippets = loadJson('snippets/markdown-mermaid.json');
    const required = [
      'Mermaid Flowchart TD Block',
      'Mermaid Flowchart LR Block',
      'Mermaid Sequence Block',
      'Mermaid Class Block',
      'Mermaid State Block',
      'Mermaid ER Block',
      'Mermaid Gantt Block',
      'Mermaid Mindmap Block',
      'Mermaid GitGraph Block',
      'Mermaid Architecture Block'
    ];

    for (const key of required) {
      assert.ok(snippets[key], `Missing markdown snippet: ${key}`);
    }
  });

  test('gantt starters use gantt directives rather than sequence syntax', () => {
    const mermaidSnippets = loadJson('snippets/mermaid.json');
    const markdownSnippets = loadJson('snippets/markdown-mermaid.json');

    const ganttStarter = mermaidSnippets['Gantt'].body.join('\n');
    const ganttMarkdownStarter = markdownSnippets['Mermaid Gantt Block'].body.join('\n');

    assert.ok(ganttStarter.includes('gantt'));
    assert.ok(ganttStarter.includes('dateFormat YYYY-MM-DD'));
    assert.ok(!ganttStarter.includes('participant'));

    assert.ok(ganttMarkdownStarter.includes('gantt'));
    assert.ok(ganttMarkdownStarter.includes('dateFormat YYYY-MM-DD'));
    assert.ok(!ganttMarkdownStarter.includes('participant'));
  });

  test('markdown snippets use mermaid fences for broad compatibility', () => {
    const markdownSnippets = loadJson('snippets/markdown-mermaid.json');
    for (const snippet of Object.values<any>(markdownSnippets)) {
      const firstLine = Array.isArray(snippet.body) ? snippet.body[0] : '';
      assert.strictEqual(firstLine, '```mermaid');
    }
  });
});
