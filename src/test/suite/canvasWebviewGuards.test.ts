import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('canvas webview source guards', () => {
  test('diagram canvas HTML template avoids fragile raw regex/script escapes', () => {
    const filePath = path.resolve(__dirname, '../../../src/canvas/diagramCanvasHtml.ts');
    const source = fs.readFileSync(filePath, 'utf8');
    const start = source.indexOf('return `<!DOCTYPE html>');
    assert.ok(start >= 0, 'Diagram canvas HTML template should exist');
    const htmlTemplateSection = source.slice(start);

    const bannedPatterns = [
      '.join(\'\\n\')',
      '.join("\\n")',
      '.split(/\\n/)',
      '.split(/\\r?\\n/)',
      '.match(/^',
      '.test(/'
    ];

    for (const pattern of bannedPatterns) {
      assert.strictEqual(
        htmlTemplateSection.includes(pattern),
        false,
        `Canvas webview template contains fragile pattern: ${pattern}`
      );
    }
  });
});
