import * as assert from 'assert';
import { createCanvasPersistedStateSource } from '../../canvas/core/canvasPersistedStateSource';

suite('canvas persisted state source', () => {
  test('exposes shared persisted-state restore helper', () => {
    const source = createCanvasPersistedStateSource();
    assert.ok(source.includes('function restoreCanvasPersistedState(config) {'));
    assert.ok(source.includes('const persisted = vscode.getState();'));
    assert.ok(source.includes("if (typeof config.restoreSelection === 'function')"));
    assert.ok(source.includes('zoom = persisted.zoom || 1;'));
  });
});
