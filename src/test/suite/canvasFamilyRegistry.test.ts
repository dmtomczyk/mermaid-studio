import * as assert from 'assert';
import { getCanvasFamilyAdapter } from '../../canvas/families';

suite('canvas family registry', () => {
  test('returns classDiagram adapter', () => {
    const adapter = getCanvasFamilyAdapter('classDiagram');
    assert.strictEqual(adapter.family, 'classDiagram');
  });

  test('returns flowchart adapter', () => {
    const adapter = getCanvasFamilyAdapter('flowchart');
    assert.strictEqual(adapter.family, 'flowchart');
  });
});
