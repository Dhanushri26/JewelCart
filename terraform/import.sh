#!/usr/bin/env bash
# Imports resources with stable, known identifiers. Run from terraform/ after SSO login.
# First populate terraform.tfvars, then run: bash import.sh
set -euo pipefail

terraform import 'module.lambda.aws_lambda_function.this["JewelCart-cart"]' JewelCart-cart
terraform import 'module.lambda.aws_lambda_function.this["JewelCart-products"]' JewelCart-products
terraform import 'module.lambda.aws_lambda_function.this["JewelCart-inventory"]' JewelCart-inventory
terraform import 'module.lambda.aws_lambda_function.this["JewelCart-payment"]' JewelCart-payment
terraform import 'module.lambda.aws_lambda_function.this["JewelCart-order"]' JewelCart-order
terraform import 'module.lambda.aws_lambda_function.this["jewelcart-notification"]' jewelcart-notification

terraform import 'module.dynamodb.aws_dynamodb_table.this["jewelcart-cart"]' jewelcart-cart
terraform import 'module.dynamodb.aws_dynamodb_table.this["jewelcart-inventory"]' jewelcart-inventory
terraform import 'module.dynamodb.aws_dynamodb_table.this["jewelcart-orders"]' jewelcart-orders
terraform import 'module.dynamodb.aws_dynamodb_table.this["jewelcart-payments"]' jewelcart-payments
terraform import 'module.dynamodb.aws_dynamodb_table.this["jewelcart-products"]' jewelcart-products
terraform import 'module.dynamodb.aws_dynamodb_table.this["jewelcart-users"]' jewelcart-users

terraform import 'module.sqs.aws_sqs_queue.this["jewelcart-order-queue"]' jewelcart-order-queue
terraform import 'module.sns.aws_sns_topic.this["jewelcart-payment-topic"]' jewelcart-payment-topic
terraform import 'module.s3.aws_s3_bucket.this["jewelcart-frontend-dhanu"]' jewelcart-frontend-dhanu
terraform import 'module.s3.aws_s3_bucket.this["jewelcart-invoices-dhanu26"]' jewelcart-invoices-dhanu26
terraform import 'module.s3.aws_s3_bucket_versioning.this["jewelcart-frontend-dhanu"]' jewelcart-frontend-dhanu
terraform import 'module.s3.aws_s3_bucket_versioning.this["jewelcart-invoices-dhanu26"]' jewelcart-invoices-dhanu26

# API Gateway HTTP API imports use its ID, not its display name. Resolve it through the
# authenticated Academy SSO profile so no account ID or credentials are stored.
API_ID="$(aws apigatewayv2 get-apis --region ap-southeast-1 --profile Academy --query 'Items[?Name==`JewelCart-v1-api`].ApiId | [0]' --output text)"
if [[ -z "$API_ID" || "$API_ID" == "None" ]]; then
  echo "Could not find HTTP API JewelCart-v1-api." >&2
  exit 1
fi
terraform import module.apigateway.aws_apigatewayv2_api.this "$API_ID"

# Import dependent resources after discovering their IDs in AWS. Examples:
# terraform import 'module.apigateway.aws_api_gateway_resource.this["products"]' REST_API_ID/RESOURCE_ID
# terraform import 'module.apigateway.aws_api_gateway_method.this["get_products"]' REST_API_ID/RESOURCE_ID/GET
# terraform import 'module.s3.aws_s3_bucket_versioning.this["jewelcart-frontend-dhanu"]' jewelcart-frontend-dhanu
# terraform import 'module.s3.aws_s3_bucket_public_access_block.this["jewelcart-frontend-dhanu"]' jewelcart-frontend-dhanu
# terraform import 'module.sns.aws_sns_topic_subscription.this["KEY"]' SUBSCRIPTION_ARN
