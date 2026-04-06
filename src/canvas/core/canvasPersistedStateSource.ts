export function createCanvasPersistedStateSource(): string {
  return `
      function restoreCanvasPersistedState(runtimeFamily) {
        const persisted = vscode.getState();
        if (!persisted || !persisted.state) {
          return false;
        }
        if (persisted.state.family && persisted.state.family !== runtimeFamily.family) {
          return false;
        }
        if (typeof runtimeFamily.isCompatiblePersistedState === 'function' && !runtimeFamily.isCompatiblePersistedState(persisted.state)) {
          return false;
        }
        state = persisted.state;
        zoom = persisted.zoom || 1;
        if (typeof runtimeFamily.restoreSelection === 'function') {
          runtimeFamily.restoreSelection(persisted);
        }
        if (typeof runtimeFamily.restoreExtras === 'function') {
          runtimeFamily.restoreExtras(persisted);
        }
        render();
        return true;
      }
`;
}
