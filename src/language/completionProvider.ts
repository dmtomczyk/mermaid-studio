import * as vscode from 'vscode';
import { detectDiagramType } from '../registry/diagramRegistry';
import { getAvailableSlashSnippetChoices } from '../registry/snippetRegistry';
import { getFavoriteSnippetIds, getRecentSnippetIds } from '../registry/snippetState';
import { getCompletionOnlyTopics, getRootCompletionTopics, getSharedCompletionTopics } from '../registry/syntaxRegistry';
import { getConfig } from '../utils/config';
import { findMermaidFenceContainingPosition } from '../utils/markdown';

interface CompletionEntry {
  label: string;
  detail: string;
  documentation: string;
  example?: string;
  link?: string;
  insertText?: string;
  kind?: vscode.CompletionItemKind;
  diagramTypes?: string[];
}

const ROOT_ITEMS: CompletionEntry[] = getRootCompletionTopics();

const CONTEXT_ITEMS: CompletionEntry[] = [
  ...getSharedCompletionTopics(),
  ...getCompletionOnlyTopics()
];

export class MermaidCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private readonly extensionContext: vscode.ExtensionContext) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const slashContext = getSlashSnippetContext(document, position);
    const mermaidFence = document.languageId === 'markdown'
      ? findMermaidFenceContainingPosition(document.getText(), {
          line: position.line,
          character: position.character
        })
      : undefined;

    if (document.languageId === 'markdown' && !mermaidFence && !slashContext) {
      return [];
    }

    const diagramType = mermaidFence || document.languageId !== 'markdown'
      ? detectDiagramType(document, position)
      : undefined;

    if (slashContext) {
      const favorites = getFavoriteSnippetIds(this.extensionContext);
      const recent = getRecentSnippetIds(this.extensionContext);
      const slashChoices = getAvailableSlashSnippetChoices(diagramType, slashContext.query, { favorites, recent });
      return createSlashSnippetItems({
        choices: slashChoices,
        range: slashContext.range,
        document,
        mermaidFence,
        query: slashContext.query
      });
    }

    const items = [
      ...ROOT_ITEMS,
      ...CONTEXT_ITEMS.filter((entry) => !entry.diagramTypes || (diagramType && entry.diagramTypes.includes(diagramType)))
    ];

    return items.map((entry, index) => createCompletionItem(entry, index));
  }
}

function createCompletionItem(entry: CompletionEntry, index: number): vscode.CompletionItem {
  const item = new vscode.CompletionItem(entry.label, entry.kind ?? vscode.CompletionItemKind.Keyword);
  item.insertText = entry.insertText ? new vscode.SnippetString(entry.insertText) : entry.label;
  item.detail = entry.detail;
  item.documentation = createDocumentation(entry);
  item.sortText = String(index).padStart(4, '0');
  return item;
}

function createSlashSnippetItems(input: {
  choices: ReturnType<typeof getAvailableSlashSnippetChoices>;
  range: vscode.Range;
  document: vscode.TextDocument;
  mermaidFence: ReturnType<typeof findMermaidFenceContainingPosition> | undefined;
  query: string;
}): vscode.CompletionItem[] {
  const items = input.choices.map((choice, index) => createSlashSnippetCompletionItem(choice, index, input.range, input.document, input.mermaidFence));

  if (!input.query || 'snippet'.includes(input.query)) {
    items.unshift(createSlashBrowserCompletionItem(input.range));
  }

  return items;
}

function createSlashSnippetCompletionItem(
  choice: ReturnType<typeof getAvailableSlashSnippetChoices>[number],
  index: number,
  range: vscode.Range,
  document: vscode.TextDocument,
  mermaidFence: ReturnType<typeof findMermaidFenceContainingPosition> | undefined
): vscode.CompletionItem {
  const item = new vscode.CompletionItem(`/${choice.alias}`, vscode.CompletionItemKind.Snippet);
  item.range = range;
  item.insertText = '';
  item.detail = `${choice.favorite ? '★ Favorite · ' : ''}${choice.recent ? 'Recent · ' : ''}${choice.topic.label} snippet`;
  item.documentation = createSlashSnippetDocumentation(choice.alias, choice.topic, document, mermaidFence);
  item.sortText = `1-${String(index).padStart(4, '0')}`;
  item.filterText = `/${choice.alias}`;
  item.command = {
    title: 'Insert Mermaid Snippet',
    command: 'mermaidstudio.insertSnippet',
    arguments: [{ snippetId: choice.topic.id, replaceRange: serializeRange(range) }]
  };
  return item;
}

function createSlashBrowserCompletionItem(range: vscode.Range): vscode.CompletionItem {
  const item = new vscode.CompletionItem('/snippet', vscode.CompletionItemKind.Reference);
  item.range = range;
  item.insertText = '';
  item.detail = 'Open the full Mermaid snippet browser';
  item.documentation = new vscode.MarkdownString('Open the full Mermaid snippet browser with favorites and recent items.');
  item.sortText = '0-0000';
  item.filterText = '/snippet';
  item.command = {
    title: 'Open Mermaid Snippet Browser',
    command: 'mermaidstudio.insertSnippet',
    arguments: [{ replaceRange: serializeRange(range) }]
  };
  return item;
}

function createDocumentation(entry: CompletionEntry): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString(undefined, true);
  markdown.appendMarkdown(entry.documentation);
  if (entry.example) {
    markdown.appendMarkdown('\n\nExample:\n');
    markdown.appendCodeblock(entry.example, 'mermaid');
  }
  if (entry.link) {
    markdown.appendMarkdown(`\n\n[Reference](${entry.link})`);
  }
  return markdown;
}

function createSlashSnippetDocumentation(
  alias: string,
  topic: { label: string; description: string; body: string },
  document: vscode.TextDocument,
  mermaidFence: ReturnType<typeof findMermaidFenceContainingPosition> | undefined
): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString(undefined, true);
  markdown.appendMarkdown(`Insert **${topic.label}** via \`/${alias}\`.`);
  markdown.appendMarkdown(`\n\n${topic.description}`);
  markdown.appendMarkdown('\n\nSnippet:\n');
  markdown.appendCodeblock(getSlashSnippetInsertText(topic.body, document, mermaidFence), document.languageId === 'markdown' && !mermaidFence ? 'markdown' : 'mermaid');
  return markdown;
}

function getSlashSnippetInsertText(
  snippetBody: string,
  document: vscode.TextDocument,
  mermaidFence: ReturnType<typeof findMermaidFenceContainingPosition> | undefined
): string {
  if (document.languageId === 'markdown' && !mermaidFence) {
    return ['```' + getConfig().markdownFenceLanguage, snippetBody, '```'].join('\n');
  }
  return snippetBody;
}

function serializeRange(range: vscode.Range): { start: { line: number; character: number }; end: { line: number; character: number } } {
  return {
    start: { line: range.start.line, character: range.start.character },
    end: { line: range.end.line, character: range.end.character }
  };
}

function getSlashSnippetContext(document: vscode.TextDocument, position: vscode.Position): { query: string; range: vscode.Range } | undefined {
  if (!['mermaid', 'mermaidjs', 'markdown'].includes(document.languageId)) {
    return undefined;
  }

  const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
  const match = /(?:^|[\s([{-])\/([A-Za-z0-9-]*)$/u.exec(linePrefix);
  if (!match || match.index === undefined) {
    return undefined;
  }

  const startCharacter = position.character - match[1].length - 1;
  return {
    query: match[1].toLowerCase(),
    range: new vscode.Range(position.line, startCharacter, position.line, position.character)
  };
}

