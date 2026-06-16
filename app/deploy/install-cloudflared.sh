#!/usr/bin/env bash

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-${HOME}/.local/bin}"
DOWNLOAD_URL="${CLOUDFLARED_URL:-https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64}"
TARGET_PATH="${INSTALL_DIR}/cloudflared"

mkdir -p "$INSTALL_DIR"

curl -fL "$DOWNLOAD_URL" -o "$TARGET_PATH"
chmod +x "$TARGET_PATH"

"$TARGET_PATH" --version
