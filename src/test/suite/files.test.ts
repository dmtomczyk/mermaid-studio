import * as assert from 'assert';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { ensureFileExtension } from '../../utils/files';

suite('ensureFileExtension', () => {
  test('adds missing extension', () => {
    const uri = vscode.Uri.file('/tmp/diagram');
    assert.strictEqual(ensureFileExtension(uri, '.svg').fsPath.endsWith('.svg'), true);
  });

  test('preserves existing extension', () => {
    const uri = vscode.Uri.file('/tmp/diagram.mmd');
    assert.strictEqual(ensureFileExtension(uri, '.svg').fsPath.endsWith('.mmd'), true);
  });
});
