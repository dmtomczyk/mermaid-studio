export function createCanvasViewportCoreSource(): string {
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
        const minCameraX = -WORLD_ORIGIN_X;
        const minCameraY = -WORLD_ORIGIN_Y;
        const maxCameraX = WORLD_WIDTH - canvasShell.clientWidth / zoom;
        const maxCameraY = WORLD_HEIGHT - canvasShell.clientHeight / zoom;
        cameraX = Math.max(minCameraX, Math.min(maxCameraX, cameraX));
        cameraY = Math.max(minCameraY, Math.min(maxCameraY, cameraY));
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

      function fitViewportToBounds(bounds) {
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

      function fitViewportWidthToBounds(bounds) {
        const viewportWidth = Math.max(200, canvasShell.clientWidth - 24);
        zoom = clampZoom(viewportWidth / Math.max(240, bounds.width));
        render();
        animateViewportTo(worldToStageX(bounds.x) * zoom - 12, worldToStageY(bounds.y) * zoom - 24);
        renderEdges();
        renderContextMenu();
        renderEdgeEditor();
        renderMinimap();
      }

      function fitViewportActualSize(bounds) {
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
`;
}
