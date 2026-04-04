import * as assert from 'assert';
import * as vscode from 'vscode';
import { suite, test } from 'mocha';

suite('extension smoke', () => {
  test('registers Mermaid Studio commands', async () => {
    const extension = vscode.extensions.all.find((candidate) => candidate.packageJSON?.name === 'mermaid-studio');
    assert.ok(extension, 'Extension should be discoverable in the test host.');
    await extension?.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('mermaidstudio.newDiagram'));
    assert.ok(commands.includes('mermaidstudio.openPreview'));
    assert.ok(commands.includes('mermaidstudio.extractMermaidBlock'));
    assert.ok(commands.includes('mermaidstudio.openReferenceForSymbol'));
    assert.ok(commands.includes('mermaidstudio.openCurrentDiagramExample'));
  });
});
