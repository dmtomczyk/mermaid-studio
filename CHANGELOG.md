# Changelog

All notable changes to Mermaid Studio will be documented in this file.

## 0.2.0

Canvas update release.

### Added
- Diagram Canvas command for visual Mermaid canvas editing
- Family-aware Diagram Canvas shell with in-canvas family switching
- Initial multi-family canvas support for `classDiagram` and `flowchart`
- Canvas-native family switch confirmation UI
- Canvas diagnostics pipeline with output-channel logging and persistent debug log support
- Host-side webview syntax preflight and debug artifact dumping for generated canvas scripts

### Improved
- Flowchart canvas editing with template-based node creation, edge editing, minimap, zoom, and generated Mermaid output
- Class diagram canvas connection preview behavior and viewport-safe preview handling
- Canvas shell layout, including better Generated Mermaid panel behavior
- Runtime resilience when restoring persisted canvas state across family changes or incompatible state shapes
- Dev/debug workflow for canvas work, including better runtime instrumentation and smoke/regression coverage

### Fixed
- Multiple canvas webview startup/runtime regressions caused by generated source drift
- Broken family-switch confirmation in sandboxed VS Code webviews
- Connection preview coordinate mismatches that could create invalid splines during drag
- Flowchart node sizing/shape issues that caused poor terminal/circle rendering

## 0.1.1

Tiny Marketplace Patch

- fixed README/Marketplace image rendering
- small publish-facing polish

## 0.1.0

Initial public release of Mermaid Studio.

### Added
- Mermaid authoring support for `.mmd`, `.mermaid`, `.md`, and `.markdown`
- Markdown-aware Mermaid insertion and block preview
- Live preview for Mermaid files and Markdown Mermaid blocks
- SVG export with standalone export normalization improvements
- Slash snippet menu and snippet browser
- Favorites and recent snippet support
- Built-in local examples and reference navigation
- Ctrl/Cmd + Click navigation to bundled local examples for supported Mermaid symbols
- Sidebar builder with strongest support for flowchart and sequence diagrams
- Shorthand conversion support
- Hover help, completions, syntax highlighting, and formatting helpers
- Contributor guide, issue templates, PR template, roadmap, security policy, and release docs

### Improved
- Mixed-diagram `.mmd` preview handling
- Markdown fence defaults now use `mermaid` by default
- Starter snippet insertion safety for top-level diagram declarations
- Bundled/runtime packaging size through build bundling
- Contributor/readme/project scaffolding for open source collaboration
- README screenshot handling guidance to avoid pre-publication Marketplace image breakage from unresolved public asset URLs
- README fallback strategy and offline-guide planning for environments where native Extension Details screenshots are unavailable
