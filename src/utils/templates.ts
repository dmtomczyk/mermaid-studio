export interface MermaidTemplate {
  id: string;
  label: string;
  description: string;
  mermaid: string;
}

export const MERMAID_TEMPLATES: MermaidTemplate[] = [
  {
    id: 'flowchart-td',
    label: 'Flowchart (TD)',
    description: 'Top-down flowchart starter',
    mermaid: ['flowchart TD', '    A[Start] --> B[End]'].join('\n')
  },
  {
    id: 'flowchart-lr',
    label: 'Flowchart (LR)',
    description: 'Left-to-right flowchart starter',
    mermaid: ['flowchart LR', '    A[Start] --> B[End]'].join('\n')
  },
  {
    id: 'sequence',
    label: 'Sequence Diagram',
    description: 'Basic sequence diagram',
    mermaid: ['sequenceDiagram', '    participant User', '    participant App', '    User->>App: request', '    App-->>User: response'].join('\n')
  },
  {
    id: 'class',
    label: 'Class Diagram',
    description: 'Basic class diagram',
    mermaid: ['classDiagram', '    class Animal', '    class Dog', '    Animal <|-- Dog'].join('\n')
  },
  {
    id: 'state',
    label: 'State Diagram',
    description: 'Basic state machine',
    mermaid: ['stateDiagram-v2', '    [*] --> Idle', '    Idle --> Running: start', '    Running --> [*]: stop'].join('\n')
  },
  {
    id: 'er',
    label: 'ER Diagram',
    description: 'Basic ER diagram',
    mermaid: ['erDiagram', '    CUSTOMER ||--o{ ORDER : places', '    CUSTOMER {', '        string id', '        string name', '    }', '    ORDER {', '        string id', '        date createdAt', '    }'].join('\n')
  },
  {
    id: 'gantt',
    label: 'Gantt Chart',
    description: 'Basic gantt chart',
    mermaid: ['gantt', '    title Sample Schedule', '    dateFormat  YYYY-MM-DD', '    section Build', '    MVP           :done, a1, 2026-04-01, 2d', '    Testing       :active, a2, 2026-04-03, 2d'].join('\n')
  },
  {
    id: 'mindmap',
    label: 'Mindmap',
    description: 'Basic mindmap',
    mermaid: ['mindmap', '  root((Idea))', '    Scope', '    Risks', '    Tasks'].join('\n')
  },
  {
    id: 'gitgraph',
    label: 'Git Graph',
    description: 'Basic git history',
    mermaid: ['gitGraph', '    commit id:"Initial"', '    branch feature', '    checkout feature', '    commit id:"Feature"', '    checkout main', '    merge feature'].join('\n')
  },
  {
    id: 'architecture',
    label: 'Architecture Diagram',
    description: 'Architecture-style starter (Mermaid v11+)',
    mermaid: ['architecture-beta', '    group api(cloud)[API]', '    service web(internet)[Web App] in api', '    service db(database)[DB] in api', '    web:R --> L:db'].join('\n')
  }
];

export function getTemplateById(id: string): MermaidTemplate | undefined {
  return MERMAID_TEMPLATES.find((template) => template.id === id);
}
