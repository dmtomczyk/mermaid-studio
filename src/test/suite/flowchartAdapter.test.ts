import * as assert from 'assert';
import { flowchartAdapter } from '../../canvas/families/flowchart/flowchartAdapter';

suite('flowchart adapter', () => {
  test('exposes starter flowchart templates', () => {
    const templates = flowchartAdapter.getTemplates();
    assert.ok(templates.some((entry) => entry.id === 'process'));
    assert.ok(templates.some((entry) => entry.id === 'decision'));
  });

  test('creates a starter model and emits flowchart source', () => {
    const model = flowchartAdapter.createEmptyModel();
    const source = flowchartAdapter.generateMermaid(model);
    assert.ok(source.startsWith('flowchart '));
    assert.ok(source.includes('node-1'));
    assert.ok(source.includes('-->'));
  });

  test('creates a connection through adapter contract', () => {
    const model = flowchartAdapter.createEmptyModel();
    const from = model.nodes[0]?.id;
    const to = model.nodes[1]?.id;
    assert.ok(from && to);
    const next = flowchartAdapter.createConnection(model, from!, to!);
    assert.strictEqual(next.edges.length, model.edges.length + 1);
  });

  test('parses basic flowchart syntax', () => {
    const parsed = flowchartAdapter.parseMermaid('flowchart LR\n  A[Start]\n  A --> B\n  B{Decision}\n');
    assert.strictEqual(parsed.family, 'flowchart');
    assert.strictEqual(parsed.direction, 'LR');
    assert.ok(parsed.nodes.some((entry) => entry.id === 'A'));
    assert.ok(parsed.nodes.some((entry) => entry.id === 'B'));
    assert.ok(parsed.edges.length >= 1);
  });
});
