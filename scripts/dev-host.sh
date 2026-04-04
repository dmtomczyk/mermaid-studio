#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_DIR="${MERMAID_STUDIO_DEV_USER_DIR:-/tmp/mermaid-studio-dev-user}"
EXT_DIR="${MERMAID_STUDIO_DEV_EXT_DIR:-/tmp/mermaid-studio-dev-exts}"

find_vscode_bin() {
  if [[ -n "${VSCODE_BIN:-}" ]]; then
    printf '%s\n' "$VSCODE_BIN"
    return 0
  fi

  local candidates=(code code-insiders codium)
  local candidate
  for candidate in "${candidates[@]}"; do
    if command -v "$candidate" >/dev/null 2>&1; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  echo "Could not find a VS Code CLI binary. Set VSCODE_BIN to your executable (for example: code, code-insiders, or codium)." >&2
  exit 1
}

CODE_BIN="$(find_vscode_bin)"

mkdir -p "$USER_DIR" "$EXT_DIR"

echo "Launching Mermaid Studio in an Extension Development Host..."
echo "  repo:        $ROOT"
echo "  user-data:   $USER_DIR"
echo "  extensions:  $EXT_DIR"
echo "  code binary: $CODE_BIN"

action_args=(
  --new-window
  --user-data-dir "$USER_DIR"
  --extensions-dir "$EXT_DIR"
  --extensionDevelopmentPath "$ROOT"
  --disable-extensions
  "$ROOT"
)

exec "$CODE_BIN" "${action_args[@]}"
