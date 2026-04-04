import * as vscode from 'vscode';
import { inferReferenceTopic, MermaidReferenceTopic } from '../registry/exampleRegistry';
import { detectDiagramType, MermaidDiagramFamilyId } from '../registry/diagramRegistry';
import { findMermaidFenceContainingPosition } from '../utils/markdown';

const OPERATOR_TOKENS = [
  '||--o{',
  '}o--||',
  'o{--o{',
  '<|--',
  '--|>',
  '-->>',
  '->>',
  '==>',
  '-.->',
  '-->',
  '|o--',
  '--o|'
];

export interface MermaidReferenceTarget {
  token: string;
  topic: MermaidReferenceTopic;
  range: vscode.Range;
}

export function getReferenceTargetAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position
): MermaidReferenceTarget | undefined {
  if (document.languageId === 'markdown') {
    const fence = findMermaidFenceContainingPosition(document.getText(), { line: position.line, character: position.character });
    if (!fence) {
      return undefined;
    }
  }

  const operator = findOperatorTokenAtPosition(document, position);
  if (operator) {
    return {
      token: operator.token,
      topic: inferReferenceTopic(operator.token),
      range: operator.range
    };
  }

  const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z0-9_.-]+/);
  if (!wordRange) {
    return getCurrentDiagramReferenceTarget(document, position);
  }

  const token = document.getText(wordRange);
  const inferredTopic = inferReferenceTopic(token);
  if (inferredTopic !== 'general') {
    return { token, topic: inferredTopic, range: wordRange };
  }

  const fallbackTopic = mapDiagramFamilyToReferenceTopic(detectDiagramType(document, position));
  return fallbackTopic
    ? { token, topic: fallbackTopic, range: wordRange }
    : undefined;
}

export function getCurrentDiagramReferenceTarget(
  document: vscode.TextDocument,
  position: vscode.Position
): MermaidReferenceTarget | undefined {
  const topic = mapDiagramFamilyToReferenceTopic(detectDiagramType(document, position));
  if (!topic) {
    return undefined;
  }

  const range = document.getWordRangeAtPosition(position, /[A-Za-z0-9_.-]+/) ?? new vscode.Range(position, position);
  return {
    token: document.getText(range) || topic,
    topic,
    range
  };
}

function findOperatorTokenAtPosition(document: vscode.TextDocument, position: vscode.Position): { token: string; range: vscode.Range } | undefined {
  const line = document.lineAt(position.line).text;
  for (const token of OPERATOR_TOKENS) {
    let fromIndex = 0;
    while (fromIndex < line.length) {
      const foundAt = line.indexOf(token, fromIndex);
      if (foundAt < 0) {
        break;
      }
      const start = new vscode.Position(position.line, foundAt);
      const end = new vscode.Position(position.line, foundAt + token.length);
      if (position.character >= foundAt && position.character <= foundAt + token.length) {
        return { token, range: new vscode.Range(start, end) };
      }
      fromIndex = foundAt + token.length;
    }
  }
  return undefined;
}

function mapDiagramFamilyToReferenceTopic(diagramType?: MermaidDiagramFamilyId): MermaidReferenceTopic | undefined {
  switch (diagramType) {
    case 'flowchart':
    case 'graph':
      return 'flowchart';
    case 'sequenceDiagram':
      return 'sequence';
    case 'classDiagram':
      return 'class';
    case 'stateDiagram-v2':
      return 'state';
    case 'erDiagram':
      return 'er';
    case 'gantt':
      return 'gantt';
    case 'mindmap':
      return 'mindmap';
    case 'gitGraph':
      return 'gitgraph';
    case 'architecture-beta':
      return 'architecture';
    default:
      return undefined;
  }
}
