#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="${HOME}/apps/ddi-risk-assessment"
CURRENT_DIR="${APP_ROOT}/current"
UNIT_NAME="ddi-risk-assessment-web"
UNIT_DIR="${XDG_CONFIG_HOME:-${HOME}/.config}/systemd/user"
UNIT_FILE="${UNIT_DIR}/${UNIT_NAME}.service"
RELEASE_UNIT_FILE="${CURRENT_DIR}/deploy/${UNIT_NAME}.service"

if [[ ! -f "${CURRENT_DIR}/dist/index.html" ]]; then
  echo "Missing dist/index.html under ${CURRENT_DIR}" >&2
  exit 1
fi

if [[ ! -f "${RELEASE_UNIT_FILE}" ]]; then
  echo "Missing service unit: ${RELEASE_UNIT_FILE}" >&2
  exit 1
fi

mkdir -p "${UNIT_DIR}"
install -m 0644 "${RELEASE_UNIT_FILE}" "${UNIT_FILE}"
systemctl --user stop "${UNIT_NAME}.service" >/dev/null 2>&1 || true
systemctl --user reset-failed "${UNIT_NAME}.service" >/dev/null 2>&1 || true
systemctl --user daemon-reload
systemctl --user enable "${UNIT_NAME}.service" >/dev/null
systemctl --user start "${UNIT_NAME}.service"

sleep 3

echo "DDI Risk Assessment website started"
echo "URL: http://$(hostname -I | awk '{print $1}'):3002"
systemctl --user --no-pager --full status "${UNIT_NAME}.service" | sed -n '1,16p'
