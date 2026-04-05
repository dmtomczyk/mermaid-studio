<p align="center">
  <img src="https://raw.githubusercontent.com/dmtomczyk/mermaid-studio/master/media/mermaid-studio.png" alt="Mermaid Studio" width="160">
</p>

<h1 align="center">Mermaid Studio</h1>

<p align="center">
  A Mermaid toolkit for VS Code with preview, snippets, export, examples, and a Builder for supported diagram families.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=daymian.mermaid-studio"><strong>VS Code Marketplace</strong></a>
  ·
  <a href="https://github.com/dmtomczyk/mermaid-studio"><strong>GitHub Repository</strong></a>
  ·
  <a href="https://mermaid.js.org/"><strong>Learn Mermaid</strong></a>
</p>

## Quick start

1. Open a `.mmd`, `.mermaid`, or Markdown file.
2. Type `/flow`, `/sequence`, or `/snippet`.
3. Run **Mermaid Studio: Open Preview**.
4. Use the **Builder** sidebar when you want structured editing for flowcharts or sequence diagrams.

## Features

| Feature | What it gives you | Available in |
| --- | --- | --- |
| Authoring | Mermaid support for `.mmd`, `.mermaid`, `.md`, and `.markdown`, plus formatting and diagnostics | Mermaid + Markdown |
| Snippets & slash insertion | Fast insertion with slash commands, snippet browser, favorites, and recent snippets | Mermaid + Markdown |
| Preview & export | Mermaid file preview, Markdown block preview, mixed `.mmd` support, and SVG export | Preview workflows |
| Builder sidebar | Structured editing for supported diagram families with presets, forms, import support, and a visual overview | Flowchart + Sequence |
| References & learning | Rich hover help, bundled examples, and command-driven reference/example navigation | Mermaid + Markdown |

### Diagram support

> `✅` = targeted/strong support in Mermaid Studio  
> `◐` = source-first or lighter assist coverage  
> `—` = no dedicated feature beyond general Mermaid editing/runtime support

| Diagram family | Snippets / insertion | Preview | SVG export | Builder |
| --- | --- | --- | --- | --- |
| Flowchart | ✅ | ✅ | ✅ | ✅ |
| Sequence | ✅ | ✅ | ✅ | ✅ |
| Class | ✅ | ✅ | ✅ | — |
| State | ✅ | ✅ | ✅ | — |
| ER | ✅ | ✅ | ✅ | — |
| Gantt | ✅ | ✅ | ✅ | — |
| GitGraph | ✅ | ✅ | ✅ | — |
| Architecture | ✅ | ✅ | ✅ | — |
| Mindmap | ✅ | ✅ | ✅ | — |
| Journey | ◐ | ✅ | ✅ | — |
| Pie | ◐ | ✅ | ✅ | — |
| Requirement | ◐ | ✅ | ✅ | — |
| Timeline | ◐ | ✅ | ✅ | — |
| Kanban | ◐ | ✅ | ✅ | — |
| Quadrant chart | ◐ | ✅ | ✅ | — |
| XY chart | ◐ | ✅ | ✅ | — |
| Sankey | ◐ | ✅ | ✅ | — |
| Block | ◐ | ✅ | ✅ | — |
| Packet | ◐ | ✅ | ✅ | — |
| Treemap | ◐ | ✅ | ✅ | — |
| ZenUML | ◐ | ✅ | ✅ | — |
| C4 | ◐ | ✅ | ✅ | — |

## Screenshots

### Slash snippets
Quick insertion for common Mermaid starters and patterns.

<img src="https://raw.githubusercontent.com/dmtomczyk/mermaid-studio/master/assets/screenshots/slash-snippets.png" alt="Slash snippets" width="900">

### Builder sidebar and live preview
Structured flowchart and sequence editing in a side panel with presets, quick-add forms, import support, and a visual overview, alongside live preview.

<img src="https://raw.githubusercontent.com/dmtomczyk/mermaid-studio/master/assets/screenshots/builder-sidebar.png" alt="Builder sidebar and live preview" width="900">

## Commands

### Common commands
- **Mermaid Studio: New Diagram**
- **Mermaid Studio: Open Preview**
- **Mermaid Studio: Preview Mermaid Block in Markdown**
- **Mermaid Studio: Open Builder**
- **Mermaid Studio: Insert Mermaid Snippet**
- **Mermaid Studio: Export Preview as SVG**

### Additional commands
- **Mermaid Studio: Format Mermaid Document**
- **Mermaid Studio: Extract Mermaid Block to File**
- **Mermaid Studio: Open Reference for Symbol Under Cursor**
- **Mermaid Studio: Open Example for Current Diagram Type**

## Settings

| Setting | Purpose | Default |
| --- | --- | --- |
| `mermaidstudio.markdownFenceLanguage` | Fence language used when Mermaid is inserted into Markdown | `mermaid` |
| `mermaidstudio.insertMarkdownFencesByDefault` | Wrap Mermaid output in Markdown fenced blocks when working in Markdown files | `true` |
| `mermaidstudio.preview.autoRefresh` | Automatically refresh Mermaid previews when source text changes | `true` |
| `mermaidstudio.preview.debounceMs` | Debounce delay for live preview refreshes | `250` |

## Known limitations

- Builder import support is intentionally scoped and is not a full Mermaid parser.
- Visual editing depth is strongest for flowcharts and sequence diagrams.
- Mermaid family behavior can still vary, especially for advanced syntax.
- TextMate grammar highlighting is broad, but Mermaid syntax is large and evolving, so some constructs may still receive lighter highlighting than others.

## Local development

If you want to build or test Mermaid Studio locally, you will need a standard Node.js / npm workflow.

### Recommended development loop

For active feature work, prefer the **Extension Development Host** loop:

```bash
npm install
npm run compile
# then press F5 in VS Code
```

For package validation or release prep:

```bash
npm test
npm run package
```

### Canvas debug build

The Diagram Canvas has temporary viewport/debug instrumentation available behind a simple build-time flag:

```bash
DEBUG=1 npm run compile
```

A normal build does **not** include the debug panel.

### Webview guardrail

The Diagram Canvas HTML is currently generated from a large embedded webview template string. Because browser-side script escaping bugs can slip past TypeScript and only fail at runtime, the test suite includes a source guard:

- `src/test/suite/canvasWebviewGuards.test.ts`

That guard is intended to catch fragile embedded-script patterns early (for example raw regex/script snippets that tend to break once interpolated into the webview HTML string).

### Useful commands

```bash
npm run compile
npm test
npm run package
```

If those commands are unfamiliar, learn the basics of:
- cloning a Git repository
- installing Node.js and npm dependencies
- running npm scripts from a terminal

For security-sensitive issues, please see:
- `SECURITY.md`

## License

MIT
