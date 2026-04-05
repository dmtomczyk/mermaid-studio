import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  extractInlineScriptFromHtml,
  runCanvasWebviewDiagnostics,
  validateJavaScriptSyntax
} from '../../canvas/canvasWebviewDiagnostics';

suite('canvas webview diagnostics', () => {
  test('extracts inline script from html', () => {
    const script = extractInlineScriptFromHtml('<html><body><script>const x = 1;</script></body></html>');
    assert.ok(script.includes('const x = 1;'));
  });

  test('validates javascript syntax without executing it', () => {
    assert.strictEqual(validateJavaScriptSyntax('const x = 1;').ok, true);
    assert.strictEqual(validateJavaScriptSyntax('const x = ;').ok, false);
  });

  test('writes debug artifacts only when debug is enabled', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'canvas-diag-'));
    const html = '<html><body><script>const x = 1;</script></body></html>';

    const noDebug = runCanvasWebviewDiagnostics(html, { debugEnabled: false, outputDir: dir });
    assert.strictEqual(noDebug.syntaxOk, true);
    assert.strictEqual(noDebug.htmlPath, undefined);
    assert.strictEqual(noDebug.scriptPath, undefined);

    const withDebug = runCanvasWebviewDiagnostics(html, { debugEnabled: true, outputDir: dir });
    assert.strictEqual(withDebug.syntaxOk, true);
    assert.ok(withDebug.htmlPath && fs.existsSync(withDebug.htmlPath));
    assert.ok(withDebug.scriptPath && fs.existsSync(withDebug.scriptPath));
  });
});
