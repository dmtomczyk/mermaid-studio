# Mermaid Studio Roadmap

This roadmap focuses on the next meaningful improvements after the initial public `0.1.x` release.

## Near term

### Offline browser validation
Build a browser-realistic validation pass for snippets/examples/export behavior using a local browser harness.

Goals:
- validate shipped snippets against actual Mermaid browser rendering
- catch preview/export regressions earlier
- verify representative diagrams across major Mermaid families
- stay offline-first and avoid remote API dependency

### Builder / canvas improvements
Continue improving the strongest builder-supported families:
- better flowchart canvas ergonomics
- better sequence overview / editing polish
- clearer empty states and support-tier messaging
- safer import/edit/replace flows

### UX improvements
- refine slash snippet ranking and presentation
- improve snippet browser grouping/discoverability
- continue improving docs/example navigation
- reduce friction for Markdown-first workflows
- improve first-run discoverability via README/screenshots/examples
- revisit compact shorthand authoring as a real planned capability rather than a lightly surfaced experimental command

### Export improvements
Continue hardening export across diagram families and formats:
- SVG edge cases
- PNG/JPEG export options if added later
- consistent browser/viewer-friendly output
- more regression coverage around label rendering and bounds

## Medium term

### Compact shorthand authoring
- design a legitimate shorthand syntax that is meaningfully faster than writing Mermaid directly
- support it intentionally rather than as a lightly exposed experiment
- define scope carefully by diagram family and editing flow
- make sure the UX is simpler than snippets/manual authoring before surfacing it broadly again

### Snippet refinement
- unify snippet surfaces further
- keep slash aliases clean and predictable
- expand high-value micro snippets by family
- consider generating static snippet JSON from the shared registry

### Reference/docs improvements
- expand bundled examples
- improve contributor-facing architecture docs
- improve command-based docs discovery
- add more context-aware reference mappings where useful

### Syntax/highlighting improvements
- continue filling gaps in family-specific keyword coverage
- refine visual hierarchy across Mermaid constructs
- improve readability for Markdown Mermaid editing flows

## Later / exploratory

### Additional validation and testing depth
- stronger browser-based regression coverage
- potentially richer export tests and visual snapshot checks
- contributor-friendly validation helpers/scripts

### Broader builder ideas
Only expand deeper visual editing to additional Mermaid families when the UX/product tradeoffs are clear.

The current bias remains:
- strongest structured editing for flowchart + sequence
- source-first assistance for many other families
