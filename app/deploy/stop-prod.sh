#!/usr/bin/env bash

set -euo pipefail

UNIT_NAME="ddi-risk-assessment-web"

systemctl --user stop "${UNIT_NAME}.service" >/dev/null 2>&1 || true
systemctl --user reset-failed "${UNIT_NAME}.service" >/dev/null 2>&1 || true

echo "Stopped ${UNIT_NAME}.service"
