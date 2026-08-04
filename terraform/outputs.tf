output "lambda_arns" {
  description = "Lambda function ARNs keyed by function name."
  value       = module.lambda.arns
}

output "api_gateway_id" {
  description = "REST API identifier."
  value       = module.apigateway.id
}

output "api_invoke_url" {
  description = "HTTP API invoke URL."
  value       = module.apigateway.invoke_url
}

output "queue_urls" {
  description = "SQS queue URLs."
  value       = module.sqs.urls
}

output "queue_arns" {
  description = "SQS queue ARNs."
  value       = module.sqs.arns
}

output "sns_arns" {
  description = "SNS topic ARNs."
  value       = module.sns.arns
}

output "bucket_arns" {
  description = "S3 bucket ARNs."
  value       = module.s3.arns
}

output "table_arns" {
  description = "DynamoDB table ARNs."
  value       = module.dynamodb.arns
}
