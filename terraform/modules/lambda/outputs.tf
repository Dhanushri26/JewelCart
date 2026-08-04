output "arns" {
  value = { for key, function in aws_lambda_function.this : key => function.arn }
}
