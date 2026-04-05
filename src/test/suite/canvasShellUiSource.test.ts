import * as assert from 'assert';
import { createCanvasShellUiSource } from '../../canvas/core/canvasShellUiSource';

suite('canvas shell ui source', () => {
  test('exposes shared shell chrome and family switch helpers', () => {
    const source = createCanvasShellUiSource();
    assert.ok(source.includes('function renderCanvasShellChrome(defaults) {'));
    assert.ok(source.includes('function bindCanvasFamilySwitcher(defaultFamily) {'));
    assert.ok(source.includes("vscode.postMessage({ type: 'switchFamily', family: nextFamily })"));
    assert.ok(source.includes("state.shellLabels?.sidebarTemplateSection"));
  });
});
