import { createCanvasShellUiSource } from './core/canvasShellUiSource';
import { createCanvasStateBridgeSource } from './core/canvasStateBridgeSource';
import { createCanvasViewportCoreSource } from './core/canvasViewportSource';
import { createFlowchartWebviewSource } from './families/flowchart/flowchartWebviewSource';

export function createFlowchartCanvasWebviewScript(debugEnabled: boolean): string {
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
        family: 'flowchart',
        familyLabel: 'Flowchart',
        availableFamilies: [
          { id: 'classDiagram', label: 'Class Diagram' },
          { id: 'flowchart', label: 'Flowchart' }
        ],
        shellLabels: {
          templateSelect: 'Node template',
          addTemplateButton: 'Add this node template',
          sidebarTemplateSection: 'Add Node',
          relationSection: 'Edges'
        },
        sourceLabel: 'flowchart canvas',
        linkedFileLabel: 'Untitled canvas',
        linkedFileKind: 'ephemeral',
        canReimport: false,
        canOpenLinkedFile: false,
        canApply: true,
        issues: [],
        model: { family: 'flowchart', direction: 'TB', nodes: [], edges: [] },
        mermaid: ''
      };
      const WORLD_WIDTH = 6000;
      const WORLD_HEIGHT = 4000;
      const WORLD_ORIGIN_X = 1900;
      const WORLD_ORIGIN_Y = 1300;
${createFlowchartWebviewSource()}
${createCanvasShellUiSource()}
${createCanvasStateBridgeSource()}
${createCanvasViewportCoreSource()}
      let viewportInitialized = false;
      let selectedNodeId;
      let selectedEdgeId;
      let connectFromNodeId;
      let connectPreviewPoint = null;
      let connectDragActive = false;
      let selectedTemplateId = 'process';
      let zoom = 1;
      let cameraX = 0;
      let cameraY = 0;
      let dragState = null;
      let panState = null;
      let keyboardPanMode = false;
      let minimapDragState = null;
      let bareCanvasPointerDown = null;
      let lastCanvasPointerClientPoint = null;
      let debugState = { events: [] };

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

      edgeEditor.hidden = true;
      contextMenu.hidden = true;
      contextMenu.innerHTML = '';
      if (templateSectionTitle) {
        templateSectionTitle.textContent = 'Add Node';
      }
      if (relationSectionTitle) {
        relationSectionTitle.textContent = 'Edges';
      }
      addClassButton.textContent = 'Add Node';

      function pushDebugEvent(kind, details) {
        if (!CANVAS_DEBUG) {
          return;
        }
        debugState.events.push({ t: Date.now(), kind, details: details || null });
        if (debugState.events.length > 12) {
          debugState.events.shift();
        }
        postCanvasHostEvent('canvasDebug', { kind, details: details || null, timestamp: Date.now() });
      }

      function renderDebugPanel() {
        if (!CANVAS_DEBUG || !debugPanel) {
          return;
        }
        debugPanel.textContent = debugState.events.map((entry) => new Date(entry.t).toLocaleTimeString() + ' ' + entry.kind).join('\\n');
      }

      function nextId(prefix) {
        return prefix + '-' + Math.random().toString(36).slice(2, 10);
      }

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function getSelectedNode() {
        return state.model.nodes.find((entry) => entry.id === selectedNodeId);
      }

      function getSelectedEdge() {
        return state.model.edges.find((entry) => entry.id === selectedEdgeId);
      }

      function ensureSelection() {
        if (selectedNodeId && !state.model.nodes.some((entry) => entry.id === selectedNodeId)) {
          selectedNodeId = undefined;
        }
        if (selectedEdgeId && !state.model.edges.some((entry) => entry.id === selectedEdgeId)) {
          selectedEdgeId = undefined;
        }
        if (connectFromNodeId && !state.model.nodes.some((entry) => entry.id === connectFromNodeId)) {
          connectFromNodeId = undefined;
          connectPreviewPoint = null;
        }
      }

      function clearCanvasFocus() {
        selectedNodeId = undefined;
        selectedEdgeId = undefined;
        connectFromNodeId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
        render();
      }

      function getNodeById(nodeId) {
        return state.model.nodes.find((entry) => entry.id === nodeId);
      }

      function getTemplateById(templateId) {
        return FLOWCHART_TEMPLATES.find((entry) => entry.id === templateId) || FLOWCHART_TEMPLATES[0];
      }

      function renderShapeLabel(shape) {
        const labels = {
          rect: 'Process',
          rounded: 'Rounded',
          stadium: 'Terminal',
          diam: 'Decision',
          circle: 'Circle',
          'lean-r': 'Data',
          cyl: 'Database',
          text: 'Note'
        };
        return labels[shape] || shape;
      }

      function getNodeBounds(node) {
        return {
          x: node.x,
          y: node.y,
          width: node.width || 180,
          height: node.height || 84
        };
      }

      function getDiagramBounds() {
        if (!state.model.nodes.length) {
          return { x: 0, y: 0, width: 800, height: 600 };
        }
        const bounds = state.model.nodes.map(getNodeBounds);
        return {
          x: Math.min(...bounds.map((entry) => entry.x)) - 80,
          y: Math.min(...bounds.map((entry) => entry.y)) - 80,
          width: Math.max(...bounds.map((entry) => entry.x + entry.width)) - Math.min(...bounds.map((entry) => entry.x)) + 160,
          height: Math.max(...bounds.map((entry) => entry.y + entry.height)) - Math.min(...bounds.map((entry) => entry.y)) + 160
        };
      }

      function getSelectionBounds() {
        if (selectedNodeId) {
          const node = getNodeById(selectedNodeId);
          if (!node) {
            return null;
          }
          const bounds = getNodeBounds(node);
          return { x: bounds.x - 60, y: bounds.y - 60, width: bounds.width + 120, height: bounds.height + 120 };
        }
        if (selectedEdgeId) {
          const edge = getSelectedEdge();
          if (!edge) {
            return null;
          }
          const from = getNodeById(edge.from);
          const to = getNodeById(edge.to);
          if (!from || !to) {
            return null;
          }
          const a = getNodeBounds(from);
          const b = getNodeBounds(to);
          const minX = Math.min(a.x, b.x) - 80;
          const minY = Math.min(a.y, b.y) - 80;
          const maxX = Math.max(a.x + a.width, b.x + b.width) + 80;
          const maxY = Math.max(a.y + a.height, b.y + b.height) + 80;
          return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
        return null;
      }

      function fitBounds(bounds) {
        fitViewportToBounds(bounds);
      }

      function fitActualSize() {
        const bounds = getSelectionBounds() || getDiagramBounds();
        fitViewportActualSize(bounds);
      }

      function isBareCanvasTarget(target) {
        return !!target
          && !target.closest('.class-node')
          && !target.closest('[data-edge-id]')
          && (target === canvasShell || target === canvasStage || target === nodeLayer || target === edgeLayer || target instanceof SVGSVGElement);
      }

      function emitStateChanged() {
        vscode.postMessage({ type: 'stateChanged', model: state.model });
      }

      function getUniqueNodeLabel(baseLabel) {
        const normalized = String(baseLabel || 'Node').trim() || 'Node';
        const existing = new Set(state.model.nodes.map((entry) => entry.label.trim().toLowerCase()));
        if (!existing.has(normalized.toLowerCase())) {
          return normalized;
        }
        let counter = 2;
        while (existing.has((normalized + ' ' + counter).toLowerCase())) {
          counter += 1;
        }
        return normalized + ' ' + counter;
      }

      function addNodeAt(x, y, templateId) {
        const template = getTemplateById(templateId || selectedTemplateId);
        const node = {
          id: nextId('node'),
          label: getUniqueNodeLabel(template.defaultLabel || template.label),
          shape: template.shape || 'rect',
          x: Math.max(-WORLD_ORIGIN_X + 40, Math.round(x)),
          y: Math.max(-WORLD_ORIGIN_Y + 40, Math.round(y)),
          width: 180,
          height: 84
        };
        state.model.nodes.push(node);
        selectedNodeId = node.id;
        selectedEdgeId = undefined;
        connectFromNodeId = undefined;
        connectPreviewPoint = null;
        render();
        emitStateChanged();
      }

      function duplicateNodeAt(nodeId, x, y) {
        const source = getNodeById(nodeId);
        if (!source) {
          addNodeAt(x, y, selectedTemplateId);
          return;
        }
        const node = {
          ...source,
          id: nextId('node'),
          label: getUniqueNodeLabel(source.label),
          x: Math.max(-WORLD_ORIGIN_X + 40, Math.round(x)),
          y: Math.max(-WORLD_ORIGIN_Y + 40, Math.round(y))
        };
        state.model.nodes.push(node);
        selectedNodeId = node.id;
        selectedEdgeId = undefined;
        render();
        emitStateChanged();
      }

      function deleteNode(nodeId) {
        state.model.nodes = state.model.nodes.filter((entry) => entry.id !== nodeId);
        state.model.edges = state.model.edges.filter((entry) => entry.from !== nodeId && entry.to !== nodeId);
        if (selectedNodeId === nodeId) {
          selectedNodeId = undefined;
        }
        if (connectFromNodeId === nodeId) {
          connectFromNodeId = undefined;
          connectPreviewPoint = null;
        }
        selectedEdgeId = undefined;
        render();
        emitStateChanged();
      }

      function deleteEdge(edgeId) {
        state.model.edges = state.model.edges.filter((entry) => entry.id !== edgeId);
        if (selectedEdgeId === edgeId) {
          selectedEdgeId = undefined;
        }
        render();
        emitStateChanged();
      }

      function createEdge(fromId, toId) {
        if (!fromId || !toId || fromId === toId) {
          return;
        }
        state.model.edges.push({ id: nextId('edge'), from: fromId, to: toId, type: '-->', label: '' });
        selectedEdgeId = state.model.edges[state.model.edges.length - 1].id;
        selectedNodeId = undefined;
        connectFromNodeId = undefined;
        connectPreviewPoint = null;
        connectDragActive = false;
        render();
        emitStateChanged();
      }

      function startConnectFrom(nodeId) {
        selectedNodeId = nodeId;
        selectedEdgeId = undefined;
        connectFromNodeId = nodeId;
        const node = getNodeById(nodeId);
        connectPreviewPoint = node ? { x: node.x + (node.width || 180) / 2, y: node.y + (node.height || 84) / 2 } : null;
        render();
      }

      function updateConnectPreviewFromClientPoint(clientX, clientY) {
        if (!connectFromNodeId) {
          return;
        }
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(clientX - rect.left, clientY - rect.top);
        connectPreviewPoint = { x: stageToWorldX(stagePoint.x), y: stageToWorldY(stagePoint.y) };
        renderEdges();
      }

      function completeConnectionGesture(targetNodeId) {
        if (!connectFromNodeId || !targetNodeId || connectFromNodeId === targetNodeId) {
          return false;
        }
        createEdge(connectFromNodeId, targetNodeId);
        return true;
      }

      function shapeNode(card, node) {
        card.style.borderRadius = node.shape === 'rounded' || node.shape === 'stadium' ? '999px' : node.shape === 'circle' ? '50%' : '12px';
        card.style.borderStyle = node.shape === 'diam' || node.shape === 'lean-r' ? 'dashed' : 'solid';
      }

      function renderNodes() {
        nodeLayer.innerHTML = '';
        state.model.nodes.forEach((node) => {
          const card = document.createElement('article');
          card.className = 'class-node' + (node.id === selectedNodeId ? ' selected' : '') + (node.id === connectFromNodeId ? ' connect-source' : '');
          card.dataset.nodeId = node.id;
          card.style.left = worldToStageX(node.x) + 'px';
          card.style.top = worldToStageY(node.y) + 'px';
          card.style.width = (node.width || 180) + 'px';
          shapeNode(card, node);
          card.innerHTML = '<div class="node-header"><div class="node-header-main"><div class="node-title">' + escapeHtml(node.label) + '</div></div><div class="node-header-tools"><span class="meta">' + escapeHtml(renderShapeLabel(node.shape)) + '</span><button type="button" class="node-port' + (connectFromNodeId === node.id ? ' active' : '') + '" data-action="quick-connect"></button></div></div>'
            + '<div class="node-body">' + escapeHtml(node.id) + '</div>'
            + '<div class="node-hint">Drag to move · edit in inspector<div class="node-actions"><button type="button" class="ghost" data-action="connect">Connect</button><button type="button" class="ghost" data-action="duplicate">Duplicate</button><button type="button" class="ghost danger" data-action="delete">Delete</button></div></div>';

          const header = card.querySelector('.node-header');
          const actions = card.querySelector('.node-actions');
          const quickConnectButton = card.querySelector('[data-action="quick-connect"]');

          card.addEventListener('click', (event) => {
            event.stopPropagation();
            if (connectFromNodeId && !connectDragActive && completeConnectionGesture(node.id)) {
              return;
            }
            selectedNodeId = node.id;
            selectedEdgeId = undefined;
            render();
          });

          card.addEventListener('pointerup', (event) => {
            if (connectDragActive) {
              event.stopPropagation();
              completeConnectionGesture(node.id);
            }
          });

          actions?.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target instanceof HTMLElement ? event.target.getAttribute('data-action') : undefined;
            if (action === 'connect') {
              startConnectFrom(node.id);
            } else if (action === 'duplicate') {
              duplicateNodeAt(node.id, node.x + 40, node.y + 120);
            } else if (action === 'delete') {
              deleteNode(node.id);
            }
          });

          quickConnectButton?.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            startConnectFrom(node.id);
            connectDragActive = true;
            updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
          });

          header.addEventListener('pointerdown', (event) => {
            event.stopPropagation();
            selectedNodeId = node.id;
            selectedEdgeId = undefined;
            dragState = { id: node.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: node.x, originY: node.y };
            header.setPointerCapture(event.pointerId);
          });

          header.addEventListener('pointermove', (event) => {
            if (!dragState || dragState.id !== node.id || dragState.pointerId !== event.pointerId) {
              return;
            }
            const deltaX = (event.clientX - dragState.startX) / zoom;
            const deltaY = (event.clientY - dragState.startY) / zoom;
            node.x = Math.max(-WORLD_ORIGIN_X + 40, Math.round(dragState.originX + deltaX));
            node.y = Math.max(-WORLD_ORIGIN_Y + 40, Math.round(dragState.originY + deltaY));
            card.style.left = worldToStageX(node.x) + 'px';
            card.style.top = worldToStageY(node.y) + 'px';
            renderEdges();
          });

          const finishDrag = (event) => {
            if (!dragState || dragState.id !== node.id || dragState.pointerId !== event.pointerId) {
              return;
            }
            if (header.hasPointerCapture && header.hasPointerCapture(event.pointerId)) {
              header.releasePointerCapture(event.pointerId);
            }
            dragState = null;
            render();
            emitStateChanged();
          };
          header.addEventListener('pointerup', finishDrag);
          header.addEventListener('pointercancel', finishDrag);
          nodeLayer.appendChild(card);
        });
      }

      function renderEdges() {
        edgeLayer.innerHTML = '';
        edgeLayer.setAttribute('viewBox', '0 0 ' + WORLD_WIDTH + ' ' + WORLD_HEIGHT);
        state.model.edges.forEach((edge) => {
          const from = getNodeById(edge.from);
          const to = getNodeById(edge.to);
          if (!from || !to) {
            return;
          }
          const startX = worldToStageX(from.x + (from.width || 180) / 2);
          const startY = worldToStageY(from.y + (from.height || 84) / 2);
          const endX = worldToStageX(to.x + (to.width || 180) / 2);
          const endY = worldToStageY(to.y + (to.height || 84) / 2);
          const midX = Math.round((startX + endX) / 2);
          const midY = Math.round((startY + endY) / 2);
          const d = 'M ' + startX + ' ' + startY + ' C ' + midX + ' ' + startY + ', ' + midX + ' ' + endY + ', ' + endX + ' ' + endY;

          const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          hit.setAttribute('class', 'edge-hit');
          hit.setAttribute('d', d);
          hit.dataset.edgeId = edge.id;
          hit.addEventListener('click', (event) => {
            event.stopPropagation();
            selectedEdgeId = edge.id;
            selectedNodeId = undefined;
            render();
          });
          edgeLayer.appendChild(hit);

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('class', 'edge-line' + (edge.id === selectedEdgeId ? ' selected' : '') + (edge.type === '-.->' ? ' connecting' : ''));
          path.setAttribute('d', d);
          edgeLayer.appendChild(path);

          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('class', 'edge-label' + (edge.id === selectedEdgeId ? ' selected' : ''));
          label.setAttribute('x', String(midX));
          label.setAttribute('y', String(midY - 8));
          label.setAttribute('text-anchor', 'middle');
          label.textContent = edge.label || edge.type || '-->';
          edgeLayer.appendChild(label);
        });

        if (connectFromNodeId && connectPreviewPoint) {
          const from = getNodeById(connectFromNodeId);
          if (!from) {
            return;
          }
          const startX = worldToStageX(from.x + (from.width || 180) / 2);
          const startY = worldToStageY(from.y + (from.height || 84) / 2);
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

      function renderLinkedFileInfo() {
        const kindLabel = state.linkedFileKind === 'markdown' ? 'Markdown Mermaid block' : state.linkedFileKind === 'mermaid' ? 'Linked Mermaid file' : 'Ephemeral / not yet linked';
        linkedFileInfo.innerHTML = '<strong>' + escapeHtml(state.linkedFileLabel || 'Untitled canvas') + '</strong><br/>' + escapeHtml(kindLabel);
      }

      function renderTemplatePreview() {
        const template = getTemplateById(selectedTemplateId);
        templatePreview.innerHTML = '<strong>' + escapeHtml(template.label) + '</strong><br/><span class="meta">' + escapeHtml(template.description || '') + '</span><br/><span class="meta">Default label: ' + escapeHtml(template.defaultLabel || template.label) + '</span><br/><span class="meta">Shape: ' + escapeHtml(renderShapeLabel(template.shape)) + '</span>';
      }

      function renderValidation() {
        if (!state.issues.length) {
          validationList.innerHTML = '<div class="inspector-empty">No validation issues.</div>';
          return;
        }
        validationList.innerHTML = state.issues.map((issue) => '<div class="validation-item ' + escapeHtml(issue.level || 'warning') + '"><strong>' + escapeHtml((issue.level || 'warning').toUpperCase()) + '</strong><br/>' + escapeHtml(issue.message || 'Unknown issue') + '</div>').join('');
      }

      function renderMermaidSource() {
        mermaidSource.innerHTML = (state.mermaid || '').split(/\\n/).map((line) => '<span class="code-line-root">' + escapeHtml(line) + '</span>').join('');
      }

      function renderRelations() {
        relationList.innerHTML = '';
        if (!state.model.edges.length) {
          relationList.innerHTML = '<div class="inspector-empty">No edges yet.</div>';
          return;
        }
        state.model.edges.forEach((edge) => {
          const from = getNodeById(edge.from);
          const to = getNodeById(edge.to);
          const row = document.createElement('div');
          row.className = 'relation-row' + (edge.id === selectedEdgeId ? ' selected' : '');
          row.innerHTML = '<div class="relation-summary">' + escapeHtml((from ? from.label : '?') + ' ' + (edge.type || '-->') + ' ' + (to ? to.label : '?') + (edge.label ? ' : ' + edge.label : '')) + '</div><div class="small-actions"><button class="ghost" data-action="select">Edit</button><button class="secondary danger" data-action="delete">Delete</button></div>';
          row.addEventListener('click', () => {
            selectedEdgeId = edge.id;
            selectedNodeId = undefined;
            render();
          });
          row.querySelector('.small-actions')?.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target instanceof HTMLElement ? event.target.getAttribute('data-action') : undefined;
            if (action === 'select') {
              selectedEdgeId = edge.id;
              selectedNodeId = undefined;
              render();
            } else if (action === 'delete') {
              deleteEdge(edge.id);
            }
          });
          relationList.appendChild(row);
        });
      }

      function populateNodeOptions(select, selectedId) {
        select.innerHTML = '';
        state.model.nodes.forEach((node) => {
          const option = document.createElement('option');
          option.value = node.id;
          option.textContent = node.label;
          option.selected = node.id === selectedId;
          select.appendChild(option);
        });
      }

      function renderInspector() {
        const selectedNode = getSelectedNode();
        const selectedEdge = getSelectedEdge();
        if (selectedEdge) {
          inspectorTitle.textContent = 'Selected edge';
          inspectorBody.innerHTML = '<label>From<select id="edgeFromSelect"></select></label><label>Edge type<select id="edgeTypeInput"></select></label><label>To<select id="edgeToSelect"></select></label><label>Label<input id="edgeLabelInput" type="text" placeholder="yes" /></label><div class="small-actions"><button id="deleteEdgeButton" class="secondary danger">Delete edge</button></div>';
          const fromSelect = document.getElementById('edgeFromSelect');
          const toSelect = document.getElementById('edgeToSelect');
          const typeSelect = document.getElementById('edgeTypeInput');
          populateNodeOptions(fromSelect, selectedEdge.from);
          populateNodeOptions(toSelect, selectedEdge.to);
          typeSelect.innerHTML = ['-->', '---', '-.->', '==>'].map((type) => '<option value="' + type + '"' + (selectedEdge.type === type ? ' selected' : '') + '>' + type + '</option>').join('');
          document.getElementById('edgeLabelInput').value = selectedEdge.label || '';
          fromSelect.addEventListener('change', () => { selectedEdge.from = fromSelect.value; emitStateChanged(); render(); });
          toSelect.addEventListener('change', () => { selectedEdge.to = toSelect.value; emitStateChanged(); render(); });
          typeSelect.addEventListener('change', () => { selectedEdge.type = typeSelect.value; emitStateChanged(); render(); });
          document.getElementById('edgeLabelInput').addEventListener('input', (event) => { selectedEdge.label = event.target.value.trim() || undefined; emitStateChanged(); renderEdges(); renderRelations(); renderMermaidSource(); });
          document.getElementById('deleteEdgeButton').addEventListener('click', () => deleteEdge(selectedEdge.id));
          return;
        }
        if (selectedNode) {
          inspectorTitle.textContent = 'Selected node';
          inspectorBody.innerHTML = '<label>Label<input id="nodeLabelInput" type="text" placeholder="Process" /></label><label>Shape<select id="nodeShapeInput"></select></label><div class="small-actions"><button id="connectNodeButton" class="ghost">Connect from here</button><button id="duplicateNodeButton" class="ghost">Duplicate</button><button id="deleteNodeButton" class="secondary danger">Delete node</button></div>';
          document.getElementById('nodeLabelInput').value = selectedNode.label;
          const shapeSelect = document.getElementById('nodeShapeInput');
          shapeSelect.innerHTML = FLOWCHART_SHAPES.map((shape) => '<option value="' + shape + '"' + (selectedNode.shape === shape ? ' selected' : '') + '>' + escapeHtml(renderShapeLabel(shape)) + '</option>').join('');
          document.getElementById('nodeLabelInput').addEventListener('input', (event) => { selectedNode.label = event.target.value || 'Node'; emitStateChanged(); render(); });
          shapeSelect.addEventListener('change', () => { selectedNode.shape = shapeSelect.value; emitStateChanged(); render(); });
          document.getElementById('connectNodeButton').addEventListener('click', () => startConnectFrom(selectedNode.id));
          document.getElementById('duplicateNodeButton').addEventListener('click', () => duplicateNodeAt(selectedNode.id, selectedNode.x + 40, selectedNode.y + 120));
          document.getElementById('deleteNodeButton').addEventListener('click', () => deleteNode(selectedNode.id));
          return;
        }
        inspectorTitle.textContent = 'Flowchart';
        inspectorBody.innerHTML = '<label>Direction<select id="diagramDirectionInput"></select></label><div class="inspector-empty">Select a node or edge on the canvas to edit it.</div>';
        const directionSelect = document.getElementById('diagramDirectionInput');
        directionSelect.innerHTML = ['TB', 'TD', 'BT', 'LR', 'RL'].map((dir) => '<option value="' + dir + '"' + (state.model.direction === dir ? ' selected' : '') + '>' + dir + '</option>').join('');
        directionSelect.addEventListener('change', () => { state.model.direction = directionSelect.value; emitStateChanged(); renderMermaidSource(); });
      }

      function renderToolbarStatus() {
        if (connectFromNodeId) {
          const source = getNodeById(connectFromNodeId);
          toolbarStatus.textContent = source ? 'Connecting from ' + source.label + '. Release on another node to create an edge.' : 'Connecting nodes.';
          return;
        }
        if (selectedEdgeId) {
          toolbarStatus.textContent = 'Edge selected. Edit it in the inspector.';
          return;
        }
        if (selectedNodeId) {
          const node = getNodeById(selectedNodeId);
          toolbarStatus.textContent = node ? 'Selected ' + node.label + '. Drag to move, or edit in the inspector.' : 'Node selected.';
          return;
        }
        toolbarStatus.textContent = 'Drag nodes. Double-click bare canvas to add the selected node template. Drag from ports to connect.';
      }

      function renderMinimap() {
        minimapBody.innerHTML = '';
        const rect = minimapBody.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          requestAnimationFrame(() => requestAnimationFrame(() => renderMinimap()));
          return;
        }
        const scaleX = rect.width / WORLD_WIDTH;
        const scaleY = rect.height / WORLD_HEIGHT;
        state.model.nodes.forEach((node) => {
          const item = document.createElement('div');
          item.className = 'minimap-node' + (node.id === selectedNodeId ? ' selected' : '');
          item.style.left = Math.max(0, worldToStageX(node.x) * scaleX) + 'px';
          item.style.top = Math.max(0, worldToStageY(node.y) * scaleY) + 'px';
          item.style.width = Math.max(8, (node.width || 180) * scaleX) + 'px';
          item.style.height = Math.max(6, (node.height || 84) * scaleY) + 'px';
          minimapBody.appendChild(item);
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

      function initializeViewportIfNeeded() {
        if (viewportInitialized || !state.model.nodes.length) {
          return;
        }
        const shellRect = canvasShell.getBoundingClientRect();
        if (!shellRect.width || !shellRect.height) {
          requestAnimationFrame(() => requestAnimationFrame(() => initializeViewportIfNeeded()));
          return;
        }
        viewportInitialized = true;
        fitBounds(getDiagramBounds());
      }

      function centerViewportOnMinimapPoint(relativeX, relativeY) {
        const rect = minimapBody.getBoundingClientRect();
        const stageX = (relativeX / Math.max(1, rect.width)) * WORLD_WIDTH;
        const stageY = (relativeY / Math.max(1, rect.height)) * WORLD_HEIGHT;
        scrollToKeepStagePointAtViewportAnchor(stageX, stageY, canvasShell.clientWidth / 2, canvasShell.clientHeight / 2);
        renderMinimap();
      }

      function render() {
        renderCanvasShellChrome({
          family: 'flowchart',
          sourceLabel: 'flowchart canvas',
          templateSectionTitle: 'Add Node',
          relationSectionTitle: 'Edges',
          addTemplateButton: 'Add Node'
        });
        reimportButton.disabled = !state.canReimport;
        openLinkedFileButton.disabled = !state.canOpenLinkedFile;
        classTemplateSelect.value = selectedTemplateId;
        ensureSelection();
        applyZoom();
        renderNodes();
        renderEdges();
        renderInspector();
        renderLinkedFileInfo();
        renderTemplatePreview();
        renderRelations();
        renderValidation();
        renderMermaidSource();
        renderToolbarStatus();
        renderMinimap();
        renderDebugPanel();
        vscode.setState({ state, selectedNodeId, selectedEdgeId, connectFromNodeId, connectPreviewPoint, selectedTemplateId, zoom });
      }

      const persisted = vscode.getState();
      if (persisted && persisted.state) {
        state = persisted.state;
        selectedNodeId = persisted.selectedNodeId;
        selectedEdgeId = persisted.selectedEdgeId;
        connectFromNodeId = persisted.connectFromNodeId;
        connectPreviewPoint = persisted.connectPreviewPoint || null;
        selectedTemplateId = persisted.selectedTemplateId || 'process';
        zoom = persisted.zoom || 1;
        render();
      }

      classTemplateSelect.innerHTML = FLOWCHART_TEMPLATES.map((template) => '<option value="' + template.id + '">' + escapeHtml(template.label) + '</option>').join('');
      classTemplateSelect.addEventListener('change', () => {
        selectedTemplateId = classTemplateSelect.value || 'process';
        renderTemplatePreview();
      });
      function hasCanvasContentForFamilySwitch() {
        return Array.isArray(state.model?.nodes) ? state.model.nodes.length || state.model.edges.length : false;
      }
      bindCanvasFamilySwitcher('flowchart');
      addClassButton.addEventListener('click', () => {
        addNodeAt(160 + state.model.nodes.length * 28, 120 + state.model.nodes.length * 18, selectedTemplateId);
      });
      addTemplateFromSidebarButton.addEventListener('click', () => {
        const centerStageX = cameraX + (canvasShell.clientWidth / zoom / 2);
        const centerStageY = cameraY + (canvasShell.clientHeight / zoom / 2);
        addNodeAt(stageToWorldX(centerStageX) - 90, stageToWorldY(centerStageY) - 42, selectedTemplateId);
      });
      canvasShell.addEventListener('dblclick', (event) => {
        if (!isBareCanvasTarget(event.target instanceof Element ? event.target : null)) {
          return;
        }
        const rect = canvasShell.getBoundingClientRect();
        const stagePoint = viewportPointToStagePoint(event.clientX - rect.left, event.clientY - rect.top);
        addNodeAt(stageToWorldX(stagePoint.x) - 90, stageToWorldY(stagePoint.y) - 42, selectedTemplateId);
      });
      canvasShell.addEventListener('pointerdown', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!isBareCanvasTarget(target) || event.button !== 0) {
          bareCanvasPointerDown = null;
          return;
        }
        bareCanvasPointerDown = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY };
      });
      canvasShell.addEventListener('mousemove', (event) => {
        lastCanvasPointerClientPoint = { x: event.clientX, y: event.clientY };
        updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
      });
      canvasShell.addEventListener('mousedown', (event) => {
        const wantsPan = event.button === 1 || (keyboardPanMode && event.button === 0 && !event.target.closest('.class-node'));
        if (!wantsPan) {
          return;
        }
        event.preventDefault();
        panState = { startClientX: event.clientX, startClientY: event.clientY, startCameraX: cameraX, startCameraY: cameraY };
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
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        setZoomAroundViewportPoint(zoom + delta, anchorX, anchorY);
      }, { passive: false });
      window.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && !keyboardPanMode && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLSelectElement)) {
          event.preventDefault();
          keyboardPanMode = true;
          canvasShell.classList.add('panning');
        }
        if (event.key === 'Escape' && connectFromNodeId) {
          event.preventDefault();
          connectFromNodeId = undefined;
          connectPreviewPoint = null;
          connectDragActive = false;
          render();
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
        }
        if (connectFromNodeId) {
          updateConnectPreviewFromClientPoint(event.clientX, event.clientY);
        }
      });
      window.addEventListener('pointerup', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (minimapDragState) {
          minimapDragState = null;
        }
        if (panState) {
          panState = null;
          applyZoom();
        }
        if (connectDragActive) {
          const nodeTarget = target ? target.closest('.class-node') : null;
          connectDragActive = false;
          if (!nodeTarget) {
            connectFromNodeId = undefined;
            connectPreviewPoint = null;
            render();
          }
          bareCanvasPointerDown = null;
          return;
        }
        const releaseDistance = bareCanvasPointerDown ? Math.hypot(event.clientX - bareCanvasPointerDown.clientX, event.clientY - bareCanvasPointerDown.clientY) : Infinity;
        if (bareCanvasPointerDown && bareCanvasPointerDown.pointerId === event.pointerId && isBareCanvasTarget(target) && releaseDistance < 6 && !panState && !dragState) {
          clearCanvasFocus();
        }
        bareCanvasPointerDown = null;
      });
      zoomOutButton.addEventListener('click', () => setZoomAroundClientPoint(zoom - 0.1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2)));
      zoomResetButton.addEventListener('click', () => setZoomAroundClientPoint(1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2)));
      zoomActualButton.addEventListener('click', () => fitActualSize());
      zoomInButton.addEventListener('click', () => setZoomAroundClientPoint(zoom + 0.1, canvasShell.getBoundingClientRect().left + (canvasShell.clientWidth / 2), canvasShell.getBoundingClientRect().top + (canvasShell.clientHeight / 2)));
      fitSelectionButton.addEventListener('click', () => { const bounds = getSelectionBounds(); if (bounds) { fitBounds(bounds); } });
      fitDiagramButton.addEventListener('click', () => fitBounds(getDiagramBounds()));
      applyButton.addEventListener('click', () => vscode.postMessage({ type: 'applyToDocument', model: state.model }));
      copyButton.addEventListener('click', () => vscode.postMessage({ type: 'copyMermaid', model: state.model }));
      createFileButton.addEventListener('click', () => vscode.postMessage({ type: 'createFile', model: state.model }));
      openLinkedFileButton.addEventListener('click', () => vscode.postMessage({ type: 'openLinkedFile' }));
      previewButton.addEventListener('click', () => vscode.postMessage({ type: 'openPreview', model: state.model }));
      reimportButton.addEventListener('click', () => vscode.postMessage({ type: 'reimportFromDocument' }));
      minimap.addEventListener('pointerdown', (event) => {
        const viewport = event.target instanceof Element ? event.target.closest('[data-role="minimap-viewport"]') : null;
        const rect = minimapBody.getBoundingClientRect();
        if (viewport) {
          event.preventDefault();
          const viewportRect = viewport.getBoundingClientRect();
          minimapDragState = { pointerOffsetX: event.clientX - viewportRect.left, pointerOffsetY: event.clientY - viewportRect.top, viewportWidth: viewportRect.width, viewportHeight: viewportRect.height };
          return;
        }
        centerViewportOnMinimapPoint(event.clientX - rect.left, event.clientY - rect.top);
      });
      window.addEventListener('resize', () => {
        renderMinimap();
        if (!viewportInitialized) {
          initializeViewportIfNeeded();
        }
      });
      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'setState') {
          pushDebugEvent('message:setState', { nodeCount: Array.isArray(message.model?.nodes) ? message.model.nodes.length : -1, edgeCount: Array.isArray(message.model?.edges) ? message.model.edges.length : -1 });
          state = mergeCanvasShellState(message, {
            family: 'flowchart',
            familyLabel: 'Flowchart'
          });
          render();
          initializeViewportIfNeeded();
        }
      });
      vscode.postMessage({ type: 'requestState' });
`;
}
