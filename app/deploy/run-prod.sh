#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [[ ! -f "$ROOT_DIR/dist/index.html" ]]; then
  echo "Missing dist/index.html under $ROOT_DIR" >&2
  exit 1
fi

exec env HOST="${HOST:-0.0.0.0}" PORT="${PORT:-3002}" node "$ROOT_DIR/deploy/static-server.mjs"
