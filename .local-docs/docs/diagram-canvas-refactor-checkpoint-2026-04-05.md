# Diagram Canvas Refactor Checkpoint — 2026-04-05

## Why this checkpoint exists

The class-diagram canvas had reached a useful product milestone, but too much behavior was concentrated in `src/canvas/DiagramCanvasPanel.ts`. The goal of this refactor pass was **not** to redesign the feature or change UX semantics. The goal was to reduce blast radius and make the next round of work safer.

## What changed in this pass

The old single-file concentration has been split into a first-pass structure:

- `src/canvas/DiagramCanvasPanel.ts`
  - VS Code panel lifecycle
  - message dispatch/orchestration
  - high-level refresh flow
- `src/canvas/diagramCanvasHtml.ts`
  - HTML shell / CSS / root markup
- `src/canvas/diagramCanvasWebviewScript.ts`
  - embedded browser-side canvas app script
- `src/canvas/canvasState.ts`
  - source typing
  - initial source resolution
  - panel title derivation
  - serialized webview state shaping
- `src/canvas/canvasDocumentActions.ts`
  - create file
  - apply to linked/new document
  - re-import from linked document
  - open preview
  - open linked file
- `src/canvas/classDiagramModel.ts`
  - class-diagram model / parse / generate / validate logic

## What improved

### 1. The highest-risk file is no longer a god object

`DiagramCanvasPanel.ts` no longer mixes:

- VS Code lifecycle
- document apply/reimport branching
- giant HTML string generation
- giant embedded browser app script

That alone should make future edits meaningfully safer.

### 2. HTML/script fragility is isolated

The largest interpolation-heavy and runtime-fragile parts of the implementation now live behind explicit builder boundaries:

- `createDiagramCanvasHtml(...)`
- `createDiagramCanvasWebviewScript(...)`

This makes it easier to inspect, reason about, and eventually replace or further split those layers.

### 3. State and document behavior are easier to reason about

Panel-facing UI state and document operations are now separated from panel orchestration. This should make future bugs around linked/unlinked flows easier to isolate.

## What is still risky

### 1. `diagramCanvasWebviewScript.ts` is still very large

The main risk concentration has moved, not disappeared. The browser-side app script still contains a lot of:

- geometry math
- event wiring
- DOM rendering
- canvas state mutation
- minimap/zoom/pan logic
- context-menu/editor behavior

This is a better problem than before, but it is still a real problem.

### 2. Runtime-only webview failures remain a real class of bug

The source guard test helps, but it is not sufficient protection by itself. Bugs involving string interpolation, browser-only behavior, or event-sequencing issues can still slip through TypeScript.

### 3. Document-action behavior is still lightly tested

The extraction improved structure, but not yet coverage. Important flows like linked-vs-unlinked apply, preview behavior, and re-import semantics still deserve more explicit tests.

## Current recommendation

Pause here before doing more broad feature work.

This is a good architectural checkpoint because the code is now split along honest responsibility lines, while behavior is still fresh and known-good.

## Recommended next refactor order

### Near-term / highest value

1. Split `diagramCanvasWebviewScript.ts` internally into smaller pure-helper layers
   - geometry helpers
   - constants/template data
   - DOM/render helpers
   - state mutation helpers

2. Add focused tests around document-action semantics
   - linked file apply
   - unlinked save/apply path
   - preview from linked file vs virtual canvas
   - re-import failure cases

3. Consider whether the webview app should remain a generated embedded script or eventually become a separately bundled frontend entrypoint
   - **Do not do this just because it feels cleaner**
   - only do it if the development/debugging tradeoff is worth the toolchain shift

### Product direction reminder

The product direction still looks right:

- canvas-first visual editing
- generated Mermaid as the underlying source of truth
- `classDiagram` first
- future family-specific expansion only after the class canvas is maintainable enough to carry it

## Validation state at this checkpoint

At the end of this refactor pass:

- `npm run compile` passes
- `npm test` passes
- the canvas webview guard test was updated to follow the extracted HTML builder location

## Suggested next-session starting point

If continuing refactor work, start in `src/canvas/diagramCanvasWebviewScript.ts` and look for the first split that is both:

- behavior-preserving
- obviously mechanical

Good first candidates are pure geometry helpers and small rendering helpers, not event-sequencing rewrites.
