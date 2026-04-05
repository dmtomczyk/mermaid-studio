import { CanvasDiagramFamily } from './types/canvasFamilies';
import { looksLikeClassDiagram } from './classDiagramModel';
import { looksLikeFlowchart } from './families/flowchart/flowchartModel';

export function detectCanvasDiagramFamily(source: string): CanvasDiagramFamily | undefined {
  if (looksLikeClassDiagram(source)) {
    return 'classDiagram';
  }
  if (looksLikeFlowchart(source)) {
    return 'flowchart';
  }
  return undefined;
}

export function isCanvasFamilyImplemented(family: CanvasDiagramFamily): boolean {
  return family === 'classDiagram';
}
