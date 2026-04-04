# Screenshot and GIF Plan

This file lists the highest-value visual assets to capture before or just after the first public release.

## Priority screenshots

### 1. Slash snippet workflow
Show:
- a Mermaid file or Markdown fence
- `/flow`, `/sequence`, or `/snippet` completion menu open
- enough of the surrounding editor to show it is diagram-aware

Why:
- quickly communicates the fastest insertion path
- strong Marketplace/GitHub first impression

### 2. Live preview
Show:
- source on the left
- preview on the right
- a diagram that looks visually strong in a screenshot

Why:
- preview is one of the core reasons to install the extension

### 3. Builder sidebar
Show:
- the builder view open
- a flowchart or sequence preset loaded
- enough visible controls to show that the extension is more than plain snippets

Why:
- differentiates Mermaid Studio from lightweight Mermaid syntax helpers

### 4. Reference navigation / local examples
Show:
- hover or Ctrl/Cmd + Click workflow
- bundled example document opening from the editor

Why:
- demonstrates the built-in learning/reference path

### 5. SVG export result
Show:
- preview export action and a successfully opened exported SVG

Why:
- proves export is part of the workflow and not just a checkbox feature

## Priority GIFs

### GIF 1 — Fast start
Suggested flow:
1. open file
2. type `/flow`
3. accept snippet
4. open preview

Length:
- 6–10 seconds

### GIF 2 — Markdown workflow
Suggested flow:
1. open Markdown document
2. type `/snippet` outside a fence
3. choose a starter
4. preview the Mermaid block

Length:
- 8–12 seconds

### GIF 3 — Builder workflow
Suggested flow:
1. open Builder
2. load preset
3. adjust nodes/messages
4. preview or insert

Length:
- 8–12 seconds

## What Playwright / browser automation can help with

Playwright or similar browser automation can help automate a lot of the capture workflow, especially for repeatable release assets.

Good automation targets:
- opening a prepared VS Code/webview/browser page
- loading a known Mermaid document/example
- opening a preview or example page
- capturing consistent screenshots for preview/export/reference flows
- validating that exported SVGs render and that key UI pieces appear

What usually still benefits from manual curation:
- choosing the best crop/composition for Marketplace visuals
- deciding which examples are most readable/attractive
- selecting the final GIF timing and pacing
- recording builder interactions that should feel human rather than robotic

Practical recommendation:
- automate the repeatable capture setup
- manually curate the final screenshot/GIF choices

## Capture guidance

- Use a clean VS Code theme and moderate zoom
- Avoid cluttered sidebars unless they help explain the feature
- Prefer diagrams with readable labels at screenshot size
- Crop tightly enough to focus on the feature but keep enough context to show this is VS Code
- If using GIFs, keep them short and readable

## Recommended order

1. Slash snippet screenshot
2. Live preview screenshot
3. Builder screenshot
4. Fast-start GIF
5. Markdown workflow GIF
6. Reference navigation screenshot

## Notes on icon review

When comparing icon concepts, prioritize:
- legibility at 16–32 px
- distinct silhouette
- strong contrast on light and dark backgrounds
- whether it still reads as “diagram / Mermaid / graph” at tiny sizes
- avoiding too much fine detail
