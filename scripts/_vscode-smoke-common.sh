#!/usr/bin/env bash
set -euo pipefail

SMOKE_COMMON_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SMOKE_COMMON_PACKAGE_JSON="$SMOKE_COMMON_ROOT/package.json"

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

read_package_field() {
  local field="$1"
  node -e "const pkg=require(process.argv[1]); console.log(pkg['$field']);" "$SMOKE_COMMON_PACKAGE_JSON"
}

ensure_smoke_profile_settings() {
  local user_dir="$1"
  mkdir -p "$user_dir/User"
  cat > "$user_dir/User/settings.json" <<'EOF'
{
  "security.workspace.trust.enabled": false,
  "workbench.startupEditor": "none",
  "workbench.tips.enabled": false,
  "extensions.ignoreRecommendations": true,
  "window.commandCenter": false,
  "workbench.editor.empty.hint": "hidden"
}
EOF
}
