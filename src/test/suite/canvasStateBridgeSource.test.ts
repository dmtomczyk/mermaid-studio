import * as assert from 'assert';
import { createCanvasStateBridgeSource } from '../../canvas/core/canvasStateBridgeSource';

suite('canvas state bridge source', () => {
  test('exposes shared shell-state merge helper', () => {
    const source = createCanvasStateBridgeSource();
    assert.ok(source.includes('function mergeCanvasShellState(message, defaults) {'));
    assert.ok(source.includes("availableFamilies: Array.isArray(message.availableFamilies) ? message.availableFamilies : state.availableFamilies"));
    assert.ok(source.includes("shellLabels: message.shellLabels || state.shellLabels"));
  });
});
