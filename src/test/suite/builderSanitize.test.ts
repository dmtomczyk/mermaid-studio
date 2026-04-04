import * as assert from 'assert';
import { suite, test } from 'mocha';
import { sanitizeBuilderState } from '../../builder/sanitize';

suite('builder sanitize', () => {
  test('drops stale and invalid sequence data while preserving valid messages', () => {
    const state = sanitizeBuilderState({
      diagramType: 'sequence',
      direction: 'ZZ' as any,
      nodes: [{ id: 'ShouldDisappear', label: 'Node', shape: 'rectangle' }],
      edges: [{ from: 'ShouldDisappear', to: 'Other', style: 'solid' }],
      participants: [
        { id: 'User', label: 'End User' },
        { id: 'User', label: 'Duplicate User' },
        { id: 'App', label: 'Main\nApp' },
        { id: '  ', label: 'Nope' }
      ],
      messages: [
        { from: 'User', to: 'App', style: 'solid', label: ' login ' },
        { from: 'User', to: 'App', style: 'dashed', label: '' },
        { from: 'User', to: 'Missing', style: 'solid', label: 'orphan' },
        { from: 'Missing', to: 'App', style: 'solid', label: 'orphan' },
        { from: 'User', to: 'App', style: 'weird' as any, label: 'contains | pipe and "quote"' }
      ],
      source: 'sequenceDiagram'
    });

    assert.strictEqual(state.diagramType, 'sequence');
    assert.strictEqual(state.direction, 'TD');
    assert.deepStrictEqual(state.nodes, []);
    assert.deepStrictEqual(state.edges, []);
    assert.strictEqual(state.participants.length, 2);
    assert.deepStrictEqual(state.participants.map((participant) => participant.id), ['User', 'App']);
    assert.strictEqual(state.participants[1].label, 'Main App');
    assert.strictEqual(state.messages.length, 2);
    assert.strictEqual(state.messages[0].label, 'login');
    assert.strictEqual(state.messages[1].style, 'solid');
    assert.strictEqual(state.messages[1].label, 'contains &#124; pipe and \\"quote\\"');
  });

  test('dedupes flow nodes, removes orphan edges, and normalizes shape/style', () => {
    const state = sanitizeBuilderState({
      diagramType: 'flowchart',
      direction: 'LR',
      participants: [{ id: 'Ghost', label: 'Ghost' }],
      messages: [{ from: 'Ghost', to: 'Ghost', style: 'solid', label: 'ignored' }],
      nodes: [
        { id: 'A', label: 'Start', shape: 'rectangle', x: 10, y: 20 },
        { id: 'A', label: 'Duplicate', shape: 'circle' },
        { id: 'B', label: 'Has | pipe', shape: 'unknown' as any, x: 50 },
        { id: '123', label: 'Numeric', shape: 'diamond' }
      ],
      edges: [
        { from: 'A', to: 'B', style: 'dotted', label: ' first ' },
        { from: 'A', to: 'Missing', style: 'solid', label: 'drop' },
        { from: '123', to: 'A', style: 'strange' as any, label: ' back ' }
      ]
    });

    assert.strictEqual(state.diagramType, 'flowchart');
    assert.strictEqual(state.direction, 'LR');
    assert.deepStrictEqual(state.participants, []);
    assert.deepStrictEqual(state.messages, []);
    assert.strictEqual(state.nodes.length, 3);
    assert.deepStrictEqual(state.nodes.map((node) => node.id), ['A', 'B', 'n_123']);
    assert.strictEqual(state.nodes[0].x, 10);
    assert.strictEqual(state.nodes[0].y, 20);
    assert.strictEqual(state.nodes[1].shape, 'rectangle');
    assert.strictEqual(state.nodes[1].label, 'Has &#124; pipe');
    assert.strictEqual(state.edges.length, 2);
    assert.strictEqual(state.edges[0].style, 'dotted');
    assert.strictEqual(state.edges[0].label, 'first');
    assert.strictEqual(state.edges[1].from, 'n_123');
    assert.strictEqual(state.edges[1].style, 'solid');
  });
});
