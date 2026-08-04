output "arns" { value = { for key, queue in aws_sqs_queue.this : key => queue.arn } }
output "urls" { value = { for key, queue in aws_sqs_queue.this : key => queue.url } }
