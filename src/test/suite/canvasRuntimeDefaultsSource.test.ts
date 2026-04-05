import * as assert from 'assert';
import { createCanvasRuntimeDefaultsSource } from '../../canvas/core/canvasRuntimeDefaultsSource';

suite('canvas runtime defaults source', () => {
  test('exposes explicit class and flowchart runtime defaults', () => {
    const source = createCanvasRuntimeDefaultsSource();
    assert.ok(source.includes('function createClassDiagramRuntimeDefaults() {'));
    assert.ok(source.includes('function createFlowchartRuntimeDefaults() {'));
    assert.ok(source.includes("family: 'classDiagram'"));
    assert.ok(source.includes("family: 'flowchart'"));
    assert.ok(source.includes("shellLabels:"));
    assert.ok(source.includes("model: { family: 'flowchart', direction: 'TB', nodes: [], edges: [] }"));
  });
});
