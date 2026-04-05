import {
  createCanvasActionsSource,
  createCanvasGeometryHelpersSource,
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

      function renderNodes() {
        nodeLayer.innerHTML = '';
        state.model.classes.forEach((entry) => {
          const card = document.createElement('article');
          card.dataset.classId = entry.id;
          card.className = 'class-node'
            + (entry.id === selectedClassId ? ' selected' : '')
            + (entry.id === connectFromClassId ? ' connect-source' : '');
          card.style.left = worldToStageX(entry.x) + 'px';
          card.style.top = worldToStageY(entry.y) + 'px';
          card.style.width = (entry.width || 220) + 'px';

          const selected = entry.id === selectedClassId;
          const titleEditing = editingTitleClassId === entry.id;
          const membersEditing = editingMembersClassId === entry.id;
          const selectedActions = selected
            ? '<div class="node-actions">'
              + '<button type="button" class="ghost" data-action="rename">Rename</button>'
              + '<button type="button" class="ghost" data-action="member">Edit members</button>'
              + '<button type="button" class="ghost" data-action="add-nearby">Add nearby</button>'
              + '<button type="button" class="ghost" data-action="duplicate">Duplicate</button>'
              + '<button type="button" class="ghost" data-action="connect">Connect</button>'
              + '<button type="button" class="ghost danger" data-action="delete">Delete</button>'
              + '</div>'
            : '';
          const titleMarkup = titleEditing
            ? '<input class="node-title-input" data-role="title-input" type="text" value="' + escapeHtml(entry.name) + '" />'
            : '<div class="node-title" title="' + escapeHtml(entry.name) + '">' + escapeHtml(entry.name) + '</div>';
          const bodyMarkup = membersEditing
            ? '<textarea class="node-members-input" data-role="members-input">' + escapeHtml(entry.members.join('\\n')) + '</textarea>'
              + '<div class="members-editor-preview">' + renderMemberPreviewHtml(entry.members.join('\\n')) + '</div>'
            : '<div class="node-body">' + (entry.members.length ? entry.members.map((member) => '<span class="node-member-line">' + highlightNodeMemberLine(member) + '</span>').join('') : 'No members yet') + '</div>';
          card.innerHTML = '<div class="node-header">'
            + '<div class="node-header-main">' + titleMarkup + '</div>'
            + '<div class="node-header-tools">'
            + '<span class="meta">' + entry.members.length + ' members</span>'
            + '<button type="button" class="node-port' + (connectFromClassId === entry.id ? ' active' : '') + '" data-action="quick-connect" title="Connect from this class"></button>'
            + '</div>'
            + '</div>'
            + bodyMarkup
            + '<div class="node-hint">'
            + 'Drag to move · double-click title to rename · double-click members to edit inline'
            + selectedActions
            + '</div>';

          const header = card.querySelector('.node-header');
          const title = card.querySelector('.node-title');
          const body = card.querySelector('.node-body');
          const titleInput = card.querySelector('[data-role="title-input"]');
          const membersInput = card.querySelector('[data-role="members-input"]');
          const membersPreview = card.querySelector('.members-editor-preview');
          const actions = card.querySelector('.node-actions');
          const quickConnectButton = card.querySelector('[data-action="quick-connect"]');

          card.addEventListener('click', (event) => {
            event.stopPropagation();
            canvasContextMenu = null;
            if (connectFromClassId && connectFromClassId !== entry.id && !connectDragActive) {
              createRelation(connectFromClassId, entry.id);
              return;
            }
            selectedClassId = entry.id;
            selectedRelationId = undefined;
            render();
          });

          card.addEventListener('pointerup', (event) => {
            if (connectDragActive && connectFromClassId && connectFromClassId !== entry.id) {
              event.stopPropagation();
              createRelation(connectFromClassId, entry.id);
            }
          });

          title?.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            startInlineTitleEdit(entry.id);
          });

          body?.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            startInlineMembersEdit(entry.id);
          });

          titleInput?.addEventListener('click', (event) => {
            event.stopPropagation();
          });
          titleInput?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitInlineTitleEdit(entry.id, titleInput.value);
            } else if (event.key === 'Escape') {
              editingTitleClassId = undefined;
              render();
            }
          });
          titleInput?.addEventListener('blur', () => {
            commitInlineTitleEdit(entry.id, titleInput.value);
          });

          membersInput?.addEventListener('click', (event) => {
            event.stopPropagation();
          });
          membersInput?.addEventListener('input', () => {
            if (membersPreview) {
              membersPreview.innerHTML = renderMemberPreviewHtml(membersInput.value);
            }
          });
          membersInput?.addEventListener('keydown', (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              commitInlineMembersEdit(entry.id, membersInput.value);
            } else if (event.key === 'Escape') {
              editingMembersClassId = undefined;
              render();
            }
          });
          membersInput?.addEventListener('blur', () => {
            commitInlineMembersEdit(entry.id, membersInput.value);
          });

          actions?.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target instanceof HTMLElement ? event.target.getAttribute('data-action') : undefined;
            if (action === 'rename') {
              renameClass(entry.id);
            } else if (action === 'member') {
              addMemberToClass(entry.id);
            } else if (action === 'add-nearby') {
              addConnectedClassAt(entry.x + 280, entry.y + 40);
            } else if (action === 'duplicate') {
              duplicateClassFrom(entry.id, entry.x + 40, entry.y + 180);
            } else if (action === 'connect') {
              startConnectFrom(entry.id);
            } else if (action === 'delete') {
              deleteClass(entry.id);
            }
          });

          quickConnectButton?.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            startConnectFrom(entry.id);
            connectDragActive = true;
            updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
          });
          quickConnectButton?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
          });

          header.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
            selectedClassId = entry.id;
            selectedRelationId = undefined;
            dragState = {
              id: entry.id,
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              originX: entry.x,
              originY: entry.y
            };
            header.setPointerCapture(event.pointerId);
            render();
          });

          header.addEventListener('pointermove', (event) => {
            if (!dragState || dragState.id !== entry.id || dragState.pointerId !== event.pointerId) {
              return;
            }
            const deltaX = (event.clientX - dragState.startX) / zoom;
            const deltaY = (event.clientY - dragState.startY) / zoom;
            entry.x = Math.max(-WORLD_ORIGIN_X + 40, Math.round(dragState.originX + deltaX));
            entry.y = Math.max(-WORLD_ORIGIN_Y + 40, Math.round(dragState.originY + deltaY));
            renderNodes();
            renderEdges();
          });

          const finishDrag = (event) => {
            if (!dragState || dragState.id !== entry.id || dragState.pointerId !== event.pointerId) {
              return;
            }
            dragState = null;
            emitStateChanged();
          };

          header.addEventListener('pointerup', finishDrag);
          header.addEventListener('pointercancel', finishDrag);
          nodeLayer.appendChild(card);

          if (titleInput) {
            queueMicrotask(() => {
              titleInput.focus();
              titleInput.select();
            });
          }
          if (membersInput) {
            queueMicrotask(() => {
              membersInput.focus();
              membersInput.selectionStart = membersInput.value.length;
              membersInput.selectionEnd = membersInput.value.length;
            });
          }
        });
      }

      function renderEdges() {
        edgeLayer.innerHTML = '';
        edgeLayer.setAttribute('viewBox', '0 0 ' + WORLD_WIDTH + ' ' + WORLD_HEIGHT);

        state.model.relations.forEach((relation) => {
          const from = state.model.classes.find((entry) => entry.id === relation.from);
          const to = state.model.classes.find((entry) => entry.id === relation.to);
          if (!from || !to) {
            return;
          }
          const startX = worldToStageX(from.x + (from.width || 220) / 2);
          const startY = worldToStageY(from.y + (from.height || 120) / 2);
          const endX = worldToStageX(to.x + (to.width || 220) / 2);
          const endY = worldToStageY(to.y + (to.height || 120) / 2);
          const midX = Math.round((startX + endX) / 2);
          const midY = Math.round((startY + endY) / 2);
          const d = 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;

          const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          hit.setAttribute('class', 'edge-hit');
          hit.setAttribute('d', d);
          hit.dataset.relationId = relation.id;
          hit.addEventListener('click', (event) => {
            event.stopPropagation();
            selectRelation(relation.id);
          });
          edgeLayer.appendChild(hit);

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('class', 'edge-line' + (relation.id === selectedRelationId ? ' selected' : ''));
          path.setAttribute('d', d);
          path.dataset.relationId = relation.id;
          edgeLayer.appendChild(path);

          const labelText = relation.label || relation.type || '-->';
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('class', 'edge-label' + (relation.id === selectedRelationId ? ' selected' : ''));
          label.dataset.relationId = relation.id;
          label.setAttribute('x', String(midX));
          label.setAttribute('y', String(midY - 8));
          label.setAttribute('text-anchor', 'middle');
          label.textContent = labelText;
          label.addEventListener('click', (event) => {
            event.stopPropagation();
            selectRelation(relation.id);
          });
          label.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            editRelationLabel(relation.id);
          });
          edgeLayer.appendChild(label);
        });

        if (connectFromClassId && connectPreviewPoint) {
          const from = state.model.classes.find((entry) => entry.id === connectFromClassId);
          if (from) {
            const startX = worldToStageX(from.x + (from.width || 220) / 2);
            const startY = worldToStageY(from.y + (from.height || 120) / 2);
            const endX = worldToStageX(connectPreviewPoint.x);
            const endY = worldToStageY(connectPreviewPoint.y);
            const midX = Math.round((startX + endX) / 2);
            const d = 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'edge-line connecting');
            path.setAttribute('d', d);
            edgeLayer.appendChild(path);
          }
        }
      }

      function renderLinkedFileInfo() {
        const kindLabel = state.linkedFileKind === 'markdown'
          ? 'Markdown Mermaid block'
          : state.linkedFileKind === 'mermaid'
            ? 'Linked Mermaid file'
            : 'Ephemeral / not yet linked';
        linkedFileInfo.innerHTML = '<strong>' + escapeHtml(state.linkedFileLabel || 'Untitled canvas') + '</strong><br/>'
          + escapeHtml(kindLabel)
          + (state.canReimport ? '<br/><span class="meta">Apply and Preview target this linked file.</span>' : '<br/><span class="meta">Apply will target the active editor or create a file if needed.</span>')
          + (state.canOpenLinkedFile ? '<br/><span class="meta">Use “Open Linked File” above to inspect the backing document directly.</span>' : '');
      }

      function renderTemplatePreview() {
        const template = getTemplateById(selectedTemplateId);
        templatePreview.innerHTML = '<strong>' + escapeHtml(template.label) + '</strong><br/>'
          + '<span class="meta">' + escapeHtml(template.description || '') + '</span>'
          + '<br/>'
          + '<span class="meta">Default name: ' + escapeHtml(template.defaultName) + '</span>'
          + '<br/>'
          + (template.members.length
            ? '<div class="code-block" style="margin-top:8px;">' + template.members.map((member) => '<span class="code-line-root">' + highlightNodeMemberLine(member) + '</span>').join('') + '</div>'
            : '<span class="meta">Starts empty.</span>');
      }

      function renderValidation() {
        if (!Array.isArray(state.issues) || !state.issues.length) {
          validationList.innerHTML = '<div class="inspector-empty">No validation issues.</div>';
          return;
        }
        validationList.innerHTML = state.issues.map((issue) =>
          '<div class="validation-item ' + escapeHtml(issue.level || 'warning') + '">'
          + '<strong>' + escapeHtml((issue.level || 'warning').toUpperCase()) + '</strong><br/>'
          + escapeHtml(issue.message || 'Unknown issue')
          + '</div>'
        ).join('');
      }

      function renderMemberPreviewHtml(text) {
        const lines = String(text || '').split(/\\r?\\n/);
        if (!lines.some((line) => line.trim())) {
          return '<span class="inspector-empty">No members yet.</span>';
        }
        return lines.map((line) => '<span class="node-member-line">' + highlightNodeMemberLine(line) + '</span>').join('');
      }

      function highlightNodeMemberLine(member) {
        const raw = String(member || '').trim();
        const escaped = escapeHtml(raw);
        if (!raw) {
          return escaped;
        }

        let cursor = 0;
        let visibility = '';
        if ('+-#~'.includes(raw.charAt(0))) {
          visibility = raw.charAt(0);
          cursor = 1;
        }

        while (raw.charAt(cursor) === ' ') {
          cursor += 1;
        }

        let name = '';
        while (cursor < raw.length && /[A-Za-z0-9_]/.test(raw.charAt(cursor))) {
          name += raw.charAt(cursor);
          cursor += 1;
        }

        while (raw.charAt(cursor) === ' ') {
          cursor += 1;
        }

        let params = '';
        if (raw.charAt(cursor) === '(') {
          const end = raw.indexOf(')', cursor);
          if (end >= cursor) {
            params = raw.slice(cursor, end + 1);
            cursor = end + 1;
          }
        }

        while (raw.charAt(cursor) === ' ') {
          cursor += 1;
        }

        let type = '';
        if (raw.charAt(cursor) === ':') {
          type = raw.slice(cursor + 1).trim();
        }

        let result = '';
        if (visibility) {
          result += '<span class="tok-visibility">' + escapeHtml(visibility) + '</span>';
        }
        if (name) {
          result += '<span class="tok-member-name">' + escapeHtml(name) + '</span>';
        }
        if (params) {
          result += '<span class="tok-params">' + escapeHtml(params) + '</span>';
        }
        if (type) {
          result += '<span class="tok-type">: ' + escapeHtml(type) + '</span>';
        }
        return result || escaped;
      }

      function renderDebugPanel() {
        if (!CANVAS_DEBUG || !debugPanel) {
          return;
        }
        debugPanel.textContent = [
          'DEBUG VIEWPORT',
          'zoom=' + zoom,
          'camera=(' + Math.round(cameraX) + ', ' + Math.round(cameraY) + ')',
          'pointer=' + formatDebugPoint(debugState.lastPointerViewport),
          'wheel=' + formatDebugPoint(debugState.lastWheel),
          'zoomAnchor=' + formatDebugPoint(debugState.zoomAnchor),
          'preZoomStage=' + formatDebugPoint(debugState.preZoomStagePoint),
          'targetZoomScroll=' + formatDebugPoint(debugState.targetZoomScroll),
          'postZoomScroll=' + formatDebugPoint(debugState.postZoomScroll),
          'scrollMetrics=' + formatDebugPoint(debugState.scrollMetrics),
          'minimap=' + formatDebugPoint(debugState.lastMinimap)
        ].join('\\n');
      }

      function formatDebugPoint(point) {
        if (!point) {
          return '∅';
        }
        const entries = Object.entries(point).map(([key, value]) => key + '=' + Math.round(Number(value) * 100) / 100);
        return '{ ' + entries.join(', ') + ' }';
      }

      function renderMermaidSource() {
        const lines = (state.mermaid || '').split(/\\n/);
        mermaidSource.innerHTML = lines.map((line) => '<span class="code-line-root">' + highlightMermaidLine(line) + '</span>').join('');
      }

      function highlightMermaidLine(rawLine) {
        const escaped = escapeHtml(rawLine);
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return '&nbsp;';
        }
        if (trimmed.startsWith('%%')) {
          return '<span class="tok-comment">' + escaped + '</span>';
        }
        if (trimmed === 'classDiagram') {
          return escaped.replace('classDiagram', '<span class="tok-keyword">classDiagram</span>');
        }
        if (trimmed.startsWith('class ')) {
          const classMatch = rawLine.match(new RegExp('^(\\s*)class(\\s+)([A-Za-z_][\\w.]*)'));
          if (classMatch) {
            const indent = classMatch[1] || '';
            const gap = classMatch[2] || ' ';
            const name = classMatch[3] || '';
            const suffix = rawLine.slice(classMatch[0].length);
            return escapeHtml(indent)
              + '<span class="tok-keyword">class</span>'
              + escapeHtml(gap)
              + '<span class="tok-identifier">' + escapeHtml(name) + '</span>'
              + escapeHtml(suffix);
          }
        }
        if ('+-#~'.includes(trimmed.charAt(0)) || trimmed.includes('(')) {
          return '<span class="tok-member">' + escaped + '</span>';
        }
        const relationMatch = rawLine.match(new RegExp('^(\\s*)([A-Za-z_][\\w.]*)(\\s+)([<>|*ox.\\-]+)(\\s+)([A-Za-z_][\\w.]*)(?:\\s*:\\s*(.+))?$'));
        if (relationMatch) {
          const indent = relationMatch[1] || '';
          const from = relationMatch[2] || '';
          const gap1 = relationMatch[3] || ' ';
          const type = relationMatch[4] || '-->';
          const gap2 = relationMatch[5] || ' ';
          const to = relationMatch[6] || '';
          const label = relationMatch[7];
          return escapeHtml(indent)
            + '<span class="tok-identifier">' + escapeHtml(from) + '</span>'
            + escapeHtml(gap1)
            + '<span class="tok-relation">' + escapeHtml(type) + '</span>'
            + escapeHtml(gap2)
            + '<span class="tok-identifier">' + escapeHtml(to) + '</span>'
            + (label ? '<span class="tok-label"> : ' + escapeHtml(label) + '</span>' : '');
        }
        return escaped;
      }

      function renderMinimap() {
        minimapBody.innerHTML = '';
        const width = minimapBody.clientWidth || 220;
        const height = minimapBody.clientHeight || 111;
        const scaleX = width / WORLD_WIDTH;
        const scaleY = height / WORLD_HEIGHT;

        state.model.classes.forEach((entry) => {
          const node = document.createElement('div');
          node.className = 'minimap-node' + (entry.id === selectedClassId ? ' selected' : '');
          node.style.left = Math.max(0, worldToStageX(entry.x) * scaleX) + 'px';
          node.style.top = Math.max(0, worldToStageY(entry.y) * scaleY) + 'px';
          node.style.width = Math.max(8, (entry.width || 220) * scaleX) + 'px';
          node.style.height = Math.max(6, (entry.height || 120) * scaleY) + 'px';
          minimapBody.appendChild(node);
        });

        const viewport = document.createElement('div');
        viewport.className = 'minimap-viewport';
        viewport.dataset.role = 'minimap-viewport';
        viewport.style.left = Math.max(0, cameraX * scaleX) + 'px';
        viewport.style.top = Math.max(0, cameraY * scaleY) + 'px';
        viewport.style.width = Math.max(12, (canvasShell.clientWidth / zoom) * scaleX) + 'px';
        viewport.style.height = Math.max(12, (canvasShell.clientHeight / zoom) * scaleY) + 'px';
        minimapBody.appendChild(viewport);
      }

      function closeEdgeEditor() {
        selectedRelationId = undefined;
        edgeEditorRelationId = undefined;
        shouldFocusEdgeEditorLabel = false;
        render();
      }

      function renderEdgeEditor() {
        const relation = getSelectedRelation();
        if (!relation) {
          edgeEditor.hidden = true;
          edgeEditor.innerHTML = '';
          edgeEditorRelationId = undefined;
          return;
        }
        const from = state.model.classes.find((entry) => entry.id === relation.from);
        const to = state.model.classes.find((entry) => entry.id === relation.to);
        if (!from || !to) {
          edgeEditor.hidden = true;
          edgeEditor.innerHTML = '';
          edgeEditorRelationId = undefined;
          return;
        }
        const targetStageX = worldToStageX(to.x + (to.width || 220));
        const targetStageY = worldToStageY(to.y + Math.min((to.height || 120) - 24, 56));
        const targetViewport = stagePointToViewportPoint(targetStageX, targetStageY);
        const visualOffset = viewportPointToStageOffset(18, 12);
        edgeEditor.hidden = false;

        if (edgeEditorRelationId !== relation.id) {
          edgeEditor.innerHTML = '<div class="edge-editor-grid">'
            + '<strong>Relationship</strong>'
            + '<input id="edgeEditorLabel" type="text" placeholder="Label" />'
            + '<input id="edgeEditorType" type="text" placeholder="-->" />'
            + '<div class="small-actions">'
            + '<button id="edgeEditorReverse" class="ghost">Reverse</button>'
            + '<button id="edgeEditorDelete" class="secondary danger">Delete</button>'
            + '</div>'
            + '</div>';
          edgeEditorRelationId = relation.id;

          const labelInput = document.getElementById('edgeEditorLabel');
          const typeInput = document.getElementById('edgeEditorType');
          labelInput.value = relation.label || '';
          typeInput.value = relation.type || '-->';

          labelInput.addEventListener('input', (event) => {
            relation.label = event.target.value.trim() || undefined;
            renderEdges();
          });
          labelInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              emitStateChanged();
              closeEdgeEditor();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              closeEdgeEditor();
            }
          });
          labelInput.addEventListener('blur', () => {
            emitStateChanged();
          });
          typeInput.addEventListener('input', (event) => {
            relation.type = event.target.value || '-->';
            renderEdges();
          });
          typeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              emitStateChanged();
              closeEdgeEditor();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              closeEdgeEditor();
            }
          });
          typeInput.addEventListener('blur', () => {
            emitStateChanged();
          });
          document.getElementById('edgeEditorReverse').addEventListener('click', () => {
            const nextFrom = relation.to;
            relation.to = relation.from;
            relation.from = nextFrom;
            emitStateChanged();
          });
          document.getElementById('edgeEditorDelete').addEventListener('click', () => {
            deleteRelation(relation.id);
          });
        } else {
          const labelInput = document.getElementById('edgeEditorLabel');
          const typeInput = document.getElementById('edgeEditorType');
          if (document.activeElement !== labelInput) {
            labelInput.value = relation.label || '';
          }
          if (document.activeElement !== typeInput) {
            typeInput.value = relation.type || '-->';
          }
        }

        const editorWidth = edgeEditor.offsetWidth || 260;
        const editorHeight = edgeEditor.offsetHeight || 132;
        const viewportPadding = 16;
        const preferRightStageX = targetStageX + visualOffset.x;
        const preferLeftStageX = targetStageX - (editorWidth / zoom) - visualOffset.x;
        const preferBelowStageY = targetStageY + visualOffset.y;
        const preferAboveStageY = targetStageY - (editorHeight / zoom) - visualOffset.y;
        const desiredStageX = targetViewport.x + 18 + editorWidth + viewportPadding <= canvasShell.clientWidth
          ? preferRightStageX
          : preferLeftStageX;
        const desiredStageY = targetViewport.y + 12 + editorHeight + viewportPadding <= canvasShell.clientHeight
          ? preferBelowStageY
          : preferAboveStageY;
        const minStageX = cameraX + (viewportPadding / zoom);
        const maxStageX = cameraX + ((canvasShell.clientWidth - editorWidth - viewportPadding) / zoom);
        const minStageY = cameraY + (viewportPadding / zoom);
        const maxStageY = cameraY + ((canvasShell.clientHeight - editorHeight - viewportPadding) / zoom);
        edgeEditor.style.left = Math.max(minStageX, Math.min(maxStageX, desiredStageX)) + 'px';
        edgeEditor.style.top = Math.max(minStageY, Math.min(maxStageY, desiredStageY)) + 'px';

        if (shouldFocusEdgeEditorLabel) {
          const labelInput = document.getElementById('edgeEditorLabel');
          queueMicrotask(() => {
            labelInput?.focus();
            labelInput?.select();
          });
          shouldFocusEdgeEditorLabel = false;
        }
      }

      function renderInspector() {
        const selectedClass = getSelectedClass();
        const selectedRelation = getSelectedRelation();

        if (selectedRelation) {
          const from = state.model.classes.find((entry) => entry.id === selectedRelation.from);
          const to = state.model.classes.find((entry) => entry.id === selectedRelation.to);
          inspectorTitle.textContent = 'Selected relationship';
          inspectorBody.innerHTML = '<label>'
            + 'From'
            + '<select id="relationFromSelect"></select>'
            + '</label>'
            + '<label>'
            + 'Relationship type'
            + '<input id="relationTypeInput" type="text" placeholder="-->" />'
            + '</label>'
            + '<label>'
            + 'To'
            + '<select id="relationToSelect"></select>'
            + '</label>'
            + '<label>'
            + 'Label'
            + '<input id="relationLabelInput" type="text" placeholder="uses" />'
            + '</label>'
            + '<div class="small-actions">'
            + '<button id="deleteRelationButton" class="secondary danger">Delete relationship</button>'
            + '<button id="focusFromButton" class="ghost">Focus source class</button>'
            + '<button id="focusToButton" class="ghost">Focus target class</button>'
            + '</div>';

          const fromSelect = document.getElementById('relationFromSelect');
          const toSelect = document.getElementById('relationToSelect');
          populateClassOptions(fromSelect, selectedRelation.from);
          populateClassOptions(toSelect, selectedRelation.to);
          document.getElementById('relationTypeInput').value = selectedRelation.type || '-->';
          document.getElementById('relationLabelInput').value = selectedRelation.label || '';

          fromSelect.addEventListener('change', () => {
            selectedRelation.from = fromSelect.value;
            emitStateChanged();
          });
          toSelect.addEventListener('change', () => {
            selectedRelation.to = toSelect.value;
            emitStateChanged();
          });
          document.getElementById('relationTypeInput').addEventListener('input', (event) => {
            selectedRelation.type = event.target.value || '-->';
            emitStateChanged();
          });
          document.getElementById('relationLabelInput').addEventListener('input', (event) => {
            selectedRelation.label = event.target.value.trim() || undefined;
            emitStateChanged();
          });
          document.getElementById('deleteRelationButton').addEventListener('click', () => {
            deleteRelation(selectedRelation.id);
          });
          document.getElementById('focusFromButton').addEventListener('click', () => {
            selectedClassId = from ? from.id : undefined;
            selectedRelationId = undefined;
            connectFromClassId = undefined;
            render();
          });
          document.getElementById('focusToButton').addEventListener('click', () => {
            selectedClassId = to ? to.id : undefined;
            selectedRelationId = undefined;
            connectFromClassId = undefined;
            render();
          });
          return;
        }

        if (selectedClass) {
          inspectorTitle.textContent = 'Selected class';
          inspectorBody.innerHTML = '<label>'
            + 'Class name'
            + '<input id="classNameInput" type="text" placeholder="ExampleClass" />'
            + '</label>'
            + '<label>'
            + 'Members (one per line)'
            + '<textarea id="classMembersInput" placeholder="+id: string\\n+render(): void"></textarea>'
            + '</label>'
            + '<div id="classMembersPreview" class="members-editor-preview"></div>'
            + '<div class="small-actions">'
            + '<button id="renameClassButton" class="ghost">Rename</button>'
            + '<button id="addMemberButton" class="ghost">Add member</button>'
            + '<button id="startConnectButton" class="ghost">Connect from here</button>'
            + '<button id="deleteClassButton" class="secondary danger">Delete class</button>'
            + '</div>';
          document.getElementById('classNameInput').value = selectedClass.name;
          document.getElementById('classMembersInput').value = selectedClass.members.join('\\n');
          document.getElementById('classMembersPreview').innerHTML = renderMemberPreviewHtml(selectedClass.members.join('\\n'));
          document.getElementById('classNameInput').addEventListener('input', (event) => {
            selectedClass.name = event.target.value || 'UnnamedClass';
            emitStateChanged();
          });
          document.getElementById('classMembersInput').addEventListener('input', (event) => {
            document.getElementById('classMembersPreview').innerHTML = renderMemberPreviewHtml(event.target.value);
            selectedClass.members = event.target.value.split(/\\r?\\n/).map((entry) => entry.trim()).filter(Boolean);
            emitStateChanged();
          });
          document.getElementById('renameClassButton').addEventListener('click', () => renameClass(selectedClass.id));
          document.getElementById('addMemberButton').addEventListener('click', () => addMemberToClass(selectedClass.id));
          document.getElementById('startConnectButton').addEventListener('click', () => {
            startConnectFrom(selectedClass.id);
          });
          document.getElementById('deleteClassButton').addEventListener('click', () => deleteClass(selectedClass.id));
          return;
        }

        inspectorTitle.textContent = 'Inspector';
        inspectorBody.innerHTML = '<div class="inspector-empty">Select a class or a relationship on the canvas. Double-click empty space to add a class.</div>';
      }

      function renderRelations() {
        relationList.innerHTML = '';
        if (!state.model.relations.length) {
          relationList.innerHTML = '<div class="inspector-empty">No relationships yet. Select a class, then use Connect Selected or the Connect button on the node.</div>';
          return;
        }

        state.model.relations.forEach((relation) => {
          const from = state.model.classes.find((entry) => entry.id === relation.from);
          const to = state.model.classes.find((entry) => entry.id === relation.to);
          const row = document.createElement('div');
          row.className = 'relation-row' + (relation.id === selectedRelationId ? ' selected' : '');
          row.innerHTML = '<div class="relation-summary">'
            + escapeHtml((from ? from.name : '?') + ' ' + (relation.type || '-->') + ' ' + (to ? to.name : '?') + (relation.label ? ' : ' + relation.label : ''))
            + '</div>'
            + '<div class="small-actions">'
            + '<button class="ghost" data-action="select">Edit</button>'
            + '<button class="ghost" data-action="label">Rename label</button>'
            + '<button class="secondary danger" data-action="delete">Delete</button>'
            + '</div>';
          row.addEventListener('click', () => selectRelation(relation.id));
          row.querySelector('.small-actions').addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target instanceof HTMLElement ? event.target.getAttribute('data-action') : undefined;
            if (action === 'select') {
              selectRelation(relation.id);
            } else if (action === 'label') {
              selectRelation(relation.id);
              shouldFocusEdgeEditorLabel = true;
              render();
            } else if (action === 'delete') {
              deleteRelation(relation.id);
            }
          });
          relationList.appendChild(row);
        });
      }

      function updateToolbarStatus() {
        if (Array.isArray(state.issues) && state.issues.some((issue) => issue.level === 'error')) {
          toolbarStatus.textContent = 'Canvas has validation errors. Fix them before applying to the linked document.';
          return;
        }
        if (canvasContextMenu) {
          toolbarStatus.textContent = 'Context menu open. Pick a quick action where you clicked, or click elsewhere to dismiss it.';
          return;
        }
        if (connectFromClassId) {
          const from = state.model.classes.find((entry) => entry.id === connectFromClassId);
          toolbarStatus.textContent = from
            ? 'Connecting from ' + from.name + '. Move the cursor and click another class to finish, or press Escape to cancel.'
            : 'Pick another class to complete the relationship.';
          return;
        }
        if (editingTitleClassId) {
          toolbarStatus.textContent = 'Editing class name inline. Press Enter to save or Escape to cancel.';
          return;
        }
        if (editingMembersClassId) {
          toolbarStatus.textContent = 'Editing members inline. Blur to save, or Ctrl/Cmd+Enter to commit quickly.';
          return;
        }
        if (selectedRelationId) {
          toolbarStatus.textContent = 'Relationship selected. Click the edge label to edit it fast, or use the inspector on the right.';
          return;
        }
        toolbarStatus.textContent = 'Drag classes. Double-click empty space to add. Double-click a title or members area to edit inline.';
      }

      function emitStateChanged() {
        vscode.postMessage({ type: 'stateChanged', model: state.model });
      }

      function getTemplateById(templateId) {
        return CLASS_TEMPLATES.find((entry) => entry.id === templateId) || CLASS_TEMPLATES[0];
      }

      function getUniqueClassName(baseName) {
        const normalized = String(baseName || 'NewClass').trim() || 'NewClass';
        const existing = new Set(state.model.classes.map((entry) => entry.name.trim().toLowerCase()));
        if (!existing.has(normalized.toLowerCase())) {
          return normalized;
        }
        let counter = 2;
        while (existing.has((normalized + counter).toLowerCase())) {
          counter += 1;
        }
        return normalized + counter;
      }

      function addClassAt(x, y, templateId = 'empty') {
        const nextNumber = state.model.classes.length + 1;
        const template = getTemplateById(templateId);
        state.model.classes.push({
          id: nextId('class'),
          name: getUniqueClassName(template.id === 'empty' ? 'NewClass' + nextNumber : template.defaultName),
          members: template.members.slice(),
          x: Math.max(-WORLD_ORIGIN_X + 40, Math.round(x)),
          y: Math.max(-WORLD_ORIGIN_Y + 40, Math.round(y)),
          width: 220,
          height: 120
        });
        selectedClassId = state.model.classes[state.model.classes.length - 1].id;
        selectedRelationId = undefined;
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        canvasContextMenu = null;
        editingMembersClassId = undefined;
        editingTitleClassId = selectedClassId;
        emitStateChanged();
      }

      function startConnectFrom(classId) {
        selectedClassId = classId;
        selectedRelationId = undefined;
        editingTitleClassId = undefined;
        editingMembersClassId = undefined;
        canvasContextMenu = null;
        connectFromClassId = classId;
        const source = state.model.classes.find((entry) => entry.id === classId);
        connectPreviewPoint = source
          ? { x: source.x + (source.width || 220) / 2, y: source.y + (source.height || 120) / 2 }
          : null;
        render();
      }

      function cancelConnectMode() {
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
        render();
      }

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

      function duplicateClassFrom(sourceClassId, x, y) {
        const source = state.model.classes.find((entry) => entry.id === sourceClassId);
        if (!source) {
          addClassAt(x, y);
          return;
        }
        const nextNumber = state.model.classes.length + 1;
        state.model.classes.push({
          id: nextId('class'),
          name: getUniqueClassName(source.name + 'Copy' + nextNumber),
          members: source.members.slice(),
          x: Math.max(-WORLD_ORIGIN_X + 40, Math.round(x)),
          y: Math.max(-WORLD_ORIGIN_Y + 40, Math.round(y)),
          width: source.width || 220,
          height: source.height || 120
        });
        selectedClassId = state.model.classes[state.model.classes.length - 1].id;
        selectedRelationId = undefined;
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        editingMembersClassId = undefined;
        editingTitleClassId = selectedClassId;
        canvasContextMenu = null;
        emitStateChanged();
      }

      function duplicateSelectedClassAt(x, y) {
        const selected = getSelectedClass();
        if (!selected) {
          addClassAt(x, y, selectedTemplateId);
          return;
        }
        duplicateClassFrom(selected.id, x, y);
      }

      function addConnectedClassAt(x, y) {
        const sourceId = selectedClassId;
        addClassAt(x, y, selectedTemplateId);
        const createdId = selectedClassId;
        if (sourceId && createdId && sourceId !== createdId) {
          state.model.relations.push({
            id: nextId('relation'),
            from: sourceId,
            to: createdId,
            type: '-->',
            label: ''
          });
          selectedRelationId = state.model.relations[state.model.relations.length - 1].id;
        }
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        canvasContextMenu = null;
        emitStateChanged();
      }

      function renderContextMenu() {
        if (!canvasContextMenu) {
          contextMenu.hidden = true;
          return;
        }
        contextMenu.hidden = false;
        contextMenu.style.left = Math.max(16, canvasContextMenu.x) + 'px';
        contextMenu.style.top = Math.max(16, canvasContextMenu.y) + 'px';
        const hasClassSelection = Boolean(getSelectedClass());
        const hasAnySelection = hasClassSelection || Boolean(getSelectedRelation());
        const menuTitle = connectFromClassId
          ? 'Connect mode actions'
          : hasAnySelection
            ? 'Quick actions for current selection'
            : 'Canvas actions';
        contextMenuTitle.textContent = menuTitle;
        contextMenu.querySelector('[data-context-action="duplicate-class"]').disabled = !hasClassSelection;
        contextMenu.querySelector('[data-context-action="connect-here"]').disabled = !hasClassSelection;
        const deleteButton = contextMenu.querySelector('[data-context-action="delete-selected"]');
        deleteButton.disabled = !hasAnySelection;
        deleteButton.textContent = contextDeleteArmed ? 'Confirm delete selected' : 'Delete selected';
        contextMenu.querySelector('[data-context-action="cancel-connect"]').disabled = !connectFromClassId;
      }

      function deleteClass(classId) {
        canvasContextMenu = null;
        state.model.classes = state.model.classes.filter((entry) => entry.id !== classId);
        state.model.relations = state.model.relations.filter((entry) => entry.from !== classId && entry.to !== classId);
        if (selectedClassId === classId) {
          selectedClassId = undefined;
        }
        if (connectFromClassId === classId) {
          connectFromClassId = undefined;
          connectPreviewPoint = null;
        }
        if (editingTitleClassId === classId) {
          editingTitleClassId = undefined;
        }
        if (editingMembersClassId === classId) {
          editingMembersClassId = undefined;
        }
        selectedRelationId = undefined;
        emitStateChanged();
      }

      function createRelation(fromId, toId) {
        if (!fromId || !toId || fromId === toId) {
          connectFromClassId = undefined;
          connectPreviewPoint = null;
          render();
          return;
        }
        state.model.relations.push({
          id: nextId('relation'),
          from: fromId,
          to: toId,
          type: '-->',
          label: ''
        });
        selectedClassId = undefined;
        selectedRelationId = state.model.relations[state.model.relations.length - 1].id;
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
        emitStateChanged();
      }

      function deleteRelation(relationId) {
        canvasContextMenu = null;
        state.model.relations = state.model.relations.filter((entry) => entry.id !== relationId);
        if (selectedRelationId === relationId) {
          selectedRelationId = undefined;
        }
        if (edgeEditorRelationId === relationId) {
          edgeEditorRelationId = undefined;
        }
        emitStateChanged();
      }

      function startInlineTitleEdit(classId) {
        selectedClassId = classId;
        selectedRelationId = undefined;
        editingMembersClassId = undefined;
        editingTitleClassId = classId;
        render();
      }

      function commitInlineTitleEdit(classId, nextName) {
        const entry = state.model.classes.find((item) => item.id === classId);
        if (!entry) {
          editingTitleClassId = undefined;
          render();
          return;
        }
        const trimmed = String(nextName || '').trim();
        entry.name = trimmed || entry.name;
        selectedClassId = entry.id;
        selectedRelationId = undefined;
        editingTitleClassId = undefined;
        emitStateChanged();
      }

      function startInlineMembersEdit(classId) {
        const entry = state.model.classes.find((item) => item.id === classId);
        if (!entry) {
          return;
        }
        selectedClassId = classId;
        selectedRelationId = undefined;
        editingTitleClassId = undefined;
        editingMembersClassId = classId;
        render();
      }

      function commitInlineMembersEdit(classId, nextMembersText) {
        const entry = state.model.classes.find((item) => item.id === classId);
        if (!entry) {
          editingMembersClassId = undefined;
          render();
          return;
        }
        entry.members = String(nextMembersText || '')
          .split(/\\r?\\n/)
          .map((member) => member.trim())
          .filter(Boolean);
        selectedClassId = entry.id;
        selectedRelationId = undefined;
        editingMembersClassId = undefined;
        emitStateChanged();
      }

      function renameClass(classId) {
        startInlineTitleEdit(classId);
      }

      function addMemberToClass(classId) {
        const entry = state.model.classes.find((item) => item.id === classId);
        if (!entry) {
          return;
        }
        if (!entry.members.length) {
          entry.members.push('+newField: string');
        } else {
          entry.members.push('');
        }
        startInlineMembersEdit(classId);
      }

      function editRelationLabel(relationId) {
        const relation = state.model.relations.find((item) => item.id === relationId);
        if (!relation) {
          return;
        }
        const label = window.prompt('Relationship label', relation.label || '');
        if (label === null) {
          return;
        }
        relation.label = label.trim() || undefined;
        selectedRelationId = relation.id;
        selectedClassId = undefined;
        emitStateChanged();
      }

      function selectRelation(relationId) {
        selectedRelationId = relationId;
        selectedClassId = undefined;
        connectFromClassId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
        edgeEditorRelationId = undefined;
        canvasContextMenu = null;
        render();
      }

      function populateClassOptions(select, selectedId) {
        select.innerHTML = '';
        state.model.classes.forEach((entry) => {
          const option = document.createElement('option');
          option.value = entry.id;
          option.textContent = entry.name;
          option.selected = entry.id === selectedId;
          select.appendChild(option);
        });
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      classTemplateSelect.addEventListener('change', () => {
        selectedTemplateId = classTemplateSelect.value || 'empty';
        renderTemplatePreview();
      });

      addClassButton.addEventListener('click', () => {
        addClassAt(160 + state.model.classes.length * 28, 120 + state.model.classes.length * 18, selectedTemplateId);
      });
      addTemplateFromSidebarButton.addEventListener('click', () => {
        const centerStageX = cameraX + (canvasShell.clientWidth / zoom / 2);
        const centerStageY = cameraY + (canvasShell.clientHeight / zoom / 2);
        addClassAt(stageToWorldX(centerStageX) - 110, stageToWorldY(centerStageY) - 50, selectedTemplateId);
      });

      canvasShell.addEventListener('dblclick', (event) => {
        if (!isBareCanvasTarget(event.target instanceof Element ? event.target : null)) {
          return;
        }
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(event.clientX - rect.left, event.clientY - rect.top);
        const x = stageToWorldX(stagePoint.x) - 110;
        const y = stageToWorldY(stagePoint.y) - 50;
        addClassAt(x, y, selectedTemplateId);
      });

      canvasShell.addEventListener('pointerdown', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!isBareCanvasTarget(target) || event.button !== 0) {
          bareCanvasPointerDown = null;
          return;
        }
        bareCanvasPointerDown = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY
        };
      });

      function updateConnectPreviewFromClientPoint(clientX, clientY) {
        if (!connectFromClassId) {
          return;
        }
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(clientX - rect.left, clientY - rect.top);
        connectPreviewPoint = {
          x: stageToWorldX(stagePoint.x),
          y: stageToWorldY(stagePoint.y)
        };
        renderEdges();
      }

      canvasShell.addEventListener('mousemove', (event) => {
        lastCanvasPointerClientPoint = { x: event.clientX, y: event.clientY };
        debugState.lastPointerViewport = {
          x: event.clientX - canvasShell.getBoundingClientRect().left,
          y: event.clientY - canvasShell.getBoundingClientRect().top
        };
        renderDebugPanel();
        updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
      });

      canvasShell.addEventListener('mousedown', (event) => {
        const wantsPan = event.button === 1 || (keyboardPanMode && event.button === 0 && !event.target.closest('.class-node'));
        if (!wantsPan) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        closeCanvasContextMenu();
        panState = {
          startClientX: event.clientX,
          startClientY: event.clientY,
          startCameraX: cameraX,
          startCameraY: cameraY
        };
        applyZoom();
      });

      canvasShell.addEventListener('wheel', (event) => {
        if (!(event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        const anchorX = event.clientX - canvasShell.getBoundingClientRect().left;
        const anchorY = event.clientY - canvasShell.getBoundingClientRect().top;
        debugState.lastWheel = { anchorX, anchorY, deltaY: event.deltaY };
        renderDebugPanel();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        setZoomAroundViewportPoint(zoom + delta, anchorX, anchorY);
      }, { passive: false });

      window.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && !keyboardPanMode && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
          event.preventDefault();
          keyboardPanMode = true;
          canvasShell.classList.add('panning');
        }
        if (event.key === 'Escape' && canvasContextMenu) {
          event.preventDefault();
          closeCanvasContextMenu();
          return;
        }
        if (event.key === 'Escape' && connectFromClassId) {
          event.preventDefault();
          cancelConnectMode();
        }
      });

      window.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
          keyboardPanMode = false;
          applyZoom();
        }
      });

      window.addEventListener('pointermove', (event) => {
        if (minimapDragState) {
          const rect = minimapBody.getBoundingClientRect();
          const left = Math.max(0, Math.min(rect.width - minimapDragState.viewportWidth, event.clientX - rect.left - minimapDragState.pointerOffsetX));
          const top = Math.max(0, Math.min(rect.height - minimapDragState.viewportHeight, event.clientY - rect.top - minimapDragState.pointerOffsetY));
          centerViewportOnMinimapPoint(left + minimapDragState.viewportWidth / 2, top + minimapDragState.viewportHeight / 2);
        }
        if (panState) {
          cameraX = panState.startCameraX - ((event.clientX - panState.startClientX) / zoom);
          cameraY = panState.startCameraY - ((event.clientY - panState.startClientY) / zoom);
          applyZoom();
          renderMinimap();
          renderContextMenu();
          renderEdgeEditor();
          renderDebugPanel();
        }
        if (connectFromClassId) {
          updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
        }
      });

      window.addEventListener('pointerup', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const bareCanvasRelease = isBareCanvasTarget(target);
        const releaseDistance = bareCanvasPointerDown
          ? Math.hypot(event.clientX - bareCanvasPointerDown.clientX, event.clientY - bareCanvasPointerDown.clientY)
          : Infinity;
        const shouldDefocusBareCanvas = !!bareCanvasPointerDown
          && bareCanvasPointerDown.pointerId === event.pointerId
          && bareCanvasRelease
          && releaseDistance < 6
          && !panState
          && !dragState
          && !connectDragActive;

        if (minimapDragState) {
          minimapDragState = null;
        }
        if (panState) {
          panState = null;
          applyZoom();
        }
        if (connectDragActive) {
          const classTarget = target ? target.closest('.class-node') : null;
          connectDragActive = false;
          if (!classTarget) {
            cancelConnectMode();
          }
          bareCanvasPointerDown = null;
          return;
        }
        if (shouldDefocusBareCanvas) {
          clearCanvasFocus();
        }
        bareCanvasPointerDown = null;
      });

      canvasShell.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const classNode = event.target.closest('.class-node');
        const relationTarget = event.target.closest('[data-relation-id]');
        if (classNode) {
          selectedClassId = classNode.dataset.classId;
          selectedRelationId = undefined;
        } else if (relationTarget) {
          selectedRelationId = relationTarget.dataset.relationId;
          selectedClassId = undefined;
        }
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(event.clientX - rect.left, event.clientY - rect.top);
        const stageX = stagePoint.x;
        const stageY = stagePoint.y;
        const rawCanvasX = stageToWorldX(stageX);
        const rawCanvasY = stageToWorldY(stageY);
        const actionCanvasX = rawCanvasX - 110;
        const actionCanvasY = rawCanvasY - 50;
        openCanvasContextMenu(stageX, stageY, actionCanvasX, actionCanvasY);
      });

      zoomOutButton.addEventListener('click', () => {
        setZoomAroundClientPoint(zoom - 0.1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2));
      });
      zoomResetButton.addEventListener('click', () => {
        setZoomAroundClientPoint(1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2));
      });
      zoomActualButton.addEventListener('click', () => {
        fitActualSize();
      });
      zoomInButton.addEventListener('click', () => {
        setZoomAroundClientPoint(zoom + 0.1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2));
      });
      fitSelectionButton.addEventListener('click', () => {
        const bounds = getSelectionBounds();
        if (bounds) {
          fitBounds(bounds);
        }
      });
      fitDiagramButton.addEventListener('click', () => {
        fitBounds(getDiagramBounds());
      });

      applyButton.addEventListener('click', () => {
        vscode.postMessage({ type: 'applyToDocument', model: state.model });
      });
      copyButton.addEventListener('click', () => {
        vscode.postMessage({ type: 'copyMermaid', model: state.model });
      });
      createFileButton.addEventListener('click', () => {
        vscode.postMessage({ type: 'createFile', model: state.model });
      });
      openLinkedFileButton.addEventListener('click', () => {
        vscode.postMessage({ type: 'openLinkedFile' });
      });
      previewButton.addEventListener('click', () => {
        vscode.postMessage({ type: 'openPreview', model: state.model });
      });
      reimportButton.addEventListener('click', () => {
        vscode.postMessage({ type: 'reimportFromDocument' });
      });

      edgeEditor.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      window.addEventListener('pointerdown', (event) => {
        if (canvasContextMenu && !event.target.closest('#contextMenu')) {
          closeCanvasContextMenu();
        }
        if (selectedRelationId && !event.target.closest('#edgeEditor') && !event.target.closest('[data-relation-id]')) {
          closeEdgeEditor();
        }
      });

      function centerViewportOnMinimapPoint(relativeX, relativeY) {
        const rect = minimapBody.getBoundingClientRect();
        const stageX = (relativeX / Math.max(1, rect.width)) * WORLD_WIDTH;
        const stageY = (relativeY / Math.max(1, rect.height)) * WORLD_HEIGHT;
        debugState.lastMinimap = { relativeX, relativeY, stageX, stageY };
        scrollToKeepStagePointAtViewportAnchor(stageX, stageY, canvasShell.clientWidth / 2, canvasShell.clientHeight / 2);
        requestAnimationFrame(() => {
          scrollToKeepStagePointAtViewportAnchor(stageX, stageY, canvasShell.clientWidth / 2, canvasShell.clientHeight / 2);
          renderDebugPanel();
          renderMinimap();
          renderContextMenu();
          renderEdgeEditor();
        });
      }

      minimap.addEventListener('pointerdown', (event) => {
        const viewport = event.target instanceof Element ? event.target.closest('[data-role="minimap-viewport"]') : null;
        const rect = minimapBody.getBoundingClientRect();
        if (viewport) {
          event.preventDefault();
          const viewportRect = viewport.getBoundingClientRect();
          minimapDragState = {
            pointerOffsetX: event.clientX - viewportRect.left,
            pointerOffsetY: event.clientY - viewportRect.top,
            viewportWidth: viewportRect.width,
            viewportHeight: viewportRect.height
          };
          return;
        }
        centerViewportOnMinimapPoint(event.clientX - rect.left, event.clientY - rect.top);
      });

      contextMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = event.target instanceof HTMLElement ? event.target.getAttribute('data-context-action') : undefined;
        if (!action || !canvasContextMenu) {
          return;
        }
        if (action === 'add-class') {
          contextDeleteArmed = false;
          addClassAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY, 'empty');
        } else if (action === 'add-template-class') {
          contextDeleteArmed = false;
          addClassAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY, selectedTemplateId);
        } else if (action === 'duplicate-class') {
          contextDeleteArmed = false;
          duplicateSelectedClassAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
        } else if (action === 'connect-here') {
          contextDeleteArmed = false;
          addConnectedClassAt(canvasContextMenu.canvasX, canvasContextMenu.canvasY);
        } else if (action === 'delete-selected') {
          if (!contextDeleteArmed) {
            contextDeleteArmed = true;
            renderContextMenu();
            return;
          }
          if (selectedRelationId) {
            deleteRelation(selectedRelationId);
          } else if (selectedClassId) {
            deleteClass(selectedClassId);
          }
        } else if (action === 'cancel-connect') {
          contextDeleteArmed = false;
          cancelConnectMode();
          closeCanvasContextMenu();
        }
      });

      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'setState') {
          state = {
            sourceLabel: message.sourceLabel,
            linkedFileLabel: message.linkedFileLabel || message.sourceLabel,
            linkedFileKind: message.linkedFileKind || 'ephemeral',
            canReimport: !!message.canReimport,
            canOpenLinkedFile: !!message.canOpenLinkedFile,
            canApply: message.canApply !== false,
            issues: Array.isArray(message.issues) ? message.issues : [],
            model: message.model,
            mermaid: message.mermaid
          };
          render();
          if (!viewportInitialized) {
            viewportInitialized = true;
            fitBounds(getDiagramBounds());
          }
        }
      });

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
