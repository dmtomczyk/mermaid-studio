import * as path from 'path';
import * as vscode from 'vscode';
import {
  ClassDiagramCanvasModel,
  ClassDiagramValidationIssue
} from './classDiagramModel';
import {
  createEmptyCanvasFamilyModel,
  generateCanvasFamilyMermaid,
  parseCanvasFamilyMermaid
} from './families';
import { detectCanvasDiagramFamily } from './canvasFamilyDetection';
import { CanvasDiagramFamily } from './types/canvasFamilies';

export interface DiagramCanvasSource {
  documentUri?: vscode.Uri;
  kind: CanvasDiagramFamily;
}

export interface DiagramCanvasViewState {
  type: 'setState';
  sourceLabel: string;
  linkedFileLabel: string;
  linkedFileKind: 'markdown' | 'mermaid' | 'ephemeral';
  model: ClassDiagramCanvasModel;
  mermaid: string;
  canReimport: boolean;
  canOpenLinkedFile: boolean;
  canApply: boolean;
  issues: ClassDiagramValidationIssue[];
}

export function getDiagramCanvasTitle(source: DiagramCanvasSource): string {
  return source.documentUri
    ? `Diagram Canvas: ${path.basename(source.documentUri.fsPath)}`
    : `Diagram Canvas: ${source.kind}`;
}

export function buildDiagramCanvasViewState(
  source: DiagramCanvasSource,
  model: ClassDiagramCanvasModel,
  issues: ClassDiagramValidationIssue[]
): DiagramCanvasViewState {
  const linkedFileLabel = source.documentUri
    ? path.basename(source.documentUri.fsPath)
    : 'Untitled canvas';
  const linkedFileKind: DiagramCanvasViewState['linkedFileKind'] = source.documentUri
    ? path.extname(source.documentUri.fsPath).toLowerCase() === '.md'
      ? 'markdown'
      : 'mermaid'
    : 'ephemeral';

  return {
    type: 'setState',
    sourceLabel: linkedFileLabel,
    linkedFileLabel,
    linkedFileKind,
    model,
    mermaid: generateCanvasFamilyMermaid('classDiagram', model),
    canReimport: Boolean(source.documentUri),
    canOpenLinkedFile: Boolean(source.documentUri),
    canApply: !issues.some((issue) => issue.level === 'error'),
    issues
  };
}

export async function resolveInitialCanvasSource(): Promise<{ source: DiagramCanvasSource; model: ClassDiagramCanvasModel }> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return {
      source: { kind: 'classDiagram' },
      model: createEmptyCanvasFamilyModel('classDiagram') as ClassDiagramCanvasModel
    };
  }

  const text = editor.document.getText();
  const detectedFamily = detectCanvasDiagramFamily(text);
  if (detectedFamily === 'classDiagram') {
    return {
      source: {
        kind: 'classDiagram',
        documentUri: editor.document.uri
      },
      model: parseCanvasFamilyMermaid('classDiagram', text) as ClassDiagramCanvasModel
    };
  }

  if (detectedFamily === 'flowchart') {
    return {
      source: {
        kind: 'flowchart',
        documentUri: editor.document.uri
      },
      model: createEmptyCanvasFamilyModel('classDiagram') as ClassDiagramCanvasModel
    };
  }

  return {
    source: { kind: 'classDiagram' },
    model: createEmptyCanvasFamilyModel('classDiagram') as ClassDiagramCanvasModel
  };
}
