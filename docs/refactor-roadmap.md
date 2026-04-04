# refactor-roadmap.md

## Mermaid Studio — actionable refactor roadmap

Date: 2026-04-03

This roadmap translates `status-review.md` into a practical sequence of refactors that improves maintainability without freezing product progress.

---

## Goals

The next refactor pass should:

1. reduce duplication across snippets/help/completions/examples
2. make the builder webview easier to change safely
3. improve packaging and repo shape
4. strengthen correctness in the highest-risk areas
5. preserve existing user-visible features while restructuring internals

---

## Working principles

- Prefer **small staged refactors** over a rewrite.
- Preserve behavior first, then simplify.
- Add tests around unstable behavior before or during refactors.
- Keep shipping useful improvements, but route them through the new structure once each area is refactored.
- Treat flowchart + sequence as Tier 1 features; do not pretend every Mermaid family has equal builder depth.

---

# Phase 0 — Stabilization baseline

## Objective

Create a safer starting point before structural changes.

## Tasks

- [x] Add a short repo note in README or docs clarifying support tiers:
  - Tier 1: flowchart, sequence
  - Tier 2: gantt, gitGraph, class, state, ER
  - Tier 3: architecture, mindmap, others
- [x] Add targeted tests for current fragile behavior:
  - mixed `.mmd` files with multiple diagram families
  - builder state sanitization for stale sequence messages
  - preview block splitting logic
  - export state behavior for current vs all diagrams
- [x] Audit open builder/preview bugs and record unresolved ones in `TODO.md`

## Done means

- current behavior is documented
- known fragile areas have at least minimal regression coverage
- refactors can proceed with less fear of invisible breakage

## Priority

**Immediate**

---

# Phase 1 — Split the builder webview into modules

## Objective

Break up `media/builder.js` into smaller, coherent units.

## Why first

This is the biggest maintainability hotspot and the biggest source of “fix one thing, break two others” risk.

## Target structure

Suggested structure:

```text
src/webview/builder/
  index.ts
  state.ts
  sanitize.ts
  generate.ts
  persistence.ts
  forms.ts
  renderFlowCanvas.ts
  renderSequenceOverview.ts
  renderPreview.ts
  validation.ts
  types.ts
```

## Tasks

- [x] Introduce builder-specific types for:
  - flow nodes/edges
  - sequence participants/messages
  - canvas view state
  - builder mode
- [x] Move sanitization logic into `sanitize.ts`
- [x] Move Mermaid source generation into `generate.ts`
- [x] Move flow canvas rendering into `renderFlowCanvas.ts`
- [x] Move sequence overview rendering into `renderSequenceOverview.ts`
- [x] Move DOM event wiring into `forms.ts`
- [x] Move persistence logic into `persistence.ts`
- [x] Replace raw `media/builder.js` authoring with compiled TypeScript output

## Done means

- no single webview file is doing everything
- builder logic is testable in smaller units
- future builder work does not require editing a giant script blob

## Priority

**Highest**

---

# Phase 2 — Create a central Mermaid metadata registry

## Objective

Eliminate duplicated Mermaid knowledge across snippets, completions, hover docs, and local examples.

## Why

This is the root fix for drift and inconsistency.

## Target structure

Suggested structure:

```text
src/registry/
  diagramRegistry.ts
  syntaxRegistry.ts
  exampleRegistry.ts
  snippetRegistry.ts
```

## Suggested model

```ts
interface MermaidTopic {
  id: string;
  title: string;
  diagramTypes?: string[];
  docsUrl?: string;
  localExampleTopic?: string;
  hoverBody?: string;
  examples?: string[];
  completion?: {
    insertText: string;
    detail?: string;
    kind?: string;
  };
  snippet?: {
    label: string;
    body: string;
    markdownBody?: string;
  };
}
```

## Tasks

- [x] Define a registry for diagram families and syntax topics
- [x] Migrate hover content to read from the registry
- [x] Migrate completion content to read from the registry
- [x] Migrate command-based snippet definitions to read from the registry
- [ ] Optionally generate static JSON snippets from the same data source
- [x] Map local example files from registry topics instead of ad hoc inference

## Done means

- a syntax/topic exists in one place first
- hover, completion, snippets, and examples no longer drift independently

## Priority

**Highest**

---

# Phase 3 — Bundle the extension and webview

## Objective

Fix packaging/performance debt before it grows further.

## Tasks

- [x] Introduce bundling via `esbuild` or `tsup`
- [x] Bundle extension host code into a compact output
- [x] Bundle webview code separately
- [x] Update scripts for compile/package flow
- [x] Tighten `.vscodeignore`
- [x] Recheck VSIX size and packaging warnings

## Done means

- packaging warnings are materially reduced
- output footprint is smaller and cleaner
- startup and packaging are more predictable

## Priority

**High**

---

# Phase 4 — Refactor preview/render-state model

## Objective

Make preview behavior easier to reason about and test.

## Tasks

- [x] Extract Mermaid file splitting into a dedicated utility
- [x] Extract Markdown preview block selection into a dedicated utility
- [x] Formalize preview render state shape:
  - active block
  - rendered entries
  - exportable SVGs
- [x] Add tests for:
  - single-diagram files
  - mixed multi-diagram `.mmd` files
  - Markdown with multiple Mermaid fences
  - active-block selection based on cursor location

## Done means

- preview logic is less ad hoc
- export behavior is backed by clearer render-state semantics

## Priority

**High**

---

# Phase 5 — Strengthen correctness testing in risky areas

## Objective

Move beyond structural tests toward behavior that better reflects real use.

## Tasks

- [ ] Add more tests around builder sanitization behavior
- [ ] Add more tests around importer behavior for supported families
- [ ] Add tests for mixed-family `.mmd` preview splitting
- [ ] Add tests for sequence builder message validation
- [ ] Keep the offline browser-harness validation task in backlog until Phase 1–4 are stable enough to support it cleanly

## Done means

- tests meaningfully cover the places users are most likely to find bugs
- fewer regressions depend on screenshot-based debugging

## Priority

**High**

---

# Phase 6 — Clarify UX by support tier

## Objective

Align the product/UI with what the extension actually supports well.

## Tasks

- [ ] Update docs to explicitly describe support tiers
- [ ] Adjust builder labels/empty states to reflect mode capability:
  - flowchart = full visual canvas
  - sequence = structured editing + overview
  - others = source-first guidance
- [ ] Make non-Tier-1 builder surfaces intentionally explanatory rather than implicitly incomplete

## Done means

- user expectations match implementation reality
- fewer “why doesn’t this canvas do X for gantt?” moments

## Priority

**Medium**

---

# Phase 7 — Offline browser-harness validation

## Objective

Add realistic offline validation of shipped snippets/examples against actual Mermaid rendering in a browser-like environment.

## Notes

This is already captured in `TODO.md` and should remain **offline-first**.

## Tasks

- [ ] Build a local harness that uses installed Mermaid dependencies only
- [ ] Validate representative snippets/examples from major diagram families
- [ ] Capture exact snippet/example source on failure
- [ ] Avoid relying on the current VS Code extension-host Mocha environment for Mermaid parser realism

## Done means

- real Mermaid rendering validation exists without internet dependency
- snippet/example regressions are caught earlier and more realistically

## Priority

**Medium, after Phases 1–5**

---

## Suggested execution order

Recommended order:

1. Phase 0 — Stabilization baseline
2. Phase 1 — Split builder webview
3. Phase 2 — Central metadata registry
4. Phase 3 — Bundling
5. Phase 4 — Preview/render-state cleanup
6. Phase 5 — Stronger correctness testing
7. Phase 6 — Support-tier UX clarity
8. Phase 7 — Offline browser-harness validation

---

## What not to do right now

Avoid these until the refactor foundation is in place:

- broadening builder import to many more Mermaid families
- adding heavy visual editors for every diagram family
- building an LSP/server architecture prematurely
- continuing to grow hover/completion/snippet content independently in multiple files
- shipping many more features into `media/builder.js` without first splitting it

---

## Success criteria for the next major pass

A successful next pass should result in:

- smaller, more understandable builder/webview code
- one shared source of Mermaid syntax/help/snippet truth
- cleaner packaging
- stronger regression coverage where users actually hit bugs
- clearer product expectations by diagram family

If those happen, future feature work should become noticeably faster and less fragile.
