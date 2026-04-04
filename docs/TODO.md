# TODO

## Open follow-ups

- [ ] Preview block splitting for mixed `.mmd` files still relies on top-level root-keyword heuristics rather than a formal Mermaid parser.
  - Good enough for current MVP behavior, but it should keep regression coverage and eventually move into a clearer preview/render-state utility layer.
- [ ] Packaging cleanup is mostly done, but the manifest still lacks a `repository` field.
  - Phase 3 bundling landed: package size dropped from roughly `7449 files / 22.15MB` to about `28 files / 912KB`.
  - The remaining `vsce package` warning is now the missing repository metadata rather than package bloat.
- [ ] Non-Tier-1 diagram families are still more source-first than builder-first.
  - The README now documents that support asymmetry, but the builder UI should eventually make that distinction more explicit too.

## Phase 3 implementation notes

- Bundler chosen: `esbuild`
- Runtime packaging now uses bundled artifacts under `dist/`
  - `dist/extension.js`
  - `dist/webview/builder.js`
- Mermaid runtime is vendored at build time to `media/vendor/mermaid.min.js`
- `.vscodeignore` now excludes dev-only trees like `src/**`, `out/**`, `node_modules/**`, `scripts/**`, maps, local VS Code folders, and refactor planning docs
- Current `vsce package` result after bundling: about `28 files / 912KB`

## Backlog

- [ ] Add an **offline browser-harness validation pass** for shipped Mermaid snippets/examples.
  - Goal: verify that core starter snippets and selected diagram examples actually render/parse in a real browser-like environment using the local Mermaid package.
  - Keep it **offline-first**: no external APIs or internet required once local dependencies are installed.
  - Preferred scope:
    - validate representative starters for flowchart, sequence, class, state, ER, gantt, mindmap, gitGraph, and architecture
    - validate both raw Mermaid snippets and Markdown-fenced Mermaid examples where practical
    - surface failures with the exact snippet/example source that broke
  - Important prior finding:
    - a direct Node/test-host parse check using Mermaid's local package was attempted, but was flaky in the VS Code test environment because of Mermaid / DOMPurify behavior
    - future implementation should prefer a more browser-realistic local harness rather than relying on the current extension-host Mocha environment
