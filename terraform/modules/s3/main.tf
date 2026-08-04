resource "aws_s3_bucket" "this" {
  for_each = var.buckets
  bucket   = each.key
  tags     = var.tags
}

resource "aws_s3_bucket_versioning" "this" {
  for_each = var.buckets
  bucket   = aws_s3_bucket.this[each.key].id

  versioning_configuration {
    status = try(each.value.versioning_status, "Suspended")
  }
}
