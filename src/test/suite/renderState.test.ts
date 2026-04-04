import * as assert from 'assert';
import { suite, test } from 'mocha';
import {
  createFallbackPreviewRenderState,
  normalizePreviewRenderState
} from '../../preview/renderState';

suite('preview render state', () => {
  test('creates a fallback render state from the last svg', () => {
    const state = createFallbackPreviewRenderState('<svg id="last"></svg>');
    assert.strictEqual(state.activeSvg, '<svg id="last"></svg>');
    assert.strictEqual(state.entries.length, 1);
    assert.strictEqual(state.entries[0].title, 'Current diagram');
  });

  test('creates an empty fallback render state when no svg is available', () => {
    const state = createFallbackPreviewRenderState('   ');
    assert.strictEqual(state.activeSvg, undefined);
    assert.strictEqual(state.entries.length, 0);
  });

  test('normalizes preview render state responses safely', () => {
    const state = normalizePreviewRenderState({
      activeSvg: '<svg id="active"></svg>',
      entries: [
        { title: 'Diagram 1', svg: '<svg id="one"></svg>' },
        { title: 'Diagram 2', svg: '<svg id="two"></svg>' },
        { title: 123, svg: '<svg id="bad"></svg>' },
        null
      ]
    });

    assert.strictEqual(state.activeSvg, '<svg id="active"></svg>');
    assert.strictEqual(state.entries.length, 2);
    assert.deepStrictEqual(state.entries.map((entry) => entry.title), ['Diagram 1', 'Diagram 2']);
  });
});
