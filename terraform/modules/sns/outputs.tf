output "arns" { value = { for key, topic in aws_sns_topic.this : key => topic.arn } }
