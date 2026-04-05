import * as assert from 'assert';
import { createCanvasHostBridgeSource } from '../../canvas/core/canvasHostBridgeSource';

suite('canvas host bridge source', () => {
  test('exposes shared host action bindings and initial state request', () => {
    const source = createCanvasHostBridgeSource();
    assert.ok(source.includes('function bindCanvasHostActionButtons() {'));
    assert.ok(source.includes("type: 'applyToDocument'"));
    assert.ok(source.includes("type: 'copyMermaid'"));
    assert.ok(source.includes("type: 'requestState'"));
  });
});
