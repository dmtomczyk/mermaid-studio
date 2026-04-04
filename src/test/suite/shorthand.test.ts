import * as assert from 'assert';
import { suite, test } from 'mocha';
import { ShorthandParseError, transpileShorthand } from '../../shorthand';

suite('transpileShorthand', () => {
  test('converts flow shorthand to Mermaid', () => {
    const result = transpileShorthand(['flow LR', 'Client -> API -> DB', 'API --> Cache', 'API -> Auth: validate'].join('\n'));
    assert.strictEqual(result.mode, 'flow');
    assert.ok(result.mermaid.includes('flowchart LR'));
    assert.ok(result.mermaid.includes('Client[Client] --> API[API]'));
    assert.ok(result.mermaid.includes('API[API] -.-> Cache[Cache]'));
    assert.ok(result.mermaid.includes('API[API] -->|validate| Auth[Auth]'));
  });

  test('converts sequence shorthand to Mermaid', () => {
    const result = transpileShorthand(['sequence', 'User -> App: login', 'App --> API: auth request'].join('\n'));
    assert.strictEqual(result.mode, 'sequence');
    assert.ok(result.mermaid.includes('sequenceDiagram'));
    assert.ok(result.mermaid.includes('participant User'));
    assert.ok(result.mermaid.includes('User->>App: login'));
    assert.ok(result.mermaid.includes('App-->>API: auth request'));
  });

  test('supports quoted labels and aliases', () => {
    const result = transpileShorthand(['flow TD', 'wc["Web Client"] -> api["Public API"]'].join('\n'));
    assert.ok(result.mermaid.includes('wc["Web Client"] --> api["Public API"]'));
  });

  test('fails on unknown headers', () => {
    assert.throws(() => transpileShorthand('mindmap\nIdea -> Branch'), ShorthandParseError);
  });

  test('fails on malformed edges', () => {
    assert.throws(() => transpileShorthand('flow TD\nA B'), ShorthandParseError);
  });
});
