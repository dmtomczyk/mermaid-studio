# Contributing to Mermaid Studio

Thanks for contributing.

This project has grown beyond a tiny MVP, so changes are much easier to review and maintain when they follow the existing structure and update the right supporting files.

## Before you start

Please read:
- `README.md`
- `docs/examples/general.md`
- the relevant source area you plan to touch

If you are working on snippets, hover help, completions, preview/export, or the builder, try to understand the existing registry / utility layers before adding new one-off logic.

## Documentation style

Keep docs lean.

The bias in this repo is:
- slightly less documentation than you think you should add
- but make what remains extremely clear, well written, and easy to find

Good documentation here should do one of three things:
- help users understand the product quickly
- help contributors make the right change with low friction
- preserve genuinely important project knowledge that would otherwise be easy to lose

Avoid adding docs just to make the repo look complete.
If a note is mainly temporary, planning-oriented, or useful only to active maintainers, prefer keeping it in local-only notes rather than public source control.

## Local setup

```bash
npm install
npm test
```

Useful scripts:

```bash
npm run compile
npm test
npm run package
npm run verify:builder-ui
npm run smoke:vsix
npm run harness:builder
npm run capture:builder-ui:desktop
./scripts/dev-host.sh
./scripts/reset-smoke.sh
```

## Project structure

### Shipping/runtime code
- `src/extension.ts` — extension entrypoint / registration
- `src/commands/` — commands
- `src/language/` — completions, hover, diagnostics, formatting, reference navigation
- `src/preview/` — preview model, block splitting, render-state handling, export helpers
- `src/builder/` — builder-side parsing/import support
- `src/webview/builder/` — builder webview source
- `src/registry/` — shared metadata registries (snippets, syntax topics, examples, diagram families)
- `src/utils/` — shared editor/markdown/config helpers

### Syntax/highlighting
- `syntaxes/` — TextMate grammars and Markdown injection grammar
- `language-configuration.json`

### Documentation/examples
- `docs/examples/` — bundled local reference examples shipped with the extension
- `README.md` — public project / user-facing docs

### Tests
- `src/test/suite/` — unit/integration tests used by the VS Code test host

## Generated output
Do **not** commit generated output or local packaging artifacts:
- `dist/`
- `out/`
- `media/vendor/`
- `*.vsix`

These are build/package outputs.

## Where to add things

### Adding or improving snippets
Start here:
- `src/registry/snippetRegistry.ts`

Then update any related docs/tests:
- `src/test/suite/snippetRegistry.test.ts`
- `src/test/suite/snippets.test.ts`
- `README.md` if the UX changed in a user-visible way

Avoid adding a snippet only to one surface unless that is intentional.

### Adding or improving hover/completion/reference help
Start here:
- `src/registry/syntaxRegistry.ts`
- `src/registry/exampleRegistry.ts`
- `src/language/referenceSupport.ts`

Then check the consuming layers:
- `src/language/completionProvider.ts`
- `src/language/hoverProvider.ts`
- `src/language/referenceDefinitionProvider.ts`

If you add a new reference topic, also add/update a bundled example in `docs/examples/`.

### Adding or improving Markdown / preview behavior
Look at:
- `src/preview/blocks.ts`
- `src/preview/documentModel.ts`
- `src/preview/renderState.ts`
- `src/preview/MermaidPreviewPanel.ts`
- `src/preview/svgExport.ts`

Please add or update tests when preview/export behavior changes.

### Adding or improving builder behavior
Look at:
- `src/builder/`
- `src/webview/builder/`

Keep in mind the current support tiers:
- strongest structured editing support is for flowchart + sequence
- other Mermaid families are more source-first

Do not quietly turn the builder into a pretend “full Mermaid visual editor” without making that a deliberate product decision.

For Builder UI sizing/layout changes, explicitly determine whether the change belongs to:
- the shared shell HTML/CSS layer in `src/builder/renderBuilderShell.ts`
- or the dynamic builder webview layer in `src/webview/builder/*`

Then verify the correct packaged artifact before claiming the change is visible.

Recommended Builder UI follow-up after modifying Builder layout/sizing/cards/canvas:
1. `npm run package`
2. `npm run verify:builder-ui`
3. `npm run smoke:vsix` (or `./scripts/reset-smoke.sh && ./scripts/smoke-vsix.sh`)
4. `npm run harness:builder` for the real-shell Builder screenshot matrix
5. `npm run capture:builder-ui` only when you specifically need the environment-sensitive desktop capture path

Builder UI changes should not be described as fully fixed/done until the package, verify, and smoke steps have all been completed, and layout/sizing work should also go through the real-shell harness review path.

### Adding or improving syntax highlighting
Look at:
- `syntaxes/mermaid.tmLanguage.json`
- `syntaxes/mermaidjs.tmLanguage.json`
- `syntaxes/markdown-mermaid.injection.json`

Remember that grammar coloring is theme-driven. Prefer scopes that improve semantic grouping rather than forcing one exact color assumption.

## Testing expectations

If you change behavior, update tests where it makes sense.

Good places to add regression coverage:
- `src/test/suite/builderParser.test.ts`
- `src/test/suite/builderSanitize.test.ts`
- `src/test/suite/previewBlocks.test.ts`
- `src/test/suite/previewModel.test.ts`
- `src/test/suite/renderState.test.ts`
- `src/test/suite/svgExport.test.ts`
- `src/test/suite/snippetRegistry.test.ts`
- `src/test/suite/snippets.test.ts`
- `src/test/suite/referenceSupport.test.ts`

Before opening a PR, please run:

```bash
npm test
```

If packaging-related files changed, also run:

```bash
npm run package
```

## PR guidance

Please keep PRs focused.

Good low-friction contribution areas include:
- bundled examples
- snippets and snippet polish
- docs clarity and wording improvements
- hover/reference coverage
- syntax/highlighting improvements

A strong PR usually includes:
- a clear problem statement
- a small set of related changes
- updated tests for regressions/behavior changes
- updated docs when user-visible behavior changed
- screenshots/GIFs when UI behavior changed

## Design expectations

A few project-level expectations that will make reviews smoother:

- Prefer extending the shared registries over duplicating Mermaid knowledge in multiple places.
- Prefer isolated utilities over embedding large new logic chunks in providers/commands.
- Keep Markdown behavior fence-aware.
- Keep starter/top-level snippet insertion safe.
- Keep local examples useful and shippable.
- Be honest in docs and UI about support tiers and limitations.

## Good first contribution ideas

- expand bundled examples
- improve hover/help wording
- add missing registry topics for Mermaid syntax
- improve syntax highlighting coverage for specific Mermaid families
- improve tests around preview/export/import behavior
- improve README or local examples for clarity

## Questions / proposals

If you are planning a larger change, open an issue or draft PR first.

That is especially helpful for changes involving:
- builder scope/UX
- preview/export model changes
- packaging/runtime changes
- project naming/identity
- major docs reorganization
