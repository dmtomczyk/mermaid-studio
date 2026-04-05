import * as assert from 'assert';
import {
  createCanvasActionsSource,
  createCanvasEventBindingsSource,
  createCanvasGeometryHelpersSource,
  createCanvasRenderGroupsSource,
  createCanvasRenderHelpersSource
} from '../../canvas/diagramCanvasWebviewHelpers';
import { createCanvasConnectionCoreSource } from '../../canvas/core/canvasConnectionSource';
import { createCanvasContextMenuCoreSource } from '../../canvas/core/canvasContextMenuSource';
import { createCanvasSelectionCoreSource } from '../../canvas/core/canvasSelectionSource';

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
    assert.ok(source.includes('completeConnectionGesture(entry.id);'));
  });

  test('connection core exposes generic preview lifecycle helpers', () => {
    const source = createCanvasConnectionCoreSource();
    assert.ok(source.includes('function clearConnectionPreview() {'));
    assert.ok(source.includes('function updateConnectPreviewFromClientPoint(clientX, clientY) {'));
    assert.ok(source.includes('function cancelConnectMode() {'));
    assert.ok(source.includes('function completeConnectionGesture(targetClassId) {'));
    assert.ok(source.includes('createRelation(connectFromClassId, targetClassId);'));
  });

  test('context menu core exposes generic open/close/placement helpers', () => {
    const source = createCanvasContextMenuCoreSource();
    assert.ok(source.includes('function openCanvasContextMenu(menuStageX, menuStageY, actionCanvasX, actionCanvasY) {'));
    assert.ok(source.includes('function closeCanvasContextMenu() {'));
    assert.ok(source.includes('function openCanvasContextMenuFromPointerEvent(event, offsets) {'));
    assert.ok(source.includes('function dismissCanvasContextMenuOnPointerDown(event) {'));
    assert.ok(source.includes('openCanvasContextMenu(stageX, stageY, actionCanvasX, actionCanvasY);'));
  });

  test('selection core exposes generic focus and bare-canvas defocus helpers', () => {
    const source = createCanvasSelectionCoreSource();
    assert.ok(source.includes('function ensureSelection() {'));
    assert.ok(source.includes('function clearCanvasFocus() {'));
    assert.ok(source.includes('function shouldDefocusBareCanvasPointerUp(event, target) {'));
    assert.ok(source.includes('releaseDistance < 6'));
    assert.ok(source.includes('!panState'));
    assert.ok(source.includes('!dragState'));
  });

  test('actions source still exposes relation/class mutation helpers', () => {
    const source = createCanvasActionsSource();
    assert.ok(source.includes('function createRelation(fromId, toId) {'));
    assert.ok(source.includes('function deleteRelation(relationId) {'));
    assert.ok(source.includes('function addClassAt(x, y, templateId = \'empty\') {'));
  });

  test('render groups include member snippet bars in inline and inspector editors', () => {
    const source = createCanvasRenderGroupsSource();
    assert.ok(source.includes("renderMemberSnippetBar('node-members-input')"));
    assert.ok(source.includes("renderMemberSnippetBar('classMembersInput')"));
    assert.ok(source.includes("appendSnippetToMembersInput(membersInput, button.getAttribute('data-snippet-value') || '')"));
  });

  test('render groups expose smarter member parsing helpers', () => {
    const source = createCanvasRenderGroupsSource();
    assert.ok(source.includes('function parseNodeMemberLine(member) {'));
    assert.ok(source.includes("kind: params ? 'method' : 'property'"));
    assert.ok(source.includes("decorator: ''"));
    assert.ok(source.includes("return { raw, visibility: '', name: '', params: '', type: '', decorator: '', kind: 'unknown' }"));
    assert.ok(source.includes('function getMemberSnippetChoices() {'));
    assert.ok(source.includes("+save(user: User): Promise<void>"));
    assert.ok(source.includes("#load(id: string): User | undefined"));
    assert.ok(source.includes("-cache: Map<string, User>"));
  });

  test('render groups flag unrecognized member syntax in preview', () => {
    const source = createCanvasRenderGroupsSource();
    assert.ok(source.includes("const invalidClass = parsed.kind === 'unknown' && parsed.raw ? ' tok-invalid' : '';"));
    assert.ok(source.includes("unrecognized member syntax"));
    assert.ok(source.includes('Invalid lines will be underlined in the preview.'));
  });

  test('render groups make member snippet insertion context-aware', () => {
    const source = createCanvasRenderGroupsSource();
    assert.ok(source.includes('function appendSnippetToMembersInput(textarea, snippet) {'));
    assert.ok(source.includes('const currentLine = value.slice(lineStart, lineEnd);'));
    assert.ok(source.includes('} else if (!trimmedCurrentLine) {'));
    assert.ok(source.includes('} else if (start === lineEnd) {'));
    assert.ok(source.includes("insertion = '"));
    assert.ok(source.includes("' + snippet;"));
  });
});
