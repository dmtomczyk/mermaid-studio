export function createCanvasGeometryHelpersSource(): string {
  return `
      function worldToStageX(x) {
        return x + WORLD_ORIGIN_X;
      }

      function worldToStageY(y) {
        return y + WORLD_ORIGIN_Y;
      }

      function stageToWorldX(x) {
        return x - WORLD_ORIGIN_X;
      }

      function stageToWorldY(y) {
        return y - WORLD_ORIGIN_Y;
      }

      function viewportPointToStagePoint(anchorX, anchorY) {
        return {
          x: cameraX + (anchorX / zoom),
          y: cameraY + (anchorY / zoom)
        };
      }

      function stagePointToViewportPoint(stageX, stageY) {
        return {
          x: (stageX - cameraX) * zoom,
          y: (stageY - cameraY) * zoom
        };
      }

      function viewportPointToStageOffset(deltaX, deltaY) {
        return {
          x: deltaX / zoom,
          y: deltaY / zoom
        };
      }

      function clampCamera() {
        const maxCameraX = Math.max(0, WORLD_WIDTH - canvasShell.clientWidth / zoom);
        const maxCameraY = Math.max(0, WORLD_HEIGHT - canvasShell.clientHeight / zoom);
        cameraX = Math.max(0, Math.min(maxCameraX, cameraX));
        cameraY = Math.max(0, Math.min(maxCameraY, cameraY));
      }

      function scrollToKeepStagePointAtViewportAnchor(stageX, stageY, anchorX, anchorY) {
        cameraX = stageX - (anchorX / zoom);
        cameraY = stageY - (anchorY / zoom);
        clampCamera();
        applyZoom();
      }

      function applyZoom() {
        clampCamera();
        canvasStage.style.zoom = '';
        canvasStage.style.transformOrigin = '0 0';
        canvasStage.style.transform = 'translate(' + (-cameraX * zoom) + 'px, ' + (-cameraY * zoom) + 'px) scale(' + zoom + ')';
        zoomResetButton.textContent = Math.round(zoom * 100) + '%';
        canvasShell.classList.toggle('panning', Boolean(panState));
      }

      function animateViewportTo(targetLeft, targetTop) {
        cameraX = Math.max(0, targetLeft / zoom);
        cameraY = Math.max(0, targetTop / zoom);
        applyZoom();
      }

      function clampZoom(value) {
        return Math.max(0.5, Math.min(1.8, Math.round(value * 10) / 10));
      }

      function setZoomAroundViewportPoint(nextZoom, anchorX, anchorY) {
        const oldZoom = zoom;
        const clamped = clampZoom(nextZoom);
        if (clamped === oldZoom) {
          return;
        }
        const stageX = cameraX + (anchorX / oldZoom);
        const stageY = cameraY + (anchorY / oldZoom);
        debugState.zoomAnchor = { anchorX, anchorY, oldZoom, nextZoom: clamped };
        debugState.preZoomStagePoint = { stageX, stageY };
        zoom = clamped;
        applyZoom();
        requestAnimationFrame(() => {
          const targetLeft = Math.max(0, stageX * zoom - anchorX);
          const targetTop = Math.max(0, stageY * zoom - anchorY);
          debugState.targetZoomScroll = { left: targetLeft, top: targetTop, cameraX: stageX - (anchorX / zoom), cameraY: stageY - (anchorY / zoom) };
          scrollToKeepStagePointAtViewportAnchor(stageX, stageY, anchorX, anchorY);
          requestAnimationFrame(() => {
            scrollToKeepStagePointAtViewportAnchor(stageX, stageY, anchorX, anchorY);
            debugState.postZoomScroll = { cameraX, cameraY, zoom };
            debugState.scrollMetrics = {
              worldWidth: WORLD_WIDTH,
              worldHeight: WORLD_HEIGHT,
              clientWidth: canvasShell.clientWidth,
              clientHeight: canvasShell.clientHeight
            };
            zoomResetButton.textContent = Math.round(zoom * 100) + '%';
            renderDebugPanel();
            renderEdges();
            renderContextMenu();
            renderEdgeEditor();
            renderMinimap();
          });
        });
      }

      function setZoomAroundClientPoint(nextZoom, clientX, clientY) {
        const rect = canvasShell.getBoundingClientRect();
        setZoomAroundViewportPoint(nextZoom, clientX - rect.left, clientY - rect.top);
      }

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
        if (!bounds) {
          return;
        }
        const viewportWidth = Math.max(200, canvasShell.clientWidth - 24);
        const viewportHeight = Math.max(160, canvasShell.clientHeight - 24);
        const scaleX = viewportWidth / bounds.width;
        const scaleY = viewportHeight / bounds.height;
        zoom = clampZoom(Math.min(scaleX, scaleY));
        render();
        animateViewportTo(
          worldToStageX(bounds.x) * zoom - (canvasShell.clientWidth - bounds.width * zoom) / 2,
          worldToStageY(bounds.y) * zoom - (canvasShell.clientHeight - bounds.height * zoom) / 2
        );
        renderEdges();
        renderContextMenu();
        renderEdgeEditor();
        renderMinimap();
      }

      function fitWidth() {
        const bounds = getSelectionBounds() || getDiagramBounds();
        const viewportWidth = Math.max(200, canvasShell.clientWidth - 24);
        zoom = clampZoom(viewportWidth / Math.max(240, bounds.width));
        render();
        animateViewportTo(worldToStageX(bounds.x) * zoom - 12, worldToStageY(bounds.y) * zoom - 24);
        renderEdges();
        renderContextMenu();
        renderEdgeEditor();
        renderMinimap();
      }

      function fitActualSize() {
        const bounds = getSelectionBounds() || getDiagramBounds();
        zoom = 1;
        render();
        animateViewportTo(
          worldToStageX(bounds.x) * zoom - (canvasShell.clientWidth - bounds.width * zoom) / 2,
          worldToStageY(bounds.y) * zoom - (canvasShell.clientHeight - bounds.height * zoom) / 2
        );
        renderEdges();
        renderContextMenu();
        renderEdgeEditor();
        renderMinimap();
      }

      function updateConnectPreviewFromClientPoint(clientX, clientY) {
        if (!connectFromClassId) {
          return;
        }
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(clientX - rect.left, clientY - rect.top);
        connectPreviewPoint = {
          x: stageToWorldX(stagePoint.x),
          y: stageToWorldY(stagePoint.y)
        };
        renderEdges();
      }
`;
}

export function createCanvasActionsSource(): string {
  return `
      function nextId(prefix) {
        return prefix + '-' + Math.random().toString(36).slice(2, 10);
      }

      function ensureSelection() {
        if (!state.model.classes.length) {
          selectedClassId = undefined;
          connectFromClassId = undefined;
        }
        if (selectedClassId && !state.model.classes.some((entry) => entry.id === selectedClassId)) {
          selectedClassId = undefined;
        }
        if (selectedRelationId && !state.model.relations.some((entry) => entry.id === selectedRelationId)) {
          selectedRelationId = undefined;
        }
        if (connectFromClassId && !state.model.classes.some((entry) => entry.id === connectFromClassId)) {
          connectFromClassId = undefined;
        }
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

      function clearCanvasFocus() {
        selectedClassId = undefined;
        selectedRelationId = undefined;
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        editingTitleClassId = undefined;
        editingMembersClassId = undefined;
        edgeEditorRelationId = undefined;
        canvasContextMenu = null;
        render();
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
        render();
      }

      function cancelConnectMode() {
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
        render();
      }

      function openCanvasContextMenu(menuStageX, menuStageY, actionCanvasX, actionCanvasY) {
        contextDeleteArmed = false;
        canvasContextMenu = { x: menuStageX, y: menuStageY, canvasX: actionCanvasX, canvasY: actionCanvasY };
        render();
      }

      function closeCanvasContextMenu() {
        if (!canvasContextMenu) {
          return;
        }
        contextDeleteArmed = false;
        canvasContextMenu = null;
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
          connectFromClassId = undefined;
          connectPreviewPoint = null;
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
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
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
      function render() {
        sourceLabel.textContent = state.sourceLabel || 'classDiagram canvas';
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
        renderMermaid();
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
