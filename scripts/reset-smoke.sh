#!/usr/bin/env bash
set -euo pipefail

USER_DIR="${MERMAID_STUDIO_SMOKE_USER_DIR:-/tmp/mermaid-studio-smoke-user}"
EXT_DIR="${MERMAID_STUDIO_SMOKE_EXT_DIR:-/tmp/mermaid-studio-smoke-exts}"

rm -rf "$USER_DIR" "$EXT_DIR"

echo "Reset Mermaid Studio smoke-test environment."
echo "  removed user-data:  $USER_DIR"
echo "  removed extensions: $EXT_DIR"
