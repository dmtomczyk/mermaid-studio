export function createCanvasPersistedStateSource(): string {
  return `
      function restoreCanvasPersistedState(config) {
        const persisted = vscode.getState();
        if (!persisted || !persisted.state) {
          return false;
        }
        state = persisted.state;
        zoom = persisted.zoom || 1;
        if (typeof config.restoreSelection === 'function') {
          config.restoreSelection(persisted);
        }
        if (typeof config.restoreExtras === 'function') {
          config.restoreExtras(persisted);
        }
        render();
        return true;
      }
`;
}
