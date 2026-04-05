import * as assert from 'assert';
import { detectCanvasDiagramFamily, isCanvasFamilyImplemented } from '../../canvas/canvasFamilyDetection';
import { looksLikeFlowchart } from '../../canvas/families/flowchart/flowchartModel';

suite('canvas family detection', () => {
  test('detects class diagram sources', () => {
    assert.strictEqual(detectCanvasDiagramFamily('classDiagram\n  class User\n'), 'classDiagram');
  });

  test('detects flowchart sources', () => {
    assert.strictEqual(detectCanvasDiagramFamily('flowchart LR\n  A --> B\n'), 'flowchart');
    assert.strictEqual(detectCanvasDiagramFamily('graph TD\n  A --> B\n'), 'flowchart');
  });

  test('flowchart detection requires a real header', () => {
    assert.strictEqual(looksLikeFlowchart('flowcharty thing\nA --> B\n'), false);
    assert.strictEqual(looksLikeFlowchart('A --> B\n'), false);
  });

  test('implemented-family gate includes flowchart runtime path', () => {
    assert.strictEqual(isCanvasFamilyImplemented('classDiagram'), true);
    assert.strictEqual(isCanvasFamilyImplemented('flowchart'), true);
  });
});
