# Mermaid Studio

A full Mermaid authoring toolkit for VS Code, with live preview, smart snippets, Markdown support, export, docs, and a visual builder.

Mermaid Studio helps you write Mermaid faster in both standalone Mermaid files and Markdown documents. It combines source-first authoring with preview, slash snippets, bundled examples, SVG export, and structured editing tools for the diagram families that benefit most from them.

## Who this is for

Mermaid Studio is for developers, writers, and teams who want a better Mermaid workflow inside VS Code.

It works especially well if you want to:
- write Mermaid in `.mmd`, `.mermaid`, `.md`, or `.markdown`
- insert diagrams quickly with slash snippets or the snippet browser
- preview and export diagrams without leaving VS Code
- use local examples and reference links while authoring
- use a sidebar builder for flowcharts and sequence diagrams

## Quick start

A good default flow for most users is:

1. Open a `.mmd` / `.mermaid` file, or a Markdown document.
2. Type `/flow`, `/sequence`, `/gantt`, or `/snippet`.
3. Run **Mermaid Studio: Open Preview**.
4. Hover Mermaid keywords for help, or use **Ctrl/Cmd + Click** / **Mermaid Studio: Open Reference for Symbol Under Cursor**.
5. Use the **Builder** sidebar when you want structured editing for flowcharts or sequence diagrams.

## Feature overview

| Area | What Mermaid Studio provides |
| --- | --- |
| Authoring | Mermaid support for `.mmd`, `.mermaid`, `.md`, and `.markdown` |
| Fast insertion | Slash snippets, snippet browser, favorites, recent snippets |
| Preview | Mermaid file preview, Markdown Mermaid block preview, mixed `.mmd` support |
| Export | SVG export with standalone-friendly normalization |
| Learning | Rich hover help, bundled local examples, docs/example commands, Ctrl/Cmd+Click reference navigation |
| Structured editing | Sidebar builder with strongest support for flowchart and sequence diagrams |
| Quality-of-life | Formatting, diagnostics, shorthand conversion, Markdown-aware insertion |

## Screenshots

> If screenshots do not render in your VS Code environment, Mermaid Studio is planned to gain an offline-friendly in-extension visual guide for locked-down environments. The README screenshot strategy is intended primarily for internet-connected installs.

### Slash snippets
Quick insertion for common Mermaid starters and patterns.

![Slash snippets](https://raw.githubusercontent.com/dmtomczyk/mermaid-studio/master/assets/screenshots/slash-snippets.png)

### Live preview
Instant Mermaid rendering while editing.

![Live preview](https://raw.githubusercontent.com/dmtomczyk/mermaid-studio/master/assets/screenshots/live-preview.png)

### Builder sidebar
Structured flowchart and sequence editing in the Builder.

![Builder sidebar](https://raw.githubusercontent.com/dmtomczyk/mermaid-studio/master/assets/screenshots/builder-sidebar.png)

> Screenshot strategy note:
> - README screenshots use public GitHub-hosted image URLs for the native VS Code Details/Marketplace surface.
> - Mermaid Studio is planned to ship an offline-friendly in-extension guide with packaged local screenshots for environments without internet access.
> - The animated GIF can use a separate strategy later if size or Marketplace rendering makes that preferable.

## Features

### Mermaid authoring
- Mermaid syntax support for `.mmd` and `.mermaid`
- Mermaid-aware authoring inside Markdown fenced blocks
- conservative Mermaid formatting
- diagnostics and authoring helpers for common mistakes
- shorthand conversion via **Mermaid Studio: Convert Fast Input to Mermaid**

### Snippets and slash insertion
- static snippets for Mermaid and Markdown
- a snippet browser via **Mermaid Studio: Insert Mermaid Snippet**
- favorites and recent snippets in the browser
- diagram-type-aware slash snippets such as:
  - `/flow`
  - `/sequence`
  - `/participant`
  - `/subgraph`
  - `/gantt`
  - `/task`
  - `/group`
  - `/service`
- `/snippet` to open the full snippet browser from the editor

### Safe starter insertion
Top-level starter snippets are protected so they do not get blindly inserted into an existing Mermaid document or Mermaid block.

If a starter could break the current diagram, Mermaid Studio offers to:
- replace the current Mermaid document or block
- insert below as a new top-level Mermaid block
- cancel

### Preview and export
- live Mermaid preview
- Markdown block preview
- mixed `.mmd` preview support for multiple top-level diagram families
- SVG export from preview
- export-all support when multiple diagrams are rendered
- export normalization for standalone browser-friendly SVG output

### Builder sidebar
- strongest structured editing support for:
  - `flowchart`
  - `sequenceDiagram`
- quick presets
- quick-add forms
- import from active Mermaid/Markdown content when supported
- mini canvas / overview support for the builder-supported families

### Built-in references and examples
- rich hover help with Mermaid explanations and examples
- bundled local examples under `docs/examples/`
- **Mermaid Studio: Open Reference for Symbol Under Cursor**
- **Mermaid Studio: Open Example for Current Diagram Type**
- **Ctrl/Cmd + Click** navigation to bundled local examples for supported tokens

## Diagram support tiers

Not all Mermaid diagram families have the same editing depth.

### Tier 1 — strongest builder/editor support
- flowchart
- sequence

These have the deepest builder support and the most intentional structured-editing UX.

### Tier 2 — strong source-first authoring support
- gantt
- gitGraph
- class
- state
- ER

These have snippets, preview, Markdown integration, hover/help, and completion support, but not the same builder/canvas depth as Tier 1.

### Tier 3 — lighter assist coverage
- architecture
- mindmap
- other Mermaid families supported primarily through source editing + preview

These work best today as source-first diagram types with preview/export/help support rather than full interactive builder depth.

## Commands

### Core commands
- **Mermaid Studio: New Diagram**
- **Mermaid Studio: Open Preview**
- **Mermaid Studio: Preview Mermaid Block in Markdown**
- **Mermaid Studio: Open Builder**
- **Mermaid Studio: Convert Fast Input to Mermaid**
- **Mermaid Studio: Insert Mermaid Snippet**
- **Mermaid Studio: Format Mermaid Document**
- **Mermaid Studio: Export Preview as SVG**
- **Mermaid Studio: Extract Mermaid Block to File**

### Reference commands
- **Mermaid Studio: Open Reference for Symbol Under Cursor**
- **Mermaid Studio: Open Example for Current Diagram Type**

## Settings

### `mermaidstudio.markdownFenceLanguage`
Fence language used when Mermaid is inserted into Markdown.

Default:
- `mermaid`

Available values:
- `mermaid`
- `mermaidjs`

### `mermaidstudio.insertMarkdownFencesByDefault`
Wrap Mermaid output in Markdown fenced blocks when working in Markdown files.

Default:
- `true`

### `mermaidstudio.preview.autoRefresh`
Automatically refresh Mermaid previews when source text changes.

Default:
- `true`

### `mermaidstudio.preview.debounceMs`
Debounce delay for live preview refreshes.

Default:
- `250`

## Local examples

Bundled example docs live in:
- `docs/examples/flowchart.md`
- `docs/examples/sequence.md`
- `docs/examples/class.md`
- `docs/examples/state.md`
- `docs/examples/er.md`
- `docs/examples/gantt.md`
- `docs/examples/mindmap.md`
- `docs/examples/gitgraph.md`
- `docs/examples/architecture.md`
- `docs/examples/general.md`

These examples are shipped with the extension and do not depend on a user checking out this repository.

## Project docs

- `CONTRIBUTING.md` — contributor setup and contribution guidance
- `CHANGELOG.md` — release notes/history
- `ROADMAP.md` — forward-looking product and technical roadmap
- `SECURITY.md` — security reporting policy

## Limitations

- Builder import support is intentionally scoped and is not a full Mermaid parser.
- Visual editing depth is strongest for flowcharts and sequence diagrams.
- Mermaid family behavior can still vary, especially for advanced syntax.
- TextMate grammar highlighting is broad, but Mermaid syntax is large and evolving, so some constructs may still receive lighter highlighting than others.

## Local development

```bash
npm install
npm test
npm run package
```

Useful scripts:
- `npm run compile`
- `npm test`
- `npm run package`

The project now uses bundled runtime output for shipping builds.
Generated output is not intended to be committed:
- `dist/`
- `out/`
- `media/vendor/`

## Contributing

If you want to contribute, start with:
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `ROADMAP.md`

That guide covers:
- local setup
- testing and packaging
- project structure
- where to add snippets/help/examples/highlighting
- contributor expectations for PRs

## Reporting bugs or proposing changes

For bugs and features, please use the GitHub issue templates.

The most helpful reports include:
- Mermaid source or Markdown snippet that reproduces the issue
- whether the problem occurs in `.mmd`, `.mermaid`, or Markdown
- expected behavior vs actual behavior
- screenshots or exported SVG samples when relevant

For security-sensitive issues, please see:
- `SECURITY.md`

## License

MIT
