# Builder Real-Shell Harness Plan

Date: 2026-04-04

## Why this plan exists

> Status note: several parts of this plan are now complete.
>
> Completed:
> - shared shell extraction into `src/builder/renderBuilderShell.ts`
> - provider updated to use the shared shell renderer
> - browser host stub proof-of-boot
> - real-shell Builder screenshot commands wired into `package.json`
>
> Still useful in this document:
> - the maintenance model
> - the architectural rationale
> - the anti-patterns to avoid
> - remaining cleanup/follow-up guidance

The first Builder browser harness proved useful as a fast experiment, but it is not visually trustworthy enough for real layout review because it does **not** render the actual Builder shell from the extension.

The next step should therefore be a **real-shell browser harness** that reuses the same Builder shell source as VS Code and stubs only the minimum host APIs required to boot the webview.

The goal is to improve fidelity **without** creating a maintenance trap.

## Core principle

> **Share the shell, stub the host.**

That means:

### Shared between VS Code and browser harness

- Builder HTML structure
- Builder CSS
- bundled browser-side Builder runtime (`dist/webview/builder.js`)
- UI class names / responsive behavior / section layout

### Stubbed only in browser harness

- `acquireVsCodeApi()`
- `getState()` / `setState()`
- `postMessage()` host bridge
- canned host replies for `editorStatus` and `loadDiagramState`

This avoids the main failure mode of the first harness: shell drift.

## Explicit non-goal

Do **not** build a second Builder shell by copying HTML/CSS into a browser-only harness template.

That would create exactly the maintenance problem we want to avoid.

## Current architecture findings

### Real Builder shell today

The real shared Builder shell now lives in:

- `src/builder/renderBuilderShell.ts`

The provider still owns VS Code-specific host behavior, but the shell renderer now owns:

- full HTML document structure
- inline CSS
- script tag placement for Mermaid runtime and Builder bundle

The provider remains responsible for:

- webview CSP/nonce details
- VS Code asset URI computation
- host message handling

### Browser-side runtime today

The real browser-side Builder runtime is already modular and harness-friendly:

- `src/webview/builder/index.ts`
- `src/webview/builder/*`

It expects only:

- `acquireVsCodeApi()`
- `mermaid`
- host messages like `editorStatus` and `loadDiagramState`

That message surface is small and suitable for a harness stub.

## Plan overview

## Phase 1 — Extract the Builder shell into shared code

### Objective

Move the real Builder HTML/CSS shell out of `MermaidBuilderViewProvider.ts` into a shared renderer so both:

- VS Code webview provider
- browser harness

can use the same source of truth.

### Proposed module

```text
src/builder/renderBuilderShell.ts
```

### Proposed API

```ts
interface BuilderShellRenderOptions {
  mermaidScriptSrc: string;
  builderScriptSrc: string;
  cspSource?: string;
  nonce?: string;
  hostKind: 'vscode-webview' | 'browser-harness';
}

export function renderBuilderShell(options: BuilderShellRenderOptions): string;
```

### Notes

- keep one HTML/CSS source
- keep CSP handling conditional only where necessary
- avoid embedding VS Code-specific URI logic in the shell body itself
- make the provider responsible only for computing VS Code-specific asset URLs

### Definition of done

- `MermaidBuilderViewProvider.ts` no longer owns the large inline shell directly
- browser harness can call the same renderer with normal relative URLs
- shell changes happen in one place only

## Phase 2 — Keep the provider thin

### Objective

Reduce `MermaidBuilderViewProvider.ts` to:

- host message handling
- editor/import integration
- asset URL computation
- call into shared shell renderer

### Target shape

Provider should mainly do:

- compute `mermaidScriptUri`
- compute `builderScriptUri`
- compute nonce/CSP bits
- call `renderBuilderShell(...)`
- handle `onDidReceiveMessage(...)`

### Definition of done

- provider remains the extension host bridge
- it no longer owns a separate shell template that can drift

## Phase 3 — Add a tiny browser host shim

### Objective

Let the real Builder webview runtime boot in a normal browser.

### Proposed files

```text
harness/builder-real/
  bootstrap.ts
  hostStub.ts
  states.ts
  index.html (or generated shell output entry)
```

### `hostStub.ts` responsibilities

Provide a tiny implementation of:

- `window.acquireVsCodeApi()`
- `getState()`
- `setState()`
- `postMessage()`

### `postMessage()` harness behavior

Support a small subset:

- `requestEditorStatus` → respond with canned `editorStatus`
- `importActiveDocument` → respond with canned `loadDiagramState`
- `copy` → optional console log/no-op
- `insert` → no-op/status banner
- `createFile` → no-op/status banner
- `openPreview` → no-op/status banner
- `showError` → show console/status error in harness

This should remain intentionally small.

### Definition of done

- the real Builder bundle boots in browser
- the real shell renders without crashing
- host interactions are stubbed minimally

## Phase 4 — Feed real-shell test states

### Objective

Use the actual Builder host message seam to load fixture states for layout review.

### Fixture states to keep

- `flowchart-empty`
- `flowchart-busy`
- `sequence-empty`
- `sequence-busy`
- `imported-mixed-stress`

### Viewports to keep

- `540` — comfortable real pane
- `420` — narrow but normal
- `360` — lower threshold that must function well
- `320` — stress width

### Data flow recommendation

Prefer loading fixtures through the same shape the provider already uses:

```ts
{ type: 'loadDiagramState', state, info, warnings }
```

This keeps the harness aligned with the extension’s actual host/webview contract.

## Phase 5 — Replace Builder screenshot truth path

### Objective

Make the real-shell harness the actual Builder screenshot path.

### Resulting command behavior

- `npm run harness:builder` → captures real-shell Builder screenshots
- current synthetic Builder harness should either:
  - be retired, or
  - be renamed clearly as exploratory/dev-only

### Definition of done

- Builder/browser screenshots are close enough to real VS Code webview output to be useful
- visual regression review is anchored to the shared shell source

## Maintenance model

### What should stay easy over time

If this plan is followed, most Builder UI changes should require touching only one shared shell source.

Examples:

- add a section
- rename a button
- tweak spacing
- update breakpoints
- change compact-card layout

These should automatically benefit both:

- extension webview
- browser harness

### What may still need small harness updates

When new host-dependent behaviors are added, the browser stub may need a small update.

Examples:

- new host message type
- new boot-time hydration requirement
- new host-driven status/event

That is acceptable as long as the shell remains shared.

## Anti-patterns to avoid

### 1. Separate browser-only Builder shell

Do not reintroduce a second HTML/CSS template.

### 2. Separate responsive CSS source

Do not fork breakpoints into harness-only CSS.

### 3. Large fake-VS-Code runtime

Do not grow the stub into a fake platform.
Keep it to persistence + small message bridge.

### 4. Harness-only DOM hacks to approximate provider markup

If a feature needs shell changes, change the shared shell source instead.

## Recommended immediate implementation order

Completed foundation:
1. extract shared shell renderer from `MermaidBuilderViewProvider.ts`
2. update provider to consume shared shell renderer
3. add browser host stub + real-shell boot proof
4. capture a single proof screenshot
5. restore full real-shell matrix capture

Remaining useful follow-up:
1. continue validating fidelity against actual VS Code Builder presentation
2. keep the browser stub small as Builder host capabilities evolve
3. decide later whether the synthetic harness should be fully retired
4. continue improving contributor docs/checklists around the real-shell path

## Success criteria

This plan is successful if:

- the Builder browser harness renders the **actual** shared shell
- screenshots are materially closer to real VS Code Builder output
- future Builder shell changes automatically affect both extension and harness
- the browser harness remains lightweight instead of becoming a fake IDE

## Recommendation

Proceed only with a **shared-shell** real-Builder harness.

If shared-shell extraction proves unexpectedly hard, prefer a thinner real-provider replay approach over building another duplicated harness shell.
