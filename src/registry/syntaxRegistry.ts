import * as vscode from 'vscode';
import { MermaidDiagramFamilyId } from './diagramRegistry';
import { MermaidReferenceTopic, getReferenceUrlForTopic } from './exampleRegistry';

export interface MermaidRootSyntaxTopic {
  keyword: MermaidDiagramFamilyId;
  detail: string;
  documentation: string;
  example?: string;
  insertText: string;
  referenceTopic: MermaidReferenceTopic;
}

export interface MermaidKeywordHelpTopic {
  title: string;
  body: string;
  example?: string;
  link?: string;
}

export interface MermaidSharedSyntaxTopic {
  label: string;
  detail: string;
  documentation: string;
  example?: string;
  insertText?: string;
  kind?: vscode.CompletionItemKind;
  diagramTypes?: MermaidDiagramFamilyId[];
  referenceTopic: MermaidReferenceTopic;
  hoverTitle?: string;
}

export const ROOT_SYNTAX_TOPICS: MermaidRootSyntaxTopic[] = [
  {
    keyword: 'flowchart',
    detail: 'Mermaid flowchart starter',
    documentation: 'Create a flowchart. Typical first line: `flowchart TD` or `flowchart LR`.',
    example: 'flowchart LR',
    insertText: 'flowchart ${1|TD,LR,RL,BT|}',
    referenceTopic: 'flowchart'
  },
  {
    keyword: 'sequenceDiagram',
    detail: 'Mermaid sequence diagram starter',
    documentation: 'Create a sequence diagram with `participant` lines and message arrows.',
    example: ['sequenceDiagram', '    participant User', '    User->>API: request'].join('\n'),
    insertText: 'sequenceDiagram\n    participant ${1:User}\n    participant ${2:API}\n    ${1:User}->>${2:API}: ${3:request}',
    referenceTopic: 'sequence'
  },
  {
    keyword: 'classDiagram',
    detail: 'Mermaid class diagram starter',
    documentation: 'Create a class diagram.',
    insertText: 'classDiagram\n    ${1:Animal} <|-- ${2:Dog}',
    referenceTopic: 'class'
  },
  {
    keyword: 'stateDiagram-v2',
    detail: 'Mermaid state diagram starter',
    documentation: 'Create a state diagram using Mermaid v2 syntax.',
    insertText: 'stateDiagram-v2\n    [*] --> ${1:Idle}',
    referenceTopic: 'state'
  },
  {
    keyword: 'erDiagram',
    detail: 'Mermaid ER diagram starter',
    documentation: 'Create an entity-relationship diagram.',
    insertText: 'erDiagram\n    ${1:CUSTOMER} ||--o{ ${2:ORDER} : ${3:places}',
    referenceTopic: 'er'
  },
  {
    keyword: 'gantt',
    detail: 'Mermaid gantt starter',
    documentation: 'Create a gantt chart.',
    example: ['gantt', '    title Project Plan', '    dateFormat YYYY-MM-DD'].join('\n'),
    insertText: 'gantt\n    title ${1:Project Plan}\n    dateFormat ${2:YYYY-MM-DD}\n    section ${3:Build}\n    ${4:Task} :${5:active}, ${6:t1}, ${7:2026-04-03}, ${8:3d}',
    referenceTopic: 'gantt'
  },
  {
    keyword: 'mindmap',
    detail: 'Mermaid mindmap starter',
    documentation: 'Create a mindmap.',
    insertText: 'mindmap\n  root((${1:Idea}))\n    ${2:Branch}',
    referenceTopic: 'mindmap'
  },
  {
    keyword: 'gitGraph',
    detail: 'Mermaid git graph starter',
    documentation: 'Create a git graph visualization.',
    insertText: 'gitGraph\n    commit id:"${1:Init}"\n    branch ${2:feature}\n    checkout ${2:feature}\n    commit id:"${3:Work}"',
    referenceTopic: 'gitgraph'
  },
  {
    keyword: 'architecture-beta',
    detail: 'Mermaid architecture diagram starter',
    documentation: 'Create an architecture diagram with Mermaid architecture-beta syntax.',
    insertText: 'architecture-beta\n    group ${1:api}(cloud)[${2:API}]\n    service ${3:web}(internet)[${4:Web}] in ${1:api}',
    referenceTopic: 'architecture'
  }
];

export const SHARED_SYNTAX_TOPICS: MermaidSharedSyntaxTopic[] = [
  {
    label: 'participant',
    detail: 'Sequence participant',
    documentation: 'Declare a participant. You can optionally rename it with `as`.',
    example: 'participant user as End User',
    insertText: 'participant ${1:user} as ${2:End User}',
    diagramTypes: ['sequenceDiagram'],
    referenceTopic: 'sequence'
  },
  {
    label: '->>',
    detail: 'Sequence message arrow',
    documentation: 'Sequence message arrow between participants.',
    example: 'User->>API: request',
    insertText: '${1:User}->>${2:API}: ${3:request}',
    kind: vscode.CompletionItemKind.Operator,
    diagramTypes: ['sequenceDiagram'],
    referenceTopic: 'sequence'
  },
  {
    label: '-->>',
    detail: 'Sequence response arrow',
    documentation: 'Sequence response / return arrow.',
    example: 'API-->>User: response',
    insertText: '${1:API}-->>${2:User}: ${3:response}',
    kind: vscode.CompletionItemKind.Operator,
    diagramTypes: ['sequenceDiagram'],
    referenceTopic: 'sequence'
  },
  {
    label: 'note',
    detail: 'Sequence/state note',
    documentation: 'Add a note beside a participant or state.',
    example: 'Note right of API: retry on timeout',
    insertText: 'Note ${1|left of,right of,over|} ${2:API}: ${3:note}',
    diagramTypes: ['sequenceDiagram', 'stateDiagram-v2'],
    referenceTopic: 'sequence'
  },
  {
    label: 'loop',
    detail: 'Sequence loop block',
    documentation: 'Start a loop block in a sequence diagram.',
    example: ['loop retry', '    API->>DB: read', 'end'].join('\n'),
    insertText: 'loop ${1:condition}\n    ${2:API}->>${3:DB}: ${4:read}\nend',
    kind: vscode.CompletionItemKind.Snippet,
    diagramTypes: ['sequenceDiagram'],
    referenceTopic: 'sequence'
  },
  {
    label: 'alt',
    detail: 'Sequence alternative block',
    documentation: 'Start an alternative branch block in a sequence diagram.',
    example: ['alt success', '    API-->>User: ok', 'else failure', '    API-->>User: error', 'end'].join('\n'),
    insertText: 'alt ${1:success}\n    ${2:API}-->>${3:User}: ${4:ok}\nelse ${5:failure}\n    ${2:API}-->>${3:User}: ${6:error}\nend',
    kind: vscode.CompletionItemKind.Snippet,
    diagramTypes: ['sequenceDiagram'],
    referenceTopic: 'sequence'
  },
  {
    label: 'subgraph',
    detail: 'Flowchart grouping block',
    documentation: 'Start a flowchart subgraph block. Close it with `end`.',
    example: ['subgraph Services', '    API --> DB', 'end'].join('\n'),
    insertText: 'subgraph ${1:Group}\n    ${2:A} --> ${3:B}\nend',
    kind: vscode.CompletionItemKind.Snippet,
    diagramTypes: ['flowchart', 'graph'],
    referenceTopic: 'flowchart'
  },
  {
    label: 'direction',
    detail: 'Flowchart direction keyword',
    documentation: 'Set the flow direction inside a flowchart.',
    example: 'direction LR',
    insertText: 'direction ${1|LR,RL,TD,BT|}',
    diagramTypes: ['flowchart', 'graph'],
    referenceTopic: 'flowchart'
  },
  {
    label: 'click',
    detail: 'Flowchart click action',
    documentation: 'Add a click action or link to a flowchart node.',
    example: 'click A href "https://example.com" "Open docs"',
    insertText: 'click ${1:A} href "${2:https://example.com}" "${3:Open}"',
    diagramTypes: ['flowchart', 'graph'],
    referenceTopic: 'flowchart'
  },
  {
    label: 'classDef',
    detail: 'Flowchart class definition',
    documentation: 'Define a reusable node style.',
    example: 'classDef critical fill:#fee,stroke:#c00,color:#900',
    insertText: 'classDef ${1:critical} fill:${2:#fee},stroke:${3:#c00},color:${4:#900}',
    diagramTypes: ['flowchart', 'graph'],
    referenceTopic: 'flowchart'
  },
  {
    label: 'class',
    detail: 'Apply Mermaid class',
    documentation: 'Apply a class to one or more nodes.',
    example: 'class A,B critical',
    insertText: 'class ${1:A,B} ${2:critical}',
    diagramTypes: ['flowchart', 'graph'],
    referenceTopic: 'flowchart'
  },
  {
    label: 'linkStyle',
    detail: 'Style a flowchart edge by index',
    documentation: 'Style a link by its index in the flowchart.',
    example: 'linkStyle 0 stroke:#f66,stroke-width:2px',
    insertText: 'linkStyle ${1:0} stroke:${2:#f66},stroke-width:${3:2px}',
    diagramTypes: ['flowchart', 'graph'],
    referenceTopic: 'flowchart'
  },
  {
    label: 'dateFormat',
    detail: 'Gantt date format directive',
    documentation: 'Set how Mermaid parses gantt dates.',
    example: 'dateFormat YYYY-MM-DD',
    insertText: 'dateFormat ${1:YYYY-MM-DD}',
    diagramTypes: ['gantt'],
    referenceTopic: 'gantt'
  },
  {
    label: 'axisFormat',
    detail: 'Gantt axis format directive',
    documentation: 'Set gantt axis label formatting.',
    example: 'axisFormat %m/%d',
    insertText: 'axisFormat ${1:%m/%d}',
    diagramTypes: ['gantt'],
    referenceTopic: 'gantt'
  },
  {
    label: 'title',
    detail: 'Diagram title',
    documentation: 'Set a diagram title.',
    example: 'title Project Plan',
    insertText: 'title ${1:Project Plan}',
    diagramTypes: ['gantt', 'flowchart', 'graph', 'gitGraph', 'mindmap'],
    referenceTopic: 'gantt'
  },
  {
    label: 'section',
    detail: 'Gantt section',
    documentation: 'Start a gantt section.',
    example: 'section Build',
    insertText: 'section ${1:Build}',
    diagramTypes: ['gantt'],
    referenceTopic: 'gantt'
  },
  {
    label: 'todayMarker',
    detail: 'Gantt today marker',
    documentation: 'Configure the gantt current-day marker.',
    example: 'todayMarker off',
    insertText: 'todayMarker ${1|off,today,styled|}',
    diagramTypes: ['gantt'],
    referenceTopic: 'gantt'
  },
  {
    label: 'excludes',
    detail: 'Gantt excludes directive',
    documentation: 'Exclude days from gantt scheduling.',
    example: 'excludes weekends',
    insertText: 'excludes ${1:weekends}',
    diagramTypes: ['gantt'],
    referenceTopic: 'gantt'
  },
  {
    label: 'includes',
    detail: 'Gantt includes directive',
    documentation: 'Include days in gantt scheduling rules.',
    example: 'includes 2026-04-10',
    insertText: 'includes ${1:2026-04-10}',
    diagramTypes: ['gantt'],
    referenceTopic: 'gantt'
  },
  {
    label: 'commit',
    detail: 'gitGraph commit',
    documentation: 'Add a commit in `gitGraph`. Use optional metadata like `id:` or `tag:`.',
    example: 'commit id:"Init"',
    insertText: 'commit id:"${1:Init}"',
    diagramTypes: ['gitGraph'],
    referenceTopic: 'gitgraph'
  },
  {
    label: 'branch',
    detail: 'gitGraph branch',
    documentation: 'Create a branch in `gitGraph`.',
    example: 'branch feature',
    insertText: 'branch ${1:feature}',
    diagramTypes: ['gitGraph'],
    referenceTopic: 'gitgraph'
  },
  {
    label: 'checkout',
    detail: 'gitGraph checkout',
    documentation: 'Switch branches in `gitGraph`.',
    example: 'checkout feature',
    insertText: 'checkout ${1:feature}',
    diagramTypes: ['gitGraph'],
    referenceTopic: 'gitgraph'
  },
  {
    label: 'merge',
    detail: 'gitGraph merge',
    documentation: 'Merge another branch into the current branch in `gitGraph`.',
    example: 'merge feature',
    insertText: 'merge ${1:feature}',
    diagramTypes: ['gitGraph'],
    referenceTopic: 'gitgraph'
  },
  {
    label: 'cherry-pick',
    detail: 'gitGraph cherry-pick',
    documentation: 'Cherry-pick a commit in `gitGraph`.',
    example: 'cherry-pick id:"abc123"',
    insertText: 'cherry-pick id:"${1:abc123}"',
    diagramTypes: ['gitGraph'],
    referenceTopic: 'gitgraph'
  },
  {
    label: 'namespace',
    detail: 'Class diagram namespace',
    documentation: 'Group classes inside a namespace.',
    example: 'namespace Core {\n    class Service\n}',
    insertText: 'namespace ${1:Core} {\n    class ${2:Service}\n}',
    kind: vscode.CompletionItemKind.Snippet,
    diagramTypes: ['classDiagram'],
    referenceTopic: 'class'
  },
  {
    label: 'state',
    detail: 'State diagram state',
    documentation: 'Declare a named state.',
    example: 'state Running',
    insertText: 'state ${1:Running}',
    diagramTypes: ['stateDiagram-v2'],
    referenceTopic: 'state'
  },
  {
    label: 'choice',
    detail: 'State diagram choice',
    documentation: 'Insert a choice node in a state diagram.',
    example: 'state choice <<choice>>',
    insertText: 'state ${1:choice} <<choice>>',
    diagramTypes: ['stateDiagram-v2'],
    referenceTopic: 'state'
  },
  {
    label: 'fork',
    detail: 'State diagram fork',
    documentation: 'Insert a fork node in a state diagram.',
    example: 'state fork_state <<fork>>',
    insertText: 'state ${1:fork_state} <<fork>>',
    diagramTypes: ['stateDiagram-v2'],
    referenceTopic: 'state'
  },
  {
    label: 'join',
    detail: 'State diagram join',
    documentation: 'Insert a join node in a state diagram.',
    example: 'state join_state <<join>>',
    insertText: 'state ${1:join_state} <<join>>',
    diagramTypes: ['stateDiagram-v2'],
    referenceTopic: 'state'
  },
  {
    label: 'group',
    detail: 'Architecture diagram group',
    documentation: 'Define a group in an architecture diagram.',
    example: 'group api(cloud)[API]',
    insertText: 'group ${1:api}(cloud)[${2:API}]',
    diagramTypes: ['architecture-beta'],
    referenceTopic: 'architecture'
  },
  {
    label: 'service',
    detail: 'Architecture diagram service',
    documentation: 'Define a service inside an architecture diagram.',
    example: 'service web(internet)[Web] in api',
    insertText: 'service ${1:web}(internet)[${2:Web}] in ${3:api}',
    diagramTypes: ['architecture-beta'],
    referenceTopic: 'architecture'
  }
];

export function getRootCompletionTopics(): Array<{
  label: string;
  detail: string;
  documentation: string;
  example?: string;
  link: string;
  insertText: string;
}> {
  return ROOT_SYNTAX_TOPICS.map((topic) => ({
    label: topic.keyword,
    detail: topic.detail,
    documentation: topic.documentation,
    example: topic.example,
    link: getReferenceUrlForTopic(topic.referenceTopic),
    insertText: topic.insertText
  }));
}

export function getRootKeywordHelpTopics(): Record<string, MermaidKeywordHelpTopic> {
  return Object.fromEntries(
    ROOT_SYNTAX_TOPICS.map((topic) => [
      topic.keyword,
      {
        title: topic.keyword,
        body: topic.documentation,
        example: topic.example,
        link: getReferenceUrlForTopic(topic.referenceTopic)
      }
    ])
  );
}

export const COMPLETION_ONLY_SYNTAX_TOPICS: MermaidSharedSyntaxTopic[] = [
  {
    label: 'gantt task',
    detail: 'Gantt task row snippet',
    documentation: 'Insert a gantt task row with metadata.',
    example: 'MVP :active, t1, 2026-04-03, 3d',
    insertText: '${1:Task} :${2|done,active,crit,milestone|}, ${3:id1}, ${4:2026-04-03}, ${5:3d}',
    kind: vscode.CompletionItemKind.Snippet,
    diagramTypes: ['gantt'],
    referenceTopic: 'gantt'
  },
  {
    label: 'er relationship',
    detail: 'ER relationship line',
    documentation: 'Insert a common ER relationship line.',
    example: 'CUSTOMER ||--o{ ORDER : places',
    insertText: '${1:CUSTOMER} ||--o{ ${2:ORDER} : ${3:places}',
    kind: vscode.CompletionItemKind.Snippet,
    diagramTypes: ['erDiagram'],
    referenceTopic: 'er'
  }
];

export const HOVER_ONLY_KEYWORD_TOPICS: MermaidSharedSyntaxTopic[] = [
  {
    label: 'graph',
    detail: 'Flowchart alias',
    documentation: 'Alias for `flowchart`.',
    example: 'graph TD',
    referenceTopic: 'flowchart'
  },
  {
    label: 'end',
    detail: 'Block terminator',
    documentation: 'Closes a Mermaid block structure such as `subgraph`, `alt`, `opt`, or `loop` depending on diagram type.',
    referenceTopic: 'general'
  },
  { label: 'LR', detail: 'Left-to-right direction', documentation: 'Left-to-right layout direction.', referenceTopic: 'flowchart' },
  { label: 'RL', detail: 'Right-to-left direction', documentation: 'Right-to-left layout direction.', referenceTopic: 'flowchart' },
  { label: 'TD', detail: 'Top-down direction', documentation: 'Top-down layout direction.', referenceTopic: 'flowchart' },
  { label: 'BT', detail: 'Bottom-to-top direction', documentation: 'Bottom-to-top layout direction.', referenceTopic: 'flowchart' },
  {
    label: 'opt',
    detail: 'Sequence optional block',
    documentation: 'Starts an optional block in sequence diagrams.',
    example: ['opt feature enabled', '    App->>API: request', 'end'].join('\n'),
    referenceTopic: 'sequence'
  },
  { label: 'else', detail: 'Sequence alt branch', documentation: 'Adds another branch in an `alt` block.', referenceTopic: 'sequence' },
  { label: 'par', detail: 'Sequence parallel block', documentation: 'Starts a parallel block in sequence diagrams.', referenceTopic: 'sequence' },
  { label: 'and', detail: 'Sequence parallel branch', documentation: 'Adds another branch in a parallel block.', referenceTopic: 'sequence' },
  { label: 'critical', detail: 'Sequence critical region', documentation: 'Starts a critical region in sequence diagrams.', referenceTopic: 'sequence' },
  { label: 'break', detail: 'Sequence break block', documentation: 'Starts a break block in sequence diagrams.', referenceTopic: 'sequence' },
  { label: 'rect', detail: 'Sequence region background', documentation: 'Adds a background region in sequence diagrams.', referenceTopic: 'sequence' },
  { label: 'activate', detail: 'Sequence participant activation', documentation: 'Activates a participant in a sequence diagram.', referenceTopic: 'sequence' },
  { label: 'deactivate', detail: 'Sequence participant deactivation', documentation: 'Deactivates a participant in a sequence diagram.', referenceTopic: 'sequence' },
  { label: 'style', detail: 'Inline style', documentation: 'Applies inline styling to a node or element.', referenceTopic: 'general' },
  { label: 'accTitle', detail: 'Accessibility title', documentation: 'Accessibility title for a Mermaid diagram.', referenceTopic: 'general' },
  { label: 'accDescr', detail: 'Accessibility description', documentation: 'Accessibility description for a Mermaid diagram.', referenceTopic: 'general' }
];

export function getSharedCompletionTopics(): Array<{
  label: string;
  detail: string;
  documentation: string;
  example?: string;
  link: string;
  insertText?: string;
  kind?: vscode.CompletionItemKind;
  diagramTypes?: MermaidDiagramFamilyId[];
}> {
  return SHARED_SYNTAX_TOPICS.map((topic) => ({
    label: topic.label,
    detail: topic.detail,
    documentation: topic.documentation,
    example: topic.example,
    link: getReferenceUrlForTopic(topic.referenceTopic),
    insertText: topic.insertText,
    kind: topic.kind,
    diagramTypes: topic.diagramTypes
  }));
}

export function getSharedKeywordHelpTopics(): Record<string, MermaidKeywordHelpTopic> {
  return Object.fromEntries(
    SHARED_SYNTAX_TOPICS.map((topic) => [
      topic.label,
      {
        title: topic.hoverTitle ?? topic.label,
        body: topic.documentation,
        example: topic.example,
        link: getReferenceUrlForTopic(topic.referenceTopic)
      }
    ])
  );
}

export function getCompletionOnlyTopics(): Array<{
  label: string;
  detail: string;
  documentation: string;
  example?: string;
  link: string;
  insertText?: string;
  kind?: vscode.CompletionItemKind;
  diagramTypes?: MermaidDiagramFamilyId[];
}> {
  return COMPLETION_ONLY_SYNTAX_TOPICS.map((topic) => ({
    label: topic.label,
    detail: topic.detail,
    documentation: topic.documentation,
    example: topic.example,
    link: getReferenceUrlForTopic(topic.referenceTopic),
    insertText: topic.insertText,
    kind: topic.kind,
    diagramTypes: topic.diagramTypes
  }));
}

export function getHoverOnlyKeywordHelpTopics(): Record<string, MermaidKeywordHelpTopic> {
  return Object.fromEntries(
    HOVER_ONLY_KEYWORD_TOPICS.map((topic) => [
      topic.label,
      {
        title: topic.hoverTitle ?? topic.label,
        body: topic.documentation,
        example: topic.example,
        link: getReferenceUrlForTopic(topic.referenceTopic)
      }
    ])
  );
}
