import * as assert from 'assert';
import { classDiagramAdapter } from '../../canvas/families/classDiagram/classDiagramAdapter';

suite('class diagram adapter', () => {
  test('exposes class templates', () => {
    const templates = classDiagramAdapter.getTemplates();
    assert.ok(Array.isArray(templates));
    assert.ok(templates.some((entry) => entry.id === 'empty'));
    assert.ok(templates.some((entry) => entry.id === 'entity'));
  });

  test('creates a relation through adapter contract', () => {
    const model = classDiagramAdapter.createEmptyModel();
    const from = model.classes[0]?.id;
    const to = model.classes[1]?.id;
    assert.ok(from && to);
    const next = classDiagramAdapter.createConnection(model, from!, to!);
    assert.strictEqual(next.relations.length, model.relations.length + 1);
    assert.strictEqual(next.relations[next.relations.length - 1]?.from, from);
    assert.strictEqual(next.relations[next.relations.length - 1]?.to, to);
  });

  test('computes selection bounds for selected class', () => {
    const model = classDiagramAdapter.createEmptyModel();
    const selectedId = model.classes[0]?.id;
    const bounds = classDiagramAdapter.getSelectionBounds(model, { selectedNodeId: selectedId });
    assert.ok(bounds);
    assert.ok((bounds?.width ?? 0) > 0);
    assert.ok((bounds?.height ?? 0) > 0);
  });
});
