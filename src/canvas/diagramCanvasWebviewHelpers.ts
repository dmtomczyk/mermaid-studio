import { createCanvasConnectionCoreSource } from './core/canvasConnectionSource';
import { createCanvasContextMenuCoreSource } from './core/canvasContextMenuSource';
import { createCanvasSelectionCoreSource } from './core/canvasSelectionSource';
import { createCanvasViewportCoreSource } from './core/canvasViewportSource';

export function createCanvasGeometryHelpersSource(): string {
  return `
${createCanvasViewportCoreSource()}

      function getDiagramBounds() {
        const padding = 80;
        if (!state.model.classes.length) {
          return { x: 0, y: 0, width: 800, height: 600 };
        }
        const xs = [];
        const ys = [];
        state.model.classes.forEach((entry) => {
          xs.push(entry.x - padding, entry.x + (entry.width || 220) + padding);
          ys.push(entry.y - padding, entry.y + (entry.height || 120) + padding);
        });
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return {
          x: minX,
          y: minY,
          width: Math.max(240, maxX - minX),
          height: Math.max(180, maxY - minY)
        };
      }

      function getSelectionBounds() {
        const selectedClass = getSelectedClass();
        if (selectedClass) {
          return {
            x: selectedClass.x - 60,
            y: selectedClass.y - 60,
            width: (selectedClass.width || 220) + 120,
            height: (selectedClass.height || 120) + 120
          };
        }
        const selectedRelation = getSelectedRelation();
        if (selectedRelation) {
          const from = state.model.classes.find((entry) => entry.id === selectedRelation.from);
          const to = state.model.classes.find((entry) => entry.id === selectedRelation.to);
          if (from && to) {
            const left = Math.min(from.x, to.x);
            const top = Math.min(from.y, to.y);
            const right = Math.max(from.x + (from.width || 220), to.x + (to.width || 220));
            const bottom = Math.max(from.y + (from.height || 120), to.y + (to.height || 120));
            return {
              x: left - 80,
              y: top - 80,
              width: right - left + 160,
              height: bottom - top + 160
            };
          }
        }
        return null;
      }

      function fitBounds(bounds) {
        fitViewportToBounds(bounds);
      }

      function fitWidth() {
        const bounds = getSelectionBounds() || getDiagramBounds();
        fitViewportWidthToBounds(bounds);
      }

      function fitActualSize() {
        const bounds = getSelectionBounds() || getDiagramBounds();
        fitViewportActualSize(bounds);
      }

      function updateConnectPreviewFromClientPoint(clientX, clientY) {
        if (!connectFromClassId) {
          return;
        }
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(clientX - rect.left, clientY - rect.top);
        connectPreviewPoint = {
          x: stagePoint.x,
          y: stagePoint.y
        };
        renderEdges();
      }
`;
}

export function createCanvasActionsSource(): string {
  return `
${createCanvasConnectionCoreSource()}
${createCanvasContextMenuCoreSource()}
${createCanvasSelectionCoreSource()}

      function nextId(prefix) {
        return prefix + '-' + Math.random().toString(36).slice(2, 10);
      }

      function getSelectedClass() {
        return state.model.classes.find((entry) => entry.id === selectedClassId);
      }

      function getSelectedRelation() {
        return state.model.relations.find((entry) => entry.id === selectedRelationId);
      }

      function isBareCanvasTarget(target) {
        return !!target
          && !target.closest('.class-node')
          && !target.closest('[data-relation-id]')
          && !target.closest('#contextMenu')
          && !target.closest('#edgeEditor')
          && !target.closest('.canvas-hud')
          && (target === canvasShell || target === canvasStage || target === nodeLayer || target === edgeLayer || target instanceof SVGSVGElement);
      }

      function emitStateChanged() {
        vscode.postMessage({ type: 'stateChanged', model: state.model });
      }

      function getTemplateById(templateId) {
        return CLASS_TEMPLATES.find((entry) => entry.id === templateId) || CLASS_TEMPLATES[0];
      }

      function getUniqueClassName(baseName) {
        const normalized = String(baseName || 'NewClass').trim() || 'NewClass';
        const existing = new Set(state.model.classes.map((entry) => entry.name.trim().toLowerCase()));
        if (!existing.has(normalized.toLowerCase())) {
          return normalized;
        }
        let counter = 2;
        while (existing.has((normalized + counter).toLowerCase())) {
          counter += 1;
        }
        return normalized + counter;
      }

      function addClassAt(x, y, templateId = 'empty') {
        const nextNumber = state.model.classes.length + 1;
        const template = getTemplateById(templateId);
        state.model.classes.push({
          id: nextId('class'),
          name: getUniqueClassName(template.id === 'empty' ? 'NewClass' + nextNumber : template.defaultName),
          members: template.members.slice(),
          x: Math.max(-WORLD_ORIGIN_X + 40, Math.round(x)),
          y: Math.max(-WORLD_ORIGIN_Y + 40, Math.round(y)),
          width: 220,
          height: 120
        });
        selectedClassId = state.model.classes[state.model.classes.length - 1].id;
        selectedRelationId = undefined;
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        canvasContextMenu = null;
        editingMembersClassId = undefined;
        editingTitleClassId = selectedClassId;
        emitStateChanged();
      }

      function startConnectFrom(classId) {
        selectedClassId = classId;
        selectedRelationId = undefined;
        editingTitleClassId = undefined;
        editingMembersClassId = undefined;
        canvasContextMenu = null;
        connectFromClassId = classId;
        const source = state.model.classes.find((entry) => entry.id === classId);
        connectPreviewPoint = source
          ? { x: source.x + (source.width || 220) / 2, y: source.y + (source.height || 120) / 2 }
          : null;
        connectDragActive = false;
        render();
      }

      function duplicateClassFrom(sourceClassId, x, y) {
        const source = state.model.classes.find((entry) => entry.id === sourceClassId);
        if (!source) {
          addClassAt(x, y);
          return;
        }
        const nextNumber = state.model.classes.length + 1;
        state.model.classes.push({
          id: nextId('class'),
          name: getUniqueClassName(source.name + 'Copy' + nextNumber),
          members: source.members.slice(),
          x: Math.max(-WORLD_ORIGIN_X + 40, Math.round(x)),
          y: Math.max(-WORLD_ORIGIN_Y + 40, Math.round(y)),
          width: source.width || 220,
          height: source.height || 120
        });
        selectedClassId = state.model.classes[state.model.classes.length - 1].id;
        selectedRelationId = undefined;
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        editingMembersClassId = undefined;
        editingTitleClassId = selectedClassId;
        canvasContextMenu = null;
        emitStateChanged();
      }

      function duplicateSelectedClassAt(x, y) {
        const selected = getSelectedClass();
        if (!selected) {
          addClassAt(x, y, selectedTemplateId);
          return;
        }
        duplicateClassFrom(selected.id, x, y);
      }

      function addConnectedClassAt(x, y) {
        const sourceId = selectedClassId;
        addClassAt(x, y, selectedTemplateId);
        const createdId = selectedClassId;
        if (sourceId && createdId && sourceId !== createdId) {
          state.model.relations.push({
            id: nextId('relation'),
            from: sourceId,
            to: createdId,
            type: '-->',
            label: ''
          });
          selectedRelationId = state.model.relations[state.model.relations.length - 1].id;
        }
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        canvasContextMenu = null;
        emitStateChanged();
      }

      function deleteClass(classId) {
        canvasContextMenu = null;
        state.model.classes = state.model.classes.filter((entry) => entry.id !== classId);
        state.model.relations = state.model.relations.filter((entry) => entry.from !== classId && entry.to !== classId);
        if (selectedClassId === classId) {
          selectedClassId = undefined;
        }
        if (connectFromClassId === classId) {
          connectFromClassId = undefined;
          connectPreviewPoint = null;
        }
        if (editingTitleClassId === classId) {
          editingTitleClassId = undefined;
        }
        if (editingMembersClassId === classId) {
          editingMembersClassId = undefined;
        }
        selectedRelationId = undefined;
        emitStateChanged();
      }

      function createRelation(fromId, toId) {
        if (!fromId || !toId || fromId === toId) {
          clearConnectionPreview();
          render();
          return;
        }
        state.model.relations.push({
          id: nextId('relation'),
          from: fromId,
          to: toId,
          type: '-->',
          label: ''
        });
        selectedClassId = undefined;
        selectedRelationId = state.model.relations[state.model.relations.length - 1].id;
        clearConnectionPreview();
        emitStateChanged();
      }

      function deleteRelation(relationId) {
        canvasContextMenu = null;
        state.model.relations = state.model.relations.filter((entry) => entry.id !== relationId);
        if (selectedRelationId === relationId) {
          selectedRelationId = undefined;
        }
        if (edgeEditorRelationId === relationId) {
          edgeEditorRelationId = undefined;
        }
        emitStateChanged();
      }

      function startInlineTitleEdit(classId) {
        selectedClassId = classId;
        selectedRelationId = undefined;
        editingMembersClassId = undefined;
        editingTitleClassId = classId;
        render();
      }

      function commitInlineTitleEdit(classId, nextName) {
        const entry = state.model.classes.find((item) => item.id === classId);
        if (!entry) {
          editingTitleClassId = undefined;
          render();
          return;
        }
        const trimmed = String(nextName || '').trim();
        entry.name = trimmed || entry.name;
        selectedClassId = entry.id;
        selectedRelationId = undefined;
        editingTitleClassId = undefined;
        emitStateChanged();
      }

      function startInlineMembersEdit(classId) {
        const entry = state.model.classes.find((item) => item.id === classId);
        if (!entry) {
          return;
        }
        selectedClassId = classId;
        selectedRelationId = undefined;
        editingTitleClassId = undefined;
        editingMembersClassId = classId;
        render();
      }

      function commitInlineMembersEdit(classId, nextMembersText) {
        const entry = state.model.classes.find((item) => item.id === classId);
        if (!entry) {
          editingMembersClassId = undefined;
          render();
          return;
        }
        entry.members = String(nextMembersText || '')
          .split(/\\r?\\n/)
          .map((member) => member.trim())
          .filter(Boolean);
        selectedClassId = entry.id;
        selectedRelationId = undefined;
        editingMembersClassId = undefined;
        emitStateChanged();
      }

      function renameClass(classId) {
        startInlineTitleEdit(classId);
      }

      function addMemberToClass(classId) {
        const entry = state.model.classes.find((item) => item.id === classId);
        if (!entry) {
          return;
        }
        if (!entry.members.length) {
          entry.members.push('+newField: string');
        } else {
          entry.members.push('');
        }
        startInlineMembersEdit(classId);
      }

      function editRelationLabel(relationId) {
        const relation = state.model.relations.find((item) => item.id === relationId);
        if (!relation) {
          return;
        }
        const label = window.prompt('Relationship label', relation.label || '');
        if (label === null) {
          return;
        }
        relation.label = label.trim() || undefined;
        selectedRelationId = relation.id;
        selectedClassId = undefined;
        emitStateChanged();
      }

      function selectRelation(relationId) {
        selectedRelationId = relationId;
        selectedClassId = undefined;
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
        edgeEditorRelationId = undefined;
        canvasContextMenu = null;
        render();
      }

      function populateClassOptions(select, selectedId) {
        select.innerHTML = '';
        state.model.classes.forEach((entry) => {
          const option = document.createElement('option');
          option.value = entry.id;
          option.textContent = entry.name;
          option.selected = entry.id === selectedId;
          select.appendChild(option);
        });
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
`;
}

export function createCanvasRenderHelpersSource(): string {
  return `
      function initializeViewportIfNeeded() {
        if (viewportInitialized) {
          pushDebugEvent('viewport:init:skip', { reason: 'already-initialized' });
          return;
        }
        if (!state.model.classes.length) {
          pushDebugEvent('viewport:init:skip', { reason: 'no-classes' });
          return;
        }
        const shellRect = canvasShell.getBoundingClientRect();
        if (!shellRect.width || !shellRect.height) {
          pushDebugEvent('viewport:init:defer', { width: shellRect.width, height: shellRect.height });
          requestAnimationFrame(() => requestAnimationFrame(() => initializeViewportIfNeeded()));
          return;
        }
        viewportInitialized = true;
        const bounds = getDiagramBounds();
        pushDebugEvent('viewport:init:fit', {
          classCount: state.model.classes.length,
          width: shellRect.width,
          height: shellRect.height,
          boundsX: bounds ? bounds.x : null,
          boundsY: bounds ? bounds.y : null,
          boundsW: bounds ? bounds.width : null,
          boundsH: bounds ? bounds.height : null
        });
        fitBounds(bounds);
        requestAnimationFrame(() => renderMinimap());
      }

      function renderToolbarStatus() {
        if (!toolbarStatus) {
          return;
        }
        if (connectFromClassId) {
          const source = state.model.classes.find((entry) => entry.id === connectFromClassId);
          toolbarStatus.textContent = source
            ? 'Connecting from ' + source.name + '. Release on another class to create a relationship.'
            : 'Connecting classes. Release on another class to create a relationship.';
          return;
        }
        if (selectedRelationId) {
          toolbarStatus.textContent = 'Relationship selected. Edit it from the edge editor or delete it from the canvas.';
          return;
        }
        if (selectedClassId) {
          const selected = state.model.classes.find((entry) => entry.id === selectedClassId);
          toolbarStatus.textContent = selected
            ? 'Selected ' + selected.name + '. Drag to move, edit members in the inspector, or start a connection.'
            : 'Class selected. Drag to move or start a connection.';
          return;
        }
        toolbarStatus.textContent = 'Drag classes. Double-click bare canvas to place the selected template. Drag from ports to connect.';
      }

      function render() {
        renderCanvasShellChrome(runtimeFamily);
        reimportButton.disabled = !state.canReimport;
        openLinkedFileButton.disabled = !state.canOpenLinkedFile;
        classTemplateSelect.value = selectedTemplateId;
        ensureSelection();
        applyZoom();
        renderNodes();
        renderEdges();
        renderInspector();
        renderLinkedFileInfo();
        renderTemplatePreview();
        renderRelations();
        renderValidation();
        renderMermaidSource();
        renderToolbarStatus();
        renderContextMenu();
        renderEdgeEditor();
        renderMinimap();
        renderDebugPanel();
        vscode.setState({
          state,
          selectedClassId,
          selectedRelationId,
          connectFromClassId,
          connectPreviewPoint,
          selectedTemplateId,
          connectDragActive,
          edgeEditorRelationId,
          canvasContextMenu,
          editingTitleClassId,
          editingMembersClassId,
          zoom
        });
      }
`;
}


export function createCanvasRenderGroupsSource(): string {
  return `
      function renderNodes() {
        nodeLayer.innerHTML = '';
        state.model.classes.forEach((entry) => {
          const card = document.createElement('article');
          card.dataset.classId = entry.id;
          card.className = 'class-node'
            + (entry.id === selectedClassId ? ' selected' : '')
            + (entry.id === connectFromClassId ? ' connect-source' : '');
          card.style.left = worldToStageX(entry.x) + 'px';
          card.style.top = worldToStageY(entry.y) + 'px';
          card.style.width = (entry.width || 220) + 'px';

          const selected = entry.id === selectedClassId;
          const titleEditing = editingTitleClassId === entry.id;
          const membersEditing = editingMembersClassId === entry.id;
          const selectedActions = selected
            ? '<div class="node-actions">'
              + '<button type="button" class="ghost" data-action="rename">Rename</button>'
              + '<button type="button" class="ghost" data-action="member">Edit members</button>'
              + '<button type="button" class="ghost" data-action="add-nearby">Add nearby</button>'
              + '<button type="button" class="ghost" data-action="duplicate">Duplicate</button>'
              + '<button type="button" class="ghost" data-action="connect">Connect</button>'
              + '<button type="button" class="ghost danger" data-action="delete">Delete</button>'
              + '</div>'
            : '';
          const titleMarkup = titleEditing
            ? '<input class="node-title-input" data-role="title-input" type="text" value="' + escapeHtml(entry.name) + '" />'
            : '<div class="node-title" title="' + escapeHtml(entry.name) + '">' + escapeHtml(entry.name) + '</div>';
          const bodyMarkup = membersEditing
            ? '<textarea class="node-members-input" data-role="members-input">' + escapeHtml(entry.members.join('\\n')) + '</textarea>'
              + renderMemberSnippetBar('node-members-input')
              + '<div class="members-editor-preview">' + renderMemberPreviewHtml(entry.members.join('\\n')) + '</div>'
            : '<div class="node-body">' + (entry.members.length ? entry.members.map((member) => '<span class="node-member-line">' + highlightNodeMemberLine(member) + '</span>').join('') : 'No members yet') + '</div>';
          card.innerHTML = '<div class="node-header">'
            + '<div class="node-header-main">' + titleMarkup + '</div>'
            + '<div class="node-header-tools">'
            + '<span class="meta">' + entry.members.length + ' members</span>'
            + '<button type="button" class="node-port' + (connectFromClassId === entry.id ? ' active' : '') + '" data-action="quick-connect" title="Connect from this class"></button>'
            + '</div>'
            + '</div>'
            + bodyMarkup
            + '<div class="node-hint">'
            + 'Drag to move · double-click title to rename · double-click members to edit inline'
            + selectedActions
            + '</div>';

          const header = card.querySelector('.node-header');
          const title = card.querySelector('.node-title');
          const body = card.querySelector('.node-body');
          const titleInput = card.querySelector('[data-role="title-input"]');
          const membersInput = card.querySelector('[data-role="members-input"]');
          const membersPreview = card.querySelector('.members-editor-preview');
          const actions = card.querySelector('.node-actions');
          const quickConnectButton = card.querySelector('[data-action="quick-connect"]');

          card.addEventListener('click', (event) => {
            event.stopPropagation();
            canvasContextMenu = null;
            if (connectFromClassId && !connectDragActive) {
              if (completeConnectionGesture(entry.id)) {
                return;
              }
            }
            selectedClassId = entry.id;
            selectedRelationId = undefined;
            render();
          });

          card.addEventListener('pointerup', (event) => {
            if (connectDragActive) {
              event.stopPropagation();
              completeConnectionGesture(entry.id);
            }
          });

          title?.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            startInlineTitleEdit(entry.id);
          });

          body?.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            startInlineMembersEdit(entry.id);
          });

          titleInput?.addEventListener('click', (event) => {
            event.stopPropagation();
          });
          titleInput?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitInlineTitleEdit(entry.id, titleInput.value);
            } else if (event.key === 'Escape') {
              editingTitleClassId = undefined;
              render();
            }
          });
          titleInput?.addEventListener('blur', () => {
            commitInlineTitleEdit(entry.id, titleInput.value);
          });

          membersInput?.addEventListener('click', (event) => {
            event.stopPropagation();
          });
          membersInput?.addEventListener('input', () => {
            if (membersPreview) {
              membersPreview.innerHTML = renderMemberPreviewHtml(membersInput.value);
            }
          });
          card.querySelector('[data-role="member-snippet-bar"]')?.addEventListener('click', (event) => {
            const button = event.target instanceof HTMLElement ? event.target.closest('[data-snippet-value]') : null;
            if (!button || !membersInput) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            appendSnippetToMembersInput(membersInput, button.getAttribute('data-snippet-value') || '');
          });
          membersInput?.addEventListener('keydown', (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              commitInlineMembersEdit(entry.id, membersInput.value);
            } else if (event.key === 'Escape') {
              editingMembersClassId = undefined;
              render();
            }
          });
          membersInput?.addEventListener('blur', () => {
            commitInlineMembersEdit(entry.id, membersInput.value);
          });

          actions?.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target instanceof HTMLElement ? event.target.getAttribute('data-action') : undefined;
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
          });

          quickConnectButton?.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            startConnectFrom(entry.id);
            connectDragActive = true;
            updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
          });
          quickConnectButton?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
          });

          header.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
            pushDebugEvent('drag:start', { id: entry.id, clientX: event.clientX, clientY: event.clientY, x: entry.x, y: entry.y });
            selectedClassId = entry.id;
            selectedRelationId = undefined;
            dragState = {
              id: entry.id,
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              originX: entry.x,
              originY: entry.y
            };
            header.setPointerCapture(event.pointerId);
          });

          header.addEventListener('pointermove', (event) => {
            if (!dragState || dragState.id !== entry.id || dragState.pointerId !== event.pointerId) {
              return;
            }
            const deltaX = (event.clientX - dragState.startX) / zoom;
            const deltaY = (event.clientY - dragState.startY) / zoom;
            entry.x = Math.max(-WORLD_ORIGIN_X + 40, Math.round(dragState.originX + deltaX));
            entry.y = Math.max(-WORLD_ORIGIN_Y + 40, Math.round(dragState.originY + deltaY));
            card.style.left = worldToStageX(entry.x) + 'px';
            card.style.top = worldToStageY(entry.y) + 'px';
            renderEdges();
          });

          const finishDrag = (event) => {
            if (!dragState || dragState.id !== entry.id || dragState.pointerId !== event.pointerId) {
              return;
            }
            pushDebugEvent('drag:end', { id: entry.id, clientX: event.clientX, clientY: event.clientY, x: entry.x, y: entry.y });
            if (header.hasPointerCapture && header.hasPointerCapture(event.pointerId)) {
              header.releasePointerCapture(event.pointerId);
            }
            dragState = null;
            render();
            emitStateChanged();
          };

          header.addEventListener('pointerup', finishDrag);
          header.addEventListener('pointercancel', finishDrag);
          nodeLayer.appendChild(card);

          if (titleInput) {
            queueMicrotask(() => {
              titleInput.focus();
              titleInput.select();
            });
          }
          if (membersInput) {
            queueMicrotask(() => {
              membersInput.focus();
              membersInput.selectionStart = membersInput.value.length;
              membersInput.selectionEnd = membersInput.value.length;
            });
          }
        });
      }

      function renderEdges() {
        edgeLayer.innerHTML = '';
        edgeLayer.setAttribute('viewBox', '0 0 ' + WORLD_WIDTH + ' ' + WORLD_HEIGHT);

        state.model.relations.forEach((relation) => {
          const from = state.model.classes.find((entry) => entry.id === relation.from);
          const to = state.model.classes.find((entry) => entry.id === relation.to);
          if (!from || !to) {
            return;
          }
          const startX = worldToStageX(from.x + (from.width || 220) / 2);
          const startY = worldToStageY(from.y + (from.height || 120) / 2);
          const endX = worldToStageX(to.x + (to.width || 220) / 2);
          const endY = worldToStageY(to.y + (to.height || 120) / 2);
          const midX = Math.round((startX + endX) / 2);
          const midY = Math.round((startY + endY) / 2);
          const d = 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;

          const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          hit.setAttribute('class', 'edge-hit');
          hit.setAttribute('d', d);
          hit.dataset.relationId = relation.id;
          hit.addEventListener('click', (event) => {
            event.stopPropagation();
            selectRelation(relation.id);
          });
          edgeLayer.appendChild(hit);

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('class', 'edge-line' + (relation.id === selectedRelationId ? ' selected' : ''));
          path.setAttribute('d', d);
          path.dataset.relationId = relation.id;
          edgeLayer.appendChild(path);

          const labelText = relation.label || relation.type || '-->';
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('class', 'edge-label' + (relation.id === selectedRelationId ? ' selected' : ''));
          label.dataset.relationId = relation.id;
          label.setAttribute('x', String(midX));
          label.setAttribute('y', String(midY - 8));
          label.setAttribute('text-anchor', 'middle');
          label.textContent = labelText;
          label.addEventListener('click', (event) => {
            event.stopPropagation();
            selectRelation(relation.id);
          });
          label.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            editRelationLabel(relation.id);
          });
          edgeLayer.appendChild(label);
        });

        if (connectFromClassId && connectPreviewPoint) {
          const from = state.model.classes.find((entry) => entry.id === connectFromClassId);
          if (from) {
            const startX = worldToStageX(from.x + (from.width || 220) / 2);
            const startY = worldToStageY(from.y + (from.height || 120) / 2);
            const endX = worldToStageX(connectPreviewPoint.x);
            const endY = worldToStageY(connectPreviewPoint.y);
            const midX = Math.round((startX + endX) / 2);
            const d = 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'edge-line connecting');
            path.setAttribute('d', d);
            edgeLayer.appendChild(path);
          }
        }
      }

      function renderLinkedFileInfo() {
        const kindLabel = state.linkedFileKind === 'markdown'
          ? 'Markdown Mermaid block'
          : state.linkedFileKind === 'mermaid'
            ? 'Linked Mermaid file'
            : 'Ephemeral / not yet linked';
        linkedFileInfo.innerHTML = '<strong>' + escapeHtml(state.linkedFileLabel || 'Untitled canvas') + '</strong><br/>'
          + escapeHtml(kindLabel)
          + (state.canReimport ? '<br/><span class="meta">Apply and Preview target this linked file.</span>' : '<br/><span class="meta">Apply will target the active editor or create a file if needed.</span>')
          + (state.canOpenLinkedFile ? '<br/><span class="meta">Use “Open Linked File” above to inspect the backing document directly.</span>' : '');
      }

      function renderTemplatePreview() {
        const template = getTemplateById(selectedTemplateId);
        templatePreview.innerHTML = '<strong>' + escapeHtml(template.label) + '</strong><br/>'
          + '<span class="meta">' + escapeHtml(template.description || '') + '</span>'
          + '<br/>'
          + '<span class="meta">Default name: ' + escapeHtml(template.defaultName) + '</span>'
          + '<br/>'
          + (template.members.length
            ? '<div class="code-block" style="margin-top:8px;">' + template.members.map((member) => '<span class="code-line-root">' + highlightNodeMemberLine(member) + '</span>').join('') + '</div>'
            : '<span class="meta">Starts empty.</span>');
      }

      function renderValidation() {
        if (!Array.isArray(state.issues) || !state.issues.length) {
          validationList.innerHTML = '<div class="inspector-empty">No validation issues.</div>';
          return;
        }
        validationList.innerHTML = state.issues.map((issue) =>
          '<div class="validation-item ' + escapeHtml(issue.level || 'warning') + '">'
          + '<strong>' + escapeHtml((issue.level || 'warning').toUpperCase()) + '</strong><br/>'
          + escapeHtml(issue.message || 'Unknown issue')
          + '</div>'
        ).join('');
      }

      function renderMemberPreviewHtml(text) {
        const lines = String(text || '').split(/\\r?\\n/);
        if (!lines.some((line) => line.trim())) {
          return '<span class="inspector-empty">No members yet.</span>';
        }
        return lines.map((line) => {
          const parsed = parseNodeMemberLine(line);
          const invalidClass = parsed.kind === 'unknown' && parsed.raw ? ' tok-invalid' : '';
          const suffix = parsed.kind === 'unknown' && parsed.raw
            ? '<span class="meta">  ← unrecognized member syntax</span>'
            : '';
          return '<span class="node-member-line' + invalidClass + '">' + highlightNodeMemberLine(line) + suffix + '</span>';
        }).join('');
      }

      function parseNodeMemberLine(member) {
        const raw = String(member || '').trim();
        if (!raw) {
          return { raw: '', visibility: '', name: '', params: '', type: '', decorator: '', kind: 'empty' };
        }

        const match = raw.match(/^(?:@([A-Za-z_][\\w.<>-]*))?\\s*([+\\-#~])?\\s*([A-Za-z_][\\w]*)\\s*(\\([^)]*\\))?\\s*(?::\\s*(.+))?$/);
        if (!match) {
          return { raw, visibility: '', name: '', params: '', type: '', decorator: '', kind: 'unknown' };
        }

        const [, decorator = '', visibility = '', name = '', params = '', type = ''] = match;
        return {
          raw,
          decorator,
          visibility,
          name,
          params,
          type: String(type || '').trim(),
          kind: params ? 'method' : 'property'
        };
      }

      function highlightNodeMemberLine(member) {
        const parsed = parseNodeMemberLine(member);
        const escaped = escapeHtml(parsed.raw || '');
        if (!parsed.raw) {
          return escaped;
        }
        if (parsed.kind === 'unknown') {
          return escaped;
        }

        let result = '';
        if (parsed.decorator) {
          result += '<span class="tok-keyword">@' + escapeHtml(parsed.decorator) + '</span>';
        }
        if (parsed.visibility) {
          result += '<span class="tok-visibility">' + escapeHtml(parsed.visibility) + '</span>';
        }
        if (parsed.name) {
          result += '<span class="tok-member-name">' + escapeHtml(parsed.name) + '</span>';
        }
        if (parsed.params) {
          result += '<span class="tok-params">' + escapeHtml(parsed.params) + '</span>';
        }
        if (parsed.type) {
          result += '<span class="tok-type">: ' + escapeHtml(parsed.type) + '</span>';
        }
        return result || escaped;
      }

      function getMemberSnippetChoices() {
        return [
          { label: 'Field', value: '+name: string' },
          { label: 'Id', value: '+id: string' },
          { label: 'Flag', value: '+enabled: boolean' },
          { label: 'Method', value: '+render(): void' },
          { label: 'Async', value: '+save(user: User): Promise<void>' },
          { label: 'Lookup', value: '#load(id: string): User | undefined' },
          { label: 'Map', value: '-cache: Map<string, User>' },
          { label: 'Date', value: '+createdAt: Date' }
        ];
      }

      function appendSnippetToMembersInput(textarea, snippet) {
        const value = textarea.value || '';
        const start = textarea.selectionStart ?? value.length;
        const end = textarea.selectionEnd ?? value.length;
        const lineStart = value.lastIndexOf('\\n', Math.max(0, start - 1)) + 1;
        const nextNewline = value.indexOf('\\n', end);
        const lineEnd = nextNewline >= 0 ? nextNewline : value.length;
        const currentLine = value.slice(lineStart, lineEnd);
        const trimmedCurrentLine = currentLine.trim();

        let replaceStart = start;
        let replaceEnd = end;
        let insertion = snippet;

        if (start !== end) {
          replaceStart = start;
          replaceEnd = end;
        } else if (!trimmedCurrentLine) {
          replaceStart = lineStart;
          replaceEnd = lineEnd;
        } else if (start === lineEnd) {
          insertion = '\\n' + snippet;
          replaceStart = start;
          replaceEnd = end;
        } else {
          replaceStart = lineStart;
          replaceEnd = lineEnd;
        }

        textarea.value = value.slice(0, replaceStart) + insertion + value.slice(replaceEnd);
        const nextCursor = replaceStart + insertion.length;
        textarea.selectionStart = nextCursor;
        textarea.selectionEnd = nextCursor;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
      }

      function renderMemberSnippetBar(inputId) {
        return '<div class="member-snippet-bar" data-role="member-snippet-bar" data-input-id="' + escapeHtml(inputId) + '">'
          + getMemberSnippetChoices().map((choice) => '<button type="button" class="secondary" data-snippet-value="' + escapeHtml(choice.value) + '">' + escapeHtml(choice.label) + '</button>').join('')
          + '</div>'
          + '<div class="member-editor-hint">Member syntax: optional <span class="tok-keyword">@decorator</span>, optional visibility, name, optional params, optional type. Example: <span class="code-line-root">+save(user: User): Promise&lt;void&gt;</span>. Invalid lines will be underlined in the preview.</div>';
      }

      function pushDebugEvent(kind, details) {
        if (!CANVAS_DEBUG) {
          return;
        }
        const event = {
          t: Date.now(),
          kind,
          details: details || null
        };
        debugState.events.push(event);
        if (debugState.events.length > 20) {
          debugState.events.shift();
        }
        try {
          console.debug('[diagram-canvas]', kind, details || {});
        } catch {
          // ignore console transport issues in constrained webviews
        }
        postCanvasHostEvent('canvasDebug', {
          kind,
          details: details || null,
          timestamp: event.t
        });
      }

      function renderDebugPanel() {
        if (!CANVAS_DEBUG || !debugPanel) {
          return;
        }
        debugPanel.textContent = [
          'DEBUG VIEWPORT',
          'zoom=' + zoom,
          'camera=(' + Math.round(cameraX) + ', ' + Math.round(cameraY) + ')',
          'pointer=' + formatDebugPoint(debugState.lastPointerViewport),
          'wheel=' + formatDebugPoint(debugState.lastWheel),
          'zoomAnchor=' + formatDebugPoint(debugState.zoomAnchor),
          'preZoomStage=' + formatDebugPoint(debugState.preZoomStagePoint),
          'targetZoomScroll=' + formatDebugPoint(debugState.targetZoomScroll),
          'postZoomScroll=' + formatDebugPoint(debugState.postZoomScroll),
          'scrollMetrics=' + formatDebugPoint(debugState.scrollMetrics),
          'minimap=' + formatDebugPoint(debugState.lastMinimap),
          '',
          'DEBUG EVENTS',
          ...debugState.events.slice(-8).map((entry) => formatDebugEvent(entry))
        ].join('\\n');
      }

      function formatDebugEvent(entry) {
        if (!entry) {
          return '∅';
        }
        const time = new Date(entry.t).toLocaleTimeString();
        return time + ' ' + entry.kind + ' ' + formatDebugPoint(entry.details);
      }

      function formatDebugPoint(point) {
        if (!point) {
          return '∅';
        }
        const entries = Object.entries(point).map(([key, value]) => key + '=' + Math.round(Number(value) * 100) / 100);
        return '{ ' + entries.join(', ') + ' }';
      }

      function renderMermaidSource() {
        const lines = (state.mermaid || '').split(/\\n/);
        mermaidSource.innerHTML = lines.map((line) => '<span class="code-line-root">' + highlightMermaidLine(line) + '</span>').join('');
      }

      function highlightMermaidLine(rawLine) {
        const escaped = escapeHtml(rawLine);
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return '&nbsp;';
        }
        if (trimmed.startsWith('%%')) {
          return '<span class="tok-comment">' + escaped + '</span>';
        }
        if (trimmed === 'classDiagram') {
          return escaped.replace('classDiagram', '<span class="tok-keyword">classDiagram</span>');
        }
        if (trimmed.startsWith('class ')) {
          const classMatch = rawLine.match(new RegExp('^(\\s*)class(\\s+)([A-Za-z_][\\w.]*)'));
          if (classMatch) {
            const indent = classMatch[1] || '';
            const gap = classMatch[2] || ' ';
            const name = classMatch[3] || '';
            const suffix = rawLine.slice(classMatch[0].length);
            return escapeHtml(indent)
              + '<span class="tok-keyword">class</span>'
              + escapeHtml(gap)
              + '<span class="tok-identifier">' + escapeHtml(name) + '</span>'
              + escapeHtml(suffix);
          }
        }
        if ('+-#~'.includes(trimmed.charAt(0)) || trimmed.includes('(')) {
          return '<span class="tok-member">' + escaped + '</span>';
        }
        const relationMatch = rawLine.match(new RegExp('^(\\s*)([A-Za-z_][\\w.]*)(\\s+)([<>|*ox.\\-]+)(\\s+)([A-Za-z_][\\w.]*)(?:\\s*:\\s*(.+))?$'));
        if (relationMatch) {
          const indent = relationMatch[1] || '';
          const from = relationMatch[2] || '';
          const gap1 = relationMatch[3] || ' ';
          const type = relationMatch[4] || '-->';
          const gap2 = relationMatch[5] || ' ';
          const to = relationMatch[6] || '';
          const label = relationMatch[7];
          return escapeHtml(indent)
            + '<span class="tok-identifier">' + escapeHtml(from) + '</span>'
            + escapeHtml(gap1)
            + '<span class="tok-relation">' + escapeHtml(type) + '</span>'
            + escapeHtml(gap2)
            + '<span class="tok-identifier">' + escapeHtml(to) + '</span>'
            + (label ? '<span class="tok-label"> : ' + escapeHtml(label) + '</span>' : '');
        }
        return escaped;
      }

      function renderMinimap() {
        minimapBody.innerHTML = '';
        const rect = minimapBody.getBoundingClientRect();
        const measuredWidth = Math.round(rect.width);
        const measuredHeight = Math.round(rect.height);
        if (!measuredWidth || !measuredHeight) {
          pushDebugEvent('minimap:defer', { width: measuredWidth, height: measuredHeight });
          requestAnimationFrame(() => requestAnimationFrame(() => renderMinimap()));
          return;
        }
        const width = measuredWidth || 220;
        const height = measuredHeight || 111;
        const scaleX = width / WORLD_WIDTH;
        const scaleY = height / WORLD_HEIGHT;

        state.model.classes.forEach((entry) => {
          const node = document.createElement('div');
          node.className = 'minimap-node' + (entry.id === selectedClassId ? ' selected' : '');
          node.style.left = Math.max(0, worldToStageX(entry.x) * scaleX) + 'px';
          node.style.top = Math.max(0, worldToStageY(entry.y) * scaleY) + 'px';
          node.style.width = Math.max(8, (entry.width || 220) * scaleX) + 'px';
          node.style.height = Math.max(6, (entry.height || 120) * scaleY) + 'px';
          minimapBody.appendChild(node);
        });

        const viewport = document.createElement('div');
        viewport.className = 'minimap-viewport';
        viewport.dataset.role = 'minimap-viewport';
        viewport.style.left = Math.max(0, cameraX * scaleX) + 'px';
        viewport.style.top = Math.max(0, cameraY * scaleY) + 'px';
        viewport.style.width = Math.max(12, (canvasShell.clientWidth / zoom) * scaleX) + 'px';
        viewport.style.height = Math.max(12, (canvasShell.clientHeight / zoom) * scaleY) + 'px';
        minimapBody.appendChild(viewport);
        pushDebugEvent('minimap:render', {
          width,
          height,
          classCount: state.model.classes.length,
          cameraX,
          cameraY,
          zoom,
          viewportWidth: canvasShell.clientWidth,
          viewportHeight: canvasShell.clientHeight
        });
      }

      function closeEdgeEditor() {
        selectedRelationId = undefined;
        edgeEditorRelationId = undefined;
        shouldFocusEdgeEditorLabel = false;
        render();
      }

      function renderEdgeEditor() {
        const relation = getSelectedRelation();
        if (!relation) {
          edgeEditor.hidden = true;
          edgeEditor.innerHTML = '';
          edgeEditorRelationId = undefined;
          return;
        }
        const from = state.model.classes.find((entry) => entry.id === relation.from);
        const to = state.model.classes.find((entry) => entry.id === relation.to);
        if (!from || !to) {
          edgeEditor.hidden = true;
          edgeEditor.innerHTML = '';
          edgeEditorRelationId = undefined;
          return;
        }
        const targetStageX = worldToStageX(to.x + (to.width || 220));
        const targetStageY = worldToStageY(to.y + Math.min((to.height || 120) - 24, 56));
        const targetViewport = stagePointToViewportPoint(targetStageX, targetStageY);
        const visualOffset = viewportPointToStageOffset(18, 12);
        edgeEditor.hidden = false;

        if (edgeEditorRelationId !== relation.id) {
          edgeEditor.innerHTML = '<div class="edge-editor-grid">'
            + '<strong>Relationship</strong>'
            + '<input id="edgeEditorLabel" type="text" placeholder="Label" />'
            + '<input id="edgeEditorType" type="text" placeholder="-->" />'
            + '<div class="small-actions">'
            + '<button id="edgeEditorReverse" class="ghost">Reverse</button>'
            + '<button id="edgeEditorDelete" class="secondary danger">Delete</button>'
            + '</div>'
            + '</div>';
          edgeEditorRelationId = relation.id;

          const labelInput = document.getElementById('edgeEditorLabel');
          const typeInput = document.getElementById('edgeEditorType');
          labelInput.value = relation.label || '';
          typeInput.value = relation.type || '-->';

          labelInput.addEventListener('input', (event) => {
            relation.label = event.target.value.trim() || undefined;
            renderEdges();
          });
          labelInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              emitStateChanged();
              closeEdgeEditor();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              closeEdgeEditor();
            }
          });
          labelInput.addEventListener('blur', () => {
            emitStateChanged();
          });
          typeInput.addEventListener('input', (event) => {
            relation.type = event.target.value || '-->';
            renderEdges();
          });
          typeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              emitStateChanged();
              closeEdgeEditor();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              closeEdgeEditor();
            }
          });
          typeInput.addEventListener('blur', () => {
            emitStateChanged();
          });
          document.getElementById('edgeEditorReverse').addEventListener('click', () => {
            const nextFrom = relation.to;
            relation.to = relation.from;
            relation.from = nextFrom;
            emitStateChanged();
          });
          document.getElementById('edgeEditorDelete').addEventListener('click', () => {
            deleteRelation(relation.id);
          });
        } else {
          const labelInput = document.getElementById('edgeEditorLabel');
          const typeInput = document.getElementById('edgeEditorType');
          if (document.activeElement !== labelInput) {
            labelInput.value = relation.label || '';
          }
          if (document.activeElement !== typeInput) {
            typeInput.value = relation.type || '-->';
          }
        }

        const editorWidth = edgeEditor.offsetWidth || 260;
        const editorHeight = edgeEditor.offsetHeight || 132;
        const viewportPadding = 16;
        const preferRightStageX = targetStageX + visualOffset.x;
        const preferLeftStageX = targetStageX - (editorWidth / zoom) - visualOffset.x;
        const preferBelowStageY = targetStageY + visualOffset.y;
        const preferAboveStageY = targetStageY - (editorHeight / zoom) - visualOffset.y;
        const desiredStageX = targetViewport.x + 18 + editorWidth + viewportPadding <= canvasShell.clientWidth
          ? preferRightStageX
          : preferLeftStageX;
        const desiredStageY = targetViewport.y + 12 + editorHeight + viewportPadding <= canvasShell.clientHeight
          ? preferBelowStageY
          : preferAboveStageY;
        const minStageX = cameraX + (viewportPadding / zoom);
        const maxStageX = cameraX + ((canvasShell.clientWidth - editorWidth - viewportPadding) / zoom);
        const minStageY = cameraY + (viewportPadding / zoom);
        const maxStageY = cameraY + ((canvasShell.clientHeight - editorHeight - viewportPadding) / zoom);
        edgeEditor.style.left = Math.max(minStageX, Math.min(maxStageX, desiredStageX)) + 'px';
        edgeEditor.style.top = Math.max(minStageY, Math.min(maxStageY, desiredStageY)) + 'px';

        if (shouldFocusEdgeEditorLabel) {
          const labelInput = document.getElementById('edgeEditorLabel');
          queueMicrotask(() => {
            labelInput?.focus();
            labelInput?.select();
          });
          shouldFocusEdgeEditorLabel = false;
        }
      }

      function renderInspector() {
        const selectedClass = getSelectedClass();
        const selectedRelation = getSelectedRelation();

        if (selectedRelation) {
          const from = state.model.classes.find((entry) => entry.id === selectedRelation.from);
          const to = state.model.classes.find((entry) => entry.id === selectedRelation.to);
          inspectorTitle.textContent = 'Selected relationship';
          inspectorBody.innerHTML = '<label>'
            + 'From'
            + '<select id="relationFromSelect"></select>'
            + '</label>'
            + '<label>'
            + 'Relationship type'
            + '<input id="relationTypeInput" type="text" placeholder="-->" />'
            + '</label>'
            + '<label>'
            + 'To'
            + '<select id="relationToSelect"></select>'
            + '</label>'
            + '<label>'
            + 'Label'
            + '<input id="relationLabelInput" type="text" placeholder="uses" />'
            + '</label>'
            + '<div class="small-actions">'
            + '<button id="deleteRelationButton" class="secondary danger">Delete relationship</button>'
            + '<button id="focusFromButton" class="ghost">Focus source class</button>'
            + '<button id="focusToButton" class="ghost">Focus target class</button>'
            + '</div>';

          const fromSelect = document.getElementById('relationFromSelect');
          const toSelect = document.getElementById('relationToSelect');
          populateClassOptions(fromSelect, selectedRelation.from);
          populateClassOptions(toSelect, selectedRelation.to);
          document.getElementById('relationTypeInput').value = selectedRelation.type || '-->';
          document.getElementById('relationLabelInput').value = selectedRelation.label || '';

          fromSelect.addEventListener('change', () => {
            selectedRelation.from = fromSelect.value;
            emitStateChanged();
          });
          toSelect.addEventListener('change', () => {
            selectedRelation.to = toSelect.value;
            emitStateChanged();
          });
          document.getElementById('relationTypeInput').addEventListener('input', (event) => {
            selectedRelation.type = event.target.value || '-->';
            emitStateChanged();
          });
          document.getElementById('relationLabelInput').addEventListener('input', (event) => {
            selectedRelation.label = event.target.value.trim() || undefined;
            emitStateChanged();
          });
          document.getElementById('deleteRelationButton').addEventListener('click', () => {
            deleteRelation(selectedRelation.id);
          });
          document.getElementById('focusFromButton').addEventListener('click', () => {
            selectedClassId = from ? from.id : undefined;
            selectedRelationId = undefined;
            connectFromClassId = undefined;
            render();
          });
          document.getElementById('focusToButton').addEventListener('click', () => {
            selectedClassId = to ? to.id : undefined;
            selectedRelationId = undefined;
            connectFromClassId = undefined;
            render();
          });
          return;
        }

        if (selectedClass) {
          inspectorTitle.textContent = 'Selected class';
          inspectorBody.innerHTML = '<label>'
            + 'Class name'
            + '<input id="classNameInput" type="text" placeholder="ExampleClass" />'
            + '</label>'
            + '<label>'
            + 'Members (one per line)'
            + '<textarea id="classMembersInput" placeholder="+id: string\\n+render(): void"></textarea>'
            + '</label>'
            + renderMemberSnippetBar('classMembersInput')
            + '<div id="classMembersPreview" class="members-editor-preview"></div>'
            + '<div class="small-actions">'
            + '<button id="renameClassButton" class="ghost">Rename</button>'
            + '<button id="addMemberButton" class="ghost">Add member</button>'
            + '<button id="startConnectButton" class="ghost">Connect from here</button>'
            + '<button id="deleteClassButton" class="secondary danger">Delete class</button>'
            + '</div>';
          document.getElementById('classNameInput').value = selectedClass.name;
          document.getElementById('classMembersInput').value = selectedClass.members.join('\\n');
          document.getElementById('classMembersPreview').innerHTML = renderMemberPreviewHtml(selectedClass.members.join('\\n'));
          document.getElementById('classNameInput').addEventListener('input', (event) => {
            selectedClass.name = event.target.value || 'UnnamedClass';
            emitStateChanged();
          });
          document.getElementById('classMembersInput').addEventListener('input', (event) => {
            document.getElementById('classMembersPreview').innerHTML = renderMemberPreviewHtml(event.target.value);
            selectedClass.members = event.target.value.split(/\\r?\\n/).map((entry) => entry.trim()).filter(Boolean);
            emitStateChanged();
          });
          inspectorBody.querySelector('[data-role="member-snippet-bar"]')?.addEventListener('click', (event) => {
            const button = event.target instanceof HTMLElement ? event.target.closest('[data-snippet-value]') : null;
            const membersInput = document.getElementById('classMembersInput');
            if (!button || !(membersInput instanceof HTMLTextAreaElement)) {
              return;
            }
            appendSnippetToMembersInput(membersInput, button.getAttribute('data-snippet-value') || '');
          });
          document.getElementById('renameClassButton').addEventListener('click', () => renameClass(selectedClass.id));
          document.getElementById('addMemberButton').addEventListener('click', () => addMemberToClass(selectedClass.id));
          document.getElementById('startConnectButton').addEventListener('click', () => {
            startConnectFrom(selectedClass.id);
          });
          document.getElementById('deleteClassButton').addEventListener('click', () => deleteClass(selectedClass.id));
          return;
        }

        inspectorTitle.textContent = 'Inspector';
        inspectorBody.innerHTML = '<div class="inspector-empty">Select a class or a relationship on the canvas. Double-click empty space to add a class.</div>';
      }

      function renderRelations() {
        relationList.innerHTML = '';
        if (!state.model.relations.length) {
          relationList.innerHTML = '<div class="inspector-empty">No relationships yet. Select a class, then use Connect Selected or the Connect button on the node.</div>';
          return;
        }

        state.model.relations.forEach((relation) => {
          const from = state.model.classes.find((entry) => entry.id === relation.from);
          const to = state.model.classes.find((entry) => entry.id === relation.to);
          const row = document.createElement('div');
          row.className = 'relation-row' + (relation.id === selectedRelationId ? ' selected' : '');
          row.innerHTML = '<div class="relation-summary">'
            + escapeHtml((from ? from.name : '?') + ' ' + (relation.type || '-->') + ' ' + (to ? to.name : '?') + (relation.label ? ' : ' + relation.label : ''))
            + '</div>'
            + '<div class="small-actions">'
            + '<button class="ghost" data-action="select">Edit</button>'
            + '<button class="ghost" data-action="label">Rename label</button>'
            + '<button class="secondary danger" data-action="delete">Delete</button>'
            + '</div>';
          row.addEventListener('click', () => selectRelation(relation.id));
          row.querySelector('.small-actions').addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target instanceof HTMLElement ? event.target.getAttribute('data-action') : undefined;
            if (action === 'select') {
              selectRelation(relation.id);
            } else if (action === 'label') {
              selectRelation(relation.id);
              shouldFocusEdgeEditorLabel = true;
              render();
            } else if (action === 'delete') {
              deleteRelation(relation.id);
            }
          });
          relationList.appendChild(row);
        });
      }

      function renderContextMenu() {
        if (!canvasContextMenu) {
          contextMenu.hidden = true;
          contextMenu.innerHTML = '';
          return;
        }

        const hasSelectedClass = Boolean(getSelectedClass());
        const hasSelectedRelation = Boolean(getSelectedRelation());
        const title = hasSelectedClass
          ? 'Class actions'
          : hasSelectedRelation
            ? 'Relationship actions'
            : 'Canvas actions';

        const items = hasSelectedClass
          ? [
              ['rename', 'Rename'],
              ['member', 'Edit members'],
              ['duplicate', 'Duplicate'],
              ['connect', 'Connect'],
              ['delete', contextDeleteArmed ? 'Confirm delete' : 'Delete']
            ]
          : hasSelectedRelation
            ? [
                ['label', 'Rename label'],
                ['delete', contextDeleteArmed ? 'Confirm delete' : 'Delete']
              ]
            : [
                ['add-empty', 'Add blank class'],
                ['add-template', 'Add selected template'],
                ['duplicate', 'Duplicate selected'],
                ['connect-selected', 'Add connected class']
              ];

        contextMenu.hidden = false;
        contextMenu.innerHTML = '<div class="context-menu-title muted">' + escapeHtml(title) + '</div>'
          + items.map(([action, label]) => '<button type="button" data-context-action="' + escapeHtml(action) + '" class="' + (action === 'delete' ? 'danger' : '') + '">' + escapeHtml(label) + '</button>').join('');
        contextMenu.style.left = canvasContextMenu.x + 'px';
        contextMenu.style.top = canvasContextMenu.y + 'px';
      }

`;
}


export function createCanvasEventBindingsSource(): string {
  return `
      classTemplateSelect.addEventListener('change', () => {
        selectedTemplateId = classTemplateSelect.value || 'empty';
        renderTemplatePreview();
      });

      bindCanvasFamilySwitcher(runtimeFamily);

      addClassButton.addEventListener('click', () => {
        addClassAt(160 + state.model.classes.length * 28, 120 + state.model.classes.length * 18, selectedTemplateId);
      });
      addTemplateFromSidebarButton.addEventListener('click', () => {
        const centerStageX = cameraX + (canvasShell.clientWidth / zoom / 2);
        const centerStageY = cameraY + (canvasShell.clientHeight / zoom / 2);
        addClassAt(stageToWorldX(centerStageX) - 110, stageToWorldY(centerStageY) - 50, selectedTemplateId);
      });

      canvasShell.addEventListener('dblclick', (event) => {
        if (!isBareCanvasTarget(event.target instanceof Element ? event.target : null)) {
          return;
        }
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(event.clientX - rect.left, event.clientY - rect.top);
        const x = stageToWorldX(stagePoint.x) - 110;
        const y = stageToWorldY(stagePoint.y) - 50;
        addClassAt(x, y, selectedTemplateId);
      });

      canvasShell.addEventListener('pointerdown', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!isBareCanvasTarget(target) || event.button !== 0) {
          bareCanvasPointerDown = null;
          return;
        }
        bareCanvasPointerDown = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY
        };
      });

      canvasShell.addEventListener('mousemove', (event) => {
        lastCanvasPointerClientPoint = { x: event.clientX, y: event.clientY };
        debugState.lastPointerViewport = {
          x: event.clientX - canvasShell.getBoundingClientRect().left,
          y: event.clientY - canvasShell.getBoundingClientRect().top
        };
        renderDebugPanel();
        updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
      });

      canvasShell.addEventListener('mousedown', (event) => {
        const wantsPan = event.button === 1 || (keyboardPanMode && event.button === 0 && !event.target.closest('.class-node'));
        if (!wantsPan) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        closeCanvasContextMenu();
        panState = {
          startClientX: event.clientX,
          startClientY: event.clientY,
          startCameraX: cameraX,
          startCameraY: cameraY
        };
        applyZoom();
      });

      canvasShell.addEventListener('wheel', (event) => {
        if (!(event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        const anchorX = event.clientX - canvasShell.getBoundingClientRect().left;
        const anchorY = event.clientY - canvasShell.getBoundingClientRect().top;
        debugState.lastWheel = { anchorX, anchorY, deltaY: event.deltaY };
        renderDebugPanel();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        setZoomAroundViewportPoint(zoom + delta, anchorX, anchorY);
      }, { passive: false });

      window.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && !keyboardPanMode && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
          event.preventDefault();
          keyboardPanMode = true;
          canvasShell.classList.add('panning');
        }
        if (event.key === 'Escape' && canvasContextMenu) {
          event.preventDefault();
          closeCanvasContextMenu();
          return;
        }
        if (event.key === 'Escape' && connectFromClassId) {
          event.preventDefault();
          cancelConnectMode();
        }
      });

      window.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
          keyboardPanMode = false;
          applyZoom();
        }
      });

      window.addEventListener('pointermove', (event) => {
        if (minimapDragState) {
          const rect = minimapBody.getBoundingClientRect();
          const left = Math.max(0, Math.min(rect.width - minimapDragState.viewportWidth, event.clientX - rect.left - minimapDragState.pointerOffsetX));
          const top = Math.max(0, Math.min(rect.height - minimapDragState.viewportHeight, event.clientY - rect.top - minimapDragState.pointerOffsetY));
          centerViewportOnMinimapPoint(left + minimapDragState.viewportWidth / 2, top + minimapDragState.viewportHeight / 2);
        }
        if (panState) {
          cameraX = panState.startCameraX - ((event.clientX - panState.startClientX) / zoom);
          cameraY = panState.startCameraY - ((event.clientY - panState.startClientY) / zoom);
          applyZoom();
          renderMinimap();
          renderContextMenu();
          renderEdgeEditor();
          renderDebugPanel();
        }
        if (connectFromClassId) {
          updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
        }
      });

      window.addEventListener('pointerup', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const shouldDefocusBareCanvas = shouldDefocusBareCanvasPointerUp(event, target);

        if (minimapDragState) {
          minimapDragState = null;
        }
        if (panState) {
          panState = null;
          applyZoom();
        }
        if (connectDragActive) {
          const classTarget = target ? target.closest('.class-node') : null;
          connectDragActive = false;
          if (!classTarget) {
            cancelConnectMode();
          }
          bareCanvasPointerDown = null;
          return;
        }
        if (shouldDefocusBareCanvas) {
          clearCanvasFocus();
        }
        bareCanvasPointerDown = null;
      });

      canvasShell.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const classNode = event.target.closest('.class-node');
        const relationTarget = event.target.closest('[data-relation-id]');
        if (classNode) {
          selectedClassId = classNode.dataset.classId;
          selectedRelationId = undefined;
        } else if (relationTarget) {
          selectedRelationId = relationTarget.dataset.relationId;
          selectedClassId = undefined;
        }
        openCanvasContextMenuFromPointerEvent(event, { x: 110, y: 50 });
      });

      zoomOutButton.addEventListener('click', () => {
        setZoomAroundClientPoint(zoom - 0.1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2));
      });
      zoomResetButton.addEventListener('click', () => {
        setZoomAroundClientPoint(1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2));
      });
      zoomActualButton.addEventListener('click', () => {
        fitActualSize();
      });
      zoomInButton.addEventListener('click', () => {
        setZoomAroundClientPoint(zoom + 0.1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2));
      });
      fitSelectionButton.addEventListener('click', () => {
        const bounds = getSelectionBounds();
        if (bounds) {
          fitBounds(bounds);
        }
      });
      fitDiagramButton.addEventListener('click', () => {
        fitBounds(getDiagramBounds());
      });

      bindCanvasHostActionButtons();

      edgeEditor.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      window.addEventListener('pointerdown', (event) => {
        dismissCanvasContextMenuOnPointerDown(event);
        if (selectedRelationId && !event.target.closest('#edgeEditor') && !event.target.closest('[data-relation-id]')) {
          closeEdgeEditor();
        }
      });

      function centerViewportOnMinimapPoint(relativeX, relativeY) {
        const rect = minimapBody.getBoundingClientRect();
        const stageX = (relativeX / Math.max(1, rect.width)) * WORLD_WIDTH;
        const stageY = (relativeY / Math.max(1, rect.height)) * WORLD_HEIGHT;
        debugState.lastMinimap = { relativeX, relativeY, stageX, stageY };
        scrollToKeepStagePointAtViewportAnchor(stageX, stageY, canvasShell.clientWidth / 2, canvasShell.clientHeight / 2);
        requestAnimationFrame(() => {
          scrollToKeepStagePointAtViewportAnchor(stageX, stageY, canvasShell.clientWidth / 2, canvasShell.clientHeight / 2);
          renderDebugPanel();
          renderMinimap();
          renderContextMenu();
          renderEdgeEditor();
        });
      }

      minimap.addEventListener('pointerdown', (event) => {
        const viewport = event.target instanceof Element ? event.target.closest('[data-role="minimap-viewport"]') : null;
        const rect = minimapBody.getBoundingClientRect();
        if (viewport) {
          event.preventDefault();
          const viewportRect = viewport.getBoundingClientRect();
          minimapDragState = {
            pointerOffsetX: event.clientX - viewportRect.left,
            pointerOffsetY: event.clientY - viewportRect.top,
            viewportWidth: viewportRect.width,
            viewportHeight: viewportRect.height
          };
          return;
        }
        centerViewportOnMinimapPoint(event.clientX - rect.left, event.clientY - rect.top);
      });

      contextMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = event.target instanceof HTMLElement ? event.target.getAttribute('data-context-action') : undefined;
        if (!action || !canvasContextMenu) {
          return;
        }
        if (action === 'add-class' || action === 'add-empty') {
          contextDeleteArmed = false;
          addClassAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY, 'empty');
        } else if (action === 'add-template-class' || action === 'add-template') {
          contextDeleteArmed = false;
          addClassAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY, selectedTemplateId);
        } else if (action === 'duplicate-class' || action === 'duplicate') {
          contextDeleteArmed = false;
          duplicateSelectedClassAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
        } else if (action === 'connect-here' || action === 'connect-selected') {
          contextDeleteArmed = false;
          addConnectedClassAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
        } else if (action === 'rename') {
          contextDeleteArmed = false;
          if (selectedClassId) {
            renameClass(selectedClassId);
          }
          closeCanvasContextMenu();
        } else if (action === 'member') {
          contextDeleteArmed = false;
          if (selectedClassId) {
            addMemberToClass(selectedClassId);
          }
          closeCanvasContextMenu();
        } else if (action === 'connect') {
          contextDeleteArmed = false;
          if (selectedClassId) {
            startConnectFrom(selectedClassId);
          }
          closeCanvasContextMenu();
        } else if (action === 'label') {
          contextDeleteArmed = false;
          if (selectedRelationId) {
            selectRelation(selectedRelationId);
            shouldFocusEdgeEditorLabel = true;
            render();
          }
          closeCanvasContextMenu();
        } else if (action === 'delete-selected' || action === 'delete') {
          if (!contextDeleteArmed) {
            contextDeleteArmed = true;
            renderContextMenu();
            return;
          }
          if (selectedRelationId) {
            deleteRelation(selectedRelationId);
          } else if (selectedClassId) {
            deleteClass(selectedClassId);
          }
        } else if (action === 'cancel-connect') {
          contextDeleteArmed = false;
          cancelConnectMode();
          closeCanvasContextMenu();
        }
      });

      window.addEventListener('resize', () => {
        renderMinimap();
        if (!viewportInitialized) {
          initializeViewportIfNeeded();
        }
      });

      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'setState') {
          pushDebugEvent('message:setState', {
            classCount: Array.isArray(message.model?.classes) ? message.model.classes.length : -1,
            relationCount: Array.isArray(message.model?.relations) ? message.model.relations.length : -1,
            sourceLabel: message.sourceLabel || ''
          });
          state = mergeCanvasShellState(message, {
            family: 'classDiagram',
            familyLabel: 'Class Diagram'
          });
          render();
          if (!hasReceivedInitialState) {
            hasReceivedInitialState = true;
            viewportInitialized = false;
            pushDebugEvent('startup:first-state', { classCount: state.model.classes.length, relationCount: state.model.relations.length });
            requestAnimationFrame(() => requestAnimationFrame(() => {
              initializeViewportIfNeeded();
              renderMinimap();
            }));
          } else {
            initializeViewportIfNeeded();
            renderMinimap();
          }
        }
      });


`;
}
