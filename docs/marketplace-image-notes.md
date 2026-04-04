# Marketplace Image Notes

Date: 2026-04-04

## Current finding

The README had been updated to use GitHub-hosted screenshot URLs under:

- `https://raw.githubusercontent.com/dmtomczyk/mermaid-studio/main/assets/screenshots/...`

However, those URLs currently return `404` in the present publication state.

That means Marketplace image failures may be caused by invalid public URLs rather than only by VS Code Marketplace rendering quirks.

## Practical guidance

### Current chosen strategy for static screenshots

Use literal HTML image tags with repo-relative packaged paths such as:

- `<img src="./assets/screenshots/slash-snippets.png" alt="Slash snippets">`
- `<img src="./assets/screenshots/live-preview.png" alt="Live preview">`
- `<img src="./assets/screenshots/builder-sidebar.png" alt="Builder sidebar">`

and package with:

- `vsce package --no-rewrite-relative-links`

This preserves the screenshot references as packaged-local README assets instead of rewriting them to external GitHub image URLs.

This is also a deliberate experiment to see whether the VS Code Extension Details pipeline preserves local HTML `src` attributes more reliably than Markdown image syntax or embedded `data:` URLs.

### Why this is preferred

- screenshots ship inside the VSIX
- static screenshots do not depend on public asset hosting
- the installed extension can keep those screenshot references self-contained
- it avoids pre-publication 404s from guessed GitHub raw URLs

### GIF strategy

Treat the animated GIF separately.

Because GIFs can be large and may have different Marketplace/rendering tradeoffs, do not force the same packaging strategy onto the GIF until there is a deliberate decision.

### Avoid

- hardcoded GitHub raw URLs that are not yet live
- release asset URLs before the release exists
- assuming `vsce` will preserve local README image paths unless `--no-rewrite-relative-links` is used

## Recommendation

Default to packaged-local static screenshots.
Only use externally hosted image URLs when there is a clear reason and the URLs have already been verified live.
