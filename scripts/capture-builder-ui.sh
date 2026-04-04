#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER_DIR="${MERMAID_STUDIO_SMOKE_USER_DIR:-/tmp/mermaid-studio-smoke-user}"
EXT_DIR="${MERMAID_STUDIO_SMOKE_EXT_DIR:-/tmp/mermaid-studio-smoke-exts}"
RESET_SCRIPT="$ROOT/scripts/reset-smoke.sh"
ARTIFACT_DIR="${MERMAID_STUDIO_BUILDER_CAPTURE_DIR:-$ROOT/.artifacts/builder-ui}"
LAUNCH_DELAY="${MERMAID_STUDIO_CAPTURE_LAUNCH_DELAY:-6}"
COMMAND_DELAY="${MERMAID_STUDIO_CAPTURE_COMMAND_DELAY:-2}"
SHOT_DELAY="${MERMAID_STUDIO_CAPTURE_SCREENSHOT_DELAY:-3}"
source "$ROOT/scripts/_vscode-smoke-common.sh"

VERSION="$(read_package_field version)"
NAME="$(read_package_field name)"
VSIX_PATH="${VSIX_PATH:-$ROOT/${NAME}-${VERSION}.vsix}"
CODE_BIN="$(find_vscode_bin)"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_PATH="$ARTIFACT_DIR/code-launch-$STAMP.log"
SHOT_PATH="$ARTIFACT_DIR/builder-$STAMP.png"

if [[ ! -f "$VSIX_PATH" ]]; then
  echo "VSIX not found: $VSIX_PATH" >&2
  echo "Build one first with 'npm run package'." >&2
  exit 1
fi

mkdir -p "$ARTIFACT_DIR"
"$RESET_SCRIPT"
mkdir -p "$USER_DIR" "$EXT_DIR"
ensure_smoke_profile_settings "$USER_DIR"

echo "Installing Mermaid Studio smoke-test VSIX for capture..."
"$CODE_BIN" \
  --user-data-dir "$USER_DIR" \
  --extensions-dir "$EXT_DIR" \
  --install-extension "$VSIX_PATH" \
  --force >/dev/null

echo "Launching trusted smoke window for Builder capture..."
"$CODE_BIN" \
  --new-window \
  --user-data-dir "$USER_DIR" \
  --extensions-dir "$EXT_DIR" \
  "$ROOT" >"$LOG_PATH" 2>&1 &
CODE_PID=$!

echo "  code pid:   $CODE_PID"
echo "  log path:   $LOG_PATH"
sleep "$LAUNCH_DELAY"

open_builder_with_xdotool() {
  command -v xdotool >/dev/null 2>&1 || return 1
  local win=""
  local attempt
  for attempt in 1 2 3 4 5; do
    win="$(xdotool search --onlyvisible --class code 2>/dev/null | tail -n 1 || true)"
    if [[ -n "$win" ]]; then
      break
    fi
    sleep 1
  done
  if [[ -z "$win" ]]; then
    return 1
  fi
  xdotool windowactivate "$win" 2>/dev/null || true
  sleep 0.5
  xdotool key --window "$win" --clearmodifiers ctrl+shift+p
  sleep 0.5
  xdotool type --window "$win" --delay 25 "Mermaid Studio: Open Builder"
  sleep 0.4
  xdotool key --window "$win" Return
  return 0
}

open_builder_with_wtype() {
  command -v wtype >/dev/null 2>&1 || return 1
  wtype -M ctrl -M shift p -m shift -m ctrl
  sleep 0.5
  wtype "Mermaid Studio: Open Builder"
  sleep 0.4
  wtype -k Return
  return 0
}

capture_with_gnome_dbus() {
  command -v gdbus >/dev/null 2>&1 || return 1
  gdbus call --session \
    --dest org.gnome.Shell.Screenshot \
    --object-path /org/gnome/Shell/Screenshot \
    --method org.gnome.Shell.Screenshot.Screenshot \
    false false "$SHOT_PATH" >/dev/null
  [[ -f "$SHOT_PATH" ]]
}

capture_with_scrot() {
  command -v scrot >/dev/null 2>&1 || return 1
  scrot "$SHOT_PATH" >/dev/null
}

capture_with_import() {
  command -v import >/dev/null 2>&1 || return 1
  import -window root "$SHOT_PATH"
}

validate_capture_image() {
  python3 - "$SHOT_PATH" <<'PY'
import sys
from PIL import Image
path = sys.argv[1]
img = Image.open(path).convert('L')
width, height = img.size
hist = img.histogram()
total = sum(hist) or 1
very_dark = sum(hist[:16]) / total
mid = sum(hist[32:224]) / total
if width < 200 or height < 200:
    print(f'[fail] captured screenshot is unexpectedly small: {width}x{height}', file=sys.stderr)
    sys.exit(1)
if very_dark > 0.98 and mid < 0.02:
    print(f'[fail] captured screenshot appears effectively blank/black (very_dark={very_dark:.3f}, mid={mid:.3f})', file=sys.stderr)
    sys.exit(1)
print(f'[ok] capture image looks non-blank enough for review ({width}x{height}, very_dark={very_dark:.3f}, mid={mid:.3f})')
PY
}

AUTOMATION_OK=0
if open_builder_with_xdotool; then
  AUTOMATION_OK=1
elif open_builder_with_wtype; then
  AUTOMATION_OK=1
fi

if [[ "$AUTOMATION_OK" -eq 1 ]]; then
  echo "Open Builder automation: best-effort success"
else
  echo "Open Builder automation: could not confirm. You may need to bring the VS Code window to the front manually before rerunning capture." >&2
fi

sleep "$COMMAND_DELAY"

CAPTURE_METHOD=""
if capture_with_gnome_dbus; then
  CAPTURE_METHOD="gnome-dbus"
elif capture_with_scrot; then
  CAPTURE_METHOD="scrot"
elif capture_with_import; then
  CAPTURE_METHOD="imagemagick-import"
else
  echo "Could not capture a screenshot automatically (no supported screenshot tool succeeded)." >&2
  exit 1
fi

echo "Captured Builder UI screenshot via $CAPTURE_METHOD: $SHOT_PATH"
validate_capture_image

sleep "$SHOT_DELAY"

echo "Review artifacts:"
echo "  screenshot: $SHOT_PATH"
echo "  log:        $LOG_PATH"
echo
echo "Note: this script can launch and capture automatically, but GNOME/Wayland focus/input behavior can still be environment-sensitive. Treat it as a real inspection aid, not absolute proof."
