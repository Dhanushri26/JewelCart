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

  dynamic "global_secondary_index" {
    for_each = try(each.value.global_secondary_indexes, [])
    content {
      name               = global_secondary_index.value.name
      hash_key           = global_secondary_index.value.hash_key
      range_key          = try(global_secondary_index.value.range_key, null)
      projection_type    = global_secondary_index.value.projection_type
      non_key_attributes = try(global_secondary_index.value.non_key_attributes, null)
      read_capacity      = try(global_secondary_index.value.read_capacity, null)
      write_capacity     = try(global_secondary_index.value.write_capacity, null)
    }
  }

  dynamic "local_secondary_index" {
    for_each = try(each.value.local_secondary_indexes, [])
    content {
      name               = local_secondary_index.value.name
      range_key          = local_secondary_index.value.range_key
      projection_type    = local_secondary_index.value.projection_type
      non_key_attributes = try(local_secondary_index.value.non_key_attributes, null)
    }
  }
}
