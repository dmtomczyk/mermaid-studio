import * as vscode from 'vscode';
import { detectDiagramType } from '../registry/diagramRegistry';
import { getAvailableSnippetTopics, getSnippetTopicById, MermaidSnippetTopic } from '../registry/snippetRegistry';
import { getFavoriteSnippetIds, getRecentSnippetIds, recordRecentSnippet, sortSnippetTopics, toggleFavoriteSnippet } from '../registry/snippetState';
import { getConfig } from '../utils/config';
import { getEditorContext, insertMermaidText } from '../utils/editor';
import { offsetAt, wrapMermaidBlock } from '../utils/markdown';
import { requireActiveEditor } from './helpers';

interface SerializedRange {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

interface InsertSnippetCommandArgs {
  replaceRange?: SerializedRange;
  snippetId?: string;
}

type SnippetQuickPickItem =
  | (vscode.QuickPickItem & { snippet: MermaidSnippetTopic; kind?: undefined })
  | vscode.QuickPickItem;

const FAVORITE_BUTTON: vscode.QuickInputButton = {
  iconPath: new vscode.ThemeIcon('star-full'),
  tooltip: 'Toggle favorite'
};

const NOT_FAVORITE_BUTTON: vscode.QuickInputButton = {
  iconPath: new vscode.ThemeIcon('star-empty'),
  tooltip: 'Toggle favorite'
};

export function registerInsertSnippetCommand(extensionContext: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand('mermaidstudio.insertSnippet', async (args?: InsertSnippetCommandArgs) => {
    const editor = await requireActiveEditor();
    const diagramType = detectDiagramType(editor.document, editor.selection.active);
    const replaceRange = deserializeRange(args?.replaceRange);
    const choice = args?.snippetId
      ? getSnippetTopicById(args.snippetId)
      : await pickSnippet(extensionContext, diagramType);

    if (!choice) {
      return;
    }

    await applySnippetTopic(editor, choice, replaceRange);
    await recordRecentSnippet(extensionContext, choice.id);
  });
}

async function applySnippetTopic(
  editor: vscode.TextEditor,
  topic: MermaidSnippetTopic,
  replaceRange?: vscode.Range
): Promise<void> {
  const context = getEditorContext(editor);
  const config = getConfig();

  if (topic.kind === 'starter') {
    const safetyDecision = await resolveStarterInsertion(editor, topic, context);
    if (safetyDecision === 'cancel') {
      return;
    }
    if (safetyDecision === 'replace-current') {
      await replaceCurrentMermaidTarget(editor, topic.body, context);
      return;
    }
    if (safetyDecision === 'insert-below') {
      await insertStarterBelow(editor, topic.body, context, config.markdownFenceLanguage);
      return;
    }
  }

  const insertionTarget = replaceRange ?? editor.selection;
  const insertText = context.kind === 'markdown' && !context.mermaidFence && config.insertMarkdownFencesByDefault
    ? wrapMermaidBlock(topic.body, config.markdownFenceLanguage)
    : topic.body;

  await editor.insertSnippet(new vscode.SnippetString(insertText), insertionTarget);
}

async function resolveStarterInsertion(
  editor: vscode.TextEditor,
  topic: MermaidSnippetTopic,
  context: ReturnType<typeof getEditorContext>
): Promise<'default' | 'replace-current' | 'insert-below' | 'cancel'> {
  if (context.kind === 'other') {
    return 'default';
  }

  if (context.kind === 'markdown' && !context.mermaidFence) {
    return 'default';
  }

  if (context.kind === 'mermaid' && editor.document.getText().trim().length === 0) {
    return 'default';
  }

  if (context.kind === 'markdown' && context.mermaidFence && context.mermaidFence.content.trim().length === 0) {
    return 'default';
  }

  const targetLabel = context.kind === 'mermaid'
    ? 'current Mermaid document'
    : 'current Mermaid block';

  const action = await vscode.window.showQuickPick(
    [
      { label: `Replace ${targetLabel}`, action: 'replace-current' as const },
      { label: 'Insert below as a new top-level Mermaid block', action: 'insert-below' as const },
      { label: 'Cancel', action: 'cancel' as const }
    ],
    {
      placeHolder: `${topic.label} is a top-level Mermaid starter. How should it be inserted to avoid breaking the existing diagram?`
    }
  );

  return action?.action ?? 'cancel';
}

async function replaceCurrentMermaidTarget(
  editor: vscode.TextEditor,
  rawMermaid: string,
  context: ReturnType<typeof getEditorContext>
): Promise<void> {
  if (context.kind === 'mermaid') {
    const fullRange = new vscode.Range(
      editor.document.positionAt(0),
      editor.document.positionAt(editor.document.getText().length)
    );
    await editor.edit((editBuilder) => editBuilder.replace(fullRange, rawMermaid));
    return;
  }

  await insertMermaidText(editor, rawMermaid, {
    replaceCurrentMarkdownMermaidBlock: true,
    wrapMarkdown: true
  });
}

async function insertStarterBelow(
  editor: vscode.TextEditor,
  rawMermaid: string,
  context: ReturnType<typeof getEditorContext>,
  fenceLanguage: string
): Promise<void> {
  if (context.kind === 'markdown' && context.mermaidFence) {
    const text = editor.document.getText();
    const insertionOffset = offsetAt(text, { line: context.mermaidFence.endLine + 1, character: 0 });
    const addition = `\n\n${wrapMermaidBlock(rawMermaid, fenceLanguage)}`;
    await editor.edit((editBuilder) => {
      editBuilder.insert(editor.document.positionAt(insertionOffset), addition);
    });
    return;
  }

  const documentText = editor.document.getText();
  const suffix = documentText.trim().length > 0 ? `\n\n${rawMermaid}` : rawMermaid;
  await editor.edit((editBuilder) => {
    editBuilder.insert(editor.document.positionAt(documentText.length), suffix);
  });
}

async function pickSnippet(
  extensionContext: vscode.ExtensionContext,
  diagramType?: string
): Promise<MermaidSnippetTopic | undefined> {
  const quickPick = vscode.window.createQuickPick<SnippetQuickPickItem>();
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;
  quickPick.placeholder = diagramType
    ? `Choose a Mermaid snippet for ${diagramType} (★ favorites, recent items first)`
    : 'Choose a Mermaid snippet (★ favorites, recent items first)';

  const refreshItems = () => {
    const favorites = getFavoriteSnippetIds(extensionContext);
    const recent = getRecentSnippetIds(extensionContext);
    const snippets = sortSnippetTopics(getAvailableSnippetTopics(diagramType as any), favorites, recent);
    const favoriteSet = new Set(favorites);
    const recentSet = new Set(recent);

    const favoriteItems = snippets.filter((snippet) => favoriteSet.has(snippet.id));
    const recentItems = snippets.filter((snippet) => !favoriteSet.has(snippet.id) && recentSet.has(snippet.id));
    const starterItems = snippets.filter((snippet) => !favoriteSet.has(snippet.id) && !recentSet.has(snippet.id) && snippet.kind === 'starter');
    const microItems = snippets.filter((snippet) => !favoriteSet.has(snippet.id) && !recentSet.has(snippet.id) && snippet.kind === 'micro');

    quickPick.items = [
      ...createSnippetSection('Favorites', favoriteItems, favoriteSet, recentSet),
      ...createSnippetSection('Recent', recentItems, favoriteSet, recentSet),
      ...createSnippetSection('Starter snippets', starterItems, favoriteSet, recentSet),
      ...createSnippetSection('Micro snippets', microItems, favoriteSet, recentSet)
    ];
  };

  refreshItems();

  return await new Promise<MermaidSnippetTopic | undefined>((resolve) => {
    const disposables: vscode.Disposable[] = [];
    const finish = (value?: MermaidSnippetTopic) => {
      while (disposables.length) {
        disposables.pop()?.dispose();
      }
      quickPick.hide();
      quickPick.dispose();
      resolve(value);
    };

    disposables.push(
      quickPick.onDidAccept(() => {
        const item = quickPick.selectedItems[0] as SnippetQuickPickItem | undefined;
        finish(isSnippetItem(item) ? item.snippet : undefined);
      }),
      quickPick.onDidHide(() => finish(undefined)),
      quickPick.onDidTriggerItemButton(async (event) => {
        const item = event.item as SnippetQuickPickItem;
        if (!isSnippetItem(item)) {
          return;
        }
        await toggleFavoriteSnippet(extensionContext, item.snippet.id);
        refreshItems();
      })
    );

    quickPick.show();
  });
}

function deserializeRange(range?: SerializedRange): vscode.Range | undefined {
  if (!range) {
    return undefined;
  }
  return new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
}

function createSnippetSection(
  label: string,
  snippets: MermaidSnippetTopic[],
  favoriteSet: Set<string>,
  recentSet: Set<string>
): SnippetQuickPickItem[] {
  if (!snippets.length) {
    return [];
  }

  return [
    { label, kind: vscode.QuickPickItemKind.Separator },
    ...snippets.map((snippet) => createSnippetItem(snippet, favoriteSet, recentSet))
  ];
}

function createSnippetItem(
  snippet: MermaidSnippetTopic,
  favoriteSet: Set<string>,
  recentSet: Set<string>
): SnippetQuickPickItem {
  return {
    label: `${favoriteSet.has(snippet.id) ? '$(star-full) ' : ''}${snippet.label}`,
    description: snippet.description,
    detail: [
      snippet.kind === 'starter' ? 'Starter' : 'Micro snippet',
      snippet.kind === 'starter' ? 'Protected against accidental nested insertion' : undefined,
      recentSet.has(snippet.id) ? 'Recent' : undefined,
      (snippet.slashAliases || []).length ? `/${snippet.slashAliases?.join(', /')}` : undefined
    ].filter(Boolean).join(' • '),
    buttons: [favoriteSet.has(snippet.id) ? FAVORITE_BUTTON : NOT_FAVORITE_BUTTON],
    snippet
  };
}

function isSnippetItem(item: SnippetQuickPickItem | undefined): item is Extract<SnippetQuickPickItem, { snippet: MermaidSnippetTopic }> {
  return Boolean(item && 'snippet' in item);
}
