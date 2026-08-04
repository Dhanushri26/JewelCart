data "aws_lambda_function" "existing" {
  for_each      = var.functions
  function_name = each.key
}

resource "aws_lambda_function" "this" {
  for_each      = var.functions
  function_name = each.key
  role          = data.aws_lambda_function.existing[each.key].role
  runtime       = data.aws_lambda_function.existing[each.key].runtime
  handler       = data.aws_lambda_function.existing[each.key].handler
  # A code argument is required by the provider even for import-only resources.
  # The lifecycle rule below means this placeholder is never deployed or compared.
  filename      = try(each.value.filename, "${path.module}/import-placeholder.zip")
  memory_size   = data.aws_lambda_function.existing[each.key].memory_size
  timeout       = data.aws_lambda_function.existing[each.key].timeout
  layers        = data.aws_lambda_function.existing[each.key].layers
  architectures = data.aws_lambda_function.existing[each.key].architectures
  tags          = var.tags

  # Preserve the current AWS configuration while it is being brought under IaC.
  dynamic "environment" {
    for_each = try(data.aws_lambda_function.existing[each.key].environment, [])
    content {
      variables = environment.value.variables
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash, s3_bucket, s3_key]
  }
}
