# Offline Guide Plan

Date: 2026-04-04

## Goal

Provide a first-class, packaged, offline-friendly visual guide for Mermaid Studio users who cannot rely on the VS Code Extension Details page rendering external screenshots.

## Why this exists

The native VS Code Extension Details page is suitable for public HTTPS-hosted README images, but it is not a dependable surface for packaged-local README screenshots in offline environments.

The extension should therefore provide its own controlled visual help surface.

## Product goal

Add a command such as:

- `Mermaid Studio: Open Getting Started`

that opens a Mermaid Studio-owned webview or local help surface containing:

- packaged screenshots
- onboarding copy
- quick-start steps
- links/actions for the most important features

## User experience goals

The offline guide should:

- work fully without internet access
- look intentional and polished
- explain the key value quickly
- provide actionable next steps, not just screenshots
- be safe to ship inside the VSIX

## Recommended surface

### Primary recommendation: extension-owned webview

Use a Mermaid Studio-controlled webview panel.

Why:

- local packaged assets are supported cleanly via `webview.asWebviewUri(...)`
- layout and styling are under our control
- offline behavior is reliable
- screenshots and optional animation can be handled without README sanitizer limits

## Initial content outline

### Section 1 — What Mermaid Studio does

Short product summary:

- slash snippets for fast insertion
- live preview
- Builder for flowchart/sequence editing
- bundled examples/reference flow

### Section 2 — Quick start

Suggested first steps:

1. open a Mermaid file or Markdown fence
2. type `/flow`, `/sequence`, or `/snippet`
3. open preview
4. launch Builder for structured editing

### Section 3 — Screenshots

Packaged local visuals for:

- slash snippets
- live preview
- Builder sidebar

### Section 4 — Builder and examples

Short guidance for:

- flowchart + sequence builder focus
- other Mermaid families via source/snippets/examples

### Section 5 — Actions

Buttons/links for:

- Open Builder
- Open Preview
- Create sample Mermaid file
- Open examples/reference docs

## Asset plan

### Packaged static screenshots

Ship the three core screenshots inside the extension and reference them from the webview using `asWebviewUri(...)`.

### GIF strategy

Treat the GIF as optional.

Potential choices:

- omit from v1
- replace with multiple static screenshots / step cards
- include later if size/perf is acceptable

## Recommended implementation shape

### Proposed files

```text
src/gettingStarted/
  MermaidStudioGettingStartedPanel.ts
  renderGettingStarted.ts
media/getting-started/
  (optional shared CSS/icons later)
assets/screenshots/
  slash-snippets.png
  live-preview.png
  builder-sidebar.png
```

## Command plan

### New command

```json
"mermaidStudio.openGettingStarted"
```

Command title:

- `Mermaid Studio: Open Getting Started`

## Suggested launch points

Possible places to surface it:

- Command Palette
- README fallback note
- optional first-run message later
- optional status card/help command later

## Implementation approach

### Phase 1

- create the command
- open a basic webview panel
- render static onboarding content
- show the three packaged screenshots

### Phase 2

- add action buttons/links
- improve styling
- optionally add a simple step-by-step layout

### Phase 3

- decide whether to include the GIF or another richer visual asset

## Definition of done

The offline guide is successful when:

- it opens from the Command Palette
- it works fully offline
- screenshots render from packaged local assets
- it gives users a polished fallback when README screenshots are unavailable

## Recommendation

Proceed with the offline guide even if README/public screenshot links are restored, because it solves the offline-user case directly and cleanly.
