import * as assert from 'assert';
import { createCanvasConfirmationUiSource } from '../../canvas/core/canvasConfirmationUiSource';
import { createCanvasShellUiSource } from '../../canvas/core/canvasShellUiSource';

suite('canvas confirmation ui source', () => {
  test('exposes shared in-canvas confirmation helpers and avoids browser confirm', () => {
    const confirmSource = createCanvasConfirmationUiSource();
    const shellSource = createCanvasShellUiSource();
    assert.ok(confirmSource.includes('function bindCanvasConfirmationUi() {'));
    assert.ok(confirmSource.includes('function requestCanvasConfirmation(options) {'));
    assert.ok(confirmSource.includes('canvasConfirmOverlay.hidden = false;'));
    assert.ok(shellSource.includes('requestCanvasConfirmation({'));
    assert.ok(!shellSource.includes('confirm('));
  });
});
