import { FLOWCHART_TEMPLATES } from './flowchartTemplates';

export function createFlowchartWebviewSource(): string {
  return `
      const FLOWCHART_TEMPLATES = ${JSON.stringify(FLOWCHART_TEMPLATES)};
      const FLOWCHART_SHAPES = ['rect', 'rounded', 'stadium', 'diam', 'circle', 'lean-r', 'cyl', 'text'];
`;
}
