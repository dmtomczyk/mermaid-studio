import * as assert from 'assert';
import { suite, test } from 'mocha';
import { parseMermaidToBuilderState } from '../../builder/parser';

suite('builder parser', () => {
  test('imports flowchart Mermaid into builder state', () => {
    const result = parseMermaidToBuilderState([
      'flowchart LR',
      '    Client["Web Client"] -->|request| API(["Public API"])',
      '    API(["Public API"]) -.-> DB[("Database")]'
    ].join('\n'));

    assert.strictEqual(result.state.diagramType, 'flowchart');
    assert.strictEqual(result.state.direction, 'LR');
    assert.strictEqual(result.state.nodes.length, 3);
    assert.strictEqual(result.state.edges.length, 2);
    assert.strictEqual(result.state.nodes.find((node) => node.id === 'Client')?.label, 'Web Client');
    assert.strictEqual(result.state.nodes.find((node) => node.id === 'API')?.shape, 'rounded');
    assert.strictEqual(result.state.edges[0].label, 'request');
  });

  test('imports sequence Mermaid into builder state', () => {
    const result = parseMermaidToBuilderState([
      'sequenceDiagram',
      '    participant User as End User',
      '    participant App',
      '    User->>App: login',
      '    App-->>User: success'
    ].join('\n'));

    assert.strictEqual(result.state.diagramType, 'sequence');
    assert.strictEqual(result.state.participants.length, 2);
    assert.strictEqual(result.state.messages.length, 2);
    assert.strictEqual(result.state.participants[0].label, 'End User');
    assert.strictEqual(result.state.messages[1].style, 'dashed');
  });

  test('sanitizes imported sequence messages that are missing labels', () => {
    const result = parseMermaidToBuilderState([
      'sequenceDiagram',
      '    participant User',
      '    participant App',
      '    User->>App',
      '    App-->>User: success'
    ].join('\n'));

    assert.strictEqual(result.state.diagramType, 'sequence');
    assert.strictEqual(result.state.participants.length, 2);
    assert.strictEqual(result.state.messages.length, 1);
    assert.strictEqual(result.state.messages[0].label, 'success');
  });

  test('deduplicates imported sequence participants with the same id', () => {
    const result = parseMermaidToBuilderState([
      'sequenceDiagram',
      '    participant User as End User',
      '    participant User as Duplicate User',
      '    participant App',
      '    User->>App: login'
    ].join('\n'));

    assert.strictEqual(result.state.diagramType, 'sequence');
    assert.strictEqual(result.state.participants.length, 2);
    assert.deepStrictEqual(result.state.participants.map((participant) => participant.id), ['User', 'App']);
    assert.strictEqual(result.state.messages.length, 1);
  });

  test('rejects unsupported Mermaid families', () => {
    assert.throws(() => parseMermaidToBuilderState('classDiagram\n    Animal <|-- Dog'));
  });
});
