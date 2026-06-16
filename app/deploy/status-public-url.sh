#!/usr/bin/env bash

set -euo pipefail

UNIT_NAME="ddi-risk-assessment-public-url"
STATE_DIR="${HOME}/.ddi-risk-assessment"
LOG_FILE="${STATE_DIR}/public-url.log"

systemctl --user --no-pager --full status "${UNIT_NAME}.service" | sed -n '1,16p'

if [[ -f "$LOG_FILE" ]]; then
  PUBLIC_URL="$(grep -Eo 'https://[^[:space:]]+\.trycloudflare\.com' "$LOG_FILE" | head -n 1 || true)"
  if [[ -n "${PUBLIC_URL:-}" ]]; then
    echo "URL: ${PUBLIC_URL}"
  fi
fi
