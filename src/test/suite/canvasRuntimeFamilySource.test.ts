import * as assert from 'assert';
import { createCanvasRuntimeFamilySource } from '../../canvas/core/canvasRuntimeFamilySource';

suite('canvas runtime family source', () => {
  test('exposes explicit class and flowchart runtime family configs', () => {
    const source = createCanvasRuntimeFamilySource();
    assert.ok(source.includes('function createClassDiagramRuntimeFamilyConfig() {'));
    assert.ok(source.includes('function createFlowchartRuntimeFamilyConfig() {'));
    assert.ok(source.includes("defaultTemplateId: 'empty'"));
    assert.ok(source.includes("defaultTemplateId: 'process'"));
    assert.ok(source.includes('copy: {'));
    assert.ok(source.includes("emptyRelationList:"));
    assert.ok(source.includes('hasContent(model) {'));
    assert.ok(source.includes('restoreSelection(persisted) {'));
  });
});
