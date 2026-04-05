import { CanvasFamilyAdapter } from '../types/canvasContracts';
import { CanvasDiagramFamily } from '../types/canvasFamilies';
import { classDiagramAdapter } from './classDiagram/classDiagramAdapter';
import { flowchartAdapter } from './flowchart/flowchartAdapter';

export const canvasFamilyAdapters = {
  classDiagram: classDiagramAdapter,
  flowchart: flowchartAdapter
} satisfies Partial<Record<CanvasDiagramFamily, CanvasFamilyAdapter<any, any, any, any>>>;

export function getCanvasFamilyAdapter<TFamily extends keyof typeof canvasFamilyAdapters>(family: TFamily) {
  return canvasFamilyAdapters[family];
}

export function createEmptyCanvasFamilyModel<TFamily extends keyof typeof canvasFamilyAdapters>(family: TFamily) {
  return getCanvasFamilyAdapter(family).createEmptyModel();
}

export function parseCanvasFamilyMermaid<TFamily extends keyof typeof canvasFamilyAdapters>(family: TFamily, source: string) {
  return getCanvasFamilyAdapter(family).parseMermaid(source);
}

export function generateCanvasFamilyMermaid<TFamily extends keyof typeof canvasFamilyAdapters>(family: TFamily, model: Parameters<(typeof canvasFamilyAdapters)[TFamily]['generateMermaid']>[0]) {
  return getCanvasFamilyAdapter(family).generateMermaid(model as never);
}

export function validateCanvasFamilyModel<TFamily extends keyof typeof canvasFamilyAdapters>(family: TFamily, model: Parameters<(typeof canvasFamilyAdapters)[TFamily]['validate']>[0]) {
  return getCanvasFamilyAdapter(family).validate(model as never);
}
