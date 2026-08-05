#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIST="$ROOT_DIR/frontend/dist"

if [ ! -d "$FRONTEND_DIST" ]; then
  echo "Frontend build output not found at $FRONTEND_DIST"
  exit 1
fi

for attempt in 1 2 3; do
  if aws s3 sync "$FRONTEND_DIST" "s3://$S3_BUCKET" --delete --region "$AWS_REGION"; then
    break
  fi

  echo "Frontend sync attempt $attempt failed"
  if [ "$attempt" -eq 3 ]; then
    exit 1
  fi
  sleep 10
done

if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
  for attempt in 1 2 3; do
    if aws cloudfront create-invalidation \
      --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
      --paths "/*" \
      --region "$AWS_REGION" >/dev/null; then
      break
    fi

    echo "CloudFront invalidation attempt $attempt failed"
    if [ "$attempt" -eq 3 ]; then
      exit 1
    fi
    sleep 10
  done
fi
