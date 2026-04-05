export function createCanvasSelectionCoreSource(): string {
  return `
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

      function clearCanvasFocus() {
        selectedClassId = undefined;
        selectedRelationId = undefined;
        editingTitleClassId = undefined;
        editingMembersClassId = undefined;
        edgeEditorRelationId = undefined;
        canvasContextMenu = null;
        render();
      }

      function shouldDefocusBareCanvasPointerUp(event, target) {
        const bareCanvasRelease = isBareCanvasTarget(target);
        const releaseDistance = bareCanvasPointerDown
          ? Math.hypot(event.clientX - bareCanvasPointerDown.clientX, event.clientY - bareCanvasPointerDown.clientY)
          : Infinity;
        return !!bareCanvasPointerDown
          && bareCanvasPointerDown.pointerId === event.pointerId
          && bareCanvasRelease
          && releaseDistance < 6
          && !panState
          && !dragState
          && !connectDragActive;
      }
`;
}
