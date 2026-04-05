export function createCanvasRuntimeFamilySource(): string {
  return `
      function createClassDiagramRuntimeFamilyConfig() {
        return {
          family: 'classDiagram',
          familyLabel: 'Class Diagram',
          shell: {
            sourceLabel: 'classDiagram canvas',
            templateSectionTitle: 'Add Class',
            relationSectionTitle: 'Relationships',
            addTemplateButton: 'Add this template'
          },
          defaultTemplateId: 'empty',
          hasContent(model) {
            return Array.isArray(model?.classes) ? model.classes.length || model.relations.length : false;
          },
          restoreSelection(persisted) {
            selectedClassId = persisted.selectedClassId;
            selectedRelationId = persisted.selectedRelationId;
            connectFromClassId = persisted.connectFromClassId;
            connectPreviewPoint = persisted.connectPreviewPoint || null;
          },
          restoreExtras(persisted) {
            selectedTemplateId = persisted.selectedTemplateId || 'empty';
            connectDragActive = persisted.connectDragActive || false;
            edgeEditorRelationId = persisted.edgeEditorRelationId;
            canvasContextMenu = persisted.canvasContextMenu || null;
            editingTitleClassId = persisted.editingTitleClassId;
            editingMembersClassId = persisted.editingMembersClassId;
          }
        };
      }

      function createFlowchartRuntimeFamilyConfig() {
        return {
          family: 'flowchart',
          familyLabel: 'Flowchart',
          shell: {
            sourceLabel: 'flowchart canvas',
            templateSectionTitle: 'Add Node',
            relationSectionTitle: 'Edges',
            addTemplateButton: 'Add Node'
          },
          defaultTemplateId: 'process',
          hasContent(model) {
            return Array.isArray(model?.nodes) ? model.nodes.length || model.edges.length : false;
          },
          restoreSelection(persisted) {
            selectedNodeId = persisted.selectedNodeId;
            selectedEdgeId = persisted.selectedEdgeId;
            connectFromNodeId = persisted.connectFromNodeId;
            connectPreviewPoint = persisted.connectPreviewPoint || null;
          },
          restoreExtras(persisted) {
            selectedTemplateId = persisted.selectedTemplateId || 'process';
          }
        };
      }
`;
}
