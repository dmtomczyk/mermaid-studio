export function createCanvasRuntimeDefaultsSource(): string {
  return `
      function createClassDiagramRuntimeDefaults() {
        return {
          initialState: {
            family: 'classDiagram',
            familyLabel: 'Class Diagram',
            availableFamilies: [
              { id: 'classDiagram', label: 'Class Diagram' },
              { id: 'flowchart', label: 'Flowchart' }
            ],
            shellLabels: {
              templateSelect: 'Class template',
              addTemplateButton: 'Add this template',
              sidebarTemplateSection: 'Add Class',
              relationSection: 'Relationships'
            },
            sourceLabel: 'classDiagram canvas',
            linkedFileLabel: 'Untitled canvas',
            linkedFileKind: 'ephemeral',
            canReimport: false,
            canOpenLinkedFile: false,
            canApply: true,
            issues: [],
            model: { family: 'classDiagram', classes: [], relations: [] },
            mermaid: ''
          }
        };
      }

      function createFlowchartRuntimeDefaults() {
        return {
          initialState: {
            family: 'flowchart',
            familyLabel: 'Flowchart',
            availableFamilies: [
              { id: 'classDiagram', label: 'Class Diagram' },
              { id: 'flowchart', label: 'Flowchart' }
            ],
            shellLabels: {
              templateSelect: 'Node template',
              addTemplateButton: 'Add this node template',
              sidebarTemplateSection: 'Add Node',
              relationSection: 'Edges'
            },
            sourceLabel: 'flowchart canvas',
            linkedFileLabel: 'Untitled canvas',
            linkedFileKind: 'ephemeral',
            canReimport: false,
            canOpenLinkedFile: false,
            canApply: true,
            issues: [],
            model: { family: 'flowchart', direction: 'TB', nodes: [], edges: [] },
            mermaid: ''
          }
        };
      }
`;
}
