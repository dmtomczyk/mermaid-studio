import * as assert from 'assert';
import { createDiagramCanvasWebviewScript } from '../../canvas/diagramCanvasWebviewScript';
import { validateJavaScriptSyntax } from '../../canvas/canvasWebviewDiagnostics';

suite('canvas webview script bridge', () => {
  test('forwards window errors and unhandled rejections to host', () => {
    const source = createDiagramCanvasWebviewScript({ debugEnabled: true, family: 'classDiagram' });
    assert.ok(source.includes("function postCanvasHostEvent(type, payload)"));
    assert.ok(source.includes("window.addEventListener('error'"));
    assert.ok(source.includes("window.addEventListener('unhandledrejection'"));
    assert.ok(source.includes("postCanvasHostEvent('canvasError'"));
  });

  test('generated classDiagram webview script remains syntactically valid', () => {
    const source = createDiagramCanvasWebviewScript({ debugEnabled: true, family: 'classDiagram' });
    const syntax = validateJavaScriptSyntax(source);
    assert.strictEqual(syntax.ok, true, syntax.error);
  });

  test('generated flowchart webview script remains syntactically valid', () => {
    const source = createDiagramCanvasWebviewScript({ debugEnabled: true, family: 'flowchart' });
    const syntax = validateJavaScriptSyntax(source);
    assert.strictEqual(syntax.ok, true, syntax.error);
    assert.ok(source.includes('FLOWCHART_TEMPLATES'));
    assert.ok(source.includes("model: { family: 'flowchart'"));
  });
});
