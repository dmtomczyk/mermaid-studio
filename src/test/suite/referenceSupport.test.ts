import * as assert from 'assert';
import * as vscode from 'vscode';
import { suite, test } from 'mocha';
import { getCurrentDiagramReferenceTarget, getReferenceTargetAtPosition } from '../../language/referenceSupport';

suite('reference support', () => {
  test('resolves operator references in Mermaid documents', async () => {
    const document = await vscode.workspace.openTextDocument({
      language: 'mermaid',
      content: 'sequenceDiagram\n    User->>API: request\n'
    });

    const target = getReferenceTargetAtPosition(document, new vscode.Position(1, 9));
    assert.ok(target);
    assert.strictEqual(target?.token, '->>');
    assert.strictEqual(target?.topic, 'sequence');
  });

  test('falls back to current diagram type for generic labels', async () => {
    const document = await vscode.workspace.openTextDocument({
      language: 'mermaid',
      content: 'mindmap\n  root((Project))\n    Branch\n'
    });

    const target = getReferenceTargetAtPosition(document, new vscode.Position(2, 6));
    assert.ok(target);
    assert.strictEqual(target?.topic, 'mindmap');
  });

  test('only resolves markdown references inside Mermaid fences', async () => {
    const document = await vscode.workspace.openTextDocument({
      language: 'markdown',
      content: '# Notes\n\n```mermaid\nflowchart TD\n    A --> B\n```\n'
    });

    const inside = getReferenceTargetAtPosition(document, new vscode.Position(3, 2));
    const outside = getReferenceTargetAtPosition(document, new vscode.Position(0, 1));
    const currentDiagram = getCurrentDiagramReferenceTarget(document, new vscode.Position(3, 2));

    assert.ok(inside);
    assert.strictEqual(inside?.topic, 'flowchart');
    assert.strictEqual(outside, undefined);
    assert.strictEqual(currentDiagram?.topic, 'flowchart');
  });
});
