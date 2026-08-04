output "id" {
  description = "HTTP API identifier."
  value       = aws_apigatewayv2_api.this.id
}

output "invoke_url" {
  description = "Default HTTP API invoke URL."
  value       = aws_apigatewayv2_api.this.api_endpoint
}
