resource "aws_dynamodb_table" "this" {
  for_each     = var.tables
  name         = each.key
  billing_mode = try(each.value.billing_mode, "PAY_PER_REQUEST")
  hash_key     = try(each.value.hash_key, null)
  range_key    = try(each.value.range_key, null)
  tags         = var.tags

  dynamic "attribute" {
    for_each = try(each.value.attributes, [])
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }
}
