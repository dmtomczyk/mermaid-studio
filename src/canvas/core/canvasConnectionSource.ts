export function createCanvasConnectionCoreSource(): string {
  return `
      function clearConnectionPreview() {
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
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

      function cancelConnectMode() {
        clearConnectionPreview();
        render();
      }

      function completeConnectionGesture(targetClassId) {
        if (!connectFromClassId || !targetClassId || connectFromClassId === targetClassId) {
          clearConnectionPreview();
          render();
          return false;
        }
        createRelation(connectFromClassId, targetClassId);
        return true;
      }
`;
}
