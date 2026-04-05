export function createCanvasContextMenuCoreSource(): string {
  return `
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

      function openCanvasContextMenuFromPointerEvent(event, offsets) {
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(event.clientX - rect.left, event.clientY - rect.top);
        const stageX = stagePoint.x;
        const stageY = stagePoint.y;
        const rawCanvasX = stageToWorldX(stageX);
        const rawCanvasY = stageToWorldY(stageY);
        const actionCanvasX = rawCanvasX - offsets.x;
        const actionCanvasY = rawCanvasY - offsets.y;
        openCanvasContextMenu(stageX, stageY, actionCanvasX, actionCanvasY);
      }

      function dismissCanvasContextMenuOnPointerDown(event) {
        if (canvasContextMenu && !event.target.closest('#contextMenu')) {
          closeCanvasContextMenu();
        }
      }
`;
}
