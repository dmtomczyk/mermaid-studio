export type MermaidReferenceTopic =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'mindmap'
  | 'gitgraph'
  | 'architecture'
  | 'general';

const TOPIC_TO_FILE: Record<MermaidReferenceTopic, string> = {
  flowchart: 'docs/examples/flowchart.md',
  sequence: 'docs/examples/sequence.md',
  class: 'docs/examples/class.md',
  state: 'docs/examples/state.md',
  er: 'docs/examples/er.md',
  gantt: 'docs/examples/gantt.md',
  mindmap: 'docs/examples/mindmap.md',
  gitgraph: 'docs/examples/gitgraph.md',
  architecture: 'docs/examples/architecture.md',
  general: 'docs/examples/general.md'
};

const TOPIC_TO_REFERENCE_URL: Record<MermaidReferenceTopic, string> = {
  flowchart: 'https://mermaid.js.org/syntax/flowchart.html',
  sequence: 'https://mermaid.js.org/syntax/sequenceDiagram.html',
  gantt: 'https://mermaid.js.org/syntax/gantt.html',
  gitgraph: 'https://mermaid.js.org/syntax/gitgraph.html',
  er: 'https://mermaid.js.org/syntax/entityRelationshipDiagram.html',
  class: 'https://mermaid.js.org/syntax/classDiagram.html',
  state: 'https://mermaid.js.org/syntax/stateDiagram.html',
  architecture: 'https://mermaid.js.org/syntax/architecture.html',
  mindmap: 'https://mermaid.js.org/syntax/mindmap.html',
  general: 'https://mermaid.js.org/intro/'
};

export function getReferenceExampleRelativePath(topic?: string): string {
  const normalized = normalizeReferenceTopic(topic);
  return TOPIC_TO_FILE[normalized];
}

export function getReferenceUrlForTopic(topic?: string): string {
  const normalized = normalizeReferenceTopic(topic);
  return TOPIC_TO_REFERENCE_URL[normalized];
}

export function getReferenceUrlForTitle(title: string): string {
  return getReferenceUrlForTopic(inferReferenceTopic(title));
}

export function getLocalExamplesCommandUriForTitle(title: string): string {
  const topic = inferReferenceTopic(title);
  return `command:mermaidstudio.openReferenceExample?${encodeURIComponent(JSON.stringify([topic]))}`;
}

export function inferReferenceTopic(title: string): MermaidReferenceTopic {
  const flowchartTitles = ['flowchart', 'graph', 'subgraph', 'direction', 'Flowchart rectangle node', 'Flowchart rounded node', 'Flowchart circle node', 'Flowchart diamond node', 'Flowchart database node', 'Flowchart edge label', '-->', '-.->', '==>'];
  if (flowchartTitles.includes(title)) {
    return 'flowchart';
  }
  const sequenceTitles = ['sequenceDiagram', 'participant', 'Sequence participant ID', 'Sequence participant display label', 'Sequence message label', 'note', 'loop', 'alt', 'opt', 'else', 'par', 'and', 'critical', 'break', 'rect', 'activate', 'deactivate', '->>', '-->>'];
  if (sequenceTitles.includes(title)) {
    return 'sequence';
  }
  const ganttTitles = ['gantt', 'dateFormat', 'axisFormat', 'todayMarker', 'section', 'excludes', 'includes', 'title'];
  if (ganttTitles.includes(title)) {
    return 'gantt';
  }
  const gitTitles = ['gitGraph', 'commit', 'branch', 'checkout', 'merge', 'cherry-pick'];
  if (gitTitles.includes(title)) {
    return 'gitgraph';
  }
  const erTitles = ['erDiagram', '||--o{', '}o--||', 'o{--o{', '|o--', '--o|', 'ER relationship'];
  if (erTitles.includes(title)) {
    return 'er';
  }
  const classTitles = ['classDiagram', '<|--', '--|>', 'namespace'];
  if (classTitles.includes(title)) {
    return 'class';
  }
  const stateTitles = ['stateDiagram-v2', 'state', 'choice', 'fork', 'join'];
  if (stateTitles.includes(title)) {
    return 'state';
  }
  const architectureTitles = ['architecture-beta', 'group', 'service'];
  if (architectureTitles.includes(title)) {
    return 'architecture';
  }
  if (title === 'mindmap') {
    return 'mindmap';
  }
  return 'general';
}

function normalizeReferenceTopic(topic?: string): MermaidReferenceTopic {
  const normalized = String(topic || 'general').toLowerCase();
  return (normalized in TOPIC_TO_FILE ? normalized : 'general') as MermaidReferenceTopic;
}
