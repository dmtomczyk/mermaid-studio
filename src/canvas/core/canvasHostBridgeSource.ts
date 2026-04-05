export function createCanvasHostBridgeSource(): string {
  return `
      function bindCanvasHostActionButtons() {
        applyButton.addEventListener('click', () => vscode.postMessage({ type: 'applyToDocument', model: state.model }));
        copyButton.addEventListener('click', () => vscode.postMessage({ type: 'copyMermaid', model: state.model }));
        createFileButton.addEventListener('click', () => vscode.postMessage({ type: 'createFile', model: state.model }));
        openLinkedFileButton.addEventListener('click', () => vscode.postMessage({ type: 'openLinkedFile' }));
        previewButton.addEventListener('click', () => vscode.postMessage({ type: 'openPreview', model: state.model }));
        reimportButton.addEventListener('click', () => vscode.postMessage({ type: 'reimportFromDocument' }));
      }

      function requestInitialCanvasState() {
        vscode.postMessage({ type: 'requestState' });
      }
`;
}
