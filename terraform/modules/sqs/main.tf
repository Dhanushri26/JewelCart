resource "aws_sqs_queue" "this" {
  for_each                   = var.queues
  name                       = each.key
  visibility_timeout_seconds = try(each.value.visibility_timeout_seconds, 30)
  delay_seconds              = try(each.value.delay_seconds, 0)
  max_message_size           = try(each.value.max_message_size, null)
  kms_master_key_id          = try(each.value.kms_master_key_id, null)
  redrive_policy             = try(each.value.redrive_policy, null)
  policy                     = try(each.value.policy, null)
  tags                       = var.tags
}
