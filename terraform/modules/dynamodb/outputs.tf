output "arns" {
  value = { for key, table in aws_dynamodb_table.this : key => table.arn }
}
