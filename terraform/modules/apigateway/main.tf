# JewelCart uses API Gateway HTTP API (v2), not the REST API (v1) service.
resource "aws_apigatewayv2_api" "this" {
  name                         = var.api.name
  protocol_type                = "HTTP"
  description                  = try(var.api.description, null)
  disable_execute_api_endpoint = try(var.api.disable_execute_api_endpoint, false)
  tags                         = var.tags

  dynamic "cors_configuration" {
    for_each = try(var.api.cors, null) == null ? [] : [var.api.cors]
    content {
      allow_credentials = try(cors_configuration.value.allow_credentials, false)
      allow_headers     = try(cors_configuration.value.allow_headers, [])
      allow_methods     = try(cors_configuration.value.allow_methods, [])
      allow_origins     = try(cors_configuration.value.allow_origins, [])
      expose_headers    = try(cors_configuration.value.expose_headers, [])
      max_age           = try(cors_configuration.value.max_age, null)
    }
  }
}
