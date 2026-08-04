output "arns" { value = { for key, bucket in aws_s3_bucket.this : key => bucket.arn } }
