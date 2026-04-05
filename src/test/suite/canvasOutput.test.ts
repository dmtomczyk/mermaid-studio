import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('canvas output persistence', () => {
  test('canvas debug log file path lives under .local-docs/logs', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../src/canvas/canvasOutput.ts'), 'utf8');
    assert.ok(source.includes("'.local-docs', 'logs', 'canvas-debug.log'"));
    assert.ok(source.includes('fs.appendFileSync(filePath, line +'));
  });
});
