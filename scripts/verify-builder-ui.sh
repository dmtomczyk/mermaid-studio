#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_JSON="$ROOT/package.json"

read_package_field() {
  local field="$1"
  node -e "const pkg=require(process.argv[1]); console.log(pkg['$field']);" "$PACKAGE_JSON"
}

VERSION="$(read_package_field version)"
NAME="$(read_package_field name)"
VSIX_PATH="${VSIX_PATH:-$ROOT/${NAME}-${VERSION}.vsix}"

if [[ ! -f "$VSIX_PATH" ]]; then
  echo "VSIX not found at $VSIX_PATH" >&2
  echo "Run 'npm run package' first, or set VSIX_PATH to a packaged artifact." >&2
  exit 1
fi

extract_zip_entry_to_tmp() {
  local entry="$1"
  local tmp
  tmp="$(mktemp)"
  unzip -p "$VSIX_PATH" "$entry" > "$tmp"
  printf '%s\n' "$tmp"
}

require_in_zip() {
  local entry="$1"
  local pattern="$2"
  local description="$3"
  local tmp
  tmp="$(extract_zip_entry_to_tmp "$entry")"

  if grep -q "$pattern" "$tmp"; then
    echo "[ok] $description"
  else
    echo "[fail] $description" >&2
    echo "       missing pattern: $pattern" >&2
    echo "       in packaged file: $entry" >&2
    rm -f "$tmp"
    exit 1
  fi
  rm -f "$tmp"
}

reject_in_zip() {
  local entry="$1"
  local pattern="$2"
  local description="$3"
  local tmp
  tmp="$(extract_zip_entry_to_tmp "$entry")"

  if grep -q "$pattern" "$tmp"; then
    echo "[fail] $description" >&2
    echo "       unexpected pattern present: $pattern" >&2
    echo "       in packaged file: $entry" >&2
    rm -f "$tmp"
    exit 1
  else
    echo "[ok] $description"
  fi
  rm -f "$tmp"
}

verify_smallest_breakpoint_compact_panels() {
  local entry="$1"
  local tmp
  tmp="$(extract_zip_entry_to_tmp "$entry")"

  python3 - "$tmp" <<'PY'
import sys
path = sys.argv[1]
text = open(path, 'r', encoding='utf-8', errors='replace').read()
needle = '@media (max-width: 420px)'
start = text.find(needle)
if start < 0:
    print('[fail] 420px media block present', file=sys.stderr)
    sys.exit(1)
block = text[start:start + 2500]
required = {
    'generic narrow grid collapse': '.grid-2',
    'parent quick-add 2-col restore': '.compact-panel-grid-2',
    'parent quick-add 3-col restore': '.compact-panel-grid-3',
}
missing = [label for label, token in required.items() if token not in block]
if missing:
    print('[fail] smallest breakpoint verification', file=sys.stderr)
    for label in missing:
        print(f'       missing from 420px block: {label}', file=sys.stderr)
    sys.exit(1)
idx_generic = block.find('.grid-2')
idx_panel2 = block.find('.compact-panel-grid-2')
idx_panel3 = block.find('.compact-panel-grid-3')
if not (idx_generic < idx_panel2 and idx_generic < idx_panel3):
    print('[fail] smallest breakpoint restores parent quick-add grids after generic collapse', file=sys.stderr)
    print(f'       indexes: generic={idx_generic}, panel2={idx_panel2}, panel3={idx_panel3}', file=sys.stderr)
    sys.exit(1)
if '.compact-card-grid-2' in block or '.compact-card-grid-3' in block:
    print('[fail] smallest breakpoint unexpectedly collapses child card grids', file=sys.stderr)
    sys.exit(1)
print('[ok] smallest breakpoint restores parent quick-add grids after generic collapse')
print('[ok] smallest breakpoint does not re-collapse child card grids')
PY
  local status=$?
  rm -f "$tmp"
  if [[ $status -ne 0 ]]; then
    exit $status
  fi
}

print_builder_css_risk_summary() {
  local entry="$1"
  local tmp
  tmp="$(extract_zip_entry_to_tmp "$entry")"

  python3 - "$tmp" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path, 'r', encoding='utf-8', errors='replace').read()

print('\nBuilder CSS override review summary:')

media_points = re.findall(r'@media \(max-width: (\d+)px\)', text)
if media_points:
    uniq = []
    for p in media_points:
        if p not in uniq:
            uniq.append(p)
    print('  Breakpoints found:', ', '.join(f'{p}px' for p in uniq))
else:
    print('  Breakpoints found: none')

# Summarize each breakpoint block with a few suspicious selectors.
for point in media_points:
    needle = f'@media (max-width: {point}px)'
    start = text.find(needle)
    if start < 0:
        continue
    block = text[start:start + 2500]
    findings = []
    if '.grid-2' in block or '.grid-3' in block:
        findings.append('generic grid override')
    if '.compact-panel-grid-2' in block or '.compact-panel-grid-3' in block:
        findings.append('parent quick-add override')
    if '.compact-card-grid-2' in block or '.compact-card-grid-3' in block:
        findings.append('child card override')
    if '.actions-inline' in block or '.toolbar' in block or '.subtoolbar' in block:
        findings.append('button-row/flex override')
    if '.canvas' in block or '.canvas-surface' in block or '.canvas-toolbar' in block:
        findings.append('canvas sizing/toolbar override')
    if '.sequence-header' in block or '.canvas-node' in block:
        findings.append('node/sequence chip sizing override')
    if findings:
        print(f'  {point}px: ' + '; '.join(findings))

# Surface potential risks / oddities.
risk_lines = []
for m in re.finditer(r'@media \(max-width: (\d+)px\)', text):
    point = m.group(1)
    block = text[m.start():m.start()+2500]
    if ('.grid-2' in block or '.grid-3' in block) and '.compact-panel-grid-2' not in block and '.compact-panel-grid-3' not in block:
        risk_lines.append(f'  - {point}px block has generic grid collapse but no explicit parent quick-add restore.')
    if '.compact-panel-grid-2' in block and '.compact-card-grid-2' not in block:
        risk_lines.append(f'  - {point}px block adjusts parent quick-add grids but not child card grids; this may be intentional, but verify the child cards still look compact in a real smoke test.')
    if '.canvas' in block and '.canvas-surface' not in block:
        risk_lines.append(f'  - {point}px block changes canvas height without changing canvas-surface; check for mismatched internal scroll/fit behavior.')
    if '.actions-inline' in block and 'flex-direction: column' in block and '.compact-actions-row' not in text:
        risk_lines.append(f'  - {point}px block stacks action rows vertically and there is no compact-actions-row helper in the bundle.')

# Extra broad scan for very tiny breakpoints.
small = [int(p) for p in media_points if p.isdigit() and int(p) <= 320]
if small:
    risk_lines.append('  - Very small breakpoint(s) detected at or below 320px: ' + ', '.join(f'{p}px' for p in small))

if risk_lines:
    print('  Risky/suspicious patterns to review:')
    for line in risk_lines:
        print(line)
else:
    print('  No obvious risky override patterns detected by the packaged CSS audit.')
PY
  local status=$?
  rm -f "$tmp"
  if [[ $status -ne 0 ]]; then
    exit $status
  fi
}

require_zip_entry() {
  local pattern="$1"
  local description="$2"
  if unzip -l "$VSIX_PATH" | grep -q "$pattern"; then
    echo "[ok] $description"
  else
    echo "[fail] $description" >&2
    echo "       missing zip entry pattern: $pattern" >&2
    exit 1
  fi
}

reject_zip_entry() {
  local pattern="$1"
  local description="$2"
  if unzip -l "$VSIX_PATH" | grep -q "$pattern"; then
    echo "[fail] $description" >&2
    echo "       unexpected zip entry pattern: $pattern" >&2
    exit 1
  else
    echo "[ok] $description"
  fi
}

echo "Verifying packaged Builder/UI artifact: $VSIX_PATH"

# Packaged artifact sanity
require_zip_entry "extension/dist/extension.js" "packaged shell bundle present"
require_zip_entry "extension/dist/webview/builder.js" "packaged builder webview bundle present"
reject_zip_entry "extension/mermaid-studio-0\.0\.1/" "no stale unpacked extension tree included"

# Shell / HTML / CSS layer checks.
require_in_zip "extension/dist/extension.js" "compact-panel-grid-3" "Nodes quick-add panel compact 3-field grid marker present"
require_in_zip "extension/dist/extension.js" "compact-panel-grid-2" "Edges quick-add panel compact 2-field grid marker present"
require_in_zip "extension/dist/extension.js" "quickNodeLabel" "Nodes quick-add controls are present in packaged shell"
require_in_zip "extension/dist/extension.js" "quickEdgeFrom" "Edges quick-add controls are present in packaged shell"

# Ensure smallest breakpoint restores parent quick-add panels after the generic grid collapse.
verify_smallest_breakpoint_compact_panels "extension/dist/extension.js"

# Dynamic builder bundle checks.
require_in_zip "extension/dist/webview/builder.js" "compact-actions-row" "dynamic cards use a separate compact action row"
require_in_zip "extension/dist/webview/builder.js" ">Copy<" "dynamic node/participant cards use compact Copy action label"
require_in_zip "extension/dist/webview/builder.js" ">Flip<" "dynamic edge/message cards use compact Flip action label"
require_in_zip "extension/dist/webview/builder.js" ">Del<" "dynamic cards use compact Del action label"

print_builder_css_risk_summary "extension/dist/extension.js"

echo
cat <<'EOF'
Builder UI packaging verification passed.

Still required after relevant UI changes:
1. Decide which layer owned the change:
   - src/builder/MermaidBuilderViewProvider.ts -> extension/dist/extension.js
   - src/webview/builder/* -> extension/dist/webview/builder.js
2. Check for later CSS/media-query overrides.
3. Smoke-test the actual VSIX:
   npm run smoke:vsix
4. Do not describe the Builder change as fully fixed/done until package + verify + smoke have all happened.
EOF
