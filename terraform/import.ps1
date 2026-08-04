# Import known JewelCart resources from PowerShell after `aws sso login --profile Academy`.
$ErrorActionPreference = "Stop"

function Import-TerraformResource {
  param(
    [Parameter(Mandatory = $true)][string]$Address,
    [Parameter(Mandatory = $true)][string]$Identifier
  )

  # Windows PowerShell otherwise removes the quotes from for_each addresses.
  $windowsAddress = $Address.Replace('"', '\"')

  # A resumable importer avoids failing when earlier resources are already in state.
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & terraform state show $windowsAddress 2>$null | Out-Null
  $stateShowExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  if ($stateShowExitCode -eq 0) {
    Write-Host "Already imported: $Address"
    return
  }

  & terraform import $windowsAddress $Identifier
  if ($LASTEXITCODE -ne 0) {
    throw "Terraform import failed for $Address."
  }
}

$lambdaFunctions = @(
  "JewelCart-cart",
  "JewelCart-products",
  "JewelCart-inventory",
  "JewelCart-payment",
  "JewelCart-order",
  "jewelcart-notification"
)
foreach ($name in $lambdaFunctions) {
  Import-TerraformResource "module.lambda.aws_lambda_function.this[`"$name`"]" $name
}

$tables = @(
  "jewelcart-cart",
  "jewelcart-inventory",
  "jewelcart-orders",
  "jewelcart-payments",
  "jewelcart-products",
  "jewelcart-users"
)
foreach ($name in $tables) {
  Import-TerraformResource "module.dynamodb.aws_dynamodb_table.this[`"$name`"]" $name
}

$queueUrl = aws sqs get-queue-url --queue-name jewelcart-order-queue --region ap-southeast-1 --profile Academy --query QueueUrl --output text
if ([string]::IsNullOrWhiteSpace($queueUrl) -or $queueUrl -eq "None") {
  throw "Could not find SQS queue jewelcart-order-queue."
}
Import-TerraformResource 'module.sqs.aws_sqs_queue.this["jewelcart-order-queue"]' $queueUrl

$accountId = aws sts get-caller-identity --profile Academy --query Account --output text
if ([string]::IsNullOrWhiteSpace($accountId) -or $accountId -eq "None") {
  throw "Could not determine the current AWS account ID."
}
$topicArn = "arn:aws:sns:ap-southeast-1:${accountId}:jewelcart-payment-topic"
Import-TerraformResource 'module.sns.aws_sns_topic.this["jewelcart-payment-topic"]' $topicArn
Import-TerraformResource 'module.s3.aws_s3_bucket.this["jewelcart-frontend-dhanu"]' 'jewelcart-frontend-dhanu'
Import-TerraformResource 'module.s3.aws_s3_bucket.this["jewelcart-invoices-dhanu26"]' 'jewelcart-invoices-dhanu26'
Import-TerraformResource 'module.s3.aws_s3_bucket_versioning.this["jewelcart-frontend-dhanu"]' 'jewelcart-frontend-dhanu'
Import-TerraformResource 'module.s3.aws_s3_bucket_versioning.this["jewelcart-invoices-dhanu26"]' 'jewelcart-invoices-dhanu26'

$apiId = aws apigatewayv2 get-apis --region ap-southeast-1 --profile Academy --query 'Items[?Name==`JewelCart-v1-api`].ApiId | [0]' --output text
if ([string]::IsNullOrWhiteSpace($apiId) -or $apiId -eq "None") {
  throw "Could not find HTTP API JewelCart-v1-api."
}
Import-TerraformResource 'module.apigateway.aws_apigatewayv2_api.this' $apiId
