import * as path from 'path';
import * as vscode from 'vscode';
import {
  ClassDiagramCanvasModel,
  looksLikeClassDiagram
} from './classDiagramModel';
import {
  generateCanvasFamilyMermaid,
  parseCanvasFamilyMermaid,
  validateCanvasFamilyModel
} from './families';
import { createUntitledMermaidDocument, getEditorContext, insertMermaidText } from '../utils/editor';
import { MermaidPreviewPanel } from '../preview/MermaidPreviewPanel';
import { DiagramCanvasSource } from './canvasState';

export async function createCanvasFile(model: ClassDiagramCanvasModel): Promise<void> {
  await createUntitledMermaidDocument(generateCanvasFamilyMermaid('classDiagram', model));
}

export async function applyCanvasToDocument(
  source: DiagramCanvasSource,
  model: ClassDiagramCanvasModel
): Promise<DiagramCanvasSource> {
  const issues = validateCanvasFamilyModel('classDiagram', model).filter((issue) => issue.level === 'error');
  if (issues.length) {
    throw new Error(`Fix ${issues.length} validation error${issues.length === 1 ? '' : 's'} before applying the canvas.`);
  }

  const mermaid = generateCanvasFamilyMermaid('classDiagram', model);
  const targetEditor = await resolveTargetEditorForApply(source, mermaid);
  const context = getEditorContext(targetEditor);

  if (context.kind === 'mermaid') {
    const fullRange = new vscode.Range(
      targetEditor.document.positionAt(0),
      targetEditor.document.positionAt(targetEditor.document.getText().length)
    );
    await targetEditor.edit((editBuilder) => editBuilder.replace(fullRange, mermaid));
  } else {
    await insertMermaidText(targetEditor, mermaid, {
      replaceCurrentMarkdownMermaidBlock: true,
      wrapMarkdown: true
    });
  }

  return {
    kind: 'classDiagram',
    documentUri: targetEditor.document.uri
  };
}

export async function reimportCanvasFromDocument(
  source: DiagramCanvasSource
): Promise<ClassDiagramCanvasModel> {
  if (!source.documentUri) {
    throw new Error('This canvas was not opened from a Mermaid document.');
  }

  const document = await vscode.workspace.openTextDocument(source.documentUri);
  const text = document.getText();
  if (!looksLikeClassDiagram(text)) {
    throw new Error('The linked document is no longer a supported classDiagram source.');
  }

  return parseCanvasFamilyMermaid('classDiagram', text) as ClassDiagramCanvasModel;
}

export async function openCanvasPreview(
  extensionUri: vscode.Uri,
  source: DiagramCanvasSource,
  model: ClassDiagramCanvasModel
): Promise<void> {
  if (source.documentUri) {
    const document = await vscode.workspace.openTextDocument(source.documentUri);
    await vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });
    await vscode.commands.executeCommand('mermaidstudio.openPreview');
    return;
  }

  await MermaidPreviewPanel.createOrShow(extensionUri, undefined, {
    mode: 'virtual',
    key: 'diagram-canvas-preview',
    title: 'Mermaid Preview: Diagram Canvas',
    mermaid: generateCanvasFamilyMermaid('classDiagram', model)
  });
}

export async function openCanvasLinkedFile(source: DiagramCanvasSource): Promise<void> {
  if (!source.documentUri) {
    throw new Error('This canvas is not currently linked to a file.');
  }
  const document = await vscode.workspace.openTextDocument(source.documentUri);
  await vscode.window.showTextDocument(document, { preview: false });
}

async function resolveTargetEditorForApply(
  source: DiagramCanvasSource,
  mermaid: string
): Promise<vscode.TextEditor> {
  if (source.documentUri) {
    const document = await vscode.workspace.openTextDocument(source.documentUri);
    return vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });
  }

  const targetUri = await vscode.window.showSaveDialog({
    saveLabel: 'Save Mermaid Diagram',
    filters: {
      'Mermaid Files': ['mmd'],
      'Markdown Files': ['md']
    },
    defaultUri: vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 'diagram.mmd'))
  });

  if (!targetUri) {
    throw new Error('Save cancelled.');
  }

  await vscode.workspace.fs.writeFile(targetUri, Buffer.from(mermaid, 'utf8'));
  const document = await vscode.workspace.openTextDocument(targetUri);
  return vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });
}
