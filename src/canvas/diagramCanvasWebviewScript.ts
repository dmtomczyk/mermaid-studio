import {
  createCanvasActionsSource,
  createCanvasEventBindingsSource,
  createCanvasGeometryHelpersSource,
  createCanvasRenderGroupsSource,
  createCanvasRenderHelpersSource
} from './diagramCanvasWebviewHelpers';
import { createCanvasHostBridgeSource } from './core/canvasHostBridgeSource';
import { createCanvasPersistedStateSource } from './core/canvasPersistedStateSource';
import { createCanvasShellUiSource } from './core/canvasShellUiSource';
import { createCanvasStateBridgeSource } from './core/canvasStateBridgeSource';
import { createClassDiagramWebviewSource } from './families/classDiagram/classDiagramWebviewSource';
import { CanvasDiagramFamily } from './types/canvasFamilies';
import { createFlowchartCanvasWebviewScript } from './flowchartCanvasWebviewScript';

export interface DiagramCanvasWebviewScriptParams {
  debugEnabled: boolean;
  family: CanvasDiagramFamily;
}

export function createDiagramCanvasWebviewScript(params: DiagramCanvasWebviewScriptParams): string {
  const { debugEnabled, family } = params;

  if (family === 'flowchart') {
    return createFlowchartCanvasWebviewScript(debugEnabled);
  }

  return `
      const vscode = acquireVsCodeApi();
      const CANVAS_DEBUG = ${debugEnabled ? 'true' : 'false'};
      function postCanvasHostEvent(type, payload) {
        try {
          vscode.postMessage({ type, ...payload });
        } catch {
          // ignore bridge failures
        }
      }
      window.addEventListener('error', (event) => {
        postCanvasHostEvent('canvasError', {
          kind: 'window-error',
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error && event.error.stack ? String(event.error.stack) : undefined
        });
      });
      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        postCanvasHostEvent('canvasError', {
          kind: 'unhandledrejection',
          message: reason && reason.message ? String(reason.message) : String(reason),
          stack: reason && reason.stack ? String(reason.stack) : undefined
        });
      });
      let state = {
        family: 'classDiagram',
        familyLabel: 'Class Diagram',
        availableFamilies: [
          { id: 'classDiagram', label: 'Class Diagram' },
          { id: 'flowchart', label: 'Flowchart' }
        ],
        shellLabels: {
          templateSelect: 'Class template',
          addTemplateButton: 'Add this template',
          sidebarTemplateSection: 'Add Class',
          relationSection: 'Relationships'
        },
        sourceLabel: 'classDiagram canvas',
        linkedFileLabel: 'Untitled canvas',
        linkedFileKind: 'ephemeral',
        canReimport: false,
        canOpenLinkedFile: false,
        canApply: true,
        issues: [],
        model: { family: 'classDiagram', classes: [], relations: [] },
        mermaid: ''
      };
      const WORLD_WIDTH = 6000;
      const WORLD_HEIGHT = 4000;
      const WORLD_ORIGIN_X = 1900;
      const WORLD_ORIGIN_Y = 1300;
${createClassDiagramWebviewSource()}
${createCanvasShellUiSource()}
${createCanvasStateBridgeSource()}
${createCanvasHostBridgeSource()}
${createCanvasPersistedStateSource()}
      let viewportInitialized = false;
      let hasReceivedInitialState = false;
      let selectedClassId;
      let selectedRelationId;
      let connectFromClassId;
      let connectPreviewPoint = null;
      let connectDragActive = false;
      let edgeEditorRelationId;
      let canvasContextMenu = null;
      let editingTitleClassId;
      let editingMembersClassId;
      let zoom = 1;
      let cameraX = 0;
      let cameraY = 0;
      let dragState = null;
      let panState = null;
      let keyboardPanMode = false;
      let minimapDragState = null;
      let shouldFocusEdgeEditorLabel = false;
      let lastCanvasPointerClientPoint = null;
      let bareCanvasPointerDown = null;
      let selectedTemplateId = 'empty';
      let contextDeleteArmed = false;
      let debugState = {
        zoomAnchor: null,
        preZoomStagePoint: null,
        targetZoomScroll: null,
        postZoomScroll: null,
        scrollMetrics: null,
        lastWheel: null,
        lastMinimap: null,
        lastPointerViewport: null,
        events: []
      };

      const sourceLabel = document.getElementById('sourceLabel');
      const familySelect = document.getElementById('familySelect');
      const templateSectionTitle = document.getElementById('templateSectionTitle');
      const relationSectionTitle = document.getElementById('relationSectionTitle');
      const toolbarStatus = document.getElementById('toolbarStatus');
      const debugPanel = CANVAS_DEBUG ? document.getElementById('debugPanel') : null;
      const canvasShell = document.getElementById('canvasShell');
      const canvasStage = document.getElementById('canvasStage');
      const nodeLayer = document.getElementById('nodeLayer');
      const edgeLayer = document.getElementById('edgeLayer');
      const minimap = document.getElementById('minimap');
      const minimapBody = document.getElementById('minimapBody');
      const edgeEditor = document.getElementById('edgeEditor');
      const contextMenu = document.getElementById('contextMenu');
      const contextMenuTitle = document.getElementById('contextMenuTitle');
      const linkedFileInfo = document.getElementById('linkedFileInfo');
      const templatePreview = document.getElementById('templatePreview');
      const inspectorTitle = document.getElementById('inspectorTitle');
      const inspectorBody = document.getElementById('inspectorBody');
      const relationList = document.getElementById('relationList');
      const validationList = document.getElementById('validationList');
      const mermaidSource = document.getElementById('mermaidSource');
      const addClassButton = document.getElementById('addClassButton');
      const addTemplateFromSidebarButton = document.getElementById('addTemplateFromSidebarButton');
      const classTemplateSelect = document.getElementById('classTemplateSelect');
      const fitSelectionButton = document.getElementById('fitSelectionButton');
      const fitDiagramButton = document.getElementById('fitDiagramButton');
      const zoomOutButton = document.getElementById('zoomOutButton');
      const zoomResetButton = document.getElementById('zoomResetButton');
      const zoomActualButton = document.getElementById('zoomActualButton');
      const zoomInButton = document.getElementById('zoomInButton');
      const openLinkedFileButton = document.getElementById('openLinkedFileButton');
      const applyButton = document.getElementById('applyButton');
      const copyButton = document.getElementById('copyButton');
      const createFileButton = document.getElementById('createFileButton');
      const previewButton = document.getElementById('previewButton');
      const reimportButton = document.getElementById('reimportButton');

${createCanvasActionsSource()}

${createCanvasGeometryHelpersSource()}

${createCanvasRenderHelpersSource()}

${createCanvasRenderGroupsSource()}

${createCanvasEventBindingsSource()}

      restoreCanvasPersistedState({
        restoreSelection(persisted) {
          selectedClassId = persisted.selectedClassId;
          selectedRelationId = persisted.selectedRelationId;
          connectFromClassId = persisted.connectFromClassId;
          connectPreviewPoint = persisted.connectPreviewPoint || null;
        },
        restoreExtras(persisted) {
          selectedTemplateId = persisted.selectedTemplateId || 'empty';
          connectDragActive = persisted.connectDragActive || false;
          edgeEditorRelationId = persisted.edgeEditorRelationId;
          canvasContextMenu = persisted.canvasContextMenu || null;
          editingTitleClassId = persisted.editingTitleClassId;
          editingMembersClassId = persisted.editingMembersClassId;
        }
      });
      requestInitialCanvasState();
`;
}
