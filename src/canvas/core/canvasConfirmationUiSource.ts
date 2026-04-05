export function createCanvasConfirmationUiSource(): string {
  return `
      let pendingCanvasConfirmationResolve = null;

      function bindCanvasConfirmationUi() {
        canvasConfirmCancelButton?.addEventListener('click', () => resolveCanvasConfirmation(false));
        canvasConfirmAcceptButton?.addEventListener('click', () => resolveCanvasConfirmation(true));
      }

      function resolveCanvasConfirmation(accepted) {
        canvasConfirmOverlay.hidden = true;
        const resolve = pendingCanvasConfirmationResolve;
        pendingCanvasConfirmationResolve = null;
        if (typeof resolve === 'function') {
          resolve(Boolean(accepted));
        }
      }

      function requestCanvasConfirmation(options) {
        return new Promise((resolve) => {
          pendingCanvasConfirmationResolve = resolve;
          canvasConfirmTitle.textContent = options?.title || 'Confirm action';
          canvasConfirmBody.textContent = options?.message || 'Are you sure?';
          canvasConfirmAcceptButton.textContent = options?.acceptLabel || 'Continue';
          canvasConfirmCancelButton.textContent = options?.cancelLabel || 'Cancel';
          canvasConfirmOverlay.hidden = false;
        });
      }
`;
}
