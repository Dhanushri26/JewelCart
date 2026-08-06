#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/lambda-packages"
mkdir -p "$OUTPUT_DIR"

declare -A SERVICE_TO_FUNCTION=(
  [cart-service]="JewelCart-cart"
  [product-service]="JewelCart-products"
  [inventory-service]="JewelCart-inventory"
  [payment-service]="JewelCart-payment"
  [order-service]="JewelCart-order"
)

SERVICES=(cart-service product-service inventory-service payment-service order-service)

for service in "${SERVICES[@]}"; do
  SERVICE_DIR="$ROOT_DIR/backend/$service"
  FUNCTION_NAME="${SERVICE_TO_FUNCTION[$service]:-}" 
  if [[ ! -d "$SERVICE_DIR" ]]; then
    echo "Skipping missing service directory: $SERVICE_DIR"
    continue
  fi

  if [[ -f "$SERVICE_DIR/package.json" ]]; then
    echo "Packaging $service as $FUNCTION_NAME"
    (
      cd "$SERVICE_DIR"
      npm prune --omit=dev || true
      zip -r "$OUTPUT_DIR/${FUNCTION_NAME}.zip" . -x "*.git*" "node_modules/.cache/*"
    ) &
  fi
done

wait

mkdir -p "$ROOT_DIR/coverage-reports"
mkdir -p "$ROOT_DIR/security-reports"

if [[ -d "$ROOT_DIR/frontend/coverage" ]]; then
  cp -R "$ROOT_DIR/frontend/coverage" "$ROOT_DIR/coverage-reports/"
fi

for report in "$ROOT_DIR"/snyk-opensource.sarif "$ROOT_DIR"/snyk-code.sarif "$ROOT_DIR"/trivy-results.sarif; do
  if [[ -f "$report" ]]; then
    cp "$report" "$ROOT_DIR/security-reports/"
  fi
done
