import * as vscode from 'vscode';
import {
  getLocalExamplesCommandUriForTitle,
  getReferenceUrlForTitle
} from '../registry/exampleRegistry';
import { detectDiagramType } from '../registry/diagramRegistry';
import { getHoverOnlyKeywordHelpTopics, getRootKeywordHelpTopics, getSharedKeywordHelpTopics } from '../registry/syntaxRegistry';
import { findMermaidFenceContainingPosition } from '../utils/markdown';

interface HelpEntry {
  title: string;
  body: string;
  example?: string;
  link?: string;
}

const WORD_REGEX = /[A-Za-z0-9_.>\-]+/;
const SHARED_KEYWORD_HELP = getSharedKeywordHelpTopics();
const HOVER_ONLY_KEYWORD_HELP = getHoverOnlyKeywordHelpTopics();

const KEYWORD_HELP: Record<string, HelpEntry> = {
  ...getRootKeywordHelpTopics(),
  ...SHARED_KEYWORD_HELP,
  ...HOVER_ONLY_KEYWORD_HELP
};

const OPERATOR_HELP: Array<{ token: string; help: HelpEntry }> = [
  {
    token: '-.->',
    help: {
      title: '-.->',
      body: 'Dotted flowchart arrow. Useful for optional, async, or indirect relationships.',
      example: 'A -.-> B'
    }
  },
  {
    token: '-->',
    help: {
      title: '-->',
      body: 'Solid flowchart arrow.',
      example: 'A --> B'
    }
  },
  {
    token: '->>',
    help: SHARED_KEYWORD_HELP['->>']
  },
  {
    token: '-->>',
    help: SHARED_KEYWORD_HELP['-->>']
  },
  {
    token: '==>',
    help: {
      title: '==>',
      body: 'Thick flowchart arrow.'
    }
  },
  {
    token: '<|--',
    help: {
      title: '<|--',
      body: 'Inheritance/generalization relationship in class diagrams.',
      example: 'Animal <|-- Dog'
    }
  },
  {
    token: '--|>',
    help: {
      title: '--|>',
      body: 'Reverse inheritance/generalization relationship.'
    }
  },
  {
    token: '||--o{',
    help: {
      title: '||--o{',
      body: 'ER relationship: exactly one to zero-or-more.',
      example: 'CUSTOMER ||--o{ ORDER : places'
    }
  },
  {
    token: '}o--||',
    help: {
      title: '}o--||',
      body: 'ER relationship: zero-or-more to exactly one.'
    }
  },
  {
    token: 'o{--o{',
    help: {
      title: 'o{--o{',
      body: 'ER relationship: zero-or-more to zero-or-more.'
    }
  },
  {
    token: '|o--',
    help: {
      title: '|o--',
      body: 'ER relationship segment involving zero-or-one cardinality.'
    }
  },
  {
    token: '--o|',
    help: {
      title: '--o|',
      body: 'ER relationship segment involving zero-or-one cardinality.'
    }
  }
];

const FLOW_NODE_PATTERNS: Array<{ regex: RegExp; title: string; body: string; example: string }> = [
  {
    regex: /\b([A-Za-z_][A-Za-z0-9_]*)\s*(\[[^\]]*\])/g,
    title: 'Flowchart rectangle node',
    body: 'Defines a rectangle node. The identifier is reused when connecting edges.',
    example: 'A[Start]'
  },
  {
    regex: /\b([A-Za-z_][A-Za-z0-9_]*)\s*(\(\[[^\)]*\]\))/g,
    title: 'Flowchart rounded node',
    body: 'Defines a rounded node.',
    example: 'A([Process])'
  },
  {
    regex: /\b([A-Za-z_][A-Za-z0-9_]*)\s*(\(\([^\)]*\)\))/g,
    title: 'Flowchart circle node',
    body: 'Defines a circular node.',
    example: 'A((Circle))'
  },
  {
    regex: /\b([A-Za-z_][A-Za-z0-9_]*)\s*(\{[^\}]*\})/g,
    title: 'Flowchart diamond node',
    body: 'Defines a diamond/decision node.',
    example: 'A{Valid?}'
  },
  {
    regex: /\b([A-Za-z_][A-Za-z0-9_]*)\s*(\[\([^\)]*\)\])/g,
    title: 'Flowchart database node',
    body: 'Defines a database/cylinder-style node.',
    example: 'DB[(Database)]'
  }
];

export class MermaidHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
    if (!isMermaidContext(document, position)) {
      return undefined;
    }

    const operatorHover = getOperatorHover(document, position);
    if (operatorHover) {
      return operatorHover;
    }

    const contextualHover = getContextualHover(document, position);
    if (contextualHover) {
      return contextualHover;
    }

    const range = document.getWordRangeAtPosition(position, WORD_REGEX);
    if (!range) {
      return undefined;
    }

    const word = document.getText(range);
    const help = KEYWORD_HELP[word];
    if (!help) {
      return undefined;
    }

    return createHover(help, range);
  }
}

function isMermaidContext(document: vscode.TextDocument, position: vscode.Position): boolean {
  if (document.languageId === 'markdown') {
    const fence = findMermaidFenceContainingPosition(document.getText(), {
      line: position.line,
      character: position.character
    });
    return Boolean(fence);
  }

  return document.languageId === 'mermaid' || document.languageId === 'mermaidjs';
}

function getOperatorHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
  const lineText = document.lineAt(position.line).text;
  for (const entry of OPERATOR_HELP) {
    let searchIndex = 0;
    while (searchIndex < lineText.length) {
      const found = lineText.indexOf(entry.token, searchIndex);
      if (found === -1) {
        break;
      }
      const range = new vscode.Range(position.line, found, position.line, found + entry.token.length);
      if (range.contains(position)) {
        return createHover(entry.help, range);
      }
      searchIndex = found + entry.token.length;
    }
  }
  return undefined;
}

function getContextualHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
  const lineText = document.lineAt(position.line).text;
  const diagramType = detectDiagramType(document, position);

  const participantHover = getParticipantHover(lineText, position.line, position.character);
  if (participantHover) {
    return participantHover;
  }

  const nodeHover = getFlowNodeHover(lineText, position.line, position.character);
  if (nodeHover) {
    return nodeHover;
  }

  const edgeLabelHover = getDelimitedHover(lineText, position.line, position.character, /\|([^|\n]+)\|/g, {
    title: 'Flowchart edge label',
    body: 'Text between `|...|` labels the edge.',
    example: 'A -->|success| B'
  });
  if (edgeLabelHover) {
    return edgeLabelHover;
  }

  const messageLabelHover = getMessageLabelHover(lineText, position.line, position.character);
  if (messageLabelHover) {
    return messageLabelHover;
  }

  const wordRange = document.getWordRangeAtPosition(new vscode.Position(position.line, position.character), WORD_REGEX);
  if (wordRange) {
    const word = document.getText(wordRange);
    const lineScopedHover = getLineScopedWordHover(lineText, word, wordRange, diagramType);
    if (lineScopedHover) {
      return lineScopedHover;
    }
  }

  return undefined;
}

function getParticipantHover(lineText: string, line: number, character: number): vscode.Hover | undefined {
  const match = /\bparticipant\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+as\s+(.+))?/u.exec(lineText);
  if (!match || match.index === undefined) {
    return undefined;
  }

  const idStart = lineText.indexOf(match[1], match.index);
  const idRange = new vscode.Range(line, idStart, line, idStart + match[1].length);
  if (idRange.contains(new vscode.Position(line, character))) {
    return createHover(
      {
        title: 'Sequence participant ID',
        body: 'This identifier is used when sending messages in a sequence diagram. Keep it stable and reference it in arrows.',
        example: ['participant API', 'User->>API: request'].join('\n')
      },
      idRange
    );
  }

  if (match[2]) {
    const labelStart = lineText.indexOf(match[2], idStart + match[1].length);
    const labelRange = new vscode.Range(line, labelStart, line, labelStart + match[2].length);
    if (labelRange.contains(new vscode.Position(line, character))) {
      return createHover(
        {
          title: 'Sequence participant display label',
          body: 'This is the human-readable label shown in the rendered diagram. The ID stays on the left of `as`.',
          example: 'participant user as End User'
        },
        labelRange
      );
    }
  }

  return undefined;
}

function getFlowNodeHover(lineText: string, line: number, character: number): vscode.Hover | undefined {
  const position = new vscode.Position(line, character);
  for (const pattern of FLOW_NODE_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lineText)) !== null) {
      const id = match[1];
      const shape = match[2];
      const idStart = match.index;
      const idRange = new vscode.Range(line, idStart, line, idStart + id.length);
      if (idRange.contains(position)) {
        return createHover(
          {
            title: 'Flowchart node identifier',
            body: 'This identifier is how Mermaid connects and reuses the node elsewhere in the diagram.',
            example: `${id} --> Next`
          },
          idRange
        );
      }
      const shapeStart = lineText.indexOf(shape, idStart + id.length);
      const shapeRange = new vscode.Range(line, shapeStart, line, shapeStart + shape.length);
      if (shapeRange.contains(position)) {
        return createHover(
          {
            title: pattern.title,
            body: pattern.body,
            example: pattern.example
          },
          shapeRange
        );
      }
    }
  }
  return undefined;
}

function getDelimitedHover(
  lineText: string,
  line: number,
  character: number,
  regex: RegExp,
  help: HelpEntry
): vscode.Hover | undefined {
  const position = new vscode.Position(line, character);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(lineText)) !== null) {
    const inner = match[1];
    const innerStart = match.index + match[0].indexOf(inner);
    const range = new vscode.Range(line, innerStart, line, innerStart + inner.length);
    if (range.contains(position)) {
      return createHover(help, range);
    }
  }
  return undefined;
}

function getMessageLabelHover(lineText: string, line: number, character: number): vscode.Hover | undefined {
  const arrowIndex = findArrowIndex(lineText, ['->>', '-->>']);
  if (arrowIndex === -1) {
    return undefined;
  }
  const colonIndex = lineText.indexOf(':', arrowIndex);
  if (colonIndex === -1) {
    return undefined;
  }
  const text = lineText.slice(colonIndex + 1).trim();
  if (!text) {
    return undefined;
  }
  const start = lineText.indexOf(text, colonIndex + 1);
  const range = new vscode.Range(line, start, line, start + text.length);
  if (!range.contains(new vscode.Position(line, character))) {
    return undefined;
  }
  return createHover(
    {
      title: 'Sequence message label',
      body: 'Text after `:` becomes the message caption in a sequence diagram.',
      example: 'User->>API: login'
    },
    range
  );
}

function getLineScopedWordHover(
  lineText: string,
  word: string,
  range: vscode.Range,
  diagramType: string | undefined
): vscode.Hover | undefined {
  if (diagramType === 'gitGraph' && ['commit', 'branch', 'checkout', 'merge', 'cherry-pick'].includes(word)) {
    const help = KEYWORD_HELP[word];
    return help ? createHover(help, range) : undefined;
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(word) && lineText.includes('--')) {
    return createHover(
      {
        title: 'Mermaid identifier',
        body: 'This looks like a node/participant identifier. Identifiers are reused when connecting shapes or messages elsewhere in the same diagram.'
      },
      range
    );
  }

  return undefined;
}

function createHover(help: HelpEntry, range: vscode.Range): vscode.Hover {
  const markdown = new vscode.MarkdownString(undefined, true);
  markdown.isTrusted = true;
  markdown.appendMarkdown(`**${help.title}**\n\n${help.body}`);
  if (help.example) {
    markdown.appendMarkdown('\n\nExample:\n');
    markdown.appendCodeblock(help.example, 'mermaid');
  }
  const referenceLink = help.link ?? getReferenceUrlForTitle(help.title);
  const localExamplesUri = getLocalExamplesCommandUriForTitle(help.title);
  if (referenceLink || localExamplesUri) {
    markdown.appendMarkdown('\n\n');
  }
  if (referenceLink) {
    markdown.appendMarkdown(`[Reference](${referenceLink})`);
  }
  if (referenceLink && localExamplesUri) {
    markdown.appendMarkdown(' · ');
  }
  if (localExamplesUri) {
    markdown.appendMarkdown(`[Open local examples](${localExamplesUri})`);
  }
  markdown.appendMarkdown('\n\n_Provided by Mermaid Studio._');
  return new vscode.Hover(markdown, range);
}

function findArrowIndex(lineText: string, arrows: string[]): number {
  let best = -1;
  for (const arrow of arrows) {
    const index = lineText.indexOf(arrow);
    if (index !== -1 && (best === -1 || index < best)) {
      best = index;
    }
  }
  return best;
}

