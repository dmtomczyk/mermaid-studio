# Local README Image Debug Notes

Date: 2026-04-04

## What we learned so far

### 1. Public GitHub raw URLs

Using hardcoded public GitHub raw URLs failed in the current publication state when those URLs were not actually live.

### 2. Repo-relative Markdown image syntax

Using Markdown image syntax such as:

```md
![Slash snippets](./assets/screenshots/slash-snippets.png)
```

and packaging with `vsce package --no-rewrite-relative-links` preserved local paths in the packaged README, but the VS Code Extension Details page still did not render the images.

### 3. Embedded Base64 `data:` URLs

Embedding the static screenshots as `data:image/png;base64,...` URLs inside the packaged README also failed in the VS Code Extension Details page.

Key diagnostic clue from DevTools:

- the rendered DOM showed `<img alt="Slash snippets">`
- the `src` attribute was missing entirely

That strongly suggests the Details-page markdown sanitizer strips the `src` when it considers the image URL unsafe or unsupported.

## Current experiment

The next experiment is to use literal HTML image tags with local relative paths, plus a cleaner packaged VSIX.

We are also temporarily swapping one test image to an existing local SVG asset, and using obviously versioned alt text so stale installs are easy to spot in the DOM:

```html
<img src="./media/mermaid-activity.svg" alt="Slash snippets">
```

packaged with:

```bash
vsce package --no-rewrite-relative-links
```

## Goal of this experiment

Determine whether the Extension Details markdown/webview pipeline preserves local HTML `src` attributes more reliably when:

- the VSIX is cleaner/minimal
- the asset is an SVG rather than a PNG screenshot

## If this also fails

Next debugging target should be:

- inspect the rendered DOM again to see whether `src` is stripped from raw HTML image tags too
- confirm whether the Details page supports any local packaged image scheme at all
- inspect VS Code source/behavior for extension details markdown image sanitization
