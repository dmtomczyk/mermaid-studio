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
          copy: {
            emptyRelationList: 'No relationships yet. Select a class, then use Connect Selected or the Connect button on the node.',
            emptyValidation: 'No validation issues.',
            switchFamilyTitle: 'Switch diagram family?',
            switchFamilyMessage: 'This will reset the current canvas and start a new diagram family.',
            switchFamilyAccept: 'Switch family',
            switchFamilyCancel: 'Keep current family'
          },
          defaultTemplateId: 'empty',
          templateOptions() {
            return CLASS_TEMPLATES.map((template) => ({ value: template.id, label: template.label }));
          },
          isCompatiblePersistedState(nextState) {
            return !!nextState && !!nextState.model && Array.isArray(nextState.model.classes) && Array.isArray(nextState.model.relations);
          },
          getNodeBounds(node) {
            return {
              x: node.x,
              y: node.y,
              width: node.width || 220,
              height: node.height || 120
            };
          },
          getDiagramBounds(model) {
            const padding = 80;
            if (!model.classes.length) {
              return { x: 0, y: 0, width: 800, height: 600 };
            }
            const bounds = model.classes.map((entry) => this.getNodeBounds(entry));
            const minX = Math.min(...bounds.map((entry) => entry.x - padding));
            const maxX = Math.max(...bounds.map((entry) => entry.x + entry.width + padding));
            const minY = Math.min(...bounds.map((entry) => entry.y - padding));
            const maxY = Math.max(...bounds.map((entry) => entry.y + entry.height + padding));
            return {
              x: minX,
              y: minY,
              width: Math.max(240, maxX - minX),
              height: Math.max(180, maxY - minY)
            };
          },
          getSelectionBounds(model, selectedClass, selectedRelation) {
            if (selectedClass) {
              const bounds = this.getNodeBounds(selectedClass);
              return {
                x: bounds.x - 60,
                y: bounds.y - 60,
                width: bounds.width + 120,
                height: bounds.height + 120
              };
            }
            if (selectedRelation) {
              const from = model.classes.find((entry) => entry.id === selectedRelation.from);
              const to = model.classes.find((entry) => entry.id === selectedRelation.to);
              if (from && to) {
                const a = this.getNodeBounds(from);
                const b = this.getNodeBounds(to);
                const left = Math.min(a.x, b.x);
                const top = Math.min(a.y, b.y);
                const right = Math.max(a.x + a.width, b.x + b.width);
                const bottom = Math.max(a.y + a.height, b.y + b.height);
                return {
                  x: left - 80,
                  y: top - 80,
                  width: right - left + 160,
                  height: bottom - top + 160
                };
              }
            }
            return null;
          },
          getEdgePath(from, to) {
            const a = this.getNodeBounds(from);
            const b = this.getNodeBounds(to);
            const startX = worldToStageX(a.x + a.width / 2);
            const startY = worldToStageY(a.y + a.height / 2);
            const endX = worldToStageX(b.x + b.width / 2);
            const endY = worldToStageY(b.y + b.height / 2);
            const midX = Math.round((startX + endX) / 2);
            return 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;
          },
          getPreviewPath(from, previewPoint) {
            const a = this.getNodeBounds(from);
            const startX = worldToStageX(a.x + a.width / 2);
            const startY = worldToStageY(a.y + a.height / 2);
            const endX = worldToStageX(previewPoint.x);
            const endY = worldToStageY(previewPoint.y);
            const midX = Math.round((startX + endX) / 2);
            return 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;
          },
          renderEdgeLabelPosition(from, to) {
            const a = this.getNodeBounds(from);
            const b = this.getNodeBounds(to);
            return {
              x: Math.round((worldToStageX(a.x + a.width / 2) + worldToStageX(b.x + b.width / 2)) / 2),
              y: Math.round((worldToStageY(a.y + a.height / 2) + worldToStageY(b.y + b.height / 2)) / 2) - 8
            };
          },
          getEdgeStrokeClass(relation, isSelected) {
            return 'edge-line' + (isSelected ? ' selected' : '');
          },
          getPreviewStrokeClass() {
            return 'edge-line connecting';
          },
          getEdgeLabelText(relation) {
            return relation.label || relation.type || '-->';
          },
          getNodeRenderClass(entry, isSelected, isConnectSource) {
            return 'class-node' + (isSelected ? ' selected' : '') + (isConnectSource ? ' connect-source' : '');
          },
          getNodeShapeClass() {
            return '';
          },
          getNodeBodyHtml(entry) {
            return '<div class="node-section-label">Members</div><div class="node-members">'
              + (Array.isArray(entry.members) && entry.members.length
                ? entry.members.map((member) => '<span class="node-member-line">' + highlightNodeMemberLine(member) + '</span>').join('')
                : '<span class="meta">No members yet.</span>')
              + '</div>';
          },
          getNodeHintText() {
            return 'Drag to move · edit inline or in the inspector';
          },
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
          copy: {
            emptyRelationList: 'No edges yet.',
            emptyValidation: 'No validation issues.',
            inspectorTitle: 'Flowchart',
            inspectorEmpty: 'Select a node or edge on the canvas to edit it.',
            switchFamilyTitle: 'Switch diagram family?',
            switchFamilyMessage: 'This will reset the current canvas and start a new diagram family.',
            switchFamilyAccept: 'Switch family',
            switchFamilyCancel: 'Keep current family'
          },
          defaultTemplateId: 'process',
          templateOptions() {
            return FLOWCHART_TEMPLATES.map((template) => ({ value: template.id, label: template.label }));
          },
          isCompatiblePersistedState(nextState) {
            return !!nextState && !!nextState.model && Array.isArray(nextState.model.nodes) && Array.isArray(nextState.model.edges);
          },
          getNodeBounds(node) {
            const dims = measureFlowchartNode(node.shape, node.label, node.width, node.height);
            return {
              x: node.x,
              y: node.y,
              width: dims.width,
              height: dims.height
            };
          },
          getDiagramBounds(model) {
            if (!model.nodes.length) {
              return { x: 0, y: 0, width: 800, height: 600 };
            }
            const bounds = model.nodes.map((entry) => this.getNodeBounds(entry));
            return {
              x: Math.min(...bounds.map((entry) => entry.x)) - 80,
              y: Math.min(...bounds.map((entry) => entry.y)) - 80,
              width: Math.max(...bounds.map((entry) => entry.x + entry.width)) - Math.min(...bounds.map((entry) => entry.x)) + 160,
              height: Math.max(...bounds.map((entry) => entry.y + entry.height)) - Math.min(...bounds.map((entry) => entry.y)) + 160
            };
          },
          getSelectionBounds(model, selectedNode, selectedEdge) {
            if (selectedNode) {
              const bounds = this.getNodeBounds(selectedNode);
              return { x: bounds.x - 60, y: bounds.y - 60, width: bounds.width + 120, height: bounds.height + 120 };
            }
            if (selectedEdge) {
              const from = model.nodes.find((entry) => entry.id === selectedEdge.from);
              const to = model.nodes.find((entry) => entry.id === selectedEdge.to);
              if (!from || !to) {
                return null;
              }
              const a = this.getNodeBounds(from);
              const b = this.getNodeBounds(to);
              const minX = Math.min(a.x, b.x) - 80;
              const minY = Math.min(a.y, b.y) - 80;
              const maxX = Math.max(a.x + a.width, b.x + b.width) + 80;
              const maxY = Math.max(a.y + a.height, b.y + b.height) + 80;
              return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
            }
            return null;
          },
          getEdgePath(from, to) {
            const a = this.getNodeBounds(from);
            const b = this.getNodeBounds(to);
            const startX = worldToStageX(a.x + a.width / 2);
            const startY = worldToStageY(a.y + a.height / 2);
            const endX = worldToStageX(b.x + b.width / 2);
            const endY = worldToStageY(b.y + b.height / 2);
            const midX = Math.round((startX + endX) / 2);
            return 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;
          },
          getPreviewPath(from, previewPoint) {
            const a = this.getNodeBounds(from);
            const startX = worldToStageX(a.x + a.width / 2);
            const startY = worldToStageY(a.y + a.height / 2);
            const endX = worldToStageX(previewPoint.x);
            const endY = worldToStageY(previewPoint.y);
            const midX = Math.round((startX + endX) / 2);
            return 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;
          },
          renderEdgeLabelPosition(from, to) {
            const a = this.getNodeBounds(from);
            const b = this.getNodeBounds(to);
            return {
              x: Math.round((worldToStageX(a.x + a.width / 2) + worldToStageX(b.x + b.width / 2)) / 2),
              y: Math.round((worldToStageY(a.y + a.height / 2) + worldToStageY(b.y + b.height / 2)) / 2) - 8
            };
          },
          getEdgeStrokeClass(edge, isSelected) {
            return 'edge-line' + (isSelected ? ' selected' : '') + (edge.type === '-.->' ? ' dashed' : '');
          },
          getPreviewStrokeClass() {
            return 'edge-line preview';
          },
          getEdgeLabelText(edge) {
            return edge.label || edge.type || '-->';
          },
          getNodeRenderClass(node, isSelected, isConnectSource) {
            return 'class-node flowchart-node' + (isSelected ? ' selected' : '') + (isConnectSource ? ' connect-source' : '') + ' ' + this.getNodeShapeClass(node);
          },
          getNodeShapeClass(node) {
            return 'flowchart-shape-' + node.shape;
          },
          getNodeBodyHtml(node) {
            return '<div>' + escapeHtml(node.id) + '</div>';
          },
          getNodeHintText() {
            return 'Drag to move · edit in inspector';
          },
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
