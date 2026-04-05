import * as assert from 'assert';
import {
  createCanvasActionsSource,
  createCanvasEventBindingsSource,
  createCanvasGeometryHelpersSource,
  createCanvasRenderGroupsSource,
  createCanvasRenderHelpersSource
} from '../../canvas/diagramCanvasWebviewHelpers';

suite('canvas webview helper regressions', () => {
  test('render helper uses renderMermaidSource for generated Mermaid panel', () => {
    const source = createCanvasRenderHelpersSource();
    assert.ok(source.includes('renderMermaidSource();'));
    assert.ok(!source.includes('renderMermaid();'));
  });

  test('geometry helper keeps connect preview in stage coordinates', () => {
    const source = createCanvasGeometryHelpersSource();
    assert.ok(source.includes('connectPreviewPoint = {'));
    assert.ok(source.includes('x: stagePoint.x'));
    assert.ok(source.includes('y: stagePoint.y'));
    assert.ok(!source.includes('x: stageToWorldX(stagePoint.x)'));
    assert.ok(!source.includes('y: stageToWorldY(stagePoint.y)'));
  });

  test('geometry helper allows negative camera offsets for wider panning', () => {
    const source = createCanvasGeometryHelpersSource();
    assert.ok(source.includes('const minCameraX = -WORLD_ORIGIN_X;'));
    assert.ok(source.includes('const minCameraY = -WORLD_ORIGIN_Y;'));
    assert.ok(source.includes('cameraX = Math.max(minCameraX, Math.min(maxCameraX, cameraX));'));
    assert.ok(source.includes('cameraY = Math.max(minCameraY, Math.min(maxCameraY, cameraY));'));
  });

  test('event bindings do not shadow updateConnectPreviewFromClientPoint', () => {
    const source = createCanvasEventBindingsSource();
    const matches = source.match(/function updateConnectPreviewFromClientPoint\s*\(/g) ?? [];
    assert.strictEqual(matches.length, 0);
    assert.ok(source.includes('updateConnectPreviewFromClientPoint(event.clientX, event.clientY);'));
  });

  test('render groups keep quick-connect pointerup path', () => {
    const source = createCanvasRenderGroupsSource();
    assert.ok(source.includes("const quickConnectButton = card.querySelector('[data-action=\"quick-connect\"]');"));
    assert.ok(source.includes('connectDragActive = true;'));
    assert.ok(source.includes('card.addEventListener(\'pointerup\''));
    assert.ok(source.includes('createRelation(connectFromClassId, entry.id);'));
  });

  test('actions source still exposes relation/class mutation helpers', () => {
    const source = createCanvasActionsSource();
    assert.ok(source.includes('function createRelation(fromId, toId) {'));
    assert.ok(source.includes('function deleteRelation(relationId) {'));
    assert.ok(source.includes('function addClassAt(x, y, templateId = \'empty\') {'));
  });
});
