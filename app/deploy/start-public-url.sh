#!/usr/bin/env bash

set -euo pipefail

UNIT_NAME="ddi-risk-assessment-public-url"
STATE_DIR="${HOME}/.ddi-risk-assessment"
LOG_FILE="${STATE_DIR}/public-url.log"
PORT="${PORT:-3002}"
ORIGIN_URL="${ORIGIN_URL:-http://127.0.0.1:${PORT}}"

if [[ -n "${CLOUDFLARED_BIN:-}" ]]; then
  BIN_PATH="$CLOUDFLARED_BIN"
elif command -v cloudflared >/dev/null 2>&1; then
  BIN_PATH="$(command -v cloudflared)"
elif [[ -x "${HOME}/.local/bin/cloudflared" ]]; then
  BIN_PATH="${HOME}/.local/bin/cloudflared"
else
  echo "cloudflared is not installed. Run ./deploy/install-cloudflared.sh first." >&2
  exit 1
fi

mkdir -p "$STATE_DIR"

systemctl --user stop "${UNIT_NAME}.service" >/dev/null 2>&1 || true
systemctl --user reset-failed "${UNIT_NAME}.service" >/dev/null 2>&1 || true
rm -f "$LOG_FILE"

systemd-run \
  --user \
  --unit="$UNIT_NAME" \
  --description="DDI Risk Assessment Public URL" \
  --collect \
  /bin/bash -lc "exec '${BIN_PATH}' tunnel --url '${ORIGIN_URL}' --no-autoupdate > '${LOG_FILE}' 2>&1"

extract_public_url() {
  grep -Eo 'https://[^[:space:]]+\.trycloudflare\.com' "$LOG_FILE" | head -n 1 || true
}

for _ in $(seq 1 30); do
  if [[ -f "$LOG_FILE" ]]; then
    PUBLIC_URL="$(extract_public_url)"
    if [[ -n "${PUBLIC_URL:-}" ]]; then
      echo "DDI public URL started"
      echo "URL: ${PUBLIC_URL}"
      exit 0
    fi
  fi
  sleep 1
done

echo "Failed to obtain a public URL from cloudflared" >&2
if [[ -f "$LOG_FILE" ]]; then
  tail -n 40 "$LOG_FILE" >&2
fi
exit 1
