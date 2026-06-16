#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_NAME="ddi-risk-assessment-web"

systemctl --user stop "${UNIT_NAME}.service" >/dev/null 2>&1 || true
systemctl --user reset-failed "${UNIT_NAME}.service" >/dev/null 2>&1 || true

systemd-run \
  --user \
  --unit="$UNIT_NAME" \
  --description="DDI Risk Assessment Website" \
  --collect \
  --property=WorkingDirectory="$ROOT_DIR" \
  /bin/bash -lc './deploy/run-prod.sh'

sleep 3

echo "DDI Risk Assessment website started"
echo "URL: http://$(hostname -I | awk '{print $1}'):3002"
systemctl --user --no-pager --full status "${UNIT_NAME}.service" | sed -n '1,16p'
