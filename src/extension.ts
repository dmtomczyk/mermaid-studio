import * as vscode from 'vscode';
import { MermaidBuilderViewProvider } from './builder/MermaidBuilderViewProvider';
import { registerConvertFastInputCommand } from './commands/convertFastInput';
import { registerExportSvgCommand } from './commands/exportSvg';
import { registerExtractMermaidBlockCommand } from './commands/extractMermaidBlock';
import { registerFormatMermaidDocumentCommand } from './commands/formatMermaidDocument';
import { registerInsertSnippetCommand } from './commands/insertSnippet';
import { registerNewDiagramCommand } from './commands/newDiagram';
import { registerOpenBuilderCommand } from './commands/openBuilder';
import { registerOpenPreviewCommand } from './commands/openPreview';
import { registerPreviewMarkdownBlockCommand } from './commands/previewMarkdownBlock';
import { registerOpenReferenceExampleCommand } from './commands/openReferenceExample';
import { registerOpenReferenceForSymbolCommand } from './commands/openReferenceForSymbol';
import { registerOpenCurrentDiagramExampleCommand } from './commands/openCurrentDiagramExample';
import { CommandContext } from './commands/types';
import { MermaidCompletionProvider } from './language/completionProvider';
import { MermaidReferenceDefinitionProvider } from './language/referenceDefinitionProvider';
import { MermaidDiagnostics } from './language/diagnostics';
import { MermaidFormattingProvider } from './language/formatter';
import { MermaidHoverProvider } from './language/hoverProvider';
import { MermaidPreviewPanel } from './preview/MermaidPreviewPanel';
import { getConfig } from './utils/config';

let previewRefreshTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const diagnostics = new MermaidDiagnostics();
  const builderProvider = new MermaidBuilderViewProvider(context.extensionUri);
  const commandContext: CommandContext = {
    extensionUri: context.extensionUri,
    diagnostics,
    builderProvider
  };

  context.subscriptions.push(
    diagnostics,
    vscode.window.registerWebviewViewProvider(MermaidBuilderViewProvider.viewType, builderProvider),
    registerNewDiagramCommand(context),
    registerOpenPreviewCommand(commandContext),
    registerPreviewMarkdownBlockCommand(commandContext),
    registerOpenBuilderCommand(),
    registerOpenReferenceExampleCommand(context.extensionUri),
    registerOpenReferenceForSymbolCommand(context.extensionUri),
    registerOpenCurrentDiagramExampleCommand(context.extensionUri),
    registerConvertFastInputCommand(commandContext),
    registerInsertSnippetCommand(context),
    registerFormatMermaidDocumentCommand(),
    registerExportSvgCommand(),
    registerExtractMermaidBlockCommand(),
    vscode.languages.registerCompletionItemProvider(
      [{ language: 'mermaid' }, { language: 'mermaidjs' }, { language: 'markdown' }],
      new MermaidCompletionProvider(context),
      ' ', ':', '-', '|', '/'
    ),
    vscode.languages.registerHoverProvider(
      [{ language: 'mermaid' }, { language: 'mermaidjs' }, { language: 'markdown' }],
      new MermaidHoverProvider()
    ),
    vscode.languages.registerDefinitionProvider(
      [{ language: 'mermaid' }, { language: 'mermaidjs' }, { language: 'markdown' }],
      new MermaidReferenceDefinitionProvider(context.extensionUri)
    ),
    vscode.languages.registerDocumentFormattingEditProvider('mermaid', new MermaidFormattingProvider()),
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
        builderProvider.notifyEditorContextChanged();
      }

      if (!MermaidPreviewPanel.current || !getConfig().previewAutoRefresh) {
        return;
      }
      debouncePreviewRefresh(async () => {
        await MermaidPreviewPanel.current?.handleDocumentChanged(event.document);
      });
    }),
    vscode.window.onDidChangeTextEditorSelection(async (event) => {
      builderProvider.notifyEditorContextChanged();

      if (!MermaidPreviewPanel.current || !getConfig().previewAutoRefresh) {
        return;
      }
      MermaidPreviewPanel.current.updateSelection(event.textEditor);
      debouncePreviewRefresh(async () => {
        await MermaidPreviewPanel.current?.refresh();
      });
    }),
    vscode.window.onDidChangeActiveTextEditor(() => {
      builderProvider.notifyEditorContextChanged();
    })
  );
}

export function deactivate(): void {
  if (previewRefreshTimer) {
    clearTimeout(previewRefreshTimer);
  }
}

function debouncePreviewRefresh(callback: () => Promise<void>): void {
  if (previewRefreshTimer) {
    clearTimeout(previewRefreshTimer);
  }

  previewRefreshTimer = setTimeout(() => {
    callback().catch((error) => {
      console.error('Failed to refresh Mermaid preview', error);
    });
  }, getConfig().previewDebounceMs);
}
