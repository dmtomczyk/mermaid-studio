import { MermaidDiagramFamilyId } from './diagramRegistry';

export interface MermaidSnippetTopic {
  id: string;
  label: string;
  description: string;
  body: string;
  diagramTypes?: MermaidDiagramFamilyId[];
  alwaysShow?: boolean;
  kind: 'starter' | 'micro';
  slashAliases?: string[];
}

export interface MermaidSlashSnippetChoice {
  alias: string;
  topic: MermaidSnippetTopic;
  favorite?: boolean;
  recent?: boolean;
}

export const MERMAID_SNIPPET_TOPICS: MermaidSnippetTopic[] = [
  { id: 'starter-flowchart-lr', label: 'Flowchart LR', description: 'Flowchart starter', body: 'flowchart LR\n    A[Start] --> B[End]', alwaysShow: true, kind: 'starter', slashAliases: ['flow-lr', 'lr'] },
  { id: 'starter-flowchart-td', label: 'Flowchart TD', description: 'Flowchart starter', body: 'flowchart TD\n    A[Start] --> B[End]', alwaysShow: true, kind: 'starter', slashAliases: ['flow', 'flow-td', 'td'] },
  { id: 'starter-sequence', label: 'Sequence Diagram', description: 'Sequence starter', body: 'sequenceDiagram\n    participant User\n    participant App\n    User->>App: request\n    App-->>User: response', alwaysShow: true, kind: 'starter', slashAliases: ['sequence'] },
  { id: 'starter-class', label: 'Class Diagram', description: 'Class starter', body: 'classDiagram\n    class Animal\n    class Dog\n    Animal <|-- Dog', alwaysShow: true, kind: 'starter', slashAliases: ['class'] },
  { id: 'starter-state', label: 'State Diagram', description: 'State starter', body: 'stateDiagram-v2\n    [*] --> Idle\n    Idle --> Running: start\n    Running --> [*]: stop', alwaysShow: true, kind: 'starter', slashAliases: ['state'] },
  { id: 'starter-er', label: 'ER Diagram', description: 'ER starter', body: 'erDiagram\n    CUSTOMER ||--o{ ORDER : places', alwaysShow: true, kind: 'starter', slashAliases: ['er'] },
  { id: 'starter-gantt', label: 'Gantt', description: 'Gantt starter', body: 'gantt\n    title Project\n    dateFormat YYYY-MM-DD\n    section Build\n    MVP :active, t1, 2026-04-03, 3d', alwaysShow: true, kind: 'starter', slashAliases: ['gantt'] },
  { id: 'starter-mindmap', label: 'Mindmap', description: 'Mindmap starter', body: 'mindmap\n  root((Topic))\n    Branch', alwaysShow: true, kind: 'starter', slashAliases: ['mindmap'] },
  { id: 'starter-gitgraph', label: 'Git Graph', description: 'Git history starter', body: 'gitGraph\n    commit id:"Init"', alwaysShow: true, kind: 'starter', slashAliases: ['git', 'gitgraph'] },
  { id: 'starter-architecture', label: 'Architecture', description: 'Architecture diagram starter', body: 'architecture-beta\n    group app(cloud)[Application]\n    service api(server)[API] in app', alwaysShow: true, kind: 'starter', slashAliases: ['arch', 'architecture'] },

  { id: 'micro-node-rectangle', label: 'Node: rectangle', description: 'A[Label]', body: 'A[Label]', diagramTypes: ['flowchart', 'graph'], kind: 'micro', slashAliases: ['node', 'rect'] },
  { id: 'micro-node-circle', label: 'Node: circle', description: 'A((Circle))', body: 'A((Circle))', diagramTypes: ['flowchart', 'graph'], kind: 'micro', slashAliases: ['circle'] },
  { id: 'micro-edge-solid', label: 'Edge: solid', description: 'A --> B', body: 'A --> B', diagramTypes: ['flowchart', 'graph'], kind: 'micro', slashAliases: ['edge'] },
  { id: 'micro-edge-labeled-solid', label: 'Edge: labeled solid', description: 'A -->|text| B', body: 'A -->|text| B', diagramTypes: ['flowchart', 'graph'], kind: 'micro', slashAliases: ['edge-label'] },
  { id: 'micro-subgraph', label: 'Subgraph', description: 'subgraph ... end', body: 'subgraph Group\n    A --> B\nend', diagramTypes: ['flowchart', 'graph'], kind: 'micro', slashAliases: ['subgraph'] },

  { id: 'micro-sequence-participant', label: 'Sequence participant', description: 'participant User', body: 'participant User', diagramTypes: ['sequenceDiagram'], kind: 'micro', slashAliases: ['participant'] },
  { id: 'micro-sequence-message', label: 'Sequence message', description: 'User->>App: login', body: 'User->>App: login', diagramTypes: ['sequenceDiagram'], kind: 'micro', slashAliases: ['message'] },
  { id: 'micro-sequence-alt', label: 'Sequence alt block', description: 'alt ... else ... end', body: 'alt success\n    API-->>User: ok\nelse failure\n    API-->>User: error\nend', diagramTypes: ['sequenceDiagram'], kind: 'micro', slashAliases: ['alt'] },

  { id: 'micro-class-inheritance', label: 'Class inheritance', description: 'Animal <|-- Dog', body: 'Animal <|-- Dog', diagramTypes: ['classDiagram'], kind: 'micro', slashAliases: ['inheritance'] },
  { id: 'micro-class-namespace', label: 'Class namespace', description: 'namespace ...', body: 'namespace Core {\n    class Service\n}', diagramTypes: ['classDiagram'], kind: 'micro', slashAliases: ['namespace'] },

  { id: 'micro-state-transition', label: 'State transition', description: 'Idle --> Running: start', body: 'Idle --> Running: start', diagramTypes: ['stateDiagram-v2'], kind: 'micro', slashAliases: ['transition'] },
  { id: 'micro-state-choice', label: 'State choice', description: 'state choice <<choice>>', body: 'state choice <<choice>>', diagramTypes: ['stateDiagram-v2'], kind: 'micro', slashAliases: ['choice'] },

  { id: 'micro-er-relationship', label: 'ER relationship', description: 'CUSTOMER ||--o{ ORDER : places', body: 'CUSTOMER ||--o{ ORDER : places', diagramTypes: ['erDiagram'], kind: 'micro', slashAliases: ['relationship'] },

  { id: 'micro-gantt-title', label: 'Gantt title', description: 'title Project Plan', body: 'title Project Plan', diagramTypes: ['gantt'], kind: 'micro', slashAliases: ['title'] },
  { id: 'micro-gantt-date-format', label: 'Gantt dateFormat', description: 'dateFormat YYYY-MM-DD', body: 'dateFormat YYYY-MM-DD', diagramTypes: ['gantt'], kind: 'micro', slashAliases: ['date'] },
  { id: 'micro-gantt-section', label: 'Gantt section', description: 'section Build', body: 'section Build', diagramTypes: ['gantt'], kind: 'micro', slashAliases: ['section'] },
  { id: 'micro-gantt-task', label: 'Gantt task row', description: 'Task :active, id, date, duration', body: 'Task :active, t1, 2026-04-03, 3d', diagramTypes: ['gantt'], kind: 'micro', slashAliases: ['task'] },
  { id: 'micro-gantt-excludes', label: 'Gantt excludes', description: 'excludes weekends', body: 'excludes weekends', diagramTypes: ['gantt'], kind: 'micro', slashAliases: ['excludes'] },

  { id: 'micro-gitgraph-commit', label: 'gitGraph commit', description: 'commit id:"Init"', body: 'commit id:"Init"', diagramTypes: ['gitGraph'], kind: 'micro', slashAliases: ['commit'] },
  { id: 'micro-gitgraph-branch', label: 'gitGraph branch', description: 'branch feature', body: 'branch feature', diagramTypes: ['gitGraph'], kind: 'micro', slashAliases: ['branch'] },
  { id: 'micro-gitgraph-checkout', label: 'gitGraph checkout', description: 'checkout feature', body: 'checkout feature', diagramTypes: ['gitGraph'], kind: 'micro', slashAliases: ['checkout'] },
  { id: 'micro-gitgraph-merge', label: 'gitGraph merge', description: 'merge feature', body: 'merge feature', diagramTypes: ['gitGraph'], kind: 'micro', slashAliases: ['merge'] },

  { id: 'micro-architecture-group', label: 'Architecture group', description: 'group app(cloud)[Application]', body: 'group app(cloud)[Application]', diagramTypes: ['architecture-beta'], kind: 'micro', slashAliases: ['group'] },
  { id: 'micro-architecture-service', label: 'Architecture service', description: 'service api(server)[API] in app', body: 'service api(server)[API] in app', diagramTypes: ['architecture-beta'], kind: 'micro', slashAliases: ['service'] }
];

export function getAvailableSnippetTopics(diagramType?: MermaidDiagramFamilyId): MermaidSnippetTopic[] {
  return MERMAID_SNIPPET_TOPICS.filter(
    (snippet) => snippet.alwaysShow || !snippet.diagramTypes || (diagramType && snippet.diagramTypes.includes(diagramType))
  );
}

export function getSnippetTopicById(snippetId: string): MermaidSnippetTopic | undefined {
  return MERMAID_SNIPPET_TOPICS.find((topic) => topic.id === snippetId);
}

export function getAvailableSlashSnippetChoices(
  diagramType?: MermaidDiagramFamilyId,
  query = '',
  options?: { favorites?: string[]; recent?: string[] }
): MermaidSlashSnippetChoice[] {
  const normalizedQuery = query.trim().toLowerCase();
  const favoriteSet = new Set(options?.favorites || []);
  const recentSet = new Set(options?.recent || []);
  const choices = getAvailableSnippetTopics(diagramType)
    .flatMap((topic) => (topic.slashAliases || []).map((alias) => ({
      alias,
      topic,
      favorite: favoriteSet.has(topic.id),
      recent: recentSet.has(topic.id)
    })));

  return choices
    .filter(({ alias, topic }) => {
      if (!normalizedQuery) {
        return true;
      }
      return alias.includes(normalizedQuery)
        || topic.label.toLowerCase().includes(normalizedQuery)
        || topic.description.toLowerCase().includes(normalizedQuery);
    })
    .sort((left, right) => compareSlashSnippetChoices(left, right, normalizedQuery));
}

function compareSlashSnippetChoices(left: MermaidSlashSnippetChoice, right: MermaidSlashSnippetChoice, query: string): number {
  const scoreLeft = rankSlashSnippetChoice(left, query);
  const scoreRight = rankSlashSnippetChoice(right, query);
  if (scoreLeft !== scoreRight) {
    return scoreLeft - scoreRight;
  }

  if (left.favorite !== right.favorite) {
    return left.favorite ? -1 : 1;
  }

  if (left.recent !== right.recent) {
    return left.recent ? -1 : 1;
  }

  if (left.topic.kind !== right.topic.kind) {
    return left.topic.kind === 'starter' ? -1 : 1;
  }

  return left.alias.localeCompare(right.alias);
}

function rankSlashSnippetChoice(choice: MermaidSlashSnippetChoice, query: string): number {
  if (!query) {
    return choice.topic.kind === 'starter' ? 0 : 10;
  }
  if (choice.alias === query) {
    return 0;
  }
  if (choice.alias.startsWith(query)) {
    return 1;
  }
  if (choice.topic.label.toLowerCase().startsWith(query)) {
    return 2;
  }
  if (choice.alias.includes(query)) {
    return 3;
  }
  return 4;
}
