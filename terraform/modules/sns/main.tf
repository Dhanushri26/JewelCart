resource "aws_sns_topic" "this" {
  for_each          = var.topics
  name              = each.key
  kms_master_key_id = try(each.value.kms_master_key_id, null)
  policy            = try(each.value.policy, null)
  tags              = var.tags
}
