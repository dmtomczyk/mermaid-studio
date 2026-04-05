import * as assert from 'assert';
import { createDiagramCanvasWebviewScript } from '../../canvas/diagramCanvasWebviewScript';
import { validateJavaScriptSyntax } from '../../canvas/canvasWebviewDiagnostics';

suite('canvas webview script bridge', () => {
  test('forwards window errors and unhandled rejections to host', () => {
    const source = createDiagramCanvasWebviewScript({ debugEnabled: true });
    assert.ok(source.includes("function postCanvasHostEvent(type, payload)"));
    assert.ok(source.includes("window.addEventListener('error'"));
    assert.ok(source.includes("window.addEventListener('unhandledrejection'"));
    assert.ok(source.includes("postCanvasHostEvent('canvasError'"));
  });

  test('generated webview script remains syntactically valid', () => {
    const source = createDiagramCanvasWebviewScript({ debugEnabled: true });
    const syntax = validateJavaScriptSyntax(source);
    assert.strictEqual(syntax.ok, true, syntax.error);
  });
});
