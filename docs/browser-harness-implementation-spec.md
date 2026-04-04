# Browser Harness Implementation Spec

Date: 2026-04-04

> Status note: this document began as the original harness implementation spec. The Mermaid validation path remains accurate, but the Builder path has since been promoted from a synthetic browser shell to a shared-shell **real-shell** harness. Where this document conflicts with the newer real-shell approach, prefer `docs/builder-real-shell-harness-plan.md` and the current `package.json` scripts.

## Purpose

Add a local browser harness to Mermaid Studio for two complementary goals:

1. **responsive Builder layout review** in a real browser
2. **offline browser-realistic Mermaid validation** for shipped snippets/examples

This harness is intended to complement—not replace—the existing extension/package verification flow.

## Non-goals

This harness should **not** try to:

- simulate VS Code perfectly
- replace packaged VSIX smoke tests
- re-host the full extension activation/runtime model
- become a fake webview framework
- validate every UI state or every Mermaid example on day one

## Existing validation layers to keep

These remain the source of truth for extension integration:

- `npm run package` — build the shipped VSIX
- `npm run verify:builder-ui` — verify bundled Builder/UI artifacts inside the VSIX
- `npm run smoke:vsix` — run isolated VS Code smoke install/launch

The browser harness adds a new layer:

- `npm run harness:builder` — shared-shell **real-shell** Builder layout review
- `npm run harness:builder:single` — single real-shell Builder capture
- `npm run harness:mermaid` — browser-realistic Mermaid render validation
- optional later: `npm run harness:check` — run both

Historical/dev-only path:

- `npm run harness:builder:synthetic` — earlier synthetic Builder harness retained only for exploratory use

## Why this is worth doing

This is a sensible dev/test pattern for Mermaid Studio because:

- the current desktop capture path is flaky
- the Builder is webview-heavy enough to justify browser-native review
- browser-level Mermaid validation is already desirable for shipped examples/snippets
- one investment supports both Builder review and Mermaid render validation

## v1 boundary

Version 1 should do only two things:

1. render Builder review states in a browser harness
2. render representative Mermaid cases in a real browser using the local Mermaid package

The original Builder v1 started as a standalone synthetic shell, but the project has since moved to a better path: a shared-shell **real-shell** Builder harness with a tiny host stub. That still fits the v1 spirit because it avoids a fake IDE/runtime while using the real Builder shell and runtime.

If a proposed addition starts pulling in broad VS Code lifecycle simulation, command routing, or a fake extension-host platform, it is probably outside the intended boundary.

## Suggested repo shape

```text
harness/
  builder/
    index.html
    main.ts
    styles.css
    states.ts
  mermaid/
    index.html
    main.ts
    cases.ts
  shared/
    viewportPresets.ts
scripts/
  harness-build.mjs
  harness-dev.mjs
  harness-capture.mjs
  harness-validate.mjs
.artifacts/
  harness/
```

## Code sharing vs duplication

### Share/extract

Share only browser-safe logic/data that is genuinely reusable:

- Builder state types where helpful
- Builder sanitization/generation helpers only if they are browser-safe and low-friction to reuse
- curated Builder fixture/state data
- Mermaid example/snippet source fixtures
- viewport preset definitions

Likely good candidates to reuse or mirror carefully:

- `src/webview/builder/types.ts`
- `src/webview/builder/sanitize.ts`
- `src/webview/builder/generate.ts`
- registry/example source data where browser-safe

### Do not share into harness v1

Avoid dragging extension-host code into the harness:

- `src/builder/MermaidBuilderViewProvider.ts`
- extension activation code
- command registration/plumbing
- anything that depends on `vscode`

### Acceptable duplication

For v1, small harness-only duplication is acceptable for:

- a simple browser shell/page layout
- state switching UI
- screenshot bootstrapping
- result reporting UI

This is preferable to over-coupling the harness to extension-only concerns.

## Viewport presets for v1

The viewport set should reflect realistic VS Code pane widths rather than full-window editor widths:

- `540` — comfortable real-pane width
- `420` — narrow but still normal
- `360` — lower threshold that **must function well at or above**
- `320` — stress width; degradation is acceptable, breakage is not

### Builder width standard

For Builder/browser review, treat:

- `360px+` as the practical lower bound for **must function well**
- `320px` as a stress case for collapse/overflow review

At `360px` and above, the Builder should remain:

- readable
- usable
- free of overlapping/clipped critical UI
- visually intentional rather than broken-looking

## Builder states for v1

The first Builder states should focus on revealing layout breakage rather than broad feature coverage:

1. `flowchart-empty`
2. `flowchart-busy`
3. `sequence-empty`
4. `sequence-busy`
5. `imported-mixed-stress`

### State intent

- **empty** states test baseline spacing and form layout
- **busy** states test dense controls, rows, chips, action buttons, overflow
- **mixed stress** tests awkward labels/content and imported-state ugliness

## Mermaid validation cases for v1

Validate a representative local set covering the current support story:

- flowchart
- sequence
- class
- state
- ER
- gantt
- mindmap
- gitGraph
- architecture

Each case should store:

- stable id
- diagram family
- source text
- optional origin metadata (snippet/example/manual fixture)

## Minimum realistic flows

### Builder harness flow

1. build harness assets
2. open standalone Builder harness page in browser
3. select a canned state
4. apply a target viewport width
5. capture screenshot into `.artifacts/harness/builder/`

Primary review attention should focus on:

- `540` and `420` for normal narrow-pane behavior
- `360` for the lower threshold that must still function well
- `320` for stress-only degradation review

### Mermaid harness flow

1. load the local Mermaid runtime only
2. iterate through required cases
3. attempt real browser-side render
4. collect success/failure per case
5. on failure, emit exact source + case id and exit non-zero

## Script plan

### `scripts/harness-build.mjs`

Responsibilities:

- bundle harness TypeScript entry points
- emit to a harness dist location
- keep browser-only output separate from extension `dist/`

Suggested output shape:

```text
dist-harness/
  builder/
    index.html
    main.js
    styles.css
  mermaid/
    index.html
    main.js
```

### `scripts/harness-dev.mjs`

Responsibilities:

- serve `dist-harness/` locally
- print URLs for Builder and Mermaid harness pages
- optionally open browser automatically later

### `scripts/harness-capture.mjs`

Responsibilities:

- open Builder harness page
- iterate configured widths/states
- capture screenshots to `.artifacts/harness/builder/`
- record a small manifest JSON for traceability

### `scripts/harness-validate.mjs`

Responsibilities:

- open Mermaid harness page
- run through required Mermaid cases
- collect success/failure
- write `.artifacts/harness/mermaid-validation.json`
- fail non-zero if a required case fails

## NPM scripts to add

Recommended initial scripts:

```json
{
  "harness:build": "node ./scripts/harness-build.mjs",
  "harness:dev": "node ./scripts/harness-dev.mjs",
  "harness:builder": "node ./scripts/harness-capture.mjs",
  "harness:mermaid": "node ./scripts/harness-validate.mjs"
}
```

Optional later:

```json
{
  "harness:check": "npm run harness:builder && npm run harness:mermaid"
}
```

## Execution order

### Slice 1 — Mermaid validation harness first

Do this first because it has the best value/complexity ratio.

Deliverables:

- `harness/mermaid/index.html`
- `harness/mermaid/main.ts`
- `harness/mermaid/cases.ts`
- `scripts/harness-build.mjs`
- `scripts/harness-dev.mjs`
- `scripts/harness-validate.mjs`
- npm scripts for build/dev/mermaid validation

Success criteria:

- local browser harness runs without internet
- Mermaid cases render using the local Mermaid package
- failures report exact case id + source

### Slice 2 — Builder browser harness

Add after Slice 1 is functional.

Deliverables:

- `harness/builder/index.html`
- `harness/builder/main.ts`
- `harness/builder/styles.css`
- `harness/builder/states.ts`
- `harness/shared/viewportPresets.ts`
- `scripts/harness-capture.mjs`

Success criteria:

- target Builder states render at the chosen widths
- screenshots land in `.artifacts/harness/builder/`
- layout review becomes less dependent on desktop-capture flakiness

## Main risks

### Overengineering risk

Biggest trap: accidentally building a fake VS Code platform.

Another trap is choosing unrealistic widths based on full-window intuition rather than actual pane widths. The harness should stay anchored to real pane behavior, with `360px` as the lower must-work threshold and `320px` as stress-only.

Red flags:

- mocking webview messaging/lifecycle too deeply
- trying to run the full Builder provider in-browser
- adding too many widths/states/cases immediately
- building a full visual regression system before the basic harness proves useful

### Coupling risk

If harness pages depend on extension-host modules or `vscode` assumptions, the whole effort will get brittle fast.

### Fixture rot risk

Harness states/cases can go stale. Keep them curated and few in number.

## Recommended review language

When describing this work, frame it as:

> Add a Builder/browser harness for responsive Builder layout review and real browser Mermaid validation, while keeping package + verify:builder-ui + smoke:vsix as the extension-integration truth path.

That framing is accurate and avoids overselling the harness as a perfect VS Code simulator.

## Definition of done for v1

v1 is done when:

- Mermaid harness validates representative shipped cases in a real local browser
- Builder harness renders the shared real Builder shell with fixed review states at the agreed widths
- the new scripts are documented and runnable
- the harness complements, rather than replaces, existing extension validation scripts
