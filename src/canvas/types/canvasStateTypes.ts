export interface CanvasSelectionState {
  selectedNodeId?: string;
  selectedEdgeId?: string;
}

export interface CanvasConnectionState {
  connectFromNodeId?: string;
  previewPoint?: { x: number; y: number } | null;
  dragActive: boolean;
}

export interface CanvasViewportState {
  zoom: number;
  cameraX: number;
  cameraY: number;
}
