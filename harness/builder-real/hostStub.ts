import { BUILDER_HARNESS_STATES } from '../builder/states';

declare global {
  interface Window {
    acquireVsCodeApi: () => { getState(): unknown; setState(state: unknown): void; postMessage(message: unknown): void };
    __BUILDER_REAL_HARNESS_READY__?: boolean;
    __BUILDER_REAL_HARNESS_STATE__?: { stateId: string; viewportId: string; width: number; height: number };
    __BUILDER_REAL_VSCODE_STATE__?: unknown;
  }
}

interface HarnessViewport {
  id: string;
  width: number;
  height: number;
}

export function installBuilderHarnessHostStub(options: {
  stateId: string;
  viewport: HarnessViewport;
  onStatus?(message: string): void;
}): void {
  const { stateId, viewport, onStatus } = options;
  const fixture = BUILDER_HARNESS_STATES.find((item) => item.id === stateId) || BUILDER_HARNESS_STATES[0];
  const vscodeState = { state: fixture.state };

  const postHostMessage = (payload: unknown) => {
    window.dispatchEvent(new MessageEvent('message', { data: payload }));
  };

  window.acquireVsCodeApi = () => ({
    getState() {
      return window.__BUILDER_REAL_VSCODE_STATE__ || vscodeState;
    },
    setState(state: unknown) {
      window.__BUILDER_REAL_VSCODE_STATE__ = state;
    },
    postMessage(message: unknown) {
      const typed = (message || {}) as { type?: string; mermaid?: string; message?: string };
      switch (typed.type) {
        case 'requestEditorStatus':
          postHostMessage({
            type: 'editorStatus',
            status: fixture.state.editorStatus
          });
          postHostMessage({
            type: 'loadDiagramState',
            state: fixture.state,
            info: fixture.state.importStatus,
            warnings: []
          });
          window.__BUILDER_REAL_HARNESS_READY__ = true;
          window.__BUILDER_REAL_HARNESS_STATE__ = {
            stateId: fixture.id,
            viewportId: viewport.id,
            width: viewport.width,
            height: viewport.height
          };
          onStatus?.(`Loaded fixture ${fixture.id}`);
          break;
        case 'openPreview':
        case 'copy':
        case 'insert':
        case 'createFile':
        case 'importActiveDocument':
          onStatus?.(`Harness stub handled ${typed.type}`);
          break;
        case 'showError':
          onStatus?.(`Builder error: ${typed.message || ''}`.trim());
          break;
        default:
          onStatus?.(`Unhandled host message: ${typed.type || 'unknown'}`);
          break;
      }
    }
  });
}
