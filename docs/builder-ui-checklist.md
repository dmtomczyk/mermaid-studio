# Builder UI change checklist

Use this whenever changing Mermaid Studio's Builder layout, sizing, density, cards, or canvas behavior.

## 1) Identify the owning layer first

Builder UI changes live in two different shipping outputs.

### A. Shell / HTML / CSS layer
Edit here when changing:
- parent quick-add panels
- section spacing
- top-level layout
- media-query behavior
- most static sizing rules

Source:
- `src/builder/renderBuilderShell.ts`

Ships inside:
- `dist/extension.js`
- packaged as `extension/dist/extension.js`

### B. Dynamic builder webview layer
Edit here when changing:
- node / edge / participant / message card markup
- dynamic card actions
- canvas rendering behavior
- sequence overview rendering
- interactive builder content created at runtime

Sources:
- `src/webview/builder/forms.ts`
- `src/webview/builder/renderFlowCanvas.ts`
- `src/webview/builder/renderSequenceOverview.ts`
- related files in `src/webview/builder/`

Ships inside:
- `dist/webview/builder.js`
- packaged as `extension/dist/webview/builder.js`

## 2) Before claiming the fix worked, verify the packaged artifact

If you changed shell/layout rules, inspect the packaged `extension/dist/extension.js`.

Example:

```bash
unzip -p mermaid-studio-0.1.0.vsix extension/dist/extension.js | grep -n "quickNodeLabel\|quickEdgeFrom\|compact-panel-grid"
```

If you changed dynamic cards/canvas behavior, inspect the packaged `extension/dist/webview/builder.js`.

Example:

```bash
unzip -p mermaid-studio-0.1.0.vsix extension/dist/webview/builder.js | grep -n "compact-actions-row\|Copy\|Flip\|Del"
```

## 3) Always check for later CSS overrides

A change can be present in the package but still be invisible because a later media-query override undoes it.

Before declaring success, check:
- does a later `@media` block override the layout?
- does a generic `.grid-*` rule undo the intended compact layout?
- is the smallest-width fallback collapsing something that should stay 2-up?

## 4) Run the packaged verification helper

After packaging, run:

```bash
npm run verify:builder-ui
```

This is not a replacement for visual testing. It is a guardrail to confirm that:
- the expected Builder shell markers are in packaged `extension/dist/extension.js`
- the expected dynamic Builder markers are in packaged `extension/dist/webview/builder.js`
- stale packaged-extension trees are not accidentally included
- key Builder-specific override regressions are not obviously present
- a short CSS override/risk summary is printed for manual review

## 5) Smoke-test the actual package, not just the dev window

Use:

```bash
npm run smoke:vsix
```

or:

```bash
./scripts/reset-smoke.sh
./scripts/smoke-vsix.sh
```

## 6) Run an actual Builder UI capture/review pass when layout is involved

For Builder layout/sizing/density work, first run the real-shell harness review path:

```bash
npm run harness:builder
```

This captures the shared-shell Builder harness matrix in a browser-driven path that is much closer to the real webview than the earlier synthetic harness.

If you specifically need an environment-level desktop capture, you can still also run:

```bash
npm run capture:builder-ui:desktop
```

That desktop capture path remains useful as a secondary inspection aid, but it is environment-sensitive on Linux desktops (especially GNOME/Wayland), so do not treat it as the primary oracle.

## 7) Do not claim a Builder fix is done until the key validation steps happened

For Builder UI work, the expected sequence is:
1. `npm run package`
2. `npm run verify:builder-ui`
3. `npm run smoke:vsix`
4. `npm run harness:builder` (for layout/sizing/density changes)
5. optional: `npm run capture:builder-ui` when environment-level desktop capture is specifically helpful

If all required steps have not happened yet, describe the change as:
- implemented in source
- packaged and verified
- smoke-launched
- or pending captured visual review

Do **not** describe it as fully done/fixed until the verify + smoke steps have happened, and for layout/sizing work, the capture/review step has happened too.

## 8) Use this short review sentence before saying "fixed"

- What changed?
- Which layer owned it?
- Which packaged file was checked?
- Was there any later override risk?
- Has `npm run verify:builder-ui` been run?
- Has the packaged VSIX been smoke-tested?
- Has a real Builder UI capture/review pass been done for layout work?

Example:

> Updated the shared Builder shell in `renderBuilderShell.ts`, verified the packaged `extension/dist/extension.js` contains the new `compact-panel-grid` markup, checked the smallest-width media query restore order, ran `npm run verify:builder-ui`, smoke-tested the packaged VSIX, and reviewed the real-shell Builder harness screenshots.
