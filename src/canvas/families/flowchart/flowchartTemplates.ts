import { CanvasTemplate } from '../../types/templates';
import { FlowchartNodeShape } from './flowchartTypes';

export interface FlowchartTemplate extends CanvasTemplate {
  defaultLabel: string;
  shape: FlowchartNodeShape;
}

export const FLOWCHART_TEMPLATES: FlowchartTemplate[] = [
  {
    id: 'process',
    label: 'Process',
    description: 'Standard process step.',
    category: 'flowchart',
    defaultLabel: 'Process',
    shape: 'rect'
  },
  {
    id: 'decision',
    label: 'Decision',
    description: 'Branching decision node.',
    category: 'flowchart',
    defaultLabel: 'Decision?',
    shape: 'diam'
  },
  {
    id: 'start',
    label: 'Start / End',
    description: 'Terminal flow step.',
    category: 'flowchart',
    defaultLabel: 'Start',
    shape: 'stadium'
  },
  {
    id: 'data',
    label: 'Data',
    description: 'Data/input-output style step.',
    category: 'flowchart',
    defaultLabel: 'Input / Output',
    shape: 'lean-r'
  },
  {
    id: 'database',
    label: 'Database',
    description: 'Stored data/database step.',
    category: 'flowchart',
    defaultLabel: 'Database',
    shape: 'cyl'
  },
  {
    id: 'text',
    label: 'Note / Text',
    description: 'Text-only note block.',
    category: 'flowchart',
    defaultLabel: 'Note',
    shape: 'text'
  }
];
