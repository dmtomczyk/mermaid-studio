import * as path from 'path';
import * as vscode from 'vscode';
import { MermaidPreviewPanel } from '../preview/MermaidPreviewPanel';
import { getExportableSvgEntries, prepareSvgForExport, selectSvgExports } from '../preview/svgExport';
import { promptForFolder, promptForSvgSaveUri, sanitizeFileStem } from '../utils/files';

export function registerExportSvgCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.exportSvg', async () => {
    const preview = MermaidPreviewPanel.current;
    if (!preview) {
      throw new Error('Open a Mermaid preview first.');
    }

    const renderState = await preview.requestRenderState();
    const entries = getExportableSvgEntries(renderState);

    if (!renderState.activeSvg && entries.length === 0) {
      throw new Error('The preview does not have rendered SVG yet.');
    }

    if (entries.length > 1) {
      const mode = await vscode.window.showQuickPick(
        [
          { label: 'Export current diagram', mode: 'current' as const },
          { label: 'Export all rendered diagrams', mode: 'all' as const }
        ],
        { placeHolder: 'Choose what to export' }
      );

      if (!mode) {
        return;
      }

      if (mode.mode === 'all') {
        const folder = await promptForFolder(`mermaid-exports-${Date.now()}`);
        if (!folder) {
          return;
        }
        await vscode.workspace.fs.createDirectory(folder);

        const exports = selectSvgExports(renderState, 'all');
        let counter = 1;
        for (const entry of exports) {
          const fileName = `${String(counter).padStart(2, '0')}-${sanitizeFileStem(entry.title, `diagram-${counter}`)}.svg`;
          const uri = vscode.Uri.joinPath(folder, fileName);
          await vscode.workspace.fs.writeFile(uri, Buffer.from(prepareSvgForExport(entry.svg), 'utf8'));
          counter += 1;
        }

        vscode.window.showInformationMessage(`Exported ${exports.length} Mermaid SVGs to ${folder.fsPath}`);
        return;
      }
    }

    const currentExport = selectSvgExports(renderState, 'current')[0];
    if (!currentExport?.svg) {
      throw new Error('The preview does not have rendered SVG yet.');
    }

    const targetUri = await promptForSvgSaveUri(`mermaid-preview-${Date.now()}.svg`);
    if (!targetUri) {
      return;
    }

    const normalizedSvg = prepareSvgForExport(currentExport.svg);
    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(normalizedSvg, 'utf8'));
    vscode.window.showInformationMessage(`Exported Mermaid SVG to ${targetUri.fsPath}`);
  });
}
