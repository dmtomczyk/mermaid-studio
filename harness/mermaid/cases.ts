export interface MermaidHarnessCase {
  id: string;
  family: string;
  origin: 'snippet' | 'example';
  title: string;
  source: string;
}

export const MERMAID_HARNESS_CASES: MermaidHarnessCase[] = [
  {
    id: 'snippet-flowchart-starter',
    family: 'flowchart',
    origin: 'snippet',
    title: 'Flowchart starter snippet',
    source: `flowchart TD\n    A[Start] --> B[End]`
  },
  {
    id: 'example-flowchart-main',
    family: 'flowchart',
    origin: 'example',
    title: 'Flowchart example',
    source: `flowchart LR\n    A[Start] --> B{Valid?}\n    B -->|yes| C([Process])\n    B -.->|no| D[(Database)]\n    subgraph Services\n        C --> D\n    end`
  },
  {
    id: 'snippet-sequence-starter',
    family: 'sequence',
    origin: 'snippet',
    title: 'Sequence starter snippet',
    source: `sequenceDiagram\n    participant User\n    participant App\n    User->>App: request\n    App-->>User: response`
  },
  {
    id: 'example-sequence-block',
    family: 'sequence',
    origin: 'example',
    title: 'Sequence block example',
    source: `sequenceDiagram\n    participant Client\n    participant Service\n    alt success\n        Client->>Service: fetch\n        Service-->>Client: ok\n    else failure\n        Service-->>Client: error\n    end`
  },
  {
    id: 'snippet-class-starter',
    family: 'class',
    origin: 'snippet',
    title: 'Class starter snippet',
    source: `classDiagram\n    class Animal\n    class Dog\n    Animal <|-- Dog`
  },
  {
    id: 'example-state-choice',
    family: 'state',
    origin: 'example',
    title: 'State choice example',
    source: `stateDiagram-v2\n    [*] --> choice\n    state choice <<choice>>\n    choice --> Approved: yes\n    choice --> Rejected: no`
  },
  {
    id: 'example-er-main',
    family: 'er',
    origin: 'example',
    title: 'ER example',
    source: `erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    CUSTOMER {\n        string id\n        string name\n    }\n    ORDER {\n        string id\n        date createdAt\n    }`
  },
  {
    id: 'snippet-gantt-starter',
    family: 'gantt',
    origin: 'snippet',
    title: 'Gantt starter snippet',
    source: `gantt\n    title Project\n    dateFormat YYYY-MM-DD\n    section Build\n    MVP :active, t1, 2026-04-03, 3d`
  },
  {
    id: 'snippet-mindmap-starter',
    family: 'mindmap',
    origin: 'snippet',
    title: 'Mindmap starter snippet',
    source: `mindmap\n  root((Topic))\n    Branch`
  },
  {
    id: 'snippet-gitgraph-starter',
    family: 'gitgraph',
    origin: 'snippet',
    title: 'GitGraph starter snippet',
    source: `gitGraph\n    commit id:"Init"`
  },
  {
    id: 'snippet-architecture-starter',
    family: 'architecture',
    origin: 'snippet',
    title: 'Architecture starter snippet',
    source: `architecture-beta\n    group app(cloud)[Application]\n    service api(server)[API] in app`
  },
  {
    id: 'example-architecture-main',
    family: 'architecture',
    origin: 'example',
    title: 'Architecture example',
    source: `architecture-beta\n    group app(cloud)[Application]\n    service api(server)[API] in app\n    service db(database)[Database] in app\n    api:R --> L:db`
  }
];
