export function createCanvasRuntimeFamilySource(): string {
  return `
      function renderCanvasNodeActions(items) {
        if (!Array.isArray(items) || !items.length) {
          return '';
        }
        return '<div class="node-actions">' + items.map((item) => '<button type="button" class="' + escapeHtml(item.tone || 'ghost') + '" data-action="' + escapeHtml(item.action) + '">' + escapeHtml(item.label) + '</button>').join('') + '</div>';
      }

      function renderCanvasInspectorActions(items, idPrefix) {
        if (!Array.isArray(items) || !items.length) {
          return '';
        }
        return '<div class="small-actions">' + items.map((item) => '<button id="' + escapeHtml(idPrefix + item.action) + '" class="' + escapeHtml(item.tone || 'ghost') + '">' + escapeHtml(item.label) + '</button>').join('') + '</div>';
      }

      function renderCanvasContextMenuButtons(items) {
        if (!Array.isArray(items) || !items.length) {
          return '';
        }
        return items.map((item) => item.kind === 'divider'
          ? '<div class="context-menu-divider"></div>'
          : '<button type="button" data-context-action="' + escapeHtml(item.action) + '" class="' + escapeHtml(item.tone || '') + '">' + escapeHtml(item.label) + '</button>'
        ).join('');
      }

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
            switchFamilyCancel: 'Keep current family',
            inspectorNodeTitle: 'Selected class',
            inspectorEdgeTitle: 'Selected relationship',
            inspectorEmptyTitle: 'Canvas',
            inspectorEmptyBody: 'Select a class or relationship to edit it.'
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
          getNodeActionItems(isSelected) {
            if (!isSelected) {
              return [];
            }
            return [
              { action: 'rename', label: 'Rename', tone: 'ghost' },
              { action: 'member', label: 'Edit members', tone: 'ghost' },
              { action: 'add-nearby', label: 'Add nearby', tone: 'ghost' },
              { action: 'duplicate', label: 'Duplicate', tone: 'ghost' },
              { action: 'connect', label: 'Connect', tone: 'ghost' },
              { action: 'delete', label: 'Delete', tone: 'ghost danger' }
            ];
          },
          handleNodeAction(action, entry) {
            if (action === 'rename') {
              renameClass(entry.id);
            } else if (action === 'member') {
              addMemberToClass(entry.id);
            } else if (action === 'add-nearby') {
              addConnectedClassAt(entry.x + 280, entry.y + 40);
            } else if (action === 'duplicate') {
              duplicateClassFrom(entry.id, entry.x + 40, entry.y + 180);
            } else if (action === 'connect') {
              startConnectFrom(entry.id);
            } else if (action === 'delete') {
              deleteClass(entry.id);
            }
          },
          getInspectorNodeActions() {
            return [
              { action: 'rename', label: 'Rename', tone: 'ghost' },
              { action: 'addMember', label: 'Add member', tone: 'ghost' },
              { action: 'connect', label: 'Connect from here', tone: 'ghost' },
              { action: 'delete', label: 'Delete class', tone: 'secondary danger' }
            ];
          },
          handleInspectorNodeAction(action, selectedClass) {
            if (action === 'rename') {
              renameClass(selectedClass.id);
            } else if (action === 'addMember') {
              addMemberToClass(selectedClass.id);
            } else if (action === 'connect') {
              startConnectFrom(selectedClass.id);
            } else if (action === 'delete') {
              deleteClass(selectedClass.id);
            }
          },
          getInspectorEdgeActions() {
            return [
              { action: 'delete', label: 'Delete relationship', tone: 'secondary danger' },
              { action: 'focusFrom', label: 'Focus source class', tone: 'ghost' },
              { action: 'focusTo', label: 'Focus target class', tone: 'ghost' }
            ];
          },
          handleInspectorEdgeAction(action, selectedRelation, ctx) {
            if (action === 'delete') {
              deleteRelation(selectedRelation.id);
            } else if (action === 'focusFrom') {
              selectedClassId = ctx.from ? ctx.from.id : undefined;
              selectedRelationId = undefined;
              connectFromClassId = undefined;
              render();
            } else if (action === 'focusTo') {
              selectedClassId = ctx.to ? ctx.to.id : undefined;
              selectedRelationId = undefined;
              connectFromClassId = undefined;
              render();
            }
          },
          getToolbarStatus(state, ctx) {
            if (ctx.connectFromId) {
              const source = ctx.getNodeById(ctx.connectFromId);
              return source ? 'Connecting from ' + source.name + '. Release on another class to create a relationship.' : 'Connecting classes.';
            }
            if (ctx.selectedEdgeId) {
              return 'Relationship selected. Edit it in the inspector.';
            }
            if (ctx.selectedNodeId) {
              const node = ctx.getNodeById(ctx.selectedNodeId);
              return node ? 'Selected ' + node.name + '. Drag to move, or edit inline / in the inspector.' : 'Class selected.';
            }
            return 'Drag classes. Double-click bare canvas to add the selected template. Drag from ports to connect.';
          },
          getContextMenuDescriptor(ctx) {
            const hasSelectedNode = Boolean(ctx.selectedNode);
            const hasSelectedEdge = Boolean(ctx.selectedEdge);
            return {
              title: hasSelectedNode ? 'Class actions' : hasSelectedEdge ? 'Relationship actions' : 'Canvas actions',
              items: hasSelectedNode
                ? [
                    { action: 'rename', label: 'Rename' },
                    { action: 'member', label: 'Edit members' },
                    { action: 'duplicate', label: 'Duplicate' },
                    { action: 'connect', label: 'Connect' },
                    { action: 'delete', label: ctx.deleteArmed ? 'Confirm delete' : 'Delete', tone: 'danger' }
                  ]
                : hasSelectedEdge
                  ? [
                      { action: 'label', label: 'Rename label' },
                      { action: 'delete', label: ctx.deleteArmed ? 'Confirm delete' : 'Delete', tone: 'danger' }
                    ]
                  : [
                      { action: 'add-empty', label: 'Add blank class' },
                      { action: 'add-template', label: 'Add selected template' },
                      { action: 'duplicate', label: 'Duplicate selected' },
                      { action: 'connect-selected', label: 'Add connected class' }
                    ]
            };
          },
          handleContextMenuAction(action, ctx) {
            if (action === 'add-class' || action === 'add-empty') {
              ctx.resetDeleteArmed();
              addClassAt(ctx.menu.canvasX, ctx.menu.canvasY, 'empty');
            } else if (action === 'add-template-class' || action === 'add-template') {
              ctx.resetDeleteArmed();
              addClassAt(ctx.menu.canvasX, ctx.menu.canvasY, selectedTemplateId);
            } else if (action === 'duplicate-class' || action === 'duplicate') {
              ctx.resetDeleteArmed();
              duplicateSelectedClassAt(ctx.menu.canvasX, ctx.menu.canvasY);
            } else if (action === 'connect-here' || action === 'connect-selected') {
              ctx.resetDeleteArmed();
              addConnectedClassAt(ctx.menu.canvasX, ctx.menu.canvasY);
            } else if (action === 'rename') {
              ctx.resetDeleteArmed();
              if (selectedClassId) {
                renameClass(selectedClassId);
              }
              closeCanvasContextMenu();
            } else if (action === 'member') {
              ctx.resetDeleteArmed();
              if (selectedClassId) {
                addMemberToClass(selectedClassId);
              }
              closeCanvasContextMenu();
            } else if (action === 'connect') {
              ctx.resetDeleteArmed();
              if (selectedClassId) {
                startConnectFrom(selectedClassId);
              }
              closeCanvasContextMenu();
            } else if (action === 'label') {
              ctx.resetDeleteArmed();
              if (selectedRelationId) {
                selectRelation(selectedRelationId);
                shouldFocusEdgeEditorLabel = true;
                render();
              }
              closeCanvasContextMenu();
            } else if (action === 'delete-selected' || action === 'delete') {
              if (!ctx.deleteArmed) {
                ctx.armDelete();
                renderContextMenu();
                return;
              }
              if (selectedRelationId) {
                deleteRelation(selectedRelationId);
              } else if (selectedClassId) {
                deleteClass(selectedClassId);
              }
            } else if (action === 'cancel-connect') {
              ctx.resetDeleteArmed();
              cancelConnectMode();
              closeCanvasContextMenu();
            }
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
            inspectorNodeTitle: 'Selected node',
            inspectorEdgeTitle: 'Selected edge',
            inspectorEmptyTitle: 'Flowchart',
            inspectorEmptyBody: 'Select a node or edge on the canvas to edit it.',
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
          getNodeActionItems(isSelected) {
            if (!isSelected) {
              return [];
            }
            return [
              { action: 'connect', label: 'Connect', tone: 'ghost' },
              { action: 'duplicate', label: 'Duplicate', tone: 'ghost' },
              { action: 'delete', label: 'Delete', tone: 'ghost danger' }
            ];
          },
          handleNodeAction(action, node) {
            if (action === 'connect') {
              startConnectFrom(node.id);
            } else if (action === 'duplicate') {
              duplicateNodeAt(node.id, node.x + 40, node.y + 120);
            } else if (action === 'delete') {
              deleteNode(node.id);
            }
          },
          getInspectorNodeActions() {
            return [
              { action: 'connect', label: 'Connect from here', tone: 'ghost' },
              { action: 'duplicate', label: 'Duplicate', tone: 'ghost' },
              { action: 'delete', label: 'Delete node', tone: 'secondary danger' }
            ];
          },
          handleInspectorNodeAction(action, selectedNode) {
            if (action === 'connect') {
              startConnectFrom(selectedNode.id);
            } else if (action === 'duplicate') {
              duplicateNodeAt(selectedNode.id, selectedNode.x + 40, selectedNode.y + 120);
            } else if (action === 'delete') {
              deleteNode(selectedNode.id);
            }
          },
          getInspectorEdgeActions() {
            return [
              { action: 'delete', label: 'Delete edge', tone: 'secondary danger' }
            ];
          },
          handleInspectorEdgeAction(action, selectedEdge) {
            if (action === 'delete') {
              deleteEdge(selectedEdge.id);
            }
          },
          getToolbarStatus(state, ctx) {
            if (ctx.connectFromId) {
              const source = ctx.getNodeById(ctx.connectFromId);
              return source ? 'Connecting from ' + source.label + '. Release on another node to create an edge.' : 'Connecting nodes.';
            }
            if (ctx.selectedEdgeId) {
              return 'Edge selected. Edit it in the inspector.';
            }
            if (ctx.selectedNodeId) {
              const node = ctx.getNodeById(ctx.selectedNodeId);
              return node ? 'Selected ' + node.label + '. Drag to move, or edit in the inspector.' : 'Node selected.';
            }
            return 'Drag nodes. Double-click bare canvas to add the selected node template. Drag from ports to connect.';
          },
          getContextMenuDescriptor(ctx) {
            return {
              title: ctx.selectedNode ? 'Node actions' : ctx.selectedEdge ? 'Edge actions' : 'Canvas actions',
              items: ctx.selectedNode
                ? [
                    { action: 'duplicate', label: 'Duplicate' },
                    { action: 'connect', label: 'Connect' },
                    { action: 'delete', label: ctx.deleteArmed ? 'Confirm delete' : 'Delete', tone: 'danger' }
                  ]
                : ctx.selectedEdge
                  ? [
                      { action: 'delete', label: ctx.deleteArmed ? 'Confirm delete' : 'Delete', tone: 'danger' }
                    ]
                  : [
                      { action: 'add-template', label: 'Add selected node' },
                      { action: 'add-empty', label: 'Add process node' }
                    ]
            };
          },
          handleContextMenuAction(action, ctx) {
            if (action === 'add-template') {
              ctx.resetDeleteArmed();
              addNodeAt(ctx.menu.canvasX, ctx.menu.canvasY, selectedTemplateId);
            } else if (action === 'add-empty') {
              ctx.resetDeleteArmed();
              addNodeAt(ctx.menu.canvasX, ctx.menu.canvasY, 'process');
            } else if (action === 'duplicate' && ctx.selectedNode) {
              ctx.resetDeleteArmed();
              duplicateNodeAt(ctx.selectedNode.id, ctx.menu.canvasX, ctx.menu.canvasY);
            } else if (action === 'connect' && ctx.selectedNode) {
              ctx.resetDeleteArmed();
              startConnectFrom(ctx.selectedNode.id);
              closeCanvasContextMenu();
            } else if (action === 'delete') {
              if (!ctx.deleteArmed) {
                ctx.armDelete();
                return;
              }
              if (ctx.selectedEdge) {
                deleteEdge(ctx.selectedEdge.id);
              } else if (ctx.selectedNode) {
                deleteNode(ctx.selectedNode.id);
              }
            }
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
