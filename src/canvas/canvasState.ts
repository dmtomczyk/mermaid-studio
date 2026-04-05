import * as path from 'path';
import * as vscode from 'vscode';
import {
  ClassDiagramCanvasModel
} from './classDiagramModel';
import {
  createEmptyCanvasFamilyModel,
  generateCanvasFamilyMermaid,
  parseCanvasFamilyMermaid
} from './families';
import { detectCanvasDiagramFamily } from './canvasFamilyDetection';
import { CanvasDiagramFamily } from './types/canvasFamilies';
import { ValidationIssue } from './types/validationTypes';

export interface DiagramCanvasSource {
  documentUri?: vscode.Uri;
  kind: CanvasDiagramFamily;
}

export interface DiagramCanvasViewState {
  type: 'setState';
  family: CanvasDiagramFamily;
  familyLabel: string;
  availableFamilies: { id: CanvasDiagramFamily; label: string }[];
  shellLabels: {
    templateSelect: string;
    addTemplateButton: string;
    sidebarTemplateSection: string;
    relationSection: string;
  };
  sourceLabel: string;
  linkedFileLabel: string;
  linkedFileKind: 'markdown' | 'mermaid' | 'ephemeral';
  model: any;
  mermaid: string;
  canReimport: boolean;
  canOpenLinkedFile: boolean;
  canApply: boolean;
  issues: ValidationIssue[];
}

const CANVAS_FAMILY_OPTIONS: { id: CanvasDiagramFamily; label: string }[] = [
  { id: 'classDiagram', label: 'Class Diagram' },
  { id: 'flowchart', label: 'Flowchart' }
];

export function getCanvasFamilyLabel(family: CanvasDiagramFamily): string {
  return CANVAS_FAMILY_OPTIONS.find((entry) => entry.id === family)?.label || family;
}

function getCanvasShellLabels(family: CanvasDiagramFamily): DiagramCanvasViewState['shellLabels'] {
  if (family === 'flowchart') {
    return {
      templateSelect: 'Node template',
      addTemplateButton: 'Add this node template',
      sidebarTemplateSection: 'Add Node',
      relationSection: 'Edges'
    };
  }

  return {
    templateSelect: 'Class template',
    addTemplateButton: 'Add this template',
    sidebarTemplateSection: 'Add Class',
    relationSection: 'Relationships'
  };
}

export function getDiagramCanvasTitle(source: DiagramCanvasSource): string {
  return source.documentUri
    ? `Diagram Canvas: ${path.basename(source.documentUri.fsPath)}`
    : `Diagram Canvas: ${getCanvasFamilyLabel(source.kind)}`;
}

export function buildDiagramCanvasViewState(
  source: DiagramCanvasSource,
  model: any,
  issues: ValidationIssue[]
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
    family: source.kind,
    familyLabel: getCanvasFamilyLabel(source.kind),
    availableFamilies: CANVAS_FAMILY_OPTIONS,
    shellLabels: getCanvasShellLabels(source.kind),
    sourceLabel: linkedFileLabel,
    linkedFileLabel,
    linkedFileKind,
    model,
    mermaid: generateCanvasFamilyMermaid(source.kind as any, model),
    canReimport: Boolean(source.documentUri),
    canOpenLinkedFile: Boolean(source.documentUri),
    canApply: !issues.some((issue) => issue.level === 'error'),
    issues
  };
}

export async function resolveInitialCanvasSource(): Promise<{ source: DiagramCanvasSource; model: any }> {
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
      model: parseCanvasFamilyMermaid('flowchart', text) as any
    };
  }

  return {
    source: { kind: 'classDiagram' },
    model: createEmptyCanvasFamilyModel('classDiagram') as ClassDiagramCanvasModel
  };
}
