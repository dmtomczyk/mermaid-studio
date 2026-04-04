export interface BuilderViewportPreset {
  id: string;
  width: number;
  height: number;
}

export const BUILDER_VIEWPORT_PRESETS: BuilderViewportPreset[] = [
  { id: 'comfortable-540', width: 540, height: 1200 },
  { id: 'narrow-420', width: 420, height: 1200 },
  { id: 'must-work-360', width: 360, height: 1200 },
  { id: 'stress-320', width: 320, height: 1200 }
];
