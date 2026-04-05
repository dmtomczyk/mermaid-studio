import { CLASS_DIAGRAM_TEMPLATES } from './classDiagramTemplates';

export function createClassDiagramWebviewSource(): string {
  return `
      const CLASS_TEMPLATES = ${JSON.stringify(CLASS_DIAGRAM_TEMPLATES)};
`;
}
