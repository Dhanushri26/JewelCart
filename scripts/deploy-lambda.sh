#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/lambda-packages"

FUNCTIONS=(
  "JewelCart-cart"
  "JewelCart-products"
  "JewelCart-inventory"
  "JewelCart-payment"
  "JewelCart-order"
  "jewelcart-notification"
)

for function_name in "${FUNCTIONS[@]}"; do
  package_path="$PACKAGE_DIR/${function_name}.zip"
  if [[ ! -f "$package_path" ]]; then
    echo "Package not found for $function_name: $package_path"
    continue
  fi

  echo "Deploying $function_name"
  for attempt in 1 2 3; do
    if aws lambda update-function-code \
      --function-name "$function_name" \
      --zip-file "fileb://$package_path" \
      --region "$AWS_REGION" > /tmp/${function_name}.json 2>/tmp/${function_name}.err; then
      echo "Deployment succeeded for $function_name"
      break
    fi

    echo "Attempt $attempt failed for $function_name"
    cat /tmp/${function_name}.err || true
    if [[ "$attempt" -eq 3 ]]; then
      exit 1
    fi
    sleep 10
  done

done
