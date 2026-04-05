import * as assert from 'assert';
import { createCanvasTemplateBootstrapSource } from '../../canvas/core/canvasTemplateBootstrapSource';

suite('canvas template bootstrap source', () => {
  test('exposes shared template-select bootstrap helper', () => {
    const source = createCanvasTemplateBootstrapSource();
    assert.ok(source.includes('function initializeCanvasTemplateSelect(options, fallbackTemplateId) {'));
    assert.ok(source.includes('classTemplateSelect.innerHTML = options.map'));
    assert.ok(source.includes("selectedTemplateId = classTemplateSelect.value || fallbackTemplateId"));
    assert.ok(source.includes('renderTemplatePreview();'));
  });
});
