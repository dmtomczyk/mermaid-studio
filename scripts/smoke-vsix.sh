#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_DIR="${MERMAID_STUDIO_SMOKE_USER_DIR:-/tmp/mermaid-studio-smoke-user}"
EXT_DIR="${MERMAID_STUDIO_SMOKE_EXT_DIR:-/tmp/mermaid-studio-smoke-exts}"
RESET_SCRIPT="$ROOT/scripts/reset-smoke.sh"
source "$ROOT/scripts/_vscode-smoke-common.sh"

VERSION="$(read_package_field version)"
NAME="$(read_package_field name)"
VSIX_PATH="${VSIX_PATH:-$ROOT/${NAME}-${VERSION}.vsix}"
CODE_BIN="$(find_vscode_bin)"

if [[ ! -f "$VSIX_PATH" ]]; then
  echo "VSIX not found: $VSIX_PATH" >&2
  echo "Build one first with 'npm run package' or run 'npm run smoke:vsix'." >&2
  exit 1
fi

"$RESET_SCRIPT"

mkdir -p "$USER_DIR" "$EXT_DIR"
ensure_smoke_profile_settings "$USER_DIR"

echo "Installing Mermaid Studio smoke-test VSIX..."
echo "  vsix:        $VSIX_PATH"
echo "  user-data:   $USER_DIR"
echo "  extensions:  $EXT_DIR"
echo "  code binary: $CODE_BIN"

"$CODE_BIN" \
  --user-data-dir "$USER_DIR" \
  --extensions-dir "$EXT_DIR" \
  --install-extension "$VSIX_PATH" \
  --force

echo "Launching isolated smoke-test window..."
exec "$CODE_BIN" \
  --new-window \
  --user-data-dir "$USER_DIR" \
  --extensions-dir "$EXT_DIR" \
  "$ROOT"
