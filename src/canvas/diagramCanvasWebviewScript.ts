import {
  createCanvasActionsSource,
  createCanvasEventBindingsSource,
  createCanvasGeometryHelpersSource,
  createCanvasRenderGroupsSource,
  createCanvasRenderHelpersSource
} from './diagramCanvasWebviewHelpers';

export interface DiagramCanvasWebviewScriptParams {
  debugEnabled: boolean;
}

export function createDiagramCanvasWebviewScript(params: DiagramCanvasWebviewScriptParams): string {
  const { debugEnabled } = params;

  return `
      const vscode = acquireVsCodeApi();
      const CANVAS_DEBUG = ${debugEnabled ? 'true' : 'false'};
      let state = {
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
      const CLASS_TEMPLATES = [
        { id: 'empty', label: 'Empty Class', description: 'Start from a blank class shell.', defaultName: 'NewClass', members: [] },
        { id: 'entity', label: 'Entity / Model', description: 'Good starting point for persisted domain objects.', defaultName: 'User', members: ['+id: string', '+createdAt: Date', '+updatedAt: Date'] },
        { id: 'service', label: 'Service', description: 'Common service-layer methods and return types.', defaultName: 'UserService', members: ['+getById(id: string): User', '+list(): User[]', '+save(user: User): void'] },
        { id: 'repository', label: 'Repository', description: 'Data-access style methods for fetching and saving.', defaultName: 'UserRepository', members: ['+findById(id: string): User', '+findAll(): User[]', '+save(user: User): void', '+delete(id: string): void'] },
        { id: 'controller', label: 'Controller', description: 'Endpoint-oriented controller actions.', defaultName: 'UserController', members: ['+index(): void', '+show(id: string): void', '+create(): void', '+update(id: string): void'] },
        { id: 'dto', label: 'DTO', description: 'Lightweight data-transfer shape.', defaultName: 'UserDto', members: ['+id: string', '+name: string', '+email: string'] },
        { id: 'component', label: 'Component', description: 'UI-ish component shell with props/state.', defaultName: 'UserCard', members: ['+render(): void', '+props: UserCardProps', '+state: UserCardState'] }
      ];
      let viewportInitialized = false;
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
        lastPointerViewport: null
      };

      const sourceLabel = document.getElementById('sourceLabel');
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

      const persisted = vscode.getState();
      if (persisted && persisted.state) {
        state = persisted.state;
        selectedClassId = persisted.selectedClassId;
        selectedRelationId = persisted.selectedRelationId;
        connectFromClassId = persisted.connectFromClassId;
        connectPreviewPoint = persisted.connectPreviewPoint || null;
        selectedTemplateId = persisted.selectedTemplateId || 'empty';
        connectDragActive = persisted.connectDragActive || false;
        edgeEditorRelationId = persisted.edgeEditorRelationId;
        canvasContextMenu = persisted.canvasContextMenu || null;
        editingTitleClassId = persisted.editingTitleClassId;
        editingMembersClassId = persisted.editingMembersClassId;
        zoom = persisted.zoom || 1;
        render();
      }
      vscode.postMessage({ type: 'requestState' });
`;
}
