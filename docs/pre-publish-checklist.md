# Pre-Publish Checklist

Use this before publishing Mermaid Studio publicly or creating the first Marketplace release.

## Package metadata

- [ ] `package.json` name is correct: `mermaid-studio`
- [ ] `displayName` is correct: `Mermaid Studio`
- [ ] `publisher` matches the real VS Code Marketplace publisher slug
- [ ] `author` is correct
- [ ] `repository` URL is correct
- [ ] extension description is final
- [ ] icon path is correct and the chosen icon asset is final

## README and docs

- [ ] README reflects current product behavior
- [ ] README has no placeholder sections left
- [ ] CONTRIBUTING guide is present and current
- [ ] issue/PR templates are present
- [ ] bundled examples open correctly
- [ ] screenshot/GIF assets are added or intentionally deferred
- [ ] README screenshot strategy matches the current packaging approach:
  - static screenshots use repo-relative paths in `README.md`
  - `npm run package` preserves those local paths via `vsce package --no-rewrite-relative-links`
  - packaged screenshot assets are present in the VSIX
  - the animated GIF, if used, has been evaluated separately from the static screenshot strategy

## Functional validation

- [ ] `npm test` passes
- [ ] `npm run package` passes
- [ ] slash snippets work in `.mmd`
- [ ] slash snippets work in Markdown inside Mermaid fences
- [ ] slash snippets work in Markdown outside fences
- [ ] starter snippet safety prompt works as expected
- [ ] preview works for Mermaid files
- [ ] preview works for Markdown Mermaid blocks
- [ ] SVG export opens correctly in a browser/viewer
- [ ] Ctrl/Cmd + Click reference navigation opens bundled examples
- [ ] reference commands work from the command palette

## Packaging sanity

- [ ] `.vscodeignore` excludes dev-only files and contributor-only files from the VSIX
- [ ] generated output is not committed (`dist/`, `out/`, `media/vendor/`)
- [ ] package size/file count still looks reasonable
- [ ] the produced VSIX name matches the Mermaid Studio branding

## Open source hygiene

- [ ] `.gitignore` matches the real generated/local files used during development
- [ ] obsolete files have been removed
- [ ] no scratch/debug files are committed
- [ ] docs planning files are either intentional or excluded from packaging

## Marketplace/account checks

- [ ] you are logged into the correct VS Code publisher account
- [ ] publisher slug in the Marketplace matches `package.json`
- [ ] publisher display/name is acceptable publicly

## Nice-to-have before release

- [ ] add `CHANGELOG.md` entry for the release
- [ ] add screenshots or GIFs to the README/repo
- [ ] do a final README wording pass for public readers
