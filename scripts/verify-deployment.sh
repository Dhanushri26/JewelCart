#!/usr/bin/env bash
set -euo pipefail

HEALTH_URL="${HEALTH_URL:-https://k5piu4f4k3.execute-api.ap-southeast-1.amazonaws.com/health}"

response_code=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)
if [[ "$response_code" != "200" ]]; then
  echo "Deployment verification failed: expected HTTP 200 from $HEALTH_URL but received $response_code"
  exit 1
fi

echo "Deployment verification succeeded with HTTP $response_code"
