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
    assert.ok(source.includes('isCompatiblePersistedState(nextState) {'));
    assert.ok(source.includes('getNodeBounds(node) {'));
    assert.ok(source.includes('getDiagramBounds(model) {'));
    assert.ok(source.includes('getSelectionBounds(model, selectedClass, selectedRelation) {') || source.includes('getSelectionBounds(model, selectedNode, selectedEdge) {'));
    assert.ok(source.includes('getEdgePath(from, to) {'));
    assert.ok(source.includes('getPreviewPath(from, previewPoint) {'));
    assert.ok(source.includes('hasContent(model) {'));
    assert.ok(source.includes('restoreSelection(persisted) {'));
  });
});
